# Czytelne skrzynie i działające zakładki ogrodu — plan implementacji

## Overview

Uczytelnić główny dashboard ogrodu przez ilustrację skrzyń w rzucie z góry oraz dopracować wizualny i interakcyjny kontrakt trzech istniejących zakładek. Kierunek rzutu z góry został wybrany przez użytkownika; plan zachowuje geometrię, URL-e, zapisy i mobilne powiększanie.

## Current State Analysis

- `/dashboard` już renderuje osobne widoki „Mój ogród”, „Sektory” i „Warzywa” jako linki z adresami `/dashboard`, `/dashboard?tab=sectors` i `/dashboard?tab=crops`; aktywny link ma `aria-current="page"` (`src/pages/dashboard.astro:118-135,164-172`).
- Skrzynka to obecnie płaski diagram SVG z obrysem, siatką i małymi glyphami atlasu na pozycjach wyliczonych z centymetrowej projekcji (`src/components/garden/GardenLayoutView.tsx:141-225`). Gęsty przykład powtarzających się glyphów jest trudny do szybkiego rozpoznania.
- Widok mobilny ma już dialog powiększenia, przewijanie, zamknięcie klawiszem Escape i przywracanie fokusu (`src/components/garden/GardenLayoutView.tsx:231-344`).
- Design system jest w `src/styles/global.css`; zawiera role botanical light, w tym `--app-soil`, oraz ich publikację dla Tailwind (`src/styles/global.css:5-49,117-155`). `AGENTS.md` już określa użycie tokenów, współdzielonych komponentów oraz kitchen sinka.
- Istniejący `src/pages/dev/garden-planner-kitchen-sink.astro` zawiera deterministyczne demonstracje default, hover, focus-visible, disabled, error, empty i loading oraz przykłady current, partial i stale. To baza do wizualnego gate’u, nie źródło prywatnych danych.

## Desired End State

Dashboard pokazuje skrzynie jako lekkie, rozpoznawalne grządki oglądane z góry: z naturalną ramą i podłożem, czytelną obsadą i nadal precyzyjnym położeniem każdej rośliny. Na telefonie skrzynkę można powiększyć, przesuwać w obu osiach i zamknąć, wracając do miejsca otwarcia.

Zakładki pozostają widoczne, klikalne i adresowalne bezpośrednim URL-em; aktywny stan, fokus, zapis sektorów i wynik zapisu warzyw pozostają czytelne. Stan docelowy jest pokazany w kitchen sinku i na zrzutach dashboardu w desktopie oraz na telefonie.

### Key Discoveries:

- Rozstrzygnięty kierunek wizualny: rzut skrzynki z góry; użytkownik odrzucił izometryczny wariant (`context/changes/garden-bed-visuals-tabs/research.md`, „Open Questions”).
- Projektowane taby są linkami nawigacyjnymi z własnymi adresami, nie klientowym `tablist`; należy zachować bezpośrednie wejścia i historię przeglądarki (`src/pages/dashboard.astro:132-172`).
- Pozycje są pozycjami domenowymi w centymetrach; ich projekcja i dialog mobilny są oddzielone od warstwy prezentacji (`src/components/garden/GardenLayoutView.tsx:141-225,231-344`).
- Zapis sektorów przekierowuje do wybranej zakładki sektorów z komunikatem; zapis warzyw korzysta z JSON i wyniku formularza (`src/pages/api/garden.ts:11,91`, `src/pages/api/garden-crops.ts:18-43`, `src/components/garden/CropSelectionForm.tsx:269-293`).

## What We're NOT Doing

- Zmiany algorytmu, geometrii rozmieszczenia, współrzędnych, modelu danych, bazy, payloadów API, prywatności ani logiki zapisu.
- Zastępowania linków zakładek klientowym `tablist` ani dodawania nowych zakładek.
- Projektu izometrycznego, nowych funkcji edycji położeń roślin, nowej biblioteki UI albo nowych ilustracyjnych zależności.
- Zmian landing page, logowania, rejestracji ani całego produktu poza dashboardem ogrodu.

## Implementation Approach

W trzech etapach: najpierw kontrakt tokenów dla ramy i podłoża skrzynki, następnie poprawa pojedynczego widoku i zakładek bez naruszania istniejących kontraktów, a na końcu stany, wizualny gate oraz utrwalenie reguły UI. Każda faza wizualna dostarcza zrzuty desktop i mobile; po fazie 2 implementacja zatrzymuje się na manualną akceptację użytkownika przed końcową fazą stanów.

## Charge Coverage

- Brak wizualnej bryły skrzynki (`research.md`, Charge 1) → Phase 2, warstwa ilustracyjna.
- Powtarzalne, mało czytelne glyphy (`research.md`, Charge 2) → Phase 2, czytelność obsady.
- Kontrakt nawigacji i aktywnego stanu (`research.md`, Charge 3) → Phase 2, linki i wizualny stan; Phase 3, ręczne sprawdzenie tras i zapisów.

## Critical Implementation Details

### User experience spec

Przy zmianie warstwy SVG zachować centymetrową projekcję, środek i skalę markerów, ich opisy dostępności oraz aktualną interakcję powiększenia. Tabów nie symulować rolą `tab`; URL-e, `aria-current="page"`, zapis i powrót do właściwego widoku stanowią zachowanie do zachowania.

## Phase 1: Kontrakt tokenów dla skrzynki

### Overview

Ustalić role semantyczne potrzebne do drewnianej ramy i powierzchni ziemi oraz zapisać zatwierdzoną botaniczną paletę dla dalszych faz. Rozszerzyć istniejący system tylko o brakujące role.

### Changes Required:

#### 1. Role kolorów diagramu

**File**: `src/styles/global.css`, `context/changes/garden-bed-visuals-tabs/design/tokens.md`

**Intent**: Dodać brakujące semantyczne role wyglądu skrzynki, by warstwa drewna i podłoża była czytelna i spójna z jasnym, naturalnym interfejsem. Najpierw wykorzystać istniejące wartości, takie jak `--app-soil`; nową wartość wprowadzić tylko dla roli bez odpowiedniego tokenu.

**Contract**: Każda nowa wartość mieszka w `:root`, jest publikowana przez `@theme inline`, ma nazwę roli zamiast nazwy koloru i ma udokumentowane źródło obok definicji. `design/tokens.md` zapisuje zaakceptowane wartości i pochodzenie; widok nie dostaje literalnych kolorów.

### Success Criteria:

#### Automated Verification:

- `npm run lint` przechodzi; skaner UI nie wykrywa nowych surowych kolorów ani arbitralnych wartości w plikach widoku.
- `npx astro check` przechodzi po publikacji wymaganych ról tokenów.

#### Manual Verification:

- Wartości tokenów pasują do wybranego rzutu z góry i zachowują lekki, biało-zielony charakter całego dashboardu.
- Wartości i ich źródło są zapisane w `design/tokens.md`; kontrakt nie wprowadza drugiej palety ani nowej biblioteki.

**Implementation Note**: Zakończyć fazę po przeglądzie tokenów; nie zmieniać jeszcze produkcyjnego diagramu.

## Phase 2: Skrzynie z góry i czytelne zakładki

### Overview

Wdrożyć zaakceptowaną warstwę wizualną skrzynki oraz dopracować kompozycję i aktywny stan trzech zakładek na dashboardzie. Zachować istniejące URL-e, odczyt/zapis i mobilny dialog powiększenia.

### Changes Required:

#### 1. Warstwa ilustracyjna skrzynki

**File**: `src/components/garden/GardenLayoutView.tsx`

**Intent**: Zastąpić płaski prostokąt czytelną, lekką ilustracją skrzynki w rzucie z góry, w której rama, podłoże i rozpoznawalne uprawy budują obraz grządki zamiast powtarzającej się siatki drobnych znaczników.

**Contract**: Renderowanie nadal używa `GardenDiagramProjection`, centymetrowych wymiarów i pozycji, mapowania crop atlasu, dostępnych nazw, wspólnego `Button` oraz obecnego dialogu. Warstwy dekoracyjne nie przesuwają markerów ani nie zmieniają geometrii; projekcja desktopowa i powiększona korzystają z tej samej ilustracji.

#### 2. Nawigacja dashboardu

**File**: `src/pages/dashboard.astro`

**Intent**: Dopasować hierarchię wizualną i stany zakładek do lekkiego dashboardu ogrodniczego, aby użytkownik rozpoznawał aktualny widok i dostępne przejścia.

**Contract**: Zachować linkowe URL-e, `aria-current="page"`, widoczny fokus, kolejność nawigacji oraz komunikaty po zapisie; nie zmieniać semantyki na `tablist` ani nie ruszać endpointów.

### Success Criteria:

#### Automated Verification:

- `npm run lint` przechodzi, a skan tokenów nie wykrywa nowych literalnych stylów w `dashboard.astro` ani `GardenLayoutView.tsx`.
- `npx astro check` i `npm run build` przechodzą.
- W mapowaniu renderowanych markerów każdy element nadal pochodzi z oryginalnych pozycji i jest opisany dostępnie; brak nowego algorytmu lub przeliczenia geometrii.

#### Manual Verification:

- Zrzuty dashboardu w desktopie i na szerokości mobilnej pokazują rozpoznawalną skrzynkę z góry, czytelne rośliny i aktywną zakładkę bez niezamierzonego poziomego przepełnienia.
- Na telefonie powiększenie pozwala przesuwać diagram w obu osiach, a zamknięcie przyciskiem i Escape przywraca fokus do przycisku otwierającego.
- Bezpośrednie wejście na trzy URL-e wybiera właściwy widok; przejścia linkami zachowują fokus i aktywny stan.
- Po pokazaniu zrzutów użytkownik akceptuje efekt wizualny przed rozpoczęciem Fazy 3.

**Implementation Note**: Zatrzymać się po zrzutach i zebrać manualną akceptację użytkownika przed Fazą 3.

## Phase 3: Stany, odbiór i trwały guard

### Overview

Zapewnić wizualny gate dla stanów interaktywnych dashboardu, potwierdzić przepływy zakładek i zapisów oraz utrwalić zasady korzystania z tokenów i komponentów.

### Changes Required:

#### 1. Kitchen sink i macierz stanów

**File**: `src/pages/dev/garden-planner-kitchen-sink.astro`

**Intent**: Wykorzystać deterministyczne dane kuchennego widoku do pokazania nowej skrzynki i stanu dashboardowych kontrolek w kompletnym zestawie stanów, bez odczytu prywatnych danych i API.

**Contract**: Macierz ma pokazywać default, hover, focus-visible, disabled, error, empty i loading. Jeżeli stan nie ma zastosowania do statycznej ilustracji, oznaczyć N/A z uzasadnieniem, a stan pokazać dla powiązanej kontrolki/obszaru dashboardu. Przykłady pozostają deterministyczne i bez zapisów.

#### 2. Reguła systemu UI i kontrola tokenów

**File**: `AGENTS.md`, `scripts/check-garden-ui-tokens.mjs`

**Intent**: Utrzymać istniejącą zasadę użycia tokenów, współdzielonych prymitywów i kitchen sinka; doprecyzować ją tylko wtedy, gdy odbiór ujawni brak dla dashboardu skrzynek.

**Contract**: Rozszerzyć istniejący blok UI poza sekcją zarządzaną przez 10x CLI, bez dodawania drugiego przewodnika. Jeśli obecny skaner nie obejmuje zmienionych plików, dodać ich wąski zakres do istniejącego skryptu lint; nie dodawać zależności.

#### 3. Odbiór interakcji i zrzuty

**File**: `context/changes/garden-bed-visuals-tabs/`

**Intent**: Zachować reviewable dowód kompletnego widoku i jego stanów dla bieżącej zmiany.

**Contract**: Zapisać zrzuty dashboardu i kitchen sinka w desktopie oraz jednej szerokości mobilnej; potwierdzić linki `/dashboard`, `/dashboard?tab=sectors`, `/dashboard?tab=crops`, stan aktywny, powrót po zapisie sektorów oraz widoczny wynik zapisu warzyw. Nie aktualizować snapshotu bez opisania zamierzonej zmiany wizualnej.

### Success Criteria:

#### Automated Verification:

- `npm run lint`, `npx astro check` i `npm run build` przechodzą po finalnych zmianach.
- Kitchen sink w dev renderuje siedem wymaganych stanów; każdy wyjątek ma jawne uzasadnienie N/A.
- Istniejący skaner tokenów obejmuje zmienione widoki, a zmiana nie dodaje dependency ani literalnych kolorów.

#### Manual Verification:

- Wszystkie siedem stanów jest widocznych na kitchen sinku lub ma uzasadnione N/A; kontrast i fokus pozostają czytelne.
- Trzy adresy zakładek, aktywny stan, nawigacja wstecz/dalej oraz oba przepływy zapisu kończą się we właściwym widoku z potwierdzeniem.
- Ostateczne zrzuty desktop/mobile pokazują spójny dashboard, czytelny diagram i brak regresji mobilnego zoomu; użytkownik akceptuje odbiór.
- Zasada UI w `AGENTS.md` pozostaje jedynym aktualnym kontraktem agentów dla tokenów, wspólnych komponentów i lokalizacji kitchen sinka.

## Testing Strategy

### Automated Checks:

- `npm run lint` — istniejący skaner tokenów oraz ESLint.
- `npx astro check` — diagnostyka Astro/TypeScript.
- `npm run build` — weryfikacja produkcyjnego renderowania i routingu.

### Manual Verification:

1. Otworzyć każdą z trzech zakładek z linku i bezpośredniego URL-a; sprawdzić aktywny link, fokus oraz wstecz/dalej.
2. Zapisać sektory i uprawy; potwierdzić właściwy widok i komunikat/resultat po zapisie.
3. Na mobile otworzyć skrzynkę, przesunąć powiększony diagram w obu osiach, zamknąć przyciskiem i Escape oraz sprawdzić przywrócenie fokusu.
4. Obejrzeć zrzuty dashboardu i kitchen sinka na desktopie oraz jednym rozmiarze mobilnym; uzyskać akceptację użytkownika.

## Performance Considerations

Nie wprowadzać nowych zależności ani ciężkich bitmap. Zachować wektorowy diagram i ograniczyć warstwę dekoracyjną tak, by liczba markerów i dostępność nie pogarszały responsywności gęsto obsadzonych skrzynek.

## Migration Notes

Brak migracji. Dane zapisane w centymetrach i istniejące payloady nie zmieniają się.

## References

- Research: `context/changes/garden-bed-visuals-tabs/research.md`
- Zatwierdzony kierunek: `context/changes/garden-bed-visuals-tabs/design/`
- Widoki i tokeny: `src/pages/dashboard.astro`, `src/components/garden/GardenLayoutView.tsx`, `src/styles/global.css`
- Stan kitchen sinka i reguła: `src/pages/dev/garden-planner-kitchen-sink.astro`, `AGENTS.md`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Kontrakt tokenów dla skrzynki

#### Automated

- [x] 1.1 `npm run lint` przechodzi; skaner UI nie wykrywa nowych surowych kolorów ani arbitralnych wartości w plikach widoku. — f43c6e3
- [x] 1.2 `npx astro check` przechodzi po publikacji wymaganych ról tokenów. — f43c6e3

#### Manual

- [x] 1.3 Wartości tokenów pasują do wybranego rzutu z góry i zachowują lekki, biało-zielony charakter całego dashboardu. — f43c6e3
- [x] 1.4 Wartości i ich źródło są zapisane w `design/tokens.md`; kontrakt nie wprowadza drugiej palety ani nowej biblioteki. — f43c6e3

### Phase 2: Skrzynie z góry i czytelne zakładki

#### Automated

- [x] 2.1 `npm run lint` przechodzi, a skan tokenów nie wykrywa nowych literalnych stylów w `dashboard.astro` ani `GardenLayoutView.tsx`.
- [x] 2.2 `npx astro check` i `npm run build` przechodzą.
- [x] 2.3 W mapowaniu renderowanych markerów każdy element nadal pochodzi z oryginalnych pozycji i jest opisany dostępnie; brak nowego algorytmu lub przeliczenia geometrii.

#### Manual

- [x] 2.4 Zrzuty dashboardu w desktopie i na szerokości mobilnej pokazują rozpoznawalną skrzynkę z góry, czytelne rośliny i aktywną zakładkę bez niezamierzonego poziomego przepełnienia.
- [x] 2.5 Na telefonie powiększenie pozwala przesuwać diagram w obu osiach, a zamknięcie przyciskiem i Escape przywraca fokus do przycisku otwierającego.
- [x] 2.6 Bezpośrednie wejście na trzy URL-e wybiera właściwy widok; przejścia linkami zachowują fokus i aktywny stan.
- [x] 2.7 Po pokazaniu zrzutów użytkownik akceptuje efekt wizualny przed rozpoczęciem Fazy 3.

### Phase 3: Stany, odbiór i trwały guard

#### Automated

- [ ] 3.1 `npm run lint`, `npx astro check` i `npm run build` przechodzą po finalnych zmianach.
- [ ] 3.2 Kitchen sink w dev renderuje siedem wymaganych stanów; każdy wyjątek ma jawne uzasadnienie N/A.
- [ ] 3.3 Istniejący skaner tokenów obejmuje zmienione widoki, a zmiana nie dodaje dependency ani literalnych kolorów.

#### Manual

- [ ] 3.4 Wszystkie siedem stanów jest widocznych na kitchen sinku lub ma uzasadnione N/A; kontrast i fokus pozostają czytelne.
- [ ] 3.5 Trzy adresy zakładek, aktywny stan, nawigacja wstecz/dalej oraz oba przepływy zapisu kończą się we właściwym widoku z potwierdzeniem.
- [ ] 3.6 Ostateczne zrzuty desktop/mobile pokazują spójny dashboard, czytelny diagram i brak regresji mobilnego zoomu; użytkownik akceptuje odbiór.
- [ ] 3.7 Zasada UI w `AGENTS.md` pozostaje jedynym aktualnym kontraktem agentów dla tokenów, wspólnych komponentów i lokalizacji kitchen sinka.
