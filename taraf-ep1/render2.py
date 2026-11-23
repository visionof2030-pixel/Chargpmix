import sys, os, subprocess
from multiprocessing import Pool
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from scenes2 import *

SCENES = [('t1', bg_title, s_title, TL['title']), ('t2', bg_room, s_room2, TL['room_dur']),
          ('t3', bg_bath, s_bath2, TL['bath_dur']), ('t4', bg_end, s_end2, TL['end_dur'])]

def render(sc):
    name, bgf, fn, dur = sc
    bg = bgf()
    out = os.path.join(HERE, 'scenes', f'{name}.mp4')
    tmp = os.path.join(HERE, 'scenes', f'{name}_tmp.mp4')
    n = round(dur * FPS)
    cmd = ['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{OW}x{OH}', '-r', str(FPS),
           '-i', '-', '-vf', f'fade=t=in:st=0:d=0.25,fade=t=out:st={n/FPS-0.25}:d=0.25', '-c:v', 'libx264', '-crf', '18',
           '-preset', 'veryfast', '-pix_fmt', 'yuv420p', tmp]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for i in range(n):
        im = bg.copy()
        fn(im, i / FPS)
        p.stdin.write(im.reduce(2).tobytes())
    p.stdin.close()
    if p.wait() == 0:
        os.rename(tmp, out)
    return name, p.returncode, n

if __name__ == '__main__':
    with Pool(2) as pool:
        print(pool.map(render, SCENES))
