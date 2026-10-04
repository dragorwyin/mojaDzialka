# Końcowa weryfikacja — Phase 3

Data: 2026-10-04. Środowisko: lokalny Supabase na 127.0.0.1:54321, własny preview na localhost:4322 (4321 był zajęty).

- `npm run test:unit`: PASS; 94 przypadki w 8 plikach unit, następnie 33 przypadki API w 3 plikach. Dodatkowy ósmy plik unit pochodzi z równoległej zmiany sezonowej; faza zachowuje listę testów i dodaje wykonanie API.
- `npm run test:db`: PASS, reset lokalnej bazy, 151 asercji w 5 plikach.
- `npm run lint`: PASS. Wcześniejszy błąd równoległego SeasonWorkSchedule nie wystąpił w tym przebiegu. Decyzja o zamknięciu F1 raportu Phase 2 pozostaje odłożona do zakończenia równoległych prac.
- `npx astro check`: PASS, 65 plików, zero błędów, ostrzeżeń i hints.
- `npm run build`: PASS po ponowieniu. Pierwszy przebieg zatrzymał się na ładowaniu source-map-js (`require is not defined`); bez zmiany kodu kolejny zakończył się poprawnie. Pozostało istniejące ostrzeżenie sitemap o braku `site`.
- `BASE_URL=http://localhost:4322 npm run smoke`: wszystkie kroki PASS, w tym sesje, prywatność drugiego konta, zapis, strukturalne unieważnienie, stale i przeliczenie.
- Deliberate break: tymczasowe wymaganie HTTP 999 zamiast 302 w teście API spowodowało pięć awarii i kod 1 całej komendy test:unit mimo przejścia unit. Plik przywrócono automatycznie; potwierdza to brak maskowania błędów API przez wspólną bramkę.
- Cookbook §6.3–§6.4 wskazuje istniejące testy, komendy i granice dowodów. Rollout §3 Phase 2 wskazuje tę zmianę jako complete.

Nie dodano YAML, nowych zależności ani testów przeglądarkowych. Anulowanie UI i harmonogram równoległych transakcji pozostają poza zakresem dowodu.
