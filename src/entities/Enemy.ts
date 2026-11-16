// Enemies belong to one world. On their side they are solid and dangerous;
// from the other side they are only an echo: you see them move, but nothing can touch.
//
// Every kind warns before it strikes (a wind-up you can read: the pose, a glow of heat, a glint), then commits.
// Only the strike itself hurts: walking into a monster that is not attacking does nothing but push.
//   utopiec  - Jawia. Wades towards you, crouches, lunges.
//   zjawa    - Nawia. Circles, then swoops straight through you. Flies over water.
//   ognik    - Jawia. Hangs where it is (often over water) and spits fire. A raised shield sends the fire back.
//   strzyga  - has two souls. Kill the body in Jawia and the second soul gets up in Nawia. Her lunge cannot be broken.
//   dzik     - Jawia. A boar: paws the ground, then charges a long way in a straight line. Blows do not stop the
//              charge; a wall does, and then it stands there dazed, and blows hurt it twice as much.
//   wilk     - Jawia. A blighted wolf: circles on the ground like a wraith does in the air, lunges, backs off.
//   morownik - Jawia. A blight bloom: rooted. Opens and spits three thorns; the blade reaches it, the shield stops the thorns.
//
// A blow that lands knocks it back and makes it flinch (the wind-up it was in is lost), unless it is in a
// strike that cannot be broken. After the first blow a thin bar over it shows what is left of it.
// The scene hands out the right to attack (`allowAttack`): only a few close-range attackers at a time.

import Phaser from 'phaser';
import { DEPTH, otherWorld, type World } from '../config.ts';
import { MOB } from '../art/actors.ts';
import { beastFrame, type Beast } from '../art/beasts/beast.ts';
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
  rest: number; // seconds of catching its breath afterwards (the opening)
  cooldown: number;
  glow: number; // tint of its halo, 0 = none
  /** how far blows throw it (1 = an ordinary body) */
  weight: number;
  /** its strike cannot be broken by a blow */
  armor: boolean;
  /** it spits instead of lunging */
  ranged: boolean;
}

const SPECS: Record<EnemyKind, Spec> = {
  utopiec: {
    home: 'jawia', frame: MOB.UTOPIEC, hp: 4, hw: 6, hh: 5, speed: 40, wander: 14, sight: 112, mask: BLOCK_WALK, hover: 0, fps: 3,
    reach: 46, windup: 0.46, dash: 170, dashTime: 0.26, rest: 0.75, cooldown: 1.4, glow: 0, weight: 1, armor: false, ranged: false,
  },
  zjawa: {
    home: 'nawia', frame: MOB.ZJAWA, hp: 3, hw: 5, hh: 5, speed: 58, wander: 16, sight: 132, mask: BLOCK_FLY, hover: 3, fps: 2.4,
    reach: 72, windup: 0.4, dash: 155, dashTime: 0.5, rest: 0.6, cooldown: 1.2, glow: 0xb060e0, weight: 1.2, armor: false, ranged: false,
  },
  ognik: {
    home: 'jawia', frame: MOB.OGNIK, hp: 1, hw: 5, hh: 5, speed: 0, wander: 0, sight: 150, mask: BLOCK_FLY, hover: 4, fps: 8,
    reach: 150, windup: 0.55, dash: 0, dashTime: 0, rest: 0.3, cooldown: 2.2, glow: 0x8ee04a, weight: 1, armor: false, ranged: true,
  },
  strzyga: {
    home: 'jawia', frame: MOB.STRZYGA, hp: 4, hw: 6, hh: 5, speed: 62, wander: 20, sight: 140, mask: BLOCK_WALK, hover: 0, fps: 4,
    reach: 58, windup: 0.32, dash: 220, dashTime: 0.24, rest: 0.5, cooldown: 1.1, glow: 0, weight: 0.8, armor: true, ranged: false,
  },
  dzik: {
    home: 'jawia', frame: MOB.DZIK, hp: 6, hw: 7, hh: 5, speed: 30, wander: 16, sight: 128, mask: BLOCK_WALK, hover: 0, fps: 5,
    reach: 92, windup: 0.7, dash: 210, dashTime: 0.85, rest: 1.0, cooldown: 1.6, glow: 0, weight: 0.45, armor: true, ranged: false,
  },
  wilk: {
    home: 'jawia', frame: MOB.WILK, hp: 4, hw: 6, hh: 5, speed: 74, wander: 22, sight: 150, mask: BLOCK_WALK, hover: 0, fps: 7,
    reach: 70, windup: 0.36, dash: 200, dashTime: 0.3, rest: 0.65, cooldown: 1.3, glow: 0xc050e0, weight: 0.9, armor: false, ranged: false,
  },
  morownik: {
    home: 'jawia', frame: MOB.MOROWNIK, hp: 3, hw: 6, hh: 6, speed: 0, wander: 0, sight: 118, mask: BLOCK_WALK, hover: 0, fps: 1.6,
    reach: 118, windup: 0.8, dash: 0, dashTime: 0, rest: 0.5, cooldown: 2.5, glow: 0xc050e0, weight: 0, armor: false, ranged: true,
  },
};

/** How fast a blight bloom's thorns fly, and how wide it spreads them (radians). */
const THORN_SPEED = 64;
const THORN_FAN = [-0.42, 0, 0.42];

/** How fast a wisp's fire flies. */
const WISP_SHOT_SPEED = 74;

/** How long a flinch lasts (s): an ordinary blow, the heavy third. */
const FLINCH = 0.24;
const FLINCH_HEAVY = 0.42;
/** How long the bar over it stays after a blow (s). */
const BAR_TIME = 2.6;

export interface Bounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** What happened to it this frame, for the scene to dress up. */
export type EnemyEvent = 'windup' | 'strike' | 'bump';

type Mode = 'roam' | 'windup' | 'dash' | 'rest' | 'rising' | 'hurt';

/** The body of a drawn monster, from its standing frame: where its pixels are, from its feet. */
interface Body {
  dx: number;
  dy: number;
  hw: number;
  hh: number;
}
const bodies = new Map<string, Body>();

function bodyOf(b: Beast, world: World): Body {
  const key = `${b.id}:${b.nawia ? world : 'jawia'}`;
  let body = bodies.get(key);
  if (body) return body;
  const pic = beastFrame(b, b.nawia ? world : 'jawia', 'stand', 0, false);
  let x0: number = b.w;
  let y0: number = b.h;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < pic.h; y++)
    for (let x = 0; x < pic.w; x++)
      if (pic.get(x, y) >>> 24) {
        x0 = Math.min(x0, x);
        y0 = Math.min(y0, y);
        x1 = Math.max(x1, x);
        y1 = Math.max(y1, y);
      }
  // the cell's row h-1 sits on its feet; a blow must reach what you see, a little inside its outline
  body = { dx: (x0 + x1 + 1) / 2 - b.w / 2, dy: (y0 + y1 + 1) / 2 - (b.h - 1), hw: Math.max(5, ((x1 - x0 + 1) / 2) * 0.82), hh: Math.max(5, ((y1 - y0 + 1) / 2) * 0.82) };
  bodies.set(key, body);
  return body;
}

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
  maxHp: number;
  dead = false;
  /** Seconds of white flash left after being hit. */
  flash = 0;
  /** Strzyga: true for the frame in which her second soul got up on the other side. */
  rose = false;
  /** Dzik: true for the frame in which its charge ended against something solid. */
  bumped = false;
  /** May it start an attack now? The scene decides, so that they do not all come at once. */
  allowAttack = true;
  /** Ognik, morownik: called when it spits (position, velocity). */
  onShoot: ((x: number, y: number, vx: number, vy: number) => void) | null = null;
  /** What happened this frame; the scene reads and clears it. */
  readonly events: EnemyEvent[] = [];

  readonly sprite: Phaser.GameObjects.Sprite;
  readonly shadow: Phaser.GameObjects.Image;
  private glow: Phaser.GameObjects.Image | null = null;
  private readonly barBack: Phaser.GameObjects.Rectangle;
  private readonly barFill: Phaser.GameObjects.Rectangle;

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
  private dazed = false;
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
  private moved = 0;
  private barT = 0;
  /** In the rest after a strike or a bash: it shows its recovery, off balance. */
  private offBalance = false;

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
    this.maxHp = this.spec.hp;
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
    this.barBack = scene.add.rectangle(x, y, 14, 3, 0x14101c).setOrigin(0, 0).setVisible(false).setDepth(DEPTH.fxWorld + 1);
    this.barFill = scene.add.rectangle(x, y, 12, 1, 0xe0485a).setOrigin(0, 0).setVisible(false).setDepth(DEPTH.fxWorld + 2);
    if (this.spec.glow) this.addGlow(this.spec.glow);
    this.sync();
  }

  private addGlow(tint: number): void {
    this.glow = this.scene.add.image(this.x, this.y, 'glow').setBlendMode(Phaser.BlendModes.ADD).setTint(tint).setDepth(DEPTH.fog + 1);
  }

  private get beast(): Beast | null {
    return Enemy.newLooks ? GAME_BEASTS[this.kind] : null;
  }

  /** Its feet: what walls stop. */
  get box(): Box {
    return { x: this.x, y: this.y, hw: this.spec.hw, hh: this.spec.hh };
  }

  /** Its body as it is drawn: what a blade hits. */
  get hurtBox(): Box {
    const b = this.beast;
    const top = this.y + this.spec.hh + 2 - this.hover;
    if (!b) return { x: this.x, y: top - 7, hw: this.spec.hw + 1, hh: this.spec.hh + 3 };
    const body = bodyOf(b, this.visible);
    return { x: this.x + (this.faceLeft ? -body.dx : body.dx), y: top + body.dy, hw: body.hw, hh: body.hh };
  }

  /** What its strike reaches, while it strikes; null when it is not striking. */
  get attackBox(): Box | null {
    if (this.mode !== 'dash' || !this.solid) return null;
    const h = this.hurtBox;
    return { x: h.x + this.ax * 3, y: h.y + this.ay * 3, hw: h.hw + 1, hh: h.hh + 1 };
  }

  /** Can it hurt, and be hurt, right now? (Not while a second soul is still gathering itself.) */
  get solid(): boolean {
    return !this.dead && this.mode !== 'rising';
  }

  /** Winding up or striking: it holds one of the scene's attack tokens. */
  get threatening(): boolean {
    return this.mode === 'windup' || this.mode === 'dash';
  }

  get ranged(): boolean {
    return this.spec.ranged;
  }

  /** It can be pushed aside by others (rooted things cannot). */
  get movable(): boolean {
    return this.spec.weight > 0 && this.mode !== 'dash';
  }

  /** Which world the hero is in, as far as this enemy's looks are concerned. */
  setWorldVisual(world: World): void {
    this.visible = world;
  }

  private setMode(mode: Mode, restFor = this.spec.rest): void {
    if (mode === 'windup') this.events.push('windup');
    if (mode === 'dash') this.events.push('strike');
    this.offBalance = mode === 'rest' && (this.mode === 'dash' || this.mode === 'windup');
    this.mode = mode;
    this.modeT = 0;
    this.restFor = restFor;
    if (mode !== 'rest') this.dazed = false;
    if (mode === 'roam') this.orbitFor = 1.2 + Math.random() * 1.2;
  }

  update(dt: number, level: Level, world: World, px: number, py: number, playerAlive: boolean): void {
    const s = this.spec;
    this.t += dt;
    this.modeT += dt;
    this.flash = Math.max(0, this.flash - dt);
    this.barT = Math.max(0, this.barT - dt);
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
    if (Math.abs(dx) > 3 && this.mode !== 'dash' && this.mode !== 'hurt') this.faceLeft = dx < 0;

    switch (this.mode) {
      case 'rising':
        if (this.modeT >= 0.9) this.setMode('roam');
        break;
      case 'hurt':
        if (this.modeT >= this.restFor) {
          this.cd = Math.max(this.cd, 0.45);
          this.setMode('roam');
        }
        break;
      case 'rest':
        if ((this.kind === 'strzyga' || this.kind === 'wilk') && sees && this.modeT > 0.25) {
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
        if (Math.abs(this.ax) > 0.2) this.faceLeft = this.ax < 0;
        if (this.modeT >= s.dashTime) this.setMode('rest');
        break;
      case 'roam':
        if (sees) {
          if (!this.saw) this.angle = Math.atan2(-dy, -dx);
          const circles = this.kind === 'zjawa' || this.kind === 'wilk';
          const ready = this.cd <= 0 && dist < s.reach && (!circles || this.modeT > this.orbitFor) && (s.ranged || this.allowAttack);
          if (ready) {
            this.setMode('windup');
          } else if (circles) {
            // wraiths never come straight at you: they circle, closing in
            this.angle += dt * 1.6 * this.spin;
            const ring = this.allowAttack ? 42 : 58;
            const tx = px + Math.cos(this.angle) * ring;
            const ty = py + Math.sin(this.angle) * ring;
            const d = Math.hypot(tx - this.x, ty - this.y) || 1;
            const sp = Math.min(s.speed, d * 6);
            vx = ((tx - this.x) / d) * sp;
            vy = ((ty - this.y) / d) * sp;
          } else if (s.speed > 0) {
            // waiting its turn: it keeps its distance instead of crowding in
            const keep = !this.allowAttack && dist < s.reach + 10 ? -0.4 : 1;
            vx = (dx / dist) * s.speed * keep;
            vy = (dy / dist) * s.speed * keep;
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
    const x0 = this.x;
    const y0 = this.y;
    const hit = level.move(this.home, box, (vx + this.kx) * dt, (vy + this.ky) * dt, this.mask);
    if (hit.hitX || hit.hitY) {
      this.wanderT = Math.min(this.wanderT, 0.15);
      if (this.mode === 'dash' && this.modeT > 0.06) {
        // a boar that runs into something sits there seeing stars: that is when to hit it
        if (this.kind === 'dzik') {
          this.bumped = true;
          this.events.push('bump');
          this.setMode('rest', 1.9);
          this.dazed = true;
        } else this.setMode('rest');
      }
    }
    const b = this.bounds;
    const m = 10;
    this.x = Math.min(b.x + b.w - m, Math.max(b.x + m, box.x));
    this.y = Math.min(b.y + b.h - m, Math.max(b.y + m, box.y));
    if (this.x !== box.x || this.y !== box.y) this.wanderT = 0;
    this.moved = Math.hypot(this.x - x0, this.y - y0) / Math.max(dt, 1e-4);

    // echoes fade in and out instead of popping
    const target = this.visible === this.home ? 1 : 0;
    this.fade += Math.sign(target - this.fade) * Math.min(Math.abs(target - this.fade), dt * 9);
    this.sync();
  }

  /** Pushes it by (dx, dy) px, against walls (the scene keeps bodies from piling up). */
  nudge(level: Level, dx: number, dy: number): void {
    const box = this.box;
    level.move(this.home, box, dx, dy, this.mask);
    this.x = box.x;
    this.y = box.y;
  }

  /**
   * A blade (or its own fire, sent back) landed: `damage` blows' worth, thrown back with `knock`.
   * Returns false if it could not be hurt (already hit by this swing, or not solid).
   */
  hit(swingId: number, fromX: number, fromY: number, damage = 1, knock = 170, heavy = false): boolean {
    if (!this.solid || swingId === this.lastSwing) return false;
    this.lastSwing = swingId;
    // a boar that has run into a wall cannot defend itself
    this.hp -= this.dazed ? damage * 2 : damage;
    this.flash = 0.08;
    this.barT = BAR_TIME;
    const unbroken = this.spec.armor && this.mode === 'dash';
    this.shove(fromX, fromY, knock * (unbroken ? 0.25 : 1));
    if (this.hp > 0) {
      if (!unbroken && !this.dazed) this.setMode('hurt', heavy ? FLINCH_HEAVY : FLINCH);
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
      this.barT = 0;
      if (!this.glow) this.addGlow(0x70b0ff);
      this.setMode('rising');
    } else this.dead = true;
    return true;
  }

  /** Comes up out of the ground (a wave of an arena): not solid until it has gathered itself. */
  emerge(): void {
    this.setMode('rising');
    this.cd = 0.8;
  }

  /** Called after it struck the hero: back off for a moment. */
  recoil(fromX: number, fromY: number): void {
    this.shove(fromX, fromY, 90);
    this.setMode('rest', 0.6);
  }

  /** It ran into the raised shield: thrown back and off balance, which is the opening for a strike. */
  bash(fromX: number, fromY: number, perfect = false): void {
    this.shove(fromX, fromY, perfect ? 260 : 200);
    this.setMode('rest', perfect ? 1.6 : 0.95);
    this.offBalance = true;
    this.flash = 0.06;
  }

  private shove(fromX: number, fromY: number, force: number): void {
    const w = this.spec.weight;
    if (w <= 0) return; // rooted
    const d = Math.hypot(this.x - fromX, this.y - fromY) || 1;
    this.kx = ((this.x - fromX) / d) * force * w;
    this.ky = ((this.y - fromY) / d) * force * w;
  }

  /** Which picture of its sheet it shows: 0 stands, 1-4 walk, 5 wind-up, 6 blow, 7 recovery, 8 flinch. */
  private phase(): number {
    const s = this.spec;
    if (this.mode === 'hurt' || this.dazed) return 8;
    if (this.mode === 'windup') return 5;
    if (this.mode === 'dash') return 6;
    if (this.mode === 'rest' && this.offBalance && this.modeT < Math.min(0.45, this.restFor * 0.6)) return 7;
    // things that hover or are rooted keep their walk going (it is their breathing, their flicker)
    const inPlace = s.speed === 0 || this.hover > 0;
    if (!inPlace && this.moved < 6) return 0;
    return 1 + (Math.floor(this.t * Math.min(s.fps * 2, 7)) % 4);
  }

  sync(): void {
    const s = this.spec;
    const warning = this.mode === 'windup';
    const shaking = warning || (this.mode === 'hurt' && this.modeT < 0.1);
    const px = Math.round(this.x) + (shaking ? Math.round(Math.sin(this.modeT * 70)) : 0);
    const py = Math.round(this.y);
    const bob = this.hover ? Math.round(Math.sin(this.t * 3) * 1.5) : 0;
    const depth = DEPTH.entities + (this.y + s.hh) / 1000;

    const beast = this.beast;
    if (beast) {
      const key = beastKey(beast, this.visible);
      if (this.sprite.texture.key !== key) this.sprite.setTexture(key).setOrigin(0.5, (beast.h - 1) / beast.h);
      this.sprite.setFrame(beastFrameOf(beast, this.visible, this.phase()));
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
    this.glow?.setPosition(px, py - 6 + bob).setAlpha((warning ? 0.6 : 0.3) * this.fade * rising);
    // hit: white. winding up: it heats from inside, faster and faster, so the warning reads even in a crowd.
    if (this.flash > 0) this.sprite.setTintMode(Phaser.TintModes.FILL).setTint(0xffffff);
    else if (warning && this.fade > 0.5) {
      const k = Math.min(1, this.modeT / s.windup);
      const pulse = 0.5 + 0.5 * Math.sin(this.modeT * (14 + 26 * k));
      const heat = Math.round((0.25 + 0.55 * k) * pulse * 255);
      this.sprite.setTintMode(Phaser.TintModes.ADD).setTint((heat << 16) | (Math.round(heat * 0.35) << 8) | Math.round(heat * 0.15));
    } else this.sprite.setTintMode(Phaser.TintModes.MULTIPLY).setTint(this.fade < 0.5 ? 0x9fb0d8 : 0xffffff);

    // what is left of it, over its head, for a while after each blow
    const showBar = this.barT > 0 && this.fade > 0.5 && !this.dead;
    this.barBack.setVisible(showBar);
    this.barFill.setVisible(showBar);
    if (showBar) {
      const h = this.hurtBox;
      const bx = Math.round(this.x) - 7;
      const by = Math.round(h.y - h.hh) - 5;
      const a = Math.min(1, this.barT / 0.4);
      this.barBack.setPosition(bx, by).setAlpha(0.85 * a);
      this.barFill.setPosition(bx + 1, by + 1).setSize(Math.max(0, Math.round((12 * this.hp) / this.maxHp)), 1).setAlpha(a);
    }
  }

  /** Where its head is (for a glint over it), in world px. */
  get headX(): number {
    return this.hurtBox.x;
  }
  get headY(): number {
    const h = this.hurtBox;
    return h.y - h.hh + 2;
  }

  destroy(): void {
    this.sprite.destroy();
    this.shadow.destroy();
    this.glow?.destroy();
    this.barBack.destroy();
    this.barFill.destroy();
  }
}
