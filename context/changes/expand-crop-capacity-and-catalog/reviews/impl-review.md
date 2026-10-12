<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Większa obsada ogrodu i rozszerzony katalog upraw

- **Plan**: `context/changes/expand-crop-capacity-and-catalog/plan.md`
- **Scope**: Full plan (phases 1, 2, 3)
- **Reviewed phases**: 1, 2, 3
- **Date**: 2026-10-12
- **Verdict**: APPROVED
- **Findings**: 0 critical, 0 warnings, 1 accepted observation

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

### F1 — E2E diagram selectors target the old dialog and wrong role

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: `tests/e2e/grouped-plan.spec.ts:8-10,164-166,193-206`
- **Detail**: The original test used `g[role="img"]` and a modal dialog, while current selectable markers use `g[role="button"]` in a persistent canvas. The targeted E2E run initially failed all four desktop/mobile cases.
- **Fix**: Updated the test to inspect the inline canvas, compare position details and saved metadata after reload, and use the right-side zoom controls.
- **Decision**: FIXED — current targeted E2E passes all four desktop/mobile cases.

### F2 — Overview can render an unbounded number of small markers at high zoom

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality
- **Location**: `src/components/garden/GardenLayoutView.tsx:440-445`
- **Detail**: Overview cells previously shrank on screen with each zoom step, allowing a dense viewport to expand into a very large number of SVG markers before detail mode engaged.
- **Fix**: Keep a 32-pixel target cell at each zoom and coarsen cells adaptively until overview emits at most 500 markers. Detail mode remains available when no more than 500 positions are visible; a unit test confirms 10,000 source positions remain represented.
- **Decision**: FIXED — bounded projection test and desktop/mobile E2E pass.

### F3 — Full persistence acceptance does not compare exact round-trip data

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Success Criteria
- **Location**: `tests/e2e/grouped-plan.spec.ts:181-226`
- **Detail**: Previously, API/RPC serialization, JSONB storage and E2E reload were covered separately, without asserting exact saved position fields through the full dashboard path.
- **Fix**: E2E now compares every position’s crop and coordinates, exact position counts, input fingerprint and generation time after reload at the accepted browser scale (~2,000). The 10,000-position database test now compares the full JSONB position array and allocation payload against its expected value; API decoder coverage remains in place.
- **Decision**: FIXED — unit/API, database and targeted E2E suites pass.

### F4 — Separate untracked change directory is outside this plan

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Scope Discipline
- **Location**: `context/changes/garden-bed-visuals-tabs/`
- **Detail**: This new, untracked directory does not belong to `expand-crop-capacity-and-catalog`. The remaining modified source/test files are related to the current plan.
- **Fix**: Leave the directory unstaged and preserve it for its own change.
- **Decision**: ACCEPTED — left outside this change; no staging or edits.

### F5 — Preview performance measurement lacks reproducible configuration

- **Severity**: ℹ️ OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: `context/changes/expand-crop-capacity-and-catalog/reviews/phase-1-manual-acceptance.md:5-7`
- **Detail**: The user confirmed that the ≥10,000-position generation met the ≤10-second limit in a preview/Workers-like environment, but the acceptance note explicitly says the runtime and configuration were not provided. The local 20,000-position Vitest timing is correctly identified as separate evidence and does not reproduce the preview result.
- **Fix**: If the preview runtime/configuration is available, append it to the manual acceptance note; otherwise retain the user-confirmed acceptance and mark reproducibility details unavailable.
- **Decision**: ACCEPTED — user confirmed the preview/Workers ≤10-second result; exact runtime details were not provided and were not fabricated.

## Verification

- `npm run test:unit` — PASS, 11 unit files / 127 tests and 3 API files / 34 tests.
- `npm run test:db` — PASS, 5 SQL files / 154 assertions, including the exact 10,000-position JSONB and allocation comparison.
- `npm run test:e2e -- tests/e2e/grouped-plan.spec.ts --workers=1` — PASS, all 4 desktop/mobile cases; verifies exact position details and fingerprint after reload and zoom interaction.
- `npm run lint` — PASS; UI token scan and ESLint completed without diagnostics. Targeted ESLint also passes after the final test-helper adjustment.
- `npx astro check` — PASS, 83 files / 0 errors, warnings or hints. `tsconfig.json` now excludes generated Playwright reports/results from type-aware checks.
- `npm run build` — PASS; Astro server build completed. Sitemap emitted its existing missing-`site` warning.
- `git diff --check` — PASS; only line-ending normalization warnings were printed.
- Manual desktop and touch Surface checks — accepted by the user and recorded in plan progress item 3.6.

The separate `context/changes/garden-bed-visuals-tabs/` directory remains untouched and outside this change.
