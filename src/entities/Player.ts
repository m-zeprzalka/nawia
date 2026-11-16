// The hero: a tile (or a tile and a bit) tall, sword in the right hand, round shield on the left arm.
// The sword is its own sprite, laid next to him through the three steps of a swing.
// He may not have them yet: at the start of the game he has neither, nor the stone (see `gear`).
// The dodge is a quick hop in the way he is going (or facing): while he is in the air nothing can hurt him.
// All the "feel" numbers live in TUNE.player (src/config.ts).

import Phaser from 'phaser';
import { DEPTH, TUNE, type World } from '../config.ts';
import { input, type Dir } from '../core/input.ts';
import { HERO, SWORD } from '../art/actors.ts';
import { SLASH } from '../art/sprites.ts';
import type { Box, Level } from '../world/Level.ts';

export const DIR_VEC: Record<Dir, [number, number]> = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] };
const SLASH_ROW: Record<Dir, number> = { right: SLASH.RIGHT, down: SLASH.DOWN, left: SLASH.LEFT, up: SLASH.UP };
const WALK_CYCLE = [HERO.WALK_A, HERO.STAND, HERO.WALK_B, HERO.STAND];
const STRIDE = 6; // px travelled per animation frame: feet stay planted at any speed
/**
 * The swing: sword frame and where its cell sits relative to the middle of the hero's cell.
 * A quarter circle from his sword side to straight ahead.
 */
const SWING: Record<Dir, [number, number, number][]> = {
  right: [[SWORD.N, 5, -10], [SWORD.NE, 11, -7], [SWORD.E, 12, 1]],
  left: [[SWORD.N, -5, -10], [SWORD.NW, -11, -7], [SWORD.W, -12, 1]],
  down: [[SWORD.W, -10, 1], [SWORD.SW, -8, 9], [SWORD.S, -2, 10]],
  up: [[SWORD.E, 10, -2], [SWORD.NE, 9, -10], [SWORD.N, 2, -12]],
};

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
  /** Health in half hearts. */
  hp: number = TUNE.player.maxHp;
  invuln = 0;
  dead = false;
  /** Shield raised: stops blows from the front, slows him down, locks his facing. */
  guarding = false;
  /** Increases with every swing, so a target is only hit once per swing. */
  swingId = 0;
  /** Seconds since the current swing started, or -1. */
  attackT = -1;
  /** Brief white flash (used when the stone turns). */
  flash = 0;
  /** 0..1 fade used when the border throws him back. */
  fade = 1;
  /** What he has: the old man's sword and shield, the herbalist's stone. Without them he cannot strike, guard or shift. */
  gear = { sword: true, shield: true, stone: true };
  /** Seconds since the dodge started, or -1. */
  dodgeT = -1;

  readonly sprite: Phaser.GameObjects.Sprite;
  readonly shadow: Phaser.GameObjects.Image;
  readonly sword: Phaser.GameObjects.Sprite;
  readonly slash: Phaser.GameObjects.Sprite;

  private attackCd = 0;
  private dodgeCd = 0;
  private dodgeX = 0;
  private dodgeY = 1;
  private lunge = 0;
  private walkPhase = 0;
  private wasMoving = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.x = x;
    this.y = y;
    this.shadow = scene.add.image(x, y, 'shadow');
    this.sprite = scene.add.sprite(x, y, 'hero', 0).setOrigin(0.5, 1);
    this.sword = scene.add.sprite(x, y, 'sword', 0).setVisible(false);
    this.slash = scene.add.sprite(x, y, 'slash', 0).setVisible(false);
    this.sync();
  }

  /** Changes his clothes: `key` is the texture of one of the hero sheets (see HERO_LOOKS). */
  setLook(key: string): void {
    this.sprite.setTexture(key, this.sprite.frame.name);
  }

  get dodging(): boolean {
    return this.dodgeT >= 0;
  }

  /** In the air: nothing can touch him. */
  get airborne(): boolean {
    return this.dodgeT >= 0 && this.dodgeT < TUNE.player.dodgeSafe;
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

  /** The area the blade sweeps, in front of him. */
  attackBox(): Box {
    const [dx, dy] = DIR_VEC[this.facing];
    const side = dx !== 0;
    return { x: this.x + dx * 13, y: this.y - 5 + dy * 13, hw: side ? 10 : 13, hh: side ? 13 : 10 };
  }

  /** Would the raised shield stop something coming from (fromX, fromY)? */
  blocks(fromX: number, fromY: number): boolean {
    if (!this.guarding) return false;
    const [fx, fy] = DIR_VEC[this.facing];
    const d = Math.hypot(fromX - this.x, fromY - this.y) || 1;
    return ((fromX - this.x) / d) * fx + ((fromY - this.y) / d) * fy > TUNE.player.guardArc;
  }

  /**
   * @param control false while the game drives him (room slides, cutscenes)
   * @returns true if a new swing started this frame
   */
  update(dt: number, level: Level, world: World, control: boolean): boolean {
    const P = TUNE.player;
    const mx = control ? input.moveX : 0;
    const my = control ? input.moveY : 0;
    let swung = false;

    this.invuln = Math.max(0, this.invuln - dt);
    this.attackCd = Math.max(0, this.attackCd - dt);
    this.dodgeCd = Math.max(0, this.dodgeCd - dt);
    this.flash = Math.max(0, this.flash - dt);

    // the dodge: a hop the way he is going (or facing), committed once started
    if (this.dodging) {
      this.dodgeT += dt;
      if (this.dodgeT >= P.dodgeTime) {
        this.dodgeT = -1;
        this.dodgeCd = P.dodgeCooldown;
      }
    } else if (control && this.dodgeCd <= 0 && !this.attacking && input.consume('dodge', TUNE.inputBuffer)) {
      const len = Math.hypot(mx, my);
      if (len > 0.1) {
        this.dodgeX = mx / len;
        this.dodgeY = my / len;
        if (input.wantDir) this.facing = input.wantDir;
      } else [this.dodgeX, this.dodgeY] = DIR_VEC[this.facing];
      this.dodgeT = 0;
      this.guarding = false;
    }

    if (this.dodging) {
      // nothing else while he is in the air
    } else if (this.attacking) {
      this.attackT += dt;
      if (this.attackT >= P.attackTime) {
        this.attackT = -1;
        this.attackCd = P.attackCooldown;
      }
    } else if (control && this.gear.sword && this.attackCd <= 0 && input.consume('attack', TUNE.inputBuffer)) {
      // a strike always wins over the shield: lower it, swing
      if (input.wantDir && !this.guarding) this.facing = input.wantDir;
      this.attackT = 0;
      this.swingId++;
      this.lunge = P.attackLunge;
      swung = true;
    }
    this.guarding = control && this.gear.shield && !this.attacking && !this.dodging && input.isDown('shield');
    // he turns freely, unless he is busy: a raised shield keeps facing the threat (so he can back away)
    if (control && !this.attacking && !this.guarding && !this.dodging && input.wantDir) this.facing = input.wantDir;

    // velocity: quick to start, quicker to stop; a swing plants his feet, a raised shield slows him
    const speed = P.speed * (this.attacking ? 0.2 : this.guarding ? P.guardSpeed : 1);
    const tx = mx * speed;
    const ty = my * speed;
    if (this.dodging) {
      // the hop carries him at its own speed; he lands still moving, at a walk
      this.vx = this.dodgeX * P.dodgeSpeed;
      this.vy = this.dodgeY * P.dodgeSpeed;
    } else {
      this.vx = approach(this.vx, tx, (tx !== 0 ? P.accel : P.decel) * dt);
      this.vy = approach(this.vy, ty, (ty !== 0 ? P.accel : P.decel) * dt);
    }

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
    const moving = (mx !== 0 || my !== 0) && !this.attacking && !this.dodging;
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

  /** Moves him along a scripted path (room slides) with the walk animation running. */
  drive(x: number, y: number): void {
    const d = Math.hypot(x - this.x, y - this.y);
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.guarding = false;
    if (!this.wasMoving) this.walkPhase = 0;
    this.walkPhase += d / STRIDE;
    this.wasMoving = d > 0.01;
    this.sync();
  }

  /** Loses `amount` half hearts and gets shoved away from (fromX, fromY). */
  hurt(fromX: number, fromY: number, amount: number): boolean {
    if (this.invuln > 0 || this.dead || this.airborne) return false;
    const d = Math.hypot(this.x - fromX, this.y - fromY) || 1;
    this.kx = ((this.x - fromX) / d) * TUNE.player.knockback;
    this.ky = ((this.y - fromY) / d) * TUNE.player.knockback;
    this.attackT = -1;
    this.dodgeT = -1;
    this.drain(amount);
    this.invuln = TUNE.player.hurtInvuln;
    return true;
  }

  /** Loses health without being pushed (the border's toll). */
  drain(amount: number): void {
    this.hp = Math.max(0, this.hp - amount);
    if (this.hp <= 0) this.dead = true;
  }

  heal(amount: number): void {
    this.hp = Math.min(TUNE.player.maxHp, this.hp + amount);
  }

  /** A blow caught on the shield still pushes him back a little. */
  absorb(fromX: number, fromY: number): void {
    this.shove(fromX, fromY, 55);
  }

  /** Thrown away from (fromX, fromY) without being hurt. */
  shove(fromX: number, fromY: number, force: number): void {
    const d = Math.hypot(this.x - fromX, this.y - fromY) || 1;
    this.kx = ((this.x - fromX) / d) * force;
    this.ky = ((this.y - fromY) / d) * force;
  }

  /** Puts sprites where the logic says they are (rounded: no sub-pixel shimmer). */
  sync(): void {
    const px = Math.round(this.x);
    const py = Math.round(this.y);
    const row = this.facing === 'down' ? HERO.DOWN : this.facing === 'up' ? HERO.UP : HERO.SIDE;
    let col: number = HERO.STAND;
    if (this.dodging) col = HERO.HOP;
    else if (this.attacking) col = this.attackT < 0.06 ? HERO.ATK0 : HERO.ATK1;
    else if (this.guarding) col = HERO.GUARD;
    else if (this.wasMoving) col = WALK_CYCLE[Math.floor(this.walkPhase) % 4];
    const depth = DEPTH.entities + (this.y + 4) / 1000;

    this.sprite.setFrame(row * HERO.cols + col);
    this.sprite.setFlipX(this.facing === 'left');
    // the hop: up and down again over his shadow, which stays on the ground
    const hop = this.dodging ? Math.round(Math.sin((this.dodgeT / TUNE.player.dodgeTime) * Math.PI) * TUNE.player.dodgeHeight) : 0;
    this.sprite.setPosition(px, py + 5 - hop);
    this.sprite.setDepth(depth);
    this.shadow.setPosition(px, py + 3).setDepth(depth - 0.0005).setAlpha(this.fade);

    // hurt: blink. stone turned: one bright frame.
    const blink = this.invuln > 0 && Math.floor(this.invuln * 16) % 2 === 0;
    this.sprite.setAlpha((blink ? 0.3 : 1) * this.fade);
    if (this.flash > 0) this.sprite.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    else this.sprite.setTintMode(Phaser.TintModes.MULTIPLY).setTint(0xffffff);

    // the blade: up, across, out, and it stays out for the rest of the swing
    this.sword.setVisible(this.attacking && this.fade > 0.5);
    if (this.attacking) {
      const [frame, ox, oy] = SWING[this.facing][this.attackT < 0.04 ? 0 : this.attackT < 0.085 ? 1 : 2];
      this.sword.setFrame(frame).setPosition(px + ox, py - 3 + oy).setDepth(this.facing === 'up' ? depth - 0.0003 : depth + 0.0003);
    }

    const showSlash = this.attacking && this.attackT < 0.15;
    this.slash.setVisible(showSlash);
    if (showSlash) {
      const [fx, fy] = DIR_VEC[this.facing];
      const f = Math.min(2, Math.floor(this.attackT / 0.05));
      this.slash.setFrame(SLASH_ROW[this.facing] * SLASH.cols + f);
      this.slash.setPosition(px + fx * 3, py - 3 + fy * 3);
      this.slash.setDepth(this.facing === 'up' ? depth - 0.0002 : depth + 0.0002);
    }
  }
}
