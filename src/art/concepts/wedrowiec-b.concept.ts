// C7b: C7 with a flatter profile (16 x 18): no nose, the fringe to the front edge, the face flat, a shallower
// head and the shield closer to the body. Front and back are C7's.
//
// C7: Sambor the traveller, square-built.
//
// Another hand than C1's, on purpose. Where C1 is slim and painted, this one fills the cell the way the
// classic adventure heroes do (the art lead noticed they read "square and proportional"): cloak, arms
// and shield take the full width from the front, while the profile stays narrow. A young man rather
// than a boy: a squarer jaw, a longer face, shaggy chestnut hair, green eyes. A leather jerkin over a
// rust-red shirt, a green travelling cloak, the sword on his back with the hilt over his right shoulder,
// a round red shield on his left arm.
// The line goes all round, but in the dark of each material (brown round skin, hair and leather, green
// round the cloak): a coloured outline, between C1's rim and a black line.

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
  '.....hlhhlh.....',
  '....hllhhlhh....',
  '....hlhhhhhH....',
  '....hshhshhH....',
  '....hSDssDSH....',
  '....HtGssGtH....',
  '....SssSSsSS....',
  '.....SssSS......',
];
const TRUNK_D = [
  '..ggkkrsSRkKGG..',
  '..grkkkkkkKKRG..',
  '..gsDDDmDDDDSG..',
  '..ggkkkkkkKKGG..',
  '...gkkkkkKKKG...',
];
/** the hilt of the sword on his back, over his right shoulder */
const HILT_D = ['..m.............', '..K.............', '.DKD............'];
const ARM_FWD_D = ['...r............', '...s............'];
const ARM_BACK_D = ['...r............', '...r............', '...R............'];
const LEGS_D = {
  stand: ['.....gG..gG.....', '.....gG..gG.....', '.....kK..kK.....', '....kkK..kkK....'],
  a: ['.....gG..gG.....', '.....gG..kK.....', '.....kK..kkK....', '....kkK.........'],
  b: ['.....gG..gG.....', '.....kK..gG.....', '....kkK..kK.....', '.........kkK....'],
};
const SHIELD_D = ['...........kkk..', '..........krrRk.', '..........krmRK.', '..........kRRRK.', '...........KKK..'];

// ------------------------------------------------------------------ from behind

const HEAD_U = [
  '.....hlhhlh.....',
  '....hllhhlhh....',
  '....hlhhhhhH....',
  '....hlhhlhhH....',
  '....hhlhhhHH....',
  '....HhhhhhHH....',
  '....HhhHhHHH....',
  '.....sSSSS......',
];
const TRUNK_U = [
  '..ggggggggGGGG..',
  '..rggggggDGGGR..',
  '..sgggggDgGGGS..',
  '..gggggDggGGGG..',
  '...ggggDgGGGG...',
  '...gGgDgGgGGG...',
];
const HILT_U = ['.............m..', '.............K..', '............DKD.'];
const LEGS_U = {
  stand: ['.....gG..gG.....', '.....kK..kK.....', '.....kK..kK.....', '....kkK..kkK....'],
  a: ['.....gG..gG.....', '.....kK..kK.....', '.....kK..kkK....', '....kkK.........'],
  b: ['.....gG..gG.....', '.....kK..kK.....', '....kkK..kK.....', '.........kkK....'],
};
const SHIELD_U = ['.kk.............', 'kkKk............', 'kKKK............', 'kKKK............', '.KK.............'];

// ------------------------------------------------------------------ from the side, facing right

const HEAD_S = [
  '.....hlhhl......',
  '....hllhhlhh....',
  '....hlhhhhhhh...',
  '....hhhhhhhhh...',
  '....HhhhsSSDs...',
  '....HhhhSstGs...',
  '.....HHhSssS....',
  '.......SsS......',
];
const TRUNK_S = [
  '....ggkrsK......',
  '....ggkkkK......',
  '....gGDDmD......',
  '....gGkkkK......',
  '....gGkkKK......',
];
const HILT_S = ['...m............', '...K............', '..DKD...........'];
const ARM_S = {
  stand: ['.......rR.......', '.......ss.......'],
  a: ['........rR......', '.........ss.....'],
  b: ['......rR........', '.....ss.........'],
};
const LEGS_S = {
  stand: ['....GgggG.......', '......gG........', '......kK........', '......kKk.......'],
  a: ['....GggGgG......', '.....gG.gG......', '....kK...kK.....', '....kK...kKk....'],
  b: ['....GgGGgg......', '.....GG.gg......', '....KK...kk.....', '....KK...kkk....'],
};
const SHIELD_S = ['........kk......', '........rrk.....', '........RmK.....', '........RRK.....', '........KK......'];

// ------------------------------------------------------------------ the frames

const down: Frames = [
  stack([4, HILT_D], [0, HEAD_D], [8, TRUNK_D], [13, LEGS_D.stand], [9, SHIELD_D]),
  stack([5, HILT_D], [13, LEGS_D.a], [1, HEAD_D], [9, TRUNK_D], [9, ARM_FWD_D], [10, SHIELD_D]),
  stack([5, HILT_D], [13, LEGS_D.b], [1, HEAD_D], [9, TRUNK_D], [9, ARM_BACK_D], [10, SHIELD_D]),
];
const up: Frames = [
  stack([9, SHIELD_U], [13, LEGS_U.stand], [0, HEAD_U], [8, TRUNK_U], [4, HILT_U]),
  stack([10, SHIELD_U], [13, LEGS_U.a], [1, HEAD_U], [9, TRUNK_U], [5, HILT_U]),
  stack([10, SHIELD_U], [13, LEGS_U.b], [1, HEAD_U], [9, TRUNK_U], [5, HILT_U]),
];
const side: Frames = [
  stack([4, HILT_S], [13, LEGS_S.stand], [8, TRUNK_S], [10, SHIELD_S], [9, ARM_S.stand], [0, HEAD_S]),
  stack([5, HILT_S], [13, LEGS_S.a], [9, TRUNK_S], [11, SHIELD_S], [10, ARM_S.a], [1, HEAD_S]),
  stack([5, HILT_S], [13, LEGS_S.b], [9, TRUNK_S], [11, SHIELD_S], [10, ARM_S.b], [1, HEAD_S]),
];

export const CONCEPT: Concept = {
  code: 'C7b',
  id: 'wedrowiec-b',
  name: { pl: 'Wędrowiec', en: 'Traveller' },
  note: {
    pl: "C7 z płaskim profilem: bez nosa, grzywka do krawędzi, płytsza głowa; przód i tył bez zmian",
    en: "C7 with a flat profile: no nose, the fringe to the front edge, a shallower head; front and back unchanged",
  },
  h: H,
  pal: {
    l: 0xb07444, h: 0x7e4a2c, H: 0x5a3220, t: 0xfadcbc, s: 0xebb48c, S: 0xc27c5a, D: 0x2e1a18,
    g: 0x5a8048, G: 0x3a5a36, k: 0x8a5a34, K: 0x5e3a24, r: 0xc2443a, R: 0x8a2a2e, m: 0xd8dcd0,
  },
  frames: { down, up, side },
  ink: 'tinted',
  outline: 0x2e1a18,
  line: { g: 0x1e3324, G: 0x1e3324 },
};
