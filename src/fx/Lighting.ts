// Darkness and light, 16-bit style.
//
// A full-screen light map is computed on the CPU every frame and multiplied over the scene.
// Light falls off in dithered bands instead of a smooth gradient, so it reads as pixel art.

import Phaser from 'phaser';
import { DEPTH, GAME_H, GAME_W } from '../config.ts';
import { bayer } from '../core/PixelBuffer.ts';

export type RGB = [number, number, number];

export interface LightSource {
  x: number; // world px
  y: number;
  radius: number;
  color: RGB; // 0..1 per channel
  intensity: number;
  /** 0..1: how much the light breathes (fire flickers, a carried stone barely does). */
  flicker?: number;
  phase?: number;
}

const BANDS = 7;
const N = GAME_W * GAME_H;

export class Lighting {
  readonly image: Phaser.GameObjects.Image;
  /** Colour of unlit space (0..1). */
  ambient: RGB = [0.5, 0.5, 0.6];

  private readonly tex: Phaser.Textures.CanvasTexture;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly imageData: ImageData;
  private readonly out: Uint32Array;
  private readonly r = new Float32Array(N);
  private readonly g = new Float32Array(N);
  private readonly b = new Float32Array(N);
  private readonly vignette = new Float32Array(N);
  private readonly dither = new Float32Array(N);

  constructor(scene: Phaser.Scene) {
    const key = 'lightmap';
    if (scene.textures.exists(key)) scene.textures.remove(key);
    this.tex = scene.textures.createCanvas(key, GAME_W, GAME_H)!;
    this.ctx = this.tex.getContext();
    this.imageData = this.ctx.createImageData(GAME_W, GAME_H);
    this.out = new Uint32Array(this.imageData.data.buffer);
    for (let y = 0; y < GAME_H; y++)
      for (let x = 0; x < GAME_W; x++) {
        const nx = (x + 0.5) / GAME_W - 0.5;
        const ny = (y + 0.5) / GAME_H - 0.5;
        const d = Math.sqrt(nx * nx * 1.1 + ny * ny * 1.6) / 0.75;
        const v = 1 - Math.max(0, d - 0.45) * 0.75;
        this.vignette[y * GAME_W + x] = Math.max(0.55, Math.min(1, Math.floor(v * 10 + bayer(x, y)) / 10));
        this.dither[y * GAME_W + x] = bayer(x, y);
      }
    this.image = scene.add
      .image(0, 0, key)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(DEPTH.light)
      .setBlendMode(Phaser.BlendModes.MULTIPLY);
  }

  /** Rebuilds the light map. (camX, camY) is the camera scroll; `time` in seconds. */
  render(camX: number, camY: number, lights: readonly LightSource[], time: number): void {
    const { r, g, b, vignette, dither, out } = this;
    const [ar, ag, ab] = this.ambient;
    for (let i = 0; i < N; i++) {
      const v = vignette[i];
      r[i] = ar * v;
      g[i] = ag * v;
      b[i] = ab * v;
    }

    for (const l of lights) {
      const fl = l.flicker ?? 0;
      const ph = l.phase ?? 0;
      const breathe = fl
        ? 1 + fl * (0.06 * Math.sin(time * 11 + ph) + 0.04 * Math.sin(time * 23.7 + ph * 2) + 0.03 * Math.sin(time * 5.1 + ph * 3))
        : 1;
      const radius = l.radius * breathe;
      const cx = l.x - camX;
      const cy = l.y - camY;
      const x0 = Math.max(0, Math.floor(cx - radius));
      const x1 = Math.min(GAME_W - 1, Math.ceil(cx + radius));
      const y0 = Math.max(0, Math.floor(cy - radius));
      const y1 = Math.min(GAME_H - 1, Math.ceil(cy + radius));
      if (x0 > x1 || y0 > y1) continue;
      const inv = 1 / radius;
      const k = l.intensity * (fl ? 1 + fl * 0.05 * Math.sin(time * 17 + ph) : 1);
      const [lr, lg, lb] = l.color;
      for (let y = y0; y <= y1; y++) {
        const dy = y + 0.5 - cy;
        let i = y * GAME_W + x0;
        for (let x = x0; x <= x1; x++, i++) {
          const dx = x + 0.5 - cx;
          const d = Math.sqrt(dx * dx + dy * dy) * inv;
          if (d >= 1) continue;
          let f = 1 - d;
          f = f * f * (3 - 2 * f);
          const q = Math.floor(f * BANDS + dither[i]) / BANDS;
          if (q <= 0) continue;
          const s = q * k;
          r[i] += lr * s;
          g[i] += lg * s;
          b[i] += lb * s;
        }
      }
    }

    for (let i = 0; i < N; i++) {
      const R = r[i] >= 1 ? 255 : (r[i] * 255) | 0;
      const G = g[i] >= 1 ? 255 : (g[i] * 255) | 0;
      const B = b[i] >= 1 ? 255 : (b[i] * 255) | 0;
      out[i] = (0xff000000 | (B << 16) | (G << 8) | R) >>> 0;
    }
    this.ctx.putImageData(this.imageData, 0, 0);
    this.tex.refresh();
  }
}
