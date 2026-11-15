// The playground's own little world: one room, loaded only by the playground scene.
import { Dungeon, parseRoom } from '../world/roomFormat.ts';
import { parseLineup, type Lineup } from './lineup.ts';

const files = import.meta.glob('./*.room.txt', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>;

export function loadLab(): Dungeon {
  return new Dungeon(Object.keys(files).sort().map((path) => parseRoom(files[path], path.split('/').pop())));
}

const lineups = import.meta.glob('./lineup.txt', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>;

/** Who stands on the playground board: src/lab/lineup.txt. */
export function loadLineup(): Lineup {
  return parseLineup(Object.values(lineups)[0] ?? '');
}
