import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { collectDistributionCandidatePaths } from "../src/cli/distribution.ts";

function git(cwd: string, args: string[]): void {
  execFileSync("git", args, { cwd, stdio: "ignore" });
}

describe("distribution source candidate boundary", () => {
  it("uses the HEAD tree and excludes untracked files under allowed prefixes", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-distribution-candidates-"));
    try {
      mkdirSync(join(root, "scripts"), { recursive: true });
      writeFileSync(join(root, "scripts", "tracked.ts"), "export {}\n", "utf8");
      writeFileSync(join(root, "scripts", "untracked.ts"), "secret workspace state\n", "utf8");
      git(root, ["init", "--quiet"]);
      git(root, ["config", "user.email", "test@example.invalid"]);
      git(root, ["config", "user.name", "UT test"]);
      git(root, ["add", "scripts/tracked.ts"]);
      git(root, ["commit", "--quiet", "-m", "fixture"]);

      expect(collectDistributionCandidatePaths(root)).toEqual(["scripts/tracked.ts"]);
      expect(readFileSync(join(root, "scripts", "untracked.ts"), "utf8")).toContain("workspace");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("falls back to the clean filesystem inventory when no Git HEAD exists", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-distribution-clean-tree-"));
    try {
      mkdirSync(join(root, "scripts"), { recursive: true });
      writeFileSync(join(root, "scripts", "pack-entry.js"), "console.log('ok')\n", "utf8");
      expect(collectDistributionCandidatePaths(root)).toEqual(["scripts/pack-entry.js"]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
