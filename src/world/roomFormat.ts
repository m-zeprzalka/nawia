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

export type EnemyKind = 'utopiec' | 'zjawa' | 'ognik' | 'strzyga' | 'dzik' | 'wilk' | 'morownik';

/** What a room is made of: the surface (village, forest) is painted differently from the stronghold below. */
export type Biome = 'village' | 'forest' | 'house' | 'crypt';
/** Under the open sky. */
export const isSurface = (b: Biome): boolean => b === 'village' || b === 'forest';

/** Villagers you can talk to (a `sign` block with a `look:` line). */
export type NpcLook = 'herbalist' | 'elder' | 'woman' | 'child';
const NPC_LOOKS: readonly string[] = ['herbalist', 'elder', 'woman', 'child'];

export type ObjectDef =
  | { kind: 'brazier'; tx: number; ty: number }
  | { kind: 'torch'; tx: number; ty: number }
  | { kind: 'sign'; tx: number; ty: number; text: Record<World, Bilingual | null>; talk: Record<World, string | null> }
  | { kind: 'npc'; tx: number; ty: number; look: NpcLook; text: Record<World, Bilingual | null>; talk: Record<World, string | null> }
  /** A doorway: stepping on it takes you to the door of room `to` that leads back here. */
  | { kind: 'door'; tx: number; ty: number; to: string }
  /** Harmless animals of the living world. */
  | { kind: 'critter'; type: 'hen'; tx: number; ty: number }
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
  biome: Biome;
  /** How far the blight has got here: 0 (untouched) to 3 (the border is cracking). Surface rooms only. */
  blight: number;
  /** Doorways: cell index (y * cols + x) -> id of the room behind it. */
  doors: Map<number, string>;
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
  /** The ways out close behind him while anything in the room is left standing (`lock: yes`). */
  lock: boolean;
  /** Monsters that come once the ones on the map are gone: wave 2, wave 3... (`wave 2: v 3,4; z 10,6`). */
  waves: { type: EnemyKind; tx: number; ty: number }[][];
  source: string[];
}

/** The map letters of the monsters, which a `wave` line uses too. */
export const ENEMY_LETTERS: Record<string, EnemyKind> = { u: 'utopiec', z: 'zjawa', f: 'ognik', x: 'strzyga', d: 'dzik', v: 'wilk', p: 'morownik' };

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
  // ---- the surface (biome: village / forest). These are scenery: the same in both worlds.
  t: [TERRAIN.WALL, TERRAIN.WALL], // a tree standing on its own
  O: [TERRAIN.WALL, TERRAIN.WALL], // a great old tree
  H: [TERRAIN.WALL, TERRAIN.WALL], // a house (a rectangle of H, with one D in its bottom row)
  D: [TERRAIN.WALL, TERRAIN.WALL], // the door of a house
  R: [TERRAIN.WALL, TERRAIN.WALL], // a boulder
  F: [TERRAIN.WALL, TERRAIN.WALL], // palisade
  W: [TERRAIN.WALL, TERRAIN.WALL], // a well
  b: [TERRAIN.WALL, TERRAIN.WALL], // a bush
  S: [TERRAIN.WALL, TERRAIN.WALL], // a haystack (indoors: a stool)
  U: [TERRAIN.WALL, TERRAIN.WALL], // a log beehive
  M: [TERRAIN.WALL, TERRAIN.WALL], // hollyhocks (indoors: herbs hung on the wall)
  d: [TERRAIN.FLOOR, TERRAIN.FLOOR], // dzik (boar)
  v: [TERRAIN.FLOOR, TERRAIN.FLOOR], // wilk (blighted wolf)
  p: [TERRAIN.FLOOR, TERRAIN.FLOOR], // morownik (blight bloom)
  c: [TERRAIN.FLOOR, TERRAIN.FLOOR], // a hen
  '"': [TERRAIN.FLOOR, TERRAIN.FLOOR], // meadow flowers
  '^': [TERRAIN.FLOOR, TERRAIN.FLOOR], // steps going down
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
  const talks = new Map<number, Record<World, string | null>>();
  const looks = new Map<number, NpcLook>();
  const doorTo = new Map<number, string>();
  const waves: { type: EnemyKind; tx: number; ty: number }[][] = [];
  let currentSign = 0;
  let currentTalk: Record<World, string | null> | null = null;

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
      currentTalk = { jawia: null, nawia: null };
      currentSign = Number(s[1]);
      signs.set(currentSign, current);
      talks.set(currentSign, currentTalk);
      continue;
    }
    const wv = /^wave\s+([2-9]):\s*(.+)$/.exec(line);
    if (wv) {
      const n = Number(wv[1]);
      if (n !== waves.length + 2) fail(`line ${i + 1}: wave ${n} comes after wave ${waves.length + 1}`);
      const list: { type: EnemyKind; tx: number; ty: number }[] = [];
      for (const part of wv[2].split(';')) {
        const e = /^\s*([a-z])\s+(\d+)\s*,\s*(\d+)\s*$/.exec(part);
        if (!e || !ENEMY_LETTERS[e[1]]) fail(`line ${i + 1}: "${part.trim()}" is not "<monster letter> <column>,<row>" (letters: ${Object.keys(ENEMY_LETTERS).join(' ')})`);
        else list.push({ type: ENEMY_LETTERS[e[1]], tx: Number(e[2]), ty: Number(e[3]) });
      }
      waves.push(list);
      current = null;
      continue;
    }
    const d = /^door\s+([1-9]):\s*(\S+)$/.exec(line);
    if (d) {
      doorTo.set(Number(d[1]), d[2]);
      current = null;
      continue;
    }
    const l = /^look:\s*(\S+)$/.exec(line);
    if (l && current) {
      if (!NPC_LOOKS.includes(l[1])) fail(`line ${i + 1}: unknown look "${l[1]}" (expected one of: ${NPC_LOOKS.join(', ')})`);
      looks.set(currentSign, l[1] as NpcLook);
      continue;
    }
    const t = /^(jawia|nawia|both):\s*(.+)$/.exec(line);
    if (t && current && currentTalk) {
      const worlds: World[] = t[1] === 'both' ? ['jawia', 'nawia'] : [t[1] as World];
      // "@id" starts a conversation from src/story/*.dialog.txt; anything else is the text itself
      if (t[2].startsWith('@')) for (const w of worlds) currentTalk[w] = t[2].slice(1).trim();
      else for (const w of worlds) current[w] = bilingual(t[2]);
      continue;
    }
    fail(`line ${i + 1}: cannot understand "${line}"`);
  }

  if (!meta.room) fail('missing "room: <id>"');
  if (!meta.at) fail('missing "at: <gx>,<gy>"');
  const [gx, gy] = meta.at.split(',').map((n) => parseInt(n.trim(), 10));
  if (Number.isNaN(gx) || Number.isNaN(gy)) fail(`bad "at: ${meta.at}"`);
  if (map.length === 0) fail('empty map');
  const biome = (meta.biome ?? 'crypt') as Biome;
  if (biome !== 'village' && biome !== 'forest' && biome !== 'house' && biome !== 'crypt') fail(`bad "biome: ${meta.biome}" (village, forest, house or crypt)`);
  const blight = meta.blight === undefined ? 0 : Number(meta.blight);
  if (!(blight >= 0 && blight <= 3)) fail(`bad "blight: ${meta.blight}" (0 to 3)`);

  const cols = Math.max(...map.map((r) => r.length));
  const rows = map.length;
  if (cols % SCREEN_COLS !== 0 || rows % SCREEN_ROWS !== 0)
    fail(`map is ${cols}x${rows} tiles; it must be a multiple of ${SCREEN_COLS}x${SCREEN_ROWS}`);

  const room: RoomDef = {
    id: meta.room,
    name: bilingual(meta.name ?? meta.room),
    biome,
    blight,
    doors: new Map(),
    gx, gy, cols, rows,
    terrain: { jawia: new Uint8Array(cols * rows), nawia: new Uint8Array(cols * rows) },
    debris: new Uint8Array(cols * rows),
    ornament: new Uint8Array(cols * rows),
    objects: [],
    spawn: null,
    lock: meta.lock === 'yes',
    waves,
    source: map,
  };
  if (meta.lock !== undefined && meta.lock !== 'yes' && meta.lock !== 'no') fail(`bad "lock: ${meta.lock}" (yes or no)`);
  for (const [n, list] of waves.entries())
    for (const e of list) if (e.tx < 1 || e.ty < 1 || e.tx >= cols - 1 || e.ty >= rows - 1) fail(`wave ${n + 2}: ${e.tx},${e.ty} is outside the room (columns 1-${cols - 2}, rows 1-${rows - 2}, counted from 0)`);

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
      else if (ch === 'd') room.objects.push({ kind: 'enemy', type: 'dzik', tx: x, ty: y });
      else if (ch === 'v') room.objects.push({ kind: 'enemy', type: 'wilk', tx: x, ty: y });
      else if (ch === 'p') room.objects.push({ kind: 'enemy', type: 'morownik', tx: x, ty: y });
      else if (ch === 'c') room.objects.push({ kind: 'critter', type: 'hen', tx: x, ty: y });
      else if (ch >= '1' && ch <= '9') {
        const n = Number(ch);
        const text = signs.get(n);
        const talk = talks.get(n);
        const look = looks.get(n);
        const to = doorTo.get(n);
        if (to) {
          room.objects.push({ kind: 'door', tx: x, ty: y, to });
          room.doors.set(k, to);
        } else if (!text || !talk) fail(`'${ch}' is on the map but has no "sign ${ch}:" or "door ${ch}:" block`);
        else if (look) room.objects.push({ kind: 'npc', tx: x, ty: y, look, text, talk });
        else room.objects.push({ kind: 'sign', tx: x, ty: y, text, talk });
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

  /** The map character at a global tile coordinate, or null outside every room. */
  charAt(gtx: number, gty: number): string | null {
    const r = this.roomAtTile(gtx, gty);
    if (!r) return null;
    return r.source[gty - r.gy * SCREEN_ROWS]?.[gtx - r.gx * SCREEN_COLS] ?? ' ';
  }

  /** Where a doorway leads: the room, and the tile of its door that leads back (room-local). Null if the pair is broken. */
  doorTarget(from: RoomDef, to: string): { room: RoomDef; tx: number; ty: number } | null {
    const room = this.byId.get(to);
    if (!room) return null;
    for (const [cell, back] of room.doors) if (back === from.id) return { room, tx: cell % room.cols, ty: Math.floor(cell / room.cols) };
    return null;
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
    for (const r of this.rooms)
      for (const to of r.doors.values())
        if (!this.byId.has(to)) problems.push(`${r.id}: a door leads to "${to}", which is not a room`);
        else if (!this.doorTarget(r, to)) problems.push(`${r.id}: a door leads to "${to}", but "${to}" has no door back to "${r.id}"`);
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
