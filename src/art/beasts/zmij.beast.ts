// M20 Żmij (zmij), the boss, new: the serpent at the roots of the world tree, the guardian of the way into Nawia.
//
// The idea: a great serpent coiled on the ground, its head raised, all of it under dark armour: overlapping
// plates over the coils, a crest of horn behind the head, horn plates over the eye, two fangs over the lip. The
// coils are one body in a spiral: the tail runs out ahead along the ground, the lower coil turns up at the back
// into the upper one, and the upper one rises at its front into the neck. In Jawia it is an untouchable shell.
// It moves: it does not crawl, its coils shift: the plates slide round the coils (the lower coil one way, the
// upper the other) while the neck sways forward and sinks and comes back (four frames).
// It attacks: it rears back with the jaws open (the wind-up), then strikes forward and down (the blow).
// Nawia: there it is translucent, dark blue with lit edges, and inside its upper coil its heart can be seen,
// red and beating (full, drawn in): the one place it can be hurt.

import type { Beast } from './beast.ts';

const W = 32;
const H = 32;

/** Lays parts over each other: each [dy, rows, dx] goes dy rows down and dx columns right; a later part covers
 *  an earlier one; '.' lets what is under it show. */
function stack(...parts: [number, string[], number?][]): string[] {
  const grid = Array.from({ length: H }, () => Array<string>(W).fill('.'));
  for (const [dy, rows, dx = 0] of parts)
    rows.forEach((r, y) =>
      [...r].forEach((ch, x) => {
        const tx = x + dx;
        const ty = y + dy;
        if (ch !== '.' && tx >= 0 && tx < W && ty >= 0 && ty < H) grid[ty][tx] = ch;
      }),
    );
  return grid.map((r) => r.join(''));
}

// ------------------------------------------------------------------ the colours: one letter, one colour

const PAL: Beast['pal'] = {
  d: 0x14181c, // armour, the deepest
  k: 0x222a2e, // armour, the seams
  s: 0x34403e, // armour, the shadow
  S: 0x4e5c52, // armour
  L: 0x7a8a6c, // armour, the lit edge
  p: 0xc8bc98, // horn: crest, brow plates, fangs
  P: 0x8a7e62, // horn, the shadow
  b: 0x9a8658, // the belly plates
  B: 0x6a5a3c, // the belly plates, the shadow
  e: 0xf0b040, // the eye
  m: 0x6a1c22, // the inside of the mouth
};
/** Nawia: translucent, dark blue with lit edges; its heart shows inside the upper coil */
const PAL_NAWIA: Beast['pal'] = {
  d: 0x050616,
  k: 0x0b0e22,
  s: 0x141a3c,
  S: 0x1e3c6a,
  L: 0x8ef0ee, // the edges, lit
  p: 0xdcffff,
  P: 0x3db6c6,
  b: 0x6a7fd0,
  B: 0x2c3a80,
  e: 0xffffff,
  m: 0x2c3a80,
  o: 0x8a1f36, // the heart, the dark
  q: 0xe23d4c, // the heart
  Q: 0xff8a80, // the heart, the light
};

// ------------------------------------------------------------------ the parts, each at its place in the standing frame

/** the coils, rows 17-30, the plates slid one pixel further in each */
const COILS = {
  /** the armour plates where they stand */
  c0: [
    '.....LLLpLLLpLLLpLLL............',
    '...LPSSLPSSLPSSLPSSLP...........',
    '..LLSksSSksSSksSSksSSk..........',
    '.LLSssskssskssskssskss..........',
    '.LSSssksssksssksssksss..........',
    '.SSksbBkBbBkBbBkBbBkB...........',
    '.SksskkdkBkdkBkdkBkd............',
    '.ksskdLLPLLLPLLLPLLLPLLLPL......',
    '.sskdSSLPSSLPSSLPSSLPSSLPSSL....',
    '.ksSSksSSksSSksSSksSSksSSksSS...',
    '.ssksssksssksssksssksssksssks...',
    '.skssskssskssskssskssskssskSSL..',
    '.kdkkkdkkkdkkkdkkkdkkkdkkkdkSSSL',
    '..dkdddkdddkdddkdddkdddkdddk.kSL',
  ],
  /** slid a pixel on */
  c1: [
    '.....pLLLpLLLpLLLpLL............',
    '...LLPSSLPSSLPSSLPSSL...........',
    '..LLSSksSSksSSksSSksSS..........',
    '.LLSksssksssksssksssks..........',
    '.LSSssskssskssskssskss..........',
    '.SSksBbBkBbBkBbBkBbBk...........',
    '.SksskBkdkBkdkBkdkBk............',
    '.ksskdLPLLLPLLLPLLLPLLLPLL......',
    '.sskdSLPSSLPSSLPSSLPSSLPSSLP....',
    '.sSSksSSksSSksSSksSSksSSksSSk...',
    '.skssskssskssskssskssskssskss...',
    '.kssskssskssskssskssskssskkSSL..',
    '.dkkkdkkkdkkkdkkkdkkkdkkkdkkSSSL',
    '..kdddkdddkdddkdddkdddkdddkd.kSL',
  ],
  /** two */
  c2: [
    '.....LpLLLpLLLpLLLpL............',
    '...LSLPSSLPSSLPSSLPSS...........',
    '..LLsSSksSSksSSksSSksS..........',
    '.LLSsksssksssksssksssk..........',
    '.LSSksssksssksssksssks..........',
    '.SSkskBbBkBbBkBbBkBbB...........',
    '.SksskkBkdkBkdkBkdkB............',
    '.ksskdPLLLPLLLPLLLPLLLPLLL......',
    '.sskdLPSSLPSSLPSSLPSSLPSSLPS....',
    '.SSksSSksSSksSSksSSksSSksSSks...',
    '.ksssksssksssksssksssksssksss...',
    '.ssskssskssskssskssskssskskSSL..',
    '.kkkdkkkdkkkdkkkdkkkdkkkdkkkSSSL',
    '..dddkdddkdddkdddkdddkdddkdd.kSL',
  ],
  /** three: then round again */
  c3: [
    '.....LLpLLLpLLLpLLLp............',
    '...LSSLPSSLPSSLPSSLPS...........',
    '..LLksSSksSSksSSksSSks..........',
    '.LLSssksssksssksssksss..........',
    '.LSSsksssksssksssksssk..........',
    '.SSksBkBbBkBbBkBbBkBb...........',
    '.SksskdkBkdkBkdkBkdk............',
    '.ksskdLLLPLLLPLLLPLLLPLLLP......',
    '.sskdPSSLPSSLPSSLPSSLPSSLPSS....',
    '.SksSSksSSksSSksSSksSSksSSksS...',
    '.sssksssksssksssksssksssksssk...',
    '.ssksssksssksssksssksssksskSSL..',
    '.kkdkkkdkkkdkkkdkkkdkkkdkkkkSSSL',
    '..ddkdddkdddkdddkdddkdddkddd.kSL',
  ],
};
/** the neck */
const NECK = {
  /** raised in an S from the end of the upper coil: rows 9-21 */
  up: [
    '..............kSLLbB............',
    '.............kSSLLbB............',
    '............PkSSLbbB............',
    '............ksSSLbbB............',
    '...........kssSLbbB.............',
    '..........PkssSLbB..............',
    '...........kssSSLbB.............',
    '...........kkssSSLbB............',
    '............PkssSSLbB...........',
    '.............kkssSSLbB..........',
    '..............kkssSSLbB.........',
    '...............kkssSSbB.........',
    '................kkssSBk.........',
  ],
  /** drawn back: rows 9-21 */
  rear: [
    '.........kSLLbB.................',
    '........kSSLLbB.................',
    '.......PkSSLbbB.................',
    '........ksSSLbbB................',
    '.........kssSLbbB...............',
    '..........kssSLbbB..............',
    '...........kssSSLbB.............',
    '............kkssSSLbB...........',
    '.............kkssSSLbB..........',
    '..............kkssSSLbB.........',
    '..............kkssSSLbB.........',
    '...............kkssSSbB.........',
    '................kkssSBk.........',
  ],
  /** thrown forward under the head: rows 13-21 */
  strike: [
    '..............kSSLbB............',
    '..............ksSSLbB...........',
    '..............kssSLbbB..........',
    '...............kssSLbB..........',
    '...............kkssSLbB.........',
    '...............kkssSSLbB........',
    '..............kkssSSLbB.........',
    '...............kkssSSbB.........',
    '................kkssSBk.........',
  ],
};
/** the head, its top on row 0 when raised */
const HEAD = {
  /** the jaws shut, two fangs over the lip; a crest of horn behind */
  shut: [
    '..........P.....................',
    '..........PP..P.................',
    '...........PpPpP................',
    '............kSLLLL..............',
    '...........kSSSSSLLL............',
    '...........kSSPPSSSSLLL.........',
    '...........kSkdekSSSSSSLL.......',
    '...........ksSkkSSSSSSSSSL......',
    '...........kssssssssSSSSSSL.....',
    '............ksssssssssssSSSL....',
    '............kkpkkkkkkkpkkkkkk...',
    '.............kssssssssssskk.....',
    '..............kBBbbbbBBk........',
  ],
  /** the jaws thrown open, the fangs out */
  open: [
    '..........P.....................',
    '..........PP..P.................',
    '...........PpPpP................',
    '............kSLLLL..............',
    '...........kSSSSSLLL............',
    '...........kSSPPSSSSLLL.........',
    '...........kSkdekSSSSSSLL.......',
    '...........ksSkkSSSSSSSSSL......',
    '...........kssssssssSSSSSSL.....',
    '............kspkkkkkkpkkkkkp....',
    '............ksmmmmmmmmmmmm......',
    '............ksmmmmmmmmm.........',
    '............kkpkkkkkkkp.........',
    '.............kssssssssssk.......',
    '..............kBBbbbbBBk........',
  ],
};
/** its heart, seen only in Nawia, in the upper coil */
const HEART = {
  /** beating: full */
  big: [
    '..o.o..',
    '.oqQqo.',
    '.oqQQqo',
    '..oqqo.',
    '...oo..',
  ],
  /** beating: drawn in */
  small: [
    '.......',
    '..oqo..',
    '..qQqo.',
    '...qo..',
    '.......',
  ],
};

// ------------------------------------------------------------------ the frames
// [row, part, column shift]: the later parts are drawn over the earlier ones.

const stand = stack([17, COILS.c0], [9, NECK.up], [0, HEAD.shut]);
const walk = [
  stack([17, COILS.c0], [9, NECK.up], [0, HEAD.shut]), // the plates slide round the coils
  stack([17, COILS.c1], [9, NECK.up, 1], [0, HEAD.shut, 1]), // the neck sways forward
  stack([17, COILS.c2], [10, NECK.up, 1], [1, HEAD.shut, 1]), // and sinks
  stack([17, COILS.c3], [10, NECK.up], [1, HEAD.shut]), // and comes back
];
const attack = [
  stack([17, COILS.c1], [9, NECK.rear], [0, HEAD.open, -5]), // rears back, the jaws open
  stack([17, COILS.c0], [13, NECK.strike], [6, HEAD.open, 2]), // strikes forward and down
];

export const BEAST: Beast = {
  code: 'M20',
  id: 'zmij',
  kind: { pl: 'Żmij', en: 'Żmij' },
  name: { pl: 'wąż u korzeni', en: 'serpent at the roots' },
  note: { pl: 'Strażnik wejścia do Nawii: zwinięty w pancerzu z łusek, nietykalny; cofa łeb i uderza.', en: 'Guardian of the way into Nawia: coiled in scaled armour, untouchable; it rears back and strikes.' },
  alt: [],
  w: W,
  h: H,
  view: 'side',
  pal: PAL,
  frames: { stand, walk, attack },
  ink: 'dark',
  outline: 0x0e0c10,
  nawia: {
    pal: PAL_NAWIA,
    ink: { ink: 'dark', outline: 0x03040c },
    // the same frames with the heart laid in the upper coil: beating, full and drawn in
    frames: {
      stand: stack([17, COILS.c0], [9, NECK.up], [0, HEAD.shut], [18, HEART.big, 7]),
      walk: [
      stack([17, COILS.c0], [9, NECK.up], [0, HEAD.shut], [18, HEART.big, 7]),
      stack([17, COILS.c1], [9, NECK.up, 1], [0, HEAD.shut, 1], [18, HEART.small, 7]),
      stack([17, COILS.c2], [10, NECK.up, 1], [1, HEAD.shut, 1], [18, HEART.big, 7]),
      stack([17, COILS.c3], [10, NECK.up], [1, HEAD.shut], [18, HEART.small, 7]),
    ],
      attack: [
      stack([17, COILS.c1], [9, NECK.rear], [0, HEAD.open, -5], [18, HEART.small, 7]),
      stack([17, COILS.c0], [13, NECK.strike], [6, HEAD.open, 2], [18, HEART.big, 7]),
    ],
    },
    note: {
      pl: 'W Nawii jest przezroczysty: w górnym splocie widać bijące serce.',
      en: 'In Nawia it is translucent: its beating heart shows in the upper coil.',
    },
  },
};
