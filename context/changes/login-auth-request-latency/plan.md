# Ograniczenie opóźnień logowania — Implementation Plan

## Overview

Usunąć niepotrzebne odświeżanie istniejącej sesji z publicznych żądań stron i endpointów auth. Po odrzuconym logowaniu usunąć lokalne cookie sesji, żeby kolejne otwarcie formularza nie odziedziczyło starego stanu. Chronione trasy nadal sprawdzają użytkownika i odmawiają dostępu przy błędzie weryfikacji.

## Current State Analysis

Middleware wykonuje `auth.getUser()` przed sprawdzeniem, czy ścieżka wymaga logowania (`src/middleware.ts:6-23`). Rzeczywisty lokalny ślad wykazał siedem nieudanych prób odświeżenia cookie przed rozpoczęciem weryfikacji hasła po 27,4 s; pełny POST trwał 29,5 s (`context/changes/login-auth-request-latency/research.md`). Szybkie pomiary GET/POST bez cookies wyniosły 0,46/0,20 s na produkcji i 0,26/0,50 s lokalnie. Nie ma śladu wolnego żądania produkcyjnego.

Endpoint signin tworzy własnego klienta i przy błędnym haśle tylko przekierowuje do formularza (`src/pages/api/auth/signin.ts:20-30`). `@supabase/ssr` 0.12.7 udostępnia `clearAuthCookiesAtScopes`, które usuwa wszystkie rozpoznane fragmenty cookie dla danego storage key bez inicjalizacji Auth i bez kolejnego requestu sieciowego. Lokalny klient jest tworzony w `src/lib/supabase.ts:9-20`.

## Desired End State

Publiczne strony i endpointy auth nie czekają na odświeżanie sesji z globalnego middleware. Błędne logowanie kończy się usunięciem zastanej sesji i bezpiecznym przekierowaniem do formularza. Dostęp do `/dashboard` i `/garden` nadal wymaga pozytywnego `getUser()`; błąd weryfikacji nigdy nie otwiera chronionej trasy.

Przy aktywnym lokalnym Auth żądania signin bez sesji i z przeterminowanym/uszkodzonym cookie kończą się w czasie krótszym niż 20 s, a żądanie hasła nie jest poprzedzone próbami `grant_type=refresh_token`. Zmierzone żądania produkcyjne bez cookies pozostają szybkie; wolny trace produkcyjny, jeśli wystąpi, jest diagnozowalny bez rejestrowania sekretów.

### Key Discoveries:

- Globalne `getUser()` poprzedza endpoint signin i strony błędu (`src/middleware.ts:7-14`).
- Rzeczywisty trace lokalny łączy 29,5 s POST z siedmioma retry `refresh_token`, błędem `Network connection lost.` i późniejszym requestem password signin (research.md, trace `d6456b89039245481bef2ba7d5da6db5`).
- Klient SSR obsługuje cookie przez `getAll`/`setAll`; sesja może być dzielona na fragmenty (`src/lib/supabase.ts:9-20`, zainstalowane `@supabase/ssr` 0.12.7).
- `auth.signOut()` inicjalizuje klienta przed usunięciem sesji, więc po awarii refresh może powtórzyć oczekiwanie. Do wyczyszczenia cookie po błędnym signin użyć helpera SSR, który nie uruchamia klienta Auth (`node_modules/@supabase/auth-js/src/GoTrueClient.ts:4069-4079`, `node_modules/@supabase/ssr/src/clearAuthCookiesAtScopes.ts:40-76`).
- Smoke test ma istniejący, działający wzorzec cookie jar i pokrywa zły password oraz chronione trasy (`scripts/smoke.mjs:1-55, 136-155`).

## What We're NOT Doing

- Nie zmieniamy dostawcy auth, ustawień Supabase, haseł, SMTP ani regionu projektu.
- Nie osłabiamy ochrony chronionych stron ani endpointów API i nie autoryzujemy użytkownika na podstawie niezweryfikowanego cookie.
- Nie dodajemy nowego retry ani nie zmieniamy domyślnego timeoutu SDK.
- Nie wdrażamy automatycznego deployu ani nie używamy danych logowania użytkownika w automatycznych pomiarach.

## Implementation Approach

W middleware najpierw rozpoznawać chronione ścieżki. Tylko dla nich pobierać i weryfikować użytkownika; pozostałe trasy, w tym `/auth/*` i `/api/auth/*`, kontynuują obsługę bez refreshu sesji. Przy błędnym wyniku `signInWithPassword` usuwać wszystkie fragmenty cookie bieżącej sesji lokalnie helperem `clearAuthCookiesAtScopes`, po czym zachować istniejący bezpieczny redirect i komunikat. Zachować fail-closed dla chronionych stron. Dodać scenariusze do istniejącego smoke testu, a potem zweryfikować pomiary lokalne i produkcyjne na koncie testowym przez operatora.

## Critical Implementation Details

### Timing & lifecycle

Nie wywoływać `auth.signOut()` w ścieżce odrzuconego signin: zainstalowany `signOut()` czeka na `initializePromise`, które może ponownie próbować odświeżyć wygasłą sesję. Czyszczenie cookie musi działać bez uruchomienia klienta Auth i obejmować fragmenty o nazwach wynikających z bieżącego `SUPABASE_URL`.

### Performance constraints

Sukces signin jest poniżej 20 s w przypadku lokalnego awarii opisanym w researchu, gdyż publiczny POST nie czeka na refresh przed requestem hasła. Auth może nadal być niedostępny; kryterium nie maskuje tej awarii i nie gwarantuje czasu zewnętrznej usługi.

### Debug & observability

W logach i DevTools porównywać czasy middleware, wywołania hasła i odpowiedzi route. Zapisywać wyłącznie ścieżkę, czas, status HTTP lub nazwę/kod błędu; nigdy wartość cookie, tokenu, hasło, e-mail ani body formularza. Ślady historyczne Cloudflare lokalnego runtime nie są dowodem zachowania produkcji.

## Phase 1: Usuń blokadę sesji z logowania

### Overview

Ograniczyć middleware do chronionych ścieżek i bezpiecznie czyścić zastaną sesję po błędnym haśle. Weryfikację oprzeć o istniejący smoke test lokalny z Supabase.

### Changes Required:

#### 1. Zakres weryfikacji middleware

**File**: `src/middleware.ts`

**Intent**: Pominąć sprawdzanie sesji dla publicznych widoków i endpointów, żeby stare cookie nie opóźniało wejścia na formularz ani wysłania hasła.

**Contract**: `getUser()` jest wykonywane przed dalszą obsługą tylko dla `/dashboard` i `/garden` oraz ich podścieżek. Nieznana lub nieudana weryfikacja nie zapewnia dostępu do tras chronionych; brak klienta Supabase pozostaje stanem anonimowym.

#### 2. Czyszczenie odrzuconej sesji

**File**: `src/lib/supabase.ts`, `src/pages/api/auth/signin.ts`

**Intent**: Udostępnić bezpośrednie czyszczenie cookie sesji SSR i użyć go, gdy hasło zostanie odrzucone. Dzięki temu następny GET formularza nie przetwarza starego cookie.

**Contract**: Czyszczenie usuwa wszystkie obecne fragmenty cookie dla storage key aktualnego projektu, używa bieżącego zakresu cookie i nie inicjalizuje `auth.signOut()` ani dodatkowego requestu do Supabase. Redirect `signin_failed` i allowlista komunikatów pozostają bez zmian; udane signin zapisuje nową sesję.

#### 3. Regresja auth w smoke teście

**File**: `scripts/smoke.mjs`

**Intent**: Wykazać, że stare lub podzielone cookie nie wywołuje refresh przed publicznym signin oraz że błędne hasło czyści sesję.

**Contract**: Istniejący test sprawdza: publiczny GET signin z auth cookie; POST ze starą sesją i błędnym hasłem; usunięcie wszystkich fragmentów cookie i ogólny komunikat; brak dostępu do dashboardu/garden przy sesji niezweryfikowanej; poprawne signin i dostęp po pozytywnej weryfikacji. Żadne wartości sekretów nie trafiają do asercji ani logów.

### Success Criteria:

#### Automated Verification:

- `npm run smoke` z lokalnym Supabase przechodzi dla testów publicznego signin, nieudanego i udanego signin oraz chronionych tras.
- Dla publicznego GET i POST z przeterminowanym cookie trace nie pokazuje requestu `refresh_token` przed renderowaniem strony lub requestem password signin.
- Po odrzuceniu hasła odpowiedź usuwa wszystkie cookie chunk sesji i zachowuje redirect `signin_failed`.
- `npm run lint`, `npx astro check` i `npm run build` przechodzą.

#### Manual Verification:

- W lokalnej przeglądarce otwarcie signin z poprzednim/starym cookie pokazuje formularz; błędne hasło kończy się ogólnym błędem, a kolejne przejście nie niesie starej sesji.
- Zalogowany użytkownik nadal przechodzi do chronionych stron, a anonimowy lub nieweryfikowalny jest przekierowany do signin.

**Implementation Note**: Po automatycznych kryteriach zatrzymać się i uzyskać od użytkownika potwierdzenie lokalnego ręcznego przepływu przed fazą 2.

---

## Phase 2: Potwierdź zachowanie produkcji

### Overview

Potwierdzić regresję produkcyjną z kontem testowym i zebrać minimalny bezpieczny pomiar wolnego przypadku, jeśli nadal występuje.

### Changes Required:

#### 1. Bezpieczny scenariusz produkcyjny i dokumentacja wyniku

**File**: `context/changes/login-auth-request-latency/research.md`

**Intent**: Dopisać czasy z produkcyjnych prób wolnych i szybkich oraz rozstrzygnąć, czy ścieżka z auth cookie dalej blokuje signin.

**Contract**: Procedura używa konta testowego operatora i nie zapisuje ani nie przekazuje jego danych uwierzytelniających. Wynik zawiera czasy i bezpieczne statusy/kody błędów, bez tokenów, cookie, e-maili ani treści requestów. Jeśli nie można uzyskać slow trace, luka pozostaje jawna.

### Success Criteria:

#### Manual Verification:

- Operator potwierdza signin na produkcji oraz zachowanie po błędnym haśle i po wejściu z zastanym cookie.
- Produkcyjny request signin kończy się poniżej 20 s przy działającym Auth; jeśli nie, zachowany trace rozdziela middleware od password Auth i ujawnia wyłącznie bezpieczny status/kod błędu.
- Anonimowy request do chronionej trasy nadal kończy się redirectem, a zalogowany użytkownik ma dostęp.

**Implementation Note**: Zatrzymać się po ręcznej weryfikacji; wdrożenie kodu jest poza fazą pomiaru i wymaga standardowego procesu publikacji repozytorium.

## Testing Strategy

### Unit Tests:

- Nie dodawać osobnych testów jednostkowych; kontrakt cookie i redirectu lepiej sprawdza istniejący test smoke z prawdziwym lokalnym Auth.

### Integration Tests:

- Użyć `scripts/smoke.mjs` i Supabase lokalnego do weryfikacji starej sesji, błędnego hasła, wyczyszczenia cookie, poprawnego signin i ochrony tras.
- Porównać span GET/POST signin oraz fetch Auth dla scenariusza bez cookie i z przeterminowanym cookie; uwzględnić ciepły i zimny start osobno.

### Manual Testing Steps:

1. Otworzyć `/auth/signin` w zwykłym oknie z istniejącą sesją; przesłać błędne hasło i potwierdzić, że formularz pokazuje komunikat, a sesyjne cookies znikają.
2. Powtórzyć z cookie starej sesji i zweryfikować, że publiczne strony auth nie czekają na żądanie refresh.
3. Zalogować się poprawnie, otworzyć `/dashboard` i `/garden`, wylogować się, a następnie potwierdzić przekierowanie anonimowego użytkownika.
4. Na produkcji wykonać te kroki wyłącznie na koncie testowym i zapisać bezpieczne czasy/statusy.

## Performance Considerations

Główna granica wydajności dotyczy publicznej ścieżki auth, która nie powinna czekać na refresh sesji z middleware. Weryfikacja chronionych stron nadal zależy od Auth; jej ogólne opóźnienia pozostają poza gwarancją tej zmiany i wymagają osobnej diagnozy, jeśli występują.

## Migration Notes

Brak migracji danych. Usuwane są wyłącznie cookie sesji bieżącego projektu w bieżącym scope przeglądarki, po odrzuconym signin.

## References

- Research: `context/changes/login-auth-request-latency/research.md`
- Frame: `context/changes/login-auth-request-latency/frame.md`
- Middleware: `src/middleware.ts:6-23`
- Signin endpoint: `src/pages/api/auth/signin.ts:5-30`
- SSR client: `src/lib/supabase.ts:1-20`
- Smoke flow: `scripts/smoke.mjs:1-155`
- Supabase SSR cookie helper: `node_modules/@supabase/ssr/src/clearAuthCookiesAtScopes.ts:40-76`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Usuń blokadę sesji z logowania

#### Automated

- [x] 1.1 `npm run smoke` potwierdza obsługę starego cookie, błędnego i poprawnego signin oraz ochronę tras. — de0d70f
- [x] 1.2 Ślady potwierdzają brak refresh przed publicznym signin. — de0d70f
- [x] 1.3 Po odrzuceniu hasła odpowiedź usuwa wszystkie fragmenty cookie. — de0d70f
- [x] 1.4 Lint, Astro check i build przechodzą. — de0d70f

#### Manual

- [x] 1.5 Lokalny test potwierdza formularz i czyszczenie sesji po nieudanym signin. — de0d70f
- [x] 1.6 Zalogowany użytkownik zachowuje dostęp, a anonimowy jest przekierowany z chronionych stron. — de0d70f

### Phase 2: Potwierdź zachowanie produkcji

#### Manual

- [x] 2.1 Operator potwierdza signin, błąd hasła, zachowanie zastanej sesji i ochronę tras na koncie testowym. — 959ad9c
- [x] 2.2 Wynik produkcyjny zapisuje bezpieczne czasy/statusy albo jawnie pozostawia brak slow trace. — 959ad9c
- [x] 2.3 Anonimowy request produkcyjny do chronionej trasy jest przekierowany, a zalogowany ma dostęp. — 959ad9c
