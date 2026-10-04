import {
  COMPANION_RELATIONS,
  type CompanionStatus,
  type CompanionRelation,
  type Confidence,
  type CropCatalogEntry,
  type SpacingData,
  type SpacingStage,
} from "../data/crop-catalog.js";
import { normalizeProportionsToPercentages } from "./garden-crop-percentages.js";

const DEFAULT_CANDIDATE_LIMIT = 2_000;
const MAX_GRID_POINTS_PER_CROP = 256;
const MAX_CANDIDATE_ALTERNATIVES_PER_CROP = 8;

export class GardenLayoutSearchLimitError extends Error {
  constructor() {
    super("Garden layout search limit reached before a valid position could be found.");
    this.name = "GardenLayoutSearchLimitError";
  }
}

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
  /** Absent only on plans persisted by a generator predating Phase 2. */
  neighbors?: readonly GardenLayoutNeighbor[];
  /** Absent only on plans persisted by a generator predating Phase 2. */
  placementReason?: GardenLayoutPlacementReason;
}

export interface GardenLayoutNeighbor {
  cropId: string;
  status: CompanionStatus | "unknown";
  distanceInSpacingSteps: number;
  rationale: string | null;
  sourceIds: readonly string[];
  confidence: Confidence | null;
}

export interface GardenLayoutPlacementReason {
  category:
    | "supported_neighbor"
    | "target_mix"
    | "caution_avoidance"
    | "compactness"
    | "hard_constraint_avoidance"
    | "deterministic_tie_break";
  detail: string;
  constrainedByCropIds: readonly string[];
  rejectedGeometryCandidates: number;
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
  /** Missing on older saved plans; new generator output always includes it. */
  status?: "complete" | "partial" | "not_processed";
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && typeof value === "number" && value >= 0;
}

function isConfidence(value: unknown): value is Confidence {
  return value === "high" || value === "medium" || value === "low";
}

function isSpacingStage(value: unknown): value is SpacingStage {
  return (
    value === "sowing" ||
    value === "thinning" ||
    value === "planting" ||
    value === "final_planting" ||
    value === "mixed"
  );
}

function isLayoutNeighbor(value: unknown): value is GardenLayoutNeighbor {
  return (
    isRecord(value) &&
    typeof value.cropId === "string" &&
    (value.status === "supported" ||
      value.status === "caution" ||
      value.status === "negative" ||
      value.status === "unknown") &&
    isFiniteNumber(value.distanceInSpacingSteps) &&
    value.distanceInSpacingSteps >= 0 &&
    (typeof value.rationale === "string" || value.rationale === null) &&
    Array.isArray(value.sourceIds) &&
    value.sourceIds.every((sourceId) => typeof sourceId === "string") &&
    (isConfidence(value.confidence) || value.confidence === null)
  );
}

function isPlacementReason(value: unknown): value is GardenLayoutPlacementReason {
  return (
    isRecord(value) &&
    (value.category === "supported_neighbor" ||
      value.category === "target_mix" ||
      value.category === "caution_avoidance" ||
      value.category === "compactness" ||
      value.category === "hard_constraint_avoidance" ||
      value.category === "deterministic_tie_break") &&
    typeof value.detail === "string" &&
    Array.isArray(value.constrainedByCropIds) &&
    value.constrainedByCropIds.every((cropId) => typeof cropId === "string") &&
    isNonNegativeInteger(value.rejectedGeometryCandidates)
  );
}

function isLayoutPosition(value: unknown): value is GardenLayoutPosition {
  if (!isRecord(value) || !isRecord(value.spacing)) return false;
  if (
    typeof value.spaceId !== "string" ||
    typeof value.cropId !== "string" ||
    !isFiniteNumber(value.xCm) ||
    value.xCm < 0 ||
    !isFiniteNumber(value.yCm) ||
    value.yCm < 0 ||
    !isNonNegativeInteger(value.row) ||
    !isNonNegativeInteger(value.column) ||
    !isFiniteNumber(value.spacing.inRowCm) ||
    value.spacing.inRowCm <= 0 ||
    !isFiniteNumber(value.spacing.betweenRowsCm) ||
    value.spacing.betweenRowsCm <= 0 ||
    !isConfidence(value.confidence) ||
    !isSpacingStage(value.stage)
  ) {
    return false;
  }
  if (value.neighbors !== undefined && (!Array.isArray(value.neighbors) || !value.neighbors.every(isLayoutNeighbor)))
    return false;
  if (value.placementReason !== undefined && !isPlacementReason(value.placementReason)) return false;
  return true;
}

function isCropSummary(value: unknown): value is GardenLayoutCropSummary {
  return (
    isRecord(value) &&
    typeof value.cropId === "string" &&
    isFiniteNumber(value.targetPercentage) &&
    value.targetPercentage >= 0 &&
    isFiniteNumber(value.actualPercentage) &&
    value.actualPercentage >= 0 &&
    isNonNegativeInteger(value.actualCount) &&
    (isConfidence(value.dataConfidence) || value.dataConfidence === null) &&
    (isSpacingStage(value.spacingStage) || value.spacingStage === null)
  );
}

function isOmission(value: unknown): value is GardenLayoutOmission {
  return (
    isRecord(value) &&
    typeof value.cropId === "string" &&
    (value.reason === "missing_spacing" ||
      value.reason === "unverified_spacing" ||
      value.reason === "invalid_spacing" ||
      value.reason === "invalid_proportion" ||
      value.reason === "non_final_spacing" ||
      value.reason === "no_fit" ||
      value.reason === "search_limit") &&
    typeof value.detail === "string"
  );
}

function isConflict(value: unknown): value is GardenLayoutConflict {
  return (
    isRecord(value) &&
    typeof value.spaceId === "string" &&
    (value.type === "geometry" || value.type === "negative_neighbor") &&
    Array.isArray(value.cropIds) &&
    value.cropIds.every((cropId) => typeof cropId === "string") &&
    typeof value.detail === "string"
  );
}

/** Reads the previous persisted layout shape too; Phase 2 explanation fields are intentionally optional. */
export function readGardenLayoutResult(value: unknown): GardenLayoutResult | null {
  if (
    !isRecord(value) ||
    !Array.isArray(value.spaces) ||
    !Array.isArray(value.cropSummaries) ||
    !Array.isArray(value.omissions) ||
    !Array.isArray(value.conflicts) ||
    !Array.isArray(value.warnings) ||
    !isRecord(value.metrics)
  ) {
    return null;
  }
  if (
    !value.spaces.every(
      (spaceResult) =>
        isRecord(spaceResult) &&
        isRecord(spaceResult.space) &&
        typeof spaceResult.space.id === "string" &&
        (spaceResult.space.name === undefined || typeof spaceResult.space.name === "string") &&
        isFiniteNumber(spaceResult.space.widthCm) &&
        spaceResult.space.widthCm > 0 &&
        isFiniteNumber(spaceResult.space.lengthCm) &&
        spaceResult.space.lengthCm > 0 &&
        (spaceResult.status === undefined ||
          spaceResult.status === "complete" ||
          spaceResult.status === "partial" ||
          spaceResult.status === "not_processed") &&
        Array.isArray(spaceResult.positions) &&
        spaceResult.positions.every(isLayoutPosition),
    )
  ) {
    return null;
  }
  if (
    !value.cropSummaries.every(isCropSummary) ||
    !value.omissions.every(isOmission) ||
    !value.conflicts.every(isConflict) ||
    !value.warnings.every((warning) => typeof warning === "string") ||
    !isNonNegativeInteger(value.metrics.candidateChecks) ||
    !isNonNegativeInteger(value.metrics.supportedNeighbors) ||
    !isNonNegativeInteger(value.metrics.cautionNeighbors) ||
    typeof value.metrics.limitReached !== "boolean"
  ) {
    return null;
  }
  return value as unknown as GardenLayoutResult;
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

interface CandidateScore {
  candidate: Candidate;
  supported: number;
  caution: number;
  targetPressure: number;
  compactnessDistance: number | null;
  rejectedGeometryCandidates: number;
  rejectedHardNeighborCropIds: readonly string[];
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

function distanceInSpacingSteps(first: GardenLayoutPosition, second: Candidate | GardenLayoutPosition): number {
  const dx = Math.abs(first.xCm - second.xCm);
  const dy = Math.abs(first.yCm - second.yCm);
  const secondInRowCm = "crop" in second ? second.crop.inRowCm : second.spacing.inRowCm;
  const secondBetweenRowsCm = "crop" in second ? second.crop.betweenRowsCm : second.spacing.betweenRowsCm;
  const inRowStep = Math.max(first.spacing.inRowCm, secondInRowCm);
  const betweenRowsStep = Math.max(first.spacing.betweenRowsCm, secondBetweenRowsCm);

  return Math.hypot(dx / inRowStep, dy / betweenRowsStep);
}

function areNeighbors(first: GardenLayoutPosition, second: Candidate | GardenLayoutPosition): boolean {
  // One normalized Euclidean spacing-step is a local layout neighborhood, not a biological claim.
  return distanceInSpacingSteps(first, second) <= 1;
}

function overlaps(first: GardenLayoutPosition, second: Candidate): boolean {
  const dx = Math.abs(first.xCm - second.xCm);
  const dy = Math.abs(first.yCm - second.yCm);

  return (
    dx < Math.max(first.spacing.inRowCm, second.crop.inRowCm) &&
    dy < Math.max(first.spacing.betweenRowsCm, second.crop.betweenRowsCm)
  );
}

function compareCandidates(left: CandidateScore, right: CandidateScore): number {
  if (left.supported !== right.supported) return right.supported - left.supported;
  if (left.targetPressure !== right.targetPressure) return right.targetPressure - left.targetPressure;
  if (left.caution !== right.caution) return left.caution - right.caution;
  const leftDistance = left.compactnessDistance ?? Number.POSITIVE_INFINITY;
  const rightDistance = right.compactnessDistance ?? Number.POSITIVE_INFINITY;
  if (leftDistance !== rightDistance) return leftDistance - rightDistance;
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
  const lastX = space.widthCm - crop.inRowCm / 2;
  const lastY = space.lengthCm - crop.betweenRowsCm / 2;
  const columns = Math.max(0, Math.floor((lastX - startX) / crop.inRowCm) + 1);
  const rows = Math.max(0, Math.floor((lastY - startY) / crop.betweenRowsCm) + 1);
  const totalCandidates = columns * rows;

  // With no columns, the row loop would otherwise scan the entire (potentially huge) length.
  if (columns === 0 || rows === 0) {
    return { candidates, totalCandidates, truncatedCount: totalCandidates };
  }

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
  rejectedGeometryCandidates: number,
  rejectedHardNeighborCropIds: readonly string[],
): CandidateScore {
  let supported = 0;
  let caution = 0;
  let compactnessDistance: number | null = null;

  for (const existing of placed) {
    const distance = distanceInSpacingSteps(existing, candidate);
    compactnessDistance = compactnessDistance === null ? distance : Math.min(compactnessDistance, distance);
    if (distance > 1) continue;
    const relation = relationBetween(existing.crop.selection.crop.id, candidate.crop.selection.crop.id, relations);
    if (relation?.status === "supported") supported += 1;
    if (relation?.status === "caution") caution += 1;
  }

  const actualPercentage =
    totalPlaced === 0 ? 0 : ((actualCounts.get(candidate.crop.selection.crop.id) ?? 0) / totalPlaced) * 100;
  const targetPressure = candidate.crop.targetPercentage - actualPercentage;
  return {
    candidate,
    supported,
    caution,
    targetPressure,
    compactnessDistance,
    rejectedGeometryCandidates,
    rejectedHardNeighborCropIds,
  };
}

function createPlacementReason(
  selected: CandidateScore,
  scores: readonly CandidateScore[],
): GardenLayoutPlacementReason {
  const alternatives = scores.filter((score) => score !== selected);
  const sameSupport = alternatives.filter((score) => score.supported === selected.supported);
  const sameSupportAndTarget = sameSupport.filter((score) => score.targetPressure === selected.targetPressure);
  const samePrimaryScores = sameSupportAndTarget.filter((score) => score.caution === selected.caution);
  const sameCropAlternatives = samePrimaryScores.filter(
    (score) => score.candidate.crop.selection.crop.id === selected.candidate.crop.selection.crop.id,
  );
  const constrainedByCropIds = [...selected.rejectedHardNeighborCropIds].sort((left, right) =>
    left.localeCompare(right),
  );

  if (selected.supported > 0) {
    return {
      category: "supported_neighbor",
      detail: `Pozycja ma ${selected.supported} lokalne potwierdzone korzystne sąsiedztwo.`,
      constrainedByCropIds,
      rejectedGeometryCandidates: selected.rejectedGeometryCandidates,
    };
  }
  const selectedDistance = selected.compactnessDistance;
  if (
    selectedDistance !== null &&
    sameCropAlternatives.some(
      (score) => score.compactnessDistance === null || score.compactnessDistance > selectedDistance,
    )
  ) {
    return {
      category: "compactness",
      detail: "Przy równoważnej punktacji wybrano dopuszczalną pozycję bliżej obsadzonej części tej samej przestrzeni.",
      constrainedByCropIds,
      rejectedGeometryCandidates: selected.rejectedGeometryCandidates,
    };
  }
  if (sameSupport.some((score) => score.targetPressure < selected.targetPressure)) {
    return {
      category: "target_mix",
      detail: "Wybrano tę uprawę, aby lepiej zbliżyć całościowy układ do zadeklarowanych udziałów.",
      constrainedByCropIds,
      rejectedGeometryCandidates: selected.rejectedGeometryCandidates,
    };
  }
  if (sameSupportAndTarget.some((score) => score.caution > selected.caution)) {
    return {
      category: "caution_avoidance",
      detail: "Przy porównywalnym wpływie na miks wybrano wariant z mniejszą liczbą lokalnych ostrzeżeń.",
      constrainedByCropIds,
      rejectedGeometryCandidates: selected.rejectedGeometryCandidates,
    };
  }
  if (
    selectedDistance !== null &&
    samePrimaryScores.some(
      (score) => score.compactnessDistance === null || score.compactnessDistance > selectedDistance,
    )
  ) {
    return {
      category: "compactness",
      detail: "Przy równoważnej punktacji wybrano dopuszczalną pozycję bliżej obsadzonej części tej samej przestrzeni.",
      constrainedByCropIds,
      rejectedGeometryCandidates: selected.rejectedGeometryCandidates,
    };
  }
  if (constrainedByCropIds.length > 0 || selected.rejectedGeometryCandidates > 0) {
    const constraints: string[] = [];
    if (constrainedByCropIds.length > 0) constraints.push("potwierdzone negatywne sąsiedztwo");
    if (selected.rejectedGeometryCandidates > 0) constraints.push("końcowa rozstawa lub geometria");
    return {
      category: "hard_constraint_avoidance",
      detail: `Wcześniej rozważane pozycje naruszały: ${constraints.join(" oraz ")}; wybrano dopuszczalną pozycję.`,
      constrainedByCropIds,
      rejectedGeometryCandidates: selected.rejectedGeometryCandidates,
    };
  }
  return {
    category: "deterministic_tie_break",
    detail:
      "Nie było silniejszej potwierdzonej relacji; spośród dopuszczalnych pozycji zadziałał deterministyczny tie-break.",
    constrainedByCropIds,
    rejectedGeometryCandidates: selected.rejectedGeometryCandidates,
  };
}

function createNeighbors(
  position: PlacedPosition,
  placed: readonly PlacedPosition[],
  relations: ReadonlyMap<string, CompanionRelation>,
): GardenLayoutNeighbor[] {
  return placed
    .filter((other) => other !== position)
    .map((other) => ({
      other,
      distance: distanceInSpacingSteps(position, other),
    }))
    .filter(({ distance }) => distance <= 1)
    .map(({ other, distance }) => {
      const relation = relationBetween(position.cropId, other.cropId, relations);
      const status: GardenLayoutNeighbor["status"] = relation?.status ?? "unknown";
      return {
        cropId: other.cropId,
        status,
        distanceInSpacingSteps: Number(distance.toFixed(3)),
        rationale: relation?.rationale ?? null,
        sourceIds: relation?.sourceIds ?? [],
        confidence: relation?.confidence ?? null,
      };
    })
    .sort(
      (left, right) =>
        left.distanceInSpacingSteps - right.distanceInSpacingSteps || left.cropId.localeCompare(right.cropId),
    );
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
  const candidateAlternativesLimit = usableCrops.length > 1 ? MAX_CANDIDATE_ALTERNATIVES_PER_CROP : 1;

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
      const scored: CandidateScore[] = [];
      for (const crop of usableCrops) {
        const candidates = candidatesByCrop.get(crop.selection.crop.id) ?? [];
        const cropScores: CandidateScore[] = [];
        const remainingCandidates: Candidate[] = [];
        let nextCandidateIndex = 0;
        let stoppedByLimit = false;
        let hadOverlappingCandidates = 0;
        const hardBlockers = new Set<string>();
        for (; nextCandidateIndex < candidates.length; nextCandidateIndex += 1) {
          if (candidateChecks >= candidateLimit) {
            stoppedByLimit = true;
            break;
          }
          const candidate = candidates[nextCandidateIndex];
          candidateChecks += 1;
          if (placed.some((existing) => overlaps(existing, candidate))) {
            hadOverlappingCandidates += 1;
            continue;
          }
          const candidateBlockers = getHardBlockers(candidate, placed, relations);
          if (candidateBlockers.length > 0) {
            for (const blocker of candidateBlockers) hardBlockers.add(blocker);
            continue;
          }
          cropScores.push(
            scoreCandidate(candidate, placed, relations, actualCounts, totalPlaced, hadOverlappingCandidates, [
              ...hardBlockers,
            ]),
          );
          if (cropScores.length >= candidateAlternativesLimit) {
            nextCandidateIndex += 1;
            break;
          }
        }

        const stoppedAfterAlternatives = cropScores.length >= candidateAlternativesLimit;
        remainingCandidates.push(...cropScores.map((score) => score.candidate));
        remainingCandidates.push(...candidates.slice(nextCandidateIndex));
        candidatesByCrop.set(crop.selection.crop.id, remainingCandidates);
        scored.push(...cropScores);

        const completedSearch = !stoppedByLimit && !stoppedAfterAlternatives;
        if (cropScores.length === 0 && completedSearch) {
          if (!truncatedGridCropIdsInSpace.has(crop.selection.crop.id)) {
            if (candidates.length === 0 || hadOverlappingCandidates > 0) {
              geometryBlockedCropIds.add(crop.selection.crop.id);
            }
            if (hardBlockers.size > 0) negativeBlockedByCrop.set(crop.selection.crop.id, hardBlockers);
          }
        }
        if (stoppedByLimit || candidateChecks >= candidateLimit) break;
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
        placementReason: createPlacementReason(best, scored),
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
      status: limitReached ? "partial" : "complete",
      positions: placed.map((position) => {
        const { crop: _crop, ...layoutPosition } = position;
        return {
          ...layoutPosition,
          neighbors: createNeighbors(position, placed, relations),
        };
      }),
    });
    if (limitReached) break;
  }

  for (const space of input.spaces.slice(spaceResults.length)) {
    spaceResults.push({ space, positions: [], status: "not_processed" });
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
  if (limitReached && totalCount === 0) {
    throw new GardenLayoutSearchLimitError();
  }
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
    ...(limitReached
      ? [
          `Osiągnięto limit obliczeń; pokazano najlepszy znaleziony układ. Przestrzenie nieprzetworzone: ${
            spaceResults
              .filter((spaceResult) => spaceResult.status === "not_processed")
              .map(({ space }) => space.name ?? space.id)
              .join(", ") || "brak"
          }. Bieżąca przestrzeń może zawierać układ częściowy.`,
        ]
      : []),
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
