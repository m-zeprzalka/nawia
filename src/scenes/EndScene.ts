// End of the demo.

import Phaser from 'phaser';
import { GAME_H, GAME_W } from '../config.ts';
import { audio } from '../audio/audio.ts';
import { globalKeys } from '../core/globalKeys.ts';
import { input } from '../core/input.ts';
import { DualCanvas } from '../fx/DualCanvas.ts';
import { STR, t } from '../i18n/strings.ts';
import { PixelText } from '../ui/PixelText.ts';
import { titleArt } from './TitleScene.ts';

export class EndScene extends Phaser.Scene {
  private view!: DualCanvas;
  private texts: PixelText[] = [];
  private again!: PixelText;
  private body!: PixelText;
  private clock = 0;
  private chars = 0;
  private leaving = false;

  constructor() {
    super('end');
  }

  create(): void {
    this.clock = 0;
    this.chars = 0;
    this.leaving = false;
    audio.setWorld('jawia');
    this.view = new DualCanvas(this, titleArt(), 'jawia');
    this.add.rectangle(0, 0, GAME_W, GAME_H, 0x05050b, 0.8).setOrigin(0, 0);

    const title = new PixelText(this, 0, 30, { width: GAME_W, height: 13, align: 'center', color: 0xffcf6a }).setText(t(STR.endTitle));
    this.body = new PixelText(this, 20, 54, { width: GAME_W - 40, height: 90, align: 'center', lineHeight: 14 }).setText(t(STR.endBody), 0);
    this.again = new PixelText(this, 0, GAME_H - 18, { width: GAME_W, height: 13, align: 'center', color: 0x9a94a6 }).setText(t(STR.endAgain));
    this.texts = [title, this.body, this.again];

    const veil = this.add.rectangle(0, 0, GAME_W, GAME_H, 0xf4efe4).setOrigin(0, 0).setDepth(20);
    this.tweens.add({ targets: veil, alpha: 0, duration: 1600, ease: 'Quad.easeOut' });
    input.flush();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.view.destroy();
      this.texts.forEach((p) => p.destroy());
    });
  }

  update(time: number, delta: number): void {
    const dt = Math.min(delta, 50) / 1000;
    input.update(time / 1000);
    globalKeys(this);
    this.clock += dt;
    if (this.clock > 1 && this.chars < this.body.length) {
      this.chars = Math.min(this.body.length, this.chars + dt * 40);
      this.body.reveal(Math.floor(this.chars));
    }
    const done = this.chars >= this.body.length;
    this.again.image.setAlpha(done ? 0.6 + 0.4 * Math.sin(this.clock * 4) : 0);
    if (!this.leaving && done && (input.consume('shift') || input.consume('attack'))) {
      this.leaving = true;
      const veil = this.add.rectangle(0, 0, GAME_W, GAME_H, 0x05050b).setOrigin(0, 0).setAlpha(0).setDepth(30);
      this.tweens.add({ targets: veil, alpha: 1, duration: 500, onComplete: () => this.scene.start('title') });
    }
    this.view.update(dt);
  }
}
