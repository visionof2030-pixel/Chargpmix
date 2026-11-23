import React from 'react';

const OUT = '#2b1b16';
const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export type CatMode = 'stand' | 'walk' | 'run' | 'crouch' | 'sit' | 'hiss';

/** Arabian leopard, side view, facing right (use facing={-1} to flip). cub=true for the baby. */
export const Leopard: React.FC<{
  id: string;
  x: number;
  y: number;
  s?: number;
  t: number;
  facing?: 1 | -1;
  mode?: CatMode;
  cub?: boolean;
  snarl?: number; // 0..1 mouth open with fangs
  glow?: number; // 0..1 eyes glow (darkness)
  lookUp?: number;
  silhouette?: number; // 0..1 darken into the shadows
}> = ({id, x, y, s = 1, t, facing = 1, mode = 'stand', cub = false, snarl = 0, glow = 0, lookUp = 0, silhouette = 0}) => {
  const run = mode === 'run';
  const walk = mode === 'walk';
  const crouch = mode === 'crouch';
  const sit = mode === 'sit';
  const speed = run ? 14 : 6;
  const ph = t * speed;
  const fur = cub ? '#e6cf9f' : '#e3c48a';
  const furShade = cub ? '#c9ad7a' : '#c29a5e';
  const belly = '#f7ecd2';
  const spot = '#5a3a1e';
  const head = cub ? 1.45 : 1; // cubs have big heads
  const legLen = cub ? 0.8 : 1;
  const bodyDrop = crouch ? 70 : sit ? 40 : 0;
  const bob = run ? Math.abs(Math.sin(ph)) * 26 : walk ? Math.abs(Math.sin(ph)) * 6 : 0;
  const stretch = (run ? 1 + Math.sin(ph) * 0.08 : 1) * (cub ? 0.7 : 1);
  const breathe = 1 + Math.sin(t * (crouch ? 6 : 2.2)) * (crouch ? 0.03 : 0.015);
  const tailSw = Math.sin(t * (crouch ? 7 : 2.2)) * (crouch ? 26 : 16);
  const legSwing = (k: number) => (run ? Math.sin(ph + k) * 38 : walk ? Math.sin(ph + k) * 20 : 0);
  const bodyY = -(cub ? 175 : 270) - bodyDrop;
  void legLen;

  const leg = (bx: number, k: number, far: boolean) => {
    const a = legSwing(k);
    const top = bodyY + 30;
    const L = -top - 10;
    const color = far ? furShade : fur;
    const bend = crouch ? 40 : sit && bx < 0 ? 80 : 0;
    const w0 = cub ? 64 : 92;
    const w1 = cub ? 34 : 46;
    const kx = bend * 0.3 + (bx > 0 ? 10 : -14);
    const shape = `M ${-w0 / 2} 0 Q ${-w0 / 2 - 6} ${L * 0.3} ${kx - w1 / 2 - 4} ${L * 0.55} L ${-w1 / 2} ${L} L ${w1 / 2} ${L} L ${kx + w1 / 2} ${L * 0.55} Q ${w0 / 2 + 4} ${L * 0.25} ${w0 / 2} 0 Z`;
    return (
      <g transform={`translate(${bx},${top}) rotate(${a})`}>
        <path d={shape} fill={color} stroke={OUT} strokeWidth={5} strokeLinejoin="round" />
        {!far ? <path d={`M ${-w0 / 4} ${L * 0.12} Q ${-w0 / 6} ${L * 0.32} ${kx - w1 / 4} ${L * 0.5}`} stroke={furShade} strokeWidth={6} fill="none" opacity={0.6} /> : null}
        <ellipse cx={12} cy={L + 2} rx={cub ? 30 : 42} ry={cub ? 15 : 20} fill={color} stroke={OUT} strokeWidth={5} />
        <path d={`M ${2} ${L + 4} l 0 12 M ${16} ${L + 4} l 0 12 M ${30} ${L + 2} l 0 12`} stroke={OUT} strokeWidth={3} opacity={0.5} />
      </g>
    );
  };

  const spots = Array.from({length: cub ? 16 : 26}).map((_, i) => {
    const sx = -190 + rnd(i) * 360;
    const sy = bodyY - 60 + rnd(i + 40) * 110;
    const r = cub ? 9 + rnd(i + 2) * 4 : 11 + rnd(i + 2) * 6;
    return (
      <g key={i}>
        <circle cx={sx} cy={sy} r={r} fill="none" stroke={spot} strokeWidth={cub ? 5 : 6} strokeDasharray={`${r * 1.3} ${r * 0.5}`} />
        <circle cx={sx} cy={sy} r={r * 0.4} fill={furShade} />
      </g>
    );
  });

  const headX = (cub ? 200 : 250) * (stretch / (cub ? 0.7 : 1)) * (cub ? 0.85 : 1);
  const headY = bodyY - (cub ? 50 : 80) - lookUp * 40 + (crouch ? 60 : 0);
  const R = (cub ? 80 : 96) * head;
  const eyeGlow = glow > 0;
  const jawOpen = snarl * 46 * (cub ? 0.5 : 1);

  return (
    <g transform={`translate(${x},${y}) scale(${s * facing},${s})`}>
      <defs>
        <radialGradient id={`${id}-eye`}>
          <stop offset="0" stopColor="#fffbd0" />
          <stop offset="0.4" stopColor={cub ? '#9cc7e8' : '#d8e64a'} />
          <stop offset="1" stopColor={cub ? '#4b7ea8' : '#7a9a12'} />
        </radialGradient>
        <radialGradient id={`${id}-halo`}>
          <stop offset="0" stopColor="#e9ff7a" stopOpacity={0.9} />
          <stop offset="1" stopColor="#e9ff7a" stopOpacity={0} />
        </radialGradient>
        <clipPath id={`${id}-body`}>
          <ellipse cx={0} cy={bodyY} rx={240 * stretch} ry={(cub ? 88 : 104) * breathe} />
        </clipPath>
      </defs>
      <ellipse cx={0} cy={6} rx={260} ry={26} fill="#000" opacity={0.25 * (1 - bob / 80)} />
      <g transform={`translate(0,${-bob})`} opacity={1}>
        {/* tail */}
        <path
          d={`M ${-220 * stretch} ${bodyY - 20} Q ${-340} ${bodyY + 40 + tailSw} ${-380} ${bodyY + (sit ? 160 : 60)} Q ${-410} ${bodyY - 40 + tailSw} ${-360} ${bodyY - 110 + tailSw}`}
          stroke={OUT}
          strokeWidth={cub ? 40 : 46}
          fill="none"
          strokeLinecap="round"
        />
        <path
          d={`M ${-220 * stretch} ${bodyY - 20} Q ${-340} ${bodyY + 40 + tailSw} ${-380} ${bodyY + (sit ? 160 : 60)} Q ${-410} ${bodyY - 40 + tailSw} ${-360} ${bodyY - 110 + tailSw}`}
          stroke={fur}
          strokeWidth={cub ? 30 : 36}
          fill="none"
          strokeLinecap="round"
          strokeDasharray="40 22"
        />
        {/* far legs */}
        {leg(-150 * stretch, Math.PI, true)}
        {leg(150 * stretch, 0, true)}
        {/* body */}
        <ellipse cx={0} cy={bodyY} rx={240 * stretch} ry={(cub ? 88 : 104) * breathe} fill={fur} stroke={OUT} strokeWidth={6} />
        <g clipPath={`url(#${id}-body)`}>
          <ellipse cx={0} cy={bodyY + 70} rx={230} ry={50} fill={belly} />
          {spots}
          <ellipse cx={-40} cy={bodyY - 60} rx={180} ry={24} fill="#fff4d6" opacity={0.25} />
        </g>
        {/* near legs */}
        {leg(-170 * stretch, Math.PI * 0.6, false)}
        {leg(170 * stretch, Math.PI * 1.6, false)}
        {/* neck */}
        <path d={`M ${110 * stretch} ${bodyY - 80} Q ${headX - R * 0.6} ${headY - R * 0.5} ${headX} ${headY} L ${headX + R * 0.2} ${headY + R * 0.7} Q ${headX - R * 0.4} ${bodyY + 40} ${160 * stretch} ${bodyY + 70} Z`} fill={fur} stroke={OUT} strokeWidth={6} strokeLinejoin="round" />
        {/* head */}
        <g transform={`translate(${headX},${headY})`}>
          {[-1, 1].map((k) => (
            <g key={k} transform={`translate(${k * 34 * head - 8},${-R * 0.82}) rotate(${k * 12})`}>
              <path d={`M -26 10 Q -28 -36 0 -40 Q 28 -36 26 10 Z`} fill={fur} stroke={OUT} strokeWidth={5} transform={`scale(${head})`} />
              <path d={`M -14 6 Q -14 -22 0 -24 Q 14 -22 14 6 Z`} fill="#c98a6a" transform={`scale(${head})`} />
            </g>
          ))}
          <circle r={R} fill={fur} stroke={OUT} strokeWidth={6} />
          {/* face spots */}
          {[
            [-40, -40],
            [-20, -58],
            [10, -52],
            [-52, -10],
            [-30, 30],
          ].map(([a, b], i) => (
            <circle key={i} cx={a * head} cy={b * head} r={6 * head} fill={spot} />
          ))}
          {/* muzzle */}
          <ellipse cx={R * 0.62} cy={R * 0.28} rx={R * 0.48} ry={R * 0.38 + jawOpen * 0.3} fill={belly} stroke={OUT} strokeWidth={5} />
          <path d={`M ${R * 0.96} ${R * 0.06} q 18 6 6 22 q -18 4 -22 -8 z`} fill="#5a2e2a" />
          {jawOpen > 2 ? (
            <g>
              <path d={`M ${R * 0.35} ${R * 0.38} Q ${R * 0.8} ${R * 0.36} ${R * 1.02} ${R * 0.34} L ${R * 0.98} ${R * 0.34 + jawOpen} Q ${R * 0.7} ${R * 0.4 + jawOpen * 1.1} ${R * 0.38} ${R * 0.42} Z`} fill="#5a1620" stroke={OUT} strokeWidth={4} />
              <path d={`M ${R * 0.5} ${R * 0.38} l 6 ${18 * (cub ? 0.6 : 1)} l 6 ${-18 * (cub ? 0.6 : 1)} M ${R * 0.85} ${R * 0.36} l 6 ${20 * (cub ? 0.6 : 1)} l 6 ${-20 * (cub ? 0.6 : 1)}`} fill="#fff" stroke="#fff" strokeWidth={3} />
              <path d={`M ${R * 0.5} ${R * 0.4 + jawOpen} l 6 -16 l 6 16 M ${R * 0.85} ${R * 0.38 + jawOpen} l 6 -16 l 6 16`} fill="#fff" stroke="#fff" strokeWidth={3} />
            </g>
          ) : (
            <path d={`M ${R * 0.5} ${R * 0.46} Q ${R * 0.75} ${R * 0.56} ${R * 0.98} ${R * 0.4}`} stroke={OUT} strokeWidth={4} fill="none" />
          )}
          {/* whiskers */}
          <path d={`M ${R * 0.8} ${R * 0.28} l 70 -12 M ${R * 0.8} ${R * 0.34} l 72 6`} stroke="#fff" strokeWidth={2.5} opacity={0.8} />
          {/* eye */}
          {eyeGlow ? <circle cx={R * 0.4} cy={-R * 0.12} r={60 * head} fill={`url(#${id}-halo)`} opacity={glow} /> : null}
          <g transform={`translate(${R * 0.4},${-R * 0.12})`}>
            <path d={`M -26 0 Q 0 ${-24 * head} 26 0 Q 0 ${20 * head} -26 0 Z`} fill={`url(#${id}-eye)`} stroke={OUT} strokeWidth={4} transform={`scale(${cub ? 1.25 : 1})`} />
            <ellipse cx={4} cy={0} rx={cub ? 8 : 5} ry={cub ? 12 : 13} fill="#120804" />
            {cub ? <circle cx={-4} cy={-6} r={5} fill="#fff" /> : null}
            {!cub && snarl > 0.3 ? <path d="M -30 -18 L 26 -4" stroke={OUT} strokeWidth={7} strokeLinecap="round" /> : null}
          </g>
          {/* tear line */}
          <path d={`M ${R * 0.3} ${-R * 0.02} Q ${R * 0.38} ${R * 0.2} ${R * 0.52} ${R * 0.18}`} stroke={spot} strokeWidth={5} fill="none" />
        </g>
      </g>
      {silhouette > 0 ? (
        <g opacity={silhouette}>
          <ellipse cx={0} cy={bodyY} rx={250 * stretch} ry={100} fill="#05030a" />
          <circle cx={headX} cy={headY} r={R + 4} fill="#05030a" />
          <circle cx={headX + R * 0.4} cy={headY - R * 0.12} r={60 * head} fill={`url(#${id}-halo)`} />
          <path d={`M ${headX + R * 0.4 - 26} ${headY - R * 0.12} Q ${headX + R * 0.4} ${headY - R * 0.12 - 20} ${headX + R * 0.4 + 26} ${headY - R * 0.12} Q ${headX + R * 0.4} ${headY - R * 0.12 + 16} ${headX + R * 0.4 - 26} ${headY - R * 0.12} Z`} fill="#e9ff7a" />
        </g>
      ) : null}
    </g>
  );
};
