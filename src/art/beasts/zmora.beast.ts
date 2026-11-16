// M12 zmora: the nightmare that sits on sleepers' chests (16 x 16, from the side, facing right; new).
//
// The idea: a small starved thing, all limbs, that comes at night and sits on your chest until you cannot
// breathe. It goes on all fours, low, the knee jutting up higher than its back and the spine standing out of it,
// the forearm along the ground to long fingers spread in front, and while its body goes sideways its bald head,
// slung low at the front, stays turned towards you.
// In Jawia you cannot see it: it is a heavy shadow moving on the ground, and only its two eyes catch the light.
//
// How it moves: it crawls limb by limb, the body rocking up and down, and the head does not move at all: it
// keeps staring.
// How it attacks: it presses itself flat, coiled (the wind-up), then leaps at you, arms first, fingers wide,
// mouth open, to land on your back (Shift throws it off).
//
// Nawia: the same thing, plainly seen: pale, hairless, the spine standing out of its back, pinprick eyes sunk
// in shadowed sockets and a wide lipless mouth.

import type { Beast } from './beast.ts';

const W = 16;
const H = 16;

/** Lays parts over each other at (dx, dy); a later part covers an earlier one; '.' lets it show. */
function stack(...parts: [number, number, string[]][]): string[] {
  const grid = Array.from({ length: H }, () => Array<string>(W).fill('.'));
  for (const [dx, dy, rows] of parts)
    rows.forEach((r, y) => {
      const ty = y + dy;
      if (ty >= 0 && ty < H - 1) [...r].forEach((ch, x) => ch !== '.' && x + dx >= 0 && x + dx < W && (grid[ty][x + dx] = ch));
    });
  return grid.map((r) => r.join(''));
}

// ------------------------------------------------------------------ the colours
// The same letters are a shadow in Jawia and pale skin in Nawia.

const PAL = {
  w: 0x3a304a, // the faintest sheen on the shadow
  t: 0x2e2638,
  s: 0x221b2c,
  S: 0x1c1624,
  D: 0x150f1b,
  e: 0xf0e070, // the eyes: the only light on it
  E: 0x1c1624,
  m: 0x150f1b,
};
const NAWIA = {
  w: 0xfff4f0, // the light on its skull
  t: 0xf0e4dc, // pale skin, the light
  s: 0xc8b6b2, // skin
  S: 0x94808a, // skin, the shadow
  D: 0x5e4a58, // the deep shadow under it
  e: 0x0c0a10, // pinpricks for eyes
  E: 0x6a5462, // sunk in shadowed sockets
  m: 0x4a1a28, // the lipless mouth
};
const DARK = 0x1a1018;

// ------------------------------------------------------------------ the parts (rows from the top of the cell)

/** the near hind leg: the knee jutting up high behind it, the shin down to a long foot */
const HIND = [
  '..t.............',
  '.tsS............',
  '.s.sS...........',
  '.s..sS..........',
  '.s...sS.........',
  '.s..............',
  '.S..............',
  '.S..............',
  '.S..............',
  '.S..............',
  '.S..............',
  '.S..............',
  'DS..............',
  'SSD.............',
];
/** the body slung low, the spine standing out of it in knobs, the far hind leg folded under it */
const BODY = [
  '........t.t.....',
  '.....tstststS...',
  '....tssssssssS..',
  '....sSSDDSS.....',
  '....S...........',
  '.....S..........',
  '.....S..........',
  '......S.........',
  '......SS........',
  '......SSD.......',
];
/** the near arm: down to the elbow, then the forearm along the ground to long fingers spread in front */
const ARM = {
  down: ['.........S......', '.........S......', '........SS......', '........S.......', '.........S......', '..........SsSsSS'],
  reach: ['.........S......', '.........S......', '........SS......', '........S.......', '.........SSsSsSS', '................'],
};
/** the head, slung low at the front and turned to look at you: a bald dome, the eyes sunk under the brow,
 *  a wide lipless mouth */
const HEAD = ['...........ttsS.', '..........twss..', '..........sEsES.', '..........seseS.', '..........mmmmS.', '...........sSS..'];

/** the leap: stretched out in the air, the fingers first, the mouth open, the hind leg thrown back */
const LEAP = [
  '................',
  '...........ttsS.',
  '..........twss.s',
  '..........sEsESs',
  '...t.t.t..seseSS',
  '..tststststmmmmS',
  '.tssssssssSmmmS.',
  'tsSSDDSSSSS.SsS.',
  'sS.....S...SsSsS',
  'S.......S.......',
  'S........S......',
  '................',
  '................',
  '................',
  '................',
  '................',
];

// ------------------------------------------------------------------ the frames

const stand = stack([0, 1, HIND], [0, 5, BODY], [0, 9, ARM.down], [0, 8, HEAD]);
// the crawl: the hind leg lifts, the body heaves up a pixel (the far leg with it), the hand lifts and
// reaches on, the body heaves again; the head, turned to you, does not move at all
const walk = [
  stack([0, 0, HIND], [0, 5, BODY], [0, 9, ARM.down], [0, 8, HEAD]),
  stack([0, 1, HIND], [0, 4, BODY], [0, 9, ARM.down], [0, 8, HEAD]),
  stack([0, 1, HIND], [0, 5, BODY], [0, 9, ARM.reach], [0, 8, HEAD]),
  stack([0, 1, HIND], [0, 4, BODY], [0, 9, ARM.down], [0, 8, HEAD]),
];
// the wind-up: pressed down and coiled, the knee drawn up higher, the head lowered to the ground
const coil = stack([0, 0, HIND], [0, 6, BODY], [0, 9, ARM.down], [0, 9, HEAD]);

export const BEAST: Beast = {
  code: 'M12',
  id: 'zmora',
  kind: { pl: 'Zmora', en: 'Nightmare' },
  name: { pl: 'nocna zmora', en: 'the night mora' },
  note: {
    pl: 'W Jawii cień z dwojgiem oczu, który pełznie po ziemi. Skacze ci na plecy i dusi; Shift ją zrzuca.',
    en: 'In Jawia a shadow with two eyes, crawling on the ground. It leaps on your back and chokes you; Shift throws it off.',
  },
  alt: [],
  w: W,
  h: H,
  view: 'side',
  pal: PAL,
  frames: { stand, walk, attack: [coil, LEAP] },
  ink: 'dark',
  outline: DARK,
  nawia: {
    pal: NAWIA,
    note: {
      pl: 'W Nawii widać ją całą: blada, bez włosa, z kręgosłupem na wierzchu i oczkami jak szpilki w zapadłych oczodołach.',
      en: 'In Nawia you see all of it: pale, hairless, its spine standing out, pinprick eyes sunk in shadow.',
    },
  },
};
