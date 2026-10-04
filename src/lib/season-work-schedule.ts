import type { CropCatalogEntry, SeasonWindow } from "../data/crop-catalog.js";

export type SeasonScheduleCrop = Pick<CropCatalogEntry, "id" | "commonNamePl" | "seasonWindows">;

export interface SeasonWorkItem {
  cropId: string;
  cropNamePl: string;
  window: SeasonWindow;
  upcomingMonths: readonly number[];
}

export interface NextSeasonWork {
  month: number;
  items: SeasonWorkItem[];
}

function nextMonth(month: number): number {
  return month === 12 ? 1 : month + 1;
}

function windowIncludesMonth(window: SeasonWindow, month: number): boolean {
  if (window.startMonth <= window.endMonth) {
    return month >= window.startMonth && month <= window.endMonth;
  }

  return month >= window.startMonth || month <= window.endMonth;
}

function sameWindow(left: SeasonWindow, right: SeasonWindow): boolean {
  return (
    left.startMonth === right.startMonth &&
    left.endMonth === right.endMonth &&
    left.method === right.method &&
    left.condition === right.condition &&
    left.sourceIds.join("\u0000") === right.sourceIds.join("\u0000")
  );
}

function getWorkForMonths(crops: readonly SeasonScheduleCrop[], months: readonly number[]): SeasonWorkItem[] {
  const items: SeasonWorkItem[] = [];

  for (const crop of crops) {
    const seenWindows: SeasonWindow[] = [];
    for (const window of crop.seasonWindows) {
      if (seenWindows.some((seen) => sameWindow(seen, window))) continue;
      seenWindows.push(window);

      const activeMonths = months.filter((month) => windowIncludesMonth(window, month));
      if (activeMonths.length > 0) {
        items.push({ cropId: crop.id, cropNamePl: crop.commonNamePl, window, upcomingMonths: activeMonths });
      }
    }
  }

  return items;
}

/** Returns source-backed crop work whose seasonal window overlaps this month or the next. */
export function getUpcomingSeasonWork(crops: readonly SeasonScheduleCrop[], referenceMonth: number): SeasonWorkItem[] {
  if (!Number.isInteger(referenceMonth) || referenceMonth < 1 || referenceMonth > 12) return [];

  const upcomingMonths = [referenceMonth, nextMonth(referenceMonth)];
  return getWorkForMonths(crops, upcomingMonths);
}

/** Finds work in the first month after the current two-month schedule that has a confirmed window. */
export function getNextSeasonWork(crops: readonly SeasonScheduleCrop[], referenceMonth: number): NextSeasonWork | null {
  if (!Number.isInteger(referenceMonth) || referenceMonth < 1 || referenceMonth > 12) return null;

  let month = referenceMonth;
  for (let offset = 1; offset <= 12; offset += 1) {
    month = nextMonth(month);
    if (offset <= 1) continue;

    const items = getWorkForMonths(crops, [month]);
    if (items.length > 0) return { month, items };
  }

  return null;
}
