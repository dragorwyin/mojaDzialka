# Krytyczny przepływ i bramki — Implementation Plan

## Overview

Domknąć rollout Phase 3 strategii jakości: sprawdzić zachowania hydratowanych formularzy i plannera, których unit/API/SQL/HTTP smoke nie wykonują. Użytkownik zatwierdził średnią złożoność, dwa pytania, Chromium z desktopem i mobilnym viewportem oraz minimalną poprawkę potwierdzonych błędów z regresją i bugs.md gotowym do 10x flow. Zatwierdził trzy fazy poniżej.

## Current State Analysis

Unit wylicza pliki ręcznie, API ma własną konfigurację, SQL sprawdza prywatność/rollback/rewizje, a smoke używa fetch i HTML. Nie ma runnera przeglądarkowego w badanym repo. Trzy wyspy client:load współpracują przez reload SSR lub garden:inputs-saved. Formularz przestrzeni korzysta z native confirm.

Research opisuje MD-FLOW-001: po pierwszej generacji bez reload hasSavedPlan formularza może pozostać false, pomijając pytanie o utratę planu. To hipoteza źródłowa, nie zaliczona reprodukcja. Równoległe zmiany sezonowe dotykają planner/form/catalog/package/test-plan; zachować je i sprawdzić aktualne kontrakty przy implementacji.

## Desired End State

Anulowanie zmiany struktury nie wysyła zapisu i zachowuje plan po reload; akceptacja usuwa go zgodnie z istniejącym kontraktem. Potwierdzenie działa także po pierwszej generacji bez przeładowania. Edycja tych samych przestrzeni oraz zapis upraw oznaczają poprzedni plan stale, a przeliczenie przywraca current. Kontrolowany błąd pokazuje alert i nie udaje sukcesu ani nie usuwa diagramu.

Testy działają na zbudowanym lokalnym preview z testowym Supabase w desktopowym i mobilnym Chromium. CI wykonuje e2e jako wymaganą bramkę, zachowuje dotychczasowe kontrole i udostępnia artefakty porażki. Cookbook §6.5 opisuje realne wzorce i granice dowodu.

### Key Discoveries:

- `src/components/garden/GardenSetupForm.tsx:64`: confirm i preventDefault są granicą anulowania native submit.
- `src/pages/garden.astro:153`: hasSavedPlan pochodzi z SSR, podczas gdy generacja aktualizuje stan lokalny plannera (`GardenPlanner.tsx:136`).
- `src/components/garden/CropSelectionForm.tsx:292`: event po sukcesie zapisu oznacza istniejący plan stale przez listener (`GardenPlanner.tsx:81`).
- `src/pages/garden.astro:164`: SSR data-* nie aktualizują się po generacji klienta; używać live regionu plannera.
- `.github/workflows/ci.yml:40`: istniejący cykl local Supabase → SQL → build → preview → smoke → stop można rozszerzyć.
- `package.json:16`: jawna lista unit wymaga discovery z rozdzieleniem API/e2e.

## What We're NOT Doing

- Firefox/WebKit, prawdziwe urządzenia mobilne, porównywanie pikseli, vision/CUA jako bramka, benchmarki.
- Powielanie geometrii, rankingu generatora i RLS w e2e; ich dowód pozostaje unit/SQL/API.
- Nowy pipeline od zera, produkcyjne konta/dane, zatrzymywanie Supabase w celu pokazania błędu UI, równoczesny reset i e2e.
- Nowe komunikaty konfliktu lub polityki produktu, przebudowa formularzy, schematu DB i generatora.
- Rozszerzony test harmonogramu transakcji lub odroczonej generacji podczas innego zapisu: ochrona RPC już istnieje; ten rollout priorytetyzuje podstawowy cykl i Cancel/Accept.
- Osobny harness awarii SSR: browser interception API nie dowodzi awarii odczytu serwera. Nie deklarować tego pokrycia.

## Implementation Approach

Dodać Playwright Test 1.63.0 jako dev dependency (sprawdzono npm registry 2026-10-04: Node >=20, CI Node 22), bez aktualizacji pozostałych zależności. Dwa projekty Chromium: desktop 1280×900 i mobile viewport 390×844. Mobilny projekt sprawdza viewport i interakcję, nie zgodność rzeczywistego Safari ani sprzętu. Początkowo jeden worker, zero retry, trace retain-on-failure i screenshot only-on-failure.

Użyć konta na projekt/worker i świeżego kontekstu na test, z jawnie odtwarzanym stanem danych przed scenariuszem. Sesję trzymać w pamięci; pliki .auth ignorować, jeśli okażą się potrzebne. Fixture może przygotować konto/wejścia przez prawdziwe lokalne endpointy; kluczowe akcje pod testem wykonuje browser. Każdy scenariusz niezależny od kolejności, z czyszczeniem poprzedniego planu przez rzeczywistą zmianę struktury fixture.

## Critical Implementation Details

Listener native dialog musi zostać zarejestrowany przed kliknięciem i potwierdzić typ/treść oraz accept/dismiss; automatyczne dismiss bez listenera nie jest dowodem promptu. Cancel nie resetuje lokalnie edytowanych pól. Formularz nie może pomijać potwierdzenia po nowej generacji bez reload; sposób synchronizacji wysp ma zachować ten kontrakt, nie narzuca się konkretnej implementacji.

Runner ma używać konkretnego portu (domyślnie 4323 lokalnie, 4321 w istniejącym CI) i odmawiać działania przeciw zdalnemu baseURL lub Supabase. Nie pozwalać na cichy fallback portu ani automatyczne użycie niezweryfikowanego istniejącego serwera. Poczekać na gotowość oraz wykazać hydratację akcją zmieniającą DOM; role widoczne w SSR same nie dowodzą podpięcia handlera.

## Phase 1: Runner i discovery

### Overview

Uruchomić minimalny izolowany harness bez zmiany zachowania produktu.

### Changes Required:

#### 1. Runner, fixture i artefakty

**Files**: `package.json`, `package-lock.json`, `playwright.config.ts`, `tests/e2e/fixtures/garden.ts`, `tests/e2e/harness.spec.ts`, `.gitignore`.

**Intent**: Dodać runner i powtarzalne lokalne środowisko desktop/mobile oraz dowieść wejścia zalogowanego użytkownika do hydratowanej działki.

**Contract**: `test:e2e` uruchamia wyłącznie tests/e2e; dwa zatwierdzone projekty, jeden worker, zero retry. Lokalne uruchomienie obsługuje zbudowany preview, CI jawnie używa własnego zweryfikowanego preview. Fixture izoluje konto projektu i odtwarza dane testu, nie resetuje DB w trakcie scenariuszy. Kontrola localhost/Supabase fail-closed. Auth/report/test-results ignorowane; fixture nie wymaga service-role. Harness wykonuje działającą interakcję formularza po uwierzytelnieniu, a nie tylko sprawdza statyczny tytuł. Playwright Chromium install jest jawnie udokumentowanym prerequisite.

#### 2. Discovery unit i API

**Files**: `vitest.unit.config.ts`, `vitest.api.config.ts`, `package.json`.

**Intent**: Usunąć ryzyko pominięcia kolejnych testów i zachować rozdział runnerów.

**Contract**: unit include `src/lib/**/*.test.ts` i `src/data/**/*.test.ts`; API include `src/pages/api/**/*.test.ts` z dotychczasowym mock/alias Node. `test:unit` wykonuje unit i następnie API, propagując błąd przez &&. E2e nie trafia do Vitest. Zachować testy sezonowe i dotychczasowe API; nie wywoływać test:unit rekursywnie.

### Success Criteria:

#### Automated Verification:

- `npm run test:e2e -- tests/e2e/harness.spec.ts` przechodzi w obu projektach na lokalnym preview i wykazuje hydratację.
- `npm run test:unit` oraz `npm run test:api` przechodzą; discovery obejmuje istniejące unit/sezonowe/API i wyklucza e2e.
- `npm run lint` i `npx astro check` przechodzą z nowymi config/fixture; guard runnera odrzuca zdalne środowisko przed mutacją.

## Phase 2: Krytyczne interakcje i regresje

### Overview

Sprawdzić utratę planu i aktualność rzeczywistymi kliknięciami; naprawiać jedynie odtworzone defekty.

### Changes Required:

#### 1. Cykl i dialog utraty planu

**Files**: `tests/e2e/garden-flow.spec.ts`, `tests/e2e/garden-plan-loss.spec.ts`, fixture Phase 1; przy wykazanym błędzie wyłącznie potrzebne `GardenSetupForm.tsx`, `GardenPlanner.tsx`, `garden-space-change.ts` lub `garden.astro`.

**Intent**: Dowieść browser wiring, którego helper i smoke nie wykonują. MD-FLOW-001 odtwarzać przed poprawką, bez reload ukrywającego problem.

**Contract**: scenariusz rzeczywistego zapisu → pierwszej generacji → edycji wymiarów z tymi samymi ID → stale zachowanego diagramu → ponownej generacji → current po reload. Oddzielnie udany zapis zmienionych upraw musi dać stale w tej samej stronie przez event wysp. Dla dodania i usunięcia przestrzeni przy zapisanym planie: jawny confirm, dismiss bez POST/nawigacji, zachowany plan/fingerprint/struktura po reload; accept zapisuje zmienioną strukturę i usuwa plan. Uwzględnić pierwszą generację bez reload jako regresję MD-FLOW-001. Przy edycji tych samych ID brak dialogu nie może blokować zapisu. Nie sprawdzać matematyki SVG; identyfikować poprzedni diagram/czas/fingerprint tylko jako dowód zachowania wyniku.

#### 2. Błędy i jawne ostrzeżenie

**Files**: `tests/e2e/garden-errors.spec.ts`, `tests/e2e/garden-warnings.spec.ts`, fixture Phase 1.

**Intent**: Sprawdzić użytkowy skutek znanej awarii API i dostępność informacji o niepewności danych.

**Contract**: selektywny POST `/api/garden-plan` 500 albo 409 zachowuje stary diagram, pokazuje generic alert, kończy busy i pozwala na realne ponowienie po zdjęciu interception. POST upraw 503 pokazuje niedostępność bez komunikatu sukcesu i bez oznaczenia poprzedniego current jako stale. Interception tylko tej odpowiedzi nie jest dowodem awarii bazy. Dla #6 jawny fixture odpowiedzi planu z niską pewnością lub pominiętą uprawą ma ujawnić nazwę, ostrzeżenie/przyczynę w UI; wynik i oracle ustalone literalnie, nie wygenerowane przez produkcyjny generator. Odrębnie oznaczyć tę próbę jako rendering contract, nie trwałość planu. Happy path/cancel korzystają z prawdziwej lokalnej bazy.

#### 3. Minimalne poprawki i dokumentacja

**File**: `context/changes/testing-critical-flow-and-gates/bugs.md` oraz wyłącznie pliki produktu związane z wykazanym błędem.

**Intent**: Zachować reprodukcję i minimalną naprawę zgodnie z decyzją użytkownika.

**Contract**: każdy odkryty błąd ma ID/change-id, warunki, dokładną reprodukcję, expected/actual, kotwicę, przyczynę, zakres poprawki, czerwony/zielony dowód regresji i resolved-here lub follow-up oraz polecenia 10x-new/research. Jeżeli MD-FLOW-001 nie wystąpi, opisać odrzuconą hipotezę i kontrolny test zamiast wymyślać poprawkę. Nowa decyzja produktu albo duża przebudowa jest blokadą do osobnego planowania, nie powodem osłabienia oczekiwania Cancel.

### Success Criteria:

#### Automated Verification:

- `npm run test:e2e` przechodzi w desktop/mobile: cykl current/stale, zapis upraw bez reload oraz jawny Cancel/Accept dodania i usunięcia.
- Test pierwszej generacji bez reload sprawdza prompt; bugs.md zapisuje rzeczywisty wynik MD-FLOW-001 i dowód ewentualnej regresji/naprawy.
- Testy kontrolowanych błędów i ostrzeżenia przechodzą, rozdzielając realny zapis od intercepted rendering contract.
- `npm run test:unit`, `npm run lint`, `npx astro check` i `npm run build` przechodzą po minimalnych poprawkach.

## Phase 3: CI i cookbook

### Overview

Włączyć wymagane e2e do istniejącego cyklu CI i zostawić instrukcje dodawania testów.

### Changes Required:

#### 1. Istniejący workflow i komendy

**Files**: `.github/workflows/ci.yml`, `package.json`, `playwright.config.ts`.

**Intent**: CI na PR ma uruchamiać browser gate i zachować wszystkie obecne kontrole.

**Contract**: istniejący job smoke uruchamia local Supabase, reset/SQL, build i jeden preview; po gotowości wykonuje smoke oraz e2e sekwencyjnie przed cleanup. Dodać install Chromium/deps, forbidOnly w CI, propagację niezerowego kodu e2e oraz upload raportu/trace/screenshot porażki. Nie maskować awarii przez always/continue-on-error w kroku testowym. Cleanup pozostaje always. Sprawdzenie konfiguracji lokalnej nie jest dowodem zielonego hosted CI; zweryfikować wyzwolony run na PR, a jeśli nie ma autoryzacji push/PR, pozostawić tę bramkę niezaliczoną i zgłosić wymagane działanie użytkownika.

#### 2. Cookbook i rollout

**Files**: `context/foundation/test-plan.md`, `context/changes/testing-critical-flow-and-gates/verification.md`.

**Intent**: Uzupełnić §6.5 istniejącymi wzorcami i zapisać rzeczywiste wyniki bramek.

**Contract**: lokalizacje/spec naming/reference/run command, konta/fixture, dialog, hydration/live SSR distinction, real versus intercepted paths, local setup/install/build i CI artefakty. Nie zmieniać zamrożonych §1–§5 poza stanem/ścieżką rollout §3. Phase 3 complete dopiero po wszystkich kryteriach; do tego implementing. Verification wskazuje wyniki/środowisko i granice dowodu, nie tylko pliki dodane.

### Success Criteria:

#### Automated Verification:

- `npm run test:unit`, `npm run test:db`, `npm run lint`, `npx astro check` i `npm run build` przechodzą dla końcowego stanu.
- `npm run smoke` i `npm run test:e2e` przechodzą sekwencyjnie na lokalnym preview z lokalnym Supabase.
- Hosted CI na PR wykonuje e2e i dotychczasowe bramki; kontrolowana awaria testu daje niezerowy gate oraz dostępne artefakty porażki, a końcowy przebieg jest zielony.
- Cookbook §6.5 wskazuje istniejące testy i sprawdzone komendy; rollout status odpowiada Progress i verification.md zawiera dowody.

## Testing Strategy

Unit/SQL/API zachowują obecne ryzyka. Browser wnosi zdarzenia wysp, natywny dialog, formularz i live UI. Asercje według roli/label, zawężone do regionu, oczekujące na konkretny stan zamiast sleep. Stan zachowania danych sprawdzać po reload lub zaufanym odczycie fixture; brak POST mierzyć z obserwacją zakończonego cancel/dialogu i zachowanego wyniku, nie arbitralnym timeoutem jako głównym dowodem.

Deliberate break weryfikuje, że usunięcie promptu albo eventu stale powoduje czerwony test; po przywróceniu cały właściwy zestaw zielony. Kontrolowany fail w CI musi być odwracalny i nie może pozostać w docelowym commicie. Testy nie mogą zależeć od kolejności. Automatyczne checks wystarczają dla tej zmiany; nie dodaje się ręcznej bramki kliknięć dublującej e2e.

## Performance Considerations

Chromium, dwa viewporty i jeden worker ograniczają zasoby. Konto per projekt/worker i odtworzenie fixture ograniczają signup/rate limits. Artefakty wyłącznie porażek; brak benchmarku i full-page screenshot dla każdej asercji.

## Migration Notes

Brak planowanej migracji bazy. Runner i dependency są zmianą developerską; browser binaries wymagają instalacji. Reset dotyczy lokalnej bazy testowej, nie produkcji. CI extension wymaga wykonania hosted run przed zamknięciem Phase 3; samo zapisanie YAML nie zalicza bramki. Zachować równoległe edycje i jawnie stage wyłącznie własny zakres.

## References

- `context/changes/testing-critical-flow-and-gates/research.md` — źródła i kandydat MD-FLOW-001.
- `context/foundation/test-plan.md` — ryzyka #1–#6, rollout Phase 3 i §6.5.
- `context/archive/2026-10-04-testing-safe-garden-storage/reviews/impl-review.md` — istniejący dowód DB/API.
- Playwright docs przez Context7 /microsoft/playwright, checked 2026-10-04: dialogs.md, auth.md, best-practices-js.md, ci.md i trace-viewer.md w oficjalnym repo.
- npm registry `npm view @playwright/test version engines --json`, checked 2026-10-04: 1.63.0, Node >=20.

## Progress

### Phase 1: Runner i discovery

#### Automated

- [x] 1.1 `npm run test:e2e -- tests/e2e/harness.spec.ts` przechodzi w obu projektach na lokalnym preview i wykazuje hydratację. — 6202d18
- [x] 1.2 `npm run test:unit` oraz `npm run test:api` przechodzą; discovery obejmuje istniejące unit/sezonowe/API i wyklucza e2e. — 6202d18
- [x] 1.3 `npm run lint` i `npx astro check` przechodzą z nowymi config/fixture; guard runnera odrzuca zdalne środowisko przed mutacją. — 6202d18

### Phase 2: Krytyczne interakcje i regresje

#### Automated

- [x] 2.1 `npm run test:e2e` przechodzi w desktop/mobile: cykl current/stale, zapis upraw bez reload oraz jawny Cancel/Accept dodania i usunięcia. — 8e7c45a
- [x] 2.2 Test pierwszej generacji bez reload sprawdza prompt; bugs.md zapisuje rzeczywisty wynik MD-FLOW-001 i dowód ewentualnej regresji/naprawy. — 8e7c45a
- [x] 2.3 Testy kontrolowanych błędów i ostrzeżenia przechodzą, rozdzielając realny zapis od intercepted rendering contract. — 8e7c45a
- [x] 2.4 `npm run test:unit`, `npm run lint`, `npx astro check` i `npm run build` przechodzą po minimalnych poprawkach. — 8e7c45a

### Phase 3: CI i cookbook

#### Automated

- [x] 3.1 `npm run test:unit`, `npm run test:db`, `npm run lint`, `npx astro check` i `npm run build` przechodzą dla końcowego stanu. — lokalnie, 2026-10-04; 83fb575
- [x] 3.2 `npm run smoke` i `npm run test:e2e` przechodzą sekwencyjnie na lokalnym preview z lokalnym Supabase. — lokalnie, 2026-10-04; 83fb575
- [x] 3.3 Hosted CI na PR wykonuje e2e i dotychczasowe bramki; kontrolowana awaria testu daje niezerowy gate oraz dostępne artefakty porażki, a końcowy przebieg jest zielony. — PR #1: controlled-failure 37238401746 + artifact 11315574647; final green 37238895670
- [x] 3.4 Cookbook §6.5 wskazuje istniejące testy i sprawdzone komendy; rollout status odpowiada Progress i verification.md zawiera dowody. — lokalnie, 2026-10-04; 83fb575
