# Grafika: placeholdery i ich podmiana

Cała grafika jest na razie rysowana w kodzie (`src/art/`). Każdy arkusz to zwykła, stała siatka,
taka sama jak w docelowym PNG. Podmiana nie wymaga zmian w kodzie:

1. `npm run art:export` – zapisuje wszystkie arkusze do `art-template/` (PNG 1:1, przezroczyste tło).
2. Przemaluj wybrany plik w dowolnym edytorze (Aseprite, LibreSprite, Krita, GIMP...).
3. Zapisz go pod **tą samą nazwą** w katalogu `assets/`.
4. Gotowe: przy starcie gra bierze PNG z `assets/` zamiast wersji generowanej. Można podmieniać po jednym pliku.

| Plik | Komórka | Układ |
|---|---|---|
| `tiles_jawia.png`, `tiles_nawia.png` | 16x16 | 8 kolumn; kolejność kafli = `TILE_NAMES` w `src/art/tiles.ts` |
| `hero.png` | 16x24 | wiersze: przód, tył, bok (w prawo; lewo to odbicie); kolumny: stoi, krok A, krok B, wypad |
| `mobs.png` | 16x24 | wiersz 0: utopiec (2 klatki), wiersz 1: zjawa (2 klatki) |
| `objects.png` | 16x24 | wiersz 0: Jawia – kosz x4, pochodnia x4; wiersz 1: to samo w Nawi; wiersz 2: kamień (J), kamień (N), krata, krata otwarta, dzwon x3 |
| `slash.png` | 32x32 | wiersze: prawo, dół, lewo, góra; 3 klatki; biały (barwiony w grze kolorem świata) |
| `px.png` | 8x8 | cząsteczki, białe |
| `ui.png` | 16x16 | serce, puste serce, kamień (Jawia), kamień (Nawia) |

Zasady stylu, których trzyma się kod (warto trzymać się ich też w PNG):

- 320x180, kafel 16 px, bez skalowania i obracania sprite'ów w grze.
- Kafle ścian i brzegów to **nakładki** z przezroczystością (ranty, cienie, brzegi wody) składane na kaflu bazowym –
  dzięki temu zestaw jest mały.
- Dwa zestawy kafli mają identyczny układ; różni je tylko paleta i detale (mech w Jawi, runy w Nawi).
- Światło i mgła są nakładane w grze, więc kafle maluje się „w pełnym świetle”.

Palety obu światów: `src/art/palette.ts`. Podgląd wszystkiego naraz: `npm run art:preview`.
