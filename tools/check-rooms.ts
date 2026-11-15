// Design-time check: is the dungeon finishable, and how many shifts does it take at minimum?
//   npm run rooms:check
// Walks the whole dungeon on the tile grid in both worlds at once (0-1 BFS: steps are free, shifts cost 1).
// It knows about the turning stone: the state of the sun/moon posts is part of the search
// (it resets when you leave a room, as it does in the game).
// Gates are assumed open (they open when a room is cleared), enemies are ignored.
import { SCREEN_COLS, SCREEN_ROWS, type World } from '../src/config.ts';
import { isWalkable } from '../src/world/roomFormat.ts';
import { checkDialogs } from '../src/story/dialog.ts';
import { loadDungeon } from './rooms.ts';
import { loadDialogs } from './story.ts';

const dungeon = loadDungeon();
let failed = false;

const problems = dungeon.validate();
for (const p of problems) console.log(`  ! ${p}`);
if (problems.length) failed = true;

// conversations: every jump leads somewhere, and every "@id" in a room file exists
const dialogs = loadDialogs();
const talkProblems = checkDialogs(dialogs);
for (const r of dungeon.rooms)
  for (const o of r.objects)
    if (o.kind === 'sign' || o.kind === 'npc')
      for (const id of [o.talk.jawia, o.talk.nawia])
        if (id && !dialogs.has(id)) talkProblems.push(`room "${r.id}" starts the conversation "@${id}", which does not exist`);
for (const p of talkProblems) console.log(`  ! ${p}`);
// the text panel holds three rows: warn (only warn) about lines that will not fit
for (const [id, ops] of dialogs)
  for (const op of ops)
    if (op.op === 'say' && Math.max(op.text.pl.length, op.text.en.length) > 125)
      console.log(`  ? dialog "${id}": a line of ${Math.max(op.text.pl.length, op.text.en.length)} characters may not fit in the panel ("${op.text.pl.slice(0, 40)}...")`);
if (talkProblems.length) failed = true;

/** doorway (global tile) -> the doorway it leads to */
const doorways = new Map<string, [number, number]>();
for (const r of dungeon.rooms)
  for (const [cell, to] of r.doors) {
    const back = dungeon.doorTarget(r, to);
    if (back) doorways.set(`${r.gx * SCREEN_COLS + (cell % r.cols)},${r.gy * SCREEN_ROWS + Math.floor(cell / r.cols)}`, [back.room.gx * SCREEN_COLS + back.tx, back.room.gy * SCREEN_ROWS + back.ty]);
  }

const blocked = new Set<string>();
const switches = new Set<string>();
const posts = new Map<string, boolean>(); // tile -> is it a moon post?
const goals: { x: number; y: number; room: string; what: string }[] = [];
for (const r of dungeon.rooms)
  for (const o of r.objects) {
    const gx = r.gx * SCREEN_COLS + o.tx;
    const gy = r.gy * SCREEN_ROWS + o.ty;
    const k = `${gx},${gy}`;
    // urns can be smashed; souls, torches, hearts and everything alive are not in the way
    if (o.kind === 'brazier' || o.kind === 'sign' || o.kind === 'bell' || o.kind === 'idol' || o.kind === 'pillar' || o.kind === 'switch' || o.kind === 'npc') blocked.add(k);
    if (o.kind === 'greatbell') for (const dx of [-1, 0, 1]) blocked.add(`${gx + dx},${gy}`);
    if (o.kind === 'switch') switches.add(k);
    if (o.kind === 'post') posts.set(k, o.moon);
    if (o.kind === 'bell') goals.push({ x: gx, y: gy, room: r.id, what: 'lesser bell' });
    if (o.kind === 'greatbell') goals.push({ x: gx, y: gy, room: r.id, what: 'great bell' });
    if (o.kind === 'switch') goals.push({ x: gx, y: gy, room: r.id, what: 'turning stone' });
  }

const WORLDS: World[] = ['jawia', 'nawia'];
/** moon: 0 = sun posts stand, 1 = moon posts stand */
const free = (w: number, x: number, y: number, moon: number): boolean => {
  const k = `${x},${y}`;
  if (!isWalkable(dungeon.terrainAt(WORLDS[w], x, y)) || blocked.has(k)) return false;
  const post = posts.get(k);
  return post === undefined || post !== (moon === 1);
};

const start = dungeon.startRoom();
if (!start.spawn) {
  console.log("  ! no '@' spawn found");
  process.exit(1);
}
const sx = start.gx * SCREEN_COLS + start.spawn.tx;
const sy = start.gy * SCREEN_ROWS + start.spawn.ty;

const key = (w: number, x: number, y: number, m: number): string => `${w},${x},${y},${m}`;
const cost = new Map<string, number>([[key(0, sx, sy, 0), 0]]);
const deque: [number, number, number, number][] = [[0, sx, sy, 0]];
const relax = (w: number, x: number, y: number, m: number, c: number, front: boolean): void => {
  const k = key(w, x, y, m);
  if ((cost.get(k) ?? Infinity) <= c) return;
  cost.set(k, c);
  if (front) deque.unshift([w, x, y, m]);
  else deque.push([w, x, y, m]);
};
const NEAR = [[1, 0], [-1, 0], [0, 1], [0, -1]];
while (deque.length) {
  const [w, x, y, m] = deque.shift()!;
  const c = cost.get(key(w, x, y, m))!;
  const here = dungeon.roomAtTile(x, y);
  for (const [dx, dy] of NEAR) {
    const there = dungeon.roomAtTile(x + dx, y + dy);
    // walking into another room: its posts are back in their starting position
    const m2 = there === here ? m : 0;
    if (free(w, x + dx, y + dy, m2)) relax(w, x + dx, y + dy, m2, c, true);
  }
  // a doorway leads to the doorway on its other side
  const through = doorways.get(`${x},${y}`);
  if (through && free(w, through[0], through[1], 0)) relax(w, through[0], through[1], 0, c, true);
  // strike a turning stone from next to it (not while standing on a post: it could not rise under you)
  if (!posts.has(`${x},${y}`) && NEAR.some(([dx, dy]) => switches.has(`${x + dx},${y + dy}`))) relax(w, x, y, 1 - m, c, true);
  if (free(1 - w, x, y, m)) relax(1 - w, x, y, m, c + 1, false);
}
const best = (x: number, y: number): number => {
  let b = Infinity;
  for (const w of [0, 1]) for (const m of [0, 1]) b = Math.min(b, cost.get(key(w, x, y, m)) ?? Infinity);
  return b;
};

console.log(`${dungeon.rooms.length} rooms, ${dialogs.size} conversation nodes, start: "${start.id}"`);
for (const r of dungeon.rooms) {
  let first = Infinity;
  let reachable = 0;
  let walkable = 0;
  for (let y = 0; y < r.rows; y++)
    for (let x = 0; x < r.cols; x++) {
      const gx = r.gx * SCREEN_COLS + x;
      const gy = r.gy * SCREEN_ROWS + y;
      for (const w of [0, 1]) {
        if (!free(w, gx, gy, 0) && !free(w, gx, gy, 1)) continue;
        walkable++;
        const c = Math.min(cost.get(key(w, gx, gy, 0)) ?? Infinity, cost.get(key(w, gx, gy, 1)) ?? Infinity);
        if (c !== Infinity) {
          reachable++;
          first = Math.min(first, c);
        }
      }
    }
  const note = first === Infinity ? 'UNREACHABLE' : `first reached after ${first} shift(s), ${reachable}/${walkable} tiles reachable`;
  console.log(`  ${r.id.padEnd(12)} ${note}`);
  if (first === Infinity) failed = true;
}
for (const g of goals) {
  let b = Infinity;
  for (const [dx, dy] of NEAR) b = Math.min(b, best(g.x + dx, g.y + dy));
  if (g.what === 'great bell') for (const side of [-1, 1]) b = Math.min(b, best(g.x + side, g.y + 1), best(g.x + side, g.y - 1));
  console.log(b === Infinity ? `  ! the ${g.what} in "${g.room}" cannot be reached` : `  ${g.what} in "${g.room}": reachable, at least ${b} shift(s) from the start`);
  if (b === Infinity) failed = true;
}
console.log(failed ? 'FAILED' : 'OK');
process.exit(failed ? 1 : 0);
