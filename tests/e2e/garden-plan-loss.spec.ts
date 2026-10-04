import { test, expect } from "./fixtures/garden";
import { addSpace, generatePlan, removeSecondSpace, respondToPlanLoss, saveSpaces } from "./support/garden";

test("adding a space can be canceled without losing the saved plan", async ({ page }) => {
  await page.goto("/garden");
  await generatePlan(page);
  await page.reload();
  const fingerprint = await page.locator("#garden-plan-ssr").getAttribute("data-plan-fingerprint");
  let gardenPosts = 0;
  page.on("request", (request) => {
    if (request.url().endsWith("/api/garden") && request.method() === "POST") gardenPosts += 1;
  });

  await addSpace(page);
  await respondToPlanLoss(page, "dismiss");
  expect(gardenPosts).toBe(0);
  await expect(page).toHaveURL(/\/garden$/);
  await expect(page.getByRole("group", { name: "Przestrzeń 2", exact: true })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("group", { name: "Przestrzeń 1", exact: true })).toBeVisible();
  await expect(page.getByRole("group", { name: "Przestrzeń 2", exact: true })).toHaveCount(0);
  await expect(page.locator("#garden-plan-ssr")).toHaveAttribute("data-plan-status", "current");
  await expect(page.locator("#garden-plan-ssr")).toHaveAttribute("data-plan-fingerprint", fingerprint ?? "");
});

test("adding a space after a saved plan requires confirmation even without a reload", async ({ page }) => {
  await page.goto("/garden");
  await expect(page.locator("#garden-plan-ssr")).toHaveAttribute("data-plan-status", "empty");
  await addSpace(page);
  await removeSecondSpace(page);
  await generatePlan(page);
  await addSpace(page);
  let gardenPosts = 0;
  page.on("request", (request) => {
    if (request.url().endsWith("/api/garden") && request.method() === "POST") gardenPosts += 1;
  });

  const dialogPromise = page.waitForEvent("dialog", { timeout: 5_000 }).then(async (dialog) => {
    expect(dialog.type()).toBe("confirm");
    expect(dialog.message()).toContain("usunie zapisany układ");
    await dialog.dismiss();
  });
  await page.getByRole("button", { name: "Zapisz działkę", exact: true }).click();
  await dialogPromise;
  expect(gardenPosts).toBe(0);
  await expect(page).toHaveURL(/\/garden$/);
  await expect(page.getByRole("region", { name: "Układ działki", exact: true })).toHaveAttribute(
    "data-plan-status",
    "current",
  );
  await page.reload();
  await expect(page.locator("#garden-plan-ssr")).toHaveAttribute("data-plan-status", "current");
});

test("accepting an added space saves the new structure and clears the previous plan", async ({ page }) => {
  await page.goto("/garden");
  await generatePlan(page);
  await page.reload();
  await addSpace(page);
  const saved = page.waitForResponse(
    (response) => response.url().endsWith("/api/garden") && response.request().method() === "POST",
  );
  await respondToPlanLoss(page, "accept");
  expect((await saved).status()).toBe(302);

  await expect(page).toHaveURL(/\/garden\?saved=1$/);
  await page.reload();
  await expect(page.locator("#garden-plan-ssr")).toHaveAttribute("data-plan-status", "empty");
  await expect(page.getByRole("group", { name: "Przestrzeń 2", exact: true })).toBeVisible();
});

test("removing a space can be canceled while preserving the diagram and structure", async ({ page }) => {
  await page.goto("/garden");
  await saveSpaces(page, ["Skrzynia jedna", "Skrzynia druga"]);
  await generatePlan(page);
  await page.reload();
  const fingerprint = await page.locator("#garden-plan-ssr").getAttribute("data-plan-fingerprint");
  let gardenPosts = 0;
  page.on("request", (request) => {
    if (request.url().endsWith("/api/garden") && request.method() === "POST") gardenPosts += 1;
  });

  await removeSecondSpace(page);
  await respondToPlanLoss(page, "dismiss");
  expect(gardenPosts).toBe(0);
  await page.reload();
  await expect(page.getByRole("group", { name: "Przestrzeń 2", exact: true })).toBeVisible();
  await expect(page.locator("#garden-plan-ssr")).toHaveAttribute("data-plan-status", "current");
  await expect(page.locator("#garden-plan-ssr")).toHaveAttribute("data-plan-fingerprint", fingerprint ?? "");
  await expect(page.getByRole("region", { name: "Szczegóły wygenerowanego układu" })).toContainText("Skrzynia druga");
});

test("accepting a removed space saves the structure and clears the previous plan", async ({ page }) => {
  await page.goto("/garden");
  await saveSpaces(page, ["Skrzynia jedna", "Skrzynia druga"]);
  await generatePlan(page);
  await page.reload();
  await removeSecondSpace(page);
  const saved = page.waitForResponse(
    (response) => response.url().endsWith("/api/garden") && response.request().method() === "POST",
  );
  await respondToPlanLoss(page, "accept");
  expect((await saved).status()).toBe(302);

  await page.reload();
  await expect(page.locator("#garden-plan-ssr")).toHaveAttribute("data-plan-status", "empty");
  await expect(page.getByRole("group", { name: "Przestrzeń 1", exact: true })).toBeVisible();
  await expect(page.getByRole("group", { name: "Przestrzeń 2", exact: true })).toHaveCount(0);
});
