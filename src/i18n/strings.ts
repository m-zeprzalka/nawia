// All on-screen text that does not live in a room file. Polish first, English second.

import type { Bilingual } from '../world/roomFormat.ts';

export type Lang = 'pl' | 'en';

const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('nawia.lang') : null;
let lang: Lang =
  stored === 'pl' || stored === 'en'
    ? stored
    : typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('pl')
      ? 'pl'
      : 'en';

export const getLang = (): Lang => lang;

export function setLang(l: Lang): void {
  lang = l;
  try {
    localStorage.setItem('nawia.lang', l);
  } catch {
    /* private mode: fine */
  }
}

export const toggleLang = (): Lang => {
  setLang(lang === 'pl' ? 'en' : 'pl');
  return lang;
};

/** Pick the current language from a bilingual pair. */
export const t = (b: Bilingual): string => b[lang];

export const STR = {
  subtitle: { pl: 'Dzwon pod jeziorem milczy.', en: 'The bell beneath the lake is silent.' },
  pressShift: { pl: 'naciśnij  SHIFT', en: 'press  SHIFT' },
  pressShiftPad: { pl: 'naciśnij  Y', en: 'press  Y' },
  langHint: { pl: '[L] English', en: '[L] Polski' },
  menuPlay: { pl: 'Graj', en: 'Play' },
  menuLab: { pl: 'Plac prób (style grafiki)', en: 'Playground (art styles)' },
  jam: { pl: 'GitHub Game Off 2026 — demo', en: 'GitHub Game Off 2026 — demo' },

  intro: [
    {
      pl: 'Dzwon w zatopionym grodzie od lat milczy.\nGranica między Jawią a Nawią pęka.\nNocami we wsi pojawiają się rzeczy, których być nie powinno.',
      en: 'The bell of the drowned stronghold has been silent for years.\nThe border between Jawia and Nawia is cracking.\nAt night, things that should not be walk the village.',
    },
    {
      pl: 'Stara zielarka dała ci kurzego boga:\nkamień z dziurą, osadzony w rękojeści twojego miecza.\n\nPrzekręć go, a świat obróci się razem z nim.',
      en: 'The old herbalist gave you a hag stone:\na stone with a hole, set in the hilt of your sword.\n\nTurn it, and the world turns with it.',
    },
    {
      pl: 'Ale granica nie wybacza pomyłek.\nObrócisz kamień tam, gdzie po drugiej stronie coś stoi,\na odrzuci cię i weźmie swoje.\n\nWeź miecz i tarczę. Zejdź do grodu.\nRozkołysz dzwon.',
      en: 'But the border forgives no mistakes.\nTurn the stone where something stands on the other side,\nand it will throw you back and take its due.\n\nTake your sword and shield. Go down to the stronghold.\nMake the bell swing again.',
    },
  ] as Bilingual[],
  introNext: { pl: '[SHIFT] dalej', en: '[SHIFT] next' },

  worldName: {
    jawia: { pl: 'JAWIA', en: 'JAWIA' },
    nawia: { pl: 'NAWIA', en: 'NAWIA' },
  },
  worldTag: {
    jawia: { pl: 'świat żywych', en: 'world of the living' },
    nawia: { pl: 'świat duchów', en: 'world of spirits' },
  },

  hintShift: { pl: '[SHIFT] lub [SPACJA] — przekręć kamień', en: '[SHIFT] or [SPACE] — turn the stone' },
  hintShiftPad: { pl: '(Y) — przekręć kamień', en: '(Y) — turn the stone' },
  hintAttack: { pl: '[Z] lub [J] — cios', en: '[Z] or [J] — strike' },
  hintAttackPad: { pl: '(A) — cios', en: '(A) — strike' },
  hintShield: { pl: '[X] lub [K] — trzymaj tarczę', en: '[X] or [K] — hold the shield' },
  hintShieldPad: { pl: '(B) — trzymaj tarczę', en: '(B) — hold the shield' },
  hintRejected: {
    pl: 'Po drugiej stronie coś tu stoi. Granica cię odrzuciła.',
    en: 'Something stands here on the other side. The border threw you back.',
  },
  hintBell: { pl: 'Uderz w dzwon.', en: 'Strike the bell.' },
  hintReflect: { pl: 'Tarcza [X] odsyła błędny ogień tam, skąd przyszedł.', en: 'The shield [X] sends a wisp\'s fire back where it came from.' },
  hintReflectPad: { pl: 'Tarcza (B) odsyła błędny ogień tam, skąd przyszedł.', en: 'The shield (B) sends a wisp\'s fire back where it came from.' },
  hintTwoSouls: { pl: 'Strzyga ma dwie dusze. Druga wstała po tamtej stronie.', en: 'A strzyga has two souls. The second one rose on the other side.' },
  hintStone: { pl: 'Kamienia nie rani stal. Niech sam się rozbije.', en: 'Steel does not hurt the stone. Let it break itself.' },
  hintHeart: { pl: 'Pękł. Jego serce bije po drugiej stronie.', en: 'It cracked. Its heart beats on the other side.' },

  hintTalk: { pl: '[Z] lub [J] — rozmowa', en: '[Z] or [J] — talk' },
  hintTalkPad: { pl: '(A) — rozmowa', en: '(A) — talk' },
  hintMove: { pl: '[WASD] lub strzałki — ruch', en: '[WASD] or arrows — move' },
  hintMovePad: { pl: 'lewa gałka — ruch', en: 'left stick — move' },
  look: { pl: 'Wygląd', en: 'Look' },
  /** Names for villagers who only have a single line in a room file (conversations name their own speakers). */
  npcName: {
    herbalist: { pl: 'Zielarka', en: 'Herbalist' },
    elder: { pl: 'Starzec', en: 'Elder' },
    woman: { pl: 'Gospodyni', en: 'Housewife' },
    child: { pl: 'Dziecko', en: 'Child' },
  },

  dead: { pl: 'Nawia cię nie chce. Jeszcze nie.', en: 'Nawia does not want you. Not yet.' },

  endTitle: { pl: 'Dzwon odpowiedział.', en: 'The bell answered.' },
  endBody: {
    pl: 'Wielki dzwon bije pod jeziorem, a granica się domyka.\nStrażnik leży w gruzach po obu jej stronach.\nDusze grodu odchodzą tam, gdzie ich miejsce.\n\nTo koniec dema. Dziękuję za grę.',
    en: 'The great bell rings beneath the lake, and the border closes.\nThe guardian lies in rubble on both sides of it.\nThe souls of the stronghold go where they belong.\n\nThis is the end of the demo. Thank you for playing.',
  },
  endAgain: { pl: '[SHIFT] od nowa', en: '[SHIFT] play again' },
  paused: { pl: 'PAUZA', en: 'PAUSED' },
} as const;
