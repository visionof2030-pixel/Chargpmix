import React from 'react';
import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';
import {clamp01, pop, W, H, Cam, toScreen, noise, T} from './lib';

export const FONT = 'Cairo';
loadFont({family: FONT, url: staticFile('Cairo-Bold.ttf'), weight: '700'});

const SHOUT = new Set(['S6', 'S7', 'S8', 'S4']);

/** Speech bubble in screen space. Tail tip points to (tipX, tipY). */
export const Bubble: React.FC<{
  id: string;
  age: number; // seconds since line start
  left: number; // seconds until hide
  name: string;
  color: string;
  tipX: number;
  tipY: number;
  top?: number;
  text?: string;
  shout?: boolean;
}> = ({id, age, left, name, color, tipX, tipY, top = 170, text: textOverride, shout: shoutOverride}) => {
  const text = textOverride ?? T.text[id];
  const inS = pop(age / 0.32);
  const outS = left < 0.15 ? clamp01(left / 0.15) : 1;
  const sc = Math.max(0.01, inS * outS);
  const shout = shoutOverride ?? SHOUT.has(id);
  const jx = shout ? noise(age * 3, 1) * 6 : 0;
  const jy = shout ? noise(age * 3, 7) * 6 : 0;
  const fs = text.length > 34 ? 50 : 56;
  const maxW = 860;
  const cx = Math.max(maxW / 2 + 40, Math.min(W - maxW / 2 - 40, tipX));
  const bottom = Math.max(top + 160, Math.min(tipY - 70, top + 420));
  const tailX = Math.max(cx - maxW / 2 + 90, Math.min(cx + maxW / 2 - 90, tipX));
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: W,
        height: H,
        transformOrigin: `${tipX}px ${tipY}px`,
        transform: `translate(${jx}px, ${jy}px) scale(${sc})`,
        opacity: clamp01(sc * 2),
      }}
    >
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <path
          d={`M ${tailX - 46} ${bottom - 30} L ${tailX + 46} ${bottom - 30} L ${tipX} ${tipY} Z`}
          fill="#fff"
          stroke={color}
          strokeWidth={10}
          strokeLinejoin="round"
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          left: cx - maxW / 2,
          width: maxW,
          bottom: H - bottom,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div
          dir="rtl"
          lang="ar"
          style={{
            position: 'relative',
            background: '#fff',
            border: `10px solid ${color}`,
            borderRadius: 54,
            padding: '34px 46px 30px',
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: fs,
            lineHeight: 1.5,
            color: '#2d1e3c',
            textAlign: 'center',
            boxShadow: '0 18px 0 rgba(40,20,60,0.18)',
            maxWidth: maxW,
          }}
        >
          {text}
          <div
            style={{
              position: 'absolute',
              top: -38,
              right: 34,
              background: color,
              color: '#fff',
              borderRadius: 40,
              padding: '2px 30px 6px',
              fontSize: 38,
              lineHeight: 1.4,
              boxShadow: '0 6px 0 rgba(0,0,0,0.15)',
            }}
          >
            {name}
          </div>
        </div>
      </div>
      {/* cover the tail join so it looks seamless */}
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <path d={`M ${tailX - 36} ${bottom - 20} L ${tailX + 36} ${bottom - 20} L ${tipX + (tailX - tipX) * 0.18} ${tipY + (bottom - tipY) * 0.18} Z`} fill="#fff" />
      </svg>
    </div>
  );
};

export type LineDef = {
  id: string;
  name: string;
  color: string;
  tip: (t: number) => {x: number; y: number}; // world coords
};

export const Bubbles: React.FC<{
  ev: Record<string, [number, number]>;
  t: number;
  cam: Cam;
  place: (id: string) => {name: string; color: string; x: number; y: number};
  texts?: Record<string, string>;
  shouts?: Set<string>;
}> = ({ev, t, cam, place, texts, shouts}) => {
  return (
    <>
      {Object.keys(ev).map((id) => {
        const [s, e] = ev[id];
        if (t < s || t >= e + 0.15) return null;
        const p = place(id);
        const sp = toScreen(cam, p.x, p.y);
        return (
          <Bubble
            key={id}
            id={id}
            age={t - s}
            left={e + 0.15 - t}
            name={p.name}
            color={p.color}
            tipX={sp.x}
            tipY={Math.max(330, sp.y)}
            text={texts?.[id]}
            shout={shouts ? shouts.has(id) : undefined}
          />
        );
      })}
    </>
  );
};

export const Pill: React.FC<{text: string; x: number; y: number; color: string; size?: number; age: number; left: number}> = ({
  text,
  x,
  y,
  color,
  size = 44,
  age,
  left,
}) => {
  const sc = pop(age / 0.35) * (left < 0.2 ? clamp01(left / 0.2) : 1);
  return (
    <div
      dir="rtl"
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, -50%) scale(${Math.max(0.01, sc)})`,
        background: color,
        color: '#fff',
        fontFamily: FONT,
        fontWeight: 700,
        fontSize: size,
        padding: `4px ${size * 0.8}px 10px`,
        borderRadius: 999,
        whiteSpace: 'nowrap',
        boxShadow: '0 8px 0 rgba(0,0,0,0.18)',
      }}
    >
      {text}
    </div>
  );
};

export const Pow: React.FC<{text: string; x: number; y: number; age: number; size?: number; fill?: string; stroke?: string; rot?: number}> = ({
  text,
  x,
  y,
  age,
  size = 120,
  fill = '#fff',
  stroke = '#50283a',
  rot = -8,
}) => {
  const sc = pop(age / 0.25);
  const fade = clamp01((0.95 - age) / 0.25);
  return (
    <div
      dir="rtl"
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${Math.max(0.01, sc)})`,
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

/** soft vignette + warm grade over everything */
export const Grade: React.FC<{tint?: string; strength?: number}> = ({tint = '#ffb070', strength = 0.06}) => (
  <>
    <div style={{position: 'absolute', inset: 0, background: tint, opacity: strength, mixBlendMode: 'soft-light'}} />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(30,10,40,0.35) 100%)',
      }}
    />
  </>
);

/** iris wipe between scenes, centred at frame of cut */
export const Iris: React.FC<{t: number; cuts: number[]; color?: string}> = ({t, cuts, color = '#ff6fa8'}) => {
  const D = 0.32;
  for (const c of cuts) {
    const d = Math.abs(t - c);
    if (d < D) {
      const k = d / D;
      const r = Math.pow(k, 1.6) * 1300;
      return (
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
          <defs>
            <mask id="iris">
              <rect width={W} height={H} fill="#fff" />
              <circle cx={W / 2} cy={H * 0.48} r={r} fill="#000" />
            </mask>
          </defs>
          <rect width={W} height={H} fill={color} mask="url(#iris)" />
          <circle cx={W / 2} cy={H * 0.48} r={r} fill="none" stroke="#fff" strokeWidth={18} opacity={0.9} />
        </svg>
      );
    }
  }
  return null;
};
