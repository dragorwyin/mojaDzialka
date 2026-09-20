---
bootstrapped_at: 2026-09-20T20:07:29Z
starter_id: 10x-astro-starter
starter_name: "10x Astro Starter (Astro + Supabase + Cloudflare)"
project_name: moja-dzialka
language_family: js
package_manager: npm
cwd_strategy: git-clone
bootstrapper_confidence: first-class
phase_3_status: ok
audit_command: "npm audit --json"
---

## Hand-off

```yaml
starter_id: 10x-astro-starter
package_manager: npm
project_name: moja-dzialka
hints:
  language_family: js
  team_size: solo
  deployment_target: cloudflare-pages
  ci_provider: github-actions
  ci_default_flow: auto-deploy-on-merge
  bootstrapper_confidence: first-class
  path_taken: standard
  quality_override: false
  self_check_answers: null
  has_auth: true
  has_payments: false
  has_realtime: false
  has_ai: false
  has_background_jobs: false
```

## Why this stack

MojaDziałka to TypeScript-first aplikacja webowa z krótkim, trzytygodniowym terminem i logowaniem użytkowników. 10x Astro Starter jest rekomendowany dla web/JavaScript, zawiera gotową obsługę kont i danych, a jego konwencje oraz jawne typy pasują do małego projektu. Wybrany Cloudflare Pages jest domyślnym celem wdrożenia startera; GitHub Actions z automatycznym wdrożeniem po scaleniu ogranicza liczbę ręcznych kroków. Bootstrapper ma wsparcie first-class, więc mogą być potrzebne drobne ręczne poprawki.

## Pre-scaffold verification

| Signal | Value | Severity | Notes |
| --- | --- | --- | --- |
| npm package | not applicable | not run | `cmd_template` starts with `git clone`; no npm CLI package to check |
| GitHub repo | not run | unavailable | `gh` CLI is not installed, so the required `pushed_at` check could not run |

## Scaffold log

**Resolved invocation**: `git clone https://github.com/przeprogramowani/10x-astro-starter .bootstrap-scaffold && cd .bootstrap-scaffold && npm install`
**Strategy**: git-clone; scaffold cloned into a temporary directory, then merged into the current repository.
**Exit code**: 0
**Files moved**: 51 scaffold files, including `AGENTS.md.scaffold`; project directories `.github/`, `.husky/`, `.vscode/`, `public/`, `scripts/`, `src/`, and `supabase/` were moved into place. Dependencies were reinstalled in the project root after a locked-file error interrupted the first `node_modules` move.
**Conflicts (.scaffold siblings)**: `AGENTS.md` → `AGENTS.md.scaffold`; the repository's existing `AGENTS.md` was preserved.
**.gitignore handling**: moved silently; no `.gitignore` existed in the repository.
**.bootstrap-scaffold cleanup**: deleted after merging; the clone's `.git/` was removed before the merge. The repository's existing `.git/` was kept.

## Post-scaffold audit

**Tool**: `npm audit --json`
**Status**: completed successfully
**Summary**: 0 CRITICAL, 0 HIGH, 0 MODERATE, 0 LOW; 0 total vulnerabilities.
**Dependencies audited**: 804 total in the audit metadata.
**Direct vs transitive**: no findings; the audit tool does not provide a direct/transitive split for this report.

`npm install` completed with `found 0 vulnerabilities`. It emitted `EBADENGINE` warnings: `astro-eslint-parser@3.1.0` and `eslint-plugin-astro@3.1.0` require Node `^22.22.3 || ^24.16.0 || >=26.3.0`; the available runtime was Node `v24.14.0`.

The starter's `.nvmrc` specifies Node `22.14.0`, which is also below the declared engine range for those two packages.

## Hints recorded but not acted on

| Hint | Value |
| --- | --- |
| bootstrapper_confidence | first-class |
| quality_override | false |
| path_taken | standard |
| self_check_answers | null |
| team_size | solo |
| deployment_target | cloudflare-pages |
| ci_provider | github-actions |
| ci_default_flow | auto-deploy-on-merge |
| has_auth | true |
| has_payments | false |
| has_realtime | false |
| has_ai | false |
| has_background_jobs | false |

## Next steps

Next: a future skill will set up agent context (`AGENTS.md`). For now, your project is scaffolded and verified — happy hacking.

Useful manual steps in the meantime:
- Review `AGENTS.md.scaffold` alongside the repository's existing `AGENTS.md` and decide whether to incorporate any starter guidance.
- Align `.nvmrc` and the local Node.js version with the dependency engine range before running project scripts.
- The starter includes a GitHub Actions CI workflow and a Wrangler configuration. Configure repository secrets and connect the Cloudflare Pages deployment flow; the starter's workflow currently runs CI and smoke checks, not deployment.
- Address future audit findings per your project's risk tolerance.
