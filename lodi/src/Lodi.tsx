import React from 'react';
import {clamp01, lerp, mix, rnd} from './lib';

export type Expr = 'neutral' | 'worried' | 'nervous' | 'sly' | 'smug' | 'determined' | 'confused' | 'sad' | 'shock' | 'happy';
export type Kit = 'hilal' | 'ahli';

const KITS: Record<Kit, {shirt: string; shade: string; trim: string; shorts: string; socks: string}> = {
  hilal: {shirt: '#1d55cc', shade: '#123b94', trim: '#ffffff', shorts: '#1d55cc', socks: '#1d55cc'},
  ahli: {shirt: '#109a4c', shade: '#0a6a33', trim: '#ffffff', shorts: '#109a4c', socks: '#109a4c'},
};
export const KIT_COLORS = KITS;

const OUT = '#2a1d24';
const SW = 5;
const SKIN = '#d9a57c';
const SKIN_SH = '#b98159';
const HAIR = '#141014';
const HAIR_HI = '#4a3d4c';

const SH_X = 124;
const SH_Y = -628;
const UPPER = 122;
const FORE = 112;

export type LodiProps = {
  id: string;
  x: number;
  y: number;
  s?: number;
  t: number;
  kit: Kit;
  expr?: Expr;
  mouth?: number | null;
  armL?: number;
  armR?: number;
  bendL?: number;
  bendR?: number;
  sit?: boolean;
  walk?: boolean;
  walkSpeed?: number;
  kneeShake?: number;
  lean?: number;
  look?: number;
  lookY?: number;
  blinkSeed?: number;
  glare?: number; // 0..1 sweep position of light on the glasses
  propL?: React.ReactNode;
  propR?: React.ReactNode;
  headTilt?: number;
  bob?: number;
  hideLegs?: boolean;
};

const BROWS: Record<Expr, [number, number]> = {
  // inner dy, outer dy
  neutral: [0, 0],
  worried: [-22, 10],
  nervous: [-16, 8],
  sly: [10, -10],
  smug: [6, -6],
  determined: [18, -10],
  confused: [-20, 4],
  sad: [-18, 14],
  shock: [-30, -26],
  happy: [-6, -6],
};
const LIDS: Record<Expr, number> = {
  neutral: 0.12,
  worried: 0.05,
  nervous: 0.05,
  sly: 0.4,
  smug: 0.38,
  determined: 0.3,
  confused: 0.1,
  sad: 0.35,
  shock: 0,
  happy: 0.2,
};

const Limb: React.FC<{d: string; w: number; color: string}> = ({d, w, color}) => (
  <>
    <path d={d} fill="none" stroke={OUT} strokeWidth={w + SW * 2} strokeLinecap="round" strokeLinejoin="round" />
    <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
  </>
);

const Arm: React.FC<{side: -1 | 1; raise: number; bend: number; shirt: string; trim: string; prop?: React.ReactNode}> = ({
  side,
  raise,
  bend,
  shirt,
  trim,
  prop,
}) => {
  const b = (bend * Math.PI) / 180;
  const hx = side * Math.sin(b) * FORE;
  const hy = UPPER + Math.cos(b) * FORE;
  return (
    <g transform={`translate(${side * SH_X},${SH_Y}) rotate(${side * -raise})`}>
      <Limb d={`M 0 0 L 0 ${UPPER} L ${hx} ${hy}`} w={46} color={SKIN} />
      <circle cx={hx} cy={hy} r={29} fill={SKIN} stroke={OUT} strokeWidth={SW} />
      <path d={`M ${hx - side * 10} ${hy + 10} q ${side * 9} 9 ${side * 18} 0`} stroke={OUT} strokeWidth={3} fill="none" opacity={0.5} />
      {prop ? <g transform={`translate(${hx},${hy}) rotate(${side * raise})`}>{prop}</g> : null}
      <path d="M -38 -16 Q 0 -34 38 -16 L 40 66 Q 0 76 -40 66 Z" fill={shirt} stroke={OUT} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M -40 56 Q 0 66 40 56" stroke={trim} strokeWidth={10} fill="none" />
    </g>
  );
};

// curls around the head (precomputed)
const CURLS = (() => {
  const out: {x: number; y: number; r: number}[] = [];
  // crown arc
  for (let i = 0; i <= 12; i++) {
    const a = Math.PI * (1.02 + (i / 12) * 0.96);
    out.push({x: Math.cos(a) * 205, y: -880 + Math.sin(a) * 215, r: 58 + rnd(i) * 14});
  }
  // sides down to the shoulders
  for (let i = 0; i < 6; i++) {
    const y = -860 + i * 52;
    out.push({x: -222 - (i % 2) * 18, y, r: 50 + rnd(i + 20) * 10});
    out.push({x: 222 + (i % 2) * 18, y, r: 50 + rnd(i + 40) * 10});
  }
  return out;
})();

export const Lodi: React.FC<LodiProps> = (p) => {
  const {t, id} = p;
  const s = p.s ?? 1;
  const kit = KITS[p.kit];
  const expr = p.expr ?? 'neutral';
  const sit = !!p.sit;
  const walk = !!p.walk;
  const ph = t * (p.walkSpeed ?? 9);
  const SIT = sit ? 120 : 0;
  const bob = (walk ? Math.abs(Math.sin(ph)) * 18 : 0) + (p.bob ?? 0);
  const breathe = 1 + Math.sin(t * 2.1 + (p.blinkSeed ?? 0)) * 0.012;
  const sway = Math.sin(t * 1.3) * 6;
  const tilt = (p.headTilt ?? 0) + Math.sin(t * 1.1 + 1) * 1.6 + (walk ? Math.sin(ph * 2) * 1.5 : 0);
  const look = p.look ?? 0;
  const lookY = p.lookY ?? 0;

  const period = 3.6 + rnd(p.blinkSeed ?? 2) * 1.2;
  const bp = (t + (p.blinkSeed ?? 0) * 1.3) % period;
  const blink = bp < 0.15 ? Math.sin((bp / 0.15) * Math.PI) : 0;
  const lid = Math.min(1, LIDS[expr] + blink * (1 - LIDS[expr]));
  const [bi, bo] = BROWS[expr];

  const legA = walk ? Math.sin(ph) * 26 : 0;
  const armSwing = walk ? Math.sin(ph) * 28 : 0;
  const armL = (p.armL ?? 8) + (walk ? 10 + armSwing : 0);
  const armR = (p.armR ?? 8) + (walk ? 10 - armSwing : 0);
  const knee = (p.kneeShake ?? 0) * Math.sin(t * 60) * 9;

  // mouth
  const m = p.mouth ?? null;
  const talkingNow = m !== null && m > 0.05;
  const mouthEl = (() => {
    const y = -722;
    if (!talkingNow) {
      const d: Record<Expr, string> = {
        neutral: 'M -36 0 Q 0 8 36 0',
        worried: 'M -34 8 Q -16 -4 0 4 Q 16 12 34 2',
        nervous: 'M -40 4 Q -26 -6 -12 4 Q 0 12 12 4 Q 26 -6 40 4',
        sly: 'M -30 6 Q 10 18 44 -10',
        smug: 'M -36 0 Q 4 20 42 -8',
        determined: 'M -36 4 L 36 4',
        confused: 'M -30 8 Q 0 -6 34 2',
        sad: 'M -34 12 Q 0 -8 34 12',
        shock: '',
        happy: 'M -42 -6 Q 0 30 42 -6',
      };
      if (expr === 'shock') return <ellipse cx={0} cy={y} rx={20} ry={26} fill="#5a1620" stroke={OUT} strokeWidth={5} />;
      return <path d={d[expr]} transform={`translate(0,${y})`} fill="none" stroke={OUT} strokeWidth={7} strokeLinecap="round" />;
    }
    const a = m ?? 0;
    const w = 50 + a * 24;
    const h = 8 + a * 48;
    const corner = expr === 'sad' || expr === 'worried' || expr === 'determined' ? 6 : expr === 'happy' || expr === 'smug' ? -6 : 0;
    const top = expr === 'happy' ? 2 : -h * 0.25;
    const d = `M ${-w / 2} ${corner} C ${-w / 4} ${top} ${w / 4} ${top} ${w / 2} ${corner} C ${w / 3} ${h * 1.15} ${-w / 3} ${h * 1.15} ${-w / 2} ${corner} Z`;
    return (
      <g transform={`translate(0,${y - 6})`}>
        <clipPath id={`${id}-mc`}>
          <path d={d} />
        </clipPath>
        <path d={d} fill="#5a1620" />
        <g clipPath={`url(#${id}-mc)`}>
          <ellipse cx={0} cy={h * 0.85} rx={w * 0.3} ry={h * 0.35} fill="#d9607a" />
          <rect x={-w / 2} y={Math.min(corner, top) - 4} width={w} height={11} fill="#fff" />
        </g>
        <path d={d} fill="none" stroke={OUT} strokeWidth={5} strokeLinejoin="round" />
      </g>
    );
  })();

  const eye = (side: -1 | 1) => {
    const cx = side * 66;
    const cy = -846;
    const l = clamp01(lid);
    const rx = expr === 'shock' ? 32 : 28;
    const ry = expr === 'shock' ? 34 : 30;
    const lidY = -ry + l * ry * 2;
    const tiltLid = expr === 'sad' || expr === 'worried' ? side * 10 : expr === 'determined' || expr === 'sly' ? side * -10 : 0;
    return (
      <g transform={`translate(${cx},${cy})`}>
        <clipPath id={`${id}-e${side}`}>
          <ellipse rx={rx} ry={ry} />
        </clipPath>
        <ellipse rx={rx} ry={ry} fill="#fff" />
        <g clipPath={`url(#${id}-e${side})`}>
          <circle cx={look * 9} cy={4 + lookY * 7} r={expr === 'shock' ? 12 : 18} fill="#3a2316" />
          <circle cx={look * 9} cy={4 + lookY * 7} r={expr === 'shock' ? 6 : 9} fill="#0a0405" />
          <circle cx={look * 9 - 6} cy={-3 + lookY * 7} r={5} fill="#fff" />
          <g transform={`rotate(${tiltLid})`}>
            <rect x={-rx - 10} y={-ry - 30} width={rx * 2 + 20} height={lidY + ry + 30} fill={SKIN} />
            <line x1={-rx - 4} y1={lidY} x2={rx + 4} y2={lidY} stroke={OUT} strokeWidth={l > 0.02 ? 6 : 0} strokeLinecap="round" />
          </g>
        </g>
        <ellipse rx={rx} ry={ry} fill="none" stroke={OUT} strokeWidth={4} />
      </g>
    );
  };

  const curls = CURLS.map((c, i) => {
    const sw = Math.sin(t * 1.6 + i * 0.7) * 3 + (walk ? Math.sin(ph + i) * 3 : 0);
    return (
      <g key={i}>
        <circle cx={c.x + sw} cy={c.y} r={c.r} fill={HAIR} stroke={OUT} strokeWidth={4} />
        <path
          d={`M ${c.x + sw - c.r * 0.5} ${c.y - c.r * 0.2} Q ${c.x + sw} ${c.y - c.r * 0.75} ${c.x + sw + c.r * 0.5} ${c.y - c.r * 0.2}`}
          stroke={HAIR_HI}
          strokeWidth={7}
          fill="none"
          strokeLinecap="round"
          opacity={0.8}
        />
      </g>
    );
  });

  const glareX = lerp(-140, 140, clamp01(p.glare ?? 0.35));

  return (
    <g transform={`translate(${p.x},${p.y})`}>
      <defs>
        <linearGradient id={`${id}-shirt`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={mix(kit.shirt, '#ffffff', 0.15)} />
          <stop offset="0.6" stopColor={kit.shirt} />
          <stop offset="1" stopColor={kit.shade} />
        </linearGradient>
        <radialGradient id={`${id}-face`} cx="0.42" cy="0.35" r="0.75">
          <stop offset="0" stopColor={mix(SKIN, '#ffffff', 0.2)} />
          <stop offset="0.7" stopColor={SKIN} />
          <stop offset="1" stopColor={SKIN_SH} />
        </radialGradient>
        <pattern id={`${id}-stripes`} width="34" height="34" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
          <rect width="12" height="34" fill="#ffffff" opacity="0.09" />
        </pattern>
        <clipPath id={`${id}-lens`}>
          <rect x={-120} y={-884} width={108} height={74} rx={16} />
          <rect x={12} y={-884} width={108} height={74} rx={16} />
        </clipPath>
      </defs>
      {!p.hideLegs ? <ellipse cx={0} cy={4} rx={200 * s} ry={28 * s} fill="#000" opacity={0.22} /> : null}
      <g transform={`translate(0,${-bob}) rotate(${p.lean ?? 0}) scale(${s})`}>
        {/* back hair mass */}
        <g transform={`translate(0,${SIT}) rotate(${tilt * 0.5},0,-700)`}>
          <path d="M -230 -600 Q -260 -900 -150 -1060 Q 0 -1140 150 -1060 Q 260 -900 230 -600 Z" fill={HAIR} stroke={OUT} strokeWidth={SW} />
        </g>

        {/* legs */}
        {!p.hideLegs && !sit
          ? [-1, 1].map((side) => (
                <g key={side} transform={`rotate(${side * legA},${side * 62},-380) translate(${knee * side},0)`}>
                  <Limb d={`M ${side * 62} -380 L ${side * 62} -52`} w={50} color={SKIN} />
                  <path d={`M ${side * 62 - 30} -200 L ${side * 62 + 30} -200 L ${side * 62 + 28} -50 L ${side * 62 - 28} -50 Z`} fill={kit.socks} stroke={OUT} strokeWidth={4} />
                  <path d={`M ${side * 62 - 30} -188 L ${side * 62 + 30} -188`} stroke={kit.trim} strokeWidth={8} />
                  <g transform={`translate(${side * 68},-24)`}>
                    <path d="M -50 12 Q -54 -30 -16 -36 L 22 -36 Q 58 -30 60 8 Q 60 24 34 24 L -34 24 Q -54 24 -50 12 Z" fill="#f4f4f4" stroke={OUT} strokeWidth={SW} />
                    <path d="M -50 14 L 60 14" stroke="#cfd6e2" strokeWidth={10} />
                    <path d="M -10 -30 l 22 8" stroke={kit.shirt} strokeWidth={6} strokeLinecap="round" />
                  </g>
                </g>
              ))
          : null}

        <g transform={`translate(0,${SIT})`}>
          {/* shorts */}
          <path
            d={sit ? 'M -128 -420 L 128 -420 Q 150 -370 156 -322 Q 70 -300 0 -318 Q -70 -300 -156 -322 Q -150 -370 -128 -420 Z' : 'M -128 -420 L 128 -420 Q 146 -350 150 -290 L 14 -282 L 0 -330 L -14 -282 L -150 -290 Q -146 -350 -128 -420 Z'}
            fill={kit.shorts}
            stroke={OUT}
            strokeWidth={SW}
            strokeLinejoin="round"
          />
          {sit && !p.hideLegs ? <g transform={`translate(0,${-SIT})`}>{[-1, 1].map((side) => (
                <g key={side} transform={`translate(${knee * side},0)`}>
                  <Limb d={`M ${side * 64} -190 L ${side * 64} -52`} w={50} color={SKIN} />
                  <path d={`M ${side * 64 - 30} -120 L ${side * 64 + 30} -120 L ${side * 64 + 28} -50 L ${side * 64 - 28} -50 Z`} fill={kit.socks} stroke={OUT} strokeWidth={4} />
                  <path d={`M ${side * 64 - 30} -110 L ${side * 64 + 30} -110`} stroke={kit.trim} strokeWidth={8} />
                  <ellipse cx={side * 64} cy={-206} rx={52} ry={44} fill={SKIN} stroke={OUT} strokeWidth={SW} />
                  <g transform={`translate(${side * 70},-24)`}>
                    <path d="M -50 12 Q -54 -30 -16 -36 L 22 -36 Q 58 -30 60 8 Q 60 24 34 24 L -34 24 Q -54 24 -50 12 Z" fill="#f4f4f4" stroke={OUT} strokeWidth={SW} />
                    <path d="M -50 14 L 60 14" stroke="#cfd6e2" strokeWidth={10} />
                    <path d="M -10 -30 l 22 8" stroke={kit.shirt} strokeWidth={6} strokeLinecap="round" />
                  </g>
                </g>
              ))}</g> : null}
          <path d={sit ? 'M -150 -330 L -132 -410 M 150 -330 L 132 -410' : 'M -146 -300 L -132 -410 M 146 -300 L 132 -410'} stroke={kit.trim} strokeWidth={9} />

          {/* torso */}
          <g transform={`scale(1,${breathe})`} style={{transformOrigin: '0px -420px'}}>
            <path
              d="M -118 -650 Q -138 -640 -132 -580 L -136 -410 Q 0 -394 136 -410 L 132 -580 Q 138 -640 118 -650 Q 0 -626 -118 -650 Z"
              fill={`url(#${id}-shirt)`}
              stroke={OUT}
              strokeWidth={SW}
              strokeLinejoin="round"
            />
            <path d="M -118 -650 Q -138 -640 -132 -580 L -136 -410 Q 0 -394 136 -410 L 132 -580 Q 138 -640 118 -650 Q 0 -626 -118 -650 Z" fill={`url(#${id}-stripes)`} />
            <path d="M -60 -646 L 0 -582 L 60 -646" fill={SKIN_SH} stroke={kit.trim} strokeWidth={12} strokeLinejoin="round" />
            <path d="M -60 -646 L 0 -582 L 60 -646" fill="none" stroke={OUT} strokeWidth={3} />
            <path d="M -134 -560 L -136 -416 M 134 -560 L 136 -416" stroke={kit.shade} strokeWidth={18} opacity={0.7} />
            <path d="M -136 -420 Q 0 -404 136 -420" stroke={kit.trim} strokeWidth={8} fill="none" />
            <path d="M -40 -540 Q -20 -520 -4 -546 M 36 -480 Q 60 -470 80 -500" stroke={kit.shade} strokeWidth={4} fill="none" opacity={0.5} />
            {/* neck */}
            <path d="M -40 -720 L -40 -646 Q 0 -620 40 -646 L 40 -720 Z" fill={SKIN_SH} stroke={OUT} strokeWidth={SW} />
          </g>

          <Arm side={-1} raise={armL} bend={p.bendL ?? (armL > 60 ? 24 : 8)} shirt={kit.shirt} trim={kit.trim} prop={p.propL} />
          <Arm side={1} raise={armR} bend={p.bendR ?? (armR > 60 ? 24 : 8)} shirt={kit.shirt} trim={kit.trim} prop={p.propR} />

          {/* head */}
          <g transform={`translate(${sway * 0.3},0) rotate(${tilt},0,-700)`}>
            {curls.slice(13)}
            <path
              d="M -168 -870 Q -170 -1040 0 -1048 Q 170 -1040 168 -870 Q 166 -740 110 -690 Q 50 -646 0 -646 Q -50 -646 -110 -690 Q -166 -740 -168 -870 Z"
              fill={`url(#${id}-face)`}
              stroke={OUT}
              strokeWidth={SW}
            />
            {/* stubble */}
            <path d="M -140 -760 Q -120 -660 0 -652 Q 120 -660 140 -760 Q 100 -700 0 -700 Q -100 -700 -140 -760 Z" fill="#3a2a22" opacity={0.13} />
            <ellipse cx={-118} cy={-770} rx={36} ry={20} fill="#ff8f8f" opacity={0.25} />
            <ellipse cx={118} cy={-770} rx={36} ry={20} fill="#ff8f8f" opacity={0.25} />
            {eye(-1)}
            {eye(1)}
            {/* glasses */}
            <g>
              <rect x={-120} y={-884} width={108} height={74} rx={16} fill="#cfe8ff" opacity={0.18} />
              <rect x={12} y={-884} width={108} height={74} rx={16} fill="#cfe8ff" opacity={0.18} />
              <g clipPath={`url(#${id}-lens)`}>
                <path d={`M ${glareX - 30} -900 L ${glareX + 10} -900 L ${glareX - 40} -790 L ${glareX - 80} -790 Z`} fill="#fff" opacity={0.28} />
                <path d={`M ${glareX + 22} -900 L ${glareX + 34} -900 L ${glareX - 16} -790 L ${glareX - 28} -790 Z`} fill="#fff" opacity={0.22} />
              </g>
              <rect x={-120} y={-884} width={108} height={74} rx={16} fill="none" stroke="#17141c" strokeWidth={10} />
              <rect x={12} y={-884} width={108} height={74} rx={16} fill="none" stroke="#17141c" strokeWidth={10} />
              <path d="M -12 -852 Q 0 -864 12 -852" stroke="#17141c" strokeWidth={9} fill="none" />
              <path d="M -120 -862 L -166 -870 M 120 -862 L 166 -870" stroke="#17141c" strokeWidth={9} />
            </g>
            {/* brows */}
            {[-1, 1].map((side) => (
              <path
                key={side}
                d={`M ${side * 24} ${-904 + bi} Q ${side * 64} ${-926 + (bi + bo) / 2} ${side * 112} ${-902 + bo}`}
                stroke={HAIR}
                strokeWidth={17}
                strokeLinecap="round"
                fill="none"
              />
            ))}
            {/* nose */}
            <path d="M -6 -824 Q -2 -790 -22 -772 Q -4 -760 18 -770" stroke={SKIN_SH} strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            {mouthEl}
            {expr === 'nervous' || expr === 'worried' ? (
              <path d={`M 150 ${-940 + ((t * 70) % 90)} q 12 22 0 30 q -12 -8 0 -30 z`} fill="#bfe6ff" stroke="#4a9be0" strokeWidth={3} opacity={1 - ((t * 70) % 90) / 90} />
            ) : null}
            {/* front curls (crown) */}
            {curls.slice(0, 13)}
            {[-90, -30, 30, 90].map((x, i) => (
              <circle key={i} cx={x + Math.sin(t * 1.5 + i) * 3} cy={-1010 + (i % 2) * 14} r={40} fill={HAIR} stroke={OUT} strokeWidth={4} />
            ))}
          </g>
        </g>
      </g>
    </g>
  );
};
