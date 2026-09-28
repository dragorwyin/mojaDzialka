import { describe, expect, it } from "vitest";

import {
  isValidCropPercentageMix,
  normalizeProportionsToPercentages,
  parseCropPercentageToHundredths,
  sumCropPercentageHundredths,
} from "./garden-crop-percentages.js";

describe("crop percentage normalization", () => {
  it("normalizes a 3:1 mix to 75.00% and 25.00%", () => {
    expect(normalizeProportionsToPercentages([3, 1])).toEqual([75, 25]);
  });

  it("normalizes decimal weights and allocates rounded hundredths", () => {
    expect(normalizeProportionsToPercentages([2, 0.75])).toEqual([72.73, 27.27]);
  });

  it("keeps every positive weight at least 0.01% when the mix is highly skewed", () => {
    const percentages = normalizeProportionsToPercentages([0.00001, 1]);

    expect(percentages).toEqual([0.01, 99.99]);
    expect(isValidCropPercentageMix(percentages?.map((percentage) => percentage.toFixed(2)) ?? [])).toBe(true);
  });

  it("uses input order to break equal largest-remainder ties", () => {
    expect(normalizeProportionsToPercentages([1, 1, 1])).toEqual([33.34, 33.33, 33.33]);
  });

  it("always allocates exactly 100.00% after rounding", () => {
    const percentages = normalizeProportionsToPercentages([1, 1, 1, 1, 1, 1, 1]);

    expect(percentages).not.toBeNull();
    expect(percentages?.reduce((total, percentage) => total + Math.round(percentage * 100), 0)).toBe(10_000);
  });

  it("allows normalizing an empty list", () => {
    expect(normalizeProportionsToPercentages([])).toEqual([]);
  });

  it.each([
    { label: "zero", weights: [0] },
    { label: "negative", weights: [-1] },
    { label: "NaN", weights: [Number.NaN] },
    { label: "positive infinity", weights: [Number.POSITIVE_INFINITY] },
    { label: "negative infinity", weights: [Number.NEGATIVE_INFINITY] },
  ])("rejects $label weights", ({ weights }) => {
    expect(normalizeProportionsToPercentages(weights)).toBeNull();
  });
});

describe("crop percentage mix validation", () => {
  it("accepts positive shares summing to exactly 100.00%", () => {
    expect(isValidCropPercentageMix(["72.73", "27.27"])).toBe(true);
  });

  it("allows an empty selection so the saved selection can be cleared", () => {
    expect(isValidCropPercentageMix([])).toBe(true);
  });

  it("does not rebalance other shares when a user-entered mix is incomplete", () => {
    const percentages = ["70.00", "20.00"];

    expect(isValidCropPercentageMix(percentages)).toBe(false);
    expect(percentages).toEqual(["70.00", "20.00"]);
  });

  it.each([
    ["a total below 100%", ["72.72", "27.27"]],
    ["a zero share", ["100", "0"]],
    ["a negative share", ["101", "-1"]],
    ["an empty share", ["100", ""]],
    ["more than two decimal places", ["99.999", "0.001"]],
    ["a malformed share", ["not-a-number", "100"]],
  ])("rejects %s", (_description, percentages) => {
    expect(isValidCropPercentageMix(percentages)).toBe(false);
  });

  it("sums partial input live while treating an empty field as zero", () => {
    expect(sumCropPercentageHundredths(["72.73", ""])).toBe(7_273);
    expect(sumCropPercentageHundredths(["72.73", "27.27"])).toBe(10_000);
  });

  it("parses values as exact hundredths and rejects excessive precision", () => {
    expect(parseCropPercentageToHundredths(" 27.2 ")).toBe(2_720);
    expect(parseCropPercentageToHundredths("27.201")).toBeNull();
  });
});
