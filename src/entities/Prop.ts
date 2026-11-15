// Things that stand in a room: fires, inscribed stones, the gate, the bell.
// Most of them look different depending on which world you see them from.

import Phaser from 'phaser';
import { DEPTH, TILE, type World } from '../config.ts';
import { OBJ } from '../art/sprites.ts';
import type { LightSource, RGB } from '../fx/Lighting.ts';
import type { Bilingual, ObjectDef } from '../world/roomFormat.ts';

export type PropKind = 'brazier' | 'torch' | 'sign' | 'gate' | 'bell';

const FIRE: Record<World, RGB> = { jawia: [1.0, 0.7, 0.4], nawia: [0.42, 0.82, 1.0] };
const FIRE_TINT: Record<World, number> = { jawia: 0xffa040, nawia: 0x60c8ff };

export class Prop {
  readonly kind: PropKind;
  readonly tx: number;
  readonly ty: number;
  /** Centre of the tile, global px. */
  readonly x: number;
  readonly y: number;
  readonly text: Record<World, Bilingual | null> | null;
  open = false;

  readonly sprite: Phaser.GameObjects.Sprite;
  private readonly glow: Phaser.GameObjects.Image | null = null;
  private world: World;
  private t = Math.random() * 10;
  private readonly phase = Math.random() * 20;
  private swing = -1;

  constructor(scene: Phaser.Scene, def: Exclude<ObjectDef, { kind: 'enemy' }>, ox: number, oy: number, world: World) {
    this.kind = def.kind;
    this.tx = def.tx;
    this.ty = def.ty;
    this.x = ox + def.tx * TILE + TILE / 2;
    this.y = oy + def.ty * TILE + TILE / 2;
    this.world = world;
    this.text = def.kind === 'sign' ? def.text : null;

    const bottom = oy + (def.ty + 1) * TILE;
    this.sprite = scene.add.sprite(this.x, bottom, 'objects', 0).setOrigin(0.5, 1);
    // floor props sort with characters; wall torches and gates are part of the architecture
    if (def.kind === 'torch') this.sprite.setDepth(DEPTH.floorDecor).setY(bottom - 1);
    else if (def.kind === 'gate') this.sprite.setDepth(DEPTH.entities + (bottom - 12) / 1000);
    else this.sprite.setDepth(DEPTH.entities + (bottom - 3) / 1000);

    if (def.kind === 'brazier' || def.kind === 'torch') {
      this.glow = scene.add
        .image(this.x, bottom - (def.kind === 'brazier' ? 15 : 14), 'glow')
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(DEPTH.fog + 1)
        .setAlpha(0.35);
    }
    this.apply();
  }

  /** Where light comes from, if this thing shines in the current world. */
  light(): LightSource | null {
    const w = this.world;
    switch (this.kind) {
      case 'brazier':
        return { x: this.x, y: this.y - 8, radius: 84, color: FIRE[w], intensity: 0.78, flicker: 1, phase: this.phase };
      case 'torch':
        return { x: this.x, y: this.y + 6, radius: 66, color: FIRE[w], intensity: 0.7, flicker: 1, phase: this.phase };
      case 'sign':
        return w === 'nawia' ? { x: this.x, y: this.y, radius: 30, color: [0.35, 0.9, 0.85], intensity: 0.4, flicker: 0.4, phase: this.phase } : null;
      case 'bell':
        return { x: this.x, y: this.y - 4, radius: 46, color: [1.0, 0.82, 0.5], intensity: this.swing >= 0 ? 0.9 : 0.42, flicker: 0.3, phase: this.phase };
      default:
        return null;
    }
  }

  setWorld(world: World): void {
    if (world === this.world) return;
    this.world = world;
    this.apply();
  }

  setOpen(open: boolean): void {
    this.open = open;
    this.apply();
  }

  /** Start the bell swinging. */
  ring(): void {
    this.swing = 0;
  }

  update(dt: number): void {
    this.t += dt;
    if (this.swing >= 0) {
      this.swing += dt;
      if (this.swing > 2.4) this.swing = -1;
    }
    this.apply();
  }

  private apply(): void {
    const nawia = this.world === 'nawia';
    const row = nawia ? OBJ.ROW_NAWIA : 0;
    const f = Math.floor(this.t * 9) % 4;
    switch (this.kind) {
      case 'brazier':
        this.sprite.setFrame(row + OBJ.BRAZIER + f);
        break;
      case 'torch':
        this.sprite.setFrame(row + OBJ.TORCH + f);
        break;
      case 'sign':
        this.sprite.setFrame(nawia ? OBJ.SIGN_N : OBJ.SIGN_J);
        break;
      case 'gate':
        this.sprite.setFrame(this.open ? OBJ.GATE_OPEN : OBJ.GATE);
        break;
      case 'bell': {
        let frame: number = OBJ.BELL;
        if (this.swing >= 0) {
          const s = Math.sin(this.swing * 11) * Math.exp(-this.swing * 1.4);
          frame = s > 0.25 ? OBJ.BELL_R : s < -0.25 ? OBJ.BELL_L : OBJ.BELL;
        }
        this.sprite.setFrame(frame);
        break;
      }
    }
    if (this.glow) {
      this.glow.setTint(FIRE_TINT[this.world]);
      this.glow.setAlpha(0.3 + 0.06 * Math.sin(this.t * 13 + this.phase));
    }
  }

  destroy(): void {
    this.sprite.destroy();
    this.glow?.destroy();
  }
}
