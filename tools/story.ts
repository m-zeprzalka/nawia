// Loads every dialog file from disk (the game does the same through Vite's import.meta.glob).
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseDialogs, type Dialogs } from '../src/story/dialog.ts';

export const STORY_DIR = join(import.meta.dirname, '../src/story');

export function loadDialogs(): Dialogs {
  const dialogs: Dialogs = new Map();
  for (const f of readdirSync(STORY_DIR).filter((n) => n.endsWith('.dialog.txt')).sort()) parseDialogs(readFileSync(join(STORY_DIR, f), 'utf8'), f, dialogs);
  return dialogs;
}
