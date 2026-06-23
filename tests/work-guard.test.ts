import { describe, expect, it } from "vitest";
import { evaluateWorkGuard, normalizeRepoRelative } from "../src/runtime/work-guard";

describe("work guard (PLAN-L7-114) — 作業衝突ガードレール", () => {
  it("blocks editing an uncommitted file this session never touched (他ランタイムの in-flight)", () => {
    const result = evaluateWorkGuard({
      targetPath: "src/plan/lint.ts",
      uncommittedFiles: ["src/plan/lint.ts", "src/feedback/surface.ts"],
      sessionTouchedFiles: ["src/feedback/surface.ts"],
      bypass: false,
    });
    expect(result.decision).toBe("block");
    expect(result.reason).toBe("foreign-uncommitted");
    expect(result.message).toContain("src/plan/lint.ts");
  });

  it("passes editing a file this session already touched (自分の作業の継続)", () => {
    const result = evaluateWorkGuard({
      targetPath: "src/feedback/surface.ts",
      uncommittedFiles: ["src/feedback/surface.ts"],
      sessionTouchedFiles: ["src/feedback/surface.ts"],
      bypass: false,
    });
    expect(result.decision).toBe("pass");
    expect(result.reason).toBe("clean-or-own");
  });

  it("passes editing a clean (committed) file not in the uncommitted set", () => {
    const result = evaluateWorkGuard({
      targetPath: "src/cli.ts",
      uncommittedFiles: ["src/plan/lint.ts"],
      sessionTouchedFiles: [],
      bypass: false,
    });
    expect(result.decision).toBe("pass");
  });

  it("passes a foreign uncommitted file only when override is set (+evidence)", () => {
    const base = {
      targetPath: "src/plan/lint.ts",
      uncommittedFiles: ["src/plan/lint.ts"],
      sessionTouchedFiles: [],
    };
    expect(evaluateWorkGuard({ ...base, bypass: false }).decision).toBe("block");
    expect(evaluateWorkGuard({ ...base, bypass: true }).decision).toBe("pass");
    expect(evaluateWorkGuard({ ...base, bypass: true }).reason).toBe("bypass");
  });

  it("passes when there is no target path (fail-open, not our concern)", () => {
    expect(
      evaluateWorkGuard({
        targetPath: "",
        uncommittedFiles: ["src/plan/lint.ts"],
        sessionTouchedFiles: [],
        bypass: false,
      }).decision,
    ).toBe("pass");
  });

  it("normalizes Windows absolute paths and backslashes to repo-relative", () => {
    const repoRoot = "C:\\Users\\dev\\UT-TDD-agent-harness";
    expect(
      normalizeRepoRelative("C:\\Users\\dev\\UT-TDD-agent-harness\\src\\plan\\lint.ts", repoRoot),
    ).toBe("src/plan/lint.ts");
    expect(normalizeRepoRelative("./src/feedback/surface.ts", repoRoot)).toBe(
      "src/feedback/surface.ts",
    );
    expect(normalizeRepoRelative("src/cli.ts", repoRoot)).toBe("src/cli.ts");
  });

  it("blocks the real collision shape from this session (Codex's surface.ts vs my plan/lint.ts)", () => {
    // 実際に起きた衝突: Codex が触っていた src/plan/lint.ts を私が未 touch のまま編集しようとする。
    const repoRoot = "C:/repo";
    const target = normalizeRepoRelative("C:/repo/src/plan/lint.ts", repoRoot);
    const result = evaluateWorkGuard({
      targetPath: target,
      uncommittedFiles: ["src/plan/lint.ts", "tests/plan-lint.test.ts"],
      sessionTouchedFiles: ["CLAUDE.md", "AGENTS.md", "src/cli.ts"],
      bypass: false,
    });
    expect(result.decision).toBe("block");
  });
});
