import { test, expect } from "./fixtures/garden";
import type { Page } from "@playwright/test";
import { generatePlan } from "./support/garden";
import { readGardenLayoutResult } from "../../src/lib/garden-layout";

async function readCropMarkers(page: Parameters<typeof generatePlan>[0]) {
  const diagrams = page.getByRole("region", { name: "Szczegóły wygenerowanego układu" }).locator('svg[role="group"]');
  const labels: string[] = [];
  const groups = new Map<string, { row: number; column: number }[]>();

  for (let diagramIndex = 0; diagramIndex < (await diagrams.count()); diagramIndex += 1) {
    const diagramLabels = await diagrams
      .nth(diagramIndex)
      .locator('g[role="img"]')
      .evaluateAll((markers) => markers.map((marker) => marker.getAttribute("aria-label") ?? ""));
    labels.push(...diagramLabels);
    for (const label of diagramLabels) {
      const match = /^(\d+) · .*pozycja (\d+), (\d+),/.exec(label);
      if (!match) throw new Error("Unexpected crop marker label: " + label);
      const cropCode = match[1];
      const row = Number(match[2]) - 1;
      const column = Number(match[3]) - 1;
      if (!cropCode) throw new Error("Missing crop code in marker label: " + label);
      const groupKey = `${diagramIndex}:${cropCode}`;
      const cropGroup = groups.get(groupKey) ?? [];
      cropGroup.push({ row, column });
      groups.set(groupKey, cropGroup);
    }
  }

  return { labels, groups };
}

async function configureConstrainedGarden(page: Page) {
  const origin = new URL(page.url()).origin;
  const spaces = new URLSearchParams();
  for (const space of [
    { name: "Skrzynia e2e", widthCm: "120", lengthCm: "80" },
    { name: "Skrzynia ograniczona e2e", widthCm: "20", lengthCm: "20" },
  ]) {
    spaces.append("spaceId", "");
    spaces.append("spaceName", space.name);
    spaces.append("spaceType", "bed");
    spaces.append("widthCm", space.widthCm);
    spaces.append("lengthCm", space.lengthCm);
  }
  const spaceResponse = await page.request.post(`${origin}/api/garden`, {
    data: spaces.toString(),
    headers: { Origin: origin, "Content-Type": "application/x-www-form-urlencoded" },
    maxRedirects: 0,
  });
  expect(spaceResponse.status()).toBe(302);
  expect(spaceResponse.headers().location).toBe("/dashboard?tab=sectors&saved=1");

  const cropResponse = await page.request.post(`${origin}/api/garden-crops`, {
    headers: { Origin: origin },
    data: [
      { cropId: "marchew", proportion: 0.5 },
      { cropId: "rzodkiewka", proportion: 0.5 },
    ],
  });
  expect(cropResponse.status()).toBe(200);
  expect(await cropResponse.json()).toEqual({ saved: true });
  await page.reload();
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
  await configureConstrainedGarden(page);
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

  const largeBed = plan.spaces.find((space) => space.space.name === "Skrzynia e2e");
  const constrainedBed = plan.spaces.find((space) => space.space.name === "Skrzynia ograniczona e2e");
  expect(largeBed?.cropAllocations).toContainEqual({
    cropId: "rzodkiewka",
    allocatedCount: 57,
    placedCount: 40,
    missingCount: 17,
  });
  expect(constrainedBed?.cropAllocations).toContainEqual({
    cropId: "marchew",
    allocatedCount: 2,
    placedCount: 1,
    missingCount: 1,
  });

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

  await expect(layout).toContainText("Braki w całym ogrodzie");
  await expect(layout).toContainText("Do dosadzenia w tej skrzyni");
  await expect(layout).toContainText("Skrzynia e2e");
  await expect(layout).toContainText("Skrzynia ograniczona e2e");
  await expect(layout).toContainText("17 pozycji do dosadzenia");
  await expect(layout).toContainText("1 pozycja do dosadzenia");
});
