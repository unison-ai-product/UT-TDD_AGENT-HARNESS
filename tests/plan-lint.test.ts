import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  analyzePlanGovernance,
  analyzePlanSchedule,
  extractScheduleSection,
  lintPlanWithGate,
  planGovernanceMessages,
  planScheduleMessages,
} from "../src/plan/lint";

const compliant = `---
plan_id: PLAN-X
---
## §3 工程表 (Step + 進捗)

### Step 1: [直列] 設計対象の確定
直列理由: downstream_dependency

### Step 2: [並列] fixture 整備

### Step 3: [直列] review
直列理由: downstream_dependency
self / pmo-sonnet review

## §3.1 実装計画

- 情報源: src/plan/lint.ts
`;

function planDoc(
  id: string,
  overrides: {
    kind?: string;
    layer?: string;
    drive?: string;
    status?: string;
    subDoc?: string | null;
    dependencies?: string;
    parentDesign?: string;
    generates?: string;
    extra?: string;
  } = {},
) {
  const kind = overrides.kind ?? "design";
  const layer = overrides.layer ?? "L4";
  const drive = overrides.drive ?? "agent";
  const status = overrides.status ?? "completed";
  const subDoc = overrides.subDoc === undefined ? "function" : overrides.subDoc;
  const dependencies = overrides.dependencies ?? "  parent: null\n  requires: []\n  blocks: []";
  const parentDesign = overrides.parentDesign ? `parent_design: ${overrides.parentDesign}\n` : "";
  const subDocLine = subDoc ? `sub_doc: ${subDoc}\n` : "";
  const generates = overrides.generates ?? "[]";
  return {
    file: `docs/plans/${id}.md`,
    content: `---\nplan_id: ${id}\ntitle: "${id}"\nkind: ${kind}\nlayer: ${layer}\ndrive: ${drive}\nstatus: ${status}\n${subDocLine}${parentDesign}agent_slots:\n  - role: tl\n    slot_label: "TL - fixture"\ngenerates: ${generates}\ndependencies:\n${dependencies}\n${overrides.extra ?? ""}---\n\n## body\n`,
  };
}

function fixtureArtifactType(artifactPath: string): string {
  if (artifactPath.startsWith("docs/design/")) return "design_doc";
  if (artifactPath.startsWith("docs/test-design/")) return "test_design";
  if (artifactPath.startsWith("docs/plans/")) return "markdown_doc";
  if (artifactPath.endsWith(".ts") || artifactPath.endsWith(".tsx")) return "source_module";
  if (artifactPath.includes("/tests/") || artifactPath.startsWith("tests/")) return "test_code";
  return "markdown_doc";
}

function dbProgressPlanDoc(id: string, generatedPaths: string[]) {
  const generates = generatedPaths
    .map((artifactPath) => {
      const artifactType = fixtureArtifactType(artifactPath);
      return `  - artifact_path: ${artifactPath}\n    artifact_type: ${artifactType}`;
    })
    .join("\n");
  return {
    file: `docs/plans/${id}.md`,
    content: `---\nplan_id: ${id}\ntitle: "${id}: artifact_progress red/yellow/green DB projection"\nkind: add-impl\nlayer: L7\ndrive: db\nstatus: confirmed\nagent_slots:\n  - role: tl\n    slot_label: "TL - fixture"\ngenerates:\n${generates}\ndependencies:\n  parent: null\n  requires: []\n  blocks: []\n---\n\n## body\n\nAdd artifact_progress progress color semantics for red/yellow/green.\n`,
  };
}

function reverseFullbackPlanDoc(
  id: string,
  generatedPaths: string[],
  overrides: { updated?: string; status?: string; extra?: string } = {},
) {
  const generates =
    generatedPaths.length === 0
      ? "[]"
      : `\n${generatedPaths
          .map(
            (artifactPath) =>
              `  - artifact_path: ${artifactPath}\n    artifact_type: ${fixtureArtifactType(
                artifactPath,
              )}`,
          )
          .join("\n")}`;
  return {
    file: `docs/plans/${id}.md`,
    content: `---\nplan_id: ${id}\ntitle: "${id}: reverse fullback fixture"\nkind: reverse\nlayer: cross\nworkflow_phase: R4\nconfirmed_reverse_type: fullback\ndrive: fullstack\nstatus: ${overrides.status ?? "confirmed"}\ncreated: 2026-06-22\nupdated: ${overrides.updated ?? "2026-06-22"}\nowner: fixture\nforward_routing: L5\npromotion_strategy: reuse-as-is\nagent_slots:\n  - role: tl\n    slot_label: "TL - fixture"\ngenerates: ${generates}\ndependencies:\n  parent: null\n  requires: []\n  blocks: []\n${overrides.extra ?? ""}---\n\n## body\n`,
  };
}

const fullbackScope = `backprop_scope:
  - layer: requirements
    decision: updated
    evidence_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    reason: "Requirements record the fullback governance change."
  - layer: L4-basic-design
    decision: not_impacted
    reason: "The change does not alter external basic design behavior."
  - layer: L5-detailed-design
    decision: not_impacted
    reason: "The change does not alter detailed internal design behavior."
`;

describe("plan schedule lint (IMP-081)", () => {
  it("U-PLANSCH-001: §工程表 section を抽出する", () => {
    expect(extractScheduleSection(compliant)).toContain("Step 1");
  });

  it("U-PLANSCH-002: 準拠 PLAN は ok", () => {
    const r = analyzePlanSchedule([{ file: "PLAN-X.md", content: compliant }]);
    expect(r.violations).toEqual([]);
    expect(r.ok).toBe(true);
  });

  it("U-PLANSCH-003: [並列]/[直列] 欠落 Step は violation", () => {
    const content = compliant.replace(
      "### Step 1: [直列] 設計対象の確定",
      "### Step 1: 設計対象の確定",
    );
    const r = analyzePlanSchedule([{ file: "PLAN-X.md", content }]);
    expect(r.violations.some((v) => v.reason === "missing_mode")).toBe(true);
    expect(r.ok).toBe(false);
  });

  it("U-PLANSCH-004: [直列] の3条件理由欠落は violation", () => {
    const content = compliant.replace("直列理由: downstream_dependency", "直列理由: 手順上必要");
    const r = analyzePlanSchedule([{ file: "PLAN-X.md", content }]);
    expect(r.violations.some((v) => v.reason === "missing_serial_reason")).toBe(true);
  });

  it("U-PLANSCH-005: review Step 不在は violation", () => {
    const content = compliant.replace("### Step 3: [直列] review", "### Step 3: [直列] 完了確認");
    const r = analyzePlanSchedule([{ file: "PLAN-X.md", content }]);
    expect(r.violations.some((v) => v.reason === "missing_review_step")).toBe(true);
  });

  it("U-PLANSCH-006: §3.1 実装計画 不在は violation", () => {
    const content = compliant.replace("## §3.1 実装計画", "## §4 DoD");
    const r = analyzePlanSchedule([{ file: "PLAN-X.md", content }]);
    expect(r.violations.some((v) => v.reason === "missing_impl_plan")).toBe(true);
    expect(planScheduleMessages(r)[0]).toContain("violation");
  });

  it("U-PLANSCH-007: --gate G3-trace runs the trace lint", () => {
    const r = lintPlanWithGate(undefined, process.cwd(), "G3-trace");
    expect(r.ok).toBe(true);
    expect(r.messages[0]).toContain("g3-trace - OK");
  });

  it("U-PLANSCH-008: --gate G3-trace fails closed when required docs are missing", () => {
    const r = lintPlanWithGate(undefined, "__missing_repo_root__", "G3-trace");
    expect(r.ok).toBe(false);
    expect(r.messages[0]).toContain("required docs could not be read");
  });

  it("U-PLANSCH-009: --gate G1-trace runs the trace lint", () => {
    const r = lintPlanWithGate(undefined, process.cwd(), "G1-trace");
    expect(r.ok).toBe(true);
    expect(r.messages[0]).toContain("g1-trace - OK");
  });

  it("U-PLANSCH-010: unknown gate fails closed", () => {
    const r = lintPlanWithGate(undefined, process.cwd(), "NO-SUCH-GATE");
    expect(r.ok).toBe(false);
    expect(r.messages[0]).toContain("unsupported gate");
  });

  it("U-PLANGOV-001: valid frontmatter/cross-record fixture passes", () => {
    const docs = [
      planDoc("PLAN-L6-90-parent", {
        kind: "design",
        layer: "L6",
        status: "confirmed",
        subDoc: "function-spec",
      }),
      planDoc("PLAN-L7-90-child", {
        kind: "add-impl",
        layer: "L7",
        subDoc: null,
        dependencies: "  parent: docs/plans/PLAN-L6-90-parent.md\n  requires: []\n  blocks: []",
      }),
    ];

    const r = analyzePlanGovernance(docs);

    expect(r.ok).toBe(true);
    expect(planGovernanceMessages(r)[0]).toContain("OK");
  });

  it("U-PLANGOV-002: schema, sub_doc, duplicate, and skip-reason violations are reported", () => {
    const docs = [
      planDoc("PLAN-L4-91-invalid-schema", { extra: 'github_issue_id: "bad"\n' }),
      planDoc("PLAN-L4-92-missing-subdoc", { subDoc: null }),
      planDoc("PLAN-L4-93-bad-subdoc", { subDoc: "no-such-subdoc" }),
      planDoc("PLAN-L4-94-duplicate-a"),
      planDoc("PLAN-L4-95-duplicate-b"),
      planDoc("PLAN-L2-91-skip", {
        layer: "L2",
        subDoc: "screen-list",
        extra: "skip_sub_doc:\n  - sub_doc: wireframe\n    reason: no\n",
      }),
    ];

    const reasons = analyzePlanGovernance(docs).violations.map((v) => v.reason);

    expect(reasons).toContain("invalid_frontmatter");
    expect(reasons).toContain("missing_sub_doc");
    expect(reasons).toContain("invalid_sub_doc");
    expect(reasons).toContain("duplicate_layer_sub_doc");
    expect(reasons).toContain("skip_sub_doc_reason");
  });

  it("U-PLANGOV-006: L4 標準成果物カタログ拡張 (report/batch/notification/code-value) を plan lint が valid sub_doc として受理", () => {
    const newTypes = ["report", "batch", "notification", "code-value"];
    const docs = newTypes.map((t, i) => planDoc(`PLAN-L4-8${i}-${t}`, { layer: "L4", subDoc: t }));
    const reasons = analyzePlanGovernance(docs).violations.map((v) => v.reason);
    expect(reasons).not.toContain("invalid_sub_doc");

    // schema 単一正本由来 (重複コピー撤去) ゆえ L4 専用: L2 へ置くと invalid_sub_doc
    const l2 = analyzePlanGovernance([
      planDoc("PLAN-L2-89-report", { layer: "L2", subDoc: "report" }),
    ]);
    expect(l2.violations.map((v) => v.reason)).toContain("invalid_sub_doc");
  });

  it("U-PLANGOV-003: parent/requires/parent_design cross-record checks fail closed", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-plan-governance-"));
    try {
      const docs = [
        planDoc("PLAN-L6-91-parent", {
          kind: "design",
          layer: "L6",
          drive: "be",
          status: "draft",
          subDoc: "function-spec",
        }),
        planDoc("PLAN-L7-91-child", {
          kind: "add-impl",
          layer: "L7",
          drive: "agent",
          subDoc: null,
          parentDesign: "docs/design/missing.md",
          dependencies:
            "  parent: docs/plans/PLAN-L6-91-parent.md\n  requires:\n    - docs/plans/PLAN-L6-91-parent.md\n    - docs/plans/PLAN-L6-99-missing.md\n  blocks: []",
        }),
      ];

      const reasons = analyzePlanGovernance(docs, root).violations.map((v) => v.reason);

      expect(reasons).toContain("parent_drive_mismatch");
      expect(reasons).toContain("requires_not_ready");
      expect(reasons).toContain("requires_missing");
      expect(reasons).toContain("parent_design_missing");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("U-PLANGOV-004: artifact requires use filesystem existence instead of PLAN status", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-plan-governance-artifact-"));
    try {
      const artifact = join(root, "docs", "design", "harness", "L4-basic-design", "function.md");
      mkdirSync(join(root, "docs", "design", "harness", "L4-basic-design"), { recursive: true });
      writeFileSync(artifact, "---\nstatus: confirmed\n---\n", "utf8");
      const docs = [
        planDoc("PLAN-L4-97-artifact-requires", {
          dependencies:
            "  parent: null\n  requires:\n    - docs/design/harness/L4-basic-design/function.md\n  blocks: []",
        }),
      ];

      const r = analyzePlanGovernance(docs, root);

      expect(r.violations.filter((v) => v.reason === "requires_missing")).toEqual([]);
      expect(r.violations.filter((v) => v.reason === "requires_not_ready")).toEqual([]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("U-PLANGOV-005: --gate governance runs strict PLAN governance lint", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-plan-governance-cli-"));
    try {
      const plansDir = join(root, "docs", "plans");
      mkdirSync(plansDir, { recursive: true });
      const fixture = planDoc("PLAN-L4-96-governance-cli", { extra: 'github_issue_id: "bad"\n' });
      writeFileSync(join(plansDir, "PLAN-L4-96-governance-cli.md"), fixture.content, "utf8");

      const r = lintPlanWithGate(undefined, root, "governance");

      expect(r.ok).toBe(false);
      expect(r.messages[0]).toContain("plan-governance - violation");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("U-PLANGOV-007: progress color DB projection requires Reverse and upstream design backprop", () => {
    const docs = [
      dbProgressPlanDoc("PLAN-L7-98-progress-leak", [
        "docs/plans/PLAN-L7-98-progress-leak.md",
        "src/schema/harness-db.ts",
        "src/state-db/projection-writer.ts",
        "tests/projection-writer.test.ts",
      ]),
    ];

    const reasons = analyzePlanGovernance(docs).violations.map((v) => v.reason);

    expect(reasons).toContain("db_projection_backprop_missing");
  });

  it("U-PLANGOV-008: progress color DB projection passes with fullback and V-model coverage", () => {
    const docs = [
      dbProgressPlanDoc("PLAN-L7-98-progress-covered", [
        "docs/plans/PLAN-L7-98-progress-covered.md",
        "docs/plans/PLAN-REVERSE-98-progress-covered.md",
        "docs/governance/ut-tdd-agent-harness-requirements_v1.2.md",
        "docs/design/harness/L1-requirements/functional-requirements.md",
        "docs/design/harness/L1-requirements/screen-requirements.md",
        "docs/design/harness/L3-functional/functional-requirements.md",
        "docs/design/harness/L4-basic-design/function.md",
        "docs/design/harness/L5-detailed-design/physical-data.md",
        "docs/design/harness/L6-function-design/function-spec.md",
        "docs/design/harness/L6-function-design/fr-unit-coverage.md",
        "src/schema/harness-db.ts",
        "src/state-db/projection-writer.ts",
        "tests/projection-writer.test.ts",
      ]),
    ];

    const reasons = analyzePlanGovernance(docs).violations.map((v) => v.reason);

    expect(reasons).not.toContain("db_projection_backprop_missing");
  });

  it("U-PLANGOV-009: new R4 fullback requires generated design/governance/test-design backprop", () => {
    const docs = [
      reverseFullbackPlanDoc("PLAN-REVERSE-198-no-backprop", [
        "docs/plans/PLAN-REVERSE-198-no-backprop.md",
      ]),
    ];

    const reasons = analyzePlanGovernance(docs).violations.map((v) => v.reason);

    expect(reasons).toContain("reverse_fullback_backprop_missing");
  });

  it("U-PLANGOV-010: new R4 fullback passes when generated backprop artifact is present", () => {
    const docs = [
      reverseFullbackPlanDoc(
        "PLAN-REVERSE-198-with-backprop",
        [
          "docs/plans/PLAN-REVERSE-198-with-backprop.md",
          "docs/governance/ut-tdd-agent-harness-requirements_v1.2.md",
        ],
        { extra: fullbackScope },
      ),
    ];

    const reasons = analyzePlanGovernance(docs).violations.map((v) => v.reason);

    expect(reasons).not.toContain("reverse_fullback_backprop_missing");
    expect(reasons).not.toContain("reverse_fullback_scope_missing");
  });

  it("U-PLANGOV-011: legacy R4 fullback debt remains observable but is not retroactively hard-failed", () => {
    const docs = [
      reverseFullbackPlanDoc("PLAN-REVERSE-198-legacy", [], {
        updated: "2026-06-21",
      }),
    ];

    const reasons = analyzePlanGovernance(docs).violations.map((v) => v.reason);

    expect(reasons).not.toContain("reverse_fullback_backprop_missing");
  });

  it("U-PLANGOV-011b: new R4 fullback requires explicit requirements/L4/L5 backprop scope", () => {
    const docs = [
      reverseFullbackPlanDoc("PLAN-REVERSE-198-missing-scope", [
        "docs/plans/PLAN-REVERSE-198-missing-scope.md",
        "docs/governance/ut-tdd-agent-harness-requirements_v1.2.md",
      ]),
    ];

    const reasons = analyzePlanGovernance(docs).violations.map((v) => v.reason);

    expect(reasons).toContain("reverse_fullback_scope_missing");
  });

  it("U-PLANGOV-011c: updated backprop scope must cite a generated evidence path", () => {
    const docs = [
      reverseFullbackPlanDoc(
        "PLAN-REVERSE-198-stale-scope",
        [
          "docs/plans/PLAN-REVERSE-198-stale-scope.md",
          "docs/design/harness/L5-detailed-design/physical-data.md",
        ],
        { extra: fullbackScope },
      ),
    ];

    const violation = analyzePlanGovernance(docs).violations.find(
      (v) => v.reason === "reverse_fullback_scope_missing",
    );

    expect(violation?.detail).toContain("requirements:missing_generated_evidence");
  });

  it("U-PLANGOV-011d: new fullback body cannot claim an ungenerated backprop artifact path", () => {
    const doc = reverseFullbackPlanDoc(
      "PLAN-REVERSE-198-claimed-artifact",
      [
        "docs/plans/PLAN-REVERSE-198-claimed-artifact.md",
        "docs/governance/ut-tdd-agent-harness-requirements_v1.2.md",
      ],
      { extra: fullbackScope },
    );
    doc.content = `${doc.content}\n## R4 Routing\n\nBack-fill also updates docs/test-design/harness/L7-unit-test-design.md.\n`;

    const violation = analyzePlanGovernance([doc]).violations.find(
      (v) => v.reason === "reverse_fullback_claimed_artifact_missing",
    );

    expect(violation?.detail).toContain("docs/test-design/harness/L7-unit-test-design.md");
  });

  it("U-PLANGOV-012: docs/design generated artifacts must use design_doc", () => {
    const docs = [
      planDoc("PLAN-L7-99-design-type-mismatch", {
        kind: "add-impl",
        layer: "L7",
        subDoc: null,
        generates:
          "\n  - artifact_path: docs/design/harness/L4-basic-design/function.md\n    artifact_type: markdown_doc",
      }),
    ];

    const r = analyzePlanGovernance(docs);
    const mismatch = r.violations.find((v) => v.reason === "artifact_type_mismatch");

    expect(r.violations.map((v) => v.reason)).toContain("artifact_type_mismatch");
    expect(mismatch?.detail).toContain("design_doc");
  });

  it("U-PLANGOV-013: docs/test-design generated artifacts must use test_design", () => {
    const docs = [
      planDoc("PLAN-L7-99-test-design-type-mismatch", {
        kind: "add-impl",
        layer: "L7",
        subDoc: null,
        generates:
          "\n  - artifact_path: docs/test-design/harness/L7-unit-test-design.md\n    artifact_type: markdown_doc",
      }),
    ];

    const r = analyzePlanGovernance(docs);
    const mismatch = r.violations.find((v) => v.reason === "artifact_type_mismatch");

    expect(r.violations.map((v) => v.reason)).toContain("artifact_type_mismatch");
    expect(mismatch?.detail).toContain("test_design");
  });

  it("U-PLANGOV-014: docs/plans generated artifacts remain markdown_doc", () => {
    const docs = [
      planDoc("PLAN-L7-99-plan-type-mismatch", {
        kind: "add-impl",
        layer: "L7",
        subDoc: null,
        generates:
          "\n  - artifact_path: docs/plans/PLAN-L7-99-plan-type-mismatch.md\n    artifact_type: design_doc",
      }),
    ];

    const r = analyzePlanGovernance(docs);
    const mismatch = r.violations.find((v) => v.reason === "artifact_type_mismatch");

    expect(r.violations.map((v) => v.reason)).toContain("artifact_type_mismatch");
    expect(mismatch?.detail).toContain("markdown_doc");
  });

  it("U-PLANSCH-011: active gate docs do not point to stale trace/stub commands", () => {
    const activeDocs = [
      "docs/test-design/harness/L1-operational-test-design.md",
      "docs/design/harness/L3-functional/README.md",
      "docs/test-design/harness/L3-acceptance-test-design.md",
      "docs/design/harness/L3-functional/functional-requirements.md",
      "docs/design/harness/L3-functional/roadmap.md",
    ];
    const text = activeDocs.map((p) => readFileSync(join(process.cwd(), p), "utf8")).join("\n");
    expect(text).not.toContain("ut-tdd trace --g1");
    expect(text).not.toMatch(/G3-trace.*L7 carry/);
    expect(text).not.toMatch(/plan lint.*stub/);
  });
});
