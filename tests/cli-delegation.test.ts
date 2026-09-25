import { mkdtempSync, rmSync } from "node:fs";
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
