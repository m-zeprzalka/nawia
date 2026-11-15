// A tiny software canvas. All placeholder art in the game is drawn into these,
// so the very same code runs in the browser (-> textures) and in Node (-> PNG export).
//
// Colors are packed the way a little-endian Uint32Array sees RGBA bytes: 0xAABBGGRR.

export type Color = number;

export const CLEAR: Color = 0;

/** 0xRRGGBB (+ alpha 0..255) -> packed color. */
export function rgb(hex: number, a = 255): Color {
  const r = (hex >> 16) & 255;
  const g = (hex >> 8) & 255;
  const b = hex & 255;
  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0;
}

export const alphaOf = (c: Color): number => c >>> 24;
export const withAlpha = (c: Color, a: number): Color => ((c & 0x00ffffff) | (a << 24)) >>> 0;

export function mix(c1: Color, c2: Color, t: number): Color {
  const u = 1 - t;
  const r = (c1 & 255) * u + (c2 & 255) * t;
  const g = ((c1 >> 8) & 255) * u + ((c2 >> 8) & 255) * t;
  const b = ((c1 >> 16) & 255) * u + ((c2 >> 16) & 255) * t;
  const a = (c1 >>> 24) * u + (c2 >>> 24) * t;
  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0;
}

/** Multiplies RGB by f (f > 1 brightens, clamped). */
export function shade(c: Color, f: number): Color {
  const r = Math.min(255, (c & 255) * f);
  const g = Math.min(255, ((c >> 8) & 255) * f);
  const b = Math.min(255, ((c >> 16) & 255) * f);
  return ((c & 0xff000000) | (b << 16) | (g << 8) | r) >>> 0;
}

export class PixelBuffer {
  readonly w: number;
  readonly h: number;
  readonly data: Uint8ClampedArray<ArrayBuffer>;
  readonly u32: Uint32Array;

  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.data = new Uint8ClampedArray(w * h * 4);
    this.u32 = new Uint32Array(this.data.buffer);
  }

  get(x: number, y: number): Color {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0;
    return this.u32[y * this.w + x];
  }

  /** Overwrites a pixel (no blending). */
  set(x: number, y: number, c: Color): void {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.u32[y * this.w + x] = c;
  }

  /** Draws a pixel with "source over" alpha blending. */
  plot(x: number, y: number, c: Color): void {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const a = c >>> 24;
    if (a === 0) return;
    const i = y * this.w + x;
    if (a === 255) {
      this.u32[i] = c;
      return;
    }
    const d = this.u32[i];
    const da = d >>> 24;
    const sa = a / 255;
    const oa = sa + (da / 255) * (1 - sa);
    if (oa <= 0) return;
    const k = ((da / 255) * (1 - sa)) / oa;
    const s = sa / oa;
    const r = (c & 255) * s + (d & 255) * k;
    const g = ((c >> 8) & 255) * s + ((d >> 8) & 255) * k;
    const b = ((c >> 16) & 255) * s + ((d >> 16) & 255) * k;
    this.u32[i] = (((oa * 255 + 0.5) << 24) | (b << 16) | (g << 8) | r) >>> 0;
  }

  fill(c: Color): this {
    this.u32.fill(c);
    return this;
  }

  /** Filled rectangle, blended. */
  rect(x: number, y: number, w: number, h: number, c: Color): void {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.plot(i, j, c);
  }

  /** Alpha-aware copy of a region of `src` into this buffer. */
  blit(src: PixelBuffer, dx: number, dy: number, sx = 0, sy = 0, sw = src.w - sx, sh = src.h - sy): void {
    for (let j = 0; j < sh; j++) {
      const ty = dy + j;
      if (ty < 0 || ty >= this.h) continue;
      const srow = (sy + j) * src.w + sx;
      for (let i = 0; i < sw; i++) {
        const c = src.u32[srow + i];
        const a = c >>> 24;
        if (a === 0) continue;
        const tx = dx + i;
        if (tx < 0 || tx >= this.w) continue;
        if (a === 255) this.u32[ty * this.w + tx] = c;
        else this.plot(tx, ty, c);
      }
    }
  }

  /** Raw copy (no blending, transparent pixels overwrite too). */
  copy(src: PixelBuffer, dx: number, dy: number, sx = 0, sy = 0, sw = src.w - sx, sh = src.h - sy): void {
    for (let j = 0; j < sh; j++) {
      const ty = dy + j;
      if (ty < 0 || ty >= this.h) continue;
      for (let i = 0; i < sw; i++) {
        const tx = dx + i;
        if (tx < 0 || tx >= this.w) continue;
        this.u32[ty * this.w + tx] = src.u32[(sy + j) * src.w + sx + i];
      }
    }
  }

  sub(x: number, y: number, w: number, h: number): PixelBuffer {
    const out = new PixelBuffer(w, h);
    out.copy(this, 0, 0, x, y, w, h);
    return out;
  }

  clone(): PixelBuffer {
    const out = new PixelBuffer(this.w, this.h);
    out.u32.set(this.u32);
    return out;
  }

  flipH(): PixelBuffer {
    const out = new PixelBuffer(this.w, this.h);
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) out.u32[y * this.w + (this.w - 1 - x)] = this.u32[y * this.w + x];
    return out;
  }

  flipV(): PixelBuffer {
    const out = new PixelBuffer(this.w, this.h);
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) out.u32[(this.h - 1 - y) * this.w + x] = this.u32[y * this.w + x];
    return out;
  }

  /** Rotates 90 degrees clockwise. */
  rotateCW(): PixelBuffer {
    const out = new PixelBuffer(this.h, this.w);
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) out.u32[x * out.w + (this.h - 1 - y)] = this.u32[y * this.w + x];
    return out;
  }

  /** Integer upscale (used for previews and the big logo). */
  scaled(n: number): PixelBuffer {
    const out = new PixelBuffer(this.w * n, this.h * n);
    for (let y = 0; y < out.h; y++)
      for (let x = 0; x < out.w; x++) out.u32[y * out.w + x] = this.u32[((y / n) | 0) * this.w + ((x / n) | 0)];
    return out;
  }

  /** Replaces every non-transparent pixel with `c` (keeps alpha). Handy for silhouettes. */
  silhouette(c: Color): PixelBuffer {
    const out = new PixelBuffer(this.w, this.h);
    const rgbPart = c & 0x00ffffff;
    for (let i = 0; i < this.u32.length; i++) {
      const a = this.u32[i] >>> 24;
      if (a) out.u32[i] = ((a << 24) | rgbPart) >>> 0;
    }
    return out;
  }

  /** Adds a 1px outline around opaque pixels (4-neighbourhood). */
  outlined(c: Color): PixelBuffer {
    const out = this.clone();
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        if (this.get(x, y) >>> 24) continue;
        if (
          this.get(x - 1, y) >>> 24 || this.get(x + 1, y) >>> 24 ||
          this.get(x, y - 1) >>> 24 || this.get(x, y + 1) >>> 24
        ) out.set(x, y, c);
      }
    return out;
  }
}

/**
 * Builds a sprite from rows of characters. '.' and ' ' are transparent,
 * every other character is looked up in `pal`.
 */
export function fromAscii(rows: readonly string[], pal: Readonly<Record<string, Color>>, w?: number, h?: number): PixelBuffer {
  const width = w ?? Math.max(...rows.map((r) => r.length));
  const height = h ?? rows.length;
  const out = new PixelBuffer(width, height);
  for (let y = 0; y < rows.length; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.' || ch === ' ') continue;
      const c = pal[ch];
      if (c === undefined) throw new Error(`fromAscii: unknown palette char '${ch}' at ${x},${y}`);
      out.set(x, y, c);
    }
  }
  return out;
}

/** 4x4 ordered-dither threshold, 0..1 (exclusive). */
const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
export const bayer = (x: number, y: number): number => (BAYER4[((y & 3) << 2) | (x & 3)] + 0.5) / 16;
