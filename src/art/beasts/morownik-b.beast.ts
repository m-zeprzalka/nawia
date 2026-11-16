// M14, Morownik: plague bells. An alternative to P2 (the game's purple bulb). 16 x 16, facing us; it never moves.
//
// The idea: a growth of the blight (skaza) on cursed ground, read as a fungus rather than a flower: three tall,
// waxy, corpse-pale stalks out of a rotten purple mound, each ending in a heavy bell-shaped head that hangs like a
// mourner's (the white "corpse plant" of the forest floor, grown wrong). The blight climbs the stalks from below;
// a sickly light glows in the mouth under each head and drips from it.
//
// How it moves: it breathes, in four beats: the heads lift a pixel (the in-breath), lean one way, sink a pixel
// with a breath of spores leaving the tall one (the out-breath), lean the other way. Only the heads and the
// necks move; the stalks stay rooted in the mound.
// How it attacks: the wind-up rears all three up on their stalks, the heads turned to face you and the mouths
// opened wide and blazing like eyes (the warning: the whole growth gets taller and three lights come on); the blow
// throws the heads forward as each one spits (the game sends the thorns); the recovery lets them sag lower than
// they hang at rest, the mouths gone dark: the moment to walk in and cut. Hit, the stalks are knocked apart and
// the tall one's head is thrown back, mouth up, shedding spores.
//
// Nawia: the same frames in other colours. The wax goes a dull teal (still lighter than Nawia's floor) and only its
// lit edges glow a cold green; the mound and the blight on the stalks burn violet, so you can see what feeds it.

import type { Beast } from './beast.ts';

const W = 16;
const H = 16;

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
/** the rows of a part above row `y` (its head and neck), or from row `y` down (its stalk) */
const above = (rows: string[], y: number): string[] => rows.map((r, i) => (i < y ? r : '.'.repeat(W)));
const below = (rows: string[], y: number): string[] => rows.map((r, i) => (i >= y ? r : '.'.repeat(W)));
/** swaps letters */
const recolour = (rows: string[], map: Record<string, string>): string[] => rows.map((r) => [...r].map((c) => map[c] ?? c).join(''));

// ------------------------------------------------------------------ hanging

// the tall one in the middle, nodding to the right; thin under the head, thicker where the blight climbs it
const MID = at(1, [
  '.......www......',
  '......wwwWW.....',
  '......wwWWWG....',
  '......wWEgGE....',
  '.......wW.g.....',
  '.......wW.......',
  '.......wWW......',
  '.......wW.......',
  '.......wW.......',
  '......wwW.......',
  '......wWe.......',
  '......wWE.......',
  '......eWE.......',
]);
// the short one on the left, nodding to the left
const LEFT = at(7, [
  '.ww.............',
  'wwwW............',
  'wWWWw...........',
  'GgEWw...........',
  '.g.wW...........',
  '...wW...........',
  '...eE...........',
]);
// the one on the right, nodding to the right
const RIGHT = at(9, [
  '..........ww....',
  '..........wwWW..',
  '..........wWWWG.',
  '..........wEgGE.',
  '..........eW.g..',
]);
const MOUND = at(13, ['..KkeEkeEkkeEK..', '..kKKkkKkKkkk...']);
/** where each one's neck ends: above this row it sways */
const NECK = { mid: 8, left: 11, right: 12 };

// ------------------------------------------------------------------ reared up, facing you

// all three stretched up on their stalks, the heads turned to you, the mouths open and blazing
const MID_UP = at(0, [
  '.......ww.......',
  '......wwwW......',
  '.....wGhhGW.....',
  '.....GhggEG.....',
  '......GEEG......',
  '.......wW.......',
  '.......wW.......',
  '.......wWW......',
  '.......wW.......',
  '.......wW.......',
  '......wwW.......',
  '......wWe.......',
  '......wWE.......',
  '......eWE.......',
]);
const LEFT_UP = at(4, [
  '.ww.............',
  'wwwW............',
  'GhhG............',
  'hggE............',
  '.GGwW...........',
  '...wW...........',
  '...wW...........',
  '...wW...........',
  '...wW...........',
  '...eE...........',
]);
const RIGHT_UP = at(6, [
  '...........ww...',
  '..........wwwW..',
  '..........GhhEG.',
  '..........EhggG.',
  '...........GGG..',
  '...........wW...',
  '..........wW....',
  '..........eW....',
]);
// the spit: a puff from each mouth as the heads are thrown forward
const SPORES = at(0, [
  '...hhg...hhg....',
  '..hhhgg.hhhgg...',
  '...hgg...hgg....',
  '................',
  'hhg.............',
  'hhgg.........hhg',
  '.gg.........hhgg',
  '.............gg.',
]);

/** a breath of spores leaving the tall one on the out-breath */
const WISP = at(7, ['...........hg...', '............g...']);

// ------------------------------------------------------------------ hit

// the tall one's head thrown back, mouth up and shedding spores, its stalk bowed
const MID_HIT = at(2, [
  '....h.g.........',
  '.....GEw........',
  '.....EwwW.......',
  '......wwWW......',
  '.......wWW......',
  '........wW......',
  '........wW......',
  '.......wWW......',
  '.......wW.......',
  '......wWe.......',
  '......wWE.......',
  '......eWE.......',
]);
const DARK = { g: 'G', h: 'G' };

// ------------------------------------------------------------------ the frames

const STAND = put([0, 0, MID], [0, 0, LEFT], [0, 0, RIGHT], [0, 0, MOUND]);
/** the heads and necks moved, the stalks where they are (the stalk keeps the neck's last row, so a lifted head
 *  does not come away from it) */
const sway = (dx: number, dy: number, mid = MID, left = LEFT, right = RIGHT): [number, number, string[]][] => [
  [0, 0, below(mid, NECK.mid - 1)],
  [dx, dy, above(mid, NECK.mid)],
  [0, 0, below(left, NECK.left - 1)],
  [dx, dy, above(left, NECK.left)],
  [0, 0, below(right, NECK.right - 1)],
  [dx, dy, above(right, NECK.right)],
];
const WALK = [
  put(...sway(0, -1), [0, 0, MOUND]), // the in-breath: the heads lift
  put(...sway(1, 0), [0, 0, MOUND]), // they lean
  put(...sway(0, 1), [0, 0, MOUND], [0, 0, WISP]), // the out-breath: they sink, a breath of spores goes up
  put(...sway(-1, 0), [0, 0, MOUND]), // they lean back
];
const WINDUP = put([0, 0, MID_UP], [0, 0, LEFT_UP], [0, 0, RIGHT_UP], [0, 0, MOUND]);
const SPIT = put([0, 1, MID_UP], [0, 1, LEFT_UP], [0, 1, RIGHT_UP], [0, 0, MOUND], [0, 0, SPORES]);
/** spent: the heads sag two rows below where they hang, the mouths dark */
const SPENT = put(...sway(0, 2, recolour(MID, DARK), recolour(LEFT, DARK), recolour(RIGHT, DARK)), [0, 0, MOUND]);
/** knocked apart: the tall one thrown back, the others flung outward and down, the mouths shut */
const HURT = put([0, 0, MID_HIT], [-1, 1, recolour(LEFT, DARK)], [1, 1, recolour(RIGHT, DARK)], [0, 0, MOUND]);

export const BEAST: Beast = {
  code: 'M14',
  id: 'morownik-b',
  kind: { pl: 'Morownik', en: 'Blight bloom' },
  name: { pl: 'morowe dzwonki', en: 'plague bells' },
  note: {
    pl: 'Woskowe łodygi zarazy zwieszają łby jak żałobnicy i oddychają. Gdy ktoś podejdzie, stają dęba, otwierają świecące paszcze i plują; potem opadają bez sił.',
    en: 'Waxy stalks of the blight hang their heads like mourners and breathe. Come close and they rear up, open their glowing mouths and spit; then they sag, spent.',
  },
  alt: ['P2'],
  w: 16,
  h: 16,
  view: 'front',
  ink: 'dark',
  outline: 0x1a1018,
  pal: {
    w: 0xe6dcd6, // the wax, lit
    W: 0xa8a0ae, // the wax, in shadow
    G: 0x625a6e, // the inside of the heads
    g: 0xc8dc5a, // the sick light in the mouths, and the spores
    h: 0xeef6a0, // the spores, lit; a mouth blazing
    k: 0x2a1830, // the mound
    K: 0x4a2a52,
    e: 0x8a6a7a, // the blight climbing the stalks
    E: 0x5a3a52,
  },
  frames: { stand: STAND, walk: WALK, attack: [WINDUP, SPIT, SPENT], hurt: HURT },
  nawia: {
    pal: {
      w: 0xb4f4d0, // the lit edges glow
      W: 0x4c7c7a, // the wax goes a dull teal, still lighter than the floor
      G: 0x223038,
      g: 0xe4ff7a,
      h: 0xf8ffd8,
      k: 0x24103a,
      K: 0x7a3ab0, // the blight burns violet
      e: 0xa858d8,
      E: 0x4a2266,
    },
    note: { pl: 'Wosk ciemnieje do mętnej zieleni, krawędzie świecą, a zaraza w kopcu i na łodygach pali się fioletem.', en: 'The wax goes a dull teal, its edges glow, and the blight in the mound and stalks burns violet.' },
  },
};
