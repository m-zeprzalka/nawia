// C1: the best of what was chosen, in one tile.
//
// From the art lead's notes (docs/DESIGN-DECISIONS.md): the painted manner of S3 (no line on the lit side,
// a rim only where the shadow falls, now a few shades lighter at the head), the play of tones of S2,
// the slim build of A1 without its big round head, more detailed eyes (a lash, a white, an iris),
// the fair-haired lad of G1 without his headband: young, a little unsure of himself.
//
// Built from parts, so the three views and the walk stay one person: a head, a trunk, legs and the shield,
// laid over each other; on a stride the head and trunk sink a pixel.

import type { Concept, Frames } from './concept.ts';

const H = 16;

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

export const HEAD_D = [
  '......hlhh......',
  '....hhllhhhH....',
  '....hlhhhhhH....',
  '....hhsthshH....',
  '....hSKssKSH....',
  '....hbpttpbH....',
  '.....tssssS.....',
];
/** the cloak hangs from both shoulders and frames him; the arms are in front of it */
const TRUNK_D = [
  '....RbrsSrAC....',
  '...bRbaaaaACA...',
  '...rRbaaaaACR...',
  '...sRkkklkkCS...',
  '....RbaaaaAC....',
];
/** the right hand (on our left) swings: forward and up a pixel, or back and out of sight */
const ARM_FWD_D = ['...b............', '...r............', '...s............'];
const ARM_BACK_D = ['...b............', '...b............', '...r............', '...R............'];
const LEGS_D = {
  stand: ['....RpP..pPC....', '.....pP..pP.....', '....kkK..kkK....'],
  a: ['....RpP..pPC....', '.....pP..kkK....', '....kkK.........'],
  b: ['....RpP..pPC....', '....kkK..pP.....', '.........kkK....'],
};
export const SHIELD_D = ['..........kkk...', '.........kRrRk..', '.........kRbRK..', '.........kRRCK..', '..........KKK...'];

// ------------------------------------------------------------------ from behind

export const HEAD_U = [
  '......hlhh......',
  '....hhllhhhH....',
  '....hlhhhhhH....',
  '....hlhhhhHH....',
  '....hhlhhhHH....',
  '....HhhhhHHH....',
  '.....HhHHHH.....',
];
const TRUNK_U = [
  '....rRRRRRRC....',
  '...arRRRRRRCA...',
  '...rrRRRRRCCR...',
  '...srRRRRRCCS...',
  '....rRRRRRCC....',
  '....RRCRRCCC....',
];
const LEGS_U = {
  stand: ['.....pP..pP.....', '.....pP..pP.....', '....kkK..kkK....'],
  a: ['.....pP..pP.....', '.....pP..kkK....', '....kkK.........'],
  b: ['.....pP..pP.....', '....kkK..pP.....', '.........kkK....'],
};
/** the inside of the shield, on his left arm: on our left */
export const SHIELD_U = ['..kk............', '.kkK............', '.kKK............', '.kKK............', '..KK............'];

// ------------------------------------------------------------------ from the side, facing right

export const HEAD_S = [
  '.....hhlhh......',
  '....hlllhhhh....',
  '...hhlhhhhhhh...',
  '...hhhhhhhhts...',
  '...hHhhhsSsKs...',
  '...HhhhhHssptt..',
  '....HHhHSssS....',
];
const TRUNK_S = [
  '....RRbrsA......',
  '...rRRbaaaaA....',
  '...RRCbaaaaA....',
  '...RCCkkklkK....',
  '...RCCbaaaAA....',
];
const ARM_S = {
  stand: ['.......ba.......', '.......rb.......', '.......ss.......'],
  a: ['........ba......', '.........rb.....', '..........ss....'],
  b: ['......ba........', '.....rb.........', '....ss..........'],
};
const LEGS_S = {
  stand: ['.....CC.pP......', '.......ppP......', '.......kkKk.....'],
  a: ['...CC..ppPP.....', '.....pP...pP....', '....kK....kkKk..'],
  b: ['...CC..pPp......', '.......pP.......', '.......kkKk.....'],
};
export const SHIELD_S = ['.......kkk......', '......kRrRk.....', '......kRbRK.....', '......kRRCK.....', '.......KKK......'];

// ------------------------------------------------------------------ the frames

const down: Frames = [
  stack([0, HEAD_D], [7, TRUNK_D], [12, LEGS_D.stand], [8, SHIELD_D]),
  stack([12, LEGS_D.a], [1, HEAD_D], [8, TRUNK_D], [8, ARM_FWD_D], [9, SHIELD_D]),
  stack([12, LEGS_D.b], [1, HEAD_D], [8, TRUNK_D], [8, ARM_BACK_D], [9, SHIELD_D]),
];
const up: Frames = [
  stack([8, SHIELD_U], [12, LEGS_U.stand], [0, HEAD_U], [7, TRUNK_U]),
  stack([9, SHIELD_U], [12, LEGS_U.a], [1, HEAD_U], [8, TRUNK_U]),
  stack([9, SHIELD_U], [12, LEGS_U.b], [1, HEAD_U], [8, TRUNK_U]),
];
const side: Frames = [
  stack([12, LEGS_S.stand], [7, TRUNK_S], [7, ARM_S.stand], [0, HEAD_S], [8, SHIELD_S]),
  stack([12, LEGS_S.a], [8, TRUNK_S], [8, ARM_S.a], [1, HEAD_S], [9, SHIELD_S]),
  stack([12, LEGS_S.b], [8, TRUNK_S], [8, ARM_S.b], [1, HEAD_S], [9, SHIELD_S]),
];

/** shared with C2, the same lad a tile and a quarter tall */
export const PAL: Concept['pal'] = {
  l: 0xf2d488, h: 0xd6a04a, H: 0xb87a50, S: 0xb87a50, t: 0xfde0c0, s: 0xf3c6a0, K: 0x4e3230,
  p: 0x4a5878, P: 0x2f3858, b: 0xf4f6ee, a: 0xd9dad2, A: 0x9ea0ac, r: 0xd0604e, R: 0xa83a44, C: 0x6e2440, k: 0x7a5238,
};
export const LINE: Concept['line'] = { h: 0x7a5238, H: 0x7a5238, l: 0x7a5238, s: 0x7a5238, S: 0x7a5238, t: 0x7a5238, b: 0x7a5238, r: 0x6e2440, R: 0x6e2440, C: 0x6e2440, k: 0x4e3230, K: 0x4e3230 };

export const CONCEPT: Concept = {
  code: 'C1',
  id: 'najlepszy',
  name: { pl: 'Najlepsze z wybranych', en: 'Best of the chosen' },
  note: {
    pl: 'malowany jak S3 (jaśniejszy brzeg głowy), tony S2, smukły jak A1 z mniejszą głową, oczy z bielą i tęczówką, bez opaski',
    en: 'painted like S3 (a lighter edge to the head), the tones of S2, slim like A1 with a smaller head, eyes with a white and an iris, no headband',
  },
  h: H,
  pal: PAL,
  frames: { down, up, side },
  ink: 'rim',
  outline: 0x2f3858,
  // the rim takes a dark of what it borders; round the head it is the warm brown of leather, lighter than before
  line: LINE,
};
