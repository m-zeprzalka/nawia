// C10: Sambor built the way the art lead's reference adventure (Moonlighter) builds its hero (16 x 20).
//
// What is taken from the reference is the construction, not the character: a big head (ten rows) that is
// no wider than the body under it, because the body with its arms is just as wide; short, stubby legs;
// a profile only half as deep as the front, with no nose (the fringe comes down to the front edge, the eye
// sits a pixel in, the face is flat); a soft line in the dark of each material, never black; eyes two
// pixels wide, a dark pupil two tall beside a white.
// The figure is ours: fair, shaggy hair to the jaw, a burgundy kaftan with a cream collar, the hag stone on
// a cord, dark olive trousers, boots, a round red shield carried on his back (from behind it is the shape
// you see first), a sword at his left hip.

import type { Concept, Frames } from './concept.ts';

const H = 20;

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
  '......h.hLh.....',
  '....hhLhLLhhh...',
  '...hLLhhLhhhhH..',
  '..hhLhhHhhhHhH..',
  '..hLhhHhhhHhhH..',
  '..hhhsHhhHshHH..',
  '..hhswKssKwshH..',
  '..hHswKttKwsHH..',
  '..HHtsssSssSHH..',
  '...H.SsssSS.H...',
];
const TRUNK_D = [
  '..rRRRwsswRRCC..',
  '..rRRRRmRRRRCC..',
  '..rRRRRRRRRRCC..',
  '..sKkkkmkkkkKS..',
  '...rRRRRRRRCC...',
  '...rRRCRRRRCC...',
];
const ARM_FWD_D = ['..r.............', '..s.............'];
const ARM_BACK_D = ['..r.............', '..r.............', '..R.............'];
const LEGS_D = {
  stand: ['....ggg..ggg....', '....kkk..kkk....', '...kkkK..kkkK...'],
  a: ['....ggg..ggg....', '....kkk..kkkK...', '...kkkK.........'],
  b: ['....ggg..ggg....', '...kkkK..kkk....', '.........kkkK...'],
};

// ------------------------------------------------------------------ from behind: the shield first

const HEAD_U = [
  '......h.hLh.....',
  '....hhLhLLhhh...',
  '...hLLhhLhhhhH..',
  '..hhLhhHhhhHhH..',
  '..hLhhHhhhHhhH..',
  '..hhLhhhHhhhHH..',
  '..hhhHhhhHhhHH..',
  '..hHhhHhhhHHHH..',
  '..HHhHhhHhHHHH..',
  '...H.HhHHhHH....',
];
const TRUNK_U = [
  '..rRRRRRRRRRCC..',
  '..rRRRRRRRRRCC..',
  '..rRRRRRRRRRCC..',
  '..sKkkkkkkkkKS..',
  '...rRRRRRRRCC...',
  '...rRRRRRRRCC...',
];
/** wood under a red sun cross, an iron boss; the rim is leather */
const SHIELD_U = [
  '.....KKKKKK.....',
  '...KKkkkkkkKK...',
  '..KkkkkrrkkkkK..',
  '..KkkrrmmrRkkK..',
  '..KkkrRmmRRkkK..',
  '..KkkkkRRkkkkK..',
  '...KKkkkkkkKK...',
  '.....KKKKKK.....',
];
const LEGS_U = {
  stand: ['....ggg..ggg....', '....kkk..kkk....', '....kkk..kkk....'],
  a: ['....ggg..ggg....', '....kkk..kkk....', '....kkk.........'],
  b: ['....ggg..ggg....', '....kkk..kkk....', '.........kkk....'],
};

// ------------------------------------------------------------------ from the side, facing right

const HEAD_S = [
  '......h.hLh.....',
  '....hhLhLLhhh...',
  '...hLLhhLhhhhh..',
  '..hhLhhHhhhHhh..',
  '..hLhhHhhhHhhh..',
  '..hhhhhhhhhhhh..',
  '..hHhhhhsSSKsh..',
  '..HHhhhhHswKs...',
  '...HHhhHSssss...',
  '....HHHSsssS....',
];
const TRUNK_S = [
  '.....RRwss......',
  '.....rRRwRC.....',
  '.....rRRRRC.....',
  '.....KkkkmK.....',
  '.....rRRRRC.....',
  '.....rRRCRC.....',
];
/** the shield on his back, seen edge-on behind him */
const SHIELD_S = ['....K...........', '...Kk...........', '...Kr...........', '...Kk...........', '...KR...........', '...Kk...........', '....K...........'];
const SWORD_S = ['..........m.....', '..........k.....', '.........k......', '.........k......'];
const ARM_S = {
  stand: ['.......rR.......', '.......rR.......', '.......sS.......'],
  a: ['........rR......', '........rR......', '.........sS.....'],
  b: ['......rR........', '.....rR.........', '.....sS.........'],
};
const LEGS_S = {
  stand: ['......ggg.......', '......kkk.......', '......kkkK......'],
  a: ['.....gg.gg......', '....kk...kk.....', '....kK...kkK....'],
  b: ['.....gg.gg......', '....kk...kk.....', '....kK...kkK....'],
};

// ------------------------------------------------------------------ the frames

const down: Frames = [
  stack([0, HEAD_D], [10, TRUNK_D], [16, LEGS_D.stand]),
  stack([16, LEGS_D.a], [1, HEAD_D], [11, TRUNK_D], [12, ARM_FWD_D]),
  stack([16, LEGS_D.b], [1, HEAD_D], [11, TRUNK_D], [12, ARM_BACK_D]),
];
const up: Frames = [
  stack([16, LEGS_U.stand], [0, HEAD_U], [10, TRUNK_U], [9, SHIELD_U]),
  stack([16, LEGS_U.a], [1, HEAD_U], [11, TRUNK_U], [10, SHIELD_U]),
  stack([16, LEGS_U.b], [1, HEAD_U], [11, TRUNK_U], [10, SHIELD_U]),
];
const side: Frames = [
  stack([10, SHIELD_S], [16, LEGS_S.stand], [10, TRUNK_S], [12, SWORD_S], [11, ARM_S.stand], [0, HEAD_S]),
  stack([11, SHIELD_S], [16, LEGS_S.a], [11, TRUNK_S], [13, SWORD_S], [12, ARM_S.a], [1, HEAD_S]),
  stack([11, SHIELD_S], [16, LEGS_S.b], [11, TRUNK_S], [13, SWORD_S], [12, ARM_S.b], [1, HEAD_S]),
];

export const CONCEPT: Concept = {
  code: 'C10',
  id: 'kudlacz',
  name: { pl: 'Kudłacz', en: 'Shaggy' },
  note: {
    pl: "budowa jak w Moonlighterze: duża głowa, równie szerokie ciało, krótkie nogi, płaski profil; tarcza na plecach; kontur w kolorze materiału",
    en: "built like Moonlighter's hero: a big head, a body as wide, short legs, a flat profile; the shield on his back; a line in each material's colour",
  },
  h: H,
  pal: {
    L: 0xf4dc94, h: 0xd8ac5c, H: 0xa2703c, t: 0xffe2c8, s: 0xf2c49e, S: 0xcc8c6c, K: 0x3a2228, w: 0xf2e8d2,
    r: 0xb8505a, R: 0x8e2f42, C: 0x5e1c34, g: 0x56603c, k: 0x7a5034, m: 0xbcc2c4,
  },
  frames: { down, up, side },
  ink: 'tinted',
  outline: 0x3a2228,
  line: { r: 0x3e1226, R: 0x3e1226, C: 0x3e1226, g: 0x3e1226, w: 0x3e1226 },
};
