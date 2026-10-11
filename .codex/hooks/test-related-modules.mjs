import { access } from "node:fs/promises";
import path from "node:path";
import { emitPostToolFailure, findRepoRoot, getPatchedFiles, readPayload, runNodeFile } from "./shared.mjs";

const payload = await readPayload();
const cwd = typeof payload.cwd === "string" ? payload.cwd : process.cwd();
const root = findRepoRoot(cwd);
if (!root) process.exit(0);

const supportedExtensions = new Set([".cjs", ".js", ".jsx", ".mjs", ".ts", ".tsx"]);
const files = getPatchedFiles(root, cwd, payload.tool_input?.command).filter((file) =>
  supportedExtensions.has(path.extname(file).toLowerCase()),
);
const existingFiles = [];
for (const file of files) {
  try {
    await access(file);
    existingFiles.push(file);
  } catch {
    // Deleted or not-yet-created paths do not have tests to run.
  }
}

if (existingFiles.length === 0) process.exit(0);

const configs = new Map([
  ["vitest.unit.config.ts", { related: new Set(), direct: new Set() }],
  ["vitest.api.config.ts", { related: new Set(), direct: new Set() }],
]);
for (const file of existingFiles) {
  const relative = path.relative(root, file).split(path.sep).join("/");
  const isTestFile = /\.(?:test|spec)\.(?:c|m)?(?:js|jsx|ts|tsx)$/i.test(relative);
  const directConfig = relative.startsWith("src/pages/api/") ? "vitest.api.config.ts" : "vitest.unit.config.ts";

  if (isTestFile) {
    configs.get(directConfig).direct.add(relative);
  } else {
    // Shared modules can be covered by either suite; Vitest's related mode skips non-matches.
    configs.get("vitest.unit.config.ts").related.add(relative);
    configs.get("vitest.api.config.ts").related.add(relative);
  }
}

const failures = [];
for (const [config, groups] of configs) {
  const commands = [];
  if (groups.direct.size > 0) commands.push(["run", ...groups.direct, "--config", config]);
  if (groups.related.size > 0) commands.push(["related", ...groups.related, "--run", "--config", config]);

  for (const args of commands) {
    const result = await runNodeFile(root, "vitest/vitest.mjs", args, 25000);
    if (result.status !== 0) {
      failures.push(
        `${config} failed for edited modules:\n${[...groups.direct, ...groups.related].join("\n")}\n${result.output || "Vitest returned a non-zero exit code."}`,
      );
    }
  }
}

if (failures.length > 0) emitPostToolFailure(`Related module tests failed:\n${failures.join("\n\n")}`);
