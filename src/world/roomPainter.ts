// Turns a RoomDef into pictures by stamping tiles from the tilesets: one picture per world,
// plus one "echo" layer per world (the afterimage of what is solid on the other side).
// Pure pixel code: used by the game (-> canvas textures) and by tools (-> PNG previews).

import { SCREEN_COLS, SCREEN_ROWS, TILE, WORLDS, otherWorld, type World } from '../config.ts';
import { PixelBuffer } from '../core/PixelBuffer.ts';
import { hash2 } from '../core/rng.ts';
import { TILESET_COLS, TILE_INDEX, type TileName } from '../art/tiles.ts';
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
