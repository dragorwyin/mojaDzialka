<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Dostęp do konta e-mailem

- **Plan**: `context/changes/email-account-access/plan.md`
- **Scope**: Phase 1 of 2
- **Reviewed phases**: 1
- **Date**: 2026-09-25
- **Verdict**: APPROVED
- **Findings**: 0 critical, 1 warning, 1 observation

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | WARNING |
| Safety & Quality | PASS |
| Architecture | PASS |
| Pattern Consistency | PASS |
| Success Criteria | PASS |

## Verification

- `npm run lint` — PASS.
- `npx astro check` — PASS (0 errors, 0 warnings, 0 hints). The command needed to run outside the sandbox because the sandbox prevented esbuild from spawning.
- `npm run build` — PASS.
- `npm run smoke` — PASS, 19/19 checks against local Supabase and the production preview, including the F2 additions.
- Manual checks 1.5–1.7 and 1.10 — user confirmed all work; corresponding Phase 1 Progress rows are checked.

## Findings

### F1 — Shared auth helper is absent from the Phase 1 file list

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision. Fix is obvious and narrowly scoped.
- **Dimension**: Scope Discipline
- **Location**: `src/lib/auth-utils.ts:1`
- **Detail**: The new helper centralizes the planned error allowlist and safe `returnTo` validation and is used by the auth endpoints/pages. Its behavior is directly within the approved contracts, so this is not behavioral scope creep; however, the reviewed Phase 1 “Changes Required” file list does not identify this shared module.
- **Fix**: Add `src/lib/auth-utils.ts` to the Phase 1 implementation file list as the shared implementation for the planned contracts.
  - **Confidence**: HIGH — the module is already used by the planned endpoints and pages.
  - **Blind spot**: None significant.
- **Decision**: FIXED — documented `src/lib/auth-utils.ts` as the shared Phase 1 auth utility.

### F2 — Smoke coverage omits the signin fallback and signup error page

- **Severity**: ℹ️ OBSERVATION
- **Impact**: 🏃 LOW — quick decision. Fix is obvious and narrowly scoped.
- **Dimension**: Success Criteria
- **Location**: `scripts/smoke.mjs:72`
- **Detail**: The successful signin smoke case supplies `returnTo: "/dashboard"`, so it does not prove the endpoint’s default destination when `returnTo` is absent. Unknown `?error=` is checked on signin only, not signup; the incorrect-password step checks the redirect code but not the rendered message. Manual verification passed and both pages share the allowlist helper, so this is a regression-coverage gap rather than a demonstrated behavior defect.
- **Fix**: Add smoke cases for signin without `returnTo` and for an unknown signup error; assert the expected dashboard redirect and generic rendered message.
  - **Confidence**: HIGH — these cases directly cover the plan’s stated fallback and error contracts.
  - **Blind spot**: None significant.
- **Decision**: FIXED — added smoke assertions for the default signin redirect, wrong-password copy, and unknown signup errors.
