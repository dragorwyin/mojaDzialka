import { expect, type Locator, type Page } from "@playwright/test";

export async function waitForIslandHydration(page: Page, control: Locator) {
  const island = page.locator('astro-island[component-export="default"]').filter({ has: control });

  // A visible SSR button can be clicked before React attaches the form handlers.
  await expect(island).not.toHaveAttribute("ssr", "");
}

export async function generatePlan(page: Page, timeoutMs = 5_000) {
  if (new URL(page.url()).searchParams.get("tab") !== null) await page.goto("/dashboard");
  const button = page.getByRole("button", { name: /^(Wygeneruj plan|Wygeneruj ponownie)$/ });
  const plannerIsland = page.locator('astro-island[component-export="default"]').filter({ has: button });

  // Server-rendered controls are actionable before React attaches their handlers.
  // Wait for this island to hydrate, as visibility/actionability alone is insufficient.
  await expect(plannerIsland).not.toHaveAttribute("ssr", "");
  await button.click();
  await expect(page.getByRole("region", { name: "Układ działki", exact: true })).toHaveAttribute(
    "data-plan-status",
    "current",
    { timeout: timeoutMs },
  );
  await expect(page.getByRole("region", { name: "Szczegóły wygenerowanego układu" })).toBeVisible();
}

export async function saveSpaces(page: Page, names: readonly string[]) {
  const form = new URLSearchParams();
  for (const name of names) {
    form.append("spaceId", "");
    form.append("spaceName", name);
    form.append("spaceType", "bed");
    form.append("widthCm", "120");
    form.append("lengthCm", "80");
  }

  const response = await page.request.post("/api/garden", {
    data: form.toString(),
    headers: { "Content-Type": "application/x-www-form-urlencoded", Origin: new URL(page.url()).origin },
    maxRedirects: 0,
  });
  expect(response.status()).toBe(302);
  expect(response.headers().location).toBe("/dashboard?tab=sectors&saved=1");
  await page.goto("/dashboard?tab=sectors");
  await expect(page.getByRole("group", { name: `Przestrzeń ${names.length}`, exact: true })).toBeVisible();
}

export async function addSpace(page: Page) {
  if (new URL(page.url()).searchParams.get("tab") !== "sectors") await page.goto("/dashboard?tab=sectors");
  const addButton = page.getByRole("button", { name: "+ Dodaj skrzynię lub sektor", exact: true });
  await waitForIslandHydration(page, addButton);
  await addButton.click();
  await expect(page.getByRole("group", { name: "Przestrzeń 2", exact: true })).toBeVisible();
}

export async function removeSecondSpace(page: Page) {
  if (new URL(page.url()).searchParams.get("tab") !== "sectors") await page.goto("/dashboard?tab=sectors");
  const removeButton = page
    .getByRole("group", { name: "Przestrzeń 2", exact: true })
    .getByRole("button", { name: "Usuń tę przestrzeń", exact: true });
  await waitForIslandHydration(page, removeButton);
  await removeButton.click();
  await expect(page.getByRole("group", { name: "Przestrzeń 2", exact: true })).toHaveCount(0);
}

export async function respondToPlanLoss(page: Page, response: "accept" | "dismiss") {
  const dialogPromise = page.waitForEvent("dialog", { timeout: 5_000 }).then(async (dialog) => {
    expect(dialog.type()).toBe("confirm");
    expect(dialog.message()).toContain("usunie zapisany układ");
    if (response === "accept") await dialog.accept();
    else await dialog.dismiss();
  });
  await page.getByRole("button", { name: "Zapisz działkę", exact: true }).click();
  await dialogPromise;
}
