// A figure painter for 16-bit proportions: people and monsters assembled from shaded parts,
// so one description gives every direction and a whole walk cycle, at any size.
//
// The 16x16 sprites in actors.ts are drawn by hand, pixel by pixel. That does not scale to
// 24x32 figures in three directions and five frames, in several styles to choose between.
// Here a figure is a set of proportions, materials and features; `figureFrame` poses it.
//
// Conventions:
//  - light from the upper left: every part is lighter on its left, darker on its right;
//  - a ramp is four colours: [shadow, base, light, highlight];
//  - frames: 0 stands; 1-4 are the walk (contact, passing, contact, passing);
//  - a figure stands on row h - 2 of its cell, so an outline fits underneath.

import { PixelBuffer, alphaOf, mix, rgb, withAlpha, type Color } from '../core/PixelBuffer.ts';
import { hash2 } from '../core/rng.ts';
import { softOutline, type Sheet } from './sheet.ts';

export type Ramp = readonly [Color, Color, Color, Color];
export type View = 'down' | 'up' | 'side';

/** Four tones from one base colour: for materials that do not need a hand-picked ramp. */
export function rampOf(hex: number, shadow = 0x1a1423, light = 0xfff2d0): Ramp {
  const c = rgb(hex);
  return [mix(c, rgb(shadow), 0.48), c, mix(c, rgb(light), 0.3), mix(c, rgb(light), 0.58)];
}

export const tone = (r: Ramp, i: number): Color => r[Math.max(0, Math.min(3, i))];

/** A horizontal run of one material, lit from the left. `lift` moves the whole run up or down the ramp. */
export function run(b: PixelBuffer, y: number, x0: number, x1: number, r: Ramp, lift = 0): void {
  const n = x1 - x0 + 1;
  if (n <= 0) return;
  const lit = n >= 3 ? Math.max(1, Math.round(n * 0.22)) : 0;
  const dark = n >= 2 ? Math.max(1, Math.round(n * 0.26)) : 0;
  for (let x = x0; x <= x1; x++) b.set(x, y, tone(r, (x < x0 + lit ? 2 : x > x1 - dark ? 0 : 1) + lift));
}

/** A filled ellipse with banded sphere shading. */
export function ball(b: PixelBuffer, cx: number, cy: number, rx: number, ry: number, r: Ramp, lift = 0): void {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const nx = (x + 0.5 - cx) / rx;
      const ny = (y + 0.5 - cy) / ry;
      if (nx * nx + ny * ny >= 1) continue;
      const lum = -nx * 0.55 - ny * 0.65;
      b.set(x, y, tone(r, (lum > 0.5 ? 3 : lum > 0.12 ? 2 : lum > -0.38 ? 1 : 0) + lift));
    }
}

/** A straight line of single pixels. */
export function stroke(b: PixelBuffer, x0: number, y0: number, x1: number, y1: number, c: Color): void {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= n; i++) b.set(Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), c);
}

// ------------------------------------------------------------------ figures on two legs

/** Where things ended up, for features that hang on the body (headgear, weapons, weeds, antlers). */
export interface Anchors {
  view: View;
  frame: number;
  cx: number;
  /** the head: left and right columns, top and bottom rows */
  hx0: number;
  hx1: number;
  hy0: number;
  hy1: number;
  eyeY: number;
  shoulderY: number;
  /** torso: left and right columns at the shoulders */
  tx0: number;
  tx1: number;
  waistY: number;
  foot: number;
  /** hands, as [x, y] of their lowest pixel: the one on the viewer's left, then right (side view: far, near) */
  hands: [number, number][];
  /** +1 / -1 while a leg is forward, 0 otherwise */
  step: number;
}

export interface Figure {
  /** cell size */
  w: number;
  h: number;
  head: { w: number; h: number };
  neck: number;
  /** torso width at the shoulders and at the waist, and its height */
  shoulder: number;
  waist: number;
  torsoH: number;
  /** how far the tunic hangs below the waist */
  skirt: number;
  arm: { w: number; len: number };
  leg: { w: number; len: number; gap: number };
  bootH: number;
  /** px the head sinks into the shoulders and leans forward: 0 for people, more for things that stalk */
  hunch?: number;
  skin: Ramp;
  hair: Ramp;
  top: Ramp;
  bottom: Ramp;
  boots: Ramp;
  /** hangs from the shoulders, behind the body */
  cloak?: Ramp;
  belt?: Color;
  /** hem of the tunic */
  trim?: Color;
  outline: Color;
  hairStyle: 'short' | 'long' | 'none' | 'wild' | 'curtain';
  /** human: eyes and a brow. skull: sockets and teeth. hollow: nothing but two lights in the dark. none: bare. */
  face: 'human' | 'skull' | 'hollow' | 'none';
  eye: Color;
  hands?: 'hand' | 'claw';
  /** no legs: a robe that trails to the ground and frays */
  robe?: boolean;
  /** how many of the robe's bottom rows fade out (ghosts) */
  fade?: number;
  ribs?: boolean;
  shield?: { rim: Ramp; face: Color; cross: Color; boss: Color };
  /** drawn before the body (tails, wings, what is carried on the back) */
  under?: (b: PixelBuffer, a: Anchors) => void;
  /** drawn after it (headgear, weapons, weeds, antlers) */
  over?: (b: PixelBuffer, a: Anchors) => void;
}

/** How far a head row is cut in at the sides: a rounded skull, not a box. */
function headInset(row: number, hh: number, hw: number): number {
  const max = hw <= 6 ? 1 : 2;
  if (row < max) return max - row;
  if (row >= hh - max) return row - (hh - max - 1);
  return 0;
}

function drawHead(b: PixelBuffer, f: Figure, a: Anchors): void {
  const { hx0, hx1, hy0, hy1, view } = a;
  const hh = hy1 - hy0 + 1;
  const hw = hx1 - hx0 + 1;
  const back = view === 'up';
  const side = view === 'side';
  const bald = f.hairStyle === 'none';
  const hairRows = bald ? 0 : Math.max(2, Math.round(hh * 0.36));
  for (let r = 0; r < hh; r++) {
    const y = hy0 + r;
    const ins = headInset(r, hh, hw);
    const x0 = hx0 + ins;
    const x1 = hx1 - ins;
    const lift = r === 0 ? 1 : r >= hh - 2 ? -1 : 0;
    if (back && !bald) {
      run(b, y, x0, x1, f.hair, lift);
      continue;
    }
    run(b, y, x0, x1, f.skin, lift);
    if (bald) continue;
    if (r < hairRows) run(b, y, x0, x1, f.hair, lift);
    else if (side) {
      // the hair runs down the back of the head
      const depth = f.hairStyle === 'short' ? Math.round(hw * 0.38) : Math.round(hw * 0.5);
      if (r < hh - 2 || f.hairStyle !== 'short') run(b, y, x0, x0 + depth - 1, f.hair, -1);
    } else if (r < hairRows + (f.hairStyle === 'short' ? 2 : hh)) {
      // temples
      b.set(x0, y, f.hair[1]);
      b.set(x1, y, f.hair[0]);
    }
  }
  // long hair falls past the jaw
  if (!bald && (f.hairStyle === 'long' || f.hairStyle === 'wild' || f.hairStyle === 'curtain')) {
    const len = f.hairStyle === 'long' ? 3 : 5;
    for (let r = 0; r < len; r++) {
      const y = hy1 + 1 + r;
      if (back) run(b, y, hx0 + (r > len - 2 ? 1 : 0), hx1 - (r > len - 2 ? 1 : 0), f.hair, -1);
      else if (side) run(b, y, hx0, hx0 + Math.round(hw * 0.4), f.hair, -1);
      else {
        b.set(hx0, y, f.hair[1]); b.set(hx0 + 1, y, f.hair[0]);
        b.set(hx1, y, f.hair[0]); b.set(hx1 - 1, y, f.hair[1]);
      }
      if (f.hairStyle === 'wild' && hash2(r, hx0, 7) % 2) b.set(side ? hx0 - 1 : hash2(r, 3, 9) % 2 ? hx0 - 1 : hx1 + 1, y, f.hair[1]);
    }
  }
  if (back || f.face === 'none') return;
  const ey = a.eyeY;
  if (side) {
    const ex = hx1 - 2;
    if (f.face === 'human') {
      b.set(ex, ey - 1, f.skin[0]);
      b.set(ex, ey, f.eye);
      b.set(hx1, ey + 1, f.skin[2]); // nose
      b.set(hx1 - 1, ey + 3 > hy1 ? hy1 : ey + 3, f.skin[0]);
    } else if (f.face === 'skull') {
      b.set(ex, ey, f.outline); b.set(ex - 1, ey, f.outline); b.set(ex, ey + 1, f.eye);
      for (let x = hx1 - 3; x <= hx1; x++) b.set(x, hy1 - 1, (x & 1) === 0 ? f.outline : f.skin[2]);
    } else {
      b.set(ex, ey, f.eye);
      b.set(ex - 1, ey, f.outline);
    }
    if (f.hairStyle === 'curtain') for (let y = hy0 + 2; y <= hy1 + 1; y++) if ((y + ex) % 3 !== 0) b.set(hx1 - 1, y, f.hair[0]);
    return;
  }
  const el = a.cx - 2;
  const er = a.cx + 1;
  if (f.face === 'human') {
    for (const ex of [el, er]) {
      b.set(ex, ey - 1, f.skin[0]); // brow
      b.set(ex, ey, f.eye);
    }
    if (hh >= 8) { b.set(a.cx - 1, ey + 2, f.skin[0]); b.set(a.cx, ey + 2, f.skin[0]); }
  } else if (f.face === 'skull') {
    for (const ex of [el, er]) {
      b.set(ex - (ex < a.cx ? 1 : 0), ey, f.outline); b.set(ex + (ex < a.cx ? 0 : 1), ey, f.outline);
      b.set(ex - (ex < a.cx ? 1 : 0), ey + 1, f.outline); b.set(ex + (ex < a.cx ? 0 : 1), ey + 1, f.eye);
    }
    b.set(a.cx - 1, ey + 2, f.outline);
    for (let x = el - 1; x <= er + 1; x++) b.set(x, ey + 3 > hy1 ? hy1 : ey + 3, (x & 1) === 0 ? f.outline : f.skin[3]);
  } else {
    // hollow: the dark, and two lights in it
    for (let y = ey - 1; y <= ey + 2 && y <= hy1; y++) for (let x = el - 1; x <= er + 1; x++) b.set(x, y, f.outline);
    b.set(el, ey, f.eye);
    b.set(er, ey, f.eye);
  }
  // hair that hangs over the face leaves only a gap to look through
  if (f.hairStyle === 'curtain')
    for (let y = hy0 + 2; y <= hy1 + 2; y++) for (let x = hx0 + 1; x <= hx1 - 1; x++) if (x !== el && x !== er && (x + y) % 3 !== 0) b.set(x, y, f.hair[(x + y) % 2]);
}

function drawHand(b: PixelBuffer, f: Figure, x0: number, x1: number, y: number, dark: boolean): void {
  if (f.hands === 'claw') {
    for (let x = x0 - 1; x <= x1 + 1; x += 2) {
      b.set(x, y, f.skin[dark ? 0 : 3]);
      b.set(x, y + 1, f.skin[dark ? 0 : 2]);
      b.set(x + (x > (x0 + x1) / 2 ? 1 : -1), y + 2, f.skin[dark ? 0 : 3]);
    }
    return;
  }
  run(b, y - 1, x0, x1, f.skin, dark ? -1 : 0);
  run(b, y, x0, x1, f.skin, dark ? -2 : -1);
}

/** One figure, one view, one frame. */
export function figureFrame(f: Figure, view: View, frame: number): PixelBuffer {
  const b = new PixelBuffer(f.w, f.h);
  const cx = f.w >> 1;
  const foot = f.h - 2;
  const step = frame === 1 ? 1 : frame === 3 ? -1 : 0;
  // contact frames sink a pixel, passing frames stand tall
  const bob = step !== 0 ? 1 : 0;
  const hunch = f.hunch ?? 0;
  const hipY = foot - f.leg.len + 1;
  const waistY = hipY - 1 + bob;
  const shoulderY = waistY - f.torsoH + 1;
  const hy1 = shoulderY - 1 - f.neck + hunch;
  const hy0 = hy1 - f.head.h + 1;
  const side = view === 'side';
  const depth = side ? Math.max(3, Math.round(f.shoulder * 0.62)) : f.shoulder;
  const tx0 = cx - (depth >> 1);
  const tx1 = tx0 + depth - 1;
  const lean = side ? Math.round(hunch * 0.8) + 1 : 0;
  const hx0 = cx - (f.head.w >> 1) + lean;
  const hx1 = hx0 + f.head.w - 1;
  const hairRows = f.hairStyle === 'none' ? 0 : Math.max(2, Math.round(f.head.h * 0.36));
  const a: Anchors = {
    view, frame, cx, hx0, hx1, hy0, hy1, eyeY: hy0 + Math.max(hairRows, Math.round(f.head.h * 0.36)) + 1,
    shoulderY, tx0, tx1, waistY, foot, hands: [], step,
  };
  const armY0 = shoulderY + 1;
  const armY = (swing: number): number => armY0 + f.arm.len - 1 + swing;

  // ---- what is carried behind the body
  if (f.cloak && view !== 'up') {
    const len = Math.min(foot - 2, waistY + Math.round(f.leg.len * 0.55)) - shoulderY;
    for (let i = 0; i <= len; i++) {
      const y = shoulderY + i;
      const flare = Math.round((i / len) * 2);
      if (side) run(b, y, tx0 - 2 - flare - (step !== 0 && i > len - 3 ? 1 : 0), tx0 + 1, f.cloak, i > len - 2 ? -1 : 0);
      else run(b, y, tx0 - 1 - flare, tx1 + 1 + flare, f.cloak, -1);
    }
  }
  if (f.shield && side) ball(b, tx0 - 1, shoulderY + 4, 4, 5, f.shield.rim, -1);
  f.under?.(b, a);

  // ---- legs (or a robe)
  const lw = f.leg.w;
  if (f.robe) {
    const top = waistY + 1;
    for (let y = top; y <= foot; y++) {
      const t = (y - top) / Math.max(1, foot - top);
      const sway = Math.round(Math.sin(frame * 1.57 + t * 3) * t * 1.5);
      const half = (f.waist >> 1) + 1 + Math.round(t * 2);
      const ragged = y > foot - 3;
      for (let x = cx - half + sway; x <= cx + half - 1 + sway; x++) {
        if (ragged && hash2(x, y - foot, 5) % (y === foot ? 2 : 4) === 0) continue;
        const u = (x - (cx - half + sway)) / (2 * half);
        let c = tone(f.bottom, (u < 0.24 ? 2 : u > 0.72 ? 0 : 1) - (y > foot - 4 ? 1 : 0));
        if ((x - cx) % 3 === 0 && y % 2 === 0) c = tone(f.bottom, 0); // folds
        const fade = f.fade && y > foot - f.fade ? 255 - Math.round(((y - (foot - f.fade)) / f.fade) * 190) : 255;
        b.set(x, y, fade < 255 ? withAlpha(c, fade) : c);
      }
    }
  } else if (side) {
    // the far leg first, darker; then the near one over it
    for (const [dir, lift] of [[-step, -1], [step, 0]] as const) {
      const raised = dir < 0 ? 2 : 0;
      for (let i = 0; i < f.leg.len - raised; i++) {
        const y = hipY + i;
        const t = i / (f.leg.len - 1);
        const x = cx - (lw >> 1) + Math.round(dir * t * (lw + 1)) + (lift < 0 && step === 0 ? -1 : 0);
        const boot = i >= f.leg.len - raised - f.bootH;
        run(b, y, x, x + lw - 1, boot ? f.boots : f.bottom, lift);
        if (i === f.leg.len - raised - 1) b.set(x + lw, y, tone(f.boots, lift)); // toe
      }
    }
  } else {
    const xs = [cx - (f.leg.gap >> 1) - lw, cx + (f.leg.gap >> 1)];
    xs.forEach((x, k) => {
      // the leg coming towards us reaches the ground; the one going back is shorter and in shade
      const fwd = view === 'down' ? (k === 0 ? step : -step) : k === 0 ? -step : step;
      const cut = fwd < 0 ? 2 : 0;
      for (let i = 0; i < f.leg.len - cut; i++) {
        const boot = i >= f.leg.len - cut - f.bootH;
        run(b, hipY + i, x, x + lw - 1, boot ? f.boots : f.bottom, fwd < 0 ? -1 : 0);
      }
      if (f.leg.gap === 0 && k === 0) for (let i = 1; i < f.leg.len - cut; i++) b.set(x + lw - 1, hipY + i, tone(f.bottom, -1));
    });
  }

  // ---- the far arm (side view)
  const armSwing = step;
  if (side) {
    const y1 = armY(0);
    for (let y = armY0; y <= y1; y++) {
      const t = (y - armY0) / Math.max(1, y1 - armY0);
      const x = cx + Math.round(armSwing * t * 3) - (f.arm.w >> 1);
      run(b, y, x, x + f.arm.w - 1, f.top, -1);
    }
    const hx = cx + armSwing * 3 - (f.arm.w >> 1);
    drawHand(b, f, hx, hx + f.arm.w - 1, y1 + 1, true);
    a.hands.push([hx, y1 + 1]);
  }

  // ---- torso and tunic
  for (let y = shoulderY; y <= waistY; y++) {
    const t = (y - shoulderY) / Math.max(1, f.torsoH - 1);
    const wd = side ? depth : Math.round(f.shoulder + (f.waist - f.shoulder) * t);
    const x0 = cx - (wd >> 1);
    run(b, y, x0, x0 + wd - 1, f.top, y === shoulderY ? 1 : 0);
    if (f.ribs && y > shoulderY + 1 && (y - shoulderY) % 2 === 0) for (let x = x0 + 1; x < x0 + wd - 1; x++) if (x !== cx && x !== cx - 1) b.set(x, y, f.top[0]);
  }
  if (!f.robe)
    for (let i = 1; i <= f.skirt; i++) {
      const wd = (side ? depth : f.waist) + (i > 1 ? 2 : 0);
      const x0 = cx - (wd >> 1);
      run(b, waistY + i, x0, x0 + wd - 1, f.top, i === f.skirt ? -1 : 0);
      if (i === f.skirt && f.trim) for (let x = x0; x < x0 + wd; x++) b.set(x, waistY + i, (x & 1) === 0 ? f.trim : f.top[0]);
    }
  if (f.belt) {
    const wd = side ? depth : f.waist;
    const x0 = cx - (wd >> 1);
    for (let x = x0; x < x0 + wd; x++) b.set(x, waistY, f.belt);
    if (!side && view === 'down') b.set(cx, waistY, f.boots[3]);
  }

  // ---- the cloak seen from behind covers the back
  if (f.cloak && view === 'up') {
    const len = Math.min(foot - 2, waistY + Math.round(f.leg.len * 0.55)) - shoulderY;
    for (let i = 0; i <= len; i++) {
      const flare = Math.round((i / len) * 2);
      run(b, shoulderY + i, tx0 - 1 - flare, tx1 + 1 + flare, f.cloak, i === 0 ? 1 : i > len - 2 ? -1 : 0);
      if (i > 1 && i < len) { b.set(cx - 2, shoulderY + i, f.cloak[0]); b.set(cx + 2, shoulderY + i, f.cloak[0]); }
    }
  }

  // ---- arms
  if (side) {
    const y1 = armY(0);
    for (let y = armY0; y <= y1; y++) {
      const t = (y - armY0) / Math.max(1, y1 - armY0);
      const x = cx - Math.round(armSwing * t * 3) - (f.arm.w >> 1);
      run(b, y, x, x + f.arm.w - 1, f.top, y === armY0 ? 1 : 0);
    }
    const hx = cx - armSwing * 3 - (f.arm.w >> 1);
    drawHand(b, f, hx, hx + f.arm.w - 1, y1 + 1, false);
    a.hands.push([hx, y1 + 1]);
  } else {
    const xl = tx0 - f.arm.w + 1;
    const xr = tx1;
    [xl, xr].forEach((x, k) => {
      const sw = (k === 0 ? -armSwing : armSwing) * (view === 'up' ? -1 : 1);
      const y1 = armY(sw);
      for (let y = armY0; y <= y1; y++) run(b, y, x, x + f.arm.w - 1, f.top, (y === armY0 ? 1 : 0) + (k === 1 ? -1 : 0));
      drawHand(b, f, x, x + f.arm.w - 1, y1 + 1, k === 1);
      a.hands.push([x, y1 + 1]);
    });
  }

  // ---- shield on the arm: in front of him from the front, half hidden from behind
  if (f.shield && !side) {
    const sx = view === 'down' ? tx1 + 1 : tx0 - 1;
    const sy = shoulderY + Math.round(f.torsoH * 0.62);
    const r = Math.max(3, Math.round(f.shoulder * 0.42));
    ball(b, sx, sy, r, r, f.shield.rim);
    if (view === 'down') {
      ball(b, sx, sy, r - 1, r - 1, [mix(f.shield.face, f.outline, 0.35), f.shield.face, mix(f.shield.face, rgb(0xffffff), 0.2), mix(f.shield.face, rgb(0xffffff), 0.4)]);
      for (let i = -r + 2; i <= r - 2; i++) { b.set(sx + i, sy, f.shield.cross); b.set(sx, sy + i, f.shield.cross); }
      b.set(sx, sy, f.shield.boss); b.set(sx - 1, sy, f.shield.boss); b.set(sx, sy - 1, f.shield.boss); b.set(sx - 1, sy - 1, rgb(0xffffff));
    }
  }

  // ---- neck and head
  for (let y = hy1 + 1; y < shoulderY; y++) run(b, y, cx - 1 + lean, cx + lean, f.skin, -1);
  drawHead(b, f, a);
  f.over?.(b, a);
  return b;
}

// ------------------------------------------------------------------ beasts on four legs

export interface Beast {
  w: number;
  h: number;
  /** distance between shoulder and hip, and the radius of the body at each */
  len: number;
  chest: number;
  haunch: number;
  leg: { w: number; len: number };
  /** where the head sits relative to the shoulder (forward, up) and its size */
  neck: [number, number];
  head: { len: number; h: number };
  fur: Ramp;
  belly: Ramp;
  outline: Color;
  eye: Color;
  ears: 'point' | 'round';
  tail: 'bushy' | 'thin' | 'none';
  /** a ridge of bristles (or thorns) along the back */
  ridge?: Color;
  tusk?: Color;
  /** bare its teeth */
  snarl?: boolean;
}

/** A beast in profile, facing right. Frame 0 stands; 1-4 trot. */
export function beastFrame(s: Beast, frame: number): PixelBuffer {
  const b = new PixelBuffer(s.w, s.h);
  const ground = s.h - 2;
  const step = frame === 1 ? 1 : frame === 3 ? -1 : 0;
  const bob = step !== 0 ? 1 : 0;
  const by = ground - s.leg.len - Math.round(s.chest * 0.55) + bob;
  const xb = Math.round((s.w - s.len) / 2) - 1;
  const xf = xb + s.len;
  const farLeg: Ramp = [s.fur[0], s.fur[0], s.fur[1], s.fur[1]];

  const leg = (x: number, swing: number, r: Ramp, lift: number): void => {
    const top = ground - s.leg.len - 1;
    const n = ground - top + 1;
    for (let i = 0; i < n - (lift > 0 ? 2 : 0); i++) {
      const t = i / (n - 1);
      const lx = x + Math.round(swing * t * 3);
      run(b, top + i, lx, lx + s.leg.w - 1, r, i > n - 3 ? -1 : 0);
      if (i === n - 1 - (lift > 0 ? 2 : 0)) b.set(lx + s.leg.w, top + i, r[0]);
    }
  };
  // far pair, in shade and a little behind
  leg(xf - 3, -step, farLeg, step < 0 ? 0 : step);
  leg(xb - 1, step, farLeg, step > 0 ? 0 : -step);

  // tail
  if (s.tail !== 'none') {
    const droop = s.tail === 'bushy' ? 5 : 6;
    for (let i = 0; i < droop + 2; i++) {
      const x = xb - s.haunch - i * (s.tail === 'bushy' ? 0.7 : 0.5) + 1;
      const y = by - 1 + i * 0.9 + Math.sin(frame * 1.57 + i * 0.6) * 0.7;
      if (s.tail === 'bushy') ball(b, x, y, 1.6, 1.6, s.fur, i > droop ? 1 : -1);
      else b.set(Math.round(x), Math.round(y), s.fur[0]);
    }
  }

  // body: a capsule from haunch to chest, light on the back, the belly's own colour underneath
  for (let y = Math.floor(by - s.chest - 1); y <= Math.ceil(by + s.chest + 1); y++)
    for (let x = Math.floor(xb - s.haunch - 1); x <= Math.ceil(xf + s.chest + 1); x++) {
      const t = Math.max(0, Math.min(1, (x + 0.5 - xb) / (xf - xb)));
      const r = s.haunch + (s.chest - s.haunch) * t;
      const dx = x + 0.5 - (xb + (xf - xb) * t);
      const dy = (y + 0.5 - by) * 1.12;
      if (dx * dx + dy * dy >= r * r) continue;
      const v = dy / r;
      b.set(x, y, v > 0.42 ? s.belly[v > 0.75 ? 0 : 1] : tone(s.fur, v < -0.55 ? 2 : v < 0.05 ? 1 : 0));
    }
  if (s.ridge) for (let x = xb - 1; x <= xf + 1; x += 2) {
    const t = Math.max(0, Math.min(1, (x - xb) / (xf - xb)));
    const top = Math.round(by - (s.haunch + (s.chest - s.haunch) * t) / 1.12);
    b.set(x, top - 1, s.ridge);
    if ((x & 2) === 0) b.set(x, top - 2, s.ridge);
  }

  // near pair
  leg(xf - 1, step, s.fur, step > 0 ? 0 : -step);
  leg(xb + 1, -step, s.fur, step < 0 ? 0 : step);

  // neck and head
  const hx = xf + s.neck[0];
  const hy = by - s.neck[1] + (step !== 0 ? 1 : 0);
  for (let i = 0; i <= 4; i++) ball(b, xf + ((hx - xf) * i) / 4, by - 1 + ((hy - by + 1) * i) / 4, s.chest * 0.62, s.chest * 0.62, s.fur);
  ball(b, hx, hy, s.head.h * 0.62, s.head.h * 0.55, s.fur, 0);
  // muzzle
  for (let i = 0; i < s.head.len; i++) {
    const hh = Math.max(1, Math.round(s.head.h * 0.42 * (1 - i / (s.head.len + 2))));
    for (let k = 0; k < hh; k++) b.set(hx + 2 + i, hy + k, k === 0 ? s.fur[2] : s.fur[1]);
    if (s.snarl && i > 0) b.set(hx + 2 + i, hy + hh, (i & 1) === 0 ? rgb(0xf6f1e6) : s.outline);
  }
  b.set(hx + 2 + s.head.len, hy, s.outline); // nose
  if (s.tusk) { b.set(hx + s.head.len, hy + 2, s.tusk); b.set(hx + s.head.len + 1, hy + 1, s.tusk); b.set(hx + s.head.len + 1, hy, s.tusk); }
  // ears
  const ex = hx - 2;
  const ey = Math.round(hy - s.head.h * 0.55);
  if (s.ears === 'point') { b.set(ex, ey, s.fur[1]); b.set(ex + 1, ey, s.fur[2]); b.set(ex, ey - 1, s.fur[1]); b.set(ex + 1, ey - 1, s.fur[0]); b.set(ex, ey - 2, s.fur[0]); b.set(ex + 3, ey, s.fur[0]); b.set(ex + 3, ey - 1, s.fur[0]); }
  else { b.set(ex, ey, s.fur[0]); b.set(ex + 1, ey, s.fur[1]); b.set(ex + 1, ey - 1, s.fur[0]); }
  // eye: one pixel is all it takes
  b.set(hx + 1, hy - 1, s.eye);
  b.set(hx, hy - 2, s.outline);
  b.set(hx + 1, hy - 2, s.outline);
  return b;
}

// ------------------------------------------------------------------ styles and sheets

/** How finished figures are inked and graded: the difference between "console generations" on the same drawing. */
export interface FigureStyle {
  /** 'dark' = one dark line all round; 'tint' = that line tinted by what it borders; 'none' = no line at all */
  outline: 'dark' | 'tint' | 'none';
  /** colour grade: saturation and brightness multipliers, then a wash of `tint` */
  sat: number;
  val: number;
  tint?: [number, number];
}

function grade(c: Color, s: FigureStyle): Color {
  if (alphaOf(c) === 0) return c;
  let r = c & 255;
  let g = (c >> 8) & 255;
  let bl = (c >> 16) & 255;
  const l = 0.3 * r + 0.59 * g + 0.11 * bl;
  r = (l + (r - l) * s.sat) * s.val;
  g = (l + (g - l) * s.sat) * s.val;
  bl = (l + (bl - l) * s.sat) * s.val;
  const clamp = (v: number): number => Math.max(0, Math.min(255, Math.round(v)));
  let out = ((c & 0xff000000) | (clamp(bl) << 16) | (clamp(g) << 8) | clamp(r)) >>> 0;
  if (s.tint) out = (mix(out, rgb(s.tint[0], alphaOf(c)), s.tint[1]) & 0x00ffffff) | (c & 0xff000000);
  return out >>> 0;
}

/** Inks and grades one frame. */
export function finish(frame: PixelBuffer, outline: Color, s: FigureStyle): PixelBuffer {
  let b = frame;
  if (s.outline !== 'none') {
    b = frame.outlined(outline);
    if (s.outline === 'tint') b = softOutline(b, outline, 0.7);
  }
  const out = new PixelBuffer(b.w, b.h);
  for (let i = 0; i < b.u32.length; i++) out.u32[i] = grade(b.u32[i], s);
  return out;
}

/** Rows: facing down, up, side (right). Columns: stand, then the four frames of the walk. */
export const RIG = { cols: 5, STAND: 0, WALK: 1, DOWN: 0, UP: 1, SIDE: 2 } as const;

export function figureSheet(key: string, f: Figure, s: FigureStyle): Sheet {
  const buf = new PixelBuffer(f.w * RIG.cols, f.h * 3);
  (['down', 'up', 'side'] as View[]).forEach((view, row) => {
    for (let c = 0; c < RIG.cols; c++) buf.copy(finish(figureFrame(f, view, c), f.outline, s), c * f.w, row * f.h);
  });
  return { key, buf, fw: f.w, fh: f.h };
}

/** One row: stand, then the four frames of the trot, facing right. */
export function beastSheet(key: string, s: Beast, style: FigureStyle): Sheet {
  const buf = new PixelBuffer(s.w * RIG.cols, s.h);
  for (let c = 0; c < RIG.cols; c++) buf.copy(finish(beastFrame(s, c), s.outline, style), c * s.w, 0);
  return { key, buf, fw: s.w, fh: s.h };
}
