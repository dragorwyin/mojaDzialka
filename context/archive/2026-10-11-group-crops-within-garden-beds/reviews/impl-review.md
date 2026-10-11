<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Group crops within garden beds

- **Plan**: `context/changes/group-crops-within-garden-beds/plan.md`
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3
- **Date**: 2026-10-11
- **Verdict**: NEEDS ATTENTION
- **Findings**: 0 critical, 3 warnings, 0 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | WARNING |
| Scope Discipline | PASS |
| Safety & Quality | WARNING |
| Architecture | PASS |
| Pattern Consistency | PASS |
| Success Criteria | WARNING |

## Findings

### F1 — E2E does not cover the planned constrained multi-bed scenario

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Success Criteria
- **Location**: `tests/e2e/fixtures/garden.ts:42-55`; `tests/e2e/grouped-plan.spec.ts:87-98`
- **Detail**: Phase 3 requires a generated multi-bed plan with a constrained partial crop through save/read/dashboard. The fixture creates one 120×80 cm bed and two equal-proportion crops. The test only checks shortfall rendering conditionally, so it can pass without exercising any deficit. This leaves the central constrained, multi-bed user flow unverified end to end.
- **Fix**: Add a deterministic E2E setup with at least two beds and a guaranteed partial allocation, then assert the expected crop deficit for the affected bed and garden summary.
  - Strength: Directly covers the Phase 3 contract and cannot silently skip the shortfall path.
  - Tradeoff: Requires a constrained fixture that remains stable across generator changes.
  - Confidence: HIGH — the current fixture and conditional assertions demonstrate the coverage gap.
  - Blind spot: The deterministic constraint may need tuning if placement heuristics change.
- **Decision**: FIXED — approved by the user; deterministic two-bed partial-allocation fixture now asserts the expected per-bed and garden deficits.

### F2 — E2E does not verify persisted allocation values after reload

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Plan Adherence
- **Location**: `tests/e2e/grouped-plan.spec.ts:62-75,81-98`
- **Detail**: Allocation counts are validated from the initial POST response before reload. After reload, the test compares visible marker labels, but shortfall expectations still use the original in-memory `plan`. It therefore does not establish that per-bed allocations and missing counts survive saved-plan read and dashboard hydration, as Phase 3 specifies.
- **Fix**: After reload, assert the persisted plan's per-bed allocations and exact deficit values from the dashboard's loaded state or visible summary.
  - Strength: Verifies the serialization/read boundary and the reported values users actually see.
  - Tradeoff: Requires a stable way to observe loaded allocation data in the E2E flow.
  - Confidence: HIGH — current post-reload assertions inspect positions only and source deficit expectations from pre-reload data.
  - Blind spot: The E2E does not currently expose a dedicated loaded-plan API helper.
- **Decision**: SKIPPED — user accepted the post-reload exact position and shortfall assertions plus Phase 2 allocation round-trip coverage; no separate assertion against Astro's internal SSR serialization format.

### F3 — Unknown-allocation explanation disappears when there are no known deficits

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision. Fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: `src/components/garden/GardenLayoutView.tsx:504-523`
- **Detail**: The explanation for `shortfalls.hasUnknownAllocations` is nested inside a section rendered only when `shortfalls.byCrop.length > 0`. A legacy or unprocessed plan with no known positive deficits has `hasUnknownAllocations === true` but no `byCrop` entries, so the UI hides the uncertainty signal. The migration notes require unknown allocations to remain unknown and preserve the incomplete-data signal.
- **Fix**: Render the unknown-allocation note whenever `hasUnknownAllocations` is true, independently of whether known deficits exist.
- **Decision**: FIXED — approved by the user; the incomplete-allocation notice now renders independently of known deficits, with a regression test for a legacy bed and no known shortfalls.

## Review Evidence

- Phase 1: MATCH. Generator uses the prior allocation as per-bed/per-crop targets, performs a bounded grouped placement pass, and retains constraints. Regression coverage checks grouping, partial placement, determinism, companions, spacing, and prohibited neighbors.
- Phase 2: MATCH. Per-bed allocation parsing and shortfall aggregation preserve legacy plans; the view shows known per-bed and garden deficits without changing positions.
- Scope: no runtime changes outside the plan's feature boundary were found in the feature commits.
- Manual acceptance: the user confirmed the saved dashboard plan and shortfall display looked correct during the implementation flow.
- Automated verification: `npm run test:unit` passed (105 unit + 33 API tests); `npm run test:e2e` passed (24 tests across desktop and mobile); `npm run lint` passed; `npm run build` passed. Build emitted the existing Astro sitemap warning that `site` is not configured and the sitemap was skipped.
- F1 triage verification: the focused grouped-plan E2E passed in desktop and mobile projects; Prettier and ESLint passed for the touched E2E files; `git diff --check` passed.
- F3 triage verification: `npx vitest run --config vitest.unit.config.ts src/lib/garden-layout-view.test.ts` passed (3 tests); targeted ESLint and Prettier passed for the touched view and test; `git diff --check` passed.
- Working tree: the unrelated garden-experience review and `.playwright-cli/` were left untouched. Two screenshots regenerated by E2E were restored because they were clean before this review.
