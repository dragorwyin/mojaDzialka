<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Rozstaw późnej marchwi i czytelność diagramu

- **Plan**: `context/changes/carrot-spacing-and-diagram-readability/plan.md`
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3
- **Date**: 2026-10-02
- **Verdict**: NEEDS ATTENTION
- **Findings**: 0 critical, 5 warnings, 1 observation

═══════════════════════════════════════════════════════════
  IMPLEMENTATION REVIEW: Rozstaw późnej marchwi i czytelność diagramu
  Scope: Phases 1, 2, 3 of 3  |  Date: 2026-10-02
  Findings: 0 critical · 5 warnings · 1 observation
═══════════════════════════════════════════════════════════

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | WARNING |
| Scope Discipline | PASS |
| Safety & Quality | WARNING |
| Architecture | PASS |
| Pattern Consistency | PASS |
| Success Criteria | WARNING |

  ► Overall: NEEDS ATTENTION

═══════════════════════════════════════════════════════════
  WARNING FINDINGS ⚠️
═══════════════════════════════════════════════════════════

### F1 — Cytowane źródła nie potwierdzają rozstawy marchwi 7–8 cm

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Plan Adherence
- **Location**: `src/data/crop-catalog.ts:1421`; `context/changes/garden-crop-catalog-and-layout/research.md:62`
- **Detail**: Użytkownik zatwierdził minimum 7 cm dla marchwi, więc recenzja nie kwestionuje tej decyzji produktowej. Problemem jest przypisanie zakresu 7–8 cm źródłom S54/S55, podczas gdy zapis researchu przytacza dla nich 3–5 cm i nie potwierdza górnej granicy 8 cm. Katalog nadal oznacza pewność jako średnią, co może sugerować źródłowe potwierdzenie całego zakresu.
- **Fix**: Zachować zatwierdzone minimum 7 cm, ale oznaczyć 7–8 cm jako przyjęty profil/założenie produktu zamiast przypisywać go obecnym źródłom; zaktualizować research i pewność po znalezieniu źródła uzasadniającego górną granicę.
  - Strength: Zachowuje decyzję użytkownika i oddziela ją od twierdzeń źródłowych.
  - Tradeoff: Wymaga doprecyzowania sposobu oznaczania decyzji produktowych w katalogu.
  - Confidence: HIGH — rozbieżność 3–5 vs 7–8 jest widoczna w zapisanym researchu i katalogu.
  - Blind spot: Nie wykonano nowego zewnętrznego researchu w ramach tego review.
- **Decision**: FIXED — oznaczono zakres 7–8 cm jako roboczy profil z minimum zatwierdzonym przez użytkownika; doprecyzowano konteksty S54/S55, obniżono confidence do `low` i oddzielono wynik researchu od wartości aplikacji. Wersję katalogu podbito z 3 do 4, aby dotychczasowe plany nie pokazywały już starej pewności jako aktualnej. Testy przechodzą.

### F2 — Smoke nie sprawdza regeneracji planu po oznaczeniu go jako nieaktualny

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: `scripts/smoke.mjs:230, 236`
- **Detail**: W wersji z `HEAD` smoke sprawdza generowanie i ponowienie planu, a potem osobno czyszczenie wyboru. Nie asercjonuje sekwencji: zmiana wejścia → status `stale` → ponowne wygenerowanie → status `current`. Faza 3 oznacza smoke jako zaliczony, mimo że nie uruchomiono go z powodu niedostępnego lokalnego środowiska Supabase/preview. Robocza, niezacommitowana wersja skryptu dodaje asercję `stale`, ale nadal nie sprawdza regeneracji po tej zmianie.
- **Fix**: Uzupełnić smoke o pełną sekwencję nieaktualności i ponownego generowania, a gate oznaczyć jako zaliczony dopiero po wykonaniu go w skonfigurowanym środowisku.
- **Decision**: FIXED — zachowano wcześniejsze testy i dopisano sekwencję: zmiana udziału marchwi → sprawdzenie `stale` → regeneracja planu → sprawdzenie `current`. Składnia, ESLint i Prettier przechodzą; pełny smoke nadal wymaga dostępnego lokalnego Supabase/preview.

### F3 — Commitowany test:unit pomija nowy test fingerprintu

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: `package.json:15`; `src/lib/garden-plan-snapshot.test.ts`
- **Detail**: Test sprawdzający, że zmiana wersji katalogu unieważnia stary plan, został dodany w Phase 1, ale skrypt `test:unit` w `HEAD` nie uruchamia tego pliku. CI korzysta z tego skryptu, więc test nie chroni commitowanego buildu. Bieżący, niezacommitowany `package.json` już dopisuje ten plik; lokalny wynik 68/68 obejmuje go, ale ta poprawka nie należy do przeglądanych commitów.
- **Fix**: Dopilnować, aby robocza zmiana `package.json` dodająca `src/lib/garden-plan-snapshot.test.ts` została zacommitowana.
- **Decision**: FIXED — `package.json` dodaje `src/lib/garden-plan-snapshot.test.ts` do `test:unit`; staged’owano i zacommitowano wyłącznie ten plik w `f91f6cd`.

### F4 — Maksymalny wymiar przestrzeni może utworzyć niemal 20 tys. linii siatki

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality
- **Location**: `src/components/garden/garden-layout-diagram.ts:35`; `src/components/garden/GardenSetupForm.tsx:108`
- **Detail**: Siatka dodaje linię co 10 cm bez limitu liczby linii. Formularz dopuszcza wymiar 100 000 cm, co daje 9 999 linii na oś — 19 998 elementów SVG na jednym diagramie. Tak duży wpis może spowolnić renderowanie i interakcje, mimo że plan wymaga lekkiej warstwy siatki.
- **Fix**: Zachować odstęp 10 cm dla typowych grządek, ale zwiększać krok siatki dla dużych przestrzeni tak, by liczba linii SVG miała ustalony limit.
  - Strength: Chroni responsywność przy obecnie dopuszczalnych wymiarach bez zmiany współrzędnych roślin.
  - Tradeoff: Przy bardzo dużym widoku linie nie będą już dokładnie co 10 cm.
  - Confidence: HIGH — liczba linii wynika wprost z pętli siatki i limitu formularza.
  - Blind spot: Nie zmierzono czasu renderowania w przeglądarce przy maksymalnym wymiarze.
- **Decision**: FIXED — siatka używa wspólnego kroku co najmniej 10 cm dobranego do maksymalnego wymiaru, z limitem 100 linii na oś; dodano test dla przestrzeni 100 000 × 50 000 cm. Testy jednostkowe, ESLint i Prettier przechodzą.

### F5 — Tabela nazywa jednostki obsady „roślinami”, choć generator liczy pozycje

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Success Criteria
- **Location**: `src/components/garden/GardenLayoutView.tsx:466`; `context/changes/garden-crop-catalog-and-layout/research.md:88`
- **Detail**: `actualCount` oznacza liczbę pozycji sadzenia. Research mówi, że szczypiorek jest jedną kępą złożoną z kilku pędów i że procenty opisują jednostki końcowej obsady, nie liczbę pojedynczych pędów. Nagłówek „Rośliny” oraz pokazana liczba mogą więc być rozumiane jako liczba pojedynczych roślin.
- **Fix**: Nazwać kolumnę „Pozycje” lub „Jednostki obsady” i krótko wyjaśnić, że udział procentowy dotyczy miejsc/jednostek sadzenia, w tym kęp szczypiorku.
  - Strength: Dopasowuje UI do tego, co generator rzeczywiście liczy i co zapisano w researchu.
  - Tradeoff: Wymaga zmiany tekstu i ewentualnie objaśnienia w widoku.
  - Confidence: HIGH — katalog i research jawnie definiują szczypiorek jako kępę.
  - Blind spot: Nie weryfikowano, czy użytkownicy interpretują obecny nagłówek jako pojedyncze sztuki.
- **Decision**: FIXED — UI mówi teraz o „pozycjach obsady” i wyjaśnia, że udział liczy jednostki sadzenia (w tym całą kępę szczypiorku), nie pojedyncze pędy. ESLint i Prettier przechodzą.

═══════════════════════════════════════════════════════════
  OBSERVATION FINDINGS 🔹
═══════════════════════════════════════════════════════════

### F6 — Atlas miniaturek ma widoczne kolorowe pozostałości na krawędziach wycięć

- **Severity**: 🔹 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: `public/crops/crop-atlas.webp`
- **Detail**: W atlasie widać jaskrawozielone i czerwone obwódki oraz pojedyncze kolorowe piksele poza sylwetkami. Mogą odznaczać się przy miniaturach na neutralnym tle, choć nazwy roślin są poprawnie przypisane i użytkownik potwierdził ich zgodność.
- **Fix**: Przy okazji kolejnej korekty assetu oczyścić krawędzie wycięć i sprawdzić je na jasnym oraz ciemnym tle.
- **Decision**: SKIPPED — użytkownik potwierdził, że obwódki nie są widoczne w aplikacji; atlas pozostaje bez zmian.

## Verification

- `npm run test:unit` — PASS, 6 plików / 68 testów. Uruchomione na bieżącym roboczym drzewie; zawiera niezacommitowane zmiany w `package.json` i kodzie poza zakresem review.
- `npx astro check` — PASS, 53 pliki, 0 błędów, 0 ostrzeżeń.
- `npm run lint` — PASS.
- `npm run build` — PASS; Astro wypisał nieblokującą informację, że integracja sitemap pomija generowanie bez `site` w konfiguracji.
- `npm run smoke` — NOT RUN: lokalne środowisko Supabase/preview nie było dostępne.
- Po poprawce F1: `npx vitest run src/data/crop-catalog.test.ts` — PASS, 6 testów; `npx eslint src/data/crop-catalog.ts src/data/crop-catalog.test.ts` — PASS.
- Po poprawce F2: `node --check scripts/smoke.mjs`, `npx eslint scripts/smoke.mjs` i `npx prettier --check scripts/smoke.mjs` — PASS; pełny smoke nieuruchomiony bez lokalnego Supabase/preview.
- Po poprawce F4: `npx vitest run src/lib/garden-layout.test.ts` — PASS, 19 testów; ESLint i Prettier dla zmienionych plików — PASS.
- Po poprawce F5: ESLint i Prettier dla `src/components/garden/GardenLayoutView.tsx` — PASS.
- Końcowe `npm run test:unit` po triage — PASS, 6 plików / 69 testów; ESLint i Prettier dla snapshotu — PASS.
- Końcowe `npx astro check` — PASS, 53 pliki, 0 błędów, 0 ostrzeżeń; `npm run build` — PASS (nieblokująca informacja sitemap bez `site`).
- Testy ręczne: użytkownik potwierdził działanie kryteriów Phase 3.2 i 3.3 oraz odbiór widoku diagramu.

## Review scope notes

Reviewowane commity implementacji i odbioru: `d87e156`, `66f6b73`, `d8546b8`, `67327ca`, `2ea427a`. Istniejące niezacommitowane zmiany w innych zmianach oraz nakładające się edycje `package.json` i `scripts/smoke.mjs` nie zostały uznane za część tych commitów ani nadpisane. Przegląd statyczny był prowadzony względem `HEAD`; lokalne bramki jakości uruchomiono na bieżącym roboczym drzewie.
