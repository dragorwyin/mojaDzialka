import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import GardenLayoutView from "../components/garden/GardenLayoutView.js";
import { CROP_CATALOG } from "../data/crop-catalog.js";
import { generateGardenLayout } from "./garden-layout.js";

describe("garden layout shortfall presentation", () => {
  it("keeps a selected zero-position crop in the summary and explains the bed geometry", () => {
    const crop = CROP_CATALOG.find((entry) => entry.id === "bob");
    if (!crop) throw new Error("Missing broad bean fixture.");
    const plan = generateGardenLayout({
      spaces: [{ id: "too-small", name: "Mała skrzynia", widthCm: 1, lengthCm: 1 }],
      crops: [{ crop, proportion: 100 }],
      relations: [],
    });
    const markup = renderToStaticMarkup(createElement(GardenLayoutView, { plan, status: "current", cropNames: {} }));

    expect(plan.cropSummaries[0]).toMatchObject({ cropId: crop.id, actualCount: 0, dataConfidence: "low" });
    expect(markup).toContain("bób");
    expect(markup).toContain("0</td>");
    expect(markup).toContain("nie znaleziono pasującego stanowiska");
  });

  it("shows each bed's deficit and the garden total without mutating the layout", () => {
    const crop = CROP_CATALOG.find((entry) => entry.id === "marchew");
    if (!crop) throw new Error("Missing carrot fixture.");
    const plan = generateGardenLayout({
      spaces: [
        { id: "first", name: "Skrzynia 1", widthCm: 30, lengthCm: 10 },
        { id: "second", name: "Skrzynia 2", widthCm: 30, lengthCm: 10 },
      ],
      crops: [{ crop, proportion: 100 }],
      relations: [],
    });
    const first = plan.spaces[0];
    const originalPositions = structuredClone(first.positions);
    const originalAllocations = first.cropAllocations;
    if (!originalAllocations) throw new Error("Missing crop allocation fixture.");
    first.cropAllocations = originalAllocations.map((allocation) => ({
      ...allocation,
      allocatedCount: allocation.placedCount + 1,
      missingCount: 1,
    }));
    const markup = renderToStaticMarkup(
      createElement(GardenLayoutView, { plan, status: "current", cropNames: { marchew: "Marchew" } }),
    );

    expect(markup).toContain("Do dosadzenia w tej skrzyni");
    expect(markup).toContain("Braki w całym ogrodzie");
    expect(markup).toContain("1 pozycja do dosadzenia");
    expect(markup).toContain("Marchew");
    expect(first.positions).toEqual(originalPositions);
  });

  it("keeps the deficit presentation hidden when allocations are met or absent in legacy plans", () => {
    const crop = CROP_CATALOG.find((entry) => entry.id === "marchew");
    if (!crop) throw new Error("Missing carrot fixture.");
    const plan = generateGardenLayout({
      spaces: [{ id: "bed", name: "Skrzynia", widthCm: 30, lengthCm: 10 }],
      crops: [{ crop, proportion: 100 }],
      relations: [],
    });
    const currentMarkup = renderToStaticMarkup(
      createElement(GardenLayoutView, { plan, status: "current", cropNames: {} }),
    );
    for (const space of plan.spaces) delete space.cropAllocations;
    const legacyMarkup = renderToStaticMarkup(
      createElement(GardenLayoutView, { plan, status: "current", cropNames: {} }),
    );

    expect(currentMarkup).not.toContain("Braki w całym ogrodzie");
    expect(currentMarkup).not.toContain("Do dosadzenia w tej skrzyni");
    expect(legacyMarkup).not.toContain("Braki w całym ogrodzie");
    expect(legacyMarkup).not.toContain("Do dosadzenia w tej skrzyni");
  });

  it("explains unknown allocations even when there are no known deficits", () => {
    const crop = CROP_CATALOG.find((entry) => entry.id === "marchew");
    if (!crop) throw new Error("Missing carrot fixture.");
    const plan = generateGardenLayout({
      spaces: [
        { id: "legacy", name: "Stara skrzynia", widthCm: 30, lengthCm: 10 },
        { id: "known", name: "Nowa skrzynia", widthCm: 30, lengthCm: 10 },
      ],
      crops: [{ crop, proportion: 100 }],
      relations: [],
    });
    plan.spaces[0].cropAllocations = undefined;
    plan.spaces[1].cropAllocations = [];
    const markup = renderToStaticMarkup(createElement(GardenLayoutView, { plan, status: "current", cropNames: {} }));

    expect(markup).toContain("Pozostałe nie mają pełnych danych do obliczenia braków.");
    expect(markup).not.toContain("Braki w całym ogrodzie");
  });
});
