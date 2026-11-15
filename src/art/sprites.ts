// Sprite sheets, drawn in code. Every sheet is a fixed grid (fw x fh cells):
// that grid is the contract for real art (see docs/ART.md).
//
// The hero is assembled from parts (body, legs, shield, sword) so every pose stays consistent
// and new poses (a bow, later) are a few lines, not a redraw.

import { type World } from '../config.ts';
import { PixelBuffer, bayer, fromAscii, mix, rgb, withAlpha, type Color } from '../core/PixelBuffer.ts';
import { INK, PAL, type WorldPalette } from './palette.ts';

export interface Sheet {
  key: string;
  buf: PixelBuffer;
  fw: number;
  fh: number;
}

function grid(key: string, fw: number, fh: number, cols: number, frames: (PixelBuffer | null)[]): Sheet {
  const rows = Math.ceil(frames.length / cols);
  const buf = new PixelBuffer(cols * fw, rows * fh);
  frames.forEach((f, i) => {
    if (f) buf.copy(f, (i % cols) * fw, Math.floor(i / cols) * fh, 0, 0, Math.min(fw, f.w), Math.min(fh, f.h));
  });
  return { key, buf, fw, fh };
}

/** ASCII art with a width check: a typo in a row should fail loudly, not draw a crooked sprite. */
function art(width: number, rows: string[]): string[] {
  rows.forEach((r, i) => {
    if (r.length !== width) throw new Error(`sprite row ${i} is ${r.length} wide, expected ${width}: "${r}"`);
  });
  return rows;
}

// =============================================================== the hero
// 32x32 cells. Rows: facing down, up, side (right; left is a flip).
// Columns: stand, walk A, walk B, attack 0-2, guard (shield up), spare.

export const HERO = {
  fw: 32, fh: 32, cols: 8,
  STAND: 0, WALK_A: 1, WALK_B: 2, ATK0: 3, ATK1: 4, ATK2: 5, GUARD: 6,
  DOWN: 0, UP: 1, SIDE: 2,
  /** Row of the cell where the soles are: the sprite's origin sits just below it. */
  FEET: 30,
} as const;

const HP: Record<string, Color> = {
  o: INK.outline,
  h: INK.hair, H: INK.hairDark, l: INK.hairLight,
  s: INK.skin, S: INK.skinDark, e: INK.eye,
  r: INK.band, R: INK.bandDark,
  t: INK.tunic, T: INK.tunicDark, U: INK.tunicDeep,
  c: INK.cloak, C: INK.cloakDark, k: INK.cloakLight,
  b: INK.belt, y: INK.buckle,
  p: INK.trousers, P: INK.trousersDark,
  n: INK.boot, N: INK.bootDark,
};

const BODY = {
  down: art(16, [
    '....hhhhhhhh....',
    '...hhlhhhhhhh...',
    '..hhllhhhhhhhh..',
    '..hrrrrrrrrrrh..',
    '..hhsssssssshh..',
    '..hssessssessh..',
    '..HssessssessH..',
    '...sssSSSSsss...',
    '....SssssssS....',
    '..kcttrrrrttck..',
    '.ccTttttttttTcc.',
    '.ccTttttttttTcc.',
    '.sstbbbyybbbtss.',
    '...tttttttttt...',
    '...trtrttrtrt...',
  ]),
  up: art(16, [
    '....hhhhhhhh....',
    '...hhhhhhhhhh...',
    '..hhhhhhhhhhhh..',
    '..hrrrrrrrrrrh..',
    '..hhhhhhhhhhhh..',
    '..hHhhhhhhhhHh..',
    '..HHhhhhhhhhHH..',
    '...HHhhhhhhHH...',
    '....sHHHHHHs....',
    '..kkkkkkkkkkkk..',
    '.cckccccccccCcc.',
    '.cccccccccccCCc.',
    '.sccccccccccCCs.',
    '...cccccccCCC...',
    '...cCccCccCcC...',
  ]),
  side: art(16, [
    '.....hhhhhhh....',
    '....hhhhhhhhh...',
    '...hhhhhhhhlhh..',
    '.rrrhrrrrrrrrr..',
    '..R.hhhhssssss..',
    '....hhhsssses...',
    '....Hhhssssess..',
    '....HHhsssssS...',
    '.....HhSssss....',
    '...cckttttttt...',
    '..ccckttttttt...',
    '..cccCtttttts...',
    '..cccCtbbbyb....',
    '...ccCtttttt....',
    '...cCCtrtrtt....',
  ]),
};

const LEGS = {
  downStand: art(16, ['....ppp..ppp....', '....ppp..ppp....', '....nnn..nnn....', '...Nnnn..nnnN...']),
  downA: art(16, ['....ppp..ppp....', '....ppp..nnn....', '....nnn..NnN....', '...Nnnn.........']),
  downB: art(16, ['....ppp..ppp....', '....nnn..ppp....', '....NnN..nnn....', '.........nnnN...']),
  sideStand: art(16, ['.....ppppp......', '.....ppppp......', '.....nnnn.......', '.....nnnnn......']),
  sideA: art(16, ['....ppp.ppp.....', '...ppp...ppp....', '...nn.....nn....', '..nnn.....nnn...']),
  sideB: art(16, ['.....ppppp......', '......pppp......', '......nnnn......', '......nnnnn.....']),
};

const SP: Record<string, Color> = {
  w: INK.shieldRim, W: INK.shieldRimDark,
  r: INK.shieldRed, R: INK.shieldRedDark, t: INK.shieldCream, T: INK.shieldCreamDark,
  i: INK.iron, I: INK.ironMid,
};
const SHIELD = {
  front: fromAscii(art(9, [
    '..wwwww..',
    '.wrrrttw.',
    'wrrrrtttw',
    'wrrriittW',
    'wrriIIttW',
    'wttiIIRRW',
    'wtttiiRRW',
    'wTTTrRRRW',
    '.wTTRRRW.',
    '..WWWWW..',
  ]), SP),
  side: fromAscii(art(5, ['.www.', 'wrrtw', 'wrrtW', 'wrriW', 'wriIW', 'wtiIW', 'wttRW', 'wTTRW', 'wTRRW', '.WWW.']), SP),
  back: fromAscii(art(3, ['.w.', 'wrW', 'wrW', 'wrW', 'wtW', 'wtW', 'wRW', 'wRW', '.W.']), SP),
};

/** A short straight sword from the hand outwards. Angle in degrees, clockwise, 0 = right. */
function drawSword(b: PixelBuffer, hx: number, hy: number, angle: number, len = 10): void {
  const a = (angle * Math.PI) / 180;
  const dx = Math.cos(a);
  const dy = Math.sin(a);
  const at = (t: number, side = 0): [number, number] => [Math.round(hx + dx * t - dy * side), Math.round(hy + dy * t + dx * side)];
  // pommel: the hag stone, a speck of the other side's light
  b.set(...at(-2), rgb(0x9af4ff));
  b.set(...at(-1), INK.belt);
  b.set(...at(0), INK.belt);
  for (const s of [-1.2, 0, 1.2]) b.set(...at(1, s), s === 0 ? INK.bronze : INK.bronzeDark);
  for (let t = 2; t <= len; t += 0.5) {
    b.set(...at(t), t > len - 1.5 ? INK.steel : INK.steelMid);
    if (t < len - 1.5) b.set(...at(t, 1), INK.steel);
  }
}

type Dir3 = 'down' | 'up' | 'side';
type Pose = 'stand' | 'walkA' | 'walkB' | 'atk0' | 'atk1' | 'atk2' | 'guard';

const BX = 8; // where the 16px-wide body sits in the 32px cell
const BY = HERO.FEET - 1 - 19; // 15 rows of body + 4 rows of legs, soles on row FEET-1

function heroFrame(dir: Dir3, pose: Pose): PixelBuffer {
  const b = new PixelBuffer(32, 32);
  const walking = pose === 'walkA' || pose === 'walkB';
  const attacking = pose === 'atk0' || pose === 'atk1' || pose === 'atk2';
  // the body dips on contact frames, crouches behind the shield, leans into a strike
  const dy = walking || pose === 'guard' || pose === 'atk1' ? 1 : 0;
  let dx = 0;
  if (dir === 'side' && pose === 'atk1') dx = 2;
  if (dir === 'side' && pose === 'atk2') dx = 1;
  const lunge = pose === 'atk1' ? 1 : 0;

  const legs =
    dir === 'side'
      ? pose === 'walkA' || attacking ? LEGS.sideA : pose === 'walkB' ? LEGS.sideB : LEGS.sideStand
      : pose === 'walkA' || pose === 'atk1' ? LEGS.downA : pose === 'walkB' ? LEGS.downB : LEGS.downStand;

  const x0 = BX + dx;
  const y0 = BY + dy + (dir === 'down' ? lunge : dir === 'up' ? -lunge : 0);
  const body = (): void => {
    b.blit(fromAscii(legs, HP), BX + (dir === 'side' ? dx : 0), BY + 15);
    b.blit(fromAscii(BODY[dir], HP), x0, y0);
  };
  const swing = pose === 'walkA' ? 1 : pose === 'walkB' ? -1 : 0; // arms swing a little as he walks

  if (dir === 'down') {
    body();
    const guard = pose === 'guard';
    b.blit(SHIELD.front, guard ? x0 + 4 : x0 + 9, guard ? y0 + 9 : y0 + 7 + swing);
    if (pose === 'atk0') drawSword(b, x0 + 13, y0 + 13, 20);
    else if (pose === 'atk1') drawSword(b, x0 + 8, y0 + 15, 90);
    else if (pose === 'atk2') drawSword(b, x0 + 2, y0 + 13, 160);
    else drawSword(b, x0 + 1, y0 + 12 - swing, guard ? -100 : -122, 9);
  } else if (dir === 'up') {
    // seen from behind: his gear is on the far side of him
    const guard = pose === 'guard';
    if (pose === 'atk0') drawSword(b, x0 + 2, y0 + 9, 200);
    else if (pose === 'atk1') drawSword(b, x0 + 8, y0 + 4, 270);
    else if (pose === 'atk2') drawSword(b, x0 + 13, y0 + 9, 340);
    else drawSword(b, x0 + 14, y0 + 12 + swing, -62, 9);
    if (guard) b.blit(SHIELD.front, x0 + 4, y0 + 1);
    body();
    if (!guard) b.blit(SHIELD.back, x0 - 1, y0 + 8 - swing);
  } else {
    const guard = pose === 'guard';
    if (!attacking && !guard) drawSword(b, x0 + 5, y0 + 12 + swing, -138, 9);
    body();
    if (pose === 'atk0') drawSword(b, x0 + 8, y0 + 7, -105);
    else if (pose === 'atk1') drawSword(b, x0 + 12, y0 + 11, 0);
    else if (pose === 'atk2') drawSword(b, x0 + 11, y0 + 13, 52);
    else if (guard) drawSword(b, x0 + 4, y0 + 12, -160, 8);
    b.blit(SHIELD.side, guard ? x0 + 12 : attacking ? x0 + 6 : x0 + 10, guard ? y0 + 6 : y0 + 8 - swing);
  }
  return b.outlined(INK.outline);
}

/** The hero seen from behind, standing: used as a silhouette on the title picture. */
export const heroFromBehind = (): PixelBuffer => heroFrame('up', 'stand');

function heroSheet(): Sheet {
  const poses: (Pose | null)[] = ['stand', 'walkA', 'walkB', 'atk0', 'atk1', 'atk2', 'guard', null];
  const frames: (PixelBuffer | null)[] = [];
  for (const dir of ['down', 'up', 'side'] as Dir3[]) for (const p of poses) frames.push(p ? heroFrame(dir, p) : null);
  return grid('hero', HERO.fw, HERO.fh, HERO.cols, frames);
}

// =============================================================== enemies
// 24x24 cells. Row 0: utopiec (3 frames), row 1: zjawa (3 frames).

export const MOB = { fw: 24, fh: 24, cols: 4, UTOPIEC: 0, ZJAWA: 4 } as const;

const UP_: Record<string, Color> = {
  g: rgb(0x3d6f62), G: rgb(0x27504a), L: rgb(0x66a084), b: rgb(0x86b48c), B: rgb(0x5c9078),
  w: rgb(0x1c3528), W: rgb(0x315c3a),
  y: rgb(0xf4f0a0), p: rgb(0x2a1420), m: rgb(0x10181e), t: rgb(0xe6dfc8), d: rgb(0x5ea89c),
};
const UTOPIEC = [
  art(20, [
    '......wWww.wWw......',
    '....wWWwWWwWWWw.....',
    '...wWwgggggggWWw....',
    '..wWgggLLLgggggWw...',
    '..wgggLLggggggggw...',
    '..WgyyyggggggyyyW...',
    '..wgypyggggggypyw...',
    '..WggggGGGGGGgggW...',
    '..wggmtmtmmtmtggw...',
    '..WGggmmmmmmmmgGW...',
    '.ggGGgggggggggGGgg..',
    'gLgGgBbbbbbbbBgGgLg.',
    'gg.GgbbbbbbbbbgG.gg.',
    'gG.GggBbbbbbBggG.Gg.',
    'dG..GggggggggggG.Gd.',
    '....GgGG....GGgG....',
    '...GggG......GggG...',
    '...GGGG......GGGG...',
  ]),
  art(20, [
    '....................',
    '......wWww.wWw......',
    '....wWWwWWwWWWw.....',
    '...wWwgggggggWWw....',
    '..wWgggLLLgggggWw...',
    '..WgyyyggggggyyyW...',
    '..wgypyggggggypyw...',
    '..WggggGGGGGGgggW...',
    '..wggmtmtmmtmtggw...',
    '.gWGggmmmmmmmmgGWg..',
    'gLGGGgggggggggGGGLg.',
    'gg.GgBbbbbbbbBgG.gg.',
    'gG.GgbbbbbbbbbgG.Gg.',
    'G..GggBbbbbbBggG..G.',
    'd...GggggggggggG..d.',
    '....GgGG....GGgG....',
    '...GggG......GggG...',
    '..GGGGG......GGGGG..',
  ]),
  art(20, [
    '......wWww.wWw......',
    '....wWWwWWwWWWw.....',
    '...wWwgggggggWWw....',
    '..wWgggLLLgggggWw...',
    'g.wgggLLggggggggw.g.',
    'gLWgyyyggggggyyyWLg.',
    'ggwgypyggggggypywgg.',
    '.GWggggGGGGGGgggWG..',
    '.GwggmttmmmmttggwG..',
    '..WGggmmmmmmmmgGW...',
    '...GGgggggggggGG....',
    '...GgBbbbbbbbBgG....',
    '...GgbbbbbbbbbgG....',
    '...GggBbbbbbBggG....',
    '....GggggggggggG....',
    '....GgGG....GGgG....',
    '...GggG......GggG...',
    '...GGGG......GGGG...',
  ]),
];

const ZP: Record<string, Color> = {
  W: rgb(0xf2f6ff), w: rgb(0xb9c6f2), h: rgb(0x8f9ae2), v: INK.soul[2], V: INK.soul[1],
  e: rgb(0x220c38), m: INK.soul[3],
};
const ZJAWA = [
  art(18, [
    '.......hhhh.......',
    '.....hhWWWWhh.....',
    '....hWWWWWWWWh....',
    '...hhWWWWWWWWhh...',
    '...hWeeWWWWeeWh...',
    '...hWemWWWWmeWh...',
    '..hhWWWWWWWWWWhh..',
    '..h.wWWWeeWWWw.h..',
    '.hh.wWWWeeWWWw.hh.',
    '.h..wWWWWWWWWw..h.',
    '...wwWWWWWWWWww...',
    '..wWWwWWWWWWwWWw..',
    '.wWw.wWWWWWWw.wWw.',
    '.vw..wWWWWWWw..wv.',
    '.....wWWWWWWw.....',
    '.....vwWWWWwv.....',
    '......vwWWwv......',
    '......v.wWv.......',
    '........vw........',
    '........v.........',
  ]),
  art(18, [
    '.......hhhh.......',
    '.....hhWWWWhh.....',
    '....hWWWWWWWWh....',
    '...hhWWWWWWWWhh...',
    '...hWeeWWWWeeWh...',
    '...hWemWWWWmeWh...',
    '..hhWWWWWWWWWWhh..',
    '.hh.wWWWeeWWWw.hh.',
    '.h..wWWWWWWWWw..h.',
    '....wWWWWWWWWw....',
    '..wwwWWWWWWWWwww..',
    '.wWWwwWWWWWWwwWWw.',
    '.vw..wWWWWWWw..wv.',
    '.....wWWWWWWw.....',
    '.....wWWWWWWwv....',
    '......wWWWWwv.....',
    '.......wWWwv......',
    '.......vwWv.......',
    '.........wv.......',
    '..........v.......',
  ]),
  art(18, [
    '.......hhhh.......',
    '.....hhWWWWhh.....',
    '....hWWWWWWWWh....',
    '...hhWWWWWWWWhh...',
    '...hWeeWWWWeeWh...',
    '...hWmeWWWWemWh...',
    '..hhWWWWWWWWWWhh..',
    '..h.wWWeeeeWWw.h..',
    '.hh.wWWeeeeWWw.hh.',
    'wW..wWWWWWWWWw..Ww',
    'vWwwwWWWWWWWWwwwWv',
    '.vwWWwWWWWWWwWWwv.',
    '.....wWWWWWWw.....',
    '.....wWWWWWWw.....',
    '....vwWWWWWWw.....',
    '.....vwWWWWw......',
    '......vwWWw.......',
    '.......vWwv.......',
    '.......vw.........',
    '.......v..........',
  ]),
];

function mobFrame(rows: string[], pal: Record<string, Color>, outline: Color, w: number, bottom: number): PixelBuffer {
  const b = new PixelBuffer(24, 24);
  b.blit(fromAscii(rows, pal), Math.floor((24 - w) / 2), bottom - rows.length);
  return b.outlined(outline);
}

function mobSheet(): Sheet {
  const ghost = withAlpha(INK.soul[0], 200);
  return grid('mobs', MOB.fw, MOB.fh, MOB.cols, [
    ...UTOPIEC.map((f) => mobFrame(f, UP_, INK.outline, 20, 22)), null,
    ...ZJAWA.map((f) => mobFrame(f, ZP, ghost, 18, 22)), null,
  ]);
}

// =============================================================== objects
// 16x32 cells, 8 per row, everything stands on the bottom edge of its cell.
// Row 0: Jawia  - brazier x4, wall torch x4
// Row 1: Nawia  - brazier x4, wall torch x4
// Row 2: sign (J), sign (N), gate, gate open, bell (rest, left, right), heart pickup
// Row 3: urn (J), urn (N), idol (J), idol (N), pillar (J), pillar (N), bones, spare
// Row 4: souls x3

export const OBJ = {
  fw: 16, fh: 32, cols: 8,
  BRAZIER: 0, TORCH: 4, ROW_NAWIA: 8,
  SIGN_J: 16, SIGN_N: 17, GATE: 18, GATE_OPEN: 19, BELL: 20, BELL_L: 21, BELL_R: 22, HEART: 23,
  URN_J: 24, URN_N: 25, IDOL_J: 26, IDOL_N: 27, PILLAR_J: 28, PILLAR_N: 29, BONES: 30,
  SOUL: 32,
} as const;

const cell = (): PixelBuffer => new PixelBuffer(16, 32);

function flame(b: PixelBuffer, p: WorldPalette, cx: number, base: number, height: number, width: number, f: number): void {
  for (let i = 0; i < height; i++) {
    const t = i / (height - 1); // 0 at the base, 1 at the tip
    const sway = Math.sin(f * (Math.PI / 2) + i * 0.9) * t * 1.7;
    const half = Math.max(0.5, (width / 2) * (1 - t * t) * (0.85 + 0.15 * Math.sin(f * 1.7 + i)));
    const y = base - i;
    for (let x = Math.floor(cx + sway - half); x <= Math.ceil(cx + sway + half - 1); x++) {
      const d = Math.abs(x + 0.5 - (cx + sway)) / half;
      const c = d < 0.35 && t < 0.5 ? p.fire[0] : d < 0.7 && t < 0.78 ? p.fire[1] : t > 0.86 ? p.fire[3] : p.fire[2];
      b.set(x, y, c);
    }
  }
  const sx = Math.round(cx + Math.sin(f * 2.1) * 3);
  b.set(sx, base - height - 1 - (f % 2), f % 2 ? p.fire[2] : p.fire[1]);
}

function brazier(p: WorldPalette, f: number): PixelBuffer {
  const b = cell();
  const I = { l: INK.ironMid, m: INK.ironDark, d: INK.ironDeep, h: INK.iron };
  const bowl = fromAscii(art(16, [
    '..hllllllllllh..',
    '.hlmmmmmmmmmmld.',
    '.dlmmmmmmmmmmdd.',
    '..dmmmmmmmmmdd..',
    '...ddmmmmmddd...',
    '....d.dmmd.d....',
    '...d...dd...d...',
    '..dd...dd...dd..',
    '..d....dd....d..',
    '.dd...dddd...dd.',
  ]), I);
  b.blit(bowl, 0, 21);
  for (let x = 3; x < 13; x++) b.set(x, 21, x % 3 === f % 3 ? p.fire[1] : p.fire[2]);
  flame(b, p, 8, 20, 10, 9, f);
  return b.outlined(INK.outline);
}

function wallTorch(p: WorldPalette, f: number): PixelBuffer {
  const b = cell();
  const sconce = fromAscii(art(9, ['.dhhhhhd.', '..dmmmd..', '...dmd...', '...dmd...', '...dmd...', '....d....']), {
    h: INK.ironMid, m: INK.ironDark, d: INK.ironDeep,
  });
  b.blit(sconce, 4, 22);
  flame(b, p, 8.5, 21, 8, 6, f);
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

const SOULS = [
  art(12, [
    '....ssss....',
    '...sSSSSs...',
    '..sSSSSSSs..',
    '..sSeSSeSs..',
    '..sSSSSSSs..',
    '...sSSSSs...',
    '..ssSSSSss..',
    '.sSSSSSSSSs.',
    '.sSsSSSSsSs.',
    '.sS.sSSs.Ss.',
    '....sSSs....',
    '...sSSSSs...',
    '...sSSSSs...',
    '..sSSSSSSs..',
    '..sSSSSSSs..',
    '..sSSSSSSs..',
    '.sSSSSSSSSs.',
    '.sSSSSSSSSs.',
    '.sSsSSsSsSs.',
    '..s..ss..s..',
  ]),
  art(12, [
    '...sssss....',
    '..sSSSSSs...',
    '..sSSSSSs...',
    '..sSeSeSs...',
    '..sSSSSSs...',
    '...sSSSs....',
    '.ssSSSSSss..',
    'sSSSSSSSSSs.',
    'sSsSSSSSsSs.',
    'sSsSSSSSsSs.',
    'sS.sSSSs.Ss.',
    '...sSSSs....',
    '...sSSSs....',
    '...sS.Ss....',
    '...sS.Ss....',
    '...sS.Ss....',
    '...sS.Ss....',
    '..ssS.Sss...',
  ]),
  art(12, [
    '....ssss....',
    '...sSSSSs...',
    '...sSeeSs...',
    '...sSSSSs...',
    '....sSSs....',
    '...sSSSSs...',
    '..sSSSSSSs..',
    '..sSSSSSSs..',
    '...sSSSSs...',
    '...sSSSSs...',
    '...sSssSs...',
    '...ss..ss...',
  ]),
];

function soul(i: number): PixelBuffer {
  const b = cell();
  const rows = SOULS[i];
  b.blit(fromAscii(rows, { s: INK.soul[2], S: INK.soul[4], e: INK.soul[0] }), 2, 29 - rows.length);
  // dissolve the feet: the dead do not quite touch the floor
  for (let y = 25; y < 30; y++) for (let x = 0; x < 16; x++) if (bayer(x, y) < (y - 24) / 6) b.set(x, y, 0);
  return b;
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
  frames.push(soul(0), soul(1), soul(2));
  return grid('objects', OBJ.fw, OBJ.fh, OBJ.cols, frames);
}

// =============================================================== sword slash
// 32x32 cells. Rows: right, down, left, up. 3 frames each. White: tinted at runtime.

export const SLASH = { fw: 32, fh: 32, cols: 3, RIGHT: 0, DOWN: 1, LEFT: 2, UP: 3 } as const;

function slashFrame(f: number): PixelBuffer {
  const b = new PixelBuffer(32, 32);
  const R = 15;
  const deg = Math.PI / 180;
  const [a0, a1] = [[-84, -8], [-66, 58], [14, 84]][f].map((d) => d * deg);
  const hot = rgb(0xffffff);
  const pale = rgb(0xd6ecff);
  for (let y = 0; y < 32; y++)
    for (let x = 0; x < 32; x++) {
      const dx = x + 0.5 - 16;
      const dy = y + 0.5 - 16;
      const r = Math.hypot(dx, dy);
      const a = Math.atan2(dy, dx);
      if (a < a0 || a > a1 || r > R) continue;
      const t = (a - a0) / (a1 - a0); // 0 = tail, 1 = leading edge
      const thick = f === 2 ? 1 + 2.4 * t : 1.2 + 5.4 * Math.pow(t, 1.4);
      if (r < R - thick) continue;
      const fade = f === 2 ? 0.78 : 0.36;
      if (t < fade && bayer(x, y) > t / fade) continue;
      b.set(x, y, r > R - 1.6 ? hot : mix(hot, pale, Math.min(1, (R - r) / thick)));
    }
  return b;
}

function slashSheet(): Sheet {
  const frames: PixelBuffer[] = [];
  let cur = [0, 1, 2].map(slashFrame);
  for (let dir = 0; dir < 4; dir++) {
    frames.push(...cur);
    cur = cur.map((b) => b.rotateCW());
  }
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
  return [heroSheet(), mobSheet(), objectSheet(), slashSheet(), particleSheet(), uiSheet()];
}
