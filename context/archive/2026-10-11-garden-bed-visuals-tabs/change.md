---
change_id: garden-bed-visuals-tabs
title: Czytelne skrzynie i działające zakładki ogrodu
status: archived
created: 2026-10-11
updated: 2026-10-11
archived_at: 2026-10-11T13:12:06Z
---

## Notes

Poprawić jeden widok: dashboard ogrodu, ze szczególnym naciskiem na czytelne skrzynie i działające zakładki „Mój ogród”, „Sektory” i „Warzywa”. Kierunkiem zatwierdzonym przez użytkownika jest rzut z góry z rozpoznawalnymi roślinami. Zachować istniejącą geometrię pozycji, mobilne powiększenie, linki URL i przepływy zapisu.

**Design-system contract:** rozszerzać semanticzne role w `src/styles/global.css` i używać współdzielonych prymitywów z `src/components/ui`; dashboardowa warstwa ilustracyjna nie dodaje lokalnej palety ani równoległych komponentów. Zasada UI w `AGENTS.md` już nakazuje tokeny, współdzielone komponenty i użycie `src/pages/dev/garden-planner-kitchen-sink.astro`.
