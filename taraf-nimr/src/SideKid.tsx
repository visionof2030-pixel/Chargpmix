import React from 'react';
import {Expr, Look, PatternDefs, mix} from './Kid';

/* Side-view (profile) rig for every kid, facing right (facing={-1} mirrors it).
   Real walk / run cycles, anticipation, secondary motion on hair & clothes. */

const OUT = '#2b1b26';
const rad = (d: number) => (d * Math.PI) / 180;
const TH = 190;
const SH = 190;
const UA = 120;
const FA = 112;

export type SidePose = {
  phase: number;
  walk: number;
  run: number;
  crouch?: number;
  tuck?: number;
  t: number;
  vel: number;
  mouth?: number | null;
  expr?: Expr;
  look?: number;
  blink?: number;
  lamp?: number;
};

const Leg: React.FC<{id: string; L: Look; thigh: number; knee: number; far?: boolean}> = ({id, L, thigh, knee, far}) => {
  const kx = -Math.sin(rad(thigh)) * TH;
  const ky = Math.cos(rad(thigh)) * TH;
  const a2 = thigh + knee;
  const ax = kx - Math.sin(rad(a2)) * SH;
  const ay = ky + Math.cos(rad(a2)) * SH;
  const pants = L.bottom !== 'none';
  const col = far ? mix(L.bottomColor, '#000000', 0.22) : L.bottomColor;
  const short = L.bottom === 'cargo'; // joggers end above the ankle
  const legPath = `M 0 0 L ${kx} ${ky} L ${ax} ${ay}`;
  const foot = -a2 * 0.85;
  const skin = far ? L.skinShade : L.skin;
  const footEl = (() => {
    if (L.feet === 'sneakers')
      return (
        <>
          <path d="M -40 -6 Q -46 -44 -10 -46 L 40 -40 Q 96 -30 104 4 Q 106 22 84 24 L -34 24 Q -48 22 -40 -6 Z" fill={far ? '#cfd8e6' : '#eef3fb'} stroke={OUT} strokeWidth={5} />
          <path d="M -42 14 L 104 14" stroke="#9fb8dc" strokeWidth={12} />
        </>
      );
    if (L.feet === 'bare' || L.feet === 'sandals')
      return (
        <>
          <path d="M -34 -4 Q -40 -40 -6 -40 L 40 -30 Q 92 -20 98 6 Q 100 22 80 22 L -28 22 Q -42 20 -34 -4 Z" fill={skin} stroke={OUT} strokeWidth={5} />
          {L.feet === 'sandals' ? <path d="M -36 18 L 98 18" stroke="#8a5a32" strokeWidth={12} /> : [0, 1, 2].map((i) => <circle key={i} cx={70 + i * 9} cy={14} r={5} fill={L.skinShade} />)}
        </>
      );
    const sock = L.feet === 'pinkSocks' ? '#fde2ee' : '#f7f5f2';
    return (
      <>
        <path d="M -38 -10 Q -44 -48 -8 -48 L 38 -38 Q 94 -28 100 4 Q 102 22 80 22 L -32 22 Q -46 20 -38 -10 Z" fill={far ? mix(sock, '#000000', 0.12) : sock} stroke={OUT} strokeWidth={5} />
        {L.feet === 'stripeSocks' ? <path d="M -38 -24 L 30 -26 M -38 -10 L 40 -12" stroke="#c9b7d8" strokeWidth={5} /> : null}
        {L.feet === 'pinkSocks' ? <circle cx={40} cy={-6} r={7} fill="#f472b6" /> : null}
      </>
    );
  })();
  return (
    <g>
      <path d={legPath} fill="none" stroke={OUT} strokeWidth={pants ? 84 : 56} strokeLinecap="round" strokeLinejoin="round" />
      <path d={legPath} fill="none" stroke={pants ? col : skin} strokeWidth={pants ? 72 : 44} strokeLinecap="round" strokeLinejoin="round" />
      {L.pattern === 'teddy' && L.bottom === 'pajama' ? <path d={legPath} fill="none" stroke={`url(#${id}-pat)`} strokeWidth={72} strokeLinecap="round" strokeLinejoin="round" opacity={far ? 0.6 : 1} /> : null}
      {L.bottom === 'cargo' ? <rect x={kx * 0.55 - 20} y={ky * 0.55 - 26} width={40} height={52} rx={6} fill={L.bottomShade} stroke={OUT} strokeWidth={3} transform={`rotate(${thigh},${kx * 0.55},${ky * 0.55})`} /> : null}
      {short ? (
        <path d={`M ${ax - Math.sin(rad(a2)) * -40} ${ay + Math.cos(rad(a2)) * -40} L ${ax} ${ay}`} stroke={skin} strokeWidth={40} strokeLinecap="round" />
      ) : null}
      <g transform={`translate(${ax},${ay}) rotate(${foot})`}>{footEl}</g>
    </g>
  );
};

const Arm: React.FC<{id: string; L: Look; sh: number; el: number; far?: boolean}> = ({id, L, sh, el, far}) => {
  const ex = -Math.sin(rad(sh)) * UA;
  const ey = Math.cos(rad(sh)) * UA;
  const a2 = sh - el;
  const hx = ex - Math.sin(rad(a2)) * FA;
  const hy = ey + Math.cos(rad(a2)) * FA;
  const skin = far ? L.skinShade : L.skin;
  const tee = L.top === 'tee';
  const sleeve = far ? mix(L.topColor, '#000000', 0.25) : L.topColor;
  const path = `M 0 0 L ${ex} ${ey} L ${hx} ${hy}`;
  return (
    <g>
      <path d={path} fill="none" stroke={OUT} strokeWidth={tee ? 56 : 62} strokeLinecap="round" strokeLinejoin="round" />
      <path d={path} fill="none" stroke={tee ? skin : sleeve} strokeWidth={tee ? 44 : 50} strokeLinecap="round" strokeLinejoin="round" />
      {(L.pattern === 'teddy' || L.pattern === 'hearts' || L.pattern === 'dino') && !tee ? (
        <path d={path} fill="none" stroke={`url(#${id}-pat)`} strokeWidth={50} strokeLinecap="round" strokeLinejoin="round" opacity={far ? 0.6 : 1} />
      ) : null}
      <circle cx={hx} cy={hy} r={27} fill={skin} stroke={OUT} strokeWidth={5} />
      {tee ? (
        <g transform={`rotate(${sh})`}>
          <path d="M -38 -18 Q 0 -34 38 -18 L 36 66 Q 0 76 -36 66 Z" fill={sleeve} stroke={OUT} strokeWidth={5} strokeLinejoin="round" />
        </g>
      ) : (
        <ellipse cx={ex + (hx - ex) * 0.86} cy={ey + (hy - ey) * 0.86} rx={28} ry={11} fill={far ? mix(L.topShade, '#000000', 0.2) : L.topShade} stroke={OUT} strokeWidth={3} transform={`rotate(${a2},${ex + (hx - ex) * 0.86},${ey + (hy - ey) * 0.86})`} />
      )}
    </g>
  );
};

const browOf = (e: Expr): [number, number] => {
  // dy, tilt
  switch (e) {
    case 'curious':
      return [-18, 0];
    case 'worried':
      return [-10, 12];
    case 'scared':
      return [-22, 10];
    case 'terrified':
      return [-28, 8];
    case 'brave':
      return [10, -14];
    case 'pain':
      return [-4, 16];
    default:
      return [0, 0];
  }
};

export const SideKid: React.FC<{id: string; L: Look; x: number; y: number; s: number; pose: SidePose; facing?: 1 | -1; rifleOnBack?: boolean}> = ({
  id,
  L,
  x,
  y,
  s,
  pose,
  facing = 1,
  rifleOnBack = false,
}) => {
  const {phase: p, walk, run, t} = pose;
  const crouch = pose.crouch ?? 0;
  const tuck = pose.tuck ?? 0;
  const w = Math.PI * 2 * p;
  const thighA = walk * 24 + run * 52;
  const kneeB = walk * 42 + run * 105;
  const legNear = {thigh: -thighA * Math.sin(w) - tuck * 70 - crouch * 30, knee: 6 + kneeB * Math.max(0, Math.cos(w)) + tuck * 110 + crouch * 70};
  const legFar = {thigh: -thighA * Math.sin(w + Math.PI) - tuck * 50 - crouch * 30, knee: 6 + kneeB * Math.max(0, Math.cos(w + Math.PI)) + tuck * 100 + crouch * 70};
  const bob = walk * 16 * (1 - Math.abs(Math.sin(w))) + run * 40 * Math.abs(Math.sin(w)) - crouch * 70;
  const lean = run * 12 + crouch * 10 + walk * 2;
  const armA = walk * 22 + run * 55;
  const armNear = {sh: armA * Math.sin(w) - crouch * 30, el: walk * 18 + run * 85 + crouch * 30};
  const armFar = {sh: -armA * Math.sin(w), el: walk * 18 + run * 85};
  const drag = Math.max(-1, Math.min(1, pose.vel / 900));
  const sw = (i: number) => -drag * (14 + i * 3) + Math.sin(t * 9 + i * 0.8) * (2 + run * 5) - bob * 0.05;
  const hem = Math.sin(t * 11) * run * 6 - drag * 8;
  const expr = pose.expr ?? 'smile';
  const [browDy, browTilt] = browOf(expr);
  const scared = expr === 'scared' || expr === 'terrified';
  const m = pose.mouth ?? null;
  const legLen = TH + SH + 30;
  const hc = L.hairColor;
  const hh = L.hairHi;
  const girl = !L.boy;
  const fluffy = L.top === 'fluffyJacket' || L.top === 'fluffyHoodie';
  const hood = L.top === 'fluffyHoodie' || L.top === 'hoodie';
  const patterned = L.pattern === 'teddy' || L.pattern === 'hearts' || L.pattern === 'dino';
  const lid = pose.blink ?? 0;
  // ponytail / long hair swing (lags behind the head)
  const tailSwing = -drag * 40 + Math.sin(t * 7) * (6 + run * 14) + bob * 0.3;

  const backHair = (() => {
    switch (L.hair) {
      case 'longCurly': {
        let d = 'M -40 -190 Q -170 -190 -180 -60';
        for (let i = 0; i < 8; i++) {
          const yy = -40 + i * 70;
          const xx = -190 - i * 8 + tailSwing * (i / 8);
          d += ` Q ${xx - 34} ${yy + 20} ${xx + (i % 2 ? 8 : -6)} ${yy + 46}`;
        }
        d += ` Q ${-120 + tailSwing} 560 ${-60 + tailSwing * 0.6} 480 Q -40 300 -80 120 Q -60 0 -40 -190 Z`;
        return <path d={d} fill={`url(#${id}-hair)`} stroke={OUT} strokeWidth={5} strokeLinejoin="round" />;
      }
      case 'wavyShort':
        return (
          <path
            d={`M -40 -196 Q -170 -196 -184 -60 Q -196 40 ${-176 + tailSwing * 0.4} 130 Q ${-140 + tailSwing * 0.5} 170 ${-90 + tailSwing * 0.3} 140 Q -70 60 -60 -40 Z`}
            fill={`url(#${id}-hair)`}
            stroke={OUT}
            strokeWidth={5}
          />
        );
      case 'pulledBack':
        return (
          <g>
            <path
              d={`M -150 -110 Q ${-250 + tailSwing * 0.3} -120 ${-290 + tailSwing} 0 Q ${-300 + tailSwing * 1.2} 120 ${-250 + tailSwing * 1.3} 200 Q ${-250 + tailSwing} 80 ${-210 + tailSwing * 0.5} -30 Q -190 -80 -150 -80 Z`}
              fill={`url(#${id}-hair)`}
              stroke={OUT}
              strokeWidth={5}
            />
            <ellipse cx={-160} cy={-100} rx={22} ry={16} fill="#f05a8a" stroke={OUT} strokeWidth={4} />
          </g>
        );
      case 'messyBun':
        return (
          <g>
            <circle cx={-120 + sw(0) * 0.2} cy={-200} r={72} fill={`url(#${id}-hair)`} stroke={OUT} strokeWidth={5} />
            <path d="M -160 -224 Q -120 -260 -80 -224" stroke={hh} strokeWidth={6} fill="none" opacity={0.6} />
            <path d="M -90 -150 Q -70 -170 -60 -150" stroke="#f05a8a" strokeWidth={12} fill="none" strokeLinecap="round" />
          </g>
        );
      default:
        return null;
    }
  })();

  const capHair = (() => {
    if (L.hair === 'boyCurly')
      return (
        <>
          <path d="M -170 -60 Q -190 -190 -60 -220 Q 80 -240 150 -150 L 120 -100 Q 0 -150 -110 -40 L -150 60 Q -186 10 -170 -60 Z" fill={hc} stroke={OUT} strokeWidth={5} />
          {Array.from({length: 8}).map((_, i) => {
            const a = Math.PI * (1.0 + i * 0.13);
            return <circle key={i} cx={Math.cos(a) * 150 + 20 + sw(i) * (i / 8)} cy={Math.sin(a) * 160 - 60} r={50} fill={hc} stroke={OUT} strokeWidth={4} />;
          })}
          {[0, 1, 2].map((i) => (
            <circle key={`f${i}`} cx={60 + i * 34 + sw(i + 8) * 0.4} cy={-160 + i * 16} r={36} fill={hc} stroke={OUT} strokeWidth={4} />
          ))}
        </>
      );
    if (L.hair === 'boyQuiff')
      return (
        <>
          <path d="M -168 -30 Q -186 -180 -60 -214 Q 70 -236 150 -150 Q 120 -140 110 -120 Q 0 -150 -110 -40 L -150 40 Q -176 10 -168 -30 Z" fill={`url(#${id}-hair)`} stroke={OUT} strokeWidth={5} />
          <path d={`M 40 -206 Q ${130 + sw(1) * 0.5} -250 ${170 + sw(2) * 0.6} -170 Q 120 -190 60 -180 Z`} fill={hc} stroke={OUT} strokeWidth={4} />
          <path d="M -60 -200 Q 40 -230 120 -190" stroke={hh} strokeWidth={6} fill="none" opacity={0.7} />
          <path d="M -150 -10 L -156 50" stroke={mix(hc, L.skin, 0.5)} strokeWidth={14} strokeLinecap="round" />
        </>
      );
    // girls: smooth cap + fringe over the forehead
    return (
      <>
        <path
          d="M -172 -40 Q -186 -186 -50 -214 Q 90 -232 158 -140 Q 168 -110 150 -80 Q 120 -130 60 -140 Q -20 -150 -110 -70 L -150 30 Q -180 0 -172 -40 Z"
          fill={`url(#${id}-hair)`}
          stroke={OUT}
          strokeWidth={5}
          strokeLinejoin="round"
        />
        <path d="M -100 -190 Q 20 -224 130 -150" stroke={hh} strokeWidth={8} fill="none" opacity={0.6} strokeLinecap="round" />
        {L.hair === 'longCurly' ? (
          [0, 1, 2].map((i) => <path key={i} d={`M ${-150 + i * 30} ${-60 + i * 60} q -24 18 0 36 q 24 18 0 36`} stroke={hh} strokeWidth={6} fill="none" opacity={0.6} />)
        ) : L.hair === 'wavyShort' ? (
          <circle cx={60} cy={-180} r={16} fill="#ffb3cc" stroke={OUT} strokeWidth={4} />
        ) : null}
      </>
    );
  })();

  const torso = `M -82 -250 Q -96 -150 -88 ${20 + hem * 0.3} L 86 ${24 + hem} Q 96 -150 76 -250 Q 0 -276 -82 -250 Z`;

  return (
    <g transform={`translate(${x},${y}) scale(${s * facing},${s})`}>
      <defs>
        <PatternDefs id={id} look={L} />
        <linearGradient id={`${id}-hair`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor={mix(hc, hh, 0.45)} />
          <stop offset="0.5" stopColor={hc} />
          <stop offset="1" stopColor={mix(hc, '#000000', 0.3)} />
        </linearGradient>
      </defs>
      <ellipse cx={0} cy={4} rx={150 * (1 - Math.min(0.5, bob / 300))} ry={22} fill="#000" opacity={0.25} />
      <g transform={`translate(0,${-legLen - bob})`}>
        <g transform="translate(-12,0)">
          <Leg id={id} L={L} {...legFar} far />
        </g>
        <g transform={`rotate(${lean},0,0)`}>
          <g transform="translate(-8,-200)">
            <Arm id={id} L={L} {...armFar} far />
          </g>
          {rifleOnBack ? (
            <g transform="translate(-90,-120) rotate(28)">
              <rect x={-14} y={-820} width={18} height={590} rx={6} fill="#4a4f5a" stroke={OUT} strokeWidth={4} />
              <path d="M -24 -240 L 14 -240 L 22 -60 Q 0 -10 -30 -40 Z" fill="#8a5a32" stroke={OUT} strokeWidth={4} />
            </g>
          ) : null}
          {/* long hair hangs behind the body */}
          <g transform="translate(10,-472)">{L.hair === 'longCurly' || L.hair === 'wavyShort' ? backHair : null}</g>
          {/* hood */}
          {hood ? <path d="M -120 -250 Q -150 -320 -60 -330 Q 20 -320 30 -262 Z" fill={L.topShade} stroke={OUT} strokeWidth={5} /> : null}
          <path d={torso} fill={L.topColor} stroke={OUT} strokeWidth={5} strokeLinejoin="round" />
          {patterned ? <path d={torso} fill={`url(#${id}-pat)`} /> : null}
          {fluffy ? <path d={torso} fill="none" stroke={L.topShade} strokeWidth={8} strokeDasharray="3 14" strokeLinecap="round" /> : null}
          {L.pattern === 'deer' ? (
            <g transform="translate(40,-150) scale(0.9)">
              <path d="M -16 6 L -12 -6 L 6 -6 L 12 -16 L 18 -12 L 14 -4 L 16 6 L 12 6 L 10 0 L -6 0 L -8 6 Z" fill="#f4f4f4" />
            </g>
          ) : null}
          {L.top === 'fluffyJacket' ? [0, 1, 2].map((i) => <circle key={i} cx={70} cy={-200 + i * 60} r={7} fill="#fffef6" stroke={OUT} strokeWidth={3} />) : null}
          <path d={`M -86 ${18 + hem * 0.2} L 86 ${22 + hem * 0.6}`} stroke={L.top === 'tee' ? L.bottomColor : L.topShade} strokeWidth={L.top === 'tee' ? 22 : 14} />
          {/* head */}
          <g transform={`translate(10,-262) rotate(${-lean * 0.5 + Math.sin(w * 2) * (walk * 1.5 + run * 2.5)})`}>
            <path d="M -32 10 L -30 -40 L 34 -40 L 36 10 Z" fill={L.skinShade} stroke={OUT} strokeWidth={5} />
            <g transform="translate(0,-210)">
              {L.hair !== 'longCurly' && L.hair !== 'wavyShort' ? backHair : null}
              <path
                d="M -150 -20 Q -160 -170 0 -186 Q 150 -186 168 -60 Q 176 -20 170 10 L 188 40 Q 194 52 176 58 L 170 70 Q 174 110 150 132 Q 100 166 40 162 Q -60 156 -120 110 Q -160 60 -150 -20 Z"
                fill={L.skin}
                stroke={OUT}
                strokeWidth={5}
                strokeLinejoin="round"
              />
              <ellipse cx={-30} cy={30} rx={32} ry={44} fill={L.skin} stroke={OUT} strokeWidth={5} />
              <ellipse cx={108} cy={70} rx={36} ry={20} fill={L.blush} opacity={0.4} />
              {/* eye */}
              <g transform="translate(112,-4)">
                <path d={scared ? 'M -28 0 Q 6 -40 32 -2 Q 8 30 -28 0 Z' : 'M -26 0 Q 6 -30 30 -2 Q 8 22 -26 0 Z'} fill="#fff" stroke={OUT} strokeWidth={4} />
                <circle cx={8 + (pose.look ?? 1) * 6} cy={-2} r={scared ? 9 : 13} fill="#2a170d" />
                <circle cx={4 + (pose.look ?? 1) * 6} cy={-7} r={4.5} fill="#fff" />
                {lid > 0 ? <path d={`M -32 -34 L 36 -34 L 36 ${-34 + lid * 40} L -32 ${-34 + lid * 40} Z`} fill={L.skin} /> : null}
                <path d={scared ? 'M -30 -2 Q 4 -42 34 -4' : 'M -28 -2 Q 4 -32 32 -4'} stroke={OUT} strokeWidth={6} fill="none" strokeLinecap="round" />
                {girl ? <path d="M -26 -8 l -14 -12 M -18 -18 l -10 -16" stroke={OUT} strokeWidth={4} strokeLinecap="round" /> : null}
                <path d={`M -24 ${-52 + browDy} L 36 ${-52 + browDy + browTilt}`} stroke={hc} strokeWidth={girl ? 12 : 16} strokeLinecap="round" />
              </g>
              <g transform="translate(150,104)">
                {m !== null && m > 0.05 ? (
                  <ellipse cx={-4} cy={4} rx={12 + m * 8} ry={4 + m * 24} fill="#5a1620" stroke={OUT} strokeWidth={4} />
                ) : scared ? (
                  <ellipse cx={-6} cy={6} rx={12} ry={16} fill="#5a1620" stroke={OUT} strokeWidth={4} />
                ) : expr === 'laugh' || expr === 'happy' ? (
                  <path d="M -30 -2 Q -8 26 8 0 Z" fill="#5a1620" stroke={OUT} strokeWidth={4} strokeLinejoin="round" />
                ) : (
                  <path d="M -26 2 Q -8 12 6 2" stroke={OUT} strokeWidth={6} fill="none" strokeLinecap="round" />
                )}
              </g>
              {capHair}
              {pose.lamp !== undefined ? (
                <>
                  <path d="M -150 -70 Q 20 -130 160 -96" stroke="#2b2b33" strokeWidth={20} fill="none" />
                  <rect x={136} y={-130} width={56} height={44} rx={10} fill="#3a3a44" stroke={OUT} strokeWidth={4} />
                  <circle cx={186} cy={-108} r={15} fill={pose.lamp ? '#fff7c2' : '#8a8a94'} />
                </>
              ) : null}
            </g>
          </g>
          <g transform="translate(8,-200)">
            <Arm id={id} L={L} {...armNear} />
          </g>
        </g>
        <Leg id={id} L={L} {...legNear} />
      </g>
    </g>
  );
};
