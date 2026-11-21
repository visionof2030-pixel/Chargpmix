"""Builds src/data.json for the Lodi video.

For each scene's audio file it finds the speech segments (skipping pauses), spreads the
script's words over the speech time in proportion to their length, groups the words into
subtitle chunks, and computes a per-frame loudness envelope for lip-sync.
Run:  python3 prep.py
"""
import json, os, re, subprocess
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
SR = 16000
FPS = 30

SCENES = [
    ('s1', 'أنا.. أنا لودي. أيوه، أنا هلالي. مفروض إني هلالي، ومفروض إني واثق من فريقي ومن بطولاتي وما يهمني أحد.. هذا الكلام النظري. بس الحقيقة؟ الحقيقة إني ما أقدر أنام الليل إذا النصر عنده مباراة! يضيق صدري، وتجيني رجفة في ركبي، وأحس إن الدنيا كلها بتنتهي لو فازوا.'),
    ('s2', 'فـ إيش أسوي؟ أروح الدولاب.. أدفن طقم الهلال في آخر رف، وأطلع طقم الفريق اللي بيلاعب النصر اليوم!'),
    ('s3', 'اليوم مثلاً، النصر يلعب ضد الأهلي. شوفوني.. لابس طقم الأهلي، الشورت والشراب والتيشيرت! ليه؟ مو حباً في الأهلي، والله العظيم إني ما أعرف نص لعيبتهم!'),
    ('s4', 'شغّلت السيارة.. دفعت ثمانين ريال على التذكرة.. ما ترددت ولا ثانية. سبعين كيلو من البيت للملعب.. كل هذا عشان النصر ما يفوز. مو عشان أشجع الأهلي. مو عشان أحب الأهلي. بس عشان أكون هناك.. ضد النصر.'),
    ('s5', 'أجلس بينهم.. أحاول أشجع.. ما أعرف أشجع إيش بالضبط.'),
    ('s6', 'ما عندي تفسير لما أسويه.. بس كل ما اقترب موعد مباراة النصر.. أحس إني لازم أكون هناك.. ضدهم. هذا أنا. لودي.'),
]
TAIL = 0.9  # silent hold after each line, also covers the transition overlap


def load(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ar', str(SR), '-ac', '1', '-f', 'f32le', '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)


def speech_segments(x):
    hop = SR // 100
    win = SR // 40
    n = max(1, (len(x) - win) // hop)
    db = np.array([20 * np.log10(np.sqrt(np.mean(x[i * hop:i * hop + win] ** 2)) + 1e-9) for i in range(n)])
    thr = max(-42.0, np.percentile(db, 95) - 30)
    on = db > thr
    segs, i = [], 0
    while i < n:
        if on[i]:
            j = i
            while j < n:
                if not on[j]:
                    k = j
                    while k < n and not on[k]:
                        k += 1
                    if k - j >= 22 or k >= n:  # pause >= 0.22 s ends a segment
                        break
                    j = k
                else:
                    j += 1
            if j - i >= 8:
                segs.append((i / 100, j / 100))
            i = j
        else:
            i += 1
    return segs


def weight(w):
    core = re.sub(r'[^؀-ۿ0-9A-Za-z]', '', w)
    return max(1, len(core)) + (3 if re.search(r'(\.\.|[.؟?!،,])$', w) else 0)


data = []
for sid, text in SCENES:
    x = load(os.path.join(HERE, 'public', 'audio', sid + '.mp3'))
    dur = len(x) / SR
    segs = speech_segments(x)
    words = text.split()
    wts = np.array([weight(w) for w in words], float)
    total_speech = sum(e - s for s, e in segs)
    # word boundaries in "speech time", then mapped back to real time across the segments
    cum = np.concatenate([[0], np.cumsum(wts)]) / wts.sum() * total_speech

    def to_real(st):
        acc = 0.0
        for s, e in segs:
            if st <= acc + (e - s) + 1e-9:
                return s + (st - acc)
            acc += e - s
        return segs[-1][1]

    W = [{'w': w, 's': round(to_real(cum[i]) + 0.02, 3), 'e': round(to_real(cum[i + 1]) - 0.02, 3)} for i, w in enumerate(words)]
    # subtitle chunks: break at strong punctuation or after ~6 words
    chunks, cur = [], []
    for i, w in enumerate(words):
        cur.append(i)
        strong = re.search(r'(\.\.|[.؟?!])$', w)
        if strong or len(cur) >= 6 or (re.search(r'[،,]$', w) and len(cur) >= 3):
            chunks.append(cur)
            cur = []
    if cur:
        chunks.append(cur)
    C = [{'a': c[0], 'b': c[-1], 's': W[c[0]]['s'] - 0.05, 'e': W[c[-1]]['e'] + 0.25} for c in chunks]
    for k in range(len(C) - 1):
        C[k]['e'] = min(C[k]['e'], C[k + 1]['s'])
    # lip-sync envelope at 30 fps
    hop = SR // FPS
    n = int(len(x) / hop) + 1
    r = np.array([np.sqrt(np.mean(x[i * hop:(i + 1) * hop] ** 2)) if len(x[i * hop:(i + 1) * hop]) else 0 for i in range(n)])
    env = np.clip(r / (np.percentile(r, 92) + 1e-9), 0, 1)
    env = np.convolve(env, [.25, .5, .25], 'same')
    data.append({'id': sid, 'audio': f'audio/{sid}.mp3', 'audioDur': round(dur, 3), 'dur': round(dur + (2.4 if sid == 's6' else TAIL), 3),
                 'segs': [[round(s, 2), round(e, 2)] for s, e in segs], 'words': W,
                 'chunks': [{'s': round(c['s'], 3), 'e': round(c['e'], 3), 'a': c['a'], 'b': c['b']} for c in C],
                 'env': [round(float(v), 3) for v in env]})
    print(sid, f'{dur:5.2f}s', 'segments', len(segs), 'speech', round(total_speech, 2), 'words', len(words), 'chunks', len(C))

json.dump({'fps': FPS, 'scenes': data}, open(os.path.join(HERE, 'src', 'data.json'), 'w'), ensure_ascii=False)
