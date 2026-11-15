// Procedural placeholder tileset. One generator, two palettes -> two tilesets with the same layout.
//
// The layout below is the contract for real art: export it (`npm run art:export`),
// paint over `tiles_jawia.png` / `tiles_nawia.png`, drop them into /assets and the game uses them.

import { TILE, otherWorld, type World } from '../config.ts';
import { PixelBuffer, rgb, withAlpha, type Color } from '../core/PixelBuffer.ts';
import { mulberry32, type Rng } from '../core/rng.ts';
import { PAL, type WorldPalette } from './palette.ts';

export const TILESET_COLS = 8;

/** Fixed grid, 8 tiles per row. Never reorder: PNG replacements depend on it. */
export const TILE_NAMES = [
  // row 0: floor slabs
  'floor0', 'floor1', 'floor2', 'floor3', 'floor4', 'floor5', 'floor6', 'floor7',
  // row 1: wall tops + their rims (overlays)
  'top0', 'top1', 'rim_n', 'rim_w', 'rim_e', 'rim_w_low', 'rim_e_low', 'corner_nw',
  // row 2: wall faces
  'corner_ne', 'face0', 'face1', 'face2', 'face_end_w', 'face_end_e', 'face_ao_w', 'face_ao_e',
  // row 3: contact shadows (overlays) + floor decor (overlays)
  'face_cap_n', 'shadow_n', 'shadow_w', 'shadow_e', 'shadow_s', 'decor0', 'decor1', 'decor2',
  // row 4: water / abyss animation + shores (overlays)
  'water0', 'water1', 'water2', 'water3', 'shore_n', 'shore_w', 'shore_e', 'shore_s',
  // row 5: bridges
  'deck_h', 'deck_v', 'rail_n', 'rail_s', 'rail_w', 'rail_e', 'decor3', 'decor4',
  // row 6: rubble, debris, echoes of the other world
  'rubble0', 'rubble1', 'debris0', 'debris1', 'echo_solid', 'echo_bridge', 'spare0', 'spare1',
] as const;

export type TileName = (typeof TILE_NAMES)[number];

export const TILE_INDEX = Object.fromEntries(TILE_NAMES.map((n, i) => [n, i])) as Record<TileName, number>;
export const TILESET_ROWS = Math.ceil(TILE_NAMES.length / TILESET_COLS);

const S = TILE;
const black = (a: number): Color => rgb(0x000000, a);

function tile(): PixelBuffer {
  return new PixelBuffer(S, S);
}

function speckle(b: PixelBuffer, rng: Rng, n: number, colors: Color[], margin = 1): void {
  for (let i = 0; i < n; i++) {
    const x = margin + Math.floor(rng() * (S - margin * 2));
    const y = margin + Math.floor(rng() * (S - margin * 2));
    b.set(x, y, colors[Math.floor(rng() * colors.length)]);
  }
}

// ---------------------------------------------------------------- floor

function floorTile(p: WorldPalette, v: number, rng: Rng, world: World): PixelBuffer {
  const b = tile().fill(p.floor);
  type Slab = [number, number, number, number];
  let slabs: Slab[];
  if (v === 1) slabs = [[0, 0, 8, 16], [8, 0, 8, 16]];
  else if (v === 2) slabs = [[0, 0, 16, 8], [0, 8, 16, 8]];
  else if (v === 3) slabs = [[0, 0, 8, 8], [8, 0, 8, 8], [0, 8, 16, 8]];
  else if (v === 5) slabs = [[0, 0, 16, 8], [0, 8, 8, 8], [8, 8, 8, 8]];
  else slabs = [[0, 0, 16, 16]];

  for (const [x, y, w, h] of slabs) {
    for (let i = x; i < x + w; i++) {
      b.set(i, y, p.floorLight);
      b.set(i, y + h - 1, p.floorDark);
    }
    for (let j = y; j < y + h; j++) {
      b.set(x, j, p.floorLight);
      b.set(x + w - 1, j, p.floorDark);
    }
    b.set(x + w - 1, y, p.floor);
    b.set(x, y + h - 1, p.floor);
  }
  speckle(b, rng, 5, [p.floorLight, p.floorDark], 2);

  if (v === 4) {
    // a crack wandering across the slab
    let x = 3 + Math.floor(rng() * 3);
    for (let y = 2; y < 14; y++) {
      b.set(x, y, p.floorDarker);
      if (rng() < 0.5) b.set(x + 1, y, p.floorDark);
      x += rng() < 0.4 ? 1 : rng() < 0.3 ? -1 : 0;
    }
  }
  if (v === 6) {
    // worn, paler patch
    for (let i = 0; i < 16; i++) {
      const x = 5 + Math.floor(rng() * 6);
      const y = 5 + Math.floor(rng() * 6);
      b.set(x, y, p.floorLighter);
    }
  }
  if (v === 7) {
    // something grows in the joints: moss in Jawia, a cold glow in Nawia
    const corner = rng() < 0.5;
    for (let i = 0; i < 12; i++) {
      const d = Math.floor(rng() * 5);
      const e = Math.floor(rng() * (5 - d));
      const x = corner ? d : 15 - d;
      const y = 15 - e;
      b.set(x, y, world === 'jawia' ? (rng() < 0.3 ? p.growthLight : rng() < 0.5 ? p.growth : p.growthDark) : (rng() < 0.2 ? p.growth : p.growthDark));
    }
  }
  return b;
}

// ---------------------------------------------------------------- walls

function topTile(p: WorldPalette, rng: Rng): PixelBuffer {
  const b = tile().fill(p.top);
  for (let i = 0; i < 7; i++) {
    const x = 1 + Math.floor(rng() * 13);
    const y = 1 + Math.floor(rng() * 14);
    b.set(x, y, p.topNoise);
    b.set(x + 1, y, p.topNoise);
  }
  return b;
}

function rimTile(p: WorldPalette, kind: 'n' | 'w' | 'e' | 'w_low' | 'e_low' | 'nw' | 'ne' | 'cap_n'): PixelBuffer {
  const b = tile();
  switch (kind) {
    case 'n':
      for (let x = 0; x < S; x++) { b.set(x, 0, p.rimLight); b.set(x, 1, p.rim); }
      break;
    case 'cap_n':
      for (let x = 0; x < S; x++) b.set(x, 0, p.rimLight);
      break;
    case 'w':
    case 'w_low':
      for (let y = 0; y < S; y++) { b.set(0, y, p.rimLight); b.set(1, y, p.rim); }
      if (kind === 'w_low') b.set(0, 0, p.rim);
      break;
    case 'e':
    case 'e_low':
      for (let y = 0; y < S; y++) { b.set(15, y, p.rimLight); b.set(14, y, p.rim); }
      if (kind === 'e_low') b.set(15, 0, p.rim);
      break;
    case 'nw':
      b.set(0, 0, p.rimLight); b.set(1, 0, p.rim); b.set(0, 1, p.rim); b.set(1, 1, p.rim);
      break;
    case 'ne':
      b.set(15, 0, p.rimLight); b.set(14, 0, p.rim); b.set(15, 1, p.rim); b.set(14, 1, p.rim);
      break;
  }
  return b;
}

const RUNES: string[][] = [
  ['#.#', '#.#', '.#.', '.#.', '#.#'],
  ['.#.', '###', '.#.', '.#.', '.#.'],
  ['#..', '##.', '#.#', '##.', '#..'],
  ['.#.', '#.#', '.#.', '#.#', '#.#'],
];

function faceTile(p: WorldPalette, v: number, rng: Rng, world: World): PixelBuffer {
  const b = tile();
  // the lip of the wall top
  for (let x = 0; x < S; x++) { b.set(x, 0, p.rim); b.set(x, 1, p.rimLight); }
  // three courses of bricks
  for (let c = 0; c < 3; c++) {
    const y0 = 2 + c * 4;
    const off = c % 2 === 0 ? 0 : 4;
    let tone = rng();
    for (let x = 0; x < S; x++) {
      const joint = (x + off) % 8 === 7;
      if ((x + off) % 8 === 0) tone = rng();
      const base = tone < 0.2 ? p.brickDark : tone > 0.82 ? p.brickLight : p.brick;
      const hi = base === p.brickDark ? p.brick : p.brickLight;
      for (let j = 0; j < 3; j++) b.set(x, y0 + j, joint ? p.mortar : j === 0 ? hi : base);
      b.set(x, y0 + 3, p.mortar);
    }
  }
  // plinth
  for (let x = 0; x < S; x++) { b.set(x, 14, p.plinth); b.set(x, 15, p.plinthDark); }
  b.set(4, 14, p.plinthDark); b.set(11, 14, p.plinthDark);
  // the top course catches a little shadow from the lip
  for (let x = 0; x < S; x++) b.plot(x, 2, black(40));

  if (v === 1) {
    if (world === 'jawia') {
      // moss hanging from the lip
      for (let x = 0; x < S; x++) {
        if (rng() < 0.45) continue;
        const len = 1 + Math.floor(rng() * 5);
        for (let j = 0; j < len; j++) b.set(x, 1 + j, j === len - 1 ? p.growthLight : rng() < 0.5 ? p.growth : p.growthDark);
      }
    } else {
      // a rune that still remembers how to glow
      const r = RUNES[Math.floor(rng() * RUNES.length)];
      const ox = 6 + Math.floor(rng() * 3);
      for (let j = 0; j < r.length; j++)
        for (let i = 0; i < 3; i++) if (r[j][i] === '#') {
          b.set(ox + i, 5 + j, p.growthLight);
        }
      for (let j = -1; j <= r.length; j++)
        for (let i = -1; i <= 3; i++) {
          const here = r[j]?.[i] === '#';
          if (!here) b.plot(ox + i, 5 + j, withAlpha(p.growth, 70));
        }
    }
  }
  if (v === 2) {
    let x = 4 + Math.floor(rng() * 8);
    for (let y = 2; y < 12; y++) {
      b.set(x, y, p.mortar);
      x += rng() < 0.45 ? (rng() < 0.5 ? 1 : -1) : 0;
    }
  }
  return b;
}

function faceOverlay(p: WorldPalette, kind: 'end_w' | 'end_e' | 'ao_w' | 'ao_e'): PixelBuffer {
  const b = tile();
  const x = kind.endsWith('w') ? 0 : 15;
  const x2 = kind.endsWith('w') ? 1 : 14;
  if (kind.startsWith('end')) {
    b.set(x, 0, p.rimLight); b.set(x, 1, p.rimLight);
    for (let y = 2; y < S; y++) b.set(x, y, p.mortar);
    for (let y = 2; y < 14; y++) b.plot(x2, y, black(50));
  } else {
    for (let y = 2; y < S; y++) { b.plot(x, y, black(110)); b.plot(x2, y, black(55)); }
  }
  return b;
}

function shadowTile(kind: 'n' | 'w' | 'e' | 's'): PixelBuffer {
  const b = tile();
  for (let i = 0; i < S; i++) {
    if (kind === 'n') {
      b.set(i, 0, black(120)); b.set(i, 1, black(90)); b.set(i, 2, black(60));
      b.set(i, 3, black(i % 2 === 0 ? 60 : 25)); b.set(i, 4, black(i % 2 === 1 ? 25 : 0));
    } else if (kind === 's') {
      b.set(i, 15, black(70)); b.set(i, 14, black(30));
    } else if (kind === 'w') {
      b.set(0, i, black(80)); b.set(1, i, black(40));
    } else {
      b.set(15, i, black(80)); b.set(14, i, black(40));
    }
  }
  return b;
}

// ---------------------------------------------------------------- water

function waterTile(p: WorldPalette, f: number, world: World): PixelBuffer {
  const b = tile().fill(p.water);
  const TAU = Math.PI * 2;
  const t = f / 4;
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      const u = (x + 0.5) / S;
      const v = (y + 0.5) / S;
      if (world === 'jawia') {
        // slow, mostly horizontal ripples
        const a = Math.sin(TAU * 2 * v + 1.4 * Math.sin(TAU * (u + t)));
        const c = Math.sin(TAU * (u - t) + TAU * v + 0.7);
        const w = a * 0.72 + c * 0.28;
        if (w > 0.93) b.set(x, y, p.waterLight);
        else if (w > 0.7) b.set(x, y, p.waterMid);
      } else {
        const a = Math.sin(TAU * (u - t) + 2.2 * Math.sin(TAU * v + 1));
        const c = Math.sin(TAU * v + TAU * u * 2 + TAU * t);
        if (a * 0.6 + c * 0.4 > 0.8) b.set(x, y, p.waterMid);
      }
    }
  if (world === 'jawia') {
    const sp = [[3, 4], [11, 9], [7, 13], [14, 2]];
    const [sx, sy] = sp[f % sp.length];
    b.set(sx, sy, p.waterSpark);
    b.set(sx + 1, sy, p.waterLight);
  } else {
    // stars that take turns twinkling
    const stars = [[2, 3], [13, 6], [6, 10], [10, 14]];
    stars.forEach(([sx, sy], i) => {
      const ph = (f + i) % 4;
      if (ph === 0) b.set(sx, sy, p.waterSpark);
      else if (ph !== 2) b.set(sx, sy, p.waterLight);
    });
  }
  return b;
}

function shoreTile(p: WorldPalette, kind: 'n' | 'w' | 'e' | 's'): PixelBuffer {
  const b = tile();
  for (let i = 0; i < S; i++) {
    if (kind === 'n') {
      b.set(i, 0, p.floorDark); b.set(i, 1, p.floorDarker); b.set(i, 2, p.plinthDark);
      b.set(i, 3, black(110));
      if (i % 5 < 3) b.set(i, 4, p.waterLight);
    } else if (kind === 's') {
      b.set(i, 15, p.floorDarker);
      if (i % 6 < 2) b.set(i, 14, p.waterMid);
    } else if (kind === 'w') {
      b.set(0, i, p.floorDarker);
      if (i % 5 < 2) b.set(1, i, p.waterLight);
    } else {
      b.set(15, i, p.floorDarker);
      if (i % 5 < 2) b.set(14, i, p.waterLight);
    }
  }
  return b;
}

// ---------------------------------------------------------------- bridges

function deckTile(p: WorldPalette, horizontal: boolean, rng: Rng): PixelBuffer {
  const b = tile();
  for (let k = 0; k < 4; k++) {
    const tone = rng();
    const base = tone < 0.25 ? p.plankDark : tone > 0.8 ? p.plankLight : p.plank;
    for (let a = 0; a < 4; a++)
      for (let l = 0; l < S; l++) {
        const along = l;
        const across = k * 4 + a;
        let c = a === 3 ? p.plankEdge : a === 0 && base !== p.plankLight ? p.plankLight : base;
        if (a === 1 && (l === 2 || l === 13)) c = p.plankEdge; // nails
        if (horizontal) b.set(across, along, c);
        else b.set(along, across, c);
      }
  }
  return b;
}

function railTile(p: WorldPalette, kind: 'n' | 's' | 'w' | 'e'): PixelBuffer {
  const b = tile();
  for (let i = 0; i < S; i++) {
    const post = i === 1 || i === 14;
    if (kind === 'n') {
      b.set(i, 0, p.plankEdge); b.set(i, 1, p.plankLight); b.plot(i, 2, black(70));
      if (post) { b.set(i, 1, p.plankEdge); b.set(i, 2, p.plankEdge); }
    } else if (kind === 's') {
      b.set(i, 15, p.plankEdge); b.set(i, 14, p.plankLight); b.set(i, 13, p.plankEdge);
      if (post) b.set(i, 14, p.plankEdge);
    } else if (kind === 'w') {
      b.set(0, i, p.plankEdge); b.set(1, i, p.plankLight); b.plot(2, i, black(70));
      if (post) b.set(1, i, p.plankEdge);
    } else {
      b.set(15, i, p.plankEdge); b.set(14, i, p.plankLight); b.plot(13, i, black(70));
      if (post) b.set(14, i, p.plankEdge);
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
      if (nx * nx + ny * ny > 1) continue;
      const s = -(nx * 0.55 + ny * 0.85);
      t.set(x, y, s > 0.42 ? p.rockLight : s > -0.25 ? p.rock : p.rockDark);
    }
  b.blit(t.outlined(p.rockEdge), 0, 0);
}

function rubbleTile(p: WorldPalette, v: number): PixelBuffer {
  const b = tile();
  // soft contact shadow
  for (let x = 1; x < 15; x++) { b.set(x, 15, black(90)); if (x % 2) b.set(x, 14, black(60)); }
  const piles = v === 0
    ? [[4.5, 4.5, 4.2, 3.4], [11.5, 5, 3.8, 3.6], [2.8, 10.5, 2.6, 2.8], [13, 11, 2.8, 3], [8, 10.2, 5, 4.2]]
    : [[10.5, 4, 4.6, 3.2], [4, 5.5, 3.4, 3.8], [12.6, 10.2, 3, 3.6], [6.5, 10.6, 5.4, 4], [1.8, 12, 1.6, 2]];
  for (const [cx, cy, rx, ry] of piles) rock(b, p, cx, cy, rx, ry);
  return b;
}

function debrisTile(p: WorldPalette, v: number, rng: Rng): PixelBuffer {
  const b = tile();
  const n = 4 + v;
  for (let i = 0; i < n; i++) {
    const cx = 2 + rng() * 12;
    const cy = 2 + rng() * 12;
    const r = 0.9 + rng() * 1.3;
    b.plot(Math.round(cx), Math.round(cy + r + 1), black(70));
    rock(b, p, cx, cy, r, r * 0.8);
  }
  return b;
}

// ---------------------------------------------------------------- decor + echoes

function decorTile(p: WorldPalette, v: number, rng: Rng, world: World): PixelBuffer {
  const b = tile();
  if (v === 0) {
    // pebbles
    for (let i = 0; i < 3; i++) {
      const x = 3 + Math.floor(rng() * 10);
      const y = 3 + Math.floor(rng() * 10);
      b.set(x, y, p.rockLight); b.set(x + 1, y, p.rock); b.set(x, y + 1, p.rockDark); b.set(x + 1, y + 1, p.rockDark);
      b.plot(x, y + 2, black(60)); b.plot(x + 1, y + 2, black(60));
    }
  } else if (v === 1) {
    // long crack
    let y = 5 + Math.floor(rng() * 5);
    for (let x = 1; x < 15; x++) {
      b.set(x, y, p.floorDarker);
      if (rng() < 0.35) y += rng() < 0.5 ? 1 : -1;
      if (rng() < 0.3) b.set(x, y + 1, p.floorDark);
    }
  } else if (v === 2) {
    // tuft: moss / cold lichen
    const cx = 5 + Math.floor(rng() * 6);
    const cy = 6 + Math.floor(rng() * 5);
    for (let i = 0; i < 14; i++) {
      const x = cx + Math.round((rng() - 0.5) * 6);
      const y = cy + Math.round((rng() - 0.5) * 4);
      b.set(x, y, rng() < 0.25 ? p.growthLight : rng() < 0.6 ? p.growth : p.growthDark);
    }
    if (world === 'jawia') { b.set(cx, cy - 3, p.growthLight); b.set(cx + 2, cy - 2, p.growth); b.set(cx - 2, cy - 2, p.growth); }
  } else if (v === 3) {
    // old bones
    const bone = world === 'jawia' ? rgb(0xcfc6b4) : rgb(0xa9b8e8);
    const dark = world === 'jawia' ? rgb(0x8d8478) : rgb(0x6474b4);
    const pts = [[5, 9], [6, 8], [7, 8], [8, 7], [10, 10], [11, 10]];
    for (const [x, y] of pts) { b.set(x, y, bone); b.plot(x, y + 1, black(60)); }
    b.set(4, 9, dark); b.set(9, 7, dark); b.set(12, 10, dark);
  } else {
    // puddle / pool of glow
    for (let y = 0; y < S; y++)
      for (let x = 0; x < S; x++) {
        const nx = (x - 7.5) / 5;
        const ny = (y - 8.5) / 2.6;
        const d = nx * nx + ny * ny;
        if (d < 1) b.set(x, y, d < 0.35 ? p.waterMid : p.water);
        else if (d < 1.35) b.plot(x, y, withAlpha(p.floorDarker, 200));
      }
    b.set(6, 8, p.waterLight); b.set(7, 8, p.waterLight);
  }
  return b;
}

/** A hint of what is solid on the *other* side: drawn with the other world's signature colour. */
function echoTile(world: World, kind: 'solid' | 'bridge'): PixelBuffer {
  const b = tile();
  const c = PAL[otherWorld(world)].accent;
  for (let i = 0; i < S; i++) {
    const on = i % 2 === 0;
    if (kind === 'solid') {
      if (on) { b.set(i, 0, withAlpha(c, 78)); b.set(15 - i, 15, withAlpha(c, 78)); b.set(0, 15 - i, withAlpha(c, 78)); b.set(15, i, withAlpha(c, 78)); }
    } else if (i % 4 === 0) {
      b.set(i, 1, withAlpha(c, 70)); b.set(i + 1, 14, withAlpha(c, 70));
      b.set(1, i + 1, withAlpha(c, 40)); b.set(14, i, withAlpha(c, 40));
    }
  }
  if (kind === 'solid')
    for (let y = 3; y < 14; y += 4) for (let x = 3; x < 14; x += 4) b.set(x + ((y >> 2) & 1) * 2, y, withAlpha(c, 46));
  return b;
}

// ---------------------------------------------------------------- assembly

export function makeTileset(world: World): PixelBuffer {
  const p = PAL[world];
  const sheet = new PixelBuffer(TILESET_COLS * S, TILESET_ROWS * S);
  const rng = mulberry32(world === 'jawia' ? 1337 : 7331);
  const draw: Record<TileName, () => PixelBuffer> = {
    floor0: () => floorTile(p, 0, rng, world), floor1: () => floorTile(p, 1, rng, world),
    floor2: () => floorTile(p, 2, rng, world), floor3: () => floorTile(p, 3, rng, world),
    floor4: () => floorTile(p, 4, rng, world), floor5: () => floorTile(p, 5, rng, world),
    floor6: () => floorTile(p, 6, rng, world), floor7: () => floorTile(p, 7, rng, world),
    top0: () => topTile(p, rng), top1: () => topTile(p, rng),
    rim_n: () => rimTile(p, 'n'), rim_w: () => rimTile(p, 'w'), rim_e: () => rimTile(p, 'e'),
    rim_w_low: () => rimTile(p, 'w_low'), rim_e_low: () => rimTile(p, 'e_low'),
    corner_nw: () => rimTile(p, 'nw'), corner_ne: () => rimTile(p, 'ne'),
    face0: () => faceTile(p, 0, rng, world), face1: () => faceTile(p, 1, rng, world), face2: () => faceTile(p, 2, rng, world),
    face_end_w: () => faceOverlay(p, 'end_w'), face_end_e: () => faceOverlay(p, 'end_e'),
    face_ao_w: () => faceOverlay(p, 'ao_w'), face_ao_e: () => faceOverlay(p, 'ao_e'),
    face_cap_n: () => rimTile(p, 'cap_n'),
    shadow_n: () => shadowTile('n'), shadow_w: () => shadowTile('w'), shadow_e: () => shadowTile('e'), shadow_s: () => shadowTile('s'),
    decor0: () => decorTile(p, 0, rng, world), decor1: () => decorTile(p, 1, rng, world), decor2: () => decorTile(p, 2, rng, world),
    decor3: () => decorTile(p, 3, rng, world), decor4: () => decorTile(p, 4, rng, world),
    water0: () => waterTile(p, 0, world), water1: () => waterTile(p, 1, world),
    water2: () => waterTile(p, 2, world), water3: () => waterTile(p, 3, world),
    shore_n: () => shoreTile(p, 'n'), shore_w: () => shoreTile(p, 'w'), shore_e: () => shoreTile(p, 'e'), shore_s: () => shoreTile(p, 's'),
    deck_h: () => deckTile(p, true, rng), deck_v: () => deckTile(p, false, rng),
    rail_n: () => railTile(p, 'n'), rail_s: () => railTile(p, 's'), rail_w: () => railTile(p, 'w'), rail_e: () => railTile(p, 'e'),
    rubble0: () => rubbleTile(p, 0), rubble1: () => rubbleTile(p, 1),
    debris0: () => debrisTile(p, 0, rng), debris1: () => debrisTile(p, 1, rng),
    echo_solid: () => echoTile(world, 'solid'), echo_bridge: () => echoTile(world, 'bridge'),
    spare0: () => tile(), spare1: () => tile(),
  };
  TILE_NAMES.forEach((name, i) => {
    sheet.copy(draw[name](), (i % TILESET_COLS) * S, Math.floor(i / TILESET_COLS) * S);
  });
  return sheet;
}
