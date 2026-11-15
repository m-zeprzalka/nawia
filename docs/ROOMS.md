# Format pokoi

Jeden plik = jeden pokój = **oba światy naraz**. Pliki leżą w `src/world/rooms/` i mają rozszerzenie
`.room.txt`. Gra wczytuje wszystkie automatycznie (kolejność nie ma znaczenia), a `npm run dev`
odświeża pokój po zapisaniu pliku.

```
// komentarz (zaczyna się od //, bo # to ściana)
room: bridge                          <- unikalne id
at: 1,0                               <- pozycja w siatce lochu, w "ekranach" (x,y)
name: Zerwany most | The Broken Bridge   <- polski | angielski

map:
####################
#!##~~~~~~~~~~~~##!#
#.o.~~~~,,~~~~~~...#
....::::,,~~~~::....
#...~~~~=====,,~...#
####################

sign 1:
  jawia: Tekst widoczny w Jawi. | English text.
  nawia: Tekst widoczny w Nawi. | English text.
```

- Mapa ma **20 x 11 kafli** (jeden ekran) albo wielokrotność. Większy pokój zajmuje kilka pól siatki,
  a kamera jeździ za bohaterem w jego granicach (przykład: `04-street.room.txt`, 40 x 11).
- Blok `map:` kończy się pustą linią.
- **Przejście do sąsiedniego pokoju** to po prostu podłoga na krawędzi mapy. Sąsiad musi mieć podłogę
  w tym samym miejscu po swojej stronie.

## Legenda

Jeden znak opisuje, czym kafel jest w Jawi i czym w Nawi.

| Znak | Jawia (tu i teraz: ruina) | Nawia (świat duchów: gród, jakim go pamiętają) |
|---|---|---|
| `#` | ściana | ściana |
| `.` | podłoga | podłoga |
| `,` | ozdobna posadzka | ozdobna posadzka (świecąca) |
| `~` | woda | otchłań |
| `J` | **gruz** – blokuje | podłoga |
| `N` | podłoga (resztki muru) | **stary mur** – blokuje |
| `=` | **kładka z desek** | otchłań |
| `:` | woda | **stary most** |
| `+` | most | most |
| (spacja) | pustka | pustka |

Obiekty (stoją na podłodze, istnieją w obu światach):

| Znak | Co to |
|---|---|
| `@` | start gry (dokładnie jeden w całym lochu) |
| `!` | ściana z pochodnią (światło; tylko tam, gdzie pod ścianą jest podłoga lub woda w obu światach) |
| `T` | kosz z ogniem (blokuje, światło) |
| `1`–`9` | kamień z napisem; treść w bloku `sign N:` pod mapą (`jawia:`, `nawia:` albo `both:`) |
| `G` | krata – otwiera się, gdy w pokoju nie ma już wrogów w żadnym ze światów |
| `B` | mały dzwon – uderzenie mieczem kończy demo |
| `o` | urna – do rozbicia mieczem; w niektórych jest serce (zawsze w tych samych) |
| `I` | bożek – blokuje; w Nawi świecą mu oczy |
| `P` | kolumna – blokuje |
| `s` | dusza – w Nawi stoi tam mieszkaniec grodu, w Jawi leżą jego kości (nie blokuje) |
| `u` | utopiec – wróg z Jawi |
| `z` | zjawa – wróg z Nawi (przelatuje nad otchłanią) |

## Zasady, na których opiera się projekt poziomów

- **Kamień obraca się tylko tam, gdzie po drugiej stronie da się stanąć.** Obrót na gruzie, w murze albo nad
  wodą kończy się odrzuceniem: pół serca i powrót do miejsca, którym bohater wszedł do pokoju
  (w świecie, w którym do niego wszedł). Pokoju trzeba się nauczyć.
- Przez chwilę po obrocie widać **powidok** tego, co stoi po stronie, którą właśnie opuścił. Potem gaśnie.
- Podpowiedzi w obrazie, z których warto korzystać świadomie:
  - `,` (ozdobna posadzka) istnieje w obu światach – to „bezpieczny grunt”. Dobrze nią znaczyć filary,
    progi i ścieżki; ścieżka, która wchodzi pod gruz, mówi „droga biegnie dalej, tylko nie w tym świecie”.
  - `N` zostawia w Jawi kikuty muru, więc widać, gdzie w Nawi stoi ściana.
  - Przy kaflach różniących się między światami pojawiają się same **pęknięcia** świecące kolorem drugiej strony.
- Wróg jest groźny i wrażliwy tylko w swoim świecie. Z drugiej strony widać samo echo.
- Krata potrzebuje ciszy po obu stronach, więc pokój z kratą wymusza walkę w obu światach.

## Sprawdzanie

```bash
npm run rooms:check
```

Skrypt przechodzi cały loch po kaflach w obu światach naraz i mówi, czy da się dojść do dzwonu,
ile obrotów trzeba co najmniej i czy każde przejście między pokojami ma parę po drugiej stronie.
Odpala się też przy `npm run build`, więc zepsuty loch nie trafi na itch.io.

Podgląd wszystkich pokoi jako PNG (Jawia nad Nawią): `npm run art:preview`.
