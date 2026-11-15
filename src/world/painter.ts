// One interface for "a room as pictures", and the choice of who paints it:
// the stronghold is stamped from a tileset (RoomPainter), the surface is painted (SurfacePainter).

import { TILE, WORLDS, otherWorld, type World } from '../config.ts';
import { PixelBuffer } from '../core/PixelBuffer.ts';
import { TILESET_COLS, TILE_INDEX, type TileName } from '../art/tiles.ts';
import { RoomPainter } from './roomPainter.ts';
import { TERRAIN, isSurface, isWalkable, type Dungeon, type RoomDef } from './roomFormat.ts';
import { SurfacePainter } from './surfacePainter.ts';

export interface RoomPicture {
  readonly w: number;
  readonly h: number;
  /** The room as seen in each world. */
  readonly buffers: Record<World, PixelBuffer>;
  /** What is drawn above the hero (tree crowns, roof ridges), or null if the room has nothing overhead. */
  readonly overhead: Record<World, PixelBuffer> | null;
  /** What you cannot stand on in the *other* world, drawn over cells you can stand on here. */
  readonly echo: Record<World, PixelBuffer>;
  /** Repaints whatever moves (water, stars) with the given frame, 0..3. */
  animate(frame: number): void;
}

/** The afterimage layer: the same for every kind of room. */
export function paintEcho(room: RoomDef, tilesets: Record<World, PixelBuffer>): Record<World, PixelBuffer> {
  const w = room.cols * TILE;
  const h = room.rows * TILE;
  const echo = { jawia: new PixelBuffer(w, h), nawia: new PixelBuffer(w, h) };
  const stamp = (world: World, name: TileName, x: number, y: number): void => {
    const i = TILE_INDEX[name];
    echo[world].blit(tilesets[world], x * TILE, y * TILE, (i % TILESET_COLS) * TILE, Math.floor(i / TILESET_COLS) * TILE, TILE, TILE);
  };
  for (const world of WORLDS)
    for (let y = 0; y < room.rows; y++)
      for (let x = 0; x < room.cols; x++) {
        const here = room.terrain[world][y * room.cols + x];
        const there = room.terrain[otherWorld(world)][y * room.cols + x];
        if (isWalkable(here) && !isWalkable(there)) stamp(world, 'echo_solid', x, y);
        else if (!isWalkable(here) && there === TERRAIN.BRIDGE) stamp(world, 'echo_bridge', x, y);
      }
  return echo;
}

export function paintRoom(room: RoomDef, dungeon: Dungeon, tilesets: Record<World, PixelBuffer>): RoomPicture {
  if (isSurface(room.biome)) return new SurfacePainter(room, dungeon, paintEcho(room, tilesets));
  return new RoomPainter(room, dungeon, tilesets);
}
