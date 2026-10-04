# Test Plan

> Phased test rollout for this project. Strategy is frozen at the top
> (§1–§5); cookbook patterns at the bottom (§6) fill in as phases ship.
> Read before writing any new test.
>
> Refresh: re-run `/10x-test-plan --refresh` when stale (see §8).
>
> Last updated: 2026-10-04

## 1. Strategy

1. **Cost × signal.** Najtańsza rzeczywista ochrona; e2e tylko dla luk przeglądarkowych.
2. **User concerns are first-class evidence.** Priorytet: weryfikacja rozmieszczenia; ograniczenie: czas.
3. **Risks are scenarios, not code locations.** This plan documents *what
   could fail* and *why we believe it's likely* — drawn from documents,
   interview, and codebase *signal* (churn, structure, test base). It does
   NOT claim to know which line owns the failure. That knowledge is
   produced by `/10x-research` during each rollout phase. If the plan and
   research disagree about where the failure lives, research is the
   ground truth.

Zakres: `src/`, `supabase/`, bez testów/generowanych plików. 31 commitów/30d: `src/lib` 15, `src/components/garden` 13, `src/pages/api` 10, `src/pages` 9, `supabase/migrations` 6. Mierz ochronę ryzyk.

## 2. Risk Map

Impact High: utrata/dostęp/publiczny błąd; Medium: degradacja; Low: kosmetyka. Likelihood High: cotygodniowe zmiany/incydent; Medium: sporadyczne; Low: stabilność.

| # | Risk (failure scenario) | Impact | Likelihood | Source (evidence — not anchor) |
|---|---|---|---|---|
| 1 | Zbyt ciasna obsada/rośliny poza skrzynią. | High | High | PRD FR-006; interview Q1/Q3/Q4 |
| 2 | Zmiana/błąd usuwa plan lub oznacza stary jako aktualny. | High | High | PRD FR-003/FR-005; archive S-04/S-05 |
| 3 | Obce konto/anon odczytuje lub zmienia działkę. | High | High | PRD Access Control; archive F-01 |
| 4 | Awaria bazy udaje sukces/blokuje pracę nieczytelnym błędem. | High | High | interview Q2; PRD trwały zapis |
| 5 | Rozmieszczenie narusza priorytety sąsiedztwa/miksu. | Medium | High | PRD FR-004/FR-006; interview Q4 |
| 6 | Niepewne dane udają pewne/uprawa znika bez ostrzeżenia. | Medium | High | PRD Business Logic; roadmap S-04 |

### Risk Response Guidance

| Risk | What would prove protection | Must challenge | Context `/10x-research` must ground | Likely cheapest layer | Anti-pattern to avoid |
|---|---|---|---|---|---|
| #1 | Ręcznie policzone granice/odstępy mieszanych gatunków. | Wygląd dowodzi poprawności. | Jednostki/rozstawa/odległość międzygatunkowa. | unit | Kopia obliczeń generatora. |
| #2 | Anulowanie/błąd/równoczesna zmiana zachowują plan/status. | HTTP dowodzi spójności. | Atomowość/kolejność/aktualność wejść. | integration | Tylko HTTP. |
| #3 | Właściciel ma dostęp; inni nie zmieniają/odczytują danych. | Logowanie wystarcza. | Role/sesje/granice API/bazy. | DB/API integration | Odmowa bez kontroli danych. |
| #4 | Awaria nie udaje sukcesu/utraty danych. | Błąd oznacza pustą działkę. | Obsługa odczytu/zapisu/błędów. | integration | Wymyślanie fallbacku. |
| #5 | Małe przykłady odróżniają kompromis od naruszenia priorytetów. | Równomierność jest wymagana. | Cele/remisy/budżet wyszukiwania. | unit | Estetyka/globalne optimum bez kontraktu. |
| #6 | Wynik ujawnia braki/niepewność. | Katalog jest wzorcem prawdy. | Źródła/dopuszczenie rozstaw. | contract/unit | Snapshot zamiast oracle. |

## 3. Phased Rollout

| # | Phase name | Goal (one line) | Risks covered | Test types | Status | Change folder |
|---|---|---|---|---|---|---|
| 1 | Poprawność decyzji algorytmu | Dowieść geometrii/priorytetów/jawności braków. | #1, #5, #6 | unit + contract | complete | context/changes/testing-algorithm-decisions/ |
| 2 | Bezpieczny zapis i dostęp | Chronić zapis/prywatność podczas błędów. | #2, #3, #4 | DB/API integration | complete | context/changes/testing-safe-garden-storage/ |
| 3 | Krytyczny przepływ i bramki | Domknąć interakcje/CI. | #1–#6 | e2e + gates | not started | — |

Kolejność: obawa → trwałość → interakcje. Każdy etap aktualizuje §6. #4 sprawdza reakcję aplikacji, nie zapobiega zatrzymaniu usługi.

## 4. Stack

Baza **sparse**: 7 unit, 5 SQL, smoke; brak e2e. Wersje: deklaracje, nie instalacje.

| Layer | Tool | Version | Notes |
|---|---|---|---|
| unit/contract | Vitest; checked: 2026-10-04 | ^5.0.2 | Niezależne przypadki. |
| DB integration | Supabase CLI/pgTAP; checked: 2026-10-04 | ^2.23.4/nieustalona | CI 2.117.0; rozbieżność. |
| HTTP integration | Smoke; checked: 2026-10-04 | repo | Mockuj granicę awarii. |
| e2e | Playwright; checked: 2026-10-04 | brak | Dobór: Phase 3. |
| AI-native | Agent; checked: 2026-10-04 | n/a | Kontrprzykłady, opcjonalnie Phase 1. When NOT to use: sędzia odległości/oracle/bramka CI. |

**Stack grounding tools (current session):** Context7: [parametryzacja](https://vitest.dev/guide/), [pgTAP/RLS](https://supabase.com/docs/guides/local-development/testing/overview), [asercje](https://playwright.dev/docs/test-assertions); checked: 2026-10-04. Exa/web, Browser/CUA, GitHub dostępne, nieużyte; CI lokalnie; checked: 2026-10-04. API wersji lokalnych wymagają research.

## 5. Quality Gates

| Gate | Where | Required? | Catches |
|---|---|---|---|
| lint + typecheck + build | CI `ci`: lint, astro check, build | required | Typy, konwencje, budowanie |
| unit | CI `ci`: test:unit | required; nowe przypadki Phase 1 | Regresje algorytmu |
| DB + HTTP integration | CI `smoke`: test:db, preview + smoke | required; nowe przypadki Phase 2 | Izolacja, zapis, błędy |
| krytyczne e2e | CI na PR | required after §3 Phase 3 | Formularze i przejścia stanów |

Phase 3 domyka odkrywanie testów/CI: obecna lista unit jest ograniczona.

## 6. Cookbook Patterns

### 6.1 Geometria i niezależne przypadki referencyjne

- **Lokalizacja:** `src/lib/garden-layout.test.ts`.
- **Nazewnictwo:** opisuj obserwowalne zachowanie lub regresję, np. „keeps …”, „reports …”; nazwa powinna wskazywać kontrakt, nie nazwę funkcji prywatnej.
- **Referencje:** `keeps crop centers half a spacing from every edge on both axes`; `keeps rectangular exclusion separate from elliptical neighbor distance at an axis threshold`; `checks production carrot, onion, and broccoli spacing independently in a mixed layout`.
- **Komenda lokalna:** `npm run test:unit`.
- **Źródło oczekiwań:** ręcznie policzone współrzędne dla jawnych wymiarów skrzyni i stałych rozstaw; dla par mieszanych jawne, niezależne stałe rozstawy wejściowe. Środek rośliny musi leżeć co najmniej w połowie rozstawy od każdej krawędzi na obu osiach. Nie wyliczaj oczekiwanych współrzędnych przez generator ani przez skopiowanie jego obliczeń do helpera testowego.

### 6.2 Priorytety miksu i kontrakt danych

- **Lokalizacje:** `src/lib/garden-layout.test.ts` oraz `src/data/crop-catalog.test.ts`.
- **Nazewnictwo:** nazywaj testy przez widoczny kontrakt lub regresję, np. wybór priorytetu, zachowanie pewności albo jawne zaokrąglenie; nie koduj w nazwie wewnętrznego rankingu.
- **Referencje:** `keeps an 80/20 target with three discrete positions as 2/1 without a rounding conflict`; `chooses target pressure over a soft caution when the competing crop is due`; `preserves low confidence and post-thinning stage through positions and summaries`; `maps final spacing metadata into the layout compatibility view without losing uncertainty`.
- **Komenda lokalna:** `npm run test:unit`.
- **Źródło oczekiwań:** ręcznie policzone dostępne miejsca w małym fixture oraz niezależnie zadeklarowane stałe rozstawy i dane wejściowe. Cel 80/20 przy trzech dyskretnych miejscach oznacza 2/1, czyli ok. 66⅔/33⅓; to oczekiwana dyskretyzacja, a nie konflikt zaokrąglenia. Niska pewność i etap po przerywce pozostają widoczne w pozycjach i podsumowaniach. Oczekiwań nie wyprowadzaj z wyniku generatora, nie używaj aktualnego katalogu jako niezależnego oracle i nie kopiuj rankingu generatora do testu.

### 6.3 Prywatność i atomowość zapisu

- **Lokalizacje:** `supabase/tests/garden_spaces.test.sql`, `garden_crops.test.sql`, `garden_plans.test.sql` i `garden_plan_revision.test.sql` w tym samym katalogu.
- **Nazewnictwo:** opisuj odmowę i zachowanie pełnego stanu, np. rollback, niezmieniony plan obcego konta lub odrzucony wynik starej rewizji.
- **Referencje:** rollback zapisu przestrzeni/upraw po poprawnym pierwszym i błędnym późniejszym elemencie; odrzucenie planu po zmianie proporcji upraw; zachowanie pełnego rekordu planu po nieaktualnej rewizji.
- **Komenda:** `npm run test:db` — resetuje wyłącznie lokalną bazę testową i wykonuje pgTAP. Wymaga lokalnego Docker/Supabase.
- **Wzorzec:** dwa konta i anon, role/JWT jak w istniejących fixture; po odmowie odczytaj dane jako właściciel. Porównuj pełne wiersze wejść, kolejność, input_revision oraz JSON planu, snapshot, fingerprint i generated_at. Testy są wycofywane transakcyjnie.
- **Granice dowodu:** sekwencyjna zmiana wejść i odrzucenie starej rewizji sprawdzają kontrakt RPC, nie harmonogram współbieżnych transakcji. RLS właściciela pozwala na bezpośrednie mutacje; ochrona rewizji dotyczy aplikacyjnego guarded RPC. Anulowanie w UI pozostaje do §3 Phase 3.

### 6.4 Awaria zewnętrznej bazy

- **Lokalizacje:** `src/pages/api/garden.test.ts`, `garden-crops.test.ts`, `garden-plan.test.ts`; wspólny fixture `src/test/garden-api-fixture.ts`, konfiguracja `vitest.api.config.ts`.
- **Nazewnictwo:** nazwij obserwowalną odpowiedź i brak fałszywego sukcesu, np. `reports RPC failure without false success or private database details`.
- **Referencje:** `reports %s read failure instead of treating the garden as empty`, `reports a conflict if inputs change between reading and conditional save`, `waits for conditional save before returning success`, `rejects malformed multipart without attempting a write`.
- **Komendy:** `npm run test:api` osobno; `npm run test:unit` wykonuje unit i następnie API z propagacją błędu. Istniejący krok CI `test:unit` obejmuje oba zestawy bez nowego YAML.
- **Wzorzec:** hoisted mock zastępuje wyłącznie eksport createClient. Request/Response, parser, walidacja, generator, snapshot i fingerprint są rzeczywiste. Resetuj mocki między testami; dla czasu generacji zamroź Date i przywróć zegar. Oczekiwany snapshot jest literalny, hash liczony niezależnie.
- **Asercje:** 401/503, 500 load_failed/save_failed, 409 inputs_changed versus 422 brak danych; przekierowania formularza; no-store JSON; brak szczegółów wstrzykniętego błędu; brak RPC po błędzie odczytu; sukces dopiero po true.
- **Granice dowodu:** mock dowodzi odpowiedzi handlera i braku próby zapisu, nie trwałości ani atomowości bazy. Te właściwości sprawdza §6.3. Zachowanie adaptera HTTP i sesji sprawdza osobny `npm run smoke` na lokalnym preview. Wykryte błędy dokumentuj z reprodukcją i statusem w `context/changes/testing-safe-garden-storage/bugs.md`.

### 6.5 Krytyczna interakcja w przeglądarce

TBD — see §3 Phase 3. Minimalny przepływ zapis → generowanie → zmiana → nieaktualność → przeliczenie oraz potwierdzenie/anulowanie utraty planu; tylko luki niepokryte taniej. Wzorzec, izolacja danych i komendy lokalne/CI po wdrożeniu.

## 7. What We Deliberately Don't Test

- Kosmetyka, dekoracyjne screenshoty i zgodność pikselowa — ograniczony czas (interview Q5). Wrócić, jeśli wygląd utrudnia rozpoznanie aktualności, konfliktów lub odczyt układu; to już zachowanie funkcjonalne.
- Nie testujemy globalnej optymalności ani równomierności bez zatwierdzonego wymagania. Research może wykazać potrzebę decyzji produktowej (interview Q4; PRD FR-006).
- Brak funkcji wyjaśniania decyzji w UI w zakresie rollout; uzasadnienia przypadków mają służyć weryfikacji. Nie sprawdzamy niewdrożonych terminów sezonowych — roadmap S-06 blocked; wrócić po odblokowaniu.

## 8. Freshness Ledger

- Strategy (§1–§5) last reviewed: 2026-10-04 — brief zaakceptowany przez użytkownika.
- Stack versions last verified: 2026-10-04 — manifest/CI; instalacje niezweryfikowane.
- AI-native tool references last verified: 2026-10-04.
- Refresh: nowe ryzyko top-3, `checked:` starsze niż trzy miesiące, zmiana stacku lub wyłączeń §7.
- Źródła: `context/foundation/prd.md` (FR-001–FR-008, Business Logic, Access Control); `context/foundation/roadmap.md` (F-01/S-01–S-06); `context/foundation/tech-stack.md`; `package.json`; `.github/workflows/ci.yml`; `AGENTS.md`.
- Archiwalne plany: `context/archive/2026-09-23-private-garden-storage-boundary/plan.md`, `2026-09-24-email-account-access/plan.md`, `2026-09-26-define-private-garden-space/plan.md`, `2026-09-27-select-crops-and-proportions/plan.md`, `2026-09-28-generate-garden-layout/plan.md`, `2026-10-03-update-and-recalculate-plan/plan.md` (ostatnie pięć również pod `context/archive/`).
- Wywiad: Q1 błędne rozmieszczenie; Q2 zatrzymanie bazy po tygodniu; Q3 trudna ludzka weryfikacja algorytmu; Q4 odległości i decyzja narożne cebule/marchwie kontra brokuły; Q5 kosmetyka wyłączona ze względu na czas.
