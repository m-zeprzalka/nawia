// M19 Strażnik (straznik-b), the boss: an alternative to E7, the mossy stone head with boulder fists.
//
// The idea: the guardian of the border between the worlds as an old Slavic border idol, after the one from the
// Zbruch: a pillar of grey weathered oak under one round cap, a stern face with deep eye holes, a long nose and a
// drooping moustache, more faces on its sides (their noses show at the edges), cracks down its body, and below
// the belt a second, smaller face with its eyes shut. An iron collar is riveted round its neck; the chains that
// held it to the border are broken and drag on the ground.
// It moves: it cannot walk, so it hops: up off the ground with its shadow under it and the chains hanging, then
// down with a thud, the dust puffing and the chains thrown out.
// It attacks: it rises high with its eyes blazing (the wind-up), then slams down; the ground cracks open at its
// foot, splinters fly and the chains are flung out level (the blow).
// Nawia: the wood is dark; every carving, crack and eye is lit from inside, and the lower face opens its eyes:
// that face looks into Nawia, and only there can it be seen.

import type { Beast } from './beast.ts';

const W = 32;
const H = 32;

/** Lays parts over each other: each [dy, rows, dx] goes dy rows down and dx columns right; a later part covers
 *  an earlier one; '.' lets what is under it show. */
function stack(...parts: [number, string[], number?][]): string[] {
  const grid = Array.from({ length: H }, () => Array<string>(W).fill('.'));
  for (const [dy, rows, dx = 0] of parts)
    rows.forEach((r, y) =>
      [...r].forEach((ch, x) => {
        const tx = x + dx;
        const ty = y + dy;
        if (ch !== '.' && tx >= 0 && tx < W && ty >= 0 && ty < H) grid[ty][tx] = ch;
      }),
    );
  return grid.map((r) => r.join(''));
}

// ------------------------------------------------------------------ the colours: one letter, one colour

const PAL: Beast['pal'] = {
  k: 0x241e22, // oak, the deepest; the seams
  w: 0x40363a, // oak, the shadow
  W: 0x5e524e, // oak
  v: 0x80725f, // oak, the light
  V: 0xa69678, // oak, the lit edge
  z: 0x1a1018, // the carvings and cracks: dark here, lit from inside in Nawia
  E: 0x1a1018, // the eye holes, the rim of the glow
  y: 0x5e524e, // the lower face's eyes: shut here (the colour of the wood)
  e: 0xe0a040, // the eyes: an ember deep in each hole
  a: 0x9aa4ae, // iron, the light
  A: 0x5e6672, // iron
  x: 0x2e3440, // iron, the shadow
  m: 0x4a6232, // moss on the cap
  M: 0x7a8c48, // moss, the light
};
/** Nawia: the wood goes dark and every carving is lit from inside; the lower face opens its eyes */
const PAL_NAWIA: Beast['pal'] = {
  k: 0x06081a,
  w: 0x0f1336,
  W: 0x171d4f,
  v: 0x212a6c,
  V: 0x314094,
  z: 0x9af4ff, // the carvings and cracks, lit
  E: 0x3db6c6, // the glow round the eyes
  y: 0xffffff, // the lower face's eyes, open
  e: 0xffffff, // the eyes, white
  a: 0x8ef0ee,
  A: 0x3db6c6,
  x: 0x1e6c8a,
  m: 0x1e6c8a,
  M: 0x3db6c6,
};

// ------------------------------------------------------------------ the parts, each at its place in the standing frame

/** the idol itself, from the moss on its cap (its row 0) to its foot (its row 26); it moves whole */
const IDOL = [
  '..............MMm...............',
  '............MMmvmMm.............',
  '...........MvVVvvvWw............',
  '...........vVVvvWWWw............',
  '..........WvVVvvWzWwk...........',
  '..........WvVVvvWzWwk...........',
  '.........kkkkkkkkkkkkk..........',
  '........VVVVVVvvvvWWWwk.........',
  '.........kkkkkkkkkkkkk..........',
  '........VVVVVvVvvWWWwwk.........',
  '.......vWzzzEvVWwzzzEwkk........',
  '.......WWzzzevVWwzzzewkw........',
  '........WvvvvvVWwWWwwwk.........',
  '........WVvvvzzzzzWwwwk.........',
  '........WVvvzVVWWwzwwwk.........',
  '........WVvzvzzzzzwzwwk.........',
  '........WvzvVWWWWWwwzwk.........',
  '.......xaAaAxaAaAxaAaAxk........',
  '........xkkkkkkkkkkkkkx.........',
  '..........WvVzvvWWzwwk..........',
  '..........WvVvzvWWWzwk..........',
  '..........WvVvzvWWWwwk..........',
  '..........WvVzvvWWWwwk..........',
  '..........kkkkkkkkkkkk..........',
  '.........WWzyyvVyyzwwkk.........',
  '........WvVvVzzzzWwwwwkk........',
  '.......kWvVVvvvWWWWwwwwkk.......',
];
/** the eyes blaze: laid over the eye holes, 10 rows below the top of the idol */
const FLARE = [
  '.........EeeE....EeeE...........',
  '.........eeee....eeee...........',
];
/** the broken chains, hanging from the ends of the collar */
const CHAINS = {
  /** broken chains from the iron collar, their ends on the ground */
  rest: [
    '......aA................xAx.....',
    '......A..................a......',
    '.....a...................A......',
    '.....A....................x.....',
    '.....a....................A.....',
    '....a......................x....',
    '....A......................A....',
    '...a.........................A..',
    '..aA..........................xA',
  ],
  /** hanging straight while it is in the air */
  hang: [
    '......aA................xAx.....',
    '......A..................a......',
    '......a..................A......',
    '......A..................x......',
    '......a..................A......',
    '.....A....................x.....',
    '.....a....................A.....',
    '.....A....................x.....',
    '......a..................A......',
    '......A..................x......',
  ],
  /** thrown out by the landing */
  splay: [
    '.....aA..................xAx....',
    '....A......................a....',
    '...a........................A...',
    '..A..........................x..',
    '..a..........................A..',
    '.A............................x.',
    '.a............................A.',
    'A..............................x',
    'aA............................Ax',
  ],
  /** flung out level by the blow */
  fly: [
    '.aAaA.....................AxAx..',
    'a.....aA................xA.....A',
    '.......A................x.......',
  ],
};
/** its shadow on the ground while it is in the air (row 30) */
const SHADOW = [
  '...........kkkkkkkkkk...........',
];
/** dust where it lands, rows 28-30 */
const DUST = [
  '......V..................V......',
  '....v.V.v..............v.V.v....',
  '...V.v...................v.V....',
];
/** the blow: splinters, dust and the ground cracking open, rows 26-30 */
const CRACKS = [
  '...V..v..................v..V...',
  '..v.V....................V.v.v..',
  '.v.........V......V.........v...',
  'zz.zzz..................zzz.zzz.',
  '...zz....................zz.....',
];

// ------------------------------------------------------------------ the frames
// [row, part, column shift]: the later parts are drawn over the earlier ones.

const stand = stack([4, IDOL], [22, CHAINS.rest]);
const walk = [
  stack([30, SHADOW], [1, IDOL], [19, CHAINS.hang]), // a hop: up off the ground
  stack([4, IDOL], [22, CHAINS.splay], [28, DUST]), // down again with a thud
];
const attack = [
  stack([30, SHADOW], [0, IDOL], [10, FLARE], [18, CHAINS.hang]), // rises high, the eyes blazing
  stack([4, IDOL], [14, FLARE], [20, CHAINS.fly], [26, CRACKS]), // slams down: the ground splits
];

export const BEAST: Beast = {
  code: 'M19',
  id: 'straznik-b',
  kind: { pl: 'Strażnik', en: 'Guardian' },
  name: { pl: 'bałwan graniczny', en: 'border idol' },
  note: { pl: 'Dębowy bałwan z wieloma twarzami, w żelaznej obroży z zerwanymi łańcuchami; skacze i wali o ziemię.', en: 'An oak idol with many faces, in an iron collar with broken chains; it hops and slams the ground.' },
  alt: ['E7'],
  w: W,
  h: H,
  view: 'front',
  pal: PAL,
  frames: { stand, walk, attack },
  ink: 'dark',
  outline: 0x1a1018,
  nawia: {
    pal: PAL_NAWIA,
    ink: { ink: 'dark', outline: 0x03040c },
    note: {
      pl: 'W Nawii rzeźby, pęknięcia i oczy świecą od środka, a dolna twarz otwiera oczy.',
      en: 'In Nawia its carvings, cracks and eyes glow from inside, and the lower face opens its eyes.',
    },
  },
};
