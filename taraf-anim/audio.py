"""Music + SFX for the Taraf micro animation (12.5 s)."""
import numpy as np, wave
SR = 44100
TOTAL = 12.5
N = int(TOTAL * SR)
mix = np.zeros(N)
rng = np.random.default_rng(5)
def tt(d): return np.arange(int(d * SR)) / SR
def add(sig, at, vol=1.0):
    i = int(at * SR); j = min(N, i + len(sig)); mix[i:j] += sig[:j - i] * vol
def tone(f, d, dec=5):
    x = tt(d); return (np.sin(2*np.pi*f*x) + .3*np.sin(4*np.pi*f*x)) * np.minimum(1, x*120) * np.exp(-x*dec)
def noise(d, lp=20): return np.convolve(rng.standard_normal(int(d*SR)), np.ones(lp)/lp, 'same')
# light pizzicato music, pauses for the knock, comes back for the wink
beat = 60/112
notes = [523.25, 659.25, 783.99, 659.25, 587.33, 698.46, 880.0, 698.46]
for i in range(int(3.8/(beat/2))):
    add(tone(notes[i % 8], .4), .3 + i*beat/2, .16)
    if i % 4 == 0: add(tone(130.81, 1.0, 2.5), .3 + i*beat/2, .25)
# knock knock
for at in (4.0, 4.28):
    x = tt(.16); add((np.sin(2*np.pi*110*x) + noise(.16, 30)*2.5) * np.exp(-x*30), at, .9)
# startle sting
add(tone(987.77, .35, 9) + tone(1318.5, .35, 9), 4.12, .2)
# whooshes for the turns
for at in (4.6, 8.6):
    d = .35; x = tt(d); add(noise(d, 4) * np.sin(np.pi*x/d) * 1.6, at, .25)
# curious tiptoe plucks while she listens
for i, f in enumerate([392.0, 440.0, 392.0, 349.23, 392.0]):
    add(tone(f, .3, 8), 5.2 + i*.62, .14)
# wink ding + happy outro
add(tone(1567.98, .9, 4) + tone(2093.0, .9, 5)*.5, 9.45, .3)
for i in range(6):
    add(tone(notes[(i*2) % 8], .45), 9.9 + i*beat/2, .15)
add(tone(261.63, 2.0, 1.5) + tone(329.63, 2.0, 1.5) + tone(392.0, 2.0, 1.5), 9.9, .12)
mix[-int(.8*SR):] *= np.linspace(1, 0, int(.8*SR))
mix = np.tanh(mix * 1.4) / np.tanh(1.4)
mix = mix / np.abs(mix).max() * .9
with wave.open('../taraf-nimr/public/tarafanim/audio.wav', 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix*32767).astype('<i2').tobytes())
print('ok', TOTAL)
