"""Cut all 16 poses from the turnaround sheet in one pass and normalise them."""
import cv2, numpy as np, json, os
from PIL import Image
from rembg import remove, new_session
src = cv2.imread('turnaround.png')
H, W = src.shape[:2]
sess = new_session('isnet-anime')
# run at 2x for finer curls
big = cv2.resize(src, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
a = np.array(remove(Image.fromarray(cv2.cvtColor(big, cv2.COLOR_BGR2RGB)), session=sess))[:, :, 3]
a = cv2.resize(a, (W, H), interpolation=cv2.INTER_AREA).astype(float)
# curly hair comes out half transparent: push it solid, keep a soft 1-2 px edge
solid = np.clip((a - 12) / 45, 0, 1)
mask = (a > 18).astype(np.uint8)
mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
mask[int(H / 2) - 2:int(H / 2) + 2, :] = 0  # never let the two rows merge
n, lab, st, cen = cv2.connectedComponentsWithStats(mask)
cw, ch = W / 8, H / 2
owner = {}
for k in range(1, n):
    if st[k, cv2.CC_STAT_AREA] < 200:
        continue
    cx, cy = cen[k]
    r = int(cy // ch)
    # assign by the column that holds most of its lower half (feet/legs are clean anchors)
    ys, xs = np.where(lab == k)
    low = xs[ys > np.percentile(ys, 60)]
    c = int(np.clip(np.median(low) // cw, 0, 7))
    owner.setdefault(r * 8 + c + 1, []).append(k)
OUT = '../taraf-nimr/public/turn'
os.makedirs(OUT, exist_ok=True)
TARGET, CW, CH = 1800, 1100, 2000
for i in range(1, 17):
    if not owner.get(i):
        print('missing pose', i)
        continue
    ks = owner[i]
    mx = max(st[k, cv2.CC_STAT_AREA] for k in ks)
    ks = [k for k in ks if st[k, cv2.CC_STAT_AREA] >= 0.12 * mx and st[k, cv2.CC_STAT_HEIGHT] > 20]
    m = np.isin(lab, ks).astype(np.uint8)
    cnts, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    fill = np.zeros_like(m)
    cv2.drawContours(fill, cnts, -1, 1, -1)
    alpha = np.where(fill > 0, np.maximum(solid, cv2.erode(fill, np.ones((3, 3), np.uint8)).astype(float)), 0)
    alpha = cv2.GaussianBlur((alpha * 255).astype(np.uint8), (3, 3), 0)
    ys, xs = np.where(alpha > 128)
    top, bot = ys.min(), ys.max()
    low = alpha[int(top + (bot - top) * 0.6): bot + 1] > 128
    cx = np.where(low.any(axis=0))[0].mean()
    s = TARGET / (bot - top) * (0.93 if i == 15 else 0.8 if i == 16 else 1.0)
    rgba = cv2.cvtColor(src, cv2.COLOR_BGR2BGRA)
    rgba[:, :, 3] = alpha
    x0, x1 = max(0, xs.min() - 4), min(W, xs.max() + 5)
    y0, y1 = max(0, top - 4), min(H, bot + 5)
    crop = rgba[y0:y1, x0:x1]
    up = cv2.resize(crop, None, fx=s, fy=s, interpolation=cv2.INTER_LANCZOS4)
    blur = cv2.GaussianBlur(up[:, :, :3], (0, 0), 2.2)
    up[:, :, :3] = cv2.addWeighted(up[:, :, :3], 1.45, blur, -0.45, 0)
    canvas = np.zeros((CH, CW, 4), np.uint8)
    ox = int(CW / 2 - (cx - x0) * s)
    oy = int(CH - 40 - (bot - y0) * s)
    py0, px0 = max(0, oy), max(0, ox)
    py1, px1 = min(CH, oy + up.shape[0]), min(CW, ox + up.shape[1])
    canvas[py0:py1, px0:px1] = up[py0 - oy:py1 - oy, px0 - ox:px1 - ox]
    cv2.imwrite(f'{OUT}/a{i:02d}.png', canvas)
print('components per pose', {k: len(v) for k, v in sorted(owner.items())})
