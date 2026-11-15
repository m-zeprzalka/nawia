// One picture that exists in both worlds, and the ring that turns one into the other.
//
// The shift itself is instant (collision flips on the same frame). What you *see* is the
// hole of the hag stone opening: a ring that starts at the heroine and sweeps the screen.
// It is composited per pixel on the CPU (320x176 is tiny), so the edge can be as crunchy
// and pixel-perfect as we like: no masks, no shaders, no blur.

import Phaser from 'phaser';
import { TUNE, otherWorld, type World } from '../config.ts';
import type { PixelBuffer } from '../core/PixelBuffer.ts';
import { PAL } from '../art/palette.ts';

let uid = 0;

export class DualCanvas {
  readonly image: Phaser.GameObjects.Image;
  readonly w: number;
  readonly h: number;
  /** Current radius of the ring in px; Infinity when no reveal is running. */
  radius = Infinity;
  centerX = 0;
  centerY = 0;

  private readonly scene: Phaser.Scene;
  private readonly key: string;
  private readonly tex: Phaser.Textures.CanvasTexture;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly imageData: ImageData;
  private readonly out: Uint32Array;
  private readonly buffers: Record<World, PixelBuffer>;
  private readonly dist: Float32Array;
  private world: World;
  private t = -1;
  private maxR = 0;
  private dirty = true;

  constructor(scene: Phaser.Scene, buffers: Record<World, PixelBuffer>, world: World) {
    this.scene = scene;
    this.buffers = buffers;
    this.world = world;
    this.w = buffers.jawia.w;
    this.h = buffers.jawia.h;
    this.key = `dual:${uid++}`;
    this.tex = scene.textures.createCanvas(this.key, this.w, this.h)!;
    this.ctx = this.tex.getContext();
    this.imageData = this.ctx.createImageData(this.w, this.h);
    this.out = new Uint32Array(this.imageData.data.buffer);
    this.dist = new Float32Array(this.w * this.h);
    this.image = scene.add.image(0, 0, this.key).setOrigin(0, 0);
    this.flush();
  }

  get revealing(): boolean {
    return this.t >= 0;
  }

  /** Marks the picture as changed (e.g. animated tiles were repainted). */
  touch(): void {
    this.dirty = true;
  }

  /** Switch instantly, no ring. */
  show(world: World): void {
    this.world = world;
    this.t = -1;
    this.radius = Infinity;
    this.dirty = true;
  }

  /** Start the ring. (cx, cy) are in this picture's own pixels. */
  reveal(to: World, cx: number, cy: number): void {
    this.world = to;
    this.t = 0;
    this.radius = 0;
    this.centerX = cx;
    this.centerY = cy;
    const { w, h, dist } = this;
    let max = 0;
    for (let y = 0; y < h; y++) {
      const dy = y + 0.5 - cy;
      for (let x = 0; x < w; x++) {
        const dx = x + 0.5 - cx;
        const d = Math.sqrt(dx * dx + dy * dy);
        // the tear is not a perfect circle: it wobbles a little, like a ripple on water
        const a = Math.atan2(dy, dx);
        const wob = Math.sin(a * 5 + 1.3) * 2.2 + Math.sin(a * 11 - 0.7) * 1.3 + Math.sin(a * 23) * 0.6;
        const v = d + wob * Math.min(1, d / 24);
        dist[y * w + x] = v;
        if (v > max) max = v;
      }
    }
    this.maxR = max + 12;
    this.dirty = true;
  }

  update(dt: number): void {
    if (this.t >= 0) {
      this.t += dt / TUNE.shift.revealTime;
      if (this.t >= 1) {
        this.t = -1;
        this.radius = Infinity;
      } else {
        const e = 1 - Math.pow(1 - this.t, 2.6); // fast out of the gate, gentle at the far edge
        this.radius = 4 + e * this.maxR;
      }
      this.dirty = true;
    }
    if (this.dirty) this.flush();
  }

  private flush(): void {
    this.dirty = false;
    const out = this.out;
    const next = this.buffers[this.world].u32;
    if (this.t < 0) {
      out.set(next);
    } else {
      const prev = this.buffers[otherWorld(this.world)].u32;
      const dist = this.dist;
      const r = this.radius;
      const pal = PAL[this.world];
      const edge = pal.accent;
      const edgeHot = 0xffffffff;
      const er = edge & 255, eg = (edge >> 8) & 255, eb = (edge >> 16) & 255;
      const glow = 9; // px of afterglow behind the ring
      const n = out.length;
      for (let i = 0; i < n; i++) {
        const d = dist[i];
        if (d > r + 1.5) {
          out[i] = prev[i];
        } else if (d > r - 0.6) {
          out[i] = d > r + 0.4 ? edge : edgeHot;
        } else if (d > r - glow) {
          // freshly revealed: still glowing in the new world's colour
          const k = (1 - (r - d) / glow) * 0.55;
          const c = next[i];
          const cr = c & 255, cg = (c >> 8) & 255, cb = (c >> 16) & 255;
          out[i] = (0xff000000 | ((cb + (eb - cb) * k) << 16) | ((cg + (eg - cg) * k) << 8) | (cr + (er - cr) * k)) >>> 0;
        } else {
          out[i] = next[i];
        }
      }
    }
    this.ctx.putImageData(this.imageData, 0, 0);
    this.tex.refresh();
  }

  destroy(): void {
    this.image.destroy();
    if (this.scene.textures.exists(this.key)) this.scene.textures.remove(this.key);
  }
}
