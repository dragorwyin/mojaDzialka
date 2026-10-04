---
date: 2026-10-04T20:41:01.1952886+02:00
researcher: Codex
git_commit: 47676c96523bfcb08fcd5fa23bbc9a55c3da6646
branch: codex/s06-sowing-and-seedling-dates
repository: mojaDzialka
topic: "Rollout Phase 3 — krytyczny przepływ przeglądarkowy i bramki"
tags: [research, browser-flow, quality-gates]
status: complete
last_updated: 2026-10-04
last_updated_by: Codex
---

# Research: Krytyczny przepływ i bramki

## Research Question

Które zachowania ryzyk #1–#6 wymagają dowodu przeglądarkowego po unit/API/SQL/smoke, jak tanio je sprawdzić i włączyć do istniejących bramek? Zakres pochodzi z change.md i context/foundation/test-plan.md §2–§3. Nie wdrażano testów ani poprawek produktu.

## Summary

Największy dodatkowy sygnał daje rzeczywista hydratacja i współpraca formularzy: native confirm, anulowanie submitu, zapis upraw oznaczający plan jako stale bez nawigacji oraz generacja i powrót do current. Smoke korzysta z fetch i sprawdza HTML, więc nie wykonuje tych zdarzeń DOM (`scripts/smoke.mjs:72`, `src/pages/garden.astro:156`, `src/components/garden/GardenPlanner.tsx:97`).

Zidentyfikowano źródłowo uzasadniony kandydat błędu: pierwsza generacja planu bez odświeżenia nie aktualizuje prop hasSavedPlan formularza przestrzeni. Późniejsza zmiana struktury może ominąć potwierdzenie usunięcia nowego planu. Wniosek jest statyczny; reprodukcja runtime pozostaje do pierwszego testu (`src/pages/garden.astro:153`, `src/components/garden/GardenSetupForm.tsx:66`, `src/components/garden/GardenPlanner.tsx:136`).

Przegląd manifestu, plików konfiguracyjnych/spec i workflow nie znalazł repozytoryjnego runnera e2e. Istniejące CI wykonuje unit/API i osobny lokalny SQL/preview/smoke; e2e można dodać do tego cyklu bez budowania pipeline od zera (`package.json:15`, `.github/workflows/ci.yml:20`, `.github/workflows/ci.yml:40`).

## Detailed Findings

### 1. Potwierdzenie i anulowanie utraty planu

`GardenSetupForm` używa native window.confirm i event.preventDefault przy odmowie (`src/components/garden/GardenSetupForm.tsx:64`). Helper wykrywa dodany element bez persistedId lub usunięte początkowe ID; hasSavedPlan=false oraz edycja tych samych ID omijają pytanie (`src/lib/garden-space-change.ts:21`). Test helpera dowodzi wyniku funkcji, nie połączenia z React/native submit (`src/lib/garden-space-change.test.ts:6`).

Po anulowaniu lokalne zmiany formularza pozostają — kod blokuje submit, nie cofa edycji (`src/components/garden/GardenSetupForm.tsx:49`, `src/components/garden/GardenSetupForm.tsx:72`). Dowód e2e powinien łączyć brak POST/nawigacji, zachowany diagram i stan po reload. Akceptacja ma prowadzić do zapisu struktury i usunięcia planu zgodnie z RPC (`supabase/migrations/20261004120000_guard_plan_generation_input_revision.sql:171`). Nie oczekiwać resetu pól po Cancel.

**Kandydat MD-FLOW-001, runtime unverified:** otworzyć skonfigurowaną działkę bez planu, wygenerować pierwszy plan, bez reload dodać przestrzeń i kliknąć zapis. SSR prop formularza pozostaje false; planner zmienia własny stan bez powiadomienia formularza. W tej ścieżce helper może nie wyświetlić pytania, mimo zapisanego planu. Kontrola: reload przed dodaniem przestrzeni powinien odtworzyć hasSavedPlan=true. Inspekcja callerów/eventów w src znalazła prop z garden.astro i event garden:inputs-saved dotyczący upraw, nie informację o powstaniu planu (`src/pages/garden.astro:153`, `src/components/garden/GardenSetupForm.tsx:42`, `src/components/garden/GardenPlanner.tsx:110`, `src/components/garden/CropSelectionForm.tsx:292`). Najpierw odtworzyć; minimalną naprawę albo osobny handoff uzgodnić w planowaniu. Nie traktować samej hipotezy jako naprawionego błędu.

### 2. Cykl aktualności i komunikacja wysp

Po zapisie wymiarów z tymi samymi ID nawigacja przeładowuje SSR, które oblicza fingerprint i freshness (`src/pages/garden.astro:75`, `src/pages/garden.astro:120`). Po zapisie upraw komponent wysyła garden:inputs-saved; planner zwiększa lokalną rewizję i oznacza istniejący plan stale bez nawigacji (`src/components/garden/CropSelectionForm.tsx:290`, `src/components/garden/GardenPlanner.tsx:81`). Warto testować te dwie różne ścieżki zamiast zastępować kliknięcia samymi wywołaniami API.

Podczas generacji przycisk jest disabled i section ma aria-busy. Sukces ustawia plan i status zależny od lokalnej rewizji; błąd zachowuje stary plan, oznacza go stale i pokazuje ogólny alert (`src/components/garden/GardenPlanner.tsx:103`, `src/components/garden/GardenPlanner.tsx:136`, `src/components/garden/GardenPlanner.tsx:152`). Dla 401 kod przekierowuje do logowania. 409 i inne non-OK w tej ścieżce mają wspólny komunikat, więc nie wymagać nowego dedykowanego UI konfliktu (`src/components/garden/GardenPlanner.tsx:118`).

Opcjonalny deterministyczny test odroczonej odpowiedzi generacji i zapisu upraw w międzyczasie sprawdzi oznaczenie wyniku stale. To dowód wysp UI, nie harmonogramu transakcji. Przy ograniczonym budżecie priorytet mają podstawowy cykl i utrata planu.

### 3. Awarie i jawność danych

Nieudany zapis upraw nie wysyła eventu sukcesu. 503 ma tekst niedostępności, pozostałe non-OK ogólny błąd, a odrzucony fetch tekst połączenia (`src/components/garden/CropSelectionForm.tsx:280`, `src/components/garden/CropSelectionForm.tsx:297`). Selektywne przechwycenie POST API pozwoli dowieść alertu, zachowania diagramu i ponowienia; nie stanowi dowodu prawdziwej awarii Supabase.

Awaria odczytu SSR ustawia unavailable, odróżnione od empty; browser route na /api/* nie przechwytuje serwerowego odczytu Supabase (`src/pages/garden.astro:54`, `src/pages/garden.astro:118`). Do dodatkowego dowodu tej ścieżki potrzebny byłby fixture na granicy serwera lub tańszy test SSR. Nie zatrzymywać całej bazy dla alertu UI. Formularz przestrzeni wyświetla alert, ale przycisk zapisu nie jest wyłączany tym błędem; nie zakładać globalnej blokady formularzy (`src/components/garden/GardenSetupForm.tsx:87`, `src/components/garden/GardenSetupForm.tsx:186`).

Nierozpoznane uprawy są widoczne i blokują zapis; planner wyjaśnia blokadę generacji (`src/components/garden/CropSelectionForm.tsx:242`, `src/components/garden/CropSelectionForm.tsx:384`, `src/components/garden/GardenPlanner.tsx:200`). Widok wyjaśnia stale/unknown, częściowo przetworzone przestrzenie i pokazuje pewność danych (`src/components/garden/GardenLayoutView.tsx:357`, `src/components/garden/GardenLayoutView.tsx:388`, `src/components/garden/GardenLayoutView.tsx:519`). Dla #6 sprawdzać dostępność konkretnego ostrzeżenia z jawnym fixture, nie prawdziwość katalogu ani screenshot jako oracle.

### 4. Locatory i granice odczytu

Preferować role/nazwy: Zapisz działkę, + Dodaj skrzynię lub sektor, Usuń tę przestrzeń oraz pola w grupie Przestrzeń 1 (`src/components/garden/GardenSetupForm.tsx:99`, `src/components/garden/GardenSetupForm.tsx:184`). Planner ma region Układ działki i przyciski Wygeneruj plan/Wygeneruj ponownie; layout region Szczegóły wygenerowanego układu (`src/components/garden/GardenPlanner.tsx:150`, `src/components/garden/GardenPlanner.tsx:190`, `src/components/garden/GardenLayoutView.tsx:356`). Alerty/statusy należy ograniczać do regionu, bo formularze i planner używają tych samych ról.

SSR #garden-plan-ssr data-* są wejściem początkowym i nie aktualizują się po generacji klienta. Live data-plan-status znajduje się w regionie plannera, a data-layout-status w layout; SSR fingerprint nadaje się do kontroli po reload (`src/pages/garden.astro:164`, `src/components/garden/GardenPlanner.tsx:154`). Test musi dowieść hydratacji obserwowalną interakcją, bez arbitralnego sleep.

### 5. Bramki, infrastruktura i izolacja

Manifest wylicza pliki unit, osobna konfiguracja API wymienia trzy POST testy. Rozszerzenie automatycznego discovery musi rozdzielić unit/API/e2e, aby unit nie importował astro:env lub speców przeglądarkowych (`package.json:16`, `vitest.api.config.ts:8`). Zachować równolegle dodany season-work-schedule.test.ts.

CI używa Node 22, local Supabase, resetu testowej bazy, build i preview, a potem stop (`.github/workflows/ci.yml:16`, `.github/workflows/ci.yml:40`, `.github/workflows/ci.yml:58`). Zalecenie: browser po zakończeniu reset/test:db, przed stop, z jednym cyklem preview; istniejące smoke pozostaje osobną bramką. Nie wykonywać resetu równocześnie z e2e (`package.json:9`).

Local API ma port 54321, DB 54322; potwierdzenie email jest wyłączone w lokalnej konfiguracji, signup/signin ograniczone limitem 30 (`supabase/config.toml:10`, `supabase/config.toml:29`, `supabase/config.toml:190`, `supabase/config.toml:209`). Użyć unikalnego konta/kontekstu na scenariusz lub worker, małej liczby kont i jednoznacznego fixture; stan przeglądarki sam nie izoluje danych serwera. DB reset to wyłącznie lokalne środowisko testowe. CI już zapisuje lokalne zmienne do .env/.dev.vars (`.github/workflows/ci.yml:46`).

## Risk response adjudication

- **#1, #5:** niezależna geometria i priorytety pozostają unit; potwierdzone źródło wzorców: `src/lib/garden-layout.test.ts:46`, `src/lib/garden-layout.test.ts:343`. Browser dowodzi interakcji/renderowania, nie matematyki.
- **#2:** dodatkowy browser ma silny sygnał dla Cancel/Accept, hydratacji i stale/current; MD-FLOW-001 jest priorytetową reprodukcją.
- **#3:** RLS i read-back są już w SQL; nie powielać ataków w rozbudowanym e2e (`supabase/tests/garden_plans.test.sql:240`, `supabase/tests/garden_crops.test.sql:319`). Sesja w minimalnym browser flow daje potrzebny sygnał dostępu do strony.
- **#4:** zachowanie handlera jest w API; brak fałszywego sukcesu i alert po kliknięciu pozostają luką UI (`src/pages/api/garden-plan.test.ts:54`, `src/components/garden/GardenPlanner.tsx:141`).
- **#6:** unit/contract ustala dane; browser powinien potwierdzić jawne ostrzeżenie tylko tam, gdzie niedostępność prezentacji mogłaby ukryć problem.

Nie wykazano potrzeby zmiany evidence/risk wording §2 test-plan. Research doprecyzowuje warstwy i kotwice bez osłabienia ryzyk.

## Current documentation grounding

Context7: /microsoft/playwright, checked: 2026-10-04. Nie wybrano wersji zależności ani nie instalowano runnera.

- [Dialogs](https://github.com/microsoft/playwright/blob/main/docs/src/dialogs.md): listener accept/dismiss przed kliknięciem; brak listenera może automatycznie dismiss, więc sam brak zapisu nie dowodzi wyświetlenia pytania.
- [Best practices](https://github.com/microsoft/playwright/blob/main/docs/src/best-practices-js.md): role i asercje oczekujące na stan zamiast stałych opóźnień.
- [Auth](https://github.com/microsoft/playwright/blob/main/docs/src/auth.md): konta odseparowane przy mutacjach danych; storageState poza repo, jeżeli użyte. Obecny `.gitignore:1` nie ma wpisów .auth/reportów, więc plan powinien dodać odpowiednie reguły dla wybranego układu.
- [CI](https://github.com/microsoft/playwright/blob/main/docs/src/ci.md) i [traces](https://github.com/microsoft/playwright/blob/main/docs/src/trace-viewer.md): instalacja browser/deps w CI, artefakty porażki; trace on-first-retry albo retain-on-failure bez retry. Aktualne docs main nie ustalają zgodności przyszłej konkretnej wersji.
- Selektywne route.fulfill/abort z dokumentacji/API sprawdza odpowiedź UI; pozostały happy path powinien korzystać z rzeczywistego serwera.

## Historical Context and Related Research

Archiwum bezpiecznego zapisu dokumentuje zaliczone API/SQL/smoke i propagację awarii API przez bramkę (`context/archive/2026-10-04-testing-safe-garden-storage/verification.md:5`, `context/archive/2026-10-04-testing-safe-garden-storage/verification.md:11`). Te historyczne wyniki są dowodem tamtego przebiegu, nie wynikiem niniejszego research. Ochrona DB/API pozostaje zgodna z obecnymi testami; historyczna liczba unit nie opisuje dokładnie rozwijającego się worktree.

## Architecture Insights

Trzy wyspy client:load, native POST przestrzeni oraz JSON fetch upraw/planu tworzą dwie ścieżki synchronizacji: reload SSR i event klienta (`src/pages/garden.astro:156`, `src/pages/garden.astro:161`, `src/pages/garden.astro:181`). Tę granicę należy testować przeglądarką. Zachować semantic tokens/Button przy ewentualnych zmianach UI; nowy harness nie uzasadnia przebudowy komponentów.

## Open Questions and Planning Handoff

1. MD-FLOW-001 wymaga rzeczywistej reprodukcji browser przed potwierdzeniem defektu. Plan powinien określić minimalną poprawkę + dokumentację albo osobny handoff po wykazaniu błędu.
2. Wybrać wersję runnera zgodną z Node 22/lockfile i początkowy zakres Chromium/viewport. Więcej przeglądarek/vision nie ma obecnie wykazanego dodatkowego sygnału dla opisanych luk.
3. Ustalić finalne discovery unit/API/e2e oraz miejsce browser gate w istniejącym workflow. Nie pisać pipeline od zera.
4. Równoległe seasonal zmiany obejmują planner/form/catalog i package/test-plan; kotwice opisują worktree przy badaniu, nie wszystkie bajty commita 47676c9. Przed implementacją ponownie sprawdzić zmienione kontrakty. Nie dołączać tych zmian do commita rollout.
5. Runtime hydratacja, wykonanie dialogu i zachowanie CI runnera nie były uruchamiane w research. To bramki planowanej implementacji, nie zaliczone kontrole.

Następny krok: `/10x-plan testing-critical-flow-and-gates`. Podzielić pracę według cost × signal, zakończyć aktualizacją §6.5 i rollout. Zachować tańsze istniejące dowody, jawne fixture i osobną weryfikację anulowania bez zapisu.
