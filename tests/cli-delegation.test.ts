import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Command } from "commander";
import { afterEach, describe, expect, it } from "vitest";
import {
  adapterExecutionEnv,
  registerDelegationCommands,
  reuseCanonicalReviewRequestAfterConflict,
} from "../src/cli/delegation.ts";
import { issueReviewRequest } from "../src/feedback/review-attestation.ts";

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
});

describe("CLI delegation review request conflict recovery", () => {
  it("reuses only the same invocation nonce while allowing requestedAt to change", () => {
    const repoRoot = mkdtempSync(join(tmpdir(), "ut-tdd-delegation-review-conflict-"));
    try {
      const base = {
        memoryId: "memory:delegation-review-conflict",
        pr: 640,
        exactHead: "a".repeat(40),
        reviewRevision: "review-conflict-1",
        authorFamily: "codex" as const,
      };
      const first = issueReviewRequest({
        repoRoot,
        request: { ...base, requestedAt: "2026-09-17T03:00:00.000Z" },
        strict: true,
      });
      if (!first.ok) throw new Error("expected canonical request to be issued");

      const sameNonce = {
        ...first.request,
        requestedAt: "2026-09-17T03:01:00.000Z",
      };
      expect(issueReviewRequest({ repoRoot, request: sameNonce, strict: true })).toEqual({
        ok: false,
        reason: "review_request_conflict",
      });
      expect(reuseCanonicalReviewRequestAfterConflict({ repoRoot, request: sameNonce })).toEqual(
        first.request,
      );

      const differentNonce = {
        ...sameNonce,
        invocationNonce: "nonce-different-invocation",
      };
      expect(issueReviewRequest({ repoRoot, request: differentNonce, strict: true })).toEqual({
        ok: false,
        reason: "review_request_conflict",
      });
      expect(
        reuseCanonicalReviewRequestAfterConflict({ repoRoot, request: differentNonce }),
      ).toBeNull();
    } finally {
      rmSync(repoRoot, { recursive: true, force: true });
    }
  });
});
