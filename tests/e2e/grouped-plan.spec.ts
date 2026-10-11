import { test, expect } from "./fixtures/garden";
import { generatePlan } from "./support/garden";
import { readGardenLayoutResult } from "../../src/lib/garden-layout";

async function readCropMarkers(page: Parameters<typeof generatePlan>[0]) {
  const labels = await page
    .getByRole("region", { name: "Szczegóły wygenerowanego układu" })
    .locator('svg[role="group"] g[role="img"]')
    .evaluateAll((markers) => markers.map((marker) => marker.getAttribute("aria-label") ?? ""));
  const groups = new Map<string, { row: number; column: number }[]>();

  for (const label of labels) {
    const match = /^(\d+) · .*pozycja (\d+), (\d+),/.exec(label);
    if (!match) throw new Error("Unexpected crop marker label: " + label);
    const cropCode = match[1];
    const row = Number(match[2]) - 1;
    const column = Number(match[3]) - 1;
    if (!cropCode) throw new Error("Missing crop code in marker label: " + label);
    const cropGroup = groups.get(cropCode) ?? [];
    cropGroup.push({ row, column });
    groups.set(cropCode, cropGroup);
  }

  return { labels, groups };
}

function expectEveryCropGroupConnected(groups: Map<string, { row: number; column: number }[]>) {
  for (const positions of groups.values()) {
    if (positions.length < 2) continue;
    const reached = new Set([0]);
    const queue = [0];
    while (queue.length > 0) {
      const index = queue.pop();
      const current = index === undefined ? undefined : positions[index];
      if (current === undefined) continue;
      positions.forEach((position, candidateIndex) => {
        if (
          !reached.has(candidateIndex) &&
          Math.max(Math.abs(position.row - current.row), Math.abs(position.column - current.column)) === 1
        ) {
          reached.add(candidateIndex);
          queue.push(candidateIndex);
        }
      });
    }
    expect(reached.size).toBe(positions.length);
  }
}

test("saved grouped positions and per-bed allocation data survive dashboard reload", async ({ page }) => {
  await page.goto("/dashboard");
  const responsePromise = page.waitForResponse(
    (response) => response.url().endsWith("/api/garden-plan") && response.request().method() === "POST",
  );
  await generatePlan(page);
  const response = await responsePromise;
  expect(response.status()).toBe(200);
  const body: unknown = await response.json();
  if (typeof body !== "object" || body === null || !("plan" in body)) {
    throw new Error("Generated plan response did not include a plan.");
  }
  const plan = readGardenLayoutResult(body.plan);
  expect(plan).not.toBeNull();
  if (plan === null) throw new Error("Generated plan response did not parse.");

  for (const space of plan.spaces) {
    if (space.status === "not_processed") continue;
    expect(space.cropAllocations).toBeDefined();
    for (const allocation of space.cropAllocations ?? []) {
      expect(allocation.placedCount).toBe(
        space.positions.filter((position) => position.cropId === allocation.cropId).length,
      );
      expect(allocation.missingCount).toBe(Math.max(allocation.allocatedCount - allocation.placedCount, 0));
    }
  }

  const layout = page.getByRole("region", { name: "Szczegóły wygenerowanego układu" });
  const beforeReload = await readCropMarkers(page);
  expectEveryCropGroupConnected(beforeReload.groups);

  await page.reload();
  await expect(page.locator("#garden-plan-ssr")).toHaveAttribute("data-plan-status", "current");
  await expect(layout).toBeVisible();
  const afterReload = await readCropMarkers(page);
  expect(afterReload.labels).toEqual(beforeReload.labels);

  const hasShortfall = plan.spaces.some((space) => space.cropAllocations?.some(({ missingCount }) => missingCount > 0));
  if (hasShortfall) {
    await expect(layout).toContainText("Braki w całym ogrodzie");
    for (const space of plan.spaces) {
      if (space.cropAllocations?.some(({ missingCount }) => missingCount > 0)) {
        await expect(layout).toContainText("Do dosadzenia w tej skrzyni");
        await expect(layout).toContainText(space.space.name ?? space.space.id);
      }
    }
  } else {
    await expect(layout).not.toContainText("Braki w całym ogrodzie");
  }
});
