// M9 zjawa-b: a drowned townswoman of Zwonigród (24 x 24, facing us, floating). Its home is Nawia: that is the
// form that fights; in Jawia it is only an echo.
//
// The idea: she went under with her arms up, reaching for the surface, and she still hangs that way, as if the lake
// were over her: lifted by her wrists, which are bound with an embroidered towel (the dead were tied for the wake,
// and the ties had to be cut before the grave, or the dead came back). The wide sleeves of her shirt have slid down
// to the elbows and hang from her raised arms in heavy wet drapes, so she is a wide shape, not a stick: a bell of
// sodden linen with a narrow body under it. Her head hangs forward between her arms under the burial veil; her hair
// falls over her face and down her chest to the waist, and through it show two small lights, which are all she has
// for eyes. The shirt clings, weed at the hem, and below the hem there is nothing: it frays into strands.
// Light from the upper left: the left edges of the veil, the sleeve and the body are lit; the right side is wet
// shadow.
//
// How it moves: it drifts like a hanged body, a pendulum swinging from the wrists: the hands stay, the head and the
// sleeves go a pixel to the side, the body two, the strands of the hem and the drips from the sleeves lag the other
// way; at the bottom of each swing she sinks a pixel and the strands trail the way she came.
// How it attacks:
//  - the wind-up: she is pulled up tall, the arms straight, the sleeves flung up and out like wings (a wide V, the
//    biggest shape she makes), the hem gathered under her, the head lifted, and the two lights flare in her hair;
//  - the blow: the swoop; the ties tear, the arms are flung out and down with the long fingers spread, the hair, the
//    veil and the sleeves stream back over her, and the face shows under the hair: two lights over a mouth torn open;
//  - the recovery: the overshoot; she sinks low and slumps, the head hung so low no face shows, the arms limp at
//    her sides with the torn towel ends hanging from the wrists, the rags still swinging on: the opening.
// Hit, she snaps back: the head thrown back (the hair flung up, only the chin and the throat to see), an arm jerked
// up, the shroud crumpled and torn across.
//
// Nawia: the same frames under the lake: the linen is the lake's blue, its lit edges glow cold, the eyes are white;
// the embroidery stays red, an ember. The line is near black all round (none round the frayed strands), so she
// stands out from the navy floor and its cyan seams.

import type { Beast } from './beast.ts';

const W = 24;
const H = 24;

/** Lays parts over each other at (dx, dy); a later part covers an earlier one; '.' lets it show. */
function stack(...parts: [number, number, string[]][]): string[] {
  const grid = Array.from({ length: H }, () => Array<string>(W).fill('.'));
  for (const [dx, dy, rows] of parts)
    rows.forEach((r, y) => {
      const ty = y + dy;
      if (ty >= 0 && ty < H - 1) [...r].forEach((ch, x) => ch !== '.' && x + dx >= 0 && x + dx < W && (grid[ty][x + dx] = ch));
    });
  return grid.map((r) => r.join(''));
}

// ------------------------------------------------------------------ the parts of the hanging pose (rows from the top of the cell)

/** the wrists bound over her head, the bare forearms, the wide wet sleeves slid down to the elbows and hanging
 *  from them, the head hung between the arms under its veil, the hair down over the face, two lights in it */
const TOP = [
  '..........s..S..........',
  '..........sssS..........',
  '.........wrrrrL.........',
  '........sswrrLSS........',
  '.......ssS.r..sSS.......',
  '......ssS..w...sSS......',
  '.....wsS...r....sSL.....',
  '....wllS..wwl...SLLd....',
  '...wlllL.wwllL..LLLLd...',
  '...wlllL.kwlLLk.LLLLd...',
  '..wllllL.kKkkKk.LLLLLd..',
  '..wlllLL.kKekeK.LLdLLd..',
  '..wllLLL.kKkkKk.LLLdLd..',
  '..wlLlLLwkKkkKkdLLdLLd..',
];
/** the sleeves' wet ends: hanging, lagging right (she swings left), lagging left */
const ENDS = {
  hang: ['..v.lL.L........L.Ld.u..', '...v..u...........v..u..'],
  left: ['...v.lL.L........L.Ld.u.', '....v..u...........v..u.'],
  right: ['.v.lL.L........L.Ld.u...', '..v..u...........v..u...'],
};
/** the body under the hair: narrow, clinging, weed at the hem */
const BODY = [
  '........wkKkkKkd........',
  '........wlkKkKLd........',
  '........wllkKkLd........',
  '........wllkLkLd........',
  '........wlllLLLd........',
  '.......wlllLgLLLd.......',
  '.......wllLLgLLLd.......',
];
/** the frayed hem: hanging, swung left (strands lag right), swung right, bunched (when she sinks) */
const HEM = {
  hang: ['.......v.lLgL.L.u.......', '......v...L..u...u......'],
  left: ['........vlLgL.Lu.u......', '..........v.L..u...u....'],
  right: ['.....u.v.lLgL.u.........', '....u...v..L..u.........'],
  /** sunk a pixel at the bottom of the swing: the strands trail the way she came from */
  lowL: ['......u.vlLgL.L.........'],
  lowR: ['........v.lLgLu.u.......'],
};

// ------------------------------------------------------------------ the attack and the flinch: whole

/** the wind-up: pulled up tall, the arms straight, the sleeves flung out like wings, the head up and the hair
 *  parted, the eyes blazing, the hem gathered */
const WINDUP = [
  '..........ssSS..........',
  '.ww......wrrrrL......Ld.',
  '.wlw.....ss.rSS.....LLd.',
  '..wlw...ssS..sSS...LLd..',
  '..wllw.wsS.ww.SsL.LLLd..',
  '...wllwlS.wwlL.SLLLLd...',
  '...wlllL.kwllLk.LLLLd...',
  '....wllL.kKkkKk.LLLd....',
  '....wlLL.kekKek.LLLd....',
  '....vlLL.kwkKwk.LLdu....',
  '...v.lLLwkKkkKkdLLd.u...',
  '..v...lLwlkKkKLdLd...u..',
  '........wllkKkLd........',
  '........wllKkkLd........',
  '........wllLLLLd........',
  '........wlLgLLLd........',
  '.......vwLLgLLu.........',
  '......v..L..u..u........',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
];
/** the swoop: the ties torn, the arms flung out and down with the fingers spread, the face up and torn open,
 *  the veil, the hair and the sleeves streaming back over her */
const BLOW = [
  '......K..K.ww.K..K......',
  '...w...K.KwllLK.K....L..',
  '...wl...kKwlllLkK...LL..',
  '....wl...kwllLLk...LL...',
  '....wll..kKkkKkk..LLd...',
  '.....wll.kKekeKk.LLd....',
  '.....wlL.kKsSsKk.LLd....',
  '......wl.kKSoSKk.Ld.....',
  '......wlLkkSooSkLLd.....',
  '.....swllLSooSkLLLLS....',
  '...sswlllwkkkKLLLLLSS...',
  '..ss.wllllkkkLLLLd..SS..',
  '.s.s.wlllllkLLLLLd..S.S.',
  '.s.s..wllllLLLLLd..S.S..',
  '......wlllLLLLLLd.......',
  '.......wllLgLLLd........',
  '.......wlllgLLLd........',
  '......wlllLgLLLLd.......',
  '......v.lLLgL.L.u.......',
  '.....v...lL..L...u......',
  '....v.....L...u...u.....',
  '..........u.............',
  '........................',
  '........................',
];
/** the overshoot: sunk low and slumped, the head hung so low the face is gone, the arms limp, the torn towel
 *  ends hanging from the wrists, the rags still swinging on */
const RECOVER = [
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '..........wwlL..........',
  '.........wwllLL.........',
  '........kwlllLLk........',
  '......wlkKkkkkKkLd......',
  '.....wllkKkkkkKkLLd.....',
  '.....wlLkKkKkkKkLLd.....',
  '....wllL.kKkkKk.LLLd....',
  '....wlL..kKkKkk..LLd....',
  '....wlS.wkKkkKkd.SLd....',
  '....sS..wlkKkKLd..sS....',
  '....sS..wllkKkLd..sS....',
  '...s.S..wllkLkLd..s.S...',
  '...r....wlllLLLLd...r...',
  '...r...wllLgLLLLLd..r...',
  '........v.LgL.LL.Ld.u...',
  '.........v..L...u...u.u.',
  '..........v.......u.....',
  '........................',
  '........................',
];
/** hit: snapped back, the head thrown back (the hair flung up, only the chin and the throat to see), the arms
 *  jerked out, the shroud crumpled and torn across */
const HURT = [
  '........................',
  '........................',
  '........................',
  '..s.....................',
  '..sS......k.k.k.........',
  '...sS....kKkKkKk........',
  '....ws...kKkkkKk........',
  '....wls..kKsSSKk........',
  '.....wlL..sSSS..........',
  '.....wllLwlSSLLd........',
  '......wllllLLLLLLsS.....',
  '......wlllooLLLdLLsSs...',
  '.....wllloooLLLLd..S.s..',
  '....wlllLLLooLLLLd......',
  '....vlllLLLLLLLLd.......',
  '.....v.wllLLLLLd.u......',
  '.......wllLgLLLd..u.....',
  '......wlllLgLLLLd.......',
  '.....v..lLgL..L..u......',
  '....v....L...L....u.....',
  '........................',
  '........................',
  '........................',
  '........................',
];

// ------------------------------------------------------------------ the frames

const stand = stack([0, 0, TOP], [0, 14, ENDS.hang], [0, 14, BODY], [0, 21, HEM.hang]);
// the drift: she swings from the wrists like a hanged body, a pendulum: the hands stay, the head and the sleeves
// go a pixel to the side, the body two, and the strands lag the other way; at the bottom of each swing, passing
// under the wrists, she sinks a pixel and the strands trail the way she came from
const HANDS = TOP.slice(0, 7);
const SHOULDERS = TOP.slice(7);
const walk = [
  stack([0, 0, HANDS], [-1, 7, SHOULDERS], [-1, 14, ENDS.left], [-2, 14, BODY], [-2, 21, HEM.left]),
  stack([0, 1, HANDS], [0, 8, SHOULDERS], [0, 15, ENDS.right], [0, 15, BODY], [0, 22, HEM.lowL]),
  stack([0, 0, HANDS], [1, 7, SHOULDERS], [1, 14, ENDS.right], [2, 14, BODY], [2, 21, HEM.right]),
  stack([0, 1, HANDS], [0, 8, SHOULDERS], [0, 15, ENDS.left], [0, 15, BODY], [0, 22, HEM.lowR]),
];

// ------------------------------------------------------------------ the colours

const JAWIA = {
  w: 0xe2e0d0, // linen, the light (the veil, the lit edge of the shroud)
  l: 0xb9bcaa, // linen
  L: 0x868e82, // linen, the shadow (wet)
  d: 0x525a5c, // linen, the deep shadow
  s: 0xa6b4a6, // drowned skin
  S: 0x6e7c74, // drowned skin, the shadow
  r: 0xc23e30, // the towel's embroidery
  k: 0x262c30, // wet hair
  K: 0x46524e, // wet hair, the sheen
  o: 0x0c080e, // the hole where the face is
  e: 0xd8f0c0, // the eyes: two lights
  g: 0x5a6a38, // weed at the hem
  v: 0xa4aa9a, // the frayed hem (no line round it)
  u: 0x6c766c, // the frayed hem, darker (no line)
};
const NAWIA = {
  w: 0xc4f6ff, // the lit edges glow cold
  l: 0x5a8ca8,
  L: 0x355a7c,
  d: 0x223a5c,
  s: 0x9cd0dc,
  S: 0x4f8294,
  r: 0xf06a5a, // the embroidery stays red: an ember
  k: 0x16223c,
  K: 0x3a6a86,
  o: 0x020308,
  e: 0xffffff,
  g: 0x4ac0a0,
  v: 0x78c0d4,
  u: 0x3e7090,
};
const line = (c: number): Record<string, number> => Object.fromEntries('wlLdsSrkKoeg'.split('').map((k) => [k, c]));

export const BEAST: Beast = {
  code: 'M9',
  id: 'zjawa-b',
  kind: { pl: 'Zjawa', en: 'Wraith' },
  name: { pl: 'topielica ze Zwonigrodu', en: 'the drowned of Zwonigród' },
  note: {
    pl: 'Wisi za związane ręcznikiem nadgarstki, jakby nad nią wciąż była woda; z uniesionych rąk zwisają mokre rękawy, przez włosy świecą dwa światełka. Prostuje się, rozkłada rękawy jak skrzydła, rwie więzy i spada na ciebie z otwartymi ustami.',
    en: 'She hangs by her towel-bound wrists as if the lake were still above her; wet sleeves hang from her raised arms, two lights show through her hair. She draws up tall, flings the sleeves wide, tears the ties and swoops at you, mouth open.',
  },
  alt: ['P11', 'P12', 'E2'],
  w: W,
  h: H,
  view: 'front',
  pal: JAWIA,
  frames: { stand, walk, attack: [WINDUP, BLOW, RECOVER], hurt: HURT },
  ink: 'tinted',
  line: line(0x1a1018),
  nawia: {
    pal: NAWIA,
    ink: { ink: 'tinted', line: line(0x04050e) },
    note: {
      pl: 'W Nawii jest pod jeziorem: len ma kolor wody, krawędzie świecą zimno, oczy są białe, a haft żarzy się na czerwono.',
      en: 'In Nawia she is under the lake: the linen is the colour of the water, its edges glow cold, the eyes are white, the embroidery an ember.',
    },
  },
};
