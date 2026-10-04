# Zmiana danych i ponowne przeliczenie planu — Plan Brief

> Full plan: `context/changes/update-and-recalculate-plan/plan.md`
> Research: `context/changes/update-and-recalculate-plan/research.md`

## What & Why

S-05 domyka zmianę zapisanych danych wejściowych i ponowne generowanie planu. Dodanie lub usunięcie skrzyni albo sektora może unieważnić bieżący układ, dlatego użytkownik potwierdzi tę zmianę przed zapisem. Zmiany wymiarów, upraw i proporcji pozostawią stary wynik widoczny ze statusem nieaktualności, aż użytkownik uruchomi pełne przeliczenie.

## Starting Point

Formularz przestrzeni nie ostrzega i RPC wymienia wszystkie wiersze, zmieniając ich ID. Planner już oznacza nieaktualność po zmianie snapshotu, a endpoint ponownego przeliczenia używa aktualnych zapisanych danych i zastępuje jeden plan na działkę.

## Desired End State

Potwierdzenie dodania/usunięcia zapisuje zmienioną listę przestrzeni i usuwa poprzedni plan atomowo. Anulowanie lub błąd zapisu zachowuje dotychczasowe dane i plan. Pozostałe edycje oznaczają plan jako nieaktualny, a udane pełne przeliczenie zastępuje go nowym wynikiem.

## Key Decisions Made

| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| Usunięcie planu po zmianie listy | Usunąć zapisany plan po potwierdzeniu i udanym zapisie przestrzeni | Spełnia FR-003, ograniczając ryzyko utraty przy błędzie | Plan |
| Zakres ostrzeżenia | Dodanie/usunięcie skrzyni lub sektora; inne zmiany tylko oznaczają plan jako nieaktualny | Oddziela destrukcyjną zmianę listy od edycji danych | Plan / PRD |
| Tożsamość przestrzeni | Zachować ID przestrzeni, które pozostają na liście | Pozwala wykryć rzeczywiste dodanie/usunięcie; edycja wymiarów nadal zmienia fingerprint | Research / Plan |
| Przeliczanie | Pełny układ na podstawie zapisanych danych; zastąpienie bieżącego wyniku po sukcesie | Zgodne z istniejącym endpointem i decyzją S-05 o braku historii sezonów | Roadmap / S-04 |
| Zakres przestrzeni | Skrzynie i sektory mają to samo zachowanie | FR-003 wymienia oba typy | PRD |

## Scope

**In scope:** ostrzeżenie z możliwością anulowania przed dodaniem/usunięciem przestrzeni; stabilne ID zachowanych przestrzeni; atomowe usunięcie planu po udanym zapisie strukturalnym; zachowanie stale po pozostałych edycjach; regresyjne sprawdzenie ponownego przeliczenia.

**Out of scope:** historia sezonów, ręczne rozmieszczanie roślin, zmiana generatora lub katalogu upraw.

## Architecture / Approach

Formularz przestrzeni przesyła istniejące ID i przed strukturalną zmianą prosi o potwierdzenie. Funkcja `save_garden_spaces` porównuje stare i nowe ID, utrzymuje zachowane wiersze i usuwa plan w tej samej transakcji wyłącznie po dodaniu/usunięciu. Istniejące SSR i planner obsługują zmiany innych danych jako stale; endpoint regeneracji zapisuje pełny nowy wynik po udanym obliczeniu.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Potwierdzenie zmian przestrzeni i bezpieczne przeliczenie | Atomowe zapisanie przestrzeni, warunkowe usunięcie planu i regresyjnie sprawdzony cykl stale → recalculate | Ciche usunięcie wyniku lub zmiana planu przy nieudanym zapisie |

**Prerequisites:** S-04, istniejący kontrakt prywatnej działki i planu.  
**Estimated effort:** Jedna spójna faza; kalendarzowego czasu nie szacowano.

## Open Risks & Assumptions

- Zmiana funkcji SQL musi odrzucać identyfikatory spoza działki zalogowanego użytkownika i zachować rollback przestrzeni oraz planu jako jednej operacji.
- Lista przestrzeni pozostaje niepusta; usunięcie ostatniej pozycji jest już wyłączone przez formularz i walidację bazy.

## Success Criteria (Summary)

- Dodanie/usunięcie skrzyni lub sektora wymaga potwierdzenia, a anulowanie i błąd zapisu zachowują plan.
- Zmiany wymiarów, upraw i proporcji pozostawiają plan widoczny jako nieaktualny do ponownego przeliczenia.
- Udane przeliczenie zastępuje jeden plan działki, a walidacja zachowuje izolację użytkowników.
