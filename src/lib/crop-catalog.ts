import {
  COMPANION_RELATIONS,
  CROP_CATALOG,
  type CompanionRelation,
  type CompanionStatus,
  type CropCatalogEntry,
  type SourceId,
} from "../data/crop-catalog.js";

export type CropCompanionStatus = CompanionStatus | "unknown";

export interface CompanionRelationResult {
  cropIds: readonly [string, string];
  status: CropCompanionStatus;
  rationale: string;
  sourceIds: readonly SourceId[];
  relation: CompanionRelation | null;
  hardBlock: false;
}

const relationByPair = new Map(
  COMPANION_RELATIONS.map((relation) => [canonicalPair(...relation.cropIds), relation] as const),
);

function canonicalPair(firstCropId: string, secondCropId: string): string {
  return [firstCropId, secondCropId].sort().join("::");
}

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("pl-PL")
    .trim();
}

function compareCropNames(first: CropCatalogEntry, second: CropCatalogEntry): number {
  return first.commonNamePl.localeCompare(second.commonNamePl, "pl-PL") || first.id.localeCompare(second.id);
}

export function listCrops(): readonly CropCatalogEntry[] {
  return [...CROP_CATALOG].sort(compareCropNames);
}

export function getCropById(cropId: string): CropCatalogEntry | undefined {
  return CROP_CATALOG.find((crop) => crop.id === cropId);
}

export function searchCrops(query: string): readonly CropCatalogEntry[] {
  const normalizedQuery = normalizeSearchText(query);

  return listCrops().filter((crop) => {
    const searchableValues = [crop.commonNamePl, ...crop.aliases].map(normalizeSearchText);
    return normalizedQuery.length === 0 || searchableValues.some((value) => value.includes(normalizedQuery));
  });
}

export function getCompanionRelation(firstCropId: string, secondCropId: string): CompanionRelationResult {
  const cropIds = [firstCropId, secondCropId].sort() as [string, string];
  const relation = relationByPair.get(canonicalPair(firstCropId, secondCropId));

  if (relation === undefined) {
    return {
      cropIds,
      status: "unknown",
      rationale: "Brak źródłowej reguły dla tej pary; brak wpisu nie jest zakazem sąsiedztwa.",
      sourceIds: [],
      relation: null,
      hardBlock: false,
    };
  }

  return {
    cropIds,
    status: relation.status,
    rationale: relation.rationale,
    sourceIds: relation.sourceIds,
    relation,
    hardBlock: false,
  };
}
