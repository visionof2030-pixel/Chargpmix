import TLJ from './timeline.json';

export const W = 1080;
export const H = 1920;
export const FPS = 30;

export type SceneTL = {name: string; start: number; dur: number; lines: Record<string, number[]>; beats: Record<string, number[]>};
type TLT = {fps: number; total: number; scenes: SceneTL[]; text: Record<string, string>; env: Record<string, number[]>};
export const TL = TLJ as unknown as TLT;
export const sceneTL = (name: string) => TL.scenes.find((s) => s.name === name)!;

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (x: number) => {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
};
export const easeOut = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);
export const easeIn = (x: number) => Math.pow(clamp01(x), 2.2);
export const pop = (x: number) => {
  const t = clamp01(x);
  const c1 = 2.2;
  return 1 + (c1 + 1) * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
export const on = (t: number, a: number, b: number) => t >= a && t < b;
export const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
export const noise = (t: number, seed = 0) =>
  Math.sin(t * 13.1 + seed) * 0.5 + Math.sin(t * 29.7 + seed * 2.3) * 0.3 + Math.sin(t * 51.3 + seed * 4.1) * 0.2;

/** beat window helpers (scene-relative seconds) */
export const B = (s: SceneTL, k: string) => s.beats[k] ?? [1e9, 1e9];
/** line window; missing lines collapse to an empty window */
export const Ln = (s: SceneTL, k: string) => s.lines[k] ?? [1e9, 1e9];

export const KEY: Record<string, string> = {T: 'taraf', S: 'sahab', M: 'malath', L: 'leen', F: 'fares', J: 'jassar'};

/** mouth openness for a kid in this scene at time t (ALL makes everybody shout) */
export const mouthOf = (s: SceneTL, kid: string, t: number) => {
  for (const [id, [a, b]] of Object.entries(s.lines)) {
    if (t < a || t >= b) continue;
    if (id === 'ALL' || KEY[id[0]] === kid) {
      const e = TL.env[id];
      const f = (t - a) * FPS;
      const i = Math.min(Math.floor(f), e.length - 1);
      const j = Math.min(i + 1, e.length - 1);
      return Math.min(1, lerp(e[i], e[j], f - Math.floor(f)) * 1.15);
    }
  }
  return null;
};
export const speaking = (s: SceneTL, t: number) => {
  for (const [id, [a, b]] of Object.entries(s.lines)) if (t >= a && t < b) return id;
  return null;
};

/** piecewise smooth path through keyframes [time, x, y] */
export const track = (t: number, pts: [number, number, number][]) => {
  if (t <= pts[0][0]) return {x: pts[0][1], y: pts[0][2]};
  for (let i = 0; i < pts.length - 1; i++) {
    const [t0, x0, y0] = pts[i];
    const [t1, x1, y1] = pts[i + 1];
    if (t < t1) {
      const k = smooth((t - t0) / Math.max(1e-6, t1 - t0));
      return {x: lerp(x0, x1, k), y: lerp(y0, y1, k)};
    }
  }
  const l = pts[pts.length - 1];
  return {x: l[1], y: l[2]};
};

export type Cam = {zoom: number; cx: number; cy: number; sx?: number; sy?: number};
export const camTransform = (c: Cam) =>
  `translate(${W / 2 + (c.sx ?? 0)}px, ${H / 2 + (c.sy ?? 0)}px) scale(${c.zoom}) translate(${-c.cx}px, ${-c.cy}px)`;
/** smoothed camera follow */
export const followCam = (frame: number, target: (t: number) => Cam, k = 0.06): Cam => {
  let c = target(0);
  for (let f = 1; f <= frame; f++) {
    const g = target(f / FPS);
    c = {zoom: lerp(c.zoom, g.zoom, k), cx: lerp(c.cx, g.cx, k), cy: lerp(c.cy, g.cy, k)};
  }
  const hw = W / 2 / c.zoom;
  const hh = H / 2 / c.zoom;
  return {zoom: c.zoom, cx: Math.max(hw, Math.min(W - hw, c.cx)), cy: Math.max(hh, Math.min(H - hh, c.cy))};
};
