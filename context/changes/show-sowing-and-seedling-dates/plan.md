# Terminy siewu i prace sezonowe — Plan implementacji

## Overview

S-06 zweryfikuje i uporządkuje istniejące okna terminów dla aktywnych upraw, a następnie udostępni je zarówno w szczegółach upraw, jak i w sekcji prac przy wygenerowanym planie. Sekcja pokaże prace przypadające na bieżący i następny miesiąc; przy braku wystarczającego źródła aplikacja pokaże brak potwierdzonego terminu i informację o weryfikacji.

## Current State Analysis

- Model `SeasonWindow` zawiera miesiące, metodę, warunek, źródła i pewność. Okna są zapisane bezpośrednio w katalogu upraw ([crop-catalog.ts:118–147](../../../src/data/crop-catalog.ts#L118), [crop-catalog.ts:575–1232](../../../src/data/crop-catalog.ts#L575)).
- Katalog zawiera 31 aktywnych rekordów; obecny walidator kontroluje m.in. liczbę rekordów, referencje źródeł, warunek i zakres miesiąca, ale nie dowodzi, że konkretne źródło uzasadnia konkretny termin ([crop-catalog.ts:1825–1840](../../../src/data/crop-catalog.ts#L1825), [crop-catalog.ts:1909–1916](../../../src/data/crop-catalog.ts#L1909)).
- Formularz wyboru pokazuje już wszystkie zapisane terminy w zwijanych szczegółach uprawy wraz z metodą, miesiącami, warunkiem, pewnością i odnośnikami. Pokazuje również ostrzeżenie o lokalnej weryfikacji ([CropSelectionForm.tsx:120–128](../../../src/components/garden/CropSelectionForm.tsx#L120), [CropSelectionForm.tsx:168–191](../../../src/components/garden/CropSelectionForm.tsx#L168)).
- Wygenerowany wynik ma `cropSummaries`, a `GardenPlanner` przekazuje go do widoku układu. Wynik nie zawiera kalendarza sezonowego; w tym przepływie nie znaleziono implementacji przypomnień ([garden-layout.ts:119–124](../../../src/lib/garden-layout.ts#L119), [GardenPlanner.tsx:213–227](../../../src/components/garden/GardenPlanner.tsx#L213)).
- Research rekomenduje aktualne polskie źródło instytucjonalne/ODR dla każdej uprawy, z regionalnym i produkcyjnym kontekstem, kontrolę krzyżową starszymi tabelami CDR oraz jawny brak/niski poziom pewności tam, gdzie materiał nie wystarcza ([research.md](./research.md)). Adjudykacja wszystkich rekordów pozostaje pracą tej fazy.
- Testy kontraktu katalogu znajdują się w `src/data/crop-catalog.test.ts`; obecny zestaw unit uruchamia je poleceniem `npm run test:unit`. Test plan zakazuje używania bieżącego katalogu jako niezależnego źródła oczekiwań ([test-plan.md:94–101](../../foundation/test-plan.md#L94)).

## Desired End State

Każde aktywne okno sezonowe jest oparte na sprawdzonym źródle albo nie jest przedstawiane jako potwierdzona praca; użytkownik widzi źródło, metodę, orientacyjne miesiące, warunek i poziom pewności. W szczegółach upraw nadal widać pełne okna, a przy wygenerowanym planie pojawia się lista prac dla bieżącego i kolejnego miesiąca, wynikająca z upraw zawartych w wyświetlanym planie. Brak potwierdzonego terminu pozostaje jawny i nie tworzy przypomnienia.

### Key Discoveries:

- Dla listy prac można wykorzystać `cropSummaries` zapisanego wyniku bez zmiany schematu bazy, o ile widok wiąże ją z tym samym planem, który jest aktualnie pokazywany ([GardenPlanner.tsx:213–227](../../../src/components/garden/GardenPlanner.tsx#L213)).
- Zmiana wyboru upraw oznacza dotychczasowy plan jako nieaktualny; lista musi podążać za widocznym wynikiem i nie udawać, że stary układ opisuje nowe wejścia ([GardenPlanner.tsx:67–100](../../../src/components/garden/GardenPlanner.tsx#L67)).
- Wytyczna test-plan wymaga niezależnych, ręcznie ustalonych oczekiwań i uzupełnienia cookbooku dla nowego wzorca ([test-plan.md:94–101](../../foundation/test-plan.md#L94)).

## What We're NOT Doing

- Nie wysyłamy powiadomień push ani e-mail i nie prosimy o uprawnienia systemowe. Przypomnienie w S-06 oznacza listę prac widoczną w aplikacji.
- Nie dodajemy widoku tygodniowego, planowania upraw następczych (FR-009), dokładnych dat dziennych, pogody ani regionalizacji według lokalizacji użytkownika.
- Nie zmieniamy generatora geometrii, zapisanej struktury planu ani API/bazy danych, jeśli listę da się wyliczyć z `cropSummaries` pokazywanego planu.
- Nie pokazujemy niepopartych przybliżeń jako potwierdzonych terminów. Brak wystarczających danych oznacza brak terminu w liście oraz jawny komunikat o weryfikacji.
- Nie dodajemy osobnego interfejsu zarządzania przypomnieniami ani stanu odczytania/zamknięcia przypomnienia.

## Implementation Approach

W pierwszej kolejności sprawdzić każde istniejące okno dla aktywnych upraw w odniesieniu do źródła, metody uprawy i warunku. Skorygować lub usunąć niewystarczająco poparte okna, zachować właściwy poziom pewności i flagę lokalnej weryfikacji oraz utrzymać działające odnośniki źródłowe. Następnie dodać deterministyczną logikę wybierającą okna obejmujące bieżący lub następny miesiąc oraz użyć jej w komponencie listy w widoku wygenerowanego planu. Testy kontraktowe mają korzystać z niezależnych, ręcznie sprawdzonych przykładów, a nie z kopii bieżącego katalogu.

## Critical Implementation Details

Widok planu może zachować poprzedni wynik po zmianie wejść i oznaczyć go jako nieaktualny. Lista prac musi korzystać z `cropSummaries` tego samego wyniku i pozostawać w kontekście jego statusu; nie może po cichu przełączać się na właśnie edytowane wejścia. Obliczenie bieżącego i kolejnego miesiąca powinno używać czasu lokalnego przeglądarki, a logika kalendarza powinna przyjmować jawny miesiąc referencyjny, aby testy nie zależały od dnia uruchomienia.

## Faza 1: Zweryfikowane terminy i lista prac sezonowych

### Overview

Adjudykacja istniejących danych sezonowych, jawne reprezentowanie braków, testy kontraktu oraz spójna prezentacja terminów w szczegółach upraw i w liście prac dla bieżącego/następnego miesiąca w wygenerowanym planie.

### Changes Required:

#### 1. Katalog i źródła terminów

**File**: `src/data/crop-catalog.ts`

**Intent**: Zweryfikować okna wszystkich aktywnych rekordów względem dostępnych polskich źródeł i poprawić ich miesiące, metodę, warunek, źródła, pewność oraz stan lokalnej weryfikacji. Okna bez wystarczającego uzasadnienia usunąć z potwierdzonych danych i pozostawić uprawę z jawną informacją o potrzebie weryfikacji.

**Contract**: Zachować `SeasonWindow` jako kontrakt daty/miesiąca, metody, warunku, `sourceIds` i `confidence`, chyba że audyt wykaże konieczność jawnej informacji per okno; każda referencja źródła musi istnieć w `CROP_SOURCES`. Walidacja strukturalna nie może być opisana jako agronomiczne potwierdzenie terminu.

#### 2. Niezależne testy danych katalogu

**File**: `src/data/crop-catalog.test.ts`

**Intent**: Dodać przykłady terminów zweryfikowane niezależnie od katalogu oraz przypadki jawnego braku potwierdzonego terminu i niewłaściwych referencji.

**Contract**: Testy sprawdzają ręcznie zrecenzowane wartości/method/source/confidence dla reprezentatywnych metod i brzegów sezonu; nie wyprowadzają oczekiwań przez odczyt tego samego `CROP_CATALOG`. Jeżeli doprecyzowano walidator, testy odróżniają integralność strukturalną danych od prawdziwości zaleceń.

#### 3. Deterministyczne wyznaczanie nadchodzących prac

**File**: `src/lib/season-work-schedule.ts` (nowy)

**Intent**: Wyznaczyć orientacyjne prace wynikające z okien upraw zawartych w wygenerowanym planie, dla bieżącego i kolejnego miesiąca.

**Contract**: Logika jest czysta i przyjmuje jawny miesiąc referencyjny wraz z uprawami/oknami planu; zwraca pozycje z uprawą, metodą, opisem warunku, źródłami, pewnością i miesiącem lub miesiącami, których dotyczy. Nie tworzy pozycji dla brakujących/niepotwierdzonych okien i nie wyznacza dokładnego dnia. Gdy bieżący i następny miesiąc są puste, może wskazać najbliższy późniejszy miesiąc z potwierdzonymi pracami. Nie zależy od zegara systemowego w testach.

#### 4. Testy listy prac sezonowych

**File**: `src/lib/season-work-schedule.test.ts` (nowy)

**Intent**: Zabezpieczyć filtrowanie okien dla dwóch kolejnych miesięcy, brak powielonych pozycji, brak danych potwierdzonych i przejście grudzień–styczeń.

**Contract**: Przykłady przekazują stały miesiąc referencyjny i jawne fixture z oczekiwanymi wynikami; testy nie odczytują aktualnego czasu ani katalogu jako oracle.

#### 5. Szczegóły terminów uprawy

**File**: `src/components/garden/CropSelectionForm.tsx`

**Intent**: Zachować istniejące szczegóły terminów i upewnić się, że zatwierdzone okna są wyraźnie odróżnione od braku potwierdzonego terminu oraz od lokalnej uwagi walidacyjnej.

**Contract**: Dla upraw bez potwierdzonego okna sekcja ma czytelny komunikat o braku terminu i informację o weryfikacji; przy potwierdzonym oknie UI nadal pokazuje metodę, miesiące, warunek, pewność oraz linki źródłowe. Style korzystają z tokenów i wspólnych komponentów repozytorium.

#### 6. Lista prac przy wygenerowanym planie

**File**: `src/components/garden/GardenPlanner.tsx`

**Intent**: Dodać do istniejącego widoku wyniku sekcję przypomnień w aplikacji, pokazującą prace z bieżącego i kolejnego miesiąca dla upraw z wyświetlanego planu.

**Contract**: Źródłem listy jest `plan.cropSummaries` aktualnie wyświetlanego `planState.plan`; przy nieaktualnym planie lista nadal odnosi się do tego widocznego wyniku i pozostaje obok jego ostrzeżenia o nieaktualności. Pusty okres ma jawny komunikat oraz osobny komunikat wskazujący najbliższy późniejszy miesiąc z potwierdzonymi pracami, jeśli taki istnieje. Uprawy bez potwierdzonych terminów mają jawny komunikat. Nie wysyła się push/e-mail i nie dodaje się stanu odczytania.

#### 7. Uruchamianie nowego testu i cookbook

**File**: `package.json`

**Intent**: Włączyć testy nowej logiki sezonowej do standardowej komendy jednostkowej.

**Contract**: `npm run test:unit` uruchamia `src/lib/season-work-schedule.test.ts` razem z istniejącą listą testów.

**File**: `context/foundation/test-plan.md`

**Intent**: Uzupełnić §6 o kanoniczny wzorzec weryfikacji danych i logiki terminów sezonowych, aby kolejne zmiany stosowały ten sam niezależny oracle.

**Contract**: Dodać wpis cookbook z lokalizacją testów, nazewnictwem, referencyjnymi przypadkami i komendą `npm run test:unit`; nie zmieniać zamrożonych sekcji strategii ani bram jakości.

### Success Criteria:

#### Automated Verification:

- Niezależne testy katalogu potwierdzają ręcznie zweryfikowane przykłady terminów, źródeł i pewności oraz jawny przypadek bez potwierdzonego terminu.
- Testy helpera potwierdzają wybór bieżącego i następnego miesiąca, brak duplikatów, brak niepotwierdzonych prac, przejście grudzień–styczeń oraz najbliższy późniejszy miesiąc po pustym okresie dla jawnego miesiąca referencyjnego.
- `npm run test:unit` przechodzi z nowymi testami sezonowymi włączonymi do skryptu.
- `npm run lint`, `npx astro check` i `npm run build` przechodzą po zmianach UI i katalogu.
- §6 cookbook w `context/foundation/test-plan.md` wskazuje właściwe testy, niezależne źródło oczekiwań i komendę uruchomienia.

#### Manual Verification:

- Na `/garden` szczegóły upraw pokazują źródło, metodę, miesiące, warunek i pewność, a uprawa bez potwierdzonego terminu pokazuje jawny brak i flagę weryfikacji.
- Po wygenerowaniu planu lista prac pokazuje wyłącznie terminy dla upraw widocznego planu i bieżącego/następnego miesiąca; zmiana wejść nie przedstawia starego wyniku jako aktualnego, a gdy ten okres jest pusty, osobny komunikat wskazuje miesiąc najbliższych późniejszych prac i ich źródła.
- Ręczny przegląd adjudykacji potwierdza, że każdy pozostawiony termin ma odpowiednie źródło i kontekst, a niewystarczające źródła nie zostały pokazane jako potwierdzona praca.

**Implementation Note**: Po zakończeniu fazy i przejściu automatycznych weryfikacji zatrzymać się i poprosić użytkownika o ręczne potwierdzenie testu widoku oraz przeglądu źródeł przed uznaniem fazy za domkniętą.

## Testing Strategy

### Unit Tests:

- Ręcznie zweryfikowane przypadki katalogu dla siewu bezpośredniego, rozsady/sadzenia, warunków uprawy oraz jawnego braku wystarczającego źródła.
- Czysta logika wyboru prac z jawnym miesiącem testowym, w tym dwa kolejne miesiące, granica roku, kilka okien tej samej uprawy i brak okna.
- Strukturalna walidacja katalogu dla granic miesięcy, metod i referencji źródeł, bez sugerowania, że sama walidacja dowodzi zgodności agronomicznej.

### Integration Tests:

- Nie dodawać testu bazy/API: plan korzysta z identyfikatorów upraw z istniejącego podsumowania wyniku, a okna pochodzą ze statycznego katalogu.
- Jeśli montowanie widoku ujawni lukę niechronioną testem jednostkowym, dodać najtańszy test kontraktowy komponentu dostępny w repozytorium; nie tworzyć infrastruktury e2e tylko dla tej listy.

### Manual Testing Steps:

1. Otworzyć `/garden`, rozwinąć szczegóły uprawy z potwierdzonym terminem i sprawdzić metodę, miesiące, warunek, pewność i odnośnik do źródła.
2. Sprawdzić uprawę bez potwierdzonego terminu i potwierdzić, że nie tworzy pozycji przypomnienia.
3. Wygenerować plan z kilkoma uprawami mającymi różne terminy; porównać listę z bieżącym i następnym miesiącem oraz `cropSummaries` wyniku. Gdy oba miesiące są puste, sprawdzić osobny komunikat z najbliższym późniejszym miesiącem prac.
4. Zmienić zapisany wybór tak, by plan stał się nieaktualny; potwierdzić, że widoczna lista nadal opisuje stary pokazany wynik wraz z ostrzeżeniem, a po przeliczeniu odpowiada nowemu planowi.
5. Gdy w bieżącym i kolejnym miesiącu nie ma prac, potwierdzić czytelny komunikat pustego stanu.

## Performance Considerations

Katalog jest ograniczony do stałej listy 31 aktywnych upraw, więc filtrowanie okien z `cropSummaries` jest małe i nie wymaga zapytań sieciowych ani zmian zapisu planu. Lista powinna być wyliczana z aktualnego wyniku i odświeżana przy zmianie wyświetlanego planu/miesiąca.

## Migration Notes

Nie przewiduje się migracji bazy. Zmiana obejmuje statyczny katalog i widok; nie zmienia serializowanego formatu planu ani danych istniejących kont.

## References

- Related research: `context/changes/show-sowing-and-seedling-dates/research.md`
- Product requirements: `context/foundation/prd.md` — FR-008, US-01.
- Roadmap: `context/foundation/roadmap.md` — S-06.
- Test strategy: `context/foundation/test-plan.md` — §2 risk #6, §5 gates, §6 cookbook.
- Existing terms UI: `src/components/garden/CropSelectionForm.tsx:120–191`.
- Current plan surface: `src/components/garden/GardenPlanner.tsx:213–227`.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Zweryfikowane terminy i lista prac sezonowych

#### Automated

- [x] 1.1 Niezależne testy katalogu potwierdzają ręcznie zweryfikowane przykłady terminów, źródeł i pewności oraz jawny przypadek bez potwierdzonego terminu.
- [x] 1.2 Testy helpera potwierdzają wybór bieżącego i następnego miesiąca, brak duplikatów, brak niepotwierdzonych prac, przejście grudzień–styczeń oraz najbliższy późniejszy miesiąc po pustym okresie dla jawnego miesiąca referencyjnego.
- [x] 1.3 `npm run test:unit` przechodzi z nowymi testami sezonowymi włączonymi do skryptu.
- [x] 1.4 `npm run lint`, `npx astro check` i `npm run build` przechodzą po zmianach UI i katalogu.
- [x] 1.5 §6 cookbook w `context/foundation/test-plan.md` wskazuje właściwe testy, niezależne źródło oczekiwań i komendę uruchomienia.

#### Manual

- [x] 1.6 Na `/garden` szczegóły upraw pokazują źródło, metodę, miesiące, warunek i pewność, a uprawa bez potwierdzonego terminu pokazuje jawny brak i flagę weryfikacji.
- [x] 1.7 Po wygenerowaniu planu lista prac pokazuje wyłącznie terminy dla upraw widocznego planu i bieżącego/następnego miesiąca; zmiana wejść nie przedstawia starego wyniku jako aktualnego, a gdy oba miesiące są puste, osobny komunikat wskazuje najbliższy późniejszy miesiąc prac i linki źródeł.
- [x] 1.8 Ręczny przegląd adjudykacji potwierdza, że każdy pozostawiony termin ma odpowiednie źródło i kontekst, a niewystarczające źródła nie zostały pokazane jako potwierdzona praca.
