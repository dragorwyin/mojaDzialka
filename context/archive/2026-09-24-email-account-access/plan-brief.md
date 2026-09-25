# Dostęp do konta e-mailem — skrót planu

> Pełny plan: `context/changes/email-account-access/plan.md`

## Co i dlaczego

Dokończymy istniejące zakładanie konta i logowanie e-mailem, aby użytkownik mógł uzyskać dostęp do prywatnego planu. Rejestracja w obecnym zakresie nie będzie wymagała potwierdzenia adresu e-mail; poprawimy walidację haseł i komunikaty błędów, a po logowaniu przywrócimy użytkownika na pierwotnie żądaną chronioną ścieżkę lub skierujemy do dashboardu.

## Punkt wyjścia

Formularze, endpointy Supabase Auth, sesja i ochrona `/dashboard` już istnieją. Szkielet wymaga jednak potwierdzenia e-mail po rejestracji, dopuszcza 6-znakowe hasła, nie waliduje wejścia po stronie serwera i ujawnia surowe błędy Supabase. Lokalny smoke test nadal oczekuje ekranu potwierdzenia.

## Oczekiwany stan końcowy

Użytkownik może zarejestrować się hasłem o długości co najmniej 8 znaków i od razu korzystać z zalogowanego dashboardu. Błędne dane są odrzucane również po stronie serwera, błędy auth są komunikowane bez ujawniania szczegółów dostawcy, a logowanie zachowuje bezpieczny cel powrotu.

Lokalna konfiguracja i CI sprawdzają wybrany przepływ bez potwierdzania e-maili. Dokumentacja określa, jak przed uruchomieniem produkcyjnego auth sprawdzić sekrety Workera, minimalne hasło i ustawienie potwierdzenia adresu.

## Kluczowe decyzje

| Decyzja | Wybór | Dlaczego |
| --- | --- | --- |
| Potwierdzanie e-maila w produkcji | Wyłączone na obecnym etapie | Umożliwia sprawdzenie signup/signin bez konfiguracji SMTP; adres nie będzie zweryfikowany. |
| Minimalna długość hasła | 8 znaków; sprawdzane w UI, API i lokalnej konfiguracji, a także ustawione w Supabase produkcyjnym | Zgodne z rekomendacją opisaną w repozytoryjnej konfiguracji Supabase. |
| Reset zapomnianego hasła | Poza zakresem | PRD dla S-01 wymaga signup/signin; brak decyzji o przepływie e-mailowym. |
| Przekierowanie po logowaniu | Pierwotna bezpieczna ścieżka, jeśli istnieje; w przeciwnym razie `/dashboard` | Użytkownik wraca do przerwanego zadania, a domyślnie trafia do chronionej części aplikacji. |
| Komunikaty błędów | Kontrolowane, ogólne dla błędnego logowania; bez surowych błędów dostawcy | Nie ujawniają, czy konto istnieje ani szczegółów Supabase. |
| SMTP | Bez wyboru dostawcy i konfiguracji w tej zmianie | Potwierdzanie i reset hasła pozostają wyłączone; dostawcę trzeba wybrać przed włączeniem wiadomości produkcyjnych. |
| Testy i produkcja | Lokalny smoke/CI oraz ręczna checklista konfiguracji i test konta | Automatyzacja pokrywa kontrakty aplikacji; rzeczywiste sekrety i ustawienia pozostają po stronie operatora. |

## Zakres

**W zakresie:** walidacja signup w UI i API, hasło minimum 8 znaków, bezpieczne komunikaty, sesja po rejestracji, bezpieczny redirect po logowaniu, zgodna z przepływem dokumentacja README, dostosowanie lokalnego Supabase i smoke testu, checklista produkcyjna.

**Poza zakresem:** potwierdzanie adresu, SMTP, reset hasła, OAuth/MFA, konfiguracja sekretów lub deploy wykonany przez agenta.

## Architektura i podejście

Zachowujemy Astro SSR i obecnego klienta Supabase SSR z cookies. Middleware przekazuje chronioną ścieżkę do formularza logowania; endpointy weryfikują dane i mapują błędy; udany signup/signin kieruje do dashboardu lub bezpiecznego celu. Lokalny Supabase i istniejący CI pozostają główną automatyczną ścieżką weryfikacji.

## Fazy w skrócie

| Faza | Rezultat | Główne ryzyko |
| --- | --- | --- |
| 1. Bezpieczna rejestracja i logowanie | Walidacja serwerowa, kontrolowane błędy, signup bez potwierdzenia i właściwe przekierowania | Niebezpieczny `returnTo` mógłby utworzyć otwarte przekierowanie; dopuszczamy wyłącznie ścieżki lokalne. |
| 2. Testy przepływu i gotowość produkcyjna | Smoke/CI zgodne z nowym flow i ręczna checklista ustawień Supabase/Workera | Rzeczywiste sekrety i ustawienia produkcji wymagają dostępu operatora. |

**Warunki wstępne:** brak zależności kodowej; ręczny test produkcji wymaga dostępu do Cloudflare Worker i projektu Supabase.
**Szacowany wysiłek:** około 1–2 sesje pracy solo, plus czas operatora na ręczną kontrolę środowiska.

## Ryzyka i założenia

- Konta utworzone na niezweryfikowany adres będą mogły się logować — jest to świadomie zaakceptowany stan tymczasowy; przed włączeniem wiadomości auth potrzebna będzie decyzja o SMTP i potwierdzaniu.
- Rzeczywisty stan produkcyjnych sekretów i ustawień nie został w tej zmianie sprawdzony.
- Konta z hasłem krótszym niż 8 znaków nie są automatycznie zmieniane; nowe rejestracje będą podlegać nowemu minimum.

## Kryteria sukcesu

- Lokalny smoke i CI potwierdzają rejestrację, odrzucenie słabego hasła, logowanie, sesję, dostęp do dashboardu i wylogowanie bez callbacku e-mailowego.
- Formularze i endpointy egzekwują co najmniej 8 znaków, a błędy logowania nie ujawniają surowych szczegółów Supabase.
- Operator ma jasną checklistę ręcznej weryfikacji sekretów Workera i produkcyjnych ustawień Supabase przed uznaniem auth za gotowy.
