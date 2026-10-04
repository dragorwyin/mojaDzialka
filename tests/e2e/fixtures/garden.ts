import { randomUUID } from "node:crypto";
import { test as base, expect, type APIRequestContext, type APIResponse } from "@playwright/test";
import { readE2eEnvironment } from "./environment";

type Session = Awaited<ReturnType<APIRequestContext["storageState"]>>;

function expectRedirect(response: APIResponse, location: string) {
  expect(response.status(), "fixture POST must succeed before browser actions").toBe(302);
  expect(response.headers().location).toBe(location);
}

export const test = base.extend<{ gardenReady: undefined }, { gardenSession: Session }>({
  gardenSession: [
    async ({ playwright }, provideSession, workerInfo) => {
      const { baseURL } = readE2eEnvironment();
      const api = await playwright.request.newContext({ baseURL, extraHTTPHeaders: { Origin: baseURL } });
      try {
        const email = `e2e-${workerInfo.project.name}-${workerInfo.parallelIndex}-${randomUUID()}@example.com`;
        const password = "E2e-Garden-Passw0rd!";
        const signup = await api.post("/api/auth/signup", {
          form: { email, password, confirmPassword: password },
          maxRedirects: 0,
        });
        expectRedirect(signup, "/dashboard");
        const dashboard = await api.get("/dashboard", { maxRedirects: 0 });
        expect(dashboard.status(), "signup must establish an authenticated session").toBe(200);
        await provideSession(await api.storageState());
      } finally {
        await api.dispose();
      }
    },
    { scope: "worker" },
  ],
  storageState: async ({ gardenSession }, provideState) => {
    await provideState(gardenSession);
  },
  gardenReady: [
    async ({ context }, provideReady) => {
      const { baseURL } = readE2eEnvironment();
      // Empty persisted ID replaces the structure, clearing any previous plan via the real RPC.
      // No database reset, admin key or mocked success; every test gets the same independent input.
      const space = await context.request.post("/api/garden", {
        headers: { Origin: baseURL },
        form: { spaceId: "", spaceName: "Skrzynia e2e", spaceType: "bed", widthCm: "120", lengthCm: "80" },
        maxRedirects: 0,
      });
      expectRedirect(space, "/garden?saved=1");
      const crops = await context.request.post("/api/garden-crops", {
        headers: { Origin: baseURL },
        data: [
          { cropId: "marchew", proportion: 0.5 },
          { cropId: "pomidor", proportion: 0.5 },
        ],
      });
      expect(crops.status()).toBe(200);
      expect(await crops.json()).toEqual({ saved: true });
      await provideReady(undefined);
    },
    { auto: true },
  ],
});

export { expect };
