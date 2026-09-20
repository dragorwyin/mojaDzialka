---
project: "MojaDziałka"
context_type: greenfield
product_type: web-app
target_scale:
  users: medium
created: 2026-09-19
updated: 2026-09-20
timeline_budget:
  mvp_weeks: 3
  hard_deadline: null
  after_hours_only: true
checkpoint:
  current_phase: 8
  phases_completed: [1, 2, 3, 4, 5, 6, 7]
  gray_areas_resolved:
    - topic: "context type"
      decision: "Greenfield — new product created from scratch; explicitly confirmed by the user."
    - topic: "problem and primary persona"
      decision: "Hobbyści z własnym warzywnikiem i ograniczonym czasem lub wiedzą mają trudność z zaplanowaniem roślin, proporcji i terminów; błędy mogą prowadzić do mniejszych zbiorów, zbędnych nasion, straty czasu oraz pustych miejsc."
    - topic: "product insight"
      decision: "Połączenie wymiarów skrzyń/sektorów, wybranych upraw i ich proporcji, sąsiedztwa, terminów prac i nasadzeń następczych w jednym planie sezonu z harmonogramem i przypomnieniami."
    - topic: "authentication"
      decision: "Każda osoba może samodzielnie założyć konto i logować się e-mailem oraz hasłem."
    - topic: "access model"
      decision: "Każde konto ma jedną prywatną działkę bez współdzielenia; administrator może blokować i przywracać konta, a zablokowana osoba nie ma dostępu do działki do czasu przywrócenia."
    - topic: "MVP flow and scope"
      decision: "MVP: użytkownik konfiguruje skrzynie/sektory, wybiera uprawy z ograniczonego ręcznie zweryfikowanego katalogu, podaje proporcje, przelicza i otrzymuje graficzne rozmieszczenie z konfliktami/wolnym miejscem oraz podstawowymi terminami siewu i rozsady."
    - topic: "timeline"
      decision: "Użytkownik uważa, że zawężony przepływ MVP da się zrealizować w 3 tygodnie pracy po godzinach."
    - topic: "secondary scope"
      decision: "Najważniejsza funkcja dodatkowa: zakładki wyłącznie dla tygodni z pracą lub zmianą układu, m.in. z propozycją uprawy wybranej wcześniej na miejsce po zbiorze; szczegółowe tooltipy są mile widziane, jeśli wystarczy czasu."
    - topic: "layout editing and recalculation"
      decision: "Użytkownik może zmieniać wymiary skrzyń, wybrane warzywa i proporcje przed ponownym przeliczeniem, ale nie może ręcznie przesuwać roślin w wyniku. Dodanie lub usunięcie skrzyni ostrzega o usunięciu obecnego układu i wymaga ponownego przeliczenia po zakończeniu zmian."
    - topic: "guardrails"
      decision: "Działka i plan pozostają prywatne na koncie; planer pokazuje konflikty i wolne miejsca zamiast je ukrywać."
    - topic: "plan persistence and season rollover"
      decision: "Bieżący plan pozostaje przypisany do konta, a przy kolejnym sezonie użytkownik sam decyduje, kiedy przeliczyć go ponownie. Nie wskazano dodatkowych wymagań pozafunkcjonalnych poza prywatnością i trwałością danych."
  frs_drafted: 11
  quality_check_status: accepted
---

# Shape Notes

## Seed Idea

Wieloosobowy planer warzywnika. Użytkownik definiuje działkę oraz dowolną liczbę skrzyń lub sektorów i ich wymiary, wybiera rośliny oraz określa ich orientacyjne proporcje. Aplikacja proponuje rozmieszczenie, uwzględniając wymagane odległości, dobre i złe sąsiedztwo oraz dostępną powierzchnię, pokazuje konflikty i wolne miejsca, a także tworzy podstawowe przypomnienia. MVP obejmuje jeden sezon i ograniczony, ręcznie zweryfikowany katalog roślin. Szczegóły zakresu zostały potwierdzone przez mentora.

## Vision & Problem Statement

Amator uprawiający warzywa dla siebie, który ma mało czasu na naukę i planowanie, przed sezonem musi zdecydować, co wysiać, kiedy przygotować rozsadę i jak rozmieścić rośliny w swoich skrzyniach lub sektorach. Dziś opiera się na intuicji lub poradnikach i może pomylić terminy albo zapomnieć o posiadanych nasionach, co prowadzi do mniejszych zbiorów, zbędnych zakupów, straty czasu oraz pustych lub zaniedbanych miejsc.

Planer łączy wybrane uprawy i ich orientacyjne proporcje z wymiarami skrzyń/sektorów, wymaganymi odległościami, dobrym i złym sąsiedztwem oraz terminami prac w jednym planie sezonu. Pokazuje proponowane rozmieszczenie i harmonogram w stylu Gantta, przypomina o przygotowaniu rozsady i sadzeniu, a po zbiorze uwzględnia kolejne warzywo w tym samym miejscu.

Reguła planowania pozostaje taka sama przy stukrotnie większej liczbie użytkowników; zmienia się jedynie potrzeba obsłużenia większego ruchu.

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

- FR-004: Użytkownik może wyszukiwać i wybierać warzywa z ograniczonego, ręcznie zweryfikowanego katalogu oraz podać liczbową proporcję dla każdego wybranego warzywa. Priority: must-have
  > Socrates: Rozważono, że sama liczba (np. „2”) może nie wyjaśniać, co proporcja oznacza w praktyce. Rozstrzygnięcie: wymaganie pozostaje, ponieważ użytkownik nie ma obecnie lepszego sposobu; znaczenie proporcji wymaga doprecyzowania.
- FR-005: Użytkownik może zmieniać wymiary skrzyń lub sektorów, wybór warzyw i ich proporcje; po zmianie danych otrzymuje ostrzeżenie, że układ wymaga ponownego przeliczenia; wynik aktualizuje się po kliknięciu „Przelicz”. Użytkownik nie może ręcznie zmieniać rozmieszczenia roślin w MVP. Priority: must-have
  > Socrates: Rozważono argument, że użytkownik może chcieć ręcznie poprawiać wygenerowany układ ze względu na własne warunki lub preferencje. Rozstrzygnięcie: ręczna edycja jest zbyt dużym zakresem na przyjęty termin; w MVP zostaje automatyczny układ, a zmiana danych ostrzega o konieczności ponownego przeliczenia.
- FR-006: Planer może wygenerować graficzną propozycję rozmieszczenia warzyw w skrzyniach lub sektorach, uwzględniając proporcje, wymagane odstępy, dobre i złe sąsiedztwo oraz dostępną powierzchnię. Gdy ograniczenia odstępów lub powierzchni uniemożliwią osiągnięcie proporcji, planer pokazuje tę rozbieżność jako konflikt. Priority: must-have
  > Socrates: Rozważono, że wymagania odstępów i dostępna powierzchnia mogą uniemożliwić realizację proporcji. Rozstrzygnięcie: wymaganie pozostaje z doprecyzowaniem, że planer ujawnia takie konflikty zamiast sugerować, że proporcje zostały w pełni spełnione.
- FR-007: Planer może informacyjnie pokazać konflikty oraz niewykorzystane miejsca w proponowanym układzie, bez konieczności podawania sposobu naprawy. Priority: must-have
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
- Nie wskazano innych wymagań pozafunkcjonalnych dla MVP.

## Business Logic

Planer podejmuje decyzję o rozmieszczeniu warzyw na cały sezon, również dając przypomnienia o terminach.

Wejściem są wymiary skrzyń lub sektorów oraz wybrane warzywa z ich liczbowymi proporcjami. Wynikiem jest propozycja rozmieszczenia i harmonogram prac na sezon, obejmujący przypomnienia o terminach.

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

1. **Jak planer ma interpretować liczbową proporcję roślin?** — Wartości typu „2” i „1” nie mają jeszcze określonego przełożenia na proponowany układ. Owner: użytkownik. Rozstrzygnąć przed ustaleniem reguł generowania planu.
2. **Co dzieje się z poprzednim planem po przeliczeniu kolejnego sezonu?** — Użytkownik podkreślił znaczenie prywatnej historii, ale nie ustalono, czy stare sezony mają być zachowane jako archiwum, czy zastępowane nowym planem. Owner: użytkownik.

## Quality cross-check

- Access Control: present.
- Business Logic: present as a one-sentence rule.
- Project artifacts: present with a valid checkpoint.
- Timeline-cost acknowledgment: present; the user accepted three weeks of after-hours work.
- Non-Goals: present.
- Preserved behavior: n/a (greenfield).
- Gaps: none identified.

## Forward: tech-stack

- Użytkownik woli unikać przechowywania danych wyłącznie w localStorage; plan ma pozostać prywatnie zachowany na koncie między sesjami.
