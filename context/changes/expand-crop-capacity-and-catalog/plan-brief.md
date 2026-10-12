# Większa obsada ogrodu i rozszerzony katalog upraw — Plan Brief

> Full plan: `context/changes/expand-crop-capacity-and-catalog/plan.md`
> Frame brief: `context/changes/expand-crop-capacity-and-catalog/frame.md`
> Research: `context/changes/expand-crop-capacity-and-catalog/research.md`

## What & Why

Plan usuwa techniczne ograniczenia, przez które generator obcina rozmieszczenie, i przygotowuje aplikację do obliczenia ponad 10 000 końcowych pozycji sadzenia w całym ogrodzie. Rozszerza katalog o jak najwięcej różnych, obliczalnych typów upraw kuratorowanych jako uprawiane lub polecane do polskich ogródków; nie ustalamy arbitralnego minimum liczby. Odmiany nie zwiększają liczby typów; odrębne typy użytkowe, np. fasola szparagowa i fasola na suche nasiona, mogą być osobnymi pozycjami. Synonimy i duplikaty nie mogą tworzyć oddzielnych wpisów. Dotychczasowe typy zostają. Nie przedstawiamy listy jako udowodnionego rankingu krajowego; przy każdej pozycji oddzielamy dowody uprawy od pewności rozstawy.

## Starting Point

Generator ma limit 256 punktów siatki na uprawę w skrzyni i 2 000 sprawdzeń na przebieg, a grupowanie odbywa się w drugim przebiegu. Katalog egzekwuje dokładnie 31 wpisów; część nie ma końcowych odstępów. Zapis i dashboard przenoszą pełny obiekt planu, zaś diagram renderuje pozycje pojedynczo.

## Desired End State

Wykonalny ogród zawierający ≥10 000 pozycji generuje się w ≤10 sekund w środowisku zbliżonym do produkcyjnego. Katalog zawiera maksymalny uzasadniony źródłami zbiór unikalnych typów z końcową rozstawą; synonimy są aliasami, a duplikaty nie przechodzą walidacji. Źródłowy fallback gatunkowy o niskiej pewności nie blokuje obliczeń, a wpis bez wiarygodnej końcowej rozstawy jest zastępowany zamiast otrzymać wymyśloną wartość. Zero pozycji ma jawną przyczynę. Duży plan zachowuje dokładne dane po zapisie i reloadzie, a Faworyt może być rozmieszczony w skrzyni 120 × 80 cm bez naruszenia odstępu 50 × 100 cm.

## Key Decisions Made

| Decision                           | Choice                                                                                   | Why                                                                                                     | Source              |
| ---------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------- |
| Próg obsady                        | ≥10 000 w całym ogrodzie; generowanie ≤10 s                                              | Obejmuje wiele skrzyń i daje mierzalny próg odbioru.                                                    | Plan                |
| Wielkość katalogu                  | Jak najwięcej źródłowo uzasadnionych, unikalnych typów; bez sztywnego minimum            | Zwiększa wybór bez sztucznego dobijania liczby przez odmiany lub duplikaty.                             | Korekta użytkownika |
| Nieznana rozstawa odmiany          | Źródłowa wartość gatunkowa jako jawny fallback niskiej pewności                          | Wszystkie wpisy da się policzyć bez udawania precyzji odmianowej.                                       | Plan                |
| Dowody popularności                | Kuratorowana lista „często uprawiane/polecane”, z poziomem dowodów; bez top-100 rankingu | Źródła polskich ROD są lokalne, a dostępne dane nie mierzą reprezentatywnie 100 gatunków w skali kraju. | Frame / Plan        |
| Brak wiarygodnej końcowej rozstawy | Nie zgadywać; użyć źródłowego fallbacku gatunkowego albo zastąpić kandydata              | Każdy aktywny wybór jest obliczalny bez pomylenia siewu z końcową obsadą.                               | Plan                |
| Grupowanie roślin                  | Jedna zwarta grupa na wpis katalogu i skrzyni; braki raportowane                         | Zachowuje wcześniejszy zaakceptowany kontrakt.                                                          | Research            |
| Orientacja Faworyta                | Sprawdzać obie orientacje siatki, odstęp pozostaje 50 × 100 cm                           | Może zmieścić uprawę w skrzyni 120 × 80 cm.                                                             | Plan                |
| Widok dużego planu                 | Agregaty przy oddaleniu, indywidualne pozycje po powiększeniu                            | Diagram pozostaje czytelny bez utraty szczegółów.                                                       | Plan                |

## Scope

**In scope:** skalowalny generator i pomiar wydajności, obrót siatki, możliwie szeroki katalog unikalnych i obliczalnych typów upraw (odmiany nie zwiększają liczby typów), zachowanie dotychczasowych typów, osobna ewidencja dowodów uprawy i źródeł rozstawy, jawne oznaczenie pewności/fallbacku i przyczyn zera, wyszukiwanie i fallback miniatury, zapis/odczyt dużego planu, agregacja diagramu oraz testy desktop/mobile.

**Out of scope:** liczba nasion na tacki i plon, ręczne przesuwanie/przypisywanie upraw, rozszerzanie relacji sąsiedztwa, osobne ilustracje dla każdego wpisu, dokładny krajowy ranking popularności 1–100 i 10 000 pozycji w pojedynczej skrzyni.

## Architecture / Approach

Najpierw zmienić algorytm i wersję fingerprintu planu; później dodać źródłowe dane katalogu i zaktualizować jego inwarianty; na końcu potwierdzić pełny przepływ API–JSONB–dashboard i agregować markery wyłącznie w warstwie widoku. Każda faza kończy się automatyczną weryfikacją i ręcznym odbiorem.

## Phases at a Glance

| Phase                                        | What it delivers                                                                                     | Key risk                                                                                                                         |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 1. Skalowalny generator i obsługa orientacji | ≥10 000 wykonalnych pozycji, zachowane reguły i Faworyt w wykonalnej orientacji                      | Koszt przeszukiwania geometrii może przekroczyć 10 s.                                                                            |
| 2. Rozszerzony, unikalny katalog upraw       | Maksymalny zbiór kandydatów popartych źródłami, końcowe odstępy, wyszukiwanie i jawne przyczyny zera | Lokalne obserwacje i zalecenia nie potwierdzą krajowej kolejności popularności; źródła siewne mogą nie opisywać obsady końcowej. |
| 3. Zapis i czytelny diagram dużego planu     | Pełny round-trip oraz widok agregowany/indywidualny na desktopie i mobile                            | JSONB, dekoder lub DOM może stać się wąskim gardłem.                                                                             |

**Prerequisites:** zatwierdzone decyzje z tej rozmowy; źródła PZD/ODR/ROD i normatywy uprawowe; preview Workers do pomiaru progu 10 s.
**Estimated effort:** Duża zmiana w trzech fazach; liczba sesji zależy głównie od źródłowej weryfikacji kandydatów i iteracji wydajnościowych.

## Open Risks & Assumptions

- Katalog jest kuratorowany na podstawie źródeł o nasadzeniach i rekomendacjach ogrodniczych, nie reprezentatywnego rankingu krajowego; jego liczebność wynika z udokumentowanych unikalnych kandydatów.
- CDR podaje część rozstaw w kontekście produkcji towarowej lub siewu; każdy fallback musi opisywać zgodność z końcową obsadą, a nie kopiować niejednoznaczne odstępy.
- Limit 10 sekund musi zostać zweryfikowany na środowisku zbliżonym do produkcyjnego; lokalny runtime nie odtwarza wszystkich limitów Workers.
- Brak osobnej miniatury nie może ukrywać uprawy; UI użyje czytelnego fallbacku tekstowego/graficznego.
- Zmiana wersji algorytmu oznaczy stare plany jako nieaktualne do ponownego przeliczenia, zachowując istniejące dane.

## Success Criteria (Summary)

- Wykonalny ogród z co najmniej 10 000 pozycji generuje się w maksymalnie 10 sekund i nie traci pozycji po zapisie i ponownym odczycie.
- Każdy aktywny typ uprawy ma ewidencję dowodu wyboru oraz źródłową końcową rozstawę, da się wyszukać i uwzględnić w obliczeniu; nie ma zduplikowanych typów, niska pewność nie blokuje, a każde zero ma jawną przyczynę.
- Przy oddaleniu diagram jest czytelny, a po powiększeniu dostępne są wszystkie indywidualne pozycje i dokładne podsumowania.
