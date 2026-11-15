// The cast of the playground: the hero in two heights, the villagers, and the monsters in three size classes.
//
// Sizes follow the 16-bit top-down adventures the game is modelled on: everything lives on a 16 px grid,
// a person is 16 px wide and one to one and a half tiles tall, and about half of that is head.
// Monsters come in three heights: one tile, one and a half, two. Nothing is taller than two tiles.
//
// Heads of people are drawn by hand (below, as text); their bodies and every monster on two legs are
// posed by the figure painter (rig.ts), which gives each of them three views and a walk for free.
// Animals on four legs are drawn by hand, frame by frame: a painter that does not know anatomy draws sausages.
//
// Nothing here is used by the game yet. What is chosen in the playground moves into the game; the rest goes.

import { PixelBuffer, fromAscii, rgb, type Color } from '../core/PixelBuffer.ts';
import { hash2 } from '../core/rng.ts';
import { run, stroke, type Anchors, type Figure, type Ramp, type View } from './rig.ts';
import { art } from './sheet.ts';

type Feature = (b: PixelBuffer, a: Anchors) => void;
const all = (...fs: (Feature | undefined)[]): Feature => (b, a) => {
  for (const f of fs) f?.(b, a);
};
const ramp = (a: number, b: number, c: number, d: number): Ramp => [rgb(a), rgb(b), rgb(c), rgb(d)];

const OUT = rgb(0x1a1423);
const SKIN = ramp(0xb37655, 0xe2a880, 0xf3c79f, 0xffe1c2);
const BLOND = ramp(0x8c5f22, 0xc8922e, 0xe5b74c, 0xf8dc86);
const BROWN = ramp(0x33221a, 0x5a3e2c, 0x7a583c, 0x9c7650);
const BLACK = ramp(0x121016, 0x2a2430, 0x423a48, 0x5a5262);
const WHITE = ramp(0x8c8a90, 0xc9c6c8, 0xe9e6e2, 0xffffff);
const LINEN = ramp(0x9a917e, 0xd3c9b3, 0xece4d0, 0xfffaf0);
const RED = ramp(0x741d30, 0xad2c39, 0xcc4646, 0xea7864);
const BLUE = ramp(0x243a58, 0x3c5c84, 0x5a80aa, 0x86aad0);
const STEEL = ramp(0x444e5c, 0x7e8c9c, 0xb4c0cc, 0xe8f0f6);
const GREEN = ramp(0x1c3024, 0x325036, 0x4c7246, 0x709c5e);
const TEAL = ramp(0x1e3a34, 0x356056, 0x4f8474, 0x74a894);

// ------------------------------------------------------------------ builds

type Build = Pick<Figure, 'w' | 'h' | 'head' | 'neck' | 'shoulder' | 'waist' | 'torsoH' | 'skirt' | 'arm' | 'leg' | 'bootH'>;

/**
 * The two heights the hero is being tried in. Both carry the same hand-drawn head (12 x 10; the small one loses its top row).
 *  - `small`: one tile, 16 x 16. Mostly head, the way an 8-bit hero is; best for play, since he is exactly the tile he stands on.
 *  - `tall`:  one and a half tiles, 16 x 24. Room for a tunic, a belt and a stride; his head overlaps the tile behind him.
 */
export const BUILDS: Record<'small' | 'tall', Build> = {
  small: { w: 16, h: 16, head: { w: 12, h: 9 }, neck: 0, shoulder: 8, waist: 6, torsoH: 3, skirt: 1, arm: { w: 2, len: 2 }, leg: { w: 3, len: 2, gap: 0 }, bootH: 1 },
  tall: { w: 16, h: 24, head: { w: 12, h: 10 }, neck: 0, shoulder: 8, waist: 6, torsoH: 5, skirt: 2, arm: { w: 2, len: 4 }, leg: { w: 3, len: 5, gap: 0 }, bootH: 2 },
};

// ------------------------------------------------------------------ heads, drawn by hand
// 12 x 10. Letters: h H l L = hair (base, shadow, light, shine); s S t = skin (base, shadow, light);
// e = eye; r R = headband (or hair again, for those who wear none).
// Seen slightly from above, like everything else: the top third is the crown of the head, the face sits low.

const HEAD: Record<View, string[]> = {
  down: art(12, [
    '....hllllh..',
    '..hhlLLlhhH.',
    '.hhllLllhhhH',
    'hrrrrrrrrrRh',
    'hhShSSSShShH',
    'hHstettesSHh',
    '.HstettesSH.',
    '..sttttssS..',
    '...stSSsS...',
    '....sssS....',
  ]),
  up: art(12, [
    '....hllllh..',
    '..hhlLLlhhH.',
    '.hhllLllhhhH',
    'hrrrrrrrrrRh',
    'hhhllhhhhhHH',
    'hhhhlhhhhHHH',
    '.hhhhhhhHHH.',
    '.HhhhhhHHHH.',
    '..HHhhHHHH..',
    '....sssS....',
  ]),
  side: art(12, [
    '...hllllh...',
    '.hhlLLllhh..',
    'hhllLllhhhh.',
    'Hrrrrrrrrrr.',
    'hhhhhhSSSSS.',
    'hHhhhHstteS.',
    '.HhhhHsttest',
    '..HhhHsttts.',
    '...HHHstSSs.',
    '.....sssS...',
  ]),
};

function heads(hair: Ramp, skin: Ramp, eye: Color, band: Ramp | null): Record<View, PixelBuffer> {
  const pal: Record<string, Color> = {
    h: hair[1], H: hair[0], l: hair[2], L: hair[3], s: skin[1], S: skin[0], t: skin[2], e: eye,
    r: band ? band[2] : hair[1], R: band ? band[1] : hair[0],
  };
  return { down: fromAscii(HEAD.down, pal), up: fromAscii(HEAD.up, pal), side: fromAscii(HEAD.side, pal) };
}

/** Cuts rows off the top of the heads so they fit a shorter build. */
function fit(h: Record<View, PixelBuffer>, rows: number): Record<View, PixelBuffer> {
  const cut = (b: PixelBuffer): PixelBuffer => (b.h > rows ? b.sub(0, b.h - rows, b.w, rows) : b);
  return { down: cut(h.down), up: cut(h.up), side: cut(h.side) };
}

/** Something worn on a hand-drawn head: one piece of art per view, laid over it `dy` rows from its top. */
function worn(rows: Record<View, string[]>, pal: Record<string, Color>, dy: number): Feature {
  const pieces = { down: fromAscii(rows.down, pal), up: fromAscii(rows.up, pal), side: fromAscii(rows.side, pal) };
  // measured from the chin, so the same piece fits the full head and the one that lost its top row
  return (b, a) => b.blit(pieces[a.view], a.hx0, a.hy1 - 9 + dy);
}

/** A conical helmet with a nasal bar: what a warrior of the tenth century actually wore. */
const HELMET: Record<View, string[]> = {
  down: art(12, [
    '.....mM.....',
    '....mWMn....',
    '..mmWMMmnn..',
    '.mmWMMMmmnn.',
    'mmWMMMmmmnnn',
    'NnNnNnNnNnNn',
    '.....Mn.....',
    '.....Mn.....',
  ]),
  up: art(12, [
    '.....mM.....',
    '....mWMn....',
    '..mmWMMmnn..',
    '.mmWMMMmmnn.',
    'mmWMMMmmmnnn',
    'NnNnNnNnNnNn',
    '.nmmmmmmmmn.',
    '..nnnnnnnn..',
  ]),
  side: art(12, [
    '....mM......',
    '...mWMn.....',
    '.mmWMMmnn...',
    'mmWMMMmmnnn.',
    'mWMMMmmmnnnn',
    'NnNnNnNnNnNn',
    '..........Mn',
    '..........Mn',
  ]),
};
const helmet = (m: Ramp): Feature => worn(HELMET, { m: m[1], M: m[2], W: m[3], n: m[0], N: OUT }, -2);

/** A hood (or, in other colours, a kerchief): frames the face from the front, covers the head from behind. */
const HOOD: Record<View, string[]> = {
  down: art(12, [
    '....gGGg....',
    '..ggGGGGggd.',
    '.ggGGggggggd',
    'ggGggggggggd',
    'ggdddddddgdd',
    'gg........dd',
    'gg........dd',
    '.g........d.',
    '.gg......dd.',
    '..gg....dd..',
    '...g....d...',
  ]),
  up: art(12, [
    '....gGGg....',
    '..ggGGGGggd.',
    '.ggGGggggggd',
    'ggGggggggggd',
    'ggGgggggggdd',
    'ggggggggggdd',
    'gggggggggddd',
    '.ggggggggdd.',
    '.gggggggddd.',
    '..ggggdddd..',
    '...ggdddd...',
  ]),
  side: art(12, [
    '...gGGGg....',
    '.ggGGGGggg..',
    'ggGGgggggggd',
    'gGgggggggggd',
    'gggggggdddd.',
    'gggggd......',
    'ggggd.......',
    '.gggd.......',
    '.gggd.......',
    '..ggdd......',
    '...gd.......',
  ]),
};
const hood = (c: Ramp): Feature => worn(HOOD, { g: c[1], G: c[2], d: c[0] }, -1);

const BEARD: Record<View, string[]> = {
  down: art(12, ['..wwwwwwww..', '..wWwwwwWw..', '...wwwwww...', '....wwWw....', '.....ww.....']),
  up: art(12, ['............']),
  side: art(12, ['.......wwww.', '.......wWww.', '........www.', '.........w..']),
};
const beard = (c: Ramp): Feature => worn(BEARD, { w: c[2], W: c[1] }, 7);

/** The tail of a headband, flying behind him. */
const bandTail = (c: Ramp): Feature => (b, a) => {
  const y = a.hy1 - 6; // the row of the band, counted from the chin
  if (a.view === 'side') { b.set(a.hx0 - 1, y, c[1]); b.set(a.hx0 - 2, y + 1, c[2]); b.set(a.hx0 - 1, y + 1, c[0]); }
  if (a.view === 'up') { b.set(a.cx, y + 1, c[2]); b.set(a.cx - 1, y + 2, c[1]); b.set(a.cx, y + 2, c[0]); }
};

/**
 * A sword at the hip: a hilt at the belt, a scabbard behind the leg. The hag stone glints in the pommel:
 * the one colour on him that belongs to the other side. `c` is the ramp it borrows its metal and leather from.
 */
const sword = (c: Ramp): Feature => (b, a) => {
  const len = a.foot - a.waistY > 5 ? 4 : 2;
  if (a.view === 'down') {
    const x = a.tx0 - 1;
    b.set(x, a.waistY, c[2]); b.set(x - 1, a.waistY - 1, rgb(0x9af4ff));
    stroke(b, x - 1, a.waistY + 1, x - 2, a.waistY + len, c[0]);
  } else if (a.view === 'side') {
    stroke(b, a.cx - 2, a.waistY + 1, a.cx - 3 - len, a.waistY + len, c[0]);
    b.set(a.cx - 1, a.waistY, c[2]);
  } else stroke(b, a.tx1 + 1, a.waistY + 1, a.tx1 + 2, a.waistY + len, c[0]);
};

const bow = (c: Ramp): Feature => (b, a) => {
  if (a.view === 'up') { stroke(b, a.cx - 3, a.shoulderY - 1, a.cx + 3, a.waistY + 2, c[2]); stroke(b, a.cx - 2, a.shoulderY - 1, a.cx + 4, a.waistY + 2, c[0]); }
  else if (a.view === 'side') for (let i = -3; i <= 3; i++) b.set(a.tx0 - 2 - Math.round((1 - (i * i) / 9) * 2), a.shoulderY + 2 + i, c[2]);
};

const staff: Feature = (b, a) => {
  const hand = a.hands[a.hands.length - 1];
  if (!hand || a.view === 'up') return;
  const x = hand[0] + (a.view === 'side' ? 2 : 3);
  // from the side it would run across his face: there it is held lower, like a cane
  const top = a.view === 'side' ? a.shoulderY - 1 : a.hy0 + 2;
  for (let y = top; y <= a.foot; y++) { b.set(x, y, BROWN[2]); b.set(x + 1, y, BROWN[0]); }
  b.set(x, top - 1, BROWN[2]);
};

const apron: Feature = (b, a) => {
  if (a.view !== 'down') return;
  for (let y = a.waistY + 1; y <= a.foot - 2; y++) run(b, y, a.cx - 2, a.cx + 1, LINEN);
};

// ------------------------------------------------------------------ the hero and the villagers

export interface Costume {
  id: string;
  name: { pl: string; en: string };
  make: (build: Build) => Figure;
}

interface Person extends Partial<Figure> {
  band?: Ramp;
}

/**
 * A person, on a 16-bit budget: fifteen colours and no more. So materials share ramps. Leather (boots, belt,
 * the rim of a shield) is the brown of his hair; undyed trousers are the shadow of his linen shirt; his eyes
 * are the colour of his outline.
 */
function person(build: Build, p: Person): Figure {
  const hair = p.hair ?? BROWN;
  const skin = p.skin ?? SKIN;
  const eye = p.eye ?? OUT;
  const hide: Ramp = [hair[0], hair[0], hair[1], hair[1]];
  const f: Figure = {
    ...build,
    skin, hair, top: LINEN, bottom: [hair[0], LINEN[0], LINEN[1], LINEN[1]], boots: hide, outline: OUT,
    hairStyle: 'short', face: 'human', eye, belt: hair[0],
    headArt: fit(heads(hair, skin, eye, p.band ?? null), build.head.h),
    ...p,
  };
  // one tile leaves five rows for a body: a cloak would only be clutter there, and the shield has to shrink
  if (build.h <= 16) {
    f.cloak = undefined;
    if (f.shield) f.shield = { ...f.shield, r: 2 };
  }
  return f;
}
/** A round shield: its rim borrows the brown of the bearer's hair, its cross the light of his linen. */
const shield = (rim: Ramp, face: Ramp, metal: Ramp = LINEN): NonNullable<Figure['shield']> => ({ rim: [rim[0], rim[0], rim[1], rim[2]], face, cross: metal[2], boss: metal[1] });

export const HEROES: Costume[] = [
  {
    id: 'wojak',
    name: { pl: 'Wojak', en: 'Warrior' },
    make: (b) => person(b, { hair: BLOND, band: RED, cloak: RED, trim: RED[1], shield: shield(BLOND, RED), over: all(bandTail(RED), sword(BLOND)) }),
  },
  {
    id: 'druzynnik',
    name: { pl: 'Drużynnik', en: 'Man-at-arms' },
    make: (b) => person(b, { top: STEEL, bottom: [BROWN[0], BROWN[1], BROWN[2], BROWN[2]], cloak: BLUE, shield: shield(BROWN, BLUE, STEEL), over: all(helmet(STEEL), sword(STEEL)) }),
  },
  {
    id: 'lowca',
    name: { pl: 'Łowca', en: 'Hunter' },
    make: (b) => person(b, { top: [BROWN[0], BROWN[1], BROWN[2], BROWN[2]], cloak: GREEN, under: bow(BROWN), over: all(hood(GREEN), sword(BROWN)) }),
  },
];

export const FOLK_CAST: Costume[] = [
  {
    id: 'zielarka',
    name: { pl: 'Zielarka', en: 'Herbalist' },
    make: (b) => person(b, { robe: true, hair: WHITE, top: BROWN, bottom: BROWN, belt: undefined, over: all(hood(TEAL), apron) }),
  },
  {
    id: 'starzec',
    name: { pl: 'Starzec', en: 'Elder' },
    make: (b) => person(b, { robe: true, hair: WHITE, top: LINEN, bottom: LINEN, belt: RED[1], over: all(beard(WHITE), staff) }),
  },
  {
    id: 'gospodyni',
    name: { pl: 'Gospodyni', en: 'Housewife' },
    make: (b) => person(b, { robe: true, hair: BROWN, top: LINEN, bottom: RED, belt: RED[0], over: all(hood(RED), apron) }),
  },
  {
    id: 'dziecko',
    name: { pl: 'Dziecko', en: 'Child' },
    make: () => person(BUILDS.small, { hair: BLOND, trim: RED[1] }),
  },
];

// ------------------------------------------------------------------ monsters on two legs (painted)

export interface Creature {
  id: string;
  /** what it is ("Strzyga A") and the short name of this reading of it ("jędza") */
  kind: { pl: string; en: string };
  name: { pl: string; en: string };
  /** a one-line note on the idea behind this reading */
  note: { pl: string; en: string };
  /** how tall it stands, in tiles: 1, 1.5 or 2 */
  tiles: 1 | 1.5 | 2;
  /** posed by the figure painter... */
  figure?: Figure;
  /** ...or drawn by hand: five frames (stand, then the walk), facing right */
  frames?: PixelBuffer[];
  /** ...or already in the game: first frame on the `mobs` sheet and how many frames it has */
  mob?: [number, number];
}

const ROT = ramp(0x243c38, 0x4a6e62, 0x789a86, 0xa6c2a4);
const SLIME = ramp(0x123238, 0x275c62, 0x469088, 0x86c8b4);
const WEED = ramp(0x0c1a18, 0x1a362c, 0x2a5a3e, 0x4a8a58);
const PALE = ramp(0x464460, 0x84809e, 0xb6b2cc, 0xe0def2);
const WINE = ramp(0x1a0c18, 0x381a2e, 0x582a42, 0x7a4058);
const SHROUD = ramp(0x443c7c, 0x8a82c6, 0xc6c0ec, 0xf2f0ff);
const BONE = ramp(0x665c4a, 0xb2a88c, 0xdfd6be, 0xfaf6e6);
const RUST = ramp(0x2c1a16, 0x5a3626, 0x86543a, 0xb07a52);
const BARK = ramp(0x1a120e, 0x3a2a1e, 0x5a442e, 0x7e6646);
const MOSS = ramp(0x16281a, 0x2c4a28, 0x487038, 0x6e9a4e);
const DEVIL = ramp(0x260e12, 0x521c26, 0x80323e, 0xae5658);
const FEATHER = ramp(0x1e1a22, 0x3c343e, 0x5e5460, 0x847a86);
const RAG = ramp(0x1c1a20, 0x34303a, 0x504a56, 0x6e6876);
const WHEAT = ramp(0x8a6a24, 0xc09a3c, 0xe2c460, 0xf6e294);

/** A cowl over a painted head: for things that have no face under it. */
const cowl = (c: Ramp): Feature => (b, a) => {
  const { hx0, hx1, hy0, hy1, view } = a;
  if (view === 'up') {
    for (let y = hy0 - 1; y <= hy1 + 1; y++) run(b, y, hx0 - (y > hy0 ? 1 : -1), hx1 + (y > hy0 ? 1 : -1), c, y === hy0 - 1 ? 1 : 0);
    return;
  }
  if (view === 'side') {
    for (let y = hy0 - 1; y <= hy1 + 1; y++) run(b, y, hx0 - 1, y <= hy0 + 1 ? hx1 - (y === hy0 - 1 ? 2 : 0) : hx0 + Math.round((hx1 - hx0) * 0.42), c, y === hy0 - 1 ? 1 : 0);
    return;
  }
  for (let y = hy0 - 1; y <= hy1 + 1; y++) {
    if (y <= hy0 + 1) run(b, y, hx0 - (y >= hy0 ? 1 : -1), hx1 + (y >= hy0 ? 1 : -1), c, y === hy0 - 1 ? 1 : 0);
    else { b.set(hx0 - 1, y, c[2]); b.set(hx0, y, c[1]); b.set(hx1, y, c[1]); b.set(hx1 + 1, y, c[0]); }
  }
};

/** A rusted helmet on a painted skull. */
const casque = (m: Ramp): Feature => (b, a) => {
  const { hx0, hx1, hy0, view } = a;
  const mid = (hx0 + hx1 + 1) >> 1;
  b.set(mid - 1, hy0 - 2, m[3]);
  run(b, hy0 - 1, hx0 + 2, hx1 - 2, m, 1);
  run(b, hy0, hx0, hx1, m);
  run(b, hy0 + 1, hx0, hx1, m, -1);
  for (let x = hx0; x <= hx1; x++) b.set(x, hy0 + 2, (x & 1) === 0 ? m[0] : m[1]);
  if (view === 'down') for (let y = hy0 + 3; y <= a.eyeY + 1; y++) b.set(mid - 1, y, m[2]);
  if (view === 'side') for (let y = hy0 + 3; y <= a.eyeY + 1; y++) b.set(hx1, y, m[2]);
};

const weeds: Feature = (b, a) => {
  for (let k = 0; k < 5; k++) {
    const x = a.tx0 - 1 + k * 3 + (a.view === 'side' ? 1 : 0);
    const len = 2 + (hash2(k, 5, 2) % 3);
    for (let i = 0; i < len; i++) b.set(x + (i > 1 ? (k & 1 ? 1 : -1) : 0), a.shoulderY + 1 + i, WEED[i % 2 ? 2 : 3]);
  }
  // water still running off it
  for (const h of a.hands) if ((a.frame + h[0]) % 2 === 0) b.set(h[0] + 1, h[1] + 3, rgb(0x86c8b4));
};

const fins: Feature = (b, a) => {
  const c = SLIME;
  if (a.view === 'side') { for (let i = 0; i < 3; i++) { b.set(a.hx0 - 1 - i, a.hy0 + 1 + i, c[2]); b.set(a.hx0 - i, a.hy0 + 2 + i, c[0]); } for (let i = 0; i < 4; i++) b.set(a.tx0 - 1, a.shoulderY + i, i % 2 ? c[3] : c[1]); return; }
  for (const s of [-1, 1]) {
    const x = s < 0 ? a.hx0 : a.hx1;
    for (let i = 0; i < 2; i++) { b.set(x + s * (i + 1), a.hy0 + 2 + i, c[s < 0 ? 3 : 1]); b.set(x + s * (i + 1), a.hy0 + 3 + i, c[0]); }
  }
};

/** Antlers, sized to fit over a head in a cell two tiles tall. */
const antlers = (c: Ramp): Feature => (b, a) => {
  const top = a.hy0;
  const mid = (a.hx0 + a.hx1 + 1) >> 1;
  for (const s of a.view === 'side' ? [1] : [-1, 1]) {
    const x0 = a.view === 'side' ? mid : mid + s * 2;
    // the beam, then its tines
    stroke(b, x0, top, x0 + s * 3, top - 3, c[2]);
    stroke(b, x0 + s * 3, top - 3, x0 + s * 4, top - 6, c[1]);
    stroke(b, x0 + s * 2, top - 2, x0 + s * 5, top - 2, c[1]);
    stroke(b, x0 + s * 3, top - 4, x0 + s * 6, top - 5, c[2]);
    b.set(x0 + s * 4, top - 7, c[3]);
    b.set(x0 + s * 6, top - 6, c[3]);
  }
};

const horns = (c: Ramp): Feature => (b, a) => {
  for (const s of a.view === 'side' ? [1] : [-1, 1]) {
    const x = (s < 0 ? a.hx0 : a.hx1) + (a.view === 'side' ? -3 : 0);
    b.set(x, a.hy0, c[1]); b.set(x + s, a.hy0 - 1, c[2]); b.set(x + s, a.hy0 - 2, c[2]); b.set(x, a.hy0 - 3, c[3]); b.set(x - s, a.hy0 - 4, c[3]);
  }
};

const tail = (c: Ramp): Feature => (b, a) => {
  if (a.view === 'down') return;
  const x0 = a.view === 'side' ? a.tx0 - 1 : a.cx;
  for (let i = 0; i < 7; i++) b.set(x0 - (a.view === 'side' ? Math.round(i * 0.8) : Math.round(Math.sin(i * 0.8 + a.frame) * 2)), a.waistY + 1 + i, c[i > 5 ? 3 : 1]);
};

/** One eye where two should be: Licho, misfortune itself. */
const oneEye: Feature = (b, a) => {
  if (a.view === 'up') return;
  const x = a.view === 'side' ? a.hx1 - 3 : a.cx - 2;
  const w = a.view === 'side' ? 3 : 4;
  for (let j = -1; j <= 1; j++) for (let i = 0; i < w; i++) b.set(x + i, a.eyeY + j, j === 0 && (i === 1 || i === 2) ? rgb(0xc8242c) : rgb(0xf4efe4));
  b.set(x + 1, a.eyeY, rgb(0x1a1423));
};

const owlFace: Feature = (b, a) => {
  const { hx0, hx1, hy0, view } = a;
  for (const s of view === 'side' ? [-1] : [-1, 1]) { const x = s < 0 ? hx0 : hx1; b.set(x, hy0 - 1, FEATHER[1]); b.set(x + s, hy0 - 2, FEATHER[2]); b.set(x + s, hy0 - 3, FEATHER[0]); }
  if (view === 'up') return;
  // not the round eyes of a bird in a picture book: two sockets, and a light at the bottom of each
  for (const x of view === 'side' ? [hx1 - 3] : [a.cx - 4, a.cx + 1]) {
    for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) b.set(x + i, a.eyeY - 1 + j, FEATHER[0]);
    b.set(x + 1, a.eyeY, rgb(0xffd24a));
    b.set(x + 1, a.eyeY + 1, rgb(0xc88a2a));
  }
  const bx = view === 'side' ? hx1 : a.cx - 1;
  b.set(bx, a.eyeY + 1, BONE[2]); b.set(bx, a.eyeY + 2, BONE[1]);
  if (view === 'down') for (let y = a.shoulderY + 2; y < a.waistY; y += 2) for (let x = a.tx0 + 1; x < a.tx1; x += 2) b.set(x + ((y >> 1) & 1), y, FEATHER[3]);
};

const sickle: Feature = (b, a) => {
  const hand = a.hands[a.hands.length - 1];
  if (!hand) return;
  const x = hand[0] + 2;
  const y = hand[1];
  for (let i = 0; i < 3; i++) b.set(x, y - i, BLACK[2]);
  for (const [dx, dy] of [[0, -3], [1, -4], [2, -5], [3, -5], [4, -4], [4, -3]]) b.set(x + dx, y + dy, STEEL[3]);
  b.set(x + 3, y - 4, STEEL[1]);
};

const wreath: Feature = (b, a) => {
  for (let x = a.hx0; x <= a.hx1; x += 2) { b.set(x, a.hy0 + 1, WHEAT[2]); b.set(x, a.hy0, WHEAT[3]); }
};

const rustySword: Feature = (b, a) => {
  const hand = a.hands[a.hands.length - 1];
  if (!hand || a.view === 'up') return;
  stroke(b, hand[0] + 1, hand[1] - 1, hand[0] + 5, hand[1] - 9, RUST[3]);
  stroke(b, hand[0] + 2, hand[1] - 1, hand[0] + 6, hand[1] - 9, RUST[1]);
  b.set(hand[0], hand[1] - 2, RUST[2]); b.set(hand[0] + 3, hand[1] - 1, RUST[2]);
};

const mossy: Feature = (b, a) => {
  for (let x = a.tx0 - 1; x <= a.tx1 + 1; x++) {
    const hs = hash2(x, a.view === 'up' ? 9 : 4, 6);
    if (hs % 3 === 0) continue;
    const len = 1 + (hs % 3);
    for (let i = 0; i < len; i++) b.set(x, a.shoulderY - 1 + i, MOSS[i === 0 ? 3 : 2 - (i % 2)]);
  }
  for (const h of a.hands) for (let i = 0; i < 2; i++) b.set(h[0] + 1, h[1] - 5 + i * 2, MOSS[2]);
};

/** The usual shape of something that stalks: one and a half tiles, a hung head, arms to the ground. */
const monster = (over: Partial<Figure>): Figure => ({
  w: 16, h: 24,
  head: { w: 10, h: 9 }, neck: 0, shoulder: 8, waist: 6, torsoH: 6, skirt: 0,
  arm: { w: 2, len: 8 }, leg: { w: 2, len: 5, gap: 2 }, bootH: 0,
  skin: PALE, hair: BLACK, top: PALE, bottom: RAG, boots: RAG, outline: rgb(0x0e0a14),
  hairStyle: 'none', face: 'hollow', eye: rgb(0xfff0a0), hands: 'claw', hunch: 2,
  ...over,
});

// ------------------------------------------------------------------ animals, drawn by hand
// 24 x 16 (one tile tall, one and a half long), in profile, facing right. o = outline.

function strip(width: number, pal: Record<string, Color>, frames: string[][]): PixelBuffer[] {
  return frames.map((rows) => fromAscii(art(width, rows), pal));
}

/** Replaces the bottom rows of a drawing: one body, several ways of putting its feet down. */
const legs = (body: string[], feet: string[]): string[] => [...body.slice(0, body.length - feet.length), ...feet];

const WOLF = [
  '.................o..o...',
  '................ogo.olo.',
  '................oggoglo.',
  '....oooooooooooooggglo..',
  '...olllllllllllllggeggo.',
  '..oggggggggggggggggggwwn',
  '.odgggggggggggggggggwwwo',
  'odddgggggggggggggggwoto.',
  'oddodggggggggggggwwwo...',
  'oddoodggwwwwwwwgggwwo...',
  'oddo.oddgoooooooogggwo..',
  '.oo..oddodo..odoggwo....',
  '....oddodo...odoggo.....',
  '....ododo....odogo......',
  '....odloo....odogllo....',
  '....oooo.....ooooooo....',
];
const WOLF_REACH = legs(WOLF, [
  '.oo.oddodo.....odoggwo..',
  '...oddodo.......odoggo..',
  '..oddodo.........odogo..',
  '.odloo............ogllo.',
  '.oooo.............ooooo.',
]);
const WOLF_GATHER = legs(WOLF, [
  '.oo...oddo...oggwo......',
  '.......oddo.oggo........',
  '........oddoggo.........',
  '........odloglo.........',
  '........ooooooo.........',
]);
const wolfPal = (d: number, g: number, l: number, w: number, eye: number, out: number): Record<string, Color> => ({
  o: rgb(out), d: rgb(d), g: rgb(g), l: rgb(l), w: rgb(w), e: rgb(eye), n: rgb(out), t: rgb(0xf6f1e6),
});

const BOAR = [
  '........................',
  '.........m.m.m.m........',
  '........mmmmmmmmm.......',
  '.....oooMMMMMMMMMoo.....',
  '...ooddddMMMMMMdddooo...',
  'o.odddddddddddddddlllo..',
  '.oddddddddddddddddlelloo',
  'oDddddddddddddddddlllnno',
  'oDDdddddddddddddddllwnNo',
  'oDDDddddddddddddddwwooo.',
  '.oDDDDdddddddDDdddoo....',
  '..oDDDDooooooDDDDo......',
  '..oDDDo......oDDDo......',
  '..ohho.......ohho.......',
  '..oooo.......oooo.......',
  '........................',
];
const BOAR_STEP = legs(BOAR, [
  '.oDDDo........oDDDo.....',
  '.ohho.........ohho......',
  '.oooo.........oooo......',
  '........................',
]);
const BOAR_GATHER = legs(BOAR, [
  '...oDDDo....oDDDo.......',
  '...ohho.....ohho........',
  '...oooo.....oooo........',
  '........................',
]);
const BOAR_PAL: Record<string, Color> = {
  o: rgb(0x140e0e), d: rgb(0x6a5248), D: rgb(0x46342e), l: rgb(0x8c7264), m: rgb(0x221a1c), M: rgb(0x3a2c2c),
  e: rgb(0xf0e0c0), n: rgb(0xb88474), N: rgb(0x7a4e48), w: rgb(0xf6f1e6), h: rgb(0x1c1416),
};

const VIPER = [
  '................',
  '................',
  '................',
  '..........ooo...',
  '.........ogggo..',
  '.........ogegor.',
  '..........oggo.r',
  '....oooo..ogo...',
  '..oogzgzoooggo..',
  '.ogzgggzgzggo...',
  'ogzgooooogzgo...',
  'ogggo...ogggo...',
  '.ogzgoooogzgo...',
  '..oggzgzggggo...',
  '...oooooooooo...',
  '................',
];
const VIPER_SWAY = [
  ...VIPER.slice(0, 3),
  '.........ooo....',
  '........ogggo...',
  '........ogegorr.',
  '.........oggo...',
  '....oooo.ogo....',
  ...VIPER.slice(8),
];
const VIPER_PAL: Record<string, Color> = { o: rgb(0x10140e), g: rgb(0x4a5a2e), z: rgb(0xc8a23a), e: rgb(0xe8342c), r: rgb(0xd8443c) };

const cycle = (stand: PixelBuffer, a: PixelBuffer, b: PixelBuffer): PixelBuffer[] => [stand, a, b, a, b];

// ------------------------------------------------------------------ the bestiary

const wolfFrames = (pal: Record<string, Color>): PixelBuffer[] => {
  const [s, a, b] = strip(24, pal, [WOLF, WOLF_REACH, WOLF_GATHER]);
  return cycle(s, a, b);
};
const boarFrames = (): PixelBuffer[] => {
  const [s, a, b] = strip(24, BOAR_PAL, [BOAR, BOAR_STEP, BOAR_GATHER]);
  return cycle(s, a, b);
};
const viperFrames = (): PixelBuffer[] => {
  const [s, a] = strip(16, VIPER_PAL, [VIPER, VIPER_SWAY]);
  return [s, s, a, a, s];
};

/** `mobs` sheet frames of the two small things the game already has (see MOB in actors.ts). */
const MOB_OGNIK: [number, number] = [8, 4];
const MOB_MOROWNIK: [number, number] = [32, 2];

export const CREATURES: Creature[] = [
  // ---- one tile
  {
    id: 'ognik', tiles: 1, mob: MOB_OGNIK,
    kind: { pl: 'Ognik', en: 'Wisp' }, name: { pl: 'ognik', en: 'wisp' },
    note: { pl: 'błędny ogień nad bagnem; z gry, bez zmian', en: 'marsh fire; from the game, unchanged' },
  },
  {
    id: 'morownik', tiles: 1, mob: MOB_MOROWNIK,
    kind: { pl: 'Morownik', en: 'Blight bloom' }, name: { pl: 'morownik', en: 'blight bloom' },
    note: { pl: 'kwiat skazy; z gry, bez zmian', en: 'the flower of the blight; from the game, unchanged' },
  },
  {
    id: 'zmija', tiles: 1, frames: viperFrames(),
    kind: { pl: 'Żmija', en: 'Viper' }, name: { pl: 'żmija', en: 'viper' },
    note: { pl: 'zwinięta, z uniesionym łbem; zygzak na grzbiecie', en: 'coiled, head raised; a zigzag down its back' },
  },
  {
    id: 'wilk', tiles: 1, frames: wolfFrames(wolfPal(0x3a3844, 0x66626e, 0x908c9a, 0xbcb8c4, 0xf6d24a, 0x14121a)),
    kind: { pl: 'Wilk A', en: 'Wolf A' }, name: { pl: 'wilk szary', en: 'grey wolf' },
    note: { pl: 'chudy, ze zwieszonym łbem, żółte oko; rysowany ręcznie', en: 'lean, head hung low, a yellow eye; drawn by hand' },
  },
  {
    id: 'wilk-skazy', tiles: 1, frames: wolfFrames(wolfPal(0x1c1626, 0x3c3050, 0x5c4c78, 0x8a7aa4, 0xff5ad8, 0x0a0610)),
    kind: { pl: 'Wilk B', en: 'Wolf B' }, name: { pl: 'wilk skazy', en: 'blight wolf' },
    note: { pl: 'ten sam wilk, którego dotknęła skaza: fiolet i oko w kolorze Nawi', en: 'the same wolf, touched by the blight: violet, and an eye the colour of Nawia' },
  },
  {
    id: 'dzik', tiles: 1, frames: boarFrames(),
    kind: { pl: 'Dzik', en: 'Boar' }, name: { pl: 'dzik', en: 'boar' },
    note: { pl: 'garb ze szczeciną, łeb nisko, szable; rysowany ręcznie', en: 'a bristled hump, head low, tusks; drawn by hand' },
  },
  // ---- one and a half tiles
  {
    id: 'topielec', tiles: 1.5,
    kind: { pl: 'Utopiec A', en: 'Drowned one A' }, name: { pl: 'topielec', en: 'the corpse' },
    note: { pl: 'opuchnięty trup w wodorostach, ręce do ziemi', en: 'a bloated corpse in weeds, arms to the ground' },
    figure: monster({ w: 24, skin: ROT, top: ROT, shoulder: 10, waist: 11, torsoH: 7, leg: { w: 3, len: 4, gap: 0 }, arm: { w: 3, len: 8 }, hair: WEED, hairStyle: 'curtain', over: weeds }),
  },
  {
    id: 'wodnik', tiles: 1.5,
    kind: { pl: 'Utopiec B', en: 'Drowned one B' }, name: { pl: 'wodnik', en: 'the water-man' },
    note: { pl: 'chudy, śliski, płetwy zamiast uszu, oczy jak u ryby', en: 'thin, slick, fins for ears, the eyes of a fish' },
    figure: monster({ skin: SLIME, top: SLIME, bottom: SLIME, boots: SLIME, head: { w: 8, h: 9 }, shoulder: 7, waist: 5, arm: { w: 2, len: 9 }, leg: { w: 2, len: 6, gap: 0 }, eye: rgb(0xf4fff4), ribs: true, hunch: 1, over: fins }),
  },
  {
    id: 'jedza', tiles: 1.5,
    kind: { pl: 'Strzyga A', en: 'Strzyga A' }, name: { pl: 'jędza', en: 'the hag' },
    note: { pl: 'wychudła, zgarbiona, szpony do ziemi, włosy na twarzy', en: 'gaunt, bent, claws to the ground, hair over her face' },
    figure: monster({ head: { w: 9, h: 9 }, shoulder: 7, waist: 5, top: WINE, bottom: PALE, skirt: 4, trim: rgb(0x1a0c18), arm: { w: 2, len: 9 }, hunch: 3, hairStyle: 'wild', eye: rgb(0xff3a4a), ribs: true }),
  },
  {
    id: 'sowa', tiles: 1.5,
    kind: { pl: 'Strzyga B', en: 'Strzyga B' }, name: { pl: 'sowa', en: 'the owl' },
    note: { pl: 'płaszcz z piór, oczy jak latarnie, dziób, szpony', en: 'a mantle of feathers, lantern eyes, a beak, talons' },
    figure: monster({ w: 24, skin: FEATHER, top: FEATHER, cloak: FEATHER, bottom: BONE, boots: BONE, face: 'none', leg: { w: 2, len: 5, gap: 4 }, arm: { w: 3, len: 7 }, hunch: 3, over: owlFace }),
  },
  {
    id: 'calun', tiles: 1.5,
    kind: { pl: 'Zjawa A', en: 'Wraith A' }, name: { pl: 'całun', en: 'the shroud' },
    note: { pl: 'pusty kaptur, w środku dwa światła; rozwiewa się u dołu', en: 'an empty hood with two lights in it; it frays into nothing' },
    figure: monster({ skin: SHROUD, top: SHROUD, bottom: SHROUD, head: { w: 9, h: 9 }, shoulder: 7, robe: true, wisp: true, fade: 5, eye: rgb(0xff7ad8), hunch: 1, arm: { w: 2, len: 7 }, outline: rgb(0x2a1a52), over: cowl(SHROUD) }),
  },
  {
    id: 'poludnica', tiles: 1.5,
    kind: { pl: 'Zjawa B', en: 'Wraith B' }, name: { pl: 'południca', en: 'the noon-wife' },
    note: { pl: 'kobieta w bieli, czarne włosy na twarzy, sierp, wianek z kłosów', en: 'a woman in white, black hair over her face, a sickle, a wreath of wheat' },
    figure: monster({ skin: PALE, top: WHITE, bottom: WHITE, robe: true, fade: 3, hair: BLACK, hairStyle: 'curtain', eye: rgb(0xffffff), hunch: 1, hands: 'hand', arm: { w: 2, len: 6 }, shoulder: 7, over: all(wreath, sickle) }),
  },
  {
    id: 'upior', tiles: 1.5,
    kind: { pl: 'Upiór', en: 'The revenant' }, name: { pl: 'upiór', en: 'revenant' },
    note: { pl: 'drużynnik, który nie odszedł: kości, rdza, czerwień w oczodołach', en: 'a man-at-arms who never left: bone, rust, red in the sockets' },
    figure: monster({ skin: BONE, top: BONE, bottom: BONE, boots: RUST, bootH: 1, face: 'skull', eye: rgb(0xff3a2a), ribs: true, hunch: 1, hands: 'hand', arm: { w: 2, len: 6 }, leg: { w: 2, len: 6, gap: 2 }, waist: 4, belt: RUST[1], over: all(casque(RUST), rustySword) }),
  },
  {
    id: 'licho', tiles: 1.5,
    kind: { pl: 'Licho', en: 'Licho' }, name: { pl: 'licho', en: 'licho' },
    note: { pl: 'nieszczęście we własnej osobie: jedno oko, sama skóra i kości', en: 'misfortune in person: one eye, skin and bone' },
    figure: monster({ skin: PALE, top: RAG, bottom: RAG, shoulder: 6, waist: 4, skirt: 3, arm: { w: 2, len: 9 }, hair: WHITE, hairStyle: 'wild', face: 'none', hunch: 2, over: oneEye }),
  },
  // ---- two tiles
  {
    id: 'bies', tiles: 2,
    kind: { pl: 'Bies', en: 'Bies' }, name: { pl: 'bies', en: 'bies' },
    note: { pl: 'rogi, ogon, kopyta: stary diabeł z bagien', en: 'horns, a tail, hooves: the old devil of the marsh' },
    figure: monster({ w: 24, h: 32, skin: DEVIL, top: DEVIL, bottom: ramp(0x120a0c, 0x2a1a1c, 0x44302e, 0x5e4840), boots: BLACK, bootH: 2, shoulder: 12, waist: 9, torsoH: 9, arm: { w: 4, len: 10 }, leg: { w: 4, len: 7, gap: 0 }, eye: rgb(0xffd24a), under: tail(DEVIL), over: horns(BONE) }),
  },
  {
    id: 'leszy', tiles: 2,
    kind: { pl: 'Leszy', en: 'Leshy' }, name: { pl: 'leszy', en: 'leshy' },
    note: { pl: 'pan lasu: kora, mech, poroże, czaszka zamiast twarzy', en: 'the lord of the forest: bark, moss, antlers, a skull for a face' },
    figure: monster({ w: 24, h: 32, skin: BONE, top: BARK, bottom: BARK, boots: BARK, head: { w: 9, h: 9 }, shoulder: 12, waist: 8, torsoH: 10, arm: { w: 3, len: 13 }, leg: { w: 4, len: 7, gap: 0 }, cloak: MOSS, face: 'skull', eye: rgb(0x9af46a), hunch: 1, over: all(antlers(BONE), mossy) }),
  },
];
