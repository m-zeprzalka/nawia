// C1h: C1f (the second, independent profile: very slim, the shield hidden behind him, a wide stride) with the
// eye in profile drawn the way it is facing us (16 x 16).
//
// As in C1g: facing us, an eye is a dark lid over a white and a blue iris, on rows 4 and 5 of the head; in
// C1f's profile it was one dark pixel on row 4, a row too high and not like the eye facing us. Here it is the
// lid (S K) on row 4 and the white and the iris (b p) on row 5, the iris in front; the cheek behind the white
// is plain skin (C1f's light skin there merged with the white).
//
// The side is drawn as whole frames, pixel for pixel as they show: change a pixel here and it changes in that
// one frame only (the head is in each of the three). Facing us and from behind it is C1g's (and C1's).
// See docs/HERO-DRAWING.md.

import type { Concept, Frames } from './concept.ts';
import { CONCEPT as C1G } from './najlepszy-g.concept.ts';

const side: Frames = [
  // standing
  [
    '......hlhh......',
    '......llhhh.....',
    '.....hllhhhh....',
    '.....hlhhhhH....',
    '.....hhhhSKs....',
    '......Hhsbps....',
    '.....H..sss.....',
    '.....rRbbbr.....',
    '.....rRabAa.....',
    '.....RCarRA.....',
    '.....RCkskl.....',
    '.....RCaaaA.....',
    '.....RC.pP......',
    '.......PpP......',
    '.......KkkK.....',
    '................',
  ],
  // stride
  [
    '................',
    '......hlhh......',
    '......llhhh.....',
    '.....hllhhhh....',
    '.....hlhhhhH....',
    '.....hhhhSKs....',
    '......Hhsbps....',
    '.....H..sss.....',
    '.....rRbbbr.....',
    '....rRbaaAa.....',
    '....RrCkkkl.....',
    '...rsRCaaaA.....',
    '...RC..Pppp.....',
    '.....PP...pp....',
    '....KK....kkk...',
    '................',
  ],
  // the other stride
  [
    '................',
    '......hlhh......',
    '......llhhh.....',
    '.....hllhhhh....',
    '.....hlhhhhH....',
    '.....hhhhSKs....',
    '......Hhsbps....',
    '.....H..sss.....',
    '.....rRbbbr.....',
    '.....rRaabA.....',
    '....rRCkkkbrs...',
    '....RCCaaaA.....',
    '...RC..ppPP.....',
    '.....pp...PP....',
    '....kk....KKK...',
    '................',
  ],
];

export const CONCEPT: Concept = {
  ...C1G,
  code: 'C1h',
  id: 'najlepszy-h',
  name: { pl: 'Najlepszy', en: 'Best of' },
  note: {
    pl: 'C1f (bardzo smukły, tarcza schowana, długi krok) z okiem z boku takim jak z przodu: powieka nad białkiem i tęczówką',
    en: 'C1f (very slim, the shield hidden, a long stride) with the eye in profile as it is facing us: a lid over a white and an iris',
  },
  frames: { ...C1G.frames, side },
};
