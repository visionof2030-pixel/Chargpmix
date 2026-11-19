import React from 'react';
import {clamp01, lerp, mix, rnd} from './lib';

export type Expr = 'smile' | 'sly' | 'laugh' | 'bored' | 'sus' | 'worry' | 'shock' | 'angry';

export type Palette = {
  kind: 'taraf' | 'sahab';
  skin: string;
  skinShade: string;
  blush: string;
  hair: string;
  hairHi: string;
  top: string;
  topShade: string;
  bottom: string;
  bottomShade: string;
  shoe: string;
  shoeShade: string;
  accent: string;
  iris: string;
};

export const TARAF: Palette = {
  kind: 'taraf',
  skin: '#f6d3b6',
  skinShade: '#e7b493',
  blush: '#ff8f9a',
  hair: '#2e1e21',
  hairHi: '#6b4740',
  top: '#f6be26',
  topShade: '#d7960c',
  bottom: '#92b6e2',
  bottomShade: '#6e93c4',
  shoe: '#ffffff',
  shoeShade: '#cfd6e2',
  accent: '#ff5f9e',
  iris: '#4a2a1a',
};

export const SAHAB: Palette = {
  kind: 'sahab',
  // same skin tone as Taraf
  skin: TARAF.skin,
  skinShade: TARAF.skinShade,
  blush: TARAF.blush,
  hair: '#141018',
  hairHi: '#4a4258',
  top: '#7cc4f2',
  topShade: '#4e9bd6',
  bottom: '#7cc4f2',
  bottomShade: '#4e9bd6',
  shoe: '#ff8fc0',
  shoeShade: '#e0679f',
  accent: '#ffffff',
  iris: '#2a1a12',
};

const OUT = '#3a2230';
const SW = 5;

export type CharProps = {
  id: string;
  pal: Palette;
  x: number;
  y: number;
  s?: number;
  t: number;
  expr?: Expr;
  mouth?: number | null;
  run?: boolean;
  runSpeed?: number;
  jump?: number;
  armL?: number;
  armR?: number;
  bendL?: number;
  bendR?: number;
  lean?: number;
  wet?: number;
  look?: number;
  shiver?: number;
  blinkSeed?: number;
  squash?: number;
  sweat?: number;
  flipRun?: boolean;
};

// shoulder offset and arm geometry (body units)
const SH_X = 104;
const SH_Y = -592;
const UPPER = 108;
const FORE = 98;

export const handPos = (p: {x: number; y: number; s?: number; side: -1 | 1; raise: number}) => {
  const s = p.s ?? 1;
  const a = (p.raise * Math.PI) / 180;
  const L = (UPPER + FORE) * s;
  return {x: p.x + p.side * SH_X * s + p.side * Math.sin(a) * L, y: p.y + SH_Y * s + Math.cos(a) * L};
};

const BROWS: Record<Expr, [number, number, number, number]> = {
  // left inner, left outer, right inner, right outer (dy)
  smile: [0, 4, 0, 4],
  sly: [10, 4, -8, -18],
  laugh: [-8, -2, -8, -2],
  bored: [10, 12, 10, 12],
  sus: [12, 2, -10, -20],
  worry: [-22, 12, -22, 12],
  shock: [-30, -26, -30, -26],
  angry: [22, -16, 22, -16],
};

const LIDS: Record<Expr, number> = {
  smile: 0.08,
  sly: 0.32,
  laugh: 0,
  bored: 0.46,
  sus: 0.4,
  worry: 0.06,
  shock: 0,
  angry: 0.26,
};

const Eye: React.FC<{
  id: string;
  side: -1 | 1;
  pal: Palette;
  expr: Expr;
  lid: number;
  look: number;
  skin: string;
}> = ({id, side, pal, expr, lid, look, skin}) => {
  const cx = side * 72;
  const cy = -800;
  if (expr === 'laugh') {
    return (
      <g transform={`translate(${cx},${cy})`}>
        <path d="M -40 14 Q 0 -44 40 14" fill="none" stroke={OUT} strokeWidth={11} strokeLinecap="round" />
        <path d={`M ${side * 38} 6 l ${side * 16} -10`} stroke={OUT} strokeWidth={6} strokeLinecap="round" />
      </g>
    );
  }
  const shock = expr === 'shock';
  const rx = shock ? 46 : 42;
  const ry = shock ? 56 : 50;
  const l = clamp01(lid);
  // eyelid curve
  let ey: number;
  let cyQ: number;
  if (l < 0.5) {
    ey = 0;
    cyQ = lerp(-ry * 2, -6, l * 2);
  } else {
    ey = lerp(0, ry, (l - 0.5) * 2);
    cyQ = ey - 6;
  }
  const tilt = expr === 'angry' ? side * -14 : expr === 'worry' ? side * 10 : 0;
  const lidPath = `M ${-rx - 14} ${-ry - 30} L ${rx + 14} ${-ry - 30} L ${rx + 14} ${ey} L ${rx + 2} ${ey} Q 0 ${cyQ} ${-rx - 2} ${ey} L ${-rx - 14} ${ey} Z`;
  const lash = `M ${-rx - 2} ${ey} Q 0 ${cyQ} ${rx + 2} ${ey}`;
  const ir = shock ? 24 : 33;
  const lx = look * 11;
  const outerX = side * (rx + 2);
  return (
    <g transform={`translate(${cx},${cy})`}>
      <clipPath id={`${id}-ec${side}`}>
        <ellipse rx={rx} ry={ry} />
      </clipPath>
      <ellipse rx={rx} ry={ry} fill="#fff" />
      <g clipPath={`url(#${id}-ec${side})`}>
        <circle cx={lx} cy={8} r={ir} fill={`url(#${id}-iris)`} />
        <circle cx={lx} cy={8} r={ir * 0.48} fill="#0b0406" />
        <circle cx={lx - ir * 0.32} cy={8 - ir * 0.4} r={ir * 0.32} fill="#fff" />
        <circle cx={lx + ir * 0.35} cy={8 + ir * 0.35} r={ir * 0.14} fill="#fff" opacity={0.9} />
        <ellipse cx={0} cy={-ry * 0.55} rx={rx} ry={ry * 0.35} fill="#7a5a70" opacity={0.12} />
        <g transform={`rotate(${tilt})`}>
          <path d={lidPath} fill={skin} />
        </g>
      </g>
      <g transform={`rotate(${tilt})`}>
        <path d={lash} fill="none" stroke={OUT} strokeWidth={8} strokeLinecap="round" />
        <path
          d={`M ${outerX} ${ey} q ${side * 14} -4 ${side * 22} -16 M ${outerX - side * 8} ${ey - 6} q ${side * 10} -8 ${side * 14} -22`}
          fill="none"
          stroke={OUT}
          strokeWidth={5}
          strokeLinecap="round"
        />
      </g>
      <path d={`M ${-rx * 0.6} ${ry + 2} Q 0 ${ry + 10} ${rx * 0.6} ${ry + 2}`} fill="none" stroke={OUT} strokeWidth={3} opacity={0.25} />
    </g>
  );
};

const Mouth: React.FC<{id: string; expr: Expr; m: number | null}> = ({id, expr, m}) => {
  const y = -700;
  const talking = m !== null && m > 0.04;
  if (!talking) {
    const d: Record<Expr, string> = {
      smile: 'M -34 -6 Q 0 20 34 -6',
      sly: 'M -30 4 Q 6 18 38 -12',
      laugh: '',
      bored: 'M -24 6 Q 0 0 24 6',
      sus: 'M -22 4 Q -6 -2 6 4 Q 16 8 24 0',
      worry: 'M -28 8 Q -14 -4 0 4 Q 14 12 28 2',
      shock: '',
      angry: 'M -30 12 Q 0 -10 30 12',
    };
    if (expr === 'shock')
      return (
        <g transform={`translate(0,${y})`}>
          <ellipse rx={18} ry={24} fill="#6b1a26" stroke={OUT} strokeWidth={5} />
          <ellipse cy={12} rx={10} ry={7} fill="#e0607a" />
        </g>
      );
    if (expr === 'laugh') m = 0.75;
    else
      return (
        <g transform={`translate(0,${y})`}>
          <path d={d[expr]} fill="none" stroke={OUT} strokeWidth={7} strokeLinecap="round" />
          {expr === 'smile' || expr === 'sly' ? (
            <path d="M -38 -8 q -6 -2 -8 4 M 38 -8 q 6 -2 8 4" stroke={OUT} strokeWidth={3} opacity={0.4} fill="none" />
          ) : null}
        </g>
      );
  }
  const a = m ?? 0;
  const wide = expr === 'laugh' ? 1.5 : expr === 'shock' ? 0.8 : 1;
  const w = (42 + a * 22) * wide;
  const h = 8 + a * 50;
  const corner = expr === 'angry' || expr === 'worry' ? 8 : expr === 'smile' || expr === 'laugh' || expr === 'sly' ? -6 : 0;
  const topBow = expr === 'laugh' || expr === 'smile' ? 2 : -h * 0.3;
  const d = `M ${-w / 2} ${corner} C ${-w / 4} ${topBow} ${w / 4} ${topBow} ${w / 2} ${corner} C ${w / 3} ${h * 1.15} ${-w / 3} ${h * 1.15} ${-w / 2} ${corner} Z`;
  return (
    <g transform={`translate(0,${y - 6})`}>
      <clipPath id={`${id}-mc`}>
        <path d={d} />
      </clipPath>
      <path d={d} fill="#6b1a26" />
      <g clipPath={`url(#${id}-mc)`}>
        <ellipse cx={0} cy={h * 0.85} rx={w * 0.32} ry={h * 0.35} fill="#e86a82" />
        <rect x={-w / 2} y={Math.min(corner, topBow) - 4} width={w} height={11} fill="#fff" />
      </g>
      <path d={d} fill="none" stroke={OUT} strokeWidth={5} strokeLinejoin="round" />
    </g>
  );
};

const Limb: React.FC<{
  d: string;
  w: number;
  color: string;
}> = ({d, w, color}) => (
  <>
    <path d={d} fill="none" stroke={OUT} strokeWidth={w + SW * 2} strokeLinecap="round" strokeLinejoin="round" />
    <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
  </>
);

const Arm: React.FC<{
  side: -1 | 1;
  raise: number;
  bend: number;
  skin: string;
  sleeve: string;
  sleeveShade: string;
}> = ({side, raise, bend, skin, sleeve, sleeveShade}) => {
  const ex = 0;
  const ey = UPPER;
  const b = (bend * Math.PI) / 180;
  const hx = ex + side * Math.sin(b) * FORE;
  const hy = ey + Math.cos(b) * FORE;
  return (
    <g transform={`translate(${side * SH_X},${SH_Y}) rotate(${side * -raise})`}>
      <Limb d={`M 0 0 L ${ex} ${ey} L ${hx} ${hy}`} w={40} color={skin} />
      <circle cx={hx} cy={hy} r={25} fill={skin} stroke={OUT} strokeWidth={SW} />
      <path d={`M ${hx - side * 8} ${hy + 10} q ${side * 8} 8 ${side * 16} 0`} stroke={OUT} strokeWidth={3} fill="none" opacity={0.5} />
      <path
        d={`M -32 -14 Q 0 -30 32 -14 L 34 52 Q 0 62 -34 52 Z`}
        fill={sleeve}
        stroke={OUT}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <path d={`M ${side * 10} -14 L ${side * 22} 50`} stroke={sleeveShade} strokeWidth={12} opacity={0.6} strokeLinecap="round" />
    </g>
  );
};

export const Character: React.FC<CharProps> = (p) => {
  const {pal, t, id} = p;
  const s = p.s ?? 1;
  const expr = p.expr ?? 'smile';
  const wet = clamp01(p.wet ?? 0);
  const run = !!p.run;
  const rs = p.runSpeed ?? 12;
  const ph = t * rs;
  const bob = run ? Math.abs(Math.sin(ph)) * 34 : 0;
  const jump = (p.jump ?? 0) + bob;
  const shiver = (p.shiver ?? 0) * Math.sin(t * 75) * 5;

  // colours (wet = darker/saturated)
  const hair = mix(pal.hair, '#05040a', wet * 0.5);
  const hairHi = mix(pal.hairHi, '#3a4a70', wet * 0.6);
  const top = mix(pal.top, pal.topShade, wet * 0.55);
  const topShade = mix(pal.topShade, '#1d4f8a', wet * 0.4);
  const bottom = mix(pal.bottom, pal.bottomShade, wet * 0.55);
  const bottomShade = mix(pal.bottomShade, '#2c4f86', wet * 0.4);
  const skin = pal.skin;

  // idle motion
  const breathe = 1 + Math.sin(t * 2.3 + (p.blinkSeed ?? 0)) * 0.012;
  const sway = Math.sin(t * 1.6 + (p.blinkSeed ?? 0)) * (run ? 18 : 10) * (1 - wet * 0.7) + (run ? -22 : 0);
  const headTiltBase: Record<Expr, number> = {smile: 3, sly: 6, laugh: -4, bored: -6, sus: -7, worry: 4, shock: 0, angry: -3};
  const headTilt = headTiltBase[expr] + Math.sin(t * 1.3 + (p.blinkSeed ?? 0)) * 2 + (run ? Math.sin(ph * 2) * 2 : 0);
  const laughBounce = expr === 'laugh' ? Math.abs(Math.sin(t * 16)) * 8 : 0;

  // blink
  const period = 3.3 + rnd(p.blinkSeed ?? 1) * 1.4;
  const bp = (t + (p.blinkSeed ?? 0) * 1.7) % period;
  const blink = bp < 0.16 ? Math.sin((bp / 0.16) * Math.PI) : 0;
  const lid = Math.min(1, LIDS[expr] + blink * (1 - LIDS[expr]));

  // squash on landing
  const sq = p.squash ?? (run ? Math.max(0, 1 - Math.abs(Math.sin(ph)) * 4) * 0.06 : 0);
  const sx = 1 + sq;
  const sy = 1 - sq;

  const legA = run ? Math.sin(ph) * 30 : 0;
  const armSwing = run ? Math.sin(ph) * 40 : 0;
  const armL = (p.armL ?? 10) + (run ? 30 + armSwing : 0);
  const armR = (p.armR ?? 10) + (run ? 30 - armSwing : 0);

  const brow = BROWS[expr];
  const flat = 1 - wet * 0.18; // wet hair hugs the head

  const isT = pal.kind === 'taraf';
  const hairLen = isT ? -420 : -470;

  // back hair with sway
  const bx = sway;
  const backHair = isT
    ? `M -150 -1040 Q -232 -1000 -238 -880 Q ${-250 * flat + bx * 0.3} -720 ${-246 * flat + bx * 0.6} -580
       Q ${-240 * flat + bx} -470 ${-215 * flat + bx} ${hairLen}
       Q ${-180 + bx} ${hairLen + 22} ${-150 + bx} ${hairLen - 6} Q ${-110 + bx} ${hairLen + 26} ${-70 + bx} ${hairLen}
       L ${70 + bx} ${hairLen} Q ${110 + bx} ${hairLen + 26} ${150 + bx} ${hairLen - 6} Q ${180 + bx} ${hairLen + 22} ${215 * flat + bx} ${hairLen}
       Q ${240 * flat + bx} -470 ${246 * flat + bx * 0.6} -580 Q ${250 * flat + bx * 0.3} -720 238 -880 Q 232 -1000 150 -1040
       Q 0 -1110 -150 -1040 Z`
    : `M -150 -1040 Q -226 -1000 -228 -880 L ${-226 * flat + bx * 0.5} -640 L ${-214 * flat + bx} ${hairLen}
       L ${214 * flat + bx} ${hairLen} L ${226 * flat + bx * 0.5} -640 L 228 -880 Q 226 -1000 150 -1040 Q 0 -1110 -150 -1040 Z`;

  const frontHair = (side: -1 | 1) => {
    const k = side;
    if (isT) {
      return `M 0 -990 Q ${k * -110} -986 ${k * -170} -905 Q ${k * -200} -820 ${k * -188} -700 Q ${k * -184} -655 ${k * -170 + sway * 0.3} -600
        L ${k * -236 + sway * 0.4} -610 Q ${k * -252} -760 ${k * -240} -900 Q ${k * -222} -1032 ${k * -120} -1072 Q ${k * -50} -1092 0 -1084 Z`;
    }
    return `M 0 -1084 Q ${k * -150} -1080 ${k * -214} -960 Q ${k * -236} -840 ${k * -232 + sway * 0.3} -640
      L ${k * -186 + sway * 0.3} -640 Q ${k * -196} -800 ${k * -182} -900 Q ${k * -170} -950 ${k * -150} -960 Z`;
  };

  const bangs =
    'M -186 -930 Q -170 -1050 0 -1060 Q 170 -1050 186 -930 Q 160 -950 140 -918 Q 118 -950 92 -912 Q 66 -948 40 -910 Q 14 -946 -12 -910 Q -38 -948 -64 -912 Q -90 -950 -116 -916 Q -140 -952 -160 -918 Q -172 -940 -186 -930 Z';

  const skirt = isT
    ? `M -104 -430 L 104 -430 Q 136 -340 ${158 + (run ? Math.sin(ph) * 8 : 0)} -248 Q 0 -230 ${-158 + (run ? Math.sin(ph) * 8 : 0)} -248 Q -136 -340 -104 -430 Z`
    : `M -100 -440 L 100 -440 Q 150 -340 ${178 + (run ? Math.sin(ph) * 10 : 0)} -262 Q 90 -244 0 -250 Q -90 -244 ${-178 + (run ? Math.sin(ph) * 10 : 0)} -262 Q -150 -340 -100 -440 Z`;

  const drips: React.ReactNode[] = [];
  if (wet > 0.05) {
    for (let i = 0; i < 14; i++) {
      const sp = (t * (1.1 + rnd(i + 3) * 0.6) + rnd(i)) % 1;
      const src = i % 3 === 0 ? {x: (rnd(i + 9) - 0.5) * 300, y: -250} : {x: (rnd(i + 5) > 0.5 ? 1 : -1) * (150 + rnd(i + 2) * 70), y: hairLen + 10};
      const yy = src.y + sp * sp * 320;
      if (yy > -10) continue;
      drips.push(
        <path
          key={i}
          d={`M ${src.x} ${yy - 22} Q ${src.x + 9} ${yy - 2} ${src.x} ${yy + 4} Q ${src.x - 9} ${yy - 2} ${src.x} ${yy - 22} Z`}
          fill="#8fd3ff"
          stroke="#3c8fd0"
          strokeWidth={2}
          opacity={wet * (1 - sp * 0.6)}
        />,
      );
    }
  }

  return (
    <g transform={`translate(${p.x + shiver},${p.y})`}>
      <defs>
        <radialGradient id={`${id}-iris`} cx="0.45" cy="0.35" r="0.7">
          <stop offset="0" stopColor={mix(pal.iris, '#b07a50', 0.5)} />
          <stop offset="0.6" stopColor={pal.iris} />
          <stop offset="1" stopColor="#120806" />
        </radialGradient>
        <radialGradient id={`${id}-face`} cx="0.4" cy="0.35" r="0.75">
          <stop offset="0" stopColor={mix(skin, '#ffffff', 0.25)} />
          <stop offset="0.7" stopColor={skin} />
          <stop offset="1" stopColor={pal.skinShade} />
        </radialGradient>
        <linearGradient id={`${id}-top`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={mix(top, '#ffffff', 0.18)} />
          <stop offset="0.6" stopColor={top} />
          <stop offset="1" stopColor={topShade} />
        </linearGradient>
        <linearGradient id={`${id}-bot`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={mix(bottom, '#ffffff', 0.2)} />
          <stop offset="0.65" stopColor={bottom} />
          <stop offset="1" stopColor={bottomShade} />
        </linearGradient>
        <linearGradient id={`${id}-hair`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor={mix(hair, hairHi, 0.35)} />
          <stop offset="0.5" stopColor={hair} />
          <stop offset="1" stopColor={mix(hair, '#000000', 0.3)} />
        </linearGradient>
        <radialGradient id={`${id}-blush`}>
          <stop offset="0" stopColor={pal.blush} stopOpacity={0.75} />
          <stop offset="1" stopColor={pal.blush} stopOpacity={0} />
        </radialGradient>
      </defs>

      {/* ground shadow */}
      <ellipse cx={0} cy={4} rx={190 * s * (1 - Math.min(jump, 120) / 300)} ry={28 * s} fill="#2a1630" opacity={0.2 * (1 - Math.min(jump, 120) / 200)} />

      <g transform={`translate(0,${-jump}) rotate(${p.lean ?? 0}) scale(${s * sx},${s * sy})`}>
        {/* back hair */}
        <g transform={`translate(0,${-laughBounce}) rotate(${headTilt * 0.4},0,-830)`}>
          <path d={backHair} fill={`url(#${id}-hair)`} stroke={OUT} strokeWidth={SW} strokeLinejoin="round" />
          {isT ? (
            <path
              d={`M -200 -700 Q ${-215 + sway * 0.5} -560 ${-190 + sway} -470 M 200 -700 Q ${215 + sway * 0.5} -560 ${190 + sway} -470`}
              stroke={hairHi}
              strokeWidth={8}
              fill="none"
              opacity={0.45}
              strokeLinecap="round"
            />
          ) : null}
        </g>

        {/* legs */}
        {[-1, 1].map((side) => {
          const a = side * legA;
          return (
            <g key={side} transform={`rotate(${a},${side * 46},-270)`}>
              <Limb d={`M ${side * 46} -270 L ${side * 46} -46`} w={44} color={skin} />
              {isT ? null : <path d={`M ${side * 46 - 22} -80 L ${side * 46 + 22} -80`} stroke="#fff" strokeWidth={14} opacity={0.0} />}
              <g transform={`translate(${side * 50},-22)`}>
                <path
                  d={`M -42 10 Q -46 -30 -14 -34 L 18 -34 Q 50 -30 52 6 Q 52 22 30 22 L -30 22 Q -46 22 -42 10 Z`}
                  fill={pal.shoe}
                  stroke={OUT}
                  strokeWidth={SW}
                  strokeLinejoin="round"
                />
                <path d="M -42 12 L 52 12" stroke={pal.shoeShade} strokeWidth={10} />
                {isT ? (
                  <path d="M -8 -26 l 16 10 M 6 -30 l 16 10" stroke={pal.accent} strokeWidth={5} strokeLinecap="round" />
                ) : (
                  <circle cx={6} cy={-18} r={7} fill="#fff" opacity={0.8} />
                )}
              </g>
            </g>
          );
        })}

        {/* skirt / dress bottom */}
        <path d={skirt} fill={`url(#${id}-bot)`} stroke={OUT} strokeWidth={SW} strokeLinejoin="round" />
        {isT ? (
          <>
            <path d="M -2 -430 L -4 -246" stroke={pal.bottomShade} strokeWidth={4} />
            <path d="M -96 -402 L 96 -402" stroke={pal.bottomShade} strokeWidth={3} strokeDasharray="10 8" />
            <path d="M 40 -380 q 20 30 50 22" stroke="#e8f0ff" strokeWidth={3} strokeDasharray="8 6" fill="none" />
            <path d="M -40 -380 q -20 30 -50 22" stroke="#e8f0ff" strokeWidth={3} strokeDasharray="8 6" fill="none" />
            <circle cx={0} cy={-418} r={6} fill="#d8c27a" stroke={OUT} strokeWidth={2} />
          </>
        ) : (
          <>
            <path d="M -60 -420 Q -80 -330 -110 -258 M 60 -420 Q 80 -330 110 -258 M 0 -430 L 0 -252" stroke={bottomShade} strokeWidth={5} fill="none" opacity={0.6} />
            <path d="M -150 -276 Q 0 -256 150 -276" stroke="#ffffff" strokeWidth={6} fill="none" opacity={0.7} />
          </>
        )}

        {/* arms behind torso edges are drawn after torso for readability */}
        <g transform={`scale(1,${breathe})`} style={{transformOrigin: '0px -430px'}}>
          {/* torso */}
          <path
            d={isT
              ? 'M -98 -628 Q -118 -620 -112 -560 L -112 -414 Q 0 -400 112 -414 L 112 -560 Q 118 -620 98 -628 Q 0 -600 -98 -628 Z'
              : 'M -96 -628 Q -114 -620 -108 -560 L -106 -436 Q 0 -424 106 -436 L 108 -560 Q 114 -620 96 -628 Q 0 -600 -96 -628 Z'}
            fill={`url(#${id}-top)`}
            stroke={OUT}
            strokeWidth={SW}
            strokeLinejoin="round"
          />
          {isT ? (
            <>
              <path d="M -50 -624 Q 0 -588 50 -624" fill="none" stroke={pal.topShade} strokeWidth={9} />
              <path d="M -60 -520 Q -30 -500 -10 -530 M 30 -470 Q 60 -460 80 -490" stroke={pal.topShade} strokeWidth={4} fill="none" opacity={0.5} />
            </>
          ) : (
            <>
              <path d="M -66 -628 Q -60 -580 -8 -600 L 0 -612 L 8 -600 Q 60 -580 66 -628 Q 0 -606 -66 -628 Z" fill="#fff" stroke={OUT} strokeWidth={4} />
              <path d="M -106 -444 Q 0 -430 106 -444" stroke={pal.topShade} strokeWidth={14} fill="none" />
              <path d="M -16 -444 l -18 -14 l 0 28 z M 16 -444 l 18 -14 l 0 28 z" fill="#ff8fc0" stroke={OUT} strokeWidth={3} />
            </>
          )}
          {/* neck */}
          <path d="M -34 -690 L -34 -620 Q 0 -600 34 -620 L 34 -690 Z" fill={pal.skinShade} stroke={OUT} strokeWidth={SW} />
        </g>

        <Arm side={-1} raise={armL} bend={p.bendL ?? (armL > 60 ? 20 : 8)} skin={skin} sleeve={top} sleeveShade={topShade} />
        <Arm side={1} raise={armR} bend={p.bendR ?? (armR > 60 ? 20 : 8)} skin={skin} sleeve={top} sleeveShade={topShade} />

        {/* head */}
        <g transform={`translate(0,${-laughBounce}) rotate(${headTilt},0,-680)`}>
          {!isT ? (
            <>
              <ellipse cx={-176} cy={-790} rx={24} ry={34} fill={skin} stroke={OUT} strokeWidth={SW} />
              <ellipse cx={176} cy={-790} rx={24} ry={34} fill={skin} stroke={OUT} strokeWidth={SW} />
            </>
          ) : null}
          <path
            d="M -178 -840 Q -180 -1010 0 -1022 Q 180 -1010 178 -840 Q 176 -700 96 -660 Q 40 -632 0 -632 Q -40 -632 -96 -660 Q -176 -700 -178 -840 Z"
            fill={`url(#${id}-face)`}
            stroke={OUT}
            strokeWidth={SW}
          />
          {/* cheeks */}
          <ellipse cx={-110} cy={-728} rx={46} ry={30} fill={`url(#${id}-blush)`} opacity={expr === 'angry' ? 1 : 0.9} />
          <ellipse cx={110} cy={-728} rx={46} ry={30} fill={`url(#${id}-blush)`} opacity={expr === 'angry' ? 1 : 0.9} />
          {expr === 'angry' ? (
            <ellipse cx={0} cy={-760} rx={170} ry={90} fill="#ff3b3b" opacity={0.12} />
          ) : null}
          {/* cold tint */}
          {(p.shiver ?? 0) > 0 ? <ellipse cx={0} cy={-820} rx={176} ry={190} fill="#7fc8ff" opacity={0.22 * (p.shiver ?? 0)} /> : null}

          <Eye id={id} side={-1} pal={pal} expr={expr} lid={lid} look={p.look ?? 0} skin={skin} />
          <Eye id={id} side={1} pal={pal} expr={expr} lid={lid} look={p.look ?? 0} skin={skin} />

          {/* brows */}
          {[-1, 1].map((side) => {
            const inner = side < 0 ? brow[0] : brow[2];
            const outer = side < 0 ? brow[1] : brow[3];
            return (
              <path
                key={side}
                d={`M ${side * 34} ${-884 + inner} Q ${side * 70} ${-906 + (inner + outer) / 2} ${side * 112} ${-880 + outer}`}
                stroke={hair}
                strokeWidth={15}
                strokeLinecap="round"
                fill="none"
              />
            );
          })}
          {/* nose */}
          <path d="M -6 -748 Q 0 -738 8 -746" stroke={pal.skinShade} strokeWidth={6} fill="none" strokeLinecap="round" />
          <Mouth id={id} expr={expr} m={p.mouth ?? null} />

          {/* sweat */}
          {(p.sweat ?? 0) > 0 ? (
            <g opacity={p.sweat}>
              {[0, 1].map((i) => {
                const k = ((t * 0.6 + i * 0.5) % 1);
                return (
                  <path
                    key={i}
                    d={`M ${150 - i * 300 + 10} ${-930 + k * 120} q 12 22 0 30 q -12 -8 0 -30 z`}
                    fill="#bfe6ff"
                    stroke="#4a9be0"
                    strokeWidth={3}
                    opacity={1 - k}
                  />
                );
              })}
            </g>
          ) : null}

          {/* front hair */}
          {isT ? (
            <>
              <path d={frontHair(1)} fill={`url(#${id}-hair)`} stroke={OUT} strokeWidth={SW} strokeLinejoin="round" />
              <path d={frontHair(-1)} fill={`url(#${id}-hair)`} stroke={OUT} strokeWidth={SW} strokeLinejoin="round" />
              <path d="M -30 -1070 Q -150 -1050 -206 -940" stroke={hairHi} strokeWidth={14} fill="none" strokeLinecap="round" opacity={0.7} />
              <path d="M 30 -1070 Q 150 -1050 206 -940" stroke={hairHi} strokeWidth={10} fill="none" strokeLinecap="round" opacity={0.5} />
              <path d="M 0 -1084 L 0 -992" stroke={mix(hair, '#000000', 0.4)} strokeWidth={4} />
            </>
          ) : (
            <>
              <path d={frontHair(1)} fill={`url(#${id}-hair)`} stroke={OUT} strokeWidth={SW} strokeLinejoin="round" />
              <path d={frontHair(-1)} fill={`url(#${id}-hair)`} stroke={OUT} strokeWidth={SW} strokeLinejoin="round" />
              <path d={bangs} fill={`url(#${id}-hair)`} stroke={OUT} strokeWidth={SW} strokeLinejoin="round" />
              <path d="M -120 -1040 Q 0 -1066 120 -1040" stroke={hairHi} strokeWidth={12} fill="none" strokeLinecap="round" opacity={0.65} />
              {/* cloud clip */}
              <g transform="translate(130,-1010) rotate(-12)">
                <path
                  d="M -46 14 Q -60 -10 -34 -18 Q -30 -44 -2 -38 Q 14 -58 34 -36 Q 60 -34 52 -6 Q 64 16 40 20 L -36 22 Q -52 22 -46 14 Z"
                  fill="#ffffff"
                  stroke={OUT}
                  strokeWidth={4}
                />
                <circle cx={-12} cy={-6} r={4} fill="#9ad4ff" />
              </g>
            </>
          )}
          {wet > 0.3 ? (
            <path d="M -170 -900 Q -200 -800 -190 -700 M 170 -900 Q 200 -800 190 -700" stroke="#a8dcff" strokeWidth={6} fill="none" opacity={wet * 0.5} />
          ) : null}
        </g>
        {drips}
      </g>
    </g>
  );
};
