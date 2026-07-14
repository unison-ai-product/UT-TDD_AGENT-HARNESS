import { describe, expect, it } from "vitest";
import {
  analyzeDbConstraintCoverage,
  analyzeDbProjectionCoverage,
  dbProjectionCoverageMessages,
  extractDbProjectionRequirements,
  loadDbProjectionRequirements,
} from "../src/lint/db-projection-coverage";
import { createTableSql, type TableDef } from "../src/schema/harness-db";
import {
  enumCheck,
  foreignKey,
  reference,
  requiredCol,
} from "../src/schema/harness-db-table-builders";
import { openHarnessDb } from "../src/state-db";

const parent: TableDef = {
  name: "coverage_parent",
  columns: [{ name: "id", type: "TEXT", primaryKey: true }],
};
const child: TableDef = {
  name: "coverage_child",
  columns: [
    requiredCol("parent_id"),
    requiredCol("ordinal", "INTEGER"),
    {
      ...reference("owner_id", { table: "coverage_parent", column: "id", onDelete: "CASCADE" }),
      notNull: true,
    },
    requiredCol("status"),
  ],
  primaryKey: ["parent_id", "ordinal"],
  unique: [["owner_id", "ordinal"]],
  foreignKeys: [
    foreignKey(["parent_id"], {
      table: "coverage_parent",
      columns: ["id"],
      onDelete: "RESTRICT",
    }),
  ],
  checks: [enumCheck("status", ["draft", "confirmed"])],
};

describe("db-projection-coverage detector", () => {
  it("covers physical-data projection tables and required columns with the schema registry", () => {
    const result = analyzeDbProjectionCoverage(loadDbProjectionRequirements(process.cwd()));

    expect(result.ok).toBe(true);
    expect(result.checked).toBeGreaterThan(30);
    expect(result.checked).toBeGreaterThanOrEqual(48);
    expect(result.checkedIndexes).toBeGreaterThanOrEqual(41);
    expect(result.missingTables.map((item) => item.table)).not.toContain("spec_defs");
    expect(result.missingIndexes.map((item) => item.name)).not.toContain("idx_spec_defs_owner");
    expect(result.missingTables).toEqual([]);
    expect(result.missingColumns).toEqual([]);
    expect(result.primaryKeyMismatches).toEqual([]);
    expect(dbProjectionCoverageMessages(result)[0]).toContain("db-projection-coverage - OK");
  });

  it("fails when a physical-data required table is absent from the schema registry", () => {
    const requirements = extractDbProjectionRequirements(
      [
        "### §9.4 UT evidence history projection (A-122 / IMP-109)",
        "",
        "| table | primary key | required columns | purpose |",
        "|---|---|---|---|",
        "| `definitely_missing_projection_table` | `missing_id` | `plan_id`, `status` | sentinel |",
      ].join("\n"),
    );

    const result = analyzeDbProjectionCoverage(requirements);

    expect(result.ok).toBe(false);
    expect(result.missingTables.map((item) => item.table)).toEqual([
      "definitely_missing_projection_table",
    ]);
    expect(dbProjectionCoverageMessages(result).join("\n")).toContain("missing table");
  });

  it("matches typed registry constraints against SQLite metadata", () => {
    const db = openHarnessDb(":memory:");
    try {
      db.exec(createTableSql(parent));
      db.exec(createTableSql(child));
      expect(analyzeDbConstraintCoverage(db, [parent, child])).toEqual({
        checked: 2,
        findings: [],
        ok: true,
      });
    } finally {
      db.close();
    }
  });

  it.each([
    [
      "not-null",
      "parent_id TEXT, ordinal INTEGER NOT NULL, owner_id TEXT NOT NULL REFERENCES coverage_parent(id) ON DELETE CASCADE, status TEXT NOT NULL, PRIMARY KEY(parent_id, ordinal), UNIQUE(owner_id, ordinal), FOREIGN KEY(parent_id) REFERENCES coverage_parent(id) ON DELETE RESTRICT, CHECK(status IN ('draft','confirmed'))",
    ],
    [
      "primary-key",
      "parent_id TEXT NOT NULL, ordinal INTEGER NOT NULL, owner_id TEXT NOT NULL REFERENCES coverage_parent(id) ON DELETE CASCADE, status TEXT NOT NULL, PRIMARY KEY(ordinal, parent_id), UNIQUE(owner_id, ordinal), FOREIGN KEY(parent_id) REFERENCES coverage_parent(id) ON DELETE RESTRICT, CHECK(status IN ('draft','confirmed'))",
    ],
    [
      "foreign-key",
      "parent_id TEXT NOT NULL, ordinal INTEGER NOT NULL, owner_id TEXT NOT NULL, status TEXT NOT NULL, PRIMARY KEY(parent_id, ordinal), UNIQUE(owner_id, ordinal), CHECK(status IN ('draft','confirmed'))",
    ],
    [
      "unique",
      "parent_id TEXT NOT NULL, ordinal INTEGER NOT NULL, owner_id TEXT NOT NULL REFERENCES coverage_parent(id) ON DELETE CASCADE, status TEXT NOT NULL, PRIMARY KEY(parent_id, ordinal), FOREIGN KEY(parent_id) REFERENCES coverage_parent(id) ON DELETE RESTRICT, CHECK(status IN ('draft','confirmed'))",
    ],
    [
      "check",
      "parent_id TEXT NOT NULL, ordinal INTEGER NOT NULL, owner_id TEXT NOT NULL REFERENCES coverage_parent(id) ON DELETE CASCADE, status TEXT NOT NULL, PRIMARY KEY(parent_id, ordinal), UNIQUE(owner_id, ordinal), FOREIGN KEY(parent_id) REFERENCES coverage_parent(id) ON DELETE RESTRICT",
    ],
  ] as const)("fails closed when SQLite drops %s", (constraint, body) => {
    const db = openHarnessDb(":memory:");
    try {
      db.exec(createTableSql(parent));
      db.exec(`CREATE TABLE coverage_child (${body})`);
      const result = analyzeDbConstraintCoverage(db, [child]);
      expect(result.ok).toBe(false);
      expect(result.findings.map((finding) => finding.constraint)).toContain(constraint);
    } finally {
      db.close();
    }
  });
});
