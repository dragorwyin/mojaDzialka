---
date: 2026-09-26T22:26:40+02:00
researcher: Codex
git_commit: e75d63ff5f85ea009169f2f0795847def5d737d0
branch: main
repository: mojaDzialka
topic: "Katalog 30 popularnych warzyw w Polsce oraz dane do planowania układu i terminów upraw"
tags: [research, crop-catalog, companion-planting, spacing, planting-calendar, supabase]
status: partial
last_updated: 2026-09-26
last_updated_by: Codex
---

# Research: Katalog warzyw i dane do planowania sezonu

**Date**: 2026-09-26T22:26:40+02:00
**Researcher**: Codex
**Git Commit**: e75d63ff5f85ea009169f2f0795847def5d737d0
**Branch**: main
**Repository**: mojaDzialka

## Research Question

Przygotować źródłowo uzasadniony katalog 30 warzyw dla polskiego ogrodu oraz zaproponować strukturę danych obejmującą rozstawę, sąsiedztwo, terminy siewu i rozsady. Użytkownik zdecydował, że przeliczenie zastępuje poprzedni plan; interpretacja proporcji ma zostać oparta na danych katalogu i regułach sąsiedztwa.

## Summary

- W kodzie istnieje obecnie tylko prywatny rekord działki; katalog, rozstawy, relacje sąsiedztwa i kalendarz upraw nie są jeszcze zapisane w bazie ani aplikacji (`supabase/migrations/20260923203933_create_gardens.sql:1-29`, `src/pages/dashboard.astro:7-24`).
- Nie znaleziono jednego źródła, które ustanawia ranking 30 najpopularniejszych warzyw uprawianych przez polskich działkowców. Dlatego poniżej znajduje się kandydacki katalog MVP: 12 pozycji o wysokiej zbieżności źródeł oraz 18 pozycji uzupełniających, bez udawania kolejności 1–30.
- Terminy powinny być przechowywane jako okna miesięczne i metoda uprawy (siew do gruntu, rozsada, sadzenie), z warunkami typu temperatura gleby i ryzyko przymrozku. Źródła pokazują różne terminy zależne od regionu, osłon i odmiany, więc pojedyncza data byłaby zbyt kategoryczna.
- Rozstawa musi rozróżniać odległość w rzędzie od odległości między rzędami oraz zachowywać warunki, dla których obowiązuje. Współsadzenie należy traktować jako reguły z poziomem dowodu: WSU Extension ostrzega, że popularne tabele są często sprzeczne i pseudonaukowe, a praktyki należy opierać na ekologii, konkurencji, chorobach i pożytecznych organizmach.
- Przejrzane źródła podają głównie rozstawę roślin i międzyrzędzi, a nie uniwersalną parę „odległość warzywa A od warzywa B”. Nie należy więc dopisywać takich odległości bez dowodu; algorytm powinien łączyć footprint/rozstawę roślin z osobną, jakościową relacją sąsiedztwa.
- Supabase Context7 potwierdza kierunek modelu: relacje przez klucze obce, migracje jako źródło schematu, RLS na tabelach oraz polityki ograniczające dane użytkownika przez `auth.uid()` ([Supabase — database migrations](https://github.com/supabase/supabase/blob/master/examples/prompts/database-create-migration.md), [Supabase — RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)).

## Detailed Findings

### 1. Stan repozytorium i decyzje produktowe

- Migracja działki tworzy tabelę z `id`, `user_id` i `created_at`, wymusza jedną działkę na konto i ma polityki właścicielskie RLS (`supabase/migrations/20260923203933_create_gardens.sql:1-29`).
- Konfiguracja Supabase wskazuje seed `./seed.sql`, ale plik seed nie istnieje w sprawdzonym repozytorium (`supabase/config.toml:60-65`).
- PRD wymaga ograniczonego, ręcznie zweryfikowanego katalogu, danych o odstępach i sąsiedztwie oraz orientacyjnych terminów dla Polski; użytkownik nie ma tworzyć własnych rekordów warzyw (`context/foundation/prd.md:75-87`, `context/foundation/prd.md:123-124`).
- Zgodnie z decyzją użytkownika ponowne przeliczenie w MVP zastępuje poprzedni plan. Nie projektujemy jeszcze archiwum sezonów ani wersjonowania planów.

### 2. Evidence for the catalog

Najmocniejsze bezpośrednie źródło dla polskich ogródków działkowych to badanie 46 działkowców w trzech polskich miastach. W jego wynikach najważniejsze warzywa to pomidory, następnie ogórki, fasola szparagowa i pietruszka ([Klepacki & Kujawska, *Urban Allotment Gardens in Poland*](https://journals.sagepub.com/doi/full/10.2993/0278-0771-38.1.123)). WODR Poznań podaje jako praktyczny zestaw dla przydomowego ogródka m.in. burak, bób, cebulę, cukinię, fasolkę szparagową, marchew, ogórek, paprykę, pomidor, rzodkiewkę i sałatę ([WODR Poznań](https://www.wodr.poznan.pl/doradztwo/rozwoj-obszarow-wiejskich/warzywa-w-przydomowym-ogrodku-jakie-wybrac-i-jak-o-nie-zadbac)). RHS, opisując polskie praktyki ogrodnicze, wymienia jako ważne uprawy fasolę, kapustę, ogórki i pomidory ([RHS — Growing fruit and vegetables in Poland](https://www.rhs.org.uk/advice/grow-your-own/features/growing-in-poland)).

GUS jest użytecznym źródłem kontekstu produkcyjnego, ale nie mierzy popularności w ogrodach przydomowych: publikacja za 2023 r. wprost wyłącza powierzchnię ogrodów przydomowych z danych, a kategorię „pozostałe warzywa” agreguje m.in. z brokułem, porem, bobem, grochem, fasolą szparagową, rzodkiewką, papryką i sałatą ([GUS — Produkcja upraw rolnych i ogrodniczych w 2023 r.](https://stat.gov.pl/files/gfx/portalinformacyjny/pl/defaultaktualnosci/5509/9/22/1/produkcja_upraw_rolnych_i_ogrodniczych_w_2023.pdf)).

### 3. Candidate MVP catalog — 30 rows

`A` means high convergence across the Polish allotment study, WODR/RHS guidance, and practical garden sources. `B` means a sensible MVP candidate supported by Polish cultivation guides, seed/catalog availability, or production context, but not a defensible rank within the top 30.

| # | `slug` | Nazwa | Tier | Uwagi katalogowe |
|---:|---|---|:---:|---|
| 1 | `pomidor` | Pomidor | A | ciepłolubny; grunt/osłony; duża zmienność odmian |
| 2 | `ogorek` | Ogórek | A | grunt/osłony; wysoka wrażliwość na chłodną glebę |
| 3 | `marchew` | Marchew | A | siew bezpośredni; ważna rozstawa w rzędzie |
| 4 | `cebula` | Cebula | A | siew lub dymka; silna relacja z marchwią w źródłach praktycznych |
| 5 | `pietruszka-korzeniowa` | Pietruszka korzeniowa | A | korzeń i natka powinny być rozróżnialne w danych użytkowych |
| 6 | `burak-cwiklowy` | Burak ćwikłowy | A | siew bezpośredni; możliwa uprawa na botwinkę |
| 7 | `fasola-szparagowa` | Fasola szparagowa | A | karłowa i tyczna mają różną przestrzeń oraz podporę |
| 8 | `cukinia` | Cukinia | A | duża powierzchnia pokroju; osobny profil przestrzenny |
| 9 | `salata` | Sałata | A | krótkie cykle i siew sukcesywny |
| 10 | `rzodkiewka` | Rzodkiewka | A | szybki cykl; może pełnić rolę przedplonu/znacznika rzędu |
| 11 | `kapusta-glowiasta` | Kapusta głowiasta | A | duża rozstawa; rodzina kapustowatych |
| 12 | `papryka` | Papryka | A | ciepłolubna; zwykle z rozsady |
| 13 | `czosnek` | Czosnek | A | ozimy/jary; termin i metoda wymagają rozdzielenia |
| 14 | `groch` | Groch | B | chłodolubny; wymaga uwzględnienia podpór/odmiany |
| 15 | `bob` | Bób | B | wczesny siew; potwierdzony w poradniku WODR |
| 16 | `por` | Por | B | długi sezon; profil rozsady i duża rozpiętość rozstawy |
| 17 | `seler` | Seler korzeniowy/naciowy | B | warianty mają inne cele i rozstawy; modelować jako warianty |
| 18 | `dynia` | Dynia | B | bardzo duży pokrój; nie pasuje do każdej skrzyni |
| 19 | `ziemniak` | Ziemniak | B | popularny tradycyjnie, ale przestrzennie kosztowny w małej działce |
| 20 | `szpinak` | Szpinak | B | sezon chłodny; siew wiosenny i jesienny |
| 21 | `jarmuz` | Jarmuż | B | kapustowate; późny zbiór i odporność na chłód |
| 22 | `brokul` | Brokuł | B | rozsada; duża rozstawa |
| 23 | `kalafior` | Kalafior | B | rozsada; duża rozstawa i wrażliwość na termin |
| 24 | `kalarepa` | Kalarepa | B | szybki cykl; kapustowate |
| 25 | `kapusta-pekinska` | Kapusta pekińska | B | osobne okna siewu i ryzyko wybijania w pęd |
| 26 | `kukurydza-cukrowa` | Kukurydza cukrowa | B | wysoka; potrzebuje bloku/odpowiedniego sąsiedztwa |
| 27 | `rukola` | Rukola | B | krótki cykl; dane można współdzielić z grupą liściową, ale nie kopiować bez dowodu |
| 28 | `boćwina` | Boćwina/burak liściowy | B | osobny cel zbioru względem buraka ćwikłowego |
| 29 | `pasternak` | Pasternak | B | siew bezpośredni; długi i powolny wschód |
| 30 | `baklazan` | Bakłażan | B | kandydat ciepłolubny; potrzebuje silnego oznaczenia „preferowane osłony” |

Koper, szczypiorek i bazylia nie są w tej trzydziestce warzywnej; warto je później dodać jako `companion_only` lub osobną kategorię roślin wspierających. Ranking wewnątrz obu tierów pozostaje nieustalony, bo dostępne źródła pokazują listy i kontekst, a nie wspólny pomiar częstości dla wszystkich 30 pozycji.

### 4. Source-backed data model

Proponowana struktura logiczna rozdziela dane katalogowe, fakty uprawowe, relacje i źródła. Dzięki temu generator nie musi traktować jednej tabeli „warzywo” jako miejsca na wszystkie reguły.

#### `crop_catalog`

- `id`, `slug`, `name_pl`, `aliases`
- `category`: vegetable / herb / companion-only
- `botanical_family`: np. `solanaceae`, `cucurbitaceae`, `brassicaceae`
- `edible_part`: root / leaf / fruit / bulb / seed / stem
- `catalog_status`: candidate / verified / retired
- `catalog_tier`: A / B
- `source_ids[]`, `evidence_note`, `reviewed_at`

#### `crop_cultivation_profiles`

- `crop_id`, `variant`: np. `fasola-karłowa`, `fasola-tyczna`, `seler-korzeniowy`
- `method`: direct_sow / seedling / transplant / protected_culture
- `spacing_in_row_cm`: `min`, `max`
- `spacing_between_rows_cm`: `min`, `max`
- `vertical_support`: none / optional / required
- `space_class`: compact / medium / sprawling / vertical
- `soil_temperature_gate_c`: `min`, `preferred` when a source provides it
- `source_ids[]`, `confidence`, `conditions`

#### `crop_calendar_windows`

- `crop_id`, `variant`, `region_profile`
- `action`: sow_direct / sow_seedling / transplant / harvest
- `month_start`, `month_end`
- `temperature_or_frost_condition`: nullable text/rule reference
- `source_ids[]`, `confidence`, `conditions`

Dates should be stored as windows, not one `date`. A later region profile can shift a window, but the shift must be backed by a source or an explicit product rule.

#### `crop_relations`

- `crop_id`, `neighbor_crop_id`
- `relation`: compatible / avoid / neutral / unknown
- `mechanism`: shared_pest_risk / disease_risk / competition / architecture / biodiversity / folklore_claim
- `strength`: advisory / warning / hard_constraint
- `confidence`, `source_ids[]`, `conditions`, `review_note`

The default should be `unknown`, not `compatible`. A popular companion-planting table is not enough to create a hard constraint. WSU Extension's 2023 guide explicitly separates evidence-based intercropping and polyculture from folklore and warns that popular charts often lack credible support ([WSU Extension](https://pubs.extension.wsu.edu/product/gardening-with-companion-plants-home-garden-series/)).

#### `catalog_sources`

- `id`, `url`, `title`, `publisher`, `source_type`
- `language`, `published_at`, `accessed_at`
- `quality_note`, `scope`, `license_or_usage_note`

#### `plan_crop_inputs`

- `plan_id`, `crop_id`, `variant`, `requested_ratio`
- `requested_ratio` is the user's raw relative preference. It must remain distinct from calculated plant count or area until the S-04 algorithm defines that conversion.
- `computed_area_cm2`, `computed_quantity`, `conflict_state` belong to generated output, not the raw catalog fact.

### 5. Context7 / Supabase alignment

Context7's current Supabase material supports these implementation constraints for the later plan:

- create and evolve the schema through migrations;
- use foreign keys for ownership and catalog relationships;
- enable RLS on new tables;
- use owner-scoped policies based on `(select auth.uid()) = user_id` and index the filtered owner column where appropriate;
- keep public catalog facts separate from private user-owned plans so the catalog does not inherit the wrong ownership semantics.

These are storage and authorization recommendations, not horticultural facts. The final migration still belongs to `/10x-plan` and `/10x-implement`.

## Code References

- `supabase/migrations/20260923203933_create_gardens.sql:1-29` — private garden table, ownership constraint, and RLS policies.
- `supabase/config.toml:60-65` — configured seed path; no seed file was found in the inspected tree.
- `src/pages/dashboard.astro:7-24` — authenticated dashboard is currently a welcome screen rather than a planner.
- `context/foundation/prd.md:75-87` — catalog, spacing, neighborhood, recalculation, and Polish date requirements.
- `context/foundation/roadmap.md:120-162` — current blockers for S-03 through S-06.

## Architecture Insights

- Keep source facts immutable and versioned by source/review date; generated plan results can be replaced without mutating the catalog.
- Store ranges and conditions instead of false precision. The same crop can have different spacing or dates by cultivar, method, region, or protection.
- Do not turn row spacing into pairwise neighbor distance. The first is a cultivation fact; the second is a derived layout constraint and needs its own evidence or explicit product rule.
- Treat proportion as a user input and area allocation as a later derived value. Do not bake an interpretation such as “ratio equals plant count” into the catalog.
- Treat companion planting as explainable advice first. A hard exclusion should require stronger evidence than a single practical table and should expose its reason to the user.
- Separate `crop_catalog` from `crop_cultivation_profiles`, because one crop can have materially different profiles for open field, tunnel, dwarf, climbing, root, or leaf use.

## Historical Context (from prior changes)

- `context/archive/2026-09-23-private-garden-storage-boundary/plan-brief.md:33` — catalog and planning rules were intentionally left for later vertical features.
- `context/foundation/roadmap.md:146` — the previous-plan question was open; the user has now decided that recalculation replaces the previous plan in MVP.

## Related Research

- No earlier crop-catalog research artifact exists under `context/changes/` or `context/archive/`.

## Open Questions

1. Which source or source combination will be the acceptance authority for the final 30-row catalog? Current evidence supports the candidate set, but not a statistically defensible rank across all 30.
2. Which relations are strong enough to become `warning` or `hard_constraint`, versus explanatory advice only? This requires a second pass through the source claims and the S-04 layout algorithm.
3. Should herbs remain outside the 30 vegetable rows but be available as companion-only records?
4. Which Polish regional profile is the MVP default when the user does not provide a location? The data model can store a central reference window, but the product decision is still open.
