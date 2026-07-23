import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { analyzeMergedPlanStatus, loadMergedPlanStatusInput } from "../src/lint/merged-plan-status";
import {
  classifyTargetArtifacts,
  resolveMergedPlanTargetEvidence,
  selectCanonicalMergedTarget,
} from "../src/lint/merged-plan-target-evidence";

describe("merged-plan canonical target evidence", () => {
  it("selects the remote default branch instead of the immediate stacked PR base", () => {
    const evidence = selectCanonicalMergedTarget({
      candidates: [
        { ref: "origin/main", source: "remote_default", exists: true, sha: "a".repeat(40) },
        { ref: "main", source: "local_main", exists: true, sha: "a".repeat(40) },
      ],
      subjectHeadSha: "c".repeat(40),
      immediateBaseRef: "work/parent",
      immediateBaseSha: "b".repeat(40),
      mergeBaseSha: "a".repeat(40),
    });

    expect(evidence).toMatchObject({
      decision: "canonical_target",
      targetRef: "origin/main",
      targetSha: "a".repeat(40),
      immediateBaseRef: "work/parent",
      immediateBaseSha: "b".repeat(40),
    });
  });

  it("classifies only paths present on the canonical target as landed", () => {
    expect(
      classifyTargetArtifacts(
        ["src/main-debt.ts", "src/stacked.ts"],
        new Set(["src/main-debt.ts"]),
      ),
    ).toEqual([
      { path: "src/main-debt.ts", decision: "landed_on_target" },
      { path: "src/stacked.ts", decision: "absent_from_target" },
    ]);
  });

  it("resolves origin/HEAD as canonical target and records stacked-base evidence", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-target-evidence-"));
    const eventPath = join(root, "event.json");
    const previousEvent = process.env.GITHUB_EVENT_PATH;
    try {
      git(root, ["init", "-b", "main"]);
      git(root, ["config", "user.email", "test@example.invalid"]);
      git(root, ["config", "user.name", "UT-TDD test"]);
      mkdirSync(join(root, "src"), { recursive: true });
      mkdirSync(join(root, "docs", "plans"), { recursive: true });
      writeFileSync(join(root, "src", "main.ts"), "export const main = true;\n", "utf8");
      writePlan(root, "PLAN-TEST-main-debt.md", "src/main.ts");
      git(root, ["add", "."]);
      git(root, ["commit", "-m", "main"]);
      const mainSha = gitText(root, ["rev-parse", "HEAD"]);
      git(root, ["remote", "add", "origin", root]);
      git(root, ["fetch", "origin", "main:refs/remotes/origin/main"]);
      git(root, ["symbolic-ref", "refs/remotes/origin/HEAD", "refs/remotes/origin/main"]);
      git(root, ["checkout", "-b", "work/parent"]);
      writeFileSync(join(root, "src", "parent.ts"), "export const parent = true;\n", "utf8");
      writePlan(root, "PLAN-TEST-stacked-parent.md", "src/parent.ts");
      git(root, ["add", "."]);
      git(root, ["commit", "-m", "parent"]);
      const parentSha = gitText(root, ["rev-parse", "HEAD"]);
      git(root, ["checkout", "-b", "work/child"]);
      writeFileSync(join(root, "src", "child.ts"), "export const child = true;\n", "utf8");
      git(root, ["add", "."]);
      git(root, ["commit", "-m", "child"]);
      const childSha = gitText(root, ["rev-parse", "HEAD"]);
      writeFileSync(
        eventPath,
        JSON.stringify({
          repository: { default_branch: "main" },
          pull_request: { base: { ref: "work/parent", sha: parentSha } },
        }),
        "utf8",
      );
      process.env.GITHUB_EVENT_PATH = eventPath;

      const evidence = resolveMergedPlanTargetEvidence(root);
      expect(evidence).toMatchObject({
        decision: "canonical_target",
        targetRef: "origin/main",
        targetSha: mainSha,
        subjectHeadSha: childSha,
        mergeBaseSha: mainSha,
        immediateBaseRef: "work/parent",
        immediateBaseSha: parentSha,
      });
      const input = loadMergedPlanStatusInput(root);
      expect(input.targetEvidence).toEqual(evidence);
      expect(
        input.plans.find((plan) => plan.planId === "PLAN-TEST-main-debt")?.mergedArtifacts,
      ).toEqual(["src/main.ts"]);
      expect(
        input.plans.find((plan) => plan.planId === "PLAN-TEST-stacked-parent")?.mergedArtifacts,
      ).toEqual([]);
      expect(
        input.plans.find((plan) => plan.planId === "PLAN-TEST-stacked-parent")?.artifactDecisions,
      ).toEqual([{ path: "src/parent.ts", decision: "absent_from_target" }]);
      expect(
        analyzeMergedPlanStatus(input).violations.map((violation) => violation.planId),
      ).toEqual(["PLAN-TEST-main-debt"]);
    } finally {
      if (previousEvent === undefined) delete process.env.GITHUB_EVENT_PATH;
      else process.env.GITHUB_EVENT_PATH = previousEvent;
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("fails closed in a Git repository when no canonical target can be verified", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-target-missing-"));
    try {
      git(root, ["init", "-b", "work/only"]);
      git(root, ["config", "user.email", "test@example.invalid"]);
      git(root, ["config", "user.name", "UT-TDD test"]);
      mkdirSync(join(root, "src"), { recursive: true });
      mkdirSync(join(root, "docs", "plans"), { recursive: true });
      writeFileSync(join(root, "src", "only.ts"), "export const only = true;\n", "utf8");
      writePlan(root, "PLAN-TEST-no-target.md", "src/only.ts");
      git(root, ["add", "."]);
      git(root, ["commit", "-m", "unanchored"]);

      expect(resolveMergedPlanTargetEvidence(root).decision).toBe("no_verified_target");
      expect(() => loadMergedPlanStatusInput(root)).toThrow(
        "merged-plan canonical target could not be verified",
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("does not fall back to main when a known non-main default branch is unavailable", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-target-non-main-"));
    const eventPath = join(root, "event.json");
    const previousEvent = process.env.GITHUB_EVENT_PATH;
    try {
      git(root, ["init", "-b", "main"]);
      git(root, ["config", "user.email", "test@example.invalid"]);
      git(root, ["config", "user.name", "UT-TDD test"]);
      writeFileSync(join(root, "base.txt"), "base\n", "utf8");
      git(root, ["add", "."]);
      git(root, ["commit", "-m", "main"]);
      writeFileSync(eventPath, JSON.stringify({ repository: { default_branch: "trunk" } }), "utf8");
      process.env.GITHUB_EVENT_PATH = eventPath;

      expect(resolveMergedPlanTargetEvidence(root).decision).toBe("no_verified_target");
    } finally {
      if (previousEvent === undefined) delete process.env.GITHUB_EVENT_PATH;
      else process.env.GITHUB_EVENT_PATH = previousEvent;
      rmSync(root, { recursive: true, force: true });
    }
  });
});

function git(root: string, args: string[]): void {
  execFileSync("git", ["-C", root, ...args], { stdio: "pipe" });
}

function gitText(root: string, args: string[]): string {
  return execFileSync("git", ["-C", root, ...args], { encoding: "utf8" }).trim();
}

function writePlan(root: string, name: string, artifactPath: string): void {
  writeFileSync(
    join(root, "docs", "plans", name),
    [
      "---",
      `plan_id: ${name.replace(/\.md$/, "")}`,
      "title: target evidence fixture",
      "kind: impl",
      "layer: L7",
      "drive: agent",
      "status: draft",
      "generates:",
      `  - artifact_path: ${artifactPath}`,
      "    artifact_type: source_module",
      "dependencies:",
      "  parent: null",
      "  requires: []",
      "  blocks: []",
      "---",
      "",
      "fixture",
      "",
    ].join("\n"),
    "utf8",
  );
}
