# Tokeny ilustracji skrzynki — wariant z góry

Źródło kierunku i próbek: zaakceptowany wariant 01 w `concepts.svg` oraz jego interaktywny kontekst w `index.html`. Wartości są przeznaczone dla diagramu skrzynki; ogólne powierzchnie i akcenty nadal korzystają z ról `app-*` / `garden-*` w `src/styles/global.css`.

| Rola | Token Tailwind | Wartość | Użycie |
| --- | --- | --- | --- |
| Drewno skrzynki | `garden-bed-frame` | `var(--app-soil)` (`#b08a62`) | Główna, stonowana drewniana rama; ponownie wykorzystuje istniejący kolor ziemi/drewna aplikacji. |
| Jaśniejsza krawędź drewna | `garden-bed-frame-highlight` | `#d6a36b` | Światło na górnej krawędzi ramy. |
| Cień ramy | `garden-bed-frame-shadow` | `#8c5b35` | Boczne/niższe krawędzie budujące czytelną, ale płaską bryłę z góry. |
| Ziemia | `garden-bed-soil` | `#70543b` | Wypełnienie wnętrza skrzynki. |
| Delikatna faktura ziemi | `garden-bed-soil-texture` | `#c5a27d` | Niski kontrastowy detal faktury, nie konkurujący z roślinami. |

Surowe wartości pochodzą z kolorów drewna, ziemi i wzoru tekstury widocznych w zaakceptowanym wariancie z góry. Są zdefiniowane w `:root` i udostępnione jako semantyczne role przez `@theme inline` w `src/styles/global.css`; komponenty nie wpisują tych kolorów bezpośrednio.

Pozostałe kolory ilustracji upraw pozostają w istniejącym crop atlasie. Ta faza dodaje wyłącznie role potrzebne do warstwy skrzynki i nie zmienia jeszcze produkcyjnego diagramu.
