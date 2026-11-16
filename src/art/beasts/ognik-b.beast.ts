// M13, Ognik: the surveyor's wisp. An alternative to P1 (the game's green flame). 16 x 16, facing us.
//
// The idea: the lore's wandering lights are the souls of dishonest land surveyors, unjust lords and unbaptised
// children, and they lead people into the bog. In Jawia it is only the lure: a warm, friendly little light, the
// kind you take for someone's lantern across the marsh. No face and no eyes; it is meant to look kind.
//
// How it moves: like a light someone is carrying. The flame leans one way, sinks and squats, leans the other way,
// stretches up and splits at the tip, so it sways at the pace of a walker nobody can see.
// How it attacks: it gathers itself into a small dark-red knot (the wind-up), then flares into a burst of fire
// and spits a gob of it down at you.
//
// Nawia: you can see it is a soul. The same light turns cold, and inside it stands whoever carries it: the shadow
// of a surveyor in a wide hat, his eyes two white points, his measuring pole (bone-white, marked with the measure,
// a cross-staff on top) in one hand and a surveyor's chain hanging from the other. He sways in step with the light;
// to strike he dims, lifts the pole and drives it down as the cold light flares.
//
// The light has no line ('none'): its darkest red is its edge on the grass. In Nawia the line is a dim blue, so it
// reads as the last ring of the glow.

import type { Beast } from './beast.ts';

const W = 16;
const H = 16;

/** Lays parts on an empty frame, each moved `dx` columns and `dy` rows; a later part covers an earlier one. */
function put(...parts: [number, number, string[]][]): string[] {
  const grid = Array.from({ length: H }, () => Array<string>(W).fill('.'));
  for (const [dx, dy, rows] of parts)
    rows.forEach((r, y) =>
      [...r].forEach((ch, x) => {
        const tx = x + dx;
        const ty = y + dy;
        if (ch !== '.' && tx >= 0 && tx < W && ty >= 0 && ty < H - 1) grid[ty][tx] = ch;
      }),
    );
  return grid.map((r) => r.join(''));
}

// ------------------------------------------------------------------ Jawia: the lure

/** at rest: a tall warm light, white at its heart, its darkest red on the lower right */
const STAND = [
  '........o.......',
  '.......oo.......',
  '.......ryo......',
  '......royoR.....',
  '.....royWyoR....',
  '.....oyWWyoR....',
  '....royWWWyoR...',
  '....oyWWWWyoR...',
  '....oyyWWWyoR...',
  '....royyWyyoR...',
  '.....royyyoR....',
  '.....RroooRR....',
  '......RRrRR.....',
  '................',
  '................',
  '................',
];
/** the sway, played in this order: leans left; sinks and squats; leans right; stretches and splits at the tip */
const WALK = [
  [
    '.....o..........',
    '.....oo.........',
    '.....ryo........',
    '.....royo.......',
    '.....royyoR.....',
    '....royWWyoR....',
    '....royWWWyoR...',
    '....oyWWWWyoR...',
    '....oyyWWWyoR...',
    '....royyWyyoR...',
    '.....royyyoR....',
    '.....RroooRR....',
    '......RRrRR.....',
    '................',
    '................',
    '................',
  ],
  [
    '................',
    '................',
    '........o.......',
    '.......roo......',
    '......royoR.....',
    '.....royyyoR....',
    '....royWWWyoR...',
    '....oyWWWWyoR...',
    '....oyWWWWyoR...',
    '....oyyWWWyoR...',
    '....royyWyyoR...',
    '.....royyyoR....',
    '.....RroooRR....',
    '......RRrRR.....',
    '................',
    '................',
  ],
  [
    '..........o.....',
    '.........oo.....',
    '........ryoR....',
    '.......royoR....',
    '......royyoR....',
    '.....royWyoR....',
    '....royWWWyoR...',
    '....oyWWWWyoR...',
    '....oyyWWWyoR...',
    '....royyWyyoR...',
    '.....royyyoR....',
    '.....RroooRR....',
    '......RRrRR.....',
    '................',
    '................',
    '................',
  ],
  [
    '.......o..o.....',
    '.......oo.o.....',
    '.......ryoo.....',
    '......royoR.....',
    '.....royWyoR....',
    '.....oyWWyoR....',
    '....royWWWyoR...',
    '....oyWWWWyoR...',
    '....oyyWWWyoR...',
    '....royyWyyoR...',
    '.....royyyoR....',
    '.....RroooRR....',
    '......RRrRR.....',
    '................',
    '................',
    '................',
  ],
];
/** the wind-up (it draws itself into a dark knot, a little higher) and the blow (it flares and spits fire down) */
const ATTACK = [
  [
    '................',
    '................',
    '........r.......',
    '.......rR.......',
    '.......roR......',
    '......royoR.....',
    '......ryWyR.....',
    '......royoR.....',
    '.......RrR......',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
  [
    '......o...o.....',
    '...o..oo.oo..o..',
    '...oo.royyo.oo..',
    '....ooyWWWyoo...',
    '..o.oyWWWWWyo.o.',
    '..ooyWWWWWWWyoo.',
    '.rooyWWWWWWWyooR',
    '..royWWWWWWWyoR.',
    '...royWWWWWyoR..',
    '..r.royWWWyoR.R.',
    '....rroyWyorR...',
    '.......yWy......',
    '.......yWy......',
    '.......oyo......',
    '........r.......',
    '................',
  ],
];

// ------------------------------------------------------------------ Nawia: the soul inside the light

/**
 * The surveyor's shadow (D) in the cold light, which is brightest where it touches him. Eyes e under the hat
 * brim (row 4); the pole at column 12 (b bone, d the marks, the cross-staff on row 0), his hand h on it; his
 * other hand h at column 3 with the chain (d b) hanging from it. He has no feet: the coat frays into the light.
 */
const NSTAND = [
  '.....oyyyo.bdb..',
  '....oyDDDyo.d...',
  '...oyyDDDyyob...',
  '..oyDDDDDDDyb...',
  '..RoyDeDeDyod...',
  '..RroyDDDyyyb...',
  '..royDDDDDDDhy..',
  '.RryDDDDDDyydo..',
  '.RryDyDDDDyobR..',
  '.RoyDyDDDDyobR..',
  '.RyhyyDDDDyodR..',
  '..odoyDDDDDyb...',
  '..RbyDDDDDDyb...',
  '...RdDyDDyDyd...',
  '....oyDyyDy.b...',
  '................',
];
/** the same with the hem blown the other way, for the sway */
const NSTAND_B = [
  ...NSTAND.slice(0, 13),
  '...byDDyDyDDd...',
  '....oyyDyoyDb...',
  '................',
];
const NWALK = [put([-1, 0, NSTAND]), put([0, 1, NSTAND_B]), put([1, 0, NSTAND]), NSTAND_B];
/** the wind-up (the light dims to a ring, the pole is lifted, the hand at the top) and the blow (it flares) */
const NATTACK = [
  [
    '......ooo...b...',
    '.....oDDDo..d...',
    '....ooDDDoo.b...',
    '...oDDDDDDDoho..',
    '....oDeDeDoDd...',
    '...RroDDDoDob...',
    '...roDDDDDorb...',
    '..RoDDDDDDord...',
    '..RoDoDDDDorb...',
    '...oDoDDDDorb...',
    '..ohooDDDDoRd...',
    '...droDDDDDo....',
    '...boDDDDDDo....',
    '....dDoDDoDo....',
    '.....oDooDo.....',
    '................',
  ],
  [
    '......RrrrR.....',
    '.....RrooorR....',
    '....RryWWWyrbdb.',
    '....roWDDDWorb..',
    '...RyWWDDDWWyb..',
    '..RoWDDDDDDDWdR.',
    '..royWDeDeDWybr.',
    '.RroyWWDDDWWWbyR',
    '.RooyWDDDDDDDhWo',
    '.RroWDDDDDDWWbyR',
    '.RryWDWDDDDWybrR',
    '.RoWhWWDDDDWydrR',
    '..rydyWDDDDDWbr.',
    '..RrbWDDDDDDWbR.',
    '...RodDWDDWDWd..',
    '................',
  ],
];

export const BEAST: Beast = {
  code: 'M13',
  id: 'ognik-b',
  kind: { pl: 'Ognik', en: 'Wisp' },
  name: { pl: 'ognik mierniczego', en: "the surveyor's wisp" },
  note: {
    pl: 'Ciepłe światełko kołysze się nad bagnem jak czyjaś latarnia i wabi w topiel. Gdy ktoś podejdzie, zbiera się i bucha ogniem.',
    en: "A warm light sways over the bog like someone's lantern and lures you in. Come close and it gathers itself and spits fire.",
  },
  alt: ['P1'],
  w: 16,
  h: 16,
  view: 'front',
  ink: 'none',
  pal: {
    W: 0xfffbe6, // the heart of the light
    y: 0xffe08a,
    o: 0xf8ae4a,
    r: 0xe07434,
    R: 0xa84a2c, // its edge, on the shadow side
  },
  frames: { stand: STAND, walk: WALK, attack: ATTACK },
  nawia: {
    pal: {
      W: 0xf0ffff, // the cold light, brightest next to him
      y: 0xbde8f4,
      o: 0x78b4d8,
      r: 0x3a6aa0,
      R: 0x1c3460,
      D: 0x141a34, // his shadow
      e: 0xffffff, // the eyes
      h: 0xc8d4d8, // the hands
      b: 0xd8d8c4, // the pole and the chain, bone
      d: 0x3a4058, // the marks of the measure
    },
    frames: { stand: NSTAND, walk: NWALK, attack: NATTACK },
    ink: { ink: 'dark', outline: 0x2a4a80 },
    note: { pl: 'W zimnym świetle widać duszę: nieuczciwego mierniczego z prętem i łańcuchem.', en: 'In the cold light the soul shows: a dishonest surveyor with his pole and chain.' },
  },
};
