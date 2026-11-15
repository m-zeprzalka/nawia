import type { Concept } from './concept.ts';

// C6 "Bartnik": the forest beekeeper's son. Drawn in the manner of late-80s home-computer sprites:
// ordered dithering between tones on the big masses (felt, fur, wool, leather grain), a muted palette
// with deep shadows, a thin dark line. Light from the upper left.
//
// Every frame is the body (rows 0-13) over the legs (rows 14-19); in a stride the body dips a pixel.
// The shield is drawn once per view and laid over the body, so it can swing with his arm.

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

/** body over legs, dipped a pixel in a stride; then the shield laid on at (sx, sy) in body rows */
function frame(top: string[], legs: string[], dip: 0 | 1, shield: string[], sx: number, sy: number): string[] {
  const rows = [...(dip ? [EMPTY] : []), ...px(top), ...px(legs, 14)].slice(0, 20);
  shield.forEach((line, j) => {
    const y = sy + dip + j;
    const row = [...rows[y]];
    [...line].forEach((ch, i) => {
      if (ch !== '.') row[sx + i] = ch;
    });
    rows[y] = row.join('');
  });
  return rows;
}

// ---- facing us. His right hand rests on the sword hilt (our left), the shield on his left arm.
const D_TOP = [
  EMPTY,
  '......RR5r......',
  '.....RRR55r.....',
  '....666666Aa....',
  '....dsOSSOsd....',
  '....sLBSsBLz....',
  '.....sSSSsz.....',
  '......sSsz......',
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
// strides (body rows 14-18): his right leg (our left) forward and down, the other lifted; and back
const D_LEGS1 = [
  '..a..B3..bb.....',
  '..M..Ll..ld.....',
  '.....lL..Aad....',
  '....FAa.........',
  EMPTY,
];
const D_LEGS2 = [
  '..a..B3..bb.....',
  '..M..Ll..ld.....',
  '....FAa..ld.....',
  '.........Aad....',
  EMPTY,
];
// round shield of planks under bark, leather rim, iron boss
const D_SHIELD = ['.aad.', 'aLlad', 'alMld', 'dlald', '.ddd.'];

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
  '.....Ll..ld..M..',
  '.....lL..Aad....',
  '....FAa.........',
  EMPTY,
];
const U_LEGS2 = [
  '.....B3..bb..a..',
  '.....Ll..ld..M..',
  '....FAa..ld.....',
  '.........Aad....',
  EMPTY,
];
// the back of the shield: bare planks and the grip bar
const U_SHIELD = ['.ddd.', 'dFAFd', 'daaad', 'dAFAd', '.ddd.'];

// ---- facing right: the near hand on the hilt, the scabbard slanting back, the shield held forward
const S_TOP = [
  EMPTY,
  '....rRR5........',
  '...rRRR55r......',
  '....666666Fa....',
  '....66sSSOS.....',
  '....00zSLBS.....',
  '.....dsSSSSS....',
  '......sSSSz.....',
  '.....aFAFL......',
  '.....FLlaa......',
  '.....FLla9......',
  '.....aLla9......',
  '.....dSsMd......',
  '....Ma9aad......',
];
const S_LEGS0 = [
  '....a.B3bb......',
  '...a..B3bb......',
  '...M..Llld......',
  '......lLld......',
  '......FAAad.....',
  EMPTY,
];
// strides: the near leg forward / the far leg forward
const S_LEGS1 = [
  '...a.bb.B3......',
  '...Mld...Ll.....',
  '....ld...lL.....',
  '...Aa....FAAa...',
  EMPTY,
];
const S_LEGS2 = [
  '...a.B3.bb......',
  '...MLl...ld.....',
  '....lL...ld.....',
  '...FA....Aad....',
  EMPTY,
];
const S_SHIELD = ['.aad.', 'aLlad', 'alMld', 'dlald', '.ddd.'];

export const CONCEPT: Concept = {
  code: 'C6',
  id: 'bartnik',
  name: { pl: 'Bartnik', en: 'Beekeeper' },
  note: {
    pl: 'Syn leśnego bartnika: filcowa czapka z futrzanym otokiem, lniana koszula pod skórzanym kubrakiem, leziwo zwinięte przez ramię, róg u pasa i tarcza z desek obitych korą. Rysowany jak sprite z Amigi: dithering na dużych płaszczyznach, przygaszona paleta, głębokie cienie.',
    en: "A forest beekeeper's son: a felt cap with a fur trim, a linen shirt under a leather jerkin, a climbing rope coiled over his shoulder, a horn at his belt and a shield of bark-clad planks. Drawn like an Amiga sprite: dithering on the big masses, a muted palette, deep shadows.",
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
    R: 0xa04838, // felt cap
    r: 0x642c2c,
    M: 0xb4bcbc, // iron
    B: 0x58667a, // wool trousers, irises
    b: 0x323a4c,
  },
  frames: {
    down: [frame(D_TOP, D_LEGS0, 0, D_SHIELD, 10, 10), frame(D_TOP, D_LEGS1, 1, D_SHIELD, 10, 11), frame(D_TOP, D_LEGS2, 1, D_SHIELD, 10, 9)],
    up: [frame(U_TOP, U_LEGS0, 0, U_SHIELD, 1, 10), frame(U_TOP, U_LEGS1, 1, U_SHIELD, 1, 11), frame(U_TOP, U_LEGS2, 1, U_SHIELD, 1, 9)],
    side: [frame(S_TOP, S_LEGS0, 0, S_SHIELD, 10, 9), frame(S_TOP, S_LEGS1, 1, S_SHIELD, 10, 9), frame(S_TOP, S_LEGS2, 1, S_SHIELD, 9, 9)],
  },
  ink: 'dark',
  outline: 0x1a1418,
};
