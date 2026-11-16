// C2f: C2e (the same lad as C1g, 16 x 18: a trunk and legs a row longer than C1's) with C1g's profile eye,
// drawn the way it is facing us: a dark lid over a white and a blue iris, on the same rows.
//
// The heads, the shields and the colours are C1g's (najlepszy-g.concept.ts): change them there and C2f changes
// too. The trunk, the arms and the legs are this file's. See docs/HERO-DRAWING.md.

import type { Concept, Frames } from './concept.ts';
import { HEAD_D, HEAD_S, HEAD_U, LINE, PAL, SHIELD_D, SHIELD_S, SHIELD_U } from './najlepszy-g.concept.ts';

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
  code: 'C2f',
  id: 'najlepszy-wysoki-f',
  name: { pl: 'Najlepszy 16x18', en: 'Best of 16x18' },
  note: {
    pl: "C2e (16x18) z okiem z boku takim jak z przodu: powieka nad białkiem i niebieską tęczówką, na tej samej wysokości",
    en: "C2e (16x18) with the eye in profile as it is facing us: a lid over a white and a blue iris, at the same height",
  },
  h: H,
  pal: PAL,
  frames: { down, up, side },
  ink: 'rim',
  outline: 0x2f3858,
  line: LINE,
};
