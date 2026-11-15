// Things that stand in surface rooms and have a life of their own (so they are sprites, not paint):
// the signpost, the campfire, clay pots, the carved idol, the palisade gate, flowers where the dead stand.
// 16x32 cells, like `objects`: everything stands on the bottom edge of its cell.

import type { World } from '../config.ts';
import { PixelBuffer, fromAscii, rgb, type Color } from '../core/PixelBuffer.ts';
import { PAL } from './palette.ts';
import { art, flame, grid, type Sheet } from './sheet.ts';
import { SURF, type SurfacePalette } from './surface.ts';

export const SOBJ = {
  fw: 16, fh: 32, cols: 8,
  /** add to any frame of rows 0-1 to get its Nawia twin */
  ROW_NAWIA: 8,
  SIGN: 0, FIRE: 1, POT: 5, IDOL: 6, OFFERING: 7,
  GATE: 16, GATE_OPEN: 17, GATE_N: 18, GATE_OPEN_N: 19,
  /** the hearth of a house, 4 frames; its Nawia twin is 8 frames further on, like rows 0-1 */
  HEARTH: 24,
} as const;

const cell = (): PixelBuffer => new PixelBuffer(16, 32);

/** Palette for ASCII art: digits index a ramp, a few letters are fixed roles. */
function pal(r: readonly Color[], p: SurfacePalette, extra: Record<string, Color> = {}): Record<string, Color> {
  return { 0: r[0], 1: r[1], 2: r[2], 3: r[3], 4: r[4], o: p.outline, s: p.seam, ...extra };
}

function signpost(p: SurfacePalette): PixelBuffer {
  const b = cell();
  const rows = art(16, [
    '.ooooooooooooo..',
    '.o444444444444o.',
    '.o3333333333332o',
    '.o3s3ss3s3ss332o',
    '.o3333333333332o',
    '.o3ss3s3ss3s32o.',
    '.o222222222222o.',
    '.ooooooooooooo..',
    '......o31o......',
    '......o31o......',
    '......o31o......',
    '......o31o......',
    '......o31o......',
    '......o31o......',
    '.....oo31oo.....',
    '.....oooooo.....',
  ]);
  b.blit(fromAscii(rows, pal(p.wood, p)), 0, 16);
  return b;
}

function campfire(world: World, f: number): PixelBuffer {
  const p = SURF[world];
  const b = cell();
  // a ring of stones
  const stones: [number, number][] = [[2, 28], [5, 30], [9, 30], [12, 28], [3, 26], [11, 26]];
  for (const [x, y] of stones) {
    b.set(x, y, p.stone[3]); b.set(x + 1, y, p.stone[2]);
    b.set(x, y + 1, p.stone[1]); b.set(x + 1, y + 1, p.stone[1]);
  }
  // crossed logs
  for (let i = 0; i < 8; i++) {
    b.set(4 + i, 29 - Math.floor(i / 3), p.log[3]);
    b.set(4 + i, 30 - Math.floor(i / 3), p.log[1]);
    b.set(11 - i, 28 - Math.floor(i / 4), p.log[2]);
  }
  const lit = b.outlined(p.outline);
  flame(lit, PAL[world].fire, 8, 27, 12, 8, f);
  return lit;
}

const CLAY: Record<World, Color[]> = {
  jawia: [0x4a241c, 0x7a3e2a, 0xa85c38, 0xcc8250, 0xe8ab78].map((h) => rgb(h)),
  nawia: SURF.nawia.stone,
};

function pot(world: World): PixelBuffer {
  const p = SURF[world];
  const b = cell();
  const rows = art(12, [
    '...oooooo...',
    '..o443332o..',
    '...o3221o...',
    '..o432221o..',
    '.o43322221o.',
    '.o4sws2sw1o.',
    '.o3wsw2ws1o.',
    '.o43322221o.',
    '..o322211o..',
    '...o2211o...',
    '....oooo....',
  ]);
  b.blit(fromAscii(rows, pal(CLAY[world], p, { w: world === 'jawia' ? rgb(0xecdcb4) : rgb(0xdcffff), s: world === 'jawia' ? rgb(0x7a3e2a) : p.seam })), 2, 21);
  return b;
}

/** A carved post with a face under a flat cap: the god of the place. Its eyes are alight in Nawia. */
function idol(world: World): PixelBuffer {
  const p = SURF[world];
  const b = cell();
  const rows = art(12, [
    '...oooooo...',
    '..o444443o..',
    '.o333333322o',
    '.ooooooooooo',
    '..o433332o..',
    '..o3e33e2o..',
    '..o3e33e2o..',
    '..o433332o..',
    '..o31ss12o..',
    '..o3s33s2o..',
    '..oooooooo..',
    '..o433332o..',
    '..o3s33s2o..',
    '..o33ss32o..',
    '..o3s33s2o..',
    '..o433332o..',
    '..oooooooo..',
    '..o433332o..',
    '..o3s3s32o..',
    '..o433322o..',
    '..o333322o..',
    '.oo333322oo.',
    '.o33333222o.',
    '.oooooooooo.',
  ]);
  b.blit(fromAscii(rows, pal(p.wood, p, { e: world === 'jawia' ? p.outline : rgb(0xdcffff) })), 2, 8);
  return b;
}

/** Where a soul stands in Nawia, the living only see that white flowers grow thicker. */
function offering(p: SurfacePalette): PixelBuffer {
  const b = cell();
  const spots: [number, number][] = [[4, 27], [8, 25], [11, 28], [6, 30], [10, 31]];
  for (const [x, y] of spots) {
    b.set(x, y + 1, p.tuft[0]);
    b.set(x, y - 1, p.flowers[0][0]); b.set(x - 1, y, p.flowers[0][0]); b.set(x + 1, y, p.flowers[0][0]);
    b.set(x, y, p.flowers[0][1]);
  }
  return b;
}

function gate(p: SurfacePalette, open: boolean): PixelBuffer {
  const b = cell();
  const L = p.log;
  for (let y = 9; y < 32; y++)
    for (let x = 0; x < 16; x++) {
      if (open && x > 2 && x < 13) continue;
      const k = x % 4;
      let col: Color = k === 0 ? L[3] : k === 3 ? p.seam : k === 1 ? L[2] : L[1];
      if (y === 9) col = L[4];
      // iron bands
      if (y === 14 || y === 26) col = p.stone[3];
      if (y === 15 || y === 27) col = p.stone[1];
      if (!open && (x === 7 || x === 8)) col = y === 20 || y === 21 ? p.stone[4] : x === 7 ? L[1] : p.outline;
      if (x === 0 || x === 15 || y === 31) col = p.outline;
      if (open && (x === 2 || x === 13)) col = p.outline;
      b.set(x, y, col);
    }
  return b;
}

/** A clay stove with an open hearth, built against the back wall of a house. A pot hangs over the fire. */
function hearth(world: World, f: number): PixelBuffer {
  const p = SURF[world];
  const b = cell();
  const c = CLAY[world];
  const lime = world === 'jawia' ? [rgb(0xb9ad96), rgb(0xd9cfb8), rgb(0xf1eada)] : [p.stone[1], p.stone[2], p.stone[3]];
  // the whitewashed body, narrowing into a hood
  for (let y = 4; y < 32; y++) {
    const inset = y < 12 ? Math.round((12 - y) * 0.45) : 0;
    for (let x = inset; x < 16 - inset; x++) {
      let col: Color = x < inset + 3 ? lime[2] : x >= 13 - inset ? lime[0] : lime[1];
      if (y === 4) col = lime[2];
      if (y === 12 || y === 13) col = x % 4 === 0 ? p.seam : c[2]; // a band of painted tiles
      if (y >= 29) col = (x + (y & 1) * 2) % 5 === 0 ? p.stone[0] : p.stone[2];
      b.set(x, y, col);
    }
  }
  // the mouth of the hearth
  for (let y = 17; y < 29; y++)
    for (let x = 3; x < 13; x++) {
      const arch = y === 17 && (x < 5 || x > 10);
      if (!arch) b.set(x, y, y > 26 ? c[0] : p.outline);
    }
  const out = b.outlined(p.outline);
  flame(out, PAL[world].fire, 8, 27, 8, 7, f);
  // the pot on its hook
  for (let x = 6; x < 10; x++) { out.set(x, 19, p.stone[1]); out.set(x, 20, p.stone[0]); }
  out.set(7, 18, p.stone[2]); out.set(8, 18, p.stone[2]);
  return out;
}

export function surfacePropSheet(): Sheet {
  const frames: (PixelBuffer | null)[] = [];
  for (const world of ['jawia', 'nawia'] as World[]) {
    const p = SURF[world];
    frames.push(signpost(p));
    for (let f = 0; f < 4; f++) frames.push(campfire(world, f));
    frames.push(pot(world), idol(world), offering(p));
  }
  frames.push(gate(SURF.jawia, false), gate(SURF.jawia, true), gate(SURF.nawia, false), gate(SURF.nawia, true), null, null, null, null);
  for (const world of ['jawia', 'nawia'] as World[]) {
    for (let f = 0; f < 4; f++) frames.push(hearth(world, f));
    frames.push(null, null, null, null);
  }
  return grid('surface', SOBJ.fw, SOBJ.fh, SOBJ.cols, frames);
}
