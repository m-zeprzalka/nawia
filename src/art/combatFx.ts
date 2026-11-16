// The light of combat, drawn in code: the smear a blade leaves through the air, and the star of a blow that lands.
//
// The smear: a crescent swept round the hero's shoulder, thick and white at the blade's end, thin and pale at the
// tail. One row for each strike (A, B, C) and view (down, up, side facing right), three frames each: the sweep
// two-thirds done (the swing), the sweep whole (the follow-through), the sweep whole but thinning (the recovery).
// The cell is 48 x 48 and lines up with the hero's 32 x 32 cell: his feet are at (24, 35) here and (16, 27) there,
// so both sprites share an origin in world space.
//
// The impact: a four-pointed star with a ring that flies apart, four frames, in white and greys, tinted by the
// world it happens in.

import { PixelBuffer, rgb } from '../core/PixelBuffer.ts';
import { grid, type Sheet } from './sheet.ts';

export const SMEAR = { fw: 48, fh: 48, cols: 3, cx: 24, foot: 35 } as const;
export type Strike = 'atkA' | 'atkB' | 'atkC';
export type StrikeView = 'down' | 'up' | 'side';
const STRIKES: Strike[] = ['atkA', 'atkB', 'atkC'];
const VIEWS: StrikeView[] = ['down', 'up', 'side'];

/** The row of a smear in its sheet. */
export const smearRow = (s: Strike, v: StrikeView): number => STRIKES.indexOf(s) * 3 + VIEWS.indexOf(v);

interface Arc {
  /** the point it turns round (the shoulder), in the smear cell */
  px: number;
  py: number;
  /** degrees, 0 to the right, 90 down: where the sweep starts and where it ends */
  from: number;
  to: number;
  /** outer radius, px */
  r: number;
  /** thickness at the blade's end */
  thick: number;
}

/**
 * The sweeps. A crosses from his sword side, B comes back the other way, C is the heavy one: wider and longer.
 * Facing us his sword hand is on our left; facing away, on our right; from the side the sweep goes over the top
 * and down in front of him.
 */
export const ARCS: Record<Strike, Record<StrikeView, Arc>> = {
  atkA: {
    down: { px: 24, py: 28, from: 200, to: -15, r: 16, thick: 8 },
    up: { px: 24, py: 23, from: 15, to: -195, r: 15, thick: 7 },
    side: { px: 26, py: 27, from: -120, to: 60, r: 16, thick: 8 },
  },
  atkB: {
    down: { px: 24, py: 28, from: -15, to: 200, r: 16, thick: 8 },
    up: { px: 24, py: 23, from: -195, to: 15, r: 15, thick: 7 },
    side: { px: 26, py: 27, from: 65, to: -105, r: 15, thick: 8 },
  },
  atkC: {
    down: { px: 24, py: 27, from: 220, to: -40, r: 20, thick: 11 },
    up: { px: 24, py: 24, from: 40, to: -220, r: 19, thick: 10 },
    side: { px: 25, py: 26, from: -160, to: 80, r: 20, thick: 11 },
  },
};

const CORE = rgb(0xffffff);
const MID = rgb(0xe4f2ff);
const EDGE = rgb(0xaed0f2);
const TAIL = rgb(0x7ea4d8, 170);

/** Where along the sweep (0 at its start, 1 at its end) a direction lies, or NaN outside it. */
function along(a: Arc, deg: number): number {
  const span = a.to - a.from;
  const d = span >= 0 ? (((deg - a.from) % 360) + 360) % 360 : -((((a.from - deg) % 360) + 360) % 360);
  const s = d / span;
  return s >= 0 && s <= 1 ? s : NaN;
}

/**
 * How thick the crescent is at `u` (0 at its tail, 1 at the blade): a long taper from the tail, fullest just
 * behind the blade, rounded off at the front.
 */
const profile = (u: number): number => (u < 0.8 ? Math.sin((Math.PI / 2) * Math.pow(u / 0.8, 0.9)) : 1 - ((u - 0.8) / 0.2) * 0.45);

function smearFrame(a: Arc, frame: number): PixelBuffer {
  const b = new PixelBuffer(SMEAR.fw, SMEAR.fh);
  // how much of the sweep is drawn; in the last frame only the outer rim of the front half is left
  const reach = frame === 0 ? 0.62 : 1;
  for (let y = 0; y < SMEAR.fh; y++)
    for (let x = 0; x < SMEAR.fw; x++) {
      const dx = x + 0.5 - a.px;
      const dy = y + 0.5 - a.py;
      const r = Math.hypot(dx, dy);
      if (r > a.r || r < 3) continue;
      const s = along(a, (Math.atan2(dy, dx) * 180) / Math.PI);
      if (Number.isNaN(s) || s > reach) continue;
      const u = s / reach;
      const full = Math.max(1, a.thick * profile(u));
      const thick = frame === 2 ? Math.max(1, full * 0.4) : full;
      const depth = a.r - r;
      if (depth > thick) continue;
      if (frame === 2 && u < 0.45) continue;
      // the outer edge is the blade's path: white; inwards it cools; the tail is the faintest
      const k = depth / thick;
      let c: number;
      if (u < 0.22) c = TAIL;
      else if (k < 0.45) c = CORE;
      else if (k < 0.8) c = frame === 2 ? EDGE : MID;
      else c = EDGE;
      b.set(x, y, c);
    }
  return b;
}

export function smearSheet(): Sheet {
  const frames: PixelBuffer[] = [];
  for (const s of STRIKES) for (const v of VIEWS) for (let f = 0; f < 3; f++) frames.push(smearFrame(ARCS[s][v], f));
  return grid('smear', SMEAR.fw, SMEAR.fh, SMEAR.cols, frames);
}

/**
 * The box a sweep covers, from the hero's feet (dx, dy, half width, half height), facing right for the side view.
 * The blade can hurt anything in it while the sweep is drawn.
 */
export function arcBox(s: Strike, v: StrikeView): { dx: number; dy: number; hw: number; hh: number } {
  const a = ARCS[s][v];
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (let k = 0; k <= 32; k++) {
    const deg = a.from + ((a.to - a.from) * k) / 32;
    for (const r of [a.r * 0.45, a.r + 2]) {
      const x = a.px + Math.cos((deg * Math.PI) / 180) * r;
      const y = a.py + Math.sin((deg * Math.PI) / 180) * r;
      x0 = Math.min(x0, x);
      y0 = Math.min(y0, y);
      x1 = Math.max(x1, x);
      y1 = Math.max(y1, y);
    }
  }
  return { dx: (x0 + x1) / 2 - SMEAR.cx, dy: (y0 + y1) / 2 - SMEAR.foot, hw: (x1 - x0) / 2, hh: (y1 - y0) / 2 };
}

// ------------------------------------------------------------------ the impact

/** Frames 0-3: the impact. Frames 4-6: a glint (a small star, large to small), the tell of a coming strike. */
export const IMPACT = { fw: 24, fh: 24, cols: 7, GLINT: 4 } as const;

function impactFrame(f: number): PixelBuffer {
  const b = new PixelBuffer(IMPACT.fw, IMPACT.fh);
  const c = 12;
  const W = rgb(0xffffff);
  const L = rgb(0xe8e8e8);
  const G = rgb(0xb0b0b0, 200);
  const ray = (dx: number, dy: number, len: number, from: number, col: number): void => {
    for (let i = from; i <= len; i++) b.set(c + dx * i, c + dy * i, col);
  };
  if (f === 0) {
    for (let y = -1; y <= 1; y++) for (let x = -1; x <= 1; x++) b.set(c + x, c + y, W);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) ray(dx, dy, 9, 2, W);
    for (const [dx, dy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) ray(dx, dy, 3, 2, L);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      b.set(c + dx * 2 + dy, c + dy * 2 + dx, L);
      b.set(c + dx * 2 - dy, c + dy * 2 - dx, L);
    }
  } else if (f === 1) {
    b.set(c, c, W);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) ray(dx, dy, 11, 4, L);
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2;
      if (k % 2) b.set(Math.round(c + Math.cos(a) * 6), Math.round(c + Math.sin(a) * 6), W);
    }
  } else if (f === 2) {
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) ray(dx, dy, 11, 8, G);
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2 + 0.2;
      if (k % 3 !== 2) b.set(Math.round(c + Math.cos(a) * 9), Math.round(c + Math.sin(a) * 9), L);
    }
  } else {
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2 + 0.4;
      b.set(Math.round(c + Math.cos(a) * 11), Math.round(c + Math.sin(a) * 11), G);
    }
  }
  return b;
}

function glintFrame(size: number): PixelBuffer {
  const b = new PixelBuffer(IMPACT.fw, IMPACT.fh);
  const c = 12;
  const W = rgb(0xffffff);
  const L = rgb(0xd8d8d8);
  b.set(c, c, W);
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) for (let i = 1; i <= size; i++) b.set(c + dx * i, c + dy * i, i < size ? W : L);
  if (size > 2) for (const [dx, dy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) b.set(c + dx, c + dy, L);
  return b;
}

export function impactSheet(): Sheet {
  return grid('impact', IMPACT.fw, IMPACT.fh, IMPACT.cols, [...[0, 1, 2, 3].map(impactFrame), glintFrame(5), glintFrame(3), glintFrame(1)]);
}
