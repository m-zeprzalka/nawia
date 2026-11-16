// M9 zjawa-b: a drowned townswoman of Zwonigród (16 x 24, facing us, floating).
//
// The idea: she went under with her arms up, reaching for the surface, and she still hangs that way, as if
// the lake were over her: lifted by her wrists, which are bound with an embroidered towel (the dead were tied
// for the wake, and the ties had to be cut before the grave, or the dead came back). Her head hangs forward
// under a burial veil, wet hair falls from under it over the face and down the chest, the shirt is sodden
// and green with weed at the hem, and below the hem there is nothing: it frays into wet strands.
//
// How it moves: it drifts like a hanged body, swaying from the wrists; the lower body swings a pixel to each
// side and bobs, the hem strands trail the other way.
// How it attacks: it is pulled up straight (the wind-up), then it drops at you: the bound arms swing down and
// reach forward, the head snaps up, the hair parts and the face is only a dark hole.
//
// Nawia: she is under the lake there. The linen is the lake's dark, only the edges the light touches glow, cold;
// her hair floats up off her face, and the face is a cold light with two dark hollows; in the blow it tears
// open on a black hole.

import type { Beast, BeastFrames } from './beast.ts';

const W = 16;
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
  w: 0xe2e0d0, // linen, the light (the veil, the towel, the lit edge of the shirt)
  l: 0xb9bcaa, // linen
  L: 0x868e82, // linen, the shadow (wet)
  d: 0x525a5c, // linen, the deep shadow
  s: 0xa6b4a6, // drowned skin
  S: 0x6e7c74, // drowned skin, the shadow
  r: 0xc23e30, // the towel's embroidery
  R: 0x7c2430, // the embroidery, the shadow
  k: 0x262c30, // wet hair
  K: 0x46524e, // wet hair, the sheen
  g: 0x5a6a38, // weed at the hem
  v: 0xa4aa9a, // the frayed hem (no line round it)
  u: 0x6c766c, // the frayed hem, darker (no line)
  o: 0x0c080e, // the hole where the face is
};
const DARK = 0x1a1018;
/** the line: on the shadow side only, and none round the frayed strands */
const LINE = { w: DARK, l: DARK, L: DARK, d: DARK, s: DARK, S: DARK, r: DARK, R: DARK, k: DARK, K: DARK, g: DARK, o: DARK };

// ------------------------------------------------------------------ the parts (rows from the top of the cell)

/** the arms up, the wrists crossed and bound, the hands limp over them, a towel end hanging */
const ARMS = [
  '......s.S.......',
  '......sSS.......',
  '......wrl.......',
  '......lRL.......',
  '.....s.w.S......',
  '.....s.r..S.....',
  '....s..w...S....',
  '....w.......L...',
  '...wl.......lL..',
  '...wl.......lL..',
  '...wl.......lL..',
  '...wl.......LL..',
];
/** pulled up straight for the blow: the elbows in, the arms long */
const ARMS_UP = [
  '......s.S.......',
  '......sSS.......',
  '......wrl.......',
  '......lRL.......',
  '......s.S.......',
  '.....sw..S......',
  '.....sr..S......',
  '....wlw...lL....',
  '....wl....lL....',
  '....wl....lL....',
  '....wl....LL....',
];
/** the head hanging forward: the veil on the crown, the hair over the face and down the chest */
const HEAD = [
  '.......ww.......',
  '......wllL......',
  '......wllLd.....',
  '......kKkkd.....',
  '......kKkkk.....',
  '......kKkKk.....',
  '......kKkk......',
  '.......kkK......',
  '........k.......',
  '.........k......',
];
/** the head starting to lift for the blow: a sliver of the face between the locks */
const HEAD_LIFT = [
  '.......ww.......',
  '......wllL......',
  '......kssSd.....',
  '......kKSkk.....',
  '......kKkKk.....',
  '......kKkk......',
  '.......kkK......',
  '........k.......',
];
/** the shirt, from the shoulders to the hem: narrow and clinging, wet, weed at the hem */
const SHIRT = [
  '...wlLllLLdLlLd.',
  '....wlllLLLLLd..',
  '.....wllLLLLd...',
  '......wlLLLd....',
  '......wlLLLd....',
  '......wlLLLd....',
  '......wlLLLd....',
  '......wlLLLd....',
  '......wlLgLd....',
];
/** the hem frays into strands: hanging, swung left, swung right, gathered (pulled up) */
const HEM = {
  hang: ['......v.LgLd....', '.......v.L.u....'],
  /** the body swinging left: the strands lag to the right */
  left: ['......v.LgLdu...', '........v.L..u..'],
  right: ['.....uv.LgLd....', '....u..v.L......'],
  /** pulled up: gathered under her */
  up: ['......vLLgL.....', '.....v..L.uu....'],
};

// ------------------------------------------------------------------ the blow: whole

/** dropping at you: the arms down and reaching, the head up, the hair parted, the face a hole */
const STRIKE = [
  '................',
  '................',
  '................',
  '......wwwl......',
  '.....wwlllL.....',
  '....kwlllLLk....',
  '...kKssssssKk...',
  '...kKsSosSSKk...',
  '...kKsooooSKk...',
  '..kKKsooooSKKk..',
  '..k.KSooooSK.k..',
  '..k.kSsoosSk..k.',
  '.k..kKSooSKk....',
  '...wlLkSSkLLd...',
  '..wl.s.ss.S.Ld..',
  '..wl.sssssSSLd..',
  '...wl.wrRl.Ld...',
  '....wlwwlLLd....',
  '.....wlLLLLd....',
  '....wllLLLLLd...',
  '....wlLLgLLLd...',
  '...v.lLLgL.Ld.u.',
  '..v..v.L..u...u.',
  '................',
];

// ------------------------------------------------------------------ the frames

/** A head and where its top goes when she hangs still; `sway` is the row from which it swings with the body. */
type Head = { rows: string[]; at: number; sway: number };

function frames(head: Head, lift: Head, strike: string[]): BeastFrames {
  const h = (dx: number, dy: number): [number, number, string[]][] => [
    [0, head.at + dy, head.rows.slice(0, head.sway)],
    [dx, head.at + dy + head.sway, head.rows.slice(head.sway)],
  ];
  return {
    stand: stack([0, 0, ARMS], [0, 12, SHIRT], ...h(0, 0), [0, 21, HEM.hang]),
    // the drift: she swings from the wrists like a pendulum, lowest in the middle of the swing; the lower
    // body goes a pixel to the side and the strands of the hem lag the other way
    walk: [
      stack([0, 0, ARMS], [0, 12, SHIRT.slice(0, 3)], [-1, 15, SHIRT.slice(3)], ...h(-1, 0), [-1, 21, HEM.left]),
      stack([0, 1, ARMS], [0, 13, SHIRT], ...h(0, 1), [0, 22, HEM.hang]),
      stack([0, 0, ARMS], [0, 12, SHIRT.slice(0, 3)], [1, 15, SHIRT.slice(3)], ...h(1, 0), [1, 21, HEM.right]),
      stack([0, 1, ARMS], [0, 13, SHIRT], ...h(0, 1), [0, 22, HEM.hang]),
    ],
    attack: [
      // the wind-up: pulled up straight, a pixel higher, the hem gathered under her, the head starting to lift
      stack([0, 0, ARMS_UP], [0, 11, ['...wlLllLLdLd...']], [0, 12, SHIRT.slice(1)], [0, lift.at, lift.rows], [0, 20, HEM.up]),
      strike,
    ],
  };
}

/** Swaps letters in a frame. */
const recolour = (rows: string[], map: Record<string, string>): string[] => rows.map((r) => [...r].map((c) => map[c] ?? c).join(''));

// ------------------------------------------------------------------ Nawia: under the lake

/**
 * Under the water her hair floats up off her face, and the face is a cold light with two dark hollows for
 * eyes; in the blow the light tears open on a black hole.
 */
const HEAD_N = [
  '.........K......',
  '.......K..K.....',
  '.......K.K......',
  '......K..K......',
  '.......KkK......',
  '......kKkkKk....',
  '......kooosk....',
  '.....kooooos....',
  '.....kokoko.....',
  '......kooos.....',
  '.......kos......',
];
const LIFT_N = [
  '.......K.K......',
  '......K..K......',
  '.......KkK......',
  '......kKkkKk....',
  '......kooosk....',
  '.....kooooos....',
  '.....kokoko.....',
  '......kooos.....',
  '.......kos......',
];
const STRIKE_N = recolour(STRIKE, { o: 'k', s: 'o', S: 's' });

const NAWIA = {
  w: 0x9ee6f0, // the lit edges glow
  l: 0x2e4a5c,
  L: 0x1e2e40,
  d: 0x141c2c,
  s: 0x7ab8c4,
  S: 0x2e5464,
  r: 0xd85a54, // the embroidery stays red: an ember
  R: 0x5a2034,
  k: 0x0c1018,
  K: 0x3a6478, // the floating locks catch the light
  g: 0x3a7a6a,
  v: 0x4a8a9a,
  u: 0x2a4c5c,
  o: 0xc8f6ff, // the face: a cold light
};
const HALO = 0x1c3448;
const NAWIA_LINE = { w: HALO, l: HALO, L: HALO, d: HALO, s: HALO, S: HALO, r: HALO, R: HALO, k: HALO, K: HALO, g: HALO, o: HALO };

export const BEAST: Beast = {
  code: 'M9',
  id: 'zjawa-b',
  kind: { pl: 'Zjawa', en: 'Wraith' },
  name: { pl: 'topielica ze Zwonigrodu', en: 'the drowned of Zwonigród' },
  note: {
    pl: 'Wisi za związane ręcznikiem nadgarstki, jakby nad nią wciąż była woda. Spada na ciebie, a pod włosami ma tylko dziurę.',
    en: 'She hangs by her towel-bound wrists as if the lake were still above her. She drops at you; under the hair is only a hole.',
  },
  alt: ['P11', 'P12', 'E2'],
  w: W,
  h: H,
  view: 'front',
  pal: PAL,
  frames: frames({ rows: HEAD, at: 9, sway: 7 }, { rows: HEAD_LIFT, at: 8, sway: 0 }, STRIKE),
  ink: 'rim',
  line: LINE,
  nawia: {
    pal: NAWIA,
    frames: frames({ rows: HEAD_N, at: 6, sway: 11 }, { rows: LIFT_N, at: 6, sway: 0 }, STRIKE_N),
    ink: { ink: 'rim', line: NAWIA_LINE },
    note: {
      pl: 'W Nawii jest pod wodą: włosy unoszą się z twarzy, a twarz to zimne światło z ciemnymi oczodołami.',
      en: 'In Nawia she is under the lake: her hair floats off her face, a cold light with dark hollows for eyes.',
    },
  },
};
