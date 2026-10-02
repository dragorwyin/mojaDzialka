# Kadrowanie miniaturek i czytelność diagramu — plan wdrożenia

## Overview

Naprawić wspólną prezentację miniaturek roślin na diagramie i w legendzie oraz dodać na telefonie wygodny, powiększony widok wybranego diagramu. Zachować przypisanie grafik do nazw, identyfikatory roślin i rzeczywistą geometrię układu.

## Current State Analysis

- `CropAtlasGlyph` renderuje ilustrację, po czym nakłada na jej dolną część jasną plakietkę numeru; ten sam glyph jest używany w diagramie i legendzie (`src/components/garden/GardenLayoutView.tsx:62–103, 208–214, 282–285`). Token `garden-surface` jest biały (`src/styles/global.css:11`), co wyjaśnia pasek widoczny na obu widokach.
- Manifest dzieli atlas na równe komórki siatki 6×6 i nie opisuje bezpiecznego obszaru rysunku dla poszczególnych roślin (`src/components/garden/crop-thumbnail-manifest.ts:2–9, 51–68`). Badanie atlasu wykazało ilustrację dochodzącą do dolnej krawędzi w 30 z 31 użytych komórek; część obrazów może być przez to nisko ustawiona lub obcięta.
- Diagram SVG zachowuje centymetrowe `viewBox` i dopasowuje całą przestrzeń do szerokości kontenera (`src/components/garden/GardenLayoutView.tsx:155–161`). Rozmiary znaczników w geometrii wynoszą 0,8–5,5 cm (`src/components/garden/garden-layout-diagram.ts:1–3, 75–78`), więc na wąskim ekranie najmniejsze stają się trudne do odczytu.
- Testy obejmują mapowanie miniaturek oraz projekcję pozycji, ale nie zachowanie interfejsu dialogu (`src/data/crop-catalog.test.ts:15–40`, `src/lib/garden-layout.test.ts:451–466`). Repo nie ma obecnie frameworka testów komponentów/e2e; zmiana nie będzie dodawać nowego frameworka.
- Zatwierdzony kontrakt S-04 wymaga zachowania `xCm`/`yCm` i równej skali osi; warstwa wizualna może być adaptowana bez przesuwania roślin (`context/changes/carrot-spacing-and-diagram-readability/plan.md:39–49`).

## Desired End State

- Wszystkie aktywne miniatury nadal odpowiadają właściwym nazwom, są wycentrowane i w całości widoczne. Żaden pasek ani numer nie przecina ilustracji; numery nie są widoczne na diagramie, a kody pozostają w legendzie i tooltipie.
- Na desktopie diagram pozostaje osadzony bezpośrednio na stronie. Na telefonie przycisk dla danej przestrzeni otwiera prawie pełnoekranowy dialog z czytelnym diagramem o większej, stałej skali; można przewijać go poziomo i pionowo. Nie ma własnego pinch-to-zoom.
- Dialog można zamknąć przyciskiem i klawiszem Escape; po zamknięciu fokus wraca do przycisku, który go otworzył. Przewijanie nie powoduje poziomego overflow całej strony.
- Rzeczywiste środki roślin, ich relacje, zapisany plan, proporcje ani dane bazy pozostają niezmienione.

### Key Discoveries:

- Pasek jest nakładką interfejsu, nie wspólną zawartością atlasu; usunięcie lub przestawienie warstwy numeru naprawi równolegle diagram i legendę (`GardenLayoutView.tsx:77–103, 208–214, 282–285`).
- Problem niskiego/uciętego rysunku jest oddzielny od paska: atlas ma stałe komórki bez indywidualnych bezpiecznych marginesów (`crop-thumbnail-manifest.ts:51–68`). Zachować obecny styl i regenerować tylko grafikę, której nie da się prawidłowo odzyskać przez zmianę kadru.
- W UI nie znaleziono istniejącego wzorca dialogu ani zoomu; przycisk ma natomiast widoczny styl fokusu klawiatury (`src/components/ui/button.tsx:7`).
- Diagram ma już opisy dostępności, a tabela podsumowania ma własny poziomy scroll; nowy dialog powinien dotyczyć wyłącznie wybranego diagramu, nie zmieniać semantyki ani geometrii pozostałych treści (`GardenLayoutView.tsx:156, 203, 276, 305`).

## What We're NOT Doing

- Nie zmieniamy algorytmu rozmieszczania, współrzędnych roślin, rozstaw, relacji sąsiedztwa ani wyniku optymalizacji.
- Nie zmieniamy katalogu upraw, nazw, ID, zapisanych wyborów, proporcji ani schematu bazy/API.
- Nie generujemy od nowa kompletu miniaturek, jeśli obecne grafiki da się poprawnie wykadrować.
- Nie dodajemy pinch-to-zoom, gestów powiększania, przycisków zoomu ani przycisku powiększenia na desktopie.
- Nie dokładamy frameworka testów UI/e2e.

## Implementation Approach

Najpierw naprawić wspólny glyph i źródłowe kadry, tak aby czyste ilustracje pasowały do nazw; identyfikatory pozostają w legendzie i tooltipie, bez numerów na diagramie. Następnie udostępnić na telefonie powiększony, przewijany dialog dla wybranej przestrzeni. Dialog używa tej samej projekcji diagramu, z zachowaniem centymetrowych współrzędnych i równej skali osi. Po każdej fazie zatrzymać się na ręcznym przeglądzie obrazu przed przejściem dalej.

## Critical Implementation Details

### User experience spec

Kod uprawy pozostaje widoczny w legendzie i dostępny w tooltipie; diagram nie nakłada numerów na sylwetki. W powiększonym widoku skala prezentacji może być większa niż w karcie strony, lecz nie wolno modyfikować `xCm`/`yCm`, proporcji przestrzeni ani odległości między pozycjami. Dialog ma być ograniczony do telefonu, przewijalny w obu osiach, dostępny z klawiatury i zamykany bez utraty fokusu.

### State sequencing

Współdzielone pliki `GardenLayoutView.tsx`, atlas i manifest mają już zmiany staged z `carrot-spacing-and-diagram-readability` Phase 2. Implementacja tej zmiany ma budować na aktualnym worktree i zachować istniejący staging; nie wolno resetować, zastępować ani przypadkowo restage’ować niepowiązanych plików.

## Faza 1: Integralne miniatury i identyfikatory

### Overview

Usunąć pasek przecinający ilustracje i poprawić położenie/kadrowanie wszystkich aktywnych miniaturek. Kody pozostają w legendzie i tooltipie; diagram pokazuje same ilustracje.

### Changes Required:

#### 1. Wspólny glyph diagramu i legendy

**File**: `src/components/garden/GardenLayoutView.tsx`

**Intent**: Usunąć nakładkę przecinającą ilustrację i pokazywać czyste miniatury na diagramie; kody uprawy zostają w legendzie i tooltipie.

**Contract**: Usunąć poziomą, nieprzezroczystą plakietkę oraz widoczny numer z diagramu. Kody upraw pozostają czytelne w legendzie, a opisy i szczegóły pozycji w tooltipie; zachować semantyczne nazwy i fallback. Nie przesuwać środka znacznika w SVG.

#### 2. Bezpieczne kadry aktywnych miniaturek

**Files**: `public/crops/crop-atlas.webp`, `src/components/garden/crop-thumbnail-manifest.ts`

**Intent**: Zapewnić wolny margines wokół ilustracji w każdej używanej komórce i skorygować zbyt niskie lub obcięte rośliny.

**Contract**: Zachować wszystkie 31 aktywnych ID i ich mapowanie na rośliny. Każda komórka lub indywidualny kadr ma wyznaczony bezpieczny obszar, w którym ilustracja jest wycentrowana i nie dochodzi do granicy w sposób ją obcinający. W pierwszej kolejności wykorzystać obecne grafiki; odtworzyć tylko te, których pełnej sylwetki nie można odzyskać z atlasu. Jeśli równe komórki atlasu nie wystarczą, manifest może opisać kadry osobno dla upraw.

#### 3. Kontrakt manifestu i regresja miniaturek

**Files**: `src/data/crop-catalog.test.ts`, `src/components/garden/crop-thumbnail-manifest.ts`

**Intent**: Chronić mapowanie wszystkich upraw, granice opisanych kadrów i bezpieczny fallback przed przyszłymi zmianami atlasu.

**Contract**: Testy obejmują komplet aktywnych ID, unikalność/zgodność przypisania oraz to, że metadane każdego kadru mieszczą się w źródłowym obrazie i nie zastępują nazwy uprawy. Faktyczne wycentrowanie i brak obcięć pozostają dodatkowo sprawdzane wizualnie, bez wprowadzania nowej biblioteki dekodującej obrazy.

### Success Criteria:

#### Automated Verification:

- `npm run test:unit` sprawdza komplet 31 aktywnych miniaturek, ich poprawne mapowanie, bezpieczne granice metadanych i fallback.
- `npm run lint`, `npx astro check` i `npm run build` przechodzą.

#### Manual Verification:

- Na desktopie obejrzeć legendę z całym katalogiem i diagram zawierający różne rośliny: żadna ilustracja nie ma białego paska, nie jest obcięta ani widocznie opuszczona; numerów nie ma na diagramie, kody są w legendzie i tooltipie, a nazwy nadal odpowiadają grafikom.

**Implementation Note**: Zatrzymać się po weryfikacji na desktopie i poprosić o ręczne potwierdzenie poprawy kadrów przed rozpoczęciem fazy 2.

---

## Faza 2: Powiększony diagram na telefonie

### Overview

Dodać czytelny, osobny widok wybranej przestrzeni na wąskim ekranie, zachowując diagram inline na desktopie i bez zmiany pozycji roślin.

### Changes Required:

#### 1. Powiększony dialog z przewijaniem

**File**: `src/components/garden/GardenLayoutView.tsx` (wydzielić komponent dialogu tylko jeśli upraszcza dostępność lub izoluje interakcję)

**Intent**: Dać użytkownikowi telefonu możliwość obejrzenia wybranego diagramu w skali, w której miniatury i odstępy są czytelne.

**Contract**: Dodać przycisk powiększenia wyłącznie dla mobilnego układu każdej przestrzeni. Otwarty, prawie pełnoekranowy dialog pokazuje tę samą przestrzeń w większej, stałej skali i pozwala przewijać diagram poziomo oraz pionowo. Desktop zachowuje obecny diagram inline bez przycisku dialogu. Dialog ma nazwę dostępną, widoczny przycisk zamknięcia, obsługę Escape, zarządzanie i przywrócenie fokusu oraz fokusowalny viewport przewijania. Bez gestów pinch i bez zoomowania strony jako substytutu powiększenia diagramu.

#### 2. Testy niezmienionej projekcji i kontrole jakości

**Files**: `src/lib/garden-layout.test.ts`, `src/components/garden/GardenLayoutView.tsx`

**Intent**: Upewnić się, że nowa warstwa oglądania nie zmienia wyniku generatora ani geometrycznego położenia roślin.

**Contract**: Zachować i uruchomić asercje równych osi oraz projekcji rzeczywistych środków `xCm`/`yCm`; jeżeli wymiarowanie większego viewportu zostanie wydzielone do czystej funkcji, objąć ją testem Vitest. Nie dodawać zależności testujących DOM ani zmieniać algorytmu.

### Success Criteria:

#### Automated Verification:

- `npm run test:unit` przechodzi, a testy projekcji nadal potwierdzają równą skalę osi i niezmienione środki roślin niezależnie od powiększonej prezentacji.
- `npm run lint`, `npx astro check` i `npm run build` przechodzą.

#### Manual Verification:

- Na telefonie otworzyć dialog dla wybranej skrzyni/sektora, przewinąć diagram w poziomie i pionie, zamknąć go przyciskiem oraz klawiszem Escape i potwierdzić powrót fokusu do przycisku otwierającego.
- Sprawdzić screenshot widoku mobilnego przed i po otwarciu dialogu: diagram jest czytelniejszy, można dotrzeć do jego krawędzi, strona nie przewija się poziomo poza viewportem, a poprawione ilustracje pozostają widoczne. Kody są w legendzie i tooltipie; na desktopie diagram nadal jest inline.

**Implementation Note**: Zatrzymać zmianę do ręcznej akceptacji screenshotów mobilnego widoku bazowego i powiększonego oraz potwierdzenia zachowania desktopowego.

## Testing Strategy

### Unit Tests:

- Manifest: wszystkie aktywne ID są przypisane dokładnie raz do prawidłowych kadrów, bezpieczne granice nie wychodzą poza źródło, fallback pozostaje dostępny.
- Projekcja diagramu: równa liczba pikseli na centymetr dla obu osi oraz zgodność środków znaczników z zapisanymi współrzędnymi.
- Jeśli skala większego viewportu zostanie wydzielona do czystej funkcji, testować jej wymiary bez testowania DOM.

### Integration Tests:

- Nie dodawać frameworka UI/e2e ani nowych zależności. Istniejące testy jednostkowe, `npx astro check` i build sprawdzają kontrakty danych i kompilację; zachowanie przeglądarkowe dialogu odbierane jest ręcznie.

### Manual Testing Steps:

1. Otworzyć `/garden` na desktopie; obejrzeć kompletną legendę i diagram z wieloma rodzajami roślin. Sprawdzić pasek, wyrównanie, przycięcie, zgodność nazw, kody w legendzie i szczegóły w tooltipie.
2. Otworzyć `/garden` na telefonie; sprawdzić widok inline, brak poziomego overflow strony oraz dostępny przycisk powiększenia przy danej przestrzeni.
3. Otworzyć dialog i przewinąć obie osie do skrajnych krawędzi; zamknąć przyciskiem i ponownie Escape, sprawdzając fokus po każdym zamknięciu.
4. Zrobić trzy screenshoty odbiorowe: desktop, telefon przed otwarciem dialogu i telefon z powiększonym diagramem po przewinięciu.

## Performance Considerations

Nie dodawać zewnętrznych żądań ani ciężkich bibliotek. Użyć lokalnych miniaturek; dialog renderuje tylko wybraną przestrzeń i utrzymuje jeden diagram SVG.

## Migration Notes

Brak migracji. Nie zmieniają się dane zapisane przez użytkownika, schemat bazy, API ani wersja katalogu; zmiana dotyczy warstwy prezentacji i metadanych kadrów.

## References

- Frame brief: `context/changes/garden-diagram-thumbnail-readability/frame.md`
- Powiązany kontrakt diagramu i gęstych oznaczeń: `context/changes/carrot-spacing-and-diagram-readability/plan.md`
- Wspólny renderer i legenda: `src/components/garden/GardenLayoutView.tsx`
- Manifest miniaturek: `src/components/garden/crop-thumbnail-manifest.ts`
- Geometria i projekcja: `src/components/garden/garden-layout-diagram.ts`, `src/lib/garden-layout.test.ts`
- Test mapowania katalogu: `src/data/crop-catalog.test.ts`

## Progress

### Phase 1: Integralne miniatury i identyfikatory

#### Automated

- [x] 1.1 `npm run test:unit` sprawdza komplet 31 aktywnych miniaturek, ich poprawne mapowanie, bezpieczne granice metadanych i fallback.
- [x] 1.2 `npm run lint`, `npx astro check` i `npm run build` przechodzą.

#### Manual

- [x] 1.3 Na desktopie obejrzeć legendę z całym katalogiem i diagram zawierający różne rośliny: żadna ilustracja nie ma białego paska, nie jest obcięta ani widocznie opuszczona; numery nie są widoczne na diagramie, kody pozostają w legendzie i tooltipie, a nazwy nadal odpowiadają grafikom.

### Phase 2: Powiększony diagram na telefonie

#### Automated

- [x] 2.1 `npm run test:unit` przechodzi, a testy projekcji nadal potwierdzają równą skalę osi i niezmienione środki roślin niezależnie od powiększonej prezentacji.
- [x] 2.2 `npm run lint`, `npx astro check` i `npm run build` przechodzą.

#### Manual

- [x] 2.3 Na telefonie otworzyć dialog dla wybranej skrzyni/sektora, przewinąć diagram w poziomie i pionie, zamknąć go przyciskiem oraz klawiszem Escape i potwierdzić powrót fokusu do przycisku otwierającego.
- [x] 2.4 Sprawdzić screenshot widoku mobilnego przed i po otwarciu dialogu: diagram jest czytelniejszy, można dotrzeć do jego krawędzi, strona nie przewija się poziomo poza viewportem, a poprawione ilustracje pozostają widoczne. Kody są w legendzie i tooltipie; na desktopie diagram nadal jest inline.
