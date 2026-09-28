# Deklarowanie udziałów upraw w procentach — plan implementacji

## Overview

Zmieniamy formularz wyboru upraw na `/garden` tak, aby dla całej działki wyrażał ręcznie zadeklarowany procentowy miks planowanej liczby roślin. Przy wczytaniu istniejące proporcje zostaną przeliczone na procenty, formularz pokaże bieżącą sumę, a zapis nie będzie możliwy dla niepustego wyboru, którego udziały nie sumują się do 100%. Nie zmieniamy API, algorytmu planowania ani schematu bazy.

## Current State Analysis

- `CropSelectionForm` wyświetla surowe dodatnie wartości `proportion`, dodaje nową uprawę z wartością `1` i zapisuje liczby przez istniejące `/api/garden-crops`.
- API i RPC zachowują liczby bez normalizacji; obecny kontrakt API sprawdza dodatniość, ale nie sumę. To pozostaje bez zmian.
- Istniejące wartości są wagami względnymi: 3:1 odpowiada 75%:25%. Przy wczytaniu trzeba więc normalizować udział względem sumy, a nie tylko zmienić etykietę pola.
- Pusty wybór jest prawidłowym poleceniem wyczyszczenia zapisanych upraw. Musi pozostać możliwy po udanym odczycie, ale nie może omijać istniejącej blokady edycji przy błędzie odczytu.
- W repozytorium są testy jednostkowe oraz smoke test obejmujący zapis, ponowny odczyt, zmianę wymiarów i czyszczenie. Nie ma zadeklarowanego testu screenshotowego.
- Skrypt `test:unit` jawnie wylicza pliki testowe, dlatego trzeba dopisać do niego nowy test reguł procentowych. Projekt używa Astro `output: "server"` z adapterem Cloudflare.
- Widok ma istniejący ciemny motyw ogrodu. Zmiana ma pozostać w jednym widoku, bez wprowadzania palety, biblioteki ani szerokiego refaktoru komponentów.

## Desired End State

Użytkownik widzi procenty dla całej działki jako deklarację docelowego względnego udziału liczby roślin, może zmieniać każdy udział niezależnie i stale widzi sumę. Formularz zapisuje niepusty wybór tylko przy sumie dokładnie 100,00% i dodatnim udziale każdej uprawy; nie zmienia automatycznie innych wartości. Istniejące wagi po wczytaniu są pokazane jako znormalizowane procenty, a zapis używa istniejącego pola `proportion` bez zmian API lub bazy.

### Key Discoveries:

- `src/components/garden/CropSelectionForm.tsx` odpowiada za inicjalny stan, edycję, usuwanie i zapis formularza.
- `src/lib/garden-crop-selection.ts` jest kontraktem walidacji API; zachowujemy go bez wymogu sumy 100%.
- `src/pages/garden.astro` przekazuje zapisane wartości jako tekst, a `scripts/smoke.mjs` obecnie oczekuje ich surowego wyświetlenia.
- Wartości procentowe będą miały dokładność do 0,01 punktu procentowego; normalizacja istniejących wag musi zaokrąglać do setnych tak, aby widoczne udziały sumowały się dokładnie do 100,00%.
- Obecny wybór to intencja użytkownika dotycząca liczby roślin, nie gwarancja, że przyszły generator zrealizuje ją geometrycznie. Regułę wykonalności i ewentualne ostrzeżenie rozstrzyga osobno S-04.

## What We're NOT Doing

- Nie zmieniamy algorytmu układania upraw, przydziału do grządek ani obliczania rzeczywistej liczby roślin.
- Nie dodajemy do API ani bazy walidacji sumy 100%, nie zmieniamy RPC, schematu ani migracji.
- Nie dodajemy ostrzeżenia o celu niemożliwym do spełnienia geometrycznie — to odpowiedzialność przyszłego generatora S-04.
- Nie automatycznie przeliczamy pozostałych udziałów po dodaniu, edycji lub usunięciu uprawy.
- Nie migrujemy danych, nie zmieniamy konfiguracji wymiarów działki i nie wykonujemy ogólnego restyle’u ani migracji wszystkich przycisków/tokenów.

## Implementation Approach

W jednej fazie dodajemy mały, czysty moduł do konwersji zapisanych wag na procenty i walidacji udziałów formularza. Wartości w UI są obsługiwane w setnych punktu procentowego; konwersja istniejących wag rozdziela zaokrąglenia metodą największych reszt, z kolejnością wierszy jako deterministycznym rozstrzygnięciem remisu, dzięki czemu wyświetlane udziały sumują się do 100,00%. Formularz pokazuje procentowy input i sumę, nie równoważy pól automatycznie, a blokadę zapisu opiera na tej samej walidacji. Przy zapisie wysyła wartości procentowe jako dodatnie liczby przez obecny endpoint. Testy jednostkowe obejmą konwersję i reguły formularza; smoke test zachowa kontrolę istniejącego przepływu zapisu, ponownego odczytu i czyszczenia. Wizualny gate wykorzysta lokalny, niedostępny w produkcji widok kontrolny stanów formularza oraz zrzuty desktop/mobile.

## Critical Implementation Details

Błąd wczytania musi nadal blokować edycję i zapis — pusty stan oznacza czyszczenie wyłącznie po udanym odczycie. Nie zmieniaj walidatora endpointu, ponieważ jego istniejący kontrakt jest szerszy niż ograniczenie interfejsu.

## Phase 1: Procentowy miks upraw dla całej działki

### Overview

Wprowadzić normalizację istniejących proporcji i procentowy formularz z ręczną walidacją 100%, zachować istniejące ścieżki zapisu/odczytu/wyczyszczenia oraz potwierdzić zachowanie testami i zrzutami widoku.

### Changes Required:

#### 1. Reguły procentowego miksu

**File**: `src/lib/garden-crop-percentages.ts` (nowy)

**Intent**: Odseparować od kontraktu API przeliczenie zapisanych wag na udziały procentowe oraz reguły poprawności używane przez UI. Zapewnić powtarzalny, dokładny do 0,01% wynik dla miksu istniejących wag.

**Contract**: Udostępnić czyste funkcje do normalizacji dodatnich wag do procentów sumujących się do 100,00% oraz do sprawdzenia udziałów formularza w setnych punktu procentowego. Dla niepustej listy zapis jest poprawny tylko wtedy, gdy każdy udział jest dodatni i suma wynosi 100,00%; pusta lista pozostaje dozwolona do czyszczenia. Rozdział zaokrągleń do setnych ma używać największych reszt z deterministycznym rozstrzyganiem remisów według kolejności wejściowej.

#### 2. Formularz wyboru upraw

**File**: `src/components/garden/CropSelectionForm.tsx`

**Intent**: Zastąpić surowe proporcje deklaracjami procentowymi dla całej działki, pokazać sumę i pozwolić użytkownikowi samodzielnie doprowadzić miks do 100%.

**Contract**: Przy wczytaniu normalizować zapisane `proportion`; pole opisuje udział procentowy, a nowa uprawa otrzymuje domyślnie 1%. Edycja, dodanie i usunięcie nie mogą zmieniać innych udziałów. Pokazywać sumę w procentach; nieprawidłowa suma lub niedodatnie/puste pole blokuje zapis niepustej listy. Pusta lista nadal może być zapisana po udanym odczycie. Zachować istniejące komunikaty, blokadę podczas zapisu i blokadę edycji/zapisu po błędzie odczytu. Wysyłać liczby procentowe przez istniejący endpoint, bez zmian jego payload contractu.

#### 3. Testy logiki i istniejącego przepływu

**Files**: `src/lib/garden-crop-percentages.test.ts` (nowy), `scripts/smoke.mjs`

**Intent**: Utrwalić matematyczne reguły procentów i wykrywać regresje w istniejącym przepływie formularza.

**Contract**: Testy jednostkowe pokrywają m.in. 3:1 → 75,00%:25,00%, 2:0,75 → 72,73%:27,27%, deterministyczne sumowanie po zaokrągleniu, brak automatycznego bilansowania, dodatniość, sumę 100,00% oraz pustą listę. Smoke test sprawdza, że istniejące proporcje zapisane przez API są wyświetlone jako znormalizowane procenty, a zapis, ponowny odczyt przy zmianie wymiarów i czyszczenie nadal działają. Istniejący test walidatora API nadal sprawdza dodatnie liczby i pustą listę bez nowego wymagania sumy.

#### 4. Lokalny wizualny gate

**File**: `src/pages/dev/crop-selection-kitchen-sink.astro` (nowy, wyłącznie development)

**Intent**: Umożliwić jednoczesny przegląd kluczowych stanów formularza bez zależności od prywatnych danych użytkownika lub prawdziwego zapisu.

**Contract**: Lokalny widok prezentuje stany default, hover, focus, disabled, error, empty i loading formularza. W trybie produkcyjnym zwraca 404; używa `import.meta.env.PROD` oraz on-demand route zgodnego z serwerowym outputem projektu. Zrzuty kontrolne wykonuje się na desktopie i jednym mobilnym viewportcie; zachowują istniejący motyw i czytelność komunikatów.

#### 5. Rejestracja testu jednostkowego

**File**: `package.json`

**Intent**: Włączyć nowy test procentowych reguł do standardowego polecenia testów jednostkowych repozytorium.

**Contract**: Dodać `src/lib/garden-crop-percentages.test.ts` do istniejącej komendy `test:unit`; nie dodawać zależności ani zmieniać pozostałych skryptów.

### Success Criteria:

#### Automated Verification:

- Testy jednostkowe przechodzą: `npm run test:unit`.
- Build produkcyjny przechodzi: `npm run build`.
- Smoke test projektu przechodzi: `npm run smoke`, z oczekiwaniami na znormalizowane procenty; zapis, ponowny odczyt, zachowanie po zmianie wymiarów i czyszczenie pozostają poprawne.

#### Manual Verification:

- W formularzu edycja jednej uprawy nie zmienia innych; suma aktualizuje się na żywo, zapis jest zablokowany poza 100,00% lub przy niedodatnim udziale, a usunięcie nie równoważy pozostałych wartości.
- Po udanym odczycie można zapisać pustą listę, natomiast po błędzie odczytu edycja i zapis nadal są zablokowane oraz widoczny jest błąd.
- Zrzuty widoku kontrolnego obejmują wszystkie wymagane stany na desktopie i telefonie; pola, suma, błędy i przyciski pozostają czytelne w istniejącym motywie.
- Po uruchomieniu produkcyjnego preview lokalny widok kontrolny odpowiada statusem 404.

## Testing Strategy

### Unit Tests:

- Normalizacja wag dodatnich, w tym 3:1 oraz 2:0,75; wynik zawsze sumuje się do 100,00% mimo zaokrągleń.
- Walidacja sumy z dokładnością 0,01%, udziałów dodatnich, pustych/niepoprawnych pól i pustej listy.
- Brak mutacji innych udziałów jest dodatkowo weryfikowany w manualnym przepływie formularza.

### Integration Tests:

- Istniejący smoke test: bezpośredni zapis proporcji przez API, ich prezentacja jako procentów w UI, ponowny odczyt przy zmianie wymiarów oraz usunięcie całego wyboru.
- Istniejąca walidacja API i testy SQL pozostają bez zmian w zakresie wymogu sumy; potwierdzają brak rozszerzenia kontraktu backendowego.

### Manual Testing Steps:

1. Otworzyć `/garden` z istniejącymi wagami 3 i 1; potwierdzić 75,00% oraz 25,00% i sumę 100,00%.
2. Zmienić jeden udział bez zmiany pozostałych, sprawdzić sumę, stan zapisu przed/po osiągnięciu 100,00%, a następnie zapisać i odświeżyć widok.
3. Usunąć uprawę, potwierdzić brak automatycznego przeliczenia pozostałych pól; osobno zapisać pusty wybór po udanym odczycie.
4. W lokalnym widoku kontrolnym przejrzeć stany default, hover, focus, disabled, error, empty i loading na szerokości desktopowej oraz mobilnej.
5. Zasymulować błąd odczytu upraw i potwierdzić widoczny komunikat oraz zablokowane modyfikacje i zapis.

## Performance Considerations

Konwersja i walidacja operują na krótkiej liście wybranych upraw, więc nie zmieniają profilu wydajności strony ani liczby żądań sieciowych.

## Migration Notes

Nie ma migracji. Dotychczasowe dodatnie wagi są normalizowane przy wczytaniu do procentów; zapisane udziały trafiają do istniejącego pola numerycznego `proportion`. Po zapisie skala liczb w bazie może być inna niż historycznie (np. 3:1 staje się 75:25), lecz relacja pozostaje zachowana. API/RPC nadal akceptują dodatnie liczby bez walidacji sumy.

## References

- Research: `context/changes/declare-crop-mix-percentages/research.md`
- Istniejący formularz: `src/components/garden/CropSelectionForm.tsx`
- Walidacja API: `src/lib/garden-crop-selection.ts`
- Widok i dane początkowe: `src/pages/garden.astro`
- Endpoint zapisu: `src/pages/api/garden-crops.ts`
- Testy smoke: `scripts/smoke.mjs`
- Kierunek i ograniczenia generatora: `context/changes/generate-garden-layout/frame.md`, `context/changes/generate-garden-layout/research.md`
- Astro — [zmienne środowiskowe](https://docs.astro.build/en/guides/environment-variables/) oraz [on-demand rendering i odpowiedzi 404](https://docs.astro.build/en/guides/on-demand-rendering/)

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Procentowy miks upraw dla całej działki

#### Automated

- [x] 1.1 Testy jednostkowe przechodzą: `npm run test:unit`. — bee764e
- [x] 1.2 Build produkcyjny przechodzi: `npm run build`. — bee764e
- [x] 1.3 Smoke test projektu przechodzi: `npm run smoke`, z oczekiwaniami na znormalizowane procenty; zapis, ponowny odczyt, zachowanie po zmianie wymiarów i czyszczenie pozostają poprawne. — bee764e

#### Manual

- [x] 1.4 W formularzu edycja jednej uprawy nie zmienia innych; suma aktualizuje się na żywo, zapis jest zablokowany poza 100,00% lub przy niedodatnim udziale, a usunięcie nie równoważy pozostałych wartości. — bee764e
- [x] 1.5 Po udanym odczycie można zapisać pustą listę, natomiast po błędzie odczytu edycja i zapis nadal są zablokowane oraz widoczny jest błąd. — bee764e
- [x] 1.6 Zrzuty widoku kontrolnego obejmują wszystkie wymagane stany na desktopie i telefonie; pola, suma, błędy i przyciski pozostają czytelne w istniejącym motywie. — bee764e
- [x] 1.7 Po uruchomieniu produkcyjnego preview lokalny widok kontrolny odpowiada statusem 404. — bee764e
