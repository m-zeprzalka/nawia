// C9: the herbalist's apprentice, one tile tall, held together by light alone (no line).
//
// Sambor setting out: lean, a small head (six rows) on a long-legged frame, fair hair tied back in a short
// tail, a linen shirt with rolled sleeves under a sleeveless jerkin, a short green-grey cloak, a satchel of
// herbs with a sprig, the hag stone in the open collar, a short sword at the left hip under a small red
// shield with a sun. No outline anywhere: the warm key light comes from the upper left (pale gold on the
// hair and shoulders), the shadows are cool and violet, and every edge on the shadow side is a mid value,
// lighter than a dark floor and darker than grass.

import type { Concept } from './concept.ts';

const H = 16;
type Part = [number, string[]];
type Frames = Concept['frames']['down'];

/** Lays drawings over each other, each `dy` rows down; '.' lets what is below show through. */
function layer(...parts: Part[]): string[] {
  const grid = Array.from({ length: H }, () => Array<string>(16).fill('.'));
  for (const [dy, rows] of parts)
    rows.forEach((r, y) => {
      const ty = y + dy;
      if (ty >= 0 && ty < H) [...r].forEach((ch, x) => ch !== '.' && (grid[ty][x] = ch));
    });
  return grid.map((r) => r.join(''));
}

/** The same drawing moved `dx` pixels sideways. */
function shift(rows: string[], dx: number): string[] {
  return rows.map((r) => (dx > 0 ? '.'.repeat(dx) + r.slice(0, -dx) : r.slice(-dx) + '.'.repeat(-dx)));
}

// ------------------------------------------------------------------ facing us

const HEAD_D = [
  '......hllh......',
  '.....hlllhh.....',
  '.....hlsshhr....',
  '.....hrkskSr....',
  '.....swesewr....',
  '......sssSr.....',
];
const TRUNK_D = [
  '....wggSSGGW....',
  '...whrrwWrRRW...',
  '...wrrrWRRRRW...',
  '...s.RRhRRR.....',
  '.....eeeGGG.....',
];
const ARM_D = {
  stand: ['...S............'],
  fwd: ['...s............', '...S............'],
  back: ['...w............', '................'],
};
const HILT_D = ['................', '..........W.....', '..........r.....'];
const SATCHEL_D = ['....v...........', '...hr...........', '...rR...........'];
const LEGS_D = {
  stand: ['.....eG..eG.....', '.....eG..eG.....', '.....rR..rR.....', '....rrR..rRR....'],
  a: ['.....eG..eG.....', '.....eG..rR.....', '.....rR..rRR....', '....rrR.........'],
  b: ['.....eG..eG.....', '.....rR..eG.....', '....rrR..rR.....', '.........rRR....'],
};
const SHIELD_D = ['............ccc.', '...........cclcR', '...........clhoR', '...........ccocR', '............RRR.'];

// ------------------------------------------------------------------ from behind

const HEAD_U = [
  '......hllh......',
  '.....hlllhh.....',
  '.....hlhhhhr....',
  '.....hhlhhrr....',
  '.....shhlhrS....',
  '......SrhRS.....',
];
const TAIL_U = ['........h.......', '........r.......'];
const TRUNK_U = [
  '....gggggeGG....',
  '...wgggggeGGW...',
  '...wggggeGGGW...',
  '...sggggeGeGS...',
  '....gggeeGeG....',
];
const LEGS_U = {
  stand: ['.....eG..eG.....', '.....eG..eG.....', '.....rR..rR.....', '.....rR..rR.....'],
  a: ['.....eG..eG.....', '.....eG..rR.....', '.....rR..rR.....', '.....rR.........'],
  b: ['.....eG..eG.....', '.....rR..eG.....', '.....rR..rR.....', '.........rR.....'],
};
const SHIELD_U = ['..hr............', '.hrrR...........', '.rsRR...........', '.rrRR...........', '..RR............'];
const SATCHEL_U = ['............v...', '...........hhR..', '...........rRR..'];

// ------------------------------------------------------------------ from the side, facing right

const HEAD_S = [
  '......llh.......',
  '.....hlllhh.....',
  '.....lhhhhs.....',
  '....hhhhSks.....',
  '....rhSswess....',
  '....rrSsssS.....',
];
const TAIL_S = ['....r...........'];
const SWORD_S = ['.....R..........', '....r...........', '...W............'];
const TRUNK_S = [
  '.....ggSsw......',
  '....gGhrrwW.....',
  '....gGrrrRW.....',
  '....gGRRRRR.....',
  '.....GeeGG......',
];
const ARM_S = {
  stand: ['.......w........'],
  a: ['........w.......'],
  b: ['......w.........'],
};
const LEGS_S = {
  stand: ['......eG........', '......eG........', '......rR........', '......rRR.......'],
  a: ['......eGG.......', '.....eG.GG......', '.....rR..RR.....', '....rR....RRR...'],
  b: ['......eGG.......', '.....GG.eG......', '.....RR..rR.....', '....RR....rRR...'],
};
const SHIELD_S = ['........ccc.....', '.......cclcR....', '.......clhoR....', '.......ccocR....', '........RRR.....'];

// ------------------------------------------------------------------ the frames

const down: Frames = [
  layer([11, LEGS_D.stand], [0, HEAD_D], [6, TRUNK_D], [10, ARM_D.stand], [10, SATCHEL_D], [8, HILT_D], [8, SHIELD_D]),
  // his right foot forward: the right arm swings back, the shield comes forward (lower); then the other way
  layer([11, LEGS_D.a], [1, HEAD_D], [7, TRUNK_D], [9, ARM_D.back], [11, SATCHEL_D], [9, HILT_D], [10, SHIELD_D]),
  layer([11, LEGS_D.b], [1, HEAD_D], [7, TRUNK_D], [10, ARM_D.fwd], [11, SATCHEL_D], [9, HILT_D], [8, SHIELD_D]),
];
const up: Frames = [
  layer([11, LEGS_U.stand], [10, SATCHEL_U], [0, HEAD_U], [6, TRUNK_U], [6, TAIL_U], [8, SHIELD_U]),
  layer([11, LEGS_U.a], [11, SATCHEL_U], [1, HEAD_U], [7, TRUNK_U], [7, TAIL_U], [8, SHIELD_U]),
  layer([11, LEGS_U.b], [11, SATCHEL_U], [1, HEAD_U], [7, TRUNK_U], [7, TAIL_U], [10, SHIELD_U]),
];
const side: Frames = [
  layer([11, LEGS_S.stand], [6, TRUNK_S], [10, SWORD_S], [7, ARM_S.stand], [0, HEAD_S], [6, TAIL_S], [8, SHIELD_S]),
  layer([11, LEGS_S.a], [7, TRUNK_S], [11, SWORD_S], [8, ARM_S.a], [1, HEAD_S], [7, TAIL_S], [9, shift(SHIELD_S, 1)]),
  layer([11, LEGS_S.b], [7, TRUNK_S], [11, SWORD_S], [8, ARM_S.b], [1, HEAD_S], [7, TAIL_S], [9, shift(SHIELD_S, -1)]),
];

export const CONCEPT: Concept = {
  code: 'C9',
  id: 'uczen',
  name: { pl: 'Uczeń zielarki', en: "The herbalist's apprentice" },
  note: {
    pl: "chudy uczeń zielarki: kucyk, sakwa z ziołem, kamień z dziurką, tarcza ze słońcem; bez konturu, światło i chłodny cień",
    en: "the lean herbalist's apprentice: a ponytail, a herb satchel, the hag stone, a sun shield; no line, light and cool shadow",
  },
  h: H,
  pal: {
    l: 0xfbe39a, // hair in the sun, the sun on the shield
    h: 0xd9a54e, // hair, sunlit leather
    o: 0xe0763a, // the sun's rays
    r: 0x9c5a3a, // hair in shade, leather, boots
    R: 0x6e4262, // leather and the shield in shade: plum, never black, so the shadow side still reads on a dark floor
    k: 0x2a2340, // the lids: the only dark in the figure
    s: 0xf0c49a, // skin
    S: 0xc4837a, // skin in shade
    w: 0xf0e9d2, // linen, the white of the eye
    W: 0x9aa0c6, // linen in shade, steel, the hag stone
    g: 0x9db497, // the cloak
    G: 0x4f6088, // the cloak in shade, trousers in shade
    e: 0x5a7c9a, // the iris, trousers, the cloak's folds
    v: 0x86c94c, // the sprig
    c: 0xc4463e, // the shield
  },
  frames: { down, up, side },
  ink: 'none',
};
