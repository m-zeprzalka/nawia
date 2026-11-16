// Sambor (C2f) in motion: every frame of the hero's sheet (src/art/hero/layout.ts), drawn in letter rows.
//
// The heads, the shields and the colours are C1g's (najlepszy-g.concept.ts); the trunk, the arms and the legs
// of the standing lad are C2f's (najlepszy-wysoki-f.concept.ts). This file adds what a fight needs: running
// legs with knees, arms that swing and reach, the sword in his hand, the shield raised, a roll, a fall.
//
// Coordinates: every part is placed at (x, y) in the old 16 x 18 frame of C2f (columns 0..15, rows 0..17, the
// soles on row 16); that frame sits in the 32 x 32 cell at (CELL.cx - 8, CELL.foot - 18), so a part may reach
// out of it to the left (x < 0), the right (x > 15) or above (y < 0). In a part '.' lets what is under it
// show and '_' clears it. The line round him is C2f's ('rim': below and to the right, by what it borders).
//
// The sword in his hand is not drawn letter by letter: `blade()` lays it from his fist in one of sixteen
// directions (the clean pixel slopes: flat, 1:2, 1:1, 2:1, upright), so every angle is drawn the same way and
// the tip is known exactly (BLADE_TIP, for the smear). The arm that holds it is drawn by hand, frame by frame.
// See docs/HERO-DRAWING.md.

import { PixelBuffer } from '../../core/PixelBuffer.ts';
import { paintRows, type Ink } from '../concepts/concept.ts';
import { HEAD_D, HEAD_S, HEAD_U, LINE, PAL, SHIELD_D, SHIELD_S, SHIELD_U } from '../concepts/najlepszy-g.concept.ts';
import { LEGS_D, LEGS_S, LEGS_U, TRUNK_D, TRUNK_S, TRUNK_U, ARM_S } from '../concepts/najlepszy-wysoki-f.concept.ts';
import { ANIMS, CELL, type HeroAnim, type HeroView } from './layout.ts';

// ------------------------------------------------------------------ the colours

/**
 * C2f's colours, and the sword's. The sword's letters reuse C2f's colours (the steel is the shirt's white and
 * grey, the crossguard the hair's gold, the grip the leather) under letters of their own, so that their line can
 * differ; only the hag stone in the pommel is a new colour.
 */
export const SAMBOR_PAL: Record<string, number> = {
  ...PAL,
  e: 0xf4f6ee, // the blade's light edge (the shirt's white)
  i: 0x9ea0ac, // the blade (the shirt's shadow)
  o: 0xd6a04a, // the crossguard, bronze (the hair)
  u: 0xb87a50, // the crossguard, its shadow (the hair's shadow)
  g: 0x7a5238, // the grip and the scabbard, leather
  c: 0x9af4ff, // the hag stone in the pommel: a speck of the other side's light
};
const NAVY = 0x2f3858;
const DARK = 0x4e3230;
export const SAMBOR_INK: Ink = {
  ink: 'rim',
  outline: NAVY,
  line: { ...LINE, e: NAVY, i: NAVY, c: NAVY, o: DARK, u: DARK, g: DARK },
};

// ------------------------------------------------------------------ putting parts together

/** What a part is, for the bare sheet: a shield, a sword in his hand, a sword on his back. Bare drops them. */
type Tag = 'shield' | 'sword' | 'sheath';
/** A part at (x, y) of the old 16 x 18 frame. */
type Put = readonly [rows: readonly string[], x: number, y: number, tag?: Tag];
/** The sword in his fist at (x, y), pointing `dir` (0 right, 4 down, 8 left, 12 up; sixteen steps). */
interface Blade {
  x: number;
  y: number;
  dir: number;
  /** the blade's length in pixels (the grip and the crossguard not counted) */
  len: number;
  /** the fist's letter ('' when the fist is hidden behind him) */
  fist: string;
}
type Item = Put | Blade | false | null | undefined;
type Frame = readonly Item[];

const OX = CELL.cx - 8;
const OY = CELL.foot - 18;

/** The sixteen directions, as the integer steps that make clean pixel lines. */
const DIRS: readonly [number, number][] = [
  [1, 0], [2, 1], [1, 1], [1, 2], [0, 1], [-1, 2], [-1, 1], [-2, 1],
  [-1, 0], [-2, -1], [-1, -1], [-1, -2], [0, -1], [1, -2], [1, -1], [2, -1],
];

/** `n` steps along a direction, on its clean pixel line. */
function along(dir: number, n: number): [number, number] {
  const [dx, dy] = DIRS[((dir % 16) + 16) % 16];
  const m = Math.max(Math.abs(dx), Math.abs(dy));
  return [Math.round((n * dx) / m), Math.round((n * dy) / m)];
}

/** How many steps along `dir` make `len` pixels. */
function steps(dir: number, len: number): number {
  const [dx, dy] = DIRS[((dir % 16) + 16) % 16];
  const m = Math.max(Math.abs(dx), Math.abs(dy));
  return Math.max(1, Math.round(len / (Math.hypot(dx, dy) / m)));
}

/** The pixels of a sword in his fist: [x, y, letter], the last one is the tip. */
function bladePixels(b: Blade): [number, number, string][] {
  const out: [number, number, string][] = [];
  const at = (n: number): [number, number] => {
    const [x, y] = along(b.dir, n);
    return [b.x + x, b.y + y];
  };
  const [dx, dy] = DIRS[((b.dir % 16) + 16) % 16];
  // the light edge runs along the upper side of a flat blade, the left side of an upright one
  const edge: [number, number] = Math.abs(dy) > Math.abs(dx) ? [-1, 0] : [0, -1];
  // the crossguard, across the blade (snapped to the eight directions)
  const px = -dy;
  const py = dx;
  const gx = Math.abs(px) * 2 >= Math.abs(py) ? Math.sign(px) : 0;
  const gy = Math.abs(py) * 2 >= Math.abs(px) ? Math.sign(py) : 0;
  const n = steps(b.dir, b.len);
  const [pcx, pcy] = at(-1);
  out.push([pcx, pcy, 'c']);
  const [hx, hy] = at(0);
  if (b.fist) out.push([hx, hy, b.fist]);
  const [cx, cy] = at(1);
  const shadowSide = gy > 0 || (gy === 0 && gx > 0);
  out.push([cx + gx, cy + gy, shadowSide ? 'u' : 'o'], [cx - gx, cy - gy, shadowSide ? 'o' : 'u'], [cx, cy, 'o']);
  for (let k = 2; k <= n; k++) {
    const [x, y] = at(k);
    out.push([x + edge[0], y + edge[1], 'e']);
  }
  for (let k = 2; k <= n + 1; k++) {
    const [x, y] = at(k);
    out.push([x, y, k === n + 1 ? 'e' : 'i']);
  }
  return out;
}

const isBlade = (it: Item): it is Blade => !!it && !Array.isArray(it);

/** A frame's letter rows, CELL.w x CELL.h, and where the blade's tip is (cell coordinates), if he holds it. */
function compose(frame: Frame, armed: boolean): { rows: string[]; tip?: [number, number] } {
  const g = Array.from({ length: CELL.h }, () => Array<string>(CELL.w).fill('.'));
  const plot = (x: number, y: number, ch: string): void => {
    const tx = OX + x;
    const ty = OY + y;
    if (ch === '.' || tx < 0 || ty < 0 || tx >= CELL.w || ty >= CELL.h) return;
    g[ty][tx] = ch === '_' ? '.' : ch;
  };
  let tip: [number, number] | undefined;
  // the pommel goes in last, and only where nothing else is: a speck of cyan on his chest reads as a brooch
  const pommels: [number, number][] = [];
  for (const it of frame) {
    if (!it) continue;
    if (isBlade(it)) {
      if (!armed) continue;
      const px = bladePixels(it);
      for (const [x, y, ch] of px) if (ch === 'c') pommels.push([x, y]);
      else plot(x, y, ch);
      const [tx, ty] = px[px.length - 1];
      tip = [OX + tx, OY + ty];
      continue;
    }
    const [rows, x, y, tag] = it as Put;
    if (tag && !armed) continue;
    rows.forEach((r, j) => [...r].forEach((ch, i) => plot(x + i, y + j, ch)));
  }
  for (const [x, y] of pommels) if (g[OY + y]?.[OX + x] === '.') plot(x, y, 'c');
  return { rows: g.map((r) => r.join('')), tip };
}

/** The sword in his fist (see Blade). */
const blade = (x: number, y: number, dir: number, len = 9, fist = 's'): Blade => ({ x, y, dir, len, fist });

/** Rows `from`..`to` (inclusive) of a part. */
const rowsOf = (p: readonly string[], from: number, to = p.length - 1): string[] => p.slice(from, to + 1);

/** Each row of a part moved by its own number of columns (the last number repeats): a lean, a twist. */
function shear(p: readonly string[], dxs: readonly number[]): string[] {
  return p.map((r, j) => {
    const d = dxs[Math.min(j, dxs.length - 1)];
    return d >= 0 ? '.'.repeat(d) + r : r.slice(-d);
  });
}

/** A part with some of its columns emptied (an arm taken off a trunk, to be drawn elsewhere). */
const without = (p: readonly string[], cols: readonly number[]): string[] =>
  p.map((r) => [...r].map((ch, x) => (cols.includes(x) ? '.' : ch)).join(''));

/** A part with rows left out (a shorter trunk, for a crouch). */
const skipRows = (p: readonly string[], skip: readonly number[]): string[] => p.filter((_, j) => !skip.includes(j));

/** A part turned a quarter clockwise (its top to the right): the back of his head when he lies on the ground. */
function turnCW(p: readonly string[]): string[] {
  const w = Math.max(...p.map((r) => r.length));
  return Array.from({ length: w }, (_, x) => p.map((r) => r[x] ?? '.').reverse().join(''));
}

/** A part with its empty columns at both sides cut off; returns the part and how many columns were cut on the left. */
function trimmed(p: readonly string[]): [string[], number] {
  const used = (x: number): boolean => p.some((r) => (r[x] ?? '.') !== '.');
  const w = Math.max(...p.map((r) => r.length));
  let a = 0;
  while (a < w && !used(a)) a++;
  let b = w - 1;
  while (b > a && !used(b)) b--;
  return [p.map((r) => r.slice(a, b + 1).padEnd(b - a + 1, '.')), a];
}

/** Legs: a part whose last row is the soles, set down so the soles stand on row 16. */
const legs = (p: readonly string[], dx = 0): Put => [p, dx, 17 - p.length];

// ------------------------------------------------------------------ the sword at his hip
// Sheathed, the sword hangs at his right hip, the hilt forward and up by his hand: on our left facing us, on our
// right from behind, in front of his belt from the side (there the stone faces away: a cyan speck in front of his
// belly flickers in the run). The parts are laid by each view's `sheath()`.

const SHEATH_D = ['..c.', '..g.', '.ou.', '..g.', '..g.', '.g..'];
const SHEATH_U = ['.............c..', '.............g..', '.............uo.', '.............g..', '.............g..', '..............g.'];
const SHEATH_S = ['...........u....', '..........g.....', '.........ou.....', '........g.......'];

// ================================================================== facing us
// His right arm is on our left (column 3), the shield on his left arm on our right.

/** C2f's trunk without the right arm (col 3), or without both (cols 3, 12) */
const TRUNK_D_NR = without(TRUNK_D, [3]);
const TRUNK_D_NA = without(TRUNK_D, [3, 12]);

const RUN_LEGS_D = {
  // contact R: the right foot (our left) comes down in front, big and low; the left pushes off behind, its sole up
  contactR: ['....RpP..pPC....', '.....pP..pP.....', '....kkK..KK.....', '....kkK.........'],
  // down R: crouched on the right, knee bent; the left foot up behind him, out of sight
  downR: ['...RRpP..pPCC...', '....kpP..pP.....', '...kkK..........'],
  // pass R: up on the straight right leg, the left knee coming through towards us
  passR: ['....RpP..pPC....', '.....pP..pp.....', '.....pP..pP.....', '.....kK..kK.....', '....kkK.........'],
  contactL: ['....RpP..pPC....', '.....pP..pP.....', '.....KK..kkK....', '.........kkK....'],
  downL: ['...RRpP..pPCC...', '.....pP..pPk....', '..........kkK...'],
  passL: ['....RpP..pPC....', '.....pp..pP.....', '.....pP..pP.....', '.....kK..kK.....', '.........kkK....'],
};
/** the right arm (on our left), running: swung forward (the fist up by his belt), back (behind him) */
const RUN_ARM_D = {
  fwd: ['...b', '...b', '...r', '....s', '....S'],
  back: ['...b', '..b.', '..A.'],
  mid: ['...b', '...r', '...s'],
};
/** the cloak flying behind him: it shows at his sides and between his knees */
const RUN_CLOAK_D = {
  a: ['..R.........C...', '..RR.......CC...', '..CR..RCC..CC...', '.......C........'],
  b: ['...R........C...', '...R.......CC...', '......RCC.......'],
};

/** stances facing us, from the hem down */
const STANCE_D = {
  /** feet apart, knees a little bent (3 rows: the body a pixel lower) */
  wide: ['...RpP...pPC....', '....kK....kK....', '...kkK....kkK...'],
  /** the right foot (our left) forward and out */
  stepR: ['...RpP...pPC....', '...pP.....kK....', '..kkK....kkK....'],
  /** the left foot (our right) forward and out */
  stepL: ['....RpP..pPC....', '....kK.....pP...', '....kkK....kkK..'],
  /** a deep crouch, knees out (2 rows) */
  squat: ['..pP.....pP.....', '.kkK.....kkK....'],
  /** knees out, a pixel lower than standing */
  low: ['...RpP...pPC....', '...pP.....pP....', '..kkK.....kkK...'],
  /** up on his toes: the heels off the ground (4 rows) */
  toes: ['....RpP..pPC....', '.....pP..pP.....', '.....kK..kK.....', '.....kK..kK.....'],
};

// ================================================================== from behind
// His right arm is on our right (column 12), the shield on his left arm on our left.

const TRUNK_U_NR = without(TRUNK_U, [12]);
const RUN_LEGS_U = {
  // contact R: his right foot (our right) reaches forward, away from us; the left pushes off, its sole to us
  contactR: ['.....pP..pP.....', '.....pP..pP.....', '.....pP..kK.....', '....KKK.........'],
  // down R: bent on the right, the left sole kicked up behind
  downR: ['.....KK..pP.....', '.........kK.....', '.........kkK....'],
  // pass R: up on the right, the left foot passing under him
  passR: ['.....pP..pP.....', '.....pP..pP.....', '.....pP..pP.....', '.....KK..kK.....', '.........kkK....'],
  contactL: ['.....pP..pP.....', '.....pP..pP.....', '.....kK..pP.....', '.........KKK....'],
  downL: ['.....pP..KK.....', '.....kK.........', '....kkK.........'],
  passL: ['.....pP..pP.....', '.....pP..pP.....', '.....pP..pP.....', '.....kK..KK.....', '....kkK.........'],
};
/** the cloak from behind, running: the hem swings to one side and the other */
const RUN_CLOAK_U = {
  a: ['...rrRRRRRRCC...', '...rRRCRRRCCC...', '....RR..RCC.....'],
  b: ['...rRRRRRRCCC...', '..rRRCRRRCCC....', '..RR...RCC......'],
  c: ['...rRRRRRRRCC...', '....rRCRRCCC....'],
};
/** his right arm (on our right) swung back: the hand shows behind his hip */
const RUN_ARM_U_BACK = ['............A...', '............RA..', '.............S..'];
const STANCE_U = {
  wide: ['....pP...pP.....', '....kK....kK....', '...kkK....kkK...'],
  stepR: ['....pP....pP....', '....kK.....kK...', '...kkK.....kkK..'],
  squat: ['...pP....pP.....', '..kkK....kkK....'],
  toes: ['.....pP..pP.....', '.....pP..pP.....', '.....kK..kK.....', '.....kK..kK.....'],
};

// ================================================================== from the side, facing right
// The near arm is his right, the sword arm; the shield is on the far arm, at his hip.

/** the near (right) arm running: swung back, the elbow out behind him; forward, the fist up in front */
const RUN_ARM_S = {
  back: ['.......b', '......ba', '....sba.'],
  fwd: ['........ba......', '........ab......', '.........brss...'],
  mid: ['.......ba.......', '.......ba.......', '........rb......', '........ss......'],
};
/** the legs running, from the hem down (the first row is the hem) */
const RUN_LEGS_S = {
  // contact R: the right (near) leg reaching forward, heel down; the left pushing off behind on its toes
  contactR: ['...CC.PPpp......', '.....PP..pp.....', '....KK....pk....', '...KK......kkK..'],
  // down R: the weight on the bent right leg, the left heel kicked up behind him
  downR: ['.KKCC.PPpp......', '...PPP....pp....', '.........kkK....'],
  // pass R: up on the straight right leg, the left knee coming through in front
  passR: ['...CC..pPP......', '.......pPPP.....', '.......pP.P.....', '.......kK.KK....', '......kkK.......'],
  contactL: ['...CC.ppPP......', '.....pp..PP.....', '....kk....PK....', '...kk......KKK..'],
  downL: ['.kkCC.ppPP......', '...ppp....PP....', '.........KKK....'],
  passL: ['...CC..PpP......', '.......PPpp.....', '.......PP.pp....', '.......KK.pk....', '......KKK.......'],
};
/** the cloak streaming out behind him, flapping */
const RUN_CLOAK_S = {
  a: ['...RR...', '..RRR...', '.RRCC...', 'RRC.....', 'C.......'],
  b: ['........', '...RR...', '.rRRC...', 'RRRCC...', '.CC.....'],
};
/** the trunk without the near arm (C2f's trunk has none: the arm is a part of its own) */
const TRUNK_S_LOW = skipRows(TRUNK_S, [4]);
/** stances from the side, from the hem down; near leg p/k, far leg P/K */
const STANCE_S = {
  /** weight back on the bent near leg, the far foot forward (3 rows) */
  back: ['..CC.ppPP.......', '...pp....PP.....', '..kkK.....KKK...'],
  /** the near foot stepped forward, the far one behind (3 rows) */
  lunge: ['..CC.PPppp......', '....PP....pp....', '...KK......kkK..'],
  /** a deep lunge, the far knee nearly down (2 rows) */
  deep: ['.CC.PPP.ppp.....', '.KK.......kkK...'],
  /** feet apart, upright (4 rows) */
  ready: ['...CC.PPpp......', '.....PP..pp.....', '.....KK...kk....', '....KKK...kkK...'],
  /** on his toes (4 rows), the far heel up */
  toes: ['...CC..pP.......', '......PpP.......', '......Kkk.......', '.....KK.kK......'],
  /** knocked back on his heels, the toes up, the near foot off the ground (4 rows) */
  heels: ['..CC.PPpp.......', '....PP...pp.....', '...KK......kk...', '..KKK.......k...'],
};


// ================================================================== the shield raised

/** from the side, held up in front of his chest and turned to the blow: we see it nearly edge on, the boss out */
const SHIELD_GUARD_S = [
  '.kk.',
  'kRr.',
  'kRrb',
  'kRR.',
  'kRC.',
  '.KK.',
];
/** from behind, held up in front of him: its back (the straps on the leather) over his left shoulder */
const SHIELD_GUARD_U = [
  '..kkk...',
  '.kkKKk..',
  '.kKgKK..',
  '..KKK...',
];

// ================================================================== the roll, the fall: whole bodies

/**
 * The roll from the side, turning forward (clockwise): first the back comes over the front, the hair under him
 * behind and the boots up behind; then the cloak is under him, the hair up behind and the boots over the top.
 */
const BALL_S = [
  [
    '....KKk.........',
    '...KkpPRRr......',
    '...PpPRRRRRr....',
    '..PpPRRRRRRRr...',
    '..CPRRRRRRRRR...',
    '..hhCRRRRRRRC...',
    '..lhhCCRRRRC....',
    '...hHHCCCCC.....',
  ],
  [
    '.........kKK....',
    '...hhrRRPpkK....',
    '..lhhRRRPPpP....',
    '..hhHRRRRRPp....',
    '..HHRRRRRRRRr...',
    '...CRRRRRRRRR...',
    '....CRRRRRRC....',
    '.....CCCCCC.....',
  ],
];
/** the tuck from the side: bent double, the shoulders rounded, the head going down in front of his knees */
const TUCK_S = [
  '.....rRRRr......',
  '...rRRRRRRRr....',
  '..rRRRRRRRRRR...',
  '..RRCRRRRRRCC...',
  '..CC.pPPPpRC....',
  '....pPP..pp.....',
  '...kkK....kkK...',
];
/** the roll facing us: first his back rolls over towards us, his boots going up behind; then his knees and soles come over */
const BALL_D = [
  [
    '....kK...kK.....',
    '....pP...pP.....',
    '...rRRRRRRRC....',
    '..rRRRRRRRRCC...',
    '..RRRRCRRRRCC...',
    '..RRRhhlhhCCC...',
    '...ChlhhhHHC....',
    '....CHhhHHC.....',
  ],
  [
    '....hhlhhh......',
    '...rRpPRpPC.....',
    '..rRpPPRpPPC....',
    '..RRkKKRkKKCC...',
    '..RRKKKRKKKCC...',
    '..CRRRRRRRRCC...',
    '...CCRRRRRCC....',
    '....CCCCCCC.....',
  ],
];
/** the roll from behind: his back humped over, the soles under it; then the soles going over the top */
const BALL_U = [
  [
    '.....hhlhh......',
    '...rRRRRRRRC....',
    '..rRRRRRRRRCC...',
    '..RRRRRRRRRCC...',
    '..RRRRCRRRCCC...',
    '..CRpPCCCpPCC...',
    '...kKK...KKk....',
  ],
  [
    '....KKk.kKK.....',
    '...rpPRRRpPC....',
    '..rRpPRRRpPCC...',
    '..RRRRRRRRRCC...',
    '..RRRRRRRRCCC...',
    '..CCRRRRRRCCC...',
    '...CCCCCCCCC....',
  ],
];
/** bowed forward towards us over his knees: the shoulders hunched up behind the crown of his head */
const TUCK_D = [
  '....rRRRRRRC....',
  '...rRR....RCC...',
  '...RR......CC...',
  '................',
  '................',
  '................',
  '..bs........Sb..',
  '...pP......pP...',
  '...kK......kK...',
  '..kkK......kkK..',
];
/** bowed from behind: the head gone down in front, the cloak humped, the soles under it */
const TUCK_U = [
  '...rRRRRRRRC....',
  '..rRRRRRRRRCC...',
  '..RRRRRRRRRCC...',
  '..RRRRCRRRCCC...',
  '..CCpP...pPCC...',
  '...kkK...kkK....',
];

/** kneeling: the legs from the hem (facing us the knees; from behind the soles; from the side the shins lie back) */
const KNEEL = {
  down: ['...RpP...pPC....', '...kpP...pPk....'],
  up: ['....pP...pP.....', '...KKK...KKK....'],
  side: ['..CC.ppP........', '.kkkpppP........'],
};

/**
 * Fallen face down, the same in every view (he falls forward or over to our right): his boots on our left, the
 * cloak over his back, the back of C1g's head (from behind, turned on its side) on our right, one hand out past
 * it, the shield on the ground under his left arm. The head is laid on by the frames (HEAD_LYING).
 */
const LYING = [
  '..........rRRRRr....',
  '.......rRRRRRRRRRr..',
  'KK..pPPRRRRRRRRRRRC.',
  'kKkppPRRRRRRRRRRRRC.',
  'kk..pPPRRRRRRRRRRCC.',
  '.......CRRRRRRRRCC..',
  '........CCCCCCCC....',
];
/** a moment later: the cloak settled flatter over him, the hem spread on the ground */
const LYING_STILL = [
  '....................',
  '.......rRRRRRRRRr...',
  'KK..pPPRRRRRRRRRRRR.',
  'kKkppPRRRRRRRRRRRRC.',
  'kk..pPCRRRRRRRRRRRCC',
  '.....CCRRRRRRRRRRCC.',
  '......CCCCCCCCCCC...',
];
/** the back of his head lying on its side, the crown towards our right */
const HEAD_LYING = trimmed(turnCW(HEAD_U))[0];

// ================================================================== the frames

/** The chest a pixel higher: the trunk drawn a row up, its lower half again where it was. */
function breathe(trunk: readonly string[], x: number, y: number, keep: number): Put[] {
  return [[trunk, x, y - 1], [rowsOf(trunk, keep), x, y + keep]];
}

type Anims = Record<HeroAnim, Frame[]>;

/** death, frames 3 and 4: lying face down, then still (shared by the three views) */
const LIE: Frame[] = [
  [[LYING, -4, 10], [['.bs', 'b..'], 18, 8], [HEAD_LYING, 14, 8], [SHIELD_D, -1, 13, 'shield']],
  [[LYING_STILL, -4, 10], [['bbs'], 18, 10], [HEAD_LYING, 14, 9], [SHIELD_D, -1, 14, 'shield']],
];

// ------------------------------------------------------------------ facing us

function framesDown(): Anims {
  const sheath = (dx: number, dy: number): Put => [SHEATH_D, dx, 10 + dy, 'sheath'];
  const shield = (dx: number, dy: number): Put => [SHIELD_D, dx, 9 + dy, 'shield'];
  const rest = (lift = false): Frame => [[HEAD_D, 0, 0], [TRUNK_D, 0, 7], [LEGS_D.stand, 0, 13], lift && [['....__.....__...'], 0, 13], lift && [['....R......C....'], 0, 12], shield(0, 0), sheath(0, 0)];
  const breath = (lift = false): Frame => [[HEAD_D, 0, -1], ...breathe(TRUNK_D, 0, 7, 2), [LEGS_D.stand, 0, 13], lift && [['....__.....__...'], 0, 13], !lift && [['....h......H....'], 0, 5], shield(0, 0), sheath(0, 0)];

  const run = (lg: readonly string[], b: number, arm: readonly string[], cloak: readonly string[], sdx: number, sdy: number, ax = 0): Frame => [
    [cloak, 0, 11 + b],
    legs(lg),
    [HEAD_D, 0, b],
    [TRUNK_D_NR, 0, 7 + b],
    sheath(0, b),
    [arm, ax, 8 + b],
    shield(sdx, b + sdy),
  ];

  /** a body facing us: the head at (hx, hy), the trunk `b` rows down and leaning `lean` columns at the top */
  const body = (st: readonly string[], b: number, hx: number, lean: number, trunk = TRUNK_D_NR): Item[] => [
    legs(st),
    [shear(trunk, [lean, lean, lean, 0]), 0, 7 + b],
    [HEAD_D, hx, b],
  ];

  return {
    idle: [rest(), breath(), breath(true), rest(true)],
    run: [
      run(RUN_LEGS_D.contactR, 0, RUN_ARM_D.back, RUN_CLOAK_D.a, -1, 0),
      run(RUN_LEGS_D.downR, 1, RUN_ARM_D.back, RUN_CLOAK_D.b, -1, 0),
      run(RUN_LEGS_D.passR, -1, RUN_ARM_D.mid, RUN_CLOAK_D.b, 0, 0),
      run(RUN_LEGS_D.contactL, 0, RUN_ARM_D.fwd, RUN_CLOAK_D.a, 1, -1),
      run(RUN_LEGS_D.downL, 1, RUN_ARM_D.fwd, RUN_CLOAK_D.b, 1, -1),
      run(RUN_LEGS_D.passL, -1, RUN_ARM_D.mid, RUN_CLOAK_D.b, 0, 0),
    ],
    atkA: [
      // wind-up: coiled to his right, the sword drawn back high on our left, the shield across his belly
      [...body(STANCE_D.wide, 1, -1, -1), [['br'], 1, 9], blade(0, 8, 10, 9), shield(-3, 1)],
      // swing: the blade sweeps past in front of him, pointing at us; a step
      [...body(STANCE_D.stepR, 1, 0, 0), shield(1, 1), [['b.', 'bA', '.r'], 3, 9], blade(5, 12, 4, 7)],
      // follow-through: the arm across his belt to our right, the blade out beyond the shield, leaning after it
      [[['.R', 'RR', 'RC'], 1, 11], shield(2, -2), ...body(STANCE_D.stepL, 1, 1, 1), [['b.........', 'Abbbbbbbr.'], 3, 9], blade(13, 10, 15, 8)],
      // recover: upright, the blade lowered at his right side
      [...body(STANCE_D.wide, 1, 0, 0), shield(0, 1), [['b', 'r'], 3, 9], blade(3, 11, 5, 8)],
    ],
    atkB: [
      // wind-up: the arm across his chest to his left shoulder, the blade up over the shield
      [shield(2, 0), ...body(STANCE_D.wide, 1, 1, 1), blade(12, 8, 14, 9), [['bAAAAAAr', '.bbbb...'], 4, 8]],
      // swing: back across in front of him
      [...body(STANCE_D.stepL, 1, 0, 0), shield(1, 1), [['.b.', '.bA', '..r'], 4, 9], blade(7, 12, 4, 7)],
      // follow-through: out to our left, the arm flung wide
      [[['C.', 'CC', 'CC'], 12, 11], ...body(STANCE_D.stepR, 1, -1, -1), shield(-1, 1), [['.b', 'r.'], 1, 9], blade(0, 11, 9, 8)],
      // recover
      [...body(STANCE_D.wide, 1, 0, 0), shield(0, 1), [['b', 'r'], 3, 9], blade(3, 11, 6, 8)],
    ],
    atkC: [
      // raise high: up on his toes, the sword straight up over his head, the shield out for balance
      [legs(STANCE_D.toes), [TRUNK_D_NR, 0, 6], [rowsOf(TRUNK_D_NR, 4), 0, 11], [HEAD_D, 0, -1], shield(2, 1), [['.r', 'b.', 'b.', 'b.', 'b.', 'b.', 'b.', 'b.'], 3, -1], blade(4, -2, 12, 6)],
      // chop: down in front of him with a step, the hands at his chest
      [...body(STANCE_D.stepR, 1, 0, 0), shield(2, 1), [['bb', '.r'], 3, 9], blade(6, 10, 4, 9)],
      // impact: crouched low, the blade down in front of his feet
      [[['.R........C.', 'RR........CC'], 2, 8], legs(STANCE_D.squat), [skipRows(TRUNK_D_NR, [4]), 0, 10], [HEAD_D, 0, 3], shield(2, 4), [['bb', '.r'], 3, 11], blade(6, 13, 4, 7)],
      // recover: coming up, the blade still low, then lowered at his side
      [legs(STANCE_D.low), [TRUNK_D_NR, 0, 9], [HEAD_D, 0, 2], shield(1, 3), [['bb', '.r'], 3, 10], blade(5, 12, 4, 7)],
      [...body(STANCE_D.wide, 1, 0, 0), shield(0, 1), [['b', 'r'], 3, 9], blade(3, 11, 5, 8)],
    ],
    guard: [
      // the shield comes round in front, he sinks a little behind it
      [...body(STANCE_D.wide, 1, 0, 0, TRUNK_D), sheath(0, 1), shield(-2, 0)],
      [...body(STANCE_D.low, 1, 0, 0, TRUNK_D), sheath(0, 1), shield(-4, -2)],
    ],
    roll: [
      // crouch: down low, leaning in, the arms forward
      [legs(STANCE_D.squat), [skipRows(TRUNK_D_NR, [4]), 0, 10], [HEAD_D, 0, 3], [['b.', '.s'], 3, 11], shield(-1, 3)],
      // tuck: bowed over his knees towards us, the crown of his head first
      [legs(TUCK_D), [HEAD_U, 0, 8], [['.r..........C.'], 1, 12], shield(1, 4)],
      // the ball: his back rolls over towards us, then his knees and soles come over
      [legs(BALL_D[0]), shield(1, 3)],
      [legs(BALL_D[1]), shield(1, 2)],
      // unfold: the feet down in front, the head comes up out of it, still low
      [legs(STANCE_D.squat), [skipRows(TRUNK_D_NR, [4]), 0, 10], [HEAD_D, 0, 4], [['b', 's'], 2, 11], shield(1, 4)],
      // land: crouched, an arm out to steady himself
      [legs(STANCE_D.low), [TRUNK_D_NR, 0, 9], [HEAD_D, 0, 2], [['br.', '..s'], 1, 10], shield(2, 1)],
    ],
    hurt: [
      // recoil: thrown back, the chest up, the arms flung out, one foot off the ground
      [legs(LEGS_D.a), [TRUNK_D_NA, 0, 6], [rowsOf(TRUNK_D_NA, 4), 0, 11], [HEAD_D, 0, -1], [['s..', '.b.', '..b'], 0, 5], [['..S', '.A.', 'A..'], 12, 5], shield(3, -3)],
      // catch: crouched, finding his feet
      [legs(STANCE_D.wide), [TRUNK_D_NR, 0, 8], [HEAD_D, 0, 1], [['b.', 'r.', '.s'], 2, 9], shield(1, 1)],
    ],
    death: [
      // the blow: thrown back further than when hurt
      [legs(LEGS_D.b), [TRUNK_D_NA, 0, 6], [rowsOf(TRUNK_D_NA, 4), 0, 11], [HEAD_D, 0, -1], [['s...', '.b..', '..bb'], -1, 4], [['...S', '..A.', 'AA..'], 12, 4], shield(4, -4)],
      // on his knees, the head hanging, the arms limp
      [legs(KNEEL.down), [TRUNK_D_NR, 0, 9], [HEAD_D, 0, 3], [['b', 'r', 's'], 3, 10], shield(0, 4)],
      // toppling over to our right off his knees, the shield arm going down to catch him
      [legs(KNEEL.down), [shear(TRUNK_D_NA, [3, 3, 2, 2, 1, 0]), 0, 9], [HEAD_D, 3, 3], [['s.', '.b', '.b'], 2, 8], shield(5, 5)],
      ...LIE,
    ],
  };
}

// ------------------------------------------------------------------ from behind

function framesUp(): Anims {
  const sheath = (dx: number, dy: number): Put => [SHEATH_U, dx, 9 + dy, 'sheath'];
  const shield = (dx: number, dy: number): Put => [SHIELD_U, dx, 9 + dy, 'shield'];
  const rest = (lift = false): Frame => [shield(0, 0), [LEGS_U.stand, 0, 13], [HEAD_U, 0, 0], [TRUNK_U, 0, 7], lift && [['....__RRRCC_'], 0, 13], sheath(0, 0)];
  const breath = (lift = false): Frame => [shield(0, 0), [LEGS_U.stand, 0, 13], [HEAD_U, 0, -1], ...breathe(TRUNK_U, 0, 7, 2), lift && [['....__RRRCC_'], 0, 13], !lift && [['......H..H......'], 0, 6], sheath(0, 0)];
  const run = (lg: readonly string[], b: number, cloak: readonly string[], back: boolean, sdy: number, sdx: number): Frame => [
    shield(sdx, b + sdy),
    legs(lg),
    [HEAD_U, 0, b],
    [rowsOf(TRUNK_U, 0, 4), 0, 7 + b],
    [cloak, 0, 12 + b],
    back && [RUN_ARM_U_BACK, 0, 9 + b],
    sheath(0, b),
  ];
  const body = (st: readonly string[], b: number, hx: number, lean: number, trunk = TRUNK_U_NR): Item[] => [
    legs(st),
    [HEAD_U, hx, b],
    [shear(trunk, [lean, lean, lean, 0]), 0, 7 + b],
  ];
  return {
    idle: [rest(), breath(), breath(true), rest(true)],
    run: [
      run(RUN_LEGS_U.contactR, 0, RUN_CLOAK_U.a, true, 1, -1),
      run(RUN_LEGS_U.downR, 1, RUN_CLOAK_U.b, true, 1, -1),
      run(RUN_LEGS_U.passR, -1, RUN_CLOAK_U.c, false, 0, 0),
      run(RUN_LEGS_U.contactL, 0, RUN_CLOAK_U.b, false, -1, 1),
      run(RUN_LEGS_U.downL, 1, RUN_CLOAK_U.a, false, -1, 1),
      run(RUN_LEGS_U.passL, -1, RUN_CLOAK_U.c, false, 0, 0),
    ],
    atkA: [
      // wind-up: coiled to his right (our right), the arm back, the blade drawn back towards us
      [shield(2, 1), ...body(STANCE_U.wide, 1, 1, 1), [['A.', '.A'], 12, 8], blade(14, 10, 2, 9), [['.r', 'rR', 'R.'], 2, 11]],
      // swing: the blade sweeps up in front of him, beyond his head; his right shoulder turned away
      [blade(12, 4, 13, 9, 'S'), shield(1, 1), ...body(STANCE_U.stepR, 1, 0, 0), [['A', 'A', 'A', 'R'], 12, 5], [['C.', 'CC'], 11, 12]],
      // follow-through: across to our left, leaning after it
      [blade(4, 7, 8, 9, ''), shield(-1, 1), ...body(STANCE_U.wide, 1, -1, -1), [['.R', 'RCC', 'CC.'], 11, 11]],
      // recover: the blade lowered at his right side
      [shield(0, 1), ...body(STANCE_U.wide, 1, 0, 0), [['A', 'R'], 12, 9], blade(13, 11, 3, 8)],
    ],
    atkB: [
      // wind-up: the arm across in front of him, the blade back on our left, towards us
      [blade(4, 8, 7, 9, ''), shield(-1, 1), ...body(STANCE_U.wide, 1, -1, -1), [['.R', 'RCC', 'CC.'], 11, 11]],
      // swing: up in front of him, beyond his head on our left
      [blade(5, 4, 11, 9, ''), shield(1, 1), ...body(STANCE_U.stepR, 1, 0, 0)],
      // follow-through: out to our right, the arm flung wide
      [shield(1, 0), ...body(STANCE_U.stepR, 1, 1, 1), [['AA'], 12, 8], blade(14, 8, 15, 8), [['.r', 'rR', 'R.'], 2, 11]],
      [shield(0, 1), ...body(STANCE_U.wide, 1, 0, 0), [['A', 'R'], 12, 9], blade(13, 11, 2, 8)],
    ],
    atkC: [
      // raise high: stretched, the arm up beside his head, the blade cocked back over his right shoulder
      [shield(-1, 0), legs(STANCE_U.toes), [HEAD_U, 0, -1], [TRUNK_U_NR, 0, 6], [rowsOf(TRUNK_U_NR, 5), 0, 12], [['.A', 'A.', 'A.', 'A.', 'A.', 'A.', 'A.', 'A.'], 11, -1], blade(11, -2, 3, 9)],
      // chop: over and down in front of him, beyond his head
      [blade(8, 3, 12, 9, ''), shield(-1, 1), ...body(STANCE_U.stepR, 1, 0, 0), [['A', 'A', 'A'], 12, 5]],
      // impact: crouched low, the blade down on the ground in front of him
      [blade(8, 6, 12, 6, ''), shield(-1, 4), legs(STANCE_U.squat), [HEAD_U, 0, 3], [skipRows(TRUNK_U_NR, [4]), 0, 10], [['.r........C.', 'rR........CC'], 2, 9]],
      [blade(8, 5, 12, 6, ''), shield(-1, 3), legs(STANCE_U.wide), [HEAD_U, 0, 2], [skipRows(TRUNK_U_NR, [4]), 0, 9]],
      [shield(0, 1), ...body(STANCE_U.wide, 1, 0, 0), [['A', 'R'], 12, 9], blade(13, 11, 3, 8)],
    ],
    guard: [
      // the shield held out in front of him, away from us: only its rim shows, high on our left
      [[SHIELD_U, 1, 6, 'shield'], legs(STANCE_U.wide), [HEAD_U, 0, 1], [TRUNK_U, 0, 8], [['.a.', 'r..'], 2, 7]],
      [[SHIELD_GUARD_U, 0, 3, 'shield'], legs(STANCE_U.wide), [HEAD_U, 0, 1], [TRUNK_U, 0, 8], [['.a.', 'ra.', 'r..'], 2, 6]],
    ],
    roll: [
      [shield(0, 3), legs(STANCE_U.squat), [HEAD_U, 0, 3], [skipRows(TRUNK_U_NR, [4]), 0, 10]],
      // tuck: the head goes down in front of him, out of sight; the back humps up
      [shield(-1, 5), legs(TUCK_U), [rowsOf(HEAD_U, 0, 2), 0, 8]],
      [shield(-1, 6), legs(BALL_U[0])],
      [shield(-1, 6), legs(BALL_U[1])],
      [shield(0, 4), legs(STANCE_U.squat), [HEAD_U, 0, 4], [skipRows(TRUNK_U_NR, [4]), 0, 10]],
      [shield(-1, 1), legs(STANCE_U.wide), [HEAD_U, 0, 2], [TRUNK_U, 0, 9]],
    ],
    hurt: [
      // recoil: thrown back towards us, the head back, the arms flung out
      [shield(-2, -2), legs(LEGS_U.a), [TRUNK_U_NR, 0, 7], [HEAD_U, 0, 1], [['..S', '.A.', 'A..'], 12, 5]],
      [shield(-1, 1), legs(STANCE_U.wide), [HEAD_U, 0, 1], [TRUNK_U, 0, 8]],
    ],
    death: [
      [shield(-3, -3), legs(LEGS_U.b), [TRUNK_U_NR, 0, 7], [HEAD_U, 0, 1], [['...S', '..A.', 'AA..'], 12, 4]],
      [shield(-1, 3), legs(KNEEL.up), [HEAD_U, 0, 3], [TRUNK_U, 0, 9]],
      // toppling over to our right off his knees
      [shield(1, 4), legs(KNEEL.up), [HEAD_U, 3, 3], [shear(TRUNK_U_NR, [3, 3, 2, 2, 1, 0]), 0, 9], [['A.', '.S'], 14, 12]],
      ...LIE,
    ],
  };
}

// ------------------------------------------------------------------ from the side

function framesSide(): Anims {
  const sheath = (dx: number, dy: number): Put => [SHEATH_S, dx, 10 + dy, 'sheath'];
  const shield = (dx: number, dy: number): Put => [SHIELD_S, dx, 10 + dy, 'shield'];
  const rest = (lift = false): Frame => [shield(0, 0), [LEGS_S.stand, 0, 13], lift && [['...__...........'], 0, 13], lift && [['...CC...........'], 0, 12], [TRUNK_S, 0, 7], [ARM_S.stand, 0, 8], sheath(0, 0), [HEAD_S, 0, 0]];
  const breath = (lift = false): Frame => [shield(0, 0), [LEGS_S.stand, 0, 13], lift && [['...__...........'], 0, 13], lift && [['...CC...........'], 0, 12], ...breathe(TRUNK_S, 0, 7, 2), [ARM_S.stand, 0, 7], [ARM_S.stand, 0, 8], sheath(0, 0), [HEAD_S, 0, -1], !lift && [['......H.........'], 0, 6]];
  /** `front`: the near leg is the one behind him or coming through, so the legs go over the cloak */
  const run = (lg: readonly string[], b: number, arm: readonly string[], cloak: readonly string[], sdx: number, front = false): Frame => [
    shield(sdx, b),
    [cloak, 0, 8 + b],
    !front && legs(lg),
    [TRUNK_S, 0, 7 + b],
    front && legs(lg),
    [arm, 0, 8 + b],
    sheath(1, b),
    [HEAD_S, 1, b],
  ];
  /** a body from the side: the trunk `b` rows down, its top leaning `lean` columns, the head at (hx, hy) */
  const body = (st: readonly string[], b: number, lean: number, trunk = TRUNK_S): Item[] => [
    legs(st),
    [shear(trunk, [lean, lean, lean, Math.round(lean / 2), 0]), 0, 7 + b],
  ];
  const head = (hx: number, hy: number): Put => [HEAD_S, hx, hy];
  return {
    idle: [rest(), breath(), breath(true), rest(true)],
    run: [
      run(RUN_LEGS_S.contactR, 0, RUN_ARM_S.back, RUN_CLOAK_S.a, 1),
      run(RUN_LEGS_S.downR, 1, RUN_ARM_S.back, RUN_CLOAK_S.b, 1),
      run(RUN_LEGS_S.passR, -1, RUN_ARM_S.mid, RUN_CLOAK_S.b, 0),
      run(RUN_LEGS_S.contactL, 0, RUN_ARM_S.fwd, RUN_CLOAK_S.a, -2),
      run(RUN_LEGS_S.downL, 1, RUN_ARM_S.fwd, RUN_CLOAK_S.b, -2, true),
      run(RUN_LEGS_S.passL, -1, RUN_ARM_S.mid, RUN_CLOAK_S.b, 0, true),
    ],
    atkA: [
      // wind-up: leaning back, coiled, the sword raised high behind his head, the shield forward
      [shield(2, 0), ...body(STANCE_S.back, 1, -1), blade(2, 4, 10, 9), [['ba....', '.ba...', '..ba..', '...ba.', '....ba'], 2, 5], head(-1, 1)],
      // swing: a step in, the arm thrown out level, the blade straight out in front
      [shield(-2, 1), ...body(STANCE_S.lunge, 1, 1), head(1, 1), [['bbar', '.aa.'], 8, 9], blade(12, 9, 0, 9)],
      // follow-through: down and through, low in front of him, leaning after it
      [[['...RR', '.RRRC', 'RRCC.'], 3, 9], shield(-2, 2), ...body(STANCE_S.deep, 2, 2), head(2, 2), [['bb...', '.abr.'], 9, 10], blade(13, 12, 3, 9)],
      // recover: the weight back over his feet, the blade lowered in front
      [shield(0, 1), ...body(STANCE_S.ready, 0, 0), head(0, 0), [rowsOf(ARM_S.fwd, 0, 2), 0, 8], blade(10, 11, 2, 8)],
    ],
    atkB: [
      // wind-up: coiled low, the blade down behind his near leg
      [shield(-1, 2), ...body(STANCE_S.back, 2, 1), head(1, 2), [['.......ba', '......ba.', '......rb.'], 0, 10], blade(6, 13, 6, 9)],
      // swing: rising up in front of him
      [shield(-2, 0), ...body(STANCE_S.lunge, 1, 1), head(1, 1), [['bbar', '.aa.'], 8, 9], blade(12, 9, 15, 9)],
      // follow-through: up high, the arm up past his face, stretched on his toes
      [shield(1, -1), legs(STANCE_S.toes), [shear(TRUNK_S, [-1, -1, -1, 0]), 0, 6], [rowsOf(TRUNK_S, 4), 0, 11], head(-2, -1),
        [['....r', '....b', '...ba', '...b.', '.bb..', 'ba...'], 7, 2], blade(12, 1, 13, 8)],
      [shield(0, 1), ...body(STANCE_S.ready, 0, 0), head(0, 0), [rowsOf(ARM_S.fwd, 0, 2), 0, 8], blade(10, 11, 2, 8)],
    ],
    atkC: [
      // raise high: on his toes, the arm straight up behind his head, the blade cocked back over it
      [shield(2, -1), legs(STANCE_S.toes), [TRUNK_S, 0, 6], [rowsOf(TRUNK_S, 4), 0, 11], blade(3, -2, 9, 9),
        [['.b..', 'ba..', 'ba..', 'ba..', 'ba..', '.ba.', '.ba.', '..ba'], 2, -1], head(-1, -1)],
      // chop: a step in, the blade level in front of his face
      [shield(-1, 0), ...body(STANCE_S.lunge, 1, 1), head(0, 1), [['...r', '..ba', '.ba.', 'ba..'], 9, 6], blade(13, 5, 0, 8)],
      // impact: crouched low, the blade down to the ground in front of him
      [[['...RR', '.RRRC', 'RRCC.'], 4, 8], shield(-1, 3), legs(STANCE_S.deep), [shear(TRUNK_S_LOW, [2, 2, 1, 0]), 0, 10], head(2, 3), [['bb.', '.br'], 10, 11], blade(13, 13, 3, 8)],
      // recover: still low, the blade resting forward, then up again
      [shield(-1, 2), legs(STANCE_S.lunge), [shear(TRUNK_S, [1, 1, 1, 0]), 0, 8], head(1, 2), [['bb.', '.br'], 9, 10], blade(12, 12, 2, 9)],
      [shield(0, 1), ...body(STANCE_S.ready, 0, 0), head(0, 0), [rowsOf(ARM_S.fwd, 0, 2), 0, 8], blade(10, 11, 2, 8)],
    ],
    guard: [
      [legs(STANCE_S.ready), [TRUNK_S, 0, 8], [ARM_S.stand, 0, 9], sheath(0, 1), head(0, 1), [SHIELD_S, 2, 9, 'shield']],
      [legs(STANCE_S.back), [shear(TRUNK_S, [-1, -1, -1, 0]), 0, 8], [ARM_S.stand, -1, 9], sheath(0, 1), head(-1, 1), [SHIELD_GUARD_S, 10, 5, 'shield']],
    ],
    roll: [
      // crouch: down low, leaning in, the arm reaching forward
      [shield(-1, 3), legs(STANCE_S.deep), [shear(TRUNK_S_LOW, [2, 2, 1, 0]), 0, 10], head(2, 3), [['bb.', '.as'], 10, 11]],
      // tuck: bent double, the head going down in front of his knees
      [shield(1, 4), [rowsOf(HEAD_U, 0, 4), 4, 9], legs(TUCK_S)],
      // the ball turning over
      [shield(2, 5), legs(BALL_S[0])],
      [shield(-1, 5), legs(BALL_S[1])],
      // unfold: the feet come down in front of him, the head comes up
      [shield(-1, 3), legs(STANCE_S.deep), [shear(TRUNK_S_LOW, [1, 1, 0]), 0, 10], head(1, 4), [['bb.', '.as'], 9, 11]],
      // land: crouched, steadying himself
      [shield(0, 2), legs(STANCE_S.lunge), [shear(TRUNK_S, [1, 1, 0]), 0, 8], head(1, 2), [['ba.', '.ba', '.rs'], 8, 9]],
    ],
    hurt: [
      // recoil: thrown back, the head back, the arms flung forward after the blow, up on his heels
      [shield(3, -2), legs(STANCE_S.heels), [shear(TRUNK_S, [-2, -2, -1, -1, 0]), 0, 7], head(-2, 0), [['...s', '..ba', '.ba.', 'ba..'], 6, 6]],
      // catch: crouched, the weight forward again
      [shield(0, 2), legs(STANCE_S.back), [shear(TRUNK_S, [1, 1, 0]), 0, 8], head(1, 1), [['ba.', '.ba', '.rs'], 8, 9]],
    ],
    death: [
      [shield(4, -3), legs(STANCE_S.heels), [shear(TRUNK_S, [-3, -2, -2, -1, 0]), 0, 7], head(-3, 0), [['....s', '...ba', '..ba.', '.ba..', 'ba...'], 5, 5]],
      // on his knees, bowed
      [shield(1, 3), legs(KNEEL.side), [shear(TRUNK_S, [1, 1, 0]), 0, 9], head(2, 3), [['ba', 'ba', 'rb', 'ss'], 9, 10]],
      // pitching forward off his knees, the arm going out to the ground
      [shield(3, 5), legs(KNEEL.side), [shear(skipRows(TRUNK_S, [4]), [4, 3, 2, 1, 0]), 0, 10], head(4, 6), [['ba..', '.ba.', '..as'], 9, 12]],
      ...LIE,
    ],
  };
}

// ------------------------------------------------------------------ the sheet

/** Until an animation is drawn, its frames repeat the first idle frame. */
function fill(a: Anims): Anims {
  const out = {} as Anims;
  for (const k of Object.keys(ANIMS) as HeroAnim[]) out[k] = Array.from({ length: ANIMS[k].frames }, (_, i) => a[k][i] ?? a.idle[0]);
  return out;
}

const FRAMES: Record<HeroView, Anims> = { down: fill(framesDown()), up: fill(framesUp()), side: fill(framesSide()) };

/** Which idle frame the bare sheet shows where the armed one strikes or guards. */
const BARE_STANDS_IN: Partial<Record<HeroAnim, number[]>> = {
  atkA: [0, 0, 0, 0],
  atkB: [0, 0, 0, 0],
  atkC: [0, 0, 0, 0, 0],
  guard: [0, 0],
};

function frameOf(anim: HeroAnim, view: HeroView, i: number, armed: boolean): Frame {
  const stand = armed ? undefined : BARE_STANDS_IN[anim];
  return stand ? FRAMES[view].idle[stand[i]] : FRAMES[view][anim][i];
}

/** One frame as letter rows (CELL.w x CELL.h). */
export function samborRows(anim: HeroAnim, view: HeroView, i: number, armed: boolean): string[] {
  return compose(frameOf(anim, view, i, armed), armed).rows;
}

/** One frame, coloured and lined. */
export function samborFrame(anim: HeroAnim, view: HeroView, i: number, armed: boolean): PixelBuffer {
  return paintRows(samborRows(anim, view, i, armed), CELL.w, CELL.h, SAMBOR_PAL, SAMBOR_INK, true, `sambor ${anim} ${view} ${i}`);
}

type Strike = 'atkA' | 'atkB' | 'atkC';

/**
 * Where the tip of the blade is in every frame of the strikes: cell coordinates (x, y) in the 32 x 32 cell, the
 * side view facing right (mirror x for left: CELL.w - 1 - x). One entry per frame of the animation.
 */
export const BLADE_TIP: Record<Strike, Record<HeroView, [number, number][]>> = (() => {
  const out = {} as Record<Strike, Record<HeroView, [number, number][]>>;
  for (const a of ['atkA', 'atkB', 'atkC'] as Strike[]) {
    out[a] = { down: [], up: [], side: [] };
    for (const v of ['down', 'up', 'side'] as HeroView[])
      for (let i = 0; i < ANIMS[a].frames; i++) out[a][v].push(compose(FRAMES[v][a][i], true).tip ?? [CELL.cx, CELL.foot - 9]);
  }
  return out;
})();
