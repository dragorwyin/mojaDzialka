const HUNDREDTHS_PER_PERCENT = 100;
const TOTAL_PERCENTAGE_HUNDREDTHS = 100 * HUNDREDTHS_PER_PERCENT;

interface DecimalWeight {
  digits: bigint;
  decimalPlaces: number;
}

function getDecimalWeight(value: number): DecimalWeight {
  const [coefficient, exponentText] = value.toString().toLowerCase().split("e");
  const exponent = Number(exponentText || "0");
  const [integerPart, fractionPart = ""] = coefficient.split(".");

  return {
    digits: BigInt(`${integerPart}${fractionPart}`),
    decimalPlaces: fractionPart.length - exponent,
  };
}

/** Converts positive numeric weights to percentages rounded to 0.01 with largest remainders. */
export function normalizeProportionsToPercentages(proportions: readonly number[]): number[] | null {
  if (proportions.length === 0) return [];
  if (proportions.some((proportion) => !Number.isFinite(proportion) || proportion <= 0)) return null;

  const decimalWeights = proportions.map(getDecimalWeight);
  const commonScale = Math.max(0, ...decimalWeights.map(({ decimalPlaces }) => decimalPlaces));
  const scaledWeights = decimalWeights.map(
    ({ digits, decimalPlaces }) => digits * 10n ** BigInt(commonScale - decimalPlaces),
  );
  const totalWeight = scaledWeights.reduce((total, weight) => total + weight, 0n);

  const allocations = scaledWeights.map((weight, index) => {
    const numerator = weight * BigInt(TOTAL_PERCENTAGE_HUNDREDTHS);
    const wholeHundredths = numerator / totalWeight;

    return {
      index,
      hundredths: Number(wholeHundredths),
      remainder: numerator % totalWeight,
    };
  });

  const allocatedHundredths = allocations.reduce((total, allocation) => total + allocation.hundredths, 0);
  const remainingHundredths = TOTAL_PERCENTAGE_HUNDREDTHS - allocatedHundredths;
  const remainderOrder = [...allocations].sort((left, right) => {
    if (left.remainder === right.remainder) return left.index - right.index;
    return left.remainder > right.remainder ? -1 : 1;
  });

  for (let index = 0; index < remainingHundredths; index += 1) {
    remainderOrder[index].hundredths += 1;
  }

  if (allocations.length > TOTAL_PERCENTAGE_HUNDREDTHS) return null;

  for (const allocation of allocations.filter(({ hundredths }) => hundredths === 0)) {
    const donor = [...allocations]
      .filter(({ hundredths }) => hundredths > 1)
      .sort((left, right) => right.hundredths - left.hundredths || left.index - right.index)[0];

    // With at most 10,000 positive shares summing to 10,000 hundredths,
    // any zero allocation guarantees at least one share above one hundredth.
    donor.hundredths -= 1;
    allocation.hundredths = 1;
  }

  return allocations.map(({ hundredths }) => hundredths / HUNDREDTHS_PER_PERCENT);
}

/** Parses a percentage into hundredths of a percentage point without rounding user input. */
export function parseCropPercentageToHundredths(value: string): number | null {
  const normalizedValue = value.trim();
  const match = /^(?:(\d+)(?:\.(\d{1,2}))?|\.(\d{1,2}))$/.exec(normalizedValue);
  if (!match) return null;

  const wholePart = match[1] || "0";
  const fractionPart = match[2] || match[3] || "";
  const whole = Number(wholePart);
  if (!Number.isSafeInteger(whole)) return null;

  const hundredths = whole * HUNDREDTHS_PER_PERCENT + Number(fractionPart.padEnd(2, "0"));
  return Number.isSafeInteger(hundredths) ? hundredths : null;
}

/** Returns the visible total in hundredths; an empty field contributes zero while editing. */
export function sumCropPercentageHundredths(percentages: readonly string[]): number | null {
  let total = 0;

  for (const percentage of percentages) {
    const value = percentage.trim() === "" ? 0 : parseCropPercentageToHundredths(percentage);
    if (value === null) return null;

    total += value;
    if (!Number.isSafeInteger(total)) return null;
  }

  return total;
}

/** Empty selections are valid for clearing; otherwise every share must be positive and total 100.00%. */
export function isValidCropPercentageMix(percentages: readonly string[]): boolean {
  if (percentages.length === 0) return true;

  const values = percentages.map(parseCropPercentageToHundredths);
  if (values.some((value) => value === null || value <= 0)) return false;

  return values.reduce<number>((total, value) => total + (value ?? 0), 0) === TOTAL_PERCENTAGE_HUNDREDTHS;
}
