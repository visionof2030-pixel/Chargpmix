import React from 'react';
import {rnd} from '../tl';

const OUT = '#2b1b26';

/* ------------------------------------------------------------------ cartoon adult (front view) */
export type AdultProps = {
  x: number;
  y: number;
  s?: number;
  t: number;
  kind: 'father' | 'thief';
  armL?: number;
  armR?: number;
  bendL?: number;
  bendR?: number;
  run?: number; // 0..1 running blend (legs + arms swing)
  tiptoe?: number; // sneaky crouch
  lean?: number;
  headTurn?: number; // -1 look left .. 1 look right
  expr?: 'neutral' | 'sneaky' | 'shock' | 'scared' | 'happy';
  prop?: React.ReactNode;
};

export const Adult: React.FC<AdultProps> = (p) => {
  const s = p.s ?? 1;
  const thief = p.kind === 'thief';
  const skin = thief ? '#c48e66' : '#cf9a70';
  const skinSh = thief ? '#a5714c' : '#b07a50';
  const run = p.run ?? 0;
  const tip = p.tiptoe ?? 0;
  const ph = p.t * (run > 0.5 ? 14 : 9);
  const legA = run * Math.sin(ph) * 30 + tip * Math.sin(p.t * 6) * 10;
  const bob = run * Math.abs(Math.sin(ph)) * 40 + tip * Math.abs(Math.sin(p.t * 6)) * 14 - tip * 60;
  const turn = p.headTurn ?? 0;
  const ex = p.expr ?? 'neutral';
  const top = thief ? '#7c7f88' : '#fbfbf7';
  const topSh = thief ? '#5e6168' : '#dcded6';
  const arm = (side: -1 | 1, raise: number, bend: number) => {
    const b = (bend * Math.PI) / 180;
    const hx = side * Math.sin(b) * 150;
    const hy = 170 + Math.cos(b) * 150;
    return (
      <g transform={`translate(${side * 130},-1180) rotate(${side * -raise})`}>
        <path d={`M 0 0 L 0 170 L ${hx} ${hy}`} stroke={OUT} strokeWidth={70} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d={`M 0 0 L 0 170 L ${hx} ${hy}`} stroke={top} strokeWidth={58} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={hx} cy={hy} r={32} fill={skin} stroke={OUT} strokeWidth={5} />
        {side === 1 && p.prop ? <g transform={`translate(${hx},${hy}) rotate(${side * raise})`}>{p.prop}</g> : null}
      </g>
    );
  };
  const swing = run * Math.sin(ph) * 45;
  return (
    <g transform={`translate(${p.x},${p.y}) scale(${s})`}>
      <ellipse cx={0} cy={6} rx={190} ry={26} fill="#000" opacity={0.25} />
      <g transform={`translate(0,${-bob}) rotate(${p.lean ?? 0})`}>
        {/* legs */}
        {[-1, 1].map((side) => (
          <g key={side} transform={`rotate(${side * legA},${side * 60},-640)`}>
            {thief ? (
              <>
                <path d={`M ${side * 60} -640 L ${side * 64} -60`} stroke={OUT} strokeWidth={86} strokeLinecap="round" />
                <path d={`M ${side * 60} -640 L ${side * 64} -60`} stroke="#2e3646" strokeWidth={74} strokeLinecap="round" />
              </>
            ) : null}
            <path d={`M ${side * 68 - 48} -18 Q ${side * 68 - 52} -64 ${side * 68 - 10} -64 L ${side * 68 + 30} -60 Q ${side * 68 + 70} -50 ${side * 68 + 66} -10 Q ${side * 68 + 64} 12 ${side * 68 + 30} 12 L ${side * 68 - 40} 12 Q ${side * 68 - 54} 10 ${side * 68 - 48} -18 Z`} fill={thief ? '#e8e8ec' : '#8a5a32'} stroke={OUT} strokeWidth={5} />
          </g>
        ))}
        {/* body */}
        {thief ? (
          <path d="M -150 -1200 Q -170 -1150 -160 -980 L -150 -620 Q 0 -600 150 -620 L 160 -980 Q 170 -1150 150 -1200 Q 0 -1230 -150 -1200 Z" fill={top} stroke={OUT} strokeWidth={6} />
        ) : (
          <path d={`M -150 -1200 Q -170 -1150 -164 -980 Q -190 -500 ${-200 + run * Math.sin(ph) * 20} -40 Q 0 -20 ${200 + run * Math.sin(ph) * 20} -40 Q 190 -500 164 -980 Q 170 -1150 150 -1200 Q 0 -1230 -150 -1200 Z`} fill={top} stroke={OUT} strokeWidth={6} />
        )}
        {thief ? (
          <>
            <path d="M -110 -820 L 110 -820 L 100 -720 L -100 -720 Z" fill={topSh} stroke={OUT} strokeWidth={4} />
            <path d="M -40 -1196 L -46 -1080 M 40 -1196 L 46 -1080" stroke="#e8e8ec" strokeWidth={8} />
          </>
        ) : (
          <>
            <path d="M 0 -1196 L 0 -960" stroke={topSh} strokeWidth={6} />
            <rect x={50} y={-1120} width={70} height={74} rx={8} fill="none" stroke={topSh} strokeWidth={5} />
          </>
        )}
        {arm(-1, (p.armL ?? 8) + swing, p.bendL ?? 10)}
        {arm(1, (p.armR ?? 8) - swing, p.bendR ?? 10)}
        {/* neck + head */}
        <rect x={-40} y={-1290} width={80} height={100} fill={skinSh} stroke={OUT} strokeWidth={5} />
        <g transform={`translate(${turn * 14},0)`}>
          <ellipse cx={0} cy={-1420} rx={150} ry={170} fill={skin} stroke={OUT} strokeWidth={6} />
          {/* hair / cap */}
          {thief ? (
            <>
              <path d="M -156 -1440 Q -150 -1610 0 -1616 Q 150 -1610 156 -1440 Q 0 -1490 -156 -1440 Z" fill="#23232a" stroke={OUT} strokeWidth={6} />
              <path d={`M ${turn >= 0 ? 60 : -260} -1450 L ${turn >= 0 ? 260 : -60} -1446 Q ${turn >= 0 ? 260 : -260} -1420 ${turn >= 0 ? 140 : -140} -1420 Z`} fill="#23232a" stroke={OUT} strokeWidth={5} />
              <path d="M -150 -1330 Q -60 -1290 0 -1290 Q 60 -1290 150 -1330" fill="none" stroke="#6b5a50" strokeWidth={10} opacity={0.5} />
            </>
          ) : (
            <>
              <path d="M -150 -1440 Q -150 -1600 0 -1600 Q 150 -1600 150 -1440 Q 120 -1520 0 -1520 Q -120 -1520 -150 -1440 Z" fill="#1a1410" stroke={OUT} strokeWidth={5} />
              <path d="M -140 -1400 Q -120 -1260 0 -1250 Q 120 -1260 140 -1400 Q 110 -1320 0 -1316 Q -110 -1320 -140 -1400 Z" fill="#1a1410" />
            </>
          )}
          {/* eyes */}
          {[-1, 1].map((side) => (
            <g key={side} transform={`translate(${side * 56 + turn * 20},-1430)`}>
              <ellipse rx={ex === 'shock' || ex === 'scared' ? 26 : 20} ry={ex === 'shock' || ex === 'scared' ? 30 : ex === 'sneaky' ? 10 : 22} fill="#fff" stroke={OUT} strokeWidth={4} />
              <circle cx={turn * 10} cy={2} r={ex === 'shock' || ex === 'scared' ? 8 : 11} fill="#1a0f0a" />
              <path d={`M -28 ${ex === 'sneaky' ? -18 : ex === 'shock' ? -46 : -34} L 28 ${ex === 'sneaky' ? -10 : ex === 'shock' ? -46 : -34}`} stroke="#1a1410" strokeWidth={12} strokeLinecap="round" transform={side === 1 ? 'scale(-1,1)' : undefined} />
            </g>
          ))}
          <path d={`M ${turn * 30 - 6} -1400 Q ${turn * 30 + 6} -1370 ${turn * 30 - 10} -1360`} stroke={skinSh} strokeWidth={7} fill="none" />
          {/* mouth */}
          {ex === 'shock' || ex === 'scared' ? (
            <ellipse cx={turn * 20} cy={-1316} rx={22} ry={30} fill="#5a1620" stroke={OUT} strokeWidth={4} />
          ) : ex === 'happy' ? (
            <path d={`M ${turn * 20 - 50} -1330 Q ${turn * 20} -1276 ${turn * 20 + 50} -1330 Z`} fill="#5a1620" stroke={OUT} strokeWidth={4} />
          ) : ex === 'sneaky' ? (
            <path d={`M ${turn * 20 - 40} -1318 Q ${turn * 20} -1330 ${turn * 20 + 46} -1312`} stroke={OUT} strokeWidth={7} fill="none" strokeLinecap="round" />
          ) : (
            <path d={`M ${turn * 20 - 40} -1320 Q ${turn * 20} -1300 ${turn * 20 + 40} -1320`} stroke={OUT} strokeWidth={7} fill="none" strokeLinecap="round" />
          )}
          {ex === 'scared' || ex === 'shock' ? <path d="M 150 -1560 q 14 26 0 36 q -14 -10 0 -36 z" fill="#cfeaff" stroke="#4a9be0" strokeWidth={3} /> : null}
        </g>
      </g>
    </g>
  );
};

/* ------------------------------------------------------------------ dad's white car (side view) */
export const Car: React.FC<{x: number; y: number; s?: number; shake?: number}> = ({x, y, s = 1, shake = 0}) => (
  <g transform={`translate(${x + shake},${y}) scale(${s})`}>
    <ellipse cx={0} cy={6} rx={560} ry={34} fill="#000" opacity={0.25} />
    <path d="M -540 -120 Q -540 -230 -440 -250 L -260 -270 Q -180 -420 -40 -430 L 200 -430 Q 300 -420 380 -280 L 500 -262 Q 560 -250 560 -170 L 560 -110 Q 560 -90 530 -90 L -510 -90 Q -540 -90 -540 -120 Z" fill="#f4f6f8" stroke={OUT} strokeWidth={7} strokeLinejoin="round" />
    <path d="M -230 -280 Q -160 -400 -40 -406 L 60 -406 L 60 -280 Z" fill="#9fc6d6" stroke={OUT} strokeWidth={6} />
    <path d="M 90 -406 L 200 -406 Q 280 -396 340 -280 L 90 -280 Z" fill="#9fc6d6" stroke={OUT} strokeWidth={6} />
    <path d="M -200 -300 L -120 -390 M 120 -390 L 180 -310" stroke="#fff" strokeWidth={14} opacity={0.6} />
    <path d="M 75 -280 L 75 -100 M -240 -270 L -240 -110" stroke="#c9ced6" strokeWidth={5} />
    {/* door handles + the lock the thief picks */}
    <rect x={-40} y={-240} width={60} height={14} rx={7} fill="#aeb4be" stroke={OUT} strokeWidth={3} />
    <rect x={160} y={-240} width={60} height={14} rx={7} fill="#aeb4be" stroke={OUT} strokeWidth={3} />
    <circle cx={34} cy={-233} r={7} fill="#6b7280" />
    <rect x={510} y={-230} width={50} height={36} rx={8} fill="#ffe9a8" stroke={OUT} strokeWidth={4} />
    <rect x={-540} y={-225} width={30} height={40} rx={6} fill="#e64a4a" stroke={OUT} strokeWidth={4} />
    {[-330, 340].map((cx) => (
      <g key={cx} transform={`translate(${cx},-90)`}>
        <circle r={96} fill="#1c1c20" stroke={OUT} strokeWidth={6} />
        <circle r={54} fill="#c9ced6" stroke={OUT} strokeWidth={5} />
        <circle r={14} fill="#6b7280" />
      </g>
    ))}
  </g>
);

/* ------------------------------------------------------------------ toy megaphone (held in a hand) */
export const Megaphone: React.FC<{flash?: number}> = ({flash = 0}) => (
  <g transform="rotate(-80) translate(10,-10)">
    <rect x={-14} y={-10} width={40} height={60} rx={10} fill="#f5c518" stroke={OUT} strokeWidth={4} />
    <path d="M 20 -10 L 150 -60 L 150 100 L 20 50 Z" fill="#e63946" stroke={OUT} strokeWidth={5} strokeLinejoin="round" />
    <ellipse cx={150} cy={20} rx={16} ry={80} fill="#ff6b6b" stroke={OUT} strokeWidth={4} />
    <circle cx={6} cy={20} r={9} fill={flash > 0.5 ? '#3b82f6' : '#ef4444'} stroke={OUT} strokeWidth={3} />
    {flash > 0 ? <circle cx={170} cy={20} r={120} fill={Math.sin(flash * 20) > 0 ? '#ff3b3b' : '#3b82f6'} opacity={0.25} /> : null}
  </g>
);

/* ------------------------------------------------------------------ the house front + street */
export const Street: React.FC<{t: number; windowOpen: number; doorOpen: number}> = ({t, windowOpen, doorOpen}) => (
  <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
    <defs>
      <linearGradient id="az-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#8fd0ff" />
        <stop offset="1" stopColor="#dff3ff" />
      </linearGradient>
      <linearGradient id="az-wall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f1dfbf" />
        <stop offset="1" stopColor="#e3c89c" />
      </linearGradient>
      <linearGradient id="az-glass" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#cfe9f5" />
        <stop offset="1" stopColor="#9cc8dc" />
      </linearGradient>
    </defs>
    <rect width={1080} height={1920} fill="url(#az-sky)" />
    <circle cx={880} cy={160} r={90} fill="#fff6c2" opacity={0.9} />
    {[0, 1, 2].map((i) => (
      <path key={i} d={`M ${((t * 12 + i * 380) % 1300) - 200} ${120 + i * 60} q 20 -14 40 0 q 20 -14 40 0`} stroke="#3a3a44" strokeWidth={4} fill="none" />
    ))}
    {/* house facade */}
    <rect x={0} y={280} width={1080} height={1000} fill="url(#az-wall)" />
    <rect x={0} y={262} width={1080} height={30} fill="#f6e8cc" stroke={OUT} strokeWidth={4} />
    {Array.from({length: 10}).map((_, i) => (
      <rect key={i} x={i * 110 - 20} y={250} width={60} height={26} fill="#f6e8cc" stroke={OUT} strokeWidth={3} />
    ))}
    {/* AC unit */}
    <rect x={720} y={360} width={190} height={120} rx={10} fill="#e9e6dc" stroke={OUT} strokeWidth={5} />
    {Array.from({length: 6}).map((_, i) => (
      <line key={i} x1={740} y1={380 + i * 16} x2={890} y2={380 + i * 16} stroke="#b9b4a6" strokeWidth={4} />
    ))}
    {/* the majlis window (Azzam looks out of it) */}
    <rect x={110} y={420} width={420} height={420} rx={14} fill="#5b3a26" stroke={OUT} strokeWidth={7} />
    <rect x={136} y={446} width={368} height={368} fill="#3a2a2a" />
    {/* sliding pane */}
    <g transform={`translate(${-windowOpen * 170},0)`}>
      <rect x={322} y={446} width={182} height={368} fill="url(#az-glass)" opacity={0.85} stroke="#5b3a26" strokeWidth={8} />
      <path d="M 350 470 L 410 470 L 340 600 Z" fill="#fff" opacity={0.45} />
    </g>
    {/* front door */}
    <rect x={640} y={820} width={300} height={460} fill="#3a2a22" stroke={OUT} strokeWidth={7} />
    <g transform={`translate(640,0) scale(${1 - doorOpen * 0.85},1)`}>
      <rect x={0} y={820} width={300} height={460} fill="#8a5a32" stroke={OUT} strokeWidth={6} />
      <rect x={30} y={850} width={240} height={180} rx={8} fill="none" stroke="#6b4426" strokeWidth={6} />
      <rect x={30} y={1060} width={240} height={190} rx={8} fill="none" stroke="#6b4426" strokeWidth={6} />
      <circle cx={260} cy={1050} r={14} fill="#f0cc5a" stroke={OUT} strokeWidth={3} />
    </g>
    <rect x={620} y={800} width={340} height={26} fill="#f6e8cc" stroke={OUT} strokeWidth={4} />
    {/* plants */}
    {[80, 1000].map((x, i) => (
      <g key={i} transform={`translate(${x},1280)`}>
        <path d="M 0 0 Q -50 -90 -20 -160 M 0 0 Q 10 -110 40 -170 M 0 0 Q 60 -80 70 -120" stroke="#3f9d55" strokeWidth={20} strokeLinecap="round" fill="none" />
        <path d="M -40 0 L 40 0 L 30 70 L -30 70 Z" fill="#c9733e" stroke={OUT} strokeWidth={4} />
      </g>
    ))}
    {/* sidewalk + street */}
    <rect x={0} y={1280} width={1080} height={110} fill="#d8d2c8" />
    {Array.from({length: 10}).map((_, i) => (
      <line key={i} x1={i * 120} y1={1280} x2={i * 120} y2={1390} stroke="#bdb6aa" strokeWidth={4} />
    ))}
    <rect x={0} y={1390} width={1080} height={20} fill="#9a958c" />
    <rect x={0} y={1410} width={1080} height={510} fill="#4a4d55" />
    {Array.from({length: 6}).map((_, i) => (
      <rect key={i} x={i * 220 + 20} y={1780} width={120} height={18} rx={4} fill="#f2f2f2" opacity={0.8} />
    ))}
    {Array.from({length: 20}).map((_, i) => (
      <circle key={i} cx={rnd(i) * 1080} cy={1430 + rnd(i + 4) * 480} r={3} fill="#5c606a" />
    ))}
  </svg>
);
