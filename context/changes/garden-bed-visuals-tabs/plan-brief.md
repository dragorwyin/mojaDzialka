# Czytelne skrzynie i działające zakładki ogrodu — Plan Brief

> Full plan: `context/changes/garden-bed-visuals-tabs/plan.md`
> Research: `context/changes/garden-bed-visuals-tabs/research.md`

## What & Why

Dashboard ma pokazywać wygenerowany ogród jako czytelny plan grządek. Obecny diagram eksponuje drobne, powtarzające się znaczniki i nie buduje łatwo rozpoznawalnego obrazu skrzynki. Użytkownik wybrał rzut z góry z bardziej czytelnymi roślinami.

## Starting Point

Trzy adresowalne widoki już działają jako linki SSR, a zapis sektorów i warzyw ma istniejące przepływy zwrotne. Diagram używa centymetrowej geometrii SVG, atlasu roślin i mobilnego dialogu powiększenia; redesign ma zachować te zachowania.

## Desired End State

Skrzynka wygląda jak lekka grządka z góry, z rozpoznawalną ramą, podłożem i obsadą, a rozmieszczenie nadal dokładnie odpowiada zapisanym współrzędnym. Zakładki są czytelne, mają widoczny fokus i zachowują własne URL-e; zoom działa na telefonie. Zrzuty desktop/mobile i kitchen sink potwierdzają pełny zestaw stanów.

## Key Decisions Made

| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| Projekcja skrzynki | Rzut z góry | Użytkownik wybrał ten wariant koncepcyjny | User |
| Nawigacja | Zachować linki URL i SSR | Już obsługują bezpośrednie wejścia oraz zapis | Research |
| Geometria i zoom | Zachować pozycje w cm i powiększenie mobilne | Warstwa wizualna nie może zmieniać układu danych | Research |
| UI contract | Rozszerzać `global.css`, reużyć UI i kitchen sink | Istniejący system i AGENTS guard obejmują widok | Research |

## Scope

**In scope:**

- Semantyczne role tokenów dla brakujących elementów skrzynki.
- Czytelniejszy diagram skrzynki w rzucie z góry oraz hierarchia trzech zakładek.
- Stany dashboardu, manualny odbiór zapisów i adresów, zrzuty desktop/mobile.

**Out of scope:**

- Zmiana algorytmu, danych, współrzędnych, API i przepływów auth.
- Izometria, nowe zakładki, nowe biblioteki i redesign pozostałych ekranów.

## Architecture / Approach

Najpierw rozszerzyć semanticzny kontrakt tokenów, potem zmienić warstwę SVG i prezentację istniejących linków, a na koniec pokazać stany w deterministycznym kitchen sinku i domknąć gate wizualny. Geometria, trasy i zapisy pozostają bez zmian.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Kontrakt tokenów | Role dla ramy i podłoża skrzynki bez drugiej palety | Kolor może nie pasować do lekkiej botaniki |
| 2. Skrzynie i zakładki | Rzut z góry, czytelniejsze uprawy i zachowane adresy | Ilustracja może przysłonić precyzję pozycji |
| 3. Stany i guard | Siedem stanów, manualne sprawdzenie zapisów, końcowe zrzuty | Stany brzegowe mogą nie odzwierciedlać dashboardu |

**Prerequisites:** zaakceptowany rzut z góry; istniejący `research.md`, design concept i bieżące dashboard routes.
**Estimated effort:** około 3 implementacyjne etapy z manualnym odbiorem po Fazie 2.

## Open Risks & Assumptions

- Gęsto obsadzone skrzynie mogą wymagać uproszczenia dekoracji, by nie zlewały się z glyphami.
- Zakładki są już routowane; plan zakłada brak znalezionego błędu funkcjonalnego i wymaga potwierdzenia bieżącego zachowania.
- W istniejącym `AGENTS.md` jest UI guard; zmienić go tylko, jeśli implementacja ujawni lukę.

## Success Criteria (Summary)

- Czytelny rzut z góry jest zaakceptowany na desktopie i telefonie, a marker zachowuje prawdziwe położenie.
- Wszystkie trzy URL-e i oba zapisy kończą się we właściwym widoku z czytelnym feedbackiem.
- Kitchen sink pokazuje siedem stanów lub jawne N/A, a istniejący lint/build/type gates przechodzą.
