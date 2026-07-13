import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { requireRuntimeRepoRoot, resolveRuntimeRepoRoot } from "../src/runtime/repo-root";

describe("U-TESTHYGIENE-002: runtime repo root", () => {
  it("walks from a nested hook cwd to the nearest UT-TDD root", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-runtime-root-"));
    try {
      const nested = join(root, "docs", "plans");
      mkdirSync(nested, { recursive: true });
      writeFileSync(join(root, "ut-tdd.project.json"), "{}\n");
      expect(resolveRuntimeRepoRoot({ cwd: nested, env: {} })).toBe(root);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("accepts only marked absolute provider roots and blocks an unresolved cwd", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-runtime-env-"));
    const isolated = mkdtempSync(join(tmpdir(), "ut-tdd-runtime-isolated-"));
    try {
      writeFileSync(join(root, "ut-tdd.project.json"), "{}\n");
      expect(resolveRuntimeRepoRoot({ cwd: isolated, env: { CLAUDE_PROJECT_DIR: root } })).toBe(root);
      expect(resolveRuntimeRepoRoot({ cwd: isolated, env: { CLAUDE_PROJECT_DIR: "relative" } })).toBeNull();
      expect(() =>
        requireRuntimeRepoRoot({ cwd: isolated, env: { CLAUDE_PROJECT_DIR: "relative" } }),
      ).toThrow("runtime state write blocked");
    } finally {
      rmSync(root, { recursive: true, force: true });
      rmSync(isolated, { recursive: true, force: true });
    }
  });
});
