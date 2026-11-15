// Browser-side loader: Vite inlines every dialog file as a string at build time.
import { checkDialogs, parseDialogs, type Dialogs } from './dialog.ts';

const files = import.meta.glob('./*.dialog.txt', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>;

export function loadDialogs(): Dialogs {
  const dialogs: Dialogs = new Map();
  for (const path of Object.keys(files).sort()) parseDialogs(files[path], path.split('/').pop(), dialogs);
  if (import.meta.env.DEV) for (const p of checkDialogs(dialogs)) console.warn(`[story] ${p}`);
  return dialogs;
}
