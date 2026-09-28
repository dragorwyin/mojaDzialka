<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Deklarowanie udziałów upraw w procentach

- **Plan**: `context/changes/declare-crop-mix-percentages/plan.md`
- **Scope**: Phase 1 of 1 / Full plan
- **Reviewed phases**: 1
- **Date**: 2026-09-28
- **Verdict**: APPROVED
- **Findings**: 0 critical, 1 warning, 1 observation

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | PASS |
| Safety & Quality | PASS |
| Architecture | PASS |
| Pattern Consistency | PASS |
| Success Criteria | PASS |

## Findings

### F1 — Positive legacy weights can normalize to zero

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Plan Adherence
- **Location**: `src/lib/garden-crop-percentages.ts:32`; `src/components/garden/CropSelectionForm.tsx:69`
- **Detail**: Largest-remainder normalization can allocate `0.00%` to an extremely small but positive saved weight (for example, `[0.00001, 1]` becomes `[0, 100]`). The form then rejects the unchanged selection because every share must be positive, so the user cannot save the loaded selection without editing or removing that crop. The unit tests cover tie-breaking and exact totals but not this edge case.
- **Fix**: Ensure every positive input receives at least one hundredth of a percentage point when the selected-crop count makes that feasible, then distribute the remaining hundredths deterministically; add a regression test for a highly skewed positive mix.
  - Strength: Keeps a valid loaded selection editable and saveable while retaining an exact 100.00% total.
  - Tradeoff: Very small shares are rounded up to 0.01%, so the displayed ratio is necessarily less exact.
  - Confidence: HIGH — the current validator rejects zero hundredths, and the allocation example follows directly from the implementation.
  - Blind spot: No evidence that existing user data currently contains such an extreme ratio.
- **Decision**: FIXED — added deterministic minimum 0.01% allocation for positive weights when feasible, with a regression test for `[0.00001, 1]`.

### F2 — S-04 research documents are bundled with the Phase 1 commit

- **Severity**: ℹ️ OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Scope Discipline
- **Location**: `context/changes/generate-garden-layout/change.md` (also `frame.md` and `research.md`)
- **Detail**: Commit `bee764e` includes three S-04 planning/research documents that are not listed in this change's plan. They add no runtime behavior and their inclusion was explicitly authorized when the user asked to stage everything; this is a scope note, not an unauthorized change.
- **Fix**: Leave the already-pushed history intact; keep the future S-04 implementation in its own change and commit.
- **Decision**: ACCEPTED — intentionally included per the user's earlier “stage all” instruction; keep future S-04 implementation in its own change and commit.

## Verification

- `npm run test:unit` — PASS, 40 tests across 4 files.
- `npm run build` — PASS. Existing Astro sitemap warning: `site` is unset, so sitemap generation is skipped.
- `npm run smoke` — PASS, all 26 steps.
- Manual checks 1.4–1.7 are marked complete in the plan; the user confirmed the behavior, desktop/mobile screenshots were captured, and the production preview returned 404 for the development route.
- Post-triage fix: `npm run test:unit` — PASS, 41 tests; `npm run build` — PASS with the same sitemap warning.
- Post-triage lint was not verified: both workspace and targeted ESLint runs remained without output and were stopped after extended runtime.
