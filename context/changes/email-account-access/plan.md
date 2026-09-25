# Dostęp do konta e-mailem — plan implementacji

## Overview

Dokończyć istniejący przepływ rejestracji i logowania e-mailem oraz hasłem, tak aby walidacja była egzekwowana także po stronie serwera, komunikaty nie ujawniały surowych błędów Supabase, a użytkownik trafiał po zalogowaniu do oczekiwanego widoku. Na obecnym etapie produkcja nie wymaga potwierdzenia adresu e-mail.

## Current State Analysis

- Formularze rejestracji i logowania oraz endpointy Supabase już istnieją.
- Formularz rejestracji wymaga obecnie hasła o długości 6 znaków, a konfiguracja lokalnego Supabase również dopuszcza 6 znaków.
- Endpointy rzutują wartości `FormData` na `string` bez walidacji serwerowej i przekazują surowe komunikaty Supabase w parametrze URL.
- Rejestracja zawsze kieruje do `/auth/confirm-email`, mimo że lokalne potwierdzanie e-maili jest wyłączone; ekran potwierdzenia ma odmienny tekst w produkcji.
- Logowanie zawsze kieruje na `/`; middleware chroni `/dashboard`, ale nie zachowuje docelowego adresu, który wywołał przekierowanie do logowania.
- Lokalny smoke test oczekuje przekierowania rejestracji do ekranu potwierdzenia. CI uruchamia ten smoke test na lokalnym Supabase.
- Plan wdrożenia wskazuje, że produkcyjne sekrety Supabase nadal trzeba ustawić. Aktualnego stanu Dashboardu Cloudflare ani Supabase nie sprawdzano w tej zmianie.

### Key Discoveries:

- `src/components/auth/SignUpForm.tsx:8` ustawia minimum hasła na 6 znaków; walidacja, podpowiedź i placeholder korzystają z tej wartości.
- `src/pages/api/auth/signup.ts:5-19` przyjmuje formularz, wywołuje `signUp`, ujawnia `error.message` i zawsze kieruje do `/auth/confirm-email`.
- `src/pages/api/auth/signin.ts:5-19` analogicznie przekazuje surowy błąd logowania i po sukcesie kieruje na `/`.
- `src/middleware.ts:5-23` ustawia użytkownika w sesji i chroni `/dashboard`, ale nie przenosi pierwotnego celu do formularza logowania.
- `supabase/config.toml:175` ustawia lokalne minimum na 6 znaków, a `supabase/config.toml:209` wyłącza lokalne potwierdzanie adresu e-mail.
- `scripts/smoke.mjs:39-58` obejmuje podstawowy signup/signin, lecz asercja signup nadal oczekuje starego ekranu potwierdzenia.
- `.github/workflows/ci.yml` buduje aplikację i uruchamia lokalny Supabase oraz `npm run smoke`; `package.json:6-14` udostępnia skrypty lint, build i smoke.
- `context/deployment/deploy-plan.md:96-105` opisuje brak produkcyjnych sekretów i ręczne bramki wdrożenia.

## Desired End State

Użytkownik może założyć konto i od razu rozpocząć zalogowaną sesję bez potwierdzania adresu. Hasło krótsze niż 8 znaków zostaje odrzucone zarówno przez interfejs, endpoint, jak i konfigurację lokalnego Supabase. Błędy auth są prezentowane za pomocą bezpiecznych, kontrolowanych komunikatów, a po logowaniu użytkownik wraca do pierwotnie żądanej chronionej ścieżki albo trafia do `/dashboard`.

Lokalny smoke test i CI potwierdzają pełny przepływ wraz z walidacją oraz sesją. Dokumentacja wdrożenia jasno opisuje wymagane sekrety i produkcyjne ustawienie wyłączające potwierdzanie adresu; ręczny test na koncie testowym pozostaje bramką przed uznaniem produkcyjnego auth za gotowy.

## What We're NOT Doing

- Nie włączamy potwierdzania adresu e-mail w produkcji na tym etapie.
- Nie wybieramy ani nie konfigurujemy dostawcy SMTP; będzie potrzebny po ewentualnym włączeniu e-mailowych przepływów potwierdzania lub resetu hasła.
- Nie dodajemy odzyskiwania ani zmiany zapomnianego hasła.
- Nie dodajemy logowania OAuth, MFA, panelu administracyjnego ani nowych ról.
- Nie konfigurujemy zdalnie sekretów Cloudflare/Supabase ani nie wykonujemy wdrożenia produkcyjnego w ramach planu.

## Implementation Approach

Najpierw ujednolicić zachowanie formularzy i endpointów: walidować wejście po stronie serwera, zastosować minimum 8 znaków, mapować błędy dostawcy na komunikaty aplikacji i doprowadzić signup do zalogowanego dashboardu. Następnie dostosować lokalną konfigurację i smoke test oraz dopisać produkcyjną checklistę ręcznej weryfikacji. Zachować istniejący Supabase SSR, sesyjne cookies Astro i istniejący przepływ CI.

## Critical Implementation Details

Przy wyłączonym potwierdzaniu adresu Supabase zwraca sesję podczas udanej rejestracji; endpoint powinien zachować ustawione przez klienta SSR cookies i nie kierować użytkownika do callbacku e-mailowego. Docelowy adres przekazywany z middleware do formularza logowania musi być ograniczony do ścieżki lokalnej aplikacji, aby nie tworzyć otwartego przekierowania.

## Phase 1: Bezpieczna rejestracja i logowanie

### Overview

Wyrównać walidację i komunikaty między UI, endpointami oraz sesją Supabase. Po rejestracji użytkownik trafia do dashboardu, a po logowaniu wraca do bezpiecznej ścieżki, której żądał przed uwierzytelnieniem.

### Changes Required:

#### 1. Ujednolicenie walidacji rejestracji

**File**: `src/components/auth/SignUpForm.tsx`

**Intent**: Podnieść minimum hasła z 6 do 8 znaków i utrzymać spójny komunikat, podpowiedź oraz placeholder.

**Contract**: Interfejs rejestracji komunikuje tę samą granicę hasła, którą egzekwuje endpoint i lokalny Supabase.

**File**: `src/pages/api/auth/signup.ts`

**Intent**: Walidować obecność, typ i podstawową poprawność pól przed wywołaniem Supabase, niezależnie od walidacji przeglądarkowej.

**Contract**: Nieprawidłowe dane nie wywołują `auth.signUp`; błędy walidacji wracają do kontrolowanych komunikatów formularza.

#### 2. Bezpieczne wyniki endpointów auth

**File**: `src/pages/api/auth/signup.ts`, `src/pages/api/auth/signin.ts`

**Intent**: Zastąpić surowe teksty dostawcy zestawem bezpiecznych komunikatów aplikacji, w tym ogólnym komunikatem niepowodzenia logowania, który nie ujawnia, czy konto istnieje. Komunikaty muszą być wybierane przez allowlistę kodów, a nie przez dowolny tekst z URL.

**Contract**: Endpointy umieszczają w parametrze błędu wyłącznie ustalone kody aplikacji. Strony signup/signin mapują allowlistę tych kodów na komunikaty UI; nieznany kod ani dowolna wartość `?error=` pokazuje ogólny komunikat. Interfejs nie wyświetla surowego `error.message` z Supabase.

#### 3. Przekierowania po auth

**File**: `src/middleware.ts`, `src/pages/auth/signin.astro`, `src/components/auth/SignInForm.tsx`, `src/pages/api/auth/signin.ts`, `src/pages/api/auth/signup.ts`

**Intent**: Zachować lokalną chronioną ścieżkę przy wysłaniu niezalogowanego użytkownika do logowania; po sukcesie logowania wrócić do niej, a w pozostałych przypadkach użyć `/dashboard`. Udana rejestracja bez potwierdzenia również otwiera dashboard.

**Contract**: Docelowa ścieżka jest przenoszona przez formularz i używana wyłącznie po udanym logowaniu. Kandydat na `returnTo` musi zaczynać się od pojedynczego `/`, nie może zaczynać się od `//` ani zawierać backslashy; po sparsowaniu względem originu aplikacji musi zachować ten sam origin. Niepoprawna wartość prowadzi do `/dashboard`. Signup nie kieruje do `/auth/confirm-email`.

#### 4. Zachowanie ekranów auth

**File**: `src/pages/auth/confirm-email.astro`, `src/pages/auth/signup.astro`, `src/pages/auth/signin.astro`, `README.md`

**Intent**: Usunąć mylący ekran potwierdzenia z aktywnego przepływu; zachować czytelne komunikaty błędów i ekran rejestracji/logowania dla kontrolowanych stanów.

**Contract**: Żaden aktywny link ani endpoint rejestracji nie wymaga potwierdzenia adresu. Strony auth prezentują wyłącznie komunikaty z allowlisty kodów błędów, a nieznane wartości query zastępują ogólnym komunikatem. Ekran potwierdzenia może zostać usunięty po sprawdzeniu, że nie ma innych odwołań. README opisuje aktualny przepływ signup i nie przedstawia `/auth/confirm-email` jako ekranu po udanej rejestracji.

#### 5. Współdzielone narzędzia auth

**File**: `src/lib/auth-utils.ts`

**Intent**: Centralizować mapowanie kodów błędów auth na kontrolowane komunikaty oraz walidację bezpiecznego lokalnego `returnTo`, używane przez endpointy i strony auth.

**Contract**: Nieznany kod błędu wyświetla komunikat ogólny; niepoprawny `returnTo` kończy się na `/dashboard`, a prawidłowy zachowuje wyłącznie lokalną ścieżkę, query i hash.

### Success Criteria:

#### Automated Verification:

- Walidacja formularza rejestracji i endpointu odrzuca hasło krótsze niż 8 znaków.
- Endpointy signup i signin nie przekazują surowych komunikatów Supabase w adresie ani do interfejsu.
- Nieznany lub dowolny parametr `?error=` na stronach auth pokazuje wyłącznie ogólny komunikat.
- Niepoprawne wartości `returnTo` — pełny URL, `//obcy-host` lub wartość z backslashem — prowadzą do `/dashboard`.
- `npm run lint` przechodzi.
- `npx astro check` przechodzi.

#### Manual Verification:

- Rejestracja poprawnym adresem i hasłem tworzy sesję i otwiera `/dashboard` bez ekranu potwierdzenia.
- Logowanie z błędnym hasłem pokazuje ogólny komunikat, a nie surowy błąd dostawcy.
- Logowanie po wejściu na chronioną ścieżkę wraca do niej; zwykłe logowanie kończy się na `/dashboard`.
- README wymienia aktualne trasy auth i nie opisuje potwierdzenia e-mail jako kroku po rejestracji.

**Implementation Note**: Po ukończeniu tej fazy i przejściu weryfikacji automatycznej zatrzymaj się po ręczne potwierdzenie powyższych zachowań.

## Phase 2: Testy przepływu i gotowość produkcyjna

### Overview

Zsynchronizować lokalną konfigurację, smoke test i dokumentację z wybraną polityką: minimum 8 znaków, signup bez potwierdzenia e-mail i brak zależności od SMTP. Opisać ręczną kontrolę sekretów oraz ustawienia produkcyjnego Supabase.

### Changes Required:

#### 1. Lokalna konfiguracja i smoke test

**File**: `supabase/config.toml`, `scripts/smoke.mjs`

**Intent**: Ustawić lokalne minimum hasła na 8 znaków i aktualizować smoke test tak, by sprawdzał walidację, udaną rejestrację bez potwierdzenia, błędne i poprawne logowanie, sesję dashboardu oraz wylogowanie.

**Contract**: Lokalny test używa konfiguracji bez potwierdzania (`enable_confirmations = false`) i nie oczekuje `/auth/confirm-email`; sprawdza też, że błędne logowanie nie ujawnia surowej wiadomości Supabase.

#### 2. Produkcyjna checklista auth

**File**: `context/deployment/deploy-plan.md`

**Intent**: Uaktualnić bramki auth zgodnie z obecną decyzją i stanem zapisanym w planie wdrożenia.

**Contract**: Checklista wymaga ustawienia `SUPABASE_URL` i `SUPABASE_KEY` jako sekretów Workera, minimum hasła 8 znaków, weryfikacji że signup w produkcyjnym Supabase nie wymaga potwierdzenia e-mail oraz ręcznego testu na koncie testowym; SMTP i redirect URL-e dla linków e-mailowych są odłożone do momentu włączenia tych przepływów. Wartości sekretów nie trafiają do repozytorium, logów ani rozmowy.

### Success Criteria:

#### Automated Verification:

- `npm run smoke` przechodzi przeciwko lokalnemu preview z Supabase skonfigurowanym przez repozytoryjny test/CI.
- CI przechodzi, w tym lokalny Supabase, testy bazy, build i auth smoke test.
- `npm run build` przechodzi.

#### Manual Verification:

- Przed uznaniem produkcyjnego auth za gotowy operator sprawdza oba sekrety Workera, minimum hasła 8 znaków i wyłączone potwierdzanie adresu e-mail w Supabase.
- Na koncie testowym w preview lub produkcji operator potwierdza rejestrację bez linku e-mailowego, logowanie, dostęp do dashboardu i wylogowanie.

**Implementation Note**: Po ukończeniu tej fazy i przejściu weryfikacji automatycznej zatrzymaj się po ręczne potwierdzenie checklisty i testu środowiska.

## Testing Strategy

### Unit Tests:

- Nie dodawać osobnego runnera unit testów; weryfikacja walidacji i komunikatów należy do istniejącego smoke testu integracyjnego.

### Integration Tests:

- Użyć istniejącego `scripts/smoke.mjs` uruchamianego przez CI z lokalnym Supabase, aby sprawdzić signup, signin, sesję, ochronę `/dashboard` i signout.
- Dodać sprawdzenie, że rejestracja bez potwierdzenia ustanawia sesję zgodnie z konfiguracją `supabase/config.toml`.

### Manual Testing Steps:

1. W formularzu wpisać hasło 7-znakowe — UI powinno je odrzucić; to samo żądanie wysłane bezpośrednio do endpointu również nie może utworzyć konta.
2. Zarejestrować konto testowe w lokalnym/preview Supabase — oczekiwany jest dashboard bez wymogu otwierania poczty.
3. Wylogować się, wejść na `/dashboard`, zalogować i sprawdzić powrót do żądanej ścieżki.
4. Wykonać ręczną checklistę produkcyjną dopiero po skonfigurowaniu sekretów i uzyskaniu dostępu operatora.

## Performance Considerations

Zmiana nie dodaje nowych zapytań ani ciężkich obliczeń; pozostaje w istniejących wywołaniach Supabase Auth.

## Migration Notes

Zmiana nie wymaga migracji bazy. Istniejące konta i sesje Supabase pozostają bez zmian. Ustawienie minimalnego hasła dotyczy nowych rejestracji i walidacji; istniejące hasła krótsze niż 8 znaków nie są automatycznie zmieniane.

## References

- `context/foundation/roadmap.md` — S-01: dostęp przez konto e-mail.
- `context/foundation/prd.md` — FR-001 i zasady prywatności konta.
- `context/deployment/deploy-plan.md` — produkcyjne sekrety i ręczne bramki wdrożenia.
- [Supabase Password-based Auth](https://supabase.com/docs/guides/auth/passwords) — sesja przy signup i ustawienia potwierdzania adresu.
- [Supabase Custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp) — SMTP jako wymóg dopiero dla produkcyjnych wiadomości auth.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Bezpieczna rejestracja i logowanie

#### Automated

- [x] 1.1 Walidacja formularza rejestracji i endpointu odrzuca hasło krótsze niż 8 znaków.
- [x] 1.2 Endpointy signup i signin nie przekazują surowych komunikatów Supabase w adresie ani do interfejsu.
- [x] 1.3 `npm run lint` przechodzi.
- [x] 1.4 `npx astro check` przechodzi.
- [x] 1.8 Niepoprawne wartości `returnTo` — pełny URL, `//obcy-host` lub wartość z backslashem — prowadzą do `/dashboard`.
- [x] 1.9 Nieznany lub dowolny parametr `?error=` na stronach auth pokazuje wyłącznie ogólny komunikat.

#### Manual

- [x] 1.5 Rejestracja poprawnym adresem i hasłem tworzy sesję i otwiera `/dashboard` bez ekranu potwierdzenia.
- [x] 1.6 Logowanie z błędnym hasłem pokazuje ogólny komunikat, a nie surowy błąd dostawcy.
- [x] 1.7 Logowanie po wejściu na chronioną ścieżkę wraca do niej; zwykłe logowanie kończy się na `/dashboard`.
- [x] 1.10 README wymienia aktualne trasy auth i nie opisuje potwierdzenia e-mail jako kroku po rejestracji.

### Phase 2: Testy przepływu i gotowość produkcyjna

#### Automated

- [ ] 2.1 `npm run smoke` przechodzi przeciwko lokalnemu preview z Supabase skonfigurowanym przez repozytoryjny test/CI.
- [ ] 2.2 CI przechodzi, w tym lokalny Supabase, testy bazy, build i auth smoke test.
- [ ] 2.3 `npm run build` przechodzi.

#### Manual

- [ ] 2.4 Przed uznaniem produkcyjnego auth za gotowy operator sprawdza oba sekrety Workera, minimum hasła 8 znaków i wyłączone potwierdzanie adresu e-mail w Supabase.
- [ ] 2.5 Na koncie testowym w preview lub produkcji operator potwierdza rejestrację bez linku e-mailowego, logowanie, dostęp do dashboardu i wylogowanie.
