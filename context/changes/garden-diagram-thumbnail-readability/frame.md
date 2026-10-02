# Frame Brief: Kadrowanie miniaturek i czytelność diagramu

> Framing step before `/10x-plan`. Oddziela zaobserwowane objawy od początkowego pomysłu na rozwiązanie.

## Reported Observation

> „Na wszystkich roślinach przecina je jakiś biały pasek + rośliny są za nisko, dzieje się tak na wszystkich”.

Pierwszy zrzut był z desktopu i pokazywał dziwnie przycięte ilustracje. Na telefonie grafiki są ledwo widoczne. Miniatury pasują do nazw; użytkownik potwierdził też, że ten sam pasek występuje w diagramie i w legendzie.

## Initial Framing (preserved)

- **User's stated cause or approach**: Kadrowanie miniaturek wydaje się nieprawidłowe, a diagram na telefonie jest za mały do wygodnego odczytu.
- **User's proposed direction**: Powiększanie lub poziome przewijanie, być może w osobnym modalu/dialogu na telefonie.
- **Pre-dispatch narrowing**: Przycięcie jest także na desktopie; pasek i niskie położenie dotyczą wszystkich roślin; pasek występuje również w legendzie; przypisanie miniatur do nazw jest poprawne.

## Dimension Map

Obserwacja mogła powstać na trzech odrębnych etapach:

1. **Wspólna kompozycja glyphu** — nakładka lub tło współdzielone przez diagram i legendę może zasłaniać ilustracje.
2. **Zawartość i granice komórek atlasu** — stałe wycinanie równych komórek może dociskać lub obcinać ilustracje niezależnie od nakładki.
3. **Responsywna skala diagramu** — zachowanie fizycznej skali cm może zmniejszać znaczniki na telefonie; sama skala nie tłumaczy paska na desktopie.

## Hypothesis Investigation

| Hypothesis | Evidence | Verdict |
| --- | --- | --- |
| Wspólna plakietka powoduje biały pasek | `CropAtlasGlyph` rysuje prostokątną plakietkę w dolnej części ilustracji (`src/components/garden/GardenLayoutView.tsx:100–101`); token `garden-surface` wskazuje biały kolor (`src/styles/global.css:11`). Ten sam glyph jest używany przez diagram i legendę (`GardenLayoutView.tsx:208–214, 282–285`), zgodnie z potwierdzeniem użytkownika. | **STRONG** |
| Podział atlasu dociska/ucina rośliny | Renderer wybiera równe komórki 6×6 (`src/components/garden/crop-thumbnail-manifest.ts:2–9, 51–68`). Badanie pikseli pliku `public/crops/crop-atlas.webp` wykazało, że nieprzezroczysta ilustracja w 30 z 31 użytych komórek dochodzi do dolnej granicy, a w pozostałej do ok. 95% wysokości. Biały pasek nie występuje jako wspólna zawartość atlasu. | **STRONG** |
| Pełnoszerokościowy SVG zmniejsza znaczniki na telefonie | SVG skaluje się do szerokości kontenera przy proporcjach przestrzeni (`src/components/garden/GardenLayoutView.tsx:155–161`); średnice znaczników mają zakres 0,8–5,5 cm (`src/components/garden/garden-layout-diagram.ts:1–3, 75–78`). Przy wąskim ekranie oznacza to zaledwie kilka pikseli. Przy diagramie nie znaleziono zoomu, przesuwania ani poziomego przewijania. | **STRONG** |

## Narrowing Signals

- Występowanie paska także w legendzie wskazuje na wspólny glyph, nie wyłącznie viewport diagramu.
- Dziwne kadrowanie na desktopie i niska czytelność na telefonie nie mają jednej przyczyny: skalowanie mobilne nie może wyjaśnić desktopowego paska.
- Poprawne nazwy miniaturek potwierdzają mapowanie ID→roślina, ale nie potwierdzają poprawności granic ani wyrównania obrazu.

## Cross-System Convention

Zatwierdzony follow-up S-04 wymaga zachowania rzeczywistych `xCm`/`yCm`, równych osi skali i czytelnego widoku na telefonie; symbole wolno adaptować wyłącznie wizualnie (`context/changes/carrot-spacing-and-diagram-readability/plan.md:39–49`). Projekt dopuszcza dostosowanie reprezentacji gęstych pozycji bez zmiany geometrii. Przegląd `src/components`, `src/pages` i `src/styles` nie znalazł istniejącego wzorca modalu, zoomu ani przesuwania diagramu, więc modal nie jest konwencją projektu.

## Reframed (or Confirmed) Problem Statement

> **Rzeczywistym problemem są dwa niezależne defekty prezentacji:** wspólna warstwa miniaturek zasłania dół ilustracji, a komórki atlasu dociskają lub obcinają rośliny; dodatkowo pełna, centymetrowa skala nie daje na telefonie wygodnego sposobu obejrzenia szczegółów.

Początkowe podejrzenie kadrowania jest trafne, ale nie cały problem wynika z atlasu: pasek dodaje renderer. Powiększony widok lub przewijanie dotyczy problemu mobilnego i samo nie naprawi błędów ilustracji.

## Confidence

- **HIGH** — zgodność obserwacji z renderowaniem paska jest bezpośrednia; analiza atlasu i rozmiarów znaczników potwierdza pozostałe objawy; wymagania projektu podkreślają zachowanie geometrii.

## What Changes for `/10x-plan`

Plan powinien osobno określić kryteria pełnego, niewysłoniętego i prawidłowo wyrównanego glyphu oraz sposób wygodnego oglądania diagramu na telefonie bez zmiany rzeczywistych współrzędnych. Modal nie powinien być przyjęty z góry: plan ma ocenić go względem przewijanego/powiększanego widoku i dostępności.

## References

- `src/components/garden/GardenLayoutView.tsx:62–103, 155–214, 276–285`
- `src/components/garden/crop-thumbnail-manifest.ts:1–9, 17–73`
- `src/components/garden/garden-layout-diagram.ts:1–4, 44–80`
- `src/styles/global.css:11, 96`
- `context/changes/carrot-spacing-and-diagram-readability/plan.md:39–49, 97–115`
- Investigation tasks: `01a0f6fa-3c99-7353-a60f-f6007e113f33`, `01a0f6fa-41df-7601-a949-09592f752a64`, `01a0f6fa-4ac0-7400-87ed-01674657d11c`
