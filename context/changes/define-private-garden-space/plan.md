# Utworzenie prywatnej działki i konfiguracja jej wymiarów — Implementation Plan

## Overview

S-02 rozszerza fundament F-01 o rzeczywistą konfigurację przestrzeni ogrodowej. Zalogowany użytkownik może zapisać jedną prywatną działkę oraz dowolną liczbę nazwanych skrzyń lub sektorów z dodatnimi wymiarami w centymetrach, a następnie wrócić do zapisanej konfiguracji.

## Current State Analysis

Repozytorium ma tabelę `public.gardens` z ograniczeniem jednej działki na konto i politykami RLS właściciela (`supabase/migrations/20260923203933_create_gardens.sql`). Istniejący klient SSR Supabase (`src/lib/supabase.ts`) przekazuje sesję z cookies, a middleware udostępnia zalogowanego użytkownika i chroni dashboard. Brakuje tabeli wymiarów, atomowego zapisu listy przestrzeni, endpointu oraz widoku konfiguracji.

Istniejące testy pgTAP (`supabase/tests/gardens.test.sql`) uruchamiają się przez `npm run test:db`, a workflow CI startuje lokalny Supabase przed ich wykonaniem. Wymaganie prywatności musi pozostać egzekwowane w bazie przez RLS, niezależnie od ochrony strony.

## Desired End State

Zalogowany użytkownik otwiera chroniony `/garden`, dodaje lub usuwa wiersze skrzyń/sektorów, wpisuje nazwę i wymiary, a zapis tworzy jedną działkę i trwałą listę przestrzeni. Ponowne wejście na stronę pokazuje wyłącznie dane właściciela. Nieprawidłowe dane są odrzucane bez zapisu, a zapis listy odbywa się atomowo i zastępuje poprzednią konfigurację przestrzeni.

### Key Discoveries:

- `public.gardens.user_id` jest już `UNIQUE`, `NOT NULL` i chronione polityką właściciela; S-02 powinien użyć tej tabeli zamiast dublować granicę konta.
- Supabase SSR client z `src/lib/supabase.ts` może wywołać RPC z sesją użytkownika; Context7 potwierdza wzorzec `supabase.rpc(name, params)` i egzekwowanie RLS po stronie bazy.
- Repozytorium nie ma biblioteki formularzy ani test runnera UI; interaktywną listę najlepiej zrealizować jako mały React island, a zapis przez istniejący wzorzec Astro `APIRoute` + `context.redirect`.

## What We're NOT Doing

- Nie dodajemy wielu działek na konto, współdzielenia ani uprawnień administratora.
- Nie dodajemy katalogu upraw, proporcji, algorytmu układu ani planu sezonu.
- Nie dodajemy ręcznego przesuwania roślin ani przeliczania planu po zmianie wymiarów; to zakres późniejszych slice'ów.
- Nie modyfikujemy `context/foundation/roadmap.md` ani `context/changes/garden-crop-catalog-research/`.
- Nie zmieniamy istniejącego modelu auth ani migracji F-01 poza dodaniem zależnej tabeli i funkcji zapisu.

## Implementation Approach

Dodajemy zależną tabelę `public.garden_spaces` z kluczem do `gardens`, constraintami wymiarów i RLS opartym o właściciela działki. Jedna funkcja PostgreSQL, wywoływana przez `supabase.rpc` z uwierzytelnionego endpointu, utworzy działkę jeśli jeszcze nie istnieje i w jednej transakcji zastąpi jej listę przestrzeni. Chroniony ekran `/garden` ładuje dane właściciela po stronie serwera, a React island obsługuje dowolną liczbę wierszy; dashboard dostaje link do konfiguracji.

## Critical Implementation Details

### Timing & lifecycle

RPC musi być funkcją `SECURITY INVOKER` z ograniczonym `EXECUTE` dla `authenticated`, aby zapisy wykonywały się w tej samej granicy RLS co odczyt. Usunięcie i ponowne wstawienie listy przestrzeni musi pozostać w jednej transakcji, żeby błąd pojedynczego wiersza nie zostawił częściowej konfiguracji.

## Phase 1: Model danych i prywatny zapis

### Overview

Dodajemy tabelę przestrzeni ogrodowych, polityki RLS oraz atomową funkcję zapisu listy skrzyń/sektorów. Test pgTAP sprawdzi constrainty, zapis właściciela i izolację dwóch użytkowników.

### Changes Required:

#### 1. Tabela i funkcja zapisu przestrzeni

**File**: `supabase/migrations/20260926120000_create_garden_spaces.sql`

**Intent**: Przechować dowolną liczbę nazwanych skrzyń lub sektorów należących do jednej działki oraz udostępnić bezpieczny, atomowy zapis konfiguracji.

**Contract**: `public.garden_spaces` zawiera `garden_id`, `name`, `space_type` (`bed` lub `sector`), `width_cm`, `length_cm`, `sort_order` i czas utworzenia. Nazwa jest niepusta, wymiary są dodatnimi liczbami całkowitymi, a kolejność jest unikalna w obrębie działki. RLS i granty pozwalają właścicielowi na `SELECT`, `INSERT`, `UPDATE`, `DELETE`, a funkcja `public.save_garden_spaces(p_spaces jsonb)` tworzy brakującą działkę i atomowo zastępuje jej listę.

#### 2. Testy RLS i constraintów

**File**: `supabase/tests/garden_spaces.test.sql`

**Intent**: Udowodnić, że zapis przestrzeni działa tylko dla właściciela i że baza odrzuca nieprawidłowe typy, wymiary, nazwy oraz dostęp między kontami.

**Contract**: Testy pgTAP działają pod rolą `authenticated` z dwoma różnymi JWT oraz `anon`; obejmują utworzenie przez RPC, odczyt własnej listy, brak widoczności cudzej, brak możliwości zmiany/usunięcia cudzych rekordów, ograniczenie jednej działki i odrzucenie danych naruszających constrainty.

### Success Criteria:

#### Automated Verification:

- Migracje nakładają się na lokalnej bazie bez błędu: `npx supabase db reset --local --no-seed`.
- Testy migracji, constraintów i RLS przechodzą: `npm run test:db`.

#### Manual Verification:

- SQL/RLS nie ujawnia rekordów drugiego użytkownika i nie pozwala zmienić jego przestrzeni.

## Phase 2: Chroniony przepływ konfiguracji

### Overview

Dodajemy endpoint zapisu, stronę `/garden`, interaktywną listę dowolnej liczby przestrzeni i link z dashboardu.

### Changes Required:

#### 1. Walidacja i endpoint

**File**: `src/pages/api/garden.ts`

**Intent**: Przyjąć formularz konfiguracji wyłącznie od zalogowanego użytkownika, zwalidować wszystkie wiersze i wywołać atomowy RPC; błędy wracają do formularza bez ujawniania danych bazy.

**Contract**: Eksportuje `POST`, wymaga sesji Supabase, czyta powtarzalne pola `spaceName`, `spaceType`, `widthCm`, `lengthCm`, akceptuje co najmniej jeden wiersz i przekazuje do `save_garden_spaces`; sukces przekierowuje do `/garden?saved=1`, a błędy do `/garden?error=<code>`.

#### 2. Ekran i interaktywna lista

**Files**: `src/pages/garden.astro`, `src/components/garden/GardenSetupForm.tsx`, `src/middleware.ts`

**Intent**: Udostępnić zalogowanemu użytkownikowi czytelny formularz z dodawaniem/usuwaniem skrzyń i sektorów oraz pokazać poprzednio zapisane dane.

**Contract**: `/garden` jest chronione tak jak `/dashboard`; formularz ma pola nazwy, typu, szerokości i długości w cm, przyciski dodania/usunięcia wiersza i zapis. Strona ładuje relację `gardens -> garden_spaces` po stronie serwera, pokazuje komunikat sukcesu/błędu i nie renderuje danych bez zalogowanego właściciela.

#### 3. Nawigacja dashboardu

**File**: `src/pages/dashboard.astro`

**Intent**: Umożliwić wejście do konfiguracji działki z istniejącego chronionego dashboardu.

**Contract**: Dashboard zawiera link do `/garden`; reszta przepływu auth pozostaje bez zmian.

### Success Criteria:

#### Automated Verification:

- Type checking Astro przechodzi: `npx astro check`.
- Lint aplikacji przechodzi: `npm run lint`.
- Produkcyjny build SSR przechodzi: `npm run build`.

#### Manual Verification:

- Zalogowany użytkownik może dodać kilka wierszy, mieszać skrzynie i sektory, usunąć wiersz, zapisać formularz i po odświeżeniu zobaczyć te same wymiary.
- Formularz odrzuca pustą nazwę, typ spoza listy i niedodatnie/niecałkowite wymiary, a niezalogowany użytkownik trafia do logowania.

## Testing Strategy

### Unit Tests:

- Constrainty i RLS są testowane przez pgTAP w `supabase/tests/garden_spaces.test.sql`.
- Walidacja formularza jest pokryta przez testy integracyjne bazy oraz ręczne sprawdzenie komunikatów endpointu; repozytorium nie ma obecnie runnera jednostkowego dla komponentów React.

### Integration Tests:

- `npm run test:db` resetuje lokalny Supabase i uruchamia wszystkie testy SQL.
- `npx astro check`, `npm run lint` i `npm run build` weryfikują połączenie strony, endpointu i komponentu w SSR.

### Manual Testing Steps:

1. Zaloguj się i otwórz `/garden` z dashboardu.
2. Dodaj co najmniej trzy przestrzenie, wybierz oba typy, wpisz dodatnie wymiary i zapisz.
3. Odśwież stronę, usuń jedną przestrzeń, zmień wymiar i zapisz ponownie.
4. Sprawdź, że konto bez sesji jest przekierowane do `/auth/signin`, a drugi użytkownik nie widzi pierwszej konfiguracji.

## Performance Considerations

Konfiguracja jest mała i zapisywana jednym wywołaniem RPC; brak dodatkowego cache ani zapytań per wiersz. Ograniczenie rozmiaru wejścia wynika z walidacji formularza i limitu JSON żądania platformy.

## Migration Notes

Migracja jest addytywna i korzysta z istniejącej tabeli `gardens`. Usunięcie działki przez usunięcie konta kaskadowo usuwa przestrzenie; klient nie dostaje prawa do usunięcia całej działki.

## References

- `context/foundation/prd.md` — FR-002
- `context/foundation/roadmap.md` — S-02 (odczyt referencyjny, bez zmian)
- `supabase/migrations/20260923203933_create_gardens.sql` — istniejąca granica właściciela
- `context/archive/2026-09-23-private-garden-storage-boundary/reviews/impl-review.md` — wzorzec testów RLS

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands.

### Phase 1: Model danych i prywatny zapis

#### Automated

- [ ] 1.1 Migracje nakładają się na lokalnej bazie bez błędu: `npx supabase db reset --local --no-seed`.
- [ ] 1.2 Testy migracji, constraintów i RLS przechodzą: `npm run test:db`.

#### Manual

- [ ] 1.3 SQL/RLS nie ujawnia rekordów drugiego użytkownika i nie pozwala zmienić jego przestrzeni.

### Phase 2: Chroniony przepływ konfiguracji

#### Automated

- [ ] 2.1 Type checking Astro przechodzi: `npx astro check`.
- [ ] 2.2 Lint aplikacji przechodzi: `npm run lint`.
- [x] 2.3 Produkcyjny build SSR przechodzi: `npm run build`. — 28c477d

#### Manual

- [ ] 2.4 Zalogowany użytkownik może dodać, edytować, usunąć i zapisać wiele skrzyń/sektorów, a dane utrzymują się po odświeżeniu.
- [ ] 2.5 Walidacja i ochrona `/garden` odrzucają błędne dane oraz niezalogowanego użytkownika.
