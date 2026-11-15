// Every hero concept there is: each `<id>.concept.ts` file next to this one, found by its name.
// A new concept needs no registration here; where it stands is decided in src/lab/lineup.txt.

import type { Concept } from './concept.ts';

const files = import.meta.glob('./*.concept.ts', { eager: true, import: 'CONCEPT' }) as Record<string, Concept>;

export const CONCEPTS: Concept[] = Object.values(files).sort((a, b) => a.code.localeCompare(b.code, 'en', { numeric: true }));
