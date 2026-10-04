---
date: 2026-10-03T02:02:21+02:00
researcher: Codex
git_commit: e25c08e50f1ca559d6dfb59ecf8b8205808ffdcf
branch: main
repository: mojaDzialka
topic: "Żądania signin trwają ponad 20 sekund lokalnie i na produkcji"
tags: [research, auth, latency]
status: partial
last_updated: 2026-10-04
last_updated_by: Codex
last_updated_note: "Dodano raportowane czasy produkcyjne i wyniki ochrony tras; mapowanie żądań oraz test starej sesji wymagają doprecyzowania"
---

# Research: opóźnienie signin

## Pytanie i wynik

Użytkownik zgłasza ponad 20 sekund dla signin lokalnie i na produkcji. Zrzut DevTools pokazuje POST 302 trwające 25,46 i 25,48 s oraz GET strony błędu 200 trwający 25,49 s. Zrzut nie pokazuje hosta, cookies ani rozbicia Timing.

Najsilniejsza hipoteza: wygasła sesja w cookies powoduje odświeżanie tokena w globalnym middleware; retry błędów Auth dodaje około 25,4 s. Mechanizm odtworzono na zainstalowanym SDK, lecz nie potwierdzono rzeczywistego błędu odpowiedzialnego za retry w żądaniach użytkownika. To aktualizuje wcześniejsze przypuszczenia z frame.md: mamy pomiar mechanizmu, ale nadal nie pomiar dotkniętego requestu.

## Dowody z kodu

- `src/middleware.ts:7-12`: klient SSR i oczekiwanie na getUser przed obsługą trasy; obejmuje publiczny GET i POST signin.
- `src/pages/api/auth/signin.ts:20-30`: drugi klient, signInWithPassword i redirect. GET strony błędu ponownie przechodzi przez middleware.
- `src/lib/supabase.ts:9-20`: brak własnego timeoutu lub pomiarów fetch. Cookies są czytane z oryginalnego nagłówka requestu; drugi klient nie korzysta automatycznie z aktualizacji wykonanej przez pierwszy.
- Zainstalowane `@supabase/auth-js` 2.117.2, `src/GoTrueClient.ts:3066-3081`: sesja bliska wygaśnięcia uruchamia odświeżanie. `src/lib/constants.ts:4-13`: margines wynosi 90 sekund.
- `node_modules/@supabase/auth-js/src/GoTrueClient.ts:4781-4803`: retry odświeżania z odstępami 200, 400, 800 ms itd., jeśli błąd jest retryable i kolejny odstęp mieści się w budżecie 30 s. To budżet ponowień, nie twardy timeout pojedynczego fetch.
- Przy natychmiastowych błędach odstępy 0,2 + 0,4 + 0,8 + 1,6 + 3,2 + 6,4 + 12,8 dają 25,4 s. `src/lib/fetch.ts:72-76` obejmuje 503 w statusach retryable.
- `node_modules/@supabase/auth-js/src/GoTrueClient.ts:3263-3271`: bez sesji getUser może zakończyć lokalnie; nie należy utożsamiać każdego wywołania z requestem do Auth.
- `node_modules/@supabase/auth-js/src/GoTrueClient.ts:1243`: password signin wysyła request token; nie zawiera tego samego jawnego retry odświeżania.

## Pomiary wykonane w tej sesji

1. Klient createServerClient z pustymi cookies, lokalnym URL i kluczem wczytanym bez wypisywania z .dev.vars: getUser 2 ms, AuthSessionMissingError, bez fetch Auth.
2. Ten klient, jedno logowanie nieistniejącego konta `example.invalid`: fetch `/auth/v1/token` 400 w 75 ms, cała metoda 80 ms, invalid_credentials. To pomiar odmowy logowania, nie udanego logowania istniejącego użytkownika.
3. Klient SSR z syntetycznym wygasłym cookie i fetch zastąpionym natychmiastowym HTTP 503: getUser 25496 ms, osiem wywołań stubu, AuthRetryableFetchError. Bez sieci i bez zapisu danych. Mechanizm odpowiada czasowi ze zrzutu z dokładnością do narzutu wykonania.
4. GET localhost:4321/auth/signin bez cookies: HTTP 500 w 0,458 s. Aktualny serwer zgłasza brak `node_modules/.vite/deps_ssr/lucide-react.js` w cache optymalizatora. To odrębna przeszkoda w pomiarze pełnej ścieżki aplikacji; nie wyjaśnia produkcyjnego objawu.
5. Lokalny Supabase `/auth/v1/health` zwrócił 200; .dev.vars wskazuje host 127.0.0.1. Nie dowodzi to konfiguracji produkcji.

## Ograniczenia i następne rozstrzygające sprawdzenie

Produkcja nie została zmierzona: curl został zatrzymany przez proxy środowiska narzędziowego wskazujące zamknięty port; web również nie otworzył strony. To ograniczenie narzędzi, a nie dowód awarii produkcji.

Potrzebne są czasy getUser i signInWithPassword oraz statusy requestów refresh_token na dotkniętym środowisku, bez logowania tokenów, haseł ani cookies. Porównać istniejącą sesję z oknem prywatnym. Szczególnie sprawdzić, czy szybki błąd sieci/5xx uruchamia osiem prób. Jeśli również czysty GET bez cookies trwa 25 s, hipoteza retry sesji nie wystarcza.

Nie zmieniono kodu aplikacji ani konfiguracji; istniejące zmiany robocze zachowano. Nie uruchamiano zestawu testów, bo nie rozstrzyga czasu żywych żądań.

## Dokumentacja i kontekst

Context7 potwierdza sieciowy charakter getUser oraz różnicę względem walidacji getClaims: [Supabase Auth methods](https://github.com/supabase/supabase/blob/master/apps/docs/content/_partials/auth_methods.mdx). Sama zamiana na getClaims nie dowodzi usunięcia problemu odświeżania sesji i wymaga zachowania kontraktu ochrony danych.

Wcześniejsze obserwacje: `context/changes/login-auth-request-latency/frame.md`. Aktualna diagnoza pozostaje częściowa ze względu na brak rzeczywistego statusu błędnego odświeżania.

## Uzupełnienie — 2026-10-03, rzeczywiste ślady i nowe pomiary

Revision podczas uzupełnienia: `f922c5b89e31cbb72d260257ce032d5bb1b45d32`, branch `main`; pomiary około 12:50–12:55 Europe/Warsaw. Kod middleware i klienta SSR pozostaje taki jak opisano wyżej. Historyczne akapity o braku dostępu do produkcji i braku rzeczywistego błędu zostały zastąpione następującymi ustaleniami, nie stanowią aktualnego ograniczenia dla lokalnej diagnozy.

### Potwierdzona przyczyna lokalnego oczekiwania

Źródło: `.wrangler/state/v3/observability/miniflare-wobs-trace-store/a590acd76969f996ec6e4b599c3c09f58c283a76f2d61392b5d3046caf557602.sqlite`, tabele `spans` i `logs`, odczyt bez modyfikacji. W odczytanym zbiorze 249 spanów zawierających signin znaleziono osiem ponad 20 s z 2026-10-02: siedem GET /auth/signin (27,334–29,868 s) i POST /api/auth/signin (29,518 s). To dane lokalnego runtime, nie logi produkcji.

Rozstrzygający trace: `d6456b89039245481bef2ba7d5da6db5`, początek 2026-10-02 10:17:45.257 Europe/Warsaw. POST trwa 29518 ms. Pierwsze siedem wywołań `http://127.0.0.1:54321/auth/v1/token?grant_type=refresh_token` zaczyna się na offsetach 206, 2489, 4965, 7855, 11552, 16831 i 25315 ms; każde trwa około 2,08 s. Po ich zakończeniu password signin zaczyna się dopiero na offsecie 27409 ms i trwa 2090 ms. Dodatkowe odświeżanie rozpoczyna się na 27412 ms i trwa 2106 ms. Powiązane logi zawierają `AuthRetryableFetchError`, `Network connection lost.`, status 0.

Te ślady potwierdzają oczekiwanie na retry odświeżania sesji przed obsługą hasła w rzeczywistym lokalnym żądaniu. Status 0 oznacza błąd transportu SDK, nie odpowiedź HTTP 503. Wcześniejsza symulacja 503 odtwarzała mechanizm opóźnienia, lecz nie rzeczywisty status awarii. Nie ustalono jeszcze, dlaczego runtime tracił połączenie do lokalnego Supabase; ślad nie dowodzi błędu hasła, SMTP ani HTTP 5xx.

Odtworzenie bezpiecznego odczytu: otworzyć wskazaną bazę przez `node:sqlite` DatabaseSync z `{readOnly:true}`; `SELECT name,start_ms,duration_ms FROM spans WHERE trace_id=? ORDER BY start_ms` oraz `SELECT message FROM logs WHERE trace_id=?`, z powyższym trace ID. Nie wypisywać kompletnych requestów, cookies ani treści logów; filtrować do czasów i nazw błędów. Główny agent niezależnie potwierdził POST 29518 ms, sekwencję wolnych fetch i oba komunikaty Network connection lost.

### Aktualne pomiary bez cookies

- Produkcja GET /auth/signin: HTTP 200, 0,458597 s, TTFB 0,458463 s.
- Produkcja POST /api/auth/signin, nieistniejący adres example.invalid i poprawny Origin: HTTP 302, 0,200392 s, TTFB 0,200333 s. Bez Origin zwrócił 403; tej próby nie traktujemy jako pomiaru Auth.
- Lokalny serwer uruchomiono poza ograniczeniami sandboxa bez zmian kodu/config. Start trwał około 152 s według logu Astro; pierwszy GET 200 trwał 7,655 s, ciepły GET 200 0,260898 s. Pierwszy GET logował również Invalid hook call, więc sam status 200 nie dowodzi poprawnego renderowania formularza. Zimny start i błąd renderowania są oddzielnymi problemami od zarejestrowanych retry Auth.
- Lokalny POST bez cookies, z prawidłowym Origin i nieistniejącym kontem: HTTP 302 w 0,503330 s; kolejna kontrola potwierdziła redirect `/auth/signin?error=signin_failed&returnTo=%2Fdashboard`.

Pomiary dowodzą szybkiej ścieżki odmowy logowania bez cookies w tych konkretnych próbach. Nie dowodzą poprawnego udanego logowania ani usunięcia awarii sesji. Nie zmieniono aplikacji i nie wykonywano deployu. Docker jest uruchomiony; ograniczony odczyt stdout logów kontenera Auth za ostatnie 24 h nie dostarczył dodatkowego materiału.

### Kontrakt dla planowania i pozostające luki

Lokalna diagnoza opóźnienia: HIGH confidence — sekwencja refresh retry i błędy transportu są zapisane w rzeczywistym requestcie. Produkcja: mechanizm pozostaje hipotezą; szybkie no-cookie GET/POST zawężają zakres, lecz brak slow trace produkcyjnego i odpowiedzi użytkownika o incognito.

Plan powinien uwzględnić publiczne GET/POST auth, ochronę prywatnych tras i odzyskanie po starej sesji. Nie wolno zastąpić autoryzacji zaufaniem do niesprawdzonych cookies. Pomiar powinien rozróżniać czas middleware, password auth i błędy transportu, bez danych uwierzytelniających. Sam timeout fetch nie jest równoważny ograniczeniu całej serii retry SDK. Zmiana getUser na getClaims również może odświeżać wygasłą sesję.

Przed deklaracją potwierdzenia przyczyny na produkcji potrzebny jest jeden slow trace z czasami Auth i bezpiecznymi kodami błędów albo reprodukcja z dotkniętą sesją. Do ustalenia infrastrukturalnej przyczyny lokalnego zerwania połączenia potrzebna jest korelacja czasu awarii z dostępnością kontenera Auth i ścieżką runtime–127.0.0.1:54321. Research pozostaje `partial` ze względu na te luki, ale zawiera potwierdzony lokalny mechanizm i konkretne dane dla planu.

## Uzupełnienie — 2026-10-04: aktywna wersja produkcyjna przed fazą 2

Read-only `wrangler deployments list --name moja-dzialka-prod --json` (telemetria wyłączona; zapisano tylko czas i identyfikator wersji) pokazuje najnowsze wdrożenie z `2026-09-25T16:12:24Z`, wersja `2f115b01-8bfa-4574-993c-3ba854c4e845` z ruchem 100%. Commit fazy 1 `de0d70f` powstał 2026-10-04 i nie jest wdrożony. Zgodnie z zakresem fazy 2 nie wykonano wdrożenia; pomiar produkcyjny będzie więc dotyczył poprzedniej wersji i da punkt odniesienia, nie potwierdzenie zachowania poprawki.

### Wyniki testu operatora — 2026-10-04

Operator zgłosił dla produkcji następujący przebieg: pierwsze `signin` — 2,45 s; dalej `signin` — 377 ms, `signin failed` — 284 ms, ponowne `signin` — 326 ms, `/dashboard` — 338 ms. Dokładne powiązanie powtarzających się nazw z GET/POST i stanem sesji nie zostało podane, więc czasy zachowano jako zgłoszoną sekwencję, bez przypisywania ich do konkretnej fazy żądania. Żadna podana próba nie przekroczyła 20 s; operator nie dostarczył slow trace ani liczby/statusów wywołań `refresh_token`.

Operator potwierdził, że pierwszy pomiar signin 2,45 s był wykonany ze starą sesją/cookie. Anonimowe wejście do `/dashboard` i `/garden` kierowało do signin; po poprawnym logowaniu działają `/dashboard` (338 ms) i `/garden`, oba z dobrą prędkością. Kody HTTP i dokładne mapowanie pozostałych czasów do żądań GET/POST nie zostały podane. Produkcja nadal działa na wersji z 2026-09-25, więc wyniki nie walidują commita `de0d70f`.
