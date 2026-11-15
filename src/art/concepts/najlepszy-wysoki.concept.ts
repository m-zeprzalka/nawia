// C2: the same lad as C1, a tile and a quarter tall (16 x 20).
//
// The head, the shield and the colours are C1's; only the body is longer: sleeves to the wrist, a shirt
// to mid-thigh under the belt, legs with boot shafts, the cloak to the back of the knees. Set side by side,
// C1 and C2 answer one question: one tile, or a little more?

import type { Concept, Frames } from './concept.ts';
import { HEAD_D, HEAD_S, HEAD_U, LINE, PAL, SHIELD_D, SHIELD_S, SHIELD_U } from './najlepszy.concept.ts';

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

const TRUNK_D = [
  '....RbrsSrAC....',
  '...bRbaaaaACA...',
  '...bRbaaaaACA...',
  '...rRbaaaaACR...',
  '...sRkkklkkCS...',
  '....RbaaaaAC....',
  '....RbaaaAAC....',
];
const ARM_FWD_D = ['...b............', '...b............', '...r............', '...s............'];
const ARM_BACK_D = ['...b............', '...b............', '...b............', '...r............', '...R............'];
const LEGS_D = {
  stand: ['....RpP..pPC....', '.....pP..pP.....', '.....pP..pP.....', '.....kK..kK.....', '....kkK..kkK....'],
  a: ['....RpP..pPC....', '.....pP..pP.....', '.....pP..kK.....', '.....kK..kkK....', '....kkK.........'],
  b: ['....RpP..pPC....', '.....pP..pP.....', '.....kK..pP.....', '....kkK..kK.....', '.........kkK....'],
};

// ------------------------------------------------------------------ from behind

const TRUNK_U = [
  '....rRRRRRRC....',
  '...arRRRRRRCA...',
  '...arRRRRRRCA...',
  '...rrRRRRRCCR...',
  '...srRRRRRCCS...',
  '....rRRRRRCC....',
  '....rRRRRCCC....',
  '....rRCRRCCC....',
  '....RC.RC.CC....',
];
const LEGS_U = {
  stand: ['.....pP..pP.....', '.....pP..pP.....', '.....pP..pP.....', '.....kK..kK.....', '....kkK..kkK....'],
  a: ['.....pP..pP.....', '.....pP..pP.....', '.....pP..kK.....', '.....kK..kkK....', '....kkK.........'],
  b: ['.....pP..pP.....', '.....pP..pP.....', '.....kK..pP.....', '....kkK..kK.....', '.........kkK....'],
};

// ------------------------------------------------------------------ from the side, facing right

const TRUNK_S = [
  '....RRbrsA......',
  '...rRRbaaaA.....',
  '...RRCbaaaA.....',
  '...RRCbaaaA.....',
  '...RCCkkklK.....',
  '...RCCbaaaA.....',
  '...RCCbaaAA.....',
  '...RCC..........',
];
const ARM_S = {
  stand: ['.......ba.......', '.......ba.......', '.......rb.......', '.......ss.......'],
  a: ['........ba......', '........ba......', '.........rb.....', '..........ss....'],
  b: ['......ba........', '.....ba.........', '.....rb.........', '....ss..........'],
};
const LEGS_S = {
  stand: ['.......ppP......', '.......ppP......', '.......ppP......', '.......kkK......', '.......kkKk.....'],
  a: ['......ppPP......', '.....pp..pP.....', '....pP....pP....', '....kK....kK....', '...kkK....kkKk..'],
  b: ['......PPpp......', '.....PP..pp.....', '....PP....pp....', '....KK....kk....', '...KKK....kkkK..'],
};

// ------------------------------------------------------------------ the frames

const down: Frames = [
  stack([0, HEAD_D], [7, TRUNK_D], [14, LEGS_D.stand], [9, SHIELD_D]),
  stack([14, LEGS_D.a], [1, HEAD_D], [8, TRUNK_D], [9, ARM_FWD_D], [10, SHIELD_D]),
  stack([14, LEGS_D.b], [1, HEAD_D], [8, TRUNK_D], [9, ARM_BACK_D], [10, SHIELD_D]),
];
const up: Frames = [
  stack([9, SHIELD_U], [14, LEGS_U.stand], [0, HEAD_U], [7, TRUNK_U]),
  stack([10, SHIELD_U], [14, LEGS_U.a], [1, HEAD_U], [8, TRUNK_U]),
  stack([10, SHIELD_U], [14, LEGS_U.b], [1, HEAD_U], [8, TRUNK_U]),
];
const side: Frames = [
  stack([14, LEGS_S.stand], [7, TRUNK_S], [8, ARM_S.stand], [0, HEAD_S], [9, SHIELD_S]),
  stack([14, LEGS_S.a], [8, TRUNK_S], [9, ARM_S.a], [1, HEAD_S], [10, SHIELD_S]),
  stack([14, LEGS_S.b], [8, TRUNK_S], [9, ARM_S.b], [1, HEAD_S], [10, SHIELD_S]),
];

export const CONCEPT: Concept = {
  code: 'C2',
  id: 'najlepszy-wysoki',
  name: { pl: 'Najlepsze z wybranych 16x20', en: 'Best of the chosen 16x20' },
  note: {
    pl: 'C1 o ćwierć kafla wyższy: ta sama głowa, dłuższe rękawy, koszula do pół uda, cholewy, płaszcz do kolan',
    en: 'C1 a quarter of a tile taller: the same head, longer sleeves, a shirt to mid-thigh, boot shafts, the cloak to the knees',
  },
  h: H,
  pal: PAL,
  frames: { down, up, side },
  ink: 'rim',
  outline: 0x2f3858,
  line: LINE,
};
