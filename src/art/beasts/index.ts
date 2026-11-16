// Every monster drawn whole: each `*.beast.ts` next to this file, in code order (M1, M2, ... M10).
import type { Beast } from './beast.ts';

const files = import.meta.glob('./*.beast.ts', { eager: true, import: 'BEAST' }) as Record<string, Beast>;

export const BEASTS: Beast[] = Object.values(files).sort((a, b) => a.code.localeCompare(b.code, 'en', { numeric: true }));
