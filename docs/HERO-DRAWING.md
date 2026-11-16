# Jak rysować bohatera piksel po pikselu

Każdy bohater z placu prób (C1g, C1h, C2f, C12…) to rysunek zapisany w zwykłym pliku tekstowym. Nie ma tam żadnej
grafiki ani programu graficznego. Każdy piksel to jedna litera, a litera oznacza kolor. Żeby zmienić piksel, zmieniasz
literę i zapisujesz plik. Plac prób sam się przeładuje i od razu zobaczysz bohatera w ruchu.

## 1. Gdzie jest rysunek

Wszystkie koncepty leżą w `src/art/concepts/`, jeden plik na koncept: `<nazwa>.concept.ts`. Kod z planszy (np. `C1g`)
jest w pliku w linijce `code: 'C1g'`. Rodzina „Najlepszy” wygląda tak:

| Kod | Plik | Co jest w pliku |
|---|---|---|
| **C1g** | `najlepszy-g.concept.ts` | **cały rysunek**: kolory, przód, tył i bok, złożone z części (patrz punkt 4) |
| **C1h** | `najlepszy-h.concept.ts` | tylko bok, jako trzy pełne klatki piksel w piksel; przód, tył i kolory bierze z C1g |
| **C2f** | `najlepszy-wysoki-f.concept.ts` | tułów, ręce i nogi w wersji 16×18; głowy, tarcze i kolory bierze z C1g |

Ważne: głowy i kolory C1h i C2f są w pliku C1g. Jeśli poprawisz oko w `najlepszy-g.concept.ts`, poprawi się we
wszystkich trzech. Starsze wersje (C1, C1b…C1f) mają własne pliki i się nie zmienią.

## 2. Rysunek to tekst

Głowa C1g patrząca na nas (`HEAD_D` w `najlepszy-g.concept.ts`):

```
            kolumna: 0123456789012345
export const HEAD_D = [
  '......hlhh......',   // rząd 0   czubek włosów
  '....hhllhhhH....',   // rząd 1
  '....hlhhhhhH....',   // rząd 2
  '....hhsthshH....',   // rząd 3   grzywka i czoło
  '....hSKssKSH....',   // rząd 4   powieki: K (ciemny brąz) nad tęczówką, S (cień skóry) nad białkiem
  '....hbpttpbH....',   // rząd 5   oczy: b (białko), p (niebieska tęczówka)
  '.....tssssS.....',   // rząd 6   broda
];
```

- Każdy napis w apostrofach `'...'` to **jeden rząd pikseli**. Zawsze ma **dokładnie 16 znaków** (bohater ma 16 px szerokości).
- Każdy znak to jeden piksel. **Kropka `.` to pusty piksel** (przezroczysty, widać przez niego trawę).
- **Litera to kolor**, według tabeli `PAL` w tym samym pliku. Wielkość liter ma znaczenie: `h` i `H` to dwa różne kolory.
  Zwykle mała litera to kolor podstawowy, a wielka to jego cień.
- Kolumny liczy się od 0 od lewej, a rzędy od 0 od góry. Liczby nad rysunkiem i komentarze `// rząd` dopisałem tu dla
  wyjaśnienia; w pliku ich nie ma.
- Wcięcia, przecinki i apostrofy muszą zostać tak, jak są. Zmieniasz tylko znaki **wewnątrz** apostrofów.

## 3. Kolory

Na górze pliku C1g jest tabela `PAL`:

```ts
export const PAL = {
  l: 0xf2d488, // hair, the light
  h: 0xd6a04a, // hair
  H: 0xb87a50, // hair, the shadow
  ...
};
```

- `0xRRGGBB` to kolor w zapisie szesnastkowym, jak w każdym programie graficznym (`#d6a04a` to `0xd6a04a`).
  Zmiana liczby przemaluje **wszystkie** piksele tej litery we wszystkich klatkach.
- Nowy kolor to nowa litera w tabeli, np. `e: 0x6a8fc8,`. Potem można jej użyć w rysunku.
- Limit: **najwyżej 15 różnych kolorów** razem z obrysem. Tyle miał sprite 16-bitowy. Dwie litery o tym samym
  kolorze liczą się jako jeden. W C1g `S` (cień skóry) ma ten sam kolor co `H` (cień włosów), więc mieści się w 15.
  Dlatego z boku `S` na szczęce wygląda jak broda.

## 4. Klatki: widoki i kroki

Bohater ma **9 klatek**: trzy widoki × trzy pozy.

- widoki: `down` patrzy na nas, `up` pokazuje plecy, `side` patrzy w prawo (idąc w lewo gra odbija tę klatkę lustrzanie,
  więc lewego profilu nie rysujesz);
- pozy: pierwsza to stanie, druga i trzecia to dwa kroki; chód odtwarza: stanie, krok, stanie, drugi krok;
- klatka C1g ma 16 rzędów, C2f 18; podeszwy stoją w przedostatnim rzędzie, **ostatni rząd zostaje pusty**
  (tam gra dorysowuje obrys pod stopami).

Klatki zapisuje się na dwa sposoby:

**a) Z części (C1g, C2f).** Głowa, tułów, ręce, nogi i tarcza są narysowane osobno, a klatki je układają:

```ts
const side: Frames = [
  stack([9, SHIELD_S], [12, LEGS_S.stand], [7, TRUNK_S], [8, ARM_S.stand], [0, HEAD_S]),   // stanie
  stack([10, SHIELD_S], [12, LEGS_S.near], [8, TRUNK_S], [9, ARM_S.back], [1, HEAD_S]),    // krok
  stack([10, SHIELD_S], [12, LEGS_S.far], [8, TRUNK_S], [9, ARM_S.fwd], [1, HEAD_S]),      // drugi krok
];
```

- `[0, HEAD_S]` znaczy: pierwszy rząd głowy z boku idzie do rzędu 0 klatki. `[1, HEAD_S]` to ta sama głowa piksel niżej:
  tak bohater się kołysze w kroku.
- Części nie przesuwa się w bok: kolumna w części to ta sama kolumna w klatce. Każdy rząd części też ma 16 znaków.
- Część dalej na liście przykrywa wcześniejsze (głowa jest ostatnia, więc jest na wierzchu). Kropka w części niczego nie
  przykrywa.
- Zaleta: **oko poprawiasz raz** (w `HEAD_S`) i zmienia się we wszystkich trzech klatkach boku.

**b) Pełne klatki (C1h).** Każda z trzech klatek boku jest wypisana w całości, 16 rzędów po 16 znaków. Co widzisz, to
dostajesz; ale głowę trzeba poprawić w każdej z trzech klatek osobno.

## 5. Obrys

Obrysu nie rysujesz. Dorysowuje go gra wokół postaci, według ustawienia `ink` na końcu pliku:

- `'rim'` (C1g, C1h, C2f): linia tylko **pod** i **na prawo** od postaci, po stronie cienia. Jej kolor zależy od tego,
  czego dotyka, według tabeli `LINE` (np. przy włosach ciemny brąz, przy płaszczu ciemne wino). Wszystko inne dostaje
  kolor `outline`;
- `'none'`: bez obrysu (C7c, C13);
- `'dark'`: jednym ciemnym kolorem (`outline`) dookoła;
- `'tinted'`: dookoła, kolorami z `LINE`.

Obrys trafia tylko na puste piksele (`.`). Dlatego na dużym podglądzie z boku pod brodą widać brązowy piksel, którego
nie ma w rysunku: to obrys.

## 6. Jak oglądać zmiany

**W ruchu, na placu prób.** `npm run dev`, potem w przeglądarce `http://localhost:5173/?lab&hero=C1g`. Po zapisaniu
pliku strona **przeładuje się sama**. Klawisze:

- strzałki: chodzenie;
- `Q`/`E`: poprzedni i następny bohater;
- `N`: pora dnia;
- `G`: siatka kafli;
- `T`: podpisy;
- `Shift`: Jawia i Nawia.

**Duży podgląd z numerami.** W terminalu:

```
npm run hero:preview -- C1g          jeden koncept
npm run hero:preview -- C1g C1h C2f  kilka
```

Powstaje obrazek `art-template/hero/C1g.png` (ten folder nie trafia do gita). Zawiera:

- na górze głowę z przodu i z boku powiększoną 24 razy, z numerami kolumn i rzędów: odczytujesz rząd i kolumnę i
  zmieniasz ten znak w napisie;
- pod spodem wszystkie 9 klatek na trawie i na ciemnej podłodze;
- na dole chód w wielkości z gry.

Skrypt wypisuje też liczbę kolorów i wszystkie błędy.

**Błędy.** Rząd za krótki albo za długi, litera bez koloru w `PAL`, zła liczba rzędów, coś w ostatnim rzędzie albo ponad
15 kolorów: plac prób i tak narysuje, co się da. W drugiej linijce na górze napisze „! C1g: błędy w rysunku: …”, a ich opis
(która klatka, który rząd) wypisze w konsoli przeglądarki (F12).

## 7. Przykład: oko z boku piksel głębiej w twarzy

Głowa z boku C1g (`HEAD_S`), z numerami kolumn:

```
            kolumna: 0123456789012345
  '.......hhh......',   // rząd 0
  '......lhhhh.....',   // rząd 1
  '.....hhhhhhh....',   // rząd 2
  '.....HhhhhhH....',   // rząd 3   grzywka do przodu (kolumna 11)
  '.....HhhhSKs....',   // rząd 4   powieka: S w kolumnie 9 (nad białkiem), K w kolumnie 10 (nad tęczówką)
  '.....HhHsbps....',   // rząd 5   białko b w kolumnie 9, tęczówka p w kolumnie 10, skóra s w kolumnie 11
  '......HHsss.....',   // rząd 6   broda
```

Żeby cofnąć oko o piksel (dalej od przodu twarzy), przesuwasz `S K` i `b p` o jedną kolumnę w lewo. Na zwolnione miejsce
w kolumnie 10 wpisujesz skórę `s`:

```
  '.....HhhSKss....',   // rząd 4   (było .....HhhhSKs....)
  '.....HhHbpss....',   // rząd 5   (było .....HhHsbps....)
```

Zapisz plik i popatrz na placu prób. Policz znaki: każdy rząd nadal ma 16. W tym przykładzie powieka zajęła też
kolumnę 8, gdzie był kosmyk włosów `h`, więc włosy na skroni są o piksel krótsze.

## 8. Nowy wariant zamiast poprawiania

Żeby zachować starą wersję do porównania:

1. Skopiuj plik, np. `najlepszy-g.concept.ts` jako `najlepszy-moj.concept.ts`.
2. W kopii zmień `code: 'C1g'` na nowy kod (np. `'M1'`) i `id: 'najlepszy-g'` na `'najlepszy-moj'`. `id` to nazwa pliku
   bez `.concept.ts`.
3. Dopisz linijkę `M1  moja poprawka oka` w `src/lab/lineup.txt` nad `archive:`, tam gdzie ma stać na planszy.
4. Poprawiaj kopię.

Pliki C1h i C2f biorą głowy z C1g przez linijkę `import … from './najlepszy-g.concept.ts'`. Twoja kopia jest od nich
niezależna.

## 9. Pułapki

- **16 znaków w każdym rzędzie.** To najczęstszy błąd; edytor z czcionką o stałej szerokości bardzo pomaga.
- **Ten sam kolor co włosy na twarzy.** W C1g `S` = `H`: z boku cień skóry na szczęce czyta się jak broda albo baczki.
- **Jasna skóra `t` przy białku `b`.** Zlewają się w jedną jasną plamę i oko znika.
- **Głowa z boku** nie powinna być głębsza niż tułów pod nią (7–8 pikseli), bo wygląda jak jajko. Twarz jest płaska, bez
  nosa.
- **Oko z boku to to samo oko co z przodu**: te same rzędy (powieka w 4, białko i tęczówka w 5), te same kolory. Tęczówka z
  przodu, białko za nią, przed tęczówką jeden piksel skóry.

## 10. Potwory

Potwory rysowane w całości (kody **M** na placu prób) zapisuje się tak samo: litery, kolory w `PAL`, kropka jako pusty
piksel. Leżą w `src/art/beasts/`, jeden plik na potwora: `<nazwa>.beast.ts`. Format opisuje `src/art/beasts/beast.ts`.
Różnice względem bohatera:

- **Rozmiar.** Szerokość 16, 24 albo 32 px (`w`), wysokość od 16 do 32 rzędów (`h`): jeden kafel, półtora albo dwa. Każdy
  rząd ma dokładnie `w` znaków. To, co stoi na ziemi, stoi w przedostatnim rzędzie; ostatni zostaje pusty.
- **Jeden widok.** `view: 'side'` znaczy, że potwór jest narysowany w prawo, a idąc w lewo jest odbijany lustrzanie.
  `view: 'front'` znaczy, że zawsze patrzy na nas (płomień, zjawa).
- **Klatki.** `frames` ma trzy części:
  - `stand`: stanie;
  - `walk`: chód, dwie albo cztery klatki;
  - `attack`: atak, jedna albo dwie klatki (zamach, cios).
- **Postać w Nawii.** Część `nawia` jest opcjonalna. Może zmienić kolory (`pal`: tylko te litery, które są inne), klatki
  (`frames`: tylko te, które są inne) i obrys. Na placu prób widać ją po wciśnięciu Shift.
- **Kolory.** Najwyżej 15 w każdej postaci, razem z obrysem.

Podgląd: `npm run beast:preview -- M1` zapisuje obrazek `art-template/beasts/M1.png`. Na obrazku są:
- duża klatka stania z numerami rzędów i kolumn, dla każdej postaci (Jawia i Nawia);
- wszystkie klatki na trawie i na ciemnym tle;
- to samo w wielkości z gry, obok bohatera C1g, żeby było widać skalę.

Kto stoi na planszy potworów i w jakich grupach, decyduje sekcja `monsters:` w `src/lab/lineup.txt`. Działa tak samo jak
plansza bohaterów i ma wspólne archiwum. Kody na planszy potworów:
- **E** to przeciwnicy z gry, tacy, jacy są teraz;
- **P** to pierwsze potwory z placu prób;
- **M** to potwory rysowane w całości.
