// Turns a RoomDef into two pictures (one per world) by stamping tiles from the tilesets.
// Pure pixel code: used by the game (-> canvas texture) and by tools (-> PNG previews).

import { SCREEN_COLS, SCREEN_ROWS, TILE, WORLDS, otherWorld, type World } from '../config.ts';
import { PixelBuffer } from '../core/PixelBuffer.ts';
import { hash2 } from '../core/rng.ts';
import { TILESET_COLS, TILE_INDEX, type TileName } from '../art/tiles.ts';
import { PAL } from '../art/palette.ts';
import { TERRAIN, type Dungeon, type RoomDef } from './roomFormat.ts';

const { VOID, FLOOR, WALL, WATER, BRIDGE, RUBBLE } = TERRAIN;

const FLOOR_PICK: TileName[] = [
  'floor0', 'floor0', 'floor0', 'floor0', 'floor0', 'floor0', 'floor0', 'floor1', 'floor1', 'floor2', 'floor2',
  'floor3', 'floor3', 'floor5', 'floor5', 'floor6', 'floor6', 'floor0', 'floor0', 'floor4', 'floor7', 'floor0',
];
const DECOR_PICK: TileName[] = ['decor0', 'decor1', 'decor2', 'decor2', 'decor0', 'decor4', 'decor2', 'decor3'];

export class RoomPainter {
  readonly room: RoomDef;
  readonly w: number;
  readonly h: number;
  readonly buffers: Record<World, PixelBuffer>;
  /** Cells that animate (water), per world. */
  readonly animated: Record<World, number[]> = { jawia: [], nawia: [] };

  private readonly dungeon: Dungeon;
  private readonly tilesets: Record<World, PixelBuffer>;
  private readonly torchCells = new Set<number>();

  constructor(room: RoomDef, dungeon: Dungeon, tilesets: Record<World, PixelBuffer>) {
    this.room = room;
    this.dungeon = dungeon;
    this.tilesets = tilesets;
    this.w = room.cols * TILE;
    this.h = room.rows * TILE;
    this.buffers = { jawia: new PixelBuffer(this.w, this.h), nawia: new PixelBuffer(this.w, this.h) };
    for (const o of room.objects) if (o.kind === 'torch') this.torchCells.add(o.ty * room.cols + o.tx);
    for (const world of WORLDS) {
      for (let y = 0; y < room.rows; y++)
        for (let x = 0; x < room.cols; x++) {
          if (room.terrain[world][y * room.cols + x] === WATER) this.animated[world].push(y * room.cols + x);
          this.paintCell(world, x, y, 0);
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

  private stamp(world: World, name: TileName, x: number, y: number): void {
    const i = TILE_INDEX[name];
    this.buffers[world].blit(
      this.tilesets[world], x * TILE, y * TILE,
      (i % TILESET_COLS) * TILE, Math.floor(i / TILESET_COLS) * TILE, TILE, TILE,
    );
  }

  paintCell(world: World, x: number, y: number, frame: number): void {
    const r = this.room;
    const buf = this.buffers[world];
    const t = this.at(world, x, y);
    const n = this.at(world, x, y - 1);
    const s = this.at(world, x, y + 1);
    const w = this.at(world, x - 1, y);
    const e = this.at(world, x + 1, y);
    const there = this.at(otherWorld(world), x, y);
    // hashes use dungeon-global coordinates so patterns do not repeat from room to room
    const gx = r.gx * SCREEN_COLS + x;
    const gy = r.gy * SCREEN_ROWS + y;
    const h = hash2(gx, gy, 11);
    const isWall = (v: number): boolean => v === WALL || v === VOID;
    const isFace = (cx: number, cy: number): boolean =>
      this.at(world, cx, cy) === WALL && !isWall(this.at(world, cx, cy + 1));

    switch (t) {
      case VOID: {
        buf.rect(x * TILE, y * TILE, TILE, TILE, PAL[world].outline);
        break;
      }
      case FLOOR:
      case RUBBLE: {
        this.stamp(world, t === RUBBLE ? 'floor0' : FLOOR_PICK[h % FLOOR_PICK.length], x, y);
        if (t === FLOOR) {
          if (world === 'jawia' && r.debris[y * r.cols + x]) this.stamp(world, h % 2 ? 'debris0' : 'debris1', x, y);
          else if ((h >>> 8) % 15 === 0) this.stamp(world, DECOR_PICK[(h >>> 12) % DECOR_PICK.length], x, y);
        }
        if (n === WALL || n === RUBBLE) this.stamp(world, 'shadow_n', x, y);
        if (w === WALL || w === RUBBLE) this.stamp(world, 'shadow_w', x, y);
        if (e === WALL || e === RUBBLE) this.stamp(world, 'shadow_e', x, y);
        if (s === WALL) this.stamp(world, 'shadow_s', x, y);
        if (t === RUBBLE) this.stamp(world, h % 2 ? 'rubble0' : 'rubble1', x, y);
        else if (there === WALL || there === RUBBLE) this.stamp(world, 'echo_solid', x, y);
        break;
      }
      case WALL: {
        if (!isWall(s)) {
          // we can see this wall's face
          const torch = this.torchCells.has(y * r.cols + x);
          const v = (h >>> 4) % 10;
          this.stamp(world, torch ? 'face0' : v < 6 ? 'face0' : v < 9 ? 'face1' : 'face2', x, y);
          if (!isWall(w)) this.stamp(world, 'face_end_w', x, y);
          else if (!isFace(x - 1, y)) this.stamp(world, 'face_ao_w', x, y);
          if (!isWall(e)) this.stamp(world, 'face_end_e', x, y);
          else if (!isFace(x + 1, y)) this.stamp(world, 'face_ao_e', x, y);
          if (!isWall(n)) this.stamp(world, 'face_cap_n', x, y);
        } else {
          this.stamp(world, h % 3 ? 'top0' : 'top1', x, y);
          if (!isWall(n)) this.stamp(world, 'rim_n', x, y);
          if (!isWall(w)) this.stamp(world, 'rim_w', x, y);
          else if (isFace(x - 1, y)) this.stamp(world, 'rim_w_low', x, y);
          if (!isWall(e)) this.stamp(world, 'rim_e', x, y);
          else if (isFace(x + 1, y)) this.stamp(world, 'rim_e_low', x, y);
          if (isWall(n) && isWall(w) && !isWall(this.at(world, x - 1, y - 1))) this.stamp(world, 'corner_nw', x, y);
          if (isWall(n) && isWall(e) && !isWall(this.at(world, x + 1, y - 1))) this.stamp(world, 'corner_ne', x, y);
        }
        break;
      }
      case WATER: {
        this.stamp(world, (['water0', 'water1', 'water2', 'water3'] as const)[(frame + (gx + gy)) & 3], x, y);
        const wet = (v: number): boolean => v === WATER || v === BRIDGE;
        if (n === BRIDGE) this.stamp(world, 'shadow_n', x, y);
        else if (!wet(n)) this.stamp(world, 'shore_n', x, y);
        if (!wet(w)) this.stamp(world, 'shore_w', x, y);
        if (!wet(e)) this.stamp(world, 'shore_e', x, y);
        if (!wet(s)) this.stamp(world, 'shore_s', x, y);
        if (there === BRIDGE) this.stamp(world, 'echo_bridge', x, y);
        break;
      }
      case BRIDGE: {
        const ew = (w === BRIDGE ? 1 : 0) + (e === BRIDGE ? 1 : 0);
        const ns = (n === BRIDGE ? 1 : 0) + (s === BRIDGE ? 1 : 0);
        const horizontal = ew > ns || (ew === ns && (w === FLOOR || e === FLOOR || ns === 0));
        this.stamp(world, horizontal ? 'deck_h' : 'deck_v', x, y);
        if (n === WATER) this.stamp(world, 'rail_n', x, y);
        if (s === WATER) this.stamp(world, 'rail_s', x, y);
        if (w === WATER) this.stamp(world, 'rail_w', x, y);
        if (e === WATER) this.stamp(world, 'rail_e', x, y);
        break;
      }
    }
  }
}
