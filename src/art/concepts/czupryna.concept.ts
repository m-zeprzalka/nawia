// C12: Sambor after the art lead's first reference (Moonlighter's hero), 16 x 18.
//
// Taken from the reference: the shape of the head is the hair's: a shock of hair broken into clumps and
// points, lit in streaks, with the face set low under it; a body as wide as the head, square shoulders,
// short legs. Kept from our own rounds: the painted manner of C1 (no line on the lit side, a dark rim only
// where the shadow falls), C1's eyes (a lid, a white, an iris), and the narrow profile: the head from the
// side is eight pixels deep, its back broken by hair, the face flat, no nose, the eye one dark pixel.
// The figure is ours: ash-brown hair, a linen shirt with a red embroidered collar, a sleeveless sheepskin
// vest (serdak) edged with fleece, a dark red sash, blue-grey trousers, boots, a round wooden shield in an
// iron rim on his left arm.

import type { Concept, Frames } from './concept.ts';

const H = 18;

function stack(...parts: [number, string[]][]): string[] {
  const grid = Array.from({ length: H }, () => Array<string>(16).fill('.'));
  for (const [dy, rows] of parts)
    rows.forEach((r, y) => {
      const ty = y + dy;
      if (ty >= 0 && ty < H) [...r].forEach((ch, x) => ch !== '.' && (grid[ty][x] = ch));
    });
  return grid.map((r) => r.join(''));
}

// ------------------------------------------------------------------ facing us

const HEAD_D = [
  '......hLhh......',
  '....hhLLhhLh....',
  '...hLLhhLhhhH...',
  '...hLhhHhhhHH...',
  '...hhhHhhhHhH...',
  '...hsSKssKSsH...',
  '...HswpttpwsH...',
  '...HtsssSssSH...',
  '....HSsssSSH....',
];
const TRUNK_D = [
  '..wkkwrSSrwkKA..',
  '..wkkkwwwwkkKA..',
  '..rkkKwwwAkKKR..',
  '..sRRrRRRRRRRS..',
  '...kkKwwAAkKK...',
];
const ARM_FWD_D = ['..w.............', '..s.............'];
const ARM_BACK_D = ['..w.............', '..w.............', '..r.............'];
const LEGS_D = {
  stand: ['....ppp..ppK....', '....kkk..kkK....', '...kkkK..kkkK...'],
  a: ['....ppp..ppK....', '....kkk..kkkK...', '...kkkK.........'],
  b: ['....ppp..ppK....', '...kkkK..kkK....', '.........kkkK...'],
};
/** wood in an iron rim, an iron boss */
const SHIELD_D = ['...........mmm..', '..........mkkkK.', '..........mkmkK.', '..........mkkKK.', '...........KKK..'];

// ------------------------------------------------------------------ from behind

const HEAD_U = [
  '......hLhh......',
  '....hhLLhhLh....',
  '...hLLhhLhhhH...',
  '...hLhhHhhhHH...',
  '...hhLhhhLhHH...',
  '...hHhhLhhhHH...',
  '...HhLhhhHhHH...',
  '...HHhHhHhHHH...',
  '....HHsSSsHH....',
];
const TRUNK_U = [
  '..wkkkkkkkkkKA..',
  '..wkkkkkkkkKKA..',
  '..rkkkkkkkKKKR..',
  '..sRRrRRRRRRRS..',
  '...kkkkkkkKKK...',
];
const LEGS_U = {
  stand: ['....ppp..ppK....', '....kkk..kkK....', '....kkk..kkK....'],
  a: ['....ppp..ppK....', '....kkk..kkK....', '....kkk.........'],
  b: ['....ppp..ppK....', '....kkk..kkK....', '.........kkK....'],
};
const SHIELD_U = ['.mmm............', 'mkkkK...........', 'mkkkK...........', 'mkkKK...........', '.KKK............'];

// ------------------------------------------------------------------ from the side, facing right: narrow

const HEAD_S = [
  '......hLh.......',
  '.....hhLLhh.....',
  '.....hLhhhhh....',
  '....hhLhhhHh....',
  '....hhhhhhHh....',
  '....HhhhsSKs....',
  '.....HhHSsss....',
  '.....HHSsssS....',
  '......HSssS.....',
];
const TRUNK_S = [
  '......kwrS......',
  '.....kkwwwA.....',
  '.....kkwwwA.....',
  '.....RRrRRR.....',
  '.....kkwwAA.....',
];
const ARM_S = {
  stand: ['.......wA.......', '.......wA.......', '.......sS.......'],
  a: ['........wA......', '........wA......', '.........sS.....'],
  b: ['......wA........', '.....wA.........', '.....sS.........'],
};
const LEGS_S = {
  stand: ['......ppp.......', '......kkk.......', '......kkkK......'],
  a: ['.....pp.pp......', '....kk...kk.....', '....kK...kkK....'],
  b: ['.....pp.pp......', '....kk...kk.....', '....kK...kkK....'],
};
const SHIELD_S = ['.........mm.....', '.........kkK....', '.........kmK....', '.........kKK....', '.........KK.....'];

// ------------------------------------------------------------------ the frames

const down: Frames = [
  stack([0, HEAD_D], [9, TRUNK_D], [14, LEGS_D.stand], [10, SHIELD_D]),
  stack([14, LEGS_D.a], [1, HEAD_D], [10, TRUNK_D], [11, ARM_FWD_D], [11, SHIELD_D]),
  stack([14, LEGS_D.b], [1, HEAD_D], [10, TRUNK_D], [11, ARM_BACK_D], [11, SHIELD_D]),
];
const up: Frames = [
  stack([10, SHIELD_U], [14, LEGS_U.stand], [0, HEAD_U], [9, TRUNK_U]),
  stack([11, SHIELD_U], [14, LEGS_U.a], [1, HEAD_U], [10, TRUNK_U]),
  stack([11, SHIELD_U], [14, LEGS_U.b], [1, HEAD_U], [10, TRUNK_U]),
];
const side: Frames = [
  stack([14, LEGS_S.stand], [9, TRUNK_S], [10, ARM_S.stand], [10, SHIELD_S], [0, HEAD_S]),
  stack([14, LEGS_S.a], [10, TRUNK_S], [11, ARM_S.a], [11, SHIELD_S], [1, HEAD_S]),
  stack([14, LEGS_S.b], [10, TRUNK_S], [11, ARM_S.b], [11, SHIELD_S], [1, HEAD_S]),
];

export const CONCEPT: Concept = {
  code: 'C12',
  id: 'czupryna',
  name: { pl: 'Czupryna', en: 'Shock of hair' },
  note: {
    pl: "wzorzec Moonlightera: głowę robi postrzępiona czupryna, twarz nisko, ciało tak szerokie jak głowa; malowany jak C1, wąski profil",
    en: "after the Moonlighter reference: a ragged shock of hair makes the head, the face set low, a body as wide; painted like C1, a narrow profile",
  },
  h: H,
  pal: {
    L: 0xc8a878, h: 0x8e6e4e, H: 0x5e4434, t: 0xffe0c4, s: 0xf2c4a0, S: 0xc8866a, K: 0x34232a, w: 0xf0e6d0, A: 0xb8ab94,
    p: 0x5a6e8a, r: 0xc8443c, R: 0x8a2a32, k: 0x8a5c3a, m: 0xd0d4d6,
  },
  frames: { down, up, side },
  ink: 'rim',
  outline: 0x34232a,
  line: { r: 0x5a1a24, R: 0x5a1a24 },
};
