import DATA from './data.json';

export const W = 1080;
export const H = 1920;
export const FPS = 30;
export const FLOOR = 1640;

export type Word = {w: string; s: number; e: number};
export type Chunk = {s: number; e: number; a: number; b: number};
export type SceneData = {
  id: string;
  audio: string;
  audioDur: number;
  dur: number;
  segs: number[][];
  words: Word[];
  chunks: Chunk[];
  env: number[];
};
export const SCENES = (DATA as unknown as {scenes: SceneData[]}).scenes;
export const scene = (id: string) => SCENES.find((s) => s.id === id)!;

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
  return 1 + (c1 + 1) * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
export const on = (t: number, a: number, b: number) => t >= a && t < b;
export const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
export const noise = (t: number, seed = 0) =>
  Math.sin(t * 13.1 + seed) * 0.5 + Math.sin(t * 29.7 + seed * 2.3) * 0.3 + Math.sin(t * 51.3 + seed * 4.1) * 0.2;

/** time (s) when the first word containing `needle` starts (nth occurrence) */
export const wordAt = (sd: SceneData, needle: string, nth = 0) => {
  let k = 0;
  for (const w of sd.words) {
    if (w.w.includes(needle)) {
      if (k === nth) return w.s;
      k++;
    }
  }
  return 1e9;
};

/** mouth openness 0..1 (null when silent) */
export const mouthAt = (sd: SceneData, t: number) => {
  if (t > sd.audioDur) return null;
  const f = t * FPS;
  const i = Math.min(Math.floor(f), sd.env.length - 1);
  const j = Math.min(i + 1, sd.env.length - 1);
  const v = lerp(sd.env[i] ?? 0, sd.env[j] ?? 0, f - Math.floor(f));
  return v < 0.06 ? null : Math.min(1, v * 1.1);
};

export const talking = (sd: SceneData, t: number) => sd.segs.some(([a, b]) => t >= a && t < b);

export type Cam = {zoom: number; cx: number; cy: number; sx?: number; sy?: number};
export const camTransform = (c: Cam) =>
  `translate(${W / 2 + (c.sx ?? 0)}px, ${H / 2 + (c.sy ?? 0)}px) scale(${c.zoom}) translate(${-c.cx}px, ${-c.cy}px)`;

export const mix = (a: string, b: string, t: number) => {
  const p = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const A = p(a);
  const B = p(b);
  const k = clamp01(t);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join('');
};
