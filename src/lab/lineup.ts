// Reads src/lab/lineup.txt: which exhibits stand on the playground board (heroes on the left, monsters on the
// right), in what order, under what headings, and which are archived. Pure, so node tools can read the file too; the playground loads it through labData.ts.

import type { Bilingual } from '../world/roomFormat.ts';

export interface LineupRow {
  heading: Bilingual | null;
  codes: string[];
}

export interface Lineup {
  /** groups of the hero board, in order; a group longer than a row goes on in the next one */
  board: LineupRow[];
  /** groups of the monster board, the same way */
  monsters: LineupRow[];
  archive: string[];
}

export function parseLineup(text: string): Lineup {
  const board: LineupRow[] = [];
  const monsters: LineupRow[] = [];
  const archive: string[] = [];
  let part = 'none' as 'none' | 'board' | 'monsters' | 'archive';
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('//')) continue;
    if (line === 'board:' || line === 'monsters:' || line === 'archive:') {
      part = line.slice(0, -1) as typeof part;
      continue;
    }
    const rows = part === 'board' ? board : part === 'monsters' ? monsters : null;
    if (rows && line.startsWith('*')) {
      const [pl, en] = line.slice(1).split('|').map((s) => s.trim());
      rows.push({ heading: { pl, en: en || pl }, codes: [] });
      continue;
    }
    const code = line.split(/\s+/)[0];
    if (rows) {
      if (!rows.length) rows.push({ heading: null, codes: [] });
      rows[rows.length - 1].codes.push(code);
    } else if (part === 'archive') archive.push(code);
  }
  return { board, monsters, archive };
}
