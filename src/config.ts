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
    /** Health is counted in half hearts. */
    maxHp: 6,
    /** What a blow from an enemy costs (half hearts). */
    enemyDamage: 2,
    guardSpeed: 0.45, // walking speed behind the raised shield
    guardArc: 0.2, // how squarely he must face a blow to stop it (dot product)
    /** What a wisp's fire or a soul orb costs (half hearts). */
    shotDamage: 1,
    /** The dodge: a quick hop that nothing can touch while he is in the air. */
    dodgeSpeed: 200, // px/s
    dodgeTime: 0.26,
    dodgeSafe: 0.22, // seconds of it nothing can hurt him
    dodgeHeight: 5, // px he leaves the ground at the top of the hop
    dodgeCooldown: 0.45,
  },
  /** The guardian. Three phases of `hitsPerPhase` blows each. */
  boss: {
    hp: 9,
    hitsPerPhase: 3,
    stalkSpeed: [24, 28, 32],
    stalkTime: [1.5, 1.15, 0.85], // seconds of walking before each charge
    windup: [0.7, 0.6, 0.5],
    chargeSpeed: [185, 215, 245],
    stun: [3.6, 3.2, 2.8], // how long the heart lies bare after it hits a wall
    orbEvery: [1.7, 1.45, 1.2], // the heart shoots at anyone who lingers in Nawia
    orbCount: [1, 3, 5],
    orbSpeed: [58, 66, 74],
    damage: 2,
  },
  shift: {
    cooldown: 0.22,
    revealTime: 0.42, // how long the ring takes to sweep the screen
    nudge: 5, // px the hero may be pushed to make room when shifting next to a wall
    buffer: 0.12, // input buffer (s)
    /** Turning the stone where something stands on the other side costs this (half hearts)... */
    rejectDamage: 1,
    /** ...and throws him back to where he entered the room, after this long. */
    rejectTime: 0.55,
    /**
     * How long an afterimage of the world he just left stays visible. 0 = off:
     * the layout of the other side has to be remembered, not read off the screen.
     */
    afterimage: 0 as number,
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
