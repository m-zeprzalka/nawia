// C1c: C1 with a slim profile and a face that does not stick out.
//
// C1b made the profile slim, but its face was a beak: a nose a pixel past the forehead read as the whole
// head pointing. Here the profile follows the 16-bit adventures the art lead keeps as references: the face
// is only the front lower corner of the head, the fringe comes down over the forehead to the front edge,
// the eye sits one pixel in from it (a lid over an iris, the white behind), the front of the face is flat,
// and there is no nose at all; the chin rounds back into the jaw. Front and back are C1's.

import type { Concept, Frames } from './concept.ts';
import { HEAD_D, HEAD_U, LINE, PAL, SHIELD_D, SHIELD_U } from './najlepszy.concept.ts';

const H = 16;

function stack(...parts: [number, string[]][]): string[] {
  const grid = Array.from({ length: H }, () => Array<string>(16).fill('.'));
  for (const [dy, rows] of parts)
    rows.forEach((r, y) => {
      const ty = y + dy;
      if (ty >= 0 && ty < H) [...r].forEach((ch, x) => ch !== '.' && (grid[ty][x] = ch));
    });
  return grid.map((r) => r.join(''));
}

// ------------------------------------------------------------------ facing us and from behind (C1's)

const TRUNK_D = [
  '....RbrsSrAC....',
  '...bRbaaaaACA...',
  '...rRbaaaaACR...',
  '...sRkkklkkCS...',
  '....RbaaaaAC....',
];
const ARM_FWD_D = ['...b............', '...r............', '...s............'];
const ARM_BACK_D = ['...b............', '...b............', '...r............', '...R............'];
const LEGS_D = {
  stand: ['....RpP..pPC....', '.....pP..pP.....', '....kkK..kkK....'],
  a: ['....RpP..pPC....', '.....pP..kkK....', '....kkK.........'],
  b: ['....RpP..pPC....', '....kkK..pP.....', '.........kkK....'],
};
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

// ------------------------------------------------------------------ from the side, facing right: slim

export const HEAD_S = [
  '......hhlh......',
  '....hhllhhhh....',
  '....hlhhhhhhh...',
  '....hhhhhhhhh...',
  '....HhhhsSSKs...',
  '....HhhhHsbps...',
  '.....HHhSssS....',
];
/** the cloak lies on his back: one column behind him, two at the hem */
const TRUNK_S = [
  '.....RbrS.......',
  '.....RbaaA......',
  '....RRbaaA......',
  '....RCkklK......',
  '....RCbaaA......',
];
const ARM_S = {
  stand: ['.......ba.......', '.......rb.......', '.......ss.......'],
  a: ['.......ba.......', '........rb......', '.........ss.....'],
  b: ['......ba........', '.....rb.........', '.....ss.........'],
};
const LEGS_S = {
  stand: ['....CCpP........', '......pP........', '......kKk.......'],
  a: ['....CCpPP.......', '.....pP.pP......', '....kK...kKk....'],
  b: ['....CCPpp.......', '.....PP.pp......', '....KK...kkk....'],
};
/** a round shield on the far arm, seen edge-on in front of him */
export const SHIELD_EDGE = ['.........kk.....', '.........Rrk....', '.........RbK....', '.........CRK....', '.........KK.....'];

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
  stack([12, LEGS_S.stand], [7, TRUNK_S], [8, SHIELD_EDGE], [8, ARM_S.stand], [0, HEAD_S]),
  stack([12, LEGS_S.a], [8, TRUNK_S], [9, SHIELD_EDGE], [9, ARM_S.a], [1, HEAD_S]),
  stack([12, LEGS_S.b], [8, TRUNK_S], [9, SHIELD_EDGE], [9, ARM_S.b], [1, HEAD_S]),
];

export const CONCEPT: Concept = {
  code: 'C1c',
  id: 'najlepszy-c',
  name: { pl: 'Najlepszy', en: 'Best of' },
  note: {
    pl: "C1 ze smukłym bokiem i nowym profilem: grzywka do krawędzi, oko piksel od przodu, płaska twarz, bez nosa",
    en: "C1 with a slim side and a new profile: the fringe to the front edge, the eye a pixel in, a flat face, no nose",
  },
  h: H,
  pal: PAL,
  frames: { down, up, side },
  ink: 'rim',
  outline: 0x2f3858,
  line: LINE,
};
