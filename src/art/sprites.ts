// Placeholder sprite sheets, drawn in code. Every sheet is a fixed grid (fw x fh cells):
// that grid is the contract for real art (see docs/ART.md).

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

// =============================================================== heroine
// 16x24 cells. Rows: down, up, side (facing right; left is a flip).
// Columns: stand, step A, step B, lunge (used while swinging).

export const HERO = { fw: 16, fh: 24, cols: 4, STAND: 0, STEP_A: 1, STEP_B: 2, LUNGE: 3, DOWN: 0, UP: 1, SIDE: 2 } as const;

const HP: Record<string, Color> = {
  o: INK.outline,
  k: INK.scarf, K: INK.scarfLight, j: INK.scarfDark,
  s: INK.skin, S: INK.skinDark,
  h: INK.hair, H: INK.hairDark,
  w: INK.blouse, W: INK.blouseDark,
  g: INK.bodice, G: INK.bodiceDark,
  r: INK.skirt, R: INK.skirtDark,
  b: INK.boot, e: INK.eye,
};

const HERO_DOWN = [
  '................',
  '......kKKk......',
  '....kKKkkkkk....',
  '...kKkkkkkkkj...',
  '...kkhhhhhhkj...',
  '...jhsssssshj...',
  '...jsessssesj...',
  '...jsessssesj...',
  '...jssssssssj...',
  '....jsSssSsj....',
  '.....jkkkkj.....',
  '...wwojkkjoww...',
  '..wwwggkkggwww..',
  '..sswgggggGwss..',
  '....oggggGGo....',
  '....rrrrrrrr....',
  '...rrrrrrrrRR...',
  '...rwrwrwrwrR...',
];
const HERO_UP = [
  '................',
  '......kKKk......',
  '....kKKkkkkk....',
  '...kKkkkkkkkj...',
  '...kkkkkkkkkj...',
  '...jkkkkkkkkj...',
  '...jkkkkkkkjj...',
  '...jjkkkkkkjj...',
  '...jjjkkkkjjj...',
  '....jjjkkjjj....',
  '.....jjhhjj.....',
  '...wwowhhwoww...',
  '..wwwgghHggwww..',
  '..sswgghHgGwss..',
  '....ogghHGGo....',
  '....rrrhHrrr....',
  '...rrrrkkrrRR...',
  '...rwrwrwrwrR...',
];
const HERO_SIDE = [
  '................',
  '.....kKKKk......',
  '...kKKkkkkkk....',
  '..kKkkkkkkkkk...',
  '..kkkkkkkkhhh...',
  '..jkkkkkkhssss..',
  '..jjkkkkkssess..',
  '..jjkkkkkssesss.',
  '..jjjkkkkssssS..',
  '..hjjjkkkjsss...',
  '..hhojjkkkjo....',
  '..Hhowwwwkko....',
  '...hhwwwwggo....',
  '...Howwsswgg....',
  '....owgssggo....',
  '....rrrrrrrr....',
  '...rrrrrrrrRR...',
  '...rwrwrwrwrR...',
];

const LEGS = {
  downStand: ['.....bb..bb.....', '.....bb..bb.....'],
  downA: ['.....bb..bb.....', '.....bb.........'],
  downB: ['.....bb..bb.....', '.........bb.....'],
  sideStand: ['......bbb.......', '......bbbb......'],
  sideA: ['....bbb..bb.....', '....bb...bbb....'],
  sideB: ['.....bb.bbb.....', '.....bbb.bbb....'],
};

function heroFrame(upper: string[], legs: string[], dx: number, dy: number): PixelBuffer {
  const b = new PixelBuffer(16, 24);
  b.blit(fromAscii(legs, HP), 0, 3 + 18);
  b.blit(fromAscii(upper, HP), dx, 3 + dy);
  return b.outlined(INK.outline);
}

function heroSheet(): Sheet {
  const frames = [
    heroFrame(HERO_DOWN, LEGS.downStand, 0, 0), heroFrame(HERO_DOWN, LEGS.downA, 0, 1),
    heroFrame(HERO_DOWN, LEGS.downB, 0, 1), heroFrame(HERO_DOWN, LEGS.downStand, 0, 1),
    heroFrame(HERO_UP, LEGS.downStand, 0, 0), heroFrame(HERO_UP, LEGS.downA, 0, 1),
    heroFrame(HERO_UP, LEGS.downB, 0, 1), heroFrame(HERO_UP, LEGS.downStand, 0, -1),
    heroFrame(HERO_SIDE, LEGS.sideStand, 0, 0), heroFrame(HERO_SIDE, LEGS.sideA, 0, 1),
    heroFrame(HERO_SIDE, LEGS.sideB, 0, 1), heroFrame(HERO_SIDE, LEGS.sideA, 1, 1),
  ];
  return grid('hero', HERO.fw, HERO.fh, HERO.cols, frames);
}

// =============================================================== enemies
// 16x24 cells. Row 0: utopiec (2 frames), row 1: zjawa (2 frames).

export const MOB = { fw: 16, fh: 24, cols: 4, UTOPIEC: 0, ZJAWA: 4 } as const;

const UTOPIEC = [
  '................',
  '....d..dd.d.....',
  '....dddddddd....',
  '...dgggggggLd...',
  '..dgggggggggLd..',
  '..dgyyggggyygd..',
  '..dgypggggypgd..',
  '..dggggggggggd..',
  '..dggmmmmmmggd..',
  '..dgggmggmgggd..',
  '.ggddggggggddgg.',
  '.gL.dggggggd.Lg.',
  '.gg.dggggggd.gg.',
  '.dd..dgggggd.dd.',
  '.....dgd.dgd....',
  '....ddd..ddd....',
];
const UTOPIEC_2 = [
  '................',
  '................',
  '....d..dd.d.....',
  '....dddddddd....',
  '...dgggggggLd...',
  '..dgggggggggLd..',
  '..dgyyggggyygd..',
  '..dgypggggypgd..',
  '..dggggggggggd..',
  '.gdggmmmmmmggdg.',
  'ggddggmggmggddgg',
  'gL.dggggggggd.Lg',
  'dd.dggggggggd.dd',
  '....dggggggd....',
  '....dgd..dgd....',
  '...ddd....ddd...',
];
const UP_: Record<string, Color> = {
  d: rgb(0x1f3b3a), g: rgb(0x3f6f5c), L: rgb(0x6c9c72), y: rgb(0xeeeaa4), p: rgb(0x1b1420), m: rgb(0x16262b),
};

const ZJAWA = [
  '......wwww......',
  '....wwWWWWww....',
  '...wWWWWWWWWw...',
  '...wWeeWWeeWw...',
  '...wWeeWWeeWw...',
  '...wWWWWWWWWw...',
  '...wWWWmmWWWw...',
  '..wwWWWmmWWWww..',
  '.wwWWWWWWWWWWww.',
  '.w.wWWWWWWWWw.w.',
  '...wWWWWWWWWw...',
  '....wWWWWWWw....',
  '....wWWWWWw.....',
  '.....wWWWw......',
  '......wWw.......',
  '.......w........',
];
const ZJAWA_2 = [
  '......wwww......',
  '....wwWWWWww....',
  '...wWWWWWWWWw...',
  '...wWeeWWeeWw...',
  '...wWeeWWeeWw...',
  '...wWWWWWWWWw...',
  '...wWWWmmWWWw...',
  '.wwwWWWmmWWWwww.',
  '.w.wWWWWWWWWw.w.',
  '...wWWWWWWWWw...',
  '...wWWWWWWWWw...',
  '....wWWWWWWw....',
  '.....wWWWWWw....',
  '......wWWWw.....',
  '.......wWw......',
  '........w.......',
];
const ZP: Record<string, Color> = { w: rgb(0x86b4ec), W: rgb(0xe2f4ff), e: rgb(0x1a1e42), m: rgb(0x33407a) };

function mobFrame(rows: string[], pal: Record<string, Color>, outline: Color | null, y: number): PixelBuffer {
  const b = new PixelBuffer(16, 24);
  b.blit(fromAscii(rows, pal), 0, y);
  return outline === null ? b : b.outlined(outline);
}

function mobSheet(): Sheet {
  return grid('mobs', MOB.fw, MOB.fh, MOB.cols, [
    mobFrame(UTOPIEC, UP_, INK.outline, 7), mobFrame(UTOPIEC_2, UP_, INK.outline, 7), null, null,
    mobFrame(ZJAWA, ZP, withAlpha(rgb(0x2a3470), 170), 4), mobFrame(ZJAWA_2, ZP, withAlpha(rgb(0x2a3470), 170), 5), null, null,
  ]);
}

// =============================================================== objects
// 16x24 cells, 8 per row.
// Row 0: Jawia  - brazier x4, wall torch x4
// Row 1: Nawia  - brazier x4, wall torch x4
// Row 2: sign (Jawia), sign (Nawia), gate closed, gate open, bell (rest, left, right), spare

export const OBJ = {
  fw: 16, fh: 24, cols: 8,
  BRAZIER: 0, TORCH: 4, ROW_NAWIA: 8,
  SIGN_J: 16, SIGN_N: 17, GATE: 18, GATE_OPEN: 19, BELL: 20, BELL_L: 21, BELL_R: 22,
} as const;

function flame(b: PixelBuffer, p: WorldPalette, cx: number, base: number, height: number, width: number, f: number): void {
  for (let i = 0; i < height; i++) {
    const t = i / (height - 1); // 0 at the base, 1 at the tip
    const sway = Math.sin(f * (Math.PI / 2) + i * 0.9) * t * 1.6;
    const half = Math.max(0.5, (width / 2) * (1 - t * t) * (0.85 + 0.15 * Math.sin(f * 1.7 + i)));
    const y = base - i;
    for (let x = Math.floor(cx + sway - half); x <= Math.ceil(cx + sway + half - 1); x++) {
      const d = Math.abs(x + 0.5 - (cx + sway)) / half;
      const c = d < 0.35 && t < 0.55 ? p.fire0 : d < 0.7 && t < 0.8 ? p.fire1 : t > 0.85 ? p.fire3 : p.fire2;
      b.set(x, y, c);
    }
  }
  // a spark that left the fire
  const sx = Math.round(cx + Math.sin(f * 2.1) * 3);
  b.set(sx, base - height - 1 - (f % 2), f % 2 ? p.fire2 : p.fire1);
}

function brazier(p: WorldPalette, f: number): PixelBuffer {
  const b = new PixelBuffer(16, 24);
  const bowl = fromAscii(
    [
      '..llllllllllll..',
      '.lmmmmmmmmmmmmd.',
      '.dmmmmmmmmmmmdd.',
      '..dmmmmmmmmmdd..',
      '...ddmmmmmddd...',
      '.....dmmmdd.....',
      '.....dmmmdd.....',
      '....dmmmmmdd....',
      '...dmmmmmmmdd...',
    ],
    { l: p.rockLight, m: p.rock, d: p.rockDark },
  );
  b.blit(bowl, 0, 14);
  // embers
  for (let x = 3; x < 13; x++) b.set(x, 14, x % 3 === f % 3 ? p.fire1 : p.fire2);
  flame(b, p, 8, 13, 9, 9, f);
  return b.outlined(p.outline);
}

function wallTorch(p: WorldPalette, f: number): PixelBuffer {
  const b = new PixelBuffer(16, 24);
  const sconce = fromAscii(
    ['..dllld..', '..dmmmd..', '...dmd...', '...dmd...', '....d....'],
    { l: p.rockLight, m: p.rock, d: p.rockEdge },
  );
  b.blit(sconce, 4, 14);
  flame(b, p, 8.5, 13, 7, 6, f);
  return b;
}

function signStone(p: WorldPalette, glow: boolean): PixelBuffer {
  const b = new PixelBuffer(16, 24);
  const carve = glow ? p.growthLight : p.rockEdge;
  const stone = fromAscii(
    [
      '.....llll.......',
      '...llmmmmmm.....',
      '..lmmmmmmmmmd...',
      '..lmcmcmmcmmd...',
      '.lmmmcmmcmcmmd..',
      '.lmmmmmmmmmmmd..',
      '.lmcmmcmcmmcmd..',
      '.lmmcmmcmmcmmd..',
      '.lmmmmmmmmmmmd..',
      '.lmmcmcmmcmmmd..',
      '.lmmmmmmmmmmdd..',
      '.lmmmmmmmmmmdd..',
      '.dmmmmmmmmmddd..',
      '..dddddddddddd..',
    ],
    { l: p.rockLight, m: p.rock, d: p.rockDark, c: carve },
  );
  b.blit(stone, 1, 9);
  const out = b.outlined(p.outline);
  if (glow) {
    // soft halo around the carvings
    for (let y = 0; y < 24; y++)
      for (let x = 0; x < 16; x++)
        if (b.get(x, y) === carve)
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const c = out.get(x + dx, y + dy);
            if (c !== carve && c !== 0) out.set(x + dx, y + dy, mix(c, p.growth, 0.45));
          }
  }
  return out;
}

function gate(p: WorldPalette, open: boolean): PixelBuffer {
  const b = new PixelBuffer(16, 24);
  const iron = rgb(0x2e3440);
  const ironLight = rgb(0x6e7b8c);
  const ironDark = rgb(0x171a22);
  const top = open ? 8 : 8;
  const bottom = open ? 11 : 23;
  for (let x = 0; x < 16; x++) {
    b.set(x, top, ironLight); b.set(x, top + 1, iron); b.set(x, top + 2, ironDark);
  }
  for (let k = 0; k < 4; k++) {
    const x = 1 + k * 4;
    for (let y = top + 2; y <= bottom; y++) {
      b.set(x, y, ironLight); b.set(x + 1, y, iron); b.set(x + 2, y, ironDark);
    }
    if (!open) { b.set(x, bottom, ironDark); b.set(x + 1, bottom, ironDark); }
  }
  if (!open) for (let x = 0; x < 16; x++) { b.set(x, 16, iron); b.set(x, 17, ironDark); }
  void p;
  return b;
}

function bell(p: WorldPalette, tilt: number): PixelBuffer {
  const b = new PixelBuffer(16, 24);
  // wooden frame
  const wood = PAL.jawia.plank, woodL = PAL.jawia.plankLight, woodD = PAL.jawia.plankEdge;
  for (let y = 2; y < 23; y++) {
    b.set(1, y, woodL); b.set(2, y, wood); b.set(13, y, woodL); b.set(14, y, wood);
  }
  for (let x = 0; x < 16; x++) { b.set(x, 1, woodL); b.set(x, 2, wood); b.set(x, 3, PAL.jawia.plankDark); }
  // bell body
  const bronze = fromAscii(
    [
      '...hh...',
      '..hmmd..',
      '.hmmmmd.',
      '.hmmmmd.',
      '.hmmmmd.',
      'hmmmmmmd',
      'hhmmmmdd',
      '.dddddd.',
    ],
    { h: rgb(0xf0c869), m: rgb(0xc08a3c), d: rgb(0x7d5326) },
  );
  b.blit(bronze, 4 + tilt, 5);
  b.set(7 + tilt, 4, woodD); b.set(8 + tilt, 4, woodD);
  // clapper lags behind the swing
  b.set(7 + tilt * 2, 13, rgb(0x3a2a22)); b.set(8 + tilt * 2, 13, rgb(0x3a2a22));
  void p;
  return b.outlined(INK.outline);
}

function objectSheet(): Sheet {
  const frames: PixelBuffer[] = [];
  for (const world of ['jawia', 'nawia'] as World[]) {
    const p = PAL[world];
    for (let f = 0; f < 4; f++) frames.push(brazier(p, f));
    for (let f = 0; f < 4; f++) frames.push(wallTorch(p, f));
  }
  frames.push(signStone(PAL.jawia, false), signStone(PAL.nawia, true));
  frames.push(gate(PAL.jawia, false), gate(PAL.jawia, true));
  frames.push(bell(PAL.jawia, 0), bell(PAL.jawia, -1), bell(PAL.jawia, 1));
  return grid('objects', OBJ.fw, OBJ.fh, OBJ.cols, frames);
}

// =============================================================== sword slash
// 32x32 cells. Rows: right, down, left, up. 3 frames each. White: tinted at runtime.

export const SLASH = { fw: 32, fh: 32, cols: 3, RIGHT: 0, DOWN: 1, LEFT: 2, UP: 3 } as const;

function slashFrame(f: number): PixelBuffer {
  const b = new PixelBuffer(32, 32);
  const R = 14.5;
  const deg = Math.PI / 180;
  const [a0, a1] = [[-80, -5], [-62, 58], [18, 82]][f].map((d) => d * deg);
  const white = rgb(0xffffff);
  const pale = rgb(0xd6ecff);
  for (let y = 0; y < 32; y++)
    for (let x = 0; x < 32; x++) {
      const dx = x + 0.5 - 16;
      const dy = y + 0.5 - 16;
      const r = Math.hypot(dx, dy);
      const a = Math.atan2(dy, dx);
      if (a < a0 || a > a1 || r > R) continue;
      const t = (a - a0) / (a1 - a0); // 0 = tail, 1 = leading edge
      const thick = f === 2 ? 1 + 2.5 * t : 1.2 + 5.2 * Math.pow(t, 1.4);
      if (r < R - thick) continue;
      const fade = f === 2 ? 0.75 : 0.34;
      if (t < fade && bayer(x, y) > t / fade) continue;
      b.set(x, y, r > R - 1.6 ? white : mix(white, pale, Math.min(1, (R - r) / thick)));
    }
  if (f < 2) {
    // the blade itself, at the leading edge of the swing
    const a = a1 - 0.05;
    for (let r = 5; r < 14; r += 0.5) {
      const x = Math.floor(16 + Math.cos(a) * r);
      const y = Math.floor(16 + Math.sin(a) * r);
      b.set(x, y, INK.steel);
      b.set(x, y + 1, INK.steelDark);
    }
  }
  return b;
}

function slashSheet(): Sheet {
  const frames: PixelBuffer[] = [];
  const base = [0, 1, 2].map(slashFrame);
  let cur = base;
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

export const UI = { fw: 16, fh: 16, cols: 8, HEART: 0, HEART_EMPTY: 1, STONE_J: 2, STONE_N: 3 } as const;

function uiSheet(): Sheet {
  const heart = [
    '.oo..oo.',
    'oHhoohho',
    'ohhhhhho',
    'ohhhhhdo',
    '.ohhhdo.',
    '..ohdo..',
    '...oo...',
  ];
  const full = fromAscii(heart, { o: INK.outline, h: INK.heart, H: INK.heartLight, d: INK.heartDark }, 16, 16);
  const empty = fromAscii(heart, { o: INK.outline, h: INK.heartEmpty, H: INK.heartEmpty, d: INK.heartEmpty }, 16, 16);
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
      { o: INK.outline, l: here.rockLight, m: here.rock, d: here.rockDark, a: there.accentSoft, A: there.accent },
      16, 16,
    );
  };
  return grid('ui', UI.fw, UI.fh, UI.cols, [full, empty, stone('jawia'), stone('nawia')]);
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
      // periodic sines, stretched sideways: cheap, seamless, and it reads as layers of mist
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

/** Small dithered glow used on flames (additive). */
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
