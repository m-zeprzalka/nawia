// Reads src/lab/lineup.txt: which exhibits stand on the playground board, in what order, under what headings,
// and which are archived. Pure, so node tools can read the file too; the playground loads it through labData.ts.

import type { Bilingual } from '../world/roomFormat.ts';

export interface LineupRow {
  heading: Bilingual | null;
  codes: string[];
}

export interface Lineup {
  /** groups of the board, in order; a group longer than a row goes on in the next one */
  board: LineupRow[];
  archive: string[];
}

export function parseLineup(text: string): Lineup {
  const board: LineupRow[] = [];
  const archive: string[] = [];
  let part: 'none' | 'board' | 'archive' = 'none';
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('//')) continue;
    if (line === 'board:') {
      part = 'board';
      continue;
    }
    if (line === 'archive:') {
      part = 'archive';
      continue;
    }
    if (part === 'board' && line.startsWith('*')) {
      const [pl, en] = line.slice(1).split('|').map((s) => s.trim());
      board.push({ heading: { pl, en: en || pl }, codes: [] });
      continue;
    }
    const code = line.split(/\s+/)[0];
    if (part === 'board') {
      if (!board.length) board.push({ heading: null, codes: [] });
      board[board.length - 1].codes.push(code);
    } else if (part === 'archive') archive.push(code);
  }
  return { board, archive };
}
