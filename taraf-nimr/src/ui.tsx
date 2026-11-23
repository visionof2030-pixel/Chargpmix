import React from 'react';
import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';
import {Cam, H, KEY, SceneTL, TL, W, camTransform, clamp01, pop} from './tl';
import {LOOKS} from './Kid';

export const FONT = 'Cairo';
loadFont({family: FONT, url: staticFile('Cairo-Bold.ttf'), weight: '700'});

export const World: React.FC<{cam: Cam; children: React.ReactNode}> = ({cam, children}) => (
  <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, transformOrigin: '0 0', transform: camTransform(cam)}}>{children}</div>
);

/** caption with the speaker's name chip; words light up through the line */
export const Caption: React.FC<{s: SceneTL; t: number}> = ({s, t}) => {
  for (const [id, [a, b]] of Object.entries(s.lines)) {
    if (t < a - 0.05 || t >= b + 0.25) continue;
    const text = TL.text[id];
    const words = text.split(' ');
    const k = clamp01((t - a) / Math.max(0.3, b - a));
    const weights = words.map((w) => w.length + 2);
    const tot = weights.reduce((x, y) => x + y, 0);
    let acc = 0;
    const look = id === 'ALL' ? null : LOOKS[KEY[id[0]]];
    const age = t - a;
    const sc = pop(age / 0.25);
    const op = Math.min(clamp01((age + 0.05) / 0.12), clamp01((b + 0.25 - t) / 0.15));
    return (
      <div style={{position: 'absolute', top: 170, left: 0, width: W, display: 'flex', justifyContent: 'center', opacity: op}}>
        <div
          dir="rtl"
          lang="ar"
          style={{
            position: 'relative',
            maxWidth: 940,
            padding: '30px 44px 26px',
            borderRadius: 34,
            background: 'rgba(14,10,26,0.82)',
            border: `5px solid ${look ? look.color : '#ffd54a'}`,
            boxShadow: '0 14px 34px rgba(0,0,0,0.4)',
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: 60,
            lineHeight: 1.5,
            textAlign: 'center',
            color: '#fff',
            transform: `scale(${0.9 + 0.1 * sc})`,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -40,
              right: 34,
              background: look ? look.color : '#ffd54a',
              color: look ? '#fff' : '#2a1d24',
              borderRadius: 999,
              padding: '0 30px 6px',
              fontSize: 42,
              border: '4px solid #fff',
            }}
          >
            {look ? look.name : 'الكل'}
          </div>
          {words.map((w, i) => {
            const start = acc / tot;
            acc += weights[i];
            const lit = k >= start;
            return (
              <span key={i} style={{display: 'inline-block', margin: '0 8px', color: lit ? '#ffffff' : 'rgba(255,255,255,0.45)'}}>
                {w}
              </span>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

export const Pow: React.FC<{text: string; x: number; y: number; age: number; size?: number; fill?: string; stroke?: string; rot?: number; life?: number}> = ({
  text,
  x,
  y,
  age,
  size = 130,
  fill = '#fff',
  stroke = '#3a1a2a',
  rot = -8,
  life = 1,
}) => {
  if (age < 0 || age > life) return null;
  const sc = pop(age / 0.22);
  const fade = clamp01((life - age) / 0.25);
  return (
    <div
      dir="rtl"
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${Math.max(0.01, sc)})`,
        fontFamily: FONT,
        fontWeight: 700,
        fontSize: size,
        color: fill,
        WebkitTextStroke: `${size * 0.09}px ${stroke}`,
        paintOrder: 'stroke fill',
        textShadow: `0 ${size * 0.08}px 0 ${stroke}`,
        opacity: fade,
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </div>
  );
};

export const Vignette: React.FC<{strength?: number; color?: string}> = ({strength = 0.5, color = '8,4,20'}) => (
  <div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 48%, rgba(${color},0) 45%, rgba(${color},${strength}) 100%)`}} />
);

/** colour grade for dusk / night */
export const Tint: React.FC<{color: string; amount: number; blend?: React.CSSProperties['mixBlendMode']}> = ({color, amount, blend = 'multiply'}) =>
  amount > 0 ? <div style={{position: 'absolute', inset: 0, background: color, opacity: amount, mixBlendMode: blend}} /> : null;

export const Flash: React.FC<{amount: number}> = ({amount}) => (amount > 0 ? <div style={{position: 'absolute', inset: 0, background: '#fff8dc', opacity: amount}} /> : null);
