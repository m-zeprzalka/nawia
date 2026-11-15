// The monsters of the playground, in three size classes: one tile, one and a half, two. Nothing is taller than two tiles.
//
// Monsters on two legs are posed by the figure painter (rig.ts), which gives each of them three views and a walk.
// Animals are drawn by hand, in profile, frame by frame: a painter that does not know anatomy draws sausages.
// (People, the hero among them, are drawn by hand too: see dolls.ts.)
//
// Nothing here is used by the game yet. What is chosen in the playground moves into the game; the rest goes.

import { PixelBuffer, fromAscii, rgb, type Color } from '../core/PixelBuffer.ts';
import { hash2 } from '../core/rng.ts';
import { run, stroke, type Anchors, type Figure, type Ramp } from './rig.ts';
import { art } from './sheet.ts';

type Feature = (b: PixelBuffer, a: Anchors) => void;
const all = (...fs: (Feature | undefined)[]): Feature => (b, a) => {
  for (const f of fs) f?.(b, a);
};
const ramp = (a: number, b: number, c: number, d: number): Ramp => [rgb(a), rgb(b), rgb(c), rgb(d)];

const BLACK = ramp(0x121016, 0x2a2430, 0x423a48, 0x5a5262);
const WHITE = ramp(0x8c8a90, 0xc9c6c8, 0xe9e6e2, 0xffffff);
const STEEL = ramp(0x444e5c, 0x7e8c9c, 0xb4c0cc, 0xe8f0f6);

// ------------------------------------------------------------------ monsters on two legs (painted)

export interface Creature {
  id: string;
  /** what it is ("Strzyga A") and the short name of this reading of it ("jędza") */
  kind: { pl: string; en: string };
  name: { pl: string; en: string };
  /** a one-line note on the idea behind this reading */
  note: { pl: string; en: string };
  /** how tall it stands, in tiles: 1, 1.5 or 2 */
  tiles: 1 | 1.5 | 2;
  /** posed by the figure painter... */
  figure?: Figure;
  /** ...or drawn by hand: five frames (stand, then the walk), facing right */
  frames?: PixelBuffer[];
  /** ...or already in the game: first frame on the `mobs` sheet and how many frames it has */
  mob?: [number, number];
}

const ROT = ramp(0x243c38, 0x4a6e62, 0x789a86, 0xa6c2a4);
const SLIME = ramp(0x123238, 0x275c62, 0x469088, 0x86c8b4);
const WEED = ramp(0x0c1a18, 0x1a362c, 0x2a5a3e, 0x4a8a58);
const PALE = ramp(0x464460, 0x84809e, 0xb6b2cc, 0xe0def2);
const WINE = ramp(0x1a0c18, 0x381a2e, 0x582a42, 0x7a4058);
const SHROUD = ramp(0x443c7c, 0x8a82c6, 0xc6c0ec, 0xf2f0ff);
const BONE = ramp(0x665c4a, 0xb2a88c, 0xdfd6be, 0xfaf6e6);
const RUST = ramp(0x2c1a16, 0x5a3626, 0x86543a, 0xb07a52);
const BARK = ramp(0x1a120e, 0x3a2a1e, 0x5a442e, 0x7e6646);
const MOSS = ramp(0x16281a, 0x2c4a28, 0x487038, 0x6e9a4e);
const DEVIL = ramp(0x260e12, 0x521c26, 0x80323e, 0xae5658);
const FEATHER = ramp(0x1e1a22, 0x3c343e, 0x5e5460, 0x847a86);
const RAG = ramp(0x1c1a20, 0x34303a, 0x504a56, 0x6e6876);
const WHEAT = ramp(0x8a6a24, 0xc09a3c, 0xe2c460, 0xf6e294);

/** A cowl over a painted head: for things that have no face under it. */
const cowl = (c: Ramp): Feature => (b, a) => {
  const { hx0, hx1, hy0, hy1, view } = a;
  if (view === 'up') {
    for (let y = hy0 - 1; y <= hy1 + 1; y++) run(b, y, hx0 - (y > hy0 ? 1 : -1), hx1 + (y > hy0 ? 1 : -1), c, y === hy0 - 1 ? 1 : 0);
    return;
  }
  if (view === 'side') {
    for (let y = hy0 - 1; y <= hy1 + 1; y++) run(b, y, hx0 - 1, y <= hy0 + 1 ? hx1 - (y === hy0 - 1 ? 2 : 0) : hx0 + Math.round((hx1 - hx0) * 0.42), c, y === hy0 - 1 ? 1 : 0);
    return;
  }
  for (let y = hy0 - 1; y <= hy1 + 1; y++) {
    if (y <= hy0 + 1) run(b, y, hx0 - (y >= hy0 ? 1 : -1), hx1 + (y >= hy0 ? 1 : -1), c, y === hy0 - 1 ? 1 : 0);
    else { b.set(hx0 - 1, y, c[2]); b.set(hx0, y, c[1]); b.set(hx1, y, c[1]); b.set(hx1 + 1, y, c[0]); }
  }
};

/** A rusted helmet on a painted skull. */
const casque = (m: Ramp): Feature => (b, a) => {
  const { hx0, hx1, hy0, view } = a;
  const mid = (hx0 + hx1 + 1) >> 1;
  b.set(mid - 1, hy0 - 2, m[3]);
  run(b, hy0 - 1, hx0 + 2, hx1 - 2, m, 1);
  run(b, hy0, hx0, hx1, m);
  run(b, hy0 + 1, hx0, hx1, m, -1);
  for (let x = hx0; x <= hx1; x++) b.set(x, hy0 + 2, (x & 1) === 0 ? m[0] : m[1]);
  if (view === 'down') for (let y = hy0 + 3; y <= a.eyeY + 1; y++) b.set(mid - 1, y, m[2]);
  if (view === 'side') for (let y = hy0 + 3; y <= a.eyeY + 1; y++) b.set(hx1, y, m[2]);
};

const weeds: Feature = (b, a) => {
  for (let k = 0; k < 5; k++) {
    const x = a.tx0 - 1 + k * 3 + (a.view === 'side' ? 1 : 0);
    const len = 2 + (hash2(k, 5, 2) % 3);
    for (let i = 0; i < len; i++) b.set(x + (i > 1 ? (k & 1 ? 1 : -1) : 0), a.shoulderY + 1 + i, WEED[i % 2 ? 2 : 3]);
  }
  // water still running off it
  for (const h of a.hands) if ((a.frame + h[0]) % 2 === 0) b.set(h[0] + 1, h[1] + 3, rgb(0x86c8b4));
};

const fins: Feature = (b, a) => {
  const c = SLIME;
  if (a.view === 'side') { for (let i = 0; i < 3; i++) { b.set(a.hx0 - 1 - i, a.hy0 + 1 + i, c[2]); b.set(a.hx0 - i, a.hy0 + 2 + i, c[0]); } for (let i = 0; i < 4; i++) b.set(a.tx0 - 1, a.shoulderY + i, i % 2 ? c[3] : c[1]); return; }
  for (const s of [-1, 1]) {
    const x = s < 0 ? a.hx0 : a.hx1;
    for (let i = 0; i < 2; i++) { b.set(x + s * (i + 1), a.hy0 + 2 + i, c[s < 0 ? 3 : 1]); b.set(x + s * (i + 1), a.hy0 + 3 + i, c[0]); }
  }
};

/** Antlers, sized to fit over a head in a cell two tiles tall. */
const antlers = (c: Ramp): Feature => (b, a) => {
  const top = a.hy0;
  const mid = (a.hx0 + a.hx1 + 1) >> 1;
  for (const s of a.view === 'side' ? [1] : [-1, 1]) {
    const x0 = a.view === 'side' ? mid : mid + s * 2;
    // the beam, then its tines
    stroke(b, x0, top, x0 + s * 3, top - 3, c[2]);
    stroke(b, x0 + s * 3, top - 3, x0 + s * 4, top - 6, c[1]);
    stroke(b, x0 + s * 2, top - 2, x0 + s * 5, top - 2, c[1]);
    stroke(b, x0 + s * 3, top - 4, x0 + s * 6, top - 5, c[2]);
    b.set(x0 + s * 4, top - 7, c[3]);
    b.set(x0 + s * 6, top - 6, c[3]);
  }
};

const horns = (c: Ramp): Feature => (b, a) => {
  for (const s of a.view === 'side' ? [1] : [-1, 1]) {
    const x = (s < 0 ? a.hx0 : a.hx1) + (a.view === 'side' ? -3 : 0);
    b.set(x, a.hy0, c[1]); b.set(x + s, a.hy0 - 1, c[2]); b.set(x + s, a.hy0 - 2, c[2]); b.set(x, a.hy0 - 3, c[3]); b.set(x - s, a.hy0 - 4, c[3]);
  }
};

const tail = (c: Ramp): Feature => (b, a) => {
  if (a.view === 'down') return;
  const x0 = a.view === 'side' ? a.tx0 - 1 : a.cx;
  for (let i = 0; i < 7; i++) b.set(x0 - (a.view === 'side' ? Math.round(i * 0.8) : Math.round(Math.sin(i * 0.8 + a.frame) * 2)), a.waistY + 1 + i, c[i > 5 ? 3 : 1]);
};

/** One eye where two should be: Licho, misfortune itself. */
const oneEye: Feature = (b, a) => {
  if (a.view === 'up') return;
  const x = a.view === 'side' ? a.hx1 - 3 : a.cx - 2;
  const w = a.view === 'side' ? 3 : 4;
  for (let j = -1; j <= 1; j++) for (let i = 0; i < w; i++) b.set(x + i, a.eyeY + j, j === 0 && (i === 1 || i === 2) ? rgb(0xc8242c) : rgb(0xf4efe4));
  b.set(x + 1, a.eyeY, rgb(0x1a1423));
};

const owlFace: Feature = (b, a) => {
  const { hx0, hx1, hy0, view } = a;
  for (const s of view === 'side' ? [-1] : [-1, 1]) { const x = s < 0 ? hx0 : hx1; b.set(x, hy0 - 1, FEATHER[1]); b.set(x + s, hy0 - 2, FEATHER[2]); b.set(x + s, hy0 - 3, FEATHER[0]); }
  if (view === 'up') return;
  // not the round eyes of a bird in a picture book: two sockets, and a light at the bottom of each
  for (const x of view === 'side' ? [hx1 - 3] : [a.cx - 4, a.cx + 1]) {
    for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) b.set(x + i, a.eyeY - 1 + j, FEATHER[0]);
    b.set(x + 1, a.eyeY, rgb(0xffd24a));
    b.set(x + 1, a.eyeY + 1, rgb(0xc88a2a));
  }
  const bx = view === 'side' ? hx1 : a.cx - 1;
  b.set(bx, a.eyeY + 1, BONE[2]); b.set(bx, a.eyeY + 2, BONE[1]);
  if (view === 'down') for (let y = a.shoulderY + 2; y < a.waistY; y += 2) for (let x = a.tx0 + 1; x < a.tx1; x += 2) b.set(x + ((y >> 1) & 1), y, FEATHER[3]);
};

const sickle: Feature = (b, a) => {
  const hand = a.hands[a.hands.length - 1];
  if (!hand) return;
  const x = hand[0] + 2;
  const y = hand[1];
  for (let i = 0; i < 3; i++) b.set(x, y - i, BLACK[2]);
  for (const [dx, dy] of [[0, -3], [1, -4], [2, -5], [3, -5], [4, -4], [4, -3]]) b.set(x + dx, y + dy, STEEL[3]);
  b.set(x + 3, y - 4, STEEL[1]);
};

const wreath: Feature = (b, a) => {
  for (let x = a.hx0; x <= a.hx1; x += 2) { b.set(x, a.hy0 + 1, WHEAT[2]); b.set(x, a.hy0, WHEAT[3]); }
};

const rustySword: Feature = (b, a) => {
  const hand = a.hands[a.hands.length - 1];
  if (!hand || a.view === 'up') return;
  stroke(b, hand[0] + 1, hand[1] - 1, hand[0] + 5, hand[1] - 9, RUST[3]);
  stroke(b, hand[0] + 2, hand[1] - 1, hand[0] + 6, hand[1] - 9, RUST[1]);
  b.set(hand[0], hand[1] - 2, RUST[2]); b.set(hand[0] + 3, hand[1] - 1, RUST[2]);
};

const mossy: Feature = (b, a) => {
  for (let x = a.tx0 - 1; x <= a.tx1 + 1; x++) {
    const hs = hash2(x, a.view === 'up' ? 9 : 4, 6);
    if (hs % 3 === 0) continue;
    const len = 1 + (hs % 3);
    for (let i = 0; i < len; i++) b.set(x, a.shoulderY - 1 + i, MOSS[i === 0 ? 3 : 2 - (i % 2)]);
  }
  for (const h of a.hands) for (let i = 0; i < 2; i++) b.set(h[0] + 1, h[1] - 5 + i * 2, MOSS[2]);
};

/** The usual shape of something that stalks: one and a half tiles, a hung head, arms to the ground. */
const monster = (over: Partial<Figure>): Figure => ({
  w: 16, h: 24,
  head: { w: 10, h: 9 }, neck: 0, shoulder: 8, waist: 6, torsoH: 6, skirt: 0,
  arm: { w: 2, len: 8 }, leg: { w: 2, len: 5, gap: 2 }, bootH: 0,
  skin: PALE, hair: BLACK, top: PALE, bottom: RAG, boots: RAG, outline: rgb(0x0e0a14),
  hairStyle: 'none', face: 'hollow', eye: rgb(0xfff0a0), hands: 'claw', hunch: 2,
  ...over,
});

// ------------------------------------------------------------------ animals, drawn by hand
// In profile, facing right, in a cell 24 x 16 (one tile tall, one and a half long). Only what is inside the
// animal is drawn; the line round it is added afterwards.

/** Colours a drawing and puts a line round it. */
function inked(width: number, rows: string[], pal: Record<string, Color>, line: Color): PixelBuffer {
  return fromAscii(art(width, rows), pal).outlined(line);
}

/** Replaces the bottom rows of a drawing: one body, several ways of putting its feet down. */
const legs = (body: string[], feet: string[]): string[] => [...body.slice(0, body.length - feet.length - 1), ...feet, body[body.length - 1]];

// A wolf, stalking: lean, the waist tucked up behind a deep chest, a dark saddle, pale underneath, the tail down.
// d = dark fur, g = grey, l = the ruff, w = pale, e = eye, n = nose, x = what the blight grows on its back.
const WOLF = [
  '........................',
  '................d.g.....',
  '................d.gg....',
  '.........ddddddgggggg...',
  '.....dddddgggglggggeggn.',
  '..d.ggggggggggllggwwwww.',
  '.dg.ggggggggglwwwwwww...',
  '.dg.ggggwwwggww.........',
  '.dg.gggd...gwwd.........',
  '.dg.gggd...ggdd.........',
  '.dw.ggdd...ggdd.........',
  '.w..gg.dd..ggdd.........',
  '.....gg.dd.ggdd.........',
  '.....gg.dd.ggdd.........',
  '.....ggwdd.ggwdd........',
  '........................',
];
const WOLF_REACH = legs(WOLF, [
  '.dg.gggd...ggdd.........',
  '.dw.gg.dd.ddgg..........',
  '.w.gg..dd.dd.gg.........',
  '...gg..dd.dd..gg........',
  '..gg...dd..d...gg.......',
  '..ggw..ddd.....ggw......',
]);
const WOLF_GATHER = legs(WOLF, [
  '.dg.gggd...ggdd.........',
  '.dw.dgg....ggdd.........',
  '.w.dd.gg...gg.dd........',
  '...dd..gg..gg..dd.......',
  '...dd..gg..gg...d.......',
  '...ddd.ggw.ggw..........',
]);
/** The same wolf with the blight through its back. */
const blighted = (rows: string[]): string[] => [rows[0], '..........x..x..d.g.....', '.........xx.xx..d.gg....', '......xx.ddddddgggggg...', ...rows.slice(4)];

const WOLF_GREY: Record<string, Color> = { d: rgb(0x4a4854), g: rgb(0x7c7a88), l: rgb(0xa6a4b0), w: rgb(0xcfcbd0), e: rgb(0xf6d24a), n: rgb(0x1a1620) };
const WOLF_BLIGHT: Record<string, Color> = { d: rgb(0x2a1e3c), g: rgb(0x4a3a66), l: rgb(0x6c5a8e), w: rgb(0x8e7eae), e: rgb(0xff5ad8), n: rgb(0x0e0816), x: rgb(0xd070f0) };

// A boar: all shoulder, tapering to a small rear; the head low and long, a tusk, a crest of bristles; short legs.
// d D = hide (base, shade), l L = the head (base, shade), m M = bristles, e = eye, n = snout, t = tusk, h = hoof.
const BOAR = [
  '........................',
  '........................',
  '..........m.m.m.........',
  '.......ddMMMMMMMMdd.....',
  '.....ddddddMMMMdddddd...',
  '...ddddddddddddddddlll..',
  '..Ddddddddddddddddlelll.',
  '.mDDddddddddddddDDlllnn.',
  '..DDDddddddddddDDDlltnn.',
  '...DDDDddddddDDDDDLtL...',
  '....DDDDDDDDDDDDD.......',
  '....DDD.DD..DDD.DD......',
  '....DDD.DD..DDD.DD......',
  '....hhh.hh..hhh.hh......',
  '........................',
  '........................',
];
const BOAR_STEP = legs(BOAR.slice(0, 15), [
  '...DDD..DD...DDD..DD....',
  '...DDD..DD...DDD..DD....',
  '...hhh..hh...hhh..hh....',
]).concat([BOAR[15]]);
const BOAR_GATHER = legs(BOAR.slice(0, 15), [
  '.....DD.DD...DD.DD......',
  '.....DD.DD...DD.DD......',
  '.....hh.hh...hh.hh......',
]).concat([BOAR[15]]);
const BOAR_PAL: Record<string, Color> = {
  d: rgb(0x6a5248), D: rgb(0x46342e), l: rgb(0x846a5c), L: rgb(0x5a4238), m: rgb(0x241a1c), M: rgb(0x3a2c2c),
  e: rgb(0xe8342c), n: rgb(0xb88474), t: rgb(0xf6f1e6), h: rgb(0x1c1416),
};

// A viper on the move: a low S along the ground, the head lifted, the zigzag down its back.
// Its body is given column by column (the rows it fills), so a second frame is the same snake a moment later.
const VIPER_HEAD = [
  '................gggg....',
  '...............gzgegg...',
  '...............gyyyy....',
];
/** [top, bottom] of the body in columns 1 to 15 */
const VIPER_A: [number, number][] = [[13, 13], [11, 13], [10, 12], [10, 12], [10, 12], [11, 13], [12, 14], [12, 14], [12, 14], [11, 13], [11, 13], [10, 12], [9, 11], [8, 10], [7, 9]];
const VIPER_B: [number, number][] = [[11, 11], [11, 12], [12, 14], [12, 14], [12, 14], [11, 13], [10, 12], [10, 12], [10, 12], [11, 13], [11, 13], [10, 12], [9, 11], [8, 10], [7, 9]];
const VIPER_PAL: Record<string, Color> = { g: rgb(0x8c8650), z: rgb(0x2a2618), G: rgb(0x565030), y: rgb(0xcfc48a), e: rgb(0xf0b020), r: rgb(0xd8443c) };

function viper(spans: [number, number][], tongue: number): PixelBuffer {
  const b = new PixelBuffer(24, 16);
  spans.forEach(([top, bottom], i) => {
    const x = i + 1;
    for (let y = top; y <= bottom; y++) {
      // a dark zigzag over the two upper rows, the underside in shade
      const zig = (y === top && (x & 1) === 0) || (y === top + 1 && (x & 1) === 1);
      b.set(x, y, y === bottom && bottom > top ? VIPER_PAL.G : zig ? VIPER_PAL.z : VIPER_PAL.g);
    }
  });
  b.blit(fromAscii(art(24, VIPER_HEAD), VIPER_PAL), 0, 5);
  for (let i = 0; i < tongue; i++) b.set(21 + i, 6 + (i > 0 && tongue > 1 ? i - 1 : 0), VIPER_PAL.r);
  return b.outlined(rgb(0x16140e));
}

const cycle = (stand: PixelBuffer, a: PixelBuffer, b: PixelBuffer): PixelBuffer[] => [stand, a, b, a, b];

// ------------------------------------------------------------------ the bestiary

const wolfFrames = (pal: Record<string, Color>, line: number, grow: (rows: string[]) => string[] = (r) => r): PixelBuffer[] => {
  const [s, a, b] = [WOLF, WOLF_REACH, WOLF_GATHER].map((rows) => inked(24, grow(rows), pal, rgb(line)));
  return cycle(s, a, b);
};
const boarFrames = (): PixelBuffer[] => {
  const [s, a, b] = [BOAR, BOAR_STEP, BOAR_GATHER].map((rows) => inked(24, rows, BOAR_PAL, rgb(0x140e0e)));
  return cycle(s, a, b);
};
const viperFrames = (): PixelBuffer[] => {
  const a = viper(VIPER_A, 2);
  const b = viper(VIPER_B, 1);
  return [a, a, b, a, b];
};

/** `mobs` sheet frames of the two small things the game already has (see MOB in actors.ts). */
const MOB_OGNIK: [number, number] = [8, 4];
const MOB_MOROWNIK: [number, number] = [32, 2];

export const CREATURES: Creature[] = [
  // ---- one tile
  {
    id: 'ognik', tiles: 1, mob: MOB_OGNIK,
    kind: { pl: 'Ognik', en: 'Wisp' }, name: { pl: 'ognik', en: 'wisp' },
    note: { pl: 'błędny ogień nad bagnem; z gry, bez zmian', en: 'marsh fire; from the game, unchanged' },
  },
  {
    id: 'morownik', tiles: 1, mob: MOB_MOROWNIK,
    kind: { pl: 'Morownik', en: 'Blight bloom' }, name: { pl: 'morownik', en: 'blight bloom' },
    note: { pl: 'kwiat skazy; z gry, bez zmian', en: 'the flower of the blight; from the game, unchanged' },
  },
  {
    id: 'zmija', tiles: 1, frames: viperFrames(),
    kind: { pl: 'Żmija', en: 'Viper' }, name: { pl: 'żmija', en: 'viper' },
    note: { pl: 'pełznie esem po ziemi, łeb uniesiony; zygzak na grzbiecie', en: 'a low S along the ground, head lifted; a zigzag down its back' },
  },
  {
    id: 'wilk', tiles: 1, frames: wolfFrames(WOLF_GREY, 0x1a1620),
    kind: { pl: 'Wilk A', en: 'Wolf A' }, name: { pl: 'wilk szary', en: 'grey wolf' },
    note: { pl: 'skrada się: łeb niżej łopatek, ciemny grzbiet, jasny spód, ogon w dół', en: 'stalking: head below the shoulders, a dark saddle, pale underneath, tail down' },
  },
  {
    id: 'wilk-skazy', tiles: 1, frames: wolfFrames(WOLF_BLIGHT, 0x0e0816, blighted),
    kind: { pl: 'Wilk B', en: 'Wolf B' }, name: { pl: 'wilk skazy', en: 'blight wolf' },
    note: { pl: 'ten sam wilk, przez którego przerosła skaza: fiolet, kolce na grzbiecie, oko w kolorze Nawi', en: 'the same wolf with the blight grown through it: violet, spines on its back, an eye the colour of Nawia' },
  },
  {
    id: 'dzik', tiles: 1, frames: boarFrames(),
    kind: { pl: 'Dzik', en: 'Boar' }, name: { pl: 'dzik', en: 'boar' },
    note: { pl: 'sam kark: garb ze szczeciną, długi łeb nisko, szable, czerwone oko', en: 'all shoulder: a bristled hump, a long head carried low, tusks, a red eye' },
  },
  // ---- one and a half tiles
  {
    id: 'topielec', tiles: 1.5,
    kind: { pl: 'Utopiec A', en: 'Drowned one A' }, name: { pl: 'topielec', en: 'the corpse' },
    note: { pl: 'opuchnięty trup w wodorostach, ręce do ziemi', en: 'a bloated corpse in weeds, arms to the ground' },
    figure: monster({ w: 24, skin: ROT, top: ROT, shoulder: 10, waist: 11, torsoH: 7, leg: { w: 3, len: 4, gap: 0 }, arm: { w: 3, len: 8 }, hair: WEED, hairStyle: 'curtain', over: weeds }),
  },
  {
    id: 'wodnik', tiles: 1.5,
    kind: { pl: 'Utopiec B', en: 'Drowned one B' }, name: { pl: 'wodnik', en: 'the water-man' },
    note: { pl: 'chudy, śliski, płetwy zamiast uszu, oczy jak u ryby', en: 'thin, slick, fins for ears, the eyes of a fish' },
    figure: monster({ skin: SLIME, top: SLIME, bottom: SLIME, boots: SLIME, head: { w: 8, h: 9 }, shoulder: 7, waist: 5, arm: { w: 2, len: 9 }, leg: { w: 2, len: 6, gap: 0 }, eye: rgb(0xf4fff4), ribs: true, hunch: 1, over: fins }),
  },
  {
    id: 'jedza', tiles: 1.5,
    kind: { pl: 'Strzyga A', en: 'Strzyga A' }, name: { pl: 'jędza', en: 'the hag' },
    note: { pl: 'wychudła, zgarbiona, szpony do ziemi, włosy na twarzy', en: 'gaunt, bent, claws to the ground, hair over her face' },
    figure: monster({ head: { w: 9, h: 9 }, shoulder: 7, waist: 5, top: WINE, bottom: PALE, skirt: 4, trim: rgb(0x1a0c18), arm: { w: 2, len: 9 }, hunch: 3, hairStyle: 'wild', eye: rgb(0xff3a4a), ribs: true }),
  },
  {
    id: 'sowa', tiles: 1.5,
    kind: { pl: 'Strzyga B', en: 'Strzyga B' }, name: { pl: 'sowa', en: 'the owl' },
    note: { pl: 'płaszcz z piór, oczy jak latarnie, dziób, szpony', en: 'a mantle of feathers, lantern eyes, a beak, talons' },
    figure: monster({ w: 24, skin: FEATHER, top: FEATHER, cloak: FEATHER, bottom: BONE, boots: BONE, face: 'none', leg: { w: 2, len: 5, gap: 4 }, arm: { w: 3, len: 7 }, hunch: 3, over: owlFace }),
  },
  {
    id: 'calun', tiles: 1.5,
    kind: { pl: 'Zjawa A', en: 'Wraith A' }, name: { pl: 'całun', en: 'the shroud' },
    note: { pl: 'pusty kaptur, w środku dwa światła; rozwiewa się u dołu', en: 'an empty hood with two lights in it; it frays into nothing' },
    figure: monster({ skin: SHROUD, top: SHROUD, bottom: SHROUD, head: { w: 9, h: 9 }, shoulder: 7, robe: true, wisp: true, fade: 5, eye: rgb(0xff7ad8), hunch: 1, arm: { w: 2, len: 7 }, outline: rgb(0x2a1a52), over: cowl(SHROUD) }),
  },
  {
    id: 'poludnica', tiles: 1.5,
    kind: { pl: 'Zjawa B', en: 'Wraith B' }, name: { pl: 'południca', en: 'the noon-wife' },
    note: { pl: 'kobieta w bieli, czarne włosy na twarzy, sierp, wianek z kłosów', en: 'a woman in white, black hair over her face, a sickle, a wreath of wheat' },
    figure: monster({ skin: PALE, top: WHITE, bottom: WHITE, robe: true, fade: 3, hair: BLACK, hairStyle: 'curtain', eye: rgb(0xffffff), hunch: 1, hands: 'hand', arm: { w: 2, len: 6 }, shoulder: 7, over: all(wreath, sickle) }),
  },
  {
    id: 'upior', tiles: 1.5,
    kind: { pl: 'Upiór', en: 'The revenant' }, name: { pl: 'upiór', en: 'revenant' },
    note: { pl: 'drużynnik, który nie odszedł: kości, rdza, czerwień w oczodołach', en: 'a man-at-arms who never left: bone, rust, red in the sockets' },
    figure: monster({ skin: BONE, top: BONE, bottom: BONE, boots: RUST, bootH: 1, face: 'skull', eye: rgb(0xff3a2a), ribs: true, hunch: 1, hands: 'hand', arm: { w: 2, len: 6 }, leg: { w: 2, len: 6, gap: 2 }, waist: 4, belt: RUST[1], over: all(casque(RUST), rustySword) }),
  },
  {
    id: 'licho', tiles: 1.5,
    kind: { pl: 'Licho', en: 'Licho' }, name: { pl: 'licho', en: 'licho' },
    note: { pl: 'nieszczęście we własnej osobie: jedno oko, sama skóra i kości', en: 'misfortune in person: one eye, skin and bone' },
    figure: monster({ skin: PALE, top: RAG, bottom: RAG, shoulder: 6, waist: 4, skirt: 3, arm: { w: 2, len: 9 }, hair: WHITE, hairStyle: 'wild', face: 'none', hunch: 2, over: oneEye }),
  },
  // ---- two tiles
  {
    id: 'bies', tiles: 2,
    kind: { pl: 'Bies', en: 'Bies' }, name: { pl: 'bies', en: 'bies' },
    note: { pl: 'rogi, ogon, kopyta: stary diabeł z bagien', en: 'horns, a tail, hooves: the old devil of the marsh' },
    figure: monster({ w: 24, h: 32, skin: DEVIL, top: DEVIL, bottom: ramp(0x120a0c, 0x2a1a1c, 0x44302e, 0x5e4840), boots: BLACK, bootH: 2, shoulder: 12, waist: 9, torsoH: 9, arm: { w: 4, len: 10 }, leg: { w: 4, len: 7, gap: 0 }, eye: rgb(0xffd24a), under: tail(DEVIL), over: horns(BONE) }),
  },
  {
    id: 'leszy', tiles: 2,
    kind: { pl: 'Leszy', en: 'Leshy' }, name: { pl: 'leszy', en: 'leshy' },
    note: { pl: 'pan lasu: kora, mech, poroże, czaszka zamiast twarzy', en: 'the lord of the forest: bark, moss, antlers, a skull for a face' },
    figure: monster({ w: 24, h: 32, skin: BONE, top: BARK, bottom: BARK, boots: BARK, head: { w: 9, h: 9 }, shoulder: 12, waist: 8, torsoH: 10, arm: { w: 3, len: 13 }, leg: { w: 4, len: 7, gap: 0 }, cloak: MOSS, face: 'skull', eye: rgb(0x9af46a), hunch: 1, over: all(antlers(BONE), mossy) }),
  },
];
