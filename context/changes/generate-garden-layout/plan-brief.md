# Generowanie układu warzywnika — Plan Brief

> Full plan: `context/changes/generate-garden-layout/plan.md`
> Frame brief: `context/changes/generate-garden-layout/frame.md`
> Research: `context/changes/generate-garden-layout/research.md`

## What & Why

„Przed dodaniem procentów trzeba odróżnić procentowy zapis względnego miksu od procentu faktycznej liczby roślin, a następnie pokazywać cel i osiągnięty układ jako osobne wartości.” S-04 zamieni ten cel w automatyczny układ całej działki: użytkownik podaje wymiary przestrzeni i procenty, a algorytm sam przydziela pozycje oraz wybiera najlepsze wykonalne sąsiedztwa.

## Starting Point

Strona `/garden` zapisuje prywatne wymiary skrzyń/sektorów i miks procentowy. Katalog zawiera 30 upraw oraz relacje sąsiedztwa, ale nie ma jeszcze generatora, zapisu wyniku ani diagramu; badanie dostarczyło roboczy wariant rozstawy dla każdej rośliny o różnej pewności.

## Desired End State

Po wygenerowaniu użytkownik widzi plan wszystkich przestrzeni, docelowe i osiągnięte liczby/udziały, pewność danych oraz odchylenia lub listę upraw bez rozstawy. Układ jest wybierany automatycznie, dobrych sąsiedztw używa jako priorytetu, a potwierdzone negatywne sąsiedztwa wyklucza. Zapisany plan pozostaje prywatny i odtwarza się po odświeżeniu.

## Key Decisions Made

| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| Znaczenie procentu | Docelowy udział liczby roślin dla całej działki | Użytkownik chce określić względną liczbę marchwi, cebuli itd., a nie powierzchnię | User / Frame |
| Skala planu | Maksymalna wykonalna obsada bez pola na łączną liczbę roślin | Procenty same opisują miks; geometrię wykorzystuje planer | Plan |
| Priorytet jakości | Twarda geometria i potwierdzone negatywy; dobre sąsiedztwo przed dokładnością udziałów | Użytkownik wskazał sąsiedztwo jako priorytet; rozbieżność procentów ma być jawna | User / Plan |
| Relacje | `supported` preferowane; `caution` miękkie; `unknown` neutralne; tylko potwierdzone `negative` blokuje | Obecne źródła nie uzasadniają traktowania `caution` jako zakazu | User / Research |
| Dane upraw | Jeden roboczy wariant dla każdej z 30 upraw, z widoczną pewnością i etapem | Umożliwia pełny wybór bez przedstawiania niepewnych danych jako równie pewnych | User / Research |
| Brak rozstawy | Jawny plan częściowy z listą niewyznaczonych upraw | Użytkownik dostaje użyteczny wynik i nie traci informacji | User / Research |
| Interakcja | Użytkownik nie wskazuje ręcznie, które warzywo trafia do której grządki | Algorytm dobiera pozycje na całej działce automatycznie | User |

## Scope

**In scope:** robocze dane i pewność dla 30 upraw; testowany silnik pozycji; preferencje i twarde relacje sąsiedztwa; prywatne generowanie i zapis bieżącego planu; diagram przestrzeni; wyniki target/actual, ostrzeżenia i jawne wyniki częściowe.

**Out of scope:** ręczne przesuwanie roślin, ręczne przypisywanie upraw do grządek, edytor mapy położenia osobnych grządek, historia sezonów, ręczne warianty odmian, prognoza plonu i terminy prac S-06.

## Architecture / Approach

Nowy czysty moduł TypeScript oblicza deterministyczny, ograniczony kosztowo układ na bazie przestrzeni i prywatnego miksu. Autoryzowany endpoint pobiera wejścia z Supabase przez RLS i zastępuje jeden prywatny plan z fingerprintem wejścia; SSR `/garden` odtwarza aktualny wynik, a komponent diagramu pokazuje pozycje i odchylenia.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Dane i silnik układu | Dane rozstaw z pewnością oraz testowany optimizer całej działki | Niejednolity etap źródeł i koszt przeszukiwania |
| 2. Prywatne generowanie | Autoryzowany endpoint i atomowy, prywatny zapis wyniku | RLS, stary snapshot lub częściowy input |
| 3. Diagram i podsumowanie | Automatyczny, odtwarzalny po refreshu plan na `/garden` | Czytelność gęstego układu i ostrzeżeń |

**Prerequisites:** ukończone F-01, S-01, S-02 i S-03; dostęp do lokalnego Supabase/Docker dla testów DB.
**Estimated effort:** około 5–8 sesji implementacyjnych w trzech fazach; optymalizacja geometrii i ręczna weryfikacja mogą zmienić estymatę.

## Open Risks & Assumptions

- Research ma roboczy wariant dla wszystkich 30 upraw, ale część źródeł opisuje siew lub stanowisko zamiast pewnej końcowej liczby roślin; etap i pewność muszą pozostać widoczne.
- Wykonalna obsada może wymusić odchylenia od procentów. Dobre sąsiedztwa mają pierwszeństwo przed dokładnym udziałem, więc wynik nie może obiecywać dokładnego miksu.
- Optymalizacja jest ograniczona kosztowo dla środowiska Cloudflare; plan pokazuje najlepszy znaleziony wynik według jawnej reguły, nie matematyczną gwarancję optimum globalnego.

## Success Criteria (Summary)

- Użytkownik generuje układ całej działki bez ręcznego wyboru grządek i widzi pozycje wraz z udziałami docelowymi i osiągniętymi.
- Potwierdzone negatywne sąsiedztwo nie występuje, dobre jest preferowane, a neutralne pozostaje dopuszczalne; geometria i ograniczenia danych są jawne.
- Plan jest prywatny, odtwarza się po odświeżeniu i nie jest prezentowany jako aktualny, jeśli wejście uległo zmianie.
