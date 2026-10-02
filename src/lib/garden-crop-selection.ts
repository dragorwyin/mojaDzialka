import { getCropById } from "./crop-catalog.js";

export interface GardenCropSelection {
  cropId: string;
  proportion: number;
}

export type GardenCropSelectionResolution =
  | { status: "active"; displayName: string }
  | { status: "retired"; displayName: string }
  | { status: "unknown"; displayName: string };

const RETIRED_CROP_NAMES = new Map<string, string>([
  ["fasola-zwykla", "fasola szparagowa"],
  ["bob", "bób"],
]);

export function resolveGardenCropSelection(cropId: string): GardenCropSelectionResolution {
  const crop = getCropById(cropId);
  if (crop) return { status: "active", displayName: crop.commonNamePl };

  const retiredName = RETIRED_CROP_NAMES.get(cropId);
  if (retiredName) return { status: "retired", displayName: retiredName };

  return { status: "unknown", displayName: cropId };
}

export function canGenerateGardenPlan(input: {
  inputsUnavailable: boolean;
  hasSpaces: boolean;
  hasCrops: boolean;
  hasUnresolvedCrops: boolean;
}): boolean {
  return !input.inputsUnavailable && input.hasSpaces && input.hasCrops && !input.hasUnresolvedCrops;
}

export function validateGardenCropSelection(input: unknown): GardenCropSelection[] | null {
  if (!Array.isArray(input)) return null;

  const selectedCropIds = new Set<string>();
  const selections: GardenCropSelection[] = [];

  for (const item of input) {
    if (typeof item !== "object" || item === null || Array.isArray(item)) return null;

    const candidate = item as Record<string, unknown>;
    const cropId = candidate.cropId;
    const proportion = candidate.proportion;

    if (typeof cropId !== "string" || getCropById(cropId) === undefined) return null;
    if (selectedCropIds.has(cropId)) return null;
    if (typeof proportion !== "number" || !Number.isFinite(proportion) || proportion <= 0) return null;

    selectedCropIds.add(cropId);
    selections.push({ cropId, proportion });
  }

  return selections;
}
