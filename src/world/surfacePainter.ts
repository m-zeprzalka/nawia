// Paints a surface room (biome: village / forest). See src/art/surface.ts for the look.
//
// The ground is computed per pixel from distance fields (how far is this pixel from the nearest
// path / water / forest tile, plus a little noise), so edges are organic instead of square.
// Everything that stands on the ground is a stamp, drawn back to front. Each stamp is split in two:
// the part near its foot goes into the ground picture, the rest into `overhead`, which the game
// draws above the hero. That is all it takes to walk behind a tree.
//
// Pure pixel code, like RoomPainter: used by the game and by the preview tools.

import { SCREEN_COLS, SCREEN_ROWS, TILE, WORLDS, type World } from '../config.ts';
import { PixelBuffer, mix, type Color } from '../core/PixelBuffer.ts';
import { hash2 } from '../core/rng.ts';
import {
  BLIGHT_STYLE, NAWIA_CALM, SURF, chamfer, drawFlower, drawHouse, drawLily, drawPalisade, drawPlanks, drawReeds, drawSteps, drawWattle,
  grove, noiseField, vnoise, type Stamp, type SurfacePalette,
} from '../art/surface.ts';
import type { Dungeon, RoomDef } from './roomFormat.ts';
import type { RoomPicture } from './painter.ts';

/** What a tile is, as far as painting goes. */
const K = {
  GRASS: 0, FLOWERS: 1, PATH: 2, STEPS: 3, WATER: 4, PLANK: 5, FOREST: 6, DARK: 7,
  TREE: 8, GIANT: 9, OLDTREE: 10, STUMP: 11, THICKET: 12, FENCE: 13, HOUSE: 14, ROCK: 15,
  PALISADE: 16, WELL: 17, BUSH: 18, HAY: 19, HIVE: 20, MALWY: 21,
} as const;

/** What a pixel of ground turned out to be. */
const C = { GRASS: 0, PATH: 1, WATER: 2, BANK: 3, FOREST: 4, VOID: 5, BLIGHT: 6 } as const;

/** How a surface room is to be painted, when not in the game's own colours (the playground does this). */
export interface SurfaceLook {
  /** names the look: trees are cached under it */
  key: string;
  palettes: Record<World, SurfacePalette>;
  /** blight strength 0..1 at a pixel, instead of the one that follows from the rooms' `blight:` headers */
  blight?: (px: number, py: number) => number;
}

const GAME_LOOK: SurfaceLook = { key: 'game', palettes: SURF };

const M = 3; // tiles of margin read from the neighbouring rooms, so nothing is cut off at a doorway

/** Water (or, in Nawia, the abyss) as it would look if nothing in it moved. `d` is the depth in px from the bank. */
function waterBase(p: SurfacePalette, X: number, Y: number, d: number): Color {
  const w = p.water;
  if (p.glow) {
    if (d < 1.2) return w[4];
    if (d < 2.6) return w[3];
    if (vnoise(X * 0.03, Y * 0.04, 6) > 0.72) return w[2];
    return vnoise(X * 0.05, Y * 0.07, 3) < 0.5 ? w[0] : w[1];
  }
  if (d < 1.3) return w[4];
  if (d < 3.4) return w[3];
  if (d > 6 && vnoise(X * 0.04, Y * 0.07, 6) < 0.3) return w[0];
  return vnoise(X * 0.05, Y * 0.1, 3) < 0.46 ? w[1] : w[2];
}

/** What moves on top of `base` in animation frame 0..3: foam and wavelets in Jawia, twinkling stars in Nawia. */
function waterAnim(p: SurfacePalette, X: number, Y: number, d: number, frame: number, base: Color): Color {
  const w = p.water;
  if (p.glow) {
    if (d < 2.6) return base;
    const hs = hash2(X, Y, 9);
    if (hs % 83 !== 0) return base;
    const tw = ((hs >>> 8) + frame) & 3;
    return tw === 0 ? w[5] : tw !== 2 ? p.dirt[4] : base;
  }
  if (d < 1.3) return ((hash2(X >> 1, Y, 5) + frame) & 3) === 0 ? w[5] : base;
  if (d < 3.4) return base;
  // wavelets that breathe
  const gi = Math.floor(X / 14);
  const gj = Math.floor(Y / 6);
  const hs = hash2(gi, gj, 31);
  if (hs % 5 < 2) {
    const ax = gi * 14 + 2 + ((hs >>> 4) % 5);
    const ay = gj * 6 + 1 + ((hs >>> 8) % 4);
    const len = [3, 5, 7, 5][(frame + (hs >>> 12)) & 3];
    if (Y === ay && X >= ax && X < ax + len) return X < ax + 2 ? w[4] : w[3];
  }
  return base;
}

function pathColor(p: SurfacePalette, X: number, Y: number, d: number): Color {
  if (d < 1) return p.pathRim;
  const n = vnoise(X * 0.09, Y * 0.13, 4);
  let c = n > 0.62 ? p.dirt[3] : n < 0.25 ? p.dirt[1] : p.dirt[2];
  const gi = Math.floor(X / 10);
  const gj = Math.floor(Y / 8);
  const hs = hash2(gi, gj, 21);
  if (hs % 3 === 0) {
    const ax = gi * 10 + 1 + ((hs >>> 4) % 7);
    const ay = gj * 8 + 1 + ((hs >>> 8) % 5);
    if (X === ax || X === ax + 1) {
      // in Nawia a pebble is a dim one: a bright one would read as a star, or as something alive
      if (Y === ay) c = p.glow && NAWIA_CALM ? p.dirt[3] : p.pebble[1];
      else if (Y === ay + 1) c = p.glow && NAWIA_CALM ? p.dirt[1] : p.pebble[0];
    }
  }
  return c;
}

export class SurfacePainter implements RoomPicture {
  readonly room: RoomDef;
  readonly w: number;
  readonly h: number;
  readonly buffers: Record<World, PixelBuffer>;
  readonly overhead: Record<World, PixelBuffer>;
  readonly echo: Record<World, PixelBuffer>;

  private readonly dungeon: Dungeon;
  private readonly look: SurfaceLook;
  /** Four frames of ground per world, if anything in it moves (water, stars). */
  private readonly frames: Record<World, PixelBuffer[] | null> = { jawia: null, nawia: null };
  /** Noise that does not depend on the world, computed once: the wobble of every edge, and the patches of the meadow. */
  private readonly wobble: Float32Array;
  private readonly patch: Float32Array;
  /** Noise the blight grows by, or null if this room has none. */
  private blightN: Float32Array | null = null;
  /** How strong the blight is at a pixel, 0..1. */
  private blightAt: (px: number, py: number) => number = () => 0;

  constructor(room: RoomDef, dungeon: Dungeon, echo: Record<World, PixelBuffer>, look: SurfaceLook = GAME_LOOK) {
    this.room = room;
    this.dungeon = dungeon;
    this.look = look;
    this.echo = echo;
    this.w = room.cols * TILE;
    this.h = room.rows * TILE;
    this.buffers = { jawia: new PixelBuffer(this.w, this.h), nawia: new PixelBuffer(this.w, this.h) };
    this.overhead = { jawia: new PixelBuffer(this.w, this.h), nawia: new PixelBuffer(this.w, this.h) };
    this.wobble = new Float32Array(this.w * this.h);
    this.patch = new Float32Array(this.w * this.h);
    const ox = room.gx * SCREEN_COLS * TILE;
    const oy = room.gy * SCREEN_ROWS * TILE;
    const n = (sx: number, sy: number, seed: number): Float32Array => noiseField(this.w, this.h, ox, oy, sx, sy, seed);
    const [w1, w2, p1, p2] = [n(0.13, 0.13, 7), n(0.37, 0.37, 8), n(0.045, 0.06, 1), n(0.17, 0.17, 2)];
    for (let i = 0; i < this.wobble.length; i++) {
      this.wobble[i] = (w1[i] - 0.5) * 5 + (w2[i] - 0.5) * 2.2;
      this.patch[i] = p1[i] * 0.65 + p2[i] * 0.35;
    }
    // the blight: none at the village, more with every room towards the barrow, and it creeps in from the worse side
    const level = (dy: number): number => {
      const nb = dungeon.roomAtTile(room.gx * SCREEN_COLS, (room.gy + dy) * SCREEN_ROWS + (dy > 0 ? room.rows - SCREEN_ROWS : 0));
      return nb && nb !== room && (nb.biome === 'village' || nb.biome === 'forest') ? nb.blight : room.blight;
    };
    const above = (level(-1) + room.blight) / 2;
    const below = (level(1) + room.blight) / 2;
    this.blightAt =
      look.blight ??
      ((_px: number, py: number): number => {
        const t = py / this.h;
        return (t < 0.5 ? above + (room.blight - above) * t * 2 : room.blight + (below - room.blight) * (t - 0.5) * 2) / 3;
      });
    if (look.blight || above > 0 || below > 0 || room.blight > 0) {
      this.blightN = new Float32Array(this.w * this.h);
      if (BLIGHT_STYLE === 'stains') {
        // stains with a shape: one broad noise, only a little of a finer one to keep their edges from being round
        const [b1, b2] = [n(0.05, 0.058, 71), n(0.13, 0.13, 72)];
        for (let i = 0; i < this.blightN.length; i++) this.blightN[i] = b1[i] * 0.8 + b2[i] * 0.2;
      } else {
        const [b1, b2] = [n(0.06, 0.07, 71), n(0.21, 0.21, 72)];
        for (let i = 0; i < this.blightN.length; i++) this.blightN[i] = b1[i] * 0.62 + b2[i] * 0.38;
      }
    }
    for (const world of WORLDS) this.paint(world);
  }

  animate(frame: number): void {
    for (const world of WORLDS) {
      const f = this.frames[world];
      if (f) this.buffers[world].u32.set(f[frame & 3].u32);
    }
  }

  /**
   * The blight's stains (BLIGHT_STYLE 'stains'). `cls` marks the pixels it has taken; this colours them by how far in
   * they are, withers the grass round them (marked in `dead`) and sends tendrils out into the meadow.
   * How much of all that there is follows the strength of the blight. Returns the depth (px) of every pixel in a stain.
   */
  private paintStains(world: World, ground: PixelBuffer, cls: Uint8Array, dead: Uint8Array): Float32Array {
    const { w, h } = this;
    const p = this.look.palettes[world];
    const g = ground.u32;
    const N = w * h;
    const bn = this.blightN!;
    const B = p.blight;
    const meadow = new Uint8Array(N);
    const taken = new Uint8Array(N);
    for (let i = 0; i < N; i++) {
      meadow[i] = cls[i] === C.GRASS ? 1 : 0;
      taken[i] = cls[i] === C.BLIGHT ? 1 : 0;
    }
    // how far into a stain (measured from the meadow: a path or the forest is not its edge), and how far out of it
    const dIn = chamfer(meadow, w, h, 0, w, h);
    const dOut = chamfer(taken, w, h, 0, w, h);
    const core = mix(B[0], p.outline, 0.4);
    const tide = mix(B[1], B[2], 0.55);
    const heart = [mix(B[1], core, 0.42), mix(B[1], core, 0.8)];
    for (let i = 0; i < N; i++) {
      if (taken[i]) {
        const d = dIn[i] + this.wobble[i] * 0.2;
        const x = i % w;
        const strength = this.blightAt(x, (i - x) / w);
        // lighter where it is still spreading, darker towards its heart: a stain, not a hole
        let c = d < 1.2 ? B[2] : d < 3 ? tide : B[1];
        const deep = strength * 0.56 - bn[i];
        if (d > 5) c = deep > 0.17 ? heart[1] : deep > 0.1 ? heart[0] : c;
        g[i] = c;
      } else if (meadow[i] && dOut[i] < 1.5 + this.patch[i] * 6 + this.wobble[i] * 0.35) {
        // the grass it has touched and not yet taken: a ring that is wide in places and nearly gone in others
        dead[i] = 1;
        g[i] = p.deadGrass[dOut[i] < 1.6 ? 0 : dOut[i] < 3.5 ? 1 : 2];
      }
    }
    // tendrils: from the rim, out along the way the stain is spreading, wandering, now and then forking
    const vein = p.glow ? B[2] : B[0];
    const walk = (x0: number, y0: number, a0: number, len: number, seed: number, fork: boolean): void => {
      let a = a0;
      let fx = x0 + 0.5;
      let fy = y0 + 0.5;
      for (let k = 0; k < len; k++) {
        a += ((hash2(k, seed, 152) % 100) / 100 - 0.5) * 0.9;
        fx += Math.cos(a);
        fy += Math.sin(a);
        const X = Math.floor(fx);
        const Y = Math.floor(fy);
        if (X < 0 || Y < 0 || X >= w || Y >= h) return;
        const j = Y * w + X;
        if (cls[j] === C.BLIGHT) continue;
        if (cls[j] !== C.GRASS) return;
        g[j] = k < len * 0.7 ? vein : p.deadGrass[0];
        dead[j] = 1;
        // thick at the root
        if (k < 3 && fork) {
          const side = Y * w + Math.floor(fx + Math.sin(a) * 0.9);
          if (cls[side] === C.GRASS) { g[side] = vein; dead[side] = 1; }
        }
        if (fork && k === Math.floor(len * 0.4) && seed % 3 === 0) walk(X, Y, a + (seed & 4 ? 0.8 : -0.8), len * 0.5, seed >>> 3, false);
      }
    };
    const ox = this.room.gx * SCREEN_COLS * TILE;
    const oy = this.room.gy * SCREEN_ROWS * TILE;
    for (let gj = Math.floor(oy / 7); gj * 7 < oy + h; gj++)
      for (let gi = Math.floor(ox / 7); gi * 7 < ox + w; gi++) {
        const hs = hash2(gi, gj, 151);
        const x = gi * 7 + (hs % 7) - ox;
        const y = gj * 7 + ((hs >>> 3) % 7) - oy;
        if (x < 1 || y < 1 || x >= w - 1 || y >= h - 1) continue;
        const i = y * w + x;
        if (!taken[i] || dIn[i] > 1.5) continue;
        const strength = this.blightAt(x, y);
        if ((hs >>> 8) % 100 >= 16 + strength * 40) continue;
        const a = Math.atan2(bn[i + w] - bn[i - w], bn[i + 1] - bn[i - 1]);
        walk(x, y, a, 7 + ((hs >>> 16) % 9) + strength * 9, hs, true);
      }
    // a few veins inside, along the lie of the stain, and a few spores that glow with the other side
    const darkVein = mix(B[1], B[0], 0.65);
    for (let gj = Math.floor(oy / 13); gj * 13 < oy + h; gj++)
      for (let gi = Math.floor(ox / 13); gi * 13 < ox + w; gi++) {
        const hs = hash2(gi, gj, 155);
        let fx = gi * 13 + (hs % 13) - ox + 0.5;
        let fy = gj * 13 + ((hs >>> 4) % 13) - oy + 0.5;
        const i0 = Math.floor(fy) * w + Math.floor(fx);
        if (fx < 1 || fy < 1 || fx >= w - 1 || fy >= h - 1 || !taken[i0] || dIn[i0] < 4 || (hs >>> 8) % 3 !== 0) continue;
        let a = Math.atan2(bn[i0 + w] - bn[i0 - w], bn[i0 + 1] - bn[i0 - 1]) + Math.PI / 2;
        for (let k = 0; k < 6 + ((hs >>> 12) % 7); k++) {
          a += ((hash2(k, hs, 156) % 100) / 100 - 0.5) * 0.7;
          fx += Math.cos(a);
          fy += Math.sin(a);
          if (fx < 0 || fy < 0 || fx >= w || fy >= h) break;
          const j = Math.floor(fy) * w + Math.floor(fx);
          if (!taken[j] || dIn[j] < 2.5) break;
          if (g[j] === B[1]) g[j] = darkVein;
        }
      }
    const halo = mix(B[2], p.blightVein, 0.45);
    for (let gj = Math.floor(oy / 10); gj * 10 < oy + h; gj++)
      for (let gi = Math.floor(ox / 10); gi * 10 < ox + w; gi++) {
        const hs = hash2(gi, gj, 161);
        const x = gi * 10 + (hs % 10) - ox;
        const y = gj * 10 + ((hs >>> 4) % 10) - oy;
        if (x < 1 || y < 1 || x >= w - 1 || y >= h - 1) continue;
        const i = y * w + x;
        if (!taken[i] || dIn[i] < 4 || (hs >>> 8) % 1000 >= this.blightAt(x, y) * 70) continue;
        g[i] = p.blightSpark;
        if (taken[i + 1]) g[i + 1] = halo;
        if (taken[i - w]) g[i - w] = halo;
      }
    return dIn;
  }

  /** Thorns pushing up through the deep of the stains: a few curved shoots, more where the blight is stronger. */
  private paintShoots(world: World, ground: PixelBuffer, cls: Uint8Array, dIn: Float32Array): void {
    const { w, h } = this;
    const p = this.look.palettes[world];
    const c = p.blightWood;
    const ox = this.room.gx * SCREEN_COLS * TILE;
    const oy = this.room.gy * SCREEN_ROWS * TILE;
    const g = ground.u32;
    for (let gj = Math.floor(oy / 12); gj * 12 < oy + h; gj++)
      for (let gi = Math.floor(ox / 12); gi * 12 < ox + w; gi++) {
        const hs = hash2(gi, gj, 75);
        const x = gi * 12 + (hs % 12) - ox;
        const y = gj * 12 + ((hs >>> 4) % 12) - oy;
        if (x < 2 || y < 5 || x >= w - 2 || y >= h - 1) continue;
        const i = y * w + x;
        if (cls[i] !== C.BLIGHT || dIn[i] < 3.5 || (hs >>> 8) % 100 >= this.blightAt(x, y) * 24) continue;
        const side = (hs >>> 14) & 1 ? 1 : -1;
        g[i + 1 + w] = mix(g[i + 1 + w], p.outline, 0.35);
        ground.set(x, y, c[1]);
        ground.set(x, y - 1, c[1]);
        ground.set(x, y - 2, c[2]);
        ground.set(x - side, y - 2, c[2]);
        ground.set(x + side, y - 3, c[2]);
        ground.set(x + side, y - 4, c[3]);
      }
  }

  private kindAt(world: World, x: number, y: number): number {
    const r = this.room;
    const gx = r.gx * SCREEN_COLS + x;
    const gy = r.gy * SCREEN_ROWS + y;
    const there = this.dungeon.roomAtTile(gx, gy);
    if (!there) return K.FOREST;
    if (there.biome === 'crypt') return K.DARK;
    const jawia = world === 'jawia';
    // a doorway in the front wall of a house is still house
    if (there.doors.has((gy - there.gy * SCREEN_ROWS) * there.cols + gx - there.gx * SCREEN_COLS)) return K.HOUSE;
    switch (this.dungeon.charAt(gx, gy)) {
      case '#': case ' ': case '!': return K.FOREST;
      case 't': return K.TREE;
      case 'O': return K.GIANT;
      case 'H': case 'D': return K.HOUSE;
      case 'R': return K.ROCK;
      case 'F': return K.PALISADE;
      case 'W': return K.WELL;
      case 'b': return K.BUSH;
      case 'S': return K.HAY;
      case 'U': return K.HIVE;
      case 'M': return K.MALWY;
      case '^': return K.STEPS;
      case ',': case 'G': return K.PATH;
      case '"': return K.FLOWERS;
      case '~': case 'w': return K.WATER;
      case '=': return jawia ? K.PLANK : K.WATER;
      case ':': return jawia ? K.WATER : K.PLANK;
      case '+': return K.PLANK;
      case 'J': return jawia ? (there.biome === 'village' ? K.FENCE : K.THICKET) : K.GRASS;
      case 'N': return jawia ? K.STUMP : K.OLDTREE;
      default: return K.GRASS;
    }
  }

  private paint(world: World): void {
    const { room, w, h } = this;
    const { cols, rows } = room;
    const p = this.look.palettes[world];
    const g = grove(p, `${this.look.key}:${world}`);
    const ox = room.gx * SCREEN_COLS * TILE;
    const oy = room.gy * SCREEN_ROWS * TILE;

    // ---- 1. what every tile is (with a margin into the neighbours)
    const kw = cols + 2 * M;
    const kh = rows + 2 * M;
    const kinds = new Uint8Array(kw * kh);
    for (let y = -M; y < rows + M; y++) for (let x = -M; x < cols + M; x++) kinds[(y + M) * kw + x + M] = this.kindAt(world, x, y);
    const kind = (x: number, y: number): number =>
      x < -M || y < -M || x >= cols + M || y >= rows + M ? K.FOREST : kinds[(y + M) * kw + x + M];
    const mask = (test: (k: number) => boolean): Uint8Array => {
      const out = new Uint8Array(kw * kh);
      for (let i = 0; i < out.length; i++) out[i] = test(kinds[i]) ? 1 : 0;
      return out;
    };
    const isWater = (k: number): boolean => k === K.WATER || k === K.PLANK;
    const isForest = (k: number): boolean => k === K.FOREST || k === K.DARK;
    const waterG = mask(isWater);
    const pathG = mask((k) => k === K.PATH || k === K.STEPS);
    const forestG = mask(isForest);
    // Nawia: forest with nothing but forest around it is not there at all, only stars
    const deepG = new Uint8Array(kw * kh);
    if (p.glow)
      for (let y = -M; y < rows + M; y++)
        for (let x = -M; x < cols + M; x++) {
          let all = true;
          for (let dy = -1; dy <= 1 && all; dy++) for (let dx = -1; dx <= 1; dx++) if (!isForest(kind(x + dx, y + dy))) { all = false; break; }
          deepG[(y + M) * kw + x + M] = all ? 1 : 0;
        }
    const at = (grid: Uint8Array, x: number, y: number): number =>
      x < -M || y < -M || x >= cols + M || y >= rows + M ? grid[0] : grid[(y + M) * kw + x + M];
    /**
     * Signed distance (px, roughly) from every pixel to the edge of a set of tiles: negative inside.
     * The tile mask is blurred and read back as a distance, which rounds every corner: no square ponds.
     */
    const R = 7;
    const field = (grid: Uint8Array): Float32Array => {
      const fw = w + 2 * R;
      const fh = h + 2 * R;
      const a = new Float32Array(fw * fh);
      const b2 = new Float32Array(fw * fh);
      const n = 2 * R + 1;
      const out = new Float32Array(w * h);
      if (!grid.includes(1)) return out.fill(n / 2);
      // the mask, one run of pixels per tile
      for (let y = 0; y < fh; y++) {
        const cy = Math.floor((y - R) / TILE);
        for (let x = 0; x < fw; ) {
          const cx = Math.floor((x - R) / TILE);
          const end = Math.min(fw, (cx + 1) * TILE + R);
          if (at(grid, cx, cy)) a.fill(1, y * fw + x, y * fw + end);
          x = end;
        }
      }
      // box blur, across then down. The R px of padding mean no window is ever cut off.
      const prefix = new Float32Array(fw + 1);
      for (let y = 0; y < fh; y++) {
        for (let x = 0; x < fw; x++) prefix[x + 1] = prefix[x] + a[y * fw + x];
        for (let x = R; x < fw - R; x++) b2[y * fw + x] = (prefix[x + R + 1] - prefix[x - R]) / n;
      }
      for (let x = R; x < fw - R; x++) {
        let sum = 0;
        for (let y = 0; y < n; y++) sum += b2[y * fw + x];
        for (let y = R; y < fh - R; y++) {
          out[(y - R) * w + (x - R)] = (0.5 - sum / n) * n;
          if (y + R + 1 < fh) sum += b2[(y + R + 1) * fw + x] - b2[(y - R) * fw + x];
        }
      }
      return out;
    };
    const waterF = field(waterG);
    const pathF = field(pathG);
    const forestF = field(forestG);
    const deepF = p.glow ? field(deepG) : null;

    // ---- 2. the ground, pixel by pixel
    const ground = new PixelBuffer(w, h);
    const cls = new Uint8Array(w * h);
    const depth = new Float32Array(w * h);
    /** still water under every moving pixel, so frames only have to redo what moves */
    const still = new Uint32Array(w * h);
    for (let py = 0; py < h; py++)
      for (let px = 0; px < w; px++) {
        const i = py * w + px;
        const X = ox + px;
        const Y = oy + py;
        const wob = this.wobble[i];
        const ws = waterF[i] + wob * 0.6;
        let c: Color;
        if (ws < 0) {
          cls[i] = C.WATER;
          depth[i] = -ws;
          still[i] = waterBase(p, X, Y, -ws);
          c = waterAnim(p, X, Y, -ws, 0, still[i]);
        } else if (ws < 2.4) {
          cls[i] = C.BANK;
          c = ws < 1.1 ? p.bank[0] : p.bank[1];
        } else {
          const ps = pathF[i] + wob * 0.8;
          const fs = forestF[i] + wob * 0.8;
          if (ps < -0.8) {
            cls[i] = C.PATH;
            c = pathColor(p, X, Y, -ps - 0.8);
          } else if (fs < 0.5) {
            if (deepF && deepF[i] + wob < 0) {
              cls[i] = C.VOID;
              depth[i] = 99;
              still[i] = waterBase(p, X, Y, 99);
              c = waterAnim(p, X, Y, 99, 0, still[i]);
            } else {
              cls[i] = C.FOREST;
              c = vnoise(X * 0.11, Y * 0.11, 12) < 0.55 ? p.forestFloor[0] : p.forestFloor[1];
            }
          } else {
            const n = this.patch[i];
            c = n < 0.41 ? p.grass[0] : n < 0.59 ? p.grass[1] : p.grass[2];
            // the forest's own shade, and the lip of grass along a path
            if (fs < 5.5 || ps < 1) c = p.grass[0];
            // where the blight has taken the ground
            if (this.blightN && BLIGHT_STYLE === 'stains') {
              if (this.blightAt(px, py) * 0.56 - this.blightN[i] > 0) cls[i] = C.BLIGHT;
            } else if (this.blightN) {
              const edge = this.blightAt(px, py) * 0.56 - this.blightN[i];
              if (edge > 0) {
                cls[i] = C.BLIGHT;
                c = edge < 0.022 ? p.blight[0] : n < 0.5 ? p.blight[1] : p.blight[2];
                // veins follow the way the stain spread: rings, like the grain of a stump
                const ring = Math.abs(((edge * 11) % 1) - 0.5);
                if (edge > 0.05 && ring < 0.045 && hash2(X, Y, 73) % 3 !== 0) c = p.blightVein;
                else if (edge > 0.06 && hash2(X, Y, 74) % 420 === 0) c = p.blightSpark;
              }
            }
          }
        }
        ground.u32[i] = c;
      }

    // ---- 2b. the blight's stains: a dark rim, a tide line, a deep core; dead grass round them, tendrils creeping out
    const dead = new Uint8Array(w * h);
    let dIn: Float32Array | null = null;
    if (this.blightN && BLIGHT_STYLE === 'stains') dIn = this.paintStains(world, ground, cls, dead);

    // ---- 3. blades and flowers
    const grassAt = (x: number, y: number): boolean => x >= 0 && y >= 0 && x < w && y < h && cls[y * w + x] === C.GRASS;
    for (let gj = Math.floor(oy / 6); gj * 6 < oy + h; gj++)
      for (let gi = Math.floor(ox / 7); gi * 7 < ox + w; gi++) {
        const hs = hash2(gi, gj, 41);
        const x = gi * 7 + (hs % 6) - ox;
        const y = gj * 6 + ((hs >>> 3) % 5) - oy;
        if (!grassAt(x, y) || !grassAt(x - 1, y) || !grassAt(x + 1, y) || !grassAt(x, y - 1) || !grassAt(x, y + 1)) continue;
        const meadow = kind(Math.floor(x / TILE), Math.floor(y / TILE)) === K.FLOWERS;
        const r = (hs >>> 8) % 100;
        const sort = hash2(Math.floor((ox + x) / 44), Math.floor((oy + y) / 34), 43);
        const withered = dead[y * w + x] === 1;
        // Nawia keeps its meadow quiet: few blades, dim ones, so whatever glows on it can be seen
        const calm = p.glow && NAWIA_CALM;
        if (!withered && (meadow ? r < 50 : r < (calm ? 1 : 3))) {
          drawFlower(ground, p, x, y, sort, meadow && r < 22);
          continue;
        }
        if (r > (meadow ? (calm ? 70 : 88) : calm ? 12 : 44)) continue;
        const here = ground.get(x, y);
        let col = here === p.grass[2] ? p.tuft[0] : here === p.grass[0] ? p.tuft[p.glow ? 0 : 1] : p.tuft[(hs >>> 16) & 1];
        let tip = p.glow && (hs >>> 20) % 5 === 0 ? p.tuft[1] : col;
        if (calm) {
          col = p.tuft[0];
          tip = meadow && (hs >>> 20) % 4 === 0 ? p.tuft[1] : col;
        }
        if (withered) {
          col = p.deadGrass[(hs >>> 16) & 1 ? 2 : 1];
          tip = p.deadGrass[0];
        }
        switch ((hs >>> 12) % 3) {
          case 0:
            ground.set(x - 1, y - 1, tip); ground.set(x + 1, y - 1, tip); ground.set(x, y, col);
            break;
          case 1:
            ground.set(x, y, col); ground.set(x, y - 1, tip);
            break;
          default:
            ground.set(x - 1, y, col); ground.set(x, y - 1, tip); ground.set(x + 1, y, col);
        }
      }

    // thorns pushing up through blighted ground
    if (dIn) this.paintShoots(world, ground, cls, dIn);
    else if (this.blightN)
      for (let gj = Math.floor(oy / 9); gj * 9 < oy + h; gj++)
        for (let gi = Math.floor(ox / 9); gi * 9 < ox + w; gi++) {
          const hs = hash2(gi, gj, 75);
          const x = gi * 9 + (hs % 8) - ox;
          const y = gj * 9 + ((hs >>> 3) % 8) - oy;
          if (x < 2 || y < 4 || x >= w - 2 || y >= h || cls[y * w + x] !== C.BLIGHT || (hs >>> 8) % 3 !== 0) continue;
          ground.set(x, y, p.blightWood[1]);
          ground.set(x, y - 1, p.blightWood[2]);
          ground.set(x + ((hs >>> 12) & 1 ? 1 : -1), y - 2, p.blightWood[3]);
          if ((hs >>> 14) % 3 === 0) ground.set(x, y - 3, p.blightSpark);
        }

    // ---- 4. everything that stands on the ground
    const low = new PixelBuffer(w, h);
    const high = this.overhead[world];
    const shade = new Uint8Array(w * h);
    const shadeEllipse = (cx: number, cy: number, rx: number, ry: number): void => {
      for (let y = Math.max(0, Math.floor(cy - ry)); y <= Math.min(h - 1, Math.ceil(cy + ry)); y++)
        for (let x = Math.max(0, Math.floor(cx - rx)); x <= Math.min(w - 1, Math.ceil(cx + rx)); x++) {
          const nx = (x + 0.5 - cx) / rx;
          const ny = (y + 0.5 - cy) / ry;
          if (nx * nx + ny * ny < 1) shade[y * w + x] = 1;
        }
    };
    const shadeRect = (x0: number, y0: number, rw: number, rh: number): void => {
      for (let y = Math.max(0, y0); y < Math.min(h, y0 + rh); y++) for (let x = Math.max(0, x0); x < Math.min(w, x0 + rw); x++) shade[y * w + x] = 1;
    };
    /** A stamp standing with its foot at (bx, by): its top goes overhead. */
    const place = (s: Stamp, bx: number, by: number, lowOnly = false): void => {
      const x = bx - s.ax;
      const y = by - s.ay;
      const cut = Math.min(s.buf.h, by - 8 - y);
      if (lowOnly || cut <= 0) {
        low.blit(s.buf, x, y);
        return;
      }
      high.blit(s.buf, x, y, 0, 0, s.buf.w, cut);
      if (cut < s.buf.h) low.blit(s.buf, x, y + cut, 0, cut, s.buf.w, s.buf.h - cut);
    };

    const jobs: { by: number; draw: () => void }[] = [];
    for (let y = -2; y < rows + 3; y++)
      for (let x = -2; x < cols + 2; x++) {
        const k = kind(x, y);
        const gx = room.gx * SCREEN_COLS + x;
        const gy = room.gy * SCREEN_ROWS + y;
        const hs = hash2(gx, gy, 51);
        const x0 = x * TILE;
        const y0 = y * TILE;
        const pick = <T>(list: T[]): T => list[(hs >>> 12) % list.length];
        switch (k) {
          case K.FOREST: {
            if (p.glow && at(deepG, x, y)) break;
            const bx = x0 + 8 + ((hs >>> 4) % 7) - 3;
            const by = y0 + 15 - ((hs >>> 8) % 3);
            const r = hs % 10;
            // deeper into the blight, more of the forest is dead
            const sick = (hs >>> 16) % 100 < this.blightAt(bx, by) * 46;
            const s = sick ? pick(g.dead) : r < 6 ? pick(g.oaks) : r < 9 ? pick(g.spruces) : pick(g.birches);
            shadeEllipse(bx + 4, by + 1, sick ? 6 : 10, sick ? 2.5 : 4);
            jobs.push({ by, draw: () => place(s, bx, by) });
            break;
          }
          case K.TREE:
          case K.OLDTREE: {
            const s = hs % 4 === 0 ? pick(g.birches) : k === K.OLDTREE && hs % 4 === 1 ? pick(g.spruces) : pick(g.lone);
            shadeEllipse(x0 + 12, y0 + 15, 12, 5);
            jobs.push({ by: y0 + 14, draw: () => place(s, x0 + 8, y0 + 14) });
            break;
          }
          case K.GIANT:
            shadeEllipse(x0 + 14, y0 + 16, 18, 7);
            jobs.push({ by: y0 + 14, draw: () => place(g.giant, x0 + 8, y0 + 14) });
            break;
          case K.STUMP:
            shadeEllipse(x0 + 10, y0 + 12, 6, 2.5);
            jobs.push({ by: y0 + 12, draw: () => place(g.stump, x0 + 8, y0 + 12, true) });
            break;
          case K.THICKET: {
            const tangle = this.blightN ? g.thorns : g.thickets;
            const s = pick(tangle);
            const hedge = this.blightN !== null && BLIGHT_STYLE === 'stains';
            const by = y0 + 15 - (hedge ? (hs >>> 6) % 3 : 0);
            shadeEllipse(x0 + 10, y0 + 15, hedge ? 11 : 9, 3);
            jobs.push({ by, draw: () => place(s, x0 + 8, by, true) });
            // fill the seams between neighbouring brambles (a hedge of thorns is wide enough to knit by itself)
            if (!hedge && kind(x + 1, y) === K.THICKET) jobs.push({ by: y0 + 14, draw: () => place(tangle[(hs >>> 3) % 4], x0 + 16, y0 + 14, true) });
            if (kind(x, y + 1) === K.THICKET) jobs.push({ by: y0 + 22, draw: () => place(tangle[(hs >>> 5) % 4], x0 + 8, y0 + 22, true) });
            break;
          }
          case K.BUSH: {
            const s = pick(g.bushes);
            shadeEllipse(x0 + 10, y0 + 14, 7, 3);
            jobs.push({ by: y0 + 14, draw: () => place(s, x0 + 8, y0 + 14, true) });
            break;
          }
          case K.ROCK: {
            const s = pick(g.boulders);
            shadeEllipse(x0 + 10, y0 + 15, 8, 3);
            jobs.push({ by: y0 + 15, draw: () => place(s, x0 + 8, y0 + 15, true) });
            break;
          }
          case K.HAY:
            shadeEllipse(x0 + 12, y0 + 15, 10, 4);
            jobs.push({ by: y0 + 15, draw: () => place(g.haystack, x0 + 8, y0 + 15) });
            break;
          case K.HIVE:
            shadeEllipse(x0 + 10, y0 + 15, 7, 3);
            jobs.push({ by: y0 + 15, draw: () => place(g.beehive, x0 + 8, y0 + 15) });
            break;
          case K.MALWY: {
            const s = pick(g.hollyhocks);
            shadeEllipse(x0 + 10, y0 + 15, 7, 2.5);
            jobs.push({ by: y0 + 15, draw: () => place(s, x0 + 8, y0 + 15) });
            break;
          }
          case K.WELL:
            shadeEllipse(x0 + 12, y0 + 15, 9, 3.5);
            jobs.push({ by: y0 + 15, draw: () => place(g.well, x0 + 8, y0 + 15) });
            break;
          case K.FENCE: {
            const run = kind(x - 1, y) === K.FENCE || kind(x + 1, y) === K.FENCE;
            const vertical = !run && (kind(x, y - 1) === K.FENCE || kind(x, y + 1) === K.FENCE);
            if (vertical) shadeRect(x0 + 10, y0 + 2, 3, 16);
            else shadeRect(x0 + 2, y0 + 14, 16, 2);
            jobs.push({ by: y0 + 14, draw: () => drawWattle(low, p, x0, y0, vertical) });
            break;
          }
          case K.PALISADE:
            shadeRect(x0 + 3, y0 + 16, 16, 3);
            jobs.push({
              by: y0 + 15,
              draw: () => {
                const card = new PixelBuffer(16, 24);
                drawPalisade(card, p, 0, 8, hs);
                high.blit(card, x0, y0 - 8, 0, 0, 16, 8);
                low.blit(card, x0, y0, 0, 8, 16, 16);
              },
            });
            break;
          case K.PLANK: {
            const ew = (kind(x - 1, y) === K.PLANK ? 1 : 0) + (kind(x + 1, y) === K.PLANK ? 1 : 0);
            const ns = (kind(x, y - 1) === K.PLANK ? 1 : 0) + (kind(x, y + 1) === K.PLANK ? 1 : 0);
            const along = ew > ns || (ew === ns && (kind(x - 1, y) !== K.WATER || kind(x + 1, y) !== K.WATER));
            jobs.push({ by: -1000 + y, draw: () => drawPlanks(low, p, x0, y0, along, hs) });
            break;
          }
          case K.STEPS: {
            let above = 0;
            while (kind(x, y - above - 1) === K.STEPS) above++;
            jobs.push({ by: -1000 + y, draw: () => drawSteps(low, p, x0, y0, above * 0.42, (above + 1) * 0.42) });
            break;
          }
          case K.HOUSE: {
            if (kind(x - 1, y) === K.HOUSE || kind(x, y - 1) === K.HOUSE) break;
            let wt = 1;
            let ht = 1;
            while (kind(x + wt, y) === K.HOUSE) wt++;
            while (kind(x, y + ht) === K.HOUSE) ht++;
            let door = -1;
            let open = false;
            for (let i = 0; i < wt; i++) {
              const cell = (y + ht - 1) * cols + x + i;
              const inRoom = x + i >= 0 && x + i < cols && y + ht - 1 >= 0 && y + ht - 1 < rows;
              if (inRoom && room.doors.has(cell)) { door = i; open = true; }
              else if (this.dungeon.charAt(gx + i, gy + ht - 1) === 'D') door = i;
            }
            shadeRect(x0 + wt * TILE - 1, y0 + 10, 7, ht * TILE - 6);
            shadeRect(x0 + 4, y0 + ht * TILE, wt * TILE + 2, 4);
            jobs.push({ by: y0 + ht * TILE - 1, draw: () => drawHouse(low, high, p, x0, y0, wt, ht, door, hs, open) });
            break;
          }
        }
      }
    // reeds along the banks, lilies on still water
    for (let gj = Math.floor(oy / 9); gj * 9 < oy + h; gj++)
      for (let gi = Math.floor(ox / 9); gi * 9 < ox + w; gi++) {
        const hs = hash2(gi, gj, 61);
        const x = gi * 9 + (hs % 8) - ox;
        const y = gj * 9 + ((hs >>> 3) % 8) - oy;
        if (x < 2 || y < 2 || x >= w - 2 || y >= h - 1) continue;
        if (kind(Math.floor(x / TILE), Math.floor(y / TILE)) === K.PLANK) continue;
        const i = y * w + x;
        const r = (hs >>> 8) % 100;
        if ((cls[i] === C.BANK && r < 34) || (cls[i] === C.WATER && depth[i] < 4 && r < 16)) jobs.push({ by: y, draw: () => drawReeds(low, p, x, y, hs >>> 16) });
        else if (!p.glow && cls[i] === C.WATER && depth[i] > 5.5 && r < 7) jobs.push({ by: y, draw: () => drawLily(low, p, x, y, r < 3) });
      }
    jobs.sort((a, b) => a.by - b.by);

    // cast shadows fall on the ground, under everything that stands on it
    const shaded = (c: Color, i: number): Color => (p.shadowK > 0 && shade[i] && cls[i] !== C.FOREST ? mix(c, p.shadow, p.shadowK) : c);
    for (let i = 0; i < ground.u32.length; i++) ground.u32[i] = shaded(ground.u32[i], i);
    for (const j of jobs) j.draw();

    // ---- 5. frames: water and stars move, the rest does not
    const moving: number[] = [];
    for (let i = 0; i < cls.length; i++) if (cls[i] === C.WATER || cls[i] === C.VOID) moving.push(i);
    if (moving.length === 0) {
      ground.blit(low, 0, 0);
      this.buffers[world].u32.set(ground.u32);
      return;
    }
    const frames: PixelBuffer[] = [];
    for (let f = 0; f < 4; f++) {
      const b = ground.clone();
      if (f > 0)
        for (const i of moving) {
          const X = ox + (i % w);
          const Y = oy + Math.floor(i / w);
          b.u32[i] = shaded(waterAnim(p, X, Y, depth[i], f, still[i]), i);
        }
      b.blit(low, 0, 0);
      frames.push(b);
    }
    this.frames[world] = frames;
    this.buffers[world].u32.set(frames[0].u32);
  }
}
