import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { SCHEMA_VERSION, schemaDdl } from "../src/schema/harness-db.ts";
import { type HarnessDb, openHarnessDb } from "../src/state-db/index.ts";
import { migrate } from "../src/state-db/migration.ts";
import { rebuildHarnessDb } from "../src/state-db/projection-writer.ts";
import { headSnapshotRoot } from "./support/workspace-roots.ts";

const LEGACY_V29_ITEM_TARGET_DDL = `
CREATE TABLE IF NOT EXISTS vmodel_item_target_edges (
  edge_id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL,
  target_status TEXT NOT NULL,
  target_kind TEXT,
  target_ref TEXT,
  plan_id TEXT,
  reason TEXT NOT NULL,
  source_digest TEXT NOT NULL,
  UNIQUE (item_id),
  FOREIGN KEY (item_id) REFERENCES vmodel_semantic_items (item_id),
  FOREIGN KEY (plan_id) REFERENCES plan_registry (plan_id),
  CHECK (target_status IN ('pending_review', 'adopt', 'merge', 'reference', 'defer', 'not_applicable', 'reject')),
  CHECK ((target_kind IS NULL) OR (target_kind IN ('plan_alias', 'artifact_family', 'artifact_path', 'target_slot'))),
  CHECK (((target_status = 'pending_review') AND (target_kind IS NULL) AND (target_ref IS NULL)) OR ((target_status IN ('adopt', 'merge', 'reference', 'defer')) AND (target_kind IS NOT NULL) AND (target_ref IS NOT NULL)) OR (target_status IN ('not_applicable', 'reject'))),
  CHECK ((NOT (target_status = 'defer')) OR (plan_id IS NOT NULL))
)
`;

const LEGACY_V25_PROJECTION_DDLS = [
  "CREATE TABLE document_catalog_entries (document_catalog_entry_id TEXT PRIMARY KEY, doc_type_id TEXT)",
  "CREATE TABLE document_scale_profile_entries (document_scale_profile_entry_id TEXT PRIMARY KEY, profile_id TEXT, doc_type_id TEXT)",
  "CREATE TABLE document_scale_profile_reviews (document_scale_profile_review_id TEXT PRIMARY KEY)",
] as const;

const V25_REBUILT_TABLES = new Set([
  "document_catalog_entries",
  "document_scale_profile_entries",
  "document_scale_profile_reviews",
]);

const COMMIT_FAILURE_AFTER_ITEM_TARGET = "injected final projection COMMIT failure";

interface ProjectionCommitProbe {
  itemTargetInserts: number;
  preProjectionCommits: number;
  injected: boolean;
}

function createV25ProjectionSchema(db: ReturnType<typeof openHarnessDb>): void {
  for (const ddl of schemaDdl().filter((entry) =>
    entry.startsWith("CREATE TABLE IF NOT EXISTS "),
  )) {
    const table = /^CREATE TABLE IF NOT EXISTS ([^ (]+)/.exec(ddl)?.[1];
    if (!table || V25_REBUILT_TABLES.has(table)) continue;
    db.exec(ddl);
  }
  createV25LegacyProjectionTables(db);
  db.prepare("INSERT INTO document_catalog_entries VALUES (?, ?)").run("legacy-catalog", "DOC-OLD");
  db.prepare("INSERT INTO document_scale_profile_entries VALUES (?, ?, ?)").run(
    "legacy-profile-entry",
    "PROFILE-OLD",
    "DOC-OLD",
  );
  db.prepare("INSERT INTO document_scale_profile_reviews VALUES (?)").run("legacy-review");
  db.setUserVersion(25);
}

function createV25LegacyProjectionTables(db: ReturnType<typeof openHarnessDb>): void {
  for (const ddl of LEGACY_V25_PROJECTION_DDLS) db.exec(ddl);
}

function createTrackedDocsFixture(): string {
  const root = mkdtempSync(join(tmpdir(), "ut-t1-v25-atomicity-"));
  cpSync(join(headSnapshotRoot(), "docs"), join(root, "docs"), { recursive: true });
  execFileSync("git", ["init", "--quiet"], { cwd: root, stdio: "ignore" });
  execFileSync("git", ["-c", "core.autocrlf=false", "add", "docs"], {
    cwd: root,
    stdio: "ignore",
  });
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
      "v25 atomicity docs fixture",
    ],
    { cwd: root, stdio: "ignore" },
  );
  return root;
}

function captureFullDatabaseState(db: ReturnType<typeof openHarnessDb>) {
  const master = db
    .prepare(
      "SELECT type, name, sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type, name",
    )
    .all();
  const tableNames = master
    .filter((entry) => entry.type === "table")
    .map((entry) => String(entry.name));
  const rows = Object.fromEntries(
    tableNames.map((table) => {
      const quotedTable = `"${table.replaceAll('"', '""')}"`;
      const stableRows = db
        .prepare(`SELECT * FROM ${quotedTable}`)
        .all()
        .map((row) => JSON.stringify(row))
        .sort();
      return [table, stableRows];
    }),
  );
  const userVersion = db.userVersion();
  const digest = createHash("sha256")
    .update(JSON.stringify({ master, userVersion, rows }))
    .digest("hex");
  return { master, userVersion, rows, digest };
}

function observeProjectionCommitFailure(
  db: ReturnType<typeof openHarnessDb>,
  probe: ProjectionCommitProbe,
): HarnessDb {
  return {
    path: db.path,
    driver: db.driver,
    exec(sql) {
      if (/^\s*COMMIT\s*;?\s*$/i.test(sql)) {
        if (probe.itemTargetInserts > 0 && !probe.injected) {
          probe.injected = true;
          throw new Error(COMMIT_FAILURE_AFTER_ITEM_TARGET);
        }
        if (probe.itemTargetInserts === 0) probe.preProjectionCommits += 1;
      }
      db.exec(sql);
    },
    prepare(sql) {
      const statement = db.prepare(sql);
      return {
        run(...params) {
          statement.run(...params);
          if (/^\s*INSERT\s+INTO\s+vmodel_item_target_edges\b/i.test(sql)) {
            probe.itemTargetInserts += Number(
              db.prepare("SELECT changes() AS count").get()?.count ?? 0,
            );
          }
        },
        get: (...params) => statement.get(...params),
        all: (...params) => statement.all(...params),
      };
    },
    userVersion: () => db.userVersion(),
    setUserVersion: (version) => db.setUserVersion(version),
    close: () => db.close(),
  };
}

interface LegacyItemTarget {
  edgeId: string;
  itemId: string;
  targetStatus: "adopt" | "defer" | "reference";
  targetKind: "artifact_path" | "plan_alias";
  targetRef: string;
  planId: string | null;
  reason: string;
  sourceDigest: string;
}

function createV29SchemaWithLegacyItemTarget(db: ReturnType<typeof openHarnessDb>): void {
  for (const ddl of schemaDdl().filter(
    (entry) =>
      entry.startsWith("CREATE TABLE IF NOT EXISTS ") &&
      !entry.startsWith("CREATE TABLE IF NOT EXISTS vmodel_item_target_edges ("),
  )) {
    db.exec(ddl);
  }
  db.exec(LEGACY_V29_ITEM_TARGET_DDL);
}

function seedV29ItemTargetParents(db: ReturnType<typeof openHarnessDb>, itemIds: string[]): void {
  db.prepare("INSERT INTO plan_registry (plan_id) VALUES (?)").run("PLAN-L6-01");
  db.prepare(
    "INSERT INTO vmodel_categories (category_id, category_name, row_digest) VALUES (?, ?, ?)",
  ).run("CAT-DISPPTR", "migration fixture", "digest-category");
  const insertItem = db.prepare(
    `INSERT INTO vmodel_semantic_items
      (item_id, item_name, category_id, source_status, source_ref, source_file, row_digest)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
  );
  for (const itemId of itemIds) {
    insertItem.run(
      itemId,
      `fixture ${itemId}`,
      "CAT-DISPPTR",
      "adopted",
      "ZIP-DOC-001",
      "fixture.md",
      `digest-${itemId}`,
    );
  }
}

function insertLegacyItemTarget(db: ReturnType<typeof openHarnessDb>, row: LegacyItemTarget): void {
  db.prepare(
    `INSERT INTO vmodel_item_target_edges
      (edge_id, item_id, target_status, target_kind, target_ref, plan_id, reason, source_digest)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    row.edgeId,
    row.itemId,
    row.targetStatus,
    row.targetKind,
    row.targetRef,
    row.planId,
    row.reason,
    row.sourceDigest,
  );
}

function legacyItemTargetState(db: ReturnType<typeof openHarnessDb>) {
  return {
    sql: db
      .prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = ?")
      .get("vmodel_item_target_edges")?.sql,
    columns: db.prepare("PRAGMA table_info(vmodel_item_target_edges)").all(),
    foreignKeys: db.prepare("PRAGMA foreign_key_list(vmodel_item_target_edges)").all(),
    rows: db.prepare("SELECT * FROM vmodel_item_target_edges ORDER BY edge_id").all(),
    userVersion: db.userVersion(),
  };
}

describe("V-model version 26 projection migration", () => {
  it("rebuilds derived profile tables with typed constraints instead of nullable ALTER", () => {
    const db = openHarnessDb(":memory:");
    try {
      createV25LegacyProjectionTables(db);
      db.exec("INSERT INTO document_catalog_entries VALUES ('old','DOC-OLD')");
      db.setUserVersion(25);
      const result = migrate(db);
      expect(result.toVersion).toBe(SCHEMA_VERSION);
      expect(
        db
          .prepare("PRAGMA table_info(document_scale_profile_entries)")
          .all()
          .map((row) => row.name),
      ).toContain("row_digest");
      expect(
        db.prepare("SELECT COUNT(*) AS count FROM document_catalog_entries").get()?.count,
      ).toBe(0);
      expect(() =>
        db.exec(
          "INSERT INTO document_scale_profile_entries (document_scale_profile_entry_id,profile_id,doc_type_id,decision,detail_override,status_override,reason,row_digest,source_path,indexed_at) VALUES ('e','missing','DOC-OLD','adopt','standard','required','r','d','p','t')",
        ),
      ).toThrow();
    } finally {
      db.close();
    }
  });

  it("builds the frozen v29 target-edge fixture with legal legacy rows and intact FKs", () => {
    const db = openHarnessDb(":memory:");
    try {
      createV29SchemaWithLegacyItemTarget(db);
      seedV29ItemTargetParents(db, [
        "ITEM-DISPPTR-FIXTURE-DEFER",
        "ITEM-DISPPTR-FIXTURE-ADOPT",
        "ITEM-DISPPTR-FIXTURE-REFERENCE",
      ]);
      for (const row of [
        {
          edgeId: "EDGE-DISPPTR-FIXTURE-DEFER",
          itemId: "ITEM-DISPPTR-FIXTURE-DEFER",
          targetStatus: "defer" as const,
          targetKind: "plan_alias" as const,
          targetRef: "PLAN-L6-01",
          planId: "PLAN-L6-01",
          reason: "valid legacy defer row for fixture preflight",
          sourceDigest: "digest-fixture-defer",
        },
        {
          edgeId: "EDGE-DISPPTR-FIXTURE-ADOPT",
          itemId: "ITEM-DISPPTR-FIXTURE-ADOPT",
          targetStatus: "adopt" as const,
          targetKind: "artifact_path" as const,
          targetRef: "docs/design/harness/L5-detailed-design/physical-data.md",
          planId: null,
          reason: "valid legacy adopt row for fixture preflight",
          sourceDigest: "digest-fixture-adopt",
        },
        {
          edgeId: "EDGE-DISPPTR-FIXTURE-REFERENCE",
          itemId: "ITEM-DISPPTR-FIXTURE-REFERENCE",
          targetStatus: "reference" as const,
          targetKind: "plan_alias" as const,
          targetRef: "PLAN-L6-01",
          planId: "PLAN-L6-01",
          reason: "valid legacy reference row for fixture preflight",
          sourceDigest: "digest-fixture-reference",
        },
      ]) {
        insertLegacyItemTarget(db, row);
      }
      db.setUserVersion(29);

      const state = legacyItemTargetState(db);
      expect(String(state.sql)).toContain("plan_id IS NOT NULL");
      expect(state.columns.map((column) => column.name)).not.toContain("design_path");
      expect(state.foreignKeys).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            from: "item_id",
            table: "vmodel_semantic_items",
            to: "item_id",
          }),
          expect.objectContaining({ from: "plan_id", table: "plan_registry", to: "plan_id" }),
        ]),
      );
      expect(state.rows.map((row) => row.target_status).sort()).toEqual([
        "adopt",
        "defer",
        "reference",
      ]);
      expect(state.userVersion).toBe(29);
    } finally {
      db.close();
    }
  });

  it.fails("CANDIDATE-U-DISPPTR-004: migration refuses an ungrounded legacy defer row atomically", () => {
    const db = openHarnessDb(":memory:");
    try {
      createV29SchemaWithLegacyItemTarget(db);
      seedV29ItemTargetParents(db, ["ITEM-DISPPTR-004"]);
      insertLegacyItemTarget(db, {
        edgeId: "EDGE-DISPPTR-004",
        itemId: "ITEM-DISPPTR-004",
        targetStatus: "defer",
        targetKind: "plan_alias",
        targetRef: "PLAN-L6-01",
        planId: "PLAN-L6-01",
        reason: "legacy defer has no authored design pointer",
        sourceDigest: "digest-legacy-defer",
      });
      db.setUserVersion(29);

      const before = legacyItemTargetState(db);
      expect(String(before.sql)).toContain("plan_id IS NOT NULL");
      expect(before.columns.map((column) => column.name)).not.toContain("design_path");
      expect(before.foreignKeys).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            from: "item_id",
            table: "vmodel_semantic_items",
            to: "item_id",
          }),
          expect.objectContaining({ from: "plan_id", table: "plan_registry", to: "plan_id" }),
        ]),
      );
      expect(before.rows).toHaveLength(1);
      expect(before.userVersion).toBe(29);

      // On the initial Red this expectation stops here, so rollback assertions below
      // become observable only after the Green migration actually throws.
      expect(() => migrate(db)).toThrow();

      const after = legacyItemTargetState(db);
      expect(after.sql).toBe(before.sql);
      expect(after.columns).toEqual(before.columns);
      expect(after.foreignKeys).toEqual(before.foreignKeys);
      expect(after.rows).toEqual(before.rows);
      expect(after.columns.map((column) => column.name)).not.toContain("design_path");
      expect(after.userVersion).toBe(29);
    } finally {
      db.close();
    }
  });

  it.fails("CANDIDATE-U-DISPPTR-005: table swap retains both FKs and nullable legacy plan_id", () => {
    const db = openHarnessDb(":memory:");
    try {
      createV29SchemaWithLegacyItemTarget(db);
      seedV29ItemTargetParents(db, [
        "ITEM-DISPPTR-005-NULL-PLAN",
        "ITEM-DISPPTR-005-NULL-DESIGN",
        "ITEM-DISPPTR-005-BAD-PLAN",
        "ITEM-DISPPTR-005-BAD-ITEM",
      ]);
      insertLegacyItemTarget(db, {
        edgeId: "EDGE-DISPPTR-005-BASE",
        itemId: "ITEM-DISPPTR-005-NULL-PLAN",
        targetStatus: "adopt",
        targetKind: "artifact_path",
        targetRef: "docs/design/harness/L5-detailed-design/physical-data.md",
        planId: null,
        reason: "legacy row to retain while table constraints are replaced",
        sourceDigest: "digest-legacy-adopt",
      });
      db.setUserVersion(29);

      const migration = migrate(db);
      expect(migration.toVersion).toBe(SCHEMA_VERSION);
      const columns = db.prepare("PRAGMA table_info(vmodel_item_target_edges)").all();
      expect(columns.map((column) => column.name)).toContain("design_path");
      expect(columns.find((column) => column.name === "design_path")?.notnull).toBe(0);
      const foreignKeys = db.prepare("PRAGMA foreign_key_list(vmodel_item_target_edges)").all();
      expect(foreignKeys).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            from: "item_id",
            table: "vmodel_semantic_items",
            to: "item_id",
          }),
          expect.objectContaining({ from: "plan_id", table: "plan_registry", to: "plan_id" }),
        ]),
      );

      const insert = db.prepare(
        `INSERT INTO vmodel_item_target_edges
          (edge_id, item_id, target_status, target_kind, target_ref, plan_id, design_path, reason, source_digest)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      );
      const physicalDataPath = "docs/design/harness/L5-detailed-design/physical-data.md";
      expect(() =>
        insert.run(
          "EDGE-DISPPTR-005-NULL-PLAN",
          "ITEM-DISPPTR-005-NULL-DESIGN",
          "defer",
          "artifact_path",
          physicalDataPath,
          null,
          physicalDataPath,
          "defer is grounded by a design path without a PLAN",
          "digest-null-plan",
        ),
      ).not.toThrow();
      expect(() =>
        insert.run(
          "EDGE-DISPPTR-005-BAD-ITEM",
          "ITEM-DOES-NOT-EXIST",
          "adopt",
          "artifact_path",
          physicalDataPath,
          null,
          null,
          "must reject missing item FK",
          "digest-bad-item",
        ),
      ).toThrow();
      expect(() =>
        insert.run(
          "EDGE-DISPPTR-005-BAD-PLAN",
          "ITEM-DISPPTR-005-BAD-PLAN",
          "adopt",
          "artifact_path",
          physicalDataPath,
          "PLAN-DOES-NOT-EXIST",
          null,
          "must reject missing nullable PLAN FK when non-NULL",
          "digest-bad-plan",
        ),
      ).toThrow();
    } finally {
      db.close();
    }
  });

  it.fails("CANDIDATE-U-DISPPTR-006: successful migration preserves authored rows and adds nullable design_path", () => {
    const db = openHarnessDb(":memory:");
    try {
      createV29SchemaWithLegacyItemTarget(db);
      seedV29ItemTargetParents(db, ["ITEM-DISPPTR-006-NULL-PLAN", "ITEM-DISPPTR-006-PLAN"]);
      insertLegacyItemTarget(db, {
        edgeId: "EDGE-DISPPTR-006-NULL-PLAN",
        itemId: "ITEM-DISPPTR-006-NULL-PLAN",
        targetStatus: "adopt",
        targetKind: "artifact_path",
        targetRef: "docs/design/harness/L5-detailed-design/physical-data.md",
        planId: null,
        reason: "nullable legacy plan reference",
        sourceDigest: "digest-row-null-plan",
      });
      insertLegacyItemTarget(db, {
        edgeId: "EDGE-DISPPTR-006-PLAN",
        itemId: "ITEM-DISPPTR-006-PLAN",
        targetStatus: "reference",
        targetKind: "plan_alias",
        targetRef: "PLAN-L6-01",
        planId: "PLAN-L6-01",
        reason: "existing authored PLAN value remains unchanged",
        sourceDigest: "digest-row-plan",
      });
      db.setUserVersion(29);

      const authoringRows = () =>
        db
          .prepare(
            `SELECT edge_id, item_id, target_status, target_kind, target_ref, plan_id, reason, source_digest
             FROM vmodel_item_target_edges ORDER BY edge_id`,
          )
          .all();
      const beforeRows = authoringRows();
      const result = migrate(db);

      expect(result.toVersion).toBe(SCHEMA_VERSION);
      expect(db.userVersion()).toBe(SCHEMA_VERSION);
      const columns = db.prepare("PRAGMA table_info(vmodel_item_target_edges)").all();
      expect(columns.map((column) => column.name)).toContain("design_path");
      expect(columns.find((column) => column.name === "design_path")?.notnull).toBe(0);
      expect(authoringRows()).toEqual(beforeRows);
      expect(
        db
          .prepare("SELECT design_path FROM vmodel_item_target_edges ORDER BY edge_id")
          .all()
          .map((row) => row.design_path),
      ).toEqual([null, null]);
    } finally {
      db.close();
    }
  });
});

describe("CANDIDATE-U-DISPPTR-008: old-version migration and projection failure atomicity", () => {
  let db: ReturnType<typeof openHarnessDb>;
  let tempRoot: string;
  let before: ReturnType<typeof captureFullDatabaseState>;
  let after: ReturnType<typeof captureFullDatabaseState>;
  let probe: ProjectionCommitProbe;

  beforeAll(() => {
    tempRoot = createTrackedDocsFixture();
    db = openHarnessDb(":memory:");
    createV25ProjectionSchema(db);
    before = captureFullDatabaseState(db);

    // Setup is deliberately outside the expected-failure assertion below.
    expect(before.userVersion).toBe(25);
    expect(before.rows.document_catalog_entries).toHaveLength(1);
    expect(before.rows.document_scale_profile_entries).toHaveLength(1);
    expect(before.rows.document_scale_profile_reviews).toHaveLength(1);
    expect(
      before.master.find(
        (entry) => entry.type === "table" && entry.name === "document_catalog_entries",
      )?.sql,
    ).toContain("doc_type_id TEXT");

    probe = { itemTargetInserts: 0, preProjectionCommits: 0, injected: false };
    let rebuildError: unknown;
    try {
      rebuildHarnessDb({
        repoRoot: tempRoot,
        db: observeProjectionCommitFailure(db, probe),
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
    } catch (error) {
      rebuildError = error;
    }

    // Prove this is the intended post-insert commit fault, not a fixture/setup failure.
    expect(probe.preProjectionCommits).toBeGreaterThan(0);
    expect(probe.itemTargetInserts).toBeGreaterThan(0);
    expect(probe.injected).toBe(true);
    expect(rebuildError).toBeInstanceOf(Error);
    expect((rebuildError as Error).message).toContain(COMMIT_FAILURE_AFTER_ITEM_TARGET);
    after = captureFullDatabaseState(db);
  }, 120_000);

  afterAll(() => {
    db?.close();
    if (tempRoot) rmSync(tempRoot, { recursive: true, force: true });
  });

  it("observes the migration commit, a real item-target insert, and one later injected failure", () => {
    expect(probe.preProjectionCommits).toBeGreaterThan(0);
    expect(probe.itemTargetInserts).toBeGreaterThan(0);
    expect(probe.injected).toBe(true);
  });

  it.fails("retains old sqlite_master, user_version, all rows, and their digest after projection failure", () => {
    expect(after).toEqual(before);
  });
});
