// The surface: the village and the forest above the drowned stronghold.
//
// Unlike the stronghold (stamped from a tileset), the surface is *painted*: the ground is computed
// per pixel (so paths, banks and forest edges are organic, not square), and everything that stands
// on it is a stamp drawn by one of the functions below. Every stamp is drawn once per world from
// the same code and two palettes:
//
//   JAWIA  a bright morning. Light comes from the upper left; things cast shadows to the lower right.
//   NAWIA  the same place as the dead remember it: night-blue surfaces whose edges and seams glow.
//
// Ramps go from darkest [0] to lightest. Index [4] is always "the thinnest, brightest line":
// a highlight in Jawia, a glow in Nawia. Keep it to edges and specks and both worlds stay readable.

import type { World } from '../config.ts';
import { PixelBuffer, mix, rgb, type Color } from '../core/PixelBuffer.ts';
import { hash2, mulberry32 } from '../core/rng.ts';

const ramp = (...hex: number[]): Color[] => hex.map((h) => rgb(h));

export interface SurfacePalette {
  /** meadow: dark, mid and light patches */
  grass: Color[];
  /** single blades: a dark one and a light one */
  tuft: Color[];
  /** what lies under the trees */
  forestFloor: Color[];
  /** the trodden path, dark -> light */
  dirt: Color[];
  /** the line where the path meets the grass */
  pathRim: Color;
  pebble: Color[];
  /** deep -> shallow -> foam (Nawia: the abyss, its rim, its stars) */
  water: Color[];
  bank: Color[];
  leaf: Color[];
  pine: Color[];
  birch: Color[];
  thorn: Color[];
  bark: Color[];
  birchBark: Color[];
  thatch: Color[];
  log: Color[];
  stone: Color[];
  wood: Color[];
  /** gaps between logs, planks and stones: dark in Jawia, glowing in Nawia */
  seam: Color;
  /** [petal, heart] */
  flowers: Color[][];
  berry: Color;
  /** light in a window: core, edge */
  window: Color[];
  moss: Color;
  shadow: Color;
  /** how strongly cast shadows darken the ground (0 = this world has no sun) */
  shadowK: number;
  outline: Color;
  glow: boolean;
  /**
   * The blight: what Nawia leaves where it seeps through. Ground (dark, mid, light), a vein, a spark,
   * and a ramp for the thorns and dead wood that grow out of it.
   */
  blight: Color[];
  blightVein: Color;
  blightSpark: Color;
  blightWood: Color[];
}

export const SURF: Record<World, SurfacePalette> = {
  jawia: {
    grass: ramp(0x4a8c42, 0x62a546, 0x80bd50),
    tuft: ramp(0x377338, 0xa9d862),
    forestFloor: ramp(0x1c3530, 0x284636),
    dirt: ramp(0x5f4231, 0x855d3e, 0xab8153, 0xc8a26f, 0xe0c391),
    pathRim: rgb(0x6f5038),
    pebble: ramp(0x7d7168, 0xdcd4c2),
    water: ramp(0x1c4d76, 0x256690, 0x3789a9, 0x62b0c0, 0xa8dedb, 0xf0fbf3),
    bank: ramp(0x4b3b2d, 0x6d573a),
    leaf: ramp(0x12302d, 0x1e4b36, 0x2f6f3e, 0x52994a, 0x93cc5c),
    pine: ramp(0x0e262d, 0x153c39, 0x205742, 0x34794f, 0x62a965),
    birch: ramp(0x2d5a31, 0x4a8537, 0x78ae44, 0xacd25a, 0xdff08a),
    thorn: ramp(0x1b2521, 0x2e3d2a, 0x4b5b31, 0x72823d, 0xa3b354),
    bark: ramp(0x281a1f, 0x45302a, 0x694831, 0x916c46),
    birchBark: ramp(0x2a2a33, 0xb7b3ac, 0xf0ece2),
    thatch: ramp(0x5a4020, 0x88672a, 0xb48d3a, 0xd9b758, 0xf3de92),
    log: ramp(0x2b191b, 0x4b2d24, 0x70472e, 0x97683e, 0xc19359),
    stone: ramp(0x322f3d, 0x54515f, 0x7b7982, 0xa6a4a4, 0xd4d1c6),
    wood: ramp(0x38241f, 0x5d3929, 0x835634, 0xad7f48, 0xd8ae6b),
    seam: rgb(0x2b191b),
    flowers: [ramp(0xf7f3e6, 0xf2c84a), ramp(0xf4cf52, 0xd98b2b), ramp(0xdf4d47, 0x7b1f2b), ramp(0x7393ec, 0xf7f3e6), ramp(0xeb98bc, 0xf7f3e6)],
    berry: rgb(0xc63c4a),
    window: ramp(0xffeba6, 0xe9993a),
    moss: rgb(0x5a9a45),
    shadow: rgb(0x1a2748),
    shadowK: 0.34,
    outline: rgb(0x1a1423),
    glow: false,
    blight: ramp(0x2a1c3a, 0x3b2a4e, 0x4f3a64),
    blightVein: rgb(0x9a4fc8),
    blightSpark: rgb(0xff7ad8),
    blightWood: ramp(0x1c1026, 0x2e1c40, 0x4b2a66, 0x703c94, 0xb46edc),
  },
  nawia: {
    grass: ramp(0x0b1030, 0x0f1640, 0x141d50),
    tuft: ramp(0x1e6c8a, 0x3db6c6),
    forestFloor: ramp(0x05060f, 0x080b1c),
    dirt: ramp(0x161f55, 0x1e2b6c, 0x263680, 0x30449a, 0x7c98ec),
    pathRim: rgb(0x3db6c6),
    pebble: ramp(0x2e46a0, 0xcfe3ff),
    water: ramp(0x03040c, 0x05071a, 0x090d2a, 0x121b50, 0x3db6c6, 0xdcffff),
    bank: ramp(0x080b20, 0x0c1130),
    leaf: ramp(0x05071a, 0x0a0f2c, 0x111a48, 0x1b2a6c, 0x6fd8e8),
    pine: ramp(0x05071a, 0x090e2a, 0x0f1840, 0x18265e, 0x58bcd8),
    birch: ramp(0x0a0f2c, 0x141e52, 0x223484, 0x3c58b8, 0xa8c8ff),
    thorn: ramp(0x05071a, 0x0a0f2c, 0x111a48, 0x1b2a6c, 0x6fd8e8),
    bark: ramp(0x0a0d28, 0x182058, 0x2c3c8e, 0x6f8fe0),
    birchBark: ramp(0x18225a, 0x98b6f4, 0xf5fbff),
    thatch: ramp(0x0a0e2a, 0x121a4a, 0x1b2970, 0x2c449c, 0x8ef0ee),
    log: ramp(0x080a1b, 0x0f1336, 0x182058, 0x26347e, 0x6fd8e8),
    stone: ramp(0x0d102e, 0x191f4e, 0x293376, 0x3f4fa6, 0x93adf0),
    wood: ramp(0x18225a, 0x2e46a0, 0x5d7dd6, 0x98b6f4, 0xcfe3ff),
    seam: rgb(0x2a8aa8),
    flowers: [ramp(0xffd8ff, 0xe08ae8), ramp(0xdcffff, 0x8ef0ee), ramp(0xe08ae8, 0xa84fc8)],
    berry: rgb(0xe08ae8),
    window: ramp(0xffd8ff, 0xa84fc8),
    moss: rgb(0x1e6c8a),
    shadow: rgb(0x000000),
    shadowK: 0,
    outline: rgb(0x03040c),
    glow: true,
    blight: ramp(0x1c0f38, 0x2a1650, 0x3a1e6a),
    blightVein: rgb(0xe08ae8),
    blightSpark: rgb(0xffd8ff),
    blightWood: ramp(0x12082a, 0x2a1650, 0x5a2a96, 0xa84fc8, 0xffa8f4),
  },
};

// ------------------------------------------------------------------ moods
// The same landscape at another hour or in another season: every colour of a palette is passed through
// one function, and a few ramps are replaced outright. Used by the playground to compare looks;
// a mood that wins can become the palette of the game (or of one part of it).

const lum = (c: Color): number => (0.3 * (c & 255) + 0.59 * ((c >> 8) & 255) + 0.11 * ((c >> 16) & 255)) / 255;

/** Scales saturation and brightness. */
function adjust(c: Color, sat: number, val: number): Color {
  const l = lum(c) * 255;
  const ch = (v: number): number => Math.max(0, Math.min(255, Math.round((l + (v - l) * sat) * val)));
  return ((c & 0xff000000) | (ch((c >> 16) & 255) << 16) | (ch((c >> 8) & 255) << 8) | ch(c & 255)) >>> 0;
}

/** Applies `f` to every colour of a palette, then lays `over` on top. */
function recolour(p: SurfacePalette, f: (c: Color) => Color, over: Partial<SurfacePalette> = {}): SurfacePalette {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(p)) {
    if (k === 'shadowK' || typeof v === 'boolean') out[k] = v;
    else if (typeof v === 'number') out[k] = f(v);
    else out[k] = (v as (Color | Color[])[]).map((x) => (typeof x === 'number' ? f(x) : x.map(f)));
  }
  return { ...(out as unknown as SurfacePalette), ...over };
}

export interface Mood {
  id: string;
  name: { pl: string; en: string };
  palette: SurfacePalette;
  /** what the same light does to anyone standing in it: a multiply tint for sprites (0xRRGGBB) */
  tint: number;
}

const DAY = SURF.jawia;

/** Looks for the living world. Nawia has one look only: it does not have weather. */
export const MOODS: Mood[] = [
  { id: 'poranek', name: { pl: 'poranek', en: 'morning' }, palette: DAY, tint: 0xffffff },
  {
    id: 'zmierzch',
    name: { pl: 'zmierzch', en: 'dusk' },
    tint: 0xffd2b0,
    // low sun: warm where the light falls, violet where it does not, long dark shadows
    palette: recolour(
      DAY,
      (c) => {
        const l = lum(c);
        const a = adjust(c, 0.92, 0.86);
        return mix(mix(a, rgb(0xff9650, c >>> 24), 0.24 * l), rgb(0x34246a, c >>> 24), 0.34 * (1 - l));
      },
      { shadow: rgb(0x24143e), shadowK: 0.48, window: DAY.window },
    ),
  },
  {
    id: 'jesien',
    name: { pl: 'jesień', en: 'autumn' },
    tint: 0xfff0dc,
    palette: recolour(DAY, (c) => adjust(c, 0.9, 0.95), {
      grass: ramp(0x6a6a34, 0x86843c, 0xa39c48),
      tuft: ramp(0x52552a, 0xd9b95a),
      forestFloor: ramp(0x2e2218, 0x4a3420),
      leaf: ramp(0x3a1a18, 0x7a2c1c, 0xb4501e, 0xdc8a2a, 0xf6c850),
      birch: ramp(0x6a4812, 0xa87a1c, 0xd8aa2c, 0xf2d24c, 0xfcea90),
      thorn: ramp(0x231a14, 0x3e2c1e, 0x624428, 0x8a6030, 0xb88a44),
      moss: rgb(0x8a8438),
    }),
  },
  {
    id: 'ponuro',
    name: { pl: 'ponuro', en: 'overcast' },
    tint: 0xbcc2d2,
    // no sun at all: the colour drains out, shadows go soft, everything leans towards slate
    palette: recolour(DAY, (c) => mix(adjust(c, 0.46, 0.78), rgb(0x56607a, c >>> 24), 0.15), { shadowK: 0.18 }),
  },
  {
    id: 'noc',
    name: { pl: 'noc', en: 'night' },
    tint: 0x7484c4,
    palette: recolour(DAY, (c) => mix(adjust(c, 0.55, 0.47), rgb(0x2a3c8c, c >>> 24), 0.3), { shadow: rgb(0x04051a), shadowK: 0.32, window: DAY.window }),
  },
];

/** The Mega Drive could show 512 colours: three bits a channel. Snaps a picture to that grid. */
export function quantize9(b: PixelBuffer): void {
  const q = (v: number): number => Math.round(Math.round((v / 255) * 7) * (255 / 7));
  for (let i = 0; i < b.u32.length; i++) {
    const c = b.u32[i];
    if (c >>> 24 === 0) continue;
    b.u32[i] = ((c & 0xff000000) | (q((c >> 16) & 255) << 16) | (q((c >> 8) & 255) << 8) | q(c & 255)) >>> 0;
  }
}

// ------------------------------------------------------------------ noise

/** Smooth value noise, 0..1. Feed it global pixel coordinates and patterns run on across rooms. */
export function vnoise(x: number, y: number, seed: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const fx = x - xi;
  const fy = y - yi;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const a = hash2(xi, yi, seed);
  const b = hash2(xi + 1, yi, seed);
  const c = hash2(xi, yi + 1, seed);
  const d = hash2(xi + 1, yi + 1, seed);
  const top = a + (b - a) * sx;
  const bot = c + (d - c) * sx;
  return (top + (bot - top) * sy) / 4294967296;
}

/**
 * The same noise as `vnoise(x * sx, y * sy, seed)` for a whole rectangle of pixels starting at (ox, oy):
 * the lattice is hashed once instead of four times per pixel.
 */
export function noiseField(w: number, h: number, ox: number, oy: number, sx: number, sy: number, seed: number): Float32Array {
  const out = new Float32Array(w * h);
  const x0 = Math.floor(ox * sx);
  const y0 = Math.floor(oy * sy);
  const gw = Math.floor((ox + w) * sx) - x0 + 2;
  const gh = Math.floor((oy + h) * sy) - y0 + 2;
  const lat = new Float32Array(gw * gh);
  for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) lat[j * gw + i] = hash2(x0 + i, y0 + j, seed) / 4294967296;
  for (let py = 0; py < h; py++) {
    const fy = (oy + py) * sy;
    const yi = Math.floor(fy);
    const ty = fy - yi;
    const wy = ty * ty * (3 - 2 * ty);
    const row = (yi - y0) * gw;
    for (let px = 0; px < w; px++) {
      const fx = (ox + px) * sx;
      const xi = Math.floor(fx);
      const tx = fx - xi;
      const wx = tx * tx * (3 - 2 * tx);
      const k = row + xi - x0;
      const top = lat[k] + (lat[k + 1] - lat[k]) * wx;
      const bot = lat[k + gw] + (lat[k + gw + 1] - lat[k + gw]) * wx;
      out[py * w + px] = top + (bot - top) * wy;
    }
  }
  return out;
}

// ------------------------------------------------------------------ stamps

/** A picture with a foot: (ax, ay) is the pixel that stands on the ground. */
export interface Stamp {
  buf: PixelBuffer;
  ax: number;
  ay: number;
}

const opaque = (b: PixelBuffer, x: number, y: number): boolean => b.get(x, y) >>> 24 !== 0;

/**
 * Outlines a shape the way the light falls: the edges that face the sun get `lit`,
 * the ones that face away get `dark`.
 */
function rim(b: PixelBuffer, lit: Color | null, dark: Color): void {
  const edge: [number, number, Color][] = [];
  for (let y = 0; y < b.h; y++)
    for (let x = 0; x < b.w; x++) {
      if (!opaque(b, x, y)) continue;
      const up = !opaque(b, x, y - 1);
      const down = !opaque(b, x, y + 1);
      const left = !opaque(b, x - 1, y);
      const right = !opaque(b, x + 1, y);
      if (!(up || down || left || right)) continue;
      if (down || (right && !up)) edge.push([x, y, dark]);
      else if (lit !== null) edge.push([x, y, lit]);
    }
  for (const [x, y, c] of edge) b.set(x, y, c);
}

interface Lobe {
  x: number;
  y: number;
  r: number;
}

/**
 * A mass of foliage: a few overlapping spheres, cel-shaded in four tones, with leaf-sized ticks
 * so it reads as leaves and not as a balloon. Coordinates are relative to the foot (0, 0).
 */
function foliage(lobes: Lobe[], c: readonly Color[], seed: number, glow: boolean, squash = 0.84): Stamp {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const l of lobes) {
    x0 = Math.min(x0, l.x - l.r);
    x1 = Math.max(x1, l.x + l.r);
    y0 = Math.min(y0, l.y - l.r * squash);
    y1 = Math.max(y1, l.y + l.r * squash);
  }
  const ox = Math.floor(x0) - 1;
  const oy = Math.floor(y0) - 1;
  const w = Math.ceil(x1) - ox + 2;
  const h = Math.ceil(y1) - oy + 2;
  const band = new Int8Array(w * h).fill(-1);
  for (let py = 0; py < h; py++)
    for (let px = 0; px < w; px++) {
      const X = px + ox + 0.5;
      const Y = py + oy + 0.5;
      let best = -1e9;
      let lum = 0;
      for (const l of lobes) {
        const dx = (X - l.x) / l.r;
        const dy = (Y - l.y) / (l.r * squash);
        const d2 = dx * dx + dy * dy;
        if (d2 >= 1) continue;
        const nz = Math.sqrt(1 - d2);
        // lobes lower on the screen are nearer to us
        const z = nz * l.r + l.y * 0.45;
        if (z > best) {
          best = z;
          lum = dx * -0.5 + dy * -0.62 + nz * 0.6;
        }
      }
      if (best > -1e9) band[py * w + px] = lum > 0.8 ? 3 : lum > 0.44 ? 2 : lum > 0.1 ? 1 : 0;
    }
  const buf = new PixelBuffer(w, h);
  for (let i = 0; i < band.length; i++) if (band[i] >= 0) buf.u32[i] = c[band[i]];
  // leaves: short ticks one tone up or down
  const tick = (px: number, py: number, want: number, col: Color): void => {
    if (px < 0 || py < 0 || px >= w || py >= h || band[py * w + px] !== want) return;
    buf.set(px, py, col);
  };
  for (let py = 0; py < h; py++)
    for (let px = 0; px < w; px++) {
      const bd = band[py * w + px];
      if (bd < 0) continue;
      const hs = hash2(px, py, seed);
      const diag = (hs >>> 8) & 1;
      if (bd === 3) {
        if (hs % (glow ? 19 : 9) === 0) { tick(px, py, 3, c[4]); if (!glow) tick(px + 1, py + diag, 3, c[4]); }
        else if (hs % 9 === 1) tick(px, py, 3, c[2]);
      } else if (bd === 2) {
        if (hs % 6 === 0) { tick(px, py, 2, c[3]); tick(px + 1, py + diag, 2, c[3]); }
        else if (hs % 6 === 1) { tick(px, py, 2, c[1]); tick(px + 1, py + 1 - diag, 2, c[1]); }
      } else if (bd === 1) {
        if (hs % 6 === 0) { tick(px, py, 1, c[2]); tick(px + 1, py + diag, 1, c[2]); }
        else if (hs % 7 === 1) tick(px, py, 1, c[0]);
      } else if (hs % 8 === 0) tick(px, py, 0, c[1]);
    }
  rim(buf, glow ? c[4] : c[1], c[0]);
  return { buf, ax: -ox, ay: -oy };
}

/** Puts a trunk and a crown on one card. The trunk is dark where the crown shades it. */
function tree(crown: Stamp, trunkW: number, trunkH: number, bark: readonly Color[], birch = false): Stamp {
  const half = Math.ceil(trunkW / 2) + 2;
  const ax = Math.max(crown.ax, half);
  const w = Math.max(crown.buf.w - crown.ax, half + 1) + ax;
  const ay = Math.max(crown.ay, trunkH + 2);
  const h = ay + 2;
  const buf = new PixelBuffer(w, h);
  const x0 = ax - Math.floor(trunkW / 2);
  for (let y = ay - trunkH - 2; y <= ay; y++)
    for (let i = 0; i < trunkW; i++) {
      let col: Color;
      if (birch) col = i === trunkW - 1 ? bark[1] : bark[2];
      else col = i === 0 ? bark[2] : i === trunkW - 1 ? bark[0] : bark[1];
      buf.set(x0 + i, y, col);
    }
  if (birch) {
    // the black marks of a birch
    for (let y = ay - trunkH; y <= ay; y += 3) {
      const side = (y & 2) === 0;
      buf.set(side ? x0 : x0 + trunkW - 1, y, bark[0]);
      buf.set(side ? x0 + 1 : x0 + trunkW - 2, y, bark[0]);
    }
    buf.set(x0 - 1, ay, bark[0]);
    buf.set(x0 + trunkW, ay, bark[0]);
  } else {
    for (let y = ay - trunkH; y < ay - 1; y += 2) if (trunkW > 3) buf.set(x0 + 1 + ((y >> 1) % (trunkW - 2)), y, bark[y & 2 ? 2 : 0]);
    // roots
    buf.set(x0 - 1, ay, bark[1]);
    buf.set(x0 - 1, ay - 1, bark[2]);
    buf.set(x0 + trunkW, ay, bark[0]);
    buf.set(x0 + trunkW, ay - 1, bark[0]);
    if (trunkW > 5) { buf.set(x0 - 2, ay, bark[1]); buf.set(x0 + trunkW + 1, ay, bark[0]); }
  }
  buf.blit(crown.buf, ax - crown.ax, ay - crown.ay);
  // the crown's shadow on the trunk
  for (let i = 0; i < trunkW; i++) {
    const x = x0 + i;
    let last = -1;
    for (let y = 0; y < ay - 2; y++) if (opaque(crown.buf, x - (ax - crown.ax), y - (ay - crown.ay))) last = y;
    if (last >= 0) for (let y = last + 1; y <= Math.min(last + 2, ay - 1); y++) buf.set(x, y, bark[0]);
  }
  return { buf, ax, ay };
}

/** A leafy tree. `r` is the radius of the crown: 10 is a forest tree, 15 a village giant. */
export function oak(p: SurfacePalette, seed: number, r: number, colors: readonly Color[] = p.leaf): Stamp {
  const rng = mulberry32(seed);
  const trunkH = r > 12 ? 13 : 10;
  const cy = -(trunkH + r * 0.6);
  const lobes: Lobe[] = [{ x: 0, y: cy, r }];
  const n = r > 12 ? 7 : 5;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rng() * 0.7;
    lobes.push({ x: Math.cos(a) * r * 0.7, y: cy + Math.sin(a) * r * 0.5, r: r * (0.5 + rng() * 0.2) });
  }
  return tree(foliage(lobes, colors, seed, p.glow), r > 12 ? 7 : r > 9.9 ? 5 : 4, trunkH, p.bark);
}

export function birch(p: SurfacePalette, seed: number): Stamp {
  const rng = mulberry32(seed);
  const lobes: Lobe[] = [{ x: 0, y: -21, r: 6.5 }];
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + rng();
    lobes.push({ x: Math.cos(a) * 4.5, y: -21 + Math.sin(a) * 4, r: 3.6 + rng() * 1.4 });
  }
  return tree(foliage(lobes, p.birch, seed, p.glow), 3, 15, p.birchBark, true);
}

/** A spruce: tiers of boughs, each one shading the one below. */
export function spruce(p: SurfacePalette, seed: number, height = 32): Stamp {
  const c = p.pine;
  const tiers = 4;
  const maxHw = 10;
  const w = maxHw * 2 + 3;
  const ax = maxHw + 1;
  const ay = height;
  const buf = new PixelBuffer(w, ay + 2);
  // trunk
  for (let y = ay - 4; y <= ay; y++) {
    buf.set(ax - 1, y, p.bark[2]);
    buf.set(ax, y, p.bark[1]);
    buf.set(ax + 1, y, p.bark[0]);
  }
  buf.set(ax - 2, ay, p.bark[1]);
  buf.set(ax + 2, ay, p.bark[0]);
  const step = (height - 3 - 11) / (tiers - 1);
  for (let t = tiers - 1; t >= 0; t--) {
    const top = Math.round(ay - height + t * step);
    const th = 11;
    const hwB = 4 + t * 2.1;
    for (let r = 0; r < th; r++) {
      const hw = Math.max(0.6, ((r + 1) / th) * hwB);
      const n = Math.floor(hw);
      const y = top + r;
      for (let x = -n; x <= n; x++) {
        const hs = hash2(x + 40, y, seed + t);
        if (r === th - 1 && hs % 3 === 0) continue; // ragged hem
        const u = x / hw;
        let tone = u < -0.35 ? 3 : u < 0.3 ? 2 : 1;
        if (r >= th - 2) tone = Math.max(1, tone - 1);
        if (hs % 6 === 0) tone = Math.max(0, tone - 1);
        else if (hs % 13 === 1) tone = Math.min(3, tone + 1);
        if (x === n) tone = 0;
        let col = c[tone];
        if (x === -n && r > 1) col = p.glow ? c[4] : c[3];
        buf.set(ax + x, y, col);
      }
    }
    // this tier's shadow on the one below
    if (t < tiers - 1) {
      const y = top + th;
      for (let x = -Math.floor(hwB) + 1; x <= Math.floor(hwB); x++) if (opaque(buf, ax + x, y)) buf.set(ax + x, y, c[0]);
    }
  }
  buf.set(ax, ay - height, p.glow ? c[4] : c[3]);
  return { buf, ax, ay };
}

export function bush(p: SurfacePalette, seed: number): Stamp {
  const s = foliage(
    [{ x: 0, y: -6, r: 5.6 }, { x: -4, y: -4.5, r: 4.2 }, { x: 4, y: -4.5, r: 4.4 }],
    p.leaf, seed, p.glow, 0.8,
  );
  const rng = mulberry32(seed);
  for (let i = 0; i < 4; i++) {
    const x = s.ax - 5 + Math.floor(rng() * 9);
    const y = s.ay - 9 + Math.floor(rng() * 5);
    if (opaque(s.buf, x, y) && opaque(s.buf, x + 1, y + 1)) s.buf.set(x, y, p.berry);
  }
  return s;
}

/** Brambles: what grows over a path nobody walks any more. With the blight's ramp they are its thorns. */
export function thicket(p: SurfacePalette, seed: number, colors: readonly Color[] = p.thorn, berry: Color = p.berry): Stamp {
  const rng = mulberry32(seed);
  const s = foliage(
    [
      { x: -1, y: -6, r: 6.2 }, { x: -5.5, y: -4.5, r: 4.6 }, { x: 5, y: -4.8, r: 4.8 },
      { x: 1 + rng() * 2, y: -10, r: 4.4 },
    ],
    colors, seed, p.glow, 0.82,
  );
  const b = s.buf;
  // thorny canes sticking out, and a few berries
  for (let i = 0; i < 5; i++) {
    const x = s.ax - 7 + Math.floor(rng() * 15);
    let y = 0;
    while (y < b.h && !opaque(b, x, y)) y++;
    if (y >= b.h) continue;
    b.set(x, y - 1, p.bark[1]);
    b.set(x + (i & 1 ? 1 : -1), y - 2, p.bark[2]);
  }
  for (let i = 0; i < 5; i++) {
    const x = s.ax - 6 + Math.floor(rng() * 12);
    const y = s.ay - 10 + Math.floor(rng() * 7);
    if (opaque(b, x, y) && opaque(b, x - 1, y) && opaque(b, x, y + 1)) b.set(x, y, berry);
  }
  return s;
}

/** A tree the blight has killed: bare, crooked, with the other side glowing in its knots. */
export function deadTree(p: SurfacePalette, seed: number): Stamp {
  const c = p.blightWood;
  const rng = mulberry32(seed);
  const buf = new PixelBuffer(30, 36);
  const ax = 15;
  const ay = 35;
  const dot = (x: number, y: number, col: Color): void => buf.set(Math.round(x), Math.round(y), col);
  // trunk: leaning a little, thinner towards the top
  const top = ay - 24;
  for (let y = ay; y >= top; y--) {
    const t = (ay - y) / 24;
    const cx = ax + Math.sin(t * 2.4 + seed) * 1.6;
    const half = 2.2 - t * 1.3;
    for (let x = Math.round(cx - half); x <= Math.round(cx + half); x++) dot(x, y, x < cx - half * 0.3 ? c[2] : x > cx + half * 0.4 ? c[0] : c[1]);
  }
  buf.set(ax - 3, ay, c[1]); buf.set(ax + 3, ay, c[0]); buf.set(ax - 4, ay, c[0]);
  // boughs: each one reaches up and out, forks once, and ends in a knot of sick leaves
  for (let i = 0; i < 5; i++) {
    const side = i % 2 ? 1 : -1;
    const y0 = ay - 9 - i * 3.6;
    const len = 6 + rng() * 5;
    let x = ax + side * 1.5;
    let y = y0;
    for (let k = 0; k < len; k++) {
      x += side * (0.75 + rng() * 0.3);
      y -= 0.45 + rng() * 0.5;
      dot(x, y, k < 2 ? c[1] : c[2]);
      if (k < 3) dot(x, y + 1, c[0]);
      if (k === Math.floor(len / 2)) for (let j = 1; j <= 3; j++) dot(x + side * j * 0.5, y - j, c[2]);
    }
    for (const [dx, dy] of [[0, 0], [1, 0], [0, -1], [-1, 0], [0, 1], [side, -1]]) dot(x + dx, y + dy - 1, dx === 0 && dy === 0 ? p.blightSpark : c[3]);
  }
  dot(ax + Math.sin(2.4 + seed) * 1.6, top - 1, c[3]);
  rim(buf, p.glow ? c[4] : null, c[0]);
  // knots where the other side shows through
  buf.set(ax, ay - 7, p.blightSpark);
  buf.set(ax - 1, ay - 14, p.blightVein);
  return { buf, ax, ay };
}

/** A haystack on its pole. */
export function haystack(p: SurfacePalette): Stamp {
  const T = p.thatch;
  const buf = new PixelBuffer(18, 24);
  for (let y = 3; y < 24; y++) {
    const t = (y - 3) / 20;
    const half = 2 + Math.pow(t, 0.55) * 6.6;
    for (let x = Math.round(9 - half); x < Math.round(9 + half); x++) {
      const u = (x - 9) / half;
      const strand = hash2(x, Math.floor(y / 4), 13) % 6;
      let col: Color = u < -0.45 ? T[3] : u > 0.4 ? T[1] : T[2];
      if (strand === 0) col = T[3];
      else if (strand === 1 && u > -0.4) col = T[1];
      if (y % 6 === 5) col = T[1];
      buf.set(x, y, col);
    }
  }
  buf.set(8, 0, p.wood[2]); buf.set(8, 1, p.wood[2]); buf.set(8, 2, p.wood[1]); buf.set(9, 1, p.wood[0]); buf.set(9, 2, p.wood[0]);
  rim(buf, p.glow ? T[4] : null, T[0]);
  return { buf, ax: 9, ay: 23 };
}

/** A log hive under a straw cap. */
export function beehive(p: SurfacePalette): Stamp {
  const buf = new PixelBuffer(14, 18);
  for (let y = 6; y < 18; y++)
    for (let x = 2; x < 12; x++) {
      const col = x < 4 ? p.wood[3] : x > 9 ? p.wood[1] : (x + y) % 5 === 0 ? p.wood[1] : p.wood[2];
      buf.set(x, y, y === 17 ? p.wood[0] : col);
    }
  for (let x = 5; x < 9; x++) { buf.set(x, 13, p.outline); buf.set(x, 14, p.outline); }
  buf.set(4, 15, p.wood[4]); buf.set(9, 15, p.wood[4]);
  for (let y = 0; y < 7; y++) {
    const half = 1 + y;
    for (let x = 7 - half; x < 7 + half; x++) buf.set(x, y, y === 6 ? p.thatch[0] : x < 7 - half + 2 ? p.thatch[3] : x >= 7 + half - 2 ? p.thatch[1] : p.thatch[2]);
  }
  rim(buf, p.glow ? p.thatch[4] : null, p.outline);
  return { buf, ax: 7, ay: 17 };
}

/** Hollyhocks, the flower of every village fence. */
export function hollyhocks(p: SurfacePalette, seed: number): Stamp {
  const buf = new PixelBuffer(16, 24);
  const rng = mulberry32(seed);
  for (let i = 0; i < 3; i++) {
    const x = 3 + i * 5;
    const top = 2 + Math.floor(rng() * 5);
    const f = p.flowers[(i + seed) % p.flowers.length];
    for (let y = top; y < 24; y++) buf.set(x, y, y > 18 ? p.tuft[0] : p.leaf[3]);
    for (let y = top; y < 17; y += 3) {
      const side = ((y + i) & 1) * 2 - 1;
      buf.set(x, y, f[1]); buf.set(x + side, y, f[0]); buf.set(x + side, y + 1, f[0]); buf.set(x, y + 1, f[0]); buf.set(x - side, y, f[0]);
    }
    // leaves at the foot
    for (let k = 0; k < 3; k++) { buf.set(x - 1 - k, 21 + (k > 0 ? 1 : 0), p.leaf[3]); buf.set(x + 1 + k, 20 + (k > 1 ? 1 : 0), p.leaf[2]); }
  }
  return { buf, ax: 8, ay: 23 };
}

/** What is left of a tree in Jawia. Low enough to step over. */
export function stump(p: SurfacePalette): Stamp {
  const buf = new PixelBuffer(11, 9);
  for (let y = 0; y < 9; y++)
    for (let x = 0; x < 11; x++) {
      const nx = (x + 0.5 - 5.5) / 5.5;
      const top = (y + 0.5 - 3) / 3;
      if (nx * nx + top * top < 1) {
        const d = Math.sqrt(nx * nx + top * top);
        buf.set(x, y, d > 0.8 ? p.wood[2] : d > 0.5 ? p.wood[4] : d > 0.3 ? p.wood[3] : p.wood[4]);
      } else if (y >= 3 && Math.abs(nx) < 1 && (y - 5.5) / 3 < Math.sqrt(1 - nx * nx) * 0.9) {
        buf.set(x, y, nx < -0.4 ? p.bark[2] : nx > 0.5 ? p.bark[0] : p.bark[1]);
      }
    }
  buf.set(5, 3, p.wood[2]);
  rim(buf, null, p.bark[0]);
  return { buf, ax: 5, ay: 8 };
}

export function boulder(p: SurfacePalette, seed: number, w = 14, h = 12): Stamp {
  const buf = new PixelBuffer(w, h);
  const c = p.stone;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const nx = (x + 0.5 - w / 2) / (w / 2);
      const ny = (y + 0.5 - h / 2) / (h / 2);
      if (Math.pow(Math.abs(nx), 2.6) + Math.pow(Math.abs(ny), 2.6) >= 1) continue;
      const lum = -nx * 0.5 - ny * 0.75 + (vnoise(x * 0.5, y * 0.5, seed) - 0.5) * 0.5;
      buf.set(x, y, lum > 0.42 ? c[3] : lum > -0.2 ? c[2] : c[1]);
    }
  // a crack, and moss on the crown
  let cx = Math.floor(w * 0.55);
  for (let y = 3; y < h - 3; y++) {
    if (opaque(buf, cx, y)) buf.set(cx, y, c[1]);
    if (hash2(cx, y, seed) % 3 === 0) cx += hash2(y, cx, seed) % 2 ? 1 : -1;
  }
  for (let x = 2; x < w - 2; x++) {
    const hs = hash2(x, 1, seed);
    if (hs % 3 === 0) continue;
    for (let y = 0; y < 3; y++) if (opaque(buf, x, y) && !opaque(buf, x, y - 1)) { buf.set(x, y, p.moss); if (hs % 2 && opaque(buf, x, y + 1)) buf.set(x, y + 1, p.moss); }
  }
  rim(buf, p.glow ? c[4] : null, c[0]);
  return { buf, ax: Math.floor(w / 2), ay: h - 1 };
}

/** A well with a little roof. Its foot is the bottom of the stone ring. */
export function well(p: SurfacePalette): Stamp {
  const buf = new PixelBuffer(18, 30);
  const ax = 9;
  const ay = 29;
  const s = p.stone;
  // posts and windlass
  for (let y = 9; y <= 21; y++) {
    buf.set(2, y, p.wood[3]); buf.set(3, y, p.wood[1]);
    buf.set(14, y, p.wood[2]); buf.set(15, y, p.wood[0]);
  }
  for (let x = 2; x <= 15; x++) { buf.set(x, 11, p.wood[3]); buf.set(x, 12, p.wood[1]); }
  for (let y = 13; y <= 17; y++) buf.set(9, y, p.wood[0]);
  for (let y = 17; y <= 19; y++) for (let x = 7; x <= 10; x++) buf.set(x, y, y === 17 ? p.wood[4] : x === 10 ? p.wood[1] : p.wood[3]);
  // roof
  for (let y = 0; y <= 8; y++) {
    const hw = 3 + y;
    for (let x = ax - hw; x < ax + hw; x++) {
      if (x < 0 || x >= 18) continue;
      const hs = hash2(x, y, 77);
      let col = y === 8 ? p.thatch[0] : x < ax - hw + 2 ? p.thatch[3] : x >= ax + hw - 2 ? p.thatch[1] : p.thatch[2];
      if (y < 8 && y % 3 === 2) col = p.thatch[1];
      else if (y < 8 && hs % 5 === 0) col = p.thatch[3];
      if (y === 0) col = p.thatch[4];
      buf.set(x, y, col);
    }
  }
  // stone ring
  for (let y = 18; y <= ay; y++)
    for (let x = 0; x < 18; x++) {
      const nx = (x + 0.5 - 9) / 8.5;
      const rimY = (y + 0.5 - 22) / 4;
      const inRim = nx * nx + rimY * rimY < 1;
      const wall = y >= 22 && Math.abs(nx) < 1 && (y - 25.5) / 4.2 < Math.sqrt(1 - nx * nx);
      if (inRim) {
        const hole = nx * nx / 0.5 + rimY * rimY / 0.42 < 1;
        buf.set(x, y, hole ? (rimY > 0.1 ? p.water[1] : p.outline) : nx < -0.3 ? s[4] : s[3]);
      } else if (wall) {
        const course = ((y - 22) >> 2) & 1;
        const joint = (y - 22) % 4 === 3 || (x + course * 3) % 6 === 0;
        buf.set(x, y, joint ? p.seam : nx < -0.45 ? s[3] : nx > 0.5 ? s[1] : s[2]);
      }
    }
  rim(buf, null, p.outline);
  return { buf, ax, ay };
}

// ------------------------------------------------------------------ things drawn in place

/** One tile of palisade: four sharpened logs. Returns nothing; draws into `b` at the cell's top-left. */
export function drawPalisade(b: PixelBuffer, p: SurfacePalette, x0: number, y0: number, seed: number): void {
  const c = p.log;
  for (let i = 0; i < 4; i++) {
    const x = x0 + i * 4;
    const top = y0 - 7 + (hash2(i, seed, 3) % 3);
    for (let y = top; y < y0 + 16; y++) {
      const r = y - top;
      if (r === 0) { b.set(x + 1, y, p.glow ? c[4] : c[3]); continue; }
      if (r === 1) { b.set(x, y, c[3]); b.set(x + 1, y, c[2]); b.set(x + 2, y, c[1]); continue; }
      b.set(x, y, c[3]);
      b.set(x + 1, y, c[2]);
      b.set(x + 2, y, c[1]);
      b.set(x + 3, y, p.seam);
      if (hash2(x, y, seed) % 11 === 0) b.set(x + 1, y, c[1]);
    }
    b.set(x, y0 + 15, c[0]); b.set(x + 1, y0 + 15, c[0]); b.set(x + 2, y0 + 15, c[0]);
  }
  // the rail that holds them together
  for (let x = x0; x < x0 + 16; x++) {
    b.set(x, y0 + 3, c[4]);
    b.set(x, y0 + 4, c[2]);
    b.set(x, y0 + 5, c[0]);
  }
}

/** One tile of wattle fence. `vertical`: the run goes up and down the screen. */
export function drawWattle(b: PixelBuffer, p: SurfacePalette, x0: number, y0: number, vertical: boolean): void {
  const c = p.wood;
  if (vertical) {
    for (let y = y0; y < y0 + 16; y++) {
      const k = (y - y0) % 5;
      for (let i = 0; i < 4; i++) {
        const weave = ((y >> 1) + i) & 1;
        b.set(x0 + 6 + i, y, i === 3 ? c[0] : weave ? c[3] : c[2]);
      }
      if (k === 0) { b.set(x0 + 5, y, c[1]); b.set(x0 + 10, y, c[0]); }
    }
    b.set(x0 + 7, y0 - 2, c[2]); b.set(x0 + 7, y0 - 1, c[2]); b.set(x0 + 8, y0 - 2, c[1]); b.set(x0 + 8, y0 - 1, c[1]);
    return;
  }
  // withies woven between stakes
  for (let k = 0; k < 4; k++) {
    const y = y0 + 5 + k * 2;
    for (let x = x0; x < x0 + 16; x++) {
      const over = (Math.floor((x - x0 + 1) / 5) + k) & 1;
      b.set(x, y, over ? c[3] : c[2]);
      b.set(x, y + 1, over ? c[2] : c[1]);
    }
  }
  for (let x = x0; x < x0 + 16; x++) b.set(x, y0 + 13, c[0]);
  for (const sx of [2, 7, 12]) {
    for (let y = y0 + 2; y <= y0 + 14; y++) {
      const hidden = y >= y0 + 5 && y < y0 + 13 && ((Math.floor((y - y0 - 5) / 2) + Math.floor(sx / 5)) & 1) === 0;
      if (hidden) continue;
      b.set(x0 + sx, y, c[2]);
      b.set(x0 + sx + 1, y, c[0]);
    }
    b.set(x0 + sx, y0 + 2, c[4]);
  }
}

/**
 * A log house under thatch, sized to a block of tiles. The front wall with the door is the bottom
 * tile row; everything above it is roof. `high` gets the crossed gable poles that stick up over the ridge.
 */
export function drawHouse(
  b: PixelBuffer, high: PixelBuffer | null, p: SurfacePalette,
  x0: number, y0: number, wt: number, ht: number, doorCol: number, seed: number, open = false,
): void {
  const W = wt * 16;
  const H = ht * 16;
  const wallH = 20;
  const wallY = y0 + H - wallH;
  const L = p.log;
  // ---- front wall: round logs, notched at the corners, on a stone footing
  for (let y = wallY; y < y0 + H; y++) {
    const r = y - wallY;
    for (let x = x0 + 2; x < x0 + W - 2; x++) {
      let col: Color;
      if (r >= wallH - 3) {
        const joint = r === wallH - 1 || (x + (r & 1) * 3) % 7 === 0;
        col = joint ? p.stone[0] : r === wallH - 3 ? p.stone[3] : p.stone[2];
      } else {
        const k = r % 4;
        col = k === 0 ? L[3] : k === 3 ? p.seam : L[2];
        if (k === 1 && hash2(x, y, seed) % 5 === 0) col = L[3];
        if (k === 2 && hash2(x, y, seed) % 4 === 0) col = L[1];
      }
      b.set(x, y, col);
    }
    // log ends at the corners
    if (r < wallH - 3) {
      const k = r % 4;
      for (const cx of [x0 + 1, x0 + W - 5]) {
        for (let i = 0; i < 4; i++) b.set(cx + i, y, k === 3 ? p.seam : i === 0 || i === 3 ? L[1] : k === 1 ? L[4] : L[3]);
      }
    }
  }
  for (let y = wallY; y < y0 + H; y++) { b.set(x0 + 1, y, L[0]); b.set(x0 + W - 2, y, L[0]); }
  // ---- windows and the door
  for (let t = 0; t < wt; t++) {
    const cx = x0 + t * 16 + 8;
    if (t === doorCol) {
      for (let y = wallY + 3; y < y0 + H - 1; y++)
        for (let x = cx - 5; x <= cx + 4; x++) {
          const edge = x === cx - 5 || x === cx + 4 || y === wallY + 3;
          const i = x - (cx - 4);
          // a door you can walk through stands open: the dark of the room, a little hearth light low down
          const inside = y > y0 + H - 7 ? mix(p.outline, p.window[1], 0.3) : p.outline;
          b.set(x, y, edge ? L[0] : open ? inside : i % 3 === 2 ? p.wood[1] : y === wallY + 4 ? p.wood[3] : p.wood[2]);
        }
      if (open) {
        // the door leaf, swung back against the wall
        for (let y = wallY + 4; y < y0 + H - 1; y++) { b.set(cx - 4, y, p.wood[3]); b.set(cx - 3, y, p.wood[1]); }
      } else {
        b.set(cx + 2, wallY + 11, p.stone[4]);
        b.set(cx + 2, wallY + 12, p.stone[1]);
      }
      for (let x = cx - 6; x <= cx + 5; x++) { b.set(x, y0 + H - 2, p.stone[3]); b.set(x, y0 + H - 1, p.stone[1]); }
    } else if (wt < 3 || (t > 0 && t < wt - 1) || wt === 3) {
      if (wt === 3 && t === 1 && doorCol < 0) continue;
      const wx = cx - 3;
      const wy = wallY + 5;
      for (let y = 0; y < 7; y++)
        for (let x = 0; x < 7; x++) {
          const edge = x === 0 || x === 6 || y === 0 || y === 6;
          const bar = x === 3 || y === 3;
          b.set(wx + x, wy + y, edge ? L[0] : bar ? L[1] : y < 3 ? p.window[0] : p.window[1]);
        }
      for (let x = -1; x < 8; x++) b.set(wx + x, wy + 7, L[4]);
    }
  }
  // ---- roof: courses of thatch, lit from the left
  const T = p.thatch;
  const roofH = H - wallH + 3;
  for (let ry = 0; ry < roofH; ry++) {
    const y = y0 + ry;
    const inset = Math.round((1 - ry / roofH) * 3);
    const xl = x0 - 1 + inset;
    const xr = x0 + W - inset;
    const course = (ry - 3) % 6;
    for (let x = xl; x <= xr; x++) {
      const hs = hash2(x, y, seed);
      let col: Color;
      // straw runs down the roof: strands are short vertical strokes, not specks
      const strand = hash2(x, Math.floor((ry - 3) / 6) + 9, seed) % 7;
      if (ry < 3) col = ry === 0 ? T[1] : ry === 1 ? T[4] : T[2];
      else if (course === 5) col = hs % 3 === 0 ? T[1] : p.seam;
      else if (course === 0) col = strand === 0 ? T[4] : T[3];
      else col = strand === 0 && course < 4 ? T[3] : strand === 1 && course > 1 ? T[1] : T[2];
      // the far end of the roof falls into shade
      if (x >= xr - 3 && ry >= 3 && col !== p.seam) col = course === 0 ? T[2] : T[1];
      if (x <= xl + 1 && ry >= 3 && col !== p.seam) col = T[3];
      if (x === xl || x === xr) col = T[0];
      if (ry === roofH - 1) col = hs % 3 === 0 ? T[1] : T[0];
      b.set(x, y, col);
    }
  }
  // the eave's shadow on the wall
  for (let x = x0 + 2; x < x0 + W - 2; x++)
    for (let y = y0 + roofH; y < y0 + roofH + 2; y++) b.set(x, y, mix(b.get(x, y), p.outline, p.glow ? 0.25 : 0.4));
  // crossed gable poles, carved like horse heads in a richer house
  const top = high ?? b;
  for (const gx of [x0 + 3, x0 + W - 4]) {
    for (let i = 0; i < 6; i++) {
      top.set(gx - 3 + i, y0 + 1 - i, L[3]);
      top.set(gx + 3 - i, y0 + 1 - i, L[2]);
      top.set(gx - 3 + i, y0 + 2 - i, L[1]);
      top.set(gx + 3 - i, y0 + 2 - i, L[0]);
    }
    if (p.glow) { top.set(gx + 2, y0 - 4, L[4]); top.set(gx - 2, y0 - 4, L[4]); }
  }
}

/** One tile of footbridge. `along`: true if you walk it left to right. */
export function drawPlanks(b: PixelBuffer, p: SurfacePalette, x0: number, y0: number, along: boolean, seed: number): void {
  const c = p.wood;
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++) {
      const u = along ? x : y; // across the boards
      const v = along ? y : x; // along a board
      const board = Math.floor(u / 4);
      const k = u % 4;
      const hs = hash2(board + (along ? x0 : y0), v, seed);
      let col: Color;
      if (v < 2 || v > 13) col = v === 1 || v === 14 ? c[1] : v === 0 ? c[3] : c[0]; // the beams that carry it
      else if (k === 3) col = p.seam;
      else col = k === 0 ? c[3] : hs % 9 === 0 ? c[1] : (board + hash2(board, 7, seed)) % 3 === 0 ? c[3] : c[2];
      if (p.glow && (v === 0 || v === 15)) col = c[4];
      b.set(x0 + x, y0 + y, col);
    }
}

/** Steps cut into the ground, leading down (towards the bottom of the screen). `depth` 0..1 darkens them. */
export function drawSteps(b: PixelBuffer, p: SurfacePalette, x0: number, y0: number, depth: number, depthEnd: number): void {
  const s = p.stone;
  for (let y = 0; y < 16; y++) {
    const k = y % 4;
    const d = depth + ((depthEnd - depth) * y) / 16;
    for (let x = 0; x < 16; x++) {
      let col: Color = k === 0 ? s[4] : k === 3 ? s[0] : (x + ((y >> 2) & 1) * 4) % 8 === 0 ? s[1] : k === 1 ? s[3] : s[2];
      if (x === 0 || x === 15) col = s[0];
      else if (x === 1) col = s[1];
      b.set(x0 + x, y0 + y, mix(col, p.outline, Math.min(0.92, d)));
    }
  }
}

/** A clump of reeds standing at (x, y). */
export function drawReeds(b: PixelBuffer, p: SurfacePalette, x: number, y: number, seed: number): void {
  const n = 2 + (seed % 3);
  for (let i = 0; i < n; i++) {
    const h = 5 + (hash2(i, seed, 1) % 5);
    const sx = x + i * 2 - n + 1;
    for (let k = 0; k < h; k++) b.set(sx, y - k, k < 2 ? p.tuft[0] : i & 1 ? p.tuft[0] : p.tuft[1]);
    if (hash2(i, seed, 2) % 2 === 0) {
      b.set(sx, y - h, p.glow ? p.flowers[1][0] : p.bark[1]);
      b.set(sx, y - h - 1, p.glow ? p.flowers[1][1] : p.bark[2]);
    } else b.set(sx + (i & 1 ? 1 : -1), y - h + 1, p.tuft[1]);
  }
}

export function drawLily(b: PixelBuffer, p: SurfacePalette, x: number, y: number, flower: boolean): void {
  const g = p.glow ? p.tuft : [p.leaf[2], p.leaf[3]];
  for (let i = -2; i <= 2; i++) { b.set(x + i, y, g[1]); if (Math.abs(i) < 2) { b.set(x + i, y - 1, g[1]); b.set(x + i, y + 1, g[0]); } }
  b.set(x + 1, y, p.water[1]);
  b.set(x - 2, y, g[0]);
  if (flower) { b.set(x - 1, y - 1, p.flowers[0][0]); b.set(x - 1, y - 2, p.flowers[0][0]); b.set(x, y - 1, p.flowers[0][1]); }
}

/** A flower: `kind` picks its colours, `big` gives it four petals. */
export function drawFlower(b: PixelBuffer, p: SurfacePalette, x: number, y: number, kind: number, big: boolean): void {
  const f = p.flowers[kind % p.flowers.length];
  b.set(x, y + 1, p.tuft[0]);
  if (big) {
    b.set(x, y - 1, f[0]); b.set(x - 1, y, f[0]); b.set(x + 1, y, f[0]);
    b.set(x, y, f[1]);
  } else {
    b.set(x, y, f[0]);
    b.set(x + 1, y, f[1]);
  }
}

// ------------------------------------------------------------------ the pool of trees

export interface Grove {
  oaks: Stamp[];
  spruces: Stamp[];
  birches: Stamp[];
  /** trees that stand on their own: fuller, a little bigger */
  lone: Stamp[];
  giant: Stamp;
  bushes: Stamp[];
  thickets: Stamp[];
  /** the blight's own thorns and the trees it has killed */
  thorns: Stamp[];
  dead: Stamp[];
  haystack: Stamp;
  beehive: Stamp;
  hollyhocks: Stamp[];
  boulders: Stamp[];
  stump: Stamp;
  well: Stamp;
}

const groves = new Map<string, Grove>();

/** Every tree is drawn once per palette and reused: rooms build fast and the forest looks like one forest. */
export function grove(p: SurfacePalette, key: string): Grove {
  const made = groves.get(key);
  if (made) return made;
  const g: Grove = {
    oaks: [0, 1, 2, 3, 4, 5].map((i) => oak(p, 100 + i * 17, 9.6 + (i % 3) * 0.7)),
    spruces: [0, 1, 2, 3].map((i) => spruce(p, 300 + i * 13, 30 + (i % 3) * 2)),
    birches: [0, 1, 2].map((i) => birch(p, 500 + i * 11)),
    lone: [0, 1, 2].map((i) => oak(p, 700 + i * 23, 11.5 + i * 0.6)),
    giant: oak(p, 911, 16),
    bushes: [0, 1, 2].map((i) => bush(p, 40 + i * 7)),
    thickets: [0, 1, 2, 3].map((i) => thicket(p, 60 + i * 9)),
    thorns: [0, 1, 2, 3].map((i) => thicket(p, 160 + i * 9, p.blightWood, p.blightSpark)),
    dead: [0, 1, 2].map((i) => deadTree(p, 21 + i * 7)),
    haystack: haystack(p),
    beehive: beehive(p),
    hollyhocks: [0, 1, 2].map((i) => hollyhocks(p, 5 + i)),
    boulders: [0, 1, 2, 3].map((i) => boulder(p, 80 + i * 5, 13 + (i % 2) * 2, 11 + (i >> 1) * 3)),
    stump: stump(p),
    well: well(p),
  };
  groves.set(key, g);
  return g;
}
