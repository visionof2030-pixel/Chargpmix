import json, os, subprocess, numpy as np, wave
HERE = os.path.dirname(os.path.abspath(__file__))
U = os.path.join(HERE, 'voices') + os.sep
SR = 44100
LINES = [
 ('T1','T1','سحاب! وش هالوجه الطفشان؟'),
 ('S1','S1','الجو حار وأنا طفشانة!'),
 ('T2','T2','توي لقيت أحلى طريقة تبردين فيها على قلبك في ذا الحر!'),
 ('S2','S2','آخر مرة قلتي كذا.. وانقرصت!'),
 ('T3','T3','هالمرة غير! تجربة عالمية وناسة بشكل مو طبيعي!'),
 ('S3','S3','وايش هي؟ ولا تقولين مقلب!'),
 ('T4','T4','بس تعالي! الوقوف تحت الدش بملابسك كاملة قمة الانتعاش!'),
 ('S4','S4','ملابسي؟! أنتي مجنونة؟'),
 ('T5','T5','وأنا بسويها معك! يلا تعالي!'),
 ('S5','S5','طيب طيب.. إذا طلع مقلب أنتي خسرانة!'),
 ('T6','T6','ثقي فيني! جاهزة؟ فتحت الموية!'),
 ('S6','S6','آآآه! باردة! باردة!'),
 ('T7','T7','استمتعي في المغامرة يا سحاب!'),
 ('S7','S7','ترف! افتحي الباب!'),
 ('T8','T8','ههههه، لا.. استمتعي!'),
 ('S8','S8','ترف! والله لأوريك الحين!'),
]
voices, env, text = {}, {}, {}
for id_, f, tx in LINES:
    raw = subprocess.run(['ffmpeg','-v','error','-i',U+f+'.opus','-ar',str(SR),'-ac','1','-f','f32le','-'],
                         capture_output=True, check=True).stdout
    x = np.frombuffer(raw, dtype=np.float32).astype(np.float64)
    a = np.abs(x)
    k = np.ones(441)/441
    sm = np.convolve(a, k, 'same')
    thr = max(0.02*sm.max(), 1e-4)
    idx = np.where(sm > thr)[0]
    i0, i1 = max(0, idx[0]-int(.04*SR)), min(len(x), idx[-1]+int(.06*SR))
    x = x[i0:i1]
    rms = np.sqrt(np.mean(x**2))
    x = x * (0.13/rms)
    x = np.clip(x, -0.95, 0.95)
    voices[id_] = x
    hop = SR//30
    n = len(x)//hop + 1
    r = np.array([np.sqrt(np.mean(x[i*hop:(i+1)*hop]**2)) if len(x[i*hop:(i+1)*hop]) else 0 for i in range(n)])
    e = np.clip(r/(np.percentile(r,90)+1e-9), 0, 1)
    e = np.convolve(e, [.25,.5,.25], 'same')
    env[id_] = [round(float(v),3) for v in e]
    text[id_] = tx
dur = {k: len(v)/SR for k, v in voices.items()}
GAP = .35
def seq(ids, t0):
    t, ev = t0, {}
    for i in ids:
        ev[i] = (round(t,3), round(t+dur[i],3)); t = t + dur[i] + GAP
    return ev
title_dur = 4.0
room = seq(['T1','S1','T2','S2','T3','S3'], 2.0)
room_dur = room['S3'][1] + .9
bath = seq(['T4','S4','T5','S5','T6','S6'], 1.6)
bath.update(seq(['T7','S7','T8','S8'], bath['S6'][1] + 1.5))
bath_dur = bath['S8'][1] + 1.0
end_dur = 6.0
off = {'room': title_dur, 'bath': title_dur + room_dur}
off['end'] = off['bath'] + bath_dur
total = off['end'] + end_dur
json.dump(dict(title=title_dur, room_dur=room_dur, bath_dur=bath_dur, end_dur=end_dur, room=room, bath=bath,
               off=off, total=total, text=text, env=env), open(os.path.join(HERE,'timeline.json'),'w'), ensure_ascii=False)

# ---- audio
N = int(total*SR) + SR
voice = np.zeros(N); music = np.zeros(N); sfx = np.zeros(N); shower = np.zeros(N)
def add(buf, sig, at, vol=1.0):
    i = int(at*SR); j = min(N, i+len(sig))
    if i < N: buf[i:j] += sig[:j-i]*vol
for sc, ev in (('room', room), ('bath', bath)):
    for id_, (s, e) in ev.items():
        add(voice, voices[id_], off[sc] + s)
def tone(f, d, kind='pluck'):
    t = np.arange(int(d*SR))/SR
    w = np.sin(2*np.pi*f*t)+.35*np.sin(4*np.pi*f*t)+.12*np.sin(6*np.pi*f*t)
    return w*np.minimum(1, t*120)*np.exp(-t*(5 if kind=='pluck' else 2.5))
beat = 60/126
chords = [(261.63,329.63,392.0),(220.0,261.63,329.63),(174.61,220.0,261.63),(196.0,246.94,293.66)]
pent = [523.25,587.33,659.25,783.99,880.0,1046.5]
r = np.random.default_rng(9)
for b in range(int(total/(beat*4))+1):
    ch = chords[b%4]; t0 = b*beat*4
    add(music, tone(ch[0]/2, beat*1.8, 'pad'), t0, .30)
    add(music, tone(ch[0]/2, beat*1.8, 'pad'), t0+beat*2, .26)
    for e in range(8): add(music, tone(ch[e%3], beat*.6), t0+e*beat/2, .12)
    for e in range(4):
        if r.random() < .75: add(music, tone(pent[r.integers(0,len(pent))], beat*.8), t0+e*beat+(beat/2 if r.random()<.3 else 0), .13)
rng = np.random.default_rng(4)
def noise(d, lp=40):
    return np.convolve(rng.standard_normal(int(d*SR)), np.ones(lp)/lp, 'same')
bo = off['bath']
ws = bath['T6'][1] - .3
sh = noise(bath['S8'][1]+1.0-ws, 18)  # softer (more low-passed) hiss
add(shower, sh*np.minimum(1, np.arange(len(sh))/(SR*.3))*2.2, bo+ws, .35)
s6e = bath['S6'][1]
t_ = np.arange(int(.35*SR))/SR
add(sfx, np.sin(2*np.pi*70*t_)*np.exp(-t_*14)+noise(.35,20)*np.exp(-t_*18)*3, bo+s6e+.6, .9)
t_ = np.arange(int(.05*SR))/SR
add(sfx, np.sin(2*np.pi*2200*t_)*np.exp(-t_*70), bo+s6e+.85, .7)
# duck music under voice
act = np.convolve(np.abs(voice) > .02, np.ones(int(.25*SR))/int(.25*SR), 'same')
music = music*0.5*(1-0.6*np.clip(act*3, 0, 1))
# shower: quieter overall and ducked hard under dialogue so Sahab stays clear
shower = shower*0.45*(1-0.8*np.clip(act*3, 0, 1))
mix = voice*1.0 + music*0.55 + sfx*0.6 + shower*0.6
mix = mix[:int(total*SR)]
mix[-int(1.5*SR):] *= np.linspace(1, 0, int(1.5*SR))
mix = mix/np.abs(mix).max()*0.9
with wave.open(os.path.join(HERE,'audio2.wav'),'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix*32767).astype('<i2').tobytes())
print(json.dumps({k: v for k, v in dict(total=total, room=room, bath=bath, off=off).items()}, ensure_ascii=False))
