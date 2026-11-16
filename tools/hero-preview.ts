// Pictures of hero concepts, for drawing them by hand (see docs/HERO-DRAWING.md).
//
//   npm run hero:preview -- C1e            one concept, by its code
//   npm run hero:preview -- C1e C1f C7c    several, side by side
//   npm run hero:preview                    every concept there is
//
// For each concept it writes art-template/hero/<code>.png (that folder is not committed) with:
//   - at the top, the heads facing us and from the side, very large, with a grid and row/column numbers:
//     what to look at when you change single pixels of a face;
//   - the nine frames (down, side, up; standing and the two strides) on grass and on a dark floor, large;
//   - the walk as the game plays it, and everything at three times its size, as you see it in the game.
// It also prints the colour count and everything checkConcept() finds wrong.

import { mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { PixelBuffer, rgb } from '../src/core/PixelBuffer.ts';
import { checkConcept, conceptFrame, type Concept, type Pose, type View } from '../src/art/concepts/concept.ts';
import { drawText } from '../src/art/font.ts';
import { writePng } from './png.ts';

const ROOT = new URL('..', import.meta.url).pathname;
const DIR = join(ROOT, 'src/art/concepts');
const OUT = join(ROOT, 'art-template/hero');

const concepts: Concept[] = [];
for (const f of readdirSync(DIR).filter((f) => f.endsWith('.concept.ts'))) concepts.push((await import(pathToFileURL(join(DIR, f)).href)).CONCEPT);
concepts.sort((a, b) => a.code.localeCompare(b.code, 'en', { numeric: true }));

const wanted = process.argv.slice(2).map((s) => s.toLowerCase());
const chosen = wanted.length ? concepts.filter((c) => wanted.includes(c.code.toLowerCase()) || wanted.includes(c.id)) : concepts;
if (!chosen.length) {
  console.error(`no concept called ${wanted.join(', ')}; there are: ${concepts.map((c) => c.code).join(' ')}`);
  process.exit(1);
}

const GRASS = rgb(0x5f9e48);
const FLOOR = rgb(0x2a2733);
const PAPER = rgb(0xece6da);
const GRID = rgb(0xc9c0b0);
const INK = rgb(0x3a3430);

/** A frame blown up `z` times, with a grid line between pixels. */
function zoomed(f: PixelBuffer, z: number, bg: number): PixelBuffer {
  const b = new PixelBuffer(f.w * z, f.h * z).fill(bg);
  for (let y = 0; y < f.h; y++)
    for (let x = 0; x < f.w; x++) {
      const c = f.get(x, y);
      for (let j = 0; j < z; j++) for (let i = 0; i < z; i++) {
        const edge = i === 0 || j === 0;
        if (c >>> 24) b.set(x * z + i, y * z + j, edge ? mixGrid(c) : c);
        else if (edge) b.set(x * z + i, y * z + j, GRID);
      }
    }
  return b;
}
const mixGrid = (c: number): number => {
  const r = (c & 255) * 0.85, g = ((c >> 8) & 255) * 0.85, bl = ((c >> 16) & 255) * 0.85;
  return rgb((Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(bl));
};

/** Text, in the game's own pixel font, `s` times its size. */
function label(b: PixelBuffer, x: number, y: number, text: string, s = 2): void {
  const t = new PixelBuffer(text.length * 6 + 2, 9);
  drawText(t, text, 0, 0, INK);
  b.blit(t.scaled(s), x, y);
}

mkdirSync(OUT, { recursive: true });
for (const c of chosen) {
  const errors = checkConcept(c);
  const used = new Set<number>();
  const frame = (v: View, p: Pose): PixelBuffer => conceptFrame(c, v, p, false);
  for (const v of ['down', 'up', 'side'] as View[]) for (const p of [0, 1, 2] as Pose[]) for (const px of frame(v, p).u32) if (px >>> 24) used.add(px & 0xffffff);

  const Z = 24; // heads
  const z = 10; // frames
  const headRows = Math.min(c.h, 10);
  const headFront = frame('down', 0).sub(0, 0, 16, headRows);
  const headSide = frame('side', 0).sub(0, 0, 16, headRows);
  const seq: [View, Pose][] = [['down', 0], ['down', 1], ['down', 2], ['side', 0], ['side', 1], ['side', 2], ['up', 0], ['up', 1], ['up', 2]];

  const W = Math.max(16 * Z * 2 + 120, seq.length * (16 * z + 8) + 16);
  const headH = headRows * Z + 60;
  const framesH = (c.h * z + 16) * 2;
  const gameH = (c.h + 6) * 3 + 40;
  const card = new PixelBuffer(W, headH + framesH + gameH + 40).fill(PAPER);
  label(card, 8, 6, `${c.code}  ${c.name.pl}  16x${c.h}, ${used.size} kolorow`);

  // the heads, with column numbers above and row numbers at the left
  const hx = [40, 40 + 16 * Z + 60];
  [headFront, headSide].forEach((h, k) => {
    card.blit(zoomed(h, Z, PAPER), hx[k], 44);
    for (let x = 0; x < 16; x += 1) label(card, hx[k] + x * Z + 6, 30, String(x % 10), 1);
    for (let y = 0; y < headRows; y++) label(card, hx[k] - 14, 44 + y * Z + 8, String(y), 1);
  });

  // the nine frames, on grass and on a dark floor
  let y0 = headH;
  for (const bg of [GRASS, FLOOR]) {
    const strip = new PixelBuffer(W, c.h * z + 16).fill(bg);
    seq.forEach(([v, p], i) => strip.blit(zoomed(frame(v, p), z, bg), 8 + i * (16 * z + 8), 8));
    card.blit(strip, 0, y0);
    y0 += c.h * z + 16;
  }

  // the walk as the game plays it (stand, stride, stand, other stride), facing down and left; at game size
  const game = new PixelBuffer(Math.floor(W / 3), c.h + 6).fill(GRASS);
  const walk: [View, Pose, boolean][] = [['down', 0, false], ['down', 1, false], ['down', 0, false], ['down', 2, false], ['side', 0, true], ['side', 1, true], ['side', 0, true], ['side', 2, true], ['up', 0, false]];
  walk.forEach(([v, p, flip], i) => {
    const f = frame(v, p);
    game.blit(flip ? f.flipH() : f, 4 + i * 18, game.h - f.h - 2);
  });
  card.blit(game.scaled(3), 0, y0 + 16);
  label(card, 8, y0 + 2, 'w grze (x3)', 1);

  const file = join(OUT, `${c.code}.png`);
  writePng(file, card);
  console.log(`${c.code} ${c.id}: 16x${c.h}, ${used.size} colours${errors.length ? '' : ', OK'}  ->  ${file}`);
  for (const e of errors) console.log('  ! ' + e);
}
