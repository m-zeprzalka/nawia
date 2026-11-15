// Things that fly at the hero: a wisp's fire (Jawia) and the guardian's soul orbs (Nawia).
// A raised shield stops them; a wisp's own fire is sent back at the wisp.

import Phaser from 'phaser';
import { DEPTH, type World } from '../config.ts';
import { SHOT } from '../art/actors.ts';
import { BLOCK_FLY, type Box, type Level } from '../world/Level.ts';
import type { Enemy } from './Enemy.ts';

export type ShotKind = 'wisp' | 'soul';

const TINT: Record<ShotKind, number> = { wisp: 0x8ee04a, soul: 0xd070f0 };
let uid = 0;

export class Shot {
  /** Unique, so a shot can only hurt a given enemy once. */
  readonly id = ++uid;
  readonly kind: ShotKind;
  readonly home: World;
  /** Who spat it. */
  readonly owner: Enemy | null;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Turned by the shield: from now on it only hurts enemies. */
  friendly = false;
  dead = false;

  private readonly sprite: Phaser.GameObjects.Sprite;
  private readonly glow: Phaser.GameObjects.Image;
  private life = 7;
  private t = Math.random();

  constructor(scene: Phaser.Scene, kind: ShotKind, home: World, x: number, y: number, vx: number, vy: number, owner: Enemy | null = null) {
    this.kind = kind;
    this.home = home;
    this.owner = owner;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.sprite = scene.add.sprite(x, y, 'shots', kind === 'wisp' ? SHOT.WISP : SHOT.SOUL).setDepth(DEPTH.fxWorld);
    this.glow = scene.add.image(x, y, 'glow').setBlendMode(Phaser.BlendModes.ADD).setTint(TINT[kind]).setScale(0.5).setDepth(DEPTH.fog + 1);
  }

  get box(): Box {
    return { x: this.x, y: this.y, hw: 3, hh: 3 };
  }

  update(dt: number, level: Level, world: World): void {
    this.t += dt;
    this.life -= dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.life <= 0 || level.blocked(this.home, this.x, this.y, 2, 2, BLOCK_FLY)) this.dead = true;
    this.sync(world);
  }

  /** Off the shield and back: at whoever spat it, or simply the way it came. */
  reflect(): void {
    this.friendly = true;
    this.life = 4;
    let dx = -this.vx;
    let dy = -this.vy;
    if (this.owner && !this.owner.dead) {
      dx = this.owner.x - this.x;
      dy = this.owner.y - 3 - this.y;
    }
    const d = Math.hypot(dx, dy) || 1;
    this.vx = (dx / d) * 170;
    this.vy = (dy / d) * 170;
  }

  sync(world: World): void {
    const base = this.kind === 'wisp' ? SHOT.WISP : SHOT.SOUL;
    const seen = world === this.home ? 1 : 0.14;
    this.sprite.setFrame(base + (Math.floor(this.t * 12) % 2)).setPosition(Math.round(this.x), Math.round(this.y)).setAlpha(seen);
    if (this.friendly) this.sprite.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    this.glow.setPosition(Math.round(this.x), Math.round(this.y)).setAlpha(0.5 * seen);
  }

  destroy(): void {
    this.sprite.destroy();
    this.glow.destroy();
  }
}
