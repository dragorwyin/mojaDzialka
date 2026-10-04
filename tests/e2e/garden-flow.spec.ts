import { test, expect } from "./fixtures/garden";
import { generatePlan } from "./support/garden";

test("dimension edits retain the old diagram as stale until regeneration", async ({ page }) => {
  await page.goto("/garden");
  await generatePlan(page);
  const layout = page.getByRole("region", { name: "Szczegóły wygenerowanego układu" });
  const oldDiagram = await layout.innerText();
  expect(oldDiagram).toContain("120 × 80 cm");

  const space = page.getByRole("group", { name: "Przestrzeń 1", exact: true });
  await space.getByLabel("Szerokość (cm)", { exact: true }).fill("121");
  const savedUrl = page.waitForURL("**/garden?saved=1");
  await page.getByRole("button", { name: "Zapisz działkę", exact: true }).click();
  await savedUrl;

  await expect(page.locator("#garden-plan-ssr")).toHaveAttribute("data-plan-status", "stale");
  await expect(layout).toHaveAttribute("data-layout-status", "stale");
  await expect(layout).toContainText("120 × 80 cm");
  await expect(layout).toContainText("Plan nieaktualny");

  await generatePlan(page);
  await page.reload();
  await expect(page.locator("#garden-plan-ssr")).toHaveAttribute("data-plan-status", "current");
});

test("saving a changed crop mix marks the existing plan stale without a reload", async ({ page }) => {
  await page.goto("/garden");
  await generatePlan(page);

  const crops = page.getByRole("region", { name: "Wybór warzyw i udziałów procentowych" });
  await crops.getByLabel("Udział (%)").nth(0).fill("60.00");
  await crops.getByLabel("Udział (%)").nth(1).fill("40.00");
  await crops.getByRole("button", { name: "Zapisz wybór upraw", exact: true }).click();

  await expect(crops.getByRole("status").filter({ hasText: "Wybór upraw został zapisany." })).toBeVisible();
  await expect(page.getByRole("region", { name: "Układ działki", exact: true })).toHaveAttribute(
    "data-plan-status",
    "stale",
  );
  await expect(page.getByRole("region", { name: "Szczegóły wygenerowanego układu" })).toHaveAttribute(
    "data-layout-status",
    "stale",
  );
});
