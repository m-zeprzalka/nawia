// M18 Leszy (leszy-b): an alternative to P16, the bark-and-antler leshy with a skull for a face.
//
// The idea: the lord of the forest as the old man of the folk tales, the "leśny dziad", grown over: bent double
// under a mantle of moss that hangs off his back in ragged strands, a broken bough growing out of it, lichen in
// patches; under its brim a long pale face of old bark with a heavy brow, a big nose and one green-gold light for
// an eye; a beard of roots down to his knees; bark legs bound with bast cords in birch-bark shoes. One arm is a
// branch with a knot of burl for a hand. No antlers, no skull.
// It moves: heavily, knuckle-walking on the branch: he leans on the knot, sets the near shoe forward, then drags
// the far one after; the whole mantle sinks a pixel on each step and the beard swings.
// It attacks: he rears back with the branch raised over his head like a club (the wind-up), then brings it down
// on the ground ahead with all of his weight, throwing up earth and leaves (the blow).
// Nawia: the moss turns to the dark, its tips and the lichen glow; the root beard and the face are pale light.

import type { Beast } from './beast.ts';

const W = 24;
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
  k: 0x2a1e1c, // bark, the deepest
  b: 0x4a3628, // bark
  B: 0x6e5236, // bark, the light
  q: 0x2a3a26, // moss, the shadow
  o: 0x465c32, // moss
  O: 0x6e8444, // moss, the lit tips; leaves
  l: 0xb4b898, // lichen; the face, the light
  r: 0x9a7a4e, // roots: the beard
  R: 0x6a5034, // roots, the shadow
  c: 0xc8c0a8, // birch bark: the shoes
  C: 0x8e866e, // birch bark, the shadow; the bast cords; thrown earth
  e: 0xe8f070, // the eye: a green-gold light
  F: 0x7a7466, // the face, old grey bark
};
/** Nawia: the moss goes dark with glowing tips, the lichen, the face and the root beard turn to pale light */
const PAL_NAWIA: Beast['pal'] = {
  k: 0x080a1a,
  b: 0x121a40,
  B: 0x24347a,
  q: 0x0c1a30,
  o: 0x143a50,
  O: 0x3db6c6,
  l: 0x9af4ff,
  r: 0x5d7dd6,
  R: 0x2e46a0,
  c: 0x98b6f4,
  C: 0x2e46a0,
  e: 0xffffff,
  F: 0x4a60c0,
};

// ------------------------------------------------------------------ the parts, each at its place in the standing frame

/** the mantle of moss over his back, with the broken bough: rows 1-18 */
const MOSS = [
  '..Bb....................',
  '...Bb...................',
  '....Bb..................',
  '.....Bb.O...............',
  '.....OBOoOO.............',
  '...OOoBoooolOO..........',
  '..OooooqooooooOO........',
  '.Oooqoooqoooloooo.......',
  '.oooooqoooqoooooqO......',
  'Ooqoqooooqooqoooooo.....',
  'oooooqoqooqqqqqqqqqO....',
  'oqoqoooqoqqqqq..........',
  'qoqoqqoqqqqqq...........',
  'qqoqqoqqqqqqq...........',
  'q.qoqqqqqqk.............',
  'q.q.qoqqq...............',
  '..q.q.qq................',
  '....q...................',
];
/** the face under the moss: rows 12-17 */
const HEAD = [
  '............qqFlllllO...',
  '...........FFlFkkelll...',
  '...........FlFFlFlllll..',
  '...........FFlFFlFllFl..',
  '............FF.F..FlFF..',
  '..................FF....',
];
/** the bark body under the mantle: rows 16-22 */
const TRUNK = [
  '.........kbb............',
  '........kbB.............',
  '.......kbBB.............',
  '.......kbBB.............',
  '.......kbBB.............',
  '......kbbBb.............',
  '.....kbbkbBb............',
];
/** the beard of roots: rows 16-25 */
const BEARD = [
  '.............r.rrRr.....',
  '...........rRrrRrRr.....',
  '...........RrRrRrRr.....',
  '...........Rr.rRr.r.....',
  '...........r..rR..r.....',
  '..............r..r......',
  '..............R..r......',
  '..............r.........',
  '...............r........',
  '...............r........',
];
/** the near arm, a branch (the far one is under the mantle) */
const ARM = {
  /** a branch: hanging, the hand a knot of burl with short twigs */
  hang: [
    '..................BbBb..',
    '...................Bbbk.',
    '...................Bbk..',
    '....................Bbk.',
    '....................Bbk.',
    '....................BbbO',
    '....................Bbo.',
    '...................Bbk..',
    '...................Bbk..',
    '...................BBbk.',
    '..................BBbbk.',
    '..................Bbbbk.',
    '...................bkk..',
    '..................b.b.b.',
  ],
  /** leant on: the knot on the ground ahead, the weight on it */
  plant: [
    '..................BbBb..',
    '...................Bbbk.',
    '...................BBbk.',
    '....................Bbk.',
    '....................BBbk',
    '.....................BbO',
    '.....................Bbk',
    '.....................Bbk',
    '....................BBbk',
    '...................BBbbk',
    '...................Bbbbk',
    '...................bbkkk',
    '..................b.b..b',
    '.................b..b...',
  ],
  /** raised over its head, behind the face */
  raise: [
    '...............BBb......',
    '..............BBbbk.....',
    '..............Bbbbk.....',
    '.............b.bkk......',
    '...............Bbk......',
    '...............Bbk......',
    '...............Bbk.O....',
    '...............Bbbbo....',
    '...............Bbk......',
    '...............Bbk......',
    '...............BBbk.....',
    '................Bbk.....',
    '................Bbk.....',
    '................BBbk....',
  ],
  /** brought down: the knot in the ground */
  slam: [
    '...................BbBb.',
    '....................Bbbk',
    '....................BBbk',
    '.....................Bbk',
    '.....................Bbk',
    '.....................Bbk',
    '....................BBbk',
    '...................BBbbk',
    '...................Bbbbk',
    '..................b.bkk.',
    '.................bk.b..b',
  ],
};
/** from row 23 */
const LEGS = {
  /** bark legs wrapped in bast cords, birch-bark shoes */
  stand: [
    '.....kbk.kbB............',
    '....kbk...bB............',
    '....kC....kC............',
    '....Ck....Ck............',
    '....kC....kC............',
    '...ccC...cCCc...........',
    '..cCCk..cCCkCc..........',
    '..kCCCk.kCCCCk..........',
  ],
  /** the near shoe lifted and set forward */
  near_fwd: [
    '.....kbk..kbB...........',
    '....kbk....kbB..........',
    '....kC......kC..........',
    '....Ck......Ck..........',
    '....kC.....cCCc.........',
    '...ccC....cCCkCc........',
    '..cCCk....kCCCCk........',
    '..kCCCk.................',
  ],
  /** the far shoe dragged forward */
  far_fwd: [
    '......kbkkbB............',
    '.......kbk.bB...........',
    '.......kC..kC...........',
    '.......Ck..Ck...........',
    '......ccC..kC...........',
    '.....cCCk.cCCc..........',
    '.....kCCCcCCkCc.........',
    '.........kCCCCk.........',
  ],
  /** braced wide */
  brace: [
    '.....kbk..kbB...........',
    '....kbk....kbB..........',
    '...kC.......kC..........',
    '...Ck.......Ck..........',
    '..kC........kC..........',
    '.ccC.......cCCc.........',
    'cCCk......cCCkCc........',
    'kCCCk.....kCCCCk........',
  ],
};
/** leaves and earth thrown up by the blow, rows 22-30 */
const DEBRIS = [
  '.................O.....O',
  '...............B........',
  '.................o...B..',
  '..............C.........',
  '................B.......',
  '.............C........C.',
  '...............C.......C',
  '............C...........',
  '..........C.C...........',
];

// ------------------------------------------------------------------ the frames
// [row, part, column shift]: the later parts are drawn over the earlier ones.

const stand = stack([1, MOSS], [16, TRUNK], [23, LEGS.stand], [16, BEARD], [12, HEAD], [15, ARM.hang]);
const walk = [
  stack([2, MOSS], [17, TRUNK], [23, LEGS.near_fwd], [17, BEARD, -1], [13, HEAD], [16, ARM.plant]), // leans on the branch, the near foot forward
  stack([2, MOSS], [17, TRUNK], [23, LEGS.far_fwd], [17, BEARD], [13, HEAD], [14, ARM.hang, 1]), // drags the far foot after it
];
const attack = [
  stack([1, MOSS, -1], [0, ARM.raise], [16, TRUNK, -1], [23, LEGS.brace], [16, BEARD, -2], [12, HEAD, -1]), // the branch raised over its back
  stack([4, MOSS, 1], [19, TRUNK, 1], [23, LEGS.brace, 1], [19, BEARD, 2], [15, HEAD, 1], [20, ARM.slam], [22, DEBRIS]), // brought down on the ground ahead
];

export const BEAST: Beast = {
  code: 'M18',
  id: 'leszy-b',
  kind: { pl: 'Leszy', en: 'Leshy' },
  name: { pl: 'leśny dziad', en: 'old man of the wood' },
  note: { pl: 'Zgięty pod płaszczem mchu, z brodą z korzeni, w łapciach z brzozy; wali ramieniem jak konarem.', en: 'Bent under a mantle of moss, a beard of roots, birch-bark shoes; he strikes with an arm like a bough.' },
  alt: ['P16'],
  w: W,
  h: H,
  view: 'side',
  pal: PAL,
  frames: { stand, walk, attack },
  ink: 'dark',
  outline: 0x1a1018,
  nawia: {
    pal: PAL_NAWIA,
    ink: { ink: 'dark', outline: 0x03040c },
    note: {
      pl: 'W Nawii mech gaśnie, a świecą porosty, twarz i broda z korzeni.',
      en: 'In Nawia the moss goes dark; the lichen, the face and the root beard glow.',
    },
  },
};
