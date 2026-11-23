import React from 'react';
import {AbsoluteFill} from 'remotion';
import {SideJassar} from './SideJassar';

export const RigTest: React.FC = () => (
  <AbsoluteFill style={{background: '#f3e3cc'}}>
    <svg width={2400} height={1400}>
      {[0, 0.125, 0.25, 0.375].map((p, i) => (
        <SideJassar key={`w${i}`} x={250 + i * 330} y={650} s={0.42} pose={{phase: p, walk: 1, run: 0, t: p, vel: 230, mouth: i === 1 ? 0.7 : null, brow: 'calm'}} />
      ))}
      {[0, 0.125, 0.25, 0.375].map((p, i) => (
        <SideJassar key={`r${i}`} x={250 + i * 330} y={1300} s={0.42} pose={{phase: p, walk: 0, run: 1, t: p, vel: 900, brow: 'determined', lamp: 1}} />
      ))}
      <SideJassar x={1700} y={650} s={0.42} pose={{phase: 0, walk: 0, run: 0, crouch: 1, t: 0, vel: 0, brow: 'determined'}} />
      <SideJassar x={2050} y={650} s={0.42} pose={{phase: 0, walk: 0, run: 0, tuck: 1, t: 0, vel: 600, brow: 'alert', look: 1}} />
      <SideJassar x={1850} y={1300} s={0.42} pose={{phase: 0, walk: 0, run: 0, t: 0, vel: 0, brow: 'worried', mouth: 0.6, bright: 0.9}} />
    </svg>
  </AbsoluteFill>
);
