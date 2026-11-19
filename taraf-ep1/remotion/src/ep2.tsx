import React from 'react';
import {AbsoluteFill, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Audio} from '@remotion/media';
import {Character, FAJR, SAHAB, TARAF, Expr} from './Character';
import {Bubbles, Grade, Iris, Pill, Pow} from './ui';
import {EndScene, TitleScene, World, Dust} from './scenes';
import TL2 from './timeline2.json';
import {BLUE, Cam, FLOOR, FPS, H, PINK, W, clamp01, easeOut, followCam, lerp, noise, on, rnd, smooth, toScreen} from './lib';

type TL = {
  title: number;
  hall_dur: number;
  end_dur: number;
  hall: Record<string, [number, number]>;
  off: {hall: number; end: number};
  total: number;
  beats: {walk: number[]; click: number; open: number[]; out: number[]; chase: number; slip: number; splash: number};
  text: Record<string, string>;
  env: Record<string, number[]>;
};
export const T2 = TL2 as unknown as TL;
const TEAL = '#28827F';
const OUT = '#3a2230';

const active = (ids: string[], t: number) => {
  for (const id of ids) {
    const [s, e] = T2.hall[id];
    if (t >= s && t < e) return id;
  }
  return null;
};
const mouth = (prefix: string, t: number) => {
  const id = active(Object.keys(T2.hall).filter((k) => k[0] === prefix), t);
  if (!id) return null;
  const a = T2.env[id];
  const f = (t - T2.hall[id][0]) * FPS;
  const i = Math.min(Math.floor(f), a.length - 1);
  const j = Math.min(i + 1, a.length - 1);
  return Math.min(1, lerp(a[i], a[j], f - Math.floor(f)) * 1.15);
};

// ---------------------------------------------------------------- hallway background
const DX = 470; // door left edge
const DW = 220;
const DY = 720;

const HallBG: React.FC<{t: number; open: number; shake: number; puddle: number; puddleX: number}> = ({t, open, shake, puddle, puddleX}) => {
  const panelW = DW * (1 - open * 0.86);
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
      <defs>
        <linearGradient id="hwall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff0dc" />
          <stop offset="1" stopColor="#ffd9b0" />
        </linearGradient>
        <pattern id="hpat" width="80" height="80" patternUnits="userSpaceOnUse">
          <path d="M 40 10 L 50 40 L 40 70 L 30 40 Z" fill="#f7c48f" opacity="0.35" />
        </pattern>
        <linearGradient id="hfloor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e8d2b8" />
          <stop offset="1" stopColor="#cdb193" />
        </linearGradient>
        <linearGradient id="hwood" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#b97a4f" />
          <stop offset="0.5" stopColor="#d39363" />
          <stop offset="1" stopColor="#a8693f" />
        </linearGradient>
        <linearGradient id="hbath" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d6f4f3" />
          <stop offset="1" stopColor="#9fd8dc" />
        </linearGradient>
        <radialGradient id="lamp" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff6c8" stopOpacity="0.9" />
          <stop offset="1" stopColor="#fff6c8" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="mist" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.8" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={W} height={FLOOR - 140} fill="url(#hwall)" />
      <rect width={W} height={FLOOR - 140} fill="url(#hpat)" />
      {/* wainscot */}
      <rect x={0} y={1180} width={W} height={FLOOR - 140 - 1180} fill="#f2c79a" />
      <rect x={0} y={1170} width={W} height={20} fill="#fff7ee" stroke={OUT} strokeWidth={4} />
      {Array.from({length: 7}).map((_, i) => (
        <rect key={i} x={20 + i * 160} y={1220} width={130} height={240} rx={10} fill="none" stroke="#d9a877" strokeWidth={5} />
      ))}
      {/* kitchen arch on the left */}
      <path d="M -20 1520 L -20 760 Q 70 640 170 760 L 170 1520 Z" fill="#ffe7a8" stroke={OUT} strokeWidth={6} />
      <rect x={10} y={900} width={120} height={70} rx={8} fill="#fff" stroke={OUT} strokeWidth={4} opacity={0.8} />
      <path d="M 40 1000 L 120 1000 L 110 1080 L 50 1080 Z" fill="#ff9f68" stroke={OUT} strokeWidth={4} />
      {/* lamp */}
      <circle cx={860} cy={520} r={170} fill="url(#lamp)" opacity={0.75 + Math.sin(t * 3) * 0.05} />
      <path d="M 820 470 L 900 470 L 880 540 L 840 540 Z" fill="#ffd166" stroke={OUT} strokeWidth={5} />
      <rect x={852} y={540} width={16} height={40} fill="#c98b5a" stroke={OUT} strokeWidth={3} />
      {/* family photos */}
      {[
        {x: 210, y: 470, w: 170, h: 130, c: '#9be0c7', r: -4},
        {x: 760, y: 700, w: 150, h: 190, c: '#ffb3cc', r: 3},
        {x: 940, y: 760, w: 110, h: 140, c: '#b9d8ff', r: -2},
      ].map((f, i) => (
        <g key={i} transform={`translate(${f.x},${f.y}) rotate(${f.r})`}>
          <rect width={f.w} height={f.h} rx={8} fill="#c98b5a" stroke={OUT} strokeWidth={5} />
          <rect x={12} y={12} width={f.w - 24} height={f.h - 24} rx={4} fill={f.c} />
          <circle cx={f.w * 0.4} cy={f.h * 0.45} r={f.h * 0.14} fill="#f6d3b6" stroke={OUT} strokeWidth={3} />
          <circle cx={f.w * 0.65} cy={f.h * 0.5} r={f.h * 0.12} fill="#f6d3b6" stroke={OUT} strokeWidth={3} />
        </g>
      ))}

      {/* bathroom doorway: interior visible when open */}
      <rect x={DX} y={DY} width={DW} height={FLOOR - DY} fill="url(#hbath)" stroke={OUT} strokeWidth={6} />
      {Array.from({length: 5}).map((_, i) => (
        <line key={i} x1={DX} y1={DY + 120 + i * 150} x2={DX + DW} y2={DY + 120 + i * 150} stroke="#8fcfd2" strokeWidth={4} />
      ))}
      {open > 0.05
        ? Array.from({length: 18}).map((_, i) => {
            const k = (t * 1.6 + rnd(i)) % 1;
            return <line key={i} x1={DX + 30 + rnd(i + 3) * 160} y1={DY + 40 + k * 800} x2={DX + 30 + rnd(i + 3) * 160} y2={DY + 70 + k * 800} stroke="#e8fbff" strokeWidth={4} opacity={0.7 * open} />;
          })
        : null}
      {open > 0.05
        ? [0, 1, 2].map((i) => {
            const k = (t * 0.35 + i / 3) % 1;
            return <circle key={i} cx={DX + DW / 2 + Math.sin(t + i) * 40} cy={DY + 300 - k * 260} r={90 + k * 80} fill="url(#mist)" opacity={(1 - k) * 0.7 * open} />;
          })
        : null}
      {/* puddle spreading into the hallway */}
      {puddle > 0 ? (
        <ellipse cx={puddleX} cy={FLOOR + 30} rx={60 + puddle * 300} ry={18 + puddle * 44} fill="#9fdcff" stroke="#5aaee0" strokeWidth={3} opacity={0.75} />
      ) : null}
      {/* door frame */}
      <rect x={DX - 20} y={DY - 20} width={DW + 40} height={FLOOR - DY + 20} fill="none" stroke="#fff7ee" strokeWidth={24} />
      <rect x={DX - 32} y={DY - 32} width={DW + 64} height={FLOOR - DY + 32} fill="none" stroke={OUT} strokeWidth={4} />
      {/* door panel, hinge on the right */}
      <g transform={`translate(${shake},0)`}>
        <rect x={DX + DW - panelW} y={DY} width={panelW} height={FLOOR - DY} fill="url(#hwood)" stroke={OUT} strokeWidth={6} />
        {panelW > 120 ? (
          <>
            <rect x={DX + DW - panelW + 26} y={DY + 40} width={panelW - 52} height={330} rx={10} fill="none" stroke="#8a5530" strokeWidth={6} />
            <rect x={DX + DW - panelW + 26} y={DY + 420} width={panelW - 52} height={440} rx={10} fill="none" stroke="#8a5530" strokeWidth={6} />
            <circle cx={DX + DW - panelW + 40} cy={1160} r={17} fill="#ffd166" stroke={OUT} strokeWidth={4} />
            <rect x={DX + DW - panelW + 30} y={1190} width={22} height={34} rx={6} fill={open > 0 || shake !== 0 ? '#ffd166' : '#ffb703'} stroke={OUT} strokeWidth={3} />
          </>
        ) : null}
      </g>
      {/* floor */}
      <rect x={0} y={FLOOR - 140} width={W} height={H - FLOOR + 140} fill="url(#hfloor)" />
      {Array.from({length: 10}).map((_, i) => (
        <line key={i} x1={i * 120 - 40} y1={FLOOR - 140} x2={(i * 120 - 580) * 1.7 + 540} y2={H} stroke="#b8987a" strokeWidth={4} opacity={0.6} />
      ))}
      {[FLOOR - 70, FLOOR + 40, FLOOR + 180].map((y, i) => (
        <line key={i} x1={0} y1={y} x2={W} y2={y} stroke="#b8987a" strokeWidth={4} opacity={0.6} />
      ))}
      {puddle > 0 ? (
        <ellipse cx={puddleX} cy={FLOOR + 30} rx={60 + puddle * 300} ry={18 + puddle * 44} fill="#9fdcff" stroke="#5aaee0" strokeWidth={3} opacity={0.75} />
      ) : null}
      {puddle > 0 ? <ellipse cx={puddleX - 80} cy={FLOOR + 22} rx={40 + puddle * 70} ry={8 + puddle * 8} fill="#ffffff" opacity={0.5} /> : null}
    </svg>
  );
};

// ---------------------------------------------------------------- hallway scene
const SG = 0.8; // girls
const SF = 0.85; // Fajr
const HEAD_G = 1100 * SG;
const HEAD_F = (1100 + 170) * SF;

export const HallScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const ev = T2.hall;
  const b = T2.beats;

  // --- Fajr
  const FX0 = 190;
  const FDOOR = 360;
  let fx = FX0;
  const fEnter = t < 3.6;
  if (fEnter) fx = lerp(-320, FX0, easeOut((t - 1.4) / 2.2));
  if (t >= b.walk[0]) fx = lerp(FX0, FDOOR, smooth((t - b.walk[0]) / (b.walk[1] - b.walk[0])));
  if (t >= b.open[0]) fx = lerp(FDOOR, FX0, smooth((t - b.open[0]) / 0.8));
  const fWalking = (t >= 1.4 && t < 3.6) || on(t, b.walk[0], b.walk[1]) || on(t, b.open[0], b.open[0] + 0.8);
  const fWet = clamp01((t - b.splash) / 0.5);
  const fi = active(['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7'], t);
  let fExpr: Expr = 'sus';
  if (fi === 'F1') fExpr = t - ev.F1[0] < 1.5 ? 'angry' : 'sus';
  else if (t >= ev.F2[0] && t < ev.F3[0]) fExpr = 'angry';
  else if (t >= ev.F3[0] && t < ev.F4[0]) fExpr = 'shock';
  else if (t >= ev.F4[0] && t < b.walk[0]) fExpr = 'sus';
  else if (t >= b.walk[0] && t < ev.F5[0]) fExpr = 'angry';
  else if (t >= ev.F5[0] && t < ev.S4[0]) fExpr = 'laugh';
  else if (t >= ev.S4[0] && t < b.splash) fExpr = t >= ev.F6[0] - 0.6 ? 'worry' : 'smile';
  else if (t >= b.splash) fExpr = t < ev.F7[0] ? 'shock' : 'angry';
  const reachDoor = on(t, b.walk[1] - 0.1, b.open[0] + 0.1);
  const fArmR = reachDoor ? 32 : fi === 'F2' ? 95 + Math.sin(t * 8) * 12 : fi === 'F6' ? 120 + Math.sin(t * 10) * 20 : fi === 'F7' ? 140 : 12;

  // --- Taraf
  const TX0 = 800;
  let tx = TX0;
  const tBack = t >= ev.F7[0] - 0.3; // peeks back in at the end
  if (t >= b.open[0] && t < b.chase) tx = lerp(TX0, 910, smooth((t - b.open[0]) / 0.7));
  if (t >= b.chase) tx = lerp(910, 1500, smooth((t - b.chase) / 1.1));
  if (tBack) tx = lerp(1300, 960, easeOut((t - (ev.F7[0] - 0.3)) / 0.6));
  const ti = active(['T1', 'T2', 'T3', 'T4'], t);
  let tExpr: Expr = 'laugh';
  if (t >= ev.F1[0] + 1.2 && t < ev.T1[1]) tExpr = 'smile';
  if (t >= ev.F2[0] && t < ev.T2[0]) tExpr = 'sly';
  if (ti === 'T2') tExpr = 'sly';
  if (t >= ev.S1[0] && t < ev.F4[0]) tExpr = 'sly';
  if (t >= ev.F4[0] && t < ev.T3[0] + 0.6) tExpr = 'worry';
  if (ti === 'T3' && t >= ev.T3[0] + 0.6) tExpr = 'laugh';
  if (t >= ev.T3[1] && t < ev.T4[0]) tExpr = t < b.out[1] ? 'worry' : 'sly';
  if (t >= ev.T4[0]) tExpr = 'laugh';
  const tRun = on(t, b.chase, b.chase + 1.3) || on(t, ev.F7[0] - 0.3, ev.F7[0] + 0.3);
  const tGiggle = t < ev.F1[0] + 1.0; // giggling at the door before Fajr shows up

  // --- Sahab
  const outK = clamp01((t - b.out[0]) / (b.out[1] - b.out[0]));
  const SX0 = lerp(580, 545, outK);
  const sVisible = t >= b.out[0];
  const runStart = b.chase + 0.4;
  let sx = SX0;
  if (t >= runStart) sx = lerp(SX0, 760, clamp01((t - runStart) / (b.slip - runStart)));
  const slipK = clamp01((t - b.slip) / 0.35);
  const fallen = t >= b.slip;
  const si = active(['S3', 'S4'], t);
  let sExpr: Expr = 'angry';
  if (t < ev.S3[0] + 0.5) sExpr = 'shock';
  if (fallen) sExpr = t < b.splash + 0.4 ? 'shock' : 'worry';
  const sRunning = t >= runStart && !fallen;
  const sLook = si === 'S3' ? Math.sin((t - ev.S3[0]) * 4) : 1;

  const puddle = sVisible ? clamp01((t - b.out[0]) / 6) * 0.7 + (t >= b.slip ? clamp01((t - b.slip) / 0.5) * 0.3 : 0) : 0;

  // door bangs from inside
  const banging = t < 2.0 || on(t, ev.S1[0], ev.S1[1]) || on(t, ev.S2[0], ev.S2[1]);
  const doorShake = banging ? Math.max(0, Math.sin(t * 20)) * 7 : 0;
  const openK = smooth((t - b.open[0]) / (b.open[1] - b.open[0]));

  // camera
  const target = (tt: number): Cam => {
    if (tt < ev.F1[0]) return {zoom: 1.18, cx: 700, cy: 1080};
    if (tt >= ev.F4[0] - 0.1 && tt < ev.F4[1] + 0.2) return {zoom: 1.32, cx: FX0 + 60, cy: 980};
    if (tt >= ev.T3[0] && tt < ev.T3[1]) return {zoom: 1.2, cx: TX0 - 40, cy: 1050};
    if (tt >= b.walk[0] && tt < b.chase + 0.5) return {zoom: 1.0, cx: 540, cy: 960};
    if (tt >= b.slip - 0.2 && tt < ev.F7[0]) return {zoom: 1.04, cx: 500, cy: 1020};
    const sp = active(Object.keys(ev), tt);
    if (!sp) return {zoom: 1.0, cx: 540, cy: 960};
    const fxp = sp[0] === 'F' ? FX0 : sp[0] === 'T' ? TX0 : SX0;
    if (sp === 'S1' || sp === 'S2') return {zoom: 1.06, cx: 560, cy: 1040};
    return {zoom: 1.06, cx: lerp(540, fxp, 0.28), cy: 1040};
  };
  const base = followCam(frame, target, 0.07);
  const shakeAmp = (on(t, b.slip + 0.25, b.slip + 0.7) ? 20 : 0) + (banging && t < ev.F1[0] ? 3 : 0);
  const cam: Cam = {...base, sx: noise(t * 3, 1) * shakeAmp, sy: noise(t * 3, 5) * shakeAmp};

  const doorS = toScreen(cam, DX + DW / 2, 1000);
  const place = (id: string) => {
    if (id === 'S1' || id === 'S2') return {name: 'سحاب (خلف الباب)', color: BLUE, x: DX + DW / 2, y: 900};
    if (id[0] === 'F') return {name: 'فجر', color: TEAL, x: fx + 10, y: FLOOR - HEAD_F - 10};
    if (id[0] === 'T') return {name: 'ترف', color: PINK, x: Math.min(tx, 960) - 10, y: FLOOR - HEAD_G - 10};
    return {name: 'سحاب', color: BLUE, x: sx, y: FLOOR - HEAD_G - 10};
  };

  // splash flying from Sahab to Fajr
  const splash: React.ReactNode[] = [];
  if (on(t, b.slip + 0.2, b.splash + 0.9)) {
    for (let i = 0; i < 26; i++) {
      const k = clamp01((t - b.slip - 0.2 - rnd(i) * 0.15) / 0.75);
      if (k <= 0 || k >= 1) continue;
      const x0 = sx - 40;
      const x1 = FX0 + (rnd(i + 4) - 0.5) * 220;
      const x = lerp(x0, x1, k);
      const y = lerp(FLOOR - 40, FLOOR - 650 - rnd(i + 8) * 400, k) + k * k * 520;
      splash.push(<circle key={i} cx={x} cy={y} r={10 + rnd(i + 2) * 14} fill="#bfe9ff" stroke="#3c8fd0" strokeWidth={3} opacity={1 - k * 0.4} />);
    }
  }

  const sahabEl = (
            <g opacity={clamp01(outK * 3)}>
              <Character
                id="hs"
                pal={SAHAB}
                x={sx}
                y={FLOOR - (1 - outK) * 60}
                s={SG * (0.9 + outK * 0.1)}
                t={t}
                expr={sExpr}
                mouth={mouth('S', t)}
                wet={1}
                shiver={fallen ? 0.3 : 0.6}
                run={sRunning || outK < 1}
                runSpeed={sRunning ? 34 : 10}
                lean={fallen ? -82 * slipK : sRunning ? 6 : 0}
                jump={fallen ? Math.sin(slipK * Math.PI) * 140 : 0}
                armL={fallen ? 150 : si === 'S4' ? 40 : 20}
                armR={fallen ? 150 : si === 'S4' ? 130 + Math.sin(t * 12) * 15 : 20}
                look={sLook}
                blinkSeed={1}
              />
            </g>
            );

  return (
    <AbsoluteFill style={{background: '#ffd9b0', overflow: 'hidden'}}>
      <World cam={cam}>
        <HallBG t={t} open={openK} shake={doorShake} puddle={puddle} puddleX={SX0 + 40} />
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
          {sVisible && !fallen ? sahabEl : null}
          <Character
            id="hf"
            pal={FAJR}
            x={fx}
            y={FLOOR}
            s={SF}
            t={t}
            expr={fExpr}
            mouth={mouth('F', t)}
            run={fWalking}
            runSpeed={7}
            wet={fWet}
            cup
            cupSpill={clamp01((t - b.splash) / 0.3)}
            armL={40}
            bendL={70}
            armR={fArmR}
            bendR={reachDoor ? 0 : undefined}
            look={t >= ev.S1[0] && t < b.open[1] ? 1 : t >= b.out[0] && t < ev.S4[1] ? 1 : 1}
            blinkSeed={5}
          />
          {tx < 1250 ? (
            <Character
              id="ht"
              pal={TARAF}
              x={tx}
              y={FLOOR}
              s={SG}
              t={t}
              expr={tExpr}
              mouth={mouth('T', t)}
              run={tRun}
              runSpeed={16}
              lean={tRun ? (tBack ? 8 : -10) : tGiggle ? Math.sin(t * 9) * 3 : 0}
              jump={tGiggle ? Math.abs(Math.sin(t * 9)) * 10 : ti === 'T3' ? Math.abs(Math.sin(t * 7)) * 18 : 0}
              armL={tGiggle ? 150 : ti === 'T2' ? 120 + Math.sin(t * 6) * 20 : ti === 'T3' ? 100 + Math.sin(t * 7) * 30 : 14}
              bendL={tGiggle ? 80 : undefined}
              armR={ti === 'T4' ? 60 + Math.sin(t * 9) * 20 : 14}
              look={-1}
              blinkSeed={3}
            />
          ) : null}
          {sVisible && fallen ? sahabEl : null}
          {splash}
          <Dust x={TX0 + 60} y={FLOOR} age={t - b.chase} />
          {/* dizzy stars over fallen Sahab */}
          {t >= b.splash + 0.3
            ? Array.from({length: 4}).map((_, i) => {
                const a = t * 4 + (i / 4) * Math.PI * 2;
                const x = sx - 660 + Math.cos(a) * 80;
                const y = FLOOR - 120 + Math.sin(a) * 26;
                return (
                  <path
                    key={i}
                    transform={`translate(${x},${y}) scale(0.9)`}
                    d="M 0 -22 L 6 -6 L 22 -6 L 9 4 L 14 20 L 0 10 L -14 20 L -9 4 L -22 -6 L -6 -6 Z"
                    fill="#ffd166"
                    stroke={OUT}
                    strokeWidth={3}
                  />
                );
              })
            : null}
        </svg>
      </World>
      {on(t, 1.6, 4.4) ? <Pill text="فجر" x={toScreen(cam, FX0, FLOOR + 110).x} y={Math.min(1850, toScreen(cam, FX0, FLOOR + 110).y)} color={TEAL} age={t - 1.6} left={4.4 - t} /> : null}
      {on(t, 0.3, 2.0) ? <Pill text="في نفس اللحظة.. عند باب الحمام" x={W / 2} y={150} color="#3b2a6b" size={46} age={t - 0.3} left={2.0 - t} /> : null}
      {t < ev.F1[0] && Math.sin(t * 20) > 0.7 ? <Pow text="دق!" x={doorS.x - 40 + noise(t, 2) * 30} y={doorS.y - 40} age={0.2} size={90} rot={-12} /> : null}
      {on(t, b.click, b.click + 1) ? <Pow text="كلِك!" x={doorS.x + 120} y={doorS.y + 140} age={t - b.click} size={110} /> : null}
      {on(t, b.slip + 0.3, b.slip + 1.3) ? <Pow text="سلااااخ!" x={W / 2} y={toScreen(cam, 540, FLOOR - 300).y} age={t - b.slip - 0.3} size={150} fill="#bfe9ff" stroke="#1f5f9a" rot={-6} /> : null}
      <Bubbles ev={ev} t={t} cam={cam} place={place} texts={T2.text} shouts={new Set(['S1', 'S4', 'F6', 'F2'])} />
      <Grade tint="#ffb070" strength={0.06} />
    </AbsoluteFill>
  );
};

const Wipe2: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <Iris t={frame / fps} cuts={[T2.off.hall, T2.off.end]} color="#2fa59d" />;
};

export const Episode2: React.FC = () => {
  const {fps} = useVideoConfig();
  const at = (s: number) => Math.round(s * fps);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Sequence name="Title" durationInFrames={at(T2.off.hall)}>
        <TitleScene episode="الحلقة ٢" subtitle="جرادة!" />
      </Sequence>
      <Sequence name="Hallway" from={at(T2.off.hall)} durationInFrames={at(T2.off.end) - at(T2.off.hall)}>
        <HallScene />
      </Sequence>
      <Sequence name="End card" from={at(T2.off.end)}>
        <EndScene next="الحلقة ٣" lines={['ترف ترمي المخدة..', 'والمطاردة تبدأ!']} />
      </Sequence>
      <Wipe2 />
      <Audio src={staticFile('ep2_audio.wav')} />
    </AbsoluteFill>
  );
};
