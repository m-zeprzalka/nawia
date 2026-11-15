// Enemies belong to one world. On their side they are solid and dangerous;
// from the other side they are only an echo: you see them move, but nothing can touch.

import Phaser from 'phaser';
import { DEPTH, type World } from '../config.ts';
import { MOB } from '../art/sprites.ts';
import type { EnemyKind } from '../world/roomFormat.ts';
import { BLOCK_FLY, BLOCK_WALK, type Box, type Level } from '../world/Level.ts';

interface Spec {
  home: World;
  frame: number;
  hp: number;
  hw: number;
  hh: number;
  chase: number;
  wander: number;
  sight: number;
  mask: number;
  hover: number; // px the sprite floats above its shadow
  fps: number;
}

const SPECS: Record<EnemyKind, Spec> = {
  // utopiec: a drowned one. Slow, stubborn, walks.
  utopiec: { home: 'jawia', frame: MOB.UTOPIEC, hp: 2, hw: 6, hh: 5, chase: 31, wander: 13, sight: 92, mask: BLOCK_WALK, hover: 0, fps: 3 },
  // zjawa: a wraith. Drifts over water, weaves as it comes.
  zjawa: { home: 'nawia', frame: MOB.ZJAWA, hp: 2, hw: 5, hh: 5, chase: 39, wander: 15, sight: 110, mask: BLOCK_FLY, hover: 3, fps: 2.4 },
};

export interface Bounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

export class Enemy {
  readonly kind: EnemyKind;
  readonly home: World;
  x: number;
  y: number;
  hp: number;
  dead = false;
  /** Seconds of white flash left after being hit. */
  flash = 0;

  readonly sprite: Phaser.GameObjects.Sprite;
  readonly shadow: Phaser.GameObjects.Image;
  private readonly glow: Phaser.GameObjects.Image | null = null;

  private readonly spec: Spec;
  private readonly bounds: Bounds;
  private kx = 0;
  private ky = 0;
  private t = Math.random() * 10;
  private wanderT = 0;
  private wx = 0;
  private wy = 0;
  private rest = 0;
  private chasing = false;
  private lastSwing = -1;
  private visible: World;
  private fade = 1;

  /**
   * @param bounds the room it lives in (global px): enemies never follow you through a doorway
   */
  constructor(scene: Phaser.Scene, kind: EnemyKind, x: number, y: number, world: World, bounds: Bounds) {
    this.bounds = bounds;
    this.kind = kind;
    this.spec = SPECS[kind];
    this.home = this.spec.home;
    this.hp = this.spec.hp;
    this.x = x;
    this.y = y;
    this.visible = world;
    this.fade = world === this.home ? 1 : 0;
    this.shadow = scene.add.image(x, y, 'shadow');
    this.sprite = scene.add.sprite(x, y, 'mobs', this.spec.frame).setOrigin(0.5, 23 / 24);
    if (kind === 'zjawa')
      this.glow = scene.add.image(x, y, 'glow').setBlendMode(Phaser.BlendModes.ADD).setTint(0xb060e0).setDepth(DEPTH.fog + 1);
    this.sync();
  }

  get box(): Box {
    return { x: this.x, y: this.y, hw: this.spec.hw, hh: this.spec.hh };
  }

  /** Which world the hero is in, as far as this enemy's looks are concerned. */
  setWorldVisual(world: World): void {
    this.visible = world;
  }

  update(dt: number, level: Level, world: World, px: number, py: number, playerAlive: boolean): void {
    const s = this.spec;
    this.t += dt;
    this.flash = Math.max(0, this.flash - dt);
    this.rest = Math.max(0, this.rest - dt);
    const here = world === this.home;

    let vx = 0;
    let vy = 0;
    const dx = px - this.x;
    const dy = py - this.y;
    const dist = Math.hypot(dx, dy) || 1;
    this.chasing = here && playerAlive && dist < s.sight && this.rest <= 0;
    if (this.chasing) {
      vx = (dx / dist) * s.chase;
      vy = (dy / dist) * s.chase;
      if (this.kind === 'zjawa') {
        // wraiths never come straight at you
        const weave = Math.sin(this.t * 2.6) * 0.75;
        vx += (-dy / dist) * s.chase * weave;
        vy += (dx / dist) * s.chase * weave;
      }
    } else if (this.rest <= 0) {
      this.wanderT -= dt;
      if (this.wanderT <= 0) {
        this.wanderT = 0.8 + Math.random() * 1.8;
        if (Math.random() < 0.3) {
          this.wx = 0;
          this.wy = 0;
        } else {
          const a = Math.random() * Math.PI * 2;
          this.wx = Math.cos(a) * s.wander;
          this.wy = Math.sin(a) * s.wander;
        }
      }
      vx = this.wx;
      vy = this.wy;
    }

    const decay = Math.exp(-dt * 10);
    this.kx *= decay;
    this.ky *= decay;

    const box = this.box;
    const hit = level.move(this.home, box, (vx + this.kx) * dt, (vy + this.ky) * dt, s.mask);
    if (hit.hitX || hit.hitY) this.wanderT = Math.min(this.wanderT, 0.15);
    const b = this.bounds;
    const m = 10;
    this.x = Math.min(b.x + b.w - m, Math.max(b.x + m, box.x));
    this.y = Math.min(b.y + b.h - m, Math.max(b.y + m, box.y));
    if (this.x !== box.x || this.y !== box.y) this.wanderT = 0;

    // echoes fade in and out instead of popping
    const target = this.visible === this.home ? 1 : 0;
    this.fade += Math.sign(target - this.fade) * Math.min(Math.abs(target - this.fade), dt * 9);
    this.sync();
  }

  /** Blade contact. Returns true if this swing hurt it. */
  hit(swingId: number, fromX: number, fromY: number): boolean {
    if (this.dead || swingId === this.lastSwing) return false;
    this.lastSwing = swingId;
    this.hp--;
    this.flash = 0.1;
    this.rest = 0.25;
    this.shove(fromX, fromY, 190);
    if (this.hp <= 0) this.dead = true;
    return true;
  }

  /** Called after it touched the hero: back off for a moment. */
  recoil(fromX: number, fromY: number): void {
    this.shove(fromX, fromY, 90);
    this.rest = 0.6;
  }

  /** It ran into the raised shield: thrown back and dazed, which is the opening for a strike. */
  bash(fromX: number, fromY: number): void {
    this.shove(fromX, fromY, 210);
    this.rest = 0.85;
    this.flash = 0.06;
  }

  private shove(fromX: number, fromY: number, force: number): void {
    const d = Math.hypot(this.x - fromX, this.y - fromY) || 1;
    this.kx = ((this.x - fromX) / d) * force;
    this.ky = ((this.y - fromY) / d) * force;
  }

  sync(): void {
    const s = this.spec;
    const px = Math.round(this.x);
    const py = Math.round(this.y);
    const bob = s.hover ? Math.round(Math.sin(this.t * 3) * 1.5) : 0;
    const depth = DEPTH.entities + (this.y + s.hh) / 1000;
    // two frames of idle, a third when it lunges
    const idle = Math.floor(this.t * s.fps) % 2;
    const frame = s.frame + (this.chasing && Math.floor(this.t * s.fps * 2) % 3 === 2 ? 2 : idle);
    this.sprite.setFrame(frame).setPosition(px, py + s.hh + 2 - s.hover + bob).setDepth(depth);
    this.shadow.setPosition(px, py + s.hh - 1).setDepth(depth - 0.0005);

    const solid = this.kind === 'zjawa' ? 0.94 : 1;
    this.sprite.setAlpha(0.18 + (solid - 0.18) * this.fade);
    this.shadow.setAlpha(this.fade);
    this.glow?.setPosition(px, py - 8 + bob).setAlpha(0.3 * this.fade);
    if (this.flash > 0) this.sprite.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    else this.sprite.setTintMode(Phaser.TintModes.MULTIPLY).setTint(this.fade < 0.5 ? 0x9fb0d8 : 0xffffff);
  }

  destroy(): void {
    this.sprite.destroy();
    this.shadow.destroy();
    this.glow?.destroy();
  }
}
