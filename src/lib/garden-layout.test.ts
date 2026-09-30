import { describe, expect, it } from "vitest";

import { CROP_CATALOG, type CompanionRelation, type CropCatalogEntry } from "../data/crop-catalog.js";
import { generateGardenLayout } from "./garden-layout.js";

function crop(id: string): CropCatalogEntry {
  const entry = CROP_CATALOG.find((candidate) => candidate.id === id);
  if (!entry) throw new Error(`Missing fixture crop: ${id}`);
  return entry;
}

function compactCrop(id: string, inRowCm = 30, betweenRowsCm = 30): CropCatalogEntry {
  const entry = crop(id);
  return {
    ...entry,
    spacing: {
      publishedPairCm: null,
      inRowCm: { min: inRowCm, max: inRowCm },
      betweenRowsCm: { min: betweenRowsCm, max: betweenRowsCm },
      context: "Testowa końcowa siatka uprawy.",
      sourceIds: entry.spacing?.sourceIds ?? ["S2"],
      confidence: "medium",
      axisVerified: true,
      stage: "final_planting",
      isFinalPlanting: true,
    },
  };
}

const spaces = [
  { id: "bed-a", name: "Skrzynia A", widthCm: 200, lengthCm: 100 },
  { id: "bed-b", name: "Skrzynia B", widthCm: 200, lengthCm: 100 },
] as const;

describe("garden layout engine", () => {
  it("lays out the whole mix across two 200x100 cm spaces and reports target versus actual", () => {
    const input = {
      spaces,
      crops: [
        { crop: compactCrop("marchew", 30, 30), proportion: 30 },
        { crop: compactCrop("cebula", 30, 30), proportion: 10 },
        { crop: compactCrop("brokul", 40, 30), proportion: 40 },
        { crop: compactCrop("czosnek", 30, 30), proportion: 20 },
      ],
    };

    const result = generateGardenLayout(input);
    const second = generateGardenLayout(input);

    expect(result).toEqual(second);
    expect(result.spaces).toHaveLength(2);
    expect(result.cropSummaries.map((summary) => summary.targetPercentage)).toEqual([40, 10, 20, 30]);
    expect(result.cropSummaries.reduce((sum, summary) => sum + summary.actualCount, 0)).toBe(
      result.spaces.flatMap((space) => space.positions).length,
    );
    expect(result.cropSummaries.reduce((sum, summary) => sum + summary.actualPercentage, 0)).toBeCloseTo(100);

    for (const space of result.spaces) {
      for (const position of space.positions) {
        expect(position.xCm).toBeGreaterThan(0);
        expect(position.xCm).toBeLessThanOrEqual(space.space.widthCm);
        expect(position.yCm).toBeGreaterThan(0);
        expect(position.yCm).toBeLessThanOrEqual(space.space.lengthCm);
      }

      for (const [leftIndex, left] of space.positions.entries()) {
        for (const right of space.positions.slice(leftIndex + 1)) {
          const dx = Math.abs(left.xCm - right.xCm);
          const dy = Math.abs(left.yCm - right.yCm);
          expect(
            dx >= Math.max(left.spacing.inRowCm, right.spacing.inRowCm) ||
              dy >= Math.max(left.spacing.betweenRowsCm, right.spacing.betweenRowsCm),
          ).toBe(true);
        }
      }
    }
  });

  it("uses the whole-garden mix when choosing crops for later spaces", () => {
    const result = generateGardenLayout({
      spaces: [
        { id: "small", widthCm: 30, lengthCm: 30 },
        { id: "larger", widthCm: 40, lengthCm: 40 },
      ],
      crops: [
        { crop: compactCrop("marchew"), proportion: 90 },
        { crop: compactCrop("cebula"), proportion: 10 },
      ],
      relations: [],
    });

    expect(result.spaces.map((space) => space.positions[0]?.cropId)).toEqual(["marchew", "cebula"]);
    expect(result.cropSummaries.find((summary) => summary.cropId === "marchew")).toMatchObject({
      targetPercentage: 90,
      actualPercentage: 50,
      actualCount: 1,
    });
    expect(result.cropSummaries.find((summary) => summary.cropId === "cebula")).toMatchObject({
      targetPercentage: 10,
      actualPercentage: 50,
      actualCount: 1,
    });
  });

  it("reports the exact number of positions omitted by the per-crop grid limit", () => {
    const result = generateGardenLayout({
      spaces: [{ id: "radish-bed", name: "Grządka rzodkiewki", widthCm: 200, lengthCm: 100 }],
      crops: [{ crop: compactCrop("rzodkiewka", 2, 10), proportion: 100 }],
      relations: [],
    });

    expect(result.spaces[0]?.positions).toHaveLength(256);
    expect(result.warnings).toContain(
      'W przestrzeni "Grządka rzodkiewki" pominięto 744 z 1000 pozycji siatki dla uprawy rzodkiewka (limit 256).',
    );
    expect(result.metrics.limitReached).toBe(false);
  });

  it("prioritizes a supported neighbor over a large target-percentage gap", () => {
    const supportedRelation: CompanionRelation = {
      cropIds: ["marchew", "cebula"],
      status: "supported",
      relationshipType: "pest_management",
      confidence: "high",
      rationale: "Testowa dobra para.",
      sourceIds: ["S2"],
      hardBlock: false,
    };

    const result = generateGardenLayout({
      spaces: [{ id: "small", widthCm: 60, lengthCm: 30 }],
      crops: [
        { crop: compactCrop("marchew"), proportion: 99 },
        { crop: compactCrop("cebula"), proportion: 1 },
      ],
      relations: [supportedRelation],
    });

    const onion = result.cropSummaries.find((summary) => summary.cropId === "cebula");
    expect(result.spaces[0]?.positions).toHaveLength(2);
    expect(result.metrics.supportedNeighbors).toBe(1);
    expect(onion).toMatchObject({ targetPercentage: 1, actualPercentage: 50, actualCount: 1 });
  });

  it("does not hard-block a nonnegative relation when its hardBlock flag is inconsistent", () => {
    const inconsistentRelation: CompanionRelation = {
      cropIds: ["marchew", "cebula"],
      status: "supported",
      relationshipType: "pest_management",
      confidence: "high",
      rationale: "Testowa sprzeczność statusu z flagą blokady.",
      sourceIds: ["S2"],
      hardBlock: true,
    };
    const result = generateGardenLayout({
      spaces: [{ id: "small", widthCm: 60, lengthCm: 30 }],
      crops: [
        { crop: compactCrop("marchew"), proportion: 50 },
        { crop: compactCrop("cebula"), proportion: 50 },
      ],
      relations: [inconsistentRelation],
    });

    expect(result.spaces[0]?.positions).toHaveLength(2);
    expect(new Set(result.spaces[0]?.positions.map((position) => position.cropId))).toEqual(
      new Set(["marchew", "cebula"]),
    );
  });

  it("allows caution neighbors and keeps undocumented pairs neutral", () => {
    const cautionRelation: CompanionRelation = {
      cropIds: ["cebula", "brokul"],
      status: "caution",
      relationshipType: "disease_risk",
      confidence: "medium",
      rationale: "Testowy miękki koszt.",
      sourceIds: ["S2"],
      hardBlock: false,
    };
    const cautionResult = generateGardenLayout({
      spaces: [{ id: "small", widthCm: 60, lengthCm: 30 }],
      crops: [
        { crop: compactCrop("cebula"), proportion: 50 },
        { crop: compactCrop("brokul"), proportion: 50 },
      ],
      relations: [cautionRelation],
    });
    const unknownResult = generateGardenLayout({
      spaces: [{ id: "small", widthCm: 60, lengthCm: 30 }],
      crops: [
        { crop: compactCrop("marchew"), proportion: 50 },
        { crop: compactCrop("brokul"), proportion: 50 },
      ],
      relations: [],
    });

    expect(cautionResult.spaces[0]?.positions).toHaveLength(2);
    expect(cautionResult.metrics.cautionNeighbors).toBe(1);
    expect(unknownResult.spaces[0]?.positions).toHaveLength(2);
    expect(unknownResult.metrics.cautionNeighbors).toBe(0);
  });

  it("keeps a confirmed negative relation out of neighboring positions", () => {
    const negativeRelation: CompanionRelation = {
      cropIds: ["marchew", "cebula"],
      status: "negative",
      relationshipType: "disease_risk",
      confidence: "high",
      rationale: "Testowa potwierdzona relacja negatywna.",
      sourceIds: ["S2"],
      hardBlock: true,
    };
    const result = generateGardenLayout({
      spaces: [{ id: "tiny", widthCm: 120, lengthCm: 60 }],
      crops: [
        { crop: compactCrop("marchew", 60, 60), proportion: 60 },
        { crop: compactCrop("cebula", 60, 60), proportion: 40 },
      ],
      relations: [negativeRelation],
    });

    const positions = result.spaces[0]?.positions ?? [];
    expect(positions.some((position) => position.cropId === "marchew")).toBe(true);
    expect(positions.some((position) => position.cropId === "cebula")).toBe(false);
    expect(result.omissions).toContainEqual(expect.objectContaining({ cropId: "cebula", reason: "no_fit" }));
    expect(result.conflicts).toContainEqual(
      expect.objectContaining({ type: "negative_neighbor", cropIds: ["cebula", "marchew"] }),
    );
  });

  it("returns a partial result when a selected crop has no usable spacing", () => {
    const missingSpacingCrop = { ...crop("marchew"), spacing: null };
    const result = generateGardenLayout({
      spaces: [{ id: "bed", widthCm: 100, lengthCm: 100 }],
      crops: [
        { crop: missingSpacingCrop, proportion: 50 },
        { crop: compactCrop("cebula"), proportion: 50 },
      ],
    });

    expect(result.omissions).toContainEqual(expect.objectContaining({ cropId: "marchew", reason: "missing_spacing" }));
    expect(result.cropSummaries.map((summary) => summary.cropId)).toEqual(["cebula", "marchew"]);
    expect(result.cropSummaries.find((summary) => summary.cropId === "marchew")).toMatchObject({
      targetPercentage: 50,
      actualPercentage: 0,
      actualCount: 0,
      dataConfidence: null,
      spacingStage: null,
    });
  });

  it("does not infer axes from an unlabeled published spacing pair", () => {
    const entry = crop("marchew");
    const unverifiedCrop: CropCatalogEntry = {
      ...entry,
      spacing: {
        publishedPairCm: [10, 30],
        inRowCm: null,
        betweenRowsCm: null,
        context: "Źródło nie wskazuje kolejności osi.",
        sourceIds: ["S19"],
        confidence: "low",
        axisVerified: false,
        stage: "sowing",
        isFinalPlanting: false,
      },
    };
    const result = generateGardenLayout({
      spaces: [{ id: "bed", widthCm: 100, lengthCm: 100 }],
      crops: [{ crop: unverifiedCrop, proportion: 100 }],
    });

    expect(result.spaces[0]?.positions).toEqual([]);
    expect(result.omissions).toContainEqual(
      expect.objectContaining({ cropId: "marchew", reason: "unverified_spacing" }),
    );
    expect(result.cropSummaries[0]).toMatchObject({ targetPercentage: 100, actualPercentage: 0, actualCount: 0 });
  });

  it("does not use sowing density as final plant spacing", () => {
    const sowingOnlyCrop = crop("kukurydza-cukrowa");
    expect(sowingOnlyCrop.finalSpacing).toBeNull();
    expect(sowingOnlyCrop.sowingDensity).toMatchObject({
      inRowCm: { min: 20, max: 30 },
      betweenRowsCm: { min: 76, max: 91 },
    });

    const result = generateGardenLayout({
      spaces: [{ id: "bed", widthCm: 100, lengthCm: 100 }],
      crops: [{ crop: sowingOnlyCrop, proportion: 100 }],
      relations: [],
    });

    expect(result.spaces[0]?.positions).toEqual([]);
    expect(result.omissions).toContainEqual(
      expect.objectContaining({ cropId: "kukurydza-cukrowa", reason: "missing_spacing" }),
    );
    expect(result.cropSummaries.find((summary) => summary.cropId === "kukurydza-cukrowa")).toMatchObject({
      targetPercentage: 100,
      actualPercentage: 0,
      actualCount: 0,
      dataConfidence: null,
      spacingStage: null,
    });
  });

  it("reports geometry conflicts for a space that cannot fit a usable crop", () => {
    const result = generateGardenLayout({
      spaces: [{ id: "too-small", widthCm: 10, lengthCm: 10 }],
      crops: [{ crop: compactCrop("marchew", 30, 30), proportion: 100 }],
    });

    expect(result.spaces[0]?.positions).toEqual([]);
    expect(result.conflicts).toContainEqual(expect.objectContaining({ type: "geometry", spaceId: "too-small" }));
    expect(result.omissions).toContainEqual(expect.objectContaining({ cropId: "marchew", reason: "no_fit" }));
  });
});
