import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadRelationGraphSourceSet } from "../src/graph/loader";
import {
  analyzeRelationImpact,
  collectRelationGraphProjection,
  exportRelationDiagram,
} from "../src/lint/relation-graph";

// PLAN-L7-32 §9 discharge: repo→RelationGraphSourceSet loader の結合テスト。
// tmp repo に PLAN(generates)+src+test(import)+design(pair_artifact)+test-design を置き、
// loader が plan→source(generates) / source→test(covered-by) / design→test-design(pairs)
// の edge を生む source set を返すこと、純関数と結合して impact/export が動くことを検証する。
function buildRepo(root: string): void {
  mkdirSync(join(root, "docs", "plans"), { recursive: true });
  mkdirSync(join(root, "docs", "design", "harness"), { recursive: true });
  mkdirSync(join(root, "docs", "test-design", "harness"), { recursive: true });
  mkdirSync(join(root, "src", "widget"), { recursive: true });
  mkdirSync(join(root, "tests"), { recursive: true });

  writeFileSync(
    join(root, "docs", "plans", "PLAN-TEST-01-widget.md"),
    [
      "---",
      "plan_id: PLAN-TEST-01-widget",
      "status: confirmed",
      "kind: impl",
      "generates:",
      "  - artifact_path: src/widget/core.ts",
      "    artifact_type: source_module",
      "dependencies:",
      "  requires:",
      "    - FR-L1-99",
      "---",
      "",
      "## body references FR-L1-99",
      "",
    ].join("\n"),
    "utf8",
  );
  writeFileSync(join(root, "src", "widget", "core.ts"), "export const core = 1;\n", "utf8");
  writeFileSync(
    join(root, "tests", "core.test.ts"),
    'import { core } from "../src/widget/core";\nexport const t = core;\n',
    "utf8",
  );
  writeFileSync(
    join(root, "docs", "design", "harness", "widget-design.md"),
    [
      "---",
      "layer: L6",
      "status: confirmed",
      "pair_artifact: docs/test-design/harness/widget-test-design.md",
      "---",
      "",
      "design body",
      "",
    ].join("\n"),
    "utf8",
  );
  writeFileSync(
    join(root, "docs", "test-design", "harness", "widget-test-design.md"),
    ["---", "layer: L6", "status: confirmed", "---", "", "test design body", ""].join("\n"),
    "utf8",
  );
}

describe("loadRelationGraphSourceSet", () => {
  it("builds a source set with plan→source, source→test, design→test-design edges", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-graph-loader-"));
    try {
      buildRepo(root);
      const sourceSet = loadRelationGraphSourceSet(root);

      // plan generates src + FR requirement ref
      const plan = sourceSet.plans?.find((p) => p.id === "PLAN-TEST-01-widget");
      expect(plan?.generates).toContain("src/widget/core.ts");
      expect(plan?.requirements).toContain("FR-L1-99");

      // source→test covered-by (import 解析)
      const src = sourceSet.sourceFiles?.find((s) => s.path === "src/widget/core.ts");
      expect(src?.tests).toContain("tests/core.test.ts");

      // design→test-design pairs
      const design = sourceSet.designDocs?.find((d) => d.path.endsWith("widget-design.md"));
      expect(design?.pairs).toBe("docs/test-design/harness/widget-test-design.md");

      // projection + impact: changing the source surfaces its owning plan + sibling test
      const projection = collectRelationGraphProjection(sourceSet);
      const impact = analyzeRelationImpact({
        changedPaths: ["src/widget/core.ts"],
        projection,
      });
      expect(impact.changedNodes.map((n) => n.id)).toContain("source:src/widget/core.ts");
      expect(impact.impacted.map((n) => n.id)).toContain("plan:PLAN-TEST-01-widget");
      expect(impact.impacted.map((n) => n.id)).toContain("test:tests/core.test.ts");

      // export: mermaid is always emittable and contains the changed source node
      const diagram = exportRelationDiagram({ snapshot: projection, format: "mermaid" });
      expect(diagram.ok).toBe(true);
      expect(diagram.content).toContain("flowchart TD");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("is fail-open on an empty repo root (no throw, empty source set)", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-graph-loader-empty-"));
    try {
      const sourceSet = loadRelationGraphSourceSet(root);
      expect(sourceSet.sourceFiles ?? []).toEqual([]);
      expect(sourceSet.plans ?? []).toEqual([]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
