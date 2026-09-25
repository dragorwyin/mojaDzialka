<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Dostęp do konta e-mailem

- **Plan**: `context/changes/email-account-access/plan.md`
- **Mode**: Deep
- **Date**: 2026-09-25
- **Verdict**: SOUND
- **Findings**: 0 critical, 3 warnings (all fixed), 0 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | PASS |
| Lean Execution | PASS |
| Architectural Fitness | PASS |
| Blind Spots | PASS |
| Plan Completeness | PASS |

## Grounding

11/11 planned file paths exist; 5/5 key symbols and configuration claims were confirmed; brief↔plan consistency verified. An independent codebase sweep confirmed that Supabase SSR can establish the signup session when email confirmation is disabled, CI exercises local Supabase rather than production settings, and the auth flow is feasible within the existing architecture.

## Findings

### F1 — `returnTo` validation contract was underspecified

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; the fix is narrow and explicit.
- **Dimension**: Blind Spots
- **Location**: Phase 1 — Przekierowania po auth
- **Detail**: The original plan required a local return path but did not define how to reject absolute URLs, protocol-relative paths such as `//host`, or backslashes, and did not require negative tests. These cases matter because the destination originates in a request and could otherwise become an open redirect.
- **Fix**: Require one leading slash, reject `//` and backslashes, parse against the app origin and require the same origin; fall back to `/dashboard`. Add an automated criterion covering a full URL, `//obcy-host`, and a backslash.
- **Decision**: FIXED — applied to the redirect contract and automated Success Criteria/Progress.

### F2 — Arbitrary `error` query values could still reach the auth UI

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; the fix is a narrow UI/API contract.
- **Dimension**: Plan Completeness
- **Location**: Phase 1 — Bezpieczne wyniki endpointów auth; Zachowanie ekranów auth
- **Detail**: The plan prohibited raw Supabase errors but did not require the signup/signin pages to map known error codes or define a fallback. The current pages display the query parameter directly, so an unknown or arbitrary `?error=` could still become visible text.
- **Fix**: Have endpoints emit fixed application codes; map only an allowlist to UI messages and show a generic fallback for unknown or arbitrary query values.
- **Decision**: FIXED — added the allowlist/fallback contract and an automated Success Criteria/Progress row.

### F3 — README still described the confirmation page as post-signup

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick documentation update.
- **Dimension**: Plan Completeness
- **Location**: Phase 1 — Zachowanie ekranów auth
- **Detail**: `README.md` lists `/auth/confirm-email` as the post-signup screen, which would be stale after removing that page from the active signup flow.
- **Fix**: Include `README.md` in the auth-screen documentation scope and require its route table to describe the current signup flow without email confirmation.
- **Decision**: FIXED — added README to the planned file contract, a manual Success Criteria/Progress row, and the plan brief scope.
