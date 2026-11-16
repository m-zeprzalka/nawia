// M2: an old boar (24 x 16), in place of P6 and E5.
//
// The idea: a wedge, not a loaf. Everything heavy is at the front: the back climbs in a straight line from a
// small, low rump to the withers, where a ridge of black bristles stands up in a saw edge with grizzled tips
// (the tips catch the light from the upper left, the rim of the whole beast); then it drops behind the ear into
// a long head that slopes down to a snout carried below the belly line, with a grey jowl, a small red eye, a
// tusk curling up out of the lip and the pink disc of the snout. Under all that the legs are thin and dark,
// set in pairs, the hind ones bent at the hock.
//
// Frames:
//  - stand, and the trot in four: the diagonal pairs swing together, the body a row lower when the legs reach;
//  - the wind-up: it paws the ground: the mane bristles up into a tall grizzled ridge, the back humps, the
//    head drops until the snout is at the grass, a foreleg comes up to scrape, the eye flares yellow and the
//    snort kicks up dust in front of it;
//  - the blow: the charge, a gallop at full stretch: the body two rows lower and long, the hind legs thrown
//    back with dust off the hooves, the forelegs reaching, the head down and both tusks leading;
//  - the recovery: the stop (the wall, or the end of the run): the legs splayed, the belly sagging, the snout
//    on the ground, the eye shut: dazed, the opening for the hero;
//  - hurt: a squeal: thrown back a few columns and squashed, the rump down and the back hunched, the forelegs
//    braced out stiff in front, the head jerked up so the snout lifts, the mouth a little open on the tusk,
//    the eye shut.
// In Nawia it is the same frames in other colours: a dusk-blue shape a little lighter than the floor, only
// the bristle tips, the tusks, the snout's edge and the eye holding a cold light.
//
// Composed from parts (see docs/HERO-DRAWING.md, part 4): the trunk, the head and a set of legs per walk frame;
// the attack and the flinch are whole frames.

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

// the trunk: the rump, the back climbing to the withers, the bristle ridge, the tail; rows 0-10 of the cell
const TRUNK = [
  '........................',
  '..........c.c...........',
  '........c.DcDD..........',
  '......c.DDDDDDD.........',
  '....c.DDBBBBBBD.........',
  '...cDDBBbbbbbbD.........',
  '..cBBbbbbbbbbbb.........',
  '.tBbbbbbbbbbbbb.........',
  '.tbbbbbbbbbbbbd.........',
  '.tDdddddddddddD.........',
  '.D......................',
];

// the head: the ear, a small eye, the grey jowl, the tusk, the snout's disc; rows 0-11 of the cell
const HEAD = [
  '........................',
  '...............B........',
  '...............Bb.......',
  '..............DbBB......',
  '..............DbDBB.....',
  '..............dgbebB....',
  '..............dggbbbB...',
  '..............dgggbbbBn.',
  '..............DggbwbbBn.',
  '...............DgbbwbDn.',
  '................DDDDD...',
];

// legs, rows 10-14 of the cell: near legs b, far legs x
const LEGS = {
  stand: [
    '...bb.x....xbb..........',
    '....bbx....x.b..........',
    '.....bx....x.b..........',
    '....b.x....x.b..........',
    '....x.x....x.x..........',
  ],
  reachA: [
    '...bb.x....xbb..........',
    '...bb..x...x..b.........',
    '...b...x..x...b.........',
    '..b....x..x....b........',
    '..x....x..x....x........',
  ],
  passA: [
    '...bb.x....xbb..........',
    '....bbx....x.b..........',
    '.....bx.....xb..........',
    '......x......b..........',
    '......x......x..........',
  ],
  reachB: [
    '...bb.x....xbb..........',
    '....bbx....b..x.........',
    '...x.b....b...x.........',
    '..x..b....b....x........',
    '..x..x...x.....x........',
  ],
  passB: [
    '...bb.x....xbb..........',
    '....bb.x...x.b..........',
    '.....b.x...x..b.........',
    '....b......x............',
    '....x......x............',
  ],
};

const body = (dy: number) => [[0, dy, TRUNK], [0, dy, HEAD]] as [number, number, string[]][];

const STAND = stack([0, 10, LEGS.stand], ...body(0));
const WALK = [
  stack([0, 10, LEGS.reachA], ...body(1)),
  stack([0, 10, LEGS.passA], ...body(0)),
  stack([0, 10, LEGS.reachB], ...body(1)),
  stack([0, 10, LEGS.passB], ...body(0)),
];

// the wind-up: it paws the ground, the mane up, the head down, the eye flaring, a snort of dust
const PAW = [
  '.......c.c.c.c..........',
  '......cDcDcDcDc.........',
  '....c.DDDDDDDDDc........',
  '...cDDBBBBBBBBDDB.......',
  '..cBBbbbbbbbbbbDbB......',
  '.tBbbbbbbbbbbbbDbbB.....',
  '.tbbbbbbbbbbbbbdgbbB....',
  '.tbbbbbbbbbbbbbdggbbB...',
  '.tDddddddddddddDgEgbbB..',
  '.D..bb.x......dDgggbbbB.',
  '....bbx......xb.DggwbbBn',
  '.....bx......x.b.DgbwbDn',
  '....b.x......xb...DDDD..',
  '....b.x......x.......c.c',
  '....x.x......x......c.c.',
  '........................',
];

// the blow: the charge at full stretch, the tusks leading
const GORE = [
  '........................',
  '........................',
  '........................',
  '..........c.c.c.........',
  '......c.c.DcDcDDB.......',
  '....c.DDDDDDDDDDbBB.....',
  '..cDDBBBBBBBBBBDbbBB....',
  '.cBBbbbbbbbbbbbdbEbbBB..',
  'tBbbbbbbbbbbbbbdggbbbbB.',
  'tbbbbbbbbbbbbbddgggbbbBn',
  'tDdddddddddddDD.DggwwbBn',
  'bb..........bb..DgwwbDDn',
  '.bx........b..b..DDDD...',
  'c.bx......b....b........',
  'cc..x....x......bx......',
  '........................',
];

// the recovery: stopped dead, splayed and dazed, the snout in the dirt, the eye shut
const SKID = [
  '........................',
  '........................',
  '........................',
  '.........c.c............',
  '.......c.DcDD...........',
  '.....c.DDDDDDB..........',
  '...c.DDBBBBBDbBB........',
  '..cDDBbbbbbbDbbbB.......',
  '.tBbbbbbbbbbdbbbbB......',
  '.tbbbbbbbbbbdgbDbbB.....',
  '.tDdddddddddDggbbbbB....',
  'bb.x........DgggbbbbB...',
  'b...x......xbDgwbbbDn...',
  'b....x....x..bDgwbDnn...',
  'x.....x..x....b.DDD.b...',
  '........................',
];

// the flinch: a squeal, thrown back and squashed, the forelegs braced, the snout jerked up, the eye shut
const SQUEAL = [
  '........................',
  '........................',
  '.......c.c..............',
  '.....c.DcDDBBBB.........',
  '...c.DDDDDDbbbBBBBn.....',
  '..cDDBBBBBDbbDDbbbBn....',
  '.cBBbbbbbbDbggbbbbM.....',
  '.tBbbbbbbbbdgggbbwM.....',
  '.tbbbbbbbbbdDggDw.......',
  '.tbbbbbbbbbbDDD.........',
  '.tDdddddddddDb..........',
  '...bb.x....x.b..........',
  '...b..x.....x.b.........',
  '..b...x......x.b........',
  '..xx..x.......x.xx......',
  '........................',
];

export const BEAST: Beast = {
  code: 'M2',
  id: 'dzik-b',
  kind: { pl: 'Dzik', en: 'Boar' },
  name: { pl: 'odyniec', en: 'old boar' },
  note: {
    pl: 'Klin: wysoki kark z grzywą szczeciny, długi ryj, szable. Kłusuje; grzebie racicą z jeżącą się grzywą, szarżuje z łbem przy ziemi, a po szarży stoi ogłuszony z ryjem w ziemi. Trafiony kwiczy i odskakuje w tył na zapartych przednich nogach, z ryjem w górze.',
    en: 'A wedge: a high bristled nape, a long snout, tusks. It trots; it paws the ground with its mane up, charges with its head down and stands dazed after, snout in the dirt. Struck, it squeals and jerks back on braced forelegs, snout up.',
  },
  alt: ['P6', 'E5'],
  w: W,
  h: H,
  view: 'side',
  pal: {
    k: 0x1a1018, // the line
    c: 0xb0a088, // the grizzled tips of the bristles
    B: 0x8c7660, // bristles, the light
    b: 0x5a4a3e, // bristles; the near legs
    t: 0x5a4a3e, // the tail
    d: 0x463830, // bristles, the shade
    D: 0x342828, // bristles, the shadow; the mane
    x: 0x2a2024, // the far legs, the hooves
    g: 0x8a7a68, // the grey jowl
    n: 0x9a7470, // the snout's disc
    w: 0xeee2c4, // the tusks
    e: 0xe85a30, // the eye
    E: 0xffd070, // the eye flaring
    M: 0x5a1a20, // the open mouth
  },
  frames: { stand: STAND, walk: WALK, attack: [PAW, GORE, SKID], hurt: SQUEAL },
  ink: 'dark',
  outline: 0x1a1018,
  nawia: {
    note: { pl: 'Czarny kształt; zimnym światłem świecą tylko szczecina, szable, ryj i oko.', en: 'A black shape; only the bristles, the tusks, the snout and the eye hold a cold light.' },
    pal: { k: 0x0a0816, t: 0x46487a, c: 0x8ee8d8, B: 0x6a8cbc, b: 0x46487a, d: 0x383a68, D: 0x2c2c56, x: 0x22224a, n: 0x7a9ac0, w: 0xeefff8, e: 0xd8ffff, E: 0xffffff, g: 0x5a6494, M: 0x2a1838 },
    ink: { ink: 'dark', outline: 0x0a0816 },
  },
};
