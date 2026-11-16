// M10 upior-b: a revenant out of the Zabłocie churchyard (16 x 24, from the side, facing right).
//
// The idea: a dead man who would not stay in the grave. He walks in the shirt he was buried in, grey with
// grave earth from the knees down, his back bent into a hump, the head hanging forward off the shoulders, the
// jaw slack. Round his throat is the sickle they laid on his neck in the coffin so that, if he rose, it would
// take his head off: he rose anyway, and it is rusted into him like a collar.
//
// How it moves: slowly; one step, then the other foot drags up on its toes; the arms hang and swing late, the
// head lolls.
// How it attacks: he rears up, the head thrown back and the hands raised (the wind-up), then falls forward
// onto you, the arms straight out at the height of your throat, the fingers hooked to strangle.
//
// Nawia: there he flies. No legs, no weight: the shirt runs out behind him into grey vapour, his back is the
// dark of Nawia with a cold edge of light, and in the socket that was empty a red ember burns.

import type { Beast } from './beast.ts';

const W = 16;
const H = 24;

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

const PAL = {
  t: 0xc8cca8, // dead skin, the light
  s: 0x9aa284, // dead skin
  S: 0x66705a, // dead skin, the shadow
  D: 0x3c3a34, // grave dirt on the feet
  w: 0xd4caac, // the burial shirt, the light
  l: 0xa89c80, // the shirt
  L: 0x74695a, // the shirt, the shadow
  m: 0x5a4a3a, // the shirt soaked with grave earth
  h: 0x2a2420, // hair
  H: 0x4a403a, // hair, the sheen
  i: 0x8e8a8a, // the sickle's worn edge
  I: 0x4a4246, // the sickle's iron
  r: 0x8a4a2a, // rust
  o: 0x140e10, // the eye socket, the mouth
};
const DARK = 0x1a1018;

// ------------------------------------------------------------------ the parts (rows from the top of the cell)

/** the hunched back in the shirt, the head hanging off it, the sickle round the throat */
const UPPER = [
  '....www.........',
  '...wwllhhh......',
  '..wwlllhhhhh....',
  '..wllllhhhttts..',
  '..wlllLhhttttss.',
  '..wllLLLhhSoosS.',
  '..wllLLwrhStssS.',
  '..wllLwlIr.SooS.',
  '..wlLLwllLrIrS..',
  '..wlLLLlllL.....',
  '..wlLLLlLL......',
  '..wlLLmlL.......',
  '..lmLmmL........',
  '..m.m.m.........',
];
/** the near forearm out of the sleeve, the hand at the knee: hanging, lagging back, swinging forward */
const ARM = {
  hang: ['.........sS.....', '.........sS.....', '..........s.....', '.........sSs....'],
  back: ['.........sS.....', '........sS......', '........s.......', '.......sSs......'],
  fwd: ['.........sS.....', '..........sS....', '..........s.....', '..........sSs...'],
};
/** the legs under the hem, knees bent: standing; a step; the back foot dragged up on its toes; the other step */
const LEGS = {
  stand: ['....s..s........', '....sS..s.......', '...sS..sS.......', '..ssD..ssD......'],
  step: ['....s...s.......', '...sS....sS.....', '..sS......sS....', '.ssD.......ssD..'],
  drag: ['.....s.s........', '....s..sS.......', '...s....sS......', '..DS.....ssD....'],
  step2: ['....s..s........', '...s....sS......', '..sS.....sS.....', '.sSD......ssD...'],
};

// ------------------------------------------------------------------ the attack: whole

/** rearing up, the hand raised, the head thrown back, the jaw open */
const WINDUP = [
  '................',
  '...........s.s..',
  '..........sSs...',
  '.........ws.....',
  '.....ww.wl......',
  '....wwllll......',
  '...wwlllhhh.....',
  '...wlllhhhtts...',
  '...wllhhttoos...',
  '...wllLhSttsS...',
  '...wllLLrISooo..',
  '...wlLLLIrSSoS..',
  '...wlLLL.rIrS...',
  '...wlLLL........',
  '...wlLL.........',
  '...wlLL.........',
  '..wlLLm.........',
  '..lmLmL.........',
  '..m.mSm.........',
  '...sS..sS.......',
  '...s.....s......',
  '..sS......s.....',
  '.ssD......ssD...',
  '................',
];
/** falling onto you: the back level, both arms straight out at your throat, the fingers hooked */
const STRIKE = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '....www.........',
  '...wwllhhh......',
  '..wwlllhhhhhtt..',
  '..wllllhhhtttss.',
  '..wlllLhhSoosS..',
  '..wllLLLrhStssS.',
  '..wllLLLIrSooS..',
  '..wllLwwllrIrss.',
  '..wlLLlLLLLlsSsS',
  '..wlLL.....s.s.s',
  '..wlLLm.........',
  '..lmLmL.........',
  '..m.mSm.........',
  '...s..s.........',
  '..sS...sS.......',
  '.sS......sS.....',
  'ssD.......ssD...',
  '................',
];

// ------------------------------------------------------------------ the frames

const stand = stack([0, 19, LEGS.stand], [0, 6, UPPER], [0, 16, ARM.hang]);
// the shamble: a step (he sinks), the far foot dragged up on its toes (he rises, the head lolls a pixel
// forward), the other step, the drag again; the arm swings late, the wrong way round to the legs
const walk = [
  stack([0, 19, LEGS.step], [0, 7, UPPER], [0, 17, ARM.back]),
  stack([0, 19, LEGS.drag], [0, 6, UPPER], [0, 16, ARM.hang]),
  stack([0, 19, LEGS.step2], [0, 7, UPPER], [0, 17, ARM.fwd]),
  stack([0, 19, LEGS.drag], [0, 6, UPPER], [0, 16, ARM.hang]),
];

// ------------------------------------------------------------------ Nawia: he flies

/** A red ember where the eye was: the socket's 'o' on row `y` lights up. */
const embers = (rows: string[], y: number): string[] => rows.map((r, i) => (i === y ? r.replace('oo', 'eE') : r));
/** the shirt runs out into vapour behind him, the tail of it streaming back high, level, low */
const TRAIL = {
  high: ['..wlLLLlL.......', 'vvlLLLL.........', 'vlLuLv..........', 'u.vu............'],
  mid: ['..wlLLLlL.......', '.vlLLLLL........', '.vlLuLv.........', 'vlvuv...........', 'v.u.............'],
  low: ['..wlLLLlL.......', '..lLLLLL........', '..vLLuv.........', '.vluv...........', '.vu.............', 'v...............'],
  flat: ['.wllLLLL........', 'vvlLLvL.........', 'vu.vLu..........', 'u.v.............'],
};
/** the arm hanging limp, half gone into the vapour */
const ARM_N = ['.........sS.....', '.........sv.....', '..........v.....', '.........v.u....'];
const up = (rows: string[]): string[] => embers(rows.slice(0, 10), 5);
const NAWIA_FRAMES = {
  stand: stack([0, 11, TRAIL.mid], [0, 2, up(UPPER)], [0, 13, ARM_N]),
  // the flight: he bobs, and the vapour behind him swings the other way, like a tail
  walk: [
    stack([0, 12, TRAIL.high], [0, 3, up(UPPER)], [0, 14, ARM_N]),
    stack([0, 11, TRAIL.mid], [0, 2, up(UPPER)], [0, 13, ARM_N]),
    stack([0, 10, TRAIL.low], [0, 1, up(UPPER)], [0, 12, ARM_N]),
    stack([0, 11, TRAIL.mid], [0, 2, up(UPPER)], [0, 13, ARM_N]),
  ],
  attack: [
    // rearing up in the air, the hand raised; then he dives at your throat, the vapour pulled out flat behind
    stack([1, 13, TRAIL.low], [0, 0, embers(WINDUP.slice(0, 16), 8)]),
    stack([0, 13, TRAIL.flat], [0, 2, embers(STRIKE.slice(6, 16), 4)]),
  ],
};

const NAWIA = {
  t: 0x8a96b4, // the skin: dark, cold
  s: 0x4e5874,
  S: 0x2e3450,
  D: 0x1a1a2a,
  w: 0xa8c8e4, // the shirt's lit edge glows
  l: 0x3e4c6a,
  L: 0x283250,
  m: 0x1c2038,
  h: 0x0e0c16,
  H: 0x242036,
  i: 0x6a6e80,
  I: 0x34303e,
  r: 0x5a3040,
  o: 0x08060c,
  e: 0xff5a3a, // the ember in the socket
  E: 0xb02a2a,
  v: 0x6a7c9c, // the vapour (no line round it)
  u: 0x3a4664,
};
const HALO = 0x1e2440;
const NAWIA_LINE = Object.fromEntries(Object.keys(NAWIA).filter((k) => k !== 'v' && k !== 'u').map((k) => [k, HALO]));

export const BEAST: Beast = {
  code: 'M10',
  id: 'upior-b',
  kind: { pl: 'Upiór', en: 'Revenant' },
  name: { pl: 'upiór z sierpem na szyi', en: 'the revenant with a sickle at his throat' },
  note: {
    pl: 'Wstał z grobu mimo sierpa, który mu położono na szyi. Wlecze się powoli, a potem rzuca się do gardła i dusi.',
    en: 'He rose from the grave despite the sickle laid on his neck. He shambles slowly, then lunges for your throat.',
  },
  alt: ['P13'],
  w: W,
  h: H,
  view: 'side',
  pal: PAL,
  frames: { stand, walk, attack: [WINDUP, STRIKE] },
  ink: 'rim',
  outline: DARK,
  nawia: {
    pal: NAWIA,
    frames: NAWIA_FRAMES,
    ink: { ink: 'rim', line: NAWIA_LINE },
    note: {
      pl: 'W Nawii lata: nie ma nóg, koszula rozwiewa się w szary dym, a w pustym oczodole tli się czerwony węgiel.',
      en: 'In Nawia he flies: no legs, the shirt blows out into grey vapour, and a red ember burns in the empty socket.',
    },
  },
};
