# Krytyczny przepływ i bramki — Plan Brief

> Full plan: `context/changes/testing-critical-flow-and-gates/plan.md`
> Research: `context/changes/testing-critical-flow-and-gates/research.md`

## What & Why

Domknąć browser luki strategii jakości: potwierdzenie/anulowanie utraty planu, aktualność wyniku po kliknięciach i widoczną reakcję na awarię. Testy mają wykrywać utratę danych i brak synchronizacji wysp, zachowując tańsze dowody unit/API/SQL.

## Starting Point

Istnieją unit, API, SQL i HTTP smoke. Nie wykonują native dialogu ani hydratowanych handlerów. Research wskazał możliwy brak potwierdzenia po pierwszej generacji bez reload; reprodukcja runtime jeszcze nie została wykonana.

## Desired End State

Cancel zachowuje zapisany plan, Accept usuwa go dopiero po zatwierdzeniu. Edycje i zapis upraw dają stale, przeliczenie daje current, a awaria pozostawia diagram i czytelny alert. Chromium desktop/mobile oraz CI pilnują tych zachowań.

## Key Decisions Made

| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| Browser | Chromium, 1280×900 i 390×844 | Dodatkowy sygnał UI przy ograniczonym koszcie | Plan — użytkownik |
| Błędy | Najpierw reprodukcja, minimalna poprawka + regresja/bugs.md | Ochrona planu bez przebudowy produktu | Plan — użytkownik |
| Runner | Playwright Test 1.63.0 | Registry potwierdza zgodność Node >=20 z CI Node 22 | Research/Plan |
| Izolacja | Konto per projekt/worker, świeży context i jawny reset fixture | Izolacja server state i ograniczenie signup | Research/Plan |
| Dowody | Realny flow + selektywne błędy odpowiedzi | UI failure nie udaje dowodu awarii DB | Research |
| CI | Rozszerzyć istniejący smoke job | Jeden local stack/preview, bez nowego pipeline | Research/Plan |

## Scope

**In scope:** runner/discovery, dialog po pierwszej generacji, dodanie/usunięcie Cancel/Accept, stale/current, zapis upraw bez reload, alerty i jawne ostrzeżenie, CI gate/artefakty, cookbook §6.5.

**Out of scope:** Firefox/WebKit, real devices, vision/pixel snapshots, duplikowanie geometrii/RLS, produkcyjne dane, osobny harness awarii SSR, stress/concurrent DB schedules, nowa polityka UI.

## Architecture / Approach

Browser działa na zbudowanym preview z lokalnym Supabase. Setup może używać prawdziwych endpointów, ale krytyczne akcje wykonują kliknięcia po hydratacji. Role/live regiony są źródłem asercji; SSR data-* są kontrolą po reload. Unit/API/e2e mają rozdzielone discovery. Jeden worker, zero retry, artefakty porażek.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Runner i discovery | Izolowany harness, oba viewporty, rozdział runnerów | Środowisko i pomijanie testów |
| 2. Interakcje i regresje | Odtworzenie/naprawa błędu, Cancel/Accept, cykl i alerty | Utrata planu i fałszywa aktualność |
| 3. CI i cookbook | Wymagane e2e, artefakty, dowody i §6.5 | Pozorna zielona bramka |

**Prerequisites:** lokalny Docker/Supabase, Node 22, browser install, build/preview; uprawnienie do push/PR potrzebne dopiero do wykazania hosted CI.
**Estimated effort:** orientacyjnie 3 sesje implementacji; reprodukcja MD-FLOW-001 i dostępność środowiska mogą zwiększyć koszt.

## Open Risks & Assumptions

- MD-FLOW-001 jest hipotezą; brak reprodukcji oznacza opis odrzuconej hipotezy, nie wymyśloną poprawkę.
- Równoległe seasonal zmiany wymagają sprawdzenia finalnego kontraktu bez dołączania ich do rollout commitów.
- Hosted CI musi być naprawdę wykonane. Bez autoryzacji push/PR bramka pozostanie pending; lokalny wynik go nie zastępuje.
- Mobilny viewport Chromium nie dowodzi zgodności sprzętu/Safari; browser interception nie dowodzi rzeczywistej awarii Supabase.

## Success Criteria (Summary)

- Oba viewporty potwierdzają brak zapisu po Cancel i kontrolowaną utratę planu po Accept, także bez reload po generacji.
- Cykl stale/current oraz alerty i ostrzeżenie są widoczne; istniejące unit/API/SQL/smoke pozostają zielone.
- Lokalny i hosted browser gate przechodzą, kontrolowana awaria daje czerwony gate/artefakty, cookbook wskazuje realne wzorce.

## References

- Pełny plan i research podlinkowane powyżej; `context/foundation/test-plan.md` §3/§6.5.
- `.github/workflows/ci.yml:40`, `GardenSetupForm.tsx:64`, `GardenPlanner.tsx:136` — granice integracji.
- Oficjalne docs Playwright przez Context7 i registry npm sprawdzone 2026-10-04.
