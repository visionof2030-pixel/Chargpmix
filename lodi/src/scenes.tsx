import React from 'react';
import {AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Audio} from '@remotion/media';
import {Lodi, Expr, KIT_COLORS} from './Lodi';
import {Label, Pop, Subtitles, Vignette, World, FONT} from './ui';
import {Cam, FLOOR, H, W, clamp01, easeOut, lerp, mouthAt, noise, on, rnd, scene, smooth, wordAt} from './lib';

const OUT = '#2a1d24';

const useT = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return frame / fps;
};

const SceneAudio: React.FC<{src: string}> = ({src}) => <Audio src={staticFile(src)} />;

/** pick the expression whose cue time was passed most recently */
const exprAt = (t: number, cues: [number, Expr][]): Expr => {
  let e: Expr = cues[0][1];
  for (const [ts, ex] of cues) if (t >= ts) e = ex;
  return e;
};

// ======================================================================= bedroom (scenes 1-2)
const Bedroom: React.FC<{t: number; dim: number; clock: number; trophyGlint: number; wardrobeOpen?: number; showWardrobe?: boolean; buried?: number}> = ({
  t,
  dim,
  clock,
  trophyGlint,
  wardrobeOpen = 0,
  showWardrobe = false,
  buried = 0,
}) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
    <defs>
      <linearGradient id="bw" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#2a2d63" />
        <stop offset="1" stopColor="#3f3a7a" />
      </linearGradient>
      <radialGradient id="lampGlow" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#ffd98a" stopOpacity="0.85" />
        <stop offset="1" stopColor="#ffd98a" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="moonGlow" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#dfe8ff" stopOpacity="0.8" />
        <stop offset="1" stopColor="#dfe8ff" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="bwood" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#6b4a3a" />
        <stop offset="0.5" stopColor="#8a634d" />
        <stop offset="1" stopColor="#5e4032" />
      </linearGradient>
      <linearGradient id="sheet" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#4a78d8" />
        <stop offset="1" stopColor="#2f56aa" />
      </linearGradient>
      <linearGradient id="bfl" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#5a4067" />
        <stop offset="1" stopColor="#3b2a47" />
      </linearGradient>
    </defs>
    <rect width={W} height={FLOOR - 120} fill="url(#bw)" />
    {Array.from({length: 40}).map((_, i) => (
      <circle key={i} cx={rnd(i) * W} cy={rnd(i + 9) * 1300} r={2 + rnd(i + 3) * 3} fill="#fff" opacity={0.08 + 0.06 * Math.sin(t + i)} />
    ))}
    {/* window + moon */}
    <rect x={70} y={300} width={330} height={440} rx={14} fill="#0f1438" stroke="#d8d4f0" strokeWidth={16} />
    <circle cx={290} cy={420} r={150} fill="url(#moonGlow)" />
    <circle cx={290} cy={420} r={56} fill="#f4f1ff" />
    <circle cx={312} cy={404} r={50} fill="#0f1438" />
    {Array.from({length: 12}).map((_, i) => (
      <circle key={i} cx={100 + rnd(i + 30) * 270} cy={330 + rnd(i + 50) * 380} r={2 + rnd(i) * 2} fill="#fff" opacity={0.4 + 0.6 * Math.abs(Math.sin(t * 2 + i))} />
    ))}
    <line x1={235} y1={300} x2={235} y2={740} stroke="#d8d4f0" strokeWidth={10} />
    <path d={`M 50 290 L 130 290 Q ${110 + Math.sin(t) * 6} 520 ${140 + Math.sin(t) * 8} 780 L 50 780 Z`} fill="#5a4fa8" stroke={OUT} strokeWidth={5} />
    <path d={`M 420 290 L 340 290 Q ${360 + Math.sin(t + 1) * 6} 520 ${330 + Math.sin(t + 1) * 8} 780 L 420 780 Z`} fill="#5a4fa8" stroke={OUT} strokeWidth={5} />
    <rect x={40} y={276} width={400} height={22} rx={11} fill="#c9b6ff" stroke={OUT} strokeWidth={4} />

    {/* trophy shelf */}
    <rect x={500} y={520} width={440} height={22} rx={6} fill="#8a634d" stroke={OUT} strokeWidth={5} />
    {[0, 1, 2, 3, 4].map((i) => {
      const x = 540 + i * 88;
      const g = trophyGlint > 0 ? Math.max(0, Math.sin((trophyGlint - i * 0.12) * Math.PI)) : 0;
      return (
        <g key={i} transform={`translate(${x},520)`}>
          <path d="M -24 -96 L 24 -96 Q 26 -56 0 -46 Q -26 -56 -24 -96 Z" fill="#f2c14e" stroke={OUT} strokeWidth={4} />
          <path d="M -24 -90 q -18 4 -12 22 M 24 -90 q 18 4 12 22" stroke="#f2c14e" strokeWidth={6} fill="none" />
          <rect x={-6} y={-46} width={12} height={22} fill="#d9a43a" />
          <rect x={-20} y={-26} width={40} height={18} rx={4} fill="#6b4a3a" stroke={OUT} strokeWidth={3} />
          {g > 0 ? <path d="M 0 -130 L 6 -112 L 24 -110 L 8 -100 L 12 -82 L 0 -92 L -12 -82 L -8 -100 L -24 -110 L -6 -112 Z" fill="#fff6c2" opacity={g} /> : null}
        </g>
      );
    })}
    {/* poster */}
    <g transform="translate(560,640) rotate(-3)">
      <rect width={200} height={250} rx={10} fill="#1d55cc" stroke={OUT} strokeWidth={5} />
      <circle cx={100} cy={110} r={60} fill="#fff" stroke={OUT} strokeWidth={4} />
      <path d="M 100 60 L 112 96 L 150 96 L 118 118 L 130 154 L 100 132 L 70 154 L 82 118 L 50 96 L 88 96 Z" fill="#1d55cc" opacity={0.85} />
      <rect x={30} y={196} width={140} height={22} rx={11} fill="#fff" opacity={0.85} />
    </g>

    {/* wardrobe (scene 2) */}
    {showWardrobe ? (
      <g>
        <rect x={600} y={420} width={440} height={FLOOR - 400} rx={10} fill="url(#bwood)" stroke={OUT} strokeWidth={7} />
        <rect x={622} y={440} width={396} height={FLOOR - 460} fill="#2e2030" />
        {/* shelves + clothes inside */}
        {[600, 820, 1040, 1260].map((y, i) => (
          <g key={i}>
            <rect x={622} y={y} width={396} height={16} fill="#8a634d" stroke={OUT} strokeWidth={3} />
            {i > 0
              ? [0, 1, 2].map((k) => (
                  <rect
                    key={k}
                    x={650 + k * 120}
                    y={y - 70}
                    width={100}
                    height={66}
                    rx={10}
                    fill={i === 3 && k === 1 ? KIT_COLORS.ahli.shirt : ['#e8e2d8', '#8fa3c8', '#c9a27a', '#ffffff'][(i + k) % 4]}
                    stroke={OUT}
                    strokeWidth={4}
                  />
                ))
              : null}
          </g>
        ))}
        {/* top shelf: the buried blue kit */}
        {buried > 0 ? (
          <g transform={`translate(${lerp(760, 940, buried)},${lerp(520, 560, buried)}) scale(${lerp(1, 0.8, buried)})`}>
            <rect x={-60} y={-40} width={120} height={70} rx={12} fill={KIT_COLORS.hilal.shirt} stroke={OUT} strokeWidth={4} />
            <path d="M -30 -40 L 0 -12 L 30 -40" stroke="#fff" strokeWidth={8} fill="none" />
          </g>
        ) : null}
        {/* doors */}
        <rect x={622} y={440} width={198 * (1 - wardrobeOpen * 0.85)} height={FLOOR - 460} fill="url(#bwood)" stroke={OUT} strokeWidth={5} />
        <rect x={1018 - 198 * (1 - wardrobeOpen * 0.85)} y={440} width={198 * (1 - wardrobeOpen * 0.85)} height={FLOOR - 460} fill="url(#bwood)" stroke={OUT} strokeWidth={5} />
        {wardrobeOpen < 0.5 ? (
          <>
            <rect x={800} y={980} width={10} height={90} rx={5} fill="#f2c14e" stroke={OUT} strokeWidth={3} />
            <rect x={830} y={980} width={10} height={90} rx={5} fill="#f2c14e" stroke={OUT} strokeWidth={3} />
          </>
        ) : null}
      </g>
    ) : null}

    {/* nightstand + lamp + clock */}
    {!showWardrobe ? (
      <g>
        <circle cx={930} cy={1080} r={260} fill="url(#lampGlow)" opacity={0.75 - dim * 0.45} />
        <rect x={830} y={1180} width={210} height={300} rx={12} fill="url(#bwood)" stroke={OUT} strokeWidth={6} />
        <rect x={850} y={1260} width={170} height={70} rx={8} fill="none" stroke="#4a3228" strokeWidth={5} />
        <path d="M 880 1040 L 980 1040 L 960 1110 L 900 1110 Z" fill="#ffd98a" stroke={OUT} strokeWidth={5} />
        <rect x={922} y={1110} width={16} height={70} fill="#c9a27a" stroke={OUT} strokeWidth={3} />
        <rect x={860} y={1130} width={60} height={46} rx={8} fill="#1a1a22" stroke={OUT} strokeWidth={4} />
        <text x={890} y={1164} fontFamily="Cairo" fontWeight={700} fontSize={26} fill="#ff4a4a" textAnchor="middle" opacity={0.5 + clock * 0.5}>
          ٣:٠٠
        </text>
      </g>
    ) : null}

    {/* bed */}
    {!showWardrobe ? (
      <g>
        <rect x={130} y={1000} width={36} height={500} rx={12} fill="url(#bwood)" stroke={OUT} strokeWidth={5} />
        <rect x={110} y={980} width={680} height={60} rx={24} fill="url(#bwood)" stroke={OUT} strokeWidth={6} />
        <rect x={150} y={1290} width={640} height={150} rx={30} fill="url(#sheet)" stroke={OUT} strokeWidth={6} />
        <ellipse cx={300} cy={1270} rx={120} ry={50} fill="#e8ecff" stroke={OUT} strokeWidth={5} />
        <path d="M 180 1340 q 60 30 120 0 q 60 -30 120 0 q 60 30 120 0 q 60 -30 120 0" stroke="#7ea0ec" strokeWidth={8} fill="none" />
        <rect x={140} y={1430} width={660} height={60} rx={16} fill="#e8ecff" stroke={OUT} strokeWidth={5} />
      </g>
    ) : null}

    {/* floor */}
    <rect x={0} y={FLOOR - 120} width={W} height={H - FLOOR + 120} fill="url(#bfl)" />
    <ellipse cx={500} cy={FLOOR + 30} rx={420} ry={80} fill="#6a5a9a" stroke={OUT} strokeWidth={4} opacity={0.9} />
    <rect width={W} height={H} fill="#05030f" opacity={dim * 0.35} />
  </svg>
);

// ----------------------------------------------------------------------- scene 1: confession
export const Scene1: React.FC = () => {
  const t = useT();
  const sd = scene('s1');
  const w = (k: string, n = 0) => wordAt(sd, k, n);
  const tHilali = w('هلالي');
  const tWathiq = w('واثق');
  const tBotolat = w('بطولاتي');
  const tYhimni = w('يهمني');
  const tNathari = w('النظري');
  const tHaqiqa = w('الحقيقة', 0);
  const tAnam = w('أنام');
  const tNassr = w('النصر');
  const tSadri = w('صدري');
  const tRajfa = w('رجفة');
  const tDunya = w('الدنيا');

  const expr = exprAt(t, [
    [0, 'neutral'],
    [w('أيوه'), 'happy'],
    [tWathiq, 'smug'],
    [tNathari, 'confused'],
    [tHaqiqa, 'worried'],
    [tSadri, 'nervous'],
    [tDunya, 'shock'],
  ]);
  const dim = smooth((t - tHaqiqa) / 1.2);
  const chest = on(t, tSadri, tRajfa + 0.4) || on(t, tHilali, tHilali + 1.0);
  const shrug = on(t, tNathari - 0.3, tHaqiqa);
  const dismiss = on(t, tYhimni, tYhimni + 0.9);
  const wave = on(t, 0.9, 2.4);
  const knees = t >= tRajfa ? 1 : 0;
  const doom = clamp01((t - tDunya) / 0.6);
  const shake = doom * 14 + knees * 2;

  const cam: Cam = {
    zoom: lerp(1.0, 1.16, smooth(t / 14)) + doom * 0.12,
    cx: 470,
    cy: lerp(1060, 1010, smooth(t / 14)),
    sx: noise(t * 3, 1) * shake,
    sy: noise(t * 3, 4) * shake,
  };
  return (
    <AbsoluteFill style={{background: '#1b1840', overflow: 'hidden'}}>
      <World cam={cam}>
        <Bedroom t={t} dim={dim} clock={on(t, tAnam - 0.2, tSadri) ? 1 : 0} trophyGlint={on(t, tBotolat, tBotolat + 1.6) ? (t - tBotolat) / 0.8 : 0} />
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
          <Lodi
            id="l1"
            x={470}
            y={FLOOR}
            s={1.0}
            t={t}
            kit="hilal"
            sit
            expr={expr}
            mouth={mouthAt(sd, t)}
            armL={shrug ? 60 : 10}
            bendL={shrug ? 50 : -40}
            armR={chest ? 38 : wave ? 140 + Math.sin(t * 10) * 15 : shrug ? 60 : dismiss ? 70 + Math.sin(t * 12) * 20 : 10}
            bendR={chest ? -125 : wave ? 20 : shrug ? 50 : -40}
            kneeShake={knees}
            look={t >= tHaqiqa ? Math.sin(t * 1.4) * 0.6 : 0}
            headTilt={shrug ? -8 : t >= tDunya ? noise(t, 2) * 3 : 0}
            blinkSeed={1}
          />
        </svg>
      </World>
      {/* the rival's colours creep in when the match is mentioned */}
      <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 80% 20%, rgba(255,214,0,0.35), rgba(255,214,0,0) 60%)', opacity: on(t, tNassr, tSadri) ? 0.4 + 0.3 * Math.sin(t * 6) : 0}} />
      <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 45%, rgba(120,0,0,0) 35%, rgba(150,0,20,0.6) 100%)', opacity: doom * (0.7 + 0.3 * Math.sin(t * 9))}} />
      <Pop age={t - tAnam} x={820} y={520} life={tSadri - tAnam}>
        <Label text="الساعة ٣ الفجر.. ولا نوم" color="#3b2a6b" size={44} />
      </Pop>
      <Pop age={t - tRajfa} x={760} y={1250} rot={-8} life={2.2}>
        <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 70, color: '#fff', WebkitTextStroke: '8px #6b1a2a', paintOrder: 'stroke fill'}}>رجفة!</div>
      </Pop>
      <Vignette strength={0.5} />
      <Subtitles sd={sd} t={t} />
      <SceneAudio src={sd.audio} />
      {/* fade-in at the very start */}
      <div style={{position: 'absolute', inset: 0, background: '#000', opacity: 1 - clamp01(t / 0.6)}} />
    </AbsoluteFill>
  );
};

// ----------------------------------------------------------------------- scene 2: the wardrobe
export const Scene2: React.FC = () => {
  const t = useT();
  const sd = scene('s2');
  const w = (k: string) => wordAt(sd, k);
  const tGo = w('أروح');
  const tWardrobe = w('الدولاب');
  const tBury = w('أدفن');
  const tLast = w('رف');
  const tPull = w('وأطلع');
  const tToday = w('اليوم');

  const x = t < tGo ? 300 : lerp(300, 470, smooth((t - tGo) / 1.2));
  const walking = on(t, tGo, tGo + 1.2);
  const open = smooth((t - tWardrobe - 0.2) / 0.7);
  const holdBlue = on(t, tBury - 0.4, tLast + 0.4);
  const buried = smooth((t - tLast) / 0.5);
  const holdGreen = t >= tPull + 0.3;
  const raise = holdGreen ? clamp01((t - tPull - 0.3) / 0.5) : 0;
  const expr = exprAt(t, [
    [0, 'confused'],
    [tGo, 'determined'],
    [tBury, 'sad'],
    [tPull, 'sly'],
    [tToday, 'smug'],
  ]);
  const shirtProp = (color: string, big = false) => (
    <g transform={`translate(0,${big ? -70 : -20}) scale(${big ? 1.25 : 0.8})`}>
      <path d="M -70 -60 L -30 -78 Q 0 -62 30 -78 L 70 -60 L 92 -20 L 60 -8 L 56 90 L -56 90 L -60 -8 L -92 -20 Z" fill={color} stroke={OUT} strokeWidth={5} strokeLinejoin="round" />
      <path d="M -30 -78 L 0 -44 L 30 -78" stroke="#fff" strokeWidth={8} fill="none" />
      <path d="M -56 70 L 56 70" stroke="#fff" strokeWidth={6} opacity={0.6} />
    </g>
  );
  const cam: Cam = {zoom: lerp(1.04, 1.12, smooth(t / 16)), cx: 600, cy: 1040};
  return (
    <AbsoluteFill style={{background: '#1b1840', overflow: 'hidden'}}>
      <World cam={cam}>
        <Bedroom t={t} dim={0.3} clock={0} trophyGlint={0} showWardrobe wardrobeOpen={open} buried={buried} />
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
          <Lodi
            id="l2"
            x={x}
            y={FLOOR}
            s={0.95}
            t={t}
            kit="hilal"
            walk={walking}
            expr={expr}
            mouth={mouthAt(sd, t)}
            armL={t < tGo ? 60 : 10}
            bendL={t < tGo ? 40 : 8}
            armR={holdBlue ? lerp(60, 165, smooth((t - tBury) / 1.0)) : holdGreen ? lerp(40, 150, raise) : t < tGo ? 60 : on(t, tWardrobe, tBury) ? 70 : 12}
            bendR={holdBlue || holdGreen ? 10 : t < tGo ? 40 : 30}
            propR={holdBlue && buried < 0.5 ? shirtProp(KIT_COLORS.hilal.shirt) : holdGreen ? shirtProp(KIT_COLORS.ahli.shirt, true) : undefined}
            look={t >= tGo ? 1 : 0}
            lookY={holdBlue ? -1 : 0}
            headTilt={t < tGo ? -10 : holdGreen ? 6 : 0}
            blinkSeed={2}
          />
          {holdGreen
            ? Array.from({length: 8}).map((_, i) => {
                const a = (i / 8) * Math.PI * 2 + t * 1.5;
                const r = 170 + Math.sin(t * 5 + i) * 20;
                return (
                  <path
                    key={i}
                    transform={`translate(${x + 300 + Math.cos(a) * r},${700 + Math.sin(a) * r}) scale(${0.6 + 0.4 * Math.abs(Math.sin(t * 4 + i))})`}
                    d="M 0 -24 L 6 -6 L 24 0 L 6 6 L 0 24 L -6 6 L -24 0 L -6 -6 Z"
                    fill="#fff8c2"
                    opacity={raise}
                  />
                );
              })
            : null}
        </svg>
      </World>
      <Pop age={t - (tLast + 0.2)} x={850} y={430} rot={-6} life={1.6}>
        <Label text="آخر رف.. للأبد" color="#1d55cc" size={44} />
      </Pop>
      <Vignette strength={0.45} />
      <Subtitles sd={sd} t={t} />
      <SceneAudio src={sd.audio} />
    </AbsoluteFill>
  );
};

// ----------------------------------------------------------------------- scene 3: the mirror
const Hallway: React.FC<{t: number}> = ({t}) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
    <defs>
      <linearGradient id="hw3" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f5e6d3" />
        <stop offset="1" stopColor="#e6cfb4" />
      </linearGradient>
      <radialGradient id="spot3" cx="0.5" cy="0.4" r="0.6">
        <stop offset="0" stopColor="#fff7e0" stopOpacity="0.9" />
        <stop offset="1" stopColor="#fff7e0" stopOpacity="0" />
      </radialGradient>
    </defs>
    <rect width={W} height={H} fill="url(#hw3)" />
    {Array.from({length: 14}).map((_, i) => (
      <line key={i} x1={i * 80} y1={0} x2={i * 80} y2={FLOOR - 120} stroke="#e3cdb2" strokeWidth={30} opacity={0.5} />
    ))}
    <circle cx={540} cy={520} r={520} fill="url(#spot3)" />
    <rect x={0} y={1200} width={W} height={FLOOR - 120 - 1200} fill="#d9bfa0" />
    <rect x={0} y={1190} width={W} height={18} fill="#fffaf2" stroke={OUT} strokeWidth={3} />
    <path d="M 500 230 L 580 230 L 560 300 L 520 300 Z" fill="#ffd98a" stroke={OUT} strokeWidth={4} />
    <line x1={540} y1={0} x2={540} y2={230} stroke={OUT} strokeWidth={4} />
    <rect x={0} y={FLOOR - 120} width={W} height={H} fill="#a98a6d" />
    {Array.from({length: 9}).map((_, i) => (
      <line key={i} x1={i * 135 - 40} y1={FLOOR - 120} x2={(i * 135 - 580) * 1.6 + 540} y2={H} stroke="#8a6d52" strokeWidth={4} />
    ))}
    <rect x={0} y={0} width={W} height={H} fill="#fff" opacity={0.03 + 0.02 * Math.sin(t)} />
  </svg>
);

export const Scene3: React.FC = () => {
  const t = useT();
  const sd = scene('s3');
  const w = (k: string) => wordAt(sd, k);
  const tVs = w('ضد');
  const tLook = w('شوفوني');
  const tShorts = w('الشورت');
  const tSocks = w('والشراب');
  const tShirt = w('والتيشيرت');
  const tWhy = w('ليه');
  const tOath = w('والله');
  const tDont = w('أعرف');

  const present = on(t, tLook, tShorts);
  const why = on(t, tWhy, tOath);
  const oath = on(t, tOath, tDont);
  const expr = exprAt(t, [
    [0, 'neutral'],
    [tLook, 'happy'],
    [tShorts, 'smug'],
    [tWhy, 'confused'],
    [tOath, 'determined'],
    [tDont, 'confused'],
  ]);
  const armL = present ? 120 : why ? 70 : on(t, tShorts, tSocks) ? 30 : 12;
  const armR = oath ? 155 : present ? 120 : why ? 70 : on(t, tShirt, tWhy) ? 40 : on(t, tSocks, tShirt) ? 18 : 12;
  const bendR = oath ? -10 : on(t, tShirt, tWhy) ? -120 : why ? 50 : 20;
  const bendL = why ? 50 : on(t, tShorts, tSocks) ? -40 : 20;
  const hop = present ? Math.abs(Math.sin((t - tLook) * 8)) * 26 * clamp01(1 - (t - tLook) / 1.2) : 0;
  const LX = 300;
  const MX = 790; // mirror centre
  const lodi = (id: string, mirrored: boolean) => (
    <Lodi
      id={id}
      x={0}
      y={0}
      s={0.92}
      t={t}
      kit="ahli"
      expr={expr}
      mouth={mouthAt(sd, t)}
      armL={mirrored ? armR : armL}
      armR={mirrored ? armL : armR}
      bendL={mirrored ? bendR : bendL}
      bendR={mirrored ? bendL : bendR}
      bob={hop}
      look={mirrored ? -0.6 : 0.6}
      headTilt={why ? -8 : 0}
      blinkSeed={3}
      glare={(t * 0.2) % 1}
    />
  );
  const cam: Cam = {zoom: lerp(1.0, 1.08, smooth(t / 10)), cx: 540, cy: 1000};
  return (
    <AbsoluteFill style={{background: '#e6cfb4', overflow: 'hidden'}}>
      <World cam={cam}>
        <Hallway t={t} />
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
          <defs>
            <clipPath id="mirror">
              <rect x={590} y={340} width={400} height={1160} rx={190} />
            </clipPath>
            <linearGradient id="mglass" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#d9eef5" />
              <stop offset="1" stopColor="#a9c9d6" />
            </linearGradient>
          </defs>
          {/* mirror */}
          <rect x={570} y={320} width={440} height={1200} rx={210} fill="#c9a24e" stroke={OUT} strokeWidth={7} />
          <rect x={590} y={340} width={400} height={1160} rx={190} fill="url(#mglass)" />
          <g clipPath="url(#mirror)">
            <rect x={590} y={340} width={400} height={1160} fill="#e9d6bd" opacity={0.6} />
            <g transform={`translate(${MX},${FLOOR - 80}) scale(-0.86,0.86)`}>{lodi('l3m', true)}</g>
            <rect x={590} y={340} width={400} height={1160} fill="#bfe3ee" opacity={0.18} />
            <path d={`M ${640 + ((t * 120) % 600)} 300 l 60 0 l -260 1300 l -60 0 Z`} fill="#fff" opacity={0.22} />
          </g>
          <g transform={`translate(${LX},${FLOOR})`}>{lodi('l3', false)}</g>
        </svg>
      </World>
      <Pop age={t - tVs} x={540} y={200} life={tLook - tVs + 0.8}>
        <div dir="rtl" style={{display: 'flex', gap: 18, alignItems: 'center', fontFamily: FONT, fontWeight: 700, fontSize: 58}}>
          <span style={{background: '#ffd400', color: '#16234a', padding: '0 30px 8px', borderRadius: 999, border: '5px solid #fff'}}>النصر</span>
          <span style={{color: '#fff', WebkitTextStroke: '6px #2a1d24', paintOrder: 'stroke fill', fontSize: 64}}>×</span>
          <span style={{background: KIT_COLORS.ahli.shirt, color: '#fff', padding: '0 30px 8px', borderRadius: 999, border: '5px solid #fff'}}>الأهلي</span>
        </div>
      </Pop>
      <Pop age={t - tShorts} x={140} y={1180} rot={-6} life={tWhy - tShorts}>
        <Label text="الشورت ✓" color={KIT_COLORS.ahli.shirt} size={44} />
      </Pop>
      <Pop age={t - tSocks} x={150} y={1340} rot={5} life={tWhy - tSocks}>
        <Label text="الشراب ✓" color={KIT_COLORS.ahli.shirt} size={44} />
      </Pop>
      <Pop age={t - tShirt} x={170} y={760} rot={-4} life={tWhy - tShirt}>
        <Label text="التيشيرت ✓" color={KIT_COLORS.ahli.shirt} size={44} />
      </Pop>
      {t >= tDont
        ? ['؟', '؟', '؟'].map((q, i) => (
            <Pop key={i} age={t - tDont - i * 0.15} x={180 + i * 120} y={480 - i * 40 + Math.sin(t * 3 + i) * 10} rot={-10 + i * 10}>
              <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 110, color: '#ffd54a', WebkitTextStroke: '8px #2a1d24', paintOrder: 'stroke fill'}}>{q}</div>
            </Pop>
          ))
        : null}
      <Vignette strength={0.3} />
      <Subtitles sd={sd} t={t} />
      <SceneAudio src={sd.audio} />
    </AbsoluteFill>
  );
};

// ----------------------------------------------------------------------- scene 4: the car
export const Scene4: React.FC = () => {
  const t = useT();
  const sd = scene('s4');
  const w = (k: string, n = 0) => wordAt(sd, k, n);
  const tStart = w('شغّلت');
  const tPaid = w('دفعت');
  const tHesitate = w('ترددت');
  const tKm = w('سبعين');
  const tNassr = w('النصر');
  const tNot = w('مو');
  const tThere = w('هناك');
  const engine = smooth((t - tStart - 0.3) / 0.5);
  const drive = clamp01((t - tStart - 0.6) / 1.5);
  const speed = 900 * drive;
  const expr = exprAt(t, [
    [0, 'neutral'],
    [tHesitate, 'determined'],
    [tNot, 'sly'],
    [tThere, 'determined'],
  ]);
  const headShake = on(t, tNot, tThere) ? Math.sin(t * 9) * 6 : 0;
  // street lights sweeping across the cabin
  const sweepP = (t * 0.9) % 1;
  const rumble = engine * (1 - drive * 0.6) * 3 + drive * 1.2;
  const cam: Cam = {zoom: lerp(1.0, 1.1, smooth((t - tThere) / 1.5)), cx: 540, cy: 960, sx: noise(t * 4, 1) * rumble, sy: noise(t * 5, 3) * rumble};
  return (
    <AbsoluteFill style={{background: '#070a1c', overflow: 'hidden'}}>
      <World cam={cam}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
          <defs>
            <linearGradient id="night" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#0b1030" />
              <stop offset="1" stopColor="#1d1b45" />
            </linearGradient>
            <radialGradient id="bokeh" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#ffd98a" stopOpacity="0.9" />
              <stop offset="1" stopColor="#ffd98a" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="dash" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#2a2a36" />
              <stop offset="1" stopColor="#14141c" />
            </linearGradient>
            <linearGradient id="seat" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#2b2b38" />
              <stop offset="0.5" stopColor="#3b3b4c" />
              <stop offset="1" stopColor="#2b2b38" />
            </linearGradient>
          </defs>
          {/* rear window: the city flying by */}
          <rect x={0} y={0} width={W} height={H} fill="url(#night)" />
          {Array.from({length: 26}).map((_, i) => {
            const x = ((rnd(i) * 1600 + t * (120 + speed * (0.4 + rnd(i + 2)))) % 1600) - 260;
            const y = 420 + rnd(i + 7) * 520;
            const r = 20 + rnd(i + 3) * 50;
            const c = ['#ffd98a', '#ff8a5c', '#9fd3ff', '#ffffff'][i % 4];
            return <circle key={i} cx={x} cy={y} r={r} fill={c} opacity={0.25 + rnd(i + 5) * 0.3} />;
          })}
          {Array.from({length: 8}).map((_, i) => {
            const x = ((i * 240 + t * speed * 1.4) % 1920) - 420;
            return <rect key={i} x={x} y={300} width={14} height={720} fill="#2a2850" opacity={0.9} />;
          })}
          {/* headrest + seat */}
          <path d="M 300 1640 L 300 760 Q 300 640 420 640 L 660 640 Q 780 640 780 760 L 780 1640 Z" fill="url(#seat)" stroke="#000" strokeWidth={6} />
          {/* cabin frame */}
          <path d={`M 0 0 L ${W} 0 L ${W} 260 Q 540 200 0 260 Z`} fill="#0a0a12" />
          <path d="M 0 0 L 110 0 L 70 1500 L 0 1500 Z" fill="#0d0d16" />
          <path d={`M ${W} 0 L ${W - 110} 0 L ${W - 70} 1500 L ${W} 1500 Z`} fill="#0d0d16" />
        </svg>
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
          <Lodi
            id="l4"
            x={540}
            y={FLOOR + 260}
            s={1.02}
            t={t}
            kit="ahli"
            hideLegs
            expr={expr}
            mouth={mouthAt(sd, t)}
            armL={40}
            armR={40}
            bendL={-70}
            bendR={-70}
            headTilt={headShake}
            look={on(t, tPaid, tKm + 1) ? 0.5 : 0}
            glare={sweepP}
            blinkSeed={4}
          />
          {/* streetlight sweep over the driver */}
          <rect x={-600 + sweepP * 2400} y={0} width={260} height={H} fill="#ffcf8a" opacity={0.16 * drive} transform={`rotate(18,540,960)`} />
          {/* dashboard + wheel */}
          <path d="M -20 1460 Q 540 1360 1100 1460 L 1100 1920 L -20 1920 Z" fill="url(#dash)" stroke="#000" strokeWidth={6} />
          {[300, 780].map((cx, i) => (
            <g key={i}>
              <circle cx={cx} cy={1600} r={78} fill="#0b0b12" stroke="#3b3b4c" strokeWidth={6} />
              <circle cx={cx} cy={1600} r={64} fill="none" stroke={i ? '#5ec2ff' : '#ff9f43'} strokeWidth={5} opacity={engine} />
              <line
                x1={cx}
                y1={1600}
                x2={cx + Math.cos(Math.PI * (0.8 + (i ? drive * 0.9 : engine * 0.5 + drive * 0.4))) * 56}
                y2={1600 + Math.sin(Math.PI * (0.8 + (i ? drive * 0.9 : engine * 0.5 + drive * 0.4))) * 56}
                stroke="#ff4a4a"
                strokeWidth={6}
                strokeLinecap="round"
                opacity={engine}
              />
            </g>
          ))}
          <g transform={`rotate(${Math.sin(t * 0.9) * 6 * drive},540,1470)`}>
            <circle cx={540} cy={1470} r={250} fill="none" stroke="#111" strokeWidth={46} />
            <circle cx={540} cy={1470} r={250} fill="none" stroke="#2c2c3a" strokeWidth={30} />
            <path d="M 290 1470 L 790 1470 M 540 1470 L 540 1720" stroke="#2c2c3a" strokeWidth={34} />
            <circle cx={540} cy={1470} r={70} fill="#1d1d28" stroke="#3b3b4c" strokeWidth={6} />
            {[-1, 1].map((side) => (
              <ellipse key={side} cx={540 + side * 206} cy={1300} rx={40} ry={52} fill="#d9a57c" stroke={OUT} strokeWidth={5} />
            ))}
          </g>
        </svg>
      </World>
      <div style={{position: 'absolute', inset: 0, background: '#000', opacity: (1 - engine) * 0.35}} />
      <Pop age={t - tPaid} x={790} y={420} rot={6} life={tKm - tPaid + 0.3}>
        <div
          dir="rtl"
          style={{
            fontFamily: FONT,
            fontWeight: 700,
            background: '#fff7e6',
            border: '6px dashed #c9a24e',
            borderRadius: 22,
            padding: '10px 36px 18px',
            textAlign: 'center',
            boxShadow: '0 14px 0 rgba(0,0,0,0.3)',
          }}
        >
          <div style={{fontSize: 36, color: '#6b4a3a'}}>تذكرة دخول</div>
          <div style={{fontSize: 72, color: KIT_COLORS.ahli.shade, lineHeight: 1.1}}>٨٠ ريال</div>
        </div>
      </Pop>
      <Pop age={t - tKm} x={300} y={460} rot={-5} life={tNassr - tKm + 1.2}>
        <div dir="rtl" style={{fontFamily: FONT, fontWeight: 700, background: '#0b1a2e', color: '#5ec2ff', border: '5px solid #5ec2ff', borderRadius: 22, padding: '8px 34px 16px', textAlign: 'center'}}>
          <div style={{fontSize: 34, color: '#9fd3ff'}}>البيت ← الملعب</div>
          <div style={{fontSize: 74, lineHeight: 1.1}}>٧٠ كم</div>
        </div>
      </Pop>
      <Vignette strength={0.55} />
      <Subtitles sd={sd} t={t} />
      <SceneAudio src={sd.audio} />
    </AbsoluteFill>
  );
};

// ----------------------------------------------------------------------- scene 5: the stands
const Fan: React.FC<{x: number; y: number; s: number; t: number; i: number; jump: number}> = ({x, y, s, t, i, jump}) => {
  const b = Math.abs(Math.sin(t * 6 + i * 1.3)) * 22 * jump;
  const arm = 140 + Math.sin(t * 6 + i) * 25;
  const skin = ['#d9a57c', '#c58c62', '#e2b892', '#a8734f'][i % 4];
  const hair = ['#1a1414', '#2a1d18', '#3a2a20'][i % 3];
  return (
    <g transform={`translate(${x},${y - b}) scale(${s})`}>
      <path d="M -90 0 L -80 -170 Q 0 -200 80 -170 L 90 0 Z" fill={KIT_COLORS.ahli.shirt} stroke={OUT} strokeWidth={5} />
      <path d="M -30 -186 L 0 -150 L 30 -186" stroke="#fff" strokeWidth={7} fill="none" />
      {[-1, 1].map((sd) => (
        <g key={sd} transform={`translate(${sd * 70},-160) rotate(${sd * -arm})`}>
          <path d="M 0 0 L 0 130" stroke={OUT} strokeWidth={36} strokeLinecap="round" />
          <path d="M 0 0 L 0 130" stroke={skin} strokeWidth={26} strokeLinecap="round" />
        </g>
      ))}
      <circle cx={0} cy={-260} r={70} fill={skin} stroke={OUT} strokeWidth={5} />
      <path d="M -70 -270 Q -70 -340 0 -340 Q 70 -340 70 -270 Q 40 -300 0 -296 Q -40 -300 -70 -270 Z" fill={hair} stroke={OUT} strokeWidth={4} />
      <path d="M -24 -250 L -24 -240 M 24 -250 L 24 -240" stroke={OUT} strokeWidth={8} strokeLinecap="round" />
      <ellipse cx={0} cy={-218} rx={22} ry={16 + Math.abs(Math.sin(t * 6 + i)) * 10} fill="#5a1620" stroke={OUT} strokeWidth={3} />
    </g>
  );
};

export const Scene5: React.FC = () => {
  const t = useT();
  const sd = scene('s5');
  const w = (k: string) => wordAt(sd, k);
  const tTry = w('أحاول');
  const tDont = w('أعرف');
  const clapping = on(t, tTry, tDont + 0.6);
  const clap = clapping ? Math.abs(Math.sin(t * 5)) : 0;
  const expr = exprAt(t, [
    [0, 'nervous'],
    [tTry, 'happy'],
    [tTry + 1.2, 'nervous'],
    [tDont, 'confused'],
  ]);
  const cam: Cam = {zoom: lerp(1.08, 1.0, smooth(t / 3)), cx: 540, cy: 980};
  return (
    <AbsoluteFill style={{background: '#060a1a', overflow: 'hidden'}}>
      <World cam={cam}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
          <defs>
            <linearGradient id="sky5" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#050818" />
              <stop offset="1" stopColor="#1a2550" />
            </linearGradient>
            <radialGradient id="flood" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="0.3" stopColor="#dff0ff" stopOpacity="0.5" />
              <stop offset="1" stopColor="#dff0ff" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="stand" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#1c2a3e" />
              <stop offset="1" stopColor="#0f1826" />
            </linearGradient>
          </defs>
          <rect width={W} height={H} fill="url(#sky5)" />
          {[180, 900].map((x, i) => (
            <g key={i}>
              <circle cx={x} cy={160} r={260} fill="url(#flood)" opacity={0.85 + Math.sin(t * 3 + i) * 0.05} />
              <rect x={x - 70} y={110} width={140} height={90} rx={8} fill="#e8f2ff" stroke="#9fb2cc" strokeWidth={5} />
              <rect x={x - 8} y={200} width={16} height={260} fill="#3a4a66" />
            </g>
          ))}
          {/* far stands: crowd dots */}
          <path d="M 0 420 Q 540 360 1080 420 L 1080 900 L 0 900 Z" fill="url(#stand)" />
          {Array.from({length: 260}).map((_, i) => {
            const x = rnd(i) * W;
            const y = 440 + rnd(i + 900) * 430;
            const b = Math.abs(Math.sin(t * 6 + i)) * 5;
            return <circle key={i} cx={x} cy={y - b} r={7 + rnd(i + 3) * 4} fill={rnd(i + 5) > 0.2 ? KIT_COLORS.ahli.shirt : '#ffffff'} opacity={0.75} />;
          })}
          {/* flags */}
          {[150, 520, 880].map((x, i) => (
            <g key={i}>
              <line x1={x} y1={560} x2={x} y2={830} stroke="#ddd" strokeWidth={6} />
              <path d={`M ${x} 560 Q ${x + 60} ${540 + Math.sin(t * 5 + i) * 18} ${x + 130} 560 L ${x + 130} 660 Q ${x + 60} ${640 + Math.sin(t * 5 + i + 1) * 18} ${x} 660 Z`} fill={i % 2 ? '#ffffff' : KIT_COLORS.ahli.shirt} stroke={OUT} strokeWidth={3} />
            </g>
          ))}
          {/* pitch sliver */}
          <path d="M 0 900 L 1080 900 L 1080 980 L 0 980 Z" fill="#1f8a3e" />
          <path d="M 0 940 L 1080 940" stroke="#fff" strokeWidth={4} opacity={0.6} />
          {/* our row: seats */}
          <rect x={0} y={1320} width={W} height={600} fill="#13203a" />
          {Array.from({length: 6}).map((_, i) => (
            <rect key={i} x={i * 190 - 20} y={1340} width={170} height={70} rx={14} fill="#1f3354" stroke="#000" strokeWidth={4} />
          ))}
          {/* row behind */}
          {[-40, 200, 860, 1110].map((x, i) => (
            <Fan key={`b${i}`} x={x} y={1100} s={0.85} t={t} i={i + 10} jump={1} />
          ))}
        </svg>
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
          <Fan x={160} y={1420} s={1.05} t={t} i={1} jump={1} />
          <Fan x={930} y={1420} s={1.05} t={t} i={2} jump={1} />
          <Lodi
            id="l5"
            x={540}
            y={1640}
            s={0.88}
            t={t}
            kit="ahli"
            sit
            expr={expr}
            mouth={mouthAt(sd, t)}
            armL={clapping ? 55 + clap * 20 : t >= tDont ? 60 : 10}
            armR={clapping ? 55 + clap * 20 : t >= tDont ? 60 : 10}
            bendL={clapping ? -70 - clap * 30 : t >= tDont ? 50 : -40}
            bendR={clapping ? -70 - clap * 30 : t >= tDont ? 50 : -40}
            look={t < tTry ? Math.sin(t * 2.2) : t >= tDont ? Math.sin(t * 3) : 0}
            headTilt={t >= tDont ? -8 : 0}
            blinkSeed={5}
          />
          {/* front row heads (partly covering) */}
          {[100, 420, 700, 1000].map((x, i) => (
            <g key={i} transform={`translate(${x},${1830 - Math.abs(Math.sin(t * 6 + i)) * 12})`}>
              <circle r={110} fill="#0d1424" />
              <path d="M -150 120 Q -150 20 0 20 Q 150 20 150 120 Z" fill={KIT_COLORS.ahli.shade} />
            </g>
          ))}
        </svg>
      </World>
      {/* falling confetti */}
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        {Array.from({length: 40}).map((_, i) => {
          const x = rnd(i) * W + Math.sin(t * 2 + i) * 20;
          const y = ((rnd(i + 3) * H + t * (160 + rnd(i) * 160)) % (H + 60)) - 30;
          return <rect key={i} x={x} y={y} width={14} height={24} rx={4} fill={i % 3 ? KIT_COLORS.ahli.shirt : '#ffffff'} opacity={0.8} transform={`rotate(${t * 200 * (rnd(i + 1) - 0.5) + i * 30},${x},${y})`} />;
        })}
      </svg>
      {t >= tDont
        ? ['؟', '؟'].map((q, i) => (
            <Pop key={i} age={t - tDont - i * 0.2} x={400 + i * 280} y={600 + Math.sin(t * 3 + i) * 12} rot={-10 + i * 20}>
              <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 120, color: '#ffd54a', WebkitTextStroke: '9px #2a1d24', paintOrder: 'stroke fill'}}>{q}</div>
            </Pop>
          ))
        : null}
      <Vignette strength={0.45} />
      <Subtitles sd={sd} t={t} />
      <SceneAudio src={sd.audio} />
    </AbsoluteFill>
  );
};

// ----------------------------------------------------------------------- scene 6: alone outside
export const Scene6: React.FC = () => {
  const t = useT();
  const {durationInFrames, fps} = useVideoConfig();
  const sd = scene('s6');
  const end = durationInFrames / fps;
  const tName = wordAt(sd, 'لودي');
  const expr = exprAt(t, [
    [0, 'sad'],
    [wordAt(sd, 'لازم'), 'determined'],
    [wordAt(sd, 'هذا'), 'neutral'],
  ]);
  const cam: Cam = {zoom: lerp(1.0, 1.15, smooth(t / end)), cx: 540, cy: lerp(980, 1060, smooth(t / end))};
  const title = clamp01((t - tName) / 0.5);
  return (
    <AbsoluteFill style={{background: '#05060f', overflow: 'hidden'}}>
      <World cam={cam}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
          <defs>
            <linearGradient id="sky6" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#03040c" />
              <stop offset="1" stopColor="#14193a" />
            </linearGradient>
            <radialGradient id="stadGlow" cx="0.5" cy="0.6" r="0.6">
              <stop offset="0" stopColor="#7cf0a8" stopOpacity="0.55" />
              <stop offset="1" stopColor="#7cf0a8" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="cone" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffe7a8" stopOpacity="0.55" />
              <stop offset="1" stopColor="#ffe7a8" stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect width={W} height={H} fill="url(#sky6)" />
          {Array.from({length: 50}).map((_, i) => (
            <circle key={i} cx={rnd(i) * W} cy={rnd(i + 4) * 600} r={1.5 + rnd(i + 2) * 2.5} fill="#fff" opacity={0.3 + 0.6 * Math.abs(Math.sin(t + i))} />
          ))}
          {/* stadium */}
          <ellipse cx={540} cy={820} rx={900} ry={420} fill="url(#stadGlow)" />
          <path d="M -120 1220 L -60 760 Q 540 560 1140 760 L 1200 1220 Z" fill="#1b2238" stroke="#2f3b5e" strokeWidth={6} />
          {Array.from({length: 18}).map((_, i) => (
            <rect key={i} x={-40 + i * 66} y={800 + Math.abs(i - 8.5) * 6} width={30} height={300} rx={6} fill="#26305a" opacity={0.9} />
          ))}
          <path d="M -60 760 Q 540 560 1140 760" stroke="#7cf0a8" strokeWidth={10} fill="none" opacity={0.6 + 0.2 * Math.sin(t * 2)} />
          {[220, 860].map((x, i) => (
            <g key={i}>
              <rect x={x - 6} y={420} width={12} height={300} fill="#3a4a66" />
              <rect x={x - 50} y={390} width={100} height={50} rx={6} fill="#f0f6ff" />
              <circle cx={x} cy={415} r={150} fill="#ffffff" opacity={0.12} />
            </g>
          ))}
          {/* parking lot */}
          <rect x={0} y={1220} width={W} height={H - 1220} fill="#1a1a24" />
          {Array.from({length: 6}).map((_, i) => (
            <line key={i} x1={i * 220 - 40} y1={1240} x2={(i * 220 - 580) * 1.9 + 540} y2={H} stroke="#e8e8f0" strokeWidth={6} opacity={0.25} />
          ))}
          {/* lamp post */}
          <rect x={846} y={700} width={18} height={950} fill="#2c2c3a" />
          <path d="M 855 700 Q 855 660 800 660 L 760 660" stroke="#2c2c3a" strokeWidth={16} fill="none" />
          <path d="M 720 650 L 800 650 L 790 680 L 730 680 Z" fill="#ffe7a8" />
          <path d="M 730 680 L 790 680 L 1000 1680 L 400 1680 Z" fill="url(#cone)" opacity={0.85 + Math.sin(t * 7) * 0.05} />
          <ellipse cx={640} cy={1660} rx={330} ry={60} fill="#ffe7a8" opacity={0.14} />
          {/* blowing paper / leaves */}
          {Array.from({length: 10}).map((_, i) => {
            const x = ((rnd(i) * 1300 + t * (120 + rnd(i + 1) * 80)) % 1300) - 110;
            const y = 1300 + rnd(i + 2) * 500 + Math.sin(t * 3 + i) * 30;
            return <rect key={i} x={x} y={y} width={22} height={14} rx={3} fill={i % 2 ? '#c9b48a' : KIT_COLORS.ahli.shirt} opacity={0.7} transform={`rotate(${t * 180 + i * 40},${x},${y})`} />;
          })}
        </svg>
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
          <Lodi id="l6" x={600} y={FLOOR + 20} s={0.95} t={t} kit="ahli" expr={expr} mouth={mouthAt(sd, t)} armL={6} armR={6} bendL={-10} bendR={-10} look={-0.2} blinkSeed={6} />
        </svg>
      </World>
      <div
        dir="rtl"
        style={{
          position: 'absolute',
          top: 260,
          width: W,
          textAlign: 'center',
          fontFamily: FONT,
          fontWeight: 700,
          fontSize: 230,
          color: '#ffffff',
          WebkitTextStroke: '12px #0a6a33',
          paintOrder: 'stroke fill',
          textShadow: '0 0 60px rgba(124,240,168,0.6), 0 14px 0 #0a6a33',
          opacity: title,
          transform: `scale(${0.8 + 0.2 * easeOut(title)})`,
        }}
      >
        لودي
      </div>
      <Vignette strength={0.6} />
      <Subtitles sd={sd} t={t} />
      <SceneAudio src={sd.audio} />
      <div style={{position: 'absolute', inset: 0, background: '#000', opacity: clamp01((t - (end - 0.7)) / 0.7)}} />
    </AbsoluteFill>
  );
};
