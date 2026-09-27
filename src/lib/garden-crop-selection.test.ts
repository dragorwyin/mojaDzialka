import { describe, expect, it } from "vitest";

import { validateGardenCropSelection } from "./garden-crop-selection.js";

describe("garden crop selection validation", () => {
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

  it.each([
    ["a non-array payload", null],
    ["an unknown crop ID", [{ cropId: "unknown-crop", proportion: 1 }]],
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
