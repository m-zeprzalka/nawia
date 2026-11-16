// M7: the rusalka (rusałka), new. 16 x 24, drawn facing right.
//
// The idea: the soul of a girl who died before her wedding. Rusalki come out of the water in the Rusalka
// week, swing on willows and birches and dance in rings; whoever they catch they tickle to death.
//
// Jawia: she cannot be seen. All there is of her is her wreath of wilted flowers floating at the height of
// a head, the cold glint of her eye, drips falling from a hem that is not there and wet prints on the
// grass where her toes touch. No line: there is nothing to line.
//
// Nawia: a pale girl in a wet white shift, her dark green hair loose and hanging to her knees, a strand
// over her face, one eye a cold light; her arms are too long, the fingers hanging to her knees. She does
// not walk, she dances: gliding on her toes she turns as she goes (her side, her back, her side, her face),
// her hands held out as if holding the hands of the others in the ring, ahead of her and behind. She
// attacks by swaying back with her arms drawn behind her, then lunging flat out at you, both arms
// stretched, the long fingers reaching, the hair streaming back: her touch is the tickling.
//
// Frames are written out whole: one letter one colour, '.' empty (see docs/HERO-DRAWING.md).

import type { Beast } from './beast.ts';

// ------------------------------------------------------------------ Jawia: only the wreath, the eye, the water

const STAND = [
  '................',
  '.......yLf......',
  '......L...fL....',
  '................',
  '..........e.....',
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
  '.............d..',
  '.........q.q....',
  '................',
];

const WALK = [
  // her side, the hand ahead
  [
    '.......yLf......',
    '......L...fL....',
    '................',
    '..........e.....',
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
    '.............d..',
    '................',
    '................',
    '................',
  ],
  // her back
  [
    '................',
    '......LfLy......',
    '.....L....Lf....',
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
    '................',
    '................',
    '..............d.',
    '.......q..q.....',
    '................',
  ],
  // her side, the hand behind
  [
    '.......yLf......',
    '......L...fL....',
    '................',
    '..........e.....',
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
    '.............d..',
    '................',
    '................',
    '................',
  ],
  // her face
  [
    '................',
    '......yLfL......',
    '.....L....fL....',
    '................',
    '......e..e......',
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
    '..............d.',
    '.......q..q.....',
    '................',
  ],
];

const ATTACK = [
  // swaying back
  [
    '................',
    '......yLf.......',
    '.....L...fL.....',
    '................',
    '.........e......',
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
    '.............d..',
    '.........q.q....',
    '................',
  ],
  // the lunge
  [
    '................',
    '................',
    '................',
    '.........yLf....',
    '........L...fL..',
    '................',
    '............e...',
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
    '..........d.....',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
];

// ------------------------------------------------------------------ Nawia: the girl

// standing on her toes, the arm hanging, the long fingers to her knees
const N_STAND = [
  '................',
  '.......yLf......',
  '......LHhhfL....',
  '......Hhhttt....',
  '.....Hhhhtes....',
  '.....Hhhhssh....',
  '.....HhhhSsh....',
  '.....Hhhh.sh....',
  '.....Hhhbbch....',
  '.....Hhhbbcts...',
  '.....Hhhbbcts...',
  '.....HhhbcBts...',
  '.....HhhbcBts...',
  '.....HhhbbcBs...',
  '.....HhbbccBsS..',
  '.....HhbbcccBsS.',
  '.....H.bbccccBsS',
  '....H.bbbcccBB.S',
  '....H.bbccccBB..',
  '......bbcccBBB..',
  '......bBcBccBB..',
  '.......B.cB.Bd..',
  '.........s.s....',
  '................',
];

// the dance: gliding on her toes she turns as she goes, holding the hands of a ring that is not there
const N_WALK = [
  // her side, the hand held ahead
  [
    '.......yLf......',
    '......LHhhfL....',
    '......Hhhttt....',
    '.....Hhhhtes....',
    '.....Hhhhssh....',
    '.....HhhhSsh....',
    '.....Hhhh.sh....',
    '.....Hhhbbch....',
    '.....Hhhbbts....',
    '.....Hhhbbcts...',
    '.....HhhbcBBts..',
    '.....HhhbcBB.tsS',
    '.....HhhbbcB..S.',
    '.....HhbbccBB...',
    '.....HhbbcccBB..',
    '.....H.bbccccB..',
    '....H.bbbcccBB..',
    '....H.bbccccBB..',
    '......bbcccBBB..',
    '......bBcBccBB..',
    '.......B.cB.Bd..',
    '.........s.s....',
    '................',
    '................',
  ],
  // her back: the hair a curtain, the shift fanning out
  [
    '................',
    '......LfLy......',
    '.....LhhhhLf....',
    '.....hHhhhhh....',
    '.....hHhhhhh....',
    '....hHhhhhhhh...',
    '....hHhhhhhhh...',
    '...shHhhhhhhhS..',
    '..ts.hHhhhhhh.sS',
    '.ts..hHhhhhhh..S',
    'ts...hhHhhhhh...',
    's....hhHhhhhh...',
    '.....hhHhhhhhh..',
    '....bhhHhhhhhhB.',
    '....bhhhHhhhhhB.',
    '...bbhhhHhhhhhBB',
    '...bbchhhHhh.hBB',
    '..bbccch.h.h.cBB',
    '..bbcccccccccBBB',
    '...bbcccccccBBB.',
    '...bBbcBcccBcBB.',
    '....B.Bc..cB.Bd.',
    '.......s..s.....',
    '................',
  ],
  // her side, the hand held behind
  [
    '.......yLf......',
    '......LHhhfL....',
    '......Hhhttt....',
    '.....Hhhhtes....',
    '.....Hhhhssh....',
    '.....HhhhSsh....',
    '.....Hhhh.sh....',
    '.....Hhhbbch....',
    '.....HhhbtsB....',
    '.....HhhtscB....',
    '.....HhtscBB....',
    '.....HtsbcBB....',
    '....StsHbbcB....',
    '...S.HhbbccBB...',
    '.....HhbbcccBB..',
    '.....H.bbccccB..',
    '....H.bbbcccBB..',
    '....H.bbccccBB..',
    '......bbcccBBB..',
    '......bBcBccBB..',
    '.......B.cB.Bd..',
    '.........s.s....',
    '................',
    '................',
  ],
  // her face, both arms out
  [
    '................',
    '......yLfL......',
    '.....LhhhhfL....',
    '.....hhttthh....',
    '.....hetteh.....',
    '....hhssssh.....',
    '....hhhSShhh....',
    '....hh.ss.hh....',
    '...shhbbbchhs...',
    '..ts.hbbbcch.sS.',
    '.ts..hbbbcch..sS',
    'ts...hbbccBh...S',
    's....hbbccBh....',
    '.....hbbccBBh...',
    '....hbbbcccBh...',
    '....hbbbcccBBh..',
    '....hbbccccBBh..',
    '...h.bbccccBB.h.',
    '...h.bbccccBB...',
    '....bbbcccBBBB..',
    '....bBbcBccBcB..',
    '.....B.Bc.cB.Bd.',
    '.......s..s.....',
    '................',
  ],
];

// swaying back with the arms drawn behind her, then lunging flat out, the fingers reaching
const N_ATTACK = [
  // wind-up: swaying back
  [
    '................',
    '......yLf.......',
    '.....LHhhfL.....',
    '.....Hhhttt.....',
    '....Hhhhtesh....',
    '....Hhhhsssh....',
    '....HhhhSsh.....',
    '....Hhhh.sh.....',
    '....Hhhbbch.....',
    '....HhhbbcB.....',
    '...sHhhbbcB.....',
    '...tsHhbcBB.....',
    '..ts.HhbcBB.....',
    '.Sts.HhbbcBB....',
    'S.s..HhbbccBB...',
    '.S.S.HhbbcccBB..',
    '.....H.bbccccB..',
    '....H.bbbcccBB..',
    '....H.bbccccBB..',
    '......bbcccBBB..',
    '......bBcBccBB..',
    '.......B.cB.Bd..',
    '.........s.s....',
    '................',
  ],
  // the blow: the lunge
  [
    '................',
    '................',
    '................',
    '.........yLf....',
    '........LHhhfL..',
    '.Hh.....hhhttt..',
    '..Hhhh.hhhhtes..',
    '...Hhhhhhhhsss..',
    '.HhhhhhhhhhSs..t',
    '..Hh.hhhbbbttsss',
    '...HhhhbbbcB...S',
    '.....HbbbccBsSSs',
    '....HbbbccccBB.S',
    '...HbbbcccccB...',
    '..HbbbcccccBB...',
    '..bbbcccccBB....',
    '.bbccccccBBB....',
    '.bBcccBccBB.....',
    '..BcBccBBBd.....',
    '...B.cB.B.......',
    '......s.s.......',
    '................',
    '................',
    '................',
  ],
];

export const BEAST: Beast = {
  code: 'M7',
  id: 'rusalka',
  kind: { pl: 'Rusałka', en: 'Rusalka' },
  name: { pl: 'tańcząca w kole', en: 'the one dancing in the ring' },
  note: {
    pl: 'W Jawi niewidzialna: tylko wianek w powietrzu, błysk oka i mokre ślady stóp.',
    en: 'In Jawia unseen: only a wreath in the air, the glint of an eye and wet footprints.',
  },
  alt: [],
  w: 16,
  h: 24,
  view: 'side',
  pal: {
    L: 0x3a6a54, // the leaves of the wreath
    f: 0xd8c070, // the wreath: a yellow flower
    y: 0xb04858, // the wreath: a red flower
    e: 0xe0fff8, // the glint of the eye
    d: 0x9fd8e0, // drips
    q: 0x3f7434, // wet prints on the grass
  },
  frames: { stand: STAND, walk: WALK, attack: ATTACK },
  nawia: {
    pal: {
      t: 0xd4e4dc, // pale skin, the light
      s: 0xa4bcb4, // skin
      S: 0x6e8488, // skin, the shadow
      b: 0xf0f0e6, // the white shift, the light
      c: 0xccd0d0, // the shift
      B: 0x9498b0, // the shift, the cold shadow
      h: 0x24463c, // dark green hair
      H: 0x3a6a54, // the hair, the light
      L: 0x3a6a54, // the leaves of the wreath
      f: 0xd8c070, // the wreath: a yellow flower
      y: 0xb04858, // the wreath: a red flower
      e: 0xe0fff8, // the eye, a cold light
      d: 0x9fd8e0, // drips
    },
    frames: { stand: N_STAND, walk: N_WALK, attack: N_ATTACK },
    ink: { ink: 'dark', outline: 0x1a1018 },
    note: {
      pl: 'Blada dziewczyna we włosach do kolan. Tańczy, wirując; rzuca się z długimi palcami, by załaskotać.',
      en: 'A pale girl, hair to her knees. She dances, turning; she lunges with long fingers to tickle you.',
    },
  },
  ink: 'none',
};
