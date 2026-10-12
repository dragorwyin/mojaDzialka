# Frame Brief: Obliczalny katalog warzyw do polskiego ogrodu

> Framing step before /10x-plan. This document separates the reported result
> from the initial explanation and the new catalog scope.

## Reported Observation

Użytkownik trafia na limit 256 roślin obliczonych i wyświetlonych w skrzyniach; niektóre wybrane uprawy, w tym pomidor Faworyt, nie pojawiają się w diagramie lub podsumowaniu.

## Initial Framing (preserved)

- **User's stated cause or approach**: „rosliny o niskiej pewnosci nas nie blokowaly” oraz „Moze szukanie w innych zrodlach?”
- **User's proposed direction**: umożliwić generowanie wszystkich roślin wybieralnych z listy i oprzeć katalog o „100 najbardziej prawdopodobnie popularnych w Polsce warzyw do sadzenia”.
- **Pre-dispatch narrowing**: użytkownik wskazał jednocześnie na generowanie i kompletność katalogu; doprecyzował, że 100 pozycji ma być najbardziej prawdopodobnie popularnymi warzywami w Polsce.

## Dimension Map

The observation could originate at any of these dimensions:

1. **Katalog i źródła rozstawy** — brak końcowego odstępu może sprawić, że wybrana uprawa nie dostanie pozycji.
2. **Pewność danych i polityka generatora** — generator mógłby odrzucać przybliżone dane przez ich niską pewność. ← initial framing
3. **Geometria oraz budżet obliczeń** — ograniczenie kandydatów, orientacja lub brak miejsca może ograniczyć liczbę pozycji niezależnie od jakości danych.
4. **Wyszukiwanie i prezentacja** — wpis może być obecny w katalogu, ale nieodkrywalny w selektorze albo mieć zero faktycznych pozycji.
5. **Definicja katalogu „popularnych”** — dostępność handlowa, konsumpcja i faktyczna częstotliwość uprawy w polskich ogrodach mierzą różne rzeczy.

## Hypothesis Investigation

| Hypothesis | Evidence | Verdict |
| --- | --- | --- |
| Katalog nie dostarcza rozstawy sadzenia dla części wybieralnych pozycji | `src/data/crop-catalog.ts:1394-1408,1554-1555` zawiera pozycje bez `finalSpacing`; generator oznacza brak rozstawy jako pominięcie (`src/lib/garden-layout.ts:868-875`). Aktualny katalog ma 31 wpisów i 28 z rozstawą (`src/data/crop-catalog.ts:1876-1877`, `src/data/crop-catalog.test.ts:112-123`). | STRONG |
| Sama niska pewność blokuje generowanie | `getUsableSpacing` sprawdza zweryfikowane osie i dodatnie wartości, nie poziom pewności (`src/lib/garden-layout.ts:428-437`). Niska pewność jest przenoszona do wyniku. | NONE |
| Geometria lub budżet obliczeń mogą ograniczyć obsadę | Historyczny research wykazał limit 256 punktów na uprawę/przestrzeń i 2 000 sprawdzeń na przebieg (`context/changes/expand-crop-capacity-and-catalog/research.md`, „Pojemność i ograniczenia generatora”). Brak dopasowania geometrycznego jest raportowany osobno (`src/lib/garden-layout.ts:1105-1123`). | STRONG |
| UI może ukrywać część wpisów przy przeglądaniu większego katalogu | Selektor obcina listę do 8 wyników (`src/components/garden/CropSelectionForm.tsx:199-207`); nie wyjaśnia to jednak braku w diagramie już wybranej uprawy. | WEAK |
| Istnieje źródło na reprezentatywny ranking 100 warzyw faktycznie uprawianych przez polskich ogrodników | Repozytorium opisuje próbę 46 działkowców z trzech miast z 2009 r. i wyraźnie nie traktuje jej jako krajowego rankingu (`context/changes/garden-crop-catalog-research/research.md:69-71,224`). GUS opisuje produkcję rolną, a COBORU rejestr odmian, nie popularność w ogrodach. | NONE |

## Narrowing Signals

- Użytkownik doprecyzował, że głównym objawem jest wybrana uprawa, która nie dostaje pozycji (a nie przede wszystkim brak pozycji na liście).
- Użytkownik definiuje popularność jako warzywa faktycznie sadzone w polskich ogródkach; wszystkie pozycje dostępne do wyboru mają być obliczalne i widoczne.
- W dostępnych źródłach brak reprezentatywnego, aktualnego pomiaru częstotliwości uprawy dla 100 pozycji.
- Niska pewność to nie to samo co brak rozstawy: pierwszą można pokazać jako niepewność danych; przy drugim generator nie ma obecnie wartości do użycia.

## Cross-System Convention

Model katalogu oddziela `finalSpacing` od `sowingDensity` (`src/data/crop-catalog.ts:102-145`). Poprzednia zmiana algorytmu już ustanowiła konwencję: niska pewność nie odrzuca poprawnych końcowych danych, a brak rozstawy jest osobnym przypadkiem `missing_spacing` (`context/changes/testing-algorithm-decisions/research.md:66,78,89`). Dane i ich pewność powinny pozostać widoczne jako dwie odrębne właściwości; brak danych nie może być zamaskowany jako „niska pewność”.

## Reframed (or Confirmed) Problem Statement

> **The actual problem to plan around is**: katalog nie ma kompletnej, jawnie pochodzącej ze źródeł końcowej rozstawy i niezawodnej ścieżki wyszukania/raportowania dla każdej wybieralnej uprawy, a obecny limit generatora jest odrębnym ograniczeniem skali.

Niska pewność sama w sobie nie jest przyczyną odrzucenia uprawy. Plan powinien osobno rozwiązać kompletność i widoczność katalogu, zasady użycia oraz ujawniania przybliżonych rozstaw, i wydajność obliczeń. Cel „100 najbardziej prawdopodobnie popularnych” da się uczciwie oprzeć na triangulacji źródeł i opisać jako kuratorowaną listę prawdopodobnie popularnych pozycji; obecne źródła nie uzasadniają twierdzenia, że to dokładny krajowy ranking.

## Confidence

- **MEDIUM** — ścieżka kodu jasno rozdziela niską pewność od braku rozstawy, a limity skali są potwierdzone. Pewność co do kolejności popularności 100 pozycji jest niska, bo nie znaleziono reprezentatywnego badania ogrodów amatorskich.
- Przed oznaczeniem listy jako rankingu potrzebne byłoby reprezentatywne badanie upraw lub wiarygodne, porównywalne dane o faktycznych nasadzeniach. Bez nich należy użyć kwalifikowanego opisu, a nie numerowanej kolejności popularności.

## What Changes for /10x-plan

Plan powinien obejmować nie tylko dodanie rekordów, ale kryterium wyboru możliwie szerokiego zestawu unikalnych typów upraw, źródło i poziom pewności dla końcowej rozstawy, zachowanie obliczalności dla każdej pozycji oraz niezależną ścieżkę obsługi limitów generatora. Popularność i pewność agronomiczna muszą być raportowane osobno. Pierwotne założenie 100 pozycji zostało skorygowane przez użytkownika i nie jest już kryterium odbioru.

## Scope Correction (2026-10-12)

Użytkownik skorygował wymóg katalogu: 100 pozycji nie jest obowiązkowym minimum. Celem jest dodanie jak największej liczby różnych, źródłowo uzasadnionych i obliczalnych typów, przy zachowaniu obecnych typów. Synonimy i duplikaty nie mogą tworzyć osobnych rekordów; odmiany nie zwiększają liczby typów. Odrębne cele użytkowe, takie jak fasola szparagowa i fasola na suche nasiona, mogą pozostać osobnymi typami, gdy rzeczywiście zmieniają planowanie.

## References

- Source files: `src/data/crop-catalog.ts:102-145,1394-1408,1554-1555,1876-1877`; `src/lib/garden-layout.ts:428-437,868-899,1105-1123`; `src/components/garden/CropSelectionForm.tsx:199-207`; `context/changes/testing-algorithm-decisions/research.md:66,78,89`.
- Related research: `context/changes/expand-crop-capacity-and-catalog/research.md`; `context/changes/garden-crop-catalog-research/research.md`.
- External source checks: [Klepacki & Kujawska, Urban Allotment Gardens in Poland](https://journals.sagepub.com/doi/10.2993/0278-0771-38.1.123); [Polish vegetable-consumption survey](https://pmc.ncbi.nlm.nih.gov/articles/PMC9032158/); [COBORU 2024 national variety list](https://coboru.gov.pl/Publikacje_COBORU/Listy_odmian/lo_warzywne_2024.pdf); [GUS agricultural and horticultural production 2024](https://publikacje.new.stat.gov.pl/portal-publikacje/produkcja-upraw-rolnych-i-ogrodniczych-w-2024-r); [PZD gardening recommendations](https://pzd.pl/artykuly/24982/135/JAKIE-NASIONA-WYBRAc-CZesc-1.html).
- Investigation tasks: `/root/confidence_path`, `/root/presentation_path`, `/root/catalog_evidence`.
