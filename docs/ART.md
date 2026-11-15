# Grafika: kierunek, placeholdery i ich podmiana

## Kierunek

- **Jawia – tu i teraz.** Mokra, ciężka, materialna: ciepły kamień, mech, zbutwiałe drewno, ogień.
  Powierzchnie są jasne, szczeliny między nimi ciemne. Poza murami jest ubita ziemia.
- **Nawia – świat duchów.** Lekka, świetlista, cicha: gród, jakim pamiętają go umarli.
  Powierzchnie są ciemne, a **szczeliny świecą**. Mury mają świetlny kontur, poza nimi nie ma ziemi, tylko gwiazdy.
  Dusze i zjawy są fioletowe, żeby nie zlewały się z cyjanem otoczenia.
- Bohater wygląda tak samo po obu stronach (czerwony płaszcz i opaska, tarcza, miecz) – jest jedyną stałą.

Palety: `src/art/palette.ts`. Podgląd wszystkiego naraz: `npm run art:preview`.

## Podmiana placeholderów na PNG

Cała grafika jest na razie rysowana w kodzie (`src/art/`). Każdy arkusz to zwykła, stała siatka,
taka sama jak w docelowym PNG. Podmiana nie wymaga zmian w kodzie:

1. `npm run art:export` – zapisuje wszystkie arkusze do `art-template/` (PNG 1:1, przezroczyste tło).
2. Przemaluj wybrany plik w dowolnym edytorze (Aseprite, LibreSprite, Krita, GIMP...).
3. Zapisz go pod **tą samą nazwą** w katalogu `assets/`.
4. Gotowe: przy starcie gra bierze PNG z `assets/` zamiast wersji generowanej. Można podmieniać po jednym pliku.

| Plik | Komórka | Układ |
|---|---|---|
| `tiles_jawia.png`, `tiles_nawia.png` | 16x16 | 8 kolumn; kolejność kafli = `TILE_NAMES` w `src/art/tiles.ts` |
| `hero.png` | 32x32 | wiersze: przód, tył, bok (w prawo; lewo to odbicie); kolumny: stoi, krok A, krok B, cios 0–2, garda (tarcza w górze), wolne. Podeszwy w wierszu 29 komórki |
| `mobs.png` | 24x24 | wiersz 0: utopiec (3 klatki), wiersz 1: zjawa (3 klatki); trzecia klatka to atak |
| `objects.png` | 16x32 | wiersz 0: Jawia – kosz x4, pochodnia x4; wiersz 1: to samo w Nawi; wiersz 2: kamień (J), kamień (N), krata, krata otwarta, dzwon x3, serce; wiersz 3: urna (J), urna (N), bożek (J), bożek (N), kolumna (J), kolumna (N), kości; wiersz 4: dusze x3. Wszystko stoi na dolnej krawędzi komórki |
| `slash.png` | 32x32 | wiersze: prawo, dół, lewo, góra; 3 klatki; biały (barwiony w grze kolorem świata) |
| `px.png` | 8x8 | cząsteczki, białe |
| `ui.png` | 16x16 | serce, pół serca, puste serce, kamień (Jawia), kamień (Nawia) |

Zasady, których trzyma się kod (warto trzymać się ich też w PNG):

- 320x180, kafel 16 px, bez skalowania i obracania sprite'ów w grze.
- Kafle ścian, fug i brzegów to **nakładki** z przezroczystością składane na kaflu bazowym – dzięki temu zestaw jest mały.
  Płyty podłogi mają 2 kafle szerokości; ich końce domykają nakładki `joint_r` i `hl_l`.
- Oba zestawy kafli mają identyczny układ. Niektóre pola znaczą co innego w każdym świecie
  (omszały mur w Jawi to mur z runą w Nawi; „to, co poza murami” to 4 warianty ziemi w Jawi i 4 klatki migoczących gwiazd w Nawi).
- Światło i mgła są nakładane w grze, więc kafle maluje się „w pełnym świetle”.
- Bohater jest składany z części (ciało, nogi, tarcza, miecz) w `src/art/sprites.ts` – nowa poza (np. łuk) to kilka linii.
