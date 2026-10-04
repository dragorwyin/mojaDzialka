# Poprawność decyzji algorytmu — Implementation Plan

## Overview

Wdrożyć zatwierdzony margines połowy końcowej rozstawy od każdego brzegu skrzyni/sektora i uzupełnić ochronę ryzyk #1, #5, #6 testami z niezależnymi oczekiwaniami. Przeliczony układ ma zachowywać odległości, priorytety i jawność ograniczeń danych; starszy wynik nie może uchodzić za zgodny z nową regułą.

## Current State Analysis

Generator rozpoczyna siatkę w połowie rozstawy, ale przeciwległe granice kontroluje względem środka bez marginesu (`src/lib/garden-layout.ts:427–445`). Weryfikacja par jest prostokątna, a sąsiedztwo eliptyczne (:387–410). Ranking preferuje supported, presję globalnego miksu, mniej caution, zwartość i deterministyczny remis (:413–424).

Research potwierdził 32 przechodzące testy w trzech plikach algorytmu/katalogu. Istnieją przypadki supported ponad miks, compactness, limitów, braków danych i starych zapisów. Test par czerpie progi z wygenerowanego spacing (`src/lib/garden-layout.test.ts:106`), więc potrzebuje niezależnego punktu odniesienia. Snapshot ma algorithmVersion=2; test aktualności porównuje go z wersją 1, ale nie z bezpośrednio poprzednią 2 (`src/lib/garden-plan-snapshot.ts:5`, `src/lib/garden-plan-snapshot.test.ts:44`).

## Desired End State

Dla każdej nowej pozycji x mieści się między połową inRowCm a widthCm minus połowa inRowCm, analogicznie y względem betweenRowsCm i lengthCm. Równość jest dopuszczalna; skrzynia węższa/krótsza niż pełny odstęp nie mieści tej uprawy. Margines korzysta z efektywnego minimum końcowej rozstawy, nie wielkości ikony.

Nowy snapshot zawiera algorithmVersion=3; zapis wersji 2 pozostaje czytelny, ale nieaktualny przy porównaniu z bieżącymi wejściami. W neutralnym przypadku trzech miejsc, celów 80/20 i rozstaw 10×10, wynik 2/1 pokazuje target/actual bez konfliktu wywołanego samą dyskretnością. Istniejące konflikty potwierdzonych ograniczeń i ostrzeżenia limitów pozostają chronione.

### Key Discoveries:

- Efektywne spacing pochodzi z finalSpacing, nie seed ani sowingDensity (`src/data/crop-catalog.ts:1691–1722`); marchew używa 7×20 cm z confidence low (:1420).
- Kod rozróżnia twarde negatywne sąsiedztwo od miękkiego caution (`src/lib/garden-layout.ts:374`). Low nie jest powodem odrzucenia.
- UI już prezentuje lokalne uzasadnienie pozycji (`src/components/garden/GardenLayoutView.tsx:406`). Nie jest ono dowodem globalnego optimum ani pełnym porównaniem alternatyw.
- Jawna komenda unit obejmuje istniejące pliki; rozszerzamy je zamiast tworzyć nowy runner (`package.json:16`).

## What We're NOT Doing

- Kosmetyka, screenshoty i nowe funkcje UI, solver, równomierna dystrybucja, nowe priorytety ani zwiększanie limitów.
- Dowodzenie globalnej niewykonalności procentów, nowy próg tolerancji lub przebudowa raportowania częściowych konfliktów. Sprawdzamy zaakceptowany przypadek samego zaokrąglenia i dotychczasowe udowodnione konflikty; pozostały zakres został wyłączony przy zatwierdzaniu etapów.
- Ponowna adjudykacja źródeł agronomicznych lub traktowanie roboczych minimów jako gwarancji biologicznej poprawności.
- Testy bazy, e2e, konfiguracja hooks/MCP/CI, historia sezonów, migracje danych i automatyczne przeliczanie cudzych zapisów.
- Zmiana zamrożonych §1–§5 test-plan. Zatwierdzone tutaj decyzje i granice znajdują się w tym planie; §6 otrzyma wzorce po ich wdrożeniu.

## Implementation Approach

Rozszerzyć istniejące pliki testów o ręczne przypadki referencyjne, zmienić granice siatki i podnieść wersję algorytmu. Następnie uzupełnić dokładnie wskazane luki geometrii, rankingu i adaptera danych. Oczekiwania pochodzą z decyzji użytkownika, niezależnych stałych fixture i jawnych kontraktów, nie obliczeń ani spacing zwróconych przez generator.

## Phase 1: Margines i wersjonowanie

### Overview

Wprowadzić symetryczny margines i ochronić aktualność zapisanych planów.

### Changes Required:

#### 1. Siatka z marginesem

**File**: `src/lib/garden-layout.ts`, `src/lib/garden-layout.test.ts`

**Intent**: Nie umieszczać środka bliżej brzegu niż połowa końcowego odstępu danej osi.

**Contract**: Zachować początek i krok siatki; ograniczyć końce do width−inRow/2 oraz length−betweenRows/2. Liczby dostępnych/pominiętych punktów i ścieżka zerowej szerokości odpowiadają nowej geometrii, przy obecnych limitach kosztu. Przypadki: zakres 10–15/20–30 w 20×40 daje zbiór (5,10),(15,10),(5,30),(15,30); 10×10 w 15×15 daje tylko (5,5); 10×10 w 10×10 daje (5,5); 9×10 lub 10×9 nie mieści tej uprawy. Przykłady definiują środki w cm, nie kolejność pełnego układu.

**Test signal**: regresja nierównych brzegów, zamienionych osi i wyboru max zamiast min. Źródło: research §2 i decyzja Q1. Nie obliczać oczekiwanych punktów produkcyjnym helperem ani osłabiać starych testów, aby przeszły; zmienione oczekiwania uzasadnić nowym marginesem.

#### 2. Nowa wersja snapshotu

**File**: `src/lib/garden-plan-snapshot.ts`, `src/lib/garden-plan-snapshot.test.ts`

**Intent**: Rozróżnić układy utworzone przed i po zmianie marginesu.

**Contract**: algorithmVersion 2→3, bez zmiany catalogVersion i schematu zapisu. Test z tymi samymi wejściami, version 2 kontra 3, dowodzi stale; bieżący fingerprint pozostaje current. Zachować czytnik starszych wyników.

### Success Criteria:

#### Automated Verification:

- Ręczne przypadki obu osi, dokładnego dopasowania, braku miejsca i 15×15 przechodzą z marginesem połowy rozstawy.
- Snapshot wersji 2 jest stale wobec wersji 3; bieżący jest current, starszy wynik pozostaje czytelny.
- `npm run test:unit`, `npx astro check` i `npm run lint` przechodzą po zmianie marginesu.

## Phase 2: Testy decyzji i danych

### Overview

Uzupełnić ochronę priorytetów i danych bez powielania istniejącego suite.

### Changes Required:

#### 1. Odległości, ranking i dyskretność

**File**: `src/lib/garden-layout.test.ts`

**Intent**: Dawać niezależny sygnał błędów odstępów i kolejności priorytetów, a nie utrwalać estetykę układu.

**Contract**: Progi par i marginesy czerpać z wejściowych stałych znanych fixture, nie output.spacing. Publiczne wywołania generatora mają faktycznie rozważyć pary równe/poniżej progu większego odstępu osi i rozróżnić prostokątne nakładanie od eliptycznej lokalności; nie eksportować prywatnych funkcji dla testów. Przykład do równości: przestrzeń 40×40, A 20×20/B 20×40, cele 80/20, brak relacji; pierwsze A (10,10), pierwsze B (30,20), dx=20, dy=10. Nowy margines jest tu zachowany dla obu roślin.

W neutralnej skrzyni 30×10, A/B 10×10, cele 80/20: punkty (5,5),(15,5),(25,5), kolejność A/B/A, liczby 2/1, target 80/20, actual około 66⅔/33⅓ i brak konfliktu samego zaokrąglenia. Miękkie caution nie unieważnia wyboru B przy większej presji celu. Reuse istniejącego supported-przed-miks, compactness, globalnego miksu, izolacji przestrzeni i testów limitów.

**Test signal**: zmiana progu równości, pomylenie dystansu sąsiedztwa z wykluczeniem, zamiana caution i presji celu, konflikt przy samej dyskretności. Źródło: research §2–§5 oraz decyzja Q2. Nie wymagać globalnego optimum, nie uznawać search_limit za no_fit i nie duplikować rankingu w oracle.

#### 2. Końcowe dane i ich niepewność

**File**: `src/lib/garden-layout.test.ts`, `src/data/crop-catalog.test.ts`

**Intent**: Odróżnić końcową obsadę od siewu, sprawdzić drugą oś marchwi i zachować niepewność wyników.

**Contract**: Bezpośrednie fixture: nieważne minima (0/NaN/Infinity/brak osi) dają invalid_spacing, zweryfikowane dodatnie osie z isFinalPlanting=false dają non_final_spacing, poprawne final low jest rozmieszczane z zachowaniem confidence/stage w pozycjach i summary. Katalogowy kontrakt odwzorowania porównuje ranges/sourceIds/confidence/stage z finalSpacing, a final=null daje spacing=null bez fallbacku z sowingDensity.

Rozszerzyć produkcyjną marchew o obie niezależnie ustalone osie 7/20, low i thinning. Miks marchew/cebula/brokuł ze skrzynią 200×100 i celami 30/30/40 sprawdza marginesy oraz odstępy według jawnych wejściowych minimów 7×20/5×30/40×50, sumy i zachowaną niepewność; bez snapshotu wszystkich pozycji i bez udawania odtworzenia obserwacji użytkownika. Istniejące missing/axes/sowingOnly i katalogowe validatory pozostają podstawą, nie dodatkowymi kopiami.

**Test signal**: zamiana osi, fallback siewny, podniesienie low do high, pominięcie bez przyczyny i błędny adapter. Źródło: research §1/§5. Expected transformation jest kontraktem danych, nie agronomicznym oracle.

### Success Criteria:

#### Automated Verification:

- Niezależne fixture dowodzą progów par, granic obu osi i rozdziału geometrii od lokalnego sąsiedztwa.
- Przypadki 80/20 i caution dowodzą wyniku 2/1 bez konfliktu samego zaokrąglenia; dotychczasowe priorytety i limity pozostają chronione.
- invalid_spacing, non_final_spacing, final low i odwzorowanie katalogu mają znaczące asercje z niezależnymi oczekiwaniami.
- Produkcyjna marchew i miks 30/30/40 zachowują dwie osie, marginesy i niepewność danych; `npm run test:unit` przechodzi.

## Phase 3: Weryfikacja i instrukcje

### Overview

Zamknąć sprawdzenie funkcjonalne i zostawić wzorce dla kolejnych testów.

### Changes Required:

#### 1. Wzorce testowania

**File**: `context/foundation/test-plan.md` — §6.1 i §6.2

**Intent**: Utrwalić sprawdzone przepisy dla geometrii i kontraktów danych.

**Contract**: Uzupełnić location, naming, konkretny reference test, dokładny run command, źródło ręcznych oczekiwań i regułę unikania implementation mirrors. Opisać margines, rounding oraz low zgodnie z tym planem. Nie zmieniać §1–§5 ani oznaczać rollout complete przed zakończeniem Progress; reconciliację przeprowadzi `/10x-test-plan`.

#### 2. Sprawdzenie wyniku i zgodności

**File**: istniejący `/garden`, testy i komendy repozytorium; bez nowego kodu UI

**Intent**: Potwierdzić przy lokalnym koncie testowym, że nowy wynik i starszy zapis są czytelne, a brzeg nie służy już jako pozycja środka bez marginesu.

**Contract**: Ręczny przegląd starszego planu algorithmVersion=2, następnie przeliczonego planu i danych pozycji/pewności. To weryfikacja funkcji, nie screenshoty kosmetyczne. Używać prywatnego konta testowego; nie modyfikować produkcyjnych danych w celu odbioru.

### Success Criteria:

#### Automated Verification:

- `npm run test:unit`, `npx astro check`, `npm run lint` i `npm run build` przechodzą dla finalnej zmiany.
- §6.1–§6.2 wskazują rzeczywiste testy, nazewnictwo, komendy i niezależne oczekiwania; nowe testy uruchamia istniejąca komenda unit.

#### Manual Verification:

- Starszy zapis jest nieaktualny, po przeliczeniu wynik jest aktualny i zachowuje marginesy oraz widoczną niepewność danych.

**Implementation Note**: Po automatycznej weryfikacji zatrzymać się na ręcznym odbiorze przed zamknięciem zmiany. Wcześniejsze fazy mają wyłącznie kryteria automatyczne.

## Testing Strategy

### Unit Tests:

Małe ręczne zbiory punktów, kontrolowane mieszane fixture, osie asymetryczne, minima zakresów, granice równości, braki/non-final i low. Reuse existing suite; każdy nowy test musi nazwać regresję i niezależne źródło oczekiwania. Nie importować produkcyjnej kalkulacji odległości do oracle.

### Integration Tests:

Snapshot/current-stale i czytelność starego obiektu sprawdzają granicę generator–zapis bez uruchamiania DB. Nie dokładamy bazy ani e2e do Phase 1 rollout.

### Manual Testing Steps:

1. Na lokalnym koncie zachować plan algorytmu 2 przed uruchomieniem nowej wersji; sprawdzić status nieaktualności.
2. Przeliczyć skrzynię z marchew/cebula/brokuł i celami 30/30/40; sprawdzić szczegóły współrzędnych i marginesy zgodnie z rozstawą danej rośliny.
3. Potwierdzić zachowanie target/actual, danych low i istniejących uzasadnień; nie wymagać równomiernego rozkładu ani gwarancji plonu.

## Performance Considerations

Zachować limity 2000 sprawdzeń, 256 punktów i ograniczenie alternatyw; liczby ostrzeżeń mają wynikać z nowej siatki. Nie przeglądać długiej osi, gdy druga nie mieści pełnej rozstawy. Margines zmniejsza przestrzeń kandydatów, bez dodatkowego przeszukiwania ani zmiany rankingu.

## Migration Notes

Bez migracji SQL/backfillu. Wersja algorytmu 3 zmienia fingerprint, starszy wynik pozostaje do odczytu jako nieaktualny do ręcznego przeliczenia. Przy wycofaniu zmiany nie zmniejszać ponownie wersji i nie oznaczać starych planów jako bieżących przez ponowne użycie identyfikatora wersji; kolejna semantyka dostaje kolejną wersję.

## References

- `context/changes/testing-algorithm-decisions/{change.md,research.md}`.
- `context/foundation/test-plan.md` — rollout Phase 1, risks #1/#5/#6, §6.1–§6.2.
- `src/lib/garden-layout.ts:346`, `:387`, `:403`, `:413`, `:427`, `:637`, `:828`.
- `src/lib/garden-layout.test.ts:41`, `:106`, `:198`, `:275`, `:391`.
- `src/data/crop-catalog.ts:1420`, `:1691`, `:1704`; `src/data/crop-catalog.test.ts:112`.
- `src/lib/garden-plan-snapshot.ts:5`; `src/lib/garden-plan-snapshot.test.ts:44`.
- Decyzje Plan Q1–Q3: margines połowy rozstawy, dyskretność bez konfliktu, testy i poprawka razem; trzy etapy zatwierdzone 2026-10-04.

## Progress

> Convention: pending/done. Append a commit SHA when a step lands. Do not rename step titles.

### Phase 1: Margines i wersjonowanie

#### Automated

- [x] 1.1 Ręczne przypadki obu osi, dokładnego dopasowania, braku miejsca i 15×15 przechodzą z marginesem połowy rozstawy. — a3ce5a0
- [x] 1.2 Snapshot wersji 2 jest stale wobec wersji 3; bieżący jest current, starszy wynik pozostaje czytelny. — a3ce5a0
- [x] 1.3 `npm run test:unit`, `npx astro check` i `npm run lint` przechodzą po zmianie marginesu. — a3ce5a0

### Phase 2: Testy decyzji i danych

#### Automated

- [x] 2.1 Niezależne fixture dowodzą progów par, granic obu osi i rozdziału geometrii od lokalnego sąsiedztwa. — 5192836
- [x] 2.2 Przypadki 80/20 i caution dowodzą wyniku 2/1 bez konfliktu samego zaokrąglenia; dotychczasowe priorytety i limity pozostają chronione. — 5192836
- [x] 2.3 invalid_spacing, non_final_spacing, final low i odwzorowanie katalogu mają znaczące asercje z niezależnymi oczekiwaniami. — 5192836
- [x] 2.4 Produkcyjna marchew i miks 30/30/40 zachowują dwie osie, marginesy i niepewność danych; `npm run test:unit` przechodzi. — 5192836

### Phase 3: Weryfikacja i instrukcje

#### Automated

- [x] 3.1 `npm run test:unit`, `npx astro check`, `npm run lint` i `npm run build` przechodzą dla finalnej zmiany.
- [x] 3.2 §6.1–§6.2 wskazują rzeczywiste testy, nazewnictwo, komendy i niezależne oczekiwania; nowe testy uruchamia istniejąca komenda unit.

#### Manual

- [x] 3.3 Starszy zapis jest nieaktualny, po przeliczeniu wynik jest aktualny i zachowuje marginesy oraz widoczną niepewność danych. — użytkownik zaakceptował odbiór; lokalna baza po zmianie potwierdza 2 skrzynie, zgodny snapshot algorytmu 3, 53 pozycje, 0 naruszeń marginesu/odstępu między gatunkami oraz brak ostrzeżeń, konfliktów i pominięć. Niska pewność marchwi zachowana; ścieżkę stale wersji 2 pokrywają testy snapshotu.
