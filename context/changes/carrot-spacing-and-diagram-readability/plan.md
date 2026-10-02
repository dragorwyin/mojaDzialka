# Rozstaw późnej marchwi i czytelność diagramu — plan wdrożenia

## Overview

Zaktualizować końcową rozstawę ogólnego wpisu marchwi do zachowawczego profilu późnych odmian oraz poprawić diagram, aby czytelnie i bez zniekształceń pokazywał rzeczywiste pozycje w centymetrach. Obecne ID marchwi i zapisany wybór pozostają bez zmian; wcześniejsze plany zostaną oznaczone jako nieaktualne po zmianie wersji katalogu.

## Current State Analysis

- Aktywny katalog zawiera jeden wpis `marchew`. Jego końcowa rozstawa po przerywce wynosi 3–5 cm w rzędzie i 20–30 cm między rzędami; gęstość siewu 2–3 cm w rzędzie jest osobnym polem (`src/data/crop-catalog.ts:1419–1437`).
- Generator wybiera dolny kraniec każdej osi i tworzy pozycje w krokach rozstawy (`src/lib/garden-layout.ts:218–227,299–315`). Podane przez użytkownika środki 85,5 / 88,5 / 91,5 cm są więc zgodne z obecnym minimum 3 cm, a nie dowodem błędu geometrii.
- Diagram pozycjonuje stałe znaczniki 20 px na procentowych osiach. Ograniczenia wysokości plotu mogą zmienić jego proporcje, a brak siatki i miniaturek utrudnia odczyt (`src/components/garden/GardenLayoutView.tsx:97–124`).
- Test katalogu asercją obejmuje obecnie starą rozstawę 3–5 cm (`src/data/crop-catalog.test.ts:88–93`). Główne testy generatora często zastępują produkcyjne dane marchwi syntetyczną siatką przez `compactCrop()` (`src/lib/garden-layout.test.ts:12–27`).
- Snapshot zawiera wersje katalogu i algorytmu. Zmiana metadanych katalogu może oznaczyć poprzedni wynik jako nieaktualny przez podbicie wersji katalogu; wybór warzywa jest oddzielnie zapisany pod tekstowym ID `marchew` (`src/lib/garden-plan-snapshot.ts:1–5`; `src/lib/garden-crop-selection.ts:18–25`).
- Zatwierdzony follow-up S-04 już wymaga centymetrowego SVG, równej skali osi, subtelnej siatki co 10 cm, miniaturek wszystkich 31 upraw, czytelnego fallbacku oraz nieprzesuwania prawdziwych pozycji (`context/changes/garden-crop-catalog-and-layout/plan.md:167–188`).

## Desired End State

- Jeden aktywny wpis `marchew` ma po przerywce minimum 7 cm w rzędzie i roboczy zakres 7–8 cm oraz 20–30 cm między rzędami. Użytkownik zatwierdził minimum 7 cm; górny kraniec 8 cm zachowuje granicę późnego źródłowego zakresu 5–8 cm i powinien być zweryfikowany przy aktualizacji kontekstu katalogu. Siew pozostaje osobną informacją i nie wpływa na liczbę ani geometrię pozycji.
- Wybory zapisane pod ID `marchew` zachowują się bez migracji, a diagram utworzony na podstawie poprzedniej wersji katalogu jest widocznie oznaczony jako nieaktualny do czasu ponownego wygenerowania.
- Diagram zachowuje centymetrowe współrzędne i proporcje przestrzeni, pokazuje dyskretną siatkę co 10 cm i spójne miniatury roślin. Gęste symbole nie przesuwają środków roślin; nazwy, legenda i szczegóły pozycji pozostają dostępne także bez grafiki.
- Zmiana jest potwierdzona testem na produkcyjnym wpisie katalogu oraz ręcznym przeglądem desktop/mobile.

### Key Discoveries:

- Wartością sterującą układem jest `finalSpacing`, a nie gęstość siewu; końcowa rozstawa jest mapowana do pola zgodności `spacing` w `src/data/crop-catalog.ts:1690–1721`.
- Istniejący renderer używa współrzędnych pozycji, ale rysuje je jako stałe znaczniki i nie ma lokalnych miniaturek ani siatki (`src/components/garden/GardenLayoutView.tsx:97–124`).
- Zmiana samego katalogu powinna podbić `GARDEN_CROP_CATALOG_VERSION`; nie ma potrzeby zmiany schematu bazy ani ID uprawy (`src/lib/garden-plan-snapshot.ts:1–5`; `supabase/migrations/20260927120000_create_garden_crops.sql`).

## What We're NOT Doing

- Nie dzielimy marchwi na wczesną i późną ani nie zmieniamy ID `marchew`.
- Nie zmieniamy osobnych danych gęstości siewu ani terminów; nie używamy ich w geometrii diagramu.
- Nie zmieniamy algorytmu optymalizacji sąsiedztwa, jego punktacji ani relacji biologicznych.
- Nie modyfikujemy schematu bazy, zapisanych proporcji ani historycznych wyborów użytkownika.
- Nie używamy przesuwania współrzędnych, spłaszczania osi ani niepotwierdzonych relacji roślin jako sposobu na ukrycie kolizji wizualnych.

## Implementation Approach

Najpierw zmienić wyłącznie końcowe metadane marchwi, zachować istniejące ID oraz unieważnić stare wyniki wersją katalogu. Następnie przebudować warstwę prezentacji diagramu na centymetrowy układ SVG z jednakową skalą, lokalnymi miniaturami oraz tekstową i dostępną legendą. Geometria generatora pozostaje źródłem prawdy: renderer może zmniejszać lub wizualnie grupować symbole, ale nie zmienia zapisanych środków pozycji.

## Critical Implementation Details

### User experience spec

Miniatura jest symbolem identyfikującym stanowisko, a nie obrysem biologicznej korony rośliny ani miarą jej rozmiaru. Przy zwartych pozycjach czytelność wolno poprawić rozmiarem lub grupowaniem prezentacji oraz dostępnymi szczegółami; nie wolno zmieniać `xCm`/`yCm`. Utrzymać równą liczbę pikseli na centymetr w obu osiach na desktopie i telefonie.

### Performance constraints

Siatka centymetrowa ma być generowana jako lekka warstwa SVG, bez tworzenia elementu DOM dla każdego centymetra. Miniatury należy przechowywać lokalnie i zoptymalizować do małych rozmiarów; nie dodawać żądań do zewnętrznego serwisu podczas renderowania `/garden`.

## Faza 1: Końcowa rozstawa marchwi i zgodność zapisanych planów

### Overview

Ustawić zaakceptowany przez użytkownika zachowawczy profil późnej marchwi, pokryć go testami produkcyjnego katalogu i sprawić, by istniejące diagramy zostały poprawnie oznaczone jako nieaktualne.

### Changes Required:

#### 1. Metadane marchwi

**Files**: `src/data/crop-catalog.ts`, `src/data/crop-catalog.test.ts`

**Intent**: Dopasować jeden ogólny wpis marchwi do późniejszych odmian i zbioru większych korzeni, bez przedstawiania ustawienia jako uniwersalnej reguły dla wszystkich odmian.

**Contract**: Zmienić wyłącznie `finalSpacing.inRowCm` z 3–5 na roboczy zakres 7–8 cm; zachować `finalSpacing.betweenRowsCm` 20–30 cm, etap `after_thinning`, ID `marchew`, źródła i osobną wartość `sowingDensity`. Minimum 7 cm jest decyzją użytkownika; górny kraniec 8 cm wynika z późnego źródłowego zakresu 5–8 cm i ma zostać ponownie sprawdzony przy opisie/pewności danych. Kontekst katalogowy ma nazwać przyjęty profil późny i odróżniać rozstawę końcową od siewu. Test katalogu sprawdza te granice.

#### 2. Regresja geometrii generatora na danych katalogowych

**File**: `src/lib/garden-layout.test.ts`

**Intent**: Upewnić się, że produkcyjny wpis marchwi — bez syntetycznego nadpisania rozstawy — przekłada nowe minimum na odległości wygenerowanego układu.

**Contract**: Dodać przypadek z `crop("marchew")`, sprawdzający wartość rozstawy w wyniku i co najmniej 7 cm między pozycjami w tym samym rzędzie. Nie zmieniać ogólnej interpretacji dolnego krańca w `getUsableSpacing`; generator już stosuje katalogowe minimum.

#### 3. Wersjonowanie katalogu planu

**Files**: `src/lib/garden-plan-snapshot.ts`, `src/lib/garden-plan-snapshot.test.ts`

**Intent**: Zapewnić, że plan wygenerowany według dawnej rozstawy nie jest przedstawiany po wdrożeniu zmiany jako bieżący.

**Contract**: Podbić `GARDEN_CROP_CATALOG_VERSION` z 2 do 3. Nie zmieniać wersji algorytmu, schematu snapshotu ani bazy. Test ma potwierdzać, że fingerprint planu z poprzednią wersją katalogu daje status `stale`; ID i proporcje zapisanych wyborów pozostają takie same.

### Success Criteria:

#### Automated Verification:

- Test katalogu potwierdza roboczą rozstawę marchwi 7–8 × 20–30 cm po przerywce i niezmienioną, osobną gęstość siewu.
- Test generatora używa produkcyjnego wpisu `marchew` i potwierdza, że pozycje tego samego rzędu nie są odległe o mniej niż 7 cm.
- Test snapshotu potwierdza, że plan z poprzednią wersją katalogu staje się nieaktualny.

#### Manual Verification:

- Zapisany wybór `marchew` pozostaje widoczny bez zmiany udziału; poprzedni plan jest oznaczony jako nieaktualny, a ponowne generowanie tworzy układ z nową rozstawą.

**Implementation Note**: Po testach zatrzymać się na ręczne potwierdzenie, że wybór użytkownika nie zniknął, a stary plan nie jest mylony z nowym. Nie przechodzić dalej przed akceptacją tego sprawdzenia.

## Faza 2: Diagram w skali i miniatury upraw

### Overview

Zastąpić niezależne procentowe skalowanie osi diagramem w fizycznej skali centymetrów, dodać delikatną siatkę i lokalne ilustracje tak, aby wynik był czytelny bez zmiany geometrii.

### Changes Required:

#### 1. Renderer diagramu i legenda

**File**: `src/components/garden/GardenLayoutView.tsx`

**Intent**: Ułatwić odczyt rzeczywistych odległości, tożsamości upraw i lokalnego układu na różnych szerokościach ekranu.

**Contract**: Renderować przestrzeń w centymetrowym SVG z jednakową skalą obu osi i subtelnymi liniami co 10 cm. Środek każdego znacznika pochodzi bezpośrednio z `xCm`/`yCm`. Dla zwartego widoku zmniejszyć symbole albo grupować wyłącznie ich warstwę wizualną, zapewniając dostęp do nazw i danych każdej pozycji. Zachować tekstową legendę, współrzędne, status relacji i istniejące uzasadnienie umieszczenia; treści nie mogą zależeć tylko od koloru lub obrazka.

#### 2. Lokalne miniatury katalogu

**Files**: `public/crops/` oraz istniejący manifest/mapowanie używane przez renderer

**Intent**: Rozróżnić rośliny na diagramie małymi, spójnymi grafikami i nie uzależniać aplikacji od zewnętrznego hostingu obrazów.

**Contract**: Dostarczyć lokalną miniaturę dla każdego z 31 aktywnych ID katalogu. Każdy obraz ma mieć nazwę dostępną dla technologii asystujących lub być dekoracyjny przy równolegle widocznej nazwie tekstowej. Brak obrazu ma bezpiecznie wracać do czytelnego symbolu/oznaczenia; mapa miniatur nie może zmieniać ID ani pozycji upraw.

### Success Criteria:

#### Automated Verification:

- Test projekcji rendererowej potwierdza równe piksele na centymetr obu osi i niezmienione środki pozycji; test manifestu potwierdza pokrycie 31 aktywnych upraw oraz dostępny fallback tekstowy.

#### Manual Verification:

- Diagram na desktopie i telefonie zachowuje proporcje wymiarów, ma widoczną lecz dyskretną siatkę 10 cm, nie przycina brzegowych znaczników i pozwala rozpoznać uprawy oraz ich szczegóły bez przesuwania punktów.
- Grafiki są spójne i przypisane do właściwych nazw; tekstowa legenda i szczegóły pozycji pozostają zrozumiałe, gdy grafika jest niedostępna.

**Implementation Note**: Obejrzeć wynik na desktopie oraz szerokości mobilnej, ze szczególnym uwzględnieniem zwartej marchwi i minimalizacji kolizji symboli. Zatrzymać fazę do ręcznej akceptacji screenshotów.

## Faza 3: Weryfikacja przepływu i odbiór

### Overview

Sprawdzić współdziałanie nowej rozstawy, wersjonowania planu oraz diagramu w istniejącym przepływie zapisu, generowania i odświeżenia.

### Changes Required:

#### 1. Regresja przepływu i kontrole jakości

**Files**: `scripts/smoke.mjs`, odpowiednie testy katalogu, snapshotu i diagramu

**Intent**: Potwierdzić, że nowe dane przechodzą przez aplikację od zachowanego wyboru do prywatnego planu, a istniejące wymagane bramki repozytorium nadal przechodzą.

**Contract**: Rozszerzać smoke test tylko wtedy, gdy istniejący przepływ nie weryfikuje statusu nieaktualności i ponownego generowania. Nie dodawać nowego frameworka testowego ani zmieniać RLS/API bez ujawnionej potrzeby.

### Success Criteria:

#### Automated Verification:

- Przechodzą `npm run test:unit`, `npx astro check`, `npm run lint` i `npm run build`; `npm run smoke` przechodzi, gdy dostępne jest środowisko Supabase testowe.

#### Manual Verification:

- Na dwóch przestrzeniach 200 × 100 cm sprawdzić wybrany miks z marchwią, cebulą, brokułem i czosnkiem; zweryfikować utrzymane wybory, nieaktualny status starego wyniku, poprawioną rozstawę po przeliczeniu oraz czytelność nowych diagramów na desktopie i telefonie.
- Sprawdzić, że szczegóły pozycji nadal opisują wyłącznie zapisane lokalne sąsiedztwo i uzasadnienie; żadna grafika ani układ wizualny nie sugeruje niepotwierdzonej relacji.

**Implementation Note**: Po końcowych bramkach zatrzymać się na potwierdzenie użytkownika. Ta zmiana nie oznacza ukończenia całego S-04 ani pozostałych zadań z jego follow-upu.

## Testing Strategy

### Unit Tests:

- Katalog: marchew z zatwierdzonym minimum 7 cm w rzędzie, roboczym górnym krańcem 8 cm i 20–30 cm między rzędami po przerywce; dane siewu pozostają oddzielne i nie są zmieniane.
- Geometria: generator dostaje produkcyjne dane marchwi; pozycje w rzędzie respektują nowe minimum, a granice stanowisk i pozostałe uprawy nie regresują.
- Aktualność: zmiana wyłącznie wersji katalogu unieważnia stary fingerprint bez zmiany zapisanych ID i udziałów.
- Diagram: jednostajna skala centymetrów, zgodność środków renderowanych symboli ze współrzędnymi wejściowymi, siatka co 10 cm oraz pokrycie mapy lokalnych miniaturek i fallbacku.

### Integration Tests:

- Przepływ `/garden`: zachowany wybór marchwi → stary wynik oznaczony jako nieaktualny po zmianie fingerprintu → ponowne generowanie zapisuje nowy plan.
- Istniejący smoke test pozostaje zielony; jeśli rozszerzony, obejmuje wyłącznie brakujący fragment powyższego przepływu.

### Manual Testing Steps:

1. Otworzyć konto z zapisanym wyborem `marchew` i poprzednim planem; potwierdzić, że wybór oraz udział są zachowane, a plan ma status „Nieaktualny”.
2. Wygenerować ponownie plan dla dwóch przestrzeni 200 × 100 cm i miksu marchew/cebula/brokuł/czosnek 30/10/40/20; sprawdzić, że końcowe centra marchwi nie są bliżej niż 7 cm w rzędzie i że siew nie został użyty do geometrii.
3. Obejrzeć diagram desktop/mobile: skala X/Y jest jednakowa w cm, siatka 10 cm jest ledwo widoczna, znaczniki są nieucięte i czytelne, a punkty pozostały na rzeczywistych współrzędnych.
4. Sprawdzić miniatury, nazwy, tekstową legendę, dostęp do szczegółów przez technologie asystujące i fallback dla brakującego obrazka.

## Performance Considerations

Siatkę rysować jako powtarzalny wzór lub równoważną lekką warstwę SVG, nie jako jeden DOM node na każdy centymetr. Miniatury muszą być lokalne i małe; nie pobierać obrazów przy każdym renderze z zewnętrznego serwisu. Zachować istniejący budżet generatora — zmiana rozstawy w katalogu nie uzasadnia zwiększenia liczby kandydatów ani iteracji po centymetrach.

## Migration Notes

Nie ma migracji schematu Supabase ani przepisywania wierszy `garden_crops`. Zachować `crop_id = "marchew"`, aby zapisane wybory pozostały aktywne. Podbić wyłącznie `GARDEN_CROP_CATALOG_VERSION` do 3; istniejący diagram nadal pozostaje dostępny jako jawnie nieaktualny do czasu ręcznego wygenerowania nowego.

## References

- Frame: `context/changes/carrot-spacing-and-diagram-readability/frame.md`
- Zatwierdzony follow-up S-04: `context/changes/generate-garden-layout/plan-brief.md:39–49` oraz `context/changes/generate-garden-layout/plan.md:167–188`
- Research późnego zakresu i rozstawy końcowej: `context/changes/garden-crop-catalog-and-layout/research.md:100,193,303–318`
- Katalog i renderer: `src/data/crop-catalog.ts:1419–1437,1690–1721`; `src/components/garden/GardenLayoutView.tsx:97–124`
- Snapshot i wybory: `src/lib/garden-plan-snapshot.ts:1–5`; `src/lib/garden-crop-selection.ts:18–25`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `.agents/skills/10x-plan/references/progress-format.md`.

### Phase 1: Końcowa rozstawa marchwi i zgodność zapisanych planów

#### Automated

- [x] 1.1 Test katalogu potwierdza rozstawę końcową marchwi i osobną gęstość siewu. — d87e156
- [x] 1.2 Test generatora używa produkcyjnego wpisu marchwi i respektuje minimum 7 cm. — d87e156
- [x] 1.3 Test snapshotu oznacza plan ze starą wersją katalogu jako nieaktualny. — d87e156

#### Manual

- [x] 1.4 Wybór marchwi pozostaje zapisany, a dawny plan jest jawnie nieaktualny do ponownego wygenerowania. — d87e156

### Phase 2: Diagram w skali i miniatury upraw

#### Automated

- [x] 2.1 Testy diagramu potwierdzają równą skalę, zachowane współrzędne i komplet miniaturek z fallbackiem.

#### Manual

- [x] 2.2 Diagram desktop/mobile pokazuje delikatną siatkę i czytelne symbole bez przycinania ani przesuwania pozycji.
- [x] 2.3 Miniatury, legenda i szczegóły są zrozumiałe i dostępne także bez obrazków.

### Phase 3: Weryfikacja przepływu i odbiór

#### Automated

- [ ] 3.1 Testy jednostkowe, Astro check, lint, build i skonfigurowany smoke test przechodzą.

#### Manual

- [ ] 3.2 Końcowy przepływ zachowuje wybory, przelicza marchwie z nowym minimum i przechodzi kontrolę desktop/mobile.
- [ ] 3.3 Szczegóły pozycji nie sugerują niepotwierdzonego sąsiedztwa ani nie zmieniają algorytmu S-04.
