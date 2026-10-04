# Bezpieczny zapis i dostęp — Implementation Plan

## Overview

Domknąć Phase 2 strategii `context/foundation/test-plan.md`: ryzyka #2 (utrata lub fałszywa aktualność planu), #3 (dostęp obcego konta) i #4 (awaria bazy udająca sukces). Rozszerzyć istniejące testy SQL oraz sprawdzić rzeczywiste handlery API z kontrolowaną awarią na granicy klienta Supabase. Nie pisać testów ani poprawiać produktu podczas samego planowania.

Użytkownik zatwierdził średnią złożoność, dwa pytania decyzyjne i trzy etapy. Wybrał testy handlerów z mockiem klienta oraz minimalne poprawki ujawnionych błędów wraz z dokumentacją gotową do 10x flow.

## Current State Analysis

Pięć plików pgTAP zawiera 102 asercje. Obejmują podstawowe RLS, zapis przestrzeni i upraw, unieważnianie planu oraz sekwencyjne odrzucenie starej rewizji. Smoke sprawdza działający preview i część izolacji kont oraz cyklu stale → przeliczenie. Brakuje pełnych porównań danych po rollbacku, wariantu zmiany upraw przed zapisem wyniku i kontrolowanych awarii API.

Trzy endpointy wywołują klienta Supabase bez warstwy usługowej. `garden-plan.ts` odczytuje rewizję przed wejściami i przekazuje ją do atomowego RPC. Baza blokuje rekord działki przy zmianach wejść i zapisie planu. Obecny `test:unit` wylicza siedem plików; samo dodanie testu API nie uruchomi go w CI.

## Desired End State

Właściciel może zapisać i odczytać własny plan; obce konto i anon nie odczytują ani nie zmieniają jego danych. Nieudany zapis zachowuje pełne dane i rewizję. Plan wygenerowany przed zmianą przestrzeni lub upraw nie zastępuje istniejącego wyniku. Błędy odczytu/zapisu dają istniejące odpowiedzi błędów, bez fałszywego sukcesu i bez ujawniania szczegółów bazy.

Nowe testy wykonują się w obecnych bramkach CI. Cookbook wskazuje realne wzorce, komendy i ograniczenia dowodów. Każdy faktycznie odkryty błąd ma reprodukcję oraz ślad minimalnej poprawki.

### Key Discoveries:

- `supabase/migrations/20261004120000_guard_plan_generation_input_revision.sql:36`: zapisy upraw, przestrzeni i planu blokują tę samą działkę; zapis wejść zwiększa rewizję, zapis wyniku jej nie zwiększa.
- `supabase/migrations/20261004120000_guard_plan_generation_input_revision.sql:218`: nieaktualna rewizja zwraca `false` przed upsertem.
- `supabase/tests/garden_plan_revision.test.sql:84`: dotychczasowy przypadek zmienia przestrzeń i porównuje tylko fingerprint poprzedniego wyniku.
- `src/pages/api/garden-plan.ts:62`: błędy odczytu dają 500 `load_failed`; zapis 500 `save_failed`, konflikt 409 `inputs_changed`.
- `src/pages/api/garden.ts:81`: zapis przestrzeni używa przekierowania z `save_failed`, a sukces `/garden?saved=1`.
- `src/pages/api/garden-crops.ts:40`: zapis upraw używa JSON i 500 `save_failed`.
- `src/lib/supabase.ts:5`: fabryka klienta stanowi granicę mockowania, bez potrzeby mockowania generatora lub walidacji.
- `.github/workflows/ci.yml:42`: istniejące CI wykonuje `test:db` i smoke; krok `test:unit` może objąć nowe testy handlerów przez skrypt npm.

## What We're NOT Doing

- E2e, kliknięcie anulowania w przeglądarce i wizualna ocena formularzy: należą do rollout Phase 3. Nie nazywać braku zapisu w SQL testem anulowania UI.
- Proxy awarii, zatrzymywanie całej bazy, nowe zależności testowe, przebudowa CI, nowe YAML lub hooki.
- Wielosesyjny test harmonogramu blokad, benchmarki i stress test. Sekwencyjna zmiana rewizji nie dowodzi rzeczywistego nakładania transakcji.
- Historia sezonów, zmiana algorytmu, nowe polityki produktu, rozszerzony audyt bezpieczeństwa.
- Uniwersalny zakaz zapisu przez właściciela poza RPC: obecne RLS pozwala właścicielowi na bezpośrednie mutacje. Testować ochronę rewizji w kontrakcie aplikacyjnego RPC.

## Implementation Approach

SQL daje rzeczywisty sygnał izolacji i transakcyjności. Testy handlerów w Vitest uruchamiają rzeczywiste POST z Request/Response i małym kontekstem Astro, zastępując wyłącznie `createClient`. Walidacja, snapshot, fingerprint i generator pozostają rzeczywiste. Mock klienta odtwarza tylko używane operacje oraz jawne odpowiedzi usługi; nie implementuje własnej bazy ani transakcji. Zachowanie danych jest dowodzone testami SQL, a brak próby zapisu i odpowiedzi błędu testami API.

Wykryty defekt: najpierw reprodukcja i zawodzący test, następnie minimalna poprawka kontraktu, zielony test i opis w `bugs.md`. Jeśli naprawa wymaga nowej decyzji produktu lub większej przebudowy, dokumentować osobny handoff i zgłosić blokadę zamiast oznaczać wymagany scenariusz jako zakończony.

## Critical Implementation Details

Mock modułu klienta musi zastąpić import przed załadowaniem handlera, aby test nie próbował rozwiązywać `astro:env/server`. Konfiguracja testowa zapewnia alias `@/` i środowisko Node, bez uruchamiania adaptera Cloudflare. Nie stosować opóźnień czasowych do udawania współbieżności.

Pełny stan przed/po w SQL oznacza wszystkie zapisane kolumny przestrzeni/upraw, kolejność, rekord działki z rewizją oraz cały rekord planu: JSON, snapshot, fingerprint i czas. Odczyt porównawczy po ataku musi odbywać się jako właściciel lub przez zaufaną kontrolę fixture; zero wierszy widziane przez atakującego nie dowodzi zachowania danych.

## Phase 1: Prywatność i atomowość w bazie

### Overview

Uzupełnić luki istniejących testów, bez powielania 102 asercji bazowych.

### Changes Required:

#### 1. Rollback i izolacja kont

**Files**: `supabase/tests/garden_spaces.test.sql`, `supabase/tests/garden_crops.test.sql`, `supabase/tests/garden_plans.test.sql`.

**Intent**: Dowieść zachowania pełnego stanu przy błędzie po rozpoczęciu modyfikacji oraz domknąć próby UPDATE/DELETE obcych upraw i planu. Używać fixture dwóch kont, anon i istniejącego wzorca ról/JWT.

**Contract**: Poprawny pierwszy element i błędny późniejszy element wejść wymuszają rollback całej operacji, również rewizji i planu. Obce identyfikatory, zmiana właściciela i anon nie zmieniają danych żadnego konta; sprawdzić zarówno odmowę, jak i odczyt po próbie. Anon nie wykonuje guarded RPC. Właściciel zapisujący swoją działkę nie zmienia planu drugiego konta.

#### 2. Rewizja i pełne zastąpienie wyniku

**File**: `supabase/tests/garden_plan_revision.test.sql`.

**Intent**: Rozszerzyć ochronę przed zapisem starego wyniku na zmianę upraw/proporcji i wzmocnić porównania istniejącego wariantu przestrzeni.

**Contract**: Stara rewizja zwraca false, zachowując cały plan; aktualna zapisuje wszystkie pola nowego planu, pozostawia jeden rekord i nie zwiększa rewizji. Błędny payload planu zachowuje stary rekord. Zmiana strukturalna usuwa plan atomowo; jej niepowodzenie zachowuje go wraz z wejściami.

### Success Criteria:

#### Automated Verification:

- `npm run test:db` przechodzi z nowymi przypadkami rollbacku, rewizji i izolacji.
- Testy rollbacku i odrzuconego starego wyniku porównują pełne dane, w tym input_revision, snapshot i generated_at.
- Próby mutacji obcego konta i anon mają odczyt kontrolny potwierdzający niezmieniony stan.

## Phase 2: Błędy i konflikty w API

### Overview

Sprawdzić rzeczywistą obsługę HTTP i odróżnić awarię od pustych danych bez infrastruktury proxy.

### Changes Required:

#### 1. Harness i testy POST

**Files**: `vitest.api.config.ts`, `src/pages/api/garden.test.ts`, `src/pages/api/garden-crops.test.ts`, `src/pages/api/garden-plan.test.ts`, opcjonalny współdzielony helper `src/test/garden-api-fixture.ts`, `package.json`.

**Intent**: Dodać mały harness i komendę `test:api`, która uruchamia wyłącznie wymienione testy z konfiguracją Node/aliasem. Zastąpić eksport fabryki klienta przed importem endpointów i resetować odpowiedzi między testami.

**Contract**: Sprawdzić brak konfiguracji, anon, błędne żądania i poprawny zapis. Dla przestrzeni: przekierowanie do logowania/błędu/sukcesu. Dla JSON: 401 unauthorized, 503 unavailable, 500 save_failed; dla planu także 500 load_failed przy błędzie odczytu działki/przestrzeni/upraw i 409 inputs_changed przy false z guarded RPC. Porównać awarię odczytu z rzeczywistym brakiem danych (422). Błąd odczytu nie wywołuje zapisu; błąd RPC nie daje sukcesu. Sprawdzić no-store JSON oraz brak szczegółów wstrzykniętego błędu. Poprawna generacja przekazuje odczytaną rewizję i rzeczywisty snapshot do RPC, a powodzenie zwraca wynik dopiero po true.

Kontrolowany scenariusz zmiany wejść pomiędzy odczytem a odpowiedzią guarded RPC dowodzi mapowania konfliktu na 409, nie działania blokad bazy. Po błędzie upraw/przestrzeni test API sprawdza brak sygnału sukcesu; rzeczywisty brak częściowego zapisu wynika z Phase 1.

#### 2. Minimalne naprawy i reprodukcje

**Files**: `context/changes/testing-safe-garden-storage/bugs.md`; wyłącznie pliki endpointów lub nowa migracja korekcyjna, jeśli test wykaże konkretny defekt obecnego kontraktu.

**Intent**: Zachować dowód błędu i naprawić go w tej zmianie w najmniejszym zakresie. Nie zmieniać już zastosowanych migracji.

**Contract**: Każdy rzeczywiście wykryty błąd otrzymuje stabilne ID, proponowany change-id, opis użytkowego skutku, preconditions/fixture, kroki lub dokładną komendę reprodukcji, expected/actual, źródło z file:line, przyczynę potwierdzoną dowodem, zakres poprawki, test regresyjny i wynik weryfikacji. Zapisać gotowe polecenia `/10x-new <id> <intent>` i `/10x-research <id>` dla dalszego 10x flow oraz oznaczyć resolved-here albo follow-up, by nie proponować ponownego naprawiania zamkniętego błędu. Brak wykrytych błędów oznacza krótki jawny wpis, bez wymyślonych usterek i bez tworzenia kolejnych zmian.

### Success Criteria:

#### Automated Verification:

- `npm run test:api` przechodzi i uruchamia wszystkie trzy pliki testów POST.
- Kontrolowane awarie odczytu/zapisu i konflikt rewizji dają oczekiwane odpowiedzi, bez fałszywego sukcesu i bez ujawnienia szczegółów błędu.
- `npm run lint` oraz `npx astro check` przechodzą po dodaniu testów i ewentualnych minimalnych poprawek.
- Każdy faktycznie wykryty błąd ma reprodukcję, test regresyjny, stan naprawy i handoff do 10x flow w bugs.md.

## Phase 3: Weryfikacja i dokumentacja

### Overview

Włączyć testy do istniejących bramek i zostawić sprawdzone wzorce dla kolejnych zmian.

### Changes Required:

#### 1. Uruchamianie w obecnym CI

**File**: `package.json`.

**Intent**: Zachować obecną listę unit i rozszerzyć jej komendę o `npm run test:api`, dzięki czemu istniejący krok CI wykona oba zestawy bez zmiany YAML.

**Contract**: `test:unit` uruchamia siedem dotychczasowych plików oraz trzy API; nie może wywoływać rekursji ani maskować kodu błędu. `test:db` i smoke pozostają odrębnymi bramkami. Testy API również uruchamiają się osobno przez test:api.

#### 2. Cookbook i powiązanie rollout

**File**: `context/foundation/test-plan.md`.

**Intent**: Uzupełnić §6.3 i §6.4 rzeczywistymi wzorcami i dopisać ścieżkę tej zmiany w wierszu rollout Phase 2. Nie zmieniać zamrożonej strategii §1–§5 poza stanem i powiązaniem rollout w §3.

**Contract**: Każdy wpis cookbook wskazuje lokalizację, nazewnictwo, konkretny referencyjny test, komendę i granice dowodu. §6.3 opisuje dwa konta/anon, pełny rollback i stale revision; zaznacza odroczenie anulowania UI do Phase 3. §6.4 opisuje mock granicy usługi, odpowiedzi błędu i rozdzielenie od dowodu trwałości SQL. Wiersz §3 Phase 2 jest complete dopiero po wszystkich kryteriach tej zmiany; wcześniej odpowiada rzeczywistemu stanowi implementing. Nie oznaczać ukończenia na podstawie samych dodanych plików.

### Success Criteria:

#### Automated Verification:

- `npm run test:unit` wykonuje dotychczasowe unit oraz wszystkie testy API i przechodzi.
- `npm run test:db`, `npm run lint`, `npx astro check` oraz `npm run build` przechodzą dla końcowego stanu.
- `npm run smoke` przechodzi na lokalnym preview skonfigurowanym z lokalną bazą Supabase.
- Cookbook §6.3–§6.4 wskazuje istniejące referencyjne testy i poprawne komendy, a §3 Phase 2 wskazuje tę zmianę i stan wynikający z Progress.

## Testing Strategy

SQL jest źródłem dowodu RLS, atomowości i zachowania danych. API mockuje wyłącznie usługę; nie uznawać jej mocka za dowód transakcyjności. Używać niezależnych fixture i pełnych porównań przed/po, nie snapshotów generowanych z wyniku funkcji. Istniejący smoke daje kontrolę prawdziwego HTTP/session/preview po zmianach. Nowe błędy wymagają testu odtwarzającego konkretny scenariusz.

Nie wprowadzać ręcznych bramek bez zmiany UI. Weryfikacja kliknięcia anulowania i renderowanego stanu awarii pozostaje w rollout Phase 3; ten etap nie deklaruje ich pokrycia. Powtarzać zaliczone kosztowne bramki tylko po zmianie kodu, która mogła je unieważnić.

## Performance Considerations

Małe deterministyczne fixture API i transakcyjnie wycofywane fixture SQL. Brak sieci w test:api, brak opóźnień i losowych kont. Smoke wymaga preview i lokalnej bazy. Nie dodawać coverage jako miary sukcesu.

## Migration Notes

Plan bazowo nie zmienia schematu. Ewentualna wykazana poprawka SQL trafia do nowej migracji i przechodzi reset/testy lokalnej bazy. `test:db` resetuje lokalną bazę: używać wyłącznie środowiska testowego, nigdy produkcyjnych danych. Testy API nie wymagają sekretów ani Docker. Przed lokalnym DB/smoke zweryfikować dostępność Docker/Supabase; brak środowiska pozostaje niezaliczoną bramką. Rozbieżność CLI lokalne/CI nie uzasadnia automatycznej aktualizacji zależności w tej zmianie.

## References

- Strategia: `context/foundation/test-plan.md`, ryzyka #2–#4 i rollout Phase 2.
- Wymagania: `context/foundation/prd.md`, FR-003/FR-005, Access Control; `context/foundation/roadmap.md`, F-01/S-05.
- Kontrakt wejść: `supabase/migrations/20261004120000_guard_plan_generation_input_revision.sql`.
- Testy bazowe: `supabase/tests/{gardens,garden_spaces,garden_crops,garden_plans,garden_plan_revision}.test.sql`.
- Przepływ HTTP: `scripts/smoke.mjs`; handlery `src/pages/api/garden*.ts`.
- Vitest moduły: https://github.com/vitest-dev/vitest/blob/main/docs/guide/learn/mock-functions.md — sprawdzono przez Context7 2026-10-04; vi.mock jest hoisted, fabryka zastępuje eksport klienta przed importem handlera.
- Vitest aliasy: https://github.com/vitest-dev/vitest/blob/main/docs/guide/mocking/modules.md — sprawdzono przez Context7 2026-10-04. Dokumentacja main nie dowodzi konkretnej zainstalowanej wersji; użyć obecnego lockfile bez aktualizacji.

## Progress

### Phase 1: Prywatność i atomowość w bazie

#### Automated

- [x] 1.1 `npm run test:db` przechodzi z nowymi przypadkami rollbacku, rewizji i izolacji. — e66fa2b
- [x] 1.2 Testy rollbacku i odrzuconego starego wyniku porównują pełne dane, w tym input_revision, snapshot i generated_at. — e66fa2b
- [x] 1.3 Próby mutacji obcego konta i anon mają odczyt kontrolny potwierdzający niezmieniony stan. — e66fa2b

### Phase 2: Błędy i konflikty w API

#### Automated

- [x] 2.1 `npm run test:api` przechodzi i uruchamia wszystkie trzy pliki testów POST. — 5013f9e
- [x] 2.2 Kontrolowane awarie odczytu/zapisu i konflikt rewizji dają oczekiwane odpowiedzi, bez fałszywego sukcesu i bez ujawnienia szczegółów błędu. — 5013f9e
- [x] 2.3 `npm run lint` oraz `npx astro check` przechodzą po dodaniu testów i ewentualnych minimalnych poprawek. — 5013f9e
- [x] 2.4 Każdy faktycznie wykryty błąd ma reprodukcję, test regresyjny, stan naprawy i handoff do 10x flow w bugs.md. — 5013f9e

### Phase 3: Weryfikacja i dokumentacja

#### Automated

- [x] 3.1 `npm run test:unit` wykonuje dotychczasowe unit oraz wszystkie testy API i przechodzi.
- [x] 3.2 `npm run test:db`, `npm run lint`, `npx astro check` oraz `npm run build` przechodzą dla końcowego stanu.
- [x] 3.3 `npm run smoke` przechodzi na lokalnym preview skonfigurowanym z lokalną bazą Supabase.
- [x] 3.4 Cookbook §6.3–§6.4 wskazuje istniejące referencyjne testy i poprawne komendy, a §3 Phase 2 wskazuje tę zmianę i stan wynikający z Progress.
