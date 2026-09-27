# Wybór warzyw i proporcji — Plan Brief

> Full plan: context/changes/select-crops-and-proportions/plan.md
> Research: context/changes/garden-crop-catalog-research/research.md

## What & Why

S-03 pozwoli zalogowanemu użytkownikowi znaleźć i wybrać warzywa oraz przypisać im liczbowe proporcje. Wybór zostanie zapisany prywatnie, aby mógł być wejściem do kolejnego kroku planera — generowania układu w S-04.

## Starting Point

Repozytorium ma już 30-elementowy, neutralnie sortowany katalog z wyszukiwaniem nazw i aliasów. Prywatna strona /garden zapisuje wymiary skrzyń, ale model bazy nie przechowuje jeszcze wybranych upraw ani proporcji.

## Desired End State

Zalogowany użytkownik wyszukuje warzywa, wybiera je, wpisuje dodatnie proporcje i zapisuje listę. Po ponownym wejściu na /garden widzi swój wybór; RLS uniemożliwia odczyt danych przez inne konto. Proporcje pozostają liczbami wejściowymi — algorytm ich interpretacji jest częścią S-04.

## Key Decisions Made

| Decision | Choice | Why | Source |
|---|---|---|---|
| Katalog MVP | Obecne 30 warzyw jako kuratorowana, nierankingowa lista | Użytkownik akceptuje je na podstawie własnej obserwacji; źródła nie potwierdzają krajowego rankingu | User, 2026-09-27 / Research |
| Nazewnictwo katalogu | Nie nazywać zestawu „30 najpopularniejszymi w Polsce” | Akceptacja listy jest decyzją produktową, a nie wynikiem reprezentatywnego pomiaru | User / Research |
| Trwałość wyboru | Prywatny zapis na poziomie działki | Wybór ma być częścią planu użytkownika i nie powinien zależeć od identyfikatorów skrzyń | PRD / Plan |
| Proporcja | Dodatnia liczba, dziesiętne dozwolone; bez interpretacji w S-03 | Zachowuje liczbową wartość wejściową; alokacja należy do S-04 | PRD / Plan |
| Punkt wejścia | Osobny formularz upraw na istniejącej chronionej stronie /garden | Reuse sesji, odczytu SSR i ścieżki z dashboardu bez mieszania logiki wymiarów | Plan |
| Rozstaw i układ | Poza S-03, do S-04 | Oś i lokalna wartość rozstaw wpływają na obliczenie układu, nie na wybór katalogu | Roadmap / Research |

## Scope

**In scope:** prywatne przechowywanie crop_id i proporcji; RLS i atomowe zastępowanie listy; walidacja znanych ID i dodatnich liczb; formularz wyszukiwania, zaznaczania i zapisu na /garden; testy pgTAP, jednostkowe i smoke.

**Out of scope:** twierdzenie o ogólnopolskim rankingu; tworzenie i edycja gatunków; przypisanie do skrzyń; interpretacja proporcji; algorytm rozmieszczenia; walidacja rozstaw; kalendarz i przypomnienia.

## Architecture / Approach

Dodajemy tabelę garden_crops powiązaną z prywatnym rekordem gardens. Zalogowany endpoint waliduje ID przez istniejący katalog i deleguje atomowy zapis do RPC chronionego RLS. Strona SSR /garden odtwarza dane w niezależnym formularzu React korzystającym z bieżących funkcji wyszukiwania.

## Phases at a Glance

| Phase | What it delivers | Key risk |
|---|---|---|
| 1. Prywatny zapis upraw | Model, walidacja, RPC i testy prywatności | Zachować izolację od garden_spaces i poprawnie zastępować listę |
| 2. Wybór w /garden | Wyszukiwanie, proporcje, zapis/odczyt i smoke test | Nie zmienić semantyki proporcji ani nie pokazać pozornego rankingu |

**Prerequisites:** F-01 i S-01 są ukończone; katalog ma 30 zaakceptowanych kandydatów; lokalny Supabase/Docker jest potrzebny do testów DB.
**Estimated effort:** około 1–2 sesji implementacyjnych w dwóch fazach, korzystając z istniejącego wzorca S-02.

## Open Risks & Assumptions

- Lista 30 warzyw nie jest poparta reprezentatywnym rankingiem krajowym; UI i dokumentacja muszą pozostać neutralne rankingowo.
- Stabilne crop_id są referencją dla zapisanych wyborów; zmiana ID wymagałaby migracji lub kompatybilności wstecznej.
- Proporcje są zachowywane jako dodatnie wartości liczbowe; algorytm wykorzystania tych wartości pozostaje otwarty do S-04.

## Success Criteria (Summary)

- Użytkownik może wyszukać warzywa, ustawić proporcje, zapisać je i zobaczyć ponownie po odświeżeniu.
- Dane są prywatne, walidowane względem katalogu i niezależne od listy skrzyń.
- Testy DB, jednostkowe, Astro check, lint, build i smoke potwierdzają przepływ bez regresji.
