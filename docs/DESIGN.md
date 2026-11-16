# NAWIA – projekt gry

Gra akcji z widokiem z góry na GitHub Game Off 2026 (temat: **SHIFT**, termin: 1 grudnia 2026).
Jeden przycisk przełącza między dwoma nałożonymi na siebie światami. Docelowo 15–30 minut gry.

Szczegóły techniczne są w [DEVELOPER.md](DEVELOPER.md), format pokoi w [ROOMS.md](ROOMS.md), grafika w [ART.md](ART.md),
a pisanie rozmów w [DIALOGS.md](DIALOGS.md).

| Jawia | Nawia |
|---|---|
| ![Wieś w Jawi](img/village-jawia.png) | ![Wieś w Nawi](img/village-nawia.png) |

| Izba, w której zaczyna się gra | Kurhan: serce skazy |
|---|---|
| ![Izba](img/home.png) | ![Kurhan ze skazą](img/barrow-blight.png) |

## Filary

1. **Feel przed zawartością.** Bohater reaguje od razu, cios ma ciężar (zatrzymanie klatek, wstrząs, odrzut), obrót świata jest natychmiastowy.
2. **Dwa światy, jedna mapa.** Każde miejsce istnieje w Jawi i w Nawi, ale nie tak samo. Zagadki biorą się z różnic.
3. **Pokoju trzeba się nauczyć.** Nic na ekranie nie pokazuje drugiej strony. Obrót w złym miejscu kosztuje.
4. **Jakość ponad ilość.** Mało lokacji, każda dopracowana.
5. **Od wesołej wsi do skazy.** Gra zaczyna się pogodnie: poranek, kury, malwy. Zło pojawia się dopiero w głębi lasu
   i narasta z każdym pokojem. Kontrast jest częścią opowieści.
6. **Potwory mają być straszne, nie śmieszne.** Zwieszona głowa, długie ręce, same światła zamiast oczu.
7. **Mała postać, piękny piksel.** Wzorcem wielkości i rzemiosła są 16-bitowe gry przygodowe z widokiem z góry: postać
   szeroka na jeden kafel, wysoka na jeden albo półtora, 15 kolorów, jeden ciemny kontur. Potwory mają od jednego do dwóch kafli
   wysokości. Ostateczny wybór zapada na placu prób ([PLAYGROUND.md](PLAYGROUND.md)).
8. **Słowiańszczyzna.** Świat, stwory i wierzenia biorą się z mitologii słowiańskiej i z pomysłów autora gry:
   przygoda z kluczami, bramami i dwoma światami, ale w krainie utopców, strzyg, leszego i południcy.

## Świat

- **Jawia** – tu i teraz, świat żywych. Na powierzchni jasny poranek; pod ziemią mokra ruina oświetlona ogniem.
- **Nawia** – świat duchów: to samo miejsce, jakim pamiętają je umarli. Ciemne powierzchnie, świecące krawędzie, zamiast ziemi poza światem gwiazdy.

Dzwon Budzisław w zatopionym Zwonigrodzie milczy od lat, więc umarli nie odchodzą, a granica pęka. Imiona, istoty i mity
są w [nawia-lore.md](nawia-lore.md).

**Fabuła dema.** W nocy strzyga przyszła od strony kurhanu i wyprowadziła Dobrawę, siostrę bohatera. Dobrawa szła za nią
boso, jak we śnie, a strzyga zaniosła ją pod ziemię, do Zwonigrodu. Rano Sambor, uczeń starej zielarki Radochny, budzi się
w izbie bez niczego: bez miecza, tarczy i kamienia.
- Przy pustym łóżku widać mokre ślady, a w Nawii siedzi tam cień matki.
- We wsi Staś opowiada, co widział: wysoką, zgiętą postać z włosami na twarzy i ptasimi stopami. Sulichna posyła Sambora do
  starego Racibora.
- Dziad Racibor daje mu swój miecz i tarczę ojca. Mówi mu, że strzyga ma dwie dusze, i posyła po kamień do Radochny.
- Radochna, zgryźliwa, daje kamień tylko komuś z bronią: kurzego boga, kamień z dziurą z dna Głuchego Jeziora. Mówi, jak
  uratować Dobrawę: rozkołysać Budzisława, bo kiedy granica się zamknie, co żywe, wróci na swoją stronę. Dodaje: „Kiedy
  będziecie wracać, nie oglądaj się”.
- Dalej droga wiedzie przez las do kurhanu i w dół, do grodu. Po drodze są ślady Dobrawy: przy kurhanie mówią o niej umarli,
  a w Przedsionku na kamieniu leży jej czerwona wstążka.
- W Sali Dwóch Dusz czekają strzygi, a niżej strażnik granicy. Po uderzeniu w wielki dzwon Dobrawa budzi się na brzegu
  jeziora, a dusze grodu odlatują do Wyraju jako żurawie.

**Skaza.** Tam, gdzie granica pęka, Nawia przecieka do Jawi. Widać to jako fioletowe plamy na ziemi, martwe drzewa i cierń.
Przy wsi las jest zdrowy; im bliżej kurhanu, tym skazy więcej i tym ciemniejsze powietrze.
Co skaza dotknie, dziczeje: stąd wilki o oczach w kolorze drugiej strony i kwiaty, które plują cierniami.

Teksty powierzchni są już z prawdziwego scenariusza pierwszego zadania (`src/story/village.dialog.txt`); napisy w grodzie
są jeszcze w większości robocze.

Bohater: Sambor, 18–20 lat, z mieczem i okrągłą tarczą (od Racibora). Łuk jest planowany, jeszcze go nie ma.
W grze nosi wygląd **C2f** (16×18) z placu prób. Klawisz **H** przełącza go na **S3 Malowany** (16×16), żeby porównać.
Kolizja jest u stóp i w obu wyglądach taka sama (10×8 px); wyższa postać tylko więcej zasłania.
Dawne wyglądy (Wojak, Pastuszek, Góral, Wędrowiec) zostały w kodzie i na placu prób (G1–G4).

Przeciwnicy noszą w grze nowe wyglądy z placu prób (M): wilk M1, dzik M2, topielec M5, zjawa M9, strzyga M11, ognik M13,
morownik M14. Każdy jest widziany w postaci świata, w którym jest bohater. Topielec w Jawi to mokry czarny kot, a z Nawii widać
jego prawdziwą postać. Strzyga w Jawi to ciało, a w Nawii jej druga dusza. Klawisz **B** przywraca dawne wyglądy.
Strażnik (boss) ma swój dawny wygląd.

## Sterowanie

| | Klawiatura | Gamepad |
|---|---|---|
| Ruch | WASD / strzałki | lewa gałka / krzyżak |
| Obrót kamienia | **Shift** lub Spacja | Y, lewy bumper, lewy spust |
| Cios | Z, J lub Enter | A, X |
| Tarcza (trzymaj) | X lub K | B, prawy bumper, prawy spust |
| Unik (podskok) | C, I lub lewy Alt | X |
| Rozmowa (obok mieszkańca) | Z, J lub Enter | A |
| Pauza | Esc / P | Start |
| Wyciszenie / pełny ekran / język | M / F / L | |
| Wygląd bohatera: C2f albo S3 (na czas testów) | H | |
| Wygląd przeciwników: nowe albo dawne (na czas testów) | B | |

Napisy na kamieniach i drogowskazach czytają się same, gdy bohater stanie obok. Rozmowę z mieszkańcem zaczyna klawisz ciosu.
W rozmowie: góra/dół wybiera odpowiedź, klawisz ciosu albo Shift potwierdza.

Do chat wchodzi się, po prostu wchodząc w otwarte drzwi.

## Mechaniki

**Obrót.** Natychmiastowy. Po obrocie krótka przerwa (0,22 s), zanim można obrócić ponownie.

**Granica karze.** Obrót tam, gdzie po drugiej stronie coś stoi (mur, drzewo, woda), zabiera pół serca i odstawia bohatera
do miejsca, którym wszedł do pokoju. Gra pokazuje przez chwilę, które kafle przeszkadzały.

**Co się różni między światami:**

| | W Jawi | W Nawi |
|---|---|---|
| to, co postawili lub zaniedbali żywi (gruz, płot, ciernie, kładka z desek) | jest | nie ma |
| to, co pamiętają umarli (stary mur, ścięte drzewo, stary most) | nie ma (zostają kikuty, pniaki) | jest |
| wrogowie | groźni i wrażliwi tylko w swoim świecie; z drugiej strony widać echo | |
| mieszkańcy wsi, kury | żyją swoim życiem | ledwie widoczne echo |
| dusze | nie widać ich (pod ziemią kości, na powierzchni gęściej rosną białe kwiaty) | stoją |

**Przedmioty.** Gra zaczyna się bez niczego. Miecz i tarczę daje Racibor, a kurzego boga Radochna. Bez miecza klawisz ciosu
tylko zaczyna rozmowę, bez tarczy nie ma gardy, a bez kamienia nie ma obrotu. Pierwsze miejsce, gdzie trzeba obrócić świat,
to most na skraju wsi, więc bez kamienia nie da się wyjść do lasu.

**Unik.** Krótki podskok w stronę, w którą bohater idzie (albo patrzy, jeśli stoi): około 50 px w ćwierć sekundy. Przez
pierwsze 0,22 s nic go nie rani, ani cios, ani pocisk. Potem jest krótka przerwa (0,45 s). Unik nie przeskakuje wody ani
przepaści: kolizja działa jak w marszu. Liczby: `dodge*` w `TUNE.player` (`src/config.ts`). To próba: dobry unik zależy od
wielkości bohatera i jego kolizji, więc wróci przy wyborze ostatecznej postaci.

**Walka.** Zdrowie: 3 serca liczone połówkami. Cios wroga zabiera całe serce, pocisk pół. Miecz ma krótki zamach z wypadem.
Podniesiona tarcza zatrzymuje cios od frontu i odsyła ogień ognika. Każdy wróg ostrzega przed atakiem (mruga na biało i drży), potem atakuje po prostej.

**Bramy.** Otwierają się, gdy w pokoju zapadnie cisza po obu stronach (nie ma wrogów w żadnym świecie) albo gdy zadzwoni mały dzwon.

**Śmierć.** Bohater wraca tam, gdzie wszedł do pokoju, z pełnym zdrowiem. Pokój zaczyna się od nowa.

## Wrogowie

| Wróg | Świat | Zdrowie | Zachowanie | Jak go pokonać |
|---|---|---|---|---|
| Utopiec | Jawia | 3 | podchodzi, przykuca, skacze po prostej | zejść z linii albo przyjąć na tarczę, potem cios |
| Zjawa | Nawia | 2 | krąży, potem przelatuje przez bohatera; lata nad wodą i otchłanią | tarcza w jej stronę, cios po przelocie |
| Ognik | Jawia | 1 | wisi nad wodą i pluje ogniem | tarcza odsyła mu jego własny ogień |
| Strzyga | oba | 3 + 3 | szybka, kluczy i skacze; zabita w Jawi wstaje w Nawi | pójść za nią na drugą stronę |
| Dzik | Jawia | 3 | grzebie racicą, potem szarżuje daleko po prostej | zejść z linii; gdy wpadnie na ścianę albo drzewo, długo stoi ogłuszony |
| Wilk (skażony) | Jawia | 2 | krąży po ziemi jak zjawa w powietrzu, skacze, odskakuje | tarcza w jego stronę, cios zaraz po skoku; zwykle są dwa |
| Morownik (kwiat skazy) | Jawia | 2 | nie rusza się; otwiera się i pluje trzema cierniami w wachlarzu | podejść między salwami i ciąć; tarcza zatrzymuje ciernie |
| Strażnik (boss) | granica | 9 | w Jawi kamień, którego stal nie rani; w Nawi serce w skorupie | sprowokować szarżę w ścianę lub gruz, obrócić kamień i bić w odsłonięte serce (3 ciosy na ogłuszenie, 3 fazy) |

Liczby: tabela `SPECS` w `src/entities/Enemy.ts` i `TUNE.boss` w `src/config.ts`.

## Przebieg gry

Mapa świata (każde pole to jeden ekran; strzałki pokazują kolejność):

```
Izba ⇄ Wieś ⇄ Chata zielarki          (⇄ to drzwi)
          │
          └──► Skraj wsi
             │
             ▼
      Stary gościniec ──► Uroczysko (opcjonalne)
             │
             ▼
          Kurhan
             │
             ▼
       Przedsionek ──► Zerwany most ──► Krypta            Wielki Dzwon
                                          │                    ▲
                                          ▼                    │
       Mały dzwon ◄──── Ulica (2 ekrany) ─┘                 Strażnik
             │                                                 ▲
             ▼                                                 │
          Topiel ──► Słońce i Księżyc ──► Kładki ──► Sala Dwóch Dusz
```

**Kształt gry.** Wieś i Skraj wsi są spokojne. Stary gościniec uczy walki (jeden dzik), potem po jednym potworze na
świat. Kurhan to pierwsza arena i sprawdzian powierzchni: dwie fale. Przedsionek to oddech (żadnych potworów,
naczynie z sercem). W grodzie trudność rośnie: most i ulica to korytarze pod naciskiem, krypta to arena z dwiema
falami, Topiel to egzamin z tarczy, Słońce i Księżyc oraz Kładki to zagadki z jednym strażnikiem lub dwoma,
Sala Dwóch Dusz to szczyt (trzy fale strzyg), a Strażnik zamyka grę. Areny (`lock: yes`) zamykają za bohaterem
wyjścia, dopóki nie padnie wszystko w obu światach; zagadki i korytarze się nie zamykają.

### Powierzchnia: nauka

| Pokój | Plik | Czego uczy |
|---|---|---|
| **Izba** | `h1-home` | Początek gry: bohater otwiera oczy we własnej izbie, bez niczego. Ruch. Puste łóżko Dobrawy mówi, co się stało; w Nawii siedzi przy nim cień matki. |
| **Wieś** | `s1-village` | Rozmowy i drzwi. Nic tu nie rani: kury, stóg, malwy, ule. Staś widział strzygę, Sulichna posyła do Racibora, Racibor daje miecz i tarczę. Pod lipą stoją umarli (widać ich po obrocie). Ogródek za płotem jest dostępny tylko z Nawi. |
| **Chata zielarki** | `h2-hut` | Radochna daje kurzego boga (tylko komuś z bronią) i mówi, jak uratować Dobrawę. Rozmowa z wyborem. |
| **Skraj wsi** | `s2-shrine` | Pierwszy obrót, który jest potrzebny: kładki nie ma, stary most stoi tylko w Nawi. Drogowskaz stoi na ścieżce przy brzegu, więc czyta się go przed wodą. Obrót z powrotem na moście to pierwsze spotkanie z karą. Bożek, przed nim ogień. |
| **Stary gościniec** | `s3-forest-road` | Pierwsza walka, jeszcze z niczym nienaturalnym: dzik na polanie nad rzeką. Polana ma cztery rzędy, więc szarża zawsze kończy się na czymś: na głazie pośrodku, na głazie pod lasem, na cierniach albo w rzece. Stanąć przed głazem, odskoczyć, bić ogłuszonego. Potem zapora z dwóch warstw: ciernie skazy blokują w Jawi, a deski na strudze są tylko w Jawi; drogowskaz stoi tam, gdzie ścieżka wchodzi w ciernie. Za cierniami skaza, po jednym potworze na świat: zjawa w Nawi, morownik w Jawi z kładką w zasięgu. Nic tu nie zamyka drogi. |
| **Uroczysko** | `s4-forest-pond` | Opcjonalne. Tarcza: brama otwiera się po zabiciu dwóch ogników nad wodą (miecz ich nie sięga) i morownika na brzegu. Zachodni koniec brzegu jest poza zasięgiem morownika: tam uczy się odsyłać ogień. Na wschodzie drugi ognik i ciernie lecące wzdłuż brzegu, z boku. Za bramą stary most na wyspę (tylko w Nawi), na wyspie serce. |
| **Kurhan** | `s5-barrow` | Serce skazy i sprawdzian, pierwsza arena: za bohaterem zamykają się wrota palisady. Fala 1 to sfora: dwa wilki z dwóch stron w Jawi i zjawa w Nawi. Fala 2 to nowy nacisk z dwóch stron: dzik z północnego zachodu, morownik na kopcu na północnym wschodzie i druga zjawa z czarnej wody. Cztery głazy wokół ścieżki to wszystko, czego trzeba: dzik się o nie rozbija, a za nimi nie dolecą ciernie. Ciernie i pamiętane drzewa (w Jawi pniaki) dają polanie inny kształt po każdej stronie. Garnek przy gąszczu ma serce. Umarli mówią tu o Dobrawie. |

### Gród: sprawdzian

| Pokój | Plik | O co chodzi |
|---|---|---|
| Przedsionek | `01-threshold` | oddech po kurhanie: żadnych potworów, naczynie z sercem; powtórka z obrotu w kamieniu w obie strony (gruz w Jawi, stary mur w Nawi). Czerwona wstążka Dobrawy na kamieniu |
| Zerwany most | `02-bridge` | kładka tylko w Jawi, stary most tylko w Nawi; kamienne filary to jedyne miejsca, gdzie obrót jest bezpieczny. Każde przejście ma strażnika w swoim świecie: utopiec na drugim filarze schodzi po kładce (na desce nie ma gdzie uskoczyć ani obrócić kamienia, zostaje tarcza), zjawa ze wschodniego brzegu wylatuje nad wodę na ostatni odcinek mostu |
| Krypta | `03-crypt` | arena, dwie fale. Fala 1: dwa utopce w Jawi z dwóch stron i zjawa w Nawi. Fala 2: nad kośćmi na północy i południu wstają ogniki (nad posadzką, więc miecz je sięga), przy wschodniej ścianie trzeci utopiec, w Nawi zjawa w kącie przy wejściu. Cztery kamienne bloki zasłaniają przed ogniem i zatrzymują skok. Krata w dół otwiera się, gdy ucichną obie strony |
| Ulica | `04-street` | korytarz na dwa ekrany: gruz i kładka w Jawi, brama grodu i stary most w Nawi; każde przejście wymaga drugiej strony i na każdym coś czeka: dwa utopce na placu, ognik nad zalaną ulicą strzela do idącego po kładce, zjawa zamknięta w bramie grodu (tam trzeba obrócić kamień), druga na zachodnim brzegu nad starym mostem |
| Mały dzwon | `05-bell` | dzwon otwiera kratę w dół i sam załatwia pokój. Na wyspę prowadzą kładka (Jawia, pilnuje jej utopiec) i stary most (Nawia, pilnuje go zjawa). Naczynie przy wejściu ma serce |
| Topiel | `06-pool` | egzamin z tarczy: krata otwiera się po zabiciu trzech ogników nad wodą (z północy, z południowego zachodu i z południowego wschodu); utopiec obchodzi staw od bramy i zmusza do opuszczenia tarczy, w Nawi czeka zjawa. Stara kładka (Nawia) prowadzi do serca |
| Słońce i Księżyc | `07-sunmoon` | kamień uderzony mieczem zamienia miejscami dwa rodzaje słupów; trzeba go uderzyć z właściwej strony muru, a napis już tego nie podpowiada. W północnej komnacie, do której wchodzi się tylko w Nawi, mieszka zjawa: walka w ciasnocie, wśród kafli, na których nie wolno obrócić kamienia |
| Kładki | `08-crossings` | skrzyżowań kładki i mostu nie widać: czysta pamięć. Napis nie liczy już skrzyżowań. Dwa ogniki strzelają do idącego po kładkach, zjawa ze wschodniego brzegu do idącego mostem |
| Sala Dwóch Dusz | `09-souls` | szczyt przed strażnikiem, arena z trzema falami: jedna strzyga (nauka: zabić ciało, pójść za duszą), strzyga i zjawa czekająca w Nawi, dwie strzygi z przeciwnych rogów. Hala jest czytelna: aleja `,` (bezpieczna w obu światach) na krzyż, kolumny w obu światach, gruz tylko w Jawi, dwa rzędy starych murów tylko w Nawi. Naczynie z sercem; serce przy bramie jest na to, co dalej |
| Strażnik | `10-guardian` | boss, którego trzeba pokonać w obu światach; arena (kraty spadają, gdy bohater wejdzie). Naczynie w rogu ma serce: jedną pomyłkę więcej przy każdej próbie |
| Wielki Dzwon | `11-greatbell` | zakończenie |

`npm run rooms:check` podaje dla każdego celu najmniejszą liczbę obrotów. Dziś: mały dzwon 9, kamień słońca i księżyca 9, wielki dzwon 14
(licząc od wioski; kraty uznawane są za otwarte, wrogowie pomijani). Czy każdą arenę da się załatwić (czy potwory
z fal mają gdzie stać), sprawdza się na razie okiem: zasady w [ROOMS.md](ROOMS.md), „Arena: `lock` i fale”.

## Zasady projektowania pokoi

- Pokój ma jeden pomysł. Jeśli wprowadza coś nowego, wprowadza to bezpiecznie, zanim tego zażąda.
- Różnice między światami mają mieć ślad w obrazie: ścieżka wchodzi pod ciernie („droga biegnie dalej, tylko nie tutaj”),
  po ściętym drzewie zostaje pniak, po starym murze kikuty.
- Ścieżka (`,`) istnieje w obu światach: to bezpieczny grunt i nić przewodnia.
- Brama potrzebuje ciszy po obu stronach, więc pokój z bramą wymusza walkę w obu światach.
- Walka odbywa się na otwartej przestrzeni; korony drzew zasłaniają bohatera i wrogów.

## Co dalej

Pomysły w kolejności, w jakiej wydają się warte zrobienia przed terminem:

1. Wybór na placu prób: wysokość bohatera (16×16 czy 16×24), kostium, które potwory, nastrój scenerii.
   Potem przeniesienie wybranych postaci do gry (klatki ciosu i gardy, ataki potworów).
2. Scenariusz: prawdziwe teksty rozmów w miejsce roboczych; rozmowy, które coś zmieniają w świecie.
3. Przemalować gród w tym samym stylu co powierzchnię (dziś loch jest w starszej technice).
4. Dźwięk powierzchni: gra tam jedna melodyjka wsi, z przerwami, i nic ciągłego; przy gęstej skazie i w Nawi milknie. Las nie ma własnej melodii. Jeśli ma dojść coś jeszcze, to oszczędnie (ptaki, woda), nie w pętli.
5. Łuk: strzał przez wodę i otchłań, przełączniki na odległość.
6. Leszy jako pan skażonego lasu (mini-boss przed kurhanem).
7. Balans po grze ręką: dziś trudność znana jest tylko z liczb.
