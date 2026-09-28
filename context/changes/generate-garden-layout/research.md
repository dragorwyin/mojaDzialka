---
date: 2026-09-28T12:01:53+02:00
researcher: Codex
git_commit: a51414ff3c6ffbca3fd9e4550b3da336afdf9c91
branch: main
repository: mojaDzialka
topic: "S-04: proporcje, rozstawy i sąsiedztwo w układzie warzywnika"
tags: [research, S-04, garden-layout, crop-catalog]
status: partial
last_updated: 2026-09-28
last_updated_by: Codex
---

# Research: S-04 — proporcje, rozstawy i sąsiedztwo

**Date:** 2026-09-28T12:01:53+02:00  
**Researcher:** Codex  
**Git commit:** a51414ff3c6ffbca3fd9e4550b3da336afdf9c91  
**Branch:** main  
**Repository:** mojaDzialka

## Research question

Jak przełożyć wybrane przez użytkownika proporcje na wykonalny układ całej działki, nie przypisując proporcji do konkretnej grządki; jak wykorzystać relacje sąsiedztwa przy wyborze grządek; oraz które lokalne rozstawy i osie są potwierdzone, szczególnie dla ziemniaka?

## Summary

- Zakres proporcji jest ustalony: wartości dotyczą całej działki, a algorytm ma dobrać grządki z uwzględnieniem sąsiedztwa. Nadal nie ma decyzji, czy liczba oznacza udział powierzchni, liczbę roślin czy wagę priorytetu. PRD pozostawia tę interpretację otwartą, a zapis S-03 przechowuje wyłącznie dodatnią liczbę ([PRD:129](../../foundation/prd.md#L129), [brief S-03:25](../../archive/2026-09-27-select-crops-and-proportions/plan-brief.md#L25), decyzja użytkownika w bieżącym wątku).
- Nie należy przypisywać osi parom S6: źródłowa tabela nazywa kolumnę jedynie „Rozstawa w cm”. W aktualnym katalogu 26 z 30 rekordów używa niezweryfikowanej pary liczb, 1 rekord ma osobne zweryfikowane osie, a 3 mają brak rozstawy ([S6](http://rodczaplaznin.com.pl/rozne-dokumenty/terminarze-siewu/termin-siewu-warzyw.pdf), [crop-catalog.ts:145](../../../src/data/crop-catalog.ts#L145), [crop-catalog.ts:161](../../../src/data/crop-catalog.ts#L161), [crop-catalog.ts:647](../../../src/data/crop-catalog.ts#L647), [crop-catalog.ts:674](../../../src/data/crop-catalog.ts#L674), [crop-catalog.ts:687](../../../src/data/crop-catalog.ts#L687)).
- Dla ziemniaka znaleziono polskie źródło działkowe z wyraźnie opisanym rozstawem oraz niezależne doświadczenie IHAR z opisanymi osiami, ale ich konteksty i wartości nie uzasadniają jednej uniwersalnej pary. Rzepa i roszponka nadal nie mają potwierdzonej polskiej pary osi w zbadanych źródłach ([Atlas roślin](https://atlas-roslin.pl/gatunki/Solanum_tuberosum.htm), [IHAR, 2002](https://doi.org/10.37317/biul-2002-0036), [S6](http://rodczaplaznin.com.pl/rozne-dokumenty/terminarze-siewu/termin-siewu-warzyw.pdf)).
- Kierunek do planu: zinterpretować proporcje jako docelowy udział użytecznej powierzchni całej działki, a liczbę roślin wyliczać z jawnie zweryfikowanej rozstawy; to rekomendacja produktowa, nie ustalenie wynikające ze źródeł. Relacje sąsiedztwa powinny wpływać na wybór rozmieszczenia lub generować ostrzeżenie, nie stanowić zakazu. Dokładnego promienia sąsiedztwa bieżący katalog nie opisuje ([PRD:79](../../foundation/prd.md#L79), [crop-catalog.ts:22](../../../src/data/crop-catalog.ts#L22), [crop-catalog.ts:53](../../../src/data/crop-catalog.ts#L53), [crop-catalog.ts:883](../../../src/data/crop-catalog.ts#L883)).

## Detailed findings

### 1. Kontrakt produktu i znaczenie proporcji

- W PRD proporcja jest liczbowym wejściem, ale jej znaczenie pozostaje otwarte; decyzja użytkownika obejmuje natomiast zakres całej działki, nie pojedynczej grządki ([PRD:75–80](../../foundation/prd.md#L75), [PRD:129](../../foundation/prd.md#L129), decyzja użytkownika w bieżącym wątku).
- W zweryfikowanym kodzie walidator wymaga znanego crop ID, braku duplikatu i dodatniej skończonej liczby. Nie normalizuje wartości ani nie przypisuje jej jednostki ([garden-crop-selection.ts:8](../../../src/lib/garden-crop-selection.ts#L8), [garden-crop-selection.ts:21](../../../src/lib/garden-crop-selection.ts#L21), [garden-crop-selection.ts:23](../../../src/lib/garden-crop-selection.ts#L23)). Formularz przygotowuje proporcję razem z crop ID ([CropSelectionForm.tsx:130](../../../src/components/garden/CropSelectionForm.tsx#L130)).
- Dla wartości 3 i 1, jeśli traktujemy je jako wagi dowolnej wybranej wielkości, normalizacja daje 75% i 25% tej wielkości. Nie rozstrzyga to, czy jednostką ma być powierzchnia czy liczba roślin; te dwa warianty dadzą różne rozmieszczenie przy różnych rozstawach ([PRD:129](../../foundation/prd.md#L129)).
- **Rekomendacja (wniosek do zatwierdzenia):** opisać proporcję jako względny udział użytecznej powierzchni uprawnej całej działki. Jest to zgodne z wymaganiem uwzględnienia dostępnej powierzchni i rozstaw oraz z ustaleniem, że algorytm wybiera grządki. Z udziału powierzchni wyznaczać osiągalną liczbę roślin; nie obiecywać udziału plonu, ponieważ zgromadzone dane nie definiują porównywalnych plonów dla wszystkich gatunków.
- Przy takiej interpretacji algorytm powinien najpierw policzyć docelowe udziały całej dostępnej powierzchni, potem dopasować dyskretne rośliny do wymiarów wszystkich grządek, a na końcu pokazać różnicę między celem a osiągniętym układem. PRD wprost wymaga pokazania konfliktu, gdy odstępy lub powierzchnia uniemożliwiają realizację proporcji ([PRD:79–81](../../foundation/prd.md#L79)).

### 2. Osie rozstaw i aktualna gotowość katalogu

- Odczytana tabela PDF S6 zawiera nagłówek „Nazwa / Rozstawa w cm” i pary takie jak marchew 5 × 20–30 cm; nie znaleziono w niej etykiet „w rzędzie” i „między rzędami” ani legendy określającej kolejność wartości. Wniosek: pary S6 nie mogą być mapowane na osie przez samą kolejność lub intuicję ([S6, tabela „Kalendarz siewu warzyw”](http://rodczaplaznin.com.pl/rozne-dokumenty/terminarze-siewu/termin-siewu-warzyw.pdf)).
- Lokalna tabela Centrum Doradztwa Rolniczego rozróżnia w nagłówku odległości „między” rzędami oraz „w rzędach”; dokument wskazuje jednak, że tabela pochodzi ze źródła „Ogrodnictwo w tabelach” z 1986 r. Może potwierdzić sposób jawnego nazwania osi i dostarczyć historycznego porównania, ale nie uzasadnia przypisania osi do S6 ani użycia każdej wartości jako aktualnej normy ([CDR, „Normatywy Produkcji Rolniczej”, tabela 1](https://poznan.cdr.gov.pl/normatywy/public/pdf/5_1.pdf)).
- W aktualnym katalogu 26 z 30 rekordów przechowuje parę opublikowaną z axisVerified: false; helper publishedSpacing zostawia obie osie puste. Jeden rekord używa verifiedSpacing z odrębnymi osiami, a brak rozstawy dotyczy roszponki, rzepy i ziemniaka. Są to wartości z pełnego, obecnego katalogu, nie jedynie próbki ([crop-catalog.ts:145–174](../../../src/data/crop-catalog.ts#L145), [crop-catalog.ts:604](../../../src/data/crop-catalog.ts#L604), [crop-catalog.ts:647](../../../src/data/crop-catalog.ts#L647), [crop-catalog.ts:674](../../../src/data/crop-catalog.ts#L674), [crop-catalog.ts:687](../../../src/data/crop-catalog.ts#L687)).
- Przewodnik Kansas State University osobno opisuje średnią odległość w rzędzie i między rzędami. To dobry przykład jawnego kontraktu osi w tabeli, ale nie polskie zalecenie agrotechniczne ([K-State Extension, „Vegetable Crop Information”](https://www.gray.k-state.edu/docs/vege%20planting.pdf)).
- **Wniosek:** zachować parę S6 jako wartość źródłową, ale nie używać jej do geometrii, dopóki nie będzie niezależnego źródła z osiami albo źródłowej legendy. Jeśli inne źródło opisuje osie, przechowywać je jako osobną rekomendację wraz z kontekstem, a nie jako reinterpretację S6.

### 3. Brakujące dane, w szczególności ziemniak

- **Ziemniak — lokalne zalecenie działkowe:** strona Atlasu Roślin podaje 50–60 cm między rzędami oraz 40–50 cm w rzędzie; wspomina też alternatywny zapis 65 × 20–40 cm, ale w tym skróconym zapisie nie powtarza osobno nazw osi. Strona opisuje uprawę przyspieszoną i sadzenie bulw, więc nie należy traktować jej zakresu jako uniwersalnego dla wszystkich odmian i celów ([Atlas Roślin, „Solanum tuberosum”](https://atlas-roslin.pl/gatunki/Solanum_tuberosum.htm)).
- **Ziemniak — badanie polowe:** artykuł IHAR badał dwie odmiany, Arkadia i Orlik, w reprodukcji sadzeniaków w latach 1999–2001; czynniki obejmowały międzyrzędzia 62,5, 75 i 91 cm oraz sadzenie w rzędzie co 30 lub 40 cm. Jest to dowód, że rozstawa zależy od odmiany i celu produkcji, nie gotowa norma dla przydomowej grządki ([Pytlarz-Kozicka, 2002, DOI 10.37317/biul-2002-0036](https://doi.org/10.37317/biul-2002-0036)).
- Te źródła pozwalają uzupełnić ziemniaka o źródłowe, opisane osiami warianty, ale katalogowy model reprezentuje obecnie pojedynczy SpacingData. **Rekomendacja techniczna do planowania:** przechowywać warianty rozstawy jako odrębne rekordy z typem uprawy/źródłem albo jawnie wskazać jeden wariant MVP z niską pewnością i notą; nie scalać różnych kontekstów w pozornie uniwersalny zakres ([crop-catalog.ts:22–29](../../../src/data/crop-catalog.ts#L22)).
- **Rzepa:** bieżący rekord ma spacing: null, a sprawdzone polskie tabele CDR i S6 nie dostarczają zweryfikowanej, lokalnej pary osi dla tej pozycji ([crop-catalog.ts:674](../../../src/data/crop-catalog.ts#L674), [CDR, tabela 1](https://poznan.cdr.gov.pl/normatywy/public/pdf/5_1.pdf), [S6](http://rodczaplaznin.com.pl/rozne-dokumenty/terminarze-siewu/termin-siewu-warzyw.pdf)). K-State Extension podaje dla korzeni rzepy 3–4 cale w rzędzie i 12–18 cali między rzędami; to jawne osie, ale zalecenie dla kontekstu Kansas, nie zatwierdzona wartość dla Polski ([K-State Extension, tabela Vegetable Crop Information](https://www.gray.k-state.edu/docs/vege%20planting.pdf)).
- **Roszponka:** bieżący rekord ma spacing: null; S6 podaje parę 10 × 15 cm bez opisania osi, więc jej źródłowe liczby nie wystarczają do rozmieszczenia roślin w geometrii grządki ([crop-catalog.ts:647](../../../src/data/crop-catalog.ts#L647), [S6, tabela „Kalendarz siewu warzyw”](http://rodczaplaznin.com.pl/rozne-dokumenty/terminarze-siewu/termin-siewu-warzyw.pdf)).
- **Konsekwencja:** nie zgadywać osi dla żadnej z 26 niezweryfikowanych par ani nie wykonywać cichego fallbacku dla wybranych rekordów bez danych. Plan S-04 powinien określić jawne zachowanie: widoczny konflikt/niepełny plan albo warunek, że wybrane rośliny muszą mieć co najmniej jedną potwierdzoną parę rozstawy.

### 4. Sąsiedztwo nie jest liczbową odległością

- Katalog opisuje relację pary upraw przez status, typ, uzasadnienie, źródła i hardBlock; nie przechowuje promienia sąsiedztwa w centymetrach ani minimalnej odległości od pary. W przypadku braku wpisu getCompanionRelation zwraca unknown i jawnie stwierdza, że brak wpisu nie jest zakazem ([crop-catalog.ts:53–61](../../../src/data/crop-catalog.ts#L53), [crop-catalog.ts:58–69](../../../src/lib/crop-catalog.ts#L58)).
- Walidator katalogu odrzuca relacje oznaczone jako twarda blokada; istniejący research również zaleca advisory zamiast zakazów ([crop-catalog.ts:883](../../../src/data/crop-catalog.ts#L883), [research katalogu:151](../../changes/garden-crop-catalog-research/research.md#L151), [research katalogu:178](../../changes/garden-crop-catalog-research/research.md#L178)).
- WSU Extension (wydanie z 2023 r.) rozróżnia naukowo opisywane intercropping/polyculture od popularnych list, z których wiele nie ma wiarygodnego potwierdzenia. Metaanaliza z 2022 r. wykazuje, że efekty intercroppingu zależą między innymi od rodziny współuprawy, nawożenia oraz tego, czy badanie było doniczkowe czy polowe. Razem wspierają model ostrożnych, kontekstowych podpowiedzi, nie uniwersalnych zakazów ([WSU Extension, 2023](https://pubs.extension.wsu.edu/product/gardening-with-companion-plants-home-garden-series/), [Chadfield et al., 2022](https://pmc.ncbi.nlm.nih.gov/articles/PMC9545407/)).
- **Wniosek:** sąsiedztwo może wpływać na ranking lub wybór grządki, a relacja caution może uzasadniać wyjaśnione ostrzeżenie. Nie wyprowadzamy z niej dystansu liczbowego. Trzeba osobno zdefiniować, czy „sąsiednie” oznacza tę samą grządkę, bezpośrednią granicę sąsiednich grządek, czy określony promień; aktualne źródła projektu tego nie rozstrzygają.

## Proponowany kierunek algorytmu S-04

1. Znormalizować dodatnie proporcje jako wagi na poziomie całej działki; w planie przyjąć interpretację udziału powierzchni uprawnej dopiero po decyzji użytkownika.
2. Dla każdej wybranej uprawy wyznaczać wykonalne pozycje na podstawie osi rozstawy ze źródłem, kontekstem i poziomem pewności. Nie używać nierozstrzygniętej pary jako osi.
3. Rozdzielać pozycje między wszystkie grządki jako jeden problem globalny; nie narzucać oddzielnego udziału każdej uprawy na każdej grządce.
4. Traktować wymiary i potwierdzoną rozstawę jako warunek geometrii. Używać sąsiedztwa jako preferencji/ostrzeżenia, z unknown neutralnym; nie zamieniać statusu relacji w twardą kolizję.
5. Zwracać osiągnięty udział względem celu, niewykorzystaną powierzchnię i powód rozbieżności. To odpowiada FR-006/FR-007, które wymagają jawnego pokazania konfliktu, ale nie wymagają recepty na jego naprawę ([PRD:79–81](../../foundation/prd.md#L79)).

Powyższa kolejność jest rekomendacją projektową opartą na wymaganiach i istniejącym modelu danych. Nie jest wynikiem porównawczego testu algorytmów ani decyzją zatwierdzoną do implementacji.

## Code references

- src/data/crop-catalog.ts:22 — kontrakt rozstawy: opublikowana para, osie in-row/between-rows, kontekst, źródła, pewność i flaga osi.
- src/data/crop-catalog.ts:145 — helper niezweryfikowanej pary; src/data/crop-catalog.ts:161 — helper rozstawy z jawnymi osiami.
- src/lib/garden-crop-selection.ts:8 — walidacja zapisuje proporcję jako dodatnią liczbę bez interpretacji jednostki.
- src/lib/crop-catalog.ts:58 — brak relacji zwraca unknown, nie zakaz.
- src/data/crop-catalog.ts:647, :674, :687 — rekordy bez rozstawy: roszponka, rzepa i ziemniak.
- context/foundation/prd.md:79 — wymaganie ujawnienia rozbieżności przy niewykonalnych proporcjach.
- context/foundation/roadmap.md:130 — sekcja mówi „Blockers: —”; linie 132–135 wymieniają jednak otwarte pytania z Block: yes i status blocked.

## Historical context

- context/changes/garden-crop-catalog-research/research.md:75 wskazuje S6 jako tabelę par rozstaw bez dostatecznie jednoznacznego opisu osi; wynik bieżącej kontroli nagłówka potwierdza tę konkretną lukę.
- context/changes/garden-crop-catalog-research/research.md:107 i :204 mówią, że ziemniak nie miał zweryfikowanej polskiej wartości; obecny research częściowo aktualizuje to ustalenie: znaleziono lokalne zalecenie działkowe oraz badanie IHAR, ale nie jedną uniwersalną wartość.
- context/archive/2026-09-27-select-crops-and-proportions/plan-brief.md:25 potwierdza, że S-03 zapisywał proporcję jako dodatnią liczbę bez interpretacji; :33 potwierdza, że przypisanie do grządek należało do późniejszego zakresu.
- Własność pytania o znaczenie proporcji różni się w dokumentach: PRD wskazuje użytkownika, a roadmapa zespół ([PRD:129](../../foundation/prd.md#L129), [roadmap.md:132](../../foundation/roadmap.md#L132)). Roadmapa ma też lokalną niespójność między polem Blockers: — a pytaniami oznaczonymi Block: yes ([roadmap.md:130–135](../../foundation/roadmap.md#L130)).

## Related research

- [Research katalogu warzyw, terminów, rozstaw i sąsiedztwa](../garden-crop-catalog-research/research.md)
- [PRD](../../foundation/prd.md)
- [Roadmapa](../../foundation/roadmap.md)

## Open questions

1. Czy liczba proporcji oznacza udział **powierzchni uprawnej** (rekomendacja), liczbę roślin, czy tylko wagę priorytetu?
2. Czy użytkownik akceptuje użycie dwóch odrębnych źródłowych wariantów ziemniaka z oznaczeniem kontekstu, zamiast jednego domyślnego zakresu?
3. Jak zachować wartości dla roszponki i rzepy bez polskich źródeł z jawnymi osiami: nie pozwalać na pełne przeliczenie, czy dopuścić osobno oznaczony fallback?
4. Co robić, gdy wybrana uprawa nie ma potwierdzonej osi: pokazać częściowy układ z konfliktem czy wstrzymać generowanie?
5. Jaki zasięg przestrzenny oznacza relacja sąsiedztwa i czy preferencje relacji mają wpływać na dopasowanie proporcji, czy tylko na wybór grządek?
6. Granica między S-04 i S-06 wymaga odrębnego rozstrzygnięcia: US-01 wspomina terminy, podczas gdy roadmapa przydziela ich adjudykację S-06 ([PRD:52–58](../../foundation/prd.md#L52), [roadmap.md:46–48](../../foundation/roadmap.md#L46)).

**Status research: partial.** Źródła umożliwiają określenie bezpiecznego kierunku oraz znalezienie wariantów ziemniaka, ale znaczenie proporcji i zachowanie dla roślin bez wiarygodnej osi pozostają decyzjami produktowymi; zbadane źródła nie dostarczają lokalnych wartości dla wszystkich brakujących rekordów.
