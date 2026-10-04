---
change_id: testing-critical-flow-and-gates
title: Krytyczny przepływ przeglądarkowy i bramki jakości
status: impl_reviewed
created: 2026-10-04
updated: 2026-10-05
archived_at: null
---

## Notes

Open a change folder for rollout Phase 3 of context/foundation/test-plan.md: "Krytyczny przepływ i bramki".
Risks covered: #1 zbyt ciasna obsada/rośliny poza skrzynią; #2 zmiana lub błąd usuwa plan albo oznacza stary jako aktualny; #3 obce konto/anon odczytuje lub zmienia działkę; #4 awaria bazy udaje sukces lub daje nieczytelny błąd; #5 rozmieszczenie narusza priorytety sąsiedztwa/miksu; #6 niepewne dane udają pewne lub uprawa znika bez ostrzeżenia.
Test types planned: e2e + gates.
Risk response intent:
- #1: ręcznie policzone granice i odstępy mieszanych gatunków; wygląd nie dowodzi poprawności. Zachować istniejący dowód unit i objąć przeglądarką tylko brakujące zachowania.
- #2: anulowanie, błąd i zmiana wejść zachowują właściwy plan/status; zweryfikować potwierdzenie i anulowanie utraty planu oraz zapis → generowanie → zmiana → nieaktualność → przeliczenie. HTTP samo nie dowodzi spójności.
- #3: właściciel ma dostęp, inni nie odczytują ani nie zmieniają danych; istniejący dowód DB/API zachować, bez powielania go w e2e.
- #4: awaria nie udaje sukcesu ani pustej działki; sprawdzić widoczny stan interfejsu bez wymyślania fallbacku.
- #5: małe niezależne przykłady odróżniają kompromis od naruszenia priorytetów; nie oceniać estetyki ani globalnego optimum bez kontraktu.
- #6: wynik ujawnia braki i niepewność; nie używać katalogu jako oracle ani snapshotu zamiast niezależnego oczekiwania.
Planować według cost × signal: e2e tylko dla luk niepokrytych taniej. Uwzględnić istniejące unit/API/SQL/smoke i bramki CI. Finalna podfaza uzupełnia §6.5 cookbook; nie przepisywać zamrożonej strategii §1–§5 poza stanem rollout.
After creating the folder, follow the downstream continuation rule: research → plan → implement.
