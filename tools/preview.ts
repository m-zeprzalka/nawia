// Dev helper: renders tilesets and every room (both worlds) to PNG so art can be reviewed without a browser.
//   node tools/preview.ts <outDir> [scale]
import { join } from 'node:path';
import { PixelBuffer } from '../src/core/PixelBuffer.ts';
import { makeTileset } from '../src/art/tiles.ts';
import { makeSheets, makeFog, makeGlow } from '../src/art/sprites.ts';
import { rgb } from '../src/core/PixelBuffer.ts';
import { renderText } from '../src/art/font.ts';
import { makeTitle } from '../src/art/title.ts';
import { paintRoom } from '../src/world/painter.ts';
import { loadDungeon } from './rooms.ts';
import { writePng } from './png.ts';

const out = process.argv[2] ?? 'art-template/preview';
const scale = Number(process.argv[3] ?? 3);
const tilesets = { jawia: makeTileset('jawia'), nawia: makeTileset('nawia') };
writePng(join(out, 'tiles_jawia.png'), tilesets.jawia.scaled(4));
writePng(join(out, 'tiles_nawia.png'), tilesets.nawia.scaled(4));

for (const sheet of makeSheets()) {
  // sprites are previewed on a mid-grey card so both light and dark pixels are visible
  const card = new PixelBuffer(sheet.buf.w, sheet.buf.h).fill(rgb(0x4a4a55));
  card.blit(sheet.buf, 0, 0);
  writePng(join(out, `sheet_${sheet.key}.png`), card.scaled(sheet.key === 'px' ? 8 : 6));
}
{
  const fog = new PixelBuffer(256, 128).fill(rgb(0x20222c));
  fog.blit(makeFog(), 0, 0);
  writePng(join(out, 'fog.png'), fog.scaled(3));
  const glow = new PixelBuffer(48, 48).fill(rgb(0x20222c));
  glow.blit(makeGlow(), 0, 0);
  writePng(join(out, 'glow.png'), glow.scaled(4));
}

{
  const sample = [
    'NAWIA — Dzwon w zatopionym grodzie od lat milczy.',
    'Zażółć gęślą jaźń. ZAŻÓŁĆ GĘŚLĄ JAŹŃ! „Kurzy bóg”…',
    'The quick brown fox jumps over the lazy dog? 0123456789',
    '[SHIFT] przekręć kamień   [Z] cios   (A/B) + - = * / : ; \' "',
    'Tu kończy się droga żywych. Dalej tylko gruz i woda.',
  ].join('\n');
  const t = renderText(sample, { color: rgb(0xeee8de), shadow: rgb(0x15121b) });
  const card = new PixelBuffer(t.w + 8, t.h + 8).fill(rgb(0x2b2a33));
  card.blit(t, 4, 4);
  writePng(join(out, 'font.png'), card.scaled(3));
}

writePng(join(out, 'title_jawia.png'), makeTitle('jawia').scaled(3));
writePng(join(out, 'title_nawia.png'), makeTitle('nawia').scaled(3));

const dungeon = loadDungeon();
const only = process.argv[4];
for (const room of dungeon.rooms) {
  if (only && !room.id.includes(only)) continue;
  const p = paintRoom(room, dungeon, tilesets);
  const both = new PixelBuffer(p.w, p.h * 2 + 4);
  both.copy(p.buffers.jawia, 0, 0);
  both.copy(p.buffers.nawia, 0, p.h + 4);
  // what hangs over the hero's head (tree crowns, roof ridges) goes on top
  if (p.overhead) {
    both.blit(p.overhead.jawia, 0, 0);
    both.blit(p.overhead.nawia, 0, p.h + 4);
  }
  writePng(join(out, `room_${room.id}.png`), both.scaled(scale));
}
console.log(`previews written to ${out}`);
