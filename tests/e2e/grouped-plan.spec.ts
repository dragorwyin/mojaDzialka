import { test, expect } from "./fixtures/garden";
import type { Locator, Page } from "@playwright/test";
import { generatePlan } from "./support/garden";
import { readGardenLayoutResult, type GardenLayoutResult } from "../../src/lib/garden-layout";

async function readCropMarkers(page: Parameters<typeof generatePlan>[0]) {
  const layout = page.getByRole("region", { name: "Szczegóły wygenerowanego układu" });
  const markers = layout.locator('article svg[role="group"] g[data-garden-marker="true"]');
  return markers.evaluateAll((items) => items.map((marker) => marker.getAttribute("aria-label") ?? ""));
}

async function readDetailedPositions(article: Locator) {
  await article.getByText(/^Sąsiedzi i uzasadnienie pozycji/).click();
  const rows = article.locator("details ol > li > p:first-child");
  const nextPage = article.getByRole("button", { name: /Pokaż kolejne/ });
  let visibleRows = await rows.allTextContents();
  while ((await nextPage.count()) > 0) {
    await nextPage.click();
    visibleRows = await rows.allTextContents();
  }
  return visibleRows;
}

function expectEveryCropGroupConnected(plan: GardenLayoutResult) {
  const groups = new Map<string, { row: number; column: number }[]>();
  for (const [spaceIndex, space] of plan.spaces.entries()) {
    for (const position of space.positions) {
      const key = `${spaceIndex}:${position.cropId}`;
      const positions = groups.get(key) ?? [];
      positions.push({ row: position.row, column: position.column });
      groups.set(key, positions);
    }
  }

  for (const positions of groups.values()) {
    if (positions.length < 2) continue;
    const reached = new Set([positions[0]]);
    const queue = [positions[0]];
    while (queue.length > 0) {
      const current = queue.pop();
      if (current === undefined) continue;
      positions.forEach((position) => {
        if (
          !reached.has(position) &&
          Math.max(Math.abs(position.row - current.row), Math.abs(position.column - current.column)) === 1
        ) {
          reached.add(position);
          queue.push(position);
        }
      });
    }
    expect(reached.size).toBe(positions.length);
  }
}

function expectedPositionRows(space: GardenLayoutResult["spaces"][number]) {
  return space.positions.map(({ cropId, xCm, yCm }) => `${cropId} · ${xCm} × ${yCm} cm`);
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

async function configureLargeGarden(page: Page) {
  const origin = new URL(page.url()).origin;
  const spaces = new URLSearchParams();
  for (const name of ["Duża skrzynia e2e 1", "Duża skrzynia e2e 2"]) {
    spaces.append("spaceId", "");
    spaces.append("spaceName", name);
    spaces.append("spaceType", "bed");
    spaces.append("widthCm", "250");
    spaces.append("lengthCm", "600");
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
    data: [{ cropId: "marchew", proportion: 1 }],
  });
  expect(cropResponse.status()).toBe(200);
  expect(await cropResponse.json()).toEqual({ saved: true });
  await page.reload();
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
  if (
    typeof body !== "object" ||
    body === null ||
    !("plan" in body) ||
    !("inputFingerprint" in body) ||
    !("generatedAt" in body) ||
    typeof body.inputFingerprint !== "string" ||
    typeof body.generatedAt !== "string"
  ) {
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
    placedCount: 57,
    missingCount: 0,
  });
  expect(constrainedBed?.cropAllocations).toEqual([
    { cropId: "marchew", allocatedCount: 2, placedCount: 2, missingCount: 0 },
    { cropId: "rzodkiewka", allocatedCount: 2, placedCount: 2, missingCount: 0 },
  ]);

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
  await expect(
    layout.locator('svg[role="group"] g[role="button"][aria-label*="roślin w skupisku"]').first(),
  ).toBeVisible();
  const beforeReload = await readCropMarkers(page);
  expectEveryCropGroupConnected(plan);

  await page.reload();
  const serverPlan = page.locator("#garden-plan-ssr");
  await expect(serverPlan).toHaveAttribute("data-plan-status", "current");
  await expect(serverPlan).toHaveAttribute("data-plan-fingerprint", body.inputFingerprint);
  expect(Date.parse((await serverPlan.getAttribute("data-plan-generated-at")) ?? "")).toBe(
    Date.parse(body.generatedAt),
  );
  await expect(serverPlan).toHaveAttribute(
    "data-plan-position-count",
    String(plan.spaces.reduce((count, space) => count + space.positions.length, 0)),
  );
  await expect(layout).toBeVisible();
  const afterReload = await readCropMarkers(page);
  expect(afterReload).toEqual(beforeReload);
  for (const space of plan.spaces) {
    const article = layout.locator("article").filter({ has: page.getByRole("heading", { name: space.space.name }) });
    expect(await readDetailedPositions(article)).toEqual(expectedPositionRows(space));
  }

  await expect(layout).toContainText("Skrzynia e2e");
  await expect(layout).toContainText("Skrzynia ograniczona e2e");
  await expect(layout).not.toContainText("Braki w całym ogrodzie");
});

test("large plans retain exact counts after reload and aggregate overview markers", async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  await page.goto("/dashboard");
  await configureLargeGarden(page);
  const responsePromise = page
    .waitForResponse(
      (response) => response.url().endsWith("/api/garden-plan") && response.request().method() === "POST",
    )
    .then(async (response) => ({
      status: response.status(),
      body: (await response.json()) as {
        inputFingerprint: string;
        generatedAt: string;
        plan: unknown;
      },
    }));
  await generatePlan(page, 30_000);
  const { status, body } = await responsePromise;
  expect(status).toBe(200);
  const plan = readGardenLayoutResult(body.plan);
  expect(plan).not.toBeNull();
  if (!plan) throw new Error("Generated large plan did not parse.");
  const layout = page.getByRole("region", { name: "Szczegóły wygenerowanego układu" });
  const aggregateMarker = layout.locator('svg[role="group"] g[role="button"][aria-label*="roślin w skupisku"]').first();
  await expect(aggregateMarker).toBeVisible();
  await page.reload();
  const serverPlan = page.locator("#garden-plan-ssr");
  await expect(serverPlan).toHaveAttribute("data-plan-status", "current");
  await expect(serverPlan).toHaveAttribute("data-plan-fingerprint", body.inputFingerprint);
  expect(Date.parse((await serverPlan.getAttribute("data-plan-generated-at")) ?? "")).toBe(
    Date.parse(body.generatedAt),
  );
  const totalPositions = plan.spaces.reduce((count, space) => count + space.positions.length, 0);
  await expect(serverPlan).toHaveAttribute("data-plan-position-count", String(totalPositions));
  expect(totalPositions).toBeGreaterThanOrEqual(2_000);
  await expect(layout).toBeVisible();
  await expect(layout).toContainText("Duża skrzynia e2e 1");
  await expect(layout).toContainText("Duża skrzynia e2e 2");
  for (const space of plan.spaces) {
    const article = layout.locator("article").filter({ has: page.getByRole("heading", { name: space.space.name }) });
    expect(await readDetailedPositions(article)).toEqual(expectedPositionRows(space));
  }
  const firstBed = layout
    .locator("article")
    .filter({ has: page.getByRole("heading", { name: "Duża skrzynia e2e 1" }) });
  const originalViewport = page.viewportSize();
  await page.setViewportSize({ width: 820, height: 1024 });
  const controls = firstBed.getByRole("navigation", { name: "Sterowanie diagramem Duża skrzynia e2e 1" });
  const zoomLevel = controls.locator('[aria-live="polite"]');
  await expect(zoomLevel).toHaveText("100%");
  const zoomViewport = firstBed.locator('[aria-label="Płótno diagramu Duża skrzynia e2e 1"]');
  const diagram = zoomViewport.getByRole("group", { name: "Diagram Duża skrzynia e2e 1 w skali centymetrowej" });
  const fittedWidth = await diagram.evaluate((svg) => svg.clientWidth);
  await controls.getByRole("button", { name: "Powiększ diagram" }).click();
  await expect(zoomLevel).toHaveText("125%");
  await expect.poll(() => diagram.evaluate((svg) => svg.clientWidth)).toBeGreaterThan(fittedWidth);
  for (let step = 0; step < 9; step += 1) {
    await controls.getByRole("button", { name: "Powiększ diagram" }).click();
  }
  await expect(zoomViewport.locator('g[role="button"][aria-label*="pozycja"]').first()).toBeVisible();
  await controls.getByRole("button", { name: "Dopasuj" }).click();
  await expect(zoomLevel).toHaveText("100%");
  if (originalViewport) await page.setViewportSize(originalViewport);
  await page.screenshot({ path: `test-results/large-garden-${testInfo.project.name}.png`, fullPage: true });
  await layout
    .locator("article")
    .first()
    .screenshot({ path: `test-results/large-garden-bed-${testInfo.project.name}.png` });
});
