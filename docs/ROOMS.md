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
#!###~~~~~~~~~~###!#
#....~~~..~~~~~....#
.....::::+~~~~~.....
#....~~~~+=====....#
####################

sign 2:
  jawia: Tekst widoczny w Jawi. | English text.
  nawia: Tekst widoczny w Nawi. | English text.
```

- Mapa ma **20 x 11 kafli** (jeden ekran) albo wielokrotność: większy pokój zajmuje kilka pól siatki,
  a kamera za bohaterką jeździ w jego granicach.
- Blok `map:` kończy się pustą linią.
- **Przejście do sąsiedniego pokoju** to po prostu podłoga na krawędzi mapy. Sąsiad musi mieć podłogę
  w tym samym miejscu po swojej stronie.

## Legenda

Jeden znak opisuje, czym kafel jest w Jawi i czym w Nawi.

| Znak | Jawia (świat żywych, ruina) | Nawia (gród, jakim go pamiętają umarli) |
|---|---|---|
| `#` | ściana | ściana |
| `.` | podłoga | podłoga |
| `~` | woda | otchłań |
| `J` | **gruz** – blokuje | podłoga |
| `N` | podłoga (resztki muru) | **stary mur** – blokuje |
| `=` | **kładka z desek** | woda |
| `:` | woda | **stary most** |
| `+` | most | most |
| (spacja) | pustka | pustka |

Obiekty (stoją na podłodze, istnieją w obu światach):

| Znak | Co to |
|---|---|
| `@` | start gry (dokładnie jeden w całym lochu) |
| `!` | ściana z pochodnią (daje światło; tylko tam, gdzie pod ścianą jest podłoga) |
| `T` | kosz z ogniem (blokuje, daje światło) |
| `1`–`9` | kamień z napisem; treść w bloku `sign N:` pod mapą (`jawia:`, `nawia:` albo `both:`) |
| `G` | krata – otwiera się, gdy w pokoju nie ma już wrogów w żadnym ze światów |
| `B` | mały dzwon – uderzenie mieczem kończy demo |
| `u` | utopiec – wróg z Jawi |
| `z` | zjawa – wróg z Nawi (przelatuje nad wodą) |

## Zasady, które wynikają z formatu

- Przełączyć świat można tylko tam, gdzie po drugiej stronie da się stanąć. Na gruzie, w murze i nad wodą
  kamień odmawia (i pokazuje, co tam stoi).
- Wróg jest groźny i wrażliwy tylko w swoim świecie. Z drugiej strony widać samo echo.
- W każdym świecie widać blady zarys tego, co stoi tylko po drugiej stronie.

## Sprawdzanie

```bash
npm run rooms:check
```

Skrypt przechodzi cały loch po kaflach w obu światach naraz i mówi, czy da się dojść do dzwonu,
ile przełączeń trzeba co najmniej i czy każde przejście między pokojami ma parę po drugiej stronie.
Odpala się też przy `npm run build`, więc zepsuty loch nie trafi na itch.io.

Podgląd wszystkich pokoi jako PNG (Jawia nad Nawią): `npm run art:preview`.
