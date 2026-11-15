// Harmless animals of the living world. They wander, and get out of the way.
// In Nawia they are only an echo, like everything else that lives.

import Phaser from 'phaser';
import { DEPTH, type World } from '../config.ts';
import { MOB } from '../art/actors.ts';
import { BLOCK_WALK, type Box, type Level } from '../world/Level.ts';
import type { Bounds } from './Enemy.ts';

export class Critter {
  x: number;
  y: number;
  /** True for the frame in which it took fright (the scene makes it cluck). */
  startled = false;

  private readonly sprite: Phaser.GameObjects.Sprite;
  private readonly shadow: Phaser.GameObjects.Image;
  private readonly bounds: Bounds;
  private vx = 0;
  private vy = 0;
  private t = Math.random() * 10;
  private think = Math.random() * 2;
  private fleeing = 0;
  private faceLeft = Math.random() < 0.5;
  private fade: number;

  constructor(scene: Phaser.Scene, x: number, y: number, world: World, bounds: Bounds) {
    this.x = x;
    this.y = y;
    this.bounds = bounds;
    this.fade = world === 'jawia' ? 1 : 0;
    this.shadow = scene.add.image(x, y, 'shadow').setScale(0.7);
    this.sprite = scene.add.sprite(x, y, 'mobs', MOB.HEN).setOrigin(0.5, 1);
    this.sync();
  }

  get box(): Box {
    return { x: this.x, y: this.y, hw: 4, hh: 3 };
  }

  /** Something frightening happened at (fromX, fromY): run the other way. */
  scare(fromX: number, fromY: number): void {
    const d = Math.hypot(this.x - fromX, this.y - fromY) || 1;
    this.vx = ((this.x - fromX) / d) * 74;
    this.vy = ((this.y - fromY) / d) * 74;
    if (this.fleeing <= 0) this.startled = true;
    this.fleeing = 0.7;
  }

  update(dt: number, level: Level, world: World, px: number, py: number): void {
    this.t += dt;
    this.startled = false;
    this.fleeing = Math.max(0, this.fleeing - dt);
    // the living do not see what walks in Nawia, and hens are no exception
    if (world === 'jawia' && Math.hypot(px - this.x, py - this.y) < 20) this.scare(px, py);
    if (this.fleeing <= 0) {
      this.think -= dt;
      if (this.think <= 0) {
        this.think = 0.6 + Math.random() * 2.2;
        if (Math.random() < 0.45) {
          this.vx = 0;
          this.vy = 0;
        } else {
          const a = Math.random() * Math.PI * 2;
          this.vx = Math.cos(a) * 16;
          this.vy = Math.sin(a) * 16;
        }
      }
    }
    if (Math.abs(this.vx) > 2) this.faceLeft = this.vx < 0;
    const box = this.box;
    const hit = level.move('jawia', box, this.vx * dt, this.vy * dt, BLOCK_WALK);
    if (hit.hitX || hit.hitY) this.think = 0;
    const b = this.bounds;
    this.x = Math.min(b.x + b.w - 12, Math.max(b.x + 12, box.x));
    this.y = Math.min(b.y + b.h - 12, Math.max(b.y + 12, box.y));
    const target = world === 'jawia' ? 1 : 0;
    this.fade += Math.sign(target - this.fade) * Math.min(Math.abs(target - this.fade), dt * 9);
    this.sync();
  }

  private sync(): void {
    const moving = Math.abs(this.vx) + Math.abs(this.vy) > 2;
    const px = Math.round(this.x);
    const py = Math.round(this.y);
    const depth = DEPTH.entities + (this.y + 3) / 1000;
    const hop = this.fleeing > 0 ? -Math.abs(Math.round(Math.sin(this.t * 22) * 2)) : 0;
    this.sprite
      .setFrame(MOB.HEN + (moving ? Math.floor(this.t * (this.fleeing > 0 ? 14 : 6)) % 2 : 0))
      .setFlipX(this.faceLeft)
      .setPosition(px, py + 4 + hop)
      .setDepth(depth)
      .setAlpha(0.2 + 0.8 * this.fade);
    this.shadow.setPosition(px, py + 3).setDepth(depth - 0.0005).setAlpha(this.fade);
    if (this.fade < 0.5) this.sprite.setTint(0x9fb0d8);
    else this.sprite.clearTint();
  }

  destroy(): void {
    this.sprite.destroy();
    this.shadow.destroy();
  }
}
