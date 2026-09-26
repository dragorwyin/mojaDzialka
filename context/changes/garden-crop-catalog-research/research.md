---
change_id: garden-crop-catalog-research
status: partial
date: 2026-09-26T22:44:20+02:00
git_commit: 07989d905a20eb1e513f33d162bf060bd943ad98
branch: detached
topic: "Katalog warzyw i dane do planowania sezonu"
---

# Research: katalog warzyw, terminy, rozstawy i sąsiedztwo

## Zakres i wniosek

Zweryfikowano 30 kandydatów do katalogu planera, orientacyjne rozstawy, okna siewu i sadzenia dla Polski oraz reguły sąsiedztwa. Wynik jest bazą źródłową do modelu danych, a nie rankingiem popularności, produktywności ani jakości upraw. Kandydaci zostali dobrani przez triangulację polskich źródeł praktycznych i edukacyjnych, źródeł produkcyjnych oraz literatury o ogrodach działkowych.

Reguły sąsiedztwa należy przechowywać jako wskazówki o poziomie pewności, nie jako zakazy. Przegląd WSU ostrzega, że popularne tabele companion planting często nie mają wiarygodnego oparcia; wyjątkiem są niektóre mechanizmy intercroppingu, różnorodności i roślin pułapkowych. Nie ma podstaw do generowania globalnego rankingu par.

## Stan lokalnego repozytorium

- supabase/migrations/20260923203933_create_gardens.sql: tabela gardens ma jeden rekord na użytkownika, FK do auth.users i RLS ograniczające dostęp do właściciela.
- supabase/config.toml: seed jest włączony, ale w sprawdzonym drzewie nie znaleziono supabase/seed.sql.
- src/pages/dashboard.astro: obecnie tylko dashboard powitalny i wylogowanie; katalog nie jest jeszcze zaimplementowany.
- PRD wymaga katalogu, rozstaw, sąsiedztwa i przybliżonego polskiego harmonogramu, bez obietnicy dokładnych dat dziennych.
- Roadmapa wskazuje research katalogu jako blocker S-03, alokację proporcji jako nierozstrzygnięte S-04, a adjudykację źródeł harmonogramu jako S-06.

Wniosek implementacyjny: katalog i dane referencyjne mogą być publiczne, natomiast notatki użytkownika i plan ogrodu powinny pozostać właścicielskie. Aktualne migracje Supabase wspierają taki podział przez FK, RLS i polityki oparte na auth.uid(); to jest kontekst techniczny, nie wynik domenowego rankingu.

## Zweryfikowany katalog 30 kandydatów

Status oznacza przydatność do pierwszego katalogu, nie popularność. A = mocny kandydat na start; B = przydatny, ale wymaga większej ostrożności kontekstowej. Każdy rekord powinien mieć źródło, jednostkę i poziom pewności.

| # | Kandydat | Status | Uzasadnienie źródłowe |
|---:|---|:---:|---|
| 1 | pomidor | A | S1: najczęściej wymieniany w badaniu działkowców; S4/S5: ważny gatunek produkcyjny |
| 2 | ogórek | A | S1: jedna z najczęściej uprawianych grup; S4/S5: ważny gatunek polowy |
| 3 | fasola zwykła | A | S1: string beans wśród najważniejszych; S2/S7: praktyczne terminy |
| 4 | pietruszka korzeniowa/naciowa | A | S1: wśród najważniejszych; S4/S6: katalog i rozstawa |
| 5 | marchew | A | S2/S4/S5/S6: częsta uprawa i bezpośredni siew |
| 6 | cebula | A | S4/S5/S6/S7: ważna produkcyjnie i ogrodowo |
| 7 | burak ćwikłowy | A | S2/S4/S6/S7: częsty i dobrze opisany terminowo |
| 8 | rzodkiewka | A | S2/S4/S6/S7: krótki cykl, marker rzędów i dobry kandydat do planera |
| 9 | sałata | A | S2/S4/S6/S7: szeroko uprawiana i dobrze opisana |
| 10 | kapusta biała | A | S4/S5/S6/S7: ważna grupa produkcyjna |
| 11 | kalafior | A | S4/S5/S6/S7: polski katalog i terminy |
| 12 | brokuł | A | S4/S5/S6/S7: katalog i terminy rozsady |
| 13 | kalarepa | A | S4/S6/S7: katalog i szybka uprawa |
| 14 | jarmuż | A | S4/S6/S7: tolerancja chłodu i terminowanie |
| 15 | groch | A | S2/S4/S6/S7: bezpośredni siew i wczesne okno |
| 16 | bób | A | S2/S4/S6/S7: typowa uprawa wczesna |
| 17 | cukinia | A | S2/S4/S5/S6/S7: częsta uprawa, wymaga ciepła |
| 18 | dynia | A | S4/S6/S7: uprawa ciepłolubna o dużym rozstawie |
| 19 | papryka | A | S4/S5/S6/S7: uprawa z rozsady, ważna w Polsce |
| 20 | por | A | S4/S6/S7: katalog i termin rozsady/sadzenia |
| 21 | szpinak | A | S4/S6/S7/S10: chłodoodporny, dobry do okien wczesnych |
| 22 | seler | B | S4/S6/S7: katalog i terminy, ale wymaga rozsady i dłuższego sezonu |
| 23 | kukurydza cukrowa | B | S4/S5/S6/S9: termin ciepłolubny i rozstaw rzędowa |
| 24 | czosnek | A | S6/S8: wyraźne terminy jesienne/wiosenne i rozstawa |
| 25 | pasternak | B | S4/S6: dobrze pasuje do grupy korzeniowych, mniej danych popularności |
| 26 | rukola | B | S4/S6/S9: szybki liściowy kandydat, ale mniejsza pewność popularności |
| 27 | roszponka | B | S4/S7: katalog i okno chłodne; mniej danych o działkach |
| 28 | bakłażan | B | S6/S9: uprawa z rozsady i duża zależność od ciepła |
| 29 | rzepa | B | S4: gatunek katalogowy, ale słabsze pokrycie terminów/rozstawy w zebranych źródłach |
| 30 | ziemniak | B | S10 i kontekst produkcyjny: istotny ogrodowo, lecz brak polskiej tabeli rozstawy w tym researchu |

### Jak interpretować listę

S1 opisuje 46 działkowców w trzech polskich miastach w 2009 r.; wskazuje pomidory, ogórki, fasolę szparagową i pietruszkę, ale nie jest aktualnym sondażem całej Polski ani rankingiem top 30. S4/S5 opisują znaczenie produkcyjne, a nie preferencje działkowców. S14 COBORU potwierdza obecność wielu gatunków w badaniach odmianowych, ale także nie mierzy popularności. Z tych powodów aplikacja powinna pokazywać katalog kandydatów bez kolejności rankingowej.

## Rozstawy

Najpełniejsza polska tabela praktyczna w zebranym materiale to S6. Jej wartości są punktem wyjścia, a nie uniwersalnym zaleceniem: odmiana, sposób prowadzenia, żyzność gleby, podlewanie i przeznaczenie plonu zmieniają potrzebną przestrzeń. Źródło publikuje pary wartości, ale bez dostatecznie jednoznacznego opisu osi; przed seedem danych trzeba wizualnie sprawdzić PDF i nazwać pola jako rozstawa w rzędzie oraz między rzędami dopiero po tej kontroli.

| Gatunek lub grupa | Rozstawa z S6 | Uwaga do modelu |
|---|---|---|
| pomidor wysoki | 80 x 50 cm | zależy od podpory; S10 dla vining tomato podaje 60–90 cm w obu kierunkach |
| pomidor niski | 40–60 x 30–50 cm | wariant odmianowy |
| ogórek | 10 x 135 cm | rozstaw silnie zależny od prowadzenia |
| cukinia | 80 x 80 cm | potrzebuje dużej powierzchni |
| dynia | 100 x 150 cm | bardzo duża przestrzeń |
| papryka | 40–60 x 30–50 cm | zwykle z rozsady |
| bakłażan | 50–60 x 40–50 cm | ciepłolubny, z rozsady |
| marchew | 5 x 20–30 cm | po wschodach wymaga przerywki |
| pietruszka korzeniowa | 4–6 x 30–40 cm | bezpośredni siew |
| pasternak | 20 x 30 cm | tabela S6; wymaga potwierdzenia odmiany |
| burak | 5–7 x 30–50 cm | zależnie od zbioru młodego/korzeni |
| cebula | 5–8 x 30–40 cm | typ i sposób uprawy zmienia rozstaw |
| czosnek | 8–12 cm w rzędzie, 20–25 cm między rzędami | S8, osobny polski materiał |
| fasola zwykła | 10 x 40–50 cm | forma karłowa/pnąca wymaga osobnego wariantu |
| groch | 25 x 50 cm | podpora i odmiana mogą zmienić układ |
| bób | 40 x 20 cm | S6 |
| kapusta | 40 x 40 cm | grupa odmianowa, nie jeden sztywny parametr |
| kalafior | 40 x 40 cm | termin i odmiana mają znaczenie |
| brokuł | 50 x 50 cm | S6; S10 podaje ok. 30–45 cm w rzędzie |
| kalarepa | 20 x 30 cm | S6 |
| jarmuż | 50 x 40–50 cm | duży pokrój dojrzałej rośliny |
| sałata | 20–25 x 15–20 cm | zbiór główek vs baby leaf |
| rukola | 15 x 15 cm | szybki zbiór liści |
| rzodkiewka | 10 x 15 cm | S6; S10 rozróżnia siew gęsty i rzodkiew na przechowanie |
| szpinak | 3 x 15 cm | S6 podaje gęsty siew; S10 używa liczby nasion na stopę |
| por | 5–10 x 30–50 cm | głębokość sadzenia to osobna cecha |
| seler | 50–60 x 30–40 cm | rozsada, długi sezon |
| kukurydza cukrowa | 50 x 25–30 cm | układ blokowy poprawia zapylenie |
| ziemniak | brak zweryfikowanej polskiej wartości w S6 | nie seedować bez dodatkowej lokalnej walidacji |

S10 daje niezależny sanity check z University of Minnesota, ale nie jest kalendarzem ani normą dla Polski: marchew 5–10 cm po przerywce, brokuł/kapusta/kalafior ok. 30–45 cm, ogórek polowy ok. 30–35 cm, papryka ok. 35–45 cm, cukinia ok. 45 cm, pomidor polowy ok. 45–60 cm, czosnek ok. 15–20 cm, fasola karłowa ok. 2.5–7.5 cm w rzędzie i groch ok. 10–15 cm. Różnice względem S6 pokazują, że seed powinien przechowywać zakres i kontekst, nie jedną liczbę.

Proponowane pola danych:

- crop_id, common_name_pl, aliases;
- spacing_in_row_min_cm, spacing_in_row_max_cm;
- row_spacing_min_cm, row_spacing_max_cm;
- spacing_context: odmiana, pokrój, podpora, zbiór młody lub dojrzały;
- source_id, source_quote_or_note, confidence;
- needs_local_validation: true dla rekordów bez polskiej wartości lub z niejasnymi osiami.

## Terminy dla Polski

Nie należy zapisywać jednego terminu dziennego dla całej Polski. Źródła i warunki uzasadniają okna względne: miesiąc, zakres tygodni, po ostatnich przymrozkach, temperatura gleby i tryb rozsada/siew bezpośredni. S7 jest najnowszym polskim źródłem terminów produkcyjnych w zebranym materiale; S6 jest użytecznym kalendarzem działkowym; S2/S3 i S9 pomagają opisać warunki.

| Grupa | Okno robocze dla Polski | Tryb i warunek |
|---|---|---|
| bób | połowa marca–kwiecień | siew wczesny; toleruje chłód |
| groch | marzec–kwiecień | siew bezpośredni |
| szpinak, rukola, rzodkiewka, sałata | wczesna wiosna i kolejne siewy do lata; roszponka także późne lato/jesień | chłodoodporne, okno zależne od odmiany |
| marchew, pietruszka, pasternak | marzec–czerwiec | siew bezpośredni; wolne wschody i przerywka |
| cebula | marzec–kwiecień | siew, dymka lub rozsada zależnie od produktu |
| burak | kwiecień–czerwiec | gleba ogrzana; kolejne siewy możliwe |
| kapusta, brokuł, kalafior, kalarepa, jarmuż | rozsada od marca/kwietnia, sadzenie zwykle kwiecień–czerwiec | wariant wczesny/późny i odporność na chłód |
| por, seler | rozsada wiosenna, sadzenie późną wiosną–latem | długi sezon |
| fasola zwykła | maj–lipiec | po ryzyku przymrozków; ciepła gleba |
| ogórek | rozsada w kwietniu, siew/sadzenie od maja | po przymrozkach; bardzo wrażliwy na chłód |
| cukinia, dynia | rozsada w kwietniu, siew/sadzenie od połowy maja | ciepłolubne; duży rozstaw |
| pomidor, papryka, bakłażan | rozsada; sadzenie zwykle po połowie maja, lokalnie później | nie traktować kwietniowego wysiewu jako terminu gruntu |
| kukurydza cukrowa | od połowy maja | ciepła gleba; lepiej sadzić w bloku |
| czosnek zimowy | połowa września–koniec października | termin zależny od pogody; czosnek wiosenny wczesną wiosną |
| ziemniak | brak finalnego okna w tym researchu | do uzupełnienia lokalnym źródłem przed seedem |

Najważniejsze reguły bezpieczeństwa harmonogramu:

1. Dla pomidora, papryki, bakłażana, ogórka, cukinii i dyni rozróżniać datę siewu rozsady od daty wysadzenia.
2. Stosować warunek po ostatnich przymrozkach dla roślin ciepłolubnych; data 15 maja jest praktycznym skrótem, nie gwarancją klimatyczną.
3. W przyszłości parametr regionu powinien korygować okno, ale obecny zakres nie uzasadnia budowy mapy mikroklimatu.
4. S7 opisuje produkcję polową, więc dla działki należy traktować terminy jako okna referencyjne i zachować informację o kontekście źródła.

## Sąsiedztwo i płodozmian

W katalogu nie ma twardej listy dobrych i złych sąsiadów. Reguła produktu powinna być trójwartościowa: supported, caution, unknown, z opcjonalną notą mechanizmu i źródłem.

### Wzorce względnie użyteczne

- marchew + cebula: S2 i S3 opisują potencjalne ograniczanie presji połyśnicy marchwianki i śmietki cebulanki; przechowywać jako advisory, nie gwarancję;
- marchew/pietruszka + rzodkiewka: rzodkiewka może oznaczać rząd i pozwalać na wcześniejszy zbiór; to korzyść przestrzenna/organizacyjna, nie dowód wzrostu plonu;
- różnorodność roślin i siedliska dla organizmów pożytecznych: S11 wspiera tę ogólną zasadę, ale efekt zależy od układu i presji szkodników;
- rośliny pułapkowe oraz niektóre układy ziół przy kapustnych/pomidorach: S11 podaje przykłady z ograniczonym zakresem badań; nie uogólniać na każdy ogród;
- Three Sisters: ma funkcjonalne wyjaśnienie podpory, okrywy i wykorzystania przestrzeni, lecz S12 nie potwierdza uniwersalnego wzrostu produktywności lub jakości gleby.

### Wzorce ostrzegawcze, nie zakazy

S2/S3 wymieniają między innymi unikanie bezpośredniego sąsiedztwa cebuli/czosnku z fasolą, pomidora z ziemniakiem oraz niektórych kombinacji pomidor–ogórek, pomidor–papryka i kapustnych z pomidorem. S5 wskazuje na znaczenie przerwy w uprawie roślin psiankowatych i ryzyko wspólnych chorób przy sąsiedztwie pomidora i ziemniaka. S5 zawiera też przykłady pozytywne i negatywne sprzeczne z S2, dlatego te pary muszą mieć niską pewność i objaśnienie konfliktu źródeł.

Silniejszą regułą niż companion planting jest płodozmian: S3 i S5 uzasadniają zmianę rodziny botanicznej, głębokości korzeni i zapotrzebowania pokarmowego; dla psiankowatych S5 podaje nawet 4–5 lat przerwy w kontekście produkcyjnym. To należy modelować jako rotation_warning, odrębnie od sąsiedztwa.

### Pseudonauka

S3 przywołuje kalendarz biodynamiczny jako praktykę, ale nie stanowi to dowodu agronomicznego. Nie używać faz Księżyca, „energii” roślin ani biodynamiki do wyznaczania terminów lub rankingu sąsiadów. Jeśli użytkownik kiedyś zażąda takiej funkcji, należy ją oznaczyć jako tradycję/eksperyment, nie jako rekomendację opartą na dowodach.

Proponowane pola:

- companion_status: supported, caution, unknown;
- relationship_type: space_saving, pest_management, habitat, rotation, disease_risk, folklore;
- confidence: high, medium, low;
- source_ids, rationale, conflict_note;
- applies_to: plant_pair, family_pair, or rotation_group;
- hard_block: false dla wszystkich reguł sąsiedztwa z obecnego researchu.

## Źródła

- S1 — [Journal of Ethnobiology, Polish allotment gardeners](https://journals.sagepub.com/doi/full/10.2993/0278-0771-38.1.123), badanie etnobotaniczne działkowców, 46 osób, trzy miasta, 2009.
- S2 — [WODR: Warzywa w przydomowym ogrodku](https://www.wodr.poznan.pl/doradztwo/rozwoj-obszarow-wiejskich/warzywa-w-przydomowym-ogrodku-jakie-wybrac-i-jak-o-nie-zadbac), praktyczne gatunki, terminy i przykłady sąsiedztwa.
- S3 — [WODR: Ekologiczna uprawa warzyw](https://www.wodr.poznan.pl/doradztwo/produkcja-roslinna/ekologiczna-uprawa-warzyw), płodozmian, grupy roślin, uwagi o sąsiedztwie.
- S4 — [ZPE: przygotowanie terenu pod rośliny warzywne i przyprawowe](https://zpe.gov.pl/a/wybor-i-przygotowanie-terenu-pod-uprawe-roslin-warzywnych-i-przyprawowych/DnOKx7CLp), polski materiał edukacyjny i lista gatunków.
- S5 — [CDR: Papryka i warzywa polowe](https://www.cdr.gov.pl/images/Radom/2017/11-12/cdr_papryka_poprawka_2.pdf), kontekst produkcyjny, rozsada, terminy i fitosanitarna ostrożność.
- S6 — [ROD Czapla: Terminarz siewu warzyw](http://rodczaplaznin.com.pl/rozne-dokumenty/terminarze-siewu/termin-siewu-warzyw.pdf), tabela działkowa terminów i rozstaw.
- S7 — [SODR: Warzywa gruntowe — ilości i terminy](https://www.sodr.pl/main/aktualnosci/Warzywa-gruntowe-ilosci-i-terminy/idn:4111), aktualny polski materiał terminowy z 2026 r.
- S8 — [SODR: Pora na sadzenie czosnku](https://www.sodr.pl/pliki/Pora-na-sadzenie-czosnku--Malgorzata-Milek,814.pdf), termin i rozstawa czosnku.
- S9 — [COMPO: Kalendarz wysiewu](https://www.compo.pl/doradca/pielegnacja-roslin/prawidlowe-sadzenie-roslin/kalendarz-wysiewu), pomocnicze okna siewu i rozróżnienie roślin ciepłolubnych.
- S10 — [University of Minnesota Extension: Crop and field planning tools](https://extension.umn.edu/vegetable-growing-guides-farmers/crop-and-field-planning-tools-vegetable-farmers), niezależny sanity check rozstaw i grup temperaturowych; nie kalendarz polski.
- S11 — [University of Minnesota Extension: Companion planting](https://extension.umn.edu/gardening-minnesota/companion-planting-home-gardens), ograniczone przykłady oparte na badaniach i ostrzeżenie przed listami internetowymi.
- S12 — [Washington State University: Gardening with companion plants](https://pubs.extension.wsu.edu/product/gardening-with-companion-plants-home-garden-series/), krytyka nieudokumentowanych tabel i rozróżnienie folkloru od intercroppingu.
- S14 — [COBORU: Wyniki PDO rośliny warzywne 2024](https://coboru.gov.pl/Publikacje_COBORU/Wyniki_PDO/WPDO_222_rosliny_warzywne_2024.pdf), obecność gatunków w badaniach odmianowych; nie ranking popularności.
- Context7 — [Supabase documentation](https://supabase.com/docs), użyte tylko do potwierdzenia aktualnych wzorców migracji, FK i RLS; nie jest źródłem danych ogrodniczych.

## Model pewności i brakujące dowody

Minimalna pewność rekordu: source-backed, source_context, confidence, last_verified_at. Dla terminów dodatkowo sowing_method, hardiness_or_frost_condition i region_scope. Dla rozstaw dodatkowo axis_verified i spacing_context.

Pozostałe luki w obecnym zakresie:

- brak reprezentatywnego, aktualnego polskiego rankingu popularności całej trzydziestki; lista pozostaje katalogiem kandydatów bez rankingu;
- S6 wymaga ręcznej kontroli osi rozstawy przed seedem; ziemniak nie ma jeszcze polskiej zweryfikowanej wartości;
- brak kalibracji terminów do województwa, wysokości i mikroklimatu; obecne okna są ogólnopolskie i orientacyjne;
- brak wystarczająco mocnych danych, by większość reguł sąsiedztwa podnieść ponad low/medium confidence; konflikty S2/S3/S5 muszą pozostać widoczne;
- brak osobnych danych o odmianach, prowadzeniu na podporach, uprawie w tunelu i zbiorze baby leaf;
- S1 jest wartościowym źródłem etnobotanicznym, ale mały i historyczny zakres nie pozwala ekstrapolować na całą Polskę;
- COBORU i materiały produkcyjne potwierdzają obecność/znaczenie upraw, lecz nie zastępują ankiety działkowców;
- nie wykonywano testów implementacyjnych, ponieważ użytkownik ograniczył zmiany do research.md.

## Rekomendacja do dalszego planowania

Następny plan powinien użyć 30 rekordów jako seed katalogu bez sortowania po „najlepszości”, przechowywać zakresy i kontekst rozstaw, generować terminy jako okna z warunkami pogodowymi oraz pokazywać sąsiedztwo jako wyjaśnione sugestie. Pary bez solidnego dowodu powinny pozostać unknown. Przed implementacją seedów trzeba domknąć ręczną interpretację osi S6 i osobno zdecydować, czy dołączyć lokalne źródło dla ziemniaka.
