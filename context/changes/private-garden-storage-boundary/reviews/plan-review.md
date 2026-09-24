<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Minimalny prywatny zapis działki

- **Plan**: `context/changes/private-garden-storage-boundary/plan.md`
- **Mode**: Deep
- **Date**: 2026-09-23
- **Verdict**: SOUND
- **Findings**: 0 critical, 0 warnings, 0 observations outstanding (3 warnings fixed during triage)

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | PASS |
| Lean Execution | PASS |
| Architectural Fitness | PASS |
| Blind Spots | PASS |
| Plan Completeness | PASS |

## Grounding

4/4 plan write targets accounted for (2 existing files and 2 intentionally new files); relevant CLI, CI and auth symbols/configuration verified; brief and plan agree; both phases and all 5 success criteria map to Progress. The official Supabase documentation confirms the planned local reset flags and pgTAP test workflow. No Supabase commands or product tests were executed during review.

## Findings

### F1 — Odczyt był jednocześnie wykluczony i wymagany

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — szybka, wąska korekta
- **Dimension**: End-State Alignment
- **Location**: `plan.md`, “What We're NOT Doing” and Phase 1 contract
- **Detail**: Scope excluded “odczyt”, while the database contract and tests required the owner to read their own garden record.
- **Fix**: Clarified that UI/API read flows are out of scope, while owner read access in the database remains in scope through RLS.
- **Decision**: FIXED — applied as requested during triage.

### F2 — CI mogło używać dwóch wersji Supabase CLI

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — rzeczywista kwestia powtarzalności CI
- **Dimension**: Architectural Fitness
- **Location**: `package.json`, `.github/workflows/ci.yml`, Phase 2 CI contract
- **Detail**: CI installed the CLI using `supabase/setup-cli` with `latest`, while npm scripts resolve the project-local CLI version pinned by `package-lock.json` (2.117.0).
- **Fix**: The plan now requires the CI-installed CLI version to match the lockfile-pinned version, currently 2.117.0, instead of `latest`. Official documentation confirms `db reset --local --no-seed` and local `supabase test db` are supported commands: [CLI reference](https://supabase.com/docs/reference/cli/supabase-db-reset), [database testing](https://supabase.com/docs/guides/database/testing).
- **Decision**: FIXED — applied as requested during triage.

### F3 — Uprawnienia i testy RLS nie określały pełnej granicy dostępu

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — dotyczy głównej granicy bezpieczeństwa tej zmiany
- **Dimension**: Blind Spots
- **Location**: Phase 1 migration contract, Phase 2 pgTAP contract, brief risks
- **Detail**: The plan required owner policies but did not specify an explicit privilege allowlist, test execution under real `anon`/`authenticated` roles and user identities, or a denied client `DELETE` assertion. The PRD also requires blocked accounts to lose access, although account blocking is outside F-01.
- **Fix**: The plan now requires revoking default `anon`/`authenticated` privileges and granting only `SELECT`, `INSERT`, and `UPDATE` to `authenticated`; pgTAP exercises `anon` and two user JWT identities without a role that bypasses RLS and asserts owner deletion is denied. The plan and brief record blocked-account access denial as a prerequisite before enabling that future feature, without adding account blocking to F-01.
- **Decision**: FIXED — applied as requested during triage.
