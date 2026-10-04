# Poprawność decyzji algorytmu — Plan Brief

> Full plan: [plan.md](plan.md)
> Research: [research.md](research.md)

## What & Why

Uzupełniamy niezależną weryfikację odległości i decyzji generatora oraz poprawiamy margines przy brzegach. Układ ma nadawać się do sprawdzenia na małych przykładach; skupienie roślin samo w sobie nie dowodzi błędu.

## Starting Point

Są testy geometrii, priorytetów, danych i snapshotu; research uruchomił 32 testy algorytmu/katalogu bez błędów. Obecna siatka zaczyna się od połowy rozstawy, ale po przeciwnej stronie dopuszcza środek na brzegu. Część oczekiwań korzysta z metadanych zwróconych przez sam generator.

## Desired End State

Nowy układ pozostawia połowę rozstawy od każdego brzegu na obu osiach. Starsze plany mają status nieaktualności dzięki wersji algorytmu 3 i pozostają czytelne do przeliczenia. Testy rozróżniają geometrię, sąsiedztwo, miks i niepewność danych.

## Key Decisions Made

| Decision | Choice | Why | Source |
|---|---|---|---|
| Brzegi | Połowa końcowej rozstawy na każdej osi | Symetryczna przestrzeń wokół środka | Plan Q1 |
| Dyskretność | 2/1 wobec 80/20 bez konfliktu samego zaokrąglenia | Nieunikniona całkowita liczba roślin | Plan Q2 |
| Zakres | Testy i poprawka marginesu razem | Nowy kontrakt od razu spełniony | Plan Q3 |
| Starsze plany | Algorithm version 2→3; zachowany odczyt | Wynik sprzed zmiany nie udaje bieżącego | Research / zatwierdzone etapy |
| Ranking | Supported → presja miksu → caution → zwartość → remis | Zachowanie przyjętych priorytetów | Research |
| Dane low | Zachować i ujawnić, nie odrzucać automatycznie | Robocze dane nie mogą udawać pewnych | Research / test-plan |
| Oracle | Ręczne stałe i kontrakty wejścia | Wykrywać błędy zamiast je kopiować | Test-plan / Research |

## Scope

**In scope:** symetryczna siatka, obie osie i pary gatunków, kontrakty adaptera katalogu, braki/low, aktualność snapshotu i cookbook §6.1–§6.2.

**Out of scope:** solver globalnej niewykonalności, nowe progi konfliktów, równomierność, kosmetyka, UI, bazy/e2e, instalacje narzędzi i ponowna weryfikacja źródeł ogrodniczych. Dalsze raportowanie częściowych konfliktów jest poza zatwierdzonym zakresem.

## Architecture / Approach

Rozwijamy istniejące pliki testów algorytmu, katalogu i snapshotu. Zmieniamy granicę generatora oraz wersję algorytmu, wykorzystując dotychczasowy odczyt starych planów. Nie kopiujemy produkcyjnych obliczeń do oczekiwań.

## Phases at a Glance

| Phase | What it delivers | Key risk |
|---|---|---|
| 1. Margines i wersjonowanie | Granice z ręcznymi przykładami, wersja 3 | Mniejsza obsada; starszy plan może być niezgodny |
| 2. Testy decyzji i danych | Pary, ranking, 80/20, braki i low | Pozorna ochrona przez implementacyjne oracle |
| 3. Weryfikacja i instrukcje | Komendy repo, ręczny odbiór i §6.1–§6.2 | Rozbieżność danych i obrazu użytkownika |

**Prerequisites:** istniejące zależności i testy; lokalne konto/środowisko do ręcznego odbioru Phase 3.
**Estimated effort:** mała zmiana w trzech etapach; orientacyjnie 1–2 sesje wdrożenia plus ręczny odbiór, bez gwarancji czasu.

## Open Risks & Assumptions

- Margines może zmniejszyć obsadę; akceptacja tej konsekwencji jest częścią decyzji Q1/Q3.
- Robocze dane marchwi mają confidence low: testy dowodzą modelu, nie skuteczności uprawy.
- Heurystyka może skupiać rośliny i nie dowodzi optimum; konkretnej obserwacji użytkownika nie odtworzono bez jego wejść.

## Success Criteria (Summary)

- Środki nowego wyniku zachowują margines i wymagane odstępy, sprawdzone niezależnymi przykładami.
- Starszy wynik jest nieaktualny; po przeliczeniu aktualny. Braki i niepewność pozostają jawne.
- Zaokrąglenie 80/20 do 2/1 nie tworzy konfliktu samo z siebie; nowe testy uruchamia istniejąca bramka unit i cookbook wskazuje wzorce.

## References

- [Full plan](plan.md), [research](research.md), [change](change.md).
- `context/foundation/test-plan.md` — ryzyka #1/#5/#6 i §6.1–§6.2.
- `src/lib/garden-layout.ts:427`, `src/lib/garden-plan-snapshot.ts:5`, `src/data/crop-catalog.ts:1691`.
