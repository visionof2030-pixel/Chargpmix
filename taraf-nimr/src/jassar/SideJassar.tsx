import React from 'react';
import {LOOKS, mix} from '../Kid';

const OUT = '#2b1b26';
const L = LOOKS.jassar;
const SKIN = L.skin;
const SKIN_SH = L.skinShade;
const HAIR = L.hairColor;
const HAIR_HI = L.hairHi;
const SHIRT = L.topColor;
const JEANS = L.bottomColor;
const JEANS_SH = L.bottomShade;

export type SidePose = {
  phase: number; // 0..1 cycle phase
  walk: number; // 0..1 blend of walk cycle
  run: number; // 0..1 blend of run cycle
  crouch?: number; // anticipation squash 0..1
  tuck?: number; // knees tucked mid-jump 0..1
  t: number; // seconds (secondary motion)
  vel: number; // px/s (hair & shirt drag)
  mouth?: number | null;
  bright?: number; // mouth shape: 0 round .. 1 wide
  brow?: 'calm' | 'alert' | 'worried' | 'determined';
  look?: number; // pupil -1 back .. 1 forward
  blink?: number;
  lamp?: number; // 0..1 headlamp on
};

const rad = (d: number) => (d * Math.PI) / 180;
const TH = 190;
const SH = 190;
const UA = 120;
const FA = 112;

/** leg chain: hip at origin, returns svg group */
const Leg: React.FC<{thigh: number; knee: number; far?: boolean}> = ({thigh, knee, far}) => {
  const kx = -Math.sin(rad(thigh)) * TH;
  const ky = Math.cos(rad(thigh)) * TH;
  const a2 = thigh + knee;
  const ax = kx - Math.sin(rad(a2)) * SH;
  const ay = ky + Math.cos(rad(a2)) * SH;
  const col = far ? mix(JEANS, '#000000', 0.22) : JEANS;
  const foot = -(a2) * 0.85;
  return (
    <g>
      <path d={`M 0 0 L ${kx} ${ky} L ${ax} ${ay}`} fill="none" stroke={OUT} strokeWidth={84} strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M 0 0 L ${kx} ${ky} L ${ax} ${ay}`} fill="none" stroke={col} strokeWidth={72} strokeLinecap="round" strokeLinejoin="round" />
      {!far ? <path d={`M ${kx * 0.3} ${ky * 0.3} L ${kx} ${ky}`} stroke={JEANS_SH} strokeWidth={6} opacity={0.6} /> : null}
      <g transform={`translate(${ax},${ay}) rotate(${foot})`}>
        <path d="M -40 -6 Q -46 -44 -10 -46 L 40 -40 Q 96 -30 104 4 Q 106 22 84 24 L -34 24 Q -48 22 -40 -6 Z" fill={far ? '#cfd8e6' : '#eef3fb'} stroke={OUT} strokeWidth={5} />
        <path d="M -42 14 L 104 14" stroke="#9fb8dc" strokeWidth={12} />
        <path d="M 8 -36 l 16 10 M 26 -36 l 16 10" stroke="#7c93b8" strokeWidth={4} strokeLinecap="round" />
        <path d="M -44 -30 L 22 -30" stroke={mix(col, '#000', 0.1)} strokeWidth={26} strokeLinecap="round" />
      </g>
    </g>
  );
};

const Arm: React.FC<{sh: number; el: number; far?: boolean; children?: React.ReactNode}> = ({sh, el, far, children}) => {
  const ex = -Math.sin(rad(sh)) * UA;
  const ey = Math.cos(rad(sh)) * UA;
  const a2 = sh - el; // elbow bends forward
  const hx = ex - Math.sin(rad(a2)) * FA;
  const hy = ey + Math.cos(rad(a2)) * FA;
  const skin = far ? SKIN_SH : SKIN;
  return (
    <g>
      <path d={`M 0 0 L ${ex} ${ey} L ${hx} ${hy}`} fill="none" stroke={OUT} strokeWidth={56} strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M 0 0 L ${ex} ${ey} L ${hx} ${hy}`} fill="none" stroke={skin} strokeWidth={44} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hx} cy={hy} r={28} fill={skin} stroke={OUT} strokeWidth={5} />
      <g transform={`rotate(${sh})`}>
        <path d="M -38 -18 Q 0 -34 38 -18 L 36 66 Q 0 76 -36 66 Z" fill={far ? mix(SHIRT, '#000', 0.3) : SHIRT} stroke={OUT} strokeWidth={5} strokeLinejoin="round" />
      </g>
      {children ? <g transform={`translate(${hx},${hy}) rotate(${a2})`}>{children}</g> : null}
    </g>
  );
};

export const SideJassar: React.FC<{x: number; y: number; s: number; pose: SidePose; rifleOnBack?: boolean; flip?: boolean}> = ({x, y, s, pose, rifleOnBack = true}) => {
  const {phase: p, walk, run, t} = pose;
  const crouch = pose.crouch ?? 0;
  const tuck = pose.tuck ?? 0;
  const w = Math.PI * 2 * p;
  // --- legs
  const thighA = walk * 24 + run * 52;
  const kneeB = walk * 42 + run * 105;
  const legNear = {
    thigh: -thighA * Math.sin(w) - tuck * 70 - crouch * 30,
    knee: 6 + kneeB * Math.max(0, Math.cos(w)) * (run ? 1 : 0.9) + tuck * 110 + crouch * 70,
  };
  const legFar = {
    thigh: -thighA * Math.sin(w + Math.PI) - tuck * 50 - crouch * 30,
    knee: 6 + kneeB * Math.max(0, Math.cos(w + Math.PI)) + tuck * 100 + crouch * 70,
  };
  // vertical: lowest at contact, highest at passing (walk) / in flight (run)
  const bob = walk * 16 * (1 - Math.abs(Math.sin(w))) + run * 40 * Math.abs(Math.sin(w)) - crouch * 70;
  const lean = run * 12 + crouch * 10 + walk * 2;
  // --- arms (opposite to legs)
  const armA = walk * 22 + run * 55;
  const armNear = {sh: armA * Math.sin(w) * 1 + crouch * -30, el: walk * 18 + run * 85 + crouch * 30};
  const armFar = {sh: -armA * Math.sin(w), el: walk * 18 + run * 85};
  // --- secondary
  const drag = Math.max(-1, Math.min(1, pose.vel / 900));
  const curlSway = (i: number) => -drag * (14 + i * 3) + Math.sin(t * 9 + i * 0.8) * (2 + run * 5) - bob * 0.05;
  const hem = Math.sin(t * 11) * run * 6 - drag * 8;
  const lid = pose.blink ?? 0;
  const brow = pose.brow ?? 'calm';
  const browDy = brow === 'alert' ? -18 : brow === 'worried' ? -10 : brow === 'determined' ? 10 : 0;
  const browTilt = brow === 'worried' ? 12 : brow === 'determined' ? -14 : 0;
  const m = pose.mouth ?? null;
  const br = pose.bright ?? 0.5;
  const legLen = TH + SH + 30;

  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <ellipse cx={0} cy={4} rx={150 * (1 - Math.min(0.5, bob / 300))} ry={22} fill="#000" opacity={0.25} />
      <g transform={`translate(0,${-legLen - bob})`}>
        {/* far limbs */}
        <g transform="translate(-12,0)">
          <Leg {...legFar} far />
        </g>
        <g transform={`rotate(${lean},0,0)`}>
          <g transform="translate(-8,-200)">
            <Arm {...armFar} far />
          </g>
          {/* rifle slung on the back */}
          {rifleOnBack ? (
            <g transform="translate(-90,-120) rotate(28)">
              <rect x={-14} y={-820} width={18} height={590} rx={6} fill="#4a4f5a" stroke={OUT} strokeWidth={4} />
              <rect x={-20} y={-560} width={30} height={60} rx={6} fill="#2b2f38" stroke={OUT} strokeWidth={3} />
              <path d="M -24 -240 L 14 -240 L 22 -60 Q 0 -10 -30 -40 Z" fill="#8a5a32" stroke={OUT} strokeWidth={4} />
            </g>
          ) : null}
          {/* torso */}
          <path
            d={`M -82 -250 Q -96 -150 -88 ${20 + hem * 0.3} L 86 ${24 + hem} Q 96 -150 76 -250 Q 0 -276 -82 -250 Z`}
            fill={SHIRT}
            stroke={OUT}
            strokeWidth={5}
            strokeLinejoin="round"
          />
          <path d="M 10 -246 Q 40 -226 70 -246" stroke="#2c2d33" strokeWidth={8} fill="none" />
          {rifleOnBack ? <path d="M 60 -236 L -84 10" stroke="#5a3a22" strokeWidth={12} strokeLinecap="round" /> : null}
          <g transform="translate(40,-150) scale(0.9)">
            <path d="M -16 6 L -12 -6 L 6 -6 L 12 -16 L 18 -12 L 14 -4 L 16 6 L 12 6 L 10 0 L -6 0 L -8 6 Z" fill="#f4f4f4" />
          </g>
          {/* belt line */}
          <path d={`M -86 ${18 + hem * 0.2} L 86 ${22 + hem * 0.6}`} stroke={JEANS} strokeWidth={22} />
          {/* neck + head */}
          <g transform={`translate(10,-262) rotate(${-lean * 0.5 + Math.sin(w * 2) * (walk * 1.5 + run * 2.5)})`}>
            <path d="M -32 10 L -30 -40 L 34 -40 L 36 10 Z" fill={SKIN_SH} stroke={OUT} strokeWidth={5} />
            <g transform="translate(0,-210)">
              {/* back of hair */}
              <path d="M -170 -60 Q -190 -190 -60 -220 Q 80 -240 150 -150 L 120 -100 Q 0 -150 -110 -40 L -150 60 Q -186 10 -170 -60 Z" fill={HAIR} stroke={OUT} strokeWidth={5} />
              {/* head */}
              <path
                d="M -150 -20 Q -160 -170 0 -186 Q 150 -186 168 -60 Q 176 -20 170 10 L 190 40 Q 196 52 178 58 L 172 70 Q 176 110 150 132 Q 100 170 40 166 Q -60 160 -120 110 Q -160 60 -150 -20 Z"
                fill={SKIN}
                stroke={OUT}
                strokeWidth={5}
                strokeLinejoin="round"
              />
              <ellipse cx={-30} cy={30} rx={34} ry={46} fill={SKIN} stroke={OUT} strokeWidth={5} />
              <path d="M -40 14 q 16 10 4 30" stroke={SKIN_SH} strokeWidth={6} fill="none" />
              <ellipse cx={110} cy={70} rx={36} ry={20} fill="#ee8c80" opacity={0.35} />
              {/* eye */}
              <g transform="translate(112,-4)">
                <path d="M -26 0 Q 6 -30 30 -2 Q 8 22 -26 0 Z" fill="#fff" stroke={OUT} strokeWidth={4} />
                <circle cx={8 + (pose.look ?? 1) * 6} cy={-2} r={13} fill="#2a170d" />
                <circle cx={4 + (pose.look ?? 1) * 6} cy={-7} r={4.5} fill="#fff" />
                {lid > 0 ? <path d={`M -30 -30 L 34 -30 L 34 ${-30 + lid * 34} L -30 ${-30 + lid * 34} Z`} fill={SKIN} /> : null}
                <path d="M -28 -2 Q 4 -32 32 -4" stroke={OUT} strokeWidth={6} fill="none" strokeLinecap="round" />
                <path d={`M -24 ${-50 + browDy} L 36 ${-50 + browDy + browTilt}`} stroke={HAIR} strokeWidth={16} strokeLinecap="round" />
              </g>
              {/* nose bump is in the head outline; mouth */}
              <g transform="translate(150,104)">
                {m !== null && m > 0.05 ? (
                  <g>
                    <ellipse cx={-4} cy={4} rx={8 + br * 14} ry={4 + m * 26 * (1 - br * 0.35)} fill="#5a1620" stroke={OUT} strokeWidth={4} />
                    <path d={`M ${-8 - br * 10} ${4 - m * 20} L ${4 + br * 6} ${4 - m * 20}`} stroke="#fff" strokeWidth={5} opacity={m > 0.3 ? 1 : 0} />
                  </g>
                ) : (
                  <path d={brow === 'worried' ? 'M -26 8 Q -10 0 4 6' : brow === 'determined' ? 'M -26 4 L 6 2' : 'M -26 2 Q -8 12 6 2'} stroke={OUT} strokeWidth={6} fill="none" strokeLinecap="round" />
                )}
              </g>
              {/* front curls + hair top */}
              {Array.from({length: 8}).map((_, i) => {
                const a = Math.PI * (1.0 + i * 0.13);
                const cx = Math.cos(a) * 150 + 20 + curlSway(i) * (i / 8);
                const cy = Math.sin(a) * 160 - 60;
                return <circle key={i} cx={cx} cy={cy} r={50} fill={HAIR} stroke={OUT} strokeWidth={4} />;
              })}
              {[0, 1, 2].map((i) => (
                <circle key={`f${i}`} cx={60 + i * 34 + curlSway(i + 8) * 0.4} cy={-160 + i * 16} r={36} fill={HAIR} stroke={OUT} strokeWidth={4} />
              ))}
              {[0, 1, 2, 3].map((i) => (
                <path key={`h${i}`} d={`M ${-120 + i * 50} ${-170 + Math.abs(i - 1.5) * 10} q 16 -18 32 0`} stroke={HAIR_HI} strokeWidth={6} fill="none" strokeLinecap="round" />
              ))}
              {/* headlamp */}
              <path d="M -150 -70 Q 20 -130 160 -96" stroke="#2b2b33" strokeWidth={20} fill="none" />
              <rect x={136} y={-130} width={56} height={44} rx={10} fill="#3a3a44" stroke={OUT} strokeWidth={4} />
              <circle cx={186} cy={-108} r={15} fill={pose.lamp ? '#fff7c2' : '#8a8a94'} />
              {pose.lamp ? <circle cx={186} cy={-108} r={46} fill="#fff7c2" opacity={0.35 * pose.lamp} /> : null}
            </g>
          </g>
          <g transform="translate(8,-200)">
            <Arm {...armNear} />
          </g>
        </g>
        {/* near leg in front */}
        <Leg {...legNear} />
      </g>
    </g>
  );
};
