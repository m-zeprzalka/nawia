// C2d: the same lad as C1d, between one tile and C2: 16 x 18 (C2c with C1d's narrow profile).
//
// The art lead asked for C2 lower (between C1 and C2) and, like C1, slimmer from the side. So: C1's head,
// a trunk one row longer than C1's (the shirt reaches below the belt), legs one row longer, the cloak to
// the back of the knees; and C1b's slim profile.

import type { Concept, Frames } from './concept.ts';
import { HEAD_D, HEAD_U, LINE, PAL, SHIELD_D, SHIELD_U } from './najlepszy.concept.ts';
import { HEAD_S, SHIELD_EDGE } from './najlepszy-d.concept.ts';

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

const TRUNK_S = [
  '.....RbrS.......',
  '.....RbaaA......',
  '....RRbaaA......',
  '....RCkklK......',
  '....RCbaaA......',
  '....RCbaAA......',
];
const ARM_S = {
  stand: ['.......ba.......', '.......ba.......', '.......rb.......', '.......ss.......'],
  a: ['.......ba.......', '........ba......', '.........rb.....', '.........ss.....'],
  b: ['......ba........', '......ba........', '.....rb.........', '.....ss.........'],
};
const LEGS_S = {
  stand: ['....CCpP........', '......pP........', '......kK........', '......kKk.......'],
  a: ['....CCpPP.......', '.....pP.pP......', '....kK...kK.....', '....kK...kKk....'],
  b: ['....CCPpp.......', '.....PP.pp......', '....KK...kk.....', '....KK...kkk....'],
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
  stack([13, LEGS_S.stand], [7, TRUNK_S], [9, SHIELD_EDGE], [8, ARM_S.stand], [0, HEAD_S]),
  stack([13, LEGS_S.a], [8, TRUNK_S], [10, SHIELD_EDGE], [9, ARM_S.a], [1, HEAD_S]),
  stack([13, LEGS_S.b], [8, TRUNK_S], [10, SHIELD_EDGE], [9, ARM_S.b], [1, HEAD_S]),
];

export const CONCEPT: Concept = {
  code: 'C2d',
  id: 'najlepszy-wysoki-d',
  name: { pl: 'Najlepszy 16x18', en: 'Best of 16x18' },
  note: {
    pl: "między C1 a C2: ta sama głowa, koszula za pas, dłuższe nogi, płaszcz do kolan; wąski profil jak w C1d",
    en: "between C1 and C2: the same head, a shirt below the belt, longer legs, the cloak to the knees; C1d's narrow profile",
  },
  h: H,
  pal: PAL,
  frames: { down, up, side },
  ink: 'rim',
  outline: 0x2f3858,
  line: LINE,
};
