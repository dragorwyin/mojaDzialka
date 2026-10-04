# Błędy wykryte podczas testowania bezpiecznego zapisu

## MD-GARDEN-API-001: Uszkodzony multipart przerywa zapis przestrzeni wyjątkiem

- **Proponowany change-id:** `garden-space-malformed-form-handling`.
- **Status:** resolved-here — minimalna poprawka w Phase 2 zmiany `testing-safe-garden-storage`.
- **Skutek użytkowy:** niepoprawne żądanie zapisu przestrzeni omija kontrolowaną ścieżkę błędu formularza; handler odrzuca wywołanie wyjątkiem zamiast zwrócić przekierowanie. Test handlera nie ustala wyglądu strony błędu ani odpowiedzi adaptera produkcyjnego.
- **Warunki:** rozpoznany zalogowany użytkownik; POST `/api/garden`; `Content-Type: multipart/form-data` bez wymaganego boundary; body `truncated multipart`. Nie są potrzebne sekrety ani rzeczywista baza do reprodukcji w teście: mock zastępuje wyłącznie klienta Supabase, Request i parser pozostają rzeczywiste.

### Reprodukcja i dowód

Komenda: `npm run test:api -- src/pages/api/garden.test.ts -t "rejects malformed multipart without attempting a write"`.

Test `src/pages/api/garden.test.ts` tworzy rzeczywisty Request z opisanym nagłówkiem/body i wywołuje rzeczywisty POST. Na bazowym kodzie commita `e66fa2b` test kończy się `TypeError: Failed to parse body as FormData.` w `src/pages/api/garden.ts:33`. Pierwszy przebieg nowego zestawu: 32 passed, 1 failed (33 testy w trzech plikach).

- **Expected:** HTTP 302, `Location: /garden?error=invalid_spaces`; bez wywołania RPC i bez sygnału sukcesu.
- **Actual przed poprawką:** odrzucona obietnica handlera z TypeError podczas `request.formData()`.
- **Potwierdzona przyczyna:** odczyt FormData przed walidacją pól nie miał obsługi wyjątku. Analogiczny parser JSON upraw już obsługuje błąd w `src/pages/api/garden-crops.ts:30`.

### Poprawka i weryfikacja

W `src/pages/api/garden.ts:33` odczyt formularza otrzymał try/catch zwracający istniejący kod `invalid_spaces`. Nie zmieniono kontraktu zapisu ani walidacji pól. Zawodzący test pozostaje bez osłabienia oczekiwań i sprawdza także brak próby zapisu.

- **Test regresyjny:** `garden space POST > rejects malformed multipart without attempting a write`.
- **Weryfikacja końcowa:** 33/33 testy API w trzech plikach; 88/88 dotychczasowych testów unit; lint, Astro check (61 plików, zero błędów i ostrzeżeń) oraz build przechodzą. Kontrolowane usunięcie try/catch ponownie wywołało opisany TypeError i czerwony test regresyjny; po przywróceniu poprawki cały zestaw API znów przechodzi. Build zachowuje wcześniejsze ostrzeżenie integracji sitemap o braku konfiguracji site.

### Handoff do 10x flow

Ten błąd jest naprawiony tutaj. Nie otwierać kolejnej zmiany do tej samej poprawki. Jeśli błąd powróci albo pojawi się pokrewny przypadek, użyć poniższego briefu wraz z niniejszą reprodukcją:

```text
/10x-new garden-space-malformed-form-handling Kontrolowana obsługa błędnego body formularza zapisu przestrzeni; reprodukcja i wcześniejsza poprawka: context/changes/testing-safe-garden-storage/bugs.md, MD-GARDEN-API-001
/10x-research garden-space-malformed-form-handling
```

Research powinien sprawdzić aktualną obsługę parsera i odpowiedź rzeczywistego adaptera HTTP przed planowaniem dalszych zmian. Sam wyjątek handlera nie dowodzi wycieku danych ani utraty planu.
