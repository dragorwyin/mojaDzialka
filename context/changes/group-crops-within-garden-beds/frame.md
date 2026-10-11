# Frame Brief: Group crops within garden beds

> Framing step before /10x-plan. This document captures what is *actually*
> at issue, separated from what was initially assumed.

## Reported Observation

"algorytm wyznacza nienaturalny rozklad roslin, mam tutaj na mysli, ze np. zamiast grupowac dane rosliny aby czlowiek je sadzil w odpowiednich sektorach, to kaze ten sam gatunek sadzic np. cebule osobno, czasami na roznych naroznikach, itd. Co normalnie osoba ktora sadzi na pewno tego tak nie zrobi. Po prostu jeden gatunek roslin zawsze powinien byc w danej skrzyni pogrupowany, a nie porozrzucany po roznych miejscach w skrzyni"

## Initial Framing (preserved)

- **User's stated cause or approach**: The placement algorithm creates unnatural distributions by splitting one species across a bed.
- **User's proposed direction**: Group every species in a given bed instead of scattering it around the bed.
- **Pre-dispatch narrowing**: The user sees the scattering in several generated plans; the user prioritized the red CI/Smoke on main for immediate work.

## Dimension Map

1. **Candidate ranking / objective** — same-species proximity may be absent from the greedy ranking, so placements for one crop compete globally with other crops.
2. **Companion constraints** — hard spacing or negative-neighbor rules could force a crop into distant available positions.
3. **Count allocation / sequential placement** — the requested crop proportions may drive one-position-at-a-time allocation and interleave species.
4. **Persistence or rendering** — a correct clustered result could be reordered or visually represented as scattered later in the save/read/render path.

## Hypothesis Investigation

| Hypothesis | Evidence | Verdict |
| --- | --- | --- |
| Candidate ranking lacks a same-species grouping objective | `src/lib/garden-layout.ts:413–420` ranks supported neighbors, target pressure, caution, then generic compactness. `:459–493` calculates compactness to any placed position, with no same-crop distinction. A previous project research artifact independently describes the absence of a same-crop compactness reward (`context/changes/garden-crop-catalog-and-layout/research.md`, Summary and Detailed Findings). | STRONG |
| Companion or geometric constraints force the scattering | `src/lib/garden-layout.ts:374–407` applies hard neighbor blockers and geometric neighbor checks. They can constrain placements but do not express a general same-species grouping requirement. The crop-constraint review found no onion-specific hard negative relation and no evidence that constraints explain the general pattern. | WEAK |
| Sequential proportion balancing intentionally interleaves species | `src/lib/garden-layout.ts:628–635,722–779` places one candidate at a time while comparing crop scores. `src/lib/garden-layout.test.ts:403–428` explicitly expects carrot/onion/carrot across three positions to preserve an 80/20 target, proving interleaving is currently an accepted behavior in a simple unconstrained case. | STRONG |
| Persistence or rendering scatters an otherwise grouped plan | The renderer maps each position's provided crop ID and coordinates directly in `src/components/garden/GardenLayoutView.tsx:435–444`; the rendering review found no reorder or mutation in API/storage/read paths. | NONE |

## Narrowing Signals

- The user reports the pattern across several plans, not only the attached example.
- The existing unconstrained unit test expects different crops to alternate, so the pattern can occur without any hard companion constraint.
- The independent constraint review found no species-specific hard blocker that explains the repeated pattern.
- The user asked to resolve CI first; the crop work remains a separate follow-up.

## Cross-System Convention

The prior garden-layout research treats same-crop compactness as a distinct missing objective; it does not claim the current generic compactness score creates botanical groupings. The existing test also protects proportion accuracy by allowing interleaving. Together these show a tension between understandable, grouped planting and global target counts, while keeping hard biological/spacing constraints independent from display order. The initial framing matches the code evidence: the generator has no same-species grouping objective. This brief leaves the meaning and acceptable exceptions of “grouped” for `/10x-plan` to clarify; it does not select an algorithm.

## Reframed (or Confirmed) Problem Statement

> **The actual problem to plan around is**: the generator’s placement policy does not encode the user's requirement that each species form a coherent group within each bed, and an existing test explicitly permits interleaving to satisfy global proportions.

The renderer appears to preserve generated coordinates, so improving the view alone would not address the observed placement. Planning must resolve how grouping interacts with target proportions and valid spacing/companion constraints while retaining honest reporting of any crop count that cannot fit.

## Confidence

- **HIGH** — source ranking, the inverse test expectation, independent constraint inspection, and pass-through rendering evidence all point to the placement policy.
- Limitation: the exact input and saved result behind the screenshot were not available, so that individual plan was not replayed.

## What Changes for /10x-plan

Plan the generator behavior around per-bed crop grouping as a user-facing invariant, then decide how to reconcile it with proportion targets and hard placement constraints. Keep rendering and persistence as verification boundaries rather than presumed causes.

## References

- `src/lib/garden-layout.ts:374–420,459–493,628–635,722–779`
- `src/lib/garden-layout.test.ts:403–428`
- `src/components/garden/GardenLayoutView.tsx:435–444`
- `context/changes/garden-crop-catalog-and-layout/research.md` (existing compactness findings)
- Investigation tasks: `/root/crop_rank_hypothesis`, `/root/crop_constraints_hypothesis`, `/root/crop_rendering_hypothesis`
