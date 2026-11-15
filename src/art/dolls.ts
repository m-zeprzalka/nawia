// People, drawn by hand.
//
// A person is a paper doll: a body (one drawing per view and per step of the walk), a head laid over it,
// and whatever he carries, in layers under or over the two. Bodies are shared; a look is a head, a palette
// and its gear. So a new idea for the hero costs one head in three views, not a whole sheet.
//
// The measures are those of 16-bit top-down adventures: a cell 16 px wide; the head as wide as the body
// with its arms (never wider: a wide head on a narrow trunk is a light bulb); no neck, the chin sits
// between the shoulders; light from the upper left; a line round everything, added afterwards, that takes
// the dark of whatever it borders (warm round skin and leather, cool round linen and steel).
//
// Two heights, and each has its own drawings (nothing is cut down from the other):
//  - `small`: one tile, 16 x 16: eight rows of head, seven of body;
//  - `tall`:  a tile and a half, 16 x 24: ten rows of head, thirteen of body.
// Everything a head wears (a helmet, a hood, the ears of a wolf pelt) is drawn inside the cell.
//
// Letters (the same everywhere, so a palette can be swapped under a drawing):
//   h H l    hair: base, shadow, light            s S t    skin: base, shadow, light
//   e B      eye, brow (and moustache)            r R      trim: embroidery, headband
//   a A b    shirt or tunic: base, shadow, light  k y      belt, buckle
//   p P      trousers or skirt: base, shadow      f F      boots: base, shadow
//   c C d    cloak, hood or cap: base, shadow, light
//   m n M    metal: base, shadow, shine           q Q      wood or fur: dark, light
//   x X      shield face: base, shadow            w        white (an apron, a fang, fletching)

import { PixelBuffer, rgb, type Color } from '../core/PixelBuffer.ts';
import { art, type Sheet } from './sheet.ts';

export type View = 'down' | 'up' | 'side';
export type Size = 'small' | 'tall';
/** 0 stands; 1 and 2 are the two strides of the walk */
export type Pose = 0 | 1 | 2;
type Views = Record<View, string[]>;
/** Three poses of one view. */
type Poses = readonly [string[], string[], string[]];

const W = 16;
const HEIGHT: Record<Size, number> = { small: 16, tall: 24 };

/** `rows` placed `top` rows down a cell `h` rows tall; the rest is empty. */
function cell(h: number, top: number, rows: string[]): string[] {
  const blank = '.'.repeat(W);
  const out = [...Array<string>(top).fill(blank), ...rows];
  if (out.length > h) throw new Error(`drawing is ${out.length} rows, the cell has ${h}`);
  while (out.length < h) out.push(blank);
  return art(W, out);
}
const T = (top: number, rows: string[]): string[] => cell(24, top, rows);
const S = (top: number, rows: string[]): string[] => cell(16, top, rows);

// ================================================================== bodies, a tile and a half

/** A shirt to mid-thigh, belted, embroidered at the collar, the cuffs and the hem; trousers; boots. */
const TALL_SHIRT: Record<View, Poses> = {
  down: [
    T(10, [
      '..bbaaaaaaaaA...',
      '..baArRrRrAaA...',
      '..baAbaaaaAaA...',
      '..rRAbaaaaArR...',
      '..ts.kkykk.sS...',
      '..sS.baaaA.sS...',
      '...ararararA....',
      '....ppP.ppP.....',
      '....ppP.ppP.....',
      '....ppP.ppP.....',
      '....ffF.ffF.....',
      '....ffF.ffF.....',
      '...fffF.fffF....',
    ]),
    T(11, [
      '..bbaaaaaaaaA...',
      '..baArRrRrAaA...',
      '..rRAbaaaaAaA...',
      '..ts.baaaaArR...',
      '..sS.kkykk.sS...',
      '.....baaaA.sS...',
      '...ararararA....',
      '....ppP.pPP.....',
      '....ppP.pPP.....',
      '....ffF.fFF.....',
      '....ffF.FFF.....',
      '...fffF.........',
    ]),
    T(11, [
      '..bbaaaaaaaaA...',
      '..baArRrRrAaA...',
      '..baAbaaaaArR...',
      '..rRAbaaaa.sS...',
      '..ts.kkykk.sS...',
      '..sS.baaaA......',
      '...ararararA....',
      '....pPP.ppP.....',
      '....pPP.ppP.....',
      '....fFF.ffF.....',
      '....FFF.ffF.....',
      '........fffF....',
    ]),
  ],
  up: [
    T(10, [
      '..bbaaaaaaaaA...',
      '..baAaaaaaAaA...',
      '..baAbaaaaAaA...',
      '..rRAbaaaaArR...',
      '..ts.kkkkk.sS...',
      '..sS.baaaA.sS...',
      '...ararararA....',
      '....ppP.ppP.....',
      '....ppP.ppP.....',
      '....ppP.ppP.....',
      '....ffF.ffF.....',
      '....ffF.ffF.....',
      '....ffF.ffF.....',
    ]),
    T(11, [
      '..bbaaaaaaaaA...',
      '..baAaaaaaAaA...',
      '..baAbaaaaArR...',
      '..rRAbaaaa.sS...',
      '..ts.kkkkk.sS...',
      '..sS.baaaA......',
      '...ararararA....',
      '....ppP.pPP.....',
      '....ppP.pPP.....',
      '....ffF.fFF.....',
      '....ffF.FF......',
      '....ffF.........',
    ]),
    T(11, [
      '..bbaaaaaaaaA...',
      '..baAaaaaaAaA...',
      '..rRAbaaaaAaA...',
      '..ts.baaaaArR...',
      '..sS.kkkkk.sS...',
      '.....baaaA.sS...',
      '...ararararA....',
      '....pPP.ppP.....',
      '....pPP.ppP.....',
      '....fFF.ffF.....',
      '.....FF.ffF.....',
      '........ffF.....',
    ]),
  ],
  side: [
    T(10, [
      '....baaaaaA.....',
      '....abbaaaA.....',
      '....babaAaA.....',
      '....barRAaA.....',
      '....kktskkk.....',
      '....aasSaaA.....',
      '....arararA.....',
      '.....ppPPP......',
      '.....ppPPP......',
      '.....ppPPP......',
      '.....ffFFF......',
      '.....ffFFF......',
      '.....ffffFFf....',
    ]),
    T(11, [
      '....baaaaaA.....',
      '....abbaaaA.....',
      '...abaAaaaAA....',
      '...rRAaaaaArR...',
      '..tsAkkkkkksS...',
      '..sS.aaaaaA.....',
      '....arararA.....',
      '....PPPppp......',
      '...PPP..ppp.....',
      '..FFF....fff....',
      '..FF.....fff....',
      '.........ffff...',
    ]),
    T(11, [
      '....baaaaaA.....',
      '....abbaaaA.....',
      '....baaAbaA.....',
      '....baaaArR.....',
      '....kkkkkAts....',
      '....aaaaaAsS....',
      '....arararA.....',
      '....pppPPP......',
      '...ppp..PPP.....',
      '..fff....FFF....',
      '..ff.....FFF....',
      '.........FFFF...',
    ]),
  ],
};

/** A long robe or a dress: the letters of the trousers are its skirt. Villagers stand; they have no walk. */
const TALL_ROBE_DOWN = T(10, [
  '..bbaaaaaaaaA...',
  '..baAaaaaaAaA...',
  '..baAbaaaaAaA...',
  '..baAbaaaaAaA...',
  '..ts.kkkkk.sS...',
  '..sS.ppppP.sS...',
  '...pppPpppPP....',
  '...pppPpppPP....',
  '..ppppPppppPP...',
  '..ppppPppppPP...',
  '..ppppPppppPP...',
  '..pPppPppPpPP...',
  '....ff....ff....',
]);
const TALL_ROBE_SIDE = T(10, [
  '.....baaaaA.....',
  '.....abbaaA.....',
  '.....aAbaAA.....',
  '.....aAbaAA.....',
  '.....kktskk.....',
  '.....ppsSpP.....',
  '....pppPppP.....',
  '....pppPppP.....',
  '...ppppPppPP....',
  '...ppppPppPP....',
  '...ppppPppPP....',
  '...pPppPppPP....',
  '.......fff......',
]);
const still = (rows: string[]): Poses => [rows, rows, rows];
const TALL_ROBE: Record<View, Poses> = { down: still(TALL_ROBE_DOWN), up: still(TALL_ROBE_DOWN), side: still(TALL_ROBE_SIDE) };

// ================================================================== bodies, one tile

const SMALL_SHIRT: Record<View, Poses> = {
  down: [
    S(8, [
      '..bbaaaaaaaaA...',
      '..baArRrRrAaA...',
      '..ts.kkykk.sS...',
      '....AaaaaaA.....',
      '....ppP.ppP.....',
      '....ffF.ffF.....',
      '...fffF.fffF....',
    ]),
    S(9, [
      '..bbaaaaaaaaA...',
      '..tsArRrRrAaA...',
      '.....kkykk.sS...',
      '....AaaaaaA.....',
      '....ffF.fFF.....',
      '...fffF.........',
    ]),
    S(9, [
      '..bbaaaaaaaaA...',
      '..baArRrRrAsS...',
      '..ts.kkykk......',
      '....AaaaaaA.....',
      '....fFF.ffF.....',
      '........fffF....',
    ]),
  ],
  up: [
    S(8, [
      '..bbaaaaaaaaA...',
      '..baAaaaaaAaA...',
      '..ts.kkkkk.sS...',
      '....AaaaaaA.....',
      '....ppP.ppP.....',
      '....ffF.ffF.....',
      '....ffF.ffF.....',
    ]),
    S(9, [
      '..bbaaaaaaaaA...',
      '..baAaaaaaAsS...',
      '..ts.kkkkk......',
      '....AaaaaaA.....',
      '....ffF.fFF.....',
      '....ffF.........',
    ]),
    S(9, [
      '..bbaaaaaaaaA...',
      '..tsAaaaaaAaA...',
      '.....kkkkk.sS...',
      '....AaaaaaA.....',
      '....fFF.ffF.....',
      '........ffF.....',
    ]),
  ],
  side: [
    S(8, [
      '....baaaaaA.....',
      '....babaAaA.....',
      '....kktskkk.....',
      '.....aaaaA......',
      '.....ppPPP......',
      '.....ffFFF......',
      '.....ffffFFf....',
    ]),
    S(9, [
      '....baaaaaA.....',
      '...abaAaaaAs....',
      '..tsAkkkkkk.....',
      '.....aaaaA......',
      '...PPP..ppp.....',
      '..FF.....ffff...',
    ]),
    S(9, [
      '....baaaaaA.....',
      '....baaAbaA.....',
      '....kkkkkAts....',
      '.....aaaaA......',
      '...ppp..PPP.....',
      '..ff.....FFFF...',
    ]),
  ],
};

const SMALL_ROBE_DOWN = S(8, [
  '..bbaaaaaaaaA...',
  '..baAbaaaaAaA...',
  '..ts.kkkkk.sS...',
  '...pppPpppPP....',
  '..ppppPppppPP...',
  '..pPppPppPpPP...',
  '....ff....ff....',
]);
const SMALL_ROBE_SIDE = S(8, [
  '.....baaaaA.....',
  '.....aAbaAA.....',
  '.....kktskk.....',
  '....pppPppP.....',
  '...ppppPppPP....',
  '...pPppPppPP....',
  '.......fff......',
]);
const SMALL_ROBE: Record<View, Poses> = { down: still(SMALL_ROBE_DOWN), up: still(SMALL_ROBE_DOWN), side: still(SMALL_ROBE_SIDE) };

type BodyKind = 'shirt' | 'robe';
const BODY: Record<Size, Record<BodyKind, Record<View, Poses>>> = {
  tall: { shirt: TALL_SHIRT, robe: TALL_ROBE },
  small: { shirt: SMALL_SHIRT, robe: SMALL_ROBE },
};
/** the first row of the legs in a stride: above it, a stride and a stand differ only by the arms */
const LEGS_FROM: Record<Size, number> = { tall: 18, small: 13 };

// ================================================================== heads
// Ten rows in the tall cell (rows 1-10), eight in the small one (rows 1-8); the last row is the chin,
// which lies over the top row of the body. Seen a little from above: the crown takes the top third.

type Heads = Record<Size, Views>;

/** Fair hair to the jaw, a woven band (krajka) round the brow, knotted at the back. */
const HEAD_WOJAK: Heads = {
  tall: {
    down: T(1, [
      '.....hhhhh......',
      '...hhlllhhhH....',
      '..hhllhhhhhhH...',
      '..hlhhhhhhhHH...',
      '..hrrrrrrrrRH...',
      '..hhsttttsshH...',
      '..hstBtttBssH...',
      '..HstettteSsH...',
      '..HHsttSssSHH...',
      '....SsssssS.....',
    ]),
    up: T(1, [
      '.....hhhhh......',
      '...hhlllhhhH....',
      '..hhllhhhhhhH...',
      '..hlhhhhhhhHH...',
      '..hrrrrrrrrRH...',
      '..hhlhhrhhhHH...',
      '..hhhlhRhhhHH...',
      '..hhhhhhhhHHH...',
      '..HhhhhhhhHHH...',
      '...HhhHhhHHH....',
    ]),
    side: T(1, [
      '.....hhhhh......',
      '...hhlllhhhh....',
      '..hhllhhhhhhh...',
      '..hlhhhhhhhhh...',
      '..rrrrrrrrrrr...',
      '..rhhhhhstttt...',
      '..RhhhhhsstBt...',
      '..HhhhhhSstet...',
      '...HhhhhSsttS...',
      '....HHhHSssS....',
    ]),
  },
  small: {
    down: S(1, [
      '.....hhhhh......',
      '...hhlllhhhH....',
      '..hhlhhhhhhHH...',
      '..hrrrrrrrrRH...',
      '..hstBtttBssH...',
      '..HstettteSsH...',
      '..HHsttSssSHH...',
      '....SsssssS.....',
    ]),
    up: S(1, [
      '.....hhhhh......',
      '...hhlllhhhH....',
      '..hhlhhhhhhHH...',
      '..hrrrrrrrrRH...',
      '..hhlhhrhhhHH...',
      '..hhhhhRhhHHH...',
      '..HhhhhhhhHHH...',
      '...HhhHhhHHH....',
    ]),
    side: S(1, [
      '.....hhhhh......',
      '...hhlllhhhh....',
      '..hhlhhhhhhhh...',
      '..rrrrrrrrrrr...',
      '..rhhhhhsstBt...',
      '..RhhhhhSstet...',
      '...HhhhhSsttS...',
      '....HHhHSssS....',
    ]),
  },
};

/** A conical helmet with a nasal, mail hanging from it over the neck; a moustache under it. */
const HEAD_DRUZYNNIK: Heads = {
  tall: {
    down: T(1, [
      '.......M........',
      '.....mMMmn......',
      '....mMMmmnn.....',
      '...mMMmmmmnn....',
      '..nmnmnmnmnmn...',
      '..hsttMmtssSh...',
      '..hstBtmtBssH...',
      '..HstetmtesSH...',
      '...sthhShhsS....',
      '....SsssssS.....',
    ]),
    up: T(1, [
      '.......M........',
      '.....mMMmn......',
      '....mMMmmnn.....',
      '...mMMmmmmnn....',
      '..nmnmnmnmnmn...',
      '..mMmmnmmmnmn...',
      '..mmnmmmnmmnn...',
      '..mMmmnmmmnmn...',
      '..nmnmmmnmmnn...',
      '...nmmnmmnn.....',
    ]),
    side: T(1, [
      '.......M........',
      '.....mMMmn......',
      '....mMMmmnn.....',
      '...mMMmmmmnn....',
      '..nmnmnmnmnmn...',
      '..mMmmnmhsttM...',
      '..mmnmmmhstBm...',
      '..mMmmnmHstetm..',
      '...mnmmmHshhs...',
      '....nmmnSssS....',
    ]),
  },
  small: {
    down: S(1, [
      '.......M........',
      '....mMMmmnn.....',
      '...mMMmmmmnn....',
      '..nmnmnmnmnmn...',
      '..hstBtMtBssH...',
      '..HstetmtesSH...',
      '...sthhShhsS....',
      '....SsssssS.....',
    ]),
    up: S(1, [
      '.......M........',
      '....mMMmmnn.....',
      '...mMMmmmmnn....',
      '..nmnmnmnmnmn...',
      '..mMmmnmmmnmn...',
      '..mmnmmmnmmnn...',
      '..nMmmnmmmnnn...',
      '...nmmnmmnn.....',
    ]),
    side: S(1, [
      '.......M........',
      '....mMMmmnn.....',
      '...mMMmmmmnn....',
      '..nmnmnmnmnmn...',
      '..mMmmnmhstBm...',
      '..mmnmmmHstetm..',
      '...mnmmmHshhs...',
      '....nmmnSssS....',
    ]),
  },
};

/** A hood drawn up, its point fallen back; the face in its shade. */
const HEAD_LOWCA: Heads = {
  tall: {
    down: T(1, [
      '......cdc.......',
      '....cdddccC.....',
      '...cddcccccC....',
      '..cddccccccCC...',
      '..cdcCCCCCcCC...',
      '..ccChhhhhCcC...',
      '..ccsBtttBsCC...',
      '..cCsetttesCC...',
      '..cCSstSssSCC...',
      '...CCsssssCC....',
    ]),
    up: T(1, [
      '......cdc.......',
      '....cdddccC.....',
      '...cddcccccC....',
      '..cddccccccCC...',
      '..cdccccccccC...',
      '..cdcccccccCC...',
      '..ccccccccCCC...',
      '..cCccccCcCCC...',
      '..cCCcccCCCCC...',
      '...CCCCCCCCC....',
    ]),
    side: T(1, [
      '.....cdc........',
      '...cdddccc......',
      '..cddccccccc....',
      '..cdccccccccc...',
      '..cdccccccCCc...',
      '..ccccccCChhs...',
      '..cccccCCstBt...',
      '..cCcccCCstet...',
      '..cCCccCCsttS...',
      '...CCCcCCsssS...',
    ]),
  },
  small: {
    down: S(1, [
      '......cdc.......',
      '....cdddccC.....',
      '...cddcccccCC...',
      '..cdcCCCCCcCC...',
      '..ccsBtttBsCC...',
      '..cCsetttesCC...',
      '..cCSstSssSCC...',
      '...CCsssssCC....',
    ]),
    up: S(1, [
      '......cdc.......',
      '....cdddccC.....',
      '...cddcccccCC...',
      '..cdccccccccC...',
      '..cdccccccCCC...',
      '..ccccccCcCCC...',
      '..cCCcccCCCCC...',
      '...CCCCCCCCC....',
    ]),
    side: S(1, [
      '.....cdc........',
      '...cdddcccc.....',
      '..cddcccccccc...',
      '..cdccccccCCc...',
      '..cccccCCstBt...',
      '..cCcccCCstet...',
      '..cCCccCCsttS...',
      '...CCCcCCsssS...',
    ]),
  },
};

/** A wolf's pelt over the head: its ears stand at the corners, its fangs hang at his temples. */
const HEAD_WILCZY: Heads = {
  tall: {
    down: T(1, [
      '..c.........c...',
      '..cC.......cC...',
      '..cddcccccddC...',
      '..cdcccCccccC...',
      '..cCcCcCcCcCC...',
      '..cCswtttwsCC...',
      '..cstBtttBssC...',
      '..CstettteSsC...',
      '..CCsttSssSCC...',
      '....SsssssS.....',
    ]),
    up: T(1, [
      '..c.........c...',
      '..cC.......cC...',
      '..cddcccccddC...',
      '..cddccCcccCC...',
      '..cdcccCccccC...',
      '..ccdccCcccCC...',
      '..cccccCccCCC...',
      '..cCcccCccCCC...',
      '..CcCccCcCCCC...',
      '...CCcCCcCCC....',
    ]),
    side: T(1, [
      '...c.....c......',
      '...cC....cC.....',
      '..cdddccccdcc...',
      '..cddcccccccCc..',
      '..cdcccccCcCcC..',
      '..ccdcccCCwtt...',
      '..ccccccCstBt...',
      '..cCccccCstet...',
      '..CcCccCCsttS...',
      '...CCcCCSssS....',
    ]),
  },
  small: {
    down: S(1, [
      '..c.........c...',
      '..cC.......cC...',
      '..cddcccccddC...',
      '..cCcCcCcCcCC...',
      '..cCwBtttBwCC...',
      '..CstettteSsC...',
      '..CCsttSssSCC...',
      '....SsssssS.....',
    ]),
    up: S(1, [
      '..c.........c...',
      '..cC.......cC...',
      '..cddcccccddC...',
      '..cddccCcccCC...',
      '..ccdccCcccCC...',
      '..cCcccCccCCC...',
      '..CcCccCcCCCC...',
      '...CCcCCcCCC....',
    ]),
    side: S(1, [
      '...c.....c......',
      '...cC....cC.....',
      '..cdddccccdcc...',
      '..cdcccccCcCcC..',
      '..ccccccCwtBt...',
      '..cCccccCstet...',
      '..CcCccCCsttS...',
      '...CCcCCSssS....',
    ]),
  },
};

/** A felt cap with a fur brim wider than the head; dark hair under it. */
const HEAD_KOLPAK: Heads = {
  tall: {
    down: T(1, [
      '.....cdddc......',
      '...cddddcccC....',
      '..cdddccccccC...',
      '.qQQqQQqQQqQqq..',
      '.qQqqQqqQqqQqq..',
      '..hhsttttsshH...',
      '..hstBtttBssH...',
      '..HstettteSsH...',
      '...stttSsssS....',
      '....SsssssS.....',
    ]),
    up: T(1, [
      '.....cdddc......',
      '...cddddcccC....',
      '..cdddccccccC...',
      '.qQQqQQqQQqQqq..',
      '.qQqqQqqQqqQqq..',
      '..hhlhhhhhhHH...',
      '..hhhlhhhhhHH...',
      '..hhhhhhhhHHH...',
      '..HhhHhhHhHHH...',
      '....HhhHhHH.....',
    ]),
    side: T(1, [
      '.....cdddc......',
      '...cddddcccc....',
      '..cdddccccccc...',
      '.qQQqQQqQQqQqq..',
      '.qQqqQqqQqqQqq..',
      '..hhhhhhhsttt...',
      '..HhhhhhhstBt...',
      '..HHhhhhSstet...',
      '...HHhhhSsttS...',
      '....HHhHSssS....',
    ]),
  },
  small: {
    down: S(1, [
      '.....cdddc......',
      '...cddddcccC....',
      '.qQQqQQqQQqQqq..',
      '.qQqqQqqQqqQqq..',
      '..hstBtttBssH...',
      '..HstettteSsH...',
      '...stttSsssS....',
      '....SsssssS.....',
    ]),
    up: S(1, [
      '.....cdddc......',
      '...cddddcccC....',
      '.qQQqQQqQQqQqq..',
      '.qQqqQqqQqqQqq..',
      '..hhlhhhhhhHH...',
      '..hhhhhhhhHHH...',
      '..HhhHhhHhHHH...',
      '....HhhHhHH.....',
    ]),
    side: S(1, [
      '.....cdddc......',
      '...cddddcccc....',
      '.qQQqQQqQQqQqq..',
      '.qQqqQqqQqqQqq..',
      '..hhhhhhhstBt...',
      '..HHhhhhSstet...',
      '...HHhhhSsttS...',
      '....HHhHSssS....',
    ]),
  },
};

// ---- villagers

/** A kerchief tied under the chin (or, in other colours, the hood of an old woman). */
const HEAD_CHUSTA: Heads = {
  tall: {
    down: T(1, [
      '.....cdddc......',
      '...cddddcccC....',
      '..cdddccccccC...',
      '..cdccccccccC...',
      '..cchhhhhhhCC...',
      '..cCsttttssCC...',
      '..cstBtttBsCC...',
      '..cCtettteSCC...',
      '..cCsttSssSCC...',
      '...CCsssssCC....',
    ]),
    up: T(1, [
      '.....cdddc......',
      '...cddddcccC....',
      '..cdddccccccC...',
      '..cdccccccccC...',
      '..cdcccccccCC...',
      '..ccccccccCCC...',
      '..ccccccccCCC...',
      '..cCccccCcCCC...',
      '..cCCcccCCCCC...',
      '...CCCcCCCCC....',
    ]),
    side: T(1, [
      '.....cdddc......',
      '...cddddcccc....',
      '..cdddccccccc...',
      '..cdccccccccc...',
      '..cdcccccChhs...',
      '..ccccccCsttt...',
      '..cccccCCstBt...',
      '..cCcccCCstet...',
      '..cCCccCCsttS...',
      '...CCCcCCsssS...',
    ]),
  },
  small: {
    down: S(1, [
      '.....cdddc......',
      '...cddddcccC....',
      '..cdddccccccC...',
      '..cchhhhhhhCC...',
      '..cstBtttBsCC...',
      '..cCtettteSCC...',
      '..cCsttSssSCC...',
      '...CCsssssCC....',
    ]),
    up: S(1, [
      '.....cdddc......',
      '...cddddcccC....',
      '..cdddccccccC...',
      '..cdcccccccCC...',
      '..ccccccccCCC...',
      '..cCccccCcCCC...',
      '..cCCcccCCCCC...',
      '...CCCcCCCCC....',
    ]),
    side: S(1, [
      '.....cdddc......',
      '...cddddcccc....',
      '..cdddccccccc...',
      '..cdcccccChhs...',
      '..cccccCCstBt...',
      '..cCcccCCstet...',
      '..cCCccCCsttS...',
      '...CCCcCCsssS...',
    ]),
  },
};

/** A bald crown, white hair round it, a beard down to the chest. */
const HEAD_STARZEC: Heads = {
  tall: {
    down: T(1, [
      '.....sttts......',
      '...hstttttsH....',
      '..hhstttttsHH...',
      '..hlhsttttsHH...',
      '..hlhssssSShH...',
      '..hhsttttsshH...',
      '..hstBtttBssH...',
      '..HstettteSsH...',
      '..HhlhhShhhHH...',
      '...hlhhhhhHH....',
      '....hlhhhHH.....',
      '.....hhhHH......',
    ]),
    up: T(1, [
      '.....sttts......',
      '...hstttttsH....',
      '..hhstttttsHH...',
      '..hlhsttttsHH...',
      '..hlhhsssShHH...',
      '..hhlhhhhhhHH...',
      '..hhhlhhhhhHH...',
      '..hhhhhhhhHHH...',
      '..HhhHhhHhHHH...',
      '....HhhHhHH.....',
    ]),
    side: T(1, [
      '.....sttts......',
      '...hstttttss....',
      '..hhsttttttss...',
      '..hlhstttttts...',
      '..hlhhsssstts...',
      '..hhlhhhhsttt...',
      '..hhhlhhhstBt...',
      '..HhhhhhHstets..',
      '...HHhhHHhlhh...',
      '....HHhHhlhhH...',
      '.........hhhH...',
      '..........hH....',
    ]),
  },
  small: {
    down: S(1, [
      '.....sttts......',
      '...hstttttsH....',
      '..hlhsttttsHH...',
      '..hlhssssSShH...',
      '..hstBtttBssH...',
      '..HstettteSsH...',
      '..HhlhhShhhHH...',
      '...hlhhhhhHH....',
      '.....hhhHH......',
    ]),
    up: S(1, [
      '.....sttts......',
      '...hstttttsH....',
      '..hlhsttttsHH...',
      '..hlhhsssShHH...',
      '..hhlhhhhhhHH...',
      '..hhhhhhhhHHH...',
      '..HhhHhhHhHHH...',
      '....HhhHhHH.....',
    ]),
    side: S(1, [
      '.....sttts......',
      '...hstttttss....',
      '..hlhstttttts...',
      '..hlhhsssstts...',
      '..hhhlhhhstBt...',
      '..HhhhhhHstets..',
      '...HHhhHHhlhh...',
      '....HHhHhlhhH...',
      '..........hH....',
    ]),
  },
};

// ================================================================== gear

/** A round shield on the left arm: it covers that arm from the front and the side; from behind only its edge shows. */
const SHIELD: Heads = {
  tall: {
    down: T(10, [
      '..........QQQQ..',
      '.........QxxxxQ.',
      '.........QxxxxQ.',
      '.........QxMmXq.',
      '.........QxxXXq.',
      '.........qXXXXq.',
      '..........qqqq..',
    ]),
    up: T(11, [
      '.Q..............',
      '.Q..............',
      '.q..............',
      '.q..............',
      '.q..............',
    ]),
    side: T(10, [
      '......QQQQ......',
      '.....QxxxxQ.....',
      '.....QxxxxQ.....',
      '.....QxMmXq.....',
      '.....QxxXXq.....',
      '.....qXXXXq.....',
      '......qqqq......',
    ]),
  },
  small: {
    down: S(8, [
      '...........QQQ..',
      '..........QxxxQ.',
      '..........QxMXq.',
      '..........qXXXq.',
      '...........qqq..',
    ]),
    up: S(9, [
      '.Q..............',
      '.q..............',
      '.q..............',
    ]),
    side: S(8, [
      '.......QQQ......',
      '......QxxxQ.....',
      '......QxMXq.....',
      '......qXXXq.....',
      '.......qqq......',
    ]),
  },
};

/** The same shield slung on the back: it is the back view that shows it. */
const SHIELD_BACK: Heads = {
  tall: {
    down: T(10, [
      '.Q...........q..',
      '.Q...........q..',
      '.Q...........q..',
      '.q...........q..',
    ]),
    up: T(9, [
      '....QQQQQQQ.....',
      '...QxxxxxxxQ....',
      '..QxxxxxxxXXq...',
      '..QxxxmMxxXXq...',
      '..QxxxmmxXXXq...',
      '..QxxxxxXXXXq...',
      '...qxXXXXXXq....',
      '....qqqqqqq.....',
    ]),
    side: T(10, [
      '...Q............',
      '..Qx............',
      '..Qx............',
      '..QX............',
      '..qX............',
      '..qX............',
      '...q............',
    ]),
  },
  small: {
    down: S(8, [
      '.Q...........q..',
      '.q...........q..',
    ]),
    up: S(7, [
      '....QQQQQQQ.....',
      '...QxxxxxxXq....',
      '...QxxmMxXXq....',
      '...QxxmmXXXq....',
      '....qqqqqqq.....',
    ]),
    side: S(8, [
      '...Q............',
      '..Qx............',
      '..qX............',
      '...q............',
    ]),
  },
};

/** A short cloak: from the front its edges frame the body, from behind it is all there is to see. */
const CLOAK_UNDER: Heads = {
  tall: {
    down: T(11, [
      '.c...........C..',
      '.c...........C..',
      '.c...........C..',
      '.c...........C..',
      '.c...........C..',
      '.cc.........CC..',
      '..cc.......CC...',
      '..cC.......CC...',
    ]),
    up: T(0, []),
    side: T(10, [
      '....d...........',
      '...dc...........',
      '...cc...........',
      '..dcc...........',
      '..ccC...........',
      '..ccC...........',
      '..cCC...........',
      '..cCC...........',
      '...CC...........',
    ]),
  },
  small: {
    down: S(9, [
      '.c...........C..',
      '.c...........C..',
      '.cc.........CC..',
      '..c.........C...',
    ]),
    up: S(0, []),
    side: S(8, [
      '....d...........',
      '...dc...........',
      '..dcC...........',
      '..ccC...........',
      '...CC...........',
    ]),
  },
};
/** A pelt down the back: a dark stripe along the spine, a ragged hem. */
const PELT_OVER: Heads = {
  tall: {
    down: T(0, []),
    up: T(10, [
      '..ddccccccccC...',
      '.ddccccCccccCC..',
      '.dcccccCccccCC..',
      '.dcccccCccccCC..',
      '.dcccccCccccCC..',
      '.ccccccCcccCCC..',
      '.cccccccccCCCC..',
      '.ccCcccCcccCCC..',
      '.cC.cC.cC.cCC...',
    ]),
    side: T(0, []),
  },
  small: {
    down: S(0, []),
    up: S(8, [
      '..ddccccccccC...',
      '.dcccccCccccCC..',
      '.cccccccccCCCC..',
      '.ccCcccCcccCCC..',
      '.cC.cC.cC.cCC...',
    ]),
    side: S(0, []),
  },
};
const CLOAK_OVER: Heads = {
  tall: {
    down: T(0, []),
    up: T(10, [
      '..ddccccccccC...',
      '.ddcccCcccccCC..',
      '.dcccCccccCcCC..',
      '.dcccCccccCcCC..',
      '.dccCcccccCcCC..',
      '.dccCcccCcCcCC..',
      '.cccCcccCcCCCC..',
      '.ccCCccCCcCCCC..',
      '.cCC.cCC.cCCC...',
    ]),
    side: T(0, []),
  },
  small: {
    down: S(0, []),
    up: S(8, [
      '..ddccccccccC...',
      '.dcccCccccCcCC..',
      '.dccCcccCcCcCC..',
      '.ccCCccCCcCCCC..',
      '.cCC.cCC.cCCC...',
    ]),
    side: S(0, []),
  },
};

/** The cape of a hood (or a pelt) over the shoulders. */
const MANTLE: Heads = {
  tall: {
    down: T(10, [
      '..ddccccccccC...',
      '..cdccCcccCcC...',
      '...cCC...CCC....',
    ]),
    up: T(10, [
      '..ddccccccccC...',
      '..cdcccccccCC...',
      '..ccCccCccCCC...',
      '...CC.CCC.CC....',
    ]),
    side: T(10, [
      '....dccccccC....',
      '....cdccccCC....',
      '....cCCcCCC.....',
    ]),
  },
  small: {
    down: S(8, [
      '..ddccccccccC...',
      '..cCC.....CCC...',
    ]),
    up: S(8, [
      '..ddccccccccC...',
      '..ccCccCccCCC...',
      '...CC.CCC.CC....',
    ]),
    side: S(8, [
      '....dccccccC....',
      '....cCCcCCC.....',
    ]),
  },
};

/** A bow and a quiver on the back. */
const BOW_UNDER: Heads = {
  tall: {
    down: T(7, [
      '.............w..',
      '............ww..',
      '.Q...........q..',
      '.Q..............',
    ]),
    up: T(0, []),
    side: T(9, [
      '...Q............',
      '..Q.............',
      '.Q..............',
      '.Q..............',
      '.Q..............',
      '.Q..............',
      '.Q..............',
      '..Q.............',
      '...Q............',
    ]),
  },
  small: {
    down: S(6, [
      '.............w..',
      '............ww..',
      '.Q..............',
    ]),
    up: S(0, []),
    side: S(7, [
      '...Q............',
      '..Q.............',
      '.Q..............',
      '.Q..............',
      '..Q.............',
      '...Q............',
    ]),
  },
};
const BOW_OVER: Heads = {
  tall: {
    down: T(0, []),
    up: T(7, [
      '..w.............',
      '..ww........Q...',
      '...qq.......Q...',
      '...qqq.....Q....',
      '....qq....Q.....',
      '.........Q......',
      '........Q.......',
      '.......Q........',
      '......Q.........',
      '.....Q..........',
      '....QQ..........',
    ]),
    side: T(0, []),
  },
  small: {
    down: S(0, []),
    up: S(5, [
      '..w.............',
      '..ww........Q...',
      '...qq......Q....',
      '....q.....Q.....',
      '.........Q......',
      '........Q.......',
      '......QQ........',
      '.....Q..........',
    ]),
    side: S(0, []),
  },
};

/** A sword at the left hip, in its scabbard: the hilt at the belt, the rest behind the leg. */
const SWORD_HIP: Heads = {
  tall: {
    down: T(13, [
      '.............y..',
      '.............m..',
      '.............F..',
      '.............F..',
      '..............F.',
      '..............F.',
    ]),
    up: T(13, [
      '.y..............',
      '.m..............',
      '.F..............',
      '.F..............',
      'F...............',
    ]),
    side: T(13, [
      '....y...........',
      '....m...........',
      '...F............',
      '...F............',
      '..F.............',
      '..F.............',
      '.F..............',
    ]),
  },
  small: {
    down: S(9, [
      '.............y..',
      '.............F..',
      '.............F..',
      '..............F.',
    ]),
    up: S(9, [
      '.y..............',
      '.F..............',
      '.F..............',
    ]),
    side: S(9, [
      '....y...........',
      '...F............',
      '...F............',
      '..F.............',
    ]),
  },
};

/** An apron over a skirt. */
const APRON: Heads = {
  tall: {
    down: T(15, ['......www.......', '.....wwwww......', '.....wwwww......', '.....wwwww......', '.....wwwww......', '.....wwwww......']),
    up: T(0, []),
    side: T(15, ['........ww......', '........www.....', '.........ww.....', '.........ww.....', '.........ww.....']),
  },
  small: {
    down: S(11, ['.....wwwww......', '.....wwwww......', '.....wwwww......']),
    up: S(0, []),
    side: S(11, ['........ww......', '.........ww.....', '.........ww.....']),
  },
};

/** A staff taller than its owner, in the right hand. */
const STAFF: Heads = {
  tall: {
    down: T(5, ['.Q', '.Q', '.Q', '.Q', '.Q', '.Q', '.Q', '.Q', '.Q', '.Q', '.Q', '.Q', '.Q', '.Q', '.Q', '.Q', '.Q', '.q'].map((r) => r.padEnd(W, '.'))),
    up: T(5, Array<string>(18).fill('.............Q..')),
    side: T(7, Array<string>(16).fill('...........Q....')),
  },
  small: {
    down: S(3, Array<string>(12).fill('.Q..............')),
    up: S(3, Array<string>(12).fill('.............Q..')),
    side: S(4, Array<string>(11).fill('...........Q....')),
  },
};

// ================================================================== looks

type Layer = 'under' | 'over' | 'top';

export interface Gear {
  art: Heads;
  /** per view: under the body, over it (but under the head), or over everything. A view left out is not drawn. */
  at: Partial<Record<View, Layer>>;
}

export interface Look {
  id: string;
  name: { pl: string; en: string };
  note: { pl: string; en: string };
  pal: Record<string, Color>;
  /** the colour of the line round each material; anything not listed gets `pal.o` */
  line: Record<string, Color>;
  head: Heads;
  body?: BodyKind;
  gear?: Gear[];
  /** he carries a shield on his near arm: from the side that arm does not swing */
  stillArm?: boolean;
  /** always drawn at this height, whatever the cell (a child among grown-ups) */
  only?: Size;
  /** changes a letter by where it is: the rings of a mail shirt */
  weave?: (ch: string, x: number, y: number) => string;
}

const BOB: readonly number[] = [0, 1, 1];

/** Lays `rows` over `grid`, `dy` rows down; `from`/`to` limit which rows of the drawing are used. */
function lay(grid: string[][], rows: string[], dy = 0, from = 0, to = rows.length): void {
  for (let y = from; y < to; y++) {
    const ty = y + dy;
    if (ty < 0 || ty >= grid.length) continue;
    for (let x = 0; x < W; x++) if (rows[y][x] !== '.') grid[ty][x] = rows[y][x];
  }
}

/** One frame of a look, as letters: the body in a pose, the head on it, the gear around them. */
export function dollLetters(look: Look, size: Size, view: View, pose: Pose): string[][] {
  const h = HEIGHT[size];
  const drawn = look.only ?? size;
  // a smaller drawing stands on the bottom of a taller cell
  const drop = h - HEIGHT[drawn];
  const grid = Array.from({ length: h }, () => Array<string>(W).fill('.'));
  const kind = look.body ?? 'shirt';
  const bob = kind === 'robe' ? 0 : BOB[pose];
  const gear = (at: Layer): void => {
    for (const g of look.gear ?? []) if (g.at[view] === at) lay(grid, g.art[drawn][view], drop + bob);
  };
  gear('under');
  const poses = BODY[drawn][kind][view];
  if (look.stillArm && view === 'side' && pose !== 0) {
    // the trunk of the stand, a row lower; the legs of the stride
    lay(grid, poses[0], drop + bob, 0, LEGS_FROM[drawn] - bob);
    lay(grid, poses[pose], drop, LEGS_FROM[drawn]);
  } else lay(grid, poses[pose], drop);
  if (look.weave) for (let y = 0; y < h; y++) for (let x = 0; x < W; x++) if (grid[y][x] !== '.') grid[y][x] = look.weave(grid[y][x], x, y - bob);
  gear('over');
  lay(grid, look.head[drawn][view], drop + bob);
  gear('top');
  return grid;
}

/**
 * How the line round a figure is drawn: the thing to compare when choosing a manner.
 *  - `tinted`: each stretch of line takes the dark of what it borders (the way of the later 16-bit years);
 *  - `dark`:   one dark line all round (the way of the earlier ones: harder, more like a comic). It is the
 *              warm dark every look already has for its eyes, so it costs no colour;
 *  - `none`:   no line at all; the figure is held together by its own shadows.
 */
export type Ink = 'tinted' | 'dark' | 'none';

/** Colours a frame and draws the line round it. */
export function dollFrame(look: Look, size: Size, view: View, pose: Pose, ink: Ink = 'tinted'): PixelBuffer {
  const grid = dollLetters(look, size, view, pose);
  const h = grid.length;
  const b = new PixelBuffer(W, h);
  const at = (x: number, y: number): string => (x < 0 || y < 0 || x >= W || y >= h ? '.' : grid[y][x]);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < W; x++) {
      const ch = grid[y][x];
      if (ch !== '.') {
        const c = look.pal[ch];
        if (c === undefined) throw new Error(`look "${look.id}" has no colour for "${ch}"`);
        b.set(x, y, c);
        continue;
      }
      if (ink === 'none') continue;
      // what is above a gap decides its line first: a figure is lit from above, its underside is darkest
      const n = at(x, y - 1) !== '.' ? at(x, y - 1) : at(x - 1, y) !== '.' ? at(x - 1, y) : at(x + 1, y) !== '.' ? at(x + 1, y) : at(x, y + 1);
      if (n !== '.') b.set(x, y, ink === 'dark' ? rgb(WARM) : (look.line[n] ?? look.pal.o));
    }
  return b;
}

/** Rows: facing down, up, side (right). Columns: stand, then the walk (stride, passing, other stride, passing). */
export function dollSheet(look: Look, size: Size, ink: Ink = 'tinted'): Sheet {
  const h = HEIGHT[size];
  const buf = new PixelBuffer(W * 5, h * 3);
  (['down', 'up', 'side'] as View[]).forEach((view, row) => {
    ([0, 1, 0, 2, 0] as Pose[]).forEach((pose, col) => buf.copy(dollFrame(look, size, view, pose, ink), col * W, row * h));
  });
  return { key: '', buf, fw: W, fh: h };
}

// ------------------------------------------------------------------ palettes
// Fifteen colours a look, the line included: what a 16-bit sprite had. So materials share: the leather of
// boots, belt and shield rim is one brown; the shadow of the trousers is the cool line; eyes are the warm one.

/** The two lines: a warm dark round skin, hair, leather and wood; a cool one round cloth and steel. */
const WARM = 0x33221a;
const COOL = 0x262b3d;
const WARM_KEYS = 'hHlsStkyfFqQeB';

/** `warm` lists the letters that take the warm line besides skin, hair and leather. */
function lines(warm = ''): Record<string, Color> {
  const out: Record<string, Color> = {};
  for (const k of WARM_KEYS + warm) out[k] = rgb(WARM);
  return out;
}

const hex = (map: Record<string, number>): Record<string, Color> => Object.fromEntries(Object.entries(map).map(([k, v]) => [k, rgb(v)]));

const SKIN = { s: 0xe2a880, S: 0xb37655, t: 0xf3c79f, e: WARM };
const LEATHER = { k: 0x5a3e2c, f: 0x5a3e2c, F: WARM, q: 0x5a3e2c, Q: 0x8a6030 };
const LINEN = { a: 0xd3c9b3, A: 0x9a917e, b: 0xece4d0 };

const ARM_SHIELD: Gear = { art: SHIELD, at: { down: 'over', side: 'over', up: 'under' } };
const BACK_SHIELD: Gear = { art: SHIELD_BACK, at: { down: 'under', side: 'under', up: 'over' } };
const CLOAK: Gear[] = [{ art: CLOAK_UNDER, at: { down: 'under', side: 'under' } }, { art: CLOAK_OVER, at: { up: 'over' } }];
const HIP_SWORD: Gear = { art: SWORD_HIP, at: { down: 'under', side: 'under', up: 'under' } };
const BOW: Gear[] = [{ art: BOW_UNDER, at: { down: 'under', side: 'under' } }, { art: BOW_OVER, at: { up: 'top' } }];
const PELT: Gear[] = [{ art: CLOAK_UNDER, at: { down: 'under', side: 'under' } }, { art: PELT_OVER, at: { up: 'over' } }];
const SHOULDERS: Gear = { art: MANTLE, at: { down: 'over', side: 'over', up: 'over' } };

/** The rings of a mail shirt: every other pixel of it is in shade. */
const mail = (ch: string, x: number, y: number): string => (ch === 'a' && (x & 1) === 0 && (y & 1) === 0 ? 'A' : ch);

export const HERO_LOOKS: Look[] = [
  {
    id: 'wojak',
    name: { pl: 'Wojak', en: 'Warrior' },
    note: { pl: 'chłopak ze wsi: krajka na czole, haftowana koszula, tarcza po ojcu', en: 'a village lad: a woven band, an embroidered shirt, his father\'s shield' },
    head: HEAD_WOJAK,
    gear: [ARM_SHIELD],
    stillArm: true,
    pal: hex({
      ...SKIN, ...LEATHER, ...LINEN, h: 0xc8922e, H: 0x8a6030, l: 0xe5b74c, B: 0x5a3e2c, r: 0xcc4646, R: 0x8a2233,
      y: 0xe5b74c, p: 0x4f6a8c, P: COOL, x: 0xcc4646, X: 0x8a2233, m: 0xd3c9b3, M: 0xece4d0, o: COOL,
    }),
    line: lines('rRxX'),
  },
  {
    id: 'druzynnik',
    name: { pl: 'Drużynnik', en: 'Man-at-arms' },
    note: { pl: 'szyszak z nosalem, kolczuga, płaszcz, wąsy: człowiek księcia', en: 'a conical helmet with a nasal, mail, a cloak, a moustache: the duke\'s man' },
    head: HEAD_DRUZYNNIK,
    gear: [...CLOAK, ARM_SHIELD],
    stillArm: true,
    weave: mail,
    pal: hex({
      ...SKIN, ...LEATHER, h: 0x7a583c, H: 0x5a3e2c, l: 0x7a583c, B: 0x5a3e2c,
      m: 0x8e9aa8, n: 0x5a6474, M: 0xdfe7ee, a: 0x8e9aa8, A: 0x5a6474, b: 0xb4c0cc,
      r: 0x5a80aa, R: 0x3c5c84, c: 0x3c5c84, C: 0x243a58, d: 0x5a80aa, y: 0xdfe7ee,
      p: 0x8a6030, P: 0x5a3e2c, x: 0x3c5c84, X: 0x243a58, q: 0x5a6474, Q: 0xb4c0cc, o: COOL,
    }),
    line: lines('pP'),
  },
  {
    id: 'lowca',
    name: { pl: 'Łowca', en: 'Hunter' },
    note: { pl: 'kaptur z pelerynką, skórzany kaftan, łuk i kołczan na plecach', en: 'a hood with its cape, a leather jerkin, a bow and a quiver on his back' },
    head: HEAD_LOWCA,
    gear: [HIP_SWORD, ...BOW, SHOULDERS],
    pal: hex({
      ...SKIN, ...LEATHER, h: 0x5a3e2c, H: WARM, l: 0x8a6030, B: 0x5a3e2c,
      c: 0x4c7246, C: 0x325036, d: 0x709c5e, a: 0x8a6030, A: 0x5a3e2c, b: 0xb0834a,
      r: 0x8a6030, R: 0x5a3e2c, y: 0xb0834a, p: 0x6c6a50, P: 0x45462f, w: 0xece4d0, m: 0xece4d0, Q: 0xb0834a, o: 0x1c2a22,
    }),
    line: lines('aAbpP'),
  },
  {
    id: 'wilczy',
    name: { pl: 'Wilczy kaptur', en: 'Wolf hood' },
    note: { pl: 'skóra wilka na głowie i plecach: uszy, kły przy skroniach', en: 'a wolf\'s pelt over his head and back: its ears, its fangs at his temples' },
    head: HEAD_WILCZY,
    gear: [HIP_SWORD, ...PELT, SHOULDERS],
    pal: hex({
      ...SKIN, ...LEATHER, B: 0x5a3e2c, c: 0x8c867e, C: 0x5a5450, d: 0xb8b2a6, w: 0xece4d0,
      a: 0x8a3438, A: 0x5c1f2a, b: 0xab4a44, r: 0x8a3438, R: 0x5c1f2a, y: 0xb8b2a6, m: 0xb8b2a6,
      p: 0x645c4c, P: 0x3e382e, o: COOL,
    }),
    line: lines('aAbpP'),
  },
  {
    id: 'kolpak',
    name: { pl: 'Kołpak', en: 'Fur cap' },
    note: { pl: 'czapka z futrzanym otokiem, zielona sukmana, tarcza na plecach', en: 'a cap with a fur brim, a green coat, the shield slung on his back' },
    head: HEAD_KOLPAK,
    gear: [HIP_SWORD, BACK_SHIELD],
    pal: hex({
      ...SKIN, ...LEATHER, h: 0x5a3e2c, H: WARM, l: 0x8a6030, B: WARM,
      c: 0xad2c39, C: 0x741d30, d: 0xcc4646, a: 0x3f6a52, A: 0x28463a, b: 0x5a8a6a,
      r: 0xe5b74c, R: 0x8a6030, k: 0xad2c39, y: 0xe5b74c, p: 0xb0a48a, P: 0x7c725e, q: 0x7c725e, Q: 0xb0a48a,
      x: 0xad2c39, X: 0x741d30, m: 0xe5b74c, M: 0xe5b74c, o: WARM,
    }),
    line: lines(),
  },
];

export const FOLK_LOOKS: Look[] = [
  {
    id: 'zielarka',
    name: { pl: 'Zielarka', en: 'Herbalist' },
    note: { pl: 'stara kobieta w kapturze, w fartuchu', en: 'an old woman in a hood and an apron' },
    head: HEAD_CHUSTA,
    body: 'robe',
    gear: [{ art: APRON, at: { down: 'over', side: 'over' } }],
    pal: hex({
      ...SKIN, ...LEATHER, h: 0xe9e6e2, B: 0x9a917e, c: 0x4f8474, C: 0x356056, d: 0x74a894,
      a: 0x7a583c, A: 0x5a3e2c, b: 0x9c7650, p: 0x7a583c, P: 0x5a3e2c, k: WARM, w: 0xece4d0, o: COOL,
    }),
    line: lines('aAbpP'),
  },
  {
    id: 'starzec',
    name: { pl: 'Starzec', en: 'Elder' },
    note: { pl: 'łysina, siwa broda do piersi, kij', en: 'a bald crown, a white beard to his chest, a staff' },
    head: HEAD_STARZEC,
    body: 'robe',
    gear: [{ art: STAFF, at: { down: 'top', side: 'top', up: 'under' } }],
    pal: hex({
      ...SKIN, ...LEATHER, ...LINEN, h: 0xd9d6d2, H: 0xa8a6ac, l: 0xffffff, B: 0xa8a6ac,
      p: 0xd3c9b3, P: 0x9a917e, k: 0xad2c39, o: COOL,
    }),
    line: lines(),
  },
  {
    id: 'gospodyni',
    name: { pl: 'Gospodyni', en: 'Housewife' },
    note: { pl: 'czerwona chusta, lniana koszula, spódnica i fartuch', en: 'a red kerchief, a linen blouse, a skirt and an apron' },
    head: HEAD_CHUSTA,
    body: 'robe',
    gear: [{ art: APRON, at: { down: 'over', side: 'over' } }],
    pal: hex({
      ...SKIN, ...LEATHER, ...LINEN, h: 0x7a583c, B: 0x5a3e2c, c: 0xcc4646, C: 0x8a2233, d: 0xea7864,
      p: 0x3c5c84, P: 0x243a58, w: 0xece4d0, o: COOL,
    }),
    line: lines('cCd'),
  },
  {
    id: 'dziecko',
    name: { pl: 'Dziecko', en: 'Child' },
    note: { pl: 'zawsze wzrostu jednego kafla', en: 'always one tile tall' },
    head: HEAD_WOJAK,
    only: 'small',
    pal: hex({
      ...SKIN, ...LEATHER, ...LINEN, h: 0xc8922e, H: 0x8a6030, l: 0xe5b74c, B: 0x5a3e2c, r: 0xc8922e, R: 0x8a6030,
      y: 0x8a6030, p: 0x8a6030, P: 0x5a3e2c, o: COOL,
    }),
    line: lines('rRpP'),
  },
];
