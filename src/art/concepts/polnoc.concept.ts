// C8: Sambor of the North.
//
// The northern spirit of the hero: shoulder-length dark-blond hair, a stubble line on the jaw, a grey fur
// collar over a woad-blue tunic, a red woven sash, leather bracers and wrapped boots; a round wooden shield
// with an iron rim and boss, a short bow slung across the back, a sword at the hip. Drawn like an inked
// comic: one near-black line all round, three hard tones per material, no dithering, light from the upper left.
//
// Broad in front (the fur collar takes nearly the whole cell), slim from the side (ten pixels against
// fourteen). The sword hangs at his right hip so it shows in every view; the shield is on his left arm.
// Built from parts, so the three views and the walk stay one person; on a stride the head and trunk sink a pixel.

import type { Concept, Frames } from './concept.ts';

const H = 20;

/** Lays drawings over each other, each `dy` rows down; '.' lets what is below show through. */
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
  '......hllh......',
  '.....hllhhH.....',
  '....hSOssOSH....',
  '....hfDssDfH....',
  '....hsssSsSH....',
  '....htsSSstH....',
  '....HHtsstHH....',
];
const TRUNK_D = [
  '...fFFSSSSFFM...',
  '.FffFFFbBFFFMMM.',
  '.MbBMbBBBBDMDDM.',
  '..hHrrrrrrrrHk..',
  '..sSbrBBBBDDsS..',
];
/** the bow's upper horn over his right shoulder */
const BOW_D = ['..k.............', '..H.............', '..H.............'];
/** the sword at his right hip: the pommel by his elbow, the scabbard below his hand */
const SWORD_D = ['....f...........', '................', '................', '..F.............', '..H.............', '..H.............', '..F.............'];
const LEGS_D = {
  stand: ['....BDD.DDM.....', '....BDD.DDM.....', '....hHH.hHH.....', '....HkH.HkH.....', '....kkk.kkk.....', '...Hkkk.Hkkk....'],
  a: ['....BDD.DDM.....', '....BDD.DDM.....', '....hHH.hHH.....', '....HkH.kkk.....', '....kkk.Hkkk....', '...Hkkk.........'],
  b: ['....BDD.DDM.....', '....BDD.DDM.....', '....hHH.hHH.....', '....kkk.HkH.....', '...Hkkk.kkk.....', '........Hkkk....'],
};
const SHIELD_D = [
  '..........fFFM..',
  '.........fhhhHM.',
  '.........FhfFHM.',
  '.........FhFMkM.',
  '.........FHHHkM.',
  '..........MMMM..',
];

// ------------------------------------------------------------------ from behind

const HEAD_U = [
  '......hllh......',
  '.....hlllhH.....',
  '....hllhhhhH....',
  '....hlhhhhHH....',
  '....hhhhhHHH....',
  '....hhHhhHHk....',
  '.....hHhHHk.....',
];
const TRUNK_U = [
  '...fFFHFHFFMM...',
  '.FffFFFFFFMMMMM.',
  '.MbBMFFFFMMMDDM.',
  '..hHrrrrrrrrHk..',
  '..sSBBBBBBDDsS..',
];
const BOW_U = [
  '.............k..',
  '............Hk..',
  '...........Hk...',
  '..........Hk....',
  '.........Hk.....',
  '........Hk......',
  '.......Hk.......',
  '......Hk........',
];
const SWORD_U = ['............k...', '............k...', '............k...', '............F...'];
const LEGS_U = LEGS_D;
const SHIELD_U = [
  '..FFFM..........',
  '.fHHHkM.........',
  '.FHsSkM.........',
  '.FHHkkM.........',
  '.MHHkkM.........',
  '..MMMM..........',
];

// ------------------------------------------------------------------ from the side, facing right

const HEAD_S = [
  '......hllhH.....',
  '.....hlllhhs....',
  '.....hllhhOs....',
  '.....hhhHfDs....',
  '.....hhhHSsss...',
  '.....HhhtssS....',
  '......HHSttt....',
];
const TRUNK_S = [
  '.....hHfSSf.....',
  '....ffffFFF.....',
  '.....bBBBBD.....',
  '.....rrrrrr.....',
  '.....bBBBDD.....',
];
const BOW_S = ['.....k..........', '....H...........', '....H...........', '....h...........', '....h...........', '....H...........', '.....k..........'];
/** the sword at his right hip, the near one: its hilt is under his hand, the scabbard shows behind his legs */
const SWORD_S = ['.....k..........', '.....k..........', '....k...........', '....k...........', '...F............'];
const ARM_S = {
  stand: ['.......bB.......', '.......hH.......', '.......sS.......'],
  a: ['.......bB.......', '........hH......', '.........sS.....'],
  b: ['......bB........', '.....hH.........', '....sS..........'],
};
const LEGS_S = {
  stand: ['......DDM.......', '......DDM.......', '......hHH.......', '......HkH.......', '......kkk.......', '......Hkkk......'],
  a: ['.....BDDM.......', '.....DM.BD......', '....DM...BD.....', '....kH....hH....', '...kk.....Hk....', '...k......Hkkk..'],
  b: ['.....BDDM.......', '.....BD.DM......', '....BD...DM.....', '....hH....kH....', '...Hk.....kk....', '...k......kkkk..'],
};
const SHIELD_S = [
  '..........FFM...',
  '.........fhhHM..',
  '.........FhfHM..',
  '.........FhHkM..',
  '.........MHHkM..',
  '..........MMM...',
];

// ------------------------------------------------------------------ the frames

const down: Frames = [
  stack([13, LEGS_D.stand], [1, HEAD_D], [8, TRUNK_D], [10, SWORD_D], [6, BOW_D], [11, SHIELD_D]),
  stack([13, LEGS_D.a], [2, HEAD_D], [9, TRUNK_D], [11, SWORD_D], [7, BOW_D], [12, SHIELD_D]),
  stack([13, LEGS_D.b], [2, HEAD_D], [9, TRUNK_D], [11, SWORD_D], [7, BOW_D], [12, SHIELD_D]),
];
const up: Frames = [
  stack([13, LEGS_U.stand], [12, SWORD_U], [1, HEAD_U], [8, TRUNK_U], [6, BOW_U], [11, SHIELD_U]),
  stack([13, LEGS_U.a], [13, SWORD_U], [2, HEAD_U], [9, TRUNK_U], [7, BOW_U], [12, SHIELD_U]),
  stack([13, LEGS_U.b], [13, SWORD_U], [2, HEAD_U], [9, TRUNK_U], [7, BOW_U], [12, SHIELD_U]),
];
const side: Frames = [
  stack([5, BOW_S], [12, SWORD_S], [13, LEGS_S.stand], [8, TRUNK_S], [9, SHIELD_S], [10, ARM_S.stand], [1, HEAD_S]),
  stack([6, BOW_S], [13, SWORD_S], [13, LEGS_S.a], [9, TRUNK_S], [10, SHIELD_S], [11, ARM_S.a], [2, HEAD_S]),
  stack([6, BOW_S], [13, SWORD_S], [13, LEGS_S.b], [9, TRUNK_S], [10, SHIELD_S], [11, ARM_S.b], [2, HEAD_S]),
];

export const CONCEPT: Concept = {
  code: 'C8',
  id: 'polnoc',
  name: { pl: 'Z Północy', en: 'Northman' },
  note: {
    pl: "płowe włosy do ramion, zarost, futrzany kołnierz, łuk na plecach, tarcza z okuciem; czarny kontur, twarde trzy tony",
    en: "shoulder-length fair hair, stubble, a fur collar, a bow on his back, a bossed shield; a black line, three hard tones",
  },
  h: H,
  pal: {
    O: 0x1c1622, // line, lids
    l: 0xe6c06a, h: 0xa8803c, H: 0x6c4824, // hair; leather and wood share the two darker tones
    k: 0x4a2c1c, // dark leather
    s: 0xf0bf98, S: 0xc07c5c, // skin
    b: 0x5f93c9, B: 0x3a62a0, D: 0x253c6b, // woad-blue tunic
    r: 0xb8443a, // the red of the woven sash
    f: 0xece2c8, F: 0x9c8c78, M: 0x564e58, // fur, wool and iron
    t: 0xa8826c, // stubble
  },
  frames: { down, up, side },
  ink: 'dark',
  outline: 0x1c1622,
};
