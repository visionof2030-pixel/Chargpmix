import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Kid, LOOKS, Rifle, Expr} from './Kid';
import {Leopard} from './Animals';
import {YardBG, MountainBG, CaveBG} from './bg';
import {Caption, Flash, FONT, Pow, Tint, Vignette, World} from './ui';
import {B, Cam, H, Ln, SceneTL, W, clamp01, easeIn, easeOut, followCam, lerp, mouthOf, noise, on, pop, rnd, sceneTL, smooth, track} from './tl';

const useT = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return {t: frame / fps, frame};
};

type KidOpts = {
  x: number;
  y: number;
  s?: number;
  expr?: Expr;
  run?: boolean;
  face?: 1 | -1;
  armL?: number;
  armR?: number;
  bendL?: number;
  bendR?: number;
  look?: number;
  lookY?: number;
  jump?: number;
  lean?: number;
  fallen?: number;
  shiver?: number;
  propR?: React.ReactNode;
  headlamp?: boolean;
  runSpeed?: number;
};
const kid = (sc: SceneTL, key: string, t: number, o: KidOpts) => (
  <Kid
    key={key}
    id={`${sc.name}-${key}`}
    look={LOOKS[key]}
    t={t}
    x={o.x}
    y={o.y}
    s={o.s ?? 0.46}
    expr={o.expr}
    mouth={mouthOf(sc, key, t)}
    run={o.run}
    face={o.face}
    armL={o.armL}
    armR={o.armR}
    bendL={o.bendL}
    bendR={o.bendR}
    look2={o.look}
    lookY={o.lookY}
    jump={o.jump}
    lean={o.lean}
    fallen={o.fallen}
    shiver={o.shiver}
    propR={o.propR}
    headlamp={o.headlamp}
    runSpeed={o.runSpeed}
    blinkSeed={key.length + key.charCodeAt(0) * 0.1}
  />
);

/** draw kids back-to-front (smaller y first) */
const byDepth = (els: {y: number; el: React.ReactNode}[]) => els.sort((a, b) => a.y - b.y).map((e) => e.el);

const OUT = '#2b1b16';

/* =================================================================== TITLE */
export const TitleScene: React.FC = () => {
  const {t} = useT();
  const cubX = lerp(160, 640, smooth(t / 3));
  const title = pop((t - 0.4) / 0.6);
  return (
    <AbsoluteFill style={{background: '#140c1e', overflow: 'hidden'}}>
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <defs>
          <radialGradient id="tl-lamp" cx="0.3" cy="0.3" r="0.8">
            <stop offset="0" stopColor="#ffcf8a" stopOpacity="0.9" />
            <stop offset="1" stopColor="#ffcf8a" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width={W} height={1500} fill="#5a3a3a" />
        <rect width={W} height={1500} fill="url(#tl-lamp)" />
        <rect y={1500} width={W} height={420} fill="#3a2424" />
        {/* the giant shadow on the wall */}
        <g opacity={0.8} style={{filter: 'brightness(0) blur(3px)'}}>
          <Leopard id="tl-shadow" x={cubX + 120} y={1500} s={1.5} t={t} mode="walk" />
        </g>
        <Leopard id="tl-cub" x={cubX} y={1640} s={0.45} t={t} mode="walk" cub />
      </svg>
      <div
        dir="rtl"
        style={{
          position: 'absolute',
          top: 230,
          width: W,
          textAlign: 'center',
          fontFamily: FONT,
          fontWeight: 700,
          fontSize: 150,
          lineHeight: 1.15,
          color: '#ffe7a8',
          WebkitTextStroke: '14px #2a1210',
          paintOrder: 'stroke fill',
          textShadow: '0 12px 0 #2a1210, 0 0 60px rgba(255,180,80,0.5)',
          transform: `scale(${Math.max(0.01, title)}) rotate(${Math.sin(t * 9) * (t < 1.4 ? 2 : 0.6)}deg)`,
        }}
      >
        البسة
        <br />
        اللي مو بسة!
      </div>
      <Vignette strength={0.7} />
      <div style={{position: 'absolute', inset: 0, background: '#000', opacity: 1 - clamp01(t / 0.5)}} />
    </AbsoluteFill>
  );
};

/* =================================================================== 1. YARD */
export const YardScene: React.FC = () => {
  const {t, frame} = useT();
  const sc = sceneTL('yard');
  const [c0] = B(sc, 'chase');
  const c = t - c0;
  const hiss = B(sc, 'hiss');
  const exit = B(sc, 'exit');
  // the cub
  const cubPts: [number, number, number][] = [
    [0, 60, 1345],
    [1.0, 60, 1345],
    [1.8, 250, 1370],
    [c0, 250, 1370],
    [c0 + 1.0, 520, 1312],
    [c0 + 2.6, 520, 1312],
    [c0 + 3.4, 120, 1780],
    [c0 + 4.2, 700, 1420],
    [c0 + 5.0, 960, 1300],
    [c0 + 5.6, 1200, 1300],
  ];
  const cub = track(t, cubPts);
  const cubPrev = track(t - 0.05, cubPts);
  const cubFacing: 1 | -1 = cub.x >= cubPrev.x - 0.5 ? 1 : -1;
  const cubRunning = Math.hypot(cub.x - cubPrev.x, cub.y - cubPrev.y) > 2;
  const underJeep = on(c, 1.0, 2.6);
  const cubScale = lerp(0.3, 0.42, clamp01((cub.y - 1300) / 450));

  // kids
  const base: Record<string, [number, number]> = {
    malath: [230, 1480],
    sahab: [520, 1470],
    taraf: [850, 1500],
    leen: [270, 1730],
    fares: [640, 1710],
  };
  const lag: Record<string, [number, number, number]> = {
    // lag, dx, dy
    malath: [0.7, -140, 120],
    sahab: [0.5, 120, 160],
    taraf: [0.35, 40, 260],
    leen: [0.9, -60, 330],
    fares: [0.2, -40, 140],
  };
  const chasing = c >= 0 && t < exit[0];
  const exiting = t >= exit[0] - 0.3;
  const pos = (k: string) => {
    if (exiting) {
      const k2 = smooth((t - exit[0] + 0.3) / 1.6);
      const [bx, by] = base[k];
      return {x: lerp(bx, 1000 + lag[k][1] * 0.3, k2), y: lerp(by, 1320, k2)};
    }
    if (!chasing) return {x: base[k][0], y: base[k][1]};
    const [lg, dx, dy] = lag[k];
    const p = track(t - lg, cubPts);
    const blend = smooth(c / 0.6) * (1 - smooth((c - 5.6) / 1.0));
    return {x: lerp(base[k][0], Math.max(80, Math.min(1000, p.x + dx)), blend), y: lerp(base[k][1], Math.max(1440, Math.min(1800, p.y + dy)), blend)};
  };
  const scaleAt = (y: number) => lerp(0.4, 0.5, clamp01((y - 1400) / 380));
  const faresLying = on(c, 1.2, 2.6);
  const barrelFall = smooth((c - 3.25) / 0.35);
  const sp = (k: string) => mouthOf(sc, k, t) !== null;
  const lookAtCub = (x: number) => Math.max(-1, Math.min(1, (cub.x - x) / 300));

  const exprFor = (k: string): Expr => {
    if (t >= exit[0] - 1) return 'happy';
    if (chasing) return k === 'leen' && on(c, 2.8, 3.6) ? 'scared' : 'laugh';
    if (on(t, hiss[0], hiss[1] + 0.6)) return 'laugh';
    if (t < Ln(sc, 'L1')[0]) return 'happy';
    return k === 'taraf' ? 'smile' : k === 'fares' ? 'curious' : 'happy';
  };

  const target = (tt: number): Cam => {
    const cc = tt - c0;
    if (tt < 1.8) return {zoom: 1.35, cx: 250, cy: 1360};
    if (cc >= 1.0 && cc < 2.6) return {zoom: 1.25, cx: 480, cy: 1420};
    if (cc >= 4.2 && cc < 5.8) return {zoom: 1.15, cx: 760, cy: 1300};
    return {zoom: 1.05, cx: 540, cy: 1380};
  };
  const cam = followCam(frame, target, 0.06);

  const kids = ['malath', 'sahab', 'taraf', 'leen', 'fares'].map((k) => {
    const p = pos(k);
    const lying = k === 'fares' && faresLying;
    const leenJump = k === 'leen' && on(c, 2.9, 3.5) ? Math.sin(((c - 2.9) / 0.6) * Math.PI) * 120 : 0;
    const el = kid(sc, k, t, {
      x: lying ? 440 : p.x,
      y: lying ? 1470 : p.y,
      s: scaleAt(lying ? 1470 : p.y),
      expr: lying ? 'curious' : exprFor(k),
      run: (chasing && !lying && Math.abs(c - 5.8) > 0) || exiting,
      face: 1,
      lean: lying ? -84 : 0,
      armR:
        k === 'leen' && sp('leen') ? 110 : k === 'taraf' && sp('taraf') ? (Ln(sc, 'T2')[0] <= t ? 100 : 60) : k === 'fares' && sp('fares') ? 140 : k === 'sahab' && sp('sahab') ? 120 : undefined,
      bendR: k === 'taraf' && on(t, Ln(sc, 'T1')[0], Ln(sc, 'T1')[1]) ? -30 : undefined,
      armL: k === 'malath' && sp('malath') ? 40 : undefined,
      jump: leenJump,
      look: lookAtCub(p.x),
    });
    return {y: lying ? 1460 : p.y, el};
  });

  return (
    <AbsoluteFill style={{background: '#ffd59a', overflow: 'hidden'}}>
      <World cam={cam}>
        <YardBG t={t} gateOpen={0.42} barrelFall={barrelFall} />
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
          {/* cub (dark under the jeep) */}
          <Leopard
            id="y-cub"
            x={cub.x}
            y={cub.y}
            s={cubScale}
            t={t}
            cub
            facing={underJeep ? -1 : cubFacing}
            mode={underJeep ? 'crouch' : cubRunning ? 'run' : on(t, hiss[0], hiss[1]) ? 'crouch' : 'sit'}
            snarl={on(t, hiss[0] + 0.1, hiss[1] - 0.2) ? 0.9 : 0}
            silhouette={underJeep ? 0.55 : 0}
            glow={underJeep ? 0.6 : 0}
          />
          {byDepth(kids)}
        </svg>
      </World>
      <Pow text="زززز!" x={330} y={1000} age={t - hiss[0] - 0.1} size={110} fill="#ffe7a8" life={1.0} />
      <Pow text="طـراخ!" x={260} y={1180} age={c - 3.3} size={100} fill="#9fd3ff" stroke="#1f3f6a" life={0.9} />
      <Caption s={sc} t={t} />
      <Vignette strength={0.35} />
    </AbsoluteFill>
  );
};

/* =================================================================== 2. MOUNTAIN PATH */
export const PathScene: React.FC = () => {
  const {t, frame} = useT();
  const sc = sceneTL('path');
  const pr = B(sc, 'print');
  const order = ['fares', 'sahab', 'taraf', 'malath', 'leen'];
  const lead = lerp(-60, 860, smooth(t / (pr[0] + 0.4)));
  const stopped = t >= pr[0];
  const dusk = clamp01(t / sc.dur);
  const s2 = Ln(sc, 'S2');
  const target = (tt: number): Cam => {
    if (tt >= pr[0] - 0.1 && tt < Ln(sc, 'F3')[1]) return {zoom: 1.5, cx: 860, cy: 1620};
    if (tt >= Ln(sc, 'T3')[0]) return {zoom: 1.15, cx: 560, cy: 1460};
    return {zoom: 1.05, cx: 540, cy: 1360};
  };
  const cam = followCam(frame, target, 0.05);
  const kids = order.map((k, i) => {
    const gap = i === 0 ? 0 : 150 + i * 6;
    const x = stopped ? 780 - i * 165 : Math.min(780, lead) - i * gap;
    const y = 1690 + (i % 2) * 40;
    const bob = Math.abs(Math.sin(t * 6 + i)) * 10;
    let expr: Expr = 'worried';
    if (k === 'sahab' && t < pr[0]) expr = 'happy';
    if (k === 'leen') expr = on(t, Ln(sc, 'L2')[0], Ln(sc, 'L2')[1] + 0.5) ? 'pain' : 'worried';
    if (t >= pr[0]) expr = k === 'fares' ? 'scared' : 'worried';
    if (k === 'taraf' && t >= Ln(sc, 'T3')[0]) expr = 'smile';
    const el = kid(sc, k, t, {
      x,
      y: y - (stopped ? 0 : bob),
      s: 0.44,
      expr,
      run: !stopped,
      runSpeed: 7,
      face: 1,
      armR: k === 'sahab' && on(t, s2[0], s2[1]) ? 110 : k === 'fares' && t >= pr[0] ? 30 : undefined,
      bendR: k === 'fares' && t >= pr[0] ? -60 : undefined,
      armL: k === 'leen' ? 30 : undefined,
      bendL: k === 'leen' ? -90 : undefined,
      look: k === 'fares' && t >= pr[0] ? 0.4 : 0.5,
      lookY: k === 'fares' && t >= pr[0] ? 1 : 0,
      shiver: k === 'leen' && t >= Ln(sc, 'L2')[0] ? 0.5 : 0,
    });
    return {y, el};
  });
  const cubVisible = on(t, s2[0] - 0.3, s2[1] + 0.6);
  const cubP = lerp(780, 1000, clamp01((t - s2[0]) / (s2[1] - s2[0] + 0.4)));
  return (
    <AbsoluteFill style={{background: '#ff9a55', overflow: 'hidden'}}>
      <World cam={cam}>
        <MountainBG t={t} dusk={dusk * 0.45} scroll={0} />
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
          {cubVisible ? <Leopard id="p-cub" x={cubP} y={1380} s={0.16} t={t} cub mode="run" /> : null}
          {/* the big paw print */}
          <ellipse cx={940} cy={1790} rx={190} ry={70} fill="#c4906a" stroke="#7a4e3a" strokeWidth={4} />
          <g transform="translate(940,1792) scale(1.15,0.5)">
            <ellipse cx={0} cy={30} rx={70} ry={58} fill="#3a2018" stroke="#1e0f0a" strokeWidth={6} />
            {[-70, -26, 26, 70].map((x, i) => (
              <ellipse key={i} cx={x} cy={i === 0 || i === 3 ? -40 : -70} rx={26} ry={34} fill="#3a2018" stroke="#1e0f0a" strokeWidth={6} />
            ))}
          </g>
          {byDepth(kids)}
        </svg>
      </World>
      <Tint color="#4a2a7a" amount={0.15 + dusk * 0.35} />
      <Pow text="!!" x={820} y={760} age={t - pr[0] - 0.2} size={150} fill="#ffd54a" life={1.2} />
      <Caption s={sc} t={t} />
      <Vignette strength={0.45} />
    </AbsoluteFill>
  );
};

/* =================================================================== 3. THE DEN */
export const CaveScene: React.FC = () => {
  const {t, frame} = useT();
  const sc = sceneTL('cave');
  const en = B(sc, 'enter');
  const ey = B(sc, 'eyes');
  const em = B(sc, 'emerge');
  const ro = B(sc, 'roar');
  const roarK = on(t, ro[0], ro[1] + 0.4) ? 1 - clamp01((t - ro[0]) / (ro[1] - ro[0] + 0.4)) : 0;
  const shake = roarK * 26 + (on(t, em[0], ro[0]) ? 3 : 0);
  const target = (tt: number): Cam => {
    if (tt < ey[0]) return {zoom: 1.1, cx: 540, cy: 1300};
    if (tt < em[0]) return {zoom: 1.35, cx: 540, cy: 1180};
    if (tt < ro[1]) return {zoom: 1.2, cx: 540, cy: 1300};
    return {zoom: 1.0, cx: 540, cy: 960};
  };
  const base = followCam(frame, target, tt(t, ey[0], em[0]) ? 0.03 : 0.06);
  const cam: Cam = {...base, sx: noise(t * 3, 1) * shake, sy: noise(t * 3, 4) * shake};
  const cubK = clamp01(t / (en[1] - 0.2));
  const eyesOn = clamp01((t - ey[0]) / 0.6);
  const blink = on(t, ey[0] + 1.0, ey[0] + 1.15) ? 0.1 : 1;
  const emK = clamp01((t - em[0]) / (em[1] - em[0]));
  const momVisible = t >= em[0];
  const exprAll: Expr = t < ey[0] ? 'curious' : t < em[0] ? 'scared' : 'terrified';
  const kidsX: [string, number, number][] = [
    ['malath', 170, 0.5],
    ['sahab', 380, 0.5],
    ['taraf', 590, 0.5],
    ['leen', 770, 0.5],
    ['fares', 950, 0.5],
  ];
  const t4 = Ln(sc, 'T4');
  return (
    <AbsoluteFill style={{background: '#0e0a18', overflow: 'hidden'}}>
      <World cam={cam}>
        <CaveBG t={t} light={1} />
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
          {/* cub walking in */}
          {cubK < 1 ? (
            <g opacity={1 - clamp01((cubK - 0.6) / 0.4)}>
              <Leopard id="c-cub" x={lerp(120, 560, cubK)} y={lerp(1560, 1440, cubK)} s={lerp(0.3, 0.18, cubK)} t={t} cub mode="walk" />
            </g>
          ) : null}
          {/* glowing eyes in the dark */}
          {eyesOn > 0 && !momVisible ? (
            <g opacity={eyesOn}>
              {[460, 620].map((x, i) => (
                <g key={i} transform={`translate(${x},1120) scale(1,${blink})`}>
                  <circle r={70} fill="#e9ff7a" opacity={0.25} />
                  <path d="M -40 0 Q 0 -30 40 0 Q 0 26 -40 0 Z" fill="#e9ff7a" />
                  <ellipse rx={7} ry={20} fill="#120804" />
                </g>
              ))}
            </g>
          ) : null}
          {momVisible ? (
            <Leopard
              id="c-mom"
              x={lerp(720, 600, emK)}
              y={lerp(1450, 1560, emK)}
              s={lerp(0.55, 0.95, emK)}
              t={t}
              facing={-1}
              mode={emK < 1 ? 'walk' : 'stand'}
              snarl={t >= ro[0] ? 1 : emK * 0.6}
              lookUp={roarK * 0.8}
              silhouette={1 - clamp01(emK * 1.4)}
              glow={1}
            />
          ) : null}
          {/* kids peeking behind a big rock */}
          {kidsX.map(([k, x, s]) =>
            kid(sc, k, t, {
              x,
              y: 1990 + (k === 'leen' ? 30 : 0),
              s,
              expr: exprAll,
              shiver: t >= ey[0] ? 0.6 : 0,
              look: 0,
              lookY: -0.8,
              armL: on(t, t4[0], t4[1] + 0.3) ? 150 : 40,
              armR: on(t, t4[0], t4[1] + 0.3) ? 150 : 40,
              bendL: on(t, t4[0], t4[1] + 0.3) ? 20 : -110,
              bendR: on(t, t4[0], t4[1] + 0.3) ? 20 : -110,
              jump: on(t, t4[0], t4[1] + 0.3) ? Math.abs(Math.sin(t * 14)) * 30 : 0,
            }),
          )}
          <path d="M -40 1920 L -40 1700 Q 120 1600 300 1640 Q 460 1580 620 1630 Q 820 1570 1000 1640 Q 1080 1660 1120 1700 L 1120 1920 Z" fill="#2c2238" stroke="#120c1a" strokeWidth={10} />
          <path d="M 80 1720 Q 300 1680 500 1720 M 640 1700 Q 820 1670 1000 1720" stroke="#3e3250" strokeWidth={8} fill="none" />
          {/* dust shaken loose by the roar */}
          {roarK > 0
            ? Array.from({length: 40}).map((_, i) => (
                <circle key={i} cx={rnd(i) * W} cy={((t - ro[0]) * (400 + rnd(i + 2) * 500) + rnd(i + 5) * 300) % 1700} r={3 + rnd(i + 1) * 5} fill="#a99ab8" opacity={roarK} />
              ))
            : null}
        </svg>
      </World>
      <Tint color="#1a1040" amount={0.35} />
      <Pow text="غـرررر!!" x={540} y={760} age={t - ro[0]} size={150} fill="#ffe0a0" stroke="#3a0a0a" life={1.6} rot={-4} />
      <Caption s={sc} t={t} />
      <Vignette strength={0.85} />
    </AbsoluteFill>
  );
};
const tt = (t: number, a: number, b: number) => t >= a && t < b;

/* =================================================================== 4. THE CHASE */
export const ChaseScene: React.FC = () => {
  const {t, frame} = useT();
  const sc = sceneTL('chase');
  const l4 = Ln(sc, 'L4');
  const s4 = Ln(sc, 'S4');
  const r3 = B(sc, 'run3');
  const m4 = Ln(sc, 'M4');
  const cr = B(sc, 'crouch');
  const fallT = l4[0] - 0.2;
  const runningA = t < fallT;
  const runningB = on(t, r3[0], m4[0]);
  const stuck = t >= m4[0] - 0.2;
  // integrate scroll so it pauses smoothly
  let scroll = 0;
  for (let f = 0; f < frame; f++) {
    const tf = f / 30;
    const sp = tf < fallT ? 1 : on(tf, r3[0], m4[0] - 0.2) ? 1 : 0;
    scroll += sp * 22;
  }
  const wall = smooth((t - (m4[0] - 0.6)) / 0.8);
  const heartbeatZoom = 1 + (t >= cr[0] ? 0.025 * Math.max(0, Math.sin(t * 7)) : 0);
  const target = (t2: number): Cam => {
    if (t2 >= cr[0]) return {zoom: 1.25, cx: 640, cy: 1450};
    if (on(t2, fallT, r3[0])) return {zoom: 1.2, cx: 540, cy: 1500};
    return {zoom: 1.05, cx: 540, cy: 1400};
  };
  const base = followCam(frame, target, 0.05);
  const shakeA = runningA || runningB ? 5 : 1.5;
  const cam: Cam = {...base, zoom: base.zoom * heartbeatZoom, sx: noise(t * 2, 1) * shakeA, sy: noise(t * 2, 3) * shakeA};
  // leopard distance behind the kids
  const momX = stuck ? lerp(1050, 880, smooth((t - m4[0]) / 1.2)) : on(t, fallT, r3[0]) ? lerp(1250, 1000, smooth((t - fallT) / (r3[0] - fallT))) : 1150 + Math.sin(t * 2) * 40;
  const momMode = stuck ? (t >= cr[0] ? 'crouch' : 'walk') : on(t, fallT, r3[0]) ? 'walk' : 'run';
  const kidsBase: [string, number, number][] = [
    ['fares', 180, 1700],
    ['malath', 330, 1650],
    ['taraf', 470, 1720],
    ['sahab', 620, 1670],
    ['leen', 740, 1740],
  ];
  const kids = kidsBase.map(([k, bx, by], i) => {
    let x = bx + Math.sin(t * 3 + i) * 20;
    let y = by;
    let run = runningA || runningB;
    let expr: Expr = 'terrified';
    let fallen = 0;
    let armL: number | undefined;
    let bendL: number | undefined;
    if (k === 'leen' && on(t, fallT, r3[0])) {
      run = false;
      fallen = smooth((t - fallT) / 0.25) * (1 - smooth((t - (s4[1] - 0.2)) / 0.4));
      expr = 'pain';
      x = 640;
    }
    if (k === 'sahab' && on(t, s4[0] - 0.4, r3[0])) {
      run = false;
      x = 540;
      expr = 'brave';
      armL = 70;
      bendL = -30;
    }
    if (on(t, fallT, r3[0]) && k !== 'leen' && k !== 'sahab') run = false;
    if (stuck) {
      run = false;
      x = 110 + i * 118;
      y = 1700 + (i % 2) * 40;
      expr = 'terrified';
    }
    const el = kid(sc, k, t, {x, y, s: 0.44, expr, run, face: -1, runSpeed: 15, fallen, armL, bendL, shiver: stuck ? 1 : 0, look: 1, lean: run ? -6 : 0});
    return {y, el};
  });
  return (
    <AbsoluteFill style={{background: '#101536', overflow: 'hidden'}}>
      <World cam={cam}>
        <MountainBG t={t} dusk={1} scroll={scroll} wall={wall} />
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
          {byDepth(kids)}
          <Leopard id="ch-mom" x={momX} y={1760} s={0.85} t={t} facing={-1} mode={momMode as 'run' | 'walk' | 'crouch'} snarl={stuck ? 0.9 : 0.5} glow={0.5} />
        </svg>
      </World>
      <Tint color="#20306a" amount={0.4} />
      <div style={{position: 'absolute', inset: 0, background: '#6a0010', opacity: t >= cr[0] ? 0.18 + 0.12 * Math.max(0, Math.sin(t * 7)) : 0, mixBlendMode: 'multiply'}} />
      <Pow text="طيح!" x={640} y={1180} age={t - fallT} size={90} fill="#fff" life={0.8} />
      <Caption s={sc} t={t} />
      <Vignette strength={0.85} />
    </AbsoluteFill>
  );
};

/* =================================================================== 5. JASSAR */
export const JassarScene: React.FC = () => {
  const {t, frame} = useT();
  const sc = sceneTL('jassar');
  const fl = B(sc, 'flee');
  const hug = B(sc, 'hug');
  const shots = [0.02, 0.62];
  const flash = Math.max(...shots.map((s) => (t >= s ? Math.max(0, 1 - (t - s) / 0.25) : 0)));
  const shake = Math.max(...shots.map((s) => (t >= s ? Math.max(0, 1 - (t - s) / 0.5) : 0))) * 24;
  const fleeK = clamp01((t - 0.8) / 1.6);
  const momX = lerp(800, 1500, easeIn(fleeK));
  const momFacing: 1 | -1 = t < 0.8 ? -1 : 1;
  const relieved = t >= Ln(sc, 'J2')[0];
  const rifleUp = t < fl[1] - 0.4;
  const target = (t2: number): Cam => {
    if (t2 < 1.2) return {zoom: 1.0, cx: 540, cy: 960};
    if (on(t2, Ln(sc, 'J2')[0], Ln(sc, 'J2')[1]) || on(t2, Ln(sc, 'J3')[0], Ln(sc, 'J3')[1])) return {zoom: 1.2, cx: 760, cy: 1150};
    return {zoom: 1.05, cx: 540, cy: 1300};
  };
  const base = followCam(frame, target, 0.05);
  const cam: Cam = {...base, sx: noise(t * 3, 1) * shake, sy: noise(t * 3, 4) * shake};
  const hugK = on(t, hug[0] - 0.4, hug[1] + 1) ? 1 : 0;
  const kids: [string, number, number][] = [
    ['fares', 150, 1700],
    ['malath', 290, 1660],
    ['taraf', 420, 1730],
    ['sahab', 550, 1680],
    ['leen', 660, 1750],
  ];
  return (
    <AbsoluteFill style={{background: '#101536', overflow: 'hidden'}}>
      <World cam={cam}>
        <MountainBG t={t} dusk={1} scroll={0} wall={1} />
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
          <defs>
            <linearGradient id="beam" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#fff7c2" stopOpacity="0.55" />
              <stop offset="1" stopColor="#fff7c2" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Jassar's rock */}
          <path d="M 640 1330 Q 700 1220 860 1210 Q 1020 1210 1100 1300 L 1100 1500 L 640 1500 Z" fill="#1d1a32" stroke="#2c2846" strokeWidth={8} />
          {/* headlamp beam towards the leopard */}
          <path d={`M 860 760 L ${t < 1.5 ? 560 : 300} 1800 L ${t < 1.5 ? 1100 : 760} 1800 Z`} fill="url(#beam)" opacity={0.8} />
          {kids.map(([k, x, y], i) =>
            kid(sc, k, t, {
              x: hugK ? 300 + (x - 400) * 0.6 : x,
              y,
              s: 0.44,
              expr: hugK ? 'happy' : relieved ? (k === 'fares' && t >= Ln(sc, 'F5')[0] ? 'happy' : 'worried') : 'terrified',
              shiver: relieved ? 0 : 0.8,
              jump: hugK ? Math.abs(Math.sin(t * 8 + i)) * 40 : 0,
              armL: hugK ? 130 : undefined,
              armR: hugK ? 130 : k === 'fares' && t >= Ln(sc, 'F5')[0] ? 150 : undefined,
              look: 1,
              lookY: -0.5,
            }),
          )}
          {fleeK < 1 ? <Leopard id="j-mom" x={momX} y={1770} s={0.85} t={t} facing={momFacing} mode={t < 0.8 ? 'crouch' : 'run'} snarl={t < 1.4 ? 1 : 0.3} glow={0.4} /> : null}
          {on(t, 1.0, 3.0) ? <Leopard id="j-cub" x={lerp(1000, 1500, clamp01((t - 1.2) / 1.6))} y={1720} s={0.32} t={t} cub mode="run" /> : null}
          {kid(sc, 'jassar', t, {
            x: 860,
            y: 1235,
            s: 0.46,
            expr: relieved ? 'smile' : 'brave',
            headlamp: true,
            armR: rifleUp ? 168 : 22,
            bendR: rifleUp ? 0 : -50,
            propR: <Rifle flash={flash} />,
            look: -1,
          })}
        </svg>
      </World>
      <Tint color="#20306a" amount={0.32} />
      <Flash amount={flash * 0.85} />
      <Pow text="طـاخ!" x={760} y={520} age={t - shots[0]} size={170} fill="#ffd54a" stroke="#3a1a0a" life={0.55} rot={-10} />
      <Pow text="طـاخ!" x={420} y={640} age={t - shots[1]} size={170} fill="#ffd54a" stroke="#3a1a0a" life={0.6} rot={8} />
      <Caption s={sc} t={t} />
      <Vignette strength={0.7} />
    </AbsoluteFill>
  );
};

/* =================================================================== 6. BACK HOME */
export const HomeScene: React.FC = () => {
  const {t, frame} = useT();
  const sc = sceneTL('home');
  const wk = B(sc, 'walk');
  const me = B(sc, 'meow');
  const fl = B(sc, 'flee');
  const card = B(sc, 'card');
  const all = Ln(sc, 'ALL');
  const walkK = smooth(t / wk[1]);
  const fleeK = clamp01((t - fl[0] + 0.3) / 1.2);
  const gate = lerp(0.9, 0, smooth((t - 1.6) / 0.5));
  const scared = t >= Ln(sc, 'L5')[0];
  const target = (t2: number): Cam => {
    if (on(t2, me[0], Ln(sc, 'L5')[0])) return {zoom: 1.45, cx: 260, cy: 1340};
    return {zoom: 1.05, cx: 540, cy: 1380};
  };
  const cam = followCam(frame, target, 0.07);
  const list: [string, number, number][] = [
    ['jassar', 780, 1470],
    ['fares', 640, 1700],
    ['malath', 380, 1500],
    ['taraf', 540, 1520],
    ['sahab', 860, 1720],
    ['leen', 420, 1760],
  ];
  const kids = list.map(([k, x, y], i) => {
    const xx = lerp(1000 + i * 30, x, walkK) - easeIn(fleeK) * 1500;
    const el = kid(sc, k, t, {
      x: xx,
      y,
      s: lerp(0.42, 0.5, clamp01((y - 1450) / 320)),
      expr: scared ? 'terrified' : t < wk[1] ? 'smile' : 'curious',
      run: t < wk[1] - 0.2 || fleeK > 0,
      runSpeed: fleeK > 0 ? 17 : 7,
      face: fleeK > 0 ? -1 : -1,
      headlamp: k === 'jassar',
      armR: k === 'leen' && on(t, Ln(sc, 'L5')[0], all[0]) ? 100 : scared && fleeK === 0 ? 160 : undefined,
      armL: scared && fleeK === 0 ? 160 : undefined,
      jump: on(t, all[0], all[1]) ? Math.abs(Math.sin(t * 12 + i)) * 50 : 0,
      look: -1,
    });
    return {y, el};
  });
  const catOn = t >= me[0];
  return (
    <AbsoluteFill style={{background: '#0b1030', overflow: 'hidden'}}>
      <World cam={cam}>
        <YardBG t={t} night={1} gateOpen={gate} />
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
          {catOn ? (
            <Leopard
              id="h-cat"
              x={230}
              y={1360}
              s={0.26}
              t={t}
              cub
              mode="sit"
              colors={{fur: '#9a9aa4', furShade: '#6e6e78', belly: '#e6e6ea', spot: '#55555e'}}
              hideSpots
              lookUp={on(t, fl[0], card[1]) ? 0.4 : 0}
            />
          ) : null}
          {byDepth(kids)}
        </svg>
      </World>
      <Tint color="#1a2460" amount={0.25} />
      <Pow text="مياااو" x={320} y={980} age={t - me[0] - 0.1} size={100} fill="#fff" life={1.1} />
      <Pow text="؟" x={330} y={1000} age={t - fl[0] - 0.4} size={150} fill="#ffd54a" life={2.4} />
      <Caption s={sc} t={t} />
      <Vignette strength={0.55} />
      {t >= card[0] ? (
        <AbsoluteFill style={{background: `rgba(8,6,18,${0.88 * clamp01((t - card[0]) / 0.6)})`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <div dir="rtl" style={{opacity: clamp01((t - card[0] - 0.3) / 0.6), textAlign: 'center', fontFamily: FONT, fontWeight: 700, color: '#ffe7a8', padding: '0 70px', transform: `translateY(${(1 - easeOut((t - card[0] - 0.3) / 0.8)) * 40}px)`}}>
            <svg width={420} height={260} style={{display: 'block', margin: '0 auto 30px'}}>
              <Leopard id="card-cub" x={210} y={240} s={0.42} t={t} cub mode="sit" />
            </svg>
            <div style={{fontSize: 78, lineHeight: 1.4}}>النمر العربي مهدد بالانقراض</div>
            <div style={{fontSize: 54, lineHeight: 1.6, color: '#fff', marginTop: 24}}>إذا شفته.. لا تقرّب منه، وبلّغ الجهات المختصة.</div>
          </div>
        </AbsoluteFill>
      ) : null}
      <div style={{position: 'absolute', inset: 0, background: '#000', opacity: clamp01((t - (sc.dur - 0.8)) / 0.8)}} />
    </AbsoluteFill>
  );
};

export {OUT};
