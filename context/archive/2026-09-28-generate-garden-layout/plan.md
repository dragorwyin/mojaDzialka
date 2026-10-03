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

Wynik jest prywatny, zapisany jako bieżący plan działki i odtwarzany po odświeżeniu. Jeśli wejściowy snapshot się zmieni, poprzedni diagram pozostaje widoczny, ale jest wyraźnie oznaczony jako nieaktualny wraz z ostrzeżeniem i akcją ponownego generowania — nie jest przedstawiany jako bieżący. Niewykorzystane miejsce jest pokazywane jako konflikt tylko wtedy, gdy geometria uniemożliwia realizację celu; brak danych o uprawie jest raportowany oddzielnie, bez mylenia go z konfliktem geometrycznym.

## What We're NOT Doing

- Nie prosimy użytkownika o ręczne przypisywanie upraw do skrzyń ani o ręczne wybieranie dobrych i złych sąsiedztw.
- Sąsiedztwo upraw oceniamy wyłącznie w obrębie tej samej skrzyni lub sektora. Nie inferujemy ani nie optymalizujemy fizycznej sąsiedniości między osobnymi przestrzeniami.
- Nie dodajemy ręcznego przesuwania roślin, edycji własnego katalogu, dodatkowego pola na całkowitą liczbę roślin ani historii wielu sezonów.
- Fazy 1–5 opisują pierwotny katalog 30 pozycji. Zatwierdzony follow-up poniżej rozszerza katalog docelowy do 31 pozycji.
- Nie obiecujemy plonu, ochrony przed szkodnikami ani identycznej realizacji procentów mimo ograniczeń geometrii.
- Nie wdrażamy pełnego kalendarza prac z S-06. Follow-up może pokazać informacyjnie terminy i gęstość siewu w szczegółach wybranej rośliny, ale generator i diagram korzystają wyłącznie z końcowej obsady po przerywce lub sadzeniu.
- Nie dodajemy pełnego przepływu ostrzegania i czyszczenia planu przy każdej zmianie danych (S-05). Zapisany plan musi jednak dać się rozpoznać jako nieaktualny względem wejścia, zamiast być prezentowany jako bieżący.

## Implementation Approach

Zbudować czysty, deterministyczny moduł TypeScript, który przyjmuje wymiary, zapisany miks i robocze dane katalogu, a zwraca pozycje roślin, cele/wyniki udziałów, poziomy pewności oraz powody częściowej realizacji. Najpierw przestrzegać rozstaw i wykluczać potwierdzone negatywne sąsiedztwa; następnie maksymalizować wykonalną obsadę i dobre relacje, przy czym dobre sąsiedztwo ma pierwszeństwo przed dokładnością procentów. `caution` obniża ocenę, a `unknown` jest neutralne. Stabilny tie-breaker zapewnia odtwarzalny rezultat; wynik jest najlepszym układem znalezionym w jawnie ograniczonym przeszukiwaniu, nie matematyczną gwarancją globalnego optimum.

Endpoint po stronie serwera pobiera wejścia wyłącznie z prywatnych tabel Supabase i atomowo zastępuje jeden bieżący plan działki. Plan przechowuje wersję/snapshot wejścia, aby SSR nie prezentował starego wyniku jako aktualnego. Osobny komponent na `/garden` rysuje wynik i jasno rozdziela odchylenie procentów, konflikt geometrii, niską pewność danych oraz brak rozstawy.

## Critical Implementation Details

Generator musi pozostać ograniczony kosztowo: istniejąca walidacja dopuszcza wymiar przestrzeni do 100 000 cm, więc nie wolno tworzyć tablicy dla każdego centymetra ani uruchamiać nieograniczonego przeszukiwania w request-cyklu Cloudflare. Zapisany wynik musi być powiązany z kanonicznym snapshotem przestrzeni i upraw. Gdy snapshot różni się od bieżących danych, `/garden` zachowuje poprzedni diagram dla kontekstu, ale oznacza go jako nieaktualny, pokazuje wyraźne ostrzeżenie i CTA do ponownego generowania; wartości target/actual muszą być przypisane do poprzedniego snapshotu. Pełne ostrzeżenie przed zapisem zmian i czyszczenie poprzedniego planu pozostają zakresem S-05. Każdy roboczy default zachowuje etap i pewność źródła, żeby odstępu wysiewu nie przedstawiać jako pewnej końcowej obsady.

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

## Phase 3: Tokeny i wspólne komponenty całego `/garden`

### Overview

Najpierw domknąć wizualny kontrakt istniejącego widoku działki: wykorzystać obecne semantyczne tokeny i `Button` na stronie oraz w obu formularzach. Zachować istniejący motyw; nie zmieniać innych widoków aplikacji.

Ta faza adresuje charges UI-01 (tokeny), UI-02 (wspólny komponent) oraz UI-04 (język dokumentu) z audytu w `research.md`.

### Changes Required:

#### 1. Źródło tokenów, strona i formularze

**File**: `src/styles/global.css`, `src/pages/garden.astro`, `src/components/garden/GardenSetupForm.tsx`, `src/components/garden/CropSelectionForm.tsx`, `src/layouts/Layout.astro`; reuse `src/components/ui/button.tsx`

**Intent**: Usunąć lokalne palety z całego `/garden` i oprzeć jego formularze oraz operacyjne przyciski na istniejących rolach i komponentach repozytorium.

**Contract**: Dodać do `global.css` wyłącznie brakujące role semantyczne; migrować kolory i gradient używany na `/garden` do tych ról; wszystkie przyciski formularzy używają istniejącego `Button` zamiast lokalnych kopii. Ustawić język dokumentu tej polskiej strony na `pl`, bez niezamierzonej zmiany pozostałych stron. Nie dodawać drugiego prymitywu Button ani równoległego systemu tokenów.

#### 2. Trwały skan hardcoded values

**File**: `scripts/check-garden-ui-tokens.mjs`, `package.json`

**Intent**: Zachować kontrakt tokenów w istniejącym przepływie lintowania, żeby kolejna zmiana nie odtworzyła palety w komponentach `/garden`.

**Contract**: Dodać skrypt bez nowej zależności, początkowo scoped do strony i formularzy czyszczonych w tej fazie; stosować hardcoded-value scan z 10x-ui (kolory literalne, arbitralne wartości i paleta Tailwind), ocenić kandydatów i zakończyć błędem dla nieuzasadnionych trafień. Włączyć go do `npm run lint`; nie skanować źródła tokenów. W Phase 4 rozszerzyć listę o komponent planera i diagram.

### Success Criteria:

#### Automated Verification:

- `npm run build` oraz `npm run lint` przechodzą; lint uruchamia również scoped scan widoku i obu formularzy.
- Wartości hardcoded w czyszczonych plikach spadają względem 47 linii-kandydatów z audytu; skrypt zgłasza każde niedozwolone pozostałe dopasowanie.

#### Manual Verification:

- Strona i oba formularze zachowują uzgodniony motyw, używają wspólnego `Button`, a ich podstawowe interakcje nadal działają.
- Screenshoty przed/po tej fazie są obejrzane na desktopie oraz przy jednej szerokości mobilnej; tab/focus pozostają widoczne.

**Implementation Note**: To pierwsza faza wizualna. Przed przejściem dalej obejrzeć screenshoty i powtórzyć scan na tych samych plikach co w audycie.

## Phase 4: Widok planera i stan nieaktualnego planu

### Overview

Podłączyć prywatny zapis do czytelnego diagramu całej działki, pokazać target/actual i ograniczenia oraz zachować poprzedni wynik po zmianie wejścia — jawnie oznaczony jako nieaktualny.

Ta faza adresuje charge UI-03 (przepływ SSR i nieaktualny snapshot) z audytu w `research.md`.

### Changes Required:

#### 1. SSR i komponent sterujący planowaniem

**File**: `src/pages/garden.astro`, `src/components/garden/GardenPlanner.tsx`

**Intent**: Odczytać plan wyłącznie zalogowanego właściciela, porównać fingerprint z aktualnymi wejściami po stronie serwera i udostępnić generowanie bez ręcznego wyboru grządek.

**Contract**: Zgodny snapshot jest renderowany jako bieżący. Przy niezgodnym snapshotcie poprzedni diagram oraz jego target/actual nadal są widoczne, ale jako dane starego planu z wyraźnym statusem „nieaktualny”, ostrzeżeniem i CTA ponownego generowania. Udane przeliczenie zastępuje go nowym planem; błąd pozostawia poprzedni diagram jawnie nieaktualny. Ostrzeżenie przed zapisem zmian oraz czyszczenie planu pozostają zakresem S-05.

#### 2. Diagram i podsumowanie

**File**: `src/components/garden/GardenLayoutView.tsx`

**Intent**: Narysować pozycje upraw na każdej skrzyni/sektorze oraz przedstawić liczby, udziały i ograniczenia bez opierania rozróżnień wyłącznie na kolorze.

**Contract**: Każda przestrzeń ma podpisane wymiary i pozycje. Podsumowanie rozdziela cel `%` i liczbę roślin od osiągniętego miksu, pokazuje odchylenia, pewność, niewyznaczone uprawy i konflikt geometrii tylko wtedy, gdy geometria zablokowała cel. Widok przyjmuje status aktualny/nieaktualny z kontrolera.

#### 3. Smoke test przepływu

**File**: `scripts/smoke.mjs`

**Intent**: Rozszerzyć istniejący smoke test o prywatny odczyt planu po generowaniu oraz odróżnienie bieżącego snapshotu od starego.

**Contract**: Test używa istniejącego konta testowego, wymiarów i miksu, weryfikuje autoryzowane generowanie i SSR po odświeżeniu, nie zależy od losowej kolejności ani treści wewnętrznego błędu dostawcy.

#### 4. Rozszerzenie skanu UI na planer

**File**: `scripts/check-garden-ui-tokens.mjs`

**Intent**: Objąć trwałym guardem nowe komponenty planera przed zakończeniem jego implementacji.

**Contract**: Rozszerzyć scoped scan z Phase 3 o `GardenPlanner.tsx` i `GardenLayoutView.tsx`; liczba trafień nie może wzrosnąć po tej fazie, a każde celowe dopasowanie wymaga jawnej, wąskiej i udokumentowanej decyzji.

### Success Criteria:

#### Automated Verification:

- `npm run build`, `npm run test:unit`, `npm run test:db` i `npm run smoke` przechodzą.
- Test SSR potwierdza, że tylko właściciel odczytuje swój wynik, zgodny fingerprint jest bieżący, a niezgodny pozostawia stary diagram oznaczony jako nieaktualny z CTA.

#### Manual Verification:

- Dwie skrzynie 200×100 cm i miks marchew 30%, cebula 10%, brokuł 40%, czosnek 20% pokazują automatyczny układ oraz target obok actual.
- Czytelne są pewność/braki danych, neutralne i `caution` sąsiedztwo oraz blokada potwierdzonej relacji negatywnej.
- Po zmianie i zapisaniu wejścia stary diagram pozostaje widoczny z ostrzeżeniem; CTA generuje nowy wynik, a nieudane żądanie nie przedstawia starego jako aktualnego.
- Przegląd desktop/mobile i ponowny scoped scan nie ujawniają regresji wizualnej; plan nie jest widoczny na drugim koncie.

**Implementation Note**: Po automatycznych testach obejrzeć screenshoty widoku planera na desktopie i jednej szerokości mobilnej. Potwierdzić ręcznie przypadek aktualny, nieaktualny i prywatność dwóch kont przed przejściem do macierzy stanów.

## Phase 5: Macierz stanów, kitchen sink i wizualny gate

### Overview

Pokazać wszystkie wymagane stany w jednym deterministycznym widoku deweloperskim, sprawdzić je wizualnie i zostawić guard, który utrwali kontrakt dla kolejnych agentów.

Ta faza domyka wizualny gate i utrwala kontrakt po naprawie charges UI-01–UI-04.

### Changes Required:

#### 1. Stany demonstracyjne i wizualny gate

**File**: `src/pages/dev/garden-planner-kitchen-sink.astro`

**Intent**: Ułatwić jednoczesny przegląd stanów planera bez wywoływania API i używania prywatnych danych użytkownika.

**Contract**: Kitchen sink pokazuje default, hover, focus-visible, disabled, error, empty i loading, a także success, wynik częściowy i nieaktualny diagram z ostrzeżeniem/CTA. Użyć istniejącego wzorca `crop-selection-kitchen-sink.astro`; każdy z siedmiu stanów ma być pokazany albo jawnie uzasadniony jako N/A. Wykonać i obejrzeć screenshot desktop oraz jeden mobile; nie instalować screenshot dependency.

#### 2. Reguła dla kolejnych zmian UI

**File**: `AGENTS.md`

**Intent**: Utrwalić repozytoryjny kontrakt UI dla kolejnych agentów, bez zmiany reguł zarządzanych przez 10x CLI.

**Contract**: Poza blokiem `@przeprogramowani/10x-cli` dopisać krótki guard wskazujący `src/styles/global.css`, `src/components/ui`, istniejący `Button`, zakaz literalnych kolorów/arbitrary values w widokach, obowiązek sprawdzenia komponentów przed tworzeniem własnych, sposób dodawania brakującego komponentu zgodny z repo oraz ścieżkę kitchen sink. Zachować istniejącą treść i zmiany użytkownika w `AGENTS.md`.

### Success Criteria:

#### Automated Verification:

- `npm run lint` uruchamia scoped hardcoded-value check z Phase 3 na widokach wyczyszczonych w Phase 3–4 i nie ma nieuzasadnionych trafień.

#### Manual Verification:

- Macierz 7 stanów spełnia kontrakt: default opiera się na tokenach/komponentach, hover ma widoczną zmianę, focus-visible działa z klawiatury, disabled/error/empty/loading są pokazane albo oznaczone N/A z powodem.
- Kitchen sink i końcowy screenshot planera są obejrzane na desktopie oraz jednym mobile; kontrolki mają dostępne nazwy, focus jest widoczny, a ważne rozróżnienia nie zależą wyłącznie od koloru.
- Reguła UI jest dopisana poza zarządzanym blokiem w `AGENTS.md`; żaden fragment wcześniejszych zmian użytkownika nie został nadpisany.

**Implementation Note**: To ostatnia faza wizualna. Po automatycznej weryfikacji zatrzymać się na ręczne potwierdzenie screenshotów i macierzy stanów przed zamknięciem S-04 i uruchomieniem `/10x-impl-review`.

## Follow-up S-04: końcowa obsada, katalog i czytelny diagram

> Dopisano 2026-09-30 na prośbę użytkownika. To zatwierdzony kierunek dalszej pracy, nie wykonana faza; dotychczasowe postępy 1–5 pozostają bez zmian. Research uzupełniający ma status partial, więc przed implementacją trzeba domknąć źródła i szczegóły modelu w osobnym change.

### Zakres uzgodniony

- Katalog końcowy ma zawierać 31 pozycji: usunąć fasolę szparagową i bób, rozdzielić pomidora na Faworyta i pomidora koktajlowego (palikowanego), dodać koper i szczypiorek, bez pięciu dodatkowych ziół. Zachować dotychczasowy wybór użytkownika przy zmianie identyfikatorów; rekomendowany wariant zgodności — utrzymać obecne ID pomidora dla Faworyta i nadać koktajlowemu nowe ID — wymaga sprawdzenia w implementacji.
- Dla diagramu używać wyłącznie rozstawy końcowej po przerywce lub posadzeniu rozsady. Dane o gęstości siewu i terminach siewu przechowywać oddzielnie i pokazywać informacyjnie w szczegółach wybranej rośliny; nie mogą wpływać na liczbę ani pozycje roślin w diagramie. Przykład marchewki: 3–5 cm w rzędzie i 20–30 cm między rzędami po przerywce.
- Sąsiedztwo liczyć tylko między roślinami w tej samej skrzyni/sektorze. Pozytywne relacje są priorytetem, potwierdzone negatywne odrzucają układ, a brak relacji pozostaje neutralny; relacja caution nie jest zakazem. Gdy twarde warunki i dobre relacje na to pozwalają, preferować spójne, sąsiadujące grupy zamiast bez uzasadnienia odsuwać neutralne uprawy w odległy narożnik. Nie tworzyć relacji przestrzennych między osobnymi skrzyniami.
- Diagram ma zachowywać proporcje wymiarów i centymetrową skalę, mieć subtelną siatkę (docelowo linie co 10 cm), nie nakładające się znaczniki oraz miniatury roślin dostępnych w katalogu. Legenda i nazwy upraw muszą pozostać czytelne również bez obrazu. Użytkownik powinien móc odczytać lokalne sąsiedztwa i zrozumieć, z jakiego ograniczenia lub preferencji wynika nietypowe położenie; wyjaśnienie nie może przypisywać roślinom niepotwierdzonej relacji.

### Proponowane pakiety follow-up

1. **Research i model danych:** domknąć 31 rekordów, rozdzielić końcową obsadę od siewu i terminów oraz zapisać jednostkę stanowiska i poziom pewności dla każdego rekordu.
2. **Silnik i katalog:** wprowadzić uzgodniony zestaw upraw i używać wyłącznie końcowych rozstaw; oceniać sąsiedztwo w obrębie pojedynczej przestrzeni i dodać miękką preferencję zwartego, czytelnego układu bez naruszania priorytetu relacji pozytywnych ani zakazu relacji negatywnych.
3. **Diagram i objaśnienia:** dodać fizyczną siatkę, miniatury i czytelną legendę; ujawnić lokalne sąsiedztwa oraz powód odstępstw/odległych pozycji; zachować poprawną skalę na mobile i desktopie.
4. **Weryfikacja:** powtórzyć przypadek dwóch przestrzeni 200×100 cm z miksem marchew/cebula/brokuł/czosnek 30/10/40/20, sprawdzić finalną obsadę marchewki, relacje tylko wewnątrz przestrzeni, dostępność wyjaśnień oraz screenshoty na desktopie i mobile.

### Kryteria akceptacji follow-up

- Wybór obejmuje dokładnie uzgodnione 31 pozycji, bez fasoli, bobu i nowych ziół; dotychczasowe zapisane wybory nie znikają po cichu.
- Generator rozmieszcza rośliny według końcowej obsady, a osobne informacje o siewie i terminach nie zmieniają diagramu. Brak wiarygodnej końcowej rozstawy jest widoczny jako brak danych, nie zastępowany gęstością siewu.
- Relacje między roślinami z różnych skrzyń/sektorów nie wpływają na wynik. W każdej pojedynczej przestrzeni pozytywne są preferowane, negatywne blokowane, a unknown pozostaje neutralne i może być sąsiadujące.
- Siatka jest ledwo widoczna, lecz pomaga odczytać pozycje; grafiki, nazwy i legenda są rozpoznawalne, układ nie jest spłaszczony ani napaćkany, a położenie nie pozostaje niewyjaśnioną niespodzianką.
- Testy automatyczne obejmują zgodność katalogu i danych, reguły relacji, finalną geometrię oraz brak wpływu relacji między przestrzeniami; ręczny przegląd potwierdza czytelność na telefonie i desktopie.

**Następny krok:** po dokończeniu aktualnych ręcznych bramek S-04 otworzyć follow-up jako osobny change przez standardowy łańcuch new → research → plan. Nie zmieniać poniższych checkboxów postępu ani nie oznaczać S-04 jako ukończonego na podstawie samego dopisania zakresu.

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
3. Odświeżyć stronę, zmienić i zapisać wejście; potwierdzić, że poprzedni diagram pozostaje widoczny z wyraźnym statusem nieaktualnym i CTA, a nowy wynik pojawia się po udanym przeliczeniu.
4. Obejrzeć kitchen sink i screenshoty przy szerokości desktopowej oraz mobilnej; sprawdzić klawiaturę, focus, etykiety niezależne od koloru oraz wspólny styl obu formularzy.

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

- [x] 2.1 Migracja i testy DB potwierdzają jednowierszowy, prywatny zapis planu.
- [x] 2.2 Endpoint autoryzuje użytkownika, używa jego wejść i atomowo zastępuje wynik.
- [x] 2.3 Testy DB, endpointu i unit przechodzą.

### Phase 3: Tokeny i wspólne komponenty całego `/garden`

#### Automated

- [x] 3.1 Build i lint przechodzą; lint uruchamia scoped hardcoded-value check dla strony i obu formularzy. (39e621c)
- [x] 3.2 Scan zgłasza brak nieuzasadnionych hardcoded values, a liczba kandydatów spada względem 47 linii z audytu. (39e621c)

#### Manual

- [x] 3.3 Strona i oba formularze zachowują uzgodniony motyw, wspólny `Button` i poprawne zachowanie podstawowych kontrolek. (39e621c)
- [x] 3.4 Screenshoty przed/po fazie są obejrzane na desktopie oraz jednym mobile; focus pozostaje widoczny. (39e621c)

### Phase 4: Widok planera i stan nieaktualnego planu

#### Automated

- [x] 4.1 Build, unit, DB i smoke przechodzą.
- [x] 4.2 SSR potwierdza prywatny odczyt, status bieżącego snapshotu oraz stary diagram z ostrzeżeniem/CTA po zmianie wejścia.

#### Manual

- [x] 4.3 Przykład dwóch skrzyń pokazuje automatyczny układ oraz target obok actual. — c46481a
- [x] 4.4 Pewność/braki danych i reguły sąsiedztwa są czytelne; neutralne i `caution` nie blokują, a potwierdzony negatyw wyklucza. — c46481a
- [x] 4.5 Zmiana wejścia zachowuje widoczny stary diagram jako nieaktualny; CTA tworzy nowy wynik, a plan pozostaje prywatny dla właściciela. — c46481a
- [x] 4.6 Screenshoty widoku planera są obejrzane na desktopie i jednym mobile, a scan po fazie nie pokazuje regresji. — c46481a

### Phase 5: Macierz stanów, kitchen sink i wizualny gate

#### Automated

- [x] 5.1 Lint nadal uruchamia scoped hardcoded-value check i nie zgłasza nieuzasadnionych trafień w widoku planera. — c46481a

#### Manual

- [x] 5.2 Kitchen sink pokazuje default, hover, focus-visible, disabled, error, empty i loading (albo wyjaśnia N/A), oraz sukces/częściowy/nieaktualny wynik. — c46481a
- [x] 5.3 Screenshot kitchen sink i planera przechodzi przegląd desktop/mobile, nazw kontrolek, focusu i informacji niezależnej od koloru. — c46481a
- [x] 5.4 Guard UI jest poza blokiem zarządzanym w `AGENTS.md`, a zmiany użytkownika w pliku pozostają zachowane. — c46481a
