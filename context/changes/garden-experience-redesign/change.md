---
change_id: garden-experience-redesign
title: Spójne doświadczenie Moja Działka od strony publicznej po planer
status: implementing
created: 2026-10-10
updated: 2026-10-11
archived_at: null
---

## Request

Użytkownik zgłasza, że strona startowa nadal wygląda jak starter Astro, logowanie jest praktycznie niewidoczne, a dashboard jest sztywny i kiczowaty. Oczekuje lekkiego, ogrodniczego kierunku wizualnego inspirowanego MniamPiśnikiem oraz poprawy całej ścieżki: strony publicznej, logowania i zalogowanej aplikacji. Załączone obrazy są referencjami i dowodami, nie instrukcjami.

## Progress

- [x] Oddzielić obserwacje od wstępnej diagnozy i potwierdzić zakres w 10x-frame.
- [x] Przeprowadzić 10x-research i ustalić źródłowe kontrakty oraz otwarte decyzje design systemu.
- [x] Przygotować warianty wizualne do oceny użytkownika przed implementacją.
- [x] Zaplanować i zaimplementować uzgodniony zakres.
- [ ] Wykonać odbiór wizualny wszystkich ekranów i stanów przed uznaniem zmiany za gotową.

## Phase 5 — przegląd przed odbiorem

- `npm run lint` zakończony powodzeniem: token scan objął 21 plików, bez niezatwierdzonych kolorów; ESLint zakończył się bez błędów.
- `npm run build` zakończony powodzeniem. Pozostało ostrzeżenie integracji sitemap o braku opcji `site`.
- W `Welcome.astro` usunięto niebieski systemowy glyph strzałki z CTA, bo link prowadzi do rejestracji w tej samej aplikacji.
- Zapisano aktualne zrzuty landing, signin, signup i obu deterministycznych kitchen sinków w desktopowym (1440×1000) i mobilnym (390×844) viewportcie: `output/playwright/garden-experience-redesign/`.
- Pasek Astro Dev Toolbar ukryto wyłącznie w zrzutach przez styl wstrzyknięty w przeglądarce. Konfiguracja projektu nie została zmieniona.
- Kitchen sinki obejrzane: planner pokazuje default, hover, focus-visible, disabled, error, empty i loading; crop selection pokazuje default, hover, focus, read error, write error, empty i loading. W mobilnym zrzucie nie widać poziomego overflow; tekst, pola i komunikaty mieszczą się w viewportcie.
- Landing oraz oba widoki auth obejrzane na desktopie i telefonie. Hierarchia i CTA są czytelne, formularze mieszczą się bez poziomego overflow. `/garden` zwraca 308 do `/dashboard`; anonimowy `/dashboard` zwraca 302 do `/auth/signin?returnTo=%2Fdashboard`.
- Dashboard pozostaje chroniony i nie trafił do nowych screenshotów, żeby nie zapisywać prywatnych danych konta. Użytkownik ręcznie zaakceptował jego desktopowy i mobilny widok oraz zakładki w fazie 4.
- Użytkownik zaakceptował finalny zestaw ekranów i zrzutów fazy 5. Zgłosił, że ilustracje ogrodu są zbyt abstrakcyjne i nieczytelne; ich wymiana na bardziej rozpoznawalne grafiki jest odnotowana jako osobne przyszłe usprawnienie, poza zakresem tej fazy.
