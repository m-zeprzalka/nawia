// The layout of the hero's animation sheet: the contract between whoever draws him and the code that plays him.
//
// Every look of the hero (src/art/heroGame.ts) is one sheet in this layout, armed and bare:
//   - cells of CELL.w x CELL.h; his feet stand on row CELL.foot (the last row of his shoes is CELL.foot - 1),
//     centred on column CELL.cx: a 16 x 18 figure drawn the old way sits at columns 8-23, rows 9-26;
//     the room around him is for the sword, a lean, a fall;
//   - rows: facing down (towards us), up (away), and to the side (drawn facing right; left is a mirror);
//   - columns: the animations below, one after another, in the order of ANIM_ORDER.
//
// The sword is drawn into the frames of the strikes (the old separate sword sprite is gone for the new looks);
// the sweep of light over a strike (the smear) is drawn by the code, over the frames, in the frames marked `active`.
// Durations are milliseconds per frame. The code may stretch the run with the walking speed.

export const CELL = { w: 32, h: 32, cx: 16, foot: 27 } as const;

export type HeroView = 'down' | 'up' | 'side';
export const VIEW_ROWS: Record<HeroView, number> = { down: 0, up: 1, side: 2 };

export type HeroAnim = 'idle' | 'run' | 'atkA' | 'atkB' | 'atkC' | 'guard' | 'roll' | 'hurt' | 'death';

export interface AnimSpec {
  /** how many frames it has */
  frames: number;
  /** how long each frame shows, in ms (the last one of a held animation holds) */
  ms: number[];
  /** does it loop */
  loop: boolean;
  /** strikes: the frames in which the blade can hurt (the code draws the smear over them) */
  active?: [number, number];
  /** the roll: the frames in which nothing can touch him */
  safe?: [number, number];
  /** what each frame is, for whoever draws it */
  keys: string[];
}

export const ANIMS: Record<HeroAnim, AnimSpec> = {
  // breathing: the chest rises a pixel, the cloak and the hair settle
  idle: { frames: 4, ms: [420, 160, 420, 160], loop: true, keys: ['rest', 'breathe in', 'rest (other)', 'breathe out'] },
  // a run, not a stroll: contact, down, passing, contact, down, passing; arms against legs, the cloak flying
  run: { frames: 6, ms: [90, 90, 90, 90, 90, 90], loop: true, keys: ['contact R', 'down R', 'pass R', 'contact L', 'down L', 'pass L'] },
  // the first blow: from his sword side across in front of him
  atkA: { frames: 4, ms: [55, 45, 70, 120], loop: false, active: [1, 2], keys: ['wind-up', 'swing', 'follow-through', 'recover'] },
  // the second: back the other way (a backhand)
  atkB: { frames: 4, ms: [50, 45, 70, 120], loop: false, active: [1, 2], keys: ['wind-up', 'swing', 'follow-through', 'recover'] },
  // the third: the heavy one, overhead and down with a step; longer to start, longer to come back from
  atkC: { frames: 5, ms: [130, 50, 90, 110, 110], loop: false, active: [1, 2], keys: ['raise high', 'chop', 'impact', 'recover 1', 'recover 2'] },
  // the shield raised in front of him: up, then held (he walks slowly behind it)
  guard: { frames: 2, ms: [60, 1000], loop: false, keys: ['raise', 'hold'] },
  // the dodge: a forward roll with a little hop; he is untouchable from the tuck to the unfold
  roll: { frames: 6, ms: [40, 50, 50, 50, 50, 70], loop: false, safe: [1, 4], keys: ['crouch', 'tuck', 'roll 1', 'roll 2', 'unfold', 'land'] },
  // hit: thrown back, head back; then catching himself
  hurt: { frames: 2, ms: [110, 150], loop: false, keys: ['recoil', 'catch'] },
  // down: the blow, the knees, the fall, lying, lying still (the last holds)
  death: { frames: 5, ms: [140, 160, 160, 300, 1000], loop: false, keys: ['hit', 'knees', 'falling', 'lying', 'still'] },
};

export const ANIM_ORDER: HeroAnim[] = ['idle', 'run', 'atkA', 'atkB', 'atkC', 'guard', 'roll', 'hurt', 'death'];

/** The column each animation starts at. */
export const ANIM_COL: Record<HeroAnim, number> = (() => {
  const out = {} as Record<HeroAnim, number>;
  let c = 0;
  for (const a of ANIM_ORDER) {
    out[a] = c;
    c += ANIMS[a].frames;
  }
  return out;
})();

/** Columns in a sheet. */
export const SHEET_COLS = ANIM_ORDER.reduce((n, a) => n + ANIMS[a].frames, 0);

/** The frame index (row * SHEET_COLS + column) of frame `i` of `anim` facing `view`. */
export const heroFrame = (anim: HeroAnim, view: HeroView, i: number): number =>
  VIEW_ROWS[view] * SHEET_COLS + ANIM_COL[anim] + Math.max(0, Math.min(ANIMS[anim].frames - 1, i));

/** Total length of an animation, in seconds. */
export const animTime = (anim: HeroAnim): number => ANIMS[anim].ms.reduce((a, b) => a + b, 0) / 1000;

/** Which frame of a one-shot animation shows `t` seconds in (the last one once it is over). */
export function frameAt(anim: HeroAnim, t: number): number {
  const ms = ANIMS[anim].ms;
  let acc = 0;
  const at = t * 1000;
  for (let i = 0; i < ms.length; i++) {
    acc += ms[i];
    if (at < acc) return i;
  }
  return ms.length - 1;
}

/** Seconds from the start of an animation to the start of frame `i`. */
export const frameStart = (anim: HeroAnim, i: number): number => ANIMS[anim].ms.slice(0, i).reduce((a, b) => a + b, 0) / 1000;
