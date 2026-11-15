// One hero, many ways of drawing him: four finishes of one drawing (below), then five different hands.
//
// The hero is the one the game already has: fair hair under a red woven band whose ends fly behind him,
// a pale shirt, a red cloak, a round red shield. Here he is not redesigned, only redrawn, in four manners,
// so a manner can be chosen without the choice being about the character:
//
//   kreska    16 x 16   flat colour inside a black line: seven colours, the way of the late 8-bit years
//   szesnastka 16 x 16  three tones a material, highlights, a line tinted by what it borders: the 16-bit way
//   malowany  16 x 16   no line at all on the lit side, only a dark rim where the shadow falls; softer colours
//   wysoki    16 x 20   the 16-bit way again, a quarter of a tile taller: room for sleeves, a belt and legs
//
// All four keep the measures of the game's hero: a head eight pixels wide, a body no wider, two-pixel eyes.
// Like him they are put together from parts (head and trunk, legs, shield), and a step is the trunk sinking
// a pixel over one of three drawings of the legs.
//
// Letters:  h H l hair   s S t skin   e eye   r R band   a A b shirt   c C d cloak   k y belt, buckle
//           p P trousers   f F boots   x X shield   w its ring   m its boss   q Q its rim   o a drawn line

import { PixelBuffer, rgb, type Color } from '../core/PixelBuffer.ts';
import { art, type Sheet } from './sheet.ts';

export type View = 'down' | 'up' | 'side';
type Legs = readonly [string[], string[], string[]];

interface Stamp {
  rows: string[];
  x: number;
  y: number;
  /** drawn before the body: he is between us and it */
  behind?: boolean;
}

/**
 * How a figure gets its edge.
 *  - `drawn`:  the drawing has its own line (the letter `o`);
 *  - `tinted`: a line is added all round, each stretch in the dark of what it borders;
 *  - `rim`:    a line is added only below and to the right, where the shadow is.
 */
type Ink = 'drawn' | 'tinted' | 'rim';

export interface HeroStyle {
  id: string;
  name: { pl: string; en: string };
  note: { pl: string; en: string };
  fh: number;
  /** head and trunk, from the top of the cell */
  upper: Record<View, string[]>;
  /** the first row of the legs, and their three drawings: standing, one stride, the other */
  legsAt: number;
  legs: Record<View, Legs>;
  /** what he carries in each view: a shield, or a list of things (a sword and a shield, a bow, a bundle on a stick) */
  shield: Record<View, Stamp | Stamp[]>;
  pal: Record<string, Color>;
  ink: Ink;
  /** the colour of the added line next to each letter (anything not listed: `pal.o`) */
  line?: Record<string, Color>;
}

const W = 16;
const rows = (list: string[]): string[] => art(W, list);
const hex = (map: Record<string, number>): Record<string, Color> => Object.fromEntries(Object.entries(map).map(([k, v]) => [k, rgb(v)]));
const lines = (keys: string, c: number): Record<string, Color> => Object.fromEntries([...keys].map((k) => [k, rgb(c)]));

// ================================================================== kreska: flat colour, a black line

const KRESKA: HeroStyle = {
  id: 'kreska',
  name: { pl: 'Kreska', en: 'Line' },
  note: { pl: 'płaskie plamy w czarnym konturze, 7 kolorów: maniera późnych 8 bitów', en: 'flat colour inside a black line, 7 colours: the late 8-bit manner' },
  fh: 16,
  upper: {
    down: rows([
      '.....oooooo.....',
      '....ohhhhhho....',
      '...ohhhhhhhho...',
      '...orrrrrrrro...',
      '...ohhsssshho...',
      '...ohsessesho...',
      '...ossessesso...',
      '....osssssso....',
      '...orttttttro...',
      '..osttttttttso..',
      '..oobbbyybbboo..',
      '...otttttttto...',
    ]),
    up: rows([
      '.....oooooo.....',
      '....ohhhhhho....',
      '...ohhhhhhhho...',
      '...orrrrrrrro...',
      '...ohhhhhhhho...',
      '...ohhhhhhhho...',
      '...ohhhhhhhho...',
      '....ohhhhhho....',
      '...orrrrrrrro...',
      '..osrrrrrrrrso..',
      '..oorrrrrrrroo..',
      '...orrrrrrrro...',
    ]),
    side: rows([
      '.....oooooo.....',
      '....ohhhhhho....',
      '...ohhhhhhhho...',
      '.oorrrrrrrrro...',
      'orrohhhhsssso...',
      '.oorohhhsseso...',
      '...oohhhssesso..',
      '.....ohssssso...',
      '....orrtttto....',
      '...orrrttttso...',
      '...orrrbbbyo....',
      '...orrrtttto....',
    ]),
  },
  legsAt: 12,
  legs: {
    down: [
      rows(['...orrrrrrrro...', '...opppoopppo...', '...onnnoonnno...', '....ooo..ooo....']),
      rows(['...orrrrrrrro...', '...opppoonnno...', '...onnno.ooo....', '....ooo.........']),
      rows(['...orrrrrrrro...', '...onnnoopppo...', '....ooo.onnno...', '.........ooo....']),
    ],
    up: [
      rows(['...orrrrrrrro...', '...opppoopppo...', '...onnnoonnno...', '....ooo..ooo....']),
      rows(['...orrrrrrrro...', '...opppoonnno...', '...onnno.ooo....', '....ooo.........']),
      rows(['...orrrrrrrro...', '...onnnoopppo...', '....ooo.onnno...', '.........ooo....']),
    ],
    side: [
      rows(['...orrrrrro.....', '....oppoppo.....', '....onnonnno....', '....ooo.oooo....']),
      rows(['...orrrrrro.....', '...oppoooppo....', '..onnno..onnno..', '..oooo....oooo..']),
      rows(['...orrrrrro.....', '.....opppo......', '.....onnno......', '......ooo.......']),
    ],
  },
  shield: {
    down: { rows: ['..ooo..', '.orrro.', 'orrtrro', 'ortttro', 'orrtrro', '.orrro.', '..ooo..'], x: 8, y: 7 },
    up: { rows: ['..ooo..', '.orrro.', 'orrrrro', 'orrrrro', 'orrrrro', '.orrro.', '..ooo..'], x: 0, y: 7, behind: true },
    side: { rows: ['..ooo..', '.orrro.', 'orrtrro', 'ortttro', 'orrtrro', '.orrro.', '..ooo..'], x: 6, y: 7 },
  },
  pal: hex({ o: 0x16101e, e: 0x16101e, h: 0xe8b030, s: 0xf8c8a0, r: 0xd03838, t: 0xf8f0e0, b: 0x80502c, n: 0x80502c, y: 0xe8b030, p: 0x3c4c78 }),
  ink: 'drawn',
};

// ================================================================== szesnastka: shaded, a tinted line

const BIT16_HEAD: Record<View, string[]> = {
  down: [
    '................',
    '.....lllhhh.....',
    '....llhhhhhH....',
    '....rrrrrrrR....',
    '....hhsssshH....',
    '....hsessesH....',
    '....SsessesS....',
    '.....ssSSss.....',
  ],
  up: [
    '................',
    '.....lllhhh.....',
    '....llhhhhhH....',
    '....rrrrrrrR....',
    '....hlhhhhhH....',
    '....hhhhhhHH....',
    '....HhhhhhHH....',
    '.....HHHHHH.....',
  ],
  side: [
    '................',
    '.....lllhhh.....',
    '....lhhhhhhh....',
    '..rrrrrrrrrr....',
    '.RR.hhhhssss....',
    '...R.Hhhsses....',
    '.....Hhhssess...',
    '......HsssSs....',
  ],
};

const BIT16_PAL = hex({
  h: 0xd9a441, H: 0xa5722a, l: 0xf6d679, s: 0xf6cda4, S: 0xd0956a, e: 0x2c1b20,
  r: 0xd9534a, R: 0xb42f3b, c: 0xb42f3b, C: 0x7c2032, d: 0xd9534a,
  a: 0xe9e2d0, A: 0xb9ae98, b: 0xfbf7ec, k: 0x744c30, y: 0xf6d679,
  p: 0x43526a, P: 0x232a3e, f: 0x744c30, F: 0x2c1b20,
  x: 0xb42f3b, X: 0x7c2032, w: 0xfbf7ec, m: 0xb9ae98, q: 0x2c1b20, Q: 0x744c30, o: 0x232a3e,
});
/** warm round hair, skin, red cloth, leather and wood; the cool `o` round the shirt and the trousers */
const BIT16_LINE = lines('hHlsSerRcCdkyfFxXwmqQ', 0x2c1b20);

const SZESNASTKA: HeroStyle = {
  id: 'szesnastka',
  name: { pl: '16 bitów', en: '16-bit' },
  note: { pl: 'trzy tony na materiał, połysk, kontur w ciemnym odcieniu tego, co obrysowuje; 15 kolorów', en: 'three tones a material, highlights, a line tinted by what it borders; 15 colours' },
  fh: 16,
  upper: {
    down: rows([
      ...BIT16_HEAD.down,
      '....cbaaaaAC....',
      '...sbaaaaaaAS...',
      '....kkkyykkk....',
      '....baaaaaAA....',
    ]),
    up: rows([
      ...BIT16_HEAD.up,
      '....cdcccccC....',
      '...scdccccCCS...',
      '....cdccccCC....',
      '....cdcccCCC....',
    ]),
    side: rows([
      ...BIT16_HEAD.side,
      '.....ccaaaa.....',
      '....cccbaaas....',
      '....Ccckkky.....',
      '....CCcbaAA.....',
    ]),
  },
  legsAt: 12,
  legs: {
    down: [
      rows(['....rRrrrrRr....', '....ppP..ppP....', '....ffF..ffF....', '................']),
      rows(['....rRrrrrRr....', '....ppP..ffF....', '....ffF.........', '................']),
      rows(['....rRrrrrRr....', '....ffF..ppP....', '.........ffF....', '................']),
    ],
    up: [
      rows(['....CcCccCcC....', '....ppP..ppP....', '....ffF..ffF....', '................']),
      rows(['....CcCccCcC....', '....ppP..ffF....', '....ffF.........', '................']),
      rows(['....CcCccCcC....', '....ffF..ppP....', '.........ffF....', '................']),
    ],
    side: [
      rows(['....CcrrrR......', '.....pp.pP......', '.....ff.ffF.....', '................']),
      rows(['....CcrrrR......', '....pp...pP.....', '...ffF...ffF....', '................']),
      rows(['....CcrrrR......', '......ppP.......', '......ffF.......', '................']),
    ],
  },
  shield: {
    down: { rows: ['.dxx.', 'dxwxX', 'xwmwX', 'xxwXX', '.XXX.'], x: 9, y: 7 },
    up: { rows: ['.QQx.', 'QQxxX', 'QxxXX', 'qxXXX', '.qXX.'], x: 1, y: 7, behind: true },
    side: { rows: ['.dxx.', 'dxwxX', 'xwmwX', 'xxwXX', '.XXX.'], x: 7, y: 7 },
  },
  pal: BIT16_PAL,
  ink: 'tinted',
  line: BIT16_LINE,
};

// ================================================================== malowany: no line, a rim in the shade

const MALOWANY: HeroStyle = {
  id: 'malowany',
  name: { pl: 'Malowany', en: 'Painted' },
  note: { pl: 'bez konturu od strony światła, ciemny brzeg tylko w cieniu; miękkie, przesunięte barwy', en: 'no line on the lit side, a dark rim only in the shade; soft, hue-shifted colours' },
  fh: 16,
  upper: {
    down: rows([
      '................',
      '.....llllhh.....',
      '....lllhhhhH....',
      '....rrrrrrRR....',
      '....hhttsshH....',
      '....hsessesH....',
      '....SsessesS....',
      '.....ssSSss.....',
      '....dbbaaaAC....',
      '...tbbaaaaaAS...',
      '....kkkyykkk....',
      '....bbaaaaAA....',
    ]),
    up: rows([
      '................',
      '.....llllhh.....',
      '....lllhhhhH....',
      '....rrrrrrRR....',
      '....hllhhhhH....',
      '....hhhhhhHH....',
      '....hhhhhHHH....',
      '.....hhHHHH.....',
      '....ddccccCC....',
      '...tddccccCCS...',
      '....dcccccCC....',
      '....dccccCCC....',
    ]),
    side: rows([
      '................',
      '.....llllhh.....',
      '....llhhhhhh....',
      '..rrrrrrrrrr....',
      '.rR.hhhhttss....',
      '...R.hhhsses....',
      '.....Hhhssess...',
      '......HsssSs....',
      '.....dcbaaa.....',
      '....dccbaaat....',
      '....cccKkky.....',
      '....cCCbaAA.....',
    ]),
  },
  legsAt: 12,
  legs: {
    down: [
      rows(['....rrrrrrRR....', '....ppP..ppP....', '....ffF..ffF....', '................']),
      rows(['....rrrrrrRR....', '....ppP..ffF....', '....ffF.........', '................']),
      rows(['....rrrrrrRR....', '....ffF..ppP....', '.........ffF....', '................']),
    ],
    up: [
      rows(['....dcccCCCC....', '....ppP..ppP....', '....ffF..ffF....', '................']),
      rows(['....dcccCCCC....', '....ppP..ffF....', '....ffF.........', '................']),
      rows(['....dcccCCCC....', '....ffF..ppP....', '.........ffF....', '................']),
    ],
    side: [
      rows(['....cCrrrR......', '.....pp.pP......', '.....ff.ffF.....', '................']),
      rows(['....cCrrrR......', '....pp...pP.....', '...ffF...ffF....', '................']),
      rows(['....cCrrrR......', '......ppP.......', '......ffF.......', '................']),
    ],
  },
  shield: {
    down: { rows: ['.dxx.', 'dxwxX', 'xwmwX', 'xxwXX', '.XXX.'], x: 9, y: 7 },
    up: { rows: ['.QQx.', 'QQxxX', 'QxxXX', 'qxXXX', '.qXX.'], x: 1, y: 7, behind: true },
    side: { rows: ['.dxx.', 'dxwxX', 'xwmwX', 'xxwXX', '.XXX.'], x: 7, y: 7 },
  },
  pal: hex({
    h: 0xd6a04a, H: 0xbd7e56, l: 0xf2d488, s: 0xf3c6a0, S: 0xbd7e56, t: 0xfde0c0, e: 0x4e3230,
    r: 0xd0604e, R: 0xa83a44, c: 0xa83a44, C: 0x6e2440, d: 0xd0604e,
    a: 0xd9dad2, A: 0x9ea0ac, b: 0xf4f6ee, k: 0x7a5238, K: 0x4e3230, y: 0xf2d488,
    p: 0x4a5878, P: 0x2f3858, f: 0x7a5238, F: 0x4e3230,
    x: 0xa83a44, X: 0x6e2440, w: 0xf4f6ee, m: 0x9ea0ac, q: 0x4e3230, Q: 0x7a5238, o: 0x2f3858,
  }),
  ink: 'rim',
  // the rim is the deep tone of each family: wine under red, umber under hair and skin, slate under linen
  line: { ...lines('hHlsStekKyfFqQ', 0x4e3230), ...lines('rRcCdxXwm', 0x6e2440) },
};

// ================================================================== wysoki: the 16-bit manner, a tile and a quarter

const WYSOKI: HeroStyle = {
  id: 'wysoki',
  name: { pl: 'Wysoki 16x20', en: 'Tall 16x20' },
  note: { pl: 'maniera 16 bitów na 1,25 kafla: rękawy, pas, płaszcz po bokach, nogi z cholewami', en: 'the 16-bit manner at a tile and a quarter: sleeves, a belt, the cloak at his sides, legs in boots' },
  fh: 20,
  upper: {
    down: rows([
      ...BIT16_HEAD.down,
      '....cbaaaaAC....',
      '...bbaaaaaaAA...',
      '...baaaaaaaaA...',
      '...skkkyykkkS...',
      '...cbaaaaaaAC...',
      '...cbaaaaaAAC...',
      '...CrRrrrrRrC...',
    ]),
    up: rows([
      ...BIT16_HEAD.up,
      '....cdcccccC....',
      '...ccdcccccCC...',
      '...ccdccccCCC...',
      '...scdcccCcCS...',
      '...ccdcccCcCC...',
      '...ccdccCCcCC...',
      '...CcCccCCcCC...',
    ]),
    side: rows([
      ...BIT16_HEAD.side,
      '.....ccaaaa.....',
      '....cccbbaaA....',
      '....cccbaaaA....',
      '....Ccckksky....',
      '....CCcbaaAA....',
      '....CCcbaAA.....',
      '....CCcrrrR.....',
    ]),
  },
  legsAt: 15,
  legs: {
    down: [
      rows(['....ppP..ppP....', '....ppP..ppP....', '....ffF..ffF....', '....ffF..ffF....', '................']),
      rows(['....ppP..ppP....', '....ppP..ffF....', '....ffF..ffF....', '....ffF.........', '................']),
      rows(['....ppP..ppP....', '....ffF..ppP....', '....ffF..ffF....', '.........ffF....', '................']),
    ],
    up: [
      rows(['....ppP..ppP....', '....ppP..ppP....', '....ffF..ffF....', '....ffF..ffF....', '................']),
      rows(['....ppP..ppP....', '....ppP..ffF....', '....ffF..ffF....', '....ffF.........', '................']),
      rows(['....ppP..ppP....', '....ffF..ppP....', '....ffF..ffF....', '.........ffF....', '................']),
    ],
    side: [
      rows(['.....pp.pP......', '.....pp.pP......', '.....ff.fF......', '.....ff.ffF.....', '................']),
      rows(['.....pp.pP......', '....pp...pP.....', '...pp....ff.....', '...ffF...ffF....', '................']),
      rows(['.....pp.pP......', '......ppP.......', '......ffF.......', '......fffF......', '................']),
    ],
  },
  shield: {
    down: { rows: ['.dxx.', 'dxwxX', 'xwmwX', 'xxwXX', '.XXX.'], x: 9, y: 9 },
    up: { rows: ['.QQx.', 'QQxxX', 'QxxXX', 'qxXXX', '.qXX.'], x: 1, y: 9, behind: true },
    side: { rows: ['.dxx.', 'dxwxX', 'xwmwX', 'xxwXX', '.XXX.'], x: 7, y: 9 },
  },
  pal: BIT16_PAL,
  ink: 'tinted',
  line: BIT16_LINE,
};

export const HERO_STYLES: HeroStyle[] = [KRESKA, SZESNASTKA, MALOWANY, WYSOKI];

// ==================================================================================================
// Five other hands.
//
// The four manners above are one drawing finished four ways. These are five different drawings: the same
// hero (fair hair, the red band, a pale shirt, a red cloak, a round shield) as five different artists
// would see him. Proportions, the shape of the head, the eyes, the line and the palette all change.
//
//   bajka        16 x 16   a picture-book figure: a round head, dots for eyes, red cheeks, a cloak like a bell
//   klocek       16 x 16   built of blocks in the sixteen PICO-8 colours, with a hard shadow down its right side
//   kieszonkowy  16 x 16   the handheld-RPG hand: spiky fringe, big eyes with a glint, a red scarf
//   ludowy       16 x 16   folk paper-cut: flat festive colours, embroidery, striped trousers, a rosette shield
//   surowy       16 x 20   lean and grim: a small head, mail, a cloak to the knees, a sword on his back
//
// Extra letters:  p cheek   i iris   w white   g green   u blue   m M mail   d a lighter red   k black

const BAJKA: HeroStyle = {
  id: 'bajka',
  name: { pl: 'Bajka', en: 'Picture book' },
  note: { pl: 'jak z książeczki: okrągła głowa, oczy-kropki, rumieńce, płaszcz jak dzwonek; pastele i brązowa kreska', en: 'a picture-book figure: a round head, dot eyes, red cheeks, a bell of a cloak; pastels and a brown line' },
  fh: 16,
  upper: {
    down: rows([
      '................',
      '.......hh.......',
      '....hhhhhhhh....',
      '...hhhhhhhhhH...',
      '...rrrrrrrrrR...',
      '...hssssssssH...',
      '...ssessssess...',
      '...spssssssps...',
      '....ssssssSS....',
      '.....cttttc.....',
      '....ccttttcC....',
      '...sccbyybcCS...',
      '...cccttttcCC...',
    ]),
    up: rows([
      '................',
      '.......hh.......',
      '....hhhhhhhh....',
      '...hhhhhhhhhH...',
      '...rrrrrrrrrR...',
      '...hhhhhhhhhH...',
      '...hhhhhhhhHH...',
      '...HhhhhhhHHH...',
      '....HHHHHHHH....',
      '.....cccccC.....',
      '....cccccccC....',
      '...scccccccCS...',
      '...ccccccccCC...',
    ]),
    side: rows([
      '................',
      '......hh........',
      '....hhhhhhhh....',
      '...hhhhhhhhhh...',
      '.rrrrrrrrrrrr...',
      'rR.hhhhhsssss...',
      '...hhhhhssses...',
      '...Hhhhhsssps...',
      '....HHHhssss....',
      '.....ccctt......',
      '....ccccttt.....',
      '...cccccbyys....',
      '...ccccctttt....',
    ]),
  },
  legsAt: 13,
  legs: {
    down: [
      rows(['....CCrrrrCC....', '....nnn..nnn....', '................']),
      rows(['....CCrrrrCC....', '...nnnn...nn....', '................']),
      rows(['....CCrrrrCC....', '....nn...nnnn...', '................']),
    ],
    up: [
      rows(['....CCCCCCCC....', '....nnn..nnn....', '................']),
      rows(['....CCCCCCCC....', '...nnnn...nn....', '................']),
      rows(['....CCCCCCCC....', '....nn...nnnn...', '................']),
    ],
    side: [
      rows(['....CCCCrrr.....', '.....nnn.nnn....', '................']),
      rows(['....CCCCrrr.....', '....nnn...nnnn..', '................']),
      rows(['....CCCCrrr.....', '......nnnn......', '................']),
    ],
  },
  shield: {
    down: { rows: ['.xx.', 'xwwx', 'xwwX', '.XX.'], x: 10, y: 9 },
    up: { rows: ['.xx.', 'xxxx', 'xxxX', '.XX.'], x: 1, y: 9, behind: true },
    side: { rows: ['.xx.', 'xwwx', 'xwwX', '.XX.'], x: 8, y: 9 },
  },
  pal: hex({
    o: 0x4a2f2a, e: 0x4a2f2a, h: 0xf2cf6a, H: 0xd9a94e, r: 0xe2574c, R: 0xb8403f, s: 0xfbd9b5, S: 0xeab48e, p: 0xf29a8a,
    t: 0xfdf6e3, c: 0xe2574c, C: 0xb8403f, b: 0x8a5a3a, y: 0xf2cf6a, n: 0x8a5a3a, x: 0xe2574c, X: 0xb8403f, w: 0xfdf6e3,
  }),
  ink: 'tinted',
};

const KLOCEK: HeroStyle = {
  id: 'klocek',
  name: { pl: 'Klocek', en: 'Blocks' },
  note: { pl: 'z klocków: kanciasta głowa, oczy-kreski, twardy cień z prawej, czarny kontur; 16 barw PICO-8', en: 'built of blocks: a square head, bars for eyes, a hard shadow on the right, a black line; the PICO-8 colours' },
  fh: 16,
  upper: {
    down: rows([
      '................',
      '...hhhhhhhHHH...',
      '...hhhhhhhHHH...',
      '...rrrrrrrRRR...',
      '...hssssssSSH...',
      '...ssesssesSS...',
      '...ssesssesSS...',
      '...sssssssSSS...',
      '...cttttttTCC...',
      '...sttttttTTS...',
      '....bbbyybbb....',
      '....ttttttTT....',
    ]),
    up: rows([
      '................',
      '...hhhhhhhHHH...',
      '...hhhhhhhHHH...',
      '...rrrrrrrRRR...',
      '...hhhhhhhHHH...',
      '...hhhhhhhHHH...',
      '...hhhhhhhHHH...',
      '...hhhhhhhHHH...',
      '...cccccccCCC...',
      '...sccccccCCS...',
      '....ccccccCC....',
      '....ccccccCC....',
    ]),
    side: rows([
      '................',
      '...hhhhhhhhH....',
      '...hhhhhhhhH....',
      '.rrrrrrrrrrR....',
      'rR.hhhhhssss....',
      '...hhhhhsses....',
      '...HHhhhsses....',
      '...HHHHhssss....',
      '....cccttt......',
      '....cccttts.....',
      '....Cccbbby.....',
      '....CCcttT......',
    ]),
  },
  legsAt: 12,
  legs: {
    down: [
      rows(['....rrrrrrRR....', '....ppp..ppp....', '....nnn..nnN....', '................']),
      rows(['....rrrrrrRR....', '....ppp..nnN....', '....nnn.........', '................']),
      rows(['....rrrrrrRR....', '....nnn..ppp....', '.........nnN....', '................']),
    ],
    up: [
      rows(['....ccccccCC....', '....ppp..ppp....', '....nnn..nnN....', '................']),
      rows(['....ccccccCC....', '....ppp..nnN....', '....nnn.........', '................']),
      rows(['....ccccccCC....', '....nnn..ppp....', '.........nnN....', '................']),
    ],
    side: [
      rows(['....CCcrrR......', '.....pp.pp......', '.....nn.nnN.....', '................']),
      rows(['....CCcrrR......', '....pp...pp.....', '...nn....nnN....', '................']),
      rows(['....CCcrrR......', '......ppp.......', '......nnN.......', '................']),
    ],
  },
  shield: {
    down: { rows: ['xxxxX', 'xxwxX', 'xwwwX', 'xxwxX', 'XXXXX'], x: 9, y: 7 },
    up: { rows: ['xxxxX', 'xxxxX', 'xxxxX', 'xxxxX', 'XXXXX'], x: 1, y: 7, behind: true },
    side: { rows: ['xxxxX', 'xxwxX', 'xwwwX', 'xxwxX', 'XXXXX'], x: 7, y: 7 },
  },
  pal: hex({
    o: 0x000000, e: 0x000000, h: 0xffec27, H: 0xffa300, r: 0xff004d, R: 0x7e2553, s: 0xffccaa, S: 0xffa300,
    t: 0xfff1e8, T: 0xc2c3c7, c: 0xff004d, C: 0x7e2553, b: 0xab5236, y: 0xffec27, p: 0x1d2b53, n: 0xab5236, N: 0x5f574f,
    x: 0xff004d, X: 0x7e2553, w: 0xfff1e8,
  }),
  ink: 'tinted',
};

const KIESZONKOWY: HeroStyle = {
  id: 'kieszonkowy',
  name: { pl: 'Kieszonkowy', en: 'Handheld' },
  note: { pl: 'ręka z przenośnych RPG: nastroszona grzywka, duże oczy z błyskiem, czerwony szal, drobne ciało', en: 'the handheld-RPG hand: spiky fringe, big eyes with a glint, a red scarf, a small body' },
  fh: 16,
  upper: {
    down: rows([
      '................',
      '....hh.hhh.h....',
      '...hhlhhhhhhH...',
      '...hllhhhhhhH...',
      '...rrrrrrrrrR...',
      '...hhshhsshsH...',
      '...hswesswesH...',
      '...ssiessiesS...',
      '...ssssSSsssS...',
      '....sssssssS....',
      '....rrrrrrRR....',
      '...sttttttTTS...',
    ]),
    up: rows([
      '................',
      '....hh.hhh.h....',
      '...hhlhhhhhhH...',
      '...hllhhhhhhH...',
      '...rrrrrrrrrR...',
      '...hhhhrhhhhH...',
      '...hhhhRhhhHH...',
      '...hhhhhhhhHH...',
      '...HhHhhHhHHH...',
      '....HhHHhHH.....',
      '....rrrrrrRR....',
      '...srrrrrrRRS...',
    ]),
    side: rows([
      '................',
      '....hh.hhh.h....',
      '...hhlhhhhhh....',
      '...hllhhhhhhh...',
      '.rrrrrrrrrrrR...',
      'rR.hhhhhhshss...',
      '...hhhhhhsswe...',
      '...Hhhhhhssies..',
      '...HHhhhhsssS...',
      '....HHHhssss....',
      '....rrrrrrR.....',
      '....rrttttTs....',
    ]),
  },
  legsAt: 12,
  legs: {
    down: [
      rows(['....bbbyybbb....', '....ppp..ppp....', '....nnn..nnN....', '................']),
      rows(['....bbbyybbb....', '....ppp..nnN....', '....nnn.........', '................']),
      rows(['....bbbyybbb....', '....nnn..ppp....', '.........nnN....', '................']),
    ],
    up: [
      rows(['....rrrrrrRR....', '....ppp..ppp....', '....nnn..nnN....', '................']),
      rows(['....rrrrrrRR....', '....ppp..nnN....', '....nnn.........', '................']),
      rows(['....rrrrrrRR....', '....nnn..ppp....', '.........nnN....', '................']),
    ],
    side: [
      rows(['....rRbbby......', '.....pp.pp......', '.....nn.nnN.....', '................']),
      rows(['....rRbbby......', '....pp...pp.....', '...nn....nnN....', '................']),
      rows(['....rRbbby......', '......ppp.......', '......nnN.......', '................']),
    ],
  },
  shield: {
    down: { rows: ['.xx.', 'xwwx', 'xwwX', '.XX.'], x: 10, y: 10 },
    up: { rows: ['.xx.', 'xxxx', 'xxxX', '.XX.'], x: 1, y: 10, behind: true },
    side: { rows: ['.xx.', 'xwwx', 'xwwX', '.XX.'], x: 8, y: 10 },
  },
  pal: hex({
    o: 0x23203a, e: 0x23203a, h: 0xffd24a, H: 0xe09a2c, l: 0xfff0a0, r: 0xe8384a, R: 0xa8243c, s: 0xffe6cf, S: 0xf2b596,
    i: 0x3a7bd5, w: 0xffffff, t: 0xf4f6fa, T: 0xb9c2d6, b: 0x7a4a34, y: 0xffd24a, p: 0x3d4f8f, n: 0x7a4a34, N: 0x4a2c26,
    x: 0xe8384a, X: 0xa8243c,
  }),
  ink: 'tinted',
};

const LUDOWY: HeroStyle = {
  id: 'ludowy',
  name: { pl: 'Ludowy', en: 'Folk' },
  note: { pl: 'jak wycinanka: płaskie odświętne barwy, haft na koszuli i krajce, pasiaste portki, rozeta na tarczy', en: 'like a folk paper-cut: flat festive colours, embroidery, striped trousers, a rosette on the shield' },
  fh: 16,
  upper: {
    down: rows([
      '................',
      '.....hhhhhh.....',
      '....hhhhhhhh....',
      '....rtrtrtrt....',
      '....hhsssshh....',
      '....hsessesh....',
      '....spssssps....',
      '.....ssssss.....',
      '....rttttttr....',
      '...strtrtrtts...',
      '....kkkyykkk....',
      '....tttttttt....',
    ]),
    up: rows([
      '................',
      '.....hhhhhh.....',
      '....hhhhhhhh....',
      '....rtrtrtrt....',
      '....hhhrhhhh....',
      '....hhhrhhhh....',
      '....hhhhhhhh....',
      '.....hhhhhh.....',
      '....rrrrrrrr....',
      '...srrgyygrrs...',
      '....rrryyrrr....',
      '....rrgrrgrr....',
    ]),
    side: rows([
      '................',
      '.....hhhhhh.....',
      '....hhhhhhhh....',
      '..rtrtrtrtrt....',
      '.rr.hhhhssss....',
      '...r.hhhsses....',
      '.....hhhsspss...',
      '......hsssss....',
      '.....rrtttt.....',
      '....rrrtrtts....',
      '....rrrkkky.....',
      '....rrrtttt.....',
    ]),
  },
  legsAt: 12,
  legs: {
    down: [
      rows(['....rtrtrtrt....', '....gyr..gyr....', '....kkk..kkk....', '................']),
      rows(['....rtrtrtrt....', '....gyr..kkk....', '....kkk.........', '................']),
      rows(['....rtrtrtrt....', '....kkk..gyr....', '.........kkk....', '................']),
    ],
    up: [
      rows(['....tytytyty....', '....gyr..gyr....', '....kkk..kkk....', '................']),
      rows(['....tytytyty....', '....gyr..kkk....', '....kkk.........', '................']),
      rows(['....tytytyty....', '....kkk..gyr....', '.........kkk....', '................']),
    ],
    side: [
      rows(['....rrrtrtr.....', '.....gy.gyr.....', '.....kk.kkk.....', '................']),
      rows(['....rrrtrtr.....', '....gy...gyr....', '...kk....kkk....', '................']),
      rows(['....rrrtrtr.....', '......gyr.......', '......kkk.......', '................']),
    ],
  },
  shield: {
    down: { rows: ['.rrr.', 'rtytr', 'rygyr', 'rtytr', '.rrr.'], x: 9, y: 7 },
    up: { rows: ['.rrr.', 'rrrrr', 'rrrrr', 'rrrrr', '.rrr.'], x: 1, y: 7, behind: true },
    side: { rows: ['.rrr.', 'rtytr', 'rygyr', 'rtytr', '.rrr.'], x: 7, y: 7 },
  },
  pal: hex({ o: 0x17131f, e: 0x17131f, k: 0x17131f, h: 0xf2c230, y: 0xf2c230, r: 0xd9263a, g: 0x2f8f4e, s: 0xf7d3ac, p: 0xf08a8a, t: 0xfaf6ea }),
  ink: 'tinted',
};

const SUROWY: HeroStyle = {
  id: 'surowy',
  name: { pl: 'Surowy 16x20', en: 'Grim 16x20' },
  note: { pl: 'smukły i ponury: mała głowa, kolczuga, płaszcz do kolan, miecz na plecach; zgaszone barwy', en: 'lean and grim: a small head, mail, a cloak to the knees, a sword on his back; muted colours' },
  fh: 20,
  upper: {
    down: rows([
      '................',
      '......hhhh......',
      '.....hhhhhH.....',
      '..y..dddddc.....',
      '...m.sesseS.....',
      '....msssssS.....',
      '......sSSs......',
      '....cmmmmmmc....',
      '...cmMmMmMmmC...',
      '...cmmMmMmMmC...',
      '...cmMmMmMmmC...',
      '...csbbbybbsC...',
      '...cCtttttMCC...',
      '...cCttttMMCC...',
    ]),
    up: rows([
      '................',
      '......hhhh......',
      '.....hhhhhH.....',
      '.....dddddc..y..',
      '.....hhdhhH.m...',
      '.....hhchHHm....',
      '......HHHHb.....',
      '....dccccbCC....',
      '...dccccbcCCC...',
      '...dcccbccCCC...',
      '...dccbCccCCC...',
      '...dcbccCcCCC...',
      '...dbcccCcCCC...',
      '...ccccCCcCCC...',
    ]),
    side: rows([
      '................',
      '......hhhh......',
      '.....hhhhhh.....',
      '...dddddddc.....',
      '..dc.hhhsses....',
      '....yHhhsssss...',
      '....m.HhsSSs....',
      '.....ccmmmm.....',
      '....cccmMmMm....',
      '....cccMmMmm....',
      '....cccmMmMs....',
      '...ccccbbbby....',
      '...cccCtttM.....',
      '...ccCCttMM.....',
    ]),
  },
  legsAt: 14,
  legs: {
    down: [
      rows(['....CpP..pPC....', '....CpP..pPC....', '.....pP..pP.....', '.....bb..bb.....', '....bbb..bbb....', '................']),
      rows(['....CpP..pPC....', '....CpP..pPC....', '.....pP..bb.....', '.....bb..bb.....', '....bbb.........', '................']),
      rows(['....CpP..pPC....', '....CpP..pPC....', '.....bb..pP.....', '.....bb..bb.....', '.........bbb....', '................']),
    ],
    up: [
      rows(['....cCccCcCC....', '.....pP..pP.....', '.....pP..pP.....', '.....bb..bb.....', '.....bb..bb.....', '................']),
      rows(['....cCccCcCC....', '.....pP..pP.....', '.....pP..bb.....', '.....bb..bb.....', '.....bb.........', '................']),
      rows(['....cCccCcCC....', '.....pP..pP.....', '.....bb..pP.....', '.....bb..bb.....', '.........bb.....', '................']),
    ],
    side: [
      rows(['....CCppPP......', '....C.ppPP......', '......ppPP......', '......bbbb......', '......bbbbb.....', '................']),
      rows(['....CCppPP......', '....C.pp.pP.....', '.....pp...pP....', '.....bb...bb....', '....bbb...bbb...', '................']),
      rows(['....CCppPP......', '....C..pPP......', '.......pPP......', '.......bbb......', '.......bbbb.....', '................']),
    ],
  },
  shield: {
    down: { rows: ['.mmm.', 'mxxxm', 'mxwxM', 'mxxxM', '.MMM.'], x: 9, y: 8 },
    up: { rows: ['m', 'm', 'M', 'M'], x: 2, y: 9, behind: true },
    side: { rows: ['.mmm.', 'mxxxm', 'mxwxM', 'mxxxM', '.MMM.'], x: 7, y: 8 },
  },
  pal: hex({
    o: 0x15141d, e: 0x15141d, h: 0xcdb37a, H: 0x8f7a4e, y: 0xcdb37a, s: 0xdcab88, S: 0xa9795e,
    d: 0x9c3a3c, c: 0x7c2630, C: 0x4f1a27, m: 0x8d939c, M: 0x5c626e, t: 0xb9b3a3, b: 0x4a3428, p: 0x3b3f4c, P: 0x15141d,
    x: 0x7c2630, w: 0xb9b3a3,
  }),
  ink: 'tinted',
};

// ==================================================================================================
// Four incarnations.
//
// One tile each, in the clean finish of the game's own hero (a head eight pixels wide, two-pixel eyes,
// a tinted line). What changes is who he is. Each takes an archetype of adventure stories and makes
// a hero of our own out of it; none of them is a copy of anybody's character:
//
//   domator   the homebody on the road (the reluctant small hero of fairy-tale journeys): a mop of curls,
//             a sheepskin vest, a green travelling cloak, his bundle on a stick
//   smialek   the sword-and-shield lad of the 16-bit adventures: a bold one-colour tunic, sword drawn
//   polnocny  the northern archer of the comics: long black hair, a fur mantle, bare arms, a bow on his back
//   lowca     the monster hunter of the grim tales: ash-grey hair tied back, studded leather, a sword
//             on his back, the hag stone on his chest
//
// Extra letters:  v V vest   u U fur   z the hag stone   q bow wood

const WARM_LINE = 0x2c1b20;

const DOMATOR: HeroStyle = {
  id: 'domator',
  name: { pl: 'Domator', en: 'Homebody' },
  note: { pl: 'domator w drodze: czupryna loków, serdak, zielona opończa, tobołek na kiju', en: 'the homebody on the road: a mop of curls, a sheepskin vest, a green cloak, his bundle on a stick' },
  fh: 16,
  upper: {
    down: rows([
      '................',
      '.....hlhhlh.....',
      '...hlhhlhhlhH...',
      '...hhlhhhlhhH...',
      '...HhsssssshH...',
      '...hssessessH...',
      '....spessepS....',
      '.....ssSSss.....',
      '....cvaaaavC....',
      '...svvaaaavVS...',
      '....kkkyykkk....',
      '....vvaaaavV....',
    ]),
    up: rows([
      '................',
      '.....hlhhlh.....',
      '...hlhhlhhlhH...',
      '...hhlhhhlhhH...',
      '...HhhlhhhhhH...',
      '...hhhhhlhhHH...',
      '....HhhhhhHH....',
      '.....HHHHHH.....',
      '....ccccccCC....',
      '...scccccccCS...',
      '....ccccccCC....',
      '....cccccCCC....',
    ]),
    side: rows([
      '................',
      '.....hlhhlh.....',
      '...hlhhlhhlh....',
      '...hhlhhhlhhh...',
      '...Hhhlhhssss...',
      '...hhhhhhsses...',
      '....Hhhhhspess..',
      '.....HHhsssSs...',
      '.....ccvaaa.....',
      '....cccvvaas....',
      '....Ccckkky.....',
      '....CCcvvaA.....',
    ]),
  },
  legsAt: 12,
  legs: {
    down: [
      rows(['....ppP..ppP....', '....ppP..ppP....', '....ffF..ffF....', '................']),
      rows(['....ppP..ppP....', '....ppP..ffF....', '....ffF.........', '................']),
      rows(['....ppP..ppP....', '....ffF..ppP....', '.........ffF....', '................']),
    ],
    up: [
      rows(['....cCccCcCC....', '....ppP..ppP....', '....ffF..ffF....', '................']),
      rows(['....cCccCcCC....', '....ppP..ffF....', '....ffF.........', '................']),
      rows(['....cCccCcCC....', '....ffF..ppP....', '.........ffF....', '................']),
    ],
    side: [
      rows(['....CCcppP......', '.....pp.pP......', '.....ff.ffF.....', '................']),
      rows(['....CCcppP......', '....pp...pP.....', '...ffF...ffF....', '................']),
      rows(['....CCcppP......', '......ppP.......', '......ffF.......', '................']),
    ],
  },
  shield: {
    down: { rows: ['.rr.', '.wr.', '.rr.', '..v.', '..v.', '...v', '...v', '...v'], x: 0, y: 1, behind: true },
    up: { rows: ['.rr.', '.rw.', '.rr.', '.v..', '.v..', 'v...', 'v...', 'v...'], x: 12, y: 1, behind: true },
    side: { rows: ['.rr..', '.wr..', '.rr..', '..v..', '...v.', '....v'], x: 0, y: 2, behind: true },
  },
  pal: hex({
    o: WARM_LINE, e: WARM_LINE, h: 0x8a5a34, H: 0x5e3a22, l: 0xb07a48, s: 0xf6cda4, S: 0xd0956a, p: 0x6e4a32, P: 0x4a3222,
    a: 0xe9e2d0, A: 0xb9ae98, v: 0xc79a4e, V: 0x94692f, c: 0x4f7a4a, C: 0x33543a, k: 0x6e4a32, y: 0xe9e2d0, f: 0x94692f, F: 0x5e3a22,
    r: 0xc2343a, w: 0xe9e2d0,
  }),
  ink: 'tinted',
};
// his cheeks: the letter p is his trousers everywhere else, so the two pixels are painted here
DOMATOR.upper.down[6] = '....sSessesS....';
DOMATOR.upper.side[6] = '....HhhhhsSess..';

const SMIALEK: HeroStyle = {
  id: 'smialek',
  name: { pl: 'Śmiałek', en: 'Daredevil' },
  note: { pl: 'chłopak z mieczem i tarczą jak z 16-bitowych przygodówek: jedna śmiała barwa tuniki, miecz w dłoni', en: 'the sword-and-shield lad of the 16-bit adventures: a bold one-colour tunic, sword drawn' },
  fh: 16,
  upper: {
    down: rows([
      '................',
      '.....lllhhh.....',
      '....llhhhhhH....',
      '....rrrrrrrr....',
      '....hhhssshH....',
      '....hhessesH....',
      '....SsessesS....',
      '.....ssSSss.....',
      '....bawwwwaA....',
      '...sbaaaaaaAS...',
      '....kkkyykkk....',
      '....baaaaaAA....',
    ]),
    up: rows([
      '................',
      '.....lllhhh.....',
      '....llhhhhhH....',
      '....rrrrrrrr....',
      '....hlhhhhhH....',
      '....hhhhhhHH....',
      '....HhhhhhHH....',
      '.....HHhhHH.....',
      '....baahhaaA....',
      '...sbaaHaaaAS...',
      '....kkkkkkkk....',
      '....baaaaaAA....',
    ]),
    side: rows([
      '................',
      '.....lllhhh.....',
      '....lhhhhhhh....',
      '..rrrrrrrrrr....',
      '.rr.hhhhhsss....',
      '...r.Hhhsses....',
      '.....Hhhssess...',
      '......HsssSs....',
      '.....baawww.....',
      '....bbaaaaas....',
      '....Aakkkky.....',
      '....AAaaaAA.....',
    ]),
  },
  legsAt: 12,
  legs: {
    down: [
      rows(['....baaaaaAA....', '....ppP..ppP....', '....ffF..ffF....', '................']),
      rows(['....baaaaaAA....', '....ppP..ffF....', '....ffF.........', '................']),
      rows(['....baaaaaAA....', '....ffF..ppP....', '.........ffF....', '................']),
    ],
    up: [
      rows(['....baaaaaAA....', '....ppP..ppP....', '....ffF..ffF....', '................']),
      rows(['....baaaaaAA....', '....ppP..ffF....', '....ffF.........', '................']),
      rows(['....baaaaaAA....', '....ffF..ppP....', '.........ffF....', '................']),
    ],
    side: [
      rows(['....AAaaaA......', '.....pp.pP......', '.....ff.ffF.....', '................']),
      rows(['....AAaaaA......', '....pp...pP.....', '...ffF...ffF....', '................']),
      rows(['....AAaaaA......', '......ppP.......', '......ffF.......', '................']),
    ],
  },
  shield: {
    down: [
      { rows: ['.w.', '.w.', '.w.', '.w.', '.w.', 'yyy'], x: 1, y: 3 },
      { rows: ['.bxx.', 'bxwxX', 'xwwwX', 'xxwXX', '.XXX.'], x: 9, y: 7 },
    ],
    up: [
      { rows: ['.w.', '.w.', '.w.', '.w.', '.w.', 'yyy'], x: 12, y: 3 },
      { rows: ['.kkx.', 'kkxxX', 'kxxXX', 'kxXXX', '.kXX.'], x: 1, y: 7, behind: true },
    ],
    side: [
      { rows: ['..w', '..w', '.w.', '.w.', 'yy.'], x: 11, y: 4 },
      { rows: ['.bxx.', 'bxwxX', 'xwwwX', 'xxwXX', '.XXX.'], x: 6, y: 7 },
    ],
  },
  pal: hex({
    o: 0x1c2440, e: WARM_LINE, h: 0xe2b04a, H: 0xa9762e, l: 0xf8dc86, s: 0xf6cda4, S: 0xd0956a, r: 0xd9534a,
    a: 0x3f6cb4, A: 0x284a84, b: 0x6a94d6, w: 0xf2ead8, k: 0x744c30, y: 0xf8dc86, p: 0xe6dcc6, P: 0xb5a98f, f: 0x744c30, F: WARM_LINE,
    x: 0x3f6cb4, X: 0x284a84,
  }),
  ink: 'tinted',
  line: lines('hHlsSerkyfF', WARM_LINE),
};

const POLNOCNY: HeroStyle = {
  id: 'polnocny',
  name: { pl: 'Północny', en: 'Northman' },
  note: { pl: 'łucznik z północy jak z komiksu: długie czarne włosy, futro na barkach, gołe ramiona, łuk na plecach', en: 'the northern archer of the comics: long black hair, fur on his shoulders, bare arms, a bow on his back' },
  fh: 16,
  upper: {
    down: rows([
      '................',
      '.....hhhhhh.....',
      '....hlhhhhhh....',
      '....rrrrrrrr....',
      '....hhsssshh....',
      '....hsessesh....',
      '....hsessesh....',
      '....hhsSSshh....',
      '...uhuUuuUuhu...',
      '...sAaaaaaaAs...',
      '...kkkkyykkkk...',
      '....aaaaaaAA....',
    ]),
    up: rows([
      '................',
      '.....hhhhhh.....',
      '....hlhhhhhh....',
      '....rrrrrrrr....',
      '....hhhhhhhh....',
      '....hlhhhhhh....',
      '....hhhhhhhh....',
      '....hhhhhhhh....',
      '...uhhhhhhhhu...',
      '...sAhhhhhhAs...',
      '...kkkkkkkkkk...',
      '....aaaaaaAA....',
    ]),
    side: rows([
      '................',
      '.....hhhhhh.....',
      '....hlhhhhhh....',
      '....rrrrrrrr....',
      '....hhhhhsss....',
      '....hhhhsses....',
      '....hhhhssess...',
      '....hhhhhsSs....',
      '....hhuuuuu.....',
      '....hAaasaa.....',
      '.....kkkskk.....',
      '.....AaaaaA.....',
    ]),
  },
  legsAt: 12,
  legs: {
    down: [
      rows(['....aAaaaaAA....', '....ppP..ppP....', '....uuU..uuU....', '................']),
      rows(['....aAaaaaAA....', '....ppP..uuU....', '....uuU.........', '................']),
      rows(['....aAaaaaAA....', '....uuU..ppP....', '.........uuU....', '................']),
    ],
    up: [
      rows(['....aAaaaaAA....', '....ppP..ppP....', '....uuU..uuU....', '................']),
      rows(['....aAaaaaAA....', '....ppP..uuU....', '....uuU.........', '................']),
      rows(['....aAaaaaAA....', '....uuU..ppP....', '.........uuU....', '................']),
    ],
    side: [
      rows(['.....AaaaA......', '.....pp.pP......', '.....uu.uuU.....', '................']),
      rows(['.....AaaaA......', '....pp...pP.....', '...uuU...uuU....', '................']),
      rows(['.....AaaaA......', '......ppP.......', '......uuU.......', '................']),
    ],
  },
  shield: {
    down: {
      rows: ['.............q..', '.............q..', '............q...', '................', '................', '................', '................', '................', '...q............', '..q.............', '..q.............'],
      x: 0, y: 3, behind: true,
    },
    up: { rows: ['........q', '.......q.', '......q..', '.....q...', '....q....', '...q.....', '..q......', '.q.......', 'q........'], x: 4, y: 4 },
    side: { rows: ['..q', '.q.', '.q.', 'q..', 'q..', 'q..', '.q.', '.q.', '..q'], x: 1, y: 3, behind: true },
  },
  pal: hex({
    o: 0x17131c, e: 0x17131c, h: 0x35303a, l: 0x554c5c, s: 0xf0c49e, S: 0xc98e68, r: 0xb42f3b,
    u: 0x9a8a74, U: 0x64584a, a: 0x7a5232, A: 0x4e3220, k: 0x3a2a22, y: 0xc79a4e, p: 0x4a5a70, P: 0x2c3648, q: 0xc79a4e,
  }),
  ink: 'tinted',
};

const LOWCA_POTWOROW: HeroStyle = {
  id: 'lowca-potworow',
  name: { pl: 'Łowca potworów', en: 'Monster hunter' },
  note: { pl: 'łowca z ponurych opowieści: popielate włosy związane z tyłu, nabijana skóra, miecz na plecach, kamień z dziurką na piersi', en: 'the hunter of the grim tales: ash-grey hair tied back, studded leather, a sword on his back, the hag stone on his chest' },
  fh: 16,
  upper: {
    down: rows([
      '................',
      '.....lllhhh.....',
      '....llhhhhhH....',
      '....hhhhhhhH....',
      '....hssssssH....',
      '....hsessesH....',
      '....SsessesS....',
      '.....sSSSSs.....',
      '....arrrrrrA....',
      '...sblazaalAS...',
      '....kkkyykkk....',
      '....baaaaaAA....',
    ]),
    up: rows([
      '................',
      '.....lllhhh.....',
      '....llhhhhhH....',
      '....hhhhhhhH....',
      '....hlhhhhhH....',
      '....hhhhhhHH....',
      '....HhhhhhHH....',
      '.....HHhhHH.....',
      '....arrhhrrA....',
      '...sbaaHaaaAS...',
      '....kkkkkkkk....',
      '....baaaaaAA....',
    ]),
    side: rows([
      '................',
      '.....lllhhh.....',
      '....lhhhhhhh....',
      '....hhhhhhhh....',
      '...hhhhhssss....',
      '..hH.Hhhsses....',
      '.....Hhhssess...',
      '......HsSSSs....',
      '.....arrrr......',
      '....bbaalas.....',
      '....Aakkkky.....',
      '....AAaaaAA.....',
    ]),
  },
  legsAt: 12,
  legs: {
    down: [
      rows(['....aaaaaaAA....', '....ppP..ppP....', '....ffF..ffF....', '................']),
      rows(['....aaaaaaAA....', '....ppP..ffF....', '....ffF.........', '................']),
      rows(['....aaaaaaAA....', '....ffF..ppP....', '.........ffF....', '................']),
    ],
    up: [
      rows(['....aaaaaaAA....', '....ppP..ppP....', '....ffF..ffF....', '................']),
      rows(['....aaaaaaAA....', '....ppP..ffF....', '....ffF.........', '................']),
      rows(['....aaaaaaAA....', '....ffF..ppP....', '.........ffF....', '................']),
    ],
    side: [
      rows(['....AAaaaA......', '.....pp.pP......', '.....ff.ffF.....', '................']),
      rows(['....AAaaaA......', '....pp...pP.....', '...ffF...ffF....', '................']),
      rows(['....AAaaaA......', '......ppP.......', '......ffF.......', '................']),
    ],
  },
  shield: {
    down: { rows: ['y..', '.k.', '..k', '.yy'], x: 1, y: 4, behind: true },
    up: { rows: ['.......y', '......k.', '.....k..', '...yyy..', '....k...', '...k....', '..k.....', '.k......', 'k.......'], x: 5, y: 4 },
    side: { rows: ['y..', '.k.', '..k'], x: 2, y: 2, behind: true },
  },
  pal: hex({
    o: 0x14131a, e: 0x14131a, h: 0xa3a6a4, H: 0x6f7376, l: 0xd2d5d2, s: 0xeec3a0, S: 0xc28a68, r: 0xa8323a,
    a: 0x45404c, A: 0x2a2632, b: 0x625c6c, z: 0x7af0ff, k: 0x6a4a34, y: 0xc2a85c, p: 0x36363f, P: 0x14131a, f: 0x6a4a34, F: 0x14131a,
  }),
  ink: 'tinted',
};

/** The hero as four other people: an archetype each, a figure of our own every time. */
export const HERO_TYPES: HeroStyle[] = [DOMATOR, SMIALEK, POLNOCNY, LOWCA_POTWOROW];

// ==================================================================================================
// Four characters, four schools.
//
// The incarnations above differ in costume and share everything else: one body, one face, one line.
// These four are the same archetypes again, and nothing is shared: each has its own build, its own face,
// its own way with line and colour, as if it had come from a different game.
//
//   bajarz    16 x 16   picture-book: a plump little man, a mop of curls, dot eyes, a big nose, a brown line
//   zawadiaka 16 x 16   handheld-RPG: spiky hair, big eyes with a glint, a sword held high, a scarf in the wind
//   wiking    16 x 20   comic-book ink: a small head on wide shoulders, black shadows, blue sheen on black hair
//   cien      16 x 16   a silhouette: a hooded cloak to the ground, no face, only two glints, a glow, a red scarf
//
// Extra letters:  t T trousers (bajarz)   j the tip of a nose

const BAJARZ: HeroStyle = {
  id: 'bajarz',
  name: { pl: 'Domator', en: 'Homebody' },
  note: { pl: 'szkoła ilustracji dla dzieci: pulchny człowieczek, loki, oczy-kropki, duży nos, tobołek; brązowa kreska', en: 'picture-book school: a plump little man, curls, dot eyes, a big nose, a bundle; a brown line' },
  fh: 16,
  upper: {
    down: rows([
      '................',
      '................',
      '.....hlhhlh.....',
      '...hlhhlhhlhH...',
      '...hhlhhhlhhH...',
      '...HssssssssH...',
      '...ssessssesS...',
      '...sjssjjssjS...',
      '....ssssssSS....',
      '....vvaaaavV....',
      '..svvvaaaavvVS..',
      '...vvvayaavvV...',
      '....vvaaaavV....',
    ]),
    up: rows([
      '................',
      '................',
      '.....hlhhlh.....',
      '...hlhhlhhlhH...',
      '...hhlhhhlhhH...',
      '...hlhhhhhlhH...',
      '...hhhlhhhhHH...',
      '...HhhhhlhhHH...',
      '....HHhhhhHH....',
      '....vvvvvvVV....',
      '..svvvvvvvvVVS..',
      '...vvvvvvvVVV...',
      '....vvvvvvVV....',
    ]),
    side: rows([
      '................',
      '................',
      '.....hlhhlh.....',
      '...hlhhlhhlh....',
      '...hhlhhhlhhh...',
      '...Hhhlhsssss...',
      '...hhhhhssses...',
      '...Hhhhhsjssjj..',
      '....HHhhssss....',
      '....vvvaaa......',
      '...vvvvaaas.....',
      '...vvvvayaa.....',
      '....vvvaaa......',
    ]),
  },
  legsAt: 13,
  legs: {
    down: [
      rows(['....ttttttTT....', '....nnn..nnn....', '................']),
      rows(['....ttttttTT....', '...nnnn...nn....', '................']),
      rows(['....ttttttTT....', '....nn...nnnn...', '................']),
    ],
    up: [
      rows(['....ttttttTT....', '....nnn..nnn....', '................']),
      rows(['....ttttttTT....', '...nnnn...nn....', '................']),
      rows(['....ttttttTT....', '....nn...nnnn...', '................']),
    ],
    side: [
      rows(['....tttttT......', '....nnn.nnn.....', '................']),
      rows(['....tttttT......', '...nnn...nnnn...', '................']),
      rows(['....tttttT......', '.....nnnn.......', '................']),
    ],
  },
  shield: {
    down: { rows: ['.rr', '.wr', '.rr', '..k', '..k', '..k', '..k'], x: 0, y: 3 },
    up: { rows: ['rr.', 'rw.', 'rr.', 'k..', 'k..', 'k..', 'k..'], x: 13, y: 3 },
    side: { rows: ['.rr.', '.wr.', '.rrk', '...k'], x: 0, y: 5, behind: true },
  },
  pal: hex({
    o: 0x4a2f2a, e: 0x4a2f2a, h: 0x9a6436, H: 0x6e4426, l: 0xc08a52, s: 0xfbd6b0, S: 0xe9a98a, j: 0xf09a86,
    a: 0xfaf3df, v: 0x5f8f52, V: 0x3f6a3c, y: 0xf2cf6a, t: 0x8a5a3a, T: 0x6a4028, n: 0x6a4028, r: 0xe2574c, w: 0xfaf3df, k: 0xc08a52,
  }),
  ink: 'tinted',
};

const ZAWADIAKA: HeroStyle = {
  id: 'zawadiaka',
  name: { pl: 'Śmiałek', en: 'Daredevil' },
  note: { pl: 'szkoła przenośnych RPG: nastroszone włosy, duże oczy z błyskiem, miecz w górze, szal na wietrze; żywe barwy', en: 'handheld-RPG school: spiky hair, big eyes with a glint, a sword held high, a scarf in the wind; bright colours' },
  fh: 16,
  upper: {
    down: rows([
      '................',
      '....hh.hhh.h....',
      '...hhlhhhhhhH...',
      '...hllhhhhhhH...',
      '...rrrrrrrrrR...',
      '...hhhshhsshH...',
      '...hswesswesH...',
      '...ssiessiesS...',
      '...ssssSSsssS...',
      '....sssssssS....',
      '....rrrrrrRR....',
      '...sbaaaaaAAs...',
    ]),
    up: rows([
      '................',
      '....hh.hhh.h....',
      '...hhlhhhhhhH...',
      '...hllhhhhhhH...',
      '...rrrrrrrrrR...',
      '...hhhhrhhhhH...',
      '...hhhhRhhhHH...',
      '...hhhhhhhhHH...',
      '...HhHhhHhHHH...',
      '....HhHHhHH.....',
      '....rrrrrrRR....',
      '...sbaaaaaAAs...',
    ]),
    side: rows([
      '................',
      '....hh.hhh.h....',
      '...hhlhhhhhh....',
      '...hllhhhhhhh...',
      '.rrrrrrrrrrrR...',
      'rR.hhhhhhshss...',
      '...hhhhhhsswe...',
      '...Hhhhhhssies..',
      '...HHhhhhsssS...',
      '....HHHhssss....',
      '....rrrrrrR.....',
      '....bbaaaaAs....',
    ]),
  },
  legsAt: 12,
  legs: {
    down: [
      rows(['....kkkyykkk....', '....ppp..ppp....', '....nnn..nnN....', '................']),
      rows(['....kkkyykkk....', '....ppp..nnN....', '....nnn.........', '................']),
      rows(['....kkkyykkk....', '....nnn..ppp....', '.........nnN....', '................']),
    ],
    up: [
      rows(['....kkkkkkkk....', '....ppp..ppp....', '....nnn..nnN....', '................']),
      rows(['....kkkkkkkk....', '....ppp..nnN....', '....nnn.........', '................']),
      rows(['....kkkkkkkk....', '....nnn..ppp....', '.........nnN....', '................']),
    ],
    side: [
      rows(['....Aakkky......', '.....pp.pp......', '.....nn.nnN.....', '................']),
      rows(['....Aakkky......', '....pp...pp.....', '...nn....nnN....', '................']),
      rows(['....Aakkky......', '......ppp.......', '......nnN.......', '................']),
    ],
  },
  shield: {
    down: [
      { rows: ['.w', '.w', '.w', '.w', '.w', '.w', 'yy'], x: 1, y: 4 },
      { rows: ['rr.', '..R'], x: 12, y: 10 },
    ],
    up: [
      { rows: ['w.', 'w.', 'w.', 'w.', 'w.', 'w.', 'yy'], x: 13, y: 4 },
      { rows: ['.rr', 'R..'], x: 1, y: 10 },
    ],
    side: { rows: ['..w', '..w', '.w.', '.w.', 'yy.'], x: 12, y: 5 },
  },
  pal: hex({
    o: 0x1f1d36, e: 0x1f1d36, h: 0xffd24a, H: 0xe09a2c, l: 0xfff0a0, r: 0xe8384a, R: 0xa8243c, s: 0xffe6cf, S: 0xf2b596,
    i: 0x3a7bd5, w: 0xffffff, a: 0x2f6fd0, A: 0x1f4a9a, b: 0x5a94ea, k: 0x7a4a34, y: 0xffd24a, p: 0xffffff, n: 0x7a4a34, N: 0x4a2c26,
  }),
  ink: 'tinted',
};

const WIKING: HeroStyle = {
  id: 'wiking',
  name: { pl: 'Północny', en: 'Northman' },
  note: { pl: 'szkoła komiksu: mała głowa na szerokich barach, czarne plamy cienia, granatowy połysk na czarnych włosach, łuk', en: 'comic-book school: a small head on wide shoulders, black spot shadows, a blue sheen on black hair, a bow' },
  fh: 20,
  upper: {
    down: rows([
      '................',
      '......hhhh......',
      '.....hlhhhh.....',
      '.....rrrrrr.....',
      '.....hksskh.....',
      '.....hssSSh.....',
      '....hhssSShh....',
      '..uuUuhsshuUuu..',
      '..sUuuUuuUuuUs..',
      '..ss.aaaaaa.ss..',
      '..sS.aaaaaA.sS..',
      '..kk.aaaaaA.kk..',
      '..ss.kkyykk.sS..',
      '.....aaaaaA.....',
    ]),
    up: rows([
      '................',
      '......hhhh......',
      '.....hlhhhh.....',
      '.....rrrrrr.....',
      '.....hhlhhh.....',
      '.....hhhhhh.....',
      '....hhhlhhhh....',
      '..uuUhhhhhhUuu..',
      '..sUuhhlhhhuUs..',
      '..ss.ahhhha.ss..',
      '..sS.aahhaA.sS..',
      '..kk.aaaaaA.kk..',
      '..ss.kkkkkk.sS..',
      '.....aaaaaA.....',
    ]),
    side: rows([
      '................',
      '......hhhh......',
      '.....hlhhhh.....',
      '.....rrrrrr.....',
      '.....hhhsks.....',
      '.....hhhssss....',
      '....hhhhsSS.....',
      '....hhuuUuu.....',
      '....hhuUuuUu....',
      '.....aasSa......',
      '.....aasSa......',
      '.....aakka......',
      '.....kkssky.....',
      '.....aaaaA......',
    ]),
  },
  legsAt: 14,
  legs: {
    down: [
      rows(['.....pp..pP.....', '.....pp..pP.....', '.....pp..pP.....', '.....uu..uU.....', '....uuu..uuU....', '................']),
      rows(['.....pp..pP.....', '.....pp..pP.....', '.....pp..uU.....', '.....uu..uU.....', '....uuu.........', '................']),
      rows(['.....pp..pP.....', '.....pp..pP.....', '.....uu..pP.....', '.....uu..uU.....', '.........uuU....', '................']),
    ],
    up: [
      rows(['.....pp..pP.....', '.....pp..pP.....', '.....pp..pP.....', '.....uu..uU.....', '.....uu..uU.....', '................']),
      rows(['.....pp..pP.....', '.....pp..pP.....', '.....pp..uU.....', '.....uu..uU.....', '.....uu.........', '................']),
      rows(['.....pp..pP.....', '.....pp..pP.....', '.....uu..pP.....', '.....uu..uU.....', '.........uU.....', '................']),
    ],
    side: [
      rows(['......ppP.......', '......ppP.......', '......ppP.......', '......uuU.......', '......uuuU......', '................']),
      rows(['......ppP.......', '.....pp.pP......', '....pp...pP.....', '....uu...uU.....', '...uuu...uuU....', '................']),
      rows(['......ppP.......', '......pPp.......', '.......pp.......', '.......uu.......', '.......uuu......', '................']),
    ],
  },
  shield: {
    down: {
      rows: ['.............q..', '..............q.', '..............q.', '................', '................', '................', '................', '................', '................', '................', '.q..............', '.q..............', '..q.............'],
      x: 0, y: 3, behind: true,
    },
    up: { rows: ['.......q', '......q.', '.....q..', '....q...', '....q...', '...q....', '..q.....', '.q......', 'q.......'], x: 4, y: 6 },
    side: { rows: ['..q', '.q.', '.q.', 'q..', 'q..', 'q..', 'q..', '.q.', '.q.', '..q'], x: 1, y: 4, behind: true },
  },
  pal: hex({
    o: 0x0d0c12, e: 0x0d0c12, k: 0x0d0c12, h: 0x1c1a26, l: 0x4a66a8, s: 0xe8b48c, S: 0xb9805e, r: 0xc2343a,
    u: 0xa8926e, U: 0x6e5c44, a: 0x7a4a2c, A: 0x4e2e1c, y: 0xd8b04a, p: 0x3d4c6e, P: 0x26304a, q: 0xd8b04a,
  }),
  ink: 'tinted',
};

const CIEN: HeroStyle = {
  id: 'cien',
  name: { pl: 'Łowca', en: 'Hunter' },
  note: { pl: 'szkoła sylwetki: kaptur i płaszcz do ziemi, bez twarzy, tylko dwa błyski oczu, kamień i czerwony szal; bez konturu', en: 'silhouette school: a hood and a cloak to the ground, no face, only two glints, the stone and a red scarf; no line' },
  fh: 16,
  upper: {
    down: rows([
      '................',
      '.......dd.......',
      '......dccc......',
      '.....dccccC.....',
      '....dccccccC....',
      '....cckkkkcC....',
      '....ckekkekC....',
      '....chkkkkCC....',
      '....crrrrrrC....',
      '...dccczcccCC...',
      '...dcccccccCC...',
      '...dccccCccCC...',
      '..dccccCcccCCC..',
    ]),
    up: rows([
      '................',
      '.......dd.......',
      '......dccc......',
      '.....dccccC.....',
      '....dccccccC....',
      '....dccccccC....',
      '....dcccccCC....',
      '....ccccccCC....',
      '....dcccccCC....',
      '...dccccccCCC...',
      '...dcccccCcCC...',
      '...dccccCccCC...',
      '..dccccCcccCCC..',
    ]),
    side: rows([
      '................',
      '......dd........',
      '.....dccc.......',
      '....dccccc......',
      '...dccccccC.....',
      '...ccccckkkC....',
      '...cccchkekC....',
      '....ccckkkC.....',
      '....cccrrrr.....',
      '...dccccccC.....',
      '...dccccccC.....',
      '...dcccCccC.....',
      '..dccccCcccC....',
    ]),
  },
  legsAt: 13,
  legs: {
    down: [
      rows(['..dcccCccCccCC..', '..CnnCCCCCCnnC..', '................']),
      rows(['..dcccCccCccCC..', '..CnnnCCCCCnCC..', '................']),
      rows(['..dcccCccCccCC..', '..CCnCCCCCnnnC..', '................']),
    ],
    up: [
      rows(['..dcccCccCccCC..', '..CCCCCCCCCCCC..', '................']),
      rows(['..dcccCccCccCC..', '.CCCCCCCCCCCC...', '................']),
      rows(['..dcccCccCccCC..', '...CCCCCCCCCCCC.', '................']),
    ],
    side: [
      rows(['..dcccCccCcC....', '..CCCCCCCnnn....', '................']),
      rows(['..dcccCccCcC....', '..CCnnCCCCnnn...', '................']),
      rows(['..dcccCccCcC....', '...CCCCCnnn.....', '................']),
    ],
  },
  shield: {
    down: { rows: ['y..', '.m.', '..m'], x: 1, y: 3, behind: true },
    up: { rows: ['.......y', '......n.', '....yyy.', '....n...', '...n....', '..n.....', '.n......', 'n.......'], x: 5, y: 3 },
    side: { rows: ['y.', '.m'], x: 1, y: 2, behind: true },
  },
  pal: hex({
    c: 0x34323f, C: 0x24222e, d: 0x55536a, k: 0x0e0d14, e: 0xd8f4ff, h: 0xb9bcb8, r: 0xa8323a, z: 0x7af0ff,
    n: 0x4a3428, y: 0xc2a85c, m: 0xc9d2da, o: 0x0e0d14,
  }),
  ink: 'drawn',
};

/** The archetypes again, each from a different school of drawing. */
export const HERO_SCHOOLS: HeroStyle[] = [BAJARZ, ZAWADIAKA, WIKING, CIEN];

/** The same hero as five different artists would draw him. */
export const HERO_HANDS: HeroStyle[] = [BAJKA, KLOCEK, KIESZONKOWY, LUDOWY, SUROWY];

// ------------------------------------------------------------------ putting him together

function lay(grid: string[][], drawing: string[], x: number, y: number): void {
  for (let j = 0; j < drawing.length; j++) {
    const ty = y + j;
    if (ty < 0 || ty >= grid.length) continue;
    for (let i = 0; i < drawing[j].length; i++) {
      const tx = x + i;
      if (drawing[j][i] !== '.' && tx >= 0 && tx < W) grid[ty][tx] = drawing[j][i];
    }
  }
}

/** One frame: `pose` 0 stands, 1 and 2 are the two strides (the trunk sinks a pixel over the legs). */
export function styleFrame(s: HeroStyle, view: View, pose: 0 | 1 | 2): PixelBuffer {
  const grid = Array.from({ length: s.fh }, () => Array<string>(W).fill('.'));
  const dy = pose === 0 ? 0 : 1;
  const carried = [s.shield[view]].flat();
  for (const c of carried) if (c.behind) lay(grid, c.rows, c.x, c.y + dy);
  lay(grid, s.legs[view][pose], 0, s.legsAt);
  lay(grid, s.upper[view], 0, dy);
  for (const c of carried) if (!c.behind) lay(grid, c.rows, c.x, c.y + dy);

  const b = new PixelBuffer(W, s.fh);
  const at = (x: number, y: number): string => (x < 0 || y < 0 || x >= W || y >= s.fh ? '.' : grid[y][x]);
  for (let y = 0; y < s.fh; y++)
    for (let x = 0; x < W; x++) {
      const ch = grid[y][x];
      if (ch !== '.') {
        const c = s.pal[ch];
        if (c === undefined) throw new Error(`style "${s.id}" has no colour for "${ch}"`);
        b.set(x, y, c);
        continue;
      }
      if (s.ink === 'drawn') continue;
      // what is above a gap decides its line first, then what is to its left: the shadow side
      const up = at(x, y - 1);
      const left = at(x - 1, y);
      const n = up !== '.' ? up : left !== '.' ? left : s.ink === 'tinted' ? (at(x + 1, y) !== '.' ? at(x + 1, y) : at(x, y + 1)) : '.';
      if (n !== '.') b.set(x, y, s.line?.[n] ?? s.pal.o);
    }
  return b;
}

/** Rows: facing down, up, side (right). Columns: stand, then the walk (stride, stand, other stride, stand). */
export function styleSheet(s: HeroStyle): Sheet {
  const buf = new PixelBuffer(W * 5, s.fh * 3);
  (['down', 'up', 'side'] as View[]).forEach((view, row) => {
    ([0, 1, 0, 2, 0] as const).forEach((pose, col) => buf.copy(styleFrame(s, view, pose), col * W, row * s.fh));
  });
  return { key: '', buf, fw: W, fh: s.fh };
}
