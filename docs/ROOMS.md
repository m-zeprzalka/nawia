# Format pokoi

Jeden plik = jeden pokój = **oba światy naraz**. Pliki leżą w `src/world/rooms/` i mają rozszerzenie
`.room.txt`. Gra wczytuje wszystkie automatycznie (kolejność i nazwa pliku nie mają znaczenia), a `npm run dev`
odświeża grę po zapisaniu pliku. Pliki `h1`–`h2` to izby, `s1`–`s5` powierzchnia, `01`–`11` gród.

```
// komentarz (zaczyna się od //, bo # to ściana)
room: shrine                          <- unikalne id
biome: village                        <- village | forest | house | crypt (domyślnie crypt)
blight: 0                             <- skaza 0–3 (tylko village i forest; domyślnie 0)
at: 0,-3                              <- pozycja w siatce świata, w "ekranach" (x,y); mogą być ujemne
name: Skraj wsi | The Edge of the Village   <- polski | angielski
lock: yes                             <- arena: wyjścia zamykają się za bohaterem (domyślnie no)

map:
####################
#t...~~~...t..."..##
,,,,,:::,,,,,,,....#
#.1..~~~....,..b...#
#FFFF~~~~FFFGFFFFFF#

wave 2: d 5,2; p 16,3; z 17,7         <- druga fala potworów: litera, kolumna,wiersz (od zera)
wave 3: x 3,8; x 16,2                 <- trzecia fala (kolejne numery po kolei)

sign 1:
  jawia: Tekst widoczny w Jawi. | English text.
  nawia: Tekst widoczny w Nawi. | English text.

door 4: home                          <- cyfra 4 na mapie to drzwi do pokoju "home"
```

- Mapa ma **20 × 11 kafli** (jeden ekran) albo wielokrotność. Większy pokój zajmuje kilka pól siatki,
  a kamera jeździ za bohaterem w jego granicach (przykład: `04-street.room.txt`, 40 × 11).
- Blok `map:` kończy się pustą linią.
- **Przejście do sąsiedniego pokoju** to po prostu chodliwy kafel na krawędzi mapy. Sąsiad musi mieć chodliwy kafel
  w tym samym miejscu po swojej stronie.
- **Biom** decyduje tylko o wyglądzie, muzyce i o tym, kto maluje pokój (patrz [DEVELOPER.md](DEVELOPER.md), „Trzej malarze”).
  Zasady gry są wszędzie te same.
- **Skaza** (`blight`) to ile fioletu wpełzło do pokoju: 0 czysto, 1 pierwsze plamy, 2 gęsto (melodia milknie), 3 serce skazy.
  Przy krawędzi pokoju malarz uśrednia ją z sąsiadem z góry i z dołu, więc przejście jest płynne.
- **Drzwi** to cyfra z blokiem `door N: <id pokoju>`. Pokój po drugiej stronie musi mieć drzwi prowadzące z powrotem.
  Na dworze cyfrę wstawia się w dolny rząd prostokąta chaty (zamiast `H`); w izbie w dolną ścianę.

### Arena: `lock` i fale

- **`lock: yes`** w nagłówku robi z pokoju arenę. Gdy bohater odejdzie od wejścia (przestanie stać na kaflu krawędzi),
  na **każde** wyjście z pokoju spadają kraty (w lochu) albo wrota palisady (na powierzchni). Wyjście to każdy kafel
  krawędzi mapy, na którym da się stanąć choć w jednym świecie; zwykła brama `G` na krawędzi zostaje bramą.
  Kraty podnoszą się, gdy pokój jest „załatwiony”: nie żyje nic w żadnym ze światów i nie czeka już żadna fala
  (albo zadzwonił mały dzwon). Załatwiony pokój zostaje załatwiony: po powrocie kraty już nie spadają.
  Śmierć zaczyna pokój od nowa, razem z falami i kratami.
- **Fale.** Potwory narysowane na mapie to fala 1. Linie `wave 2: ...`, `wave 3: ...` pod mapą (numery po kolei)
  mówią, co wstaje potem: `<litera> <kolumna>,<wiersz>` rozdzielone średnikami, kolumny i wiersze liczone od zera,
  litery jak na mapie: `u z f x d v p`. Gdy zginie wszystko z bieżącej fali (w obu światach), po chwili oddechu
  następna fala wychodzi z ziemi w podanych miejscach. Ognik nad wodą to w fali po prostu `f` na kaflu wody
  (litera `w` jest tylko na mapie).
- Fale nie potrzebują `lock`, ale bez krat bohater może z pokoju wyjść, a po powrocie pokój zaczyna się od nowa.
- Nic nie sprawdza, czy potwór z fali ma gdzie stać: chodzący (`u x d v p`) muszą stać na kaflu, po którym da się
  chodzić w ich świecie (Jawia: `.` `,` `N` `=` `+`; nie `J`), zjawa na kaflu wolnym w Nawi (także `J` i woda, nie `N`),
  ognik gdziekolwiek poza murem w Jawi. `npm run rooms:check` bram, krat i potworów nie widzi.

## Legenda: teren

Jeden znak opisuje, czym kafel jest w Jawi i czym w Nawi. Te znaki działają w każdym biomie; różni się tylko to, jak wyglądają.

| Znak | Jawia | Nawia | W lochu wygląda jak | Na powierzchni wygląda jak |
|---|---|---|---|---|
| `#` | blokuje | blokuje | mur | gęsty las (w Nawi głębiej: gwiezdna otchłań) |
| `.` | można stać | można stać | posadzka | trawa |
| `,` | można stać | można stać | ozdobna posadzka | wydeptana ścieżka |
| `~` | woda | otchłań | woda / otchłań | rzeka, staw / otchłań |
| `J` | **blokuje** | można stać | gruz | wieś: pleciony płot; las: ciernie |
| `N` | można stać | **blokuje** | resztki muru / stary mur | pniak / drzewo, które umarli pamiętają |
| `=` | **kładka** | woda | deski | deski |
| `:` | woda | **most** | stary most | stary most |
| `+` | most | most | most | most |
| (spacja) | pustka | pustka | | las |

## Legenda: tylko powierzchnia

Krajobraz. Blokuje w obu światach (poza kwiatami i schodami) i jest malowany, nie jest sprite'em.

| Znak | Co to |
|---|---|
| `t` | pojedyncze drzewo (pień blokuje, pod koroną da się przejść i bohater się za nią chowa) |
| `O` | wielkie stare drzewo |
| `H` | chata: prostokąt z liter `H`; dolny rząd to ściana frontowa, reszta to dach |
| `D` | drzwi chaty: jedna litera w dolnym rzędzie prostokąta |
| `W` | studnia |
| `R` | głaz |
| `F` | palisada (ostrokół) |
| `b` | krzak |
| `S` | stóg siana |
| `U` | ul z kłody |
| `M` | malwy (dobrze wyglądają przy ścianie chaty) |
| `"` | łąka: gęsto kwiaty (można stać) |
| `^` | schody w dół (można stać); ciemnieją ku dołowi ekranu |

## Legenda: wnętrze chaty (`biome: house`)

Cała mapa poza izbą to `#`. Rząd ściany bezpośrednio nad podłogą pokazuje lico i tylko w nim mają sens `W`, `F`, `M`.
Te same litery znaczą na dworze co innego (kolumna „na dworze” dla przypomnienia).

| Znak | W izbie | Na dworze |
|---|---|---|
| `#` | ściana z bali | las |
| `.` | podłoga z desek | trawa |
| `,` | kilim | ścieżka |
| `W` | okno w ścianie (rzuca światło na podłogę) | studnia |
| `F` | półka ze słojami na ścianie | palisada |
| `M` | zioła suszone na ścianie | malwy |
| `b` | łóżko (dwa `b` jedno pod drugim) | krzak |
| `t` | stół (dwa lub więcej `t` obok siebie) | drzewo |
| `S` | stołek | stóg siana |
| `R` | skrzynia | głaz |
| `O` | beczka | wielkie drzewo |
| `T` | piec z ogniem (obiekt: świeci) | ognisko |
| `o` | gliniany garnek do rozbicia | to samo |

## Legenda: obiekty

Stoją na podłodze albo trawie i istnieją w obu światach.

| Znak | Co to |
|---|---|
| `@` | start gry (dokładnie jeden w całym świecie) |
| `1`–`9` | napis, mieszkaniec albo drzwi. Napis i mieszkaniec: blok `sign N:` pod mapą (`jawia:`, `nawia:` albo `both:`); w lochu to kamień z napisem, na powierzchni drogowskaz, z linią `look:` mieszkaniec wsi. Tekst zaczynający się od `@` wskazuje rozmowę z `src/story/` (patrz [DIALOGS.md](DIALOGS.md)). Drzwi: blok `door N: <id pokoju>` |
| `T` | ogień: w lochu kosz z ogniem, na powierzchni ognisko (blokuje, światło) |
| `!` | ściana z pochodnią (tylko loch; tam, gdzie pod ścianą jest podłoga lub woda w obu światach) |
| `G` | brama: w lochu krata, na powierzchni wrota w palisadzie. Otwiera się, gdy pokój jest „załatwiony”: w pokoju z małym dzwonem po uderzeniu w dzwon, w pozostałych gdy nie ma już wrogów w żadnym ze światów i nie czeka żadna fala. Pokój bez wrogów ma bramę otwartą od razu |
| `o` | naczynie do rozbicia mieczem (urna / gliniany garnek); w niektórych jest serce, zawsze w tych samych. Które, wynika z miejsca naczynia (przesunięcie o kafel może je zmienić), więc trzeba to sprawdzić w grze. Naczynia odnawiają się przy każdym wejściu do pokoju i po śmierci: naczynie z sercem to stałe miejsce odpoczynku |
| `h` | serce leżące na ziemi (raz zebrane nie wraca) |
| `I` | bożek: blokuje; w Nawi świecą mu oczy |
| `s` | dusza: w Nawi stoi tam umarły; w Jawi w lochu leżą jego kości, a na powierzchni rosną białe kwiaty (nie blokuje) |
| `P` | kolumna (loch) |
| `B` | mały dzwon: uderzenie mieczem otwiera bramy w tym pokoju |
| `Q` | wielki dzwon (3 kafle szerokości, znak stoi na środkowym): uderzenie kończy grę |
| `L` | kamień słońca i księżyca: uderzenie mieczem zamienia miejscami słupy `a` i `m` |
| `a` | słup słońca: na początku stoi (blokuje w obu światach), po uderzeniu w kamień chowa się |
| `m` | słup księżyca: odwrotnie |
| `u` | utopiec: wróg z Jawi; podchodzi, przykuca, skacze |
| `z` | zjawa: wróg z Nawi; krąży i przelatuje przez bohatera; lata nad wodą |
| `f` | ognik: wróg z Jawi; wisi w miejscu i pluje ogniem; podniesiona tarcza odsyła ogień do niego |
| `w` | ognik nad wodą (kafel jest wodą w obu światach): miecz go nie dosięgnie, zostaje tarcza |
| `x` | strzyga: ma dwie dusze; zabita w Jawi wstaje w Nawi |
| `d` | dzik: wróg z Jawi; szarżuje daleko po prostej, po zderzeniu ze ścianą stoi ogłuszony |
| `v` | wilk (skażony): wróg z Jawi; krąży, skacze, odskakuje |
| `p` | morownik, kwiat skazy: wróg z Jawi; stoi w miejscu i pluje trzema cierniami |
| `c` | kura: nikomu nie szkodzi i nie da się jej skrzywdzić; ucieka |
| `K` | strażnik (boss): znak stoi na lewym górnym kaflu jego ciała 2×2 |

### Mieszkańcy

```
sign 3:
  look: elder
  jawia: Odkąd dzwon milczy, umarli nie odchodzą. | Since the bell fell silent, the dead do not leave.
```

`look:` przyjmuje `herbalist` (zielarka), `elder` (starzec), `woman` (kobieta), `child` (dziecko). Mieszkaniec stoi w miejscu i blokuje kafel.
W Jawi mówi linią `jawia:`, w Nawi jest tylko echem (linię `nawia:` można pominąć). Rozmowę zaczyna klawisz ciosu.

Rozmowa z wyborem odpowiedzi:

```
sign 1:
  look: herbalist
  jawia: @zielarka          <- węzeł "zielarka" z pliku src/story/*.dialog.txt
```

Stan słupów wraca do początkowego przy każdym wejściu do pokoju. Słup nie wstaje, dopóki ktoś na nim stoi.

## Zasady, na których opiera się projekt poziomów

- **Kamień obraca się tylko tam, gdzie po drugiej stronie da się stanąć.** Obrót na gruzie, w murze, w drzewie albo nad
  wodą kończy się odrzuceniem: pół serca i powrót do miejsca, którym bohater wszedł do pokoju
  (w świecie, w którym do niego wszedł). Pokoju trzeba się nauczyć.
- **Powidok jest wyłączony** (`TUNE.shift.afterimage = 0` w `src/config.ts`; wartość w sekundach włącza go z powrotem).
  Układ drugiej strony trzeba zapamiętać.
- `=` i `:` wyglądają w swoim świecie tak samo jak `+`, więc **skrzyżowania kładki z mostem nie da się zobaczyć**:
  na tym stoi pokój `08-crossings`.
- Podpowiedzi w obrazie, z których warto korzystać świadomie:
  - `,` istnieje w obu światach: to bezpieczny grunt. Ścieżka, która wchodzi pod gruz albo ciernie, mówi
    „droga biegnie dalej, tylko nie w tym świecie”.
  - `N` zostawia w Jawi ślad (kikuty muru, pniak), więc widać, gdzie w Nawi coś stoi.
  - W lochu przy kaflach różniących się między światami pojawiają się same pęknięcia świecące kolorem drugiej strony.
- Wróg jest groźny i wrażliwy tylko w swoim świecie. Z drugiej strony widać samo echo.
- Brama potrzebuje ciszy po obu stronach, więc pokój z bramą wymusza walkę w obu światach.
- Każdy wróg ostrzega przed atakiem (błysk i żar), potem atakuje po prostej. Rani tylko sam cios, nie dotyk.
  Tarcza zatrzymuje cios od frontu. Naraz zamachuje się i uderza najwyżej dwóch; reszta czeka. Plujący (ognik,
  morownik) do tej dwójki się nie liczą, więc to oni robią tłok.
- Pociski giną na wszystkim, co w ich świecie stoi: mur, głaz, drzewo, gruz `J` (ciernie i ogień ognika są z Jawi),
  słup, urna, bożek. Woda ich nie zatrzymuje. Plujący nie patrzy, czy widzi bohatera, więc zasłona działa naprawdę.
- Dzik i strażnik zatrzymują się na wszystkim, co w Jawi blokuje: mur, głaz, drzewo, gruz, woda, słup.
  Dzik po zderzeniu stoi ogłuszony i bierze podwójnie; na arenie z dzikiem stawiaj przeszkody pojedynczo,
  na otwartym, żeby dało się stanąć przed jedną i odskoczyć.

### Walki i areny

- **Arena (`lock: yes`) to pokój, który jest walką**: kurhan, krypta, Sala Dwóch Dusz, strażnik. Korytarze i zagadki
  się nie zamykają: tam potwory naciskają, ale bohater może przejść obok.
- **Fala 2 dokłada nowy nacisk, nie więcej tego samego**: po sforze przychodzi szarżujący i plujący, po walce
  wręcz ogień z dwóch stron. Każda fala ma coś w obu światach, żeby trzeba było obrócić kamień w trakcie walki.
- **Potwory przychodzą z więcej niż jednej strony**: fale wstają w przeciwnych rogach albo po obu stronach osłony.
  Nie stawiaj ich przy samym wejściu: bohater zwykle tam stoi, gdy zamykają się kraty.
- **Osłona ma powód**: głaz albo słup, za którym nie dolecą ciernie, przed którym dzik się rozbije; gruz `J`, który jest
  ścianą dla żywych i otwartym polem dla umarłych. Woda to miejsce zjawy i ognika, nie bohatera.
- **Bezpieczny grunt w arenie**: `,` w obu światach jest tym samym, więc tam obraca się kamień w trakcie walki.
  Kafle `J` i `N` rozkładaj czytelnie (rzędy, kępy), nie losowo: obrót na nich wyrzuca bohatera do wejścia.
- **Serca**: śmierć oddaje pełne zdrowie i zaczyna pokój od nowa, więc serce znaczy najwięcej w środku areny.
  Naczynie z sercem w arenie to jedna pomyłka więcej przy każdej próbie; serce `h` znika na zawsze po zebraniu
  (i podnosi się tylko, gdy bohater jest ranny). Jedno naczynie z sercem na arenę, jedno na odpoczynek po niej.
- **Napis w arenie stoi przy wejściu** (albo w rogu): czyta się sam, gdy bohater stanie obok, a jego okno zasłania
  dół ekranu. Przy wejściu przeczyta się raz, zanim zaczną się kłopoty.
- **Krzywa**: gościniec uczy (jeden dzik, potem po jednym potworze na świat), kurhan sprawdza (dwie fale), krypta
  otwiera gród (dwie fale), Topiel to egzamin z tarczy, Sala Dwóch Dusz to szczyt (trzy fale), potem strażnik.
- Strażnik: w Jawi jest z kamienia i stal go nie rani. Szarżuje po prostej; gdy z rozpędu trafi w ścianę albo
  gruz (`J`), pada ogłuszony, a jego serce odsłania się **w Nawi, w tym samym miejscu**. Mury `N` na arenie
  osłaniają przed kulami serca i karzą obrót w złym miejscu. Liczby: `TUNE.boss` w `src/config.ts`.

Na powierzchni dochodzą dwie rzeczy:

- **Korony drzew zasłaniają.** Wszystko, co wystaje wyżej niż 8 px nad podstawę drzewa, jest rysowane nad bohaterem i wrogami.
  Walki planuj na otwartej przestrzeni, a dolny rząd mapy (`#`) traktuj jak kurtynę: jego korony przykrywają rząd nad nim.
- **Chata potrzebuje miejsca.** Zostaw kafel odstępu między chatą a lasem po bokach, inaczej korony nachodzą na dach.
- **Wesoło przy wsi, groźnie w głębi.** Pokoje bez skazy nie mają wrogów nie z tego świata. Pierwszy przeciwnik to zwierzę (dzik);
  wilki, morowniki i zjawy pojawiają się tam, gdzie `blight` jest większe od zera.

## Sprawdzanie

```bash
npm run rooms:check
```

Skrypt przechodzi cały świat po kaflach w obu światach naraz i mówi, czy da się dojść do obu dzwonów
i do kamienia słońca i księżyca, ile obrotów trzeba co najmniej i czy każde przejście między pokojami
i każde drzwi mają parę po drugiej stronie. Zna słupy (stan kamienia jest częścią przeszukiwania); bramy uznaje za otwarte,
wrogów pomija. Sprawdza też rozmowy: czy każdy skok i każde `@id` prowadzą do istniejącego węzła.
Odpala się też przy `npm run build`, więc zepsuty świat nie trafi na itch.io.

Podgląd pokoi jako PNG (Jawia nad Nawią): `npm run art:preview`, albo jeden pokój:
`node tools/preview.ts /tmp/podglad 3 shrine`.
