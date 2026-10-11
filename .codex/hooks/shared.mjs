import { spawnSync } from "node:child_process";
import path from "node:path";
import { mkdir, readFile } from "node:fs/promises";

export const LINTABLE_EXTENSIONS = new Set([".astro", ".cjs", ".js", ".jsx", ".mjs", ".ts", ".tsx"]);

export async function readPayload() {
  let raw = "";
  for await (const chunk of process.stdin) raw += chunk;

  try {
    const value = JSON.parse(raw);
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}

export function findRepoRoot(cwd) {
  if (typeof cwd !== "string" || cwd.length === 0) return null;
  const result = spawnSync("git", ["rev-parse", "--show-toplevel"], { cwd, encoding: "utf8", windowsHide: true });
  return result.status === 0 ? path.resolve(result.stdout.trim()) : null;
}

export function isInside(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === "" || (!path.isAbsolute(relative) && relative !== ".." && !relative.startsWith(`..${path.sep}`));
}

export function resolveRepoFile(root, cwd, filePath) {
  if (typeof filePath !== "string" || filePath.trim().length === 0) return null;
  const absolute = path.resolve(cwd, filePath.trim());
  return isInside(root, absolute) ? absolute : null;
}

export function parsePatchPaths(patch) {
  if (typeof patch !== "string") return [];
  return [...patch.matchAll(/^\*\*\* (?:Update File|Add File|Move to):\s*(.+?)\s*$/gm)].map((match) => match[1]);
}

export function getPatchedFiles(root, cwd, patch) {
  return [...new Set(parsePatchPaths(patch))]
    .map((filePath) => resolveRepoFile(root, cwd, filePath))
    .filter((filePath) => filePath && LINTABLE_EXTENSIONS.has(path.extname(filePath).toLowerCase()));
}

export function collectChangedFiles(root) {
  const tracked = spawnSync("git", ["diff", "--name-only", "HEAD", "--"], {
    cwd: root,
    encoding: "utf8",
    windowsHide: true,
  });
  const untracked = spawnSync("git", ["ls-files", "--others", "--exclude-standard"], {
    cwd: root,
    encoding: "utf8",
    windowsHide: true,
  });

  if (tracked.status !== 0 || untracked.status !== 0) {
    const detail = [tracked.stderr, untracked.stderr].filter(Boolean).join("\n").trim();
    throw new Error(`Could not list changed files${detail ? `: ${detail}` : "."}`);
  }

  return [...new Set(`${tracked.stdout}\n${untracked.stdout}`.split(/\r?\n/).filter(Boolean))].sort();
}

export function toolEnvironment(root) {
  const tempDirectory = path.join(root, "node_modules", ".cache", "codex-hook-tmp");
  return {
    ...process.env,
    NO_COLOR: "1",
    FORCE_COLOR: "0",
    TEMP: tempDirectory,
    TMP: tempDirectory,
  };
}

export async function runNodeFile(root, relativePath, args = [], timeout = 30000) {
  const filePath = path.join(root, "node_modules", ...relativePath.split("/"));
  try {
    await readFile(filePath);
  } catch {
    return { status: 1, output: `Required tool is missing: ${filePath}` };
  }

  await mkdir(path.join(root, "node_modules", ".cache", "codex-hook-tmp"), { recursive: true });
  const result = spawnSync(process.execPath, [filePath, ...args], {
    cwd: root,
    encoding: "utf8",
    env: toolEnvironment(root),
    timeout,
    windowsHide: true,
  });
  const output = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
  if (result.error) return { status: 1, output: `${result.error.message}${output ? `\n${output}` : ""}` };
  return { status: result.status ?? 1, output };
}

export function formatResult(label, result) {
  if (result.status === 0) return null;
  return `${label} failed${result.output ? `:\n${result.output}` : "."}`;
}

export function emitPostToolFailure(reason) {
  process.stdout.write(`${JSON.stringify({ decision: "block", reason })}\n`);
}

export function emitStopResult(reasons) {
  if (reasons.length === 0) {
    process.stdout.write("{}\n");
    return;
  }
  process.stdout.write(
    `${JSON.stringify({ decision: "block", reason: `Fix these before finishing:\n${reasons.join("\n\n")}` })}\n`,
  );
}
