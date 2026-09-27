# Katalog warzyw i dane do planowania sezonu — Plan Brief

> Full plan: context/changes/garden-crop-catalog-research/plan.md
> Research: context/changes/garden-crop-catalog-research/research.md

## What & Why

Zbudujemy pierwszą, źródłowo opisaną bazę 30 warzyw dla przyszłego planera. Dane będą przechowywać rozstawy, okna terminów, źródła i ostrożne relacje sąsiedztwa bez tworzenia fałszywego rankingu ani obietnicy dokładnych dat.

## Starting Point

Repozytorium ma działające Astro, ścisły TypeScript, autoryzację i prywatną tabelę gardens, ale nie ma katalogu roślin ani test runnera TypeScript. Dashboard jest obecnie ekranem powitalnym; ta zmiana nie będzie go rozszerzać.

## Desired End State

W repozytorium istnieje typowany katalog wszystkich 30 kandydatów oraz repository udostępniające listę, wyszukiwanie, pobieranie po ID i odczyt relacji. Dane nie są rankingiem; brak dowodu zwraca unknown, a caution jest ostrzeżeniem informacyjnym.

## Key Decisions Made

| Decision | Choice | Why | Source |
|---|---|---|---|
| Zakres | Katalog, dane referencyjne i odczyt dla planera | Nie rozstrzygamy jeszcze algorytmu układu ani proporcji | Plan |
| Źródło danych | Statyczny moduł TypeScript | Minimalny zakres dla 30 rekordów i brak potrzeby publicznej tabeli DB w MVP | Plan |
| Kształt danych | Typowane rekordy z zagnieżdżonymi sekcjami | Zachowuje warianty rozstaw, okien i relacji bez spłaszczania | Plan |
| Dostęp | Repository nad modułem | Późniejsza zmiana źródła na Supabase nie zmieni consumerów | Plan |
| Katalog | Wszystkie 30 rekordów, neutralna kolejność | Nie tworzymy sztucznego rankingu | Research / Plan |
| Brak danych | unknown domyślnie, jawne supported/caution | Nie generujemy macierzy 435 par ani fałszywych zakazów | Research / Plan |
| Testy | Walidacja danych, Vitest, lint i build | Repozytorium nie ma jeszcze test runnera TypeScript | Plan |

## Scope

In scope:

- typy i 30 rekordów w src/data/crop-catalog.ts;
- walidacja struktury, źródeł, zakresów i relacji;
- repository w src/lib/crop-catalog.ts;
- neutralne wyszukiwanie nazw i aliasów;
- statusy supported, caution i unknown;
- Vitest, testy jednostkowe oraz skrypty test:unit, lint i build.

Out of scope:

- migracje i seed Supabase;
- UI, dashboard i endpoint HTTP;
- algorytm proporcji, układ graficzny i wykrywanie konfliktów powierzchni;
- regionalne daty dzienne, prognozy i przypomnienia;
- ranking popularności lub jakości;
- pseudonaukowe reguły biodynamiczne;
- zmiana roadmapy i prywatnej granicy gardens.

## Architecture / Approach

Statyczny moduł danych jest źródłem prawdy, a repository stanowi jedyny kontrakt dla przyszłych consumerów. Walidacja pilnuje spójności danych przy eksporcie, a Vitest testuje czyste funkcje bez uruchamiania bazy ani przeglądarki.

## Phases at a Glance

| Phase | What it delivers | Key risk |
|---|---|---|
| 1. Typy i katalog | 30 rekordów z kontekstem, źródłami i walidacją | Nie pomylić kompletności danych z rankingiem |
| 2. Repository | Neutralny odczyt, wyszukiwanie i unknown | Nie sprzęgać consumerów ze statyczną tablicą |
| 3. Testy i bramka | Testy danych/reguł oraz lint/build | Nie rozszerzyć testów na UI lub bazę poza zakresem |

Prerequisites: research.md i zaakceptowane decyzje planowania są gotowe; nie potrzeba zmian w roadmapie ani konfiguracji Supabase.

Estimated effort: około 1–2 sesji implementacyjnych w 3 małych fazach.

## Open Risks & Assumptions

- Research pozostaje częściowy: oś rozstaw S6 i ziemniak wymagają dalszej lokalnej walidacji, więc rekordy zachowają flagi.
- Brak test runnera wymaga dodania Vitest, ale zakres zależności pozostaje ograniczony do testów jednostkowych.
- Przyszły planner będzie używał repository; bezpośrednie importy danych są poza kontraktem.
- Późniejsza migracja do Supabase może zmienić adapter, ale nie powinna zmienić typów i operacji odczytu.

## Success Criteria (Summary)

- 30 rekordów przechodzi walidację i ma źródła oraz jawne poziomy pewności.
- Repository wyszukuje neutralnie, zwraca unknown dla braku dowodu i nie tworzy rankingu.
- test:unit, lint i build przechodzą, a dashboard, auth, RLS i roadmapa pozostają nietknięte.
