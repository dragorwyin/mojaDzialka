# Minimalny prywatny zapis działki — Implementation Plan

## Overview

Dodajemy minimalną trwałą granicę danych dla jednej prywatnej działki przypisanej do konta Supabase Auth. Zmiana obejmuje schemat, egzekwowanie własności w bazie, testy izolacji oraz uruchamianie testów w istniejącym CI; nie tworzy jeszcze przepływu użytkowego ani planera.

## Current State Analysis

Repozytorium ma skonfigurowany lokalny Supabase i sesyjnego klienta SSR, ale nie ma migracji, tabel aplikacyjnych ani testów bazy. Middleware sprawdza użytkownika dla dashboardu, lecz nie ma warstwy danych ani ogólnej ochrony API; dlatego prywatność tabeli musi być egzekwowana przez RLS, a nie sam interfejs lub filtrowanie po stronie aplikacji. Job `smoke` w CI uruchamia lokalny Supabase i testuje aplikację, ale nie resetuje/testuje schematu. Konfiguracja Supabase włącza seed wskazujący na nieistniejący `supabase/seed.sql`.

## Desired End State

Istnieje addytywna migracja tworząca minimalny rekord działki z kluczem właściciela powiązanym z `auth.users`, unikalnością właściciela i regułami RLS ograniczającymi dostęp do własnego rekordu. Testy bazy potwierdzają ograniczenia i izolację dwóch kont. Lokalny job CI resetuje bazę bez seedów, uruchamia testy SQL, a następnie zachowuje dotychczasowy smoke test.

### Key Discoveries:

- `supabase/` zawiera obecnie tylko `config.toml` i `.gitignore`; nie ma migracji ani testów SQL.
- `src/lib/supabase.ts:5-9` tworzy klienta SSR z nagłówków żądania i cookies; konfiguracja sekretów jest opcjonalna w `astro.config.mjs:19-20`.
- `src/middleware.ts:7-19` pobiera i udostępnia zalogowanego użytkownika dla chronionego dashboardu, ale nie stanowi ochrony bazy.
- `.github/workflows/ci.yml:27-57` ma osobny job `smoke`, który uruchamia Supabase i zawsze go zatrzymuje; jest to istniejące miejsce integracji testów DB.
- `supabase/config.toml:53-65` włącza migracje i wskazuje seed `./seed.sql`, którego brak; reset testowy musi jawnie pominąć seedy.
- PRD i F-01 w `context/foundation/roadmap.md` wymagają jednej prywatnej działki przypisanej do konta; skrzynie, katalog upraw i planowanie należą do późniejszych slice’ów.

## What We're NOT Doing

- Nie dodajemy ekranów ani endpointów do odczytu działki ani automatycznego tworzenia jej przy rejestracji; właścicielski odczyt rekordu w bazie pozostaje w zakresie RLS.
- Nie dodajemy skrzyń/sektorów, upraw, planów sezonu ani reguł generowania układu.
- Nie dodajemy wielu działek, współdzielenia ani uprawnień administratora.
- Nie implementujemy blokowania kont; przed włączeniem tej przyszłej funkcji jej stan musi odbierać użytkownikowi dostęp do działki.
- Nie naprawiamy niezależnie konfiguracji seedów i nie dodajemy danych demonstracyjnych.
- Nie dodajemy polityki usuwania działki przez klienta; usuwanie konta może kaskadowo usuwać rekord.

## Implementation Approach

Najpierw wprowadzamy jedną addytywną migrację dla minimalnego rekordu oraz ograniczeń własności i RLS. Następnie dodajemy testy pgTAP uruchamiane na czystej lokalnej bazie i wpinamy je do istniejącego joba Supabase w CI. Testy odtwarzają tożsamość dwóch użytkowników, sprawdzają utworzenie i odczyt własnego rekordu oraz brak możliwości odczytu, zmiany lub utworzenia rekordu dla innego właściciela.

## Phase 1: Migracja i granica własności danych

### Overview

Dodajemy minimalny model jednej działki na konto oraz egzekwujemy jego prywatność w PostgreSQL/Supabase. Faza nie udostępnia rekordu przez UI ani API.

### Changes Required:

#### 1. Schemat prywatnej działki

**File**: `supabase/migrations/<timestamp>_create_gardens.sql`

**Intent**: Utworzyć minimalną tabelę działek jako trwały fundament dla późniejszej konfiguracji ogrodu. Klucz właściciela musi wskazywać konto Supabase Auth, a baza ma wymuszać najwyżej jeden rekord na konto.

**Contract**: Tabela `public.gardens` zawiera identyfikator UUID, `user_id` powiązany z `auth.users(id)` oraz czas utworzenia; `user_id` jest `NOT NULL` i `UNIQUE`. Włączone RLS oraz jawne uprawnienia: odebrać domyślne uprawnienia `anon` i `authenticated`, a następnie przyznać roli `authenticated` wyłącznie `SELECT`, `INSERT` i `UPDATE`. Granularne polityki dla tych operacji ograniczają każdą z nich do właściciela; `user_id` po zapisie pozostaje zgodny z `auth.uid()`. Nie przyznawać `DELETE` ani nie dodawać polityki usuwania dla klienta; usunięcie konta usuwa zależny rekord.

### Success Criteria:

#### Automated Verification:

- `supabase db reset --local --no-seed` stosuje migrację na pustej lokalnej bazie bez błędu.

## Phase 2: Testy DB i integracja CI

### Overview

Dodajemy powtarzalne testy schematu i RLS oraz uruchamiamy je w jobie, który już startuje lokalne Supabase. Testy mają wykrywać zarówno naruszenie ograniczenia jednej działki na konto, jak i dostęp między użytkownikami.

### Changes Required:

#### 1. Testy pgTAP dla własności i prywatności

**File**: `supabase/tests/gardens.test.sql`

**Intent**: Udowodnić kontrakt tabeli na dwóch różnych tożsamościach oraz dla niezalogowanej roli. Testy obejmują ograniczenie jednego rekordu na konto i niedozwolone próby wejścia w dane innego właściciela.

**Contract**: Testy pgTAP wykonują asercje w kontekście roli `anon` i dwóch różnych tożsamości JWT działających jako `authenticated`; testy dostępu nie mogą działać jako uprzywilejowany `postgres` ani `service_role`. Sprawdzają utworzenie, odczyt i zmianę własnej działki; brak widoczności i możliwości zmiany cudzej; odrzucenie próby przypisania rekordu do innego `user_id`; odrzucenie drugiej działki tego samego użytkownika; brak dostępu `anon`; oraz odmowę usunięcia działki przez właściciela.

#### 2. Skrypt testów bazy i job CI

**Files**: `package.json`, `.github/workflows/ci.yml`

**Intent**: Uczynić weryfikację DB jednym powtarzalnym krokiem i uruchomić ją w istniejącym lokalnym środowisku Supabase przed smoke testem. Job nadal zatrzymuje lokalny stack w kroku z warunkiem `always()`.

**Contract**: Skrypt `npm run test:db` wykonuje lokalny reset z `--no-seed`, a następnie `supabase test db` na domyślnej lokalnej bazie. Job `smoke` wywołuje ten skrypt po starcie Supabase i przed budowaniem/preview; wersja CLI instalowana przez `supabase/setup-cli` musi być przypięta do wersji z `package-lock.json` (obecnie `2.117.0`), nie do `latest`. Job nie łączy się z produkcyjną bazą.

### Success Criteria:

#### Automated Verification:

- `npm run test:db` stosuje migracje od zera i przechodzi wszystkie asercje pgTAP.
- Job `smoke` w CI przechodzi z testami DB oraz dotychczasowym smoke testem aplikacji.
- Job zatrzymuje lokalne Supabase także po niepowodzeniu testów.

#### Manual Verification:

- W wynikach joba CI widać osobny krok `npm run test:db` przed dotychczasowym buildem i smoke testem.

**Implementation Note**: Po ukończeniu fazy i przejściu automatycznej weryfikacji zatrzymaj się na ręcznym potwierdzeniu wyniku CI przed przejściem dalej.

## Testing Strategy

### Unit Tests:

- Nie dodajemy testów jednostkowych logiki aplikacyjnej, ponieważ zmiana nie wprowadza kodu aplikacji.

### Integration Tests:

- pgTAP w lokalnym Supabase sprawdza constraint unikalności, klucz obcy, uprawnienia ról i izolację RLS pomiędzy dwoma użytkownikami.
- Asercje dostępu ustawiają role i tożsamości JWT dwóch użytkowników oraz `anon`; nie używają roli omijającej RLS. Testują również odmowę klientowskiego `DELETE`.
- Test DB jest uruchamiany na świeżej bazie przez `supabase db reset --local --no-seed` przed `supabase test db`.
- Istniejący smoke test pozostaje bez zmian funkcjonalnych i weryfikuje, że dotychczasowy przepływ aplikacji nadal działa przy uruchomionej bazie.

### Manual Testing Steps:

1. Otworzyć wynik joba `smoke` w CI i potwierdzić, że krok testów bazy kończy się przed buildem oraz smoke testem.
2. Sprawdzić, że job zatrzymał lokalne Supabase również po wykonaniu weryfikacji.

## Performance Considerations

Zmiana dodaje niewielką tabelę i indeks unikalny na `user_id`; nie wprowadza zapytań ani dodatkowego ruchu w ścieżce żądania aplikacji. Brak potrzeby benchmarków dla tej skali.

## Migration Notes

Migracja jest addytywna i nie przenosi istniejących danych, bo tabela aplikacyjna jeszcze nie istnieje. Weryfikacja lokalna/CI jawnie używa `--no-seed`, aby nie zależeć od nieobecnego `supabase/seed.sql`. Po wdrożeniu nie cofać schematu przez destrukcyjne usuwanie tabeli; ewentualną korektę realizować migracją naprawczą zgodną wstecz.

Wymóg PRD dotyczący zablokowanych kont nie jest realizowany przez F-01. Zanim zostanie włączona funkcja blokowania kont, jej mechanizm musi uniemożliwiać dostęp do działki również przez bezpośrednie żądania do Supabase, a nie tylko ukrywać funkcje w UI.

## References

- `context/foundation/prd.md` — wymagania prywatności, jedna działka na konto i trwałość danych.
- `context/foundation/roadmap.md` — F-01 oraz zależności od S-02/S-03.
- `supabase/config.toml` — lokalne ustawienia migracji i seedów.
- `.github/workflows/ci.yml` — istniejący lokalny job Supabase i smoke test.
- [Supabase: Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase: Testing Your Database](https://supabase.com/docs/guides/database/testing)

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `.agents/skills/10x-plan/references/progress-format.md`.

### Phase 1: Migracja i granica własności danych

#### Automated

- [x] 1.1 `supabase db reset --local --no-seed` stosuje migrację na pustej lokalnej bazie bez błędu. — 423a260

### Phase 2: Testy DB i integracja CI

#### Automated

- [x] 2.1 `npm run test:db` stosuje migracje od zera i przechodzi wszystkie asercje pgTAP. — fa7ae0c
- [x] 2.2 Job `smoke` w CI przechodzi z testami DB oraz dotychczasowym smoke testem aplikacji. — fa7ae0c
- [x] 2.3 Job zatrzymuje lokalne Supabase także po niepowodzeniu testów. — fa7ae0c

#### Manual

- [x] 2.4 W wynikach joba CI widać osobny krok `npm run test:db` przed dotychczasowym buildem i smoke testem. — fa7ae0c
