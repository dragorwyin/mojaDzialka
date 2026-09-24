# Minimalny prywatny zapis działki — Plan Brief

> Full plan: `context/changes/private-garden-storage-boundary/plan.md`

## What & Why

Plan wprowadza trwały rekord jednej prywatnej działki przypisany do konta użytkownika i zabezpiecza go w bazie, a nie tylko w interfejsie. To fundament, na którym późniejsze funkcje będą mogły bezpiecznie zapisywać wymiary ogrodu i dane planu.

## Starting Point

Projekt ma logowanie Supabase, lokalny stack do CI i smoke test aplikacji, ale nie ma jeszcze tabel ani migracji aplikacyjnych. Job CI nie testuje schematu ani RLS, a konfiguracja seedów wskazuje na brakujący plik `supabase/seed.sql`.

## Desired End State

Baza wymusza najwyżej jedną działkę na konto, a jej właściciel jako jedyny może ją utworzyć, odczytać i zmienić. Testy dwóch użytkowników sprawdzają prywatność i ograniczenia; lokalny job CI uruchamia je przed dotychczasowym smoke testem.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) |
| --- | --- | --- |
| Cel zmiany | Minimalny trwały zapis działki | F-01 ma odblokować późniejsze funkcje bez budowania całego planera. |
| Liczba działek | Jedna na konto | To ograniczenie MVP zapisane w PRD i roadmapie. |
| Granica dostępu | RLS i polityki właściciela w bazie | Ochrona nie może zależeć wyłącznie od middleware lub przyszłego UI. |
| Dostęp klienta | Tylko własny odczyt/utworzenie/zmiana; brak uprawnienia do usuwania | Jawny allowlist operacji nie zostawia dostępu zależnego od domyślnych grantów. |
| Zakres testów | pgTAP oraz istniejący lokalny job CI | Repozytorium ma już lokalne Supabase w CI, ale nie ma testów bazy. |
| Obsługa seedów | Reset testowy z `--no-seed` | Konfiguracja wskazuje nieistniejący `seed.sql`, a zmiana nie wymaga danych startowych. |
| Podział prac | Dwie fazy: migracja; testy i CI | Rozdziela kontrakt schematu od zabezpieczenia go regresjami. |

## Scope

**In scope:** minimalna tabela `public.gardens`; powiązanie z `auth.users`; unikalność właściciela; RLS; testy pgTAP dla dwóch użytkowników, anon i ograniczeń; skrypt lokalnego resetu/testów; job CI.

**Out of scope:** UI i API, automatyczne tworzenie rekordu przy rejestracji, skrzynie/sektory, katalog upraw, planner, wiele działek, współdzielenie, polityka usuwania klienta, obsługa blokowania kont w F-01 i seed danych. Dostęp zablokowanego konta trzeba odebrać przed aktywowaniem przyszłej funkcji blokowania.

## Architecture / Approach

Jedna addytywna migracja ustanawia rekord i zabezpieczenia w Supabase/Postgres. Testy pgTAP odtwarzają kontekst właściciela i próbę dostępu innego konta na lokalnym stacku; skrypt `npm run test:db` resetuje bazę bez seedów i uruchamia zestaw przed istniejącym smoke testem.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Migracja i granica własności danych | Minimalny rekord, constraint jednego konta i RLS. | Niepełna polityka mogłaby ujawnić cudzy rekord; weryfikacja izolacji jest w fazie 2. |
| 2. Testy DB i integracja CI | PgTAP dla własności oraz powtarzalny test w lokalnym Supabase CI. | Reset może niechcący próbować załadować brakujący seed; skrypt używa `--no-seed`. |

**Prerequisites:** Docker dostępny dla lokalnego Supabase; lokalna konfiguracja CLI używana już w jobie CI.
**Estimated effort:** mała zmiana — dwa krótkie cykle implementacji, bez UI i logiki aplikacyjnej.

## Open Risks & Assumptions

- Rekord nie jest tworzony automatycznie przy rejestracji; jego utworzenie przez interfejs należy do późniejszego slice’u S-02.
- Testy muszą ustawiać rolę i claims użytkownika w sposób zgodny z lokalnym Supabase Auth, aby faktycznie wykonywać RLS, a nie testować wyłącznie SQL jako `postgres`.
- Konfiguracja `seed.sql` pozostaje poza zakresem; ścieżka testowa jawnie pomija seed.
- F-01 nie implementuje blokowania kont; przed aktywacją tej funkcji trzeba zapewnić i sprawdzić odmowę dostępu do działki także przez bezpośrednie żądania do Supabase.

## Success Criteria (Summary)

- Lokalna baza stosuje migrację od zera, a pgTAP potwierdza jeden rekord na konto i brak dostępu między właścicielami.
- Job CI przechodzi testy bazy oraz obecny smoke test i zatrzymuje lokalny stack także przy błędzie.
