---
project: "MojaDziałka"
approved_at: 2026-09-22
platform: Cloudflare Workers
worker_name: moja-dzialka-prod
production_branch: main
status: deployed_pending_secrets
deployed_at: 2026-09-22
deployment_url: https://moja-dzialka-prod.moja-dzialka-prod.workers.dev
deployment_version: 34c7ef91-febb-45cb-835b-7fd5056b4139
---

# Pierwsze wdrożenie

## Kontrakt

Projekt wdrażamy jako aplikację Astro SSR na Cloudflare Workers z adapterem
`@astrojs/cloudflare`. `wrangler.jsonc` pozostaje źródłem konfiguracji. Zachowujemy
`compatibility_date: "2026-05-08"` i flagę `nodejs_compat` do czasu osobnej weryfikacji.

Supabase pozostaje osobną usługą. Produkcja i preview muszą używać oddzielnych
sekretów, a preview powinno korzystać z nieprodukcyjnego projektu Supabase.

## Walidacja przed deployem

```powershell
npm ci
npx astro sync
npm run lint
npx astro check
npm run build
```

## Dostęp i pierwszy deploy

Operator loguje się do Cloudflare lokalnie i sprawdza konto:

```powershell
npx wrangler login
npx wrangler whoami
```

Pierwszy deploy wykonuje się z katalogu repozytorium:

```powershell
npx wrangler deploy
```

Sekrety `SUPABASE_URL` i `SUPABASE_KEY` ustawia się osobno dla produkcji przez
Cloudflare Dashboard albo interaktywnie przez:

```powershell
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_KEY
```

Nie zapisujemy wartości sekretów w repozytorium, logach ani w plikach śledzonych przez Git.

## Weryfikacja

Po publikacji sprawdzamy stronę główną, rejestrację, logowanie, sesję/cookies,
stronę chronioną, wylogowanie oraz logi:

```powershell
npx wrangler tail moja-dzialka-prod --format pretty
```

Testy zapisu danych wykonujemy wyłącznie z testowym kontem i nieprodukcyjnym
Supabase, dopóki środowisko preview nie zostanie rozdzielone.

## Automatyzacja po pierwszym deployu

Workers Builds konfigurujemy z branchem produkcyjnym `main`, komendą budowania
`npm run build` i komendą publikacji `npx wrangler deploy`. Dla pozostałych branchy
włączamy preview z `npx wrangler versions upload` oraz osobne sekrety preview.

## Rollback

W razie problemu operator wykonuje:

```powershell
npx wrangler rollback
```

Rollback przywraca wersję kodu Workera, ale nie cofa zmian danych ani migracji Supabase.

## Wynik pierwszego deployu

Deploy zakończył się powodzeniem. Cloudflare automatycznie utworzył KV namespace
`moja-dzialka-prod-session` dla bindingu `SESSION` oraz udostępnił bindingi `IMAGES`
i `ASSETS`.

Publiczne sprawdzenie tras zwróciło: `/` — 200, `/auth/signin` — 200,
`/auth/signup` — 200, `/dashboard` — 302 (przekierowanie dla niezalogowanego użytkownika).

Pozostaje ustawić produkcyjne sekrety `SUPABASE_URL` i `SUPABASE_KEY`. Do tego czasu
funkcje uwierzytelniania pozostają wyłączone. Sekretów nie ma lokalnie w środowisku
agenta i nie należy przekazywać ich w rozmowie.

## Ręczne bramki auth

Przed uznaniem produkcyjnego auth za gotowy operator wykonuje poniższe kontrole
w Cloudflare i Supabase. Wartości sekretów pozostają poza repozytorium, logami,
zrzutami ekranu i rozmową — nie należy ich wyświetlać ani wklejać podczas
raportowania wyniku.

1. W ustawieniach produkcyjnego Workera `moja-dzialka-prod` sprawdzić, że
   skonfigurowano oba sekrety `SUPABASE_URL` i `SUPABASE_KEY` oraz że wskazują
   właściwy produkcyjny projekt Supabase. Kontrola dotyczy obecności i celu
   sekretów; nie ujawniać ich wartości.
2. W ustawieniach Authentication projektu Supabase sprawdzić minimalną długość
   hasła równą co najmniej 8 znaków oraz wyłączone wymaganie potwierdzenia
   adresu e-mail przed logowaniem (`Confirm email` / `enable_confirmations`).
3. W preview ręcznie sprawdzić rejestrację bez linku e-mailowego, logowanie,
   dostęp do `/dashboard` i wylogowanie. Nie używać danych prawdziwego
   użytkownika.

Smoke test `scripts/smoke.mjs` uruchamiać wyłącznie przeciwko lokalnemu preview,
nigdy przeciwko produkcji. Jeśli produkcyjna rejestracja jest wyjątkowo
konieczna i zatwierdzona, użyć dedykowanego syntetycznego konta testowego, a po
teście usunąć je z Supabase Authentication.

SMTP oraz redirect URL-e używane przez linki potwierdzające lub resetujące
hasło są odłożone, dopóki takie przepływy nie zostaną włączone. Bieżący signup
nie wymaga wysyłania wiadomości e-mail.

Pozostałe bramki wdrożeniowe:

- konto Cloudflare i uprawnienia do konkretnego Workera;
- osobny nieprodukcyjny projekt Supabase i osobne sekrety dla preview;
- zatwierdzenie publikacji produkcyjnej po testach.
