// C13: Sambor after the art lead's second reference (the 16-bit adventure hero), 16 x 18.
//
// Taken from the reference: the head's shape is made by what he wears on it, and from the side and from
// behind that headgear trails down his back, so the profile is a drop, not an egg; a compact body; a big
// shield; strong, saturated colours. Not taken: the costume or its colours. Ours is a medieval hood with a
// shoulder cape and a long tail (a liripipe), in brown wool (a red one read as a fairy-tale riding hood), over
// an oxblood tunic, dark trousers and boots; black hair under the hood; a round blue shield with a white sun
// disc in an iron rim (a white cross read as a flag). No line at all: the
// figure holds by its saturated colours and the dark inside of the hood around the face.

import type { Concept, Frames } from './concept.ts';

const H = 18;

function stack(...parts: [number, string[]][]): string[] {
  const grid = Array.from({ length: H }, () => Array<string>(16).fill('.'));
  for (const [dy, rows] of parts)
    rows.forEach((r, y) => {
      const ty = y + dy;
      if (ty >= 0 && ty < H) [...r].forEach((ch, x) => ch !== '.' && (grid[ty][x] = ch));
    });
  return grid.map((r) => r.join(''));
}

// ------------------------------------------------------------------ facing us

const HEAD_D = [
  '......cdcc......',
  '....cddcccCC....',
  '...cddccccCCC...',
  '...cdcccccCCC...',
  '...cXKKKKKKXC...',
  '...cXSKssKSXC...',
  '...cXwbttbwXC...',
  '...cXtssSssXC...',
  '...ccXSssSXcC...',
];
/** the cape of the hood over his shoulders, then the tunic */
const TRUNK_D = [
  '..cdcccccccCCC..',
  '..cdccccccCCCC..',
  '..yyYYyyyyyYYy..',
  '..skkkkmkkkkkS..',
  '...yyyyyyyYYY...',
];
const ARM_FWD_D = ['..y.............', '..s.............'];
const ARM_BACK_D = ['..y.............', '..y.............', '..Y.............'];
const LEGS_D = {
  stand: ['....XXX..XXX....', '....kkk..kkX....', '...kkkX..kkkX...'],
  a: ['....XXX..XXX....', '....kkk..kkkX...', '...kkkX.........'],
  b: ['....XXX..XXX....', '...kkkX..kkX....', '.........kkkX...'],
};
/** a blue field with a white sun disc, an iron rim */
const SHIELD_D = ['..........mmm...', '.........mbbbX..', '.........mbwbX..', '.........mbbbX..', '..........XXX...'];

// ------------------------------------------------------------------ from behind: the tail down his back

const HEAD_U = [
  '......cdcc......',
  '....cddcccCC....',
  '...cddccccCCC...',
  '...cdcccccCCC...',
  '...cdccdcccCC...',
  '...cdccdCccCC...',
  '...ccccdCcCCC...',
  '...cCccdCcCCC...',
  '...ccCcdCCcCC...',
];
const TRUNK_U = [
  '..cdcccdCccCCC..',
  '..cdcccdCcCCCC..',
  '..yyYYydCyyYYy..',
  '..skkkkdCkkkkS..',
  '...yyyyyCyYYY...',
];
const LEGS_U = {
  stand: ['....XXX..XXX....', '....kkk..kkX....', '....kkk..kkX....'],
  a: ['....XXX..XXX....', '....kkk..kkX....', '....kkk.........'],
  b: ['....XXX..XXX....', '....kkk..kkX....', '.........kkX....'],
};
const SHIELD_U = ['.mmm............', 'mXXXX...........', 'mXmXX...........', 'mXXXX...........', '.XXX............'];

// ------------------------------------------------------------------ from the side, facing right: a drop

const HEAD_S = [
  '.......cdc......',
  '......cddcC.....',
  '.....cddccCC....',
  '.....cdcccccC...',
  '.....cdcXKKKC...',
  '....ccdCXsKsC...',
  '...cCccCXsssC...',
  '...cC.cCXSsS....',
  '..cC...cCXS.....',
]
const TRUNK_S = [
  '..cC.cdccCC.....',
  '..C..cdcCC......',
  '.....yyyyY......',
  '.....kkkmk......',
  '.....yyyYY......',
];
const ARM_S = {
  stand: ['.......yY.......', '.......yY.......', '.......sS.......'],
  a: ['........yY......', '........yY......', '.........sS.....'],
  b: ['......yY........', '.....yY.........', '.....sS.........'],
};
const LEGS_S = {
  stand: ['......XXX.......', '......kkk.......', '......kkkX......'],
  a: ['.....XX.XX......', '....kk...kk.....', '....kX...kkX....'],
  b: ['.....XX.XX......', '....kk...kk.....', '....kX...kkX....'],
};
const SHIELD_S = ['.........mm.....', '.........bbX....', '.........bwX....', '.........bbX....', '.........XX.....'];

// ------------------------------------------------------------------ the frames

const down: Frames = [
  stack([0, HEAD_D], [9, TRUNK_D], [14, LEGS_D.stand], [9, SHIELD_D]),
  stack([14, LEGS_D.a], [1, HEAD_D], [10, TRUNK_D], [11, ARM_FWD_D], [10, SHIELD_D]),
  stack([14, LEGS_D.b], [1, HEAD_D], [10, TRUNK_D], [11, ARM_BACK_D], [10, SHIELD_D]),
];
const up: Frames = [
  stack([9, SHIELD_U], [14, LEGS_U.stand], [0, HEAD_U], [9, TRUNK_U]),
  stack([10, SHIELD_U], [14, LEGS_U.a], [1, HEAD_U], [10, TRUNK_U]),
  stack([10, SHIELD_U], [14, LEGS_U.b], [1, HEAD_U], [10, TRUNK_U]),
];
const side: Frames = [
  stack([14, LEGS_S.stand], [9, TRUNK_S], [10, ARM_S.stand], [9, SHIELD_S], [0, HEAD_S]),
  stack([14, LEGS_S.a], [10, TRUNK_S], [11, ARM_S.a], [10, SHIELD_S], [1, HEAD_S]),
  stack([14, LEGS_S.b], [10, TRUNK_S], [11, ARM_S.b], [10, SHIELD_S], [1, HEAD_S]),
];

export const CONCEPT: Concept = {
  code: 'C13',
  id: 'kaptur',
  name: { pl: 'Kaptur', en: 'Hood' },
  note: {
    pl: "wzorzec bohatera 16-bitowego: głowę robi nakrycie, z boku kropla dzięki ogonowi kaptura; brązowy kaptur, bordowa tunika, duża tarcza; bez konturu",
    en: "after the 16-bit hero reference: the headgear makes the head, a drop in profile thanks to the hood's tail; a brown hood, an oxblood tunic, a big shield; no line",
  },
  h: H,
  pal: {
    c: 0x8c6a44, d: 0xb89060, C: 0x5a4230, X: 0x2a1a20, K: 0x1e1820, t: 0xffe0c4, s: 0xf0bf98, S: 0xc47e62,
    w: 0xf4f0e6, b: 0x3a64b0, y: 0xb84a3c, Y: 0x7c2c2e, k: 0x4e3a2e, m: 0xc4ccd4,
  },
  frames: { down, up, side },
  ink: 'none',
};
