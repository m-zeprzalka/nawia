// The hero: a tile and a bit tall, sword in the right hand, round shield on the left arm.
//
// What he does, and how it feels (every number lives in TUNE.player, src/config.ts):
//  - he runs: quick to start, quicker to stop, feet planted (the run's frames follow the distance walked);
//  - he strikes in a string of three: a cut, a cut back, and a heavy chop. Pressing again while a blow follows
//    through carries on into the next; waiting lets the string fall back to the first. Each blow steps him
//    forward. A blow cannot be stopped once it has started, but its recovery can be rolled out of;
//  - he raises the shield: a blow from the front stops on it. Raised just as the blow comes (`perfect`), the
//    shield throws the attacker off balance for longer;
//  - he rolls: a quick forward roll with a little hop; from the tuck to the unfold nothing can touch him;
//  - hit, he is thrown back and loses control for a moment, then blinks for a while, untouchable.
// At the start of the game he has neither sword nor shield, nor the stone (see `gear`).
//
// He is drawn from a sheet in the layout of src/art/hero/layout.ts; the sweep of the blade (the smear) is a
// second sprite laid over him from src/art/combatFx.ts.

import Phaser from 'phaser';
import { DEPTH, TUNE, type World } from '../config.ts';
import { input, type Dir } from '../core/input.ts';
import { ANIMS, CELL, animTime, frameAt, frameStart, heroFrame, type HeroAnim, type HeroView } from '../art/hero/layout.ts';
import { SMEAR, arcBox, smearRow, type Strike } from '../art/combatFx.ts';
import type { Box, Level } from '../world/Level.ts';

export const DIR_VEC: Record<Dir, [number, number]> = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] };
const VIEW: Record<Dir, HeroView> = { down: 'down', up: 'up', left: 'side', right: 'side' };
const STRIKES: Strike[] = ['atkA', 'atkB', 'atkC'];
/** px travelled per frame of the run: the feet stay planted at any speed */
const STRIDE = 7;

/** Something that happened to him this frame, for the scene to dress up (dust, sounds). */
export type PlayerEvent = 'swing' | 'roll' | 'land' | 'step';

const approach = (v: number, target: number, step: number): number =>
  v < target ? Math.min(target, v + step) : Math.max(target, v - step);

/** A blow of the string: how hard it lands. */
export interface StrikeSpec {
  damage: number;
  knock: number;
  hitstop: number;
  trauma: number;
  /** the third: knocks harder, breaks a guard */
  heavy: boolean;
}

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
  /** Increases with every blow, so a target is only hit once per blow. */
  swingId = 0;
  /** Brief white flash (used when the stone turns). */
  flash = 0;
  /** 0..1 fade used when the border throws him back. */
  fade = 1;
  /** What he has: the old man's sword and shield, the herbalist's stone. Without them he cannot strike, guard or shift. */
  gear = { sword: true, shield: true, stone: true };
  /** Where the nearest foe is (set by the scene each frame): a blow with no direction held turns to it. */
  target: { x: number; y: number } | null = null;
  /** What happened this frame; the scene reads and clears it. */
  readonly events: PlayerEvent[] = [];

  readonly sprite: Phaser.GameObjects.Sprite;
  readonly shadow: Phaser.GameObjects.Image;
  readonly smear: Phaser.GameObjects.Sprite;

  /** Which blow of the string is playing (0, 1, 2), or -1. */
  private combo = -1;
  /** Seconds into the current blow. */
  private attackT = 0;
  /** A press came in while a blow played: the next one follows. */
  private queued = false;
  /** Seconds after a blow in which a press still carries the string on. */
  private chainFor = 0;
  /** The blow the string will start with next. */
  private nextCombo = 0;
  private attackCd = 0;
  private rollT = -1;
  private rollCd = 0;
  private rollX = 0;
  private rollY = 1;
  private hurtT = -1;
  private guardT = 0;
  private deathT = -1;
  private lunge = 0;
  private walkPhase = 0;
  private wasMoving = false;
  private clock = 0;
  private lastStep = -1;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.x = x;
    this.y = y;
    this.shadow = scene.add.image(x, y, 'shadow');
    this.sprite = scene.add.sprite(x, y, 'sambor', 0).setOrigin(CELL.cx / CELL.w, CELL.foot / CELL.h);
    this.smear = scene.add.sprite(x, y, 'smear', 0).setOrigin(SMEAR.cx / SMEAR.fw, SMEAR.foot / SMEAR.fh).setVisible(false);
    this.sync();
  }

  /** Changes his clothes: `key` is the texture of one of the hero sheets (see GAME_LOOKS). */
  setLook(key: string): void {
    this.sprite.setTexture(key, this.sprite.frame.name);
  }

  // ------------------------------------------------------------------ what he is doing

  get attacking(): boolean {
    return this.combo >= 0;
  }

  get rolling(): boolean {
    return this.rollT >= 0;
  }

  /** @deprecated the old name of `rolling` */
  get dodging(): boolean {
    return this.rolling;
  }

  /** In the tuck of a roll: nothing can touch him. */
  get airborne(): boolean {
    if (!this.rolling) return false;
    const [a, b] = ANIMS.roll.safe ?? [1, 4];
    return this.rollT >= frameStart('roll', a) && this.rollT < frameStart('roll', b + 1);
  }

  /** Which blow of the string is playing: 0, 1, 2 (the heavy one), or -1. */
  get comboIndex(): number {
    return this.combo;
  }

  get staggered(): boolean {
    return this.hurtT >= 0;
  }

  private get strikeName(): Strike {
    return STRIKES[Math.max(0, this.combo)];
  }

  /** True while the blade can actually hurt something. */
  get attackActive(): boolean {
    if (!this.attacking) return false;
    const s = this.strikeName;
    const [a, b] = ANIMS[s].active ?? [1, 2];
    return this.attackT >= frameStart(s, a) && this.attackT < frameStart(s, b + 1);
  }

  /** How hard the blow now playing lands. */
  get strike(): StrikeSpec {
    const P = TUNE.player;
    const heavy = this.combo === 2;
    return {
      damage: heavy ? P.heavyDamage : 1,
      knock: heavy ? P.heavyKnock : P.strikeKnock,
      hitstop: heavy ? P.heavyHitstop : P.strikeHitstop,
      trauma: heavy ? 0.55 : 0.32,
      heavy,
    };
  }

  /** The shield went up a moment ago: a blow caught now staggers the attacker for longer. */
  get perfect(): boolean {
    return this.guarding && this.guardT < TUNE.player.perfectGuard;
  }

  /** His feet: what walls stop. */
  get box(): Box {
    return { x: this.x, y: this.y, hw: TUNE.player.hitW / 2, hh: TUNE.player.hitH / 2 };
  }

  /** His body: what blows and shots hit. */
  get hurtBox(): Box {
    return { x: this.x, y: this.y - 5, hw: 5, hh: 8 };
  }

  /** The area the blade sweeps, from the smear of the blow now playing. */
  attackBox(): Box {
    const view = VIEW[this.facing];
    const a = arcBox(this.strikeName, view);
    const flip = this.facing === 'left' ? -1 : 1;
    return { x: this.x + a.dx * flip, y: this.y + a.dy, hw: a.hw, hh: a.hh };
  }

  /** Would the raised shield stop something coming from (fromX, fromY)? */
  blocks(fromX: number, fromY: number): boolean {
    if (!this.guarding) return false;
    const [fx, fy] = DIR_VEC[this.facing];
    const d = Math.hypot(fromX - this.x, fromY - this.y) || 1;
    return ((fromX - this.x) / d) * fx + ((fromY - this.y) / d) * fy > TUNE.player.guardArc;
  }

  // ------------------------------------------------------------------ the frame

  /**
   * @param control false while the game drives him (room slides, conversations, doors)
   * @returns true if a new blow started this frame
   */
  update(dt: number, level: Level, world: World, control: boolean): boolean {
    const P = TUNE.player;
    const mx = control ? input.moveX : 0;
    const my = control ? input.moveY : 0;
    let swung = false;
    this.clock += dt;

    this.invuln = Math.max(0, this.invuln - dt);
    this.attackCd = Math.max(0, this.attackCd - dt);
    this.rollCd = Math.max(0, this.rollCd - dt);
    this.chainFor = Math.max(0, this.chainFor - dt);
    this.flash = Math.max(0, this.flash - dt);
    if (this.chainFor <= 0 && !this.attacking) this.nextCombo = 0;

    if (this.dead) {
      this.deathT = this.deathT < 0 ? 0 : this.deathT + dt;
      this.combo = -1;
      this.rollT = -1;
      this.guarding = false;
      control = false;
    }

    // thrown back by a blow: nothing he can do until he catches himself
    if (this.staggered) {
      this.hurtT += dt;
      if (this.hurtT >= animTime('hurt')) this.hurtT = -1;
      control = false;
    }

    // the roll: committed once started; it may cut a blow's recovery short
    if (this.rolling) {
      this.rollT += dt;
      if (this.rollT >= animTime('roll')) {
        this.rollT = -1;
        this.rollCd = P.rollCooldown;
        this.events.push('land');
      }
    } else if (control && this.rollCd <= 0 && this.canCancel() && input.consume('dodge', TUNE.inputBuffer)) {
      const len = Math.hypot(mx, my);
      if (len > 0.1) {
        this.rollX = mx / len;
        this.rollY = my / len;
        if (input.wantDir) this.facing = input.wantDir;
      } else [this.rollX, this.rollY] = DIR_VEC[this.facing];
      this.rollT = 0;
      this.combo = -1;
      this.queued = false;
      this.guarding = false;
      this.events.push('roll');
    }

    if (this.rolling) {
      // nothing else while he rolls
    } else if (this.attacking) {
      this.attackT += dt;
      const s = this.strikeName;
      if (control && this.combo < 2 && input.consume('attack', P.comboBuffer)) this.queued = true;
      // a press made during the blow carries on as soon as the blade has passed
      const [, last] = ANIMS[s].active ?? [1, 2];
      if (this.queued && this.attackT >= frameStart(s, last + 1)) {
        this.startStrike(this.combo + 1, mx, my);
        swung = true;
      } else if (this.attackT >= animTime(s)) {
        // the string ends: after the third a breath, after the others a moment to carry on
        this.chainFor = this.combo < 2 ? P.comboWindow : 0;
        this.nextCombo = this.combo < 2 ? this.combo + 1 : 0;
        this.attackCd = this.combo === 2 ? P.heavyCooldown : P.attackCooldown;
        this.combo = -1;
      }
    } else if (control && this.gear.sword && this.attackCd <= 0 && input.consume('attack', TUNE.inputBuffer)) {
      this.startStrike(this.chainFor > 0 ? this.nextCombo : 0, mx, my);
      swung = true;
    }

    const wasGuarding = this.guarding;
    this.guarding = control && this.gear.shield && !this.attacking && !this.rolling && input.isDown('shield');
    this.guardT = this.guarding ? (wasGuarding ? this.guardT + dt : 0) : 0;
    // he turns freely, unless he is busy: a raised shield keeps facing the threat (so he can back away)
    if (control && !this.attacking && !this.guarding && !this.rolling && input.wantDir) this.facing = input.wantDir;

    // velocity: quick to start, quicker to stop; a blow plants his feet, a raised shield slows him
    const speed = P.speed * (this.attacking ? P.attackMove : this.guarding ? P.guardSpeed : 1);
    const tx = mx * speed;
    const ty = my * speed;
    if (this.rolling) {
      // fast off the mark, slowing as he comes out of it
      const u = this.rollT / animTime('roll');
      const v = P.rollSpeed * (1 - 0.6 * u * u);
      this.vx = this.rollX * v;
      this.vy = this.rollY * v;
    } else if (this.staggered || this.dead) {
      this.vx = approach(this.vx, 0, P.decel * dt);
      this.vy = approach(this.vy, 0, P.decel * dt);
    } else {
      this.vx = approach(this.vx, tx, (tx !== 0 ? P.accel : P.decel) * dt);
      this.vy = approach(this.vy, ty, (ty !== 0 ? P.accel : P.decel) * dt);
    }

    this.lunge *= Math.exp(-dt * 14);
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
      if (mx !== 0 && my === 0 && !this.rolling) this.assist(level, world, box, 'y', Math.sign(mx), P.speed * dt);
    }
    if (hit.hitY) {
      this.vy = 0;
      this.ky = 0;
      if (my !== 0 && mx === 0 && !this.rolling) this.assist(level, world, box, 'x', Math.sign(my), P.speed * dt);
    }
    this.x = box.x;
    this.y = box.y;

    // the run follows the distance actually covered
    const moving = (mx !== 0 || my !== 0) && !this.attacking && !this.rolling && !this.staggered && !this.dead;
    if (moving) {
      if (!this.wasMoving) this.walkPhase = 0;
      this.walkPhase += (Math.hypot(this.vx, this.vy) * dt) / STRIDE;
      // a foot comes down on frames 0 and 3
      const f = Math.floor(this.walkPhase) % ANIMS.run.frames;
      if ((f === 0 || f === 3) && f !== this.lastStep) this.events.push('step');
      this.lastStep = f;
    } else this.lastStep = -1;
    this.wasMoving = moving;

    this.sync();
    return swung;
  }

  /** Can a roll cut in now? Not during the wind-up or the blow itself; yes once the blade has passed. */
  private canCancel(): boolean {
    if (this.staggered || this.dead) return false;
    if (!this.attacking) return true;
    const s = this.strikeName;
    const [, last] = ANIMS[s].active ?? [1, 2];
    return this.attackT >= frameStart(s, last + 1);
  }

  private startStrike(n: number, mx: number, my: number): void {
    // a blow goes where he is pushing, or at the nearest foe if he is not pushing anywhere
    if (input.wantDir && Math.hypot(mx, my) > 0.1) this.facing = input.wantDir;
    else if (this.target) {
      const dx = this.target.x - this.x;
      const dy = this.target.y - this.y;
      if (Math.hypot(dx, dy) < TUNE.player.aimReach) this.facing = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down';
    }
    this.combo = n;
    this.attackT = 0;
    this.queued = false;
    this.swingId++;
    this.lunge = n === 2 ? TUNE.player.heavyLunge : TUNE.player.attackLunge;
    this.vx *= 0.3;
    this.vy *= 0.3;
    this.events.push('swing');
  }

  /** Stops whatever he was doing (a conversation, a doorway). */
  halt(): void {
    this.combo = -1;
    this.queued = false;
    this.rollT = -1;
    this.guarding = false;
    this.vx = 0;
    this.vy = 0;
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

  /** Moves him along a scripted path (room slides) with the run playing. */
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

  // ------------------------------------------------------------------ what happens to him

  /** Loses `amount` half hearts and is thrown away from (fromX, fromY). */
  hurt(fromX: number, fromY: number, amount: number): boolean {
    if (this.invuln > 0 || this.dead || this.airborne) return false;
    const d = Math.hypot(this.x - fromX, this.y - fromY) || 1;
    this.kx = ((this.x - fromX) / d) * TUNE.player.knockback;
    this.ky = ((this.y - fromY) / d) * TUNE.player.knockback;
    this.combo = -1;
    this.queued = false;
    this.rollT = -1;
    this.guarding = false;
    this.hurtT = 0;
    this.flash = 0.06;
    this.drain(amount);
    this.invuln = TUNE.player.hurtInvuln;
    return true;
  }

  /** Loses health without being pushed (the border's toll). */
  drain(amount: number): void {
    this.hp = Math.max(0, this.hp - amount);
    if (this.hp <= 0 && !this.dead) {
      this.dead = true;
      this.deathT = 0;
    }
  }

  /** Back on his feet (after dying): whole, still, facing `facing`. */
  revive(facing: Dir): void {
    this.dead = false;
    this.deathT = -1;
    this.hurtT = -1;
    this.facing = facing;
    this.halt();
  }

  heal(amount: number): void {
    this.hp = Math.min(TUNE.player.maxHp, this.hp + amount);
  }

  /** A blow caught on the shield still pushes him back a little. */
  absorb(fromX: number, fromY: number, force = 70): void {
    this.shove(fromX, fromY, force);
  }

  /** Thrown away from (fromX, fromY) without being hurt. */
  shove(fromX: number, fromY: number, force: number): void {
    const d = Math.hypot(this.x - fromX, this.y - fromY) || 1;
    this.kx = ((this.x - fromX) / d) * force;
    this.ky = ((this.y - fromY) / d) * force;
  }

  // ------------------------------------------------------------------ drawing

  /** Which animation and frame he shows. */
  private pose(): [HeroAnim, number] {
    if (this.dead) return ['death', frameAt('death', Math.max(0, this.deathT))];
    if (this.staggered) return ['hurt', frameAt('hurt', this.hurtT)];
    if (this.rolling) return ['roll', frameAt('roll', this.rollT)];
    if (this.attacking) return [this.strikeName, frameAt(this.strikeName, this.attackT)];
    if (this.guarding) return ['guard', frameAt('guard', this.guardT)];
    if (this.wasMoving) return ['run', Math.floor(this.walkPhase) % ANIMS.run.frames];
    return ['idle', frameAt('idle', this.clock % animTime('idle'))];
  }

  /** Puts sprites where the logic says they are (rounded: no sub-pixel shimmer). */
  sync(): void {
    const px = Math.round(this.x);
    const py = Math.round(this.y);
    const view = VIEW[this.facing];
    const [anim, i] = this.pose();
    const depth = DEPTH.entities + (this.y + 4) / 1000;

    this.sprite.setFrame(heroFrame(anim, view, i));
    this.sprite.setFlipX(this.facing === 'left');
    // the roll's little hop: up and down again over his shadow, which stays on the ground
    let hop = 0;
    if (this.rolling) {
      const u = this.rollT / animTime('roll');
      hop = u > 0.12 && u < 0.85 ? Math.round(Math.sin(((u - 0.12) / 0.73) * Math.PI) * TUNE.player.rollHeight) : 0;
    }
    this.sprite.setPosition(px, py + 5 - hop);
    this.sprite.setDepth(depth);
    this.shadow.setPosition(px, py + 3).setDepth(depth - 0.0005).setAlpha(this.fade * (this.dead && this.deathT > 1 ? 0 : 1));

    // hurt: blink. stone turned or hit: one bright frame.
    const blink = this.invuln > 0 && !this.staggered && Math.floor(this.invuln * 20) % 2 === 0;
    this.sprite.setAlpha((blink ? 0.35 : 1) * this.fade);
    if (this.flash > 0) this.sprite.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    else this.sprite.setTintMode(Phaser.TintModes.MULTIPLY).setTint(0xffffff);

    // the sweep of the blade, over the frames in which it cuts (and one after, fading)
    let show = false;
    if (this.attacking) {
      const s = this.strikeName;
      const [a, b] = ANIMS[s].active ?? [1, 2];
      const f = i < a ? -1 : i <= b ? i - a : i === b + 1 ? 2 : -1;
      if (f >= 0 && this.fade > 0.5) {
        show = true;
        this.smear
          .setFrame(smearRow(s, view) * SMEAR.cols + Math.min(2, f))
          .setFlipX(this.facing === 'left')
          .setPosition(px, py + 5)
          .setDepth(depth + 0.0004);
      }
    }
    this.smear.setVisible(show);
  }
}
