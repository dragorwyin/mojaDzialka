---
date: 2026-10-10T18:50:05+02:00
researcher: Codex
git_commit: 41d098d881b7abc2f4e0810d20556233f9eeb47b
branch: main
repository: mojaDzialka
topic: "Spójne doświadczenie Moja Działka: landing, auth i planer"
tags: [research, landing, auth, dashboard, design-system, garden-planner]
status: complete
last_updated: 2026-10-10
last_updated_by: Codex
---

# Research: Spójne doświadczenie Moja Działka

**Date**: 2026-10-10T18:50:05+02:00
**Researcher**: Codex
**Git Commit**: 41d098d881b7abc2f4e0810d20556233f9eeb47b (HEAD; evidence also includes uncommitted working-tree changes)
**Branch**: main
**Repository**: mojaDzialka

## Research Question

Co rzeczywiście powoduje wrażenie niedokończonego, bladego i sztywnego produktu na stronie publicznej, ekranach logowania/rejestracji i zalogowanym planerze? Jakie istniejące kontrakty, zasoby i decyzje trzeba zachować, a które decyzje wizualne pozostają otwarte przed planem i implementacją?

## Summary

- Główny konkretny defekt logowania wynika z bieżącego, niezatwierdzonego diffu: `src/styles/global.css` zmienił `@utility bg-cosmic` na `@utility bg-garden-page`, lecz sign-in, signup i starterowy landing wciąż proszą o klasę `bg-cosmic`. Wtedy ich kontenery nie dostają już gradientu z tego arkusza; zawartość nadal używa białych, nisko kryjących się kolorów. Ta rozbieżność jest zgodna ze zrzutem prawie niewidocznego logowania i jest źródłowo potwierdzona (`src/styles/global.css:178-183`; `src/pages/auth/signin.astro:11-19`; `src/pages/auth/signup.astro:10-19`; `src/components/Welcome.astro:5-23`). Nie uruchamiano przeglądarki ani nie mierzono obliczonego kontrastu.
- `/` nadal pokazuje stronę developera „10x Astro Starter” w języku angielskim zamiast obietnicy planera (`src/pages/index.astro:1-8`; `src/components/Welcome.astro:20-111`). Layout domyślnie ustawia tytuł startera i `lang="en"` (`src/layouts/Layout.astro:11-20`).
- Trasy, formularze i ochrona auth istnieją. Zrzut uzasadnia naprawę ekspozycji/czytelności; nie dowodzi błędu logowania do Supabase. Wymaganie produktu to prywatne konto zachowujące plan pomiędzy sesjami (PRD, „Accounts and garden”, „Access Control”).
- Wcześniejsza zmiana dashboardu jest niezacommitowana i zmieniła jedynie jeden widok. Przeniosła globalne tokeny, ale nie zaktualizowała public/auth komponentów ani kitchen sinków, które nadal polegają na `bg-cosmic`. Jej desktop/mobile screenshot gate pozostał nieukończony (`context/changes/natural-garden-dashboard/plan.md:26-32`).
- Istniejące kontrakty danych i interakcji planera obejmują SSR z prywatnych danych, wyliczanie aktualności zapisanego planu, plan/sectors/crops oraz nawigację API zachowującą `/garden`. Następujący późniejszy audit stanu bazy potwierdził, że te panele były tylko w roboczym stanie poprzedniej sesji i obecnie nie są w routingu.
- Nie ma utrwalonej specyfikacji marki, komunikatów landingu, typografii, rodzaju ilustracji ani jej źródła/licencji. Załącznik MniamPiśnik jest inspiracją użytkownika, nie gotowym assetem ani specyfikacją. Warianty wizualne powinny być pokazane użytkownikowi przed implementacją.

## Detailed Findings

### Publiczne wejście i wspólna powłoka

- `src/pages/index.astro:1-8` renderuje `Welcome.astro` we wspólnym `Layout`; `Welcome.astro:20-111` zawiera angielski nagłówek startera, opis stacku developerskiego i karty o auth/toolingu/DX. Nie opisuje ogrodniczego rezultatu, który PRD wskazuje jako główną obietnicę.
- `Layout.astro:11-20` domyślnie ustawia `title="10x Astro Starter"` i `lang="en"`; landing i auth nie przekazują polskich nadpisań. Obecne `/garden` przekazuje polski tytuł i `lang="pl"`.
- Niezalogowany Topbar mówi „Not signed in”, ale linki „Zaloguj się” i „Załóż konto” są obecne (`Topbar.astro:26-41`). To niespójność języka i prezentacji, nie dowód braku trasy.
- Gdy env Supabase nie zawiera obu wymaganych sekretów, `config-status.ts:11-17` ustawia komunikat „funkcje uwierzytelniania są wyłączone”; Layout pokazuje brakujące konfiguracje nad slotem strony (`Layout.astro:23-36`). To może wpływać na lokalny ekran i trzeba odróżnić go od wyglądu produkcyjnego.

### Kontrast auth i źródło regresji

- Oba widoki auth używają `bg-cosmic`, przezroczystej białej karty, białego tekstu oraz niebiesko-fioletowego gradientu/linku (`signin.astro:10-23`, `signup.astro:9-22`). FormField ustawia nisko kryjące się białe ikony/placeholdery, jasne etykiety i białe przezroczyste pola (`FormField.tsx:5-6,37-54`); SubmitButton nadal ma fiolet (`SubmitButton.tsx:15-30`). Formularze są opisane po angielsku (`SignInForm.tsx:43-86`, `SignUpForm.tsx:65-111`).
- W HEAD arkusz publikuje `@utility bg-cosmic` (`git show HEAD:src/styles/global.css`, blok utility w końcowej części pliku). W aktualnym working tree tę nazwę zastąpiono przez `@utility bg-garden-page` (`src/styles/global.css:178-183`), ale usages `bg-cosmic` w widokach signin, signup i Welcome pozostały. Dokładnie te źródła pozostają zmienione/niezmienione względem HEAD; z tego wynika, że Tailwind nie ma już w aktualnym arkuszu definicji utility, którą te trzy widoki wywołują.
- To samo niedopasowanie dotyka `src/pages/dev/garden-planner-kitchen-sink.astro:124` i tła `src/pages/dev/crop-selection-kitchen-sink.astro:20`; crop-selection kitchen sink dodaje `text-white`, więc może utrudniać wizualną kontrolę stanów. `rg -n "bg-cosmic" src` znalazł pięć aktywnych wywołań w pięciu plikach; definicji tej nazwy nie ma w bieżącym arkuszu.
- Middleware sprawdza sesję dla `/dashboard` i `/garden`, a brak usera przekierowuje do `/auth/signin` z `returnTo` (`middleware.ts:4-29`). Sign-in wysyła formularz do `/api/auth/signin`; signup do `/api/auth/signup` (`SignInForm.tsx:44`, `SignUpForm.tsx:66`). Kod potwierdza obecność przepływu, nie działanie zewnętrznego Supabase w aktualnym wdrożeniu.

### Dashboard, planner i zachowywane kontrakty

- W bieżącym zatwierdzonym kodzie `/dashboard` jest ekranem powitalnym, a SSR przestrzeni, wybranych upraw, planu, fingerprintu i freshness znajduje się w `/garden` (`src/pages/dashboard.astro`, `src/pages/garden.astro:37-181`). Dane nie mogą trafić na publiczny landing.
- `/garden` renderuje trzy sekcje jedna pod drugą; nie ma aktywnego komponentu zakładek. Formularze React i planner są hydratowane przez `client:load`. Bieżący użytkownik chce, aby `/dashboard` stał się kanonicznym widokiem z planem jako domyślną zakładką oraz osobnymi zakładkami „Sektory” i „Warzywa”.
- Zapis przestrzeni przekierowuje do `/garden?saved=1` lub `/garden?error=...` (`src/pages/api/garden.ts:10-12,83-92`). `/api/garden-plan.ts` zwraca auth do `/garden`; API payload i zapis planu mają pozostać bez zmian, ale ich prezentacyjne cele redirectu zmienią się na `/dashboard`. Planner/formularze komunikują się przez obecne eventy i endpointy (`GardenPlanner.tsx:97,111,141`; `GardenSetupForm.tsx:55`; `CropSelectionForm.tsx:269,293`).
- Istniejący `garden-planner-kitchen-sink.astro` opisuje deterministyczne stany default, hover, focus-visible, disabled, error, empty i loading oraz rezultaty success, partial i stale (`src/pages/dev/garden-planner-kitchen-sink.astro:142-258`); jego elementy opierają się o semanticzne tokeny `garden-*`. W poprzednim planie ich przegląd i desktop/mobile screenshoty są jawnie nieukończone. Bieżący source-level inventory nie potwierdza, że kuchenny zlew rzeczywiście kompiluje się i renderuje po zmianie klasy tła.

### System designu i zasoby

- Repo ma źródło semantycznych wartości w `src/styles/global.css`: `:root` opisuje jasne role garden, `.dark` — ciemne nadpisania, a `@theme inline` udostępnia klasy Tailwind (`:9-30`, `:65-86`, `:121-140`). Utility `bg-garden-page` nadal jest zdefiniowane (`:178-183`).
- W `src/components/ui/` istnieją `Button` i `LibBadge`, ale nie ma zatwierdzonego `ViewTabs`; repo ma token-checker `scripts/check-garden-ui-tokens.mjs`. Bieżący checker został już poszerzony przez fazę 2.
- Pliki `public/` odczytane w inventory: `.assetsignore`, `favicon.png`, `template.png`, `crops/crop-atlas.webp`. `crop-atlas.webp` zawiera ilustracje katalogowe używane przez diagram (`GardenLayoutView.tsx:90-123`); nie znaleziono w kodzie użycia `template.png` jako ilustracji produktu. Repo nie zawiera w tym zbiorze osobnego logo/hero artwork wskazanego jako zatwierdzony asset.
- Obecne referencje dostarczają kryteria jakościowe (ilustracja, znak typograficzny, bardziej charakterystyczny layout), ale nie wskazują konkretnej treści hero, palety, fontu, stylu grafiki ani praw do wykorzystania materiałów. Są to realne decyzje projektowe, a nie fakty do wyprowadzenia z kodu.

### Produkt i wymagania zachowania

- PRD opisuje główną korzyść jako prywatny graficzny plan sezonu oparty o wymiary, wybrane uprawy, odstępy, sąsiedztwo i terminy (`context/foundation/prd.md`, „Vision & Problem Statement”, „Success Criteria”). Użytkownik docelowy ma mało czasu na naukę i organizowanie upraw.
- Email/password signup/login, zachowanie danych pomiędzy sesjami i jedna prywatna działka to ustalone wymagania (`prd.md`, FR-001–003 oraz „Access Control”). Publiczny landing powinien kierować do tej wartości i auth, ale PRD nie narzuca jego sekcji ani konkretnego copy.
- Responsywność jest wymagana (`prd.md`, „Non-Functional Requirements”), ale PRD nie określa breakpoints, kierunku brandingu ani motywu jasny/ciemny.

## Code References

- `src/pages/index.astro:1-8` — routing strony głównej.
- `src/components/Welcome.astro:5-111` — starterowy landing i jego klasy.
- `src/layouts/Layout.astro:11-36` — domyślny język/tytuł i banner brakującej konfiguracji.
- `src/pages/auth/signin.astro:10-23`, `src/pages/auth/signup.astro:9-22` — strony formularzy i ich styl.
- `src/components/auth/FormField.tsx:5-54`, `SubmitButton.tsx:15-30` — pola, focus i CTA.
- `src/styles/global.css:9-30,65-86,121-140,178-183` — role tokenów, bridge Tailwind i bieżąca utility gradientu.
- `src/middleware.ts:4-29` — ochrona tras i redirect sign-in.
- `src/pages/dashboard.astro`, `src/pages/garden.astro:37-181` — zatwierdzony ekran powitalny oraz SSR, freshness, widoki i islands.
- `src/pages/api/garden.ts:10-12,83-92`; `src/pages/api/garden-plan.ts:48-70,124-145` — redirecty zapisu i kontrakt generowania.
- `src/pages/dev/garden-planner-kitchen-sink.astro:120-258` — fixture stanów wizualnych.
- `scripts/check-garden-ui-tokens.mjs` — scope obecnego skanera tokenów.

## Architecture Insights

- Aplikacja jest SSR Astro z adapterem Cloudflare, integracją React i Tailwind v4 (`astro.config.mjs`, `package.json`). Publiczne/auth strony i bieżące `/garden` używają wspólnych app tokens; wyspy garden wykorzystują role `garden-*`.
- `Layout` jest współdzielony, a Topbar jest wstawiany przez Welcome i `src/pages/garden.astro`, a nie przez Layout.
- Dane ogrodu pozostają prywatne i zależne od sesji. Wygląd może zostać zmieniony niezależnie od silnika planera, zapisów i istniejących endpointów, jeżeli zostanie zachowana hierarchia danych/states, SSR i obsługa redirectów.
- Wspólny token source i rozszerzony checker są obecnie zatwierdzone przez fazę 2; przyszłe zmiany mają używać semantycznych ról oraz istniejących wspólnych prymitywów.

## Historical Context (from prior changes)

- `context/changes/natural-garden-dashboard/change.md` — zakres poprzedniej pracy to pojedynczy dashboard; jego notatki zachowania widoków i zapisów pozostają aktualne. Kontrakt nie objął public/auth screens.
- `context/changes/natural-garden-dashboard/research.md` — zapisuje, że auth redesign i wymiana diagramu odłożono. Te elementy nie są już poza bieżącym, zaakceptowanym zakresem użytkownika.
- `context/changes/natural-garden-dashboard/plan.md` — pozostają nieodhaczone screenshoty desktop/mobile oraz kitchen-sink visual review. W dokumencie zapisano, że lokalny Astro server nie wystartował wówczas w 30 s; to historyczny pomiar i trzeba sprawdzić bieżące uruchomienie dopiero podczas realizacji/wizualnego odbioru.
- `context/archive/2026-09-28-generate-garden-layout/plan-brief.md` — historyczny scope wykluczał rebranding pozostałych ekranów; nie jest to ograniczenie dla tej nowej zmiany.
- `context/changes/garden-diagram-thumbnail-readability/change.md` — wcześniejszy diagram przeszedł ręczny odbiór przez użytkownika; ilustrowane miniatury są istniejącym przykładem zaakceptowanego, produktowego zasobu.
- `context/foundation/test-plan.md`, §7 — pierwotna strategia odrzucała dekoracyjne screenshoty/pixel matching z powodu limitu czasu, a dopuszczała ocenę wizualną, gdy wygląd przeszkadza w czytaniu statusu/konfliktów/układu. Obecne zgłoszenie spełnia warunek użytkownika, więc nowa zmiana może ustalić wizualny odbiór jako jawne kryterium.
- `context/changes/bootstrap-verification/verification.md` — starter był historycznie wybrany dla gotowego auth/toolingu i hostingu. Decyzja dotyczyła stacku, nie zachowania generycznego brandingu w produkcie.

## Related Research

- `context/changes/natural-garden-dashboard/research.md`
- `context/changes/garden-crop-catalog-and-layout/research.md`
- `context/changes/garden-diagram-thumbnail-readability/plan.md`
- `context/archive/2026-09-28-generate-garden-layout/research.md`
- `context/foundation/prd.md`
- `context/foundation/roadmap.md`
- `context/foundation/test-plan.md`

## Open Questions and Risks

- Użytkownik zaakceptował botaniczny mockup, a landing/auth zostały ręcznie odebrane. Głównym rozstrzygniętym routingiem jest `/dashboard` jako widok z zakładkami i `/garden` jako redirect.
- Pozytywny build i lint fazy 3 są zapisane w poprzednim przebiegu implementacji; końcowy wizualny przegląd rzeczywistego dashboardu nadal wymaga działającego, skonfigurowanego środowiska.
- Auth i `returnTo` zostały obejrzane ręcznie na ścieżce z chronionym celem, ale dostępność konfiguracji zewnętrznego Supabase/produkcyjnego logowania pozostaje zależna od środowiska.

## Investigation Coverage

Główny agent przeczytał ramowanie, aktywną zmianę, PRD, roadmapę, test plan, reguły UI, strony public/auth, Layout, middleware, formularze, design tokens, dashboard, API i lokalną historię tokenu w HEAD. Trzy równoległe, read-only audyty pokryły public/auth, dashboard/planner oraz historię/kontrakty/assets/CI. Agenci nie edytowali kodu ani nie uruchamiali testów. Badanie nie obejmuje runtime screenshotu, produkcyjnego logowania ani dostępności/zgód licencyjnych zewnętrznych ilustracji.

## Follow-up: bieżąca baza po usunięciu roboczego dashboardu (2026-10-10)

Ten follow-up zastępuje wcześniejsze założenia `Architecture Insights` o współdzielonym dashboardzie. Inspekcja zatwierdzonego drzewa i bieżącego kodu wykazała, że:

- `src/pages/dashboard.astro` jest ekranem powitalnym po zalogowaniu z linkiem do `/garden`; `src/pages/garden.astro` wykonuje SSR prywatnej działki i renderuje formularz sektorów, wybór upraw i plan w trzech sekcjach pionowo.
- `src/components/garden/GardenDashboard.astro` i `src/components/ui/ViewTabs.astro` nie są w bieżącym drzewie ani w zatwierdzonej historii; były plikami roboczymi i nie wolno traktować ich jako komponentów bazowych.
- Użytkownik zdecydował, że `/dashboard` ma stać się głównym widokiem z zakładkami, a `/garden` ma przekierowywać do `/dashboard`.
- `src/pages/api/garden.ts` przekierowuje obecnie po zapisie/błędzie do `/garden?saved=1` lub `/garden?error=…`; należy zmienić wyłącznie cel redirectu oraz selekcję zakładki/komunikatu. Kształt POST i logika przechowywania pozostają poza zakresem.
- `src/pages/api/garden-plan.ts` i `src/middleware.ts` używają `/garden` jako celu logowania. Docelowy `/dashboard` powinien stać się kanonicznym `returnTo`, przy zachowaniu ochrony tras i walidacji `returnTo`.
- Istniejące wyspy `GardenSetupForm`, `CropSelectionForm` i `GardenPlanner` są hydratowane na `/garden` przez `client:load`. Ich propsy, eventy zapisu, freshness planu, error/success, focus i prywatne SSR należy zachować podczas przenoszenia kompozycji.

Wniosek do realizacji: przenieść SSR i główną kompozycję do zatwierdzonego `src/pages/dashboard.astro`, zastąpić `src/pages/garden.astro` aliasem/redirectem, dodać nawigację zakładek w ramach aktualnych wspólnych komponentów oraz skorygować redirecty prezentacyjne po zapisie i auth. Nie odtwarzać nazw komponentów usuniętych z roboczej iteracji bez nowej decyzji projektowej.
