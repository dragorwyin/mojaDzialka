<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Katalog roślin i czytelność układu

- **Plan**: context/changes/garden-crop-catalog-and-layout/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3
- **Date**: 2026-10-03
- **Baseline**: 0a7a3db (kod Phase 3: abe64dc)
- **Verdict**: NEEDS ATTENTION
- **Findings**: 0 critical, 1 warning remaining, 0 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | WARNING |
| Scope Discipline | PASS |
| Safety & Quality | WARNING |
| Architecture | PASS |
| Pattern Consistency | PASS |
| Success Criteria | PASS |

## Verification and scope

Przegląd obejmuje wszystkie 19/19 ukończonych kroków, analizę głównego agenta oraz dwa niezależne przeglądy: zgodność z planem i bezpieczeństwo/jakość. Powiązane, zaakceptowane follow-upy diagramu stanowią część implementacji, nie scope creep. Minimum 7 cm dla marchwi zastępuje historyczne 3–5 cm; adaptacyjna siatka była zaakceptowanym ograniczeniem kosztu renderowania.

| Check | Result |
|-------|--------|
| npm run test:unit | PASS — 6 plików, 69 testów |
| npx astro check | PASS — 53 pliki, 0 errors/warnings/hints |
| npm run lint | PASS — w tym kontrola tokenów UI |
| npm run build | PASS — nieblokujące ostrzeżenie sitemap o braku site |
| supabase test db | PASS — 4 pliki, 75 testów |
| npm run smoke | PASS — lokalny worker, zapis/odczyt, current/stale, regeneracja i izolacja kont |

Celowo uruchomiono bezpośrednio istniejącą suite DB zamiast wrappera npm run test:db: wrapper wykonuje db reset --local --no-seed, który usuwa lokalne dane użytkownika. Nie wykonano resetu; ta zmiana nie dodaje migracji. Wynik nie potwierdza odtworzenia bazy od zera. Smoke zakończył się powodzeniem mimo przejściowych rozłączeń lokalnego ProxyWorker obsłużonych przez retry. Worker uruchomiony do weryfikacji został zatrzymany.

Testy ręczne uznano za potwierdzone na podstawie wypowiedzi użytkownika: informacje o roślinach zrozumiałe, desktop/mobile poprawne, Tab działa, stary plan oznaczony nieaktualnym, wycofane wybory można zastąpić i wygenerować nowy plan. Nie wymagano ponownego potwierdzania. Nie znaleziono naruszenia izolacji właścicieli ani zmian RLS. Nie wymagano interaktywności każdego dekoracyjnego znacznika: szczegóły są dostępne w listach na stronie.

## Findings

### F1 — Niepełna walidacja zapisanego JSON-u planu

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality
- **Location**: src/lib/garden-layout.ts:150; src/components/garden/GardenLayoutView.tsx:338
- **Detail**: readGardenLayoutResult sprawdza kontenery i część pozycji, ale nie wszystkie zagnieżdżone pola używane przez renderer. Próba wykonująca rzeczywistą funkcję potwierdziła akceptację cropSummaries:[null]; odczyt summary.cropId kończy się TypeError. Nieprawidłowy targetPercentage lub neighbor.sourceIds również może złamać renderowanie. Baza sprawdza wyłącznie obiekt JSON, a właściciel ma możliwość aktualizacji własnego planu. To problem odporności widoku, nie dostęp do cudzych danych.
- **Fix**: Walidator sprawdza teraz pola konsumowane przez widok, typy elementów tablic i skończoną geometrię; uszkodzone dane odrzuca do istniejącego stanu unavailable, zachowując opcjonalne pola starszych planów.
  - Strength: Zabezpiecza wspólną granicę SSR i zachowuje zgodność ze starymi planami.
  - Tradeoff: Trzeba jawnie ustalić wymagane i opcjonalne pola wersji historycznych.
  - Confidence: HIGH — konkretny błędny obiekt przechodzi aktualną funkcję.
  - Blind spot: Nie wstrzyknięto uszkodzonych danych do bazy użytkownika; wyjątek odtworzono lokalnie na ścieżce walidacji i dereferencji, nie pełnym SSR.
- **Decision**: FIXED — walidacja zagnieżdżonych danych w readGardenLayoutResult. Po zmianie `npx astro check`: PASS (53 pliki, 0 błędów/ostrzeżeń/hintów). Testów nie uruchamiano.

### F2 — Wycofane rośliny nie blokują generowania

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: src/pages/garden.astro:175; src/components/garden/GardenPlanner.tsx:63
- **Detail**: Formularz wymaga usunięcia/zastąpienia wycofanego bobu lub fasoli przed zapisem, lecz hasCrops bazuje wyłącznie na długości listy. Przycisk generowania pozostaje aktywny; API odrzuca nierozwiązane ID jako invalid_crops, a interfejs pokazuje ogólny błąd. Obsługa historycznych wyborów nie jest spójna między formularzem i generowaniem.
- **Fix**: Strona wykrywa zapisane nierozwiązane ID przez resolveGardenCropSelection; planner blokuje generowanie i podaje instrukcję usunięcia/zamiany. Po poprawnym zapisie formularz emituje stan resolved i planner odblokowuje generowanie.
- **Decision**: FIXED — blokada generowania dla wycofanych/nierozpoznanych wyborów. Test helpera używanego przez planner: PASS; `npx astro check`: PASS (53 pliki, 0 błędów/ostrzeżeń/hintów).

### F3 — Brak widocznego fallbacku po błędzie ładowania atlasu

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: src/components/garden/GardenLayoutView.tsx:101
- **Detail**: Tekstowy fallback dotyczy wyłącznie ID bez miniaturek. Błąd pobrania crop-atlas.webp nie zmienia prezentacji: znane rośliny pozostają białymi kołami bez widocznego rozróżnienia. Legenda i etykiety dostępności pozostają, ale diagram traci identyfikację roślin. Wniosek z kodu; nie przeprowadzono testu blokowania zasobu w przeglądarce.
- **Fix**: CropAtlasGlyph przełącza się na kod z legendy po błędzie ładowania obrazu atlasu; standardowy tryb miniaturek pozostaje bez zmian.
- **Decision**: FIXED — fallback kodu na onError zasobu atlasu, zaakceptowany przez użytkownika. `npx astro check`: PASS (53 pliki, 0 błędów/ostrzeżeń/hintów).

### F4 — Podpis siatki zawsze podaje 10 cm

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: src/components/garden/garden-layout-diagram.ts:34; src/components/garden/GardenLayoutView.tsx:259
- **Detail**: Zaakceptowane ograniczenie do 100 linii na oś zwiększa krok dla dużych przestrzeni, ale podpis nadal mówi „Siatka co 10 cm”. Dla szerokości 2000 cm funkcja ustala 20 cm, dla 100000 cm — 1000 cm. Współrzędne roślin pozostają rzeczywiste; błędna jest informacja dla użytkownika, nie adaptacyjność siatki.
- **Fix**: GardenDiagramProjection udostępnia rzeczywisty gridStepCm; podpis diagramu używa tej wartości.
- **Decision**: FIXED — podpis pokazuje krok wyliczony dla wymiarów przestrzeni; test kroku 10 cm i 1000 cm: PASS. `npx astro check`: PASS (53 pliki, 0 błędów/ostrzeżeń/hintów).

### F5 — Starsze generowanie może nadpisać nowszy plan

- **Severity**: ⚠️ WARNING
- **Impact**: 🔬 HIGH — architectural stakes; think carefully before deciding
- **Dimension**: Safety & Quality
- **Location**: src/pages/api/garden-plan.ts:112; src/components/garden/GardenPlanner.tsx:118
- **Detail**: Zapis jest bezwarunkowym upsert po oddzielnych odczytach wejścia. Możliwy przeplot: żądanie A odczytuje stare dane; użytkownik zmienia je i B zapisuje nowy plan; spóźnione A nadpisuje B. inputRevision chroni wyłącznie lokalny komponent, nie inne karty ani serwer. Ponowny odczyt oznaczy wynik jako stale, ale nowszy wynik został zastąpiony. To istniejąca ścieżka persystencji używana przez ocenianą zmianę, nie udowodniona nowa regresja. Wniosek z analizy przeplotu; smoke sprawdza sekwencję, nie współbieżność.
- **Fix**: Wprowadzić serwerową rewizję wejścia i atomowy warunkowy zapis wyniku dla tej rewizji; odrzucać spóźnione żądanie i pokazać potrzebę ponowienia. Dodać kontrolowany test przeplotu A/B.
  - Strength: Chroni zapis między kartami i żądaniami, nie tylko lokalny stan React.
  - Tradeoff: Zmiana kontraktu persystencji, prawdopodobnie migracja/RPC; wymaga osobnego ograniczonego planu.
  - Confidence: MED — brak warunku jest widoczny, ale nie wykonano równoległego harnessu HTTP.
  - Blind spot: Częstotliwość rzeczywistego przeplotu i zachowanie docelowego deploymentu nie były mierzone.
- **Decision**: SKIPPED — świadomie pominięte na prośbę użytkownika.
