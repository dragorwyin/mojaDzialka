# Frame Brief: Rozstaw późnej marchwi i czytelność diagramu

> Framing przed `/10x-plan`. Oddziela rzeczywistą geometrię od sposobu, w jaki
> diagram ją rysuje, oraz ogólną rozstawę od potrzeb późnej odmiany.

## Reported Observation

> „na moje oko jest blad, bo marchwie zostaly osadzone zbyt blisko siebie”

Na zrzucie znaczniki w górnej części diagramu są stłoczone, a część etykiet
nachodzi na siebie. Użytkownik później podał pozycje marchwi 85,5, 88,5 i
91,5 cm — trzy kolejne środki w odstępie 3 cm.

## Initial Framing (preserved)

- **User's stated cause or approach**: podejrzenie, że marchew została
  rozmieszczona zbyt blisko przez błąd generatora.
- **User's proposed direction**: początkowo bez konkretnej poprawki; po
  sprawdzeniu pozycji użytkownik wskazał, że bezpieczniejsze byłoby minimum
  7 cm, uwzględniające późne odmiany.
- **Pre-dispatch narrowing**: screenshot pokazał stłoczone znaczniki, ale sam
  nie pokazywał odległości w centymetrach ani statusu aktualności planu.

## Dimension Map

1. **Dane katalogowe marchwi** — zakres ogólny może nie opisywać późnych,
   większych korzeni.
2. **Interpretacja zakresu przez generator** — algorytm wybiera dolny kraniec,
   więc pojedynczy wpis 3–5 cm daje układ co 3 cm. ← początkowa hipoteza błędu
3. **Prezentacja diagramu** — stałe znaczniki mogą nachodzić na siebie mimo
   prawidłowych współrzędnych, a różna skala osi może dodatkowo zniekształcać
   odbiór.
4. **Aktualność zapisanego planu** — starszy wynik mógłby nie odzwierciedlać
   obecnego katalogu; wycinek obrazu nie pokazuje stanu planu.

## Hypothesis Investigation

| Hypothesis | Evidence | Verdict |
| --- | --- | --- |
| Wartość katalogowa 3–5 × 20–30 cm błędnie miesza siew z obsadą końcową. | Aktywny katalog zapisuje marchew po przerywce jako 3–5 × 20–30 cm, a siew 2–3 cm osobno ([`crop-catalog.ts:1419–1437`](../../../src/data/crop-catalog.ts)). To samo rozdzielenie przyjęto w researchu. | NONE — etap danych jest rozdzielony. |
| Generator umieszcza sąsiednie marchwie bliżej niż minimum. | Generator wybiera minima zakresu ([`garden-layout.ts:218–227`](../../../src/lib/garden-layout.ts)); kandydaci idą krokami tego rozstawu ([`garden-layout.ts:299–315`](../../../src/lib/garden-layout.ts)). Podane współrzędne różnią się dokładnie o 3 cm, zgodnie z dolną granicą, nie poniżej niej. Obecny test główny nadpisuje rozstawę marchwi syntetycznym 30 × 30 cm ([`garden-layout.test.ts:12–27, 36–43`](../../../src/lib/garden-layout.test.ts)). | NONE dla naruszenia minimum; pokrycie testami danych produkcyjnych jest ograniczone. |
| Ogólny profil marchwi jest zbyt gęsty dla późnej odmiany na większy korzeń. | Użytkownik chce uwzględnić późne odmiany i wskazał minimum 7 cm. Źródła różnicują wczesne/drobniejsze korzenie (3–5 cm) i późniejsze większe (5–8 cm); producent opisuje późną odmianę Dolanka z rozstawą 5–6 cm. Obecny katalog ma jeden ogólny wpis. ([ProstyOgród](https://prosty-ogrod.pl/jak-uprawiac-marchew-podlewanie-pielegnacja-nawozenie-i-zbiory/), [BROS — Dolanka](https://bros.pl/produkt/marchew-jadalna-dolanka/), [`research.md:100, 193`](../garden-crop-catalog-and-layout/research.md)) | STRONG dla braku dopasowania profilu; 7 cm jest ostrożnym wyborem użytkownika, nie uniwersalnym wymogiem wszystkich odmian. |
| Znaczniki diagramu nachodzą na siebie mimo poprawnej geometrii. | Rysunek mapuje osie niezależnie do procentów i używa stałego znacznika 20 px ([`GardenLayoutView.tsx:97–113`](../../../src/components/garden/GardenLayoutView.tsx)). Przy polu 958 × 421 px odstęp 3 cm odpowiada ok. 14,4 px w poziomie i 12,6 px w pionie. Plan Phase 2 sam wskazuje nakładanie przy marchwi co 3 cm i wymaga równej skali cm oraz czytelnego tłoku bez przesuwania centrów ([`plan.md:14, 30, 53`](../garden-crop-catalog-and-layout/plan.md)). | STRONG |
| Zrzut pokazuje nieaktualny plan. | Aplikacja porównuje fingerprint i pokazuje osobny stan „Nieaktualny”, ale status nie występuje w wycinku screenshotu ([`garden.astro:74–123`](../../../src/pages/garden.astro), [`GardenLayoutView.tsx:67–77`](../../../src/components/garden/GardenLayoutView.tsx)). | WEAK — brak danych o stanie tego konkretnego zapisu. |

## Narrowing Signals

- Użytkownik odczytał konkretne centra 85,5 / 88,5 / 91,5 cm; rzeczywisty
  odstęp wynosi zatem 3 cm, a nie tylko „wygląda na mały”.
- Użytkownik uznał ten wynik za prawdopodobnie poprawny dla ogólnego wpisu,
  ale preferuje minimum 7 cm z uwzględnieniem późnych odmian.
- Nie potwierdzono, czy zapisany plan był świeżo wygenerowany. Status „Nieaktualny”
  nie jest widoczny na załączonym wycinku.

## Cross-System Convention

Dotychczasowy kontrakt S-04 mówi o jednym roboczym wariancie rozstawy na
uprawę, ale nie ustala, jak wybierać punkt z zakresu. Implementacja wybiera
dolny kraniec. Jednocześnie zaakceptowany follow-up wymaga równej skali
centymetrów i czytelnego zachowania przy gęstych pozycjach bez przesuwania
rzeczywistych centrów. Research i znalezione źródła pokazują, że odstęp
marchwi zależy od przeznaczenia i wielkości korzenia, więc jeden profil może
nie pasować do późnej marchwi przechowalniczej.

## Reframed (or Confirmed) Problem Statement

> **The actual problem to plan around is**: ogólny profil marchwi wraz z
> wyborem dolnego krańca ustawia rośliny co 3 cm — zgodnie z obecną wartością,
> lecz gęściej niż użytkownik chce dla późniejszych odmian — a stałe znaczniki
> dodatkowo zlewają się na diagramie.

Nie znaleziono dowodu, że generator łamie zapisane minimum 3 cm. Problemem
produktowym jest niedopasowanie jednego ogólnego wpisu marchwi do zamierzonego
przeznaczenia późnych, większych korzeni; 7 cm to preferowany przez użytkownika
bezpieczniejszy punkt dla tego zastosowania, nie reguła dla każdej marchwi.
Oddzielnie diagram musi pozostać czytelny i w skali bez zmiany prawdziwych
współrzędnych.

## Confidence

- **MEDIUM** — odległości i zachowanie kodu są jasne, a źródła potwierdzają
  luźniejszy zakres dla późniejszych/większych korzeni. Nie potwierdzono jednak
  aktualności tego konkretnego zapisu ani nie ustalono, czy katalog ma
  reprezentować wyłącznie późną marchew, czy również wcześniejsze typy.

Przed `/10x-plan` trzeba zdecydować, czy ogólna „marchew” ma przyjąć
bezpieczniejszy profil późny, czy zakres ma rozróżniać przeznaczenie/typ.

## What Changes for `/10x-plan`

Plan powinien potraktować 7 cm jako preferowane minimum dla późnej marchwi
zgodnie z decyzją użytkownika, rozstrzygnąć zakres ogólnego wpisu katalogowego
i zachować rozstawę między rzędami po weryfikacji. Osobno powinien doprowadzić
diagram do prawdziwej skali oraz czytelnej prezentacji gęstych znaczników bez
przesuwania ich centrów.

## References

- Source files: `src/data/crop-catalog.ts:1419–1437,1703–1721`; `src/lib/garden-layout.ts:218–227,275–315`; `src/components/garden/GardenLayoutView.tsx:97–113`; `src/pages/garden.astro:74–123`
- Related research: `context/changes/garden-crop-catalog-and-layout/research.md:100,193`; `context/changes/generate-garden-layout/research.md:73`
- Related decision/contract: `context/changes/generate-garden-layout/plan.md` — follow-up S-04; `context/changes/garden-crop-catalog-and-layout/plan.md:14,30,53`
- Investigation tasks: `01a0f43c-fbcf-7a93-bde3-94f5b557dbad`, `01a0f43c-fd78-7c41-8325-3f1d0af95fb0`, `01a0f43d-00e5-7343-83ae-faa95feef042`, `01a0f43d-03df-7772-8ab4-b66079856940`
