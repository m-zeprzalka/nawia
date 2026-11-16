// M5: the drowned one (topielec), an alternative to P7 and to the game's frog-like utopiec (E1). 16 x 24.
//
// The idea: the soul of a drowned man who looks for someone to drown in his place. The folk tales say he
// takes the shape of an animal by the water to lure people close, and that under it he has scales and webs
// between his fingers.
//
// Jawia (where it fights): a black cat on the bank, one tile tall at the bottom of the cell. It is innocent but
// for two things: it is soaking wet (the fur clings, drips hang from the chin and the chest, the wet fur shines
// cold along its back, head and tail where the light from the upper left catches it, which is also what keeps
// it from vanishing on dark flagstones) and its eye is far too bright.
//   stand    sitting upright like a statue;
//   walk     slinking low, skinny, the head carried below the shoulders, the wet tail hanging: the near legs
//            reach (the body a row lower), pass under it (a row higher), the far legs reach, pass;
//   wind-up  down on its chest, the rump up, the tail thrown up high and lashing, the ears flat, the eye
//            flaring white: a tall spike over a flat body, unlike anything in the walk;
//   blow     the pounce, stretched across the cell in the air, the forepaws out, the mouth open on its teeth;
//   recover  landed sprawled, chest and chin on the ground, the forepaws splayed out in front: the opening;
//   hurt     thrown back on its haunches, the spine arched high, the ears flat, the mouth open in a hiss.
// The line is drawn only on the shadow side ('rim'), so the thin legs keep the ground showing between them.
//
// Nawia: his real shape, a tile and a half, seen from there only as an echo, so it is built on strong
// contrast: a bloated, livid corpse standing waist-deep in a pool of black water that goes where he goes (the
// deep he drags you into), cold ripples round it. Wet hair hangs over his face, weed in it, one eye glowing
// through; the near arm hangs to the water, the hand spread on it with glowing webs.
//   walk     the glide: he leans in and sinks (the hand lifted off the water), passes, rises (the hand down on
//            the water), passes with the head swaying the other way; the ripples move;
//   wind-up  rearing up out of the water with both arms flung wide, the eye blazing;
//   blow     the lunge forward and down, his arm plunging into the water in front of him in a splash;
//   recover  sunk forward to the shoulders, the head hanging over the water, the eye gone dim;
//   hurt     thrown back, the head snapped back so the hair falls off a livid face with its mouth open, the
//            water splashing up round him.
//
// Frames are written out whole: one letter one colour, '.' empty (see docs/HERO-DRAWING.md).

import type { Beast } from './beast.ts';

// ------------------------------------------------------------------ Jawia: the cat

// sitting upright on the bank like a statue, the one eye too bright, drips under the chin and the chest
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
  '..........L.....',
  '..........kL.L..',
  '.........Lkkkk..',
  '.........kkkek..',
  '.........lkkkkk.',
  '..........kKKk..',
  '.........Lkkkd..',
  '.........lkkkK..',
  '........Lkkkkkd.',
  '......LLkkkkkK..',
  '.....Lkkkkkkkk..',
  '.L...lkkkKK.kK..',
  '.lLLLlkKKK..kKK.',
  '................',
];

// the near fore reaches, the near hind pushes off
const W1 = [
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
  '.......LL.......',
  '..LLLLLkkL...L.L',
  '.Lkkkkkkkkl.LkLk',
  'lkkkkkkkkkkLkkkk',
  'k.kKKKKKkkkkkekk',
  'k.kK....kK..kKKd',
  'K.k.K...K.k.....',
  '.k...K..K..k....',
  '................',
];

// the near legs pass under it, the body a row higher
const W2 = [
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
  '.......LL.......',
  '..LLLLLkkL...L.L',
  '.Lkkkkkkkkl.LkLk',
  'lkkkkkkkkkkLkkkk',
  'k.kKKKKKkkkkkekk',
  'k.kK....kK..kKK.',
  'K..k.K...kK...d.',
  '....kK...Kk.....',
  '.....K...K......',
  '................',
];

// the far fore reaches, the far hind pushes off
const W3 = [
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
  '.......LL.......',
  '..LLLLLkkL...L.L',
  '.Lkkkkkkkkl.LkLk',
  'lkkkkkkkkkkLkkkk',
  'k.kKKKKKkkkkkekk',
  'k.kK....kK..kKKd',
  'K.K.k...k.K.....',
  '.k...k..k..K....',
  '................',
];

// the far legs pass under it
const W4 = [
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
  '.......LL.......',
  '..LLLLLkkL...L.L',
  '.Lkkkkkkkkl.LkLk',
  'lkkkkkkkkkkLkkkk',
  'k.kKKKKKkkkkkekk',
  'k.kK....kK..kKK.',
  'K..K.k...Kk.....',
  '....Kk...kK...d.',
  '.....k...k......',
  '................',
];

// slinking low, the head carried below the shoulders: the near legs reach (the body a row lower), pass under it
// (a row higher), the far legs reach, pass
const CAT_WALK = [W1, W2, W3, W4];

// the wind-up: down on its chest, the rump up, the tail lashing high, the ears flat, the eye flaring white
const CROUCH = [
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
  '.L..............',
  '.kL.............',
  '..k.............',
  '.Lk.............',
  '.k..............',
  '.kL.LL..........',
  '..LkkkLL........',
  '..kkkkkkLLL.....',
  '..kkkkkkkkkLL.L.',
  '..KkkkkkkkkkkLkL',
  '..kK.KkkkkkkkEEk',
  '..kK..KKkkKkKKK.',
  '..kk..KK.kkKK...',
  '................',
];

// the blow: the pounce, stretched through the air, the forepaws out, the mouth open
const POUNCE = [
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
  '...........L.L..',
  '...LLLLLL.LkLk..',
  '.Llkkkkkkkkkkkkk',
  'Lk.KkkkkkkkkkekK',
  'K...KKkkkkkKkMMw',
  '...KK...KkkK.kKw',
  '..KK......Kk..k.',
  '.K..........kw..',
  '................',
  '................',
  '................',
];

// the recovery: landed sprawled, chest and chin on the ground, the forepaws splayed out in front
const LANDED = [
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
  '................',
  '...LLL..........',
  '.LLkkkLLLL......',
  'Lk.KkkkkkkLL.L..',
  'k...KKkkkkkkLkL.',
  'K.KKk.KKkkkkkkkk',
  '.kK.....KkKkklkK',
  'kK.......kwkKKwk',
  '................',
];

// the flinch: thrown back on its haunches, the spine arched, the ears flat, the mouth open in a hiss
const HISS = [
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
  '.....LLLL.......',
  '....LkkkkL......',
  '.L.Lkkkkkkl.....',
  '.kLkkKKKkkkL.L..',
  '..kkK...KkkLkLk.',
  '.LkK.....kkkkkk.',
  '.kK......KkEkMw.',
  '.k.......KkkMMwd',
  '.k......kK.KKw..',
  '..K....k..K.....',
  '.kK...kK..kK....',
  '................',
];

const CAT_ATTACK = [CROUCH, POUNCE, LANDED];

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

// the glide: he leans in and sinks, passes, rises, passes; the hand lifts off the water and drops back, the ripples move
const MAN_WALK = [
  // leaning in, the hand lifted off the water (the body lowest)
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
    '...ssssSSSSStswS',
    '...sSSSSSSSVs.s.',
    'obbbbobbbbbbbbbo',
    'bbbbbbbbbbbbobbb',
    '.BBBBBBBBBBBBBB.',
    '....BBBBBBBB....',
    '................',
  ],
  // passing, the ripples running back
  [
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
    '.bbbbbbobbbbbwoo',
    'obbbbbbbbbbobbbb',
    '.BBBBBBBBBBBBBB.',
    '....BBBBBBBB....',
    '................',
  ],
  // rising back, the hand down on the water (the body highest)
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
    '.obbbbbbbobbbbo.',
    'obbbbbbbbbbbbbbo',
    '.BBBBBBBBBBBBBB.',
    '....BBBBBBBB....',
    '................',
  ],
  // passing, the head swaying the other way
  [
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
    '.obbbobbbbbbbwob',
    'bbbbbbbbobbbbbbo',
    '.BBBBBBBBBBBBBB.',
    '....BBBBBBBB....',
    '................',
  ],
];

// he rears up, plunges, and is left sunk forward in his pool
const MAN_ATTACK = [
  // wind-up: rearing up out of the water, both arms flung wide, the eye blazing
  [
    '.......hhh......',
    '.s.s..hHHhh.....',
    'swswshHhhhhhV.V.',
    '.sssthHheeehwVwV',
    '...sthHhSeShgSV.',
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
  // the blow: the lunge, his arm plunging into the water in front of him
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
  // the recovery: sunk forward to the shoulders, the head hanging over the water, the eye gone dim
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
    '...........hhh..',
    '..........hHHhh.',
    '....tsss.hHhhhhh',
    '...otsshhHhSShhg',
    '....tssthHhSVhg.',
    '...ossssgthSSh.G',
    '...tsssSSStsSh..',
    '.bbbobbbbbbbobob',
    'obbbbbbbbbbbbbbb',
    '.BBBBBBBBBBBBBB.',
    '....BBBBBBBB....',
    '................',
  ],
];

// the flinch: thrown back, the head snapped back so the hair falls off the face, the water splashing up round him
const MAN_HURT = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '...hhh..........',
  '..hHhhtt........',
  '..hHhtVtt.......',
  '.hhh.ttVVt......',
  '.hh..tSSt.......',
  '.h..ts..........',
  '...otsS.........',
  '...tssSS........',
  '..otsssSS.......',
  '...sssSSSS......',
  '..osssSSSSSs....',
  '..tsssSSSSSts...',
  'o.ssssSSSSSVts.o',
  '.osSSSSSSVVVtwo.',
  'obbbobbbbbbbbbob',
  'bbbbbbbbbbbbbbbb',
  '.BBBBBBBBBBBBBB.',
  '....BBBBBBBB....',
  '................',
];

export const BEAST: Beast = {
  code: 'M5',
  id: 'topielec-b',
  kind: { pl: 'Topielec', en: 'Drowned one' },
  name: { pl: 'kot znad wody', en: 'the cat from the water' },
  note: {
    pl: 'W Jawi mokry czarny kot na brzegu, z okiem za jasnym. Skrada się z łbem nisko, przypada z ogonem w górze i skacze; trafiony prycha z wygiętym grzbietem.',
    en: 'In Jawia a wet black cat on the bank, its eye too bright. It slinks head low, crouches with its tail up and pounces; struck, it arches and hisses.',
  },
  alt: ['P7', 'E1'],
  w: 16,
  h: 24,
  view: 'side',
  pal: {
    k: 0x2e2b38, // wet black fur
    K: 0x1c1a24, // the fur, the shadow
    l: 0x4e5874, // the sheen of the wet fur
    L: 0x8798b6, // the wet fur where the light catches it (the top and the left)
    w: 0xc4d8e0, // the teeth, the claws
    d: 0x8fc0d0, // drips
    e: 0xeaffb0, // the eye, too bright
    E: 0xffffff, // the eye flaring
    M: 0x8a2c3c, // the mouth
  },
  frames: { stand: CAT, walk: CAT_WALK, attack: CAT_ATTACK, hurt: HISS },
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
    frames: { stand: MAN, walk: MAN_WALK, attack: MAN_ATTACK, hurt: MAN_HURT },
    ink: { ink: 'dark', outline: 0x1a1018 },
    note: {
      pl: 'Topielec po pas w czarnej wodzie: rozdęty, z błonami między palcami. Wznosi ręce, wciąga w głąb i zostaje zanurzony po barki.',
      en: 'The drowned man waist-deep in black water, bloated, webbed hands. He rears up, drags you under and is left sunk to the shoulders.',
    },
  },
  ink: 'rim',
  outline: 0x1a1018,
};
