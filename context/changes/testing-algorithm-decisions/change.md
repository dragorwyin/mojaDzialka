---
change_id: testing-algorithm-decisions
title: Poprawność decyzji algorytmu rozmieszczenia roślin
status: implementing
created: 2026-10-04
updated: 2026-10-04
archived_at: null
---

## Notes

Open a change folder for rollout Phase 1 of context/foundation/test-plan.md: "Poprawność decyzji algorytmu".
Risks covered: #1 zbyt małe odstępy lub rośliny poza skrzynią; #5 naruszenie priorytetów sąsiedztwa/globalnego miksu; #6 niepewne dane udają pewne lub uprawa znika bez ostrzeżenia.
Test types planned: unit + contract.
Risk response intent:
- #1: Udowodnić granice i odstępy na niezależnie, ręcznie policzonych przykładach, także między gatunkami; nie kopiować obliczeń generatora do oczekiwań.
- #5: Małe przypadki mają odróżnić poprawny kompromis od naruszenia priorytetów. Zbadać cebulę i marchew zagęszczone w narożniku przy brokułach w reszcie skrzyni. Sam wygląd nie dowodzi błędu; nie wymagać równomierności ani globalnego optimum bez kontraktu. Wyjaśnienie decyzji ma służyć weryfikacji, bez dodawania funkcji do UI.
- #6: Wynik ma jawnie ujawniać brak rozstawy i niepewność; aktualny katalog nie jest niezależnym oracle.
Priorities: ograniczony czas, kosmetyka poza zakresem. Wykorzystać istniejące testy po zbadaniu ich ochrony. Opcjonalny przegląd AI proponuje kontrprzykłady, ale nie rozstrzyga poprawności odległości.
Each rollout plan must finish by updating the relevant §6 cookbook patterns with location, naming, reference test and local run command. Follow cost × signal.
After creating the folder, follow the downstream continuation rule: suggest /10x-research with the query and output path for this change, then /10x-plan and /10x-implement as their stages complete. Return to /10x-test-plan for corrections or after rollout Phase 1 completes.
