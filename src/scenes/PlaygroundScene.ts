// The playground: a place to compare looks, not to play.
//
// The hero walks around a meadow that has a bit of everything in it. Along the roads stand exhibits:
// the heroes still in the running on the left, the villagers at the top, the monsters on the right. Every
// exhibit has a code (C1, S2, P7, M3...) so a choice can be named in one word; standing next to one shows what
// it is, its size and how many colours it uses. Monsters drawn whole (M) walk, attack, and change into their
// Nawia form when the world is shifted.
//
// Which heroes and monsters stand here, in what order and under what headings, is written in
// src/lab/lineup.txt.
// What is taken off the board goes to that file's archive: it is never deleted, and comes back with one line.
// What is chosen gets built into the game; see docs/PLAYGROUND.md.
//
//   Q / E  walk as the previous / next hero     1 / 2  villagers' height     O  line round the dolls    N  scenery mood
//   SHIFT  world                                G      tile grid             T  labels                  ESC  back to the title

import Phaser from 'phaser';
import { DEPTH, GAME_H, GAME_W, TILE, TUNE, otherWorld, type World } from '../config.ts';
import { BOSS, HERO as GAME_HERO, HERO_LOOKS as GAME_LOOKS, MOB } from '../art/actors.ts';
import { beastSheet, checkBeast, type Beast } from '../art/beasts/beast.ts';
import { BEASTS } from '../art/beasts/index.ts';
import { BUILDS as OLD_BUILDS, HEROES as OLD_HEROES, OLD_BEASTS } from '../art/archive.ts';
import { CREATURES } from '../art/cast.ts';
import { FOLK_LOOKS, HERO_LOOKS, dollSheet, type Ink, type Size } from '../art/dolls.ts';
import { checkConcept, conceptSheet } from '../art/concepts/concept.ts';
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
  /** phase 0 stands, 1-4 walk, 5-6 attack */
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
  /** what is wrong with a concept's drawing (it is still drawn, as well as it can be) */
  errors?: string[];
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
const HERO_ROWS = [13, 18, 23, 28, 33, 38];
const HERO_COLS = [2, 5, 8, 11, 14, 17, 20];
/** Monsters fill the same rows, right of the heroes: three tiles apart, four in a group with a big one in it. */
const MONSTER_X = [23, 57];

const FOLK_SPOTS: [number, number][] = [[3, 8], [7, 8], [12, 8], [16, 8]];

/** Something lineup.txt can put on the monster board. */
interface Monster {
  code: string;
  title: Bilingual;
  name: Bilingual;
  note: Bilingual | null;
  does: Exhibit['does'];
  /** the widest it gets, in px */
  w: number;
  sprites: () => Sprites;
  /** what is wrong with a drawing (it is still drawn, as well as it can be) */
  errors?: string[];
}

/** The game's own enemies, as they are now, to compare the new ones with: first frame and count on their sheet. */
const GAME_ENEMIES: { name: Bilingual; short: Bilingual; key: 'mobs' | 'boss'; first: number; count: number }[] = [
  { name: { pl: 'utopiec (w grze)', en: 'drowned one (in the game)' }, short: { pl: 'utopiec z gry', en: 'game drowned one' }, key: 'mobs', first: MOB.UTOPIEC, count: 3 },
  { name: { pl: 'zjawa (w grze)', en: 'wraith (in the game)' }, short: { pl: 'zjawa z gry', en: 'game wraith' }, key: 'mobs', first: MOB.ZJAWA, count: 3 },
  { name: { pl: 'strzyga w Jawi (w grze)', en: 'strzyga in Jawia (in the game)' }, short: { pl: 'strzyga z gry', en: 'game strzyga' }, key: 'mobs', first: MOB.STRZYGA, count: 3 },
  { name: { pl: 'strzyga w Nawii (w grze)', en: 'strzyga in Nawia (in the game)' }, short: { pl: 'jej dusza', en: 'her soul' }, key: 'mobs', first: MOB.STRZYGA_N, count: 3 },
  { name: { pl: 'dzik (w grze)', en: 'boar (in the game)' }, short: { pl: 'dzik z gry', en: 'game boar' }, key: 'mobs', first: MOB.DZIK, count: 3 },
  { name: { pl: 'wilk (w grze)', en: 'wolf (in the game)' }, short: { pl: 'wilk z gry', en: 'game wolf' }, key: 'mobs', first: MOB.WILK, count: 3 },
  { name: { pl: 'strażnik, boss (w grze)', en: 'the guardian, boss (in the game)' }, short: { pl: 'boss z gry', en: 'game boss' }, key: 'boss', first: BOSS.IDLE, count: 2 },
];

/** Something standing in the meadow: the hero, or an exhibit. */
class Figure {
  x: number;
  y: number;
  facing: Dir = 'down';
  moving = false;
  /** px walked, drives the walk cycle */
  dist = 0;
  /** 0, or which frame of an attack it is in (1 the wind-up, 2 the blow) */
  acting = 0;
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
    const phase = this.acting ? 4 + this.acting : this.moving ? 1 + (Math.floor(this.dist / 5) % 4) : 0;
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
   * then walking in place in each direction. 'stay': stands and keeps moving in place (a flame). 'hunt': walks
   * to and fro and attacks at each end.
   */
  does: 'pace' | 'turn' | 'show' | 'stay' | 'hunt';
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
  /** every monster the monster board can show, by code */
  private monsters = new Map<string, Monster>();
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
    this.monsters = this.bestiary();
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
    // a concept with a mistake in it (a row too short, a letter with no colour) is drawn as well as it can be,
    // and its mistakes are listed in the browser console and flagged in the status line
    for (const c of CONCEPTS) {
      put(c.code, c.name, c.note, () => this.sheet(`concept:${c.id}`, () => conceptSheet(c, false)));
      const errors = checkConcept(c);
      if (errors.length) {
        out.get(c.code)!.errors = errors;
        console.warn(`playground: ${c.code} (${c.id}.concept.ts) has mistakes:\n  ${errors.join('\n  ')}`);
      }
    }
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

  /** Everything lineup.txt can put on the monster board, by code. */
  private bestiary(): Map<string, Monster> {
    const out = new Map<string, Monster>();
    const put = (m: Monster): void => {
      if (out.has(m.code) || this.entries.has(m.code)) console.warn(`playground: two exhibits share the code ${m.code}`);
      out.set(m.code, m);
    };
    // P: the first monsters (cast.ts), posed by the figure painter or drawn by hand
    CREATURES.forEach((c, i) => {
      const title = c.kind.pl.toLowerCase() === c.name.pl.toLowerCase() ? c.kind : { pl: `${c.kind.pl}: ${c.name.pl}`, en: `${c.kind.en}: ${c.name.en}` };
      put({ code: `P${i + 1}`, title, name: c.name, note: c.note, does: c.mob ? 'stay' : 'pace', w: c.tiles === 2 ? 24 : 16, sprites: () => this.creatureSprites(i) });
    });
    // E: the game's enemies as they are now
    GAME_ENEMIES.forEach((g, i) => {
      const fw = g.key === 'boss' ? BOSS.fw : MOB.fw;
      const fh = g.key === 'boss' ? BOSS.fh : MOB.fh;
      const sprites: Sprites = { key: g.key, fw, fh, colors: 0, frame: (_v, phase) => g.first + (phase % g.count) };
      put({ code: `E${i + 1}`, title: g.name, name: g.short, note: null, does: 'stay', w: fw, sprites: () => sprites });
    });
    // M: monsters drawn whole (src/art/beasts), each in Jawia's form or, when the world is shifted, Nawia's
    for (const b of BEASTS) {
      const title = { pl: `${b.kind.pl}: ${b.name.pl}`, en: `${b.kind.en}: ${b.name.en}` };
      const other = b.nawia?.note ? { pl: ` [Shift] ${b.nawia.note.pl}`, en: ` [Shift] ${b.nawia.note.en}` } : { pl: '', en: '' };
      const instead = b.alt.length ? { pl: `zamiast ${b.alt.join(', ')}: `, en: `instead of ${b.alt.join(', ')}: ` } : { pl: 'nowy: ', en: 'new: ' };
      const note = { pl: instead.pl + b.note.pl + other.pl, en: instead.en + b.note.en + other.en };
      const errors = checkBeast(b);
      if (errors.length) console.warn(`playground: ${b.code} (${b.id}.beast.ts) has mistakes:\n  ${errors.join('\n  ')}`);
      // over its head only what it is (Wodnik); the reading of it (pan jeziora z garnkiem) is in the title
      put({ code: b.code, title, name: b.kind, note, does: 'hunt', w: b.w, sprites: () => this.beastSprites(b), errors: errors.length ? errors : undefined });
    }
    return out;
  }

  /** A monster drawn whole, in the form of the world it is in now. */
  private beastSprites(b: Beast): Sprites {
    const world = b.nawia && this.world === 'nawia' ? 'nawia' : 'jawia';
    const key = `lab:beast:${b.id}:${world}`;
    const made = this.made.get(key);
    if (made && this.textures.exists(key)) return made;
    const s = beastSheet(b, world, false);
    addBufferTexture(this, key, s.buf, s.fw, s.fh);
    const sprites: Sprites = { key, fw: s.fw, fh: s.fh, colors: s.colors, frame: (_v, phase) => s.frameOf(phase) };
    this.made.set(key, sprites);
    return sprites;
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
    const named = new Set([...lineup.board.flatMap((r) => r.codes), ...lineup.monsters.flatMap((r) => r.codes), ...lineup.archive]);
    for (const code of named) if (!this.entries.has(code) && !this.monsters.has(code)) console.warn(`playground: lineup.txt names ${code}, which does not exist`);
    for (const code of [...this.entries.keys(), ...this.monsters.keys()]) if (!named.has(code)) console.warn(`playground: ${code} is in neither part of lineup.txt (not shown)`);
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

    // the monster board, right of the heroes, as lineup.txt has it
    row = 0;
    for (const group of lineup.monsters) {
      const list = group.codes.map((c) => this.monsters.get(c)).filter((m): m is Monster => !!m);
      const step = list.some((m) => m.w > 24) ? 4 : 3;
      const cols: number[] = [];
      for (let x = MONSTER_X[0]; x <= MONSTER_X[1]; x += step) cols.push(x);
      for (let i = 0; i < list.length; i += cols.length) {
        if (row >= HERO_ROWS.length) {
          console.warn('playground: the monster board is full; the rest of lineup.txt is not shown');
          break;
        }
        const ty = HERO_ROWS[row];
        if (i === 0 && group.heading) heading(cols[0], ty, group.heading);
        list.slice(i, i + cols.length).forEach((m, k) => add(m.code, m.title, m.name, m.note, [cols[k], ty], m.does, m.sprites));
        row++;
      }
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
    // a drawing with mistakes says so in place of the second line
    if (c.errors) this.status[1].setText(t({ pl: `! ${c.code}: błędy w rysunku: ${c.errors.length}, opis w konsoli (F12)`, en: `! ${c.code}: mistakes in the drawing: ${c.errors.length}, listed in the console (F12)` }));
    else this.status[1].setText(t({ pl: `[1/2] mieszkańcy ${SIZES[this.size === 'small' ? 0 : 1].short}   [O] lalki: ${INKS[this.ink].name.pl}`, en: `[1/2] villagers ${SIZES[this.size === 'small' ? 0 : 1].short}   [O] dolls: ${INKS[this.ink].name.en}` }));
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
      // monsters with a form of their own in Nawia change into it
      this.restyle();
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
      } else if (e.does === 'hunt') {
        // 1.6 s walking right, an attack (a wind-up, the blow, a breath), 1.6 s back, another attack
        const k = e.t % 6.4;
        const right = k < 3.2;
        const leg = k % 3.2;
        f.facing = right ? 'right' : 'left';
        if (leg < 1.6) {
          f.moving = true;
          f.acting = 0;
          f.x = right ? e.homeX - 14 + (leg / 1.6) * 28 : e.homeX + 14 - (leg / 1.6) * 28;
          f.dist = e.t * 17.5;
        } else {
          const a = leg - 1.6;
          f.moving = false;
          f.dist = 0;
          f.acting = a < 0.5 ? 1 : a < 1.0 ? 2 : 0;
          f.x = right ? e.homeX + 14 : e.homeX - 14;
        }
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
