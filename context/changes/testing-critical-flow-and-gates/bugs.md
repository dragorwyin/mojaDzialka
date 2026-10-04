# Bugs discovered during Phase 2

## MD-FLOW-001 — First generated plan bypassed structural-loss confirmation

- **Change:** `testing-critical-flow-and-gates` (resolved here)
- **Preconditions:** Sign in to a garden with saved spaces and crops but no saved plan.
- **Reproduction:** Open `/garden`; generate the first plan; without reloading, add a space and submit “Zapisz działkę”.
- **Expected:** A native confirmation explains that saving the structural change removes the plan; dismissing it prevents the save.
- **Actual before fix:** No confirmation appeared after first generation and the structural form submission proceeded. The existing structural-save contract removes the stored plan; the first reproduced browser failure established the missing dialog, and the server contract explains its data-loss consequence.
- **Anchor and cause:** `GardenSetupForm` received `hasSavedPlan` only from the initial SSR render. `GardenPlanner` saved a plan in its own island state but did not notify the form island.
- **Minimal fix:** Dispatch `garden:plan-saved` after the successful generation response; the setup form listens and records that a plan exists for future structural submissions.
- **Regression evidence:** The desktop browser test failed before the fix while waiting for the native dialog (3-second timeout). It is included in `tests/e2e/garden-plan-loss.spec.ts` and must pass in desktop and mobile Chromium after the fix.
- **Verification:** `npm run test:e2e -- tests/e2e/garden-plan-loss.spec.ts --grep "without a reload"`
- **Resolved in this change:** Yes.
- **Follow-up handoff:** None required. If a separate follow-up is needed, open `/10x-new garden-plan-confirmation-after-first-generation`, then `/10x-research garden-plan-confirmation-after-first-generation`.
