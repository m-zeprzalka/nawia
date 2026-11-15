// Global constants. Everything here is in *game pixels* (the 320x180 internal resolution).

export const GAME_W = 320;
export const GAME_H = 180;

export const TILE = 16;
/** One "screen" of the dungeon grid, in tiles. Rooms are multiples of this. */
export const SCREEN_COLS = 20;
export const SCREEN_ROWS = 11;
export const SCREEN_W = SCREEN_COLS * TILE; // 320
export const SCREEN_H = SCREEN_ROWS * TILE; // 176
/** The room is 176px tall on a 180px screen: 2px of darkness above and below. */
export const VIEW_PAD_Y = (GAME_H - SCREEN_H) / 2;

export type World = 'jawia' | 'nawia';
export const WORLDS: readonly World[] = ['jawia', 'nawia'];
export const otherWorld = (w: World): World => (w === 'jawia' ? 'nawia' : 'jawia');

/** Feel tuning. Tweak freely: nothing else depends on the exact values. */
export const TUNE = {
  player: {
    speed: 84, // px/s (a classic 16-bit hero walks ~1.4 px/frame)
    accel: 1100, // px/s^2, reaches full speed in ~4-5 frames
    decel: 1500, // px/s^2, stops in ~3 frames
    hitW: 10,
    hitH: 8,
    cornerAssist: 6, // px the hero will slide to get around a corner
    attackTime: 0.24,
    attackActiveFrom: 0.03,
    attackActiveTo: 0.15,
    attackCooldown: 0.05,
    attackLunge: 46, // px/s burst at the start of a swing
    hurtInvuln: 1.1,
    knockback: 150,
    maxHp: 3,
  },
  shift: {
    cooldown: 0.22,
    revealTime: 0.42, // how long the ring takes to sweep the screen
    nudge: 5, // px the hero may be pushed to make room when shifting next to a wall
    buffer: 0.12, // input buffer (s)
  },
  camera: {
    slideTime: 0.55,
  },
  inputBuffer: 0.12,
} as const;

export const DEPTH = {
  room: 0,
  floorDecor: 5,
  entities: 10, // + y / 1000 for y-sorting
  overhead: 200,
  fxWorld: 300,
  light: 900,
  fog: 910,
  flash: 950,
} as const;
