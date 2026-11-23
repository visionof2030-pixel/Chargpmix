import numpy as np, wave
SR=44100; TOTAL=10.0; N=int(TOTAL*SR); mix=np.zeros(N); rng=np.random.default_rng(2)
def tt(d): return np.arange(int(d*SR))/SR
def add(s,at,v=1):
    i=int(at*SR); j=min(N,i+len(s)); mix[i:j]+=s[:j-i]*v
def tone(f,d,dec=5):
    x=tt(d); return (np.sin(2*np.pi*f*x)+.3*np.sin(4*np.pi*f*x))*np.minimum(1,x*120)*np.exp(-x*dec)
def noise(d,lp=6): return np.convolve(rng.standard_normal(int(d*SR)),np.ones(lp)/lp,'same')
beat=60/118; notes=[523.25,659.25,783.99,1046.5,783.99,659.25,587.33,783.99]
for i in range(int(9.2/(beat/2))):
    add(tone(notes[i%8],.4),.2+i*beat/2,.13)
    if i%4==0: add(tone(130.81,1.2,2.2)+tone(196,1.2,2.2)*.5,.2+i*beat/2,.22)
for at,d in ((2.0,1.2),(3.5,0.75)):
    x=tt(d); add(noise(d)*np.sin(np.pi*x/d)*1.4,at,.3)
for i in range(8): add(tone(1567.98*(1+0.06*i),.5,7),1.25+i*.06,.08)
for i in range(6): add(tone(2093*(1+0.05*i),.5,7),4.25+i*.05,.09)
add(tone(1318.5,.8,4)+tone(1975.5,.8,5)*.5,7.2,.25)
mix[-int(.8*SR):]*=np.linspace(1,0,int(.8*SR)); mix=np.tanh(mix*1.4)/np.tanh(1.4); mix=mix/np.abs(mix).max()*.9
with wave.open('../taraf-nimr/public/turn/audio.wav','wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix*32767).astype('<i2').tobytes())
