# Katalog warzyw i dane do planowania sezonu — Implementation Plan

## Overview

Celem jest dodanie pierwszego, źródłowo opisanego katalogu 30 warzyw oraz bezpiecznej warstwy odczytu dla przyszłego planera. Dane pozostaną statycznym, typowanym modułem TypeScript, a logika planera będzie korzystała z małego repository zamiast importować rekordy bezpośrednio.

Plan nie implementuje jeszcze graficznego układu warzywnika, interpretacji proporcji, prywatnych planów ani UI wyboru upraw. Te elementy wymagają osobnych zmian i nie są rozstrzygnięte przez research.

## Current State Analysis

- Badanie w context/changes/garden-crop-catalog-research/research.md zawiera 30 kandydatów, zakresy rozstaw, okna terminów dla Polski, źródła i ostrożne reguły sąsiedztwa.
- Statusy A/B w researchu opisują gotowość materiału do katalogu, nie popularność ani ranking jakości.
- Repozytorium nie ma jeszcze katalogu upraw, modułu danych ani consumerów katalogu.
- supabase/migrations/20260923203933_create_gardens.sql:1-29 definiuje wyłącznie prywatną tabelę gardens z FK do auth.users oraz RLS właściciela.
- supabase/config.toml włącza seed, ale wybrany zakres nie dodaje teraz seedów Supabase, ponieważ decyzja 2B wskazuje statyczny moduł TypeScript.
- src/pages/dashboard.astro:1-27 jest tylko ekranem powitalnym dla zalogowanego użytkownika; nie należy go rozszerzać w tej zmianie.
- package.json:5-15 zawiera build, lint, smoke i test:db, ale nie ma test runnera TypeScript.
- tsconfig.json:1-11 używa ścisłej konfiguracji Astro TypeScript i aliasu @/*.
- supabase/tests/gardens.test.sql:1-184 obejmuje granicę prywatności gardens; nie należy mieszać testów katalogu z testami RLS.

## Desired End State

W repozytorium istnieje statyczny, typowany katalog wszystkich 30 kandydatów. Każdy rekord ma stabilny identyfikator, polską nazwę, aliasy, dane rozstawy w centymetrach, okna terminów z trybem siewu lub rozsady, źródła, poziom pewności i flagi walidacji lokalnej.

Planner może korzystać z katalogu przez repository: pobrać listę w neutralnej kolejności, wyszukać po nazwie lub aliasie, pobrać rekord po ID i zapytać o relację sąsiedztwa. Brak udokumentowanej relacji zwraca unknown; żadna reguła sąsiedztwa nie jest twardym blokiem.

### Key Discoveries:

- Research wymaga okien terminów, a nie dokładnych dat dziennych, oraz odróżnienia siewu rozsady od wysadzenia.
- Rozstawy z S6 są zakresami referencyjnymi; oś wartości wymaga dalszej ręcznej kontroli, dlatego kontrakt musi przechowywać kontekst i flagę needs_local_validation.
- S2, S3 i S5 zawierają częściowo sprzeczne reguły sąsiedztwa; relacje muszą przechowywać confidence i conflict_note.
- WSU wskazuje, że popularne tablice companion planting bywają pozbawione wiarygodnych dowodów; brak wpisu nie może być interpretowany jako negatywna rekomendacja.
- Istniejący projekt nie ma test runnera TypeScript. Vitest jest właściwym, ograniczonym dodatkiem dla testów czystych funkcji i plików .test.ts; dokumentacja Vitest potwierdza transformację TypeScript przez Vite bez osobnego kompilatora testów.

## What We're NOT Doing

- Nie dodajemy tabel Supabase, migracji, seed.sql ani publicznego API katalogu.
- Nie modyfikujemy prywatnej tabeli gardens, jej RLS ani testów gardens.
- Nie modyfikujemy roadmap.md.
- Nie dodajemy UI, dashboardu, formularza wyboru warzyw ani endpointu HTTP.
- Nie implementujemy alokacji proporcji, rozmieszczania roślin, wykrywania konfliktów powierzchni ani graficznego układu.
- Nie tworzymy rankingu popularności, jakości, plonowania ani „najlepszych” par.
- Nie wyznaczamy regionalnych dat dziennych, prognoz pogody ani przypomnień.
- Nie przedstawiamy biodynamiki, faz Księżyca ani innych twierdzeń pseudonaukowych jako reguł produktu.
- Nie uzupełniamy braków domysłami: rekord z niepełnym dowodem zachowuje flagę niepewności lub unknown.

## Implementation Approach

Źródłem prawdy będzie statyczny moduł src/data/crop-catalog.ts z typami i danymi domenowymi. Zagnieżdżone sekcje pozwolą zachować wiele wariantów rozstaw, okien terminów i relacji bez spłaszczania sprzecznych źródeł.

Warstwa src/lib/crop-catalog.ts udostępni stabilny kontrakt odczytu. Będzie sortować neutralnie alfabetycznie, wyszukiwać po nazwach i aliasach oraz kanonizować parę roślin przy odczycie sąsiedztwa. Brak jawnej relacji oznaczy jako unknown.

Testy zostaną dodane przez Vitest. TypeScript będzie sprawdzany przez istniejącą konfigurację Astro, a pełna bramka jakości obejmie testy jednostkowe, lint i build. Dodanie Vitest jest ograniczone do testów katalogu i nie tworzy drugiego systemu testów dla SQL/RLS.

## Critical Implementation Details

### Data integrity

Walidacja katalogu musi wykonać się przed udostępnieniem eksportu danych i odrzucać rekordy z duplikatem ID, pustą nazwą, niepoprawnym zakresem liczbowym, nieznanym source_id, nieprawidłowym statusem relacji albo relacją rośliny z samą sobą. Walidacja nie może nadawać rankingu ani automatycznie podnosić confidence.

### Evidence boundary

Źródła S1–S12 i S14 z research.md są rejestrowane jako referencje. Context7/Supabase służyło do potwierdzenia granicy technicznej RLS, nie jako źródło ogrodnicze. Terminy pozostają oknami, a dane bez polskiej walidacji zachowują needs_local_validation.

### Repository boundary

Repository jest celowo lokalną abstrakcją nad modułem statycznym. Nie należy dodawać obietnicy kompatybilności z Supabase ani endpointu w tej zmianie; późniejsza migracja źródła może zachować ten sam kontrakt.

## Phase 1: Typy i źródłowy katalog

### Overview

Zdefiniować kontrakt danych i wprowadzić 30 rekordów zgodnych z research.md, bez dokładania niezweryfikowanych faktów.

### Changes Required:

#### 1. Typowany moduł katalogu

File: src/data/crop-catalog.ts

Intent: Utworzyć jedyne statyczne źródło danych referencyjnych dla 30 kandydatów, tak aby każdy rekord zachowywał kontekst, pochodzenie i niepewność zamiast jednej pozornie dokładnej wartości.

Contract: Moduł eksportuje typy i readonly katalog obejmujący:

- stabilne crop_id, common_name_pl i aliases;
- neutralny catalog_tier opisujący kompletność materiału, bez znaczenia rankingowego;
- zakresy spacing_in_row i row_spacing w centymetrach oraz spacing_context;
- sezonowe windows z month/week range, sowing_method i frost/temperature condition;
- source references z source_id, notą i confidence;
- relacje companion z canonical pair, status supported albo caution, rationale, source_ids i conflict_note;
- needs_local_validation dla rekordów z luką lub niejasnym kontekstem;
- jawne wartości unknown tam, gdzie research nie potwierdza relacji.

#### 2. Walidacja katalogu

File: src/data/crop-catalog.ts

Intent: Dodać czystą walidację uruchamianą przy budowie eksportu katalogu, żeby błędne rekordy nie przechodziły cicho do przyszłego planera.

Contract: Walidacja odrzuca duplikaty ID i aliasów w obrębie rekordu, puste nazwy, ujemne lub odwrócone zakresy, brak jednostki cm, nieznane source_id, niespójne okna terminów, samorelacje i duplikaty kanonicznych par. Walidacja nie odrzuca rekordu tylko dlatego, że ma low confidence lub needs_local_validation.

### Success Criteria:

#### Automated Verification:

- TypeScript/ Astro check przechodzi dla nowego modułu i wszystkich jego eksportów.
- Walidacja katalogu akceptuje dokładnie 30 unikalnych rekordów i odrzuca przykładowe niepoprawne zakresy, źródła oraz relacje.

#### Manual Verification:

- Przegląd próby obejmującej roślinę ciepłolubną, korzeniową, liściową, czosnek i relację sprzeczną między źródłami potwierdza obecność źródła, kontekstu i poziomu pewności.
- Lista nie jest sortowana według A/B, popularności, plonu ani rzekomej jakości.

## Phase 2: Repository odczytu katalogu

### Overview

Udostępnić mały, stabilny kontrakt do użycia przez przyszłe planowanie bez sprzęgania consumerów z kształtem statycznego modułu.

### Changes Required:

#### 1. Repository katalogu

File: src/lib/crop-catalog.ts

Intent: Odseparować logikę odczytu i wyszukiwania od danych, żeby późniejsza zmiana źródła na Supabase nie wymagała przepisywania planera.

Contract: Repository eksportuje operacje:

- listCrops(): zwraca wszystkie rekordy w neutralnej kolejności alfabetycznej po common_name_pl;
- getCropById(cropId): zwraca rekord albo undefined;
- searchCrops(query): dopasowuje case-insensitive i diacritic-insensitive common_name_pl oraz aliases;
- getCompanionRelation(firstCropId, secondCropId): kanonizuje parę i zwraca supported, caution albo unknown;
- brak publicznego sortowania po catalog_tier i brak funkcji rankingowej.

#### 2. Kontrakt braku danych

File: src/lib/crop-catalog.ts

Intent: Ujednolicić zachowanie dla par bez wystarczających dowodów i nie pozwolić, by brak rekordu został potraktowany jako zakaz.

Contract: Nieobecna para zwraca status unknown z informacją, że brak źródłowej reguły; jawne caution pozostaje sugestią/ostrzeżeniem, a nie hard_block. Płodozmian i ryzyko chorób pozostają osobnym typem relationship_type, nie są mieszane z pozytywnym companion planting.

### Success Criteria:

#### Automated Verification:

- TypeScript/ Astro check przechodzi dla repository i publicznego kontraktu.
- Repository zwraca wszystkie 30 rekordów, wyszukuje polskie nazwy i aliasy oraz zachowuje neutralne sortowanie.

#### Manual Verification:

- Odczyt pary znanej, ostrzegawczej i nieopisanej pokazuje odpowiednio supported/caution/unknown wraz z uzasadnieniem i źródłami.
- Zmiana implementacji danych na potrzeby testu nie wymaga zmian w kontrakcie repository; consumer nie importuje tablicy bezpośrednio.

## Phase 3: Testy i bramka jakości

### Overview

Dodać minimalne narzędzia testowe dla czystej logiki katalogu i zweryfikować całość bez uruchamiania nowego UI ani modyfikowania testów prywatności.

### Changes Required:

#### 1. Skrypt i zależność testowa

Files: package.json, package-lock.json

Intent: Dodać Vitest jako ograniczony test runner TypeScript oraz jednoznaczny skrypt test:unit.

Contract: package.json zawiera devDependency vitest i script test:unit uruchamiający Vitest w trybie jednorazowym. Lockfile jest aktualizowany wyłącznie jako wynik tej zależności. Nie dodawać testów przeglądarkowych ani snapshotów.

#### 2. Testy katalogu i repository

Files: src/data/crop-catalog.test.ts, src/lib/crop-catalog.test.ts

Intent: Zabezpieczyć reguły, które mają największe ryzyko cichego wypaczenia danych: liczność katalogu, źródła, neutralność, wyszukiwanie i unknown.

Contract: Testy obejmują:

- dokładnie 30 rekordów i unikalne crop_id;
- zakresy w cm oraz walidację błędnych danych;
- obecność source_ids i zachowanie needs_local_validation;
- wyszukiwanie nazw polskich, aliasów i różnic diakrytycznych;
- neutralne sortowanie niezależne od catalog_tier;
- kanonizację pary w obu kierunkach;
- statusy supported, caution i domyślny unknown;
- brak hard_block w obecnym modelu.

### Success Criteria:

#### Automated Verification:

- npm run test:unit przechodzi bez błędów.
- npm run lint przechodzi bez nowych ostrzeżeń lub błędów związanych z katalogiem.
- npm run build przechodzi z nowym modułem i testową zależnością.
- Istniejące supabase/tests/gardens.test.sql pozostaje niezmienione, a zakres diffu obejmuje tylko pliki katalogu, repository, testów i package manifestów.

#### Manual Verification:

- Przegląd test outputu i przykładowych rekordów potwierdza, że ostrzeżenia są opisowe, a nie blokujące.
- Przegląd ręczny potwierdza brak rankingu, brak pseudonaukowych twierdzeń i brak danych użytkownika w katalogu.
- Dashboard, auth i prywatna granica gardens nie zostały dotknięte.

## Testing Strategy

### Unit Tests

- Walidacja struktury 30 rekordów.
- Walidacja zakresów i referencji źródłowych.
- Wyszukiwanie po nazwie i aliasach z normalizacją wielkości liter oraz znaków diakrytycznych.
- Pobieranie po stabilnym ID.
- Neutralne sortowanie.
- Symetryczny odczyt relacji i domyślne unknown.

### Integration Tests

Nie dodawać jeszcze testu HTTP ani testu UI, ponieważ katalog nie ma w tej zmianie endpointu ani widoku. Integracja zostanie objęta późniejszym planem S-03/S-04.

### Manual Testing Steps

1. Uruchomić test:unit i sprawdzić wynik walidacji dokładnie 30 rekordów.
2. Sprawdzić wyszukiwanie dla nazwy z polskimi znakami, aliasu i zapytania bez diakrytyki.
3. Odczytać relację marchew–cebula, jedną relację caution oraz nieznaną parę i porównać status, źródła oraz notę.
4. Przejrzeć katalog pod kątem sortowania neutralnego i braku języka rankingowego.

## Performance Considerations

Katalog ma 30 rekordów, więc liniowe wyszukiwanie w pamięci jest wystarczające i prostsze niż indeks lub cache. Repository nie powinno wykonywać zapytań sieciowych ani zależeć od sesji użytkownika. Nie wprowadzać optymalizacji przed pojawieniem się rzeczywistego większego katalogu.

## Migration Notes

Brak migracji bazy i brak zmiany istniejących danych. Statyczny moduł jest świadomym rozwiązaniem MVP; późniejsza migracja do publicznych tabel Supabase może zachować kontrakt repository, ale nie należy jej projektować ani implementować w tej zmianie.

## References

- Research: context/changes/garden-crop-catalog-research/research.md
- Change identity: context/changes/garden-crop-catalog-research/change.md
- Product requirements: context/foundation/prd.md
- Existing private storage: supabase/migrations/20260923203933_create_gardens.sql:1-29
- Existing database tests: supabase/tests/gardens.test.sql:1-184
- Existing scripts and dependencies: package.json:5-15
- TypeScript configuration: tsconfig.json:1-11
- Current dashboard boundary: src/pages/dashboard.astro:1-27
- Vitest TypeScript guidance: Context7 library /vitest-dev/vitest

## Progress

> Convention: - [ ] pending, - [x] done. Append — commit SHA when a step lands. Do not rename step titles.

### Phase 1: Typy i źródłowy katalog

#### Automated

- [x] 1.1 TypeScript/ Astro check przechodzi dla nowego modułu i wszystkich jego eksportów. — 0a59697
- [x] 1.2 Walidacja katalogu akceptuje dokładnie 30 unikalnych rekordów i odrzuca przykładowe niepoprawne zakresy, źródła oraz relacje. — 0a59697

#### Manual

- [x] 1.3 Przegląd próby obejmującej roślinę ciepłolubną, korzeniową, liściową, czosnek i relację sprzeczną między źródłami potwierdza obecność źródła, kontekstu i poziomu pewności. — 0a59697
- [x] 1.4 Lista nie jest sortowana według A/B, popularności, plonu ani rzekomej jakości. — 0a59697

### Phase 2: Repository odczytu katalogu

#### Automated

- [x] 2.1 TypeScript/ Astro check przechodzi dla repository i publicznego kontraktu.
- [x] 2.2 Repository zwraca wszystkie 30 rekordów, wyszukuje polskie nazwy i aliasy oraz zachowuje neutralne sortowanie.

#### Manual

- [x] 2.3 Odczyt pary znanej, ostrzegawczej i nieopisanej pokazuje odpowiednio supported/caution/unknown wraz z uzasadnieniem i źródłami.
- [x] 2.4 Zmiana implementacji danych na potrzeby testu nie wymaga zmian w kontrakcie repository; consumer nie importuje tablicy bezpośrednio.

### Phase 3: Testy i bramka jakości

#### Automated

- [ ] 3.1 npm run test:unit przechodzi bez błędów.
- [ ] 3.2 npm run lint przechodzi bez nowych ostrzeżeń lub błędów związanych z katalogiem.
- [ ] 3.3 npm run build przechodzi z nowym modułem i testową zależnością.
- [ ] 3.4 Istniejące supabase/tests/gardens.test.sql pozostaje niezmienione, a zakres diffu obejmuje tylko pliki katalogu, repository, testów i package manifestów.

#### Manual

- [ ] 3.5 Przegląd test outputu i przykładowych rekordów potwierdza, że ostrzeżenia są opisowe, a nie blokujące.
- [ ] 3.6 Przegląd ręczny potwierdza brak rankingu, brak pseudonaukowych twierdzeń i brak danych użytkownika w katalogu.
- [ ] 3.7 Dashboard, auth i prywatna granica gardens nie zostały dotknięte.
