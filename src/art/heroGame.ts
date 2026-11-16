// The hero the game plays with: Sambor, drawn as C2f (16 x 18), or as S3 "Malowany" (16 x 16) for comparison.
// H in the game switches between them.
//
// Each look has two sheets: armed (with the shield; the sword is its own sprite, laid next to him in a swing)
// and bare, for the start of the game, before the old man gives him his weapons. A sheet has the layout of
// HERO in actors.ts: rows facing down, up, right; columns standing, two strides, the wind-up, the blow, the
// raised shield, the hop of the dodge.
//
// The old looks of the game (Wojak, Pastuszek, Góral, Wędrowiec: HERO_LOOKS in actors.ts) stay where they were;
// the playground still shows them (G1-G4).

import { PixelBuffer } from '../core/PixelBuffer.ts';
import { HERO } from './actors.ts';
import { paintRows, type GamePose, type GamePoses, type View } from './concepts/concept.ts';
import { CONCEPT as C2F, GAME as C2F_GAME } from './concepts/najlepszy-wysoki-f.concept.ts';
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

const VIEWS: View[] = ['down', 'up', 'side'];
const COLUMNS: (GamePose | null)[] = ['stand', 'walkA', 'walkB', 'atk0', 'atk1', 'guard', 'hop', null];

function sheetOf(key: string, fh: number, frame: (view: View, pose: GamePose) => PixelBuffer): Sheet {
  const frames: (PixelBuffer | null)[] = [];
  for (const view of VIEWS) for (const pose of COLUMNS) frames.push(pose ? frame(view, pose) : null);
  return grid(key, HERO.fw, fh, HERO.cols, frames);
}

/** C2f: its game poses are drawn in its own concept file. */
function conceptSheet(key: string, poses: GamePoses): Sheet {
  return sheetOf(key, C2F.h, (view, pose) => paintRows(poses[view][pose], 16, C2F.h, C2F.pal, C2F, true, `hero "${key}"`));
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

function styleSheetFor(key: string, s: HeroStyle, shield: boolean): Sheet {
  return sheetOf(key, s.fh, (view, pose) => styleFrameFor(s, view, pose, shield));
}

/** Every sheet of every game look, armed and bare. */
export function gameHeroSheets(): Sheet[] {
  const s3 = HERO_STYLES.find((s) => s.id === 'malowany');
  if (!s3) throw new Error('no S3 ("malowany") among the hero styles');
  return [
    conceptSheet('sambor', C2F_GAME.armed),
    conceptSheet('sambor-bare', C2F_GAME.bare),
    styleSheetFor('sambor-s3', s3, true),
    styleSheetFor('sambor-s3-bare', s3, false),
  ];
}
