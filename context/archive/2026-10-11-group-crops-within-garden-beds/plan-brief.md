# Group crops within garden beds — Plan Brief

> Full plan: `context/changes/group-crops-within-garden-beds/plan.md`
> Frame brief: `context/changes/group-crops-within-garden-beds/frame.md`
> Prior same-crop compactness findings: `context/changes/garden-crop-catalog-and-layout/research.md`

## What & Why

The generator’s placement policy does not encode the user's requirement that each catalog crop form a coherent group within each bed, and an existing test explicitly permits interleaving to satisfy global proportions. The change will keep each crop together, preserve planting constraints, and make any unmet allocation visible instead of scattering remaining plants elsewhere in the same bed.

## Starting Point

The generator currently ranks individual candidate positions across crops and beds; compactness is measured to any existing crop. The result and dashboard already expose positions and garden-wide summaries, but they do not record or show partial per-bed crop counts.

## Desired End State

Every allocated crop in a bed forms one compact group, with positive companion relations affecting where the whole group sits. If constraints prevent the complete allocation, one partial group remains and the missing count is visible for that crop and bed as well as in the garden summary.

## Key Decisions Made

| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| Meaning of grouped | One compact group per crop entry and bed | Prevents distant duplicate clusters while allowing irregular outlines | Plan interview |
| Unplaceable target | Keep one partial group and show missing positions | Avoids breaking the grouping rule to chase a target | Plan interview |
| Companion positives | May position the whole group but cannot split it | Retains useful catalog knowledge without scattering | Plan interview |
| Crop identity | Same catalog entry; variants remain separate | Preserves variant-specific spacing and requirements | Plan interview |
| Shortfall detail | Per crop and bed plus garden summary | Shows both where and how much is missing | Plan interview |
| Per-bed requested counts | Current generator output is the baseline count for each crop and bed | Preserves current allocation behavior without inventing a capacity formula | Plan interview follow-up |
| Result compatibility | Accept older saved plans without per-bed allocations; do not fabricate historic deficits | Their original bed quotas cannot be recovered | Plan |

## Scope

**In scope:**

- Existing deterministic per-crop/per-bed counts as a baseline allocation.
- Bounded placement of a single connected crop group per bed.
- Explicit per-bed and garden-level shortfall result data and UI.
- Regression and saved-plan-flow verification.

**Out of scope:**

- Manual crop-to-bed assignment, crop catalog changes, and proportion editing.
- Relaxing spacing or confirmed negative-neighbor constraints.
- View-only regrouping or a garden diagram redesign.
- The separate CI/Smoke fix.

## Architecture / Approach

The current allocator first supplies deterministic per-crop/per-bed counts. A second bounded pass attempts those counts while expanding each crop as a single group inside each bed. The result carries baseline allocation, placed, and missing counts per crop/bed while retaining garden-wide summaries. Existing persistence carries the extended result; the dashboard shows nonzero deficits next to their beds and aggregates them by crop.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Per-bed crop grouping | Preserve current per-bed counts where feasible and place each catalog entry as one compact group | Grouping may underfill a baseline count when geometry or neighbor rules prevent one cluster |
| 2. Shortfall reporting | Per-bed and garden-level allocated/placed/missing counts in results and UI | Legacy plans cannot supply historic per-bed quotas |
| 3. End-to-end acceptance | Save/read/dashboard verification and repository quality gates | Integration could lose new fields or confuse a partial group |

**Prerequisites:** Existing generator, result parser, persistence, and dashboard remain the implementation boundaries; no schema migration is assumed unless research during implementation shows persistence does not support the result payload.
**Estimated effort:** Medium, three implementation phases.

## Open Risks & Assumptions

- The grouped pass may underfill a current-generator baseline count where one compact group cannot satisfy the existing geometry or neighbor constraints.
- “Compact group” is treated as one connected cluster in the valid candidate-site graph; a cluster's outline may be irregular.
- Existing saved layouts lack historical bed-level allocations; their previous layout remains readable, and accurate deficits require regeneration.
- Baseline and grouped passes may perform up to twice the checks of one current run; each pass remains bounded by the existing candidate limit, and the result reports combined checks.

## Success Criteria (Summary)

- No catalog crop appears in two disconnected clusters within the same bed.
- Unmet per-bed allocations remain partial and are reported accurately at bed and garden level.
- Spacing, hard negative-neighbor constraints, deterministic results, and old saved-plan readability remain intact.
