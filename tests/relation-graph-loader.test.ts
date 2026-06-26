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
  mkdirSync(join(root, "docs", "process", "modes"), { recursive: true });
  mkdirSync(join(root, "docs", "test-design", "harness"), { recursive: true });
  mkdirSync(join(root, ".claude", "agents"), { recursive: true });
  mkdirSync(join(root, ".ut-tdd", "evidence", "g8-integration"), { recursive: true });
  mkdirSync(join(root, ".ut-tdd", "review"), { recursive: true });
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
  writeFileSync(
    join(root, "docs", "process", "modes", "refactor.md"),
    [
      "---",
      "canonical: true",
      "process_doc: mode",
      "mode: Refactor",
      "kind: refactor",
      "layer: L7",
      "status: confirmed",
      "---",
      "",
      "process mode body",
      "",
    ].join("\n"),
    "utf8",
  );
  writeFileSync(
    join(root, ".claude", "agents", "refactor-scout.md"),
    ["---", "name: refactor-scout", "model: haiku", "---", "", "agent prompt body", ""].join("\n"),
    "utf8",
  );
  writeFileSync(
    join(root, ".ut-tdd", "review", "cross-review-l7-157.md"),
    ["# Cross review", "", "Read-only review task body.", ""].join("\n"),
    "utf8",
  );
  writeFileSync(
    join(root, ".ut-tdd", "evidence", "g8-integration", "test-manifest.json"),
    JSON.stringify(
      {
        schema_version: "g8-integration-evidence-v1",
        gate: "G8",
        profile: "fixture",
      },
      null,
      2,
    ),
    "utf8",
  );
  writeFileSync(
    join(root, ".editorconfig"),
    ["root = true", "", "[*]", "charset = utf-8", ""].join("\n"),
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

      const processMode = sourceSet.designDocs?.find(
        (d) => d.path === "docs/process/modes/refactor.md",
      );
      expect(processMode).toMatchObject({
        id: "docs/process/modes/refactor.md",
        path: "docs/process/modes/refactor.md",
      });
      const agentDoc = sourceSet.designDocs?.find(
        (d) => d.path === ".claude/agents/refactor-scout.md",
      );
      expect(agentDoc).toMatchObject({
        id: ".claude/agents/refactor-scout.md",
        path: ".claude/agents/refactor-scout.md",
      });
      const reviewDoc = sourceSet.designDocs?.find(
        (d) => d.path === ".ut-tdd/review/cross-review-l7-157.md",
      );
      expect(reviewDoc).toMatchObject({
        id: ".ut-tdd/review/cross-review-l7-157.md",
        path: ".ut-tdd/review/cross-review-l7-157.md",
      });
      const g8EvidenceDoc = sourceSet.designDocs?.find(
        (d) => d.path === ".ut-tdd/evidence/g8-integration/test-manifest.json",
      );
      expect(g8EvidenceDoc).toMatchObject({
        id: ".ut-tdd/evidence/g8-integration/test-manifest.json",
        path: ".ut-tdd/evidence/g8-integration/test-manifest.json",
      });
      const referenceDoc = sourceSet.designDocs?.find(
        (d) => d.path === "docs/reference/ai-agent-harness-directory-reference.md",
      );
      expect(referenceDoc).toMatchObject({
        id: "docs/reference/ai-agent-harness-directory-reference.md",
        path: "docs/reference/ai-agent-harness-directory-reference.md",
      });
      const governanceDoc = sourceSet.designDocs?.find(
        (d) => d.path === "docs/governance/repository-structure.md",
      );
      expect(governanceDoc).toMatchObject({
        id: "docs/governance/repository-structure.md",
        path: "docs/governance/repository-structure.md",
      });

      // projection + impact: changing the source surfaces its owning plan + sibling test
      const projection = collectRelationGraphProjection(sourceSet);
      const impact = analyzeRelationImpact({
        changedPaths: ["src/widget/core.ts"],
        projection,
      });
      expect(impact.changedNodes.map((n) => n.id)).toContain("source:src/widget/core.ts");
      expect(impact.impacted.map((n) => n.id)).toContain("plan:PLAN-TEST-01-widget");
      expect(impact.impacted.map((n) => n.id)).toContain("test:tests/core.test.ts");

      const processImpact = analyzeRelationImpact({
        changedPaths: ["docs/process/modes/refactor.md"],
        projection,
      });
      expect(processImpact.ok).toBe(true);
      expect(processImpact.changedNodes.map((n) => n.id)).toContain(
        "design:docs/process/modes/refactor.md",
      );
      expect(processImpact.findings.map((f) => f.code)).not.toContain("missing-projection");

      const agentImpact = analyzeRelationImpact({
        changedPaths: [".claude/agents/refactor-scout.md"],
        projection,
      });
      expect(agentImpact.ok).toBe(true);
      expect(agentImpact.changedNodes.map((n) => n.id)).toContain(
        "design:.claude/agents/refactor-scout.md",
      );
      expect(agentImpact.findings.map((f) => f.code)).not.toContain("missing-projection");

      const reviewImpact = analyzeRelationImpact({
        changedPaths: [".ut-tdd/review/cross-review-l7-157.md"],
        projection,
      });
      expect(reviewImpact.ok).toBe(true);
      expect(reviewImpact.changedNodes.map((n) => n.id)).toContain(
        "design:.ut-tdd/review/cross-review-l7-157.md",
      );
      expect(reviewImpact.findings.map((f) => f.code)).not.toContain("missing-projection");

      const g8EvidenceImpact = analyzeRelationImpact({
        changedPaths: [".ut-tdd/evidence/g8-integration/test-manifest.json"],
        projection,
      });
      expect(g8EvidenceImpact.ok).toBe(true);
      expect(g8EvidenceImpact.changedNodes.map((n) => n.id)).toContain(
        "design:.ut-tdd/evidence/g8-integration/test-manifest.json",
      );
      expect(g8EvidenceImpact.findings.map((f) => f.code)).not.toContain("missing-projection");

      const referenceImpact = analyzeRelationImpact({
        changedPaths: ["docs/reference/ai-agent-harness-directory-reference.md"],
        projection,
      });
      expect(referenceImpact.ok).toBe(true);
      expect(referenceImpact.changedNodes.map((n) => n.id)).toContain(
        "design:docs/reference/ai-agent-harness-directory-reference.md",
      );
      expect(referenceImpact.findings.map((f) => f.code)).not.toContain("missing-projection");

      const governanceImpact = analyzeRelationImpact({
        changedPaths: ["docs/governance/repository-structure.md"],
        projection,
      });
      expect(governanceImpact.ok).toBe(true);
      expect(governanceImpact.changedNodes.map((n) => n.id)).toContain(
        "design:docs/governance/repository-structure.md",
      );
      expect(governanceImpact.findings.map((f) => f.code)).not.toContain("missing-projection");

      const editorconfigImpact = analyzeRelationImpact({
        changedPaths: [".editorconfig"],
        projection,
      });
      expect(editorconfigImpact.ok).toBe(true);
      expect(editorconfigImpact.changedNodes.map((n) => n.id)).toContain("design:.editorconfig");
      expect(editorconfigImpact.findings.map((f) => f.code)).not.toContain("missing-projection");

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

  it("materializes a requirement node for every FR a plan derives from (no dangling derives-from)", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-graph-loader-req-"));
    try {
      buildRepo(root); // PLAN-TEST-01 derives-from FR-L1-99 (no FR registry doc in this tmp repo)
      const sourceSet = loadRelationGraphSourceSet(root);
      // requirement node must exist for the referenced FR even without a registry doc (union of refs)
      expect(sourceSet.requirements?.map((r) => r.id)).toContain("FR-L1-99");
      const projection = collectRelationGraphProjection(sourceSet);
      const result = analyzeRelationImpact({ changedPaths: [], projection });
      const staleEdges = result.findings.filter((f) => f.code === "stale-edge");
      expect(staleEdges.map((f) => f.message)).toEqual([]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

// PLAN-L7-142: real-repo regression fence for the relation-graph loader coverage gap.
// 合成 fixture ではなく実 loadRelationGraphSourceSet(process.cwd()) を通し、derives-from
// (plan→requirement) / pairs (design→test-design) / generates (plan→source) の端点 node が
// すべて実在し stale-edge == 0 であることを機械保証する (coverage≠substance、PLAN-L7-32 の
// loader が requirement node を一切 materialize しなかった回帰の再発防止)。
describe("relation graph real-repo loader (PLAN-L7-142 stale-edge fence)", () => {
  it("has zero stale-edge findings through the real loader and materializes requirement nodes", () => {
    const projection = collectRelationGraphProjection(loadRelationGraphSourceSet(process.cwd()));
    const result = analyzeRelationImpact({ changedPaths: [], projection });
    const staleEdges = result.findings.filter((f) => f.code === "stale-edge");
    // failure surfaces the dangling "from -[kind]-> to" edges directly.
    expect(staleEdges.map((f) => f.message)).toEqual([]);
    const requirementNodes = projection.nodes.filter((n) => n.kind === "requirement");
    expect(requirementNodes.length).toBeGreaterThan(0);
    const agentImpact = analyzeRelationImpact({
      changedPaths: [".claude/agents/refactor-scout.md"],
      projection,
    });
    expect(agentImpact.ok).toBe(true);
    expect(agentImpact.changedNodes.map((n) => n.id)).toContain(
      "design:.claude/agents/refactor-scout.md",
    );
    expect(agentImpact.findings.map((f) => f.code)).not.toContain("missing-projection");
    const reviewImpact = analyzeRelationImpact({
      changedPaths: [".ut-tdd/review/cross-review-l7-157.md"],
      projection,
    });
    expect(reviewImpact.ok).toBe(true);
    expect(reviewImpact.changedNodes.map((n) => n.id)).toContain(
      "design:.ut-tdd/review/cross-review-l7-157.md",
    );
    expect(reviewImpact.findings.map((f) => f.code)).not.toContain("missing-projection");
    const g8EvidenceImpact = analyzeRelationImpact({
      changedPaths: [".ut-tdd/evidence/g8-integration/20260626-it-module-state-minimum.json"],
      projection,
    });
    expect(g8EvidenceImpact.ok).toBe(true);
    expect(g8EvidenceImpact.changedNodes.map((n) => n.id)).toContain(
      "design:.ut-tdd/evidence/g8-integration/20260626-it-module-state-minimum.json",
    );
    expect(g8EvidenceImpact.findings.map((f) => f.code)).not.toContain("missing-projection");
    const referenceImpact = analyzeRelationImpact({
      changedPaths: ["docs/reference/ai-agent-harness-directory-reference.md"],
      projection,
    });
    expect(referenceImpact.ok).toBe(true);
    expect(referenceImpact.changedNodes.map((n) => n.id)).toContain(
      "design:docs/reference/ai-agent-harness-directory-reference.md",
    );
    expect(referenceImpact.findings.map((f) => f.code)).not.toContain("missing-projection");
    const governanceImpact = analyzeRelationImpact({
      changedPaths: ["docs/governance/repository-structure.md"],
      projection,
    });
    expect(governanceImpact.ok).toBe(true);
    expect(governanceImpact.changedNodes.map((n) => n.id)).toContain(
      "design:docs/governance/repository-structure.md",
    );
    expect(governanceImpact.findings.map((f) => f.code)).not.toContain("missing-projection");
    const editorconfigImpact = analyzeRelationImpact({
      changedPaths: [".editorconfig"],
      projection,
    });
    expect(editorconfigImpact.ok).toBe(true);
    expect(editorconfigImpact.changedNodes.map((n) => n.id)).toContain("design:.editorconfig");
    expect(editorconfigImpact.findings.map((f) => f.code)).not.toContain("missing-projection");
  });
});
