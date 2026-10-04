import { describe, expect, it } from "vitest";

import {
  CROP_ATLAS_COLUMNS,
  CROP_ATLAS_HREF,
  CROP_ATLAS_ROWS,
  CROP_ATLAS_SOURCE_HEIGHT,
  CROP_ATLAS_SOURCE_WIDTH,
  CROP_THUMBNAIL_MANIFEST,
  getCropAtlasCellViewBox,
  resolveCropThumbnailPresentation,
} from "../components/garden/crop-thumbnail-manifest.js";
import { COMPANION_RELATIONS, CROP_CATALOG, CROP_SOURCES, validateCropCatalog, type SourceId } from "./crop-catalog.js";

describe("crop catalog", () => {
  it("maps every active crop to one atlas cell and retains a text fallback", () => {
    const activeIds = CROP_CATALOG.map((crop) => crop.id);
    const manifestIds = CROP_THUMBNAIL_MANIFEST.map((cell) => cell.cropId);
    const cellKeys = CROP_THUMBNAIL_MANIFEST.map((cell) => `${cell.row}:${cell.column}`);
    const frameKeys = CROP_THUMBNAIL_MANIFEST.map(
      ({ frame }) => `${frame.x}:${frame.y}:${frame.width}:${frame.height}`,
    );
    const expectedCellKeys = CROP_THUMBNAIL_MANIFEST.map(
      (_, index) => `${Math.floor(index / CROP_ATLAS_COLUMNS)}:${index % CROP_ATLAS_COLUMNS}`,
    );
    const framesAreInsideSource = CROP_THUMBNAIL_MANIFEST.every(
      ({ frame }) =>
        Number.isInteger(frame.x) &&
        Number.isInteger(frame.y) &&
        Number.isInteger(frame.width) &&
        Number.isInteger(frame.height) &&
        frame.x >= 0 &&
        frame.y >= 0 &&
        frame.width > 0 &&
        frame.height > 0 &&
        frame.x + frame.width <= CROP_ATLAS_SOURCE_WIDTH &&
        frame.y + frame.height <= CROP_ATLAS_SOURCE_HEIGHT,
    );
    const framesDoNotOverlap = CROP_THUMBNAIL_MANIFEST.every(({ frame }, index) =>
      CROP_THUMBNAIL_MANIFEST.slice(index + 1).every(
        ({ frame: other }) =>
          frame.x + frame.width <= other.x ||
          other.x + other.width <= frame.x ||
          frame.y + frame.height <= other.y ||
          other.y + other.height <= frame.y,
      ),
    );
    const fallback = resolveCropThumbnailPresentation("unmapped-crop", "31");
    const chives = CROP_THUMBNAIL_MANIFEST.find((cell) => cell.cropId === "szczypiorek");

    expect(CROP_THUMBNAIL_MANIFEST).toHaveLength(31);
    expect(new Set(manifestIds).size).toBe(31);
    expect([...manifestIds].sort()).toEqual([...activeIds].sort());
    expect(new Set(cellKeys).size).toBe(31);
    expect(cellKeys).toEqual(expectedCellKeys);
    expect(new Set(frameKeys).size).toBe(31);
    expect(framesAreInsideSource).toBe(true);
    expect(framesDoNotOverlap).toBe(true);
    expect(
      CROP_THUMBNAIL_MANIFEST.every((cell) => cell.row < CROP_ATLAS_ROWS && cell.column < CROP_ATLAS_COLUMNS),
    ).toBe(true);
    expect(CROP_ATLAS_HREF).toBe("/crops/crop-atlas.webp");
    expect(CROP_ATLAS_SOURCE_WIDTH).toBe(1275);
    expect(CROP_ATLAS_SOURCE_HEIGHT).toBe(1234);
    expect(chives && getCropAtlasCellViewBox(chives)).toBe("46 1047 151 177");
    expect(fallback).toEqual({ kind: "text", fallbackLabel: "31" });
  });

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
    const carrot = CROP_CATALOG.find((crop) => crop.id === "marchew");
    expect(carrot).toMatchObject({
      id: "marchew",
      finalSpacing: {
        inRowCm: { min: 7, max: 8 },
        betweenRowsCm: { min: 20, max: 30 },
        stage: "after_thinning",
        sourceIds: ["S54", "S55"],
        confidence: "low",
      },
      sowingDensity: {
        inRowCm: { min: 2, max: 3 },
        betweenRowsCm: { min: 20, max: 30 },
        sourceIds: ["S64"],
      },
    });
    expect(carrot?.finalSpacing?.context).toMatch(
      /użytkownik zatwierdził minimum 7 cm.*nie jest potwierdzony przez źródła S54\/S55.*po przerywce.*nie gęstość siewu/i,
    );
    expect(carrot?.sowingDensity?.context).toMatch(/siew.*osobny parametr.*nie końcowa obsada/i);
  });

  it("maps final spacing metadata into the layout compatibility view without losing uncertainty", () => {
    for (const crop of CROP_CATALOG) {
      if (crop.finalSpacing === null) {
        expect(crop.spacing).toBeNull();
        continue;
      }

      const final = crop.finalSpacing;
      expect(crop.spacing).toEqual({
        publishedPairCm: null,
        inRowCm: final.inRowCm,
        betweenRowsCm: final.betweenRowsCm,
        context: final.context,
        sourceIds: final.sourceIds,
        confidence: final.confidence,
        axisVerified: true,
        stage: final.stage === "after_thinning" ? "thinning" : "planting",
        isFinalPlanting: true,
      });
    }

    const corn = CROP_CATALOG.find((crop) => crop.id === "kukurydza-cukrowa");
    expect(corn?.finalSpacing).toBeNull();
    expect(corn?.sowingDensity).not.toBeNull();
    expect(corn?.spacing).toBeNull();
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

  it("keeps seasonal examples tied to independently reviewed Polish sources", () => {
    const tomato = CROP_CATALOG.find((crop) => crop.id === "pomidor");
    expect(tomato?.seasonWindows).toEqual([
      {
        startMonth: 3,
        endMonth: 4,
        method: "seedling",
        condition: "Wysiew rozsady; tabela dotyczy produkcji gruntowej, warunki domowe mogą się różnić.",
        sourceIds: ["S7"],
        confidence: "medium",
      },
      {
        startMonth: 5,
        endMonth: 5,
        method: "plant_out",
        condition: "Sadzenie rozsady w gruncie w drugiej połowie maja; lokalnie po ustąpieniu przymrozków.",
        sourceIds: ["S7"],
        confidence: "medium",
      },
      {
        startMonth: 5,
        endMonth: 6,
        method: "direct_sow",
        condition: "Siew bezpośredni w gruncie w cieplejszym okresie; termin zależy od warunków lokalnych.",
        sourceIds: ["S7"],
        confidence: "medium",
      },
    ]);

    const potato = CROP_CATALOG.find((crop) => crop.id === "ziemniak");
    expect(potato?.seasonWindows[0]).toMatchObject({
      startMonth: 4,
      endMonth: 5,
      method: "plant_out",
      sourceIds: ["S67"],
      confidence: "medium",
    });
    expect(CROP_SOURCES.find((source) => source.id === "S67")?.url).toBe(
      "https://www.gov.pl/attachment/07d4d440-6a1f-44e4-a68d-ea5b34005d4e",
    );

    const arugula = CROP_CATALOG.find((crop) => crop.id === "rukola");
    expect(arugula).toMatchObject({ seasonWindows: [], needsLocalValidation: true });

    expect(CROP_CATALOG.find((crop) => crop.id === "marchew")?.seasonWindows).toEqual([
      expect.objectContaining({ startMonth: 3, endMonth: 6, method: "direct_sow", sourceIds: ["S7"] }),
      expect.objectContaining({ startMonth: 11, endMonth: 11, method: "direct_sow", sourceIds: ["S7"] }),
    ]);
    expect(CROP_CATALOG.find((crop) => crop.id === "rzodkiewka")?.seasonWindows).toEqual([
      expect.objectContaining({ startMonth: 3, endMonth: 5, method: "direct_sow", sourceIds: ["S7"] }),
      expect.objectContaining({ startMonth: 7, endMonth: 9, method: "direct_sow", sourceIds: ["S7"] }),
    ]);
    expect(CROP_CATALOG.find((crop) => crop.id === "cebula")?.seasonWindows).toEqual([
      expect.objectContaining({ startMonth: 2, endMonth: 3, method: "seedling", sourceIds: ["S7"] }),
      expect.objectContaining({ startMonth: 3, endMonth: 4, method: "direct_sow", sourceIds: ["S7"] }),
      expect.objectContaining({ startMonth: 4, endMonth: 5, method: "plant_out", sourceIds: ["S7"] }),
    ]);
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

  it("rejects unknown seasonal methods and source references", () => {
    const invalidMethodCatalog = CROP_CATALOG.map((crop) =>
      crop.id === "pomidor"
        ? {
            ...crop,
            seasonWindows: [{ ...crop.seasonWindows[0], method: "sprouting" as never }],
          }
        : crop,
    );
    const invalidSeasonSourceCatalog = CROP_CATALOG.map((crop) =>
      crop.id === "pomidor"
        ? {
            ...crop,
            seasonWindows: [{ ...crop.seasonWindows[0], sourceIds: ["S99" as SourceId] }],
          }
        : crop,
    );
    const invalidSeasonMonthCatalog = CROP_CATALOG.map((crop) =>
      crop.id === "pomidor"
        ? {
            ...crop,
            seasonWindows: [{ ...crop.seasonWindows[0], startMonth: 13 }],
          }
        : crop,
    );

    expect(() => {
      validateCropCatalog(invalidMethodCatalog, COMPANION_RELATIONS);
    }).toThrow(/unknown method/);
    expect(() => {
      validateCropCatalog(invalidSeasonSourceCatalog, COMPANION_RELATIONS);
    }).toThrow(/unknown source/);
    expect(() => {
      validateCropCatalog(invalidSeasonMonthCatalog, COMPANION_RELATIONS);
    }).toThrow(/start month is out of range/);
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
