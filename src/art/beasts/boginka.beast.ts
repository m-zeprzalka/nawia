// M8: the boginka (boginka, mamuna), new. 16 x 24, drawn facing right.
//
// The idea: a water-hag who steals babies from their cradles and leaves her own changeling in their place;
// St John's wort keeps her off. She lives by the water and comes out of it at dusk.
//
// A bent old woman in wet grey rags, so stooped that her back is nearly level, the head hung low in
// front under matted hair, one yellow eye looking out; arms too long, the hands huge, hanging by the
// ground. On her back, tied in a linen bundle with a red sash across her chest the way village women
// carry their babies, is the child she has stolen: a small face peeking over her shoulder with her own
// yellow eyes, the first thing that is wrong about it.
//
// She hobbles: the body sinks and rises, the huge hand swings, the bundle bobs. She snatches: the claw
// goes up over her head, then the arm shoots out straight at you, the hand open to grab.
//
// Nawia: the same frames in Nawia's colours, and the truth of the bundle: it is not linen but wet weed,
// and the face in it is grey-green with glowing eyes: her own changeling, not a child of the village.
//
// Frames are written out whole: one letter one colour, '.' empty (see docs/HERO-DRAWING.md).

import type { Beast } from './beast.ts';

// stooped, the huge hand by the ground, the bundle on her back
const STAND = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '...llL..........',
  '..lefLL.........',
  '..xlfLLL........',
  '..lxlLLLahhh....',
  '...LxLLrhHhhhH..',
  '...aarrrhHhhhhh.',
  '..aarrrrhhhhhhh.',
  '..arrrrhtkhhkeh.',
  '.aarrrrrkKhhkKh.',
  '.arrrrrrhkKhhhh.',
  '.arrrRrrrkKh..h.',
  '.arrrRrrRRkK....',
  '.arRrrRrrRtkK...',
  '..arRrRrRtkkkK..',
  '..rkRr.RrkkKkKK.',
  '..dkKr..dkRk.kK.',
  '..tkK..tkK.K..K.',
  '.tkkK.tkkKK.....',
  '................',
];

// the hobble: sinking onto the near foot, the hand swung forward; rising, the hand swung back
const WALK = [
  // sinking, the hand forward
  [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '...llL..........',
    '..lefLL.........',
    '..xlfLLL........',
    '..lxlLLLa.hhh...',
    '...LxLLrrhHhhhH.',
    '...aarrrrhHhhhhh',
    '..aarrrrrhhhhhhh',
    '..arrrrrtkhhhkeh',
    '.aarrrrrkKhhhkKh',
    '.arrrrrrrkK.hhhh',
    '.arrrRrrrRkKh..h',
    '.arrrRrrRRkKh...',
    '.arRrrRrrRRkK...',
    '..arRrRrRrtkkkK.',
    '..rKRr.RrRkkKkKK',
    '.tdK.r..dtkKk.kK',
    'tkkK....tkKKK..K',
    '................',
  ],
  // rising, the hand back
  [
    '................',
    '................',
    '................',
    '................',
    '...llL..........',
    '..lefLL.........',
    '..xlfLLL........',
    '..lxlLLL........',
    '...LxLLaahhh....',
    '.....aarhHhhhH..',
    '...aarrrhHhhhhh.',
    '..aarrrrhhhhhhh.',
    '..arrrrhtkhhkeh.',
    '.aarrrrrkKhhkKh.',
    '.arrrrrrkKRhhhh.',
    '.arrrRrrrkKh..h.',
    '.arrrRrrRkKh....',
    '.arRrrRrrtkK....',
    '..arRrRrtkkkK...',
    '..r.Rr.RkkKkKK..',
    '..d.kr.kk.k.kK..',
    '...tkKtkK.K..K..',
    '..tkkKkkKK......',
    '................',
  ],
];

// the snatch
const ATTACK = [
  // wind-up: the claw over her head
  [
    '................',
    '...........k.k..',
    '..........kKkKk.',
    '..........tkkK..',
    '...........kK...',
    '...........kK...',
    '...llL....tk....',
    '..lefLL...kK....',
    '..xlfLLL.tk.....',
    '..lxlLLLakK.....',
    '...LxLLrtkh.....',
    '...aarrhkKhhH...',
    '..aarrrhHhhhhh..',
    '..arrrrhhhhhhh..',
    '.aarrrhhhhhkeh..',
    '.arrrrrhhhhkKh..',
    '.arrrRrhhRhhhh..',
    '.arrrRrrhRh..h..',
    '.arRrrRrrRh.....',
    '..arRrRrRrRK....',
    '..r.Rr.RrRR.....',
    '..dtkrtkd.R.....',
    '..tkkKkkKK......',
    '................',
  ],
  // the blow: the arm shot out, the hand open
  [
    '................',
    '................',
    '................',
    '................',
    '................',
    '...llL..........',
    '..lefLL.........',
    '..xlfLLL........',
    '..lxlLLLa.hhh...',
    '...LxLLrrhHhhhH.',
    '...aarrrrhHhhkhk',
    '..aarrrrrhhhkKkK',
    '..arrrrrtkkkkkkK',
    '.aarrrrrkKKKKkKK',
    '.arrrrrrrhh.kKkK',
    '.arrrRrrrRh.hK.K',
    '.arrrRrrRRR.h...',
    '.arRrrRrrRR.....',
    '..arRrRrRrR.....',
    '..rKRr.RrRRK....',
    '..dK.r..dkR.....',
    '.tkK.....tkK....',
    'tkkK....tkkKK...',
    '................',
  ],
];

export const BEAST: Beast = {
  code: 'M8',
  id: 'boginka',
  kind: { pl: 'Boginka', en: 'Boginka' },
  name: { pl: 'z cudzym dzieckiem na plecach', en: 'with a stolen child on her back' },
  note: {
    pl: 'Zgarbiona, w mokrych łachmanach, z ogromnymi dłońmi. Kuśtyka i chwyta jednym wyrzutem ręki.',
    en: 'Bent double in wet rags, with huge hands. She hobbles, and snatches with one throw of her arm.',
  },
  alt: [],
  w: 16,
  h: 24,
  view: 'side',
  pal: {
    a: 0x9a9c94, // wet grey rags, the light
    r: 0x6e726c, // the rags
    R: 0x484c4c, // the rags, the shadow
    t: 0xc8c49a, // sallow skin, the light
    k: 0x96946c, // skin: the arms, the huge hands, the shins
    K: 0x66664a, // skin, the shadow
    h: 0x2a302c, // matted wet hair
    H: 0x465046, // the hair, a lit strand
    e: 0xf0d060, // the yellow eyes: hers and the child's
    l: 0xe8e0c8, // the linen bundle
    L: 0xb0a890, // the bundle, the shadow
    x: 0xa83a3a, // the red sash
    f: 0xc89a88, // the child's face
    d: 0x9cc8d8, // drips
  },
  frames: { stand: STAND, walk: WALK, attack: ATTACK },
  nawia: {
    pal: {
      a: 0x7a9a98, // the rags, the cold rim of light
      r: 0x343a3e, // the rags
      R: 0x22262c, // the rags, the shadow
      t: 0x9ab8a4, // skin, the cold light
      k: 0x5e7468, // skin
      K: 0x3a4a44, // skin, the shadow
      h: 0x18201e, // the hair
      H: 0x2e4a40, // the hair, a lit strand
      e: 0xe8f880, // the eyes, glowing
      l: 0x3e5a3a, // the bundle: wet weed, not linen
      L: 0x283a26, // the weed, the shadow
      x: 0x6a2a3a, // the sash, dark
      f: 0x6a8a68, // the changeling's face, grey-green
      d: 0x7fd8d0, // drips, glowing
    },
    note: {
      pl: 'Tobołek to mokre zielsko, a buzia w nim szarozielona, z jej oczami: to jej odmieniec.',
      en: 'The bundle is wet weed, the face in it grey-green with her eyes: it is her own changeling.',
    },
  },
  ink: 'dark',
  outline: 0x1a1018,
};
