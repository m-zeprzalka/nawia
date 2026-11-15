# Grafika: kierunek, technika i podmiana na PNG

Cała grafika powstaje w kodzie (`src/art/`). Nie ma ani jednego pliku graficznego w repozytorium poza ikoną strony.

![Skraj wsi w Jawi](img/shrine-jawia.png)

## Kierunek

- **Jawia – tu i teraz.** Na powierzchni jasny poranek: światło pada z lewej góry, wszystko rzuca cień w prawo w dół.
  Pod ziemią mokra, ciężka ruina: ciepły kamień, mech, ogień. Powierzchnie są jasne, szczeliny między nimi ciemne.
- **Nawia – świat duchów.** To samo miejsce, jakim pamiętają je umarli: granatowe powierzchnie, a **krawędzie i szczeliny świecą**.
  Poza światem nie ma ziemi, tylko gwiazdy (poza murami grodu, w głębi lasu, w miejscu wody).
  Dusze i zjawy są fioletowe, żeby nie zlewały się z cyjanem otoczenia.
- Bohater wygląda tak samo po obu stronach: jasne włosy, czerwona przepaska, lniana koszula, czerwony płaszcz, okrągła tarcza.
- **Postaci są rysowane na siatce**, jak w klasykach 8- i 16-bitowych: bohater, mieszkańcy i każdy zwykły wróg to dokładnie
  jeden kafel 16×16, strażnik to 2×2 kafle (32×32). Miecz jest osobnym sprite'em 16×16 kładzionym obok bohatera.

### Zasady stylu

1. **Jedno światło.** Lewa góra jest jasna, prawy dół ciemny: na postaciach, drzewach, dachach, głazach.
2. **Rampa, nie pojedyncze kolory.** Każdy materiał ma rampę od najciemniejszego `[0]` do najjaśniejszego. Indeks `[4]` to zawsze
   „najcieńsza, najjaśniejsza kreska”: refleks w Jawi, poświata w Nawi. Dzięki temu ten sam kod rysuje oba światy.
3. **Plamy, nie szum.** Trawa, woda i ścieżka to duże płaskie plamy o czystych krawędziach plus rzadkie, czytelne detale
   (źdźbło, kamyk, fala). Żadnego ditheringu w obrazie pokoju.
4. **Miękki kontur.** Postaci mają kontur zabarwiony tym, z czym sąsiaduje (włosy: brąz, płaszcz: wino), a nie czarną kreskę.
5. **Sylwetka mówi, kto to.** Utopiec: oczy na czubku głowy i paszcza na całą twarz. Zjawa: długie włosy i suknia bez końca.
   Ognik: trzy języki płomienia. Strzyga: sowie pędzelki, oczy jak latarnie, dziób. Strażnik: kamienna baba pod płaską czapą.

Palety: `src/art/palette.ts` (loch, postaci) i `SURF` w `src/art/surface.ts` (powierzchnia).
Podgląd wszystkiego naraz: `npm run art:preview`.

## Dwie techniki

**Gród (`biome: crypt`)** jest składany z zestawu kafli 16×16 (`src/art/tiles.ts`). Ściany, fugi i brzegi to nakładki
z przezroczystością kładzione na kafel bazowy, dzięki czemu zestaw jest mały. Oba światy mają identyczny układ kafli.

**Powierzchnia (`biome: village`, `forest`)** jest malowana (`src/art/surface.ts`, `src/world/surfacePainter.ts`):

- grunt (trawa, ścieżka, woda, brzeg, runo) jest liczony dla każdego piksela z odległości od najbliższej ścieżki, wody i lasu,
  dlatego brzegi są zaokrąglone, a nie kwadratowe;
- drzewa, chaty, studnia, płoty, głazy to **stemple** rysowane od tyłu do przodu; korona drzewa to kilka kul cieniowanych
  w czterech tonach z kreskami liści;
- część stempla wyższa niż 8 px nad podstawą trafia do warstwy rysowanej **nad bohaterem**, więc da się wejść za drzewo;
- cienie rzucane są nakładane na grunt jednym tonem (tylko w Jawi: w Nawi nie ma słońca);
- woda i gwiazdy mają 4 klatki.

Co na powierzchni jest sprite'em, a nie farbą: drogowskaz, ognisko, garnek, bożek, brama, mieszkańcy, dusze, serca
(arkusze `surface` i `folk`). Reszta jest częścią obrazu pokoju.

## Podmiana grafiki na PNG

Każdy arkusz sprite'ów to zwykła, stała siatka. Podmiana nie wymaga zmian w kodzie:

1. `npm run art:export` zapisuje wszystkie arkusze do `art-template/` (PNG 1:1, przezroczyste tło).
2. Przemaluj wybrany plik w dowolnym edytorze (Aseprite, LibreSprite, Krita, GIMP...).
3. Zapisz go pod **tą samą nazwą** w katalogu `assets/`.
4. Przy starcie gra bierze PNG z `assets/` zamiast wersji generowanej. Można podmieniać po jednym pliku.

Gruntu powierzchni nie da się w ten sposób podmienić (nie jest arkuszem). Żeby zmienić jego wygląd, zmień kolory w `SURF`
albo funkcje w `surface.ts`.

| Plik | Komórka | Układ |
|---|---|---|
| `hero.png` | 16×16 | wiersze: przód, tył, bok (w prawo; lewo to odbicie); kolumny: stoi, krok A, krok B, zamach, cios, garda, 2 wolne (łuk). Podeszwy na dolnej krawędzi komórki |
| `folk.png` | 16×16 | mieszkańcy, po 2 klatki: zielarka, starzec, kobieta, dziecko |
| `sword.png` | 16×16 | 8 klatek: ostrze skierowane na N, NE, E, SE, S, SW, W, NW. Rękojeść w klatce N leży w punkcie (7.5, 11.5), w NE w (3.5, 11.5); pozostałe to obroty |
| `mobs.png` | 16×16 | 4 kolumny. Wiersz 0: utopiec (2 klatki spoczynku, atak); 1: zjawa; 2: ognik (4 klatki płomienia); 3: strzyga, ciało; 4: strzyga, druga dusza; 5: serce strażnika (2 klatki w skorupie, 2 odsłonięte) |
| `boss.png` | 32×32 | strażnik: spoczynek A, spoczynek B (krok), zamach, szarża, ogłuszony (pęknięty) |
| `shots.png` | 8×8 | ogień ognika ×2, kula duszy ×2 |
| `objects.png` | 16×32 | rekwizyty grodu. Wiersz 0: Jawia – kosz ×4, pochodnia ×4; wiersz 1: to samo w Nawi; wiersz 2: kamień z napisem (J), (N), krata, krata otwarta, dzwon ×3, serce; wiersz 3: urna (J), (N), bożek (J), (N), kolumna (J), (N), kości; wiersz 4: dusze ×3, kamień słońca i księżyca (słońce, księżyc); wiersz 5: słup słońca (stoi, schowany), słup księżyca (stoi, schowany) |
| `surface.png` | 16×32 | rekwizyty powierzchni. Wiersz 0 (Jawia): drogowskaz, ognisko ×4, garnek, bożek, białe kwiaty; wiersz 1: to samo w Nawi; wiersz 2: brama (J) zamknięta i otwarta, brama (N) zamknięta i otwarta |
| `greatbell.png` | 48×48 | wielki dzwon: w spoczynku, wychylony w lewo, w prawo |
| `slash.png` | 32×32 | łuk za ostrzem; wiersze: prawo, dół, lewo, góra; 3 klatki; biały (barwiony w grze kolorem świata) |
| `px.png` | 8×8 | cząsteczki, białe |
| `ui.png` | 16×16 | serce, pół serca, puste serce, kamień (Jawia), kamień (Nawia) |
| `tiles_jawia.png`, `tiles_nawia.png` | 16×16 | kafle grodu; 8 kolumn; kolejność = `TILE_NAMES` w `src/art/tiles.ts` |

Wszystko w arkuszach 16×32 i 48×48 stoi na dolnej krawędzi komórki.

Zasady, których trzyma się kod (warto trzymać się ich też w PNG):

- 320×180, kafel 16 px, bez skalowania i obracania sprite'ów w grze.
- Światło i mgła są nakładane w grze, więc wszystko maluje się „w pełnym świetle”.
- Bohater jest składany z części (tułów z głową, nogi, tarcza) w `src/art/actors.ts`: nowa poza (np. łuk) to kilka linii.
- Sprite, który ma dwie wersje (Jawia, Nawia), ma je w tym samym miejscu dwóch kolejnych wierszy arkusza.
