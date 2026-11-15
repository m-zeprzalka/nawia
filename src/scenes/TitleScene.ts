// Title + the short intro. The very first thing the player does is the game's one idea:
// press SHIFT, and watch the world turn over.

import Phaser from 'phaser';
import { GAME_H, GAME_W } from '../config.ts';
import { makeTitle, TITLE_MOON } from '../art/title.ts';
import { audio } from '../audio/audio.ts';
import { globalKeys } from '../core/globalKeys.ts';
import { input } from '../core/input.ts';
import type { PixelBuffer } from '../core/PixelBuffer.ts';
import { DualCanvas } from '../fx/DualCanvas.ts';
import { STR, t, toggleLang } from '../i18n/strings.ts';
import { PixelText } from '../ui/PixelText.ts';

type Phase = 'title' | 'turn' | 'intro' | 'leave';

let cache: { jawia: PixelBuffer; nawia: PixelBuffer } | null = null;
export const titleArt = (): { jawia: PixelBuffer; nawia: PixelBuffer } =>
  (cache ??= { jawia: makeTitle('jawia'), nawia: makeTitle('nawia') });

export class TitleScene extends Phaser.Scene {
  private view!: DualCanvas;
  private subtitle!: PixelText;
  private prompt!: PixelText;
  private langHint!: PixelText;
  private jam!: PixelText;
  private veil!: Phaser.GameObjects.Rectangle;
  private story!: PixelText;
  private next!: PixelText;
  private phase: Phase = 'title';
  private clock = 0;
  private phaseT = 0;
  private page = 0;
  private chars = 0;

  constructor() {
    super('title');
  }

  create(): void {
    this.phase = 'title';
    this.clock = 0;
    this.phaseT = 0;
    this.page = 0;
    this.view = new DualCanvas(this, titleArt(), 'jawia');

    this.subtitle = new PixelText(this, 0, 62, { width: GAME_W, height: 13, align: 'center', color: 0xe8dcc0 });
    this.prompt = new PixelText(this, 0, 138, { width: GAME_W, height: 13, align: 'center', color: 0xffffff });
    this.langHint = new PixelText(this, 6, GAME_H - 14, { width: 120, height: 13, color: 0x9a94a6 });
    this.jam = new PixelText(this, GAME_W - 186, GAME_H - 14, { width: 180, height: 13, align: 'right', color: 0x9a94a6 });

    this.veil = this.add.rectangle(0, 0, GAME_W, GAME_H, 0x05050b).setOrigin(0, 0).setAlpha(1).setDepth(10);
    this.story = new PixelText(this, 24, 44, { width: GAME_W - 48, height: 100, align: 'center', lineHeight: 14 });
    this.story.image.setDepth(11).setVisible(false);
    this.next = new PixelText(this, 0, GAME_H - 18, { width: GAME_W, height: 13, align: 'center', color: 0x9a94a6 });
    this.next.image.setDepth(11).setVisible(false);

    this.refreshText();
    this.tweens.add({ targets: this.veil, alpha: 0, duration: 1200, ease: 'Quad.easeOut' });
    input.flush();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.view.destroy();
      for (const p of [this.subtitle, this.prompt, this.langHint, this.jam, this.story, this.next]) p.destroy();
    });
  }

  private refreshText(): void {
    this.subtitle.setText(t(STR.subtitle));
    this.prompt.setText(t(input.device === 'gamepad' ? STR.pressShiftPad : STR.pressShift));
    this.langHint.setText(t(STR.langHint));
    this.jam.setText(t(STR.jam));
    this.next.setText(t(STR.introNext));
    if (this.phase === 'intro') this.story.setText(t(STR.intro[this.page]), Math.floor(this.chars));
  }

  update(time: number, delta: number): void {
    const dt = Math.min(delta, 50) / 1000;
    input.update(time / 1000);
    globalKeys(this);
    this.clock += dt;
    this.phaseT += dt;
    if (input.consume('lang')) {
      toggleLang();
      this.refreshText();
    }
    const go = input.consume('shift') || input.consume('attack');

    switch (this.phase) {
      case 'title':
        this.prompt.image.setAlpha(0.55 + 0.45 * Math.sin(this.clock * 3.2));
        if (go) {
          // the first shift of the game: the moon becomes the hole in the stone
          audio.unlock();
          audio.startAmbience();
          audio.setWorld('nawia');
          audio.sfx('shiftNawia');
          this.view.reveal('nawia', TITLE_MOON.x, TITLE_MOON.y);
          this.prompt.image.setVisible(false);
          this.subtitle.setColor(0xcfffff);
          this.phase = 'turn';
          this.phaseT = 0;
        }
        break;

      case 'turn':
        if (this.phaseT > 1.7 || (go && this.phaseT > 0.5)) {
          this.phase = 'intro';
          this.phaseT = 0;
          this.page = 0;
          this.chars = 0;
          for (const p of [this.subtitle, this.langHint, this.jam]) p.image.setVisible(false);
          this.tweens.add({ targets: this.veil, alpha: 0.86, duration: 500 });
          this.story.image.setVisible(true);
          this.story.setText(t(STR.intro[0]), 0);
          this.next.image.setVisible(true);
        }
        break;

      case 'intro': {
        const full = this.story.length;
        if (this.chars < full) {
          const before = Math.floor(this.chars);
          this.chars = Math.min(full, this.chars + dt * 48);
          if (Math.floor(this.chars) !== before) {
            this.story.reveal(Math.floor(this.chars));
            if (Math.floor(this.chars) % 2 === 0) audio.sfx('text');
          }
        }
        this.next.image.setAlpha(this.chars >= full ? 0.6 + 0.4 * Math.sin(this.clock * 4) : 0.25);
        if (go) {
          if (this.chars < full) {
            this.chars = full;
            this.story.reveal(full);
          } else if (this.page < STR.intro.length - 1) {
            this.page++;
            this.chars = 0;
            this.story.setText(t(STR.intro[this.page]), 0);
          } else {
            this.phase = 'leave';
            this.phaseT = 0;
            audio.sfx('start');
            this.story.image.setVisible(false);
            this.next.image.setVisible(false);
            this.tweens.add({ targets: this.veil, alpha: 1, duration: 600, onComplete: () => this.scene.start('game') });
          }
        }
        break;
      }

      case 'leave':
        break;
    }
    this.view.update(dt);
  }
}
