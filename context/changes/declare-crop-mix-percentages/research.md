---
date: 2026-09-28T14:20:31+02:00
researcher: Codex
git_commit: a51414ff3c6ffbca3fd9e4550b3da336afdf9c91
branch: main
repository: mojaDzialka
topic: "Percentage declarations for the selected crop mix"
tags: [research, UI, garden, crop-selection]
status: complete
last_updated: 2026-09-28
last_updated_by: Codex
---

# Research: Procentowe deklarowanie udziałów upraw

**Date**: 2026-09-28T14:20:31+02:00  
**Researcher**: Codex  
**Git Commit**: a51414ff3c6ffbca3fd9e4550b3da336afdf9c91  
**Branch**: main  
**Repository**: mojaDzialka

## Research Question

Jak zmienić istniejący formularz wyboru upraw tak, by użytkownik deklarował procentowy miks dla całej działki, a suma udziałów wynosiła 100%, bez zmiany algorytmu układu ani schematu bazy?

## Summary

- Formularz /garden pokazuje obecnie dla każdej uprawy surową, dodatnią liczbę opisaną jako „Proporcja”. Wartości są wczytywane, wysyłane i przechowywane bez normalizacji; nie ma kontroli sumy 100% ([CropSelectionForm.tsx](../../../src/components/garden/CropSelectionForm.tsx), [garden-crop-selection.ts](../../../src/lib/garden-crop-selection.ts), [garden.astro](../../../src/pages/garden.astro), [garden-crops.ts](../../../src/pages/api/garden-crops.ts)).
- Dla istniejących wag 3 i 1 normalizacja po sumie daje 75% i 25%: 3/(3+1) oraz 1/(3+1). Wysłanie 75 i 25 przez istniejący endpoint zachowuje ten sam względny miks co 3 i 1; RPC i kolumna numeric nie wymagają zmiany schematu ([garden-crops.ts:37-40](../../../src/pages/api/garden-crops.ts), [migracja:1-4](../../../supabase/migrations/20260927120000_create_garden_crops.sql)).
- Wybór w tej rozmowie: każdy procent edytuje się ręcznie, suma jest widoczna, zapis następuje przy 100% i dodatnim udziale każdej zaznaczonej uprawy; formularz nie zmienia po cichu pozostałych udziałów. Pusta lista nadal może czyścić wybór.
- Kontrakt UI nie rozstrzyga generatora S-04: PRD i research S-04 wciąż wymagają formalnego celu liczebności roślin oraz porównania celu z wykonalnym układem ([PRD:75-80,129](../../../context/foundation/prd.md), [research S-04:28-41](../generate-garden-layout/research.md)).
- Projekt ma semantyczne tokeny Tailwind w `src/styles/global.css` oraz współdzielony `Button`, ale formularz ogrodowy używa lokalnych klas kolorów i przycisków. Ta zmiana nie potrzebuje nowej palety ani biblioteki; zachowuje istniejący ciemny motyw ogrodu i obejmuje tylko ten widok.

## Detailed Findings

### Formularz i przepływ danych

- `CropSelectionForm` przechowuje wybór w stanie klienta, dodaje nową uprawę z wartością `"1"`, a pole ma etykietę „Proporcja” i `type="number"` ([CropSelectionForm.tsx:18-20,119-130,164-189](../../../src/components/garden/CropSelectionForm.tsx)).
- Przy odczycie `garden.astro` konwertuje wartość bazy na tekst bez normalizacji; przy zapisie formularz konwertuje tekst do liczby i przekazuje listę do `/api/garden-crops` ([garden.astro:41-52](../../../src/pages/garden.astro), [CropSelectionForm.tsx:40-60](../../../src/components/garden/CropSelectionForm.tsx)).
- Walidator API wymaga poprawnego ID oraz dodatniej, skończonej liczby, ale nie sprawdza sumy; API wysyła liczby do `save_garden_crops` bez przeliczeń ([garden-crop-selection.ts:8-29](../../../src/lib/garden-crop-selection.ts), [garden-crops.ts:37-45](../../../src/pages/api/garden-crops.ts)). Ponieważ zakres tej zmiany jest ograniczony do UI, suma 100% jest walidowana w formularzu, nie w API.
- Jeżeli istniejące wartości wynoszą 3 i 1, formularz może wczytać je jako 75% i 25%. Edycja pozostawia pozostałe pola bez zmian; dodanie lub usunięcie uprawy zmienia sumę, którą użytkownik ręcznie koryguje przed zapisem. Nowa uprawa może zachować obecny domyślny dodatni udział 1%, co oznacza, że po dodaniu suma wymaga korekty.
- Wybranie pustej listy pozostaje dozwolonym sposobem wyczyszczenia danych: walidator akceptuje `[]`, a smoke test sprawdza ten przepływ ([garden-crop-selection.test.ts:18-20](../../../src/lib/garden-crop-selection.test.ts), [smoke.mjs:138-153](../../../scripts/smoke.mjs)).

### Weryfikacja

- `npm run test:unit` obejmuje test walidacji wyboru upraw, który obecnie sprawdza zachowanie wartości dziesiętnych bez normalizacji. Należy dodać testy konwersji wag na procenty i sumy 100% ([package.json:15](../../../package.json), [garden-crop-selection.test.ts:5-15](../../../src/lib/garden-crop-selection.test.ts)).
- Smoke test zapisuje obecnie wartości 2 i 0.75, a potem oczekuje ich surowej reprezentacji `value="2"` i `value="0.75"`. Dla tych wejść normalizacja do dwóch miejsc po przecinku daje 72.73% i 27.27%; po zmianie test powinien oczekiwać tego procentowego widoku. Test wykonuje też zmianę wymiarów działki i czyszczenie wyboru, które należy zachować ([smoke.mjs:92-153](../../../scripts/smoke.mjs)).
- Test SQL potwierdza obecny kontrakt bazy: zachowanie wartości numerycznych, odrzucanie wartości niedodatnich i możliwość wyczyszczenia wyboru. Schemat/RPC pozostają poza zakresem, więc nie ma potrzeby zmieniać tego testu ([garden_crops.test.sql:56-104,147-198](../../../supabase/tests/garden_crops.test.sql)).
- W `package.json` znajdują się testy jednostkowe i smoke, ale nie ma zadeklarowanego testu screenshotowego ani komponentowego. Weryfikacja interakcji formularza wymaga ręcznego sprawdzenia, a wymagany przez repo UI-gate powinien pokazać stany default, hover, focus, disabled, error, empty i loading na desktopie oraz jednym rozmiarze mobilnym.

### UI audit charges

1. **Core interaction / declaration** — `CropSelectionForm.tsx:172-188`: etykieta „Proporcja” i surowe liczby nie ujawniają udziału w całym miksie; użytkownik nie potrafi odczytać relacji typu 3:1 jako 75%:25%. **Do zmiany**: pola procentowe i widoczna suma, bez automatycznej zmiany innych upraw.
2. **Missing tokens** — `CropSelectionForm.tsx:105-117,172-188` używa klas bezpośrednio opisujących kolory, podczas gdy `global.css:6-25,41-59,75-111` definiuje role semantyczne `border`, `input`, `ring` i kolory akcentu. Nowy stan błędnej sumy nie powinien dodawać kolejnej niezależnej palety. **Ograniczenie**: `.dark` jest zdefiniowane w arkuszu, lecz w sprawdzonych `Layout.astro` i `garden.astro` nie znaleziono klasy `.dark`; szeroka migracja istniejącego widoku na tokeny mogłaby więc zmienić kontrast. **W tej zmianie**: nie dodawać nowych kolorów; pełne podpięcie tokenów zostawić jako widoczny follow-up, jeśli wymagałoby zmiany motywu.
3. **Missing shared component** — przyciski formularza mają lokalne klasy w `CropSelectionForm.tsx:125-139,190-228`, mimo że `src/components/ui/button.tsx:8-20,47` dostarcza współdzielony `Button` z wariantami, focus-visible i obsługą disabled. Brak współdzielonego komponentu Input w sprawdzonej zawartości `src/components/ui/` oznacza, że nowa kontrolka procentowa powinna pozostać natywnym polem w tej zmianie, a nie inicjować nową bibliotekę. **Deferred**: migracja przycisków na prymityw `Button` nie jest konieczna do poprawnego miksu procentowego; zanotować ją do osobnego UI passu.

**Accidental architecture:** nie znaleziono w zbadanym przepływie problemu architektury widoku. `garden.astro` przekazuje prywatne dane do istniejącego `CropSelectionForm`, a formularz zapisuje przez istniejący endpoint. Zachować ten podział; nie tworzyć nowej strony ani API dla procentów.

## Design-System Contract and Reference

- **Named motif:** zachować istniejący „ciemny kosmiczny ogród” widoczny na zrzucie użytkownika; lokalnym źródłem gradientu jest `@utility bg-cosmic` w `src/styles/global.css:113-115`. Nie dodawać zewnętrznego moodboardu ani nowych kolorów.
- **Value source:** `src/styles/global.css` zawiera semantyczne tokeny w `:root`, `.dark` i `@theme inline`; zmiana nie powinna wprowadzać kolejnych literalnych wartości stylu.
- **Shared components:** `src/components/ui/` zawiera `button.tsx` oraz `LibBadge.astro`; współdzielony `Button` istnieje, ale nie ma tam współdzielonego komponentu Input. Dla jednego pola procentowego można użyć natywnego inputa i zachować lokalny układ formularza; ewentualne przeniesienie do wspólnego komponentu jest deferred.
- **Single-view boundary:** modyfikowanym widokiem jest sekcja wyboru upraw na `/garden`; konfiguracja wymiarów skrzyń pozostaje poza zakresem.

## Code References

- `src/components/garden/CropSelectionForm.tsx:18-60,89-228` — stan, renderowanie i zapis wyboru.
- `src/lib/garden-crop-selection.ts:8-29` — walidacja istniejącego payloadu.
- `src/pages/garden.astro:17-52` — pobranie i przekazanie zapisanych wartości.
- `src/pages/api/garden-crops.ts:22-45` — walidacja i zapis przez istniejące RPC.
- `src/styles/global.css:6-25,41-59,75-115` — semantyczne tokeny i motyw `bg-cosmic`.
- `src/components/ui/button.tsx:8-47` — współdzielony prymityw Button.
- `src/lib/garden-crop-selection.test.ts:5-42` — jednostkowa walidacja.
- `scripts/smoke.mjs:92-153` — zapis, ponowny odczyt, zachowanie przy zmianie wymiarów i czyszczenie upraw.
- `supabase/tests/garden_crops.test.sql:56-198` — ograniczenia bazy i prywatność wyboru.
- `package.json:5-16` — skrypty testowe i smoke.

## Architecture Insights

- Wartości procentowe można przesłać jako dodatnie liczby do obecnego pola `proportion`; np. 75 i 25 zachowują stosunek 3:1. Skala zapisu zmieni się po zapisaniu znormalizowanego miksu, ale nie jest potrzebna migracja ani zmiana endpointu.
- Sumę i dodatniość pól sprawdza warstwa formularza. API i RPC zachowują dotychczasowy kontrakt dla innych wywołań, więc bezpośredni request nie dostaje nowego warunku sumy 100% — zgodnie z uzgodnionym zakresem „UI only”.
- Nie znaleziono konsumenta przyszłego generatora w `src/`; S-04 research pozostawia semantykę algorytmu otwartą. Obecny follow-up ustala interfejs udziałów, a nie zachowanie planera.

## Historical Context (from prior changes)

- `context/archive/2026-09-27-select-crops-and-proportions/plan-brief.md:16,25,33` — S-03 celowo przechowywał dodatnie wartości bez interpretacji algorytmicznej; generator i interpretacja należały do S-04.
- `context/changes/generate-garden-layout/research.md:28-41` — wcześniejszy research uznaje całą działkę jako zakres proporcji i proponuje udział powierzchni; ta propozycja nie była decyzją zatwierdzoną. Użytkownik teraz wskazał jako cel interfejsu relatywną liczbę roślin.
- `context/changes/generate-garden-layout/frame.md` — zapisuje rozróżnienie między procentowym zapisem w UI a faktycznym udziałem roślin w przyszłym wygenerowanym układzie.

## Related Research

- [Research S-04: proporcje, rozstawy i sąsiedztwo](../generate-garden-layout/research.md)
- [Frame brief S-04](../generate-garden-layout/frame.md)

## Open Questions

- **Dla tej zmiany:** brak otwartych decyzji produktowych po zaakceptowaniu ręcznej edycji, widocznej sumy i zapisu dopiero przy 100%.
- **Poza tą zmianą:** generator S-04 musi później określić, jak osiągnięty udział liczby roślin wyznacza się z rozstaw i jak ujawnić cel niemożliwy do osiągnięcia z przyczyn geometrycznych.
