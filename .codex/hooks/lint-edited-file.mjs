import { access } from "node:fs/promises";
import path from "node:path";
import { emitPostToolFailure, findRepoRoot, getPatchedFiles, readPayload, runNodeFile } from "./shared.mjs";

const payload = await readPayload();
const cwd = typeof payload.cwd === "string" ? payload.cwd : process.cwd();
const root = findRepoRoot(cwd);
if (!root) process.exit(0);

const files = getPatchedFiles(root, cwd, payload.tool_input?.command);
const existingFiles = [];
for (const file of files) {
  try {
    await access(file);
    existingFiles.push(file);
  } catch {
    // A patch may name a deleted or not-yet-created file; it has nothing to lint.
  }
}

if (existingFiles.length === 0) process.exit(0);

const relativeFiles = existingFiles.map((file) => path.relative(root, file));
const result = await runNodeFile(
  root,
  "eslint/bin/eslint.js",
  ["--quiet", "--no-warn-ignored", ...relativeFiles],
  25000,
);
if (result.status !== 0) {
  emitPostToolFailure(
    `ESLint failed for edited files:\n${relativeFiles.join("\n")}\n${result.output || "ESLint returned a non-zero exit code."}`,
  );
}
