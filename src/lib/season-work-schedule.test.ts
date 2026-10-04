import { describe, expect, it } from "vitest";

import { getNextSeasonWork, getUpcomingSeasonWork, type SeasonScheduleCrop } from "./season-work-schedule.js";

const tomato: SeasonScheduleCrop = {
  id: "pomidor",
  commonNamePl: "pomidor",
  seasonWindows: [
    {
      startMonth: 3,
      endMonth: 4,
      method: "seedling",
      condition: "Wysiew rozsady pod osłoną.",
      sourceIds: ["S7"],
      confidence: "medium",
    },
    {
      startMonth: 5,
      endMonth: 5,
      method: "plant_out",
      condition: "Sadzenie po ustąpieniu ryzyka przymrozków.",
      sourceIds: ["S7"],
      confidence: "medium",
    },
  ],
};

describe("upcoming season work", () => {
  it("includes work for the reference month and the following month", () => {
    expect(getUpcomingSeasonWork([tomato], 4)).toEqual([
      {
        cropId: "pomidor",
        cropNamePl: "pomidor",
        window: tomato.seasonWindows[0],
        upcomingMonths: [4],
      },
      {
        cropId: "pomidor",
        cropNamePl: "pomidor",
        window: tomato.seasonWindows[1],
        upcomingMonths: [5],
      },
    ]);
  });

  it("crosses December to January and handles a window that wraps the year", () => {
    const garlic: SeasonScheduleCrop = {
      id: "czosnek",
      commonNamePl: "czosnek",
      seasonWindows: [
        {
          startMonth: 11,
          endMonth: 2,
          method: "overwintering",
          condition: "Okno obejmuje przełom roku.",
          sourceIds: ["S8"],
          confidence: "high",
        },
      ],
    };

    expect(getUpcomingSeasonWork([garlic], 12)[0]?.upcomingMonths).toEqual([12, 1]);
  });

  it("does not create work for crops without a verified window and deduplicates identical windows", () => {
    const unverified: SeasonScheduleCrop = {
      id: "rukola",
      commonNamePl: "rukola",
      seasonWindows: [],
    };
    const duplicate = { ...tomato.seasonWindows[0] };
    const cropWithDuplicate: SeasonScheduleCrop = {
      ...tomato,
      seasonWindows: [tomato.seasonWindows[0], duplicate],
    };

    expect(getUpcomingSeasonWork([unverified, cropWithDuplicate], 3)).toHaveLength(1);
    expect(getUpcomingSeasonWork([unverified], 3)).toEqual([]);
  });

  it("returns no work for an invalid reference month", () => {
    expect(getUpcomingSeasonWork([tomato], 13)).toEqual([]);
  });

  it("finds the nearest confirmed month after an empty current and following month", () => {
    const next = getNextSeasonWork([tomato], 1);

    expect(next?.month).toBe(3);
    expect(next?.items.map(({ cropNamePl, window }) => [cropNamePl, window.method])).toEqual([["pomidor", "seedling"]]);
  });

  it("finds the nearest later season across the year boundary", () => {
    const springCrop: SeasonScheduleCrop = {
      id: "marchew",
      commonNamePl: "marchew",
      seasonWindows: [
        {
          startMonth: 2,
          endMonth: 3,
          method: "direct_sow",
          condition: "Siew wiosenny.",
          sourceIds: ["S7"],
          confidence: "medium",
        },
      ],
    };

    expect(getNextSeasonWork([springCrop], 11)?.month).toBe(2);
  });

  it("returns no later work when the plan has no confirmed seasonal windows", () => {
    expect(getNextSeasonWork([{ id: "rukola", commonNamePl: "rukola", seasonWindows: [] }], 1)).toBeNull();
  });
});
