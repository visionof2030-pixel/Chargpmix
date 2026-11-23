import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Audio} from '@remotion/media';
import {FONT} from '../ui';
import {W, H, clamp01, pop, rnd, smooth} from '../tl';
import {Room} from './TarafAnim';

/* Taraf twirls using the 16-angle turnaround (pose images a01..a16).
   Neighbouring angles are cross-faded, so the spin looks continuous. */
const TOTAL = 10.0;
export const TARAF_SPIN_FRAMES = Math.round(TOTAL * 30);
// one full turn, in order (angles 4, 10 and 16 are skipped)
const RING = [1, 2, 3, 5, 6, 7, 9, 8, 11, 12, 13];

const SPINS = [
  {start: 2.0, dur: 1.2},
  {start: 3.5, dur: 0.75},
];

/** pose + blend for the current time */
const poseAt = (t: number): {a: number; b: number; k: number; spin: number} => {
  for (const sp of SPINS) {
    if (t >= sp.start && t < sp.start + sp.dur) {
      const u = smooth((t - sp.start) / sp.dur) * RING.length;
      const i = Math.floor(u) % RING.length;
      return {a: RING[i], b: RING[(i + 1) % RING.length], k: u - Math.floor(u), spin: (t - sp.start) / sp.dur};
    }
  }
  if (t >= 1.15 && t < 1.95) return {a: 14, b: 14, k: 0, spin: -1}; // looks up at the sparkles
  if (t >= 5.0 && t < 6.3) return {a: 15, b: 15, k: 0, spin: -1}; // shy look down
  return {a: 1, b: 1, k: 0, spin: -1};
};

const Pose: React.FC<{n: number; opacity: number; filter?: string}> = ({n, opacity, filter}) => (
  <Img
    src={staticFile(`turn/a${String(n).padStart(2, '0')}.png`)}
    style={{position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', opacity, filter}}
  />
);

export const TarafSpin: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const p = poseAt(t);
  const spinning = p.spin >= 0;
  // hop during the fast spin, gentle bounce for the slow one
  const fast = t >= SPINS[1].start && t < SPINS[1].start + SPINS[1].dur;
  const hop = spinning ? Math.sin(Math.PI * p.spin) * (fast ? 110 : 30) : 0;
  const land = t >= SPINS[1].start + SPINS[1].dur && t < SPINS[1].start + SPINS[1].dur + 0.25 ? Math.sin(((t - SPINS[1].start - SPINS[1].dur) / 0.25) * Math.PI) : 0;
  const breathe = 1 + Math.sin(t * 2.3) * 0.006;
  const sy = breathe * (1 - land * 0.05);
  const sx = 1 + land * 0.04;
  const BOX_W = 1100 * 0.92;
  const BOX_H = 2000 * 0.92;
  const left = W / 2 - BOX_W / 2;
  const top = H + 60 - BOX_H;
  const zoom = 1 + smooth(t / 9) * 0.06;
  const blurPx = spinning ? (fast ? 2.2 : 1) : 0;

  return (
    <AbsoluteFill style={{background: '#f2e1bd', overflow: 'hidden'}}>
      <div style={{position: 'absolute', inset: 0, transformOrigin: '50% 60%', transform: `scale(${zoom})`}}>
        <Room t={-1} />
        <div style={{position: 'absolute', left: W / 2 - 300, top: H - 70, width: 600, height: 70, borderRadius: '50%', background: 'rgba(60,40,20,0.2)', transform: `scale(${1 - hop / 300})`}} />
        <div
          style={{
            position: 'absolute',
            left,
            top,
            width: BOX_W,
            height: BOX_H,
            transformOrigin: '50% 100%',
            transform: `translateY(${-hop}px) scale(${sx}, ${sy})`,
          }}
        >
          <Pose n={p.a} opacity={1} filter={blurPx ? `blur(${blurPx}px)` : undefined} />
          {p.k > 0.01 ? <Pose n={p.b} opacity={p.k} filter={blurPx ? `blur(${blurPx}px)` : undefined} /> : null}
        </div>
        {/* sparkles: falling when she looks up, a ring of them on the fast twirl */}
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
          {Array.from({length: 18}).map((_, i) => {
            const st = 0.9 + rnd(i) * 0.6;
            const k = (t - st) / 1.8;
            if (k < 0 || k > 1) return null;
            const x = 260 + rnd(i + 4) * 560;
            const y = 120 + k * 700;
            return <path key={i} transform={`translate(${x},${y}) rotate(${k * 200}) scale(${0.8 + rnd(i + 2)})`} d="M 0 -18 L 5 -5 L 18 0 L 5 5 L 0 18 L -5 5 L -18 0 L -5 -5 Z" fill="#ffe27a" opacity={1 - k} />;
          })}
          {fast || (t >= SPINS[1].start + SPINS[1].dur && t < SPINS[1].start + SPINS[1].dur + 0.9)
            ? Array.from({length: 14}).map((_, i) => {
                const k = clamp01((t - SPINS[1].start) / 1.6);
                const a = (i / 14) * Math.PI * 2 + t * 6;
                const r = 260 + k * 160;
                return (
                  <path
                    key={`r${i}`}
                    transform={`translate(${W / 2 + Math.cos(a) * r},${1150 + Math.sin(a) * r * 0.35}) scale(${1 - k * 0.6})`}
                    d="M 0 -16 L 4 -4 L 16 0 L 4 4 L 0 16 L -4 4 L -16 0 L -4 -4 Z"
                    fill={i % 2 ? '#ff9ec4' : '#fff2a8'}
                    opacity={1 - k}
                  />
                );
              })
            : null}
        </svg>
      </div>
      {t >= 6.9 ? (
        <div dir="rtl" style={{position: 'absolute', top: 70, width: W, textAlign: 'center', fontFamily: FONT, fontWeight: 700, transform: `scale(${Math.max(0.01, pop((t - 6.9) / 0.5))})`}}>
          <div style={{fontSize: 220, color: '#ff3d86', WebkitTextStroke: '18px #fff', paintOrder: 'stroke fill', textShadow: '0 16px 0 #b8205c', lineHeight: 1.1}}>ترف</div>
          <div style={{fontSize: 70, color: '#5a3a7a', WebkitTextStroke: '8px #fff', paintOrder: 'stroke fill'}}>بطلة الحكاية</div>
        </div>
      ) : null}
      <div style={{position: 'absolute', inset: 0, background: '#000', opacity: Math.max(1 - clamp01(t / 0.5), clamp01((t - (TOTAL - 0.6)) / 0.6))}} />
      <Audio src={staticFile('turn/audio.wav')} />
    </AbsoluteFill>
  );
};
