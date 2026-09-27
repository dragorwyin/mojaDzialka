# Wybór warzyw i proporcji — Implementation Plan

## Overview

S-03 pozwala zalogowanemu użytkownikowi wyszukać i wybrać warzywa z istniejącego katalogu, przypisać każdemu dodatnią wartość proporcji oraz zachować wybór prywatnie między sesjami. Lista jest wejściem do S-04; w tej zmianie proporcje nie są przeliczane na powierzchnię ani na rozmieszczenie w skrzyniach.

## Current State Analysis

- PRD FR-004 wymaga wyszukiwania i wyboru z ograniczonego, ręcznie zweryfikowanego katalogu oraz liczbowej proporcji dla każdej wybranej rośliny (context/foundation/prd.md:75).
- Chronione /garden odczytuje działkę i jej przestrzenie po stronie serwera (src/pages/garden.astro:16-25), a GardenSetupForm używa kontrolowanego stanu React i formularza HTML (src/components/garden/GardenSetupForm.tsx:35-60). Endpoint Astro sprawdza sesję, waliduje pola i zapisuje przez RPC (src/pages/api/garden.ts:24-69).
- Katalog statyczny już ma 30 rekordów, neutralne sortowanie, wyszukiwanie bez rozróżniania wielkości liter i polskich znaków oraz pobieranie po ID (src/lib/crop-catalog.ts:41-56). Nie ma jeszcze formularza wyboru ani zapisu wybranych upraw.
- Model prywatny obejmuje gardens i garden_spaces. Migracja garden_spaces definiuje RLS właściciela oraz funkcję save_garden_spaces, która usuwa i odtwarza listę przestrzeni (supabase/migrations/20260926120000_create_garden_spaces.sql:1-17, 78-114). Nie zapisuje upraw ani proporcji.
- Testy jednostkowe Vitest, pgTAP, lint, Astro check, build i smoke test są już dostępne (package.json:5-16; .github/workflows/ci.yml:10-48; scripts/smoke.mjs:1-24). Smoke test pokrywa dziś auth i dashboard, nie zapis wyboru upraw.
- Użytkownik zaakceptował 30 kandydatów jako kuratorowany katalog MVP na podstawie własnej obserwacji. Research nie dowodzi reprezentatywnego ogólnopolskiego rankingu, więc zestaw pozostaje nierankingowy (context/changes/garden-crop-catalog-research/research.md, sekcja „Decyzja użytkownika”).

## Desired End State

Po zalogowaniu użytkownik otwiera /garden, wyszukuje warzywo po polskiej nazwie lub aliasie, dodaje je do listy i wpisuje dodatnią proporcję. Może zapisać wybór, wrócić do strony i zobaczyć poprzednie wartości; dane pozostają prywatne dla jego konta i niezależne od identyfikatorów skrzyń.

Lista wyświetla katalog bez rankingu. Wartości proporcji pozostają wejściowymi liczbami — także dziesiętnymi — a ich interpretacja przy podziale powierzchni należy do S-04. Wybór może zostać wyczyszczony przez zapisanie pustej listy.

### Key Discoveries:

- FR-004 wymaga katalogu i proporcji, ale nie definiuje jeszcze znaczenia proporcji; roadmapa pozostawia ich przeliczenie do S-04.
- listCrops, searchCrops i getCropById w src/lib/crop-catalog.ts zapewniają neutralne wyświetlenie, wyszukiwanie i walidację ID po stronie serwera.
- garden_spaces są wymieniane atomowo przez RPC; upraw nie należy wiązać z garden_space_id, bo taki zapis mógłby przetrwać zmianę skrzyń tylko pozornie albo utracić powiązanie przy ich odtworzeniu.
- Istniejący SSR Astro + React island + chroniony endpoint + RPC/RLS daje sprawdzony wzorzec dla pełnego przepływu prywatnego zapisu.

## What We're NOT Doing

- Nie twierdzimy, że to ogólnopolski ranking 30 najpopularniejszych warzyw i nie sortujemy UI według popularności, plonu ani jakości.
- Nie dodajemy nowych gatunków ani edycji katalogu przez użytkownika.
- Nie przypisujemy wybranych warzyw do konkretnych skrzyń lub sektorów.
- Nie interpretujemy proporcji jako liczby roślin, udziału powierzchni ani priorytetu i nie generujemy układu; to zakres S-04.
- Nie walidujemy lokalnie osi ani brakujących wartości rozstaw; dane te są wejściem do obliczeń S-04.
- Nie dodajemy terminów, harmonogramu, przypomnień, historii sezonów, wielu działek ani współdzielenia.
- Nie zmieniamy istniejącego przepływu logowania ani formatu wymiarów skrzyń poza niezależnym dodaniem drugiego formularza na /garden.

## Implementation Approach

Dodajemy tabelę garden_crops powiązaną z rekordem gardens, z jednym wierszem na crop_id i dodatnią proporcją. Zachowujemy prywatność przez RLS właściciela oraz atomową funkcję RPC zastępującą pełną listę; identyfikatory roślin waliduje chroniony endpoint względem statycznego katalogu. Wybór jest na poziomie działki, nie przestrzeni.

Na istniejącej stronie /garden pojawi się osobny formularz React dla upraw. Strona serwerowa odczyta zapisane wartości, a formularz użyje obecnego repository katalogu do wyszukiwania i neutralnego wyświetlania. To utrzymuje jedną ścieżkę wejścia z dashboardu i nie łączy logiki wyboru upraw z formularzem wymiarów.

## Critical Implementation Details

### Niezależność od skrzyń

garden_crops musi wskazywać na gardens, a nie na garden_spaces. save_garden_spaces usuwa i odtwarza przestrzenie, dlatego przypięcie upraw do ich identyfikatorów w S-03 wprowadziłoby kruchą zależność do S-02. Proporcje zostają zapisane bez alokacji na skrzynie i są konsumowane przez przyszły algorytm S-04.

## Faza 1: Prywatny zapis upraw

### Overview

Dodajemy właścicielski model wyboru, atomowy zapis oraz walidację wejścia, z testami bazy i funkcji czystych. Endpoint jest gotowy do podłączenia formularza w fazie 2.

### Changes Required:

#### 1. Tabela, RLS i atomowy zapis

**File:** supabase/migrations/*_create_garden_crops.sql; supabase/tests/garden_crops.test.sql

**Intent:** Trwale zapisać bieżącą listę wybranych warzyw dla jednej prywatnej działki i utrzymać izolację między kontami.

**Contract:** Tabela public.garden_crops wiąże garden_id z public.gardens, przechowuje stabilny crop_id jako tekst oraz dodatnią, skończoną wartość proportion typu numeric. Unikalność (garden_id, crop_id) zapobiega powtórzeniu tej samej rośliny. RLS i granty ograniczają odczyt i zapis do właściciela; funkcja RPC działa atomowo, tworzy rekord gardens, jeśli S-02 jeszcze go nie utworzyło, i zastępuje listę, a pustą listą może usunąć poprzedni wybór. Model nie zawiera garden_space_id ani rankingu.

#### 2. Walidacja zapisu i chroniony endpoint

**Files:** src/lib/garden-crop-selection.ts; src/pages/api/garden-crops.ts; src/lib/garden-crop-selection.test.ts; package.json; .github/workflows/ci.yml

**Intent:** Odrzucać nieprawidłowe lub nieznane rekordy przed zapisem oraz udostępnić formularzowi tę samą sesyjną granicę dostępu co /garden.

**Contract:** POST /api/garden-crops wymaga zalogowanego użytkownika i waliduje kształt listy, unikalność crop_id, istnienie ID przez getCropById oraz dodatnią, skończoną proporcję. Wartości dziesiętne są akceptowane i zapisywane jako wejście; handler deleguje atomową wymianę listy do RPC. Testy jednostkowe obejmują poprawne liczby dodatnie oraz nieznane ID, duplikaty, zero, wartości ujemne i niefinitywne. Skrypt test:unit uwzględnia nowy plik testowy, a CI uruchamia ten skrypt przed buildem.

### Success Criteria:

#### Automated Verification:

- npm run test:db przechodzi dla migracji i pgTAP sprawdzających utworzenie działki przy pierwszym zapisie, zapis właściciela, izolację drugiego użytkownika, odmowę anon, constrainty oraz zastępowanie i czyszczenie listy.
- npm run test:unit przechodzi dla walidacji znanych ID, duplikatów i dodatnich wartości proporcji, w tym wartości dziesiętnych.

#### Manual Verification:

- Przegląd schematu potwierdza, że zapis upraw jest przypisany do działki i pozostaje nienaruszony po zastąpieniu listy garden_spaces.

**Implementation Note:** Po automatycznej weryfikacji fazy 1 zatrzymaj się na ręcznym potwierdzeniu testów prywatności i niezależności modelu; dopiero potem kontynuuj fazę 2.

## Faza 2: Wybór warzyw i proporcji w /garden

### Overview

Dodajemy do chronionej strony działki osobny, użyteczny przepływ wyszukiwania, zaznaczania, edycji proporcji i zapisu wyboru, a następnie sprawdzamy go w smoke teście i ręcznie.

### Changes Required:

#### 1. Odczyt danych i formularz wyboru

**Files:** src/pages/garden.astro; src/components/garden/CropSelectionForm.tsx

**Intent:** Rozszerzyć istniejącą stronę działki o niezależny formularz upraw, nie zmieniając zachowania konfiguracji skrzyń i sektorów.

**Contract:** Strona serwerowa przekazuje formularzowi aktualne crop_id i proportion zalogowanego właściciela. Formularz używa listCrops/searchCrops, wyświetla wyniki w neutralnej kolejności, pozwala dodać lub usunąć wybraną roślinę i edytować jej dodatnią proporcję, a zapisem kieruje do POST /api/garden-crops. Pusta lista jest dozwolona jako stan początkowy i może wyczyścić wcześniejszy wybór.

#### 2. Weryfikacja pełnego przepływu

**File:** scripts/smoke.mjs

**Intent:** Wykrywać regresje między sesją Supabase, chronioną stroną, endpointem, RPC i ponownym odczytem zapisanych upraw.

**Contract:** Smoke test tworzy sesję użytkownika, zapisuje wybór co najmniej dwóch roślin z różnymi proporcjami, ponownie odczytuje /garden i potwierdza widoczność zapisanych wartości; sprawdza też przekierowanie anonimowego wejścia. Istniejący smoke flow auth pozostaje zachowany.

### Success Criteria:

#### Automated Verification:

- npx astro check, npm run lint i npm run build przechodzą po połączeniu strony, formularza i endpointu.
- npm run test:db i npm run test:unit przechodzą z nowym przepływem bez regresji istniejących testów.
- npm run smoke weryfikuje chroniony odczyt oraz zapis i ponowne wyświetlenie wybranych upraw na /garden.

#### Manual Verification:

- Zalogowany użytkownik wyszukuje warzywo po nazwie oraz aliasie (także bez polskich znaków), dodaje kilka pozycji, edytuje proporcje, zapisuje i po odświeżeniu widzi te same wartości.
- Użytkownik może usunąć wybrane pozycje, zapisać pustą listę i wyczyścić poprzedni wybór; zapisanie nowych wymiarów działki nie usuwa wyboru upraw. Inne konto nie widzi tych danych.

## Testing Strategy

### Unit Tests

- ID upraw istnieją w statycznym katalogu; duplikaty są odrzucane.
- Proporcje akceptują skończone wartości większe od zera, także dziesiętne; odrzucają zero, ujemne, NaN i Infinity.
- Walidacja nie przelicza ani nie normalizuje proporcji i nie nadaje im znaczenia algorytmicznego.

### Integration Tests

- pgTAP weryfikuje constraints, zapis i zastąpienie listy, czyszczenie, RLS właściciela, brak dostępu drugiego użytkownika oraz odmowę anon.
- Smoke test przebiega przez signup, chronioną stronę, zapis endpointem i ponowny odczyt po stronie SSR.

### Manual Testing Steps

1. Zaloguj się, otwórz /garden i wyszukaj pomidor po fragmencie nazwy oraz rukolę przez alias.
2. Dodaj co najmniej dwie uprawy, wpisz np. proporcje 2 i 1, zapisz i odśwież stronę; sprawdź neutralny porządek oraz zachowanie wartości.
3. Usuń jedną pozycję, zapisz, a następnie wyczyść wybór i potwierdź pusty stan po odświeżeniu.
4. Zapisz zmienione wymiary skrzyń i potwierdź, że nie usunęły zapisanych upraw.
5. Zaloguj się na drugim koncie i potwierdź, że nie widzi ani nie nadpisuje pierwszego wyboru.

## Performance Considerations

Katalog zawiera 30 statycznych rekordów, więc wyszukiwanie liniowe w istniejącym repository jest wystarczające. Formularz nie odpytuje serwera przy każdym znaku; do bazy trafia wyłącznie zapis, a odczyt odbywa się podczas renderowania SSR strony.

## Migration Notes

Migracja jest addytywna: nie zmienia garden_spaces ani istniejących danych. Wybrane rekordy zapisują stabilne tekstowe ID katalogu, dlatego ID nie powinny być zmieniane przy redakcji nazwy. Nie dodajemy seedów katalogu do Supabase; katalog pozostaje statycznym modułem TypeScript, a endpoint odrzuca ID nieobecne w aktualnym repository.

## References

- Product requirements: context/foundation/prd.md, FR-004
- Roadmap: context/foundation/roadmap.md, S-03 and S-04
- Crop catalog research and user decision: context/changes/garden-crop-catalog-research/research.md
- Existing catalog repository: src/lib/crop-catalog.ts
- Private garden form and endpoint: src/pages/garden.astro, src/components/garden/GardenSetupForm.tsx, src/pages/api/garden.ts
- Existing private storage and atomic replacement: supabase/migrations/20260926120000_create_garden_spaces.sql
- Existing RLS verification: supabase/tests/garden_spaces.test.sql
- Test/build/smoke conventions: package.json, .github/workflows/ci.yml, scripts/smoke.mjs

## Progress

> Convention: - [ ] pending, - [x] done. Append — commit SHA when a step lands. Do not rename step titles.

### Phase 1: Prywatny zapis upraw

#### Automated

- [x] 1.1 npm run test:db przechodzi dla migracji i pgTAP sprawdzających utworzenie działki przy pierwszym zapisie, zapis właściciela, izolację drugiego użytkownika, odmowę anon, constrainty oraz zastępowanie i czyszczenie listy.
- [x] 1.2 npm run test:unit przechodzi dla walidacji znanych ID, duplikatów i dodatnich wartości proporcji, w tym wartości dziesiętnych.

#### Manual

- [x] 1.3 Przegląd schematu potwierdza, że zapis upraw jest przypisany do działki i pozostaje nienaruszony po zastąpieniu listy garden_spaces.

### Phase 2: Wybór warzyw i proporcji w /garden

#### Automated

- [ ] 2.1 npx astro check, npm run lint i npm run build przechodzą po połączeniu strony, formularza i endpointu.
- [ ] 2.2 npm run test:db i npm run test:unit przechodzą z nowym przepływem bez regresji istniejących testów.
- [ ] 2.3 npm run smoke weryfikuje chroniony odczyt oraz zapis i ponowne wyświetlenie wybranych upraw na /garden.

#### Manual

- [ ] 2.4 Zalogowany użytkownik wyszukuje warzywo po nazwie oraz aliasie (także bez polskich znaków), dodaje kilka pozycji, edytuje proporcje, zapisuje i po odświeżeniu widzi te same wartości.
- [ ] 2.5 Użytkownik może usunąć wybrane pozycje, zapisać pustą listę i wyczyścić poprzedni wybór; zapisanie nowych wymiarów działki nie usuwa wyboru upraw. Inne konto nie widzi tych danych.
