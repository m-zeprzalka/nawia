// M11 strzyga-b: the strzyga with two souls (24 x 24, facing us; a mini-boss).
//
// The idea: she was born with two souls. When she died, one went to Nawia and the other stayed in the body
// and keeps it walking, so she has to be killed twice, once in each world.
// In Jawia she is the body: a gaunt woman hunched like a crow on a branch, the shoulders drawn up round a sunk
// head under an ash-grey shawl whose points stand up like the bends of folded wings, the black hair down over
// the face (only the point of a nose shows through it, sharp as a beak), the hands held up in front of her
// chest like a bird's claws, the nails long and yellow, the feet long-toed under a dress brown with grave earth.
//   walk     a stalking walk on long toes, the weight swaying over the standing leg, the head jerking down at
//            each step like a crow's;
//   wind-up  she throws her arms out and the shawl opens like wings, up on her toes, the head lifted, and two
//            sparks of eyes show through the hair;
//   blow     she drops onto you with both claws, the jaw falling open below the hair on two rows of teeth;
//   recover  bent double, the head hung below the shoulders, the hair to the ground, the arms hanging limp;
//   hurt     the head snapped back and the hair flung off the face for a moment: a gaunt dead face, the eyes
//            two sparks in their sockets, the mouth dropped open; the shoulders jerked up, the claws curled.
//
// Nawia: there you see the other soul, a strix of cold light, all bones and ragged feathers: the hair streams
// up from a peaked hood of light like cold flame, the face inside the hood is nothing but dark with two slanted
// slits of light for eyes, ribs of light stand over the dark of the breast, and behind them the second heart
// burns red; long bird legs end in open talons. It has a dark line round it, so the light does not dissolve
// into the dark floor.
//   walk     the flight: the wings beat (up, level, down, level), the body sinking on the upbeat and rising
//            on the downbeat;
//   wind-up  the wings thrown up high in a V, the talons drawn up, the eyes blazing into two white blocks and
//            the jaw dropped open;
//   blow     the dive: the wings swept back close to the head, the talons thrown forward and wide;
//   recover  overshot and spent, the wings hanging to the ground, the hood hung forward, the eyes dim, the
//            talons dragging;
//   hurt     the wings jerked up and back, the head snapped back with the eyes screwed shut and the jaw open,
//            the talons curled, the body a row shorter.

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
  '..kccc..hHnhhnhh..cccC..',
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
  '..kc.c..hHnhhhnhh.c.cC..',
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

/** the recovery: spent after the drop, bent double, the head hung below the shoulders, the hair to the ground,
 *  the arms hanging limp, the knees bent */
const RECOVER = [
  '........................',
  '........................',
  '........................',
  '........................',
  '.....k............C.....',
  '.....kc..........cC.....',
  '....kccc........cccC....',
  '....kcccc......ccccC....',
  '...kccccchHhhhhcccccC...',
  '...kc.cchHhhhhhhcc.cC...',
  '...k..cchHhhhhhhc...C...',
  '...t...chHhhhhhh.S..C...',
  '...ts...hHhhhhHh..sS....',
  '...ts...hHhhhhHh..sS....',
  '....s...hHhhhhHh...S....',
  '....s...whHhhHhL...S....',
  '....s...wlhHHhLL...s....',
  '....n...wlLhhLlL...N....',
  '...n.n..wlLlLlLL..N.N...',
  '........wlL..lLL........',
  '.........tS..sS.........',
  '........ts....sS........',
  '.......nsnn..nnSn.......',
  '........................',
];
/** the flinch: the head snapped back and the hair flung off the face (a gaunt face, the eyes two sparks, the mouth
 *  open), the shoulders jerked up, the claws curled to the chest */
const HURT = [
  '.....h..H......H..h.....',
  '....k.h.hH....Hh.h.C....',
  '....kc.hHhhhhhhhh.cC....',
  '....kcchHsttttShhccC....',
  '...kccchSnSttSnShcccC...',
  '...kcccchSsttsShccccC...',
  '...kc.cc.SsrrsS.cc.cC...',
  '...k..c..tSrrSS..c..C...',
  '...k.....sSrrSS.....C...',
  '......ts..tSSS..sS......',
  '.....tsn..wlLl..nsS.....',
  '.....nn.n.wllLl.n.NN....',
  '.........wlllLlL........',
  '.........wllLlLL........',
  '.........wlLlLLL........',
  '.........wlLlLLL........',
  '.........wlL.lLL........',
  '..........tS.sS.........',
  '..........tS.sS.........',
  '..........s..sS.........',
  '.........ts...sS........',
  '........nsnn.nnSn.......',
  '........................',
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

// ------------------------------------------------------------------ Nawia: the other soul, a strix of cold light

/** A pair of wings from the left one (12 columns): the right is its mirror, a shade darker, since the light
 *  comes from the upper left. */
const DIM: Record<string, string> = { W: 'a', a: 'b', b: 'c', c: 'c', d: 'd' };
const pair = (left: string[]): string[] => left.map((r) => r + [...r].reverse().map((ch) => DIM[ch] ?? ch).join(''));

/** the left wing in each pose, rows from the top of the soul; the shoulder is at row 9 */
const WING = {
  /** spread level, the ragged flight feathers hanging from it */
  level: [
    '............',
    '............',
    '............',
    '............',
    '............',
    '............',
    '............',
    '...aaa......',
    '.aabbbaa....',
    'abbcbbbbaaa.',
    'bcbccbccbb..',
    'cc.cdc.cdc..',
    'c.dc.c.d.c..',
    'd.d..c..d...',
    'd..d.d......',
    '...d........',
  ],
  /** raised high over the head */
  up: [
    'a...........',
    'ba..........',
    'cba.........',
    'cbba........',
    'dcbba.......',
    'd.cbba......',
    '.dccbaa.....',
    '.d.cbbaa....',
    '..d.ccbaa...',
    '...d.ccbaaa.',
    '.....d.ccb..',
    '......d.c...',
  ],
  /** beaten down */
  down: [
    '............',
    '............',
    '............',
    '............',
    '............',
    '............',
    '............',
    '............',
    '.......aaa..',
    '....aabbbaa.',
    '..aabbccbb..',
    '.abbcc.cc...',
    'abc.c.dc....',
    'bc.d..d.....',
    'c.d.........',
    'd...........',
    'd...........',
  ],
  /** swept up and back for the dive, close to the head */
  swept: [
    '....a.......',
    '....ba......',
    '...dba......',
    '...dcba.....',
    '..d.cba.....',
    '..d.cbba....',
    '...dccba....',
    '....dcbaa...',
    '.....dcbaa..',
    '......dcba..',
  ],
  /** hanging limp to the ground */
  droop: [
    '............',
    '............',
    '............',
    '............',
    '............',
    '............',
    '............',
    '............',
    '............',
    '............',
    '.......aaa..',
    '.....aabbb..',
    '....abbcc...',
    '...abcc.c...',
    '..abc.c.d...',
    '..bc.dc.....',
    '.bc.d.d.....',
    '.c.d..d.....',
    'cd.d........',
    'c..d........',
  ],
  /** jerked up and back by the blow, crumpled */
  flung: [
    '............',
    '..a.........',
    '..ba..a.....',
    '.dcbaab.....',
    '.d.cbba.....',
    '..d.cbbaa...',
    '...d.cbbaa..',
    '....d.ccba..',
    '......d.cb..',
  ],
};

/** the head: the hair streaming up like cold flame, a hood of light round a long dark face, the eyes two slits of light */
const HEAD = [
  '..........a.............',
  '.........a..ab..........',
  '..........aaa.b.........',
  '.........aabbbc.........',
  '........aabeebbc........',
  '........aeeeeeec........',
  '........aWeeeeWc........',
  '........aeWeeWec........',
  '.........aeeeec.........',
  '..........aeec..........',
];
/** the head as it winds up: the slits blaze, the jaw drops open on a row of teeth */
const HEAD_FLARE = [
  '.......a..a..b..........',
  '........aa.ab.b.........',
  '.........aaab...........',
  '.........aabbbc.........',
  '........aabeebbc........',
  '........aWWeeWWc........',
  '........aWWeeWWc........',
  '........aeeeeeec........',
  '.........eaeeae.........',
  '.........aeeeec.........',
  '..........eeee..........',
];
/** the head hung, spent: the hood forward, the face turned down, the slits gone dim */
const HEAD_HUNG = [
  '........................',
  '........................',
  '........................',
  '..........a.b...........',
  '.........aabbc..........',
  '........aabbbbbc........',
  '........abbbbbbc........',
  '........aeeeeeec........',
  '........aeceecec........',
  '.........aeeeec.........',
];
/** the head snapped back: the hair flung behind, the face tilted up, the slits screwed shut, the jaw open */
const HEAD_BACK = [
  '.....a..........b.......',
  '......a.a....b.b........',
  '.......aaabbbbc.........',
  '........aabbbbbc........',
  '........aeeeeeec........',
  '........abbeebbc........',
  '.........eeeeee.........',
  '.........eWeeWe.........',
  '..........eeee..........',
];
/** the breast: ribs of light, the second heart burning red behind them */
const BREAST = [
  '...........ab...........',
  '........aWWWWWWc........',
  '........a..RR..c........',
  '........aWWRQWWc........',
  '.........a.QQ.c.........',
  '.........aWWWWc.........',
  '..........b..c..........',
];
/** the legs: long, the talons hanging open; drawn up and spread; thrown forward; dragging; curled */
const TALONS = {
  hang: [
    '..........b..c..........',
    '..........a..c..........',
    '.........a....b.........',
    '........aW....Wb........',
    '.......W.W....W.W.......',
  ],
  up: [
    '.........ab..cb.........',
    '........aW....Wb........',
    '.......W.W....W.W.......',
  ],
  strike: [
    '.........ab..cb.........',
    '........ab....cb........',
    '.......ab......cb.......',
    '......aW........Wb......',
    '.....W.W.W....W.W.W.....',
    '....W.....W..W.....W....',
  ],
  drag: [
    '..........b..c..........',
    '.........a....c.........',
    '........aW....Wc........',
    '.......W.W.WW.W.W.......',
  ],
  curl: [
    '.........ab..cb.........',
    '.........WW..WW.........',
  ],
};

/** the soul with its wings in a pose, its head and its legs, `dy` rows down */
const soul = (wing: string[], head: string[], talons: string[], dy: number, breast = 10, legs = 16): string[] =>
  stack([0, dy, pair(wing)], [0, dy + breast, BREAST], [0, dy + legs, talons], [0, dy, head]);

const SOUL_FRAMES = {
  stand: soul(WING.level, HEAD, TALONS.hang, 1),
  // the flight: the wings beat (up, level, down, level); the body sinks on the upbeat and rises on the downbeat
  walk: [soul(WING.up, HEAD, TALONS.hang, 2), soul(WING.level, HEAD, TALONS.hang, 1), soul(WING.down, HEAD, TALONS.hang, 0), soul(WING.level, HEAD, TALONS.hang, 1)],
  attack: [
    // the wind-up: the wings thrown up high, the talons drawn up, the slits blazing, the jaw open
    soul(WING.up, HEAD_FLARE, TALONS.up, 0, 11, 17),
    // the blow: it dives at you, the wings swept back, the talons thrown forward and wide
    soul(WING.swept, HEAD, TALONS.strike, 2),
    // the recovery: overshot and spent, the wings hanging to the ground, the head hung, the talons dragging
    soul(WING.droop, HEAD_HUNG, TALONS.drag, 3, 10, 16),
  ],
  // the flinch: the wings jerked up, the head snapped back, the talons curled, the body squashed a row
  hurt: soul(WING.flung, HEAD_BACK, TALONS.curl, 2, 9, 15),
};
const SOUL_PAL = {
  W: 0xf4fbff, // the white core of it: the eyes, the ribs, the talons
  a: 0xbce8f6, // the cold light, where it is brightest
  b: 0x74b0dc,
  c: 0x3e68a6,
  d: 0x263670, // the feather tips going out into the dark
  e: 0x080a1e, // the face: nothing but dark
  R: 0xff4a50, // the second heart
  Q: 0xa81c40,
};
const SOUL_LINE = 0x05061a;

export const BEAST: Beast = {
  code: 'M11',
  id: 'strzyga-b',
  kind: { pl: 'Strzyga', en: 'Strzyga' },
  name: { pl: 'strzyga o dwóch duszach', en: 'the strzyga with two souls' },
  note: {
    pl: 'W Jawii ciało: zgarbione jak ptak na gałęzi, włosy na twarzy, szpony. Rozkłada chustę jak skrzydła i spada na ciebie; trafiona odrzuca głowę i widać martwą twarz. Ma drugą duszę w Nawii i trzeba zabić obie.',
    en: 'In Jawia the body: hunched like a bird on a branch, hair over the face, claws. She spreads her shawl like wings and drops on you; struck, her head snaps back and the dead face shows. Her other soul is in Nawia; kill both.',
  },
  alt: ['P9', 'P10', 'E3', 'E4'],
  w: W,
  h: H,
  view: 'front',
  pal: PAL,
  frames: { stand, walk, attack: [WINDUP, STRIKE, RECOVER], hurt: HURT },
  ink: 'rim',
  outline: DARK,
  nawia: {
    pal: SOUL_PAL,
    frames: SOUL_FRAMES,
    ink: { ink: 'dark', outline: SOUL_LINE },
    note: {
      pl: 'W Nawii jej druga dusza: strzyga-ptak z zimnego światła, w kapturze z ciemną twarzą i oczami jak szpary światła, z drugim sercem za żebrami. Podrywa skrzydła, a oczy jej płoną, potem nurkuje szponami naprzód.',
      en: 'In Nawia, her other soul: a strix of cold light, a dark face in a hood with slits of light for eyes, the second heart behind its ribs. It throws its wings up, eyes blazing, then dives talons first.',
    },
  },
};
