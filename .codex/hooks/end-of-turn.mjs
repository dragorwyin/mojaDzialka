import { access, mkdir } from "node:fs/promises";
import path from "node:path";
import {
  collectChangedFiles,
  emitStopResult,
  findRepoRoot,
  LINTABLE_EXTENSIONS,
  readPayload,
  runNodeFile,
} from "./shared.mjs";

const payload = await readPayload();
if (payload.stop_hook_active === true) {
  process.stdout.write("{}\n");
  process.exit(0);
}

const cwd = typeof payload.cwd === "string" ? payload.cwd : process.cwd();
const root = findRepoRoot(cwd);
if (!root) {
  emitStopResult(["Could not locate the Git checkout for end-of-turn checks."]);
  process.exit(0);
}

let changedFiles;
try {
  changedFiles = collectChangedFiles(root);
} catch (error) {
  emitStopResult([error instanceof Error ? error.message : String(error)]);
  process.exit(0);
}

if (changedFiles.length === 0) {
  process.stdout.write("{}\n");
  process.exit(0);
}

const reasons = [];
const existingFiles = [];
for (const relativeFile of changedFiles) {
  const absoluteFile = path.resolve(root, relativeFile);
  if (
    !absoluteFile.startsWith(`${root}${path.sep}`) ||
    !LINTABLE_EXTENSIONS.has(path.extname(relativeFile).toLowerCase())
  )
    continue;
  try {
    await access(absoluteFile);
    existingFiles.push(relativeFile);
  } catch {
    // Deleted files do not need a per-file lint run.
  }
}

await mkdir(path.join(root, "node_modules", ".cache", "codex-hook-tmp"), { recursive: true });

if (existingFiles.length > 0) {
  const lint = await runNodeFile(
    root,
    "eslint/bin/eslint.js",
    ["--quiet", "--no-warn-ignored", ...existingFiles],
    30000,
  );
  if (lint.status !== 0)
    reasons.push(
      `ESLint failed for changed files:\n${existingFiles.join("\n")}\n${lint.output || "ESLint returned a non-zero exit code."}`,
    );
}

const tokenScan = await runNodeFile(root, "../scripts/check-garden-ui-tokens.mjs", [], 10000);
if (tokenScan.status !== 0) {
  reasons.push(`Garden UI token scan failed:\n${tokenScan.output || "The token scanner could not run."}`);
}

const unit = await runNodeFile(root, "vitest/vitest.mjs", ["run", "--config", "vitest.unit.config.ts"], 25000);
if (unit.status !== 0)
  reasons.push(`Unit and hook-proof tests failed:\n${unit.output || "Vitest returned a non-zero exit code."}`);

const api = await runNodeFile(root, "vitest/vitest.mjs", ["run", "--config", "vitest.api.config.ts"], 25000);
if (api.status !== 0) reasons.push(`API tests failed:\n${api.output || "Vitest returned a non-zero exit code."}`);

const astro = await runNodeFile(root, "astro/bin/astro.mjs", ["check"], 60000);
if (astro.status !== 0)
  reasons.push(`Astro typecheck failed:\n${astro.output || "astro check returned a non-zero exit code."}`);

emitStopResult(reasons);
