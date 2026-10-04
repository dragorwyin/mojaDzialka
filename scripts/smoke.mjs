/* global AbortController */
import { Buffer } from "node:buffer";
import { clearTimeout, setTimeout } from "node:timers";

// Smoke test: proves the built app, the Cloudflare adapter and the Supabase auth flow still work together.
// Zero dependencies on purpose. Run against a live server: BASE_URL=http://localhost:4321 node scripts/smoke.mjs

const BASE_URL = process.env.BASE_URL ?? "http://localhost:4321";
const email = `smoke-${Date.now()}@example.com`;
const secondEmail = `smoke-secondary-${Date.now()}@example.com`;
const password = "Smoke-Test-Passw0rd!";
const jar = new Map();
const secondJar = new Map();
let savedSpaceId = null;
let savedSectorId = null;
// POSTs opt into retries only when repeating them preserves the same resource state.
const MAX_RETRIES = 2;
const RETRY_DELAYS_MS = [500, 1_000];
const REQUEST_TIMEOUT_MS = 20_000;
const RETRYABLE_SERVER_STATUSES = new Set([500, 502, 503, 504]);

function cookieHeader(cookieJar = jar) {
  return [...cookieJar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

function storeCookies(response, cookieJar = jar) {
  for (const raw of response.headers.getSetCookie()) {
    const [pair, ...attrs] = raw.split(";");
    const [name, ...rest] = pair.split("=");
    const expired = attrs.some((a) => /max-age=0/i.test(a.trim()));
    if (expired) cookieJar.delete(name.trim());
    else cookieJar.set(name.trim(), rest.join("="));
  }
}

function createExpiredSessionJar(sourceJar = jar) {
  const expiredJar = new Map(sourceJar);
  const authCookieNames = [...expiredJar.keys()].filter((name) => /^sb-.+-auth-token(?:\.\d+)?$/.test(name));
  const storageKey = authCookieNames.find((name) => !/\.\d+$/.test(name)) ?? authCookieNames[0]?.replace(/\.\d+$/, "");
  if (!storageKey) throw new Error("Supabase auth cookie missing from smoke session");

  const encodedSession = authCookieNames
    .sort((a, b) => {
      const aIndex = Number(a.match(/\.(\d+)$/)?.[1] ?? -1);
      const bIndex = Number(b.match(/\.(\d+)$/)?.[1] ?? -1);
      return aIndex - bIndex;
    })
    .map((name) => expiredJar.get(name))
    .join("");
  const hasBase64Prefix = encodedSession.startsWith("base64-");
  const sessionJson = Buffer.from(hasBase64Prefix ? encodedSession.slice(7) : encodedSession, "base64url").toString(
    "utf8",
  );
  const session = JSON.parse(sessionJson);
  session.expires_at = Math.floor(Date.now() / 1000) - 3_600;
  session.expires_in = 0;

  const encoded = `${hasBase64Prefix ? "base64-" : ""}${Buffer.from(JSON.stringify(session)).toString("base64url")}`;
  const chunks = encoded.match(/.{1,3180}/g) ?? [];
  authCookieNames.forEach((name) => expiredJar.delete(name));
  chunks.forEach((chunk, index) => expiredJar.set(chunks.length === 1 ? storageKey : `${storageKey}.${index}`, chunk));
  return expiredJar;
}

async function request(
  path,
  { method = "GET", form, json, cookieJar = jar, idempotent = method === "GET" || method === "HEAD" } = {},
) {
  let retries = 0;

  for (let attempt = 0; attempt <= (idempotent ? MAX_RETRIES : 0); attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(BASE_URL + path, {
        method,
        redirect: "manual",
        headers: {
          Cookie: cookieHeader(cookieJar),
          Origin: BASE_URL,
          ...(form ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
          ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
        },
        body: form ? new URLSearchParams(form).toString() : json !== undefined ? JSON.stringify(json) : undefined,
        signal: controller.signal,
      });
      storeCookies(response, cookieJar);
      const result = {
        status: response.status,
        location: response.headers.get("location") ?? "",
        body: await response.text(),
        retries,
      };

      if (!idempotent || !RETRYABLE_SERVER_STATUSES.has(result.status) || attempt === MAX_RETRIES) return result;

      retries++;
      const delay = RETRY_DELAYS_MS[attempt];
      console.warn(`RETRY  ${method} ${path} after HTTP ${result.status} (${retries}/${MAX_RETRIES}, ${delay}ms)`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    } catch (error) {
      if (!idempotent || attempt === MAX_RETRIES) {
        return {
          status: 0,
          location: "",
          body: `Transport error: ${error instanceof Error ? error.message : String(error)}`,
          retries,
        };
      }

      retries++;
      const delay = RETRY_DELAYS_MS[attempt];
      console.warn(`RETRY  ${method} ${path} after a transport error (${retries}/${MAX_RETRIES}, ${delay}ms)`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error(`Request retry loop ended unexpectedly for ${method} ${path}`);
}

const steps = [
  ["home renders", () => request("/"), { status: 200 }],
  [
    "dashboard preserves requested path for anonymous user",
    () => request("/dashboard"),
    { status: 302, location: "/auth/signin?returnTo=%2Fdashboard" },
  ],
  [
    "garden plan is not rendered for an anonymous user",
    () => request("/garden"),
    { status: 302, location: "/auth/signin?returnTo=%2Fgarden" },
  ],
  [
    "garden plan rejects an anonymous request",
    () => request("/api/garden-plan", { method: "POST", json: {} }),
    { status: 401, includes: '"error":"unauthorized"' },
  ],
  [
    "signup rejects passwords shorter than eight characters",
    () =>
      request("/api/auth/signup", {
        method: "POST",
        form: { email, password: "short", confirmPassword: "short" },
        idempotent: true,
      }),
    { status: 302, location: "/auth/signup?error=password_too_short" },
  ],
  [
    "signup succeeds without email confirmation and creates account",
    () => request("/api/auth/signup", { method: "POST", form: { email, password, confirmPassword: password } }),
    { status: 302, location: "/dashboard" },
  ],
  ["signup establishes dashboard session", () => request("/dashboard"), { status: 200 }],
  [
    "public signin page skips refresh for an expired session cookie",
    () => request("/auth/signin", { cookieJar: createExpiredSessionJar() }),
    { status: 200, includes: "Sign in" },
  ],
  [
    "wrong password clears every expired session cookie chunk",
    async () => {
      const staleJar = createExpiredSessionJar();
      const result = await request("/api/auth/signin", {
        method: "POST",
        form: { email, password: "wrong", returnTo: "/dashboard" },
        cookieJar: staleJar,
      });
      if ([...staleJar.keys()].some((name) => /^sb-.+-auth-token(?:\.\d+)?$/.test(name))) {
        throw new Error("expired Supabase auth cookie was not fully cleared after failed signin");
      }
      return result;
    },
    {
      status: 302,
      location: "/auth/signin?error=signin_failed&returnTo=%2Fdashboard",
      locationExcludes: ["Invalid login credentials"],
    },
  ],
  [
    "signout clears session",
    () => request("/api/auth/signout", { method: "POST", idempotent: true }),
    { status: 302, location: "/" },
  ],
  [
    "dashboard redirects after signout and preserves target",
    () => request("/dashboard"),
    { status: 302, location: "/auth/signin?returnTo=%2Fdashboard" },
  ],
  [
    "signin rejects wrong password",
    () => request("/api/auth/signin", { method: "POST", form: { email, password: "wrong", returnTo: "/dashboard" } }),
    {
      status: 302,
      location: "/auth/signin?error=signin_failed&returnTo=%2Fdashboard",
      locationExcludes: ["Invalid login credentials"],
    },
  ],
  [
    "wrong-password error displays a generic signin message",
    () => request("/auth/signin?error=signin_failed&returnTo=%2Fdashboard"),
    {
      status: 200,
      includes: "Email or password is incorrect.",
      excludes: ["signin_failed", "Invalid login credentials"],
    },
  ],
  [
    "signin accepts correct password and returns to requested dashboard",
    () => request("/api/auth/signin", { method: "POST", form: { email, password, returnTo: "/dashboard" } }),
    { status: 302, location: "/dashboard" },
  ],
  ["dashboard renders for signed-in user", () => request("/dashboard"), { status: 200 }],
  [
    "garden plan reports the missing garden explicitly",
    () => request("/api/garden-plan", { method: "POST", json: { ownerId: "foreign-owner", spaces: [] } }),
    { status: 422, includes: '"error":"missing_garden"' },
  ],
  [
    "garden renders crop selection for signed-in user",
    () => request("/garden"),
    { status: 200, includes: "Wybór warzyw i udziałów procentowych" },
  ],
  [
    "crop selection can be saved with decimal proportions",
    () =>
      request("/api/garden-crops", {
        method: "POST",
        json: [
          { cropId: "pomidor", proportion: 2 },
          { cropId: "marchew", proportion: 0.75 },
        ],
        idempotent: true,
      }),
    { status: 200, includes: '"saved":true' },
  ],
  [
    "selected crops render final spacing, sowing density and seasonal details separately",
    () => request("/garden"),
    {
      status: 200,
      includes: [
        "Końcowa obsada",
        "Gęstość siewu — osobna od końcowej obsady",
        "Orientacyjne terminy",
        "Źródła rozstawy",
      ],
    },
  ],
  [
    "garden plan reports missing spaces instead of saving an empty plan",
    () => request("/api/garden-plan", { method: "POST", json: { spaces: [{ widthCm: 1, lengthCm: 1 }] } }),
    { status: 422, includes: '"error":"missing_spaces"' },
  ],
  [
    "garden renders the saved crop selection as normalized percentages",
    () => request("/garden"),
    { status: 200, includes: ["pomidor", "marchew", 'value="72.73"', 'value="27.27"', "100,00%"] },
  ],
  [
    "updating garden dimensions does not remove the crop selection",
    () =>
      request("/api/garden", {
        method: "POST",
        form: {
          spaceId: "",
          spaceName: "Skrzynia testowa",
          spaceType: "bed",
          widthCm: "120",
          lengthCm: "80",
        },
      }),
    { status: 302, location: "/garden?saved=1" },
  ],
  [
    "garden renders crops after the space list has been replaced",
    () => request("/garden"),
    { status: 200, includes: ["pomidor", "marchew", 'value="72.73"', 'value="27.27"', "100,00%"] },
  ],
  [
    "crop selection can be cleared before checking missing garden-plan crops",
    () => request("/api/garden-crops", { method: "POST", json: [], idempotent: true }),
    { status: 200, includes: '"saved":true' },
  ],
  [
    "garden plan reports missing crops instead of saving an empty plan",
    () => request("/api/garden-plan", { method: "POST", json: { cropIds: ["foreign-crop"] } }),
    { status: 422, includes: '"error":"missing_crops"' },
  ],
  [
    "crop selection can be restored after checking missing garden-plan crops",
    () =>
      request("/api/garden-crops", {
        method: "POST",
        json: [
          { cropId: "pomidor", proportion: 2 },
          { cropId: "marchew", proportion: 0.75 },
        ],
        idempotent: true,
      }),
    { status: 200, includes: '"saved":true' },
  ],
  [
    "garden plan generates from private database input",
    () =>
      request("/api/garden-plan", {
        method: "POST",
        json: { gardenId: "foreign-garden", widthCm: 1, spaces: [] },
        idempotent: true,
      }),
    { status: 200, includes: ['"saved":true', '"inputFingerprint"', '"plan"'] },
  ],
  [
    "regenerating garden plan remains a single current result",
    () =>
      request("/api/garden-plan", { method: "POST", json: { gardenId: "another-foreign-garden" }, idempotent: true }),
    { status: 200, includes: ['"saved":true', '"inputFingerprint"'] },
  ],
  [
    "garden SSR reads the saved current plan",
    () => request("/garden"),
    { status: 200, includes: ["garden-plan-ssr", 'data-plan-status="current"', "Układ działki"] },
  ],
  [
    "garden form exposes the stable ID of its saved space",
    async () => {
      const result = await request("/garden");
      savedSpaceId = result.body.match(/name="spaceId" value="([0-9a-f-]+)"/i)?.[1] ?? null;
      return result;
    },
    { status: 200, includes: 'name="spaceId"' },
  ],
  [
    "updating dimensions preserves the current plan and space ID",
    () => {
      if (!savedSpaceId) throw new Error("saved garden space ID missing from SSR form");
      return request("/api/garden", {
        method: "POST",
        form: {
          spaceId: savedSpaceId,
          spaceName: "Skrzynia testowa",
          spaceType: "bed",
          widthCm: "121",
          lengthCm: "80",
        },
      });
    },
    { status: 302, location: "/garden?saved=1" },
  ],
  [
    "dimension changes keep the previous plan visible as stale",
    () => request("/garden"),
    { status: 200, includes: ['data-plan-status="stale"', "Plan nieaktualny", "Układ działki"] },
  ],
  [
    "adding a space through the endpoint clears the saved plan",
    () => {
      if (!savedSpaceId) throw new Error("saved garden space ID missing from SSR form");
      const form = new URLSearchParams();
      form.append("spaceId", savedSpaceId);
      form.append("spaceName", "Skrzynia testowa");
      form.append("spaceType", "bed");
      form.append("widthCm", "120");
      form.append("lengthCm", "80");
      form.append("spaceId", "");
      form.append("spaceName", "Sektor testowy");
      form.append("spaceType", "sector");
      form.append("widthCm", "160");
      form.append("lengthCm", "100");
      return request("/api/garden", { method: "POST", form });
    },
    { status: 302, location: "/garden?saved=1" },
  ],
  [
    "structural space changes remove the plan and retain existing space IDs",
    async () => {
      const result = await request("/garden");
      const currentSpaceIds = [...result.body.matchAll(/name="spaceId" value="([0-9a-f-]+)"/gi)].map(
        (match) => match[1],
      );
      if (currentSpaceIds[0] !== savedSpaceId) throw new Error("saved space ID changed after adding another space");
      if (currentSpaceIds.length !== 2) throw new Error("expected the saved garden to contain two spaces");
      savedSectorId = currentSpaceIds[1];
      return result;
    },
    {
      status: 200,
      includes: ['data-plan-status="empty"', "Skrzynia testowa", "Sektor testowy"],
    },
  ],
  [
    "garden plan can be regenerated after a structural space change",
    () => request("/api/garden-plan", { method: "POST", json: {} }),
    { status: 200, includes: ['"saved":true', '"inputFingerprint"', '"plan"'] },
  ],
  [
    "regenerated plan reflects the saved structural change",
    () => request("/garden"),
    { status: 200, includes: ['data-plan-status="current"', "Sektor testowy"] },
  ],
  [
    "removing a space through the endpoint clears the saved plan",
    () => {
      if (!savedSpaceId || !savedSectorId) throw new Error("saved garden space IDs missing from smoke session");
      return request("/api/garden", {
        method: "POST",
        form: {
          spaceId: savedSpaceId,
          spaceName: "Skrzynia testowa",
          spaceType: "bed",
          widthCm: "120",
          lengthCm: "80",
        },
      });
    },
    { status: 302, location: "/garden?saved=1" },
  ],
  [
    "structural space removal keeps only the retained ID and leaves no plan",
    async () => {
      const result = await request("/garden");
      const currentSpaceIds = [...result.body.matchAll(/name="spaceId" value="([0-9a-f-]+)"/gi)].map(
        (match) => match[1],
      );
      if (currentSpaceIds.length !== 1 || currentSpaceIds[0] !== savedSpaceId) {
        throw new Error("removing a space did not retain exactly the original space ID");
      }
      return result;
    },
    { status: 200, includes: ['data-plan-status="empty"', "Skrzynia testowa"], excludes: "Sektor testowy" },
  ],
  [
    "garden plan can be regenerated after removing a structural space",
    () => request("/api/garden-plan", { method: "POST", json: {} }),
    { status: 200, includes: ['"saved":true', '"inputFingerprint"', '"plan"'] },
  ],
  [
    "regenerated plan stays current after structural space removal",
    () => request("/garden"),
    { status: 200, includes: ['data-plan-status="current"', "Skrzynia testowa"], excludes: "Sektor testowy" },
  ],
  [
    "a separate signed-in account can be created for private plan isolation",
    () =>
      request("/api/auth/signup", {
        method: "POST",
        form: { email: secondEmail, password, confirmPassword: password },
        cookieJar: secondJar,
      }),
    { status: 302, location: "/dashboard" },
  ],
  [
    "second account does not read the first account's garden plan",
    () => request("/garden", { cookieJar: secondJar }),
    { status: 200, includes: 'data-plan-status="empty"', excludes: "Skrzynia testowa" },
  ],
  [
    "saving an empty crop selection clears the previous selection",
    () => request("/api/garden-crops", { method: "POST", json: [] }),
    { status: 200, includes: '"saved":true' },
  ],
  [
    "garden renders the empty crop selection after clearing",
    () => request("/garden"),
    {
      status: 200,
      includes: ["Nie wybrano jeszcze warzyw", 'data-plan-status="stale"', "Plan nieaktualny", "Skrzynia testowa"],
      excludes: ['id="crop-proportion-pomidor"', 'id="crop-proportion-marchew"'],
    },
  ],
  [
    "garden plan reports missing crops instead of saving an empty plan",
    () =>
      request("/api/garden-plan", {
        method: "POST",
        json: { crops: [{ cropId: "pomidor", proportion: 100 }] },
      }),
    { status: 422, includes: '"error":"missing_crops"' },
  ],
  [
    "failed plan generation leaves the previous plan visible as stale",
    () => request("/garden"),
    {
      status: 200,
      includes: ['data-plan-status="stale"', "Plan nieaktualny", "Układ działki"],
    },
  ],
  [
    "garden crop mix can be changed after the saved plan becomes stale",
    () =>
      request("/api/garden-crops", {
        method: "POST",
        json: [
          { cropId: "pomidor", proportion: 2 },
          { cropId: "marchew", proportion: 1 },
        ],
        idempotent: true,
      }),
    { status: 200, includes: '"saved":true' },
  ],
  [
    "changed garden crop mix remains stale until the plan is regenerated",
    () => request("/garden"),
    { status: 200, includes: ['data-plan-status="stale"', "Plan nieaktualny"] },
  ],
  [
    "garden plan can be regenerated after the crop mix changes",
    () => request("/api/garden-plan", { method: "POST", json: { gardenId: "regenerate-after-stale" } }),
    { status: 200, includes: ['"saved":true', '"inputFingerprint"', '"plan"'] },
  ],
  [
    "garden SSR shows the regenerated plan as current",
    () => request("/garden"),
    { status: 200, includes: ['data-plan-status="current"', "Układ działki"] },
  ],
  [
    "signout clears session before default signin",
    () => request("/api/auth/signout", { method: "POST", idempotent: true }),
    { status: 302, location: "/" },
  ],
  [
    "signin without returnTo defaults to dashboard",
    () => request("/api/auth/signin", { method: "POST", form: { email, password } }),
    { status: 302, location: "/dashboard" },
  ],
  ["dashboard renders after default signin", () => request("/dashboard"), { status: 200 }],
  [
    "signin rejects an external returnTo",
    () => request("/api/auth/signin", { method: "POST", form: { email, password, returnTo: "https://example.com" } }),
    { status: 302, location: "/dashboard" },
  ],
  [
    "signin rejects a protocol-relative returnTo",
    () => request("/api/auth/signin", { method: "POST", form: { email, password, returnTo: "//example.com" } }),
    { status: 302, location: "/dashboard" },
  ],
  [
    "signin rejects a backslash returnTo",
    () => request("/api/auth/signin", { method: "POST", form: { email, password, returnTo: "/\\\\example.com" } }),
    { status: 302, location: "/dashboard" },
  ],
  [
    "unknown signin error displays only generic message",
    () => request("/auth/signin?error=supabase-secret-sentinel"),
    { status: 200, includes: "Something went wrong. Please try again.", excludes: "supabase-secret-sentinel" },
  ],
  [
    "unknown signup error displays only generic message",
    () => request("/auth/signup?error=supabase-secret-sentinel"),
    { status: 200, includes: "Something went wrong. Please try again.", excludes: "supabase-secret-sentinel" },
  ],
];

let failed = 0;
for (const [name, run, expected] of steps) {
  const actual = await run();
  const ok =
    actual.status === expected.status &&
    (expected.location === undefined || actual.location.startsWith(expected.location)) &&
    (expected.locationExcludes === undefined ||
      expected.locationExcludes.every((text) => !decodeURIComponent(actual.location).includes(text))) &&
    (expected.includes === undefined ||
      (Array.isArray(expected.includes)
        ? expected.includes.every((text) => actual.body.includes(text))
        : actual.body.includes(expected.includes))) &&
    (expected.excludes === undefined ||
      (Array.isArray(expected.excludes)
        ? expected.excludes.every((text) => !actual.body.includes(text))
        : !actual.body.includes(expected.excludes)));
  const retryNote = actual.retries > 0 ? ` (${actual.retries} retries)` : "";
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}  -> ${actual.status} ${actual.location}${retryNote}`);
  if (!ok) {
    failed++;
    console.log(`      expected ${expected.status} ${expected.location ?? ""}`);
    let diagnostic = actual.body.replace(/\s+/g, " ").slice(0, 180);
    try {
      const responseBody = JSON.parse(actual.body);
      if (typeof responseBody.error === "string") diagnostic = responseBody.error;
    } catch {
      // Keep a short response excerpt for non-JSON failures.
    }
    if (diagnostic) console.log(`      response ${diagnostic}`);
  }
}

console.log(failed ? `\n${failed} step(s) failed` : "\nAll smoke steps passed");
process.exit(failed ? 1 : 0);
