# Research — garden-brand-mark

## Scope

Audyt `/dashboard`: wspólnego nagłówka marki, nazw widocznych sekcji planowania upraw i układu ogrodu oraz faviconu używanego przez layout.

## Findings

1. `src/components/Topbar.astro:8-12` renderuje nazwę „moja działka” jako sam tekst, bez znaku graficznego. Ten sam komponent jest importowany przez publiczny widok (`src/components/Welcome.astro:2,8`) i dashboard (`src/pages/dashboard.astro:5,142`), więc zmiana zachowuje wspólną tożsamość nagłówka.
2. `src/layouts/Layout.astro:19` wskazuje obecnie `public/favicon.png`; inspekcja obrazu pokazała starterowy znak 10x, nie markę produktu.
3. `src/components/garden/CropSelectionForm.tsx:304` i `src/components/garden/GardenPlanner.tsx:159` wyświetlają techniczne identyfikatory „S-03” i „S-04” nad treścią sekcji, bez widocznej dla użytkownika funkcji.
4. `src/styles/global.css:5-20` zawiera istniejące role kolorów `--app-soft`, `--app-border`, `--app-accent` i `--app-accent-strong`. Nowy znak może użyć tych samych wartości; nie ma potrzeby dodawać drugiej palety ani komponentu UI.
5. `src/components/ui` zawiera współdzielony `Button`, ale nie ma komponentu logo. Jeden dostępny, statyczny asset SVG może być współdzielony przez nagłówek i favicon, bez tworzenia lokalnych duplikatów.

## Charges

- `src/components/Topbar.astro:8-12` — brak znaku marki osłabia rozpoznawalność aplikacji w nagłówku.
- `src/layouts/Layout.astro:19` — favicon 10x pokazuje markę startera zamiast Mojej Działki.
- `src/components/garden/CropSelectionForm.tsx:304` oraz `src/components/garden/GardenPlanner.tsx:159` — kody faz wyglądają jak wewnętrzna dokumentacja i odciągają uwagę od zadań użytkownika.

## Design contract

Jeden prosty znak: kiełek nad grządką, w spokojnej zieleni na jasnym, miękkim tle. Wartości odpowiadają istniejącym tokenom w `src/styles/global.css`; jeden plik SVG jest używany i w nagłówku, i jako favicon. Nazwy sekcji pozostają opisowe i po polsku, bez kodów faz.
