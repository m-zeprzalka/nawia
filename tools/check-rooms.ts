// Design-time check: is the dungeon finishable, and how many shifts does it take at minimum?
//   npm run rooms:check
// Walks the whole dungeon on the tile grid in both worlds at once (0-1 BFS: steps are free, shifts cost 1).
import { SCREEN_COLS, SCREEN_ROWS, type World } from '../src/config.ts';
import { isWalkable } from '../src/world/roomFormat.ts';
import { loadDungeon } from './rooms.ts';

const dungeon = loadDungeon();
let failed = false;

const problems = dungeon.validate();
for (const p of problems) console.log(`  ! ${p}`);
if (problems.length) failed = true;

// props that stand on the floor block it (the gate is assumed open: it opens when the room is cleared)
const blocked = new Set<string>();
const goals: { x: number; y: number; room: string }[] = [];
for (const r of dungeon.rooms)
  for (const o of r.objects) {
    const gx = r.gx * SCREEN_COLS + o.tx;
    const gy = r.gy * SCREEN_ROWS + o.ty;
    if (o.kind === 'brazier' || o.kind === 'sign' || o.kind === 'bell') blocked.add(`${gx},${gy}`);
    if (o.kind === 'bell') goals.push({ x: gx, y: gy, room: r.id });
  }

const WORLDS: World[] = ['jawia', 'nawia'];
const free = (w: World, x: number, y: number): boolean => isWalkable(dungeon.terrainAt(w, x, y)) && !blocked.has(`${x},${y}`);

const start = dungeon.startRoom();
if (!start.spawn) {
  console.log("  ! no '@' spawn found");
  process.exit(1);
}
const sx = start.gx * SCREEN_COLS + start.spawn.tx;
const sy = start.gy * SCREEN_ROWS + start.spawn.ty;

const key = (w: number, x: number, y: number): string => `${w},${x},${y}`;
const cost = new Map<string, number>([[key(0, sx, sy), 0]]);
const deque: [number, number, number][] = [[0, sx, sy]];
while (deque.length) {
  const [w, x, y] = deque.shift()!;
  const c = cost.get(key(w, x, y))!;
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const k = key(w, x + dx, y + dy);
    if (free(WORLDS[w], x + dx, y + dy) && (cost.get(k) ?? Infinity) > c) {
      cost.set(k, c);
      deque.unshift([w, x + dx, y + dy]);
    }
  }
  const k = key(1 - w, x, y);
  if (free(WORLDS[1 - w], x, y) && (cost.get(k) ?? Infinity) > c + 1) {
    cost.set(k, c + 1);
    deque.push([1 - w, x, y]);
  }
}

console.log(`${dungeon.rooms.length} rooms, start: "${start.id}"`);
for (const r of dungeon.rooms) {
  let best = Infinity;
  let reachable = 0;
  let walkable = 0;
  for (let y = 0; y < r.rows; y++)
    for (let x = 0; x < r.cols; x++) {
      const gx = r.gx * SCREEN_COLS + x;
      const gy = r.gy * SCREEN_ROWS + y;
      for (const w of [0, 1]) {
        if (!free(WORLDS[w], gx, gy)) continue;
        walkable++;
        const c = cost.get(key(w, gx, gy));
        if (c !== undefined) {
          reachable++;
          best = Math.min(best, c);
        }
      }
    }
  const note = best === Infinity ? 'UNREACHABLE' : `first reached after ${best} shift(s), ${reachable}/${walkable} tiles reachable`;
  console.log(`  ${r.id.padEnd(12)} ${note}`);
  if (best === Infinity) failed = true;
}
for (const g of goals) {
  let best = Infinity;
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) for (const w of [0, 1]) best = Math.min(best, cost.get(key(w, g.x + dx, g.y + dy)) ?? Infinity);
  console.log(best === Infinity ? `  ! the bell in "${g.room}" cannot be reached` : `  bell in "${g.room}": reachable, at least ${best} shift(s) from the start`);
  if (best === Infinity) failed = true;
}
console.log(failed ? 'FAILED' : 'OK');
process.exit(failed ? 1 : 0);
