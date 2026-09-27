import { getCropById } from "./crop-catalog.js";

export interface GardenCropSelection {
  cropId: string;
  proportion: number;
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
