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
      pl: 'Zabłocie, wieś na skraju bagien Rojsty.\nDzwon Budzisław w zatopionym Zwonigrodzie od lat milczy,\na granica między Jawią a Nawią pęka.',
      en: 'Zabłocie, a village on the edge of the Rojsty marshes.\nBudzisław, the bell of drowned Zwonigród, is silent,\nand the border between Jawia and Nawia is cracking.',
    },
    {
      pl: 'Tej nocy coś przyszło od strony kurhanu.\nNikt nie krzyczał. Psy nie szczekały.\n\nRano łóżko twojej siostry Dobrawy było puste.',
      en: 'That night something came from the barrow.\nNo one screamed. The dogs did not bark.\n\nIn the morning your sister Dobrawa\'s bed was empty.',
    },
    {
      pl: 'Jesteś Sambor, uczeń starej zielarki Radochny.\nNie masz miecza ani tarczy,\na o Nawii wiesz tyle, co z bajek.\n\nWstań. Dobrawa czeka.',
      en: 'You are Sambor, apprentice of old Radochna the herbalist.\nYou have no sword and no shield,\nand of Nawia you know only what the tales say.\n\nGet up. Dobrawa is waiting.',
    },
  ] as Bilingual[],
  /** the intro of the earlier demo, kept for reference (not shown) */
  introV1: [
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
  hintNoStone: { pl: 'Nie masz czego przekręcić. Kurzy bóg jest u Radochny.', en: 'You have nothing to turn. The hag stone is with Radochna.' },
  hintDodge: { pl: '[C] lub [I] — przewrót: w locie nic cię nie trafi', en: '[C] or [I] — roll: nothing can hit you mid-roll' },
  hintDodgePad: { pl: '(X) — przewrót: w locie nic cię nie trafi', en: '(X) — roll: nothing can hit you mid-roll' },
  hintCombo: { pl: '[Z] trzy razy — trzy ciosy, ostatni najcięższy', en: '[Z] three times — three blows, the last the heaviest' },
  hintComboPad: { pl: '(A) trzy razy — trzy ciosy, ostatni najcięższy', en: '(A) three times — three blows, the last the heaviest' },
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
  beastsNew: { pl: 'Przeciwnicy: nowi (M)', en: 'Enemies: new (M)' },
  beastsOld: { pl: 'Przeciwnicy: dawni', en: 'Enemies: the first ones' },
  /** Names for villagers who only have a single line in a room file (conversations name their own speakers). */
  npcName: {
    herbalist: { pl: 'Zielarka', en: 'Herbalist' },
    elder: { pl: 'Starzec', en: 'Elder' },
    woman: { pl: 'Gospodyni', en: 'Housewife' },
    child: { pl: 'Dziecko', en: 'Child' },
  },

  dead: { pl: 'Nawia cię nie chce. Jeszcze nie.', en: 'Nawia does not want you. Not yet.' },

  endTitle: { pl: 'Budzisław odpowiedział.', en: 'Budzisław answered.' },
  endBody: {
    pl: 'Dzwon bije pod jeziorem, a granica się domyka.\nNa brzegu Głuchego Jeziora budzi się Dobrawa:\nmokra, zziębnięta, żywa.\nDusze Zwonigrodu odlatują do Wyraju jako żurawie.\n\nTo koniec dema. Dziękuję za grę.',
    en: 'The bell rings beneath the lake, and the border closes.\nOn the shore of Głuche Lake Dobrawa wakes:\nwet, cold, alive.\nThe souls of Zwonigród fly off to Wyraj as cranes.\n\nThis is the end of the demo. Thank you for playing.',
  },
  endAgain: { pl: '[SHIFT] od nowa', en: '[SHIFT] play again' },
  paused: { pl: 'PAUZA', en: 'PAUSED' },
} as const;
