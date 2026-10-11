# Większa obsada ogrodu i katalog 100+ upraw — Plan Brief

> Full plan: `context/changes/expand-crop-capacity-and-catalog/plan.md`
> Research: `context/changes/expand-crop-capacity-and-catalog/research.md`

## What & Why

Plan usuwa techniczne ograniczenia, przez które generator obcina rozmieszczenie, i przygotowuje aplikację do obliczenia ponad 10 000 końcowych pozycji sadzenia w całym ogrodzie. Rozszerza też katalog do co najmniej 100 obliczalnych wpisów oraz utrzymuje czytelny diagram dzięki agregacji przy oddaleniu i pojedynczym markerom po powiększeniu.

## Starting Point

Generator ma limit 256 punktów siatki na uprawę w skrzyni i 2 000 sprawdzeń na przebieg, a grupowanie odbywa się w drugim przebiegu. Katalog egzekwuje dokładnie 31 wpisów; część nie ma końcowych odstępów. Zapis i dashboard przenoszą pełny obiekt planu, zaś diagram renderuje pozycje pojedynczo.

## Desired End State

Wykonalny ogród zawierający ≥10 000 pozycji generuje się w ≤10 sekund w środowisku zbliżonym do produkcyjnego. Katalog ma ≥100 źródłowych, wyszukiwalnych wpisów z końcową rozstawą; brak danych odmianowych może korzystać z jawnego, niskiej pewności fallbacku dla gatunku. Duży plan zachowuje dokładne dane po zapisie i reloadzie, a Faworyt może być rozmieszczony w skrzyni 120 × 80 cm bez naruszenia odstępu 50 × 100 cm.

## Key Decisions Made

| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| Próg obsady | ≥10 000 w całym ogrodzie; generowanie ≤10 s | Obejmuje wiele skrzyń i daje mierzalny próg odbioru. | Plan |
| Wielkość katalogu | Co najmniej 100 wpisów; odmiany osobno przy własnym ID lub rozstawie | Katalog może rosnąć bez arbitralnego limitu dokładnie 100. | Plan |
| Nieznana rozstawa odmiany | Źródłowa wartość gatunkowa jako jawny fallback niskiej pewności | Wszystkie wpisy da się policzyć bez udawania precyzji odmianowej. | Plan |
| Grupowanie roślin | Jedna zwarta grupa na wpis katalogu i skrzyni; braki raportowane | Zachowuje wcześniejszy zaakceptowany kontrakt. | Research |
| Orientacja Faworyta | Sprawdzać obie orientacje siatki, odstęp pozostaje 50 × 100 cm | Może zmieścić uprawę w skrzyni 120 × 80 cm. | Plan |
| Widok dużego planu | Agregaty przy oddaleniu, indywidualne pozycje po powiększeniu | Diagram pozostaje czytelny bez utraty szczegółów. | Plan |

## Scope

**In scope:** skalowalny generator i pomiar wydajności, obrót siatki, katalog ≥100 obliczalnych wpisów, źródłowy rejestr danych, wyszukiwanie i fallback miniatury, zapis/odczyt dużego planu, agregacja diagramu oraz testy desktop/mobile.

**Out of scope:** liczba nasion na tacki i plon, ręczne przesuwanie/przypisywanie upraw, rozszerzanie relacji sąsiedztwa, osobne ilustracje dla każdego wpisu, ranking popularności i 10 000 pozycji w pojedynczej skrzyni.

## Architecture / Approach

Najpierw zmienić algorytm i wersję fingerprintu planu; później dodać źródłowe dane katalogu i zaktualizować jego inwarianty; na końcu potwierdzić pełny przepływ API–JSONB–dashboard i agregować markery wyłącznie w warstwie widoku. Każda faza kończy się automatyczną weryfikacją i ręcznym odbiorem.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Skalowalny generator i obsługa orientacji | ≥10 000 wykonalnych pozycji, zachowane reguły i Faworyt w wykonalnej orientacji | Koszt przeszukiwania geometrii może przekroczyć 10 s. |
| 2. Katalog 100+ obliczalnych upraw | Źródłowy wykaz i kompletne, oznaczone odstępy dla każdego aktywnego ID | Część wpisów może wymagać fallbacku gatunkowego lub zastąpienia z powodu braków źródeł. |
| 3. Zapis i czytelny diagram dużego planu | Pełny round-trip oraz widok agregowany/indywidualny na desktopie i mobile | JSONB, dekoder lub DOM może stać się wąskim gardłem. |

**Prerequisites:** zatwierdzone decyzje z tej rozmowy; dostęp do źródeł ogrodniczych dla danych katalogu; preview Workers do pomiaru progu 10 s.  
**Estimated effort:** Duża zmiana w trzech fazach; liczba sesji zależy głównie od weryfikacji źródeł 100 wpisów oraz iteracji wydajnościowych.

## Open Risks & Assumptions

- Lista 100+ pozostaje kuratorowana dla polskiego ogrodu amatorskiego i nie będzie przedstawiana jako ranking popularności.
- Limit 10 sekund musi zostać zweryfikowany na środowisku zbliżonym do produkcyjnego; lokalny runtime nie odtwarza wszystkich limitów Workers.
- Brak osobnej miniatury nie może ukrywać uprawy; UI użyje czytelnego fallbacku tekstowego/graficznego.
- Zmiana wersji algorytmu oznaczy stare plany jako nieaktualne do ponownego przeliczenia, zachowując istniejące dane.

## Success Criteria (Summary)

- Wykonalny ogród z co najmniej 10 000 pozycji generuje się w maksymalnie 10 sekund i nie traci pozycji po zapisie i ponownym odczycie.
- Każdy z co najmniej 100 wpisów ma źródłową końcową rozstawę i da się go wyszukać, obliczyć oraz pokazać.
- Przy oddaleniu diagram jest czytelny, a po powiększeniu dostępne są wszystkie indywidualne pozycje i dokładne podsumowania.
