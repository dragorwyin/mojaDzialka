<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Wybór warzyw i proporcji

- **Plan**: context/changes/select-crops-and-proportions/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2
- **Date**: 2026-09-27
- **Verdict**: NEEDS ATTENTION
- **Findings**: 0 critical, 1 warning, 0 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | PASS |
| Safety & Quality | WARNING |
| Architecture | PASS |
| Pattern Consistency | PASS |
| Success Criteria | PASS |

## Verification

- `npm run test:db` — PASS (62 tests)
- `npm run test:unit` — PASS (19 tests)
- `npx astro check` — PASS (0 errors, warnings, or hints)
- `npm run lint` — PASS
- `npm run build` — PASS (non-blocking Astro sitemap warning: `site` is not configured)
- `npm run smoke` — PASS after starting the preview server; all smoke steps passed.
- Post-fix: `npx astro check` — PASS (0 errors, warnings, or hints); `npm run test:unit` — PASS (19 tests); `npm run build` — PASS (same non-blocking sitemap warning).
- Manual acceptance items in plan Progress are marked complete; user's confirmation was recorded in the completed progress rows.

## Findings

### F1 — Garden read failure can make saved crops appear empty and allow clearing them

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision. Fix is obvious and narrowly scoped.
- **Dimension**: Safety & Quality
- **Location**: src/pages/garden.astro:35-37, 88-89
- **Detail**: When the initial `gardens` query fails, the page sets `loadError` but leaves `cropsLoadError` false and `initialCrops` empty. The crop form therefore appears available with an empty selection. Its save endpoint accepts an empty list, which intentionally clears the stored selection. If the user saves while the initial read is failing, previously saved crops can be deleted without the page communicating that the crop data could not be loaded. The plan explicitly allows an empty list to clear a selection, so the problem is the unavailable-read state being presented as a valid empty state.
- **Fix**: When the `gardens` query fails, also mark crop selection unavailable (or otherwise prevent saving until the initial crop state can be read), so an empty fallback cannot be submitted as an intentional clear.
  - **Strength**: Preserves the existing explicit-clear behavior while preventing a failed read from being mistaken for an empty selection.
  - **Tradeoff**: The crop form is temporarily unavailable whenever its parent garden read fails.
  - **Confidence**: HIGH — the page currently passes `cropsLoadError` to the form, and an empty POST is confirmed as a supported destructive operation.
  - **Blind spot**: The exact user-facing recovery message for this combined failure state was not separately reviewed.
- **Decision**: FIXED — Set `cropsLoadError` when the parent garden read fails, reusing the form's existing unavailable alert and disabled controls. Verified with Astro check, unit tests, and build on 2026-09-28.
