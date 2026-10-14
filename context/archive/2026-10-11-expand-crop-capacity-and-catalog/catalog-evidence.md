# Ewidencja unikalnych typów upraw

## Zakres

Użytkownik skorygował pierwotny cel „100 warzyw”: nie ma progu liczbowego, chodzi o jak najszerszy katalog faktycznych typów roślin, np. osobno fasolę szparagową i fasolę na suche nasiona. Synonimy są aliasami. Odmiany nie są osobnymi wpisami katalogu. Wszystkie aktywne wpisy muszą mieć końcową, źródłową rozstawę, żeby mogły być obliczane; niska pewność jest jawna i nie blokuje obliczeń.

Poprzednia próba liczyła 82 odmiany jako osobne aktywne rekordy. Te rekordy zostały usunięte z katalogu: rejestr COBORU potwierdza nazwy odmian, ale nie stanowią one nowych typów ani nie dostarczają własnej rozstawy. Zachowano 31 dotychczasowych ID bazowych, w tym historyczny wpis pomidora koktajlowego, i dodano 9 odrębnych typów, dając **40 aktywnych wpisów**. Dwa cele fasoli mają różne części zbierane i rozstawy. Nazwy alternatywne, takie jak brukselka/kapusta brukselska czy skorzonera/wężymord/czarny korzeń, są aliasami jednego wpisu.

To jest kuratorowana lista uprawianych lub polecanych upraw, nie ranking popularności w Polsce. Dowody doboru i rozstawy opisują różne rzeczy. Dla rozstaw polowych lub zagranicznych każda pozycja ma jawnie niską pewność i notę kontekstową.

## Siła dowodów doboru

- **A — obserwacja lokalna:** rzeczywiste nasadzenia w konkretnym ROD; sygnał bezpośredni, ale niereprezentatywny.
- **B — zalecenie lub obserwacja amatorska:** PZD/ODR lub źródło ogrodnicze wskazuje roślinę do działki/warzywnika; nie dowodzi krajowej częstości.
- **C — kontekst uzupełniający:** źródło użytkowe/katalogowe potwierdza odrębność lub amatorską przydatność, ale nie mierzy popularności.

## Rejestr źródeł

| ID | Źródło | Rola i ograniczenie |
| --- | --- | --- |
| S1 | Badanie etnobotaniczne polskich działkowców, 46 osób/3 miasta | Faktyczne uprawy w małej, historycznej próbie. |
| S2–S67 | Źródła wpisów i danych w `src/data/crop-catalog.ts` | Dobór, końcowa obsada, siew lub terminy; ograniczenia opisano przy źródle. |
| S68 | COBORU, lista odmian warzywnych 2026 | Tożsamość odmian, nie popularność ani rozstawa; nie uzasadnia osobnych rekordów odmian. |
| S69 | PZD, obserwacje ROD w Bydgoszczy | Lokalny sygnał nasadzeń pomidora, ogórka, sałaty, pietruszki, marchwi, fasoli, selera i pora. |
| S70 | PZD, porady dla nowych działkowców | Polska rekomendacja upraw i terminów, nie pomiar częstości. |
| S71 | CDR, tabela 5_1 warzyw z siewu, źródło pierwotne: *Ogrodnictwo w tabelach* 1986 | Starsza tabela polowa; użyta wyłącznie dla kolumny „odległość roślin”, nie normy wysiewu. Niska pewność dla skrzyń. |
| S72 | CDR, tabela 5_2 warzyw z rozsady, źródło pierwotne: *Ogrodnictwo w tabelach* 1986 | Starsza tabela polowa po sadzeniu rozsady. |
| S73 | PZD, otwarty program gatunków na działki | Zalecane warzywa, m.in. fasola szparagowa, burak liściowy, endywia i brukselka. |
| S74 | PZD, nowoczesne metody uprawy warzyw na działce | Wymienia m.in. bób i fasolę jako rośliny do skrzyń/pojemników. |
| S75 | PZD, porady ogrodnicze na lipiec | Wymienia rzodkiew jako odrębną od rzodkiewki uprawę do późniejszego siewu. |
| S76 | PZD, skorzonera — wężymord, czarny korzeń | Potwierdza jadalny korzeń i uprawę w Polsce; wprost określa ją jako rzadką. Synonimy nie są osobnymi typami. |
| S77 | InHort, metodyka uprawy fasoli | Rozróżnia fasolę szparagową i przeznaczoną na suche nasiona; kontekst produkcyjny, rozstawa karłowej szparagowej. |
| S78 | University of Minnesota Extension, domowa uprawa szpinaku i boćwiny | Końcowa rozstawa boćwiny po przerzedzeniu/wysadzeniu; zagraniczny fallback. |
| S79 | Iowa State University Extension, brukselka w ogrodzie domowym | Rozstawa dojrzałych roślin w ogrodzie domowym; zagraniczny fallback. |
| S80 | Iowa State University Extension, kapusta pekińska | Rozstawa końcowa po przerzedzeniu w ogrodzie domowym; zagraniczny fallback. |
| S81 | UC ANR, odstępy jadalnych roślin | Tabela warzywnika domowego podaje odstępy endywii; zagraniczny fallback. |
| S82 | PlantiCo, katalog „Fasola na suche nasiona” | Polski producent podaje końcową obsadę, rozstawę 50 cm między rzędami i 30–35 cm w rzędzie oraz poleca odmiany do uprawy amatorskiej. |
| S83 | PZD Opole, pierwszy warzywnik | Wymienia kapustę pekińską wśród warzyw do warzywnika. |

## 31 zachowanych typów

Poniższe 31 ID istniało przed rozszerzeniem. Ich dokładne źródła i ograniczenia pozostają przypisane do `sourceIds` oraz `finalSpacing.sourceIds` w katalogu.

`pomidor`, `pomidor-koktajlowy-palikowany`, `ogorek`, `pietruszka`, `marchew`, `cebula`, `burak-cwiklowy`, `rzodkiewka`, `salata`, `kapusta-biala`, `kalafior`, `brokul`, `kalarepa`, `jarmuz`, `cukinia`, `dynia`, `papryka`, `por`, `szpinak`, `seler`, `kukurydza-cukrowa`, `czosnek`, `pasternak`, `rukola`, `roszponka`, `baklazan`, `rzepa`, `ziemniak`, `groch`, `koper`, `szczypiorek`.

## 9 dodanych, odrębnych typów

| ID | Typ / część zbierana | Dowód doboru | Końcowa rozstawa i ograniczenie |
| --- | --- | --- | --- |
| `bob` | Bób, nasiona w niedojrzałych strąkach | B: S70, S74 | 10 cm w rzędzie × 40–60 cm między rzędami; S71, niska pewność, starsza norma polowa. |
| `fasola-szparagowa` | Fasola na zielone strąki | B: S70, S73 | 5–8 × 40–50 cm; S71/S77, niska pewność, forma karłowa i kontekst polowy. |
| `fasola-wielokwiatowa-na-suche-nasiona` | Fasola wielokwiatowa na dojrzałe, suche nasiona | B/C: S74, S82 | 30–35 × 50 cm; S82 podaje również 68–80 tys. roślin/ha dla karłowej/biczykowej formy polecanej do uprawy amatorskiej. Niska pewność przy przeniesieniu na skrzynie. |
| `kapusta-brukselska` | Brukselka | B: S73 | 45–50 × 50 cm; S72/S79, niska pewność, tabela polowa i poradnik Iowa State. |
| `kapusta-pekinska` | Kapusta pekińska | B: S83 | 25–30 × 40–45 cm; S72/S80, niska pewność. |
| `burak-lisciowy` | Burak liściowy (boćwina), liście i ogonki | B: S73 | 10–15 × 46–76 cm; S78, niska pewność, zalecenie UMN Extension. |
| `endywia` | Endywia | B: S73 | 23–30 × 46–61 cm; S81, niska pewność, tabela UC ANR. |
| `rzodkiew` | Rzodkiew większego korzenia, nie rzodkiewka | B: S75 | 5–10 × 20–30 cm; S71, niska pewność, starsza norma polowa. |
| `skorzonera` | Skorzonera, jadalny czarny korzeń | B: S76 | 5–8 × 30–40 cm; S71, niska pewność, starsza norma polowa; PZD określa roślinę jako rzadką. |

## Sprawdzone, ale niewłączone

| Kandydat | Powód wykluczenia z aktywnego katalogu |
| --- | --- |
| Fasola szparagowa tyczna jako osobny rekord | Ma inny pokrój, lecz dostępne zalecenia często podają kilka nasion na stanowisko i wymagają podpór. Obecny model liczy pojedyncze rośliny i nie opisuje konstrukcji; potrzebny jest osobny kontrakt podpór oraz źródło finalnej liczby roślin na stanowisko. Nie jest aliasem do wpisu karłowej fasoli szparagowej. |
| Fasola zwykła na suche nasiona (Phaseolus vulgaris) | S82 ma sprawdzoną rozstawę dla fasoli wielokwiatowej (Phaseolus coccineus), nie fasoli zwykłej. InHort/PZD potwierdzają siew fasoli zwykłej, ale odnalezione pary dotyczą odstępu siewu nasion, a nie jednoznacznej końcowej obsady roślin. Wpis wymaga osobnego źródła końcowego stanowiska. |
| Skorzonera: „wężymord”, „czarny korzeń”, „zimowe szparagi” | To synonimy jednego wpisu `skorzonera`, nie osobne rekordy. |
| Pomidor, marchew, burak, sałata, ogórek, kapusta i brokuł — nazwy odmian | Nazwy odmian nie zwiększają liczby typów. COBORU S68 nie uzasadnia osobnych ID bez odrębnego celu uprawowego i własnej końcowej rozstawy. |
| Fasola szparagowa żółta/zielona, cukinia żółta/zielona, dynia Hokkaido/piżmowa, papryka w kolorach | Kolor/odmiana nie zmienia obecnie identyfikacji ani logiki planowania. Synonimy lub warianty trafiają do aliasu, jeśli są przydatne w wyszukiwaniu. |

## Granica kompletności

Katalog ma 40 unikalnych wpisów: 31 zachowanych i 9 nowych. Jest to maksymalny zbiór **spośród kandydatów zweryfikowanych w tej rundzie**, nie deklaracja kompletności wszystkich jadalnych roślin w Polsce. PZD wymienia dalsze kandydatury, m.in. głąbigroszek, okrę, mizunę, rzeżuchę i zioła. Nie dodano ich, dopóki nie ma wiarygodnej końcowej obsady oraz wystarczającego rozróżnienia typu od formy/odmiany. Następną iterację powinien otworzyć kandydat z PZD, który ma osobne źródło końcowej rozstawy; nie należy wracać do nabijania katalogu odmianami.
