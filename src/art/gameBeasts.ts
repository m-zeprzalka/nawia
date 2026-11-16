// The monsters drawn whole (src/art/beasts) that the game's enemies wear: one for each kind of enemy.
// Each is seen in the form of the world the hero is in: a topielec is a wet black cat in Jawia and the drowned
// man in Nawia, even as an echo; a strzyga's body is in Jawia and her second soul in Nawia.
// B in the game switches back to the enemies' first looks (the `mobs` sheet), to compare.
//
// The beasts are imported one by one, not found by a glob, so node tools (tools/preview.ts) can build these too.

import type { World } from '../config.ts';
import type { EnemyKind } from '../world/roomFormat.ts';
import { beastSheet, type Beast } from './beasts/beast.ts';
import { BEAST as DZIK } from './beasts/dzik-b.beast.ts';
import { BEAST as MOROWNIK } from './beasts/morownik-b.beast.ts';
import { BEAST as OGNIK } from './beasts/ognik-b.beast.ts';
import { BEAST as STRZYGA } from './beasts/strzyga-b.beast.ts';
import { BEAST as TOPIELEC } from './beasts/topielec-b.beast.ts';
import { BEAST as WILK } from './beasts/wilk-b.beast.ts';
import { BEAST as ZJAWA } from './beasts/zjawa-b.beast.ts';
import type { Sheet } from './sheet.ts';

export const GAME_BEASTS: Record<EnemyKind, Beast> = {
  utopiec: TOPIELEC,
  zjawa: ZJAWA,
  ognik: OGNIK,
  strzyga: STRZYGA,
  dzik: DZIK,
  wilk: WILK,
  morownik: MOROWNIK,
};

const WORLDS: World[] = ['jawia', 'nawia'];

/** The texture of a beast in one world's form. */
export const beastKey = (b: Beast, world: World): string => `beast:${b.id}:${b.nawia ? world : 'jawia'}`;

const frameOfs = new Map<string, (phase: number) => number>();

/** Which frame of its sheet a beast shows for a phase (0 stands, 1-4 walk, 5-6 attack). */
export function beastFrameOf(b: Beast, world: World, phase: number): number {
  const key = beastKey(b, world);
  let f = frameOfs.get(key);
  if (!f) {
    f = beastSheet(b, b.nawia ? world : 'jawia', false).frameOf;
    frameOfs.set(key, f);
  }
  return f(phase);
}

/** A sheet for each beast in each of its forms. */
export function gameBeastSheets(): Sheet[] {
  const out: Sheet[] = [];
  const seen = new Set<string>();
  for (const b of Object.values(GAME_BEASTS))
    for (const world of WORLDS) {
      const key = beastKey(b, world);
      if (seen.has(key)) continue;
      seen.add(key);
      const s = beastSheet(b, b.nawia ? world : 'jawia', false);
      out.push({ key, buf: s.buf, fw: s.fw, fh: s.fh });
    }
  return out;
}
