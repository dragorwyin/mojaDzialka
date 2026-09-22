---
project: "MojaDziałka"
researched_at: 2026-09-20
recommended_platform: Cloudflare Workers
runner_up: Vercel
context_type: mvp
tech_stack:
  language: TypeScript
  framework: Astro 7.3.2
  runtime: Cloudflare Workers (SSR Worker with static assets)
---

## Recommendation

**Wdróż MVP na Cloudflare Workers.** To najtańsza opcja zgodna z bieżącą konfiguracją: `@astrojs/cloudflare` 14.3.1, `output: "server"` i `wrangler.jsonc` z entrypointem Worker oraz katalogiem `dist`. Przy ruchu MVP koszt hostingu może wynieść 0 USD, o ile aplikacja mieści się w bezpłatnych limitach. Wybór uwzględnia odpowiedzi: brak trwałych połączeń, minimalizację kosztu, użytkowników głównie z Polski i pozostawienie Supabase jako osobnej usługi.

**Przed wdrożeniem popraw rozbieżność w dokumentacji:** `context/foundation/tech-stack.md` wskazuje Cloudflare Pages, podczas gdy bieżąca konfiguracja projektu jest konfiguracją Workers. Ten raport opisuje Workers; nie zmienia konfiguracji ani `tech-stack.md`.

## Platform Comparison

Punktacja: Pass = 2, Partial = 1, Fail = 0; maksimum 10. Kryteria mają równą punktację w tabeli. W decyzji końcowej większą wagę mają koszt MVP, zgodność z repozytorium i zarządzany charakter usługi; kolumna MCP ma małą wagę. Ceny są przybliżeniami dla 10–100 tys. żądań miesięcznie i około 1–10 GB transferu, według cenników sprawdzonych 2026-09-20; nie obejmują Supabase.

| Platforma | CLI | Zarządzanie | Dokumentacja dla agentów | Stabilne wdrożenie/API | MCP/integracja | Wynik | Orientacyjny koszt hostingu MVP |
|---|---:|---:|---:|---:|---:|---:|---|
| Cloudflare Workers | Pass | Pass | Pass | Pass | Partial | **9/10** | 0 USD w granicach Free; plan Workers Paid od 5 USD/mies. |
| Vercel | Pass | Pass | Pass | Pass | Partial | **9/10** | 0 USD dla osobistego, niekomercyjnego użycia; Pro od ok. 20 USD/użytkownika/mies. |
| Netlify | Pass | Pass | Pass | Pass | Partial | **9/10** | Free do 300 kredytów; przy 10 GB transferu i wdrożeniach można zbliżyć się do limitu. |
| Fly.io | Pass | Partial | Pass | Pass | Partial | **8/10** | Około 6–7 USD/mies. za stale działającą maszynę 1 GB, plus transfer i dysk. |
| Railway | Partial | Pass | Partial | Pass | Partial | **7/10** | Zwykle około 6–7 USD/mies. w przykładowym małym obciążeniu; minimum Hobby 5 USD. |
| Render | Partial | Pass | Partial | Pass | Pass | **8/10** | Około 7–9 USD/mies. dla SSR na płatnym Web Service, plus transfer. |

**Cloudflare Workers —** Wrangler zapewnia wdrożenie, logi i rollback, dokumentacja jest dostępna w formacie dla agentów, a Worker ze statycznymi zasobami pasuje do aktualnego Astro SSR. Free obejmuje 100 tys. żądań Worker dziennie i 10 ms CPU na żądanie; statyczne assety są bezpłatne. Plan Paid kosztuje 5 USD/mies. i obejmuje 10 mln żądań oraz 30 mln ms CPU. Ryzyka: niski limit CPU w Free, różnice środowiska Workers względem Node oraz brak ustalonego poziomu dojrzałości części serwerów MCP. [Cennik Workers](https://developers.cloudflare.com/workers/platform/pricing/), [Astro na Workers](https://developers.cloudflare.com/workers/framework-guides/web-apps/astro/), [kompatybilność Node.js](https://developers.cloudflare.com/workers/runtime-apis/nodejs/).

**Vercel —** bardzo dobre CLI, wdrożenia podglądowe i dokumentacja Astro; dla SSR wymaga adaptera Vercel zamiast obecnego adaptera Cloudflare. Darmowy plan Hobby jest przeznaczony wyłącznie do osobistych, niekomercyjnych projektów; komercyjne użycie wymaga planu Pro. Vercel pozostaje mocnym drugim wyborem ze względu na znajomość platformy przez użytkownika, ale wiąże się z migracją adaptera i potencjalnie wyższym kosztem. MCP jest dostępny, lecz jego status w badaniu był oznaczony jako beta. [Astro na Vercel](https://vercel.com/docs/frameworks/frontend/astro), [plan Hobby](https://vercel.com/docs/plans/hobby).

**Netlify —** obsługuje Astro SSR po dodaniu adaptera Netlify i ma dobre CLI oraz dokumentację. Free daje 300 kredytów miesięcznie. Przybliżony scenariusz 100 tys. żądań, 10 GB transferu i czterech wdrożeń produkcyjnych zużywa około 280 kredytów przed naliczeniem funkcji; transfer i podglądy mogą więc szybko wyczerpać budżet. Domyślny region funkcji to Ohio, a wybór Frankfurtu wymaga planu Pro/Enterprise. [Astro na Netlify](https://docs.netlify.com/build/frameworks/framework-setup-guides/astro/), [cennik i kredyty](https://www.netlify.com/pricing/).

**Fly.io —** Astro SSR można uruchomić jako aplikację kontenerową z adapterem Node. Daje kontrolę nad lokalizacją w Europie i procesami stale działającymi, których ten projekt nie potrzebuje. Brak bezpłatnego planu i konieczność obsługi obrazu oraz maszyny podnoszą koszt i nakład pracy w porównaniu z Workers. [Przewodnik Astro](https://www.fly.io/docs/js/frameworks/astro/), [cennik](https://fly.io/docs/about/pricing/).

**Railway —** szybki, zarządzany hosting i usługi towarzyszące, lecz aktualna konfiguracja Astro 7 SSR wymaga adaptera Node i odejścia od obecnego adaptera Cloudflare. Hobby ma minimum 5 USD miesięcznie, które pokrywa 5 USD użycia; końcowa cena zależy od CPU, pamięci i transferu. Dokumentacja częściowo odzwierciedla starsze wersje Astro, dlatego trzeba weryfikować przykłady przed użyciem. [Przewodnik Astro](https://docs.railway.com/guides/astro), [cennik](https://railway.com/pricing).

**Render —** statyczne Astro może być bezpłatne, ale obecne `output: "server"` oznacza usługę SSR, a nie statyczną witrynę. Darmowe usługi usypiają po 15 minutach bezczynności i mogą potrzebować około minuty na ponowne uruchomienie; do normalnego MVP należy liczyć płatny Web Service. Render ma oficjalny MCP, oznaczony w badaniu jako GA. [Astro na Render](https://render.com/docs/deploy-astro), [plan Free](https://render.com/docs/free), [cennik](https://render.com/pricing).

### Shortlisted Platforms

#### 1. Cloudflare Workers (wybrana)

Najniższy koszt na starcie, najmniej zmian względem konfiguracji w repozytorium oraz globalna obsługa statycznych zasobów. Brak WebSocketów i procesów tła usuwa główną przewagę platform kontenerowych. Suma 9/10 jest remisem, więc wybór opiera się na zgodności kodu i cenie, nie tylko na wyniku tabeli.

#### 2. Vercel

Również 9/10 i znana użytkownikowi platforma z dobrym wsparciem Astro. Przegrywa dla tego repozytorium koniecznością zmiany adaptera, a plan Hobby nie zezwala na komercyjne użycie.

#### 3. Netlify

Również 9/10, dobry adapter Astro i przejrzyste workflow podglądów. Free jest oparte o kredyty, a transfer i wdrożenia mogą zużyć większość miesięcznego limitu; region Frankfurt nie jest dostępny w planie Free.

## Anti-Bias Cross-Check: Cloudflare Workers

### Devil's Advocate — Weaknesses

1. **Konfiguracja może być rozumiana jako Pages, a wdrażana jako Workers.** `tech-stack.md` mówi Pages, natomiast `wrangler.jsonc` podaje `main` i `assets`, czyli Worker ze statycznymi zasobami. Niezgodny wybór produktu i integracji Git może dać inny typ wdrożenia niż zakładany.
2. **Bezpłatny limit CPU może ograniczyć SSR.** Limit 10 ms CPU na wywołanie może zostać przekroczony przez cięższe renderowanie, walidację lub przetwarzanie danych; wydłużenie czasu CPU wymaga płatnego planu i podnosi koszt.
3. **Rollback kodu nie cofa danych ani zmian zasobów.** Przywrócenie poprzedniej wersji Worker nie wycofuje migracji Supabase; stary kod może przestać działać po zmianie schematu.
4. **Runtime Workers nie jest pełnym Node.js.** Część API Node ma polyfille lub stuby, więc zależność działająca lokalnie może zawieść dopiero na wdrożonym Workerze.
5. **Podglądy i sekrety środowisk wymagają jawnej konfiguracji.** Sekrety środowisk nie dziedziczą się automatycznie, a preview spięty z produkcyjnym Supabase mógłby zmieniać prawdziwe dane.

### Pre-Mortem — Jak może się nie udać

Po sześciu miesiącach zespół uznał wybór za porażkę. Na początku potraktował Pages i Workers jak tę samą usługę: dokumentacja nadal mówiła Pages, a integrację Git skonfigurowano według innego przewodnika niż `wrangler.jsonc`. Pierwszy deploy działał, ale lokalne preview i produkcyjny Worker różniły się przy sesjach Supabase. Problem pozostał niezauważony, bo testowano tylko stronę główną. Gdy ruch wzrósł, część SSR przekraczała bezpłatne 10 ms CPU; koszt i diagnostyka pojawiły się dopiero po zgłoszeniach użytkowników. W pośpiechu podniesiono limit, nie mierząc najcięższych widoków. Następnie migracja schematu Supabase wdrożona przed aplikacją złamała poprzednią wersję kodu, więc `wrangler rollback` przywrócił Worker, ale nie działające zachowanie. Preview’y używały produkcyjnych sekretów, ponieważ założono, że środowisko je odziedziczy. Drobny test modyfikacji danych zmienił prawdziwy plan użytkownika. Alerty kosztowe nie były skonfigurowane, a zespół nie mierzył dziennego CPU ani liczby wywołań przed promocją zmian na produkcję. Brak osobnego projektu Supabase i procedury zgodnych wstecznie migracji sprawił, że tania platforma wymagała ręcznego gaszenia problemów.

### Unknown Unknowns

- Data zgodności w `wrangler.jsonc` to `2026-05-08`, a `nodejs_compat` jest jawnie włączone. Zmiana daty zgodności może zmienić zachowanie runtime; nie aktualizuj jej automatycznie przy deployu. [Daty zgodności i flagi](https://developers.cloudflare.com/workers/configuration/compatibility-flags/).
- Rollback obejmuje wersję Worker, ale nie zasoby ani dane; Cloudflare utrzymuje ograniczoną historię wersji, a rollback może być niekompatybilny ze zmianą bindingów. [Rollback Workers](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/).
- Sekrety dla osobnych środowisk trzeba ustawić oddzielnie; `wrangler secret put` publikuje nową wersję. Zaplanuj rotację z uwzględnieniem skutku deployu. [Sekrety](https://developers.cloudflare.com/workers/configuration/secrets/), [środowiska Wrangler](https://developers.cloudflare.com/workers/wrangler/environments/).
- Cloudflare udostępnia serwery MCP, ale nie wszystkie miały w dokumentacji jednoznacznie określony poziom dojrzałości. Nie uzależniaj wdrożenia ani odzyskiwania działania od MCP; Wrangler jest podstawowym interfejsem operacyjnym.
- Bieżący workflow sprawdza `astro preview` z lokalnym Supabase, nie produkcyjny Worker. Przed uruchomieniem ruchu sprawdź logowanie, cookies, callbacki auth i dostęp do danych na wdrożonym preview. [Supabase Auth z Astro](https://supabase.com/docs/guides/auth/quickstarts/astrojs).

## Operational Story

- **Preview deploys**: połączenie repozytorium z Workers Builds i włączenie preview dla gałęzi nieprodukcyjnych daje osobny URL dla pull requestu; workflow trzeba skonfigurować, nie jest obecnie obecny w repozytorium. Używaj osobnego projektu Supabase dla preview. [Budowanie Workers](https://developers.cloudflare.com/workers/ci-cd/builds/), [preview gałęzi](https://developers.cloudflare.com/workers/ci-cd/builds/build-branches/).
- **Secrets**: wartości `SUPABASE_URL` i `SUPABASE_KEY` trzymaj jako sekrety Worker, osobno dla produkcji i preview; nie zapisuj ich w repo ani w logach. Sekrety środowisk nie są dziedziczone. Zmiana przez `wrangler secret put` tworzy nową wersję/deploy, więc rotację wykonuj świadomie.
- **Rollback**: po sprawdzeniu błędu operator wykonuje `npx wrangler rollback` i weryfikuje wynik przez `npx wrangler tail`. To przywraca kod, nie stan Supabase; wdrażaj migracje rozszerzająco, tak aby stary i nowy kod mogły chwilowo działać ze schematem.
- **Approval**: agent może budować aplikację, tworzyć preview i odczytywać logi. Człowiek zatwierdza merge do gałęzi produkcyjnej, publikację produkcyjną, zmianę/rotację sekretów oraz migrację niszczącą lub niezgodną wstecznie. Obecny GitHub Actions CI uruchamia sprawdzenia na PR i push do `master`; nie publikuje Worker.
- **Logs**: agent lub operator czyta logi środowiska poleceniem `npx wrangler tail <nazwa-workera> --format pretty`; logi buildów odczytuje w GitHub Actions. Nie umieszczaj sekretów ani prywatnych danych użytkowników w logach.

## Risk Register

| Ryzyko | Źródło | Prawdopodobieństwo | Wpływ | Ograniczenie |
|---|---|---:|---:|---|
| `tech-stack.md` wskazuje Pages, repozytorium konfiguruje Workers | Devil's advocate | Wysokie | Wysoki | Przed wdrożeniem popraw kontrakt stacku na Workers; utrzymuj jeden produkt, konfigurację i workflow wdrożeniowy. |
| Render SSR przekroczy limit 10 ms CPU Free | Devil's advocate / badanie | Średnie | Średni | Zmierz ciężkie ścieżki na preview; monitoruj zużycie CPU; przejdź na Workers Paid, jeśli pomiary lub ruch tego wymagają. |
| Różnice runtime Node/Workers ujawnią się po wdrożeniu | Devil's advocate / unknown unknown | Średnie | Wysoki | Testuj auth i SSR na Worker preview; sprawdź nowe zależności pod kątem wymaganych API Node przed dodaniem. |
| Preview zapisze do produkcyjnego Supabase | Devil's advocate / pre-mortem | Średnie | Wysoki | Osobny projekt Supabase dla preview, oddzielne sekrety i minimalne uprawnienia. |
| Rollback kodu nie naprawi niezgodnego schematu bazy | Devil's advocate / pre-mortem | Średnie | Wysoki | Stosuj migracje expand/contract; zmiany destrukcyjne wymagają zatwierdzenia człowieka i planu odtworzenia. |
| Nieprawidłowe preview/runtime ustawienia z powodu Pages/Workers | Unknown unknown | Średnie | Średni | Ustal Workers Builds jako pojedynczą ścieżkę publikacji; włącz preview dla gałęzi i sprawdź bindingi/secrets obu środowisk. |
| Koszt wzrośnie po wyjściu poza darmowy limit lub przy ciężkim CPU | Badanie | Niskie | Średni | Ustaw alert/budżet i przeglądaj użycie po pierwszych wdrożeniach; Workers Paid ma bazę 5 USD/mies. |

## Getting Started

1. Zaktualizuj `context/foundation/tech-stack.md`: wybór to **Cloudflare Workers**, nie Pages. Przed połączeniem produkcji zdecyduj o nazwie Worker; obecna nazwa `10x-astro-starter` w `wrangler.jsonc` pochodzi ze startera.
2. Zachowaj wersje z lockfile: Astro 7.3.2, `@astrojs/cloudflare` 14.3.1, Wrangler 4.131.1 i Node 22.14.0 (`.nvmrc`). Zainstaluj zależności przez `npm ci`; nie instaluj równolegle globalnej wersji Wrangler.
3. Lokalny cykl dla bieżących skryptów to `npm run dev`, `npm run build` i `npm run preview`. Build produkcyjny opiera się na `astro build` i konfiguracji `output: "server"` z adapterem Cloudflare.
4. Po utworzeniu Cloudflare Worker i ustawieniu jego sekretów, pierwszy deploy z katalogu repozytorium wykonuje się przez `npx wrangler deploy`. Użyj istniejącego `wrangler.jsonc` jako źródła konfiguracji. [Astro na Workers](https://developers.cloudflare.com/workers/framework-guides/web-apps/astro/), [komendy Wrangler](https://developers.cloudflare.com/workers/wrangler/commands/workers/).
5. Przed produkcyjnym ruchem przetestuj logowanie, callback auth, sesję/cookies oraz odczyt i zapis planu na preview z nieprodukcyjnym Supabase. Zachowaj aktualną datę zgodności do czasu osobnej weryfikacji zmian runtime.

## Out of Scope

W tym researchu nie wykonano:

- konfiguracji CI/CD ani Workers Builds;
- zmian w `tech-stack.md`, `wrangler.jsonc` ani kodzie aplikacji;
- konfiguracji Docker;
- prognozowania architektury produkcyjnej, HA, DR ani wdrożeń wieloregionowych.
