// Pictures of the monsters drawn whole (src/art/beasts), for drawing them by hand (see docs/HERO-DRAWING.md).
//
//   npm run beast:preview -- M1                 one monster, by its code
//   npm run beast:preview -- M1 M2 M3           several
//   npm run beast:preview                       every monster there is
//   npm run beast:preview -- M1 --big=attack1   the frames shown very large: stand (the default), walk1..4,
//                                               attack1..3 (the wind-up, the blow, the recovery), hurt; or
//                                               several, comma-separated (--big=stand,attack1,hurt)
//   npm run beast:preview -- M1 --world=nawia   only one of its forms (a smaller picture)
//
// For each it writes art-template/beasts/<code>.png (that folder is not committed) with, for each of its forms
// (Jawia, and Nawia when it has one):
//   - the frames asked for (the standing one) very large, with a grid and row/column numbers;
//   - every frame large and named (stand and the walk on one line; the wind-up, the blow, the recovery and the
//     flinch on the next), on the two grounds it is met on: Jawia on grass and on a dungeon's grey flagstones,
//     Nawia on its navy floor with the cyan seams and on the starry dark beyond the walls;
//   - the same at three times the game's size on both grounds, next to the hero (C1g), for scale;
//   - the same at the game's own size, once more, among its fellows: the whole set in a row, so a wind-up or a
//     flinch that does not stand out from the walk shows at once.
// It also prints the colour count of each form and everything checkBeast() finds wrong.

import { mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { PixelBuffer, rgb } from '../src/core/PixelBuffer.ts';
import { beastFrame, beastFrameRows, checkBeast, beastSheet, type Beast, type BeastPose, type BeastWorld } from '../src/art/beasts/beast.ts';
import { conceptFrame } from '../src/art/concepts/concept.ts';
import { CONCEPT as HERO } from '../src/art/concepts/najlepszy-g.concept.ts';
import { writePng } from './png.ts';
import { PAPER, label, numbered, zoomed } from './previewKit.ts';

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

const args = process.argv.slice(2);
const bigArg = args.find((a) => a.startsWith('--big='));
const bigNames = (bigArg ? bigArg.slice(6) : 'stand').split(',').filter(Boolean);
const worldArg = args.find((a) => a.startsWith('--world='))?.slice(8) as BeastWorld | undefined;
const wanted = args.filter((a) => !a.startsWith('--')).map((s) => s.toLowerCase());
const chosen = wanted.length ? beasts.filter((b) => wanted.includes(b.code.toLowerCase()) || wanted.includes(b.id)) : beasts;
if (!chosen.length) {
  console.error(`no monster called ${wanted.join(', ') || '(any)'}; there are: ${beasts.map((b) => b.code).join(' ') || 'none yet'}`);
  process.exit(1);
}

// ------------------------------------------------------------------ the grounds

type Ground = 'grass' | 'stone' | 'navy' | 'void';
const GROUNDS: Record<BeastWorld, [Ground, Ground]> = { jawia: ['grass', 'stone'], nawia: ['navy', 'void'] };

/** A little noise that does not change between runs. */
const hash = (x: number, y: number): number => {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

/** A patch of ground, close to what the game paints (src/art/palette.ts): texture matters to what reads. */
function ground(kind: Ground, w: number, h: number): PixelBuffer {
  const b = new PixelBuffer(w, h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const n = hash(x, y);
      let c: number;
      if (kind === 'grass') c = n < 0.08 ? 0x487834 : n > 0.94 ? 0x79a440 : 0x5f9e48;
      else if (kind === 'stone') {
        // flagstones 16 x 16, every other course shifted half a stone; seams dark, the top edge of a stone lit
        const sx = (x + (Math.floor(y / 16) % 2) * 8) % 16;
        const sy = y % 16;
        c = sx === 0 || sy === 0 ? 0x282b36 : sy === 1 ? 0x586166 : n < 0.1 ? 0x3c424c : 0x464d55;
      } else if (kind === 'navy') {
        const sx = (x + (Math.floor(y / 16) % 2) * 8) % 16;
        const sy = y % 16;
        c = sx === 0 || sy === 0 ? (n < 0.12 ? 0x8ef0ee : 0x1e6c8a) : n < 0.06 ? 0x1d2456 : 0x151a42;
      } else c = n < 0.004 ? 0xdce6ff : n < 0.01 ? 0x3a4680 : 0x0b0e22;
      b.set(x, y, rgb(c));
    }
  return b;
}

// ------------------------------------------------------------------ the frames, named

const NAMES: Record<BeastPose, string[]> = { stand: ['stand'], walk: ['walk1', 'walk2', 'walk3', 'walk4'], attack: ['wind-up', 'blow', 'recover'], hurt: ['hurt'] };
const nameOf = (pose: BeastPose, i: number): string => NAMES[pose][i] ?? `${pose}${i + 1}`;
const keyOf = (pose: BeastPose, i: number): string => (pose === 'stand' || pose === 'hurt' ? pose : `${pose}${i + 1}`);

const hero = conceptFrame(HERO, 'side', 0);
mkdirSync(OUT, { recursive: true });
for (const b of chosen) {
  const errors = checkBeast(b);
  const worlds: BeastWorld[] = (b.nawia ? (['jawia', 'nawia'] as BeastWorld[]) : (['jawia'] as BeastWorld[])).filter((w) => !worldArg || w === worldArg);
  if (!worlds.length) worlds.push('jawia');
  const Z = b.w > 24 ? 10 : b.w > 16 ? 12 : 16;
  const z = b.w > 24 ? 6 : 8;
  const all = worlds.map((w) => beastFrameRows(b, w));
  const lines = (fr: ReturnType<typeof beastFrameRows>) => [fr.filter((f) => f.pose === 'stand' || f.pose === 'walk'), fr.filter((f) => f.pose === 'attack' || f.pose === 'hurt')];
  const most = Math.max(...all.flatMap((fr) => lines(fr).map((l) => l.length)));
  const n = Math.max(...all.map((fr) => fr.length));
  const bigs = (world: BeastWorld) => beastFrameRows(b, world).filter((f) => bigNames.includes(keyOf(f.pose, f.i)));
  const nBig = Math.max(1, ...worlds.map((w) => bigs(w).length));
  const W = Math.max(nBig * (b.w * Z + 56) + 40, most * (b.w * z + 8) + 16, 3 * (26 + n * (b.w + 4) + b.w + 12), 640);
  const bigH = b.h * Z + 56;
  const stripH = 2 * (b.h * z + 30) + 8;
  const gameH = (b.h + 8) * 3 + 6;
  const crowdH = (b.h + 8) * 3 + 6;
  const block = 30 + bigH + stripH * 2 + gameH * 2 + crowdH + 24;
  const card = new PixelBuffer(W, 40 + worlds.length * block).fill(PAPER);
  const colours: string[] = [];
  label(card, 8, 6, `${b.code}  ${b.kind.pl}: ${b.name.pl}  ${b.w}x${b.h}${b.alt.length ? '  zamiast ' + b.alt.join(' ') : '  nowy'}`);

  worlds.forEach((world, k) => {
    let y = 40 + k * block;
    const sheet = beastSheet(b, world, false);
    colours.push(`${world} ${sheet.colors}`);
    label(card, 8, y, world === 'jawia' ? 'Jawia' : 'Nawia', 2);
    y += 30;
    // the frames asked for, very large
    const big = bigs(world);
    (big.length ? big : beastFrameRows(b, world).slice(0, 1)).forEach((f, i) => {
      const x = 40 + i * (b.w * Z + 56);
      label(card, x, y, nameOf(f.pose, f.i), 1);
      numbered(card, beastFrame(b, world, f.pose, f.i, false), Z, x, y + 26);
    });
    y += bigH;

    const frames = beastFrameRows(b, world);
    const backs = GROUNDS[world];
    for (const bg of backs) {
      const floor = ground(bg, 4096, 64);
      const strip = new PixelBuffer(W, stripH).fill(PAPER);
      lines(frames).forEach((line, row) =>
        line.forEach((f, i) => {
          const x = 8 + i * (b.w * z + 8);
          const top = row * (b.h * z + 30);
          label(strip, x, top + 4, nameOf(f.pose, f.i), 1);
          const pic = floor.sub(x % 1024, 4, b.w, b.h);
          pic.blit(beastFrame(b, world, f.pose, f.i, false), 0, 0);
          strip.blit(zoomed(pic, z, 0), x, top + 22);
        }),
      );
      card.blit(strip, 0, y);
      y += stripH;
    }
    // at three times the game's size: the hero, then every frame, then the stand mirrored
    for (const bg of backs) {
      const game = ground(bg, Math.floor(W / 3), b.h + 8);
      game.blit(hero, 4, game.h - 2 - hero.h);
      frames.forEach((f, i) => game.blit(beastFrame(b, world, f.pose, f.i, false), 26 + i * (b.w + 4), game.h - 2 - b.h));
      game.blit(beastFrame(b, world, 'stand', 0, false).flipH(), 26 + frames.length * (b.w + 4) + 8, game.h - 2 - b.h);
      card.blit(game.scaled(3), 0, y + 3);
      y += gameH;
    }
    // a crowd at the game's size (blown up x3 so it can be seen): four walking, one winding up, one flinching
    const walks = frames.filter((f) => f.pose === 'walk');
    const windup = frames.find((f) => f.pose === 'attack');
    const hurt = frames.find((f) => f.pose === 'hurt');
    const crowd = ground(backs[0], Math.floor(W / 3), b.h + 8);
    const cast = [walks[0], walks[1], windup, walks[2] ?? walks[0], hurt, walks[3] ?? walks[1], walks[0]].filter((f) => f !== undefined);
    cast.forEach((f, i) => {
      const pic = beastFrame(b, world, f.pose, f.i, false);
      crowd.blit(i % 2 ? pic.flipH() : pic, 4 + i * (b.w - 2), crowd.h - 2 - b.h - (i % 3) * 2);
    });
    card.blit(crowd.scaled(3), 0, y + 3);
  });

  const file = join(OUT, `${b.code}.png`);
  writePng(file, card);
  console.log(`${b.code} ${b.id}: ${b.w}x${b.h}, colours ${colours.join(', ')}${errors.length ? '' : ', OK'}  ->  ${file}`);
  for (const e of errors) console.log('  ! ' + e);
}
