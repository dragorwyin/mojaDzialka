---
date: 2026-10-11 23:31:26 Europe/Warsaw
researcher: Codex
git_commit: c0a72b9c3a3c26d015ab51c596d8beb02aee7fe5
branch: main
repository: mojaDzialka
topic: "Limit obsady ogrodu i rozszerzenie katalogu upraw"
tags: [research, garden-layout, crop-catalog, capacity]
status: partial
last_updated: 2026-10-12
last_updated_by: Codex
last_updated_note: "Użytkownik usunął sztywny próg 100: rozszerzamy katalog maksymalnie w granicach źródeł, z deduplikacją typów i aliasami dla synonimów."
---

# Research: Limit obsady ogrodu i rozszerzenie katalogu upraw

**Date**: 2026-10-11 23:31:26 Europe/Warsaw  
**Researcher**: Codex  
**Git Commit**: c0a72b9c3a3c26d015ab51c596d8beb02aee7fe5  
**Branch**: main  
**Repository**: mojaDzialka

## Research Question

Pierwotny wniosek dotyczył obsługi ponad 10 000 roślin w sektorach i skrzyniach, katalogu 100 obliczalnych upraw oraz braku pomidora Faworyt w diagramie/podsumowaniu. Użytkownik później skorygował zakres katalogu: nie ma sztywnego progu 100; należy dodać jak najwięcej odrębnych, źródłowo uzasadnionych i obliczalnych typów, bez duplikatów. „Obliczenie rozsady” oznacza liczbę roślin do posadzenia w skrzyniach, nie liczbę nasion w tacach.

## Summary

- Zgłoszony limit 256 jest rzeczywiście aktywny. Oznacza maksymalnie 256 utworzonych punktów siatki **na wpis katalogowy w jednej przestrzeni** (np. skrzyni), a nie limit 256 na cały ogród. Przy większej siatce dalsze pozycje są obcinane w kolejności wierszy; generator dodaje ostrzeżenie o pominiętych pozycjach ([stałe generatora](../../../src/lib/garden-layout.ts#L12-L13), [tworzenie siatki](../../../src/lib/garden-layout.ts#L506-L535), [ostrzeżenie](../../../src/lib/garden-layout.ts#L798-L805)).
- Jest też odrębny limit 2 000 sprawdzeń kandydatów na pojedynczy przebieg. Generator wykonuje najpierw bazową alokację, a potem grupowanie według jej wyników, więc wynikowy plan podlega obu budżetowanym przebiegom ([limit i przebieg](../../../src/lib/garden-layout.ts#L12-L13), [sprawdzanie budżetu](../../../src/lib/garden-layout.ts#L811-L847), [dwa przebiegi](../../../src/lib/garden-layout.ts#L1035-L1049)). Ponieważ jedno sprawdzenie może dodać najwyżej jedną pozycję, bazowy przebieg nie może umieścić ponad 2 000 roślin; to wniosek z pętli, a nie limit deklarowany jako maksymalna pojemność produktu ([dodawanie pozycji](../../../src/lib/garden-layout.ts#L841-L847), [wynik przebiegu](../../../src/lib/garden-layout.ts#L910-L915)).
- Historia potwierdza, że 256 i 2 000 zostały świadomie zachowane jako techniczne budżety w poprzednich zmianach. Tamta zmiana wykluczała zwiększenie limitów ze swojego zakresu, ale nie ustanawiała zatwierdzonego przez użytkownika maksymalnego rozmiaru ogrodu ([decyzje algorytmiczne](../../changes/testing-algorithm-decisions/research.md#L52-L54), [zakres poprzedniego planu](../../changes/testing-algorithm-decisions/plan.md#L168), [kontrakt dwóch przebiegów](../../archive/2026-10-11-group-crops-within-garden-beds/plan.md#L36-L56)). Nie znaleziono historycznego limitu produktu 10 000 roślin.
- Katalog ma obecnie dokładnie 31 wpisów, a końcowe odstępy sadzenia ma 28 z nich. Po korekcie zakresu nie obowiązuje liczba docelowa; trzeba rozszerzyć dane o jak najwięcej unikalnych typów mających wiarygodną, obliczalną rozstawę. Aktualna walidacja nie wymaga niepustego `finalSpacing` dla każdego wpisu ([walidator katalogu](../../../src/data/crop-catalog.ts#L1876-L1877), [test pokrycia odstępów](../../../src/data/crop-catalog.test.ts#L112-L123), [typ danych](../../../src/data/crop-catalog.ts#L102-L145)).
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

## Initially Open Questions (resolved by follow-up or retained)

- Jaki realny rozmiar planu należy obsłużyć w gwarantowanym czasie: ponad 10 000 łącznie, czy także ponad 10 000 w jednej skrzyni? Jakie są oczekiwane czasy generowania, zapisu i renderowania?
- **Resolved:** minimum 100 liczy różne typy uprawowe/użytkowe, nie nazwy odmian. Dotychczasowe typy pozostają; lista ma być kuratorowana na podstawie polskich źródeł, bez twierdzenia, że jest rankingiem krajowej popularności.
- Jak traktować pozycje bez potwierdzonego final spacing: jawny, oznaczony default ekspercki, wymagane uzupełnienie użytkownika, czy wpis wyłącznie informacyjny?
- Czy orientacja skrzyni jest dowolna dla układu upraw? Czy należy sprawdzać siatkę obróconą o 90° dla Faworyta?
- Czy Faworyt jest nieobecny na diagramie, w tabeli podsumowań, czy w obu? Do odtworzenia przyczyny potrzebne są wymiary skrzyń, skład wybranych upraw oraz informacja, czy oglądany plan został wygenerowany ponownie po zmianach.
- Jak przy dużej liczbie roślin utrzymać czytelny diagram: wszystkie ikony, grupowanie/klastry przy oddaleniu, czy agregację z możliwością powiększenia?

## Follow-up Research: korekta liczenia katalogu (2026-10-12)

### Korekta wymogu

Użytkownik wyjaśnił, że potrzebuje większej liczby rodzajów roślin, np. fasoli i fasoli szparagowej; dotychczasowe typy mają pozostać. Wcześniejsze „100” liczone jako 31 typów bazowych i 82 odmiany było błędną interpretacją. Następnie użytkownik doprecyzował, że setka nie jest wymagana — należy dodać jak najwięcej odrębnych, źródłowo uzasadnionych i obliczalnych typów. Sama nazwa odmiany nie tworzy nowego typu. Synonimy są aliasami i nie mogą występować jako drugi rekord; duplikat tej samej uprawy odpada. Osobne typy użytkowe, takie jak fasola szparagowa i na suche nasiona, są dopuszczalne, jeśli cel zbioru lub sposób planowania je odróżnia.

### Źródła kandydatów

- Okręg Mazowiecki PZD publikuje rekomendację warzyw i roślin przyprawowych do działek. Wymienia m.in. 10 rodzajów warzyw liściowych, 7 warzyw przyprawowych oraz inne uprawy takie jak fasola szparagowa, groch na zielono/cukrowy, cukinia, dynia, rzodkiewka, burak liściowy, kalarepa, pomidory koktajlowe, papryka, głąbigroszek, okra i brukselka. To bezpośrednio potwierdza przydatność do ROD, ale lista nie jest pomiarem częstości ani rankingiem ([PZD, lista gatunków](https://mazowiecki.pzd.pl/o-dzialce-z-domu-jakie-warzywa-ziola-i-owoce-uprawiac-w-rod/), linie 118–163).
- COBORU opisuje fasolę zwykłą jako typ obejmujący uprawę na suche nasiona i fasolę szparagową, w wariantach karłowych i tycznych. Źródło mówi, że w Polsce największe znaczenie ma fasola szparagowa karłowa, a suchonasienna i tyczna są mniej popularne w produkcji; te dane produkcyjne nie są dowodem popularności w ogrodach, ale wspierają odrębność użytkową typów. ROD/PZD pozostaje właściwym dowodem rekomendacji amatorskiej ([COBORU, opis fasoli zwykłej, 2024](https://coboru.gov.pl/Publikacje_COBORU/Listy_opisowe/LOO_Fasola_RW_2024.pdf), s. 10–11).
- Materiał ministerialny opisuje fasolę szparagową tyczną jako uprawianą w ogrodach i na działkach. Sam podział na karłową/tyczną nie wystarcza do osobnych typów, jeśli planer nie potrzebuje odrębnej geometrii; włączenie wymaga potwierdzonego powodu użytkowego i własnej końcowej rozstawy ([MRiRW, uprawa fasoli szparagowej](https://www.gov.pl/attachment/50d59d68-fb8e-49f1-9bf7-9b98e29f31a9), s. 1).
- CDR Poznań udostępnia tabelę warzyw z siewu obejmującą m.in. dynię, cukinię, ogórka, burak, marchew, pietruszkę, pasternak, rzodkiew, rzodkiewkę, skorzonerę, cebulę, por, bób, groch, fasolę karłową, kapustę pekińską, kukurydzę, koper i szpinak. Kolumny „odległość roślin” są końcową odległością w rzędzie i między rzędami, ale tabela wywodzi się z polowej produkcji i starszej publikacji z 1986 r.; wartości do ogrodu wymagają oznaczenia niskiej pewności, a nie udawania normy amatorskiej ([CDR, tabela z siewu](https://poznan.cdr.gov.pl/normatywy/public/pdf/5_1.pdf), linie 4–45).
- Osobna tabela CDR warzyw z rozsady zawiera odległości w dwóch osiach dla kapust, brukselki, kapusty pekińskiej, brokułu, kalafiora, kalarepy, jarmużu, selera, cebuli, czosnku, pora, sałaty, bakłażana, papryki, pomidora, ogórka i melona. Jest to także materiał polowy, ze źródłem z 1986 r.; nie wolno utożsamiać go automatycznie z zaleceniami dla skrzyń amatorskich ([CDR, tabela z rozsady](https://poznan.cdr.gov.pl/normatywy/public/pdf/5_2.pdf)).

### Źródła odkrywania kandydatów, nie popularności

- Załącznik do rozporządzenia MRiRW z 2023 r. zawiera wykaz 69 pozycji warzywnych opisanych jako rośliny, które nie są powszechnie uprawiane. To nie jest podstawa do listy popularnych upraw; może służyć wyłącznie do odkrywania kandydatów, których przydatność do polskiego warzywnika wymaga niezależnego potwierdzenia ([MRiRW, tekst rozporządzenia](https://eli.gov.pl/api/acts/DU/2023/2008/text.html)).
- GUS rozdziela dojrzałe nasiona roślin strączkowych od niedojrzałych strąków zaliczanych do warzyw polowych. To wspiera klasyfikację różnych celów zbioru, lecz nie mierzy częstości upraw w ogródkach ([GUS, metadane kategorii](https://bdl.stat.gov.pl/bdl/metadane/metryka/3417)).
- Rekomendacje PZD oraz relacje z konkretnych ROD są dowodem przydatności/rekomendacji amatorskiej, ale nie reprezentatywnym pomiarem dla całej Polski ani rankingiem 1–100 ([PZD, zalecenia dla działek](https://mazowiecki.pzd.pl/o-dzialce-z-domu-jakie-warzywa-ziola-i-owoce-uprawiac-w-rod/), [PZD, przykłady nasadzeń w ROD](https://mazowiecki.pzd.pl/wakacyjne-migawki-z-dzialkowych-warzywnikow/)).

### Co pozostaje nierozstrzygnięte

- Źródła PZD oraz CDR dają dobry punkt startowy dla kilkudziesięciu typów i pokazują drogę do źródłowych odstępów, ale z tej próbki nie wynika jeszcze lista 100 typów „najczęściej uprawianych” w Polsce.
- Nie potwierdzono źródłami pełnego maksymalnego inwentarza oddzielnych typów upraw ani końcowej rozstawy dla każdego kandydata. Research katalogu jest zatem **partial** do czasu deduplikacji kandydatów i walidacji odstępów.
- Nie ma dowodu reprezentatywnego dla krajowej częstotliwości nasadzeń; wynik powinien zostać nazwany kuratorowaną listą typów często uprawianych lub polecanych, bez sortowania w „top 100”.
- Badanie generatora, progu 256/2 000, Faworyta i dużego diagramu nie zostało unieważnione przez korektę katalogu; powtórnej weryfikacji wymaga wyłącznie definicja/kandydaci katalogu oraz dostępność wiarygodnego `finalSpacing` dla nowych typów.

### Dostępność rozstaw końcowych

- CDR 5_1 zawiera dwie osie „odległości roślin” dla szeregu upraw z siewu, m.in. dyni, cukinii, ogórka, buraka, marchwi, pietruszki, pasternaku, rzodkwi, rzodkiewki, skorzonery, cebuli, pora, bobu, grochu, fasoli karłowej, kapusty pekińskiej, kukurydzy, kopru i szpinaku. Przypis mówi, że tabela pochodzi z *Ogrodnictwo w tabelach* (1986), a normy dotyczą produkcji polowej; wartości do skrzyń trzeba traktować jako niskiej pewności i oceniać względem mechanizacji/układu rzędów. Tabela odróżnia też „odległość roślin” od normy wysiewu ([CDR 5_1](https://poznan.cdr.gov.pl/normatywy/public/pdf/5_1.pdf), linie 4–45).
- CDR 5_2 podaje dwie osie dla upraw z rozsady: białej i pekińskiej kapusty, brukselki, brokułu, kalafiora, kalarepy, jarmużu, selera, cebuli, czosnku, pora, sałaty głowiastej, bakłażana, papryki, pomidora, ogórka i melona. To również polowy materiał oparty na źródle z 1986 r.; nie jest bezpośrednią, uniwersalną rekomendacją dla każdej odmiany i skrzyni ([CDR 5_2](https://poznan.cdr.gov.pl/normatywy/public/pdf/5_2.pdf)).
- InHort/IO oraz ODR udostępniają dodatkowe metodyki dla wybranych upraw, ale ich kontekst bywa specyficzny dla terminu produkcji, siewu na nasiona, zbioru lub produkcji polowej. Należy przepisać źródłową parę osi, określić, czy dotyczy końcowych roślin, i zapisać kontekst przed użyciem jej jako `finalSpacing` ([InHort — por](https://www.inhort.pl/files/sor/metodyki_ior/Metodyka_integrowanej_ochrony_pora_producenci.pdf), [InHort — kalafior](https://www.inhort.pl/files/sor/metodyki_ior/Metodyka_integrowanej_ochrony_kalafiora_producenci.pdf), [ODR — dynia](https://m.modr.pl/technologie-ekologicznej-produkcji-ogrodniczej/strona/uprawa-dyni-ekologicznej)).
- Źródła list roślin nie dowodzą automatycznie odstępów. Gęstość wysiewu, liczba nasion/ha, liczba rozsady/ha i rozstaw produkcji nasiennej nie mogą zastąpić rozstawy końcowej uprawy jadalnej bez potwierdzenia etapu i jednostki.

### Ocena kompletności i następny krok badawczy

Nie znaleziono pojedynczego, autorytatywnego polskiego katalogu obejmującego 100 różnych typów upraw amatorskich wraz z końcowym odstępem w obu osiach. PZD daje dobry początek doboru, a CDR/InHort/ODR pokrywają część rozstaw. Odpowiedzialny katalog 100 typów wymaga szerszego, gatunek-po-gatunku przeglądu źródeł i jawnego zachowania oryginalnego kontekstu; nie można zastąpić tej pracy 82 nazwami odmian ani kopiowaniem rozstaw podobnych roślin.

Wynik badania pozostaje `partial`, a katalog Fazy 2 nie jest gotowy do odbioru. Zaktualizowany kontrakt: dodać maksymalny zbiór unikalnych typów, które mają dowód doboru i dowód końcowej rozstawy z kontekstem oraz pewnością; nie ma sztywnego minimum liczby. Obecne typy są zachowane. Synonimy są aliasami, odmiany nie zwiększają liczby typów, a odrębny cel użytkowy (np. fasola szparagowa/suche nasiona) może tworzyć osobny typ.

### Wyniki dalszego przeglądu kandydatów i obsady (2026-10-12)

Ponowne sprawdzenie źródeł pierwotnych wzmacnia szeroki koszyk kandydatów, ale nie zamyka inwentarza 100:

- PZD publikuje otwartą listę dla działek z kategoriami liściowych, przyprawowych, innych warzyw oraz ziół. Wymienia m.in. endywię, sałaty rzymską i japońską, szpinak musztardowy, rzeżuchę, trybulę, pietruszkę naciową, szczypiorek czosnkowy, fasolę szparagową, groch na zielono/cukrowy, burak liściowy, głąbigroszek, okrę i 11 ziół. To dowodzi, że można rozszerzyć obecne 31 bez samych odmian, lecz część pozycji musi przejść kontrolę, czy jest samodzielnym typem użytkowym, a nie nazwą formy/odmiany ([PZD, lista dla działek](https://mazowiecki.pzd.pl/o-dzialce-z-domu-jakie-warzywa-ziola-i-owoce-uprawiac-w-rod/), sekcje 118–164).
- PZD opisuje przykładowe warzywniki w warszawskich ROD, w których widzi pomidory, paprykę, szczypiorek, fasolę, ogórki, sałatę, kalarepę, buraki i rzodkiewkę. Jest to bezpośrednia lokalna obserwacja, ale nie próba reprezentatywna dla kraju ([PZD, przykłady warszawskich ROD](https://mazowiecki.pzd.pl/wakacyjne-migawki-z-dzialkowych-warzywnikow/), sekcja 84–106).
- PZD Opole opisuje typowy warzywnik jako m.in. marchew, pietruszkę, burak ćwikłowy, por, seler, cebulę, czosnek, fasolę, pomidora, ogórka i koper; dalej zaleca m.in. rukolę, koper włoski, groszek cukrowy, jarmuż, sałatę pekińską i rzodkiew. Artykuł daje też przykład osobnych celów fasoli szparagowej i wielokwiatowej tycznej, ale sam pokrój nie uzasadnia automatycznie osobnych wpisów katalogowych ([PZD Opole, pierwszy warzywnik](https://ozoopole.pzd.pl/zaprojektujmy-pierwszy-warzywnik/), sekcje 91–101).
- Ministerstwo, powołując się na opinię IO-PIB, wymienia grupy warzyw o płytkim systemie korzeniowym, m.in. kapustowate (w tym kapustę chińską, rokiettę, rzepę i rzodkiewkę), cebulowe, ogórka, koper, pietruszkę naciową, sałaty, endywię, szpinak, burak liściowy, szczaw i szpinak nowozelandzki. To źródło potwierdza tożsamość/użytkową odrębność wielu kandydatów i ich wymagania glebowe, ale nie popularność ani rozstawę sadzenia ([MRiRW, informacja oparta na opinii IO-PIB](https://www.gov.pl/web/rolnictwo/norma-gaec-3), sekcje 160–171).
- ZPE podaje, że w towarowej uprawie w Polsce największą powierzchnię zajmują cebula, kapusta i marchew, dalej ogórki gruntowe, buraki, kalafiory i pomidory; źródło samo ogranicza to do produkcji towarowej. Może to być kontekst dla kandydatów, lecz nie dowód ich częstości w przydomowych ogródkach ([ZPE, dobór gatunków i warunki klimatyczne](https://zpe.gov.pl/a/wybor-i-przygotowanie-terenu-pod-uprawe-roslin-warzywnych-i-przyprawowych/DnOKx7CLp), sekcje 261–269).

Pokrycie końcową obsadą nadal jest węższe niż pokrycie kandydatów. Dwie tabele CDR razem obejmują około 30 unikalnych typów warzyw z liczbowymi odległościami w rzędzie i między rzędami, lecz bazują na źródle z 1986 r. i normach polowych; dla roślin z siewu kontekst przerzedzania/końcowej obsady trzeba zweryfikować osobno. Metodyki InHort dodają potwierdzone przykłady dla pora, kalafiora, brokułu i kapusty głowiastej, nadal w kontekście uprawy polowej i zależnie od terminu produkcji ([CDR 5_1](https://poznan.cdr.gov.pl/normatywy/public/pdf/5_1.pdf), [CDR 5_2](https://poznan.cdr.gov.pl/normatywy/public/pdf/5_2.pdf), [InHort — por](https://www.inhort.pl/files/sor/metodyki_ior/Metodyka_integrowanej_ochrony_pora_producenci.pdf), [InHort — kalafior](https://www.inhort.pl/files/sor/metodyki_ior/Metodyka_integrowanej_ochrony_kalafiora_producenci.pdf), [InHort — brokuł](https://www.inhort.pl/files/sor/metodyki_ior/Metodyka_integrowanej_ochrony_brokul_doradcy.pdf), [InHort — kapusta głowiasta](https://www.inhort.pl/files/sor/metodyki_ior/Metodyka_integrowanej_ochrony_kapusty_glowiastej_producenci.pdf)).

W konsekwencji można teraz wskazać wiarygodne grupy do dalszego katalogowania — liściowe i sałatowe, korzeniowe, cebulowe, strączkowe, kapustne, dyniowate, psiankowate oraz zioła — ale nie zatwierdzać zebranej listy 100. Brakuje skonsolidowanej, zdeduplikowanej listy 100 praktycznych typów, a dla wielu kandydatów brakuje jeszcze źródła końcowej obsady. W szczególności nie wolno liczyć synonimów (np. brukselka/kapusta brukselska) ani form handlowych/odmianowych bez różnego celu planowania.
