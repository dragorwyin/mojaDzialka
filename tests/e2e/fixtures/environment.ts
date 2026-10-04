import { existsSync, readFileSync } from "node:fs";
import process from "node:process";
import { parseEnv } from "node:util";

function localOrigin(value: string, label: string, expectedPort: string) {
  const url = new URL(value);
  if (
    url.protocol !== "http:" ||
    !["localhost", "127.0.0.1"].includes(url.hostname) ||
    url.port !== expectedPort ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error(`${label} must be a loopback HTTP origin on port ${expectedPort}; e2e refuses remote data.`);
  }
  return url.origin;
}

export function readE2eEnvironment() {
  const externalPreview = process.env.E2E_EXTERNAL_PREVIEW === "1";
  if (externalPreview && !process.env.CI) throw new Error("External preview is only allowed in explicit CI mode.");
  if (process.env.CI && !externalPreview) throw new Error("CI must explicitly supply its prepared preview.");
  const port = externalPreview ? "4321" : "4323";
  const baseURL = localOrigin(process.env.E2E_BASE_URL ?? `http://127.0.0.1:${port}`, "E2E_BASE_URL", port);
  // Check both build and Cloudflare runtime inputs, including any environment override.
  const supabaseOrigins: string[] = [];
  for (const file of [".env", ".dev.vars"]) {
    if (!existsSync(file)) throw new Error(`Missing ${file}; configure local Supabase before running e2e.`);
    const value = parseEnv(readFileSync(file, "utf8")).SUPABASE_URL;
    if (!value) throw new Error(`Missing SUPABASE_URL in ${file}.`);
    supabaseOrigins.push(localOrigin(value, `${file} SUPABASE_URL`, "54321"));
  }
  for (const file of [".env.local", ".env.production", ".env.production.local", ".dev.vars.local"]) {
    if (!existsSync(file)) continue;
    const value = parseEnv(readFileSync(file, "utf8")).SUPABASE_URL;
    if (value) supabaseOrigins.push(localOrigin(value, `${file} SUPABASE_URL`, "54321"));
  }
  if (process.env.SUPABASE_URL) {
    supabaseOrigins.push(localOrigin(process.env.SUPABASE_URL, "SUPABASE_URL", "54321"));
  }
  if (new Set(supabaseOrigins).size !== 1) throw new Error("Build and preview Supabase origins must agree.");
  return { baseURL, externalPreview, port };
}
