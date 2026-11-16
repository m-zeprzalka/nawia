// C11: Sambor in a fur cap (16 x 18), painted, with no line at all.
//
// A grown-up version of the doll A5 the art lead found "a relatively interesting concept", built the way the
// reference adventures build their heroes: the cap and its fur brim make a head as wide as the shoulders,
// the coat with its fur collar makes shoulders as wide as the head, the legs are short; the profile is half
// as deep as the front, with a flat face and no nose. No outline: like C1, S3 and C8b, the figure holds by
// its tones alone, lit from the upper left (the fur and the red crown catch the light, the coat's right
// side and the boots sink into shade).
// A red felt cap with a brown marten-fur brim (a pale one read as a Christmas hat), dark hair, blue eyes; an indigo coat lined with fleece,
// a red sash, brown trousers, dark boots; a round wooden shield with a red cross and an iron boss.

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
  '.....rrrRR......',
  '....rrrRRRC.....',
  '...kkkkkkhhh....',
  '...khkkhkhhh....',
  '...hsSKssKSsh...',
  '...hswbttbwsh...',
  '...HtsssSssSH...',
  '....HSsssSSH....',
];
const TRUNK_D = [
  '..bBBwwSSwwBDD..',
  '..bBBBwBBwBBDD..',
  '..sRRrrrrRRRCS..',
  '...bBBwkkwBBD...',
  '...bBBwkkwBDD...',
];
const ARM_FWD_D = ['..b.............', '..s.............'];
const ARM_BACK_D = ['..b.............', '..b.............', '..B.............'];
const LEGS_D = {
  stand: ['....kkk..kkk....', '....kkk..kkk....', '....HHH..HHH....', '...HHHH..HHHH...'],
  a: ['....kkk..kkk....', '....kkk..HHH....', '....HHH..HHHH...', '...HHHH.........'],
  b: ['....kkk..kkk....', '....HHH..kkk....', '...HHHH..HHH....', '.........HHHH...'],
};
const SHIELD_D = ['..........HkkH..', '.........HkRRkH.', '.........kRmmRk.', '.........HkRRkH.', '..........HkkH..'];

// ------------------------------------------------------------------ from behind

const HEAD_U = [
  '.....rrrRR......',
  '....rrrRRRC.....',
  '...kkkkkkhhh....',
  '...khkkhkhhh....',
  '...hhhhhhhHH....',
  '...hhhhhhHHH....',
  '...HhhhhhHHH....',
  '....HHhhHHH.....',
];
const TRUNK_U = [
  '..bBBwwwwwWBDD..',
  '..bBBBBBBBBBDD..',
  '..sRRrrrrRRRCS..',
  '...bBBBBBBBBD...',
  '...bBBBBBBBDD...',
];
const LEGS_U = {
  stand: ['....kkk..kkk....', '....kkk..kkk....', '....HHH..HHH....', '....HHH..HHH....'],
  a: ['....kkk..kkk....', '....kkk..HHH....', '....HHH..HHH....', '....HHH.........'],
  b: ['....kkk..kkk....', '....HHH..kkk....', '....HHH..HHH....', '.........HHH....'],
};
/** the back of the shield, on his left arm: on our left */
const SHIELD_U = ['.HkkH...........', 'HkkkkH..........', 'HkkkkH..........', 'HkkkkH..........', '.HHHH...........'];

// ------------------------------------------------------------------ from the side, facing right

const HEAD_S = [
  '.....rrrRR......',
  '....rrrRRRC.....',
  '...kkkkkkhhhk...',
  '...khkkhkhhhh...',
  '...hhhhhsSKs....',
  '...HhhhHswbs....',
  '....HhhHSsss....',
  '.....HHHSsS.....',
];
const TRUNK_S = [
  '.....BwwSb......',
  '.....BBwBbb.....',
  '.....RRrrrR.....',
  '.....BBwkbb.....',
  '.....BBwkbD.....',
];
const ARM_S = {
  stand: ['.......bB.......', '.......bB.......', '.......sS.......'],
  a: ['........bB......', '........bB......', '.........sS.....'],
  b: ['......bB........', '.....bB.........', '.....sS.........'],
};
const LEGS_S = {
  stand: ['......kkk.......', '......kkk.......', '......HHH.......', '......HHHH......'],
  a: ['.....kk.kk......', '....kk...kk.....', '....HH...HH.....', '...HHH...HHHH...'],
  b: ['.....kk.kk......', '....HH...kk.....', '....HH...HH.....', '...HHH...HHHH...'],
};
const SHIELD_S = ['.........HkH....', '........HkRkH...', '........kRmRk...', '........HkRkH...', '.........HkH....'];

// ------------------------------------------------------------------ the frames

const down: Frames = [
  stack([0, HEAD_D], [8, TRUNK_D], [13, LEGS_D.stand], [9, SHIELD_D]),
  stack([13, LEGS_D.a], [1, HEAD_D], [9, TRUNK_D], [10, ARM_FWD_D], [10, SHIELD_D]),
  stack([13, LEGS_D.b], [1, HEAD_D], [9, TRUNK_D], [10, ARM_BACK_D], [10, SHIELD_D]),
];
const up: Frames = [
  stack([9, SHIELD_U], [13, LEGS_U.stand], [0, HEAD_U], [8, TRUNK_U]),
  stack([10, SHIELD_U], [13, LEGS_U.a], [1, HEAD_U], [9, TRUNK_U]),
  stack([10, SHIELD_U], [13, LEGS_U.b], [1, HEAD_U], [9, TRUNK_U]),
];
const side: Frames = [
  stack([13, LEGS_S.stand], [8, TRUNK_S], [9, ARM_S.stand], [9, SHIELD_S], [0, HEAD_S]),
  stack([13, LEGS_S.a], [9, TRUNK_S], [10, ARM_S.a], [10, SHIELD_S], [1, HEAD_S]),
  stack([13, LEGS_S.b], [9, TRUNK_S], [10, ARM_S.b], [10, SHIELD_S], [1, HEAD_S]),
];

export const CONCEPT: Concept = {
  code: 'C11',
  id: 'kolpak',
  name: { pl: 'Kołpak', en: 'Fur cap' },
  note: {
    pl: "kołpak z kuny i czerwonym denkiem, granatowy kożuszek, czerwony pas; budowa jak we wzorcach; malowany, bez konturu",
    en: "a fur cap with a red crown, an indigo fleece-lined coat, a red sash; built like the references; painted, no line",
  },
  h: H,
  pal: {
    r: 0xd8584a, R: 0xa83a3c, C: 0x6e2436, w: 0xf2e6cc, W: 0xbfa98c, h: 0x5c3a28, H: 0x342024,
    t: 0xffe0c4, s: 0xf0c09a, S: 0xc4826a, K: 0x342024, b: 0x5878b0, B: 0x3a4f86, D: 0x28335a, k: 0x8a5a38, m: 0xc8ccd0,
  },
  frames: { down, up, side },
  ink: 'none',
};
