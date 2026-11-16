// M5: the drowned one (topielec), an alternative to P7 and to the game's frog-like utopiec (E1). 16 x 24.
//
// The idea: the soul of a drowned man who looks for someone to drown in his place. The folk tales say he
// takes the shape of an animal by the water to lure people close, and that under it he has scales and webs
// between his fingers.
//
// Jawia: a black cat on the bank, one tile tall at the bottom of the cell. It is innocent but for one thing:
// it is soaking wet (the fur clings, drips hang from the chin and the chest) and its eye is far too bright.
// It sits upright like a statue; it walks low, skinny, the wet tail dragging; it attacks with a crouch (the
// rump up, the tail lashing) and a pounce, stretched through the air with its mouth open.
//
// Nawia: his real shape, a tile and a half. A bloated, livid corpse standing waist-deep in a pool of black
// water that goes where he goes: the deep he drags you into. Wet hair hangs over his face, weed in it, one
// eye glowing through; the near arm hangs to the water, the hand spread on it with glowing webs. He glides
// (the body bobs, the head sways, the hand lifts off the water and drops back, the ripples move). He
// attacks by rearing up out of the water with both arms flung wide, then lunging forward and down, his
// head low and his arm plunging into the water in front of him in a splash: he grabs you and pulls you under.
//
// Frames are written out whole: one letter one colour, '.' empty (see docs/HERO-DRAWING.md).

import type { Beast } from './beast.ts';

// ------------------------------------------------------------------ Jawia: the cat

// sitting upright on the bank, the one eye too bright, drips under the chin and the chest
const CAT = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '..........K.....',
  '..........kK.K..',
  '.........lkkkk..',
  '.........kkkek..',
  '.........kkkkkk.',
  '..........kKKk..',
  '.........lkkKd..',
  '.........kkkkK..',
  '........lkkkkKd.',
  '......llkkkkkK..',
  '.....lkkkkKkkK..',
  '.k...kkkkKK.kK..',
  '.kkkkkkKKK..kKK.',
  '................',
];

// slinking low: near forefoot reaching, legs passing, pushing off, passing; the body rises a pixel as the legs pass
const CAT_WALK = [
  // reach
  [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '............K.K.',
    '............kKkK',
    '...l......lkkkkk',
    '..lkkllllkkkkkek',
    '.lkkkkkkkkkkkkkK',
    '.kkkkKkkkkkkkKd.',
    'k..kKK....kkKK..',
    'k..kK.....kK.k..',
    '..kK.K...K..k...',
    '.kK...K..K...kK.',
    '................',
  ],
  // passing
  [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '............K.K.',
    '............kKkK',
    '...l......lkkkkk',
    '..lkkllllkkkkkek',
    '.lkkkkkkkkkkkkkK',
    '.kkkkKkkkkkkkKd.',
    'k..kKK....kkKK..',
    '................',
    'k...kK....kK....',
    '....kK....kK....',
    '....kKK...kKK...',
    '................',
  ],
  // push off
  [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '............K.K.',
    '............kKkK',
    '...l......lkkkkk',
    '..lkkllllkkkkkek',
    '.lkkkkkkkkkkkkkK',
    '.kkkkKkkkkkkkKd.',
    'k..kKK....kkKK..',
    'k...Kk....Kk....',
    '....K.k..k.K....',
    '...KK..kkK..K...',
    '................',
  ],
  // passing
  [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '............K.K.',
    '............kKkK',
    '...l......lkkkkk',
    '..lkkllllkkkkkek',
    '.lkkkkkkkkkkkkkK',
    '.kkkkKkkkkkkkKd.',
    'k..kKK....kkKK..',
    '................',
    'k...Kk....Kk....',
    '....Kk....Kk....',
    '....KkK...KkK...',
    '................',
  ],
];

// the crouch (rump up, tail lashing, ears flat), then the pounce
const CAT_ATTACK = [
  // wind-up: the crouch
  [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '.k..............',
    '..k.............',
    '..klkl..........',
    '..kkkkllll..KKK.',
    '..kkkkkkkkklkkkK',
    '..kKkkkkkkkkkekk',
    '.kK.KKkkkkkkKkkK',
    '.kK..KK..KKkkK..',
    '................',
  ],
  // the blow: the pounce
  [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '...........K.K..',
    '..........lkKkK.',
    '...llwkkklkkkekk',
    'kklkkkkkkkkkkKwK',
    '..kkkKKkkkkkK.wk',
    '.KK.....kkK..kKK',
    'KK.......kK...kK',
    '..........K...K.',
    '................',
    '................',
    '................',
  ],
];

// ------------------------------------------------------------------ Nawia: the drowned man

// waist-deep in his pool, the hand spread on the water
const MAN = [
  '................',
  '................',
  '................',
  '........hhh.....',
  '.......hHHhh....',
  '......hHhhhhh...',
  '......hHhsSeh...',
  '......hHhSVShg..',
  '.....hHhhVV.hg..',
  '....thhghS..h...',
  '...othghSSV.G...',
  '....tsgtsSV.....',
  '...otssStsSS....',
  '....sssSSts.S...',
  '...ossssSSts....',
  '...tsssSSSSts...',
  '...ssssSSSSSts..',
  '...sSSSSSSSVtts.',
  '...SSSSSVVVtswS.',
  '.bbbobbbbbbbowoo',
  'obbbbbbbbbbbbbbb',
  '.BBBBBBBBBBBBBB.',
  '....BBBBBBBB....',
  '................',
];

// the glide: leaning in, the hand lifted; rising back, the hand down
const MAN_WALK = [
  // leaning in
  [
    '................',
    '................',
    '................',
    '................',
    '.........hhh....',
    '........hHHhh...',
    '.......hHhhhhh..',
    '.......hHhsSeh..',
    '.......hHhSVShg.',
    '......hHhhVV.hg.',
    '....tshhgh...h..',
    '...otshghSV..G..',
    '....tsstsSV.....',
    '...otssStsSS....',
    '....sssSSttsS...',
    '...ossssS..tts..',
    '...tsssSSSSStsS.',
    '...ssssSSSStswS.',
    '...sSSSSSSSVs.s.',
    'obbbbobbbbbbbbbo',
    'bbbbbbbbbbbbobbb',
    '.BBBBBBBBBBBBBB.',
    '....BBBBBBBB....',
    '................',
  ],
  // rising
  [
    '................',
    '................',
    '.......hhh......',
    '......hHHhh.....',
    '.....hHhhhhh....',
    '.....hHhsSeh....',
    '.....hHhSVShg...',
    '....hHhhVV.hg...',
    '....hhghsS.h....',
    '...ohghsSSVG....',
    '....tgstsSV.....',
    '...otssStsSS....',
    '....sssSSts.S...',
    '...ossssSSts....',
    '...tsssSSSSts...',
    '...ssssSSSSSts..',
    '...sSSSSSSSVtts.',
    '...SSSSSVVVtswS.',
    '...SSSSSVVVVV...',
    '.obbbbbobbbbbbo.',
    'obbbbbbbbbbbbbbo',
    '.BBBBBBBBBBBBBB.',
    '....BBBBBBBB....',
    '................',
  ],
];

// rearing up with the arms flung wide, then the lunge into the water
const MAN_ATTACK = [
  // wind-up: rearing up
  [
    '.......hhh......',
    '.s.s..hHHhh.....',
    'swswshHhhhhhV.V.',
    '.sssthHhsSehwVwV',
    '...sthHhSVShgSV.',
    '....sthhVV.hg...',
    '....hsth..Sh....',
    '....hgtssSVG....',
    '...otgstsSV.....',
    '....tsssSSV.....',
    '...otssSSSSS....',
    '....sssSSSSSS...',
    '...ossssSSSSV...',
    '...tsssSSSSSV...',
    '...ssssSSSSSV...',
    '...sSSSSSSSVV...',
    '...SSSSSVVVVV...',
    '...SSSSSVVVVV...',
    '...SSSSSVVVVV...',
    'obbbbbobbbobbbbo',
    'bbobbbbbbbbbbobb',
    '.BBBBBBBBBBBBBB.',
    '....BBBBBBBB....',
    '................',
  ],
  // the blow: hands into the water
  [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '..........hhh...',
    '.........hHHhh..',
    '........hHhhhhh.',
    '........hHhsSeh.',
    '....tssshHhSVShg',
    '...otsshHhhVV.hg',
    '....tsstsgh...h.',
    '...otsshtsSS..G.',
    '....sssSgtsSS...',
    '...ossssSStsV...',
    '...tsssSSSSts.o.',
    '...ssssSSSSSto.o',
    '...sSSSSSSSVots.',
    '.bbbobbbbbbobwob',
    'obbbbbbbbbbbbbbb',
    '.BBBBBBBBBBBBBB.',
    '....BBBBBBBB....',
    '................',
  ],
];

export const BEAST: Beast = {
  code: 'M5',
  id: 'topielec-b',
  kind: { pl: 'Topielec', en: 'Drowned one' },
  name: { pl: 'kot znad wody', en: 'the cat from the water' },
  note: {
    pl: 'W Jawi mokry czarny kot na brzegu, z okiem za jasnym. Skrada się i skacze.',
    en: 'In Jawia a wet black cat on the bank, its eye too bright. It slinks and pounces.',
  },
  alt: ['P7', 'E1'],
  w: 16,
  h: 24,
  view: 'side',
  pal: {
    k: 0x2e2b38, // wet black fur
    K: 0x211e29, // the fur, the shadow
    l: 0x55607a, // the sheen of the wet fur
    w: 0xa9c4d0, // a glint of water on the fur; the teeth
    d: 0x8fc0d0, // drips
    e: 0xeaffb0, // the eye, too bright
  },
  frames: { stand: CAT, walk: CAT_WALK, attack: CAT_ATTACK },
  nawia: {
    pal: {
      t: 0xc0d0cc, // livid skin, the light
      s: 0x8ea4ac, // skin
      S: 0x5e7088, // skin, the shadow
      V: 0x3a3c5c, // skin, the deepest shadow
      h: 0x1c2826, // wet hair
      H: 0x2e4a40, // wet hair, a lit strand
      g: 0x3f6e48, // weed in the hair
      G: 0x8fe0a0, // weed, glowing
      e: 0xf0fff8, // the eye, a cold light
      w: 0x4fb0a8, // the webs between the fingers, glowing
      b: 0x2a4a62, // the black water
      B: 0x1c2c40, // the black water, deep
      o: 0x8fe0c8, // ripples, cold light
    },
    frames: { stand: MAN, walk: MAN_WALK, attack: MAN_ATTACK },
    note: {
      pl: 'Topielec po pas w czarnej wodzie: rozdęty, z błonami między palcami. Wznosi ręce i wciąga w głąb.',
      en: 'The drowned man waist-deep in black water, bloated, webbed hands. He rears up and drags you under.',
    },
  },
  ink: 'dark',
  outline: 0x1a1018,
};
