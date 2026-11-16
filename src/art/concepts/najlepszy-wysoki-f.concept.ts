// C2f: C2e (the same lad as C1g, 16 x 18: a trunk and legs a row longer than C1's) with C1g's profile eye,
// drawn the way it is facing us: a dark lid over a white and a blue iris, on the same rows.
//
// The heads, the shields and the colours are C1g's (najlepszy-g.concept.ts): change them there and C2f changes
// too. The trunk, the arms and the legs are this file's. See docs/HERO-DRAWING.md.

import type { Concept, Frames, GamePoses } from './concept.ts';
import { HEAD_D, HEAD_S, HEAD_U, LINE, PAL, SHIELD_D, SHIELD_S, SHIELD_U } from './najlepszy-g.concept.ts';

const H = 18;

/** Lays parts over each other: [row, part] or [row, part, columns to the right]; a later part covers an earlier one. */
function stack(...parts: ([number, string[]] | [number, string[], number])[]): string[] {
  const grid = Array.from({ length: H }, () => Array<string>(16).fill('.'));
  for (const [dy, rows, dx = 0] of parts)
    rows.forEach((r, y) => {
      const ty = y + dy;
      if (ty >= 0 && ty < H) [...r].forEach((ch, x) => ch !== '.' && x + dx >= 0 && x + dx < 16 && (grid[ty][x + dx] = ch));
    });
  return grid.map((r) => r.join(''));
}

// ------------------------------------------------------------------ facing us

export const TRUNK_D = [
  '....RbrsSrAC....',
  '...bRbaaaaACA...',
  '...rRbaaaaACR...',
  '...sRkkklkkCS...',
  '....RbaaaaAC....',
  '....RbaaaAAC....',
];
const ARM_FWD_D = ['...b............', '...r............', '...s............'];
const ARM_BACK_D = ['...b............', '...b............', '...r............', '...R............'];
export const LEGS_D = {
  stand: ['....RpP..pPC....', '.....pP..pP.....', '.....kK..kK.....', '....kkK..kkK....'],
  a: ['....RpP..pPC....', '.....pP..pP.....', '.....kK..kkK....', '....kkK.........'],
  b: ['....RpP..pPC....', '.....pP..pP.....', '....kkK..kK.....', '.........kkK....'],
};

// ------------------------------------------------------------------ from behind

export const TRUNK_U = [
  '....rRRRRRRC....',
  '...arRRRRRRCA...',
  '...rrRRRRRCCR...',
  '...srRRRRRCCS...',
  '....rRRRRRCC....',
  '....rRRRRCCC....',
  '....rRCRRCCC....',
];
export const LEGS_U = {
  stand: ['.....pP..pP.....', '.....pP..pP.....', '.....kK..kK.....', '....kkK..kkK....'],
  a: ['.....pP..pP.....', '.....pP..pP.....', '.....kK..kkK....', '....kkK.........'],
  b: ['.....pP..pP.....', '.....pP..pP.....', '....kkK..kK.....', '.........kkK....'],
};

// ------------------------------------------------------------------ from the side, facing right: slim

/** neck and collar; the cloak covers the back half, the shirt shows in front and below the belt */
export const TRUNK_S = [
  '......Rrssr.....',
  '.....RRRbaA.....',
  '....RRRCbaA.....',
  '....RRCCklK.....',
  '....RRCCbaA.....',
  '...RRCC.baA.....',
];
export const ARM_S = {
  stand: ['.......ba.......', '.......ba.......', '.......rb.......', '.......ss.......'],
  fwd: ['........ba......', '........ba......', '.........rb.....', '.........ss.....'],
  back: ['......ba........', '......ba........', '.....rb.........', '.....ss.........'],
};
export const LEGS_S = {
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

// ------------------------------------------------------------------ in the game: the strike, the shield, the hop
// The game needs more than the walk: the swing (a wind-up, then the blow: the sword itself is its own sprite,
// laid next to him), the raised shield, and the hop of the dodge. And all of it once more without the shield,
// for the start of the game, before the old man gives him his weapons.

function poses(shield: boolean): GamePoses {
  const sd = (row: number, dx = 0): [number, string[], number][] => (shield ? [[row, SHIELD_D, dx]] : []);
  const su = (row: number, dx = 0): [number, string[], number][] => (shield ? [[row, SHIELD_U, dx]] : []);
  const ss = (row: number, dx = 0): [number, string[], number][] => (shield ? [[row, SHIELD_S, dx]] : []);
  return {
    down: {
      stand: stack([0, HEAD_D], [7, TRUNK_D], [13, LEGS_D.stand], ...sd(9)),
      walkA: stack([13, LEGS_D.a], [1, HEAD_D], [8, TRUNK_D], [9, ARM_FWD_D], ...sd(10)),
      walkB: stack([13, LEGS_D.b], [1, HEAD_D], [8, TRUNK_D], [9, ARM_BACK_D], ...sd(10)),
      // the wind-up: upright on a stride; the blow: he leans into it, the hand comes forward
      atk0: stack([13, LEGS_D.a], [0, HEAD_D], [7, TRUNK_D], ...sd(9)),
      atk1: stack([13, LEGS_D.a], [2, HEAD_D], [9, TRUNK_D], [10, ARM_FWD_D], ...sd(10)),
      // behind the shield he crouches, and the shield comes round in front of his chest
      guard: stack([13, LEGS_D.stand], [1, HEAD_D], [8, TRUNK_D], ...sd(9, -4)),
      hop: stack([13, LEGS_D.a], [1, HEAD_D], [8, TRUNK_D], [9, ARM_FWD_D], ...sd(10)),
    },
    up: {
      stand: stack(...su(9), [13, LEGS_U.stand], [0, HEAD_U], [7, TRUNK_U]),
      walkA: stack(...su(10), [13, LEGS_U.a], [1, HEAD_U], [8, TRUNK_U]),
      walkB: stack(...su(10), [13, LEGS_U.b], [1, HEAD_U], [8, TRUNK_U]),
      atk0: stack(...su(10), [13, LEGS_U.a], [1, HEAD_U], [8, TRUNK_U]),
      atk1: stack(...su(8), [13, LEGS_U.a], [0, HEAD_U], [7, TRUNK_U]),
      // the shield is held out in front of him, away from us: only its rim shows, high at his left
      guard: stack(...su(6, 1), [13, LEGS_U.stand], [1, HEAD_U], [8, TRUNK_U]),
      hop: stack(...su(10), [13, LEGS_U.a], [1, HEAD_U], [8, TRUNK_U]),
    },
    side: {
      stand: stack(...ss(10), [13, LEGS_S.stand], [7, TRUNK_S], [8, ARM_S.stand], [0, HEAD_S]),
      walkA: stack(...ss(11), [13, LEGS_S.near], [8, TRUNK_S], [9, ARM_S.back], [1, HEAD_S]),
      walkB: stack(...ss(11), [13, LEGS_S.far], [8, TRUNK_S], [9, ARM_S.fwd], [1, HEAD_S]),
      // the wind-up: the arm drawn back and up; the blow: he leans a pixel forward, the arm goes out
      atk0: stack(...ss(11), [13, LEGS_S.near], [8, TRUNK_S], [8, ARM_S.back], [1, HEAD_S]),
      atk1: stack(...ss(11, -1), [13, LEGS_S.near], [8, TRUNK_S, 1], [9, ARM_S.fwd, 1], [1, HEAD_S, 1]),
      // crouched, the shield raised in front of his chest
      guard: stack([13, LEGS_S.stand], [8, TRUNK_S], [9, ARM_S.stand], [1, HEAD_S], ...ss(8, 3)),
      hop: stack(...ss(11), [13, LEGS_S.near], [8, TRUNK_S], [9, ARM_S.fwd], [1, HEAD_S]),
    },
  };
}

/** What the game draws him with: armed (after the old man's gift) and bare (when he wakes up). */
export const GAME: { armed: GamePoses; bare: GamePoses } = { armed: poses(true), bare: poses(false) };

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
