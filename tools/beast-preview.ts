// Pictures of the monsters drawn whole (src/art/beasts), for drawing them by hand (see docs/HERO-DRAWING.md).
//
//   npm run beast:preview -- M1           one monster, by its code
//   npm run beast:preview -- M1 M2 M3     several
//   npm run beast:preview                 every monster there is
//
// For each it writes art-template/beasts/<code>.png (that folder is not committed) with, for each of its forms
// (Jawia, and Nawia when it has one):
//   - the standing frame very large, with a grid and row/column numbers;
//   - every frame (stand, the walk, the attack) large, on grass and on a dark floor (Nawia: on its dark);
//   - the same at three times the game's size, next to the hero (C1g), for scale.
// It also prints the colour count of each form and everything checkBeast() finds wrong.

import { mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { PixelBuffer } from '../src/core/PixelBuffer.ts';
import { beastFrame, beastFrameRows, beastSheet, checkBeast, type Beast, type BeastWorld } from '../src/art/beasts/beast.ts';
import { conceptFrame } from '../src/art/concepts/concept.ts';
import { CONCEPT as HERO } from '../src/art/concepts/najlepszy-g.concept.ts';
import { writePng } from './png.ts';
import { FLOOR, GRASS, NAWIA, PAPER, label, numbered, zoomed } from './previewKit.ts';

const ROOT = new URL('..', import.meta.url).pathname;
const DIR = join(ROOT, 'src/art/beasts');
const OUT = join(ROOT, 'art-template/beasts');

const beasts: Beast[] = [];
// a file that cannot be read (a typo, or still being written) is skipped and named, so the others still show
for (const f of readdirSync(DIR).filter((f) => f.endsWith('.beast.ts'))) {
  try {
    beasts.push((await import(pathToFileURL(join(DIR, f)).href)).BEAST);
  } catch (e) {
    console.log(`! ${f} cannot be read: ${(e as Error).message.split('\n')[0]}`);
  }
}
beasts.sort((a, b) => a.code.localeCompare(b.code, 'en', { numeric: true }));

const wanted = process.argv.slice(2).map((s) => s.toLowerCase());
const chosen = wanted.length ? beasts.filter((b) => wanted.includes(b.code.toLowerCase()) || wanted.includes(b.id)) : beasts;
if (!chosen.length) {
  console.error(`no monster called ${wanted.join(', ') || '(any)'}; there are: ${beasts.map((b) => b.code).join(' ') || 'none yet'}`);
  process.exit(1);
}

const hero = conceptFrame(HERO, 'side', 0);
mkdirSync(OUT, { recursive: true });
for (const b of chosen) {
  const errors = checkBeast(b);
  const worlds: BeastWorld[] = b.nawia ? ['jawia', 'nawia'] : ['jawia'];
  const Z = b.w > 24 ? 12 : 16;
  const z = 8;
  const n = beastFrameRows(b, 'jawia').length;
  const W = Math.max(b.w * Z + 80, n * (b.w * z + 8) + 16, 640);
  const bigH = b.h * Z + 40;
  const stripH = b.h * z + 16;
  const gameH = (b.h + 8) * 3;
  const block = bigH + stripH * 2 + gameH + 40;
  const card = new PixelBuffer(W, 40 + worlds.length * block).fill(PAPER);
  const colours: string[] = [];
  label(card, 8, 6, `${b.code}  ${b.kind.pl}: ${b.name.pl}  ${b.w}x${b.h}${b.alt.length ? '  zamiast ' + b.alt.join(' ') : '  nowy'}`);

  worlds.forEach((world, k) => {
    let y = 40 + k * block;
    const sheet = beastSheet(b, world, false);
    colours.push(`${world} ${sheet.colors}`);
    label(card, 8, y, world === 'jawia' ? 'Jawia' : 'Nawia', 1);
    numbered(card, beastFrame(b, world, 'stand', 0, false), Z, 40, y + 24);
    y += bigH;
    const frames = beastFrameRows(b, world);
    const backs = world === 'jawia' ? [GRASS, FLOOR] : [NAWIA, FLOOR];
    for (const bg of backs) {
      const strip = new PixelBuffer(W, stripH).fill(bg);
      frames.forEach((f, i) => strip.blit(zoomed(beastFrame(b, world, f.pose, f.i, false), z, bg), 8 + i * (b.w * z + 8), 8));
      card.blit(strip, 0, y);
      y += stripH;
    }
    // at the game's size (x3): the hero, then every frame, then the frames mirrored
    const game = new PixelBuffer(Math.floor(W / 3), b.h + 8).fill(backs[0]);
    game.blit(hero, 4, game.h - 2 - hero.h);
    frames.forEach((f, i) => game.blit(beastFrame(b, world, f.pose, f.i, false), 26 + i * (b.w + 4), game.h - 2 - b.h));
    const stand = beastFrame(b, world, 'stand', 0, false).flipH();
    game.blit(stand, 26 + frames.length * (b.w + 4) + 8, game.h - 2 - b.h);
    card.blit(game.scaled(3), 0, y + 8);
  });

  const file = join(OUT, `${b.code}.png`);
  writePng(file, card);
  console.log(`${b.code} ${b.id}: ${b.w}x${b.h}, colours ${colours.join(', ')}${errors.length ? '' : ', OK'}  ->  ${file}`);
  for (const e of errors) console.log('  ! ' + e);
}
