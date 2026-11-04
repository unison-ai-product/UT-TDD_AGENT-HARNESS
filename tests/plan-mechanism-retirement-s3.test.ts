import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  type CatalogInput,
  DocumentDispositionCatalog,
  sourceItemEdgeId,
} from "../src/disposition/domain/document-disposition-catalog.ts";
import {
  normalizeDocumentApplicability,
  validateDocumentDisposition,
} from "../src/document-disposition/domain/document-disposition.ts";
import { evaluateStaticGate } from "../src/gate/static.ts";
import { parseIssueUrl } from "../src/shared/issue-ref.ts";

const fixtureRoots: string[] = [];

function writeFixture(root: string, path: string, content: string): void {
  const absolute = join(root, path);
  mkdirSync(join(absolute, ".."), { recursive: true });
  writeFileSync(absolute, content, "utf8");
}

function json(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function consumerFixture(): string {
  const root = mkdtempSync(join(tmpdir(), "planret-s3-g14-"));
  fixtureRoots.push(root);
  writeFixture(
    root,
    "docs/design/L1-consumer/functional-requirements.md",
    "---\ndoc_type_id: DOC-L1-FUNCTIONAL-REQUIREMENTS\n---\n\n**FR-L1-01**\n**BR-01**\n",
  );
  writeFixture(
    root,
    "docs/design/L0-planning/charter.md",
    "---\nlayer: L0\ndoc_type_id: DOC-L0-CHARTER\n---\n\nConsumer charter.\n",
  );
  writeFixture(root, "docs/plans/PLAN-L0-01.md", "---\nplan_id: PLAN-L0-01\n---\n");
  writeFixture(root, "docs/plans/PLAN-CONSUMER-01.md", "---\nplan_id: PLAN-CONSUMER-01\n---\n");
  writeFixture(root, "docs/plans/PLAN-L7-1-x.md", "---\nplan_id: PLAN-L7-1-x\n---\n");
  const template = readFileSync(
    join(process.cwd(), "docs/templates/vmodel/L14-operational-test-design.md"),
    "utf8",
  );
  const content = template
    .replace("status: draft", "status: confirmed")
    .replace("plan: docs/plans/PLAN-<id>.md", "plan: docs/plans/PLAN-CONSUMER-01.md")
    .replace(
      "| <記入> | <記入> | <記入> | <記入> | <記入> |",
      "| OT-PLANRET-01 | OT | 日常運用の手順 | 失敗 0 | FR-L1-01 |\n| OT-PLANRET-02 | VALUE | 導入価値の検証 | KPI 達成 | BR-01 / PLAN-L0-01 |",
    );
  writeFixture(root, "docs/test-design/L14-operational-test-design.md", content);
  writeFixture(root, "tests/fixtures/planret/operational.txt", "passed\n");
  writeFixture(root, "tests/fixtures/planret/value.txt", "passed\n");
  writeFixture(root, "tests/fixtures/planret/command.txt", "passed\n");
  writeFixture(
    root,
    ".ut-tdd/evidence/g14-operational/artifacts/feedback.json",
    json({
      items: [
        { summary: "operator feedback", routed_to: "PLAN-CONSUMER-01" },
        { summary: "tool feedback", routed_to: "https://github.com/example/repo/issues/12" },
      ],
    }),
  );
  writeFixture(
    root,
    ".ut-tdd/evidence/g14-operational/ok.json",
    json({
      schema_version: "g14-operational-evidence-v1",
      gate: "G14",
      profile: "consumer-operational-minimum",
      plan_id: "PLAN-CONSUMER-01",
      selected_ot_ids: ["OT-PLANRET-01", "OT-PLANRET-02"],
      mandatory_ot_ids: ["OT-PLANRET-01", "OT-PLANRET-02"],
      deferred_ot_ids: [],
      commands: [
        {
          command_id: "cmd-planret",
          command: "npm test",
          runner: "node",
          scope: "consumer",
          exit_code: 0,
          output_digest: `sha256:${"a".repeat(64)}`,
          evidence_path: "tests/fixtures/planret/command.txt",
          ot_ids: ["OT-PLANRET-01", "OT-PLANRET-02"],
        },
      ],
      coverage: [
        {
          ot_id: "OT-PLANRET-01",
          status: "passed",
          evidence_paths: ["tests/fixtures/planret/operational.txt"],
          command_ids: ["cmd-planret"],
        },
        {
          ot_id: "OT-PLANRET-02",
          status: "passed",
          evidence_paths: ["tests/fixtures/planret/value.txt"],
          command_ids: ["cmd-planret"],
        },
      ],
      defer: [],
      exit_criteria: {
        all_mandatory_passed: true,
        failed_mandatory_count: 0,
        stale_defer_count: 0,
        doctor_check: "g14-operational-workflow",
      },
      artifacts: {
        operational_results: "tests/fixtures/planret/operational.txt",
        value_results: "tests/fixtures/planret/value.txt",
        improvement_feedback: ".ut-tdd/evidence/g14-operational/artifacts/feedback.json",
      },
    }),
  );
  return root;
}

function evaluateG14(root: string) {
  return evaluateStaticGate({ gate: "G14", repoRoot: root });
}

describe("PLAN mechanism retirement S3 Red", () => {
  it("precondition: consumer G14 fixture passes before candidate mutations", () => {
    const root = consumerFixture();
    const result = evaluateG14(root);

    expect(readFileSync(join(root, "docs/plans/PLAN-L7-1-x.md"), "utf8")).toContain(
      "plan_id: PLAN-L7-1-x",
    );
    expect(result.passed).toBe(true);
  });

  it.fails("CANDIDATE-U-PLANRET-001: accepts only the canonical GitHub Issue URL", () => {
    const cases = [
      {
        input: "https://github.com/o/r/issues/12",
        expected: { owner: "o", repo: "r", number: 12 },
      },
      { input: "https://github.com/o/r/issues/0", expected: null },
      { input: "https://github.com/o/r/issues/012", expected: null },
      { input: "https://github.com/o/r/pull/12", expected: null },
      { input: "https://github.com/o/r/issues/12/", expected: null },
      { input: "https://github.com/o/r/issues/12#x", expected: null },
      { input: " https://github.com/o/r/issues/12", expected: null },
      { input: "http://github.com/o/r/issues/12", expected: null },
      { input: "https://example.com/o/r/issues/12", expected: null },
      { input: "PLAN-L7-1-x", expected: null },
    ] as const;

    const actual = cases.map(({ input }) => parseIssueUrl(input));
    expect(actual).toEqual(cases.map(({ expected }) => expected));
  });

  it.fails("CANDIDATE-U-PLANRET-003: accepts Issue URLs but rejects PLAN routing", () => {
    const root = consumerFixture();
    const feedbackPath = join(root, ".ut-tdd/evidence/g14-operational/artifacts/feedback.json");
    const feedback = JSON.parse(readFileSync(feedbackPath, "utf8")) as {
      items: { routed_to: string }[];
    };
    expect(feedback.items[1]?.routed_to).toBe("https://github.com/example/repo/issues/12");
    feedback.items = feedback.items.map((item, index) =>
      index === 0 ? { ...item, routed_to: "PLAN-L7-1-x" } : item,
    );
    writeFileSync(feedbackPath, json(feedback), "utf8");

    const result = evaluateG14(root);
    const messages = result.messages.join("\n");

    expect(result.passed).toBe(false);
    expect(messages).toContain("PLAN-L7-1-x");
    expect(messages).not.toContain("does not exist");
  });

  it.fails("CANDIDATE-U-PLANRET-004(a): accepts a design-root L0 doc_type_id citation", () => {
    const root = consumerFixture();
    const slot = join(root, "docs/test-design/L14-operational-test-design.md");
    const content = readFileSync(slot, "utf8").replace(
      "BR-01 / PLAN-L0-01",
      "BR-01 / DOC-L0-CHARTER",
    );
    writeFileSync(slot, content, "utf8");

    const result = evaluateG14(root);

    expect(result.passed).toBe(true);
  });

  it.fails("CANDIDATE-U-PLANRET-004(b): does not resolve an L0 citation from docs/plans", () => {
    const root = consumerFixture();
    rmSync(join(root, "docs/plans/PLAN-L0-01.md"));
    const result = evaluateG14(root);

    expect(result.messages.join("\n")).toContain("trace target missing PLAN-L0-01");
    expect(result.messages.join("\n")).toContain("does not cite L0");
  });

  it.fails("CANDIDATE-U-PLANRET-004(c): VALUE error asks for a doc_type_id citation", () => {
    const root = consumerFixture();
    const slot = join(root, "docs/test-design/L14-operational-test-design.md");
    const content = readFileSync(slot, "utf8").replace("BR-01 / PLAN-L0-01", "BR-01");
    writeFileSync(slot, content, "utf8");

    const result = evaluateG14(root);

    expect(result.messages.join("\n")).toContain("does not cite L0");
    expect(result.messages.join("\n")).toContain("doc_type_id");
  });

  afterEach(() => {
    for (const root of fixtureRoots.splice(0)) rmSync(root, { recursive: true, force: true });
  });
  it.fails("CANDIDATE-U-PLANRET-005(a): normalizes Issue-backed defer", () => {
    const result = normalizeDocumentApplicability({
      kind: "defer",
      reason: "後続対応",
      reevaluationTrigger: "issue が解決したとき",
      issue: "https://github.com/example/repo/issues/12",
    } as unknown as Parameters<typeof normalizeDocumentApplicability>[0]);

    expect(result).toEqual({
      ok: true,
      value: {
        kind: "deferred",
        reason: "後続対応",
        reevaluationTrigger: "issue が解決したとき",
        issue: "https://github.com/example/repo/issues/12",
      },
    });
  });

  it.fails("CANDIDATE-U-PLANRET-005(b): requires issue, not legacy plan_id", () => {
    const result = validateDocumentDisposition({
      baselinePath: "docs/a.md",
      disposition: "retain",
      reason: "確認済み",
      targets: [],
      planIds: [],
      applicationStatus: "verified",
      applicability: {
        kind: "deferred",
        reason: "後続対応",
        reevaluationTrigger: "Issue 解決",
        planId: "PLAN-L7-1-x",
      },
    });

    expect(result).toEqual({ ok: false, missingFields: ["applicability.issue"] });
  });

  it.fails("CANDIDATE-U-PLANRET-005(c): updates require a target or Issue", () => {
    const result = validateDocumentDisposition({
      baselinePath: "docs/a.md",
      disposition: "update",
      reason: "内容を更新する",
      targets: [],
      planIds: [],
      applicationStatus: "pending",
      applicability: { kind: "applicable" },
    });

    expect(result).toEqual({ ok: false, missingFields: ["targets_or_issues"] });
  });

  it("CANDIDATE-U-PLANRET-005(d): preserves the digest of a recorded plan_ids row", () => {
    const sourceId = "ZIP-DOC-001";
    const itemId = "ITEM-PLANRET-005";
    const rowDigest = "a".repeat(64);
    const result = DocumentDispositionCatalog.create({
      manifestIdentity: { auditedOn: "2026-11-04", zipSha256: "b".repeat(64) },
      declaredCounts: {
        sources: 1,
        items: 1,
        categories: 1,
        metaSourceMappings: 0,
        sourceItemEdges: 1,
        sourceTargetEdges: 1,
        itemTargetEdges: 1,
      },
      sources: [
        {
          sourceId,
          ordinal: 1,
          sourceTitle: "fixture",
          disposition: "defer",
          targetRef: "PLAN-L6-01",
          reason: "legacy deferred target",
          rowDigest,
          manifestDigest: "c".repeat(64),
        },
      ],
      items: [
        {
          itemId,
          itemName: "fixture item",
          categoryId: "CAT-PLANRET",
          sourceStatus: "adopted",
          sourceRef: sourceId,
          sourceFile: "fixture.md",
          rowDigest,
        },
      ],
      categories: [{ categoryId: "CAT-PLANRET", categoryName: "fixture", rowDigest }],
      metaSourceMappings: [],
      sourceItemEdges: [
        {
          edgeId: sourceItemEdgeId(sourceId, itemId),
          sourceId,
          itemId,
          sourceStatus: "adopted",
          sourceFile: "fixture.md",
          rowDigest,
        },
      ],
      sourceTargetEdges: [
        {
          edgeId: "SOURCE-TARGET-1",
          sourceId,
          targetType: "plan_alias",
          targetRef: "PLAN-L6-01",
          disposition: "defer",
          rowDigest,
        },
      ],
      itemTargetEdges: [
        {
          edgeId: "ITEM-TARGET-1",
          itemId,
          targetStatus: "defer",
          reason: "legacy deferred target",
          sourceDigest: rowDigest,
          targetKind: "plan_alias",
          targetRef: "PLAN-L6-01",
          planId: "PLAN-L6-01",
        },
      ],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.digest).toBe(
        "045a2f42b4e095fb7936fbf8b622d86ea58481ae65fd05082326283d9848c519",
      );
      expect(result.value.traceSource(sourceId)?.itemTargets[0]?.planId).toBe("PLAN-L6-01");
    }
  });

  it.fails("CANDIDATE-U-PLANRET-005(e): rejects plan_alias as an unknown target kind", () => {
    const input: CatalogInput = {
      manifestIdentity: { auditedOn: "2026-11-04", zipSha256: "a".repeat(64) },
      declaredCounts: {
        sources: 0,
        items: 0,
        categories: 0,
        metaSourceMappings: 0,
        sourceItemEdges: 0,
        sourceTargetEdges: 0,
        itemTargetEdges: 1,
      },
      sources: [],
      items: [],
      categories: [],
      metaSourceMappings: [],
      sourceItemEdges: [],
      sourceTargetEdges: [],
      itemTargetEdges: [
        {
          edgeId: "EDGE-1",
          itemId: "ITEM-1",
          targetStatus: "adopt",
          reason: "既存記録",
          sourceDigest: "b".repeat(64),
          targetKind: "plan_alias",
          targetRef: "PLAN-L7-1-x",
        } as CatalogInput["itemTargetEdges"][number],
      ],
    };

    const result = DocumentDispositionCatalog.create(input);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          ruleId: "catalog-authoring-enum-invalid",
          subjectId: "EDGE-1",
        }),
      );
    }
  });
});
