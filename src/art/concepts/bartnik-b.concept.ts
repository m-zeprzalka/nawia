import type { Concept } from './concept.ts';

// C6b "Bartnik", side view fixed: the same lad (now taken as Sambor, 18-20) drawn in the manner of late-80s
// home-computer sprites: ordered dithering between tones on the big masses (felt, fur, wool, leather grain),
// a muted palette with deep shadows, a thin dark line. Light from the upper left.
//
// Every frame is the body (rows 0-13) over the legs (rows 14-19). Shield and swinging arm are drawn once
// and laid over the body, so they can move with the walk.

// Placeholders filled by ordered dithering. The pattern follows the body, not the cell (y0 is the
// body row of the first line), so it does not crawl when the figure dips during the walk.
//  'c' a checker (50%) of two tones, 'q' a sparse 25% of the second tone over the first.
const DITHER: Record<string, [string, string, 'c' | 'q']> = {
  '4': ['F', 'A', 'q'], // fur, in the light
  '6': ['F', 'A', 'c'], // fur
  '0': ['A', 'a', 'c'], // fur, in shadow
  '5': ['R', 'r', 'c'], // felt, mid
  '3': ['B', 'b', 'c'], // wool, mid
  '7': ['a', 'A', 'q'], // leather grain, lit side
  '8': ['a', 'd', 'q'], // leather grain, shadow side
  '9': ['a', 'd', 'c'], // leather, deep
};

function px(rows: string[], y0 = 0): string[] {
  return rows.map((r, i) =>
    [...r]
      .map((ch, x) => {
        const d = DITHER[ch];
        if (!d) return ch;
        const [p, q, kind] = d;
        const y = y0 + i;
        if (kind === 'c') return (x + y) % 2 === 0 ? p : q;
        return (x + 2 * y) % 4 === 0 ? q : p;
      })
      .join(''),
  );
}

const EMPTY = '................';

type Overlay = [sprite: string[], x: number, y: number];

/** body over legs (dipped a pixel when `dip`), then each overlay laid on at (x, y) in body rows */
function frame(top: string[], legs: string[], dip: 0 | 1, overlays: Overlay[]): string[] {
  const rows = [...(dip ? [EMPTY] : []), ...px(top), ...px(legs, 14)].slice(0, 20);
  for (const [sprite, x, y0] of overlays)
    sprite.forEach((line, j) => {
      const y = y0 + dip + j;
      const row = [...rows[y]];
      [...line].forEach((ch, i) => {
        if (ch !== '.') row[x + i] = ch;
      });
      rows[y] = row.join('');
    });
  return rows;
}

// ---- facing us. His right hand rests by the sword hilt (our left), the shield on his left arm.
const D_TOP = [
  EMPTY,
  '......RR5r......',
  '.....RRR55r.....',
  '....666666Aa....',
  '....dzOSSOzd....',
  '....sLBSsBLz....',
  '.....sSSsSz.....',
  '......sSzs......',
  '...LFALszladl...',
  '...LlFAa8adll...',
  '..MLldFAa8dll...',
  '..aLladFA8dll...',
  '.MMSsdMdFAdsz...',
  '..a..Aa8dFd.....',
];
const D_LEGS0 = [
  '..a..B33bbb.....',
  '..a..B3..bb.....',
  '..M..Ll..ld.....',
  '.....lL..ld.....',
  '....FAa..Aad....',
  EMPTY,
];
// strides (body rows 14-18, the body dips): one leg reaches forward, the other bends back, sole up
const D_LEGS1 = [
  '..a..B3..bb.....',
  '..M..Ll..ad.....',
  '.....lL.........',
  '....FAAa........',
  EMPTY,
];
const D_LEGS2 = [
  '..a..B3..bb.....',
  '..M..Aa..ld.....',
  '.........ld.....',
  '........aAad....',
  EMPTY,
];
// round shield: planks painted with red ochre, a rim of bark-grey leather, an iron boss
const D_SHIELD = ['.lla.', 'lRRrd', 'lRMrd', 'arrrd', '.add.'];

// ---- from behind: the fur flap of the cap covers his nape; the horn hangs at the small of his back
const U_TOP = [
  EMPTY,
  '......RR5r......',
  '.....RRR55r.....',
  '....4444446A....',
  '....666666Aa....',
  '.....00000a.....',
  '.....dadddd.....',
  '......zzzz......',
  '...LAaaaadFAl...',
  '...Ll7aaaFAll...',
  '...Ll7aaFA8ll.M.',
  '...Ll7aFA89ll.a.',
  '...ssdFAdddszMM.',
  '.....FAalLLd.a..',
];
const U_LEGS0 = [
  '.....B33bbb..a..',
  '.....B3..bb..a..',
  '.....Ll..ld..M..',
  '.....lL..ld.....',
  '....FAa..Aad....',
  EMPTY,
];
const U_LEGS1 = [
  '.....B3..bb..a..',
  '.....Ll..ad..M..',
  '.....lL.........',
  '....FAAa........',
  EMPTY,
];
const U_LEGS2 = [
  '.....B3..bb..a..',
  '.....Aa..ld..M..',
  '.........ld.....',
  '........aAad....',
  EMPTY,
];
// the back of the shield: bare planks, the grip bar, the painted face showing at the rim
const U_SHIELD = ['.rdd.', 'rFAFd', 'raaad', 'rAFAd', '.rdd.'];

// ---- facing right, upright and slim: torso 6 px deep, the shield seen edge-on in front of him,
// the sword hanging almost straight down his near hip, the near arm free to swing.
const S_TOP = [
  EMPTY,
  '.....RRR5.......',
  '....RRRR55r.....',
  '....4444460.....',
  '....60dsSOS.....',
  '....0dzSLBS.....',
  '.....dssSSSS....',
  '......zsSSz.....',
  '.....aFAzL......',
  '.....AaaaFA.....',
  '.....aMaa9F.....',
  '.....7Aaa9d.....',
  '.....dMMddd.....',
  '.....A9a9d......',
];
const S_LEGS0 = [
  '......dB3.......',
  '......dB3.......',
  '......MLl.......',
  '......dlL.......',
  '......aFAAa.....',
  EMPTY,
];
// strides: a clean scissor, near leg light, far leg dark, no dip
const S_LEGS1 = [
  '......dB3.......',
  '.....bd.B3......',
  '....bdM..Ll.....',
  '...bd....lL.....',
  '...aa....FAAa...',
  EMPTY,
];
const S_LEGS2 = [
  '......dbb.......',
  '.....Bd..bb.....',
  '....LlM..dl.....',
  '...Ll.....dl....',
  '...FA.....aAad..',
  EMPTY,
];
// the near arm: hanging, swung back, swung forward (the shoulder stays put)
const S_ARM0 = ['Ll', 'Ll', 'Ll', 'Ss'];
const S_ARM_BACK = ['.Ll', 'Ll.', 'Ll.', 'Ss.'];
const S_ARM_FWD = ['Ll.', '.Ll', '.Ll', '.Ss'];
// the shield edge-on: the rim nearer us, the red face beyond it, the boss poking forward
const S_SHIELD = ['.a.', 'aRd', 'aMd', 'aRd', 'ard', '.d.'];

export const CONCEPT: Concept = {
  code: 'C6b',
  id: 'bartnik-b',
  name: { pl: 'Bartnik', en: 'Beekeeper' },
  note: {
    pl: "syn bartnika: filcowa czapka z futrem, kubrak, leziwo, róg; bok poprawiony: tarcza z kantu, miecz przy biodrze; dithering",
    en: "the beekeeper's son: a fur-trimmed cap, a jerkin, a rope, a horn; the side fixed: the shield edge-on, the sword at the hip; dithering",
  },
  h: 20,
  pal: {
    O: 0x1a1418, // line, pupils
    S: 0xe8bc98, // skin
    s: 0xc08a6a,
    z: 0x84524a,
    L: 0xe0d8c0, // linen, eye whites, horn
    l: 0x9c9a88, // linen in shadow, bark
    F: 0xccb07a, // rope, fur, bare wood
    A: 0x9a6a46, // leather
    a: 0x5e3c2e,
    d: 0x302226,
    R: 0xa04838, // felt cap, painted shield
    r: 0x642c2c,
    M: 0xb4bcbc, // iron
    B: 0x58667a, // wool trousers, irises
    b: 0x323a4c,
  },
  frames: {
    down: [
      frame(D_TOP, D_LEGS0, 0, [[D_SHIELD, 10, 10]]),
      frame(D_TOP, D_LEGS1, 1, [[D_SHIELD, 10, 11]]),
      frame(D_TOP, D_LEGS2, 1, [[D_SHIELD, 10, 9]]),
    ],
    up: [
      frame(U_TOP, U_LEGS0, 0, [[U_SHIELD, 1, 10]]),
      frame(U_TOP, U_LEGS1, 1, [[U_SHIELD, 1, 11]]),
      frame(U_TOP, U_LEGS2, 1, [[U_SHIELD, 1, 9]]),
    ],
    side: [
      frame(S_TOP, S_LEGS0, 0, [[S_ARM0, 7, 9], [S_SHIELD, 11, 9]]),
      frame(S_TOP, S_LEGS1, 0, [[S_ARM_BACK, 6, 9], [S_SHIELD, 11, 9]]),
      frame(S_TOP, S_LEGS2, 0, [[S_ARM_FWD, 7, 9], [S_SHIELD, 11, 9]]),
    ],
  },
  ink: 'dark',
  outline: 0x1a1418,
};
