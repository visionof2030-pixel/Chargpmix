import React from 'react';
import {H, W, rnd} from './tl';
import {Jeep} from './Jeep';

const OUT = '#2b1b16';

/* ------------------------------------------------------------------ grandpa's yard */
export const YardBG: React.FC<{t: number; night?: number; gateOpen?: number; barrelFall?: number}> = ({t, night = 0, gateOpen = 0.35, barrelFall = 0}) => {
  const n = night;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
      <defs>
        <linearGradient id="ysky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={n > 0.5 ? '#0b1030' : '#ffcf8f'} />
          <stop offset="1" stopColor={n > 0.5 ? '#263068' : '#fff0d2'} />
        </linearGradient>
        <linearGradient id="ywall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e3c595" />
          <stop offset="1" stopColor="#c9a46e" />
        </linearGradient>
        <linearGradient id="yground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d9b483" />
          <stop offset="1" stopColor="#c39462" />
        </linearGradient>
        <linearGradient id="outside" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={n > 0.5 ? '#1a2050' : '#ffc27a'} />
          <stop offset="1" stopColor={n > 0.5 ? '#2a2440' : '#e9a865'} />
        </linearGradient>
        <radialGradient id="lampG" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffe7a0" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ffe7a0" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill="url(#ysky)" />
      {n > 0.5
        ? Array.from({length: 40}).map((_, i) => <circle key={i} cx={rnd(i) * W} cy={rnd(i + 5) * 800} r={1.5 + rnd(i + 2) * 2.5} fill="#fff" opacity={0.4 + 0.5 * Math.abs(Math.sin(t + i))} />)
        : <circle cx={820} cy={420} r={110} fill="#fff1c2" opacity={0.85} />}
      {/* far mountains */}
      <path d="M 0 900 L 140 700 L 260 820 L 420 620 L 600 860 L 760 680 L 920 840 L 1080 700 L 1080 900 Z" fill={n > 0.5 ? '#1c2148' : '#c98e62'} opacity={0.75} />
      {/* palm tree */}
      <g transform="translate(110,0)">
        <path d="M 0 1270 Q -20 900 30 560" stroke="#7a5532" strokeWidth={46} fill="none" strokeLinecap="round" />
        {Array.from({length: 9}).map((_, i) => (
          <line key={i} x1={-20 + i * 4} y1={1240 - i * 76} x2={22 + i * 4} y2={1232 - i * 76} stroke="#5e3f22" strokeWidth={6} />
        ))}
        {[-150, -100, -40, 20, 80, 140, 190].map((a, i) => (
          <path
            key={i}
            transform={`translate(30,560) rotate(${a + Math.sin(t * 1.2 + i) * 3})`}
            d="M 0 0 Q 120 -60 240 30 Q 130 -10 0 12 Z"
            fill={i % 2 ? '#3f8a3a' : '#2f7330'}
            stroke={OUT}
            strokeWidth={4}
          />
        ))}
      </g>
      {/* back wall */}
      <rect x={0} y={880} width={W} height={400} fill="url(#ywall)" />
      <rect x={0} y={868} width={W} height={26} fill="#ecd3a8" stroke={OUT} strokeWidth={3} />
      {Array.from({length: 18}).map((_, i) => (
        <rect key={i} x={(i % 6) * 190 + ((Math.floor(i / 6) % 2) * 95) - 40} y={920 + Math.floor(i / 6) * 110} width={170} height={90} rx={6} fill="none" stroke="#c09862" strokeWidth={3} opacity={0.6} />
      ))}
      {/* laundry line */}
      <path d="M 40 780 Q 330 840 640 800" stroke="#6b5a4a" strokeWidth={4} fill="none" />
      {[
        {x: 140, c: '#ff8fb4', w: 90},
        {x: 280, c: '#7cc4f2', w: 110},
        {x: 440, c: '#ffd166', w: 80},
      ].map((c, i) => (
        <path key={i} transform={`translate(${c.x},${800 + i * 4}) rotate(${Math.sin(t * 2 + i) * 4})`} d={`M ${-c.w / 2} 0 L ${c.w / 2} 0 L ${c.w / 2 - 6} 120 L ${-c.w / 2 + 6} 120 Z`} fill={c.c} stroke={OUT} strokeWidth={4} />
      ))}
      {/* gate (right) */}
      <rect x={850} y={880} width={230} height={400} fill="url(#outside)" />
      <path d="M 850 1280 L 1080 1280 L 1080 1100 Q 960 1060 850 1120 Z" fill={n > 0.5 ? '#1c1a30' : '#c98e62'} opacity={0.6} />
      <g transform={`translate(1060,880) scale(${1 - gateOpen},1)`}>
        <rect x={-210} y={0} width={210} height={400} fill="#2f5a4a" stroke={OUT} strokeWidth={6} />
        {Array.from({length: 7}).map((_, i) => (
          <rect key={i} x={-200 + i * 30} y={10} width={10} height={380} fill="#24463a" />
        ))}
        <rect x={-210} y={180} width={210} height={14} fill="#24463a" />
      </g>
      <rect x={838} y={860} width={26} height={430} fill="#b48a5a" stroke={OUT} strokeWidth={4} />
      {/* shade sail + jeep */}
      <path d="M 230 1000 L 790 960 L 770 1010 L 250 1050 Z" fill="#e0b062" stroke={OUT} strokeWidth={4} />
      <line x1={250} y1={1050} x2={250} y2={1300} stroke="#6b5a4a" strokeWidth={10} />
      <line x1={770} y1={1010} x2={770} y2={1300} stroke="#6b5a4a" strokeWidth={10} />
      <Jeep x={510} y={1300} s={0.5} dusk={n} />
      {/* lamp on the wall */}
      {n > 0 ? <circle cx={700} cy={920} r={220} fill="url(#lampG)" opacity={n} /> : null}
      <rect x={690} y={900} width={22} height={34} rx={6} fill="#ffe7a0" stroke={OUT} strokeWidth={3} />
      {/* ground */}
      <rect x={0} y={1280} width={W} height={H - 1280} fill="url(#yground)" />
      {Array.from({length: 40}).map((_, i) => (
        <ellipse key={i} cx={rnd(i + 9) * W} cy={1300 + rnd(i + 3) * 600} rx={6 + rnd(i) * 8} ry={3 + rnd(i) * 3} fill="#b9895a" opacity={0.5} />
      ))}
      {/* grandpa's chair */}
      <g transform="translate(790,1330)">
        <rect x={-50} y={-120} width={100} height={18} rx={6} fill="#f4f4f4" stroke={OUT} strokeWidth={4} />
        <rect x={-50} y={-210} width={100} height={90} rx={12} fill="#f4f4f4" stroke={OUT} strokeWidth={4} />
        <line x1={-44} y1={-102} x2={-50} y2={0} stroke="#f4f4f4" strokeWidth={10} />
        <line x1={44} y1={-102} x2={50} y2={0} stroke="#f4f4f4" strokeWidth={10} />
      </g>
      {/* barrel */}
      <g transform={`translate(150,1340) rotate(${barrelFall * -82},60,0)`}>
        <rect x={-60} y={-170} width={120} height={170} rx={16} fill="#2f6fb8" stroke={OUT} strokeWidth={5} />
        <rect x={-60} y={-130} width={120} height={12} fill="#24599a" />
        <rect x={-60} y={-50} width={120} height={12} fill="#24599a" />
        <ellipse cx={0} cy={-170} rx={60} ry={14} fill="#4a86cc" stroke={OUT} strokeWidth={4} />
      </g>
      {/* house lights at night */}
      {n > 0 ? <rect x={0} y={0} width={W} height={H} fill="#0b0f30" opacity={0.35 * n} /> : null}
    </svg>
  );
};

/* ------------------------------------------------------------------ mountain: path at dusk / chase at night */
export const MountainBG: React.FC<{t: number; dusk: number; scroll?: number; wall?: number}> = ({t, dusk, scroll = 0, wall = 0}) => {
  const sky0 = dusk < 0.5 ? '#ff9a55' : '#101536';
  const sky1 = dusk < 0.5 ? '#ffcf87' : '#2b2a5a';
  const layer = (seed: number, y: number, amp: number, color: string, speed: number) => {
    const off = ((scroll * speed) % 1400) - 1400;
    let d = `M ${off} ${H}`;
    for (let i = 0; i <= 40; i++) {
      const x = off + i * 90;
      const h = y - (Math.sin(i * 1.7 + seed) * 0.5 + 0.5) * amp - rnd(i + seed * 13) * amp * 0.35;
      d += ` L ${x} ${h}`;
    }
    d += ` L ${off + 3600} ${H} Z`;
    return <path d={d} fill={color} />;
  };
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
      <defs>
        <linearGradient id="msky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sky0} />
          <stop offset="0.6" stopColor={sky1} />
          <stop offset="1" stopColor={dusk < 0.5 ? '#c96a7a' : '#3a2a5a'} />
        </linearGradient>
        <radialGradient id="moonG" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#e8eeff" stopOpacity="0.8" />
          <stop offset="1" stopColor="#e8eeff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill="url(#msky)" />
      {dusk < 0.5 ? (
        <circle cx={300} cy={760} r={120} fill="#ffe39a" opacity={0.95} />
      ) : (
        <>
          <circle cx={800} cy={330} r={260} fill="url(#moonG)" />
          <circle cx={800} cy={330} r={80} fill="#f1f4ff" />
          <circle cx={770} cy={310} r={14} fill="#d6dcf0" />
          <circle cx={822} cy={354} r={10} fill="#d6dcf0" />
          {Array.from({length: 60}).map((_, i) => (
            <circle key={i} cx={rnd(i) * W} cy={rnd(i + 7) * 900} r={1.5 + rnd(i + 2) * 2.5} fill="#fff" opacity={0.3 + 0.6 * Math.abs(Math.sin(t * 1.5 + i))} />
          ))}
        </>
      )}
      {layer(1, 1000, 340, dusk < 0.5 ? '#a0566e' : '#1c1f45', 0.15)}
      {layer(2, 1200, 300, dusk < 0.5 ? '#7a3f5e' : '#151838', 0.35)}
      {layer(3, 1420, 220, dusk < 0.5 ? '#5a2f4a' : '#0f1129', 0.7)}
      {/* ground */}
      <path d={`M 0 1560 Q 540 1500 1080 1560 L 1080 ${H} L 0 ${H} Z`} fill={dusk < 0.5 ? '#8a5a4a' : '#232036'} />
      {Array.from({length: 14}).map((_, i) => {
        const x = ((rnd(i) * 1500 - scroll * 1.1) % 1500 + 1500) % 1500 - 200;
        const y = 1580 + rnd(i + 4) * 300;
        const r = 30 + rnd(i + 2) * 70;
        return <ellipse key={i} cx={x} cy={y} rx={r} ry={r * 0.55} fill={dusk < 0.5 ? '#6e4638' : '#191628'} stroke={OUT} strokeWidth={4} />;
      })}
      {wall > 0 ? (
        <path d={`M ${-400 + wall * 400} 400 Q ${-100 + wall * 400} 700 ${-60 + wall * 400} 1100 Q ${-20 + wall * 400} 1500 ${-120 + wall * 400} ${H} L -400 ${H} Z`} fill="#141226" stroke="#2c2846" strokeWidth={8} />
      ) : null}
    </svg>
  );
};

/* ------------------------------------------------------------------ the den */
export const CaveBG: React.FC<{t: number; light: number}> = ({t, light}) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
    <defs>
      <radialGradient id="cmouth" cx="0.5" cy="0.6" r="0.6">
        <stop offset="0" stopColor="#000000" />
        <stop offset="0.8" stopColor="#0a0710" />
        <stop offset="1" stopColor="#1a1424" />
      </radialGradient>
      <linearGradient id="crock" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#4a3a52" />
        <stop offset="1" stopColor="#2a2032" />
      </linearGradient>
    </defs>
    <rect width={W} height={H} fill="#1b1530" />
    <path d={`M 0 0 L ${W} 0 L ${W} ${H} L 0 ${H} Z`} fill="url(#crock)" />
    {Array.from({length: 12}).map((_, i) => (
      <path key={i} d={`M ${rnd(i) * W} ${rnd(i + 3) * 1200} l ${40 + rnd(i + 1) * 80} ${20 + rnd(i + 2) * 60}`} stroke="#5a4a64" strokeWidth={5} opacity={0.6} />
    ))}
    {/* cave mouth */}
    <path d="M 160 1500 Q 140 820 540 700 Q 940 820 920 1500 Z" fill="url(#cmouth)" stroke="#120c1a" strokeWidth={14} />
    {/* claw marks */}
    {[0, 1, 2].map((k) => (
      <g key={k} transform={`translate(${90 + k * 860},${800 + k * 40}) rotate(${k ? 10 : -10})`}>
        {[0, 1, 2, 3].map((i) => (
          <path key={i} d={`M ${i * 16} 0 Q ${i * 16 + 8} 60 ${i * 16 - 4} 130`} stroke="#c9b6d8" strokeWidth={5} opacity={0.55} fill="none" />
        ))}
      </g>
    ))}
    {/* bones */}
    {[
      [260, 1520, -20],
      [780, 1540, 15],
      [640, 1580, -5],
    ].map(([x, y, r], i) => (
      <g key={i} transform={`translate(${x},${y}) rotate(${r})`}>
        <rect x={-50} y={-7} width={100} height={14} rx={7} fill="#e8e0d0" />
        <circle cx={-50} cy={-8} r={10} fill="#e8e0d0" />
        <circle cx={-50} cy={8} r={10} fill="#e8e0d0" />
        <circle cx={50} cy={-8} r={10} fill="#e8e0d0" />
        <circle cx={50} cy={8} r={10} fill="#e8e0d0" />
      </g>
    ))}
    <rect x={0} y={1500} width={W} height={H - 1500} fill="#221a30" />
    {/* dust drifting */}
    {Array.from({length: 24}).map((_, i) => (
      <circle key={i} cx={(rnd(i) * W + t * 20 * (rnd(i + 1) - 0.5)) % W} cy={(rnd(i + 5) * H + t * 30) % H} r={2 + rnd(i + 2) * 2} fill="#d9c8e8" opacity={0.2 * light} />
    ))}
  </svg>
);
