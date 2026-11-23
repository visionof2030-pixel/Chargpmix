import math, random
from PIL import Image, ImageDraw
import lib
from lib import *

PINK = (226, 70, 130)
BLUE = (60, 130, 215)
TEAL = (40, 130, 135)
K = 1.15
FLOOR = 1900
YB = 2010


def on(t, a, b):
    return a <= t < b


# ------------------------------------------------------------------ backgrounds
def bg_title():
    im = vgrad((255, 214, 232), (255, 243, 198))
    d = ImageDraw.Draw(im)
    cx, cy = W / 2, 900
    for i in range(24):
        a0 = i * math.pi * 2 / 24
        a1 = a0 + math.pi / 24
        d.polygon([(cx, cy), (cx + math.cos(a0) * 2400, cy + math.sin(a0) * 2400),
                   (cx + math.cos(a1) * 2400, cy + math.sin(a1) * 2400)], fill=(255, 228, 240))
    d.rectangle([0, 2060, W, H], fill=(255, 196, 120))
    d.rectangle([0, 2060, W, 2092], fill=(240, 160, 90))
    return im


def bg_room():
    im = vgrad((214, 224, 250), (236, 232, 252), 0, FLOOR)
    d = ImageDraw.Draw(im)
    for x in range(0, W, 120):
        d.rectangle([x, 0, x + 40, FLOOR], fill=(206, 216, 246))
    d.rectangle([0, FLOOR - 40, W, FLOOR], fill=(250, 245, 240))
    d.rectangle([0, FLOOR, W, H], fill=(222, 178, 134))
    for y in range(FLOOR, H, 110):
        d.line([(0, y), (W, y)], fill=(204, 160, 118), width=6)
    # window with curtains
    d.rounded_rectangle([860, 520, 1300, 1120], 20, fill=(255, 255, 255))
    d.rectangle([880, 540, 1280, 1100], fill=(150, 210, 255))
    d.ellipse([1130, 600, 1240, 710], fill=(255, 222, 90))
    d.ellipse([930, 700, 1080, 770], fill=(255, 255, 255))
    d.ellipse([990, 670, 1110, 760], fill=(255, 255, 255))
    d.line([(1080, 540), (1080, 1100)], fill=(255, 255, 255), width=14)
    d.line([(880, 820), (1280, 820)], fill=(255, 255, 255), width=14)
    d.polygon([(820, 500), (930, 500), (900, 1160), (820, 1160)], fill=(255, 170, 200))
    d.polygon([(1240, 500), (1350, 500), (1350, 1160), (1280, 1160)], fill=(255, 170, 200))
    # bed on the left
    d.rounded_rectangle([-60, 1500, 560, 1960], 30, fill=(180, 120, 200))
    d.rounded_rectangle([-60, 1380, 120, 1960], 30, fill=(150, 100, 175))
    d.rounded_rectangle([-40, 1560, 540, 1700], 40, fill=(255, 240, 248))
    d.rounded_rectangle([40, 1470, 260, 1580], 40, fill=(255, 255, 255))
    # posters
    d.rounded_rectangle([200, 560, 440, 860], 12, fill=(255, 240, 160))
    d.ellipse([250, 620, 390, 760], fill=(255, 140, 170))
    d.rounded_rectangle([480, 640, 700, 860], 12, fill=(190, 240, 210))
    d.polygon([(500, 840), (590, 700), (680, 840)], fill=(90, 180, 130))
    return im


def bg_bath():
    im = Image.new('RGB', (W, H), (190, 236, 242))
    d = ImageDraw.Draw(im)
    for x in range(0, W, 150):
        d.line([(x, 0), (x, FLOOR)], fill=(246, 252, 252), width=7)
    for y in range(0, FLOOR, 150):
        d.line([(0, y), (W, y)], fill=(246, 252, 252), width=7)
    d.rectangle([0, FLOOR - 30, W, FLOOR], fill=(120, 175, 190))
    d.rectangle([0, FLOOR, W, H], fill=(150, 204, 214))
    for x in range(-60, W, 200):
        d.line([(x, FLOOR), (x - 160, H)], fill=(190, 232, 240), width=8)
    for y in range(FLOOR, H, 140):
        d.line([(0, y), (W, y)], fill=(190, 232, 240), width=8)
    # pipe + showerhead
    d.rectangle([628, 0, 652, 640], fill=(170, 180, 190))
    d.polygon([(500, 760), (780, 760), (700, 690), (580, 690)], fill=(150, 160, 175))
    d.ellipse([500, 730, 780, 790], fill=(120, 130, 145))
    # tap knob
    d.rounded_rectangle([1110, 1330, 1190, 1370], 10, fill=(150, 160, 175))
    d.ellipse([1118, 1300, 1182, 1400], fill=(200, 210, 220))
    # door frame
    d.rectangle([1170, 600, W, FLOOR], fill=(250, 245, 235))
    d.rectangle([1200, 640, W, FLOOR], fill=(255, 246, 214))
    return im


def bg_hall():
    im = Image.new('RGB', (W, H), (247, 242, 226))
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, W, 300], fill=(252, 252, 250))
    d.rectangle([0, 300, W, 345], fill=(122, 84, 60))
    d.rectangle([0, 1100, W, 1140], fill=(122, 84, 60))
    d.rectangle([0, FLOOR - 30, W, FLOOR], fill=(250, 250, 246))
    d.rectangle([0, FLOOR, W, H], fill=(224, 212, 188))
    for y in range(FLOOR, H, 150):
        d.line([(0, y), (W, y)], fill=(210, 197, 172), width=6)
    # frames
    for (x0, y0, x1, y1, c) in ((560, 520, 780, 800, (255, 214, 224)), (840, 560, 1060, 760, (200, 232, 252)),
                                (1120, 500, 1330, 800, (214, 240, 214))):
        d.rectangle([x0 - 14, y0 - 14, x1 + 14, y1 + 14], fill=(122, 84, 60))
        d.rectangle([x0, y0, x1, y1], fill=c)
        d.ellipse([x0 + 40, y0 + 40, x1 - 40, y1 - 40], fill=mix(c, (255, 255, 255), .5))
    # bathroom door (left), closed
    d.rectangle([20, 560, 360, FLOOR], fill=(250, 245, 235))
    return im


def bg_end():
    im = vgrad((70, 40, 120), (200, 80, 150))
    d = ImageDraw.Draw(im)
    rnd = random.Random(5)
    for _ in range(70):
        x, y, r = rnd.randint(0, W), rnd.randint(0, 1800), rnd.randint(4, 12)
        d.ellipse([x - r, y - r, x + r, y + r], fill=(255, 240, 200))
    d.rectangle([0, 2080, W, H], fill=(60, 30, 100))
    return im


# ------------------------------------------------------------------ scene 1 : title
def s_title(im, t):
    d = ImageDraw.Draw(im)
    rnd = random.Random(11)
    cols = [(255, 90, 140), (255, 200, 60), (90, 190, 255), (140, 220, 120), (190, 120, 240)]
    for i in range(70):
        x0 = rnd.uniform(0, W)
        sp = rnd.uniform(220, 520)
        y = (rnd.uniform(0, H) + t * sp) % (H + 100) - 50
        x = x0 + math.sin(t * 2 + i) * 40
        r = rnd.uniform(10, 20)
        d.rectangle([x - r, y - r / 2, x + r, y + r / 2], fill=cols[i % 5])
    s = pop((t - .2) / .7)
    if s > 0.02:
        text(d, (W / 2 + 10, 560 + 12), 'ترف', int(430 * s), (150, 40, 90))
        text(d, (W / 2, 560), 'ترف', int(430 * s), (230, 60, 130), stroke=16, sfill=(255, 255, 255))
    if t > 1.0:
        s = pop((t - 1.0) / .5)
        w = 420 * s
        d.rounded_rectangle([W / 2 - w, 880, W / 2 + w, 1010], 60, fill=(255, 170, 40))
        if s > .6:
            text(d, (W / 2, 942), 'الحلقة ١', 80, (255, 255, 255))
    if t > 1.5:
        s = pop((t - 1.5) / .5)
        text(d, (W / 2, 1100), 'مقلب الدش', int(150 * s), (90, 50, 160), stroke=8)
    jump = abs(math.sin(t * 5)) * 70
    draw_girl(d, W / 2, 2050, 1.0, TARAF, t, 'laugh' if int(t * 2) % 2 else 'smile', run=False, jump=jump,
              armL=40 + 20 * math.sin(t * 8), armR=150 + 30 * math.sin(t * 9))


# ------------------------------------------------------------------ scene 2 : Sahab's room
def s_room(im, t):
    d = ImageDraw.Draw(im)
    if on(t, .3, 2.7):
        caption(im, 'ظهرية يوم من أيام الصيف الحارة', 230)
    # Sahab
    sx = 470
    exit_s = smooth((t - 12.0) / 1.0)
    sx = sx + exit_s * 1500
    sah_expr = 'bored'
    if on(t, 7.2, 9.9):
        sah_expr = 'sus'
    if on(t, 9.9, 12):
        sah_expr = 'worry'
    # Taraf
    tx = 990
    if t < 2.6:
        tx = 1900
    elif t < 3.5:
        tx = 1900 - (1900 - 990) * smooth((t - 2.6) / .9)
    tx += smooth((t - 12.0) / .9) * 1600
    running = (2.6 <= t < 3.5) or t >= 12.0
    t_expr = 'smile'
    if on(t, 3.5, 7.2):
        t_expr = 'sly'
    if on(t, 9.9, 11.9):
        t_expr = 'laugh'
    sjump = abs(math.sin(t * 3)) * 6 + (abs(math.sin(t * 12)) * 30 if t >= 12 else 0)
    draw_girl(d, sx, YB, K, SAHAB, t, sah_expr, talk=on(t, 7.2, 9.9), run=(t >= 12.0), jump=sjump if t >= 12 else 0,
              armL=8, armR=8, lean=-6 * math.sin(t * 1.5) if t < 3 else 0)
    tj = abs(math.sin(t * 12)) * 40 if running else 0
    arm = 20 + (80 + 40 * math.sin(t * 6) if on(t, 3.5, 7.2) else 0)
    draw_girl(d, tx, YB, K, TARAF, t, t_expr, talk=on(t, 3.5, 7.2) or on(t, 9.9, 11.9), run=running, jump=tj,
              armL=15, armR=arm if not running else 60)
    if on(t, 0, 2.5):
        tag(d, sx, YB + 90, 'سحاب', BLUE)
    if on(t, 3.6, 6.0):
        tag(d, tx, YB + 90, 'ترف', PINK)
    # bubbles
    if on(t, .8, 2.6):
        bubble(im, t - .8, 'ووف.. طفشانة!', 'سحاب', BLUE, (sx, YB - 760 * K), sx, 640, size=76)
    if on(t, 3.5, 7.2):
        bubble(im, t - 3.5, 'سحاب! توي مكتشفة أحلى طريقة تبردين فيها على قلبك في ذا الحر!', 'ترف', PINK,
               (tx - 20, YB - 800 * K), 760, 480)
    if on(t, 7.2, 9.9):
        bubble(im, t - 7.2, 'آخر مرة قلتي كذا.. وانقرصت!', 'سحاب', BLUE, (sx + 20, YB - 800 * K), 560, 560)
    if on(t, 9.9, 11.9):
        bubble(im, t - 9.9, 'تعالي بس! تجربة عالمية وناسة!', 'ترف', PINK, (tx - 20, YB - 800 * K), 900, 560)


# ------------------------------------------------------------------ scene 3 : bathroom
def drops(d, t, t0, x0, y0, ymax, fade=1.0):
    rnd = random.Random(21)
    col = mix((150, 205, 255), (210, 235, 255), .3)
    for i in range(70):
        off = rnd.uniform(-1, 1)
        sp = rnd.uniform(1000, 1500)
        y = y0 + ((t - t0) * sp + rnd.uniform(0, 1400)) % 1400
        if y > ymax:
            continue
        spread = 50 + (y - y0) * 0.14
        x = x0 + off * spread
        d.line([(x, y), (x + off * 4, y + 48)], fill=col, width=9)


def s_bath(im, t):
    d = ImageDraw.Draw(im)
    sx = 640
    if t < 1.3:
        sx = -300 + (640 + 300) * smooth(t / 1.3)
    tx = 1000
    if t < 1.5:
        tx = -600 + (1000 + 600) * smooth(t / 1.5)
    if t >= 6.0:
        tx = 1000 + 700 * smooth((t - 6.0) / 1.2)
    wet = c01((t - 5.5) / 1.3)
    # puddle
    if wet > 0:
        pr = 60 + wet * 330
        d.ellipse([sx - pr, YB - 30, sx + pr, YB + 40], fill=(130, 190, 235))
    entering = t < 1.5
    # tap knob rotation
    ang = 0 if t < 5.0 else smooth((t - 5.0) / .5) * 80
    kx, ky = 1150, 1350
    ca, sa = math.cos(math.radians(ang)), math.sin(math.radians(ang))
    d.line([(kx - 60 * ca, ky - 60 * sa), (kx + 60 * ca, ky + 60 * sa)], fill=(110, 120, 135), width=24)
    # Sahab
    s_expr = 'worry' if t < 5.5 else ('shock' if t < 7.5 else 'angry')
    if t < 1.4:
        s_expr = 'bored'
    draw_girl(d, sx, YB, K, SAHAB, t, s_expr, talk=on(t, 5.6, 7.0) or on(t, 10.1, 12), run=entering, wet=wet,
              armL=10 + (60 * math.sin(t * 14) * wet if wet > 0 and t < 8 else 0), armR=10,
              jump=(abs(math.sin(t * 25)) * 18 if on(t, 5.6, 6.6) else 0))
    # Taraf
    t_expr = 'laugh' if (entering or t >= 6.0) else 'sly'
    reach = on(t, 5.0, 6.0)
    draw_girl(d, tx, YB, K, TARAF, t, t_expr, talk=on(t, 1.5, 5.0), run=(entering or t >= 6.0), armL=14,
              armR=134 if reach else 14, jump=abs(math.sin(t * 12)) * 42 if (entering or t >= 6.0) else 0)
    if t > 5.3:
        drops(d, t, 5.3, 640, 770, FLOOR + 90)
    # door closing
    if t >= 7.0:
        w = 240 * smooth((t - 7.0) / .5)
        d.rectangle([1200, 640, 1200 + w, FLOOR], fill=(160, 110, 80))
        if w > 200:
            d.ellipse([1200 + w - 60, 1280, 1200 + w - 30, 1310], fill=(240, 200, 90))
    if on(t, 7.5, 8.4):
        s = pop((t - 7.5) / .25)
        text(d, (1300, 1180), 'كلِك!', int(100 * s), (255, 255, 255), stroke=8, sfill=(80, 50, 40))
    # bubbles
    if on(t, 1.5, 5.0):
        bubble(im, t - 1.5, 'الوقوف تحت الدش بملابسك قمة الانتعاش! وأنا بسويها معك!', 'ترف', PINK,
               (tx - 20, YB - 800 * K), 860, 440)
    if on(t, 5.6, 7.0):
        bubble(im, t - 5.6, 'آآآه! باردة!!', 'سحاب', BLUE, (sx + 10, YB - 790 * K), 540, 540, size=80)
    if on(t, 7.6, 10.0):
        bubble(im, t - 7.6, 'استمتعي بالمغامرة يا سحاب!', 'ترف (من خلف الباب)', PINK, (1300, 1160), 900, 520)
    if on(t, 10.1, 12.0):
        sh = math.sin(t * 40) * 8
        text(d, (W / 2 + sh, 640), 'ترررف!!!', 210, (214, 40, 60), stroke=14)


# ------------------------------------------------------------------ scene 4 : hallway
def s_hall(im, t):
    d = ImageDraw.Draw(im)
    # door opening animation (bathroom door at left)
    if t >= 17.2:
        o = pop((t - 17.2) / .35)
        d.rectangle([60, 600, 340, FLOOR], fill=(255, 250, 235))
        d.rectangle([60, 600, 340, FLOOR], fill=(235, 246, 250))
        dw = 280 * (1 - c01(o) * .85)
        d.rectangle([60, 600, 60 + dw, FLOOR], fill=(160, 110, 80))
        for i in range(8):  # steam
            yy = 900 + i * 110 - ((t - 17.2) * 60) % 110
            d.ellipse([90 + i * 12, yy, 330 - i * 8, yy + 110], fill=(246, 252, 255))
    else:
        d.rectangle([60, 600, 340, FLOOR], fill=(160, 110, 80))
        d.rectangle([120, 680, 280, 1000], outline=(130, 85, 62), width=8)
        d.rectangle([120, 1060, 280, 1500], outline=(130, 85, 62), width=8)
        d.ellipse([290, 1260, 322, 1292], fill=(240, 200, 90))
    # Taraf motion
    tx = 640
    if t < 3.4:
        p = smooth(t / 3.4) if t < 3.0 else 1
        tx = -250 + 890 * (t / 3.0 if t < 3.0 else 1.0) ** 0.9
    if t >= 21.6:
        tx = 640 + 1300 * smooth((t - 21.6) / 2.0)
    running = (t < 3.1) or t >= 21.6
    tj = abs(math.sin(t * 12)) * 45 if running else 0
    expr = 'laugh'
    arms = (14, 14)
    hip = False
    if on(t, 3.1, 4.5):
        expr = 'shock'
    elif on(t, 4.5, 7.2):
        expr = 'worry'
    elif on(t, 7.2, 11.8):
        expr, hip = 'sly', True
    elif on(t, 11.8, 15.0):
        expr, hip = 'worry', True
    elif on(t, 15.0, 17.2):
        expr, arms = 'smile', (150, 150)
    elif on(t, 17.2, 21.6):
        expr = 'shock'
    elif t >= 21.6:
        expr = 'worry'
    # Fajr
    fx, fk = 1160, 1.3
    f_expr = 'sus'
    if on(t, 3.5, 7.0):
        f_expr = 'angry'
    if on(t, 17.2, 21.6):
        f_expr = 'shock'
    sip = 0
    if on(t, 12.0, 13.4):
        sip = smooth((t - 12.0) / .5) * (1 - smooth((t - 12.9) / .5))
    draw_girl(d, fx, YB, fk, FAJR, t, f_expr, talk=on(t, 3.5, 7.0) or on(t, 12.0, 14.8), sip=sip,
              armL=6, look=-1)
    if t < 3.0 or on(t, 3.0, 3.6):
        tag(d, fx, YB + 90, 'العمة فجر', TEAL)
    # Sahab appears
    sx = 220
    if t >= 17.6:
        sx = 220 + (780 * smooth((t - 22.0) / 2.0) if t >= 22.0 else 0)
        draw_girl(d, sx, YB, K, SAHAB, t, 'angry', talk=on(t, 17.9, 20.9), wet=1.0, run=(t >= 22.0),
                  armL=30, armR=30, jump=abs(math.sin(t * 12)) * 40 if t >= 22.0 else 0)
    # Taraf drawn last
    draw_girl(d, tx, YB, K, TARAF, t, expr, talk=on(t, 7.2, 11.8) or on(t, 15.0, 17.2) or on(t, 21.0, 22.0),
              run=running, jump=tj, armL=arms[0], armR=arms[1], hip=hip)
    if on(t, 3.1, 3.6):  # dust
        for i in range(6):
            r = 40 + (t - 3.1) * 220 + i * 6
            px = tx - 160 + i * 20 - (t - 3.1) * 160
            d.ellipse([px - r / 2, YB - r / 2 - 10, px + r / 2, YB + r / 2 - 10], fill=(232, 224, 205))
    if on(t, 4.5, 7.2):
        sweat(d, tx + 150, YB - 760 * K, t)
    if on(t, 17.2, 21.6):
        sweat(d, tx + 150, YB - 760 * K, t)
    # bubbles
    if on(t, .6, 2.4):
        bubble(im, t - .6, 'ترررف!!', 'سحاب (من الحمام)', BLUE, (150, 900), 440, 560, size=84)
    if on(t, 3.5, 7.0):
        bubble(im, t - 3.5, 'وقفي مكانك يا جرادة! وش مهببة هالمرة؟', 'العمة فجر', TEAL, (fx - 30, YB - 840 * fk),
               960, 400)
    if on(t, 7.2, 11.8):
        bubble(im, t - 7.2, 'ما سويت شي يا جرادة! كنت بس أساعد سحاب تروق وتبرد على نفسها!', 'ترف', PINK,
               (tx, YB - 800 * K), 640, 400)
    if on(t, 12.0, 14.8):
        bubble(im, t - 12.0, 'تساعدينها؟ تراني أعرفك زين يا جرادة!', 'العمة فجر', TEAL, (fx - 30, YB - 840 * fk),
               960, 480)
    if on(t, 15.0, 17.2):
        bubble(im, t - 15.0, 'أنا؟! بريئة براءة الذيب من دم يوسف!', 'ترف', PINK, (tx, YB - 800 * K), 640, 480)
    if on(t, 17.9, 20.9):
        bubble(im, t - 17.9, 'ترررف! الحين أوريك!', 'سحاب', BLUE, (sx + 10, YB - 790 * K), 560, 520, size=76)
    if on(t, 19.6, 21.6):
        bubble(im, t - 19.6, 'يا ساتر!', 'ترف', PINK, (tx, YB - 800 * K), 900, 700, size=84)
    if on(t, 17.2, 17.9):
        s = pop((t - 17.2) / .25)
        text(d, (W / 2, 640), 'بووم!', int(190 * s), (255, 255, 255), stroke=14, sfill=(214, 60, 60))


# ------------------------------------------------------------------ scene 5 : end card
def s_end(im, t):
    d = ImageDraw.Draw(im)
    s = pop((t - .2) / .6)
    text(d, (W / 2, 470), 'يتبع...', int(300 * s), (255, 226, 120), stroke=12, sfill=(90, 40, 120))
    if t > 1.0:
        s = pop((t - 1.0) / .5)
        text(d, (W / 2, 760), 'الحلقة ٢', int(150 * s), (255, 255, 255), stroke=6, sfill=(120, 40, 120))
    if t > 1.8:
        for i, line in enumerate(('ترف تهرب...', 'وسحاب ما راح تسكت!')):
            if t > 1.8 + i * .6:
                text(d, (W / 2, 900 + i * 100), line, 76, (255, 240, 250))
    cyc = W + 900
    for off, st, nm, kk, ex, wet in ((0, TARAF, 'ترف', 1.0, 'laugh', 0), (-560, SAHAB, 'سحاب', 1.0, 'angry', 1.0),
                                      (-1150, FAJR, 'فجر', 1.2, 'angry', 0)):
        x = ((t * 420 + off + 450) % cyc) - 450
        draw_girl(d, x, 2060, kk, st, t, ex, run=True, jump=abs(math.sin(t * 12)) * 40, armL=40, armR=40, wet=wet)
