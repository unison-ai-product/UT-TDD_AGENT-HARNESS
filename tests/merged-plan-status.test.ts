import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { checkMergedPlanStatus } from "../src/doctor/index";
import { analyzeMergedPlanStatus, loadMergedPlanStatusInput } from "../src/lint/merged-plan-status";

// PO 指摘 2026-06-15: merge 済み generated artifact を持つのに owning PLAN が draft のまま
// 放置される V-model state 不整合 (PLAN-L7-53 の実例) を機械検出する gate の回帰。

describe("analyzeMergedPlanStatus", () => {
  it("flags an artifact-producing PLAN that is draft but whose src is merged", () => {
    const r = analyzeMergedPlanStatus({
      plans: [{ planId: "PLAN-X", status: "draft", kind: "impl", mergedArtifacts: ["src/x.ts"] }],
    });
    expect(r.ok).toBe(false);
    expect(r.violations[0]?.planId).toBe("PLAN-X");
  });

  it("does not flag a confirmed/completed PLAN with merged artifacts", () => {
    const r = analyzeMergedPlanStatus({
      plans: [
        { planId: "PLAN-A", status: "confirmed", kind: "impl", mergedArtifacts: ["src/a.ts"] },
        { planId: "PLAN-B", status: "completed", kind: "add-impl", mergedArtifacts: ["src/b.ts"] },
      ],
    });
    expect(r.ok).toBe(true);
  });

  it("does not flag a draft PLAN whose src is NOT yet merged (genuinely in-progress)", () => {
    const r = analyzeMergedPlanStatus({
      plans: [{ planId: "PLAN-WIP", status: "draft", kind: "impl", mergedArtifacts: [] }],
    });
    expect(r.ok).toBe(true);
  });

  it("does not flag non-artifact kinds (design/poc) even if draft", () => {
    const r = analyzeMergedPlanStatus({
      plans: [{ planId: "PLAN-D", status: "draft", kind: "design", mergedArtifacts: ["src/d.ts"] }],
    });
    expect(r.ok).toBe(true);
  });

  it("flags add-impl and refactor kinds too (status-accuracy applies to all src-producers)", () => {
    const r = analyzeMergedPlanStatus({
      plans: [
        { planId: "PLAN-AI", status: "draft", kind: "add-impl", mergedArtifacts: ["src/ai.ts"] },
        { planId: "PLAN-RF", status: "draft", kind: "refactor", mergedArtifacts: ["src/rf.ts"] },
      ],
    });
    expect(r.ok).toBe(false);
    expect(r.violations.map((v) => v.planId)).toEqual(["PLAN-AI", "PLAN-RF"]);
  });

  it("does not flag an accepted PLAN with merged artifacts (terminal done state)", () => {
    const r = analyzeMergedPlanStatus({
      plans: [
        { planId: "PLAN-ACC", status: "accepted", kind: "impl", mergedArtifacts: ["src/acc.ts"] },
      ],
    });
    expect(r.ok).toBe(true);
  });
});

describe("loadMergedPlanStatusInput + checkMergedPlanStatus", () => {
  function writePlan(root: string, name: string, status: string, srcPath: string): void {
    writeFileSync(
      join(root, "docs", "plans", name),
      [
        "---",
        `plan_id: ${name.replace(/\.md$/, "")}`,
        `status: ${status}`,
        "kind: impl",
        "generates:",
        `  - artifact_path: ${srcPath}`,
        "    artifact_type: source_module",
        "---",
        "",
        "body",
        "",
      ].join("\n"),
      "utf8",
    );
  }

  it("detects a draft PLAN whose generated src exists on disk (merged)", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-merged-plan-"));
    try {
      mkdirSync(join(root, "docs", "plans"), { recursive: true });
      mkdirSync(join(root, "src"), { recursive: true });
      writeFileSync(join(root, "src", "merged.ts"), "export const x = 1;\n", "utf8");
      // draft PLAN with an existing (merged) src → violation
      writePlan(root, "PLAN-TEST-90-merged.md", "draft", "src/merged.ts");
      // draft PLAN whose src does NOT exist → no violation (in-progress)
      writePlan(root, "PLAN-TEST-91-wip.md", "draft", "src/not-yet.ts");

      const result = checkMergedPlanStatus(root);
      expect(result.ok).toBe(false);
      expect(result.messages.join("\n")).toContain("PLAN-TEST-90-merged");
      expect(result.messages.join("\n")).not.toContain("PLAN-TEST-91-wip");

      const input = loadMergedPlanStatusInput(root);
      const merged = input.plans.find((p) => p.planId === "PLAN-TEST-90-merged");
      expect(merged?.mergedArtifacts).toContain("src/merged.ts");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("fails closed when repo root cannot be read", () => {
    const result = checkMergedPlanStatus(join(tmpdir(), "ut-tdd-merged-plan-nope-zzz"));
    expect(result.ok).toBe(false);
  });
});
