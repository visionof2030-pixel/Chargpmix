import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Character, SAHAB, TARAF, Expr, handPos} from './Character';
import {RoomBG, BathBG} from './backgrounds';
import {Bubbles, Grade, Pill, Pow, FONT} from './ui';
import {BLUE, Cam, FLOOR, H, PINK, T, W, activeLine, camTransform, clamp01, easeOut, followCam, lerp, mouthOf, noise, on, pop, rnd, smooth, toScreen} from './lib';

const S = 0.9; // character scale in world units
const HEAD = 1100 * S; // approx height to top of head

const World: React.FC<{cam: Cam; children: React.ReactNode}> = ({cam, children}) => (
  <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, transformOrigin: '0 0', transform: camTransform(cam)}}>{children}</div>
);

const Dust: React.FC<{x: number; y: number; age: number; dir?: number}> = ({x, y, age, dir = 1}) => {
  if (age < 0 || age > 0.8) return null;
  const k = age / 0.8;
  return (
    <g opacity={1 - k}>
      {Array.from({length: 6}).map((_, i) => (
        <circle key={i} cx={x + dir * (i * 22 + k * 90 * (0.5 + rnd(i)))} cy={y - k * 40 * rnd(i + 4) - 10} r={18 + k * 30 * rnd(i + 2)} fill="#fff" stroke="#d8c8d8" strokeWidth={3} />
      ))}
    </g>
  );
};

// ---------------------------------------------------------------- title
export const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const title = pop((t - 0.15) / 0.55);
  const chip = pop((t - 0.7) / 0.45);
  const sub = pop((t - 1.0) / 0.45);
  const tarafIn = easeOut((t - 0.2) / 0.7);
  return (
    <AbsoluteFill style={{background: 'linear-gradient(180deg,#ff9ec4 0%,#ffc58f 70%,#ffe08a 100%)', overflow: 'hidden'}}>
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <g transform={`translate(540,700) rotate(${t * 14})`}>
          {Array.from({length: 18}).map((_, i) => (
            <path key={i} d="M 0 0 L -120 -1600 L 120 -1600 Z" transform={`rotate(${i * 20})`} fill="#fff" opacity={0.18} />
          ))}
        </g>
        {Array.from({length: 70}).map((_, i) => {
          const x = rnd(i) * W + Math.sin(t * 2 + i) * 30;
          const y = ((rnd(i + 100) * H + t * (220 + rnd(i + 7) * 260)) % (H + 100)) - 50;
          const c = ['#ff4f8b', '#5ec2ff', '#ffd166', '#8bd38b', '#b48cff', '#ffffff'][i % 6];
          return <rect key={i} x={x} y={y} width={18} height={30} rx={5} fill={c} transform={`rotate(${t * 300 * (rnd(i + 3) - 0.5) + i * 40},${x + 9},${y + 15})`} />;
        })}
        {/* stage */}
        <ellipse cx={540} cy={1700} rx={520} ry={110} fill="#ff7aa8" />
        <ellipse cx={540} cy={1680} rx={460} ry={80} fill="#ffb3cc" />
        <g transform={`translate(0,${(1 - tarafIn) * 900})`}>
          <Character
            id="tt"
            pal={TARAF}
            x={540}
            y={1720}
            s={0.6}
            t={t}
            expr={t > 2.4 ? 'laugh' : 'smile'}
            jump={Math.abs(Math.sin(t * 5)) * 60}
            squash={Math.max(0, 1 - Math.abs(Math.sin(t * 5)) * 5) * 0.08}
            armR={140 + Math.sin(t * 12) * 25}
            bendR={30}
            armL={20}
            blinkSeed={2}
          />
        </g>
        {/* shower drops under title */}
        {Array.from({length: 16}).map((_, i) => {
          const k = (t * 1.4 + rnd(i)) % 1;
          return (
            <path
              key={i}
              d={`M ${160 + rnd(i + 5) * 760} ${170 + k * 420} q 12 22 0 32 q -12 -10 0 -32 z`}
              fill="#8fd3ff"
              stroke="#3c8fd0"
              strokeWidth={3}
              opacity={(1 - k) * 0.8}
            />
          );
        })}
      </svg>
      <div
        dir="rtl"
        style={{
          position: 'absolute',
          top: 230,
          width: W,
          textAlign: 'center',
          fontFamily: FONT,
          fontWeight: 700,
          fontSize: 330,
          lineHeight: 1,
          color: '#ff3d86',
          WebkitTextStroke: '22px #ffffff',
          paintOrder: 'stroke fill',
          textShadow: '0 22px 0 #b8205c, 0 30px 40px rgba(120,20,60,0.35)',
          transform: `scale(${Math.max(0.01, title)}) rotate(${Math.sin(t * 3) * 3}deg)`,
        }}
      >
        ترف
      </div>
      <div style={{position: 'absolute', top: 690, width: W, display: 'flex', justifyContent: 'center'}}>
        <div
          dir="rtl"
          style={{
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: 64,
            color: '#fff',
            background: 'linear-gradient(180deg,#ffb703,#fb8500)',
            padding: '4px 64px 12px',
            borderRadius: 999,
            border: '8px solid #fff',
            boxShadow: '0 12px 0 rgba(140,60,0,0.3)',
            transform: `scale(${Math.max(0.01, chip)})`,
          }}
        >
          الحلقة ١
        </div>
      </div>
      <div
        dir="rtl"
        style={{
          position: 'absolute',
          top: 830,
          width: W,
          textAlign: 'center',
          fontFamily: FONT,
          fontWeight: 700,
          fontSize: 120,
          color: '#5a2a8a',
          WebkitTextStroke: '14px #fff',
          paintOrder: 'stroke fill',
          textShadow: '0 12px 0 rgba(90,42,138,0.35)',
          transform: `scale(${Math.max(0.01, sub)})`,
        }}
      >
        مقلب الدش
      </div>
      <Grade strength={0.04} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- room
export const RoomScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const ev = T.room;
  const sx = 320;
  const tx0 = 770;
  const tx = t < 1.0 ? 1500 : t < 1.9 ? lerp(1500, tx0, easeOut((t - 1.0) / 0.9)) : tx0;
  const running = t >= 1.0 && t < 1.9;
  const ti = activeLine(ev, ['T1', 'T2', 'T3'], t);
  const si = activeLine(ev, ['S1', 'S2', 'S3'], t);
  const sExpr: Expr = t < ev.S2[0] ? 'bored' : 'sus';
  const tExpr: Expr = t < ev.T2[0] ? 'smile' : on(t, ev.T3[0], ev.T3[1]) ? 'laugh' : 'sly';
  const fanning = t < ev.S2[0];
  const skid = t >= 1.9 && t < 2.2 ? (1 - (t - 1.9) / 0.3) * 0.12 : 0;
  const tArm = ti === 'T2' || ti === 'T3' ? 110 + Math.sin(t * 6) * 35 : 14;
  const tHop = ti === 'T3' ? Math.abs(Math.sin(t * 7)) * 26 : 0;

  const target = (tt: number): Cam => {
    const sp = activeLine(ev, ['T1', 'T2', 'T3', 'S1', 'S2', 'S3'], tt);
    if (tt < 1.0) return {zoom: 1.15, cx: 380, cy: 1100};
    if (!sp) return {zoom: 1.0, cx: 540, cy: 960};
    const fx = sp[0] === 'T' ? tx0 : sx;
    return {zoom: 1.05, cx: lerp(540, fx, 0.25), cy: 1050};
  };
  const cam = followCam(frame, target, 0.06);

  const place = (id: string) =>
    id[0] === 'T'
      ? {name: 'ترف', color: PINK, x: tx - 20, y: FLOOR - HEAD - 10}
      : {name: 'سحاب', color: BLUE, x: sx + 20, y: FLOOR - HEAD - 10};

  const tagS = toScreen(cam, sx, FLOOR + 110);
  const tagT = toScreen(cam, tx0, FLOOR + 110);

  return (
    <AbsoluteFill style={{background: '#f6c9b0', overflow: 'hidden'}}>
      <World cam={cam}>
        <RoomBG t={t} />
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
          <Character
            id="rs"
            pal={SAHAB}
            x={sx}
            y={FLOOR}
            s={S}
            t={t}
            expr={sExpr}
            mouth={si ? mouthOf(ev, ['S1', 'S2', 'S3'], t) : null}
            armL={10}
            armR={si === 'S3' ? 95 : fanning ? 150 + Math.sin(t * 16) * 18 : 12}
            bendR={fanning ? 70 : 0}
            lean={-4 * Math.sin(t * 1.5)}
            look={t > 1.6 ? 1 : 0}
            sweat={t < ev.T3[0] ? 1 : 0}
            blinkSeed={1}
          />
          <Character
            id="rt"
            pal={TARAF}
            x={tx}
            y={FLOOR}
            s={S}
            t={t}
            expr={tExpr}
            mouth={ti ? mouthOf(ev, ['T1', 'T2', 'T3'], t) : null}
            run={running}
            runSpeed={16}
            jump={tHop}
            squash={skid || undefined}
            lean={running ? -8 : 0}
            armL={14}
            armR={running ? 40 : tArm}
            look={-1}
            blinkSeed={3}
          />
          <Dust x={tx0 + 60} y={FLOOR} age={t - 1.85} />
        </svg>
      </World>
      {on(t, 0.3, 2.0) ? <Pill text="ظهرية يوم من أيام الصيف الحارة..." x={W / 2} y={150} color="#3b2a6b" size={48} age={t - 0.3} left={2.0 - t} /> : null}
      {on(t, 0.2, 2.4) ? <Pill text="سحاب" x={tagS.x} y={Math.min(1850, tagS.y)} color={BLUE} age={t - 0.2} left={2.4 - t} /> : null}
      {on(t, 2.0, 4.3) ? <Pill text="ترف" x={tagT.x} y={Math.min(1850, tagT.y)} color={PINK} age={t - 2.0} left={4.3 - t} /> : null}
      {on(t, 1.75, 2.6) ? <Pow text="!" x={toScreen(cam, sx, FLOOR - HEAD - 60).x + 60} y={toScreen(cam, sx, FLOOR - HEAD - 60).y} age={t - 1.75} size={140} fill="#ffd166" /> : null}
      <Bubbles ev={ev} t={t} cam={cam} place={place} />
      <Grade tint="#ffb070" strength={0.08} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- bathroom
export const BathScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const ev = T.bath;
  const ws = ev.T6[1] - 0.3;
  const [s6s, s6e] = ev.S6;
  const runA = s6s + 0.2;
  const runB = s6e + 0.3;
  const doorA = s6e + 0.3;
  const doorB = s6e + 0.8;
  const click = s6e + 0.85;
  const s7s = ev.S7[0];

  const SX0 = 300;
  const TX0 = 800;
  const DOORX = 740;
  let sx = SX0;
  if (t < 1.3) sx = lerp(-260, SX0, easeOut(t / 1.3));
  if (t >= s7s) sx = lerp(SX0, DOORX, smooth((t - s7s) / 0.9));
  let tx = TX0;
  if (t < 1.5) tx = lerp(-480, TX0, easeOut(t / 1.5));
  if (t >= runA) tx = lerp(TX0, 1500, smooth((t - runA) / (runB - runA)));

  const reachRaise = 55;
  const knobP = handPos({x: TX0, y: FLOOR, s: S, side: -1, raise: reachRaise});
  const reach = t >= ev.T6[1] - 1.0 && t < ev.T6[1] + 0.3;
  const knob = t < ev.T6[1] - 0.5 ? 0 : smooth((t - (ev.T6[1] - 0.5)) / 0.5) * 90;
  const wet = clamp01((t - ws) / 1.3);
  const water = t >= ws;
  const door = smooth((t - doorA) / (doorB - doorA));
  const pounding = t >= s7s + 0.9;
  const doorShake = (t >= doorB && t < doorB + 0.35 ? noise(t * 4, 2) * 14 * (1 - (t - doorB) / 0.35) : 0) + (pounding ? Math.max(0, Math.sin(t * 18)) * 6 : 0);

  const sEntering = t < 1.3;
  let sExpr: Expr = 'bored';
  if (sEntering) sExpr = 'bored';
  else if (t < ev.S4[0]) sExpr = 'worry';
  else if (t < ev.S5[0]) sExpr = 'shock';
  else if (t < ws) sExpr = 'sus';
  else if (t < s6e + 0.3) sExpr = 'shock';
  else sExpr = 'angry';

  const ti = activeLine(ev, ['T4', 'T5', 'T6'], t);
  const si = activeLine(ev, ['S4', 'S5', 'S6', 'S7', 'S8'], t);
  const tRunning = t < 1.5 || (t >= runA && t < runB + 0.2);
  const tExpr: Expr = tRunning || t >= ev.T6[1] ? 'laugh' : ti === 'T5' ? 'smile' : 'sly';
  const flail = on(t, s6s, s6e);
  const sRun = sEntering || (t >= s7s && t < s7s + 0.9);

  // camera
  const target = (tt: number): Cam => {
    if (tt < 1.6) return {zoom: 1.0, cx: 540, cy: 960};
    if (tt >= ws && tt < ws + 2.2) return {zoom: 1.22, cx: 360, cy: 1060};
    if (tt >= doorA - 0.1 && tt < ev.S7[0]) return {zoom: 1.05, cx: 640, cy: 1050};
    if (tt >= ev.S7[0]) return {zoom: 1.1, cx: 760, cy: 1060};
    const sp = activeLine(ev, ['T4', 'T5', 'T6', 'S4', 'S5'], tt);
    if (!sp) return {zoom: 1.04, cx: 540, cy: 1000};
    return {zoom: 1.05, cx: lerp(540, sp[0] === 'T' ? TX0 : SX0, 0.25), cy: 1050};
  };
  const base = followCam(frame, target, 0.07);
  const shakeAmp = (t >= doorB && t < doorB + 0.45 ? 22 * (1 - (t - doorB) / 0.45) : 0) + (flail ? 5 : 0) + (pounding ? 3 : 0);
  const cam: Cam = {...base, sx: noise(t * 3, 1) * shakeAmp, sy: noise(t * 3, 5) * shakeAmp};

  const place = (id: string) => {
    if (id === 'T7' || id === 'T8') return {name: 'ترف (خلف الباب)', color: PINK, x: 975, y: 820};
    if (id[0] === 'T') return {name: 'ترف', color: PINK, x: tx - 20, y: FLOOR - HEAD - 10};
    return {name: 'سحاب', color: BLUE, x: sx + 10, y: FLOOR - HEAD - 10};
  };

  // water
  const streaks: React.ReactNode[] = [];
  const splashes: React.ReactNode[] = [];
  if (water) {
    const k0 = clamp01((t - ws) / 0.4);
    for (let i = 0; i < 90; i++) {
      const ph = (t * (1.8 + rnd(i) * 0.8) + rnd(i + 50)) % 1;
      const spread = (rnd(i + 11) * 2 - 1);
      const y = 540 + ph * 1130;
      if (y > 540 + k0 * 1130) continue;
      const x = 300 + spread * (40 + ph * 230);
      streaks.push(<line key={i} x1={x} y1={y} x2={x + spread * 6} y2={y + 46} stroke="#bfe9ff" strokeWidth={5} strokeLinecap="round" opacity={0.75} />);
    }
    for (let i = 0; i < 18; i++) {
      const ph = (t * 2.6 + rnd(i + 70)) % 1;
      const ang = (rnd(i + 90) - 0.5) * Math.PI;
      const ox = 300 + (rnd(i + 30) - 0.5) * 380;
      const r = 6 + rnd(i) * 7;
      splashes.push(
        <circle key={i} cx={ox + Math.sin(ang) * ph * 90} cy={FLOOR - 4 - Math.sin(ph * Math.PI) * 70 * Math.cos(ang)} r={r * (1 - ph * 0.5)} fill="#d6f2ff" stroke="#5aaee0" strokeWidth={2} opacity={1 - ph} />,
      );
    }
    // splash off the head while she is under the shower
    if (sx < 420) {
      for (let i = 0; i < 12; i++) {
        const ph = (t * 3 + rnd(i + 200)) % 1;
        const dir = rnd(i + 210) > 0.5 ? 1 : -1;
        splashes.push(
          <circle key={`h${i}`} cx={sx + dir * (60 + ph * 150)} cy={FLOOR - HEAD + 40 - Math.sin(ph * Math.PI) * 60 + ph * 60} r={7} fill="#e6f7ff" stroke="#5aaee0" strokeWidth={2} opacity={1 - ph} />,
        );
      }
    }
  }
  const snow = on(t, s6s, s6e + 1.5);

  const sMouth = si ? mouthOf(ev, ['S4', 'S5', 'S6', 'S7', 'S8'], t) : null;
  const tMouth = ti ? mouthOf(ev, ['T4', 'T5', 'T6'], t) : null;
  const doorS = toScreen(cam, 975, 1000);
  const tagS = toScreen(cam, SX0, FLOOR + 110);
  const tagT = toScreen(cam, TX0, FLOOR + 110);

  return (
    <AbsoluteFill style={{background: '#b5e6e6', overflow: 'hidden'}}>
      <World cam={cam}>
        <BathBG t={t} knobX={knobP.x} knobY={knobP.y} knob={knob} door={door} doorShake={doorShake} puddle={clamp01((t - ws) / 8)} />
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
          {/* back half of the water */}
          <g opacity={0.6}>{streaks.filter((_, i) => i % 2 === 0)}</g>
          <Character
            id="bs"
            pal={SAHAB}
            x={sx}
            y={FLOOR}
            s={S}
            t={t}
            expr={sExpr}
            mouth={sMouth}
            run={sRun}
            wet={wet}
            shiver={t >= ws ? (t < s7s ? 1 : 0.4) : 0}
            armL={flail ? 120 + Math.sin(t * 14) * 40 : wet > 0 && wet < 1 ? 60 : 10}
            armR={pounding ? 100 + Math.max(0, Math.sin(t * 18)) * 25 : flail ? 120 + Math.cos(t * 14) * 40 : si === 'S8' ? 30 : 10}
            bendR={pounding ? 60 : undefined}
            jump={flail ? Math.abs(Math.sin(t * 20)) * 30 : 0}
            look={t >= doorA ? 1 : t < 1.3 ? 0 : 1}
            blinkSeed={1}
          />
          {tx < 1300 ? (
            <Character
              id="bt"
              pal={TARAF}
              x={tx}
              y={FLOOR}
              s={S}
              t={t}
              expr={tExpr}
              mouth={tMouth}
              run={tRunning}
              runSpeed={15}
              lean={tRunning ? (t > runA ? -10 : -8) : 0}
              armL={reach ? reachRaise : ti === 'T5' ? 70 + Math.sin(t * 9) * 30 : 14}
              bendL={reach ? 0 : undefined}
              armR={ti === 'T4' ? 100 + Math.sin(t * 5) * 20 : 14}
              look={-1}
              blinkSeed={3}
            />
          ) : null}
          {streaks.filter((_, i) => i % 2 === 1)}
          {splashes}
          {snow
            ? Array.from({length: 7}).map((_, i) => {
                const a = (i / 7) * Math.PI * 2 + t * 1.5;
                const r = 260 + Math.sin(t * 4 + i) * 20;
                const x = sx + Math.cos(a) * r;
                const y = FLOOR - 650 + Math.sin(a) * r * 0.7;
                return (
                  <g key={i} transform={`translate(${x},${y}) rotate(${t * 90 + i * 30})`} opacity={0.9}>
                    {[0, 60, 120].map((d) => (
                      <line key={d} x1={-22} y1={0} x2={22} y2={0} transform={`rotate(${d})`} stroke="#5ec2ff" strokeWidth={7} strokeLinecap="round" />
                    ))}
                  </g>
                );
              })
            : null}
          {/* Taraf's feet shadow under the door while she taunts */}
          {t >= doorB && t < ev.T8[1] + 0.5 ? (
            <g opacity={0.5}>
              <ellipse cx={950 + Math.sin(t * 8) * 10} cy={FLOOR - 6} rx={30} ry={6} fill="#2a1630" />
              <ellipse cx={1010 - Math.sin(t * 8) * 10} cy={FLOOR - 6} rx={30} ry={6} fill="#2a1630" />
            </g>
          ) : null}
          <Dust x={TX0 + 40} y={FLOOR} age={t - runA} />
        </svg>
      </World>
      {water ? (
        <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(160,220,255,0.0) 0%, rgba(160,220,255,0.18) 100%)', opacity: clamp01((t - ws) / 1)}} />
      ) : null}
      {on(t, ev.T4[0], ev.T4[0] + 2.6) ? (
        <>
          <Pill text="سحاب" x={tagS.x} y={Math.min(1850, tagS.y)} color={BLUE} age={t - ev.T4[0]} left={ev.T4[0] + 2.6 - t} />
          <Pill text="ترف" x={tagT.x} y={Math.min(1850, tagT.y)} color={PINK} age={t - ev.T4[0]} left={ev.T4[0] + 2.6 - t} />
        </>
      ) : null}
      {on(t, ws, ws + 1) ? <Pow text="شششش!" x={toScreen(cam, 470, 560).x} y={toScreen(cam, 470, 560).y} age={t - ws} size={110} fill="#bfe9ff" stroke="#1f5f9a" rot={10} /> : null}
      {on(t, doorB, doorB + 1) ? <Pow text="طاخ!" x={doorS.x - 120} y={doorS.y - 120} age={t - doorB} size={170} fill="#ffd166" stroke="#7a2a10" /> : null}
      {on(t, click, click + 1) ? <Pow text="كلِك!" x={doorS.x - 80} y={doorS.y + 220} age={t - click} size={110} /> : null}
      {pounding && on(t, s7s + 0.9, ev.S8[1]) && Math.sin(t * 18) > 0.85 ? <Pow text="دق!" x={doorS.x - 200 + noise(t, 3) * 40} y={doorS.y + 60} age={0.2} size={90} fill="#fff" rot={-14} /> : null}
      <Bubbles ev={ev} t={t} cam={cam} place={place} />
      <Grade tint="#7fd0ff" strength={0.06} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- end card
export const EndScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const cyc = W + 1000;
  const runner = (off: number) => ((t * 430 + off + 500) % cyc) - 500;
  const xT = runner(0);
  const xS = runner(-560);
  return (
    <AbsoluteFill style={{background: 'linear-gradient(180deg,#2b1055 0%,#7b2c9e 55%,#e0559a 100%)', overflow: 'hidden'}}>
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        {Array.from({length: 60}).map((_, i) => (
          <circle key={i} cx={rnd(i) * W} cy={rnd(i + 60) * 1300} r={2 + rnd(i + 5) * 4} fill="#fff" opacity={0.3 + 0.7 * Math.abs(Math.sin(t * 2 + i))} />
        ))}
        <circle cx={850} cy={260} r={90} fill="#fff4c2" opacity={0.95} />
        <circle cx={885} cy={235} r={84} fill="#4a1a7a" />
        {/* hallway floor */}
        <rect x={0} y={1640} width={W} height={300} fill="#3a145e" />
        <rect x={0} y={1630} width={W} height={16} fill="#ff8fc0" opacity={0.6} />
        <Character id="et" pal={TARAF} x={xT} y={1750} s={0.62} t={t} expr="laugh" run runSpeed={16} lean={8} armL={40} armR={40} look={-1} blinkSeed={3} />
        <Dust x={xT - 60} y={1750} age={(t * 2.5) % 0.8} dir={-1} />
        <Character id="es" pal={SAHAB} x={xS} y={1750} s={0.62} t={t} expr="angry" run runSpeed={16} lean={8} armL={150} armR={150} wet={1} look={1} blinkSeed={1} />
        <Dust x={xS - 60} y={1750} age={((t + 0.4) * 2.5) % 0.8} dir={-1} />
      </svg>
      <div
        dir="rtl"
        style={{
          position: 'absolute',
          top: 300,
          width: W,
          textAlign: 'center',
          fontFamily: FONT,
          fontWeight: 700,
          fontSize: 220,
          color: '#ffe278',
          WebkitTextStroke: '16px #5a2878',
          paintOrder: 'stroke fill',
          textShadow: '0 16px 0 #5a2878, 0 0 60px rgba(255,226,120,0.5)',
          transform: `scale(${Math.max(0.01, pop((t - 0.2) / 0.6))})`,
        }}
      >
        يتبع...
      </div>
      <div
        dir="rtl"
        style={{
          position: 'absolute',
          top: 640,
          width: W,
          textAlign: 'center',
          fontFamily: FONT,
          fontWeight: 700,
          fontSize: 110,
          color: '#fff',
          WebkitTextStroke: '10px #7a2878',
          paintOrder: 'stroke fill',
          transform: `scale(${Math.max(0.01, pop((t - 1.0) / 0.5))})`,
        }}
      >
        الحلقة ٢
      </div>
      {['ترف تهرب...', 'وسحاب ما راح تسكت!'].map((line, i) => (
        <div
          key={i}
          dir="rtl"
          style={{
            position: 'absolute',
            top: 840 + i * 110,
            width: W,
            textAlign: 'center',
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: 70,
            color: '#fff0fa',
            opacity: clamp01((t - 1.8 - i * 0.6) / 0.3),
            transform: `translateY(${(1 - easeOut((t - 1.8 - i * 0.6) / 0.4)) * 40}px)`,
          }}
        >
          {line}
        </div>
      ))}
      <Grade tint="#b07aff" strength={0.05} />
    </AbsoluteFill>
  );
};
