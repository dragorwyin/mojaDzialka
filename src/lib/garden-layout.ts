import {
  COMPANION_RELATIONS,
  type CompanionRelation,
  type Confidence,
  type CropCatalogEntry,
  type SpacingData,
  type SpacingStage,
} from "../data/crop-catalog.js";
import { normalizeProportionsToPercentages } from "./garden-crop-percentages.js";

const DEFAULT_CANDIDATE_LIMIT = 2_000;
const MAX_GRID_POINTS_PER_CROP = 256;

export interface GardenLayoutSpace {
  id: string;
  name?: string;
  widthCm: number;
  lengthCm: number;
}

export interface GardenLayoutCropSelection {
  crop: CropCatalogEntry;
  proportion: number;
}

export interface GardenLayoutInput {
  spaces: readonly GardenLayoutSpace[];
  crops: readonly GardenLayoutCropSelection[];
  relations?: readonly CompanionRelation[];
  maxCandidates?: number;
}

export interface GardenLayoutPosition {
  spaceId: string;
  cropId: string;
  xCm: number;
  yCm: number;
  row: number;
  column: number;
  spacing: {
    inRowCm: number;
    betweenRowsCm: number;
  };
  confidence: Confidence;
  stage: SpacingStage;
}

export interface GardenLayoutCropSummary {
  cropId: string;
  targetPercentage: number;
  actualPercentage: number;
  actualCount: number;
  dataConfidence: Confidence | null;
  spacingStage: SpacingStage | null;
}

export interface GardenLayoutOmission {
  cropId: string;
  reason:
    | "missing_spacing"
    | "unverified_spacing"
    | "invalid_spacing"
    | "invalid_proportion"
    | "non_final_spacing"
    | "no_fit"
    | "search_limit";
  detail: string;
}

export interface GardenLayoutConflict {
  spaceId: string;
  type: "geometry" | "negative_neighbor";
  cropIds: readonly string[];
  detail: string;
}

export interface GardenLayoutSpaceResult {
  space: GardenLayoutSpace;
  positions: readonly GardenLayoutPosition[];
}

export interface GardenLayoutResult {
  spaces: readonly GardenLayoutSpaceResult[];
  cropSummaries: readonly GardenLayoutCropSummary[];
  omissions: readonly GardenLayoutOmission[];
  conflicts: readonly GardenLayoutConflict[];
  warnings: readonly string[];
  metrics: {
    candidateChecks: number;
    supportedNeighbors: number;
    cautionNeighbors: number;
    limitReached: boolean;
  };
}

interface UsableCrop {
  selection: GardenLayoutCropSelection;
  inRowCm: number;
  betweenRowsCm: number;
  targetPercentage: number;
}

interface Candidate {
  crop: UsableCrop;
  xCm: number;
  yCm: number;
  row: number;
  column: number;
}

interface CandidateGrid {
  candidates: Candidate[];
  totalCandidates: number;
  truncatedCount: number;
}

interface PlacedPosition extends GardenLayoutPosition {
  crop: UsableCrop;
}

function isPositiveFinite(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function getUsableSpacing(spacing: SpacingData | null): { inRowCm: number; betweenRowsCm: number } | null {
  if (!spacing?.axisVerified) return null;

  const inRowCm = spacing.inRowCm?.min;
  const betweenRowsCm = spacing.betweenRowsCm?.min;

  if (inRowCm === undefined || betweenRowsCm === undefined) return null;
  if (!isPositiveFinite(inRowCm) || !isPositiveFinite(betweenRowsCm)) return null;

  return { inRowCm, betweenRowsCm };
}

function relationKey(firstCropId: string, secondCropId: string): string {
  return [firstCropId, secondCropId].sort().join("::");
}

function getRelationMap(relations: readonly CompanionRelation[]): ReadonlyMap<string, CompanionRelation> {
  return new Map(relations.map((relation) => [relationKey(...relation.cropIds), relation] as const));
}

function relationBetween(
  firstCropId: string,
  secondCropId: string,
  relations: ReadonlyMap<string, CompanionRelation>,
): CompanionRelation | null {
  return relations.get(relationKey(firstCropId, secondCropId)) ?? null;
}

function getHardBlockers(
  candidate: Candidate,
  placed: readonly PlacedPosition[],
  relations: ReadonlyMap<string, CompanionRelation>,
): string[] {
  return placed
    .filter((existing) => {
      const relation = relationBetween(existing.crop.selection.crop.id, candidate.crop.selection.crop.id, relations);
      return areNeighbors(existing, candidate) && relation?.status === "negative" && relation.hardBlock;
    })
    .map((existing) => existing.crop.selection.crop.id);
}

function areNeighbors(first: GardenLayoutPosition, second: Candidate | GardenLayoutPosition): boolean {
  const dx = Math.abs(first.xCm - second.xCm);
  const dy = Math.abs(first.yCm - second.yCm);
  const secondInRowCm = "crop" in second ? second.crop.inRowCm : second.spacing.inRowCm;
  const secondBetweenRowsCm = "crop" in second ? second.crop.betweenRowsCm : second.spacing.betweenRowsCm;
  const radius = Math.max(first.spacing.inRowCm, first.spacing.betweenRowsCm, secondInRowCm, secondBetweenRowsCm);

  // Treat centers within one larger configured planting interval as adjacent.
  // This is a layout heuristic, not a biological claim about companion crops.
  return Math.hypot(dx, dy) <= radius;
}

function overlaps(first: GardenLayoutPosition, second: Candidate): boolean {
  const dx = Math.abs(first.xCm - second.xCm);
  const dy = Math.abs(first.yCm - second.yCm);

  return (
    dx < Math.max(first.spacing.inRowCm, second.crop.inRowCm) &&
    dy < Math.max(first.spacing.betweenRowsCm, second.crop.betweenRowsCm)
  );
}

function compareCandidates(
  left: { candidate: Candidate; supported: number; caution: number; targetPressure: number },
  right: { candidate: Candidate; supported: number; caution: number; targetPressure: number },
): number {
  if (left.supported !== right.supported) return right.supported - left.supported;
  if (left.targetPressure !== right.targetPressure) return right.targetPressure - left.targetPressure;
  if (left.caution !== right.caution) return left.caution - right.caution;
  return (
    left.candidate.crop.selection.crop.id.localeCompare(right.candidate.crop.selection.crop.id) ||
    left.candidate.xCm - right.candidate.xCm ||
    left.candidate.yCm - right.candidate.yCm
  );
}

function makeCandidates(space: GardenLayoutSpace, crop: UsableCrop): CandidateGrid {
  const candidates: Candidate[] = [];
  const startX = crop.inRowCm / 2;
  const startY = crop.betweenRowsCm / 2;
  const columns = Math.max(0, Math.floor((space.widthCm - startX) / crop.inRowCm) + 1);
  const rows = Math.max(0, Math.floor((space.lengthCm - startY) / crop.betweenRowsCm) + 1);
  const totalCandidates = columns * rows;

  for (let row = 0; row < rows && candidates.length < MAX_GRID_POINTS_PER_CROP; row += 1) {
    for (let column = 0; column < columns && candidates.length < MAX_GRID_POINTS_PER_CROP; column += 1) {
      const xCm = startX + column * crop.inRowCm;
      const yCm = startY + row * crop.betweenRowsCm;
      if (xCm <= space.widthCm && yCm <= space.lengthCm) {
        candidates.push({ crop, xCm, yCm, row, column });
      }
    }
  }

  return {
    candidates,
    totalCandidates,
    truncatedCount: Math.max(0, totalCandidates - candidates.length),
  };
}

function scoreCandidate(
  candidate: Candidate,
  placed: readonly PlacedPosition[],
  relations: ReadonlyMap<string, CompanionRelation>,
  actualCounts: ReadonlyMap<string, number>,
  totalPlaced: number,
): { candidate: Candidate; supported: number; caution: number; targetPressure: number } {
  let supported = 0;
  let caution = 0;

  for (const existing of placed) {
    if (!areNeighbors(existing, candidate)) continue;
    const relation = relationBetween(existing.crop.selection.crop.id, candidate.crop.selection.crop.id, relations);
    if (relation?.status === "supported") supported += 1;
    if (relation?.status === "caution") caution += 1;
  }

  const actualPercentage =
    totalPlaced === 0 ? 0 : ((actualCounts.get(candidate.crop.selection.crop.id) ?? 0) / totalPlaced) * 100;
  const targetPressure = candidate.crop.targetPercentage - actualPercentage;
  return { candidate, supported, caution, targetPressure };
}

function createSummary(
  selection: GardenLayoutCropSelection,
  targetPercentage: number,
  actualCount: number,
  totalCount: number,
): GardenLayoutCropSummary {
  return {
    cropId: selection.crop.id,
    targetPercentage,
    actualPercentage: totalCount === 0 ? 0 : (actualCount / totalCount) * 100,
    actualCount,
    dataConfidence: selection.crop.spacing?.confidence ?? null,
    spacingStage: selection.crop.spacing?.stage ?? null,
  };
}

/** Generates a bounded, deterministic layout across every supplied garden space. */
export function generateGardenLayout(input: GardenLayoutInput): GardenLayoutResult {
  const relations = getRelationMap(input.relations ?? COMPANION_RELATIONS);
  const candidateLimit = input.maxCandidates ?? DEFAULT_CANDIDATE_LIMIT;
  const selections = [...input.crops].sort((left, right) => left.crop.id.localeCompare(right.crop.id));
  const percentages = normalizeProportionsToPercentages(selections.map((selection) => selection.proportion));
  const targetByCrop = new Map<string, number>();
  if (percentages !== null) {
    selections.forEach((selection, index) => targetByCrop.set(selection.crop.id, percentages[index] ?? 0));
  }

  const omissions: GardenLayoutOmission[] = [];
  const usableCrops: UsableCrop[] = [];
  for (const selection of selections) {
    const targetPercentage = targetByCrop.get(selection.crop.id) ?? 0;
    if (!Number.isFinite(selection.proportion) || selection.proportion <= 0 || percentages === null) {
      omissions.push({
        cropId: selection.crop.id,
        reason: "invalid_proportion",
        detail: "Proporcja musi być dodatnią liczbą skończoną.",
      });
      continue;
    }

    const spacing = getUsableSpacing(selection.crop.spacing);
    if (selection.crop.spacing === null) {
      omissions.push({
        cropId: selection.crop.id,
        reason: "missing_spacing",
        detail: "Katalog nie zawiera użytecznej roboczej rozstawy.",
      });
      continue;
    }
    if (!selection.crop.spacing.axisVerified) {
      omissions.push({
        cropId: selection.crop.id,
        reason: "unverified_spacing",
        detail: "Katalog ma opublikowaną parę bez potwierdzonej kolejności osi; silnik jej nie interpretuje.",
      });
      continue;
    }
    if (spacing === null) {
      omissions.push({
        cropId: selection.crop.id,
        reason: "invalid_spacing",
        detail: "Robocza rozstawa nie ma dwóch dodatnich osi.",
      });
      continue;
    }
    if (!selection.crop.spacing.isFinalPlanting) {
      omissions.push({
        cropId: selection.crop.id,
        reason: "non_final_spacing",
        detail: "Katalog zawiera rozstawę siewu, ale brak końcowej obsady roślin.",
      });
      continue;
    }

    usableCrops.push({ selection, ...spacing, targetPercentage });
  }

  const spaceResults: GardenLayoutSpaceResult[] = [];
  const conflicts: GardenLayoutConflict[] = [];
  const geometryBlockedBySpace = new Map<string, Set<string>>();
  const negativeBlockedBySpace = new Map<string, Map<string, Set<string>>>();
  const truncatedGridCropIds = new Set<string>();
  const candidateGridWarnings: string[] = [];
  let candidateChecks = 0;
  let supportedNeighbors = 0;
  let cautionNeighbors = 0;
  let limitReached = false;
  const actualCounts = new Map(selections.map((selection) => [selection.crop.id, 0]));
  let totalPlaced = 0;

  for (const space of input.spaces) {
    const placed: PlacedPosition[] = [];
    const geometryBlockedCropIds = new Set<string>();
    const negativeBlockedByCrop = new Map<string, Set<string>>();
    const truncatedGridCropIdsInSpace = new Set<string>();
    const candidatesByCrop = new Map(
      usableCrops.map((crop) => {
        const grid = makeCandidates(space, crop);
        if (grid.truncatedCount > 0) {
          const cropId = crop.selection.crop.id;
          truncatedGridCropIds.add(cropId);
          truncatedGridCropIdsInSpace.add(cropId);
          candidateGridWarnings.push(
            `W przestrzeni "${space.name ?? space.id}" pominięto ${grid.truncatedCount} z ${grid.totalCandidates} pozycji siatki dla uprawy ${crop.selection.crop.commonNamePl} (limit ${MAX_GRID_POINTS_PER_CROP}).`,
          );
        }
        return [crop.selection.crop.id, grid.candidates] as const;
      }),
    );

    while (candidateChecks < candidateLimit) {
      const scored: { candidate: Candidate; supported: number; caution: number; targetPressure: number }[] = [];
      for (const crop of usableCrops) {
        const candidates = candidatesByCrop.get(crop.selection.crop.id) ?? [];
        let firstValidIndex = -1;
        let completedSearch = true;
        let hadOverlappingCandidates = false;
        const hardBlockers = new Set<string>();
        for (const [candidateIndex, candidate] of candidates.entries()) {
          candidateChecks += 1;
          if (placed.some((existing) => overlaps(existing, candidate))) {
            hadOverlappingCandidates = true;
            if (candidateChecks >= candidateLimit) {
              completedSearch = false;
              break;
            }
            continue;
          }
          const candidateBlockers = getHardBlockers(candidate, placed, relations);
          if (candidateBlockers.length > 0) {
            for (const blocker of candidateBlockers) hardBlockers.add(blocker);
            if (candidateChecks >= candidateLimit) {
              completedSearch = false;
              break;
            }
            continue;
          }
          const score = scoreCandidate(candidate, placed, relations, actualCounts, totalPlaced);
          scored.push(score);
          firstValidIndex = candidateIndex;
          break;
        }
        if (firstValidIndex < 0 && completedSearch) {
          if (!truncatedGridCropIdsInSpace.has(crop.selection.crop.id)) {
            if (candidates.length === 0 || hadOverlappingCandidates) {
              geometryBlockedCropIds.add(crop.selection.crop.id);
            }
            if (hardBlockers.size > 0) negativeBlockedByCrop.set(crop.selection.crop.id, hardBlockers);
          }
        }
        candidatesByCrop.set(crop.selection.crop.id, firstValidIndex < 0 ? [] : candidates.slice(firstValidIndex));
        if (candidateChecks >= candidateLimit) break;
      }

      if (scored.length === 0) break;
      scored.sort(compareCandidates);
      const best = scored[0];
      const selected = best.candidate;
      const position: PlacedPosition = {
        spaceId: space.id,
        cropId: selected.crop.selection.crop.id,
        xCm: selected.xCm,
        yCm: selected.yCm,
        row: selected.row,
        column: selected.column,
        spacing: { inRowCm: selected.crop.inRowCm, betweenRowsCm: selected.crop.betweenRowsCm },
        confidence: selected.crop.selection.crop.spacing?.confidence ?? "low",
        stage: selected.crop.selection.crop.spacing?.stage ?? "mixed",
        crop: selected.crop,
      };
      placed.push(position);
      actualCounts.set(position.cropId, (actualCounts.get(position.cropId) ?? 0) + 1);
      totalPlaced += 1;
      supportedNeighbors += best.supported;
      cautionNeighbors += best.caution;
      candidatesByCrop.set(
        position.cropId,
        (candidatesByCrop.get(position.cropId) ?? []).filter((candidate) => candidate !== selected),
      );
    }

    if (candidateChecks >= candidateLimit) {
      limitReached = true;
    }

    if (geometryBlockedCropIds.size > 0) geometryBlockedBySpace.set(space.id, geometryBlockedCropIds);
    if (negativeBlockedByCrop.size > 0) negativeBlockedBySpace.set(space.id, negativeBlockedByCrop);

    spaceResults.push({
      space,
      positions: placed.map(({ crop: _crop, ...position }) => position),
    });
    if (limitReached) break;
  }

  for (const crop of usableCrops) {
    if ((actualCounts.get(crop.selection.crop.id) ?? 0) === 0 && input.spaces.length > 0) {
      const searchIncomplete = limitReached || truncatedGridCropIds.has(crop.selection.crop.id);
      omissions.push({
        cropId: crop.selection.crop.id,
        reason: searchIncomplete ? "search_limit" : "no_fit",
        detail: searchIncomplete
          ? "Nie można potwierdzić braku miejsca, ponieważ część pozycji nie została sprawdzona."
          : "Nie znaleziono poprawnej pozycji w dostępnej geometrii.",
      });
      if (!searchIncomplete) {
        for (const [spaceId, blockedCropIds] of geometryBlockedBySpace) {
          if (blockedCropIds.has(crop.selection.crop.id)) {
            conflicts.push({
              spaceId,
              type: "geometry",
              cropIds: [crop.selection.crop.id],
              detail: "Dostępna geometria nie mieści żadnej poprawnej pozycji tej uprawy.",
            });
          }
        }
        for (const [spaceId, blockedByCrop] of negativeBlockedBySpace) {
          const blockers = blockedByCrop.get(crop.selection.crop.id);
          if (blockers !== undefined) {
            conflicts.push({
              spaceId,
              type: "negative_neighbor",
              cropIds: [crop.selection.crop.id, ...blockers],
              detail: "Wszystkie dostępne pozycje tej uprawy naruszały potwierdzone negatywne sąsiedztwo.",
            });
          }
        }
      }
    }
  }

  const totalCount = [...actualCounts.values()].reduce((sum, count) => sum + count, 0);
  const cropSummaries = selections.map((selection) =>
    createSummary(
      selection,
      targetByCrop.get(selection.crop.id) ?? 0,
      actualCounts.get(selection.crop.id) ?? 0,
      totalCount,
    ),
  );
  const warnings = [
    ...candidateGridWarnings,
    ...(limitReached ? ["Osiągnięto limit obliczeń; zwrócono najlepszy znaleziony poprawny układ."] : []),
  ];

  return {
    spaces: spaceResults,
    cropSummaries,
    omissions,
    conflicts,
    warnings,
    metrics: { candidateChecks, supportedNeighbors, cautionNeighbors, limitReached },
  };
}
