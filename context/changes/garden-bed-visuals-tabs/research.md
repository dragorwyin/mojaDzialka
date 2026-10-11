---
date: 2026-10-11T02:25:38+02:00
researcher: Codex
git_commit: bf5d6e7
branch: main
repository: mojaDzialka
topic: "Czytelne skrzynie i działające zakładki ogrodu"
tags: [research, garden-dashboard, garden-diagram, tabs, ui]
status: complete
last_updated: 2026-10-11
last_updated_by: Codex
---

# Research: Czytelne skrzynie i działające zakładki ogrodu

**Date**: 2026-10-11T02:25:38+02:00
**Researcher**: Codex
**Git Commit**: bf5d6e7
**Branch**: main
**Repository**: mojaDzialka

## Research Question

Jak poprawić czytelność wizualną skrzynek ogrodowych oraz dopracować zakładki „Mój ogród”, „Sektory” i „Warzywa”, pokazując użytkownikowi konkretne warianty przed zmianą produkcyjnego interfejsu?

## Summary

- Widok `/dashboard` już przełącza się między trzema adresowalnymi widokami przez linki `/dashboard`, `/dashboard?tab=sectors` i `/dashboard?tab=crops`; serwer wybiera odpowiadającą im sekcję na podstawie parametru `tab` (`src/pages/dashboard.astro:119-135,161-180,221-246`). To jest nawigacja stronowa oparta na URL, nie komponent kliencki z rolą `tablist`.
- Zapis sektorów wraca do `/dashboard?tab=sectors&saved=1`, a zapis warzyw używa JSON endpointu i prezentuje rezultat w formularzu; aktualne adresy i potwierdzenia zapisu są kontraktem do zachowania przy dopracowaniu nawigacji (`src/pages/api/garden.ts:11,91`, `src/pages/api/garden-crops.ts:18-43`, `src/components/garden/CropSelectionForm.tsx:269-293`).
- Plan skrzynki jest obecnie płaskim diagramem SVG w centymetrowych współrzędnych: prostokąt, linie siatki i osobne glyphy z atlasu w pozycjach upraw (`src/components/garden/GardenLayoutView.tsx:141-225`). W zapisanym zrzucie fikcyjnej grządki z 68 pozycjami ten sam mały glyph marchewki powtarza się w czterech rzędach; przez to diagram przypomina siatkę znaczników bardziej niż rozpoznawalną skrzynię z uprawą (`output/playwright/garden-experience-redesign/dashboard-garden-desktop.png`).
- Istniejący mobilny dialog powiększa wybraną przestrzeń, zachowując tę samą projekcję i umożliwiając jej przewijanie; nowe warianty skrzynek powinny zachować geometrię pozycji i ten mechanizm (`src/components/garden/GardenLayoutView.tsx:231-344`).
- Źródłem ról wizualnych jest `src/styles/global.css`; dwa badane widoki zawierają 34 wystąpienia ról klasowych w `dashboard.astro` oraz 73 w `GardenLayoutView.tsx`. Używają wspólnego `Button`; audyt regexowy widoków nie wykrył kandydatów na surowe kolory, paletowe klasy Tailwinda ani arbitralne wartości (`src/pages/dashboard.astro:2-4,132-172`, `src/components/garden/GardenLayoutView.tsx:2,282-320`).

## Charges

### 1. Brak wizualnej bryły skrzynki

- **Evidence**: `GardenSpaceDiagram` rysuje prostokąt przestrzeni i linie siatki, a pozycje roślin renderuje osobno (`src/components/garden/GardenLayoutView.tsx:141-225`).
- **Effect**: Użytkownik odczytuje przede wszystkim współrzędne i punkty obsady; sama skrzynka nie ma rozpoznawalnego obramowania, głębi ani powierzchni ziemi.
- **Direction**: Przygotować czytelne warianty bryły skrzynki jako warstwy prezentacji, bez zmiany centymetrowej geometrii danych.

### 2. Miniaturowe glyphy nie budują czytelnego obrazu uprawy

- **Evidence**: `CropAtlasGlyph` pokazuje ilustrację atlasu w ograniczonym glyphie SVG, używanym zarówno w diagramie, jak i w legendzie (`src/components/garden/GardenLayoutView.tsx:73-128,196-214,449-455`). Zrzut przykładowej obsady pokazuje 68 powtarzających się marchewek (`output/playwright/garden-experience-redesign/dashboard-garden-desktop.png`).
- **Effect**: W gęstszej obsadzie drobne ilustracje zlewają się w regularne punkty; typ rośliny trudno rozpoznać bez czytania legendy.
- **Direction**: Porównać przed implementacją wariant bardziej wyrazistej ilustracji roślin/obsady i wariant, w którym roślina jest osadzona w czytelnie narysowanej skrzynce.

### 3. Nawigacja i stan wybranej zakładki wymagają jawnego kontraktu

- **Evidence**: Dashboard renderuje `<nav>` z trzema anchorami, wyróżnia aktywny link i ustala aktywny widok z query string; zapis sektorów zachowuje wybór zakładki przez redirect (`src/pages/dashboard.astro:119-135,161-177`, `src/pages/api/garden.ts:11,91`).
- **Effect**: Linki mają adresowalny stan, ale przebudowa wyglądu nie może niechcący zgubić aktywnej zakładki, feedbacku zapisu ani obsługi klawiatury. Z kodu wynika, że to działająca nawigacja stronowa; nie ma podstaw, by bez decyzji produktu zamieniać ją na stanowe `tablist`.
- **Direction**: Zachować linki i URL-e jako zachowanie bazowe, a w wariantach pokazać wyraźny, dostępny stan aktywny oraz widoczny fokus. Potwierdzenie przeglądarkowe należy do odbioru fazy implementacji.

## Detailed Findings

### Dashboard, tabs, and save flows

- Parametr `tab` przyjmuje w SSR `sectors` lub `crops`, a domyślnym widokiem jest `garden`; parametry `saved` lub `error` kierują widok do sekcji sektorów (`src/pages/dashboard.astro:115-120`).
- Trzy linki nawigacyjne mają osobne URL-e, etykiety i `aria-current="page"` dla aktywnego widoku (`src/pages/dashboard.astro:132-172`).
- Zapis skrzyń przechodzi przez formularz SSR/API i przekierowuje do zakładki sektorów z wynikiem (`src/pages/api/garden.ts:31,91`). Zapis upraw korzysta z JSON endpointu, a komponent emituje zdarzenie `garden:inputs-saved` (`src/pages/api/garden-crops.ts:18-43`, `src/components/garden/CropSelectionForm.tsx:269-293`).

### Diagram skrzynki

- `GardenSpaceDiagram` zachowuje `space.widthCm`, `space.lengthCm`, centymetrowe pozycje i proporcje projekcji przy renderowaniu SVG (`src/components/garden/GardenLayoutView.tsx:149-225`).
- `GardenSpaceDiagramViewer` renderuje dialog dla telefonu; wymiary powiększenia pochodzą z projekcji, viewport przewija się w obu osiach, `Escape` zamyka dialog, a fokus wraca do przycisku otwierającego (`src/components/garden/GardenLayoutView.tsx:231-344`).
- `GardenLayoutView` mapuje każdy znacznik przez atlas roślin; dostępne nazwy są używane w opisach SVG i legendzie (`src/components/garden/GardenLayoutView.tsx:73-128,196-214,349-351,449-455`).

### Design-system contract

- Semantyczne role `app-*` i `garden-*` pochodzą z `src/styles/global.css:5-49,118-155`; workspace planera mapuje się na jasne `--app-page` (`src/styles/global.css:193-195`).
- Dashboard importuje istniejące `GardenSetupForm`, `CropSelectionForm` i `GardenPlanner` (`src/pages/dashboard.astro:2-4`); interakcje diagramu używają wspólnego `Button` (`src/components/garden/GardenLayoutView.tsx:2,282-320`).
- W pre-audycie `/dashboard` miał 34 wystąpienia ról klasowych, a `GardenLayoutView.tsx` 73; wyszukiwanie kandydatów z 10x-ui po obu widokach zwróciło 0 trafień surowych kolorów, paletowych klas Tailwinda i arbitralnych wartości.
- Katalog `src/components/ui` zawiera `button.tsx` oraz `LibBadge.astro`; nie ma stąd potwierdzonego wspólnego prymitywu dedykowanego diagramowi skrzynki.

## Historical Context (from prior changes)

- `context/changes/garden-diagram-thumbnail-readability/change.md` odnotowuje zakończenie wcześniejszej poprawy kadrów i akceptację ilustracji bez numerów na samym diagramie. Nowy feedback użytkownika dotyczy rozpoznawalności/wyglądu skrzynek i ilustracji, więc nie podważa tamtych kryteriów technicznych (mapowania, kadrowania ani dostępnych opisów).
- `context/changes/garden-diagram-thumbnail-readability/plan.md` wymaga zachowania geometrii diagramu, nazw i mapowania miniaturek oraz mobilnego powiększenia (`Faza 1`, `Faza 2`, `Critical Implementation Details`).
- `context/changes/garden-experience-redesign/plan.md:176-201,229-231` ustalił trzy zakładki dashboardu, zachowanie stanów planu i ręczny odbiór screenshotów. Nowa zmiana nie powinna ponownie obejmować landingu, auth ani silnika rozmieszczania.

## Code References

- `src/pages/dashboard.astro:115-180` — wybór SSR aktywnej zakładki i nawigacja linkami.
- `src/pages/dashboard.astro:221-259` — renderowanie formularza sektorów oraz doboru warzyw.
- `src/components/garden/GardenLayoutView.tsx:73-225` — glyph atlasu i diagram przestrzeni.
- `src/components/garden/GardenLayoutView.tsx:231-344` — mobilny, przewijany dialog diagramu.
- `src/pages/api/garden.ts:11,31,91` — obsługa błędów, auth i powrót do tabów sektorów po zapisie.
- `src/pages/api/garden-crops.ts:18-43` — zapis wyboru warzyw przez JSON endpoint.
- `src/styles/global.css:5-49,118-155,193-195` — wartości i role tokenów light/garden.
- `src/components/ui/button.tsx` — wspólny prymityw przycisku.

## Architecture Insights

Zmiana wizualna mieści się w istniejącym widoku dashboardu, ale może dotknąć komponentu diagramu. Przed wyborem kierunku należy utrzymać rozdział między geometrią domenową (`GardenDiagramProjection`, współrzędne i pozycje roślin) a warstwą ilustracyjną skrzynki. Zachowanie URL-ów zakładek pozwala na SSR, bezpośrednie linki i powrót do właściwego panelu po zapisie.

## Related Research

- `context/changes/garden-experience-redesign/research.md`
- `context/changes/garden-diagram-thumbnail-readability/plan.md`
- `context/changes/natural-garden-dashboard/research.md`

## Open Questions

- **Rozstrzygnięte przez użytkownika**: wybrał rzut skrzynki z góry; wariant izometryczny nie jest kierunkiem tej zmiany.
- Zakładki pozostają linkami adresowalnymi. Obecny kod nie wskazuje potrzeby wymiany ich na stanowy `tablist`; w planie warto wymagać ręcznego sprawdzenia przejść, aktywnego stanu, fokusu i zachowania po zapisie.
