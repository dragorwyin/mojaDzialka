import { describe, expect, it } from "vitest";

import { CROP_CATALOG, type CropCatalogEntry } from "../data/crop-catalog.js";
import { generateGardenLayout } from "./garden-layout.js";

function finalSpacingCrop(id: string, inRowCm: number, betweenRowsCm: number): CropCatalogEntry {
  const entry = CROP_CATALOG.find((crop) => crop.id === id);
  if (!entry) throw new Error(`Missing fixture crop: ${id}`);
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

function positionsOf(result: ReturnType<typeof generateGardenLayout>) {
  return result.spaces.flatMap(({ positions }) => positions);
}

describe("garden layout capacity", () => {
  it("generates and deterministically groups more than 10,000 feasible positions across spaces", () => {
    const input = {
      spaces: [
        { id: "bed-a", name: "Skrzynia A", widthCm: 100, lengthCm: 100 },
        { id: "bed-b", name: "Skrzynia B", widthCm: 100, lengthCm: 100 },
      ],
      crops: [{ crop: finalSpacingCrop("marchew", 1, 1), proportion: 100 }],
      relations: [],
    } as const;

    const startedAt = performance.now();
    const result = generateGardenLayout(input);
    const elapsedMs = performance.now() - startedAt;
    const repeated = generateGardenLayout(input);
    const positions = positionsOf(result);

    // eslint-disable-next-line no-console -- Keep a local capacity timing visible in Vitest output.
    console.info(`GARDEN_LAYOUT_CAPACITY fixture: ${positions.length} positions in ${elapsedMs.toFixed(1)} ms.`);
    expect(positions).toHaveLength(20_000);
    expect(positions).toEqual(positionsOf(repeated));
    expect(result.metrics.limitReached).toBe(false);
    expect(result.metrics.candidateChecks).toBeGreaterThan(2_000);
    expect(result.spaces.map(({ positions: spacePositions }) => spacePositions)).toHaveLength(2);
    expect(result.spaces.map(({ positions: spacePositions }) => spacePositions.length)).toEqual([10_000, 10_000]);
    expect(result.spaces.map(({ cropAllocations }) => cropAllocations?.[0])).toEqual([
      { cropId: "marchew", allocatedCount: 10_000, placedCount: 10_000, missingCount: 0 },
      { cropId: "marchew", allocatedCount: 10_000, placedCount: 10_000, missingCount: 0 },
    ]);
    expect(result.warnings).toEqual([]);
  }, 10_000);

  it("rotates Faworyt's 50 × 100 cm spacing to fit a 120 × 80 cm bed", () => {
    const faworyt = CROP_CATALOG.find((crop) => crop.id === "pomidor");
    if (!faworyt) throw new Error("Missing Faworyt catalog entry");

    const result = generateGardenLayout({
      spaces: [{ id: "tomato-bed", widthCm: 120, lengthCm: 80 }],
      crops: [{ crop: faworyt, proportion: 100 }],
      relations: [],
    });
    const position = result.spaces[0]?.positions[0];

    expect(position).toMatchObject({
      xCm: 50,
      yCm: 25,
      spacing: { inRowCm: 50, betweenRowsCm: 100 },
      orientation: "rotated",
    });
    expect(result.cropSummaries[0]?.actualCount).toBeGreaterThan(0);
    expect(result.metrics.limitReached).toBe(false);
  });

  it("does not block a distinct crop type with a low-confidence sourced spacing", () => {
    const crop = CROP_CATALOG.find((entry) => entry.id === "burak-lisciowy");
    if (!crop?.finalSpacing) throw new Error("Missing low-confidence crop fixture");

    const result = generateGardenLayout({
      spaces: [{ id: "bed", name: "Skrzynia", widthCm: 120, lengthCm: 80 }],
      crops: [{ crop, proportion: 100 }],
      relations: [],
    });

    expect(crop.finalSpacing.confidence).toBe("low");
    expect(result.spaces[0]?.positions.length).toBeGreaterThan(0);
    expect(result.cropSummaries[0]?.cropId).toBe(crop.id);
    expect(result.cropSummaries[0]?.actualCount).toBeGreaterThan(0);
  });
});
