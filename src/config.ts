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
    /** A blow: how far he steps into it (a burst of speed, px/s) and how much he can still walk meanwhile. */
    attackLunge: 70,
    heavyLunge: 120,
    attackMove: 0.12,
    /** After the string: a short breath; after the third blow, a longer one (s). */
    attackCooldown: 0.04,
    heavyCooldown: 0.22,
    /** A press this long before a blow can follow still counts (s); a pause this long after one keeps the string going. */
    comboBuffer: 0.32,
    comboWindow: 0.28,
    /** What the blows do: the first two, then the heavy third. */
    strikeKnock: 150,
    heavyKnock: 280,
    heavyDamage: 2,
    strikeHitstop: 0.055,
    heavyHitstop: 0.11,
    /** A blow with no direction held turns to a foe this close (px). */
    aimReach: 34,
    hurtInvuln: 1.0,
    knockback: 175,
    /** Health is counted in half hearts. */
    maxHp: 6,
    /** What a blow from an enemy costs (half hearts). */
    enemyDamage: 2,
    guardSpeed: 0.45, // walking speed behind the raised shield
    guardArc: 0.2, // how squarely he must face a blow to stop it (dot product)
    /** A blow caught within this long of raising the shield staggers the attacker for longer (s). */
    perfectGuard: 0.2,
    /** What a wisp's fire or a soul orb costs (half hearts). */
    shotDamage: 1,
    /** The roll: a quick forward roll with a little hop; untouchable in the tuck (the `safe` frames in the layout). */
    rollSpeed: 230, // px/s off the mark; he slows as he comes out of it (about 50 px in all)
    rollHeight: 3, // px he leaves the ground at the top of the hop
    rollCooldown: 0.16,
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
