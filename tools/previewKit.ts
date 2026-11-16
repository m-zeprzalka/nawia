// What the art preview tools (hero-preview.ts, beast-preview.ts) share: blowing a frame up with a grid, labels.

import { PixelBuffer, rgb } from '../src/core/PixelBuffer.ts';
import { drawText } from '../src/art/font.ts';

export const GRASS = rgb(0x5f9e48);
export const FLOOR = rgb(0x2a2733);
/** the dark of Nawia, for a monster's other form */
export const NAWIA = rgb(0x141228);
export const PAPER = rgb(0xece6da);
const GRID = rgb(0xc9c0b0);
const INK = rgb(0x3a3430);

/** A frame blown up `z` times, with a grid line between pixels. */
export function zoomed(f: PixelBuffer, z: number, bg: number): PixelBuffer {
  const b = new PixelBuffer(f.w * z, f.h * z).fill(bg);
  for (let y = 0; y < f.h; y++)
    for (let x = 0; x < f.w; x++) {
      const c = f.get(x, y);
      for (let j = 0; j < z; j++)
        for (let i = 0; i < z; i++) {
          const edge = i === 0 || j === 0;
          if (c >>> 24) b.set(x * z + i, y * z + j, edge ? darker(c) : c);
          else if (edge) b.set(x * z + i, y * z + j, GRID);
        }
    }
  return b;
}
const darker = (c: number): number => rgb((Math.round((c & 255) * 0.85) << 16) | (Math.round(((c >> 8) & 255) * 0.85) << 8) | Math.round(((c >> 16) & 255) * 0.85));

/** Text, in the game's own pixel font, `s` times its size. */
export function label(b: PixelBuffer, x: number, y: number, text: string, s = 2): void {
  const t = new PixelBuffer(text.length * 6 + 2, 9);
  drawText(t, text, 0, 0, INK);
  b.blit(t.scaled(s), x, y);
}

/** A frame blown up with a grid, column numbers above it and row numbers at its left. */
export function numbered(card: PixelBuffer, f: PixelBuffer, z: number, x: number, y: number): void {
  card.blit(zoomed(f, z, PAPER), x, y);
  for (let i = 0; i < f.w; i++) label(card, x + i * z + Math.floor(z / 2) - 3, y - 14, String(i % 10), 1);
  for (let j = 0; j < f.h; j++) label(card, x - 16, y + j * z + Math.floor(z / 2) - 4, String(j).padStart(2), 1);
}
