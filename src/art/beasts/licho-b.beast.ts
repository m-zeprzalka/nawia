// M15, Licho: the licho with the sack. An alternative to P14 (the one-eyed thing of skin and bone in rags).
// 16 x 24, a tile and a half, drawn facing right.
//
// The idea: misfortune in person, the enemy that sticks to you and takes your luck (your drops). Here it is a
// beggar from the edge of the village: tall and crooked, bent nearly double, an old linen kerchief over a face that
// is only darkness with one pale eye in it (and a jaw under it). Its near arm is far too long and hangs to its
// shins, the fingers long and loose; in the other hand it drags a lumpy sack tied at the neck, and something
// gold shows through a tear: other people's luck.
//
// How it moves: a hobble. The body drops on each stride, the long arm swings like a pendulum, the sack swings the
// other way.
// How it attacks: it coils down low, the arm folded up under its chin and the eye wide (the wind-up), then springs
// forward with the arm thrown out straight, the fingers grabbing (the blow).
//
// Nawia: the same frames in other colours. The rags and the kerchief go dark with a cold rim on their lit edges,
// the skin turns grey-blue, and the sack shines: in Nawia you can see the luck it has stolen, glowing gold.

import type { Beast } from './beast.ts';

const W = 16;
const H = 24;

/** Lays parts on an empty frame, each moved `dx` columns and `dy` rows; a later part covers an earlier one. */
function put(...parts: [number, number, string[]][]): string[] {
  const grid = Array.from({ length: H }, () => Array<string>(W).fill('.'));
  for (const [dx, dy, rows] of parts)
    rows.forEach((r, y) =>
      [...r].forEach((ch, x) => {
        const tx = x + dx;
        const ty = y + dy;
        if (ch !== '.' && tx >= 0 && tx < W && ty >= 0 && ty < H - 1) grid[ty][tx] = ch;
      }),
    );
  return grid.map((r) => r.join(''));
}
/** a part drawn on rows `top`.. of the frame */
const at = (top: number, rows: string[]): string[] => [...Array<string>(top).fill('.'.repeat(W)), ...rows];

// ------------------------------------------------------------------ the parts (each drawn where it sits standing)

/** the kerchief (l k K) over a face of darkness (T) with one eye (e), the jaw under it (s S) */
const HEAD = at(1, [
  '.........lll....',
  '........lkkkk...',
  '.......lkkkkKk..',
  '......lkKTTeeK..',
  '......kKKTTTTs..',
  '.......KK.TsS...',
]);
/** the bent back in rags, lit on the hump (q) */
const TORSO = at(6, [
  '....q...........',
  '...qqr..........',
  '...qrrrr........',
  '..qqrrrrR.......',
  '..qrrrrRR.......',
  '..qrrrrRR.......',
  '...rrrrRR.......',
  '...qrrrRR.......',
  '...rRrrrR.......',
  '...R.RrRR.......',
  '.....R..R.......',
]);
/** the near arm, too long: hanging, swung back, swung forward */
const ARM = {
  hang: at(8, [
    '........s.......',
    '........sS......',
    '.........sS.....',
    '.........sS.....',
    '..........sS....',
    '..........sS....',
    '...........sS...',
    '...........sS...',
    '............sS..',
    '...........s.sS.',
    '...........s..s.',
  ]),
  back: at(8, [
    '........s.......',
    '........sS......',
    '........sS......',
    '.........sS.....',
    '.........sS.....',
    '.........sS.....',
    '..........sS....',
    '..........sS....',
    '..........sS....',
    '.........s.sS...',
    '.........s..s...',
  ]),
  fwd: at(8, [
    '........s.......',
    '........sS......',
    '.........sS.....',
    '..........sS....',
    '...........sS...',
    '............sS..',
    '.............sS.',
    '.............sS.',
    '.............s.s',
    '............s..s',
  ]),
};
/** the legs: standing; near leg forward; passing; far leg forward */
const LEGS = {
  stand: at(16, [
    '.....SS.sS......',
    '.....SS.sS......',
    '.....SS..sS.....',
    '.....SS..sS.....',
    '....SS...sS.....',
    '....SS....sS....',
    '...SSS....sSSS..',
  ]),
  near: at(16, [
    '.....SS.sS......',
    '....SS...sS.....',
    '....SS....sS....',
    '...SS.....sS....',
    '...SS......sS...',
    '..SS.......sS...',
    '.SSS.......sSSS.',
  ]),
  pass: at(16, [
    '.....SSsS.......',
    '.....SSsS.......',
    '......SsS.......',
    '......SsS.......',
    '......SSs.......',
    '.....SS.sS......',
    '....SSS.sSSS....',
  ]),
  far: at(16, [
    '.....sS.SS......',
    '....sS...SS.....',
    '....sS....SS....',
    '...sS.....SS....',
    '...sS......SS...',
    '..sS.......SS...',
    '.sSSS......SSS..',
  ]),
};
/** the sack in its far hand: the gathered top, the fist (s S), the tied neck (B), the gold (y) in a tear */
const SACK = at(10, [
  '..aa............',
  '..sS............',
  '..BA............',
  '.aAAA...........',
  'aayAAA..........',
  'ayyAAA..........',
  'aAAAAB..........',
  'aAAAAB..........',
  '.aABBB..........',
  '..BBB...........',
]);

// the attack: coiled low with the arm folded and the eye wide, then the lunge with the arm thrown out
const ARM_FOLD = at(10, [
  '.......s........',
  '.......sS..s....',
  '.......sS.sS....',
  '........sSS.....',
]);
const HEAD_GLARE = at(1, [
  '.........lll....',
  '........lkkkk...',
  '.......lkkkkKk..',
  '......lkKTeeeK..',
  '......kKKTTTTs..',
  '.......KK.TsS...',
]);
const ARM_THRUST = at(9, [
  '.........ssss.s.',
  '.........SSSSss.',
  '.............S.s',
]);
const LEGS_CROUCH = at(17, [
  '....SS..sS......',
  '...SS....sS.....',
  '...SS....sS.....',
  '..SS....sS......',
  '.SSS...sSSS.....',
]);
const LEGS_LUNGE = at(16, [
  '......SS.sS.....',
  '.....SS...sS....',
  '....SS.....sS...',
  '...SS......sS...',
  '..SS........sS..',
  '.SS.........sS..',
  'SSS.........sSSS',
]);

// ------------------------------------------------------------------ the frames

const body = (dx: number, dy: number, legs: string[], arm: string[], sack = 0): string[] =>
  put([sack, dy, SACK], [0, 0, legs], [dx, dy, TORSO], [dx, dy, arm], [dx, dy, HEAD]);

const STAND = body(0, 0, LEGS.stand, ARM.hang);
const ATTACK = [
  put([-1, 2, SACK], [0, 0, LEGS_CROUCH], [-1, 2, TORSO], [-1, 2, HEAD_GLARE], [-1, 2, ARM_FOLD]),
  put([1, 1, SACK], [0, 0, LEGS_LUNGE], [1, 1, TORSO], [1, 1, HEAD], [0, 0, ARM_THRUST]),
];
const WALK = [body(0, 1, LEGS.near, ARM.back, 1), body(0, 0, LEGS.pass, ARM.hang), body(0, 1, LEGS.far, ARM.fwd, -1), body(0, 0, LEGS.pass, ARM.hang)];

export const BEAST: Beast = {
  code: 'M15',
  id: 'licho-b',
  kind: { pl: 'Licho', en: 'Licho' },
  name: { pl: 'licho z workiem', en: 'the licho with the sack' },
  note: {
    pl: 'Jednooki dziad z workiem na cudze szczęście. Kuśtyka za tobą i chwyta ręką o wiele za długą.',
    en: 'A one-eyed beggar with a sack for stolen luck. It hobbles after you and grabs with an arm far too long.',
  },
  alt: ['P14'],
  w: 16,
  h: 24,
  view: 'side',
  ink: 'dark',
  outline: 0x1a1018,
  pal: {
    T: 0x1a1018, // the face: only darkness (the line's own colour)
    e: 0xfaf4c8, // the eye
    s: 0xc4c0a4, // skin and bone
    S: 0x8a8a70,
    q: 0x7a6858, // the rags
    r: 0x5a4a40,
    R: 0x3a302c,
    a: 0xb89060, // the sack
    A: 0x8a6440,
    B: 0x5e4430,
    y: 0xf4d860, // the stolen luck
    l: 0xa8a294, // the kerchief, old linen
    k: 0x7e786c,
    K: 0x56504a,
  },
  frames: { stand: STAND, walk: WALK, attack: ATTACK },
  nawia: {
    pal: {
      e: 0xffffff,
      s: 0x8aa4b4,
      S: 0x4a5a6a,
      q: 0x7aa8c8, // the cold rim on the rags
      r: 0x2a3040,
      R: 0x1a1e2a,
      a: 0xfff0a0, // the sack glows with what it holds
      A: 0xe0a840,
      B: 0x9a6420,
      y: 0xffffff,
      l: 0x9ac0d8,
      k: 0x3a4458,
      K: 0x242a38,
    },
    note: { pl: 'W Nawii worek świeci skradzionym szczęściem.', en: 'In Nawia its sack glows with the luck it has stolen.' },
  },
};
