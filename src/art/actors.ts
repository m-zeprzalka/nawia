// Everyone who walks, drawn on the grid: one 16x16 tile each, the way the 8- and 16-bit classics did it.
// The guardian is 2x2 tiles. The sword is its own sprite, laid next to the hero when he swings.
//
// House style:
//  - light falls from the upper left, like on everything else in the game;
//  - sprites are drawn with one dark outline colour ('o'), which `softOutline` then tints with whatever
//    it borders: hair gets a brown edge, cloth a wine one. Softer than a black line, still readable on grass;
//  - heads are about half the figure, eyes two pixels apart: a young man, not a baby.
//
// The hero is assembled from parts (upper body, legs, shield) so every pose stays consistent
// and new poses (a bow, later) are a few lines, not a redraw.

import { PixelBuffer, fromAscii, rgb, type Color } from '../core/PixelBuffer.ts';
import { hash2 } from '../core/rng.ts';
import { INK, PAL } from './palette.ts';
import { art, grid, softOutline, type Sheet } from './sheet.ts';

/** A breathing frame for free: everything above the feet sinks by one pixel. */
function squash(rows: string[]): string[] {
  const n = rows.length;
  return ['.'.repeat(rows[0].length), ...rows.slice(0, n - 3), rows[n - 2], rows[n - 1]];
}

// =============================================================== the hero
// 16x16 cells. Rows: facing down, up, side (right; left is a flip).
// Columns: stand, walk A, walk B, strike (wind-up), strike (follow-through), guard, 2 spare.

export const HERO = {
  fw: 16, fh: 16, cols: 8,
  STAND: 0, WALK_A: 1, WALK_B: 2, ATK0: 3, ATK1: 4, GUARD: 5,
  DOWN: 0, UP: 1, SIDE: 2,
} as const;

const HP: Record<string, Color> = {
  o: INK.outline,
  h: INK.hair, H: INK.hairDark, l: INK.hairLight,
  s: INK.skin, S: INK.skinDark, e: INK.eye,
  r: INK.band, R: INK.bandDark,
  t: INK.tunic, T: INK.tunicDark,
  c: INK.cloak, C: INK.cloakDark, k: INK.cloakLight,
  b: INK.belt, y: INK.buckle,
  p: INK.trousers, P: INK.trousersDark,
  n: INK.boot, N: INK.bootDark,
  w: INK.shieldRim, W: INK.shieldRimDark, d: INK.shieldRed, D: INK.shieldRedDark,
  m: INK.shieldCream, M: INK.shieldCreamDark, i: INK.iron, I: INK.ironMid,
};

type Dir3 = 'down' | 'up' | 'side';
type Pose = 'stand' | 'walkA' | 'walkB' | 'atk0' | 'atk1' | 'guard';

/** Head and torso: rows 0-11 of the cell. */
const UPPER: Record<Dir3, string[]> = {
  down: art(16, [
    '.....oooooo.....',
    '....olllhhho....',
    '...olhhhhhhHo...',
    '...orrrrrrrRo...',
    '...ohhsssshHo...',
    '...ohsessesHo...',
    '...oSsessesSo...',
    '....ossSSsso....',
    '...octtttttco...',
    '..osttttttttso..',
    '..oobbbyybbboo..',
    '...ottttttTTo...',
  ]),
  up: art(16, [
    '.....oooooo.....',
    '....olllhhho....',
    '...olhhhhhhHo...',
    '...orrrrrrrRo...',
    '...ohhhhhhhHo...',
    '...ohhhhhhHHo...',
    '...oHhhhhhHHo...',
    '....oHHHHHHo....',
    '...ockcccccCo...',
    '..osckccccCCso..',
    '..oockccccCCoo..',
    '...ockcccCCCo...',
  ]),
  side: art(16, [
    '.....oooooo.....',
    '....olllhhho....',
    '...olhhhhhhho...',
    '.oorrrrrrrrro...',
    'oRRohhhhsssso...',
    '.ooRoHhhsseso...',
    '...ooHhhssesso..',
    '.....oHsssSso...',
    '....occtttto....',
    '...occcttttso...',
    '...oCccbbbyo....',
    '...oCCcttTTo....',
  ]),
};

/** Hem, hips and boots: rows 12-15 of the cell. */
const LEGS: Record<Dir3, Record<'stand' | 'a' | 'b', string[]>> = {
  down: {
    stand: art(16, ['...orRrrrrRro...', '...opppoopppo...', '...onnNoonnNo...', '....ooo..ooo....']),
    a: art(16, ['...orRrrrrRro...', '...opppoonnNo...', '...onnNo.ooo....', '....ooo.........']),
    b: art(16, ['...orRrrrrRro...', '...onnNoopppo...', '....ooo.onnNo...', '.........ooo....']),
  },
  up: {
    stand: art(16, ['...oCcCccCcCo...', '...opppoopppo...', '...onnNoonnNo...', '....ooo..ooo....']),
    a: art(16, ['...oCcCccCcCo...', '...opppoonnNo...', '...onnNo.ooo....', '....ooo.........']),
    b: art(16, ['...oCcCccCcCo...', '...onnNoopppo...', '....ooo.onnNo...', '.........ooo....']),
  },
  side: {
    stand: art(16, ['...oCcrrrro.....', '....oppoppo.....', '....onnonnNo....', '....ooo.oooo....']),
    a: art(16, ['...oCcrrrro.....', '...oppoooppo....', '..onnNo..onnNo..', '..oooo....oooo..']),
    b: art(16, ['...oCcrrrro.....', '.....opppo......', '.....onnNo......', '......ooo.......']),
  },
};

/** The round shield as it hangs on his arm... */
const SHIELD_ROUND = fromAscii(art(6, ['.oooo.', 'owddwo', 'odmmdo', 'odmiDo', 'owdDwo', '.oooo.']), HP);
/** ...held out in front of him, seen from the front... */
const SHIELD_FRONT = fromAscii(art(8, ['..oooo..', '.owddwo.', 'owdmmdwo', 'odmiimDo', 'odmiiMDo', 'owdmMDwo', '.owDDwo.', '..oooo..']), HP);
/** ...and edge-on. */
const SHIELD_EDGE = fromAscii(art(4, ['.oo.', 'owwo', 'owdo', 'omdo', 'omdo', 'owDo', 'owWo', '.oo.']), HP);

/**
 * Looks to try on. Each one keeps the body and swaps the head (rows 0-7 of the cell) and some colours,
 * so every look has every pose for free. Press H in the game to cycle through them.
 */
export interface HeroLook {
  /** texture key of its sheet */
  key: string;
  name: { pl: string; en: string };
  pal: Record<string, Color>;
  heads: Record<Dir3, string[]> | null;
}

const STRAW: Record<string, Color> = { j: rgb(0xecca62), J: rgb(0xbb963c), q: rgb(0x7a4a2c), Q: rgb(0x55331f) };

export const HERO_LOOKS: HeroLook[] = [
  { key: 'hero', name: { pl: 'Wojak', en: 'Warrior' }, pal: {}, heads: null },
  {
    key: 'hero1',
    name: { pl: 'Pastuszek', en: 'Shepherd boy' },
    // a straw hat with a red ribbon, a brown sheepskin on his back
    pal: { ...STRAW, c: rgb(0x8f6238), C: rgb(0x63402a), k: rgb(0xb4844c) },
    heads: {
      down: art(16, [
        '.....oooooo.....',
        '....ojjjjjjo....',
        '....orrrrrro....',
        '.oooJjjjjjjJooo.',
        '.ojjjjjjjjjjjjo.',
        '..ooqsessesqoo..',
        '...oSsessesSo...',
        '....ossSSsso....',
      ]),
      up: art(16, [
        '.....oooooo.....',
        '....ojjjjjjo....',
        '....orrrrrro....',
        '.oooJjjjjjjJooo.',
        '.ojjjjjjjjjjjjo.',
        '..ooqqqqqqqqoo..',
        '...oQqqqqqqQo...',
        '....oQQQQQQo....',
      ]),
      side: art(16, [
        '.....oooooo.....',
        '....ojjjjjjo....',
        '....orrrrrro....',
        '.oooJjjjjjjjooo.',
        '.ojjjjjjjjjjjjo.',
        '..oooqqssseso...',
        '....oqqsssesso..',
        '.....oqsssSso...',
      ]),
    },
  },
  {
    key: 'hero2',
    name: { pl: 'Góral', en: 'Highlander' },
    // a fur cap, dark hair, a pale sheepskin coat
    pal: {
      f: rgb(0x5c4236), F: rgb(0x80604c), q: rgb(0x33262a), Q: rgb(0x1f171c),
      c: rgb(0xdccba2), C: rgb(0xa9976e), k: rgb(0xf2e7c4), r: rgb(0x9a3038), R: rgb(0x6e2230),
    },
    heads: {
      down: art(16, [
        '....oooooooo....',
        '...offfFffFfo...',
        '...ofFfffFffo...',
        '...offfffffFo...',
        '...oqqssssqqo...',
        '...oqsessesqo...',
        '...oSsessesSo...',
        '....ossSSsso....',
      ]),
      up: art(16, [
        '....oooooooo....',
        '...offfFffFfo...',
        '...ofFfffFffo...',
        '...offfffffFo...',
        '...oqqqqqqqqo...',
        '...oqqqqqqqQo...',
        '...oQqqqqqQQo...',
        '....oQQQQQQo....',
      ]),
      side: art(16, [
        '....oooooooo....',
        '...offfFffFfo...',
        '...ofFfffFffo...',
        '...offfffffFo...',
        '...oqqqqsssso...',
        '....oqqqsseso...',
        '....oqqqssesso..',
        '.....oqsssSso...',
      ]),
    },
  },
  {
    key: 'hero3',
    name: { pl: 'Wędrowiec', en: 'Wanderer' },
    // a blue-grey hood and short cape, a red scarf at the chin
    pal: {
      u: rgb(0x4d6f90), U: rgb(0x2f4862), v: rgb(0x7092b2), q: rgb(0x7a4a2c),
      c: rgb(0x4d6f90), C: rgb(0x2f4862), k: rgb(0x7092b2),
    },
    heads: {
      down: art(16, [
        '.....oooooo.....',
        '....ovuuuuUo....',
        '...ovuuuuuuUo...',
        '...ouuqqqquUo...',
        '...ouqssssqUo...',
        '...ousesseSUo...',
        '...oUsessesUo...',
        '....oUrrrrUo....',
      ]),
      up: art(16, [
        '.....oooooo.....',
        '....ovuuuuUo....',
        '...ovuuuuuuUo...',
        '...ouuuuuuuUo...',
        '...ouuuuuuuUo...',
        '...ouuuuuuUUo...',
        '...oUuuuuuUUo...',
        '....oUUUUUUo....',
      ]),
      side: art(16, [
        '.....oooooo.....',
        '....ovuuuuUo....',
        '...ovuuuuuuuo...',
        '...ouuuuuqquo...',
        '...ouuuuqssso...',
        '....oUuuqseso...',
        '....oUuuqsesso..',
        '.....oUrrrrso...',
      ]),
    },
  },
];

function heroFrame(look: HeroLook, dir: Dir3, pose: Pose): PixelBuffer {
  const b = new PixelBuffer(16, 16);
  const pal = { ...HP, ...look.pal };
  const striking = pose === 'atk0' || pose === 'atk1';
  const legs = fromAscii(LEGS[dir][pose === 'walkA' || striking ? 'a' : pose === 'walkB' ? 'b' : 'stand'], pal);
  const upper = fromAscii(look.heads ? [...look.heads[dir], ...UPPER[dir].slice(8)] : UPPER[dir], pal);
  // contact frames dip, behind the shield he crouches, a strike leans into the blow
  let dx = 0;
  let dy = pose === 'walkA' || pose === 'walkB' || pose === 'guard' ? 1 : 0;
  if (pose === 'atk1') {
    if (dir === 'side') dx = 1;
    else if (dir === 'down') dy = 1;
  }

  if (dir === 'up') {
    // seen from behind, his shield is on the far side of him
    b.blit(SHIELD_ROUND, pose === 'guard' ? 2 : 0, pose === 'guard' ? 4 : 7 + dy);
    b.blit(legs, 0, 12);
    b.blit(upper, dx, dy);
  } else if (dir === 'down') {
    b.blit(legs, 0, 12);
    b.blit(upper, dx, dy);
    if (pose === 'guard') b.blit(SHIELD_FRONT, 4, 7);
    else b.blit(SHIELD_ROUND, 9, 7 + dy);
  } else {
    b.blit(legs, 0, 12);
    b.blit(upper, dx, dy);
    if (pose === 'guard') b.blit(SHIELD_EDGE, 11, 5);
    else b.blit(SHIELD_ROUND, striking ? 4 : 7, 7 + dy);
  }
  return softOutline(b, INK.outline);
}

/**
 * The hero as a figure in a landscape: seen from behind, cloak, shield on his arm, sword point-down.
 * Only its outline matters (the title picture paints it as a silhouette). 32x32 card, soles on row 30.
 */
export function heroFromBehind(): PixelBuffer {
  const rows = art(18, [
    '.......####.......',
    '......######......',
    '......######......',
    '......######......',
    '.......####.......',
    '.....########.....',
    '....##########....',
    '...############...',
    '.###############..',
    '#####.#########.#.',
    '#####.#########.#.',
    '#####.#########.#.',
    '#####.#########.#.',
    '.###..#########.#.',
    '......#########.#.',
    '......#########.#.',
    '......#########.#.',
    '.....##########.#.',
    '.....#####.####.#.',
    '......###..###..#.',
    '......###..###..#.',
    '......###..###....',
    '......###..###....',
    '.....####..####...',
  ]);
  const card = new PixelBuffer(32, 32);
  card.blit(fromAscii(rows, { '#': INK.outline }), 7, 31 - rows.length);
  return card;
}

function heroSheet(look: HeroLook): Sheet {
  const poses: (Pose | null)[] = ['stand', 'walkA', 'walkB', 'atk0', 'atk1', 'guard', null, null];
  const frames: (PixelBuffer | null)[] = [];
  for (const dir of ['down', 'up', 'side'] as Dir3[]) for (const p of poses) frames.push(p ? heroFrame(look, dir, p) : null);
  return grid(look.key, HERO.fw, HERO.fh, HERO.cols, frames);
}

// =============================================================== the people of the village
// 16x16 cells, two frames each (they breathe). They only ever face you.

export const FOLK = { fw: 16, fh: 16, cols: 8, herbalist: 0, elder: 2, woman: 4, child: 6 } as const;

const FP: Record<string, Color> = {
  ...HP,
  g: rgb(0x3f7f6c), G: rgb(0x2a5548), // the herbalist's scarf
  w: rgb(0xf2efe6), W: rgb(0xc9c4b8), // white hair, linen
  d: rgb(0x80573a), D: rgb(0x573826), // brown wool
  a: rgb(0xe9dfc6), A: rgb(0xbdb198), // apron
  v: rgb(0x6fae4a), // a sprig of herbs
  B: rgb(0x8a5c34), // staff
  q: rgb(0x7a4a2c), Q: rgb(0x55331f), // dark hair
};

const HERBALIST = art(16, [
  '.....oooooo.....',
  '....oggggggo....',
  '...ogggggggGo...',
  '...ogwsssswGo...',
  '...ogsesseSGo...',
  '...oGssssssGo...',
  '....oGsSSsGo....',
  '...oogggggGoo...',
  '.vodddaaaadddo..',
  'vvosddaaaaddso..',
  '.voodDaaaaDdoo..',
  '...odDaaaaDdo...',
  '...odDaaaADdo...',
  '...odDDaaADDo...',
  '...oDDDDDDDDo...',
  '....oooooooo....',
]);
const ELDER = art(16, [
  '.....oooooo.....',
  '....osssssso.oo.',
  '...owsssssswoBo.',
  '...owsesseswoBo.',
  '...owsssssswoBo.',
  '...owwwSSwwwoBo.',
  '....owwwwwwooBo.',
  '...ottwwwwttoBo.',
  '..otttwwwwtttso.',
  '..ostttwwtttoBo.',
  '..oottttttttoBo.',
  '...otttttttToBo.',
  '...otttttttToBo.',
  '...ottttttTToBo.',
  '...oTTTTTTTToBo.',
  '....oooooooo.o..',
]);
const WOMAN = art(16, [
  '.....oooooo.....',
  '....orrrrrro....',
  '...orrrrrrrRo...',
  '...oqqssssqqo...',
  '...oqsessesqo...',
  '...oqssssssqo...',
  '..oqoosSSsooqo..',
  '..oqowwwwwwoqo..',
  '..oowwrwwrwwoo..',
  '..oswwwwwwwwso..',
  '...obbbbbbbbo...',
  '...orrRrrRrro...',
  '...orrRrrRrro...',
  '..orrrRrrRrrro..',
  '..oRRRRRRRRRRo..',
  '...oooooooooo...',
]);
const CHILD = art(16, [
  '................',
  '................',
  '................',
  '.....oooooo.....',
  '....ollhhhho....',
  '...olhhhhhhHo...',
  '...ohhsssshHo...',
  '...ohsessesso...',
  '...osssssssso...',
  '....ossSSsso....',
  '....otttttto....',
  '...osttttttso...',
  '...oottttttoo...',
  '....otTttTto....',
  '....oppooppo....',
  '....ooo..ooo....',
]);

function folkSheet(): Sheet {
  const frames: PixelBuffer[] = [];
  for (const rows of [HERBALIST, ELDER, WOMAN, CHILD]) for (const r of [rows, squash(rows)]) frames.push(softOutline(fromAscii(r, FP), INK.outline));
  return grid('folk', FOLK.fw, FOLK.fh, FOLK.cols, frames);
}

// =============================================================== the sword
// 16x16 cells, 8 of them: the blade pointing N, NE, E, SE, S, SW, W, NW.
// The grip sits at (7.5, 11.5) in the N frame and at (3.5, 11.5) in the NE frame.

export const SWORD = { fw: 16, fh: 16, cols: 8, N: 0, NE: 1, E: 2, SE: 3, S: 4, SW: 5, W: 6, NW: 7 } as const;

/** The hag stone in the pommel: a speck of the other side's light. */
const HAG = rgb(0x9af4ff);

function swordFrame(diagonal: boolean): PixelBuffer {
  const b = new PixelBuffer(16, 16);
  if (!diagonal) {
    b.set(7, 1, INK.steel);
    for (let y = 2; y <= 9; y++) {
      b.set(7, y, INK.steel);
      b.set(8, y, y === 2 ? INK.steel : INK.steelMid);
    }
    for (let x = 5; x <= 10; x++) b.set(x, 10, x < 8 ? INK.bronze : INK.bronzeDark);
    b.set(7, 11, INK.belt); b.set(8, 11, INK.bootDark);
    b.set(7, 12, INK.belt); b.set(8, 12, INK.bootDark);
    b.set(7, 13, HAG); b.set(8, 13, rgb(0x3db6c6));
  } else {
    for (let t = 0; t <= 7; t++) {
      b.set(6 + t, 9 - t, INK.steel);
      if (t > 0) b.set(6 + t, 10 - t, INK.steelMid);
      if (t < 7) b.set(7 + t, 9 - t, INK.steelMid);
    }
    b.set(14, 1, INK.steel);
    // crossguard, at right angles to the blade
    b.set(3, 8, INK.bronze); b.set(4, 9, INK.bronze); b.set(5, 10, INK.bronze); b.set(6, 11, INK.bronzeDark); b.set(7, 12, INK.bronzeDark);
    b.set(4, 8, INK.bronzeDark); b.set(6, 12, INK.bronzeDark);
    b.set(4, 11, INK.belt); b.set(3, 12, INK.belt); b.set(4, 12, INK.bootDark);
    b.set(2, 13, HAG); b.set(3, 13, rgb(0x3db6c6));
  }
  return b.outlined(INK.outline);
}

function swordSheet(): Sheet {
  const frames: PixelBuffer[] = [];
  let n = swordFrame(false);
  let ne = swordFrame(true);
  for (let i = 0; i < 4; i++) {
    frames.push(n, ne);
    n = n.rotateCW();
    ne = ne.rotateCW();
  }
  return grid('sword', SWORD.fw, SWORD.fh, SWORD.cols, frames);
}

// =============================================================== enemies
// 16x16 cells, 4 per row.
// Row 0: utopiec (2 idle, lunge)      Row 1: zjawa (2 idle, swoop)      Row 2: ognik (4 frames of flame)
// Row 3: strzyga, body (2 idle, pounce)   Row 4: strzyga, second soul   Row 5: the guardian's heart (2 shielded, 2 bare)

// Row 6: dzik (2 running, charge)   Row 7: wilk (2 running, pounce)   Row 8: morownik (2 closed, open)   Row 9: hen (2 walking)
// Beasts are drawn in profile, facing right; the game flips them.

export const MOB = {
  fw: 16, fh: 16, cols: 4,
  UTOPIEC: 0, ZJAWA: 4, OGNIK: 8, STRZYGA: 12, STRZYGA_N: 16, HEART: 20,
  DZIK: 24, WILK: 28, MOROWNIK: 32, HEN: 36,
} as const;

/** Utopiec: the drowned one. Eyes on top of its head like a frog's, a mouth as wide as its face. */
const UTOPIEC_PAL: Record<string, Color> = {
  o: INK.outline,
  g: rgb(0x5f9a84), G: rgb(0x3a6a62), L: rgb(0x93cdab), b: rgb(0xbcdcae), B: rgb(0x86b088),
  y: rgb(0xf4ea6c), Y: rgb(0xc4aa3a), k: rgb(0x1a1423),
  m: rgb(0x2a1426), w: rgb(0xf0ecd8), a: rgb(0x2f6a3a), A: rgb(0x58a04c),
};
const UTOPIEC_A = art(16, [
  '..ooo......ooo..',
  '.oyyyo....oyyyo.',
  '.oykyooooooykyo.',
  '.oGYyaALLAgyYGo.',
  '.ogLggagggggGGo.',
  '.ogmmmmmmmmmmgo.',
  '.oGgwmwmmwmwgGo.',
  '..oGggggggggGo..',
  '.ooGgbbbbbbgGoo.',
  'ogGoGbbbbbbGoGgo',
  'oLgoGbbBBbbGogGo',
  '.oo.oGbbBBbGo.oo',
  '....oGgooGgo....',
  '...oGgGo.oGgGo..',
  '..oLgGGo.oLgGGo.',
  '..ooooo..ooooo..',
]);
const UTOPIEC_C = art(16, [
  '..ooo......ooo..',
  '.oyyyo....oyyyo.',
  '.oykyooooooykyo.',
  '.oGYyaALLAgyYGo.',
  'oooggggggggggooo',
  'oLgommmmmmmmogLo',
  'ogGomwwwwwwmoGgo',
  '.oGommmmmmmmoGo.',
  '..oGmwwwwwwmGo..',
  '..oGgmmmmmmgGo..',
  '..oGgbbbbbbgGo..',
  '...oGbbBBbbGo...',
  '....oGgooGgo....',
  '...oGgGo.oGgGo..',
  '..oLgGGo.oLgGGo.',
  '..ooooo..ooooo..',
]);

/** Zjawa: a woman of mist. Long hair, holes for eyes, a gown that ends in nothing. */
const ZJAWA_PAL: Record<string, Color> = {
  o: rgb(0x2a1a52),
  h: rgb(0x5a48a0), H: rgb(0x3a2c70),
  a: rgb(0xf6f4ff), b: rgb(0xd2cbf4), c: rgb(0x9d92da), d: rgb(0x6c5eb2),
  k: rgb(0x1c1238), e: rgb(0xff7ad8), m: rgb(0x3a1e5e),
};
const ZJAWA_A = art(16, [
  '......oooo......',
  '....oohhhhoo....',
  '...ohhaaaahho...',
  '...ohakaakaho...',
  '..ohHaeaaeaHho..',
  '..ohHaammaaHho..',
  '..ohHoabbaoHho..',
  '.ohHoabbbbaoHho.',
  '.ohoaabbbbbaoho.',
  '.oo.oabbbbco.oo.',
  '....oabbbcco....',
  '....oabbccdo....',
  '.....oabcdo.....',
  '.....oabcdo.....',
  '......oacdo.....',
  '.......ooo......',
]);
const ZJAWA_B = [
  ...ZJAWA_A.slice(0, 12),
  ...art(16, ['.....oabcdo.....', '......oabcdo....', '.......oacdo....', '........ooo.....']),
];
const ZJAWA_C = art(16, [
  '..oo..oooo..oo..',
  '.ohhoohhhhoohho.',
  '.ohHhhaaaahhHho.',
  '..ohhakaakahho..',
  '..ohHaeaaeaHho..',
  '...ohammmmaho...',
  '...ohammmmaho...',
  '.ooohabbbbahooo.',
  'oaaoabbbbbbaoaao',
  '.oo.oabbbbco.oo.',
  '....oabbbcco....',
  '....oabbccdo....',
  '.....oabcdo.....',
  '....oabcdo......',
  '...oacdo........',
  '....ooo.........',
]);

/** Strzyga: half woman, half owl. Feathered tufts, lamp eyes, a hooked beak, claws. */
const STRZYGA_ROWS = art(16, [
  '..oo........oo..',
  '.ohHo.oooo.oHho.',
  '.oHHHoHhhHoHHHo.',
  '..oHHHHhhHHHHo..',
  '..oHyyyHHyyyHo..',
  '..oHykyssykyHo..',
  '..oHyyynnyyyHo..',
  '..oHHssnnssHHo..',
  '...oHsmttmsHo...',
  '.ooHHdssssdHHoo.',
  'owsoHddddddHoswo',
  'owSoHdDddDdHoSwo',
  '.oo.odDddDdo.oo.',
  '....odDooDdo....',
  '...owso..oswo...',
  '...ooo....ooo...',
]);
const STRZYGA_POUNCE = [
  ...STRZYGA_ROWS.slice(0, 8),
  ...art(16, ['owoHHsmttmsHHowo', 'osoHHdssssdHHoso', '.ooHHddddddHHoo.', '...oHdDddDdHo...', '....odDddDdo....']),
  ...STRZYGA_ROWS.slice(13),
];
type StrzygaForm = 'body' | 'soul';
const STRZYGA_PAL: Record<StrzygaForm, Record<string, Color>> = {
  body: {
    o: INK.outline, H: rgb(0x3d3248), h: rgb(0x64566f), s: rgb(0xcbc4d6), S: rgb(0x9189a6),
    y: rgb(0xf8d44c), k: rgb(0x1a1423), n: rgb(0xd88c3a), m: rgb(0x2a1426), t: rgb(0xf4efe4),
    d: rgb(0x5a2e42), D: rgb(0x38192a), w: rgb(0xf4efe4),
  },
  soul: {
    o: rgb(0x0d102e), H: rgb(0x2e46a0), h: rgb(0x5d7dd6), s: rgb(0xcfe6ff), S: rgb(0x7ea8e6),
    y: rgb(0xffffff), k: rgb(0xff7ad8), n: rgb(0xe08ae8), m: rgb(0x18225a), t: rgb(0xffffff),
    d: rgb(0x3f4fa6), D: rgb(0x26327a), w: rgb(0xffffff),
  },
};

/** Will-o'-the-wisp: marsh light with a face in it. */
const WISP_FIRE = [rgb(0xf6ffe0), rgb(0xc4f47c), rgb(0x6ccc52), rgb(0x2c8a4c), rgb(0x124a34)];

function ognikFrame(f: number): PixelBuffer {
  const b = new PixelBuffer(16, 16);
  const F = WISP_FIRE;
  const ph = (f * Math.PI) / 2;
  // three tongues of flame over a ball of light: [root x, height, half width at the root, lean]
  const tongues = [
    [-2.5, 4.4 + Math.sin(ph + 1) * 1.3, 2.1, -1.0],
    [0.1, 8.4 + Math.sin(ph) * 1.1, 2.9, Math.sin(ph) * 1.5],
    [2.6, 5.2 + Math.sin(ph + 2.4) * 1.4, 2.1, 1.1],
  ];
  for (let y = 1; y < 15; y++)
    for (let x = 1; x < 15; x++) {
      const X = x + 0.5;
      const Y = y + 0.5;
      let d = Math.hypot(X - 8, (Y - 10.5) * 1.12) / 4.3;
      if (Y < 10.5)
        for (const [ox, h, w0, lean] of tongues) {
          const t = (10.5 - Y) / h;
          if (t > 1) continue;
          const half = w0 * Math.pow(1 - t, 0.8);
          if (half < 0.35) continue;
          d = Math.min(d, Math.max(Math.abs(X - (8 + ox + lean * t * t)) / half, t * 0.92));
        }
      if (d >= 1) continue;
      b.set(x, y, d < 0.3 ? F[0] : d < 0.6 ? F[1] : d < 0.84 ? F[2] : F[3]);
    }
  const blink = f === 3;
  for (const ex of [6, 9]) {
    b.set(ex, 11, F[4]);
    if (!blink) b.set(ex, 10, F[4]);
  }
  b.set(7, 13, F[3]);
  b.set(8, 13, F[3]);
  return b.outlined(F[4]);
}

/** The guardian's heart, as it is seen from Nawia: shelled while the stone stands, bare when it is stunned. */
function heartFrame(f: number, bare: boolean): PixelBuffer {
  const b = new PixelBuffer(16, 16);
  const S = INK.soul;
  const r = bare ? 4.4 + (f % 2) * 0.9 : 3.4;
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++) {
      const dx = x + 0.5 - 8;
      const dy = y + 0.5 - 8;
      // a drop of light: round above, pointed below
      const d = Math.hypot(dx, dy < 0 ? dy : dy * 0.8) + (dy > 0 ? Math.abs(dx) * 0.35 : 0);
      if (d > r) continue;
      b.set(x, y, d < r * 0.38 ? rgb(0xffffff) : d < r * 0.7 ? S[4] : d < r * 0.9 ? S[3] : S[2]);
    }
  const out = b.outlined(S[0]);
  if (!bare) {
    // the shell: eight beads turning around it
    for (let k = 0; k < 8; k++) {
      const a = (k * Math.PI) / 4 + (f % 2) * (Math.PI / 8);
      const x = Math.round(7.5 + Math.cos(a) * 6.4);
      const y = Math.round(7.5 + Math.sin(a) * 6.4);
      out.set(x, y, k % 2 ? PAL.nawia.accent : PAL.nawia.accentSoft);
    }
  } else {
    for (let k = 0; k < 5; k++) {
      const a = k * 1.9 + f * 1.3;
      out.set(Math.round(7.5 + Math.cos(a) * 6.8), Math.round(7.5 + Math.sin(a) * 6.8), S[3]);
    }
  }
  return out;
}

/** Dzik: a boar. Nothing unnatural about it, which does not make it friendly. */
const DZIK_PAL: Record<string, Color> = {
  o: INK.outline,
  d: rgb(0x7e5c49), D: rgb(0x533c35), m: rgb(0x3a2a2e), M: rgb(0x5e4439),
  n: rgb(0xd39c8c), N: rgb(0xa36c62), w: rgb(0xf6f1e6), e: rgb(0x1a1423), h: rgb(0x2a2026),
};
const DZIK_A = art(16, [
  '................',
  '................',
  '......ooooo.....',
  '....oommmmmoo...',
  '..oommMMMMMmmoo.',
  '.oddddMMMMdddddo',
  'odddddddddddeddo',
  'oddddddddddddddo',
  'oDdddddddddddnno',
  'oDDdddddddddwnNo',
  '.oDDDdddddDDowo.',
  '.oDDDDooDDDDoo..',
  '.oDDo..oDDo.....',
  '.oho...oho......',
  '.oo....oo.......',
  '................',
]);
const DZIK_B = [
  ...DZIK_A.slice(0, 12),
  ...art(16, ['...oDDooDDo.....', '...oho.oho......', '...oo..oo.......', '................']),
];
const DZIK_C = art(16, [
  '................',
  '................',
  '................',
  '...ooommmmoo....',
  '.oommMMMMMmmoo..',
  'odddddMMMMddddo.',
  'odddddddddddddoo',
  'oDdddddddddddedo',
  'oDDddddddddddnno',
  '.oDDDddddddwwnNo',
  'ooDDDDddddDDooo.',
  'oDDoooooooDDo...',
  'oho.......ohoo..',
  'oo.........ooo..',
  '................',
  '................',
]);

/** Wilk: a wolf the blight has got into. Violet under the fur, and its eyes are the colour of the other side. */
const WILK_PAL: Record<string, Color> = {
  o: rgb(0x16101e),
  g: rgb(0x7d7898), G: rgb(0x4e4968), b: rgb(0xd6d2e6),
  e: rgb(0xff5ad8), n: rgb(0x1a1423), w: rgb(0xf6f1e6), v: rgb(0xb05fe0), m: rgb(0x2a1426),
};
const WILK_A = art(16, [
  '................',
  '................',
  '...........o.o..',
  '..........ogogo.',
  '.........oggggo.',
  'oo.....ooggegggo',
  'oGooooogggggggno',
  '.oGggggggggggwo.',
  '..oGgggggggbboo.',
  '..oGggvgggbbo...',
  '..oGGgggggbbo...',
  '..oGGooooGGo....',
  '..oGo....oGo....',
  '..ogo....ogo....',
  '..ooo....ooo....',
  '................',
]);
const WILK_B = [
  ...WILK_A.slice(0, 12),
  ...art(16, ['...oGo..oGo.....', '...ogo..ogo.....', '...ooo..ooo.....', '................']),
];
const WILK_C = art(16, [
  '................',
  '................',
  '............o.o.',
  '...........ogogo',
  'oo........oggggo',
  'oGoooooooggegggo',
  '.oGgggggggggwwno',
  '..oGgggggggmmoo.',
  '..oGggvgggbwwo..',
  '.ooGGggggbboo...',
  'oGGooooooooGGo..',
  'ogo.........ogo.',
  'oo...........oo.',
  '................',
  '................',
  '................',
]);

/** Morownik: the flower of the blight. Shut, it is a bud on thorns. When it opens, it spits. */
const MOROWNIK_PAL: Record<string, Color> = {
  o: rgb(0x1a0f24),
  p: rgb(0x7c3cac), P: rgb(0x4b2172), l: rgb(0xb46edc),
  c: rgb(0xff7ad8), C: rgb(0xffe2ff),
  s: rgb(0x3b2b4c), S: rgb(0x5c4c6e), t: rgb(0xdccdec),
  g: rgb(0x2e3d2a), G: rgb(0x4b5b31),
};
const MOROWNIK_A = art(16, [
  '................',
  '................',
  '.......oo.......',
  '......olPo......',
  '.....olppPo.....',
  '.....olppPo.....',
  '....olpppPPo....',
  '....olpcpPPo....',
  '....oppcpPPo....',
  '.....oppPPo.....',
  '..t...osSo...t..',
  '.oGo..osSo..oGo.',
  'oGGGoooSsoooGGgo',
  '.ogGGGosSoGGGgo.',
  '..oooGosSoGooo..',
  '.....oooooo.....',
]);
const MOROWNIK_C = art(16, [
  '................',
  '..oo........oo..',
  '.olpo......oplo.',
  '.olppo....oppPo.',
  '..oppPo..opPPo..',
  '...oppPoopPPo...',
  '....opcCCcPo....',
  '...oopCCCCPoo...',
  '..olpcCCCCcPPo..',
  '.olppPcccCPPPPo.',
  '.oppPo.osSo.oPPo',
  '..ooGo.osSo.oGoo',
  'oGGGoooSsoooGGgo',
  '.ogGGGosSoGGGgo.',
  '..oooGosSoGooo..',
  '.....oooooo.....',
]);

/** A hen. She has nothing to do with any of this. */
const HEN_PAL: Record<string, Color> = {
  o: INK.outline, w: rgb(0xf4ecd8), W: rgb(0xc9bda2), r: rgb(0xd43c44), y: rgb(0xe8a83a), e: rgb(0x1a1423),
};
const HEN_A = art(16, [
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '.........rr.....',
  '........owwo....',
  '..oo...owwewyy..',
  '.owwo.owwwwo....',
  '.owwwowwwwwo....',
  '..owwwwwwwwo....',
  '...owwwWWwo.....',
  '....oooooo......',
  '.....y..y.......',
  '....yy.yy.......',
]);
const HEN_B = [...HEN_A.slice(0, 14), ...art(16, ['......y.y.......', '.....yy.yy......'])];

function mobSheet(): Sheet {
  const strzyga = (which: StrzygaForm): PixelBuffer[] =>
    [STRZYGA_ROWS, squash(STRZYGA_ROWS), STRZYGA_POUNCE].map((rows) => softOutline(fromAscii(rows, STRZYGA_PAL[which]), STRZYGA_PAL[which].o));
  return grid('mobs', MOB.fw, MOB.fh, MOB.cols, [
    ...[UTOPIEC_A, squash(UTOPIEC_A), UTOPIEC_C].map((rows) => softOutline(fromAscii(rows, UTOPIEC_PAL), INK.outline)), null,
    ...[ZJAWA_A, ZJAWA_B, ZJAWA_C].map((rows) => fromAscii(rows, ZJAWA_PAL)), null,
    ognikFrame(0), ognikFrame(1), ognikFrame(2), ognikFrame(3),
    ...strzyga('body'), null,
    ...strzyga('soul'), null,
    heartFrame(0, false), heartFrame(1, false), heartFrame(0, true), heartFrame(1, true),
    ...[DZIK_A, DZIK_B, DZIK_C].map((rows) => softOutline(fromAscii(rows, DZIK_PAL), INK.outline)), null,
    ...[WILK_A, WILK_B, WILK_C].map((rows) => softOutline(fromAscii(rows, WILK_PAL), WILK_PAL.o)), null,
    ...[MOROWNIK_A, squash(MOROWNIK_A), MOROWNIK_C].map((rows) => softOutline(fromAscii(rows, MOROWNIK_PAL), MOROWNIK_PAL.o)), null,
    softOutline(fromAscii(HEN_A, HEN_PAL), INK.outline), softOutline(fromAscii(HEN_B, HEN_PAL), INK.outline), null, null,
  ]);
}

// =============================================================== the guardian
// 32x32 cells: idle A, idle B (a step), wind-up, charge, stunned (cracked).
// A stone idol of the old kind: a standing stone with a face under a flat cap, fists like boulders.

export const BOSS = { fw: 32, fh: 32, cols: 8, IDLE: 0, IDLE_B: 1, WINDUP: 2, CHARGE: 3, STUNNED: 4 } as const;

type BossPose = 'idle' | 'idleB' | 'windup' | 'charge' | 'stunned';

/** Warm weathered stone, dark -> light. */
const BS = [0x221c2a, 0x3c3341, 0x5c5056, 0x827467, 0xaa997f, 0xd0c09c].map((h) => rgb(h));
const MOSS = [rgb(0x3f6d38), rgb(0x6aa04a)];

/** A rounded block of stone, lit from the upper left. */
function stoneBlock(b: PixelBuffer, x0: number, y0: number, w: number, h: number, seed: number, power = 3): void {
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const nx = (x + 0.5 - w / 2) / (w / 2);
      const ny = (y + 0.5 - h / 2) / (h / 2);
      if (Math.pow(Math.abs(nx), power) + Math.pow(Math.abs(ny), power) >= 1) continue;
      const grain = ((hash2(x0 + x, y0 + y, seed) % 100) / 100 - 0.5) * 0.22;
      const lum = -nx * 0.55 - ny * 0.7 + grain;
      b.set(x0 + x, y0 + y, lum > 0.55 ? BS[4] : lum > 0.05 ? BS[3] : lum > -0.5 ? BS[2] : BS[1]);
    }
}

function bossFrame(pose: BossPose): PixelBuffer {
  const b = new PixelBuffer(32, 32);
  const by = 4 + (pose === 'charge' ? 2 : pose === 'windup' ? -1 : pose === 'idleB' ? 1 : 0);
  // feet
  stoneBlock(b, 8, pose === 'idleB' ? 26 : 27, 7, 4, 5, 2.4);
  stoneBlock(b, 17, 27, 7, 4, 6, 2.4);
  // body and the flat cap
  stoneBlock(b, 6, by, 20, 25, 1, 3.6);
  stoneBlock(b, 5, by - 2, 22, 8, 2, 2.6);
  for (let x = 6; x < 26; x++) {
    b.set(x, by + 5, BS[1]);
    b.set(x, by + 6, x < 16 ? BS[4] : BS[3]);
  }
  // moss on the crown
  for (let x = 6; x < 26; x++) {
    const hs = hash2(x, 3, 77);
    if (hs % 3 === 0) continue;
    for (let y = by - 2; y < by + 2; y++)
      if (b.get(x, y) >>> 24 && !(b.get(x, y - 1) >>> 24)) {
        b.set(x, y, MOSS[hs & 1]);
        if (hs % 4 === 1) b.set(x, y + 1, MOSS[0]);
      }
  }
  // the face: a heavy brow, deep sockets, a long nose, a slit of a mouth
  const eyes: Record<BossPose, [number, number]> = {
    idle: [0xffb84a, 0xffe9a0], idleB: [0xffb84a, 0xffe9a0], windup: [0xfff2c0, 0xffffff],
    charge: [0xff5a3a, 0xffd070], stunned: [0x3c3341, 0x3c3341],
  };
  const fy = by + 8;
  for (const ex of [9, 18]) {
    for (let x = 0; x < 5; x++) {
      b.set(ex + x, fy, BS[1]);
      b.set(ex + x, fy + 1, BS[0]);
      b.set(ex + x, fy + 2, BS[0]);
      b.set(ex + x, fy + 3, x > 0 && x < 4 ? BS[0] : BS[2]);
    }
    const [core, hot] = eyes[pose];
    const wide = pose === 'windup' || pose === 'charge';
    b.set(ex + 1, fy + 2, rgb(core)); b.set(ex + 2, fy + 2, rgb(hot)); b.set(ex + 3, fy + 2, rgb(core));
    if (wide) { b.set(ex + 1, fy + 1, rgb(core)); b.set(ex + 2, fy + 1, rgb(hot)); b.set(ex + 3, fy + 1, rgb(core)); }
  }
  for (let y = fy + 1; y < fy + 7; y++) {
    b.set(15, y, BS[5]);
    b.set(16, y, BS[2]);
  }
  b.set(14, fy + 6, BS[4]); b.set(17, fy + 6, BS[1]);
  const my = fy + 9;
  if (pose === 'charge') {
    for (let x = 11; x <= 20; x++) for (let y = my - 1; y <= my + 2; y++) b.set(x, y, BS[0]);
    for (let x = 12; x <= 19; x += 2) { b.set(x, my - 1, BS[5]); b.set(x + 1, my + 2, BS[4]); }
  } else {
    for (let x = 11; x <= 20; x++) { b.set(x, my, BS[0]); b.set(x, my + 1, BS[4]); }
    b.set(10, my + 1, BS[0]); b.set(21, my + 1, BS[0]);
  }
  // a belt of carved marks
  for (let x = 8; x < 24; x++) {
    b.set(x, by + 20, BS[1]);
    if (x % 3 === 0) b.set(x, by + 21, BS[1]);
    b.set(x, by + 19, x < 15 ? BS[4] : BS[3]);
  }
  // old cracks
  b.set(22, by + 12, BS[1]); b.set(23, by + 13, BS[1]); b.set(23, by + 14, BS[1]); b.set(8, by + 15, BS[1]); b.set(9, by + 16, BS[1]);
  // fists
  const fists: Record<BossPose, [number, number, number, number]> = {
    idle: [0, 15, 26, 15], idleB: [0, 16, 26, 14], windup: [0, 4, 26, 4], charge: [1, 17, 25, 17], stunned: [0, 20, 26, 20],
  };
  const [lx, ly, rx, ry] = fists[pose];
  const fw = pose === 'charge' ? 7 : 6;
  stoneBlock(b, lx, ly, fw, 9, 3, 2.6);
  stoneBlock(b, rx - (fw - 6), ry, fw, 9, 4, 2.6);
  for (const [x, y] of [[lx, ly], [rx - (fw - 6), ry]]) for (let i = 1; i < fw - 1; i += 2) b.set(x + i, y + 6, BS[1]);

  const out = b.outlined(INK.outline);
  if (pose === 'stunned') {
    // split from crown to belt, and the other side shines through
    let cx = 15;
    for (let y = by - 1; y < by + 22; y++) {
      const hs = hash2(cx, y, 9);
      out.set(cx, y, rgb(0xdcffff));
      out.set(cx + 1, y, PAL.nawia.accent);
      if (hs % 4 === 0) out.set(cx - 1, y, PAL.nawia.accentSoft);
      if (hs % 3 === 0) cx += hs % 2 ? 1 : -1;
      cx = Math.max(13, Math.min(18, cx));
    }
  }
  return out;
}

function bossSheet(): Sheet {
  const poses: BossPose[] = ['idle', 'idleB', 'windup', 'charge', 'stunned'];
  return grid('boss', BOSS.fw, BOSS.fh, BOSS.cols, [...poses.map(bossFrame), null, null, null]);
}

// =============================================================== things that fly at you
// 8x8 cells: wisp fire x2, soul orb x2.

export const SHOT = { fw: 8, fh: 8, cols: 4, WISP: 0, SOUL: 2, THORN: 4 } as const;

function orb(ramp: readonly Color[], dark: Color, f: number): PixelBuffer {
  const b = new PixelBuffer(8, 8);
  const r = 2.3 + (f % 2) * 0.5;
  for (let y = 0; y < 8; y++)
    for (let x = 0; x < 8; x++) {
      const d = Math.hypot(x + 0.5 - 4, y + 0.5 - 4);
      if (d <= r) b.set(x, y, d < r * 0.45 ? ramp[0] : d < r * 0.8 ? ramp[1] : ramp[2]);
    }
  return b.outlined(dark);
}

const THORN = [rgb(0xffe2ff), rgb(0xff7ad8), rgb(0x7c3cac)];

function shotSheet(): Sheet {
  const soul = [rgb(0xffffff), INK.soul[4], INK.soul[3]];
  return grid('shots', SHOT.fw, SHOT.fh, SHOT.cols, [
    orb(WISP_FIRE, rgb(0x12301c), 0), orb(WISP_FIRE, rgb(0x12301c), 1),
    orb(soul, INK.soul[0], 0), orb(soul, INK.soul[0], 1),
    orb(THORN, MOROWNIK_PAL.o, 0), orb(THORN, MOROWNIK_PAL.o, 1),
  ]);
}

export function makeActorSheets(): Sheet[] {
  return [...HERO_LOOKS.map(heroSheet), folkSheet(), swordSheet(), mobSheet(), bossSheet(), shotSheet()];
}
