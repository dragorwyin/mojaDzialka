# Rozstaw późnej marchwi i czytelność diagramu — Plan Brief

> Full plan: `context/changes/carrot-spacing-and-diagram-readability/plan.md`
> Frame brief: `context/changes/carrot-spacing-and-diagram-readability/frame.md`

## What & Why

> **The actual problem to plan around is**: ogólny profil marchwi wraz z wyborem dolnego krańca ustawia rośliny co 3 cm — zgodnie z obecną wartością, lecz gęściej niż użytkownik chce dla późniejszych odmian — a stałe znaczniki dodatkowo zlewają się na diagramie.

Użytkownik zaakceptował jeden zachowawczy wpis marchwi z minimum 7 cm dla późnych odmian. Jednocześnie diagram musi ujawniać centymetrową geometrię bez nakładania symboli i bez zmiany prawdziwych środków roślin.

## Starting Point

Katalog zapisuje dla marchwi końcowe 3–5 × 20–30 cm po przerywce, a siew przechowuje osobno; generator używa minimum zakresów. Obecny diagram ma stałe znaczniki 20 px, brak siatki i miniaturek oraz ograniczenia wysokości, które mogą zaburzać proporcje. Wybór pod ID `marchew` i poprzedni plan można zachować dzięki wersjonowaniu snapshotu.

## Desired End State

Planer stosuje dla jednego wpisu marchwi minimum 7 cm w rzędzie (roboczy zakres 7–8 cm) i 20–30 cm między rzędami, nie zmieniając osobnych danych siewu ani zapisanych wyborów użytkownika. Górna granica 8 cm ma być potwierdzona przy aktualizacji kontekstu katalogu. Diagram jest w równej skali centymetrów, ma subtelną siatkę i miniatury wszystkich 31 upraw, a tekstowa legenda i szczegóły działają niezależnie od grafik. Stary diagram pozostaje widoczny jako nieaktualny do czasu ponownego generowania.

## Key Decisions Made

| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| Profil marchwi | Jeden wpis z zatwierdzonym minimum 7 cm; roboczy zakres końcowy 7–8 cm | Minimum pochodzi od użytkownika; górne 8 cm zachowuje granicę źródłowego zakresu dla późnych korzeni 5–8 cm. | Frame + Plan (A) |
| Międzyrzędzia i etap | Zachować 20–30 cm po przerywce; siew pozostaje osobny | Diagram ma pokazywać końcową obsadę, nie rozstawę nasion. | Zatwierdzony follow-up S-04 |
| Zgodność zapisanych upraw | Zachować `marchew` i podbić wersję katalogu | Dotychczasowe wybory nie znikają; stare plany można oznaczyć jako nieaktualne bez migracji. | Frame + Plan |
| Diagram | SVG w równiej skali cm, siatka 10 cm, lokalne miniatury 31 upraw | Poprawia odczyt bez zmiany geometrii; legenda i fallback pozostają tekstowe. | Zatwierdzony follow-up S-04 |

## Scope

**In scope:** zmiana końcowej rozstawy marchwi; test produkcyjnych danych generatora; wersjonowanie nieaktualnych planów; centymetrowy, responsywny diagram; siatka co 10 cm; lokalne miniatury katalogu; dostępna legenda/fallback; desktop/mobile verification.

**Out of scope:** odmienne ID dla wczesnej marchwi; migracja bazy; zmiana gęstości lub kalendarza siewu; przebudowa algorytmu sąsiedztwa i jego punktacji; zmiany innych rozstaw katalogu.

## Architecture / Approach

Aktualizujemy `finalSpacing` istniejącego wpisu i bumpujemy wersję katalogu w snapshotach, dzięki czemu wybór ID się nie zmienia, a dawny wynik robi się stale. Warstwa SVG mapuje zapisane współrzędne bezpośrednio na widok w cm, a niewielkie lokalne miniatury i tekstowa legenda odpowiadają za identyfikację roślin, nie za geometrię.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Rozstawa i zgodność | Profil marchwi 7–8 × 20–30 cm, test generatora i jawna nieaktualność starego planu | Brak regresji dla istniejących zapisanych wyborów |
| 2. Diagram | Równa skala cm, siatka 10 cm, 31 miniatur i dostępny fallback | Czytelność gęstych pozycji na telefonie bez przesuwania centrów |
| 3. Odbiór | Kontrole jakości i end-to-end ręczny scenariusz desktop/mobile | Rozróżnienie błędu geometrii od ograniczeń samej prezentacji |

**Prerequisites:** zatwierdzony Frame, istniejący follow-up S-04 i bieżący staged baseline pozostają nienaruszone.
**Estimated effort:** około 2–3 sesji w trzech fazach; fazy 1 i 2 wymagają osobnej ręcznej akceptacji przed kontynuacją.

## Open Risks & Assumptions

- Minimum 7 cm pochodzi od użytkownika; 8 cm jako górny kraniec jest planistycznym założeniem z późnego źródłowego zakresu 5–8 cm i trzeba potwierdzić je przy aktualizacji kontekstu katalogu. Profil nie jest uniwersalnym zaleceniem dla każdej marchwi.
- Miniatury SVG/PNG muszą pozostać małe, spójne i poprawnie przypisane; fallback tekstowy nie może zależeć od ich załadowania.
- Małe widoki mogą wymagać zmniejszenia albo wizualnego grupowania symboli; żadna metoda nie może zmieniać zapisanych pozycji.

## Success Criteria (Summary)

- Nowe plany respektują minimum 7 cm w rzędzie po przerywce, a stare plany są oznaczone jako nieaktualne bez utraty wyboru marchwi.
- Diagram zachowuje równą skalę centymetrów i prawdziwe środki stanowisk; siatka, miniatury oraz tekstowa legenda są czytelne na desktopie i telefonie.
- Testy istniejącego projektu przechodzą, a użytkownik potwierdza końcowy przypadek ręczny.
