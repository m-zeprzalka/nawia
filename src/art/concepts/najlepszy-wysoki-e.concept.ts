// C2e: the same lad as C1e, between one tile and C2: 16 x 18, with C1e's redrawn profile: a rounded skull,
// a neck, the cloak over the back half, the shield a small disc at the hip, a longer stride.
//
// The art lead asked for C2 lower (between C1 and C2) and, like C1, slimmer from the side. So: C1's head,
// a trunk one row longer than C1's (the shirt reaches below the belt), legs one row longer, the cloak to
// the back of the knees; and C1b's slim profile.

import type { Concept, Frames } from './concept.ts';
import { HEAD_D, HEAD_U, LINE, PAL, SHIELD_D, SHIELD_U } from './najlepszy.concept.ts';
import { HEAD_S, SHIELD_S } from './najlepszy-e.concept.ts';

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

const TRUNK_D = [
  '....RbrsSrAC....',
  '...bRbaaaaACA...',
  '...rRbaaaaACR...',
  '...sRkkklkkCS...',
  '....RbaaaaAC....',
  '....RbaaaAAC....',
];
const ARM_FWD_D = ['...b............', '...r............', '...s............'];
const ARM_BACK_D = ['...b............', '...b............', '...r............', '...R............'];
const LEGS_D = {
  stand: ['....RpP..pPC....', '.....pP..pP.....', '.....kK..kK.....', '....kkK..kkK....'],
  a: ['....RpP..pPC....', '.....pP..pP.....', '.....kK..kkK....', '....kkK.........'],
  b: ['....RpP..pPC....', '.....pP..pP.....', '....kkK..kK.....', '.........kkK....'],
};

// ------------------------------------------------------------------ from behind

const TRUNK_U = [
  '....rRRRRRRC....',
  '...arRRRRRRCA...',
  '...rrRRRRRCCR...',
  '...srRRRRRCCS...',
  '....rRRRRRCC....',
  '....rRRRRCCC....',
  '....rRCRRCCC....',
];
const LEGS_U = {
  stand: ['.....pP..pP.....', '.....pP..pP.....', '.....kK..kK.....', '....kkK..kkK....'],
  a: ['.....pP..pP.....', '.....pP..pP.....', '.....kK..kkK....', '....kkK.........'],
  b: ['.....pP..pP.....', '.....pP..pP.....', '....kkK..kK.....', '.........kkK....'],
};

// ------------------------------------------------------------------ from the side, facing right: slim

/** neck and collar; the cloak covers the back half, the shirt shows in front and below the belt */
const TRUNK_S = [
  '......Rrssr.....',
  '.....RRRbaA.....',
  '....RRRCbaA.....',
  '....RRCCklK.....',
  '....RRCCbaA.....',
  '...RRCC.baA.....',
];
const ARM_S = {
  stand: ['.......ba.......', '.......ba.......', '.......rb.......', '.......ss.......'],
  fwd: ['........ba......', '........ba......', '.........rb.....', '.........ss.....'],
  back: ['......ba........', '......ba........', '.....rb.........', '.....ss.........'],
};
const LEGS_S = {
  stand: ['...CC..pP.......', '.......pP.......', '.......kK.......', '......kkKk......'],
  near: ['...CC.PppP......', '.....PP..pp.....', '....KK....kk....', '....KK....kkK...'],
  far: ['...CC.pPPp......', '.....pp..PP.....', '....kk....KK....', '....kk....KKK...'],
};

// ------------------------------------------------------------------ the frames

const down: Frames = [
  stack([0, HEAD_D], [7, TRUNK_D], [13, LEGS_D.stand], [9, SHIELD_D]),
  stack([13, LEGS_D.a], [1, HEAD_D], [8, TRUNK_D], [9, ARM_FWD_D], [10, SHIELD_D]),
  stack([13, LEGS_D.b], [1, HEAD_D], [8, TRUNK_D], [9, ARM_BACK_D], [10, SHIELD_D]),
];
const up: Frames = [
  stack([9, SHIELD_U], [13, LEGS_U.stand], [0, HEAD_U], [7, TRUNK_U]),
  stack([10, SHIELD_U], [13, LEGS_U.a], [1, HEAD_U], [8, TRUNK_U]),
  stack([10, SHIELD_U], [13, LEGS_U.b], [1, HEAD_U], [8, TRUNK_U]),
];
const side: Frames = [
  stack([10, SHIELD_S], [13, LEGS_S.stand], [7, TRUNK_S], [8, ARM_S.stand], [0, HEAD_S]),
  stack([11, SHIELD_S], [13, LEGS_S.near], [8, TRUNK_S], [9, ARM_S.back], [1, HEAD_S]),
  stack([11, SHIELD_S], [13, LEGS_S.far], [8, TRUNK_S], [9, ARM_S.fwd], [1, HEAD_S]),
];

export const CONCEPT: Concept = {
  code: 'C2e',
  id: 'najlepszy-wysoki-e',
  name: { pl: 'Najlepszy 16x18', en: 'Best of 16x18' },
  note: {
    pl: "między C1 a C2 (16x18), z profilem C1e: okrągła czaszka, szyja, płaszcz z tyłu, tarcza przy biodrze",
    en: "between C1 and C2 (16x18), with C1e's profile: a rounded skull, a neck, the cloak behind, the shield at the hip",
  },
  h: H,
  pal: PAL,
  frames: { down, up, side },
  ink: 'rim',
  outline: 0x2f3858,
  line: LINE,
};
