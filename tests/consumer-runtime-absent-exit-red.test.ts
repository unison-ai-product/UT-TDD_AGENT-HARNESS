import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { REQUIRED } from "../src/lint/project-hook.ts";
import { BUILTIN_GITHUB_TEMPLATES } from "../src/setup/templates.ts";

// Issue #1602: when the consumer runtime active pointer is absent, the generated
// launcher splits its handling by the first two argv words (design: consumer-worktree-runtime.md §4).

const RECORD_ARGV: readonly (readonly string[])[] = [
  ["session", "start"],
  ["session", "summary"],
  ["hook", "post-tool-use"],
  ["hook", "claude-memory-wake"],
  ["hook", "subagent-stop"],
];
const GUARD_ARGV: readonly (readonly string[])[] = [
  ["hook", "agent-guard"],
  ["hook", "work-guard"],
];
const OTHER_ARGV: readonly (readonly string[])[] = [["status"], ["hook", "unknown-hook"], []];

const roots: string[] = [];

function createAbsentRuntimeWorktree(): { root: string; launcherPath: string } {
  const root = mkdtempSync(join(tmpdir(), "ut-tdd cwtrt absent exit "));
  roots.push(root);
  const launcherPath = join(root, ".ut-tdd", "bin", "ut-tdd.mjs");
  mkdirSync(join(root, ".ut-tdd", "bin"), { recursive: true });
  writeFileSync(launcherPath, BUILTIN_GITHUB_TEMPLATES["common/ut-tdd.mjs"]);
  return { root, launcherPath };
}

function runLauncher(fixture: { root: string; launcherPath: string }, argv: readonly string[]) {
  return spawnSync(process.execPath, [fixture.launcherPath, ...argv], {
    cwd: fixture.root,
    encoding: "utf8",
    input: "{}\n",
    timeout: 15_000,
    windowsHide: true,
    env: {
      ...process.env,
      CLAUDE_PROJECT_DIR: fixture.root,
      UT_TDD_PROJECT_DIR: fixture.root,
      UT_TDD_SKIP_UPDATE_CHECK: "1",
    },
  });
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("issue #1602 consumer runtime absent exit split", () => {
  it.fails("U-CWTRT-012: record and session hooks fail open with one stderr line", () => {
    const fixture = createAbsentRuntimeWorktree();
    for (const argv of RECORD_ARGV) {
      const result = runLauncher(fixture, argv);
      expect(result.status, argv.join(" ")).toBe(0);
      expect(result.stdout, argv.join(" ")).toBe("");
      expect(result.stderr, argv.join(" ")).toContain("consumer_runtime_absent");
      expect(result.stderr.trim().split(/\r?\n/), argv.join(" ")).toHaveLength(1);
    }
  });

  it("U-CWTRT-013: guards still block with setup guidance", () => {
    const fixture = createAbsentRuntimeWorktree();
    for (const argv of GUARD_ARGV) {
      const result = runLauncher(fixture, argv);
      expect(result.status, argv.join(" ")).toBe(2);
      expect(result.stderr, argv.join(" ")).toContain("consumer_runtime_absent");
      expect(result.stderr, argv.join(" ")).toContain("setup --worktree");
    }
  });

  it("U-CWTRT-014: other argv fail closed and other deny codes stay exit 78", () => {
    const fixture = createAbsentRuntimeWorktree();
    for (const argv of OTHER_ARGV) {
      const result = runLauncher(fixture, argv);
      expect(result.status, argv.join(" ")).toBe(2);
      expect(result.stderr, argv.join(" ")).toContain("setup --worktree");
    }

    const pointerDir = join(fixture.root, ".ut-tdd", "runtime", "activation");
    mkdirSync(pointerDir, { recursive: true });
    writeFileSync(join(pointerDir, "active.json"), `${JSON.stringify({ bundle_path: "bad" })}\n`);
    const denied = runLauncher(fixture, ["hook", "post-tool-use"]);
    expect(denied.status).toBe(78);
    expect(denied.stderr.trim()).toBe("consumer_runtime_resolution_denied");
  });

  it.fails("U-CWTRT-015: the fail-open set is derived from the project-hook definitions", () => {
    const derived = REQUIRED.filter((hook) => !("onFailure" in hook)).map((hook) =>
      hook.wrapperArgs.slice(1, 3),
    );
    expect(derived.map((pair) => pair.join(" ")).sort()).toEqual(
      RECORD_ARGV.map((pair) => pair.join(" ")).sort(),
    );

    const launcher = BUILTIN_GITHUB_TEMPLATES["common/ut-tdd.mjs"];
    for (const [first, second] of derived) {
      expect(launcher, `${first} ${second}`).toMatch(
        new RegExp(`${first}[^a-z0-9-]{1,8}${second}`),
      );
    }
  });
});
