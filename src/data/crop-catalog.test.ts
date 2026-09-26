import { describe, expect, it } from "vitest";

import { COMPANION_RELATIONS, CROP_CATALOG, validateCropCatalog, type SourceId } from "./crop-catalog.js";

describe("crop catalog", () => {
  it("contains exactly 30 uniquely identified records", () => {
    expect(CROP_CATALOG).toHaveLength(30);
    expect(new Set(CROP_CATALOG.map((crop) => crop.id)).size).toBe(30);
    expect(CROP_CATALOG.every((crop) => crop.commonNamePl.length > 0 && crop.sourceIds.length > 0)).toBe(true);
  });

  it("keeps local validation and non-blocking relation semantics explicit", () => {
    expect(CROP_CATALOG.find((crop) => crop.id === "ziemniak")).toMatchObject({
      needsLocalValidation: true,
    });
    expect(CROP_CATALOG.find((crop) => crop.id === "czosnek")).toMatchObject({
      needsLocalValidation: false,
    });
    expect(COMPANION_RELATIONS.every((relation) => !relation.hardBlock)).toBe(true);
  });

  it("rejects invalid spacing, source references, and relations", () => {
    const invalidSpacingCatalog = CROP_CATALOG.map((crop) => {
      if (crop.id !== "marchew" || crop.spacing === null) {
        return crop;
      }

      return {
        ...crop,
        spacing: {
          ...crop.spacing,
          inRowCm: { min: 0, max: 2 },
        },
      };
    });
    const invalidSourceCatalog = CROP_CATALOG.map((crop) => {
      if (crop.id === "marchew") {
        return { ...crop, sourceIds: ["S99" as SourceId] };
      }

      return crop;
    });
    const invalidRelations = [
      ...COMPANION_RELATIONS,
      { ...COMPANION_RELATIONS[0], cropIds: ["marchew", "nieistniejaca"] as const },
    ];

    expect(() => {
      validateCropCatalog(invalidSpacingCatalog, COMPANION_RELATIONS);
    }).toThrow(/must be positive/);
    expect(() => {
      validateCropCatalog(invalidSourceCatalog, COMPANION_RELATIONS);
    }).toThrow(/unknown source/);
    expect(() => {
      validateCropCatalog(CROP_CATALOG, invalidRelations);
    }).toThrow(/unknown crop/);
  });
});
