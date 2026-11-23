import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Audio} from '@remotion/media';
import {FONT} from '../ui';
import {W, H, clamp01, lerp, pop, rnd, smooth} from '../tl';

/* Micro animation built from the drawn picture of Taraf (front + side).
   The picture is cut into head and body layers; we add breathing, blinks, a head tilt,
   a startle jump with squash, a turn to the side view, a listening lean and a wink. */

const TOTAL = 12.5;
export const TARAF_ANIM_FRAMES = Math.round(TOTAL * 30);

const SKIN_F = '#f6c193';
const SKIN_S = '#f8c595';
const OUT = '#3a2418';
const SCALE = 1.3;
const IMG_H = 1274;

const B = {
  knock: 4.0,
  turn: 4.6,
  back: 8.6,
  wink: 9.4,
  title: 9.8,
};

const Room: React.FC<{t: number}> = ({t}) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
    <defs>
      <linearGradient id="ta-wall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fbf0d6" />
        <stop offset="1" stopColor="#f2e1bd" />
      </linearGradient>
      <linearGradient id="ta-door" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#9fb5e0" />
        <stop offset="1" stopColor="#87a0d3" />
      </linearGradient>
      <pattern id="ta-carpet" width="46" height="46" patternUnits="userSpaceOnUse">
        <rect width="46" height="46" fill="#eadfc8" />
        <path d="M 0 23 l 12 -10 l 12 10 l 12 -10 l 12 10" stroke="#d8c8a8" strokeWidth="4" fill="none" />
      </pattern>
      <radialGradient id="ta-light" cx="0.35" cy="0.25" r="0.8">
        <stop offset="0" stopColor="#fff8e6" stopOpacity="0.7" />
        <stop offset="1" stopColor="#fff8e6" stopOpacity="0" />
      </radialGradient>
    </defs>
    <rect width={W} height={1380} fill="url(#ta-wall)" />
    {/* door on the right (it rattles on the knock) */}
    <g transform={`translate(${t >= B.knock && t < B.knock + 0.6 ? Math.sin(t * 90) * 4 * (1 - (t - B.knock) / 0.6) : 0},0)`}>
      <rect x={660} y={140} width={380} height={1250} fill="url(#ta-door)" stroke={OUT} strokeWidth={6} />
      <rect x={700} y={200} width={300} height={430} rx={8} fill="none" stroke="#7a92c4" strokeWidth={8} />
      <rect x={700} y={690} width={300} height={600} rx={8} fill="none" stroke="#7a92c4" strokeWidth={8} />
      <rect x={690} y={760} width={30} height={120} rx={10} fill="#e0b84a" stroke={OUT} strokeWidth={4} />
      <rect x={690} y={790} width={70} height={18} rx={9} fill="#f0cc5a" stroke={OUT} strokeWidth={3} />
    </g>
    <rect x={640} y={120} width={22} height={1270} fill="#f7ecd6" stroke={OUT} strokeWidth={4} />
    {/* power socket */}
    <rect x={120} y={330} width={110} height={70} rx={10} fill="#3a3a40" />
    <circle cx={160} cy={365} r={8} fill="#222" />
    <circle cx={190} cy={365} r={8} fill="#222" />
    {/* clothes pile + suitcase on the left */}
    <rect x={-40} y={1050} width={330} height={300} rx={24} fill="#f2e4c6" stroke={OUT} strokeWidth={5} />
    <circle cx={60} cy={1130} r={16} fill="#d8c8a8" stroke={OUT} strokeWidth={3} />
    <path d="M -20 1060 Q 60 960 160 1000 Q 230 960 290 1040 L 290 1070 L -20 1070 Z" fill="#3a3a44" stroke={OUT} strokeWidth={4} />
    <path d="M 120 990 Q 170 930 230 970 Q 250 1000 220 1020 Z" fill="#a46ad8" stroke={OUT} strokeWidth={4} />
    <ellipse cx={980} cy={1290} rx={170} ry={110} fill="#a8e04a" stroke={OUT} strokeWidth={5} />
    {Array.from({length: 10}).map((_, i) => (
      <circle key={i} cx={880 + rnd(i) * 200} cy={1220 + rnd(i + 3) * 140} r={9} fill="#ff8fa8" />
    ))}
    <path d="M 850 1220 Q 940 1150 1060 1200 L 1080 1240 Q 960 1210 860 1250 Z" fill="#3555c0" stroke={OUT} strokeWidth={4} />
    {/* floor */}
    <rect x={0} y={1380} width={W} height={H - 1380} fill="url(#ta-carpet)" />
    <rect x={0} y={1372} width={W} height={16} fill="#e6d2a8" stroke={OUT} strokeWidth={3} />
    <rect width={W} height={H} fill="url(#ta-light)" />
  </svg>
);

/** eyelid closing over an almond-shaped eye. k: 0 open .. 1 closed */
const Lid: React.FC<{id: string; cx: number; cy: number; rx: number; ry: number; k: number; skin: string}> = ({id, cx, cy, rx, ry, k, skin}) => {
  if (k <= 0.01) return null;
  const y = cy - ry - 4 + (ry * 2 + 8) * k;
  return (
    <g>
      <clipPath id={id}>
        <ellipse cx={cx} cy={cy} rx={rx + 4} ry={ry + 5} />
      </clipPath>
      <g clipPath={`url(#${id})`}>
        <rect x={cx - rx - 10} y={cy - ry - 20} width={rx * 2 + 20} height={y - (cy - ry - 20)} fill={skin} />
      </g>
      <path d={`M ${cx - rx - 4} ${y - 2} Q ${cx} ${y + 6 * k} ${cx + rx + 4} ${y - 2}`} stroke={OUT} strokeWidth={5} fill="none" strokeLinecap="round" />
      {k > 0.8 ? <path d={`M ${cx + rx} ${y - 2} l 8 -6 M ${cx - rx} ${y - 2} l -8 -6`} stroke={OUT} strokeWidth={3} strokeLinecap="round" /> : null}
    </g>
  );
};

const blinkAt = (t: number, times: number[]) => {
  let k = 0;
  for (const b of times) if (t >= b && t < b + 0.16) k = Math.max(k, Math.sin(((t - b) / 0.16) * Math.PI));
  return k;
};

export const TarafAnim: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;

  // which view: front -> side (squash through the turn) -> front
  const turnK = (t0: number) => clamp01((t - t0) / 0.3);
  let view: 'front' | 'side' = 'front';
  let sx = 1;
  if (t >= B.turn && t < B.back) {
    const k = turnK(B.turn);
    view = k < 0.5 ? 'front' : 'side';
    sx = Math.abs(1 - 2 * k) * 0.85 + 0.15;
  } else if (t >= B.back) {
    const k = turnK(B.back);
    view = k < 0.5 ? 'side' : 'front';
    sx = Math.abs(1 - 2 * k) * 0.85 + 0.15;
  }

  // body motion
  const breathe = 1 + Math.sin(t * 2.4) * 0.008;
  const startle = t >= B.knock + 0.08 && t < B.knock + 0.75 ? Math.sin(((t - B.knock - 0.08) / 0.67) * Math.PI) : 0;
  const land = t >= B.knock + 0.75 && t < B.knock + 0.95 ? Math.sin(((t - B.knock - 0.75) / 0.2) * Math.PI) : 0;
  const jumpY = -startle * 70;
  const squash = 1 + land * 0.05 - startle * 0.03;
  const listen = view === 'side' ? smooth((t - (B.turn + 0.5)) / 0.8) * (1 - smooth((t - (B.back - 0.4)) / 0.4)) : 0;
  const bodyLean = listen * 4 + Math.sin(t * 1.6) * 0.6;
  // head motion
  const tilt =
    view === 'front'
      ? (t < B.knock ? smooth((t - 2.0) / 0.6) * (1 - smooth((t - 3.3) / 0.6)) * 5 : 0) + (t >= B.wink - 0.2 ? smooth((t - B.wink + 0.2) / 0.4) * -6 : 0) + Math.sin(t * 1.3) * 0.8
      : listen * 7 + Math.sin(t * 3) * listen * 1.2;
  const headStartle = startle * -4;

  const isFront = view === 'front';
  const imgW = isFront ? 626 : 598;
  const pivot = isFront ? {x: 336, y: 345} : {x: 395, y: 330};
  const cx = W / 2 + (isFront ? 0 : -40);
  const bottom = H + 120;
  const left = cx - (imgW * SCALE) / 2;
  const top = bottom - IMG_H * SCALE;

  // camera
  const camZoom = lerp(1.0, 1.08, smooth(t / 4)) + (view === 'side' ? listen * 0.08 : 0) + (t >= B.title ? smooth((t - B.title) / 1.5) * 0.04 : 0);
  const camY = view === 'side' ? lerp(0, 90, listen) : 0;

  // faces
  const blink = blinkAt(t, [1.4, 3.05, 7.0, 11.2]);
  const wink = t >= B.wink && t < B.wink + 0.7 ? Math.sin(clamp01((t - B.wink) / 0.7) * Math.PI) * 1.4 : 0;
  const eyesF = [
    {cx: 296, cy: 206, rx: 23, ry: 15, k: blink},
    {cx: 377, cy: 206, rx: 23, ry: 15, k: Math.min(1, Math.max(blink, wink))},
  ];
  const eyeS = {cx: 428, cy: 203, rx: 18, ry: 14, k: blinkAt(t, [6.4, 7.6])};

  const headSrc = `tarafanim/${view}_head.png`;
  const bodySrc = `tarafanim/${view}_body.png`;

  const charStyle: React.CSSProperties = {
    position: 'absolute',
    left,
    top,
    width: imgW * SCALE,
    height: IMG_H * SCALE,
    transformOrigin: `${(imgW * SCALE) / 2}px ${IMG_H * SCALE}px`,
    transform: `translateY(${jumpY}px) scale(${sx * (2 - squash)}, ${squash}) rotate(${bodyLean}deg)`,
  };
  const layerBox: React.CSSProperties = {position: 'absolute', left: 0, top: 0, width: imgW * SCALE, height: IMG_H * SCALE};

  return (
    <AbsoluteFill style={{background: '#f2e1bd', overflow: 'hidden'}}>
      <div style={{position: 'absolute', inset: 0, transformOrigin: '50% 55%', transform: `scale(${camZoom}) translateY(${camY}px)`}}>
        <Room t={t} />
        {/* soft contact shadow */}
        <div style={{position: 'absolute', left: cx - 260, top: 1880, width: 520, height: 60, borderRadius: '50%', background: 'rgba(60,40,20,0.18)', transform: `scale(${1 - startle * 0.3})`}} />
        <div style={charStyle}>
          {/* body */}
          <div style={{...layerBox, transformOrigin: `50% 100%`, transform: `scaleY(${breathe})`}}>
            <Img src={staticFile(bodySrc)} style={{width: '100%', height: '100%'}} />
          </div>
          {/* head (+ hair) with its own tilt around the neck */}
          <div style={{...layerBox, transformOrigin: `${pivot.x * SCALE}px ${pivot.y * SCALE}px`, transform: `rotate(${tilt + headStartle}deg) translateY(${(1 - breathe) * 600}px)`}}>
            <Img src={staticFile(headSrc)} style={{width: '100%', height: '100%'}} />
            <svg width={imgW * SCALE} height={IMG_H * SCALE} viewBox={`0 0 ${imgW} ${IMG_H}`} style={{position: 'absolute', inset: 0}}>
              {isFront ? (
                <>
                  {eyesF.map((e, i) => (
                    <Lid key={i} id={`ta-lid${i}`} {...e} skin={SKIN_F} />
                  ))}
                  {/* little "o" of surprise on the knock */}
                  {startle > 0.15 ? <ellipse cx={336} cy={283} rx={14} ry={10 + startle * 8} fill="#a8404a" stroke={OUT} strokeWidth={3} /> : null}
                  {/* blush on the wink */}
                  {t >= B.wink ? (
                    <>
                      <ellipse cx={272} cy={252} rx={26} ry={12} fill="#ff8a8a" opacity={0.35 * clamp01((t - B.wink) / 0.3)} />
                      <ellipse cx={400} cy={252} rx={26} ry={12} fill="#ff8a8a" opacity={0.35 * clamp01((t - B.wink) / 0.3)} />
                    </>
                  ) : null}
                </>
              ) : (
                <Lid id="ta-lids" {...eyeS} skin={SKIN_S} />
              )}
            </svg>
          </div>
        </div>
      </div>
      {/* knock text near the door */}
      {t >= B.knock && t < B.knock + 1.4 ? (
        <div
          dir="rtl"
          style={{
            position: 'absolute',
            left: 640,
            top: 640,
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: 110,
            whiteSpace: 'nowrap',
            color: '#fff',
            WebkitTextStroke: '12px #2a3a7a',
            paintOrder: 'stroke fill',
            transform: `rotate(-8deg) scale(${pop((t - B.knock) / 0.25) * (1 - clamp01((t - B.knock - 1.1) / 0.3))})`,
          }}
        >
          طَق طَق!
        </div>
      ) : null}
      {/* listening "?" */}
      {view === 'side' && t >= B.turn + 1.2
        ? [0, 1].map((i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: 760 + i * 100,
                top: 300 - i * 60 + Math.sin(t * 3 + i) * 10,
                fontFamily: FONT,
                fontWeight: 700,
                fontSize: 130 - i * 30,
                color: '#ffd54a',
                WebkitTextStroke: '9px #3a2418',
                paintOrder: 'stroke fill',
                transform: `scale(${pop((t - B.turn - 1.2 - i * 0.3) / 0.3)})`,
              }}
            >
              ؟
            </div>
          ))
        : null}
      {/* wink sparkle + title */}
      {t >= B.wink + 0.1 ? (
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
          {Array.from({length: 6}).map((_, i) => {
            const k = clamp01((t - B.wink - 0.1 - i * 0.05) / 0.6);
            const a = (i / 6) * Math.PI * 2;
            return (
              <path
                key={i}
                transform={`translate(${640 + Math.cos(a) * 60 * k},${560 + Math.sin(a) * 60 * k}) scale(${(1 - k) * 1.4})`}
                d="M 0 -20 L 5 -5 L 20 0 L 5 5 L 0 20 L -5 5 L -20 0 L -5 -5 Z"
                fill="#ffe27a"
              />
            );
          })}
        </svg>
      ) : null}
      {t >= B.title ? (
        <div
          dir="rtl"
          style={{
            position: 'absolute',
            top: 40,
            width: W,
            textAlign: 'center',
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: 220,
            color: '#ff3d86',
            WebkitTextStroke: '18px #ffffff',
            paintOrder: 'stroke fill',
            textShadow: '0 16px 0 #b8205c',
            transform: `scale(${Math.max(0.01, pop((t - B.title) / 0.5))}) rotate(${Math.sin(t * 3) * 2}deg)`,
          }}
        >
          ترف
        </div>
      ) : null}
      <div style={{position: 'absolute', inset: 0, background: '#000', opacity: Math.max(1 - clamp01(t / 0.5), clamp01((t - (TOTAL - 0.6)) / 0.6))}} />
      <Audio src={staticFile('tarafanim/audio.wav')} />
    </AbsoluteFill>
  );
};
