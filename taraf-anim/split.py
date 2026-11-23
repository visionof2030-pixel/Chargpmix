"""Split each cut-out into head and body layers with soft overlapping seams, and sample skin colours."""
import cv2, numpy as np, json, os
OUT = '../taraf-nimr/public/tarafanim'
os.makedirs(OUT, exist_ok=True)
def ramp(v, a, b):
    return np.clip((v - a) / (b - a), 0, 1)
info = {}
for name, (neckTop, neckBot, tailX, tailBot) in {'front': (318, 352, None, None), 'side': (300, 340, 330, 430)}.items():
    im = cv2.imread(f'work/{name}_char.png', cv2.IMREAD_UNCHANGED)
    h, w = im.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w].astype(float)
    a = im[:, :, 3].astype(float) / 255
    head_m = 1 - ramp(yy, neckBot - 12, neckBot + 8)
    if tailX:
        tail = (1 - ramp(xx, tailX - 10, tailX + 10)) * (1 - ramp(yy, tailBot - 15, tailBot + 5))
        head_m = np.maximum(head_m, tail)
    body_m = ramp(yy, neckTop - 3, neckTop + 3)  # fully opaque under the head's soft edge: no seam
    for part, m in (('head', head_m), ('body', body_m), ('full', np.ones_like(a))):
        o = im.copy()
        o[:, :, 3] = np.clip(a * m * 255, 0, 255).astype(np.uint8)
        cv2.imwrite(f'{OUT}/{name}_{part}.png', o)
    info[name] = {'w': w, 'h': h}
f = cv2.imread('work/front_char.png'); s = cv2.imread('work/side_char.png')
hexc = lambda p: '#%02x%02x%02x' % (int(p[2]), int(p[1]), int(p[0]))
info['front']['skin'] = hexc(f[250, 336]); info['front']['lid'] = hexc(f[188, 300])
info['side']['skin'] = hexc(s[245, 420]); info['side']['lid'] = hexc(s[186, 425])
json.dump(info, open(f'{OUT}/info.json', 'w'), indent=1)
print(info)
