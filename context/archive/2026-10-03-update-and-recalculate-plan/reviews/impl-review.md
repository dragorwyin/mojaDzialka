<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Zmiana danych i ponowne przeliczenie planu

- **Plan**: `context/changes/update-and-recalculate-plan/plan.md`
- **Scope**: Phase 1 of 1
- **Reviewed phases**: 1
- **Date**: 2026-10-04
- **Verdict**: APPROVED
- **Findings**: 0 critical, 0 warnings, 1 observation

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

### F1 — Concurrent regeneration can restore a deleted plan

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality
- **Location**: `src/pages/api/garden-plan.ts:62`
- **Detail**: The generation endpoint reads spaces and crops, calculates a plan, then upserts it at lines 118–127 without locking the garden row or verifying that the inputs still match. The new `save_garden_spaces` function locks the garden row and deletes the plan on structural changes (`supabase/migrations/20261003120000_preserve_garden_space_ids_and_clear_plan.sql:29-33,112-115`). If generation reads first, a structural save deletes the existing plan, and generation finishes afterward, the upsert can recreate a plan from the old snapshot. SSR should mark it stale by fingerprint, so it is not shown as current, but the structural-change contract says the saved plan is removed.
- **Fix**: Serialize generation with structural saves by using the same garden-row lock around input read and plan write, or add a final input-fingerprint/version check that prevents saving when the inputs changed during generation.
  - Strength: Prevents a stale generation from undoing the structural save's plan deletion.
  - Tradeoff: Requires coordinating the read/generate/write boundary; locking for the full generation may hold a transaction open during expensive work.
  - Confidence: HIGH — the current read-then-upsert sequence and the RPC lock/delete are visible in the cited code.
  - Blind spot: The exact transaction/API shape depends on the Supabase RPC contract and should be designed before implementation.
- **Decision**: FIXED — Approved optimistic input-revision guard. Input saves advance the revision, and the final plan RPC locks the garden row and rejects an outdated revision before upsert.

### F2 — Form cancellation and structural removal lack automated flow coverage

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision. Fix is obvious and narrowly scoped.
- **Dimension**: Plan Adherence
- **Location**: `src/components/garden/GardenSetupForm.tsx:63`
- **Detail**: The form correctly detects add/remove and calls `preventDefault()` when confirmation is cancelled. The plan's Testing Strategy calls for automated coverage of the form's structural-change signal and preservation of edits on cancellation, but this phase added no such unit/component test. SQL tests cover structural removal, while the smoke test checks structural addition but not removal. The user manually confirmed the relevant behaviors, and the data-level contract has SQL coverage; this is a regression-coverage gap rather than evidence the UI is currently broken.
- **Fix**: Add a focused form test for confirmation cancellation (no POST and edits retained), plus a smoke step for removing one of multiple spaces and confirming the plan is cleared.
- **Decision**: FIXED — Extracted the structural-change confirmation decision into a tested helper, wired it to prevent form submission on cancellation, and added smoke coverage for removing one space, clearing the saved plan, and regenerating a current plan from the retained space.

### F3 — Destructive database wrapper was not rerun

- **Severity**: ℹ️ OBSERVATION
- **Impact**: 🏃 LOW — quick decision. Fix is obvious and narrowly scoped.
- **Dimension**: Success Criteria
- **Location**: `package.json` (`test:db` script)
- **Detail**: The plan names `npm run test:db`, whose script runs `supabase db reset --local --no-seed` before pgTAP and would erase the local database. That wrapper was not run. Instead, `npx supabase test db` ran against the existing local database without resetting it and passed all 102 tests.
- **Fix**: No code change required. Keep using the non-resetting command for review verification, or run the wrapper only against a disposable local database.
- **Decision**: ACCEPTED — The non-resetting `npx supabase test db` path passed all 102 database tests. The destructive `npm run test:db` wrapper remains intentionally unrun against the user's local database; use the safe command for future verification or run the wrapper only against a disposable database.

## Verification

- `npm run test:unit` — PASS, 7 files and 76 tests (including structural-change confirmation cases).
- `npm run test:db` — NOT RUN; it resets the local database.
- `npx supabase migration up --local` — PASS; applied the additive revision-guard migration without resetting the database.
- `npx supabase test db` — PASS, 5 files and 102 tests against the existing database (includes stale-revision rejection).
- `npx astro check` — PASS, 56 files; 0 errors, warnings, or hints.
- `npm run lint` — PASS.
- `npm run build` — PASS.
- `BASE_URL=http://127.0.0.1:4321 npm run smoke` — PASS, all smoke steps, including removal and regeneration.
- Manual checks — user confirmed the phase's manual scenarios, including structural confirmation/cancellation, edits, stale status, recalculation, and failure behavior.
