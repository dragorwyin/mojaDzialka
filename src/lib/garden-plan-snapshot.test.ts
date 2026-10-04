import { describe, expect, it } from "vitest";

import {
  canonicalGardenInputSnapshot,
  createGardenInputSnapshot,
  fingerprintGardenInputSnapshot,
  GARDEN_CROP_CATALOG_VERSION,
  GARDEN_LAYOUT_ALGORITHM_VERSION,
  getGardenPlanFreshness,
  type GardenSnapshotCrop,
  type GardenSnapshotSpace,
} from "./garden-plan-snapshot.js";

const spaces: GardenSnapshotSpace[] = [
  { id: "space-b", name: "Druga", spaceType: "sector", widthCm: 200, lengthCm: 100, sortOrder: 1 },
  { id: "space-a", name: "Pierwsza", spaceType: "bed", widthCm: 200, lengthCm: 100, sortOrder: 0 },
];

const crops: GardenSnapshotCrop[] = [
  { cropId: "marchew", proportion: "30" },
  { cropId: "czosnek", proportion: "20" },
];

async function fingerprintLegacySnapshot(snapshot: unknown): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(snapshot)));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

describe("garden plan snapshots", () => {
  it("canonicalizes spaces and crops in stable order for both SSR and the generation endpoint", () => {
    const first = createGardenInputSnapshot(spaces, crops);
    const second = createGardenInputSnapshot([...spaces].reverse(), [...crops].reverse());

    expect(first).toEqual(second);
    expect(first.spaces.map((space) => space.id)).toEqual(["space-a", "space-b"]);
    expect(first.crops.map((crop) => crop.cropId)).toEqual(["czosnek", "marchew"]);
    expect(canonicalGardenInputSnapshot(first)).toBe(canonicalGardenInputSnapshot(second));
  });

  it("marks old snapshots and changed catalog or algorithm versions as stale", async () => {
    const current = createGardenInputSnapshot(spaces, crops);
    const currentFingerprint = await fingerprintGardenInputSnapshot(current);
    const oldSnapshot = {
      version: 1,
      spaces: current.spaces,
      crops: current.crops,
    };
    const oldFingerprint = await fingerprintLegacySnapshot(oldSnapshot);
    const oldAlgorithmFingerprint = await fingerprintGardenInputSnapshot({ ...current, algorithmVersion: 2 });
    const previousCatalogFingerprint = await fingerprintGardenInputSnapshot({ ...current, catalogVersion: 3 });

    expect(GARDEN_CROP_CATALOG_VERSION).toBe(4);
    expect(GARDEN_LAYOUT_ALGORITHM_VERSION).toBe(3);
    expect(current.catalogVersion).toBe(4);
    expect(current.crops).toEqual([
      { cropId: "czosnek", proportion: "20" },
      { cropId: "marchew", proportion: "30" },
    ]);
    expect(getGardenPlanFreshness(currentFingerprint, currentFingerprint)).toBe("current");
    expect(getGardenPlanFreshness(oldFingerprint, currentFingerprint)).toBe("stale");
    expect(getGardenPlanFreshness(oldAlgorithmFingerprint, currentFingerprint)).toBe("stale");
    expect(getGardenPlanFreshness(previousCatalogFingerprint, currentFingerprint)).toBe("stale");
  });
});
