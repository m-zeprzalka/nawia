// The game itself: one room on screen, two worlds laid over each other.

import Phaser from 'phaser';
import {
  DEPTH, GAME_H, GAME_W, TILE, TUNE, VIEW_PAD_Y, otherWorld, type World,
} from '../config.ts';
import { ART } from '../art/textures.ts';
import { audio } from '../audio/audio.ts';
import { globalKeys } from '../core/globalKeys.ts';
import { input, type Dir } from '../core/input.ts';
import { Enemy } from '../entities/Enemy.ts';
import { Player } from '../entities/Player.ts';
import { Prop } from '../entities/Prop.ts';
import { DualCanvas } from '../fx/DualCanvas.ts';
import { Fx } from '../fx/Fx.ts';
import { Lighting, type LightSource, type RGB } from '../fx/Lighting.ts';
import { STR, t } from '../i18n/strings.ts';
import { Hud } from '../ui/Hud.ts';
import { loadDungeon } from '../world/dungeonData.ts';
import { BLOCK_FLY, Level, overlap, roomOriginX, roomOriginY } from '../world/Level.ts';
import type { RoomDef } from '../world/roomFormat.ts';
import { RoomPainter } from '../world/roomPainter.ts';

type State = 'play' | 'slide' | 'dying' | 'ending' | 'paused';

interface ActiveRoom {
  def: RoomDef;
  ox: number;
  oy: number;
  w: number;
  h: number;
  painter: RoomPainter;
  view: DualCanvas;
  props: Prop[];
  enemies: Enemy[];
}

const ACCENT: Record<World, number> = { jawia: 0xffcf6a, nawia: 0x9af4ff };
const AMBIENT: Record<World, RGB> = { jawia: [0.4, 0.42, 0.58], nawia: [0.44, 0.5, 0.78] };
const HERO_LIGHT: Record<World, RGB> = { jawia: [0.95, 0.8, 0.6], nawia: [0.55, 0.85, 1.0] };
const FOG: Record<World, { tint: RGB; alpha: number }> = {
  jawia: { tint: [0.6, 0.72, 0.66], alpha: 0.16 },
  nawia: { tint: [0.62, 0.86, 1.0], alpha: 0.3 },
};
const WATER_FRAME_TIME = 0.22;

const lerp = (a: number, b: number, k: number): number => a + (b - a) * k;
const rgbToHex = (c: RGB): number => (Math.round(c[0] * 255) << 16) | (Math.round(c[1] * 255) << 8) | Math.round(c[2] * 255);

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
  private hitstop = 0;
  private shiftCd = 0;
  private animT = 0;
  private animFrame = 0;
  private slide = { t: 0, fromX: 0, fromY: 0, toX: 0, toY: 0, pFromX: 0, pFromY: 0, pToX: 0, pToY: 0 };
  private entry = { x: 0, y: 0, world: 'jawia' as World };
  private cleared = new Set<string>();
  private ambient: RGB = [...AMBIENT.jawia];
  private heroLight: RGB = [...HERO_LIGHT.jawia];
  private fogTint: RGB = [...FOG.jawia.tint];
  private fogAlpha = FOG.jawia.alpha;
  private hasShifted = false;
  private hasAttacked = false;
  private blockedHintT = 0;
  private timeInRoom = 0;
  private bellSwing = -1;
  private clinkSwing = -1;
  private endStep = 0;

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
    this.hitstop = 0;
    this.shiftCd = 0;
    this.leaving = null;
    this.cleared = new Set();
    this.hasShifted = false;
    this.hasAttacked = false;
    this.blockedHintT = 0;
    this.bellSwing = -1;
    this.clinkSwing = -1;
    this.endStep = 0;

    // dev shortcuts: ?room=bridge&world=nawia
    const params = new URLSearchParams(location.search);
    let start = dungeon.startRoom();
    const wanted = params.get('room');
    if (wanted && dungeon.has(wanted)) start = dungeon.get(wanted);
    if (params.get('world') === 'nawia') this.world = 'nawia';

    this.cameras.main.setBackgroundColor(0x07060b);
    const ox = roomOriginX(start);
    const oy = roomOriginY(start);
    const spawn = start.spawn && start === dungeon.startRoom() ? start.spawn : { tx: 2, ty: Math.floor(start.rows / 2) };
    const free = this.level.findFree(this.world, ox + spawn.tx * TILE + 8, oy + spawn.ty * TILE + 8, 5, 4, 64) ?? {
      x: ox + spawn.tx * TILE + 8,
      y: oy + spawn.ty * TILE + 8,
    };

    this.ambient = [...AMBIENT[this.world]];
    this.heroLight = [...HERO_LIGHT[this.world]];
    this.fogTint = [...FOG[this.world].tint];
    this.fogAlpha = FOG[this.world].alpha;

    this.player = new Player(this, free.x, free.y);
    this.player.slash.setTint(ACCENT[this.world]);
    this.lighting = new Lighting(this);
    this.fog = [0, 1].map((i) =>
      this.add.tileSprite(0, 0, GAME_W, GAME_H, 'fog').setOrigin(0, 0).setScrollFactor(0).setDepth(DEPTH.fog - i * 0.1),
    );
    this.fx = new Fx(this);
    this.hud = new Hud(this);
    this.hud.setHearts(this.player.hp);
    this.hud.setWorld(this.world, false);

    this.room = this.buildRoom(start);
    this.entry = { x: this.player.x, y: this.player.y, world: this.world };
    const cam = this.cameraTarget(this.room, this.player.x, this.player.y);
    this.camX = cam.x;
    this.camY = cam.y;
    this.onEnterRoom();

    audio.unlock();
    audio.startAmbience();
    audio.setWorld(this.world);
    this.hud.flash(0x000000, 1, 900);
    input.flush();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
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
    const painter = new RoomPainter(def, this.level.dungeon, ART.tilesets);
    const view = new DualCanvas(this, painter.buffers, this.world);
    view.image.setPosition(ox, oy).setDepth(DEPTH.room);

    const hasEnemies = def.objects.some((o) => o.kind === 'enemy');
    const cleared = this.cleared.has(def.id) || !hasEnemies;
    const props: Prop[] = [];
    const enemies: Enemy[] = [];
    for (const o of def.objects) {
      if (o.kind === 'enemy') {
        if (!cleared) enemies.push(new Enemy(this, o.type, ox + o.tx * TILE + 8, oy + o.ty * TILE + 8, this.world));
      } else {
        const p = new Prop(this, o, ox, oy, this.world);
        if (p.kind === 'gate') {
          p.setOpen(cleared);
          this.level.setBlocked(def, o.tx, o.ty, !cleared);
        }
        props.push(p);
      }
    }
    return { def, ox, oy, w: painter.w, h: painter.h, painter, view, props, enemies };
  }

  private destroyRoom(r: ActiveRoom): void {
    r.view.destroy();
    r.props.forEach((p) => p.destroy());
    r.enemies.forEach((e) => e.destroy());
  }

  private onEnterRoom(): void {
    this.timeInRoom = 0;
    this.hud.showRoomName(t(this.room.def.name));
    this.fx.setAmbience(this.world, this.room.ox, this.room.oy, this.room.w, this.room.h);
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
      case 'dying':
        this.updateDying(dt);
        break;
      case 'ending':
        this.updateEnding(dt);
        break;
    }

    this.updateAtmosphere(dt, rawDt);
    this.hud.update(rawDt);
    this.render();
  }

  private updatePlay(dt: number): void {
    if (dt <= 0) return;
    const { player, room, level } = this;
    this.timeInRoom += dt;
    this.shiftCd = Math.max(0, this.shiftCd - dt);
    this.blockedHintT = Math.max(0, this.blockedHintT - dt);

    if (this.shiftCd <= 0 && input.consume('shift', TUNE.shift.buffer)) this.tryShift();

    if (player.update(dt, level, this.world, true)) {
      audio.sfx('swing');
      this.hasAttacked = true;
    }
    if (player.attackActive) this.resolveAttack();

    for (const e of room.enemies) {
      e.update(dt, level, this.world, player.x, player.y, !player.dead);
      if (e.home === this.world && overlap(e.box, player.box) && player.hurt(e.x, e.y)) {
        e.recoil(player.x, player.y);
        audio.sfx('hurt');
        this.hud.setHearts(player.hp);
        this.hud.flash(0xc9323e, 0.4, 260);
        this.trauma = Math.max(this.trauma, 0.6);
        this.hitstop = 0.09;
        if (player.dead) {
          this.startDying();
          return;
        }
      }
    }
    for (const p of room.props) p.update(dt);

    // inscriptions read themselves when you stand next to them, in the words of the world you are in
    let near: Prop | null = null;
    for (const p of room.props)
      if (p.kind === 'sign' && Math.abs(p.x - player.x) < 21 && Math.abs(p.y - player.y) < 21) near = p;
    const text = near?.text?.[this.world];
    this.hud.setDialog(text ? t(text) : null);

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

  private updateHints(): void {
    const pad = input.device === 'gamepad';
    let hint: string | null = null;
    if (this.blockedHintT > 0) hint = t(STR.hintBlocked);
    else if (!this.hasShifted && this.timeInRoom > 1.5) hint = t(pad ? STR.hintShiftPad : STR.hintShift);
    else if (!this.hasAttacked && this.room.enemies.some((e) => e.home === this.world)) hint = t(pad ? STR.hintAttackPad : STR.hintAttack);
    else if (this.room.props.some((p) => p.kind === 'bell' && Math.hypot(p.x - this.player.x, p.y - this.player.y) < 44)) hint = t(STR.hintBell);
    this.hud.setHint(hint);
  }

  // ------------------------------------------------------------------ the shift

  private tryShift(): void {
    const { player, level, room } = this;
    const to = otherWorld(this.world);
    const b = player.box;
    const spot = level.findFree(to, b.x, b.y, b.hw, b.hh, TUNE.shift.nudge);

    if (!spot) {
      // something stands here on the other side: show exactly what
      audio.sfx('denied');
      this.hud.rattle();
      this.trauma = Math.max(this.trauma, 0.3);
      this.blockedHintT = 2.2;
      this.shiftCd = 0.14;
      for (const [tx, ty] of level.blockingTiles(to, b.x, b.y, b.hw, b.hh)) {
        const mark = this.add
          .rectangle(tx * TILE + 1, ty * TILE + 1, TILE - 2, TILE - 2, ACCENT[to], 0.25)
          .setOrigin(0, 0)
          .setStrokeStyle(1, ACCENT[to], 0.95)
          .setDepth(DEPTH.fog + 3);
        this.tweens.add({ targets: mark, alpha: 0, duration: 420, ease: 'Quad.easeIn', onComplete: () => mark.destroy() });
      }
      return;
    }

    // The switch is immediate: collision, enemies and controls already belong to the other world this frame.
    player.x = spot.x;
    player.y = spot.y;
    this.world = to;
    this.hasShifted = true;
    this.shiftCd = TUNE.shift.cooldown;

    // ...and this is what sells it.
    room.view.reveal(to, player.x - room.ox, player.y - 6 - room.oy);
    player.flash = 0.07;
    player.slash.setTint(ACCENT[to]);
    this.fx.shiftBurst(player.x, player.y - 6, to);
    this.fx.setAmbience(to, room.ox, room.oy, room.w, room.h);
    this.hud.flash(ACCENT[to], 0.2, 180);
    this.hud.setWorld(to, true);
    this.trauma = Math.max(this.trauma, 0.32);
    audio.setWorld(to);
    audio.sfx(to === 'nawia' ? 'shiftNawia' : 'shiftJawia');
  }

  // ------------------------------------------------------------------ combat

  private resolveAttack(): void {
    const { player, room } = this;
    const a = player.attackBox();
    let landed = false;

    for (let i = room.enemies.length - 1; i >= 0; i--) {
      const e = room.enemies[i];
      if (e.home !== this.world || !overlap(a, e.box)) continue;
      if (!e.hit(player.swingId, player.x, player.y)) continue;
      landed = true;
      audio.sfx('hit');
      this.fx.hit(e.x, e.y - 4, this.world);
      this.hitstop = 0.065;
      this.trauma = Math.max(this.trauma, 0.4);
      if (e.dead) {
        audio.sfx('enemyDie');
        this.fx.death(e.x, e.y - 4, e.home);
        e.destroy();
        room.enemies.splice(i, 1);
        this.checkCleared();
      }
    }

    for (const p of room.props) {
      if (p.kind !== 'bell' || this.bellSwing === player.swingId) continue;
      if (!overlap(a, { x: p.x, y: p.y, hw: 8, hh: 8 })) continue;
      this.bellSwing = player.swingId;
      this.clinkSwing = player.swingId;
      this.ringBell(p);
      return;
    }

    // steel on stone
    if (!landed && this.clinkSwing !== player.swingId && this.level.blocked(this.world, a.x, a.y, a.hw * 0.55, a.hh * 0.55, BLOCK_FLY)) {
      this.clinkSwing = player.swingId;
      audio.sfx('clink');
      this.fx.clink(a.x, a.y);
      this.trauma = Math.max(this.trauma, 0.15);
    }
  }

  /** A room falls silent when nothing is left in either world. Then its gates open. */
  private checkCleared(): void {
    const { room } = this;
    if (room.enemies.length > 0 || this.cleared.has(room.def.id)) return;
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
    player.attackT = -1;
    this.hud.setDialog(null);
    this.hud.setHint(null);
    audio.sfx('door');
  }

  private updateSlide(dt: number): void {
    const s = this.slide;
    s.t = Math.min(1, s.t + dt / TUNE.camera.slideTime);
    const e = s.t * s.t * (3 - 2 * s.t);
    this.camX = Math.round(lerp(s.fromX, s.toX, e));
    this.camY = Math.round(lerp(s.fromY, s.toY, e));
    this.player.drive(lerp(s.pFromX, s.pToX, s.t), lerp(s.pFromY, s.pToY, s.t));
    for (const p of this.room.props) p.update(dt);
    if (this.leaving) for (const p of this.leaving.props) p.update(dt);

    if (s.t >= 1) {
      if (this.leaving) this.destroyRoom(this.leaving);
      this.leaving = null;
      this.state = 'play';
      this.entry = { x: this.player.x, y: this.player.y, world: this.world };
      this.onEnterRoom();
      input.flush();
    }
  }

  // ------------------------------------------------------------------ death, ending

  private startDying(): void {
    this.state = 'dying';
    this.stateT = 0;
    audio.sfx('die');
    this.hud.setDialog(null);
    this.hud.setHint(null);
  }

  private updateDying(dt: number): void {
    const { player } = this;
    player.update(dt, this.level, this.world, false);
    player.sprite.setAlpha(Math.max(0, 1 - this.stateT / 0.8));
    for (const p of this.room.props) p.update(dt);
    if (this.stateT > 0.7) this.hud.setCenter(t(STR.dead));
    if (this.stateT > 2.4) {
      // back to where she entered the room; the room resets, the dungeon does not
      this.hud.setCenter(null);
      const def = this.room.def;
      this.destroyRoom(this.room);
      this.world = this.entry.world;
      player.x = this.entry.x;
      player.y = this.entry.y;
      player.hp = TUNE.player.maxHp;
      player.dead = false;
      player.invuln = 1;
      player.kx = 0;
      player.ky = 0;
      player.slash.setTint(ACCENT[this.world]);
      this.room = this.buildRoom(def);
      this.hud.setHearts(player.hp);
      this.hud.setWorld(this.world, false);
      this.hud.flash(0x000000, 1, 600);
      audio.setWorld(this.world);
      this.fx.setAmbience(this.world, this.room.ox, this.room.oy, this.room.w, this.room.h);
      this.state = 'play';
      player.sync();
      input.flush();
    }
  }

  private ringBell(bell: Prop): void {
    bell.ring();
    audio.sfx('bell');
    this.state = 'ending';
    this.stateT = 0;
    this.endStep = 0;
    this.trauma = 0.7;
    this.hitstop = 0.1;
    this.hud.setHint(null);
    this.hud.setDialog(null);
    this.hud.flash(0xfff0c0, 0.5, 400);
    this.fx.hit(bell.x, bell.y - 6, 'jawia');
  }

  /** The bell answers: the border trembles, both worlds wash over the room in rings from the bell. */
  private updateEnding(dt: number): void {
    const { player, room } = this;
    player.update(dt, this.level, this.world, false);
    for (const p of room.props) p.update(dt);
    for (const e of room.enemies) e.update(dt, this.level, this.world, player.x, player.y, false);
    const bell = room.props.find((p) => p.kind === 'bell');
    const beats = [0.15, 0.75, 1.35, 1.95];
    if (bell && this.endStep < beats.length && this.stateT >= beats[this.endStep]) {
      this.endStep++;
      this.world = otherWorld(this.world);
      room.view.reveal(this.world, bell.x - room.ox, bell.y - 6 - room.oy);
      this.fx.shiftBurst(bell.x, bell.y - 6, this.world);
      this.hud.setWorld(this.world, false);
      audio.setWorld(this.world);
      this.trauma = Math.max(this.trauma, 0.35);
      if (this.endStep === beats.length) this.hud.fadeOut(0xf4efe4, 1500, () => this.scene.start('end'));
    }
  }

  // ------------------------------------------------------------------ atmosphere + drawing

  private updateAtmosphere(dt: number, rawDt: number): void {
    const { room, world } = this;

    // water and stars
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
    this.leaving?.view.update(dt);

    // things change sides as the ring passes over them
    const r = room.view.radius;
    const cx = room.ox + room.view.centerX;
    const cy = room.oy + room.view.centerY;
    for (const p of room.props) if (Math.hypot(p.x - cx, p.y - cy) <= r) p.setWorld(world);
    for (const e of room.enemies) if (Math.hypot(e.x - cx, e.y - cy) <= r) e.setWorldVisual(world);

    // colours of the air ease towards the current world
    const k = 1 - Math.exp(-rawDt * 9);
    for (let i = 0; i < 3; i++) {
      this.ambient[i] = lerp(this.ambient[i], AMBIENT[world][i], k);
      this.heroLight[i] = lerp(this.heroLight[i], HERO_LIGHT[world][i], k);
      this.fogTint[i] = lerp(this.fogTint[i], FOG[world].tint[i], k);
    }
    this.fogAlpha = lerp(this.fogAlpha, FOG[world].alpha, k);

    this.trauma = Math.max(0, this.trauma - rawDt * 2.2);
  }

  private render(): void {
    // screen shake: whole pixels only
    const amp = this.trauma * this.trauma * 5;
    const sx = amp > 0.2 ? Math.round((Math.random() * 2 - 1) * amp) : 0;
    const sy = amp > 0.2 ? Math.round((Math.random() * 2 - 1) * amp) : 0;
    const scrollX = this.camX + sx;
    const scrollY = this.camY + sy;
    this.cameras.main.setScroll(scrollX, scrollY);

    const lights: LightSource[] = [
      { x: this.player.x, y: this.player.y - 6, radius: 66, color: this.heroLight, intensity: this.player.dead ? 0.2 : 0.56, flicker: 0.25 },
    ];
    for (const p of this.room.props) {
      const l = p.light();
      if (l) lights.push(l);
    }
    if (this.leaving)
      for (const p of this.leaving.props) {
        const l = p.light();
        if (l) lights.push(l);
      }
    this.lighting.ambient = this.ambient;
    this.lighting.render(scrollX, scrollY, lights, this.clock);

    const tint = rgbToHex(this.fogTint);
    this.fog[0].setTint(tint).setAlpha(this.fogAlpha);
    this.fog[1].setTint(tint).setAlpha(this.fogAlpha * 0.7);
    this.fog[0].setTilePosition(Math.round(scrollX + this.clock * 5), Math.round(scrollY + this.clock * 1.5));
    this.fog[1].setTilePosition(Math.round(scrollX * 1.0 - this.clock * 3 + 61), Math.round(scrollY + 37 - this.clock * 2.2));
  }
}
