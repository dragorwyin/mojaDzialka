import { describe, expect, it } from "vitest";

import {
  canGenerateGardenPlan,
  resolveGardenCropSelection,
  validateGardenCropSelection,
} from "./garden-crop-selection.js";

describe("garden crop selection validation", () => {
  it("blocks generation while saved crop IDs are unresolved and enables it after they are replaced", () => {
    const base = { inputsUnavailable: false, hasSpaces: true, hasCrops: true };

    expect(canGenerateGardenPlan({ ...base, hasUnresolvedCrops: true })).toBe(false);
    expect(canGenerateGardenPlan({ ...base, hasUnresolvedCrops: false })).toBe(true);
  });

  it("accepts known crop IDs with positive integer and decimal proportions without normalization", () => {
    expect(
      validateGardenCropSelection([
        { cropId: "pomidor", proportion: 2 },
        { cropId: "marchew", proportion: 0.75 },
      ]),
    ).toEqual([
      { cropId: "pomidor", proportion: 2 },
      { cropId: "marchew", proportion: 0.75 },
    ]);
  });

  it("allows an empty selection so a saved list can be cleared", () => {
    expect(validateGardenCropSelection([])).toEqual([]);
  });

  it("recognizes retired saved IDs and leaves them out of active POST validation", () => {
    expect(resolveGardenCropSelection("pomidor")).toEqual({ status: "active", displayName: "pomidor Faworyt" });
    expect(resolveGardenCropSelection("fasola-zwykla")).toEqual({
      status: "retired",
      displayName: "fasola szparagowa",
    });
    expect(resolveGardenCropSelection("bob")).toEqual({ status: "retired", displayName: "bób" });
    expect(validateGardenCropSelection([{ cropId: "fasola-zwykla", proportion: 1 }])).toBeNull();
    expect(validateGardenCropSelection([{ cropId: "bob", proportion: 1 }])).toBeNull();
  });

  it("keeps unknown saved IDs distinguishable instead of silently dropping them", () => {
    expect(resolveGardenCropSelection("foreign-id")).toEqual({ status: "unknown", displayName: "foreign-id" });
    expect(validateGardenCropSelection([{ cropId: "foreign-id", proportion: 1 }])).toBeNull();
  });

  it.each([
    ["a non-array payload", null],
    ["an unknown crop ID", [{ cropId: "unknown-crop", proportion: 1 }]],
    ["a retired bean ID", [{ cropId: "fasola-zwykla", proportion: 1 }]],
    ["a retired broad bean ID", [{ cropId: "bob", proportion: 1 }]],
    [
      "a duplicate crop ID",
      [
        { cropId: "pomidor", proportion: 1 },
        { cropId: "pomidor", proportion: 2 },
      ],
    ],
    ["a zero proportion", [{ cropId: "pomidor", proportion: 0 }]],
    ["a negative proportion", [{ cropId: "pomidor", proportion: -1 }]],
    ["a non-finite NaN proportion", [{ cropId: "pomidor", proportion: Number.NaN }]],
    ["a positive infinite proportion", [{ cropId: "pomidor", proportion: Number.POSITIVE_INFINITY }]],
    ["a negative infinite proportion", [{ cropId: "pomidor", proportion: Number.NEGATIVE_INFINITY }]],
    ["a numeric string", [{ cropId: "pomidor", proportion: "1" }]],
    ["a malformed row", [null]],
  ])("rejects %s", (_label, input) => {
    expect(validateGardenCropSelection(input)).toBeNull();
  });
});
