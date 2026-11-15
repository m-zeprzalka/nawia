// Art direction in one file.
//
// JAWIA is here and now: wet, heavy, material. Warm stone, moss, rotten wood, firelight.
//   Surfaces are light, the gaps between them are dark.
// NAWIA is the world of spirits: weightless, luminous, quiet. The stronghold as the dead remember it.
//   Surfaces are dark, the gaps between them glow. Beyond the walls there is no earth, only stars.
//
// Both palettes have identical keys, so every tile is drawn by one function and two sets of colours.
// Ramps go from darkest [0] to lightest.

import type { World } from '../config.ts';
import { rgb, type Color } from '../core/PixelBuffer.ts';

const ramp = (...hex: number[]): Color[] => hex.map((h) => rgb(h));

export interface WorldPalette {
  /** what lies beyond the walls: packed earth / the starry void */
  top: Color[];
  /** the edge of a wall top, inner -> outer */
  rim: Color[];
  /** wall faces */
  stone: Color[];
  floor: Color[];
  /** moss and weeds / spirit lichen and glowing glyphs */
  growth: Color[];
  /** bog water / the abyss */
  water: Color[];
  /** bridge material: rotten planks / slabs of light */
  wood: Color[];
  /** loose stone and carved props */
  rock: Color[];
  /** flames, hottest first */
  fire: Color[];
  /** signature colour of this world (ring edge, cracks in the border, UI) */
  accent: Color;
  accentSoft: Color;
  accentDeep: Color;
  outline: Color;
}

export const PAL: Record<World, WorldPalette> = {
  jawia: {
    top: ramp(0x15111b, 0x1d1824, 0x29222e, 0x372d38),
    rim: ramp(0x3a3040, 0x5d4e52, 0x86725f),
    stone: ramp(0x231b29, 0x372a37, 0x514049, 0x6e5955, 0x8f7761, 0xb29873, 0xd6bf8f),
    floor: ramp(0x1c1d28, 0x282b36, 0x363b46, 0x464d55, 0x586166, 0x6d7674),
    growth: ramp(0x1d3125, 0x2d502f, 0x487834, 0x79a440, 0xb6d064),
    water: ramp(0x0a1a28, 0x0f2e3d, 0x174856, 0x286e76, 0x5ea89c, 0xbbe0c6),
    wood: ramp(0x23161a, 0x3e2520, 0x5e3a29, 0x845734, 0xad7f48, 0xd6ac68),
    rock: ramp(0x211b25, 0x3a3037, 0x594c4d, 0x7b6b63, 0xa08f79, 0xc8b793),
    fire: ramp(0xfff4b8, 0xffc64a, 0xf08c26, 0xc24e1c, 0x74261a),
    accent: rgb(0xffcf6a), accentSoft: rgb(0xc98a2e), accentDeep: rgb(0x7a4a1c),
    outline: rgb(0x130e18),
  },
  nawia: {
    top: ramp(0x04050d, 0x070917, 0x0b0e22, 0x121632),
    rim: ramp(0x10304e, 0x1e6c8a, 0x8ef0ee),
    stone: ramp(0x080a1b, 0x0f1336, 0x171d4f, 0x212a6c, 0x314094, 0x4a60c0, 0x7c98ec),
    floor: ramp(0x090b1e, 0x0f1330, 0x151a42, 0x1d2456, 0x28326e, 0x35438c),
    growth: ramp(0x113850, 0x1e6c8a, 0x3db6c6, 0x8ef0ee, 0xdcffff),
    water: ramp(0x03040c, 0x06091a, 0x0c112e, 0x171f4c, 0x6a7fd0, 0xdce6ff),
    wood: ramp(0x18225a, 0x2e46a0, 0x5d7dd6, 0x98b6f4, 0xcfe3ff, 0xf5fbff),
    rock: ramp(0x0d102e, 0x191f4e, 0x293376, 0x3f4fa6, 0x6177ce, 0x93adf0),
    fire: ramp(0xf4ffff, 0xa8f6ff, 0x4cb8ec, 0x2c66c0, 0x1c2f80),
    accent: rgb(0x9af4ff), accentSoft: rgb(0x3db6c6), accentDeep: rgb(0x1e6c8a),
    outline: rgb(0x03040c),
  },
};

/** Colours shared by both worlds: the hero, steel, bone, hearts, souls. */
export const INK = {
  outline: rgb(0x1a1423),
  white: rgb(0xffffff),
  // hero
  hair: rgb(0x6b4630), hairDark: rgb(0x47301f), hairLight: rgb(0x8d6240),
  skin: rgb(0xf2c9a2), skinDark: rgb(0xcb9370),
  band: rgb(0xc8343c), bandDark: rgb(0x8d2436),
  tunic: rgb(0xe8dfc8), tunicDark: rgb(0xb7ab94), tunicDeep: rgb(0x8a7f70),
  cloak: rgb(0xb42f3b), cloakDark: rgb(0x7c2032), cloakLight: rgb(0xdb5549),
  belt: rgb(0x6a4a30), buckle: rgb(0xe6b450),
  trousers: rgb(0x3d4b5c), trousersDark: rgb(0x2a3443),
  boot: rgb(0x5c3b2a), bootDark: rgb(0x3a2620),
  eye: rgb(0x2b1f30),
  steel: rgb(0xe2ecf0), steelMid: rgb(0xa9bac6), steelDark: rgb(0x6b7b8c),
  bronze: rgb(0xd8a84a), bronzeDark: rgb(0x8f6a2c),
  shieldRed: rgb(0xc2343a), shieldRedDark: rgb(0x8c2434), shieldCream: rgb(0xeadfc4), shieldCreamDark: rgb(0xb9ac90),
  shieldRim: rgb(0x7a5230), shieldRimDark: rgb(0x4a3020),
  iron: rgb(0xb9c4cc), ironMid: rgb(0x7c8796), ironDark: rgb(0x3a4252), ironDeep: rgb(0x171a22),
  bone: rgb(0xe6dfc8), boneMid: rgb(0xb0a68e), boneDark: rgb(0x766c5c),
  // hearts
  heart: rgb(0xe23d4c), heartLight: rgb(0xff8a80), heartDark: rgb(0x8a1f36), heartEmpty: rgb(0x3a2f42),
  // souls: violet, so they never read as "just more cyan"
  soul: ramp(0x3a1e5e, 0x6a2f96, 0xa84fc8, 0xe08ae8, 0xffd8ff),
} as const;
