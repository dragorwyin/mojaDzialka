# Zmiana danych i ponowne przeliczenie planu — Implementation Plan

## Overview

Dokończyć przepływ S-05: chronić zapisany układ przed niezamierzoną utratą przy dodaniu lub usunięciu skrzyni/sektora, oznaczać go jako nieaktualny po pozostałych zmianach wejściowych i umożliwić ponowne przeliczenie z aktualnie zapisanych danych.

## Current State Analysis

`GardenSetupForm` pozwala dodać, usunąć i edytować przestrzenie, ale formularz nie ostrzega przed utratą planu. `/api/garden` zapisuje całą listę przez `save_garden_spaces`; obecna funkcja SQL usuwa i wstawia wszystkie wiersze, przez co zmieniają się identyfikatory także niezmienionych przestrzeni. Formularz upraw emituje zdarzenie po zapisie, a planner oznacza plan jako nieaktualny. SSR porównuje fingerprint aktualnych danych ze snapshotem planu i zachowuje stary wynik jako nieaktualny. `/api/garden-plan` oblicza pełny układ z zapisanych danych i zapisuje go przez upsert jednego planu na działkę.

Brakującym zachowaniem jest ostrzeżenie przed zapisem strukturalnej zmiany przestrzeni i usunięcie zapisanego planu po jej udanym zapisie. Stabilne identyfikatory zachowanych przestrzeni pozwolą odróżnić dodanie/usunięcie od edycji wymiarów; zmiana wymiarów nadal zmieni fingerprint i oznaczy wynik jako nieaktualny.

## Desired End State

Przed zapisem listy przestrzeni, która dodaje lub usuwa skrzynię albo sektor, użytkownik potwierdza usunięcie bieżącego układu. Anulowanie zachowuje edycje formularza i nie zapisuje danych. Po potwierdzeniu przestrzenie i usunięcie planu są zatwierdzane razem; błąd zapisu pozostawia dotychczasowe przestrzenie oraz plan. Zmiany wymiarów, wyboru upraw i proporcji nie wymagają potwierdzenia utraty planu: po zapisie poprzedni diagram pozostaje widoczny ze statusem nieaktualności. Pełne przeliczenie używa zapisanych wejść, a nowy wynik zastępuje poprzedni dopiero po powodzeniu.

### Key Discoveries:

- Formularz przestrzeni już ma identyfikatory rekordów w stanie UI, lecz nie przesyła ich do endpointu ([GardenSetupForm.tsx:7-14,70-165](../../../src/components/garden/GardenSetupForm.tsx#L7)).
- Bieżąca funkcja SQL zastępuje wszystkie przestrzenie, a plan jest usuwany tylko przez osobną operację; aktualizacja listy i planu w jednym RPC może zachować atomowość ([20260926120000_create_garden_spaces.sql:84-121](../../../supabase/migrations/20260926120000_create_garden_spaces.sql#L84)).
- Snapshot zawiera ID przestrzeni i jej dane, a SSR pokazuje plan nieaktualny po zmianie fingerprintu ([garden-plan-snapshot.ts:33-63](../../../src/lib/garden-plan-snapshot.ts#L33), [garden.astro:92-125](../../../src/pages/garden.astro#L92)).
- Istniejący `Button` i semantyczne tokeny są używane w formularzu przestrzeni; należy zachować te wzorce i nie wprowadzać lokalnych kolorów ([GardenSetupForm.tsx:1-2,135-165](../../../src/components/garden/GardenSetupForm.tsx#L1)).
- Kontrakt FR-003 obejmuje zarówno skrzynie, jak i sektory; FR-005 oraz S-04 zachowują stary wynik jako jawnie nieaktualny po pozostałych zmianach danych ([prd.md:70-78](../../foundation/prd.md#L70), [generate-garden-layout plan.md:45-49](../../archive/2026-09-28-generate-garden-layout/plan.md#L45)).

## What We're NOT Doing

- Nie wprowadzamy historii sezonów ani wielu zapisanych planów; najnowsze udane przeliczenie zastępuje jeden plan działki.
- Nie dodajemy ręcznej edycji ani przesuwania roślin.
- Nie wymagamy potwierdzenia usunięcia planu przy zmianie samych wymiarów, wyboru upraw lub proporcji; te zmiany oznaczają plan jako nieaktualny.
- Nie zmieniamy algorytmu układania, katalogu upraw ani reguł proporcji.

## Implementation Approach

Przesłać identyfikatory zapisanych przestrzeni razem z formularzem i zmienić kontrakt `save_garden_spaces`, aby zachować ID istniejących rekordów oraz rozpoznać dodanie/usunięcie. Formularz pyta o potwierdzenie przy zapisie strukturalnej zmiany, gdy istnieje zapisany plan. Funkcja bazodanowa usuwa plan wyłącznie przy zmianie zestawu ID, w tej samej transakcji co zapis przestrzeni. Pozostały przepływ nieaktualności i ponownego generowania pozostaje zgodny z istniejącym S-04; dodajemy regresyjne pokrycie dla pełnego przepływu S-05.

## Phase 1: Potwierdzenie zmian przestrzeni i bezpieczne przeliczenie

### Overview

Dodać potwierdzenie dla dodania/usunięcia przestrzeni oraz atomowo usuwać dotychczasowy plan po udanej zmianie listy. Utrwalić zachowanie nieaktualnego wyniku przy zwykłych edycjach i zastępowanie planu po udanym pełnym przeliczeniu.

### Changes Required:

#### 1. Formularz przestrzeni i kontrakt endpointu

**File**: `src/components/garden/GardenSetupForm.tsx`, `src/pages/api/garden.ts`

**Intent**: Ostrzec o utracie planu przy dodaniu lub usunięciu skrzyni/sektora i pozwolić użytkownikowi anulować zapis. Edycja wymiarów lub właściwości istniejącej przestrzeni nie uruchamia potwierdzenia utraty planu.

**Contract**: Formularz przesyła ID istniejących przestrzeni; nowa przestrzeń nie ma ID bazy. Potwierdzenie jest potrzebne tylko przy rzeczywistym dodaniu/usunięciu i istniejącym planie. Anulowanie nie wysyła żądania ani nie czyści lokalnych edycji; endpoint nadal waliduje listę i zapisuje wyłącznie przestrzenie aktualnego użytkownika.

#### 2. Zachowanie ID i atomowe czyszczenie planu

**File**: nowa migracja Supabase; `supabase/tests/garden_spaces.test.sql`, `supabase/tests/garden_plans.test.sql`

**Intent**: Rozróżnić zmianę struktury od edycji pól przestrzeni i usunąć plan bez okna, w którym nieudany zapis wejść pozostawiłby skasowany wynik.

**Contract**: Zmodyfikowana funkcja `save_garden_spaces` aktualizuje przestrzenie o ID należącym do działki właściciela, dodaje wpisy bez ID i usuwa niewysłane wpisy. Nieznane lub cudze ID są odrzucane. Plan jest usuwany tylko wtedy, gdy zestaw przestrzeni został dodany/zmniejszony, w tej samej transakcji; edycja wymiarów/nazwy/typu zachowuje ID i sam plan, którego nowy fingerprint może oznaczyć jako nieaktualny. Błąd wycofuje zarówno zmianę przestrzeni, jak i usunięcie planu.

#### 3. Regresyjna weryfikacja stanu i pełnego przeliczenia

**File**: `scripts/smoke.mjs`, istniejące testy jednostkowe, testy SQL i widok `/garden`

**Intent**: Potwierdzić, że potwierdzenie, zapis, unieważnienie i ponowne przeliczenie tworzą spójny przepływ S-05 bez naruszenia prywatności ani zachowania ustalonego w S-04.

**Contract**: Zmiany wymiarów, upraw i proporcji zachowują stary diagram ze statusem stale i CTA. Przeliczenie odczytuje zapisane wejścia i zastępuje bieżący plan dopiero po udanym wygenerowaniu i zapisie. Błąd generowania lub zapisu nie może pokazać poprzedniego wyniku jako aktualnego.

### Success Criteria:

#### Automated Verification:

- Testy SQL potwierdzają zachowanie ID przy edycji, prawidłowe wykrywanie dodania/usunięcia, czyszczenie planu tylko dla zmiany zestawu przestrzeni oraz odrzucenie ID należącego do innego użytkownika.
- Test SQL potwierdza, że błąd zapisu nie usuwa planu ani nie częściowo zmienia przestrzeni.
- Testy smoke potwierdzają, że zapis wymiarów lub upraw oznacza poprzedni plan jako stale, ponowne przeliczenie tworzy jeden bieżący wynik, a błędny/nieudany przebieg nie oznacza starego wyniku jako current.
- `npm run test:unit`, `npm run test:db`, `npx astro check`, `npm run lint`, `npm run build` i `npm run smoke` przechodzą.

#### Manual Verification:

- Przy istniejącym planie dodanie lub usunięcie skrzyni albo sektora pyta o potwierdzenie; anulowanie pozostawia wpisane zmiany i zapisany plan, a potwierdzenie zapisuje przestrzenie i usuwa plan.
- Gdy planu nie ma, dodanie/usunięcie przestrzeni nie pokazuje ostrzeżenia o utracie nieistniejącego wyniku.
- Zmiana samych wymiarów, upraw lub proporcji zapisuje dane bez dialogu utraty; diagram jest widoczny jako nieaktualny, a CTA pozwala przeliczyć plan.
- Po ponownym przeliczeniu widać nowy wynik; po błędzie wcześniejszy plan pozostaje oznaczony jako nieaktualny lub — jeśli został usunięty przez potwierdzoną zmianę przestrzeni — widok pokazuje brak planu.

**Implementation Note**: Po fazie zatrzymać się na ręcznym potwierdzeniu przebiegu dodania/usunięcia i zwykłej edycji przed zamknięciem etapu.

## Testing Strategy

### Unit Tests:

- Kontrakt formularza zachowuje sygnał dodania/usunięcia i nie traktuje edycji pól istniejącej przestrzeni jako zmiany struktury.
- Walidacja ID przestrzeni odrzuca duplikaty, nieznane ID i ID spoza działki.

### Integration Tests:

- Testy SQL obejmują transakcyjny zapis przestrzeni i warunkowe usunięcie planu przy dodaniu/usunięciu.
- Smoke sprawdza stale → regenerate → current po zmianie wymiarów i danych upraw oraz zachowanie jednego planu.
- `npm run test:db` sprawdza izolację właścicieli i brak dostępu do cudzych przestrzeni/planów.

### Manual Testing Steps:

1. Wygenerować plan, dodać skrzynię, anulować potwierdzenie i sprawdzić zachowanie pól oraz planu; następnie zaakceptować i potwierdzić zapis bez planu.
2. Powtórzyć dla usunięcia sektora; sprawdzić, że co najmniej jedna przestrzeń pozostaje wymagana.
3. Zmienić tylko wymiar oraz osobno proporcję upraw; potwierdzić brak dialogu utraty, oznaczenie starego diagramu jako nieaktualnego i działanie CTA.
4. Przeliczyć i sprawdzić zastąpienie wyniku; zasymulować błąd zapisu/przeliczenia i upewnić się, że stary plan nie jest prezentowany jako aktualny.

## Performance Considerations

Liczba przestrzeni pozostaje ograniczona przez aktualny formularz i model zapisu; nowa logika porównuje wyłącznie listę ID przestrzeni, bez kosztu zależnego od wymiarów grządek. Nie zmieniać limitów wyszukiwania generatora.

## Migration Notes

Dodać migrację zastępującą funkcję `save_garden_spaces`. Dotychczasowe rekordy i plany pozostają bez migracji danych; pierwsze edycje zachowują identyfikatory istniejących przestrzeni. Nowa funkcja usuwa aktualny plan transakcyjnie tylko przy dodaniu/usunięciu przestrzeni.

## References

- Research: `context/changes/update-and-recalculate-plan/research.md`
- PRD: `context/foundation/prd.md` — FR-003, FR-005, FR-006.
- Roadmap: `context/foundation/roadmap.md` — S-05.
- S-04 plan: `context/archive/2026-09-28-generate-garden-layout/plan.md` — stale status, prywatność i regeneracja.
- Formularz i zapis przestrzeni: `src/components/garden/GardenSetupForm.tsx`, `src/pages/api/garden.ts`, `supabase/migrations/20260926120000_create_garden_spaces.sql`.
- Status i generowanie planu: `src/pages/garden.astro`, `src/components/garden/GardenPlanner.tsx`, `src/pages/api/garden-plan.ts`, `src/lib/garden-plan-snapshot.ts`.
- Testy: `supabase/tests/garden_spaces.test.sql`, `supabase/tests/garden_plans.test.sql`, `scripts/smoke.mjs`, `package.json`.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Potwierdzenie zmian przestrzeni i bezpieczne przeliczenie

#### Automated

- [x] 1.1 Testy SQL potwierdzają zachowanie ID przy edycji, prawidłowe wykrywanie dodania/usunięcia, czyszczenie planu tylko dla zmiany zestawu przestrzeni oraz odrzucenie ID należącego do innego użytkownika. — c5ac94e
- [x] 1.2 Test SQL potwierdza, że błąd zapisu nie usuwa planu ani nie częściowo zmienia przestrzeni. — c5ac94e
- [x] 1.3 Testy smoke potwierdzają, że zapis wymiarów lub upraw oznacza poprzedni plan jako stale, ponowne przeliczenie tworzy jeden bieżący wynik, a błędny/nieudany przebieg nie oznacza starego wyniku jako current. — c5ac94e
- [x] 1.4 `npm run test:unit`, `npm run test:db`, `npx astro check`, `npm run lint`, `npm run build` i `npm run smoke` przechodzą. — c5ac94e

#### Manual

- [x] 1.5 Przy istniejącym planie dodanie lub usunięcie skrzyni albo sektora pyta o potwierdzenie; anulowanie pozostawia wpisane zmiany i zapisany plan, a potwierdzenie zapisuje przestrzenie i usuwa plan. — c5ac94e
- [x] 1.6 Gdy planu nie ma, dodanie/usunięcie przestrzeni nie pokazuje ostrzeżenia o utracie nieistniejącego wyniku. — c5ac94e
- [x] 1.7 Zmiana samych wymiarów, upraw lub proporcji zapisuje dane bez dialogu utraty; diagram jest widoczny jako nieaktualny, a CTA pozwala przeliczyć plan. — c5ac94e
- [x] 1.8 Po ponownym przeliczeniu widać nowy wynik; po błędzie wcześniejszy plan pozostaje oznaczony jako nieaktualny lub — jeśli został usunięty przez potwierdzoną zmianę przestrzeni — widok pokazuje brak planu. — c5ac94e
