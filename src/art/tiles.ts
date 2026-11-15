// Procedural tileset, second pass. One set of drawing functions, two worlds.
//
// The two worlds do not just swap colours: Jawia has light surfaces and dark joints,
// Nawia has dark surfaces and joints that glow. Some slots hold different things per world
// (a mossy wall in Jawia is a wall with a glowing rune in Nawia).
//
// The layout below is the contract for real art: export it (`npm run art:export`),
// paint over `tiles_jawia.png` / `tiles_nawia.png`, drop them into /assets and the game uses them.

import { TILE, otherWorld, type World } from '../config.ts';
import { PixelBuffer, mix, rgb, withAlpha, type Color } from '../core/PixelBuffer.ts';
import { mulberry32, type Rng } from '../core/rng.ts';
import { INK, PAL, type WorldPalette } from './palette.ts';

export const TILESET_COLS = 8;

/** Fixed grid, 8 tiles per row. Never reorder: PNG replacements depend on it. */
export const TILE_NAMES = [
  // row 0: floor. Slabs are 2 tiles wide; `joint_r` / `hl_l` close their ends (overlays)
  'floor_a0', 'floor_a1', 'floor_b0', 'floor_b1', 'floor_orn', 'joint_r', 'hl_l', 'floor_chip',
  // row 1: what lies beyond the walls (4 variants in Jawia, 4 animation frames in Nawia) + rims (overlays)
  'top0', 'top1', 'top2', 'top3', 'rim_n', 'rim_w', 'rim_e', 'rim_w_low',
  // row 2: more rim pieces (overlays)
  'rim_e_low', 'corner_nw', 'corner_ne', 'corner_out_nw', 'corner_out_ne', 'face_end_w', 'face_end_e', 'face_cap_n',
  // row 3: wall faces. v1/v2/v3 = moss, breach, niche in Jawia; rune, window, candle in Nawia
  'face0', 'face1', 'face2', 'face_v1', 'face_v2', 'face_v3', 'face_ao_w', 'face_ao_e',
  // row 4: contact shadows + floor decor (overlays)
  'shadow_n', 'shadow_w', 'shadow_e', 'shadow_s', 'decor0', 'decor1', 'decor2', 'decor3',
  // row 5: water / abyss animation + shores (overlays)
  'water0', 'water1', 'water2', 'water3', 'shore_n', 'shore_w', 'shore_e', 'shore_s',
  // row 6: bridges + things floating on the water (overlays)
  'deck_h', 'deck_v', 'rail_n', 'rail_s', 'rail_w', 'rail_e', 'lily0', 'lily1',
  // row 7: rubble, debris, more decor, corner webs (overlays)
  'rubble0', 'rubble1', 'debris0', 'debris1', 'decor4', 'decor5', 'cobweb_nw', 'cobweb_ne',
  // row 8: cracks in the border, echoes of the other world (overlays)
  'rift0', 'rift1', 'echo_solid', 'echo_bridge', 'spare0', 'spare1', 'spare2', 'spare3',
] as const;

export type TileName = (typeof TILE_NAMES)[number];

export const TILE_INDEX = Object.fromEntries(TILE_NAMES.map((n, i) => [n, i])) as Record<TileName, number>;
export const TILESET_ROWS = Math.ceil(TILE_NAMES.length / TILESET_COLS);

const S = TILE;
const black = (a: number): Color => rgb(0x000000, a);
const white = (a: number): Color => rgb(0xffffff, a);
const tile = (): PixelBuffer => new PixelBuffer(S, S);
const pick = <T>(rng: Rng, items: readonly T[]): T => items[Math.floor(rng() * items.length)];

// ---------------------------------------------------------------- floor

function floorTile(p: WorldPalette, world: World, tone: number, rng: Rng): PixelBuffer {
  const b = tile();
  if (world === 'jawia') {
    // two close tones: slabs differ, but the floor still reads as one surface
    const base = tone === 0 ? p.floor[2] : mix(p.floor[2], p.floor[3], 0.6);
    const hi = mix(base, p.floor[4], 0.4);
    const lo = mix(base, p.floor[1], 0.55);
    b.fill(base);
    for (let x = 0; x < S; x++) {
      b.set(x, 0, hi);
      b.set(x, 14, lo);
      b.set(x, 15, p.floor[0]);
    }
    // wear: a few small marks, never a pattern you can recognise twice
    for (let n = 0; n < 3; n++) {
      const x = 2 + Math.floor(rng() * 11);
      const y = 3 + Math.floor(rng() * 9);
      const c = rng() < 0.5 ? hi : lo;
      b.set(x, y, c);
      if (rng() < 0.6) b.set(x + 1, y, c);
      if (rng() < 0.3) b.set(x + 1, y + 1, lo);
    }
  } else {
    const base = tone === 0 ? p.floor[1] : mix(p.floor[1], p.floor[2], 0.6);
    b.fill(base);
    for (let x = 0; x < S; x++) {
      b.set(x, 14, p.floor[0]);
      b.set(x, 15, (x * 5 + tone * 3) % 13 === 0 ? p.growth[1] : p.growth[0]);
    }
    for (let n = 0; n < 2; n++) b.set(2 + Math.floor(rng() * 12), 2 + Math.floor(rng() * 10), p.floor[3]);
  }
  return b;
}

/** Ornamental paving: a designer's tool for paths and daises (',' in room files). */
function ornamentTile(p: WorldPalette, world: World): PixelBuffer {
  const b = tile();
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      const u = (x + y) % 8;
      const v = (x - y + 16) % 8;
      if (world === 'jawia') {
        const dark = u < 4 !== v < 4;
        let c = dark ? p.stone[2] : p.stone[4];
        if (u === 0 || v === 0) c = p.stone[1];
        if ((x * 13 + y * 7) % 23 === 0) c = p.stone[3];
        b.set(x, y, c);
      } else {
        let c = p.floor[1];
        if (u === 0 || v === 0) c = p.growth[1];
        if (u === 0 && v === 0) c = p.growth[3];
        if (u === 4 && v === 4) c = p.growth[0];
        b.set(x, y, c);
      }
    }
  if (world === 'jawia') for (let i = 0; i < S; i++) { b.plot(i, 15, black(110)); b.plot(15, i, black(60)); b.plot(i, 0, white(22)); }
  return b;
}

function floorOverlay(p: WorldPalette, world: World, kind: 'joint_r' | 'hl_l' | 'chip'): PixelBuffer {
  const b = tile();
  if (kind === 'joint_r') {
    for (let y = 0; y < S; y++) {
      if (world === 'jawia') { b.set(15, y, p.floor[0]); if (y < 15) b.plot(14, y, black(34)); }
      else b.set(15, y, y % 7 === 3 ? p.growth[1] : p.growth[0]);
    }
  } else if (kind === 'hl_l') {
    if (world === 'jawia') for (let y = 0; y < 15; y++) b.plot(0, y, white(24));
  } else if (world === 'jawia') {
    // a corner knocked off the slab
    for (let y = 0; y < 5; y++) for (let x = 0; x < 5 - y; x++) b.set(15 - x, y, x + y > 2 ? p.floor[1] : p.floor[0]);
    b.set(9, 5, p.rock[3]); b.set(10, 5, p.rock[2]); b.set(8, 7, p.rock[2]);
  } else {
    // a mote of light resting in the seam
    b.set(11, 15, p.growth[3]); b.set(10, 15, p.growth[2]); b.set(12, 15, p.growth[2]); b.plot(11, 14, withAlpha(p.growth[2], 150));
  }
  return b;
}

// ---------------------------------------------------------------- beyond the walls

function topTile(p: WorldPalette, world: World, v: number, rng: Rng): PixelBuffer {
  const b = tile().fill(p.top[0]);
  if (world === 'jawia') {
    // packed earth: quiet, so the rooms carry the picture
    for (let n = 0; n < 4; n++) {
      const x = 1 + Math.floor(rng() * 11);
      const y = 1 + Math.floor(rng() * 13);
      b.set(x, y, p.top[1]); b.set(x + 1, y, p.top[1]); b.set(x + 2, y, p.top[1]); b.set(x + 3, y, p.top[1]);
      b.set(x + 1, y + 1, p.top[1]); b.set(x + 2, y + 1, p.top[1]);
    }
    if (v % 2 === 0) {
      const x = 3 + Math.floor(rng() * 9);
      const y = 3 + Math.floor(rng() * 9);
      b.set(x, y, p.top[2]); b.set(x + 1, y, p.top[2]); b.set(x, y + 1, p.top[1]);
    }
  } else {
    // the void: a couple of stars taking turns to twinkle (v is the animation frame)
    const stars = [[4, 3, 0], [12, 10, 2]];
    for (const [sx, sy, ph] of stars) {
      const k = (v + ph) & 3;
      if (k === 0) {
        b.set(sx, sy, p.water[5]);
        if (ph === 0) { b.set(sx - 1, sy, p.top[3]); b.set(sx + 1, sy, p.top[3]); b.set(sx, sy - 1, p.top[3]); b.set(sx, sy + 1, p.top[3]); }
      } else if (k === 2) b.set(sx, sy, p.top[3]);
      else b.set(sx, sy, p.water[4]);
    }
    b.set(9, 14, p.top[2]); b.set(1, 8, p.top[2]);
  }
  return b;
}

type RimKind = 'n' | 'w' | 'e' | 'w_low' | 'e_low' | 'nw' | 'ne' | 'out_nw' | 'out_ne' | 'cap_n';

function rimTile(p: WorldPalette, kind: RimKind): PixelBuffer {
  const b = tile();
  const [inner, mid, outer] = p.rim;
  const mirror = kind === 'e' || kind === 'e_low' || kind === 'ne' || kind === 'out_ne';
  const set = (x: number, y: number, c: Color): void => b.set(mirror ? 15 - x : x, y, c);
  switch (kind) {
    case 'n':
      for (let x = 0; x < S; x++) { b.set(x, 0, outer); b.set(x, 1, mid); b.set(x, 2, inner); }
      break;
    case 'cap_n':
      for (let x = 0; x < S; x++) { b.set(x, 0, outer); b.set(x, 1, inner); }
      break;
    case 'w':
    case 'e':
      for (let y = 0; y < S; y++) { set(0, y, outer); set(1, y, mid); set(2, y, inner); }
      break;
    case 'w_low':
    case 'e_low':
      // meets the lip of a wall face on that side: the three lines turn the corner
      for (let y = 0; y < S; y++) { set(0, y, y >= 2 ? outer : y === 1 ? mid : inner); set(1, y, y >= 1 ? mid : inner); set(2, y, inner); }
      break;
    case 'nw':
    case 'ne':
      set(0, 0, outer); set(1, 0, mid); set(0, 1, mid); set(1, 1, mid);
      set(2, 0, inner); set(2, 1, inner); set(2, 2, inner); set(0, 2, inner); set(1, 2, inner);
      break;
    case 'out_nw':
    case 'out_ne':
      set(0, 0, outer); set(1, 0, outer); set(2, 0, outer); set(0, 1, outer); set(0, 2, outer);
      set(1, 1, mid); set(2, 1, mid); set(1, 2, mid); set(2, 2, inner);
      break;
  }
  return b;
}

// ---------------------------------------------------------------- wall faces

const RUNES: string[][] = [
  ['#.#', '#.#', '.#.', '.#.', '#.#'],
  ['.#.', '###', '.#.', '.#.', '.#.'],
  ['#..', '##.', '#.#', '##.', '#..'],
  ['.#.', '#.#', '.#.', '#.#', '#.#'],
  ['###', '.#.', '###', '.#.', '.#.'],
];

function faceTile(p: WorldPalette, world: World, v: number, rng: Rng): PixelBuffer {
  const b = tile();
  const jawia = world === 'jawia';
  // the lip of the wall top
  for (let x = 0; x < S; x++) { b.set(x, 0, p.rim[0]); b.set(x, 1, p.rim[1]); b.set(x, 2, p.rim[2]); }

  // two courses of big blocks
  for (let c = 0; c < 2; c++) {
    const y0 = 3 + c * 5;
    const off = c === 0 ? 0 : 4;
    let idx = 3;
    for (let x = 0; x < S; x++) {
      const k = (x + off) % 8;
      if (k === 0 || x === 0) idx = jawia ? pick(rng, [2, 3, 3, 3]) : pick(rng, [1, 2, 2]);
      const joint = k === 7;
      if (jawia) {
        const mortar = p.stone[0];
        b.set(x, y0, joint ? mortar : p.stone[idx + 1]);
        b.set(x, y0 + 1, joint ? mortar : k === 0 ? p.stone[idx + 1] : p.stone[idx]);
        b.set(x, y0 + 2, joint ? mortar : p.stone[idx]);
        b.set(x, y0 + 3, joint ? mortar : p.stone[idx - 1]);
        b.set(x, y0 + 4, mortar);
      } else {
        // dark blocks; the mortar is where the light lives
        const glow = (x * 3 + c * 5) % 11 === 0 ? p.growth[1] : p.growth[0];
        b.set(x, y0, joint ? glow : p.stone[idx + 1]);
        b.set(x, y0 + 1, joint ? glow : p.stone[idx]);
        b.set(x, y0 + 2, joint ? glow : p.stone[idx]);
        b.set(x, y0 + 3, joint ? glow : p.stone[idx]);
        b.set(x, y0 + 4, glow);
      }
    }
  }
  // plinth
  for (let x = 0; x < S; x++) {
    b.set(x, 13, p.stone[3]);
    b.set(x, 14, jawia ? p.stone[2] : p.stone[1]);
    b.set(x, 15, p.stone[0]);
  }
  if (jawia) { b.set(5, 14, p.stone[1]); b.set(12, 14, p.stone[1]); }
  // the lip throws a little shadow
  for (let x = 0; x < S; x++) b.plot(x, 3, black(jawia ? 60 : 40));

  if (v === 1) {
    if (jawia) {
      // moss hanging from the lip
      for (let x = 0; x < S; x++) {
        if (rng() < 0.3) continue;
        const len = 1 + Math.floor(rng() * rng() * 8);
        b.set(x, 1, p.growth[2]); b.set(x, 2, p.growth[3]);
        for (let j = 0; j < len; j++) b.set(x, 3 + j, j === len - 1 ? p.growth[3] : rng() < 0.5 ? p.growth[2] : p.growth[1]);
      }
    } else {
      // a rune that still remembers how to glow
      const r = pick(rng, RUNES);
      const ox = 6 + Math.floor(rng() * 3);
      for (let j = -1; j <= r.length; j++)
        for (let i = -1; i <= 3; i++) {
          if (r[j]?.[i] === '#') b.set(ox + i, 5 + j, p.growth[3]);
          else b.plot(ox + i, 5 + j, withAlpha(p.growth[1], 90));
        }
    }
  } else if (v === 2) {
    if (jawia) {
      // a breach: one block gone, a crack running up from it
      for (let y = 8; y < 12; y++) for (let x = 5; x < 11; x++) b.set(x, y, y === 8 ? p.stone[0] : p.stone[1]);
      b.set(5, 8, p.stone[2]); b.set(10, 11, p.stone[0]); b.set(7, 10, p.rock[2]); b.set(8, 11, p.rock[3]);
      let x = 8;
      for (let y = 7; y > 2; y--) { b.set(x, y, p.stone[0]); if (rng() < 0.5) x += rng() < 0.5 ? 1 : -1; }
    } else {
      // a window with the lamp still lit inside
      for (let y = 4; y < 12; y++)
        for (let x = 5; x < 11; x++) {
          if (y === 4 && (x === 5 || x === 10)) continue;
          const frame = x === 5 || x === 10 || y === 4 || y === 11;
          b.set(x, y, frame ? p.stone[5] : y < 7 ? p.growth[4] : y < 9 ? p.growth[3] : p.growth[2]);
        }
      for (let y = 5; y < 11; y++) b.set(7, y, p.stone[2]);
      for (let x = 6; x < 10; x++) b.set(x, 8, p.stone[2]);
      for (let x = 4; x < 12; x++) b.plot(x, 12, withAlpha(p.growth[2], 120));
    }
  } else if (v === 3) {
    // a niche: a skull for the living, a cold candle for the dead
    for (let y = 4; y < 12; y++)
      for (let x = 5; x < 11; x++) {
        if (y === 4 && (x === 5 || x === 10)) continue;
        b.set(x, y, y === 11 ? p.stone[1] : p.stone[0]);
      }
    for (let x = 5; x < 11; x++) b.set(x, 12, jawia ? p.stone[4] : p.stone[5]);
    if (jawia) {
      const sk = ['.##.', '####', '#.#.', '.##.'];
      sk.forEach((row, j) => { for (let i = 0; i < 4; i++) if (row[i] === '#') b.set(6 + i, 7 + j, j === 2 ? INK.boneMid : INK.bone); });
      b.set(7, 9, INK.outline); b.set(9, 9, INK.outline);
    } else {
      b.set(7, 10, p.rock[4]); b.set(8, 10, p.rock[4]); b.set(7, 11, p.rock[3]); b.set(8, 11, p.rock[3]);
      b.set(7, 9, p.fire[1]); b.set(8, 9, p.fire[0]); b.set(8, 8, p.fire[1]); b.set(7, 8, p.fire[2]); b.set(8, 7, p.fire[2]);
      for (let y = 5; y < 12; y++) for (let x = 5; x < 11; x++) b.plot(x, y, withAlpha(p.fire[2], 46));
    }
  }
  return b;
}

function faceOverlay(p: WorldPalette, kind: 'end_w' | 'end_e' | 'ao_w' | 'ao_e'): PixelBuffer {
  const b = tile();
  const w = kind.endsWith('w');
  const X = (x: number): number => (w ? x : 15 - x);
  if (kind.startsWith('end')) {
    b.set(X(0), 0, p.rim[2]); b.set(X(0), 1, p.rim[2]); b.set(X(0), 2, p.rim[2]);
    b.set(X(1), 0, p.rim[1]); b.set(X(1), 1, p.rim[1]);
    for (let y = 3; y < S; y++) b.set(X(0), y, p.stone[0]);
    for (let y = 3; y < 15; y++) b.plot(X(1), y, black(70));
  } else {
    for (let y = 3; y < S; y++) { b.plot(X(0), y, black(130)); b.plot(X(1), y, black(80)); b.plot(X(2), y, black(36)); }
  }
  return b;
}

function shadowTile(kind: 'n' | 'w' | 'e' | 's', strength: number): PixelBuffer {
  const b = tile();
  const a = (v: number): Color => black(Math.round(v * strength));
  for (let i = 0; i < S; i++) {
    if (kind === 'n') {
      b.set(i, 0, a(150)); b.set(i, 1, a(120)); b.set(i, 2, a(88)); b.set(i, 3, a(58));
      b.set(i, 4, a(i % 2 === 0 ? 58 : 26)); b.set(i, 5, a(i % 2 === 1 ? 26 : 0));
    } else if (kind === 's') {
      b.set(i, 15, a(80)); b.set(i, 14, a(36));
    } else if (kind === 'w') {
      b.set(0, i, a(96)); b.set(1, i, a(56)); b.set(2, i, a(24));
    } else {
      b.set(15, i, a(96)); b.set(14, i, a(56)); b.set(13, i, a(24));
    }
  }
  return b;
}

// ---------------------------------------------------------------- water / abyss

function waterTile(p: WorldPalette, f: number, world: World): PixelBuffer {
  const TAU = Math.PI * 2;
  const t = f / 4;
  const b = tile().fill(world === 'jawia' ? p.water[1] : p.water[0]);
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      const u = (x + 0.5) / S;
      const v = (y + 0.5) / S;
      if (world === 'jawia') {
        // slow horizontal swells: dark troughs, pale crests
        const a = Math.sin(TAU * 2 * v + 1.4 * Math.sin(TAU * (u + t)));
        const c = Math.sin(TAU * (u - t) + TAU * v + 0.7);
        const w = a * 0.72 + c * 0.28;
        if (w > 0.94) b.set(x, y, p.water[3]);
        else if (w > 0.66) b.set(x, y, p.water[2]);
        else if (w < -0.78) b.set(x, y, p.water[0]);
      } else {
        const a = Math.sin(TAU * (u - t) + 2.2 * Math.sin(TAU * v + 1));
        const c = Math.sin(TAU * v + TAU * u * 2 + TAU * t);
        const w = a * 0.6 + c * 0.4;
        if (w > 0.86) b.set(x, y, p.water[3]);
        else if (w > 0.6) b.set(x, y, p.water[2]);
        else if (w > 0.2) b.set(x, y, p.water[1]);
      }
    }
  if (world === 'jawia') {
    const sp = [[3, 4], [11, 9], [7, 13], [14, 2]];
    const [sx, sy] = sp[f % sp.length];
    b.set(sx, sy, p.water[4]); b.set(sx + 1, sy, p.water[3]); b.set(sx - 1, sy, p.water[3]);
  } else {
    const stars = [[2, 3], [13, 6], [6, 10], [10, 14]];
    stars.forEach(([sx, sy], i) => {
      const ph = (f + i) % 4;
      if (ph === 0) b.set(sx, sy, p.water[5]);
      else if (ph !== 2) b.set(sx, sy, p.water[4]);
    });
  }
  return b;
}

function shoreTile(p: WorldPalette, world: World, kind: 'n' | 'w' | 'e' | 's'): PixelBuffer {
  const b = tile();
  const jawia = world === 'jawia';
  for (let i = 0; i < S; i++) {
    if (kind === 'n') {
      if (jawia) {
        b.set(i, 0, p.floor[1]); b.set(i, 1, p.floor[0]); b.set(i, 2, p.water[0]); b.plot(i, 3, black(96));
        if (i % 5 < 3) b.set(i, 4, p.water[4]);
        if (i % 7 === 2) b.set(i, 1, p.growth[2]);
      } else {
        b.set(i, 0, p.growth[2]); b.set(i, 1, p.growth[0]); b.plot(i, 2, withAlpha(p.growth[0], 120));
      }
    } else if (kind === 's') {
      b.set(i, 15, jawia ? p.floor[1] : p.growth[1]);
      if (jawia && i % 6 < 2) b.set(i, 14, p.water[3]);
    } else {
      const x = kind === 'w' ? 0 : 15;
      const x2 = kind === 'w' ? 1 : 14;
      b.set(x, i, jawia ? p.floor[1] : p.growth[1]);
      if (jawia && i % 5 < 2) b.set(x2, i, p.water[4]);
    }
  }
  return b;
}

/** Things that float: duckweed and lily pads in Jawia, drifting soul-lights in Nawia. */
function lilyTile(p: WorldPalette, world: World, v: number): PixelBuffer {
  const b = tile();
  if (world === 'jawia') {
    const pad = (cx: number, cy: number, r: number): void => {
      for (let y = -r; y <= r; y++)
        for (let x = -r; x <= r; x++) {
          if (x * x + y * y > r * r + 1) continue;
          if (x > 0 && y === 0) continue; // the notch
          b.set(cx + x, cy + y, x + y < 0 ? p.growth[3] : p.growth[2]);
        }
      b.plot(cx - r, cy + r + 1, black(60)); b.plot(cx, cy + r + 1, black(60));
    };
    if (v === 0) { pad(5, 6, 2); pad(11, 11, 1); b.set(12, 4, p.growth[2]); b.set(3, 12, p.growth[1]); }
    else { pad(9, 5, 1); pad(4, 11, 2); b.set(11, 10, INK.white); b.set(10, 10, p.growth[4]); b.set(12, 10, p.growth[4]); b.set(11, 9, p.growth[4]); b.set(11, 11, p.growth[4]); }
  } else {
    const dot = (x: number, y: number): void => {
      b.set(x, y, INK.soul[4]);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) b.plot(x + dx, y + dy, withAlpha(INK.soul[2], 150));
    };
    if (v === 0) { dot(5, 6); dot(12, 11); } else { dot(9, 4); dot(4, 12); }
  }
  return b;
}

// ---------------------------------------------------------------- bridges

function deckTile(p: WorldPalette, world: World, horizontal: boolean, rng: Rng): PixelBuffer {
  const b = tile();
  const jawia = world === 'jawia';
  for (let k = 0; k < 4; k++) {
    const idx = jawia ? pick(rng, [2, 3, 3, 4]) : pick(rng, [2, 3, 3]);
    const short = jawia && rng() < 0.3 ? 1 + Math.floor(rng() * 2) : 0; // rotten planks end early
    for (let a = 0; a < 4; a++)
      for (let l = 0; l < S; l++) {
        const across = k * 4 + a;
        let c: Color;
        if (a === 3) c = jawia ? p.wood[0] : p.wood[1];
        else if (a === 0) c = p.wood[idx + 1];
        else c = p.wood[idx];
        if (jawia && a === 1 && (l === 2 || l === 13)) c = p.wood[1]; // nails
        if (jawia && a < 3 && (l < short || l > 15 - short)) c = p.wood[0];
        if (!jawia && (l === 0 || l === 15)) c = p.wood[4];
        if (horizontal) b.set(across, l, c);
        else b.set(l, across, c);
      }
  }
  return b;
}

function railTile(p: WorldPalette, world: World, kind: 'n' | 's' | 'w' | 'e'): PixelBuffer {
  const b = tile();
  const jawia = world === 'jawia';
  const edge = jawia ? p.wood[0] : p.wood[1];
  const top = jawia ? p.wood[4] : p.wood[5];
  const mid = jawia ? p.wood[2] : p.wood[3];
  for (let i = 0; i < S; i++) {
    const post = i === 1 || i === 8 || i === 14;
    if (kind === 'n') {
      b.set(i, 0, edge); b.set(i, 1, top); b.set(i, 2, mid); b.plot(i, 3, black(70));
      if (post) { b.set(i, 1, edge); b.set(i, 2, edge); b.set(i, 3, edge); }
    } else if (kind === 's') {
      b.set(i, 12, edge); b.set(i, 13, top); b.set(i, 14, mid); b.set(i, 15, edge);
      if (post) { b.set(i, 13, edge); b.set(i, 11, edge); }
    } else {
      const X = (x: number): number => (kind === 'w' ? x : 15 - x);
      b.set(X(0), i, edge); b.set(X(1), i, top); b.set(X(2), i, mid); b.plot(X(3), i, black(70));
      if (post) { b.set(X(1), i, edge); b.set(X(2), i, edge); }
    }
  }
  return b;
}

// ---------------------------------------------------------------- rocks

function rock(b: PixelBuffer, p: WorldPalette, cx: number, cy: number, rx: number, ry: number): void {
  const t = new PixelBuffer(b.w, b.h);
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const nx = (x + 0.5 - cx) / rx;
      const ny = (y + 0.5 - cy) / ry;
      // squarish, like broken masonry rather than river pebbles
      if (Math.pow(Math.abs(nx), 2.6) + Math.pow(Math.abs(ny), 2.6) > 1) continue;
      const s = -(nx * 0.5 + ny * 0.9);
      t.set(x, y, s > 0.62 ? p.rock[5] : s > 0.3 ? p.rock[4] : s > -0.25 ? p.rock[3] : s > -0.7 ? p.rock[2] : p.rock[1]);
    }
  b.blit(t.outlined(p.rock[0]), 0, 0);
}

function rubbleTile(p: WorldPalette, v: number): PixelBuffer {
  const b = tile();
  for (let x = 0; x < 16; x++) { b.set(x, 15, black(110)); if (x % 2) b.set(x, 14, black(60)); }
  // a broken beam under the stones
  const beam = v === 0 ? [[1, 12], [4, 10], [7, 8], [10, 6]] : [[14, 12], [11, 10], [8, 9], [5, 7]];
  for (const [x, y] of beam) { b.set(x, y, p.wood[3]); b.set(x + 1, y, p.wood[2]); b.set(x, y + 1, p.wood[1]); b.set(x + 1, y + 1, p.wood[1]); b.set(x + 2, y + 1, p.wood[0]); }
  const piles = v === 0
    ? [[4.5, 4.5, 4.4, 3.6], [11.6, 4.6, 4, 3.6], [2.6, 10.6, 2.6, 2.8], [13.2, 10.6, 2.8, 3.2], [8, 10.4, 5, 4.2]]
    : [[10.6, 4, 4.8, 3.3], [3.8, 5.4, 3.6, 4], [12.8, 10.2, 3.1, 3.7], [6.4, 10.8, 5.6, 4], [1.6, 12.2, 1.6, 2]];
  for (const [cx, cy, rx, ry] of piles) rock(b, p, cx, cy, rx, ry);
  // moss creeping over
  for (const [x, y] of v === 0 ? [[3, 2], [4, 2], [10, 2], [7, 7]] : [[9, 1], [10, 1], [3, 3], [12, 7]]) b.set(x, y, p.growth[2]);
  return b;
}

function debrisTile(p: WorldPalette, v: number, rng: Rng): PixelBuffer {
  const b = tile();
  // the stump of a wall: a broken line of foundation stones, and what fell off it
  const stones = v === 0 ? [[3, 7, 2.6, 2.2], [8.5, 8, 2.8, 2.4], [13, 6.6, 2.2, 2]] : [[4, 8.4, 2.8, 2.3], [10, 7, 2.4, 2.2], [13.4, 9.4, 1.8, 1.6]];
  for (const [cx, cy, rx, ry] of stones) {
    for (let x = Math.round(cx - rx); x <= cx + rx; x++) b.plot(x, Math.round(cy + ry + 1), black(80));
    rock(b, p, cx, cy, rx, ry);
  }
  for (let i = 0; i < 4; i++) {
    const x = 1 + Math.floor(rng() * 13);
    const y = 11 + Math.floor(rng() * 4);
    b.set(x, y, p.rock[3]); b.set(x + 1, y, p.rock[2]);
  }
  return b;
}

// ---------------------------------------------------------------- decor

function decorTile(p: WorldPalette, v: number, rng: Rng, world: World): PixelBuffer {
  const b = tile();
  const jawia = world === 'jawia';
  switch (v) {
    case 0: // pebbles / motes of light
      for (let i = 0; i < 3; i++) {
        const x = 3 + Math.floor(rng() * 10);
        const y = 3 + Math.floor(rng() * 9);
        if (jawia) {
          b.set(x, y, p.rock[4]); b.set(x + 1, y, p.rock[3]); b.set(x, y + 1, p.rock[2]); b.set(x + 1, y + 1, p.rock[2]);
          b.plot(x, y + 2, black(70)); b.plot(x + 1, y + 2, black(70));
        } else {
          b.set(x, y, p.growth[3]); b.plot(x + 1, y, withAlpha(p.growth[1], 130)); b.plot(x - 1, y, withAlpha(p.growth[1], 130));
        }
      }
      break;
    case 1: { // a crack / a seam of light
      let y = 5 + Math.floor(rng() * 5);
      for (let x = 2; x < 14; x++) {
        b.set(x, y, jawia ? p.floor[0] : p.growth[1]);
        if (!jawia && x % 4 === 1) b.set(x, y, p.growth[3]);
        if (rng() < 0.4) y += rng() < 0.5 ? 1 : -1;
        if (jawia && rng() < 0.3) b.set(x, y + 1, p.floor[1]);
      }
      break;
    }
    case 2: { // moss tuft / spirit grass
      const cx = 5 + Math.floor(rng() * 6);
      const cy = 8 + Math.floor(rng() * 4);
      for (let i = 0; i < 12; i++) {
        const x = cx + Math.round((rng() - 0.5) * 6);
        const y = cy + Math.round((rng() - 0.5) * 3);
        b.set(x, y, rng() < 0.25 ? p.growth[3] : rng() < 0.6 ? p.growth[2] : p.growth[1]);
      }
      for (const dx of [-2, 0, 2]) { b.set(cx + dx, cy - 2, p.growth[jawia ? 2 : 3]); b.set(cx + dx, cy - 3, p.growth[jawia ? 3 : 4]); }
      if (!jawia) b.set(cx, cy - 4, INK.white);
      break;
    }
    case 3: { // old bones / a ring of pale mushrooms
      if (jawia) {
        const pts = [[5, 9], [6, 8], [7, 8], [8, 7], [10, 10], [11, 10], [12, 9]];
        for (const [x, y] of pts) { b.set(x, y, INK.bone); b.plot(x, y + 1, black(70)); }
        b.set(4, 9, INK.boneMid); b.set(9, 7, INK.boneMid); b.set(13, 9, INK.boneMid);
      } else {
        for (let i = 0; i < 7; i++) {
          const a = (i / 7) * Math.PI * 2;
          const x = Math.round(8 + Math.cos(a) * 4);
          const y = Math.round(9 + Math.sin(a) * 2.5);
          b.set(x, y, INK.soul[3]); b.set(x, y - 1, INK.soul[4]); b.plot(x, y + 1, withAlpha(INK.soul[1], 150));
        }
      }
      break;
    }
    case 4: // puddle / pool of light
      for (let y = 0; y < S; y++)
        for (let x = 0; x < S; x++) {
          const nx = (x - 7.5) / 5;
          const ny = (y - 9) / 2.6;
          const d = nx * nx + ny * ny;
          if (d < 1) b.set(x, y, d < 0.35 ? p.water[jawia ? 2 : 3] : p.water[jawia ? 1 : 2]);
          else if (d < 1.4) b.plot(x, y, withAlpha(jawia ? p.floor[0] : p.growth[0], 210));
        }
      b.set(6, 8, p.water[jawia ? 4 : 5]); b.set(7, 8, p.water[jawia ? 3 : 4]);
      break;
    default: { // dead roots / a faint sigil
      if (jawia) {
        let x = 2;
        let y = 12;
        for (let i = 0; i < 11; i++) { b.set(x, y, p.wood[2]); b.plot(x, y + 1, black(60)); x++; if (rng() < 0.55) y--; }
        b.set(6, 6, p.wood[3]); b.set(7, 6, p.wood[4]); b.set(11, 12, p.wood[3]); b.set(12, 12, p.wood[4]); b.set(4, 4, p.growth[2]);
      } else {
        const sig = ['..#..', '.#.#.', '#.#.#', '.#.#.', '..#..'];
        sig.forEach((row, j) => { for (let i = 0; i < 5; i++) if (row[i] === '#') b.plot(5 + i, 6 + j, withAlpha(p.growth[2], 170)); });
        b.set(7, 8, p.growth[4]);
      }
    }
  }
  return b;
}

/** Corner dressing: cobwebs for the living, a knot of light for the dead. */
function cobwebTile(p: WorldPalette, world: World, east: boolean): PixelBuffer {
  const b = tile();
  const X = (x: number): number => (east ? 15 - x : x);
  if (world === 'jawia') {
    const web = rgb(0xb8b4c4, 150);
    const dim = rgb(0xb8b4c4, 80);
    for (let i = 0; i < 9; i++) { b.set(X(i), 8 - i, web); b.set(X(i), 0, dim); b.set(X(0), i, dim); }
    for (let i = 0; i < 6; i++) b.set(X(i), 5 - i, dim);
    for (let i = 0; i < 4; i++) b.set(X(i), 3 - i, web);
    b.set(X(3), 3, web); b.set(X(5), 2, dim); b.set(X(2), 5, dim);
  } else {
    for (let i = 0; i < 7; i++) { b.plot(X(i), 0, withAlpha(p.growth[2], 200 - i * 26)); b.plot(X(0), i, withAlpha(p.growth[2], 200 - i * 26)); }
    b.set(X(0), 0, p.growth[4]); b.set(X(1), 1, p.growth[3]); b.plot(X(2), 2, withAlpha(p.growth[2], 160));
  }
  return b;
}

/** A crack in the border: the other world's light leaking through the floor. */
function riftTile(world: World, v: number, rng: Rng): PixelBuffer {
  const b = tile();
  const o = PAL[otherWorld(world)];
  let x = v === 0 ? 3 : 12;
  let y = 3;
  const dx = v === 0 ? 1 : -1;
  for (let i = 0; i < 10; i++) {
    b.plot(x, y - 1, withAlpha(o.accentDeep, 120));
    b.plot(x, y + 1, withAlpha(o.accentDeep, 120));
    b.plot(x - dx, y, withAlpha(o.accentSoft, 170));
    b.set(x, y, i % 3 === 1 ? rgb(0xffffff) : o.accent);
    if (rng() < 0.6) x += dx;
    if (rng() < 0.75) y += 1;
    if (y > 13) break;
  }
  return b;
}

/** Afterimage of what is solid on the other side, in the other world's colour. */
function echoTile(world: World, kind: 'solid' | 'bridge'): PixelBuffer {
  const b = tile();
  const c = PAL[otherWorld(world)].accent;
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      const border = x === 0 || y === 0 || x === 15 || y === 15;
      if (kind === 'solid') {
        if (border) b.set(x, y, withAlpha(c, (x + y) % 2 === 0 ? 190 : 110));
        else if ((x + y) % 2 === 0) b.set(x, y, withAlpha(c, (x - y + 16) % 4 === 0 ? 70 : 34));
      } else if (border ? (x + y) % 2 === 0 : x % 4 === 3 && y % 2 === 0) {
        b.set(x, y, withAlpha(c, border ? 150 : 60));
      }
    }
  return b;
}

// ---------------------------------------------------------------- assembly

export function makeTileset(world: World): PixelBuffer {
  const p = PAL[world];
  const sheet = new PixelBuffer(TILESET_COLS * S, TILESET_ROWS * S);
  const rng = mulberry32(world === 'jawia' ? 1337 : 7331);
  const shadowK = world === 'jawia' ? 1 : 0.7;
  const draw: Record<TileName, () => PixelBuffer> = {
    floor_a0: () => floorTile(p, world, 0, rng), floor_a1: () => floorTile(p, world, 0, rng),
    floor_b0: () => floorTile(p, world, 1, rng), floor_b1: () => floorTile(p, world, 1, rng),
    floor_orn: () => ornamentTile(p, world),
    joint_r: () => floorOverlay(p, world, 'joint_r'), hl_l: () => floorOverlay(p, world, 'hl_l'),
    floor_chip: () => floorOverlay(p, world, 'chip'),
    top0: () => topTile(p, world, 0, rng), top1: () => topTile(p, world, 1, rng),
    top2: () => topTile(p, world, 2, rng), top3: () => topTile(p, world, 3, rng),
    rim_n: () => rimTile(p, 'n'), rim_w: () => rimTile(p, 'w'), rim_e: () => rimTile(p, 'e'),
    rim_w_low: () => rimTile(p, 'w_low'), rim_e_low: () => rimTile(p, 'e_low'),
    corner_nw: () => rimTile(p, 'nw'), corner_ne: () => rimTile(p, 'ne'),
    corner_out_nw: () => rimTile(p, 'out_nw'), corner_out_ne: () => rimTile(p, 'out_ne'),
    face_end_w: () => faceOverlay(p, 'end_w'), face_end_e: () => faceOverlay(p, 'end_e'),
    face_cap_n: () => rimTile(p, 'cap_n'),
    face0: () => faceTile(p, world, 0, rng), face1: () => faceTile(p, world, 0, rng), face2: () => faceTile(p, world, 0, rng),
    face_v1: () => faceTile(p, world, 1, rng), face_v2: () => faceTile(p, world, 2, rng), face_v3: () => faceTile(p, world, 3, rng),
    face_ao_w: () => faceOverlay(p, 'ao_w'), face_ao_e: () => faceOverlay(p, 'ao_e'),
    shadow_n: () => shadowTile('n', shadowK), shadow_w: () => shadowTile('w', shadowK),
    shadow_e: () => shadowTile('e', shadowK), shadow_s: () => shadowTile('s', shadowK),
    decor0: () => decorTile(p, 0, rng, world), decor1: () => decorTile(p, 1, rng, world), decor2: () => decorTile(p, 2, rng, world),
    decor3: () => decorTile(p, 3, rng, world), decor4: () => decorTile(p, 4, rng, world), decor5: () => decorTile(p, 5, rng, world),
    water0: () => waterTile(p, 0, world), water1: () => waterTile(p, 1, world),
    water2: () => waterTile(p, 2, world), water3: () => waterTile(p, 3, world),
    shore_n: () => shoreTile(p, world, 'n'), shore_w: () => shoreTile(p, world, 'w'),
    shore_e: () => shoreTile(p, world, 'e'), shore_s: () => shoreTile(p, world, 's'),
    deck_h: () => deckTile(p, world, true, rng), deck_v: () => deckTile(p, world, false, rng),
    rail_n: () => railTile(p, world, 'n'), rail_s: () => railTile(p, world, 's'),
    rail_w: () => railTile(p, world, 'w'), rail_e: () => railTile(p, world, 'e'),
    lily0: () => lilyTile(p, world, 0), lily1: () => lilyTile(p, world, 1),
    rubble0: () => rubbleTile(p, 0), rubble1: () => rubbleTile(p, 1),
    debris0: () => debrisTile(p, 0, rng), debris1: () => debrisTile(p, 1, rng),
    cobweb_nw: () => cobwebTile(p, world, false), cobweb_ne: () => cobwebTile(p, world, true),
    rift0: () => riftTile(world, 0, rng), rift1: () => riftTile(world, 1, rng),
    echo_solid: () => echoTile(world, 'solid'), echo_bridge: () => echoTile(world, 'bridge'),
    spare0: tile, spare1: tile, spare2: tile, spare3: tile,
  };
  TILE_NAMES.forEach((name, i) => {
    sheet.copy(draw[name](), (i % TILESET_COLS) * S, Math.floor(i / TILESET_COLS) * S);
  });
  return sheet;
}
