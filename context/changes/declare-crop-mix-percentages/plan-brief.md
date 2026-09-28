# Deklarowanie udziałów upraw w procentach — brief planu

> Full plan: `context/changes/declare-crop-mix-percentages/plan.md`
> Research: `context/changes/declare-crop-mix-percentages/research.md`

## What & Why

Formularz wyboru upraw ma pokazywać procentowy miks dla całej działki, bo deklaracja „dużo marchewek, mniej cebuli” jest dla użytkownika czytelniejsza niż abstrakcyjne proporcje. Udział oznacza zamierzoną względną liczbę roślin; nie zmieniamy w tej pracy algorytmu, który później będzie próbował ułożyć uprawy.

## Starting Point

Widok `/garden` zapisuje dodatnie wagi i pokazuje je wprost jako „Proporcja”; backend przechowuje je w istniejącym polu numerycznym. Nie ma widocznej sumy ani ograniczenia 100% w formularzu, a smoke test oczekuje wyświetlenia surowych wartości.

## Desired End State

Istniejące wartości otwierają się jako znormalizowane procenty, pola pozostają niezależne, a użytkownik widzi sumę i może zapisać niepusty wybór tylko przy 100,00% i dodatnim udziale każdej uprawy. Pusta lista nadal czyści wybór; istniejący endpoint i baza pozostają bez zmian, a błąd odczytu nadal blokuje edycję i zapis.

## Key Decisions Made

| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| Znaczenie procentu | Względny udział liczby roślin na całej działce | Odpowiada intencji użytkownika, by jednych warzyw sadzić więcej niż innych; nie przypisuje upraw do grządek | Rozmowa / Research |
| Edycja udziałów | Ręczna; suma widoczna, bez automatycznego bilansowania | Użytkownik zachowuje kontrolę nad każdym udziałem i sam koryguje sumę | Rozmowa |
| Warunek zapisu | Niepusty wybór wymaga sumy 100,00% i dodatniego udziału każdej pozycji; pusty wybór może czyścić dane | Zapobiega zapisaniu niekompletnej deklaracji, nie odbierając funkcji czyszczenia | Rozmowa / Research |
| Zgodność backendu | Użyć istniejącego pola `proportion` i endpointu, bez migracji ani walidacji sumy w API | Zakres obejmuje deklarację interfejsu, nie nowy backendowy kontrakt | Research |
| Dokładność prezentacji | Setne części procenta; konwersja wag rozdziela zaokrąglenia tak, by suma wynosiła dokładnie 100,00% | Widoczna suma musi zgadzać się z udziałami, także dla wag dziesiętnych | Plan |
| Planowanie układu | Nie zmieniać generatora ani nie obiecywać wykonalności geometrycznej | To odrębna decyzja S-04; UI zapisuje zamiar użytkownika | Research / S-04 |

## Scope

**In scope:**

- Normalizacja istniejących wag do procentów przy wczytaniu.
- Ręczne edytowanie niezależnych udziałów i bieżąca suma.
- Blokada zapisu nieprawidłowej niepustej listy, zachowanie pustego czyszczenia i ochrony przy błędzie odczytu.
- Testy logiki, aktualizacja smoke testu oraz lokalny wizualny widok kontrolny ze zrzutami desktop/mobile.

**Out of scope:**

- Zmiany algorytmu układania, przydziału do grządek, wyliczania liczby roślin lub obsługi geometrycznie niewykonalnego celu.
- Zmiana API, RPC, schematu bazy, migracja lub globalny restyle.

## Architecture / Approach

Nowy czysty moduł obsługuje procentową normalizację i walidację wyłącznie dla formularza. `CropSelectionForm` przelicza odczytane wagi, pokazuje udziały i sumę oraz wysyła wartości procentowe jako dodatnie liczby przez istniejący endpoint; walidator backendowy pozostaje bez zmian. Smoke test obejmuje odczyt i zapis, a kontrolny widok zwraca 404 w produkcji i służy w development do oceny stanów formularza.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Procentowy miks upraw dla całej działki | Normalizacja, formularz z sumą 100%, zachowane zapisy/odczyty/czyszczenie, testy i wizualny gate | Zaokrąglenie starych wag lub pomylenie pustego wyboru z błędem odczytu |

**Prerequisites:** Zatwierdzone decyzje produktu i ukończony research; nie jest potrzebna migracja ani zewnętrzny dostęp.  
**Estimated effort:** Jedna mała faza implementacyjna, w przybliżeniu jedna sesja kodowania i weryfikacji.

## Open Risks & Assumptions

- Zaokrąglenie istniejących wag do 0,01 punktu procentowego może minimalnie zmienić ich matematyczny stosunek; metoda największych reszt utrzyma widoczną sumę dokładnie na 100,00%.
- Walidacja sumy pozostaje wyłącznie w UI, więc bezpośredni klient API nadal może wysłać dodatnie wartości o dowolnej sumie — zgodnie z uzgodnionym zakresem.
- Procent jest zapisywany jako liczba w obecnym polu `proportion`; po zapisaniu historyczna skala surowych liczb może się zmienić, choć ich względny sens zostaje zachowany.

## Success Criteria (Summary)

- Wartości 3:1 są widoczne jako 75,00%:25,00%, a każda zmiana użytkownika aktualizuje sumę bez modyfikowania innych upraw.
- Nieprawidłowy niepusty miks nie może być zapisany; pusty wybór nadal czyści dane po udanym odczycie, a błąd odczytu nadal blokuje zmiany.
- Jednostki, build, smoke test i wizualny przegląd stanów na desktopie oraz mobile przechodzą.
- Kontrolny widok stanów jest niedostępny w produkcji (404).
