import Phaser from 'phaser';
import { preloadOverrides, registerArt } from '../art/textures.ts';
import { input } from '../core/input.ts';

/** Generates (or loads) all art, then hands over to the title. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload(): void {
    preloadOverrides(this);
  }

  create(): void {
    registerArt(this);
    input.attach();
    // dev shortcut: ?room=<id> jumps straight into the dungeon
    const direct = new URLSearchParams(location.search).has('room');
    this.scene.start(direct ? 'game' : 'title');
  }
}
