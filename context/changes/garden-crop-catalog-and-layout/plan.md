# Katalog upraw po przerywce i czytelny układ — Plan implementacji

## Overview

Uzupełnić zatwierdzony follow-up S-04: uaktualnić katalog do 31 pozycji, odseparować końcową obsadę od siewu i terminów, a układ roślin uczynić lokalnym, zwartym i zrozumiałym. Użytkownik zobaczy rzeczywistą geometrię po przerywce lub posadzeniu, informację o sąsiadach i przyczynie nietypowego położenia, bez utraty starych wyborów.

## Current State Analysis

- Katalog zawiera 30 pozycji; typ `CropCatalogEntry` ma jedno pole `spacing` z etapem i pewnością oraz osobne `seasonWindows`, ale nie ma odrębnej gęstości siewu. Wartości robocze są pobierane przez generator, który wybiera dolny kraniec użytecznej rozstawy ([`crop-catalog.ts:66–94, 377–388`](../../../src/data/crop-catalog.ts), [`garden-layout.ts:125–139`](../../../src/lib/garden-layout.ts)).
- Zatwierdzony zakres zmienia 30 pozycji na 31: usuwa fasolę szparagową i bób, rozdziela dotychczasowy `pomidor` na Faworyta i palikowany koktajlowy oraz dodaje koper i szczypiorek; pięć dodatkowych ziół pozostaje poza zakresem. Szczegółowe źródła i ograniczenia danych są w [researchu](research.md) oraz w [zatwierdzonym follow-upie S-04](../generate-garden-layout/plan.md#follow-up-s-04-końcowa-obsada-katalog-i-czytelny-diagram).
- Formularz pokazuje obecnie nazwę i udział uprawy; nie pokazuje osobno końcowej rozstawy, gęstości siewu ani terminów. Wybór jest zapisywany jako tekstowy `crop_id`. Serwer i klient odrzucają ID spoza bieżącego katalogu, więc pozostawione w bazie fasola/bób wymagają jawnej obsługi po wycofaniu ([`CropSelectionForm.tsx:97, 230–242`](../../../src/components/garden/CropSelectionForm.tsx), [`garden-crop-selection.ts:21`](../../../src/lib/garden-crop-selection.ts), [`garden-crops.ts:37`](../../../src/pages/api/garden-crops.ts)).
- Obecny `pomidor` ma zachować identyfikator i stać się Faworytem; koktajlowy otrzyma nowe ID. Snapshot planu ma wersję wejścia, ale nie wersję katalogu ani algorytmu. Stary zapis może więc wyglądać na aktualny po zmianie znaczenia katalogu, jeśli wspólna wersja snapshotu/fingerprintu nie zostanie podniesiona ([`garden.astro:97, 132`](../../../src/pages/garden.astro), [`garden-plan.ts:111–126`](../../../src/pages/api/garden-plan.ts)).
- Generator przegląda kandydatów deterministycznie i ocenia relacje wspierane, `caution` oraz cel udziału, ale nie ma osobnej nagrody za zwarte rozmieszczenie neutralnych upraw. Wynik nie przechowuje powodu wyboru pozycji ani listy lokalnych sąsiadów ([`garden-layout.ts:166–197, 202–250, 340–345`](../../../src/lib/garden-layout.ts)).
- Widok diagramu umieszcza stałe, 20-pikselowe znaczniki procentowo. `aspectRatio` wraz z limitami wysokości nie gwarantuje równej skali centymetrów w obu osiach; przy marchwi co 3 cm znaczniki mogą się nakładać. Widok dostaje mapę nazw, nie pełne rekordy katalogu ([`GardenLayoutView.tsx:90–122`](../../../src/components/garden/GardenLayoutView.tsx), [`garden.astro:135–137`](../../../src/pages/garden.astro)).
- Bieżące testy to testy katalogu i czystej logiki planera; `npm run test:unit`, `npm run build`, `npm run lint`, `npm run test:db` i `npm run smoke` są już dostępne. Nie znaleziono harnessu testów komponentowych.

### Key Discoveries:

- `garden_crops.crop_id` jest tekstem bez klucza obcego do katalogu, a walidacja planu opiera się na aktywnym katalogu. Nie trzeba usuwać danych z bazy; trzeba zachować wycofane wybory w UI i wymagać od użytkownika ich jawnego usunięcia lub zamiany przed zapisem/generowaniem ([migracja wyboru: linie 3, 91–112](../../../supabase/migrations/20260927120000_create_garden_crops.sql), [`garden-plan.ts:111`](../../../src/pages/api/garden-plan.ts)).
- Wybór `pomidor` można bez migracji mapować na Faworyta, utrzymując zgodność wcześniejszych wyborów; plany z poprzednią wersją katalogu lub silnika muszą być widoczne jako nieaktualne, a nie po cichu interpretowane na nowo.
- Brak rekordu relacji oznacza `unknown`, nie biologiczny zakaz ani korzyść. Para czosnek–brokuł nie ma potwierdzonej reguły w zebranym materiale, więc UI nie może opisywać jej jako negatywnej ani pozytywnej ([`crop-catalog.ts:1053–1134`](../../../src/data/crop-catalog.ts), [`crop-catalog.ts:58–67`](../../../src/lib/crop-catalog.ts), [research — sąsiedztwo](research.md#sąsiedztwo-i-przypadek-czosnku-przy-brokule)).
- W planie stanowisko odpowiada jednej końcowej jednostce obsady; zwykła roślina po przerywce to jedna jednostka, a jedna posadzona kępa szczypiorku również liczy się jako jedna. To nie jest prognoza masy plonu ani liczby pędów.

## Desired End State

Aktywny katalog zawiera dokładnie 31 uzgodnionych upraw i przechowuje oddzielnie końcową rozstawę, dane o siewie oraz okna terminów, wraz ze źródłem, kontekstem i pewnością. Diagram korzysta tylko z końcowej obsady; brak wiarygodnej rozstawy daje widoczny wynik częściowy, nigdy podstawienie gęstości siewu.

Silnik liczy sąsiedztwo wyłącznie w tej samej skrzyni/sektorze, według lokalnego progu jednego kroku końcowej rozstawy. Potwierdzone negatywne relacje są twardym ograniczeniem, pozytywne mają priorytet, `caution` pozostaje miękkim kosztem, a `unknown` jest neutralne. Gdy główne kryteria układu pozostają równoważne, kompaktowość przeciwdziała samotnym, niewyjaśnionym pozycjom. Wynik podaje faktycznych lokalnych sąsiadów i krótką przyczynę wybranej pozycji.

Diagram zachowuje proporcje centymetrów w obu osiach, ma dyskretną siatkę co 10 cm, miniatury, tekstową legendę i czytelne zachowanie przy tłoku, bez przesuwania prawdziwych pozycji. Stare `pomidor` nadal oznacza Faworyta; zapisane fasola/bób pozostają widoczne jako wycofane do czasu jawnego działania użytkownika, a zapisany plan ze starą wersją jest oznaczony jako nieaktualny.

## What We're NOT Doing

- Nie dodajemy fasoli, bobu ani pięciu nowych ziół; nie zmieniamy uzgodnionego zestawu 31 pozycji.
- Nie liczymy relacji fizycznych między osobnymi skrzyniami/sektorami i nie prosimy użytkownika o ręczny dobór miejsca.
- Nie usuwamy po cichu starych wyborów ani starych planów, nie tworzymy historii sezonów i nie zmieniamy polityk prywatności/RLS.
- Nie używamy rozstawy siewu do obsady diagramu, nie obiecujemy plonu i nie liczymy pojedynczych pędów w kępie szczypiorku.
- Nie przesuwamy znaczników poza rzeczywiste współrzędne, by zamaskować kolizję etykiet; prezentacja może adaptować rozmiar lub grupować gęste symbole, ale legenda/lista musi nadal ujawniać rośliny.
- Nie wprowadzamy nowego frameworka testów UI ani zewnętrznego solvera optymalizacyjnego.

## Implementation Approach

Zachować jeden typowany katalog jako źródło prawdy dla formularza i silnika. Najpierw dodać model 31 upraw i bezpieczną obsługę zapisów historycznych; potem zmienić czysty, deterministyczny generator tak, aby w jednym kontrakcie zwracał pozycje, sąsiadów i krótkie powody; na końcu połączyć pełne dane katalogu z komponentami `/garden` i narysować skalowany diagram SVG z lokalnymi miniaturami. Snapshot wejściowy/fingerprint będzie uwzględniał wersję katalogu i algorytmu, a starszy JSON wyniku nadal da się odczytać i oznaczyć jako nieaktualny.

## Critical Implementation Details

### Zgodność zapisów i snapshotów

Nie kasować rekordów fasoli/bobu ani nie zmieniać `crop_id` w bazie automatycznie. Wybory historyczne muszą pozostać widoczne z jasnym statusem „wycofana” i akcją usunięcia/zamiany; zapis oraz generowanie pozostają zablokowane do rozstrzygnięcia. Wspólny snapshot SSR/API ma włączać wersję katalogu i układu, by zmiana semantyki lub algorytmu unieważniała stary plan bez utraty jego treści.

### Prawdziwa geometria a widoczność

Rozstawy są podawane w centymetrach, a diagram musi utrzymać jednakową skalę osi X/Y; rozmiar kontenera lub etykiety nie może zmieniać pozycji roślin. Przy gęstym układzie wolno adaptować symbol lub zgrupować jego widok, ale nazwa/liczba roślin i dostęp do szczegółu pozostają czytelne, także bez miniatury.

## Phase 1: Katalog i zgodność zapisanych wyborów

### Overview

Zbudować końcowy kontrakt danych dla 31 pozycji i zachować istniejące wybory użytkowników mimo wycofania dwóch upraw. Ta faza nie zmienia jeszcze punktacji rozmieszczenia.

### Changes Required:

#### 1. Rozdzielony model końcowej obsady i informacji o uprawie

**File**: `src/data/crop-catalog.ts`, `src/data/crop-catalog.test.ts`, `src/lib/crop-catalog.ts`, `src/lib/crop-catalog.test.ts`

**Intent**: Zastąpić niejednoznaczne `spacing` oddzielnymi, typowanymi danymi o rozstawie końcowej po przerywce/sadzeniu, siewie i terminach, bez mieszania tych etapów w algorytmie.

**Contract**: Aktywny katalog zawiera dokładnie 31 uzgodnionych ID. `pomidor` pozostaje Faworytem, koktajlowy palikowany dostaje nowe ID, a fasola szparagowa i bób nie są aktywnymi rekordami ani celami relacji. Końcowa rozstawa zachowuje nazwane osie, zakres/jednostkę, etap, źródło i pewność; gęstość siewu oraz okna siewu/sadzenia są osobnymi polami. Brak potwierdzonej końcowej rozstawy pozostaje brakiem danych, nie fallbackiem do siewu. Jedna kępa szczypiorku to jedna jednostka obsady.

#### 2. Walidacja i zachowanie wycofanych wyborów

**File**: `src/components/garden/CropSelectionForm.tsx`, `src/lib/garden-crop-selection.ts`, `src/lib/garden-crop-selection.test.ts`, `src/pages/api/garden-crops.ts`

**Intent**: Pozwolić użytkownikowi rozpoznać i świadomie rozwiązać wcześniejszy wybór fasoli/bobu zamiast tracić dane albo blokować formularz niezrozumiałym błędem.

**Contract**: Formularz pokazuje rozpoznane stare ID jako wycofaną pozycję z akcją usunięcia/zamiany; nie oferuje ich ponownie w wyszukiwarce. Dopóki taki wybór pozostaje, UI wyjaśnia, że trzeba go rozwiązać przed zapisem lub generowaniem. Nieznane ID również nie są po cichu pomijane. Aktywne ID są nadal walidowane przez klienta i endpoint. Istniejący `pomidor` odczytuje się jako Faworyt bez zmiany wagi.

#### 3. Opisowanie kontraktu źródeł w katalogu

**File**: `context/changes/garden-crop-catalog-and-layout/research.md`, `context/foundation/prd.md`

**Intent**: Zachować pochodzenie wartości, ograniczenia i znaczenie końcowej obsady dla kolejnych implementacji oraz przeglądów.

**Contract**: Dla każdego aktywnego rekordu wskazać źródło, kontekst (np. po przerywce, dymka, rozsada) i poziom pewności. Dokumentacja odróżnia brak dowodu od neutralnej relacji i potwierdza, że procent liczy jednostki obsady na całej działce, nie powierzchnię ani plon. Nie przedstawia katalogu jako rankingu popularności.

### Success Criteria:

#### Automated Verification:

- Katalog ma dokładnie 31 aktywnych pozycji z uzgodnionymi ID; test nie dopuszcza odwołań relacji do usuniętej fasoli/bobu.
- Końcowa rozstawa, gęstość siewu i terminy są oddzielnymi informacjami; test potwierdza, że brak końcowej rozstawy nie jest uzupełniany wartością siewną.
- Walidacja aktywnych upraw pozostaje ścisła, a test logiki wyboru pokrywa rozpoznane legacy ID i wymóg ich jawnego rozwiązania.
- `npm run test:unit`, `npx astro check`, `npm run build` i `npm run lint` przechodzą.

#### Manual Verification:

- Istniejący wybór `pomidor` nadal widnieje jako Faworyt; zachowane wybory fasoli/bobu są oznaczone jako wycofane i nie znikają przed ręcznym usunięciem lub zamianą.

**Implementation Note**: Zatrzymać się po tej fazie na potwierdzenie zachowania wyborów i formularza przed zmianą semantyki generatora.

## Phase 2: Lokalny silnik, zwarte rozmieszczenie i wyjaśnienia

### Overview

Zmienić wynik generatora tak, aby lokalne relacje i zwarte rozmieszczenie były jawnie oceniane, a pozycję można było objaśnić na podstawie danych, które rzeczywiście znał algorytm.

### Changes Required:

#### 1. Kontrakt sąsiada, obsady i kompaktowości

**File**: `src/lib/garden-layout.ts`, `src/lib/garden-layout.test.ts`

**Intent**: Zastąpić obecny nieuzasadniony first-fit przewidywalnym wyborem pozycji, który respektuje końcową obsadę, bliskie relacje i wymóg zwartej grupy.

**Contract**: Jednostką procentu i wyniku jest końcowa jednostka obsady; szczypiorek liczy jedną kępę jako jedną jednostkę. Pozycja jest sąsiadem tylko w obrębie tej samej przestrzeni i do jednego kroku końcowej rozstawy mierzonej w skali tej rozstawy, nie w pikselach ani na podstawie kolejności formularza. Geometria i potwierdzone negatywne relacje pozostają twardymi ograniczeniami; dobre relacje zachowują pierwszeństwo przed dokładnością udziałów, `caution` jest miękkim kosztem, a `unknown` nie daje bonusu ani blokady. Przy równoważnych głównych kryteriach kompaktowość preferuje spójne grupy i eliminuje nieuzasadnione odległe pozycje. Wynik pozostaje deterministyczny i ograniczony kosztowo.

#### 2. Sąsiedzi i powody decyzji w wyniku

**File**: `src/lib/garden-layout.ts`, `src/lib/garden-layout.test.ts`

**Intent**: Zapewnić widokowi sprawdzalne dane do objaśnienia, zamiast odtwarzać heurystykę z samych współrzędnych.

**Contract**: Każda pozycja może ujawnić faktycznych lokalnych sąsiadów oraz status relacji (`supported`, `caution`, `unknown`) i krótką kategorię powodu umieszczenia. Jeśli pozycja jest odsunięta, zwracany opis wskazuje sprawdzone istotne ograniczenie (np. geometria/rozstaw lub twarda negatywna para) albo że nie było silniejszej relacji i zadziałał tie-breaker; nie zapisuje się pełnego, nieograniczonego śladu przeszukiwania. Nie wolno przypisywać czosnkowi i brokułowi potwierdzonej relacji bez źródła.

#### 3. Wersja katalogu/algorytmu w snapshotcie

**File**: `src/pages/api/garden-plan.ts`, `src/pages/garden.astro`, współdzielony kontrakt snapshotu/fingerprintu oraz testy smoke

**Intent**: Oznaczyć zapisane wyniki policzone na wcześniejszym katalogu lub algorytmie jako nieaktualne, zachowując możliwość ich odczytu.

**Contract**: SSR i endpoint generowania korzystają z tego samego kanonicznego snapshotu zawierającego wersję danych i układu. Zmiana semantyki katalogu/algorytmu zmienia fingerprint; stare JSON-y bez nowych pól są czytelne i widoczne jako plan nieaktualny. Nie wymaga to migracji ani czyszczenia wierszy `garden_plans`.

### Success Criteria:

#### Automated Verification:

- Testy geometrii potwierdzają końcową obsadę, twarde ograniczenie negatywnej pary tylko przy lokalnym sąsiedztwie oraz brak relacji między pozycjami z różnych przestrzeni.
- Testy punktacji potwierdzają priorytet relacji pozytywnych, miękki charakter `caution`, neutralność `unknown`, wpływ kompaktowości przy porównywalnych głównych wynikach i powtarzalny tie-break.
- Testy wyniku potwierdzają listę sąsiadów/statusów i powód pozycji; brak źródła nie jest zamieniany na twierdzenie o biologicznym sąsiedztwie.
- Test fingerprintu potwierdza, że zmiana wersji katalogu/algorytmu oznacza dawny plan jako nieaktualny, a stary format wyniku nadal można odczytać.
- `npm run test:unit`, `npx astro check`, `npm run build`, `npm run lint` i odpowiedni `npm run smoke` przechodzą.

#### Manual Verification:

- Dwie przestrzenie 200×100 cm z przykładowym miksem marchew 30%, cebula 10%, brokuł 40%, czosnek 20% pokazują lokalnych sąsiadów i zrozumiałe powody bez liczenia relacji między skrzyniami.
- Czosnek obok brokułu może być pokazany jako `unknown`, nie jako błąd; pozycja w narożniku ma uzasadnienie albo układ wybiera dopuszczalną, bardziej zwartą alternatywę.

**Implementation Note**: Zatrzymać się po tej fazie na ręcznym odbiorze przykładowego układu i objaśnień przed dopracowaniem diagramu.

## Phase 3: Szczegóły upraw, skalowany diagram i odbiór

### Overview

Pokazać rozdzielone informacje katalogu oraz nowy diagram w prawdziwej skali, z miniaturami i czytelnym przedstawieniem gęstych pozycji. Zachować obsługę planu nieaktualnego i tekstową alternatywę dla każdego obrazu.

### Changes Required:

#### 1. Informacje przy wybranej uprawie

**File**: `src/components/garden/CropSelectionForm.tsx`, `src/data/crop-catalog.ts`

**Intent**: Pozwolić użytkownikowi porównać miejsce zajmowane przez końcową roślinę z informacjami o siewie i terminach, bez mylenia tych etapów.

**Contract**: Szczegóły uprawy osobno opisują końcową rozstawę po przerywce/sadzeniu, gęstość siewu (jeśli źródłowo znana), okna siewu/sadzenia oraz źródło i pewność. Brak pola jest widoczny jako brak dostępnej informacji; żadna wartość siewna nie trafia do diagramu.

#### 2. Diagram w skali, miniatury i relacje

**File**: `src/components/garden/GardenLayoutView.tsx`, `src/components/garden/GardenPlanner.tsx`, `src/pages/garden.astro`, `public/` (lokalne assety miniatur)

**Intent**: Zastąpić stałe kółka w kontenerze procentowym diagramem, który pokazuje wymiary i pozycje bez spłaszczania ani zasłaniania gęstych nasadzeń.

**Contract**: Rysowanie SVG używa centymetrowego viewBox i jednakowej skali obu osi; delikatne linie siatki pojawiają się co 10 cm. Pozycje pozostają w rzeczywistych współrzędnych. Dla wszystkich 31 upraw są spójne lokalne miniatury; nazwy, legenda, status pewności i relacje są dostępne także przy braku obrazu. Gdy widoczna wielkość ekranu nie pozwala narysować pojedynczych czytelnych znaczników bez kolizji, widok zmniejsza symbole lub grupuje je tylko wizualnie z liczbą i dostępem klawiaturą do składowych — nigdy nie przesuwa współrzędnych roślin. Lokalne sąsiedztwo, status relacji i uzasadnienie położenia są dostępne dla użytkownika; status starego planu pozostaje jednoznaczny.

#### 3. Weryfikacja pełnego przepływu i responsywności

**File**: `scripts/smoke.mjs`, `src/data/crop-catalog.test.ts`, `src/lib/garden-layout.test.ts`, komponenty `/garden`

**Intent**: Utrwalić regresyjne sprawdzenia nowego katalogu, starego zapisu, wersjonowania wyniku i czytelności diagramu.

**Contract**: Testy automatyczne obejmują pełne ID, końcową obsadę, legacy selection, snapshot stale/current, lokalne relacje i ograniczenia geometrii; smoke pozostaje zgodny z prywatnym przepływem po odświeżeniu. Ręczny odbiór obejmuje gęsty wariant, desktop i telefon, widoczny focus i tekstowe alternatywy. Nie dodawać nowego harnessu komponentowego bez wykazanego braku sygnału w istniejących testach.

### Success Criteria:

#### Automated Verification:

- Diagram używa proporcjonalnych centymetrowych współrzędnych i siatki co 10 cm; test/inspekcja kontraktu potwierdza, że render nie modyfikuje współrzędnych wyniku.
- Każde aktywne ID ma miniaturę albo widoczny tekstowy fallback; kontrast etykiety i nazwa dostępna dla klawiatury nie zależą wyłącznie od obrazu/koloru.
- SSR rozróżnia aktualny plan i plan ze starą wersją; stary JSON i etykiety wycofanych ID nie powodują błędu renderowania.
- `npm run test:unit`, `npm run test:db`, `npm run build`, `npm run lint` i `npm run smoke` przechodzą.

#### Manual Verification:

- Na desktopie i telefonie siatka jest subtelna, skala obu osi zgodna, miniatury/legenda rozpoznawalne, a znaczniki nie zlewają się w nieczytelny diagram; gęste pozycje są grupowane bez zmiany ich prawdziwych współrzędnych.
- Focus/klawiatura pozwala dotrzeć do szczegółu pozycji, statusu sąsiadów i tekstowego opisu; użytkownik rozumie różnicę między siewem a końcową obsadą.
- Po odświeżeniu stary plan pozostaje jawnie oznaczony jako nieaktualny; po rozwiązaniu legacy wyboru można wygenerować nowy, aktualny i prywatny wynik.

**Implementation Note**: To ostatnia faza wizualna. Przed zamknięciem follow-upu obejrzeć screenshoty diagramu w desktopie i jednej szerokości mobilnej oraz uzyskać ręczne potwierdzenie.

## Testing Strategy

### Unit Tests:

- Walidacja aktywnego katalogu 31 pozycji, identyfikatorów, relacji, źródeł, osi/jednostek i rozdzielenia `finalSpacing` od `sowingDensity`/terminów.
- Jednostka obsady szczypiorku, braki/niska pewność danych, usunięte ID w wyszukiwaniu i zachowane legacy ID w stanie formularza.
- Granice i rozstawy końcowe, brak pozycji poza skrzynią, lokalne relacje w jednej przestrzeni, blokada negatywna, dodatni priorytet, `caution`, neutralność `unknown`, kompaktowość, stabilność oraz partial result.
- Ślad sąsiadów/powodów pozycji, wersjonowanie fingerprintu i odczyt wcześniejszego formatu planu.

### Integration Tests:

- Smoke: zapis wyboru, obsługa wycofanego ID, rozwiązanie wyboru, wygenerowanie planu, SSR po odświeżeniu i stale status po zmianie wersji wejścia.
- `npm run test:db` zachowuje izolację właścicieli; nie dodaje się migracji kasującej wybory ani istniejące plany.
- Build, Astro check i lint potwierdzają połączenie formularza, katalogu, snapshotu i SVG.

### Manual Testing Steps:

1. Sprawdzić katalog: 31 pozycji, brak fasoli/bobu i nowych ziół, Faworyt pod dotychczasowym wyborem `pomidor`, osobny palikowany koktajlowy, koper i szczypiorek.
2. Sprawdzić, że końcowa rozstawa marchwi to 3–5 cm w rzędzie × 20–30 cm między rzędami po przerywce, a siew i terminy są wyświetlone oddzielnie.
3. Wykonać zaakceptowany przykład dwóch przestrzeni 200×100 cm; potwierdzić, że algorytm liczy sąsiadów tylko w obrębie pojedynczej przestrzeni, a czosnek–brokuł bez reguły źródłowej wyświetla jako `unknown`.
4. Pozostawić stare fasolę/bób w zapisanym formularzu, potwierdzić komunikat i zachowanie danych, potem usunąć/zamienić ręcznie i zapisać; sprawdzić, że stary plan jest nieaktualny.
5. Obejrzeć diagram na desktopie i telefonie, w tym gęstą marchew; ocenić siatkę 10 cm, brak nakładania, czytelność miniatur/legendy, dostęp klawiaturą i zachowanie rzeczywistej geometrii.

## Performance Considerations

- Walidacja dopuszcza wymiary rzędu 100 000 cm; generator musi zachować jawny limit kandydatów/przeszukiwania i nie alokować komórki dla każdego centymetra. Nie zwiększać limitu bez osobnego pomiaru.
- Kompaktowość i obliczanie lokalnych sąsiadów powinny działać na ograniczonym zbiorze kandydatów/pozycji, nie na nieograniczonym pełnym rastrze. JSON uzasadnień ma być zwięzły, nie zapisywać całego drzewa odrzuconych układów.
- Assety miniatur są lokalne i statyczne; warstwa renderująca siatkę nie tworzy osobnych elementów DOM dla każdej kreski lub centymetra.

## Migration Notes

- Nie ma potrzeby zmiany `garden_crops.crop_id` ani usuwania wierszy fasoli/bobu. Zachowuje się ich ID w dotychczasowych zapisach, pokazuje je jako wycofane i wymaga świadomego usunięcia/zamiany przed następnym zapisem lub generowaniem.
- Istniejące ID `pomidor` staje się ID Faworyta; koktajlowy otrzymuje osobne nowe ID. Nie mapować dotychczasowego pomidora automatycznie na koktajlowego.
- Snapshot/fingerprint obejmuje wersję katalogu i algorytmu; zapisane plany ze starą wersją pozostają odczytywalne, lecz dostają status nieaktualny. Nie tworzyć historii planów i nie czyścić `garden_plans`.
- Dotychczasowe zapisane proporcje pozostają bez migracji; przy usunięciu wycofanej pozycji zachowanie normalizacji udziałów musi być jawne i widoczne przed zapisem.

## References

- Research: `context/changes/garden-crop-catalog-and-layout/research.md`
- Decyzje zakresu i diagramu: `context/changes/generate-garden-layout/plan.md` — follow-up S-04
- PRD: `context/foundation/prd.md` — FR-004–FR-007 i Business Logic
- Katalog i relacje: `src/data/crop-catalog.ts:66–94, 407–1134`
- Walidacja wyboru: `src/lib/garden-crop-selection.ts:8–23`, `src/pages/api/garden-crops.ts:37–40`
- Generator: `src/lib/garden-layout.ts:125–139, 166–250, 340–345`
- SSR i fingerprint: `src/pages/garden.astro:74–137`, `src/pages/api/garden-plan.ts:111–126`
- Diagram i formularz: `src/components/garden/GardenLayoutView.tsx:90–122`, `src/components/garden/CropSelectionForm.tsx:230–242`
- Zapis planu: `supabase/migrations/20260929120000_create_garden_plans.sql:1–12`
- Dostępne testy i polecenia: `package.json`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Katalog i zgodność zapisanych wyborów

#### Automated

- [x] 1.1 Katalog ma dokładnie 31 aktywnych pozycji z uzgodnionymi ID; test nie dopuszcza odwołań relacji do usuniętej fasoli/bobu.
- [x] 1.2 Końcowa rozstawa, gęstość siewu i terminy są oddzielnymi informacjami; test potwierdza, że brak końcowej rozstawy nie jest uzupełniany wartością siewną.
- [x] 1.3 Walidacja aktywnych upraw pozostaje ścisła, a test logiki wyboru pokrywa rozpoznane legacy ID i wymóg ich jawnego rozwiązania.
- [x] 1.4 `npm run test:unit`, `npx astro check`, `npm run build` i `npm run lint` przechodzą.

#### Manual

- [x] 1.5 Istniejący wybór `pomidor` nadal widnieje jako Faworyt; zachowane wybory fasoli/bobu są oznaczone jako wycofane i nie znikają przed ręcznym usunięciem lub zamianą.

### Phase 2: Lokalny silnik, zwarte rozmieszczenie i wyjaśnienia

#### Automated

- [x] 2.1 Testy geometrii potwierdzają końcową obsadę, twarde ograniczenie negatywnej pary tylko przy lokalnym sąsiedztwie oraz brak relacji między pozycjami z różnych przestrzeni.
- [x] 2.2 Testy punktacji potwierdzają priorytet relacji pozytywnych, miękki charakter `caution`, neutralność `unknown`, wpływ kompaktowości przy porównywalnych głównych wynikach i powtarzalny tie-break.
- [x] 2.3 Testy wyniku potwierdzają listę sąsiadów/statusów i powód pozycji; brak źródła nie jest zamieniany na twierdzenie o biologicznym sąsiedztwie.
- [x] 2.4 Test fingerprintu potwierdza, że zmiana wersji katalogu/algorytmu oznacza dawny plan jako nieaktualny, a stary format wyniku nadal można odczytać.
- [x] 2.5 `npm run test:unit`, `npx astro check`, `npm run build`, `npm run lint` i odpowiedni `npm run smoke` przechodzą.

#### Manual

- [ ] 2.6 Dwie przestrzenie 200×100 cm z przykładowym miksem marchew 30%, cebula 10%, brokuł 40%, czosnek 20% pokazują lokalnych sąsiadów i zrozumiałe powody bez liczenia relacji między skrzyniami.
- [ ] 2.7 Czosnek obok brokułu może być pokazany jako `unknown`, nie jako błąd; pozycja w narożniku ma uzasadnienie albo układ wybiera dopuszczalną, bardziej zwartą alternatywę.

### Phase 3: Szczegóły upraw, skalowany diagram i odbiór

#### Automated

- [ ] 3.1 Diagram używa proporcjonalnych centymetrowych współrzędnych i siatki co 10 cm; test/inspekcja kontraktu potwierdza, że render nie modyfikuje współrzędnych wyniku.
- [ ] 3.2 Każde aktywne ID ma miniaturę albo widoczny tekstowy fallback; kontrast etykiety i nazwa dostępna dla klawiatury nie zależą wyłącznie od obrazu/koloru.
- [ ] 3.3 SSR rozróżnia aktualny plan i plan ze starą wersją; stary JSON i etykiety wycofanych ID nie powodują błędu renderowania.
- [ ] 3.4 `npm run test:unit`, `npm run test:db`, `npm run build`, `npm run lint` i `npm run smoke` przechodzą.

#### Manual

- [ ] 3.5 Na desktopie i telefonie siatka jest subtelna, skala obu osi zgodna, miniatury/legenda rozpoznawalne, a znaczniki nie zlewają się w nieczytelny diagram; gęste pozycje są grupowane bez zmiany ich prawdziwych współrzędnych.
- [ ] 3.6 Focus/klawiatura pozwala dotrzeć do szczegółu pozycji, statusu sąsiadów i tekstowego opisu; użytkownik rozumie różnicę między siewem a końcową obsadą.
- [ ] 3.7 Po odświeżeniu stary plan pozostaje jawnie oznaczony jako nieaktualny; po rozwiązaniu legacy wyboru można wygenerować nowy, aktualny i prywatny wynik.
