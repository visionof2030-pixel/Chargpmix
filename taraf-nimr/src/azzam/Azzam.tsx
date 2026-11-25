import React from 'react';
import {AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Audio} from '@remotion/media';
import {Kid, LOOKS, Expr} from '../Kid';
import {SideKid} from '../SideKid';
import {Adult, Car, Megaphone, Street} from './props';
import {FONT, Vignette, World} from '../ui';
import {Cam, W, clamp01, easeOut, followCam, lerp, noise, on, pop, smooth, track} from '../tl';

export const AZZAM_TOTAL = 39;

/* beats (seconds) */
export const AB = {
  narr: [0.4, 3.6],
  press: 3.6,
  thiefIn: [6, 8.5],
  look: [8.5, 9.6],
  pick: 9.6,
  notice: 11,
  duck: [12.1, 13.2],
  winOpen: [14, 14.6],
  L1: [14.6, 18.9],
  freeze: 19.0,
  spin: [19.6, 21.0],
  shrug: [21.6, 22.4],
  siren: 23.2,
  L2: [23.5, 27.4],
  door: 27.6,
  flee: [28.2, 30.4],
  outro: 31.0,
  L3: [31.8, 35.8],
  title: 36.0,
};
export const LINES: {id: string; who: 'azzam' | 'narrator'; a: number; b: number; text: string}[] = [
  {id: 'N', who: 'narrator', a: AB.narr[0], b: AB.narr[1], text: 'في هدوء الظهيرة.. كان عزام يراقب سيارة أبوه من الشباك.. وفجأة.. لمح شي غريب!'},
  {id: 'A1', who: 'azzam', a: AB.L1[0], b: AB.L1[1], text: 'قف مكانك أيها اللص! السيارة محاصرة بالكامل.. ارفع يديك فوراً!'},
  {id: 'A2', who: 'azzam', a: AB.L2[0], b: AB.L2[1], text: 'أنا البطل عزام! وإذا ما هربت الحين.. بطلق عليك الليزر!'},
  {id: 'A3', who: 'azzam', a: AB.L3[0], b: AB.L3[1], text: 'شفتوا كيف؟ أنا أنقذت السيارة.. وما أحد يقدر يسرقها وأنا موجود!'},
];

/** mouth flaps while a line is on (replaced by the real voice envelope once recorded) */
const flap = (t: number, a: number, b: number) => {
  if (t < a || t >= b) return null;
  const v = 0.35 + 0.35 * Math.abs(Math.sin(t * 13)) + 0.3 * Math.abs(Math.sin(t * 5.3 + 1));
  return Math.min(1, v * (0.6 + 0.4 * Math.abs(noise(t * 2, 3))));
};

const Caption: React.FC<{t: number}> = ({t}) => {
  const l = LINES.find((x) => t >= x.a - 0.05 && t < x.b + 0.3);
  if (!l) return null;
  const words = l.text.split(' ');
  const prog = clamp01((t - l.a) / (l.b - l.a));
  const tot = words.reduce((s, w) => s + w.length + 2, 0);
  let acc = 0;
  const color = l.who === 'azzam' ? LOOKS.azzam.color : '#8ad0ff';
  const op = Math.min(clamp01((t - l.a + 0.05) / 0.15), clamp01((l.b + 0.3 - t) / 0.15));
  return (
    <div style={{position: 'absolute', top: 150, width: W, display: 'flex', justifyContent: 'center', opacity: op}}>
      <div
        dir="rtl"
        style={{
          position: 'relative',
          maxWidth: 940,
          padding: '30px 44px 26px',
          borderRadius: 34,
          background: 'rgba(14,10,26,0.82)',
          border: `5px solid ${color}`,
          fontFamily: FONT,
          fontWeight: 700,
          fontSize: 56,
          lineHeight: 1.5,
          textAlign: 'center',
          color: '#fff',
          transform: `scale(${0.9 + 0.1 * pop((t - l.a) / 0.25)})`,
        }}
      >
        <div style={{position: 'absolute', top: -40, right: 34, background: color, color: '#1b1630', borderRadius: 999, padding: '0 30px 6px', fontSize: 42, border: '4px solid #fff'}}>
          {l.who === 'azzam' ? 'عزام' : 'الراوي'}
        </div>
        {words.map((w, i) => {
          const st = acc / tot;
          acc += w.length + 2;
          return (
            <span key={i} style={{display: 'inline-block', margin: '0 7px', color: prog >= st ? '#fff' : 'rgba(255,255,255,0.45)'}}>
              {w}
            </span>
          );
        })}
      </div>
    </div>
  );
};

const Pow: React.FC<{text: string; x: number; y: number; age: number; life?: number; size?: number; fill?: string; rot?: number}> = ({text, x, y, age, life = 1, size = 110, fill = '#fff', rot = -8}) => {
  if (age < 0 || age > life) return null;
  return (
    <div
      dir="rtl"
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${Math.max(0.01, pop(age / 0.25))})`,
        opacity: clamp01((life - age) / 0.25),
        fontFamily: FONT,
        fontWeight: 700,
        fontSize: size,
        color: fill,
        WebkitTextStroke: `${size * 0.09}px #2a1d24`,
        paintOrder: 'stroke fill',
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </div>
  );
};

export const AzzamHero: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const outside = t >= AB.outro;

  /* ---------------- Azzam in the window */
  const winOpen = smooth((t - AB.winOpen[0]) / (AB.winOpen[1] - AB.winOpen[0]));
  const ducked = on(t, AB.duck[0], AB.duck[1]) ? Math.sin(((t - AB.duck[0]) / (AB.duck[1] - AB.duck[0])) * Math.PI) : 0;
  const leanOut = winOpen * (on(t, AB.L1[0] - 0.4, AB.door + 0.6) ? 1 : 0.4);
  const hasMega = t >= AB.duck[0] + 0.55;
  const sirenOn = t >= AB.siren && t < AB.door + 1.5;
  let azExpr: Expr = 'curious';
  if (t >= AB.notice) azExpr = 'scared';
  if (t >= AB.notice + 0.6) azExpr = 'brave';
  if (on(t, AB.freeze, AB.siren)) azExpr = 'brave';
  if (on(t, AB.shrug[0], AB.L2[0])) azExpr = 'pain';
  if (t >= AB.L2[0]) azExpr = 'brave';
  if (t >= AB.door + 0.4) azExpr = 'laugh';
  const azMouth = flap(t, AB.L1[0], AB.L1[1]) ?? flap(t, AB.L2[0], AB.L2[1]) ?? flap(t, AB.L3[0], AB.L3[1]);
  const pressNose = on(t, AB.press, AB.notice) ? 1 : 0;

  /* ---------------- the thief */
  const thiefP = track(t, [
    [AB.thiefIn[0], 1300, 1720],
    [AB.thiefIn[1], 720, 1720],
    [AB.flee[0], 720, 1720],
    [AB.flee[1], -500, 1740],
  ]);
  const thiefRun = on(t, AB.flee[0], AB.flee[1] + 1) ? 1 : 0;
  const thiefTip = on(t, AB.thiefIn[0], AB.thiefIn[1]) ? 1 : 0;
  const picking = (on(t, AB.pick, AB.freeze) || on(t, AB.shrug[1], AB.door)) && !thiefRun;
  let thiefExpr: 'neutral' | 'sneaky' | 'shock' | 'scared' = 'sneaky';
  if (on(t, AB.freeze, AB.shrug[0])) thiefExpr = 'shock';
  if (t >= AB.siren) thiefExpr = 'scared';
  const headTurn = on(t, AB.look[0], AB.look[1]) ? Math.sin((t - AB.look[0]) * 6) : on(t, AB.spin[0], AB.spin[1]) ? Math.sin((t - AB.spin[0]) * 9) : on(t, AB.spin[1], AB.shrug[0]) ? -1 : 0;
  const spinTurn = on(t, AB.spin[0], AB.spin[1]) ? Math.sin((t - AB.spin[0]) * 12) * 18 : 0;
  const shrug = on(t, AB.shrug[0], AB.shrug[1]) ? Math.sin(((t - AB.shrug[0]) / (AB.shrug[1] - AB.shrug[0])) * Math.PI) : 0;
  const freezeShake = on(t, AB.freeze, AB.freeze + 0.5) ? noise(t * 5, 1) * 6 : 0;

  /* ---------------- family bursting out of the door */
  const doorOpen = smooth((t - AB.door) / 0.25);
  const famK = (d: number) => clamp01((t - AB.door - 0.2 - d) / 1.4);

  /* ---------------- camera */
  const target = (tt: number): Cam => {
    if (tt >= AB.outro) return {zoom: 1.1, cx: 540, cy: 1330};
    if (tt >= AB.door) return {zoom: 1.0, cx: 540, cy: 1150};
    if (tt >= AB.siren) return {zoom: 1.25, cx: 420, cy: 900};
    if (tt >= AB.freeze) return {zoom: 1.15, cx: 640, cy: 1300};
    if (tt >= AB.winOpen[0]) return {zoom: 1.3, cx: 380, cy: 760};
    if (tt >= AB.notice) return {zoom: 1.75, cx: 330, cy: 640};
    if (tt >= AB.thiefIn[0]) return {zoom: 1.12, cx: 640, cy: 1360};
    if (tt >= AB.press) return {zoom: 1.7, cx: 330, cy: 650};
    return {zoom: 1.0, cx: 540, cy: 960};
  };
  const base = followCam(frame, target, 0.07);
  const shake = sirenOn ? 3 : 0;
  const cam: Cam = {...base, sx: noise(t * 3, 1) * shake, sy: noise(t * 3, 4) * shake};

  const azzamWindow = (
    <g>
      <defs>
        <clipPath id="az-win">
          <rect x={136} y={0} width={368 + winOpen * 400} height={814} />
        </clipPath>
      </defs>
      <g clipPath="url(#az-win)">
        <Kid
          id="az-w"
          look={LOOKS.azzam}
          x={lerp(330, 420, leanOut)}
          y={1000 + ducked * 520 - leanOut * 60 + pressNose * 0}
          s={0.62}
          t={t}
          expr={azExpr}
          mouth={azMouth}
          lean={leanOut * 8}
          look2={t >= AB.thiefIn[0] ? 0.8 : 0}
          lookY={t >= AB.thiefIn[0] ? 0.8 : 0.4}
          armR={hasMega ? 120 + (sirenOn ? Math.sin(t * 10) * 10 : 0) : 30}
          bendR={hasMega ? -60 : 0}
          propR={hasMega ? <Megaphone flash={sirenOn ? t : 0} /> : undefined}
          armL={azExpr === 'brave' && leanOut > 0.5 ? 140 + Math.sin(t * 6) * 15 : 20}
          blinkSeed={2}
        />
      </g>
      {/* glass fog where the little nose touches */}
      {pressNose && winOpen < 0.1 ? <ellipse cx={418} cy={640} rx={40 + Math.sin(t * 2) * 6} ry={24} fill="#ffffff" opacity={0.35} /> : null}
    </g>
  );

  return (
    <AbsoluteFill style={{background: '#8fd0ff', overflow: 'hidden'}}>
      <World cam={cam}>
        <Street t={t} windowOpen={winOpen} doorOpen={doorOpen} />
        <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
          {!outside ? azzamWindow : null}
          <Car x={520} y={1560} s={0.8} shake={picking ? Math.sin(t * 30) * 1.5 : 0} />
          {/* the wire in the lock */}
          {picking ? <path d={`M 547 1374 L ${thiefP.x - 40} ${1374 + 40 + Math.sin(t * 25) * 4}`} stroke="#c0c4cc" strokeWidth={4} /> : null}
          {/* dropped wire on the road */}
          {t >= AB.flee[0] + 0.2 ? <path d="M 640 1760 q 30 -10 60 4 q 20 8 50 -2" stroke="#c0c4cc" strokeWidth={4} fill="none" /> : null}
          {t >= AB.thiefIn[0] && t < AB.flee[1] + 0.8 ? (
            <g transform={`translate(${freezeShake},0)`}>
              <Adult
                x={thiefP.x}
                y={thiefP.y}
                s={0.42}
                t={t}
                kind="thief"
                tiptoe={thiefTip || picking ? 1 : 0}
                run={thiefRun}
                lean={thiefRun ? -10 : spinTurn}
                headTurn={thiefRun ? -1 : headTurn}
                expr={thiefExpr}
                armL={picking ? 70 : thiefRun ? 150 : 8 + shrug * 80}
                bendL={picking ? 40 : shrug * -60}
                armR={on(t, AB.freeze, AB.freeze + 0.8) ? 165 : thiefRun ? 150 : 8 + shrug * 80}
                bendR={shrug * -60}
              />
            </g>
          ) : null}
          {/* family runs out (side view while running) */}
          {t >= AB.door + 0.2 && !outside
            ? (
                [
                  ['jassar', 0, 700],
                  ['taraf2', 0.15, 840],
                  ['sahab', 0.3, 960],
                ] as [string, number, number][]
              ).map(([k, d, xEnd]) => {
                const k2 = famK(d);
                if (k2 <= 0) return null;
                const x = lerp(790, xEnd - 300, easeOut(k2));
                const y = lerp(1300, 1880, easeOut(k2));
                return k2 < 1 ? (
                  <SideKid key={k} id={`az-${k}`} L={LOOKS[k]} x={x} y={y} s={0.4 * LOOKS[k].height} facing={-1} pose={{phase: t / 0.46, walk: 0, run: 1, t, vel: 900, expr: 'curious'}} />
                ) : (
                  <Kid key={k} id={`az-${k}f`} look={LOOKS[k]} x={x} y={y} s={0.4} t={t} expr="happy" armR={140} armL={140} jump={Math.abs(Math.sin(t * 8)) * 30} />
                );
              })
            : null}
          {t >= AB.door + 0.5 && !outside ? (
            <Adult x={lerp(790, 520, easeOut(famK(0.5)))} y={lerp(1300, 1800, easeOut(famK(0.5)))} s={0.36} t={t} kind="father" run={famK(0.5) < 1 ? 1 : 0} expr={famK(0.5) < 1 ? 'shock' : 'happy'} headTurn={-1} armR={famK(0.5) < 1 ? 0 : 150} />
          ) : null}
          {/* outro: everybody on the pavement */}
          {outside ? (
            <g>
              <Adult x={860} y={1640} s={0.36} t={t} kind="father" expr="happy" armL={60} bendL={-80} headTurn={-0.5} />
              <Kid id="az-o-j" look={LOOKS.jassar} x={150} y={1760} s={0.38} t={t} expr="laugh" armR={150 + Math.sin(t * 10) * 15} armL={60} bendL={-80} />
              <Kid id="az-o-t" look={LOOKS.taraf2} x={310} y={1840} s={0.38} t={t} expr="happy" armL={70 + Math.abs(Math.sin(t * 9)) * 40} armR={70 + Math.abs(Math.sin(t * 9)) * 40} bendL={-100} bendR={-100} jump={Math.abs(Math.sin(t * 7)) * 20} />
              <Kid id="az-o-s" look={LOOKS.sahab} x={760} y={1860} s={0.38} t={t} expr="laugh" armL={70 + Math.abs(Math.sin(t * 9 + 1)) * 40} armR={70 + Math.abs(Math.sin(t * 9 + 1)) * 40} bendL={-100} bendR={-100} />
              <Kid
                id="az-o-a"
                look={LOOKS.azzam}
                x={540}
                y={1780}
                s={0.62}
                t={t}
                expr={t >= AB.L3[1] ? 'laugh' : 'happy'}
                mouth={azMouth}
                armR={160}
                bendR={-10}
                propR={<Megaphone />}
                armL={40}
                jump={t < AB.outro + 0.6 ? Math.sin(((t - AB.outro) / 0.6) * Math.PI) * 60 : 0}
                blinkSeed={2}
              />
            </g>
          ) : null}
        </svg>
      </World>
      {/* siren light wash */}
      {sirenOn ? <div style={{position: 'absolute', inset: 0, background: Math.sin(t * 18) > 0 ? '#ff2a2a' : '#2a5bff', opacity: 0.12, mixBlendMode: 'screen'}} /> : null}
      <Pow text="!!" x={800} y={430} age={t - AB.notice} life={1.0} size={160} fill="#ffd54a" rot={10} />
      <Pow text="وييووو وييووو!" x={560} y={1450} age={t - AB.siren} life={2.6} size={100} fill="#ff5a5a" />
      <Pow text="طـاخ!" x={760} y={980} age={t - AB.door} life={0.8} size={120} fill="#ffd166" />
      <Pow text="؟!" x={760} y={1060} age={t - AB.spin[0]} life={2.0} size={130} fill="#ffd54a" rot={8} />
      <Caption t={t} />
      {t >= AB.title ? (
        <div dir="rtl" style={{position: 'absolute', top: 150, width: W, textAlign: 'center', fontFamily: FONT, fontWeight: 700, transform: `scale(${Math.max(0.01, pop((t - AB.title) / 0.5))}) rotate(${Math.sin(t * 3) * 2}deg)`}}>
          <div style={{fontSize: 190, color: '#f5c518', WebkitTextStroke: '16px #1e2a6e', paintOrder: 'stroke fill', textShadow: '0 14px 0 #1e2a6e', lineHeight: 1.1}}>البطل عزام</div>
        </div>
      ) : null}
      <Vignette strength={0.3} />
      <div style={{position: 'absolute', inset: 0, background: '#000', opacity: Math.max(1 - clamp01(t / 0.5), clamp01((t - (AZZAM_TOTAL - 0.6)) / 0.6), on(t, AB.outro - 0.25, AB.outro + 0.25) ? 1 - Math.abs(t - AB.outro) / 0.25 : 0)}} />
      <Audio src={staticFile('azzam/audio.wav')} />
    </AbsoluteFill>
  );
};
