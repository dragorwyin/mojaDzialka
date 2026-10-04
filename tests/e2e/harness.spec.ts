import { test, expect } from "./fixtures/garden";

test("authenticated garden hydrates the space form", async ({ page }) => {
  await page.goto("/garden");
  await expect(page.getByRole("heading", { name: "Zdefiniuj swoją działkę" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Przestrzeń 1", exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "Układ działki", exact: true })).toHaveAttribute(
    "data-plan-status",
    "empty",
  );
  // The SSR button alone proves nothing: wait for the island to finish hydrating,
  // then require its real React handler to add a second fieldset.
  await expect(
    page.locator('astro-island[component-export="default"]').filter({
      has: page.getByRole("button", { name: "+ Dodaj skrzynię lub sektor", exact: true }),
    }),
  ).not.toHaveAttribute("ssr", "");
  await page.getByRole("button", { name: "+ Dodaj skrzynię lub sektor", exact: true }).click();
  await expect(page.getByRole("group", { name: "Przestrzeń 2", exact: true })).toBeVisible();
  await expect(
    page.getByRole("group", { name: "Przestrzeń 2", exact: true }).getByLabel("Nazwa", { exact: true }),
  ).toHaveValue("Skrzynia 2");
});
