import type Phaser from 'phaser';
import { audio } from '../audio/audio.ts';
import { input } from './input.ts';

/** Keys that work on every screen: M = mute, F = fullscreen. */
export function globalKeys(scene: Phaser.Scene): void {
  if (input.consume('mute')) audio.toggleMute();
  if (input.consume('fullscreen')) scene.scale.toggleFullscreen();
}
