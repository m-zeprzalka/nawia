// Everything drawn on top of the world: hearts, the stone, room names, inscriptions, hints.

import Phaser from 'phaser';
import { GAME_H, GAME_W, TUNE, type World } from '../config.ts';
import { PixelBuffer, rgb, withAlpha } from '../core/PixelBuffer.ts';
import { PAL } from '../art/palette.ts';
import { PX, UI } from '../art/sprites.ts';
import { addBufferTexture } from '../art/textures.ts';
import { audio } from '../audio/audio.ts';
import { STR, t } from '../i18n/strings.ts';
import { PixelText } from './PixelText.ts';

const Z = 1000;
const ACCENT: Record<World, number> = { jawia: 0xffcf6a, nawia: 0x9af4ff };

/**
 * A text panel. Its top and bottom edges are stitched like the hem of a linen shirt:
 * red and cream cross-stitch in Jawia, the colours of souls in Nawia.
 */
function panelBuffer(world: World, w: number, h: number): PixelBuffer {
  const b = new PixelBuffer(w, h);
  const fill = rgb(world === 'jawia' ? 0x0d0b12 : 0x070a1a, 232);
  const edge = PAL[world].accentSoft;
  const edgeDim = withAlpha(PAL[world].accentSoft, 110);
  const stitchA = rgb(world === 'jawia' ? 0xc8343c : 0xe08ae8);
  const stitchB = rgb(world === 'jawia' ? 0xeadfc4 : 0x9af4ff);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const border = x === 0 || y === 0 || x === w - 1 || y === h - 1;
      const corner = (x < 2 && y < 2 && x + y < 2) || (x > w - 3 && y < 2 && w - 1 - x + y < 2) ||
        (x < 2 && y > h - 3 && x + h - 1 - y < 2) || (x > w - 3 && y > h - 3 && w - 1 - x + h - 1 - y < 2);
      if (corner) continue;
      let col = border ? edge : x === 1 || y === 1 || x === w - 2 || y === h - 2 ? edgeDim : fill;
      const k = x % 8;
      if (y === 0 || y === h - 1) col = k < 3 ? stitchA : k === 3 || k === 7 ? fill : stitchB;
      else if ((y === 1 || y === h - 2) && x > 1 && x < w - 2) col = k === 1 ? stitchA : k === 5 ? stitchB : fill;
      b.set(x, y, col);
    }
  return b;
}

/** What a conversation shows at one moment. */
export interface TalkView {
  /** who is speaking, or null for nobody in particular */
  name: string | null;
  text: string;
  /** the answers on offer, or null */
  choices: string[] | null;
  cursor: number;
}

export class Hud {
  private readonly scene: Phaser.Scene;
  private readonly hearts: Phaser.GameObjects.Image[] = [];
  private readonly stone: Phaser.GameObjects.Image;
  private readonly worldLabel: PixelText;
  private readonly worldTag: PixelText;
  private readonly banner: PixelText;
  private readonly panel: Phaser.GameObjects.Image;
  private readonly dialog: PixelText;
  private readonly hint: PixelText;
  private readonly center: PixelText;
  private readonly flashRect: Phaser.GameObjects.Rectangle;
  private readonly namePlate: Phaser.GameObjects.Image;
  private readonly nameTag: PixelText;
  private readonly choiceBox: Phaser.GameObjects.Image;
  private readonly choiceText: PixelText;
  private readonly more: Phaser.GameObjects.Image;
  /** the mark next to the answer that is selected */
  private readonly pick: Phaser.GameObjects.Image;
  private talking = false;
  private choiceCount = 0;
  private clock = 0;

  private world: World = 'jawia';
  private dialogText: string | null = null;
  private dialogChars = 0;
  private hintText: string | null = null;
  private labelT = 0;
  private bannerT = 0;
  private stoneKick = 0;
  private stoneShake = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const fix = <T extends Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle>(o: T, depth = Z): T => {
      o.setScrollFactor(0).setDepth(depth);
      return o;
    };

    for (let i = 0; i < TUNE.player.maxHp / 2; i++) this.hearts.push(fix(scene.add.image(6 + i * 10, 6, 'ui', UI.HEART).setOrigin(0, 0)));
    this.stone = fix(scene.add.image(GAME_W - 21, 4, 'ui', UI.STONE_J).setOrigin(0, 0));

    this.worldLabel = new PixelText(scene, GAME_W - 26 - 120, 3, { width: 120, height: 13, align: 'right' });
    this.worldTag = new PixelText(scene, GAME_W - 26 - 160, 13, { width: 160, height: 13, align: 'right', color: 0xb5aebb });
    this.banner = new PixelText(scene, 0, 3, { width: GAME_W, height: 13, align: 'center' });
    fix(this.worldLabel.image).setAlpha(0);
    fix(this.worldTag.image).setAlpha(0);
    fix(this.banner.image).setAlpha(0);

    addBufferTexture(scene, 'panel:jawia', panelBuffer('jawia', 304, 42));
    addBufferTexture(scene, 'panel:nawia', panelBuffer('nawia', 304, 42));
    this.panel = fix(scene.add.image(8, GAME_H - 48, 'panel:jawia').setOrigin(0, 0)).setVisible(false);
    this.dialog = new PixelText(scene, 16, GAME_H - 45, { width: 288, height: 38 });
    fix(this.dialog.image, Z + 1).setVisible(false);

    // conversations: a name plate on the panel's top edge, a box of answers above its right end, a "more" mark
    for (const world of ['jawia', 'nawia'] as World[]) {
      addBufferTexture(scene, `plate:${world}`, panelBuffer(world, 86, 13));
      for (let n = 1; n <= 4; n++) addBufferTexture(scene, `choice:${world}:${n}`, panelBuffer(world, 176, n * 13 + 7));
    }
    this.namePlate = fix(scene.add.image(14, GAME_H - 58, 'plate:jawia').setOrigin(0, 0), Z + 1).setVisible(false);
    this.nameTag = new PixelText(scene, 16, GAME_H - 58, { width: 82, height: 13, align: 'center', color: ACCENT.jawia });
    fix(this.nameTag.image, Z + 2).setVisible(false);
    this.choiceBox = fix(scene.add.image(GAME_W - 8, GAME_H - 50, 'choice:jawia:1').setOrigin(1, 1), Z + 1).setVisible(false);
    this.choiceText = new PixelText(scene, GAME_W - 8 - 164, 0, { width: 160, height: 4 * 13 });
    fix(this.choiceText.image, Z + 2).setVisible(false);
    this.pick = fix(scene.add.image(GAME_W - 8 - 170, 0, 'px', PX.DIAMOND), Z + 2).setVisible(false);
    this.more = fix(scene.add.image(GAME_W - 18, GAME_H - 13, 'px', PX.DIAMOND), Z + 2).setVisible(false);

    this.hint = new PixelText(scene, 0, GAME_H - 17, { width: GAME_W, height: 13, align: 'center', color: 0xd8d2c8 });
    fix(this.hint.image).setAlpha(0);

    this.center = new PixelText(scene, 0, 78, { width: GAME_W, height: 26, align: 'center' });
    fix(this.center.image, Z + 5).setVisible(false);

    this.flashRect = fix(scene.add.rectangle(0, 0, GAME_W, GAME_H, 0xffffff).setOrigin(0, 0), Z - 10).setAlpha(0);
  }

  /** @param hp health in half hearts */
  setHearts(hp: number): void {
    this.hearts.forEach((h, i) => h.setFrame(hp >= i * 2 + 2 ? UI.HEART : hp === i * 2 + 1 ? UI.HEART_HALF : UI.HEART_EMPTY));
  }

  /** Update the stone and (optionally) announce the world by name. */
  setWorld(world: World, announce: boolean): void {
    this.world = world;
    this.stone.setFrame(world === 'jawia' ? UI.STONE_J : UI.STONE_N);
    this.panel.setTexture(`panel:${world}`);
    this.namePlate.setTexture(`plate:${world}`);
    this.nameTag.setColor(ACCENT[world]);
    if (this.choiceCount) this.choiceBox.setTexture(`choice:${world}:${this.choiceCount}`);
    if (announce) {
      this.worldLabel.setColor(ACCENT[world]).setText(t(STR.worldName[world]));
      this.worldTag.setText(t(STR.worldTag[world]));
      this.labelT = 1.7;
      this.stoneKick = 0.18;
    }
  }

  /** The shift was refused: the stone rattles in its setting. */
  rattle(): void {
    this.stoneShake = 0.25;
  }

  showRoomName(name: string): void {
    this.banner.setText(name);
    this.bannerT = 2.6;
  }

  /** Show an inscription (typed out), or hide it with null. */
  setDialog(text: string | null): void {
    if (text === this.dialogText) return;
    this.dialogText = text;
    this.dialogChars = 0;
    const on = text !== null;
    this.panel.setVisible(on);
    this.dialog.image.setVisible(on);
    if (on) this.dialog.setText(text, 0);
  }

  /** Show one moment of a conversation, or close it with null. */
  setTalk(view: TalkView | null): void {
    this.talking = view !== null;
    if (!view) {
      this.choiceCount = 0;
      this.namePlate.setVisible(false);
      this.nameTag.image.setVisible(false);
      this.choiceBox.setVisible(false);
      this.choiceText.image.setVisible(false);
      this.more.setVisible(false);
      this.pick.setVisible(false);
      this.setDialog(null);
      return;
    }
    this.setDialog(view.text);
    this.namePlate.setVisible(view.name !== null);
    this.nameTag.image.setVisible(view.name !== null);
    if (view.name !== null) this.nameTag.setText(view.name);
    const n = Math.min(4, view.choices?.length ?? 0);
    this.choiceCount = n;
    if (view.choices && n > 0) {
      this.choiceBox.setTexture(`choice:${this.world}:${n}`);
      const top = GAME_H - 50 - (n * 13 + 7) + 3;
      this.choiceText.setText(view.choices.slice(0, n).join('\n'));
      this.choiceText.image.setY(top);
      this.pick.setY(top + view.cursor * 13 + 6).setTint(ACCENT[this.world]);
    }
  }

  /** Is the current line still being typed out? */
  get typing(): boolean {
    return this.dialogText !== null && this.dialogChars < this.dialog.length;
  }

  /** Show the whole line at once (the player pressed a key while it was being typed). */
  finishTyping(): void {
    this.dialogChars = this.dialog.length;
    this.dialog.reveal(this.dialog.length);
  }

  setHint(text: string | null): void {
    if (text === this.hintText) return;
    this.hintText = text;
    if (text) this.hint.setText(text);
  }

  setCenter(text: string | null): void {
    this.center.image.setVisible(text !== null);
    if (text) this.center.setText(text);
  }

  flash(color: number, alpha: number, ms: number): void {
    this.flashRect.setFillStyle(color).setAlpha(alpha);
    this.scene.tweens.killTweensOf(this.flashRect);
    this.scene.tweens.add({ targets: this.flashRect, alpha: 0, duration: ms, ease: 'Quad.easeOut' });
  }

  /** Fade the whole screen to a colour and keep it there. */
  fadeOut(color: number, ms: number, done: () => void): void {
    this.flashRect.setFillStyle(color).setAlpha(0).setDepth(Z + 20);
    this.scene.tweens.killTweensOf(this.flashRect);
    this.scene.tweens.add({ targets: this.flashRect, alpha: 1, duration: ms, ease: 'Quad.easeIn', onComplete: done });
  }

  update(dt: number): void {
    // world label: hold, then fade
    this.labelT = Math.max(0, this.labelT - dt);
    const la = Math.min(1, this.labelT / 0.4);
    this.worldLabel.image.setAlpha(la);
    this.worldTag.image.setAlpha(la * 0.9);

    // room name: fade in, hold, fade out
    if (this.bannerT > 0) {
      this.bannerT = Math.max(0, this.bannerT - dt);
      const tIn = Math.min(1, (2.6 - this.bannerT) / 0.35);
      const tOut = Math.min(1, this.bannerT / 0.6);
      this.banner.image.setAlpha(Math.min(tIn, tOut));
    }

    // inscription typewriter
    if (this.dialogText !== null && this.dialogChars < this.dialog.length) {
      const before = Math.floor(this.dialogChars);
      this.dialogChars = Math.min(this.dialog.length, this.dialogChars + dt * 55);
      const now = Math.floor(this.dialogChars);
      if (now !== before) {
        this.dialog.reveal(now);
        if (now % 2 === 0) audio.sfx('text');
      }
    }

    // answers and the "more" mark wait until the line has been typed out
    this.clock += dt;
    const ready = this.talking && !this.typing;
    this.choiceBox.setVisible(ready && this.choiceCount > 0);
    this.choiceText.image.setVisible(ready && this.choiceCount > 0);
    this.pick.setVisible(ready && this.choiceCount > 0);
    this.more.setVisible(ready && this.choiceCount === 0 && Math.floor(this.clock * 3) % 2 === 0);

    // hints only when no inscription is open
    const wantHint = this.hintText !== null && this.dialogText === null ? 1 : 0;
    const a = this.hint.image.alpha;
    this.hint.image.setAlpha(a + Math.sign(wantHint - a) * Math.min(Math.abs(wantHint - a), dt * 5));

    // the stone: a little hop when it turns, a rattle when it cannot
    this.stoneKick = Math.max(0, this.stoneKick - dt);
    this.stoneShake = Math.max(0, this.stoneShake - dt);
    const hop = this.stoneKick > 0 ? -Math.round(Math.sin((this.stoneKick / 0.18) * Math.PI) * 3) : 0;
    const shake = this.stoneShake > 0 ? (Math.floor(this.stoneShake * 40) % 2 ? 1 : -1) : 0;
    this.stone.setPosition(GAME_W - 21 + shake, 4 + hop);
  }

  get currentWorld(): World {
    return this.world;
  }
}
