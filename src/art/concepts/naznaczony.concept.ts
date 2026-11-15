import type { Concept } from './concept.ts';

// C5 "Naznaczony": a slender village lad touched by Nawia. Dark hair over his left eye, a cyan glint through it;
// a long blue wool cloak with the hood down, a linen shirt with a red embroidered collar, the hag stone on a cord,
// a short sword at the left hip, a small leather-faced round shield on the left arm.
// Moonlit: light from the upper left, no outline on the lit side, and a cold rim (G, g) from the other world on
// some right-hand edges. In the strides the whole figure drops a row (the bob) and the cloak hem swings.

// facing us: stand, stride, stride
const D0 = [
  '................',
  '......hhhh......',
  '.....hHHhhh.....',
  '.....HkkHhhh....',
  '.....khhkhgh....',
  '.....klckhhh....',
  '......kksshh....',
  '.....cCkksCd....',
  '....cCrrrrCdG...',
  '....ccllHlClG...',
  '....cClLGHCBd...',
  '....cCllHlLBL...',
  '....cCbLbbCBHLH.',
  '....ckllLLCLbbbH',
  '....cCLHdLHLblBH',
  '....cCLHdLHHbBBH',
  '...ccCLHdLHdHHH.',
  '...cCCbBdbBdBG..',
  '......bB.bB.....',
  '.....bbB.bbB....',
  '................',
];

const D1 = [
  '................',
  '................',
  '......hhhh......',
  '.....hHHhhh.....',
  '.....HkkHhhh....',
  '.....khhkhgh....',
  '.....klckhhh....',
  '......kksshh....',
  '.....cCkksCd....',
  '....cCrrrrCdG...',
  '....ccllHlClG...',
  '....cClLGHCBd...',
  '....cCllHlLBL...',
  '....cCbLbbCBHLH.',
  '....cCllLLCLbbbH',
  '....cCLHdLHLblBH',
  '....cCLHdHHHbBBH',
  '..cccCbBdBBdHHH.',
  '......bB.BB.B...',
  '.....bbB........',
  '................',
];

const D2 = [
  '................',
  '................',
  '......hhhh......',
  '.....hHHhhh.....',
  '.....HkkHhhh....',
  '.....khhkhgh....',
  '.....klckhhh....',
  '......kksshh....',
  '.....cCkksCd....',
  '....cCrrrrCdG...',
  '....ccllHlClG...',
  '....cClLGHCBd...',
  '....cCllHlLBL...',
  '....cCbLbbCBHLH.',
  '....cCllLLCLbbbH',
  '....ckLHdLHLblBH',
  '....cCHHdLHHbBBH',
  '...ccCBBdbBdHHH.',
  '......BB.bB.Bd..',
  '.........bbB....',
  '................',
];

// facing right: stand, stride, stride
const S0 = [
  '................',
  '......hhhh......',
  '.....hHHhhhh....',
  '.....HHhHhhhh...',
  '.....Hhhkhhkh...',
  '.....hhsklckk...',
  '.....hhkkkks....',
  '.....cCskks.....',
  '....ccCsrrr.....',
  '....cccCCll.....',
  '....ccCCdlL.....',
  '....ccCCdllLH...',
  '....ccCCbbLbbH..',
  '...cccCklLLblG..',
  '...cccCCLHHBBH..',
  '...ccCCdLH.HH...',
  '.LBccCCdLH......',
  '...cCCddbB......',
  '........bB......',
  '........bbbB....',
  '................',
];

const S1 = [
  '................',
  '................',
  '......hhhh......',
  '.....hHHhhhh....',
  '.....HHhHhhhh...',
  '.....Hhhkhhkh...',
  '.....hhsklckk...',
  '.....hhkkkks....',
  '.....cCskks.....',
  '....ccCsrrr.....',
  '....cccCCll.....',
  '....ccCCdlL.....',
  '....ccCCdllLH...',
  '....ccCCbbLbbH..',
  '...cccCClLLblG..',
  '..cccCCCLHHBBH..',
  '..ccCCCHLL.HH...',
  '.LBCCdH..bB.....',
  '.....BB..bB.....',
  '......BB.bbbB...',
  '................',
];

const S2 = [
  '................',
  '................',
  '......hhhh......',
  '.....hHHhhhh....',
  '.....HHhHhhhh...',
  '.....Hhhkhhkh...',
  '.....hhsklckk...',
  '.....hhkkkks....',
  '.....cCskks.....',
  '....ccCsrrr.....',
  '....cccCCll.....',
  '....ccCCdlL.....',
  '....ccCCdllLH...',
  '....ccCCbbLbbH..',
  '...cccCklLLblG..',
  '..cccCCCLHHBBH..',
  '..ccCCCLLH.HH...',
  '.LBCCdLb.BB.....',
  '.....bB..BB.....',
  '......bb.BBBB...',
  '................',
];

// the back: stand, stride, stride
const U0 = [
  '................',
  '......hhhh......',
  '.....hHHhhh.....',
  '.....HhHHhhh....',
  '.....HhhHhhG....',
  '.....hHhhhhh....',
  '......hshsh.....',
  '.....cCssCCd....',
  '....cccCCCCdG...',
  '....ccCCCCCdG...',
  '....cdCCCCCdd...',
  '...HccdCCCdCd...',
  '..HBcccdCdCCd...',
  '..HBcccCdCCCd...',
  '...HcccCCdCCd...',
  '..BccccCCdCCdG..',
  '...cccCCCdCddd..',
  '......LH.LH.....',
  '......bB.bB.....',
  '......BB.BB.....',
  '................',
];

const U1 = [
  '................',
  '................',
  '......hhhh......',
  '.....hHHhhh.....',
  '.....HhHHhhh....',
  '.....HhhHhhG....',
  '.....hHhhhhh....',
  '......hshsh.....',
  '.....cCssCCd....',
  '....cccCCCCdG...',
  '....ccCCCCCdG...',
  '....cdCCCCCdd...',
  '...HccdCCCdCd...',
  '..HBcccdCdCCd...',
  '..HBcccCdCCCd...',
  '...HcccCCdCCd...',
  '..BccccCCdCCdG..',
  '..ccccCCCdCddd..',
  '......bB.BB.....',
  '......BB........',
  '................',
];

const U2 = [
  '................',
  '................',
  '......hhhh......',
  '.....hHHhhh.....',
  '.....HhHHhhh....',
  '.....HhhHhhG....',
  '.....hHhhhhh....',
  '......hshsh.....',
  '.....cCssCCd....',
  '....cccCCCCdG...',
  '....ccCCCCCdG...',
  '....cdCCCCCdd...',
  '...HccdCCCdCd...',
  '..HBcccdCdCCd...',
  '..HBcccCdCCCd...',
  '...HcccCCdCCd...',
  '..BccccCCdCCdG..',
  '...cccCCCdCdddG.',
  '......BB.bB.....',
  '.........BB.....',
  '................',
];

export const CONCEPT: Concept = {
  code: 'C5',
  id: 'naznaczony',
  name: { pl: 'Naznaczony', en: 'The Marked One' },
  note: {
    pl: 'Szczupły chłopak naznaczony przez Nawię: włosy zasłaniają mu jedno oko, spod nich prześwituje zimny błysk. Rysowany księżycowo, bez czarnego konturu, z cyjanowym odblaskiem z tamtego świata na prawych krawędziach.',
    en: 'A slender lad marked by Nawia: his hair hides one eye, and a cold glint shows through it. Drawn moonlit, with no black outline and a cyan rim light from the other world along his right-hand edges.',
  },
  h: 21,
  pal: {
    k: 0xf0dccc, // skin, lit
    s: 0xc8a29c, // skin, shade
    h: 0x221e32, // hair
    H: 0x524c6c, // hair sheen, trouser shade
    c: 0x4a6aa2, // cloak, lit
    C: 0x2f4476, // cloak
    d: 0x1d2548, // cloak, shade
    l: 0xe2ded2, // linen
    L: 0x9c98b2, // linen shade, steel
    r: 0xb83636, // embroidered collar
    g: 0x8ef8ff, // Nawia's glow
    G: 0x58b6d2, // Nawia's glow on the cloak
    b: 0x7a5c4c, // leather
    B: 0x4a3638, // leather, shade
  },
  frames: { down: [D0, D1, D2], up: [U0, U1, U2], side: [S0, S1, S2] },
  ink: 'rim',
  outline: 0x12142a,
};
