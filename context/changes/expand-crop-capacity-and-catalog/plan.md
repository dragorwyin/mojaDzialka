# Większa obsada ogrodu i katalog 100+ upraw — Implementation Plan

## Overview

Umożliwić wygenerowanie i zapisanie planu z co najmniej 10 000 fizycznych pozycji roślin w całym ogrodzie, bez obecnego limitu 256 kandydatów na uprawę w skrzyni. Rozszerzyć ręcznie weryfikowany katalog do co najmniej 100 wybieralnych wpisów, każdy z obliczalnym końcowym odstępem sadzenia, i pokazać plan w formie czytelnej przy dużej liczbie markerów. Plan zachowuje wcześniejszą regułę jednej zwartej grupy wpisu katalogowego w każdej skrzyni i nie zamienia gęstości siewu w końcową obsadę.

## Current State Analysis

Generator w `src/lib/garden-layout.ts` buduje najwyżej 256 punktów siatki dla każdej uprawy w każdej przestrzeni oraz sprawdza najwyżej 2 000 kandydatów w przebiegu. Działa w dwóch przebiegach: najpierw ustala alokację per uprawa/przestrzeń, a następnie próbuje rozmieścić tę alokację jako zwartą grupę. To są techniczne limity wyszukiwania, nie zaakceptowany maksymalny rozmiar produktu. Przy każdym sprawdzeniu generator przegląda już umieszczone pozycje w poszukiwaniu nakładania, co może rosnąć kosztownie wraz z liczbą roślin.

API `src/pages/api/garden-plan.ts` przekazuje wynik jako cały obiekt do RPC zapisującego plan w JSONB. Dashboard odczytuje i waliduje zapisany obiekt przez `readGardenLayoutResult`. Diagram mapuje pozycje na markery pojedynczo, a widok renderuje je jako elementy SVG. Testy generatora wprost utrwalają przykład 256/1000.

Katalog w `src/data/crop-catalog.ts` egzekwuje dokładnie 31 rekordów; 28 mają `finalSpacing`, a pozostałe mogą mieć brak danych. Nazwy i aliasy można wyszukiwać, lecz formularz pokazuje do 8 wyników, a manifest miniatur ma stałe 31 identyfikatorów. `pomidor`/Faworyt jest wpisem katalogowym z odstępem 50 × 100 cm; generator nie sprawdza obróconej siatki.

Użytkownik zatwierdził: limit 10 000 dotyczy całego ogrodu i generowanie ma trwać do 10 sekund; katalog ma mieć co najmniej 100 wpisów, a odmiany mogą być osobnymi pozycjami; odmiana bez własnych danych może użyć źródłowego rozstawu gatunkowego, jawnie oznaczonego niską pewnością; dla Faworyta należy sprawdzać obie orientacje odstępu; diagram grupuje markery przy oddaleniu i pokazuje pojedyncze pozycje po powiększeniu. Wcześniej zatwierdzono również grupowanie jednego wpisu katalogowego w jednej skrzyni, jawny raport braków i pierwszeństwo grupy nad miękkimi korzyściami sąsiedztwa.

## Desired End State

Generator tworzy co najmniej 10 000 pozycji dla wykonalnego, wieloskrzyniowego przypadku testowego w czasie nieprzekraczającym 10 sekund w środowisku zbliżonym do produkcyjnego. Nie ucina siatki na 256 ani nie kończy planu wyłącznie z powodu obecnego budżetu 2 000; gdy fizyczne ograniczenia lub jawny budżet bezpieczeństwa uniemożliwią osiągnięcie celu, wynik zachowuje najlepsze grupy, dokładnie raportuje braki i nie przedstawia planu jako pełnego.

Katalog zawiera co najmniej 100 stabilnych, wyszukiwalnych wpisów i każdy aktywny wpis ma źródłowe `finalSpacing` z jednostką, etapem, kontekstem i poziomem pewności. Wartość gatunkowa zastosowana dla odmiany jest czytelnie oznaczona jako fallback niskiej pewności. Każdy wybrany wpis może być ujęty w obliczeniu i w podsumowaniu, nawet jeśli warunki konkretnego ogrodu dają mu zero pozycji.

Plan 10 000 roślin zapisuje się i odczytuje bez utraty ID, współrzędnych, alokacji ani braków. Diagram pozostaje responsywny: w skali przeglądu markery są agregowane; po powiększeniu wszystkie pozycje są dostępne indywidualnie. Dla skrzyni 120 × 80 cm generator dopuszcza Faworyta z rozstawą 50 × 100 cm poprzez wybór wykonalnej orientacji siatki.

### Key Discoveries:

- `src/lib/garden-layout.ts:12-14,506-535,811-847` — aktywne limity 256 punktów na uprawę/przestrzeń oraz 2 000 sprawdzeń na przebieg.
- `src/lib/garden-layout.ts:1035-1071` — przebieg grupujący bierze liczby per uprawa/przestrzeń z przebiegu bazowego.
- `src/lib/garden-layout.test.ts:310-321` — test oczekuje dokładnie 256 z 1 000 punktów; kontrakt wymaga zmiany wraz z algorytmem.
- `src/data/crop-catalog.ts:130-143,1876-1888,1943-1956` — katalog ma jawny model `finalSpacing`, ale dokładnie 31 wpisów i dopuszcza brak odstępu.
- `src/data/crop-catalog.test.ts:48-67,112-123` oraz `src/lib/crop-catalog.test.ts:9` — testy wiążą katalog z obecną liczbą wpisów, odstępami i manifestem miniatur.
- `src/lib/garden-layout.ts:506-535` — osie odstępu są obecnie przypisane do wymiarów bez sprawdzenia obrotu siatki.
- `src/pages/api/garden-plan.ts:99-136`, `src/pages/dashboard.astro:92-106` — plan jest generowany w żądaniu, zapisywany jako pełny JSON przez RPC i walidowany przy odczycie dashboardu.
- `src/components/garden/garden-layout-diagram.ts:53-115` i `src/components/garden/GardenLayoutView.tsx:233-254,462-475` — projekcja i widok obecnie przetwarzają markery oraz szczegóły pojedynczo.
- `context/archive/2026-10-11-group-crops-within-garden-beds/plan.md:36-56` — zaakceptowane grupowanie, raport braków i ograniczenie liczby przebiegów.

## What We're NOT Doing

- Nie liczymy liczby nasion na tacki, kiełkowania ani zapasu nasion; wynik jest liczbą końcowych jednostek sadzenia w skrzyniach.
- Nie prognozujemy plonu ani nie rozszerzamy relacji sąsiedztwa poza istniejący, źródłowy zestaw.
- Nie pozwalamy na ręczne przypisywanie lub przesuwanie roślin i nie osłabiamy wymaganych odstępów ani twardych negatywnych sąsiadów.
- Nie przedstawiamy katalogu jako rankingu popularności i nie tworzymy niestandardowych wpisów użytkownika.
- Nie projektujemy 100 odrębnych ilustracji; brak dedykowanej miniatury nie może blokować wyszukania, obliczenia ani pokazania uprawy.
- Nie wymagamy 10 000 roślin w pojedynczej skrzyni; zatwierdzony próg dotyczy całego ogrodu.
- Nie archiwizujemy historii sezonów ani nie zmieniamy granicy prywatności danych działki.

## Implementation Approach

Najpierw zastąpić obcinanie siatki i kosztowne wyszukiwanie strategią rozmieszczania zdolną policzyć wykonalne pozycje w całym ogrodzie, bez utraty determinizmu, odstępów, twardych zakazów i wcześniej uzgodnionych grup. Zmiana semantyki generatora unieważni aktualność poprzedniego planu przez wersję algorytmu, pozostawiając zapisany wynik widoczny jako nieaktualny do ponownego obliczenia.

Następnie przygotować źródłowy rejestr co najmniej 100 wpisów, zmienić inwarianty katalogu i włączyć każdy wpis do wyszukiwania oraz prezentacji. Wartości uprawowe wynikają z potwierdzonych danych dla odmiany, a gdy tych brak — z danych gatunkowych z wyraźnym fallbackiem niskiej pewności. Końcowy odstęp nigdy nie jest wyprowadzany z gęstości siewu.

Na końcu sprawdzić pełny cykl API, zapisu, odczytu i dashboardu dla dużego wyniku. Warstwa wizualna agreguje markery zależnie od skali, ale nie zmienia przechowywanych współrzędnych ani dokładnego podsumowania. Każda faza kończy się automatycznymi kontrolami oraz ręcznym odbiorem przed rozpoczęciem kolejnej.

## Critical Implementation Details

### Performance constraints

Próg 10 sekund dotyczy generowania wykonalnego planu dla całego ogrodu z co najmniej 10 000 pozycji, mierzonego na środowisku zgodnym z docelowym uruchomieniem. Dokumentacja Cloudflare zaznacza, że limity CPU Workers są egzekwowane na sieci Cloudflare, a nie w lokalnym developmentie; wynik lokalny sam nie potwierdzi progu na produkcji ([Cloudflare Workers platform limits](https://developers.cloudflare.com/workers/platform/limits/)). Nie zwiększać samych stałych 256/2 000 bez pomiaru i dowodu, że pętla kolizji, JSON i renderowanie nadal mieszczą się w budżecie.

### Algorithm and saved-plan lifecycle

Reguły grupowania zaakceptowane w poprzedniej zmianie pozostają obowiązujące: jedna zwarta grupa na wpis i skrzynię, częściowa grupa tylko przy realnym braku wykonalnych pozycji lub jawnym limicie bezpieczeństwa, brakujące liczby raportowane per skrzynia i globalnie. Po zmianie semantyki układu należy podnieść `GARDEN_LAYOUT_ALGORITHM_VERSION`, aby starszy zapis nie był błędnie uznany za aktualny.

## Phase 1: Skalowalny generator i obsługa orientacji

### Overview

Usunąć faktyczny limit 256 oraz budżet, który zatrzymuje obsadę poniżej zatwierdzonej skali. Utrzymać dotychczasowe reguły agronomiczne i grupowanie, dodać porównanie orientacji siatki oraz zmierzyć generator na wykonalnym ogrodzie z ponad 10 000 pozycji.

### Changes Required:

#### 1. Skalowanie i deterministyczna obsada w generatorze

**File**: `src/lib/garden-layout.ts`

**Intent**: Zastąpić obcinanie kandydatów i ograniczenie przebiegu strategią, która potrafi rozważyć i umieścić wykonalne stanowiska w docelowej skali bez gwałtownego skanowania wszystkich wcześniej posadzonych pozycji. Zachować deterministyczny wynik, globalny cel proporcji, priorytety relacji, rozstawę, twarde bloki, grupowanie i jawne braki.

**Contract**: Zmiana obejmuje generator i mierniki wyniku; limit bezpieczeństwa, jeśli pozostaje potrzebny, musi być jawny, mierzalny i dawać status niepełnego wyniku wraz z brakami, a nie ciche obcięcie do 256/2 000. Wykonalne wejście testowe obejmujące wiele skrzyń zwraca co najmniej 10 000 pozycji. Liczby bazowe i grupujące pozostają zgodne w zakresie geometrycznej wykonalności.

#### 2. Obracana siatka i niezmienne reguły grup

**File**: `src/lib/garden-layout.ts`, `src/lib/garden-layout.test.ts`, `src/lib/garden-layout.capacity.test.ts`

**Intent**: Rozważać siatkę z odstępami w obu osiach oraz obróconą o 90°, po czym używać orientacji wykonalnej dla danej skrzyni. Nie dzielić jednego wpisu na kilka grup, aby wykorzystać obrót lub dobre sąsiedztwo.

**Contract**: Obie orientacje zachowują fizyczne wartości odstępu 50 × 100 cm; wybór nie może odwrócić jednostek sadzenia, osłabić hard-neighbor constraints ani dopuścić nakładania. Test Faworyta dla przestrzeni 120 × 80 cm wymaga co najmniej jednej poprawnej pozycji. Testy grupowania utrzymują jedną zwartą grupę oraz raport allocated/placed/missing per skrzynia i całość.

#### 3. Wersja semantyki planu i pomiar wydajności

**File**: `src/lib/garden-plan-snapshot.ts`, `src/lib/garden-plan-snapshot.test.ts`, `src/lib/garden-layout.capacity.test.ts`

**Intent**: Odróżnić plany wygenerowane nową semantyką od zapisanych wcześniej i zapewnić powtarzalny pomiar przypadku 10 000 pozycji. Wynik czasu ma pochodzić ze środowiska zbliżonego do produkcyjnego, nie wyłącznie z lokalnego serwera developerskiego.

**Contract**: `GARDEN_LAYOUT_ALGORITHM_VERSION` wzrasta zgodnie z istniejącą regułą fingerprintu; wcześniejszy plan zachowuje dane, ale wymaga jawnego ponownego obliczenia. Dedykowany test Vitest dokumentuje deterministyczny fixture i raportuje czas generowania; asercja funkcjonalna wymaga ≥10 000 pozycji, a ręczny odbiór performance wymaga czasu ≤10 s na Workers/preview.

### Success Criteria:

#### Automated Verification:

- Test generatora tworzy co najmniej 10 000 pozycji dla wykonalnego ogrodu z wieloma przestrzeniami i potwierdza determinizm oraz brak ograniczenia 256/2 000.
- Testy sprawdzają rozstawę, brak nakładania, twarde negatywne sąsiedztwo, pojedynczą zwartą grupę na wpis i przestrzeń oraz dokładne raportowanie niedoborów.
- Test Faworyta umieszcza poprawną pozycję w skrzyni 120 × 80 cm przez obróconą siatkę bez zmiany odstępu 50 × 100 cm.
- Test snapshotu oznacza poprzedni plan jako nieaktualny po zmianie wersji algorytmu.
- `npm run test:unit`, `npm run lint`, `npx astro check` i `npm run build` przechodzą.

#### Manual Verification:

- Na preview lub środowisku Workers zbliżonym do produkcyjnego wykonalny fixture z co najmniej 10 000 roślin kończy generowanie w ≤10 s; zapisany czas i konfiguracja są dołączone do odbioru.
- Ręcznie sprawdzić mały ogród i duży ogród: mały zachowuje dotychczasowe reguły, duży nie traci pozycji cicho i jasno pokazuje ewentualne braki.

**Implementation Note**: Po automatycznej weryfikacji zatrzymać się na ręczny odbiór Fazy 1 przed rozpoczęciem Fazy 2.

---

## Phase 2: Katalog 100+ obliczalnych upraw

### Overview

Rozszerzyć aktywny, wyszukiwalny katalog do minimum 100 pozycji z końcowym odstępem sadzenia dla każdej. Przed dodaniem wartości utworzyć rejestr źródeł i jednostek, a istniejące wyjątki bez końcowej rozstawy uzupełnić albo jawnie zastąpić innymi źródłowo obliczalnymi wpisami.

### Changes Required:

#### 1. Źródłowa lista wpisów i danych końcowej obsady

**File**: `context/changes/expand-crop-capacity-and-catalog/catalog-evidence.md`, `src/data/crop-catalog.ts`

**Intent**: Dobrać co najmniej 100 osobnych, użytecznych wpisów do polskiego ogrodu amatorskiego bez twierdzenia, że lista jest rankingiem popularności. Utrwalić pochodzenie każdej wartości końcowego odstępu, etap sadzenia/przerwania, jednostkę (roślina lub kępa), kontekst odmiany oraz pewność.

**Contract**: Każdy aktywny ID ma niepuste `finalSpacing` z valid `sourceIds`. Gdy dane dla odmiany są niedostępne, wpis może przejąć źródłowy odstęp gatunkowy wyłącznie z jawnie opisanym fallbackiem niskiej pewności. Dane siewne pozostają osobne i nie mogą zastępować końcowej obsady. Wariant otrzymuje osobny ID, gdy wymaga odrębnej tożsamości lub rozstawy; stare ID, zwłaszcza `pomidor`, pozostają stabilne.

#### 2. Inwarianty i kontrakty testowe katalogu

**File**: `src/data/crop-catalog.ts`, `src/data/crop-catalog.test.ts`, `src/lib/crop-catalog.test.ts`

**Intent**: Usunąć dokładne założenie 31 wpisów i zabezpieczyć kompletność wymaganej listy oraz możliwość obliczania każdego aktywnego wpisu.

**Contract**: Walidator oraz testy wymagają ≥100 unikalnych aktywnych ID, niepustej źródłowej końcowej rozstawy dla każdego ID, poprawnej jednostki/etapu/pewności i braku nieznanych `sourceIds`. Testy ustalają minimalną liczbę i reprezentatywną listę ID zamiast blokować dalsze rozszerzenia dokładnym `length === 100`.

#### 3. Wyszukiwanie i reprezentacja wpisów bez miniatury

**File**: `src/components/garden/CropSelectionForm.tsx`, `src/components/garden/crop-thumbnail-manifest.ts`, `src/components/garden/GardenLayoutView.tsx` oraz ich testy

**Intent**: Pozwolić odkryć każdy wpis w większym katalogu i wyświetlić wybraną uprawę zarówno w diagramie, jak i podsumowaniu bez wymogu tworzenia indywidualnej ilustracji dla każdej pozycji. Zachować czytelne oznaczenie niskiej pewności/fallbacku.

**Contract**: Limit 8 widocznych wyników nie może ukryć dopasowania dokładnej nazwy/aliasu ani uniemożliwić przeglądania większej listy. Każdy aktywny cropId mapuje się do znacznika i tekstowej nazwy; brak dedykowanej miniatury używa jawnego fallbacku. Wybrany wpis pozostaje w tabeli podsumowania również przy `actualCount === 0`.

#### 4. Zgodność dokumentacji produktu

**File**: `context/foundation/prd.md`

**Intent**: Zaktualizować dotychczasowe twierdzenie o katalogu 31 aktywnych pozycji i ograniczonym katalogu tak, aby PRD opisywał uzgodnione minimum 100 obliczalnych wpisów i końcową obsadę.

**Contract**: Nie zmieniać pozostałych wymagań PRD; zapisać próg ≥10 000 pozycji w całym ogrodzie i pomiar ≤10 s, a także minimum 100 obliczalnych wpisów ze źródłową pewnością — bez obietnicy rankingu rynkowego ani liczby nasion do wysiewu.

### Success Criteria:

#### Automated Verification:

- Walidator i test katalogu potwierdzają co najmniej 100 aktywnych, unikalnych wpisów oraz niezerowe, źródłowe `finalSpacing` dla każdego.
- Testy potwierdzają osobne znaczenie końcowej obsady i `sowingDensity`, działanie aliasów przy większej liczbie wyników oraz czytelny fallback miniatury.
- Test formularza i widoku znajduje/wyświetla wpisy z początku, środka i końca katalogu, także wpis z zerową obsadą w danym planie.
- `npm run test:unit`, `npm run lint`, `npx astro check` i `npm run build` przechodzą.

#### Manual Verification:

- Użytkownik przegląda rejestr źródeł, przykładowe wpisy z dokładnym źródłem oraz przykładowy fallback gatunkowy i potwierdza, że oznaczenie niskiej pewności jest zrozumiałe.
- W UI wyszukać dokładny alias oraz nazwy dające wiele dopasowań, wybrać wpis z fallbackiem i potwierdzić jego rozstawę, marker, nazwę i pewność w podsumowaniu.

**Implementation Note**: Po automatycznej weryfikacji zatrzymać się na ręczną akceptację katalogu i danych przed rozpoczęciem Fazy 3.

---

## Phase 3: Zapis i czytelny diagram dużego planu

### Overview

Potwierdzić pełen przepływ ponad 10 000 pozycji przez endpoint, zapis JSONB, odczyt dashboardu i widok. Zachować dokładną geometrię w danych, a na diagramie agregować ikony tylko wtedy, gdy skala widoku utrudnia czytelność.

### Changes Required:

#### 1. Duży plan przez API i zapis/odczyt

**File**: `src/pages/api/garden-plan.ts`, `src/pages/api/garden-plan.test.ts`, `src/pages/dashboard.astro`, `src/lib/garden-layout.ts` i testy odczytu

**Intent**: Zweryfikować, że wygenerowane pozycje w pełnej liczbie przechodzą przez odpowiedź API, RPC, JSONB i dekoder dashboardu bez obcinania lub zmiany alokacji.

**Contract**: Fixture ≥10 000 pozycji po zapisie i ponownym odczycie zachowuje łączną liczbę, cropId, spaceId, współrzędne, allocated/placed/missing oraz status aktualności. Nie wprowadzać limitu opartego wyłącznie na wielkości JSON. Gdy infrastruktura wykaże konieczność innej reprezentacji, dekoder zachowuje wsteczną zgodność z dotychczasowym obiektem planu.

#### 2. Agregacja markera zależna od skali diagramu

**File**: `src/components/garden/garden-layout-diagram.ts`, `src/components/garden/GardenLayoutView.tsx`, `src/components/garden/GardenPlanner.tsx` i testy widoku

**Intent**: Zmniejszyć liczbę elementów renderowanych w widoku ogólnym, nie zmieniając danych ani położeń roślin. Po powiększeniu pojedyncze markery i szczegóły wracają bez utraty roślin.

**Contract**: Agregacja zależy od skali/zoomu i nie modyfikuje zapisanych współrzędnych. Każdy agregat zapewnia liczbę oraz informację o reprezentowanych uprawach; przy powiększeniu wszystkie markery są dostępne indywidualnie. Podsumowanie zachowuje dokładne liczby. Lista szczegółów nie może tworzyć 10 000 ciężkich elementów DOM jednocześnie bez mechanizmu ograniczającego renderowanie.

#### 3. Test przepływu na desktopie i urządzeniu mobilnym

**File**: `tests/e2e/grouped-plan.spec.ts`, `tests/e2e/garden-flow.spec.ts`, `src/pages/api/garden-plan.test.ts`, `src/lib/garden-layout-view.test.ts`

**Intent**: Zamknąć zakres testem od wygenerowania przez zapis i reload po oglądanie planu z agregacją, zoomem i podsumowaniem.

**Contract**: Scenariusz deterministyczny używa prywatnego testowego ogrodu, nie danych użytkownika. Desktop i mobilny viewport potwierdzają, że widok zbiorczy jest czytelny, gest/sterowanie zoomem odsłania pozycje indywidualne, a dokładne liczby i braki zgadzają się z zapisanym wynikiem.

### Success Criteria:

#### Automated Verification:

- Test API + RPC round-trip zapisuje i odczytuje co najmniej 10 000 pozycji bez utraty współrzędnych, cropId, alokacji, braków i fingerprintu.
- Test projekcji dla dużego planu potwierdza agregację na małym zoomie, dostępność wszystkich markerów po powiększeniu i niezmienione dane źródłowe.
- E2E desktop/mobile generuje, zapisuje, przeładowuje dashboard i sprawdza podsumowanie, liczby, agregaty oraz rozwinięte markery.
- `npm run test:db`, `npm run test:unit`, `npm run test:e2e`, `npm run lint`, `npx astro check` i `npm run build` przechodzą.

#### Manual Verification:

- Na podglądzie wygenerować fixture obejmujący ≥10 000 roślin w kilku skrzyniach, odświeżyć dashboard i potwierdzić identyczne liczby oraz brak cichych pominięć.
- Na desktopie i telefonie obejrzeć diagram oddalony, powiększyć skrzynię do pojedynczych ikon, przesunąć widok i wrócić do agregatów; sprawdzić czytelność nazw i dokładnych podsumowań.

**Implementation Note**: Po automatycznej weryfikacji zatrzymać się na ręczny odbiór Fazy 3.

---

## Testing Strategy

### Unit Tests:

- Duży, ale wykonalny układ wieloskrzyniowy: ≥10 000 pozycji, deterministyczny wynik, bez obcięcia limitami siatki i wyszukiwania.
- Geometria i polityka: brak nakładania, zachowane odstępy w każdej orientacji, twarde negatywne relacje, jedna zwarta grupa na katalogowy wpis/przestrzeń oraz jawne różnice alokacji.
- Katalog: ≥100 ID; każde aktywne ID ma niepuste końcowe odstępy, źródło, jednostkę, etap i pewność; gatunkowy fallback jest oznaczony niską pewnością.
- Diagram: agregacja markerów bez modyfikacji danych, wszystkie pojedyncze pozycje dostępne przy powiększeniu, dokładne liczby niezależne od widoku.

### Integration Tests:

- API generuje duży plan, zapisuje go przez obecny RPC i odczytuje dashboardowym dekoderem bez rozbieżności.
- Zmiana wersji algorytmu zachowuje zapisany wynik i oznacza go jako nieaktualny do ponownego przeliczenia.
- Katalogowy wpis bez własnej miniatury nadal można wyszukać, wybrać, obliczyć i zobaczyć w diagramie/podsumowaniu.

### Manual Testing Steps:

1. Zmierzyć czas generowania ≥10 000 wykonalnych pozycji w środowisku zbliżonym do produkcyjnego; zanotować runtime i czas ≤10 s.
2. Potwierdzić jedną grupę na uprawę i skrzynię oraz prawidłowe braki dla przypadku ograniczonego geometrią lub twardym sąsiedztwem.
3. Wybrać Faworyta w skrzyni 120 × 80 cm i sprawdzić prawidłowe współrzędne w obu możliwych orientacjach.
4. Przejrzeć katalog i fallbacki rozstaw, a następnie wyszukać wpisy przy minimum 100 rekordach.
5. Zapisać, przeładować i obejrzeć duży plan na desktopie i telefonie — agregaty, indywidualne pozycje po zoomie oraz dokładne liczby.

## Performance Considerations

- Cel użytkownika to ≤10 sekund generowania dla ≥10 000 wykonalnych pozycji w całym ogrodzie. Pomiar w lokalnym dev serwerze nie zastępuje pomiaru na Workers/preview.
- Obecny przegląd kolizji porównuje kandydatów z wcześniej umieszczonymi pozycjami; należy ocenić jego skalowanie i wybrać strategię lokalizacji sąsiadów odpowiednią do rozmieszczenia, bez rozluźniania reguł geometrycznych.
- Nie mierzyliśmy dotąd kosztu pełnego JSON, limitu praktycznego payloadu bazy ani renderowania 10 000 markerów. Faza 3 ma sprawdzić cały cykl, a nie wnioskować o wydajności wyłącznie z braku jawnego limitu w schemacie.
- Agregacja jest prezentacyjna; dokładne pozycje pozostają dostępne i zapisane. Nie serializować jedynie agregatów zamiast rzeczywistych roślin.

## Migration Notes

- Badanie nie wykazało konieczności migracji SQL dla samej liczby pozycji: `garden_plans.plan` jest JSONB. Zmiana formatu wymaga osobnego uzasadnienia z testu round-trip, wstecznego dekodera oraz zachowania RLS.
- Zmiana znaczenia układu podnosi wersję algorytmu snapshotu. Zapisany stary plan pozostaje możliwy do odczytu, ale jest oznaczony jako wymagający przeliczenia.
- Nowe cropId są statycznym katalogiem aplikacji i nadal podlegają ścisłej walidacji. Nie konwertować ani nie usuwać po cichu istniejących wyborów.

## References

- Badanie repozytorium: `context/changes/expand-crop-capacity-and-catalog/research.md`
- Reguła grupowania: `context/archive/2026-10-11-group-crops-within-garden-beds/plan.md`
- Poprzedni kontrakt danych katalogu: `context/changes/garden-crop-catalog-and-layout/research.md`
- Wcześniejsze ograniczenia algorytmu: `context/changes/testing-algorithm-decisions/research.md`
- Cloudflare Workers platform limits: https://developers.cloudflare.com/workers/platform/limits/

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Skalowalny generator i obsługa orientacji

#### Automated

- [x] 1.1 Test generatora tworzy co najmniej 10 000 pozycji dla wykonalnego ogrodu z wieloma przestrzeniami i potwierdza determinizm oraz brak ograniczenia 256/2 000.
- [x] 1.2 Testy sprawdzają rozstawę, brak nakładania, twarde negatywne sąsiedztwo, pojedynczą zwartą grupę na wpis i przestrzeń oraz dokładne raportowanie niedoborów.
- [x] 1.3 Test Faworyta umieszcza poprawną pozycję w skrzyni 120 × 80 cm przez obróconą siatkę bez zmiany odstępu 50 × 100 cm.
- [x] 1.4 Test snapshotu oznacza poprzedni plan jako nieaktualny po zmianie wersji algorytmu.
- [x] 1.5 `npm run test:unit`, `npm run lint`, `npx astro check` i `npm run build` przechodzą.

#### Manual

- [x] 1.6 Na preview lub środowisku Workers zbliżonym do produkcyjnego wykonalny fixture z co najmniej 10 000 roślin kończy generowanie w ≤10 s; zapisany czas i konfiguracja są dołączone do odbioru.
- [x] 1.7 Ręcznie sprawdzić mały ogród i duży ogród: mały zachowuje dotychczasowe reguły, duży nie traci pozycji cicho i jasno pokazuje ewentualne braki.

### Phase 2: Katalog 100+ obliczalnych upraw

#### Automated

- [ ] 2.1 Walidator i test katalogu potwierdzają co najmniej 100 aktywnych, unikalnych wpisów oraz niezerowe, źródłowe `finalSpacing` dla każdego.
- [ ] 2.2 Testy potwierdzają osobne znaczenie końcowej obsady i `sowingDensity`, działanie aliasów przy większej liczbie wyników oraz czytelny fallback miniatury.
- [ ] 2.3 Test formularza i widoku znajduje/wyświetla wpisy z początku, środka i końca katalogu, także wpis z zerową obsadą w danym planie.
- [ ] 2.4 `npm run test:unit`, `npm run lint`, `npx astro check` i `npm run build` przechodzą.

#### Manual

- [ ] 2.5 Użytkownik przegląda rejestr źródeł, przykładowe wpisy z dokładnym źródłem oraz przykładowy fallback gatunkowy i potwierdza, że oznaczenie niskiej pewności jest zrozumiałe.
- [ ] 2.6 W UI wyszukać dokładny alias oraz nazwy dające wiele dopasowań, wybrać wpis z fallbackiem i potwierdzić jego rozstawę, marker, nazwę i pewność w podsumowaniu.

### Phase 3: Zapis i czytelny diagram dużego planu

#### Automated

- [ ] 3.1 Test API + RPC round-trip zapisuje i odczytuje co najmniej 10 000 pozycji bez utraty współrzędnych, cropId, alokacji, braków i fingerprintu.
- [ ] 3.2 Test projekcji dla dużego planu potwierdza agregację na małym zoomie, dostępność wszystkich markerów po powiększeniu i niezmienione dane źródłowe.
- [ ] 3.3 E2E desktop/mobile generuje, zapisuje, przeładowuje dashboard i sprawdza podsumowanie, liczby, agregaty oraz rozwinięte markery.
- [ ] 3.4 `npm run test:db`, `npm run test:unit`, `npm run test:e2e`, `npm run lint`, `npx astro check` i `npm run build` przechodzą.

#### Manual

- [ ] 3.5 Na podglądzie wygenerować fixture obejmujący ≥10 000 roślin w kilku skrzyniach, odświeżyć dashboard i potwierdzić identyczne liczby oraz brak cichych pominięć.
- [ ] 3.6 Na desktopie i telefonie obejrzeć diagram oddalony, powiększyć skrzynię do pojedynczych ikon, przesunąć widok i wrócić do agregatów; sprawdzić czytelność nazw i dokładnych podsumowań.
