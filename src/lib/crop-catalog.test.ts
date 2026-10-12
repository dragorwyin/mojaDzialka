import { describe, expect, it } from "vitest";

import { getCompanionRelation, getCropById, listCrops, searchCrops } from "./crop-catalog.js";

describe("crop catalog repository", () => {
  it("returns all records in neutral alphabetical order", () => {
    const crops = listCrops();

    expect(crops.length).toBeGreaterThan(31);
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
    expect(searchCrops("koktajlowy").map((crop) => crop.id)).toContain("pomidor-koktajlowy-palikowany");
    expect(searchCrops("Malinowy Kapturek")).toEqual([]);
    expect(searchCrops("pomidor")).toHaveLength(2);
    expect(searchCrops("fasolka").map((crop) => crop.id)).toContain("fasola-szparagowa");
    expect(searchCrops("fasola sucha").map((crop) => crop.id)).toContain("fasola-wielokwiatowa-na-suche-nasiona");
    expect(searchCrops("broad bean").map((crop) => crop.id)).toContain("bob");
  });

  it("finds selectable entries from the beginning, middle, and end of the expanded list", () => {
    const crops = listCrops();
    const boundaryEntries = [crops[0], crops[Math.floor(crops.length / 2)], crops[crops.length - 1]];

    for (const crop of boundaryEntries) {
      expect(searchCrops(crop.commonNamePl).map((match) => match.id)).toContain(crop.id);
    }
  });

  it("canonicalizes active relations and does not expose relations to retired crops", () => {
    const supported = getCompanionRelation("cebula", "marchew");
    const newCropPair = getCompanionRelation("cebula", "fasola-szparagowa");

    expect(supported.status).toBe("supported");
    expect(supported.relation).not.toBeNull();
    expect(supported.sourceIds.length).toBeGreaterThan(0);
    expect(supported.rationale.length).toBeGreaterThan(0);
    expect(supported.hardBlock).toBe(supported.relation?.hardBlock);
    expect(newCropPair.status).toBe("unknown");
    expect(newCropPair.relation).toBeNull();
    expect(newCropPair.hardBlock).toBe(false);
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
