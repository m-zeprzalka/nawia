// C8b: C8 without its line.
//
// The art lead: "C8 would be fine without the outline". The drawings are C8's; the line is gone, so the
// figure holds together by its own tones, the way C1 and S3 do. One pixel changes: the tip of the nose in
// the profile, which stuck out past the face (the same fault the art lead found in C1b), is cut back.

import type { Concept, Frames } from './concept.ts';
import { CONCEPT as C8 } from './polnoc.concept.ts';

/** In the profile the nose was a skin pixel past the line of the face; the face now ends flat. */
const flatFace = (rows: string[]): string[] => rows.map((r) => r.replace('HSsss...', 'HSss....'));

const side = C8.frames.side.map(flatFace) as unknown as Frames;

export const CONCEPT: Concept = {
  ...C8,
  code: 'C8b',
  id: 'polnoc-b',
  name: { pl: 'Z Północy, bez konturu', en: 'Northman, no line' },
  note: {
    pl: "C8 bez konturu: postać trzyma się własnymi tonami jak C1 i S3; z boku bez wystającego nosa",
    en: "C8 without its line: the figure holds by its own tones, like C1 and S3; no nose sticking out in the profile",
  },
  frames: { ...C8.frames, side },
  ink: 'none',
};
