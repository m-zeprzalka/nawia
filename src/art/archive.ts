// The archive: earlier drawings, kept so they can still be compared in the playground.
//
// Nothing is thrown away while a look is being chosen: what was drawn before stays here, as it was.
//  - the hero and the villagers posed by the figure painter (rig.ts) under hand-drawn heads (12 x 10):
//    the generation before the hand-drawn dolls (dolls.ts);
//  - the first hand-drawn animals: a coiled viper, the first wolf and boar.
// Nothing here is used by the game.

import { PixelBuffer, fromAscii, rgb, type Color } from '../core/PixelBuffer.ts';
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

/** The first hand-drawn animals, as they were. */
export const OLD_BEASTS: { id: string; name: { pl: string; en: string }; frames: PixelBuffer[] }[] = [
  { id: 'zmija-1', name: { pl: 'żmija (1)', en: 'viper (1)' }, frames: viperFrames() },
  { id: 'wilk-1', name: { pl: 'wilk (1)', en: 'wolf (1)' }, frames: wolfFrames(wolfPal(0x3a3844, 0x66626e, 0x908c9a, 0xbcb8c4, 0xf6d24a, 0x14121a)) },
  { id: 'wilk-skazy-1', name: { pl: 'wilk skazy (1)', en: 'blight wolf (1)' }, frames: wolfFrames(wolfPal(0x1c1626, 0x3c3050, 0x5c4c78, 0x8a7aa4, 0xff5ad8, 0x0a0610)) },
  { id: 'dzik-1', name: { pl: 'dzik (1)', en: 'boar (1)' }, frames: boarFrames() },
];
