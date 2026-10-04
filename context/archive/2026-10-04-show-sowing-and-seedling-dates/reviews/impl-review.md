<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Terminy siewu i prace sezonowe

- **Plan**: context/changes/show-sowing-and-seedling-dates/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1
- **Date**: 2026-10-04
- **Verdict**: APPROVED
- **Findings**: 0 critical, 2 warnings, 0 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | PASS |
| Safety & Quality | PASS |
| Architecture | PASS |
| Pattern Consistency | PASS |
| Success Criteria | PASS |

## Findings

### F1 — Harmonogram nie odświeża się po zmianie miesiąca

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Plan Adherence
- **Location**: src/components/garden/SeasonWorkSchedule.tsx:38
- **Detail**: `subscribeToMonthChanges` jest no-opem, więc `useSyncExternalStore` nie dostaje powiadomienia o zmianie snapshotu. Gdy użytkownik pozostawi `/garden` otwarte przez zmianę miesiąca, etykiety i filtrowanie listy pozostaną przy poprzednim miesiącu aż do innego renderu. Plan zakłada odświeżanie listy przy zmianie miesiąca.
- **Fix**: Dodaj odświeżanie miesiąca przez nasłuch widoczności/fokusu oraz timer do następnej lokalnej granicy miesiąca, z czyszczeniem subskrypcji i testem deterministycznej logiki odświeżania.
- **Decision**: FIXED — subskrypcja teraz odświeża snapshot na granicy lokalnego miesiąca oraz po powrocie na widoczną kartę; testuje wyliczanie opóźnienia dla przejścia roku i roku przestępnego.

### F2 — Późniejsze okno niskiej pewności wygląda jak potwierdzona praca

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/components/garden/SeasonWorkSchedule.tsx:117
- **Detail**: Karta nazywa pozycje „potwierdzonymi”, ale `getNextSeasonWork` może zwrócić okno z `confidence: "low"`, np. przedzimowy siew marchwi (`src/data/crop-catalog.ts`, wpis `marchew`). W przeciwieństwie do zwykłej listy karta nie pokazuje zakresu okna ani poziomu pewności, przez co upraszcza metadane i może sugerować silniejsze zalecenie niż dane uzasadniają.
- **Fix**: Pokaż zakres miesięcy i poziom pewności w karcie oraz zmień jej nagłówek, aby nie sugerował potwierdzenia niezależnie od confidence.
- **Decision**: FIXED — karta używa określenia „termin orientacyjny” i pokazuje zakres okna oraz poziom pewności.

## Review Notes

- Zgodność z planem: katalog, niezależne przykłady testowe, helper, oba widoki, wpis cookbook i testy są obecne. Dodatkowe komponenty źródeł i harmonogramu służą zaplanowanym widokom.
- Zakres: nie znaleziono nieuzasadnionych zmian implementacyjnych poza planem.
- Kryteria automatyczne: `npm run test:unit` — PASS (8 plików, 97 testów unit; 3 pliki, 33 testy API); `npm run lint` — PASS; `npx astro check` — PASS (65 plików, 0 błędów/ostrzeżeń); `npm run build` — PASS (pozostaje istniejące ostrzeżenie sitemap o braku `site`).
- Kryteria ręczne: użytkownik potwierdził widok szczegółów dla rukoli i pomidora, linki źródeł oraz komunikat pustego okresu i najbliższych późniejszych prac; użytkownik zatwierdził audyt źródeł S-06.
- Test odporności: po celowym zwróceniu pustej listy przez helper nowy test zakończył się błędem (3 przypadki wykryły regresję); zmiana została przywrócona przed commitem.
- Triage F1: testy po poprawce — `npm run test:unit` PASS (99 testów unit; 33 API), `npx eslint` dla trzech zmienionych plików S-06 PASS, `npx astro check` PASS (71 plików), `npm run build` PASS. Pełny `npm run lint` zatrzymuje się na błędach w poza-S-06 plikach `scripts/e2e-preview.mjs` i `tests/e2e/fixtures/garden.ts` z bieżących niezatwierdzonych zmian.
- Triage F2: po aktualizacji karty ponownie przeszły testy unit/API, `npx astro check`, build i ESLint dla trzech zmienionych plików S-06. Pełny lint pozostaje zablokowany wyłącznie przez wymienione wyżej błędy poza zakresem S-06.
