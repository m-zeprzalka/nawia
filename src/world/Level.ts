// Runtime collision for the whole dungeon, in both worlds at once.
// Pure logic (no Phaser): positions are global pixels, boxes are centre + half extents.

import { SCREEN_COLS, SCREEN_ROWS, TILE, WORLDS, type World } from '../config.ts';
import { Dungeon, TERRAIN, type RoomDef } from './roomFormat.ts';

export const BLOCK_WALK = 1;
export const BLOCK_FLY = 2;

function terrainBlock(t: number): number {
  switch (t) {
    case TERRAIN.FLOOR:
    case TERRAIN.BRIDGE:
      return 0;
    case TERRAIN.WATER:
      return BLOCK_WALK;
    default:
      return BLOCK_WALK | BLOCK_FLY;
  }
}

export interface Box {
  x: number;
  y: number;
  hw: number;
  hh: number;
}

export const overlap = (a: Box, b: Box): boolean =>
  Math.abs(a.x - b.x) < a.hw + b.hw && Math.abs(a.y - b.y) < a.hh + b.hh;

export class Level {
  readonly dungeon: Dungeon;
  private readonly grids = new Map<string, Record<World, Uint8Array>>();

  constructor(dungeon: Dungeon) {
    this.dungeon = dungeon;
    for (const room of dungeon.rooms) {
      const grid = { jawia: new Uint8Array(room.cols * room.rows), nawia: new Uint8Array(room.cols * room.rows) };
      for (const w of WORLDS) for (let i = 0; i < grid[w].length; i++) grid[w][i] = terrainBlock(room.terrain[w][i]);
      this.grids.set(room.id, grid);
      // things that stand on the floor block both worlds
      for (const o of room.objects)
        if (o.kind === 'brazier' || o.kind === 'sign' || o.kind === 'bell' || o.kind === 'gate') this.setBlocked(room, o.tx, o.ty, true);
    }
  }

  /** Block or free a tile in both worlds (gates, props). Coordinates are room-local tiles. */
  setBlocked(room: RoomDef, tx: number, ty: number, blocked: boolean): void {
    const grid = this.grids.get(room.id)!;
    for (const w of WORLDS) {
      const base = terrainBlock(room.terrain[w][ty * room.cols + tx]);
      grid[w][ty * room.cols + tx] = blocked ? BLOCK_WALK | BLOCK_FLY : base;
    }
  }

  /** Block flags of a global tile. Outside every room everything is solid. */
  blockAt(world: World, gtx: number, gty: number): number {
    const room = this.dungeon.roomAtTile(gtx, gty);
    if (!room) return BLOCK_WALK | BLOCK_FLY;
    return this.grids.get(room.id)![world][(gty - room.gy * SCREEN_ROWS) * room.cols + (gtx - room.gx * SCREEN_COLS)];
  }

  /** Does a box overlap anything that blocks `mask`? */
  blocked(world: World, x: number, y: number, hw: number, hh: number, mask = BLOCK_WALK): boolean {
    const x0 = Math.floor((x - hw) / TILE);
    const x1 = Math.floor((x + hw - 0.001) / TILE);
    const y0 = Math.floor((y - hh) / TILE);
    const y1 = Math.floor((y + hh - 0.001) / TILE);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (this.blockAt(world, tx, ty) & mask) return true;
    return false;
  }

  /** Global tiles overlapped by a box that block `mask` (used to show *why* a shift was refused). */
  blockingTiles(world: World, x: number, y: number, hw: number, hh: number, mask = BLOCK_WALK): [number, number][] {
    const out: [number, number][] = [];
    const x0 = Math.floor((x - hw) / TILE);
    const x1 = Math.floor((x + hw - 0.001) / TILE);
    const y0 = Math.floor((y - hh) / TILE);
    const y1 = Math.floor((y + hh - 0.001) / TILE);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (this.blockAt(world, tx, ty) & mask) out.push([tx, ty]);
    return out;
  }

  /**
   * Moves a box by (dx, dy), one axis at a time, stopping flush against whatever blocks it.
   * Returns which axes were stopped.
   */
  move(world: World, box: Box, dx: number, dy: number, mask = BLOCK_WALK): { hitX: boolean; hitY: boolean } {
    let hitX = false;
    let hitY = false;
    if (dx !== 0) {
      let nx = box.x + dx;
      if (this.blocked(world, nx, box.y, box.hw, box.hh, mask)) {
        hitX = true;
        nx = dx > 0 ? Math.floor((nx + box.hw) / TILE) * TILE - box.hw : (Math.floor((nx - box.hw) / TILE) + 1) * TILE + box.hw;
        if (this.blocked(world, nx, box.y, box.hw, box.hh, mask) || (nx - box.x) * dx < 0) nx = box.x;
      }
      box.x = nx;
    }
    if (dy !== 0) {
      let ny = box.y + dy;
      if (this.blocked(world, box.x, ny, box.hw, box.hh, mask)) {
        hitY = true;
        ny = dy > 0 ? Math.floor((ny + box.hh) / TILE) * TILE - box.hh : (Math.floor((ny - box.hh) / TILE) + 1) * TILE + box.hh;
        if (this.blocked(world, box.x, ny, box.hw, box.hh, mask) || (ny - box.y) * dy < 0) ny = box.y;
      }
      box.y = ny;
    }
    return { hitX, hitY };
  }

  /**
   * Finds the smallest nudge (up to `max` px) that makes a box fit in `world`.
   * Returns null if there is no room nearby.
   */
  findFree(world: World, x: number, y: number, hw: number, hh: number, max: number, mask = BLOCK_WALK): { x: number; y: number } | null {
    if (!this.blocked(world, x, y, hw, hh, mask)) return { x, y };
    for (let d = 1; d <= max; d++)
      for (const [ox, oy] of [[d, 0], [-d, 0], [0, d], [0, -d], [d, d], [-d, d], [d, -d], [-d, -d]])
        if (!this.blocked(world, x + ox, y + oy, hw, hh, mask)) return { x: x + ox, y: y + oy };
    return null;
  }
}

export const roomOriginX = (r: RoomDef): number => r.gx * SCREEN_COLS * TILE;
export const roomOriginY = (r: RoomDef): number => r.gy * SCREEN_ROWS * TILE;
