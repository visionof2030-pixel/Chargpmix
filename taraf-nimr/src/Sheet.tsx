import React from 'react';
import {AbsoluteFill, staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {Kid, LOOKS, Rifle} from './Kid';
import {Leopard} from './Animals';

loadFont({family: 'Cairo', url: staticFile('Cairo-Bold.ttf'), weight: '700'});

const ORDER = ['taraf', 'sahab', 'malath', 'leen', 'fares', 'jassar'] as const;

export const Sheet: React.FC = () => {
  const W = 2400;
  return (
    <AbsoluteFill style={{background: 'linear-gradient(180deg,#fff6e8 0%,#f3dfc6 60%,#2a1d3a 60.2%,#120c1e 100%)'}}>
      <div dir="rtl" style={{position: 'absolute', top: 30, width: W, textAlign: 'center', fontFamily: 'Cairo', fontWeight: 700, fontSize: 84, color: '#3b2a4a'}}>
        البسة اللي مو بسة! — الشخصيات
      </div>
      <svg width={W} height={1600} style={{position: 'absolute', inset: 0}}>
        {ORDER.map((k, i) => {
          const x = 2400 - (220 + i * 392);
          const L = LOOKS[k];
          return (
            <g key={k}>
              <Kid
                id={`s-${k}`}
                look={L}
                x={x}
                y={900}
                s={0.62}
                t={0.3 + i}
                expr={k === 'jassar' ? 'brave' : k === 'leen' ? 'happy' : k === 'fares' ? 'happy' : k === 'malath' ? 'curious' : 'smile'}
                headlamp={k === 'jassar'}
                armR={k === 'jassar' ? 20 : k === 'taraf' ? 120 : 10}
                bendR={k === 'jassar' ? -40 : undefined}
                propR={k === 'jassar' ? <Rifle /> : undefined}
                blinkSeed={i + 1}
              />
            </g>
          );
        })}
        {/* animals */}
        <Leopard id="sheet-mom" x={1500} y={1520} s={0.9} t={0.4} mode="stand" snarl={0.8} facing={-1} />
        <Leopard id="sheet-cub" x={560} y={1520} s={0.55} t={0.4} mode="sit" cub />
      </svg>
      {ORDER.map((k, i) => (
        <div
          key={k}
          dir="rtl"
          style={{
            position: 'absolute',
            left: 2400 - (220 + i * 392) - 110,
            top: 930,
            width: 220,
            textAlign: 'center',
            fontFamily: 'Cairo',
            fontWeight: 700,
            fontSize: 50,
            color: '#fff',
            background: LOOKS[k].color,
            borderRadius: 999,
            border: '5px solid #fff',
            boxShadow: '0 8px 0 rgba(0,0,0,0.2)',
          }}
        >
          {LOOKS[k].name}
        </div>
      ))}
      {[
        {t: 'صغير النمر', x: 560},
        {t: 'النمرة — أمه', x: 1500},
      ].map((c) => (
        <div key={c.t} dir="rtl" style={{position: 'absolute', left: c.x - 200, top: 1060, width: 400, textAlign: 'center', fontFamily: 'Cairo', fontWeight: 700, fontSize: 48, color: '#ffe7a8'}}>
          {c.t}
        </div>
      ))}
    </AbsoluteFill>
  );
};
