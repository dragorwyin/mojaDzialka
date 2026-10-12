# Phase 1 manual acceptance

- **Date:** 2026-10-11
- **Result:** User confirmed that both manual checks passed.
- **Capacity check:** At least 10,000 positions completed within the accepted limit of 10 seconds in a preview/Workers-like environment. The exact runtime and runtime configuration were not provided.
- **Small and large gardens:** User confirmed the existing rules remained intact, large layouts did not silently lose positions, and any shortfalls were explicit.
- **Local fixture reference:** `src/lib/garden-layout.capacity.test.ts` generated 20,000 positions in 175.7 ms under the local Node/Vitest run. This is separate from the user-confirmed preview/Workers measurement.
