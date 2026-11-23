"""Episode 2 audio prep.
Cuts the single dialogue file (voices/all_lines.mp3) into 15 lines, lays them out on a timeline
with room for the actions (door unlock, slip), and mixes music + SFX into audio.wav.
Writes timeline.json (line times, text, per-frame mouth envelopes) for the Remotion project."""
import json, os, subprocess, numpy as np, wave

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'voices', 'all_lines.mp3')
SR = 44100

# (id, start, end) in the source file, found from pauses + pitch (Fajr is the lower voice)
CUTS = [
    ('F1', 0.00, 3.36), ('T1', 3.64, 6.95), ('F2', 7.49, 10.43), ('T2', 10.70, 14.83),
    ('S1', 15.79, 19.08), ('F3', 19.49, 21.74), ('S2', 21.99, 26.55), ('F4', 26.83, 27.28),
    ('T3', 28.06, 33.36), ('S3', 33.70, 37.24), ('F5', 37.67, 41.65), ('S4', 42.17, 44.89),
    ('T4', 45.24, 47.65), ('F6', 48.02, 48.83), ('F7', 49.39, 52.13),
]
TEXT = {
    'F1': 'ترف! وش هالإزعاج؟ ووش فيك تضحكين كذا؟',
    'T1': 'ولا شي يا جرادة! بس أتمرّن على الضحك!',
    'F2': 'جرادة في عينك! والله إنتي اللي جرادة!',
    'T2': 'لا لا، أنا ترف الحلوة.. الجرادة وحدة بس في هالبيت!',
    'S1': 'عمة فجر! افتحي الباب! ترف قفلت علي!',
    'F3': 'سحاب؟! وش تسوين في الحمام؟',
    'S2': 'ترف قالت لي أوقف تحت الدش بملابسي.. والموية باردة!',
    'F4': 'تـــرف...',
    'T3': 'هذي.. تجربة عالمية! وناسة بشكل مو طبيعي!',
    'S3': 'أخيراً! وينها؟ وين راحت؟!',
    'F5': 'شوفي حالك! تقطرين مثل الإسفنجة!',
    'S4': 'ترف! والله ما أخليك!',
    'T4': 'امسكيني إذا تقدرين! يااااي!',
    'F6': 'لا تركضون والبلاط مبلول!',
    'F7': 'يا ويلكم! صرتوا جرادتين مو جرادة وحدة!',
}
MUFFLED = {'S1', 'S2'}  # behind the bathroom door

raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', SRC, '-ar', str(SR), '-ac', '1', '-f', 'f32le', '-'],
                     capture_output=True, check=True).stdout
src = np.frombuffer(raw, dtype=np.float32).astype(np.float64)


def lowpass(x, f):
    # windowed-sinc FIR low-pass
    n = 301
    t = np.arange(n) - (n - 1) / 2
    h = np.sinc(2 * f / SR * t) * np.hamming(n)
    return np.convolve(x, h / h.sum(), 'same')


voices, env = {}, {}
for id_, s, e in CUTS:
    x = src[max(0, int((s - .04) * SR)): int((e + .06) * SR)].copy()
    fade = int(.015 * SR)
    x[:fade] *= np.linspace(0, 1, fade)
    x[-fade:] *= np.linspace(1, 0, fade)
    x *= 0.13 / (np.sqrt(np.mean(x ** 2)) + 1e-9)
    if id_ in MUFFLED:
        x = lowpass(lowpass(x, 1100), 1100) * 0.85
    x = np.clip(x, -0.95, 0.95)
    voices[id_] = x
    hop = SR // 30
    n = len(x) // hop + 1
    r = np.array([np.sqrt(np.mean(x[i * hop:(i + 1) * hop] ** 2)) if len(x[i * hop:(i + 1) * hop]) else 0 for i in range(n)])
    ev = np.clip(r / (np.percentile(r, 90) + 1e-9), 0, 1)
    env[id_] = [round(float(v), 3) for v in np.convolve(ev, [.25, .5, .25], 'same')]

dur = {k: len(v) / SR for k, v in voices.items()}
GAP = .35
EXTRA = {'T3': 2.7, 'T4': .3, 'F6': 1.9}  # pause after these lines for the action
hall, t = {}, 2.2
for id_, _, _ in CUTS:
    hall[id_] = (round(t, 3), round(t + dur[id_], 3))
    t += dur[id_] + GAP + EXTRA.get(id_, 0)
title_dur, end_dur = 4.0, 6.0
hall_dur = hall['F7'][1] + 1.4
off = {'hall': title_dur, 'end': title_dur + hall_dur}
total = off['end'] + end_dur
# action beats (hall-relative seconds)
t3e, f6e = hall['T3'][1], hall['F6'][1]
beats = {
    'walk': [t3e + .15, t3e + .85],      # Fajr walks to the door
    'click': t3e + 1.1,                  # unlock
    'open': [t3e + 1.3, t3e + 1.75],     # door swings open
    'out': [t3e + 1.75, t3e + 2.5],      # Sahab steps out
    'chase': hall['T4'][0] + .9,         # Taraf bolts, Sahab follows
    'slip': f6e + .25,                   # Sahab slips
    'splash': f6e + .55,                 # water hits Fajr
}
json.dump(dict(title=title_dur, hall_dur=hall_dur, end_dur=end_dur, hall=hall, off=off, total=total,
               beats=beats, text=TEXT, env=env),
          open(os.path.join(HERE, 'timeline.json'), 'w'), ensure_ascii=False)

# ---------------------------------------------------------------- mix
N = int(total * SR) + SR
voice, music, sfx = np.zeros(N), np.zeros(N), np.zeros(N)


def add(buf, sig, at, vol=1.0):
    i = int(at * SR)
    j = min(N, i + len(sig))
    if 0 <= i < N:
        buf[i:j] += sig[:j - i] * vol


for id_, (s, e) in hall.items():
    add(voice, voices[id_], off['hall'] + s)


def tone(f, d, kind='pluck'):
    tt = np.arange(int(d * SR)) / SR
    w = np.sin(2 * np.pi * f * tt) + .35 * np.sin(4 * np.pi * f * tt) + .12 * np.sin(6 * np.pi * f * tt)
    return w * np.minimum(1, tt * 120) * np.exp(-tt * (5 if kind == 'pluck' else 2.5))


beat = 60 / 120
chords = [(261.63, 329.63, 392.0), (196.0, 246.94, 293.66), (220.0, 261.63, 329.63), (174.61, 220.0, 261.63)]
pent = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5]
r = np.random.default_rng(21)
for b in range(int(total / (beat * 4)) + 1):
    ch = chords[b % 4]
    t0 = b * beat * 4
    add(music, tone(ch[0] / 2, beat * 1.8, 'pad'), t0, .30)
    add(music, tone(ch[0] / 2, beat * 1.8, 'pad'), t0 + beat * 2, .26)
    for k in range(8):
        add(music, tone(ch[k % 3], beat * .6), t0 + k * beat / 2, .12)
    for k in range(4):
        if r.random() < .7:
            add(music, tone(pent[r.integers(0, len(pent))], beat * .8), t0 + k * beat, .13)

rng = np.random.default_rng(4)


def noise(d, lp=40):
    return np.convolve(rng.standard_normal(int(d * SR)), np.ones(lp) / lp, 'same')


def knock(at, vol=.8):
    tt = np.arange(int(.18 * SR)) / SR
    add(sfx, (np.sin(2 * np.pi * 95 * tt) + noise(.18, 30) * 2) * np.exp(-tt * 28), at, vol)


H = off['hall']
# Sahab banging on the door at the start and during her lines from behind it
for k in np.arange(0.3, 2.0, .32):
    knock(H + k, .7)
for id_ in ('S1', 'S2'):
    s, e = hall[id_]
    for k in np.arange(s + .1, e, .45):
        knock(H + k, .35)
# unlock click
tt = np.arange(int(.05 * SR)) / SR
add(sfx, np.sin(2 * np.pi * 2200 * tt) * np.exp(-tt * 70), H + beats['click'], .8)
add(sfx, np.sin(2 * np.pi * 1600 * tt) * np.exp(-tt * 70), H + beats['click'] + .07, .6)
# door creak (sliding pitch)
d = beats['open'][1] - beats['open'][0] + .2
tt = np.arange(int(d * SR)) / SR
f = 380 + 260 * tt / d
add(sfx, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / d) * (1 + .4 * np.sin(2 * np.pi * 23 * tt)), H + beats['open'][0], .18)
# drips while Sahab stands there wet
for k in np.arange(beats['out'][0], hall['F6'][1], .55):
    tt = np.arange(int(.06 * SR)) / SR
    add(sfx, np.sin(2 * np.pi * (1400 - 6000 * tt) * tt) * np.exp(-tt * 60), H + k + rng.random() * .2, .25)
# running footsteps
for k in np.arange(beats['chase'], beats['chase'] + 1.6, .14):
    knock(H + k, .18)
# slip: whoosh, thud and a big splash
d = .35
tt = np.arange(int(d * SR)) / SR
add(sfx, noise(d, 6) * np.sin(np.pi * tt / d) * 2, H + beats['slip'], .5)
knock(H + beats['slip'] + .3, 1.0)
d = 1.1
tt = np.arange(int(d * SR)) / SR
add(sfx, noise(d, 10) * np.exp(-tt * 3.5) * 3, H + beats['splash'] - .1, .6)

act = np.convolve(np.abs(voice) > .02, np.ones(int(.25 * SR)) / int(.25 * SR), 'same')
music = music * 0.5 * (1 - 0.6 * np.clip(act * 3, 0, 1))
mix = voice * 1.0 + music * 0.55 + sfx * 0.6
mix = mix[:int(total * SR)]
mix[-int(1.5 * SR):] *= np.linspace(1, 0, int(1.5 * SR))
mix = mix / np.abs(mix).max() * 0.9
with wave.open(os.path.join(HERE, 'audio.wav'), 'wb') as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
print(json.dumps(dict(total=round(total, 2), hall_dur=round(hall_dur, 2), hall=hall, beats=beats), ensure_ascii=False))
