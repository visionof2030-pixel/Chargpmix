import math, os, random
from PIL import Image, ImageDraw, ImageFont

W, H = 1440, 2560          # drawn at 2x
OW, OH = 720, 1280         # output size
FPS = 30
HERE = os.path.dirname(os.path.abspath(__file__))
FB = os.path.join(HERE, 'fonts', 'Cairo-Bold.ttf')
_fc = {}
SHADOW = (170, 140, 130)


def F(sz):
    sz = int(sz)
    if sz not in _fc:
        _fc[sz] = ImageFont.truetype(FB, sz, layout_engine=ImageFont.Layout.RAQM)
    return _fc[sz]


def tl(s, f):
    return f.getlength(s, direction='rtl', language='ar')


def mix(a, b, t):
    t = max(0, min(1, t))
    return tuple(int(a[i] * (1 - t) + b[i] * t) for i in range(3))


def c01(x):
    return max(0.0, min(1.0, x))


def pop(x):  # overshoot ease 0..1
    x = c01(x)
    c1 = 1.70158
    c3 = c1 + 1
    return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2


def smooth(x):
    x = c01(x)
    return x * x * (3 - 2 * x)


def vgrad(c1, c2, y0=0, y1=H):
    im = Image.new('RGB', (W, H), c1)
    d = ImageDraw.Draw(im)
    for y in range(y0, y1):
        d.line([(0, y), (W, y)], fill=mix(c1, c2, (y - y0) / max(1, y1 - y0)))
    return im


def text(d, xy, s, size, fill, stroke=0, sfill=(255, 255, 255)):
    if size < 12:
        return
    d.text(xy, s, font=F(size), fill=fill, anchor='mm', direction='rtl', language='ar',
           stroke_width=stroke, stroke_fill=sfill)


def wrap(s, f, maxw):
    words = s.split(' ')
    lines, cur = [], ''
    for w in words:
        trial = (cur + ' ' + w).strip()
        if tl(trial, f) <= maxw or not cur:
            cur = trial
        else:
            lines.append(cur)
            cur = w
    lines.append(cur)
    return lines


# ------------------------------------------------------------------ bubbles
def bubble(im, age, s, name, ncol, tip, cx, top, size=66, maxw=940):
    """speech bubble with tail tip at `tip`; age = seconds since it appeared"""
    size = int(size * 1.12)
    f = F(size)
    lines = wrap(s, f, maxw)
    lh = int(size * 1.5)
    lw = max(tl(l, f) for l in lines)
    bw = int(max(lw + 120, 520))
    bh = int(len(lines) * lh + 70)
    cx = max(bw / 2 + 30, min(W - bw / 2 - 30, cx))
    x0, y0 = cx - bw / 2, top
    x1, y1 = cx + bw / 2, top + bh
    tx, ty = tip
    bc = max(x0 + 90, min(x1 - 90, tx))
    pad = 30
    lx0 = int(min(x0, tx) - pad)
    ly0 = int(min(y0, ty) - pad - 40)
    lx1 = int(max(x1, tx) + pad)
    ly1 = int(max(y1, ty) + pad)
    L = Image.new('RGBA', (lx1 - lx0, ly1 - ly0), (0, 0, 0, 0))
    d = ImageDraw.Draw(L)
    ox, oy = -lx0, -ly0
    d.polygon([(bc - 52 + ox, y1 - 14 + oy), (bc + 52 + ox, y1 - 14 + oy), (tx + ox, ty + oy)], fill=ncol)
    d.rounded_rectangle([x0 + ox, y0 + oy, x1 + ox, y1 + oy], 46, fill=ncol)
    d.rounded_rectangle([x0 + 9 + ox, y0 + 9 + oy, x1 - 9 + ox, y1 - 9 + oy], 38, fill=(255, 255, 255))
    ux = tx + (bc - tx) * 0.12
    uy = ty + (y1 - ty) * 0.12
    d.polygon([(bc - 40 + ox, y1 - 16 + oy), (bc + 40 + ox, y1 - 16 + oy), (ux + ox, uy + oy)], fill=(255, 255, 255))
    for i, l in enumerate(lines):
        d.text((cx + ox, y0 + 35 + lh * (i + 0.5) + oy), l, font=f, fill=(45, 30, 60), anchor='mm',
               direction='rtl', language='ar')
    if name:
        nf = F(40)
        cw = tl(name, nf) + 60
        d.rounded_rectangle([x1 - 30 - cw + ox, y0 - 34 + oy, x1 - 30 + ox, y0 + 30 + oy], 32, fill=ncol)
        d.text((x1 - 30 - cw / 2 + ox, y0 - 2 + oy), name, font=nf, fill=(255, 255, 255), anchor='mm',
               direction='rtl', language='ar')
    s_ = pop(age / 0.28) * 1.0 if age < 0.28 else 1.0
    s_ = max(0.05, s_)
    if abs(s_ - 1) > 0.01:
        px, py = tx + ox, ty + oy
        nw, nh = max(2, int(L.width * s_)), max(2, int(L.height * s_))
        L = L.resize((nw, nh), Image.BILINEAR)
        im.paste(L, (int(tx - px * s_), int(ty - py * s_)), L)
    else:
        im.paste(L, (lx0, ly0), L)


def caption(im, s, y, size=56, col=(40, 30, 70)):
    d = ImageDraw.Draw(im)
    f = F(size)
    w = tl(s, f) + 120
    d.rounded_rectangle([W / 2 - w / 2, y - 60, W / 2 + w / 2, y + 60], 60, fill=col)
    text(d, (W / 2, y - 4), s, size, (255, 255, 255))


def tag(d, x, y, s, col, size=44):
    f = F(size)
    w = tl(s, f) + 70
    d.rounded_rectangle([x - w / 2, y - 38, x + w / 2, y + 38], 38, fill=col)
    text(d, (x, y - 3), s, size, (255, 255, 255))


# ------------------------------------------------------------------ characters
def limb(d, pts, w, col):
    d.line(pts, fill=col, width=int(w), joint='curve')
    for p in (pts[0], pts[-1]):
        d.ellipse([p[0] - w / 2, p[1] - w / 2, p[0] + w / 2, p[1] + w / 2], fill=col)


BROWS = {
    'smile': (0, 0, 0, 0), 'laugh': (-8, -8, -8, -8), 'sly': (-4, -24, 8, 0), 'shock': (-34, -34, -34, -34),
    'angry': (16, -4, 16, -4), 'bored': (0, 3, 0, 3), 'sus': (10, -2, -16, -16), 'worry': (-16, 4, -16, 4),
}
EYES = {'smile': 'open', 'laugh': 'happy', 'sly': 'half', 'shock': 'wide', 'angry': 'open', 'bored': 'half',
        'sus': 'half', 'worry': 'open'}
MOUTH = {'smile': 'grin', 'laugh': 'laugh', 'sly': 'smirk', 'shock': 'O', 'angry': 'frown', 'bored': 'flat',
         'sus': 'flat', 'worry': 'wobble'}

TARAF = dict(skin=(226, 176, 140), hair=(48, 34, 36), dress=(244, 164, 190), shoe=(250, 250, 250), kind='curly',
             ruffle=True, watch=True, teeth=True, sleeve=0.0)
SAHAB = dict(skin=(226, 176, 140), hair=(28, 24, 34), dress=(122, 188, 238), shoe=(255, 205, 220), kind='long',
             ruffle=False, watch=False, teeth=False, sleeve=0.4)
TARAF_P = dict(skin=(238, 194, 160), hair=(70, 44, 44), dress=(214, 186, 196), shoe=(236, 214, 208), kind='long2',
               ruffle=False, watch=False, teeth=False, sleeve=0.0, princess=True, cute=True, crown=True, aw=30)
TARAF_Q = dict(skin=(246, 211, 182), hair=(46, 30, 33), dress=(246, 190, 38), shoe=(250, 250, 250), kind='silky',
               ruffle=False, watch=False, teeth=False, sleeve=0.45, cute=True, tee=True, aw=30, brow=9)
FAJR = dict(skin=(196, 142, 106), hair=(40, 28, 30), dress=(72, 146, 152), shoe=(90, 70, 70), kind='bun',
            ruffle=False, watch=False, teeth=False, sleeve=1.0, long=True, cup=True)

TARAF_OLD_CURLY = TARAF
TARAF = TARAF_Q   # final approved Taraf design (smooth long hair, yellow tee, denim skirt)



def draw_girl(d, x, yb, k, st, t=0.0, expr='smile', talk=False, run=False, armL=0, armR=0, hip=False,
              wet=0.0, jump=0.0, lean=0.0, sip=0.0, look=0.0, mouth=None):
    skin = st['skin']
    hair = mix(st['hair'], (20, 30, 55), wet * 0.4)
    dress = mix(st['dress'], (60, 90, 150), wet * 0.5)
    yb0 = yb
    yb = yb - jump
    d.ellipse([x - 150 * k, yb0 - 16 * k, x + 150 * k, yb0 + 22 * k], fill=SHADOW)
    longd = st.get('long', False)
    # legs
    if not longd:
        for i, sx in enumerate((-44, 44)):
            lift = max(0, math.sin(t * 12 + i * math.pi)) * 55 * k if run else 0
            d.line([(x + sx * k, yb - 210 * k), (x + sx * k, yb - 36 * k - lift)], fill=skin, width=int(40 * k))
            d.ellipse([x + sx * k - 34 * k, yb - 56 * k - lift, x + sx * k + 38 * k, yb - lift + 6 * k], fill=st['shoe'])
    sway = math.sin(t * 12) * 10 * k if run else math.sin(t * 2) * 2 * k
    top = yb - 440 * k
    hem = yb - (60 if longd else 175) * k
    hw = 150 if longd else 142
    if st['kind'] == 'wavy':  # long curly hair behind the body
        hx0, hy0 = x + lean * k, yb - 575 * k
        d.ellipse([hx0 - 150 * k, hy0 - 152 * k, hx0 + 150 * k, hy0 + 124 * k], fill=hair)
        d.polygon([(hx0 - 140 * k, hy0), (hx0 + 140 * k, hy0), (hx0 + 160 * k, hy0 + 300 * k), (hx0 + 158 * k, hy0 + 410 * k),
                   (hx0 - 158 * k, hy0 + 410 * k), (hx0 - 160 * k, hy0 + 300 * k)], fill=hair)
        for i_ in range(11):
            cx_ = hx0 - 160 * k + i_ * 32 * k
            cy_ = hy0 + (412 + 24 * math.sin(i_ * 2.1 + t * 1.5)) * k
            d.ellipse([cx_ - 36 * k, cy_ - 36 * k, cx_ + 36 * k, cy_ + 36 * k], fill=hair)
        for sx_ in (-1, 1):
            for j_ in range(7):
                cy_ = hy0 + (110 + j_ * 52) * k
                cx_ = hx0 + sx_ * (158 + 7 * math.sin(j_ * 1.9 + t * 1.5)) * k
                d.ellipse([cx_ - 32 * k, cy_ - 32 * k, cx_ + 32 * k, cy_ + 32 * k], fill=hair)
    if st['kind'] == 'silky':  # long silky hair behind the body
        hx0, hy0 = x + lean * k, yb - 575 * k
        d.ellipse([hx0 - 152 * k, hy0 - 154 * k, hx0 + 152 * k, hy0 + 130 * k], fill=hair)
        R_, L_ = [], []
        for i_ in range(15):
            u = i_ / 14
            yy = hy0 + (40 + u * 390) * k
            wv = 6 * math.sin(t * 1.5 + u * 3.2) * k
            w_ = (118 + 46 * math.sin(u * math.pi * .75)) * k
            R_.append((hx0 + w_ + wv, yy)); L_.append((hx0 - w_ + wv, yy))
        d.polygon(R_ + L_[::-1], fill=hair)
        d.ellipse([hx0 - 150 * k, hy0 + 360 * k, hx0 + 150 * k, hy0 + 470 * k], fill=hair)
    if st['kind'] == 'long2':  # long straight hair behind the body
        hx0, hy0 = x + lean * k, yb - 575 * k
        d.ellipse([hx0 - 150 * k, hy0 - 150 * k, hx0 + 150 * k, hy0 + 120 * k], fill=hair)
        pts_ = [(hx0 - 138 * k, hy0 + 10 * k), (hx0 + 138 * k, hy0 + 10 * k), (hx0 + 168 * k, hy0 + 250 * k)]
        for i_ in range(9):
            pts_.append((hx0 + 152 * k - i_ * 38 * k, hy0 + (500 + (24 if i_ % 2 else 0)) * k + math.sin(t * 2 + i_) * 3 * k))
        pts_.append((hx0 - 168 * k, hy0 + 250 * k))
        d.polygon(pts_, fill=hair)
    if st.get('princess'):
        hemp = yb - 75 * k
        wst = top + 150 * k
        skirt = (216, 188, 198)
        d.polygon([(x - 78 * k, wst), (x + 78 * k, wst), (x + 178 * k + sway, hemp), (x - 178 * k + sway, hemp)], fill=skirt)
        d.ellipse([x - 178 * k + sway, hemp - 30 * k, x + 178 * k + sway, hemp + 30 * k], fill=skirt)
        for i in range(-3, 4):
            d.line([(x + i * 22 * k, wst), (x + i * 60 * k + sway, hemp + 8 * k)], fill=mix(skirt, (130, 96, 108), .22),
                   width=int(5 * k))
        d.polygon([(x - 70 * k, top + 38 * k), (x + 70 * k, top + 38 * k), (x + 42 * k, top - 10 * k), (x - 42 * k, top - 10 * k)],
                  fill=skin)
        bod = (248, 238, 228)
        d.polygon([(x - 72 * k, top + 26 * k), (x + 72 * k, top + 26 * k), (x + 68 * k, wst), (x - 68 * k, wst)], fill=bod)
        rnd = random.Random(5)
        for _ in range(46):
            px, py = x + rnd.uniform(-64, 64) * k, rnd.uniform(top + 34 * k, wst - 6 * k)
            r_ = rnd.uniform(2.5, 5) * k
            d.ellipse([px - r_, py - r_, px + r_, py + r_], fill=(255, 255, 255))
        for sx_ in (-1, 1):
            d.line([(x + sx_ * 50 * k, top + 30 * k), (x + sx_ * 54 * k, top - 8 * k)], fill=bod, width=int(8 * k))
        d.rounded_rectangle([x - 84 * k, wst - 6 * k, x + 84 * k, wst + 46 * k], 10, fill=(198, 170, 180))
        bow = (186, 132, 150)
        d.polygon([(x, wst + 20 * k), (x - 66 * k, wst - 4 * k), (x - 62 * k, wst + 50 * k)], fill=bow)
        d.polygon([(x, wst + 20 * k), (x + 66 * k, wst - 4 * k), (x + 62 * k, wst + 50 * k)], fill=bow)
        d.ellipse([x - 16 * k, wst + 6 * k, x + 16 * k, wst + 36 * k], fill=mix(bow, (255, 255, 255), .2))
        d.polygon([(x - 34 * k, wst + 52 * k), (x - 8 * k, wst + 52 * k), (x - 46 * k, hemp), (x - 100 * k, hemp)],
                  fill=mix(skirt, (255, 255, 255), .28))
        for i_ in range(-6, 7):
            d.ellipse([x + i_ * 27 * k - 15 * k + sway, hemp + 4 * k, x + i_ * 27 * k + 15 * k + sway, hemp + 36 * k],
                      fill=(252, 244, 240))
        for j_, (sx2, sy2) in enumerate(((-30, 40), (22, 70), (-8, 100))):
            r_ = (7 + 4 * math.sin(t * 4 + j_ * 2)) * k
            if r_ > 4 * k:
                cx_, cy_ = x + sx2 * k, top + sy2 * k
                d.polygon([(cx_, cy_ - r_), (cx_ + r_ * .3, cy_ - r_ * .3), (cx_ + r_, cy_), (cx_ + r_ * .3, cy_ + r_ * .3),
                           (cx_, cy_ + r_), (cx_ - r_ * .3, cy_ + r_ * .3), (cx_ - r_, cy_), (cx_ - r_ * .3, cy_ - r_ * .3)],
                          fill=(255, 214, 120))
    elif st.get('tee'):
        den = (146, 182, 226)
        hemd = yb - 150 * k
        d.polygon([(x - 80 * k, top + 190 * k), (x + 80 * k, top + 190 * k), (x + 122 * k + sway, hemd), (x - 122 * k + sway, hemd)],
                  fill=den)
        d.ellipse([x - 122 * k + sway, hemd - 22 * k, x + 122 * k + sway, hemd + 22 * k], fill=den)
        d.line([(x + sway * .3, top + 200 * k), (x + sway, hemd)], fill=mix(den, (60, 90, 140), .3), width=max(2, int(5 * k)))
        d.line([(x - 118 * k + sway, hemd + 4 * k), (x + 118 * k + sway, hemd + 4 * k)], fill=mix(den, (255, 255, 255), .45),
               width=max(2, int(5 * k)))
        d.polygon([(x - 78 * k, top), (x + 78 * k, top), (x + 92 * k, top + 222 * k), (x - 92 * k, top + 222 * k)], fill=dress)
        d.ellipse([x - 92 * k, top + 200 * k, x + 92 * k, top + 244 * k], fill=dress)
        d.ellipse([x - 40 * k, top - 14 * k, x + 40 * k, top + 36 * k], fill=skin)
        d.arc([x - 40 * k, top - 14 * k, x + 40 * k, top + 36 * k], 10, 170, fill=mix(dress, (150, 100, 10), .35), width=max(2, int(6 * k)))
        for sx_ in (-1, 1):
            d.line([(x + sx_ * 20 * k, top + 60 * k), (x + sx_ * 26 * k, top + 190 * k)], fill=mix(dress, (200, 140, 0), .22),
                   width=max(2, int(5 * k)))
    else:
        d.polygon([(x - 74 * k, top), (x + 74 * k, top), (x + hw * k + sway, hem), (x - hw * k + sway, hem)], fill=dress)
        d.ellipse([x - hw * k + sway, hem - 28 * k, x + hw * k + sway, hem + 28 * k], fill=dress)
    if st['ruffle']:
        rc = mix(dress, (255, 255, 255), 0.12)
        d.polygon([(x - 108 * k, top + 6 * k), (x + 108 * k, top + 6 * k), (x + 120 * k, top + 118 * k),
                   (x - 120 * k, top + 118 * k)], fill=rc)
        for i in range(-3, 4):
            d.ellipse([x + i * 34 * k - 20 * k, top + 98 * k, x + i * 34 * k + 20 * k, top + 138 * k], fill=rc)
        rnd = random.Random(7)
        for _ in range(26):
            px = x + rnd.uniform(-100, 100) * k
            py = top + rnd.uniform(14, 120) * k
            d.ellipse([px - 4 * k, py - 4 * k, px + 4 * k, py + 4 * k], fill=mix(rc, (255, 255, 255), 0.7))
        for sx in (-1, 1):  # shoulder frills
            d.ellipse([x + sx * 86 * k - 44 * k, top - 14 * k, x + sx * 86 * k + 44 * k, top + 70 * k], fill=rc)
    if longd:
        rnd = random.Random(3)
        for _ in range(30):
            px = x + rnd.uniform(-120, 120) * k
            py = rnd.uniform(top + 120 * k, hem)
            d.ellipse([px - 7 * k, py - 7 * k, px + 7 * k, py + 7 * k], fill=mix(dress, (255, 255, 255), 0.35))
    # neck
    hx, hy = x + lean * k, yb - 575 * k
    d.rectangle([x - 26 * k, hy + 80 * k, x + 26 * k, top + 16 * k], fill=skin)
    def draw_arms():
        for side, ang in ((-1, armL), (1, armR)):
            sx_, sy_ = x + side * 80 * k, top + 34 * k
            if hip:
                pts = [(sx_, sy_), (sx_ + side * 96 * k, sy_ + 78 * k), (x + side * 62 * k, sy_ + 150 * k)]
            elif st.get('cup') and side == 1:
                hxp = sx_ + (-20 - 20 * sip) * k
                hyp = sy_ + (120 - 150 * sip) * k
                pts = [(sx_, sy_), (sx_ + 78 * k, sy_ + 100 * k), (hxp, hyp)]
            else:
                a = math.radians(ang)
                pts = [(sx_, sy_), (sx_ + side * math.sin(a) * 175 * k, sy_ + math.cos(a) * 175 * k)]
            limb(d, pts, st.get('aw', 38) * k, skin)
            if st['sleeve'] > 0:
                sl = st['sleeve']
                if len(pts) == 2:
                    ep = (pts[0][0] + (pts[1][0] - pts[0][0]) * sl, pts[0][1] + (pts[1][1] - pts[0][1]) * sl)
                    limb(d, [pts[0], ep], (st.get('aw', 34) + 16) * k, dress)
                else:
                    limb(d, pts[:2], 50 * k, dress)
                    if sl >= 1:
                        q = (pts[1][0] + (pts[2][0] - pts[1][0]) * .7, pts[1][1] + (pts[2][1] - pts[1][1]) * .7)
                        limb(d, [pts[1], q], 50 * k, dress)
            hp = pts[-1]
            hr_ = (24 if st.get('cute') else 28) * k
            d.ellipse([hp[0] - hr_, hp[1] - hr_, hp[0] + hr_, hp[1] + hr_], fill=skin)
            if st['watch'] and side == 1 and len(pts) == 2:
                wp = (pts[0][0] + (pts[1][0] - pts[0][0]) * .82, pts[0][1] + (pts[1][1] - pts[0][1]) * .82)
                d.ellipse([wp[0] - 24 * k, wp[1] - 24 * k, wp[0] + 24 * k, wp[1] + 24 * k], fill=(232, 52, 100))
            if st.get('cup') and side == 1:
                cxp, cyp = hp
                d.rounded_rectangle([cxp - 36 * k, cyp - 62 * k, cxp + 36 * k, cyp + 14 * k], 12, fill=(255, 255, 255))
                d.ellipse([cxp - 36 * k, cyp - 72 * k, cxp + 36 * k, cyp - 52 * k], fill=(96, 56, 38))
                d.arc([cxp + 20 * k, cyp - 52 * k, cxp + 66 * k, cyp - 8 * k], 270, 90, fill=(255, 255, 255), width=int(9 * k))
                for j in range(2):
                    pts2 = [(cxp - 12 * k + j * 26 * k + math.sin(t * 3 + yy / 18 + j) * 8 * k, cyp - 90 * k - yy * k)
                            for yy in range(0, 70, 8)]
                    d.line(pts2, fill=(255, 255, 255), width=int(6 * k))
    if st['kind'] not in ('long', 'long2', 'wavy', 'silky'):
        draw_arms()
    # back hair
    wob = lambda i: math.sin(t * 3.5 + i) * 5 * k
    if st['kind'] == 'curly':
        d.ellipse([hx - 160 * k, hy - 156 * k, hx + 160 * k, hy + 140 * k], fill=hair)
        for i in range(15):
            th = math.pi * (1.02 + i * 0.092 * 1.0)  # sweep top & sides
            th = math.pi * (0.95 + 1.15 * i / 14)
            rr = 150 * k
            cxp = hx + math.cos(th) * rr * 1.08
            cyp = hy - 5 * k + math.sin(th) * rr * 0.98
            r = (50 + (i % 3) * 7) * k * (1 - 0.3 * wet)
            d.ellipse([cxp - r + wob(i), cyp - r, cxp + r + wob(i), cyp + r], fill=hair)
        for j in range(5):  # long curls falling on the right side
            r = (46 - j * 3) * k * (1 - 0.3 * wet)
            cxp = hx + (122 + 12 * math.sin(j * 1.7)) * k
            cyp = hy + (60 + j * 62) * k
            d.ellipse([cxp - r, cyp - r, cxp + r, cyp + r], fill=hair)
        for j in range(3):
            r = 40 * k * (1 - 0.3 * wet)
            cxp = hx - (128 + 10 * math.sin(j * 2.1)) * k
            cyp = hy + (60 + j * 60) * k
            d.ellipse([cxp - r, cyp - r, cxp + r, cyp + r], fill=hair)
    elif st['kind'] == 'long':
        flare = 1 - 0.2 * wet
        d.ellipse([hx - 150 * k, hy - 150 * k, hx + 150 * k, hy + 120 * k], fill=hair)
        d.polygon([(hx - 146 * k, hy - 20 * k), (hx + 146 * k, hy - 20 * k), (hx + 150 * k * flare, hy + 360 * k),
                   (hx - 150 * k * flare, hy + 360 * k)], fill=hair)
        d.ellipse([hx - 150 * k * flare, hy + 320 * k, hx + 150 * k * flare, hy + 400 * k], fill=hair)
    elif st['kind'] == 'wavy':
        hl = mix(hair, (170, 120, 110), .30)
        for sx_ in (-1, 1):
            n_ = 16
            pos_ = []
            for j_ in range(n_ + 1):
                u = j_ / n_
                yy = hy + 20 * k + (top + 340 * k - (hy + 20 * k)) * u
                xc = hx + (x - hx) * u + sx_ * (112 + 14 * math.sin(u * 8.5 + t * 1.2 + (1 if sx_ > 0 else 0))) * k
                rr = (37 + 5 * math.sin(u * 11) - 6 * u) * k
                pos_.append((xc, yy, rr))
                d.ellipse([xc - rr, yy - rr, xc + rr, yy + rr], fill=hair)
            for j_ in range(2, 15, 3):
                xc, yy, rr = pos_[j_]
                d.arc([xc - rr * .6, yy - rr * .6, xc + rr * .35, yy + rr * .35], 200, 335, fill=hl, width=max(2, int(6 * k)))
    elif st['kind'] in ('long2', 'silky'):
        hl = mix(hair, (200, 150, 120), .30)
        y0_, y1_ = hy + 20 * k, top + 310 * k
        for sx_ in (-1, 1):
            L_, R_, C_ = [], [], []
            for j_ in range(13):
                u = j_ / 12
                yy = y0_ + (y1_ - y0_) * u
                xc = hx + (x - hx) * u + sx_ * (124 + 9 * math.sin(u * 5.5 + t * 1.5)) * k
                hw_ = (31 + 4 * math.sin(u * 7)) * k * (1 - .25 * u * u)
                L_.append((xc - hw_, yy)); R_.append((xc + hw_, yy)); C_.append((xc + sx_ * 6 * k, yy))
            d.polygon(L_ + R_[::-1], fill=hair)
            d.ellipse([L_[0][0], y0_ - 24 * k, R_[0][0], y0_ + 30 * k], fill=hair)
            ex_, ey_ = (L_[-1][0] + R_[-1][0]) / 2, y1_
            d.ellipse([ex_ - 29 * k, ey_ - 22 * k, ex_ + 29 * k, ey_ + 26 * k], fill=hair)
            d.line(C_[1:11], fill=hl, width=max(2, int(9 * k)), joint='curve')
    else:  # bun
        d.ellipse([hx - 138 * k, hy - 140 * k, hx + 138 * k, hy + 110 * k], fill=hair)
        d.ellipse([hx - 70 * k, hy - 215 * k, hx + 70 * k, hy - 85 * k], fill=hair)
    if st['kind'] in ('long', 'long2', 'wavy', 'silky'):
        draw_arms()
    # head
    for sx in (-1, 1):
        d.ellipse([hx + sx * 118 * k - 26 * k, hy - 8 * k, hx + sx * 118 * k + 26 * k, hy + 52 * k], fill=skin)
    d.ellipse([hx - 122 * k, hy - 118 * k, hx + 122 * k, hy + 122 * k], fill=skin)
    if st['kind'] == 'bun':
        for sx in (-1, 1):
            d.ellipse([hx + sx * 120 * k - 8 * k, hy + 44 * k, hx + sx * 120 * k + 8 * k, hy + 62 * k], fill=(240, 200, 90))
    # front hair
    d.chord([hx - 128 * k, hy - 130 * k, hx + 128 * k, hy + 126 * k], 203, 337, fill=hair)
    if st['kind'] == 'curly':
        for i in range(-3, 4):
            r = (34 + (i % 2) * 6) * k * (1 - 0.3 * wet)
            cxp = hx + i * 38 * k + wob(i) * .5
            cyp = hy - 60 * k + abs(i) * 7 * k
            d.ellipse([cxp - r, cyp - r, cxp + r, cyp + r], fill=hair)
        if wet < .3:
            for i in range(6):  # flyaway strands
                sx0 = hx + (-90 + i * 36) * k
                pts = [(sx0 + math.sin(t * 5 + i) * 6 * k + j * (i - 2.5) * 5 * k, hy - 150 * k - j * 18 * k)
                       for j in range(6)]
                d.line(pts, fill=hair, width=int(6 * k))
    elif st['kind'] in ('wavy', 'silky'):
        for sx_ in (-1, 1):
            d.polygon([(hx, hy - 128 * k), (hx + sx_ * 132 * k, hy - 74 * k), (hx + sx_ * 136 * k, hy + 50 * k),
                       (hx + sx_ * 112 * k, hy - 6 * k), (hx + sx_ * 84 * k, hy - 52 * k), (hx + sx_ * 42 * k, hy - 82 * k),
                       (hx + sx_ * 6 * k, hy - 98 * k)], fill=hair)
        d.arc([hx - 104 * k, hy - 128 * k, hx + 104 * k, hy + 4 * k], 222, 318, fill=mix(hair, (170, 120, 110), .35), width=max(2, int(9 * k)))
    elif st['kind'] == 'long2':
        d.arc([hx - 104 * k, hy - 126 * k, hx + 104 * k, hy + 6 * k], 222, 318, fill=mix(hair, (210, 160, 130), .35), width=max(2, int(10 * k)))
        for sx_ in (-1, 1):
            d.polygon([(hx, hy - 124 * k), (hx + sx_ * 128 * k, hy - 70 * k), (hx + sx_ * 132 * k, hy + 44 * k),
                       (hx + sx_ * 106 * k, hy + 4 * k), (hx + sx_ * 90 * k, hy - 40 * k), (hx + sx_ * 52 * k, hy - 62 * k),
                       (hx + sx_ * 10 * k, hy - 78 * k)], fill=hair)
    elif st['kind'] == 'long':
        d.polygon([(hx - 126 * k, hy - 30 * k), (hx - 60 * k, hy - 78 * k), (hx + 126 * k, hy - 30 * k),
                   (hx + 126 * k, hy + 10 * k), (hx + 100 * k, hy - 20 * k), (hx - 20 * k, hy - 40 * k),
                   (hx - 126 * k, hy + 30 * k)], fill=hair)
        for j, (ox, oy, r) in enumerate(((84, -84, 26), (116, -72, 22), (100, -108, 24)) if st['kind'] == 'long' else ()):
            d.ellipse([hx + ox * k - r * k, hy + oy * k - r * k, hx + ox * k + r * k, hy + oy * k + r * k],
                      fill=(255, 255, 255), outline=(190, 215, 240), width=int(4 * k))
    else:
        d.polygon([(hx - 126 * k, hy - 20 * k), (hx - 20 * k, hy - 70 * k), (hx + 126 * k, hy - 20 * k),
                   (hx + 126 * k, hy + 14 * k), (hx - 126 * k, hy + 14 * k)], fill=hair)
        d.polygon([(hx - 126 * k, hy), (hx - 20 * k, hy - 40 * k), (hx - 126 * k, hy + 30 * k)], fill=hair)
    if st.get('crown'):
        cb = hy - 108 * k
        pts = [(hx - 98 * k, cb + 14 * k)]
        for i in range(-4, 5):
            pts.append((hx + i * 24 * k, cb - ((112 - abs(i) * 17) if i % 2 == 0 else (48 - abs(i) * 4)) * k))
        pts.append((hx + 98 * k, cb + 14 * k))
        d.polygon(pts, fill=(228, 232, 242), outline=(150, 158, 178))
        d.line(pts + [pts[0]], fill=(150, 158, 178), width=max(1, int(4 * k)))
        d.rounded_rectangle([hx - 100 * k, cb + 2 * k, hx + 100 * k, cb + 24 * k], 8, fill=(208, 214, 228),
                            outline=(150, 158, 178), width=max(1, int(3 * k)))
        for gx, gy, gr, gc in ((0, 108, 13, (232, 60, 140)), (-48, 78, 10, (60, 190, 140)), (48, 78, 10, (60, 190, 140)),
                               (-96, 40, 8, (232, 60, 140)), (96, 40, 8, (232, 60, 140))):
            d.ellipse([hx + gx * k - gr * k, cb - gy * k + 12 * k - gr * k, hx + gx * k + gr * k, cb - gy * k + 12 * k + gr * k],
                      fill=gc)
    # face
    ex = EYES[expr]
    ey = hy + 24 * k
    big = 1.0 if st['kind'] != 'bun' else 0.8
    if ex == 'open' and (t % 3.3) < 0.12:
        ex = 'closed'
    for side in (-1, 1):
        cxp = hx + side * 52 * k
        lk = look * 6 * k
        if ex in ('open', 'half'):
            rx, ry = (28 if st.get('cute') else 25) * k * big, (35 if st.get('cute') else 31) * k * big
            d.ellipse([cxp - rx, ey - ry, cxp + rx, ey + ry], fill=(36, 24, 28))
            d.ellipse([cxp - rx * .55 + lk, ey - ry * .7, cxp + rx * .05 + lk, ey - ry * .1], fill=(255, 255, 255))
            d.ellipse([cxp + rx * .1 + lk, ey + ry * .2, cxp + rx * .45 + lk, ey + ry * .55], fill=(255, 255, 255))
            if st.get('cute'):
                d.ellipse([cxp + rx * .25 + lk, ey - ry * .1, cxp + rx * .6 + lk, ey + ry * .25], fill=(255, 255, 255))
                for ang_, ln_ in ((-35, 20), (-15, 22)):
                    ax = cxp + side * rx * .85
                    ay = ey - ry * .55
                    bx = ax + side * math.cos(math.radians(ang_)) * ln_ * k
                    by_ = ay + math.sin(math.radians(ang_)) * ln_ * k
                    d.line([(ax, ay), (bx, by_)], fill=(36, 24, 28), width=max(2, int(5 * k)))
            if ex == 'half':
                d.rectangle([cxp - rx - 2, ey - ry - 2, cxp + rx + 2, ey - ry * 0.15], fill=skin)
                d.line([(cxp - rx, ey - ry * .15), (cxp + rx, ey - ry * .15)], fill=(36, 24, 28), width=int(7 * k))
        elif ex == 'wide':
            rx, ry = 34 * k * big, 40 * k * big
            d.ellipse([cxp - rx, ey - ry, cxp + rx, ey + ry], fill=(255, 255, 255), outline=(36, 24, 28), width=int(5 * k))
            d.ellipse([cxp - 13 * k + lk, ey - 13 * k, cxp + 13 * k + lk, ey + 13 * k], fill=(36, 24, 28))
        elif ex == 'happy':
            d.arc([cxp - 28 * k, ey - 26 * k, cxp + 28 * k, ey + 30 * k], 200, 340, fill=(36, 24, 28), width=int(9 * k))
        else:
            d.line([(cxp - 26 * k, ey + 4 * k), (cxp + 26 * k, ey + 4 * k)], fill=(36, 24, 28), width=int(8 * k))
    bw = BROWS[expr]
    by = hy - 38 * k
    bt = 11 * k if st['kind'] == 'bun' else 8 * k
    for side, (i_, o_) in ((-1, (bw[0], bw[1])), (1, (bw[2], bw[3]))):
        cxp = hx + side * 52 * k
        outer = (cxp + side * 34 * k, by + o_ * k)
        inner = (cxp - side * 30 * k, by + i_ * k)
        if st.get('cute'):
            mid = ((outer[0] + inner[0]) / 2, min(outer[1], inner[1]) - 9 * k)
            d.line([outer, mid, inner], fill=mix(hair, (0, 0, 0), .1), width=max(2, int(st.get('brow', 6) * k)), joint='curve')
        else:
            d.line([outer, inner], fill=mix(hair, (0, 0, 0), .2), width=int(bt + 4 * k))
    for side in (-1, 1):
        d.ellipse([hx + side * 86 * k - 24 * k, hy + 52 * k, hx + side * 86 * k + 24 * k, hy + 86 * k],
                  fill=mix(skin, (235, 90, 120), 0.32))
    # mouth
    mo = MOUTH[expr]
    my = hy + 78 * k
    ta = abs(math.sin(t * 13)) if mouth is None else mouth
    if mouth is not None:
        talk = True
    if talk and mo in ('grin', 'smirk', 'frown', 'flat', 'wobble', 'laugh'):
        mo = 'talk'
    red, dark = (150, 40, 55), (110, 25, 40)
    if mo == 'grin' and st.get('cute'):
        d.arc([hx - 38 * k, my - 18 * k, hx + 38 * k, my + 26 * k], 15, 165, fill=dark, width=max(2, int(9 * k)))
    elif mo == 'grin' or mo == 'laugh':
        h_ = 46 if mo == 'grin' else 62
        d.pieslice([hx - 48 * k, my - 30 * k, hx + 48 * k, my + h_ * k], 0, 180, fill=red)
        if st['teeth']:
            d.rounded_rectangle([hx - 14 * k, my - 6 * k, hx - 2 * k, my + 13 * k], 3, fill=(255, 255, 255))
            d.rounded_rectangle([hx + 2 * k, my - 6 * k, hx + 14 * k, my + 13 * k], 3, fill=(255, 255, 255))
        else:
            d.rectangle([hx - 40 * k, my - 6 * k, hx + 40 * k, my + 8 * k], fill=(255, 255, 255))
    elif mo == 'talk':
        hh = (12 + 26 * ta) * k
        d.ellipse([hx - 30 * k, my - hh * .4, hx + 30 * k, my + hh], fill=red)
        if st['teeth']:
            d.rounded_rectangle([hx - 13 * k, my - hh * .4, hx - 2 * k, my - hh * .4 + 10 * k], 3, fill=(255, 255, 255))
            d.rounded_rectangle([hx + 2 * k, my - hh * .4, hx + 13 * k, my - hh * .4 + 10 * k], 3, fill=(255, 255, 255))
    elif mo == 'O':
        d.ellipse([hx - 22 * k, my - 12 * k, hx + 22 * k, my + 40 * k], fill=red)
    elif mo == 'frown':
        d.arc([hx - 36 * k, my + 2 * k, hx + 36 * k, my + 52 * k], 200, 340, fill=dark, width=int(9 * k))
    elif mo == 'smirk':
        d.arc([hx - 30 * k, my - 14 * k, hx + 52 * k, my + 30 * k], 15, 150, fill=dark, width=int(9 * k))
    elif mo == 'wobble':
        pts = [(hx - 36 * k + i * 12 * k, my + 10 * k + math.sin(i * 1.6 + t * 18) * 5 * k) for i in range(7)]
        d.line(pts, fill=dark, width=int(8 * k))
    else:
        d.line([(hx - 28 * k, my + 10 * k), (hx + 28 * k, my + 10 * k)], fill=dark, width=int(8 * k))
    # drips when wet
    if wet > .45:
        for i in range(7):
            ph = (t * 1.3 + i * .29) % 1
            dxp = hx + (-110 + i * 37) * k
            dyp = hy + (90 + ph * 330) * k
            d.ellipse([dxp - 8 * k, dyp - 12 * k, dxp + 8 * k, dyp + 12 * k], fill=(150, 210, 255))


def sweat(d, x, y, t):
    yy = y + (t * 60) % 40
    d.polygon([(x, yy - 34), (x - 16, yy), (x + 16, yy)], fill=(140, 205, 255))
    d.ellipse([x - 16, yy - 14, x + 16, yy + 18], fill=(140, 205, 255))
