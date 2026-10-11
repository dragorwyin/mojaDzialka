import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { execFileSync, spawnSync } from "node:child_process";
import { access, copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const proofParent = path.join(projectRoot, "node_modules", ".cache", "agent-hooks-proof");
let fixtureRoot;

beforeEach(async () => {
  await mkdir(proofParent, { recursive: true });
  fixtureRoot = await mkdtemp(path.join(proofParent, "repo-"));
  await createFixtureRepository(fixtureRoot);
});

afterEach(async () => {
  if (fixtureRoot) await rm(fixtureRoot, { recursive: true, force: true });
});

describe("Codex agent hooks", () => {
  it("blocks an edited file with an ESLint error and names the file", async () => {
    await writeSource("broken.ts", "// LINT_ERROR\nexport const value = 1;\n");
    const result = await runHook("lint-edited-file.mjs", postToolPayload("src/broken.ts"));
    const reason = JSON.parse(result.stdout).reason;

    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({ decision: "block" });
    expect(reason.replaceAll("\\", "/")).toContain("src/broken.ts");
    expect(reason).toContain("synthetic lint error");
  });

  it("passes a clean edit and skips non-lintable, nonexistent, and external files", async () => {
    await writeSource("clean.ts", "export const value = 1;\n");
    const outside = path.join(path.dirname(fixtureRoot), "outside.ts");
    await writeFile(outside, "// LINT_ERROR\n");

    try {
      for (const file of ["src/clean.ts", "README.md", "src/missing.ts", outside]) {
        const result = await runHook("lint-edited-file.mjs", postToolPayload(file));
        expect(result).toMatchObject({ status: 0, stdout: "", stderr: "" });
      }
    } finally {
      await rm(outside, { force: true });
    }
  });

  it("tolerates empty, invalid, and non-patch payloads", async () => {
    for (const input of ["{}", "not json", JSON.stringify({ cwd: fixtureRoot, tool_input: {} })]) {
      expect(await runHook("lint-edited-file.mjs", input)).toMatchObject({ status: 0, stdout: "", stderr: "" });
    }
  });

  it("checks every path in a multi-file patch, including a Move to target", async () => {
    await writeSource("first.ts", "export const value = 1;\n");
    await writeSource("second.ts", "// LINT_ERROR\nexport const value = 2;\n");
    const patch = "*** Begin Patch\n*** Update File: src/first.ts\n*** Update File: src/second.ts\n*** End Patch";
    const multi = await runHook("lint-edited-file.mjs", {
      cwd: fixtureRoot,
      tool_name: "apply_patch",
      tool_input: { command: patch },
    });
    const move = await runHook("lint-edited-file.mjs", {
      cwd: fixtureRoot,
      tool_name: "apply_patch",
      tool_input: { command: "*** Begin Patch\n*** Move to: src/second.ts\n*** End Patch" },
    });

    expect(JSON.parse(multi.stdout).reason.replaceAll("\\", "/")).toContain("src/second.ts");
    expect(JSON.parse(move.stdout).reason.replaceAll("\\", "/")).toContain("src/second.ts");
  });

  it("resolves paths relative to a nested event cwd", async () => {
    await writeSource("nested.ts", "// LINT_ERROR\nexport const value = 1;\n");
    const payload = {
      cwd: path.join(fixtureRoot, "src"),
      tool_name: "apply_patch",
      tool_input: { command: "*** Begin Patch\n*** Update File: nested.ts\n*** End Patch" },
    };

    expect(JSON.parse((await runHook("lint-edited-file.mjs", payload)).stdout).reason.replaceAll("\\", "/")).toContain(
      "src/nested.ts",
    );
  });

  it("does not silently pass when ESLint is missing", async () => {
    await writeSource("broken.ts", "// LINT_ERROR\nexport const value = 1;\n");
    await rm(path.join(fixtureRoot, "node_modules", "eslint", "bin", "eslint.js"));

    const result = await runHook("lint-edited-file.mjs", postToolPayload("src/broken.ts"));

    expect(JSON.parse(result.stdout)).toMatchObject({ decision: "block" });
    expect(result.stdout).toContain("Required tool is missing");
  });

  it("runs related unit and API tests for an edited module", async () => {
    await writeSource("garden.ts", "export const value = 1;\n");

    const result = await runHook("test-related-modules.mjs", postToolPayload("src/garden.ts"));
    const calls = await readFile(path.join(fixtureRoot, "node_modules", ".cache", "hook-calls.log"), "utf8");

    expect(result.status).toBe(0);
    expect(calls).toContain("vitest related src/garden.ts --run --config vitest.unit.config.ts");
    expect(calls).toContain("vitest related src/garden.ts --run --config vitest.api.config.ts");
  });

  it("runs edited test files directly with the matching test config", async () => {
    await writeSource("garden.test.ts", "import { it } from 'vitest';\nit('passes', () => {});\n");
    await writeSource("api.test.ts", "import { it } from 'vitest';\nit('passes', () => {});\n");
    await mkdir(path.join(fixtureRoot, "src", "pages", "api"), { recursive: true });
    await writeFile(
      path.join(fixtureRoot, "src", "pages", "api", "api.test.ts"),
      "import { it } from 'vitest';\nit('passes', () => {});\n",
    );

    const result = await runHook("test-related-modules.mjs", {
      cwd: fixtureRoot,
      tool_name: "apply_patch",
      tool_input: {
        command:
          "*** Begin Patch\n*** Update File: src/garden.test.ts\n*** Update File: src/pages/api/api.test.ts\n*** End Patch",
      },
    });
    const calls = await readFile(path.join(fixtureRoot, "node_modules", ".cache", "hook-calls.log"), "utf8");

    expect(result.status).toBe(0);
    expect(calls).toContain("vitest run src/garden.test.ts --config vitest.unit.config.ts");
    expect(calls).toContain("vitest run src/pages/api/api.test.ts --config vitest.api.config.ts");
  });

  it("blocks on a failing related test and shows the Vitest failure", async () => {
    await writeSource("garden.ts", "export const value = 1;\n");
    await writeFile(path.join(fixtureRoot, ".fixture-unit-failure"), "fail\n");

    const result = await runHook("test-related-modules.mjs", postToolPayload("src/garden.ts"));

    expect(JSON.parse(result.stdout)).toMatchObject({ decision: "block" });
    expect(result.stdout).toContain("Related module tests failed");
    expect(result.stdout).toContain("synthetic test failure");
  });

  it("skips unsupported paths and fails visibly when Vitest is missing", async () => {
    await writeSource("garden.ts", "export const value = 1;\n");
    const skipped = await runHook("test-related-modules.mjs", postToolPayload("README.md"));
    expect(skipped).toMatchObject({ status: 0, stdout: "", stderr: "" });

    await rm(path.join(fixtureRoot, "node_modules", "vitest", "vitest.mjs"));
    const missing = await runHook("test-related-modules.mjs", postToolPayload("src/garden.ts"));
    expect(JSON.parse(missing.stdout)).toMatchObject({ decision: "block" });
    expect(missing.stdout).toContain("Required tool is missing");
  });

  it("skips checks with no changes or after Stop has already continued", async () => {
    const noChanges = await runHook("end-of-turn.mjs", { cwd: fixtureRoot, stop_hook_active: false });
    await writeSource("broken.ts", "// LINT_ERROR\nexport const value = 1;\n");
    const retry = await runHook("end-of-turn.mjs", { cwd: fixtureRoot, stop_hook_active: true });

    expect(noChanges.stdout).toBe("{}\n");
    expect(retry.stdout).toBe("{}\n");
    expect(await exists(path.join(fixtureRoot, "node_modules", ".cache", "hook-calls.log"))).toBe(false);
  });

  it("catches a shell-written lint error and runs unit, API, token, and type checks", async () => {
    await writeSource("changed.ts", "// LINT_ERROR\nexport const value = 1;\n");
    const result = await runHook("end-of-turn.mjs", { cwd: fixtureRoot, stop_hook_active: false });
    const reason = JSON.parse(result.stdout).reason;
    const calls = await readFile(path.join(fixtureRoot, "node_modules", ".cache", "hook-calls.log"), "utf8");

    expect(reason).toContain("ESLint failed for changed files");
    expect(reason.replaceAll("\\", "/")).toContain("src/changed.ts");
    expect(calls).toContain("token scan");
    expect(calls).toContain("vitest run --config vitest.unit.config.ts");
    expect(calls).toContain("vitest run --config vitest.api.config.ts");
    expect(calls).toContain("astro check");
  });

  it("does not silently pass when the typechecker is missing", async () => {
    await writeFile(path.join(fixtureRoot, "README.md"), "changed\n");
    await rm(path.join(fixtureRoot, "node_modules", "astro", "bin", "astro.mjs"));

    const result = await runHook("end-of-turn.mjs", { cwd: fixtureRoot, stop_hook_active: false });

    expect(JSON.parse(result.stdout).reason).toContain("Required tool is missing");
  });
});

async function createFixtureRepository(root) {
  const directories = [
    ".codex/hooks",
    "scripts",
    "src",
    "node_modules/eslint/bin",
    "node_modules/astro/bin",
    "node_modules/vitest",
    "node_modules/.cache",
  ];
  for (const directory of directories) await mkdir(path.join(root, directory), { recursive: true });

  for (const file of ["shared.mjs", "lint-edited-file.mjs", "test-related-modules.mjs", "end-of-turn.mjs"]) {
    await copyFile(path.join(projectRoot, ".codex", "hooks", file), path.join(root, ".codex", "hooks", file));
  }

  await writeFile(path.join(root, ".gitignore"), "node_modules/\n");
  await writeFile(path.join(root, "README.md"), "baseline\n");
  await writeFile(path.join(root, "src", "clean.ts"), "export const value = 1;\n");
  await writeFile(
    path.join(root, "scripts", "check-garden-ui-tokens.mjs"),
    'import { appendFileSync } from "node:fs"; import path from "node:path"; appendFileSync(path.join(process.cwd(), "node_modules", ".cache", "hook-calls.log"), "token scan\\n"); console.log("token scan clean");\n',
  );
  await writeFile(path.join(root, "node_modules", "eslint", "bin", "eslint.js"), eslintStub);
  await writeFile(path.join(root, "node_modules", "astro", "bin", "astro.mjs"), astroStub);
  await writeFile(path.join(root, "node_modules", "vitest", "vitest.mjs"), vitestStub);

  execFileSync("git", ["init", "--quiet"], { cwd: root });
  execFileSync("git", ["config", "user.email", "hooks@example.test"], { cwd: root });
  execFileSync("git", ["config", "user.name", "Hook Proof"], { cwd: root });
  execFileSync("git", ["config", "core.autocrlf", "false"], { cwd: root });
  execFileSync("git", ["add", "--all"], { cwd: root });
  execFileSync("git", ["commit", "--quiet", "-m", "fixture baseline"], { cwd: root });
}

async function writeSource(name, contents) {
  const destination = path.join(fixtureRoot, "src", name);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, contents);
}

function postToolPayload(filePath) {
  return {
    cwd: fixtureRoot,
    tool_name: "apply_patch",
    tool_input: { command: "*** Begin Patch\n*** Update File: " + filePath + "\n*** End Patch" },
  };
}

async function runHook(name, payload) {
  const result = spawnSync(process.execPath, [path.join(fixtureRoot, ".codex", "hooks", name)], {
    cwd: fixtureRoot,
    env: {
      ...process.env,
      TEMP: path.join(fixtureRoot, "node_modules", ".cache"),
      TMP: path.join(fixtureRoot, "node_modules", ".cache"),
    },
    encoding: "utf8",
    input: typeof payload === "string" ? payload : JSON.stringify(payload),
    timeout: 30000,
    windowsHide: true,
  });

  return { status: result.status, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

const eslintStub = [
  'import { appendFileSync, readFileSync, existsSync } from "node:fs";',
  'import path from "node:path";',
  'const args = process.argv.slice(2).filter((argument) => !argument.startsWith("--"));',
  'const log = path.join(process.cwd(), "node_modules", ".cache", "hook-calls.log");',
  'appendFileSync(log, "eslint " + args.join(" ") + "\\n");',
  'const failures = args.filter((file) => existsSync(file) && readFileSync(file, "utf8").includes("LINT_ERROR"));',
  'if (failures.length) { console.error(failures.map((file) => file + ": synthetic lint error").join("\\n")); process.exitCode = 1; }',
].join("\n");

const astroStub = [
  'import { appendFileSync, existsSync } from "node:fs";',
  'import path from "node:path";',
  'const log = path.join(process.cwd(), "node_modules", ".cache", "hook-calls.log");',
  'appendFileSync(log, "astro " + process.argv.slice(2).join(" ") + "\\n");',
  'if (existsSync(path.join(process.cwd(), ".fixture-type-error"))) { console.error("synthetic type error"); process.exitCode = 1; }',
].join("\n");

const vitestStub = [
  'import { appendFileSync, existsSync } from "node:fs";',
  'import path from "node:path";',
  "const args = process.argv.slice(2);",
  'const log = path.join(process.cwd(), "node_modules", ".cache", "hook-calls.log");',
  'appendFileSync(log, "vitest " + args.join(" ") + "\\n");',
  'if (existsSync(path.join(process.cwd(), ".fixture-unit-failure"))) { console.error("synthetic test failure"); process.exitCode = 1; }',
].join("\n");
