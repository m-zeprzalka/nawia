// Turns a stronghold RoomDef (biome: crypt) into pictures: one per world, plus one "echo" layer per world
// (the afterimage of what is solid on the other side). Two techniques live here:
//
//   RoomPainter   the first one: every cell is stamped from the 16x16 tileset (src/art/tiles.ts).
//   CryptPainter  the current one: the stronghold is painted per pixel, like the surface. See below.
//
// `CRYPT_TECHNIQUE` in painter.ts picks one. Pure pixel code: used by the game and by the preview tools.

import { SCREEN_COLS, SCREEN_ROWS, TILE, WORLDS, otherWorld, type World } from '../config.ts';
import { PixelBuffer, mix, rgb, withAlpha, type Color } from '../core/PixelBuffer.ts';
import { hash2, mulberry32 } from '../core/rng.ts';
import { RUNES, TILESET_COLS, TILE_INDEX, type TileName } from '../art/tiles.ts';
import { PAL } from '../art/palette.ts';
import { chamfer, noiseField } from '../art/surface.ts';
import { TERRAIN, isWalkable, type Dungeon, type RoomDef } from './roomFormat.ts';
import type { RoomPicture } from './painter.ts';

const { VOID, FLOOR, WALL, WATER, BRIDGE, RUBBLE } = TERRAIN;

const DECOR: TileName[] = ['decor0', 'decor1', 'decor2', 'decor2', 'decor3', 'decor4', 'decor5', 'decor0'];
const FACES: TileName[] = [
  'face0', 'face1', 'face2', 'face0', 'face1', 'face2', 'face0', 'face1', 'face2', 'face0',
  'face_v1', 'face_v1', 'face_v1', 'face_v2', 'face_v2', 'face_v3',
];
const TOPS = ['top0', 'top1', 'top2', 'top3'] as const;
const WATERS = ['water0', 'water1', 'water2', 'water3'] as const;

export class RoomPainter implements RoomPicture {
  readonly room: RoomDef;
  readonly w: number;
  readonly h: number;
  readonly buffers: Record<World, PixelBuffer>;
  /** What you cannot stand on in the *other* world, drawn over cells you can stand on here. */
  readonly echo: Record<World, PixelBuffer>;
  /** Nothing in the stronghold is drawn above the hero. */
  readonly overhead = null;
  /** Cells that animate (water, and the starry void of Nawia), per world. */
  readonly animated: Record<World, number[]> = { jawia: [], nawia: [] };

  private readonly dungeon: Dungeon;
  private readonly tilesets: Record<World, PixelBuffer>;
  private readonly occupied = new Set<number>();
  private readonly torchCells = new Set<number>();

  constructor(room: RoomDef, dungeon: Dungeon, tilesets: Record<World, PixelBuffer>) {
    this.room = room;
    this.dungeon = dungeon;
    this.tilesets = tilesets;
    this.w = room.cols * TILE;
    this.h = room.rows * TILE;
    this.buffers = { jawia: new PixelBuffer(this.w, this.h), nawia: new PixelBuffer(this.w, this.h) };
    this.echo = { jawia: new PixelBuffer(this.w, this.h), nawia: new PixelBuffer(this.w, this.h) };
    for (const o of room.objects) {
      if (o.kind === 'torch') this.torchCells.add(o.ty * room.cols + o.tx);
      else if (o.kind !== 'enemy') this.occupied.add(o.ty * room.cols + o.tx);
    }
    for (const world of WORLDS) {
      for (let y = 0; y < room.rows; y++)
        for (let x = 0; x < room.cols; x++) {
          const t = room.terrain[world][y * room.cols + x];
          const starry = world === 'nawia' && (t === VOID || (t === WALL && this.isWallLike(this.at(world, x, y + 1))));
          if (t === WATER || starry) this.animated[world].push(y * room.cols + x);
          this.paintCell(world, x, y, 0);
          this.paintEcho(world, x, y);
        }
    }
  }

  /** Repaints every animated cell with the given animation frame. */
  animate(frame: number): void {
    for (const world of WORLDS)
      for (const k of this.animated[world]) this.paintCell(world, k % this.room.cols, Math.floor(k / this.room.cols), frame);
  }

  /** Terrain of a cell, looking into neighbouring rooms across the border. */
  private at(world: World, x: number, y: number): number {
    const r = this.room;
    if (x >= 0 && y >= 0 && x < r.cols && y < r.rows) return r.terrain[world][y * r.cols + x];
    return this.dungeon.terrainAt(world, r.gx * SCREEN_COLS + x, r.gy * SCREEN_ROWS + y);
  }

  private isWallLike(v: number): boolean {
    return v === WALL || v === VOID;
  }

  /** Does this cell behave differently in the two worlds? */
  private differs(x: number, y: number): boolean {
    return isWalkable(this.at('jawia', x, y)) !== isWalkable(this.at('nawia', x, y));
  }

  private stamp(buf: PixelBuffer, world: World, name: TileName, x: number, y: number): void {
    const i = TILE_INDEX[name];
    buf.blit(
      this.tilesets[world], x * TILE, y * TILE,
      (i % TILESET_COLS) * TILE, Math.floor(i / TILESET_COLS) * TILE, TILE, TILE,
    );
  }

  private paintEcho(world: World, x: number, y: number): void {
    const here = this.at(world, x, y);
    const there = this.at(otherWorld(world), x, y);
    if (isWalkable(here) && !isWalkable(there)) this.stamp(this.echo[world], world, 'echo_solid', x, y);
    else if (!isWalkable(here) && there === BRIDGE) this.stamp(this.echo[world], world, 'echo_bridge', x, y);
  }

  paintCell(world: World, x: number, y: number, frame: number): void {
    const r = this.room;
    const buf = this.buffers[world];
    const put = (name: TileName): void => this.stamp(buf, world, name, x, y);
    const k = y * r.cols + x;
    const t = this.at(world, x, y);
    const n = this.at(world, x, y - 1);
    const s = this.at(world, x, y + 1);
    const w = this.at(world, x - 1, y);
    const e = this.at(world, x + 1, y);
    // hashes use dungeon-global coordinates so patterns do not repeat from room to room
    const gx = r.gx * SCREEN_COLS + x;
    const gy = r.gy * SCREEN_ROWS + y;
    const h = hash2(gx, gy, 11);
    const isWall = (v: number): boolean => this.isWallLike(v);
    const isFace = (cx: number, cy: number): boolean => this.at(world, cx, cy) === WALL && !isWall(this.at(world, cx, cy + 1));
    const solidish = (v: number): boolean => v === WALL || v === RUBBLE;

    switch (t) {
      case VOID: {
        put(world === 'nawia' ? TOPS[(frame + h) & 3] : TOPS[h & 3]);
        break;
      }
      case FLOOR:
      case RUBBLE: {
        const plain = t === FLOOR && !r.ornament[k] && !this.occupied.has(k);
        if (r.ornament[k]) put('floor_orn');
        else {
          // big slabs, two tiles wide, laid like bricks
          const col = gx + (gy & 1);
          const sh = hash2(col >> 1, gy, 3);
          put(sh % 5 < 3 ? (h & 1 ? 'floor_a0' : 'floor_a1') : h & 1 ? 'floor_b0' : 'floor_b1');
          const split = (sh >>> 4) % 4 === 0;
          const leftHalf = (col & 1) === 0;
          const paved = (cx: number): boolean => {
            const v = this.at(world, cx, y);
            return (v === FLOOR || v === RUBBLE) && !(cx >= 0 && cx < r.cols && r.ornament[y * r.cols + cx]);
          };
          if (!leftHalf || split || !paved(x + 1)) put('joint_r');
          if (leftHalf || split || !paved(x - 1)) put('hl_l');
          if (plain && !leftHalf && (sh >>> 8) % 13 === 0) put('floor_chip');
        }
        if (plain) {
          const nearSeam = this.differs(x - 1, y) || this.differs(x + 1, y) || this.differs(x, y - 1) || this.differs(x, y + 1);
          if (world === 'jawia' && r.debris[k]) put(h % 2 ? 'debris0' : 'debris1');
          else if (nearSeam && !this.differs(x, y) && (h >>> 5) % 5 < 2) put(h & 1 ? 'rift0' : 'rift1');
          else if (isWall(n) && isWall(w) && (h >>> 3) % 3 !== 0) put('cobweb_nw');
          else if (isWall(n) && isWall(e) && (h >>> 3) % 3 !== 0) put('cobweb_ne');
          else if ((h >>> 8) % 11 === 0) put(DECOR[(h >>> 12) % DECOR.length]);
        }
        if (solidish(n)) put('shadow_n');
        if (solidish(w)) put('shadow_w');
        if (solidish(e)) put('shadow_e');
        if (s === WALL) put('shadow_s');
        if (t === RUBBLE) put(h % 2 ? 'rubble0' : 'rubble1');
        break;
      }
      case WALL: {
        if (!isWall(s)) {
          // we can see this wall's face
          put(this.torchCells.has(k) ? 'face0' : FACES[(h >>> 4) % FACES.length]);
          if (!isWall(w)) put('face_end_w');
          else if (!isFace(x - 1, y)) put('face_ao_w');
          if (!isWall(e)) put('face_end_e');
          else if (!isFace(x + 1, y)) put('face_ao_e');
          if (!isWall(n)) put('face_cap_n');
        } else {
          put(world === 'nawia' ? TOPS[(frame + h) & 3] : TOPS[h & 3]);
          const openN = !isWall(n);
          const openW = !isWall(w);
          const openE = !isWall(e);
          if (openN) put('rim_n');
          if (openW) put('rim_w');
          else if (isFace(x - 1, y)) put('rim_w_low');
          if (openE) put('rim_e');
          else if (isFace(x + 1, y)) put('rim_e_low');
          if (openN && openW) put('corner_out_nw');
          if (openN && openE) put('corner_out_ne');
          if (!openN && !openW && !isWall(this.at(world, x - 1, y - 1))) put('corner_nw');
          if (!openN && !openE && !isWall(this.at(world, x + 1, y - 1))) put('corner_ne');
        }
        break;
      }
      case WATER: {
        put(WATERS[(frame + gx + gy) & 3]);
        const wet = (v: number): boolean => v === WATER || v === BRIDGE;
        if (wet(n) && wet(s) && wet(w) && wet(e) && (h >>> 6) % 7 === 0) put(h & 1 ? 'lily0' : 'lily1');
        if (n === BRIDGE) put('shadow_n');
        else if (!wet(n)) put('shore_n');
        if (!wet(w)) put('shore_w');
        if (!wet(e)) put('shore_e');
        if (!wet(s)) put('shore_s');
        break;
      }
      case BRIDGE: {
        const ew = (w === BRIDGE ? 1 : 0) + (e === BRIDGE ? 1 : 0);
        const ns = (n === BRIDGE ? 1 : 0) + (s === BRIDGE ? 1 : 0);
        const horizontal = ew > ns || (ew === ns && (w === FLOOR || e === FLOOR || ns === 0));
        put(horizontal ? 'deck_h' : 'deck_v');
        if (n === WATER) put('rail_n');
        if (s === WATER) put('rail_s');
        if (w === WATER) put('rail_w');
        if (e === WATER) put('rail_e');
        break;
      }
    }
  }
}

// =====================================================================================================
// The painted stronghold (CRYPT_TECHNIQUE = 'painted').
//
// Zwonigród was built, then drowned, then forgotten. The picture is computed per pixel, from the cells:
//
//   floor   courses of slabs of unequal height, joints at uneven distances (global coordinates, so nothing
//           repeats every tile); every slab is lit on its upper-left edge and worn at the corners.
//           The middle of a room stays quiet; the dirt, the damp, the moss, the chips and the puddles
//           gather where they would: along the foot of walls, in corners, around water.
//   shade   light comes from the upper left: walls throw a long shadow down and to the right, a short one
//           elsewhere; every prop and heap of rubble has a contact shadow. Quantised into a few bands.
//   walls   a coping stone along every edge of a wall top (lit where it faces the light), a face of
//           ashlar blocks of unequal width, darker towards its foot; beyond the walls, earth (Jawia)
//           or the starry void (Nawia).
//   cracks  where a cell is solid on the other side, the stone is cracked along its joints and the
//           other world's light seeps through: the hint is exactly where the difference is.
//
// Nawia is the same stronghold as the dead remember it: whole, clean, dark, with glowing edges.
// Bridges, lily pads, cobwebs, niches and windows are still taken from the tileset.

/** Px of coping stone along every edge of a wall top, measured from the room side. */
const CAP = 5;
/** Px of margin around the room for the distance fields, so nothing changes at a doorway. */
const PM = TILE;
/** Heights of the courses of floor slabs. Unequal on purpose; the list repeats every 139 px. */
const COURSES = [12, 9, 14, 11, 10, 13, 9, 12, 15, 10, 11, 13];
const COURSE_SPAN = COURSES.reduce((a, b) => a + b, 0);
const COURSE_IDX = new Uint8Array(COURSE_SPAN);
const COURSE_ROW = new Uint8Array(COURSE_SPAN);
{
  let y = 0;
  COURSES.forEach((ht, i) => {
    for (let r = 0; r < ht; r++, y++) { COURSE_IDX[y] = i; COURSE_ROW[y] = r; }
  });
}
/** Every SLAB_W px along a course there is exactly one joint, somewhere: slabs come out 7 to 37 px long. */
const SLAB_W = 22;
const slabJoint = (k: number, c: number): number => k * SLAB_W + 3 + (hash2(k, c, 5) % 16);

/** What a floor pixel is, within its slab. */
const SP = { INNER: 0, JOINT: 1, LIT: 2, DARK: 3, CORNER: 4 } as const;
/** What a pixel of the picture is. */
const PX = { FLOOR: 0, CAP: 1, FACE: 2, BEYOND: 3, WATER: 4, BRIDGE: 5 } as const;

let slabHash = 0;
// The slab under the last pixel asked about: neighbours along a row mostly fall in the same one.
let slabY = NaN;
let slabC = 0;
let slabR = 0;
let slabHc = 0;
let slabJ0 = 0;
let slabJ1 = -1;
let slabSh = 0;
/** Where (X, Y) falls in the paving: joint, bevel or inside of a slab. Leaves the slab's hash in `slabHash`. */
function slabPixel(X: number, Y: number): number {
  if (Y !== slabY) {
    const m = ((Y % COURSE_SPAN) + COURSE_SPAN) % COURSE_SPAN;
    const ci = COURSE_IDX[m];
    slabY = Y;
    slabC = Math.floor(Y / COURSE_SPAN) * COURSES.length + ci;
    slabR = COURSE_ROW[m];
    slabHc = COURSES[ci];
    slabJ1 = slabJ0 - 1;
  }
  if (X < slabJ0 || X >= slabJ1) {
    let k = Math.floor(X / SLAB_W);
    let j = slabJoint(k, slabC);
    if (X < j) j = slabJoint(--k, slabC);
    slabJ0 = j;
    slabJ1 = slabJoint(k + 1, slabC);
    slabSh = hash2(k, slabC, 9);
  }
  const r = slabR;
  const hc = slabHc;
  let j0 = slabJ0;
  let j1 = slabJ1;
  let sh = slabSh;
  let y0 = 1;
  let y1 = hc - 1;
  if ((sh >>> 3) % 6 === 0 && hc >= 11 && j1 - j0 >= 15) {
    // a slab that broke and was patched with two smaller stones in its lower half
    const mid = (hc >> 1) + ((sh >>> 6) & 1);
    slabHash = sh;
    if (r === mid) return SP.JOINT;
    if (r > mid) {
      const xs = j0 + 5 + ((sh >>> 9) % (j1 - j0 - 9));
      if (X === xs) return SP.JOINT;
      if (X < xs) { j1 = xs; sh = hash2(sh, 1, 3); }
      else { j0 = xs; sh = hash2(sh, 2, 3); }
      y0 = mid + 1;
    } else y1 = mid - 1;
  }
  slabHash = sh;
  if (X === j0 || r === 0) return SP.JOINT;
  const L = X === j0 + 1;
  const R = X === j1 - 1;
  const T = r === y0;
  const B = r === y1;
  if ((L || R) && (T || B)) return SP.CORNER;
  if (L || T) return SP.LIT;
  if (R || B) return SP.DARK;
  return SP.INNER;
}

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

// Contact shadow on the floor, by distance (px) from a solid neighbour. The light comes from the upper left,
// so walls to the north and west throw long shadows; to the east and south there is only occlusion.
const AO_N = [0.62, 0.52, 0.44, 0.36, 0.28, 0.2, 0.12, 0.05];
const AO_W = [0.5, 0.4, 0.3, 0.2, 0.12, 0.05];
const AO_E = [0.32, 0.18, 0.08];
const AO_S = [0.3, 0.16, 0.06];
const AO_C = [0.3, 0.16, 0.06];
const band = (tab: readonly number[], d: number): number => (d < 0 ? tab[0] : d < tab.length ? tab[d] : 0);
/** -1, 0 or 1, changing every few px along a line (`s`), so the edge of a shadow is not ruled. */
const wobble = (s: number, lane: number, salt: number): number => {
  const k = s >> 3;
  const a = hash2(k, lane, salt) % 3;
  const b = hash2(k + 1, lane, salt) % 3;
  return ((s & 7) < 4 ? a : b) - 1;
};

const FACE_TONE_J = [2, 3, 3, 4];
const FACE_TONE_N = [1, 2, 2, 1];
const FACE_END_AO = [0.5, 0.3, 0.14];
const WAVELET = [2, 4, 6, 4];

/** Props that stand on the floor, and the size of the shadow at their foot (rx, ry). */
const PROP_SHADOW: Record<string, [number, number]> = {
  pillar: [8, 3.4], urn: [5.5, 2.4], brazier: [6.5, 2.6], idol: [6, 2.8], sign: [6.5, 2.8],
  bell: [8, 3], switch: [6, 2.6], post: [7, 2.6], greatbell: [22, 5],
};

export class CryptPainter implements RoomPicture {
  readonly room: RoomDef;
  readonly w: number;
  readonly h: number;
  readonly buffers: Record<World, PixelBuffer>;
  readonly echo: Record<World, PixelBuffer>;
  /** Nothing in the stronghold is drawn above the hero. */
  readonly overhead = null;

  private readonly dungeon: Dungeon;
  private readonly tilesets: Record<World, PixelBuffer>;
  /** Four finished pictures per world, if anything in it moves (water, stars). */
  private readonly frames: Record<World, PixelBuffer[] | null> = { jawia: null, nawia: null };
  private readonly occupied = new Set<number>();
  private readonly torchCells = new Set<number>();
  /** Noise that does not depend on the world: where the damp is, the mottling of the stone, and so on. */
  private readonly noise: Record<'nDamp' | 'nMottle' | 'nBig' | 'nFine' | 'nWater', Float32Array>;

  constructor(room: RoomDef, dungeon: Dungeon, tilesets: Record<World, PixelBuffer>, echo: Record<World, PixelBuffer>) {
    this.room = room;
    this.dungeon = dungeon;
    this.tilesets = tilesets;
    this.echo = echo;
    this.w = room.cols * TILE;
    this.h = room.rows * TILE;
    this.buffers = { jawia: new PixelBuffer(this.w, this.h), nawia: new PixelBuffer(this.w, this.h) };
    for (const o of room.objects) {
      if (o.kind === 'torch') this.torchCells.add(o.ty * room.cols + o.tx);
      else if (o.kind !== 'enemy') this.occupied.add(o.ty * room.cols + o.tx);
    }
    const ox = room.gx * SCREEN_COLS * TILE;
    const oy = room.gy * SCREEN_ROWS * TILE;
    const n = (sx: number, sy: number, seed: number): Float32Array => noiseField(this.w, this.h, ox, oy, sx, sy, seed);
    this.noise = { nDamp: n(0.03, 0.034, 77), nMottle: n(0.09, 0.12, 78), nBig: n(0.02, 0.026, 79), nFine: n(0.23, 0.23, 80), nWater: n(0.045, 0.1, 41) };
    for (const world of WORLDS) this.paint(world);
  }

  animate(frame: number): void {
    for (const world of WORLDS) {
      const f = this.frames[world];
      if (f) this.buffers[world].u32.set(f[frame & 3].u32);
    }
  }

  /** Terrain of a cell, looking into neighbouring rooms across the border. */
  private at(world: World, x: number, y: number): number {
    const r = this.room;
    if (x >= 0 && y >= 0 && x < r.cols && y < r.rows) return r.terrain[world][y * r.cols + x];
    return this.dungeon.terrainAt(world, r.gx * SCREEN_COLS + x, r.gy * SCREEN_ROWS + y);
  }

  /** Copies a piece of a tile from the tileset (its opaque pixels only). */
  private tilePiece(dst: PixelBuffer, world: World, name: TileName, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number): void {
    const i = TILE_INDEX[name];
    dst.blit(this.tilesets[world], dx, dy, (i % TILESET_COLS) * TILE + sx, Math.floor(i / TILESET_COLS) * TILE + sy, sw, sh);
  }

  private paint(world: World): void {
    const { room, w, h, dungeon } = this;
    const { cols, rows } = room;
    const p = PAL[world];
    const jawia = world === 'jawia';
    const glowCol = PAL[otherWorld(world)].accent;
    const ox = room.gx * SCREEN_COLS * TILE;
    const oy = room.gy * SCREEN_ROWS * TILE;
    const gcx0 = room.gx * SCREEN_COLS;
    const gcy0 = room.gy * SCREEN_ROWS;
    const N = w * h;
    const F = p.floor;
    const S = p.stone;
    const G = p.growth;
    const Wt = p.water;
    const black = rgb(0x000000);
    const SHADOW = jawia ? rgb(0x0e0b14) : rgb(0x020309);
    const GRIME = rgb(0x221c22);
    const WET = rgb(0x1d2a2e);

    // ---- 1. cells in both worlds, two tiles into the neighbours
    const MG = 2;
    const cw = cols + 2 * MG;
    const here = new Uint8Array(cw * (rows + 2 * MG));
    const there = new Uint8Array(cw * (rows + 2 * MG));
    for (let y = -MG; y < rows + MG; y++)
      for (let x = -MG; x < cols + MG; x++) {
        here[(y + MG) * cw + x + MG] = this.at(world, x, y);
        there[(y + MG) * cw + x + MG] = this.at(otherWorld(world), x, y);
      }
    const CH = rows + 2 * MG;
    const solid = (v: number): boolean => v === WALL || v === VOID;
    const FACE = new Uint8Array(cw * CH);
    const ORN = new Uint8Array(cw * CH);
    for (let y = 0; y < CH; y++)
      for (let x = 0; x < cw; x++) {
        const k = y * cw + x;
        FACE[k] = here[k] === WALL && y + 1 < CH && !solid(here[k + cw]) ? 1 : 0;
        const rx = x - MG;
        const ry = y - MG;
        const o = rx >= 0 && ry >= 0 && rx < cols && ry < rows ? room.ornament[ry * cols + rx] === 1 : dungeon.charAt(gcx0 + rx, gcy0 + ry) === ',';
        ORN[k] = o ? 1 : 0;
      }
    // Walls that reach the edge of the picture hold back what lies beyond; a block standing on its own has a top of stone.
    const OUTER = new Uint8Array(cw * CH);
    {
      const stack: number[] = [];
      for (let y = 0; y < CH; y++)
        for (let x = 0; x < cw; x++) {
          const k = y * cw + x;
          const rim = x < MG || y < MG || x >= cw - MG || y >= CH - MG;
          if (rim && solid(here[k])) { OUTER[k] = 1; stack.push(k); }
        }
      while (stack.length) {
        const k = stack.pop()!;
        const x = k % cw;
        for (const j of [k - 1, k + 1, k - cw, k + cw]) {
          if (j < 0 || j >= cw * CH || OUTER[j] || !solid(here[j])) continue;
          if (Math.abs((j % cw) - x) > 1) continue;
          OUTER[j] = 1;
          stack.push(j);
        }
      }
    }
    const cell = (x: number, y: number): number => (x < -MG || y < -MG || x >= cols + MG || y >= CH - MG ? -1 : (y + MG) * cw + x + MG);
    const t = (x: number, y: number): number => {
      const k = cell(x, y);
      return k < 0 ? VOID : here[k];
    };
    const u = (x: number, y: number): number => {
      const k = cell(x, y);
      return k < 0 ? VOID : there[k];
    };
    const isFace = (x: number, y: number): boolean => {
      const k = cell(x, y);
      return k >= 0 && FACE[k] === 1;
    };
    const orn = (x: number, y: number): boolean => {
      const k = cell(x, y);
      return k >= 0 && ORN[k] === 1;
    };
    const plainFloor = (v: number): boolean => v === FLOOR || v === RUBBLE;
    /** Standing here is fine, standing there is not (water and bridges excepted: some rooms hide those on purpose). */
    const danger = (x: number, y: number): boolean => t(x, y) === FLOOR && (u(x, y) === WALL || u(x, y) === RUBBLE);
    const opening = (x: number, y: number): boolean => (t(x, y) === WALL || t(x, y) === RUBBLE) && u(x, y) === FLOOR;
    const busy = (x: number, y: number): boolean => this.occupied.has(y * cols + x);

    // ---- 2. distance fields (px) from walls and from water, and the noise everything else grows by
    const fw = w + 2 * PM;
    const fh = h + 2 * PM;
    const wallSrc = new Uint8Array(fw * fh);
    const waterSrc = new Uint8Array(fw * fh);
    let anyWater = false;
    for (let cy = -1; cy <= rows; cy++)
      for (let cx = -1; cx <= cols; cx++) {
        const v = t(cx, cy);
        const wall = solid(v);
        const water = v === WATER;
        if (!wall && !water) continue;
        anyWater ||= water;
        for (let y = 0; y < TILE; y++) {
          const k = ((cy + 1) * TILE + y) * fw + (cx + 1) * TILE;
          (wall ? wallSrc : waterSrc).fill(1, k, k + TILE);
        }
      }
    const dWall = chamfer(wallSrc, fw, fh, PM, w, h);
    const dWater = anyWater ? chamfer(waterSrc, fw, fh, PM, w, h) : new Float32Array(N).fill(99);
    const { nDamp, nMottle, nBig, nFine, nWater } = this.noise;
    /** How wet the stone is, 0..1: always by the water, in patches along the walls. */
    const damp = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const byWater = clamp01(1 - dWater[i] / 14);
      const byWall = clamp01(1 - dWall[i] / 10) * clamp01((nDamp[i] - 0.36) / 0.26);
      damp[i] = Math.max(byWater, byWall);
    }

    // ---- 3. the picture, pixel by pixel
    const ground = new PixelBuffer(w, h);
    const g = ground.u32;
    const cls = new Uint8Array(N);
    const code = new Uint8Array(N).fill(255); // SP code of floor pixels (255: not paving)
    /** Water and stars: the colour under what moves, its depth from the bank, and whether something lies on it. */
    const still = new Uint32Array(N);
    const depth = new Uint8Array(N);
    const frozen = new Uint8Array(N);
    const R = p.rock;
    /** Joints across a coping stone: every 11 px or so along the wall. */
    const capJoint = (s: number, lane: number): boolean => {
      const k = Math.floor(s / 11);
      return s - k * 11 === 2 + (hash2(k, lane, 31) % 7);
    };
    const faceJoint = (k: number, lane: number): number => k * 13 + 2 + (hash2(k, lane, 33) % 7);
    const footJoint = (k: number, lane: number): number => k * 9 + 1 + (hash2(k, lane, 81) % 5);


    // every slab tone and its bevels, once: [tone 0..7][variant 0..3] x [inner, joint, lit, dark, corner, dirty joint]
    const slabCols = new Uint32Array(32 * 6);
    for (let tone = 0; tone < 8; tone++)
      for (let a = 0; a < 4; a++) {
        const k = ((tone << 2) | a) * 6;
        if (jawia) {
          let base = mix(F[2], F[3], 0.2 + (tone / 7) * 0.45);
          if (a & 2) base = mix(base, R[3], 0.18); // a warmer stone
          if (a & 1) base = mix(base, F[1], 0.2); // mottled
          slabCols.set([base, mix(F[1], F[0], 0.25), mix(base, F[4], 0.38), mix(base, F[1], 0.32), mix(base, F[1], 0.5), mix(F[1], base, 0.45)], k);
        } else {
          let base = a === 2 ? mix(F[1], F[2], 0.6) : a === 1 ? mix(F[1], F[2], 0.32) : F[1];
          base = mix(base, F[2], (tone / 7) * 0.14);
          const joint = mix(base, F[0], 0.6);
          slabCols.set([base, joint, mix(base, F[3], 0.22), base, mix(base, F[0], 0.35), joint], k);
        }
      }
    const waterLight = mix(Wt[1], Wt[2], 0.5);
    const waterDeep = mix(Wt[1], Wt[0], 0.6);
    const wetv = (q: number): boolean => q === WATER || q === BRIDGE;
    const kerbOf = (x: number, y: number): boolean => plainFloor(t(x, y)) && !orn(x, y);
    /** What a wall top's coping faces: rectangles of its 3x3 neighbourhood that can be seen (x0, x1, y0, y1). */
    const rects: number[] = [];
    for (let cy = 0; cy < rows; cy++)
      for (let cx = 0; cx < cols; cx++) {
        const v = t(cx, cy);
        const n = t(cx, cy - 1);
        const s = t(cx, cy + 1);
        const wv = t(cx - 1, cy);
        const ev = t(cx + 1, cy);
        const x0 = cx * 16;
        const y0 = cy * 16;
        const gcy = gcy0 + cy;

        if (plainFloor(v)) {
          const ornHere = orn(cx, cy);
          const kW = ornHere && kerbOf(cx - 1, cy);
          const kE = ornHere && kerbOf(cx + 1, cy);
          const kN = ornHere && kerbOf(cx, cy - 1);
          const kS = ornHere && kerbOf(cx, cy + 1);
          const wn = n === WATER;
          const ws = s === WATER;
          const ww = wv === WATER;
          const we = ev === WATER;
          const kDark = jawia ? R[1] : F[0];
          const kLit = jawia ? R[4] : mix(G[0], F[1], 0.3);
          const kShade = jawia ? R[2] : F[1];
          for (let ly = 0; ly < 16; ly++) {
            const Y = oy + y0 + ly;
            for (let lx = 0; lx < 16; lx++) {
              const X = ox + x0 + lx;
              const i = (y0 + ly) * w + x0 + lx;
              let c: Color;
              if (ornHere) {
                // ornamental paving: small warm setts with a kerb, the same in both worlds
                const q = Math.floor(Y / 5);
                const off = (q & 1) * 3;
                const sx = (((X + off) % 7) + 7) % 7;
                const sy = ((Y % 5) + 5) % 5;
                const sh = hash2(Math.floor((X + off) / 7), q, 61);
                const joint = sx === 0 || sy === 0;
                code[i] = joint ? SP.JOINT : SP.INNER;
                if (jawia) {
                  const base = mix(R[3], R[4], 0.15 + ((sh >>> 2) & 3) * 0.12);
                  c = joint ? mix(R[1], R[2], 0.5) : sx === 1 || sy === 1 ? mix(base, R[5], 0.22) : sx === 6 || sy === 4 ? mix(base, R[2], 0.35) : base;
                } else {
                  const base = mix(F[1], F[2], 0.45 + (sh & 3) * 0.08);
                  c = joint ? mix(G[0], F[1], 0.35) : sx === 1 || sy === 1 ? mix(base, F[3], 0.25) : base;
                }
                if (kW) { if (lx === 0) c = kDark; else if (lx === 1) c = kLit; }
                if (kE) { if (lx === 15) c = kDark; else if (lx === 14) c = kShade; }
                if (kN) { if (ly === 0) c = kDark; else if (ly === 1) c = kLit; }
                if (kS) { if (ly === 15) c = kDark; else if (ly === 14) c = kShade; }
              } else {
                const sp = slabPixel(X, Y);
                code[i] = sp;
                const sh = slabHash;
                if (jawia) {
                  const a = ((sh >>> 16) % 5 === 0 ? 2 : 0) | (nMottle[i] < 0.28 ? 1 : 0);
                  const dirty = sp === SP.JOINT && hash2(X >> 2, Y >> 2, 15) % 5 === 0;
                  c = slabCols[((((sh >>> 12) & 7) << 2) | a) * 6 + (dirty ? 5 : sp)];
                  // dirt gathers along the walls, damp in patches and by the water
                  if (dWall[i] < 8.5) {
                    const gr = (1 - dWall[i] / 12) * (0.55 + 0.45 * nDamp[i]);
                    if (gr > 0.3) c = mix(c, GRIME, gr > 0.6 ? 0.3 : 0.15);
                  }
                  const dm = damp[i];
                  if (dm > 0.36) {
                    c = mix(c, WET, dm > 0.66 ? 0.34 : 0.18);
                    if (sp === SP.JOINT && dm > 0.62 && hash2(X, Y, 21) % 3 !== 0) c = dm > 0.82 ? G[2] : G[1];
                  }
                } else {
                  // the dead remember it whole and clean: big soft pools of tone, joints that barely show
                  const a = nBig[i] > 0.58 ? 2 : nBig[i] > 0.42 ? 1 : 0;
                  c = slabCols[((((sh >>> 12) & 7) << 2) | a) * 6 + sp];
                  if (sp === SP.JOINT && dWall[i] < 5 && damp[i] > 0.55 && hash2(X >> 1, Y >> 1, 22) % 3 === 0) c = mix(c, G[1], 0.6);
                }
              }
              // the kerb where the floor ends at water
              if (jawia) {
                if (ws && ly === 15) c = mix(F[1], F[0], 0.5);
                else if (ws && ly === 14) c = F[4];
                else if (wn && ly === 0) c = F[4];
                else if (ww && lx === 0) c = F[4];
                else if (we && lx === 15) c = F[1];
              } else if (ws && ly === 15) c = F[0];
              cls[i] = PX.FLOOR;
              g[i] = c;
            }
          }
          continue;
        }

        if (v === WATER) {
          const wN = wetv(n);
          const wS = wetv(s);
          const wW = wetv(wv);
          const wE = wetv(ev);
          const dNW = wetv(t(cx - 1, cy - 1));
          const dNE = wetv(t(cx + 1, cy - 1));
          const dSW = wetv(t(cx - 1, cy + 1));
          const dSE = wetv(t(cx + 1, cy + 1));
          for (let ly = 0; ly < 16; ly++)
            for (let lx = 0; lx < 16; lx++) {
              const i = (y0 + ly) * w + x0 + lx;
              const eN = wN ? 99 : ly;
              const eS = wS ? 99 : 15 - ly;
              const eW = wW ? 99 : lx;
              const eE = wE ? 99 : 15 - lx;
              let e = Math.min(eN, eS, eW, eE);
              if (!dNW) e = Math.min(e, Math.max(lx, ly));
              if (!dNE) e = Math.min(e, Math.max(15 - lx, ly));
              if (!dSW) e = Math.min(e, Math.max(lx, 15 - ly));
              if (!dSE) e = Math.min(e, Math.max(15 - lx, 15 - ly));
              depth[i] = Math.min(e, 30);
              let c: Color;
              if (jawia) {
                const shadowed = eN < 3 || eW < 2 || (n === BRIDGE && ly < 3) || (wv === BRIDGE && lx < 2);
                if (shadowed) c = Wt[0];
                else if (eS === 0 || eE === 0) c = Wt[2];
                else if (nWater[i] > 0.66) c = waterLight;
                else if (nWater[i] < 0.28 && e > 4) c = waterDeep;
                else c = Wt[1];
                if (shadowed) depth[i] = 0;
              } else {
                // the abyss: a glowing lip, then nothing but dark and a few stars
                c = e === 0 ? G[2] : e === 1 ? Wt[3] : nBig[i] > 0.6 ? Wt[1] : Wt[0];
              }
              cls[i] = PX.WATER;
              still[i] = c;
              g[i] = c;
            }
          continue;
        }

        if (v === BRIDGE) {
          for (let ly = 0; ly < 16; ly++)
            for (let lx = 0; lx < 16; lx++) {
              const i = (y0 + ly) * w + x0 + lx;
              cls[i] = PX.BRIDGE;
              g[i] = F[1];
            }
          continue;
        }

        // ---- a wall (or the void): its face, the coping along its top, and what lies beyond
        const face = isFace(cx, cy);
        rects.length = 0;
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            const q = t(cx + dx, cy + dy);
            if (!solid(q)) rects.push(dx * 16, dx * 16 + 15, dy * 16, dy * 16 + 15);
            else if (isFace(cx + dx, cy + dy)) rects.push(dx * 16, dx * 16 + 15, dy * 16 + 4, dy * 16 + 15);
          }
        const wOpen = !solid(wv);
        const eOpen = !solid(ev);
        const outer = OUTER[cell(cx, cy)] === 1;
        const wFace = isFace(cx - 1, cy);
        const eFace = isFace(cx + 1, cy);
        for (let ly = 0; ly < 16; ly++) {
          const Y = oy + y0 + ly;
          for (let lx = 0; lx < 16; lx++) {
            const X = ox + x0 + lx;
            const i = (y0 + ly) * w + x0 + lx;
            let c: Color;
            if (face && ly >= 4) {
              // the face: two courses of ashlar of unequal width, and a plinth
              cls[i] = PX.FACE;
              const fy = ly - 4;
              if (fy >= 10) {
                const lane = gcy * 2 + 7;
                let k = Math.floor(X / 13);
                if (X < faceJoint(k, lane)) k--;
                const joint = X === faceJoint(k, lane);
                c = jawia ? (fy === 10 ? (joint ? S[1] : S[3]) : S[1]) : fy === 10 ? S[1] : G[0];
              } else {
                const course = fy < 5 ? 0 : 1;
                const br = fy - course * 5;
                const lane = gcy * 2 + course;
                let k = Math.floor(X / 13);
                let j0 = faceJoint(k, lane);
                if (X < j0) j0 = faceJoint(--k, lane);
                const j1 = faceJoint(k + 1, lane);
                const bh = hash2(k, lane, 34);
                if (X === j0 || br === 4) {
                  c = jawia ? S[0] : hash2(X >> 2, lane, 35) % 6 === 0 ? G[1] : G[0];
                } else if (jawia) {
                  const idx = FACE_TONE_J[bh & 3];
                  const top = br === 0 || X === j0 + 1;
                  const bot = br === 3 || X === j1 - 1;
                  c = top ? S[idx + 1] : bot ? S[idx - 1] : S[idx];
                  if (course === 1) c = mix(c, S[0], 0.14);
                } else {
                  const idx = FACE_TONE_N[bh & 3];
                  c = br === 0 ? S[idx + 1] : S[idx];
                  if (course === 1) c = mix(c, S[0], 0.2);
                }
                if (fy === 0) c = mix(c, S[0], 0.45); // the coping's shadow
              }
              // where the face ends: lit on the left, dark on the right, occluded where it meets another wall
              if (wOpen) { if (lx === 0) c = jawia ? S[5] : p.rim[2]; else if (lx === 1) c = mix(c, jawia ? S[5] : p.rim[1], 0.35); }
              else if (!wFace && lx < 3) c = mix(c, black, FACE_END_AO[lx]);
              if (eOpen) { if (lx === 15) c = jawia ? S[0] : p.rim[1]; }
              else if (!eFace && lx > 12) c = mix(c, black, FACE_END_AO[15 - lx]);
              g[i] = c;
              continue;
            }
            // the coping: Chebyshev distance to the nearest thing that can be seen past this wall top
            let d = 99;
            let facing = 0; // 0: faces the light (north, west), 1: faces away (east), 2: the arris above a face
            let along = 0; // 0: the coping runs left-right, 1: up-down
            for (let r = 0; r < rects.length; r += 4) {
              const rx0 = rects[r];
              const rx1 = rects[r + 1];
              const ry0 = rects[r + 2];
              const gx = lx < rx0 ? rx0 - lx : lx > rx1 ? lx - rx1 : 0;
              const gy = ly < ry0 ? ry0 - ly : ly > rects[r + 3] ? ly - rects[r + 3] : 0;
              const dd = Math.max(gx, gy) - 1;
              if (dd < d) {
                d = dd;
                if (gy >= gx && ly < ry0) { facing = 2; along = 0; }
                else if (gx > gy && lx < rx0) { facing = 1; along = 1; }
                else { facing = 0; along = gx > gy ? 1 : 0; }
              }
            }
            if (d < CAP || !outer) {
              cls[i] = PX.CAP;
              const lane = along ? (gcx0 + cx) * 3 + facing : gcy * 3 + facing;
              const s2 = along ? Y : X;
              const joint = d > 0 && d < CAP - 1 && capJoint(s2, lane);
              if (!outer && d >= CAP - 1) {
                // the top of a block standing on its own: stone all the way across
                const bx = Math.floor((X + (Math.floor(Y / 8) & 1) * 5) / 10);
                const edge = X === bx * 10 - (Math.floor(Y / 8) & 1) * 5 || (Y & 7) === 0;
                c = jawia ? (edge ? S[1] : (hash2(bx, Y >> 3, 36) & 1 ? S[3] : mix(S[2], S[3], 0.55))) : edge ? S[1] : S[2];
              } else if (jawia) {
                if (d === 0) c = facing === 1 ? S[1] : S[4];
                else if (d === CAP - 1) c = S[0];
                else if (joint) c = S[1];
                else {
                  const bk = hash2(Math.floor(s2 / 11), lane, 32);
                  c = bk & 1 ? S[3] : mix(S[2], S[3], 0.55);
                  if (d === 1) c = facing === 1 ? mix(c, S[1], 0.3) : mix(c, S[4], 0.3);
                }
              } else {
                c = d === 0 ? p.rim[2] : d === 1 ? p.rim[1] : d === CAP - 1 ? S[0] : joint ? S[1] : S[2];
              }
            } else if (jawia) {
              cls[i] = PX.BEYOND;
              // packed earth: quiet, so the rooms carry the picture
              c = nBig[i] > 0.55 ? p.top[1] : p.top[0];
              if (d === CAP) c = mix(c, black, 0.3);
              else if (hash2(X, Y, 23) % 173 === 0) c = p.top[2];
            } else {
              cls[i] = PX.BEYOND;
              c = nBig[i] > 0.64 ? p.top[1] : p.top[0];
              still[i] = c;
            }
            g[i] = c;
          }
        }
      }

    // ---- 4. things that lie on the floor (into the picture, so the shading falls on them too)
    const put = (x: number, y: number, c: Color): void => {
      if (x < 0 || y < 0 || x >= w || y >= h) return;
      g[y * w + x] = c;
      frozen[y * w + x] = 1;
    };
    const darken = (x: number, y: number, k: number): void => {
      if (x < 0 || y < 0 || x >= w || y >= h) return;
      g[y * w + x] = mix(g[y * w + x], black, k);
    };
    const floorAt = (x: number, y: number): boolean => x >= 0 && y >= 0 && x < w && y < h && cls[y * w + x] === PX.FLOOR;
    /** Extra shadow (contact shadows of props and rubble), multiplied in with the walls' own. */
    const keep = new Float32Array(N).fill(1);
    const shadowEllipse = (cx: number, cy: number, rx: number, ry: number, k: number): void => {
      for (let y = Math.max(0, Math.floor(cy - ry)); y <= Math.min(h - 1, Math.ceil(cy + ry)); y++)
        for (let x = Math.max(0, Math.floor(cx - rx)); x <= Math.min(w - 1, Math.ceil(cx + rx)); x++) {
          const nx = (x + 0.5 - cx) / rx;
          const ny = (y + 0.5 - cy) / ry;
          const d = nx * nx + ny * ny;
          if (d < 1) keep[y * w + x] *= 1 - k * (d < 0.45 ? 1 : 0.55);
        }
    };
    const glow = new Float32Array(N);
    const addGlow = (x: number, y: number, s: number): void => {
      if (x < 0 || y < 0 || x >= w || y >= h || s <= 0) return;
      const i = y * w + x;
      if (s > glow[i]) glow[i] = s;
    };
    const PEBBLES: Color[][][] = [[[R[3]]], [[R[4], R[3]]], [[R[4], R[3]], [R[3], R[2]]], [[R[4], R[4], R[3]], [R[3], R[2], R[2]]]];
    const pebble = (x: number, y: number, kind: number): void => {
      const sh = PEBBLES[kind & 3];
      for (let j = 0; j < sh.length; j++) for (let k = 0; k < sh[j].length; k++) put(x + k, y + j, sh[j][k]);
      for (let k = 0; k <= sh[0].length; k++) if (floorAt(x + k, y + sh.length)) darken(x + k, y + sh.length, 0.32);
    };
    /** A squarish broken stone, lit from the upper left. Pushes the outline pixels near its foot into `base`. */
    const stone = (cx: number, cy: number, rx: number, ry: number, mossy: boolean, base: number[]): void => {
      const inside = (x: number, y: number): boolean => {
        const nx = (x + 0.5 - cx) / rx;
        const ny = (y + 0.5 - cy) / ry;
        return Math.pow(Math.abs(nx), 2.6) + Math.pow(Math.abs(ny), 2.6) <= 1;
      };
      for (let y = Math.floor(cy - ry) - 1; y <= Math.ceil(cy + ry) + 1; y++)
        for (let x = Math.floor(cx - rx) - 1; x <= Math.ceil(cx + rx) + 1; x++) {
          if (!inside(x, y)) {
            if (inside(x - 1, y) || inside(x + 1, y) || inside(x, y - 1) || inside(x, y + 1)) {
              put(x, y, R[0]);
              if (y > cy + ry * 0.5) base.push(x, y);
            }
            continue;
          }
          const nx = (x + 0.5 - cx) / rx;
          const ny = (y + 0.5 - cy) / ry;
          const s = -(nx * 0.5 + ny * 0.9);
          let c = s > 0.62 ? R[5] : s > 0.3 ? R[4] : s > -0.25 ? R[3] : s > -0.7 ? R[2] : R[1];
          if (mossy && s > 0.3 && hash2(x, y, 92) % 3 !== 0) c = s > 0.62 ? G[3] : G[2];
          put(x, y, c);
        }
    };

    /** A fallen block of ashlar: its top (w x h) lit from the upper left, and 2 px of its front face. */
    const masonry = (x: number, y: number, bw: number, bh: number, mossy: boolean): void => {
      const fh = 2;
      for (let j = -1; j <= bh + fh; j++)
        for (let k = -1; k <= bw; k++) {
          const edge = j === -1 || j === bh + fh || k === -1 || k === bw;
          // knocked-off corners
          if ((j === -1 || j === bh + fh) && (k === -1 || k === bw)) continue;
          let c: Color;
          if (edge) c = R[0];
          else if (j >= bh) c = j === bh + fh - 1 ? R[1] : k === bw - 1 ? R[1] : R[2]; // the front face
          else if (j === 0 || k === 0) c = R[5];
          else if (k === bw - 1) c = R[3];
          else c = (k + j * 3 + bw) % 7 === 0 ? R[3] : R[4];
          if (mossy && j === 0 && k > 0 && k < bw - 1 && (k * 5 + bw) % 3 !== 0) c = G[2];
          put(x + k, y + j, c);
        }
    };

    for (let cy = 0; cy < rows; cy++)
      for (let cx = 0; cx < cols; cx++) {
        const v = t(cx, cy);
        const gcx = gcx0 + cx;
        const gcy = gcy0 + cy;
        const hs = hash2(gcx, gcy, 11);
        const x0 = cx * 16;
        const y0 = cy * 16;
        const dmpC = damp[Math.min(h - 1, y0 + 8) * w + x0 + 8];

        // ---- faces: moss, damp streaks, a niche, a rune, a window; a crack the other side shows through
        if (isFace(cx, cy)) {
          const torch = this.torchCells.has(cy * cols + cx);
          const below = Math.min(h - 1, y0 + 17) * w + x0 + 8;
          const wetBelow = Math.max(damp[below], clamp01((nDamp[(y0 + 8) * w + x0 + 8] - 0.4) / 0.25));
          if (jawia) {
            for (let lx = 0; lx < 16; lx++) {
              const X = ox + x0 + lx;
              const hl = hash2(X, gcy, 72);
              if (wetBelow > 0.45 && hl % 6 === 0) {
                const len = 2 + ((hl >>> 4) % 7);
                for (let k = 0; k < len; k++) darken(x0 + lx, y0 + 4 + k, 0.28);
              }
              // moss hangs from the coping in clumps, longest in the middle of a clump
              const clump = Math.floor((X + 3) / 7);
              const ch = hash2(clump, gcy, 74);
              const inClump = (X + 3) - clump * 7;
              if (wetBelow > 0.5 && ch % 100 < 70 * wetBelow && inClump > 0 && inClump < 6 && (hl >>> 8) % 4 !== 0) {
                const rnd = ((hl >>> 12) % 100) / 100;
                const len = 1 + Math.floor((3 - Math.abs(inClump - 3)) * (0.6 + rnd) * (1 + ((ch >>> 8) % 3)) * 0.6);
                put(x0 + lx, y0 + 2, G[2]);
                for (let k = 0; k < len; k++) put(x0 + lx, y0 + 3 + k, k === 0 ? G[3] : k === len - 1 ? G[1] : (hl >>> (k + 3)) & 1 ? G[2] : G[1]);
              }
            }
            if (torch) {
              // soot above the torch
              for (let y = 0; y < 8; y++) for (let x = 5; x < 11; x++) if ((x - 7.5) ** 2 / 9 + (y - 3) ** 2 / 16 < 1) darken(x0 + x, y0 + y, 0.25);
            } else if (hs % 29 === 0) this.tilePiece(ground, world, 'face_v3', 5, 4, 6, 9, x0 + 5, y0 + 4);
            else if (hs % 23 === 5) {
              // a breach: one block has fallen out
              for (let y = 9; y < 13; y++) for (let x = 5; x < 11; x++) put(x0 + x, y0 + y, y === 9 || x === 10 ? S[0] : S[1]);
              put(x0 + 6, y0 + 12, R[3]);
              put(x0 + 7, y0 + 12, R[2]);
              let x = 8;
              for (let y = 8; y > 3; y--) {
                put(x0 + x, y0 + y, S[0]);
                if ((hs >>> (y + 4)) & 1) x += (hs >>> y) & 2 ? 1 : -1;
              }
            }
          } else if (!torch) {
            if (hs % 7 === 0) {
              const r = RUNES[(hs >>> 4) % RUNES.length];
              const rx = x0 + 6 + ((hs >>> 8) % 3);
              for (let j = -1; j <= r.length; j++)
                for (let k = -1; k <= 3; k++) {
                  if (r[j]?.[k] === '#') put(rx + k, y0 + 5 + j, G[3]);
                  else ground.plot(rx + k, y0 + 5 + j, withAlpha(G[1], 70));
                }
            } else if (hs % 13 === 3) this.tilePiece(ground, world, 'face_v2', 5, 4, 6, 8, x0 + 5, y0 + 4);
            else if (hs % 17 === 7) this.tilePiece(ground, world, 'face_v3', 5, 4, 6, 9, x0 + 5, y0 + 4);
          }
          if (opening(cx, cy)) {
            // this wall is not there on the other side: a hairline crack up its face, lit from behind
            let x = 3 + ((hs >>> 6) % 10);
            const len = 6 + ((hs >>> 10) % 5);
            for (let k = 0; k < len; k++) {
              addGlow(x0 + x, y0 + 15 - k, 0.9 - (k / len) * 0.6);
              if (k % 2 === 1 && (hs >>> (k % 24)) & 1) x += (hs >>> (k + 5)) & 1 ? 1 : -1;
              x = Math.max(1, Math.min(14, x));
            }
          }
          continue;
        }
        if (v === BRIDGE) {
          // planks, from the tileset (they look the same whichever world laid them, on purpose)
          const n = t(cx, cy - 1);
          const s = t(cx, cy + 1);
          const wv = t(cx - 1, cy);
          const ev = t(cx + 1, cy);
          const ew = (wv === BRIDGE ? 1 : 0) + (ev === BRIDGE ? 1 : 0);
          const ns = (n === BRIDGE ? 1 : 0) + (s === BRIDGE ? 1 : 0);
          const horizontal = ew > ns || (ew === ns && (wv === FLOOR || ev === FLOOR || ns === 0));
          this.tilePiece(ground, world, horizontal ? 'deck_h' : 'deck_v', 0, 0, 16, 16, x0, y0);
          if (n === WATER) this.tilePiece(ground, world, 'rail_n', 0, 0, 16, 16, x0, y0);
          if (s === WATER) this.tilePiece(ground, world, 'rail_s', 0, 0, 16, 16, x0, y0);
          if (wv === WATER) this.tilePiece(ground, world, 'rail_w', 0, 0, 16, 16, x0, y0);
          if (ev === WATER) this.tilePiece(ground, world, 'rail_e', 0, 0, 16, 16, x0, y0);
          continue;
        }
        if (v === WATER) {
          const wet = (q: number): boolean => q === WATER || q === BRIDGE;
          if (jawia && wet(t(cx, cy - 1)) && wet(t(cx, cy + 1)) && wet(t(cx - 1, cy)) && wet(t(cx + 1, cy)) && (hs >>> 6) % 7 === 0) {
            const before = ground.sub(x0, y0, 16, 16);
            this.tilePiece(ground, world, hs & 1 ? 'lily0' : 'lily1', 0, 0, 16, 16, x0, y0);
            for (let y = 0; y < 16; y++)
              for (let x = 0; x < 16; x++) if (g[(y0 + y) * w + x0 + x] !== before.u32[y * 16 + x]) frozen[(y0 + y) * w + x0 + x] = 1;
          }
          continue;
        }
        if (!plainFloor(v)) continue;

        // ---- the floor where a wall still stands on the other side: its foundation, flush with the floor
        if (danger(cx, cy) && u(cx, cy) === WALL) {
          const fp = (x: number, y: number): boolean => danger(x, y) && u(x, y) === WALL;
          const fW = fp(cx - 1, cy);
          const fE = fp(cx + 1, cy);
          const fN = fp(cx, cy - 1);
          const fS = fp(cx, cy + 1);
          /** Is this pixel (cell-local) on top of a foundation stone? Stones are cut back raggedly where the wall ended. */
          const stoneAt = (lx: number, ly: number): boolean => {
            if (lx < 0) return fW;
            if (lx > 15) return fE;
            if (ly < 0) return fN;
            if (ly > 15) return fS;
            const ry = ly & 7;
            if (ry === 7) return false;
            const row = ly >> 3;
            const lane = gcy * 2 + row;
            const X = ox + x0 + lx;
            let k = Math.floor(X / 9);
            const j0 = footJoint(k, lane);
            if (X === j0) return false;
            if (X < j0) k--;
            const bh = hash2(k, lane, 82);
            if (bh % 7 === 0) return false; // a stone is missing
            if (!fW && lx < 1 + ((bh >>> 3) & 1)) return false;
            if (!fE && lx > 14 - ((bh >>> 4) & 1)) return false;
            if (!fN && row === 0 && ry < 1 + ((bh >>> 5) & 1)) return false;
            if (!fS && row === 1 && ry > 5 - ((bh >>> 6) & 1)) return false;
            return true;
          };
          for (let ly = 0; ly < 16; ly++)
            for (let lx = 0; lx < 16; lx++) {
              const i = (y0 + ly) * w + x0 + lx;
              const up = stoneAt(lx, ly - 1);
              const dn = stoneAt(lx, ly + 1);
              const lf = stoneAt(lx - 1, ly);
              const rt = stoneAt(lx + 1, ly);
              if (!stoneAt(lx, ly)) {
                if (up || dn || lf || rt) {
                  g[i] = mix(S[1], F[1], 0.55);
                  code[i] = SP.JOINT;
                }
                continue;
              }
              const X = ox + x0 + lx;
              const bh = hash2(Math.floor(X / 9), gcy * 2 + (ly >> 3), 82);
              const base = mix(S[2], F[3], 0.6 + (bh & 3) * 0.07);
              g[i] = !up || !lf ? mix(base, S[4], 0.25) : !dn || !rt ? mix(base, S[1], 0.3) : base;
              code[i] = SP.INNER;
            }
        }

        // ---- rubble: a heap of broken masonry and a rotten beam; the other side's light between the stones
        if (v === RUBBLE) {
          const rng = mulberry32(hash2(gcx, gcy, 91));
          shadowEllipse(x0 + 10, y0 + 14, 10, 4.2, 0.42);
          if (rng() < 0.4) {
            const flip = rng() < 0.5;
            for (let k = 0; k < 12; k++) {
              const x = x0 + (flip ? 14 - k : 2 + k);
              const y = y0 + 12 - Math.floor(k * 0.55);
              put(x, y, p.wood[3]);
              put(x, y + 1, p.wood[1]);
              put(x, y + 2, p.wood[0]);
            }
          }
          // a mound: the dark between the stones first, then the stones, the biggest at the bottom
          const mound = (x: number, y: number): boolean => {
            const nx = (x + 0.5 - 8) / 7.6;
            const ny = (y + 0.5 - 9) / (y < 9 ? 7.4 : 6.6);
            return nx * nx + ny * ny < 1 + (((hash2(gcx * 16 + x, gcy * 16 + y, 93) & 7) - 3.5) / 3.5) * 0.12;
          };
          for (let y = 0; y < 17; y++)
            for (let x = -1; x < 17; x++) {
              if (mound(x, y)) put(x0 + x, y0 + y, mix(R[1], R[2], 0.4));
              else if (mound(x, y - 1) || mound(x - 1, y) || mound(x + 1, y) || mound(x, y + 1)) put(x0 + x, y0 + y, R[0]);
            }
          const pieces: [number, number, number, number, number][] = []; // x, y, w|rx, h|ry, 1 = a squared block
          const blocks = Math.floor(rng() * 2.2);
          for (let k = 0; k < blocks; k++) {
            const bw = 5 + Math.floor(rng() * 3);
            const bh = 3 + Math.floor(rng() * 2);
            pieces.push([2 + Math.floor(rng() * (12 - bw)), 5 + Math.floor(rng() * (8 - bh)), bw, bh, 1]);
          }
          const n = 9 + Math.floor(rng() * 3);
          for (let k = 0; k < n; k++) {
            const sy = 2.5 + rng() * 11.5;
            const spread = 5 + (sy / 14) * 2.6;
            const sx = 8 + (rng() * 2 - 1) * spread;
            const big = 0.5 + sy / 28;
            pieces.push([sx, sy, (1.9 + rng() * 1.6) * big * 1.55, (1.5 + rng() * 1.1) * big * 1.45, 0]);
          }
          pieces.sort((a, b) => a[1] + (a[4] ? a[3] : 0) - (b[1] + (b[4] ? b[3] : 0)));
          const base: number[] = [];
          const mossy = dmpC > 0.5;
          for (const [sx, sy, a, b, isBlock] of pieces) {
            if (isBlock) masonry(x0 + sx, y0 + sy, a, b, mossy && rng() < 0.5);
            else stone(x0 + sx, y0 + sy, a, b, mossy && rng() < 0.6, base);
          }
          if (opening(cx, cy) && base.length) {
            for (let k = 0; k < 2; k++) {
              const j = 2 * Math.floor(rng() * (base.length / 2));
              addGlow(base[j], base[j + 1], 0.7);
            }
          }
          for (let k = 0; k < 4; k++) {
            const x = x0 - 2 + Math.floor(rng() * 20);
            const y = y0 + 13 + Math.floor(rng() * 5);
            if (floorAt(x, y) && t(x >> 4, y >> 4) !== RUBBLE) pebble(x, y, Math.floor(rng() * 3));
          }
        }
      }

    if (jawia) {
      // ---- chips and pebbles at the foot of the walls, in clusters
      for (let gj = Math.floor(oy / 5); gj * 5 < oy + h; gj++)
        for (let gi = Math.floor(ox / 6); gi * 6 < ox + w; gi++) {
          const hs = hash2(gi, gj, 101);
          const x = gi * 6 + (hs % 6) - ox;
          const y = gj * 5 + ((hs >>> 3) % 5) - oy;
          if (!floorAt(x, y)) continue;
          const i = y * w + x;
          const cx = x >> 4;
          const cy = y >> 4;
          if (orn(cx, cy) || busy(cx, cy) || t(cx, cy) === RUBBLE) continue;
          const d = dWall[i];
          if (d > 9) continue;
          const prob = (1 - d / 10) * 0.5 * (nFine[i] > 0.45 ? 1 : 0.25);
          if (((hs >>> 8) % 1000) / 1000 >= prob) continue;
          pebble(x, y, (hs >>> 18) % 4);
        }
      // ---- moss where the damp meets the wall
      for (let i = 0; i < N; i++) {
        if (cls[i] !== PX.FLOOR || frozen[i] || dWall[i] > 4.5 || damp[i] < 0.5) continue;
        const x = i % w;
        const y = (i - x) / w;
        if (orn(x >> 4, y >> 4) || busy(x >> 4, y >> 4)) continue;
        const m = nFine[i] * 0.75 + (1 - dWall[i] / 5) * 0.45 + (damp[i] - 0.5) * 0.5;
        if (m > 0.98) g[i] = m > 1.16 ? (hash2(x, y, 24) % 5 === 0 ? G[3] : G[2]) : G[1];
      }
      // ---- puddles, where it is wettest
      for (let cy = 0; cy < rows; cy++)
        for (let cx = 0; cx < cols; cx++) {
          if (t(cx, cy) !== FLOOR || orn(cx, cy) || busy(cx, cy) || danger(cx, cy)) continue;
          const hs = hash2(gcx0 + cx, gcy0 + cy, 111);
          const pcx = cx * 16 + 3 + (hs % 10);
          const pcy = cy * 16 + 4 + ((hs >>> 4) % 9);
          const ci = pcy * w + pcx;
          if (damp[ci] < 0.62 || hs % 4 !== 0 || dWater[ci] < 5) continue;
          const rx = 2.6 + ((hs >>> 8) % 4) * 0.9;
          const ry = 1.3 + ((hs >>> 12) % 3) * 0.5;
          const inP = (x: number, y: number): number => {
            const nx = (x + 0.5 - pcx) / rx;
            const ny = (y + 0.5 - pcy) / ry;
            return nx * nx + ny * ny + (nFine[Math.max(0, Math.min(N - 1, y * w + x))] - 0.5) * 0.6;
          };
          for (let y = Math.floor(pcy - ry - 2); y <= pcy + ry + 2; y++)
            for (let x = Math.floor(pcx - rx - 2); x <= pcx + rx + 2; x++) {
              if (!floorAt(x, y)) continue;
              const d = inP(x, y);
              if (d < 1) put(x, y, inP(x, y - 1) >= 1 ? Wt[0] : Wt[1]);
              else if (d < 1.5) g[y * w + x] = mix(g[y * w + x], WET, 0.45);
            }
          const gx = Math.round(pcx - rx * 0.35);
          const gy = Math.round(pcy - ry * 0.1);
          if (inP(gx, gy) < 1) {
            put(gx, gy, Wt[4]);
            if (inP(gx + 1, gy) < 1) put(gx + 1, gy, Wt[3]);
          }
        }
      // ---- a few cracked slabs, mostly near the walls
      for (let cy = 0; cy < rows; cy++)
        for (let cx = 0; cx < cols; cx++) {
          if (t(cx, cy) !== FLOOR || orn(cx, cy) || busy(cx, cy) || danger(cx, cy)) continue;
          const hs = hash2(gcx0 + cx, gcy0 + cy, 121);
          if (hs % 5 !== 0 || dWall[(cy * 16 + 8) * w + cx * 16 + 8] > 26) continue;
          const rng = mulberry32(hs);
          let x = cx * 16 + 2 + Math.floor(rng() * 12);
          let y = cy * 16 + 2 + Math.floor(rng() * 12);
          const horizontal = rng() < 0.5;
          const len = 4 + Math.floor(rng() * 7);
          for (let k = 0; k < len; k++) {
            if (!floorAt(x, y)) break;
            put(x, y, mix(F[1], F[0], 0.4));
            if (rng() < 0.4 && floorAt(x + 1, y + 1)) g[(y + 1) * w + x + 1] = mix(g[(y + 1) * w + x + 1], F[4], 0.25);
            if (horizontal) { x++; if (rng() < 0.4) y += rng() < 0.5 ? 1 : -1; }
            else { y++; if (rng() < 0.4) x += rng() < 0.5 ? 1 : -1; }
          }
        }
    }

    // ---- 5. the cracks the other world shows through: along the joints of a cell that is solid over there
    for (let cy = 0; cy < rows; cy++)
      for (let cx = 0; cx < cols; cx++) {
        if (!danger(cx, cy)) continue;
        for (let ly = -2; ly < 18; ly++)
          for (let lx = -2; lx < 18; lx++) {
            const x = cx * 16 + lx;
            const y = cy * 16 + ly;
            if (!floorAt(x, y) || code[y * w + x] !== SP.JOINT) continue;
            const dd = Math.max(Math.abs(lx - 7.5), Math.abs(ly - 7.5)) / 8;
            if (hash2((ox + x) >> 2, (oy + y) >> 2, 132) % 5 < 3) addGlow(x, y, clamp01(1.45 - dd * 1.55));
          }
        // and a few hairlines across the stones, branching off the joints
        const rng = mulberry32(hash2(gcx0 + cx, gcy0 + cy, 131));
        for (let b = 0; b < 2; b++) {
          let x = 0;
          let y = 0;
          let found = false;
          for (let tries = 0; tries < 14 && !found; tries++) {
            x = cx * 16 + 2 + Math.floor(rng() * 12);
            y = cy * 16 + 2 + Math.floor(rng() * 12);
            found = floorAt(x, y) && code[y * w + x] === SP.JOINT;
          }
          if (!found) continue;
          const alongX = code[y * w + x - 1] === SP.JOINT || code[y * w + x + 1] === SP.JOINT;
          const dir = rng() < 0.5 ? 1 : -1;
          const len = 4 + Math.floor(rng() * 6);
          for (let k = 1; k <= len; k++) {
            if (alongX) { y += dir; if (rng() < 0.45) x += rng() < 0.5 ? 1 : -1; }
            else { x += dir; if (rng() < 0.45) y += rng() < 0.5 ? 1 : -1; }
            if (!floorAt(x, y)) break;
            addGlow(x, y, 0.85 - (k / len) * 0.6);
            if (k === 2 && rng() < 0.4) {
              let bx = x;
              let by = y;
              for (let q = 0; q < 3; q++) {
                if (alongX) bx += dir;
                else by += dir;
                addGlow(bx, by, 0.4 - q * 0.1);
              }
            }
          }
        }
      }

    // ---- 6. shading: walls throw shadows down and to the right, props and rubble sit in their own
    for (const o of room.objects) {
      const sz = PROP_SHADOW[o.kind];
      if (!sz) continue;
      shadowEllipse(o.tx * 16 + 8 + (jawia ? 2 : 0), o.ty * 16 + 15, sz[0], sz[1], jawia ? 0.5 : 0.36);
    }
    const aoK = jawia ? 1 : 0.8;
    const shadeQ = new Float32Array(N);
    for (let cy = 0; cy < rows; cy++)
      for (let cx = 0; cx < cols; cx++) {
        const v = t(cx, cy);
        if (solid(v)) continue;
        const sN = solid(t(cx, cy - 1));
        const sW = solid(t(cx - 1, cy));
        const sE = solid(t(cx + 1, cy));
        const sS = solid(t(cx, cy + 1));
        const cNW = !sN && !sW && solid(t(cx - 1, cy - 1));
        const cNE = !sN && !sE && solid(t(cx + 1, cy - 1));
        const cSW = !sS && !sW && solid(t(cx - 1, cy + 1));
        const cSE = !sS && !sE && solid(t(cx + 1, cy + 1));
        const x0 = cx * 16;
        const y0 = cy * 16;
        for (let ly = 0; ly < 16; ly++)
          for (let lx = 0; lx < 16; lx++) {
            const i = (y0 + ly) * w + x0 + lx;
            let kp = keep[i];
            // the edge of a shadow wanders a pixel along the wall, never across it
            if (sN) kp *= 1 - band(AO_N, ly + wobble(ox + x0 + lx, gcy0 + cy, 1)) * aoK;
            if (sW) kp *= 1 - band(AO_W, lx + wobble(oy + y0 + ly, gcx0 + cx, 2)) * aoK;
            if (sE) kp *= 1 - band(AO_E, 15 - lx) * aoK;
            if (sS) kp *= 1 - band(AO_S, 15 - ly) * aoK;
            if (cNW) kp *= 1 - band(AO_C, Math.max(lx, ly)) * aoK;
            if (cNE) kp *= 1 - band(AO_C, Math.max(15 - lx, ly)) * aoK;
            if (cSW) kp *= 1 - band(AO_C, Math.max(lx, 15 - ly)) * aoK;
            if (cSE) kp *= 1 - band(AO_C, Math.max(15 - lx, 15 - ly)) * aoK;
            const q = Math.min(0.72, Math.round((1 - kp) * 7) / 7);
            shadeQ[i] = q;
            if (q > 0) g[i] = mix(g[i], SHADOW, q);
          }
      }

    // ---- 7. cobwebs in the upper corners (Jawia), then the light from the other side
    if (jawia)
      for (let cy = 0; cy < rows; cy++)
        for (let cx = 0; cx < cols; cx++) {
          if (t(cx, cy) !== FLOOR || orn(cx, cy) || busy(cx, cy) || !solid(t(cx, cy - 1))) continue;
          if ((hash2(gcx0 + cx, gcy0 + cy, 11) >>> 3) % 3 === 0) continue;
          if (solid(t(cx - 1, cy))) this.tilePiece(ground, world, 'cobweb_nw', 0, 0, 16, 16, cx * 16, cy * 16);
          else if (solid(t(cx + 1, cy))) this.tilePiece(ground, world, 'cobweb_ne', 0, 0, 16, 16, cx * 16, cy * 16);
        }
    const halo = mix(glowCol, black, 0.55);
    for (let i = 0; i < N; i++) {
      const s = glow[i];
      if (s < 0.08) continue;
      g[i] = mix(g[i], glowCol, s > 0.66 ? 0.62 : s > 0.36 ? 0.42 : 0.24);
      if (s > 0.78) {
        const x = i % w;
        for (let q = 0; q < 4; q++) {
          const j = q === 0 ? i - 1 : q === 1 ? i + 1 : q === 2 ? i - w : i + w;
          if (j < 0 || j >= N || Math.abs((j % w) - x) > 1 || glow[j] >= 0.08 || cls[j] !== PX.FLOOR) continue;
          g[j] = mix(g[j], halo, 0.22);
        }
      }
    }

    // ---- 8. what moves: water and its glints in Jawia, the abyss and the stars beyond the walls in Nawia
    const moving: number[] = [];
    for (let i = 0; i < N; i++) {
      if (frozen[i]) continue;
      if (cls[i] === PX.WATER || (!jawia && cls[i] === PX.BEYOND)) moving.push(i);
    }
    const target = this.buffers[world];
    if (moving.length === 0) {
      target.u32.set(g);
      return;
    }
    // Only a few of the moving pixels ever change: find them once, with the colour they take in each frame.
    const shaded = (c: Color, i: number): Color => (shadeQ[i] > 0 ? mix(c, SHADOW, shadeQ[i]) : c);
    const lively: number[] = []; // pixel index, then its colour in frames 0..3
    for (const i of moving) {
      const X = ox + (i % w);
      const Y = oy + Math.floor(i / w);
      const water = cls[i] === PX.WATER;
      const base = shaded(still[i], i);
      g[i] = base;
      if (jawia) {
        if (depth[i] < 2) continue;
        // wavelets that breathe
        const gi = Math.floor(X / 13);
        const gj = Math.floor(Y / 7);
        const hs = hash2(gi, gj, 31);
        if (hs % 5 >= 2) continue;
        const ax = gi * 13 + 2 + ((hs >>> 4) % 5);
        const ay = gj * 7 + 1 + ((hs >>> 8) % 5);
        if (Y !== ay || X < ax || X >= ax + 6) continue;
        lively.push(i);
        for (let f = 0; f < 4; f++) lively.push(X < ax + WAVELET[(f + (hs >>> 12)) & 3] ? shaded(X < ax + 1 ? Wt[4] : Wt[3], i) : base);
      } else {
        if (water && depth[i] < 2) continue;
        const hs = hash2(X, Y, water ? 9 : 17);
        if (hs % (water ? 71 : 79) === 0) {
          // a star, twinkling
          lively.push(i);
          for (let f = 0; f < 4; f++) {
            const tw = ((hs >>> 8) + f) & 3;
            lively.push(shaded(tw === 0 ? Wt[5] : tw === 2 ? p.top[3] : Wt[4], i));
          }
        } else if (hs % 157 === 1) g[i] = shaded(p.top[2], i); // a faint one that keeps still
      }
    }
    if (lively.length === 0) {
      target.u32.set(g);
      return;
    }
    const frames: PixelBuffer[] = [];
    for (let f = 0; f < 4; f++) {
      const b = ground.clone();
      for (let k = 0; k < lively.length; k += 5) b.u32[lively[k]] = lively[k + 1 + f];
      frames.push(b);
    }
    this.frames[world] = frames;
    target.u32.set(frames[0].u32);
  }
}
