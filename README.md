# MojaDziałka

MojaDziałka pomaga zaplanować sezonowy warzywnik. Użytkownik zapisuje wymiary
skrzyń lub sektorów, wybiera warzywa i ich docelowe proporcje, a planer
przygotowuje graficzny układ z uwzględnieniem rozstaw, sąsiedztwa i dostępnej
powierzchni. Aplikacja pokazuje konflikty, wolne miejsca, ograniczenia danych
oraz orientacyjne terminy siewu i przygotowania rozsady dla Polski.

## Funkcje

- Konto użytkownika i prywatny zapis jednej działki.
- Konfiguracja wymiarów skrzyń i sektorów.
- Kuratorowany katalog warzyw oraz ustawianie proporcji upraw.
- Generowanie układu z konfliktami, niewykorzystanym miejscem i informacją o
  pewności danych.
- Oznaczanie planu jako nieaktualnego po zmianie danych oraz ponowne
  przeliczanie.
- Orientacyjny kalendarz siewu, rozsady i prac sezonowych.

## Stos technologiczny

- Astro, React i TypeScript
- Supabase Auth oraz PostgreSQL
- Cloudflare Workers
- Vitest, pgTAP i Playwright

## Uruchomienie lokalne

Wymagany jest Node.js 22.14 lub nowszy, npm i Docker.

1. Zainstaluj zależności:

   ```sh
   npm ci
   ```

2. Uruchom lokalny Supabase:

   ```sh
   npx supabase start -x studio,imgproxy,mailpit,edge-runtime,logflare,vector,realtime,storage-api,postgres-meta,supavisor
   ```

3. Ustaw lokalne wartości `SUPABASE_URL` i `SUPABASE_KEY` w plikach `.env` oraz
   `.dev.vars`, korzystając z danych wyświetlonych przez Supabase CLI. Nie
   zapisuj sekretów w repozytorium.

4. Uruchom aplikację:

   ```sh
   npm run dev
   ```

Zatrzymaj lokalne usługi poleceniem `npx supabase stop`.

## Testy i kontrole

```sh
npm run test:unit    # testy unit i API
npm run test:db      # testy SQL/pgTAP na lokalnej bazie (resetuje ją)
npm run lint
npx astro check
npm run build
npm run test:e2e     # wymaga lokalnego Supabase i konfiguracji .env/.dev.vars
```

Testy e2e tworzą syntetyczne konta i dane w lokalnym Supabase. Nie kieruj ich
na produkcyjną bazę. GitHub Actions uruchamia testy unit/API, lint, kontrolę
Astro, build oraz testy bazy i przeglądarki na każdej zmianie do `main`.

## Wdrożenie

Aplikacja działa jako Astro SSR na Cloudflare Workers. Wdrożenie wymaga
skonfigurowania sekretów `SUPABASE_URL` i `SUPABASE_KEY` w ustawieniach Workera
oraz lokalnego uwierzytelnienia Cloudflare przez Wrangler.

```sh
npm run build
npx wrangler deploy
```

Nie umieszczaj wartości sekretów w repozytorium ani w zrzutach ekranu.

## Układ repozytorium

- `src/pages/` — strony i endpointy aplikacji
- `src/components/garden/` — formularze i widoki planera
- `src/lib/` — logika planowania i harmonogram prac
- `src/data/` — katalog upraw
- `supabase/` — migracje i testy bazy
- `tests/e2e/` — testy przepływów przeglądarkowych
- `context/` — PRD, roadmapa, plany testów i historia zmian
