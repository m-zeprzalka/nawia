// The game itself: one room on screen, two worlds laid over each other.

import Phaser from 'phaser';
import {
  DEPTH, GAME_H, GAME_W, TILE, TUNE, VIEW_PAD_Y, otherWorld, type World,
} from '../config.ts';
import { GAME_LOOKS } from '../art/heroGame.ts';
import { OBJ, PX } from '../art/sprites.ts';
import { ART, addBufferTexture } from '../art/textures.ts';
import { audio } from '../audio/audio.ts';
import { globalKeys } from '../core/globalKeys.ts';
import { input, type Dir } from '../core/input.ts';
import { Boss } from '../entities/Boss.ts';
import { Critter } from '../entities/Critter.ts';
import { Enemy, type EnemyEvent } from '../entities/Enemy.ts';
import { DIR_VEC, Player, type StrikeSpec } from '../entities/Player.ts';
import type { EnemyKind } from '../world/roomFormat.ts';
import { Prop, type Place } from '../entities/Prop.ts';
import { Shot, type ShotKind } from '../entities/Shot.ts';
import { DualCanvas } from '../fx/DualCanvas.ts';
import { Fx } from '../fx/Fx.ts';
import { Lighting, type LightSource, type RGB } from '../fx/Lighting.ts';
import { STR, t } from '../i18n/strings.ts';
import { Talk, type Dialogs } from '../story/dialog.ts';
import { loadDialogs } from '../story/dialogData.ts';
import { Hud } from '../ui/Hud.ts';
import { loadDungeon } from '../world/dungeonData.ts';
import { BLOCK_FLY, Level, overlap, roomOriginX, roomOriginY } from '../world/Level.ts';
import { paintRoom, type RoomPicture } from '../world/painter.ts';
import { isSurface, type RoomDef } from '../world/roomFormat.ts';

/** The flags conversations set when they give him something (see docs/DIALOGS.md). */
const GEAR_FLAGS = ['ma.miecz', 'ma.tarcza', 'ma.kurzy-bog'];

/** How many monsters may be winding up or striking at him at once (the rest wait their turn). */
const MAX_ATTACKERS = 2;
/** The chance a wounded hero finds a heart where a monster fell. */
const HEART_DROP = 0.22;
/** The sweep of the blade: warm white in Jawia, cold in Nawia. */
const SMEAR_TINT: Record<World, number> = { jawia: 0xfff4e0, nawia: 0xc4f4ff };
/** What a wisp's fire sent back does to it. */
const SHOT_STRIKE: StrikeSpec = { damage: 1, knock: 170, hitstop: 0.06, trauma: 0.35, heavy: false };
const HERO_BLOOD = [0xb01c2c, 0xd8323e, 0x6a0e18];
/** What each kind bleeds when a blade goes in: animals blood, the drowned bog water, ghosts light. */
const BLOOD: Record<EnemyKind, number[]> = {
  utopiec: [0x2c3c34, 0x4e6c58, 0x1a2420],
  zjawa: [0xd8f0ff, 0x9ad0ff, 0xffffff],
  ognik: [0xc8ff80, 0x78d040, 0xffffff],
  strzyga: [0x6a0e18, 0x9a1c24, 0x2a0608],
  dzik: [0x7a1018, 0xa8202a, 0x4a0a0e],
  wilk: [0x7a1018, 0xa02030, 0xb050d0],
  morownik: [0xb050d0, 0xe080f0, 0x5a2070],
};
const NAWIA_BLOOD = [0xc8f0ff, 0x8ad8ff, 0xffffff];
const bloodOf = (kind: EnemyKind, world: World): number[] => (world === 'nawia' && kind !== 'zjawa' ? NAWIA_BLOOD : BLOOD[kind]);

type State = 'play' | 'slide' | 'rejected' | 'dying' | 'ending' | 'paused' | 'talk' | 'door' | 'waking';

interface Pickup {
  x: number;
  y: number;
  t: number;
  sprite: Phaser.GameObjects.Image;
  /** Hearts placed in the room file are remembered once taken. */
  key?: string;
}

interface ActiveRoom {
  def: RoomDef;
  ox: number;
  oy: number;
  w: number;
  h: number;
  painter: RoomPicture;
  view: DualCanvas;
  /** What hangs over the hero's head (tree crowns, roof ridges): drawn above everyone. Surface rooms only. */
  top: DualCanvas | null;
  /** Under the open sky (village, forest) rather than in the stronghold. */
  outdoors: boolean;
  /** Stronghold, open sky or inside a house: decides the air, the music and how props look. */
  place: Place;
  /** Doorways into houses (and out of them). */
  doors: { tx: number; ty: number; to: string }[];
  critters: Critter[];
  /** Afterimage of the other world's solids, one per world you can be standing in. */
  echo: Record<World, Phaser.GameObjects.Image>;
  echoKeys: string[];
  props: Prop[];
  enemies: Enemy[];
  pickups: Pickup[];
  shots: Shot[];
  boss: Boss | null;
  /** The guardian's health, shown as beads at the top of the screen. */
  pips: Phaser.GameObjects.Image[];
  /** Which side of the turning stone is up: false = sun posts stand, true = moon posts stand. */
  moon: boolean;
  bellRung: boolean;
  /** Which wave of monsters is up: 1 is the map's own; the room's `waves` come after it. */
  wave: number;
  /** Seconds since the last monster of a wave fell (the next one comes after a breath). */
  waveT: number;
  /** The ways out are to close as soon as he is clear of them (an arena: `lock: yes`). */
  lockPending: boolean;
}

const ACCENT: Record<World, number> = { jawia: 0xffcf6a, nawia: 0x9af4ff };

/** The air of a place: how dark it is, what the hero's own light looks like, the mist. */
interface Dressing {
  ambient: RGB;
  heroLight: RGB;
  heroGlow: number;
  fog: RGB;
  fogAlpha: number;
  /** how much the corners of the screen darken */
  vignette: number;
}
const placeOf = (r: RoomDef): Place => (isSurface(r.biome) ? 'surface' : r.biome === 'house' ? 'house' : 'crypt');

/** What the air of Jawia drifts towards where the blight is thickest (Nawia needs no help). */
const BLIGHT_AIR: Dressing = { ambient: [0.8, 0.75, 0.94], heroLight: [1.0, 0.9, 0.7], heroGlow: 0, fog: [0.74, 0.52, 0.92], fogAlpha: 0.17, vignette: 0.75 };

const DRESS: Record<Place, Record<World, Dressing>> = {
  // The stronghold: Jawia is dark and lit by fire. Nawia has no darkness to speak of: it glows by itself.
  crypt: {
    jawia: { ambient: [0.45, 0.46, 0.6], heroLight: [0.95, 0.8, 0.6], heroGlow: 0.56, fog: [0.6, 0.72, 0.66], fogAlpha: 0.13, vignette: 1 },
    nawia: { ambient: [0.7, 0.76, 0.98], heroLight: [0.5, 0.8, 1.0], heroGlow: 0.3, fog: [0.62, 0.8, 1.0], fogAlpha: 0.24, vignette: 1 },
  },
  // Under the open sky: a bright morning in Jawia, a moonless night that glows in Nawia.
  surface: {
    jawia: { ambient: [1.0, 0.97, 0.9], heroLight: [1.0, 0.9, 0.7], heroGlow: 0, fog: [1.0, 0.96, 0.84], fogAlpha: 0.05, vignette: 0.3 },
    nawia: { ambient: [0.88, 0.92, 1.0], heroLight: [0.5, 0.8, 1.0], heroGlow: 0.12, fog: [0.62, 0.8, 1.0], fogAlpha: 0.18, vignette: 0.4 },
  },
  // Inside a house: warm and dim, lit by the hearth and by what comes in through the windows.
  house: {
    jawia: { ambient: [0.8, 0.73, 0.66], heroLight: [1.0, 0.85, 0.6], heroGlow: 0.2, fog: [1.0, 0.9, 0.7], fogAlpha: 0, vignette: 0.9 },
    nawia: { ambient: [0.78, 0.84, 1.0], heroLight: [0.5, 0.8, 1.0], heroGlow: 0.2, fog: [0.62, 0.8, 1.0], fogAlpha: 0.1, vignette: 0.9 },
  },
};
const WATER_FRAME_TIME = 0.22;

const lerp = (a: number, b: number, k: number): number => a + (b - a) * k;
const rgbToHex = (c: RGB): number => (Math.round(c[0] * 255) << 16) | (Math.round(c[1] * 255) << 8) | Math.round(c[2] * 255);
let roomUid = 0;

export class GameScene extends Phaser.Scene {
  private level!: Level;
  private world: World = 'jawia';
  private player!: Player;
  private room!: ActiveRoom;
  private leaving: ActiveRoom | null = null;
  private lighting!: Lighting;
  private fog: Phaser.GameObjects.TileSprite[] = [];
  private fx!: Fx;
  private hud!: Hud;

  private state: State = 'play';
  private stateT = 0;
  private clock = 0;
  private camX = 0;
  private camY = 0;
  private trauma = 0;
  private kick = 0;
  /** A shove of the whole picture the way a blow went (px), easing back at once. */
  private punchX = 0;
  private punchY = 0;
  private hitstop = 0;
  /** Seconds of slow motion left: the last blow of a fight, his fall. */
  private slowmo = 0;
  private shiftCd = 0;
  private animT = 0;
  private animFrame = 0;
  private echoT = 0;
  private slide = { t: 0, fromX: 0, fromY: 0, toX: 0, toY: 0, pFromX: 0, pFromY: 0, pToX: 0, pToY: 0 };
  /** Where (and in which world) he came into this room: the place the border throws him back to. */
  private entry = { x: 0, y: 0, world: 'jawia' as World, facing: 'down' as Dir };
  private cleared = new Set<string>();
  private ambient: RGB = [...DRESS.crypt.jawia.ambient];
  private heroLight: RGB = [...DRESS.crypt.jawia.heroLight];
  private heroGlow = DRESS.crypt.jawia.heroGlow;
  private fogTint: RGB = [...DRESS.crypt.jawia.fog];
  private fogAlpha = DRESS.crypt.jawia.fogAlpha;
  private vignette = 1;
  private hasShifted = false;
  private hasAttacked = false;
  private hasGuarded = false;
  private hasDodged = false;
  private hasComboed = false;
  /** Seconds left of the reminder that he has no stone to turn yet. */
  private noStoneHintT = 0;
  private rejectHintT = 0;
  private timeInRoom = 0;
  private bellSwing = -1;
  private clinkSwing = -1;
  private switchSwing = -1;
  private endStep = 0;
  private taken = new Set<string>();
  private hasReflected = false;
  private heartHintT = 0;
  private stoneHintT = 0;
  private soulsHintT = 0;
  private dialogs: Dialogs = new Map();
  /** What conversations have set: things the story remembers for the length of a run. */
  private flags = new Set<string>();
  private talk: Talk | null = null;
  private talkCursor = 0;
  private talkLatch = 0;
  private veil!: Phaser.GameObjects.Rectangle;
  private lids: Phaser.GameObjects.Rectangle[] = [];
  private doorTo: { room: RoomDef; tx: number; ty: number } | null = null;
  /** False from the moment he arrives through a door until he has stepped clear of every doorway. */
  private offDoor = true;
  private hasMoved = false;
  private look = 0;

  constructor() {
    super('game');
  }

  create(): void {
    const dungeon = loadDungeon();
    this.level = new Level(dungeon);
    this.world = 'jawia';
    this.state = 'play';
    this.stateT = 0;
    this.clock = 0;
    this.trauma = 0;
    this.kick = 0;
    this.hitstop = 0;
    this.shiftCd = 0;
    this.echoT = 0;
    this.leaving = null;
    this.cleared = new Set();
    this.hasShifted = false;
    this.hasAttacked = false;
    this.hasGuarded = false;
    this.hasDodged = false;
    this.hasComboed = false;
    this.noStoneHintT = 0;
    this.rejectHintT = 0;
    this.bellSwing = -1;
    this.clinkSwing = -1;
    this.switchSwing = -1;
    this.endStep = 0;
    this.taken = new Set();
    this.hasReflected = false;
    this.heartHintT = 0;
    this.stoneHintT = 0;
    this.soulsHintT = 0;
    this.dialogs = loadDialogs();
    this.flags = new Set();
    this.talk = null;
    this.doorTo = null;
    this.offDoor = true;
    this.hasMoved = false;

    // dev shortcuts: ?room=bridge&world=nawia
    const params = new URLSearchParams(location.search);
    let start = dungeon.startRoom();
    const wanted = params.get('room');
    if (wanted && dungeon.has(wanted)) start = dungeon.get(wanted);
    if (params.get('world') === 'nawia') this.world = 'nawia';

    this.cameras.main.setBackgroundColor(0x05050b);
    const ox = roomOriginX(start);
    const oy = roomOriginY(start);
    const spawn = start.spawn && start === dungeon.startRoom() ? start.spawn : { tx: 2, ty: Math.floor(start.rows / 2) };
    const free = this.level.findFree(this.world, ox + spawn.tx * TILE + 8, oy + spawn.ty * TILE + 8, 5, 4, 200) ?? {
      x: ox + spawn.tx * TILE + 8,
      y: oy + spawn.ty * TILE + 8,
    };

    const direct = start !== dungeon.startRoom() || this.world === 'nawia';
    const dress = DRESS[placeOf(start)][this.world];
    this.ambient = [...dress.ambient];
    this.heroLight = [...dress.heroLight];
    this.heroGlow = dress.heroGlow;
    this.fogTint = [...dress.fog];
    this.fogAlpha = dress.fogAlpha;
    this.vignette = dress.vignette;

    this.player = new Player(this, free.x, free.y);
    this.player.smear.setTint(SMEAR_TINT[this.world]);
    this.lighting = new Lighting(this);
    this.fog = [0, 1].map((i) =>
      this.add.tileSprite(0, 0, GAME_W, GAME_H, 'fog').setOrigin(0, 0).setScrollFactor(0).setDepth(DEPTH.fog - i * 0.1),
    );
    this.fx = new Fx(this);
    this.hud = new Hud(this);
    this.hud.setHearts(this.player.hp);
    this.hud.setWorld(this.world, false);
    this.veil = this.add.rectangle(0, 0, GAME_W, GAME_H, 0x000000).setOrigin(0, 0).setScrollFactor(0).setDepth(DEPTH.flash + 20).setAlpha(0);
    this.lids = [0, 1].map(() =>
      this.add.rectangle(0, 0, GAME_W, GAME_H / 2 + 2, 0x000000).setOrigin(0, 0).setScrollFactor(0).setDepth(DEPTH.flash + 30).setVisible(false),
    );
    // which hero the player last tried on (H cycles through them)
    let saved = 0;
    try {
      saved = Number(localStorage.getItem('nawia.look') ?? 0) || 0;
    } catch {
      /* private mode: fine */
    }
    this.look = Math.min(GAME_LOOKS.length - 1, Math.max(0, saved));
    // he wakes up with nothing; jumping straight into a room (a dev shortcut) gives him everything
    if (direct) for (const f of GEAR_FLAGS) this.flags.add(f);
    this.applyGear();
    this.input.keyboard?.on('keydown-H', this.cycleLook, this);
    // B: the enemies' new looks (the monsters drawn whole) or their first ones, to compare
    try {
      Enemy.newLooks = localStorage.getItem('nawia.beasts') !== 'old';
    } catch {
      /* private mode: fine */
    }
    this.input.keyboard?.on('keydown-B', this.cycleBeasts, this);

    this.room = this.buildRoom(start);
    this.entry = { x: this.player.x, y: this.player.y, world: this.world, facing: this.player.facing };
    // Painting a surface room takes a few frames until the browser has optimised that code, and one frame after.
    // Do the slow runs now, while the screen is still black, so walking into the next room does not hitch.
    const outdoors = dungeon.rooms.filter((r) => isSurface(r.biome)).slice(0, 3);
    for (let i = 0; i < 2; i++) for (const r of outdoors) paintRoom(r, dungeon, ART.tilesets);
    const cam = this.cameraTarget(this.room, this.player.x, this.player.y);
    this.camX = cam.x;
    this.camY = cam.y;
    this.onEnterRoom();

    audio.unlock();
    audio.startAmbience();
    audio.setWorld(this.world);
    if (direct) this.hud.flash(0x000000, 1, 900);
    else {
      // he wakes up in his own bed: eyes open, close again, and open for good
      this.state = 'waking';
      this.stateT = 0;
      this.lids.forEach((l) => l.setVisible(true));
      this.updateWaking(0);
    }
    input.flush();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off('keydown-H', this.cycleLook, this);
      this.input.keyboard?.off('keydown-B', this.cycleBeasts, this);
      this.destroyRoom(this.room);
      if (this.leaving) this.destroyRoom(this.leaving);
    });

    if (import.meta.env.DEV) (window as unknown as { __nawia: GameScene }).__nawia = this;
    this.render();
  }

  // ------------------------------------------------------------------ rooms

  private buildRoom(def: RoomDef): ActiveRoom {
    const ox = roomOriginX(def);
    const oy = roomOriginY(def);
    const outdoors = isSurface(def.biome);
    const place = placeOf(def);
    const painter = paintRoom(def, this.level.dungeon, ART.tilesets);
    const view = new DualCanvas(this, painter.buffers, this.world);
    view.image.setPosition(ox, oy).setDepth(DEPTH.room);
    const top = painter.overhead ? new DualCanvas(this, painter.overhead, this.world, true) : null;
    top?.image.setPosition(ox, oy).setDepth(DEPTH.overhead);

    const id = roomUid++;
    const echoKeys = [`echo:${id}:jawia`, `echo:${id}:nawia`];
    addBufferTexture(this, echoKeys[0], painter.echo.jawia);
    addBufferTexture(this, echoKeys[1], painter.echo.nawia);
    const echoImage = (key: string): Phaser.GameObjects.Image =>
      this.add.image(ox, oy, key).setOrigin(0, 0).setDepth(DEPTH.fog + 0.5).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0);
    const echo = { jawia: echoImage(echoKeys[0]), nawia: echoImage(echoKeys[1]) };

    const hasFoes = def.objects.some((o) => o.kind === 'enemy' || o.kind === 'boss');
    const hasBell = def.objects.some((o) => o.kind === 'bell');
    // a room is settled once its bell has rung or, if it has none, once nothing in it is left standing
    const cleared = this.cleared.has(def.id) || (!hasFoes && !hasBell);
    const room: ActiveRoom = {
      def, ox, oy, w: painter.w, h: painter.h, painter, view, top, outdoors, place, doors: [], critters: [], echo, echoKeys,
      props: [], enemies: [], pickups: [], shots: [], boss: null, pips: [], moon: false, bellRung: cleared,
      wave: 1, waveT: 0, lockPending: def.lock && !cleared && (hasFoes || def.waves.length > 0),
    };
    const bounds = { x: ox, y: oy, w: painter.w, h: painter.h };
    for (const o of def.objects) {
      const cx = ox + o.tx * TILE + 8;
      const cy = oy + o.ty * TILE + 8;
      if (o.kind === 'enemy') {
        if (cleared) continue;
        this.spawnEnemy(room, o.type, cx, cy);
      } else if (o.kind === 'boss') {
        if (cleared) continue;
        // 'K' marks the top-left tile of its 2x2 footprint
        const boss = new Boss(this, cx + 8, cy + 8, this.world);
        boss.onShoot = (x, y, vx, vy) => this.spawnShot(room, 'soul', 'nawia', x, y, vx, vy, null);
        room.boss = boss;
        for (let i = 0; i < TUNE.boss.hp; i++)
          room.pips.push(
            this.add.image(GAME_W / 2 + (i - (TUNE.boss.hp - 1) / 2) * 9, GAME_H - 26, 'px', PX.DIAMOND)
              .setScrollFactor(0).setDepth(DEPTH.flash - 1).setVisible(false),
          );
      } else if (o.kind === 'door') {
        room.doors.push(o);
      } else if (o.kind === 'critter') {
        room.critters.push(new Critter(this, cx, cy, this.world, bounds));
      } else if (o.kind === 'heart') {
        const key = `${def.id}:${o.tx},${o.ty}`;
        if (!this.taken.has(key)) this.dropHeart(room, cx, cy, key);
      } else {
        const p = new Prop(this, o, ox, oy, this.world, place);
        if (p.kind === 'gate') p.setOpen(cleared);
        // the turning stone starts sun side up: sun posts stand, moon posts lie flush with the floor
        if (p.kind === 'post') p.setOpen(p.moon);
        // urns come back whole every time the room is entered, like pots should
        if (p.kind === 'greatbell') for (const dx of [-1, 0, 1]) this.level.setBlocked(def, o.tx + dx, o.ty, true);
        else this.level.setBlocked(def, o.tx, o.ty, p.solid);
        room.props.push(p);
      }
    }
    return room;
  }

  private spawnEnemy(room: ActiveRoom, type: EnemyKind, x: number, y: number): Enemy {
    const e = new Enemy(this, type, x, y, this.world, { x: room.ox, y: room.oy, w: room.w, h: room.h });
    if (type === 'ognik') e.onShoot = (sx, sy, vx, vy) => this.spawnShot(room, 'wisp', 'jawia', sx, sy, vx, vy, e);
    if (type === 'morownik') e.onShoot = (sx, sy, vx, vy) => this.spawnShot(room, 'thorn', 'jawia', sx, sy, vx, vy, e);
    room.enemies.push(e);
    return e;
  }

  /** The next wave of the room comes up out of the ground: smoke, a glint, and they are there. */
  private spawnWave(room: ActiveRoom): void {
    const list = room.def.waves[room.wave - 1];
    room.wave++;
    room.waveT = 0;
    if (!list) return;
    audio.sfx('spawn');
    this.trauma = Math.max(this.trauma, 0.3);
    for (const o of list) {
      const x = room.ox + o.tx * TILE + 8;
      const y = room.oy + o.ty * TILE + 8;
      const e = this.spawnEnemy(room, o.type, x, y);
      e.emerge();
      const tint = e.home === 'nawia' ? 0x9ad0ff : 0xb050d0;
      this.fx.death(x, y - 4, e.home);
      this.fx.dust(x, y + 4, 8, tint, 1.2);
    }
  }

  /**
   * An arena: once he is clear of the ways in, bars (or the palisade's gates) drop across every way out, and
   * they open again when the room is settled (see checkCleared).
   */
  private tryLock(): void {
    const { room, level, player } = this;
    const def = room.def;
    const exits: [number, number][] = [];
    for (let ty = 0; ty < def.rows; ty++)
      for (let tx = 0; tx < def.cols; tx++) {
        if (tx !== 0 && ty !== 0 && tx !== def.cols - 1 && ty !== def.rows - 1) continue;
        const x = room.ox + tx * TILE + 8;
        const y = room.oy + ty * TILE + 8;
        if (level.blocked('jawia', x, y, 4, 4) && level.blocked('nawia', x, y, 4, 4)) continue;
        exits.push([tx, ty]);
      }
    const pb = player.box;
    for (const [tx, ty] of exits) if (overlap(pb, { x: room.ox + tx * TILE + 8, y: room.oy + ty * TILE + 8, hw: 9, hh: 9 })) return;
    room.lockPending = false;
    if (!exits.length) return;
    for (const [tx, ty] of exits) {
      const gate = new Prop(this, { kind: 'gate', tx, ty }, room.ox, room.oy, this.world, room.place);
      gate.setOpen(false);
      level.setBlocked(def, tx, ty, true);
      room.props.push(gate);
      this.fx.debris(gate.x, gate.y + 4, undefined, 3);
    }
    audio.sfx('lock');
    this.trauma = Math.max(this.trauma, 0.45);
  }

  private spawnShot(room: ActiveRoom, kind: ShotKind, home: World, x: number, y: number, vx: number, vy: number, owner: Enemy | null): void {
    room.shots.push(new Shot(this, kind, home, x, y, vx, vy, owner));
    if (kind !== 'soul') audio.sfx('shoot');
  }

  private dropHeart(room: ActiveRoom, x: number, y: number, key?: string): void {
    const sprite = this.add.image(x, y + 8, 'objects', OBJ.HEART).setOrigin(0.5, 1).setDepth(DEPTH.entities + (y + 6) / 1000);
    room.pickups.push({ x, y, t: key ? 1 : 0, sprite, key });
  }

  private destroyRoom(r: ActiveRoom): void {
    r.view.destroy();
    r.top?.destroy();
    r.echo.jawia.destroy();
    r.echo.nawia.destroy();
    for (const key of r.echoKeys) if (this.textures.exists(key)) this.textures.remove(key);
    r.props.forEach((p) => p.destroy());
    r.enemies.forEach((e) => e.destroy());
    r.critters.forEach((c) => c.destroy());
    r.pickups.forEach((p) => p.sprite.destroy());
    r.shots.forEach((sh) => sh.destroy());
    r.boss?.destroy();
    r.pips.forEach((p) => p.destroy());
  }

  private onEnterRoom(): void {
    this.timeInRoom = 0;
    this.echoT = 0;
    this.hud.showRoomName(t(this.room.def.name));
    this.fx.setAmbience(this.world, this.room.ox, this.room.oy, this.room.w, this.room.h, this.room.outdoors, this.room.def.blight);
    audio.setPlace(this.room.def.biome, this.room.def.blight);
  }

  /** What the story has given him (flags set in conversations) is what he carries; he is drawn with it. */
  private applyGear(): void {
    const g = this.player.gear;
    g.sword = this.flags.has('ma.miecz');
    g.shield = this.flags.has('ma.tarcza');
    g.stone = this.flags.has('ma.kurzy-bog');
    this.player.setLook(`${GAME_LOOKS[this.look].key}${g.shield ? '' : '-bare'}`);
    this.hud?.setStone(g.stone);
  }

  /** B: the enemies in their new looks or in their first ones. Remembered between visits. */
  private cycleBeasts(): void {
    Enemy.newLooks = !Enemy.newLooks;
    try {
      localStorage.setItem('nawia.beasts', Enemy.newLooks ? 'new' : 'old');
    } catch {
      /* private mode: fine */
    }
    this.hud.showRoomName(t(Enemy.newLooks ? STR.beastsNew : STR.beastsOld));
  }

  /** H: try the next hero on. The choice is remembered between visits. */
  private cycleLook(): void {
    this.look = (this.look + 1) % GAME_LOOKS.length;
    this.applyGear();
    try {
      localStorage.setItem('nawia.look', String(this.look));
    } catch {
      /* private mode: fine */
    }
    this.hud.showRoomName(`${t(STR.look)}: ${t(GAME_LOOKS[this.look].name)}`);
  }

  /** Starts the ring in a room: on the ground and on whatever hangs overhead. (cx, cy) are global px. */
  private reveal(room: ActiveRoom, to: World, cx: number, cy: number): void {
    room.view.reveal(to, cx - room.ox, cy - room.oy);
    room.top?.reveal(to, cx - room.ox, cy - room.oy);
  }

  /** Where the camera sits for a room: locked to it, following only if the room is bigger than the screen. */
  private cameraTarget(r: ActiveRoom, px: number, py: number): { x: number; y: number } {
    const x = Phaser.Math.Clamp(px - GAME_W / 2, r.ox, r.ox + r.w - GAME_W);
    const y = Phaser.Math.Clamp(py - GAME_H / 2, r.oy - VIEW_PAD_Y, r.oy + r.h - GAME_H + VIEW_PAD_Y);
    return { x: Math.round(x), y: Math.round(y) };
  }

  // ------------------------------------------------------------------ main loop

  update(time: number, delta: number): void {
    const rawDt = Math.min(delta, 50) / 1000;
    input.update(time / 1000);
    globalKeys(this);

    if (input.consume('pause') && (this.state === 'play' || this.state === 'paused')) {
      this.state = this.state === 'paused' ? 'play' : 'paused';
      this.hud.setCenter(this.state === 'paused' ? t(STR.paused) : null);
    }
    if (this.state === 'paused') {
      this.hud.update(rawDt);
      return;
    }

    // hit-stop: the world holds its breath for a few frames when a blow lands
    let dt = rawDt;
    if (this.hitstop > 0) {
      this.hitstop -= rawDt;
      dt = 0;
    } else if (this.slowmo > 0) {
      this.slowmo -= rawDt;
      dt *= 0.3;
    }
    this.clock += dt;
    this.stateT += dt;

    switch (this.state) {
      case 'play':
        this.updatePlay(dt);
        break;
      case 'slide':
        this.updateSlide(dt);
        break;
      case 'rejected':
        this.updateRejected(dt);
        break;
      case 'dying':
        this.updateDying(dt);
        break;
      case 'ending':
        this.updateEnding(dt);
        break;
      case 'talk':
        this.updateTalk(dt);
        break;
      case 'door':
        this.updateDoor(dt);
        break;
      case 'waking':
        this.updateWaking(dt);
        break;
    }

    this.fx.update(dt);
    this.updateAtmosphere(dt, rawDt);
    this.hud.update(rawDt);
    this.render();
  }

  private updatePlay(dt: number): void {
    if (dt <= 0) return;
    const { player, room, level } = this;
    this.timeInRoom += dt;
    this.shiftCd = Math.max(0, this.shiftCd - dt);
    this.rejectHintT = Math.max(0, this.rejectHintT - dt);
    this.noStoneHintT = Math.max(0, this.noStoneHintT - dt);
    this.heartHintT = Math.max(0, this.heartHintT - dt);
    this.stoneHintT = Math.max(0, this.stoneHintT - dt);
    this.soulsHintT = Math.max(0, this.soulsHintT - dt);

    if (this.shiftCd <= 0 && input.consume('shift', TUNE.shift.buffer)) {
      this.tryShift();
      if (this.state !== 'play') return;
    }

    // next to someone who has something to say, the strike key starts the conversation instead
    const talker = this.talkerNear();
    if (talker && input.consume('attack', TUNE.inputBuffer)) {
      this.startTalk(talker);
      return;
    }

    // the nearest foe on this side: a blow with no direction held turns to it
    let nearest: Enemy | null = null;
    let nd = Infinity;
    for (const e of room.enemies) {
      if (!e.solid || e.home !== this.world) continue;
      const d = Math.hypot(e.x - player.x, e.y - player.y);
      if (d < nd) {
        nd = d;
        nearest = e;
      }
    }
    player.target = nearest ? { x: nearest.x, y: nearest.y } : null;

    if (player.update(dt, level, this.world, true)) this.hasAttacked = true;
    this.playerEvents();
    if (input.moveX !== 0 || input.moveY !== 0) this.hasMoved = true;
    if (player.guarding) this.hasGuarded = true;
    if (player.rolling) this.hasDodged = true;
    if (player.comboIndex === 2) this.hasComboed = true;
    if (player.attackActive) this.resolveAttack();
    if (room.lockPending) this.tryLock();
    if (!this.cleared.has(room.def.id) && room.enemies.length === 0 && room.wave <= room.def.waves.length) {
      room.waveT += dt;
      if (room.waveT > 0.9) this.spawnWave(room);
    }

    // only a few come at him at once; the others wait their turn at a distance
    let attackers = room.enemies.filter((e) => e.home === this.world && !e.ranged && e.threatening).length;
    for (const e of [...room.enemies]) {
      if (!e.ranged) e.allowAttack = e.threatening || attackers < MAX_ATTACKERS;
      const was = e.threatening;
      e.update(dt, level, this.world, player.x, player.y, !player.dead);
      if (!was && e.threatening && !e.ranged && e.home === this.world) attackers++;
      for (const ev of e.events.splice(0)) this.enemyEvent(e, ev);
      if (!e.solid || e.home !== this.world) continue;
      // only a strike hurts: its reach against his body
      const atk = e.attackBox;
      if (!atk || !overlap(atk, player.hurtBox)) continue;
      if (player.blocks(e.x, e.y)) this.blocked(e.x, e.y - 5, () => e.bash(player.x, player.y, player.perfect));
      else if (this.hurtPlayer(e.x, e.y, TUNE.player.enemyDamage)) {
        e.recoil(player.x, player.y);
        if (player.dead) return;
      }
    }
    this.separate();
    this.updateShots(dt);
    if (this.state !== 'play') return;
    this.updateBoss(dt);
    if (this.state !== 'play') return;
    this.settlePosts();
    for (const p of room.props) p.update(dt, player.x, player.y);
    for (const c of room.critters) {
      c.update(dt, level, this.world, player.x, player.y);
      if (c.startled) audio.sfx('cluck');
    }
    this.updatePickups(dt);

    // inscriptions read themselves when you stand next to them, in the words of the world you are in
    let near: Prop | null = null;
    for (const p of room.props)
      if (p.kind === 'sign' && Math.abs(p.x - player.x) < 21 && Math.abs(p.y - player.y) < 21) near = p;
    const text = near?.text?.[this.world];
    this.hud.setDialog(text ? t(text) : null);

    // a doorway: in he goes
    const dtx = Math.floor((player.x - room.ox) / TILE);
    const dty = Math.floor((player.y - room.oy) / TILE);
    const door = room.doors.find((d) => d.tx === dtx && d.ty === dty);
    if (!door) this.offDoor = true;
    else if (this.offDoor) {
      this.enterDoor(door.to);
      return;
    }

    // left the room?
    const next = level.dungeon.roomAtTile(Math.floor(player.x / TILE), Math.floor(player.y / TILE));
    if (next && next !== room.def) {
      this.startSlide(next);
      return;
    }

    this.updateHints();
    const cam = this.cameraTarget(room, player.x, player.y);
    this.camX = cam.x;
    this.camY = cam.y;
  }

  private updatePickups(dt: number): void {
    const { player, room } = this;
    for (let i = room.pickups.length - 1; i >= 0; i--) {
      const p = room.pickups[i];
      p.t += dt;
      const hop = p.t < 0.35 ? -Math.sin((p.t / 0.35) * Math.PI) * 8 : Math.round(Math.sin(p.t * 5) * 1.2);
      p.sprite.setY(Math.round(p.y + 8 + hop));
      const wants = player.hp < TUNE.player.maxHp;
      if (p.t > 0.3 && wants && Math.hypot(p.x - player.x, p.y - player.y) < 11) {
        player.heal(2);
        this.hud.setHearts(player.hp);
        audio.sfx('pickup');
        this.fx.pickup(p.x, p.y - 4);
        if (p.key) this.taken.add(p.key);
        p.sprite.destroy();
        room.pickups.splice(i, 1);
      }
    }
  }

  private updateHints(): void {
    const pad = input.device === 'gamepad';
    const threat = this.room.enemies.some((e) => e.home === this.world);
    let hint: string | null = null;
    const gear = this.player.gear;
    if (this.rejectHintT > 0) hint = t(STR.hintRejected);
    else if (this.noStoneHintT > 0) hint = t(STR.hintNoStone);
    else if (!this.hasMoved && this.timeInRoom > 1) hint = t(pad ? STR.hintMovePad : STR.hintMove);
    else if (this.talkerNear()) hint = t(pad ? STR.hintTalkPad : STR.hintTalk);
    else if (gear.stone && !this.hasShifted && this.timeInRoom > 1.5 && this.room.place !== 'house') hint = t(pad ? STR.hintShiftPad : STR.hintShift);
    else if (gear.sword && !this.hasAttacked && threat) hint = t(pad ? STR.hintAttackPad : STR.hintAttack);
    else if (gear.shield && !this.hasGuarded && threat) hint = t(pad ? STR.hintShieldPad : STR.hintShield);
    else if (gear.sword && this.hasAttacked && !this.hasComboed && threat) hint = t(pad ? STR.hintComboPad : STR.hintCombo);
    else if (gear.sword && this.hasAttacked && this.hasGuarded && !this.hasDodged && threat) hint = t(pad ? STR.hintDodgePad : STR.hintDodge);
    else if (this.heartHintT > 0 && this.world === 'jawia' && this.room.boss?.heartBare) hint = t(STR.hintHeart);
    else if (this.stoneHintT > 0 && this.room.boss) hint = t(STR.hintStone);
    else if (this.soulsHintT > 0) hint = t(STR.hintTwoSouls);
    else if (!this.hasReflected && this.room.enemies.some((e) => e.kind === 'ognik' && e.home === this.world)) hint = t(pad ? STR.hintReflectPad : STR.hintReflect);
    else if (this.room.props.some((p) => (p.kind === 'bell' || p.kind === 'greatbell') && Math.hypot(p.x - this.player.x, p.y - this.player.y) < 44)) hint = t(STR.hintBell);
    this.hud.setHint(hint);
  }

  // ------------------------------------------------------------------ the shift

  private tryShift(): void {
    const { player, level, room } = this;
    if (!player.gear.stone) {
      // nothing to turn yet: say so, once in a while
      if (this.timeInRoom > 0.5) this.noStoneHintT = 2.5;
      return;
    }
    const to = otherWorld(this.world);
    const b = player.box;
    const spot = level.findFree(to, b.x, b.y, b.hw, b.hh, TUNE.shift.nudge);
    if (!spot) {
      this.reject(to);
      return;
    }

    // The switch is immediate: collision, enemies and controls already belong to the other world this frame.
    player.x = spot.x;
    player.y = spot.y;
    this.world = to;
    this.hasShifted = true;
    this.shiftCd = TUNE.shift.cooldown;

    // ...and this is what sells it.
    this.reveal(room, to, player.x, player.y - 6);
    player.flash = 0.07;
    this.applyWorldDressing(to, true);
    this.fx.shiftBurst(player.x, player.y - 6, to);
    this.hud.flash(ACCENT[to], 0.2, 180);
    this.kick = 3;
    audio.sfx(to === 'nawia' ? 'shiftNawia' : 'shiftJawia');
    // for a moment he still remembers what stood where on the side he just left
    this.echoT = TUNE.shift.afterimage;
  }

  /** Everything that follows the current world but is not the room picture itself. */
  private applyWorldDressing(world: World, announce: boolean): void {
    const { room } = this;
    this.player.smear.setTint(SMEAR_TINT[world]);
    this.fx.setAmbience(world, room.ox, room.oy, room.w, room.h, room.outdoors, room.def.blight);
    this.hud.setWorld(world, announce);
    audio.setWorld(world);
  }

  /**
   * He turned the stone where something stands on the other side.
   * The border does not let him through: it takes half a heart and throws him back
   * to where he entered the room. Learn the room, then turn the stone.
   */
  private reject(to: World): void {
    const { player, level } = this;
    const b = player.box;
    audio.sfx('reject');
    this.hud.rattle();
    this.hud.flash(0xc9323e, 0.3, 320);
    this.trauma = Math.max(this.trauma, 0.7);
    this.hitstop = 0.12;
    this.shiftCd = 0.3;
    this.rejectHintT = 4;
    this.hud.setDialog(null);

    // show exactly what was in the way
    for (const [tx, ty] of level.blockingTiles(to, b.x, b.y, b.hw, b.hh)) {
      const mark = this.add
        .rectangle(tx * TILE + 1, ty * TILE + 1, TILE - 2, TILE - 2, ACCENT[to], 0.35)
        .setOrigin(0, 0)
        .setStrokeStyle(1, ACCENT[to], 1)
        .setDepth(DEPTH.fog + 3);
      this.tweens.add({ targets: mark, alpha: 0, duration: 900, ease: 'Quad.easeIn', onComplete: () => mark.destroy() });
    }
    this.fx.reject(player.x, player.y - 6, to);

    player.halt();
    player.drain(TUNE.shift.rejectDamage);
    this.hud.setHearts(player.hp);
    if (player.dead) {
      this.startDying();
      return;
    }
    this.state = 'rejected';
    this.stateT = 0;
  }

  private updateRejected(dt: number): void {
    const { player, room } = this;
    player.fade = Math.max(0, 1 - this.stateT / (TUNE.shift.rejectTime * 0.8));
    player.sync();
    for (const p of room.props) p.update(dt, player.x, player.y);
    if (this.stateT < TUNE.shift.rejectTime) return;

    // back to the doorway he came in through, in the world he came in with
    player.x = this.entry.x;
    player.y = this.entry.y;
    player.facing = this.entry.facing;
    player.vx = 0;
    player.vy = 0;
    player.kx = 0;
    player.ky = 0;
    player.fade = 1;
    player.invuln = 1.2;
    if (this.world !== this.entry.world) {
      this.world = this.entry.world;
      this.reveal(room, this.world, player.x, player.y - 6);
      this.applyWorldDressing(this.world, false);
    }
    this.echoT = 0;
    this.fx.shiftBurst(player.x, player.y - 6, this.world);
    const cam = this.cameraTarget(room, player.x, player.y);
    if (Math.abs(cam.x - this.camX) > 8 || Math.abs(cam.y - this.camY) > 8) this.hud.flash(0x05050b, 0.9, 350);
    this.camX = cam.x;
    this.camY = cam.y;
    this.state = 'play';
    player.sync();
    input.flush();
  }

  // ------------------------------------------------------------------ combat

  /** The hero takes a blow. Returns false if he shrugged it off (still blinking from the last one). */
  private hurtPlayer(fromX: number, fromY: number, amount: number): boolean {
    const { player } = this;
    if (!player.hurt(fromX, fromY, amount)) return false;
    audio.sfx('hurt');
    this.hud.setHearts(player.hp);
    this.hud.hurt();
    this.hud.flash(0xc9323e, 0.34, 260);
    this.trauma = Math.max(this.trauma, 0.7);
    this.hitstop = Math.max(this.hitstop, 0.12);
    const ang = Math.atan2(player.y - fromY, player.x - fromX);
    this.punch(Math.cos(ang), Math.sin(ang), 3);
    this.fx.strike(player.x - Math.cos(ang) * 3, player.y - 7, ang, this.world, HERO_BLOOD, false);
    if (player.dead) this.startDying();
    return true;
  }

  /** A blow caught on the shield: sparks, a shove, and whatever it does to the attacker (`onAttacker`). */
  private blocked(fromX: number, fromY: number, onAttacker: () => void): void {
    const { player } = this;
    const perfect = player.perfect;
    onAttacker();
    player.absorb(fromX, fromY, perfect ? 40 : 85);
    audio.sfx(perfect ? 'parry' : 'block');
    const ang = Math.atan2(player.y - 5 - fromY, player.x - fromX);
    const [fx, fy] = DIR_VEC[player.facing];
    this.fx.block(player.x + fx * 7, player.y - 6 + fy * 6);
    if (perfect) {
      this.fx.strike(player.x + fx * 7, player.y - 6 + fy * 6, ang + Math.PI, this.world, [0xffffff, 0xffe8a0], true);
      this.hud.flash(0xffffff, 0.14, 160);
    }
    this.trauma = Math.max(this.trauma, perfect ? 0.45 : 0.3);
    this.hitstop = Math.max(this.hitstop, perfect ? 0.1 : 0.05);
  }

  /** What he did this frame, dressed up: the swish of each blow, dust under a roll and under his feet. */
  private playerEvents(): void {
    const { player } = this;
    const dust = this.world === 'nawia' ? 0x5a78b0 : this.room.outdoors ? 0xb8a47e : 0x8a8478;
    for (const ev of player.events.splice(0)) {
      if (ev === 'swing') audio.sfx(player.comboIndex === 2 ? 'swingHeavy' : player.comboIndex === 1 ? 'swing2' : 'swing');
      else if (ev === 'roll') {
        audio.sfx('roll');
        this.fx.dust(player.x, player.y + 3, 7, dust);
      } else if (ev === 'land') this.fx.dust(player.x, player.y + 3, 5, dust, 0.8);
      else if (ev === 'step' && Math.random() < 0.35) this.fx.dust(player.x, player.y + 4, 1, dust, 0.4);
    }
  }

  /** What an enemy did this frame, dressed up: the glint of a coming strike, a boar meeting a wall. */
  private enemyEvent(e: Enemy, ev: EnemyEvent): void {
    const here = e.home === this.world;
    if (ev === 'windup' && here) {
      this.fx.glint(e.headX, e.headY, e.ranged ? 0xa8ff80 : 0xffa050);
      audio.sfx('warn');
    } else if (ev === 'bump') {
      // the boar met something harder than itself
      audio.sfx('crash');
      this.fx.debris(e.x, e.y + 4, undefined, 6);
      if (here) this.trauma = Math.max(this.trauma, 0.45);
    }
  }

  /** Bodies do not pile up: monsters on the same side push each other apart, and step aside for him. */
  private separate(): void {
    const { room, player, level } = this;
    const es = room.enemies;
    for (let i = 0; i < es.length; i++) {
      const a = es[i];
      if (!a.solid) continue;
      if (a.home === this.world && a.movable && overlap(a.box, player.box)) {
        const d = Math.hypot(a.x - player.x, a.y - player.y) || 1;
        a.nudge(level, ((a.x - player.x) / d) * 1.2, ((a.y - player.y) / d) * 1.2);
      }
      for (let j = i + 1; j < es.length; j++) {
        const b = es[j];
        if (!b.solid || b.home !== a.home || !overlap(a.box, b.box)) continue;
        const dx = b.x - a.x || Math.random() - 0.5;
        const dy = b.y - a.y || Math.random() - 0.5;
        const d = Math.hypot(dx, dy) || 1;
        const k = 0.9;
        if (a.movable) a.nudge(level, (-dx / d) * k, (-dy / d) * k);
        if (b.movable) b.nudge(level, (dx / d) * k, (dy / d) * k);
      }
    }
  }

  /** The whole picture jolts `px` pixels in direction (dx, dy), and settles at once. */
  private punch(dx: number, dy: number, px: number): void {
    this.punchX = dx * px;
    this.punchY = dy * px;
  }

  /** Hurts an enemy with swing (or shot) `id`. Returns true if the blow landed. */
  private strike(e: Enemy, id: number, fromX: number, fromY: number, spec: StrikeSpec = SHOT_STRIKE): boolean {
    const { room, player } = this;
    const was = e.home;
    const body = e.hurtBox;
    if (!e.hit(id, fromX, fromY, spec.damage, spec.knock, spec.heavy)) return false;
    const ang = Math.atan2(body.y - (fromY - 5), body.x - fromX);
    // where it lands: the side of the body that faced the blow
    const cx = body.x - Math.cos(ang) * body.hw * 0.5;
    const cy = body.y - Math.sin(ang) * body.hh * 0.5;
    this.fx.strike(cx, cy, ang, was, bloodOf(e.kind, was), spec.heavy);
    audio.sfx(spec.heavy ? 'hitHeavy' : 'hit');
    this.hitstop = Math.max(this.hitstop, spec.hitstop);
    this.trauma = Math.max(this.trauma, spec.trauma);
    this.punch(Math.cos(ang), Math.sin(ang), spec.heavy ? 3 : 1.5);
    if (e.rose) {
      // a strzyga's body is down; her second soul is already up on the other side
      e.rose = false;
      audio.sfx('rise');
      this.fx.disintegrate(e.sprite, was, fromX, fromY);
      this.soulsHintT = 6;
    } else if (e.dead) {
      audio.sfx('kill');
      this.fx.disintegrate(e.sprite, was, fromX, fromY);
      this.hitstop = Math.max(this.hitstop, 0.1);
      this.trauma = Math.max(this.trauma, 0.5);
      // a wounded hero now and then finds a heart in what is left
      if (player.hp < TUNE.player.maxHp && Math.random() < HEART_DROP) this.dropHeart(room, e.x, e.y);
      e.destroy();
      room.enemies.splice(room.enemies.indexOf(e), 1);
      const settled = this.cleared.has(room.def.id);
      this.checkCleared();
      // the last blow of a fight: the world holds still a moment longer
      if (!settled && this.cleared.has(room.def.id)) this.slowmo = 0.55;
    }
    return true;
  }

  private resolveAttack(): void {
    const { player, room } = this;
    const a = player.attackBox();
    let landed = false;

    for (let i = room.enemies.length - 1; i >= 0; i--) {
      const e = room.enemies[i];
      if (e.home !== this.world || !overlap(a, e.hurtBox)) continue;
      if (this.strike(e, player.swingId, player.x, player.y, player.strike)) landed = true;
    }
    // nobody gets to hit a hen, but she does not know that
    if (this.world === 'jawia') for (const c of room.critters) if (overlap(a, c.box)) c.scare(player.x, player.y);

    // a blade stops fire as well as a shield does; it just does not send it back
    for (const sh of room.shots) if (!sh.friendly && sh.home === this.world && overlap(a, sh.box)) sh.dead = true;

    const boss = room.boss;
    if (boss?.alive && this.clinkSwing !== player.swingId) {
      if (this.world === 'nawia' && overlap(a, boss.heartBox)) {
        if (boss.hitHeart(player.swingId)) {
          landed = true;
          audio.sfx('hit');
          this.fx.hit(boss.x, boss.y - 7, 'nawia');
          this.hitstop = 0.08;
          this.trauma = Math.max(this.trauma, 0.5);
        } else if (!boss.heartBare) {
          // the shell holds
          this.clinkSwing = player.swingId;
          audio.sfx('clink');
          this.fx.clink(a.x, a.y);
          this.stoneHintT = 5;
        }
      } else if (this.world === 'jawia' && overlap(a, boss.box)) {
        // steel does nothing to the stone
        this.clinkSwing = player.swingId;
        audio.sfx('clink');
        this.fx.clink(a.x, a.y);
        this.trauma = Math.max(this.trauma, 0.15);
        if (!boss.heartBare) this.stoneHintT = 5;
      }
    }

    for (const p of room.props) {
      if (p.kind === 'urn' && !p.open && overlap(a, { x: p.x, y: p.y, hw: 7, hh: 7 })) {
        landed = true;
        this.smashUrn(p);
      }
      if (p.kind === 'switch' && this.switchSwing !== player.swingId && overlap(a, { x: p.x, y: p.y, hw: 7, hh: 8 })) {
        this.switchSwing = player.swingId;
        landed = true;
        this.turnStone();
      }
      if ((p.kind !== 'bell' && p.kind !== 'greatbell') || this.bellSwing === player.swingId) continue;
      if (!overlap(a, { x: p.x, y: p.y, hw: p.kind === 'greatbell' ? 14 : 8, hh: 8 })) continue;
      this.bellSwing = player.swingId;
      this.clinkSwing = player.swingId;
      if (p.kind === 'greatbell') {
        this.ringGreatBell(p);
        return;
      }
      this.ringBell(p);
      landed = true;
    }

    // steel on stone
    if (!landed && this.clinkSwing !== player.swingId && this.level.blocked(this.world, a.x, a.y, a.hw * 0.55, a.hh * 0.55, BLOCK_FLY)) {
      this.clinkSwing = player.swingId;
      audio.sfx('clink');
      this.fx.clink(a.x, a.y);
      this.trauma = Math.max(this.trauma, 0.15);
    }
    if (landed) this.clinkSwing = player.swingId;
  }

  /** Fire and soul orbs in flight. A raised shield stops them; a wisp's own fire goes back to the wisp. */
  private updateShots(dt: number): void {
    const { player, room, level } = this;
    for (let i = room.shots.length - 1; i >= 0; i--) {
      const sh = room.shots[i];
      sh.update(dt, level, this.world);
      const fromX = sh.x - sh.vx;
      const fromY = sh.y - sh.vy;
      if (!sh.dead && sh.friendly) {
        for (const e of room.enemies)
          if (e.home === sh.home && overlap(sh.box, e.box) && this.strike(e, -sh.id, fromX, fromY)) {
            sh.dead = true;
            break;
          }
      } else if (!sh.dead && sh.home === this.world && overlap(sh.box, player.hurtBox)) {
        if (player.blocks(fromX, fromY)) {
          this.blocked(fromX, fromY, () => {
            if (sh.kind === 'wisp') {
              sh.reflect();
              this.hasReflected = true;
            } else sh.dead = true;
          });
        } else if (this.hurtPlayer(fromX, fromY, TUNE.player.shotDamage)) sh.dead = true;
      }
      if (sh.dead) {
        this.fx.clink(sh.x, sh.y);
        sh.destroy();
        room.shots.splice(i, 1);
      }
      if (this.state !== 'play') return;
    }
  }

  /** The guardian: drive it, dress up what it did, and let the stone hurt. */
  private updateBoss(dt: number): void {
    const { player, room, level } = this;
    const boss = room.boss;
    if (!boss) return;
    boss.update(dt, level, this.world, player.x, player.y, !player.dead);
    for (const ev of boss.events.splice(0)) {
      switch (ev) {
        case 'wake':
          audio.sfx('roar');
          this.trauma = Math.max(this.trauma, 0.6);
          break;
        case 'windup':
          audio.sfx('roar');
          break;
        case 'charge':
          audio.sfx('door');
          break;
        case 'crash':
          audio.sfx('crash');
          this.trauma = 1;
          this.hitstop = 0.1;
          this.fx.debris(boss.x, boss.y + 4, undefined, 14);
          this.heartHintT = 8;
          break;
        case 'thud':
          audio.sfx('clink');
          this.trauma = Math.max(this.trauma, 0.3);
          break;
        case 'close':
          // the shell slams shut and throws back anyone standing at the heart
          audio.sfx('block');
          this.fx.shiftBurst(boss.x, boss.y - 6, 'nawia');
          if (this.world === 'nawia' && Math.hypot(player.x - boss.x, player.y - boss.y) < 40) player.shove(boss.x, boss.y - 2, 230);
          break;
        case 'orbs':
          audio.sfx('shoot');
          break;
        case 'dying':
          audio.sfx('enemyDie');
          audio.sfx('crash');
          this.trauma = 1;
          this.hitstop = 0.18;
          for (const sh of room.shots) sh.dead = true;
          break;
        case 'dead':
          this.fx.death(boss.x, boss.y - 6, 'nawia');
          this.fx.debris(boss.x, boss.y, undefined, 18);
          this.hud.flash(0xffffff, 0.6, 500);
          this.trauma = 1;
          boss.destroy();
          room.boss = null;
          room.pips.forEach((p) => p.destroy());
          room.pips = [];
          this.checkCleared();
          return;
      }
    }

    const awake = boss.state !== 'sleep';
    room.pips.forEach((p, i) => p.setVisible(awake).setTint(i < boss.hp ? 0xe08ae8 : 0x3a2f42));
    if (boss.state === 'dying' && Math.random() < dt * 16)
      this.fx.hit(boss.x + Math.random() * 24 - 12, boss.y - 8 + Math.random() * 18 - 9, Math.random() < 0.5 ? 'jawia' : 'nawia');

    // the stone is solid, and being run over by it hurts
    if (this.world === 'jawia' && boss.harmful && overlap(boss.box, player.box)) {
      if (boss.charging && player.blocks(boss.x, boss.y)) {
        // a shield does not stop a ton of stone, but it saves his skin
        player.shove(boss.x, boss.y, 260);
        player.invuln = Math.max(player.invuln, 0.4);
        audio.sfx('block');
        this.fx.block((boss.x + player.x) / 2, (boss.y + player.y) / 2 - 5);
        this.trauma = Math.max(this.trauma, 0.5);
        this.hitstop = 0.06;
      } else this.hurtPlayer(boss.x, boss.y, TUNE.boss.damage);
    } else if (this.world === 'jawia' && boss.standing && overlap(boss.box, player.box)) {
      // walking into the stone: it does not move, he does
      player.shove(boss.x, boss.y, 120);
    }
  }

  /** The turning stone was struck: sun posts and moon posts trade places. */
  private turnStone(): void {
    const { room } = this;
    room.moon = !room.moon;
    for (const p of room.props) if (p.kind === 'switch') p.setPhase(room.moon);
    audio.sfx('switch');
    this.hud.flash(room.moon ? ACCENT.nawia : ACCENT.jawia, 0.14, 200);
    this.trauma = Math.max(this.trauma, 0.3);
    this.hitstop = 0.04;
    this.settlePosts();
  }

  /** Posts that should be standing rise as soon as nobody is on top of them. */
  private settlePosts(): void {
    const { room, player } = this;
    for (const p of room.props) {
      if (p.kind !== 'post') continue;
      const up = p.moon === room.moon;
      if (up === !p.open) continue;
      const spot = { x: p.x, y: p.y, hw: 8, hh: 8 };
      if (up && (overlap(player.box, spot) || room.enemies.some((e) => overlap(e.box, spot)))) continue;
      p.setOpen(!up);
      this.level.setBlocked(room.def, p.tx, p.ty, up);
      if (up) this.fx.debris(p.x, p.y + 5, undefined, 3);
    }
  }

  private smashUrn(urn: Prop): void {
    const { room } = this;
    urn.setOpen(true);
    this.level.setBlocked(room.def, urn.tx, urn.ty, false);
    audio.sfx('smash');
    this.fx.debris(urn.x, urn.y - 2, this.world === 'jawia' ? 0xc07a48 : 0x9ab6f4, 9);
    this.trauma = Math.max(this.trauma, 0.25);
    this.hitstop = 0.03;
    if (urn.holdsHeart) this.dropHeart(room, urn.x, urn.y);
  }

  /**
   * A room is settled when its bell has rung or, if it has no bell, when nothing is left standing
   * in either world. Then its gates open, and stay open.
   */
  private checkCleared(): void {
    const { room } = this;
    if (this.cleared.has(room.def.id)) return;
    const hasBell = room.props.some((p) => p.kind === 'bell');
    if (hasBell ? !room.bellRung : room.enemies.length > 0 || room.boss !== null || room.wave <= room.def.waves.length) return;
    this.cleared.add(room.def.id);
    for (const p of room.props) {
      if (p.kind !== 'gate') continue;
      p.setOpen(true);
      this.level.setBlocked(room.def, p.tx, p.ty, false);
      this.fx.debris(p.x, p.y);
      audio.sfx('gate');
      this.trauma = Math.max(this.trauma, 0.5);
    }
  }

  // ------------------------------------------------------------------ talking

  /** A villager (or an inscription with a conversation behind it) within arm's reach, with something to say in this world. */
  private talkerNear(): Prop | null {
    const { player, room } = this;
    for (const p of room.props) {
      if (p.kind !== 'npc' && p.kind !== 'sign') continue;
      if (Math.abs(p.x - player.x) >= 21 || Math.abs(p.y - player.y) >= 21) continue;
      const id = p.talk?.[this.world];
      if (id ? this.dialogs.has(id) : p.kind === 'npc' && p.text?.[this.world]) return p;
    }
    return null;
  }

  private startTalk(p: Prop): void {
    const { player } = this;
    const id = p.talk?.[this.world];
    const text = p.text?.[this.world];
    if (id && this.dialogs.has(id)) this.talk = new Talk(this.dialogs, this.flags, id);
    else if (text) {
      // a villager with a single line in the room file: the same machinery, one node long
      const who = p.lookName ? STR.npcName[p.lookName as keyof typeof STR.npcName] : null;
      this.talk = new Talk(new Map([['_', [{ op: 'say', who, text }]]]), this.flags, '_');
    } else return;
    if (this.talk.done) {
      this.talk = null;
      return;
    }
    this.state = 'talk';
    this.stateT = 0;
    this.talkCursor = 0;
    this.talkLatch = 0;
    // turn to whoever he is talking to
    const dx = p.x - player.x;
    const dy = p.y - player.y;
    player.facing = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down';
    player.vx = 0;
    player.vy = 0;
    player.halt();
    this.hud.setHint(null);
    this.showTalk();
  }

  private showTalk(): void {
    const tk = this.talk;
    if (!tk) return;
    this.hud.setTalk({
      name: tk.line?.who ? t(tk.line.who) : null,
      text: tk.line ? t(tk.line.text) : '',
      choices: tk.choices ? tk.choices.map((c) => t(c.text)) : null,
      cursor: this.talkCursor,
    });
  }

  private updateTalk(dt: number): void {
    const { player, room } = this;
    const tk = this.talk;
    player.update(dt, this.level, this.world, false);
    for (const p of room.props) p.update(dt, player.x, player.y);
    for (const c of room.critters) c.update(dt, this.level, this.world, player.x, player.y);
    if (!tk) {
      this.state = 'play';
      return;
    }
    // up and down move between the answers
    const dir = input.moveY > 0.5 ? 1 : input.moveY < -0.5 ? -1 : 0;
    if (dir !== 0 && this.talkLatch === 0 && tk.choices && !this.hud.typing) {
      const n = Math.min(4, tk.choices.length);
      this.talkCursor = (this.talkCursor + dir + n) % n;
      audio.sfx('text');
      this.showTalk();
    }
    this.talkLatch = dir;

    if (!(input.consume('attack', 0.1) || input.consume('shift', 0.1))) return;
    if (this.hud.typing) {
      this.hud.finishTyping();
      return;
    }
    if (tk.choices) {
      tk.choose(this.talkCursor);
      this.talkCursor = 0;
    } else tk.next();
    if (tk.done) {
      this.talk = null;
      this.hud.setTalk(null);
      this.state = 'play';
      this.applyGear();
      this.shiftCd = 0.25;
      input.flush();
    } else this.showTalk();
  }

  // ------------------------------------------------------------------ doors, waking

  /** Through a doorway into room `to`: the screen goes dark, and he is standing by the door that leads back. */
  private enterDoor(to: string): void {
    const target = this.level.dungeon.doorTarget(this.room.def, to);
    if (!target) return;
    this.doorTo = target;
    this.state = 'door';
    this.stateT = 0;
    this.player.halt();
    this.hud.setDialog(null);
    this.hud.setHint(null);
    audio.sfx('door');
  }

  private updateDoor(dt: number): void {
    const { player } = this;
    const DARK = 0.2;
    if (this.doorTo && this.stateT < DARK) {
      this.veil.setAlpha(this.stateT / DARK);
      player.update(dt, this.level, this.world, false);
      return;
    }
    if (this.doorTo) {
      const { room: def, tx, ty } = this.doorTo;
      this.doorTo = null;
      this.veil.setAlpha(1);
      this.destroyRoom(this.room);
      this.room = this.buildRoom(def);
      const room = this.room;
      // step clear of the doorway: below it outside a house, above it inside
      let x = room.ox + tx * TILE + 8;
      let y = room.oy + ty * TILE + 8;
      let facing: Dir = 'down';
      for (const [dx, dy, f] of [[0, 1, 'down'], [0, -1, 'up'], [-1, 0, 'left'], [1, 0, 'right']] as const) {
        const nx = room.ox + (tx + dx) * TILE + 8;
        const ny = room.oy + (ty + dy) * TILE + 8;
        if (this.level.blocked(this.world, nx, ny, 5, 4)) continue;
        x = nx;
        y = ny;
        facing = f;
        break;
      }
      player.x = x;
      player.y = y;
      player.facing = facing;
      player.vx = 0;
      player.vy = 0;
      player.kx = 0;
      player.ky = 0;
      this.offDoor = false;
      this.entry = { x, y, world: this.world, facing };
      const cam = this.cameraTarget(room, x, y);
      this.camX = cam.x;
      this.camY = cam.y;
      this.echoT = 0;
      this.onEnterRoom();
      player.sync();
    }
    const k = (this.stateT - DARK) / 0.3;
    this.veil.setAlpha(Math.max(0, 1 - k));
    if (k >= 1) {
      this.state = 'play';
      input.flush();
    }
  }

  /** The first seconds of the game: eyelids. */
  private updateWaking(dt: number): void {
    const { player, room } = this;
    player.update(dt, this.level, this.world, false);
    for (const p of room.props) p.update(dt, player.x, player.y);
    const s = this.stateT;
    // shut, a first look, shut again, then open for good
    const ease = (v: number): number => v * v * (3 - 2 * v);
    let open: number;
    if (s < 0.8) open = 0;
    else if (s < 1.5) open = ease((s - 0.8) / 0.7) * 0.34;
    else if (s < 1.9) open = 0.34 * (1 - ease((s - 1.5) / 0.4));
    else if (s < 2.2) open = 0;
    else open = ease(Math.min(1, (s - 2.2) / 1.1));
    const half = GAME_H / 2 + 2;
    this.lids[0].setY(Math.round(-open * half));
    this.lids[1].setY(Math.round(GAME_H / 2 - 2 + open * half));
    if (s >= 3.3) {
      this.lids.forEach((l) => l.setVisible(false));
      this.state = 'play';
      this.timeInRoom = 0;
      input.flush();
    }
  }

  // ------------------------------------------------------------------ room to room

  private startSlide(next: RoomDef): void {
    const { player } = this;
    const old = this.room;
    this.state = 'slide';
    this.leaving = old;
    this.room = this.buildRoom(next);
    const room = this.room;

    let dir: Dir = 'right';
    if (player.x >= old.ox + old.w) dir = 'right';
    else if (player.x < old.ox) dir = 'left';
    else if (player.y >= old.oy + old.h) dir = 'down';
    else dir = 'up';

    const inset = 13;
    let tx = player.x;
    let ty = player.y;
    if (dir === 'right') tx = room.ox + inset;
    else if (dir === 'left') tx = room.ox + room.w - inset;
    else if (dir === 'down') ty = room.oy + inset;
    else ty = room.oy + room.h - inset;

    const cam = this.cameraTarget(room, tx, ty);
    this.slide = { t: 0, fromX: this.camX, fromY: this.camY, toX: cam.x, toY: cam.y, pFromX: player.x, pFromY: player.y, pToX: tx, pToY: ty };
    player.facing = dir;
    player.halt();
    old.echo.jawia.setAlpha(0);
    old.echo.nawia.setAlpha(0);
    this.echoT = 0;
    this.hud.setDialog(null);
    this.hud.setHint(null);
    audio.sfx('door');
  }

  private updateSlide(dt: number): void {
    const s = this.slide;
    const { player } = this;
    s.t = Math.min(1, s.t + dt / TUNE.camera.slideTime);
    const e = s.t * s.t * (3 - 2 * s.t);
    this.camX = Math.round(lerp(s.fromX, s.toX, e));
    this.camY = Math.round(lerp(s.fromY, s.toY, e));
    player.drive(lerp(s.pFromX, s.pToX, s.t), lerp(s.pFromY, s.pToY, s.t));
    for (const p of this.room.props) p.update(dt, player.x, player.y);
    if (this.leaving) for (const p of this.leaving.props) p.update(dt, player.x, player.y);

    if (s.t >= 1) {
      if (this.leaving) this.destroyRoom(this.leaving);
      this.leaving = null;
      this.state = 'play';
      this.entry = { x: player.x, y: player.y, world: this.world, facing: player.facing };
      this.onEnterRoom();
      input.flush();
    }
  }

  // ------------------------------------------------------------------ death, ending

  private startDying(): void {
    this.state = 'dying';
    this.stateT = 0;
    this.slowmo = 0.7;
    this.hitstop = Math.max(this.hitstop, 0.2);
    audio.sfx('die');
    this.hud.setDialog(null);
    this.hud.setHint(null);
  }

  private updateDying(dt: number): void {
    const { player } = this;
    player.update(dt, this.level, this.world, false);
    // he falls; only once he lies still does he fade
    player.sprite.setAlpha(Math.max(0, 1 - Math.max(0, this.stateT - 1.4) / 0.6));
    for (const p of this.room.props) p.update(dt, player.x, player.y);
    if (this.stateT > 0.7) this.hud.setCenter(t(STR.dead));
    if (this.stateT > 2.4) {
      // back to where he entered the room; the room resets, the dungeon does not
      this.hud.setCenter(null);
      const def = this.room.def;
      this.destroyRoom(this.room);
      this.world = this.entry.world;
      player.x = this.entry.x;
      player.y = this.entry.y;
      player.facing = this.entry.facing;
      player.hp = TUNE.player.maxHp;
      player.revive(this.entry.facing);
      player.invuln = 1;
      player.fade = 1;
      player.kx = 0;
      player.ky = 0;
      this.room = this.buildRoom(def);
      this.applyWorldDressing(this.world, false);
      this.hud.setHearts(player.hp);
      this.hud.flash(0x000000, 1, 600);
      this.echoT = 0;
      this.rejectHintT = 0;
      const cam = this.cameraTarget(this.room, player.x, player.y);
      this.camX = cam.x;
      this.camY = cam.y;
      this.state = 'play';
      player.sync();
      input.flush();
    }
  }

  /** A lesser bell: the border shivers, and whatever its gates were holding back opens. */
  private ringBell(bell: Prop): void {
    const { room } = this;
    bell.ring();
    audio.sfx('bell');
    this.trauma = Math.max(this.trauma, 0.6);
    this.hitstop = 0.08;
    this.hud.flash(0xfff0c0, 0.4, 400);
    this.fx.hit(bell.x, bell.y - 6, 'jawia');
    this.fx.shiftBurst(bell.x, bell.y - 6, this.world);
    room.bellRung = true;
    this.checkCleared();
  }

  private ringGreatBell(bell: Prop): void {
    bell.ring();
    audio.sfx('greatbell');
    this.state = 'ending';
    this.stateT = 0;
    this.endStep = 0;
    this.trauma = 0.9;
    this.hitstop = 0.12;
    this.hud.setHint(null);
    this.hud.setDialog(null);
    this.hud.flash(0xfff0c0, 0.6, 500);
    this.fx.hit(bell.x, bell.y - 14, 'jawia');
  }

  /** The bell answers: the border trembles, both worlds wash over the room in rings from the bell. */
  private updateEnding(dt: number): void {
    const { player, room } = this;
    player.update(dt, this.level, this.world, false);
    for (const p of room.props) p.update(dt, player.x, player.y);
    for (const e of room.enemies) e.update(dt, this.level, this.world, player.x, player.y, false);
    const bell = room.props.find((p) => p.kind === 'greatbell');
    const beats = [0.15, 0.75, 1.35, 1.95];
    if (bell && this.endStep < beats.length && this.stateT >= beats[this.endStep]) {
      this.endStep++;
      this.world = otherWorld(this.world);
      this.reveal(room, this.world, bell.x, bell.y - 14);
      this.fx.shiftBurst(bell.x, bell.y - 14, this.world);
      this.hud.setWorld(this.world, false);
      audio.setWorld(this.world);
      this.kick = 3;
      if (this.endStep === beats.length) this.hud.fadeOut(0xf4efe4, 1500, () => this.scene.start('end'));
    }
  }

  // ------------------------------------------------------------------ atmosphere + drawing

  private updateAtmosphere(dt: number, rawDt: number): void {
    const { room, world } = this;

    // water, and the stars beyond the walls of Nawia
    this.animT += dt;
    if (this.animT >= WATER_FRAME_TIME) {
      this.animT -= WATER_FRAME_TIME;
      this.animFrame = (this.animFrame + 1) & 3;
      room.painter.animate(this.animFrame);
      room.view.touch();
      if (this.leaving) {
        this.leaving.painter.animate(this.animFrame);
        this.leaving.view.touch();
      }
    }
    room.view.update(dt);
    room.top?.update(dt);
    this.leaving?.view.update(dt);
    this.leaving?.top?.update(dt);

    // things change sides as the ring passes over them
    const r = room.view.radius;
    const cx = room.ox + room.view.centerX;
    const cy = room.oy + room.view.centerY;
    for (const p of room.props) if (Math.hypot(p.x - cx, p.y - cy) <= r) p.setWorld(world);
    for (const e of room.enemies) if (Math.hypot(e.x - cx, e.y - cy) <= r) e.setWorldVisual(world);
    if (room.boss && Math.hypot(room.boss.x - cx, room.boss.y - cy) <= r) room.boss.setWorldVisual(world);

    // the afterimage of the other side (off unless TUNE.shift.afterimage > 0)
    this.echoT = Math.max(0, this.echoT - dt);
    const k0 = TUNE.shift.afterimage > 0 ? this.echoT / TUNE.shift.afterimage : 0;
    const shimmer = 0.85 + 0.15 * Math.sin(this.clock * 18);
    room.echo[world].setAlpha(k0 * k0 * 0.95 * shimmer);
    room.echo[otherWorld(world)].setAlpha(0);

    // colours of the air ease towards the current world
    const k = 1 - Math.exp(-rawDt * 9);
    const dress = DRESS[room.place][world];
    // the deeper into the blight, the less of a bright morning is left
    const sick = room.place === 'surface' && world === 'jawia' ? room.def.blight / 3 : 0;
    for (let i = 0; i < 3; i++) {
      this.ambient[i] = lerp(this.ambient[i], lerp(dress.ambient[i], BLIGHT_AIR.ambient[i], sick), k);
      this.heroLight[i] = lerp(this.heroLight[i], dress.heroLight[i], k);
      this.fogTint[i] = lerp(this.fogTint[i], lerp(dress.fog[i], BLIGHT_AIR.fog[i], sick), k);
    }
    this.heroGlow = lerp(this.heroGlow, dress.heroGlow, k);
    this.fogAlpha = lerp(this.fogAlpha, lerp(dress.fogAlpha, BLIGHT_AIR.fogAlpha, sick), k);
    this.vignette = lerp(this.vignette, lerp(dress.vignette, BLIGHT_AIR.vignette, sick), k);

    this.trauma = Math.max(0, this.trauma - rawDt * 2.2);
    this.kick *= Math.exp(-rawDt * 22);
    this.punchX *= Math.exp(-rawDt * 30);
    this.punchY *= Math.exp(-rawDt * 30);
  }

  private render(): void {
    // screen shake: whole pixels only. `kick` is a single downward thump (the shift), trauma is a rattle (blows).
    const amp = this.trauma * this.trauma * 8;
    const sx = amp >= 0.5 ? Math.round((Math.random() * 2 - 1) * amp) : 0;
    const sy = amp >= 0.5 ? Math.round((Math.random() * 2 - 1) * amp) : 0;
    const scrollX = this.camX + sx + Math.round(this.punchX);
    const scrollY = this.camY + sy - Math.round(this.kick) + Math.round(this.punchY);
    this.cameras.main.setScroll(scrollX, scrollY);

    const lights: LightSource[] = [
      { x: this.player.x, y: this.player.y - 6, radius: 68, color: this.heroLight, intensity: this.player.dead ? 0.15 : this.heroGlow * this.player.fade, flicker: 0.25 },
    ];
    const onScreen = (l: LightSource): boolean =>
      l.x > scrollX - l.radius && l.x < scrollX + GAME_W + l.radius && l.y > scrollY - l.radius && l.y < scrollY + GAME_H + l.radius;
    for (const r of this.leaving ? [this.room, this.leaving] : [this.room])
      for (const p of r.props) {
        const l = p.light();
        if (l && onScreen(l)) lights.push(l);
      }
    for (const sh of this.room.shots)
      if (sh.home === this.world) lights.push({ x: sh.x, y: sh.y, radius: 26, color: sh.kind === 'wisp' ? [0.6, 1.0, 0.4] : [0.9, 0.55, 1.0], intensity: 0.5 });
    const bossLight = this.room.boss?.light(this.world);
    if (bossLight) lights.push(bossLight);
    this.lighting.ambient = this.ambient;
    this.lighting.vignetteK = this.vignette;
    this.lighting.render(scrollX, scrollY, lights, this.clock);

    const tint = rgbToHex(this.fogTint);
    this.fog[0].setTint(tint).setAlpha(this.fogAlpha);
    this.fog[1].setTint(tint).setAlpha(this.fogAlpha * 0.7);
    this.fog[0].setTilePosition(Math.round(scrollX + this.clock * 5), Math.round(scrollY + this.clock * 1.5));
    this.fog[1].setTilePosition(Math.round(scrollX - this.clock * 3 + 61), Math.round(scrollY + 37 - this.clock * 2.2));
  }
}
