// M6: the water-man (wodnik), lord of the lake: an alternative to P8. Two tiles, 24 x 32, drawn facing us.
//
// The idea: the old master of the waters, who drowns people and keeps the souls of the drowned under
// upturned pots on the bottom of the lake. A big, stooped old man, grey-green and wet: a bald crown, a heavy
// brow over two small glowing eyes, a long nose, a beard of weed to his belly and wet hair hanging at the
// sides; a sodden coat tied with a rope of weed, dripping at the hem; bare webbed feet. He carries one of
// his pots hanging from his hand by its foot, mouth down, like a bell.
//
// He moves heavily: a webbed foot lifts, the body drops a pixel, the beard and the pot swing. He attacks
// with the pot: he lifts it over his bowed head in both hands, the sleeves slipping back off the bare
// forearms, then slams it down mouth first in front of him in a splash, to catch you under it.
//
// Nawia: the same frames in the cold colours, and the pot shows what it keeps: the soul of a drowned one,
// a crack of light through the dark clay, a glow under the rim and thin threads of light hanging from it;
// when he slams the pot down, the light floods out over the ground.
//
// Frames are written out whole: one letter one colour, '.' empty (see docs/HERO-DRAWING.md).

import type { Beast } from './beast.ts';

// ------------------------------------------------------------------ Jawia

// the pot hanging from his hand by its foot
const STAND = [
  '........................',
  '........................',
  '........................',
  '..........ttg...........',
  '...aaw...tttgg...cC.....',
  '..aaccaWtttgggG.WcCC....',
  '.aaccccwtgggggGGWcCCC...',
  'aacccccwgCCggCCGWccCCC..',
  'accccccwgeGtgGeGWcccCCC.',
  'acCccccWGgGtggGGWccCcCC.',
  'acCccccWCGwtGwGcWcC.cCC.',
  'acCccccWwywwwwwWWcC.cCC.',
  'acCcccCCwywWwwWWccC.cCC.',
  'acCcccCCWwywCwwWccC.cCC.',
  'acCwyww..wyw.wWwwwW.cCC.',
  'acCcccCcCWywwwwCccC.cCC.',
  'aaCccccCCCwyWwWcccC.cCC.',
  'CCCcccCCCCwwWCWCccC.CCC.',
  'tggcccCcCCWwCCWCccC.gtG.',
  'tggGcccCCCCwCCWcccCrpPG.',
  'gGgGccCcCCCWCCcCcCrrppP.',
  'g.GcccCcccCdcccCcrrpppPP',
  '.aacccCccccCcccCcrpppppP',
  '.acccCccccCccccCcrPPPPPP',
  '.accCcccCccccCcccrppppPP',
  '.aC.cC.gcC.cC.cG.PPPPPPP',
  '..d....tgd....gGduuuuuuu',
  '.......tg.....gG........',
  '......tgG.....tgG.......',
  '....tggGg....tgGgGG.....',
  '...g.G.G.....G.G.G......',
  '........................',
];

// a heavy step on each foot: the foot lifts, the body drops a pixel, the beard and the pot swing
const WALK = [
  // his right foot lifted
  [
    '........................',
    '........................',
    '........................',
    '........................',
    '..........ttg...........',
    '...aaw...tttgg...cC.....',
    '..aaccaWtttgggG.WcCC....',
    '.aaccccwtgggggGGWcCCC...',
    'aacccccwgCCggCCGWccCCC..',
    'accccccwgeGtgGeGWcccCCC.',
    'acCccccWGgGtggGGWccCcCC.',
    'acCccccWCGwtGwGwWcC.cCC.',
    'acCccccWCwywwwwwWcC.cCC.',
    'acCcccCCCwywWwwWWcC.cCC.',
    'acCcccCCCWwywCwwWcC.cCC.',
    'acCwyww...wyw.wWwwW.cCC.',
    'acCcccCcCCWywwwwccC.cCC.',
    'aaCccccCCCCwyWwWccC.cCC.',
    'CCCcccCCCCCwwWCWccC.CCC.',
    'tggcccCcCCCWwCcWccC.gtG.',
    'tggGcccCCCCCwCCWccrpPgG.',
    'gGgGccCcCCCCWCcCcrrppP..',
    'g.GcccCcccCCdccCrrpppPP.',
    '.aacccCccccCcccCrpppppP.',
    '.acccCccccCccccCrPPPPPP.',
    '.accCcccCccccCccrppppPP.',
    '.aC.cC.ccC.cC.cCPPPPPPP.',
    '..d...tgGd....gGuuuuuuu.',
    '....tggGg.....tgG.......',
    '.............tgGgGG.....',
    '.............G.G.G......',
    '........................',
  ],
  // his left foot lifted
  [
    '........................',
    '........................',
    '........................',
    '........................',
    '..........ttg...........',
    '...aaw...tttgg...cC.....',
    '..aaccaWtttgggG.WcCC....',
    '.aaccccwtgggggGGWcCCC...',
    'aacccccwgCCggCCGWccCCC..',
    'accccccwgeGtgGeGWcccCCC.',
    'acCccccWGgGtggGGWccCcCC.',
    'acCccccWwGwtGwGcWcC.cCC.',
    'acCccccwywwwwwWcWcC.cCC.',
    'acCcccCwywWwwWWcccC.cCC.',
    'acCcccCWwywCwwWcccC.cCC.',
    'acCwyww.wyw.wWwwwwW.cCC.',
    'acCcccCcWywwwwcCccC.cCC.',
    'aaCccccCCwyWwWCcccC.cCC.',
    'CCCcccCCCwwWCWCCccC.CCC.',
    'tggcccCcCWwCCWcCccC.rpP.',
    'tggGcccCCCwCCWCcccCrrppP',
    'gGgGccCcCCWCCCcCcCrrpppP',
    'g.GcccCcccdCcccCccrppppp',
    '.aacccCccccCcccCccrPPPPP',
    '.acccCccccCccccCccrppppP',
    '.accCcccCccccCcccCPPPPPP',
    '.aC.cC.ccC.cC.cC.Cuuuuuu',
    '..d....tgd....tgd.......',
    '......tgG....tgGgGG.....',
    '....tggGg...............',
    '...g.G.G................',
    '........................',
  ],
];

// the pot lifted overhead, then slammed down in front of him
const ATTACK = [
  // wind-up: the pot overhead
  [
    '......tg..rpPP..gG......',
    '......tgGrrppPPtgG......',
    '.....tgGrrpppPPPgG......',
    '....tgG.rPPPPPPP.gG.....',
    '...tgG..rppppPPP.tgG....',
    '..acCw..PPPPPPPP.ccCC...',
    '.aacCca.uuuuuuuuccccCC..',
    '.acCccca.tttgg.cccCcCC..',
    '.acccccWtttgggGcWccCC...',
    '.acccccwtgggggGGWcccC...',
    '.acccccwgCCggCCGWccC....',
    '..accccwgeGtgGeGWcC.....',
    '..accccWGgGtggGGWcC.....',
    '..acccCWCGwtGwGcWcC.....',
    '..acccCWwywwwwwWWcC.....',
    '..wwyww.wywWwwWWwwW.....',
    '..acccCcWwywCwwWccC.....',
    '..accccCCwywCwWcccC.....',
    '..acccCCCWywwwwCccC.....',
    '..acccCcCCwyWwWCccC.....',
    '..accccCCCwwWCWcccC.....',
    '..aaccCcCCWwCCWCcCC.....',
    '..acccCcccCwccWCccC.....',
    '.aacccCccccWcccCccC.....',
    '.acccCccccCdcccCccC.....',
    '.accCcccCccccCcccCC.....',
    '.aC.cC.ccC.cC.cC.C......',
    '..d....tgd....gGd.......',
    '......tgG.....tgG.......',
    '....tggGg....tgGgGG.....',
    '...g.G.G.....G.G.G......',
    '........................',
  ],
  // the blow: the pot slammed down, a splash
  [
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '...aaw....ttg....cC.....',
    '..aacca..tttgg..ccCC....',
    '.aaccccWtttgggGcWcCCCCC.',
    '.acCcccwtgggggGGWccCcCC.',
    '.acCcccwgCCggCCGWccccCC.',
    '.aacCccwgeGtgGeGWcccCC..',
    '..acCccWGgGtggGGWcCcCC..',
    '..acCccWCGwtGwGcWcCcCC..',
    '..aacCCWwywwwwwWWccCC...',
    '..aacCCCwywWwwWWcccCC...',
    '..wacCw.Wwyw.wwWwwcCC...',
    '..acacCcCwywCwWCccCC....',
    '..acacCCCWywwwwcccCC....',
    '..acCCCCCCwyWwWCcCCC....',
    '..acctgGCCwwWCWCtgG.....',
    '..accctgCCrpPPWcgGC.....',
    '..aaccCcCrrppPPCcCC.....',
    '..acccCcrrpppPPPccC.....',
    '.aacccCcrPPPPPPPccC.....',
    '.acccCccrppppPPPccC.....',
    '.accCcccPPPPPPPPcCC.....',
    '.aC.cdtcuuuuuuuuGCd.....',
    '..dddgdGgd...tgGddGdd...',
    '.ddg.G.G.....G.G.G...dd.',
    '........................',
  ],
];

// ------------------------------------------------------------------ Nawia: the soul shows through the pot

const N_STAND = [
  '........................',
  '........................',
  '........................',
  '..........ttg...........',
  '...aaw...tttgg...cC.....',
  '..aaccaWtttgggG.WcCC....',
  '.aaccccwtgggggGGWcCCC...',
  'aacccccwgCCggCCGWccCCC..',
  'accccccwgeGtgGeGWcccCCC.',
  'acCccccWGgGtggGGWccCcCC.',
  'acCccccWCGwtGwGcWcC.cCC.',
  'acCccccWwywwwwwWWcC.cCC.',
  'acCcccCCwywWwwWWccC.cCC.',
  'acCcccCCWwywCwwWccC.cCC.',
  'acCwyww..wyw.wWwwwW.cCC.',
  'acCcccCcCWywwwwCccC.cCC.',
  'aaCccccCCCwyWwWcccC.cCC.',
  'CCCcccCCCCwwWCWCccC.CCC.',
  'tggcccCcCCWwCCWCccC.gtG.',
  'tggGcccCCCCwCCWcccCrpPG.',
  'gGgGccCcCCCWCCcCcCroppP.',
  'g.GcccCcccCdcccCcrrpopPP',
  '.aacccCccccCcccCcrppOppP',
  '.acccCccccCccccCcrPPPoPP',
  '.accCcccCccccCcccrpppOPP',
  '.aC.cC.gcC.cC.cG.PPPPPPP',
  '..d....tgd....gGduuuuuuu',
  '.......tg.....gG..O..O..',
  '......tgG.....tgG.O...O.',
  '....tggGg....tgGgGG.....',
  '...g.G.G.....G.G.G......',
  '........................',
];

const N_WALK = [
  [
    '........................',
    '........................',
    '........................',
    '........................',
    '..........ttg...........',
    '...aaw...tttgg...cC.....',
    '..aaccaWtttgggG.WcCC....',
    '.aaccccwtgggggGGWcCCC...',
    'aacccccwgCCggCCGWccCCC..',
    'accccccwgeGtgGeGWcccCCC.',
    'acCccccWGgGtggGGWccCcCC.',
    'acCccccWCGwtGwGwWcC.cCC.',
    'acCccccWCwywwwwwWcC.cCC.',
    'acCcccCCCwywWwwWWcC.cCC.',
    'acCcccCCCWwywCwwWcC.cCC.',
    'acCwyww...wyw.wWwwW.cCC.',
    'acCcccCcCCWywwwwccC.cCC.',
    'aaCccccCCCCwyWwWccC.cCC.',
    'CCCcccCCCCCwwWCWccC.CCC.',
    'tggcccCcCCCWwCcWccC.gtG.',
    'tggGcccCCCCCwCCWccrpPgG.',
    'gGgGccCcCCCCWCcCcroppP..',
    'g.GcccCcccCCdccCrrpopPP.',
    '.aacccCccccCcccCrppOppP.',
    '.acccCccccCccccCrPPPoPP.',
    '.accCcccCccccCccrpppOPP.',
    '.aC.cC.ccC.cC.cCPPPPPPP.',
    '..d...tgGd....gGuuuuuuu.',
    '....tggGg.....tgGO..O...',
    '.............tgGgOG..O..',
    '.............G.G.G......',
    '........................',
  ],
  [
    '........................',
    '........................',
    '........................',
    '........................',
    '..........ttg...........',
    '...aaw...tttgg...cC.....',
    '..aaccaWtttgggG.WcCC....',
    '.aaccccwtgggggGGWcCCC...',
    'aacccccwgCCggCCGWccCCC..',
    'accccccwgeGtgGeGWcccCCC.',
    'acCccccWGgGtggGGWccCcCC.',
    'acCccccWwGwtGwGcWcC.cCC.',
    'acCccccwywwwwwWcWcC.cCC.',
    'acCcccCwywWwwWWcccC.cCC.',
    'acCcccCWwywCwwWcccC.cCC.',
    'acCwyww.wyw.wWwwwwW.cCC.',
    'acCcccCcWywwwwcCccC.cCC.',
    'aaCccccCCwyWwWCcccC.cCC.',
    'CCCcccCCCwwWCWCCccC.CCC.',
    'tggcccCcCWwCCWcCccC.rpP.',
    'tggGcccCCCwCCWCcccCroppP',
    'gGgGccCcCCWCCCcCcCrrpopP',
    'g.GcccCcccdCcccCccrppOpp',
    '.aacccCccccCcccCccrPPPoP',
    '.acccCccccCccccCccrpppOP',
    '.accCcccCccccCcccCPPPPPP',
    '.aC.cC.ccC.cC.cC.Cuuuuuu',
    '..d....tgd....tgd..O..O.',
    '......tgG....tgGgGGO...O',
    '....tggGg...............',
    '...g.G.G................',
    '........................',
  ],
];

const N_ATTACK = [
  [
    '......tg..opPP..gG......',
    '......tgGrropPPtgG......',
    '.....tgGrrpOpPPPgG......',
    '....tgG.rPPPoPPP.gG.....',
    '...tgG..rpppOPPP.tgG....',
    '..acCw..PPPPPPPP.ccCC...',
    '.aacCca.uuuuuuuuccccCC..',
    '.acCccca.OttggOcccCcCC..',
    '.acccccWtttgggGcWccCC...',
    '.acccccwtgggggGGWcccC...',
    '.acccccwgCCggCCGWccC....',
    '..accccwgeGtgGeGWcC.....',
    '..accccWGgGtggGGWcC.....',
    '..acccCWCGwtGwGcWcC.....',
    '..acccCWwywwwwwWWcC.....',
    '..wwyww.wywWwwWWwwW.....',
    '..acccCcWwywCwwWccC.....',
    '..accccCCwywCwWcccC.....',
    '..acccCCCWywwwwCccC.....',
    '..acccCcCCwyWwWCccC.....',
    '..accccCCCwwWCWcccC.....',
    '..aaccCcCCWwCCWCcCC.....',
    '..acccCcccCwccWCccC.....',
    '.aacccCccccWcccCccC.....',
    '.acccCccccCdcccCccC.....',
    '.accCcccCccccCcccCC.....',
    '.aC.cC.ccC.cC.cC.C......',
    '..d....tgd....gGd.......',
    '......tgG.....tgG.......',
    '....tggGg....tgGgGG.....',
    '...g.G.G.....G.G.G......',
    '........................',
  ],
  [
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '...aaw....ttg....cC.....',
    '..aacca..tttgg..ccCC....',
    '.aaccccWtttgggGcWcCCCCC.',
    '.acCcccwtgggggGGWccCcCC.',
    '.acCcccwgCCggCCGWccccCC.',
    '.aacCccwgeGtgGeGWcccCC..',
    '..acCccWGgGtggGGWcCcCC..',
    '..acCccWCGwtGwGcWcCcCC..',
    '..aacCCWwywwwwwWWccCC...',
    '..aacCCCwywWwwWWcccCC...',
    '..wacCw.Wwyw.wwWwwcCC...',
    '..acacCcCwywCwWCccCC....',
    '..acacCCCWywwwwcccCC....',
    '..acCCCCCCwyWwWCcCCC....',
    '..acctgGCCwwWCWCtgG.....',
    '..accctgCCopPPWcgGC.....',
    '..aaccCcCrropPPCcCC.....',
    '..acccCcrrpOpPPPccC.....',
    '.aacccCcrPPPoPPPccC.....',
    '.acccCccrpppOPPPccC.....',
    '.accCcccPPPPPPPPcCC.....',
    '.aC.cdtcuuuuuuuuGCd.....',
    '..dddgOOOOOOOOOOOOGdd...',
    '.ddgOO.GOOOOOOOO.GOO.dd.',
    '........................',
  ],
];

export const BEAST: Beast = {
  code: 'M6',
  id: 'wodnik-b',
  kind: { pl: 'Wodnik', en: 'Water-man' },
  name: { pl: 'pan jeziora z garnkiem', en: 'the lord of the lake with his pot' },
  note: {
    pl: 'Stary, mokry, z brodą z wodorostów. Unosi garnek nad głowę i przykrywa nim ofiarę.',
    en: 'Old and wet, a beard of weed. He lifts his pot over his head and slams it down over you.',
  },
  alt: ['P8'],
  w: 24,
  h: 32,
  view: 'front',
  pal: {
    a: 0x6c7058, // the coat, the light
    c: 0x4a4e40, // the coat: sodden wool
    C: 0x30342c, // the coat, the shadow
    t: 0xa2b494, // grey-green skin, the light
    g: 0x768c74, // skin
    G: 0x4e6452, // skin, the shadow
    y: 0x86a650, // weed, the light
    w: 0x557a38, // weed: the beard, the hair, the rope
    W: 0x365430, // weed, the shadow
    r: 0xc47a4a, // the clay pot, the light
    p: 0x985638, // the clay pot
    P: 0x683a2c, // the clay pot, the shadow
    u: 0x683a2c, // under the rim (in Nawia, the light of the soul)
    e: 0xf2eaa0, // the eyes
    d: 0x9cc8d8, // water dripping
    o: 0x683a2c, // (Nawia only) the crack of light in the pot
    O: 0x683a2c, // (Nawia only) the light of the soul, dimmer
  },
  frames: { stand: STAND, walk: WALK, attack: ATTACK },
  nawia: {
    pal: {
      a: 0x6a9a98, // the coat, the cold rim of light
      c: 0x2c3438, // the coat
      C: 0x1e2228, // the coat, the shadow
      t: 0x9fcfc0, // skin, the cold light
      g: 0x557070, // skin
      G: 0x33454c, // skin, the shadow
      y: 0x9fe890, // weed, glowing
      w: 0x3e7a50, // weed
      W: 0x24443a, // weed, the shadow
      r: 0x584658, // the pot, dark clay
      p: 0x3c3044, // the pot
      P: 0x2a2032, // the pot, the shadow
      u: 0x7fd8d0, // the light of the soul under the rim
      e: 0xe0fff4, // the eyes, a cold light
      d: 0x7fd8d0, // water dripping, glowing
      o: 0xe0fff4, // the crack of light in the pot
      O: 0x7fd8d0, // the light of the soul, dimmer: the threads, the flood
    },
    frames: { stand: N_STAND, walk: N_WALK, attack: N_ATTACK },
    note: {
      pl: 'W garnku widać duszę topielca: światło przez pęknięcie w glinie, nitki światła spod brzegu.',
      en: 'The pot shows the drowned soul it keeps: light through a crack, threads of light under the rim.',
    },
  },
  ink: 'dark',
  outline: 0x1a1018,
};
