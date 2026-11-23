import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Leopard} from '../Animals';

export const RigTest: React.FC = () => (
  <AbsoluteFill style={{background: '#f3e3cc'}}>
    <svg width={2400} height={1400}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Leopard key={i} id={`g${i}`} x={250 + (i % 3) * 760} y={i < 3 ? 600 : 1300} s={0.7} t={(i / 6) * (2 * Math.PI) / 14} mode="run" />
      ))}
    </svg>
  </AbsoluteFill>
);
