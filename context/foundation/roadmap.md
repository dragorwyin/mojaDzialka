---
project: MojaDziałka
version: 1
status: draft
created: 2026-09-22
updated: 2026-09-25
prd_version: 1
main_goal: speed
top_blocker: time
milestone_id: first-season-garden-plan
milestone_seq: 1
milestone_status: open
---

# Roadmap: MojaDziałka

> Derived from `context/foundation/prd.md` (v1) and the codebase baseline confirmed on 2026-09-22.
> Edit-in-place; archive when superseded.
> Items are listed in dependency order. The "At a glance" table is the index.

## Milestone

**M-1: Pierwszy działający plan warzywnika na sezon** — Status: open

- **Intent:** Dostarczyć użytkownikowi prywatny, zapisany plan sezonu, który przelicza jego skrzynie i wybrane uprawy na graficzny układ, ujawnia konflikty i pokazuje podstawowe terminy prac.
- **Source materials:** `context/foundation/prd.md` (v1)
- **Done when:** F-01 oraz S-01–S-06 mają status `done`.
- **Scope anchors:** FR-001–FR-008, US-01.

## Vision recap

Amator z własnym warzywnikiem ma mało czasu na naukę i planowanie, a pomyłki w terminach lub brak wiedzy o posiadanych nasionach mogą oznaczać mniejsze zbiory, zbędne zakupy i puste miejsca. Planer łączy wymiary skrzyń, wybrane warzywa i ich proporcje z sąsiedztwem, odstępami oraz terminami prac, by przedstawić propozycję rozmieszczenia i plan sezonu.

## North star

**S-04: Użytkownik otrzymuje graficzny układ warzywnika z konfliktami i wolnymi miejscami.** Gwiazda przewodnia oznacza najmniejszy kompletny przepływ, którego dostarczenie sprawdza, czy produkt realizuje swoją główną obietnicę. Ten przepływ sprawdza podstawowe kryterium sukcesu PRD: układ oparty na wymiarach skrzyń, wybranych warzywach, proporcjach, odstępach, sąsiedztwie i powierzchni.

## At a glance

| ID | Change ID | Outcome (user can …) | Prerequisites | PRD refs | Status |
| --- | --- | --- | --- | --- | --- |
| F-01 | private-garden-storage-boundary | (foundation) Zapis jednej prywatnej działki jest przypisany do konta użytkownika. | — | FR-001, FR-002, Access Control, Non-Functional Requirements | done |
| S-01 | email-account-access | Użytkownik może założyć konto i logować się adresem e-mail oraz hasłem. | — | FR-001 | in-progress |
| S-02 | define-private-garden-space | Użytkownik może zdefiniować jedną prywatną działkę i wymiary swoich skrzyń lub sektorów. | F-01, S-01 | FR-002 | proposed |
| S-03 | select-crops-and-proportions | Użytkownik może wybrać warzywa z ręcznie zweryfikowanego katalogu i przypisać im liczbowe proporcje. | F-01, S-01 | FR-004 | blocked |
| S-04 | generate-garden-layout | Użytkownik może wygenerować graficzny układ z uwzględnieniem ograniczeń, konfliktów i wolnego miejsca. | F-01, S-02, S-03 | FR-006, FR-007, US-01 | blocked |
| S-05 | update-and-recalculate-plan | Użytkownik może zmienić dane wejściowe, unieważnić nieaktualny układ i przeliczyć cały plan ponownie. | F-01, S-04 | FR-003, FR-005 | blocked |
| S-06 | show-sowing-and-seedling-dates | Użytkownik może zobaczyć orientacyjne terminy siewu, przygotowania rozsady i prac w sezonie. | F-01, S-03, S-04 | FR-008, US-01 | blocked |

## Streams

Widok nawigacyjny grupuje elementy o wspólnych zależnościach. Kanoniczna kolejność nadal wynika z zależności poniżej.

| Stream | Theme | Chain | Note |
| --- | --- | --- | --- |
| A | Trwały plan i jego rozwój | `F-01` → (`S-02`, `S-03`) → `S-04` → (`S-05`, `S-06`) | S-02 i S-03 łączą się z dostępem do konta ze Stream B; układ pozostaje pierwszą funkcją do sprawdzenia. |
| B | Dostęp do konta | `S-01` | Może być realizowany równolegle z F-01; wdrożenie wymaga skonfigurowania sekretów Supabase. |

## Baseline

Stan kodu z 2026-09-22, potwierdzony przez użytkownika. Fundamenty poniżej nie powielają warstw już obecnych.

- **Frontend:** partial — Astro z ekranami rejestracji, logowania i dashboardem; brak interfejsu konfiguracji warzywnika i prezentacji planu.
- **Backend / API:** partial — endpointy rejestracji, logowania i wylogowania oraz ochrona dashboardu; brak API i logiki planera.
- **Data:** partial — lokalna konfiguracja Supabase i klient aplikacyjny; brak schematu, migracji i danych startowych dla działek, skrzyń i upraw.
- **Auth:** partial — przepływ Supabase i sesje są w kodzie; sekrety produkcyjne nie są skonfigurowane, więc uwierzytelnianie na wdrożeniu pozostaje wyłączone.
- **Deploy / infra:** partial — aplikacja działa na Cloudflare Workers i istnieje CI; sekrety produkcyjne oraz automatyczne wdrożenia i preview wymagają dokończenia. Dokumentacja stacku wskazuje Pages, a konfiguracja i plan wdrożenia — Workers.
- **Observability:** absent — nie znaleziono skonfigurowanego monitoringu błędów ani metryk aplikacji.

## Foundations

### F-01: Minimalny zapis prywatnej działki

- **Outcome:** (foundation) Można trwale zapisać minimalny rekord jednej działki i powiązać go z właścicielem konta; skrzynie, katalog upraw i reguły planowania będą dodawane w pionowych funkcjach.
- **Change ID:** private-garden-storage-boundary
- **PRD refs:** FR-001, FR-002, Access Control, Non-Functional Requirements
- **Unlocks:** S-02, S-03, ścieżkę weryfikacji prywatnego odczytu działki na koncie właściciela.
- **Prerequisites:** —
- **Parallel with:** S-01
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Wczesne ustalenie granicy właściciela ogranicza ryzyko ujawnienia cudzej działki; zbyt szeroki model danych spowolniłby główny przepływ.
- **Status:** done

## Slices

### S-01: Dostęp przez konto e-mail

- **Outcome:** Użytkownik może samodzielnie założyć konto oraz logować się adresem e-mail i hasłem.
- **Change ID:** email-account-access
- **PRD refs:** FR-001
- **Prerequisites:** —
- **Parallel with:** F-01
- **Blockers:** Skonfigurowanie produkcyjnych sekretów Supabase i adresów przekierowań; plan wdrożenia wskazuje, że nadal tego brakuje.
- **Unknowns:** —
- **Risk:** Gotowy szkielet ogranicza zakres, ale brak konfiguracji produkcyjnej może opóźnić sprawdzenie logowania na wdrożeniu.
- **Status:** in-progress

### S-02: Prywatna działka i jej wymiary

- **Outcome:** Użytkownik może utworzyć jedną prywatną działkę i podać wymiary dowolnej liczby skrzyń lub sektorów.
- **Change ID:** define-private-garden-space
- **PRD refs:** FR-002
- **Prerequisites:** F-01, S-01
- **Parallel with:** S-03
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Ta funkcja daje planerowi rzeczywiste wymiary do obliczeń; ograniczenie do jednej działki utrzymuje zakres zgodny z MVP.
- **Status:** proposed

### S-03: Wybór warzyw i proporcji

- **Outcome:** Użytkownik może wyszukać i wybrać warzywa z ograniczonego katalogu oraz wpisać dla każdego liczbowe proporcje.
- **Change ID:** select-crops-and-proportions
- **PRD refs:** FR-004
- **Prerequisites:** F-01, S-01
- **Parallel with:** S-02
- **Blockers:** —
- **Unknowns:**
  - Które warzywa obejmuje początkowy ręcznie zweryfikowany katalog i jakie źródło potwierdza ich dane? — Owner: team. Block: yes.
- **Risk:** Katalog jest konieczny do pierwszego planu; jego rozszerzanie przed sprawdzeniem głównego przepływu zwiększyłoby zakres bez potwierdzonej wartości.
- **Status:** blocked

### S-04: Wygenerowanie układu warzywnika

- **Outcome:** Użytkownik może wygenerować graficzną propozycję rozmieszczenia, zobaczyć konflikty odstępów lub powierzchni oraz niewykorzystane miejsca.
- **Change ID:** generate-garden-layout
- **PRD refs:** FR-006, FR-007, US-01
- **Prerequisites:** F-01, S-02, S-03
- **Parallel with:** —
- **Blockers:** —
- **Unknowns:**
  - Jak planer ma interpretować liczbową proporcję roślin? Wartości typu „2” i „1” nie mają jeszcze określonego przełożenia na proponowany układ. — Owner: user. Block: yes.
- **Risk:** To główna obietnica produktu i najbardziej ryzykowna reguła; pokazanie konfliktów zamiast ukrywania ich ogranicza ryzyko wprowadzenia użytkownika w błąd.
- **Status:** blocked

### S-05: Zmiana danych i ponowne przeliczenie

- **Outcome:** Użytkownik może zmienić wymiary, wybrane warzywa lub proporcje; przy dodaniu albo usunięciu skrzyni dostaje ostrzeżenie, że dotychczasowy układ zostanie usunięty, a po zmianach może przeliczyć cały plan ponownie.
- **Change ID:** update-and-recalculate-plan
- **PRD refs:** FR-003, FR-005
- **Prerequisites:** F-01, S-04
- **Parallel with:** S-06
- **Blockers:** —
- **Unknowns:**
  - Co dzieje się z poprzednim planem po przeliczeniu kolejnego sezonu: jest archiwizowany czy zastępowany? — Owner: user. Block: yes.
- **Risk:** Pełne przeliczenie jest zgodne z przyjętym zakazem ręcznego przesuwania roślin; zasada zachowania planu z poprzedniego sezonu musi być jasna przed zmianą danych.
- **Status:** blocked

### S-06: Terminy siewu i przygotowania rozsady

- **Outcome:** Użytkownik może zobaczyć orientacyjne terminy siewu, przygotowania rozsady i prac sezonowych dla wybranych upraw w Polsce.
- **Change ID:** show-sowing-and-seedling-dates
- **PRD refs:** FR-008, US-01
- **Prerequisites:** F-01, S-03, S-04
- **Parallel with:** S-05
- **Blockers:** —
- **Unknowns:**
  - Jakie zweryfikowane źródło danych wyznacza orientacyjne terminy dla warunków w Polsce? — Owner: team. Block: yes.
  - W jaki sposób użytkownik otrzymuje przypomnienia o pracach? — Owner: user. Block: no.
- **Risk:** Orientacyjne okna są zgodne z PRD i nie obiecują dokładności co do dnia; źródło danych musi być sprawdzone, zanim terminy trafią do użytkownika.
- **Status:** blocked

## Backlog Handoff

| Roadmap ID | Change ID | Suggested issue title | Ready for `/10x-plan` | Notes |
| --- | --- | --- | --- | --- |
| F-01 | private-garden-storage-boundary | Minimalny prywatny zapis działki | yes | Fundament wymagany przez gwiazdę przewodnią S-04. |
| S-01 | email-account-access | Rejestracja i logowanie e-mailem | yes | Konfiguracja produkcyjnych sekretów Supabase pozostaje zewnętrzną blokadą wdrożenia. |
| S-02 | define-private-garden-space | Utworzenie działki i konfiguracja wymiarów | no | Wymaga F-01 i S-01. |
| S-03 | select-crops-and-proportions | Wybór warzyw i proporcji | no | Zablokowane do ustalenia zakresu i źródła katalogu. |
| S-04 | generate-garden-layout | Generowanie układu z konfliktami i wolnym miejscem | no | Zablokowane do ustalenia znaczenia proporcji. |
| S-05 | update-and-recalculate-plan | Zmiana danych i pełne przeliczenie planu | no | Zablokowane do ustalenia losu planu z poprzedniego sezonu. |
| S-06 | show-sowing-and-seedling-dates | Terminy siewu i przygotowania rozsady | no | Zablokowane do wskazania źródła zweryfikowanych terminów. |

## Open Roadmap Questions

1. **Jak planer ma interpretować liczbową proporcję roślin?** — Wartości typu „2” i „1” nie mają jeszcze określonego przełożenia na proponowany układ. Owner: użytkownik. Rozstrzygnąć przed ustaleniem reguł generowania planu. Block: S-04.
2. **Co dzieje się z poprzednim planem po przeliczeniu kolejnego sezonu?** — Użytkownik podkreślił znaczenie prywatnej historii, ale nie ustalono, czy stare sezony mają być zachowane jako archiwum, czy zastępowane nowym planem. Owner: użytkownik. Block: S-05.
3. **Jaki jest oczekiwany ruch szczytowy (QPS)?** — Nie określono orientacyjnej liczby zapytań na sekundę. Owner: użytkownik. Block: —; nie blokuje pierwszego MVP przy obecnym celu dostarczenia.
4. **Jaka jest przewidywana wielkość danych?** — Nie określono orientacyjnej ilości przechowywanych danych. Owner: użytkownik. Block: —; nie blokuje pierwszego MVP przy obecnym celu dostarczenia.

## Parked

- **Wiele działek na konto i współdzielenie działki** — poza zakresem MVP; konto obejmuje jedną prywatną działkę.
- **Ręczne przesuwanie roślin w układzie** — poza zakresem; użytkownik zmienia dane wejściowe i przelicza cały plan.
- **Tworzenie własnych rekordów warzyw** — poza zakresem; katalog ma pozostać ograniczony i ręcznie zweryfikowany.
- **Dokładne terminy dzienne i prognozy pogody** — poza zakresem; terminy mają być orientacyjne i dostosowane do warunków w Polsce.
- **Tygodniowe zakładki i uprawy następcze (FR-009)** — dodatek o niższym priorytecie; wrócić do niego po podstawowym planie.
- **Szczegółowe tooltipy o rozsadzie i odstępach (FR-010)** — dodatek; nie może opóźnić podstawowego układu i terminów.
- **Panel administracyjny do blokowania i przywracania kont (FR-011)** — dodatek; podstawowe MVP może obsługiwać blokowanie poza aplikacją.

## Milestone History

(Brak zamkniętych milestone’ów — to pierwszy milestone.)

## Done

- **F-01: (foundation) Można trwale zapisać minimalny rekord jednej działki i powiązać go z właścicielem konta; skrzynie, katalog upraw i reguły planowania będą dodawane w pionowych funkcjach.** — Archived 2026-09-24 → `context/archive/2026-09-23-private-garden-storage-boundary/`. Lesson: —.
