---
date: 2026-10-11 23:31:26 Europe/Warsaw
researcher: Codex
git_commit: c0a72b9c3a3c26d015ab51c596d8beb02aee7fe5
branch: main
repository: mojaDzialka
topic: "Limit obsady ogrodu i rozszerzenie katalogu upraw"
tags: [research, garden-layout, crop-catalog, capacity]
status: partial
last_updated: 2026-10-11
last_updated_by: Codex
---

# Research: Limit obsady ogrodu i rozszerzenie katalogu upraw

**Date**: 2026-10-11 23:31:26 Europe/Warsaw  
**Researcher**: Codex  
**Git Commit**: c0a72b9c3a3c26d015ab51c596d8beb02aee7fe5  
**Branch**: main  
**Repository**: mojaDzialka

## Research Question

Użytkownik chce obsługi ponad 10 000 roślin w sektorach i skrzyniach, katalogu 100 upraw możliwych do obliczenia i pokazania na planie, oraz wyjaśnienia, dlaczego pomidor Faworyt nie pojawia się w diagramie lub podsumowaniu. „Obliczenie rozsady” oznacza w tym zadaniu liczbę roślin do posadzenia w skrzyniach, nie liczbę nasion w tacach.

## Summary

- Zgłoszony limit 256 jest rzeczywiście aktywny. Oznacza maksymalnie 256 utworzonych punktów siatki **na wpis katalogowy w jednej przestrzeni** (np. skrzyni), a nie limit 256 na cały ogród. Przy większej siatce dalsze pozycje są obcinane w kolejności wierszy; generator dodaje ostrzeżenie o pominiętych pozycjach ([stałe generatora](../../../src/lib/garden-layout.ts#L12-L13), [tworzenie siatki](../../../src/lib/garden-layout.ts#L506-L535), [ostrzeżenie](../../../src/lib/garden-layout.ts#L798-L805)).
- Jest też odrębny limit 2 000 sprawdzeń kandydatów na pojedynczy przebieg. Generator wykonuje najpierw bazową alokację, a potem grupowanie według jej wyników, więc wynikowy plan podlega obu budżetowanym przebiegom ([limit i przebieg](../../../src/lib/garden-layout.ts#L12-L13), [sprawdzanie budżetu](../../../src/lib/garden-layout.ts#L811-L847), [dwa przebiegi](../../../src/lib/garden-layout.ts#L1035-L1049)). Ponieważ jedno sprawdzenie może dodać najwyżej jedną pozycję, bazowy przebieg nie może umieścić ponad 2 000 roślin; to wniosek z pętli, a nie limit deklarowany jako maksymalna pojemność produktu ([dodawanie pozycji](../../../src/lib/garden-layout.ts#L841-L847), [wynik przebiegu](../../../src/lib/garden-layout.ts#L910-L915)).
- Historia potwierdza, że 256 i 2 000 zostały świadomie zachowane jako techniczne budżety w poprzednich zmianach. Tamta zmiana wykluczała zwiększenie limitów ze swojego zakresu, ale nie ustanawiała zatwierdzonego przez użytkownika maksymalnego rozmiaru ogrodu ([decyzje algorytmiczne](../../changes/testing-algorithm-decisions/research.md#L52-L54), [zakres poprzedniego planu](../../changes/testing-algorithm-decisions/plan.md#L168), [kontrakt dwóch przebiegów](../../archive/2026-10-11-group-crops-within-garden-beds/plan.md#L36-L56)). Nie znaleziono historycznego limitu produktu 10 000 roślin.
- Katalog ma obecnie dokładnie 31 wpisów, a końcowe odstępy sadzenia ma 28 z nich. Dlatego cel „100 roślin, każda możliwa do obliczenia” wymaga rozszerzenia danych i reguły dla odmian bez potwierdzonych odstępów; aktualna walidacja nie wymaga niepustego `finalSpacing` dla każdego wpisu ([walidator katalogu](../../../src/data/crop-catalog.ts#L1876-L1877), [test pokrycia odstępów](../../../src/data/crop-catalog.test.ts#L112-L123), [typ danych](../../../src/data/crop-catalog.ts#L102-L145)).
- Faworyt jest obecny pod ID `pomidor`, ma alias `faworyt` i końcowy odstęp 50 × 100 cm. Generator przypisuje odstępy w rzędzie do osi szerokości, a między rzędami do osi długości; dla skrzyni 120 × 80 cm taki układ nie zmieści nawet jednego rzędu. To konkretna hipoteza wyjaśniająca brak ikony w takim układzie, nie potwierdzenie wymiarów ogrodu użytkownika ([wpis katalogu](../../../src/data/crop-catalog.ts#L586-L617), [końcowy odstęp](../../../src/data/crop-catalog.ts#L1325-L1338), [orientacja siatki](../../../src/lib/garden-layout.ts#L506-L535)).
- Brak Faworyta w diagramie i brak Faworyta w podsumowaniu to różne objawy. Diagram rysuje faktycznie rozmieszczone pozycje, ale generator tworzy podsumowanie dla każdej wybranej uprawy, także z `actualCount: 0`, a tabela i legenda iterują po całym podsumowaniu ([diagram](../../../src/components/garden/GardenLayoutView.tsx#L233-L250), [podsumowania generatora](../../../src/lib/garden-layout.ts#L1002-L1010), [tabela i legenda](../../../src/components/garden/GardenLayoutView.tsx#L531-L543), [tabela](../../../src/components/garden/GardenLayoutView.tsx#L585-L603)). Jeśli Faworyta nie ma w podsumowaniu istniejącego planu, sam limit siatki tego nie tłumaczy.
- Nie wykonano benchmarku 10 000 pozycji ani nie odtworzono zapisanego planu użytkownika. Bez wymiarów skrzyń, wybranych proporcji i odpowiedzi, czy brak dotyczy ikony, tabeli czy obu, bezpiecznej docelowej granicy i przyczyny konkretnego planu nie da się jeszcze rozstrzygnąć. Status badań pozostaje `partial`.

## Detailed Findings

### Pojemność i ograniczenia generatora

- `MAX_GRID_POINTS_PER_CROP` wynosi 256, a `makeCandidates` kończy generowanie siatki, gdy osiągnie tę liczbę. Obliczone `totalCandidates` może być większe, a `truncatedCount` trafia do ostrzeżenia ([stałe i siatka](../../../src/lib/garden-layout.ts#L12-L13), [pętle i zwracane liczby](../../../src/lib/garden-layout.ts#L506-L535), [ostrzeżenie](../../../src/lib/garden-layout.ts#L798-L805)). Test generatora wymusza przypadek z tysiącem możliwych punktów i sprawdza, że do planu trafia 256 oraz pojawia się ostrzeżenie ([test limitu siatki](../../../src/lib/garden-layout.test.ts#L310-L321)).
- Budżet 2 000 ogranicza sprawdzane kandydatury w jednym przebiegu. Wstawienie rośliny zwiększa `candidateChecks`; przebieg przestaje sprawdzać po osiągnięciu budżetu. Drugi przebieg ustawia docelowe liczby na podstawie bazowego, po czym grupuje ich pozycje ([budżet](../../../src/lib/garden-layout.ts#L712-L712), [inkrementacja i zatrzymanie](../../../src/lib/garden-layout.ts#L811-L847), [alokacja i przebieg grupujący](../../../src/lib/garden-layout.ts#L1035-L1049)). Zwiększenie wyłącznie stałej 256 nie rozwiąże więc problemu ogrodu powyżej 10 000 pozycji.
- Każdy sprawdzany kandydat porównuje geometrię względem już posadzonych pozycji (`placed.some(overlaps)`), co oznacza, że naiwne zwiększenie obu budżetów może podnieść koszt obliczeń wraz ze wzrostem planu ([sprawdzenie nakładania](../../../src/lib/garden-layout.ts#L841-L847)). Dokładnego czasu ani bezpiecznego górnego rozmiaru nie znamy, ponieważ nie wykonano benchmarku.
- W sprawdzonych granicach API wymiarów ogrodu znajduje się limit 100 000 cm, ale jest to limit wymiaru, nie liczby pozycji ([walidacja wymiarów](../../../src/pages/api/garden.ts#L6-L21)). W przejrzanych migracjach plan jest zapisany jako JSONB bez znalezionego limitu liczby pozycji; ten fakt nie przesądza o kosztach payloadu, czasu zapisu ani renderowania ( [migracja planu](../../../supabase/migrations/20260929120000_create_garden_plans.sql#L1-L7)).
- Diagram tworzy SVG-owe elementy dla markerów, a projekcja mapuje pozycje na markery jeden do jednego. Tysiące pozycji mogą zatem również obciążać przeglądarkę, ale obecne źródła nie podają pomiarów ani mechanizmu próbkowania/klastrowania ([renderowanie markerów](../../../src/components/garden/GardenLayoutView.tsx#L233-L250), [projekcja](../../../src/components/garden/garden-layout-diagram.ts#L53-L115)).

### Katalog i obliczalność upraw

- Katalog egzekwuje dokładnie 31 aktywnych rekordów; test egzekwuje 28 wpisów z `finalSpacing`. Te wartości opisują stan bieżący, nie docelowy model katalogu 100-uprawowego ([inwariant liczby wpisów](../../../src/data/crop-catalog.ts#L1876-L1877), [test pokrycia](../../../src/data/crop-catalog.test.ts#L112-L123)).
- `finalSpacing` opisuje rozmieszczenie końcowych roślin (albo kęp), natomiast `sowingDensity` jest oddzielnym polem danych. Ponieważ użytkownik wskazał liczbę roślin do posadzenia, kryterium obliczalności powinno dotyczyć końcowego sadzenia, a nie liczby nasion na tacę ([model danych](../../../src/data/crop-catalog.ts#L102-L145)). Wymaganie może dotyczyć 100 nazw/odmian, ale potrzebna jest decyzja, czy wpis bez dobrego źródła może używać jawnie oznaczonego domyślnego odstępu, czy ma pozostać nieobliczalny.
- Formularz wyboru prezentuje maksymalnie 8 pierwszych wyników wyszukiwania; wyszukiwanie sprawdza nazwy i aliasy. Przy katalogu 100 wpisów może to ukryć wyniki dla szerokich zapytań, mimo że wpis istnieje ([wyszukiwanie katalogu](../../../src/lib/crop-catalog.ts#L49-L55), [limit wyników](../../../src/components/garden/CropSelectionForm.tsx#L30-L30), [przycięcie listy](../../../src/components/garden/CropSelectionForm.tsx#L199-L207)). Nie jest to obecnie przekonujące wyjaśnienie Faworyta przy szukaniu dokładnego aliasu `faworyt`.
- Miniatury są połączone z katalogiem poprzez jawny manifest ID upraw, dlatego rozszerzenie do 100 będzie wymagało decyzji, jak prezentować rekordy bez własnej ilustracji ([manifest miniatur](../../../src/components/garden/crop-thumbnail-manifest.ts#L23-L93)).
- Historyczne badanie 30 upraw opisywało kuratorowaną listę MVP, nie reprezentatywny ranking popularności. Obecne badanie katalogu powinno więc pozyskać kandydatów do brakujących rekordów i weryfikować odstępy źródłami, zamiast mechanicznie rozszerzać starą listę ([historyczne badanie katalogu](../../changes/garden-crop-catalog-research/research.md#L18-L28), [historyczny kontrakt 31 upraw](../../archive/2026-09-28-generate-garden-layout/plan.md#L286-L306)).

### Pomidor Faworyt

- Wpis `pomidor` jest nazwany „pomidor Faworyt” i zawiera alias `faworyt`; jego zapisany final spacing to 50 cm w rzędzie i 100 cm między rzędami, z niską pewnością i adnotacją, że to ogólny domyślny wariant wysokiego pomidora, a nie zweryfikowany pomiar odmiany Faworyt ([definicja uprawy](../../../src/data/crop-catalog.ts#L586-L617), [metadane odstępów](../../../src/data/crop-catalog.ts#L1325-L1338)).
- **Hipoteza dla diagramu**: przy wymiarach 120 × 80 cm aktualna orientacja siatki używa 50 cm na szerokość, ale wymaga 100 cm na długość. Kod wylicza zero wierszy, zatem w tej konkretnej konfiguracji Faworyt nie ma pozycji do narysowania; obrót osi mógłby zmieścić roślinę. Wymiary skrzyni z realnego planu nie zostały potwierdzone ([wyliczenie wierszy](../../../src/lib/garden-layout.ts#L506-L535)).
- **Podsumowanie**: wybrane uprawy są mapowane na `cropSummaries` z zerem jako domyślną liczbą pozycji, a widok pokazuje te podsumowania w legendzie i tabeli. Dlatego brak w podsumowaniu sugeruje osobny problem z danymi wejściowymi, starszą migawką planu albo wyświetleniem, nie samą geometrią. To wniosek ze ścieżki kodu, jeszcze nie odtworzony na danych użytkownika ([mapowanie](../../../src/lib/garden-layout.ts#L1002-L1010), [widok podsumowania](../../../src/components/garden/GardenLayoutView.tsx#L531-L543), [tabela](../../../src/components/garden/GardenLayoutView.tsx#L585-L603)).

## Code References

- `src/lib/garden-layout.ts:12-13` — domyślny budżet 2 000 i limit siatki 256.
- `src/lib/garden-layout.ts:506-535` — kandydaci są tworzeni według jednej stałej orientacji osi i obcinani po 256.
- `src/lib/garden-layout.ts:712-847` — limit kandydatów dla przebiegu i koszt sprawdzania.
- `src/lib/garden-layout.ts:1002-1049` — podsumowanie wybranych upraw oraz bazowy i grupujący przebieg.
- `src/data/crop-catalog.ts:586-617,1325-1338,1876-1877` — Faworyt, jego odstępy i inwariant wielkości katalogu.
- `src/data/crop-catalog.test.ts:112-123` — test pokrycia `finalSpacing`.
- `src/components/garden/GardenLayoutView.tsx:233-250,531-543,585-603` — markery diagramu, legenda i tabela podsumowań.
- `src/components/garden/CropSelectionForm.tsx:30,199-207` — ograniczenie wyników wyszukiwania do 8.
- `src/pages/api/garden.ts:6-21` — limit wymiarów w centymetrach, nie liczba roślin.

## Architecture Insights

- Rozdzielić w planowaniu dwie niezależne potrzeby: szybkie i bezpieczne umieszczanie dużych liczb punktów oraz katalog z kompletnymi danymi sadzenia. Powiększenie limitów nie dostarcza brakujących źródeł odstępów, a katalog 100 pozycji nie usuwa budżetów generatora.
- Obecny algorytm jest ograniczoną heurystyką; historyczny research stwierdza brak gwarancji optimum. Następny plan powinien ustalić mierzalny kontrakt dla >10 000 pozycji (wliczając generowanie, zapis/odczyt oraz diagram) i wybrać reprezentację przestrzenną/strategię wyszukiwania, która zachowa stabilne ograniczenia geometrii i sąsiedztwa.
- Dla Faworyta warto traktować orientację siatki jako kandydatkę do planu, a brak w tabeli diagnozować osobno od braku markera. Nie ma wystarczających danych do przypisania błędu konkretnemu zapisanemu ogrodowi.
- W katalogu każdy rekord potrzebuje końcowego rozstawu z etapem, jednostką, źródłem i poziomem pewności. Jeśli cel produktu wymaga policzenia wszystkich 100 upraw, plan musi rozstrzygnąć obsługę danych o niskiej pewności zamiast po cichu tworzyć brakujące wartości.

## Historical Context (from prior changes)

- **Supported** — `context/changes/testing-algorithm-decisions/research.md:52-54` dokumentuje 2 000 sprawdzeń, 256 punktów na uprawę/przestrzeń i zachłanny, ograniczony charakter heurystyki. Jest to zgodne z bieżącym kodem.
- **Supported, z ograniczeniem zakresu** — `context/changes/testing-algorithm-decisions/plan.md:28,52,168` zachowuje istniejące limity w ramach tamtej zmiany i wyłącza ich zwiększanie z zakresu. Nie dowodzi to, że produktowo zaakceptowano limit 256 lub 2 000.
- **Supported** — `context/archive/2026-10-11-group-crops-within-garden-beds/plan.md:36-56,187` przenosi istniejący budżet do przebiegów bazowego i grupującego. Nie znaleziono tam kontraktu maksymalnej liczby roślin.
- **Supported** — `context/archive/2026-09-28-generate-garden-layout/plan.md:286-306` ustalało katalog 31 pozycji i odróżniało odstępy sadzenia od gęstości siewu; nie obejmowało 100 rekordów.
- **Supported** — `context/changes/garden-crop-catalog-research/research.md:18-28,32-71` opisuje wcześniejszy zestaw jako listę kuratorowaną do MVP, nie ranking rynku. Nie można go traktować jako kompletnej podstawy dla nowej listy 100 upraw.

## Related Research

- [Badanie poprzedniego katalogu](../../changes/garden-crop-catalog-research/research.md)
- [Decyzje algorytmiczne](../../changes/testing-algorithm-decisions/research.md)
- [Implementacja generatora i grupowania](../../archive/2026-10-11-group-crops-within-garden-beds/plan.md)
- [Pierwszy kontrakt generatora](../../archive/2026-09-28-generate-garden-layout/plan.md)

## Open Questions

- Jaki realny rozmiar planu należy obsłużyć w gwarantowanym czasie: ponad 10 000 łącznie, czy także ponad 10 000 w jednej skrzyni? Jakie są oczekiwane czasy generowania, zapisu i renderowania?
- Czy „100 roślin” oznacza 100 gatunków, 100 pozycji katalogowych (wliczając odmiany), czy 100 najczęstszych upraw w Polsce? Jak ustalić źródła i kryterium wyboru listy?
- Jak traktować pozycje bez potwierdzonego final spacing: jawny, oznaczony default ekspercki, wymagane uzupełnienie użytkownika, czy wpis wyłącznie informacyjny?
- Czy orientacja skrzyni jest dowolna dla układu upraw? Czy należy sprawdzać siatkę obróconą o 90° dla Faworyta?
- Czy Faworyt jest nieobecny na diagramie, w tabeli podsumowań, czy w obu? Do odtworzenia przyczyny potrzebne są wymiary skrzyń, skład wybranych upraw oraz informacja, czy oglądany plan został wygenerowany ponownie po zmianach.
- Jak przy dużej liczbie roślin utrzymać czytelny diagram: wszystkie ikony, grupowanie/klastry przy oddaleniu, czy agregację z możliwością powiększenia?
