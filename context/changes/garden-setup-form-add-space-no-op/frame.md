# Frame Brief: Brak reakcji przy dodawaniu skrzyni

> Framing step before `/10x-plan`. Captures the observed failure separately from any presumed cause.

## Reported Observation

„cos sie chyba popsulo, nie moge dodawac skrzyn”

## Initial Framing (preserved)

- **User's stated cause or approach**: nie podano.
- **User's proposed direction**: nie podano; zgłoszono problem do sprawdzenia.
- **Pre-dispatch narrowing**: po kliknięciu przycisku nowe pola się nie pojawiają (1B); objaw występuje lokalnie pod `http://127.0.0.1:4321/garden` (2A).

## Dimension Map

Zakres zawęża się do lokalnego kliknięcia przed zapisem:

1. **Dostarczenie i hydratacja wyspy React** — HTML może być widoczny, ale nieinteraktywny, jeśli przeglądarka nie pobierze modułu `GardenSetupForm`.
2. **Handler, aktualizacja stanu i render listy** — kliknięcie może nie dopisać elementu albo nowy element może nie zostać wyrenderowany.
3. **Zapis/API** — rozważone kontrolnie, ale mało prawdopodobne przy zgłoszonym objawie przed zapisem.

## Hypothesis Investigation

| Hypothesis | Evidence | Verdict |
| --- | --- | --- |
| Lokalny Vite nie dostarcza zależności potrzebnych do hydratacji Reacta | Log lokalnego dev servera zgłosił brak plików w `node_modules/.vite/deps` dla Radix, `class-variance-authority`, `clsx` i `tailwind-merge`, a następnie błędy hydratacji `GardenSetupForm`, `GardenPlanner` i `CropSelectionForm`. Bezpośrednie żądania `@radix-ui_react-slot.js` i `class-variance-authority.js` na `127.0.0.1:4321` zwróciły 404. Skompilowany moduł `Button` importuje te ścieżki. | **STRONG** |
| Handler lub renderowanie pól jest wadliwe | `GardenSetupForm.tsx:43–45` dopisuje nową przestrzeń do stanu, a `:71` renderuje stan przez `spaces.map`; przycisk `:151–158` jest `type="button"`. Nie znaleziono warunku ukrywającego nowe pola. Kod handlera nie mógł działać, jeśli wyspa nie została zahydratowana. | **NONE** |
| Endpoint zapisu blokuje dodawanie | Przycisk dodawania jest `type="button"`, więc kliknięcie nie wysyła formularza (`GardenSetupForm.tsx:52, 151–160`). Endpoint jest używany dopiero przez „Zapisz działkę”; nie wyjaśnia braku pól przed zapisem. | **NONE** |

## Narrowing Signals

- Użytkownik potwierdził, że kliknięcie nie pokazuje nowych pól; problem nie dotyczy komunikatu błędu po zapisie.
- Problem został zaobserwowany lokalnie, nie na wdrożonej stronie.

## Cross-System Convention

Astro opisuje `client:load` jako załadowanie i hydratację JavaScriptu wyspy przy starcie strony; statyczny HTML może istnieć niezależnie od działającego handlera. Vite przechowuje zoptymalizowane zależności w `node_modules/.vite`; jego dokumentacja wskazuje cache i ponowną optymalizację zależności jako osobny etap dev servera. Źródła: [Astro — framework components](https://docs.astro.build/en/guides/framework-components/), [Vite — dependency pre-bundling](https://vite.dev/guide/dep-pre-bundling.html).

Test `scripts/smoke.mjs` przechodzi, ale wykonuje żądania HTTP i nie uruchamia przeglądarkowej hydratacji komponentu. Poprzedni odbiór S-02 obejmował dodanie wielu przestrzeni ([archived plan](../../archive/2026-09-26-define-private-garden-space/plan.md#manual-testing-steps)); w przeszukanej historii projektu nie znaleziono analogicznego incydentu Vite.

Bezpośrednia przyczyna braku reakcji jest dobrze potwierdzona: zależności wskazane przez moduł przycisku nie są dostępne w lokalnym cache, więc import wyspy zawodzi. Nie ustalono, co dokładnie doprowadziło do brakujących plików cache; obserwacja nie dowodzi błędu w kodzie formularza ani w zapisującym API.

## Reframed (or Confirmed) Problem Statement

> **The actual problem to plan around is**: lokalny dev server serwuje niekompletne pliki zoptymalizowanych zależności, przez co wyspa React z formularzem skrzyń nie zostaje zahydratowana i przycisk dodawania nie reaguje.

To problem ścieżki ładowania klienta w lokalnym środowisku, a nie obecnie potwierdzona awaria zapisu działki. Samo odświeżenie strony nie wystarczy, jeśli moduły nadal zwracają 404; dokładny moment utraty plików cache pozostaje nieustalony.

## Confidence

- **HIGH** — bezpośrednio zaobserwowano brakujące moduły Vite, odpowiedzi 404 i błędy hydratacji wyspy; objaw użytkownika dotyczy dokładnie tej interakcji. Niepewna jest przyczyna powstania niespójnego cache.

## What Changes for `/10x-plan`

Jeśli problem wróci po odtworzeniu lokalnego dev runtime, plan powinien dotyczyć niezawodnego ładowania i weryfikacji interaktywnej wyspy. Nie należy zmieniać logiki zapisu skrzyń bez dowodu, że kliknięcie dociera do formularza po udanej hydratacji.

## References

- [`GardenSetupForm.tsx`](../../../src/components/garden/GardenSetupForm.tsx): 37, 43–45, 52, 71, 151–160.
- [`garden.astro`](../../../src/pages/garden.astro): 143–153 (`client:load`).
- [`button.tsx`](../../../src/components/ui/button.tsx): 1, 35–47.
- [`scripts/smoke.mjs`](../../../scripts/smoke.mjs): testuje przepływy HTTP bez przeglądarki.
- Investigation: read-only review `01a0f41b-6e60-76e3-821a-4be76c5c4759`; bezpośrednie GET-y modułów lokalnego Vite i oględziny kodu.
