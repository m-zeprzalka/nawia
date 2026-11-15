// Browser-side loader: Vite inlines every room file as a string at build time.
import { Dungeon, parseRoom } from './roomFormat.ts';

const files = import.meta.glob('./rooms/*.room.txt', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>;

export function loadDungeon(): Dungeon {
  const dungeon = new Dungeon(
    Object.keys(files).sort().map((path) => parseRoom(files[path], path.split('/').pop())),
  );
  if (import.meta.env.DEV) for (const p of dungeon.validate()) console.warn(`[rooms] ${p}`);
  return dungeon;
}
