// Things that stand in a room: fires, inscribed stones, the gate, the bell, urns, idols, souls.
// Most of them look different depending on which world you see them from.

import Phaser from 'phaser';
import { DEPTH, TILE, type World } from '../config.ts';
import { OBJ } from '../art/sprites.ts';
import { hash2 } from '../core/rng.ts';
import type { LightSource, RGB } from '../fx/Lighting.ts';
import type { Bilingual, ObjectDef } from '../world/roomFormat.ts';

export type PropKind = 'brazier' | 'torch' | 'sign' | 'gate' | 'bell' | 'urn' | 'idol' | 'pillar' | 'soul';

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
  /** Gate: open. Urn: smashed. */
  open = false;
  /** Urns only: is there a heart inside? Fixed per urn, so players can learn which ones to break. */
  readonly holdsHeart: boolean;

  readonly sprite: Phaser.GameObjects.Sprite;
  private readonly glow: Phaser.GameObjects.Image | null = null;
  private readonly bottom: number;
  private readonly variant: number;
  private world: World;
  private t = Math.random() * 10;
  private readonly phase = Math.random() * 20;
  private swing = -1;
  private near = 0;

  constructor(scene: Phaser.Scene, def: Exclude<ObjectDef, { kind: 'enemy' }>, ox: number, oy: number, world: World) {
    this.kind = def.kind;
    this.tx = def.tx;
    this.ty = def.ty;
    this.x = ox + def.tx * TILE + TILE / 2;
    this.y = oy + def.ty * TILE + TILE / 2;
    this.world = world;
    this.text = def.kind === 'sign' ? def.text : null;
    const h = hash2(Math.round(this.x), Math.round(this.y), 5);
    this.variant = h % 3;
    this.holdsHeart = def.kind === 'urn' && (h >>> 4) % 5 < 2;

    this.bottom = oy + (def.ty + 1) * TILE;
    this.sprite = scene.add.sprite(this.x, this.bottom, 'objects', 0).setOrigin(0.5, 1);
    // floor props sort with characters; wall torches and gates are part of the architecture
    if (def.kind === 'torch') this.sprite.setDepth(DEPTH.floorDecor).setY(this.bottom - 1);
    else if (def.kind === 'gate') this.sprite.setDepth(DEPTH.entities + (this.bottom - 12) / 1000);
    else this.sprite.setDepth(DEPTH.entities + (this.bottom - 3) / 1000);

    if (def.kind === 'brazier' || def.kind === 'torch' || def.kind === 'soul') {
      this.glow = scene.add
        .image(this.x, this.bottom - (def.kind === 'brazier' ? 17 : def.kind === 'torch' ? 15 : 12), 'glow')
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(DEPTH.fog + 1)
        .setAlpha(0.35);
    }
    this.apply();
  }

  /** Does it stand in the way? */
  get solid(): boolean {
    return this.kind !== 'torch' && this.kind !== 'soul' && !(this.kind === 'urn' && this.open) && !(this.kind === 'gate' && this.open);
  }

  /** Where light comes from, if this thing shines in the current world. */
  light(): LightSource | null {
    const w = this.world;
    switch (this.kind) {
      case 'brazier':
        return { x: this.x, y: this.y - 8, radius: 88, color: FIRE[w], intensity: 0.8, flicker: 1, phase: this.phase };
      case 'torch':
        return { x: this.x, y: this.y + 6, radius: 68, color: FIRE[w], intensity: 0.72, flicker: 1, phase: this.phase };
      case 'sign':
        return w === 'nawia' ? { x: this.x, y: this.y, radius: 30, color: [0.35, 0.9, 0.85], intensity: 0.4, flicker: 0.4, phase: this.phase } : null;
      case 'idol':
        return w === 'nawia' ? { x: this.x, y: this.y - 10, radius: 40, color: [0.4, 0.95, 0.95], intensity: 0.5, flicker: 0.3, phase: this.phase } : null;
      case 'soul':
        return w === 'nawia' ? { x: this.x, y: this.y - 4, radius: 26, color: [0.8, 0.5, 1.0], intensity: 0.34, flicker: 0.5, phase: this.phase } : null;
      case 'gate':
        // a glint on the iron, so the way out can be found in the dark
        return { x: this.x, y: this.y, radius: 26, color: [0.75, 0.8, 0.95], intensity: this.open ? 0.5 : 0.3 };
      case 'bell':
        return { x: this.x, y: this.y - 4, radius: 48, color: [1.0, 0.82, 0.5], intensity: this.swing >= 0 ? 0.9 : 0.42, flicker: 0.3, phase: this.phase };
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

  /** @param px,py where the hero is: souls thin out when he walks through them */
  update(dt: number, px: number, py: number): void {
    this.t += dt;
    if (this.swing >= 0) {
      this.swing += dt;
      if (this.swing > 2.4) this.swing = -1;
    }
    if (this.kind === 'soul') {
      const close = Math.hypot(px - this.x, py - this.y) < 15 ? 1 : 0;
      this.near += Math.sign(close - this.near) * Math.min(Math.abs(close - this.near), dt * 5);
    }
    this.apply();
  }

  private apply(): void {
    const nawia = this.world === 'nawia';
    const row = nawia ? OBJ.ROW_NAWIA : 0;
    const f = Math.floor(this.t * 9) % 4;
    const s = this.sprite;
    switch (this.kind) {
      case 'brazier':
        s.setFrame(row + OBJ.BRAZIER + f);
        break;
      case 'torch':
        s.setFrame(row + OBJ.TORCH + f);
        break;
      case 'sign':
        s.setFrame(nawia ? OBJ.SIGN_N : OBJ.SIGN_J);
        break;
      case 'gate':
        s.setFrame(this.open ? OBJ.GATE_OPEN : OBJ.GATE);
        break;
      case 'urn':
        s.setFrame(nawia ? OBJ.URN_N : OBJ.URN_J).setVisible(!this.open);
        break;
      case 'idol':
        s.setFrame(nawia ? OBJ.IDOL_N : OBJ.IDOL_J);
        break;
      case 'pillar':
        s.setFrame(nawia ? OBJ.PILLAR_N : OBJ.PILLAR_J);
        break;
      case 'soul':
        // the living see what is left of them; the dead see them standing there
        if (nawia) {
          const bob = Math.round(Math.sin(this.t * 1.7 + this.phase) * 1.2);
          const a = (0.5 + 0.1 * Math.sin(this.t * 3.1 + this.phase)) * (1 - this.near * 0.6);
          s.setFrame(OBJ.SOUL + this.variant).setAlpha(a).setY(this.bottom - 2 + bob).setDepth(DEPTH.entities + (this.bottom - 3) / 1000);
        } else {
          s.setFrame(OBJ.BONES).setAlpha(1).setY(this.bottom).setDepth(DEPTH.floorDecor);
        }
        break;
      case 'bell': {
        let frame: number = OBJ.BELL;
        if (this.swing >= 0) {
          const k = Math.sin(this.swing * 11) * Math.exp(-this.swing * 1.4);
          frame = k > 0.25 ? OBJ.BELL_R : k < -0.25 ? OBJ.BELL_L : OBJ.BELL;
        }
        s.setFrame(frame);
        break;
      }
    }
    if (this.glow) {
      if (this.kind === 'soul') this.glow.setTint(0xa050e0).setAlpha(nawia ? 0.22 * (1 - this.near * 0.6) : 0);
      else this.glow.setTint(FIRE_TINT[this.world]).setAlpha(0.3 + 0.06 * Math.sin(this.t * 13 + this.phase));
    }
  }

  destroy(): void {
    this.sprite.destroy();
    this.glow?.destroy();
  }
}
