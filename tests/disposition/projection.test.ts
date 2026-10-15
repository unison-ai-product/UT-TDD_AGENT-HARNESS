import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { GitAuthoringProvenance } from "../../src/disposition/adapters/git-authoring-provenance.ts";
import type { AuthoringProvenancePort } from "../../src/disposition/ports/authoring-provenance.ts";
import { gitBlobOid } from "../../src/disposition/domain/authoring-provenance.ts";
import { openHarnessDb } from "../../src/state-db/index.ts";
import { migrate } from "../../src/state-db/migration.ts";
import { projectVmodelAuthoring } from "../../src/state-db/vmodel-projections.ts";
import { rebuildHarnessDb } from "../../src/state-db/projection-writer.ts";

const tables = [
  "vmodel_sources",
  "vmodel_categories",
  "vmodel_meta_source_mappings",
  "vmodel_semantic_items",
  "vmodel_source_item_edges",
  "vmodel_source_target_edges",
  "vmodel_item_target_edges",
  "document_scale_profiles",
] as const;
const repoRoot = process.cwd();

describe("I-DISP-001 V-model projection", () => {
  it("materializes exact tracked identities and is a delete/rebuild fixed point", () => {
    const db = openHarnessDb(":memory:");
    try {
      migrate(db);
      seedPlan(db);
      projectVmodelAuthoring(repoRoot, db);
      expect(count(db, "vmodel_sources")).toBe(109);
      expect(count(db, "vmodel_categories")).toBe(21);
      expect(count(db, "vmodel_meta_source_mappings")).toBe(1);
      expect(count(db, "vmodel_semantic_items")).toBe(163);
      expect(count(db, "vmodel_item_target_edges")).toBe(163);
      expect(
        Number(
          db
            .prepare("SELECT COUNT(*) AS count FROM findings WHERE source = ?")
            .get("vmodel-item-target")?.count ?? 0,
        ),
      ).toBe(163);
      expect(count(db, "document_scale_profiles")).toBe(8);
      const first = snapshot(db);
      projectVmodelAuthoring(process.cwd(), db);
      expect(snapshot(db)).toEqual(first);
      clear(db);
      projectVmodelAuthoring(process.cwd(), db);
      expect(snapshot(db)).toEqual(first);
    } finally {
      db.close();
    }
  });

  it.fails("CANDIDATE-U-DISPPTR-001: projects all pending items to physical-data without a PLAN seed", () => {
    const db = openHarnessDb(":memory:");
    try {
      migrate(db);
      projectVmodelAuthoring(repoRoot, db);
      expect(count(db, "vmodel_semantic_items")).toBe(163);
      expect(count(db, "vmodel_item_target_edges")).toBe(163);
      const itemTargetColumns = db
        .prepare("PRAGMA table_info(vmodel_item_target_edges)")
        .all()
        .map((column) => column.name);
      expect(itemTargetColumns).toContain("design_path");
      const pendingTargets = db
        .prepare(
          `SELECT target_status, plan_id, design_path
             FROM vmodel_item_target_edges ORDER BY item_id`,
        )
        .all();
      expect(pendingTargets).toHaveLength(163);
      expect(pendingTargets.every((row) => row.target_status === "pending_review")).toBe(true);
      expect(pendingTargets.every((row) => row.plan_id === null)).toBe(true);
      expect(pendingTargets.map((row) => row.design_path)).toEqual(
        Array(163).fill("docs/design/harness/L5-detailed-design/physical-data.md"),
      );
    } finally {
      db.close();
    }
  });

  it.fails("CANDIDATE-U-DISPPTR-002: accepts defer with tracked design_path and NULL legacy plan_id", () => {
    const db = openHarnessDb(":memory:");
    try {
      migrate(db);
      seedPlan(db);
      const ledger = ledgerWithDesignPath({
        designPath: "docs/design/harness/L5-detailed-design/physical-data.md",
        planId: "—",
      });
      const deps = authoringDepsWithLedger(repoRoot, ledger);
      let projectionFailure: unknown;
      try {
        projectVmodelAuthoring(repoRoot, db, deps);
      } catch (error) {
        projectionFailure = error;
      }

      // The input path is a real Git-tracked regular file. The current fixed
      // header rejects it first; the old defer PLAN requirement is another
      // pre-path blocker after that parser gap is removed.
      expect(projectionFailure).toBeUndefined();
      expect(
        db
          .prepare("SELECT target_status, plan_id, design_path FROM vmodel_item_target_edges WHERE edge_id = ?")
          .get("ITEM-TARGET-KIKAKU"),
      ).toMatchObject({
        target_status: "defer",
        plan_id: null,
        design_path: "docs/design/harness/L5-detailed-design/physical-data.md",
      });
    } finally {
      db.close();
    }
  });

  it.fails("CANDIDATE-U-DISPPTR-003: after a valid path baseline, rejects independent invalid design_path values", () => {
    const tempRoot = createDocsGitFixture({
      ensureTracked: "docs/design/harness/L5-detailed-design/missing-physical-data.md",
    });
    rmSync(join(tempRoot, "docs/design/harness/L5-detailed-design/missing-physical-data.md"));
    const db = openHarnessDb(":memory:");
    try {
      migrate(db);
      seedPlan(db);
      const validLedger = ledgerWithDesignPath({
        designPath: "docs/design/harness/L5-detailed-design/physical-data.md",
        planId: "PLAN-L7-417-source-disposition-profile-projection",
      });
      let baselineFailure: unknown;
      try {
        projectVmodelAuthoring(tempRoot, db, authoringDepsWithLedger(tempRoot, validLedger));
      } catch (error) {
        baselineFailure = error;
      }
      // Keep the negative variants behind a valid real-projector baseline. The
      // current Red stops here at the unsupported design_path header.
      expect(baselineFailure).toBeUndefined();
      const invalidPaths = [
        "docs/design/harness/L5-detailed-design/missing-physical-data.md",
        "",
        "physical-data.md",
        "C:/docs/design/harness/L5-detailed-design/physical-data.md",
        "docs/design/harness/../harness/L5-detailed-design/physical-data.md",
        "docs\\design\\harness\\L5-detailed-design\\physical-data.md",
        "docs/design/harness/L5-detailed-design/cafe\u0301.md",
        "docs/design/harness/L5-detailed-design/../L5-detailed-design/physical-data.md",
        "docs/governance/README.md",
      ];

      for (const designPath of invalidPaths) {
        const invalidLedger = ledgerWithDesignPath({
          designPath,
          planId: "PLAN-L7-417-source-disposition-profile-projection",
        });
        let projectionFailure: unknown;
        try {
          projectVmodelAuthoring(tempRoot, db, authoringDepsWithLedger(tempRoot, invalidLedger));
        } catch (error) {
          projectionFailure = error;
        }
        expect(projectionFailure, `design_path=${JSON.stringify(designPath)}`).toBeInstanceOf(Error);
      }
    } finally {
      db.close();
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  describe("CANDIDATE-U-DISPPTR-007 rebuild boundary", () => {
    const targetPath = "docs/design/harness/L0-planning/charter.md";
    let tempRoot: string;

    beforeAll(() => {
      tempRoot = createDocsGitFixture({ ensureTracked: targetPath });
    });

    afterAll(() => {
      rmSync(tempRoot, { recursive: true, force: true });
    });

    it("rebuilds the normal fixture through V-model and spec-IR projections", () => {
      const db = openHarnessDb(":memory:");
      try {
        const result = rebuildFixture(tempRoot, db);
        expect(result.ok).toBe(true);
        expect(
          db
            .prepare("SELECT authoring_source_path, projection_table FROM document_catalog_entries WHERE doc_type_id = ?")
            .get("DOC-L0-CHARTER"),
        ).toMatchObject({
          authoring_source_path: targetPath,
          projection_table: "spec_defs",
        });
        expect(
          db
            .prepare("SELECT edge_id, target_type, target_ref FROM vmodel_source_target_edges WHERE edge_id IN (?, ?) ORDER BY edge_id")
            .all("EDGE-001", "EDGE-071"),
        ).toEqual([
          { edge_id: "EDGE-001", target_type: "artifact_path", target_ref: targetPath },
          { edge_id: "EDGE-071", target_type: "artifact_path", target_ref: targetPath },
        ]);
        expect(count(db, "spec_defs")).toBeGreaterThan(0);
      } finally {
        db.close();
      }
    });

    it.fails("rejects a tracked charter target whose physical entity is missing and preserves committed projections", () => {
      const db = openHarnessDb(":memory:");
      try {
        const baseline = rebuildFixture(tempRoot, db);
        expect(baseline.ok).toBe(true);
        const before = rebuildProjectionSnapshot(db);
        rmSync(join(tempRoot, targetPath));

        let rebuildFailure: unknown;
        try {
          // No test-owned transaction: the real rebuild must reject inside its
          // projection transaction and preserve the earlier committed snapshot.
          rebuildFixture(tempRoot, db);
        } catch (error) {
          rebuildFailure = error;
        }

        expect(rebuildFailure).toBeInstanceOf(Error);
        expect(rebuildProjectionSnapshot(db)).toEqual(before);
      } finally {
        db.close();
      }
    });
  });

  it("rolls back deletion when tracked provenance is tampered", () => {
    const db = openHarnessDb(":memory:");
    try {
      migrate(db);
      seedPlan(db);
      projectVmodelAuthoring(process.cwd(), db);
      const before = snapshot(db);
      const provenance = new GitAuthoringProvenance(process.cwd());
      let projectionFailure: unknown;
      db.exec("BEGIN IMMEDIATE");
      try {
        clear(db);
        projectVmodelAuthoring(process.cwd(), db, {
          provenance,
          read: (path) =>
            path.endsWith("vmodel-source-manifest.md")
              ? new TextEncoder().encode("tampered")
              : readFileSync(path),
        });
      } catch (error) {
        projectionFailure = error;
      } finally {
        db.exec("ROLLBACK");
      }
      expect(projectionFailure).toBeInstanceOf(Error);
      expect(String(projectionFailure)).toContain("catalog-provenance-invalid");
      expect(snapshot(db)).toEqual(before);
    } finally {
      db.close();
    }
  });
});

function seedPlan(db: ReturnType<typeof openHarnessDb>): void {
  db.prepare("INSERT INTO plan_registry (plan_id) VALUES (?)").run(
    "PLAN-L7-417-source-disposition-profile-projection",
  );
}

function count(db: ReturnType<typeof openHarnessDb>, table: string): number {
  return Number(db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get()?.count ?? 0);
}

function snapshot(db: ReturnType<typeof openHarnessDb>) {
  return {
    ...Object.fromEntries(
      tables.map((table) => [table, db.prepare(`SELECT * FROM ${table} ORDER BY 1`).all()]),
    ),
    findings: db
      .prepare("SELECT * FROM findings WHERE source = ? ORDER BY finding_id")
      .all("vmodel-item-target"),
  };
}

function rebuildProjectionSnapshot(db: ReturnType<typeof openHarnessDb>) {
  const projectionTables = [...tables, "document_catalog_entries", "spec_defs"];
  return Object.fromEntries(
    projectionTables.map((table) => [table, db.prepare(`SELECT * FROM ${table} ORDER BY 1`).all()]),
  );
}

function rebuildFixture(root: string, db: ReturnType<typeof openHarnessDb>) {
  return rebuildHarnessDb({
    repoRoot: root,
    db,
    skipTokenTelemetry: true,
    relationGraph: { nodes: [], edges: [], verificationProfiles: [], findings: [] },
    documentExports: {
      document_export_runs: [],
      document_export_datasets: [],
      document_export_artifacts: [],
      findings: [],
      actionsTaken: [],
      ok: true,
    },
  });
}

function clear(db: ReturnType<typeof openHarnessDb>): void {
  for (const table of [...tables].reverse()) db.exec(`DELETE FROM ${table}`);
  db.prepare("DELETE FROM findings WHERE source = ?").run("vmodel-item-target");
}

function ledgerWithDesignPath(input: { designPath: string; planId: string }): string {
  const lines = readFileSync(join(repoRoot, "docs/governance/vmodel-item-target-ledger.md"), "utf8")
    .split(/\r?\n/);
  let header: string[] | undefined;
  let inItemTable = false;
  const result = lines.map((line) => {
    if (!inItemTable && line.startsWith("| `edge_id` | `item_id` |")) {
      inItemTable = true;
      header = line
        .split("|")
        .slice(1, -1)
        .map((cell) => cell.trim().replace(/^`|`$/g, ""));
      return `${line.slice(0, -1)} \`design_path\` |`;
    }
    if (inItemTable && !line.startsWith("|")) inItemTable = false;
    if (!inItemTable || !line.startsWith("|")) return line;
    if (/^\|\s*[-:| ]+\|\s*$/.test(line)) return `${line.slice(0, -1)}---|`;

    const columns = [...(header ?? []), "design_path"];
    const values = line.split("|").slice(1, -1).map((cell) => cell.trim());
    const cells = Object.fromEntries((header ?? []).map((key, index) => [key, values[index] ?? ""]));
    if (cells.edge_id === "`ITEM-TARGET-KIKAKU`") {
      cells.target_status = "`defer`";
      cells.target_kind = "`plan_alias`";
      cells.target_ref = "`PLAN-L7-417-source-disposition-profile-projection`";
      cells["判断理由"] = "valid design_path defer fixture";
      cells.plan_id = input.planId === "—" ? "—" : `\`${input.planId}\``;
      values[values.length] = input.designPath ? `\`${input.designPath}\`` : "";
      for (const [key, value] of Object.entries(cells)) {
        const index = columns.indexOf(key);
        if (index >= 0) values[index] = value;
      }
    } else {
      values.push("—");
    }
    return `| ${columns.map((key, index) => values[index] ?? "").join(" | ")} |`;
  });
  return result.join("\n");
}

function authoringDepsWithLedger(
  root: string,
  ledger: string,
): Parameters<typeof projectVmodelAuthoring>[2] {
  const ledgerPath = "docs/governance/vmodel-item-target-ledger.md";
  const ledgerBytes = new TextEncoder().encode(ledger);
  const provenance = new GitAuthoringProvenance(root);
  const digest = createHash("sha256").update(ledgerBytes).digest("hex");
  const receipts: AuthoringProvenancePort = {
    receipts: (paths) =>
      provenance.receipts(paths).map((receipt) =>
        receipt.path === ledgerPath
          ? {
              ...receipt,
              blobOid: gitBlobOid(ledgerBytes),
              contentDigest: digest,
            }
          : receipt,
      ),
  };
  return {
    read: (path) => (path === ledgerPath ? ledgerBytes : readFileSync(join(root, path))),
    provenance: receipts,
  };
}

function createDocsGitFixture(input: { ensureTracked: string }): string {
  const root = mkdtempSync(join(tmpdir(), "ut-t1-disposition-target-fixture-"));
  cpSync(join(repoRoot, "docs"), join(root, "docs"), { recursive: true });
  const extraPath = join(root, input.ensureTracked);
  if (!existsSync(extraPath)) {
    // Small missing-file fixtures are added to the Git index before the
    // worktree entry is removed by the calling test.
    mkdirSync(dirname(extraPath), { recursive: true });
    writeFileSync(extraPath, "tracked fixture path\n", "utf8");
  }
  execFileSync("git", ["init", "--quiet"], { cwd: root, stdio: "ignore" });
  execFileSync("git", ["-c", "core.autocrlf=false", "add", "docs"], { cwd: root, stdio: "ignore" });
  execFileSync(
    "git",
    ["-c", "user.name=UT-TDD test", "-c", "user.email=ut-tdd-test@example.invalid", "-c", "commit.gpgsign=false", "commit", "-m", "test fixture"],
    { cwd: root, stdio: "ignore" },
  );
  return root;
}
