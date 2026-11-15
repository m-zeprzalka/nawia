// Loads every room file from disk (the game does the same through Vite's import.meta.glob).
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Dungeon, parseRoom } from '../src/world/roomFormat.ts';

export const ROOMS_DIR = join(import.meta.dirname, '../src/world/rooms');

export function loadDungeon(): Dungeon {
  const files = readdirSync(ROOMS_DIR).filter((f) => f.endsWith('.room.txt')).sort();
  return new Dungeon(files.map((f) => parseRoom(readFileSync(join(ROOMS_DIR, f), 'utf8'), f)));
}
