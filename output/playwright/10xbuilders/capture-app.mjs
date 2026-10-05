import { chromium, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const baseURL = "http://127.0.0.1:4323";
const outputDirectory = new URL("./", import.meta.url);
await mkdir(outputDirectory, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath:
    "C:/Users/drago/AppData/Local/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-win64/chrome-headless-shell.exe",
});
const api = await browser.newContext({ baseURL, extraHTTPHeaders: { Origin: baseURL } });

try {
  const publicContext = await browser.newContext({
    baseURL,
    viewport: { width: 1440, height: 1100 },
    deviceScaleFactor: 1,
  });
  const loginPage = await publicContext.newPage();
  await loginPage.goto("/auth/signin");
  await expect(loginPage).toHaveURL(/\/auth\/signin$/);
  await loginPage.screenshot({ path: fileURLToPath(new URL("login.png", outputDirectory)), fullPage: true });
  await publicContext.close();

  const email = `builders-${randomUUID()}@example.com`;
  const password = "Builders-Synthetic-Passw0rd!";
  const signedUp = await api.request.post("/api/auth/signup", {
    form: { email, password, confirmPassword: password },
    maxRedirects: 0,
  });
  if (signedUp.status() !== 302 || signedUp.headers().location !== "/dashboard") {
    throw new Error(`Synthetic signup failed: ${signedUp.status()} ${signedUp.headers().location}`);
  }

  const spaceResponse = await api.request.post("/api/garden", {
    form: { spaceId: "", spaceName: "Skrzynia pokazowa", spaceType: "bed", widthCm: "120", lengthCm: "80" },
    maxRedirects: 0,
  });
  if (spaceResponse.status() !== 302) throw new Error(`Saving showcase space failed: ${spaceResponse.status()}`);

  const cropResponse = await api.request.post("/api/garden-crops", {
    data: [
      { cropId: "marchew", proportion: 0.5 },
      { cropId: "pomidor", proportion: 0.5 },
    ],
  });
  if (cropResponse.status() !== 200) throw new Error(`Saving showcase crops failed: ${cropResponse.status()}`);

  const context = await browser.newContext({
    baseURL,
    storageState: await api.storageState(),
    viewport: { width: 1440, height: 1100 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.screenshot({ path: fileURLToPath(new URL("dashboard.png", outputDirectory)), fullPage: true });

  await page.goto("/garden");
  await expect(page.getByRole("heading", { name: "Zdefiniuj swoją działkę" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Wybór warzyw i udziałów procentowych" })).toContainText("pomidor");
  await page.screenshot({ path: fileURLToPath(new URL("garden-form.png", outputDirectory)), fullPage: true });

  await page.getByRole("button", { name: "Wygeneruj plan", exact: true }).click();
  await expect(page.getByRole("region", { name: "Układ działki", exact: true })).toHaveAttribute(
    "data-plan-status",
    "current",
    { timeout: 15_000 },
  );
  await expect(page.getByRole("region", { name: "Szczegóły wygenerowanego układu" })).toBeVisible();
  await page.screenshot({ path: fileURLToPath(new URL("garden-plan.png", outputDirectory)), fullPage: true });
  await context.close();
} finally {
  await api.close();
  await browser.close();
}
