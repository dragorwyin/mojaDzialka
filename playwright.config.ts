import { defineConfig } from "@playwright/test";
import process from "node:process";
import { readE2eEnvironment } from "./tests/e2e/fixtures/environment";

// Prerequisites: local Supabase, matching .env/.dev.vars, npm run build,
// and npx playwright install chromium (CI: install --with-deps chromium).
// CI owns preview4321: E2E_EXTERNAL_PREVIEW=1 E2E_BASE_URL=http://127.0.0.1:4321.
const environment = readE2eEnvironment();

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/*.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: Boolean(process.env.CI),
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: environment.baseURL,
    browserName: "chromium",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium-desktop", use: { viewport: { width: 1280, height: 900 } } },
    { name: "chromium-mobile-viewport", use: { viewport: { width: 390, height: 844 } } },
  ],
  webServer: environment.externalPreview
    ? undefined
    : {
        command: "node scripts/e2e-preview.mjs",
        url: environment.baseURL,
        reuseExistingServer: false,
        timeout: 60_000,
        env: { E2E_BASE_URL: environment.baseURL },
      },
});
