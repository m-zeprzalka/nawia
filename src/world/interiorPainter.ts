// Paints the inside of a house (biome: house): plank floor, log walls, a woven rug, furniture.
//
// The whole map outside the room is '#'. A wall tile that touches the floor is drawn (the one above
// the floor shows its face, with windows, shelves and drying herbs; the others show their tops);
// wall tiles that touch nothing are the dark beyond the walls.
// Light comes in through the windows and the door, and the hearth (a sprite) does the rest.

import { TILE, WORLDS, type World } from '../config.ts';
import { PixelBuffer, mix, rgb, type Color } from '../core/PixelBuffer.ts';
import { hash2 } from '../core/rng.ts';
import { SURF, type SurfacePalette } from '../art/surface.ts';
import type { RoomDef } from './roomFormat.ts';
import type { RoomPicture } from './painter.ts';

const WALL_CHARS = '#WFM';

/** The striped blanket and the kilim: the colours of a Lowicz skirt in Jawia, of souls in Nawia. */
const CLOTH: Record<World, Color[]> = {
  jawia: [0xb6343c, 0x7c2032, 0xeadfc4, 0xd8a84a, 0x3f7a4a, 0x2f4a7a].map((h) => rgb(h)),
  nawia: [0x26347e, 0x121a4a, 0xdcffff, 0xe08ae8, 0x3db6c6, 0x6f8fe0].map((h) => rgb(h)),
};

export class InteriorPainter implements RoomPicture {
  readonly w: number;
  readonly h: number;
  readonly buffers: Record<World, PixelBuffer>;
  readonly overhead = null;
  readonly echo: Record<World, PixelBuffer>;

  private readonly room: RoomDef;

  constructor(room: RoomDef, echo: Record<World, PixelBuffer>) {
    this.room = room;
    this.echo = echo;
    this.w = room.cols * TILE;
    this.h = room.rows * TILE;
    this.buffers = { jawia: new PixelBuffer(this.w, this.h), nawia: new PixelBuffer(this.w, this.h) };
    for (const world of WORLDS) this.paint(world);
  }

  animate(): void {
    // nothing moves in here but the fire, and that is a sprite
  }

  private ch(x: number, y: number): string {
    const r = this.room;
    if (x < 0 || y < 0 || x >= r.cols || y >= r.rows) return '#';
    return r.source[y]?.[x] ?? '#';
  }

  private isWall(x: number, y: number): boolean {
    return WALL_CHARS.includes(this.ch(x, y));
  }

  private paint(world: World): void {
    const { room, w, h } = this;
    const p = SURF[world];
    const b = this.buffers[world];
    const L = p.log;
    const cloth = CLOTH[world];
    /** furniture is wood in Jawia; in Nawia it is what is remembered of it */
    const W = p.glow ? p.stone : p.wood;
    const floor = (x: number, y: number): boolean => !this.isWall(x, y);
    const door = (x: number, y: number): boolean => x >= 0 && y >= 0 && x < room.cols && y < room.rows && room.doors.has(y * room.cols + x);
    const touchesFloor = (x: number, y: number): boolean => {
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (floor(x + dx, y + dy) && !door(x + dx, y + dy)) return true;
      return false;
    };

    // ---- the dark beyond the walls
    b.fill(p.glow ? p.water[0] : rgb(0x0b0910));
    if (p.glow)
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const hs = hash2(x, y, 9);
          if (hs % 97 === 0) b.set(x, y, hs % 3 === 0 ? p.water[5] : p.dirt[4]);
        }

    // ---- floor, rug, walls
    for (let ty = 0; ty < room.rows; ty++)
      for (let tx = 0; tx < room.cols; tx++) {
        const x0 = tx * TILE;
        const y0 = ty * TILE;
        const c = this.ch(tx, ty);
        if (this.isWall(tx, ty)) {
          if (!touchesFloor(tx, ty)) continue;
          if (floor(tx, ty + 1)) this.face(b, p, x0, y0, c, world, tx);
          else {
            // the top of a wall: dark timber, with a lighter lip on the side the room is on
            for (let y = 0; y < TILE; y++)
              for (let x = 0; x < TILE; x++) {
                let col: Color = y % 8 === 7 ? L[0] : L[1];
                const lip =
                  (x === 0 && !this.isWall(tx - 1, ty)) || (x === 15 && !this.isWall(tx + 1, ty)) ||
                  (y === 0 && !this.isWall(tx, ty - 1)) || (y === 15 && floor(tx, ty + 1));
                if (lip) col = p.glow ? p.seam : L[3];
                b.set(x0 + x, y0 + y, col);
              }
          }
          continue;
        }
        const rug = c === ',';
        for (let y = 0; y < TILE; y++)
          for (let x = 0; x < TILE; x++) {
            const X = x0 + x;
            const Y = y0 + y;
            let col: Color;
            if (rug) {
              // a kilim: diamonds on a plain field, a darker border, fringe at both ends
              const edgeL = x < 2 && this.ch(tx - 1, ty) !== ',';
              const edgeR = x > 13 && this.ch(tx + 1, ty) !== ',';
              const edgeT = y < 2 && this.ch(tx, ty - 1) !== ',';
              const edgeB = y > 13 && this.ch(tx, ty + 1) !== ',';
              const d = Math.abs((X % 8) - 3.5) + Math.abs((Y % 8) - 3.5);
              col = d < 1.5 ? cloth[2] : d < 3 ? cloth[3] : cloth[0];
              if (edgeT || edgeB) col = y === 0 || y === 15 ? cloth[1] : cloth[3];
              if (edgeL || edgeR) col = (Y & 1) === 0 ? cloth[2] : cloth[1];
            } else {
              // boards, laid across the room
              const board = Math.floor(Y / 6);
              const k = ((Y % 6) + 6) % 6;
              const joint = (X + board * 37) % 44 === 0;
              const hs = hash2(X, Y, 31);
              if (k === 5 || joint) col = p.seam;
              else if (k === 0) col = mix(L[2], L[3], 0.55);
              else col = (board + hash2(board, 3, 5)) % 3 === 0 ? mix(L[2], L[3], 0.3) : L[2];
              if (k > 0 && k < 5 && hs % 23 === 0) col = L[1];
            }
            b.set(X, Y, col);
          }
        // the wall above throws a little shade on the floor
        if (this.isWall(tx, ty - 1)) for (let y = 0; y < 3; y++) for (let x = 0; x < TILE; x++) b.set(x0 + x, y0 + y, mix(b.get(x0 + x, y0 + y), p.outline, y === 0 ? 0.4 : 0.22));
      }

    // ---- light through the windows and the door
    const shine = (x: number, y: number, k: number): void => {
      if (x < 0 || y < 0 || x >= w || y >= h) return;
      if (this.isWall(Math.floor(x / TILE), Math.floor(y / TILE))) return;
      b.set(x, y, mix(b.get(x, y), p.glow ? p.tuft[1] : rgb(0xfff0b0), k));
    };
    for (let ty = 0; ty < room.rows; ty++)
      for (let tx = 0; tx < room.cols; tx++) {
        const x0 = tx * TILE;
        const y0 = ty * TILE;
        if (this.ch(tx, ty) === 'W' && floor(tx, ty + 1))
          for (let dy = 0; dy < 28; dy++) for (let x = 3; x < 13; x++) shine(x0 + x + Math.floor(dy * 0.55), y0 + TILE + dy, p.glow ? 0.1 : dy < 20 ? 0.2 : 0.1);
        if (door(tx, ty)) {
          // the doorway itself: daylight (or the night of Nawia) beyond the threshold
          for (let y = 0; y < TILE; y++)
            for (let x = 0; x < TILE; x++) {
              const post = x < 2 || x > 13;
              b.set(x0 + x, y0 + y, post ? L[1] : p.glow ? p.water[y > 8 ? 1 : 3] : y > 9 ? rgb(0xf6ecc4) : mix(L[3], rgb(0xf6ecc4), y / 12));
            }
          for (let dy = 1; dy <= 22; dy++) for (let x = 2 - Math.floor(dy / 4); x < 14 + Math.floor(dy / 4); x++) shine(x0 + x, y0 - dy, p.glow ? 0.1 : dy < 12 ? 0.26 : 0.13);
        }
      }

    // ---- furniture, back to front
    const jobs: { by: number; draw: () => void }[] = [];
    const shadow = (x: number, y: number, rw: number, rh: number): void => {
      for (let j = y; j < y + rh; j++) for (let i = x; i < x + rw; i++) if (i >= 0 && j >= 0 && i < w && j < h && !this.isWall(Math.floor(i / TILE), Math.floor(j / TILE))) b.set(i, j, mix(b.get(i, j), p.outline, 0.3));
    };
    const box = (x: number, y: number, rw: number, rh: number, fill: Color, light: Color, dark: Color): void => {
      for (let j = 0; j < rh; j++)
        for (let i = 0; i < rw; i++) {
          const edge = i === 0 || j === 0 || i === rw - 1 || j === rh - 1;
          b.set(x + i, y + j, edge ? p.outline : j === 1 || i === 1 ? light : i === rw - 2 || j === rh - 2 ? dark : fill);
        }
    };
    for (let ty = 0; ty < room.rows; ty++)
      for (let tx = 0; tx < room.cols; tx++) {
        const c = this.ch(tx, ty);
        const x0 = tx * TILE;
        const y0 = ty * TILE;
        if (c === 'b' && this.ch(tx, ty - 1) !== 'b') {
          let n = 1;
          while (this.ch(tx, ty + n) === 'b') n++;
          const bh = n * TILE - 3;
          jobs.push({
            by: y0 + bh,
            draw: () => {
              shadow(x0 + 2, y0 + 3, 15, bh);
              box(x0, y0 + 1, 16, bh, W[2], W[3], W[1]);
              // headboard, pillow, striped blanket
              for (let x = 1; x < 15; x++) { b.set(x0 + x, y0 + 2, W[4]); b.set(x0 + x, y0 + 3, W[2]); b.set(x0 + x, y0 + 4, W[1]); }
              for (let y = 6; y < 12; y++) for (let x = 3; x < 13; x++) b.set(x0 + x, y0 + y, y === 6 || x === 3 ? cloth[2] : y === 11 || x === 12 ? mix(cloth[2], p.outline, 0.25) : mix(cloth[2], rgb(0xffffff), 0.25));
              for (let y = 13; y < bh - 2; y++)
                for (let x = 2; x < 14; x++) {
                  const stripe = [0, 0, 2, 4, 0, 0, 3, 5][(y - 13) % 8];
                  b.set(x0 + x, y0 + y, x === 13 ? mix(cloth[stripe], p.outline, 0.3) : cloth[stripe]);
                }
            },
          });
        } else if (c === 't' && this.ch(tx - 1, ty) !== 't') {
          let n = 1;
          while (this.ch(tx + n, ty) === 't') n++;
          const tw = n * TILE - 2;
          jobs.push({
            by: y0 + 15,
            draw: () => {
              shadow(x0 + 3, y0 + 5, tw, 12);
              // legs, then the top
              for (const lx of [x0 + 2, x0 + tw - 3]) for (let y = 11; y < 16; y++) { b.set(lx, y0 + y, W[1]); b.set(lx + 1, y0 + y, p.outline); }
              box(x0 + 1, y0 + 2, tw, 10, W[3], W[4], W[2]);
              for (let x = 6; x < tw - 2; x += 6) for (let y = 4; y < 9; y++) b.set(x0 + 1 + x, y0 + y, W[2]);
              for (let x = 1; x < tw - 1; x++) { b.set(x0 + 1 + x, y0 + 10, W[1]); }
              // bread and a bowl
              const bx = x0 + 5;
              for (let i = 0; i < 5; i++) { b.set(bx + i, y0 + 5, cloth[3]); b.set(bx + i, y0 + 6, i === 0 || i === 4 ? W[1] : mix(cloth[3], p.outline, 0.25)); }
              b.set(bx + 1, y0 + 4, cloth[3]); b.set(bx + 2, y0 + 4, cloth[2]); b.set(bx + 3, y0 + 4, cloth[3]);
              if (tw > 20) {
                const cx = x0 + tw - 9;
                for (let i = 0; i < 5; i++) { b.set(cx + i, y0 + 5, p.stone[4]); b.set(cx + i, y0 + 6, p.stone[2]); }
                b.set(cx + 1, y0 + 5, cloth[0]); b.set(cx + 2, y0 + 5, cloth[0]); b.set(cx + 3, y0 + 5, cloth[0]);
              }
            },
          });
        } else if (c === 'S') {
          jobs.push({
            by: y0 + 14,
            draw: () => {
              shadow(x0 + 5, y0 + 8, 9, 8);
              for (const lx of [x0 + 4, x0 + 10]) for (let y = 10; y < 15; y++) { b.set(lx, y0 + y, W[1]); b.set(lx + 1, y0 + y, p.outline); }
              box(x0 + 3, y0 + 5, 10, 6, W[3], W[4], W[2]);
            },
          });
        } else if (c === 'R') {
          jobs.push({
            by: y0 + 15,
            draw: () => {
              shadow(x0 + 3, y0 + 6, 14, 11);
              box(x0 + 1, y0 + 3, 14, 6, W[3], W[4], W[2]);
              box(x0 + 1, y0 + 8, 14, 8, W[2], W[3], W[1]);
              for (const ix of [x0 + 3, x0 + 11]) for (let y = 4; y < 15; y++) b.set(ix, y0 + y, y === 8 ? p.outline : p.stone[1]);
              b.set(x0 + 7, y0 + 10, p.stone[4]); b.set(x0 + 8, y0 + 10, p.stone[3]); b.set(x0 + 7, y0 + 11, p.stone[1]); b.set(x0 + 8, y0 + 11, p.stone[1]);
            },
          });
        } else if (c === 'O') {
          jobs.push({
            by: y0 + 15,
            draw: () => {
              shadow(x0 + 4, y0 + 5, 12, 12);
              for (let y = 1; y < 16; y++)
                for (let x = 2; x < 14; x++) {
                  const bulge = y < 4 || y > 12 ? 1 : 0;
                  if (x < 2 + bulge || x > 13 - bulge) continue;
                  const edge = x === 2 + bulge || x === 13 - bulge || y === 1 || y === 15;
                  const hoop = y === 5 || y === 11;
                  let col: Color = hoop ? p.stone[1] : x % 3 === 1 ? W[2] : x < 6 ? W[4] : x > 10 ? W[2] : W[3];
                  if (y < 4 && !edge) col = x < 7 ? W[4] : W[3]; // the lid
                  b.set(x0 + x, y0 + y, edge ? p.outline : col);
                }
            },
          });
        }
      }
    jobs.sort((a, c) => a.by - c.by);
    for (const j of jobs) j.draw();
  }

  /** One tile of the back wall: logs, and whatever hangs on them. */
  private face(b: PixelBuffer, p: SurfacePalette, x0: number, y0: number, c: string, world: World, tx: number): void {
    const L = p.log;
    for (let y = 0; y < TILE; y++)
      for (let x = 0; x < TILE; x++) {
        const k = y % 4;
        const hs = hash2(x0 + x, y0 + y, 17);
        let col: Color = k === 0 ? L[3] : k === 3 ? p.seam : L[2];
        if (k === 1 && hs % 6 === 0) col = L[3];
        if (k === 2 && hs % 5 === 0) col = L[1];
        if (y >= 14) col = mix(col, p.outline, 0.35);
        b.set(x0 + x, y0 + y, col);
      }
    if (c === 'W') {
      for (let y = 3; y < 12; y++)
        for (let x = 3; x < 13; x++) {
          const edge = x === 3 || x === 12 || y === 3 || y === 11;
          const bar = x === 7 || x === 8 || y === 7;
          let pane: Color;
          if (p.glow) pane = hash2(x0 + x, y0 + y, 9) % 11 === 0 ? p.water[5] : p.water[1];
          else pane = y < 7 ? rgb(0xd6f1fb) : rgb(0xa9daf0);
          b.set(x0 + x, y0 + y, edge ? L[0] : bar ? L[1] : pane);
        }
      for (let x = 2; x < 14; x++) b.set(x0 + x, y0 + 12, p.glow ? p.seam : L[4]);
    } else if (c === 'F') {
      // a shelf of jars
      for (let x = 0; x < TILE; x++) { b.set(x0 + x, y0 + 10, p.wood[3]); b.set(x0 + x, y0 + 11, p.wood[1]); }
      const jars = world === 'jawia' ? [0xa85c38, 0x4f8a5a, 0xe9dfc6, 0xcc8250] : [0x3f4fa6, 0x3db6c6, 0xdcffff, 0x6f8fe0];
      for (let i = 0; i < 3; i++) {
        const jx = x0 + 1 + i * 5;
        const col = rgb(jars[(i + tx) % jars.length]);
        const tall = (i + tx) % 2;
        for (let y = 5 - tall; y < 10; y++) for (let x = 0; x < 4; x++) b.set(jx + x, y0 + y, x === 0 ? mix(col, rgb(0xffffff), 0.3) : x === 3 ? mix(col, p.outline, 0.35) : col);
        b.set(jx + 1, y0 + 4 - tall, p.wood[1]); b.set(jx + 2, y0 + 4 - tall, p.wood[1]);
      }
    } else if (c === 'M') {
      // bunches of herbs drying on a string
      for (let x = 0; x < TILE; x++) b.set(x0 + x, y0 + 2, p.wood[1]);
      const tips = world === 'jawia' ? [0x8a6ac0, 0xe8c860, 0xd8f0a0] : [0xe08ae8, 0xdcffff, 0x8ef0ee];
      for (let i = 0; i < 3; i++) {
        const hx = x0 + 2 + i * 5;
        const len = 6 + ((i + tx) % 3);
        for (let y = 3; y < 3 + len; y++) {
          b.set(hx, y0 + y, p.tuft[0]);
          b.set(hx + 1, y0 + y, y < 5 ? p.wood[2] : p.tuft[p.glow ? 0 : 1]);
          if (y > 5) b.set(hx + 2, y0 + y, p.tuft[0]);
        }
        const tip = rgb(tips[(i + tx) % 3]);
        b.set(hx, y0 + 3 + len, tip); b.set(hx + 1, y0 + 3 + len, tip); b.set(hx + 2, y0 + 2 + len, tip);
      }
    }
  }
}
