// M3: an adder, the folk żmija (24 x 16), in place of P3.
//
// The idea: not a thin squiggle but a short, thick-bodied viper lying in an S on the ground, seen a little
// from above so that its back shows, and on its back the one thing everybody knows it by: a black zigzag
// running the whole length of a pale ash-grey body. The head is held up off the ground on the neck, flat on
// top and wider than the neck, with a red eye and the dark band running back from the eye to the jaw.
// It slithers: the S travels back along the body while the zigzag stays on the skin, and the head sways up and
// down a row with the wave.
// It attacks by rearing: the rear coils bunch up, the neck rises in an S with the head drawn back over them,
// then it strikes, the neck shot out in a straight line and the jaws open on the fangs.
// In Nawia the body goes dark and the zigzag burns with a cold light, like a crack or a lightning bolt: the
// mark of the Żmij it is kin to.
//
// Whole frames: the body is a band four rows deep, l (the lit back), b, b, S (the shadowed flank), and the
// zigzag D runs over its top three rows (D...  .D.D  ..D. repeated along the band); the tail thins to one row.

import type { Beast } from './beast.ts';

// the slither, four frames: the S moves back a quarter of its length each frame
const WALK_1 = [
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '..................llll..',
  '................llDDell.',
  '.........lllD...DDDbbbS.',
  '........DDbDbl.lbbSSSSS.',
  '........bbDbbDlDS.......',
  '.......lbSSSSbbb........',
  '.bl..llDS....SDS........',
  '..SllDbb......S.........',
  '...bDbDS................',
  '...SSSS.................',
  '........................',
];

// the head rides the wave, a row up or down
const WALK_2 = [
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '..................llll..',
  '.................lDDell.',
  '......llDl......lDDbbbS.',
  '.....lbDbDl.....DbSSSSS.',
  '.....DDbbbbl...lb.......',
  '....lbSSSSDDD..DS.......',
  '..llDS....Sbbllb........',
  '.bSbS......SbDbS........',
  '...S........SbD.........',
  '.............SS.........',
  '........................',
];

const WALK_3 = [
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '..................llll..',
  '................llDDell.',
  '.....ll.........DDDbbbS.',
  '...llDbl.......lbbSSSSS.',
  '..lbDbDD......lDS.......',
  '..SSSSSbD....lbb........',
  '.b.....SblllDDDS........',
  '........bDbDbbS.........',
  '........SbDbbS..........',
  '.........SSSS...........',
  '........................',
];

const WALK_4 = [
  '........................',
  '........................',
  '........................',
  '........................',
  '..................llll..',
  '................llDDell.',
  '...............lDDDbbbS.',
  '.............llDbbSSSSS.',
  '............DDbbS.......',
  '..ll.......lbbDS........',
  '.bSbll....lDbSS.........',
  '...SDDllDlbbS...........',
  '....SbbDbDDS............',
  '.....SDbbbS.............',
  '......SSSS..............',
  '........................',
];

// the wind-up: the coils bunched on the ground, the neck raised in an S, the head drawn back
const REAR = [
  '........................',
  '............llll........',
  '...........lDDell.......',
  '..........lDDbbblS......',
  '..........DbSSSSS.......',
  '.........lDS............',
  '........lDbS............',
  '........DbS.............',
  '........bDl.............',
  '.........SDbl...........',
  '...lll.....SDbl.........',
  '..lDbDl.....DbS.........',
  '.lbSSbDl...lDbS.........',
  '.bS..SbDllDbS...........',
  '.S....SSbbSS............',
  '........................',
];

// the strike: the neck shot out straight, the jaws open on the fangs
const STRIKE = [
  '........................',
  '........................',
  '........................',
  '........................',
  '..................lll...',
  '.................lDDell.',
  '................lDDbblS.',
  '...............lDbMMMw..',
  '..............lDbMMw....',
  '.............lDbSSS.....',
  '...lll......lDbS........',
  '..lDbDl....lDbS.........',
  '.lbSSbDl..lDbS..........',
  '.bS..SbDllDbS...........',
  '.S....SSbbSS............',
  '........................',
];

export const BEAST: Beast = {
  code: 'M3',
  id: 'zmija-b',
  kind: { pl: 'Żmija', en: 'Viper' },
  name: { pl: 'żmija zygzakowata', en: 'adder' },
  note: {
    pl: 'Krótka i gruba, z czarnym zygzakiem na grzbiecie. Pełznie falą, zwija szyję w S i kąsa z wyskoku.',
    en: 'Short and thick, a black zigzag down its back. It slithers in a wave, coils its neck into an S and strikes.',
  },
  alt: ['P3'],
  w: 24,
  h: 16,
  view: 'side',
  pal: {
    k: 0x1a1018, // the line
    l: 0xc8c4a8, // scales, the light: the back
    b: 0x9e9a80, // scales
    S: 0x6a6656, // scales, the shadow: the flank
    D: 0x1e1a1e, // the zigzag, the band through the eye
    e: 0xe04028, // the eye
    M: 0xb03848, // the open mouth
    w: 0xf4f0e0, // the fangs
  },
  frames: { stand: WALK_1, walk: [WALK_1, WALK_2, WALK_3, WALK_4], attack: [REAR, STRIKE] },
  ink: 'dark',
  outline: 0x1a1018,
  nawia: {
    note: { pl: 'Ciemna wstęga, a zygzak świeci zimnym światłem jak pęknięcie albo piorun.', en: 'A dark ribbon; the zigzag glows with a cold light, like a crack or a lightning bolt.' },
    pal: { k: 0x0a0816, l: 0x4a4a70, b: 0x2c2a48, S: 0x1c1a30, D: 0x8ef0ff, e: 0xff5a6a, M: 0x5a1830, w: 0xeefff8 },
    ink: { ink: 'dark', outline: 0x0a0816 },
  },
};
