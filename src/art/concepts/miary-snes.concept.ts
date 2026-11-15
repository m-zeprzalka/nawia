// C3: the measures of the 16-bit adventure hero, worn by our lad (16 x 22, in a 23-row cell).
//
// Not a copy of anybody: the costume, the colours and the face are those of our hero (fair hair, a linen
// shirt with red embroidery, a red cloak, a round red shield). What is borrowed are the measures of the
// classic 16-bit top-down hero: a figure about 22 px tall in a 16 px wide cell, a big head (ten rows)
// with eyes two pixels wide and three tall, a shield as tall as his trunk, a dark line all round, three
// tones a material and a bright highlight on the hair. It is here to show how such a figure sits in our world.

import type { Concept, Frames } from './concept.ts';

const H = 23;

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
  '......hhLh......',
  '....hhhlLlhh....',
  '...hhllhhhhhH...',
  '..hhlhhhhhhhhH..',
  '..hlhhhhhhhhHH..',
  '..hhhsthhsthHH..',
  '..hhSKKssKKShH..',
  '..hHsbpttpbsHH..',
  '...HspsttspsH...',
  '....SssssssS....',
];
const TRUNK_D = [
  '...RRbrSSrACC...',
  '..bbRbaaaaACAA..',
  '..bbRbaaaaACAA..',
  '..rrRkkklkkCRR..',
  '..ssRbaaaaACSS..',
  '....RbaaaaAC....',
  '....RrRrRrRC....',
];
const ARM_FWD_D = ['..bb............', '..rr............', '..ss............'];
const ARM_BACK_D = ['..bb............', '..bb............', '..bb............', '..rr............', '...R............'];
/** legs side by side, told apart by their shading; on a stride the one going back lifts its heel */
const LEGS_D = {
  stand: ['.....ppPpPP.....', '.....ppPpPP.....', '.....kkKkKK.....', '.....kkK.kK.....', '....kkK..kKK....'],
  a: ['.....ppPpPP.....', '.....ppPkKK.....', '.....kkKkKK.....', '.....kkK.KK.....', '....kkK.........'],
  b: ['.....ppPpPP.....', '.....kkKpPP.....', '.....kkKkKK.....', '.....kK.kKK.....', '.........kKK....'],
};
const SHIELD_D = ['...........QQQ..', '..........QxxxQ.', '.........QxrxxXQ', '.........QxbbxXQ', '.........QxbbXXQ', '.........QxxXXXQ', '..........QXXXq.', '...........qqq..'];

// ------------------------------------------------------------------ from behind

const HEAD_U = [
  '......hhLh......',
  '....hhhlLlhh....',
  '...hhllhhhhhH...',
  '..hhlhhhhhhhhH..',
  '..hlhhhhhhhhHH..',
  '..hlhhhhhhhhHH..',
  '..hhlhhhhhhHHH..',
  '..hhhhhhhhhHHH..',
  '...HhhhhhhHHH...',
  '....HHhhHHHH....',
];
const TRUNK_U = [
  '...rRRRRRRRCC...',
  '..aarRRRRRRCAA..',
  '..aarRRRRRRCAA..',
  '..rrrRRRRRCCRR..',
  '..ssrRRRRRCCSS..',
  '....rRRRRRCC....',
  '....rRRRRCCC....',
  '....rRCRRCCC....',
];
const LEGS_U = {
  stand: ['.....ppPpPP.....', '.....ppPpPP.....', '.....kkKkKK.....', '.....kkK.kK.....', '.....kK..kK.....'],
  a: ['.....ppPpPP.....', '.....ppPkKK.....', '.....kkKkKK.....', '.....kkK.KK.....', '.....kK.........'],
  b: ['.....ppPpPP.....', '.....kkKpPP.....', '.....kkKkKK.....', '.....kK.kKK.....', '.........kK.....'],
};
/** the back of the shield, on his left arm: on our left */
const SHIELD_U = ['.QQQ............', 'QQqqQ...........', 'QqqqQ...........', 'QqQqQ...........', 'QqqqQ...........', 'QqqqQ...........', '.qqq............'];

// ------------------------------------------------------------------ from the side, facing right

const HEAD_S = [
  '.....hhhLh......',
  '....hhlLlhhh....',
  '...hhlhhhhhhh...',
  '..hhlhhhhhhhhh..',
  '..hhhhhhhhhhhs..',
  '..hhhhhhhhhstt..',
  '..hHhhhhsSsKKs..',
  '..HhhhhhSssbpt..',
  '...HhhhHSssspst.',
  '....HHHHSsssS...',
];
const TRUNK_S = [
  '....RRRbrSA.....',
  '...rRRRbaaaA....',
  '...RRRCbaaaA....',
  '...RRCCkkklK....',
  '...RRCCbaaaA....',
  '...RCCCbaaAA....',
  '...RCC.rRrR.....',
];
const ARM_S = {
  stand: ['........bA......', '........bA......', '........rr......', '........ss......'],
  a: ['.........bA.....', '.........bA.....', '..........rr....', '..........ss....'],
  b: ['.......bA.......', '......bA........', '.....rr.........', '.....ss.........'],
};
const LEGS_S = {
  stand: ['.......ppP......', '.......ppP......', '.......kkK......', '.......kkK......', '.......kkKkk....'],
  a: ['......ppPP......', '.....pP..pP.....', '....kK....kK....', '....kK....kK....', '...kkK....kkKk..'],
  b: ['......PPpp......', '.....PP..pp.....', '....KK....kk....', '....KK....kk....', '...KKK....kkkK..'],
};
const SHIELD_S = ['.......QQQ......', '......QxxxQ.....', '.....QxrxxXQ....', '.....QxbbxXQ....', '.....QxbbXXQ....', '.....QxxXXXQ....', '......QXXXq.....', '.......qqq......'];

// ------------------------------------------------------------------ the frames

const down: Frames = [
  stack([0, HEAD_D], [10, TRUNK_D], [17, LEGS_D.stand], [11, SHIELD_D]),
  stack([17, LEGS_D.a], [1, HEAD_D], [11, TRUNK_D], [12, ARM_FWD_D], [12, SHIELD_D]),
  stack([17, LEGS_D.b], [1, HEAD_D], [11, TRUNK_D], [12, ARM_BACK_D], [12, SHIELD_D]),
];
const up: Frames = [
  stack([11, SHIELD_U], [17, LEGS_U.stand], [0, HEAD_U], [10, TRUNK_U]),
  stack([12, SHIELD_U], [17, LEGS_U.a], [1, HEAD_U], [11, TRUNK_U]),
  stack([12, SHIELD_U], [17, LEGS_U.b], [1, HEAD_U], [11, TRUNK_U]),
];
const side: Frames = [
  stack([17, LEGS_S.stand], [10, TRUNK_S], [11, ARM_S.stand], [0, HEAD_S], [11, SHIELD_S]),
  stack([17, LEGS_S.a], [11, TRUNK_S], [12, ARM_S.a], [1, HEAD_S], [12, SHIELD_S]),
  stack([17, LEGS_S.b], [11, TRUNK_S], [12, ARM_S.b], [1, HEAD_S], [12, SHIELD_S]),
];

export const CONCEPT: Concept = {
  code: 'C3',
  id: 'miary-snes',
  name: { pl: 'Miary SNES 16x22', en: 'SNES measures 16x22' },
  note: {
    pl: 'konstrukcja bohatera 16-bitowych przygodówek (duża głowa, oczy 2x3, wysoka tarcza, ciemny kontur) w kostiumie naszego chłopaka',
    en: 'the build of the 16-bit adventure hero (a big head, eyes 2x3, a tall shield, a dark line) in our lad\'s costume',
  },
  h: H,
  pal: {
    // fifteen colours: hair and skin share a shadow and a light, the shield shares the cloak's reds and the hair's brown
    L: 0xffe2c4, l: 0xf2d06a, h: 0xd89a38, H: 0xb06c3a, t: 0xffe2c4, s: 0xf6c49a, S: 0xb06c3a, K: 0x1e1622,
    p: 0x4a68a8, P: 0x34497e, b: 0xffffff, a: 0xdcdcd4, A: 0x9a9cae, r: 0xe0584a, R: 0xb03440, C: 0x701e3a, k: 0x8a5a34,
    x: 0xb03440, X: 0x701e3a, Q: 0xb06c3a, q: 0x8a5a34,
  },
  frames: { down, up, side },
  ink: 'tinted',
  outline: 0x1e1622,
};
