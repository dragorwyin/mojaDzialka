---
date: 2026-10-04T18:49:33+02:00
researcher: Codex
git_commit: 15e0723f5cb89b55ce1eee8c91e430b767b433f9
branch: codex/s06-sowing-and-seedling-dates
repository: mojaDzialka
topic: "S-06: źródła i terminy siewu oraz przygotowania rozsady"
tags: [research, crop-catalog, season-windows, sowing-dates]
status: complete
last_updated: 2026-10-04
last_updated_by: Codex
---

# Research: S-06 — źródła i terminy siewu oraz przygotowania rozsady

**Date**: 2026-10-04T18:49:33+02:00
**Researcher**: Codex
**Git Commit**: 15e0723f5cb89b55ce1eee8c91e430b767b433f9
**Branch**: codex/s06-sowing-and-seedling-dates
**Repository**: mojaDzialka

## Research Question

Jakie wiarygodne źródła i orientacyjne okna terminów dla polskich warunków powinny zasilać S-06 oraz co już pokazuje aplikacja?

## Summary

S-06 nie zaczyna od pustego katalogu: w sprawdzonym `CROP_CATALOG_SEEDS` są wstępne `seasonWindows`, a formularz wyboru upraw pokazuje terminy wraz z metodą, miesiącami, warunkiem, pewnością i odnośnikami do źródeł ([crop-catalog.ts:590–1232](../../../src/data/crop-catalog.ts#L590), [CropSelectionForm.tsx:169–188](../../../src/components/garden/CropSelectionForm.tsx#L169)). To jednak nie zamyka blokady roadmapy: obecne wpisy są oznaczone do lokalnej weryfikacji, a ich źródła nie zostały jeszcze rozstrzygnięte dla zakresu katalogu ([roadmap.md:157–161](../../foundation/roadmap.md#L157)).

Najlepsza znaleziona baza ogólna to aktualny materiał SODR z 10 czerwca 2026 r. o ilościach i terminach siewu oraz sadzenia warzyw gruntowych; należy zachować jego regionalny i produkcyjny kontekst ([SODR, 2026](https://www.sodr.pl/main/aktualnosci/Warzywa-gruntowe-ilosci-i-terminy/idn:4111)). Materiały CDR Brwinów obejmują szeroki zestaw upraw, lecz wskazują jako źródło „Ogrodnictwo w tabelach 1986” i obliczenia własne, więc nadają się do kontroli krzyżowej, a nie jako jedyna aktualna podstawa ([siew bezpośredni](https://poznan.cdr.gov.pl/normatywy/public/pdf/5_1.pdf), [rozsada](https://poznan.cdr.gov.pl/normatywy/public/pdf/5_2.pdf), [uprawa pod osłonami](https://poznan.cdr.gov.pl/normatywy/public/pdf/5_3.pdf)). InHort publikuje metodyki ochrony dla konkretnych gatunków, nie uniwersalny kalendarz siewu ([lista metodyk InHort](https://www.inhort.pl/serwis-ochrony-roslin/metodyki-rosliny-warzywne/)).

Adjudykacja terminów została wykonana podczas implementacji: tabela SODR stanowi wspólną, regionalną bazę dla upraw ujętych w jej wierszach, metodyka GIORiN/IOR-PIB zasila ziemniak, a czosnek zachowuje specjalistyczne źródło SODR. Rukola nie otrzymuje potwierdzonego terminu, ponieważ dostępne materiały nie uzasadniają go wystarczająco. Poniższa tabela zapisuje decyzje i ograniczenia; okna pozostają orientacyjne, nie są zaleceniem dla każdej lokalizacji.

## Detailed Findings

### Wymaganie i obecny interfejs

- FR-008 wymaga podstawowych terminów siewu i przygotowania rozsady oraz przypomnień dla warunków w Polsce; jawnie określa terminy jako orientacyjne, a nie dokładne co do dnia ([prd.md:86](../../foundation/prd.md#L86)).
- W bieżącym formularzu szczegóły wybranej uprawy zawierają sekcję „Orientacyjne terminy”. Dla każdego okna interfejs wyświetla etykietę metody, zakres miesięcy, warunek, poziom pewności i linki źródłowe; osobno informuje o lokalnej weryfikacji, jeżeli flaga jest ustawiona ([CropSelectionForm.tsx:120–124](../../../src/components/garden/CropSelectionForm.tsx#L120), [CropSelectionForm.tsx:169–190](../../../src/components/garden/CropSelectionForm.tsx#L169)).
- Model `SeasonWindow` przechowuje miesiąc początkowy i końcowy, metodę, warunek, identyfikatory źródeł oraz pewność ([crop-catalog.ts:118–125](../../../src/data/crop-catalog.ts#L118)). Walidator sprawdza cały aktywny katalog pod kątem 31 rekordów oraz sprawdza format miesięcy i istnienie źródeł dla okien, ale walidacje te nie dowodzą prawdziwości agronomicznej terminu ([crop-catalog.ts:1825–1838](../../../src/data/crop-catalog.ts#L1825), [crop-catalog.ts:1909–1914](../../../src/data/crop-catalog.ts#L1909)).
- W sprawdzonych blokach danych katalogu są wpisy terminów dla 31 aktywnych upraw; 30 rekordów ma `needsLocalValidation: true`, a wpis czosnku ma tę flagę wyłączoną ([crop-catalog.ts:590–1232](../../../src/data/crop-catalog.ts#L590), [crop-catalog.ts:1050–1061](../../../src/data/crop-catalog.ts#L1050)). To stan implementacji, nie wynik niezależnego potwierdzenia źródeł.
- W przejrzanym kodzie komponentu formularza i katalogu nie znaleziono widoku zintegrowanego harmonogramu ani logiki przypomnień. To obserwacja ograniczona do tych ścieżek i wyszukiwania konsumentów `seasonWindows`; nie przesądza o braku innych mechanizmów poza sprawdzonym zakresem.

### Adjudykacja źródeł

- **SODR, 2026 — źródło ogólne o wysokiej aktualności.** Tabela podaje terminy produkcji rozsady, siewu bezpośredniego i sadzenia w gruncie dla wielu warzyw. Została opublikowana przez regionalny Ośrodek Doradztwa Rolniczego 10 czerwca 2026 r. Jej regionalność i kontekst produkcji wymagają opisania; nie jest sama w sobie uniwersalną rekomendacją dla każdej lokalizacji i przydomowej grządki. Nie potwierdzono w tym badaniu osobno wszystkich upraw z katalogu.
- **CDR Brwinów — użyteczne szerokie porównanie, ograniczona aktualność.** Tabele osobno obejmują siew bezpośredni, produkcję rozsady i uprawę pod osłonami, posługują się dekadami miesięcy i podają źródło „Ogrodnictwo w tabelach 1986” oraz obliczenia własne. Należy odróżniać tabelę dla uprawy pod osłonami od terminów dla otwartego gruntu. Wiek wskazanego źródła uzasadnia kontrolę krzyżową, nie pierwszeństwo nad aktualnymi zaleceniami.
- **InHort-PIB — źródło pomocnicze dla szczegółów uprawy.** Oficjalny indeks zawiera metodyki integrowanej ochrony dla poszczególnych gatunków warzyw. Jest przydatny do weryfikacji kontekstu gatunkowego, lecz indeks nie stanowi wspólnego kalendarza terminów.
- **COBORU, PDO 2024 — dowód zmienności prób, nie kalendarz dla użytkownika.** Raport zawiera wyniki doświadczeń odmianowych z 2024 r.; terminy z doświadczeń są związane z lokalizacją, odmianą i protokołem, więc nie powinny bezpośrednio zasilać ogólnej porady dla działkowca ([raport COBORU 2024](https://coboru.gov.pl/Publikacje_COBORU/Wyniki_PDO/WPDO_222_rosliny_warzywne_2024.pdf)).

### Rekomendowana hierarchia danych

1. Dla gatunku sprawdzić aktualne polskie zalecenie instytucjonalne lub regionalnego ODR i zapisać jego zakres geograficzny, metodę uprawy oraz kontekst (grunt/osłony, siew/sadzenie/rozsada).
2. Użyć metodyk InHort dla informacji specyficznych dla gatunku, jeśli odpowiadają na pytanie o termin; nie traktować samej metodyki ochrony jako kalendarza.
3. Porównać z CDR jako źródłem pomocniczym i oznaczyć rozbieżności; nie podnosić pewności wyłącznie dlatego, że stary zakres pokrywa się z nowym.
4. Gdy nie ma wystarczającego źródła dla uprawy lub warunków lokalnych, zachować jawny brak/niski poziom pewności i flagę lokalnej weryfikacji. Nie interpolować brakujących terminów bez źródła.

To rekomendacja wynikająca z aktualności, zakresu i własnych zastrzeżeń źródeł, nie zatwierdzona jeszcze reguła produktu.

### Adjudykacja okien w S-06

S7 to tabela Świętokrzyskiego ODR z 2026 r. rozdzielająca produkcję rozsady, siew do gruntu i sadzenie rozsady. Jest regionalnym, produkcyjnym punktem odniesienia; UI nadal oznacza terminy jako orientacyjne i pozostawia flagę lokalnej weryfikacji. S67 to metodyka GIORiN/IOR-PIB (2024), która dla ziemniaka wiąże sadzenie z temperaturą gleby i regionem. S8 pozostaje specjalistycznym źródłem czosnku. Nie interpolowano brakującego terminu dla rukoli.

| Uprawa | Pozostawione okna i metody | Źródło / ograniczenie |
|---|---|---|
| Pomidor | rozsada III–IV; sadzenie V; siew do gruntu V–VI | S7; produkcja gruntowa, lokalnie po przymrozkach |
| Ogórek | rozsada IV; siew do gruntu V–VI | S7; wrażliwość na chłód |
| Pietruszka korzeniowa/naciowa | siew korzeniowej III–V i IX; naciowej III–IV i VII | S7; osobne terminy części użytkowej |
| Marchew | siew III–VI oraz przedzimowy XI | S7; listopadowe okno niskiej pewności |
| Cebula | rozsada II–III; siew III–IV; sadzenie/dymka IV–V | S7; metody rozdzielone |
| Burak ćwikłowy | siew IV–VI | S7 |
| Rzodkiewka | siew III–V oraz VII–IX | S7; rozdzielono wiosnę i chłodniejsze okno |
| Sałata | rozsada II–VII; siew IV–V; sadzenie IV–VII | S7; termin sadzenia zależy od terminu siewu |
| Kapusta biała | rozsada II–IV; sadzenie IV–VI | S7; wariant odmianowy pozostaje lokalny |
| Kalafior | rozsada II–VI; sadzenie IV–VII | S7; terminy obejmują różne warianty uprawy |
| Brokuł | rozsada III–IV; siew IV–VI (niska pewność); sadzenie IV–VII | S7; siew bezpośredni mniej typowy w ogródku |
| Kalarepa | rozsada II–IV i VII; sadzenie IV–VI i VIII | S7; osobne okna późnego zbioru |
| Jarmuż | rozsada V–VI; sadzenie VI–VII | S7 |
| Groch | siew III–IV | S7 |
| Cukinia | rozsada IV; siew V; sadzenie V | S7; sadzenie lokalnie po przymrozkach |
| Dynia | rozsada IV; siew V; sadzenie V | S7; różne typy dyni nadal wymagają lokalnej interpretacji |
| Papryka | rozsada II–IV; siew i sadzenie V–VI | S7; siew do gruntu ma niską pewność, odmiana ciepłolubna |
| Por | rozsada III; sadzenie IV; siew do gruntu IV–V | S7 |
| Szpinak | siew III–IV oraz VIII–X | S7; osobne okna wiosenne i jesienne |
| Seler | rozsada II–III; sadzenie V–VI | S7; wpis katalogu dotyczy selera korzeniowego |
| Kukurydza cukrowa | siew V | S7; układ blokowy to osobny kontekst uprawy |
| Czosnek | siew/sadzenie wiosenne III; zimowe IX–X | S8; zachowano specyficzne okno czosnku |
| Pasternak | siew III–IV | S7 |
| Rukola | brak potwierdzonego okna | S6/S9 nie uzasadniają terminu wystarczająco; wymagana weryfikacja |
| Roszponka | siew III–IV oraz VII–VIII | S7; osobne okna wiosenne i późniejsze |
| Bakłażan | rozsada III; sadzenie V–VI | S7; gruntowy punkt odniesienia, osłony mogą się różnić |
| Rzepa | siew III–IV oraz VII–VIII | S7; osobne okna wiosenne i późniejsze |
| Ziemniak | sadzenie IV–V | S67; region i temperatura gleby, bez dokładnego dnia |
| Pomidor koktajlowy (palikowany) | rozsada III–IV; sadzenie V | S7; kalendarz ogólny pomidora, nie zależy od typu owocu |
| Koper | siew III–VIII | S7; termin oddzielony od wcześniejszej gęstości siewu z S66 |
| Szczypiorek | rozsada III–IV; sadzenie IV; siew do gruntu V | S7; jednostką obsady pozostaje kępa |

Wartości w katalogu nie stanowią krajowej prognozy klimatycznej ani dokładnych zaleceń dla konkretnej odmiany. Zmiana doboru/uprawy regionalnej wymaga ponownej lokalnej weryfikacji.

### Związek z roadmapą i historią

- Roadmapa nadal oznacza S-06 jako `blocked`, z blokującym pytaniem o zweryfikowane źródła i miesięczne okna oraz nieblokującym pytaniem o sposób przypomnień ([roadmap.md:149–161](../../foundation/roadmap.md#L149)). Jej przekaz „przed zapisaniem danych produkcyjnych” wymaga doprecyzowania: wpisy w katalogu i ich częściowa prezentacja już istnieją, ale są nieadjudykowane i obciążone flagami walidacyjnymi ([crop-catalog.ts:590–1232](../../../src/data/crop-catalog.ts#L590), [CropSelectionForm.tsx:169–190](../../../src/components/garden/CropSelectionForm.tsx#L169)). Zalecana poprawka roadmapy to nazwać pozostały zakres „adjudykacja, korekta i udokumentowanie istniejących okien”, a nie „zapisanie” ich od zera.
- Research S-04 jawnie odłożył terminy siewu i sadzenia do S-06, więc nie ma konfliktu zakresu między tymi zmianami ([research.md:272](../../../archive/2026-09-28-generate-garden-layout/research.md#L272)).
- PRD obejmuje również przypomnienia; roadmapa mówi, że sposób ich dostarczenia jest decyzją użytkownika, ale nie blokuje badań źródeł ani planowania podstawowych terminów ([prd.md:86](../../foundation/prd.md#L86), [roadmap.md:157–161](../../foundation/roadmap.md#L157)).

## Code References

- `src/data/crop-catalog.ts:118–125` — kontrakt `SeasonWindow`.
- `src/data/crop-catalog.ts:590–1232` — rekordy upraw i obecne okna sezonowe.
- `src/data/crop-catalog.ts:1825–1838` — asercja liczby rekordów oraz walidacja flag lokalnej weryfikacji.
- `src/data/crop-catalog.ts:1909–1914` — walidacje zakresu miesięcy i identyfikatorów źródeł.
- `src/components/garden/CropSelectionForm.tsx:120–124,169–190` — szczegóły uprawy i istniejąca prezentacja orientacyjnych terminów.
- `context/foundation/prd.md:86` — FR-008.
- `context/foundation/roadmap.md:149–161,173` — S-06, blokada źródeł i backloga.

## Architecture Insights

Katalog trzyma dane sezonowe per uprawa, a UI szczegółów odczytuje je bezpośrednio. Model zawiera miesiące, metodę, opis warunku, źródła i pewność, co pozwala poprawiać/adjudykować dane bez zmiany kontraktu widoku, o ile nie okaże się potrzebne rozróżnienie lokalizacji albo sposobu uprawy. Obecny schemat nie zapisuje jawnego regionu ani roku/wersji źródła przy pojedynczym oknie; identyfikatory źródeł prowadzą do wspólnego rejestru źródeł katalogu. To ogranicza audytowalność, gdy ogólne źródło ma regionalny zakres lub wiele okien wymaga osobnego uzasadnienia.

## Historical Context (from prior changes)

- `context/archive/2026-09-28-generate-garden-layout/research.md:272` — decyzja o odłożeniu terminów do S-06: nadal obowiązuje i potwierdza granicę zakresu.
- W S-04 katalog i planer miały inne cele; obecne UI terminów oznacza, że S-06 rozwija częściową funkcję prezentacji zamiast wprowadzać ją od zera.

## Related Research

- `context/archive/2026-09-28-generate-garden-layout/research.md`

## Open Questions

- Potrzebna jest tabela adjudykacji per uprawa: źródło główne, okno, metoda, region/warunek, rozbieżności, pewność oraz decyzja pozostawienia/korekty wpisu. Obecny research nie wykonuje tej walidacji dla całego katalogu.
- Czy S-06 w tej fazie dostarcza tylko orientacyjne terminy w szczegółach uprawy, czy także przypomnienia? PRD wymienia przypomnienia, ale nie definiuje kanału ani zachowania; roadmapa określa tę decyzję jako nieblokującą. Plan powinien rozdzielić zakres potwierdzony od ewentualnego rozszerzenia.
- Czy UI ma pokazywać regionalne zastrzeżenie, gdy dane pochodzą z jednego ODR? Warto rozstrzygnąć przed zatwierdzeniem treści dla użytkownika.
