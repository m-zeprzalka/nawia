// M1: a wolf of the Rojsty marshes (24 x 16), in place of P4, P5 and E6.
//
// The idea: a starved, wet wolf that hunts with its head below its back. Lean and long in the leg, a dark
// soaked saddle over the shoulders with the hackles standing up in tufts, the belly tucked up behind the ribs,
// wet fur hanging off it in strands, a tail hanging low like a wet brush, mud on the paws. The head is a
// narrow wedge with a pale muzzle and one amber eye that is only a light.
// It moves at a trot, a real one: the diagonal pairs swing together (near fore with far hind, then far fore
// with near hind), the body a row lower when the legs reach and a row higher when they pass under it.
// It attacks with a crouch (haunches down, hackles up, lips off the teeth) and then a lunge: stretched out,
// forelegs off the ground, the jaws open.
// In Nawia it is what is left of a wolf that died in the bog: dark fur with a cold light along its back and
// hackles, the ribs showing through the flank, bone for a muzzle, a white eye. Its ribs are drawn in Jawia
// too, in the fur's own colours (q, r, R), so they only show when the world shifts.
//
// Composed from parts (see docs/HERO-DRAWING.md, part 4): the body is one drawing, laid over a set of legs per
// walk frame; the crouch and the lunge are whole frames.

import type { Beast } from './beast.ts';

const W = 24;
const H = 16;

/** Lays parts over each other: each part's rows go `y` rows down and `x` columns right; '.' lets what is under it show. */
function stack(...parts: [x: number, y: number, rows: string[]][]): string[] {
  const g = Array.from({ length: H }, () => Array<string>(W).fill('.'));
  for (const [x0, y0, rows] of parts)
    rows.forEach((r, y) =>
      [...r].forEach((ch, x) => {
        const tx = x + x0;
        const ty = y + y0;
        if (ch !== '.' && tx >= 0 && tx < W && ty >= 0 && ty < H) g[ty][tx] = ch;
      }),
    );
  return g.map((r) => r.join(''));
}

// the body standing: rows 0-11 of the cell (the tail hangs to row 11); the legs below row 9 are drawn per frame
const BODY = [
  '........................',
  '...........S.S..........',
  '..........ssSss.........',
  '.....SSSSsssssss........',
  '...tlffSsssssssss.S.....',
  '..tt.lffsqsqsqsssSs.....',
  '..tt.lfffrfrfrlFFsls....',
  '.ttT.ffFRFRFRFfFFffell..',
  '.tT..fFFFF.F.FfFFfpfffk.',
  '.tT...FFF.....fF.Fppp...',
  '.T......................',
  '.T......................',
];

// legs, rows 10-14 of the cell: near legs f, far legs d
const LEGS = {
  stand: [
    '.......f..d...fFd.......',
    '......f..d....f.d.......',
    '......f..d....f.d.......',
    '......f..d....f.d.......',
    '......mm.dd...mmdd......',
  ],
  // near fore and far hind reach forward, the other pair pushes back (the body a row lower)
  reachA: [
    '.......f.d....f.........',
    '......f..d....df........',
    '.....f....d..d..f.......',
    '....f.....d..d...f......',
    '...mm.....dd.d....mm....',
  ],
  // near fore and far hind carry him; the far fore and the near hind are lifted, swinging forward
  passA: [
    '.......f.d....fd........',
    '......f..d....f.d.......',
    '.......f.d....fd........',
    '.........d....f.........',
    '.........dd...mm........',
  ],
  // far fore and near hind reach forward, the other pair pushes back (the body a row lower)
  reachB: [
    '.......fd.....f.........',
    '.......df.....fd........',
    '......d..f...f..d.......',
    '.....d...f...f...d......',
    '....dd...mm.m.....dd....',
  ],
  // far fore and near hind carry him; the near fore and the far hind are lifted, swinging forward
  passB: [
    '.......fd.....df........',
    '.......fd.....d.f.......',
    '.......f.d....df........',
    '.......f......d.........',
    '.......mm.....dd........',
  ],
};

const STAND = stack([0, 10, LEGS.stand], [0, 0, BODY]);
const WALK = [
  stack([0, 10, LEGS.reachA], [0, 1, BODY]),
  stack([0, 10, LEGS.passA], [0, 0, BODY]),
  stack([0, 10, LEGS.reachB], [0, 1, BODY]),
  stack([0, 10, LEGS.passB], [0, 0, BODY]),
];

// the wind-up: haunches down, front braced, hackles up, the lip off the teeth
const CROUCH = [
  '........................',
  '........................',
  '............S.S.........',
  '...........ssSss........',
  '.......SSSSsssssS.......',
  '.....SSsssssssssss......',
  '...tlffsqsqsqssssfS.....',
  '..tlffffrfrfrFFFsSs.....',
  '.tT.fffRFRFRFfFFFsll....',
  '.tTffFFF.F.F.fFFfsfell..',
  '.T.FffFF.....fFF.FfMMwk.',
  '...FffF.d....f.d.Fppw...',
  '....fF..d.....f.d.......',
  '....f...d......f.d......',
  '....mm..mm.....mm.mm....',
  '........................',
];

// the bite: stretched out, forelegs off the ground, the jaws open
const LUNGE = [
  '........................',
  '..........S.S...........',
  '.........ssSss.....S....',
  '...SSSSSsssssss.ssSsll..',
  '.ttlffSsqsqsqsssFsffell.',
  '...Tlfffrfrfrfl.FFffffk.',
  '....ffFFRFRFRfFFFFFMMw..',
  '....fFFF.F.F.fFFFMMw....',
  '...ffFF......fFF.pppp...',
  '...ff.d.......ffd.......',
  '..ff..d........ffd......',
  '..f..d...........fd.....',
  '.f...d............fm....',
  '.f...m..............m...',
  '.mm.....................',
  '........................',
];

export const BEAST: Beast = {
  code: 'M1',
  id: 'wilk-b',
  kind: { pl: 'Wilk', en: 'Wolf' },
  name: { pl: 'wilk z Rojstów', en: 'marsh wolf' },
  note: {
    pl: 'Chudy, łeb nisko, zjeżony kark. Kłusuje, przysiada i rzuca się do gardła. W Nawii widać mu żebra i kość pyska.',
    en: 'Lean, head low, hackles up. It trots, crouches and lunges for the throat. In Nawia its ribs and its muzzle bone show.',
  },
  alt: ['P4', 'P5', 'E6'],
  w: W,
  h: H,
  view: 'side',
  pal: {
    k: 0x1a1018, // the line, the nose
    s: 0x3a3236, // the wet saddle and hackles
    S: 0x5a5050, // the saddle, where the light catches it
    l: 0xa09484, // fur, the light
    f: 0x7a7066, // fur
    F: 0x524a4a, // fur, the shadow
    r: 0x7a7066, // the ribs under the fur, the saddle and the belly: fur here, bone in Nawia
    q: 0x3a3236,
    R: 0x524a4a,
    d: 0x3a3238, // the far legs
    p: 0xc2b69e, // the pale muzzle and jaw
    e: 0xf0c848, // the eye
    t: 0x6a6058, // the tail
    T: 0x3a3236,
    M: 0x6e2430, // the mouth
    w: 0xe8e0cc, // the teeth
    m: 0x3e3028, // bog mud on the paws
  },
  frames: { stand: STAND, walk: WALK, attack: [CROUCH, LUNGE] },
  ink: 'dark',
  outline: 0x1a1018,
  nawia: {
    note: { pl: 'Martwy wilk z bagna: ciemne futro, zimne światło na karku, świecące żebra, kość zamiast pyska.', en: 'A wolf dead in the bog: dark fur, cold light on its hackles, glowing ribs, bone for a muzzle.' },
    pal: {
      k: 0x0a0816,
      s: 0x2a2846,
      S: 0x5ec8d0, // the hackles and the back carry the cold light
      l: 0x7ad8d8,
      f: 0x3c3a62,
      F: 0x2a2848,
      d: 0x22203c,
      m: 0x22203c,
      p: 0xb8d8d0, // the muzzle is bone
      e: 0xe8ffff,
      t: 0x3c3a62,
      T: 0x2a2848,
      r: 0x8ccfc8, // the ribs
      q: 0x8ccfc8,
      R: 0x8ccfc8,
    },
    ink: { ink: 'dark', outline: 0x0a0816 },
  },
};
