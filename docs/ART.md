# Grafika: kierunek, placeholdery i ich podmiana

## Kierunek

- **Jawia – tu i teraz.** Mokra, ciężka, materialna: ciepły kamień, mech, zbutwiałe drewno, ogień.
  Powierzchnie są jasne, szczeliny między nimi ciemne. Poza murami jest ubita ziemia.
- **Nawia – świat duchów.** Lekka, świetlista, cicha: gród, jakim pamiętają go umarli.
  Powierzchnie są ciemne, a **szczeliny świecą**. Mury mają świetlny kontur, poza nimi nie ma ziemi, tylko gwiazdy.
  Dusze i zjawy są fioletowe, żeby nie zlewały się z cyjanem otoczenia.
- Bohater wygląda tak samo po obu stronach (czerwony płaszcz i opaska, tarcza, miecz) – jest jedyną stałą.
- **Postaci są rysowane na siatce**, jak w klasykach 8- i 16-bitowych: bohater i każdy zwykły wróg to dokładnie
  jeden kafel 16x16, strażnik to 2x2 kafle (32x32). Miecz jest osobnym sprite'em 16x16 kładzionym obok bohatera.

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
| `hero.png` | 16x16 | wiersze: przód, tył, bok (w prawo; lewo to odbicie); kolumny: stoi, krok A, krok B, zamach, cios, garda (tarcza w górze), 2 wolne (łuk). Podeszwy na dolnej krawędzi komórki |
| `sword.png` | 16x16 | 8 klatek: ostrze skierowane na N, NE, E, SE, S, SW, W, NW. Rękojeść w klatce N leży w punkcie (7.5, 11.5), w NE w (3.5, 11.5); pozostałe to obroty |
| `mobs.png` | 16x16 | 4 kolumny. Wiersz 0: utopiec (2 klatki spoczynku, atak); 1: zjawa (tak samo); 2: ognik (4 klatki płomienia); 3: strzyga, ciało; 4: strzyga, druga dusza; 5: serce strażnika (2 klatki w skorupie, 2 odsłonięte) |
| `boss.png` | 32x32 | strażnik: spoczynek A, spoczynek B, zamach, szarża, ogłuszony (pęknięty) |
| `shots.png` | 8x8 | ogień ognika x2, kula duszy x2 |
| `objects.png` | 16x32 | wiersz 0: Jawia – kosz x4, pochodnia x4; wiersz 1: to samo w Nawi; wiersz 2: kamień (J), kamień (N), krata, krata otwarta, dzwon x3, serce; wiersz 3: urna (J), urna (N), bożek (J), bożek (N), kolumna (J), kolumna (N), kości; wiersz 4: dusze x3, kamień słońca i księżyca (słońce, księżyc); wiersz 5: słup słońca (stoi, schowany), słup księżyca (stoi, schowany). Wszystko stoi na dolnej krawędzi komórki |
| `greatbell.png` | 48x48 | wielki dzwon: w spoczynku, wychylony w lewo, w prawo; stoi na środku dolnej krawędzi |
| `slash.png` | 32x32 | łuk za ostrzem; wiersze: prawo, dół, lewo, góra; 3 klatki; biały (barwiony w grze kolorem świata). Ćwierć koła, którą przechodzi miecz |
| `px.png` | 8x8 | cząsteczki, białe |
| `ui.png` | 16x16 | serce, pół serca, puste serce, kamień (Jawia), kamień (Nawia) |

Zasady, których trzyma się kod (warto trzymać się ich też w PNG):

- 320x180, kafel 16 px, bez skalowania i obracania sprite'ów w grze.
- Kafle ścian, fug i brzegów to **nakładki** z przezroczystością składane na kaflu bazowym – dzięki temu zestaw jest mały.
  Płyty podłogi mają 2 kafle szerokości; ich końce domykają nakładki `joint_r` i `hl_l`.
- Oba zestawy kafli mają identyczny układ. Niektóre pola znaczą co innego w każdym świecie
  (omszały mur w Jawi to mur z runą w Nawi; „to, co poza murami” to 4 warianty ziemi w Jawi i 4 klatki migoczących gwiazd w Nawi).
- Światło i mgła są nakładane w grze, więc kafle maluje się „w pełnym świetle”.
- Bohater jest składany z części (tułów z głową, nogi, tarcza) w `src/art/actors.ts` – nowa poza (np. łuk) to kilka linii.
  Tam też są wrogowie i strażnik; `src/art/sprites.ts` trzyma wszystko, co stoi w miejscu.
