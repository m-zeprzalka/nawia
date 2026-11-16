// The playground: a place to compare looks, not to play.
//
// The hero walks around a meadow that has a bit of everything in it. Along the roads stand exhibits:
// the heroes still in the running, the villagers, and the monsters grouped by how tall they stand (one tile,
// one and a half, two). Every exhibit has a code (C1, S2, P7...) so a choice can be named in one word;
// standing next to one shows what it is, its size and how many colours it uses.
//
// Which heroes stand here, in what order and under what headings, is written in src/lab/lineup.txt.
// What is taken off the board goes to that file's archive: it is never deleted, and comes back with one line.
// What is chosen gets built into the game; see docs/PLAYGROUND.md.
//
//   Q / E  walk as the previous / next hero     1 / 2  villagers' height     O  line round the dolls    N  scenery mood
//   SHIFT  world                                G      tile grid             T  labels                  ESC  back to the title

import Phaser from 'phaser';
import { DEPTH, GAME_H, GAME_W, TILE, TUNE, otherWorld, type World } from '../config.ts';
import { HERO as GAME_HERO, HERO_LOOKS as GAME_LOOKS } from '../art/actors.ts';
import { BUILDS as OLD_BUILDS, HEROES as OLD_HEROES, OLD_BEASTS } from '../art/archive.ts';
import { CREATURES } from '../art/cast.ts';
import { FOLK_LOOKS, HERO_LOOKS, dollSheet, type Ink, type Size } from '../art/dolls.ts';
import { conceptSheet } from '../art/concepts/concept.ts';
import { CONCEPTS } from '../art/concepts/index.ts';
import { HERO_HANDS, HERO_SCHOOLS, HERO_STYLES, HERO_TYPES, styleSheet } from '../art/heroStyles.ts';
import { RIG, figureSheet, type FigureStyle } from '../art/rig.ts';
import { MOODS, SURF } from '../art/surface.ts';
import { ART, addBufferTexture } from '../art/textures.ts';
import { audio } from '../audio/audio.ts';
import { PixelBuffer, rgb } from '../core/PixelBuffer.ts';
import { globalKeys } from '../core/globalKeys.ts';
import { input, type Dir } from '../core/input.ts';
import { DualCanvas } from '../fx/DualCanvas.ts';
import { t, toggleLang } from '../i18n/strings.ts';
import { loadLab, loadLineup } from '../lab/labData.ts';
import { PixelText } from '../ui/PixelText.ts';
import { Level } from '../world/Level.ts';
import { paintEcho } from '../world/painter.ts';
import type { Bilingual, RoomDef } from '../world/roomFormat.ts';
import { SurfacePainter } from '../world/surfacePainter.ts';

type View = 'down' | 'up' | 'side';

/** A sheet and how to find a frame on it. */
interface Sprites {
  key: string;
  fw: number;
  fh: number;
  /** how many colours the sheet uses (a 16-bit sprite had fifteen to spend) */
  colors: number;
  /** phase 0 stands, 1-4 walk */
  frame: (view: View, phase: number) => number;
}

/** The two heights the dolls come in. */
const SIZES: { id: Size; name: Bilingual; short: string }[] = [
  { id: 'small', name: { pl: 'lalki 16x16: pięć pomysłów na postać', en: 'dolls 16x16: five ideas for the character' }, short: '16x16' },
  { id: 'tall', name: { pl: 'lalki 16x24: te same pomysły, półtora kafla', en: 'dolls 16x24: the same ideas, a tile and a half' }, short: '16x24' },
];

/**
 * Something lineup.txt can put on the board: a hero (who can also be walked, with Q / E) or one of the first
 * animals, kept in the archive.
 */
interface Entry {
  code: string;
  name: Bilingual;
  note: Bilingual | null;
  walk: boolean;
  sprites: () => Sprites;
}

/** Monsters are inked one way: a single dark line, the way a 16-bit sprite spends one colour on its outline. */
const INK: FigureStyle = { outline: 'dark', sat: 1, val: 1 };

/** The ways of drawing the line round people, to compare (see `Ink` in dolls.ts). */
const INKS: { id: Ink; name: Bilingual }[] = [
  { id: 'tinted', name: { pl: 'kontur barwny', en: 'tinted line' } },
  { id: 'dark', name: { pl: 'kontur ciemny', en: 'dark line' } },
  { id: 'none', name: { pl: 'bez konturu', en: 'no line' } },
];

const VIEW_ROW: Record<View, number> = { down: RIG.DOWN, up: RIG.UP, side: RIG.SIDE };

/** Where the exhibits stand, in tiles. Heroes fill rows in the order of lineup.txt, seven to a row. */
const HERO_ROWS = [13, 18, 23, 28];
const HERO_COLS = [2, 5, 8, 11, 14, 17, 20];

const FOLK_SPOTS: [number, number][] = [[3, 8], [7, 8], [12, 8], [16, 8]];
const CLASS_SPOTS: Record<string, [number, number][]> = {
  '1': [[22, 13], [25, 13], [28, 13], [33, 13], [37, 13], [41, 13]],
  '1.5': [[22, 18], [25, 18], [28, 18], [33, 18], [36, 18], [39, 18], [42, 18], [45, 18]],
  '2': [[51, 13], [55, 13]],
};
const CLASS_NAME: Record<string, Bilingual> = {
  '1': { pl: 'jeden kafel', en: 'one tile' },
  '1.5': { pl: 'półtora kafla', en: 'a tile and a half' },
  '2': { pl: 'dwa kafle', en: 'two tiles' },
};

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
    this.shadow.setScale(set.fw > 16 ? 1.4 : 1);
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
  note: Bilingual | null;
  /** px the label floats above the figure's head (neighbours alternate, so names do not run into each other) */
  lift: number;
  figure: Figure;
  label: PixelText;
  /**
   * 'pace': walks to and fro. 'turn': stands and turns on the spot. 'show': turns on the spot, standing and
   * then walking in place in each direction. 'stay': stands and keeps moving in place (a flame).
   */
  does: 'pace' | 'turn' | 'show' | 'stay';
  homeX: number;
  t: number;
  /** which sheet to show right now */
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
  private titles: { text: PixelText; name: Bilingual }[] = [];
  private grid!: Phaser.GameObjects.TileSprite;
  private status: PixelText[] = [];
  private info!: PixelText;
  private infoBox!: Phaser.GameObjects.Rectangle;
  private keys!: PixelText;
  private size: Size = 'small';
  /** every hero and archived animal there is, by code */
  private entries = new Map<string, Entry>();
  /** the heroes on the board, in the order Q / E walks through them */
  private walkers: Entry[] = [];
  private picked = 0;
  private mood = 0;
  /** dolls start without a line: the art lead liked A1 best that way */
  private ink = 2;
  private labels = true;
  private animT = 0;
  private animFrame = 0;
  private near: Exhibit | null = null;
  private readonly made = new Map<string, Sprites>();

  constructor() {
    super('lab');
  }

  create(): void {
    const dungeon = loadLab();
    this.level = new Level(dungeon);
    this.room = dungeon.rooms[0];
    this.world = 'jawia';
    this.exhibits = [];
    this.titles = [];
    this.near = null;
    this.vx = 0;
    this.vy = 0;

    // ?hero=C2&size=tall&mood=noc&ink=dark opens the playground on a particular combination
    // (?hero= also takes a code from the archive: it is walked, but not put back on the board)
    const q = new URLSearchParams(location.search);
    const pick = (list: { id: string }[], id: string | null, fallback: number): number => {
      const i = list.findIndex((e) => e.id === id);
      return i >= 0 ? i : fallback;
    };
    if (q.get('size') === 'tall') this.size = 'tall';
    this.mood = pick(MOODS, q.get('mood'), this.mood);
    this.ink = pick(INKS, q.get('ink'), this.ink);
    this.entries = this.catalogue();
    const lineup = loadLineup();
    this.walkers = lineup.board.flatMap((r) => r.codes).map((c) => this.entries.get(c)).filter((e): e is Entry => !!e && e.walk);
    const wanted = (q.get('hero') ?? '').toLowerCase();
    const extra = [...this.entries.values()].find((e) => e.walk && e.code.toLowerCase() === wanted);
    if (extra && !this.walkers.includes(extra)) this.walkers.unshift(extra);
    this.picked = Math.max(0, this.walkers.findIndex((e) => e.code.toLowerCase() === wanted));

    this.cameras.main.setBackgroundColor(0x05050b);
    this.paint();

    const grid = new PixelBuffer(TILE, TILE);
    for (let i = 0; i < TILE; i++) {
      grid.set(i, 0, rgb(0xffffff, 70));
      grid.set(0, i, rgb(0xffffff, 70));
    }
    addBufferTexture(this, 'lab:grid', grid);
    this.grid = this.add.tileSprite(0, 0, this.painter.w, this.painter.h, 'lab:grid').setOrigin(0, 0).setDepth(DEPTH.floorDecor).setVisible(false);

    this.hero = new Figure(this, 10 * TILE + 8, 11 * TILE + 8, this.walkers[this.picked].sprites());
    this.buildExhibits(lineup);
    this.light();

    // ---- what is selected, and how to change it
    this.add.rectangle(2, 2, GAME_W - 4, 31, 0x05050b, 0.72).setOrigin(0, 0).setScrollFactor(0).setDepth(1000);
    this.status = [0, 1].map((i) => {
      const line = new PixelText(this, 6, 4 + i * 13, { width: GAME_W - 12, height: 13, color: 0xf2ede2 });
      line.image.setScrollFactor(0).setDepth(1001);
      return line;
    });
    this.keys = new PixelText(this, 0, GAME_H - 15, { width: GAME_W, height: 13, align: 'center', color: 0xbdb7c6 });
    this.keys.image.setScrollFactor(0).setDepth(1001);
    // three lines: the code and name, then a note that may run to two
    this.infoBox = this.add.rectangle(2, GAME_H - 46, GAME_W - 4, 43, 0x05050b, 0.8).setOrigin(0, 0).setScrollFactor(0).setDepth(1000).setVisible(false);
    this.info = new PixelText(this, 6, GAME_H - 45, { width: GAME_W - 12, height: 41, color: 0xffe9a0 });
    this.info.image.setScrollFactor(0).setDepth(1001).setVisible(false);
    this.refresh();

    const kb = this.input.keyboard;
    const on = (key: string, fn: () => void): void => {
      kb?.on(`keydown-${key}`, fn);
    };
    on('ONE', () => this.setSize('small'));
    on('TWO', () => this.setSize('tall'));
    on('Q', () => this.pick(this.picked - 1));
    on('E', () => this.pick(this.picked + 1));
    on('N', () => {
      this.mood = (this.mood + 1) % MOODS.length;
      this.paint();
      this.light();
      this.refresh();
    });
    on('O', () => {
      this.ink = (this.ink + 1) % INKS.length;
      this.restyle();
      this.refresh();
    });
    on('G', () => this.grid.setVisible(!this.grid.visible));
    on('T', () => {
      this.labels = !this.labels;
      for (const e of this.exhibits) e.label.image.setVisible(this.labels);
      for (const g of this.titles) g.text.image.setVisible(this.labels);
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
      for (const p of [...this.status, this.keys, this.info, ...this.titles.map((g) => g.text)]) p.destroy();
    });
    if (import.meta.env.DEV) (window as unknown as { __lab: PlaygroundScene }).__lab = this;
  }

  // ------------------------------------------------------------------ pictures

  /** (Re)paints the meadow in the current mood. */
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
    this.view = new DualCanvas(this, this.painter.buffers, this.world);
    this.view.image.setDepth(DEPTH.room);
    this.top = new DualCanvas(this, this.painter.overhead, this.world, true);
    this.top.image.setDepth(DEPTH.overhead);
  }

  /** Registers a generated sheet as a texture (once) and says how to read it. */
  private sheet(id: string, make: () => { buf: PixelBuffer; fw: number; fh: number }): Sprites {
    const key = `lab:${id}`;
    const made = this.made.get(key);
    if (made && this.textures.exists(key)) return made;
    const s = make();
    addBufferTexture(this, key, s.buf, s.fw, s.fh);
    const seen = new Set<number>();
    for (const c of s.buf.u32) if (c >>> 24) seen.add(c & 0xffffff);
    const rows = Math.round(s.buf.h / s.fh);
    const sprites: Sprites = { key, fw: s.fw, fh: s.fh, colors: seen.size, frame: (view, phase) => (rows > 1 ? VIEW_ROW[view] : 0) * RIG.cols + phase };
    this.made.set(key, sprites);
    return sprites;
  }

  private heroSprites(size: Size, i: number): Sprites {
    const look = HERO_LOOKS[i];
    const ink = INKS[this.ink].id;
    return this.sheet(`hero:${look.id}:${size}:${ink}`, () => dollSheet(look, size, ink));
  }

  /** A sheet of the game itself (it is already a texture): its rows are the views, its first three columns stand and walk. */
  private gameSprites(key: string): Sprites {
    const col = [GAME_HERO.STAND, GAME_HERO.WALK_A, GAME_HERO.STAND, GAME_HERO.WALK_B, GAME_HERO.STAND];
    const row: Record<View, number> = { down: GAME_HERO.DOWN, up: GAME_HERO.UP, side: GAME_HERO.SIDE };
    return { key, fw: GAME_HERO.fw, fh: GAME_HERO.fh, colors: 0, frame: (view, phase) => row[view] * GAME_HERO.cols + col[phase] };
  }

  /** Everything lineup.txt can name, by code: every hero drawn so far, and the first animals. */
  private catalogue(): Map<string, Entry> {
    const out = new Map<string, Entry>();
    const put = (code: string, name: Bilingual, note: Bilingual | null, sprites: () => Sprites, walk = true): void => {
      if (out.has(code)) console.warn(`playground: two exhibits share the code ${code}`);
      out.set(code, { code, name, note, walk, sprites });
    };
    for (const c of CONCEPTS) put(c.code, c.name, c.note, () => this.sheet(`concept:${c.id}`, () => conceptSheet(c)));
    GAME_LOOKS.forEach((look, i) =>
      put(
        `G${i + 1}`,
        look.name,
        i === 0
          ? { pl: 'bohater, który jest dziś w grze: punkt odniesienia', en: 'the hero the game has today: what the others are measured against' }
          : { pl: 'wygląd z gry (klawisz H): to samo ciało, inna głowa i barwy', en: 'a look from the game (the H key): the same body, another head and colours' },
        () => this.gameSprites(look.key),
      ),
    );
    const styles = (letter: string, list: typeof HERO_STYLES): void =>
      list.forEach((st, i) => put(`${letter}${i + 1}`, st.name, st.note, () => this.sheet(`style:${st.id}`, () => styleSheet(st))));
    styles('R', HERO_SCHOOLS);
    styles('W', HERO_TYPES);
    styles('V', HERO_HANDS);
    styles('S', HERO_STYLES);
    HERO_LOOKS.forEach((c, i) => put(`A${i + 1}`, c.name, c.note, () => this.heroSprites('small', i)));
    // the dolls the art lead singled out, with the smaller head asked for
    for (const i of [0, 2, 4])
      put(`A${i + 1}b`, HERO_LOOKS[i].name, { pl: `A${i + 1} z mniejszą, mniej okrągłą głową (7 wierszy, 9 pikseli)`, en: `A${i + 1} with a smaller, less round head (7 rows, 9 pixels)` }, () => this.heroSprites('slim', i));
    HERO_LOOKS.forEach((c, i) => put(`B${i + 1}`, c.name, c.note, () => this.heroSprites('tall', i)));
    (['small', 'tall'] as const).forEach((size, k) =>
      OLD_HEROES.forEach((c, i) =>
        put(
          `X${k * OLD_HEROES.length + i + 1}`,
          c.name,
          { pl: `postać ze szkieletu, ${size === 'small' ? '16x16' : '16x24'}: głowa szersza od tułowia („żarówka”)`, en: `a rig figure, ${size === 'small' ? '16x16' : '16x24'}: the head wider than the trunk` },
          () => this.sheet(`old:${c.id}:${size}`, () => figureSheet('', c.make(OLD_BUILDS[size]), INK)),
        ),
      ),
    );
    OLD_BEASTS.forEach((c, i) =>
      put(
        `Z${i + 1}`,
        c.name,
        null,
        () =>
          this.sheet(`old:${c.id}`, () => {
            const buf = new PixelBuffer(c.frames[0].w * c.frames.length, c.frames[0].h);
            c.frames.forEach((f, k) => buf.copy(f, k * f.w, 0));
            return { buf, fw: c.frames[0].w, fh: c.frames[0].h };
          }),
        false,
      ),
    );
    return out;
  }

  private folkSprites(i: number): Sprites {
    const look = FOLK_LOOKS[i];
    const ink = INKS[this.ink].id;
    return this.sheet(`folk:${look.id}:${this.size}:${ink}`, () => dollSheet(look, this.size, ink));
  }

  private creatureSprites(i: number): Sprites {
    const c = CREATURES[i];
    if (c.mob) {
      const [first, count] = c.mob;
      return { key: 'mobs', fw: 16, fh: 16, colors: 0, frame: (_v, phase) => first + (phase % count) };
    }
    if (c.figure) return this.sheet(`creature:${c.id}`, () => figureSheet('', c.figure!, INK));
    // drawn by hand: five frames in a row, outline and all
    return this.sheet(`creature:${c.id}`, () => {
      const frames = c.frames!;
      const fw = frames[0].w;
      const fh = frames[0].h;
      const buf = new PixelBuffer(fw * frames.length, fh);
      frames.forEach((f, k) => buf.copy(f, k * fw, 0));
      return { buf, fw, fh };
    });
  }

  // ------------------------------------------------------------------ exhibits

  private buildExhibits(lineup: ReturnType<typeof loadLineup>): void {
    const add = (code: string, title: Bilingual, name: Bilingual, note: Bilingual | null, spot: [number, number], does: Exhibit['does'], sprites: () => Sprites): void => {
      const x = spot[0] * TILE + 8;
      const y = spot[1] * TILE + 8;
      const figure = new Figure(this, x, y, sprites());
      const lift = 9 + (this.exhibits.length % 2) * 11;
      const label = new PixelText(this, x - 70, y - figure.set.fh - lift, { width: 140, height: 13, align: 'center', color: 0xfff6d8 });
      label.image.setDepth(DEPTH.fxWorld).setVisible(this.labels);
      this.exhibits.push({ code, title, name, note, lift, figure, label, does, homeX: x, t: Math.random() * 3, sprites });
    };
    // the board, as lineup.txt has it: every hero walks on the spot, so each shows its stride
    const heading = (tx: number, ty: number, name: Bilingual): void => {
      const text = new PixelText(this, tx * TILE - 8, ty * TILE - 52, { width: 300, height: 13, color: 0x9af4ff });
      text.image.setDepth(DEPTH.fxWorld).setVisible(this.labels);
      this.titles.push({ text, name });
    };
    const named = new Set([...lineup.board.flatMap((r) => r.codes), ...lineup.archive]);
    for (const code of named) if (!this.entries.has(code)) console.warn(`playground: lineup.txt names ${code}, which does not exist`);
    for (const code of this.entries.keys()) if (!named.has(code)) console.warn(`playground: ${code} is in neither part of lineup.txt (not shown)`);
    let row = 0;
    for (const group of lineup.board) {
      const list = group.codes.map((c) => this.entries.get(c)).filter((e): e is Entry => !!e);
      for (let i = 0; i < list.length; i += HERO_COLS.length) {
        if (row >= HERO_ROWS.length) {
          console.warn('playground: the board is full; the rest of lineup.txt is not shown');
          break;
        }
        const ty = HERO_ROWS[row];
        if (i === 0 && group.heading) heading(HERO_COLS[0], ty, group.heading);
        list.slice(i, i + HERO_COLS.length).forEach((e, k) => add(e.code, e.name, e.name, e.note, [HERO_COLS[k], ty], e.walk ? 'show' : 'pace', e.sprites));
        row++;
      }
    }
    FOLK_LOOKS.forEach((c, i) => add(`N${i + 1}`, c.name, c.name, c.note, FOLK_SPOTS[i], 'turn', () => this.folkSprites(i)));

    const used: Record<string, number> = { '1': 0, '1.5': 0, '2': 0 };
    CREATURES.forEach((c, i) => {
      const cls = String(c.tiles);
      const spot = CLASS_SPOTS[cls][used[cls]++];
      const title = c.kind.pl.toLowerCase() === c.name.pl.toLowerCase() ? c.kind : { pl: `${c.kind.pl}: ${c.name.pl}`, en: `${c.kind.en}: ${c.name.en}` };
      add(`P${i + 1}`, title, c.name, c.note, spot, c.mob ? 'stay' : 'pace', () => this.creatureSprites(i));
    });
    // a heading over each size class
    for (const cls of Object.keys(CLASS_SPOTS)) {
      const [tx, ty] = CLASS_SPOTS[cls][0];
      const text = new PixelText(this, tx * TILE - 8, ty * TILE - 52, { width: 160, height: 13, color: 0x9af4ff });
      text.image.setDepth(DEPTH.fxWorld).setVisible(this.labels);
      this.titles.push({ text, name: CLASS_NAME[cls] });
    }
    this.relabel();
  }

  /** Everyone standing in the meadow is lit by its hour (in Jawia; Nawia has no hours). */
  private light(): void {
    const tint = this.world === 'jawia' ? MOODS[this.mood].tint : 0xc8d4ff;
    for (const f of [this.hero, ...this.exhibits.map((e) => e.figure)]) f.sprite.setTint(tint);
  }

  /** The villagers' height or the line changed: everybody drawn as a doll gets a new sheet. */
  private restyle(): void {
    this.hero.use(this.walkers[this.picked].sprites());
    for (const e of this.exhibits) {
      e.figure.use(e.sprites());
      e.label.image.setY(Math.round(e.figure.y) - e.figure.set.fh - e.lift);
    }
    this.light();
  }

  private relabel(): void {
    for (const e of this.exhibits) e.label.setText(`${e.code} ${t(e.name)}`);
    for (const g of this.titles) g.text.setText(t(g.name));
  }

  private setSize(size: Size): void {
    this.size = size;
    this.restyle();
    this.refresh();
  }

  /** Walk as another hero. */
  private pick(i: number): void {
    this.picked = (i + this.walkers.length) % this.walkers.length;
    this.hero.use(this.walkers[this.picked].sprites());
    this.light();
    this.refresh();
  }

  private refresh(): void {
    const c = this.walkers[this.picked];
    const s = this.hero.set;
    this.status[0].setText(`[Q/E] ${c.code} ${t(c.name)} (${s.fw}x${s.fh})   [N] ${t(MOODS[this.mood].name)}`);
    this.status[1].setText(t({ pl: `[1/2] mieszkańcy ${SIZES[this.size === 'small' ? 0 : 1].short}   [O] lalki: ${INKS[this.ink].name.pl}`, en: `[1/2] villagers ${SIZES[this.size === 'small' ? 0 : 1].short}   [O] dolls: ${INKS[this.ink].name.en}` }));
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
      if (e.does === 'pace') {
        // 1.6 s walking right, a breath facing us, 1.6 s back, another breath
        const k = e.t % 5.2;
        const walking = k < 1.6 || (k >= 2.6 && k < 4.2);
        f.moving = walking;
        if (k < 1.6) { f.facing = 'right'; f.x = e.homeX - 14 + (k / 1.6) * 28; }
        else if (k < 2.6) { f.facing = 'down'; f.x = e.homeX + 14; }
        else if (k < 4.2) { f.facing = 'left'; f.x = e.homeX + 14 - ((k - 2.6) / 1.6) * 28; }
        else { f.facing = 'down'; f.x = e.homeX - 14; }
        // things drawn only in profile keep facing the way they last walked
        if (!walking && f.set.frame('down', 0) === f.set.frame('side', 0)) f.facing = k < 2.6 ? 'right' : 'left';
        f.dist = walking ? e.t * 17.5 : 0;
      } else if (e.does === 'turn') {
        f.facing = (['down', 'right', 'up', 'left'] as Dir[])[Math.floor(e.t / 1.5) % 4];
      } else if (e.does === 'show') {
        // each direction for 2.4 s: a moment standing, then the walk
        const k = e.t % 9.6;
        f.facing = (['down', 'right', 'up', 'left'] as Dir[])[Math.floor(k / 2.4)];
        f.moving = k % 2.4 > 0.8;
        f.dist = f.moving ? e.t * 26 : 0;
      } else {
        f.moving = true;
        f.dist = e.t * 30;
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
      if (near) {
        const s = near.figure.set;
        const colors = s.colors ? t({ pl: `, ${s.colors} kolorów`, en: `, ${s.colors} colours` }) : '';
        this.info.setText(`${near.code}  ${t(near.title)}  (${s.fw}x${s.fh}${colors})${near.note ? `\n${t(near.note)}` : ''}`);
      }
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
