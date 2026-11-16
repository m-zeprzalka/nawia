// C1e: C1 with its profile drawn again from nothing (16 x 16).
//
// The art lead found the side of C1d still weak. What was wrong with it, seen at 20x: the head had a flat,
// square top with a big light patch, so it read as a helmet; it sat straight on the shirt with no neck; the
// shield seen edge-on and the arm in front of it made a dark brown post down the front of the body, the
// loudest thing in the picture; the legs were short and stiff.
// Here: a rounded skull, the crown lit from the upper left, the fringe sweeping forward over the brow, hair
// down to the nape; a short neck set back behind the chin; the chest a pixel ahead of the belly; the cloak
// hanging off the back and opening at the hem; the shield only as a small red disc at his hip, held by the
// far arm; the near arm swinging over the body; a longer, scissoring stride. The face as before: flat, no
// nose, the eye a single dark pixel under the fringe. The face and the neck in profile are shaded only by
// the light skin and the rim: C1's skin shadow is the brown of its hair, and on a jaw it read as a beard.
// Front and back are C1's.

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

// ------------------------------------------------------------------ from the side, facing right

/** a rounded skull, the fringe swept forward, the ear between hair, the chin set back from the face */
export const HEAD_S = [
  '.......hhh......',
  '......lhhhh.....',
  '.....hhhhhhh....',
  '.....HhhhhhH....',
  '.....HhshsKs....',
  '.....HhHssss....',
  '......HHsss.....',
]
/** neck and collar; the cloak covers the back half of him, the shirt shows only in front */
export const TRUNK_S = [
  '......Rrssr.....',
  '.....RRRbaA.....',
  '....RRRCbaA.....',
  '....RRCCklK.....',
  '...RRCC.baA.....',
];
/** the near arm: hangs, swings forward, swings back */
export const ARM_S = {
  stand: ['.......ba.......', '.......rb.......', '.......ss.......'],
  fwd: ['........ba......', '........rb......', '.........ss.....'],
  back: ['......ba........', '.....rb.........', '.....ss.........'],
};
/** the shield on the far arm: a small red disc at his hip, mostly behind him */
export const SHIELD_S = ['..........kR....', '.........kRr....', '.........kRK....', '..........K.....'];
/** the legs, from the hem: standing; near leg forward; far leg forward */
export const LEGS_S = {
  stand: ['...CC..pP.......', '.......pP.......', '......kkKk......'],
  near: ['...CC.PppP......', '.....PP..pp.....', '....KK....kkK...'],
  far: ['...CC.pPPp......', '.....pp..PP.....', '....kk....KKK...'],
};

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
  stack([9, SHIELD_S], [12, LEGS_S.stand], [7, TRUNK_S], [8, ARM_S.stand], [0, HEAD_S]),
  stack([10, SHIELD_S], [12, LEGS_S.near], [8, TRUNK_S], [9, ARM_S.back], [1, HEAD_S]),
  stack([10, SHIELD_S], [12, LEGS_S.far], [8, TRUNK_S], [9, ARM_S.fwd], [1, HEAD_S]),
];

export const CONCEPT: Concept = {
  code: 'C1e',
  id: 'najlepszy-e',
  name: { pl: 'Najlepszy', en: 'Best of' },
  note: {
    pl: "C1 z profilem narysowanym od nowa: okrągła czaszka, grzywka do przodu, szyja, płaszcz z tyłu, tarcza przy biodrze, dłuższy krok",
    en: "C1 with its profile redrawn: a rounded skull, the fringe forward, a neck, the cloak behind, the shield at the hip, a longer stride",
  },
  h: H,
  pal: PAL,
  frames: { down, up, side },
  ink: 'rim',
  outline: 0x2f3858,
  line: LINE,
};
