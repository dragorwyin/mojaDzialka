import { describe, expect, it } from "vitest";

import { COMPANION_RELATIONS, CROP_CATALOG, validateCropCatalog, type SourceId } from "./crop-catalog.js";

describe("crop catalog", () => {
  it("contains exactly 30 uniquely identified records", () => {
    expect(CROP_CATALOG).toHaveLength(30);
    expect(new Set(CROP_CATALOG.map((crop) => crop.id)).size).toBe(30);
    expect(CROP_CATALOG.every((crop) => crop.commonNamePl.length > 0 && crop.sourceIds.length > 0)).toBe(true);
  });

  it("gives all 30 crops sourced working spacing with explicitly named axes and planning metadata", () => {
    expect(CROP_CATALOG.every((crop) => crop.spacing !== null)).toBe(true);
    expect(
      CROP_CATALOG.every(
        (crop) =>
          crop.spacing !== null &&
          crop.spacing.axisVerified &&
          crop.spacing.inRowCm !== null &&
          crop.spacing.betweenRowsCm !== null &&
          crop.spacing.publishedPairCm === null &&
          crop.spacing.sourceIds.length > 0 &&
          crop.spacing.context.length > 0 &&
          crop.spacing.stage.length > 0 &&
          typeof crop.spacing.isFinalPlanting === "boolean",
      ),
    ).toBe(true);
    expect(CROP_CATALOG.find((crop) => crop.id === "pomidor")?.spacing).toMatchObject({
      inRowCm: { min: 50, max: 60 },
      betweenRowsCm: { min: 100, max: 150 },
      sourceIds: ["S15"],
      stage: "planting",
      isFinalPlanting: true,
    });
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

  it("allows only an explicitly negative relation to be a hard block", () => {
    const negativeRelation = {
      cropIds: ["marchew", "cebula"] as const,
      status: "negative" as const,
      relationshipType: "disease_risk" as const,
      confidence: "high" as const,
      rationale: "Testowa, jawnie potwierdzona relacja negatywna.",
      sourceIds: ["S2"] as const,
      hardBlock: true,
    };

    expect(() => {
      validateCropCatalog(CROP_CATALOG, [negativeRelation]);
    }).not.toThrow();
    expect(() => {
      validateCropCatalog(CROP_CATALOG, [{ ...negativeRelation, status: "caution", hardBlock: true }]);
    }).toThrow(/only be a hard block/);
  });
});
