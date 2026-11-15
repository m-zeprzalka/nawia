// The room text format. One file = one room = BOTH worlds at once.
// See docs/ROOMS.md for the full legend; the short version lives in LEGEND below.
//
// This module is pure TypeScript (no Phaser, no DOM) so tools can use it too.

import { SCREEN_COLS, SCREEN_ROWS, type World } from '../config.ts';

export const TERRAIN = {
  VOID: 0,
  FLOOR: 1,
  WALL: 2,
  WATER: 3,
  BRIDGE: 4,
  RUBBLE: 5,
} as const;
export type Terrain = (typeof TERRAIN)[keyof typeof TERRAIN];

export const isWalkable = (t: number): boolean => t === TERRAIN.FLOOR || t === TERRAIN.BRIDGE;

export type Bilingual = { pl: string; en: string };

export type EnemyKind = 'utopiec' | 'zjawa' | 'ognik' | 'strzyga';

export type ObjectDef =
  | { kind: 'brazier'; tx: number; ty: number }
  | { kind: 'torch'; tx: number; ty: number }
  | { kind: 'sign'; tx: number; ty: number; text: Record<World, Bilingual | null> }
  | { kind: 'gate'; tx: number; ty: number }
  | { kind: 'bell'; tx: number; ty: number }
  | { kind: 'urn'; tx: number; ty: number }
  | { kind: 'idol'; tx: number; ty: number }
  | { kind: 'pillar'; tx: number; ty: number }
  | { kind: 'soul'; tx: number; ty: number }
  | { kind: 'switch'; tx: number; ty: number }
  | { kind: 'post'; tx: number; ty: number; moon: boolean }
  | { kind: 'greatbell'; tx: number; ty: number }
  | { kind: 'heart'; tx: number; ty: number }
  | { kind: 'boss'; tx: number; ty: number }
  | { kind: 'enemy'; type: EnemyKind; tx: number; ty: number };

export interface RoomDef {
  id: string;
  name: Bilingual;
  /** Position in the dungeon grid, in screens. */
  gx: number;
  gy: number;
  /** Size in tiles (multiples of 20 x 11). */
  cols: number;
  rows: number;
  terrain: Record<World, Uint8Array>;
  /** Jawia only: a wall of Nawia collapsed here, leave debris on the floor. */
  debris: Uint8Array;
  /** Ornamental paving (',' in the map). */
  ornament: Uint8Array;
  objects: ObjectDef[];
  spawn: { tx: number; ty: number } | null;
  source: string[];
}

/** char -> [terrain in Jawia, terrain in Nawia] */
export const LEGEND: Record<string, [Terrain, Terrain]> = {
  ' ': [TERRAIN.VOID, TERRAIN.VOID],
  '#': [TERRAIN.WALL, TERRAIN.WALL],
  '.': [TERRAIN.FLOOR, TERRAIN.FLOOR],
  ',': [TERRAIN.FLOOR, TERRAIN.FLOOR], // ornamental paving: same as floor, prettier
  '~': [TERRAIN.WATER, TERRAIN.WATER],
  J: [TERRAIN.RUBBLE, TERRAIN.FLOOR], // rubble: blocks the living, the dead remember an open passage
  N: [TERRAIN.FLOOR, TERRAIN.WALL], // a wall that only still stands in Nawia
  '=': [TERRAIN.BRIDGE, TERRAIN.WATER], // planks laid by the living
  ':': [TERRAIN.WATER, TERRAIN.BRIDGE], // the old bridge, long gone in Jawia
  '+': [TERRAIN.BRIDGE, TERRAIN.BRIDGE],
  '!': [TERRAIN.WALL, TERRAIN.WALL], // wall with a torch on it
  // everything below stands on plain floor
  '@': [TERRAIN.FLOOR, TERRAIN.FLOOR],
  T: [TERRAIN.FLOOR, TERRAIN.FLOOR],
  G: [TERRAIN.FLOOR, TERRAIN.FLOOR],
  B: [TERRAIN.FLOOR, TERRAIN.FLOOR],
  u: [TERRAIN.FLOOR, TERRAIN.FLOOR],
  z: [TERRAIN.FLOOR, TERRAIN.FLOOR],
  o: [TERRAIN.FLOOR, TERRAIN.FLOOR],
  I: [TERRAIN.FLOOR, TERRAIN.FLOOR],
  P: [TERRAIN.FLOOR, TERRAIN.FLOOR],
  s: [TERRAIN.FLOOR, TERRAIN.FLOOR],
  f: [TERRAIN.FLOOR, TERRAIN.FLOOR], // ognik
  w: [TERRAIN.WATER, TERRAIN.WATER], // ognik hovering over water
  x: [TERRAIN.FLOOR, TERRAIN.FLOOR], // strzyga
  K: [TERRAIN.FLOOR, TERRAIN.FLOOR], // the guardian
  Q: [TERRAIN.FLOOR, TERRAIN.FLOOR], // the great bell
  L: [TERRAIN.FLOOR, TERRAIN.FLOOR], // turning stone
  a: [TERRAIN.FLOOR, TERRAIN.FLOOR], // sun post
  m: [TERRAIN.FLOOR, TERRAIN.FLOOR], // moon post
  h: [TERRAIN.FLOOR, TERRAIN.FLOOR], // a heart lying on the floor
};
for (let d = 1; d <= 9; d++) LEGEND[String(d)] = [TERRAIN.FLOOR, TERRAIN.FLOOR];

function bilingual(v: string): Bilingual {
  const [pl, en] = v.split('|').map((s) => s.trim());
  return { pl, en: en || pl };
}

export function parseRoom(text: string, fileName = '?'): RoomDef {
  const lines = text.replace(/\r/g, '').split('\n');
  const fail = (msg: string): never => {
    throw new Error(`Room "${fileName}": ${msg}`);
  };

  const meta: Record<string, string> = {};
  const map: string[] = [];
  const signs = new Map<number, Record<World, Bilingual | null>>();

  let i = 0;
  // header
  for (; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '' || line.trimStart().startsWith('//')) continue;
    if (line.trim() === 'map:') { i++; break; }
    const m = /^([a-z]+):\s*(.*)$/.exec(line.trim());
    if (!m) fail(`line ${i + 1}: expected "key: value" or "map:"`);
    else meta[m[1]] = m[2];
  }
  // map block: runs until the first blank line
  for (; i < lines.length; i++) {
    if (lines[i].trim() === '') break;
    map.push(lines[i].replace(/\s+$/, ''));
  }
  // trailing blocks: sign texts
  let current: Record<World, Bilingual | null> | null = null;
  for (; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === '' || line.startsWith('//')) continue;
    const s = /^sign\s+([1-9]):$/.exec(line);
    if (s) {
      current = { jawia: null, nawia: null };
      signs.set(Number(s[1]), current);
      continue;
    }
    const t = /^(jawia|nawia|both):\s*(.+)$/.exec(line);
    if (t && current) {
      const b = bilingual(t[2]);
      if (t[1] === 'both') { current.jawia = b; current.nawia = b; }
      else current[t[1] as World] = b;
      continue;
    }
    fail(`line ${i + 1}: cannot understand "${line}"`);
  }

  if (!meta.room) fail('missing "room: <id>"');
  if (!meta.at) fail('missing "at: <gx>,<gy>"');
  const [gx, gy] = meta.at.split(',').map((n) => parseInt(n.trim(), 10));
  if (Number.isNaN(gx) || Number.isNaN(gy)) fail(`bad "at: ${meta.at}"`);
  if (map.length === 0) fail('empty map');

  const cols = Math.max(...map.map((r) => r.length));
  const rows = map.length;
  if (cols % SCREEN_COLS !== 0 || rows % SCREEN_ROWS !== 0)
    fail(`map is ${cols}x${rows} tiles; it must be a multiple of ${SCREEN_COLS}x${SCREEN_ROWS}`);

  const room: RoomDef = {
    id: meta.room,
    name: bilingual(meta.name ?? meta.room),
    gx, gy, cols, rows,
    terrain: { jawia: new Uint8Array(cols * rows), nawia: new Uint8Array(cols * rows) },
    debris: new Uint8Array(cols * rows),
    ornament: new Uint8Array(cols * rows),
    objects: [],
    spawn: null,
    source: map,
  };

  for (let y = 0; y < rows; y++) {
    const row = map[y].padEnd(cols, ' ');
    for (let x = 0; x < cols; x++) {
      const ch = row[x];
      const def = LEGEND[ch];
      if (!def) fail(`unknown tile '${ch}' at column ${x + 1}, row ${y + 1}`);
      const k = y * cols + x;
      room.terrain.jawia[k] = def[0];
      room.terrain.nawia[k] = def[1];
      if (ch === 'N') room.debris[k] = 1;
      if (ch === ',') room.ornament[k] = 1;
      if (ch === '@') room.spawn = { tx: x, ty: y };
      else if (ch === '!') room.objects.push({ kind: 'torch', tx: x, ty: y });
      else if (ch === 'T') room.objects.push({ kind: 'brazier', tx: x, ty: y });
      else if (ch === 'G') room.objects.push({ kind: 'gate', tx: x, ty: y });
      else if (ch === 'B') room.objects.push({ kind: 'bell', tx: x, ty: y });
      else if (ch === 'o') room.objects.push({ kind: 'urn', tx: x, ty: y });
      else if (ch === 'I') room.objects.push({ kind: 'idol', tx: x, ty: y });
      else if (ch === 'P') room.objects.push({ kind: 'pillar', tx: x, ty: y });
      else if (ch === 's') room.objects.push({ kind: 'soul', tx: x, ty: y });
      else if (ch === 'u') room.objects.push({ kind: 'enemy', type: 'utopiec', tx: x, ty: y });
      else if (ch === 'z') room.objects.push({ kind: 'enemy', type: 'zjawa', tx: x, ty: y });
      else if (ch === 'f' || ch === 'w') room.objects.push({ kind: 'enemy', type: 'ognik', tx: x, ty: y });
      else if (ch === 'x') room.objects.push({ kind: 'enemy', type: 'strzyga', tx: x, ty: y });
      else if (ch === 'K') room.objects.push({ kind: 'boss', tx: x, ty: y });
      else if (ch === 'Q') room.objects.push({ kind: 'greatbell', tx: x, ty: y });
      else if (ch === 'L') room.objects.push({ kind: 'switch', tx: x, ty: y });
      else if (ch === 'a') room.objects.push({ kind: 'post', tx: x, ty: y, moon: false });
      else if (ch === 'm') room.objects.push({ kind: 'post', tx: x, ty: y, moon: true });
      else if (ch === 'h') room.objects.push({ kind: 'heart', tx: x, ty: y });
      else if (ch >= '1' && ch <= '9') {
        const text = signs.get(Number(ch));
        if (!text) fail(`sign '${ch}' is on the map but has no "sign ${ch}:" block`);
        else room.objects.push({ kind: 'sign', tx: x, ty: y, text });
      }
    }
  }
  return room;
}

// ---------------------------------------------------------------- dungeon

export class Dungeon {
  readonly rooms: RoomDef[];
  private readonly byCell = new Map<string, RoomDef>();
  private readonly byId = new Map<string, RoomDef>();

  constructor(rooms: RoomDef[]) {
    this.rooms = rooms;
    for (const r of rooms) {
      if (this.byId.has(r.id)) throw new Error(`Duplicate room id "${r.id}"`);
      this.byId.set(r.id, r);
      for (let cy = 0; cy < r.rows / SCREEN_ROWS; cy++)
        for (let cx = 0; cx < r.cols / SCREEN_COLS; cx++) {
          const key = `${r.gx + cx},${r.gy + cy}`;
          const clash = this.byCell.get(key);
          if (clash) throw new Error(`Rooms "${clash.id}" and "${r.id}" overlap at grid cell ${key}`);
          this.byCell.set(key, r);
        }
    }
  }

  get(id: string): RoomDef {
    const r = this.byId.get(id);
    if (!r) throw new Error(`No room "${id}"`);
    return r;
  }

  has(id: string): boolean {
    return this.byId.has(id);
  }

  /** Room containing a global tile coordinate. */
  roomAtTile(gtx: number, gty: number): RoomDef | null {
    return this.byCell.get(`${Math.floor(gtx / SCREEN_COLS)},${Math.floor(gty / SCREEN_ROWS)}`) ?? null;
  }

  /** Terrain at a global tile coordinate (VOID outside every room). */
  terrainAt(world: World, gtx: number, gty: number): number {
    const r = this.roomAtTile(gtx, gty);
    if (!r) return TERRAIN.VOID;
    return r.terrain[world][(gty - r.gy * SCREEN_ROWS) * r.cols + (gtx - r.gx * SCREEN_COLS)];
  }

  startRoom(): RoomDef {
    return this.rooms.find((r) => r.spawn) ?? this.rooms[0];
  }

  /**
   * Design-time sanity checks. Returns human-readable problems (empty = fine):
   * a doorway on a room edge must lead somewhere walkable in the same world.
   */
  validate(): string[] {
    const problems: string[] = [];
    const spawns = this.rooms.filter((r) => r.spawn);
    if (spawns.length !== 1) problems.push(`expected exactly one '@' in the dungeon, found ${spawns.length}`);
    for (const r of this.rooms) {
      const ox = r.gx * SCREEN_COLS;
      const oy = r.gy * SCREEN_ROWS;
      const edge = (x: number, y: number, dx: number, dy: number): void => {
        for (const w of ['jawia', 'nawia'] as World[]) {
          if (!isWalkable(r.terrain[w][y * r.cols + x])) continue;
          const beyond = this.terrainAt(w, ox + x + dx, oy + y + dy);
          if (!isWalkable(beyond)) {
            const nb = this.roomAtTile(ox + x + dx, oy + y + dy);
            problems.push(
              `${r.id}: opening at column ${x + 1}, row ${y + 1} (${w}) leads ${nb ? `into a solid tile of "${nb.id}"` : 'nowhere'}`,
            );
          }
        }
      };
      for (let x = 0; x < r.cols; x++) { edge(x, 0, 0, -1); edge(x, r.rows - 1, 0, 1); }
      for (let y = 0; y < r.rows; y++) { edge(0, y, -1, 0); edge(r.cols - 1, y, 1, 0); }
    }
    return problems;
  }
}
