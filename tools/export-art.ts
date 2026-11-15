// Writes every generated placeholder sheet to art-template/ as PNG, in the exact grid the game expects.
// Workflow for real art: paint over a file, save it under /assets with the same name, rebuild. Done.
//   npm run art:export
import { join } from 'node:path';
import { PixelBuffer } from '../src/core/PixelBuffer.ts';
import { makeTileset } from '../src/art/tiles.ts';
import { UI, makeSheets } from '../src/art/sprites.ts';
import { writePng } from './png.ts';

const root = join(import.meta.dirname, '..');
const out = join(root, 'art-template');

writePng(join(out, 'tiles_jawia.png'), makeTileset('jawia'));
writePng(join(out, 'tiles_nawia.png'), makeTileset('nawia'));
const sheets = makeSheets();
for (const s of sheets) writePng(join(out, `${s.key}.png`), s.buf);
console.log(`wrote ${sheets.length + 2} sheets to art-template/`);

// the favicon is the hag stone from the UI sheet
if (process.argv.includes('--favicon')) {
  const ui = sheets.find((s) => s.key === 'ui')!;
  const icon = new PixelBuffer(16, 16);
  icon.copy(ui.buf, 0, 1, UI.STONE_J * UI.fw, 0, 16, 14);
  writePng(join(root, 'public', 'favicon.png'), icon.scaled(4));
  console.log('wrote public/favicon.png');
}
