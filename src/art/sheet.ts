// Small helpers shared by everything that draws sprite sheets.

import { PixelBuffer, type Color } from '../core/PixelBuffer.ts';

export interface Sheet {
  key: string;
  buf: PixelBuffer;
  fw: number;
  fh: number;
}

/** Lays frames out on a fixed grid: that grid is the contract for real art (see docs/ART.md). */
export function grid(key: string, fw: number, fh: number, cols: number, frames: (PixelBuffer | null)[]): Sheet {
  const rows = Math.ceil(frames.length / cols);
  const buf = new PixelBuffer(cols * fw, rows * fh);
  frames.forEach((f, i) => {
    if (f) buf.copy(f, (i % cols) * fw, Math.floor(i / cols) * fh, 0, 0, Math.min(fw, f.w), Math.min(fh, f.h));
  });
  return { key, buf, fw, fh };
}

/** ASCII art with a width check: a typo in a row should fail loudly, not draw a crooked sprite. */
export function art(width: number, rows: string[]): string[] {
  rows.forEach((r, i) => {
    if (r.length !== width) throw new Error(`sprite row ${i} is ${r.length} wide, expected ${width}: "${r}"`);
  });
  return rows;
}

/**
 * A flame, frame `f` of 4. `fire` is a ramp, hottest first (5 colours).
 * (cx, base) is the middle of its foot.
 */
export function flame(b: PixelBuffer, fire: readonly Color[], cx: number, base: number, height: number, width: number, f: number): void {
  for (let i = 0; i < height; i++) {
    const t = i / (height - 1); // 0 at the base, 1 at the tip
    const sway = Math.sin(f * (Math.PI / 2) + i * 0.9) * t * 1.7;
    const half = Math.max(0.5, (width / 2) * (1 - t * t) * (0.85 + 0.15 * Math.sin(f * 1.7 + i)));
    const y = base - i;
    for (let x = Math.floor(cx + sway - half); x <= Math.ceil(cx + sway + half - 1); x++) {
      const d = Math.abs(x + 0.5 - (cx + sway)) / half;
      const c = d < 0.35 && t < 0.5 ? fire[0] : d < 0.7 && t < 0.78 ? fire[1] : t > 0.86 ? fire[3] : fire[2];
      b.set(x, y, c);
    }
  }
  const sx = Math.round(cx + Math.sin(f * 2.1) * 3);
  b.set(sx, base - height - 1 - (f % 2), f % 2 ? fire[2] : fire[1]);
}
