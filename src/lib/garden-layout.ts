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

const DEFAULT_CANDIDATE_LIMIT = 100_000;
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
  /** Physical grid orientation; absent on plans created before rotated layouts were supported. */
  orientation?: "standard" | "rotated";
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
  /** Missing on legacy plans and spaces whose baseline allocation was not processed. */
  cropAllocations?: readonly GardenLayoutCropAllocation[];
  /** Missing on older saved plans; new generator output always includes it. */
  status?: "complete" | "partial" | "not_processed";
}

export interface GardenLayoutCropAllocation {
  cropId: string;
  allocatedCount: number;
  placedCount: number;
  missingCount: number;
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
    (value.orientation !== undefined && value.orientation !== "standard" && value.orientation !== "rotated") ||
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

function isCropAllocation(value: unknown): value is GardenLayoutCropAllocation {
  return (
    isRecord(value) &&
    typeof value.cropId === "string" &&
    isNonNegativeInteger(value.allocatedCount) &&
    isNonNegativeInteger(value.placedCount) &&
    isNonNegativeInteger(value.missingCount) &&
    value.missingCount === Math.max(value.allocatedCount - value.placedCount, 0)
  );
}

function isUniqueCropAllocationList(value: unknown): value is GardenLayoutCropAllocation[] {
  if (!Array.isArray(value) || !value.every(isCropAllocation)) return false;
  return new Set(value.map(({ cropId }) => cropId)).size === value.length;
}

function hasConsistentSpaceAllocations(spaceResult: Record<string, unknown>): boolean {
  if (spaceResult.cropAllocations === undefined) return true;
  const positions: unknown = spaceResult.positions;
  if (
    !isUniqueCropAllocationList(spaceResult.cropAllocations) ||
    !Array.isArray(positions) ||
    !positions.every(isLayoutPosition)
  ) {
    return false;
  }
  const placedCounts = new Map<string, number>();
  for (const position of positions) {
    placedCounts.set(position.cropId, (placedCounts.get(position.cropId) ?? 0) + 1);
  }
  return spaceResult.cropAllocations.every(
    ({ cropId, placedCount }) => placedCount === (placedCounts.get(cropId) ?? 0),
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
        spaceResult.positions.every(isLayoutPosition) &&
        hasConsistentSpaceAllocations(spaceResult),
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

export interface GardenLayoutShortfallReport {
  bySpace: readonly {
    space: GardenLayoutSpace;
    crops: readonly { cropId: string; missingCount: number }[];
  }[];
  byCrop: readonly { cropId: string; missingCount: number }[];
  hasUnknownAllocations: boolean;
}

/** Summarizes known shortfalls without inferring allocations for legacy or unprocessed spaces. */
export function createGardenLayoutShortfallReport(result: GardenLayoutResult): GardenLayoutShortfallReport {
  const totals = new Map<string, number>();
  const bySpace = result.spaces.flatMap(({ space, cropAllocations }) => {
    const crops = (cropAllocations ?? [])
      .filter(({ missingCount }) => missingCount > 0)
      .map(({ cropId, missingCount }) => {
        totals.set(cropId, (totals.get(cropId) ?? 0) + missingCount);
        return { cropId, missingCount };
      });
    return crops.length > 0 ? [{ space, crops }] : [];
  });
  const summaryOrder = new Map(result.cropSummaries.map(({ cropId }, index) => [cropId, index]));
  const byCrop = [...totals]
    .map(([cropId, missingCount]) => ({ cropId, missingCount }))
    .sort(
      (left, right) =>
        (summaryOrder.get(left.cropId) ?? Number.MAX_SAFE_INTEGER) -
        (summaryOrder.get(right.cropId) ?? Number.MAX_SAFE_INTEGER),
    );
  return {
    bySpace,
    byCrop,
    hasUnknownAllocations: result.spaces.some(
      ({ cropAllocations, status }) => cropAllocations === undefined || status === "not_processed",
    ),
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
  orientation: "standard" | "rotated";
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
  const firstXStep = first.orientation === "rotated" ? first.spacing.betweenRowsCm : first.spacing.inRowCm;
  const firstYStep = first.orientation === "rotated" ? first.spacing.inRowCm : first.spacing.betweenRowsCm;
  const secondSpacing = "crop" in second ? second.crop : second.spacing;
  const secondOrientation = second.orientation ?? "standard";
  const secondXStep = secondOrientation === "rotated" ? secondSpacing.betweenRowsCm : secondSpacing.inRowCm;
  const secondYStep = secondOrientation === "rotated" ? secondSpacing.inRowCm : secondSpacing.betweenRowsCm;

  return Math.hypot(dx / Math.max(firstXStep, secondXStep), dy / Math.max(firstYStep, secondYStep));
}

function areNeighbors(first: GardenLayoutPosition, second: Candidate | GardenLayoutPosition): boolean {
  // One normalized Euclidean spacing-step is a local layout neighborhood, not a biological claim.
  return distanceInSpacingSteps(first, second) <= 1;
}

function overlaps(first: GardenLayoutPosition, second: Candidate): boolean {
  const dx = Math.abs(first.xCm - second.xCm);
  const dy = Math.abs(first.yCm - second.yCm);
  const firstXStep = first.orientation === "rotated" ? first.spacing.betweenRowsCm : first.spacing.inRowCm;
  const firstYStep = first.orientation === "rotated" ? first.spacing.inRowCm : first.spacing.betweenRowsCm;
  const secondXStep = second.orientation === "rotated" ? second.crop.betweenRowsCm : second.crop.inRowCm;
  const secondYStep = second.orientation === "rotated" ? second.crop.inRowCm : second.crop.betweenRowsCm;

  return dx < Math.max(firstXStep, secondXStep) && dy < Math.max(firstYStep, secondYStep);
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

function makeCandidates(space: GardenLayoutSpace, crop: UsableCrop, candidatePoolLimit: number): CandidateGrid {
  const getDimensions = (rotated: boolean) => {
    const xStep = rotated ? crop.betweenRowsCm : crop.inRowCm;
    const yStep = rotated ? crop.inRowCm : crop.betweenRowsCm;
    const columns = Math.max(0, Math.floor((space.widthCm - xStep) / xStep) + 1);
    const rows = Math.max(0, Math.floor((space.lengthCm - yStep) / yStep) + 1);
    return { xStep, yStep, columns, rows, totalCandidates: columns * rows };
  };
  const standard = getDimensions(false);
  const rotated = getDimensions(true);
  const orientation = rotated.totalCandidates > standard.totalCandidates ? "rotated" : "standard";
  const { xStep, yStep, columns, rows, totalCandidates } = orientation === "rotated" ? rotated : standard;
  const candidates: Candidate[] = [];

  for (let row = 0; row < rows && candidates.length < candidatePoolLimit; row += 1) {
    for (let column = 0; column < columns && candidates.length < candidatePoolLimit; column += 1) {
      candidates.push({
        crop,
        xCm: xStep / 2 + column * xStep,
        yCm: yStep / 2 + row * yStep,
        row,
        column,
        orientation,
      });
    }
  }
  return { candidates, totalCandidates, truncatedCount: Math.max(0, totalCandidates - candidates.length) };
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

function generateSingleCropLayoutPass(
  input: GardenLayoutInput,
  selections: readonly GardenLayoutCropSelection[],
  targetByCrop: ReadonlyMap<string, number>,
  crop: UsableCrop,
  priorOmissions: readonly GardenLayoutOmission[],
  groupedTargets?: ReadonlyMap<string, ReadonlyMap<string, number>>,
): GardenLayoutResult {
  const spaceResults: GardenLayoutSpaceResult[] = [];
  const conflicts: GardenLayoutConflict[] = [];
  const candidateLimit = input.maxCandidates ?? DEFAULT_CANDIDATE_LIMIT;
  let candidateChecks = 0;
  let limitReached = candidateLimit <= 0;
  const cropId = crop.selection.crop.id;
  const spacing = crop.selection.crop.spacing;
  if (candidateLimit <= 0) throw new GardenLayoutSearchLimitError();

  for (const space of input.spaces) {
    const spaceTargets = groupedTargets?.get(space.id);
    if (groupedTargets !== undefined && spaceTargets === undefined) {
      spaceResults.push({ space, positions: [], status: "not_processed" });
      continue;
    }

    const standardColumns = Math.max(0, Math.floor((space.widthCm - crop.inRowCm) / crop.inRowCm) + 1);
    const standardRows = Math.max(0, Math.floor((space.lengthCm - crop.betweenRowsCm) / crop.betweenRowsCm) + 1);
    const rotatedColumns = Math.max(0, Math.floor((space.widthCm - crop.betweenRowsCm) / crop.betweenRowsCm) + 1);
    const rotatedRows = Math.max(0, Math.floor((space.lengthCm - crop.inRowCm) / crop.inRowCm) + 1);
    const standardCount = standardColumns * standardRows;
    const rotatedCount = rotatedColumns * rotatedRows;
    const orientation = rotatedCount > standardCount ? "rotated" : "standard";
    const columns = orientation === "rotated" ? rotatedColumns : standardColumns;
    const availableCount = Math.max(standardCount, rotatedCount);
    const requestedCount = spaceTargets?.get(cropId) ?? availableCount;
    const remainingBudget = Math.max(0, candidateLimit - candidateChecks);
    const placedCount = Math.min(requestedCount, availableCount, remainingBudget);
    const positions: GardenLayoutPosition[] = [];
    const xStep = orientation === "rotated" ? crop.betweenRowsCm : crop.inRowCm;
    const yStep = orientation === "rotated" ? crop.inRowCm : crop.betweenRowsCm;

    for (let index = 0; index < placedCount; index += 1) {
      const row = Math.floor(index / columns);
      const column = index % columns;
      positions.push({
        spaceId: space.id,
        cropId,
        xCm: xStep / 2 + column * xStep,
        yCm: yStep / 2 + row * yStep,
        row,
        column,
        spacing: { inRowCm: crop.inRowCm, betweenRowsCm: crop.betweenRowsCm },
        ...(orientation === "rotated" ? { orientation } : {}),
        confidence: spacing?.confidence ?? "low",
        stage: spacing?.stage ?? "mixed",
        neighbors: [],
        placementReason: {
          category: "deterministic_tie_break",
          detail: "Jedna uprawa w przestrzeni; wybrano deterministyczną siatkę o największej pojemności.",
          constrainedByCropIds: [],
          rejectedGeometryCandidates: 0,
        },
      });
    }

    candidateChecks += placedCount;
    const spaceLimitReached = placedCount < requestedCount && placedCount < availableCount;
    if (spaceLimitReached) limitReached = true;
    if (positions.length === 0 && availableCount === 0 && (groupedTargets === undefined || requestedCount > 0)) {
      conflicts.push({
        spaceId: space.id,
        type: "geometry",
        cropIds: [cropId],
        detail: "Dostępna geometria nie mieści żadnej poprawnej pozycji tej uprawy.",
      });
    }
    spaceResults.push({ space, positions, status: spaceLimitReached ? "partial" : "complete" });
    if (spaceLimitReached) break;
  }

  for (const space of input.spaces.slice(spaceResults.length)) {
    spaceResults.push({ space, positions: [], status: "not_processed" });
  }

  const actualCount = spaceResults.reduce((sum, space) => sum + space.positions.length, 0);
  const omissions: GardenLayoutOmission[] = [...priorOmissions];
  if (actualCount === 0 && input.spaces.length > 0) {
    omissions.push({
      cropId,
      reason: limitReached ? "search_limit" : "no_fit",
      detail: limitReached
        ? "Nie można potwierdzić braku miejsca, ponieważ część pozycji nie została sprawdzona."
        : "Nie znaleziono poprawnej pozycji w dostępnej geometrii.",
    });
  }
  if (limitReached && actualCount === 0) throw new GardenLayoutSearchLimitError();
  const totalRequested = input.spaces.reduce((sum, space) => {
    const target = groupedTargets?.get(space.id)?.get(cropId);
    return sum + (target ?? 0);
  }, 0);
  const hasShortfall =
    groupedTargets === undefined
      ? spaceResults.some((space) => space.status === "partial" || space.status === "not_processed")
      : actualCount < totalRequested;
  const warnings = hasShortfall
    ? [
        `Osiągnięto jawny limit ${candidateLimit} sprawdzonych pozycji; pokazano najlepszy znaleziony układ. Przestrzenie nieprzetworzone: ${
          spaceResults
            .filter((space) => space.status === "not_processed")
            .map(({ space }) => space.name ?? space.id)
            .join(", ") || "brak"
        }. Bieżąca przestrzeń może zawierać układ częściowy.`,
      ]
    : [];
  const totalCount = actualCount;

  return {
    spaces: spaceResults,
    cropSummaries: selections.map((selection) =>
      createSummary(
        selection,
        targetByCrop.get(selection.crop.id) ?? 0,
        selection.crop.id === cropId ? actualCount : 0,
        totalCount,
      ),
    ),
    omissions,
    conflicts,
    warnings,
    metrics: { candidateChecks, supportedNeighbors: 0, cautionNeighbors: 0, limitReached: hasShortfall },
  };
}

/** Generates a bounded, deterministic layout across every supplied garden space. */
function generateGardenLayoutPass(
  input: GardenLayoutInput,
  groupedTargets?: ReadonlyMap<string, ReadonlyMap<string, number>>,
): GardenLayoutResult {
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

  const onlyUsableCrop = usableCrops.at(0);
  if (usableCrops.length === 1 && onlyUsableCrop !== undefined) {
    return generateSingleCropLayoutPass(input, selections, targetByCrop, onlyUsableCrop, omissions, groupedTargets);
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
    const spaceTargets = groupedTargets?.get(space.id);
    if (groupedTargets !== undefined && spaceTargets === undefined) {
      spaceResults.push({ space, positions: [], status: "not_processed" });
      continue;
    }
    const placed: PlacedPosition[] = [];
    let activeCropId: string | null = null;
    const finishedCropIds = new Set<string>();
    const geometryBlockedCropIds = new Set<string>();
    const negativeBlockedByCrop = new Map<string, Set<string>>();
    const truncatedGridCropIdsInSpace = new Set<string>();
    const candidatesByCrop = new Map(
      usableCrops.map((crop) => {
        const perCropCandidatePoolLimit = Math.max(1, Math.floor(candidateLimit / Math.max(usableCrops.length, 1)));
        const grid = makeCandidates(space, crop, perCropCandidatePoolLimit);
        if (grid.truncatedCount > 0) {
          const cropId = crop.selection.crop.id;
          truncatedGridCropIds.add(cropId);
          truncatedGridCropIdsInSpace.add(cropId);
          candidateGridWarnings.push(
            `W przestrzeni "${space.name ?? space.id}" jawny limit wyszukiwania pominął ${grid.truncatedCount} z ${grid.totalCandidates} pozycji siatki dla uprawy ${crop.selection.crop.commonNamePl}.`,
          );
        }
        return [crop.selection.crop.id, grid.candidates] as const;
      }),
    );

    while (candidateChecks < candidateLimit) {
      const scored: CandidateScore[] = [];
      for (const crop of usableCrops) {
        const cropId = crop.selection.crop.id;
        if (
          groupedTargets !== undefined &&
          (finishedCropIds.has(cropId) || (activeCropId !== null && activeCropId !== cropId))
        ) {
          continue;
        }
        const requestedCount = spaceTargets?.get(cropId);
        const placedCropCount = placed.filter((position) => position.cropId === cropId).length;
        if (requestedCount !== undefined && placedCropCount >= requestedCount) continue;
        const candidates = candidatesByCrop.get(cropId) ?? [];
        const existingCropPositions = placed.filter((position) => position.cropId === cropId);
        const canExtendGroup = (candidate: Candidate) =>
          groupedTargets === undefined ||
          existingCropPositions.length === 0 ||
          existingCropPositions.some(
            (position) =>
              Math.max(Math.abs(position.row - candidate.row), Math.abs(position.column - candidate.column)) === 1,
          );
        const deferredCandidates = groupedTargets === undefined ? [] : candidates.filter((c) => !canExtendGroup(c));
        const eligibleCandidates = groupedTargets === undefined ? candidates : candidates.filter(canExtendGroup);
        const cropScores: CandidateScore[] = [];
        const remainingCandidates: Candidate[] = [];
        let nextCandidateIndex = 0;
        let stoppedByLimit = false;
        let hadOverlappingCandidates = 0;
        const hardBlockers = new Set<string>();
        for (; nextCandidateIndex < eligibleCandidates.length; nextCandidateIndex += 1) {
          if (candidateChecks >= candidateLimit) {
            stoppedByLimit = true;
            break;
          }
          const candidate = eligibleCandidates[nextCandidateIndex];
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
        remainingCandidates.push(...deferredCandidates);
        remainingCandidates.push(...cropScores.map((score) => score.candidate));
        remainingCandidates.push(...eligibleCandidates.slice(nextCandidateIndex));
        candidatesByCrop.set(cropId, remainingCandidates);
        scored.push(...cropScores);

        const completedSearch = !stoppedByLimit && !stoppedAfterAlternatives;
        if (cropScores.length === 0 && completedSearch) {
          if (!truncatedGridCropIdsInSpace.has(crop.selection.crop.id)) {
            if (hardBlockers.size === 0 && (candidates.length === 0 || hadOverlappingCandidates > 0)) {
              geometryBlockedCropIds.add(crop.selection.crop.id);
            }
            if (hardBlockers.size > 0) negativeBlockedByCrop.set(crop.selection.crop.id, hardBlockers);
          }
        }
        if (stoppedByLimit || candidateChecks >= candidateLimit) break;
      }

      if (scored.length === 0) {
        if (activeCropId !== null) {
          finishedCropIds.add(activeCropId);
          activeCropId = null;
          continue;
        }
        break;
      }
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
        ...(selected.orientation === "rotated" ? { orientation: selected.orientation } : {}),
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
      if (groupedTargets !== undefined) {
        activeCropId = position.cropId;
        if (
          placed.filter((placedPosition) => placedPosition.cropId === position.cropId).length >=
          (spaceTargets?.get(position.cropId) ?? 0)
        ) {
          finishedCropIds.add(position.cropId);
          activeCropId = null;
        }
      }
    }

    if (truncatedGridCropIdsInSpace.size > 0) limitReached = true;
    if (candidateChecks >= candidateLimit) {
      limitReached = true;
    }

    if (geometryBlockedCropIds.size > 0) geometryBlockedBySpace.set(space.id, geometryBlockedCropIds);
    if (negativeBlockedByCrop.size > 0) negativeBlockedBySpace.set(space.id, negativeBlockedByCrop);

    spaceResults.push({
      space,
      status: limitReached ? "partial" : "complete",
      positions: placed
        .map((position) => {
          const { crop: _crop, ...layoutPosition } = position;
          return {
            ...layoutPosition,
            neighbors: createNeighbors(position, placed, relations),
          };
        })
        .sort(
          (left, right) =>
            left.row - right.row || left.column - right.column || left.cropId.localeCompare(right.cropId),
        ),
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

/** Uses the current deterministic allocation as per-bed targets, then places each crop as one connected cluster. */
export function generateGardenLayout(input: GardenLayoutInput): GardenLayoutResult {
  const baseline = generateGardenLayoutPass(input);
  const targets = new Map<string, ReadonlyMap<string, number>>();
  for (const spaceResult of baseline.spaces) {
    if (spaceResult.status === "not_processed") continue;
    const counts = new Map<string, number>(baseline.cropSummaries.map(({ cropId }) => [cropId, 0] as const));
    for (const position of spaceResult.positions) {
      counts.set(position.cropId, (counts.get(position.cropId) ?? 0) + 1);
    }
    targets.set(spaceResult.space.id, counts);
  }

  const grouped = generateGardenLayoutPass(input, targets);
  const candidateChecks = baseline.metrics.candidateChecks + grouped.metrics.candidateChecks;
  const limitReached = baseline.metrics.limitReached || grouped.metrics.limitReached;
  const spaces = grouped.spaces.map((spaceResult, index) => {
    const baselineSpace = baseline.spaces[index];
    if (baselineSpace.status === "not_processed") {
      return { ...spaceResult, status: "not_processed" as const, positions: [] };
    }
    const placedCounts = new Map<string, number>();
    for (const position of spaceResult.positions) {
      placedCounts.set(position.cropId, (placedCounts.get(position.cropId) ?? 0) + 1);
    }
    const baselineCounts = new Map<string, number>();
    for (const position of baselineSpace.positions) {
      baselineCounts.set(position.cropId, (baselineCounts.get(position.cropId) ?? 0) + 1);
    }
    const cropAllocations = baseline.cropSummaries.map(({ cropId }) => {
      const allocatedCount = baselineCounts.get(cropId) ?? 0;
      const placedCount = placedCounts.get(cropId) ?? 0;
      return {
        cropId,
        allocatedCount,
        placedCount,
        missingCount: Math.max(allocatedCount - placedCount, 0),
      };
    });
    if (baselineSpace.status === "partial" && spaceResult.status !== "not_processed") {
      return { ...spaceResult, cropAllocations, status: "partial" as const };
    }
    return { ...spaceResult, cropAllocations };
  });
  const warnings = [...baseline.warnings, ...grouped.warnings].filter(
    (warning, index, allWarnings) => allWarnings.indexOf(warning) === index,
  );
  const placedCropIds = new Set(spaces.flatMap(({ positions }) => positions.map(({ cropId }) => cropId)));
  const conflicts = [
    ...grouped.conflicts,
    ...baseline.conflicts.filter((conflict) => !placedCropIds.has(conflict.cropIds[0] ?? "")),
  ].filter(
    (conflict, index, allConflicts) =>
      allConflicts.findIndex(
        (candidate) =>
          candidate.spaceId === conflict.spaceId &&
          candidate.type === conflict.type &&
          [...candidate.cropIds].sort().join("::") === [...conflict.cropIds].sort().join("::"),
      ) === index,
  );
  return {
    ...grouped,
    spaces,
    warnings,
    conflicts,
    metrics: {
      candidateChecks,
      supportedNeighbors: grouped.metrics.supportedNeighbors,
      cautionNeighbors: grouped.metrics.cautionNeighbors,
      limitReached,
    },
  };
}
