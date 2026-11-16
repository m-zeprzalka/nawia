// M19 Strażnik (straznik-b), the boss: the border idol. 32 x 32, facing us. It replaces E7, the mossy stone head
// with boulder fists.
//
// The idea: the guardian of the border between the worlds as an old Slavic border idol, after the one from the
// Zbruch: a pillar of pale limestone under one wide round cap, moss on the crown; under the brim, in its shadow,
// a long stern face with deep eye holes, an ember far back in each, a long nose and a drooping moustache; more
// faces on its sides (only their noses show at the edges); in the middle register the forearms carved in relief,
// the hands meeting on the belly; below the belt a second, smaller face with its eyes shut. An iron collar is
// riveted round its neck; the chains that held it to the border are broken and drag on the ground on both sides.
// It is stone, so it never bends: every motion is the whole block moving, and the weight shows in what it
// throws about (the chains lag, the dust puffs, the ground cracks).
//
// The frames, by what the game does with them (src/entities/Boss.ts):
//   stand    (asleep, or between moves): upright, the chains lying out on the ground.
//   walk 1-4 (stalking; it cannot walk, so it hops): 1 it sinks a row into the ground, gathering; 2 up off the
//            ground (three rows), the chains hanging straight, grit falling from its foot; 3 coming down, the chains
//            lagging up; 4 down with a thud, dust puffing out and the chains thrown wide.
//   attack 1 (the wind-up, before the charge): it rises three rows into the air, the chains flung up in a V and
//            the eye holes blazing white-hot: the telegraph, the widest shape it ever makes.
//   attack 2 (the charge across the arena): it ploughs a row into the ground, the mouth under the moustache torn
//            open on a furnace glow, the eyes blazing, the chains streaming out level, stone chips flying up from its
//            foot and the floor cracking.
//   attack 3 (the recovery, when a charge ends without a wall): it rocks back off its base, the eyes down to a dull
//            ember each, the chains slumped in coils, the dust settling.
//   hurt     (stunned, after it slams into a wall): toppled half over, the cap knocked askew, the eyes out, split
//            from the crown to the belt; the crack shows Nawia's cold light even from Jawia, which tells the hero
//            where to go; rubble at its foot.
// The middle of its body (rows 8-20, where the game draws the heart from Nawia over it) is kept plain: the
// collar and the relief only, nothing that fights the heart.
//
// Nawia: the stone goes dark blue and every carving, crack and eye is lit from inside; the lower face opens its
// eyes there (it looks into Nawia, and only there can it be seen); the split of the stunned frame pours white light.
// From Nawia the stone is only an echo, so its form there is all lit edges.

import type { Beast } from './beast.ts';

const W = 32;
const H = 32;

/** Lays parts over each other: each [dx, dy, rows] goes dx columns right and dy rows down; a later part covers an
 *  earlier one; '.' lets what is under it show; nothing is drawn on the last row (the line under the foot). */
function stack(...parts: [number, number, string[]][]): string[] {
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

/** Tips a whole frame: the foot (row 30) stays, the top moves `px` columns (right when positive). */
function lean(rows: string[], px: number): string[] {
  return rows.map((r, y) => {
    const s = Math.round((px * Math.max(0, 30 - y)) / 27);
    return s > 0 ? ('.'.repeat(s) + r).slice(0, W) : s < 0 ? (r + '.'.repeat(-s)).slice(-s) : r;
  });
}

/** Splits the idol along a jagged line: row by row a crack 'g' is opened at that column and the right half pushed
 *  a column aside; on the rows in `wide` it gapes two columns (the cavity the heart lies in). */
function split(rows: string[], top: number, cols: number[], wide: number[]): string[] {
  return rows.map((r, y) => {
    const c = cols[y - top];
    if (c === undefined) return r;
    const opened = r.slice(0, c) + 'g' + r.slice(c, W - 1);
    return wide.includes(y - top) ? opened.slice(0, c - 1) + 'g' + opened.slice(c) : opened;
  });
}

// ------------------------------------------------------------------ the colours: one letter, one colour

const LINE = 0x1a1018;
const PAL: Beast['pal'] = {
  V: 0xd8ccb0, // limestone, the lit edge (the upper left)
  v: 0xb4a890, // limestone, the light
  W: 0x8e8474, // limestone
  w: 0x686058, // limestone, the shadow
  k: 0x48424a, // limestone, the deep shadow
  z: LINE, // the carvings and the old cracks: dark here, lit from inside in Nawia
  g: 0x9af4ff, // the split of the stunned stone: Nawia's light already shows through it
  y: 0x48424a, // the lower face's eyes: shut here, only the lids show
  e: 0xe8902c, // the eyes: an ember deep in each hole
  E: 0xfff0b8, // the eyes blazing, white-hot
  a: 0x9ca4ac, // iron, the light
  A: 0x606874, // iron
  x: 0x343a46, // iron, the shadow
  m: 0x4e6a34, // moss on the cap
  M: 0x7e9c4a, // moss, the light
  u: 0xd8ccb0, // dust and grit, in the stone's colours but with no line round them
  U: 0xb4a890,
  o: 0x8e8474,
  c: LINE, // cracks in the floor, with no line round them
};
/** Nawia: the stone goes dark (the lit edge stays bright, for the echo) and every carving is lit from inside; the
 *  lower face opens its eyes; the dust is cold sparks */
const PAL_NAWIA: Beast['pal'] = {
  V: 0x93adf0,
  v: 0x3f4fa6,
  W: 0x293376,
  w: 0x191f4e,
  k: 0x0d102e,
  z: 0x9af4ff, // the carvings and cracks, lit
  g: 0xffffff, // the split pours light
  y: 0xffffff, // the lower face's eyes, open
  e: 0xffffff,
  E: 0xffffff,
  a: 0x8ef0ee,
  A: 0x3db6c6,
  x: 0x1e6c8a,
  m: 0x1e6c8a,
  M: 0x3db6c6,
  u: 0x9af4ff,
  U: 0x3db6c6,
  o: 0x1e6c8a,
  c: 0x9af4ff,
};
/** The line goes round the stone, not round the iron, the dust and the floor's cracks (a A x, u U o, c): chains with a line
 *  read as limbs. */
const lined = (colour: number): Record<string, number> => Object.fromEntries([...'VvWwkzgyeEmM'].map((ch) => [ch, colour]));

// ------------------------------------------------------------------ the idol: 28 rows, from the moss on its cap
// (its row 0) to its foot (its row 27); standing, its row 0 is the frame's row 3 and its foot is on row 30.
// It is a square pillar seen corner-on to nothing: the front face (columns 12-19) between two side faces, the
// left one lit (10-11), the right one in shadow (20-21); the cap and the collar a column wider each side, the
// plinth too.

/** the cap and the face, to the moustache (its rows 0-15) */
const HEAD = [
  '.............MMMmmm.............', //  0 the crown, moss
  '............MMvVvmmw............', //  1
  '...........MvVVvvWWwk...........', //  2
  '..........VVVvvvWWWwwk..........', //  3
  '..........VVvvvvWWWwwk..........', //  4
  '.........VVVvvvvWWWWwwk.........', //  5 the brim of the cap
  '.........vWWWWWwwwwwkkk.........', //  6
  '..........Vvkkkkkkkkwk..........', //  7 the brim's shadow over the face
  '..........VvvvvVwWWWwk..........', //  8 the brow, coming down to the nose
  '..........VvzvvVwWWzwk..........', //  9 the eye holes, slanting under the brow
  '..........VvzzeVwezzwk..........', // 10 an ember far back in each, close by the nose
  '.........vVvzzzVwzzzwkw.........', // 11 the side faces' noses at the edges
  '.........vVvWWvVwwWwwkw.........', // 12
  '..........VvWvVVwkWwwk..........', // 13 the foot of the nose
  '..........VvWvvvvvwwwk..........', // 14 the moustache
  '..........VvvzzzzzzWwk..........', // 15 its shadow: the mouth shut under it
];
/** the iron collar, riveted (its rows 16-17) */
const COLLAR = ['.........aaAaAAaAAxAAxx.........', '.........xxxxxxxxxxxxxx.........'];
/** the middle register: plain stone and one old crack running down it (its rows 18-22) */
const BODY = [
  '..........VvvWWWWWWwwk..........', // 18
  '..........VvvWWzWWWwwk..........', // 19
  '..........VvvWWWzWWwwk..........', // 20
  '..........VvvWWWzWwwwk..........', // 21
  '..........VvvWWWWzwwwk..........', // 22
];
/** the belt, the lower face with its eyes shut (open in Nawia), the plinth (its rows 23-27) */
const BELOW = [
  '..........zzzzzzzzzzzz..........', // 23 the belt
  '..........VvWyyVwyywwk..........', // 24 the lower face's eyes
  '..........VvWWWVwWWwwk..........', // 25
  '.........VVvvvvWWWWwwwk.........', // 26 the plinth
  '.........WWWwwwwwwwkkkk.........', // 27
];
const IDOL = [...HEAD, ...COLLAR, ...BODY, ...BELOW];
/** bowed for the charge: the top tipped towards its target, so the column looks two rows shorter (26 rows) */
const BOWED = [...HEAD, ...COLLAR, BODY[0], BODY[2], BODY[4], ...BELOW];

/** The eye holes (its rows 9-11): calm embers by the nose, blazing (the whole hole white-hot), dim (sunk to the
 *  bottom of the hole), dark. */
const EYES: Record<'calm' | 'blaze' | 'dim' | 'dark', string[]> = {
  calm: ['............z......z............', '............zze..ezz............', '............zzz..zzz............'],
  blaze: ['............e......e............', '............eEE..EEe............', '............eee..eee............'],
  dim: ['............z......z............', '............zzz..zzz............', '............zez..zez............'],
  dark: ['............z......z............', '............zzz..zzz............', '............zzz..zzz............'],
};

/** The idol (`rows`) with its eyes set, its top on row `dy` of the frame. */
const idol = (dy: number, eyes: keyof typeof EYES, rows = IDOL): [number, number, string[]][] => [
  [0, dy, rows],
  [0, dy + 9, EYES[eyes]],
];

// ------------------------------------------------------------------ the chains, from the ends of the collar
// (columns 8 and 23); each part starts on the collar's lower row (the idol's row 17) unless said otherwise.
// Iron is heavy: they hang and drag, and only the wind-up's power lifts them. They have no line round them, so
// they read as chain and not as limbs.

const CHAINS = {
  /** hanging down its sides to the ground and coiling there, the broken ends trailing off (11 rows: down to
   *  row 30 when it stands) */
  rest: [
    '........A..............A........',
    '........a..............x........',
    '........A..............A........',
    '........a..............x........',
    '.......A................A.......',
    '.......a................x.......',
    '.......A................A.......',
    '.......a................x.......',
    '.......A................A.......',
    '......a.a..............x.x......',
    '.aAaAa.A..............A.xAxAx...',
  ],
  /** two rows up in the air: hanging straight, the ends dragged in along the ground (13 rows) */
  hang: [
    '........A..............A........',
    '........a..............x........',
    '........A..............A........',
    '........a..............x........',
    '........A..............A........',
    '.......a................x.......',
    '.......A................A.......',
    '.......a................x.......',
    '.......A................A.......',
    '.......a................x.......',
    '.......A................A.......',
    '......a..................x......',
    '...aAa....................xAx...',
  ],
  /** coming down: swinging out, the ends sliding out again (12 rows) */
  lift: [
    '........A..............A........',
    '........a..............x........',
    '.......A................A.......',
    '.......a................x.......',
    '.......A................A.......',
    '......a..................x......',
    '......A..................A......',
    '......a..................x......',
    '.....A....................A.....',
    '.....a....................x.....',
    '....A......................A....',
    '..aA........................Ax..',
  ],
  /** the thud: the ends jump off the ground and skid out wide (11 rows) */
  splay: [
    '........A..............A........',
    '........a..............x........',
    '.......A................A.......',
    '.......a................x.......',
    '......A..................A......',
    '......a..................x......',
    '.....A....................A.....',
    '.....a....................x.....',
    '....A......................A....',
    '..aA........................Ax..',
    'aA............................Ax',
  ],
  /** slumped straight down its sides and coiled at its foot (11 rows) */
  slump: [
    '........A..............A........',
    '........a..............x........',
    '........A..............A........',
    '........a..............x........',
    '........A..............A........',
    '........a..............x........',
    '........A..............A........',
    '........a..............x........',
    '.......A.a............x.A.......',
    '......a...A..........A...x......',
    '...aAaA.aA............Ax.AxAx...',
  ],
};
/** flung out and up for the wind-up, stiff, as if the power that lifts it lifts them too: 8 rows, the last one
 *  level with the collar's upper row (the idol's row 16) */
const CHAINS_UP = [
  'a..............................x',
  '.A............................A.',
  '.a............................x.',
  '..A..........................A..',
  '...a........................x...',
  '....A......................A....',
  '.....a....................x.....',
  '......AaA..............AxA......',
];
/** pulled taut behind it in the charge (from the collar's lower row, 9 rows) */
const CHAINS_DRAG = [
  '........A..............A........',
  '.......a................x.......',
  '......A..................A......',
  '.....a....................x.....',
  '....A......................A....',
  '...a........................x...',
  '..A..........................A..',
  '.a............................x.',
  'A..............................A',
];

// ------------------------------------------------------------------ dust, grit, chips, cracks (rows of the frame)
// Dust and grit (u U o: the stone's own colours) have no line; the chips and the rubble are stone and have one.

/** grit falling from its foot while it is in the air: rows 28-30 */
const GRIT = ['..........U.........o...........', '.............u..........U.......', '............o.......u...........'];
/** the dust of a landing, puffing out at both sides of the plinth: rows 27-30 */
const DUST = [
  '......u...................U.....',
  '....U..u.................u..U...',
  '..u..U.u.................U.u..U.',
  '.u.U.......................U..u.',
];
/** what the charge throws up: chips flying off its foot, dust, the floor cracking under it, rows 24-30 */
const CHIPS = [
  '...u........................u...',
  '................................',
  '.U....u..................u....U.',
  '..u.......................U..u..',
  '....o.U..................u......',
  '.u..uU..................Uu...o..',
  '..ccc.c................c.ccc....',
];
/** the dust settling after it: rows 29-30 */
const SETTLE = ['...U........................U...', '.U..u......................u..U.'];
/** rubble at the foot of the stunned stone: rows 27-30 */
const RUBBLE = [
  '.......................W........',
  '........................vW......',
  '.....W.v...............VwW......',
  '...cWwkW..............cWwkc.....',
];

// ------------------------------------------------------------------ the frames

const STAND = 3;
/** the chains' first row: the collar's lower row when the idol's top is on row `dy` */
const C = (dy: number): number => dy + 17;
const stand = stack([0, C(STAND), CHAINS.rest], ...idol(STAND, 'calm'));
// The stalk: a pillar cannot step, so it rocks up onto one edge of its plinth and swings itself forward, then
// drops back on its base with a thud; then the other edge. The chains swing out with each rock and are thrown
// wide by each landing.
const rock = (px: number): string[] => lean(stack([0, C(2), CHAINS.lift], ...idol(2, 'calm')), px);
const walk = [
  rock(-2), // up on its left edge, the top swung left
  stack([0, C(STAND), CHAINS.splay], ...idol(STAND, 'calm'), [0, 27, DUST]), // down with a thud
  rock(2), // up on its right edge
  stack([0, C(4), CHAINS.splay.slice(1)], ...idol(4, 'calm'), [0, 27, DUST.map((r) => [...r].reverse().join(''))]), // down, sunk a row
];
const attack = [
  stack([0, C(0) - 8, CHAINS_UP], ...idol(0, 'blaze'), [0, 28, GRIT]), // the wind-up: risen three rows, the chains up, the eyes blazing
  stack([0, C(5), CHAINS_DRAG], ...idol(5, 'blaze', BOWED), [0, 24, CHIPS]), // the charge, bowed into it
  lean(stack([0, C(STAND), CHAINS.slump], ...idol(STAND, 'dim'), [0, 29, SETTLE]), -2), // rocking back, spent
];
/** stunned: split open from the crown to the belt, toppled half over, the eyes out */
const SPLIT_COLS = [15, 15, 16, 16, 15, 15, 16, 16, 15, 15, 16, 16, 17, 16, 16, 15, 15, 16, 16, 17, 16, 16];
const hurt = stack(
  [0, 0, lean(split(stack(...idol(STAND, 'dark')), STAND + 1, SPLIT_COLS, [8, 9, 10, 11, 12, 13, 14, 15, 16]), 3)],
  [0, C(STAND), CHAINS.slump],
  [0, 27, RUBBLE],
);

export const BEAST: Beast = {
  code: 'M19',
  id: 'straznik-b',
  kind: { pl: 'Strażnik', en: 'Guardian' },
  name: { pl: 'bałwan graniczny', en: 'border idol' },
  note: {
    pl: 'Kamienny bałwan o wielu twarzach, w żelaznej obroży z zerwanymi łańcuchami. Skacze, wznosi się z płonącymi oczami i szarżuje; po uderzeniu w ścianę pęka i przez szczelinę widać Nawię.',
    en: 'A stone idol with many faces, in an iron collar with broken chains. It hops, rises with its eyes blazing and charges; slammed into a wall it splits, and Nawia shows through the crack.',
  },
  alt: ['E7'],
  w: W,
  h: H,
  view: 'front',
  pal: PAL,
  frames: { stand, walk, attack, hurt },
  ink: 'tinted',
  line: lined(LINE),
  nawia: {
    pal: PAL_NAWIA,
    ink: { ink: 'tinted', line: lined(0x03040c) },
    note: {
      pl: 'W Nawii rzeźby, pęknięcia i oczy świecą od środka, a dolna twarz otwiera oczy; ze szczeliny ogłuszonego kamienia bije światło.',
      en: 'In Nawia its carvings, cracks and eyes glow from inside and the lower face opens its eyes; light pours from the split of the stunned stone.',
    },
  },
};
