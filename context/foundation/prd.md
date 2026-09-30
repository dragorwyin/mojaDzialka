---
project: "MojaDziałka"
version: 1
status: draft
created: 2026-09-20
context_type: greenfield
product_type: web-app
target_scale:
  users: medium
  qps: "# TODO: qps — see Open Questions"
  data_volume: "# TODO: data_volume — see Open Questions"
timeline_budget:
  mvp_weeks: 3
  hard_deadline: null
  after_hours_only: true
---

## Vision & Problem Statement

Amator uprawiający warzywa dla siebie, który ma mało czasu na naukę i planowanie, przed sezonem musi zdecydować, co wysiać, kiedy przygotować rozsadę i jak rozmieścić rośliny w swoich skrzyniach lub sektorach. Dziś opiera się na intuicji lub poradnikach i może pomylić terminy albo zapomnieć o posiadanych nasionach, co prowadzi do mniejszych zbiorów, zbędnych zakupów, straty czasu oraz pustych lub zaniedbanych miejsc.

Planer łączy wybrane uprawy i ich orientacyjne proporcje z wymiarami skrzyń/sektorów, wymaganymi odległościami, dobrym i złym sąsiedztwem oraz terminami prac w jednym planie sezonu. Pokazuje proponowane rozmieszczenie i harmonogram w stylu Gantta, przypomina o przygotowaniu rozsady i sadzeniu, a po zbiorze uwzględnia kolejne warzywo w tym samym miejscu. Reguła planowania pozostaje taka sama przy stukrotnie większej liczbie użytkowników; zmienia się jedynie potrzeba obsłużenia większego ruchu.

## User & Persona

### Primary persona: Amator z własnym warzywnikiem

- **Rola:** osoba uprawiająca warzywa dla siebie, która chce mieć własne plony, ale ma mało czasu na dodatkową edukację i organizowanie upraw.
- **Kontekst:** planuje jeden sezon, dysponuje określonymi skrzyniami lub sektorami i kupionymi nasionami.
- **Moment:** wybiera warzywa i ich proporcje oraz ustala, gdzie i kiedy je wysiać, przygotować rozsadę, posadzić i czym obsadzić miejsce po zbiorze.

## Success Criteria

### Primary

- Użytkownik może na podstawie wymiarów swoich skrzyń/sektorów, wybranych warzyw i ich liczbowych proporcji wygenerować graficzny plan rozmieszczenia z uwzględnieniem wymaganych odstępów, sąsiedztwa i dostępnej powierzchni oraz otrzymać podstawowe terminy siewu i przygotowania rozsady.

### Secondary

- Najważniejszy dodatek, jeśli wystarczy czasu: tygodniowe zakładki pokazujące, jak rozmieszczenie zmienia się w sezonie.
- Dodatkowe mile widziane funkcje, jeśli wystarczy czasu: proponowanie kolejnej uprawy po zbiorze oraz szczegółowe tooltipy z instrukcjami rozsady i odstępów.

### Guardrails

- Dane działki i planu pozostają prywatne w ramach konta użytkownika.
- Planer nie ukrywa konfliktów ani niewykorzystanych miejsc.

## User Stories

### US-01: Amator planuje warzywnik na sezon

- **Given** zalogowany użytkownik ma zmierzone skrzynie lub sektory, w których uprawia warzywa.
- **When** podaje ich wymiary, wybiera warzywa i ich proporcje, a następnie klika „Przelicz”.
- **Then** po zakończeniu przeliczania otrzymuje graficzną propozycję rozmieszczenia, widzi konflikty i wolne miejsca oraz podstawowe terminy siewu i przygotowania rozsady.

#### Acceptance Criteria

- Propozycja uwzględnia podane wymiary skrzyń/sektorów, wybrane warzywa i ich proporcje.
- Propozycja pokazuje graficzny układ oraz konflikty i niewykorzystane miejsca.
- Użytkownik widzi podstawowe terminy siewu i przygotowania rozsady.

## Functional Requirements

### Accounts and garden

- FR-001: Każda osoba może samodzielnie założyć konto i logować się adresem e-mail oraz hasłem. Priority: must-have
  > Socrates: Rozważono kontrargument, że konto jest niepotrzebne, jeśli użytkownik i tak pracuje tylko w jednej krótkiej sesji. Rozstrzygnięcie: wymaganie pozostaje; użytkownik chce, by konto zachowywało prywatny plan między sesjami. Długoterminowa historia planów lub sezonów pozostaje do doprecyzowania.
- FR-002: Użytkownik może mieć jedną prywatną działkę na konto i zdefiniować w niej dowolną liczbę skrzyń lub sektorów wraz z ich wymiarami. Priority: must-have
  > Socrates: Rozważono kontrargument, że użytkownik może potrzebować kilku działek i przełączać je zakładkami. Rozstrzygnięcie: pozostaje jedna działka w MVP; kilka działek to możliwy zakres na później.
- FR-003: Użytkownik może dodawać i usuwać skrzynie lub sektory; po takiej zmianie planer ostrzega, że dotychczasowy układ zostanie usunięty, usuwa go i wymaga ponownego przeliczenia po zakończeniu zmian. Priority: must-have
  > Socrates: Rozważono ryzyko częściowego przeliczania planu, zwłaszcza przy proporcjach upraw. Rozstrzygnięcie: po kliknięciu „Przelicz” planer ponownie wyznacza cały układ na podstawie aktualnych danych i pokazuje nową propozycję dopiero po zakończeniu obliczeń; dodanie lub usunięcie skrzyni nadal czyści poprzedni układ i wymaga ponownego przeliczenia.

### Plant selection and plan generation

- FR-004: Użytkownik może wyszukiwać i wybierać warzywa z ograniczonego katalogu oraz podać docelowy procentowy udział każdego wybranego warzywa w łącznej liczbie roślin na całej działce. Udziały sumują się do 100%. Priority: must-have
  > Socrates: Rozważono, że sama liczba (np. „2”) może nie wyjaśniać, co proporcja oznacza w praktyce. Rozstrzygnięcie: procent określa docelowy udział liczby roślin danego gatunku w globalnym miksie działki, a nie udział powierzchni; planer pokazuje cel oddzielnie od osiągniętego wyniku.
- FR-005: Użytkownik może zmieniać wymiary skrzyń lub sektorów, wybór warzyw i ich proporcje; po zmianie danych otrzymuje ostrzeżenie, że układ wymaga ponownego przeliczenia; wynik aktualizuje się po kliknięciu „Przelicz”. Użytkownik nie może ręcznie zmieniać rozmieszczenia roślin w MVP. Priority: must-have
  > Socrates: Rozważono argument, że użytkownik może chcieć ręcznie poprawiać wygenerowany układ ze względu na własne warunki lub preferencje. Rozstrzygnięcie: ręczna edycja jest zbyt dużym zakresem na przyjęty termin; w MVP zostaje automatyczny układ, a zmiana danych ostrzega o konieczności ponownego przeliczenia.
- FR-006: Planer może wygenerować graficzną propozycję rozmieszczenia warzyw w skrzyniach lub sektorach na podstawie procentowych celów liczby roślin dla całej działki, wymaganych odstępów, sąsiedztwa i dostępnej powierzchni. Użytkownik nie przypisuje upraw ręcznie do skrzyń. Dobre sąsiedztwa są priorytetem przed dokładnością procentów; nieznane relacje są neutralne, `caution` jest miękkim kosztem, a tylko potwierdzona źródłowo relacja negatywna wyklucza sąsiadujące pozycje. Planer pokazuje cel i osiągnięty udział osobno, a gdy geometria uniemożliwia realizację celów — ujawnia rozbieżność jako konflikt. Priority: must-have
  > Socrates: Rozważono, że wymagania odstępów, sąsiedztwa i dostępna powierzchnia mogą uniemożliwić idealny miks. Rozstrzygnięcie: planer automatycznie wybiera najlepsze wykonalne rozmieszczenie, priorytetyzuje dobre sąsiedztwa względem dokładności procentów i jawnie raportuje osiągnięty wynik oraz ograniczenia.
- FR-007: Planer może informacyjnie pokazać konflikty oraz niewykorzystane miejsca w proponowanym układzie, bez konieczności podawania sposobu naprawy. Niewykorzystane miejsce jest konfliktem tylko wtedy, gdy geometria uniemożliwia realizację celów miksu; brak użytecznych danych o rozstawie jest osobnym, jawnym powodem częściowego wyniku. Priority: must-have
  > Socrates: Rozważono, że same ostrzeżenia mogą frustrować, jeśli nie podają sposobu poprawy. Rozstrzygnięcie: użytkownik chce, aby planer wskazywał problem informacyjnie; sugestie naprawy nie są wymagane.

### Sowing and seasonal schedule

- FR-008: Użytkownik może otrzymać podstawowe terminy siewu i przygotowania rozsady oraz przypomnienia o tych pracach dla warunków w Polsce; terminy są orientacyjne, a nie obietnicą dokładności co do dnia. Priority: must-have
  > Socrates: Rozważono, że zbyt ogólne terminy mogą zmniejszyć wartość przypomnień. Rozstrzygnięcie: wymaganie pozostaje; produkt w MVP obejmuje Polskę, a terminy mają być użytecznym przybliżeniem, nie dokładnym wskazaniem dnia.
- FR-009: Użytkownik może przeglądać zakładki tylko dla tygodni, w których przypada praca lub zmiana układu. Zakładka wskazuje, że prace (np. zbiór szczypiorku i posadzenie wybranej wcześniej rośliny w jego miejscu albo przygotowanie rozsady) należy wykonać w danym tygodniu, dając użytkownikowi tygodniowy zapas zamiast wymagać konkretnego dnia. Priority: nice-to-have
  > Socrates: Rozważono, że tygodniowy widok może sugerować zbyt dużą precyzję względem lokalnych warunków. Rozstrzygnięcie: widok ma dawać elastyczne okno działania w ciągu tygodnia, a nie wskazywać dokładny dzień; zakładki pojawiają się wyłącznie w tygodniach z pracą lub zmianą układu. Uprawa następcza jest wybierana spośród wcześniej wskazanych roślin.
- FR-010: Użytkownik może otworzyć szczegółowy tooltip z instrukcjami dotyczącymi rozsady i odstępów między roślinami, jeśli po ukończeniu podstawowego planowania zostanie czas. Priority: nice-to-have
  > Socrates: Rozważono, że dodatkowe tooltipy mogą odciągnąć czas od podstawowego układu i harmonogramu. Rozstrzygnięcie: pozostają funkcją o niższym priorytecie, realizowaną tylko po ukończeniu podstawowego planowania.

### Administration

- FR-011: Panel administracyjny może umożliwiać administratorowi blokowanie i przywracanie kont użytkowników. W podstawowym MVP obsługa może odbywać się poza aplikacją; panel z tą funkcją jest dodatkiem, jeśli wystarczy czasu. Priority: nice-to-have
  > Socrates: Rozważono, że panel administracyjny może opóźnić planer i początkowo blokowanie kont można obsługiwać poza aplikacją. Rozstrzygnięcie: panel z blokowaniem i przywracaniem kont jest dodatkiem do MVP; podstawowe planowanie ma pierwszeństwo.

## Non-Functional Requirements

- Dane działki i planu są prywatne i pozostają przypisane do konta użytkownika między sesjami.
- Aplikacja webowa dostosowuje widok do różnych rozmiarów ekranów.

## Business Logic

Planer podejmuje decyzję o rozmieszczeniu warzyw na cały sezon, również dając przypomnienia o terminach.

Wejściem są wymiary skrzyń lub sektorów oraz wybrane warzywa z docelowymi procentami liczby roślin, które opisują globalny miks całej działki. Planer maksymalizuje wykonalną obsadę, automatycznie wybiera pozycje na wszystkich skrzyniach/sektorach i preferuje potwierdzone dobre sąsiedztwa przed dokładnością udziałów. `unknown` pozostaje neutralne, `caution` jest miękkim kosztem, a tylko źródłowo potwierdzona negatywna relacja może wykluczyć sąsiadujące pozycje. Wynik pokazuje procenty docelowe i osiągnięte osobno, zachowuje pewność i etap roboczych rozstaw oraz jawnie wymienia uprawy bez użytecznych danych zamiast pomijać je po cichu. Wynikiem jest propozycja rozmieszczenia i harmonogram prac na sezon, obejmujący przypomnienia o terminach.

Katalog ma 31 uzgodnionych aktywnych pozycji; zachowuje ID `pomidor` dla Faworyta i osobne ID dla palikowanego pomidora koktajlowego, a fasola szparagowa i bób pozostają rozpoznawane wyłącznie jako stare zapisane wybory do jawnego usunięcia lub zamiany. Nieznane zapisane ID również nie mogą być po cichu pominięte. Dane końcowej obsady po przerywce lub sadzeniu są oddzielone od gęstości siewu i kalendarza; brak potwierdzonej końcowej rozstawy pozostaje brakiem danych, nigdy wartością zastępczą z siewu. Każda wartość zachowuje źródło, kontekst i pewność, a katalog nie jest rankingiem popularności. Procent opisuje udział jednostek końcowej obsady na całej działce (dla szczypiorku jednostką jest kępa), nie powierzchnię ani prognozowany plon.

Bieżący plan pozostaje przypisany do konta. Przy kolejnym sezonie użytkownik sam decyduje, kiedy ponownie go przeliczyć.

## Access Control

- Każda osoba może samodzielnie założyć konto i logować się adresem e-mail oraz hasłem.
- Każde konto ma jedną prywatną działkę; w MVP nie ma współdzielenia działki ani planu.
- Użytkownik uzyskuje dostęp do swojej działki po zalogowaniu.
- Administrator nie ma innych specjalnych uprawnień. Blokowanie i przywracanie kont w panelu administracyjnym jest dodatkiem; podstawowe MVP nie powinno od tego zależeć.
- Zablokowane konto nie ma dostępu do działki do czasu przywrócenia.

## Non-Goals

- W MVP konto obejmuje jedną prywatną działkę; wiele działek na konto i współdzielenie działek są poza zakresem, aby utrzymać prosty, indywidualny planer.
- Użytkownik nie przesuwa ręcznie roślin w wygenerowanym układzie; zmienia dane wejściowe i ponownie przelicza cały plan.
- Użytkownik nie tworzy własnych rekordów roślin; katalog pozostaje ograniczony do ręcznie zweryfikowanych pozycji.
- Plan nie obiecuje terminów co do dnia ani prognoz pogody; harmonogram wskazuje orientacyjne okna tygodniowe.
- Zakładki tygodniowe i nasadzenia następcze, szczegółowe tooltipy oraz panel administracyjny są dodatkami i nie mogą opóźniać podstawowego planowania.

## Open Questions

1. **Co dzieje się z poprzednim planem po przeliczeniu kolejnego sezonu?** — Użytkownik podkreślił znaczenie prywatnej historii, ale nie ustalono, czy stare sezony mają być zachowane jako archiwum, czy zastępowane nowym planem. Owner: użytkownik.
2. **Jaki jest oczekiwany ruch szczytowy (QPS)?** — Nie określono orientacyjnej liczby zapytań na sekundę. Owner: użytkownik.
3. **Jaka jest przewidywana wielkość danych?** — Nie określono orientacyjnej ilości przechowywanych danych. Owner: użytkownik.
