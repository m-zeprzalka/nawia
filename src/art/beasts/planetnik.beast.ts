// M16, Płanetnik: the cloud-hauler (new). 24 x 32, two tiles, drawn facing right.
//
// The idea: the weather-man of the lore, who drags the clouds on ropes and brings down hail and lightning. A tall,
// gaunt old man, bald, his beard dark and wet, his one visible eye a pale spark; bent nearly double under a rope he
// hauls over his shoulder, fist at the collar, like a man towing a barge. The rope runs back and up to a small
// storm cloud. His grey coat goes to cloud where it frays: puffs on his shoulders, a tail of cloud streaming behind.
//
// How he moves: a heavy haul. Each stride drops him a pixel, the cloud bobs behind on the taut rope.
// How he attacks: he crouches and heaves while lightning crawls in the cloud's belly (the wind-up), then throws
// himself back on the rope: the cloud is yanked over his head and a bolt comes down in front of him (the blow).
//
// Nawia: what he really hauls shows. The lore says he is the one who holds the silent bell, a bell "heavy, as if
// something held it". In Nawia the cloud on his rope is that bell, its clapper bound with rope so it cannot ring.
// He goes dark with cold glowing edges; the bell swings back and is flung over him the same way, and the blow comes
// down cold and white.

import type { Beast } from './beast.ts';

const W = 24;
const H = 32;

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

// ------------------------------------------------------------------ the cloud he hauls (Jawia)

const CLOUD = at(0, [
  '...wwww.................',
  '.wwwwwWww...............',
  'wwwWWWWWWw..............',
  'wWWWWWNWWWw.............',
  '.WWNNNNNNNN.............',
  '..NNNNNNNN..............',
  '...N..NN................',
]);
/** charging: lightning crawls in its belly */
const CLOUD_CHARGE = at(0, [
  '...wwww.................',
  '.wwwwwWww...............',
  'wwwWWWWWWw..............',
  'wWWWNNNNWWw.............',
  '.WNNNeNNNNN.............',
  '..NNNNeeeN..............',
  '...N..NN................',
]);
/** yanked over his head, spitting the bolt */
const CLOUD_OVER = at(0, [
  '..............wwww......',
  '...........wwwwwWWww....',
  '..........wwWWWWWWWWw...',
  '..........WWNNNNNNNNNW..',
  '...........NNNNNNNNNeN..',
  '............N..NN...eN..',
]);
const BOLT = at(6, [
  '.....................e..',
  '.....................ee.',
  '......................e.',
  '.....................ee.',
  '.....................e..',
  '.....................ee.',
  '......................e.',
  '......................e.',
  '.....................ee.',
  '.....................e..',
  '.....................ee.',
  '......................e.',
  '......................e.',
  '.....................ee.',
  '.....................e..',
  '.....................ee.',
  '......................e.',
  '.....................eee',
  '....................e.e.',
  '......................e.',
  '.....................eee',
  '....................eeee',
  '...................e.e.e',
  '......................e.',
]);

// ------------------------------------------------------------------ what the cloud is in Nawia: the silent bell

/** the bell, its clapper bound with rope so it cannot ring */
const BELL = at(0, [
  '....wN..................',
  '...wWWN.................',
  '..wWWWWN................',
  '..wWWWWN................',
  '..wWWWWN................',
  '..rrrrrrrr..............',
  '.wWWWWWWN...............',
  '.wWWWWWWWN..............',
  'wwWWWWWWWN..............',
  'NNNNNNNNNN..............',
  '....rN..................',
]);
/** swung back on the rope, straining */
const BELL_CHARGE = at(0, [
  '...wN...................',
  '..wWWN..................',
  '.wwWWWN.................',
  '.wWWWWN.................',
  '.wWWWWWN................',
  '.rrrrrrrrr..............',
  'wwWWWWWWN...............',
  'wWWWWWWWWN..............',
  'wwWWWWWWWN..............',
  'NNNNNNNNNN..............',
  '...rN...................',
]);
/** flung over his head: its silent toll comes down in front of him */
const BELL_OVER = at(0, [
  '................wN......',
  '...............wWWN.....',
  '..............wWWWWN....',
  '..............rrrrrr....',
  '.............wWWWWWWN...',
  '............wwWWWWWWWN..',
  '............NNNNNNNNNN..',
  '................rN......',
]);

// ------------------------------------------------------------------ the rope, from the cloud to his fist

const ROPE = {
  stand: at(5, ['..........r.............', '...........r............', '............r...........', '.............r..........', '..............r.........', '...............r........', '................r.......']),
  down: at(5, ['..........r.............', '...........r............', '............r...........', '.............r..........', '.............r..........', '..............r.........', '...............r........', '................r.......']),
  lowCloud: at(6, ['..........r.............', '...........r............', '............r...........', '.............rr.........', '...............r........', '................r.......']),
  crouch: at(5, ['..........r.............', '...........r............', '............r...........', '............r...........', '.............r..........', '..............r.........', '...............r........', '...............r........', '................r.......']),
  yank: at(6, ['.............r..........', '.............r..........', '..............r.........', '..............r.........', '...............r........', '...............r........', '...............r........', '................r.......', '................r.......']),
};

// ------------------------------------------------------------------ him

/** stooped under the rope, the fist on his shoulder, the head hung, the coat of cloud streaming behind */
const BODY = at(8, [
  '..................ssS...',
  '.................sssSS..',
  '.................hsSSes.',
  '................shHSsss.',
  '..............wwsShhhS..',
  '.............wwWWcchhH..',
  '............wWWNNCcc.hH.',
  '............WNNCCCDcc...',
  '............cCCDCDD.....',
  '...........cCCCDCDD.....',
  '...........cCCCDCDD.....',
  '..........rrrrrrrr......',
  '.........wcCCCDCDD......',
  '........wwcCCCDCDD......',
  '......wwwWcCCCDCDD......',
  '.....wwWWWcCCCDCCDD.....',
  '....wwWWNNcCCCDCDDD.....',
  '.....WWN..CCDC.CDD......',
]);
/** thrown back by the yank, the fist hauled down to his chest */
const HEAVE = at(8, [
  '................ssS.....',
  '...............sssSS....',
  '...............hsSSes...',
  '...............HhSsss...',
  '.............wwHhhhS....',
  '............wwWWWhhH....',
  '...........wWWNNCsS.hH..',
  '...........WNNCCcsS.....',
  '...........cCCDCcc......',
  '..........cCCCDCDD......',
  '..........cCCCDCDD......',
  '.........rrrrrrrr.......',
  '........wcCCCDCDD.......',
  '.......wwcCCCDCDD.......',
  '.....wwwWcCCCDCDD.......',
  '....wwWWWcCCCDCCDD......',
  '...wwWWNNcCCCDCDDD......',
  '....WWN..CCDC.CDD.......',
]);
const LEGS = {
  stand: at(26, ['..........SS..ss........', '.........SS....ss.......', '........SS.....ss.......', '.......SS.......ss......', '......kkk.......kkkk....']),
  near: at(26, ['.........SS...ss........', '........SS......ss......', '.......SS.......ss......', '......SS.........ss.....', '....kkk..........kkkk...']),
  pass: at(26, ['...........SSss.........', '...........SSss.........', '...........SS.ss........', '..........SS..ss........', '.........kkk..kkkk......']),
  far: at(26, ['.........ss...SS........', '........ss......SS......', '.......ss.......SS......', '......ss.........SS.....', '....kkkk.........kkk....']),
  brace: at(26, ['.........SS....ss.......', '........SS......ss......', '........SS.......ss.....', '.......SS.........ss....', '......kkk.........kkkk..']),
};

const STAND = put([0, 0, CLOUD], [0, 0, LEGS.stand], [0, 0, BODY], [0, 0, ROPE.stand]);
const WALK = [
  put([0, 0, CLOUD], [0, 0, LEGS.near], [0, 1, BODY], [0, 0, ROPE.down]),
  put([0, 1, CLOUD], [0, 0, LEGS.pass], [0, 0, BODY], [0, 0, ROPE.lowCloud]),
  put([0, 0, CLOUD], [0, 0, LEGS.far], [0, 1, BODY], [0, 0, ROPE.down]),
  put([0, 1, CLOUD], [0, 0, LEGS.pass], [0, 0, BODY], [0, 0, ROPE.lowCloud]),
];
const ATTACK = [
  put([0, 0, CLOUD_CHARGE], [0, 0, LEGS.brace], [0, 2, BODY], [0, 0, ROPE.crouch]),
  put([0, 0, CLOUD_OVER], [0, 0, LEGS.brace], [-1, 0, HEAVE], [0, 0, ROPE.yank], [0, 0, BOLT]),
];

const NSTAND = put([0, 0, BELL], [0, 0, LEGS.stand], [0, 0, BODY], [0, 0, ROPE.stand]);
const NWALK = [
  put([0, 0, BELL], [0, 0, LEGS.near], [0, 1, BODY], [0, 0, ROPE.down]),
  put([0, 1, BELL], [0, 0, LEGS.pass], [0, 0, BODY], [0, 0, ROPE.lowCloud]),
  put([0, 0, BELL], [0, 0, LEGS.far], [0, 1, BODY], [0, 0, ROPE.down]),
  put([0, 1, BELL], [0, 0, LEGS.pass], [0, 0, BODY], [0, 0, ROPE.lowCloud]),
];
const NATTACK = [
  put([0, 0, BELL_CHARGE], [0, 0, LEGS.brace], [0, 2, BODY], [0, 0, ROPE.crouch]),
  put([0, 0, BELL_OVER], [0, 0, LEGS.brace], [-1, 0, HEAVE], [0, 0, ROPE.yank], [0, 2, BOLT]),
];

export const BEAST: Beast = {
  code: 'M16',
  id: 'planetnik',
  kind: { pl: 'Płanetnik', en: 'Cloud-herder' },
  name: { pl: 'płanetnik z chmurą', en: 'the cloud-hauler' },
  note: {
    pl: 'Ciągnie chmurę na linie przez ramię. Gdy szarpnie, z chmury bije piorun tuż przed nim.',
    en: 'He hauls a storm cloud on a rope over his shoulder. When he yanks it, lightning strikes just in front of him.',
  },
  alt: [],
  w: 24,
  h: 32,
  view: 'side',
  ink: 'dark',
  outline: 0x141a28,
  pal: {
    w: 0xc8d0dc, // cloud, lit (the cloud he hauls and the cloud of his coat)
    W: 0x8a96aa,
    N: 0x4a5468, // cloud, its heavy belly
    c: 0x8494a8, // the coat
    C: 0x5e6c84,
    D: 0x3e4a5e,
    h: 0x6a707c, // hair and beard, wet
    H: 0x464c58,
    s: 0xccc0aa, // skin
    S: 0x8a8272,
    e: 0xfff4a0, // the eye, and the lightning
    r: 0xa88c60, // the rope
    k: 0x6a5440, // bast shoes
  },
  frames: { stand: STAND, walk: WALK, attack: ATTACK },
  nawia: {
    pal: {
      w: 0x8ad4ec, // the cold glow on every lit edge: the bell's and the coat of cloud's
      W: 0x3e5a78, // the bell
      N: 0x1e2a40,
      c: 0x6aaed0,
      C: 0x232c40,
      D: 0x161a28,
      h: 0x3a4456,
      H: 0x242a38,
      s: 0x9ab4c4,
      S: 0x50647a,
      e: 0xf0ffff,
      r: 0x8a9aa8,
      k: 0x2a2c38,
    },
    frames: { stand: NSTAND, walk: NWALK, attack: NATTACK },
    note: { pl: 'Na linie nie chmura, a milczący dzwon ze związanym sercem.', en: 'On the rope is no cloud but the silent bell, its clapper bound.' },
  },
};
