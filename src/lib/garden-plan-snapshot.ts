export const GARDEN_INPUT_SNAPSHOT_VERSION = 2 as const;

// Bump these whenever catalog data/semantics or layout behavior changes.
export const GARDEN_CROP_CATALOG_VERSION = 4 as const;
export const GARDEN_LAYOUT_ALGORITHM_VERSION = 2 as const;

export interface GardenSnapshotSpace {
  id: string;
  name: string;
  spaceType: "bed" | "sector";
  widthCm: number;
  lengthCm: number;
  sortOrder: number;
}

export interface GardenSnapshotCrop {
  cropId: string;
  proportion: string;
}

export interface GardenInputSnapshot {
  version: typeof GARDEN_INPUT_SNAPSHOT_VERSION;
  catalogVersion: number;
  algorithmVersion: number;
  spaces: GardenSnapshotSpace[];
  crops: GardenSnapshotCrop[];
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

export function createGardenInputSnapshot(
  spaces: readonly GardenSnapshotSpace[],
  crops: readonly GardenSnapshotCrop[],
): GardenInputSnapshot {
  return {
    version: GARDEN_INPUT_SNAPSHOT_VERSION,
    catalogVersion: GARDEN_CROP_CATALOG_VERSION,
    algorithmVersion: GARDEN_LAYOUT_ALGORITHM_VERSION,
    spaces: [...spaces]
      .sort((left, right) => left.sortOrder - right.sortOrder || compareText(left.id, right.id))
      .map((space) => ({ ...space })),
    crops: [...crops].sort((left, right) => compareText(left.cropId, right.cropId)).map((crop) => ({ ...crop })),
  };
}

export function canonicalGardenInputSnapshot(snapshot: GardenInputSnapshot): string {
  return JSON.stringify(snapshot);
}

export async function fingerprintGardenInputSnapshot(snapshot: GardenInputSnapshot): Promise<string> {
  const bytes = new TextEncoder().encode(canonicalGardenInputSnapshot(snapshot));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function getGardenPlanFreshness(
  storedFingerprint: string,
  currentFingerprint: string | null,
): "current" | "stale" {
  return currentFingerprint !== null && storedFingerprint === currentFingerprint ? "current" : "stale";
}
