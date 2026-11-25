"""Music + SFX for «البطل عزام». Voice files (public/azzam/voices/N|A1|A2|A3.*) are mixed in at their
line times when present; until then the dialogue is shown as captions only."""
import glob, os, subprocess, wave
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
SR = 44100; TOTAL = 39.0; N = int(TOTAL * SR)
mix = np.zeros(N); voice = np.zeros(N); rng = np.random.default_rng(11)
B = dict(press=3.6, thiefIn=6.0, look=8.5, pick=9.6, notice=11.0, duck=12.1, win=14.0, L1=14.6, freeze=19.0, spin=19.6, shrug=21.6, siren=23.2, L2=23.5, door=27.6, flee=28.2, outro=31.0, L3=31.8, title=36.0)
LINE_AT = {'N': 0.4, 'A1': B['L1'], 'A2': B['L2'], 'A3': B['L3']}
def tt(d): return np.arange(int(d * SR)) / SR
def add(buf, s, at, v=1.0):
    i = int(at * SR); j = min(N, i + len(s))
    if 0 <= i < N and j > i: buf[i:j] += s[:j - i] * v
def tone(f, d, dec=5):
    x = tt(d); return (np.sin(2*np.pi*f*x) + .3*np.sin(4*np.pi*f*x)) * np.minimum(1, x*120) * np.exp(-x*dec)
def noise(d, lp=10): return np.convolve(rng.standard_normal(int(d*SR)), np.ones(lp)/lp, 'same')
# birds at noon
for k in range(14):
    at = rng.random() * 12; x = tt(.18)
    add(mix, np.sin(2*np.pi*(2600 + 900*np.sin(x*60))*x) * np.exp(-x*20), at, .05)
# calm noon plucks -> sneaky pizzicato for the thief
for i in range(10): add(mix, tone([523.25, 659.25, 587.33, 783.99][i % 4], .5), .3 + i*.55, .12)
for i in range(16): add(mix, tone([196.0, 233.08, 196.0, 174.61][i % 4], .25, 12), B['thiefIn'] + i*.32, .2)
# wire scratching the lock
for at in np.arange(B['pick'], B['freeze'], .22): add(mix, noise(.12, 2) * np.exp(-tt(.12)*25), at, .12)
for at in np.arange(B['shrug'] + .8, B['door'], .22): add(mix, noise(.12, 2) * np.exp(-tt(.12)*25), at, .1)
# "!!" sting, window slide, megaphone feedback
add(mix, tone(987.77, .4, 8) + tone(1318.5, .4, 8), B['notice'], .25)
add(mix, noise(.5, 30) * np.sin(np.pi*tt(.5)/.5) * 2, B['win'], .25)
x = tt(.6); add(mix, np.sin(2*np.pi*(1800 + 600*x)*x) * np.sin(np.pi*x/.6), B['L1'] - .55, .12)
# heroic fanfare under line 1
for i, f in enumerate([392.0, 523.25, 659.25, 783.99]): add(mix, tone(f, .6, 4), B['L1'] - .3 + i*.12, .14)
# freeze: comic record scratch + spin whoosh
add(mix, noise(.25, 3) * np.linspace(1, 0, int(.25*SR)) * 2, B['freeze'], .2)
add(mix, noise(1.2, 5) * np.sin(np.pi*tt(1.2)/1.2) * 1.2, B['spin'], .15)
# toy siren (two-tone wail)
d = B['door'] + 1.5 - B['siren']; x = tt(d)
f = 700 + 350 * (np.sin(2*np.pi*1.6*x) > 0)
add(mix, np.sin(2*np.pi*np.cumsum(f)/SR) * np.minimum(1, x*8), B['siren'], .12)
# door slam + running feet + chase music
add(mix, (np.sin(2*np.pi*90*tt(.4)) + noise(.4, 20)*2) * np.exp(-tt(.4)*12), B['door'], .7)
for at in np.arange(B['flee'], B['flee'] + 2.4, .13): add(mix, noise(.06, 6) * np.exp(-tt(.06)*50) * 3, at, .18)
for i in range(12): add(mix, tone([523.25, 587.33, 659.25, 698.46, 783.99, 880.0][i % 6], .2, 10), B['flee'] + i*.18, .15)
# outro: claps + happy tune + title hit
for at in np.arange(B['outro'], B['outro'] + 6, .21): add(mix, noise(.05, 2) * np.exp(-tt(.05)*60) * 2, at + rng.random()*.05, .12)
for i in range(16): add(mix, tone([523.25, 659.25, 783.99, 1046.5][i % 4], .4), B['outro'] + i*.27, .11)
add(mix, tone(261.63, 2.5, 1.2) + tone(329.63, 2.5, 1.2) + tone(392.0, 2.5, 1.2), B['title'], .18)
# voices if recorded
for k, at in LINE_AT.items():
    fs = glob.glob(os.path.join(HERE, 'public', 'azzam', 'voices', k + '.*'))
    if fs:
        raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', fs[0], '-ar', str(SR), '-ac', '1', '-f', 'f32le', '-'], capture_output=True).stdout
        v = np.frombuffer(raw, np.float32).astype(float)
        add(voice, v * (0.14 / (np.sqrt(np.mean(v[np.abs(v) > .01]**2)) + 1e-9)), at)
act = np.convolve(np.abs(voice) > .02, np.ones(int(.25*SR))/int(.25*SR), 'same')
out = voice + mix * (1 - .45*np.clip(act*3, 0, 1))
out[-int(.8*SR):] *= np.linspace(1, 0, int(.8*SR))
out = np.tanh(out * 1.5) / np.tanh(1.5); out = out / np.abs(out).max() * .92
with wave.open(os.path.join(HERE, 'public', 'azzam', 'audio.wav'), 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((out*32767).astype('<i2').tobytes())
print('ok, voices:', [os.path.basename(p) for p in glob.glob(os.path.join(HERE, 'public', 'azzam', 'voices', '*'))])
