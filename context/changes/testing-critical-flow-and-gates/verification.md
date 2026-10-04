# Phase 3 verification

Date: 2026-10-04

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

## Hosted CI gate: pending

The workflow now installs Chromium with Linux dependencies, runs smoke followed by E2E against its existing loopback preview, and uploads Playwright report/results on job completion. The workflow is triggered by pull requests to `main`.

No hosted pull-request run was started from this task. Therefore CI execution, a controlled failing hosted gate, uploaded artifact availability, and the final green hosted run remain unverified; Phase 3 stays `implementing` until those checks complete. Local Playwright failure from the Phase 2 deliberate-break produced a nonzero command result plus screenshot/trace under ignored `test-results/`, but this does not verify GitHub artifact upload.

## Evidence limits

- `npm run smoke` exercises HTTP/session/database paths; it does not prove browser hydration or native dialog behavior.
- E2E interception proves the visible handling of the supplied API response, not a real database outage. SQL/API tests remain the evidence for persistence and database contracts.
- Mobile coverage is a 390×844 Chromium viewport, not a physical device or Safari.
