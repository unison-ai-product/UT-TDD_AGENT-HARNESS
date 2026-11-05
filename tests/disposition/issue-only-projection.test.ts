import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { GitAuthoringProvenance } from "../../src/disposition/adapters/git-authoring-provenance.ts";
import { parseStrictMarkdownTable } from "../../src/disposition/adapters/strict-markdown-table.ts";
import { loadTrackedCatalogInput } from "../../src/disposition/adapters/tracked-vmodel-loader.ts";
import { openHarnessDb } from "../../src/state-db/index.ts";
import { migrate } from "../../src/state-db/migration.ts";
import { projectVmodelAuthoring } from "../../src/state-db/vmodel-projections.ts";
import { headSnapshotRoot } from "../support/workspace-roots.ts";

const issueOnlyCatalogPaths = [
  "docs/governance/vmodel-source-manifest.md",
  "docs/governance/vmodel-document-disposition-catalog.md",
  "docs/governance/vmodel-semantic-item-catalog.md",
  "docs/governance/vmodel-source-target-edges.md",
  "docs/governance/vmodel-item-target-ledger.md",
] as const;

const issueOnlyTargetHeaders = [
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
  "issue",
] as const;

let issueOnlyFixtureRoot: string;

beforeAll(() => {
  issueOnlyFixtureRoot = createIssueOnlyFixture();
});

afterAll(() => {
  rmSync(issueOnlyFixtureRoot, { recursive: true, force: true });
});

describe("CANDIDATE-U-DISPPTR-001 issue-only projection", () => {
  it("precondition: issue-only ledger has 163 complete authored target rows", () => {
    const rows = authoredIssueOnlyTargetRows(issueOnlyFixtureRoot);
    expect(rows).toHaveLength(163);
    expect(new Set(rows.map((row) => row.edge_id)).size).toBe(163);
    expect(new Set(rows.map((row) => row.item_id)).size).toBe(163);
    expect(rows.every((row) => row.target_status === "pending_review")).toBe(true);
    expect(rows.every((row) => row.issue === null)).toBe(true);
    expect(
      rows.every(
        (row) =>
          row.edge_id.length > 0 &&
          row.item_id.length > 0 &&
          row.reason.length > 0 &&
          row.source_digest.length > 0,
      ),
    ).toBe(true);
    const normalizedTempDirectory = resolve(tmpdir());
    const normalizedFixtureRoot = resolve(issueOnlyFixtureRoot);
    const fixtureRelativePath = relative(normalizedTempDirectory, normalizedFixtureRoot);
    expect(fixtureRelativePath).not.toBe("");
    expect(fixtureRelativePath).not.toBe("..");
    expect(fixtureRelativePath.startsWith(`..${sep}`)).toBe(false);
    expect(isAbsolute(fixtureRelativePath)).toBe(false);
  });

  it("loader finding: current loader rejects the issue-only header", () => {
    const bundle = Object.fromEntries(
      issueOnlyCatalogPaths.map((catalogPath) => [
        catalogPath,
        readFileSync(join(issueOnlyFixtureRoot, catalogPath)),
      ]),
    );
    const receipts = new GitAuthoringProvenance(issueOnlyFixtureRoot).receipts(
      issueOnlyCatalogPaths,
    );
    expect(() => loadTrackedCatalogInput(bundle, receipts)).toThrow(
      JSON.stringify([
        {
          ruleId: "catalog-authoring-schema-invalid",
          subjectId: "docs/governance/vmodel-item-target-ledger.md",
          message: "table header missing",
        },
      ]),
    );
  });

  it.fails("projects every issue-only target column unchanged", () => {
    const db = openHarnessDb(":memory:");
    try {
      migrate(db);
      const expected = authoredIssueOnlyTargetRows(issueOnlyFixtureRoot);
      projectVmodelAuthoring(issueOnlyFixtureRoot, db);
      expect(
        Number(db.prepare("SELECT COUNT(*) AS count FROM vmodel_semantic_items").get()?.count ?? 0),
      ).toBe(163);
      expect(
        Number(
          db.prepare("SELECT COUNT(*) AS count FROM vmodel_item_target_edges").get()?.count ?? 0,
        ),
      ).toBe(163);
      const itemTargetColumns = db
        .prepare("PRAGMA table_info(vmodel_item_target_edges)")
        .all()
        .map((column) => column.name);
      expect(itemTargetColumns).toContain("issue");
      expect(itemTargetColumns).not.toContain("plan_id");
      expect(itemTargetColumns).not.toContain("design_path");
      const projectedTargets = db
        .prepare(
          `SELECT edge_id, item_id, target_status, target_kind, target_ref, issue, reason, source_digest
           FROM vmodel_item_target_edges ORDER BY edge_id`,
        )
        .all();
      expect(projectedTargets).toEqual(expected);
    } finally {
      db.close();
    }
  });
});

function authoredIssueOnlyTargetRows(rootDirectory: string) {
  const ledgerRelativePath = "docs/governance/vmodel-item-target-ledger.md";
  const parsed = parseStrictMarkdownTable(
    new TextEncoder().encode(readFileSync(join(rootDirectory, ledgerRelativePath), "utf8")),
    { subjectId: ledgerRelativePath, expectedHeaders: issueOnlyTargetHeaders, expectedRows: 163 },
  );
  if (!parsed.ok) throw new Error(JSON.stringify(parsed.findings));
  const optionalValue = (value: string) => (value === "—" ? null : value);
  return parsed.rows
    .map((row) => ({
      edge_id: row.edge_id,
      item_id: row.item_id,
      target_status: row.target_status,
      target_kind: optionalValue(row.target_kind),
      target_ref: optionalValue(row.target_ref),
      issue: optionalValue(row.issue),
      reason: row.判断理由,
      source_digest: row.source_digest,
    }))
    .sort((left, right) => left.edge_id.localeCompare(right.edge_id));
}

function createIssueOnlyFixture(): string {
  const snapshotRoot = headSnapshotRoot();
  const fixtureRoot = mkdtempSync(join(tmpdir(), "ut-1375-issue-only-projection-"));
  try {
    for (const catalogPath of issueOnlyCatalogPaths) {
      const fixtureFile = join(fixtureRoot, catalogPath);
      mkdirSync(dirname(fixtureFile), { recursive: true });
      copyFileSync(join(snapshotRoot, catalogPath), fixtureFile);
    }
    const issueOnlyLedgerFile = join(fixtureRoot, "docs/governance/vmodel-item-target-ledger.md");
    const originalLedger = readFileSync(issueOnlyLedgerFile, "utf8");
    const issueOnlyLedger = originalLedger.replace(
      /\|\s*判断理由\s*\|\s*plan_id\s*\|/,
      "| 判断理由 | issue |",
    );
    if (issueOnlyLedger === originalLedger) throw new Error("fixture plan_id header not found");
    writeFileSync(issueOnlyLedgerFile, issueOnlyLedger, "utf8");
    execFileSync("git", ["init", "--quiet"], { cwd: fixtureRoot, stdio: "ignore" });
    execFileSync("git", ["add", "--", "docs"], { cwd: fixtureRoot, stdio: "ignore" });
    execFileSync(
      "git",
      [
        "-c",
        "user.name=UT-TDD test",
        "-c",
        "user.email=ut-tdd-test@example.invalid",
        "-c",
        "commit.gpgsign=false",
        "commit",
        "-m",
        "issue-only projection fixture",
      ],
      { cwd: fixtureRoot, stdio: "ignore" },
    );
    return fixtureRoot;
  } catch (error) {
    rmSync(fixtureRoot, { recursive: true, force: true });
    throw error;
  }
}
