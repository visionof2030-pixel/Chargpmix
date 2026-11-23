import React from 'react';

const OUT = '#2b1b16';

/** Old beige 4x4 with a white hard-top, side view facing right. Origin = ground under the middle. */
export const Jeep: React.FC<{x: number; y: number; s?: number; facing?: 1 | -1; t?: number; dusk?: number}> = ({x, y, s = 1, facing = 1, t = 0, dusk = 0}) => {
  const body = '#cdbd93';
  const bodyShade = '#ac9a6e';
  const roof = '#f4f2ea';
  const glass = '#9fc6cf';
  const wheel = (cx: number) => (
    <g transform={`translate(${cx},-120)`}>
      <circle r={120} fill="#1c1c20" stroke={OUT} strokeWidth={6} />
      {Array.from({length: 16}).map((_, i) => {
        const a = (i / 16) * Math.PI * 2;
        return <rect key={i} x={-10} y={-122} width={20} height={22} rx={4} fill="#2c2c32" transform={`rotate(${(a * 180) / Math.PI})`} />;
      })}
      <circle r={66} fill="#3a3d44" stroke={OUT} strokeWidth={5} />
      <circle r={50} fill="#2a2c31" />
      {Array.from({length: 6}).map((_, i) => (
        <circle key={i} cx={Math.cos((i / 6) * Math.PI * 2) * 32} cy={Math.sin((i / 6) * Math.PI * 2) * 32} r={6} fill="#8b8f98" />
      ))}
      <circle r={14} fill="#8b8f98" />
    </g>
  );
  return (
    <g transform={`translate(${x},${y}) scale(${s * facing},${s})`}>
      <defs>
        <linearGradient id="jeepBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ddd0a8" />
          <stop offset="0.6" stopColor={body} />
          <stop offset="1" stopColor={bodyShade} />
        </linearGradient>
        <linearGradient id="jeepGlass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#cfe7ec" />
          <stop offset="1" stopColor={glass} />
        </linearGradient>
      </defs>
      <ellipse cx={0} cy={6} rx={560} ry={36} fill="#000" opacity={0.28} />
      {/* chassis under */}
      <rect x={-470} y={-170} width={940} height={40} rx={10} fill="#2a2a30" />
      {/* body */}
      <path
        d="M -500 -170 L -500 -420 Q -500 -440 -480 -440 L 120 -440 L 150 -440 L 200 -360 Q 420 -360 470 -340 Q 500 -330 500 -300 L 500 -170 Q 420 -170 400 -230 Q 360 -300 300 -300 Q 230 -300 200 -230 Q 180 -170 -200 -170 Q -220 -230 -260 -280 Q -300 -300 -340 -300 Q -400 -300 -440 -230 Q -460 -170 -500 -170 Z"
        fill="url(#jeepBody)"
        stroke={OUT}
        strokeWidth={7}
        strokeLinejoin="round"
      />
      {/* white hard-top */}
      <path d="M -500 -440 L -500 -640 Q -500 -670 -470 -672 L 110 -672 Q 150 -670 160 -640 L 190 -440 Z" fill={roof} stroke={OUT} strokeWidth={7} strokeLinejoin="round" />
      <path d="M -500 -660 Q -200 -690 150 -662" stroke="#ffffff" strokeWidth={10} fill="none" opacity={0.7} />
      {/* windows */}
      <path d="M -470 -460 L -470 -610 L -260 -610 L -260 -460 Z" fill="url(#jeepGlass)" stroke={OUT} strokeWidth={6} />
      <path d="M -230 -460 L -230 -610 L -20 -610 L -20 -460 Z" fill="url(#jeepGlass)" stroke={OUT} strokeWidth={6} />
      <path d="M 10 -460 L 10 -610 L 120 -610 L 150 -460 Z" fill="url(#jeepGlass)" stroke={OUT} strokeWidth={6} />
      {[-430, -190, 30].map((wx, i) => (
        <path key={i} d={`M ${wx} -600 L ${wx + 50} -600 L ${wx - 10} -470 L ${wx - 50} -470 Z`} fill="#fff" opacity={0.35} />
      ))}
      {/* door line + handle */}
      <path d="M -10 -440 L -10 -190 M 180 -360 L 180 -200" stroke={bodyShade} strokeWidth={6} />
      <rect x={-60} y={-410} width={40} height={12} rx={6} fill="#c9cbd0" stroke={OUT} strokeWidth={3} />
      {/* side mirror */}
      <path d="M 170 -470 L 210 -520" stroke={OUT} strokeWidth={8} />
      <rect x={196} y={-560} width={40} height={50} rx={8} fill="#2a2a30" stroke={OUT} strokeWidth={4} />
      {/* bonnet vents + latches */}
      {[0, 1, 2, 3].map((i) => (
        <line key={i} x1={250 + i * 20} y1={-330} x2={250 + i * 20} y2={-280} stroke={bodyShade} strokeWidth={6} />
      ))}
      <rect x={300} y={-372} width={30} height={14} rx={4} fill="#c9cbd0" stroke={OUT} strokeWidth={3} />
      {/* front: chrome grille edge, round headlight, orange indicator */}
      <rect x={478} y={-338} width={34} height={140} rx={10} fill="#d8dade" stroke={OUT} strokeWidth={5} />
      <circle cx={500} cy={-296} r={32} fill={dusk > 0.3 ? '#fff3b0' : '#e9eef2'} stroke={OUT} strokeWidth={5} />
      <rect x={470} y={-238} width={36} height={22} rx={5} fill="#f59e0b" stroke={OUT} strokeWidth={3} />
      {dusk > 0.3 ? <path d="M 520 -300 L 900 -360 L 900 -220 Z" fill="#fff3b0" opacity={0.18 * dusk} /> : null}
      {/* bumper */}
      <rect x={400} y={-200} width={150} height={34} rx={8} fill="#c8b88c" stroke={OUT} strokeWidth={5} />
      <rect x={-540} y={-200} width={90} height={30} rx={8} fill="#c8b88c" stroke={OUT} strokeWidth={5} />
      {/* spare wheel on the back */}
      <g transform="translate(-520,-330)">
        <rect x={-30} y={-90} width={60} height={180} rx={24} fill="#1c1c20" stroke={OUT} strokeWidth={5} />
        <rect x={-16} y={-60} width={32} height={120} rx={12} fill="#3a3d44" />
      </g>
      {wheel(-330)}
      {wheel(300)}
      <path d="M -460 -230 Q -330 -340 -200 -230" stroke={OUT} strokeWidth={8} fill="none" />
      <path d="M 170 -230 Q 300 -340 430 -230" stroke={OUT} strokeWidth={8} fill="none" />
      {void t}
    </g>
  );
};
