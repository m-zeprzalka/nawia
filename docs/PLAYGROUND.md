# Plac prób: wybór stylu i klimatu

Plac prób to osobna scena, w której nic się nie dzieje poza tym, że bohater chodzi. Służy do jednego: żeby postawić obok siebie
różne wersje bohatera, mieszkańców, potworów i scenerii, obejrzeć je w ruchu i wskazać, co zostaje. Nic stąd nie jest jeszcze
użyte w grze. To, co zostanie wybrane, przenosi się do gry; reszta znika.

| Bohaterowie i mieszkańcy | Potwory, zmierzch, opis eksponatu |
|---|---|
| ![Bohaterowie](img/playground-heroes.png) | ![Potwory](img/playground-monsters.png) |

## Jak wejść

- z ekranu tytułowego: strzałka w dół na **Plac prób**, potem Shift albo Z,
- albo wprost: `http://localhost:5173/?lab`,
- albo od razu na wybranym zestawie: `?lab&style=sega&hero=lowca&mood=zmierzch&depth=1`
  (`style`: `nes`, `snes`, `sega`, `grim`; `hero`: `wojak`, `druzynnik`, `lowca`, `pastuszek`, `goral`;
  `mood`: `poranek`, `zmierzch`, `jesien`, `ponuro`, `noc`; `depth=1` to paleta 512 kolorów).

## Klawisze

| Klawisz | Co zmienia |
|---|---|
| WASD / strzałki | bohater chodzi |
| **1–4** | styl rysowania postaci |
| **Q / E** | kostium bohatera, którym się chodzi |
| **N** | nastrój scenerii (pora dnia, pora roku) |
| **C** | głębia kolorów: pełna albo 512 kolorów jak na Mega Drive |
| **Shift** | świat: Jawia / Nawia |
| **G** | siatka kafli 16 px |
| **T** | podpisy eksponatów |
| L / M / F | język / wyciszenie / pełny ekran |
| **Esc** | powrót do menu |

Wybrane ustawienia widać w lewym górnym rogu. Gdy bohater stanie przy eksponacie, na dole pojawia się jego kod, pełna nazwa,
rozmiar w pikselach i jedno zdanie o pomyśle, który za nim stoi.

## Co tam stoi

Każdy eksponat ma kod. Wystarczy napisać „bohater H2 w stylu 3, strzyga P3, sceneria: ponuro”.

| Kody | Co | Zachowanie |
|---|---|---|
| **H1–H5** | bohater w pięciu kostiumach: Wojak, Drużynnik (szyszak z nosalem), Łowca (kaptur, łuk), Pastuszek (słomkowy kapelusz), Góral (futrzana czapa) | stoją i obracają się, żeby było widać każdą stronę |
| **N1–N4** | mieszkańcy: zielarka, starzec, gospodyni, dziecko | jak wyżej |
| **P1–P13** | potwory, każdy pomysł w osobnym wariancie | chodzą tam i z powrotem, przystają twarzą do nas |
| **S1–S7** | obecne sprite'y potworów 16×16 z gry | stoją, dla porównania |

Potwory:

| Kod | Kto | Pomysł |
|---|---|---|
| P1 | Utopiec A: topielec | opuchnięty trup w wodorostach, ręce do kolan |
| P2 | Utopiec B: wodnik | chudy, śliski, płetwy zamiast uszu |
| P3 | Strzyga A: jędza | wychudła, zgarbiona, szpony do ziemi, włosy na twarzy |
| P4 | Strzyga B: sowa | płaszcz z piór, oczy jak latarnie, dziób |
| P5 | Zjawa A: całun | pusty kaptur, w środku dwa światła |
| P6 | Zjawa B: południca | kobieta w bieli, czarne włosy na twarzy, sierp, wianek z kłosów |
| P7 | Upiór | drużynnik, który nie odszedł: kości i rdza |
| P8 | Licho | jedno oko, sama skóra i kości |
| P9 | Bies | rogi, ogon, kopyta |
| P10 | Leszy | pan lasu: kora, mech, poroże; 32×48, półtora raza wyższy od człowieka |
| P11 | Wilk A | szary, chudy, żółte oko |
| P12 | Wilk B | skażony: ciernie na grzbiecie, oko w kolorze Nawi |
| P13 | Dzik | ciężki przód, szczecina, szable |

## Style postaci (klawisze 1–4)

| Nr | Styl | Co to znaczy |
|---|---|---|
| 1 | 8-bit 16×16 | to, co jest dziś w grze: ręcznie rysowane, duża głowa. Zostawione jako punkt odniesienia |
| 2 | SNES 16×24 | postać wyższa niż kafel, około 2,5 głowy wzrostu, kontur barwiony sąsiednim kolorem, żywe kolory |
| 3 | Mega Drive 24×32 | około 3,5 głowy wzrostu, ciemny kontur, kolory trochę przygaszone, mocniejszy kontrast |
| 4 | mroczna baśń 24×32 | te same proporcje, kolory mocno przygaszone i chłodne |

Potwory mają własne proporcje (są wyższe od bohatera); styl zmienia im tylko kontur i kolorystykę.
W stylu 1 bohater i mieszkańcy to stare sprite'y, a potwory P1–P13 zostają w nowym rysunku.

## Nastroje scenerii (klawisz N)

Ta sama łąka, wieś, staw i krąg kamieni w pięciu wersjach: **poranek** (obecny wygląd gry), **zmierzch** (ciepłe światło, fioletowe
cienie), **jesień** (rdzawe liście, pożółkła trawa), **ponuro** (bez słońca, kolory wyprane) i **noc**. Postaci są podbarwiane
światłem danej pory. Prawy koniec łąki jest zarośnięty skazą, żeby było ją widać w każdym nastroju.
Nawia ma jeden wygląd: tam nie ma pogody.

## Jak są zrobione nowe postaci

Stare sprite'y 16×16 są rysowane ręcznie, piksel po pikselu. Nowe postaci składa „szkielet” (`src/art/rig.ts`): opis proporcji,
materiałów i dodatków zamienia w trzy widoki i pięć klatek chodu. Dzięki temu jeden opis daje od razu wszystkie kierunki,
a nowy wariant to kilka linii, nie sto wierszy rysunku.

Wynika z tego jedno ograniczenie: postaci ze szkieletu są poprawne i spójne, ale nie mają jeszcze ręcznych detali, które
ma grafika robiona przez grafika. Po wyborze kierunku wybrane postaci warto dopracować ręcznie albo oddać do przemalowania
(arkusze eksportuje się jak wszystkie inne).

Czego w szkielecie jeszcze nie ma: zamachu mieczem, gardy, obrażeń, ataków potworów. Postaci na placu tylko stoją i chodzą.

## Dla developera

| Co | Gdzie |
|---|---|
| scena | `src/scenes/PlaygroundScene.ts` (style to tabela `STYLES`, miejsca eksponatów to `*_SPOTS`) |
| mapa łąki | `src/lab/playground.room.txt` (zwykły plik pokoju; nie należy do świata gry) |
| szkielet postaci | `src/art/rig.ts`: `Figure` (dwunożni), `Beast` (czworonożni), `FigureStyle` (kontur i kolorystyka) |
| obsada | `src/art/cast.ts`: `BUILDS` (proporcje), `HEROES`, `FOLK_CAST`, `CREATURES` |
| nastroje | `MOODS` w `src/art/surface.ts`; `quantize9` to paleta 512 kolorów |

- **Nowy kostium bohatera**: wpis w `HEROES` (`person(build, { ... })`): rampy kolorów, `cloak`, `shield`, a w `over`
  to, co ma na głowie i przy pasie (`band`, `helmet`, `hood`, `strawHat`, `furCap`, `sword`).
- **Nowy potwór**: wpis w `CREATURES`. Dwunożny: `monster({ w, h, ... })` z proporcjami, rampami i dodatkami w `under` / `over`
  (dostają `Anchors`: gdzie jest głowa, barki, dłonie). Czworonożny: obiekt `beast`. Dopisz mu miejsce w `CREATURE_SPOTS`.
- **Nowy nastrój**: wpis w `MOODS`: funkcja przeliczająca każdy kolor palety plus rampy podmienione w całości.
- **Nowy styl**: wpis w `STYLES`: proporcje (`mid`, `tall` albo nowe w `BUILDS`) i `FigureStyle`.

## Co dalej, gdy styl będzie wybrany

1. Wybrany bohater dostaje brakujące klatki (zamach, cios, garda) i zastępuje sprite 16×16 w grze.
   Przy większej postaci trzeba poprawić zasięg miecza, pudełko trafień i to, jak chowa się za drzewami.
2. Wybrane potwory dostają klatki ataku i wchodzą do tabeli wrogów (`SPECS` w `src/entities/Enemy.ts`).
3. Wybrany nastrój staje się paletą gry albo jej części (np. poranek przy wsi, ponuro przy kurhanie).
4. To, co odpadło, jest usuwane z `cast.ts`, a plac prób zostaje jako narzędzie.
