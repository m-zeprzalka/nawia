// The playground's own little world: one room, loaded only by the playground scene.
import { Dungeon, parseRoom } from '../world/roomFormat.ts';

const files = import.meta.glob('./*.room.txt', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>;

export function loadLab(): Dungeon {
  return new Dungeon(Object.keys(files).sort().map((path) => parseRoom(files[path], path.split('/').pop())));
}
