# Spójne doświadczenie Moja Działka — plan implementacji

## Overview

Przebudować publiczne wejście, logowanie/rejestrację i dashboard w jeden lekki, ilustracyjny język ogrodniczy. Najpierw przygotować podglądy landingu, auth i dashboardu do oceny przez użytkownika; żadna produkcyjna zmiana wyglądu nie zaczyna się przed zaakceptowaniem kierunku.

## Initial State Analysis (przy otwarciu zmiany)

- `/` nadal renderuje angielski ekran „10x Astro Starter”, a domyślny Layout ustawia `lang="en"` i tytuł startera (`src/pages/index.astro:1-8`, `src/components/Welcome.astro:20-111`, `src/layouts/Layout.astro:11-20`).
- Sign-in i signup mają własne angielskie formularze w niebiesko-fioletowej, cosmic oprawie (`src/pages/auth/signin.astro:10-23`, `signup.astro:9-22`, `src/components/auth/FormField.tsx:5-54`, `SubmitButton.tsx:15-30`).
- Niekompletny working-tree redesign przemianował w `src/styles/global.css` utility `bg-cosmic` na `bg-garden-page`, pozostawiając pięć użyć starej nazwy w landing/auth i dev kitchen sinkach. To jest źródłowa przyczyna braku tła w bieżącym kodzie (`global.css:178-183`; szczegóły w `research.md`).
- Semantyczne role ogrodu, wspólny `Button`, formularze, SSR, endpointy i deterministyczny garden planner kitchen sink już istnieją. `GardenDashboard.astro` i `ViewTabs.astro` nie należą do zatwierdzonej bazy; poprzedni plan błędnie potraktował robocze komponenty jako obecny kod. Zmiana `natural-garden-dashboard` nie ma ukończonego odbioru screenshotów (`context/changes/natural-garden-dashboard/plan.md:26-32`).
- Obecny `/dashboard` to ekran powitalny z linkiem do `/garden`; `/garden` wykonuje SSR prywatnych danych i składa konfigurację przestrzeni, wybór upraw i planer w trzech kolejnych sekcjach (`src/pages/dashboard.astro`, `src/pages/garden.astro:37-181`). Użytkownik zdecydował, że `/dashboard` stanie się głównym widokiem, a `/garden` przekieruje do niego.
- Ustalone w PRD: produkt służy prywatnemu planowaniu sezonu, konto zachowuje działkę między sesjami, a widok ma być responsywny (`context/foundation/prd.md`, „Vision & Problem Statement”, FR-001–008, „Non-Functional Requirements”).

## Current State Before Phase 4

- Fazy 2 i 3 zostały zatwierdzone commitami `7dd3895` i `6c717ba`; użytkownik potwierdził manualny odbiór landing/auth. Zatwierdzony interfejs korzysta z jasnych tokenów botanicznych, a publiczna strona i formularze auth mają polski copy.
- Dashboard nadal nie realizuje zaakceptowanej koncepcji: zatwierdzony `/dashboard` jest ekranem powitalnym, a SSR ogrodu działa na `/garden` w pionowym układzie formularzy i planera.
- `GardenDashboard.astro` i `ViewTabs.astro` były niezatwierdzonymi plikami roboczymi i zostały usunięte; nowa faza zaczyna się od bieżących `dashboard.astro`, `garden.astro` i istniejących wysp.

## Desired End State

Polskojęzyczna, jasna ścieżka prowadzi od charakterystycznego landingu pokazującego przykładowy plan, przez czytelne logowanie/rejestrację, do dashboardu, w którym wygenerowany ogród jest główną treścią. Botanika i własne ilustracje dodają ciepła, a typografia, nawigacja, focus i komunikaty pozostają czytelne na desktopie i telefonie.

Po zalogowaniu `/dashboard` domyślnie pokazuje duży plan grządek z małym podsumowaniem sezonu; konfiguracja sektorów i warzyw pozostaje w osobnych zakładkach. `/garden` przekierowuje do `/dashboard`. Prywatne dane, istniejący formularz auth, `returnTo`, SSR, zapisy, generator i obsługa aktualnego/nieaktualnego/błędnego/pustego planu zachowują swoje kontrakty.

### Key Discoveries:

- Niedziałający `bg-cosmic` jest wynikiem rozjazdu między bieżącym arkuszem a klasami w landing/auth, a nie braku tras auth (`src/styles/global.css:178-183`, `src/pages/auth/signin.astro:11`, `src/components/Welcome.astro:5`; `src/middleware.ts:4-29`).
- Bieżący SSR danych działa w `/garden`, natomiast `/dashboard` jest ekranem powitalnym. Istniejące wyspy `GardenSetupForm`, `CropSelectionForm` i `GardenPlanner` są montowane z `/garden` i muszą zachować props/eventy przy zmianie kompozycji (`src/pages/garden.astro:37-181`).
- Zapis konfiguracji przez `/api/garden` obecnie wraca na `/garden?saved=1` lub `/garden?error=...`; po zmianie routingu redirecty mają zachować komunikaty i otworzyć zakładkę Sektory (`src/pages/api/garden.ts:10-12,83-92`).
- W repo są katalogowe ilustracje crop atlasu, ale brak zatwierdzonej ilustracji marki/hero; referencja MniamPiśnik wyznacza nastrój, nie dostarcza assetu/licencji (`public/crops/crop-atlas.webp`, `context/changes/garden-experience-redesign/research.md`).
- Poprzedni garden kitchen sink ma fixture stanów, ale wcześniejsza zmiana nie przeszła odbioru wizualnego; sam source-level audit nie dowodzi, że obecne screenshoty renderują poprawnie.

## What We're NOT Doing

- Zmiana Supabase, sesji, schematu bazy, payloadów API, prywatności danych lub logiki wyliczania i zapisu planu; dozwolone są redirecty prezentacyjne do kanonicznego `/dashboard`.
- Ręczne przypisywanie upraw do sektorów, edycja algorytmu, nowe funkcje ogrodnicze lub wiele działek na konto.
- Udostępnianie na publicznym landingu rzeczywistego prywatnego ogrodu; podgląd używa deterministycznych, fikcyjnych danych.
- Kopiowanie logotypu, ilustracji ani assetów MniamPiśnika; kierunek zostanie zinterpretowany na nowo dla Mojej Działki.
- Dodanie przełącznika motywu, nowej biblioteki UI lub nowego frameworka testowego.

## Implementation Approach

Prowadzić jedną zmianę przez pięć faz. Fazy koncepcji, tokenów i landing/auth są odebrane. Faza 4 przenosi kanoniczny SSR ogrodu na `/dashboard`, tworzy osobne zakładki na bazie aktualnych routów i formularzy oraz zmienia `/garden` w alias. Faza 5 odbiera komplet widoków na realnym renderze. Używać istniejących prymitywów i zachować payloady API, renderowanie SSR/React, auth i prywatność; można skorygować wyłącznie redirecty do adresu kanonicznego.

## Critical Implementation Details

### User experience spec

Przed akceptacją mockupu fazy 1 nie zmieniać produkcyjnego UI. Mockup i publiczny podgląd planu używają wyłącznie stabilnych, fikcyjnych danych, ponieważ dane ogrodu należą do prywatnego konta. Po zapisie konfiguracji ekran ma wrócić na `/dashboard` do zakładki „Sektory” z komunikatem. `/garden` ma przekierować do `/dashboard`; wejście anonimowe na chroniony adres nadal zachowuje bezpieczne `returnTo`.

## Faza 1: Koncepcja wizualna do akceptacji

### Overview

Przygotować trzy reviewable widoki koncepcyjne: landing, logowanie/rejestracja i dashboard. Pokazać je w szerokości desktopowej oraz mobilnej, używając zaakceptowanego botaniczno-ilustracyjnego kierunku; zebrać akceptację zanim dotkniemy produkcyjnego UI.

### Changes Required:

#### 1. Podgląd projektowy

**File**: `context/changes/garden-experience-redesign/design/`

**Intent**: Dostarczyć prawdziwy, czytelny podgląd układu i treści, nie sam opis słowny ani obraz z nieczytelnym tekstem. Podgląd pozostaje artefaktem zmiany i nie korzysta z prywatnych danych ani z produkcyjnych endpointów.

**Contract**: Osobny statyczny/mockupowy materiał obejmuje landing, signin/signup oraz główny dashboard z garden/sectors/crops; zawiera widok desktop i mobile. Każda grafika jest oryginalną ilustracją ogrodu lub używa istniejącego crop atlasu. Po pokazaniu użytkownik może zgłosić korekty; przejście do Fazy 2 wymaga jawnego zaakceptowania koncepcji.

### Success Criteria:

#### Manual Verification:

- Użytkownik widzi landing, auth i dashboard w desktopie oraz mobile przed zmianą produkcyjnego UI.
- Użytkownik akceptuje pokazany kierunek albo jego poprawioną wersję; do tego czasu produkcyjne widoki pozostają nietknięte.

**Implementation Note**: Zatrzymać się po prezentacji materiału i uzyskać akceptację użytkownika przed Fazą 2.

## Faza 2: Wspólne tokeny, nawigacja i kontrast

### Overview

Naprawić spójność źródeł stylu i stworzyć wspólny fundament zaakceptowanej koncepcji. Usunąć regresję starej klasy tła i upewnić się, że widoki projektu oraz auth korzystają z semantycznych ról.

### Changes Required:

#### 1. Design tokens i wspólna nawigacja

**File**: `src/styles/global.css`, `src/components/Topbar.astro`, `src/layouts/Layout.astro`

**Intent**: Rozszerzyć istniejące semanticzne role na tło strony, powierzchnie, tekst, pola, akcent, błędy i focus według zaakceptowanego mockupu. Ujednolicić język strony i wspólną nawigację.

**Contract**: Zachować obecne nazwy konsumpcyjne używane przez widoki albo zmienić je atomowo wraz ze wszystkimi konsumentami; nie pozostawiać nieznanych utility klas. Polskie strony deklarują `lang="pl"` i własny tytuł; publiczne linki auth i zalogowane linki ogrodu zachowują adresy docelowe.

#### 2. Pola i prymitywy auth

**File**: `src/components/auth/FormField.tsx`, `SubmitButton.tsx`, `PasswordToggle.tsx`, `ServerError.tsx`, `src/components/ui/button.tsx`

**Intent**: Usunąć authowe literały cosmic/niebiesko-fioletowe i oprzeć kontrast, focus, stany pending/error oraz CTA na wspólnym systemie i istniejącym Button.

**Contract**: Zachować nazwy inputów, typy, etykiety dostępnościowe, `action` form, walidację i wysyłane dane; zmieniać prezentację i polski copy, nie kontrakt POST.

#### 3. Regresja klas i zakres skanera

**File**: `src/components/Welcome.astro`, `src/pages/auth/signin.astro`, `src/pages/auth/signup.astro`, `src/pages/dev/garden-planner-kitchen-sink.astro`, `src/pages/dev/crop-selection-kitchen-sink.astro`, `scripts/check-garden-ui-tokens.mjs`, `AGENTS.md`

**Intent**: Doprowadzić źródło, wszystkie wskazane widoki i ochronę design systemu do zgodnego nazewnictwa oraz rozszerzyć kontrolę na zmienione widoki produktu.

**Contract**: Aktywne widoki nie odwołują się do nieistniejącego `bg-cosmic`; skaner obejmuje landing, auth, dashboard i oba kitchen sinki, nie sam arkusz wartości. Regułę UI rozszerzyć w istniejącym bloku projektu, nie edytując zarządzanego bloku 10x CLI.

### Success Criteria:

#### Automated Verification:

- `npm run lint` przechodzi, a checker obejmuje publiczne/auth widoki oraz oba dev kitchen sinki.
- W aktywnych widokach nie ma nieobsłużonych odniesień do dawnych klas cosmic ani niezatokenizowanych kolorów objętych checkerem.

#### Manual Verification:

- Tło strony, pola, tekst, focus, błędy i CTA są czytelne na jasnej powierzchni w signin/signup, obu kitchen sinkach i Topbarze.
- Linki topbara prowadzą odpowiednio do signin/signup lub dashboardu; wszystkie widoczne etykiety wspólnej nawigacji są po polsku.

**Implementation Note**: Zatrzymać się po Fazie 2 i obejrzeć wspólną powłokę/auth oraz fixture stanu focus/error przed rozbudową ekranów.

## Faza 3: Landing oraz ścieżka auth

### Overview

Zastąpić stronę startera stroną Mojej Działki i przełożyć zaakceptowany kierunek na logowanie oraz rejestrację. Landing pokazuje przykładowy ogród i korzyść z planera; auth pozostaje prosty, wyraźny i bezpośrednio dostępny.

### Changes Required:

#### 1. Publiczna strona produktu

**File**: `src/pages/index.astro`, `src/components/Welcome.astro`, `src/layouts/Layout.astro`

**Intent**: Zastąpić opis technologii obietnicą planowania warzywnika i pokazać rozpoznawalną ilustrację/podgląd przykładowego układu.

**Contract**: Główne CTA prowadzi do rejestracji, link dla istniejącego konta do `/auth/signin`; podgląd jest statyczny i nie zawiera danych konta. Strona, title i meta language są po polsku.

#### 2. Logowanie i rejestracja

**File**: `src/pages/auth/signin.astro`, `src/pages/auth/signup.astro`, `src/components/auth/SignInForm.tsx`, `SignUpForm.tsx`, `FormField.tsx`, `ServerError.tsx`, `PasswordToggle.tsx`, `SubmitButton.tsx`

**Intent**: Zapewnić czytelne formularze w zaakceptowanej oprawie ilustracyjnej, z pełnym polskim copy i widocznymi stanami.

**Contract**: Zachować POST `/api/auth/signin` i `/api/auth/signup`, istniejącą walidację oraz bezpieczne `returnTo`. Błędy, pending, show/hide password i link między signin/signup pozostają dostępne i zrozumiałe.

### Success Criteria:

#### Automated Verification:

- `npm run build` przechodzi po zmianie landing/auth.
- `npm run lint` przechodzi dla poszerzonego zakresu skanera UI.

#### Manual Verification:

- `/` pokazuje polską stronę produktu z ogrodniczym przykładem i działającymi linkami do konta; nie wyświetla starterowego copy.
- Signin i signup mają czytelne etykiety, pola, fokus i błędy; formularze wysyłają te same payloady co przed zmianą.
- Wejście anonimowe na chroniony cel prowadzi przez signin i po powodzeniu wraca na zachowane `returnTo`; użytkownik może przejść signin ↔ signup.

**Implementation Note**: Zatrzymać się po Fazie 3 i przed dashboardem pokazać użytkownikowi gotowe landing/auth na desktopie i mobile.

## Faza 4: Dashboard ogrodu na pierwszym planie

### Overview

Dopracować zalogowany dashboard w zaakceptowanym języku wizualnym, umieszczając plan grządek na pierwszym planie i niewielkie podsumowanie sezonu obok lub nad nim zgodnie z mockupem.

### Changes Required:

#### 1. Główny widok, alias i konfiguracja

**File**: `src/pages/dashboard.astro`, `src/pages/garden.astro`, `src/pages/api/garden.ts`, `src/pages/api/garden.test.ts`, `src/pages/api/garden-plan.ts`, `src/middleware.ts`, `src/components/garden/GardenSetupForm.tsx`, `src/components/garden/CropSelectionForm.tsx`, `src/components/Topbar.astro`, istniejące komponenty UI po inspekcji

**Intent**: Przenieść kanoniczny SSR prywatnego ogrodu na `/dashboard`; ułożyć plan, sektory i warzywa w zaakceptowane zakładki oraz przekierować `/garden` do kanonicznego widoku. Dopasować rytm, ilustracyjność i responsywność do zaakceptowanego mockupu.

**Contract**: „Mój ogród” pozostaje domyślną zakładką z czytelnym planem; „Sektory” i „Warzywa” pozostają odrębnymi, edytowalnymi zakładkami. Przenieść istniejący SSR read z `/garden` bez zmiany zapytań ani prywatności, zachować props/eventy wysp `client:load`, a `/garden` kierować do `/dashboard`. Redirecty po zapisie konfiguracji zachowują `saved`/`error` i wskazują zakładkę Sektory; redirecty auth dla generatora i middleware wracają do kanonicznego dashboardu. Nie przywracać niezatwierdzonych komponentów `GardenDashboard.astro` ani `ViewTabs.astro`.

#### 2. Diagram oraz stany planera

**File**: `src/components/garden/GardenPlanner.tsx`, `GardenLayoutView.tsx`, `SeasonWorkSchedule.tsx`, `src/pages/dev/garden-planner-kitchen-sink.astro`

**Intent**: Dopasować powierzchnie, typografię, odstępy i istniejące crop atlas ilustracje do zatwierdzonego dashboardu, nie redukując informacji potrzebnych do odczytania wyniku.

**Contract**: Zachować proporcjonalną geometrię diagramu, oznaczenia konfliktów/pominięć, status current/stale/empty/unavailable/partial, harmonogram i dostępny mobile dialog. Nie zmieniać obliczeń generatora ani danych planu.

### Success Criteria:

#### Automated Verification:

- `npm run build` przechodzi po zmianie dashboardu.
- `npm run lint` przechodzi, a garden UI token scan nie raportuje niezapisanych wyjątków.

#### Manual Verification:

- Po zalogowaniu pierwszy widok pokazuje plan grządek i małe podsumowanie sezonu; zakładki Sektory i Warzywa nadal pozwalają edytować i zapisać dane.
- Widoczne stany planu (aktualny, nieaktualny, pusty, niedostępny/błąd, częściowy) pozostają rozróżnialne; diagram i harmonogram są czytelne na desktopie i telefonie.
- Zapisy sektorów otwierają `/dashboard` na zakładce Sektory z prawidłowym komunikatem sukcesu/błędu; `/garden` przekierowuje do głównego widoku, a auth nadal zachowuje `returnTo`. Payloady API, SSR i prywatność planu pozostają niezmienione.

**Implementation Note**: Zatrzymać się po Fazie 4 na odbiór dashboardu, zanim przejdzie się do końcowej rundy wszystkich ekranów.

## Faza 5: Całościowy odbiór wizualny

### Overview

Odebrać cały publiczny→auth→dashboard flow na realnym renderze i uzupełnić brakującą bramkę wizualną poprzedniej zmiany. Potwierdzić, że koncepcja i produkcyjny wygląd są zgodne przed zamknięciem pracy.

### Changes Required:

#### 1. Screenshoty i macierz stanów

**File**: `src/components/Welcome.astro`, `src/pages/dev/garden-planner-kitchen-sink.astro`, `src/pages/dev/crop-selection-kitchen-sink.astro`, `context/changes/garden-experience-redesign/change.md`

**Intent**: Użyć istniejących deterministycznych fixture i zapisać wynik odbioru tej zmiany, która pokrywa także wcześniej nieukończony wizualny przegląd garden UI.

**Contract**: Zrobić podglądy dla landing, signin, signup, `/dashboard` z trzema zakładkami, przekierowania `/garden` oraz istniejących kitchen sinków w desktopie i jednym mobilnym viewportcie. Rzeczywiste dane kont nie trafiają do zrzutów. W siedmiostanowej macierzy 10x-ui zaznaczyć każdy mający zastosowanie stan; dla stanu N/A wpisać powód. Zgłosić i poprawić widoczne problemy przed końcową akceptacją użytkownika.

### Success Criteria:

#### Automated Verification:

- Końcowe `npm run lint` przechodzi dla wszystkich objętych ekranów.
- Końcowe `npm run build` przechodzi.

#### Manual Verification:

- Landing, signin/signup, dashboard i kitchen sinki zostały obejrzane przy desktopowym i mobilnym viewportcie; wszystkie interaktywne stany mają widoczny focus, czytelny kontrast i brak poziomego overflow.
- Użytkownik akceptuje finalny zestaw screenshotów, a obserwacje z odbioru są odnotowane w artefakcie zmiany.

**Implementation Note**: Nie oznaczać zmiany jako kompletnej przed odbiorem screenshotów i potwierdzeniem użytkownika.

## Testing Strategy

### Unit Tests:

- Nie dodawać testów logiki domenowej; generator, walidacja, snapshot i prywatność danych nie zmieniają się w tym zakresie.

### Integration Tests:

- Nie dodawać nowych testów integracyjnych ani screenshot-test runnera. Istniejące kontrakty e2e API/auth są poza celem tej wizualnej zmiany; każda zauważona regresja funkcjonalna blokuje odbiór i wymaga osobnego zakresu.

### Manual Testing Steps:

1. Obejrzeć i zaakceptować projektowe podglądy landing/auth/dashboard przed modyfikacją produkcyjnego UI.
2. Sprawdzić `/`, `/auth/signin`, `/auth/signup`, `/dashboard` oraz przekierowanie aliasu `/garden` na desktopie i telefonie.
3. Sprawdzić login/signup, błąd walidacji i odpowiedzi, pending, show/hide password, `returnTo`, signout oraz linki Topbar.
4. Na dashboardzie sprawdzić przełączanie zakładek, zapis sektorów/warzyw, redirect po zapisie, błędy i status planu; w kitchen sink obejrzeć siedem stanów opisanych przez 10x-ui.
5. Zapisać zrzuty po anonimizacji lub z deterministycznymi danymi; poprosić użytkownika o końcowy odbiór.

## Performance Considerations

Nie dodawać dużej biblioteki UI ani ciężkiego tła wideo/animacji. Preferować istniejący crop atlas lub lekką, oryginalną ilustrację wektorową; nie wysyłać prywatnych danych planu na landing.

## Migration Notes

Brak migracji bazy, zmian schematu ani konwersji danych. Zmiana adresu kanonicznego wymaga aktualizacji wyłącznie redirectów prezentacyjnych po zapisie/auth, bez zmiany kształtu payloadów API. Bazą są obecne, zatwierdzone `src/pages/dashboard.astro` i `src/pages/garden.astro`; nie przywracać dawnych plików roboczych dashboardu/tabów.

## References

- Frame: `context/changes/garden-experience-redesign/frame.md`
- Research: `context/changes/garden-experience-redesign/research.md`
- Istniejąca praca dashboardu: `context/changes/natural-garden-dashboard/plan.md`
- PRD: `context/foundation/prd.md`
- Implementacje: `src/pages/dashboard.astro`, `src/pages/garden.astro`, `src/components/garden/GardenPlanner.tsx`, `src/pages/auth/signin.astro`, `src/components/Welcome.astro`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Koncepcja wizualna do akceptacji

#### Manual

- [x] 1.1 Użytkownik widzi landing, auth i dashboard w desktopie oraz mobile przed zmianą produkcyjnego UI.
- [x] 1.2 Użytkownik akceptuje pokazany kierunek albo jego poprawioną wersję; do tego czasu produkcyjne widoki pozostają nietknięte.

### Phase 2: Wspólne tokeny, nawigacja i kontrast

#### Automated

- [x] 2.1 `npm run lint` przechodzi, a checker obejmuje publiczne/auth widoki oraz oba dev kitchen sinki. — 7dd3895
- [x] 2.2 W aktywnych widokach nie ma nieobsłużonych odniesień do dawnych klas cosmic ani niezatokenizowanych kolorów objętych checkerem. — 7dd3895

#### Manual

- [x] 2.3 Tło strony, pola, tekst, focus, błędy i CTA są czytelne na jasnej powierzchni w signin/signup, obu kitchen sinkach i Topbarze. — 7dd3895
- [x] 2.4 Linki topbara prowadzą odpowiednio do signin/signup lub dashboardu; wszystkie widoczne etykiety wspólnej nawigacji są po polsku. — 7dd3895

### Phase 3: Landing oraz ścieżka auth

#### Automated

- [x] 3.1 `npm run build` przechodzi po zmianie landing/auth. — 6c717ba
- [x] 3.2 `npm run lint` przechodzi dla poszerzonego zakresu skanera UI. — 6c717ba

#### Manual

- [x] 3.3 `/` pokazuje polską stronę produktu z ogrodniczym przykładem i działającymi linkami do konta; nie wyświetla starterowego copy. — 6c717ba
- [x] 3.4 Signin i signup mają czytelne etykiety, pola, fokus i błędy; formularze wysyłają te same payloady co przed zmianą. — 6c717ba
- [x] 3.5 Wejście anonimowe na chroniony cel prowadzi przez signin i po powodzeniu wraca na zachowane `returnTo`; użytkownik może przejść signin ↔ signup. — 6c717ba

### Phase 4: Dashboard ogrodu na pierwszym planie

#### Automated

- [x] 4.1 `npm run build` przechodzi po zmianie dashboardu. — dcd50fe
- [x] 4.2 `npm run lint` przechodzi, a garden UI token scan nie raportuje niezapisanych wyjątków. — dcd50fe

#### Manual

- [x] 4.3 Po zalogowaniu `/dashboard` pokazuje plan grządek i małe podsumowanie sezonu; zakładki Sektory i Warzywa nadal pozwalają edytować i zapisać dane. — dcd50fe
- [x] 4.4 Widoczne stany planu (aktualny, nieaktualny, pusty, niedostępny/błąd, częściowy) pozostają rozróżnialne; diagram i harmonogram są czytelne na desktopie i telefonie. — dcd50fe
- [x] 4.5 Zapisy zachowują wybór zakładki Sektory oraz prawidłowe komunikaty sukcesu/błędu; zmieniają się wyłącznie redirecty adresu kanonicznego, a prywatność planu i payloady API pozostają niezmienione. — dcd50fe

### Phase 5: Całościowy odbiór wizualny

#### Automated

- [x] 5.1 Końcowe `npm run lint` przechodzi dla wszystkich objętych ekranów.
- [x] 5.2 Końcowe `npm run build` przechodzi.

#### Manual

- [x] 5.3 Landing, signin/signup, dashboard i kitchen sinki zostały obejrzane przy desktopowym i mobilnym viewportcie; wszystkie interaktywne stany mają widoczny focus, czytelny kontrast i brak poziomego overflow.
- [x] 5.4 Użytkownik akceptuje finalny zestaw screenshotów, a obserwacje z odbioru są odnotowane w artefakcie zmiany.
