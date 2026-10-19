import { describe, expect, it } from "vitest";
import { createTableSql, primaryKeyOf, validateTableDef } from "../src/schema/harness-db.ts";
import { HARNESS_DB_VMODEL_TABLES } from "../src/schema/harness-db-tables-vmodel.ts";
import { openHarnessDb } from "../src/state-db/index.ts";

const byName = new Map(HARNESS_DB_VMODEL_TABLES.map((table) => [table.name, table]));

describe("V-model physical schema definitions", () => {
  it("defines eight new tables without redefining profile entries", () => {
    expect([...byName.keys()]).toEqual([
      "vmodel_sources",
      "vmodel_categories",
      "vmodel_meta_source_mappings",
      "vmodel_semantic_items",
      "vmodel_source_item_edges",
      "vmodel_source_target_edges",
      "vmodel_item_target_edges",
      "document_scale_profiles",
    ]);
    expect(byName.has("document_scale_profile_entries")).toBe(false);
  });

  it("uses the common typed registry and validates every constraint", () => {
    for (const table of HARNESS_DB_VMODEL_TABLES) {
      expect(() => validateTableDef(table)).not.toThrow();
      expect(primaryKeyOf(table)).toMatch(/_id$|_ref$/);
      expect(createTableSql(table)).not.toContain("undefined");
      for (const column of table.columns.filter((item) => !item.primaryKey)) {
        expect(column.notNull ?? false).toBe(
          !(
            table.name === "vmodel_item_target_edges" &&
            ["target_kind", "target_ref", "plan_id"].includes(column.name)
          ),
        );
      }
    }
  });

  it("lets SQLite enforce enum, shape, unique, and foreign-key constraints", () => {
    const db = openHarnessDb(":memory:");
    db.exec("PRAGMA foreign_keys=ON");
    db.exec("CREATE TABLE plan_registry (plan_id TEXT PRIMARY KEY)");
    for (const table of HARNESS_DB_VMODEL_TABLES) db.exec(createTableSql(table));
    expect(() =>
      db.exec(
        "INSERT INTO document_scale_profiles VALUES ('p','unknown',1,'d','required','standard','s','a')",
      ),
    ).toThrow();
    expect(() =>
      db.exec(
        "INSERT INTO vmodel_item_target_edges VALUES ('e','missing','pending_review',NULL,NULL,NULL,'r','d')",
      ),
    ).toThrow();
    db.close();
  });

  // #1168: plan_id は来歴の文字列であり、PLAN 撤去後も ledger 投影が通ること (Green で FK を削除し it に戻す)。
  it.fails("accepts an item-target edge whose plan_id is absent from plan_registry", () => {
    const db = openHarnessDb(":memory:");
    db.exec("PRAGMA foreign_keys=ON");
    db.exec("CREATE TABLE plan_registry (plan_id TEXT PRIMARY KEY)");
    for (const table of HARNESS_DB_VMODEL_TABLES) db.exec(createTableSql(table));
    db.exec("INSERT INTO vmodel_categories VALUES ('c','n','d')");
    db.exec("INSERT INTO vmodel_semantic_items VALUES ('i','n','c','s','r','f','d')");
    try {
      expect(() =>
        db.exec(
          "INSERT INTO vmodel_item_target_edges VALUES ('e','i','pending_review',NULL,NULL,'PLAN-REMOVED','r','d')",
        ),
      ).not.toThrow();
    } finally {
      db.close();
    }
  });
});
