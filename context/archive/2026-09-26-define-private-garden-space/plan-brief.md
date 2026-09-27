# Utworzenie prywatnej działki i konfiguracja jej wymiarów — Plan Brief

> Full plan: `context/changes/define-private-garden-space/plan.md`

## What & Why

S-02 daje użytkownikowi pierwszy rzeczywisty krok planera: zapisanie własnej działki i wymiarów wszystkich miejsc, w których będzie sadzić. Dane pozostają prywatne i są gotowe jako wejście dla kolejnych slice'ów.

## Starting Point

F-01 utworzył już jedną tabelę działek przypisaną do konta i zabezpieczoną RLS. Aplikacja ma sesje Supabase i chroniony dashboard, ale nie ma tabeli przestrzeni, endpointu zapisu ani ekranu konfiguracji.

## Desired End State

Zalogowany użytkownik wchodzi na `/garden`, dodaje dowolną liczbę skrzyń lub sektorów, wpisuje nazwy i wymiary w cm, zapisuje i widzi konfigurację po ponownym wejściu. Baza egzekwuje właściciela i odrzuca niepoprawne wymiary niezależnie od UI.

## Key Decisions Made

| Decision          | Choice                         | Why (1 sentence)                                                                    |
| ----------------- | ------------------------------ | ----------------------------------------------------------------------------------- |
| Liczba działek    | Jedna na konto                 | Wynika bezpośrednio z FR-002 i istniejącego unique `gardens.user_id`.               |
| Model przestrzeni | Osobna tabela `garden_spaces`  | Pozwala przechować dowolną liczbę skrzyń/sektorów bez powiększania rekordu działki. |
| Zapis             | Jeden RPC w transakcji         | Usunięcie i zapis listy nie zostawi częściowej konfiguracji po błędzie.             |
| Typ przestrzeni   | `bed` albo `sector`            | Ograniczony enum przez CHECK constraint, z polskimi etykietami w UI.                |
| Wymiary           | Dodatnie liczby całkowite w cm | Jednoznaczna jednostka wystarczająca dla przyszłych obliczeń.                       |
| Prywatność        | RLS po właścicielu działki     | Ochrona działa także poza ekranem i endpointem.                                     |

## Scope

**In scope:**

- migracja `garden_spaces`, RLS, constrainty i atomowy RPC;
- pgTAP dla dwóch użytkowników i `anon`;
- chroniony `/garden`, formularz dynamiczny i endpoint POST;
- link z dashboardu oraz walidacja błędów.

**Out of scope:** katalog upraw, proporcje, układ, przeliczanie, wiele działek, współdzielenie i zmiany roadmapy.

## Architecture / Approach

Formularz React wysyła powtarzalne pola do chronionego endpointu Astro. Endpoint waliduje dane i wywołuje przez sesyjnego klienta Supabase funkcję `save_garden_spaces`; funkcja jako invoker działa pod RLS, tworzy rekord `gardens` jeśli potrzeba i atomowo zastępuje listę `garden_spaces`. Strona serwerowa odczytuje relację właściciela i przekazuje ją do islandu.

## Phases at a Glance

| Phase                              | What it delivers                               | Key risk                                              |
| ---------------------------------- | ---------------------------------------------- | ----------------------------------------------------- |
| 1. Model danych i prywatny zapis   | Tabela, RPC, RLS i testy izolacji              | Niepełna polityka mogłaby ujawnić cudze wymiary.      |
| 2. Chroniony przepływ konfiguracji | `/garden`, API, dynamiczne wiersze i nawigacja | UI nie może być jedyną walidacją ani granicą dostępu. |

**Prerequisites:** ukończone F-01 i S-01, lokalny Supabase/Docker dla testów DB.
**Estimated effort:** 1 sesja implementacji w 2 fazach.

## Open Risks & Assumptions

- Konfiguracja wymaga co najmniej jednej przestrzeni; „dowolna liczba” oznacza dowolne N >= 1, aby działka miała użyteczne wejście do kolejnych slice'ów.
- Usunięcie wiersza i zapis nowej listy zastępuje poprzednie wymiary; wersjonowanie sezonów należy do późniejszego zakresu.

## Success Criteria (Summary)

- Zalogowany użytkownik może zapisać wiele skrzyń i sektorów z dodatnimi wymiarami oraz odczytać je po odświeżeniu.
- Drugi użytkownik i `anon` nie mogą odczytać ani zmienić cudzych danych, a baza odrzuca błędne rekordy.
- `npx astro check`, `npm run lint`, `npm run build` i `npm run test:db` przechodzą, gdy lokalny Supabase jest dostępny.
