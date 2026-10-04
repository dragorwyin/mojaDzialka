# Terminy siewu i prace sezonowe — Plan Brief

> Full plan: `context/changes/show-sowing-and-seedling-dates/plan.md`
> Research: `context/changes/show-sowing-and-seedling-dates/research.md`

## What & Why

S-06 domknie częściową funkcję terminów sezonowych: obecne daty trzeba sprawdzić i poprawić, a użytkownik ma widzieć prace przy wybranych uprawach i przy swoim planie. Plan zachowuje orientacyjny charakter terminów i nie pokazuje niepopartych źródłami przybliżeń jako potwierdzonych zaleceń.

## Starting Point

Katalog zawiera już okna terminów, a formularz wyboru upraw pokazuje je w zwijanych szczegółach z poziomem pewności i linkami do źródeł. W wygenerowanym planie nie ma listy prac sezonowych ani logiki przypomnień; testy obecnie nie weryfikują agronomicznej poprawności okien.

## Desired End State

Pozostawione terminy mają sprawdzone źródła, metodę i kontekst; luki są jawnie oznaczone i nie tworzą przypomnień. Szczegóły upraw nadal pokazują pełne orientacyjne okna, a wygenerowany plan zawiera listę prac dla bieżącego i następnego miesiąca. Gdy ten okres jest pusty, osobny komunikat wskazuje najbliższy późniejszy miesiąc z potwierdzonymi pracami. Bez push i e-mail.

## Key Decisions Made

| Decision                | Choice                                            | Why                                                                   | Source   |
| ----------------------- | ------------------------------------------------- | --------------------------------------------------------------------- | -------- |
| Widok terminów          | Szczegóły upraw i wygenerowany plan               | Zachowujemy istniejący widok i domykamy wynik planowania.             | Plan     |
| Przypomnienia           | Lista prac na bieżący i kolejny miesiąc, bez push | Miesięczne okna nie uzasadniają dokładnego dnia ani powiadomień push. | Plan     |
| Niewystarczające źródło | Jawny brak terminu i informacja o weryfikacji     | Nie przedstawiamy przybliżenia jako potwierdzonej porady.             | Plan     |
| Zakres dostawy          | Jedna faza pionowa                                | Dane, testy i oba miejsca prezentacji tworzą jedną użyteczną funkcję. | Plan     |
| Dane planu              | Lista wynika z `cropSummaries` widocznego wyniku  | Nie zmieniamy zapisanego formatu planu ani bazy.                      | Research |

## Scope

**In scope:** adjudykacja terminów aktywnych upraw; poprawa źródeł, warunków, pewności i jawnych braków; obecne szczegóły upraw; lista prac dla bieżącego/następnego miesiąca przy wygenerowanym planie oraz komunikat o najbliższych późniejszych pracach dla pustego okresu; deterministyczne testy i aktualizacja cookbooku §6.

**Out of scope:** push/e-mail, dokładne dni, lokalizacja/regionalizacja użytkownika, widok tygodniowy i uprawy następcze FR-009, zmiana generatora geometrii, baza/API oraz stan odczytania przypomnień.

## Architecture / Approach

Okna pozostają w statycznym katalogu upraw. Czysta logika wylicza aktualne prace z okien gatunków zawartych w `cropSummaries` widocznego planu, a UI pokazuje je obok aktualnego statusu wyniku. Testy używają osobnych fixture i stałego miesiąca referencyjnego; źródła agronomiczne są sprawdzane poza testowym oracle.

## Phases at a Glance

| Phase                                            | What it delivers                                                | Key risk                                                                     |
| ------------------------------------------------ | --------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 1. Zweryfikowane terminy i lista prac sezonowych | Sprawdzone dane i czytelne przypomnienia in-app w obu widokach. | Słabe lub regionalne źródło może zostać przedstawione jako ogólne zalecenie. |

**Prerequisites:** S-03/S-04 są ukończone; działają katalog, formularz i generowanie planu.
**Estimated effort:** około 1–2 sesji; najwięcej pracy może wymagać ręczna adjudykacja źródeł.

## Open Risks & Assumptions

- Aktualne materiały instytucjonalne nie muszą pokrywać każdej uprawy; brak źródła pozostaje widoczny zamiast być uzupełniony interpolacją.
- Stary wyświetlany plan i jego lista sezonowa muszą zachować wspólny status aktualności.
- Lista prac używa lokalnego miesiąca przeglądarki; użytkownik nie ustala osobnej lokalizacji klimatycznej.

## Success Criteria (Summary)

- Terminy w szczegółach upraw mają sprawdzone źródła i kontekst albo jawnie informują o braku potwierdzenia.
- Wygenerowany plan pokazuje prace bieżącego i następnego miesiąca tylko dla upraw z wyświetlanego wyniku, a przy pustym okresie wskazuje najbliższy późniejszy miesiąc z potwierdzonymi pracami.
- Testy jednostkowe i bramki projektu przechodzą, a ręczny przegląd potwierdza źródła i spójność widoków.
