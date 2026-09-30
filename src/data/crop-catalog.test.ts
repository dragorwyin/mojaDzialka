import { describe, expect, it } from "vitest";

import { COMPANION_RELATIONS, CROP_CATALOG, validateCropCatalog, type SourceId } from "./crop-catalog.js";

describe("crop catalog", () => {
  it("contains exactly the 31 agreed active IDs and no retired bean records", () => {
    const expectedIds = [
      "pomidor",
      "pomidor-koktajlowy-palikowany",
      "ogorek",
      "pietruszka",
      "marchew",
      "cebula",
      "burak-cwiklowy",
      "rzodkiewka",
      "salata",
      "kapusta-biala",
      "kalafior",
      "brokul",
      "kalarepa",
      "jarmuz",
      "cukinia",
      "dynia",
      "papryka",
      "por",
      "szpinak",
      "seler",
      "kukurydza-cukrowa",
      "czosnek",
      "pasternak",
      "rukola",
      "roszponka",
      "baklazan",
      "rzepa",
      "ziemniak",
      "groch",
      "koper",
      "szczypiorek",
    ];

    expect(CROP_CATALOG).toHaveLength(31);
    expect(new Set(CROP_CATALOG.map((crop) => crop.id)).size).toBe(31);
    expect(CROP_CATALOG.map((crop) => crop.id).sort()).toEqual(expectedIds.sort());
    expect(CROP_CATALOG.every((crop) => crop.commonNamePl.length > 0 && crop.sourceIds.length > 0)).toBe(true);
    expect(COMPANION_RELATIONS.flatMap((relation) => relation.cropIds)).not.toContain("fasola-zwykla");
    expect(COMPANION_RELATIONS.flatMap((relation) => relation.cropIds)).not.toContain("bob");
  });

  it("keeps final spacing separate from sowing density and preserves missing final data", () => {
    const cropsWithFinalSpacing = CROP_CATALOG.filter((crop) => crop.finalSpacing !== null);
    expect(cropsWithFinalSpacing).toHaveLength(28);
    expect(
      cropsWithFinalSpacing.every(
        (crop) =>
          crop.catalogConfidence.length > 0 &&
          crop.finalSpacing !== null &&
          crop.finalSpacing.inRowCm.min > 0 &&
          crop.finalSpacing.betweenRowsCm.min > 0 &&
          crop.finalSpacing.sourceIds.length > 0 &&
          crop.finalSpacing.context.length > 0 &&
          crop.spacing !== null &&
          crop.spacing.axisVerified &&
          crop.spacing.inRowCm !== null &&
          crop.spacing.betweenRowsCm !== null &&
          crop.spacing.publishedPairCm === null &&
          crop.spacing.sourceIds.length > 0 &&
          crop.spacing.context.length > 0 &&
          crop.spacing.isFinalPlanting,
      ),
    ).toBe(true);
    expect(CROP_CATALOG.find((crop) => crop.id === "pomidor")).toMatchObject({
      commonNamePl: "pomidor Faworyt",
      finalSpacing: {
        inRowCm: { min: 50, max: 50 },
        betweenRowsCm: { min: 100, max: 100 },
        sourceIds: ["S45", "S15"],
      },
    });
    expect(CROP_CATALOG.find((crop) => crop.id === "pomidor-koktajlowy-palikowany")?.id).toBe(
      "pomidor-koktajlowy-palikowany",
    );
    expect(CROP_CATALOG.find((crop) => crop.id === "szczypiorek")?.finalSpacing?.unit).toBe("clump");

    const corn = CROP_CATALOG.find((crop) => crop.id === "kukurydza-cukrowa");
    expect(corn?.finalSpacing).toBeNull();
    expect(corn?.spacing).toBeNull();
    expect(corn?.sowingDensity?.inRowCm).toEqual({ min: 20, max: 30 });
    expect(CROP_CATALOG.find((crop) => crop.id === "marchew")).toMatchObject({
      finalSpacing: { inRowCm: { min: 3, max: 5 }, betweenRowsCm: { min: 20, max: 30 } },
      sowingDensity: { inRowCm: { min: 2, max: 3 } },
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
      if (crop.id !== "marchew" || crop.finalSpacing === null) {
        return crop;
      }

      return {
        ...crop,
        finalSpacing: {
          ...crop.finalSpacing,
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
