// C1g: C1e with the eye in profile drawn the way it is facing us (16 x 16).
//
// The art lead's verdict on C1e and C1f: from the side the eye is in the wrong place and is not like the eye
// facing us. Both were right. Facing us, an eye is two pixels by two: a dark lid over a white and a blue iris,
// on rows 4 and 5 of the head. In C1e's profile it was a single dark pixel on row 4, the lid's row: a row too
// high, right under the fringe, and with no white or blue it did not read as the same eye.
// Here the profile eye is the eye facing us, seen from the side: the same rows, the same three colours, the
// lid (dark over the iris, the skin's shadow over the white) on row 4, the white and the iris on row 5; the
// iris in front, towards where he looks, the white behind it; one pixel of skin in front of the iris. The hair
// now covers the temple (C1e's ear pixel between two locks made a busy row next to the eye).
// Everything else is C1e's: the rounded skull, the neck, the cloak over the back half, the shield a small red
// disc at the hip, the long stride; facing us and from behind, C1's.
//
// This file holds the whole drawing (C1h and C2f take the heads and the colours from here): see
// docs/HERO-DRAWING.md for how to change it pixel by pixel.

import type { Concept, Frames } from './concept.ts';

const H = 16;

/** Lays parts over each other, each `dy` rows down; a later part covers an earlier one; '.' lets it show. */
function stack(...parts: [number, string[]][]): string[] {
  const grid = Array.from({ length: H }, () => Array<string>(16).fill('.'));
  for (const [dy, rows] of parts)
    rows.forEach((r, y) => {
      const ty = y + dy;
      if (ty >= 0 && ty < H) [...r].forEach((ch, x) => ch !== '.' && (grid[ty][x] = ch));
    });
  return grid.map((r) => r.join(''));
}

// ------------------------------------------------------------------ the colours: one letter, one colour

export const PAL: Concept['pal'] = {
  l: 0xf2d488, // hair, the light
  h: 0xd6a04a, // hair
  H: 0xb87a50, // hair, the shadow
  S: 0xb87a50, // skin, the shadow (the hair's shadow colour: keep it off the jaw in profile, it reads as a beard)
  t: 0xfde0c0, // skin, the light
  s: 0xf3c6a0, // skin
  K: 0x4e3230, // the lids, the darkest brown
  p: 0x4a5878, // the irises and the trousers
  P: 0x2f3858, // the trousers, the shadow
  b: 0xf4f6ee, // the whites of the eyes and the shirt
  a: 0xd9dad2, // the shirt
  A: 0x9ea0ac, // the shirt, the shadow
  r: 0xd0604e, // the cloak and the shield, the light
  R: 0xa83a44, // the cloak and the shield
  C: 0x6e2440, // the cloak, the shadow
  k: 0x7a5238, // leather: belt, boots, the shield's rim
};
/** the colour of the line round him ('rim': only below and to the right), by the letter it borders */
export const LINE: Concept['line'] = { h: 0x7a5238, H: 0x7a5238, l: 0x7a5238, s: 0x7a5238, S: 0x7a5238, t: 0x7a5238, b: 0x7a5238, r: 0x6e2440, R: 0x6e2440, C: 0x6e2440, k: 0x4e3230, K: 0x4e3230 };

// ------------------------------------------------------------------ facing us

/** rows 4 and 5 are the eyes: a dark lid (K) over a blue iris (p), the skin's shadow (S) over a white (b) */
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
/** a red shield with a white boss in a leather rim, on his left arm: on our right */
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

/**
 * A rounded skull, the fringe swept forward to the brow, the hair over the temple and down to the nape.
 * Rows 4 and 5 are the eye, as facing us: the lid (S K) over the white and the iris (b p), the iris in
 * front. The face is flat, no nose; the chin is a pixel back from the face.
 */
export const HEAD_S = [
  '.......hhh......',
  '......lhhhh.....',
  '.....hhhhhhh....',
  '.....HhhhhhH....',
  '.....HhhhSKs....',
  '.....HhHsbps....',
  '......HHsss.....',
];
/** neck and collar; the cloak covers the back half of him, the shirt shows only in front */
const TRUNK_S = [
  '......Rrssr.....',
  '.....RRRbaA.....',
  '....RRRCbaA.....',
  '....RRCCklK.....',
  '...RRCC.baA.....',
];
/** the near arm: hangs, swings forward, swings back */
const ARM_S = {
  stand: ['.......ba.......', '.......rb.......', '.......ss.......'],
  fwd: ['........ba......', '........rb......', '.........ss.....'],
  back: ['......ba........', '.....rb.........', '.....ss.........'],
};
/** the shield on the far arm: a small red disc at his hip, mostly behind him */
export const SHIELD_S = ['..........kR....', '.........kRr....', '.........kRK....', '..........K.....'];
/** the legs, from the hem: standing; near leg forward; far leg forward */
const LEGS_S = {
  stand: ['...CC..pP.......', '.......pP.......', '......kkKk......'],
  near: ['...CC.PppP......', '.....PP..pp.....', '....KK....kkK...'],
  far: ['...CC.pPPp......', '.....pp..PP.....', '....kk....KKK...'],
};

// ------------------------------------------------------------------ the frames: standing, stride, other stride
// [row, part]: the part starts on that row; the later parts are drawn over the earlier ones.

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
  stack([9, SHIELD_S], [12, LEGS_S.stand], [7, TRUNK_S], [8, ARM_S.stand], [0, HEAD_S]),
  stack([10, SHIELD_S], [12, LEGS_S.near], [8, TRUNK_S], [9, ARM_S.back], [1, HEAD_S]),
  stack([10, SHIELD_S], [12, LEGS_S.far], [8, TRUNK_S], [9, ARM_S.fwd], [1, HEAD_S]),
];

export const CONCEPT: Concept = {
  code: 'C1g',
  id: 'najlepszy-g',
  name: { pl: 'Najlepszy', en: 'Best of' },
  note: {
    pl: 'C1e z okiem z boku takim jak z przodu: powieka nad białkiem i niebieską tęczówką, na tej samej wysokości; włosy na skroni',
    en: "C1e with the eye in profile as it is facing us: a lid over a white and a blue iris, at the same height; hair over the temple",
  },
  h: H,
  pal: PAL,
  frames: { down, up, side },
  ink: 'rim',
  outline: 0x2f3858,
  line: LINE,
};
