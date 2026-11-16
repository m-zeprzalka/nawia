// The hero the game plays with: Sambor, drawn as C2f (16 x 18), or as S3 "Malowany" (16 x 16) for comparison.
// H in the game switches between them.
//
// Each look has two sheets: armed (sword and shield) and bare, for the start of the game, before the old man gives
// him his weapons. Both are in the layout of src/art/hero/layout.ts: 32 x 32 cells, rows facing down, up and to
// the side, columns the animations (idle, run, three strikes, guard, roll, hurt, death), with the sword drawn into
// the strikes.
//
// Until a look has its own frames for all of that, `fromPoses` fills the layout from the seven game poses it does
// have (stand, two strides, wind-up, blow, guard, hop), laying the old separate sword where the old swing put it.
//
// The old looks of the game (Wojak, Pastuszek, Góral, Wędrowiec: HERO_LOOKS in actors.ts) stay where they were;
// the playground still shows them (G1-G4).

import { PixelBuffer } from '../core/PixelBuffer.ts';
import { SWORD, swordPicture } from './actors.ts';
import { paintRows, type GamePose, type GamePoses, type View } from './concepts/concept.ts';
import { CONCEPT as C2F, GAME as C2F_GAME } from './concepts/najlepszy-wysoki-f.concept.ts';
import { ANIM_ORDER, ANIMS, CELL, SHEET_COLS, type HeroAnim, type HeroView } from './hero/layout.ts';
import { HERO_STYLES, lay, paintStyle, styleGrid, type HeroStyle } from './heroStyles.ts';
import { grid, type Sheet } from './sheet.ts';

export interface GameLook {
  /** texture key of the armed sheet; the bare one is `${key}-bare` */
  key: string;
  name: { pl: string; en: string };
}

export const GAME_LOOKS: GameLook[] = [
  { key: 'sambor', name: { pl: 'Sambor (C2f)', en: 'Sambor (C2f)' } },
  { key: 'sambor-s3', name: { pl: 'Sambor malowany (S3)', en: 'Sambor painted (S3)' } },
];

const VIEWS: HeroView[] = ['down', 'up', 'side'];

/** Builds a sheet in the layout from a function that draws one frame (a CELL-sized picture). */
export function layoutSheet(key: string, frame: (anim: HeroAnim, view: HeroView, i: number) => PixelBuffer): Sheet {
  const frames: PixelBuffer[] = [];
  for (const view of VIEWS) for (const anim of ANIM_ORDER) for (let i = 0; i < ANIMS[anim].frames; i++) frames.push(frame(anim, view, i));
  return grid(key, CELL.w, CELL.h, SHEET_COLS, frames);
}

// ------------------------------------------------------------------ the layout filled from seven poses

/** Which of the seven poses stands in for each frame. */
const POSE_FOR: Record<HeroAnim, GamePose[]> = {
  idle: ['stand', 'stand', 'stand', 'stand'],
  run: ['walkA', 'walkA', 'stand', 'walkB', 'walkB', 'stand'],
  atkA: ['atk0', 'atk1', 'atk1', 'atk1'],
  atkB: ['atk0', 'atk1', 'atk1', 'atk1'],
  atkC: ['atk0', 'atk1', 'atk1', 'atk1', 'stand'],
  guard: ['guard', 'guard'],
  roll: ['hop', 'hop', 'hop', 'hop', 'hop', 'walkA'],
  hurt: ['stand', 'stand'],
  death: ['stand', 'stand', 'stand', 'stand', 'stand'],
};

/** Which step of the old swing (0 up, 1 across, 2 out) the sword is at in each strike frame; -1: no sword. */
const SWORD_STEP: Partial<Record<HeroAnim, number[]>> = {
  atkA: [0, 1, 2, 2],
  atkB: [2, 1, 0, 0],
  atkC: [0, 1, 2, 2, -1],
};

/** The old swing: the sword's frame and where its 16 x 16 cell sits from the middle of the hero's feet. */
const SWING: Record<HeroView, [number, number, number][]> = {
  side: [[SWORD.N, 5, -10], [SWORD.NE, 11, -7], [SWORD.E, 12, 1]],
  down: [[SWORD.W, -10, 1], [SWORD.SW, -8, 9], [SWORD.S, -2, 10]],
  up: [[SWORD.E, 10, -2], [SWORD.NE, 9, -10], [SWORD.N, 2, -12]],
};

/**
 * A look that only has the seven game poses, set into the layout: each pose centred on its feet, the sword laid
 * in where the old swing put it (behind him when he faces away).
 */
export function fromPoses(key: string, pose: (view: View, p: GamePose) => PixelBuffer, armed: boolean): Sheet {
  return layoutSheet(key, (anim, view, i) => {
    const out = new PixelBuffer(CELL.w, CELL.h);
    const body = pose(view, POSE_FOR[anim][i]);
    const step = armed ? (SWORD_STEP[anim]?.[i] ?? -1) : -1;
    const sword = step >= 0 ? SWING[view][step] : null;
    // the old sword cell was centred 8 px above the hero's feet (see the old Player.sync)
    const lay = (): void => {
      if (sword) out.blit(swordPicture(sword[0]), CELL.cx - 8 + sword[1], CELL.foot - 16 + sword[2]);
    };
    if (view === 'up') lay();
    out.blit(body, CELL.cx - body.w / 2, CELL.foot - body.h);
    if (view !== 'up') lay();
    return out;
  });
}

// ------------------------------------------------------------------ C2f and S3

/** C2f: its game poses are drawn in its own concept file. */
function conceptPose(key: string, poses: GamePoses): (view: View, p: GamePose) => PixelBuffer {
  return (view, p) => paintRows(poses[view][p], 16, C2F.h, C2F.pal, C2F, true, `hero "${key}"`);
}

/**
 * S3: put together from its parts the way the game's first hero was (actors.ts, heroFrame): a stride under
 * the swing, the trunk leaning into the blow, a crouch behind the shield, the shield carried round in front.
 */
function styleFrameFor(s: HeroStyle, view: View, pose: GamePose, shield: boolean): PixelBuffer {
  const g = styleGrid(s);
  const legs = s.legs[view][pose === 'walkB' ? 2 : pose === 'stand' || pose === 'guard' ? 0 : 1];
  let dx = 0;
  let dy = pose === 'walkA' || pose === 'walkB' || pose === 'guard' || pose === 'hop' ? 1 : 0;
  if (pose === 'atk1') {
    if (view === 'side') dx = 1;
    else if (view === 'down') dy = 1;
  }
  const stamp = [s.shield[view]].flat()[0];
  // where the shield goes: on his arm, pulled back in a blow from the side, or held up in front of him
  let sx = stamp.x;
  let sy = stamp.y + dy;
  if (pose === 'atk1' && view === 'side') sx -= 3;
  if (pose === 'guard') {
    if (view === 'down') [sx, sy] = [5, 8];
    else if (view === 'side') [sx, sy] = [10, 6];
    else [sx, sy] = [2, 5];
  }
  const behind = stamp.behind || (pose === 'guard' && view === 'up');
  if (shield && behind) lay(g, stamp.rows, sx, sy);
  lay(g, legs, 0, s.legsAt);
  lay(g, s.upper[view], dx, dy);
  if (shield && !behind) lay(g, stamp.rows, sx, sy);
  return paintStyle(s, g);
}

/** Every sheet of every game look, armed and bare. */
export function gameHeroSheets(): Sheet[] {
  const s3 = HERO_STYLES.find((s) => s.id === 'malowany');
  if (!s3) throw new Error('no S3 ("malowany") among the hero styles');
  return [
    fromPoses('sambor', conceptPose('sambor', C2F_GAME.armed), true),
    fromPoses('sambor-bare', conceptPose('sambor-bare', C2F_GAME.bare), false),
    fromPoses('sambor-s3', (v, p) => styleFrameFor(s3, v, p, true), true),
    fromPoses('sambor-s3-bare', (v, p) => styleFrameFor(s3, v, p, false), false),
  ];
}
