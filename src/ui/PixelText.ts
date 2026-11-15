// Text drawn with our own pixel font into a canvas texture. Crisp at any integer scale,
// supports Polish diacritics, and can reveal itself letter by letter.

import Phaser from 'phaser';
import { PixelBuffer, rgb, type Color } from '../core/PixelBuffer.ts';
import { FONT, drawText, measure, wrap } from '../art/font.ts';

let uid = 0;

export interface PixelTextOptions {
  width: number;
  height: number;
  color?: number; // 0xRRGGBB
  shadow?: number | null; // 0xRRGGBB, null = none
  align?: 'left' | 'center' | 'right';
  lineHeight?: number;
}

export class PixelText {
  readonly image: Phaser.GameObjects.Image;
  private readonly scene: Phaser.Scene;
  private readonly key: string;
  private readonly tex: Phaser.Textures.CanvasTexture;
  private readonly buf: PixelBuffer;
  private readonly imageData: ImageData;
  private readonly opts: Required<PixelTextOptions>;
  private lines: string[] = [];
  private total = 0;
  private shown = -1;
  private color: Color;
  private shadow: Color | undefined;

  constructor(scene: Phaser.Scene, x: number, y: number, opts: PixelTextOptions) {
    this.scene = scene;
    this.opts = { color: 0xeee8de, shadow: 0x15121b, align: 'left', lineHeight: FONT.lineHeight, ...opts };
    this.color = rgb(this.opts.color);
    this.shadow = this.opts.shadow === null ? undefined : rgb(this.opts.shadow);
    this.key = `text:${uid++}`;
    this.tex = scene.textures.createCanvas(this.key, opts.width, opts.height)!;
    this.buf = new PixelBuffer(opts.width, opts.height);
    this.imageData = new ImageData(this.buf.data, opts.width, opts.height);
    this.image = scene.add.image(x, y, this.key).setOrigin(0, 0);
  }

  /** Total number of characters in the current text (for typewriter reveals). */
  get length(): number {
    return this.total;
  }

  get lineCount(): number {
    return this.lines.length;
  }

  setColor(color: number): this {
    this.color = rgb(color);
    this.redraw();
    return this;
  }

  /** Sets (and wraps) the text. `visible` < 0 shows everything. */
  setText(text: string, visible = -1): this {
    this.lines = text === '' ? [] : wrap(text, this.opts.width);
    this.total = this.lines.reduce((n, l) => n + l.length, 0);
    this.shown = visible;
    this.redraw();
    return this;
  }

  /** Shows only the first `n` characters (keeps the wrapping of the full text). */
  reveal(n: number): void {
    if (n === this.shown) return;
    this.shown = n;
    this.redraw();
  }

  private redraw(): void {
    const { buf, opts } = this;
    buf.fill(0);
    let left = this.shown < 0 ? Infinity : this.shown;
    this.lines.forEach((line, i) => {
      if (left <= 0) return;
      const lw = measure(line);
      const x = opts.align === 'center' ? Math.floor((opts.width - lw) / 2) : opts.align === 'right' ? opts.width - lw : 0;
      const part = left >= line.length ? line : line.slice(0, left);
      left -= line.length;
      drawText(buf, part, x, i * opts.lineHeight, this.color, this.shadow);
    });
    this.tex.getContext().putImageData(this.imageData, 0, 0);
    this.tex.refresh();
  }

  destroy(): void {
    this.image.destroy();
    if (this.scene.textures.exists(this.key)) this.scene.textures.remove(this.key);
  }
}
