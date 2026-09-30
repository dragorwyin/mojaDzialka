# Katalog upraw po przerywce i czytelny układ — Plan Brief

> Full plan: `context/changes/garden-crop-catalog-and-layout/plan.md`
> Research: `context/changes/garden-crop-catalog-and-layout/research.md`

## What & Why

Follow-up S-04 uzupełni katalog do 31 uzgodnionych pozycji i pokaże użytkownikowi końcową obsadę po przerywce/sadzeniu — odrębnie od gęstości siewu i terminów. Uporządkuje też algorytm i diagram: dobre sąsiedztwa mają znaczenie, lokalne położenie ma być wyjaśnione, a pozycje muszą pozostać czytelne na subtelnej siatce i prawdziwej skali.

## Starting Point

Jest już zapisany wybór procentowy, generator i prywatny plan; obecny katalog ma 30 upraw, algorytm nie grupuje neutralnych roślin ani nie zwraca powodów pozycji. Diagram używa stałych znaczników i nie pokazuje ani siatki, ani miniatur, a dane rozstawy nie rozdzielają wprost końcowej obsady od siewu.

## Desired End State

Użytkownik wybiera z katalogu 31 upraw, zachowując dotychczasowy wybór `pomidor` jako Faworyta. Widzi oddzielnie rozstawę końcową, siew i terminy; generator liczy sąsiedztwo wyłącznie w obrębie jednej skrzyni/sektora i wyjaśnia lokalne relacje. Diagram trzyma skalę w centymetrach, ma delikatną siatkę 10 cm, spójne miniatury i czytelną wersję mobilną.

## Key Decisions Made

| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| Katalog | 31 pozycji; bez fasoli, bobu i pięciu dodatkowych ziół; pomidor rozdzielony na Faworyta i palikowany koktajlowy; dochodzą koper i szczypiorek. | Zachowuje dokładnie uzgodniony zakres upraw. | Research / S-04 follow-up |
| Geometria | Diagram korzysta z obsady po przerywce lub posadzeniu; siew i terminy są osobnymi informacjami. | Pozycje mają pokazywać przestrzeń potrzebną rosnącym roślinom. | Research / S-04 follow-up |
| Zgodność | `pomidor` zostaje ID Faworyta; zapisane fasola/bób pozostają jako jawnie wycofane do decyzji użytkownika. | Żaden wybór nie znika po cichu ani nie zmienia znaczenia. | Plan — 1A |
| Jednostka procentu | Jedna kępa szczypiorku liczy się jako jedna jednostka obsady. | Liczba odpowiada stanowiskom widocznym w planie, nie zmiennym pędom. | Plan — 2A |
| Sąsiedztwo | Lokalny próg jednego kroku końcowej rozstawy; tylko w tej samej skrzyni/sektorze. | Ogranicza relacje do faktycznie bliskich pozycji i nie wymyśla sąsiedztwa między skrzyniami. | Plan — 3A / S-04 follow-up |
| Wizualizacja | Równa skala cm na obu osiach, subtelna siatka 10 cm, miniatury i tekstowy fallback; tłok rozwiązywany bez przesuwania pozycji. | Zachowuje jednocześnie geometrię i czytelność. | S-04 follow-up / Research |
| Stare plany | Wersja katalogu/algorytmu uczestniczy w fingerprintcie; starszy plan zostaje dostępny jako nieaktualny. | Zapobiega pokazywaniu starej interpretacji jako bieżącej. | Research / Plan |

## Scope

**In scope:** model danych 31 upraw i źródeł; obsługa wycofanych ID; objaśnialne, zwarte rozmieszczenie; wersjonowanie snapshotu; szczegóły siewu i terminów; miniatury, skala, siatka, zachowanie przy tłoku; automatyczne i ręczne sprawdzenia.

**Out of scope:** nowe zioła, fasola i bób w aktywnym katalogu; fizyczne sąsiedztwo między przestrzeniami; ręczne przesuwanie upraw; prognoza plonu; historia sezonów; destrukcyjne czyszczenie zapisów; nowy framework testów UI.

## Architecture / Approach

Jeden typowany katalog zasila formularz i czysty generator. Generator operuje tylko na końcowej obsadzie i zwraca pozycje, sąsiadów oraz powody; wersjonowany snapshot odróżnia stare plany. `/garden` pokazuje informacje o uprawie i renderuje współrzędne SVG w centymetrach, z lokalnymi miniaturami i dostępną legendą.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Katalog i zgodność zapisanych wyborów | 31 rekordów z rozdzielonymi danymi oraz bezpieczna obsługa starych wyborów. | Część roślin nie ma wiarygodnej końcowej rozstawy; brak nie może być zastąpiony siewem. |
| 2. Lokalny silnik, zwarte rozmieszczenie i wyjaśnienia | Lokalni sąsiedzi, kompaktowość, powody pozycji i stare plany oznaczone jako nieaktualne. | Uzasadnienie heurystyki nie może udawać źródłowej prawdy biologicznej ani obiecywać optimum globalnego. |
| 3. Szczegóły upraw, skalowany diagram i odbiór | Informacje o siewie/terminach, SVG w skali, siatka 10 cm, miniatury i czytelny widok mobilny. | Przy gęstej marchwi miniatury mogą być zbyt małe; prezentacja musi zachować geometrię i alternatywę tekstową. |

**Prerequisites:** zatwierdzony S-04 i jego ręczne bramki; research 31 pozycji dostępny w folderze zmiany; lokalne środowisko z testami i kontem smoke.
**Estimated effort:** duża zmiana: orientacyjnie 4–6 sesji implementacji i 3 ręczne odbiory faz; nie obejmuje dodatkowego rozszerzenia zakresu badawczego.

## Open Risks & Assumptions

- Część końcowych rozstaw ma niższą pewność albo brak danych; takie pozycje pozostają jawnie nierozmieszczone, zamiast korzystać z gęstości siewu.
- Próg „jeden krok rozstawy” jest deterministyczną regułą sąsiedztwa dla układu, nie uniwersalną biologiczną odległością.
- Zmiana wersji snapshotu może oznaczyć bieżący zapisany wynik jako nieaktualny; treść wyniku i stare wybory pozostają zachowane.
- Miniatury są pomocą wizualną, nie jedynym nośnikiem nazwy ani statusu rośliny.

## Success Criteria (Summary)

- Dokładnie 31 uzgodnionych upraw; siew i końcowa obsada są rozdzielone, a niepewność źródeł jawna.
- Sąsiedztwo działa wyłącznie lokalnie w przestrzeni, negatywne reguły blokują, `unknown` pozostaje neutralne, a nietypowe pozycje mają wiarygodne objaśnienie.
- Diagram jest proporcjonalny, nieprzeładowany, dostępny bez obrazów i czytelny na desktopie oraz telefonie.
