// The guardian: an idol that stands on the border itself.
//
// Its stone body lives in Jawia and cannot be hurt. Its heart hangs in the same place in Nawia,
// shelled while the stone stands. So the fight needs both worlds:
//   Jawia  - it stalks, winds up, charges in a straight line. Make it hit a wall and it is stunned.
//   Nawia  - while the stone is stunned the heart lies bare: turn the stone, strike it.
//            The rest of the time the heart shoots at anyone who lingers on its side.
// Numbers live in TUNE.boss (src/config.ts).

import Phaser from 'phaser';
import { DEPTH, TUNE, type World } from '../config.ts';
import { BOSS, MOB } from '../art/actors.ts';
import type { LightSource } from '../fx/Lighting.ts';
import { BLOCK_WALK, type Box, type Level } from '../world/Level.ts';

export type BossEvent = 'wake' | 'windup' | 'charge' | 'crash' | 'thud' | 'close' | 'orbs' | 'dying' | 'dead';
type State = 'sleep' | 'stalk' | 'windup' | 'charge' | 'stunned' | 'recover' | 'dying';

export class Boss {
  x: number;
  y: number;
  hp: number = TUNE.boss.hp;
  dead = false;
  state: State = 'sleep';
  /** What happened since the scene last looked (it drains this): sound, shake and sparks hang off these. */
  readonly events: BossEvent[] = [];
  /** Called for every soul orb the heart lets fly (position, velocity). */
  onShoot: ((x: number, y: number, vx: number, vy: number) => void) | null = null;

  private readonly body: Phaser.GameObjects.Sprite;
  private readonly shadow: Phaser.GameObjects.Image;
  private readonly heart: Phaser.GameObjects.Sprite;
  private readonly glow: Phaser.GameObjects.Image;
  private t = 0;
  private clock = 0;
  private ax = 0;
  private ay = 1;
  private travelled = 0;
  private stunHits = 0;
  private orbT = 1;
  private flash = 0;
  private lastSwing = -1;
  private visible: World;
  private fade: number;

  constructor(scene: Phaser.Scene, x: number, y: number, world: World) {
    this.x = x;
    this.y = y;
    this.visible = world;
    this.fade = world === 'jawia' ? 1 : 0;
    this.shadow = scene.add.image(x, y, 'shadow').setScale(2);
    this.body = scene.add.sprite(x, y, 'boss', BOSS.IDLE).setOrigin(0.5, 30 / 32);
    this.glow = scene.add.image(x, y, 'glow').setBlendMode(Phaser.BlendModes.ADD).setTint(0xd070f0).setDepth(DEPTH.fog + 1);
    this.heart = scene.add.sprite(x, y, 'mobs', MOB.HEART);
    this.sync();
  }

  /** 0, 1, 2: it gets faster and angrier with every third of its health. */
  get phase(): number {
    return Math.min(2, Math.floor((TUNE.boss.hp - this.hp) / TUNE.boss.hitsPerPhase));
  }

  /** The stone body (Jawia). */
  get box(): Box {
    return { x: this.x, y: this.y, hw: 11, hh: 8 };
  }

  /** The heart inside it (Nawia). */
  get heartBox(): Box {
    return { x: this.x, y: this.y - 6, hw: 8, hh: 9 };
  }

  get heartBare(): boolean {
    return this.state === 'stunned';
  }

  get charging(): boolean {
    return this.state === 'charge';
  }

  /** Does the stone hurt right now? Only its charge: otherwise it is in the way, and pushes. */
  get harmful(): boolean {
    return this.state === 'charge';
  }

  /** Is its body there to bump into (Jawia)? */
  get standing(): boolean {
    return this.state !== 'sleep' && this.state !== 'dying' && !this.dead;
  }

  get alive(): boolean {
    return !this.dead && this.state !== 'dying';
  }

  setWorldVisual(world: World): void {
    this.visible = world;
  }

  private set(state: State): void {
    this.state = state;
    this.t = 0;
  }

  update(dt: number, level: Level, world: World, px: number, py: number, playerAlive: boolean): void {
    const B = TUNE.boss;
    const ph = this.phase;
    this.t += dt;
    this.clock += dt;
    this.flash = Math.max(0, this.flash - dt);
    const dx = px - this.x;
    const dy = py - this.y;
    const dist = Math.hypot(dx, dy) || 1;
    const living = world === 'jawia' && playerAlive;

    switch (this.state) {
      case 'sleep':
        if ((dist < 88 && this.t > 0.4) || this.t > 2.4) {
          this.set('recover');
          this.events.push('wake');
        }
        break;
      case 'stalk': {
        // the stone only sees the living
        if (!living) {
          this.t -= dt;
          break;
        }
        const box = this.box;
        level.move('jawia', box, (dx / dist) * B.stalkSpeed[ph] * dt, (dy / dist) * B.stalkSpeed[ph] * dt, BLOCK_WALK);
        this.x = box.x;
        this.y = box.y;
        if (this.t >= B.stalkTime[ph]) {
          this.set('windup');
          this.events.push('windup');
        }
        break;
      }
      case 'windup':
        // it tracks him for most of the wind-up; the last moments it is already committed
        if (this.t < B.windup[ph] * 0.72) {
          this.ax = dx / dist;
          this.ay = dy / dist;
        }
        if (this.t >= B.windup[ph]) {
          this.set('charge');
          this.travelled = 0;
          this.events.push('charge');
        }
        break;
      case 'charge': {
        const step = B.chargeSpeed[ph] * dt;
        const box = this.box;
        const hit = level.move('jawia', box, this.ax * step, this.ay * step, BLOCK_WALK);
        this.travelled += Math.hypot(box.x - this.x, box.y - this.y);
        this.x = box.x;
        this.y = box.y;
        if (hit.hitX || hit.hitY) {
          // a real run-up cracks it open; a nudge against the wall next to it does not
          if (this.travelled > 26) {
            this.set('stunned');
            this.stunHits = 0;
            this.events.push('crash');
          } else {
            this.set('recover');
            this.events.push('thud');
          }
        } else if (this.t > 1.8) this.set('recover');
        break;
      }
      case 'stunned':
        if (this.t >= B.stun[ph]) {
          this.set('recover');
          this.events.push('close');
        }
        break;
      case 'recover':
        if (this.t >= 0.75) this.set('stalk');
        break;
      case 'dying':
        if (this.t >= 1.9) {
          this.dead = true;
          this.events.push('dead');
        }
        break;
    }

    // the shelled heart defends its own side
    const guarding = this.state === 'stalk' || this.state === 'windup' || this.state === 'charge' || this.state === 'recover';
    if (world === 'nawia' && playerAlive && guarding) {
      this.orbT -= dt;
      if (this.orbT <= 0) {
        this.orbT = B.orbEvery[ph];
        const hx = this.x;
        const hy = this.y - 6;
        const aim = Math.atan2(py - 4 - hy, px - hx);
        const n = B.orbCount[ph];
        for (let i = 0; i < n; i++) {
          const a = aim + (i - (n - 1) / 2) * 0.4;
          this.onShoot?.(hx, hy, Math.cos(a) * B.orbSpeed[ph], Math.sin(a) * B.orbSpeed[ph]);
        }
        this.events.push('orbs');
      }
    } else this.orbT = Math.max(this.orbT, 0.9);

    const target = this.visible === 'jawia' ? 1 : 0;
    this.fade += Math.sign(target - this.fade) * Math.min(Math.abs(target - this.fade), dt * 9);
    this.sync();
  }

  /** A blow on the heart. Only lands while it lies bare. */
  hitHeart(swingId: number): boolean {
    if (this.state !== 'stunned' || swingId === this.lastSwing) return false;
    this.lastSwing = swingId;
    this.hp--;
    this.flash = 0.12;
    this.stunHits++;
    if (this.hp <= 0) {
      this.set('dying');
      this.events.push('dying');
    } else if (this.stunHits >= TUNE.boss.hitsPerPhase) {
      // enough: the shell slams shut and the stone gets up angrier
      this.set('recover');
      this.events.push('close');
    }
    return true;
  }

  /** Its eyes in Jawia, its heart in Nawia. */
  light(world: World): LightSource | null {
    if (this.dead) return null;
    if (world === 'jawia') {
      if (this.state === 'stunned' || this.state === 'sleep') return { x: this.x, y: this.y - 8, radius: 34, color: [0.5, 0.9, 1.0], intensity: 0.3 };
      const hot = this.state === 'windup' || this.state === 'charge';
      return { x: this.x, y: this.y - 10, radius: hot ? 60 : 44, color: [1.0, 0.75, 0.4], intensity: hot ? 0.85 : 0.5, flicker: 0.4 };
    }
    return { x: this.x, y: this.y - 6, radius: this.heartBare ? 70 : 48, color: [0.9, 0.55, 1.0], intensity: this.heartBare ? 0.9 : 0.55, flicker: 0.5 };
  }

  sync(): void {
    const dying = this.state === 'dying';
    const shake = this.state === 'windup' || dying ? Math.round(Math.sin(this.clock * 70)) : 0;
    const px = Math.round(this.x) + shake;
    const py = Math.round(this.y);
    const depth = DEPTH.entities + (this.y + 8) / 1000;

    let frame: number = BOSS.IDLE;
    if (this.state === 'stalk') frame = Math.floor(this.clock * 2.6) % 2 ? BOSS.IDLE_B : BOSS.IDLE;
    else if (this.state === 'windup') frame = BOSS.WINDUP;
    else if (this.state === 'charge') frame = BOSS.CHARGE;
    else if (this.state === 'stunned' || dying) frame = BOSS.STUNNED;
    else if (this.state === 'recover') frame = BOSS.IDLE_B;

    const gone = dying ? Math.max(0, 1 - this.t / 1.9) : 1;
    // from Nawia the stone is an echo, like everything that belongs to the living
    this.body.setFrame(frame).setPosition(px, py + 9).setDepth(depth).setAlpha((0.26 + 0.74 * this.fade) * gone);
    this.shadow.setPosition(px, py + 8).setDepth(depth - 0.0005).setAlpha(this.fade * gone);
    const blink = this.state === 'windup' && Math.floor(this.t * 14) % 2 === 0;
    if (blink || (dying && Math.floor(this.t * 20) % 2 === 0)) this.body.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    else this.body.setTintMode(Phaser.TintModes.MULTIPLY).setTint(this.fade < 0.5 ? 0x9fb0d8 : this.state === 'sleep' ? 0xa8a8b8 : 0xffffff);

    // from Jawia the heart is only a glimmer in the crack
    const bare = this.heartBare || dying;
    const bob = Math.round(Math.sin(this.clock * 4) * 1.2);
    const seen = (1 - this.fade) * gone;
    this.heart
      .setFrame(MOB.HEART + (bare ? 2 : 0) + (Math.floor(this.clock * (bare ? 9 : 5)) % 2))
      .setPosition(px, py - 7 + bob)
      .setDepth(depth + 0.0003)
      .setAlpha(seen);
    if (this.flash > 0) this.heart.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    else this.heart.setTintMode(Phaser.TintModes.MULTIPLY).setTint(0xffffff);
    this.glow.setPosition(px, py - 7 + bob).setAlpha((bare ? 0.6 : 0.3) * seen + (bare ? 0.22 * this.fade * gone : 0));
  }

  destroy(): void {
    this.body.destroy();
    this.shadow.destroy();
    this.heart.destroy();
    this.glow.destroy();
  }
}
