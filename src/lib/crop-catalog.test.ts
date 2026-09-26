import { describe, expect, it } from "vitest";

import { getCompanionRelation, getCropById, listCrops, searchCrops } from "./crop-catalog.js";

describe("crop catalog repository", () => {
  it("returns all records in neutral alphabetical order", () => {
    const crops = listCrops();

    expect(crops).toHaveLength(30);
    expect(
      crops.every(
        (crop, index) => index === 0 || crops[index - 1].commonNamePl.localeCompare(crop.commonNamePl, "pl-PL") <= 0,
      ),
    ).toBe(true);
  });

  it("finds records by ID, Polish names, aliases, and unaccented queries", () => {
    expect(getCropById("czosnek")?.commonNamePl).toBe("czosnek");
    expect(searchCrops("JARMUZ").map((crop) => crop.id)).toContain("jarmuz");
    expect(searchCrops("ogorek").map((crop) => crop.id)).toContain("ogorek");
    expect(searchCrops("rocket").map((crop) => crop.id)).toContain("rukola");
  });

  it("canonicalizes known relations in both directions", () => {
    const supported = getCompanionRelation("cebula", "marchew");
    const caution = getCompanionRelation("cebula", "fasola-zwykla");

    expect(supported.status).toBe("supported");
    expect(supported.relation).not.toBeNull();
    expect(supported.sourceIds.length).toBeGreaterThan(0);
    expect(supported.rationale.length).toBeGreaterThan(0);
    expect(caution.status).toBe("caution");
    expect(caution.hardBlock).toBe(false);
  });

  it("returns descriptive unknown for an undocumented pair", () => {
    const result = getCompanionRelation("marchew", "ziemniak");

    expect(result.status).toBe("unknown");
    expect(result.relation).toBeNull();
    expect(result.sourceIds).toEqual([]);
    expect(result.rationale).toContain("brak wpisu nie jest zakazem");
    expect(result.hardBlock).toBe(false);
  });
});
