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
    // ...and ?lab opens the playground
    const q = new URLSearchParams(location.search);
    this.scene.start(q.has('lab') ? 'lab' : q.has('room') ? 'game' : 'title');
  }
}
