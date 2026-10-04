import { test, expect } from "./fixtures/garden";
import { generatePlan } from "./support/garden";

test("a failed regeneration keeps the old diagram visible and permits a real retry", async ({ page }) => {
  await page.goto("/garden");
  await generatePlan(page);
  const layout = page.getByRole("region", { name: "Szczegóły wygenerowanego układu" });
  const oldDiagramHeader = await layout.locator("article > header").first().innerText();

  await page.route("**/api/garden-plan", (route) => route.fulfill({ status: 500, body: "{}" }));
  const planner = page.getByRole("region", { name: "Układ działki", exact: true });
  await page.getByRole("button", { name: "Wygeneruj ponownie", exact: true }).click();
  await expect(planner).toHaveAttribute("aria-busy", "false");
  await expect(planner).toHaveAttribute("data-plan-status", "stale");
  await expect(planner.getByRole("alert").filter({ hasText: "Nie udało się wygenerować planu" })).toBeVisible();
  expect(await layout.locator("article > header").first().innerText()).toBe(oldDiagramHeader);

  await page.unroute("**/api/garden-plan");
  await page.getByRole("button", { name: "Wygeneruj ponownie", exact: true }).click();
  await expect(planner).toHaveAttribute("data-plan-status", "current");
});

test("a rejected crop save shows an error without claiming success or staling the plan", async ({ page }) => {
  await page.goto("/garden");
  await generatePlan(page);
  const crops = page.getByRole("region", { name: "Wybór warzyw i udziałów procentowych" });
  await crops.getByLabel("Udział (%)").nth(0).fill("60.00");
  await crops.getByLabel("Udział (%)").nth(1).fill("40.00");
  await page.route("**/api/garden-crops", (route) => route.fulfill({ status: 503, body: '{"error":"unavailable"}' }));
  await crops.getByRole("button", { name: "Zapisz wybór upraw", exact: true }).click();

  await expect(crops.getByRole("alert")).toContainText("Zapisywanie wyboru jest chwilowo niedostępne");
  await expect(crops.getByRole("status").filter({ hasText: "Wybór upraw został zapisany." })).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Układ działki", exact: true })).toHaveAttribute(
    "data-plan-status",
    "current",
  );
  await page.unroute("**/api/garden-crops");
  await page.reload();
  await expect(page.locator("#garden-plan-ssr")).toHaveAttribute("data-plan-status", "current");
  const restoredCrops = page.getByRole("region", { name: "Wybór warzyw i udziałów procentowych" });
  await expect(restoredCrops.getByLabel("Udział (%)").nth(0)).toHaveValue("50.00");
  await expect(restoredCrops.getByLabel("Udział (%)").nth(1)).toHaveValue("50.00");
});
