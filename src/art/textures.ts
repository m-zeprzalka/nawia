// Bridges the pixel-buffer art into Phaser textures.
//
// Replacing placeholders with real art: put a PNG with the same name and grid into /assets
// (tiles_jawia.png, tiles_nawia.png, hero.png, mobs.png, objects.png, slash.png, px.png, ui.png).
// Any PNG found there at build time wins over the generated version. No code changes needed.

import Phaser from 'phaser';
import type { World } from '../config.ts';
import { PixelBuffer } from '../core/PixelBuffer.ts';
import { makeTileset } from './tiles.ts';
import { makeFog, makeGlow, makeSheets, type Sheet } from './sprites.ts';

const overrides = import.meta.glob('/assets/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

/** name (without extension) -> URL of a hand-made PNG that replaces a generated sheet */
export const ART_OVERRIDES: Record<string, string> = Object.fromEntries(
  Object.entries(overrides).map(([path, url]) => [path.split('/').pop()!.replace(/\.png$/, ''), url]),
);

export const ART: { tilesets: Record<World, PixelBuffer> } = {
  tilesets: { jawia: new PixelBuffer(1, 1), nawia: new PixelBuffer(1, 1) },
};

export function bufferToCanvas(buf: PixelBuffer): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = buf.w;
  canvas.height = buf.h;
  canvas.getContext('2d')!.putImageData(new ImageData(buf.data, buf.w, buf.h), 0, 0);
  return canvas;
}

function imageToBuffer(img: HTMLImageElement | HTMLCanvasElement): PixelBuffer {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, img.width, img.height);
  const buf = new PixelBuffer(img.width, img.height);
  buf.data.set(data.data);
  return buf;
}

/** Adds (or replaces) a texture made from a pixel buffer. Optionally slices it into a frame grid. */
export function addBufferTexture(scene: Phaser.Scene, key: string, buf: PixelBuffer, fw?: number, fh?: number): void {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const tex = scene.textures.addCanvas(key, bufferToCanvas(buf))!;
  if (fw && fh) {
    const cols = Math.floor(buf.w / fw);
    const rows = Math.floor(buf.h / fh);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) tex.add(r * cols + c, 0, c * fw, r * fh, fw, fh);
  }
}

/** Queue hand-made PNGs (if any) on the scene loader. Call from preload(). */
export function preloadOverrides(scene: Phaser.Scene): void {
  for (const [name, url] of Object.entries(ART_OVERRIDES)) scene.load.image(`override:${name}`, url);
}

/** Generate every placeholder (or adopt its PNG override) and register textures. Call from create(). */
export function registerArt(scene: Phaser.Scene): void {
  const override = (name: string): PixelBuffer | null => {
    const key = `override:${name}`;
    if (!scene.textures.exists(key)) return null;
    return imageToBuffer(scene.textures.get(key).getSourceImage() as HTMLImageElement);
  };

  for (const world of ['jawia', 'nawia'] as World[]) {
    ART.tilesets[world] = override(`tiles_${world}`) ?? makeTileset(world);
  }
  const sheets: Sheet[] = makeSheets();
  for (const s of sheets) addBufferTexture(scene, s.key, override(s.key) ?? s.buf, s.fw, s.fh);

  addBufferTexture(scene, 'fog', makeFog());
  addBufferTexture(scene, 'glow', makeGlow());

  // tiny helpers
  const shadow = new PixelBuffer(12, 5);
  for (let y = 0; y < 5; y++)
    for (let x = 0; x < 12; x++) {
      const nx = (x + 0.5 - 6) / 6;
      const ny = (y + 0.5 - 2.5) / 2.5;
      if (nx * nx + ny * ny <= 1) shadow.set(x, y, 0x70000000);
    }
  addBufferTexture(scene, 'shadow', shadow);
  addBufferTexture(scene, 'white', new PixelBuffer(4, 4).fill(0xffffffff));
}
