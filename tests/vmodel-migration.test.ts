import { describe, expect, it } from "vitest";
import { SCHEMA_VERSION, schemaDdl } from "../src/schema/harness-db.ts";
import { openHarnessDb } from "../src/state-db/index.ts";
import { migrate } from "../src/state-db/migration.ts";

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

function createV25LegacyProjectionTables(db: ReturnType<typeof openHarnessDb>): void {
  for (const ddl of LEGACY_V25_PROJECTION_DDLS) db.exec(ddl);
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

function fullDatabaseState(db: ReturnType<typeof openHarnessDb>) {
  const master = db
    .prepare(
      "SELECT type, name, sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type, name",
    )
    .all();
  const rows = Object.fromEntries(
    master
      .filter((entry) => entry.type === "table")
      .map((entry) => {
        const table = String(entry.name);
        const quotedTable = `"${table.replaceAll('"', '""')}"`;
        const stableRows = db
          .prepare(`SELECT * FROM ${quotedTable}`)
          .all()
          .map((row) => JSON.stringify(row))
          .sort();
        return [table, stableRows];
      }),
  );
  return { master, rows, userVersion: db.userVersion() };
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

describe("CANDIDATE-U-DISPPTR-008: current v29 migration no-op", () => {
  it("keeps a migrated v29 schema and normal adopt/null-plan rows on repeat", () => {
    const db = openHarnessDb(":memory:");
    try {
      createV29SchemaWithLegacyItemTarget(db);
      seedV29ItemTargetParents(db, ["ITEM-DISPPTR-008-V29"]);
      insertLegacyItemTarget(db, {
        edgeId: "EDGE-DISPPTR-008-V29",
        itemId: "ITEM-DISPPTR-008-V29",
        targetStatus: "adopt",
        targetKind: "artifact_path",
        targetRef: "docs/design/harness/L5-detailed-design/physical-data.md",
        planId: null,
        reason: "ordinary current-schema adoption without a PLAN reference",
        sourceDigest: "digest-v29-noop",
      });
      for (const ddl of schemaDdl().filter(
        (entry) => !entry.startsWith("CREATE TABLE IF NOT EXISTS "),
      )) {
        db.exec(ddl);
      }
      db.setUserVersion(29);
      const before = fullDatabaseState(db);

      const result = migrate(db);

      expect(result.fromVersion).toBe(29);
      expect(result.toVersion).toBe(29);
      expect(result.applied).toBe(false);
      expect(fullDatabaseState(db)).toEqual(before);
    } finally {
      db.close();
    }
  });
});
