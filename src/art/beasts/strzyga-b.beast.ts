// M11 strzyga-b: the strzyga with two souls (24 x 24, facing us; a mini-boss).
//
// The idea: she was born with two souls. When she died, one went to Nawia and the other stayed in the body
// and keeps it walking, so she has to be killed twice, once in each world.
// In Jawia she is the body: a gaunt woman hunched like a crow on a branch, the shoulders drawn up round a sunk
// head under an ash-grey shawl whose points stand up like the bends of folded wings, the black hair down over
// the face (only the point of a nose shows through it, sharp as a beak), the hands held up in front of her
// chest like a bird's claws, the nails long and yellow, the feet long-toed under a dress brown with grave earth.
//
// How it moves: a stalking walk on long toes, the weight swaying over the standing leg, the head jerking down
// at each step like a crow's.
// How it attacks: she throws her arms out and the shawl opens like wings (the wind-up), then she drops onto
// you with both claws, the jaw falling open below the hair on two rows of teeth.
//
// Nawia: there you see the other soul, and it is a bird of cold light: wings spread, a crest of light where
// the hair was, a white face with two dark slits for eyes and the mouth open in the strzyga's screech; behind
// the ribs of light in its breast the second heart burns red. It beats its wings, then dives at you claws
// first.

import type { Beast } from './beast.ts';

const W = 24;
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
  t: 0xdcd4ca, // ash-pale skin, the light
  s: 0xaca2a0, // skin
  S: 0x726670, // skin, the shadow
  h: 0x16121a, // hair
  H: 0x463c56, // hair, the sheen
  k: 0x9a8e88, // the shawl, the lit edge
  c: 0x6a5e62, // the shawl
  C: 0x40363e, // the shawl, the shadow
  w: 0x9a8270, // the dress, the light
  l: 0x6e5a4c, // the dress (grave earth)
  L: 0x4a3c34, // the dress, the shadow
  n: 0xe0d4a0, // nails and teeth
  N: 0x8e7e52, // nails, the shadow
  r: 0x5a1220, // the mouth
};
const DARK = 0x1a1018;

// ------------------------------------------------------------------ the body (rows from the top of the cell)

/** the hunched shoulders under the shawl, the head sunk between them, the hands up like claws */
const UPPER = [
  '.....k............C.....',
  '.....kc...hHhh...cC.....',
  '.....kcc.hHhhhh.ccC.....',
  '.....kccchHhhhhcccC.....',
  '....kccccHhhhhhccccC....',
  '....kccc.hHthhh.cccC....',
  '...kcccc.hHtShh.ccccC...',
  '...kc.cc.hHhhhh.cc.cC...',
  '...k..c..hHhhHh..c..C...',
  '...k.ts..hHhhHh..sS.C...',
  '......tsshHhhHhssS......',
  '.......tthHhhHhsS.......',
  '.......n.n.hH.n.N.......',
  '.......n.n.wl.N.N.......',
  '.........wl.hlL.........',
  '.........wllLlL.........',
  '.........wlLlLL.........',
  '.........wlL.lL.........',
];
/** the legs, long-toed: standing; the left foot up; the right foot up */
const LEGS = {
  stand: ['..........tS.sS.........', '..........tS.sS.........', '..........s..sS.........', '.........ts...sS........', '........nsnn.nnSn.......'],
  left: ['..........tS.sS.........', '..........tS.sS.........', '.........ts..sS.........', '.........nsn..sS........', '.............nnSn.......'],
  right: ['..........tS.sS.........', '..........tS.sS.........', '..........s..sS.........', '.........ts..nSn........', '........nsnn............'],
};

/** the arms flung out, the shawl open like wings, up on her toes, the head lifted */
const WINDUP = [
  '........................',
  '.n....................n.',
  '.nt.......hHhh.......Sn.',
  '.ksc.....hHhhhh.....cSC.',
  '.kccc...hHhhhhhh...cccC.',
  '..kccc..hHhhhhhh..cccC..',
  '..kc.cc.hHhthhhh.cc.cC..',
  '...k.c.chHhtShhhc.c.C...',
  '...k...chHhhhhHhC...C...',
  '.......chHhhhhHhC.......',
  '........hHhhhhHh........',
  '........whHhhHhL........',
  '........wlhhHhLL........',
  '........wl.hHhLL........',
  '........wllLlLLL........',
  '........wlLLlLLL........',
  '........wlLl.lLL........',
  '.........tS..sS.........',
  '.........s....s.........',
  '.........s....s.........',
  '.........s....s.........',
  '........ns....sn........',
  '.........n....n.........',
  '........................',
];
/** dropping onto you: the claws out at both sides, the jaw dropped below the hair on two rows of teeth */
const STRIKE = [
  '........................',
  '........................',
  '........................',
  '........................',
  '.....k............C.....',
  '.....kc...hHhh...cC.....',
  '.....kcc.hHhhhhh.ccC....',
  '....kcccchHhhhhhhcccC...',
  '...kccc.hHhhhhhhh.ccC...',
  '..kcc...hHhhhhShh..cCC..',
  '..kc.c..hHhhhhhhh.c.cC..',
  '..ts....hHtnnthHh...sS..',
  '.ts.....hHrrrrHh.....sS.',
  'nts.....whrrrrhL.....sSn',
  'n.n.....wlSnnSLL.....n.n',
  '........wllLlLLL........',
  '........wlLLlLLL........',
  '.......tSlLl.lLsS.......',
  '......ts........sS......',
  '.....ts..........sS.....',
  '....ts............sS....',
  '...nsn............nSn...',
  '....n..............n....',
  '........................',
];

const stand = stack([0, 18, LEGS.stand], [0, 0, UPPER]);
// the stalk: a long step, the weight swaying over the standing leg and the head jerking down like a crow's;
// then the other
const walk = [
  stack([0, 18, LEGS.left], [1, 1, UPPER]),
  stack([0, 18, LEGS.stand], [0, 0, UPPER]),
  stack([0, 18, LEGS.right], [-1, 1, UPPER]),
  stack([0, 18, LEGS.stand], [0, 0, UPPER]),
];

// ------------------------------------------------------------------ Nawia: the other soul, a bird of light

/** the head: a crest of light where the hair was, a white face, two dark slits for eyes, the mouth open in a screech */
const SOUL_HEAD = [
  '..........b.b...........',
  '.........b.bb.b.........',
  '.........abbab..........',
  '..........aWWa..........',
  '.........aWWWWa.........',
  '.........aeWWea.........',
  '.........aWWWWa.........',
  '..........aeea..........',
  '..........aeea..........',
];
/** the breast: ribs of light, the second heart burning red behind them; the tail streaming under it */
const SOUL_BODY = [
  '..........aaaa..........',
  '.........aWWWWa.........',
  '........aWcRRcWa........',
  '........aWcRQcWa........',
  '.........aWccWa.........',
  '..........aWWa..........',
  '.........baaaab.........',
  '........cbaWWabc........',
  '.......cbaabbaabc.......',
  '......dcb.abba.bcd......',
  '......d.c.b..b.c.d......',
  '........d.c..c.d........',
];
/** the wings, spread: raised, level, down */
const WINGS = {
  up: [
    '.dc..................cd.',
    '.dcb................bcd.',
    '..dcb..............bcd..',
    '..dcba............abcd..',
    '...dcba..........abcd...',
    '...dcbaa........aabcd...',
    '....dcbaa......aabcd....',
    '....d.cbaa....aabc.d....',
    '.....d.c.b....b.c.d.....',
    '......d..c....c..d......',
    '.........d....d.........',
  ],
  level: [
    '........................',
    '........................',
    '........................',
    'cb....................bc',
    'dcbaa..............aabcd',
    '.dcbbaaa........aaabbcd.',
    '.dccbbbaaa....aaabbbccd.',
    '..d.cc.bb.a..a.bb.cc.d..',
    '..d..c..b......b..c..d..',
    '.....d..c......c..d.....',
    '........d......d........',
  ],
  down: [
    '........................',
    '........................',
    '........................',
    '........................',
    '........aa....aa........',
    '......aaba....abaa......',
    '....aabbcb....bcbbaa....',
    '...abbcc.c....c.ccbba...',
    '..abcc.d..c..c..d.ccba..',
    '..bc.d..d........d..cb..',
    '..c..d............d..c..',
    '..d....................d',
  ],
};
/** the dive: wings swept back behind it, the claws thrown forward at you */
const SOUL_DIVE = [
  '........................',
  '..dc................cd..',
  '..dcb..............bcd..',
  '...dcb...b.b......bcd...',
  '...dcba.b.bb.b...abcd...',
  '....dcba.abbab..abcd....',
  '....dcbaa.aWWa.aabcd....',
  '.....dcbaaeWWeaabcd.....',
  '.....dcbaaWWWWaabcd.....',
  '......dcbaaeeaabcd......',
  '.......dcbaeeaabcd......',
  '........dbaaaabd........',
  '.........aWWWWa.........',
  '........aWcRRcWa........',
  '........aWcRQcWa........',
  '.........aWccWa.........',
  '.........aaWWaa.........',
  '........aW.aa.Wa........',
  '.......aW......Wa.......',
  '......WaW......WaW......',
  '.....W.W.W....W.W.W.....',
  '........................',
  '........................',
  '........................',
];
const soul = (wings: string[], dy: number): string[] => stack([0, dy + 1, wings], [0, dy + 8, SOUL_BODY], [0, dy, SOUL_HEAD]);
const SOUL_FRAMES = {
  stand: soul(WINGS.level, 2),
  // the flight: the wings beat (up, level, down, level), the body rising a pixel on the downbeat
  walk: [soul(WINGS.up, 3), soul(WINGS.level, 2), soul(WINGS.down, 1), soul(WINGS.level, 2)],
  // the wings thrown up and back, it rises; then it dives at you, the claws first
  attack: [soul(WINGS.up, 0), SOUL_DIVE],
};
const SOUL_PAL = {
  W: 0xf4fbff, // the white core of it
  a: 0xbce8f6,
  b: 0x74b0dc,
  c: 0x3e68a6,
  d: 0x263670, // the feather tips going out into the dark
  e: 0x0e1236, // the eyes, the mouth
  R: 0xff4a50, // the second heart
  Q: 0xa81c40,
};

export const BEAST: Beast = {
  code: 'M11',
  id: 'strzyga-b',
  kind: { pl: 'Strzyga', en: 'Strzyga' },
  name: { pl: 'strzyga o dwóch duszach', en: 'the strzyga with two souls' },
  note: {
    pl: 'W Jawii ciało: zgarbione jak ptak na gałęzi, włosy na twarzy, szpony. Ma drugą duszę w Nawii i trzeba zabić obie.',
    en: 'In Jawia the body: hunched like a bird on a branch, hair over the face, claws. Her other soul is in Nawia; kill both.',
  },
  alt: ['P9', 'P10', 'E3', 'E4'],
  w: W,
  h: H,
  view: 'front',
  pal: PAL,
  frames: { stand, walk, attack: [WINDUP, STRIKE] },
  ink: 'rim',
  outline: DARK,
  nawia: {
    pal: SOUL_PAL,
    frames: SOUL_FRAMES,
    ink: { ink: 'none' },
    note: {
      pl: 'W Nawii jej druga dusza: ptak z zimnego światła, z białą twarzą otwartą w krzyku i drugim sercem w piersi.',
      en: 'In Nawia, her other soul: a bird of cold light, its white face open in a screech, the second heart in its breast.',
    },
  },
};
