# Frame Brief: Procentowy udział wybranych upraw

> Framing krok przed `/10x-plan`. Brief rozdziela oczekiwanie użytkownika,
> bieżące zachowanie formularza i znaczenie, które dopiero ma dostać planer.

## Reported Observation

> „a co jakbyśmy zamiast proporcji w UI uzywali '%' ? jak mozna to ugryzc?”

## Initial Framing (preserved)

- **User's stated cause or approach**: zamiast liczbowych proporcji pokazać w interfejsie procenty.
- **User's proposed direction**: procent ma czytelnie wyrażać, ile roślin jednej uprawy użytkownik chce względem innych (np. dużo marchwi, mniej cebuli), dla całej działki; na tym etapie zmienia się UI, nie obliczenia planera. Niewykorzystane miejsce pokazywać tylko wtedy, gdy geometria uniemożliwia realizację celów.
- **Pre-dispatch narrowing**: użytkownik wskazał udział w liczbie roślin, nie udział powierzchni ani samą abstrakcyjną wagę; zakres na teraz ograniczył do prezentacji w UI; wolne miejsce ma być widoczne przy ograniczeniu geometrii.

## Dimension Map

The observation could originate at any of these dimensions:

1. **Normalizacja wartości wejściowych** — dowolne wagi, np. 3 i 1, nie są same w sobie procentami; wymagają przeliczenia względem sumy.
2. **Znaczenie procentu dla użytkownika** — „udział w liczbie roślin” to inny cel niż udział powierzchni, a UI nie powinno udawać, że algorytm już ten cel realizuje. ← początkowa framing użytkownika
3. **Wykonalność układu** — rozstawy i wymiary grządek mogą sprawić, że rzeczywisty udział roślin będzie odbiegał od celu; wolnej powierzchni nie należy prezentować jako problemu, jeśli cele da się spełnić.

## Hypothesis Investigation

| Hypothesis | Evidence | Verdict |
| --- | --- | --- |
| Obecne wartości można przeliczyć do czytelnego procentowego podglądu bez zmiany modelu zapisu. | Formularz przesyła dodatnie wartości wejściowe, walidator nie normalizuje ich ani nie wymaga sumy 100, a baza zapisuje `numeric` ([CropSelectionForm.tsx](../../../src/components/garden/CropSelectionForm.tsx), [garden-crop-selection.ts](../../../src/lib/garden-crop-selection.ts), [migracja](../../../supabase/migrations/20260927120000_create_garden_crops.sql)). Wagi 3:1 normalizują się do 75%:25%. | STRONG |
| Obecny system już definiuje te wartości jako procent liczby roślin. | S-03 jawnie pozostawił interpretację do S-04 ([brief S-03](../../archive/2026-09-27-select-crops-and-proportions/plan-brief.md)); PRD nadal wymienia interpretację proporcji jako otwarte pytanie ([PRD, FR-004 i pytanie otwarte](../../foundation/prd.md)). | NONE |
| Można raportować wolną powierzchnię tylko wtedy, gdy geometria blokuje realizację celu. | PRD wymaga ujawnienia konfliktu, gdy ograniczenia powierzchni lub rozstawów uniemożliwiają osiągnięcie proporcji ([PRD, FR-006](../../foundation/prd.md)); dokładne warunkowe pokazywanie wolnego miejsca nie jest jeszcze zapisane jako reguła UI. Użytkownik potwierdził tę regułę w tej rozmowie. | STRONG dla intencji; WEAK dla istniejącego kontraktu |

## Narrowing Signals

- Procent ma wyrażać relatywną **liczbę roślin**, np. dużo marchwi i znacznie mniej cebuli.
- Zakres obecnego pomysłu to prezentacja w UI, a nie zmiana działania istniejącego algorytmu.
- Niewykorzystaną powierzchnię pokazujemy tylko, gdy geometria uniemożliwia spełnienie celów.

## Cross-System Convention

S-03 przechowuje proporcję jako dodatnią liczbę bez jednostki i bez normalizacji. Zatem `3` i `1` można pokazać jako `75%` i `25%` udziału w wybranym miksie, lecz nie wolno podpisać tego jako faktycznego udziału w liczbie roślin, dopóki planer nie przyjmie i nie zmierzy takiego celu. Research S-04 wstępnie rekomenduje udział powierzchni, ale sam oznacza tę rekomendację jako nierozstrzygniętą; odpowiedź użytkownika wskazuje inny produktowy cel. Nie ma potrzeby zmieniać schematu bazy, o ile procenty pozostają inną prezentacją tych samych względnych wag.

## Reframed (or Confirmed) Problem Statement

> **The actual problem to plan around is**: przed dodaniem procentów trzeba odróżnić procentowy zapis względnego miksu od procentu faktycznej liczby roślin, a następnie pokazywać cel i osiągnięty układ jako osobne wartości.

Początkowe oczekiwanie użytkownika jest spójne: chce określać udział liczby roślin każdej uprawy na całej działce. Sama normalizacja wag pozwala czytelnie przedstawić np. 3:1 jako 75%:25%, ale nie dowodzi, że wygenerowany plan zawiera taki udział — to wymaga reguły S-04 oraz porównania celu z wykonalnym układem. Regułę prezentowania wolnego miejsca należy ograniczyć do sytuacji, w której ograniczenia geometrii uniemożliwiają realizację celów.

## Confidence

- **MEDIUM** — intencja użytkownika jest jasna, a obecny zapis pozwala na bezmigracyjny podgląd procentów. Semantyka przyszłego generatora pozostaje jeszcze do wpisania w kontrakt S-04; wcześniejsza rekomendacja badawcza o udziale powierzchni jest z nią sprzeczna.

Przed `/10x-plan` należy ustalić interakcję edycji procentów (np. czy wszystkie udziały mają sumować się do 100%) i zaktualizować kontrakt S-04 tak, by odróżniał docelowy udział liczby roślin od udziału powierzchni.

## What Changes for `/10x-plan`

Plan powinien traktować procent jako udział docelowej liczby roślin w całej działce, zachowując możliwość przeliczenia istniejących wag bez zmiany schematu bazy. Układ ma raportować odstępstwo od celu i wolne miejsce tylko wtedy, gdy ograniczenia geometrii uniemożliwiają jego realizację; samo zastąpienie etykiety `Proporcja` przez `%` nie wystarcza.

## Planning Clarifications (2026-09-29)

The earlier “UI only” narrowing described the first percentage-display change. For S-04, the user clarified that the planner itself must automatically place crops across the whole garden. Percentages are target shares of plant counts across all beds/sectors; the algorithm chooses positions and beds without asking the user to assign crops manually.

- Maximize feasible occupancy; prefer supported good-neighbor placements over exact percentage matching, then report target and achieved shares separately.
- Treat `supported` relations as preferred, `unknown` as neutral, and `caution` as a soft cost. Only a source-confirmed negative relation is a hard exclusion; the current `caution` records are not prohibitions.
- Use one working spacing variant per catalog crop and surface its confidence and planting-stage context. If a selected crop has no usable spacing, return a clearly partial plan and name the omitted crop.
- Compute companionship from generated plant positions inside each bed/sector. Do not infer physical adjacency from the order of spaces in the form.

## References

- `src/components/garden/CropSelectionForm.tsx:44,130,172`
- `src/lib/garden-crop-selection.ts:8,21,23`
- `src/pages/api/garden-crops.ts:37,40`
- `supabase/migrations/20260927120000_create_garden_crops.sql:1`
- `context/archive/2026-09-27-select-crops-and-proportions/plan-brief.md:25`
- `context/foundation/prd.md:75-80,129`
- `context/changes/generate-garden-layout/research.md:28-41`
- Decyzje użytkownika z bieżącej rozmowy.
