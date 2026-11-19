import React from 'react';
import {FLOOR, H, W, rnd, smooth} from './lib';

const OUT = '#3a2230';

export const RoomBG: React.FC<{t: number}> = ({t}) => {
  const curtain = (side: -1 | 1) => {
    const x0 = side < 0 ? 96 : 504;
    const sw = Math.sin(t * 1.4 + side) * 10;
    const dir = side < 0 ? 1 : -1;
    return (
      <path
        d={`M ${x0} 330 L ${x0 + dir * 120} 330 Q ${x0 + dir * 70 + sw} 600 ${x0 + dir * 96 + sw * 1.6} 930 L ${x0 - dir * 10 + sw} 930 Q ${x0 + sw * 0.5} 620 ${x0} 330 Z`}
        fill="url(#curtain)"
        stroke={OUT}
        strokeWidth={5}
      />
    );
  };
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
      <defs>
        <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe3cc" />
          <stop offset="1" stopColor="#f6c9b0" />
        </linearGradient>
        <pattern id="stripes" width="64" height="64" patternUnits="userSpaceOnUse">
          <rect width="32" height="64" fill="#ffffff" opacity="0.18" />
          <circle cx="48" cy="20" r="5" fill="#ff9fb8" opacity="0.25" />
        </pattern>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd37a" />
          <stop offset="0.55" stopColor="#ffe9a8" />
          <stop offset="1" stopColor="#bfe8ff" />
        </linearGradient>
        <radialGradient id="sun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fffbe0" />
          <stop offset="0.35" stopColor="#ffe066" />
          <stop offset="1" stopColor="#ffb703" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="curtain" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ff8fb4" />
          <stop offset="0.5" stopColor="#ffb3cc" />
          <stop offset="1" stopColor="#ef6f9b" />
        </linearGradient>
        <linearGradient id="beam" x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0" stopColor="#fff5c2" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff5c2" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d9a36f" />
          <stop offset="1" stopColor="#b97c4c" />
        </linearGradient>
        <linearGradient id="duvet" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffd1e3" />
          <stop offset="1" stopColor="#f59bc0" />
        </linearGradient>
        <radialGradient id="rug" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#c9b3ff" />
          <stop offset="0.7" stopColor="#a98bf0" />
          <stop offset="1" stopColor="#8a6ad8" />
        </radialGradient>
      </defs>
      <rect width={W} height={FLOOR - 120} fill="url(#wall)" />
      <rect width={W} height={FLOOR - 120} fill="url(#stripes)" />

      {/* window */}
      <rect x={110} y={350} width={380} height={560} rx={18} fill="url(#sky)" stroke={OUT} strokeWidth={6} />
      <circle cx={360} cy={500} r={150 + Math.sin(t * 2) * 6} fill="url(#sun)" />
      <circle cx={360} cy={500} r={58} fill="#ffe873" stroke="#ffb703" strokeWidth={6} />
      {Array.from({length: 10}).map((_, i) => {
        const a = (i / 10) * Math.PI * 2 + t * 0.4;
        return (
          <line
            key={i}
            x1={360 + Math.cos(a) * 78}
            y1={500 + Math.sin(a) * 78}
            x2={360 + Math.cos(a) * 108}
            y2={500 + Math.sin(a) * 108}
            stroke="#ffb703"
            strokeWidth={8}
            strokeLinecap="round"
          />
        );
      })}
      {/* heat shimmer */}
      {[0, 1, 2].map((i) => (
        <path
          key={i}
          d={`M ${170 + i * 90} ${880 - ((t * 60 + i * 70) % 260)} q 14 -20 0 -40 q -14 -20 0 -40`}
          stroke="#ff9a3c"
          strokeWidth={6}
          fill="none"
          strokeLinecap="round"
          opacity={0.5}
        />
      ))}
      <rect x={110} y={350} width={380} height={560} rx={18} fill="none" stroke="#ffffff" strokeWidth={18} />
      <line x1={300} y1={350} x2={300} y2={910} stroke="#ffffff" strokeWidth={14} />
      <line x1={110} y1={630} x2={490} y2={630} stroke="#ffffff" strokeWidth={14} />
      <rect x={90} y={905} width={420} height={30} rx={8} fill="#ffffff" stroke={OUT} strokeWidth={5} />
      <rect x={80} y={316} width={440} height={26} rx={13} fill="#c98b5a" stroke={OUT} strokeWidth={5} />
      {curtain(-1)}
      {curtain(1)}

      {/* poster */}
      <g transform={`translate(640,420) rotate(${3 + Math.sin(t) * 0.5})`}>
        <rect x={0} y={0} width={170} height={220} rx={10} fill="#fff" stroke={OUT} strokeWidth={5} />
        <rect x={14} y={14} width={142} height={150} rx={6} fill="#9be0c7" />
        <path d="M 40 140 L 85 60 L 130 140 Z" fill="#ffd166" stroke={OUT} strokeWidth={4} />
        <circle cx={125} cy={50} r={18} fill="#ff6fa8" />
        <rect x={34} y={180} width={100} height={14} rx={7} fill="#ffb3cc" />
      </g>
      {/* thermometer */}
      <g transform="translate(900,430)">
        <rect x={-26} y={0} width={52} height={250} rx={26} fill="#fff" stroke={OUT} strokeWidth={5} />
        <rect x={-10} y={30 + (1 - smooth(t / 3)) * 120} width={20} height={190 - (1 - smooth(t / 3)) * 120} rx={10} fill="#ff3b3b" />
        <circle cx={0} cy={232} r={34} fill="#ff3b3b" stroke={OUT} strokeWidth={5} />
        <text x={0} y={-24} fontFamily="Cairo" fontWeight={700} fontSize={46} fill="#e63946" textAnchor="middle">
          ٤٨°
        </text>
      </g>
      {/* shelf */}
      <rect x={600} y={780} width={380} height={22} rx={6} fill="#c98b5a" stroke={OUT} strokeWidth={5} />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={620 + i * 40} y={680} width={34} height={100} rx={6} fill={['#ff6fa8', '#5ec2ff', '#ffd166', '#8bd38b'][i]} stroke={OUT} strokeWidth={4} />
      ))}
      {/* teddy */}
      <g transform="translate(880,720)">
        <circle cx={-30} cy={-40} r={16} fill="#c98b5a" stroke={OUT} strokeWidth={4} />
        <circle cx={30} cy={-40} r={16} fill="#c98b5a" stroke={OUT} strokeWidth={4} />
        <ellipse cx={0} cy={30} rx={46} ry={34} fill="#c98b5a" stroke={OUT} strokeWidth={4} />
        <circle cx={0} cy={-14} r={40} fill="#d9a06a" stroke={OUT} strokeWidth={4} />
        <circle cx={-12} cy={-20} r={5} fill={OUT} />
        <circle cx={12} cy={-20} r={5} fill={OUT} />
        <ellipse cx={0} cy={-4} rx={12} ry={9} fill="#f3d2b0" />
      </g>

      {/* sun beam */}
      <path d="M 110 350 L 490 350 L 1080 1660 L 300 1660 Z" fill="url(#beam)" opacity={0.75 + Math.sin(t * 1.7) * 0.15} />

      {/* bed */}
      <g transform="translate(560,1060)">
        <rect x={380} y={-170} width={40} height={430} rx={14} fill="#fff" stroke={OUT} strokeWidth={5} />
        <rect x={20} y={110} width={420} height={150} rx={30} fill="url(#duvet)" stroke={OUT} strokeWidth={5} />
        <ellipse cx={330} cy={90} rx={80} ry={44} fill="#fff" stroke={OUT} strokeWidth={5} />
        <path d="M 60 140 q 40 30 80 0 q 40 -30 80 0 q 40 30 80 0" stroke="#fff" strokeWidth={8} fill="none" opacity={0.7} />
        <rect x={20} y={250} width={420} height={60} rx={14} fill="#fff" stroke={OUT} strokeWidth={5} />
      </g>

      {/* floor */}
      <rect x={0} y={FLOOR - 120} width={W} height={H - FLOOR + 120} fill="url(#floor)" />
      <rect x={0} y={FLOOR - 136} width={W} height={26} fill="#fff4ea" stroke={OUT} strokeWidth={4} />
      {Array.from({length: 9}).map((_, i) => (
        <line key={i} x1={i * 135 - 60} y1={FLOOR - 110} x2={(i * 135 - 540) * 1.6 + 540} y2={H} stroke="#a5683c" strokeWidth={4} opacity={0.5} />
      ))}
      {[FLOOR - 40, FLOOR + 70].map((y, i) => (
        <line key={i} x1={0} y1={y} x2={W} y2={y} stroke="#a5683c" strokeWidth={3} opacity={0.35} />
      ))}
      <ellipse cx={540} cy={FLOOR + 10} rx={470} ry={92} fill="url(#rug)" stroke={OUT} strokeWidth={5} />
      <ellipse cx={540} cy={FLOOR + 10} rx={400} ry={66} fill="none" stroke="#fff" strokeWidth={6} strokeDasharray="20 16" opacity={0.6} />

      {/* dust motes */}
      {Array.from({length: 26}).map((_, i) => {
        const x = 200 + rnd(i) * 700 + Math.sin(t * 0.7 + i) * 30;
        const y = 500 + ((rnd(i + 40) * 1000 - t * (8 + rnd(i + 3) * 14)) % 1000 + 1000) % 1000;
        return <circle key={i} cx={x} cy={y} r={2 + rnd(i + 9) * 4} fill="#fffbe0" opacity={0.35 + 0.4 * Math.sin(t * 2 + i)} />;
      })}
    </svg>
  );
};

export const BathBG: React.FC<{t: number; knobX: number; knobY: number; knob: number; door: number; doorShake: number; puddle: number}> = ({
  t,
  knobX,
  knobY,
  knob,
  door,
  doorShake,
  puddle,
}) => {
  const tiles: React.ReactNode[] = [];
  for (let y = 0; y < FLOOR - 160; y += 90) {
    for (let x = (y / 90) % 2 ? -45 : 0; x < W; x += 90) {
      tiles.push(<rect key={`${x}-${y}`} x={x + 3} y={y + 3} width={84} height={84} rx={8} fill={rnd(x * 7 + y) > 0.88 ? '#9fdde0' : '#c9f0ef'} />);
    }
  }
  const dx = 880;
  const dw = 190;
  const dy = 720;
  const panelW = door * dw;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
      <defs>
        <linearGradient id="bwall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e6fbfa" />
          <stop offset="1" stopColor="#b5e6e6" />
        </linearGradient>
        <linearGradient id="bfloor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8fc7d6" />
          <stop offset="1" stopColor="#6aa6bd" />
        </linearGradient>
        <linearGradient id="chrome" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f4f8fb" />
          <stop offset="0.5" stopColor="#aab6c4" />
          <stop offset="1" stopColor="#7d8a99" />
        </linearGradient>
        <linearGradient id="hall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd9a8" />
          <stop offset="1" stopColor="#f2b07a" />
        </linearGradient>
        <linearGradient id="wood" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#b97a4f" />
          <stop offset="0.5" stopColor="#d39363" />
          <stop offset="1" stopColor="#a8693f" />
        </linearGradient>
        <linearGradient id="curt" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" />
          <stop offset="1" stopColor="#dff3ff" />
        </linearGradient>
        <pattern id="curtStripe" width="60" height="60" patternUnits="userSpaceOnUse">
          <rect width="20" height="60" fill="#7cc4f2" opacity="0.55" />
        </pattern>
      </defs>
      <rect width={W} height={FLOOR - 160} fill="#86c9cc" />
      {tiles}
      <rect width={W} height={FLOOR - 160} fill="url(#bwall)" opacity={0.35} />
      <rect x={0} y={380} width={W} height={26} fill="#5fb7bd" />

      {/* doorway & hallway */}
      <rect x={dx} y={dy} width={dw} height={FLOOR - dy} fill="url(#hall)" stroke={OUT} strokeWidth={6} />
      <rect x={dx + 30} y={dy + 120} width={120} height={160} rx={8} fill="#fff3d6" stroke={OUT} strokeWidth={4} opacity={0.8} />
      <rect x={dx} y={FLOOR - 40} width={dw} height={40} fill="#d99a68" />
      <rect x={dx - 18} y={dy - 18} width={dw + 36} height={FLOOR - dy + 18} fill="none" stroke="#fff" strokeWidth={22} />

      {/* mirror + sink at far left */}
      <ellipse cx={90} cy={720} rx={90} ry={120} fill="#e8fbff" stroke={OUT} strokeWidth={6} />
      <path d="M 40 660 L 90 610 M 50 720 L 120 650" stroke="#fff" strokeWidth={10} strokeLinecap="round" opacity={0.8} />

      {/* towel rack between shower & door */}
      <rect x={690} y={640} width={150} height={12} rx={6} fill="url(#chrome)" stroke={OUT} strokeWidth={3} />
      <path d={`M 700 650 L 830 650 L ${826 + Math.sin(t * 1.2) * 3} 900 Q 765 920 ${704 + Math.sin(t * 1.2) * 3} 900 Z`} fill="#ff8fc0" stroke={OUT} strokeWidth={5} />
      <path d="M 704 860 L 828 860" stroke="#fff" strokeWidth={10} opacity={0.7} />
      {/* plant */}
      <g transform="translate(780,1180)">
        <path d="M 0 0 Q -60 -90 -30 -150 M 0 0 Q 10 -110 40 -170 M 0 0 Q 60 -80 80 -120" stroke="#3f9d55" strokeWidth={22} strokeLinecap="round" fill="none" />
        <path d="M -40 0 L 40 0 L 30 80 L -30 80 Z" fill="#ff9f68" stroke={OUT} strokeWidth={5} />
      </g>

      {/* shower pipe */}
      <path d={`M ${knobX} ${knobY} L ${knobX} 470 Q ${knobX} 440 ${knobX - 30} 440 L 330 440 Q 300 440 300 470 L 300 500`} stroke={OUT} strokeWidth={30} fill="none" strokeLinejoin="round" />
      <path d={`M ${knobX} ${knobY} L ${knobX} 470 Q ${knobX} 440 ${knobX - 30} 440 L 330 440 Q 300 440 300 470 L 300 500`} stroke="url(#chrome)" strokeWidth={20} fill="none" strokeLinejoin="round" />
      {/* shower head */}
      <g transform="translate(300,520)">
        <path d="M -86 10 Q 0 -60 86 10 Z" fill="url(#chrome)" stroke={OUT} strokeWidth={6} />
        <rect x={-90} y={6} width={180} height={18} rx={9} fill="#9aa7b6" stroke={OUT} strokeWidth={5} />
        {[-60, -30, 0, 30, 60].map((x) => (
          <circle key={x} cx={x} cy={15} r={4} fill="#4b5563" />
        ))}
      </g>
      {/* knob */}
      <g transform={`translate(${knobX},${knobY})`}>
        <circle r={46} fill="url(#chrome)" stroke={OUT} strokeWidth={6} />
        <g transform={`rotate(${knob})`}>
          <rect x={-58} y={-12} width={116} height={24} rx={12} fill="#e9eef4" stroke={OUT} strokeWidth={5} />
        </g>
        <circle r={14} fill="#5ec2ff" stroke={OUT} strokeWidth={4} />
      </g>

      {/* shower curtain (pulled aside on the left) */}
      <rect x={0} y={420} width={260} height={14} rx={7} fill="url(#chrome)" stroke={OUT} strokeWidth={3} />
      <path d={`M 0 430 L 70 430 Q ${60 + Math.sin(t) * 6} 900 ${90 + Math.sin(t) * 10} 1440 L 0 1440 Z`} fill="url(#curt)" stroke={OUT} strokeWidth={5} />
      <path d={`M 0 430 L 70 430 Q ${60 + Math.sin(t) * 6} 900 ${90 + Math.sin(t) * 10} 1440 L 0 1440 Z`} fill="url(#curtStripe)" />

      {/* floor */}
      <rect x={0} y={FLOOR - 160} width={W} height={H - FLOOR + 160} fill="url(#bfloor)" />
      {Array.from({length: 13}).map((_, i) => (
        <line key={i} x1={i * 90 - 30} y1={FLOOR - 160} x2={(i * 90 - 570) * 1.7 + 540} y2={H} stroke="#5d97ad" strokeWidth={4} />
      ))}
      {[FLOOR - 90, FLOOR + 10, FLOOR + 150].map((y, i) => (
        <line key={i} x1={0} y1={y} x2={W} y2={y} stroke="#5d97ad" strokeWidth={4} />
      ))}
      {/* shower tray */}
      <ellipse cx={300} cy={FLOOR + 6} rx={260} ry={60} fill="#dff4fb" stroke={OUT} strokeWidth={5} opacity={0.9} />
      <circle cx={300} cy={FLOOR + 30} r={12} fill="#8fa3b5" stroke={OUT} strokeWidth={3} />
      {puddle > 0 ? (
        <ellipse cx={330 + puddle * 60} cy={FLOOR + 14} rx={80 + puddle * 340} ry={22 + puddle * 46} fill="#7fd0ff" opacity={0.55} />
      ) : null}

      {/* door panel (hinge at right) */}
      {panelW > 1 ? (
        <g transform={`translate(${doorShake},0)`}>
          <rect x={dx + dw - panelW} y={dy} width={panelW} height={FLOOR - dy} fill="url(#wood)" stroke={OUT} strokeWidth={6} />
          {panelW > 120 ? (
            <>
              <rect x={dx + dw - panelW + 24} y={dy + 40} width={panelW - 48} height={330} rx={10} fill="none" stroke="#8a5530" strokeWidth={6} />
              <rect x={dx + dw - panelW + 24} y={dy + 420} width={panelW - 48} height={440} rx={10} fill="none" stroke="#8a5530" strokeWidth={6} />
              <circle cx={dx + dw - panelW + 30} cy={dy + 470} r={16} fill="#ffd166" stroke={OUT} strokeWidth={4} />
            </>
          ) : null}
        </g>
      ) : (
        <path d={`M ${dx + dw} ${dy} L ${dx + dw + 40} ${dy - 40} L ${dx + dw + 40} ${FLOOR + 40} L ${dx + dw} ${FLOOR} Z`} fill="url(#wood)" stroke={OUT} strokeWidth={6} />
      )}
    </svg>
  );
};
