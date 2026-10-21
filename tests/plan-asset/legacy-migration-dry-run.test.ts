import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadRoleContractRegistry } from "../../src/plan-asset/adapters/role-contract-registry.ts";
import { REVIEWED_REKEY_DECISIONS } from "../../src/plan-asset/application/legacy-migration-decision-manifest.ts";
import {
  HeadTargetRegistry,
  LegacyMigrationDryRun,
  type MigrationDecisionPort,
  targetSlotFindings,
} from "../../src/plan-asset/application/legacy-migration-dry-run.ts";
import { headPlanDocCount } from "./head-plan-doc-count.ts";

describe("legacy migration dry-run", () => {
  it("U-PA-038: proves exact files and directory families against non-empty HEAD blobs", () => {
    const registry = HeadTargetRegistry.from([
      ["docs/process/forward/README.md", 10],
      ["docs/empty.md", 0],
    ]);
    expect(registry.hasNonEmpty("docs/process/forward/")).toBe(true);
    expect(registry.hasNonEmpty("docs/process/forward")).toBe(true);
    expect(registry.hasNonEmpty("docs/empty.md")).toBe(false);
    expect(registry.hasNonEmpty("docs/missing/")).toBe(false);
  });

  it("U-PA-039: re-verifies snapshot OID and content digest from the bound HEAD object", () => {
    const result = new LegacyMigrationDryRun().run(process.cwd());
    if (!("records" in result)) throw new Error(result.ruleId);
    const sample = result.records[0];
    const oid = git(["rev-parse", `${result.sourceCommit}:${sample.sourcePath}`]).trim();
    const bytes = execFileSync("git", ["-C", process.cwd(), "cat-file", "blob", oid]);
    expect(oid).toBe(sample.sourceBlobOid);
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(sample.sourceContentDigest);
  });

  it("U-PA-040: resolves every delegation slot to a non-empty role contract at HEAD", () => {
    const result = new LegacyMigrationDryRun().run(process.cwd());
    if (!("records" in result)) throw new Error(result.ruleId);
    const targets = result.records.flatMap((record) => record.delegationTargets);
    expect(targets.length).toBeGreaterThan(0);
    const contracts = loadRoleContractRegistry(process.cwd());
    expect(new Set(Object.keys(contracts.targets))).toEqual(
      new Set(["po", "tl", "qa", "aim", "uiux", "se", "docs"]),
    );
    expect(targets.every((target) => target.role in contracts.targets)).toBe(true);
    for (const contractRef of new Set(targets.map((target) => target.contractRef))) {
      expect(
        Number(git(["cat-file", "-s", `${result.sourceCommit}:${contractRef}`]).trim()),
      ).toBeGreaterThan(0);
    }
  });

  it("U-PA-041: resolves every authored target_slot against the HEAD document catalog", () => {
    expect(targetSlotFindings(process.cwd())).toEqual([]);
  });

  it("U-PA-034: emits an exactly-once HEAD-bound record for every inventory item", () => {
    const result = new LegacyMigrationDryRun().run(process.cwd());
    if (!("records" in result)) throw new Error(result.ruleId);
    expect(result.total).toBe(headPlanDocCount(process.cwd()));
    expect(result.emitted).toBe(result.total);
    expect(new Set(result.records.map((item) => item.legacyPlanId)).size).toBe(result.total);
    expect(new Set(result.records.map((item) => item.sourceCommit))).toEqual(
      new Set([result.sourceCommit]),
    );
    expect(result.reportDigest).toMatch(/^[a-f0-9]{64}$/);
  });

  it("U-PA-035: applies every explicit reviewed rekey decision", () => {
    const result = new LegacyMigrationDryRun().run(process.cwd());
    if (!("records" in result)) throw new Error(result.ruleId);
    const reviewedItems = REVIEWED_REKEY_DECISIONS.length;
    const reviewedGroups = new Set(REVIEWED_REKEY_DECISIONS.map(([, group]) => group)).size;
    expect(result.collisionGroups).toBe(reviewedGroups);
    expect(result.collisionItems).toBe(reviewedItems);
    expect(result.decisionCounts).toEqual({
      migrated: headPlanDocCount(process.cwd()) - reviewedItems,
      rekeyed: reviewedItems,
      rejected: 0,
      pending: 0,
    });
    expect(result.ok).toBe(true);
    expect(result.findings).toEqual([]);
  });

  it("U-PA-036: detects a decision manifest that targets another inventory identity", () => {
    const wrong: MigrationDecisionPort = {
      decide(item) {
        return {
          legacyPlanId: `${item.legacyPlanId}-wrong`,
          decision: "migrated",
          resolvedAlias: item.legacyPlanId,
          collisionGroup: null,
          lossFields: [],
          reason: "fixture",
          reviewPlanId: null,
        };
      },
    };
    const result = new LegacyMigrationDryRun(wrong).run(process.cwd());
    if (!("records" in result)) throw new Error(result.ruleId);
    expect(result.ok).toBe(false);
    expect(
      result.findings.some((item) => item.ruleId === "plan-migration-preview-id-mismatch"),
    ).toBe(true);
  });

  it("U-PA-037: is deterministic for the same HEAD and decision port", () => {
    const first = new LegacyMigrationDryRun().run(process.cwd());
    const second = new LegacyMigrationDryRun().run(process.cwd());
    expect(second).toEqual(first);
  });

  it.each([
    "confirmed",
    "completed",
    "accepted",
  ])("U-PAEXRET-003: ($0) PLAN の absent / hollow generates target は missing finding にしない", (status) => {
    const roots: string[] = [];
    try {
      const invalidPathRoot = createMigrationFixture(
        `plan_id: PLAN-L6-999-invalid-target
title: fixture
kind: add-impl
status: confirmed
generates:
  - artifact_path: " "`,
      );
      roots.push(invalidPathRoot);
      const missingRoleRoot = createMigrationFixture(
        `plan_id: PLAN-L6-999-missing-role
title: fixture
kind: add-impl
status: confirmed
generates: []
agent_slots:
  - role: po
    slot_label: primary`,
      );
      roots.push(missingRoleRoot);
      const absentAndHollowRoot = createMigrationFixture(
        `plan_id: PLAN-L6-999-absent-target
title: fixture
kind: add-impl
status: ${status}
generates:
  - artifact_path: docs/generated/not-created.md
  - artifact_path: docs/generated/empty.md`,
        {
          files: [["docs/generated/empty.md", ""]],
        },
      );
      roots.push(absentAndHollowRoot);

      const invalidPath = new LegacyMigrationDryRun().run(invalidPathRoot);
      if (!("records" in invalidPath)) throw new Error(invalidPath.ruleId);
      expect(invalidPath.records[0]?.findings.map((item) => item.ruleId)).toContain(
        "plan-generated-target-invalid",
      );

      const missingRole = new LegacyMigrationDryRun().run(missingRoleRoot);
      if (!("records" in missingRole)) throw new Error(missingRole.ruleId);
      expect(missingRole.records[0]?.findings.map((item) => item.ruleId)).toContain(
        "plan-delegation-design-missing",
      );

      const absentAndHollow = new LegacyMigrationDryRun().run(absentAndHollowRoot);
      if (!("records" in absentAndHollow)) throw new Error(absentAndHollow.ruleId);
      expect(absentAndHollow.records).toHaveLength(1);
      expect(absentAndHollow.findings.map((item) => item.ruleId)).toContain(
        "plan-migration-decision-manifest-mismatch",
      );
      expect(absentAndHollow.records[0].findings).toEqual([]);
    } finally {
      for (const root of roots) rmSync(root, { recursive: true, force: true });
    }
  });
});

function createMigrationFixture(
  planFrontmatter: string,
  options: { readonly files?: readonly (readonly [string, string])[] } = {},
): string {
  const root = mkdtempSync(join(tmpdir(), "ut-tdd-paexret-003-"));
  try {
    const governanceRoot = join(root, "docs/governance");
    mkdirSync(governanceRoot, { recursive: true });
    const catalogHeaders = [
      "doc_type_id",
      "layer",
      "sub_doc",
      "category",
      "requirement_class",
      "applicability",
      "default_status",
      "source_doc_family",
      "authoring_source_path",
      "projection_table",
      "profile_controlled",
      "skip_reason_required",
    ];
    writeFileSync(
      join(governanceRoot, "vmodel-document-catalog.md"),
      `| ${catalogHeaders.join(" | ")} |\n| ${catalogHeaders.map(() => "---").join(" | ")} |\n`,
      "utf8",
    );
    const ledgerHeaders = [
      "edge_id",
      "item_id",
      "項目名",
      "category_id",
      "source_ref",
      "source_digest",
      "target_status",
      "target_kind",
      "target_ref",
      "判断理由",
      "plan_id",
    ];
    writeFileSync(
      join(governanceRoot, "vmodel-item-target-ledger.md"),
      `| ${ledgerHeaders.join(" | ")} |\n| ${ledgerHeaders.map(() => "---").join(" | ")} |\n`,
      "utf8",
    );
    writeFileSync(
      join(root, "ut-tdd.project.json"),
      '{\n  "schema_version": "ut-tdd.project/v1",\n  "repository_identity": "fixture-owner/fixture-repo"\n}\n',
      "utf8",
    );
    writeFileSync(
      join(root, "docs/governance/vmodel-role-contracts.md"),
      [
        "# Fixture role contracts",
        "",
        "```yaml",
        "role_contracts:",
        "  po: docs/contracts/po.md",
        "  tl: docs/contracts/tl.md",
        "  qa: docs/contracts/qa.md",
        "  aim: docs/contracts/aim.md",
        "  uiux: docs/contracts/uiux.md",
        "  se: docs/contracts/se.md",
        "  docs: docs/contracts/docs.md",
        "```",
        "",
      ].join("\n"),
      "utf8",
    );
    const planId = /^plan_id: ([^\r\n]+)$/m.exec(planFrontmatter)?.[1];
    if (!planId) throw new Error("fixture plan_id is required");
    const planPath = join(root, "docs/plans", `${planId}.md`);
    mkdirSync(join(planPath, ".."), { recursive: true });
    writeFileSync(planPath, `---\n${planFrontmatter}\n---\nfixture body\n`, "utf8");
    for (const [path, contents] of options.files ?? []) {
      const destination = join(root, ...path.split("/"));
      mkdirSync(join(destination, ".."), { recursive: true });
      writeFileSync(destination, contents, "utf8");
    }

    fixtureGit(root, ["init", "--quiet"]);
    fixtureGit(root, ["config", "user.email", "test@example.invalid"]);
    fixtureGit(root, ["config", "user.name", "UT-TDD test"]);
    fixtureGit(root, [
      "remote",
      "add",
      "origin",
      "https://github.com/fixture-owner/fixture-repo.git",
    ]);
    fixtureGit(root, ["add", "--all"]);
    fixtureGit(root, ["commit", "--quiet", "-m", "legacy migration fixture"]);
    return root;
  } catch (error) {
    rmSync(root, { recursive: true, force: true });
    throw error;
  }
}

function fixtureGit(root: string, args: readonly string[]): string {
  return execFileSync("git", ["-C", root, ...args], { encoding: "utf8", windowsHide: true });
}

function git(args: readonly string[]): string {
  return execFileSync("git", ["-C", process.cwd(), ...args], { encoding: "utf8" });
}

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
