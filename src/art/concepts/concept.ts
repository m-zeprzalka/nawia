// Concept art for the hero: whole drawings, one per view and per step of the walk.
//
// The earlier experiments (heroStyles.ts, dolls.ts) assemble a figure from parts, which makes every figure
// built with them alike. A concept is drawn whole instead: nine pictures (three views, three poses), each
// as many rows as the figure is tall. Nothing is shared between concepts but this file.
//
// Each concept lives in its own file next to this one (`<id>.concept.ts`, exporting `CONCEPT`); the
// playground finds them by that name. Who stands on the board is decided in src/lab/lineup.txt.
//
// Rules every concept keeps:
//  - the cell is 16 px wide and `h` rows tall (16 to 23); the soles stand on row h - 2, the last row stays
//    empty (the line under the feet goes there);
//  - views: 'down' faces us, 'up' shows the back, 'side' faces right (walking left mirrors it);
//  - poses: 0 stands, 1 and 2 are the two strides; the walk plays stand, 1, stand, 2;
//  - at most 15 colours, the line included: what a 16-bit sprite had;
//  - one letter, one colour (`pal`); '.' is empty.

import { PixelBuffer, rgb } from '../../core/PixelBuffer.ts';
import type { Sheet } from '../sheet.ts';

export type View = 'down' | 'up' | 'side';
export type Pose = 0 | 1 | 2;
export type Frames = readonly [string[], string[], string[]];

/**
 * What the game itself needs of a hero, beyond the walk: every pose of its hero sheet, in each view
 * (see HERO in art/actors.ts): standing, the two strides, the swing (wind-up, blow), the raised shield, the hop.
 */
export type GamePose = 'stand' | 'walkA' | 'walkB' | 'atk0' | 'atk1' | 'guard' | 'hop';
export type GamePoses = Record<View, Record<GamePose, string[]>>;

export interface Concept {
  /** the code it is known by on the board (C1, C2...) */
  code: string;
  id: string;
  name: { pl: string; en: string };
  /** one or two sentences: who he is and how he is drawn */
  note: { pl: string; en: string };
  /** cell height, 16 to 23 */
  h: number;
  /** letter -> colour (0xRRGGBB) */
  pal: Record<string, number>;
  frames: Record<View, Frames>;
  /**
   * The line round the figure, added to every empty pixel next to it:
   *  - 'none':   no line added (the drawing may still draw its own with a letter);
   *  - 'dark':   one colour all round (`outline`);
   *  - 'tinted': all round, each stretch in the colour `line` gives the letter it borders (else `outline`);
   *  - 'rim':    like 'tinted', but only below and to the right of the figure: the shadow side.
   */
  ink: 'none' | 'dark' | 'tinted' | 'rim';
  outline?: number;
  line?: Record<string, number>;
}

const W = 16;
const POSES: readonly Pose[] = [0, 1, 2];
const VIEWS: readonly View[] = ['down', 'up', 'side'];

/** Everything wrong with a concept, as sentences; empty when it is fine. */
export function checkConcept(c: Concept): string[] {
  const errors: string[] = [];
  if (c.h < 16 || c.h > 23) errors.push(`height ${c.h} is outside 16-23`);
  for (const view of VIEWS)
    for (const pose of POSES) {
      const rows = c.frames[view]?.[pose];
      const at = `${view} ${pose}`;
      if (!rows) {
        errors.push(`${at}: missing`);
        continue;
      }
      if (rows.length !== c.h) errors.push(`${at}: ${rows.length} rows, expected ${c.h}`);
      rows.forEach((r, y) => {
        if (r.length !== W) errors.push(`${at}, row ${y}: ${r.length} wide, expected ${W}: "${r}"`);
        for (const ch of r) if (ch !== '.' && c.pal[ch] === undefined) errors.push(`${at}, row ${y}: no colour for "${ch}"`);
      });
      if (rows[c.h - 1] && /[^.]/.test(rows[c.h - 1])) errors.push(`${at}: the last row must stay empty`);
    }
  const used = new Set<number>();
  for (const view of VIEWS)
    for (const pose of POSES) {
      if (!c.frames[view]?.[pose]) continue;
      for (const px of conceptFrame(c, view, pose, false).u32) if (px >>> 24) used.add(px & 0xffffff);
    }
  if (used.size > 15) errors.push(`${used.size} colours, at most 15`);
  return errors;
}

/** One frame, coloured and lined. With `strict` a bad drawing throws instead of drawing what it can. */
export function conceptFrame(c: Concept, view: View, pose: Pose, strict = true): PixelBuffer {
  return paintRows(c.frames[view][pose], W, c.h, c.pal, c, strict, `concept "${c.id}"`);
}

/** How a drawing is lined: see Concept['ink']. */
export interface Ink {
  ink: 'none' | 'dark' | 'tinted' | 'rim';
  outline?: number;
  line?: Record<string, number>;
}

/**
 * Letter rows (one letter, one colour; '.' empty) as a picture `w` x `h`, with the line round it that `ink`
 * asks for. Shared by the hero concepts and the monsters (beasts/beast.ts).
 */
export function paintRows(rows: readonly string[], w: number, h: number, pal: Record<string, number>, ink: Ink, strict = true, who = 'drawing'): PixelBuffer {
  const b = new PixelBuffer(w, h);
  const at = (x: number, y: number): string => (x < 0 || y < 0 || x >= w || y >= h ? '.' : (rows[y]?.[x] ?? '.'));
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const ch = at(x, y);
      if (ch !== '.') {
        const hex = pal[ch];
        if (hex === undefined) {
          if (strict) throw new Error(`${who} has no colour for "${ch}"`);
          continue;
        }
        b.set(x, y, rgb(hex));
        continue;
      }
      if (ink.ink === 'none') continue;
      // the pixel above a gap decides its line first, then the one to its left: that is the shadow side
      const up = at(x, y - 1);
      const left = at(x - 1, y);
      const n = up !== '.' ? up : left !== '.' ? left : ink.ink === 'rim' ? '.' : at(x + 1, y) !== '.' ? at(x + 1, y) : at(x, y + 1);
      if (n === '.' || pal[n] === undefined) continue;
      const hex = ink.ink === 'dark' ? ink.outline : (ink.line?.[n] ?? ink.outline);
      if (hex !== undefined) b.set(x, y, rgb(hex));
    }
  return b;
}

/** The walk sheet: rows down, up, side; columns stand, 1, stand, 2, stand. `strict` as in conceptFrame. */
export function conceptSheet(c: Concept, strict = true): Sheet {
  const buf = new PixelBuffer(W * 5, c.h * 3);
  VIEWS.forEach((view, row) => {
    ([0, 1, 0, 2, 0] as Pose[]).forEach((pose, col) => {
      if (c.frames[view]?.[pose]) buf.copy(conceptFrame(c, view, pose, strict), col * W, row * c.h);
    });
  });
  return { key: '', buf, fw: W, fh: c.h };
}
