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
  pressShiftPad: { pl: 'naciśnij  B', en: 'press  B' },
  langHint: { pl: '[L] English', en: '[L] Polski' },
  jam: { pl: 'GitHub Game Off 2026 — demo', en: 'GitHub Game Off 2026 — demo' },

  intro: [
    {
      pl: 'Dzwon w zatopionym grodzie od lat milczy.\nGranica między Jawią a Nawią pęka.\nNocami we wsi pojawiają się rzeczy, których być nie powinno.',
      en: 'The bell of the drowned stronghold has been silent for years.\nThe border between Jawia and Nawia is cracking.\nAt night, things that should not be walk the village.',
    },
    {
      pl: 'Stara zielarka dała ci kurzego boga:\nkamień z dziurą, osadzony w rękojeści miecza.\n\nPrzekręć go, a świat obróci się razem z nim.',
      en: 'The old herbalist gave you a hag stone:\na stone with a hole, set in the hilt of a sword.\n\nTurn it, and the world turns with it.',
    },
    {
      pl: 'Zejdź do grodu.\nRozkołysz dzwon.',
      en: 'Go down to the stronghold.\nMake the bell swing again.',
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
  hintShiftPad: { pl: '(B) — przekręć kamień', en: '(B) — turn the stone' },
  hintAttack: { pl: '[Z] lub [J] — cios', en: '[Z] or [J] — strike' },
  hintAttackPad: { pl: '(A) — cios', en: '(A) — strike' },
  hintBlocked: { pl: 'Po drugiej stronie coś tu stoi.', en: 'Something stands here on the other side.' },
  hintBell: { pl: 'Uderz w dzwon.', en: 'Strike the bell.' },

  dead: { pl: 'Nawia cię nie chce. Jeszcze nie.', en: 'Nawia does not want you. Not yet.' },

  endTitle: { pl: 'Dzwon odpowiedział.', en: 'The bell answered.' },
  endBody: {
    pl: 'Mały dzwon bije, a granica na chwilę drży.\nGłębiej, pod jeziorem, czeka jego wielki brat\ni strażnik, który żyje na samej granicy.\n\nTo koniec dema. Dziękuję za grę.',
    en: 'The lesser bell rings, and the border trembles.\nDeeper, beneath the lake, its great brother waits,\nand a guardian who lives on the border itself.\n\nThis is the end of the demo. Thank you for playing.',
  },
  endAgain: { pl: '[SHIFT] od nowa', en: '[SHIFT] play again' },
  paused: { pl: 'PAUZA', en: 'PAUSED' },
} as const;
