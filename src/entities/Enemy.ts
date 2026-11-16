// Enemies belong to one world. On their side they are solid and dangerous;
// from the other side they are only an echo: you see them move, but nothing can touch.
//
// Every kind warns before it strikes (a wind-up you can read), then commits:
//   utopiec  - Jawia. Wades towards you, crouches, lunges.
//   zjawa    - Nawia. Circles, then swoops straight through you. Flies over water.
//   ognik    - Jawia. Hangs where it is (often over water) and spits fire. A raised shield sends the fire back.
//   strzyga  - has two souls. Kill the body in Jawia and the second soul gets up in Nawia.
//   dzik     - Jawia. A boar: paws the ground, then charges a long way in a straight line. A wall stops it cold.
//   wilk     - Jawia. A blighted wolf: circles on the ground like a wraith does in the air, lunges, backs off.
//   morownik - Jawia. A blight bloom: rooted. Opens and spits three thorns; the blade reaches it, the shield stops the thorns.

import Phaser from 'phaser';
import { DEPTH, otherWorld, type World } from '../config.ts';
import { MOB } from '../art/actors.ts';
import { GAME_BEASTS, beastFrameOf, beastKey } from '../art/gameBeasts.ts';
import type { EnemyKind } from '../world/roomFormat.ts';
import { BLOCK_FLY, BLOCK_WALK, type Box, type Level } from '../world/Level.ts';

interface Spec {
  home: World;
  frame: number;
  hp: number;
  hw: number;
  hh: number;
  speed: number;
  wander: number;
  sight: number;
  mask: number;
  hover: number; // px the sprite floats above its shadow
  fps: number;
  reach: number; // how close before it commits to an attack
  windup: number; // seconds of warning
  dash: number; // speed of the attack itself
  dashTime: number;
  rest: number; // seconds of catching its breath afterwards
  cooldown: number;
  glow: number; // tint of its halo, 0 = none
}

const SPECS: Record<EnemyKind, Spec> = {
  utopiec: {
    home: 'jawia', frame: MOB.UTOPIEC, hp: 3, hw: 6, hh: 5, speed: 40, wander: 14, sight: 112, mask: BLOCK_WALK, hover: 0, fps: 3,
    reach: 46, windup: 0.42, dash: 165, dashTime: 0.26, rest: 0.7, cooldown: 1.5, glow: 0,
  },
  zjawa: {
    home: 'nawia', frame: MOB.ZJAWA, hp: 2, hw: 5, hh: 5, speed: 58, wander: 16, sight: 132, mask: BLOCK_FLY, hover: 3, fps: 2.4,
    reach: 72, windup: 0.34, dash: 150, dashTime: 0.5, rest: 0.55, cooldown: 1.2, glow: 0xb060e0,
  },
  ognik: {
    home: 'jawia', frame: MOB.OGNIK, hp: 1, hw: 5, hh: 5, speed: 0, wander: 0, sight: 150, mask: BLOCK_FLY, hover: 4, fps: 8,
    reach: 150, windup: 0.5, dash: 0, dashTime: 0, rest: 0.3, cooldown: 2.4, glow: 0x8ee04a,
  },
  strzyga: {
    home: 'jawia', frame: MOB.STRZYGA, hp: 3, hw: 6, hh: 5, speed: 62, wander: 20, sight: 140, mask: BLOCK_WALK, hover: 0, fps: 4,
    reach: 58, windup: 0.26, dash: 215, dashTime: 0.24, rest: 0.45, cooldown: 1.2, glow: 0,
  },
  dzik: {
    home: 'jawia', frame: MOB.DZIK, hp: 3, hw: 6, hh: 5, speed: 30, wander: 16, sight: 128, mask: BLOCK_WALK, hover: 0, fps: 5,
    reach: 92, windup: 0.62, dash: 205, dashTime: 0.8, rest: 1.0, cooldown: 1.7, glow: 0,
  },
  wilk: {
    home: 'jawia', frame: MOB.WILK, hp: 2, hw: 6, hh: 5, speed: 72, wander: 22, sight: 150, mask: BLOCK_WALK, hover: 0, fps: 7,
    reach: 70, windup: 0.3, dash: 195, dashTime: 0.3, rest: 0.6, cooldown: 1.3, glow: 0xc050e0,
  },
  morownik: {
    home: 'jawia', frame: MOB.MOROWNIK, hp: 2, hw: 6, hh: 6, speed: 0, wander: 0, sight: 118, mask: BLOCK_WALK, hover: 0, fps: 1.6,
    reach: 118, windup: 0.75, dash: 0, dashTime: 0, rest: 0.5, cooldown: 2.6, glow: 0xc050e0,
  },
};

/** How fast a blight bloom's thorns fly, and how wide it spreads them (radians). */
const THORN_SPEED = 64;
const THORN_FAN = [-0.42, 0, 0.42];

/** How fast a wisp's fire flies. */
const WISP_SHOT_SPEED = 74;

export interface Bounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

type Mode = 'roam' | 'windup' | 'dash' | 'rest' | 'rising';

export class Enemy {
  /**
   * Which looks enemies wear: the monsters drawn whole (src/art/beasts, M on the playground), each in the form
   * of the world the hero is in; or, with false, their first looks (the `mobs` sheet). B in the game flips it.
   */
  static newLooks = true;

  readonly kind: EnemyKind;
  /** The world it is real in. A strzyga changes sides once. */
  home: World;
  x: number;
  y: number;
  hp: number;
  dead = false;
  /** Seconds of white flash left after being hit. */
  flash = 0;
  /** Strzyga: true for the frame in which her second soul got up on the other side. */
  rose = false;
  /** Dzik: true for the frame in which its charge ended against something solid. */
  bumped = false;
  /** Ognik, morownik: called when it spits (position, velocity). */
  onShoot: ((x: number, y: number, vx: number, vy: number) => void) | null = null;

  readonly sprite: Phaser.GameObjects.Sprite;
  readonly shadow: Phaser.GameObjects.Image;
  private glow: Phaser.GameObjects.Image | null = null;

  private readonly scene: Phaser.Scene;
  private readonly spec: Spec;
  private readonly bounds: Bounds;
  private readonly anchorX: number;
  private readonly anchorY: number;
  private readonly seed = Math.random() * 20;
  private mask: number;
  private frameBase: number;
  private hover: number;
  private lives: number;
  private mode: Mode = 'roam';
  private modeT = 0;
  private restFor = 0;
  private cd = 0.6 + Math.random() * 0.8;
  private ax = 0;
  private ay = 1;
  private kx = 0;
  private ky = 0;
  private t = Math.random() * 10;
  private wanderT = 0;
  private wx = 0;
  private wy = 0;
  private angle = 0;
  private spin = Math.random() < 0.5 ? -1 : 1;
  private orbitFor = 1.2 + Math.random() * 1.2;
  private saw = false;
  private misplaced = false;
  private lastSwing = -1;
  private visible: World;
  private fade = 1;
  private faceLeft = false;

  /**
   * @param bounds the room it lives in (global px): enemies never follow you through a doorway
   */
  constructor(scene: Phaser.Scene, kind: EnemyKind, x: number, y: number, world: World, bounds: Bounds) {
    this.scene = scene;
    this.bounds = bounds;
    this.kind = kind;
    this.spec = SPECS[kind];
    this.home = this.spec.home;
    this.hp = this.spec.hp;
    this.mask = this.spec.mask;
    this.frameBase = this.spec.frame;
    this.hover = this.spec.hover;
    this.lives = kind === 'strzyga' ? 2 : 1;
    this.x = x;
    this.y = y;
    this.anchorX = x;
    this.anchorY = y;
    this.visible = world;
    this.fade = world === this.home ? 1 : 0;
    this.shadow = scene.add.image(x, y, 'shadow');
    this.sprite = scene.add.sprite(x, y, 'mobs', this.frameBase).setOrigin(0.5, 15 / 16);
    if (this.spec.glow) this.addGlow(this.spec.glow);
    this.sync();
  }

  private addGlow(tint: number): void {
    this.glow = this.scene.add.image(this.x, this.y, 'glow').setBlendMode(Phaser.BlendModes.ADD).setTint(tint).setDepth(DEPTH.fog + 1);
  }

  get box(): Box {
    return { x: this.x, y: this.y, hw: this.spec.hw, hh: this.spec.hh };
  }

  /** Can it hurt, and be hurt, right now? (Not while a second soul is still gathering itself.) */
  get solid(): boolean {
    return !this.dead && this.mode !== 'rising';
  }

  /** Which world the hero is in, as far as this enemy's looks are concerned. */
  setWorldVisual(world: World): void {
    this.visible = world;
  }

  private setMode(mode: Mode, restFor = this.spec.rest): void {
    this.mode = mode;
    this.modeT = 0;
    this.restFor = restFor;
    if (mode === 'roam') this.orbitFor = 1.2 + Math.random() * 1.2;
  }

  update(dt: number, level: Level, world: World, px: number, py: number, playerAlive: boolean): void {
    const s = this.spec;
    this.t += dt;
    this.modeT += dt;
    this.flash = Math.max(0, this.flash - dt);
    this.cd = Math.max(0, this.cd - dt);
    this.rose = false;
    this.bumped = false;
    const here = world === this.home;

    if (this.misplaced) {
      // the second soul gets up where the body fell, or as near as the other side allows
      this.misplaced = false;
      const spot = level.findFree(this.home, this.x, this.y, s.hw, s.hh, 40, this.mask);
      if (spot) {
        this.x = spot.x;
        this.y = spot.y;
      }
    }

    let vx = 0;
    let vy = 0;
    const dx = px - this.x;
    const dy = py - this.y;
    const dist = Math.hypot(dx, dy) || 1;
    const sees = here && playerAlive && dist < s.sight;
    if (Math.abs(dx) > 3) this.faceLeft = dx < 0;

    switch (this.mode) {
      case 'rising':
        if (this.modeT >= 0.9) this.setMode('roam');
        break;
      case 'rest':
        if ((this.kind === 'strzyga' || this.kind === 'wilk') && sees) {
          // she never stays where she struck
          vx = (-dx / dist) * 34;
          vy = (-dy / dist) * 34;
        }
        if (this.modeT >= this.restFor) this.setMode('roam');
        break;
      case 'windup':
        // tracks until the last moment, then commits to that line
        this.ax = dx / dist;
        this.ay = dy / dist;
        if (!sees) this.setMode('roam');
        else if (this.modeT >= s.windup) {
          this.cd = s.cooldown;
          if (this.kind === 'ognik') {
            this.onShoot?.(this.x, this.y - 3, this.ax * WISP_SHOT_SPEED, this.ay * WISP_SHOT_SPEED);
            this.setMode('rest');
          } else if (this.kind === 'morownik') {
            const aim = Math.atan2(this.ay, this.ax);
            for (const a of THORN_FAN) this.onShoot?.(this.x, this.y - 5, Math.cos(aim + a) * THORN_SPEED, Math.sin(aim + a) * THORN_SPEED);
            this.setMode('rest');
          } else this.setMode('dash');
        }
        break;
      case 'dash':
        vx = this.ax * s.dash;
        vy = this.ay * s.dash;
        if (this.modeT >= s.dashTime) this.setMode('rest');
        break;
      case 'roam':
        if (sees) {
          if (!this.saw) this.angle = Math.atan2(-dy, -dx);
          const circles = this.kind === 'zjawa' || this.kind === 'wilk';
          const ready = this.cd <= 0 && dist < s.reach && (!circles || this.modeT > this.orbitFor);
          if (ready) {
            this.setMode('windup');
          } else if (circles) {
            // wraiths never come straight at you: they circle, closing in
            this.angle += dt * 1.6 * this.spin;
            const tx = px + Math.cos(this.angle) * 42;
            const ty = py + Math.sin(this.angle) * 42;
            const d = Math.hypot(tx - this.x, ty - this.y) || 1;
            const sp = Math.min(s.speed, d * 6);
            vx = ((tx - this.x) / d) * sp;
            vy = ((ty - this.y) / d) * sp;
          } else if (s.speed > 0) {
            vx = (dx / dist) * s.speed;
            vy = (dy / dist) * s.speed;
            if (this.kind === 'strzyga') {
              const weave = Math.sin(this.t * 3.4 + this.seed) * 0.7;
              vx += (-dy / dist) * s.speed * weave;
              vy += (dx / dist) * s.speed * weave;
            }
          }
        } else if (s.wander > 0) {
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
        break;
    }
    this.saw = sees;

    if (this.kind === 'ognik') {
      // hangs in the air around the spot it haunts
      vx = (this.anchorX + Math.sin(this.t * 0.9 + this.seed) * 7 - this.x) * 3;
      vy = (this.anchorY + Math.sin(this.t * 1.3 + this.seed) * 4 - this.y) * 3;
    }

    const decay = Math.exp(-dt * 10);
    this.kx *= decay;
    this.ky *= decay;

    const box = this.box;
    const hit = level.move(this.home, box, (vx + this.kx) * dt, (vy + this.ky) * dt, this.mask);
    if (hit.hitX || hit.hitY) {
      this.wanderT = Math.min(this.wanderT, 0.15);
      if (this.mode === 'dash' && this.modeT > 0.06) {
        // a boar that runs into something sits there seeing stars: that is when to hit it
        if (this.kind === 'dzik') {
          this.bumped = true;
          this.setMode('rest', 1.7);
        } else this.setMode('rest');
      }
    }
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

  /** Blade (or its own fire, sent back) contact. Returns true if it was hurt. */
  hit(swingId: number, fromX: number, fromY: number): boolean {
    if (!this.solid || swingId === this.lastSwing) return false;
    this.lastSwing = swingId;
    this.hp--;
    this.flash = 0.1;
    this.shove(fromX, fromY, 190);
    if (this.hp > 0) {
      this.setMode('rest', 0.28);
      return true;
    }
    if (this.lives > 1) {
      // the body falls; the other soul is already on its feet on the far side
      this.lives--;
      this.home = otherWorld(this.home);
      this.hp = this.spec.hp;
      this.mask = BLOCK_FLY;
      this.hover = 2;
      this.frameBase = MOB.STRZYGA_N;
      this.kx = 0;
      this.ky = 0;
      this.cd = 0.5;
      this.rose = true;
      this.misplaced = true;
      if (!this.glow) this.addGlow(0x70b0ff);
      this.setMode('rising');
    } else this.dead = true;
    return true;
  }

  /** Called after it touched the hero: back off for a moment. */
  recoil(fromX: number, fromY: number): void {
    this.shove(fromX, fromY, 90);
    this.setMode('rest', 0.6);
  }

  /** It ran into the raised shield: thrown back and dazed, which is the opening for a strike. */
  bash(fromX: number, fromY: number): void {
    this.shove(fromX, fromY, 210);
    this.setMode('rest', 0.95);
    this.flash = 0.06;
  }

  private shove(fromX: number, fromY: number, force: number): void {
    if (this.spec.speed === 0 && this.kind !== 'ognik') return; // rooted
    const d = Math.hypot(this.x - fromX, this.y - fromY) || 1;
    this.kx = ((this.x - fromX) / d) * force;
    this.ky = ((this.y - fromY) / d) * force;
  }

  sync(): void {
    const s = this.spec;
    const warning = this.mode === 'windup';
    const px = Math.round(this.x) + (warning ? Math.round(Math.sin(this.modeT * 60)) : 0);
    const py = Math.round(this.y);
    const bob = this.hover ? Math.round(Math.sin(this.t * 3) * 1.5) : 0;
    const depth = DEPTH.entities + (this.y + s.hh) / 1000;

    const beast = Enemy.newLooks ? GAME_BEASTS[this.kind] : null;
    if (beast) {
      // the walk all the time it moves (or breathes, or flickers); the wind-up, then the blow, when it strikes
      const phase = warning ? 5 : this.mode === 'dash' ? 6 : 1 + (Math.floor(this.t * Math.min(s.fps * 2, 7)) % 4);
      const key = beastKey(beast, this.visible);
      if (this.sprite.texture.key !== key) this.sprite.setTexture(key).setOrigin(0.5, (beast.h - 1) / beast.h);
      this.sprite.setFrame(beastFrameOf(beast, this.visible, phase));
    } else {
      let frame: number;
      if (this.kind === 'ognik') frame = Math.floor(this.t * (warning ? s.fps * 2 : s.fps)) % 4;
      else frame = warning || this.mode === 'dash' ? 2 : Math.floor(this.t * s.fps) % 2;
      if (this.sprite.texture.key !== 'mobs') this.sprite.setTexture('mobs').setOrigin(0.5, 15 / 16);
      this.sprite.setFrame(this.frameBase + frame);
    }
    this.sprite
      .setFlipX(this.faceLeft)
      .setPosition(px, py + s.hh + 2 - this.hover + bob)
      .setDepth(depth);
    this.shadow.setPosition(px, py + s.hh - 1).setDepth(depth - 0.0005);

    const rising = this.mode === 'rising' ? Math.min(1, this.modeT / 0.9) : 1;
    const ghostly = this.kind === 'zjawa' || this.frameBase === MOB.STRZYGA_N;
    const solid = (ghostly ? 0.94 : 1) * rising;
    this.sprite.setAlpha(0.18 * rising + (solid - 0.18 * rising) * this.fade);
    this.shadow.setAlpha(this.fade * rising);
    this.glow?.setPosition(px, py - 6 + bob).setAlpha((warning ? 0.55 : 0.3) * this.fade * rising);
    // hit: white. about to strike: a hard blink, so the warning reads even in a crowd.
    const blink = warning && Math.floor(this.modeT * 16) % 2 === 0;
    if (this.flash > 0 || blink) this.sprite.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    else this.sprite.setTintMode(Phaser.TintModes.MULTIPLY).setTint(this.fade < 0.5 ? 0x9fb0d8 : 0xffffff);
  }

  destroy(): void {
    this.sprite.destroy();
    this.shadow.destroy();
    this.glow?.destroy();
  }
}
