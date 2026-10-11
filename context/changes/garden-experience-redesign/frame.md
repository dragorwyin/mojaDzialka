# Frame Brief: Spójne doświadczenie Moja Działka

> Framing step before /10x-plan. Ten dokument oddziela zaobserwowane
> problemy od początkowej interpretacji i proponowanego kierunku.

## Reported Observation

> straszny syf zostal zrobiony w mojej ocenie. Nie widac w ogole logowania, strona astro startera jest do kitu, w ogole powinnismy sie jej pozbyc i w zamian tego pokazac jakas ladna strone landing page'owa, jest bardzo zle, popsuty zostal projekt. Wszystko jest sztywne, kolory wyglądają kiczowato. Oczekiwałbym bardziej designu jakiegos lekkiego, ogrodniczego, moze z jakimis grafikami tak jak mamy na przykladzie mniampisnika. Wykonales zadanie, ale nie pokazales zadnych designow i nie zapytales o zdanie. Prosze, uzyj odpowiedniego skilla 10x flow abysmy poprawili caly ten problem

Obrazy dołączone do zgłoszenia pokazują jasny, nisko kontrastowy ekran logowania, generyczną angielską stronę „10x Astro Starter”, sztywny zielony dashboard z trzema zakładkami oraz wizualną referencję MniamPiśnika z wyraźną ilustracją i mocną identyfikacją.

## Initial Framing (preserved)

- **User's stated cause or approach**: w ocenie użytkownika projekt jest „popsuty”; dotychczasowy rezultat jest sztywny, kiczowaty i nadal eksponuje stronę Astro startera.
- **User's proposed direction**: usunąć starterową stronę na rzecz ładnej strony landing page, użyć lekkiego, ogrodniczego stylu z grafikami inspirowanego MniamPiśnikiem i poprawić całość przez 10x flow.
- **Pre-dispatch narrowing**: priorytet: „Dashboard jest sztywny i kiczowaty”; przykład: „Kierunek dla całej aplikacji”; zakres: „Całość: strona publiczna, logowanie i aplikacja”.

## Dimension Map

1. **Spójność produktu i marki** — nazwa, język i treść startera mogą sprawiać, że aplikacja wygląda jak niedokończony szablon, nawet gdy funkcje działają.
2. **Kontrast i widoczność auth** — istniejące formularze i linki mogą być obecne, ale ich styl lub położenie ukrywa je wizualnie.
3. **Architektura i hierarchia dashboardu** — sztywne kontenery, nadmiar kart lub niewłaściwa kolejność informacji mogą powodować kiczowaty odbiór niezależnie od samej palety.
4. **Zakres poprzedniej zmiany i brak odbioru wizualnego** — poprzedni kontrakt mógł ograniczyć pracę do jednego widoku i dopuścić regresję lub niezweryfikowane ekrany poza nim. ← pierwotny kierunek wcześniejszej zmiany
5. **Autentyczna oprawa ogrodnicza** — brak ilustracji, charakterystycznych assetów lub typografii może pozostawić UI jako generyczny zestaw paneli.

## Hypothesis Investigation

| Hypothesis | Evidence | Verdict |
| --- | --- | --- |
| Niespójność identyfikacji produktu zostawia publiczny ekran startera | `/` importuje `Welcome.astro` (`src/pages/index.astro:1-8`), którego treść to angielski „10x Astro Starter”, opis kosmicznego DX i generyczne karty (`src/components/Welcome.astro:20-111`). Layout domyślnie ustawia tytuł „10x Astro Starter” i `lang="en"` (`src/layouts/Layout.astro:11-20`). | STRONG |
| Brak routingu lub implementacji logowania ukrywa auth | Middleware chroni `/dashboard` i `/garden`, a `/auth/signin` i `/auth/signup` są publiczne (`src/middleware.ts:4-29`). Topbar niezalogowanego użytkownika zawiera widoczne semantycznie linki logowania/rejestracji (`src/components/Topbar.astro:26-41`); screenshoty wskazują jednak, że ekspozycja i czytelność na właściwej stronie są słabe. Mechanizm istnieje, więc sama naprawa routingu nie adresuje zgłoszenia. | WEAK |
| Kontrakt kolorów/stylu logowania ma ryzyko kontrastu | Widok logowania używa `bg-cosmic`, białego tekstu na przezroczystej karcie oraz jasnego gradientu tytułu/linku (`src/pages/auth/signin.astro:10-23`). Pola ustawiają jasne etykiety, białe ikony i półprzezroczyste tło (`src/components/auth/FormField.tsx:5-6,37-54`); formularz i błędy pozostają po angielsku (`src/components/auth/SignInForm.tsx:43-86`). Kod potwierdza niski kontrast jako prawdopodobny problem, ale nie ustala przyczyny dokładnie wypranego screena. | STRONG |
| Poprzednia zmiana była za wąska i nie przeszła kontroli wizualnej | `natural-garden-dashboard` deklaruje zakres „Jeden widok” oraz odkłada przebudowę auth i diagramu (`context/changes/natural-garden-dashboard/change.md:11-16`, `research.md:14-17`). Jej screenshotowa bramka dla desktop/mobile i kitchen sink pozostaje nieodhaczona (`plan.md:26-32`); zarejestrowano, że dev server nie wystartował. | STRONG |
| Sztywność dashboardu może wynikać z kompozycji, nie tylko koloru | Dashboard współdzielony renderuje max-width 6xl, statyczny nagłówek i trzy stałe zakładki przed planem (`src/components/garden/GardenDashboard.astro:138-157`). Wcześniejsza zmiana wymieniała tokeny i taby, lecz nie zawierała odebranego screenshotu. To jest wiarygodny trop, niepełny dowód samodzielnej przyczyny. | MEDIUM |
| Aplikacji brakuje własnego zasobu/ilustracji marki | `public/` zawiera favicon i `template.png`; żadna znaleziona strona publiczna ani auth nie korzysta z ogrodniczej ilustracji. Jedyny duży atlas roślin służy katalogowi (`public/crops/crop-atlas.webp`). | MEDIUM |

## Narrowing Signals

- Użytkownik wskazał sztywność i kiczowatość dashboardu jako najwyższy priorytet; nie zawęża to jednak pracy do dashboardu.
- MniamPiśnik jest dla niego kierunkiem dla całej aplikacji, a nie wyłącznie kontrolą jakości.
- Zakres ma objąć stronę publiczną, logowanie i doświadczenie po zalogowaniu.
- Niezależny audyt potwierdził, że starterowy landing i jasny cosmic auth są rzeczywiście w kodzie, ale nie znalazł dowodu na brak implementacji auth. Zasugerował też, że dokładny efekt bladego screena może zależeć od środowiska zrzutu.

## Cross-System Convention

Powiązane decyzje w tym repo pokazują, że poprzedni kontrakt dashboardu jawnie wykluczył rebranding pozostałych widoków (`context/changes/natural-garden-dashboard/research.md:14-17`) i nie wymagał zatwierdzonego wariantu wizualnego przed implementacją. Wcześniejsza praca nad diagramem zawierała ręczne przeglądy obrazu jako bramkę (`context/changes/garden-diagram-thumbnail-readability/plan.md:81-92,132`). Nowe ramowanie powinno więc traktować odbiór wizualny i opinię użytkownika jako dowód dla zakresu obejmującego całą ścieżkę, nie jako kosmetyczny finał po implementacji.

## Reframed (or Confirmed) Problem Statement

> **Rzeczywistym problemem do zaplanowania jest niespójna, nieodebrana wizualnie ścieżka produktu Moja Działka od wejścia publicznego przez auth po planer, która wciąż pokazuje starter Astro, ma ryzykownie niski kontrast i nie daje dashboardowi oczekiwanej lekkości ani charakteru.**

Silne dowody wspierają zakres szerszy niż poprzedni jedno-widokowy kontrakt: landing i auth pozostały poza nim, a dashboard nie przeszedł bramki screenshotów. Mechanizm logowania istnieje, więc „nie widać logowania” wskazuje głównie na ekspozycję i czytelność; błąd uwierzytelniania lub routingu wymagałby osobnej reprodukcji. Przykład MniamPiśnika jest deklarowanym kierunkiem wizualnym, ale konkretne rozwiązania i grafiki mają zostać pokazane do oceny, zanim zostaną wdrożone.

## Confidence

- **HIGH** — źródła potwierdzają starterowy landing, cosmic auth i ograniczony zakres poprzedniej zmiany; użytkownik zdecydowanie określił szerszy zakres i priorytet dashboardu.
- Ograniczenie: nie ustalono, dlaczego konkretny screenshot logowania jest aż tak wyblakły ani czy działa bieżący deployment. Nie należy planować naprawy technicznego auth na podstawie samej oceny wizualnej.

## What Changes for /10x-plan

Plan powinien obejmować kompletną spójną ścieżkę publiczna → logowanie/rejestracja → dashboard/planer, z jasnym kontraktem typografii, palety, ilustracji, nawigacji i dostępnego kontrastu. Przed implementacją użytkownik powinien zobaczyć i ocenić warianty designu; każdy istotny ekran potrzebuje wizualnego odbioru w desktop/mobile, a stan logowania trzeba odróżnić od faktycznego problemu funkcjonalnego.

## References

- `src/pages/index.astro:1-8`
- `src/components/Welcome.astro:20-111`
- `src/pages/auth/signin.astro:10-23`
- `src/components/auth/FormField.tsx:5-54`
- `src/middleware.ts:4-29`
- `src/components/Topbar.astro:26-41`
- `src/components/garden/GardenDashboard.astro:138-157`
- `context/changes/natural-garden-dashboard/research.md:14-17`
- `context/changes/natural-garden-dashboard/plan.md:26-32`
- Investigation: `/root/experience_audit` (read-only independent audit)
