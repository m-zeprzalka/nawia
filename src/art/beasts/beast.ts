// Monsters drawn whole, the way the hero concepts are (concepts/concept.ts): every frame a picture of its own,
// letter by letter, one letter one colour. The monsters of cast.ts are posed by the figure painter, which makes
// them alike; these are not.
//
// Each monster lives in its own file next to this one (`<id>.beast.ts`, exporting `BEAST`); the playground finds
// them by that name, and src/lab/lineup.txt decides which stand on the board. How to draw one by hand:
// docs/HERO-DRAWING.md.
//
// Rules every monster keeps:
//  - the cell is 16, 24 or 32 px wide and 16 to 32 rows tall: one tile, a tile and a half, two tiles; nothing
//    taller (a boss too stays in 32 x 32); what stands on the ground stands on row h - 2, the last row stays
//    empty (the line under the feet goes there);
//  - one view: 'side' is drawn facing right and mirrored when it goes left; 'front' faces us whichever way it
//    goes (a flame, a wraith, a thing that floats);
//  - frames: standing, the walk (two or four), the attack (one or two: the wind-up, then the blow);
//  - it may have a second form for Nawia (another palette over the same frames, or frames of its own): the
//    playground shows it when the world is shifted;
//  - at most 15 colours in each form, the line included.

import { PixelBuffer } from '../../core/PixelBuffer.ts';
import { paintRows, type Ink } from '../concepts/concept.ts';

type Bilingual = { pl: string; en: string };

export interface BeastFrames {
  /** standing, or hanging in the air */
  stand: string[];
  /** the walk (or the drift): 2 frames (played stand, 1, stand, 2) or 4 (played 1, 2, 3, 4) */
  walk: string[][];
  /** the attack: 1 or 2 frames (the wind-up, then the blow) */
  attack: string[][];
}

/** How it looks in Nawia: what differs from its form in Jawia. */
export interface BeastForm {
  /** colours that change (merged over the Jawia palette) */
  pal?: Record<string, number>;
  /** frames that change (the rest are Jawia's, in the Nawia colours) */
  frames?: Partial<BeastFrames>;
  ink?: Ink;
  /** what changes, in a sentence */
  note?: Bilingual;
}

export interface Beast extends Ink {
  /** the code it is known by on the board (M1, M2...) */
  code: string;
  id: string;
  /** what it is (Wilk, Strzyga...) */
  kind: Bilingual;
  /** this reading of it (wilk z Rojstów...) */
  name: Bilingual;
  /** one or two sentences: the idea behind it, how it moves and attacks */
  note: Bilingual;
  /** the playground codes of what it is an alternative to (['P4', 'P5']); empty for something new */
  alt: string[];
  w: 16 | 24 | 32;
  h: number;
  view: 'side' | 'front';
  pal: Record<string, number>;
  frames: BeastFrames;
  nawia?: BeastForm;
}

export type BeastWorld = 'jawia' | 'nawia';
export type BeastPose = 'stand' | 'walk' | 'attack';

/** Its size class, in tiles, from its height. */
export const beastTiles = (b: Beast): 1 | 1.5 | 2 => (b.h <= 16 ? 1 : b.h <= 24 ? 1.5 : 2);

/** The palette, frames and line of one form. */
export function beastForm(b: Beast, world: BeastWorld): { pal: Record<string, number>; frames: BeastFrames; ink: Ink } {
  if (world === 'jawia' || !b.nawia) return { pal: b.pal, frames: b.frames, ink: b };
  const n = b.nawia;
  return {
    pal: { ...b.pal, ...n.pal },
    frames: { stand: n.frames?.stand ?? b.frames.stand, walk: n.frames?.walk ?? b.frames.walk, attack: n.frames?.attack ?? b.frames.attack },
    ink: n.ink ?? b,
  };
}

/** Every frame of a form, in order: stand, the walk, the attack. */
export function beastFrameRows(b: Beast, world: BeastWorld): { pose: BeastPose; i: number; rows: string[] }[] {
  const f = beastForm(b, world).frames;
  return [{ pose: 'stand', i: 0, rows: f.stand }, ...(f.walk ?? []).map((rows, i) => ({ pose: 'walk' as const, i, rows })), ...(f.attack ?? []).map((rows, i) => ({ pose: 'attack' as const, i, rows }))];
}

/** One frame, coloured and lined. With `strict` a bad drawing throws instead of drawing what it can. */
export function beastFrame(b: Beast, world: BeastWorld, pose: BeastPose, i = 0, strict = true): PixelBuffer {
  const form = beastForm(b, world);
  const rows = pose === 'stand' ? form.frames.stand : form.frames[pose]?.[i];
  return paintRows(rows ?? [], b.w, b.h, form.pal, form.ink, strict, `monster "${b.id}"`);
}

/** Everything wrong with a monster, as sentences; empty when it is fine. */
export function checkBeast(b: Beast): string[] {
  const errors: string[] = [];
  if (![16, 24, 32].includes(b.w)) errors.push(`width ${b.w} is not 16, 24 or 32`);
  if (b.h < 16 || b.h > 32) errors.push(`height ${b.h} is outside 16-32`);
  const worlds: BeastWorld[] = b.nawia ? ['jawia', 'nawia'] : ['jawia'];
  for (const world of worlds) {
    const form = beastForm(b, world);
    const frames = beastFrameRows(b, world);
    if (!form.frames.stand) errors.push(`${world}: no standing frame`);
    if (![2, 4].includes(form.frames.walk?.length ?? 0)) errors.push(`${world}: the walk has ${form.frames.walk?.length ?? 0} frames, expected 2 or 4`);
    if (![1, 2].includes(form.frames.attack?.length ?? 0)) errors.push(`${world}: the attack has ${form.frames.attack?.length ?? 0} frames, expected 1 or 2`);
    const used = new Set<number>();
    for (const { pose, i, rows } of frames) {
      const at = `${world} ${pose}${pose === 'stand' ? '' : ' ' + (i + 1)}`;
      if (rows.length !== b.h) errors.push(`${at}: ${rows.length} rows, expected ${b.h}`);
      rows.forEach((r, y) => {
        if (r.length !== b.w) errors.push(`${at}, row ${y}: ${r.length} wide, expected ${b.w}: "${r}"`);
        for (const ch of new Set(r)) if (ch !== '.' && form.pal[ch] === undefined) errors.push(`${at}, row ${y}: no colour for "${ch}"`);
      });
      if (rows[b.h - 1] && /[^.]/.test(rows[b.h - 1])) errors.push(`${at}: the last row must stay empty`);
      for (const px of paintRows(rows, b.w, b.h, form.pal, form.ink, false).u32) if (px >>> 24) used.add(px & 0xffffff);
    }
    if (used.size > 15) errors.push(`${world}: ${used.size} colours, at most 15`);
  }
  return errors;
}

/**
 * The sheet the playground walks it with, for one form: stand, the walk, the attack in a row. `frameOf(phase)`
 * maps the playground's phases (0 stands, 1-4 walk, 5-6 attack) to a column.
 */
export function beastSheet(b: Beast, world: BeastWorld, strict = true): { buf: PixelBuffer; fw: number; fh: number; colors: number; frameOf: (phase: number) => number } {
  const frames = beastFrameRows(b, world);
  const buf = new PixelBuffer(b.w * frames.length, b.h);
  const used = new Set<number>();
  frames.forEach((f, k) => {
    const pic = beastFrame(b, world, f.pose, f.i, strict);
    for (const px of pic.u32) if (px >>> 24) used.add(px & 0xffffff);
    buf.copy(pic, k * b.w, 0);
  });
  const walks = beastForm(b, world).frames.walk?.length ?? 0;
  const attacks = beastForm(b, world).frames.attack?.length ?? 0;
  const frameOf = (phase: number): number => {
    if (phase >= 5) return attacks ? 1 + walks + Math.min(phase - 5, attacks - 1) : 0;
    if (phase <= 0 || !walks) return 0;
    // two walk frames: 1, stand, 2, stand; four: 1, 2, 3, 4
    if (walks === 2) return phase === 1 ? 1 : phase === 3 ? 2 : 0;
    return phase;
  };
  return { buf, fw: b.w, fh: b.h, colors: used.size, frameOf };
}
