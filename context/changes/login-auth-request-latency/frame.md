# Frame Brief: Opóźnienie logowania

> Etap framingu przed planowaniem. Oddziela zaobserwowane opóźnienie od
> początkowego podejrzenia o wolne requesty.

## Reported Observation

> „Każde przejście pomiędzy stronami, np. auth i logowanie trwa straaasznie
> długo”.

Doprecyzowanie: problem dotyczy również przejść między `/auth/signup` i
`/auth/signin` w obu kierunkach. Widoki czekają na request; opóźnienie trwa
kilka sekund i powtarza się.

## Initial Framing (preserved)

- **User's stated cause or approach**: „tak jakby requesty muliły” — podejrzenie
  opóźnionych requestów, bez potwierdzonego pomiaru.
- **User's proposed direction**: nie wskazano konkretnego rozwiązania; chodzi o
  zgłoszenie i wyjaśnienie spowolnienia.
- **Pre-dispatch narrowing**: wolne są nawigacje między publicznymi stronami
  rejestracji i logowania, nie tylko wysłanie formularza logowania. Widok
  oczekuje na request. Stan sesji/cookie w chwili testu nie jest znany.

## Dimension Map

1. **Serwerowa obsługa nawigacji i middleware** — zwykłe linki powodują
   żądanie strony Astro SSR; middleware może synchronicznie czekać na
   weryfikację sesji przed wyrenderowaniem każdej z nich.
2. **Supabase Auth, połączenie sieciowe lub runtime Cloudflare** — pojedyncze
   wywołania zewnętrzne albo czas Workera mogą same być wolne; repo nie ma
   pomiarów rozdzielających te czasy.
3. **Renderowanie, hydratacja formularza i przekierowanie** — mogą opóźniać
   gotowość formularza lub widok strony, niezależnie od czasu Auth.

## Hypothesis Investigation

| Hipoteza | Dowody | Ocena |
| --- | --- | --- |
| Globalne middleware dodaje powtarzaną pracę Auth | `src/middleware.ts:6-14` wywołuje i oczekuje na `auth.getUser()` przed sprawdzeniem, czy ścieżka jest chroniona. Endpoint logowania następnie czeka na `signInWithPassword()` (`src/pages/api/auth/signin.ts:24`), przekierowuje (`:30`), a żądanie dashboardu ponownie przechodzi przez middleware. Dokumentacja Supabase SSR opisuje `getUser()` jako walidację względem serwera Auth; przy braku tokenu SDK może zakończyć bez requestu. | **STRONG** dla istnienia sekwencji; brak dowodu, ile sekund ona odpowiada |
| Pojedyncze wywołanie Supabase lub ścieżka sieciowa jest wolna | Auth jest zewnętrznym zależnym serwisem, a logowanie wymaga `signInWithPassword()`. Kod i konfiguracja nie zawierają pomiaru czasu requestów ani regionu projektu Supabase. | **WEAK** — możliwe, niezmierzone |
| Głównym źródłem jest renderowanie/hydratacja UI | Formularz jest renderowany przez Astro SSR i używa `client:load`; wysyła zwykły formularz POST, bez widocznego klientowego requestu Auth (`src/pages/auth/signin.astro:16`, `src/components/auth/SignInForm.tsx:44`). | **WEAK** — może opóźnić interakcję, ale nie wyjaśnia czasu odpowiedzi bez pomiaru |

## Narrowing Signals

- Użytkownik zawęził zakres do logowania, nie ogólnego spowolnienia wszystkich
  stron.
- Opóźnienie ma kilka sekund i powtarza się przy każdym logowaniu.
- Użytkownik potwierdził, że widoczne opóźnienie występuje już przy przejściu
  między stronami rejestracji i logowania, przed wysłaniem formularza.
- Nie wiadomo, czy podczas tych przejść przeglądarka wysyła istniejące
  auth/session cookies; od tego zależy, czy `getUser()` musi odpytać Supabase.

## Cross-System Convention

Astro uruchamia middleware przed obsługą stron i endpointów. Supabase SSR
rozróżnia lokalny odczyt sesji od `getUser()`, który weryfikuje użytkownika
przez Auth server. W tym projekcie walidacja jest wykonywana globalnie przed
sprawdzeniem listy chronionych tras. To zachowuje serwerową weryfikację, ale
może dokładać czas również do publicznego POST logowania. Nie znaleziono
instrumentacji, która potwierdzałaby rzeczywisty koszt w środowisku użytkownika.

## Reframed (or Confirmed) Problem Statement

> **Problem do planowania:** nawigacje między stronami auth czekają na odpowiedź
> SSR. Globalne middleware wykonuje `getUser()` przed wyrenderowaniem każdej
> strony; jeśli żądanie niesie sesję, walidacja może dodawać sieciowy round-trip
> do Supabase Auth.

Kod potwierdza, że każde kliknięcie linku auth uruchamia pełne żądanie strony,
a middleware czeka na `getUser()` przed `next()`. Nie dowodzi jednak, że
`getUser()` robi request dla anonimowego żądania ani że odpowiada za całe
zgłoszone kilka sekund. Sieć/Worker oraz inne części obsługi SSR pozostają
alternatywami. Następny rozstrzygający sygnał to informacja, czy opóźnienie
występuje również po wylogowaniu lub w oknie prywatnym.

## Confidence

- **MEDIUM** — znaleziono pełne żądania Astro SSR oraz globalne oczekiwanie na
  middleware, zgodne z objawem; brak pomiaru runtime i nieznany stan sesji.

## What Changes for /10x-plan

Plan powinien dotyczyć ustalenia, dlaczego pełne żądania stron auth odpowiadają
kilka sekund, i ograniczenia odczuwalnego opóźnienia bez osłabiania ochrony
tras. Rozdzielić trzeba publiczne nawigacje z sesją i bez sesji oraz czas
odpowiedzi Workera i wywołań Supabase Auth.

## References

- `src/middleware.ts:6-23`
- `src/pages/api/auth/signin.ts:24-30`
- `src/pages/auth/signin.astro:16`
- `src/components/auth/SignInForm.tsx:44`
- [Supabase SSR: getSession vs getUser](https://github.com/supabase/ssr/blob/main/src/createServerClient.spec.ts)
- [Astro middleware guide](https://github.com/withastro/docs/blob/main/src/content/docs/en/guides/middleware.mdx)
- Investigation tasks: `01a0fc25-4a2b-7c53-ad14-a17fc70d82e1`, `01a0fc25-4d64-77e0-b7b3-f8e5d37fb82b`, `01a0fc25-5f4f-7d70-807d-ed4e05d961dc`
