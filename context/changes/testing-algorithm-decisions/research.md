---
date: 2026-10-04T15:48:14+02:00
researcher: Codex
git_commit: 9334591f896eef521459582fe7eabaed310326cd
branch: main
repository: mojaDzialka
topic: "Phase 1: geometria, priorytety i kontrakty danych algorytmu rozmieszczenia"
tags: [research, garden-layout, testing, crop-catalog]
status: complete
last_updated: 2026-10-04
last_updated_by: Codex
---

# Research: Poprawność decyzji algorytmu

## Research Question

Zweryfikować ryzyka #1, #5, #6 z `context/foundation/test-plan.md`: odległości i granice, priorytety miksu/sąsiedztwa, braki oraz niepewność danych. Wyjaśnić mechanizmy potencjalnego skupienia cebuli/marchwi w narożniku przy brokułach w pozostałej części; znaleźć istniejącą ochronę i niezależne przypadki do planowania. Nie zakładać błędu, równomierności ani optimum globalnego.

## Summary

- W sprawdzonym generatorze geometria używa centymetrów, minimów końcowych rozstaw oraz prostokątnego wykluczania par przez większy odstęp każdej osi. Lokalne sąsiedztwo ma osobną, eliptyczną definicję (`src/lib/garden-layout.ts:346`, `:387`, `:403`).
- Ranking stawia potwierdzone korzystne sąsiedztwo przed presją procentowego celu, potem kosztem caution, zwartością i remisem ID/x/y (`src/lib/garden-layout.ts:413`). To uzasadnia możliwość skupienia. Bez wymiarów, proporcji i zapisanego wyniku użytkownika nie przypisujemy jednej przyczyny jego konkretnej obserwacji.
- Efektywny katalog przekazuje marchew 7×20 cm, cebulę 5×30 cm i brokuł 40×50 cm; marchew ma niską pewność roboczych danych. Eksport nadpisuje starsze wpisy seed danymi końcowymi (`src/data/crop-catalog.ts:1420`, `:1440`, `:1513`, `:1704`).
- Dotychczasowe testy już obejmują znaczną część zachowań. Wywołanie trzech plików algorytmu/katalogu zakończyło się 32/32 testami (polecenie w Verification). Najtańsze uzupełnienie: testy unit/contract z ręcznymi oczekiwaniami, nie nowa infrastruktura.
- Dwie kwestie kontraktowe wymagają rozstrzygnięcia przed utrwaleniem nowych oczekiwań: środek na brzegu kontra margines rośliny oraz konflikt przy niewykonalnym dokładnym miksie, gdy oba gatunki jednak występują. Nie blokują zbadania odległości i istniejącej semantyki.

## Detailed Findings

### 1. Przepływ i skuteczne dane

Endpoint odczytuje zapisane przestrzenie w kolejności `sort_order`, wybory upraw, wyszukuje rekordy katalogu i przekazuje je do generatora (`src/pages/api/garden-plan.ts:69`, `:99`, `:115`). Snapshot porządkuje przestrzenie według sortOrder/ID i zawiera wersję katalogu/algorytmu (`src/lib/garden-plan-snapshot.ts:33`). Czyste wejście testowe nie potrzebuje bazy ani przeglądarki.

Źródłem dla kompatybilnego pola `spacing` jest `finalSpacing`, poprzez `toLegacySpacing`; final null daje spacing null, etap po przerywce mapuje się na thinning, pozostały na planting, z flagą końcowej obsady (`src/data/crop-catalog.ts:1691`). Seed marchwi na linii 661 nie jest efektywnym rekordem: eksport nadpisuje spacing na linii 1721. Wstępne przypuszczenie o pomijaniu bieżącej marchwi było błędne i zostało odrzucone po sprawdzeniu tego konsumenta.

Dla bieżących metadanych minima wynoszą marchew 7/20, cebula 5/30, brokuł 40/50 cm. Marchew ma zakres 7–8/20–30, confidence low oraz kontekst zatwierdzonego minimum użytkownika, nie uniwersalnej normy agronomicznej (`src/data/crop-catalog.ts:1422`). Nie potwierdzano ponownie źródeł ogrodniczych w tym research: testy mogą dowieść zgodności z roboczym modelem, nie jego biologicznej prawdziwości.

### 2. Geometria i rozróżnienie od sąsiedztwa

`getUsableSpacing` bierze dodatnie skończone minima obu zweryfikowanych osi; nie średnie ani maksima (`src/lib/garden-layout.ts:346`). X odpowiada odstępowi w rzędzie, Y między rzędami. Siatka danego gatunku zaczyna od połowy odstępu i rośnie o pełny odstęp (`:427`). Dopuszczalność granicy dotyczy środka: x≤width, y≤length; kod nie odejmuje połowy rozstawy przy przeciwległym brzegu (`:444`).

Dla dwóch gatunków z rozstawami 10×20 oraz 30×40 cm: para jest wykluczona, gdy jednocześnie dx<30 i dy<40. Równość na jednej osi pozwala ją umieścić (`:403`). To prostokątna reguła robocza; średnia odstępów albo promień koła byłby innym kontraktem.

Sąsiedztwo oznacza `hypot(dx/maxX, dy/maxY)≤1` (`:387`). Dla tych rozstaw delta (30,0) jest dopuszczalna i sąsiednia; (29,39) jest geometrycznie wykluczona, mimo dystansu znormalizowanego około 1,374; (30,40) jest dopuszczalna, lecz niesąsiednia (√2). Obie definicje trzeba w testach rozdzielić.

### 3. Cele, skupienie i koszt wyszukiwania

Po odrzuceniu nakładania i twardych negatywnych sąsiadów (`:737`) ranking porównuje: liczbę supported malejąco → targetPressure malejąco → caution rosnąco → najbliższy dystans rosnąco → ID → x → y (`:413`). Twarda blokada wymaga status negative i hardBlock (`:374`); brak relacji jest neutralny.

Presja celu to procent docelowy minus udział dotychczasowej liczby roślin; liczniki obejmują wcześniejsze przestrzenie, lokalne relacje bieżącą przestrzeń (`:479`, `:697`, `:701`, `:793`). Jest to miks liczby jednostek, nie powierzchni. Cebula–marchew ma supported, confidence low (`src/data/crop-catalog.ts:1727`). Dobre sąsiedztwo może więc utrwalać skupienie mimo procentowego niedoboru brokułu. Brokuł ma większe odstępy, które odrzucają pozycje blisko drobniejszych upraw. To mechanizm możliwego wyniku, nie odtworzenie konkretnego planu użytkownika.

Domyślne ograniczenia sprawdzonego kodu: 2000 sprawdzeń na wywołanie, 256 punktów na gatunek/przestrzeń, do 8 dopuszczalnych alternatyw gatunku na iterację mieszanego układu; dla jednego gatunku limit alternatyw to 1 (`src/lib/garden-layout.ts:12`, `:685`, `:730`). Siatka jest obcinana w kolejności wierszy od początku, więc dalsze regiony mogą nie być rozważane (`:440`). Zachowane kandydatury są ponownie sprawdzane i zużywają budżet. Wybrana pozycja jest dodawana bez cofania wcześniejszych decyzji (`:775`). To zachłanna heurystyka, bez dowodu maksymalnej obsady lub optimum całego układu.

Obcięcie siatki i budżetu daje ostrzeżenia (`:708`, `:876`), budżet etykietuje przestrzeń partial, pozostałe not_processed (`:813`, `:823`). Dla pominiętego gatunku niepełne wyszukiwanie prowadzi do search_limit zamiast dowodu no_fit (`:828`). Stabilne powtórzenie tych samych wejść jest czym innym niż niezmienność po przestawieniu przestrzeni przy ograniczonym budżecie.

### 4. Wyjaśnienia i konflikty

UI już zawiera „Sąsiedzi i uzasadnienie pozycji”, współrzędne i zapisany opis (`src/components/garden/GardenLayoutView.tsx:406`). Nie trzeba dodawać tej funkcji. Opis powstaje na podstawie rozważonej krótkiej listy (`src/lib/garden-layout.ts:493`); supported>0 dostaje od razu kategorię supported_neighbor (`:508`). Same-crop compactness jest opisywane przed porównaniem presji różnych upraw (`:516`), choć właściwy ranking ma target przed compactness. Kategoria jest skrótem lokalnej przesłanki, nie pełnym dowodem przyczynowym ani porównaniem wszystkich układów. Testuj prawdziwość przesłanek, nie zakładaj kompletności wyjaśnienia.

Wykonany odczytowy eksperyment: przestrzeń 30×10 cm, syntetyczne końcowe rozstawy A/B 10×10, cele 80/20, brak relacji. Ręcznie wyliczone punkty: (5,5), (15,5), (25,5). Generator dał A/B/A, liczby 2/1, udziały 66⅔/33⅓, conflicts=[], candidateChecks=15 i limitReached=false. Oczekiwania geometrii/niemożliwości dokładnego 80/20 wynikają z trzech komórek, nie kopiowania oceny algorytmu. Gałąź emisji konfliktów dotyczy gatunku o actualCount=0 (`:828–861`); oba gatunki dodatnie omijają ją.

PRD FR-006 obiecuje konflikt przy geometrii uniemożliwiającej cele (`context/foundation/prd.md:79`). Target/actual są ujawnione, ale wymaga doprecyzowania, czy dyskretność liczby roślin również wymaga konfliktu i z jaką tolerancją. Nie oznaczaj każdej różnicy jako konfliktu: wpływają na nią także supported oraz niepełne przeszukiwanie.

### 5. Braki danych i istniejące testy

Kolejność walidacji wejść: invalid_proportion, missing_spacing, unverified_spacing, invalid_spacing, non_final_spacing (`src/lib/garden-layout.ts:637–682`). Low confidence nie jest warunkiem odrzucenia. Etap/pewność trafiają do pozycji i podsumowania (`:620`, `:787`), UI je prezentuje oraz wymienia pominięcia (`src/components/garden/GardenLayoutView.tsx:520`, `:563`).

Ochrona istniejąca w `src/lib/garden-layout.test.ts`:

- Produkcyjna marchew: minimum 7 cm i odstępy w rzędzie (:41); brakuje osobnego dowodu drugiej osi 20 cm oraz propagacji low.
- Determinizm, dwa sektory, sumy i pary (:71), globalny miks (:114), izolacja sąsiadów (:140).
- Negatywny promień (:169), zwartość z ustalonymi współrzędnymi (:198), supported ponad presją celu (:275), caution/unknown (:326), twarda blokada (:363).
- Limity siatki/budżetu i stany (:216–274), missing (:391), nieweryfikowane osie (:412), siewna kukurydza (:440), no_fit (:467), starszy zapis (:478).
- Projekcja zachowuje centra i wspólną skalę (:499); średnica ikony jest prezentacyjna, nie rozstawą biologiczną (`src/components/garden/garden-layout-diagram.ts:53`, `:110`).

Obecny test par wylicza próg z output.spacing (`garden-layout.test.ts:106`). Wspólny błąd normalizacji współrzędnych i metadanych mógłby więc go ominąć. Przypadki uzupełniające powinny brać wartości z niezależnych stałych fixture.

Testy katalogu kontrolują rozdział końcowego/siewnego modelu, konkretne dane marchwi i odrzucenie błędnych rekordów (`src/data/crop-catalog.test.ts:112`, `:183`). Brakuje pełnego kontraktu odwzorowania finalSpacing→spacing zakresów/źródeł/pewności/etapu oraz bezpośrednich engine przypadków invalid_spacing, non_final_spacing i propagacji low. Siewna kukurydza trafia przez final=null do missing_spacing, więc nie dowodzi gałęzi non_final_spacing.

## Planning Recommendations

Najtańsza warstwa dla #1/#5/#6 to istniejący Vitest unit/contract. Nie dodawać e2e/bazy do matematyki silnika ani powielać testu supported ponad miks. DOM-widoczność niepewności to osobna weryfikacja funkcjonalna, nie kosmetyka; test obiektu jej nie dowodzi.

Niezależne małe przypadki do wyboru przez plan:

1. Jeden gatunek 10×20, przestrzeń 20×40: ręczna lista (5,10), (15,10), (5,30), (15,30). Przestrzeń 4×40 nie mieści środka x=5. Zakres 10–15/20–30 sprawdza wybór minimów.
2. Pary 10×20/30×40: równość i wartości tuż poniżej progów oraz rozdział prostokąt/ellipse opisany wyżej. Przypadek publicznego generatora musi faktycznie rozważyć kontrolowaną parę; nie dopisywać testu prywatnego helpera dla samego pokrycia.
3. Mała neutralna siatka 30×10, cele 80/20: oddzielić liczbowe wyniki od decyzji o tolerancji konfliktu. Osobna caution fixture rozróżnia presję celu od miękkiego kosztu.
4. Jawne niepoprawne osie i isFinalPlanting=false; final low zachowuje confidence/stage. Kontrakt adaptera z finalSpacing sprawdza transformację, nie prawdę agronomiczną.
5. Produkcyjny miks marchew/cebula/brokuł jako regresja z jawnymi wejściami i źródłem oczekiwań; bez twierdzenia, że odtwarza obserwację użytkownika.

Plan kończy się uzupełnieniem §6.1–§6.2 test-plan: lokalizacja, naming, test referencyjny, komenda i polityka niezależnych oczekiwań. `package.json:16` ma jawną listę unit: nowy plik musi wejść do niej już w tym etapie, aby był uruchamiany przez istniejącą bramkę, bez czekania do Phase 3.

## Test-plan Corrections to Consider

Nie edytowano zamrożonej strategii.

- #1: rozróżnić zgodność roboczego modelu od agronomicznej prawdy; określić środek kontra margines przed nowym oczekiwaniem brzegowym.
- #5: sprawdzać ranking i prawdziwość istniejących wyjaśnień; nie obiecywać pełnego uzasadnienia wszystkich alternatyw. Konflikt częściowego odchylenia wymaga decyzji kontraktowej.
- #6: niepewność zachować/ujawnić, nie odrzucać automatycznie low. Nie dodawać fikcyjnego warunku high confidence.
- §5: jeżeli Phase 1 tworzy plik testu, dopisać go do obecnej komendy teraz. Reconciliation §3 nastąpi przez orchestrator; research nie zmienia tabeli.

## Architecture Insights

Czysty silnik i adapter końcowego katalogu umożliwiają małe referencyjne testy bez Supabase. Warto oddzielić dowód normalizacji, geometrii, rankingu, ograniczeń wyszukiwania i prezentacji od siebie. Kopia generatora w oracle nie daje niezależnego sygnału.

## Historical Context

- `context/archive/2026-09-28-generate-garden-layout/plan.md:43`: brak obietnicy optimum globalnego — potwierdzone przez zachłanny kod; zwrot maksymalizacji nie jest dowodem maksimum.
- `context/changes/garden-crop-catalog-and-layout/plan.md:114`: zwarte pozycje i wyjaśnienia — wspierane przez bieżący ranking/UI; starsze twierdzenie research o braku nagrody za zwartość nie opisuje dzisiejszego kodu.
- `context/changes/carrot-spacing-and-diagram-readability/frame.md`: starszy przypadek gęstej marchwi/ikon nie wyznacza obecnych minimów; obecny kontrakt 7 cm jest w efektywnym katalogu i teście (:1422/:41).

## Code References

Decydujące kotwice: `src/lib/garden-layout.ts:346`, `:387`, `:403`, `:413`, `:427`, `:493`, `:628`, `:828`; `src/data/crop-catalog.ts:1420`, `:1691`, `:1704`; `src/lib/garden-layout.test.ts:41`, `:106`; `src/components/garden/GardenLayoutView.tsx:406`; `context/foundation/prd.md:79`.

## Related Research

`context/changes/garden-crop-catalog-and-layout/research.md` — wcześniejszy model i źródła, z istotnymi późniejszymi zmianami silnika; aktualny kod rozstrzyga opis działania.

## Verification and Scope

Przeczytano change/test-plan w całości, sprawdzono endpoint, snapshot, engine, efektywny eksport katalogu, wskazane testy i konsumenta UI. Trzech pracowników badało geometrię, cele i pokrycie; główny agent zweryfikował decydujące ścieżki i poprawił wstępny błąd interpretacji seed katalogu. `lessons.md` nie było obecne.

`npx vitest run src/lib/garden-layout.test.ts src/data/crop-catalog.test.ts src/lib/crop-catalog.test.ts`: 3 pliki, 32 testy, PASS, lokalny Vitest 5.0.2. Wykonano odczytową sondę bieżącego TS (transpilacja w pamięci) dla opisanego 30×10/80–20 oraz skutecznych danych trzech gatunków. Nie napisano testów ani zmieniono kodu aplikacji.

Stan źródeł: main, HEAD podany w metadata, z istniejącymi zmianami użytkownika (m.in. `src/lib/garden-crop-selection.ts`, roadmap i skills); pozostawiono je nietknięte. Kotwice dotyczą lokalnie sprawdzonych plików, nie wymyślonych permalinków. Brak JSON companion; liczby sondy są przykładem prose-only.

## Open Questions

- Czy brzeg oznacza dopuszczalny środek rośliny, czy wymagany margines połowy rozstawy? Obecny kod potwierdza pierwsze; zmiana wymaga decyzji.
- Czy dyskretne 2/1 wobec 80/20 ma być konfliktem geometrii? Jaka tolerancja rozróżnia zaokrąglenie, supported i niepełne wyszukiwanie? Nie utrwalać absence konfliktu jako nowego wymagania bez decyzji.
- Dokładne wejście i wynik użytkownika nie zostały podane. Mechanizmy skupienia są ustalone; jego pojedynczy układ nie został odtworzony. Nie blokuje to małych niezależnych testów kontraktu.
