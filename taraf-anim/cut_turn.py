"""Cut the 16 turnaround cells, remove the backdrop, normalise size and align on the feet."""
import cv2, numpy as np, json, os
from PIL import Image
from rembg import remove, new_session
SESSION = new_session('isnet-anime')
src = cv2.imread('turnaround.png')
H, W = src.shape[:2]
cw, ch = W / 8, H / 2
OUT = '../taraf-nimr/public/turn'
os.makedirs(OUT, exist_ok=True)
meta = {}
cells = []
for r in range(2):
    for c in range(8):
        i = r * 8 + c + 1
        x0, y0, x1, y1 = int(c * cw), int(r * ch), int((c + 1) * cw), int((r + 1) * ch)
        img = src[y0:y1, x0:x1].copy()
        h, w = img.shape[:2]
        # wider window (characters spill over the cell borders), then keep the blob at the cell centre
        mx = 50
        wx0, wx1 = max(0, x0 - mx), min(W, x1 + mx)
        win = src[y0:y1, wx0:wx1]
        cut = remove(Image.fromarray(cv2.cvtColor(win, cv2.COLOR_BGR2RGB)), session=SESSION, alpha_matting=False)
        a_full = np.array(cut)[:, :, 3]
        fg = (a_full > 100).astype(np.uint8)
        n, lab, st, cen = cv2.connectedComponentsWithStats(fg)
        ccx = (x0 + x1) / 2 - wx0
        best = min(range(1, n), key=lambda k: abs(cen[k][0] - ccx) - st[k, cv2.CC_STAT_AREA] / 400)
        keep = (lab == best)
        # also keep pieces that sit inside this cell (e.g. a shoe separated by a gap)
        for k in range(1, n):
            if k != best and st[k, cv2.CC_STAT_AREA] > 300 and abs(cen[k][0] - ccx) < (x1 - x0) / 2 - 10:
                keep |= (lab == k)
        alpha = np.where(keep, a_full, 0).astype(np.uint8)
        img = win.copy()
        h, w = img.shape[:2]
        ys, xs = np.where(alpha > 128)
        top, bot = ys.min(), ys.max()
        # horizontal centre = centre of the legs/body (rows in the lower half)
        low = alpha[int(top + (bot - top) * 0.55): bot] > 128
        cx = np.where(low.any(axis=0))[0].mean()
        rgba = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA); rgba[:, :, 3] = alpha
        cells.append((i, rgba, top, bot, cx))
# normalise every pose to the same height (head-top to shoe-bottom) on a 4x canvas
TARGET = 1800
CW, CH = 1100, 2000
for i, rgba, top, bot, cx in cells:
    s = TARGET / (bot - top) if i not in (15, 16) else TARGET / (bot - top) * (0.93 if i == 15 else 0.8)
    if i in (14,):
        s *= 1.0
    up = cv2.resize(rgba, None, fx=s, fy=s, interpolation=cv2.INTER_LANCZOS4)
    # gentle sharpen of colour channels after upscaling
    blur = cv2.GaussianBlur(up[:, :, :3], (0, 0), 2.2)
    up[:, :, :3] = cv2.addWeighted(up[:, :, :3], 1.45, blur, -0.45, 0)
    canvas = np.zeros((CH, CW, 4), np.uint8)
    ox = int(CW / 2 - cx * s)
    oy = int(CH - 40 - bot * s)
    y0, x0 = max(0, oy), max(0, ox)
    y1, x1 = min(CH, oy + up.shape[0]), min(CW, ox + up.shape[1])
    canvas[y0:y1, x0:x1] = up[y0 - oy:y1 - oy, x0 - ox:x1 - ox]
    cv2.imwrite(f'{OUT}/a{i:02d}.png', canvas)
    meta[i] = {'scale': round(s, 3)}
json.dump(meta, open(f'{OUT}/meta.json', 'w'))
print('done', len(cells))
