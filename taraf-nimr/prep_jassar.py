"""Audio + timeline for the short «قبل الطلقة» (Jassar).

Cuts public/jassar/all.mp3 into J1..J4, lays out the beats (walk, distant scream, turn, run, jump,
freeze), synthesises footsteps matched to the walk/run cycles, wind, a distant echoed scream (made
from the kids' own lines in the episode), a drone and the final hit.
Writes public/jassar/audio.wav and src/jassar/timeline.json (incl. per-frame loudness + brightness for
the mouth shapes).
"""
import json, os, subprocess, wave
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
SR = 44100
FPS = 30
CUTS = {'J1': (0.0, 3.12), 'J2': (4.52, 6.03), 'J3': (6.72, 10.92), 'J4': (11.50, 13.40)}
TEXT = {
    'J1': 'الجو اليوم هادي.. ولا طير واحد.',
    'J2': 'لحظة.. وش هالصوت؟!',
    'J3': 'هذا صوت أختي ترف! وبنات عمي نايف.. وعيال خالي أحمد!',
    'J4': 'اصبروا.. أنا جاي!!',
}


def load(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ar', str(SR), '-ac', '1', '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)


src = load(os.path.join(HERE, 'public', 'jassar', 'all.mp3'))
lines = {k: src[int(a * SR): int(b * SR)] for k, (a, b) in CUTS.items()}

# ---- beats (seconds)
T = {}
T['J1'] = 1.0
T['scream'] = T['J1'] + len(lines['J1']) / SR + 0.9
T['stop'] = T['scream'] + 0.15
T['J2'] = T['scream'] + 1.4
T['turn'] = T['J2'] + len(lines['J2']) / SR + 0.25
T['J3'] = T['turn'] + 0.45
T['J4'] = T['J3'] + len(lines['J3']) / SR + 0.35
T['lampOn'] = T['J4'] + 0.1
T['turnBack'] = T['J4'] + len(lines['J4']) / SR - 0.2
T['anticip'] = T['turnBack'] + 0.25
T['run'] = T['anticip'] + 0.25
T['jump'] = T['run'] + 2.4
T['land'] = T['jump'] + 0.6
T['raise'] = T['land'] + 0.35
T['freeze'] = T['raise'] + 0.7
T['end'] = T['freeze'] + 3.8
T = {k: round(v, 3) for k, v in T.items()}
WALK_PERIOD = 1.0  # one full cycle = two steps
RUN_PERIOD = 0.5

line_times = {k: [T[k], round(T[k] + len(lines[k]) / SR, 3)] for k in CUTS}

# ---- mouth data: loudness + spectral brightness per frame
hop = SR // FPS
env, bright = {}, {}
for k, x in lines.items():
    n = len(x) // hop + 1
    e, c = [], []
    for i in range(n):
        seg = x[i * hop:(i + 1) * hop]
        if len(seg) < 32:
            e.append(0)
            c.append(0)
            continue
        e.append(np.sqrt(np.mean(seg ** 2)))
        sp = np.abs(np.fft.rfft(seg * np.hanning(len(seg))))
        fr = np.fft.rfftfreq(len(seg), 1 / SR)
        c.append((sp * fr).sum() / (sp.sum() + 1e-9))
    e = np.array(e)
    c = np.array(c)
    e = np.clip(e / (np.percentile(e, 90) + 1e-9), 0, 1)
    c = np.clip((c - 900) / 2600, 0, 1)
    env[k] = [round(float(v), 3) for v in np.convolve(e, [.25, .5, .25], 'same')]
    bright[k] = [round(float(v), 3) for v in np.convolve(c, [.25, .5, .25], 'same')]

total = T['end']
os.makedirs(os.path.join(HERE, 'src', 'jassar'), exist_ok=True)
json.dump({'fps': FPS, 'total': total, 'beats': T, 'lines': line_times, 'text': TEXT, 'env': env, 'bright': bright,
           'walkPeriod': WALK_PERIOD, 'runPeriod': RUN_PERIOD},
          open(os.path.join(HERE, 'src', 'jassar', 'timeline.json'), 'w'), ensure_ascii=False)

# ---- mix
N = int(total * SR) + SR
voice, music, sfx = np.zeros(N), np.zeros(N), np.zeros(N)
rng = np.random.default_rng(3)


def add(buf, sig, at, vol=1.0):
    i = int(at * SR)
    j = min(N, i + len(sig))
    if 0 <= i < N and j > i:
        buf[i:j] += sig[:j - i] * vol


def tt(d):
    return np.arange(int(d * SR)) / SR


def noise(d, lp=30):
    return np.convolve(rng.standard_normal(int(d * SR)), np.ones(lp) / lp, 'same')


def lowpass(x, f):
    n = 301
    k = np.arange(n) - (n - 1) / 2
    h = np.sinc(2 * f / SR * k) * np.hamming(n)
    return np.convolve(x, h / h.sum(), 'same')


for k, x in lines.items():
    xx = x * (0.14 / (np.sqrt(np.mean(x[np.abs(x) > .01] ** 2)) + 1e-9))
    add(voice, xx, T[k])

# wind bed
add(sfx, noise(total, 220) * 9 * (0.6 + 0.4 * np.sin(tt(total) * 0.9)), 0, 0.22)
# footsteps on gravel, matched to the cycles (contact at phase 0 and 0.5)
def step(vol):
    d = .09
    return (noise(d, 6) * 3 + np.sin(2 * np.pi * 90 * tt(d))) * np.exp(-tt(d) * 45) * vol
t = 0.0
while t < T['stop']:
    add(sfx, step(.35), t)
    t += WALK_PERIOD / 2
t = T['run']
while t < T['jump']:
    add(sfx, step(.6), t)
    t += RUN_PERIOD / 2
# landing thud + whoosh on jump
add(sfx, noise(.4, 4) * np.sin(np.pi * tt(.4) / .4), T['jump'], .3)
add(sfx, (np.sin(2 * np.pi * 70 * tt(.3)) + noise(.3, 10) * 2) * np.exp(-tt(.3) * 14), T['land'], .9)
# distant scream: the kids' own voices from the episode, muffled with echoes
vdir = os.path.join(HERE, 'public', 'voices')
scream = np.zeros(int(2.4 * SR))
for name, off, vol in (('T4', 0.0, 1.0), ('ALL', 0.35, 0.8), ('M4', 0.2, 0.5)):
    p = os.path.join(vdir, name + '.m4a')
    if os.path.exists(p):
        y = load(p)
        y = y[: max(0, len(scream) - int(off * SR))]
        scream[int(off * SR): int(off * SR) + len(y)] += y * vol
scream = lowpass(lowpass(scream, 1400), 1400)
echo = scream.copy()
for d, g in ((0.28, .5), (0.55, .3), (0.9, .18)):
    echo[int(d * SR):] += scream[: len(scream) - int(d * SR)] * g
add(sfx, echo / (np.abs(echo).max() + 1e-9), T['scream'], .35)
# headlamp click
add(sfx, np.sin(2 * np.pi * 2400 * tt(.04)) * np.exp(-tt(.04) * 90), T['lampOn'], .5)
# drone that rises from the scream to the freeze, then a hit
d = T['freeze'] - T['scream']
x = tt(d)
drone = (np.sin(2 * np.pi * 55 * x) + .6 * np.sin(2 * np.pi * 82.4 * x) + .35 * np.sin(2 * np.pi * (110 + 40 * x / d) * x)) * (x / d) ** 1.2
add(music, drone, T['scream'], .35)
x = tt(2.5)
hit = (np.sin(2 * np.pi * 45 * x) * 2 + noise(2.5, 20) * 4) * np.exp(-x * 2.2) + np.sin(2 * np.pi * 220 * x) * np.exp(-x * 1.5) * .4
add(music, hit, T['freeze'], .8)
# riser pulse during the run
t = T['run']
while t < T['freeze']:
    add(music, np.sin(2 * np.pi * 65 * tt(.12)) * np.exp(-tt(.12) * 25), t, .6)
    t += .25

act = np.convolve(np.abs(voice) > .02, np.ones(int(.25 * SR)) / int(.25 * SR), 'same')
mix = voice + music * 0.55 * (1 - .4 * np.clip(act * 3, 0, 1)) + sfx * 0.6
mix = mix[:int(total * SR)]
mix[-int(1.0 * SR):] *= np.linspace(1, 0, int(1.0 * SR))
vr = np.sqrt(np.mean(voice[np.abs(voice) > .02] ** 2))
mix = mix * (0.16 / (vr + 1e-9))
mix = np.tanh(mix * 1.5) / np.tanh(1.5)
mix = mix / (np.abs(mix).max() + 1e-9) * 0.95
with wave.open(os.path.join(HERE, 'public', 'jassar', 'audio.wav'), 'wb') as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
print(json.dumps({'total': total, 'beats': T, 'lines': line_times}, ensure_ascii=False))
