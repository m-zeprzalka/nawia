// The cast of the playground: heroes, villagers and monsters described for the figure painter (rig.ts).
//
// Nothing here is used by the game yet. It exists so that looks can be put side by side and judged:
// the same hero in five costumes and two builds, each monster in more than one reading.
// What is chosen moves into the game; what is not gets deleted.
//
// A monster should be read at a glance and should not be liked: long arms, a hung head,
// eyes that are only lights, and more height than the hero has.

import { PixelBuffer, rgb, type Color } from '../core/PixelBuffer.ts';
import { hash2 } from '../core/rng.ts';
import { run, stroke, type Anchors, type Beast, type Figure, type Ramp } from './rig.ts';

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
const NAVY = ramp(0x1c2434, 0x334058, 0x4c5c78, 0x6c80a0);
const BLUE = ramp(0x243a58, 0x3c5c84, 0x5a80aa, 0x86aad0);
const LEATHER = ramp(0x36221c, 0x5a3c2a, 0x80583a, 0xa67a50);
const STEEL = ramp(0x444e5c, 0x7e8c9c, 0xb4c0cc, 0xe8f0f6);
const GREEN = ramp(0x1c3024, 0x325036, 0x4c7246, 0x709c5e);
const STRAW = ramp(0x8a6a24, 0xc09a3c, 0xe2c460, 0xf6e294);
const FUR = ramp(0x2e2018, 0x54402e, 0x786048, 0x9c8464);
const FLEECE = ramp(0x8c7c5c, 0xc8b88e, 0xe6dab4, 0xfaf2d6);

// ------------------------------------------------------------------ builds

/** Proportions. MID is a SNES adventure hero (about 2.6 heads tall), TALL a Mega Drive RPG one (3.5 heads). */
type Build = Pick<Figure, 'w' | 'h' | 'head' | 'neck' | 'shoulder' | 'waist' | 'torsoH' | 'skirt' | 'arm' | 'leg' | 'bootH'>;
export const BUILDS: Record<'mid' | 'tall', Build> = {
  mid: { w: 16, h: 24, head: { w: 8, h: 7 }, neck: 0, shoulder: 8, waist: 6, torsoH: 6, skirt: 2, arm: { w: 2, len: 5 }, leg: { w: 3, len: 6, gap: 0 }, bootH: 2 },
  tall: { w: 24, h: 32, head: { w: 8, h: 8 }, neck: 1, shoulder: 10, waist: 8, torsoH: 9, skirt: 3, arm: { w: 3, len: 8 }, leg: { w: 4, len: 10, gap: 0 }, bootH: 3 },
};

// ------------------------------------------------------------------ things worn and carried

const band = (c: Ramp): Feature => (b, a) => {
  const y = a.hy0 + 2;
  for (let x = a.hx0; x <= a.hx1; x++) b.set(x, y, x < (a.hx0 + a.hx1) / 2 ? c[2] : c[1]);
  if (a.view === 'side') { b.set(a.hx0 - 1, y, c[1]); b.set(a.hx0 - 2, y + 1, c[1]); b.set(a.hx0 - 1, y + 1, c[0]); }
  if (a.view === 'up') { b.set(a.cx, y + 1, c[1]); b.set(a.cx - 1, y + 2, c[0]); }
};

/** A conical helmet with a nasal bar: what a warrior of the tenth century actually wore. */
const helmet = (m: Ramp): Feature => (b, a) => {
  const { hx0, hx1, hy0, view } = a;
  const mid = (hx0 + hx1 + 1) >> 1;
  b.set(mid - 1, hy0 - 3, m[3]);
  run(b, hy0 - 2, mid - 2, mid, m, 1);
  run(b, hy0 - 1, hx0 + 1, hx1 - 1, m, 1);
  run(b, hy0, hx0, hx1, m);
  run(b, hy0 + 1, hx0, hx1, m);
  run(b, hy0 + 2, hx0, hx1, m, -1);
  for (let x = hx0; x <= hx1; x++) b.set(x, hy0 + 3, (x & 1) === 0 ? m[0] : m[1]); // the rim, riveted
  if (view === 'down') for (let y = hy0 + 4; y <= a.eyeY + 1; y++) { b.set(mid - 1, y, m[2]); b.set(mid, y, m[0]); }
  if (view === 'side') for (let y = hy0 + 4; y <= a.eyeY + 1; y++) b.set(hx1, y, m[2]);
};

const hood = (c: Ramp): Feature => (b, a) => {
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

const strawHat = (s: Ramp, ribbon: Color): Feature => (b, a) => {
  const { hx0, hx1, hy0 } = a;
  run(b, hy0 - 2, hx0 + 2, hx1 - 2, s, 1);
  run(b, hy0 - 1, hx0 + 1, hx1 - 1, s);
  for (let x = hx0 + 1; x <= hx1 - 1; x++) b.set(x, hy0, ribbon);
  run(b, hy0 + 1, hx0 - 3, hx1 + 3, s, 1);
  run(b, hy0 + 2, hx0 - 2, hx1 + 2, s, -1);
};

const furCap = (f: Ramp): Feature => (b, a) => {
  for (let y = a.hy0 - 2; y <= a.hy0 + 2; y++) {
    const wide = y >= a.hy0 ? 1 : y === a.hy0 - 2 ? -1 : 0;
    run(b, y, a.hx0 - wide, a.hx1 + wide, f, y === a.hy0 - 2 ? 1 : 0);
    for (let x = a.hx0; x <= a.hx1; x++) if (hash2(x, y, 3) % 4 === 0) b.set(x, y, f[0]);
  }
};

/** A sword at the hip: a hilt at the belt, a scabbard behind the leg. */
const sword: Feature = (b, a) => {
  const hilt = rgb(0xd8a84a);
  if (a.view === 'down') {
    const x = a.tx0 - 1;
    b.set(x, a.waistY, hilt); b.set(x - 1, a.waistY, hilt); b.set(x - 1, a.waistY - 1, rgb(0x9af4ff));
    stroke(b, x - 1, a.waistY + 1, x - 3, a.waistY + 6, LEATHER[0]);
  } else if (a.view === 'side') {
    stroke(b, a.cx - 2, a.waistY + 1, a.cx - 8, a.waistY + 6, LEATHER[0]);
    b.set(a.cx - 1, a.waistY, hilt); b.set(a.cx, a.waistY - 1, hilt);
  } else {
    stroke(b, a.tx1 + 1, a.waistY + 1, a.tx1 + 3, a.waistY + 6, LEATHER[0]);
  }
};

const bow: Feature = (b, a) => {
  const c = LEATHER[2];
  if (a.view === 'up') { stroke(b, a.cx - 4, a.shoulderY - 2, a.cx + 4, a.waistY + 4, c); stroke(b, a.cx - 3, a.shoulderY - 2, a.cx + 5, a.waistY + 4, LEATHER[0]); }
  else if (a.view === 'side') for (let i = -5; i <= 5; i++) b.set(a.tx0 - 2 - Math.round((1 - (i * i) / 25) * 2), a.shoulderY + 4 + i, c);
  else { b.set(a.tx1 + 1, a.shoulderY - 1, c); b.set(a.tx1 + 2, a.shoulderY - 2, c); }
};

const staff: Feature = (b, a) => {
  const hand = a.hands[a.hands.length - 1];
  if (!hand || a.view === 'up') return;
  const x = hand[0] + (a.view === 'side' ? 2 : 3);
  for (let y = a.hy0 + 1; y <= a.foot; y++) { b.set(x, y, LEATHER[2]); b.set(x + 1, y, LEATHER[0]); }
  b.set(x, a.hy0, LEATHER[3]);
};

const beard = (c: Ramp): Feature => (b, a) => {
  if (a.view === 'up') return;
  if (a.view === 'side') { for (let i = 0; i < 4; i++) run(b, a.eyeY + 2 + i, a.hx1 - 3 + (i > 2 ? 1 : 0), a.hx1 - (i > 1 ? 1 : 0), c); return; }
  for (let i = 0; i < 5; i++) run(b, a.eyeY + 2 + i, a.cx - 3 + (i > 2 ? i - 2 : 0), a.cx + 2 - (i > 2 ? i - 2 : 0), c, i === 0 ? 1 : 0);
};

const apron: Feature = (b, a) => {
  if (a.view !== 'down') return;
  for (let y = a.waistY + 1; y <= a.foot - 3; y++) run(b, y, a.cx - 3, a.cx + 2, LINEN);
};

// ------------------------------------------------------------------ the hero, five ways

export interface Costume {
  id: string;
  name: { pl: string; en: string };
  make: (build: Build) => Figure;
}

const person = (build: Build, over: Partial<Figure>): Figure => ({
  ...build,
  skin: SKIN, hair: BROWN, top: LINEN, bottom: NAVY, boots: LEATHER, outline: OUT,
  hairStyle: 'short', face: 'human', eye: rgb(0x2b1f30), belt: LEATHER[1],
  ...over,
});
const SHIELD = { rim: LEATHER, face: rgb(0xb42f3b), cross: rgb(0xeadfc4), boss: rgb(0xb9c4cc) };

export const HEROES: Costume[] = [
  {
    id: 'wojak',
    name: { pl: 'Wojak', en: 'Warrior' },
    make: (b) => person(b, { hair: BLOND, cloak: RED, trim: RED[1], shield: SHIELD, over: all(band(RED), sword) }),
  },
  {
    id: 'druzynnik',
    name: { pl: 'Drużynnik', en: 'Man-at-arms' },
    make: (b) => person(b, { top: STEEL, bottom: BROWN, cloak: BLUE, shield: { ...SHIELD, face: rgb(0x3c5c84) }, over: all(helmet(STEEL), sword) }),
  },
  {
    id: 'lowca',
    name: { pl: 'Łowca', en: 'Hunter' },
    make: (b) => person(b, { top: LEATHER, bottom: ramp(0x23301f, 0x3a4a30, 0x566848, 0x748a62), cloak: GREEN, under: bow, over: all(hood(GREEN), sword) }),
  },
  {
    id: 'pastuszek',
    name: { pl: 'Pastuszek', en: 'Shepherd boy' },
    make: (b) => person(b, { trim: RED[1], bottom: BROWN, over: all(strawHat(STRAW, RED[1]), staff) }),
  },
  {
    id: 'goral',
    name: { pl: 'Góral', en: 'Highlander' },
    make: (b) => person(b, { hair: BLACK, top: FLEECE, trim: LEATHER[1], bottom: RED, shield: SHIELD, over: all(furCap(FUR), sword) }),
  },
];

// ------------------------------------------------------------------ villagers

export const FOLK_CAST: Costume[] = [
  {
    id: 'zielarka',
    name: { pl: 'Zielarka', en: 'Herbalist' },
    make: (b) => person(b, { robe: true, hair: WHITE, hairStyle: 'long', top: ramp(0x4a3424, 0x74523a, 0x967252, 0xb8946e), bottom: ramp(0x3a2a20, 0x5e4432, 0x80603f, 0xa07e58), belt: undefined, over: all(hood(ramp(0x1e3a34, 0x356056, 0x4f8474, 0x74a894)), apron) }),
  },
  {
    id: 'starzec',
    name: { pl: 'Starzec', en: 'Elder' },
    make: (b) => person(b, { robe: true, hairStyle: 'none', top: LINEN, bottom: LINEN, belt: RED[1], over: all(beard(WHITE), staff) }),
  },
  {
    id: 'gospodyni',
    name: { pl: 'Gospodyni', en: 'Housewife' },
    make: (b) => person(b, { robe: true, hair: BROWN, hairStyle: 'long', top: LINEN, bottom: RED, belt: rgb(0x2f4a7a), over: all(hood(RED), apron) }),
  },
  {
    id: 'dziecko',
    name: { pl: 'Dziecko', en: 'Child' },
    make: () => person({ ...BUILDS.mid, h: 20, torsoH: 5, leg: { w: 3, len: 4, gap: 0 }, arm: { w: 2, len: 4 } }, { hair: BLOND, trim: RED[1] }),
  },
];

// ------------------------------------------------------------------ monsters on two legs

export interface Creature {
  id: string;
  /** what it is ("Strzyga A") and the short name of this reading of it ("jędza") */
  kind: { pl: string; en: string };
  name: { pl: string; en: string };
  /** a one-line note on the idea behind this reading */
  note: { pl: string; en: string };
  figure?: Figure;
  beast?: Beast;
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

const weeds: Feature = (b, a) => {
  for (let k = 0; k < 5; k++) {
    const x = a.tx0 - 2 + k * 3 + (a.view === 'side' ? 1 : 0);
    const len = 3 + (hash2(k, 5, 2) % 4);
    for (let i = 0; i < len; i++) b.set(x + (i > 2 ? (k & 1 ? 1 : -1) : 0), a.shoulderY + i, WEED[i % 2 ? 2 : 3]);
  }
  // water still running off it
  for (const h of a.hands) if ((a.frame + h[0]) % 2 === 0) b.set(h[0] + 1, h[1] + 4, rgb(0x86c8b4));
};

const fins: Feature = (b, a) => {
  const c = SLIME;
  if (a.view === 'side') { for (let i = 0; i < 4; i++) { b.set(a.hx0 - 1 - i, a.hy0 + 1 + i, c[2]); b.set(a.hx0 - i, a.hy0 + 2 + i, c[0]); } for (let i = 0; i < 6; i++) b.set(a.tx0 - 1, a.shoulderY + i, i % 2 ? c[3] : c[1]); return; }
  for (const s of [-1, 1]) {
    const x = s < 0 ? a.hx0 : a.hx1;
    for (let i = 0; i < 3; i++) { b.set(x + s * (i + 1), a.hy0 + 2 + i, c[s < 0 ? 3 : 1]); b.set(x + s * (i + 1), a.hy0 + 3 + i, c[0]); }
  }
};

const antlers = (c: Ramp): Feature => (b, a) => {
  const top = a.hy0;
  const mid = (a.hx0 + a.hx1 + 1) >> 1;
  for (const s of a.view === 'side' ? [1] : [-1, 1]) {
    const x0 = a.view === 'side' ? mid : mid + s * 2;
    // the beam, then its tines
    stroke(b, x0, top, x0 + s * 4, top - 6, c[2]);
    stroke(b, x0 + s * 4, top - 6, x0 + s * 6, top - 11, c[1]);
    stroke(b, x0 + s * 2, top - 3, x0 + s * 6, top - 4, c[1]);
    stroke(b, x0 + s * 4, top - 6, x0 + s * 8, top - 8, c[2]);
    stroke(b, x0 + s * 5, top - 9, x0 + s * 3, top - 12, c[1]);
    b.set(x0 + s * 6, top - 12, c[3]);
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
  for (let i = 0; i < 8; i++) b.set(x0 - (a.view === 'side' ? Math.round(i * 0.8) : Math.round(Math.sin(i * 0.8 + a.frame) * 2)), a.waistY + 2 + i, c[i > 6 ? 3 : 1]);
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
  // ear tufts
  for (const s of view === 'side' ? [-1] : [-1, 1]) { const x = s < 0 ? hx0 : hx1; b.set(x, hy0 - 1, FEATHER[1]); b.set(x + s, hy0 - 2, FEATHER[2]); b.set(x + s, hy0 - 3, FEATHER[0]); }
  if (view === 'up') return;
  const eye = rgb(0xf6c83a);
  const xs = view === 'side' ? [hx1 - 3] : [a.cx - 3, a.cx + 1];
  for (const x of xs) {
    for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) if (!(i !== 1 && j !== 1) || true) b.set(x + i, a.eyeY - 1 + j, i === 1 && j === 1 ? rgb(0x1a1423) : eye);
  }
  const bx = view === 'side' ? hx1 : a.cx - 1;
  b.set(bx, a.eyeY + 1, BONE[2]); b.set(bx, a.eyeY + 2, BONE[1]); if (view !== 'side') b.set(bx + 1, a.eyeY + 1, BONE[1]);
  if (view === 'down') for (let y = a.shoulderY + 2; y < a.waistY; y += 2) for (let x = a.tx0 + 1; x < a.tx1; x += 2) b.set(x + ((y >> 1) & 1), y, FEATHER[3]);
};

const sickle: Feature = (b, a) => {
  const hand = a.hands[a.hands.length - 1];
  if (!hand) return;
  const x = hand[0] + 2;
  const y = hand[1];
  for (let i = 0; i < 4; i++) b.set(x, y - i, LEATHER[2]);
  for (const [dx, dy] of [[0, -4], [1, -5], [2, -6], [3, -6], [4, -5], [5, -4], [5, -3]]) b.set(x + dx, y + dy, STEEL[3]);
  b.set(x + 4, y - 4, STEEL[1]);
};

const wreath: Feature = (b, a) => {
  for (let x = a.hx0; x <= a.hx1; x += 2) { b.set(x, a.hy0 + 1, WHEAT[2]); b.set(x, a.hy0, WHEAT[3]); }
};

const rustySword: Feature = (b, a) => {
  const hand = a.hands[a.hands.length - 1];
  if (!hand || a.view === 'up') return;
  stroke(b, hand[0] + 1, hand[1] - 1, hand[0] + 6, hand[1] - 11, RUST[3]);
  stroke(b, hand[0] + 2, hand[1] - 1, hand[0] + 7, hand[1] - 11, RUST[1]);
  b.set(hand[0], hand[1] - 2, RUST[2]); b.set(hand[0] + 3, hand[1] - 1, RUST[2]);
};

const mossy: Feature = (b, a) => {
  for (let x = a.tx0 - 1; x <= a.tx1 + 1; x++) {
    const hs = hash2(x, a.view === 'up' ? 9 : 4, 6);
    if (hs % 3 === 0) continue;
    const len = 1 + (hs % 4);
    for (let i = 0; i < len; i++) b.set(x, a.shoulderY - 1 + i, MOSS[i === 0 ? 3 : 2 - (i % 2)]);
  }
  // lichen hanging from the arms
  for (const h of a.hands) for (let i = 0; i < 3; i++) b.set(h[0] + 1, h[1] - 6 + i * 2, MOSS[2]);
};

const monster = (over: Partial<Figure> & Pick<Figure, 'w' | 'h'>): Figure => ({
  head: { w: 8, h: 8 }, neck: 0, shoulder: 10, waist: 8, torsoH: 9, skirt: 0,
  arm: { w: 3, len: 11 }, leg: { w: 3, len: 9, gap: 2 }, bootH: 0,
  skin: PALE, hair: BLACK, top: PALE, bottom: RAG, boots: RAG, outline: rgb(0x0e0a14),
  hairStyle: 'none', face: 'hollow', eye: rgb(0xfff0a0), hands: 'claw', hunch: 2,
  ...over,
});

export const CREATURES: Creature[] = [
  {
    id: 'topielec',
    kind: { pl: 'Utopiec A', en: 'Drowned one A' },
    name: { pl: 'topielec', en: 'the corpse' },
    note: { pl: 'opuchnięty trup w wodorostach, ręce do kolan', en: 'a bloated corpse in weeds, arms to its knees' },
    figure: monster({ w: 24, h: 32, skin: ROT, top: ROT, shoulder: 11, waist: 12, torsoH: 10, leg: { w: 4, len: 8, gap: 0 }, hair: WEED, hairStyle: 'curtain', over: weeds }),
  },
  {
    id: 'wodnik',
    kind: { pl: 'Utopiec B', en: 'Drowned one B' },
    name: { pl: 'wodnik', en: 'the water-man' },
    note: { pl: 'chudy, śliski, płetwy zamiast uszu, oczy jak u ryby', en: 'thin, slick, fins for ears, the eyes of a fish' },
    figure: monster({ w: 24, h: 32, skin: SLIME, top: SLIME, bottom: SLIME, boots: SLIME, head: { w: 7, h: 8 }, shoulder: 8, waist: 6, torsoH: 10, arm: { w: 2, len: 13 }, leg: { w: 3, len: 10, gap: 0 }, eye: rgb(0xf4fff4), ribs: true, over: fins }),
  },
  {
    id: 'jedza',
    kind: { pl: 'Strzyga A', en: 'Strzyga A' },
    name: { pl: 'jędza', en: 'the hag' },
    note: { pl: 'wychudła, zgarbiona, szpony do ziemi, włosy na twarzy', en: 'gaunt, bent, claws to the ground, hair over her face' },
    figure: monster({ w: 24, h: 32, shoulder: 9, waist: 6, top: WINE, bottom: PALE, skirt: 5, trim: rgb(0x1a0c18), arm: { w: 2, len: 14 }, hunch: 4, hairStyle: 'wild', eye: rgb(0xff3a4a), ribs: true }),
  },
  {
    id: 'sowa',
    kind: { pl: 'Strzyga B', en: 'Strzyga B' },
    name: { pl: 'sowa', en: 'the owl' },
    note: { pl: 'płaszcz z piór, oczy jak latarnie, dziób, szpony', en: 'a mantle of feathers, lantern eyes, a beak, talons' },
    figure: monster({ w: 24, h: 32, skin: FEATHER, top: FEATHER, cloak: FEATHER, bottom: BONE, boots: BONE, face: 'none', leg: { w: 2, len: 9, gap: 4 }, arm: { w: 3, len: 10 }, hunch: 3, over: owlFace }),
  },
  {
    id: 'calun',
    kind: { pl: 'Zjawa A', en: 'Wraith A' },
    name: { pl: 'całun', en: 'the shroud' },
    note: { pl: 'pusty kaptur, w środku dwa światła; rozwiewa się u dołu', en: 'an empty hood with two lights in it; it frays into nothing' },
    figure: monster({ w: 24, h: 32, skin: SHROUD, top: SHROUD, bottom: SHROUD, robe: true, fade: 7, eye: rgb(0xff7ad8), hunch: 1, arm: { w: 3, len: 9 }, outline: rgb(0x2a1a52), over: hood(SHROUD) }),
  },
  {
    id: 'poludnica',
    kind: { pl: 'Zjawa B', en: 'Wraith B' },
    name: { pl: 'południca', en: 'the noon-wife' },
    note: { pl: 'kobieta w bieli, czarne włosy na twarzy, sierp, wianek z kłosów', en: 'a woman in white, black hair over her face, a sickle, a wreath of wheat' },
    figure: monster({ w: 24, h: 32, skin: PALE, top: WHITE, bottom: WHITE, robe: true, fade: 4, hair: BLACK, hairStyle: 'curtain', eye: rgb(0xffffff), hunch: 1, hands: 'hand', arm: { w: 2, len: 9 }, shoulder: 8, over: all(wreath, sickle) }),
  },
  {
    id: 'upior',
    kind: { pl: 'Upiór', en: 'The revenant' },
    name: { pl: 'Upiór', en: 'The revenant' },
    note: { pl: 'drużynnik, który nie odszedł: kości, rdza, czerwień w oczodołach', en: 'a man-at-arms who never left: bone, rust, red in the sockets' },
    figure: monster({ w: 24, h: 32, skin: BONE, top: BONE, bottom: BONE, boots: RUST, bootH: 2, face: 'skull', eye: rgb(0xff3a2a), ribs: true, hunch: 1, hands: 'hand', arm: { w: 2, len: 9 }, leg: { w: 2, len: 10, gap: 2 }, shoulder: 9, waist: 5, belt: RUST[1], over: all(helmet(RUST), rustySword) }),
  },
  {
    id: 'licho',
    kind: { pl: 'Licho', en: 'Licho' },
    name: { pl: 'Licho', en: 'Licho' },
    note: { pl: 'nieszczęście we własnej osobie: jedno oko, sama skóra i kości', en: 'misfortune in person: one eye, skin and bone' },
    figure: monster({ w: 24, h: 32, skin: PALE, top: RAG, bottom: RAG, head: { w: 8, h: 9 }, shoulder: 7, waist: 5, torsoH: 10, skirt: 4, arm: { w: 2, len: 13 }, leg: { w: 2, len: 9, gap: 2 }, hair: WHITE, hairStyle: 'wild', face: 'none', hunch: 3, over: oneEye }),
  },
  {
    id: 'bies',
    kind: { pl: 'Bies', en: 'Bies' },
    name: { pl: 'Bies', en: 'Bies' },
    note: { pl: 'rogi, ogon, kopyta: stary diabeł z bagien', en: 'horns, a tail, hooves: the old devil of the marsh' },
    figure: monster({ w: 24, h: 32, skin: DEVIL, top: DEVIL, bottom: ramp(0x120a0c, 0x2a1a1c, 0x44302e, 0x5e4840), boots: BLACK, bootH: 2, shoulder: 12, waist: 9, arm: { w: 4, len: 10 }, leg: { w: 4, len: 9, gap: 0 }, eye: rgb(0xffd24a), under: tail(DEVIL), over: horns(BONE) }),
  },
  {
    id: 'leszy',
    kind: { pl: 'Leszy', en: 'Leshy' },
    name: { pl: 'Leszy', en: 'Leshy' },
    note: { pl: 'pan lasu: kora, mech, poroże; półtora raza wyższy od człowieka', en: 'the lord of the forest: bark, moss, antlers; half again as tall as a man' },
    figure: monster({ w: 32, h: 48, skin: BONE, top: BARK, bottom: BARK, boots: BARK, head: { w: 9, h: 10 }, shoulder: 14, waist: 10, torsoH: 14, arm: { w: 4, len: 18 }, leg: { w: 5, len: 14, gap: 0 }, cloak: MOSS, face: 'skull', eye: rgb(0x9af46a), hunch: 2, over: all(antlers(BONE), mossy) }),
  },
  {
    id: 'wilk',
    kind: { pl: 'Wilk A', en: 'Wolf A' },
    name: { pl: 'wilk szary', en: 'grey wolf' },
    note: { pl: 'szary, chudy, żółte oko; groźny bez żadnych czarów', en: 'grey, lean, a yellow eye; a threat without any magic' },
    beast: {
      w: 32, h: 24, len: 12, chest: 5.5, haunch: 4.4, leg: { w: 2, len: 8 }, neck: [5, 5], head: { len: 5, h: 6 },
      fur: ramp(0x34323c, 0x64606c, 0x8e8a96, 0xbab6c0), belly: ramp(0x6a6670, 0xa8a4ac, 0xc8c4cc, 0xe4e0e6), outline: rgb(0x121016), eye: rgb(0xf6d24a),
      ears: 'point', tail: 'bushy',
    },
  },
  {
    id: 'wilk-skazy',
    kind: { pl: 'Wilk B', en: 'Wolf B' },
    name: { pl: 'wilk skazy', en: 'blight wolf' },
    note: { pl: 'ciemniejszy, większy, ciernie na grzbiecie, oko w kolorze Nawi', en: 'darker, bigger, thorns along its back, an eye the colour of Nawia' },
    beast: {
      w: 32, h: 24, len: 12, chest: 6.4, haunch: 4.6, leg: { w: 2, len: 8 }, neck: [5, 4], head: { len: 6, h: 7 },
      fur: ramp(0x18121e, 0x362c44, 0x54486a, 0x7a6c92), belly: ramp(0x2a2236, 0x4a3e5c, 0x6a5c80, 0x8c7ea0), outline: rgb(0x0a0610), eye: rgb(0xff5ad8),
      ears: 'point', tail: 'bushy', ridge: rgb(0xb05fe0), snarl: true,
    },
  },
  {
    id: 'dzik',
    kind: { pl: 'Dzik', en: 'Boar' },
    name: { pl: 'Dzik', en: 'Boar' },
    note: { pl: 'ciężki przód, nisko niesiony łeb, szczecina, szable', en: 'heavy in front, head carried low, bristles, tusks' },
    beast: {
      w: 32, h: 24, len: 11, chest: 7, haunch: 5.8, leg: { w: 3, len: 5 }, neck: [5, -1], head: { len: 5, h: 7 },
      fur: ramp(0x2c201c, 0x54403a, 0x786056, 0x9a8272), belly: ramp(0x241a18, 0x3c2e2a, 0x54423c, 0x6c584e), outline: rgb(0x120c0c), eye: rgb(0xf0e0c0),
      ears: 'round', tail: 'thin', ridge: rgb(0x1a1214), tusk: rgb(0xf6f1e6),
    },
  },
];
