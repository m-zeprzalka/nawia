// Two palettes with identical keys: every tile is drawn once, with either one.
// Jawia = the ruined present (warm stone, moss, firelight).
// Nawia = the stronghold as the dead remember it (cold, intact, faintly luminous).

import type { World } from '../config.ts';
import { rgb, type Color } from '../core/PixelBuffer.ts';

export interface WorldPalette {
  // wall tops (seen from above)
  top: Color; topNoise: Color; rim: Color; rimLight: Color;
  // wall faces (seen from the front)
  brick: Color; brickLight: Color; brickDark: Color; mortar: Color; plinth: Color; plinthDark: Color;
  // floor slabs
  floor: Color; floorLight: Color; floorLighter: Color; floorDark: Color; floorDarker: Color;
  // accents that grow on / glow in the stone
  growth: Color; growthLight: Color; growthDark: Color;
  // water (Jawia) / the starry abyss (Nawia)
  water: Color; waterMid: Color; waterLight: Color; waterSpark: Color;
  // bridges
  plank: Color; plankLight: Color; plankDark: Color; plankEdge: Color;
  // loose stone
  rock: Color; rockLight: Color; rockDark: Color; rockEdge: Color;
  // flames
  fire0: Color; fire1: Color; fire2: Color; fire3: Color;
  // signature colour of this world (ring edge, echoes, UI)
  accent: Color; accentSoft: Color;
  outline: Color;
}

export const PAL: Record<World, WorldPalette> = {
  jawia: {
    top: rgb(0x16141d), topNoise: rgb(0x1e1b27), rim: rgb(0x3b3644), rimLight: rgb(0x5b5362),
    brick: rgb(0x6d6059), brickLight: rgb(0x8a7a6c), brickDark: rgb(0x51464a), mortar: rgb(0x362f37),
    plinth: rgb(0x483f45), plinthDark: rgb(0x2a252d),
    floor: rgb(0x474853), floorLight: rgb(0x54555f), floorLighter: rgb(0x63636b), floorDark: rgb(0x35363f), floorDarker: rgb(0x292a33),
    growth: rgb(0x4c7a3c), growthLight: rgb(0x76a34a), growthDark: rgb(0x33562e),
    water: rgb(0x112b36), waterMid: rgb(0x184350), waterLight: rgb(0x2a6470), waterSpark: rgb(0x6fb3a6),
    plank: rgb(0x71503a), plankLight: rgb(0x93704a), plankDark: rgb(0x4c3429), plankEdge: rgb(0x2c1f1e),
    rock: rgb(0x7b7068), rockLight: rgb(0xa0937f), rockDark: rgb(0x574e4c), rockEdge: rgb(0x2e282c),
    fire0: rgb(0xfff0a8), fire1: rgb(0xffb43a), fire2: rgb(0xe2601e), fire3: rgb(0x8e2c18),
    accent: rgb(0xffcf6a), accentSoft: rgb(0xc98f3e),
    outline: rgb(0x15121b),
  },
  nawia: {
    top: rgb(0x0c0f24), topNoise: rgb(0x121633), rim: rgb(0x2c3868), rimLight: rgb(0x4f66a8),
    brick: rgb(0x47528a), brickLight: rgb(0x6474b4), brickDark: rgb(0x333b6c), mortar: rgb(0x20254a),
    plinth: rgb(0x2c3360), plinthDark: rgb(0x191d3d),
    floor: rgb(0x2b3156), floorLight: rgb(0x363e69), floorLighter: rgb(0x454f80), floorDark: rgb(0x212645), floorDarker: rgb(0x181c38),
    growth: rgb(0x3fb7b0), growthLight: rgb(0x9af4e4), growthDark: rgb(0x26707c),
    water: rgb(0x080a1c), waterMid: rgb(0x121738), waterLight: rgb(0x2a3470), waterSpark: rgb(0xb9c8ff),
    plank: rgb(0x8fa8e6), plankLight: rgb(0xcfe2ff), plankDark: rgb(0x5a6fc0), plankEdge: rgb(0x2a3470),
    rock: rgb(0x55609c), rockLight: rgb(0x7b8cd0), rockDark: rgb(0x38407a), rockEdge: rgb(0x1a1e42),
    fire0: rgb(0xf2ffff), fire1: rgb(0x9af4ff), fire2: rgb(0x46b0e8), fire3: rgb(0x2b5cb4),
    accent: rgb(0x9af4ff), accentSoft: rgb(0x4f8fd8),
    outline: rgb(0x080a1c),
  },
};

/** Shared sprite colours (the heroine looks the same on both sides). */
export const INK = {
  outline: rgb(0x1a1423),
  white: rgb(0xffffff),
  black: rgb(0x000000),
  // heroine
  scarf: rgb(0xc9323e), scarfLight: rgb(0xee6055), scarfDark: rgb(0x8a1f36),
  skin: rgb(0xf4c9a4), skinDark: rgb(0xcf987a),
  hair: rgb(0xe9bb52), hairDark: rgb(0xb3802f),
  blouse: rgb(0xeee8de), blouseDark: rgb(0xb5aebb),
  bodice: rgb(0x2f5d4a), bodiceDark: rgb(0x1f4138),
  skirt: rgb(0x8c2f3c), skirtDark: rgb(0x64223a),
  boot: rgb(0x4e3329),
  eye: rgb(0x2b1f30),
  steel: rgb(0xdfe9ee), steelDark: rgb(0x8fa3b6),
  // hearts
  heart: rgb(0xe23d4c), heartLight: rgb(0xff8a80), heartDark: rgb(0x8a1f36), heartEmpty: rgb(0x3a2f42),
} as const;
