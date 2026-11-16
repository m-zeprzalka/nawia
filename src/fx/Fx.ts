// Particles. Small, square, unscaled: they stay on the pixel grid.
//
// Two kinds: Phaser emitters for the soft things (the burst of the stone, motes in the air, smoke), and a little
// system of single pixels of their own colour for the hard ones: sparks thrown the way a blow went, the ichor of
// a monster, dust kicked up by feet, and a monster coming apart into the pixels it was drawn with. The pixels
// move only while the game does (`update` gets the frame's time, which is 0 in a hit-stop), so a blow's sparks
// hang in the air with everything else for that instant.

import Phaser from 'phaser';
import { DEPTH, type World } from '../config.ts';
import { IMPACT } from '../art/combatFx.ts';
import { PX } from '../art/sprites.ts';
import { SHEET_PIXELS } from '../art/textures.ts';

interface Pixel {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** px/s^2 down the screen (negative: rising) */
  grav: number;
  /** velocity kept per second (drag) */
  drag: number;
  life: number;
  max: number;
  color: number;
  /** 2 for a fat speck */
  size: number;
  /** drawn over the darkness (light), or under it */
  glow: boolean;
}

interface Flick {
  sprite: Phaser.GameObjects.Sprite;
  frames: number[];
  t: number;
  step: number;
}

const ACCENT: Record<World, number> = { jawia: 0xffcf6a, nawia: 0x9af4ff };

export class Fx {
  private readonly scene: Phaser.Scene;
  private readonly ring: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly sparks: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly poof: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly shards: Phaser.GameObjects.Particles.ParticleEmitter;
  private motes: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private readonly pixels: Pixel[] = [];
  private readonly ground: Phaser.GameObjects.Graphics;
  private readonly light: Phaser.GameObjects.Graphics;
  /** Under everyone, on the floor: the lanes of coming charges. */
  private readonly floor: Phaser.GameObjects.Graphics;
  private readonly flicks: Flick[] = [];
  /** Lines to paint on the ground this frame only (the path of a coming charge). */
  private readonly marks: { x: number; y: number; dx: number; dy: number; len: number; color: number; alpha: number }[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.ground = scene.add.graphics().setDepth(DEPTH.fxWorld);
    this.light = scene.add.graphics().setDepth(DEPTH.fog + 6).setBlendMode(Phaser.BlendModes.ADD);
    this.floor = scene.add.graphics().setDepth(DEPTH.floorDecor + 1);
    // the burst that leaves the stone when it turns: glows over the darkness
    this.ring = scene.add
      .particles(0, 0, 'px', {
        frame: [PX.DOT2, PX.PLUS, PX.DOT],
        lifespan: { min: 260, max: 520 },
        speed: { min: 50, max: 150 },
        angle: { min: 0, max: 360 },
        alpha: { start: 1, end: 0 },
        emitting: false,
      })
      .setDepth(DEPTH.fog + 5)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.sparks = scene.add
      .particles(0, 0, 'px', {
        frame: [PX.DOT, PX.DOT2, PX.STREAK],
        lifespan: { min: 120, max: 280 },
        speed: { min: 40, max: 130 },
        angle: { min: 0, max: 360 },
        alpha: { start: 1, end: 0 },
        emitting: false,
      })
      .setDepth(DEPTH.fog + 5)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.poof = scene.add
      .particles(0, 0, 'px', {
        frame: [PX.DIAMOND, PX.PLUS, PX.DOT2],
        lifespan: { min: 300, max: 700 },
        speed: { min: 10, max: 60 },
        angle: { min: 0, max: 360 },
        gravityY: -30,
        alpha: { start: 0.9, end: 0 },
        emitting: false,
      })
      .setDepth(DEPTH.fxWorld);

    this.shards = scene.add
      .particles(0, 0, 'px', {
        frame: [PX.SHARD, PX.DOT2],
        lifespan: { min: 300, max: 600 },
        speed: { min: 30, max: 100 },
        angle: { min: 200, max: 340 },
        gravityY: 260,
        alpha: { start: 1, end: 0.2 },
        emitting: false,
      })
      .setDepth(DEPTH.fxWorld);
  }

  /**
   * Ambient specks for the current room: dust in Jawia, rising wisps in Nawia.
   * Under the open sky the living world has pollen drifting on the wind instead.
   */
  setAmbience(world: World, x: number, y: number, w: number, h: number, outdoors = false, blight = 0): void {
    this.motes?.destroy();
    // where the blight is thick, what drifts in the air of Jawia is no longer pollen: it rises, and it glows
    const spores = outdoors && world === 'jawia' && blight >= 2;
    const nawia = world === 'nawia' || spores;
    const pollen = outdoors && !nawia;
    this.motes = this.scene.add
      .particles(0, 0, 'px', {
        frame: nawia ? [PX.DOT, PX.DOT, PX.PLUS] : [PX.DOT],
        lifespan: { min: 2600, max: 5200 },
        speedX: pollen ? { min: 5, max: 16 } : { min: -5, max: 5 },
        speedY: nawia ? { min: -16, max: -5 } : pollen ? { min: -2, max: 7 } : { min: -3, max: 4 },
        alpha: { start: nawia ? 0.75 : pollen ? 0.8 : 0.5, end: 0 },
        tint: spores ? [0xd070f0, 0xff7ad8, 0xb46edc] : nawia ? [0x9af4ff, 0xb9c8ff, 0xffffff] : pollen ? [0xfff6c8, 0xe4f4a8, 0xffffff] : [0xd8c8a8, 0xa8a090],
        // the same density of specks whatever the size of the room
        frequency: (nawia ? 90 : 220) * Math.min(1, (320 * 176) / (w * h)),
        emitZone: {
          type: 'random',
          source: {
            getRandomPoint: (p: Phaser.Types.Math.Vector2Like): void => {
              p.x = x + Math.random() * w;
              p.y = y + Math.random() * h;
            },
          },
        },
      })
      .setDepth(nawia ? DEPTH.fog + 2 : DEPTH.fxWorld)
      .setBlendMode(nawia ? Phaser.BlendModes.ADD : Phaser.BlendModes.NORMAL);
  }

  shiftBurst(x: number, y: number, to: World): void {
    this.ring.setParticleTint(ACCENT[to]);
    this.ring.explode(22, x, y);
  }

  hit(x: number, y: number, world: World): void {
    this.sparks.setParticleTint(world === 'jawia' ? 0xfff0a8 : 0xd8f4ff);
    this.sparks.explode(9, x, y);
  }

  clink(x: number, y: number): void {
    this.sparks.setParticleTint(0xffffff);
    this.sparks.explode(4, x, y);
  }

  death(x: number, y: number, world: World): void {
    this.poof.setParticleTint(world === 'jawia' ? 0x6c9c72 : 0xcfe8ff);
    this.poof.explode(16, x, y);
  }

  debris(x: number, y: number, tint = 0x8a7a6c, count = 6): void {
    this.shards.setParticleTint(tint);
    this.shards.explode(count, x, y);
  }

  /** Steel on the shield rim. */
  block(x: number, y: number): void {
    this.sparks.setParticleTint(0xffe8b0);
    this.sparks.explode(7, x, y);
  }

  /** A heart taken: a small rising sparkle. */
  pickup(x: number, y: number): void {
    this.poof.setParticleTint(0xff8a80);
    this.poof.explode(8, x, y);
  }

  /** The border closing on him: light falling inward. */
  reject(x: number, y: number, world: World): void {
    this.ring.setParticleTint(ACCENT[world]);
    this.ring.explode(30, x, y);
    this.poof.setParticleTint(0xc9323e);
    this.poof.explode(10, x, y);
  }

  // ------------------------------------------------------------------ the pixel system

  /** Moves and draws the pixels and the short sprite effects. `dt` is 0 during a hit-stop. */
  update(dt: number): void {
    this.ground.clear();
    this.light.clear();
    this.floor.clear();
    for (const m of this.marks.splice(0)) {
      // two rows of dashes on the ground, as wide as the charge, fading away from it; they creep forward
      const crawl = (performance.now() / 40) % 6;
      for (let d = 8 + crawl; d < m.len; d += 6) {
        const a = m.alpha * Math.pow(1 - d / m.len, 0.7);
        this.floor.fillStyle(m.color, a);
        for (const side of [-5, 5]) {
          const x = m.x + m.dx * d - m.dy * side;
          const y = m.y + m.dy * d + m.dx * side;
          this.floor.fillRect(Math.round(x), Math.round(y), 2, 2);
          this.floor.fillRect(Math.round(x + m.dx * 2), Math.round(y + m.dy * 2), 2, 2);
        }
      }
    }
    for (let i = this.pixels.length - 1; i >= 0; i--) {
      const p = this.pixels[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.pixels[i] = this.pixels[this.pixels.length - 1];
        this.pixels.pop();
        continue;
      }
      const k = Math.pow(p.drag, dt);
      p.vx *= k;
      p.vy = p.vy * k + p.grav * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const a = Math.min(1, (p.life / p.max) * 2.2);
      const g = p.glow ? this.light : this.ground;
      g.fillStyle(p.color, a);
      g.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
    }
    for (let i = this.flicks.length - 1; i >= 0; i--) {
      const f = this.flicks[i];
      f.t += dt;
      const n = Math.floor(f.t / f.step);
      if (n >= f.frames.length) {
        f.sprite.destroy();
        this.flicks.splice(i, 1);
      } else f.sprite.setFrame(f.frames[n]);
    }
  }

  private add(p: Partial<Pixel> & { x: number; y: number; color: number }): void {
    if (this.pixels.length > 1400) return;
    const life = p.life ?? 0.5;
    this.pixels.push({ vx: 0, vy: 0, grav: 0, drag: 0.05, size: 1, glow: false, max: life, life, ...p });
  }

  /** A short sprite effect from the impact sheet, frame by frame. */
  private flick(x: number, y: number, frames: number[], step: number, tint: number, depth: number, add = true): void {
    const sprite = this.scene.add.sprite(Math.round(x), Math.round(y), 'impact', frames[0]).setDepth(depth).setTint(tint);
    if (add) sprite.setBlendMode(Phaser.BlendModes.ADD);
    this.flicks.push({ sprite, frames, t: 0, step });
  }

  /**
   * A blow landing at (x, y), struck in direction `angle` (radians): the star, sparks flying on the way the
   * blade went, and drops of whatever the thing bleeds (`blood`, a few colours).
   */
  strike(x: number, y: number, angle: number, world: World, blood: number[], heavy: boolean): void {
    const tint = world === 'jawia' ? 0xfff2c8 : 0xc8f6ff;
    this.flick(x, y, [0, 1, 2, 3], heavy ? 0.05 : 0.04, tint, DEPTH.fog + 7);
    const sparks = heavy ? 14 : 8;
    for (let i = 0; i < sparks; i++) {
      const a = angle + (Math.random() - 0.5) * 1.3;
      const v = 90 + Math.random() * (heavy ? 170 : 110);
      this.add({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, drag: 0.004, life: 0.12 + Math.random() * 0.16, color: i % 3 ? tint : 0xffffff, glow: true });
    }
    const drops = heavy ? 12 : 7;
    for (let i = 0; i < drops; i++) {
      const a = angle + (Math.random() - 0.5) * 1.6;
      const v = 40 + Math.random() * 90;
      this.add({
        x: x + (Math.random() - 0.5) * 4, y: y + (Math.random() - 0.5) * 4,
        vx: Math.cos(a) * v, vy: Math.sin(a) * v - 30, grav: 220, drag: 0.08,
        life: 0.35 + Math.random() * 0.35, color: blood[i % blood.length], size: i % 4 === 0 ? 2 : 1,
      });
    }
  }

  /** The path a charge will take, painted on the ground for this frame: `k` (0..1) is how close it is. */
  lane(x: number, y: number, dx: number, dy: number, len: number, k: number, color = 0xd8402a): void {
    this.marks.push({ x, y, dx, dy, len, color, alpha: 0.3 + 0.55 * k });
  }

  /** The tell of a coming strike: a glint over its head. */
  glint(x: number, y: number, tint = 0xffb060): void {
    const g = IMPACT.GLINT;
    this.flick(x, y, [g + 2, g + 1, g, g, g + 1, g + 2], 0.035, tint, DEPTH.fog + 7);
  }

  /** Dust kicked up at (x, y): `n` specks, outwards and settling. */
  dust(x: number, y: number, n: number, tint = 0xcbb89a, spread = 1): void {
    for (let i = 0; i < n; i++) {
      const a = Math.PI + Math.random() * Math.PI;
      const v = (12 + Math.random() * 34) * spread;
      this.add({ x: x + (Math.random() - 0.5) * 6, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.5, grav: 30, drag: 0.02, life: 0.25 + Math.random() * 0.3, color: tint, size: i % 3 === 0 ? 2 : 1 });
    }
  }

  /**
   * A thing coming apart into its own pixels: every pixel of the sprite's current frame flies off its place.
   * In Jawia they burst and fall; in Nawia they rise like sparks of a fire and go out.
   */
  disintegrate(sprite: Phaser.GameObjects.Sprite, world: World, fromX: number, fromY: number): void {
    const buf = SHEET_PIXELS.get(sprite.texture.key);
    const fr = sprite.frame;
    if (!buf) return;
    const w = fr.cutWidth;
    const h = fr.cutHeight;
    const left = sprite.x - sprite.originX * w;
    const top = sprite.y - sprite.originY * h;
    const cx = left + w / 2;
    const cy = top + h / 2;
    const away = Math.atan2(cy - fromY, cx - fromX);
    const rising = world === 'nawia';
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const c = buf.get(fr.cutX + x, fr.cutY + y);
        if (!(c >>> 24)) continue;
        const wx = left + (sprite.flipX ? w - 1 - x : x);
        const wy = top + y;
        const color = ((c & 0xff) << 16) | (c & 0xff00) | ((c >> 16) & 0xff);
        const out = Math.atan2(wy - cy, wx - cx);
        const a = Math.random() < 0.55 ? away + (Math.random() - 0.5) * 1.4 : out;
        const v = 20 + Math.random() * 70;
        const delay = Math.random() * 0.18;
        this.add({
          x: wx, y: wy,
          vx: Math.cos(a) * v, vy: Math.sin(a) * v + (rising ? -25 : -20),
          grav: rising ? -40 - Math.random() * 40 : 160, drag: rising ? 0.2 : 0.05,
          life: 0.45 + delay + Math.random() * 0.5, color, glow: rising && Math.random() < 0.4,
        });
      }
    this.flick(cx, cy, [0, 1, 2, 3], 0.05, rising ? 0xc8f6ff : 0xfff2c8, DEPTH.fog + 7);
  }
}
