# Kadrowanie miniaturek i czytelność diagramu — skrót planu

> Full plan: `context/changes/garden-diagram-thumbnail-readability/plan.md`
> Frame brief: `context/changes/garden-diagram-thumbnail-readability/frame.md`

## What & Why

> **Rzeczywistym problemem są dwa niezależne defekty prezentacji:** wspólna warstwa miniaturek zasłania dół ilustracji, a komórki atlasu dociskają lub obcinają rośliny; dodatkowo pełna, centymetrowa skala nie daje na telefonie wygodnego sposobu obejrzenia szczegółów.

Naprawa usunie etykietę z ilustracji na diagramie (kody pozostaną w legendzie, a szczegóły w tooltipie), skoryguje kadry i doda na telefonie powiększony diagram, który można przewijać bez zmiany wyliczonego rozmieszczenia.

## Starting Point

Wspólny `CropAtlasGlyph` jest używany na diagramie i w legendzie oraz nakłada numer na dół grafiki. Atlas dzieli rośliny na równe komórki bez indywidualnych marginesów, a diagram na telefonie dopasowuje się do szerokości ekranu. Nazwy i przypisania miniatur są poprawne; w repo są testy logiki i mapowania, ale nie ma testów interakcji UI.

## Desired End State

Wszystkie aktywne grafiki są wycentrowane i w pełni widoczne; na diagramie nie wyświetla się numer, a kody upraw pozostają w legendzie i szczegółach tooltipa. Desktop zachowuje diagram inline; na telefonie wybrany diagram otwiera się w pełnoekranowym, przewijanym w obu kierunkach dialogu z dostępnością klawiaturową. Pozycje, sąsiedztwo, dane i algorytm pozostają bez zmian.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Złożoność i pytania | MEDIUM; 5 pytań planistycznych | Zakres obejmuje UI i zasoby oraz testy, bez zmiany algorytmu ani bazy. | Plan |
| Telefon | Dialog z przewijaniem poziomym i pionowym, bez pinch-to-zoom | Zapewnia większy widok bez kosztu własnych gestów powiększania. | Plan |
| Identyfikatory | Bez numerów na diagramie; kody w legendzie i szczegóły w tooltipie | Ilustracje pozostają czytelne, a legenda i tooltip nadal pozwalają rozpoznać uprawę. | Akceptacja użytkownika po Phase 1 |
| Ilustracje | Zachować obecny zestaw; naprawić kadry, regenerować tylko nienaprawialne | Grafiki pasują do nazw i nie wymagają pełnej wymiany. | Plan |
| Desktop | Diagram inline; powiększony dialog tylko na telefonie | Problem szczegółowego odczytu dotyczy przede wszystkim wąskiego ekranu. | Plan |
| Weryfikacja | Vitest i istniejące bramki + ręczny odbiór UI, bez nowych zależności | Repo nie ma narzędzi do testów interakcji komponentów, a zakres pozostaje mały. | Plan |

## Scope

**In scope:**

- Usunięcie paska i numerów nakładanych na ilustracje; kody pozostają w legendzie i tooltipie.
- Poprawa bezpiecznych kadrów miniaturek dla wszystkich 31 aktywnych upraw.
- Przewijany dialog większego diagramu na telefonie, obsługiwany przyciskiem, Escape i klawiaturą.
- Testy mapowania/kadrów oraz ręczny przegląd desktopu i telefonu.

**Out of scope:**

- Zmiany algorytmu, współrzędnych, rozstaw, katalogu, bazy lub API.
- Pełne odtworzenie zestawu ilustracji, jeśli obecne można naprawić.
- Pinch-to-zoom, dialog na desktopie i nowy framework testów UI/e2e.

## Architecture / Approach

Zmienić wspólny renderer glyphu i metadane/układ atlasu, zachowując tożsamość każdej uprawy. Następnie dodać mobilny dialog, który prezentuje wybraną przestrzeń w większej skali w tym samym SVG i udostępnia przewijany viewport; dane projekcji pozostają jedynym źródłem współrzędnych.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Integralne miniatury i identyfikatory | Czyste, wycentrowane ilustracje bez numerów w diagramie; kody w legendzie i tooltipie. | Część sylwetek może być nieodwracalnie ucięta w źródłowym atlasie. |
| 2. Powiększony diagram na telefonie | Dostępny z klawiatury dialog z większym, przewijanym diagramem; desktop pozostaje inline. | Dialog i scroll nie mogą zmieniać geometrii ani przewijać całej strony. |

**Prerequisites:** Przed implementacją uwzględnić, że pliki atlasu, manifestu i renderer diagramu mają staged zmiany Phase 2 `carrot-spacing-and-diagram-readability`; budować na obecnym worktree i zachować staging.
**Estimated effort:** Dwie lokalne fazy implementacyjne z ręcznym odbiorem po każdej; bez migracji lub nowego frameworka.

## Open Risks & Assumptions

- Krawędzie źródłowego atlasu mogą oznaczać utratę fragmentów ilustracji; tylko nienaprawialne miniatury będą wymagały regeneracji.
- Skala w dialogu musi być dostatecznie czytelna, a jednocześnie zachować równe osie, centymetrowy układ i możliwość dotarcia do skrajnych obszarów.

## Success Criteria (Summary)

- Na desktopie wszystkie miniatury mają poprawne nazwy, są wycentrowane i nie mają paska ani uciętych sylwetek.
- Na telefonie wybrany diagram można otworzyć w większym dialogu, przewinąć w obu kierunkach i zamknąć z przywróceniem fokusu.
- Testy i build przechodzą; ręczne screenshoty potwierdzają poprawę bez zmiany rzeczywistych pozycji roślin.
