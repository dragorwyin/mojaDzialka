# Ograniczenie opóźnień logowania — Plan Brief

> Full plan: `context/changes/login-auth-request-latency/plan.md`
> Frame brief: `context/changes/login-auth-request-latency/frame.md`
> Research: `context/changes/login-auth-request-latency/research.md`

## What & Why

Globalne middleware opóźnia żądania signin, bo próbuje odświeżać zastaną sesję. Rzeczywisty lokalny ślad pokazał 29,5 s dla POST i rozpoczęcie weryfikacji hasła dopiero po 27,4 s retry odświeżania, które kończyły się `Network connection lost.`

## Starting Point

`src/middleware.ts` sprawdza użytkownika na każdej trasie przed decyzją, które ścieżki są chronione. Endpoint signin przy błędnym haśle przekierowuje bez usunięcia starego cookie. Bez cookies pomiary lokalne i produkcyjne zakończyły się w mniej niż sekundę.

## Desired End State

Publiczny formularz i endpoint signin nie wykonują odświeżania sesji z middleware. Po błędnym haśle formularz wyświetla istniejący ogólny komunikat, a stare cookie sesji jest usunięte. Chronione trasy nadal wymagają zweryfikowanego użytkownika.

## Key Decisions Made

| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| Złożoność planu | Niska, 1–2 pytania projektowe | Lokalna przyczyna jest potwierdzona, a zmiana ma ograniczony zakres | Plan |
| Błędne hasło przy zastanej sesji | Usunąć starą sesję i wrócić do formularza | Użytkownik wybrał czystą sesję po nieudanym signin | Plan |
| Zakres middleware | Weryfikować sesję na trasach chronionych | Usuwa potwierdzone oczekiwanie z publicznych żądań auth, zachowując kontrolę dostępu | Research |
| Usuwanie cookie | Użyć helpera SSR bez inicjalizacji Auth; objąć cookie chunk | `signOut()` inicjalizuje klienta i może ponowić wolny refresh | Research |
| Niepewność produkcyjna | Potwierdzić scenariusz na koncie testowym i zapisać lukę, jeśli brak slow trace | Szybkie próby bez cookies nie potwierdzają źródła historycznego wolnego requestu na produkcji | Research |

## Scope

**In scope:** pominąć odświeżanie sesji middleware na publicznych trasach, czyścić starą sesję po błędnym haśle, rozszerzyć smoke testy, utrzymać fail-closed na trasach chronionych, zweryfikować zachowanie produkcji.

**Out of scope:** zmiana dostawcy Auth, retry/timeout SDK, osłabienie ochrony, deploy automatyczny, użycie danych logowania użytkownika do testów.

## Architecture / Approach

Middleware rozpoznaje trasę przed tworzeniem/wywołaniem klienta Auth. Publiczne trasy auth idą bezpośrednio do SSR/endpointu. Chronione trasy weryfikują użytkownika i przekierowują anonimowego. Odrzucony password signin usuwa wszystkie chunk cookie helperem `clearAuthCookiesAtScopes`, a potem zachowuje dotychczasowy redirect.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Usuń blokadę sesji z logowania | Szybka publiczna ścieżka auth, czyszczenie starego cookie i lokalne potwierdzenie ochrony | Obsługa cookie chunk i utrzymanie fail-closed |
| 2. Potwierdź zachowanie produkcji | Manualna weryfikacja poprawnego/błędnego signin i bezpieczne pomiary | Brak wolnego trace produkcyjnego może pozostawić źródło tamtego przypadku nieznane |

**Prerequisites:** lokalny Supabase; w fazie 2 operator ma dostęp do konta testowego.
**Estimated effort:** około 1–2 sesji w dwóch fazach.

## Open Risks & Assumptions

- Historyczne slow trace produkcyjne nie są dostępne; pomiary GET/POST bez cookies były szybkie.
- Gdy sam Auth jest niedostępny, password signin nadal może zawieść. Plan usuwa retry sesji sprzed requestu hasła, nie awarię zewnętrznego Auth.
- Kody błędów w śladach nie mogą ujawniać cookie, tokenów, hasła ani e-maila.

## Success Criteria (Summary)

- Stare cookie nie uruchamia odświeżania przed publicznym signin, a błędne hasło czyści całą sesję.
- Prywatne trasy nadal wymagają pozytywnej weryfikacji; lokalne smoke testy przechodzą.
- Produkcyjne zachowanie jest ręcznie potwierdzone na koncie testowym lub ograniczenie pomiaru jest opisane.
