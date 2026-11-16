// Pictures of Sambor's animation sheet (src/art/hero/sambor.anim.ts), for drawing and judging his frames.
//
//   npm run hero:anim                 every animation
//   npm run hero:anim -- run atkA     some of them
//   npm run hero:anim -- run --text   also print the frames' letter rows (to find a pixel to change)
//
// Writes art-template/hero-anim/ (that folder is not committed):
//   - <anim>-<view>.png: the frames eight times their size, numbered and named after the layout's `keys`,
//     with the cell's centre column and the foot row marked; for the run and the strikes, the same frames
//     again over a faint copy of the frame before (onion skin: what moved); and the frames at three times
//     their size, as in the game, on grass and on a dark stone floor (the side view also facing left);
//   - sheet.png and sheet-bare.png: both whole sheets, twice their size;
//   - game.png: every animation at game size (x3), all three views, armed.
// It also prints the colours each sheet uses and where the blade's tip is in each strike frame.

import { join } from 'node:path';
import { PixelBuffer, mix, rgb } from '../src/core/PixelBuffer.ts';
import { ANIM_ORDER, ANIMS, CELL, type HeroAnim, type HeroView } from '../src/art/hero/layout.ts';
import { BLADE_TIP, samborFrame, samborRows } from '../src/art/hero/sambor.anim.ts';
import { writePng } from './png.ts';
import { FLOOR, GRASS, PAPER, label, zoomed } from './previewKit.ts';

const ROOT = new URL('..', import.meta.url).pathname;
const OUT = join(ROOT, 'art-template/hero-anim');
const VIEWS: HeroView[] = ['down', 'up', 'side'];
const ONION: HeroAnim[] = ['run', 'atkA', 'atkB', 'atkC', 'roll'];
const GUIDE = rgb(0xb4a890);
const TIP = rgb(0xff3df0);

const text = process.argv.includes('--text');
const wanted = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const anims = wanted.length ? ANIM_ORDER.filter((a) => wanted.includes(a)) : ANIM_ORDER;
if (!anims.length) {
  console.error(`no animation called ${wanted.join(', ')}; there are: ${ANIM_ORDER.join(' ')}`);
  process.exit(1);
}

/** A frame blown up `z` times on `bg`, with the centre column and the foot row marked under it. */
function big(f: PixelBuffer, z: number, bg: number, under?: PixelBuffer, tip?: [number, number]): PixelBuffer {
  const base = new PixelBuffer(f.w, f.h).fill(bg);
  for (let y = 0; y < f.h; y++) {
    base.set(CELL.cx, y, mix(bg, GUIDE, 0.35));
  }
  for (let x = 0; x < f.w; x++) base.set(x, CELL.foot - 1, mix(bg, GUIDE, 0.35));
  if (under)
    for (let y = 0; y < f.h; y++)
      for (let x = 0; x < f.w; x++) {
        const c = under.get(x, y);
        if (c >>> 24) base.set(x, y, mix(bg, c, 0.3));
      }
  base.blit(f, 0, 0);
  const out = zoomed(base, z, bg);
  if (tip) {
    // a ring round the pixel the smear takes as the blade's tip
    const [tx, ty] = tip;
    for (let i = 0; i < z; i++) {
      out.set(tx * z + i, ty * z, TIP);
      out.set(tx * z + i, ty * z + z - 1, TIP);
      out.set(tx * z, ty * z + i, TIP);
      out.set(tx * z + z - 1, ty * z + i, TIP);
    }
  }
  return out;
}

function onPlain(f: PixelBuffer, bg: number): PixelBuffer {
  const b = new PixelBuffer(f.w, f.h).fill(bg);
  b.blit(f, 0, 0);
  return b;
}

const Z = 8;
const GAP = 12;
for (const anim of anims) {
  const spec = ANIMS[anim];
  for (const view of VIEWS) {
    const frames = Array.from({ length: spec.frames }, (_, i) => samborFrame(anim, view, i, true));
    const bare = Array.from({ length: spec.frames }, (_, i) => samborFrame(anim, view, i, false));
    const tips = anim === 'atkA' || anim === 'atkB' || anim === 'atkC' ? BLADE_TIP[anim][view] : undefined;
    const fw = CELL.w * Z;
    const W = Math.max(spec.frames, 6) * (fw + GAP) + GAP;
    const onion = ONION.includes(anim);
    const H = 40 + (CELL.h * Z + 40) * (onion ? 2 : 1) + 40 + (CELL.h * 3 + 8) * 4 + 20;
    const card = new PixelBuffer(W, H).fill(PAPER);
    label(card, GAP, 8, `${anim}  ${view}   ${spec.ms.join(' ')} ms${spec.loop ? '  loop' : ''}${spec.active ? `  active ${spec.active.join('-')}` : ''}${spec.safe ? `  safe ${spec.safe.join('-')}` : ''}`);
    let y = 40;
    frames.forEach((f, i) => {
      const x = GAP + i * (fw + GAP);
      label(card, x, y, `${i}  ${spec.keys[i]}`);
      card.blit(big(f, Z, GRASS, undefined, tips?.[i]), x, y + 24);
    });
    y += CELL.h * Z + 40;
    if (onion) {
      frames.forEach((f, i) => {
        const x = GAP + i * (fw + GAP);
        const prev = frames[(i + spec.frames - 1) % spec.frames];
        label(card, x, y, `${i} over ${(i + spec.frames - 1) % spec.frames}`);
        card.blit(big(f, Z, FLOOR, prev), x, y + 24);
      });
      y += CELL.h * Z + 40;
    }
    label(card, GAP, y + 8, 'x3: armed on grass, on stone; bare on grass' + (view === 'side' ? '; facing left' : ''));
    y += 32;
    const rows: [PixelBuffer[], number, boolean][] = [
      [frames, GRASS, false],
      [frames, FLOOR, false],
      [bare, GRASS, false],
    ];
    if (view === 'side') rows.push([frames, FLOOR, true]);
    for (const [set, bg, flip] of rows) {
      set.forEach((f, i) => card.blit(onPlain(flip ? f.flipH() : f, bg).scaled(3), GAP + i * (CELL.w * 3 + 4), y));
      y += CELL.h * 3 + 8;
    }
    writePng(join(OUT, `${anim}-${view}.png`), card);
    if (text) printRows(anim, view);
  }
}

/** The letter rows of every frame of an animation side by side, rows 2..29, with the cell's column numbers. */
function printRows(anim: HeroAnim, view: HeroView): void {
  const n = ANIMS[anim].frames;
  const sets = Array.from({ length: n }, (_, i) => samborRows(anim, view, i, true));
  const ruler = Array.from({ length: CELL.w }, (_, x) => String(x % 10)).join('');
  console.log(`\n${anim} ${view}`);
  console.log('   ' + sets.map(() => ruler).join('  '));
  for (let y = 0; y < CELL.h; y++) {
    if (sets.every((s) => /^\.*$/.test(s[y]))) continue;
    console.log(String(y).padStart(2) + ' ' + sets.map((s) => s[y]).join('  '));
  }
}

// the whole sheets, and a page of everything at game size
const colours: string[] = [];
for (const armed of [true, false]) {
  const used = new Set<number>();
  const cols = ANIM_ORDER.reduce((n, a) => n + ANIMS[a].frames, 0);
  const sheet = new PixelBuffer(cols * CELL.w, VIEWS.length * CELL.h).fill(GRASS);
  VIEWS.forEach((view, r) => {
    let c = 0;
    for (const anim of ANIM_ORDER)
      for (let i = 0; i < ANIMS[anim].frames; i++) {
        const f = samborFrame(anim, view, i, armed);
        for (const px of f.u32) if (px >>> 24) used.add(px & 0xffffff);
        sheet.blit(f, c * CELL.w, r * CELL.h);
        c++;
      }
  });
  writePng(join(OUT, armed ? 'sheet.png' : 'sheet-bare.png'), sheet.scaled(2));
  colours.push(`${armed ? 'armed' : 'bare'} ${used.size} colours`);
}

const page = new PixelBuffer(6 * (CELL.w * 3 + 4) * 3 + 40, ANIM_ORDER.length * (CELL.h * 3 + 20) + 20).fill(PAPER);
ANIM_ORDER.forEach((anim, k) => {
  const y = 10 + k * (CELL.h * 3 + 20);
  label(page, 4, y, anim, 1);
  VIEWS.forEach((view, v) => {
    for (let i = 0; i < ANIMS[anim].frames; i++) {
      const f = onPlain(samborFrame(anim, view, i, true), v === 1 ? FLOOR : GRASS);
      page.blit(f.scaled(3), 40 + v * 6 * (CELL.w * 3 + 4) + i * (CELL.w * 3 + 4), y + 10);
    }
  });
});
writePng(join(OUT, 'game.png'), page);

console.log(`${colours.join(', ')}  ->  ${OUT}`);
for (const a of ['atkA', 'atkB', 'atkC'] as const)
  for (const v of VIEWS) {
    const tips = BLADE_TIP[a][v];
    const out = tips.some(([x, y]) => x < 0 || y < 0 || x >= CELL.w || y >= CELL.h);
    console.log(`  blade tip ${a} ${v}: ${tips.map(([x, y]) => `${x},${y}`).join('  ')}${out ? '   ! the tip is outside the cell' : ''}`);
  }
