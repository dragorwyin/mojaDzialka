# Bezpieczny zapis i dostęp — Plan Brief

> Full plan: `context/changes/testing-safe-garden-storage/plan.md`

## What & Why

Domykamy drugi etap strategii testowej: zachowanie planu podczas błędów, prywatność kont oraz czytelne niepowodzenie przy awarii bazy. Najtańszy wiarygodny sygnał dają testy rzeczywistej bazy i rzeczywistych handlerów API z kontrolowaną odpowiedzią klienta Supabase.

## Starting Point

Projekt ma 102 asercje SQL, siedem plików unit i smoke na preview. Zapis wejść zwiększa rewizję, a guarded RPC odrzuca przeliczenie oparte na starej rewizji. Brakuje pełnych porównań stanu po rollbacku, wariantu zmiany upraw i kontrolowanych błędów API.

## Desired End State

Testy dowodzą izolacji kont i zachowania danych po nieudanym zapisie. API nie zgłasza sukcesu po awarii ani po odrzuceniu starego wyniku. Nowe przypadki wykonują się w istniejącym CI, a cookbook wskazuje sprawdzone wzorce.

## Key Decisions Made

| Decision      | Choice                                            | Why                                                  | Source          |
| ------------- | ------------------------------------------------- | ---------------------------------------------------- | --------------- |
| Warstwy       | Rzeczywista baza SQL + handlery z mockiem klienta | Osobny dowód trwałości i obsługi HTTP                | Strategy / Plan |
| Awaria        | Kontrolowany błąd na granicy Supabase             | Determinizm bez proxy i zatrzymywania bazy           | User            |
| Wykryty błąd  | Minimalna poprawka + reprodukcja w bugs.md        | Naprawa obecnego kontraktu i gotowy ślad do 10x flow | User            |
| CI            | test:api dołączone do obecnego test:unit          | Brak nowego YAML i cichego pominięcia plików         | Plan            |
| Anulowanie UI | Rollout Phase 3                                   | Baza i handler nie dowodzą kliknięcia w przeglądarce | Strategy        |
| Współbieżność | Stara rewizja w SQL i 409 w API                   | Chroni kontrakt bez kosztownego harnessu dwóch sesji | Plan            |

## Scope

**In scope:** rozszerzenie SQL, kontrolowane błędy i konflikty POST, minimalne naprawy, dokumentacja błędów, uruchamianie w obecnych bramkach i cookbook §6.3–§6.4.

**Out of scope:** e2e, wizualne testy, proxy, hooki, nowe zależności, przebudowa CI, historia sezonów, zmiana algorytmu i test harmonogramu blokad dwóch sesji.

## Architecture / Approach

SQL sprawdza pełny stan przed/po: przestrzenie, uprawy, rewizję oraz JSON/snapshot/fingerprint/czas planu. Vitest uruchamia rzeczywiste POST, mockując wyłącznie fabrykę klienta. Generator i walidacja pozostają rzeczywiste; mock nie stanowi dowodu rollbacku. Obecny smoke sprawdza prawdziwe HTTP i sesje po zmianach.

## Phases at a Glance

| Phase                             | What it delivers                                           | Key risk                            |
| --------------------------------- | ---------------------------------------------------------- | ----------------------------------- |
| 1. Prywatność i atomowość w bazie | Pełny rollback, obce konto/anon, stare rewizje             | Utrata lub cudza mutacja danych     |
| 2. Błędy i konflikty w API        | test:api, kontrolowane awarie, minimalne naprawy i bugs.md | Fałszywy sukces lub ukryty konflikt |
| 3. Weryfikacja i dokumentacja     | Obecne bramki obejmują API; cookbook i rollout aktualne    | Test pominięty w CI lub brak wzorca |

**Prerequisites:** lokalny Docker/Supabase do SQL, skonfigurowany lokalny preview do smoke; Node i obecne zależności do API. Brak środowiska pozostawia bramkę niezaliczoną.

**Estimated effort:** Trzy etapy; czas zależy od faktycznych defektów. Nie oszacowano godzin ani terminu.

## Open Risks & Assumptions

- Mockowanie odbywa się przed importem handlera, aby nie ładować astro:env/server; testowa konfiguracja zapewnia alias @/.
- Sekwencyjna rewizja i mockowane 409 nie dowodzą harmonogramu równoczesnych transakcji.
- Duży defekt wymagający nowej decyzji zostaje opisany jako follow-up i blokuje odpowiednie kryterium; nie jest przemilczany.
- Każdy faktycznie wykryty błąd ma fixture, expected/actual, przyczynę, poprawkę, test i gotowe komendy 10x. Naprawione błędy oznaczamy resolved-here. Nie tworzymy sztucznych zgłoszeń.

## Success Criteria (Summary)

- Obce konto i anon nie odczytują ani nie zmieniają prywatnych danych; błędy zapisu zachowują pełny stan.
- Awaria API nie udaje sukcesu, a stary wynik jest odrzucany bez zastąpienia planu.
- SQL, unit/API, lint, typecheck, build i lokalny smoke przechodzą; cookbook opisuje realne referencje i granice ochrony.
