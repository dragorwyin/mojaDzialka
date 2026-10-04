# Phase 3 verification

Date: 2026-10-05

## Local gates

- `npm run test:unit`: PASS — 8 files, 99 tests.
- `npm run test:api` (included by `test:unit`): PASS — 3 files, 33 tests.
- `npm run test:db`: PASS — local Supabase reset; 5 pgTAP files, 151 assertions.
- `npm run lint`: PASS.
- `npx astro check`: PASS — 76 files, 0 errors, warnings, or hints.
- `npm run build`: PASS.
- `npm run smoke`: PASS — all 56 HTTP smoke steps against the built local preview.
- `npm run test:e2e`: PASS — 22 tests on the same preview, desktop and mobile viewport, one worker.
- Workflow YAML parsed successfully; `git diff --check` is clean.

The preview was bound to `127.0.0.1:4321`; smoke ran before E2E, with the same local Supabase instance and production build. The failed first launch used Astro preview's default background mode and was not a product/test failure; rerunning with `ASTRO_PREVIEW_BACKGROUND=0` kept the server available and both suites passed.

## Hosted CI gate: PASS

PR: https://github.com/dragorwyin/mojaDzialka/pull/1

- Green hosted run after the CI workflow landed: https://github.com/dragorwyin/mojaDzialka/actions/runs/37237780709 — both `ci` and `smoke` passed.
- Controlled failure run: https://github.com/dragorwyin/mojaDzialka/actions/runs/37238401746 — `ci` passed; `smoke` failed on the temporary E2E probe in both viewports; the failure-artifact upload step and Supabase cleanup passed. GitHub lists the unexpired `playwright-failure-artifacts` artifact (694 KB): https://github.com/dragorwyin/mojaDzialka/actions/runs/37238401746/artifacts/11315574647.
- Final green run after reverting the probe: https://github.com/dragorwyin/mojaDzialka/actions/runs/37238895670 — both jobs passed; logs show all 56 smoke steps, 22 E2E tests, browser artifact upload, and Supabase cleanup. The controlled probe commit was `1392043`; its removal is commit `3983fac`.

The workflow installs Chromium with Linux dependencies, runs smoke followed by E2E against the loopback preview, uploads Playwright report/results on completion, and is triggered by pull requests to `main`.

## Evidence limits

- `npm run smoke` exercises HTTP/session/database paths; it does not prove browser hydration or native dialog behavior.
- E2E interception proves the visible handling of the supplied API response, not a real database outage. SQL/API tests remain the evidence for persistence and database contracts.
- Mobile coverage is a 390×844 Chromium viewport, not a physical device or Safari.
