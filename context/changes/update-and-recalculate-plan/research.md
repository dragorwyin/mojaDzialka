---
date: 2026-10-03T12:53:16+02:00
researcher: Codex
git_commit: f922c5b89e31cbb72d260257ce032d5bb1b45d32
branch: main
repository: mojaDzialka
topic: "S-05: zmiana danych i ponowne przeliczenie planu"
tags: [research, garden, planner, recalculation]
status: complete
last_updated: 2026-10-03
last_updated_by: Codex
---

# Research: S-05 — zmiana danych i ponowne przeliczenie planu

**Date**: 2026-10-03 12:53:16 Europe/Warsaw  
**Researcher**: Codex  
**Git Commit**: f922c5b89e31cbb72d260257ce032d5bb1b45d32  
**Branch**: main  
**Repository**: mojaDzialka

## Research Question

Jakie zachowanie S-05 jest już ustalone, co działa w przepływie `/garden`, a co wymaga doprojektowania przed implementacją?

## Summary

Użytkownik może dziś edytować skrzynie/sektory i wybór upraw, a zapisane dane wejściowe są ponownie pobierane przez SSR. Zmiana fingerprintu oznacza poprzedni plan jako nieaktualny; ponowne generowanie oblicza pełny układ i zastępuje pojedynczy zapisany plan. Brakuje jednak wymaganego ostrzeżenia i usunięcia dotychczasowego układu przy dodaniu/usunięciu przestrzeni. Obecny S-04 zachowuje nieaktualny diagram na ekranie z ostrzeżeniem i CTA, więc przed planem trzeba pogodzić ten kontrakt z FR-003, który mówi o usunięciu planu przy zmianie listy przestrzeni.

## Detailed Findings

### Zmiana danych i aktualność planu

- Formularz przestrzeni obsługuje dodawanie, usuwanie i zmianę wymiarów, po czym wysyła zapis przez `/api/garden`; formularz upraw obsługuje wybór oraz proporcje, wymaga sumy 100% i emituje zdarzenie po udanym zapisie ([GardenSetupForm.tsx:70-165](../../../src/components/garden/GardenSetupForm.tsx#L70), [CropSelectionForm.tsx:253-319](../../../src/components/garden/CropSelectionForm.tsx#L253)).
- SSR tworzy bieżący fingerprint z przestrzeni i upraw, pobiera zapisany plan i rozróżnia stan aktualny od nieaktualnego ([garden.astro:48-125](../../../src/pages/garden.astro#L48)). Fingerprint obejmuje geometrię przestrzeni, ID upraw, proporcje oraz wersje katalogu i algorytmu ([garden-plan-snapshot.ts:1-63](../../../src/lib/garden-plan-snapshot.ts#L1)).
- Po zapisie upraw klient oznacza diagram jako nieaktualny; przy zapisie przestrzeni następuje przekierowanie, po którym SSR ponownie ustala aktualność planu. W S-04 przyjęto widoczny status, ostrzeżenie i CTA do przeliczenia dla starego snapshotu ([GardenPlanner.tsx:80-100,168-180](../../../src/components/garden/GardenPlanner.tsx#L80)).

### Pełne przeliczenie i zapis

- Endpoint przeliczenia odczytuje aktualnie zapisane dane wejściowe, generuje pełny układ i zapisuje go przez upsert po `garden_id` ([garden-plan.ts:49-130](../../../src/pages/api/garden-plan.ts#L49)). Tabela ma klucz główny `garden_id`, więc model danych utrzymuje jeden plan na działkę ([20260929120000_create_garden_plans.sql:1-7](../../../supabase/migrations/20260929120000_create_garden_plans.sql#L1)).
- Roadmapa rozstrzyga, że nowy wynik zastępuje poprzedni, a archiwum sezonów pozostaje poza MVP ([roadmap.md:137-147](../../foundation/roadmap.md#L137)). Nie należy przenosić starszego, nierozstrzygniętego pytania PRD o historię sezonów do tej zmiany jako otwartego pytania.

### Wymagania i rozbieżność do rozstrzygnięcia

- FR-003 wymaga ostrzeżenia i usunięcia układu po dodaniu/usunięciu skrzyni lub sektora; FR-005 wymaga ostrzeżenia o potrzebie przeliczenia po zmianie wymiarów, wyboru lub proporcji, a wynik ma się zmienić dopiero po kliknięciu „Przelicz” ([prd.md:70-78](../../foundation/prd.md#L70)).
- S-04 celowo pozostawia stary diagram widoczny jako nieaktualny dla zmienionego snapshotu, z ostrzeżeniem i CTA. Samo zachowanie nieaktualnego diagramu może być więc właściwe dla zmian wymiarów/upraw, lecz dodanie/usunięcie przestrzeni ma osobny, mocniejszy wymóg wyczyszczenia według FR-003 ([archived generate-garden-layout plan.md:45-49,194-200](../../archive/2026-09-28-generate-garden-layout/plan.md#L45)).
- Endpoint zapisu przestrzeni zastępuje wiersze przestrzeni, a endpoint zapisu upraw zastępuje wiersze wyboru; fingerprint przestrzeni zawiera ich identyfikatory. Nawet zachowana przestrzeń może zatem otrzymać nowy identyfikator przy zapisie listy ([20260926120000_create_garden_spaces.sql:103-114](../../../supabase/migrations/20260926120000_create_garden_spaces.sql#L103), [20260927120000_create_garden_crops.sql:103-120](../../../supabase/migrations/20260927120000_create_garden_crops.sql#L103), [garden-plan-snapshot.ts:33-63](../../../src/lib/garden-plan-snapshot.ts#L33)). Skutek jest taki, że zapis wymiarów może oznaczyć plan jako nieaktualny także wtedy, gdy sam układ przestrzeni nie zmienił się semantycznie.

## Code References

- `src/components/garden/GardenSetupForm.tsx:70-165` — edycja, dodawanie i usuwanie przestrzeni.
- `src/components/garden/CropSelectionForm.tsx:253-319` — walidacja, zapis oraz zdarzenie po zapisie upraw.
- `src/pages/garden.astro:48-125` — odczyt danych wejściowych, planu i jego stanu.
- `src/lib/garden-plan-snapshot.ts:1-63` — budowa fingerprintu.
- `src/components/garden/GardenPlanner.tsx:80-180` — status nieaktualności i akcja przeliczenia.
- `src/pages/api/garden-plan.ts:49-130` — generowanie i zastępowanie zapisanego wyniku.
- `supabase/migrations/20260929120000_create_garden_plans.sql:1-7` — jeden wiersz planu na działkę.

## Architecture Insights

Generator jest oddzielony od formularzy, a endpoint przeliczenia czyta zapisane dane po stronie serwera. Aktualność wyniku zależy od wspólnego snapshotu danych i wersji algorytmu/katalogu. S-05 może oprzeć się na tym mechanizmie, ale ostrzeżenie przed zmianą i reguła czyszczenia po zmianie listy przestrzeni nie są jeszcze połączone z zapisem.

## Historical Context (from prior changes)

- `context/archive/2026-09-28-generate-garden-layout/plan.md` — stale plan ma pozostać widoczny i być oznaczony; pełny przepływ ostrzeżenia i czyszczenia po dodaniu/usunięciu przestrzeni odłożono do S-05.
- `context/archive/2026-09-27-select-crops-and-proportions/plan-brief.md` — wcześniejszy plan obejmował 30 upraw, później zastąpionych przez aktualny kontrakt katalogu 31 pozycji w pracach S-04; S-05 dziedziczy aktualne reguły, nie ten historyczny stan.
- `context/archive/2026-09-26-define-private-garden-space/plan-brief.md` — konto ma jedną prywatną działkę i co najmniej jedną przestrzeń; lista przestrzeni jest zapisywana jako całość.

## Related Research

Nie dotyczy. Wcześniejsze badania w S-04 skupiały się na generatorze i katalogu, nie na pełnym przepływie edycji i unieważniania S-05.

## Open Questions

- Czy „usunięcie” układu z FR-003 oznacza trwałe skasowanie wiersza planu po potwierdzeniu ostrzeżenia, czy usunięcie go z widoku przy zachowaniu nieaktualnego wyniku do wglądu? S-04 ustala widoczność nieaktualnego planu, a FR-003 używa terminu „usuwa”.
- Czy ostrzeżenie przed utratą układu dotyczy wyłącznie dodania/usunięcia przestrzeni, zgodnie z FR-003, czy również zmiany wymiarów/upraw? FR-005 wymaga ostrzeżenia o nieaktualności, ale nie mówi o kasowaniu wyniku.
- Czy zwykły zapis listy przestrzeni ma celowo zmieniać identyfikatory wszystkich przestrzeni i przez to oznaczać plan jako nieaktualny, także przy semantycznie niezmienionych wpisach?
