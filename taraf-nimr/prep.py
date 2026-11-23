"""Audio + timeline for «البسة اللي مو بسة!».

Reads public/voices/<ID>.m4a (one file per line), trims silence, lays the lines out per scene with
room for the action beats, synthesises music + SFX, and writes:
  public/audio.wav      the final mix
  src/timeline.json     scene durations, line times, text, mouth envelopes, action beats
Missing line files are skipped automatically (their beat stays as a silent moment).
Run: python3 prep.py
"""
import json, os, subprocess, wave
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
VO = os.path.join(HERE, 'public', 'voices')
SR = 44100
FPS = 30

TEXT = {
    'L1': 'شوفوا! بسة! بسة صغيرة!', 'F1': 'وش هالبسة؟ نقطها غريبة!', 'T1': 'تعالي يا بسبوسة.. تعالي..',
    'M1': 'ههههه! تحسب نفسها أسد!', 'S1': 'خلونا نمسكها! أنا أبيها لي!', 'T2': 'الباب مفتوح! طلعت برّا!', 'F2': 'لحقوها!!',
    'M2': 'يا جماعة.. بعدنا عن البيت كثير..', 'S2': 'بس شوي! شوفوها هناك! دخلت بين الصخور!', 'L2': 'أنا تعبت.. وبردانة..',
    'F3': 'لحظة.. هذي آثار رجول؟ ليش كبيرة كذا؟!', 'T3': 'يمكن.. بسة سمينة؟',
    'M3': 'هذي.. مو بسة..', 'S3': 'هذا.. نمر صغير!', 'L3': 'ماما...', 'T4': 'اركضوووووا!!',
    'F4': 'بسرعة! لا تطالعون وراكم!', 'L4': 'آآآه! رجلي!', 'S4': 'قومي يا لين! أنا معك!', 'M4': 'طريق مسدود! ما في مكان!',
    'T5': 'لا تتحركون.. ولا حركة..',
    'J1': 'ابعدي!!', 'J2': 'لا تخافون.. ما رميت عليها، بس خوّفتها.', 'T6': 'جسار؟! وش تسوي هنا؟!',
    'J3': 'كنت أصيد في الوادي.. وسمعت صراخكم من بعيد!', 'F5': 'جيت في الوقت المناسب يا بطل!',
    'L5': 'بِســـة!!', 'ALL': 'لاااااااا!!',
}

# each scene: list of items. ('line', ID) or ('beat', name, seconds)
SCENES = [
    ('title', [('beat', 'title', 3.2)]),
    ('yard', [('beat', 'intro', 1.8), ('line', 'L1'), ('line', 'F1'), ('line', 'T1'), ('beat', 'hiss', 1.2),
              ('line', 'M1'), ('line', 'S1'), ('beat', 'chase', 5.2), ('line', 'T2'), ('line', 'F2'), ('beat', 'exit', 1.4)]),
    ('path', [('beat', 'intro', 1.8), ('line', 'M2'), ('line', 'S2'), ('line', 'L2'), ('beat', 'print', 1.4),
              ('line', 'F3'), ('line', 'T3'), ('beat', 'tail', 1.0)]),
    ('cave', [('beat', 'enter', 2.0), ('beat', 'eyes', 1.6), ('line', 'M3'), ('line', 'S3'), ('line', 'L3'),
              ('beat', 'emerge', 2.4), ('beat', 'roar', 1.7), ('line', 'T4'), ('beat', 'tail', 0.4)]),
    ('chase', [('beat', 'run', 1.2), ('line', 'F4'), ('beat', 'run2', 0.6), ('line', 'L4'), ('line', 'S4'),
               ('beat', 'run3', 1.4), ('line', 'M4'), ('line', 'T5'), ('beat', 'crouch', 2.6)]),
    ('jassar', [('beat', 'bang', 0.25), ('line', 'J1'), ('beat', 'flee', 1.6), ('line', 'J2'), ('line', 'T6'),
                ('line', 'J3'), ('line', 'F5'), ('beat', 'hug', 1.3)]),
    ('home', [('beat', 'walk', 2.6), ('beat', 'meow', 0.9), ('line', 'L5'), ('line', 'ALL'), ('beat', 'flee', 1.4),
              ('beat', 'card', 4.6)]),
]
GAP = 0.28


def load(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ar', str(SR), '-ac', '1', '-f', 'f32le', '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)


voices, env = {}, {}
for k in TEXT:
    p = os.path.join(VO, k + '.m4a')
    if not os.path.exists(p):
        continue
    x = load(p)
    a = np.convolve(np.abs(x), np.ones(441) / 441, 'same')
    idx = np.where(a > max(0.02 * a.max(), 1e-4))[0]
    x = x[max(0, idx[0] - int(.04 * SR)): min(len(x), idx[-1] + int(.08 * SR))]
    x *= 0.13 / (np.sqrt(np.mean(x ** 2)) + 1e-9)
    x = np.clip(x, -0.95, 0.95)
    voices[k] = x
    hop = SR // FPS
    n = len(x) // hop + 1
    r = np.array([np.sqrt(np.mean(x[i * hop:(i + 1) * hop] ** 2)) if len(x[i * hop:(i + 1) * hop]) else 0 for i in range(n)])
    e = np.clip(r / (np.percentile(r, 90) + 1e-9), 0, 1)
    env[k] = [round(float(v), 3) for v in np.convolve(e, [.25, .5, .25], 'same')]

scenes, t0 = [], 0.0
for name, items in SCENES:
    t, lines, beats = 0.0, {}, {}
    for it in items:
        if it[0] == 'beat':
            beats[it[1]] = [round(t, 3), round(t + it[2], 3)]
            t += it[2]
        else:
            k = it[1]
            if k not in voices:
                continue
            d = len(voices[k]) / SR
            lines[k] = [round(t, 3), round(t + d, 3)]
            t += d + GAP
    scenes.append({'name': name, 'start': round(t0, 3), 'dur': round(t, 3), 'lines': lines, 'beats': beats})
    t0 += t
total = t0
json.dump({'fps': FPS, 'total': round(total, 3), 'scenes': scenes, 'text': TEXT, 'env': env},
          open(os.path.join(HERE, 'src', 'timeline.json'), 'w'), ensure_ascii=False)

# ------------------------------------------------------------------ mix
N = int(total * SR) + SR
voice, music, sfx = np.zeros(N), np.zeros(N), np.zeros(N)
rng = np.random.default_rng(7)


def add(buf, sig, at, vol=1.0):
    i = int(at * SR)
    j = min(N, i + len(sig))
    if 0 <= i < N and j > i:
        buf[i:j] += sig[:j - i] * vol


def tt(d):
    return np.arange(int(d * SR)) / SR


def noise(d, lp=30):
    return np.convolve(rng.standard_normal(int(d * SR)), np.ones(lp) / lp, 'same')


def tone(f, d, decay=5.0, harm=True):
    x = tt(d)
    w = np.sin(2 * np.pi * f * x) + (.35 * np.sin(4 * np.pi * f * x) + .12 * np.sin(6 * np.pi * f * x) if harm else 0)
    return w * np.minimum(1, x * 120) * np.exp(-x * decay)


S = {s['name']: s for s in scenes}
for s in scenes:
    for k, (a, b) in s['lines'].items():
        add(voice, voices[k], s['start'] + a)

# --- music: playful pluck for title/yard/home, dark drone for the mountain
beat = 60 / 128
chords = [(261.63, 329.63, 392.0), (220.0, 261.63, 329.63), (174.61, 220.0, 261.63), (196.0, 246.94, 293.66)]
pent = [523.25, 587.33, 659.25, 783.99, 880.0]
for nm in ('title', 'yard'):
    s = S[nm]
    for b in range(int(s['dur'] / (beat * 4)) + 1):
        t0 = s['start'] + b * beat * 4
        ch = chords[b % 4]
        add(music, tone(ch[0] / 2, beat * 1.8, 2.5), t0, .32)
        for e in range(8):
            add(music, tone(ch[e % 3], beat * .6), t0 + e * beat / 2, .11)
        for e in range(4):
            if rng.random() < .7:
                add(music, tone(pent[rng.integers(0, 5)], beat * .8), t0 + e * beat, .12)
# dark drone + rising tension from the path to the chase
a0 = S['path']['start']
a1 = S['jassar']['start']
x = tt(a1 - a0)
drone = (np.sin(2 * np.pi * 55 * x) + .6 * np.sin(2 * np.pi * 82.4 * x + np.sin(x * .7)) + .3 * np.sin(2 * np.pi * 110 * x * (1 + .002 * np.sin(x)))) * .25
ramp = np.clip(x / 4, 0, 1) * (0.6 + 0.4 * np.clip((x - (S['cave']['start'] - a0)) / 3, 0, 1))
add(music, drone * ramp, a0, .9)
# heartbeat in the cave (after the eyes) and the whole chase
hb0 = S['cave']['start'] + S['cave']['beats']['eyes'][0]
hb1 = S['chase']['start'] + S['chase']['dur']
k, tb = 0, hb0
while tb < hb1:
    th = tt(.16)
    thump = np.sin(2 * np.pi * 58 * th) * np.exp(-th * 22)
    add(sfx, thump, tb, .9)
    add(sfx, thump * .7, tb + .2, .9)
    prog = (tb - hb0) / (hb1 - hb0)
    tb += 0.85 - 0.4 * prog
# wind on the path
add(sfx, noise(S['path']['dur'], 200) * 6 * (0.6 + 0.4 * np.sin(tt(S['path']['dur']) * 1.3)), S['path']['start'], .25)
# hiss of the cub
h = S['yard']['beats']['hiss']
d = .7
add(sfx, noise(d, 3) * np.sin(np.pi * tt(d) / d) ** .5, S['yard']['start'] + h[0] + .1, .35)
# running feet during the yard chase and the mountain chase
for nm, key in (('yard', 'chase'), ('chase', None)):
    s = S[nm]
    a, b = (s['beats'][key] if key else [0, s['dur'] - s['beats']['crouch'][1] + s['beats']['crouch'][0]])
    for tb in np.arange(a, b, .13):
        th = tt(.07)
        add(sfx, noise(.07, 12) * np.exp(-th * 50) * 3, s['start'] + tb + rng.random() * .03, .18)
# barrel falls
add(sfx, np.sin(2 * np.pi * 140 * tt(.5)) * np.exp(-tt(.5) * 8) + noise(.5, 8) * np.exp(-tt(.5) * 10) * 2, S['yard']['start'] + S['yard']['beats']['chase'][0] + 3.3, .5)


def roar(d=1.6, f=70):
    x = tt(d)
    env_ = np.minimum(1, x * 6) * np.exp(-np.maximum(0, x - d * .55) * 4)
    mod = 1 + .6 * np.sin(2 * np.pi * 23 * x) * (0.5 + 0.5 * np.sin(2 * np.pi * 3 * x))
    body = np.sin(2 * np.pi * f * x + 3 * np.sin(2 * np.pi * 9 * x)) + .5 * np.sin(2 * np.pi * f * 2.02 * x)
    return (body * mod + noise(d, 6) * 3) * env_


cv = S['cave']
# low growl when the eyes open, snarl while she emerges, full roar
add(sfx, roar(1.4, 48) * .5, cv['start'] + cv['beats']['eyes'][0] + .1, .55)
add(sfx, roar(2.2, 55) * .6, cv['start'] + cv['beats']['emerge'][0] + .2, .6)
add(sfx, roar(1.7, 72), cv['start'] + cv['beats']['roar'][0], 1.0)
# leopard snarl during the crouch
ch = S['chase']
add(sfx, roar(2.2, 50) * .7, ch['start'] + ch['beats']['crouch'][0] + .2, .7)


def gunshot():
    d = 1.6
    x = tt(d)
    crack = noise(d, 2) * np.exp(-x * 60) * 6
    boom = np.sin(2 * np.pi * 60 * x) * np.exp(-x * 9) * 1.5
    tail = noise(d, 40) * np.exp(-x * 3) * 4
    return crack + boom + tail


js = S['jassar']
add(sfx, gunshot(), js['start'] + .02, 1.0)
add(sfx, gunshot(), js['start'] + .62, 1.0)
add(sfx, roar(.9, 80) * .8, js['start'] + .9, .6)  # angry snarl as she flees
# meow
hm = S['home']
x = tt(.7)
f = 650 + 250 * np.sin(np.pi * x / .7)
meow = (np.sin(2 * np.pi * np.cumsum(f) / SR) + .4 * np.sin(4 * np.pi * np.cumsum(f) / SR)) * np.sin(np.pi * x / .7)
add(sfx, meow, hm['start'] + hm['beats']['meow'][0] + .1, .35)
# gate clang
x = tt(1.0)
add(sfx, (np.sin(2 * np.pi * 320 * x) + .6 * np.sin(2 * np.pi * 517 * x)) * np.exp(-x * 5), hm['start'] + 2.0, .3)
# comic sting at the end + soft relief chord after Jassar
for i, f0 in enumerate([523.25, 659.25, 783.99, 1046.5]):
    add(music, tone(f0, .5, 6), hm['start'] + hm['beats']['flee'][0] + i * .08, .25)
for f0 in (261.63, 329.63, 392.0):
    add(music, tone(f0, 4.0, .6), js['start'] + js['beats']['flee'][1], .14)
# playful music back for the ending card
for b in range(int(hm['beats']['card'][1] - hm['beats']['card'][0]) // 2 + 1):
    t0 = hm['start'] + hm['beats']['card'][0] + b * beat * 4
    ch_ = chords[b % 4]
    add(music, tone(ch_[0] / 2, beat * 1.8, 2.5), t0, .28)
    for e in range(8):
        add(music, tone(ch_[e % 3], beat * .6), t0 + e * beat / 2, .1)

act = np.convolve(np.abs(voice) > .02, np.ones(int(.25 * SR)) / int(.25 * SR), 'same')
music = music * 0.5 * (1 - 0.55 * np.clip(act * 3, 0, 1))
sfx = sfx * (1 - 0.35 * np.clip(act * 3, 0, 1))
mix = voice + music * 0.6 + sfx * 0.55
mix = mix[:int(total * SR)]
mix[-int(1.2 * SR):] *= np.linspace(1, 0, int(1.2 * SR))
# loudness: bring the speech up to a comfortable level and soft-limit the gunshots/roars
vr = np.sqrt(np.mean(voice[np.abs(voice) > .02] ** 2)) if np.any(np.abs(voice) > .02) else .1
mix = mix * (0.16 / (vr + 1e-9))
mix = np.tanh(mix * 1.6) / np.tanh(1.6)
mix = mix / (np.abs(mix).max() + 1e-9) * 0.95
with wave.open(os.path.join(HERE, 'public', 'audio.wav'), 'wb') as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
print('total', round(total, 2), 'missing', [k for k in TEXT if k not in voices])
for s in scenes:
    print(s['name'], s['start'], s['dur'], list(s['lines']))
