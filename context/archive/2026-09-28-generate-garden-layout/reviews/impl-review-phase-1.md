<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Generowanie układu warzywnika — Plan implementacji

- **Plan**: `context/changes/generate-garden-layout/plan.md`
- **Scope**: Phase 1 of 3
- **Reviewed phases**: 1
- **Date**: 2026-09-29
- **Verdict**: NEEDS ATTENTION
- **Findings**: 0 critical, 4 warnings, 0 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | FAIL |
| Scope Discipline | PASS |
| Safety & Quality | WARNING |
| Architecture | PASS |
| Pattern Consistency | PASS |
| Success Criteria | PASS |

## Findings

### F1 — Miks procentowy jest optymalizowany osobno dla każdej przestrzeni

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Plan Adherence
- **Location**: `src/lib/garden-layout.ts:226`
- **Detail**: `scoreCandidate` oblicza presję celu na podstawie lokalnego `placed`, które jest zerowane przy rozpoczęciu każdej przestrzeni. PRD i plan definiują procenty jako cel dla całej działki, a końcowe podsumowanie liczy udział globalnie. Przy nierównych skrzyniach/sektorach algorytm może więc optymalizować każde z osobna i zwrócić globalny miks odległy od celu. Test wielu przestrzeni używa dwóch jednakowych skrzyń i nie ujawnia tego przypadku.
- **Fix**: Oprzeć presję celu na dotychczasowych pozycjach/liczebnościach ze wszystkich wcześniej przetworzonych przestrzeni; dodać test z przestrzeniami o różnych pojemnościach.
  - Strength: Punktacja będzie zgodna z kontraktem procentów dla całej działki.
  - Tradeoff: Wymaga przekazania globalnego stanu miksu do punktacji kolejnych przestrzeni.
  - Confidence: HIGH — aktualny kod używa lokalnego `placed`, a wymaganie globalnego miksu jest zapisane w PRD i planie.
  - Blind spot: Nie zmierzono jeszcze wpływu tej zmiany na kompromis między dobrym sąsiedztwem a dopasowaniem procentów.
- **Decision**: FIXED — target-pressure scoring now uses global crop counts; added a regression test across two spaces.

### F2 — Limit siatki kandydatów obcina układ po cichu

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality
- **Location**: `src/lib/garden-layout.ts:197`
- **Detail**: `makeCandidates` zachowuje najwyżej pierwsze 256 punktów na uprawę, ale nie sygnalizuje, że siatka została ucięta. Dla rzodkiewki na przestrzeni 200×100 cm robocza rozstawa 2×10 cm daje około 1000 punktów siatki, więc algorytm może pominąć poprawne miejsca bez ustawienia `limitReached` ani ostrzeżenia. Wybranie wyczerpanej, obciętej listy może też zostać sklasyfikowane jako brak geometrii. Plan wymaga jawnego ostrzeżenia po osiągnięciu budżetu i testu limitu; obecny test nie sprawdza limitu przeszukiwania.
- **Fix**: Generować kandydatów leniwie w ramach wspólnego budżetu albo wykrywać obcięcie, jawnie ostrzegać i nie przedstawiać go jako potwierdzonego konfliktu geometrii; dodać test gęstej grządki oraz limitu.
  - Strength: Wynik nie będzie po cichu udawał, że przeszukano całą przestrzeń.
  - Tradeoff: Pełniejsze przeszukiwanie musi pozostać w budżecie czasu Cloudflare, który plan ogranicza.
  - Confidence: HIGH — limit 256 jest jawny, a metryka ostrzeżenia obejmuje tylko `candidateLimit`.
  - Blind spot: Nie zweryfikowano docelowego maksymalnego kosztu dla skrajnych wymiarów akceptowanych przez aplikację.
- **Decision**: FIXED — candidate grids report exact truncation counts per space and crop; incomplete searches are marked `search_limit` instead of a geometry conflict, with a dense-bed regression test.

### F3 — Rozstaw siewu jest raportowany jako liczba roślin

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Plan Adherence
- **Location**: `src/lib/garden-layout.ts:112`
- **Detail**: Walidacja użytecznej rozstawy sprawdza nazwane osie, ale ignoruje `isFinalPlanting`. W katalogu groch i bób mają etap `sowing` oraz `isFinalPlanting: false`; mimo to ich pozycje trafiają do `actualCount` i procentowego udziału roślin. To miesza stanowiska wysiewu z końcową liczbą roślin, której udział procentowy obiecuje PRD.
- **Fix A ⭐ Recommended**: Nie używać rozstawy niekońcowej do liczenia roślin; zwracać jawną przyczynę braku końcowej rozstawy, dopóki katalog jej nie dostarczy.
  - Strength: Zachowuje znaczenie procentów jako udziału liczby roślin.
  - Tradeoff: Groch i bób mogą dać częściowy układ do czasu zebrania końcowej obsady.
  - Confidence: HIGH — oba rekordy jawnie oznaczają rozstaw jako siewną, niekońcową.
  - Blind spot: Nie potwierdzono jeszcze końcowej rozstawy dla tych upraw w researchu.
- **Fix B**: Jawnie modelować pozycje jako stanowiska siewu i oddzielić ich liczbę od końcowych procentów roślin.
  - Strength: Pozwala zachować obecne dane siewne i może wspierać późniejszy etap przerzedzania.
  - Tradeoff: Wymaga osobnego modelu stanowisk/roślin oraz prezentacji wyniku, poza obecnym prostym kontraktem pozycji.
  - Confidence: MED — możliwe, ale wymaga szerszej zmiany modelu wyniku.
  - Blind spot: Nie zbadano jeszcze, jak aplikacja będzie przedstawiać wysiewy i przerzedzanie.
- **Decision**: FIXED — crops with `isFinalPlanting: false` are omitted with `non_final_spacing`, and a regression test verifies peas and broad beans are not counted.

### F4 — Relacja nie-negatywna może zablokować pozycję

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision. Fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: `src/lib/garden-layout.ts:140`
- **Detail**: `getHardBlockers` ufa samemu `hardBlock`. Domyślny katalog waliduje zgodność tej flagi ze statusem `negative`, ale opcjonalne `input.relations` może zawierać np. `status: "supported", hardBlock: true`, co ominie walidację katalogu i zabroni ustawienia obok siebie wbrew regule „tylko negatywne blokuje”.
- **Fix**: Wymagać jednocześnie `status === "negative"` i `hardBlock === true` w predykacie blokującym.
- **Decision**: FIXED — only adjacent relations with `status: "negative"` and `hardBlock: true` block placement; added a regression test for inconsistent supported metadata.

## Verification

- `npm run test:unit` — PASS; 5 plików testowych, 50 testów zaliczonych.
- `npx astro check` — PASS; 45 plików, 0 błędów, 0 ostrzeżeń, 0 podpowiedzi.
- `npm run lint` — PASS.
- `git diff --check` — PASS; jedynie ostrzeżenia Git o przyszłej konwersji LF/CRLF w istniejących dokumentach.
- Phase 1 nie ma ręcznych punktów weryfikacji.

### Post-triage verification — F1 (2026-09-29)

- `npm run test:unit` — PASS; 5 plików testowych, 51 testów zaliczonych.
- `npx astro check` — PASS; 45 plików, 0 błędów, 0 ostrzeżeń, 0 podpowiedzi.
- `npm run lint` — PASS.
- `git diff --check` — PASS; ostrzeżenia LF/CRLF jak wyżej.

### Post-triage verification — F2 (2026-09-29)

- `npm run test:unit` — PASS; 5 plików testowych, 52 testy zaliczone.
- `npx astro check` — PASS; 45 plików, 0 błędów, 0 ostrzeżeń, 0 podpowiedzi.
- `npm run lint` — PASS.
- `git diff --check` — PASS; ostrzeżenia LF/CRLF jak wyżej.

### Post-triage verification — F3 (2026-09-29)

- `npm run test:unit` — PASS; 5 plików testowych, 53 testy zaliczone.
- `npx astro check` — PASS; 45 plików, 0 błędów, 0 ostrzeżeń, 0 podpowiedzi.
- `npm run lint` — PASS.
- `git diff --check` — PASS; ostrzeżenia LF/CRLF jak wyżej.

### Post-triage verification — F4 (2026-09-29)

- `npm run test:unit` — PASS; 5 plików testowych, 54 testy zaliczone.
- `npx astro check` — PASS; 45 plików, 0 błędów, 0 ostrzeżeń, 0 podpowiedzi.
- `npm run lint` — PASS.
- `git diff --check` — PASS; ostrzeżenia LF/CRLF jak wyżej.
