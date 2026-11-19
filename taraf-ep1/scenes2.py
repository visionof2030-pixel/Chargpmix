import json, math, os
from scenes import *

TL = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'timeline.json')))
TX, ENV = TL['text'], TL['env']


def mth(i, t, ev):
    s, e = ev[i]
    if s <= t < e:
        a = ENV[i]
        return a[min(int((t - s) * 30), len(a) - 1)]
    return None


def act(ids, t, ev):
    for i in ids:
        s, e = ev[i]
        if s <= t < e:
            return i
    return None


def bubbles(im, t, ev, ids, place):
    for i in ids:
        s, e = ev[i]
        if s <= t < e + .15:
            nm, col, tip, cx, top, sz = place(i)
            bubble(im, t - s, TX[i], nm, col, tip, cx, top, size=sz)


# ------------------------------------------------------------------ room
def s_room2(im, t):
    ev = TL['room']
    d = ImageDraw.Draw(im)
    if on(t, .3, 2.0):
        caption(im, 'ظهرية يوم من أيام الصيف الحارة', 230)
    sx = 470
    tx = 990
    if t < 1.0:
        tx = 1900
    elif t < 1.9:
        tx = 1900 - 910 * smooth((t - 1.0) / .9)
    running = 1.0 <= t < 1.9
    ti, si = act(['T1', 'T2', 'T3'], t, ev), act(['S1', 'S2', 'S3'], t, ev)
    s_expr = 'bored' if t < ev['S2'][0] else 'sus'
    t_expr = 'smile' if t < ev['T2'][0] else 'sly'
    arm = 20 + (70 + 40 * math.sin(t * 6) if ti in ('T2', 'T3') else 0)
    draw_girl(d, sx, YB, K, SAHAB, t, s_expr, mouth=mth(si, t, ev) if si else None, armL=8, armR=8,
              lean=-6 * math.sin(t * 1.5), jump=abs(math.sin(t * 2.5)) * 5)
    draw_girl(d, tx, YB, K, TARAF, t, t_expr, mouth=mth(ti, t, ev) if ti else None, run=running,
              jump=abs(math.sin(t * 12)) * 40 if running else 0, armL=15, armR=arm if not running else 60)
    if on(t, .2, 2.2):
        tag(d, sx, YB + 90, 'سحاب', BLUE)
    if on(t, 2.0, 4.2):
        tag(d, tx, YB + 90, 'ترف', PINK)

    def place(i):
        if i[0] == 'T':
            return ('ترف', PINK, (tx - 20, YB - 800 * K), 780, 470, 66)
        return ('سحاب', BLUE, (sx + 20, YB - 800 * K), 560, 560, 66)
    bubbles(im, t, ev, list(ev), place)


# ------------------------------------------------------------------ bathroom
def s_bath2(im, t):
    ev = TL['bath']
    d = ImageDraw.Draw(im)
    ws = ev['T6'][1] - .3
    s6s, s6e = ev['S6']
    run_a, run_b = s6s + .2, s6e + .3
    door_a, door_b = s6e + .3, s6e + .8
    click = s6e + .85
    s7s, s7e = ev['S7']
    sx = 640
    if t < 1.3:
        sx = -300 + 940 * smooth(t / 1.3)
    if t >= s7s:
        sx = 640 + 380 * smooth((t - s7s) / (s7e - s7s))
    tx = 1000
    if t < 1.5:
        tx = -600 + 1600 * smooth(t / 1.5)
    if t >= run_a:
        tx = 1000 + 900 * smooth((t - run_a) / (run_b - run_a))
    wet = c01((t - ws) / 1.3)
    if wet > 0:
        pr = 60 + wet * 330
        d.ellipse([sx - pr, YB - 30, sx + pr, YB + 40], fill=(130, 190, 235))
    knob = 0 if t < ev['T6'][1] - .5 else smooth((t - (ev['T6'][1] - .5)) / .5) * 80
    kx, ky = 1150, 1350
    ca, sa = math.cos(math.radians(knob)), math.sin(math.radians(knob))
    d.line([(kx - 60 * ca, ky - 60 * sa), (kx + 60 * ca, ky + 60 * sa)], fill=(110, 120, 135), width=24)
    ti = act(['T4', 'T5', 'T6'], t, ev)
    si = act(['S4', 'S5', 'S6', 'S7', 'S8'], t, ev)
    entering = t < 1.5
    if entering:
        s_expr = 'bored'
    elif t < ev['S4'][0]:
        s_expr = 'worry'
    elif t < ev['S5'][0]:
        s_expr = 'shock'
    elif t < ws:
        s_expr = 'sus'
    elif t < s6e + .3:
        s_expr = 'shock'
    else:
        s_expr = 'angry'
    draw_girl(d, sx, YB, K, SAHAB, t, s_expr, mouth=mth(si, t, ev) if si else None, run=entering or t >= s7s and t < s7e,
              wet=wet, armL=10 + (60 * math.sin(t * 14) * wet if 0 < wet < 1 or on(t, s6s, s6e) else 0),
              armR=10 if t < s7s else 120 + 20 * math.sin(t * 10),
              jump=(abs(math.sin(t * 25)) * 18 if on(t, s6s, s6e) else (abs(math.sin(t * 12)) * 25 if s7s <= t < s7e else 0)))
    running = entering or run_a <= t < run_b + .2
    if tx < 1750:
        t_expr = 'laugh' if running or t >= ev['T6'][1] else 'sly'
        reach = ev['T6'][1] - 1.0 <= t < ev['T6'][1] + .3
        draw_girl(d, tx, YB, K, TARAF, t, t_expr, mouth=mth(ti, t, ev) if ti else None, run=running,
                  armL=14, armR=134 if reach else 14, jump=abs(math.sin(t * 12)) * 42 if running else 0)
    if t > ws:
        drops(d, t, ws, 640, 770, FLOOR + 90)
    if t >= door_a:
        w = 240 * smooth((t - door_a) / (door_b - door_a))
        d.rectangle([1200, 640, 1200 + w, FLOOR], fill=(160, 110, 80))
        if w > 200:
            d.ellipse([1200 + w - 60, 1280, 1200 + w - 30, 1310], fill=(240, 200, 90))
    if on(t, click, click + .9):
        s = pop((t - click) / .25)
        text(d, (1300, 1180), 'كلِك!', int(100 * s), (255, 255, 255), stroke=8, sfill=(80, 50, 40))
    if on(t, ev['T4'][0], ev['T4'][0] + 3):
        tag(d, tx, YB + 90, 'ترف', PINK)
        tag(d, sx, YB + 90, 'سحاب', BLUE)

    def place(i):
        if i in ('T7', 'T8'):
            return ('ترف (خلف الباب)', PINK, (1300, 1160), 880, 520, 66)
        if i[0] == 'T':
            return ('ترف', PINK, (tx - 20, YB - 800 * K), 860, 440, 66)
        return ('سحاب', BLUE, (sx + 10, YB - 790 * K), min(sx, 760), 540, 72)
    bubbles(im, t, ev, list(ev), place)


# ------------------------------------------------------------------ end card
def s_end2(im, t):
    d = ImageDraw.Draw(im)
    s = pop((t - .2) / .6)
    text(d, (W / 2, 470), 'يتبع...', int(300 * s), (255, 226, 120), stroke=12, sfill=(90, 40, 120))
    if t > 1.0:
        s = pop((t - 1.0) / .5)
        text(d, (W / 2, 760), 'الحلقة ٢', int(150 * s), (255, 255, 255), stroke=6, sfill=(120, 40, 120))
    for i, line in enumerate(('ترف تهرب...', 'وسحاب ما راح تسكت!')):
        if t > 1.8 + i * .6:
            text(d, (W / 2, 930 + i * 100), line, 76, (255, 240, 250))
    cyc = W + 900
    for off, st, kk, ex, wet in ((0, TARAF, 1.1, 'laugh', 0), (-620, SAHAB, 1.1, 'angry', 1.0)):
        x = ((t * 420 + off + 450) % cyc) - 450
        draw_girl(d, x, 2060, kk, st, t, ex, run=True, jump=abs(math.sin(t * 12)) * 40, armL=40, armR=40, wet=wet)
