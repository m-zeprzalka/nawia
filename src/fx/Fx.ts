// Particles. Small, square, unscaled: they stay on the pixel grid.

import Phaser from 'phaser';
import { DEPTH, type World } from '../config.ts';
import { PX } from '../art/sprites.ts';

const ACCENT: Record<World, number> = { jawia: 0xffcf6a, nawia: 0x9af4ff };

export class Fx {
  private readonly scene: Phaser.Scene;
  private readonly ring: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly sparks: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly poof: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly shards: Phaser.GameObjects.Particles.ParticleEmitter;
  private motes: Phaser.GameObjects.Particles.ParticleEmitter | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
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
}
