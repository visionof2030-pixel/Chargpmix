import React from 'react';
import {AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Audio} from '@remotion/media';
import JT from './timeline.json';
import {SideJassar} from './SideJassar';
import {Kid, LOOKS, Rifle, Expr} from '../Kid';
import {FONT, Vignette} from '../ui';
import {Cam, H, W, camTransform, clamp01, easeOut, followCam, lerp, noise, pop, rnd, smooth} from '../tl';

type JTT = {
  total: number;
  beats: Record<string, number>;
  lines: Record<string, number[]>;
  text: Record<string, string>;
  env: Record<string, number[]>;
  bright: Record<string, number[]>;
  walkPeriod: number;
  runPeriod: number;
};
export const J = JT as unknown as JTT;
const BT = J.beats;
const FPS = 30;
const GROUND = 1580;
const CHAR_X = 400;
const ROCK_TOP = 1300;

/* ------------------------------------------------------------------ motion model */
const speed = (t: number) => {
  if (t < BT.stop) return 230 * (1 - smooth((t - (BT.stop - 0.45)) / 0.45));
  if (t < BT.run) return 0;
  if (t < BT.jump) return 950 * smooth((t - BT.run) / 0.3);
  if (t < BT.land) return 720;
  return 0;
};
// distance integrated on a fine grid (deterministic)
const DIST: number[] = (() => {
  const out = [0];
  const dt = 1 / 120;
  let d = 0;
  for (let i = 1; i <= Math.ceil(J.total * 120) + 2; i++) {
    d += speed(i * dt) * dt;
    out.push(d);
  }
  return out;
})();
export const dist = (t: number) => {
  const f = Math.max(0, t * 120);
  const i = Math.min(DIST.length - 2, Math.floor(f));
  return lerp(DIST[i], DIST[i + 1], f - i);
};
const ROCK_X = () => dist(BT.land) + CHAR_X + 70;

const lineAt = (t: number) => {
  for (const [k, [a, b]] of Object.entries(J.lines)) if (t >= a && t < b) return k;
  return null;
};
const mouthAt = (t: number) => {
  const k = lineAt(t);
  if (!k) return {m: null as number | null, br: 0.5};
  const f = (t - J.lines[k][0]) * FPS;
  const i = Math.min(Math.floor(f), J.env[k].length - 1);
  return {m: Math.min(1, J.env[k][i] * 1.1), br: J.bright[k][i]};
};

/** front view between the two turns, and after landing on the rock */
const frontAmount = (t: number) => {
  const turn = smooth((t - BT.turn) / 0.18) * (1 - smooth((t - BT.turnBack) / 0.18));
  const rock = smooth((t - BT.land - 0.05) / 0.18);
  return Math.max(turn, rock);
};

const sidePose = (t: number) => {
  const walkW = 1 - smooth((t - (BT.stop - 0.35)) / 0.35);
  const runW = t >= BT.run && t < BT.jump ? smooth((t - BT.run) / 0.2) : 0;
  const walkPhase = t / J.walkPeriod + 0.25;
  const runPhase = (t - BT.run) / J.runPeriod + 0.25;
  const crouch = t >= BT.anticip && t < BT.run + 0.1 ? Math.sin(clamp01((t - BT.anticip) / 0.35) * Math.PI) : 0;
  const tuck = t >= BT.jump && t < BT.land ? Math.sin(clamp01((t - BT.jump) / (BT.land - BT.jump)) * Math.PI) : 0;
  const {m, br} = mouthAt(t);
  const listening = t >= BT.scream && t < BT.turn;
  return {
    phase: t < BT.run ? walkPhase : runPhase,
    walk: t < BT.run ? walkW : 0,
    run: runW,
    crouch,
    tuck,
    t,
    vel: speed(t),
    mouth: m,
    bright: br,
    brow: (t >= BT.run || t >= BT.J4 ? 'determined' : listening ? 'alert' : 'calm') as 'determined' | 'alert' | 'calm',
    look: listening ? -0.6 + Math.sin(t * 2) * 0.6 : 1,
    blink: ((t + 0.7) % 3.4) < 0.14 ? 1 : 0,
    lamp: t >= BT.lampOn ? 1 : 0,
  };
};

const jumpY = (t: number) => {
  if (t < BT.jump) return GROUND;
  if (t >= BT.land) return ROCK_TOP;
  const k = (t - BT.jump) / (BT.land - BT.jump);
  return lerp(GROUND, ROCK_TOP, k) - Math.sin(k * Math.PI) * 220;
};

/* ------------------------------------------------------------------ background */
const Valley: React.FC<{t: number; d: number; blurX: number}> = ({t, d, blurX}) => {
  const night = clamp01((t - 4) / 16);
  const layer = (seed: number, baseY: number, amp: number, color: string, factor: number, step = 120) => {
    const off = -((d * factor) % (step * 12));
    let p = `M ${off - step} ${H}`;
    for (let i = -1; i <= 24; i++) {
      const idx = i + Math.floor((d * factor) / step);
      const h = baseY - (Math.sin(idx * 1.3 + seed) * 0.5 + 0.5) * amp - rnd(idx + seed * 31) * amp * 0.4;
      p += ` L ${off + i * step} ${h}`;
    }
    p += ` L ${off + 25 * step} ${H} Z`;
    return <path d={p} fill={color} />;
  };
  const near = (factor: number, n: number, seed: number, y: number, draw: (x: number, i: number) => React.ReactNode) =>
    Array.from({length: n}).map((_, i) => {
      const span = 1600;
      const x = ((rnd(i + seed) * span - d * factor) % span + span) % span - 260;
      return <g key={i}>{draw(x, i)}</g>;
    });
  const rockX = ROCK_X() - d;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
      <defs>
        <linearGradient id="vsky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={night > 0.5 ? '#1a1a46' : '#ff9a5a'} />
          <stop offset="0.55" stopColor={night > 0.5 ? '#5a3a6a' : '#ffc27a'} />
          <stop offset="1" stopColor={night > 0.5 ? '#c46a5a' : '#ffdfa0'} />
        </linearGradient>
        <radialGradient id="vsun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff2b0" />
          <stop offset="0.4" stopColor="#ffb347" stopOpacity="0.8" />
          <stop offset="1" stopColor="#ff7a3a" stopOpacity="0" />
        </radialGradient>
        <filter id="motionX" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation={`${blurX} 0`} />
        </filter>
        <linearGradient id="rockG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7a5a4a" />
          <stop offset="1" stopColor="#3e2a2a" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill="url(#vsky)" />
      <rect width={W} height={H} fill="#1a1440" opacity={night * 0.55} />
      <circle cx={260} cy={lerp(980, 1180, night)} r={420} fill="url(#vsun)" opacity={1 - night * 0.6} />
      <circle cx={260} cy={lerp(980, 1180, night)} r={110} fill="#fff1b8" opacity={1 - night * 0.7} />
      {night > 0.3
        ? Array.from({length: 50}).map((_, i) => <circle key={i} cx={rnd(i) * W} cy={rnd(i + 3) * 700} r={1.5 + rnd(i + 6) * 2} fill="#fff" opacity={(night - 0.3) * (0.4 + 0.6 * Math.abs(Math.sin(t + i)))} />)
        : null}
      {layer(1, 1080, 380, '#b0586a', 0.06, 160)}
      {layer(2, 1260, 300, '#7e3c58', 0.18, 140)}
      {layer(3, 1420, 220, '#552a44', 0.4, 120)}
      {/* acacia trees + boulders mid-near */}
      <g filter={blurX > 0.5 ? 'url(#motionX)' : undefined}>
        {near(0.6, 4, 10, 1430, (x, i) => (
          <g transform={`translate(${x},${1450})`}>
            <path d="M 0 0 L 6 -170" stroke="#2e1a22" strokeWidth={16} />
            <ellipse cx={6} cy={-190} rx={110 + (i % 2) * 30} ry={34} fill="#3c2a30" />
            <ellipse cx={-30} cy={-176} rx={60} ry={20} fill="#3c2a30" />
          </g>
        ))}
      </g>
      {/* ground */}
      <rect x={0} y={GROUND - 30} width={W} height={H - GROUND + 30} fill="#6e4436" />
      <rect x={0} y={GROUND - 30} width={W} height={16} fill="#8a5a46" />
      <g filter={blurX > 0.5 ? 'url(#motionX)' : undefined}>
        {near(1.0, 16, 40, GROUND, (x, i) => (
          <ellipse cx={x} cy={GROUND + 30 + rnd(i + 8) * 260} rx={12 + rnd(i) * 26} ry={6 + rnd(i) * 10} fill="#553428" />
        ))}
      </g>
      {/* the rock he jumps on */}
      <g transform={`translate(${rockX},0)`}>
        <path d={`M -260 ${GROUND + 20} Q -250 ${ROCK_TOP + 60} -150 ${ROCK_TOP + 6} Q 0 ${ROCK_TOP - 20} 150 ${ROCK_TOP + 10} Q 250 ${ROCK_TOP + 70} 260 ${GROUND + 20} Z`} fill="url(#rockG)" stroke="#24161a" strokeWidth={8} />
        <path d={`M -150 ${ROCK_TOP + 40} Q 0 ${ROCK_TOP + 10} 140 ${ROCK_TOP + 40}`} stroke="#9a7060" strokeWidth={8} fill="none" opacity={0.6} />
      </g>
      {/* foreground grass, fast + blurred */}
      <g filter="url(#motionX)">
        {near(1.6, 9, 70, 1900, (x, i) => (
          <g transform={`translate(${x},${1920})`}>
            {[0, 1, 2, 3, 4].map((k) => (
              <path key={k} d={`M ${k * 14} 0 Q ${k * 14 + Math.sin(t * 2 + i + k) * 10} -90 ${k * 14 + 18} -${150 + rnd(i * 5 + k) * 90}`} stroke="#2a1820" strokeWidth={10} fill="none" />
            ))}
          </g>
        ))}
      </g>
    </svg>
  );
};

/* ------------------------------------------------------------------ main */
export const JassarShort: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const tReal = frame / fps;
  const frozen = tReal >= BT.freeze;
  const t = Math.min(tReal, BT.freeze);
  const d = dist(t);
  const fa = frontAmount(t);
  const run = t >= BT.run && t < BT.land;
  const blurX = run ? 10 * smooth((t - BT.run) / 0.3) : 0;
  const y = jumpY(t);
  const S = 0.62;
  const pose = sidePose(t);
  const {m} = mouthAt(t);

  const target = (tt: number): Cam => {
    const tc = Math.min(tt, BT.freeze);
    if (tc >= BT.land) return {zoom: 1.18, cx: CHAR_X + 40, cy: 1080};
    if (tc >= BT.run) return {zoom: 1.0, cx: 540, cy: 1100};
    if (tc >= BT.J4) return {zoom: 1.28, cx: CHAR_X + 60, cy: 1050};
    if (tc >= BT.turn) return {zoom: 1.5, cx: CHAR_X + 40, cy: 980};
    if (tc >= BT.scream) return {zoom: 1.35, cx: CHAR_X + 80, cy: 1000};
    return {zoom: 1.05, cx: 520, cy: 1150};
  };
  const base = followCam(frame, target, 0.07);
  const shake = run ? 4 : 0;
  const cam: Cam = {...base, sx: noise(t * 3, 1) * shake, sy: noise(t * 3, 5) * shake};

  const frontExpr: Expr = t >= BT.J4 ? 'brave' : t >= BT.J3 + 1.2 ? 'scared' : 'worried';
  const frontScaleX = Math.max(0.02, fa);
  const sideScaleX = Math.max(0.02, 1 - fa);
  const raise = clamp01((t - BT.raise) / 0.35);
  const lampFlash = t >= BT.lampOn ? Math.max(0, 1 - (t - BT.lampOn) / 0.25) : 0;
  const freezeK = frozen ? clamp01((tReal - BT.freeze) / 0.25) : 0;

  const ghosts = run ? [0.045, 0.03, 0.015] : [];

  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transformOrigin: '0 0',
          transform: camTransform(cam),
          filter: frozen ? `saturate(${1 - freezeK * 0.55}) contrast(${1 + freezeK * 0.15}) brightness(${1 - freezeK * 0.1})` : undefined,
        }}
      >
        <Valley t={t} d={d} blurX={blurX} />
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
          <defs>
            <linearGradient id="lampBeam" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#fff7c2" stopOpacity="0.55" />
              <stop offset="1" stopColor="#fff7c2" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="lampBeamUp" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0" stopColor="#fff7c2" stopOpacity="0.5" />
              <stop offset="1" stopColor="#fff7c2" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* headlamp beam: forward while running (side), up into the sky on the rock */}
          {t >= BT.lampOn && fa < 0.5 ? <path d={`M ${CHAR_X + 125} ${y - 615} L 1200 ${y - 860} L 1200 ${y - 360} Z`} fill="url(#lampBeam)" /> : null}
          {t >= BT.land ? <path d={`M ${CHAR_X} ${y - 611} L ${CHAR_X - 300} 0 L ${CHAR_X + 300} 0 Z`} fill="url(#lampBeamUp)" opacity={0.8} /> : null}
          {/* motion trail ghosts */}
          {ghosts.map((g, i) => (
            <g key={i} opacity={0.16} transform={`translate(${CHAR_X},${jumpY(t - g)}) scale(${sideScaleX},1) translate(${-CHAR_X},${-jumpY(t - g)})`}>
              <SideJassar x={CHAR_X - (speed(t) * g) * 0.25} y={jumpY(t - g)} s={S} pose={sidePose(t - g)} />
            </g>
          ))}
          {fa < 0.98 ? (
            <g transform={`translate(${CHAR_X},${y}) scale(${sideScaleX},1) translate(${-CHAR_X},${-y})`}>
              <SideJassar x={CHAR_X} y={y} s={S} pose={pose} />
            </g>
          ) : null}
          {fa > 0.02 ? (
            <g transform={`translate(${CHAR_X},${y}) scale(${frontScaleX},1) translate(${-CHAR_X},${-y})`}>
              <Kid
                id="js-front"
                look={LOOKS.jassar}
                x={CHAR_X}
                y={y}
                s={0.56}
                t={t}
                expr={t >= BT.land ? 'brave' : frontExpr}
                mouth={m}
                headlamp
                look2={t >= BT.land ? 0.3 : 0}
                lookY={t >= BT.land ? -0.6 : 0}
                armR={t >= BT.land ? lerp(20, 168, easeOut(raise)) : t >= BT.J4 ? 30 : 10}
                bendR={t >= BT.land ? lerp(-40, 0, raise) : undefined}
                propR={t >= BT.land ? <Rifle /> : undefined}
                armL={t >= BT.J3 && t < BT.J4 ? 60 + Math.sin(t * 3) * 10 : undefined}
                bendL={t >= BT.J3 && t < BT.J4 ? -100 : undefined}
                blinkSeed={4}
              />
            </g>
          ) : null}
          {/* landing dust */}
          {t >= BT.land && t < BT.land + 0.7
            ? Array.from({length: 8}).map((_, i) => {
                const k = (t - BT.land) / 0.7;
                return <circle key={i} cx={CHAR_X + (i - 3.5) * 40 * (1 + k * 2)} cy={ROCK_TOP - k * 40} r={20 + k * 40} fill="#c9a98a" opacity={(1 - k) * 0.6} />;
              })
            : null}
        </svg>
      </div>
      <div style={{position: 'absolute', inset: 0, background: '#fff7c2', opacity: lampFlash * 0.35}} />
      {/* distant scream cue */}
      {tReal >= BT.scream && tReal < BT.J2 ? (
        <div dir="rtl" style={{position: 'absolute', right: 90, top: 620, fontFamily: FONT, fontWeight: 700, fontSize: 64, color: '#fff', opacity: 0.85 * Math.sin(clamp01((tReal - BT.scream) / (BT.J2 - BT.scream)) * Math.PI), textShadow: '0 0 20px rgba(0,0,0,0.6)'}}>
          آآآآه!!.. اركضوا!!
        </div>
      ) : null}
      <JCaption t={tReal} />
      <Vignette strength={0.55} />
      {/* freeze frame title */}
      {frozen ? (
        <>
          <div style={{position: 'absolute', inset: 0, background: '#fff', opacity: Math.max(0, 1 - (tReal - BT.freeze) / 0.2) * 0.9}} />
          <div
            dir="rtl"
            style={{
              position: 'absolute',
              bottom: 230,
              width: W,
              textAlign: 'center',
              fontFamily: FONT,
              fontWeight: 700,
              color: '#ffe7a8',
              transform: `scale(${Math.max(0.01, pop((tReal - BT.freeze - 0.3) / 0.5))})`,
            }}
          >
            <div style={{fontSize: 54, color: '#fff', textShadow: '0 4px 12px rgba(0,0,0,0.7)'}}>يتبع في...</div>
            <div style={{fontSize: 120, WebkitTextStroke: '12px #2a1210', paintOrder: 'stroke fill', textShadow: '0 10px 0 #2a1210'}}>البسة اللي مو بسة!</div>
          </div>
        </>
      ) : null}
      <div style={{position: 'absolute', inset: 0, background: '#000', opacity: Math.max(1 - clamp01(tReal / 0.5), clamp01((tReal - (J.total - 0.6)) / 0.6))}} />
      <Audio src={staticFile('jassar/audio.wav')} />
    </AbsoluteFill>
  );
};

const JCaption: React.FC<{t: number}> = ({t}) => {
  for (const [k, [a, b]] of Object.entries(J.lines)) {
    if (t < a - 0.05 || t >= b + 0.3) continue;
    const words = J.text[k].split(' ');
    const prog = clamp01((t - a) / (b - a));
    const tot = words.reduce((x, w) => x + w.length + 2, 0);
    let acc = 0;
    const op = Math.min(clamp01((t - a + 0.05) / 0.12), clamp01((b + 0.3 - t) / 0.15));
    return (
      <div style={{position: 'absolute', top: 180, width: W, display: 'flex', justifyContent: 'center', opacity: op}}>
        <div
          dir="rtl"
          style={{
            position: 'relative',
            maxWidth: 940,
            padding: '30px 44px 26px',
            borderRadius: 34,
            background: 'rgba(14,10,26,0.82)',
            border: `5px solid ${LOOKS.jassar.color}`,
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: 60,
            lineHeight: 1.5,
            textAlign: 'center',
            color: '#fff',
            transform: `scale(${0.9 + 0.1 * pop((t - a) / 0.25)})`,
          }}
        >
          <div style={{position: 'absolute', top: -40, right: 34, background: LOOKS.jassar.color, borderRadius: 999, padding: '0 30px 6px', fontSize: 42, border: '4px solid #fff'}}>جسار</div>
          {words.map((w, i) => {
            const st = acc / tot;
            acc += w.length + 2;
            return (
              <span key={i} style={{display: 'inline-block', margin: '0 8px', color: prog >= st ? '#fff' : 'rgba(255,255,255,0.45)'}}>
                {w}
              </span>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};
