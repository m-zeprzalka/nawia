// M4: a nawka, a soul-bird (24 x 16), new.
//
// The idea, from the lore: nawie are the souls of those who died a violent death (the drowned, the murdered),
// evil spirits in the form of birds; in 1092 the people of Połock said the nawie were killing them in the
// streets at night. In Jawia nobody sees them, only the shadow of a bird sliding over the ground with nothing
// above it. In Nawia the bird is there: black, with ragged fingered wings, a long ragged tail, bone talons,
// and instead of a beak a pale, too-human face in profile, a long nose and an open mouth, wet dark hair
// plastered over it and hanging below, and one cold eye.
// Where it sits in the cell: the shadow is on the ground, rows 9-14 (row 14 is the ground line); the bird
// flies above it, rows 0-9, in Nawia only. The shadow is the bird seen from above, flying right: the body
// along the row, the wings swept back like an arrowhead, with ragged tips.
// It moves by beating its wings: up, spread (seen from above, the far wing over the back, the near wing under
// the belly), down, spread; the shadow's wings grow and shrink with them.
// It attacks by pulling up, both wings high and the talons brought forward, the shadow shrinking back under
// it; then it stoops onto its shadow, wings swept back, talons first, and the shadow tightens into a dart
// under the talons. In Jawia that is all the player sees: the shadow drawing in, then darting forward.
//
// Composed from parts (see docs/HERO-DRAWING.md, part 4): the shadow, the bird in three wing positions, the
// head; the rise and the dive are drawn whole.

import type { Beast } from './beast.ts';

const W = 24;
const H = 16;
/** Lays parts over each other: each part's rows go `y` rows down and `x` columns right; '.' lets what is under it show. */
function stack(...parts: [x: number, y: number, rows: string[]][]): string[] {
  const g = Array.from({ length: H }, () => Array<string>(W).fill('.'));
  for (const [x0, y0, rows] of parts)
    rows.forEach((r, y) =>
      [...r].forEach((ch, x) => {
        const tx = x + x0;
        const ty = y + y0;
        if (ch !== '.' && tx >= 0 && tx < W && ty >= 0 && ty < H) g[ty][tx] = ch;
      }),
    );
  return g.map((r) => r.join(''));
}

// the shadow on the ground (rows 9-14), the bird seen from above: tail fan at the left, head at the right
const SHADOW = {
  // wings level: the longest shadow
  wide: [
    '....qqq.................',
    '.....qqqqq..............',
    '..qqqqqqqqqqqqq.........',
    '...qqqqqqqqqqqqq........',
    '......qqqqqq............',
    '....qqqq................',
  ],
  // wings up or down: a shorter one
  narrow: [
    '........................',
    '.......qqqq.............',
    '..qqqqqqqqqqqqq.........',
    '...qqqqqqqqqqqqq........',
    '.......qqqqq............',
    '........................',
  ],
  // the bird low and stooping, wings folded back: a tight dart (rows 12-14)
  dive: [
    '.........qqqq...........',
    '.......qqqqqqqqqqqq.....',
    '.........qqqqqq.........',
  ],
};

// the bird without its head, rows 0-8: d the body and tail, m the feathers, g and G the cold light along the
// wings' edges and on their tips, c the talons
const BIRD = {
  // wings up: the near wing raised over the back, splayed into fingers
  up: [
    '.......G.G.G............',
    '.......gmgmg............',
    '........mmmmg...........',
    '.........mmmmg..........',
    '..........mmmm..........',
    '....dd....mmmmmm........',
    '...ddddmmmmmmmmm........',
    '..d.d.dddddddd..........',
    '............c.c.........',
  ],
  // wings spread: the far wing shows over the back, the near wing under the belly (its tips: TIPS)
  mid: [
    '........................',
    '..........g.g...........',
    '...........ddd..........',
    '............dd..........',
    '....dd....mmmmmm........',
    '...ddddmmmmmmmmm........',
    '..d.d.ddmmmmmm..........',
    '.........gmmmm.c.c......',
    '........gmmmm...........',
  ],
  // wings down: the near wing swept under the body, the far wing's edge over the back
  down: [
    '........................',
    '............g...........',
    '....dd.....gm...........',
    '...ddddmmmmmmmmm........',
    '..d.d.dmmmmmmmmm........',
    '.........mmmmm..........',
    '........mmmmm.c.c.......',
    '.......gmmm.............',
    '......G.G...............',
  ],
};
/** the near wing's tips in the spread frame, where they reach below the bird's rows */
const TIPS = ['.G.G.G'];

// the head: wet hair (h) over a pale, too-human face in profile (f, F): a cold eye, a long nose, the mouth
// open (k), the chin, and the hair hanging down behind it
const HEAD = [
  '.hhh.',
  'hhff.',
  'hFeff',
  'hhffF',
  'h.fk.',
  'h.f..',
  'h....',
];

// the attack: it pulls up with both wings high and the talons forward, then stoops onto its shadow
const RISE = [
  '.....G.G.G.G............',
  '.....gmgmgmg............',
  '......gmmmmmg...........',
  '.......mmmmmm...........',
  '........mmmmmm..........',
  '...dd...mmmmmmmm........',
  '..ddddddddddddd.cc......',
  '.d.d.d.........c.c......',
  '........................',
];
const DIVE = [
  '........................',
  '..GgmG..................',
  '....gmmg................',
  '.....mmmmg..............',
  '......mmmmmg............',
  '........mmmmmd..........',
  '..........mmmmmd........',
  '...........dmmmm........',
  '............ddmmm.......',
  '..............mm........',
  '........................',
  '.....................c..',
  '...................c.cc.',
  '....................c.c.',
  '........................',
  '........................',
];

// Jawia: the shadow alone
const STAND = stack([0, 9, SHADOW.wide]);
const WALK = [stack([0, 9, SHADOW.narrow]), STAND, stack([0, 9, SHADOW.narrow]), STAND];
const ATTACK = [stack([-1, 9, SHADOW.narrow]), stack([0, 12, SHADOW.dive])];

// Nawia: the bird over its shadow
const N_STAND = stack([0, 9, SHADOW.wide], [0, 1, BIRD.up], [15, 3, HEAD]);
const N_WALK = [
  stack([0, 9, SHADOW.narrow], [0, 1, BIRD.up], [15, 3, HEAD]),
  stack([0, 9, SHADOW.wide], [0, 0, BIRD.mid], [15, 2, HEAD], [8, 9, TIPS]),
  stack([0, 9, SHADOW.narrow], [0, 0, BIRD.down], [15, 2, HEAD]),
  stack([0, 9, SHADOW.wide], [0, 0, BIRD.mid], [15, 2, HEAD], [8, 9, TIPS]),
];
const N_ATTACK = [stack([-1, 9, SHADOW.narrow], [0, 1, RISE], [16, 1, HEAD]), stack([0, 12, SHADOW.dive], [0, 0, DIVE], [16, 6, HEAD])];

export const BEAST: Beast = {
  code: 'M4',
  id: 'nawka',
  kind: { pl: 'Nawka', en: 'Nawka' },
  name: { pl: 'ptak-dusza', en: 'soul-bird' },
  note: {
    pl: 'W Jawii tylko cień ptaka sunący po ziemi. W Nawii czarny ptak z bladą ludzką twarzą; spada na ofiarę szponami.',
    en: "In Jawia only a bird's shadow sliding over the ground. In Nawia a black bird with a pale human face; it dives talons first.",
  },
  alt: [],
  w: W,
  h: H,
  view: 'side',
  // in Jawia there is only the shadow, and no line round it
  pal: { q: 0x1c2218 },
  frames: { stand: STAND, walk: WALK, attack: ATTACK },
  ink: 'none',
  nawia: {
    note: { pl: 'Widać ptaka nad cieniem: postrzępione skrzydła, mokre włosy, blada twarz, zimne oko.', en: 'The bird shows above its shadow: ragged wings, wet hair, a pale face, a cold eye.' },
    pal: {
      q: 0x0e0c20, // the shadow, faint on Nawia's dark
      d: 0x2a2444, // the body, the tail
      m: 0x3e3860, // the feathers
      g: 0x6cc8d8, // the cold light along the wings
      G: 0xb4f4f4, // the wingtips
      h: 0x0e0a18, // the wet hair
      f: 0xd8dccc, // the face
      F: 0x8a9288, // the face, the shadow
      e: 0x40e8ff, // the eye
      k: 0x0a0816, // the open mouth
      c: 0xc8c0a8, // the talons
    },
    frames: { stand: N_STAND, walk: N_WALK, attack: N_ATTACK },
    // a dim cold line round the bird; round the shadow, the shadow's own colour
    ink: { ink: 'tinted', outline: 0x0a0816, line: { q: 0x0e0c20, d: 0x24506a, m: 0x24506a, h: 0x24506a, g: 0x24506a, G: 0x24506a, f: 0x24506a, F: 0x24506a, c: 0x24506a, e: 0x24506a, k: 0x24506a } },
  },
};
