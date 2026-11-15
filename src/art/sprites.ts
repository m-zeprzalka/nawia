// Sprite sheets, drawn in code. Every sheet is a fixed grid (fw x fh cells):
// that grid is the contract for real art (see docs/ART.md).
//
// Characters live in actors.ts; this file holds everything that stands still.

import { surfacePropSheet } from './surfaceProps.ts';
import { type World } from '../config.ts';
import { PixelBuffer, bayer, fromAscii, mix, rgb, type Color } from '../core/PixelBuffer.ts';
import { makeActorSheets } from './actors.ts';
import { INK, PAL, type WorldPalette } from './palette.ts';
import { art, flame, grid, type Sheet } from './sheet.ts';

export type { Sheet } from './sheet.ts';


// =============================================================== objects
// 16x32 cells, 8 per row, everything stands on the bottom edge of its cell.
// Row 0: Jawia  - brazier x4, wall torch x4
// Row 1: Nawia  - brazier x4, wall torch x4
// Row 2: sign (J), sign (N), gate, gate open, bell (rest, left, right), heart pickup
// Row 3: urn (J), urn (N), idol (J), idol (N), pillar (J), pillar (N), bones, spare
// Row 4: souls x3, turning stone (sun side up), turning stone (moon side up)
// Row 5: sun post (raised, lowered), moon post (raised, lowered)

export const OBJ = {
  fw: 16, fh: 32, cols: 8,
  BRAZIER: 0, TORCH: 4, ROW_NAWIA: 8,
  SIGN_J: 16, SIGN_N: 17, GATE: 18, GATE_OPEN: 19, BELL: 20, BELL_L: 21, BELL_R: 22, HEART: 23,
  URN_J: 24, URN_N: 25, IDOL_J: 26, IDOL_N: 27, PILLAR_J: 28, PILLAR_N: 29, BONES: 30,
  SOUL: 32, SWITCH_SUN: 35, SWITCH_MOON: 36,
  POST_SUN_UP: 40, POST_SUN_DOWN: 41, POST_MOON_UP: 42, POST_MOON_DOWN: 43,
} as const;

const cell = (): PixelBuffer => new PixelBuffer(16, 32);

function brazier(p: WorldPalette, f: number): PixelBuffer {
  const b = cell();
  const I = { l: INK.ironMid, m: INK.ironDark, d: INK.ironDeep, h: INK.iron };
  const bowl = fromAscii(art(16, [
    '.hllllllllllllh.',
    '.dmmmmmmmmmmmmd.',
    '..dmmmmmmmmmmd..',
    '...dddmmmmddd...',
    '......dmmd......',
    '......dmmd......',
    '.....ddmmdd.....',
    '....dd.dd.dd....',
    '...dd..dd..dd...',
    '..ddd..dd..ddd..',
  ]), I);
  b.blit(bowl, 0, 21);
  for (let x = 3; x < 13; x++) b.set(x, 21, x % 3 === f % 3 ? p.fire[1] : p.fire[2]);
  flame(b, p.fire, 8, 20, 10, 9, f);
  return b.outlined(INK.outline);
}

function wallTorch(p: WorldPalette, f: number): PixelBuffer {
  const b = cell();
  const sconce = fromAscii(art(9, ['.dhhhhhd.', '..dmmmd..', '...dmd...', '...dmd...', '...dmd...', '....d....']), {
    h: INK.ironMid, m: INK.ironDark, d: INK.ironDeep,
  });
  b.blit(sconce, 4, 22);
  flame(b, p.fire, 8.5, 21, 8, 6, f);
  return b;
}

function signStone(p: WorldPalette, glow: boolean): PixelBuffer {
  const b = cell();
  const carve = glow ? p.growth[3] : p.rock[0];
  const stone = fromAscii(art(14, [
    '....hhhhh.....',
    '..hhlllllmm...',
    '.hllmmmmmmmd..',
    '.hlmcmcmmcmd..',
    'hllmmcmmcmcmd.',
    'hlmmmmmmmmmmd.',
    'hlmcmmcmcmmcd.',
    'hlmmcmmcmmcmd.',
    'hlmmmmmmmmmmd.',
    'hlmmcmcmmcmmd.',
    'hlmmmmmmmmmdd.',
    'hlmmmmmmmmddd.',
    'dmmmmmmmmdddd.',
    '.dddddddddddd.',
  ]), { h: p.rock[5], l: p.rock[4], m: p.rock[3], d: p.rock[1], c: carve });
  b.blit(stone, 1, 17);
  const out = b.outlined(INK.outline);
  if (glow)
    for (let y = 0; y < 32; y++)
      for (let x = 0; x < 16; x++)
        if (b.get(x, y) === carve)
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const c = out.get(x + dx, y + dy);
            if (c !== carve && c !== 0) out.set(x + dx, y + dy, mix(c, p.growth[2], 0.5));
          }
  return out;
}

function gate(open: boolean): PixelBuffer {
  const b = cell();
  const top = 16;
  const bottom = open ? 19 : 31;
  for (let x = 0; x < 16; x++) { b.set(x, top, INK.iron); b.set(x, top + 1, INK.ironMid); b.set(x, top + 2, INK.ironDeep); }
  for (let k = 0; k < 4; k++) {
    const x = 1 + k * 4;
    for (let y = top + 2; y <= bottom; y++) { b.set(x, y, INK.ironMid); b.set(x + 1, y, INK.ironDark); b.set(x + 2, y, INK.ironDeep); }
    b.set(x, bottom, INK.ironDeep); b.set(x + 1, bottom, open ? INK.ironDeep : INK.iron);
  }
  if (!open) for (let x = 0; x < 16; x++) { b.set(x, 24, INK.ironMid); b.set(x, 25, INK.ironDeep); }
  return b;
}

function bell(tilt: number): PixelBuffer {
  const b = cell();
  const w = PAL.jawia.wood;
  for (let y = 10; y < 31; y++) { b.set(1, y, w[4]); b.set(2, y, w[3]); b.set(13, y, w[3]); b.set(14, y, w[2]); }
  for (let x = 0; x < 16; x++) { b.set(x, 9, w[4]); b.set(x, 10, w[3]); b.set(x, 11, w[1]); }
  const bronze = fromAscii(art(8, [
    '...hh...',
    '..hmmd..',
    '.hmmmmd.',
    '.hmmmmd.',
    '.hmmmmd.',
    'hmmmmmmd',
    'hhmmmmdd',
    '.dddddd.',
  ]), { h: rgb(0xf6d47a), m: rgb(0xc8923e), d: rgb(0x7f5526) });
  b.blit(bronze, 4 + tilt, 13);
  b.set(7 + tilt, 12, w[0]); b.set(8 + tilt, 12, w[0]);
  b.set(7 + tilt * 2, 21, rgb(0x3a2a22)); b.set(8 + tilt * 2, 21, rgb(0x3a2a22));
  return b.outlined(INK.outline);
}

function urn(world: World): PixelBuffer {
  const b = cell();
  const j = world === 'jawia';
  const pal = j
    ? { L: rgb(0xe09a58), m: rgb(0xb86c3e), d: rgb(0x7c4229), r: rgb(0xeadfc4), k: rgb(0x4a2a20) }
    : { L: rgb(0xcfe3ff), m: rgb(0x6f8ad8), d: rgb(0x34449a), r: PAL.nawia.growth[3], k: rgb(0x151a42) };
  const pot = fromAscii(art(12, [
    '...kmmmmk...',
    '...mLLLLm...',
    '....dmmd....',
    '...mLmmmm...',
    '..mLLmmmmd..',
    '.mLLmmmmmmd.',
    '.mLmmmmmmdd.',
    '.rmrmrmrmrd.',
    '.mrmrmrmrdd.',
    '.mmmmmmmddd.',
    '.dmmmmmmddd.',
    '..dmmmmddd..',
    '...dddddd...',
  ]), pal);
  b.blit(pot, 2, 18);
  return b.outlined(INK.outline);
}

/** A carved idol: four faces looked every way once. One is enough at this size. */
function idol(world: World): PixelBuffer {
  const b = cell();
  const p = PAL[world];
  const j = world === 'jawia';
  const eye = j ? p.rock[0] : p.growth[4];
  const carve = j ? p.rock[1] : p.growth[2];
  const pal = { h: p.rock[4], H: p.rock[2], L: p.rock[5], m: p.rock[3], M: p.rock[2], D: p.rock[1], e: eye, n: p.rock[4], x: carve, g: j ? PAL.jawia.growth[2] : p.rock[3] };
  const body = fromAscii(art(14, [
    '....hhhhhh....',
    '...hhHHHHhh...',
    '..hhhhhhhhhh..',
    '..LmmmmmmmmD..',
    '..LmeemmeemD..',
    '..LmeemmeemD..',
    '..LmmmnnmmmD..',
    '..LmMmnnmMmD..',
    '..LMMMMMMMMD..',
    '..LmMmmmmMmD..',
    '...LmmmmmmD...',
    '..LLmmmmmmDD..',
    '..LmxxxxxxmD..',
    '..LmmmmmmmmD..',
    '..LmxmxmxmmD..',
    '..LmmxmxmxmD..',
    '..LmmmmmmmmD..',
    '..LmxxxxxxmD..',
    '..LgmmmmmmmD..',
    '..LggmmmmmmD..',
    '.LLgmmmmmmmDD.',
    '.LmmmmmmmmmmD.',
    '.DDDDDDDDDDDD.',
  ]), pal);
  b.blit(body, 1, 8);
  const out = b.outlined(INK.outline);
  if (!j) {
    // the eyes of the dead god are lit
    for (let y = 0; y < 32; y++)
      for (let x = 0; x < 16; x++)
        if (b.get(x, y) === eye)
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const c = out.get(x + dx, y + dy);
            if (c !== eye && c !== 0) out.set(x + dx, y + dy, mix(c, p.growth[3], 0.55));
          }
  }
  return out;
}

function pillar(world: World): PixelBuffer {
  const b = cell();
  const p = PAL[world];
  const j = world === 'jawia';
  for (let y = 4; y < 31; y++) {
    const cap = y < 8;
    const base = y > 26;
    const half = cap || base ? 7 : 5;
    for (let x = 8 - half; x < 8 + half; x++) {
      const t = (x - (8 - half)) / (half * 2 - 1);
      let c = t < 0.2 ? p.rock[5] : t < 0.45 ? p.rock[4] : t < 0.75 ? p.rock[3] : p.rock[2];
      if (cap && y === 7) c = p.rock[1];
      if (base && y === 27) c = p.rock[5];
      if (!cap && !base && (x === 6 || x === 9)) c = j ? p.rock[2] : p.growth[1]; // fluting / veins of light
      b.set(x, y, c);
    }
  }
  if (j) for (const [x, y] of [[4, 27], [5, 26], [3, 28], [10, 9], [11, 8]]) b.set(x, y, PAL.jawia.growth[2]);
  return b.outlined(INK.outline);
}

function bones(): PixelBuffer {
  const b = cell();
  const pile = fromAscii(art(13, [
    '....bbbb.....',
    '...bBBBBb....',
    '...BeBBeB..b.',
    '...bBBBBb.bB.',
    '.b..BmBm.bB..',
    'bBbb.....B.b.',
    '.bBBbbbbbBbB.',
    '..m.mBm.m.m..',
  ]), { b: INK.bone, B: INK.boneMid, m: INK.boneDark, e: INK.outline });
  b.blit(pile, 1, 23);
  return b;
}


// The dead of the stronghold, as Nawia remembers them: a woman, a man, a child.
const SOUL_PAL: Record<string, Color> = { S: INK.soul[3], s: INK.soul[2], W: INK.soul[4], d: INK.soul[1], e: INK.soul[0] };
const SOULS = [
  art(12, [
    '....SSSS....',
    '...SWWSSs...',
    '..SSWSSSss..',
    '..SseSSess..',
    '..SSSSSSss..',
    '...SSSSss...',
    '..sSSSSSss..',
    '.sSSSSSSsss.',
    '.sSSsSSSsss.',
    '.sSSsSSssss.',
    '.sSSSSSssss.',
    'sSSSSSSsssss',
    'sSSSSSssssss',
    'sSSSSSssssss',
  ]),
  art(12, [
    '...SSSSSS...',
    '..SWWSSSss..',
    '..SSSSSSss..',
    '..SeSSeSss..',
    '..SSSSSSss..',
    '...SSSsss...',
    '.SSSSSSSsss.',
    'SSSWSSSSssss',
    'SSsSSSSSsdss',
    'SSsSSSSSsdss',
    '.ssSSSSsss..',
    '..SSSsSsss..',
    '..SSs.sSss..',
    '..SSs.sSss..',
  ]),
  art(10, [
    '..SSSSSS..',
    '.SWWSSSss.',
    '.SSSSSSss.',
    '.SeSSeSss.',
    '.SSSSSSss.',
    '..SSSSss..',
    '.SSSSSSss.',
    '.SSSSSSss.',
    '.SSSSSsss.',
    '..Ss..ss..',
  ]),
];

function soul(i: number): PixelBuffer {
  const b = cell();
  const rows = SOULS[i];
  b.blit(fromAscii(rows, SOUL_PAL), (16 - rows[0].length) >> 1, 29 - rows.length);
  // dissolve the feet: the dead do not quite touch the floor
  for (let y = 25; y < 30; y++) for (let x = 0; x < 16; x++) if (bayer(x, y) < (y - 24) / 6) b.set(x, y, 0);
  return b;
}

const SUN = [rgb(0xfff4b8), rgb(0xffcf6a), rgb(0xe08a2a), rgb(0x8a4a1c)];
const MOON = [rgb(0xf4ffff), rgb(0x9af4ff), rgb(0x3db6c6), rgb(0x1e6c8a)];

/** The turning stone: strike it and the sun posts and moon posts trade places. */
function switchStone(moon: boolean): PixelBuffer {
  const b = cell();
  const R = PAL.jawia.rock;
  const pedestal = fromAscii(art(12, [
    '..hhhhhhhh..',
    '.hllllllmmd.',
    '.dlmmmmmmdd.',
    '..dmmmmmmd..',
    '..dlmmmmdd..',
    '..dlmmmmdd..',
    '.dllmmmmmdd.',
    'dllmmmmmmmdd',
    'dddddddddddd',
  ]), { h: R[5], l: R[4], m: R[3], d: R[1] });
  b.blit(pedestal, 2, 22);
  const ramp = moon ? MOON : SUN;
  for (let y = 9; y < 24; y++)
    for (let x = 1; x < 15; x++) {
      const dx = x + 0.5 - 8;
      const dy = y + 0.5 - 16.5;
      const d = Math.hypot(dx, dy);
      if (d > 5.6) continue;
      const lit = (-dx - dy) / 5.6; // light from the upper left
      b.set(x, y, d > 4.6 && lit < 0 ? ramp[3] : lit > 0.75 ? ramp[0] : lit > -0.1 ? ramp[1] : ramp[2]);
    }
  if (moon) {
    // a crescent
    for (const [x, y] of [[9, 14], [10, 15], [10, 16], [10, 17], [9, 18], [8, 19]]) b.set(x, y, ramp[0]);
  } else {
    // a sun wheel
    for (const [x, y] of [[8, 14], [8, 19], [5, 16], [10, 17], [7, 16], [8, 16], [7, 17], [8, 17]]) b.set(x, y, ramp[3]);
  }
  return b.outlined(INK.outline);
}

/** A sun post or a moon post: a block of stone that is either in your way or flush with the floor. */
function post(moon: boolean, raised: boolean): PixelBuffer {
  const b = cell();
  const R = PAL.jawia.rock;
  const ramp = moon ? MOON : SUN;
  const mark = (cx: number, cy: number, c: Color): void => {
    if (moon) for (const [x, y] of [[0, -2], [1, -1], [1, 0], [1, 1], [0, 2], [-1, 2]]) b.set(cx + x, cy + y, c);
    else for (const [x, y] of [[0, -2], [0, 2], [-2, 0], [2, 0], [0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]]) b.set(cx + x, cy + y, c);
  };
  if (!raised) {
    // a socket in the floor with the sign still showing
    b.rect(1, 17, 14, 14, R[0]);
    b.rect(2, 18, 12, 12, R[1]);
    for (let x = 2; x < 14; x++) b.set(x, 29, R[2]);
    mark(8, 23, ramp[2]);
    return b;
  }
  for (let y = 15; y <= 30; y++)
    for (let x = 1; x <= 14; x++) b.set(x, y, x < 4 ? R[4] : x < 10 ? R[3] : R[2]);
  for (let x = 1; x <= 14; x++) { b.set(x, 21, R[1]); b.set(x, 26, R[1]); b.set(x, 30, R[1]); }
  // the top face carries the colour
  for (let y = 7; y <= 14; y++)
    for (let x = 1; x <= 14; x++) b.set(x, y, y === 7 || x === 1 ? ramp[0] : y === 14 || x === 14 ? ramp[2] : ramp[1]);
  mark(8, 10, ramp[3]);
  return b.outlined(INK.outline);
}

function heartPickup(): PixelBuffer {
  const b = cell();
  b.blit(fromAscii(HEART_ROWS, { o: INK.outline, h: INK.heart, H: INK.heartLight, d: INK.heartDark }), 4, 20);
  return b;
}

function objectSheet(): Sheet {
  const frames: (PixelBuffer | null)[] = [];
  for (const world of ['jawia', 'nawia'] as World[]) {
    const p = PAL[world];
    for (let f = 0; f < 4; f++) frames.push(brazier(p, f));
    for (let f = 0; f < 4; f++) frames.push(wallTorch(p, f));
  }
  frames.push(signStone(PAL.jawia, false), signStone(PAL.nawia, true), gate(false), gate(true), bell(0), bell(-1), bell(1), heartPickup());
  frames.push(urn('jawia'), urn('nawia'), idol('jawia'), idol('nawia'), pillar('jawia'), pillar('nawia'), bones(), null);
  frames.push(soul(0), soul(1), soul(2), switchStone(false), switchStone(true), null, null, null);
  frames.push(post(false, true), post(false, false), post(true, true), post(true, false));
  return grid('objects', OBJ.fw, OBJ.fh, OBJ.cols, frames);
}

// =============================================================== the great bell
// 48x48 cells: at rest, swung left, swung right. It stands on the middle of the bottom edge.

export const GREAT_BELL = { fw: 48, fh: 48, cols: 3 } as const;

function greatBell(tilt: number): PixelBuffer {
  const b = new PixelBuffer(48, 48);
  const w = PAL.jawia.wood;
  // the frame: two posts, a beam, two braces
  for (let y = 6; y < 47; y++)
    for (const x0 of [3, 40]) {
      b.set(x0, y, w[5]); b.set(x0 + 1, y, w[4]); b.set(x0 + 2, y, w[3]); b.set(x0 + 3, y, w[3]); b.set(x0 + 4, y, w[2]);
    }
  for (let x = 1; x < 47; x++) {
    b.set(x, 3, w[5]); b.set(x, 4, w[4]); b.set(x, 5, w[4]); b.set(x, 6, w[3]); b.set(x, 7, w[3]); b.set(x, 8, w[2]); b.set(x, 9, w[1]);
    if (x % 9 === 4) for (let y = 4; y < 9; y++) b.set(x, y, w[2]);
  }
  for (let i = 0; i < 7; i++) {
    b.set(8 + i, 16 - i, w[3]); b.set(8 + i, 17 - i, w[2]);
    b.set(39 - i, 16 - i, w[3]); b.set(39 - i, 17 - i, w[2]);
  }
  // the bell
  const bronze = [rgb(0xfff0b0), rgb(0xf6d47a), rgb(0xc8923e), rgb(0xa06e30), rgb(0x7f5526), rgb(0x4e3320)];
  const top = 12;
  const height = 27;
  for (let i = 0; i <= height; i++) {
    const t = i / height;
    const y = top + i;
    const cx = 24 + tilt * 3.2 * t;
    const hw = 4.2 + 6.4 * Math.pow(t, 0.8) + (t > 0.84 ? (t - 0.84) * 17 : 0);
    const band = Math.abs(t - 0.3) < 0.025 || Math.abs(t - 0.8) < 0.025 || i === height;
    for (let x = Math.floor(cx - hw); x <= Math.ceil(cx + hw - 1); x++) {
      const n = (x + 0.5 - cx) / hw;
      let c = n < -0.72 ? bronze[2] : n < -0.45 ? bronze[1] : n < 0.15 ? bronze[2] : n < 0.62 ? bronze[3] : bronze[4];
      if (n > -0.62 && n < -0.5 && t > 0.1 && t < 0.72) c = bronze[0];
      if (band) c = n < 0.15 ? bronze[3] : bronze[5];
      b.set(x, y, c);
    }
  }
  // carved signs between the bands: sun, moon, sun
  for (const [ox, moon] of [[-5, 0], [0, 1], [5, 0]] as [number, number][]) {
    const cx = Math.round(24 + tilt * 1.8 + ox);
    const cy = top + 15;
    if (moon) for (const [x, y] of [[0, -2], [1, -1], [1, 0], [1, 1], [0, 2]]) b.set(cx + x, cy + y, bronze[5]);
    else for (const [x, y] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) b.set(cx + x, cy + y, bronze[5]);
  }
  // crown and clapper
  b.rect(22, 10, 4, 3, bronze[4]);
  b.rect(23, 9, 2, 1, bronze[5]);
  const kx = Math.round(24 + tilt * 5.5);
  b.rect(kx - 1, top + height + 1, 3, 3, bronze[5]);
  b.set(kx, top + height + 1, bronze[3]);
  return b.outlined(INK.outline);
}

function greatBellSheet(): Sheet {
  return grid('greatbell', GREAT_BELL.fw, GREAT_BELL.fh, GREAT_BELL.cols, [greatBell(0), greatBell(-1), greatBell(1)]);
}

// =============================================================== sword slash
// 32x32 cells. Rows: right, down, left, up. 3 frames each. White: tinted at runtime.

export const SLASH = { fw: 32, fh: 32, cols: 3, RIGHT: 0, DOWN: 1, LEFT: 2, UP: 3 } as const;

/**
 * One frame of the arc the blade leaves behind. The sweep runs from angle `from` to angle `to`
 * (degrees, 0 = right, clockwise): the same quarter circle the sword itself travels.
 */
function slashFrame(f: number, from: number, to: number): PixelBuffer {
  const b = new PixelBuffer(32, 32);
  const R = 15;
  const span = Math.abs(to - from);
  const dir = Math.sign(to - from);
  // which part of the sweep each frame shows: the leading edge sits on the blade, the tail fades behind it
  const [w0, w1] = [[-0.6, 0.15], [-0.2, 0.7], [0.4, 1.06]][f];
  const hot = rgb(0xffffff);
  const pale = rgb(0xd6ecff);
  for (let y = 0; y < 32; y++)
    for (let x = 0; x < 32; x++) {
      const dx = x + 0.5 - 16;
      const dy = y + 0.5 - 16;
      const r = Math.hypot(dx, dy);
      if (r > R) continue;
      const a = (Math.atan2(dy, dx) * 180) / Math.PI;
      const d = ((((a - from + 540) % 360) + 360) % 360) - 180;
      const sweep = (d * dir) / span;
      if (sweep < w0 || sweep > w1) continue;
      const t = (sweep - w0) / (w1 - w0); // 0 = tail, 1 = leading edge
      const thick = f === 2 ? 1 + 2.4 * t : 1.2 + 5.4 * Math.pow(t, 1.4);
      if (r < R - thick) continue;
      const fade = f === 2 ? 0.78 : 0.36;
      if (t < fade && bayer(x, y) > t / fade) continue;
      b.set(x, y, r > R - 1.6 ? hot : mix(hot, pale, Math.min(1, (R - r) / thick)));
    }
  return b;
}

function slashSheet(): Sheet {
  // right: up -> right.  down: left -> down.  left: up -> left.  up: right -> up.
  const sweeps: [number, number][] = [[-90, 0], [180, 90], [-90, -180], [0, -90]];
  const frames: PixelBuffer[] = [];
  for (const [from, to] of sweeps) for (let f = 0; f < 3; f++) frames.push(slashFrame(f, from, to));
  return grid('slash', SLASH.fw, SLASH.fh, SLASH.cols, frames);
}

// =============================================================== particles + UI

export const PX = { fw: 8, fh: 8, cols: 8, DOT: 0, DOT2: 1, PLUS: 2, DIAMOND: 3, STREAK: 4, RING: 5, SHARD: 6 } as const;

function particleSheet(): Sheet {
  const W: Record<string, Color> = { '#': rgb(0xffffff), '+': rgb(0xffffff, 150), '-': rgb(0xffffff, 70) };
  const f = (rows: string[]): PixelBuffer => fromAscii(rows, W, 8, 8);
  return grid('px', PX.fw, PX.fh, PX.cols, [
    f(['........', '........', '........', '...#....']),
    f(['........', '........', '...##...', '...##...']),
    f(['........', '........', '...+....', '..+#+...', '...+....']),
    f(['........', '...-....', '..-+-...', '.-+#+-..', '..-+-...', '...-....']),
    f(['........', '........', '........', '.-+##...']),
    f(['..+++...', '.+...+..', '+.....+.', '+.....+.', '+.....+.', '.+...+..', '..+++...']),
    f(['........', '........', '..##....', '..###...', '...#....']),
  ]);
}

export const UI = { fw: 16, fh: 16, cols: 8, HEART: 0, HEART_HALF: 1, HEART_EMPTY: 2, STONE_J: 3, STONE_N: 4 } as const;

const HEART_ROWS = art(8, [
  '.oo..oo.',
  'oHhoohho',
  'ohhhhhho',
  'ohhhhhdo',
  '.ohhhdo.',
  '..ohdo..',
  '...oo...',
]);

function uiSheet(): Sheet {
  const full = fromAscii(HEART_ROWS, { o: INK.outline, h: INK.heart, H: INK.heartLight, d: INK.heartDark }, 16, 16);
  const empty = fromAscii(HEART_ROWS, { o: INK.outline, h: INK.heartEmpty, H: INK.heartEmpty, d: INK.heartEmpty }, 16, 16);
  const half = empty.clone();
  for (let y = 0; y < 8; y++) for (let x = 0; x < 4; x++) half.set(x, y, full.get(x, y));
  // the "kurzy bóg": a river stone with a hole. Through the hole you see the other side.
  const stone = (world: World): PixelBuffer => {
    const here = PAL[world];
    const there = PAL[world === 'jawia' ? 'nawia' : 'jawia'];
    return fromAscii(
      [
        '....oooooo......',
        '..oollllmmoo....',
        '.olllmmmmmmmo...',
        '.ollmmoooommdo..',
        'ollmmoaAAaommdo.',
        'olmmoaAAAAaomdo.',
        'olmmoaAAAAaomdo.',
        'ommmoaaAAaaomdo.',
        'ommmmoaaaaommdo.',
        '.ommmmoooomddo..',
        '.odmmmmmmmdddo..',
        '..ooddddddddo...',
        '....oooooooo....',
      ],
      { o: INK.outline, l: here.rock[5], m: here.rock[3], d: here.rock[1], a: there.accentSoft, A: there.accent },
      16, 16,
    );
  };
  return grid('ui', UI.fw, UI.fh, UI.cols, [full, half, empty, stone('jawia'), stone('nawia')]);
}

// =============================================================== soft things: fog + glow

/** Tileable drifting mist: long thin wisps, 3 alpha levels, white (tinted at runtime). */
export function makeFog(w = 256, h = 128): PixelBuffer {
  const b = new PixelBuffer(w, h);
  const TAU = Math.PI * 2;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const u = x / w;
      const v = y / h;
      let n = 0;
      n += Math.sin(TAU * (v * 3 + 0.3 * Math.sin(TAU * u + 1)) + 0.6) * 0.42;
      n += Math.sin(TAU * (v * 5 - u + 0.22 * Math.sin(TAU * u * 2)) + 2.2) * 0.3;
      n += Math.sin(TAU * (u * 2 + v) + 2.1) * Math.sin(TAU * (v * 2 - u * 3) + 0.6) * 0.3;
      n += Math.sin(TAU * (u * 5 + v * 7) + 4.2) * 0.08;
      const d = (bayer(x, y) - 0.5) * 0.2;
      const a = n + d > 0.74 ? 100 : n + d > 0.52 ? 58 : n + d > 0.32 ? 24 : 0;
      if (a) b.set(x, y, rgb(0xffffff, a));
    }
  return b;
}

/** Small dithered glow used on flames and souls (additive). */
export function makeGlow(size = 48): PixelBuffer {
  const b = new PixelBuffer(size, size);
  const c = size / 2;
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x + 0.5 - c, y + 0.5 - c) / c;
      if (d >= 1) continue;
      const f = (1 - d) * (1 - d);
      const q = Math.floor(f * 5 + bayer(x, y)) / 5;
      if (q > 0) b.set(x, y, rgb(0xffffff, Math.round(q * 150)));
    }
  return b;
}

export function makeSheets(): Sheet[] {
  return [...makeActorSheets(), objectSheet(), surfacePropSheet(), greatBellSheet(), slashSheet(), particleSheet(), uiSheet()];
}
