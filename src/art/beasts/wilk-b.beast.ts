// M1: a wolf of the Rojsty marshes (24 x 16), in place of P4, P5 and E6.
//
// The idea: a starved, wet wolf that hunts with its head below its back. Lean and long in the leg, a dark
// soaked saddle over the shoulders with the hackles standing up in tufts, the belly tucked up behind the ribs,
// wet fur hanging off it in strands, a tail hanging low like a wet brush, mud on the paws. The head is a
// narrow wedge with a pale muzzle and one amber eye that is only a light. Light from the upper left: the top
// of the back and the haunch carry it, the far legs are a shade darker than the near ones.
//
// Frames:
//  - stand, and the trot in four: the diagonal pairs swing together (near fore with far hind, then far fore
//    with near hind), the body a row lower when the legs reach, the tail swinging back as it drops; the hind
//    legs bend back at the hock;
//  - the wind-up: pressed down and coiled, haunches low, the hackles bristling up into a ridge, the tail out
//    stiff behind, the head thrust low and forward with the lips off the teeth and the eye flaring white;
//  - the blow: the lunge for the throat, stretched out off the ground, the hind legs still pushing off, the
//    forelegs reaching, the head up and the jaws wide;
//  - the recovery: landed short and skidding, the rump still high, the forelegs braced out in front, the head
//    down by the paws and the eye gone dull: the opening for the hero;
//  - hurt: a yelp: thrown back onto its haunches, the hind legs buckling, the tail tucked, the head snapped up
//    with the mouth open and the eye squeezed shut.
// In Nawia it is what is left of a wolf that died in the bog: the same frames, the fur a dusk blue a little
// lighter than the floor so the shape stands off it, a cold light along its back and hackles, the ribs showing
// through the flank, bone for a muzzle, a white eye. Its ribs are drawn in Jawia too, in the fur's own colours
// (q, r, R), so they only show when the world shifts.
//
// Composed from parts (see docs/HERO-DRAWING.md, part 4): the body is one drawing, laid over a set of legs per
// walk frame; the attack and the flinch are whole frames.

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
        if (ch !== '.' && tx >= 0 && tx < W && ty >= 0 && ty < H - 1) g[ty][tx] = ch;
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

// legs, rows 10-14 of the cell: near legs f, far legs d; the hind legs bend back at the hock
const LEGS = {
  stand: [
    '.......f..d...fFd.......',
    '......f...d...f.d.......',
    '.....f...d....f.d.......',
    '.....f...d....f.d.......',
    '.....mm..dd...mmdd......',
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
    '......f.d.....d.f.......',
    '.....f..d.....df........',
    '.....f........d.........',
    '.....mm.......dd........',
  ],
};

// the same body with the wet brush of the tail swung back, lagging behind the drop of the reach
const BODY_SWUNG = [
  ...BODY.slice(0, 8),
  'tT...fFFFF.F.FfFFfpfffk.',
  'T.....FFF.....fF.Fppp...',
  '........................',
  '........................',
];

const STAND = stack([0, 10, LEGS.stand], [0, 0, BODY]);
const WALK = [
  stack([0, 10, LEGS.reachA], [0, 1, BODY_SWUNG]),
  stack([0, 10, LEGS.passA], [0, 0, BODY]),
  stack([0, 10, LEGS.reachB], [0, 1, BODY_SWUNG]),
  stack([0, 10, LEGS.passB], [0, 0, BODY]),
];

// the wind-up: pressed to the ground, haunches down and coiled, hackles up, the tail out stiff behind, the head
// thrust low and forward with the lips off the teeth and the eye flaring
const CROUCH = [
  '........................',
  '.............S.S.S......',
  '...........SsSsSsSs.....',
  '.........SSsssssssss....',
  '.......SSsssssssssssS...',
  '.....SSfffsqsqsqssssSS..',
  'ttTSlffffffrfrfrfssssSl.',
  '..Tlffffff.RFRFRffsslll.',
  '...lfffffF.....fFfsfflll',
  '...fffffF......fFfflElll',
  '..fffFFF.......ff.fMwwpk',
  '..ffFFF.......f.d.FwMMw.',
  '..fFff........f.d..pp...',
  '.ff.fF.......f..d.......',
  '.mm.mm......mm.dd.......',
  '........................',
];

// the bite: stretched out off the ground, the forelegs reaching, the jaws open for the throat
const LUNGE = [
  '...................SS...',
  '..........S.S.....sSlpp.',
  '.........SsSsS...ssleMw.',
  '......SSSsssssss.sslMM..',
  '...SSSsssqsqsqsssfffww..',
  '..Slffffrfrfrfffff.ppp..',
  '.tlfffffRFRFRfffFF.f....',
  'tT.ffFF.......fFF..f.f..',
  'T..fFF.........ff...f...',
  '...fF............f..mf..',
  '..ff..............f...m.',
  '.f.d..............m.....',
  '.f.d....................',
  'f...d...................',
  'm...dd..................',
  '........................',
];

// the recovery: landed short and skidding, the forelegs braced out in front, the rump still high, the head
// down by the paws and the eye dull: the moment to strike it
const SKID = [
  '........................',
  '........................',
  '..SSSS..................',
  '.lffffSSS...............',
  'tlfffffSsSsS............',
  'T.lfffffsssssS..........',
  '...fFFffrfrfssssS.......',
  '...fF..RFRFRfssssSS.....',
  '..fF........FfsssSlS.S..',
  '..f..........FffflllS...',
  '.f...........fFfflll....',
  '.f...........ff.Ffoflpk.',
  'f............f.f.fFppp..',
  'f.............f.f.......',
  'm.............mm.dd.....',
  '........................',
];

// the flinch: thrown back on its haunches with a yelp, the head snapped up, the back hunched, the hind legs
// buckling, the tail tucked under
const YELP = [
  '.................S......',
  '................sSl..k..',
  '...............ssfllpp..',
  '..............ssfFFpwM..',
  '..........S.Sssfffpp....',
  '.......SSsSsssssfF......',
  '.....SSssqsqsqssfF......',
  '...SSffffrfrfrffff......',
  '..lffffffRFRFRfFFF......',
  '.lfffffF......fFf.......',
  '.ffffF........f.f.......',
  '.ffFFT........f..f......',
  '..fFTT.......f...f......',
  '..mmfT.......f...f......',
  '....mm......mm...mm.....',
  '........................',
];

export const BEAST: Beast = {
  code: 'M1',
  id: 'wilk-b',
  kind: { pl: 'Wilk', en: 'Wolf' },
  name: { pl: 'wilk z Rojstów', en: 'marsh wolf' },
  note: {
    pl: 'Chudy, łeb nisko, zjeżony kark. Kłusuje; przypada do ziemi z obnażonymi kłami, skacze do gardła, ląduje w poślizgu z łbem przy łapach. Trafiony skowyczy i siada na zadzie. W Nawii widać mu żebra i kość pyska.',
    en: 'Lean, head low, hackles up. It trots; it drops low with its teeth bared, leaps for the throat and lands skidding, head by its paws. Struck, it yelps and sits back. In Nawia its ribs and its muzzle bone show.',
  },
  alt: ['P4', 'P5', 'E6'],
  w: W,
  h: H,
  view: 'side',
  pal: {
    k: 0x1a1018, // the line, the nose
    s: 0x3a3236, // the wet saddle and hackles
    S: 0x6a605c, // the saddle, where the light catches it
    l: 0xa09484, // fur, the light
    f: 0x7a7066, // fur
    F: 0x524a4a, // fur, the shadow
    r: 0x7a7066, // the ribs under the fur, the saddle and the belly: fur here, bone in Nawia
    q: 0x3a3236,
    R: 0x524a4a,
    d: 0x3a3236, // the far legs
    p: 0xc2b69e, // the pale muzzle and jaw
    e: 0xf0c848, // the eye
    E: 0xfff6c0, // the eye flaring
    o: 0x8a7038, // the eye gone dull
    t: 0x6a6058, // the tail
    T: 0x3a3236,
    M: 0x6e2430, // the mouth
    w: 0xe8e0cc, // the teeth
    m: 0x3e3028, // bog mud on the paws
  },
  frames: { stand: STAND, walk: WALK, attack: [CROUCH, LUNGE, SKID], hurt: YELP },
  ink: 'dark',
  outline: 0x1a1018,
  nawia: {
    note: { pl: 'Martwy wilk z bagna: zimne światło na karku i grzbiecie, świecące żebra, kość zamiast pyska.', en: 'A wolf dead in the bog: cold light on its hackles and back, glowing ribs, bone for a muzzle.' },
    pal: {
      k: 0x0a0816,
      s: 0x34365e,
      S: 0x5ec8d0, // the hackles and the back carry the cold light
      l: 0x7ad8d8,
      f: 0x4a4c80,
      F: 0x383a68,
      d: 0x2a2a52,
      m: 0x2a2a52,
      p: 0xb8d8d0, // the muzzle is bone
      e: 0xe8ffff,
      E: 0xffffff,
      o: 0x4a7a88,
      t: 0x4a4c80,
      T: 0x34365e,
      r: 0x8ccfc8, // the ribs
      q: 0x8ccfc8,
      R: 0x8ccfc8,
      M: 0x5a2040,
      w: 0xe8fff8,
    },
    ink: { ink: 'dark', outline: 0x0a0816 },
  },
};
