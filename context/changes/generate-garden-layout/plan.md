# Generowanie układu warzywnika — Plan implementacji

## Overview

S-04 doda automatyczne generowanie układu dla całej działki na podstawie wymiarów wszystkich skrzyń/sektorów oraz procentowego miksu roślin. Planer wyznaczy pozycje, dobierze sąsiedztwa bez ręcznego przypisywania upraw do grządek, zapisze prywatny wynik i pokaże różnicę między celem a osiągniętym układem.

## Current State Analysis

- Chroniona strona `/garden` odczytuje skrzynie/sektory i wybór upraw po stronie serwera, a formularze React zapisują je przez osobne endpointy. Wymiary przestrzeni to `width_cm`, `length_cm` i `sort_order`; nie istnieje jeszcze generator ani model położenia roślin.
- Formularz S-03 wyświetla udziały procentowe sumujące się do 100,00%. Baza nadal przechowuje dodatnie wartości numeryczne w `garden_crops.proportion`; istniejący helper normalizuje je dokładnie do procentów, więc planer może zachować zgodność ze starszymi zapisami bez migracji tych wartości.
- Katalog ma 30 upraw i jeden rekord `SpacingData` na uprawę. W bieżącym kodzie tylko czosnek ma potwierdzone osie, 26 wpisów ma niezweryfikowaną parę osi, a 3 nie mają rozstawy. Research zawiera po jednym roboczym wariancie dla każdej uprawy, ale różni się on pewnością oraz etapem (np. siew, przerzedzenie, rozsada).
- Katalog zawiera 2 relacje `supported` i 6 `caution`. Wszystkie obecne relacje są miękkie; nie ma obecnie potwierdzonych relacji oznaczonych jako twardy zakaz. Brak wpisu zwraca neutralne `unknown`.
- W przykładzie użytkownika pojawił się szczypior, ale nie występuje on w obecnym, zatwierdzonym katalogu 30 upraw; plan nie rozszerza katalogu i używa istniejącego czosnku jako czwartej uprawy w technicznym przykładzie.
- PRD i roadmapa wcześniej zostawiały semantykę proporcji otwartą, a frame opisywał pierwszą zmianę procentów jako UI-only. Późniejsze wyjaśnienie użytkownika dla S-04 rozstrzyga pełny przepływ generatora: udział liczby roślin na całej działce, automatyczny dobór pozycji, preferencja dobrych sąsiedztw i twarde odrzucenie tylko potwierdzonych negatywnych par.

### Key Discoveries:

- `src/pages/garden.astro` już pobiera prywatne wejścia SSR; może także pobrać aktualny plan i nie wymaga osobnej strony.
- `src/lib/garden-crop-percentages.ts` jest czystym, testowanym modułem i zawiera deterministyczną normalizację metodą największych reszt — analogiczny podział obliczeń do osobnego modułu ułatwi testy generatora.
- `src/pages/api/garden-crops.ts` i `src/pages/api/garden.ts` ustalają wzorzec: endpoint weryfikuje użytkownika, używa klienta Supabase z sesją i zwraca błędy bez ujawniania szczegółów dostawcy.
- `supabase/migrations/20260926120000_create_garden_spaces.sql` zapisuje wyłącznie wymiary i kolejność. Kolejność formularza nie może być używana jako domysł fizycznego sąsiedztwa.
- Wymiary mogą sięgać 100 000 cm, a aplikacja używa adaptera Cloudflare; naiwny raster centymetr-po-centymetrze lub nieograniczony search nie jest bezpiecznym modelem obliczeń.
- `scripts/smoke.mjs` już weryfikuje logowanie, SSR, zapis i prywatny odczyt formularzy; można rozszerzyć tę ścieżkę o generowanie planu.

## Desired End State

Użytkownik zapisuje wymiary przestrzeni i miks procentowy, a następnie jednym poleceniem otrzymuje automatyczny, graficzny plan dla całej działki. Pozycje respektują rozstawy i geometrię; znane dobre sąsiedztwa są priorytetem, relacje neutralne są dozwolone, `caution` jest miękkim kosztem, a wyłącznie potwierdzona negatywna relacja wyklucza sąsiednie pozycje. Plan pokazuje liczbę i udział docelowy oraz osiągnięty, nie ukrywa odchyleń, ujawnia pewność rozstaw i w razie brakujących danych jawnie oznacza wynik częściowy.

Wynik jest prywatny, zapisany jako bieżący plan działki i odtwarzany po odświeżeniu. Niewykorzystane miejsce jest pokazywane jako konflikt tylko wtedy, gdy geometria uniemożliwia realizację celu; brak danych o uprawie jest raportowany oddzielnie, bez mylenia go z konfliktem geometrycznym.

## What We're NOT Doing

- Nie prosimy użytkownika o ręczne przypisywanie upraw do skrzyń ani o ręczne wybieranie dobrych i złych sąsiedztw.
- Nie inferujemy fizycznej sąsiedniości osobnych skrzyń z kolejności formularza; relacje optymalizujemy na podstawie wygenerowanych pozycji w obrębie danej skrzyni/sektora.
- Nie dodajemy ręcznego przesuwania roślin, edycji własnego katalogu, dodatkowego pola na całkowitą liczbę roślin ani historii wielu sezonów.
- Nie dodajemy nowych upraw poza zatwierdzonym katalogiem 30 (w tym szczypioru) w ramach S-04.
- Nie obiecujemy plonu, ochrony przed szkodnikami ani identycznej realizacji procentów mimo ograniczeń geometrii.
- Nie dodajemy terminów siewu/sadzenia i kalendarza (S-06) ani pełnego przepływu ostrzegania i czyszczenia planu przy każdej zmianie danych (S-05). Zapisany plan musi jednak dać się rozpoznać jako nieaktualny względem wejścia, zamiast być prezentowany jako bieżący.

## Implementation Approach

Zbudować czysty, deterministyczny moduł TypeScript, który przyjmuje wymiary, zapisany miks i robocze dane katalogu, a zwraca pozycje roślin, cele/wyniki udziałów, poziomy pewności oraz powody częściowej realizacji. Najpierw przestrzegać rozstaw i wykluczać potwierdzone negatywne sąsiedztwa; następnie maksymalizować wykonalną obsadę i dobre relacje, przy czym dobre sąsiedztwo ma pierwszeństwo przed dokładnością procentów. `caution` obniża ocenę, a `unknown` jest neutralne. Stabilny tie-breaker zapewnia odtwarzalny rezultat; wynik jest najlepszym układem znalezionym w jawnie ograniczonym przeszukiwaniu, nie matematyczną gwarancją globalnego optimum.

Endpoint po stronie serwera pobiera wejścia wyłącznie z prywatnych tabel Supabase i atomowo zastępuje jeden bieżący plan działki. Plan przechowuje wersję/snapshot wejścia, aby SSR nie prezentował starego wyniku jako aktualnego. Osobny komponent na `/garden` rysuje wynik i jasno rozdziela odchylenie procentów, konflikt geometrii, niską pewność danych oraz brak rozstawy.

## Critical Implementation Details

Generator musi pozostać ograniczony kosztowo: istniejąca walidacja dopuszcza wymiar przestrzeni do 100 000 cm, więc nie wolno tworzyć tablicy dla każdego centymetra ani uruchamiać nieograniczonego przeszukiwania w request-cyklu Cloudflare. Zapisany wynik musi być powiązany z kanonicznym snapshotem przestrzeni i upraw; jeśli snapshot różni się od bieżących danych, UI nie pokazuje wyniku jako aktualnego. Każdy roboczy default zachowuje etap i pewność źródła, żeby odstępu wysiewu nie przedstawiać jako pewnej końcowej obsady.

## Phase 1: Dane katalogu i czysty silnik układu

### Overview

Wprowadzić produktowy kontrakt rozstaw/sąsiedztwo oraz testowany silnik, który układa rośliny globalnie w dostępnych przestrzeniach. Ta faza ustala obliczenia i jawne metryki wyniku, bez bazy wyniku i UI diagramu.

### Changes Required:

#### 1. Robocze dane rozstaw i relacji

**File**: `src/data/crop-catalog.ts`

**Intent**: Dodać źródłowe, robocze warianty dla 30 upraw na podstawie S-04 researchu oraz zachować ich pewność, nazwane osie, kontekst i etap planowania. Model relacji odróżnia potwierdzoną relację negatywną od miękkiego `caution`.

**Contract**: Każda domyślna rozstawa ma źródło, poziom pewności i informację, czy opisuje siew/stanowisko czy końcową pozycję rośliny. Wyłącznie jawnie potwierdzona negatywna relacja jest twardą blokadą; `supported` daje bonus, `caution` miękki koszt, brak wpisu pozostaje neutralny. Nie oznaczać niepewnych osi jako potwierdzonych.

#### 2. Czysty silnik planowania

**File**: `src/lib/garden-layout.ts`

**Intent**: Dodać niezależne od React i Supabase obliczenia rozmieszczenia na wszystkich skrzyniach/sektorach, tak by wejście i rezultat dało się testować jednostkowo.

**Contract**: Publiczny typ wejścia obejmuje przestrzenie, udziały i wybrane rekordy katalogu; wynik zawiera per-przestrzeń pozycje, liczbę i udział docelowy/osiągnięty, konflikty geometryczne, pewność danych oraz listę niewyznaczonych upraw z przyczyną. Silnik normalizuje zapisane wagi do udziałów całego miksu, stosuje deterministyczne porównanie wyników i limit obliczeń; brak usable spacing nie usuwa uprawy po cichu.

#### 3. Kontrakt produktu

**File**: `context/foundation/prd.md`

**Intent**: Zastąpić nieaktualne pytanie otwarte o znaczenie proporcji aktualnie zatwierdzoną semantyką S-04.

**Contract**: FR-004 i FR-006/Biznes Logic określają udziały jako cel liczby roślin dla całej działki; wynik pokazuje cel oraz osiągnięty udział osobno i ujawnia ograniczenia geometryczne. W dokumentacji zachować, że dane katalogu mają różną pewność i plan może być częściowy.

#### 4. Testy danych i optymalizacji

**File**: `src/data/crop-catalog.test.ts` and `src/lib/garden-layout.test.ts`

**Intent**: Rozszerzyć istniejące walidacje katalogu i dodać przypadki brzegowe silnika bez zależności od Supabase.

**Contract**: Testy sprawdzają bounds i rozstaw, stabilność wyniku, układ na wielu przestrzeniach, przykład dwóch przestrzeni 200×100 cm z udziałami marchew 30%, cebula 10%, brokuł 40%, czosnek 20%, pierwszeństwo dobrych sąsiedztw przed dokładnością procentów, dozwolone `caution`, neutralne `unknown`, wykluczenie relacji negatywnej oraz częściowy wynik przy braku danych.

### Success Criteria:

#### Automated Verification:

- Wszystkie 30 upraw ma jeden roboczy wariant z zapisanym źródłem, etapem i poziomem pewności; istniejące testy katalogu odróżniają osie robocze od potwierdzonych.
- Testy silnika dowodzą, że żadna pozycja nie wychodzi poza przestrzeń ani nie narusza wymaganej rozstawy; potwierdzone negatywne sąsiedztwa nie występują, a wynik deterministycznie raportuje target/actual, częściowe uprawy i odchylenia.
- Scenariusze `supported`, `caution`, `unknown`, brak rozstawy, mała geometria i dwie przestrzenie 200×100 cm przechodzą testy jednostkowe; dobre sąsiedztwo ma pierwszeństwo przed dokładnością procentów zgodnie z zaakceptowanym kontraktem.
- `npm run test:unit`, `npx astro check` i `npm run lint` przechodzą.

**Implementation Note**: Po wykonaniu kryteriów automatycznych zatrzymaj się i uzyskaj potwierdzenie ręczne, jeśli użytkownik wykonywał w tej fazie ręczny przegląd. Faza nie ma wymaganego UI; jej dowodem są testy silnika i walidacji danych.

## Phase 2: Prywatne generowanie i zapis bieżącego planu

### Overview

Podłączyć silnik do aktualnych, prywatnych danych użytkownika i przechować jeden bieżący wynik bez historii sezonów. Dane wejściowe pobiera serwer z sesją, a nie z treści requestu.

### Changes Required:

#### 1. Tabela prywatnego planu

**File**: `supabase/migrations/<timestamp>_create_garden_plans.sql`

**Intent**: Dodać zapis bieżącego układu powiązany z istniejącym prywatnym rekordem `gardens`.

**Contract**: Jeden wiersz na `garden_id`, JSON wyniku, snapshot/fingerprint wejścia i czas wygenerowania; RLS ogranicza odczyt/zapis do właściciela. Ponowne generowanie atomowo zastępuje ten wiersz. Bez backfillu, archiwum lub wielu wersji.

#### 2. Autoryzowany endpoint generatora

**File**: `src/pages/api/garden-plan.ts`

**Intent**: Udostępnić zalogowanemu użytkownikowi polecenie wygenerowania i zapisania planu na podstawie jego aktualnej działki.

**Contract**: Endpoint weryfikuje sesję, ładuje `garden_spaces` i `garden_crops` przez klienta objętego RLS, waliduje kompletność wejścia, normalizuje miks, wywołuje czysty silnik i atomowo zapisuje rezultat. Request nie może dostarczyć obcych wymiarów ani identyfikatora właściciela; odpowiedzi nie ujawniają szczegółów błędów Supabase.

#### 3. Testy bazy i przepływu endpointu

**File**: `supabase/tests/garden_plans.test.sql` and `scripts/smoke.mjs`

**Intent**: Potwierdzić prywatność, autoryzację i bezpieczne zastępowanie bieżącego wyniku.

**Contract**: pgTAP sprawdza RLS dwóch właścicieli; smoke test sprawdza niezalogowane żądanie, autoryzowane generowanie i odczyt wyniku przez SSR. Powtórne generowanie zastępuje jedyny bieżący rekord; brak przestrzeni/upraw zwraca jawny stan, nie pusty sukces. Nie dodawać mockowego harnessu routingu, którego repozytorium obecnie nie używa.

### Success Criteria:

#### Automated Verification:

- Migracja tworzy jeden bieżący plan na działkę z RLS, a testy DB potwierdzają izolację dwóch kont i brak dostępu anon.
- Endpoint używa wyłącznie wejścia zalogowanego użytkownika, zwraca przewidywalne kody błędów i ponowne generowanie zastępuje poprzedni plan bez duplikatów.
- `npm run test:db`, odpowiednie kroki `npm run smoke` i `npm run test:unit` przechodzą.

**Implementation Note**: Po wykonaniu kryteriów automatycznych zatrzymaj się na ręczne potwierdzenie przed fazą UI, jeśli ścieżka endpointu była testowana ręcznie. Nie kontynuuj z błędem RLS lub planem, którego właściciela nie potwierdzają testy.

## Phase 3: Graficzny plan na stronie działki

### Overview

Dodać prostą akcję generowania oraz widok układu wszystkich przestrzeni, wyników procentowych i jawnych ograniczeń. Użytkownik nadal podaje tylko wymiary i miks; wyborów lokalizacji dokonuje algorytm.

### Changes Required:

#### 1. SSR i komponent sterujący planowaniem

**File**: `src/pages/garden.astro` and `src/components/garden/GardenPlanner.tsx`

**Intent**: Odczytać prywatny bieżący plan przy renderowaniu strony i dodać jednoznaczne stany generowania, sukcesu, błędu oraz planu nieaktualnego.

**Contract**: Strona SSR przekazuje tylko plan zalogowanego właściciela. Akcja uruchamia endpoint bez ręcznego przypisania upraw do grządek; jeśli snapshot nie pasuje do aktualnych wymiarów/miksu, nie przedstawia starego wyniku jako aktualnego.

#### 2. Diagram i podsumowanie

**File**: `src/components/garden/GardenLayoutView.tsx`

**Intent**: Narysować pozycje upraw per skrzynia/sektor i pokazać zrozumiałe podsumowanie celu oraz wyniku.

**Contract**: Każda przestrzeń ma podpisane wymiary i pozycje; tekst, nie sam kolor, identyfikuje uprawę. Podsumowanie rozdziela cel `%` i liczbę roślin od rzeczywistego miksu, sygnalizuje odchylenia, poziom pewności i niewyznaczone uprawy. Wolne miejsce opisuje jako konflikt geometrii tylko wtedy, gdy geometria zablokowała cel.

#### 3. Smoke test przepływu

**File**: `scripts/smoke.mjs`

**Intent**: Rozszerzyć istniejący smoke test end-to-end o wygenerowanie, odczyt po odświeżeniu i prywatność planu.

**Contract**: Przepływ testuje istniejące konto testowe, wymiary, procentowy miks, odpowiedź generatora i SSR; nie zależy od losowej kolejności ani tekstu błędu wewnętrznego dostawcy.

### Success Criteria:

#### Automated Verification:

- `npm run build`, `npm run lint`, `npm run test:unit`, `npm run test:db` oraz rozszerzony `npm run smoke` przechodzą.
- Po odświeżeniu `/garden` odtwarza wyłącznie bieżący plan właściciela; zmieniony snapshot jest oznaczony jako wymagający przeliczenia, a nie prezentowany jako aktualny.

#### Manual Verification:

- Dla dwóch skrzyń 200×100 cm i miksu marchew 30%, cebula 10%, brokuł 40%, czosnek 20% algorytm sam wybiera pozycje, preferuje wykonalne dobre sąsiedztwa i pokazuje cel obok osiągniętego wyniku.
- Użytkownik widzi ostrzeżenia o niskiej pewności i osobną listę upraw bez rozstawy; neutralne sąsiedztwo jest dozwolone, `caution` nie blokuje, a potwierdzona relacja negatywna wyklucza układ.
- Diagram da się odczytać klawiaturą i na wąskim ekranie; aktualny zapis pozostaje prywatny i jest widoczny po odświeżeniu.

**Implementation Note**: Po wykonaniu kryteriów automatycznych zatrzymaj się na ręczne potwierdzenie testu wizualnego i dwóch kont przed oznaczeniem fazy jako zakończonej.

## Testing Strategy

### Unit Tests:

- Testować normalizację miksu, stabilny tie-break, geometrię granic, minimalne rozstawy, wielkości niepasujące do grządki, wiele przestrzeni, pozytywne/miękkie/neutralne/twarde relacje, brak danych i limit przeszukiwania.
- Każdy wynik musi zachować spójność: suma liczebności równa się liczbie pozycji, procenty osiągnięte liczą się z tych liczebności, a odchylenie nigdy nie jest ukryte.

### Integration Tests:

- pgTAP dla RLS planów, własności działki, atomowego zastąpienia i dwóch kont.
- Test API generowania z autoryzacją, odczytem źródłowych danych po stronie serwera, brakiem wymaganych danych i zachowaniem przy nieaktualnym snapshotcie.
- Rozszerzyć `scripts/smoke.mjs` o pełny przepływ: zapis wejścia → generowanie → odczyt SSR po odświeżeniu.

### Manual Testing Steps:

1. Użyć dwóch przestrzeni 200×100 cm i miksu marchew/cebula/brokuł/czosnek 30/10/40/20; sprawdzić, że aplikacja sama rozdziela warzywa i pokazuje osiągnięte udziały.
2. Sprawdzić układ dobrego, neutralnego, `caution` i potwierdzonego negatywnego sąsiedztwa oraz przypadek częściowy z brakiem rozstawy.
3. Odświeżyć stronę, zmienić zapisane wejście i potwierdzić, że poprzedni układ nie jest pokazany jako aktualny; zweryfikować widok mobilny i czytelność bez koloru.

## Performance Considerations

- Nie iterować po każdym centymetrze, ponieważ walidator pozwala na boki do 100 000 cm. Wyznaczać kandydatów arytmetycznie/wierszami i ustalić jawny budżet przeszukiwania oraz maksymalną liczbę zapisanych pozycji.
- Gdy budżet jest osiągnięty, zwrócić najlepszy deterministycznie znaleziony poprawny wynik z jawnym ostrzeżeniem, jeśli istnieje; bez poprawnego wyniku zwrócić kontrolowany błąd limitu. Nie dopuszczać do timeoutu requestu Cloudflare.
- Nie wprowadzać zewnętrznego solvera w pierwszym MVP; osobna czysta funkcja i testy pozwolą później zmienić strategię bez zmiany prywatnego kontraktu API/UI.

## Migration Notes

- Nowa tabela przechowuje jeden bieżący układ na istniejący `garden_id`; nie migruje danych użytkowników i nie tworzy historii sezonów.
- Istniejące `garden_crops.proportion` pozostaje numeryczne. Generator normalizuje dodatnie zapisane wartości do 100% na wejściu, zachowując zgodność z wcześniejszymi wagami i bez migracji proporcji.
- Snapshot planu zabezpiecza odczyt przed pokazaniem wyniku dla innych wymiarów/miksu. Automatyczne usuwanie planu i pełne ostrzeżenia przy edycji pozostają w S-05.
- Polityka RLS ma odpowiadać istniejącym tabelom: własność przez `gardens.user_id = auth.uid()`; anon nie otrzymuje dostępu.

## References

- Research S-04: `context/changes/generate-garden-layout/research.md`
- Frame and planning clarifications: `context/changes/generate-garden-layout/frame.md`
- PRD: `context/foundation/prd.md`
- Roadmap: `context/foundation/roadmap.md`
- Crop data and relationships: `src/data/crop-catalog.ts:22,41,699–883`
- Percentage normalization: `src/lib/garden-crop-percentages.ts:21`
- Garden SSR: `src/pages/garden.astro:1–45`
- Existing private space contract: `supabase/migrations/20260926120000_create_garden_spaces.sql:1–11`
- Existing API and smoke patterns: `src/pages/api/garden-crops.ts`, `scripts/smoke.mjs`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Dane katalogu i czysty silnik układu

#### Automated

- [x] 1.1 Wszystkie 30 upraw mają roboczy wariant, źródło, etap i poziom pewności.
- [x] 1.2 Silnik respektuje geometrię i relacje oraz zwraca deterministyczny, jawny wynik target/actual.
- [x] 1.3 Testy relacji, braków danych, małej geometrii i przykładu 2×200×100 cm przechodzą.
- [x] 1.4 Test:unit, astro check i lint przechodzą.

### Phase 2: Prywatne generowanie i zapis bieżącego planu

#### Automated

- [ ] 2.1 Migracja i testy DB potwierdzają jednowierszowy, prywatny zapis planu.
- [ ] 2.2 Endpoint autoryzuje użytkownika, używa jego wejść i atomowo zastępuje wynik.
- [ ] 2.3 Testy DB, endpointu i unit przechodzą.

### Phase 3: Graficzny plan na stronie działki

#### Automated

- [ ] 3.1 Build, lint, unit, DB i smoke test przechodzą; odświeżenie odtwarza tylko aktualny plan.
- [ ] 3.2 SSR odróżnia zapisany wynik od planu o niezgodnym wejściowym snapshotcie.

#### Manual

- [ ] 3.3 Przykład dwóch skrzyń pokazuje automatyczny układ, cel i wynik oraz reguły sąsiedztwa.
- [ ] 3.4 Częściowy wynik, pewność danych i interpretacja neutralnego/caution/negatywnego sąsiedztwa są czytelne.
- [ ] 3.5 Diagram jest czytelny klawiaturą i na wąskim ekranie, a plan nie jest widoczny na drugim koncie.
