import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Command } from "commander";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  adapterExecutionEnv,
  executeAdapterPlanForCli,
  registerDelegationCommands,
} from "../src/cli/delegation.ts";
import { buildAdapterPlan } from "../src/runtime/adapter.ts";

// issue #721 finding 2: the untracked-added loader (used by the review-guard exemption at the
// delegation call site) must fail-close to "no exemption" when it throws, not silently exempt.
const untrackedLoader = vi.hoisted(() => ({ fail: false }));
vi.mock("../src/lint/change-impact.ts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/lint/change-impact.ts")>();
  return {
    ...actual,
    loadUntrackedAddedFiles: (repoRoot: string) => {
      if (untrackedLoader.fail) {
        throw new Error("simulated untracked-added loader failure (issue #721 finding 2)");
      }
      return actual.loadUntrackedAddedFiles(repoRoot);
    },
  };
});

const legacyPrefix = ["HE", "LIX"].join("");
const touchedKeys = [
  [legacyPrefix, "ALLOW", "RAW", "CLAUDE"].join("_"),
  [legacyPrefix, "RAW", "CLAUDE", "REASON"].join("_"),
  [legacyPrefix, "ALLOW", "RAW", "CODEX"].join("_"),
  [legacyPrefix, "RAW", "CODEX", "REASON"].join("_"),
  [legacyPrefix, "CLAUDE", "BIN"].join("_"),
  [legacyPrefix, "CODEX", "BIN"].join("_"),
  "UT_TDD_CODEX_BIN",
  "UT_TDD_CLAUDE_BIN",
  "UT_TDD_DISABLE_CLAUDE_MEMORY_WAKE",
];

const originalValues = new Map(touchedKeys.map((key) => [key, process.env[key]]));

afterEach(() => {
  for (const key of touchedKeys) {
    const original = originalValues.get(key);
    if (original === undefined) delete process.env[key];
    else process.env[key] = original;
  }
});

describe("CLI delegation adapter execution env", () => {
  it("strips legacy raw-provider env while preserving UT-TDD provider overrides", () => {
    for (const key of touchedKeys.filter((key) => key.startsWith(legacyPrefix))) {
      process.env[key] = "legacy";
    }
    process.env.UT_TDD_CODEX_BIN = "C:/tools/codex.cmd";
    process.env.UT_TDD_CLAUDE_BIN = "C:/tools/claude.exe";

    const env = adapterExecutionEnv("codex", { EXTRA_FLAG: "1" });

    for (const key of touchedKeys.filter((key) => key.startsWith(legacyPrefix))) {
      expect(env[key], key).toBeUndefined();
    }
    expect(env.UT_TDD_CODEX_BIN).toBe("C:/tools/codex.cmd");
    expect(env.UT_TDD_CLAUDE_BIN).toBe("C:/tools/claude.exe");
    expect(env.EXTRA_FLAG).toBe("1");
    expect(env).not.toBe(process.env);
    expect(process.env[[legacyPrefix, "ALLOW", "RAW", "CODEX"].join("_")]).toBe("legacy");
  });

  it("U-MEMWAKE-006: non-interactive Claude delegation disables the idle-session wake hook", () => {
    const claudeEnv = adapterExecutionEnv("claude", {
      UT_TDD_DISABLE_CLAUDE_MEMORY_WAKE: "0",
    });
    const codexEnv = adapterExecutionEnv("codex");

    expect(claudeEnv.UT_TDD_DISABLE_CLAUDE_MEMORY_WAKE).toBe("1");
    expect(codexEnv.UT_TDD_DISABLE_CLAUDE_MEMORY_WAKE).toBeUndefined();
  });
});

describe("CLI delegation command registration", () => {
  it("registers codex and claude runtime adapter commands with governed overrides", () => {
    const program = new Command();
    registerDelegationCommands(program, {
      gitBranch: () => "work/test",
      gitHead: () => "abc1234",
      resolveTaskText: (opts) => opts.task ?? null,
      resolveSkillContextInjection: () => undefined,
      runSessionStartSideEffects: () => {},
      taskFileOptionDescription: "read task text from file",
      writeHandoverWarnings: () => {},
    });

    for (const provider of ["codex", "claude"]) {
      const command = program.commands.find((candidate) => candidate.name() === provider);
      expect(command, provider).toBeDefined();
      expect(command?.description()).toBe(`${provider} runtime adapter command`);
      expect(command?.options.map((option) => option.long)).toEqual([
        "--role",
        "--task",
        "--task-file",
        "--plan",
        "--model",
        "--effort",
        "--review-pr",
        "--review-head",
        "--review-revision",
        "--review-author-family",
        "--review-memory-id",
        "--execute",
        "--json",
      ]);
    }
  });

  it("U-ADAPTER-010: hides the delegated provider console window", () => {
    const sessionPrefix = `issue683-delegation-${Date.now()}`;
    const fixtureRoot = mkdtempSync(join(tmpdir(), "ut-tdd-cli-delegation-"));
    const cwd = vi.spyOn(process, "cwd").mockReturnValue(fixtureRoot);
    let spawnOptions: { windowsHide?: boolean } | undefined;
    try {
      const plan = buildAdapterPlan(
        { provider: "codex", role: "se", task: "probe delegation", execute: true },
        "codex-only",
      );
      const result = executeAdapterPlanForCli(
        plan,
        { sessionPrefix, toolName: "codex" },
        {
          gitBranch: () => "test/issue683",
          gitHead: () => "deadbee",
          runSessionStartSideEffects: () => {},
          writeHandoverWarnings: () => {},
          spawnSync: (_command, _args, options) => {
            spawnOptions = options;
            return { status: 0, signal: null };
          },
        },
      );

      expect(result.exit_code).toBe(0);
      expect(spawnOptions?.windowsHide).toBe(true);
    } finally {
      cwd.mockRestore();
      rmSync(fixtureRoot, { recursive: true, force: true });
    }
  });
});

describe("CLI delegation review-guard untracked-added exemption (issue #721 finding 2)", () => {
  it.each([
    { loaderFails: false, violation: false },
    { loaderFails: true, violation: true },
  ])("U-ADAPTER-012: loader fails=$loaderFails → concurrent .ut-tdd/memory/ addition violation=$violation (fail-close on loader error)", ({
    loaderFails,
    violation,
  }) => {
    untrackedLoader.fail = loaderFails;
    // mutation check: if safeLoadUntrackedAddedFiles instead swallowed the loader failure by
    // returning a permissive/non-empty set (or if the guard skipped the exemption call
    // entirely on failure without flagging), this test would see no "review-guard - violation"
    // message and fail.
    const fixtureRoot = mkdtempSync(join(tmpdir(), "ut-tdd-cli-delegation-reviewguard-"));
    execFileSync("git", ["init", "--quiet"], { cwd: fixtureRoot, stdio: "ignore" });
    execFileSync("git", ["config", "user.email", "test@example.invalid"], { cwd: fixtureRoot });
    execFileSync("git", ["config", "user.name", "UT-TDD test"], { cwd: fixtureRoot });
    writeFileSync(join(fixtureRoot, "README.md"), "seed\n");
    // seed `.ut-tdd/` as a *tracked* directory (like the real repo) so plain `git status
    // --porcelain` reports the new file individually instead of collapsing the whole
    // still-untracked `.ut-tdd/` directory into a single `?? .ut-tdd/` entry.
    mkdirSync(join(fixtureRoot, ".ut-tdd"), { recursive: true });
    writeFileSync(join(fixtureRoot, ".ut-tdd", ".gitkeep"), "");
    execFileSync("git", ["add", "README.md", ".ut-tdd/.gitkeep"], { cwd: fixtureRoot });
    execFileSync("git", ["commit", "-qm", "seed"], { cwd: fixtureRoot });

    const cwd = vi.spyOn(process, "cwd").mockReturnValue(fixtureRoot);
    const stderrChunks: string[] = [];
    const stderrSpy = vi
      .spyOn(process.stderr, "write")
      .mockImplementation((chunk: string | Uint8Array) => {
        stderrChunks.push(typeof chunk === "string" ? chunk : chunk.toString());
        return true;
      });
    try {
      const plan = buildAdapterPlan(
        { provider: "codex", role: "blind-reviewer", task: "probe review-guard", execute: true },
        "codex-only",
      );
      const result = executeAdapterPlanForCli(
        plan,
        {
          sessionPrefix: `issue721-reviewguard-${Date.now()}`,
          toolName: "codex",
          reviewRole: "blind-reviewer",
        },
        {
          gitBranch: () => "test/issue721",
          gitHead: () => "deadbee",
          runSessionStartSideEffects: () => {},
          writeHandoverWarnings: () => {},
          spawnSync: (_command, _args, options) => {
            // simulate another lane running `ut-tdd memory add` mid-session, concurrently with
            // this read-only review delegation (the exact scenario issue #721 must exempt).
            mkdirSync(join(fixtureRoot, ".ut-tdd", "memory"), { recursive: true });
            writeFileSync(join(fixtureRoot, ".ut-tdd", "memory", "concurrent.md"), "note\n");
            return { status: 0, signal: null };
          },
        },
      );

      expect(result.exit_code).toBe(0);
      const stderr = stderrChunks.join("");
      if (violation) {
        expect(stderr).toContain("review-guard - violation");
        expect(stderr).toContain(".ut-tdd/memory/concurrent.md");
      } else {
        // control: with a working loader the same concurrent memory addition is exempt, so the
        // violation above is caused by the loader failure and not by unrelated fixture writes.
        expect(stderr).not.toContain("review-guard - violation");
      }
    } finally {
      untrackedLoader.fail = false;
      stderrSpy.mockRestore();
      cwd.mockRestore();
      rmSync(fixtureRoot, { recursive: true, force: true });
    }
  });
});
