# NAWIA – przewodnik developera

Ten plik opisuje, jak gra jest zbudowana i jak się w niej pracuje. Czytaj go razem z:

- [DESIGN.md](DESIGN.md) – co to za gra: świat, mechaniki, wrogowie, przebieg pokój po pokoju,
- [ROOMS.md](ROOMS.md) – format plików pokoi i legenda znaków,
- [ART.md](ART.md) – kierunek graficzny, arkusze sprite'ów, podmiana grafiki na PNG.

Kod, nazwy plików, komentarze w kodzie i komunikaty commitów są po angielsku. Dokumentacja w `docs/` jest po polsku.

## 1. Szybki start

Wymagania: Node 22.18 lub nowszy (projekt powstaje na Node 24). Nic poza tym: bez backendu, bez plików graficznych i dźwiękowych.

```bash
npm install
npm run dev          # http://localhost:5173, przeładowuje się po zapisaniu pliku (także pokoju)
npm run build        # sprawdzenie typów + sprawdzenie lochu + statyczny build do dist/
npm run preview      # podgląd tego, co trafi na itch.io
```

Narzędzia pomocnicze:

| Komenda | Co robi |
|---|---|
| `npm run typecheck` | samo `tsc --noEmit` |
| `npm run rooms:check` | przechodzi cały świat gry po kaflach w obu światach naraz: czy da się dojść do celu, ile obrotów trzeba, czy każde przejście ma parę |
| `npm run art:preview` | zapisuje do `art-template/preview/` PNG wszystkich arkuszy i każdego pokoju (Jawia nad Nawią) |
| `npm run art:export` | zapisuje arkusze 1:1 do `art-template/` jako szablony do przemalowania |
| `node tools/preview.ts <katalog> <skala> <fragment id>` | podgląd tylko pokoi, których id zawiera podany fragment |

Skróty w trybie deweloperskim (`npm run dev`):

- `http://localhost:5173/?room=barrow&world=nawia` – start od razu w danym pokoju i świecie (z pominięciem ekranu tytułowego),
- `window.__nawia` w konsoli przeglądarki to działająca `GameScene`: `__nawia.player`, `__nawia.room`, `__nawia.world`, `__nawia.state`.
  Bohatera można przestawić (`__nawia.player.x = ...`), uczynić nietykalnym (`__nawia.player.invuln = 9999`; wtedy mruga).

## 2. Mapa repozytorium

```
index.html              strona z jednym <div id="game">
src/
  main.ts               konfiguracja Phasera, skalowanie o całe piksele, odblokowanie dźwięku
  config.ts             rozdzielczość, kafel, typ World, strojenie (TUNE), warstwy rysowania (DEPTH)
  core/
    PixelBuffer.ts      mały programowy bufor pikseli; w nim powstaje cała grafika
    input.ts            klawiatura + gamepad sprowadzone do akcji, z buforem wciśnięć
    globalKeys.ts       wyciszenie, pełny ekran, zmiana języka
    rng.ts              deterministyczne losowanie (hash komórki, mulberry32)
  art/
    palette.ts          palety obu światów (loch) i kolory postaci (INK)
    sheet.ts            pomocnicze: siatka arkusza, sprawdzanie szerokości ASCII, płomień
    actors.ts           bohater, mieszkańcy, miecz, wrogowie, strażnik, pociski
    sprites.ts          rekwizyty lochu, łuk cięcia, cząsteczki, ikony HUD, mgła, poświata
    tiles.ts            zestaw kafli lochu (jeden układ, dwie palety)
    surface.ts          POWIERZCHNIA: palety, szum, stemple (drzewa, chata, studnia, płoty, głazy...)
    surfaceProps.ts     rekwizyty powierzchni, które są sprite'ami (drogowskaz, ognisko, garnek, bożek, brama)
    font.ts, title.ts   czcionka bitmapowa z polskimi znakami, obraz tytułowy
    textures.ts         most między buforami pikseli a teksturami Phasera; podmiana na PNG z /assets
  world/
    roomFormat.ts       format pokoju, parser, legenda znaków, klasa Dungeon (siatka pokoi)
    dungeonData.ts      wczytanie wszystkich plików pokoi przez Vite
    Level.ts            kolizje całego świata w obu światach naraz
    painter.ts          interfejs RoomPicture + wybór malarza + warstwa powidoku
    roomPainter.ts      malarz lochu: stemple z zestawu kafli
    surfacePainter.ts   malarz powierzchni: grunt liczony piksel po pikselu + stemple + warstwa nad głową
    rooms/*.room.txt    pokoje
  entities/             Player, Enemy, Boss, Shot, Prop
  fx/
    DualCanvas.ts       obraz pokoju w dwóch światach i pierścień, który zamienia jeden w drugi
    Lighting.ts         mapa światła liczona na CPU, mnożona przez obraz
    Fx.ts               cząsteczki
  ui/                   Hud (serca, kamień, dialog, podpowiedź), PixelText
  audio/audio.ts        cały dźwięk syntezowany w WebAudio
  i18n/strings.ts       teksty poza pokojami (PL/EN)
  scenes/               BootScene, TitleScene (+ intro), GameScene, EndScene
tools/                  check-rooms, preview, export-art, rooms (wczytywanie z dysku), png (zapis PNG)
docs/                   ten katalog
assets/                 pusty; PNG wrzucone tutaj zastępują generowane arkusze
art-template/           eksport arkuszy do przemalowania
.github/workflows/      build na każdy push; opcjonalnie wysyłka na itch.io
```

## 3. Zasady, na których stoi kod

- **320×180, kafel 16 px, ekran 20×11 kafli.** Gra jest powiększana wyłącznie o całkowitą liczbę pikseli urządzenia (`integerZoom` w `main.ts`).
  W grze nic nie jest skalowane ani obracane.
- **Moduły „czyste” nie znają Phasera ani DOM.** `core/PixelBuffer.ts`, `core/rng.ts`, `art/*` (poza `textures.ts`),
  `world/roomFormat.ts`, `world/Level.ts`, malarze – wszystko to działa też pod samym Node. Dzięki temu narzędzia w `tools/`
  importują ten sam kod, którego używa gra. Nie importuj Phasera w tych plikach.
- **TypeScript z `erasableSyntaxOnly`** i jawnymi rozszerzeniami `.ts` w importach. Node uruchamia pliki `.ts` bezpośrednio,
  więc niedozwolone są `enum`, `namespace` i pola-parametry konstruktora. Zamiast `enum` używamy obiektu `as const`.
- **Deterministyczna dekoracja.** Wszystko, co „losowe” w obrazie pokoju, bierze się z hasha współrzędnych globalnych
  (`hash2(gx, gy, sól)`), więc pokój wygląda zawsze tak samo, a wzory nie urywają się na granicy pokoi.
- **Strojenie w jednym miejscu.** Liczby od „feelu” są w `TUNE` (`config.ts`), liczby wrogów w tabeli `SPECS` (`entities/Enemy.ts`),
  powietrze miejsc (światło, mgła) w tabeli `DRESS` (`scenes/GameScene.ts`).

## 4. Od pliku do ekranu

```
*.room.txt ──parseRoom──▶ RoomDef ──▶ Dungeon (siatka pokoi)
                                         │
                      ┌──────────────────┼────────────────────┐
                      ▼                  ▼                    ▼
                   Level              paintRoom            GameScene.buildRoom
            (kolizje, 2 światy)   (RoomPicture: obrazy)   (wrogowie, rekwizyty, boss)
```

1. **`parseRoom`** (`roomFormat.ts`) czyta nagłówek (`room`, `at`, `name`, `biome`), mapę i bloki `sign`.
   Każdy znak mapy daje teren w Jawi i teren w Nawi (tabela `LEGEND`) oraz ewentualnie obiekt (`ObjectDef`).
2. **`Dungeon`** układa pokoje na siatce ekranów (`at: x,y`). Pokój może zajmować kilka pól. `terrainAt(world, gtx, gty)` i `charAt`
   odpowiadają na pytania o dowolny kafel świata, także poza bieżącym pokojem.
3. **`Level`** trzyma dla każdego pokoju dwie siatki flag (`BLOCK_WALK`, `BLOCK_FLY`). Woda blokuje chodzenie, ale nie lot.
   Rekwizyty blokują kafel w obu światach (`setBlocked`), bramy i słupy zmieniają to w trakcie gry.
   `move()` przesuwa pudełko oś po osi i dosuwa je do przeszkody; `findFree()` szuka najbliższego wolnego miejsca (używane przy obrocie).
4. **`paintRoom`** (`painter.ts`) wybiera malarza po biomie i zwraca `RoomPicture`: obraz pokoju w każdym świecie (`buffers`),
   opcjonalną warstwę nad głową (`overhead`), warstwę powidoku (`echo`) i metodę `animate(klatka)`.
5. **`GameScene.buildRoom`** tworzy z tego `ActiveRoom`: `DualCanvas` dla gruntu, drugi `DualCanvas` dla warstwy nad głową,
   wrogów, bossa, rekwizyty i serca.

### Dwa malarze

| | `RoomPainter` (loch, `biome: crypt`) | `SurfacePainter` (`biome: village` / `forest`) |
|---|---|---|
| Jak rysuje | stemple 16×16 z zestawu kafli + nakładki (cienie, fugi, brzegi) | grunt liczony dla każdego piksela, na nim stemple dowolnej wielkości |
| Skąd kształty | z sąsiedztwa kafli | z pól odległości: maska kafli jest rozmywana i odczytywana jako odległość od brzegu, plus szum; stąd zaokrąglone ścieżki i brzegi |
| Animacja | przemalowanie kafli wody i gwiazd | 4 gotowe klatki gruntu; ruszają się tylko piksele wody i gwiazd |
| Warstwa nad głową | brak | korony drzew, dach studni, końce palisady, śparogi chat |
| Podmiana na PNG | tak (`tiles_jawia.png`, `tiles_nawia.png`) | nie dla gruntu; tak dla sprite'ów (`surface.png`, `folk.png`) |

Kolejność pracy `SurfacePainter.paint(world)`:

1. **Rodzaj każdego kafla** (`kindAt`), z marginesem 3 kafli w głąb sąsiednich pokoi, żeby nic nie było ucięte na przejściu.
2. **Grunt**: dla każdego piksela odległość od wody, ścieżki i lasu → klasa piksela (trawa, ścieżka, woda, brzeg, runo, otchłań) i kolor.
3. **Źdźbła i kwiaty** na pikselach trawy.
4. **Stemple**: każdy stojący obiekt zgłasza zadanie rysowania i cień. Zadania są sortowane po `y` podstawy i rysowane od tyłu.
   Funkcja `place(stamp, bx, by)` dzieli stempel: wiersze wyżej niż 8 px nad podstawą trafiają do `overhead`, reszta do gruntu.
   To wystarcza, żeby bohater chował się za koroną drzewa, a stał przed pniem.
5. **Klatki**: jeśli w pokoju jest woda albo (w Nawi) gwiezdna otchłań, powstają 4 klatki gruntu.

W Nawi las otoczony ze wszystkich stron lasem nie jest rysowany wcale: zamiast niego jest otchłań z gwiazdami. To ta sama reguła,
co „poza murami nie ma ziemi” w lochu.

## 5. Obrót między światami

Logika i obraz są rozdzielone.

- **Logika jest natychmiastowa.** `GameScene.tryShift()` pyta `Level.findFree(drugi świat, pudełko bohatera, TUNE.shift.nudge)`.
  Jeśli jest miejsce (z dosunięciem do 5 px), w tej samej klatce zmienia się `this.world`: kolizje, wrogowie i sterowanie należą już do drugiego świata.
- **Obraz to pierścień.** Oba światy pokoju są namalowane z góry. `DualCanvas.reveal()` liczy dla każdego piksela odległość od bohatera
  (z lekkim falowaniem) i przez `TUNE.shift.revealTime` sekund składa na CPU: przed pierścieniem stary świat, za nim nowy, na krawędzi kolor świata.
  Rekwizyty, wrogowie i boss zmieniają wygląd w chwili, gdy pierścień przez nich przejdzie (`updateAtmosphere`).
- **Kara.** Gdy po drugiej stronie nie ma miejsca, `reject()` zabiera pół serca, pokazuje, które kafle przeszkadzały, i po `rejectTime`
  odstawia bohatera tam, gdzie wszedł do pokoju (`this.entry`), w świecie, w którym do niego wszedł.
- **Powidok** drugiej strony jest wyłączony (`TUNE.shift.afterimage = 0`). Kod został: wartość w sekundach włącza go z powrotem.

## 6. Pętla gry

`GameScene.update()`:

1. wejście (`input.update`), klawisze globalne, pauza;
2. *hit-stop*: po trafieniu świat stoi przez kilka klatek (`this.hitstop`), `dt = 0`;
3. stan gry: `play`, `slide` (przejazd kamery do sąsiedniego pokoju), `rejected` (kara za obrót), `dying`, `ending`, `paused`;
4. `updateAtmosphere`: animacja wody, pierścień, zmiana wyglądu obiektów, powietrze miejsca;
5. `hud.update`, `render` (wstrząs kamery, mapa światła, mgła).

`updatePlay()` w kolejności: obrót → bohater → trafienia miecza (`resolveAttack`) → wrogowie i kontakt z nimi → pociski → boss → słupy →
rekwizyty → serca → napis/rozmowa → wyjście z pokoju → podpowiedzi → kamera.

Pokój jest „załatwiony” (`checkCleared`), gdy zadzwonił jego mały dzwon albo, jeśli dzwonu nie ma, gdy nie został żaden wróg w żadnym świecie.
Wtedy otwierają się jego bramy i id pokoju trafia do `this.cleared` (do końca rozgrywki). Stan nie jest zapisywany na dysk.

Śmierć: bohater wraca tam, gdzie wszedł do pokoju, z pełnym zdrowiem; pokój buduje się od nowa.

## 7. Encje

| Plik | Co robi | Najważniejsze |
|---|---|---|
| `Player.ts` | ruch z przyspieszeniem, zamach, tarcza, odrzut | `box` (10×8 px u stóp), `attackBox()`, `blocks(skąd)`, `hurt/drain/heal/shove`, `sync()` |
| `Enemy.ts` | wszyscy zwykli wrogowie | tabela `SPECS`; maszyna stanów `roam → windup → dash → rest` (+ `rising` u strzygi); `home` = świat, w którym jest groźny i wrażliwy |
| `Boss.ts` | strażnik | stany `sleep, stalk, windup, charge, stunned, recover, dying`; kolejka `events`, którą scena zamienia na dźwięk i efekty |
| `Shot.ts` | ogień ognika, kule serca | `reflect()` odsyła do właściciela |
| `Prop.ts` | wszystko, co stoi i ma własne życie | `kind`, `open`, `solid`, `light()`, `setWorld()`; pod gołym niebem bierze klatki z arkusza `surface` (`applyOutdoors`) |

Wspólne zasady: pozycja encji to środek pudełka kolizji przy stopach; sprite ma punkt zaczepienia na dolnej krawędzi;
głębokość rysowania to `DEPTH.entities + y / 1000`, więc kto stoi niżej, ten zasłania.

Warstwy (`DEPTH`): obraz pokoju 0 → dekoracje podłogi 5 → encje 10+ → warstwa nad głową 200 → efekty 300 → światło 900 → mgła 910 → błysk 950.

## 8. Grafika w kodzie

- **`PixelBuffer`**: `set/get/plot`, `blit` (z alfą), `copy`, `flipH`, `rotateCW`, `outlined`, `scaled`. Kolor to liczba `0xAABBGGRR`; twórz go przez `rgb(0xRRGGBB)`.
- **Sprite z ASCII**: `fromAscii(art(16, [...wiersze]), paleta)`. `art()` sprawdza szerokość każdego wiersza i rzuca błąd przy literówce.
  Kropka to przezroczystość, każda inna litera to wpis w palecie.
- **Arkusz**: `grid(klucz, szer, wys, kolumny, klatki)` układa klatki na stałej siatce. Klucz arkusza to nazwa tekstury w Phaserze i nazwa pliku PNG.
- **`softOutline`** (`actors.ts`): postaci rysuje się z jednym ciemnym konturem (`o`), a ta funkcja barwi każdy piksel konturu kolorami, z którymi sąsiaduje.
- **Stemple powierzchni** (`surface.ts`): `foliage()` buduje koronę z kilku kul cieniowanych w 4 tonach, `tree()` dokleja pień,
  `oak/birch/spruce/bush/thicket/boulder/stump/well` zwracają `Stamp` (bufor + punkt podstawy). `grove(world)` trzyma gotową pulę
  drzew dla każdego świata, więc pokój buduje się szybko.
- **Dwa światy, jeden kod.** Każda funkcja rysująca dostaje paletę (`PAL[world]` w lochu, `SURF[world]` na powierzchni).
  Rampy idą od najciemniejszego `[0]`; indeks `[4]` to zawsze „najcieńsza, najjaśniejsza kreska”: refleks w Jawi, poświata w Nawi.

Rejestracja: `BootScene` woła `registerArt()` (`textures.ts`), które generuje arkusze albo bierze PNG o tej samej nazwie z `assets/`.

## 9. Światło, mgła, dźwięk, wejście, teksty

- **`Lighting`**: pełnoekranowa mapa światła 320×180 liczona co klatkę. Źródła (`LightSource`) dodają kolor w ditherowanych pasmach, całość jest
  mnożona przez obraz. `ambient` to kolor nieoświetlonej przestrzeni, `vignetteK` siła przyciemnienia rogów. Pod gołym niebem w Jawi `ambient` jest
  prawie biały, więc światło nic nie zmienia (jest dzień).
- **`DRESS`** (`GameScene.ts`): dla pary (loch / powierzchnia, świat) podaje `ambient`, światło bohatera, mgłę i winietę. Wartości płynnie dążą do celu.
- **`Fx`**: emitery cząsteczek (`shiftBurst`, `hit`, `death`, `debris`, `block`, `pickup`, `reject`) i tło pokoju (`setAmbience`: kurz, iskry Nawi, pyłki na powierzchni).
- **`audio`**: jeden obiekt, `audio.sfx('nazwa')`, `startAmbience()`, `setWorld()`. Wszystko syntezowane, bez plików. Nowy efekt to nowy `case` w `sfx()` i wpis w typie `Sfx`.
- **`input`**: akcje `shift, attack, shield, pause, mute, fullscreen, lang`. `input.consume(akcja, bufor)` zwraca `true` raz na wciśnięcie
  (z buforem w sekundach), `input.isDown(akcja)`, `input.moveX/moveY`, `input.device`. Mapowanie klawiszy i pada jest na górze `core/input.ts`.
- **Teksty**: poza pokojami w `i18n/strings.ts` jako pary `{ pl, en }`; w pokojach w blokach `sign`. `t(para)` wybiera bieżący język.

## 10. Przepisy

### Nowy pokój

1. Skopiuj dowolny plik z `src/world/rooms/`, zmień `room:` (unikalne id), `at:` (wolne pole siatki), `name:` i `biome:`.
2. Narysuj mapę 20×11 (albo wielokrotność). Przejście to chodliwy kafel na krawędzi; sąsiad musi mieć chodliwy kafel naprzeciwko.
3. `npm run rooms:check` – powie, czy przejścia mają pary i czy do pokoju da się dojść.
4. `node tools/preview.ts /tmp/podglad 3 <id>` – obraz pokoju w obu światach bez uruchamiania gry.
5. `http://localhost:5173/?room=<id>` – wejście prosto do pokoju.

### Nowy wróg

1. `roomFormat.ts`: dopisz nazwę do `EnemyKind`, znak do `LEGEND` i gałąź w `parseRoom`.
2. `Enemy.ts`: wpis w `SPECS` (świat, zdrowie, prędkość, zasięg wzroku, maska kolizji, czasy zamachu/skoku/odpoczynku).
   Jeśli zachowuje się inaczej niż „podejdź, ostrzeż, skocz”, dopisz gałąź w `update()` (wzór: krążenie zjawy, strzał ognika).
3. `actors.ts`: trzy klatki 16×16 (dwie spoczynku, atak), indeks w `MOB`, wiersz w `mobSheet()`.
4. Dopisz znak do legendy w `docs/ROOMS.md`.

### Nowy element krajobrazu na powierzchni (namalowany)

1. `roomFormat.ts`: znak w `LEGEND` z terenem w obu światach (zwykle `WALL`/`WALL`).
2. `surfacePainter.ts`: nowy rodzaj w `K`, gałąź w `kindAt()`, zadanie rysowania w kroku 4 (`shadeEllipse` + `place`).
3. `surface.ts`: funkcja zwracająca `Stamp` albo rysująca w miejscu; jeśli stempel się powtarza, dodaj go do `Grove`.

### Nowy rekwizyt (sprite z zachowaniem)

1. `roomFormat.ts`: wariant w `ObjectDef`, znak w `LEGEND`, gałąź w `parseRoom`.
2. `Level.ts`: czy blokuje (lista wyjątków w konstruktorze).
3. `Prop.ts`: `PropKind`, klatki w `apply()` (i `applyOutdoors()`), ewentualnie `light()` i `solid`.
4. Klatka w `sprites.ts` (`OBJ`) lub `surfaceProps.ts` (`SOBJ`).
5. Interakcje w `GameScene` (np. `resolveAttack`). Jeśli blokuje, dopisz go do listy `blocked` w `tools/check-rooms.ts`.

### Nowy mieszkaniec

W pliku pokoju: cyfra na mapie i blok `sign N:` z linią `look: herbalist|elder|woman|child`. Nowy wygląd to wpis w `NpcLook` (`roomFormat.ts`),
dwie klatki w `folkSheet()` i indeks w `FOLK` (`actors.ts`).

### Trudność

- bohater i obrót: `TUNE.player`, `TUNE.shift` (`config.ts`),
- wrogowie: `SPECS` (`Enemy.ts`); najmocniej działają `windup` (czas ostrzeżenia), `dash`, `cooldown`,
- strażnik: `TUNE.boss` (trzy wartości na fazę).

## 11. Sprawdzanie zmian

Automatycznie sprawdzane są tylko typy i przechodniość świata (`npm run build`). Testów jednostkowych nie ma.
Reszta to gra ręką albo skrypt sterujący przeglądarką (Playwright + Chromium bez okna, klawisze i zrzuty ekranu, stan czytany z `window.__nawia`).
Taki skrypt nie jest częścią repozytorium. Dźwięku i pada nie da się nim sprawdzić.

## 12. Build i wdrożenie

`.github/workflows/deploy.yml` uruchamia `npm run build` na każdy push do `main` i zapisuje `dist/` jako artefakt.
Jeśli repozytorium ma sekret `BUTLER_API_KEY` i zmienną `ITCH_TARGET` (np. `uzytkownik/nawia`), build trafia na itch.io do kanału `html5`.
Na itch.io projekt ma być typu „HTML”, z oknem 960×540 (albo inną wielokrotnością 320×180) i przyciskiem pełnego ekranu.

## 13. Znane ograniczenia

- Loch i powierzchnia są malowane dwiema technikami i różnią się poziomem szczegółu. Loch jest starszy (stemple z kafli).
- Gruntu powierzchni nie da się podmienić plikiem PNG; arkusze sprite'ów tak.
- Wrogowie i mieszkańcy mają jeden kierunek patrzenia; mieszkańcy stoją w miejscu.
- Dźwięk jest w całości syntezowany, a powierzchnia nie ma własnego tła dźwiękowego.
- Brak zapisu stanu gry: po odświeżeniu strony zaczyna się od wioski.
- Paczka JS ma ok. 1,5 MB (Phaser).
- W repozytorium nie ma pliku licencji.
