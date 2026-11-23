import TL from './timeline.json';

export const FPS = 30;
export const W = 1080;
export const H = 1920;
export const FLOOR = 1660;

export type Timeline = {
  title: number;
  room_dur: number;
  bath_dur: number;
  end_dur: number;
  room: Record<string, [number, number]>;
  bath: Record<string, [number, number]>;
  off: {room: number; bath: number; end: number};
  total: number;
  text: Record<string, string>;
  env: Record<string, number[]>;
};
export const T = TL as unknown as Timeline;

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (x: number) => {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
};
export const easeOut = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);
export const pop = (x: number) => {
  const t = clamp01(x);
  const c1 = 2.2;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
export const on = (t: number, a: number, b: number) => t >= a && t < b;

// deterministic pseudo random
export const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
export const noise = (t: number, seed = 0) =>
  Math.sin(t * 13.1 + seed) * 0.5 + Math.sin(t * 29.7 + seed * 2.3) * 0.3 + Math.sin(t * 51.3 + seed * 4.1) * 0.2;

const hex = (c: string) => {
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
export const mix = (a: string, b: string, t: number) => {
  const A = hex(a);
  const B = hex(b);
  const k = clamp01(t);
  const r = A.map((v, i) => Math.round(v + (B[i] - v) * k));
  return '#' + r.map((v) => v.toString(16).padStart(2, '0')).join('');
};

/** which line is active at time t (scene-relative) */
export const activeLine = (ev: Record<string, [number, number]>, ids: string[], t: number) => {
  for (const id of ids) {
    const [s, e] = ev[id];
    if (t >= s && t < e) return id;
  }
  return null;
};

/** mouth openness 0..1 from the loudness envelope of the active line */
export const mouthOf = (ev: Record<string, [number, number]>, ids: string[], t: number) => {
  const id = activeLine(ev, ids, t);
  if (!id) return null;
  const a = T.env[id];
  const f = (t - ev[id][0]) * FPS;
  const i = Math.min(Math.floor(f), a.length - 1);
  const j = Math.min(i + 1, a.length - 1);
  const v = lerp(a[i], a[j], f - Math.floor(f));
  return Math.min(1, v * 1.15);
};

export type Cam = {zoom: number; cx: number; cy: number; sx?: number; sy?: number};

/** smoothed camera: integrates toward per-frame targets for natural easing */
export const followCam = (frame: number, target: (t: number) => Cam, k = 0.075): Cam => {
  let c = target(0);
  for (let f = 1; f <= frame; f++) {
    const g = target(f / FPS);
    c = {zoom: lerp(c.zoom, g.zoom, k), cx: lerp(c.cx, g.cx, k), cy: lerp(c.cy, g.cy, k)};
  }
  // never show outside the 1080x1920 world
  const hw = W / 2 / c.zoom;
  const hh = H / 2 / c.zoom;
  return {zoom: c.zoom, cx: Math.max(hw, Math.min(W - hw, c.cx)), cy: Math.max(hh, Math.min(H - hh, c.cy))};
};

export const toScreen = (c: Cam, x: number, y: number) => ({
  x: (x - c.cx) * c.zoom + W / 2 + (c.sx ?? 0),
  y: (y - c.cy) * c.zoom + H / 2 + (c.sy ?? 0),
});

export const camTransform = (c: Cam) =>
  `translate(${W / 2 + (c.sx ?? 0)}px, ${H / 2 + (c.sy ?? 0)}px) scale(${c.zoom}) translate(${-c.cx}px, ${-c.cy}px)`;

export const PINK = '#E24682';
export const BLUE = '#3C82D7';
