"""Cut Taraf out of each panel with GrabCut and fill the background behind her (inpaint)."""
import cv2, numpy as np, sys
src = cv2.imread('work/source.png')
H, W = src.shape[:2]
# find the white divider column
col = src.mean(axis=(0, 2))
mid = W // 2
div = mid - 40 + int(np.argmax(col[mid - 40: mid + 40]))
panels = {'front': src[:, :div - 4], 'side': src[:, div + 6:]}
rects = {'front': (95, 10, 470, H - 10), 'side': (110, 10, 380, H - 10)}
for name, img in panels.items():
    h, w = img.shape[:2]
    x, y, rw, rh = rects[name]
    rw = min(rw, w - x - 2)
    mask = np.zeros((h, w), np.uint8)
    bgd = np.zeros((1, 65), np.float64)
    fgd = np.zeros((1, 65), np.float64)
    cv2.grabCut(img, mask, (x, y, rw, rh), bgd, fgd, 8, cv2.GC_INIT_WITH_RECT)
    fg = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)
    # keep the largest component, close small holes, soften the edge
    n, lab, stats, _ = cv2.connectedComponentsWithStats(fg)
    big = 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])
    fg = np.where(lab == big, 255, 0).astype(np.uint8)
    fg = cv2.morphologyEx(fg, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    cnts, _ = cv2.findContours(fg, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    fill = np.zeros_like(fg)
    cv2.drawContours(fill, cnts, -1, 255, -1)
    alpha = cv2.GaussianBlur(fill, (3, 3), 0)
    rgba = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)
    rgba[:, :, 3] = alpha
    cv2.imwrite(f'work/{name}_char.png', rgba)
    # background plate: remove the character and inpaint
    hole = cv2.dilate(fill, np.ones((25, 25), np.uint8))
    bg = cv2.inpaint(img, hole, 9, cv2.INPAINT_TELEA)
    cv2.imwrite(f'work/{name}_bg.png', bg)
    print(name, img.shape, 'fg px', int(fill.sum() / 255))
print('divider', div)
