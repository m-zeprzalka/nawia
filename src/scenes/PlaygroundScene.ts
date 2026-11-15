// The playground: a place to compare looks, not to play.
//
// The hero walks around a meadow that has a bit of everything in it. Along the roads stand exhibits:
// the hero in every costume, the villagers, every monster in more than one reading. Keys change the
// drawing style of the figures, the hero's costume, the hour and season of the scenery, the colour depth
// and the world. Every exhibit has a code (H2, P7...) so a choice can be named in one word.
//
// Nothing here is used by the game itself. What is chosen here gets built into the game; see docs/PLAYGROUND.md.
//
//   1-4   figure style        Q / E   hero costume        N   scenery mood       C   colour depth
//   SHIFT world               G       tile grid           T   labels             ESC back to the title

import Phaser from 'phaser';
import { DEPTH, GAME_H, GAME_W, TILE, TUNE, otherWorld, type World } from '../config.ts';
import { FOLK, HERO, HERO_LOOKS, MOB } from '../art/actors.ts';
import { BUILDS, CREATURES, FOLK_CAST, HEROES } from '../art/cast.ts';
import { RIG, beastSheet, figureSheet, type FigureStyle } from '../art/rig.ts';
import type { Sheet } from '../art/sheet.ts';
import { MOODS, SURF, quantize9 } from '../art/surface.ts';
import { ART, addBufferTexture } from '../art/textures.ts';
import { audio } from '../audio/audio.ts';
import { PixelBuffer, rgb } from '../core/PixelBuffer.ts';
import { globalKeys } from '../core/globalKeys.ts';
import { input, type Dir } from '../core/input.ts';
import { DualCanvas } from '../fx/DualCanvas.ts';
import { t, toggleLang } from '../i18n/strings.ts';
import { loadLab } from '../lab/labData.ts';
import { PixelText } from '../ui/PixelText.ts';
import { Level } from '../world/Level.ts';
import { paintEcho } from '../world/painter.ts';
import type { Bilingual, RoomDef } from '../world/roomFormat.ts';
import { SurfacePainter } from '../world/surfacePainter.ts';

type View = 'down' | 'up' | 'side';

/** A sheet and how to find a frame on it: the old 16x16 sheets and the rig's sheets are laid out differently. */
interface Sprites {
  key: string;
  fw: number;
  fh: number;
  /** phase 0 stands, 1-4 walk */
  frame: (view: View, phase: number) => number;
}

/** How figures are drawn. `build: null` is the hand-drawn 16x16 set the game uses today. */
const STYLES: { id: string; name: Bilingual; build: 'mid' | 'tall' | null; ink: FigureStyle }[] = [
  { id: 'nes', name: { pl: '8-bit 16x16 (obecny)', en: '8-bit 16x16 (current)' }, build: null, ink: { outline: 'dark', sat: 0.92, val: 0.96 } },
  { id: 'snes', name: { pl: 'SNES 16x24', en: 'SNES 16x24' }, build: 'mid', ink: { outline: 'tint', sat: 1.05, val: 1 } },
  { id: 'sega', name: { pl: 'Mega Drive 24x32', en: 'Mega Drive 24x32' }, build: 'tall', ink: { outline: 'dark', sat: 0.92, val: 0.96 } },
  { id: 'grim', name: { pl: 'mroczna baśń 24x32', en: 'dark tale 24x32' }, build: 'tall', ink: { outline: 'tint', sat: 0.6, val: 0.82, tint: [0x2a2440, 0.12] } },
];
const DEPTHS: Bilingual[] = [
  { pl: 'pełne kolory', en: 'full colour' },
  { pl: '512 kolorów (Mega Drive)', en: '512 colours (Mega Drive)' },
];

const VIEW_ROW: Record<View, number> = { down: RIG.DOWN, up: RIG.UP, side: RIG.SIDE };
const OLD_ROW: Record<View, number> = { down: HERO.DOWN, up: HERO.UP, side: HERO.SIDE };
const OLD_WALK = [HERO.STAND, HERO.WALK_A, HERO.STAND, HERO.WALK_B, HERO.STAND];
const OLD_FOLK = [FOLK.herbalist, FOLK.elder, FOLK.woman, FOLK.child];
const OLD_MOBS: { name: Bilingual; frame: number }[] = [
  { name: { pl: 'utopiec', en: 'drowned one' }, frame: MOB.UTOPIEC },
  { name: { pl: 'zjawa', en: 'wraith' }, frame: MOB.ZJAWA },
  { name: { pl: 'strzyga', en: 'strzyga' }, frame: MOB.STRZYGA },
  { name: { pl: 'dzik', en: 'boar' }, frame: MOB.DZIK },
  { name: { pl: 'wilk', en: 'wolf' }, frame: MOB.WILK },
  { name: { pl: 'morownik', en: 'blight bloom' }, frame: MOB.MOROWNIK },
  { name: { pl: 'ognik', en: 'wisp' }, frame: MOB.OGNIK },
];

/** Where the exhibits stand, in tiles. */
const HERO_SPOTS: [number, number][] = [[2, 13], [5, 13], [8, 13], [12, 13], [15, 13]];
const FOLK_SPOTS: [number, number][] = [[3, 18], [6, 18], [12, 18], [15, 18]];
const CREATURE_SPOTS: [number, number][] = [
  [22, 13], [26, 13], [34, 13], [38, 13], [42, 13], [45, 13], [52, 13], [56, 13],
  [22, 18], [27, 18], [35, 18], [40, 18], [45, 18],
];
const OLD_SPOTS: [number, number][] = [[22, 10], [25, 10], [28, 10], [31, 10], [34, 10], [37, 10], [40, 10]];

/** Something standing in the meadow: the hero, or an exhibit. */
class Figure {
  x: number;
  y: number;
  facing: Dir = 'down';
  moving = false;
  /** px walked, drives the walk cycle */
  dist = 0;
  set: Sprites;
  readonly sprite: Phaser.GameObjects.Sprite;
  readonly shadow: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, x: number, y: number, set: Sprites) {
    this.x = x;
    this.y = y;
    this.set = set;
    this.shadow = scene.add.image(x, y, 'shadow');
    this.sprite = scene.add.sprite(x, y, set.key, 0);
    this.use(set);
  }

  use(set: Sprites): void {
    this.set = set;
    // figures stand on the last row but one of their cell (an outline goes underneath)
    this.sprite.setTexture(set.key, 0).setOrigin(0.5, (set.fh - 1) / set.fh);
    this.shadow.setScale(set.fw > 16 ? 1.35 : 1);
    this.draw();
  }

  draw(): void {
    const view: View = this.facing === 'down' ? 'down' : this.facing === 'up' ? 'up' : 'side';
    const phase = this.moving ? 1 + (Math.floor(this.dist / 5) % 4) : 0;
    const px = Math.round(this.x);
    const py = Math.round(this.y);
    const depth = DEPTH.entities + (this.y + 4) / 1000;
    this.sprite.setFrame(this.set.frame(view, phase)).setFlipX(this.facing === 'left').setPosition(px, py + 5).setDepth(depth);
    this.shadow.setPosition(px, py + 3).setDepth(depth - 0.0005);
  }

  destroy(): void {
    this.sprite.destroy();
    this.shadow.destroy();
  }
}

interface Exhibit {
  code: string;
  /** the longer title shown when the hero stands next to it */
  title: Bilingual;
  name: Bilingual;
  /** px the label floats above the figure's head (neighbours alternate, so names do not run into each other) */
  lift: number;
  note: Bilingual | null;
  figure: Figure;
  label: PixelText;
  /** true: walks to and fro. false: stands and turns on the spot, to be seen from every side */
  paces: boolean;
  homeX: number;
  t: number;
  /** which set to show: picks the sheet for the current style and colour depth */
  sprites: () => Sprites;
}

export class PlaygroundScene extends Phaser.Scene {
  private level!: Level;
  private room!: RoomDef;
  private painter!: SurfacePainter;
  private view!: DualCanvas;
  private top!: DualCanvas;
  private world: World = 'jawia';
  private hero!: Figure;
  private vx = 0;
  private vy = 0;
  private exhibits: Exhibit[] = [];
  private grid!: Phaser.GameObjects.TileSprite;
  private status: PixelText[] = [];
  private info!: PixelText;
  private infoBox!: Phaser.GameObjects.Rectangle;
  private keys!: PixelText;
  private style = 2;
  private costume = 0;
  private mood = 0;
  private depth = 0;
  private labels = true;
  private animT = 0;
  private animFrame = 0;
  private near: Exhibit | null = null;
  private readonly made = new Set<string>();

  constructor() {
    super('lab');
  }

  create(): void {
    const dungeon = loadLab();
    this.level = new Level(dungeon);
    this.room = dungeon.rooms[0];
    this.world = 'jawia';
    this.exhibits = [];
    this.near = null;
    this.vx = 0;
    this.vy = 0;

    // ?style=sega&hero=lowca&mood=noc&depth=1 opens the playground on a particular combination
    const q = new URLSearchParams(location.search);
    const pick = (list: { id: string }[], id: string | null, fallback: number): number => {
      const i = list.findIndex((e) => e.id === id);
      return i >= 0 ? i : fallback;
    };
    this.style = pick(STYLES, q.get('style'), this.style);
    this.costume = pick(HEROES, q.get('hero'), this.costume);
    this.mood = pick(MOODS, q.get('mood'), this.mood);
    if (q.get('depth') === '1') this.depth = 1;

    this.cameras.main.setBackgroundColor(0x05050b);
    this.paint();

    const grid = new PixelBuffer(TILE, TILE);
    for (let i = 0; i < TILE; i++) {
      grid.set(i, 0, rgb(0xffffff, 70));
      grid.set(0, i, rgb(0xffffff, 70));
    }
    addBufferTexture(this, 'lab:grid', grid);
    this.grid = this.add.tileSprite(0, 0, this.painter.w, this.painter.h, 'lab:grid').setOrigin(0, 0).setDepth(DEPTH.floorDecor).setVisible(false);

    this.hero = new Figure(this, 10 * TILE + 8, 11 * TILE + 8, this.heroSprites(this.costume));
    this.buildExhibits();
    this.light();

    // ---- what is selected, and how to change it
    this.add.rectangle(2, 2, 196, 44, 0x05050b, 0.72).setOrigin(0, 0).setScrollFactor(0).setDepth(1000);
    this.status = [0, 1, 2].map((i) => {
      const line = new PixelText(this, 6, 4 + i * 13, { width: 190, height: 13, color: 0xf2ede2 });
      line.image.setScrollFactor(0).setDepth(1001);
      return line;
    });
    this.keys = new PixelText(this, 0, GAME_H - 15, { width: GAME_W, height: 13, align: 'center', color: 0xbdb7c6 });
    this.keys.image.setScrollFactor(0).setDepth(1001);
    this.infoBox = this.add.rectangle(2, GAME_H - 46, GAME_W - 4, 30, 0x05050b, 0.8).setOrigin(0, 0).setScrollFactor(0).setDepth(1000).setVisible(false);
    this.info = new PixelText(this, 6, GAME_H - 45, { width: GAME_W - 12, height: 28, color: 0xffe9a0 });
    this.info.image.setScrollFactor(0).setDepth(1001).setVisible(false);
    this.refresh();

    const kb = this.input.keyboard;
    const on = (key: string, fn: () => void): void => {
      kb?.on(`keydown-${key}`, fn);
    };
    ['ONE', 'TWO', 'THREE', 'FOUR'].forEach((k, i) => on(k, () => this.setStyle(i)));
    on('Q', () => this.setCostume(this.costume - 1));
    on('E', () => this.setCostume(this.costume + 1));
    on('N', () => {
      this.mood = (this.mood + 1) % MOODS.length;
      this.paint();
      this.light();
      this.refresh();
    });
    on('C', () => {
      this.depth = 1 - this.depth;
      this.paint();
      this.restyle();
      this.refresh();
    });
    on('G', () => this.grid.setVisible(!this.grid.visible));
    on('T', () => {
      this.labels = !this.labels;
      for (const e of this.exhibits) e.label.image.setVisible(this.labels);
    });

    audio.unlock();
    audio.startAmbience();
    audio.setPlace('village');
    audio.setWorld(this.world);
    input.flush();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      kb?.removeAllListeners();
      this.view.destroy();
      this.top.destroy();
      for (const e of this.exhibits) e.label.destroy();
      for (const p of [...this.status, this.keys, this.info]) p.destroy();
    });
    if (import.meta.env.DEV) (window as unknown as { __lab: PlaygroundScene }).__lab = this;
  }

  // ------------------------------------------------------------------ pictures

  /** (Re)paints the meadow in the current mood and colour depth. */
  private paint(): void {
    this.view?.destroy();
    this.top?.destroy();
    const mood = MOODS[this.mood];
    const w = this.room.cols * TILE;
    this.painter = new SurfacePainter(this.room, this.level.dungeon, paintEcho(this.room, ART.tilesets), {
      key: `lab:${mood.id}`,
      palettes: { jawia: mood.palette, nawia: SURF.nawia },
      // the blight comes in from the right-hand end of the meadow
      blight: (px) => Math.max(0, Math.min(1, (px / w - 0.68) / 0.22)),
    });
    if (this.depth) this.painter.eachBuffer(quantize9);
    this.view = new DualCanvas(this, this.painter.buffers, this.world);
    this.view.image.setDepth(DEPTH.room);
    this.top = new DualCanvas(this, this.painter.overhead, this.world, true);
    this.top.image.setDepth(DEPTH.overhead);
  }

  /** Registers a generated sheet as a texture, once per style and colour depth. */
  private sheet(id: string, make: () => Sheet): Sprites {
    const key = `lab:${id}:${STYLES[this.style].id}:${this.depth}`;
    let fw = 0;
    let fh = 0;
    if (!this.made.has(key) || !this.textures.exists(key)) {
      const s = make();
      if (this.depth) quantize9(s.buf);
      addBufferTexture(this, key, s.buf, s.fw, s.fh);
      this.made.add(key);
    }
    const tex = this.textures.get(key).get(0);
    fw = tex.width;
    fh = tex.height;
    const rows = Math.round(this.textures.get(key).getSourceImage().height / fh);
    return { key, fw, fh, frame: (view, phase) => (rows > 1 ? VIEW_ROW[view] : 0) * RIG.cols + phase };
  }

  private heroSprites(i: number): Sprites {
    const style = STYLES[this.style];
    if (!style.build) {
      const look = HERO_LOOKS[i % HERO_LOOKS.length];
      return { key: look.key, fw: 16, fh: 16, frame: (view, phase) => OLD_ROW[view] * HERO.cols + OLD_WALK[phase] };
    }
    const c = HEROES[i];
    return this.sheet(`hero:${c.id}`, () => figureSheet('', c.make(BUILDS[style.build!]), style.ink));
  }

  private folkSprites(i: number): Sprites {
    const style = STYLES[this.style];
    if (!style.build) return { key: 'folk', fw: 16, fh: 16, frame: (_v, phase) => OLD_FOLK[i] + (phase % 2) };
    const c = FOLK_CAST[i];
    return this.sheet(`folk:${c.id}`, () => figureSheet('', c.make(BUILDS[style.build!]), style.ink));
  }

  private creatureSprites(i: number): Sprites {
    const c = CREATURES[i];
    const ink = STYLES[this.style].ink;
    return this.sheet(`creature:${c.id}`, () => (c.figure ? figureSheet('', c.figure, ink) : beastSheet('', c.beast!, ink)));
  }

  // ------------------------------------------------------------------ exhibits

  private buildExhibits(): void {
    const add = (code: string, title: Bilingual, name: Bilingual, note: Bilingual | null, spot: [number, number], paces: boolean, sprites: () => Sprites): void => {
      const x = spot[0] * TILE + 8;
      const y = spot[1] * TILE + 8;
      const figure = new Figure(this, x, y, sprites());
      const lift = 9 + (this.exhibits.length % 2) * 11;
      const label = new PixelText(this, x - 70, y - figure.set.fh - lift, { width: 140, height: 13, align: 'center', color: 0xfff6d8 });
      label.image.setDepth(DEPTH.fxWorld).setVisible(this.labels);
      this.exhibits.push({ code, title, name, note, lift, figure, label, paces, homeX: x, t: Math.random() * 3, sprites });
    };
    HEROES.forEach((c, i) => add(`H${i + 1}`, c.name, c.name, null, HERO_SPOTS[i], false, () => this.heroSprites(i)));
    FOLK_CAST.forEach((c, i) => add(`N${i + 1}`, c.name, c.name, null, FOLK_SPOTS[i], false, () => this.folkSprites(i)));
    CREATURES.forEach((c, i) =>
      add(`P${i + 1}`, c.kind.pl === c.name.pl ? c.name : { pl: `${c.kind.pl}: ${c.name.pl}`, en: `${c.kind.en}: ${c.name.en}` }, c.name, c.note, CREATURE_SPOTS[i], true, () => this.creatureSprites(i)),
    );
    OLD_MOBS.forEach((m, i) =>
      add(`S${i + 1}`, m.name, m.name, { pl: 'obecny sprite 16x16, dla porównania', en: 'the current 16x16 sprite, for comparison' }, OLD_SPOTS[i], false, () => ({
        key: 'mobs', fw: 16, fh: 16, frame: (_v, phase) => m.frame + (phase % 2),
      })),
    );
    this.relabel();
  }

  /** Everyone standing in the meadow is lit by its hour (in Jawia; Nawia has no hours). */
  private light(): void {
    const tint = this.world === 'jawia' ? MOODS[this.mood].tint : 0xc8d4ff;
    for (const f of [this.hero, ...this.exhibits.map((e) => e.figure)]) f.sprite.setTint(tint);
  }

  /** New style or colour depth: every figure gets its sheet for it. */
  private restyle(): void {
    this.hero.use(this.heroSprites(this.costume));
    for (const e of this.exhibits) {
      e.figure.use(e.sprites());
      e.label.image.setY(Math.round(e.figure.y) - e.figure.set.fh - e.lift);
    }
  }

  private relabel(): void {
    for (const e of this.exhibits) e.label.setText(`${e.code} ${t(e.name)}`);
  }

  private setStyle(i: number): void {
    this.style = i;
    this.restyle();
    this.refresh();
  }

  private setCostume(i: number): void {
    this.costume = (i + HEROES.length) % HEROES.length;
    this.hero.use(this.heroSprites(this.costume));
    this.refresh();
  }

  private refresh(): void {
    const old = !STYLES[this.style].build;
    const hero = old ? HERO_LOOKS[this.costume % HERO_LOOKS.length].name : HEROES[this.costume].name;
    this.status[0].setText(`[1-4] ${t(STYLES[this.style].name)}`);
    this.status[1].setText(`[Q/E] ${t(hero)}`);
    this.status[2].setText(`[N] ${t(MOODS[this.mood].name)}   [C] ${t(DEPTHS[this.depth])}`);
    this.keys.setText(t({ pl: '[SHIFT] świat  [G] siatka  [T] podpisy  [ESC] menu', en: '[SHIFT] world  [G] grid  [T] labels  [ESC] menu' }));
  }

  // ------------------------------------------------------------------ loop

  update(time: number, delta: number): void {
    const dt = Math.min(delta, 50) / 1000;
    input.update(time / 1000);
    globalKeys(this);
    if (input.consume('lang')) {
      toggleLang();
      this.relabel();
      this.refresh();
      this.near = null;
    }
    if (input.consume('pause')) {
      this.scene.start('title');
      return;
    }
    if (input.consume('shift', TUNE.shift.buffer)) {
      this.world = otherWorld(this.world);
      this.view.reveal(this.world, this.hero.x, this.hero.y - 6);
      this.top.reveal(this.world, this.hero.x, this.hero.y - 6);
      audio.setWorld(this.world);
      audio.sfx(this.world === 'nawia' ? 'shiftNawia' : 'shiftJawia');
      this.light();
    }

    // ---- the hero just walks
    const P = TUNE.player;
    const step = (v: number, target: number, rate: number): number => (v < target ? Math.min(target, v + rate) : Math.max(target, v - rate));
    this.vx = step(this.vx, input.moveX * P.speed, (input.moveX !== 0 ? P.accel : P.decel) * dt);
    this.vy = step(this.vy, input.moveY * P.speed, (input.moveY !== 0 ? P.accel : P.decel) * dt);
    const box = { x: this.hero.x, y: this.hero.y, hw: P.hitW / 2, hh: P.hitH / 2 };
    this.level.move(this.world, box, this.vx * dt, this.vy * dt);
    this.hero.dist += Math.hypot(box.x - this.hero.x, box.y - this.hero.y);
    this.hero.x = box.x;
    this.hero.y = box.y;
    this.hero.moving = input.moveX !== 0 || input.moveY !== 0;
    if (input.wantDir) this.hero.facing = input.wantDir;
    if (!this.hero.moving) this.hero.dist = 0;
    this.hero.draw();

    // ---- exhibits: monsters pace, people turn on the spot
    let near: Exhibit | null = null;
    let best = 30;
    for (const e of this.exhibits) {
      e.t += dt;
      const f = e.figure;
      if (e.paces) {
        // 0-1.6 s walk right, a breath facing us, 1.6 s back, another breath
        const k = e.t % 5.2;
        const walking = k < 1.6 || (k >= 2.6 && k < 4.2);
        f.moving = walking;
        if (k < 1.6) { f.facing = 'right'; f.x = e.homeX - 14 + (k / 1.6) * 28; }
        else if (k < 2.6) { f.facing = 'down'; f.x = e.homeX + 14; }
        else if (k < 4.2) { f.facing = 'left'; f.x = e.homeX + 14 - ((k - 2.6) / 1.6) * 28; }
        else { f.facing = 'down'; f.x = e.homeX - 14; }
        f.dist = walking ? e.t * 17.5 : 0;
      } else {
        f.facing = (['down', 'right', 'up', 'left'] as Dir[])[Math.floor(e.t / 1.5) % 4];
      }
      f.draw();
      e.label.image.setX(Math.round(f.x) - 70);
      const d = Math.hypot(f.x - this.hero.x, f.y - this.hero.y);
      if (d < best) {
        best = d;
        near = e;
      }
    }
    if (near !== this.near) {
      this.near = near;
      this.infoBox.setVisible(near !== null);
      this.info.image.setVisible(near !== null);
      this.keys.image.setVisible(near === null);
      if (near) this.info.setText(`${near.code}  ${t(near.title)}  (${near.figure.set.fw}x${near.figure.set.fh})${near.note ? `\n${t(near.note)}` : ''}`);
    }

    // ---- water and stars
    this.animT += dt;
    if (this.animT >= 0.22) {
      this.animT -= 0.22;
      this.animFrame = (this.animFrame + 1) & 3;
      this.painter.animate(this.animFrame);
      this.view.touch();
    }
    this.view.update(dt);
    this.top.update(dt);

    const cam = this.cameras.main;
    cam.setScroll(
      Math.round(Phaser.Math.Clamp(this.hero.x - GAME_W / 2, 0, this.painter.w - GAME_W)),
      Math.round(Phaser.Math.Clamp(this.hero.y - GAME_H / 2, 0, this.painter.h - GAME_H)),
    );
  }
}
