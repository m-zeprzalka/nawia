import Phaser from 'phaser';
import { audio } from './audio/audio.ts';
import { GAME_H, GAME_W } from './config.ts';
import { BootScene } from './scenes/BootScene.ts';
import { EndScene } from './scenes/EndScene.ts';
import { GameScene } from './scenes/GameScene.ts';
import { TitleScene } from './scenes/TitleScene.ts';

/**
 * Pixel-perfect scaling: the 320x180 canvas is only ever enlarged by a whole number of
 * *device* pixels (so it stays crisp on 125% / 150% displays too), and letterboxed.
 */
function integerZoom(): number {
  const dpr = window.devicePixelRatio || 1;
  const n = Math.floor(Math.min((window.innerWidth * dpr) / GAME_W, (window.innerHeight * dpr) / GAME_H));
  return Math.max(1, n) / dpr;
}

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  title: 'NAWIA',
  backgroundColor: '#07060b',
  pixelArt: true,
  banner: false,
  scale: {
    mode: Phaser.Scale.NONE,
    width: GAME_W,
    height: GAME_H,
    zoom: integerZoom(),
    fullscreenTarget: 'game',
  },
  // sound is synthesized by src/audio (plain WebAudio); Phaser's own sound manager is not needed
  audio: { noAudio: true },
  scene: [BootScene, TitleScene, GameScene, EndScene],
});

const refit = (): void => {
  game.scale.setZoom(integerZoom());
};
window.addEventListener('resize', refit);
document.addEventListener('fullscreenchange', () => setTimeout(refit, 50));

// Browsers only let sound start from inside a real input event, so unlock it on the first one.
for (const ev of ['keydown', 'pointerdown'] as const) window.addEventListener(ev, () => audio.unlock());
document.addEventListener('visibilitychange', () => audio.setSuspended(document.hidden));
