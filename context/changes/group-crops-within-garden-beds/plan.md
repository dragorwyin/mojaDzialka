# Group crops within garden beds — Implementation Plan

## Overview

Change the garden-layout generator so each selected catalog entry is planted as one compact group per bed. Preserve crop spacing and hard negative-neighbor constraints; when a full target cannot fit, keep the single partial group and report the unmet positions clearly at bed and garden level.

## Current State Analysis

The generator scores one planting candidate at a time across the garden. Its ranking considers supported neighbors, target pressure, caution, and distance to any placed crop, but has no same-crop grouping objective. The simple 80/20 test explicitly expects carrot/onion/carrot across three positions, so interleaving is an accepted current result. The view consumes generated coordinates without reordering them.

The plan result already carries positions per space, garden-wide crop summaries, omissions, conflicts, and warnings. Existing omissions explain cases where a crop received no positions, but do not express a shortfall for a crop that received some positions or locate an unmet count in a specific bed. Crop proportions are garden-wide, so the approved rule uses the existing generator's deterministic placements as the per-crop/per-bed baseline allocation.

## Desired End State

Within each bed, all placements for one catalog entry form one compact, contiguous group. Confirmed positive companion relations may influence where the whole group is placed, but cannot split it; hard spacing and confirmed negative-neighbor rules remain binding. If a bed cannot fit the full allocation, the generator leaves one partial group and reports the missing count for that crop in that bed, with an aggregate garden summary.

### Key Discoveries:

- `src/lib/garden-layout.ts:413–420,459–493` ranks generic compactness to any crop, not crop-specific grouping.
- `src/lib/garden-layout.ts:628–635,722–779` allocates placements one at a time while comparing crop scores across spaces.
- `src/lib/garden-layout.test.ts:403–428` asserts the interleaved 80/20 case and must be revised to express the accepted grouping contract while retaining honest target accounting.
- `src/components/garden/GardenLayoutView.tsx:406–429,476–493,556–592` displays per-bed positions and garden-wide crop summaries/omissions; it has no per-bed unmet crop counts today.
- The layout renderer passes through position crop IDs and coordinates, so the generator is the source of the scattered arrangement.
- User decisions: one compact group; if constrained, one partial group with missing positions reported; keep confirmed positive relations subordinate to grouping; define a crop by catalog entry; show per-crop/per-bed deficits and garden summary.

## What We're NOT Doing

- Changing the crop catalog, its proportions, or the existing garden-bed configuration workflow.
- Letting users manually assign crops to beds.
- Weakening crop spacing or confirmed negative-neighbor constraints to achieve grouping.
- Redesigning the garden diagram or moving placement logic into rendering/storage.
- Addressing CI/Smoke; that was handled separately in PR #3.

## Implementation Approach

Preserve the current placement policy as a deterministic allocation pass: its generated count for each crop in each bed becomes that bed's requested count. Then run bounded cluster placement against those counts. Within a bed, place a crop by expanding a single compact cluster through valid candidate sites; do not open a second disconnected cluster for that catalog entry in the same bed. If constraints or the search limit prevent matching the baseline count, keep the best partial group and report the difference. The result carries per-bed allocated, placed, and missing counts; the dashboard shows those alongside the existing garden-wide actual/target summary.

## Critical Implementation Details

The current proportion contract is garden-wide and does not define an absolute plant count. The existing allocator's output is therefore the agreed per-bed baseline, not a newly invented capacity formula. Treat the baseline pass and grouped pass as separate bounded runs using the existing candidate limit; report total candidate checks across both passes and preserve an incomplete-search warning if either pass hits its limit.

## Phase 1: Per-bed crop grouping in the generator

### Overview

Use the current allocator to capture the requested count for each catalog entry in each bed, then place those counts as at most one compact cluster per entry and bed. Keep positive companion scoring at the whole-cluster placement level and preserve all existing hard geometry and neighbor rules.

### Changes Required:

#### 1. Generator allocation and cluster placement

**File**: `src/lib/garden-layout.ts`

**Intent**: Preserve the current deterministic placement behavior as the per-bed allocation baseline, then add a bounded placement pass that groups each baseline crop count. Reuse existing candidate validity, neighbor, spacing, confidence, and placement-explanation behavior where compatible.

**Contract**: The baseline pass's position count for a given `spaceId` and `cropId` is its requested count in the grouped pass. Final placements for that pair form at most one connected cluster in the valid candidate-site graph; no second cluster may be started in that bed. A group may be partial when valid sites run out or a search limit is reached. Both passes remain bounded by the existing per-pass candidate limit; `metrics.candidateChecks` reports the sum of checks from both passes.

#### 2. Generator regression cases

**File**: `src/lib/garden-layout.test.ts`

**Intent**: Replace the test that accepts an unconstrained split with behavior-level coverage of grouping while preserving the current allocator's per-crop/per-bed counts when feasible, plus determinism, spacing, and hard negative-neighbor constraints.

**Contract**: Cover a multi-position crop that must remain one cluster despite competing crop target pressure; preservation of baseline counts when all groups fit; a baseline allocation that cannot fit as one cluster and leaves a connected partial result; multiple beds where each baseline group remains independent; companion positives that do not split a group; bounded two-pass candidate checks; and preservation of hard prohibitions and spacing.

### Success Criteria:

#### Automated Verification:

- Generator unit tests prove one connected cluster per allocated crop/bed, including constrained partial placement.
- Existing geometry, spacing, confirmed negative-neighbor, deterministic tie-break, and search-limit tests continue to pass.
- The interleaving assertion is replaced with assertions for grouped positions and garden-wide target/actual accounting.

#### Manual Verification:

- Generate layouts for several beds and crop mixes; confirm repeated catalog entries appear as one compact cluster in each bed where allocated.
- Confirm constrained crops remain partial rather than appearing in a distant second cluster.

**Implementation Note**: After completing this phase and automated verification, pause for the user's manual confirmation before proceeding.

---

## Phase 2: Per-bed and garden-level shortfall reporting

### Overview

Expose the bed-level allocations, actual placements, and missing counts in the plan result, then show the deficit where the user needs it: in each bed and in the garden summary.

### Changes Required:

#### 1. Plan result contract and compatibility

**File**: `src/lib/garden-layout.ts`

**Intent**: Extend the serialized layout result with each bed's crop allocation, placed count, and missing count, while retaining existing garden-wide crop summaries and omission reasons.

**Contract**: Every bed allocation is keyed by the existing catalog `cropId`; `missingCount = max(allocatedCount - placedCount, 0)`. Counts must survive `readGardenLayoutResult` and round-trip through existing persistence without silently discarding legacy plan results.

#### 2. Per-bed and garden summary UI

**File**: `src/components/garden/GardenLayoutView.tsx`

**Intent**: Add a concise per-bed crop shortfall list and a garden-level aggregate, using the existing semantic garden tokens and shared UI primitives.

**Contract**: Show crop name and missing plant count for each nonzero bed shortfall; the garden summary totals deficits by catalog entry. Do not render empty deficit chrome when every allocation is met. Follow the repository UI implementation guard.

#### 3. Contract, parsing, and rendering coverage

**File**: `src/lib/garden-layout.test.ts` and relevant existing garden component/API tests

**Intent**: Cover new result parsing and deficit behavior, including older saved plans and partially fulfilled bed allocations.

**Contract**: Tests distinguish a crop omitted entirely from a crop partially placed, and verify that per-bed deficits sum to the garden-level deficit for each crop.

### Success Criteria:

#### Automated Verification:

- Result parsing accepts supported legacy results and round-trips new per-bed allocation fields.
- Deficit accounting matches allocations, placements, and garden-level sums for full, partial, and zero-placement cases.
- Relevant component/API checks confirm the values reach the displayed bed and summary without altering position coordinates.

#### Manual Verification:

- Inspect a fully placed plan and a constrained partial plan; the first stays uncluttered and the second names the crop and missing count in the correct bed and summary.

**Implementation Note**: Pause for the user's manual confirmation after this phase before proceeding.

---

## Phase 3: End-to-end acceptance

### Overview

Verify the complete generated → saved/read → dashboard-rendered flow for grouped positions and shortfall reporting.

### Changes Required:

#### 1. Integration and user-flow coverage

**File**: Relevant existing garden plan API, persistence, and browser-flow tests

**Intent**: Exercise a generated plan with multiple beds and a constrained partial crop through the existing save/read and dashboard path.

**Contract**: The same per-bed crop groups and deficit counts are observed after reading the saved plan; the UI does not reorder or split generated positions.

### Success Criteria:

#### Automated Verification:

- Relevant garden API, persistence, and browser-flow coverage passes for a grouped partial result.
- The implementation's final quality gates pass as defined by the repository scripts and CI.

#### Manual Verification:

- Review a saved multi-bed plan on the dashboard: each crop is compact within each bed; any unmet count is visible beside the affected bed and in the garden summary.
- Confirm the plan remains understandable at the supported narrow viewport and zoom interactions.

**Implementation Note**: This is the final phase; close it after automated verification and the user's manual acceptance.

---

## Testing Strategy

### Unit Tests:

- Single connected cluster per crop entry and bed under ordinary placement, competing targets, positive companion scoring, and hard negative-neighbor constraints.
- Deterministic baseline counts per crop and bed, with exact count preservation whenever one compact group is feasible.
- Partial cluster at valid-space exhaustion and search limit; no disconnected fallback group.
- Per-bed allocated/placed/missing counts and garden-level aggregation, including zero-placement and legacy serialized plan cases.
- Existing spacing, geometry, confidence, crop mix, and omission semantics.

### Integration Tests:

- Generate, save/read, and display a multi-bed plan while preserving group coordinates and deficit counts.
- Verify result parsing remains compatible with existing saved plans that lack bed-level allocations.

### Manual Testing Steps:

1. Generate several layouts with two or more crops in one bed and inspect each crop's group.
2. Use a constrained mix that cannot meet one bed allocation; confirm the crop remains one partial group and the correct missing count appears in that bed and the summary.
3. Confirm positive neighbors can alter whole-group position, while spacing and confirmed negative relations still block invalid placements.
4. Reload a saved result and confirm the layout and shortfall report remain the same.

## Performance Considerations

The generator already has bounded candidate and search limits. The baseline and grouped passes each use that per-pass bound, so total candidate work is at most twice the current run; the returned metric reports the combined checks. If either pass reaches its limit, preserve the partial group and surface the incomplete-search signal. A space the baseline did not process has an unknown allocation, not a zero allocation.

## Migration Notes

Existing saved plans may not contain bed-level crop quotas or deficits. Parsing must continue to accept them. Do not infer historic missing counts from the current crop mix, because the original per-bed allocation is unavailable; regenerate to obtain the new breakdown. If the baseline pass leaves a space unprocessed, its bed-level allocation is unknown and the UI must preserve the incomplete-search signal rather than display a zero deficit as if the allocation were known.

## References

- Frame: `context/changes/group-crops-within-garden-beds/frame.md`
- Prior same-crop compactness findings: `context/changes/garden-crop-catalog-and-layout/research.md`
- Generator: `src/lib/garden-layout.ts:413–420,459–493,628–635,722–779`
- Regression case: `src/lib/garden-layout.test.ts:403–428`
- Result view: `src/components/garden/GardenLayoutView.tsx:406–429,476–493,556–592`
- Existing planner contract: `context/foundation/roadmap.md:129–134`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `.agents/skills/10x-plan/references/progress-format.md`.

### Phase 1: Per-bed crop grouping in the generator

#### Automated

- [x] 1.1 Capture current per-crop/per-bed counts and use them as targets for bounded one-cluster placement — a76c087
- [x] 1.2 Replace interleaving expectation and cover grouping, constraints, determinism, and partial placement — a76c087

#### Manual

- [x] 1.3 Inspect generated multi-bed layouts and constrained partial groups

### Phase 2: Per-bed and garden-level shortfall reporting

#### Automated

- [x] 2.1 Extend and parse per-bed allocation, placed, and missing counts compatibly
- [x] 2.2 Display per-bed and garden-level deficits and cover their accounting

#### Manual

- [x] 2.3 Inspect full and partial plans for clear, correctly located deficit reporting

### Phase 3: End-to-end acceptance

#### Automated

- [ ] 3.1 Verify grouped positions and deficits through save/read and dashboard flow
- [ ] 3.2 Run the applicable repository quality gates

#### Manual

- [ ] 3.3 Accept the saved grouped plan and shortfall report in the dashboard
