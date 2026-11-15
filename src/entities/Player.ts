// The heroine. All the "feel" numbers live in TUNE.player (src/config.ts).

import Phaser from 'phaser';
import { DEPTH, TUNE, type World } from '../config.ts';
import { input, type Dir } from '../core/input.ts';
import { HERO, SLASH } from '../art/sprites.ts';
import type { Box, Level } from '../world/Level.ts';

export const DIR_VEC: Record<Dir, [number, number]> = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] };
const SLASH_ROW: Record<Dir, number> = { right: SLASH.RIGHT, down: SLASH.DOWN, left: SLASH.LEFT, up: SLASH.UP };
const WALK_CYCLE = [HERO.STEP_A, HERO.STAND, HERO.STEP_B, HERO.STAND];
const STRIDE = 7; // px travelled per animation frame: feet stay planted at any speed

const approach = (v: number, target: number, step: number): number =>
  v < target ? Math.min(target, v + step) : Math.max(target, v - step);

export class Player {
  x: number;
  y: number;
  vx = 0;
  vy = 0;
  /** Knockback velocity, decays on its own. */
  kx = 0;
  ky = 0;
  facing: Dir = 'down';
  hp: number = TUNE.player.maxHp;
  invuln = 0;
  dead = false;
  /** Increases with every swing, so a target is only hit once per swing. */
  swingId = 0;
  /** Seconds since the current swing started, or -1. */
  attackT = -1;
  /** Brief white flash (used when the stone turns). */
  flash = 0;

  readonly sprite: Phaser.GameObjects.Sprite;
  readonly shadow: Phaser.GameObjects.Image;
  readonly slash: Phaser.GameObjects.Sprite;

  private attackCd = 0;
  private lunge = 0;
  private walkPhase = 0;
  private wasMoving = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.x = x;
    this.y = y;
    this.shadow = scene.add.image(x, y, 'shadow');
    this.sprite = scene.add.sprite(x, y, 'hero', 0).setOrigin(0.5, 1);
    this.slash = scene.add.sprite(x, y, 'slash', 0).setVisible(false);
    this.sync();
  }

  get attacking(): boolean {
    return this.attackT >= 0;
  }

  /** True while the blade can actually hurt something. */
  get attackActive(): boolean {
    return this.attackT >= TUNE.player.attackActiveFrom && this.attackT <= TUNE.player.attackActiveTo;
  }

  get box(): Box {
    return { x: this.x, y: this.y, hw: TUNE.player.hitW / 2, hh: TUNE.player.hitH / 2 };
  }

  /** The area the blade sweeps, in front of the heroine. */
  attackBox(): Box {
    const [dx, dy] = DIR_VEC[this.facing];
    const side = dx !== 0;
    return { x: this.x + dx * 13, y: this.y - 5 + dy * 13, hw: side ? 10 : 13, hh: side ? 13 : 10 };
  }

  /**
   * @param control false while the game drives her (room slides, cutscenes)
   * @returns true if a new swing started this frame
   */
  update(dt: number, level: Level, world: World, control: boolean): boolean {
    const P = TUNE.player;
    const mx = control ? input.moveX : 0;
    const my = control ? input.moveY : 0;
    let swung = false;

    this.invuln = Math.max(0, this.invuln - dt);
    this.attackCd = Math.max(0, this.attackCd - dt);
    this.flash = Math.max(0, this.flash - dt);

    if (this.attacking) {
      this.attackT += dt;
      if (this.attackT >= P.attackTime) {
        this.attackT = -1;
        this.attackCd = P.attackCooldown;
      }
    } else {
      if (control && input.wantDir) this.facing = input.wantDir;
      if (control && this.attackCd <= 0 && input.consume('attack', TUNE.inputBuffer)) {
        this.attackT = 0;
        this.swingId++;
        this.lunge = P.attackLunge;
        swung = true;
      }
    }

    // velocity: quick to start, quicker to stop; a swing plants her feet
    const speed = P.speed * (this.attacking ? 0.2 : 1);
    const tx = mx * speed;
    const ty = my * speed;
    this.vx = approach(this.vx, tx, (tx !== 0 ? P.accel : P.decel) * dt);
    this.vy = approach(this.vy, ty, (ty !== 0 ? P.accel : P.decel) * dt);

    this.lunge *= Math.exp(-dt * 16);
    const decay = Math.exp(-dt * 9);
    this.kx *= decay;
    this.ky *= decay;
    const [fx, fy] = DIR_VEC[this.facing];
    const dx = (this.vx + this.kx + fx * this.lunge) * dt;
    const dy = (this.vy + this.ky + fy * this.lunge) * dt;

    const box = this.box;
    const hit = level.move(world, box, dx, dy);
    if (hit.hitX) {
      this.vx = 0;
      this.kx = 0;
      // pushing straight into a corner? slide around it instead of sticking
      if (mx !== 0 && my === 0) this.assist(level, world, box, 'y', Math.sign(mx), P.speed * dt);
    }
    if (hit.hitY) {
      this.vy = 0;
      this.ky = 0;
      if (my !== 0 && mx === 0) this.assist(level, world, box, 'x', Math.sign(my), P.speed * dt);
    }
    this.x = box.x;
    this.y = box.y;

    // animation follows the distance actually walked
    const moving = (mx !== 0 || my !== 0) && !this.attacking;
    if (moving) {
      if (!this.wasMoving) this.walkPhase = 0;
      this.walkPhase += (Math.hypot(this.vx, this.vy) * dt) / STRIDE;
    }
    this.wasMoving = moving;

    this.sync();
    return swung;
  }

  private assist(level: Level, world: World, box: Box, axis: 'x' | 'y', forward: number, step: number): void {
    for (let k = 1; k <= TUNE.player.cornerAssist; k++)
      for (const s of [-1, 1]) {
        const px = axis === 'x' ? box.x + s * k : box.x + forward;
        const py = axis === 'y' ? box.y + s * k : box.y + forward;
        if (level.blocked(world, px, py, box.hw, box.hh)) continue;
        const m = s * Math.min(k, step);
        if (axis === 'x') level.move(world, box, m, 0);
        else level.move(world, box, 0, m);
        return;
      }
  }

  /** Moves her along a scripted path (room slides) with the walk animation running. */
  drive(x: number, y: number): void {
    const d = Math.hypot(x - this.x, y - this.y);
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    if (!this.wasMoving) this.walkPhase = 0;
    this.walkPhase += d / STRIDE;
    this.wasMoving = d > 0.01;
    this.sync();
  }

  /** Takes one heart of damage and gets shoved away from (fromX, fromY). */
  hurt(fromX: number, fromY: number): boolean {
    if (this.invuln > 0 || this.dead) return false;
    this.hp--;
    this.invuln = TUNE.player.hurtInvuln;
    const d = Math.hypot(this.x - fromX, this.y - fromY) || 1;
    this.kx = ((this.x - fromX) / d) * TUNE.player.knockback;
    this.ky = ((this.y - fromY) / d) * TUNE.player.knockback;
    this.attackT = -1;
    if (this.hp <= 0) this.dead = true;
    return true;
  }

  /** Puts sprites where the logic says they are (rounded: no sub-pixel shimmer). */
  sync(): void {
    const px = Math.round(this.x);
    const py = Math.round(this.y);
    const row = this.facing === 'down' ? HERO.DOWN : this.facing === 'up' ? HERO.UP : HERO.SIDE;
    const col = this.attacking ? HERO.LUNGE : this.wasMoving ? WALK_CYCLE[Math.floor(this.walkPhase) % 4] : HERO.STAND;
    const depth = DEPTH.entities + (this.y + 4) / 1000;

    this.sprite.setFrame(row * HERO.cols + col);
    this.sprite.setFlipX(this.facing === 'left');
    this.sprite.setPosition(px, py + 5);
    this.sprite.setDepth(depth);
    this.shadow.setPosition(px, py + 3).setDepth(depth - 0.0005);

    // hurt: blink. stone turned: one bright frame.
    const blink = this.invuln > 0 && Math.floor(this.invuln * 16) % 2 === 0;
    this.sprite.setAlpha(blink ? 0.3 : 1);
    if (this.flash > 0) this.sprite.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    else this.sprite.setTintMode(Phaser.TintModes.MULTIPLY).setTint(0xffffff);

    const showSlash = this.attacking && this.attackT < 0.15;
    this.slash.setVisible(showSlash);
    if (showSlash) {
      const [fx, fy] = DIR_VEC[this.facing];
      const f = Math.min(2, Math.floor(this.attackT / 0.05));
      this.slash.setFrame(SLASH_ROW[this.facing] * SLASH.cols + f);
      this.slash.setPosition(px + fx * 5, py - 5 + fy * 5);
      this.slash.setDepth(this.facing === 'up' ? depth - 0.0002 : depth + 0.0002);
    }
  }

  setVisible(v: boolean): void {
    this.sprite.setVisible(v);
    this.shadow.setVisible(v);
    if (!v) this.slash.setVisible(false);
  }
}
