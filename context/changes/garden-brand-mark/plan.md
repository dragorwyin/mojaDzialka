# Botaniczny znak marki i czytelne nazwy sekcji — plan

## Contract

- Widok: nagłówek dashboardu i osadzone w nim sekcje wyboru upraw oraz planu ogrodu; favicon korzysta z tego samego znaku.
- Wartości: istniejące jasne role `app-soft`, `app-border`, `app-accent` i `app-accent-strong` z `src/styles/global.css`.
- Komponenty: użyć wspólnego statycznego SVG; zachować istniejący współdzielony `Topbar.astro` i nie tworzyć nowego prymitywu UI.

## Faza 1: Znak i nazwy widoczne w aplikacji

### Zakres

- Dodać czytelny w małym rozmiarze znak kiełka wyrastającego z grządki jako `public/garden-mark.svg`.
- Wstawić ten asset obok nazwy aplikacji w `Topbar.astro`, zachowując nazwę dostępną i widoczny fokus linku.
- Ustawić `garden-mark.svg` jako favicon w `Layout.astro` i usunąć odwołanie do starterowego faviconu.
- Zastąpić etykiety „S-03”/„S-04” krótkimi, naturalnymi opisami sekcji.

### Kryteria odbioru

- W nagłówku publicznym i dashboardzie logo oraz nazwa są wyrównane i czytelne na telefonie oraz desktopie.
- Favicon pokazuje ten sam znak roślinny.
- Sekcje pokazują „Dobierz uprawy” i „Gotowy plan”; w widoku nie ma roboczych kodów S-03/S-04.
- Istniejące semantyczne tokeny zachowują paletę; link marki ma stan hover i widoczny focus klawiatury.

### Matryca stanów UI

- Default — nagłówek z marką na stronie publicznej oraz dashboardzie.
- Hover — link marki i linki logowania zmieniają stan przy użyciu istniejących tokenów.
- Focus-visible — widoczny fokus linku marki i elementów nawigacji.
- Disabled — N/A: nagłówek marki i nawigacja nie mają stanu disabled.
- Error — N/A: błąd formularza nie zmienia marki ani nazw tych sekcji.
- Empty — N/A: brak danych ogrodu nie zmienia nagłówka ani tytułów.
- Loading — N/A: ładowanie planu nie zmienia nagłówka ani faviconu.

### Weryfikacja

- `npm run build`
- Screenshot publicznego nagłówka i dashboardu na desktopie oraz mobilnym viewportcie; potwierdzenie ikony favicon w przeglądarce.

## Progress

### Phase 1: Znak i nazwy widoczne w aplikacji

#### Automated

- [x] 1.1 `npm run build` przechodzi.
- [x] 1.2 Nie ma roboczych etykiet S-03/S-04 w renderowanych sekcjach.

#### Manual

- [x] 1.3 Użytkownik ręcznie sprawdził zmianę na produkcji i zaakceptował ją („jest git”).
