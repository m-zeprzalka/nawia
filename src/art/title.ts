// The title picture, painted in code, once per world.
// Jawia: dusk over the lake, only the tip of the bell tower above the water.
// Nawia: the same lake as the dead remember it. The stronghold still stands, and the moon has a hole in it.

import { GAME_H, GAME_W, type World } from '../config.ts';
import { PixelBuffer, bayer, mix, rgb, shade, withAlpha, type Color } from '../core/PixelBuffer.ts';
import { mulberry32 } from '../core/rng.ts';
import { drawText, measure } from './font.ts';
import { heroFromBehind } from './actors.ts';

const HORIZON = 104;
export const TITLE_MOON = { x: 262, y: 36, r: 13 } as const;

interface TitlePalette {
  sky: number[];
  silhouette: number;
  rim: number;
  moon: number;
  moonShade: number;
  halo: number;
  star: number;
  mist: number;
  logoTop: number;
  logoBottom: number;
  logoEdge: number;
  window: number;
}

const TP: Record<World, TitlePalette> = {
  jawia: {
    sky: [0x0a0d20, 0x12173a, 0x1f2450, 0x3a3260, 0x66486a, 0x9a6460, 0xc98a62],
    silhouette: 0x08080f, rim: 0x2c2638,
    moon: 0xf6eecb, moonShade: 0xd3c89c, halo: 0x6a5a78,
    star: 0x9aa0c4, mist: 0x8a7088,
    logoTop: 0xf3e9cf, logoBottom: 0xc09a62, logoEdge: 0x1a1423,
    window: 0xffb43a,
  },
  nawia: {
    sky: [0x04050d, 0x080b20, 0x0d1638, 0x123056, 0x16546e, 0x2a8a90, 0x66c8b8],
    silhouette: 0x02030a, rim: 0x1c4a6a,
    moon: 0xe8ffff, moonShade: 0x8fe8f0, halo: 0x2f8fa8,
    star: 0xcfe2ff, mist: 0x5fc0cc,
    logoTop: 0xf2ffff, logoBottom: 0x62c4e4, logoEdge: 0x060a1c,
    window: 0x9af4ff,
  },
};

export function makeTitle(world: World): PixelBuffer {
  const p = TP[world];
  const b = new PixelBuffer(GAME_W, GAME_H);
  const rng = mulberry32(2026);
  const sil = rgb(p.silhouette);
  const rim = rgb(p.rim);

  // --- sky: dithered bands
  const stops = p.sky.map((c) => rgb(c));
  for (let y = 0; y < HORIZON; y++)
    for (let x = 0; x < GAME_W; x++) {
      const t = Math.pow(y / (HORIZON - 1), 1.35) * (stops.length - 1);
      const i = Math.min(stops.length - 2, Math.floor(t));
      b.set(x, y, t - i > bayer(x, y) ? stops[i + 1] : stops[i]);
    }

  // --- stars (same sky in both worlds: the dead just see more of them)
  const stars = world === 'jawia' ? 46 : 110;
  for (let i = 0; i < 110; i++) {
    const x = Math.floor(rng() * GAME_W);
    const y = Math.floor(rng() * 70);
    const bright = rng();
    if (i >= stars) continue;
    b.set(x, y, bright > 0.8 ? rgb(0xffffff) : rgb(p.star));
    if (bright > 0.93) { b.set(x + 1, y, rgb(p.star)); b.set(x - 1, y, rgb(p.star)); b.set(x, y + 1, rgb(p.star)); b.set(x, y - 1, rgb(p.star)); }
  }

  // --- moon
  const { x: mx, y: my, r: mr } = TITLE_MOON;
  for (let y = my - mr - 14; y <= my + mr + 14; y++)
    for (let x = mx - mr - 14; x <= mx + mr + 14; x++) {
      const d = Math.hypot(x + 0.5 - mx, y + 0.5 - my);
      if (d <= mr) {
        if (world === 'nawia' && d < mr - 4.5) {
          // the hole: through it you see the warm dusk of the living
          b.set(x, y, d < mr - 6 ? rgb(0x9a6460) : rgb(0x66486a));
        } else {
          const lit = (x - mx) * -0.5 + (y - my) * -0.7 > -2;
          b.set(x, y, rgb(lit ? p.moon : p.moonShade));
        }
      } else if (d < mr + 13) {
        const f = 1 - (d - mr) / 13;
        if (f * f * 0.9 > bayer(x, y)) b.plot(x, y, withAlpha(rgb(p.halo), world === 'nawia' ? 150 : 90));
      }
    }
  if (world === 'jawia') {
    for (const [cx, cy, cr] of [[-4, -3, 2.5], [3, 4, 3], [5, -5, 1.6], [-5, 5, 1.5]])
      for (let y = -4; y <= 4; y++)
        for (let x = -4; x <= 4; x++) if (Math.hypot(x - 0.0, y) <= cr) b.set(mx + cx + x, my + cy + y, rgb(p.moonShade));
  }

  // --- far shore: a ragged line of spruce
  const height = new Float32Array(GAME_W).fill(3);
  for (let i = 0; i < 70; i++) {
    const cx = rng() * GAME_W;
    const h = 5 + rng() * 13;
    const w = 3 + rng() * 4;
    for (let x = Math.floor(cx - w); x <= cx + w; x++) {
      if (x < 0 || x >= GAME_W) continue;
      const hh = h * (1 - Math.abs(x - cx) / w);
      // keep the lake open in the middle, where the stronghold is
      const gap = x > 70 && x < 190 ? 0.35 : 1;
      if (hh * gap > height[x]) height[x] = hh * gap;
    }
  }
  for (let x = 0; x < GAME_W; x++) {
    const top = HORIZON - Math.round(height[x]);
    for (let y = top; y < HORIZON; y++) b.set(x, y, y === top && (x * 7) % 3 === 0 ? rim : sil);
  }

  // --- the stronghold
  const block = (x0: number, y0: number, w: number, h: number): void => {
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) b.set(x, y, sil);
    for (let x = x0; x < x0 + w; x++) b.set(x, y0, rim);
    for (let y = y0; y < y0 + h; y++) b.set(x0, y, rim);
  };
  const roof = (cx: number, baseY: number, half: number, h: number): void => {
    for (let j = 0; j < h; j++) {
      const hw = Math.round(half * (1 - j / h));
      for (let x = cx - hw; x <= cx + hw; x++) b.set(x, baseY - j, x === cx - hw ? rim : sil);
    }
  };
  const lit = rgb(p.window);
  if (world === 'jawia') {
    // only the belfry is left above the water, leaning
    const tx = 128;
    for (let j = 0; j < 20; j++) {
      const lean = Math.round(j * 0.18);
      const y = HORIZON - 1 - j;
      for (let x = tx - 5; x <= tx + 5; x++) b.set(x + lean, y, x === tx - 5 ? rim : sil);
      if (j > 6 && j < 14) for (let x = tx - 3; x <= tx + 3; x++) b.set(x + lean, y, stops[5]); // open belfry: sky shows through
      if (j > 8 && j < 13) for (let x = tx - 1; x <= tx + 1; x++) b.set(x + lean, y, sil); // the silent bell
    }
    for (let j = 0; j < 12; j++) {
      const hw = Math.round(8 * (1 - j / 12));
      for (let x = tx - hw; x <= tx + hw; x++) b.set(x + 4 + Math.round(j * 0.2), HORIZON - 21 - j, x === tx - hw ? rim : sil);
    }
    // a few stakes of the old palisade
    for (const [sx, sh] of [[96, 5], [104, 7], [150, 6], [161, 4], [171, 6]]) for (let j = 0; j < sh; j++) b.set(sx, HORIZON - 1 - j, sil);
  } else {
    // whole, as it was: palisade, halls, gate, the bell tower with its light
    for (let x = 62; x < 196; x++) {
      const h = 11 + ((x * 13) % 4 === 0 ? 2 : 0);
      for (let y = HORIZON - h; y < HORIZON; y++) b.set(x, y, y === HORIZON - h ? rim : sil);
    }
    block(78, HORIZON - 22, 22, 22); roof(89, HORIZON - 22, 14, 11);
    block(150, HORIZON - 19, 26, 19); roof(163, HORIZON - 19, 16, 10);
    block(104, HORIZON - 16, 16, 16); roof(112, HORIZON - 16, 10, 7);
    // bell tower
    block(122, HORIZON - 33, 13, 33); roof(128, HORIZON - 33, 10, 11);
    for (let y = HORIZON - 30; y < HORIZON - 22; y++) for (let x = 125; x < 132; x++) b.set(x, y, lit);
    for (let y = HORIZON - 28; y < HORIZON - 24; y++) for (let x = 127; x < 130; x++) b.set(x, y, sil);
    // windows
    for (const [wx, wy] of [[84, 12], [92, 12], [156, 10], [168, 10], [110, 8], [127, 16], [127, 9]]) {
      b.set(wx, HORIZON - wy, lit); b.set(wx + 1, HORIZON - wy, lit); b.set(wx, HORIZON - wy + 1, lit); b.set(wx + 1, HORIZON - wy + 1, lit);
    }
    // halo around the belfry light
    for (let y = -12; y <= 12; y++)
      for (let x = -12; x <= 12; x++) {
        const d = Math.hypot(x, y) / 12;
        if (d < 1 && (1 - d) * (1 - d) * 0.8 > bayer(x + 128, y + 61)) b.plot(128 + x, HORIZON - 26 + y, withAlpha(lit, 70));
      }
  }

  // --- the logo
  const text = 'NAWIA';
  const scale = 4;
  const small = new PixelBuffer(measure(text) + 2, 12);
  drawText(small, text, 1, 0, rgb(0xffffff));
  const lw = small.w * scale;
  const lx = Math.floor((GAME_W - lw) / 2);
  const ly = 8;
  const edge = rgb(p.logoEdge);
  const on = (x: number, y: number): boolean => small.get(Math.floor(x / scale), Math.floor(y / scale)) !== 0;
  for (let y = -2; y < small.h * scale + 4; y++)
    for (let x = -2; x < lw + 2; x++) {
      if (on(x, y)) continue;
      // chunky outline + drop shadow
      let near = false;
      for (let oy = -2; oy <= 3 && !near; oy++) for (let ox = -2; ox <= 2 && !near; ox++) if (x + ox >= 0 && y - oy >= 0 && on(x + ox, y - oy)) near = true;
      if (near) b.set(lx + x, ly + y, edge);
    }
  const top = rgb(p.logoTop);
  const bottom = rgb(p.logoBottom);
  for (let y = 0; y < small.h * scale; y++)
    for (let x = 0; x < lw; x++) {
      if (!on(x, y)) continue;
      const t = (y - 2 * scale) / (7 * scale);
      let c = t + (bayer(x, y) - 0.5) * 0.35 > 0.55 ? bottom : top;
      if (!on(x, y - 1)) c = rgb(0xffffff); // top bevel
      else if (!on(x, y + 1)) c = shade(bottom, 0.7);
      b.set(lx + x, ly + y, c);
    }

  // --- water: the upper half mirrored, darker, rippling
  for (let y = HORIZON; y < GAME_H; y++) {
    const depth = y - HORIZON;
    const srcY = HORIZON - 1 - Math.floor(depth * 1.36);
    const wobble = Math.round(Math.sin(depth * 0.9) * Math.min(3, depth / 9) + Math.sin(depth * 0.31 + 2) * Math.min(2, depth / 18));
    for (let x = 0; x < GAME_W; x++) {
      const sx = Math.max(0, Math.min(GAME_W - 1, x + wobble));
      let c = srcY >= 0 ? b.get(sx, srcY) : stops[0];
      c = mix(c, rgb(world === 'jawia' ? 0x0a0d20 : 0x04050d), 0.34 + Math.min(0.4, depth / 150));
      // glints: broken horizontal dashes
      if ((depth % 3 === 1) && ((x + depth * 5) % 11 < 4) && srcY >= 0) c = shade(c, 1.35);
      b.set(x, y, c);
    }
  }
  for (let x = 0; x < GAME_W; x++) b.set(x, HORIZON, mix(b.get(x, HORIZON), rgb(p.mist), 0.35));

  // --- mist lying on the lake
  const mist = rgb(p.mist);
  for (let y = HORIZON - 9; y < HORIZON + 13; y++)
    for (let x = 0; x < GAME_W; x++) {
      const d = 1 - Math.abs(y - (HORIZON + 1)) / 12;
      const wave = 0.5 + 0.5 * Math.sin(x * 0.045 + y * 0.4) * Math.sin(x * 0.013 + 1.7);
      if (d * wave * 0.85 > bayer(x, y)) b.plot(x, y, withAlpha(mist, world === 'nawia' ? 120 : 84));
    }

  // --- reeds in the foreground
  const reed = rgb(world === 'jawia' ? 0x05050a : 0x020308);
  const reedRim = rgb(p.rim);
  const stalks: [number, number][] = [];
  for (let i = 0; i < 26; i++) stalks.push([Math.floor(rng() * 66), 18 + rng() * 34]);
  for (let i = 0; i < 22; i++) stalks.push([GAME_W - 1 - Math.floor(rng() * 54), 14 + rng() * 30]);
  for (const [x0, h] of stalks) {
    const lean = (rng() - 0.5) * 0.3;
    for (let j = 0; j < h; j++) {
      const x = Math.round(x0 + j * lean);
      b.set(x, GAME_H - 1 - j, reed);
      if (j > h - 8 && j < h - 2 && h > 24) { b.set(x + 1, GAME_H - 1 - j, reed); b.set(x - 1, GAME_H - 1 - j, j % 2 ? reed : reedRim); }
    }
  }
  for (let x = 0; x < GAME_W; x++) {
    const shore = 3 + Math.round(4 * Math.max(0, Math.sin(x * 0.02 + 0.4)) * (x < 80 || x > 250 ? 1 : 0.2));
    // a low rise on the near shore, where someone stands looking at the lake
    const rise = Math.round(12 * Math.exp(-Math.pow((x - 104) / 34, 2)));
    for (let j = 0; j < Math.max(shore, rise); j++) b.set(x, GAME_H - 1 - j, reed);
  }

  // --- the hero, from behind: sword, shield, and the long way down
  const hero = heroFromBehind();
  const hx = 104 - 16;
  const hy = GAME_H - 11 - 30;
  for (let y = 0; y < hero.h; y++)
    for (let x = 0; x < hero.w; x++) {
      if (hero.get(x, y) === 0) continue;
      // lit from the moon's side: a thin rim on the right and on top
      const edge = hero.get(x + 1, y) === 0 || hero.get(x, y - 1) === 0;
      b.set(hx + x, hy + y, edge ? rgb(p.mist) : reed);
    }
  return b;
}

/** Blank dark card used behind the intro and ending texts. */
export function makeCard(color: Color): PixelBuffer {
  return new PixelBuffer(GAME_W, GAME_H).fill(color);
}
