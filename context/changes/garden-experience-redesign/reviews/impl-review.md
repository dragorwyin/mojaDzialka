<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Spójne doświadczenie Moja Działka od strony publicznej po planer

- **Plan**: `context/changes/garden-experience-redesign/plan.md`
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3, 4, 5
- **Date**: 2026-10-11
- **Verdict**: NEEDS ATTENTION
- **Findings**: 0 critical, 2 warnings, 3 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | WARNING |
| Scope Discipline | WARNING |
| Safety & Quality | PASS |
| Architecture | PASS |
| Pattern Consistency | WARNING |
| Success Criteria | WARNING |

## Findings

### F1 — Faza 5 nie ma zrzutów dashboardu i aliasu

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: `context/changes/garden-experience-redesign/plan.md:211`
- **Detail**: Kontrakt fazy 5 wymaga desktopowych i mobilnych zrzutów `/dashboard` z trzema zakładkami oraz przekierowania `/garden`. Zatwierdzony zestaw zawiera landing, signin/signup i dwa kitchen sinki, lecz nie te widoki. `change.md` odnotowuje prywatność konta jako powód pominięcia dashboardu; użytkownik zaakceptował dashboard ręcznie w fazie 4. Mimo tego progress 5.3 deklaruje obejrzenie wszystkich ekranów w fazie 5, więc checklistę i dowody dzieli rozbieżność.
- **Fix**: Uzupełnić deterministyczne, pozbawione prywatnych danych zrzuty dashboardu i `/garden` na desktopie/mobile albo doprecyzować kryterium oraz opis odbioru, że dashboard i alias odebrano w fazie 4, bez zrzutów fazy 5.
- **Decision**: FIXED
- **Resolution**: Dodano desktopowe i mobilne zrzuty trzech zakładek dashboardu oraz widoku aliasu `/garden` do `output/playwright/garden-experience-redesign/`. Zrzuty wykonano na lokalnym, fikcyjnym koncie i przykładowych danych ogrodu; konto wraz z powiązanymi danymi usunięto po sesji. Widoki `/dashboard` oraz zachowanie przekierowania `/garden` zweryfikowano w przeglądarce.

### F2 — Zatwierdzony mockup pozostaje nieśledzony

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Scope Discipline
- **Location**: `context/changes/garden-experience-redesign/design/index.html`
- **Detail**: Plan fazy 1 określa mockup jako trwały artefakt zmiany. Plik istnieje w katalogu roboczym, ale nie należy do zakresu commitów `7dd3895^..4792f8b`; nadal jest nieśledzony. Podobnie nieśledzone są `frame.md`, `plan-brief.md` i `research.md`, które plan wymienia jako źródła. Ich pozostawienie poza commitem było decyzją odbioru stagingu; nie zmienia to faktu, że nie są przenośną częścią historii zmiany.
- **Fix**: Zachować te zatwierdzone materiały w repozytorium w osobnym, jawnym commicie artefaktów zmiany, albo świadomie przenieść/archiwizować je według konwencji repozytorium przed archiwizacją tej zmiany.
- **Decision**: FIXED
- **Resolution**: Zachowano zatwierdzony mockup oraz źródłowe materiały `frame.md`, `plan-brief.md` i `research.md` w repozytorium osobnym commitem dokumentacji, żeby historia zmiany zawierała podstawę decyzji projektowych.

### F3 — Postęp odbioru w `change.md` jest nadal oznaczony jako pending

- **Severity**: 👁️ OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: `context/changes/garden-experience-redesign/change.md:20`
- **Detail**: Frontmatter wskazuje `status: implemented`, a wszystkie pozycje fazy 5 w planie są ukończone; jednocześnie ogólna pozycja „Wykonać odbiór wizualny...” w `change.md` pozostaje niezaznaczona.
- **Fix**: Po rozstrzygnięciu F1 ujednolicić checkbox podsumowujący z faktycznym stanem odbioru.
- **Decision**: PENDING

### F4 — Widoki używają arbitralnych wartości Tailwinda

- **Severity**: 👁️ OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: `src/pages/dashboard.astro:224`, `src/pages/dashboard.astro:249`
- **Detail**: `tracking-[0.16em]` stosuje arbitrary Tailwind values w widoku, wbrew UI guard w `AGENTS.md`, który wymaga semantycznych tokenów lub wspólnych prymitywów.
- **Fix**: Zastąpić named utility albo semantycznym tokenem typograficznym zgodnym z istniejącym systemem.
- **Decision**: PENDING

### F5 — Powtórny lint nie zakończył się w przeglądzie

- **Severity**: 👁️ OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: `npm run lint`
- **Detail**: `npm run build` zakończył się powodzeniem (pozostało znane ostrzeżenie sitemap o braku opcji `site`), a `git diff --check 7dd3895^..4792f8b` jest czysty. Powtórny `npm run lint` wypisał token scan bez naruszeń, po czym ESLint nie zwrócił dalszego wyjścia przez ponad minutę; proces został przerwany. `change.md` zawiera wcześniejszy zapis udanego lint dla fazy 5, ale ta próba przeglądowa nie dostarczyła nowego końcowego statusu.
- **Fix**: Ponowić `npm run lint` w działającym środowisku przed zamknięciem otwartych uwag.
- **Decision**: PENDING

## Additional review notes

- Zmiana SSR `/dashboard`, alias `/garden`, redirecty auth/zapisu oraz zachowanie tabów odpowiadają planowi; brak stwierdzonej niezgodności w tych ścieżkach.
- Nie znaleziono problemów krytycznych bezpieczeństwa, niezawodności, wydajności ani granic architektury.
- Uwaga użytkownika o zbyt abstrakcyjnych ilustracjach jest jawnie odnotowana jako osobne przyszłe usprawnienie i nie jest traktowana jako nieuzgodniony scope creep.
