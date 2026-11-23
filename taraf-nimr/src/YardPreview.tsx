import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Jeep} from './Jeep';
import {Kid, LOOKS} from './Kid';
import {Leopard} from './Animals';

export const YardPreview: React.FC = () => (
  <AbsoluteFill style={{background: 'linear-gradient(180deg,#ffd9a0 0%,#ffe9c4 55%,#d9b88a 55.2%,#c9a272 100%)'}}>
    <svg width={1920} height={1080}>
      <rect x={0} y={250} width={1920} height={350} fill="#e8cfa6" />
      <rect x={0} y={250} width={1920} height={30} fill="#d2b183" />
      <Jeep x={1050} y={900} s={0.95} />
      <Leopard id="pc" x={1020} y={905} s={0.32} t={0.5} mode="crouch" cub facing={-1} />
      <Kid id="pf" look={LOOKS.fares} x={420} y={1000} s={0.5} t={0.3} expr="curious" armR={60} />
      <Kid id="pl" look={LOOKS.leen} x={200} y={1000} s={0.5} t={0.3} expr="happy" armR={110} />
    </svg>
  </AbsoluteFill>
);
