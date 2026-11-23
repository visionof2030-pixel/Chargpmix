import React from 'react';
import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';
import {Cam, H, SceneData, W, camTransform, clamp01, pop} from './lib';

export const FONT = 'Cairo';
loadFont({family: FONT, url: staticFile('Cairo-Bold.ttf'), weight: '700'});

export const World: React.FC<{cam: Cam; children: React.ReactNode}> = ({cam, children}) => (
  <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, transformOrigin: '0 0', transform: camTransform(cam)}}>{children}</div>
);

/** subtitle bar synced to the scene's words; the current word is highlighted */
export const Subtitles: React.FC<{sd: SceneData; t: number}> = ({sd, t}) => {
  const c = sd.chunks.find((k) => t >= k.s && t < k.e);
  if (!c) return null;
  const age = t - c.s;
  const left = c.e - t;
  const sc = pop(age / 0.22);
  const op = Math.min(clamp01(age / 0.12), clamp01(left / 0.12));
  const words = sd.words.slice(c.a, c.b + 1);
  return (
    <div style={{position: 'absolute', left: 0, width: W, top: 1430, display: 'flex', justifyContent: 'center', opacity: op}}>
      <div
        dir="rtl"
        lang="ar"
        style={{
          maxWidth: 940,
          padding: '14px 40px 22px',
          borderRadius: 30,
          background: 'rgba(12,10,24,0.84)',
          border: '3px solid rgba(255,255,255,0.12)',
          boxShadow: '0 12px 30px rgba(0,0,0,0.35)',
          fontFamily: FONT,
          fontWeight: 700,
          fontSize: 58,
          lineHeight: 1.55,
          textAlign: 'center',
          color: '#fff',
          transform: `scale(${0.9 + 0.1 * sc})`,
        }}
      >
        {words.map((w, i) => {
          const active = t >= w.s && t < w.e + 0.05;
          const done = t >= w.e;
          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                margin: '0 8px',
                color: active ? '#ffd54a' : done ? '#ffffff' : 'rgba(225,225,240,0.8)',
                transform: `translateY(${active ? -4 : 0}px)`,
                textShadow: active ? '0 0 18px rgba(255,213,74,0.55)' : 'none',
              }}
            >
              {w.w}
            </span>
          );
        })}
      </div>
    </div>
  );
};

export const Pop: React.FC<{age: number; x: number; y: number; rot?: number; children: React.ReactNode; life?: number}> = ({
  age,
  x,
  y,
  rot = 0,
  children,
  life = 99,
}) => {
  if (age < 0 || age > life) return null;
  const sc = pop(age / 0.3) * (life - age < 0.25 ? clamp01((life - age) / 0.25) : 1);
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${Math.max(0.01, sc)})`}}>{children}</div>
  );
};

export const Label: React.FC<{text: string; color: string; size?: number}> = ({text, color, size = 54}) => (
  <div
    dir="rtl"
    style={{
      fontFamily: FONT,
      fontWeight: 700,
      fontSize: size,
      color: '#fff',
      background: color,
      padding: `2px ${size * 0.6}px 10px`,
      borderRadius: 999,
      border: '5px solid #fff',
      whiteSpace: 'nowrap',
      boxShadow: '0 10px 0 rgba(0,0,0,0.22)',
    }}
  >
    {text}
  </div>
);

export const Vignette: React.FC<{strength?: number; color?: string}> = ({strength = 0.45, color = '10,6,24'}) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      background: `radial-gradient(ellipse at 50% 45%, rgba(${color},0) 50%, rgba(${color},${strength}) 100%)`,
    }}
  />
);
