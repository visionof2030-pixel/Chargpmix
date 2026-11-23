import React from 'react';

/* ------------------------------------------------------------------ helpers */
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
export const mix = (a: string, b: string, t: number) => {
  const p = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const A = p(a);
  const B = p(b);
  const k = clamp01(t);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join('');
};

const OUT = '#2b1b26';
const SW = 5;

/* ------------------------------------------------------------------ looks */
export type Hair = 'longCurly' | 'messyBun' | 'pulledBack' | 'wavyShort' | 'boyQuiff' | 'boyCurly';
export type Top = 'fluffyJacket' | 'fluffyHoodie' | 'hoodie' | 'pajama' | 'sweatshirt' | 'thobe' | 'tee';
export type Pattern = 'none' | 'hearts' | 'teddy' | 'cat' | 'dino' | 'deer';
export type Bottom = 'jeans' | 'wideJeans' | 'pajama' | 'cargo' | 'none';
export type Feet = 'whiteSocks' | 'pinkSocks' | 'stripeSocks' | 'bare' | 'sandals' | 'sneakers';

export type Look = {
  key: string;
  name: string;
  boy?: boolean;
  height: number; // overall scale (Jassar is older and taller)
  skin: string;
  skinShade: string;
  blush: string;
  hair: Hair;
  hairColor: string;
  hairHi: string;
  top: Top;
  topColor: string;
  topShade: string;
  pattern: Pattern;
  bottom: Bottom;
  bottomColor: string;
  bottomShade: string;
  bows?: boolean;
  feet: Feet;
  iris: string;
  color: string; // name chip colour
};

export const LOOKS: Record<string, Look> = {
  taraf: {
    key: 'taraf', name: 'ترف', height: 1.0,
    skin: '#e2b48e', skinShade: '#c58f68', blush: '#f08a8a',
    hair: 'messyBun', hairColor: '#2a1a17', hairHi: '#5b3c33',
    top: 'pajama', topColor: '#1f2940', topShade: '#141b2c', pattern: 'teddy',
    bottom: 'pajama', bottomColor: '#1f2940', bottomShade: '#141b2c',
    feet: 'stripeSocks', iris: '#3a2416', color: '#E24682',
  },
  sahab: {
    key: 'sahab', name: 'سحاب', height: 0.97,
    skin: '#d9a47c', skinShade: '#bb8459', blush: '#f08a8a',
    hair: 'longCurly', hairColor: '#21140f', hairHi: '#5a3a2c',
    top: 'fluffyJacket', topColor: '#f3efd9', topShade: '#d8d2b3', pattern: 'none',
    bottom: 'wideJeans', bottomColor: '#9fb3cf', bottomShade: '#7d93b3', bows: true,
    feet: 'whiteSocks', iris: '#2e1a10', color: '#3C82D7',
  },
  malath: {
    key: 'malath', name: 'ملاذ', height: 1.0,
    skin: '#d7a17a', skinShade: '#b9845c', blush: '#f08a8a',
    hair: 'pulledBack', hairColor: '#24160f', hairHi: '#4f3528',
    top: 'fluffyHoodie', topColor: '#d3262f', topShade: '#a8161f', pattern: 'hearts',
    bottom: 'wideJeans', bottomColor: '#bccfe2', bottomShade: '#97adc7',
    feet: 'bare', iris: '#2e1a10', color: '#d3262f',
  },
  leen: {
    key: 'leen', name: 'لين', height: 0.86,
    skin: '#ddab83', skinShade: '#bf8c62', blush: '#ff8f9a',
    hair: 'wavyShort', hairColor: '#2a1a12', hairHi: '#5e4030',
    top: 'hoodie', topColor: '#fbf8f4', topShade: '#e3ddd5', pattern: 'cat',
    bottom: 'jeans', bottomColor: '#8ea6c8', bottomShade: '#6f88ad',
    feet: 'pinkSocks', iris: '#2e1a10', color: '#f472b6',
  },
  fares: {
    key: 'fares', name: 'فارس', boy: true, height: 0.98,
    skin: '#d2996f', skinShade: '#b27c52', blush: '#ec8a7e',
    hair: 'boyQuiff', hairColor: '#1b120f', hairHi: '#4a352c',
    top: 'sweatshirt', topColor: '#1d2026', topShade: '#121419', pattern: 'dino',
    bottom: 'cargo', bottomColor: '#d8cfb4', bottomShade: '#b8ad8e',
    feet: 'bare', iris: '#2a170d', color: '#22a06b',
  },
  jassar: {
    key: 'jassar', name: 'جسار', boy: true, height: 1.12,
    skin: '#e0b08a', skinShade: '#c38f66', blush: '#ee8c80',
    hair: 'boyCurly', hairColor: '#1e1410', hairHi: '#4e382c',
    top: 'tee', topColor: '#1b1c20', topShade: '#0f1013', pattern: 'deer',
    bottom: 'wideJeans', bottomColor: '#8db4de', bottomShade: '#6d93c0',
    feet: 'sneakers', iris: '#2a170d', color: '#c2410c',
  },
};

/* ------------------------------------------------------------------ expressions */
export type Expr = 'smile' | 'happy' | 'laugh' | 'curious' | 'worried' | 'scared' | 'terrified' | 'brave' | 'whisper' | 'pain';
const BROWS: Record<Expr, [number, number]> = {
  smile: [0, 2], happy: [-6, -4], laugh: [-8, -2], curious: [-14, -20], worried: [-22, 12],
  scared: [-28, 6], terrified: [-34, -10], brave: [16, -12], whisper: [-10, 6], pain: [-18, 16],
};
const LIDS: Record<Expr, number> = {
  smile: 0.08, happy: 0.12, laugh: 0, curious: 0.02, worried: 0.06, scared: 0, terrified: 0, brave: 0.3, whisper: 0.2, pain: 0.5,
};

const Limb: React.FC<{d: string; w: number; color: string}> = ({d, w, color}) => (
  <>
    <path d={d} fill="none" stroke={OUT} strokeWidth={w + SW * 2} strokeLinecap="round" strokeLinejoin="round" />
    <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
  </>
);

/* ------------------------------------------------------------------ pattern defs */
export const PatternDefs: React.FC<{id: string; look: Look}> = ({id, look}) => {
  const {pattern, topColor, topShade} = look;
  if (pattern === 'teddy')
    return (
      <pattern id={`${id}-pat`} width="70" height="70" patternUnits="userSpaceOnUse" patternTransform="rotate(-12)">
        {[
          [18, 20],
          [54, 52],
        ].map(([x, y], i) => (
          <g key={i} transform={`translate(${x},${y}) rotate(${i ? 18 : -14})`}>
            <circle cx={-9} cy={-10} r={5} fill="#e9a36a" />
            <circle cx={9} cy={-10} r={5} fill="#e9a36a" />
            <circle cx={0} cy={0} r={11} fill="#efb37c" />
            <ellipse cx={0} cy={15} rx={9} ry={8} fill="#e9a36a" />
            <circle cx={-4} cy={-2} r={1.6} fill="#3a2416" />
            <circle cx={4} cy={-2} r={1.6} fill="#3a2416" />
            <ellipse cx={0} cy={3} rx={3} ry={2} fill="#f6d2ad" />
          </g>
        ))}
      </pattern>
    );
  if (pattern === 'hearts')
    return (
      <pattern id={`${id}-pat`} width="60" height="60" patternUnits="userSpaceOnUse">
        <rect width="60" height="60" fill="none" stroke={topShade} strokeWidth="3" opacity="0.6" />
        <path d="M 30 42 C 10 28 16 14 26 18 Q 30 20 30 24 Q 30 20 34 18 C 44 14 50 28 30 42 Z" fill={topShade} opacity="0.75" />
      </pattern>
    );
  if (pattern === 'dino')
    return (
      <pattern id={`${id}-pat`} width="110" height="100" patternUnits="userSpaceOnUse" patternTransform="rotate(-8)">
        {[
          [30, 34, 1],
          [84, 80, -1],
        ].map(([x, y, f], i) => (
          <g key={i} transform={`translate(${x},${y}) scale(${f},1)`}>
            <path d="M -26 10 Q -30 -6 -14 -10 L 2 -12 Q 10 -26 22 -20 Q 30 -14 22 -6 L 14 -4 Q 18 8 8 12 L 6 22 L -2 22 L -2 14 L -12 14 L -14 22 L -22 22 Z" fill="#8bdc3c" stroke="#3f7a16" strokeWidth="2.5" />
            <circle cx={16} cy={-15} r={2.4} fill="#1d2026" />
            <path d="M -20 -10 l 4 -7 l 4 6 l 4 -7 l 4 6" stroke="#f5c542" strokeWidth="3" fill="none" />
          </g>
        ))}
      </pattern>
    );
  if (pattern === 'cat') return null;
  return <pattern id={`${id}-pat`} width="10" height="10" patternUnits="userSpaceOnUse" />;
  void topColor;
};

/* ------------------------------------------------------------------ the kid */
export type KidProps = {
  id: string;
  look: Look;
  x: number;
  y: number;
  s?: number;
  t: number;
  expr?: Expr;
  mouth?: number | null;
  armL?: number;
  armR?: number;
  bendL?: number;
  bendR?: number;
  run?: boolean;
  runSpeed?: number;
  jump?: number;
  lean?: number;
  look2?: number; // pupil direction -1..1
  lookY?: number;
  blinkSeed?: number;
  shiver?: number;
  face?: 1 | -1; // run direction (for body lean)
  propR?: React.ReactNode;
  propL?: React.ReactNode;
  headlamp?: boolean;
  fallen?: number; // 0..1 sat down on the ground
};

const SH_X = 104;
const SH_Y = -592;
const UPPER = 108;
const FORE = 98;

export const Kid: React.FC<KidProps> = (p) => {
  const L = p.look;
  const {t, id} = p;
  const s = (p.s ?? 1) * L.height;
  const expr = p.expr ?? 'smile';
  const run = !!p.run;
  const ph = t * (p.runSpeed ?? 13);
  const bob = run ? Math.abs(Math.sin(ph)) * 34 : 0;
  const jump = (p.jump ?? 0) + bob;
  const shiver = (p.shiver ?? 0) * Math.sin(t * 70) * 4;
  const seed = p.blinkSeed ?? 1;
  const breathe = 1 + Math.sin(t * 2.4 + seed) * 0.012 * (1 + (expr === 'terrified' || expr === 'scared' ? 2.5 : 0));
  const sway = Math.sin(t * 1.6 + seed) * (run ? 16 : 8) + (run ? -18 * (p.face ?? 1) : 0);
  const tiltBase: Record<Expr, number> = {smile: 3, happy: 4, laugh: -4, curious: 7, worried: 3, scared: -2, terrified: 0, brave: -3, whisper: 6, pain: -6};
  const headTilt = tiltBase[expr] + Math.sin(t * 1.3 + seed) * 2;
  const period = 3.2 + rnd(seed) * 1.4;
  const bp = (t + seed * 1.7) % period;
  const blink = bp < 0.15 ? Math.sin((bp / 0.15) * Math.PI) : 0;
  const lid = Math.min(1, LIDS[expr] + blink * (1 - LIDS[expr]));
  const sq = run ? Math.max(0, 1 - Math.abs(Math.sin(ph)) * 4) * 0.06 : 0;
  const legA = run ? Math.sin(ph) * 32 : 0;
  const armSwing = run ? Math.sin(ph) * 42 : 0;
  const armL = (p.armL ?? 10) + (run ? 34 + armSwing : 0);
  const armR = (p.armR ?? 10) + (run ? 34 - armSwing : 0);
  const look = p.look2 ?? 0;
  const lookY = p.lookY ?? 0;
  const [bi, bo] = BROWS[expr];
  const isThobe = L.top === 'thobe';
  const skin = L.skin;
  const fallen = clamp01(p.fallen ?? 0);

  /* ---------- hair */
  const hc = L.hairColor;
  const hh = L.hairHi;
  const hairFill = `url(#${id}-hair)`;
  const backHair = (() => {
    const bx = sway;
    switch (L.hair) {
      case 'longCurly': {
        // big curly mass down to the waist with a scalloped edge
        let d = 'M -160 -1050 Q -250 -1010 -262 -880';
        const pts: [number, number][] = [];
        for (let i = 0; i <= 9; i++) {
          const k = i / 9;
          pts.push([lerp(-270, -235, k) + bx * k, lerp(-860, -420, k)]);
        }
        pts.forEach(([x, y], i) => {
          d += ` Q ${x - 34} ${y + 22} ${x + (i % 2 ? 6 : -6)} ${y + 46}`;
        });
        d += ` Q ${-150 + bx} -380 ${-60 + bx} -420 Q ${0 + bx} -390 ${60 + bx} -420 Q ${150 + bx} -380 ${235 + bx} -420`;
        for (let i = 9; i >= 0; i--) {
          const k = i / 9;
          const x = lerp(270, 235, k) + bx * k;
          const y = lerp(-860, -420, k);
          d += ` Q ${x + 34} ${y - 22} ${x + (i % 2 ? -6 : 6)} ${y - 46}`;
        }
        d += ' Q 250 -1010 160 -1050 Q 0 -1120 -160 -1050 Z';
        return d;
      }
      case 'messyBun':
        return 'M -150 -1040 Q -232 -1000 -228 -880 Q -224 -790 -196 -740 Q 0 -700 196 -740 Q 224 -790 228 -880 Q 232 -1000 150 -1040 Q 0 -1110 -150 -1040 Z';
      case 'pulledBack':
        return `M -150 -1040 Q -232 -1000 -226 -880 Q -220 -800 -190 -760 Q 0 -720 190 -760 Q 220 -800 226 -880 Q 232 -1000 150 -1040 Q 0 -1110 -150 -1040 Z`;
      case 'wavyShort':
        return `M -160 -1046 Q -250 -1000 -250 -880 Q -262 -760 ${-236 + bx * 0.5} -660 Q ${-226 + bx} -600 ${-180 + bx} -600 L ${180 + bx} -600 Q ${226 + bx} -600 ${236 + bx * 0.5} -660 Q 262 -760 250 -880 Q 250 -1000 160 -1046 Q 0 -1116 -160 -1046 Z`;
      case 'boyQuiff':
      case 'boyCurly':
        return 'M -160 -930 Q -190 -1060 0 -1080 Q 190 -1060 160 -930 Q 0 -960 -160 -930 Z';
    }
  })();

  const frontHair = (() => {
    switch (L.hair) {
      case 'longCurly':
        return (
          <>
            <path d="M 0 -1000 Q -120 -1000 -176 -910 Q -206 -820 -194 -700 Q -186 -640 -206 -560 L -262 -600 Q -262 -760 -248 -890 Q -226 -1036 -110 -1078 Q -50 -1094 0 -1086 Z" fill={hairFill} stroke={OUT} strokeWidth={SW} strokeLinejoin="round" />
            <path d="M 0 -1000 Q 120 -1000 176 -910 Q 206 -820 194 -700 Q 186 -640 206 -560 L 262 -600 Q 262 -760 248 -890 Q 226 -1036 110 -1078 Q 50 -1094 0 -1086 Z" fill={hairFill} stroke={OUT} strokeWidth={SW} strokeLinejoin="round" />
            {[-1, 1].map((k) =>
              [0, 1, 2, 3].map((i) => (
                <path key={`${k}${i}`} d={`M ${k * (200 + (i % 2) * 20)} ${-860 + i * 80} q ${k * 30} 20 0 40 q ${k * -30} 20 0 40`} stroke={hh} strokeWidth={6} fill="none" opacity={0.7} strokeLinecap="round" />
              )),
            )}
          </>
        );
      case 'messyBun':
        return (
          <>
            <path d="M 0 -1060 Q -130 -1050 -180 -960 Q -200 -900 -194 -840 L -160 -890 Q -120 -985 0 -996 Q 120 -985 160 -890 L 194 -840 Q 200 -900 180 -960 Q 130 -1050 0 -1060 Z" fill={hairFill} stroke={OUT} strokeWidth={SW} strokeLinejoin="round" />
            <path d="M -20 -1050 Q -130 -1030 -172 -930" stroke={hh} strokeWidth={10} fill="none" strokeLinecap="round" opacity={0.6} />
            <path d="M 30 -1048 Q 120 -1030 160 -950" stroke={hh} strokeWidth={7} fill="none" strokeLinecap="round" opacity={0.45} />
          </>
        );
      case 'pulledBack':
        return (
          <>
            <path d="M 0 -1076 Q -140 -1066 -186 -960 Q -200 -900 -192 -840 L -162 -900 Q -112 -992 0 -998 Q 112 -992 162 -900 L 192 -840 Q 200 -900 186 -960 Q 140 -1066 0 -1076 Z" fill={hairFill} stroke={OUT} strokeWidth={SW} strokeLinejoin="round" />
            {[-60, -20, 20, 60].map((x, i) => (
              <path key={i} d={`M ${x * 0.5} -1012 Q ${x * 1.1} -1046 ${x * 1.6} -1046`} stroke={hh} strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.5} />
            ))}
          </>
        );
      case 'wavyShort':
        return (
          <>
            <path d="M 0 -996 Q -126 -996 -180 -906 Q -210 -820 -200 -720 L -246 -720 Q -258 -860 -236 -960 Q -200 -1060 -90 -1084 Q -40 -1092 0 -1088 Z" fill={hairFill} stroke={OUT} strokeWidth={SW} strokeLinejoin="round" />
            <path d="M 0 -996 Q 126 -996 180 -906 Q 210 -820 200 -720 L 246 -720 Q 258 -860 236 -960 Q 200 -1060 90 -1084 Q 40 -1092 0 -1088 Z" fill={hairFill} stroke={OUT} strokeWidth={SW} strokeLinejoin="round" />
            <path d={`M 210 -880 q ${30 + sway} 30 ${14 + sway} 80 q -16 40 ${16 + sway} 80`} stroke={hc} strokeWidth={8} fill="none" strokeLinecap="round" />
            <circle cx={150} cy={-1000} r={18} fill="#ffb3cc" stroke={OUT} strokeWidth={4} />
          </>
        );
      case 'boyQuiff':
        return (
          <>
            <path d="M -178 -870 Q -190 -1040 -60 -1092 Q 50 -1124 140 -1070 Q 196 -1030 178 -870 Q 164 -950 124 -978 Q 60 -1004 -20 -998 Q -112 -992 -150 -950 Q -170 -916 -178 -870 Z" fill={hairFill} stroke={OUT} strokeWidth={SW} strokeLinejoin="round" />
            <path d="M -140 -980 Q -40 -1080 140 -1020 Q 40 -1046 -60 -1016 Z" fill={hc} stroke={OUT} strokeWidth={4} strokeLinejoin="round" />
            <path d="M -100 -1050 Q 0 -1100 110 -1060 M -60 -1020 Q 20 -1060 100 -1036" stroke={hh} strokeWidth={6} fill="none" strokeLinecap="round" opacity={0.7} />
            <path d="M -176 -900 L -180 -820 M 176 -900 L 180 -820" stroke={mix(hc, skin, 0.5)} strokeWidth={14} strokeLinecap="round" />
          </>
        );
      case 'boyCurly': {
        let edge = 'M -182 -860 Q -204 -1010 -118 -1086';
        for (let i = 0; i < 8; i++) {
          const a0 = Math.PI * (1.18 + (i / 8) * 0.64);
          const a1 = Math.PI * (1.18 + ((i + 1) / 8) * 0.64);
          const x1 = Math.cos(a1) * 200;
          const y1 = -880 + Math.sin(a1) * 250;
          const xm = Math.cos((a0 + a1) / 2) * 232;
          const ym = -880 + Math.sin((a0 + a1) / 2) * 282;
          edge += ` Q ${xm} ${ym} ${x1} ${y1}`;
        }
        edge += ' Q 200 -1000 182 -860 Q 166 -950 116 -980 Q 0 -1004 -116 -980 Q -166 -950 -182 -860 Z';
        return (
          <>
            <clipPath id={`${id}-curl`}>
              <path d={edge} />
            </clipPath>
            <path d={edge} fill={hairFill} stroke={OUT} strokeWidth={SW} strokeLinejoin="round" />
            <g clipPath={`url(#${id}-curl)`}>
            {Array.from({length: 9}).map((_, i) => {
              const x = -130 + (i % 5) * 64 + (i > 4 ? 32 : 0);
              const y = i > 4 ? -1060 : -1100;
              return <path key={i} d={`M ${x - 14} ${y + 6} q 14 -22 28 0`} stroke={hh} strokeWidth={6} fill="none" strokeLinecap="round" opacity={0.7} />;
            })}
            </g>
            <path d="M -182 -880 L -184 -820 M 182 -880 L 184 -820" stroke={mix(hc, skin, 0.5)} strokeWidth={12} strokeLinecap="round" />
          </>
        );
      }
    }
  })();

  const bun =
    L.hair === 'messyBun' ? (
      <g>
        <circle cx={0} cy={-1112} r={66} fill={hairFill} stroke={OUT} strokeWidth={SW} />
        <path d="M -44 -1132 Q 0 -1170 44 -1132 M -50 -1104 Q 0 -1140 50 -1104" stroke={hh} strokeWidth={6} fill="none" strokeLinecap="round" opacity={0.6} />
        <path d="M -46 -1056 Q 0 -1044 46 -1056" stroke="#f05a8a" strokeWidth={12} fill="none" strokeLinecap="round" />
      </g>
    ) : L.hair === 'pulledBack' ? (
      <g>
        <path d={`M 150 -990 Q ${250 + sway} -930 ${236 + sway * 1.3} -780 Q ${226 + sway * 1.4} -700 ${196 + sway * 1.2} -690 Q ${186 + sway} -760 ${196 + sway * 0.6} -860 Q 200 -930 140 -960 Z`} fill={hairFill} stroke={OUT} strokeWidth={SW} />
        <ellipse cx={168} cy={-972} rx={20} ry={14} fill="#f05a8a" stroke={OUT} strokeWidth={4} transform="rotate(30,168,-972)" />
      </g>
    ) : null;

  /* ---------- eyes */
  const eye = (side: -1 | 1) => {
    const cx = side * 70;
    const cy = -800;
    if (expr === 'laugh')
      return <path key={side} transform={`translate(${cx},${cy})`} d="M -38 12 Q 0 -40 38 12" fill="none" stroke={OUT} strokeWidth={10} strokeLinecap="round" />;
    if (expr === 'pain')
      return <path key={side} transform={`translate(${cx},${cy})`} d={`M ${-30 * side} -20 L ${20 * side} 0 L ${-30 * side} 20`} fill="none" stroke={OUT} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />;
    const big = expr === 'terrified' || expr === 'scared';
    const rx = big ? 46 : 41;
    const ry = big ? 56 : 49;
    const l = clamp01(lid);
    const ey = l < 0.5 ? 0 : lerp(0, ry, (l - 0.5) * 2);
    const cyQ = l < 0.5 ? lerp(-ry * 2, -6, l * 2) : ey - 6;
    const ir = expr === 'terrified' ? 17 : expr === 'scared' ? 24 : 32;
    const lx = look * 11 + (expr === 'terrified' ? Math.sin(t * 40) * 2 : 0);
    const ly = 8 + lookY * 10;
    const tilt = expr === 'brave' ? side * -12 : expr === 'worried' || expr === 'scared' ? side * 10 : 0;
    return (
      <g key={side} transform={`translate(${cx},${cy})`}>
        <clipPath id={`${id}-ec${side}`}>
          <ellipse rx={rx} ry={ry} />
        </clipPath>
        <ellipse rx={rx} ry={ry} fill="#fff" />
        <g clipPath={`url(#${id}-ec${side})`}>
          <circle cx={lx} cy={ly} r={ir} fill={`url(#${id}-iris)`} />
          <circle cx={lx} cy={ly} r={ir * 0.5} fill="#0a0406" />
          <circle cx={lx - ir * 0.35} cy={ly - ir * 0.42} r={Math.max(5, ir * 0.32)} fill="#fff" />
          <circle cx={lx + ir * 0.35} cy={ly + ir * 0.35} r={Math.max(2, ir * 0.13)} fill="#fff" opacity={0.9} />
          <g transform={`rotate(${tilt})`}>
            <path d={`M ${-rx - 14} ${-ry - 30} L ${rx + 14} ${-ry - 30} L ${rx + 14} ${ey} L ${rx + 2} ${ey} Q 0 ${cyQ} ${-rx - 2} ${ey} L ${-rx - 14} ${ey} Z`} fill={skin} />
          </g>
        </g>
        <g transform={`rotate(${tilt})`}>
          <path d={`M ${-rx - 2} ${ey} Q 0 ${cyQ} ${rx + 2} ${ey}`} fill="none" stroke={OUT} strokeWidth={L.boy ? 6 : 8} strokeLinecap="round" />
          {!L.boy ? (
            <path d={`M ${side * (rx + 2)} ${ey} q ${side * 14} -4 ${side * 22} -16 M ${side * (rx - 6)} ${ey - 6} q ${side * 10} -8 ${side * 14} -22`} fill="none" stroke={OUT} strokeWidth={5} strokeLinecap="round" />
          ) : null}
        </g>
        <ellipse rx={rx} ry={ry} fill="none" stroke={OUT} strokeWidth={3} opacity={0.35} />
      </g>
    );
  };

  /* ---------- mouth */
  const mouth = (() => {
    const y = -700;
    const m = p.mouth ?? null;
    const talking = m !== null && m > 0.04;
    if (!talking) {
      const D: Partial<Record<Expr, string>> = {
        smile: 'M -32 -6 Q 0 18 32 -6',
        happy: 'M -36 -8 Q 0 26 36 -8',
        curious: 'M -16 2 Q 0 -4 16 2',
        worried: 'M -28 8 Q -14 -4 0 4 Q 14 12 28 2',
        brave: 'M -30 4 Q 0 -2 30 4',
        whisper: 'M -14 0 Q 0 6 14 0',
        pain: 'M -30 10 Q 0 -8 30 10',
      };
      if (expr === 'scared' || expr === 'terrified')
        return (
          <g transform={`translate(0,${y})`}>
            <path d={expr === 'terrified' ? 'M -34 -6 L 34 -6 L 28 34 Q 0 44 -28 34 Z' : 'M -22 -4 Q 0 -14 22 -4 Q 26 24 0 28 Q -26 24 -22 -4 Z'} fill="#5a1620" stroke={OUT} strokeWidth={5} strokeLinejoin="round" />
            {expr === 'terrified' ? <path d="M -30 -2 L 30 -2" stroke="#fff" strokeWidth={8} /> : null}
          </g>
        );
      if (expr === 'laugh') {
        return (
          <g transform={`translate(0,${y})`}>
            <path d="M -42 -8 Q 0 -2 42 -8 Q 34 46 0 48 Q -34 46 -42 -8 Z" fill="#5a1620" stroke={OUT} strokeWidth={5} />
            <ellipse cx={0} cy={32} rx={18} ry={10} fill="#e86a82" />
          </g>
        );
      }
      return <path transform={`translate(0,${y})`} d={D[expr] ?? D.smile!} fill="none" stroke={OUT} strokeWidth={7} strokeLinecap="round" />;
    }
    const a = m ?? 0;
    const wide = expr === 'laugh' || expr === 'terrified' ? 1.35 : 1;
    const w = (42 + a * 22) * wide;
    const h = 8 + a * 52;
    const corner = expr === 'worried' || expr === 'scared' || expr === 'pain' ? 8 : expr === 'smile' || expr === 'happy' || expr === 'laugh' ? -6 : 0;
    const top = expr === 'laugh' || expr === 'happy' ? 2 : -h * 0.3;
    const d = `M ${-w / 2} ${corner} C ${-w / 4} ${top} ${w / 4} ${top} ${w / 2} ${corner} C ${w / 3} ${h * 1.15} ${-w / 3} ${h * 1.15} ${-w / 2} ${corner} Z`;
    return (
      <g transform={`translate(0,${y - 6})`}>
        <clipPath id={`${id}-mc`}>
          <path d={d} />
        </clipPath>
        <path d={d} fill="#5a1620" />
        <g clipPath={`url(#${id}-mc)`}>
          <ellipse cx={0} cy={h * 0.85} rx={w * 0.32} ry={h * 0.35} fill="#e86a82" />
          <rect x={-w / 2} y={Math.min(corner, top) - 4} width={w} height={11} fill="#fff" />
        </g>
        <path d={d} fill="none" stroke={OUT} strokeWidth={5} strokeLinejoin="round" />
      </g>
    );
  })();

  /* ---------- clothing pieces */
  const fluffy = L.top === 'fluffyJacket' || L.top === 'fluffyHoodie';
  const scallop = (x0: number, x1: number, y: number, r = 12) => {
    let d = `M ${x0} ${y}`;
    const n = Math.max(2, Math.round(Math.abs(x1 - x0) / (r * 2)));
    for (let i = 0; i < n; i++) {
      const xa = lerp(x0, x1, i / n);
      const xb = lerp(x0, x1, (i + 1) / n);
      d += ` Q ${(xa + xb) / 2} ${y + r * 1.3} ${xb} ${y}`;
    }
    return d;
  };
  const torsoTop = -632;
  const torsoBot = isThobe ? -40 : L.top === 'fluffyJacket' ? -400 : -392;
  const torso = isThobe
    ? `M -104 ${torsoTop} Q -124 -620 -118 -560 Q -150 -300 ${-170 + (run ? Math.sin(ph) * 14 : 0)} -40 Q 0 -24 ${170 + (run ? Math.sin(ph) * 14 : 0)} -40 Q 150 -300 118 -560 Q 124 -620 104 ${torsoTop} Q 0 -606 -104 ${torsoTop} Z`
    : `M -104 ${torsoTop} Q -126 -620 -120 -560 L -124 ${torsoBot} Q 0 ${torsoBot + 16} 124 ${torsoBot} L 120 -560 Q 126 -620 104 ${torsoTop} Q 0 -606 -104 ${torsoTop} Z`;

  const pantsLeg = (side: -1 | 1) => {
    if (L.bottom === 'none') return null;
    const wide = L.bottom === 'wideJeans' || L.bottom === 'pajama' || L.bottom === 'cargo';
    const x = side * 50;
    const w0 = wide ? 70 : 58;
    const w1 = wide ? (L.bottom === 'cargo' ? 54 : 76) : 54;
    const ytop = -430;
    const ybot = L.bottom === 'cargo' ? -60 : -46;
    return (
      <g>
        <path
          d={`M ${x - w0 / 2} ${ytop} L ${x + w0 / 2} ${ytop} L ${x + w1 / 2} ${ybot} Q ${x} ${ybot + 8} ${x - w1 / 2} ${ybot} Z`}
          fill={`url(#${id}-bot)`}
          stroke={OUT}
          strokeWidth={SW}
          strokeLinejoin="round"
        />
        {L.pattern === 'teddy' && L.bottom === 'pajama' ? (
          <path d={`M ${x - w0 / 2} ${ytop} L ${x + w0 / 2} ${ytop} L ${x + w1 / 2} ${ybot} Q ${x} ${ybot + 8} ${x - w1 / 2} ${ybot} Z`} fill={`url(#${id}-pat)`} />
        ) : null}
        {L.bottom === 'cargo' ? (
          <>
            <rect x={x + side * 8 - 18} y={-300} width={36} height={44} rx={5} fill={L.bottomShade} stroke={OUT} strokeWidth={3} />
            <path d={`M ${x - w1 / 2} ${ybot - 4} Q ${x} ${ybot + 14} ${x + w1 / 2} ${ybot - 4}`} stroke={L.bottomShade} strokeWidth={10} fill="none" />
          </>
        ) : null}
        {L.bottom === 'jeans' || L.bottom === 'wideJeans' ? (
          <path d={`M ${x + side * 4} ${ytop + 10} L ${x + side * 8} ${ybot - 4}`} stroke={L.bottomShade} strokeWidth={4} strokeDasharray="10 8" />
        ) : null}
        {L.bows
          ? [0, 1, 2].map((i) => (
              <g key={i} transform={`translate(${x + (i % 2 ? 12 : -14) * side},${-360 + i * 100})`}>
                <path d="M 0 0 L -12 -8 L -12 8 Z M 0 0 L 12 -8 L 12 8 Z" fill="#fff" stroke={OUT} strokeWidth={2} />
              </g>
            ))
          : null}
      </g>
    );
  };

  const foot = (side: -1 | 1) => {
    const x = side * 52;
    if (L.feet === 'bare')
      return (
        <g transform={`translate(${x},-24)`}>
          <path d="M -34 10 Q -38 -28 -8 -30 L 14 -30 Q 42 -24 44 6 Q 44 22 22 22 L -22 22 Q -36 22 -34 10 Z" fill={skin} stroke={OUT} strokeWidth={SW} />
          {[0, 1, 2, 3].map((i) => (
            <circle key={i} cx={side * (-14 + i * 12)} cy={16} r={5} fill={L.skinShade} />
          ))}
        </g>
      );
    if (L.feet === 'sandals')
      return (
        <g transform={`translate(${x},-22)`}>
          <path d="M -36 10 Q -40 -26 -10 -28 L 14 -28 Q 42 -22 44 8 Q 44 22 22 22 L -24 22 Q -38 22 -36 10 Z" fill={skin} stroke={OUT} strokeWidth={SW} />
          <path d="M -40 18 L 46 18" stroke="#8a5a32" strokeWidth={12} strokeLinecap="round" />
          <path d="M -22 -10 Q 4 -24 30 -10" stroke="#8a5a32" strokeWidth={12} fill="none" />
        </g>
      );
    if (L.feet === 'sneakers')
      return (
        <g transform={`translate(${x},-24)`}>
          <path d="M -44 12 Q -48 -32 -14 -36 L 18 -36 Q 52 -30 54 8 Q 54 26 30 26 L -30 26 Q -48 26 -44 12 Z" fill="#eef3fb" stroke={OUT} strokeWidth={SW} />
          <path d="M -44 14 L 54 14" stroke="#9fb8dc" strokeWidth={12} />
          <path d="M -20 -24 Q 6 -10 36 -20" stroke="#9fb8dc" strokeWidth={8} fill="none" />
          <path d="M -6 -32 l 14 8 M 6 -34 l 14 8" stroke="#7c93b8" strokeWidth={4} strokeLinecap="round" />
        </g>
      );
    const sock = L.feet === 'pinkSocks' ? '#fde2ee' : '#f7f5f2';
    return (
      <g transform={`translate(${x},-24)`}>
        <path d="M -38 10 Q -42 -36 -10 -38 L 14 -38 Q 44 -30 46 6 Q 46 24 22 24 L -26 24 Q -40 24 -38 10 Z" fill={sock} stroke={OUT} strokeWidth={SW} />
        {L.feet === 'pinkSocks' ? [0, 1].map((i) => <path key={i} d={`M ${-10 + i * 22} -10 q -6 -8 0 -12 q 6 4 0 12 q -6 -4 0 0`} fill="#f472b6" />) : null}
        {L.feet === 'stripeSocks' ? <path d="M -36 -14 L 40 -14 M -36 -2 L 42 -2" stroke="#c9b7d8" strokeWidth={5} /> : null}
      </g>
    );
  };

  const Arm = ({side, raise, bend, prop}: {side: -1 | 1; raise: number; bend: number; prop?: React.ReactNode}) => {
    const b = (bend * Math.PI) / 180;
    const hx = side * Math.sin(b) * FORE;
    const hy = UPPER + Math.cos(b) * FORE;
    return (
      <g transform={`translate(${side * SH_X},${SH_Y}) rotate(${side * -raise})`}>
        <Limb d={`M 0 0 L 0 ${UPPER} L ${hx} ${hy}`} w={L.top === 'tee' ? 42 : 50} color={L.top === 'tee' ? skin : L.topColor} />
        {L.top === 'tee' ? <path d="M -32 -14 Q 0 -30 32 -14 L 34 62 Q 0 72 -34 62 Z" fill={L.topColor} stroke={OUT} strokeWidth={SW} strokeLinejoin="round" /> : null}
        {L.pattern === 'teddy' ? <path d={`M 0 0 L 0 ${UPPER} L ${hx} ${hy}`} stroke={`url(#${id}-pat)`} strokeWidth={50} fill="none" strokeLinecap="round" /> : null}
        {fluffy ? <path d={`M 0 0 L 0 ${UPPER} L ${hx * 0.85} ${hy * 0.9}`} stroke={L.topShade} strokeWidth={6} strokeDasharray="2 12" strokeLinecap="round" fill="none" /> : null}
        <circle cx={hx} cy={hy} r={25} fill={skin} stroke={OUT} strokeWidth={SW} />
        <path d={`M ${hx - side * 8} ${hy + 10} q ${side * 8} 8 ${side * 16} 0`} stroke={OUT} strokeWidth={3} fill="none" opacity={0.5} />
        {L.top === 'tee' ? null : <ellipse cx={hx * 0.93} cy={hy * 0.93 - 2} rx={27} ry={10} fill={L.top === 'fluffyJacket' || L.top === 'fluffyHoodie' ? L.topShade : L.topShade} stroke={OUT} strokeWidth={3} transform={`rotate(${(bend * side) / 1},${hx * 0.93},${hy * 0.93})`} />}
        {prop ? <g transform={`translate(${hx},${hy}) rotate(${side * raise})`}>{prop}</g> : null}
      </g>
    );
  };

  const chest = (() => {
    if (L.pattern === 'cat')
      return (
        <g transform="translate(0,-500)">
          <path d="M -62 -40 L -54 -86 L -24 -58 Q 0 -66 24 -58 L 54 -86 L 62 -40 Q 74 10 40 36 Q 0 54 -40 36 Q -74 10 -62 -40 Z" fill="#ffffff" stroke="#c9a7b4" strokeWidth={4} />
          <path d="M -46 -60 L -50 -78 L -34 -64 Z M 46 -60 L 50 -78 L 34 -64 Z" fill="#f9b8c9" />
          <ellipse cx={-24} cy={-14} rx={14} ry={17} fill="#3b82c4" />
          <ellipse cx={24} cy={-14} rx={14} ry={17} fill="#3b82c4" />
          <circle cx={-28} cy={-20} r={5} fill="#fff" />
          <circle cx={20} cy={-20} r={5} fill="#fff" />
          <path d="M -6 6 L 6 6 L 0 13 Z" fill="#f48fb1" />
          <path d="M 0 13 Q -8 22 -14 16 M 0 13 Q 8 22 14 16" stroke="#8a6070" strokeWidth={3} fill="none" />
          <g transform="translate(36,-74) rotate(18)">
            <path d="M 0 0 L -30 -18 L -30 18 Z M 0 0 L 30 -18 L 30 18 Z" fill="#f4a6bd" stroke="#c46a8a" strokeWidth={3} />
            <circle r={8} fill="#e88aa8" />
          </g>
        </g>
      );
    return null;
  })();

  const topDetails = (() => {
    switch (L.top) {
      case 'fluffyJacket':
        return (
          <>
            <path d="M -70 -632 Q -110 -600 -96 -556 Q -40 -570 0 -600 Q 40 -570 96 -556 Q 110 -600 70 -632 Q 0 -610 -70 -632 Z" fill="#efe4c4" stroke={OUT} strokeWidth={4} />
            <path d="M 0 -600 L 0 -404" stroke={L.topShade} strokeWidth={4} />
            {[0, 1, 2, 3].map((i) => (
              <circle key={i} cx={8} cy={-560 + i * 46} r={8} fill="#fffef6" stroke={OUT} strokeWidth={3} />
            ))}
            <path d={scallop(-124, 124, -404, 10)} stroke={L.topShade} strokeWidth={10} fill="none" />
          </>
        );
      case 'fluffyHoodie':
      case 'hoodie':
        return (
          <>
            <path d="M -86 -636 Q -130 -680 -96 -720 Q 0 -760 96 -720 Q 130 -680 86 -636" fill={L.topShade} stroke={OUT} strokeWidth={4} />
            <path d="M -40 -630 L -46 -560 M 40 -630 L 46 -560" stroke={L.top === 'hoodie' ? '#e7dcd2' : '#fff'} strokeWidth={5} strokeLinecap="round" />
            <path d="M -124 -410 Q 0 -394 124 -410" stroke={L.topShade} strokeWidth={14} fill="none" />
          </>
        );
      case 'tee':
        return (
          <>
            <path d="M -50 -630 Q 0 -596 50 -630" fill="none" stroke="#2c2d33" strokeWidth={9} />
            <g transform="translate(-52,-540) scale(0.9)">
              <path d="M -16 6 L -12 -6 L 6 -6 L 12 -16 L 18 -12 L 14 -4 L 16 6 L 12 6 L 10 0 L -6 0 L -8 6 Z" fill="#f4f4f4" />
              <path d="M 12 -16 L 8 -28 M 12 -16 L 16 -30 M 8 -24 L 2 -28 M 15 -24 L 22 -28" stroke="#f4f4f4" strokeWidth={2.5} strokeLinecap="round" />
            </g>
          </>
        );
      case 'pajama':
        return <path d="M -50 -630 Q 0 -596 50 -630" fill="none" stroke={L.topShade} strokeWidth={9} />;
      case 'sweatshirt':
        return (
          <>
            <path d="M -50 -630 Q 0 -594 50 -630" fill="none" stroke="#f4f4f4" strokeWidth={8} />
            <path d="M -124 -404 Q 0 -388 124 -404" stroke={L.topShade} strokeWidth={14} fill="none" />
          </>
        );
      case 'thobe':
        return (
          <>
            <path d="M -40 -632 L -40 -604 Q 0 -592 40 -604 L 40 -632" fill="#fff" stroke={OUT} strokeWidth={4} />
            <path d="M 0 -600 L 0 -440" stroke={L.topShade} strokeWidth={5} />
            {[0, 1, 2].map((i) => (
              <circle key={i} cx={0} cy={-580 + i * 48} r={5} fill="#fff" stroke={OUT} strokeWidth={2} />
            ))}
            <rect x={36} y={-560} width={56} height={58} rx={6} fill="none" stroke={L.topShade} strokeWidth={4} />
            <path d="M -60 -440 Q -90 -260 -120 -60 M 60 -440 Q 90 -260 120 -60" stroke={L.topShade} strokeWidth={4} fill="none" opacity={0.7} />
          </>
        );
    }
  })();

  return (
    <g transform={`translate(${p.x + shiver},${p.y})`}>
      <defs>
        <radialGradient id={`${id}-iris`} cx="0.45" cy="0.35" r="0.7">
          <stop offset="0" stopColor={mix(L.iris, '#b07a50', 0.5)} />
          <stop offset="0.6" stopColor={L.iris} />
          <stop offset="1" stopColor="#120806" />
        </radialGradient>
        <radialGradient id={`${id}-face`} cx="0.4" cy="0.35" r="0.75">
          <stop offset="0" stopColor={mix(skin, '#ffffff', 0.22)} />
          <stop offset="0.7" stopColor={skin} />
          <stop offset="1" stopColor={L.skinShade} />
        </radialGradient>
        <linearGradient id={`${id}-top`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={mix(L.topColor, '#ffffff', 0.15)} />
          <stop offset="0.6" stopColor={L.topColor} />
          <stop offset="1" stopColor={L.topShade} />
        </linearGradient>
        <linearGradient id={`${id}-bot`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={mix(L.bottomColor, '#ffffff', 0.15)} />
          <stop offset="0.65" stopColor={L.bottomColor} />
          <stop offset="1" stopColor={L.bottomShade} />
        </linearGradient>
        <linearGradient id={`${id}-hair`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor={mix(hc, hh, 0.45)} />
          <stop offset="0.5" stopColor={hc} />
          <stop offset="1" stopColor={mix(hc, '#000000', 0.3)} />
        </linearGradient>
        <radialGradient id={`${id}-blush`}>
          <stop offset="0" stopColor={L.blush} stopOpacity={0.7} />
          <stop offset="1" stopColor={L.blush} stopOpacity={0} />
        </radialGradient>
        <PatternDefs id={id} look={L} />
      </defs>

      <ellipse cx={0} cy={4} rx={190 * s * (1 - Math.min(jump, 120) / 300)} ry={28 * s} fill="#140a18" opacity={0.28 * (1 - Math.min(jump, 120) / 200)} />

      <g transform={`translate(0,${-jump + fallen * 200 * s}) rotate(${p.lean ?? 0}) scale(${s * (1 + sq)},${s * (1 - sq)})`}>
        {/* back hair */}
        <g transform={`rotate(${headTilt * 0.4},0,-830)`}>
          {bun}
          <path d={backHair} fill={hairFill} stroke={OUT} strokeWidth={SW} strokeLinejoin="round" />
        </g>

        {/* legs / pants / feet */}
        {[-1, 1].map((side) => (
          <g key={side} transform={`rotate(${side * legA * (1 - fallen)},${side * 50},-420)`}>
            {L.bottom === 'none' ? <Limb d={`M ${side * 46} -200 L ${side * 46} -46`} w={44} color={skin} /> : null}
            {pantsLeg(side as -1 | 1)}
            {L.bottom === 'cargo' || L.feet === 'bare' || L.feet === 'sandals' ? <Limb d={`M ${side * 50} -70 L ${side * 50} -40`} w={40} color={skin} /> : null}
            {foot(side as -1 | 1)}
          </g>
        ))}

        <g transform={`scale(1,${breathe})`} style={{transformOrigin: '0px -420px'}}>
          <path d={torso} fill={`url(#${id}-top)`} stroke={OUT} strokeWidth={SW} strokeLinejoin="round" />
          {L.pattern === 'teddy' || L.pattern === 'hearts' || L.pattern === 'dino' ? <path d={torso} fill={`url(#${id}-pat)`} /> : null}
          {fluffy ? (
            <>
              {Array.from({length: 26}).map((_, i) => (
                <circle key={i} cx={-100 + rnd(i) * 200} cy={-610 + rnd(i + 30) * 200} r={4} fill={L.topShade} opacity={0.5} />
              ))}
              <path d={torso} fill="none" stroke={L.topShade} strokeWidth={8} strokeDasharray="3 14" strokeLinecap="round" />
            </>
          ) : null}
          {topDetails}
          {chest}
          {/* neck */}
          <path d="M -34 -690 L -34 -620 Q 0 -600 34 -620 L 34 -690 Z" fill={L.skinShade} stroke={OUT} strokeWidth={SW} />
        </g>

        <Arm side={-1} raise={armL} bend={p.bendL ?? (armL > 60 ? 22 : 8)} prop={p.propL} />
        <Arm side={1} raise={armR} bend={p.bendR ?? (armR > 60 ? 22 : 8)} prop={p.propR} />

        {/* head */}
        <g transform={`rotate(${headTilt},0,-680)`}>
          {L.boy ? (
            <>
              <ellipse cx={-178} cy={-800} rx={26} ry={36} fill={skin} stroke={OUT} strokeWidth={SW} />
              <ellipse cx={178} cy={-800} rx={26} ry={36} fill={skin} stroke={OUT} strokeWidth={SW} />
            </>
          ) : null}
          <path
            d="M -178 -840 Q -180 -1010 0 -1022 Q 180 -1010 178 -840 Q 176 -700 96 -660 Q 40 -632 0 -632 Q -40 -632 -96 -660 Q -176 -700 -178 -840 Z"
            fill={`url(#${id}-face)`}
            stroke={OUT}
            strokeWidth={SW}
          />
          <ellipse cx={-110} cy={-728} rx={46} ry={30} fill={`url(#${id}-blush)`} />
          <ellipse cx={110} cy={-728} rx={46} ry={30} fill={`url(#${id}-blush)`} />
          {expr === 'terrified' || expr === 'scared' ? <ellipse cx={0} cy={-900} rx={150} ry={80} fill="#7a8cc8" opacity={0.18} /> : null}
          {eye(-1)}
          {eye(1)}
          {[-1, 1].map((side) => (
            <path
              key={side}
              d={`M ${side * 34} ${-884 + bi} Q ${side * 70} ${-906 + (bi + bo) / 2} ${side * 112} ${-880 + bo}`}
              stroke={hc}
              strokeWidth={L.boy ? 17 : 14}
              strokeLinecap="round"
              fill="none"
            />
          ))}
          <path d="M -6 -748 Q 0 -736 8 -746" stroke={L.skinShade} strokeWidth={6} fill="none" strokeLinecap="round" />
          {mouth}
          {expr === 'scared' || expr === 'terrified' || expr === 'worried' ? (
            <path d={`M 150 ${-930 + ((t * 80) % 110)} q 12 22 0 30 q -12 -8 0 -30 z`} fill="#cfeaff" stroke="#4a9be0" strokeWidth={3} opacity={1 - ((t * 80) % 110) / 110} />
          ) : null}
          {frontHair}
          {p.headlamp ? (
            <g>
              <path d="M -176 -930 Q 0 -990 176 -930" stroke="#2b2b33" strokeWidth={18} fill="none" />
              <rect x={-36} y={-1000} width={72} height={50} rx={12} fill="#3a3a44" stroke={OUT} strokeWidth={4} />
              <circle cx={0} cy={-975} r={17} fill="#fff7c2" />
            </g>
          ) : null}
        </g>
      </g>
    </g>
  );
};

/* ------------------------------------------------------------------ hunting rifle prop (held in a hand) */
export const Rifle: React.FC<{flash?: number}> = ({flash = 0}) => (
  <g transform="rotate(-90)">
    <path d="M -60 -14 L 40 -14 L 70 -4 L 70 18 L 40 10 L -20 10 Q -60 30 -80 20 Q -86 -6 -60 -14 Z" fill="#8a5a32" stroke={OUT} strokeWidth={4} />
    <rect x={40} y={-20} width={330} height={14} rx={5} fill="#4a4f5a" stroke={OUT} strokeWidth={4} />
    <rect x={80} y={-36} width={70} height={16} rx={6} fill="#2b2f38" stroke={OUT} strokeWidth={3} />
    {flash > 0 ? (
      <g transform="translate(380,-13)" opacity={flash}>
        <path d="M 0 0 L 70 -30 L 50 -6 L 110 0 L 50 6 L 70 30 Z" fill="#ffd54a" />
        <circle r={22} fill="#fff6c2" />
      </g>
    ) : null}
  </g>
);
