# Większa obsada ogrodu i rozszerzony katalog upraw — Implementation Plan

## Overview

Umożliwić wygenerowanie i zapisanie planu z co najmniej 10 000 fizycznych pozycji roślin w całym ogrodzie oraz utrzymać czytelność dużego diagramu. Rozszerzyć katalog o jak najwięcej odrębnych, obliczalnych i wyszukiwalnych typów uprawianych lub polecanych do polskich ogródków, bez sztywnego progu liczby. Dla każdej pozycji zachować źródło końcowej obsady i oddzielić jakość dowodów doboru od pewności rozstawy; nie udawać rankingu krajowego, którego źródła nie potwierdzają.

## Current State Analysis

Generator w `src/lib/garden-layout.ts` buduje najwyżej 256 punktów siatki dla każdej uprawy w każdej przestrzeni oraz sprawdza najwyżej 2 000 kandydatów w przebiegu. Działa w dwóch przebiegach: najpierw ustala alokację per uprawa/przestrzeń, a następnie próbuje rozmieścić tę alokację jako zwartą grupę. To są techniczne limity wyszukiwania, nie zaakceptowany maksymalny rozmiar produktu. Przy każdym sprawdzeniu generator przegląda już umieszczone pozycje w poszukiwaniu nakładania, co może rosnąć kosztownie wraz z liczbą roślin.

API `src/pages/api/garden-plan.ts` przekazuje wynik jako cały obiekt do RPC zapisującego plan w JSONB. Dashboard odczytuje i waliduje zapisany obiekt przez `readGardenLayoutResult`. Diagram mapuje pozycje na markery pojedynczo, a widok renderuje je jako elementy SVG. Testy generatora wprost utrwalają przykład 256/1000.

Katalog w `src/data/crop-catalog.ts` egzekwuje dokładnie 31 rekordów; 28 mają `finalSpacing`, a pozostałe mogą mieć brak danych. Nazwy i aliasy można wyszukiwać, lecz formularz pokazuje do 8 wyników, a manifest miniatur ma stałe 31 identyfikatorów. `pomidor`/Faworyt jest wpisem katalogowym z odstępem 50 × 100 cm; generator nie sprawdza obróconej siatki.

Generator nie odrzuca poprawnej rozstawy z powodu samego `confidence: low`; `getUsableSpacing` wymaga zweryfikowanych osi i dodatnich wartości (`src/lib/garden-layout.ts:428-437`). Wybrane rośliny mogą jednak nie uzyskać stanowiska przy braku `finalSpacing`, niezweryfikowanych osiach, braku miejsca albo limicie wyszukiwania, a te przyczyny wymagają odrębnego raportowania. Obecne badania rzeczywistych upraw są lokalne i małe: PZD opisuje często uprawiane warzywa w jednym poznańskim ROD, a badanie z Gorzowa objęło 31 działek; dostępne źródła nie tworzą rankingu krajowego 100 warzyw.

Użytkownik zatwierdził: limit 10 000 dotyczy całego ogrodu i generowanie ma trwać do 10 sekund; katalog ma zawierać jak najwięcej różnych, praktycznie odrębnych upraw wybieralnych w polskim warzywniku, bez obowiązkowego minimum 100. Odmiany nie zwiększają liczby typów. Wpisy nie mogą powielać tej samej uprawy pod synonimiczną lub kosmetycznie zmienioną nazwą; odrębny cel użytkowy/uprawowy, np. fasola na suche nasiona i fasola szparagowa, może być osobnym typem. Dotychczasowe typy pozostają. Uprawy bez własnych danych mogą użyć źródłowego rozstawu gatunkowego jawnie oznaczonego niską pewnością; dla Faworyta należy sprawdzać obie orientacje odstępu; diagram grupuje markery przy oddaleniu i pokazuje pojedyncze pozycje po powiększeniu. Wcześniej zatwierdzono również grupowanie jednego wpisu katalogowego w jednej skrzyni, jawny raport braków i pierwszeństwo grupy nad miękkimi korzyściami sąsiedztwa. Lista ma być kuratorowana jako uprawiana lub polecana, bez rankingu; nie wolno zgadywać rozstawy, a kandydat bez wiarygodnych danych końcowej obsady wymaga źródła albo zastąpienia.

## Desired End State

Generator tworzy co najmniej 10 000 pozycji dla wykonalnego, wieloskrzyniowego przypadku testowego w czasie nieprzekraczającym 10 sekund w środowisku zbliżonym do produkcyjnego. Nie ucina siatki na 256 ani nie kończy planu wyłącznie z powodu obecnego budżetu 2 000; gdy fizyczne ograniczenia lub jawny budżet bezpieczeństwa uniemożliwią osiągnięcie celu, wynik zachowuje najlepsze grupy, dokładnie raportuje braki i nie przedstawia planu jako pełnego.

Katalog obejmuje maksymalny uzasadniony źródłami zbiór stabilnych i wyszukiwalnych, odrębnych typów roślin jadalnych faktycznie uprawianych lub polecanych do polskich ogródków; nie ma arbitralnego minimum liczby. Rejestr dokumentuje zakres sprawdzonych źródeł i powody odrzucenia kandydatów bez wiarygodnej końcowej rozstawy, tak aby „jak najwięcej” oznaczało maksimum w granicach dowodów, nie zgadywanie. Każdy typ ma jedno kanoniczne ID; synonimy są aliasami, a duplikaty, odmiany tego samego typu i kosmetyczne warianty nazwy nie zwiększają liczby odrębnych typów. Odrębne cele użytkowe/ogrodnicze, takie jak fasola szparagowa i na suche nasiona, mogą być osobnymi typami, gdy wpływają na planowanie i mają uzasadnienie źródłowe. Dotychczasowe typy pozostają. Każdy aktywny wpis ma źródłowe `finalSpacing` z jednostką, etapem, kontekstem i poziomem pewności; dane odmianowe mogą jawnie korzystać z fallbacku gatunkowego o niskiej pewności. Niska pewność nie blokuje obliczeń, lecz brak wiarygodnej końcowej rozstawy nie jest zastępowany zmyśloną wartością: taki kandydat trzeba uzupełnić na podstawie źródła albo zastąpić przed aktywacją. Każdy wybrany wpis jest uwzględniony w obliczeniu i podsumowaniu, a zero pozycji ma jawną przyczynę, np. geometrię skrzyni lub brak danych.

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
- `src/lib/garden-layout.ts:428-437,868-899,1105-1123` — niska pewność nie odrzuca rozstawy; brak danych, brak miejsca i limit wyszukiwania mają osobne przyczyny.
- PZD opisuje częste nasadzenia w jednym ROD Stokrotka, a badanie Agronomy objęło 31 działek w Gorzowie; są to sygnały lokalne, nie krajowa próba.
- CDR tabela 5_2 podaje rozstawę uprawianych z rozsady, natomiast tabela 5_1 wymaga interpretacji, czy liczby dla siewu oznaczają obsadę po przerzedzeniu.

## What We're NOT Doing

- Nie liczymy liczby nasion na tacki, kiełkowania ani zapasu nasion; wynik jest liczbą końcowych jednostek sadzenia w skrzyniach.
- Nie prognozujemy plonu ani nie rozszerzamy relacji sąsiedztwa poza istniejący, źródłowy zestaw.
- Nie pozwalamy na ręczne przypisywanie lub przesuwanie roślin i nie osłabiamy wymaganych odstępów ani twardych negatywnych sąsiadów.
- Nie przedstawiamy katalogu jako dokładnego krajowego rankingu; lista ma jawne poziomy dowodów uprawy/rekomendacji.
- Nie wpisujemy wartości rozstawy bez źródła końcowej obsady ani nie używamy danych siewu, plonu, konsumpcji lub wielkości produkcji jako zamiennika końcowej rozstawy lub dowodu popularności w ogródkach.
- Nie projektujemy 100 odrębnych ilustracji; brak dedykowanej miniatury nie może blokować wyszukania, obliczenia ani pokazania uprawy.
- Nie wymagamy 10 000 roślin w pojedynczej skrzyni; zatwierdzony próg dotyczy całego ogrodu.
- Nie archiwizujemy historii sezonów ani nie zmieniamy granicy prywatności danych działki.

## Implementation Approach

Najpierw zastąpić obcinanie siatki i kosztowne wyszukiwanie strategią rozmieszczania zdolną policzyć wykonalne pozycje w całym ogrodzie, bez utraty determinizmu, odstępów, twardych zakazów i wcześniej uzgodnionych grup. Zmiana semantyki generatora unieważni aktualność poprzedniego planu przez wersję algorytmu, pozostawiając zapisany wynik widoczny jako nieaktualny do ponownego obliczenia.

Następnie opracować rejestr dowodów wyboru możliwie szerokiego zestawu unikalnych typów warzyw i innych roślin jadalnych faktycznie uprawianych lub polecanych do polskich ogródków, ze stopniem i rodzajem poparcia przy każdej pozycji. Osobno uzupełnić źródłowy rejestr końcowej rozstawy. Niska pewność nie blokuje obliczeń, jeśli istnieje źródłowa wartość końcowej obsady; wpis bez wiarygodnej rozstawy zastąpić przed udostępnieniem. Rozszerzyć wyszukiwanie i prezentację tak, aby każdy wybieralny wpis można było odnaleźć, policzyć i zrozumieć również wtedy, gdy skrzynia daje zero pozycji.

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

## Phase 2: Rozszerzony, unikalny katalog upraw

### Overview

Rozszerzyć aktywny, wyszukiwalny katalog o maksymalną liczbę odrębnych typów upraw, dla których można udokumentować przydatność do polskich ogródków i końcową rozstawę. Nie obowiązuje sztywny próg liczby; odmiany, synonimy i duplikaty nie zwiększają liczby typów, a dotychczasowe typy pozostają. Udokumentować rodzaj dowodów dla każdego typu i osobno źródła końcowej rozstawy. Niska pewność źródłowej rozstawy nie blokuje obliczeń; brak wiarygodnych danych końcowej obsady wymaga źródła lub zastąpienia wpisu.

### Changes Required:

#### 1. Ewidencja kandydatów i dowodów uprawy

**File**: `context/changes/expand-crop-capacity-and-catalog/catalog-evidence.md`

**Intent**: Wybrać możliwie szeroki zestaw różnych, praktycznych typów upraw do polskiego warzywnika na podstawie źródeł opisujących faktyczne nasadzenia lub zalecenia skierowane do ogrodników amatorów. Nie ustalać arbitralnego minimum liczby. Synonimy, duplikaty i odmiany tego samego typu nie zwiększają liczby. Zapisać rodzaj oraz siłę dowodów i nie przedstawiać listy jako krajowego rankingu częstości.

**Contract**: Ewidencja rozróżnia bezpośrednią obserwację/uprawę w ROD lub ogrodzie, zalecenie PZD/ODR dla amatorów oraz sygnał kontekstowy. Każdy typ uprawy ma jedno kanoniczne ID; synonimy trafiają do aliasów, a ten sam typ nie może wystąpić drugi raz pod inną nazwą. Osobne ID wymagają odrębnego celu użytkowego/uprawowego lub istotnie odrębnego sposobu planowania, np. fasola szparagowa i fasola na suche nasiona; odmiany nie podnoszą liczby typów. Konsumpcja, produkcja towarowa, rejestr odmian i dostępność handlowa nie są samodzielnym dowodem faktycznej częstości sadzenia. Przy każdym kandydacie widnieje źródło i uzasadnienie włączenia lub odrzucenia.

#### 2. Źródłowe dane końcowej obsady

**File**: `context/changes/expand-crop-capacity-and-catalog/catalog-evidence.md`, `src/data/crop-catalog.ts`

**Intent**: Utrwalić pochodzenie każdej wartości końcowego odstępu, etap sadzenia/przerwania, jednostkę (roślina lub kępa), kontekst odmiany oraz pewność, oddzielnie od dowodów popularności.

**Contract**: Każdy aktywny ID ma niepuste `finalSpacing` z ważnym `sourceIds`. Gdy dane odmianowe są niedostępne, można użyć źródłowego odstępu gatunkowego z jawnym fallbackiem niskiej pewności. Jeśli źródła nie opisują końcowej obsady albo nie rozstrzygają, czy podany odstęp dotyczy siewu czy roślin po przerzedzeniu, nie zgadywać: kandydata uzupełnić źródłem albo zastąpić przed aktywacją. Dane siewne nie zastępują końcowej obsady. Odmiany mogą mieć własne ID, ale nie zwiększają liczby typów; zachować stabilne dotychczasowe ID, zwłaszcza `pomidor`.

#### 3. Inwarianty i kontrakty testowe katalogu

**File**: `src/data/crop-catalog.ts`, `src/data/crop-catalog.test.ts`, `src/lib/crop-catalog.test.ts`

**Intent**: Usunąć dokładne założenie 31 wpisów i zabezpieczyć unikalność, kompletność źródeł oraz możliwość obliczania każdego aktywnego wpisu.

**Contract**: Walidator i testy wymagają unikalnych kanonicznych ID, braku zduplikowanych typów lub aliasów kolidujących z innym wpisem, niepustej źródłowej końcowej rozstawy dla każdego ID, poprawnej jednostki/etapu/pewności i braku nieznanych `sourceIds`. Testy chronią dotychczasowe ID i reprezentatywne typy oraz zgodność ewidencji z aktywnym katalogiem; nie ustanawiają arbitralnego minimum liczby.

#### 4. Wyszukiwanie, raportowanie obsady i reprezentacja wpisów bez miniatury

**File**: `src/components/garden/CropSelectionForm.tsx`, `src/components/garden/crop-thumbnail-manifest.ts`, `src/components/garden/GardenLayoutView.tsx` oraz ich testy

**Intent**: Pozwolić odkryć każdy wpis w większym katalogu i wyświetlić wybraną uprawę w diagramie oraz podsumowaniu bez wymogu tworzenia ilustracji dla każdej pozycji. Niska pewność nie blokuje obliczeń i pozostaje widoczna; zero pozycji ma wskazywać przyczynę.

**Contract**: Limit 8 widocznych wyników nie może ukryć dopasowania dokładnej nazwy/aliasu ani uniemożliwiać odkrycia katalogu. Każdy aktywny cropId mapuje się do znacznika i tekstowej nazwy; brak dedykowanej miniatury używa jawnego fallbacku. Wybrany wpis pozostaje w podsumowaniu przy `actualCount === 0`, a komunikat odróżnia brak/niezweryfikowanie rozstawy od geometrii skrzyni i wyczerpania budżetu wyszukiwania.

#### 5. Zgodność dokumentacji produktu

**File**: `context/foundation/prd.md`

**Intent**: Zaktualizować dotychczasowe twierdzenie o katalogu 31 aktywnych pozycji i ograniczonym katalogu tak, aby PRD opisywał szeroki, unikalny katalog obliczalnych typów i końcową obsadę.

**Contract**: Nie zmieniać pozostałych wymagań PRD; zapisać próg ≥10 000 pozycji w całym ogrodzie i pomiar ≤10 s, a także maksymalny uzasadniony źródłami zbiór unikalnych i obliczalnych wpisów dobranych jako uprawiane/polecane do ogródków, z ewidencją siły dowodów — bez obietnicy krajowego rankingu ani liczby nasion do wysiewu.

### Success Criteria:

#### Automated Verification:

- Walidator i test katalogu potwierdzają brak powtórzonych typów/aliasów oraz niezerowe, źródłowe `finalSpacing` dla każdego aktywnego typu; odmiany nie są liczone jako nowe typy.
- Testy potwierdzają osobne znaczenie końcowej obsady i `sowingDensity`, działanie aliasów przy większej liczbie wyników oraz czytelny fallback miniatury.
- Test formularza i widoku znajduje/wyświetla wpisy z początku, środka i końca katalogu, także wpis z zerową obsadą w danym planie.
- `npm run test:unit`, `npm run lint`, `npx astro check` i `npm run build` przechodzą.
- Ewidencja źródeł dokumentuje wszystkie aktywne typy, zakres sprawdzonych kandydatów, powody wykluczeń i rodzaj/siłę dowodów uprawy lub zaleceń; każdy sprawdzony kandydat spełniający kryteria zostaje ujęty, a nieprzyjęty ma odnotowany powód. Lista nie otrzymuje rangi krajowego rankingu.
- Testy potwierdzają, że poprawna rozstawa niskiej pewności nie blokuje umieszczenia i zachowuje oznaczenie w wyniku; przypadki braku rozstawy, geometrii bez miejsca oraz `search_limit` mają odrębne wyniki.

#### Manual Verification:

- Użytkownik przegląda rejestr źródeł, przykładowe wpisy z dokładnym źródłem oraz przykładowy fallback gatunkowy i potwierdza, że oznaczenie niskiej pewności jest zrozumiałe.
- W UI wyszukać dokładny alias oraz nazwy dające wiele dopasowań, wybrać wpis z fallbackiem i potwierdzić jego rozstawę, marker, nazwę i pewność w podsumowaniu.
- Użytkownik przegląda liczbę unikalnych typów uzyskaną w zakresie przejrzanych źródeł, poziomy dowodów i jawne wykluczenia duplikatów, w tym bezpośrednie obserwacje ROD i zalecenia PZD/ODR; potwierdza zakres katalogu i opis bez obietnicy rankingu.
- Użytkownik sprawdza pozycję z dokładną rozstawą oraz fallbackiem gatunkowym; niska pewność jest zrozumiała, a źródła nie mylą rozstawy siewu z końcową obsadą.
- W UI wyszukuje dokładny alias i szerokie zapytanie, wybiera wpis z fallbackiem oraz sprawdza rozstawę, marker, nazwę i pewność; sprawdza również jawny powód, gdy geometria skrzyni nie pozwala na żadną pozycję.

**Implementation Note**: Po automatycznej weryfikacji zatrzymać się na ręczną akceptację listy, ewidencji dowodów i przykładowych rozstaw przed rozpoczęciem Fazy 3.

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

**Intent**: Zamknąć typowy przepływ przeglądarkowy na zaakceptowanej skali około 2 000 pozycji: generowanie, zapis, reload i oglądanie planu z agregacją, zoomem i podsumowaniem. Skalę 10 000+ sprawdzać w testach generatora, API i JSONB, bez obciążania przeglądarkowego E2E przypadkiem brzegowym.

**Contract**: Scenariusz deterministyczny używa prywatnego testowego ogrodu, nie danych użytkownika. Desktop i mobilny viewport potwierdzają na skali około 2 000 pozycji, że widok zbiorczy jest czytelny, sterowanie zoomem odsłania pozycje indywidualne, a dokładne pozycje, liczby i fingerprint zgadzają się z zapisanym wynikiem. Dokładną serializację 10 000+ pozycji, współrzędnych i alokacji sprawdzają testy API/JSONB.

### Success Criteria:

#### Automated Verification:

- Test API + RPC round-trip zapisuje i odczytuje co najmniej 10 000 pozycji bez utraty współrzędnych, cropId, alokacji, braków i fingerprintu.
- Test projekcji dla dużego planu potwierdza agregację na małym zoomie, dostępność wszystkich markerów po powiększeniu i niezmienione dane źródłowe.
- E2E desktop/mobile generuje, zapisuje i przeładowuje plan około 2 000 pozycji, porównując dokładne współrzędne z widokiem, liczby, fingerprint, agregaty i pojedyncze markery.
- `npm run test:db`, `npm run test:unit`, `npm run test:e2e`, `npm run lint`, `npx astro check` i `npm run build` przechodzą.

#### Manual Verification:

- Na podglądzie sprawdzić przeglądarkowy przepływ przy praktycznej skali około 2 000 pozycji; dokładne przejście 10 000+ pozycji przez API/JSONB zabezpieczają testy automatyczne.
- Na desktopie i telefonie obejrzeć diagram oddalony, powiększyć skrzynię do pojedynczych ikon, przesunąć widok i wrócić do agregatów; sprawdzić czytelność nazw i dokładnych podsumowań.

**Implementation Note**: Po automatycznej weryfikacji zatrzymać się na ręczny odbiór Fazy 3.

---

## Testing Strategy

### Unit Tests:

- Duży, ale wykonalny układ wieloskrzyniowy: ≥10 000 pozycji, deterministyczny wynik, bez obcięcia limitami siatki i wyszukiwania.
- Geometria i polityka: brak nakładania, zachowane odstępy w każdej orientacji, twarde negatywne relacje, jedna zwarta grupa na katalogowy wpis/przestrzeń oraz jawne różnice alokacji.
- Katalog: maksymalny źródłowo uzasadniony zbiór unikalnych ID z ewidencją dowodów uprawy lub zaleceń dla polskich ogrodów; każde aktywne ID ma końcowy odstęp, źródło, jednostkę, etap i pewność; synonimy są aliasami, a gatunkowy fallback jest jawny i niskiej pewności.
- Niska pewność nie blokuje prawidłowej rozstawy; braki rozstawy, dopasowania geometrycznego i budżetu wyszukiwania pozostają odróżnialne.
- Diagram: agregacja markerów bez modyfikacji danych, wszystkie pojedyncze pozycje dostępne przy powiększeniu, dokładne liczby niezależne od widoku.

### Integration Tests:

- API generuje duży plan, zapisuje go przez obecny RPC i odczytuje dashboardowym dekoderem bez rozbieżności.
- Zmiana wersji algorytmu zachowuje zapisany wynik i oznacza go jako nieaktualny do ponownego przeliczenia.
- Katalogowy wpis bez własnej miniatury nadal można wyszukać, wybrać, obliczyć i zobaczyć w diagramie/podsumowaniu.

### Manual Testing Steps:

1. Zmierzyć czas generowania ≥10 000 wykonalnych pozycji w środowisku zbliżonym do produkcyjnego; zanotować runtime i czas ≤10 s.
2. Potwierdzić jedną grupę na uprawę i skrzynię oraz prawidłowe braki dla przypadku ograniczonego geometrią lub twardym sąsiedztwem.
3. Wybrać Faworyta w skrzyni 120 × 80 cm i sprawdzić prawidłowe współrzędne w obu możliwych orientacjach.
4. Przejrzeć katalog, deduplikację i fallbacki rozstaw, a następnie wyszukać typy z różnych grup katalogu.
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
- Rama problemu: `context/changes/expand-crop-capacity-and-catalog/frame.md`
- CDR, normatywy upraw z rozsady: https://poznan.cdr.gov.pl/normatywy/public/pdf/5_2.pdf
- CDR, normatywy upraw z siewu: https://poznan.cdr.gov.pl/normatywy/public/pdf/5_1.pdf
- PZD, obserwacja upraw w ROD Stokrotka: https://pzd.pl/artykuly/24266/61/Warzywa-na-dzialce-coraz-popularniejsze--z-wizyta-w-ROD-Stokrotka-w-Poznaniu.html
- Badanie działek w Gorzowie: https://doi.org/10.3390/agronomy11091836
- Badanie polskich ogrodów działkowych: https://journals.sagepub.com/doi/10.2993/0278-0771-38.1.123
- Reguła grupowania: `context/archive/2026-10-11-group-crops-within-garden-beds/plan.md`
- Poprzedni kontrakt danych katalogu: `context/changes/garden-crop-catalog-and-layout/research.md`
- Wcześniejsze ograniczenia algorytmu: `context/changes/testing-algorithm-decisions/research.md`
- Cloudflare Workers platform limits: https://developers.cloudflare.com/workers/platform/limits/

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Skalowalny generator i obsługa orientacji

#### Automated

- [x] 1.1 Test generatora tworzy co najmniej 10 000 pozycji dla wykonalnego ogrodu z wieloma przestrzeniami i potwierdza determinizm oraz brak ograniczenia 256/2 000. — 1a4c0b2
- [x] 1.2 Testy sprawdzają rozstawę, brak nakładania, twarde negatywne sąsiedztwo, pojedynczą zwartą grupę na wpis i przestrzeń oraz dokładne raportowanie niedoborów. — 1a4c0b2
- [x] 1.3 Test Faworyta umieszcza poprawną pozycję w skrzyni 120 × 80 cm przez obróconą siatkę bez zmiany odstępu 50 × 100 cm. — 1a4c0b2
- [x] 1.4 Test snapshotu oznacza poprzedni plan jako nieaktualny po zmianie wersji algorytmu. — 1a4c0b2
- [x] 1.5 `npm run test:unit`, `npm run lint`, `npx astro check` i `npm run build` przechodzą. — 1a4c0b2

#### Manual

- [x] 1.6 Na preview lub środowisku Workers zbliżonym do produkcyjnego wykonalny fixture z co najmniej 10 000 roślin kończy generowanie w ≤10 s; zapisany czas i konfiguracja są dołączone do odbioru. — 1a4c0b2
- [x] 1.7 Ręcznie sprawdzić mały ogród i duży ogród: mały zachowuje dotychczasowe reguły, duży nie traci pozycji cicho i jasno pokazuje ewentualne braki. — 1a4c0b2

### Phase 2: Rozszerzony, unikalny katalog upraw

#### Automated

- [x] 2.1 Walidator i test katalogu potwierdzają brak powtórzonych typów/aliasów oraz niezerowe, źródłowe `finalSpacing` dla każdego aktywnego typu; odmiany nie są liczone jako nowe typy. — 072cc4c
- [x] 2.2 Testy potwierdzają osobne znaczenie końcowej obsady i `sowingDensity`, działanie aliasów przy większej liczbie wyników oraz czytelny fallback miniatury. — 072cc4c
- [x] 2.3 Test formularza i widoku znajduje/wyświetla typy upraw z początku, środka i końca katalogu, także wpis z zerową obsadą w danym planie. — 072cc4c
- [x] 2.4 `npm run test:unit`, `npm run lint`, `npx astro check` i `npm run build` przechodzą dla poprawionej listy typów. — 072cc4c
- [x] 2.7 Ewidencja źródeł dokumentuje wszystkie aktywne typy, zakres sprawdzonych kandydatów, powody wykluczeń i rodzaj/siłę dowodów uprawy lub zaleceń; każdy sprawdzony kandydat spełniający kryteria jest ujęty, a nieprzyjęty ma odnotowany powód. — 072cc4c
- [x] 2.8 Testy potwierdzają, że poprawna rozstawa niskiej pewności nie blokuje umieszczenia; brak rozstawy, brak miejsca geometrycznego i `search_limit` mają odrębne wyniki. — 072cc4c

#### Manual

- [x] 2.5 Użytkownik przegląda rejestr źródeł, przykładowe wpisy z dokładnym źródłem oraz przykładowy fallback gatunkowy i potwierdza, że oznaczenie niskiej pewności jest zrozumiałe. — 072cc4c
- [x] 2.6 W UI wyszukać dokładny alias oraz nazwy dające wiele dopasowań, wybrać wpis z fallbackiem i potwierdzić jego rozstawę, marker, nazwę i pewność w podsumowaniu. — 072cc4c
- [x] 2.9 Użytkownik przegląda kuratorowaną listę unikalnych typów upraw, poziomy dowodów i wykluczenia duplikatów, w tym bezpośrednie obserwacje ROD i zalecenia PZD/ODR, i potwierdza opis bez obietnicy rankingu. — 072cc4c
- [x] 2.10 Użytkownik sprawdza wpis z dokładną rozstawą oraz fallbackiem gatunkowym; niska pewność jest zrozumiała, a źródła nie mylą siewu z końcową obsadą. — 072cc4c
- [x] 2.11 W UI wyszukuje dokładny alias i szerokie zapytanie, wybiera wpis z fallbackiem oraz sprawdza rozstawę, marker, nazwę i pewność; sprawdza jawny powód zera przy braku miejsca w skrzyni. — 072cc4c

### Phase 3: Zapis i czytelny diagram dużego planu

#### Audit widoku diagramu (korekta zoomu i czytelności)

- `src/components/garden/GardenLayoutView.tsx`: komórka agregacji była liczona jako `32 / pixelsPerCm`, więc pozostawała tej samej wielkości na ekranie przy każdym zoomie; użytkownik nadal widział liczniki zamiast rozdzielających się roślin.
- `src/components/garden/GardenLayoutView.tsx`: agregat był zawsze rysowany jako duże koło z liczbą, przez co przy powiększeniu liczba zasłaniała gatunek.
- `src/components/garden/garden-layout-diagram.ts`: limit znacznika 5,5 cm i współczynnik 0,72 zmniejszały ikonę wraz z dużym obszarem skrzyni; rośliny były trudne do rozpoznania w skrzyniach 2 × 2 m i 3 × 1 m.
- `src/components/garden/GardenLayoutView.tsx`: osobny przycisk i modal wyrywały diagram z kontekstu przeglądania sektorów; sterowanie nie przypominało płótna do pracy z planem.

#### Automated

- [x] 3.1 Test API + RPC round-trip zapisuje i odczytuje co najmniej 10 000 pozycji bez utraty współrzędnych, cropId, alokacji, braków i fingerprintu.
- [x] 3.2 Test projekcji dla dużego planu potwierdza agregację na małym zoomie, dostępność wszystkich markerów po powiększeniu i niezmienione dane źródłowe.
- [x] 3.3 E2E desktop/mobile generuje, zapisuje, przeładowuje dashboard i sprawdza podsumowanie, liczby, agregaty oraz rozwinięte markery.
- [x] 3.4 `npm run test:db`, `npm run test:unit`, `npm run test:e2e`, `npm run lint`, `npx astro check` i `npm run build` przechodzą.

#### Manual

- [x] 3.5 Ręczny odbiór praktycznej skali: użytkownik potwierdza, że ogród z 2 000 roślin działa prawidłowo. Przepływ 10 000 pozycji pozostaje przypadkiem brzegowym zabezpieczanym testami automatycznymi, bez wymogu ręcznego używania tak dużego planu.
- [x] 3.6 Użytkownik potwierdza poprawne działanie sterowania i czytelność diagramu na desktopie oraz dotykowym Surface; akceptuje centrowanie skrzyń, symbole roślin, plakietki `+N`, szczegóły po kliknięciu, przybliżanie i przesuwanie.
