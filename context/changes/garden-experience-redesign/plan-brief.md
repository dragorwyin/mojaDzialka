# Spójne doświadczenie Moja Działka — skrót planu

> Pełny plan: `context/changes/garden-experience-redesign/plan.md`
>
> Frame: `context/changes/garden-experience-redesign/frame.md`
>
> Research: `context/changes/garden-experience-redesign/research.md`

## Co i dlaczego

Po zaakceptowaniu lekkiego, botanicznego kierunku przebudowa obejmuje całą ścieżkę Mojej Działki. Landing i logowanie/rejestracja są już wdrożone oraz odebrane. Pozostały dashboard wymaga dopasowania do rzeczywistej, zatwierdzonej architektury: wygenerowany ogród ma być główną treścią po zalogowaniu, a konfiguracja sektorów i warzyw ma mieć osobne zakładki.

## Punkt startowy

`/dashboard` jest obecnie ekranem powitalnym z linkiem do `/garden`. To `/garden` wykonuje SSR prywatnych danych i renderuje konfigurację przestrzeni, uprawy oraz planer pionowo. Po zapisie konfiguracji endpoint wraca obecnie do `/garden?saved=1` albo `?error=…`.

Stary plan pomylił niezatwierdzone pliki robocze `GardenDashboard.astro` i `ViewTabs.astro` z bazowym kodem. Są one usunięte; nowy plan bazuje na zatwierdzonych routach, formularzach i planerze.

## Oczekiwany rezultat

`/dashboard` staje się głównym widokiem ogrodu. Domyślna zakładka „Mój ogród” pokazuje plan i małe podsumowanie sezonu; „Sektory” i „Warzywa” zachowują edycję oraz zapis. `/garden` przekierowuje do `/dashboard`, a po zapisie sektorów użytkownik wraca do odpowiedniej zakładki wraz z komunikatem.

## Ustalone decyzje

| Decyzja | Wybór | Dlaczego | Źródło |
| --- | --- | --- | --- |
| Zakres | Landing, auth i aplikacja | Spójna ścieżka produktu | Frame / użytkownik |
| Kierunek | Jasny, botaniczny, ilustracyjny; zaakceptowany mockup | Oczekiwana lekkość i ogrodniczy charakter | Użytkownik |
| Główny widok | Plan grządek z niewielkim podsumowaniem sezonu | Ogród jest główną wartością produktu | Użytkownik |
| Główny adres | `/dashboard`; `/garden` przekierowuje do niego | Jedno kanoniczne miejsce po zalogowaniu | Użytkownik, 2026-10-10 |
| Konfiguracja | Osobne zakładki „Sektory” i „Warzywa” | Ułatwia skupienie na planie i edycję danych | Użytkownik |
| Zachowanie | Zachować payloady API, prywatność, auth, SSR i logikę planera | Zmiana ma dotyczyć kompozycji i prezentacyjnych redirectów | Research / Plan |

## Zakres

**W zakresie:**

- Przeniesienie istniejącego SSR ogrodu na `/dashboard` oraz przekierowanie `/garden`.
- Trzy responsywne zakładki; utrzymanie komunikatów i powrotu do zakładki Sektory po zapisie.
- Dopracowanie diagramu, harmonogramu i stanów planera w zaakceptowanym stylu.
- Końcowy przegląd landing/auth/dashboard i istniejących kitchen sinków na desktopie i mobile.

**Poza zakresem:**

- Zmiany schematu danych, sesji, walidacji, logiki planera lub kształtu payloadów API.
- Przywracanie niezatwierdzonych plików `GardenDashboard.astro` / `ViewTabs.astro`.
- Prywatne dane na landing page, kopiowanie artworku referencji, nowa biblioteka UI lub framework testowy.

## Podejście

Fazy 1–3 są ukończone. Faza 4 przenosi kompozycję SSR z `/garden` do `/dashboard`, układa istniejące formularze i planer w trzy zakładki oraz aktualizuje alias i redirecty prezentacyjne. Faza 5 sprawdza rzeczywiste rendery, responsywność, focus i stany planera. Payloady zapisu, prywatność i logika domenowa pozostają bez zmian.

## Fazy w skrócie

| Faza | Dostawa | Główne ryzyko |
| --- | --- | --- |
| 1. Koncepcja wizualna | Mockup desktop/mobile zaakceptowany | Niskie — kierunek już potwierdzony |
| 2. Tokeny i nawigacja | Jasny system i kontrast, commit `7dd3895` | Niskie — wdrożone |
| 3. Landing i auth | Polska strona i formularze, commit `6c717ba`; odbiór manualny zaliczony | Niskie — odebrane |
| 4. Dashboard ogrodu | `/dashboard` z planem i zakładkami; alias oraz redirecty zgodne | Zmiana SSR/routingu może zgubić tab lub komunikat |
| 5. Odbiór wizualny | Zrzuty desktop/mobile całej ścieżki i finalna akceptacja | Zależy od działającego środowiska odbioru |

**Warunek wstępny:** zaakceptowany mockup i decyzja o kanonicznym `/dashboard` są zapisane.

**Szacowany wysiłek:** około 1–2 sesji na wdrożenie dashboardu i jego odbiór.

## Ryzyka i założenia

- Trzy wyspy React muszą zachować hydratację oraz eventy mimo przejścia do zakładek.
- Redirecty `/api/garden` i auth zmieniają adres docelowy, ale muszą utrzymać komunikat zapisu, wybraną zakładkę i bezpieczne `returnTo`.
- Finalny odbiór zależy od dostępnego, skonfigurowanego lokalnego środowiska.

## Kryteria sukcesu

- `/dashboard` otwiera się na planie; edycja sektorów i warzyw działa w osobnych zakładkach.
- `/garden` przekierowuje do `/dashboard`; zapis sektorów wraca do zakładki z komunikatem.
- Auth, prywatność, generator, stany planu oraz powiększenie diagramu zachowują dotychczasowe kontrakty.
- Użytkownik akceptuje zrzuty desktopowe i mobilne.
