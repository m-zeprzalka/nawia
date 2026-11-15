// Everyone who walks, drawn on the grid: one 16x16 tile each, the way the 8- and 16-bit classics did it.
// The guardian is 2x2 tiles. The sword is its own sprite, laid next to the hero when he swings.
//
// The hero is assembled from parts (upper body, legs, shield) so every pose stays consistent
// and new poses (a bow, later) are a few lines, not a redraw.

import { PixelBuffer, fromAscii, rgb, type Color } from '../core/PixelBuffer.ts';
import { INK, PAL } from './palette.ts';
import { art, flame, grid, type Sheet } from './sheet.ts';

// =============================================================== the hero
// 16x16 cells. Rows: facing down, up, side (right; left is a flip).
// Columns: stand, walk A, walk B, strike (wind-up), strike (follow-through), guard, 2 spare.

export const HERO = {
  fw: 16, fh: 16, cols: 8,
  STAND: 0, WALK_A: 1, WALK_B: 2, ATK0: 3, ATK1: 4, GUARD: 5,
  DOWN: 0, UP: 1, SIDE: 2,
} as const;

const HP: Record<string, Color> = {
  o: INK.outline,
  h: INK.hair, H: INK.hairDark, l: INK.hairLight,
  s: INK.skin, S: INK.skinDark, e: INK.eye,
  r: INK.band, R: INK.bandDark,
  t: INK.tunic, T: INK.tunicDark,
  c: INK.cloak, C: INK.cloakDark, k: INK.cloakLight,
  b: INK.belt, y: INK.buckle,
  p: INK.trousers, P: INK.trousersDark,
  n: INK.boot, N: INK.bootDark,
  w: INK.shieldRim, W: INK.shieldRimDark, d: INK.shieldRed, D: INK.shieldRedDark,
  m: INK.shieldCream, M: INK.shieldCreamDark, i: INK.iron, I: INK.ironMid,
};

type Dir3 = 'down' | 'up' | 'side';
type Pose = 'stand' | 'walkA' | 'walkB' | 'atk0' | 'atk1' | 'guard';

/** Head and torso: rows 0-11 of the cell. */
const UPPER: Record<Dir3, string[]> = {
  down: art(16, [
    '....oooooooo....',
    '...ohhhhhhhho...',
    '..ohhlhhhhhhho..',
    '..orrrrrrrrrro..',
    '..ohssssssssho..',
    '..ohsessssesho..',
    '..ossessssesso..',
    '...osSssssSso...',
    '...octtttttco...',
    '..oscttttttcso..',
    '..oobbbyybbboo..',
    '...octttttTco...',
  ]),
  up: art(16, [
    '....oooooooo....',
    '...ohhhhhhhho...',
    '..ohhhhhhhlhho..',
    '..orrrrrrrrrro..',
    '..ohhhhhhhhhho..',
    '..oHhhhhhhhhHo..',
    '..oHHhhhhhhHHo..',
    '...oHHHHHHHHo...',
    '...occcccccco...',
    '..osckccccccso..',
    '..ooCkcccccCoo..',
    '...ocCccccCCo...',
  ]),
  side: art(16, [
    '....ooooooo.....',
    '...ohhhhhhho....',
    '..ohhhhhhhlho...',
    '.oorrrrrrrrro...',
    'oRRohhhssseso...',
    '.ooHhhsssseso...',
    '..oHhhssssssso..',
    '...oHssssssso...',
    '...occtttto.....',
    '..occcttttso....',
    '..oCccbbbyo.....',
    '..oCCctttTo.....',
  ]),
};

/** Hips and boots: rows 12-15 of the cell. */
const LEGS: Record<Dir3, Record<'stand' | 'a' | 'b', string[]>> = {
  down: {
    stand: art(16, ['...opppPpppo....', '...onnnonnno....', '...onNNonNNo....', '....ooo.ooo.....']),
    a: art(16, ['...opppPpppo....', '...onnnonnno....', '...onNNoooo.....', '....ooo.........']),
    b: art(16, ['...opppPpppo....', '...onnnonnno....', '....oooonNNo....', '........ooo.....']),
  },
  up: {
    stand: art(16, ['...oCcCCcCcCo...', '...onnnonnno....', '...onNNonNNo....', '....ooo.ooo.....']),
    a: art(16, ['...oCcCCcCcCo...', '...onnnonnno....', '...onNNoooo.....', '....ooo.........']),
    b: art(16, ['...oCcCCcCcCo...', '...onnnonnno....', '....oooonNNo....', '........ooo.....']),
  },
  side: {
    stand: art(16, ['...oCppppo......', '....onnonno.....', '....onNonNNo....', '.....oo.oooo....']),
    a: art(16, ['...oCppppo......', '...onnoooonno...', '...oNno..onNNo..', '....oo....ooo...']),
    b: art(16, ['...oCppppo......', '.....onnno......', '.....onNNo......', '......ooo.......']),
  },
};

/** The round shield as it hangs on his arm... */
const SHIELD_ROUND = fromAscii(art(6, ['.oooo.', 'owddwo', 'odmido', 'owdDwo', '.oooo.']), HP);
/** ...held out in front of him, seen from the front... */
const SHIELD_FRONT = fromAscii(art(8, ['.oooooo.', 'owwddwwo', 'owdmmDwo', 'odmiiMDo', 'owdmMDwo', 'owwDDwwo', '.oooooo.']), HP);
/** ...and edge-on. */
const SHIELD_EDGE = fromAscii(art(4, ['.oo.', 'owwo', 'owdo', 'omdo', 'omdo', 'owDo', 'owWo', '.oo.']), HP);

function heroFrame(dir: Dir3, pose: Pose): PixelBuffer {
  const b = new PixelBuffer(16, 16);
  const striking = pose === 'atk0' || pose === 'atk1';
  const legs = fromAscii(LEGS[dir][pose === 'walkA' || striking ? 'a' : pose === 'walkB' ? 'b' : 'stand'], HP);
  const upper = fromAscii(UPPER[dir], HP);
  // contact frames dip, behind the shield he crouches, a strike leans into the blow
  let dx = 0;
  let dy = pose === 'walkA' || pose === 'walkB' || pose === 'guard' ? 1 : 0;
  if (pose === 'atk1') {
    if (dir === 'side') dx = 1;
    else if (dir === 'down') dy = 1;
  }

  if (dir === 'up') {
    // seen from behind, his shield is on the far side of him
    if (pose === 'guard') {
      b.blit(SHIELD_ROUND, 0, 6);
      b.blit(SHIELD_ROUND, 10, 6);
    } else b.blit(SHIELD_ROUND, 0, 8 + dy);
    b.blit(legs, 0, 12);
    b.blit(upper, dx, dy);
  } else if (dir === 'down') {
    b.blit(legs, 0, 12);
    b.blit(upper, dx, dy);
    if (pose === 'guard') b.blit(SHIELD_FRONT, 4, 8);
    else b.blit(SHIELD_ROUND, 9, 8 + dy);
  } else {
    b.blit(legs, 0, 12);
    b.blit(upper, dx, dy);
    if (pose === 'guard') b.blit(SHIELD_EDGE, 11, 6);
    else b.blit(SHIELD_ROUND, striking ? 5 : 8, 8 + dy);
  }
  return b;
}

/**
 * The hero as a figure in a landscape: seen from behind, cloak, shield on his arm, sword point-down.
 * Only its outline matters (the title picture paints it as a silhouette). 32x32 card, soles on row 30.
 */
export function heroFromBehind(): PixelBuffer {
  const rows = art(18, [
    '.......####.......',
    '......######......',
    '......######......',
    '......######......',
    '.......####.......',
    '.....########.....',
    '....##########....',
    '...############...',
    '.###############..',
    '#####.#########.#.',
    '#####.#########.#.',
    '#####.#########.#.',
    '#####.#########.#.',
    '.###..#########.#.',
    '......#########.#.',
    '......#########.#.',
    '......#########.#.',
    '.....##########.#.',
    '.....#####.####.#.',
    '......###..###..#.',
    '......###..###..#.',
    '......###..###....',
    '......###..###....',
    '.....####..####...',
  ]);
  const card = new PixelBuffer(32, 32);
  card.blit(fromAscii(rows, { '#': INK.outline }), 7, 31 - rows.length);
  return card;
}

function heroSheet(): Sheet {
  const poses: (Pose | null)[] = ['stand', 'walkA', 'walkB', 'atk0', 'atk1', 'guard', null, null];
  const frames: (PixelBuffer | null)[] = [];
  for (const dir of ['down', 'up', 'side'] as Dir3[]) for (const p of poses) frames.push(p ? heroFrame(dir, p) : null);
  return grid('hero', HERO.fw, HERO.fh, HERO.cols, frames);
}

// =============================================================== the sword
// 16x16 cells, 8 of them: the blade pointing N, NE, E, SE, S, SW, W, NW.
// The grip sits at (7.5, 11.5) in the N frame and at (3.5, 11.5) in the NE frame.

export const SWORD = { fw: 16, fh: 16, cols: 8, N: 0, NE: 1, E: 2, SE: 3, S: 4, SW: 5, W: 6, NW: 7 } as const;

/** The hag stone in the pommel: a speck of the other side's light. */
const HAG = rgb(0x9af4ff);

function swordFrame(diagonal: boolean): PixelBuffer {
  const b = new PixelBuffer(16, 16);
  if (!diagonal) {
    b.set(7, 1, INK.steel);
    for (let y = 2; y <= 9; y++) {
      b.set(7, y, INK.steel);
      b.set(8, y, y === 2 ? INK.steel : INK.steelMid);
    }
    for (let x = 5; x <= 10; x++) b.set(x, 10, x < 8 ? INK.bronze : INK.bronzeDark);
    b.set(7, 11, INK.belt); b.set(8, 11, INK.bootDark);
    b.set(7, 12, INK.belt); b.set(8, 12, INK.bootDark);
    b.set(7, 13, HAG); b.set(8, 13, rgb(0x3db6c6));
  } else {
    for (let t = 0; t <= 7; t++) {
      b.set(6 + t, 9 - t, INK.steel);
      if (t > 0) b.set(6 + t, 10 - t, INK.steelMid);
      if (t < 7) b.set(7 + t, 9 - t, INK.steelMid);
    }
    b.set(14, 1, INK.steel);
    // crossguard, at right angles to the blade
    b.set(3, 8, INK.bronze); b.set(4, 9, INK.bronze); b.set(5, 10, INK.bronze); b.set(6, 11, INK.bronzeDark); b.set(7, 12, INK.bronzeDark);
    b.set(4, 8, INK.bronzeDark); b.set(6, 12, INK.bronzeDark);
    b.set(4, 11, INK.belt); b.set(3, 12, INK.belt); b.set(4, 12, INK.bootDark);
    b.set(2, 13, HAG); b.set(3, 13, rgb(0x3db6c6));
  }
  return b.outlined(INK.outline);
}

function swordSheet(): Sheet {
  const frames: PixelBuffer[] = [];
  let n = swordFrame(false);
  let ne = swordFrame(true);
  for (let i = 0; i < 4; i++) {
    frames.push(n, ne);
    n = n.rotateCW();
    ne = ne.rotateCW();
  }
  return grid('sword', SWORD.fw, SWORD.fh, SWORD.cols, frames);
}

// =============================================================== enemies
// 16x16 cells, 4 per row.
// Row 0: utopiec (2 idle, lunge)      Row 1: zjawa (2 idle, swoop)      Row 2: ognik (4 frames of flame)
// Row 3: strzyga, body (2 idle, pounce)   Row 4: strzyga, second soul   Row 5: the guardian's heart (2 shielded, 2 bare)

export const MOB = { fw: 16, fh: 16, cols: 4, UTOPIEC: 0, ZJAWA: 4, OGNIK: 8, STRZYGA: 12, STRZYGA_N: 16, HEART: 20 } as const;

/** A breathing frame for free: everything above the feet sinks by one pixel. */
function squash(rows: string[]): string[] {
  const n = rows.length;
  return ['.'.repeat(rows[0].length), ...rows.slice(0, n - 3), rows[n - 2], rows[n - 1]];
}

const UTOPIEC_PAL: Record<string, Color> = {
  o: INK.outline,
  g: rgb(0x3d7566), G: rgb(0x285248), L: rgb(0x6aa888), b: rgb(0x8cba90), B: rgb(0x5c9078),
  w: rgb(0x1f3d2c), W: rgb(0x3a6a40),
  y: rgb(0xf6f2a4), p: rgb(0x2a1420), m: rgb(0x10181e), t: rgb(0xe6dfc8),
};
const UTOPIEC_A = art(16, [
  '.....wWw.wW.....',
  '....oWWWWWWo....',
  '...oWWgggWWWo...',
  '..oWgLLggggggo..',
  '..ogyyggggyygo..',
  '..ogypggggypgo..',
  '..oggggmmggggo..',
  '..oGgmtmmtmgGo..',
  '.oogGgmmmmgGgoo.',
  'oLgoGggggggGogLo',
  'ogGoGgbbbbgGoGgo',
  '.oo.oGbbbbGo.oo.',
  '....oGgBBgGo....',
  '...oogGooGgoo...',
  '..oLgGo..oLgGo..',
  '..oooo....oooo..',
]);
const UTOPIEC_C = art(16, [
  '.....wWw.wW.....',
  '....oWWWWWWo....',
  '...oWWgggWWWo...',
  'oo.oWgLgggggo.oo',
  'oLoogyyggyygooLo',
  'ogGogypggypgoGgo',
  '.ogGogmmmmgoGgo.',
  '..oGgmttttmgGo..',
  '..oGgmmmmmmgGo..',
  '..oGgmttttmgGo..',
  '..oGggmmmmggGo..',
  '...oGgbbbbgGo...',
  '...oGgBBBBgGo...',
  '...oogGooGgoo...',
  '..oLgGo..oLgGo..',
  '..oooo....oooo..',
]);

const ZJAWA_PAL: Record<string, Color> = {
  o: INK.soul[0],
  a: rgb(0xf0f4ff), b: rgb(0xc0ccf6), c: rgb(0x8c98dc), d: rgb(0x5c62b0),
  k: rgb(0x1c1640), e: rgb(0xff7ad8),
};
const ZJAWA_A = art(16, [
  '.....oooooo.....',
  '....oaaaaabo....',
  '...oaabbbbbco...',
  '..oabkkkkkkbco..',
  '..oabkekkekbco..',
  '..oabkkkkkkbco..',
  '..oaabkkkkbcco..',
  '.oaabbbbbbbccdo.',
  'oabobbbbbbcodcdo',
  'oco.oabbbcco.oco',
  '.o..oabbbcdo..o.',
  '....oabbccdo....',
  '.....oabcdo.....',
  '.....obccdo.....',
  '......ocdo......',
  '.......oo.......',
]);
const ZJAWA_B = [
  ...ZJAWA_A.slice(0, 11),
  ...art(16, ['....oabbccdo....', '......oabcdo....', '.......obcdo....', '........ocdo....', '.........oo.....']),
];
const ZJAWA_C = art(16, [
  '.....oooooo.....',
  '....oaaaaabo....',
  '...oaabbbbbco...',
  '..oabkkkkkkbco..',
  '..oabeekkeebco..',
  '..oabkkkkkkbco..',
  'oo.oabkeekbco.oo',
  'oaooabbkkbbcoodo',
  'obaabbbbbbbccddo',
  '.oo.oabbbcco.oo.',
  '....oabbbcdo....',
  '....oabbccdo....',
  '.....oabcdo.....',
  '....oabcdo......',
  '...oacdo........',
  '....ooo.........',
]);

const STRZYGA_ROWS = art(16, [
  '....oooooooo....',
  '...oHHHHHHHHo...',
  '..oHHHHHHHHHHo..',
  '..oHHssssssHHo..',
  '.oHHsrssssrsHHo.',
  '.oHHssssssssHHo.',
  '.oHHsttttttsHHo.',
  '.oHHHsmmmmsHHHo.',
  '.oHHHHssssHHHHo.',
  'oooHHsSssSsHHooo',
  'owsoHsssssssHosw',
  'owSoHHsssssHHoSw',
  '.oo.oHsSSsHo.oo.',
  '....osSooSso....',
  '...owso..oswo...',
  '...ooo....ooo...',
]);
const STRZYGA_POUNCE = [
  ...STRZYGA_ROWS.slice(0, 8),
  ...art(16, ['owoHHHssssHHHowo', 'osoHHsSssSsHHoso', '.ooHHsssssssHoo.', '...oHHsssssHHo..', '....oHsSSsHo....']),
  ...STRZYGA_ROWS.slice(13),
];
const STRZYGA_PAL: Record<StrzygaForm, Record<string, Color>> = {
  body: {
    o: INK.outline, H: rgb(0x2c2438), s: rgb(0xbdb6c8), S: rgb(0x837d96),
    r: rgb(0xf0404e), t: rgb(0xf4efe4), m: rgb(0x2a1420), w: rgb(0xf4efe4),
  },
  soul: {
    o: rgb(0x0d102e), H: rgb(0x2e46a0), s: rgb(0xc4e6ff), S: rgb(0x74a4e4),
    r: rgb(0xff7ad8), t: rgb(0xffffff), m: rgb(0x18225a), w: rgb(0xffffff),
  },
};
type StrzygaForm = 'body' | 'soul';

/** Will-o'-the-wisp: a sickly flame with eyes. */
const WISP_FIRE = [rgb(0xf6ffd6), rgb(0xcdf266), rgb(0x76c436), rgb(0x2f7a2c), rgb(0x1a4a28)];

function ognikFrame(f: number): PixelBuffer {
  const b = new PixelBuffer(16, 16);
  flame(b, WISP_FIRE, 8, 13, 11, 9, f);
  // a round belly under the flame, so it reads as a creature and not as a torch
  for (let y = 10; y <= 14; y++)
    for (let x = 4; x <= 11; x++) {
      const d = Math.hypot(x + 0.5 - 8, (y + 0.5 - 11.5) * 1.25);
      if (d < 3.9) b.set(x, y, d < 1.6 ? WISP_FIRE[0] : d < 2.9 ? WISP_FIRE[1] : WISP_FIRE[2]);
    }
  const blink = f === 3;
  b.set(6, 11, WISP_FIRE[4]); b.set(9, 11, WISP_FIRE[4]);
  if (!blink) { b.set(6, 10, WISP_FIRE[4]); b.set(9, 10, WISP_FIRE[4]); }
  b.set(7, 13, WISP_FIRE[3]); b.set(8, 13, WISP_FIRE[3]);
  return b.outlined(rgb(0x12301c));
}

/** The guardian's heart, as it is seen from Nawia: shelled while the stone stands, bare when it is stunned. */
function heartFrame(f: number, bare: boolean): PixelBuffer {
  const b = new PixelBuffer(16, 16);
  const S = INK.soul;
  const r = bare ? 4.4 + (f % 2) * 0.9 : 3.4;
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++) {
      const dx = x + 0.5 - 8;
      const dy = y + 0.5 - 8;
      // a drop of light: round above, pointed below
      const d = Math.hypot(dx, dy < 0 ? dy : dy * 0.8) + (dy > 0 ? Math.abs(dx) * 0.35 : 0);
      if (d > r) continue;
      b.set(x, y, d < r * 0.38 ? rgb(0xffffff) : d < r * 0.7 ? S[4] : d < r * 0.9 ? S[3] : S[2]);
    }
  const out = b.outlined(S[0]);
  if (!bare) {
    // the shell: eight beads turning around it
    for (let k = 0; k < 8; k++) {
      const a = (k * Math.PI) / 4 + (f % 2) * (Math.PI / 8);
      const x = Math.round(7.5 + Math.cos(a) * 6.4);
      const y = Math.round(7.5 + Math.sin(a) * 6.4);
      out.set(x, y, k % 2 ? PAL.nawia.accent : PAL.nawia.accentSoft);
    }
  } else {
    for (let k = 0; k < 5; k++) {
      const a = k * 1.9 + f * 1.3;
      out.set(Math.round(7.5 + Math.cos(a) * 6.8), Math.round(7.5 + Math.sin(a) * 6.8), S[3]);
    }
  }
  return out;
}

function mobSheet(): Sheet {
  const strzyga = (which: StrzygaForm): PixelBuffer[] =>
    [STRZYGA_ROWS, squash(STRZYGA_ROWS), STRZYGA_POUNCE].map((rows) => fromAscii(rows, STRZYGA_PAL[which]));
  return grid('mobs', MOB.fw, MOB.fh, MOB.cols, [
    ...[UTOPIEC_A, squash(UTOPIEC_A), UTOPIEC_C].map((rows) => fromAscii(rows, UTOPIEC_PAL)), null,
    ...[ZJAWA_A, ZJAWA_B, ZJAWA_C].map((rows) => fromAscii(rows, ZJAWA_PAL)), null,
    ognikFrame(0), ognikFrame(1), ognikFrame(2), ognikFrame(3),
    ...strzyga('body'), null,
    ...strzyga('soul'), null,
    heartFrame(0, false), heartFrame(1, false), heartFrame(0, true), heartFrame(1, true),
  ]);
}

// =============================================================== the guardian
// 32x32 cells (2x2 tiles): idle A, idle B, wind-up, charge, stunned.
// A four-sided idol that learned to walk. Stone in Jawia; from Nawia only its heart is real.

export const BOSS = { fw: 32, fh: 32, cols: 8, IDLE: 0, IDLE_B: 1, WINDUP: 2, CHARGE: 3, STUNNED: 4 } as const;

const IDOL_CORE = art(20, [
  '......oooooooo......',
  '....oo55544443oo....',
  '...o554444443333o...',
  '..o55444444433332o..',
  '.o5544444444333322o.',
  'oooooooooooooooooooo',
  '.o44kkkk3443kkkk32o.',
  '.o44kEEk3443kEEk32o.',
  '.o44keek3443keek32o.',
  '.o444kk434433kk332o.',
  '.o4444443443333332o.',
  '.o4443333443322222o.',
  '.o44kkkkkkkkkkkk32o.',
  '.o4433333333333322o.',
  'oooooooooooooooooooo',
  '.o5444444444333332o.',
  '.o44m4443kk3443322o.',
  '.o4mMm43k33k343322o.',
  '.o44m443k33k343322o.',
  '.o4444433kk3333322o.',
  '.o3333333333322222o.',
  '..oooooooooooooooo..',
]);
const IDOL_FIST = art(6, ['.oooo.', 'o5443o', 'o4433o', 'o4332o', 'o4332o', 'o3322o', 'o3222o', '.oooo.']);
const IDOL_FOOT = art(7, ['ooooooo', 'o44332o', 'o33222o', 'ooooooo']);

type BossPose = 'idle' | 'idleB' | 'windup' | 'charge' | 'stunned';

function bossFrame(pose: BossPose): PixelBuffer {
  const b = new PixelBuffer(32, 32);
  const R = PAL.jawia.rock;
  const G = PAL.jawia.growth;
  const hot = pose === 'windup' || pose === 'charge';
  const eyes = pose === 'stunned' ? [R[0], R[0]] : hot ? [rgb(0xfff4b8), PAL.jawia.accent] : [PAL.jawia.accent, PAL.jawia.accentSoft];
  const pal: Record<string, Color> = {
    o: INK.outline, k: R[0], '1': R[1], '2': R[2], '3': R[3], '4': R[4], '5': R[5],
    m: G[2], M: G[1], E: eyes[0], e: eyes[1],
  };
  const cy = 5 + (pose === 'idleB' ? 1 : pose === 'windup' || pose === 'stunned' ? 2 : 0);
  const fistY = pose === 'windup' ? cy + 5 : pose === 'charge' ? cy + 13 : pose === 'stunned' ? Math.min(22, cy + 15) : cy + 11;
  const foot = fromAscii(IDOL_FOOT, pal);
  b.blit(foot, 8, 26);
  b.blit(foot, 17, 26);
  b.blit(fromAscii(IDOL_CORE, pal), 6, cy);
  const fist = fromAscii(IDOL_FIST, pal);
  b.blit(fist, 1, fistY);
  b.blit(fist, 25, fistY);
  if (pose === 'stunned') {
    // cracked open: the light of the other side shows through
    const crack: [number, number][] = [[15, 1], [16, 2], [16, 3], [15, 4], [14, 6], [15, 7], [15, 8], [16, 9], [17, 10], [16, 11], [16, 13], [15, 15], [14, 16], [15, 17], [16, 18], [16, 19]];
    for (const [x, y] of crack) {
      b.set(x, cy + y, PAL.nawia.accent);
      if (b.get(x - 1, cy + y) !== 0 && (y & 1) === 0) b.set(x - 1, cy + y, PAL.nawia.accentDeep);
    }
  }
  return b;
}

function bossSheet(): Sheet {
  const poses: BossPose[] = ['idle', 'idleB', 'windup', 'charge', 'stunned'];
  return grid('boss', BOSS.fw, BOSS.fh, BOSS.cols, [...poses.map(bossFrame), null, null, null]);
}

// =============================================================== things that fly at you
// 8x8 cells: wisp fire x2, soul orb x2.

export const SHOT = { fw: 8, fh: 8, cols: 4, WISP: 0, SOUL: 2 } as const;

function orb(ramp: readonly Color[], dark: Color, f: number): PixelBuffer {
  const b = new PixelBuffer(8, 8);
  const r = 2.3 + (f % 2) * 0.5;
  for (let y = 0; y < 8; y++)
    for (let x = 0; x < 8; x++) {
      const d = Math.hypot(x + 0.5 - 4, y + 0.5 - 4);
      if (d <= r) b.set(x, y, d < r * 0.45 ? ramp[0] : d < r * 0.8 ? ramp[1] : ramp[2]);
    }
  return b.outlined(dark);
}

function shotSheet(): Sheet {
  const soul = [rgb(0xffffff), INK.soul[4], INK.soul[3]];
  return grid('shots', SHOT.fw, SHOT.fh, SHOT.cols, [
    orb(WISP_FIRE, rgb(0x12301c), 0), orb(WISP_FIRE, rgb(0x12301c), 1),
    orb(soul, INK.soul[0], 0), orb(soul, INK.soul[0], 1),
  ]);
}

export function makeActorSheets(): Sheet[] {
  return [heroSheet(), swordSheet(), mobSheet(), bossSheet(), shotSheet()];
}
