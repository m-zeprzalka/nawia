// M17 Bies (bies-b): an alternative to P15, the red horned devil.
//
// The idea: "bies" is simply the name for an evil spirit, so this one is drawn from the oldest picture of it, the
// black thing of the bog: gaunt and too tall, shaggy black fur over a starved trunk where the ribs show, goat legs
// that bend back at the hock, a long bare goat face hung forward with a light for an eye, two backswept horns. Its
// arms are longer than its body, the near one bent at one joint too many, the claws hanging below the knee.
// It moves: a lurching stamp on the goat legs; the body sinks a pixel on each step and the long arms swing.
// It attacks: it rears up on its hocks with both arms drawn back over its head and the jaw open (the wind-up),
// then comes down with all its weight and drives both claws into the ground in front of it (the blow).
// Nawia: there it is a hole in the world, black and blue, its edges and ribs lit with cold light, the eye white.

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
  d: 0x1e161c, // fur, the deepest; the hooves
  f: 0x33262c, // fur
  g: 0x4c3c40, // fur, the lit side; the far arm
  G: 0x6c5a58, // fur, the lit tips; the ribs
  N: 0x6e605a, // bare skin, the shadow: face, arms, shins
  n: 0x9a8a7e, // bare skin
  t: 0xc0b2a0, // bare skin, the light
  h: 0xd8ccaa, // horns and claws, the light
  H: 0x8a7a5e, // horns and claws
  e: 0xfff0a0, // the eye: only a light
  m: 0x5a1c24, // the inside of the mouth
  w: 0x56763e, // bog weed in the fur
  W: 0x34502e, // bog weed, the shadow
};
/** Nawia: the fur turns to the dark between the stars, its edges and ribs glow cold */
const PAL_NAWIA: Beast['pal'] = {
  d: 0x0a0a1e,
  f: 0x141634,
  g: 0x283068,
  G: 0x5a74d8,
  N: 0x34428a,
  n: 0x6a84d0,
  t: 0xa8c0ff,
  h: 0xe0ecff,
  H: 0x7088d8,
  e: 0xffffff,
  m: 0x9af4ff,
  w: 0x3db6c6,
  W: 0x1e6c8a,
};

// ------------------------------------------------------------------ the parts, each at its place in the standing frame

/** the head with its horns, rows 1-14 */
const HEAD = {
  /** the jaw shut, the goat beard hanging */
  shut: [
    '.............h..........',
    '.............hH.....H...',
    '..............hH...H....',
    '..............hH..H.....',
    '...............hHH......',
    '..............dhHnn.....',
    '.............ddNnnnn....',
    '..............dNnNenn...',
    '................dNnnnnn.',
    '..................NNnnN.',
    '....................dmhd',
    '.....................dNd',
    '......................d.',
    '......................d.',
  ],
  /** the jaw dropped, a fang showing */
  open: [
    '.............h..........',
    '.............hH.....H...',
    '..............hH...H....',
    '..............hH..H.....',
    '...............hHH......',
    '..............dhHnn.....',
    '.............ddNnnnn....',
    '..............dNnNenn...',
    '................dNnnnnn.',
    '..................NNnnNd',
    '...................dmmmd',
    '...................dmhNd',
    '....................dNd.',
    '.....................d..',
  ],
};
/** the mane, the starved trunk with its ribs, the haunches: rows 6-24 */
const TORSO = [
  '.........G.G............',
  '.........GgG............',
  '........GggfGfd.........',
  '.......Gggfffffd........',
  '......dgggffffd.........',
  '.......dggfffd..........',
  '........dgfgfd..........',
  '.........gGGfd..........',
  '.........gfffd..........',
  '.........dgGGd..........',
  '..........gffd..........',
  '..........gGGd..........',
  '..........gffd..........',
  '.........Ggffdd.........',
  '........Gggffffd........',
  '........ggfwfffd........',
  '........dfwfdgfd........',
  '.........Gfd.dgf........',
  '.........gfd............',
];
/** the far arm, behind the trunk (darker) */
const FAR = {
  /** hanging */
  hang: [
    '.....dg.................',
    '.....gN.................',
    '....gN..................',
    '....gN..................',
    '....gN..................',
    '....gN..................',
    '....gN..................',
    '...gN...................',
    '...gN...................',
    '...gNN..................',
    '..gNgN..................',
    '..g.g.N.................',
    '..H.H..H................',
  ],
  /** swung back */
  back: [
    '.....dg.................',
    '.....gN.................',
    '....gN..................',
    '....gN..................',
    '...gN...................',
    '...gN...................',
    '...gN...................',
    '..gN....................',
    '..gN....................',
    '..gNN...................',
    '.gNgN...................',
    '.g.g.N..................',
    '.H.H..H.................',
  ],
  /** drawn back over the shoulder */
  up: [
    'H.H.....................',
    'g.gN....................',
    'gNgN....................',
    '.gN.....................',
    '..gN....................',
    '...gN...................',
    '....gN..................',
    '.....dg.................',
  ],
  /** brought down in front */
  slam: [
    '...................gN...',
    '...................gN...',
    '...................gN...',
    '....................gN..',
    '....................gN..',
    '...................ggN..',
    '...................gNgN.',
    '..................g.g.N.',
    '..................H.H..H',
  ],
};
/** the near arm, in front of everything */
const NEAR = {
  /** hanging: the elbow bends forward, then a second joint bends it back */
  hang: [
    '..............tn........',
    '...............nN.......',
    '................nN......',
    '................nN......',
    '...............nN.......',
    '...............nN.......',
    '...............nN.......',
    '................nN......',
    '................nN......',
    '.................nN.....',
    '.................nNN....',
    '................NnNN....',
    '................N.NN....',
    '................N..NN...',
    '.................h..h...',
  ],
  /** swung back */
  back: [
    '..............tn........',
    '...............nN.......',
    '...............nN.......',
    '...............nN.......',
    '..............nN........',
    '..............nN........',
    '..............nN........',
    '..............nN........',
    '..............nN........',
    '...............nN.......',
    '...............nNN......',
    '..............NnNN......',
    '..............N.NN......',
    '..............N..NN.....',
    '...............h..h.....',
  ],
  /** swung forward */
  fwd: [
    '..............tn........',
    '...............nN.......',
    '................nN......',
    '.................nN.....',
    '.................nN.....',
    '................nN......',
    '................nN......',
    '.................nN.....',
    '.................nN.....',
    '..................nN....',
    '..................nNN...',
    '.................NnNN...',
    '.................N.NN...',
    '.................N..NN..',
    '..................h..h..',
  ],
  /** drawn back over the head, the claws open */
  up: [
    '....h.h.h...............',
    '....n.n.n...............',
    '....nNnnN...............',
    '.....nnN................',
    '......nN................',
    '.......tN...............',
    '........tN..............',
    '.........tN.............',
    '..........tn............',
    '...........tn...........',
    '............tn..........',
  ],
  /** brought down, the claws in the ground */
  slam: [
    '...............tn.......',
    '................nN......',
    '................nN......',
    '.................nN.....',
    '.................nN.....',
    '.................nN.....',
    '..................nN....',
    '..................nN....',
    '..................nN....',
    '..................nNN...',
    '.................NnNN...',
    '................NnNNN...',
    '................N.N.NN..',
    '...............N..N..N..',
    '..............h..h...h..',
  ],
};
/** below the haunches, from row 25 */
const LEGS = {
  /** goat legs: the hock bends back, the bare shin, the hoof */
  stand: [
    '.........gf...nN........',
    '........gf...nN.........',
    '......dgf...nN..........',
    '.......gf...nN..........',
    '......dfd..dfd..........',
    '.....dGdd.dGdd..........',
  ],
  /** the near hoof lifted forward */
  near_up: [
    '.........gf.....nN......',
    '........gf.....nN.......',
    '......dgf.....nN........',
    '.......gf....dnNd.......',
    '......dfd....dGdd.......',
    '.....dGdd...............',
  ],
  /** the far hoof lifted forward, behind */
  far_up: [
    '..........gf..nN........',
    '.........gf..nN.........',
    '........dgf.nN..........',
    '.........dGdnN..........',
    '...........dfd..........',
    '..........dGdd..........',
  ],
  /** stretched: reared up on them */
  rear: [
    '........gf....nN........',
    '.......gf.....nN........',
    '......gf......nN........',
    '.....dgf.....nN.........',
    '.....gf......nN.........',
    '.....gf......nN.........',
    '....dfd.....dfd.........',
    '...dGdd....dGdd.........',
  ],
  /** folded under it */
  crouch: [
    '......dgf....nN.........',
    '.....dfd....dfd.........',
    '....dGdd...dGdd.........',
  ],
};
/** what flies up where the claws go in, rows 24-30 */
const DUST = [
  '.......................t',
  '......................n.',
  '..............t.........',
  '.............nN.......nt',
  '............N.........N.',
  '...........nN...........',
  '..........nN............',
];

// ------------------------------------------------------------------ the frames
// [row, part, column shift]: the later parts are drawn over the earlier ones.

const stand = stack([11, FAR.hang], [6, TORSO], [25, LEGS.stand], [1, HEAD.shut], [11, NEAR.hang]);
const walk = [
  stack([12, FAR.hang, 1], [7, TORSO], [25, LEGS.near_up], [2, HEAD.shut], [12, NEAR.back]), // the near hoof steps, the body sinks
  stack([12, FAR.back], [7, TORSO], [25, LEGS.far_up], [2, HEAD.shut], [12, NEAR.fwd]), // the far hoof steps
];
const attack = [
  stack([3, FAR.up], [4, TORSO, -1], [22, LEGS.rear], [0, HEAD.open, -1], [0, NEAR.up]), // rears up, both arms drawn back
  stack([19, FAR.slam], [9, TORSO, 1], [28, LEGS.crouch], [6, HEAD.open], [15, NEAR.slam], [24, DUST]), // comes down: both claws into the ground
];

export const BEAST: Beast = {
  code: 'M17',
  id: 'bies-b',
  kind: { pl: 'Bies', en: 'Bies' },
  name: { pl: 'bies z bagna', en: 'bog bies' },
  note: { pl: 'Wychudły, kudłaty, na kozich nogach, z długim pyskiem; staje dęba i wbija oba szpony w ziemię.', en: 'Gaunt and shaggy on goat legs, with a long face; it rears up and drives both claws into the ground.' },
  alt: ['P15'],
  w: W,
  h: H,
  view: 'side',
  pal: PAL,
  frames: { stand, walk, attack },
  ink: 'dark',
  outline: 0x120c10,
  nawia: {
    pal: PAL_NAWIA,
    ink: { ink: 'dark', outline: 0x03040c },
    note: {
      pl: 'W Nawii to dziura w świecie: czarny, z zimno świecącymi krawędziami i żebrami.',
      en: 'In Nawia it is a hole in the world: black, its edges and ribs lit cold.',
    },
  },
};
