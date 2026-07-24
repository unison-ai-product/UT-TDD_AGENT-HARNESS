import { describe, expect, it } from "vitest";
import {
  analyzeDbConstraintCoverage,
  analyzeDbProjectionCoverage,
  dbProjectionCoverageMessages,
  extractDbProjectionCoverageRequirements,
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

  it("does not treat nested canonical-ledger file registries as harness projection tables", () => {
    const requirements = extractDbProjectionRequirements(
      [
        "### §2.7 SQLite projection DB の定義 (`harness.db`)",
        "",
        "#### §2.7.1 canonical ledgerファイル正本registry",
        "",
        "| ファイル | physical ownership | rebuild / migration / backup |",
        "|---|---|---|",
        "| `.ut-tdd/harness.db` | rebuildable projection only | projection owner |",
        "| `.ut-tdd/ledger/harness-ledger.db` | PLAN canonical ledger | PLAN owner |",
        "| `.ut-tdd/ledger/cutover-ledger.db` | cutover canonical ledger | cutover owner |",
        "",
        "### §2.8 後続節",
      ].join("\n"),
    );

    expect(requirements).toEqual([]);
  });

  it("does not leak a nested non-projection registry into the parent projection section", () => {
    const requirements = extractDbProjectionRequirements(
      [
        "### §2.7 SQLite projection DB の定義 (`harness.db`)",
        "",
        "#### §2.7.2 provider ownership registry",
        "",
        "| registry | owner | purpose |",
        "|---|---|---|",
        "| `MANAGED-PROVIDER-REGISTRY-v1` | security | provider trust boundary |",
      ].join("\n"),
    );

    expect(requirements).toEqual([]);
  });

  it("keeps path-like identifiers declared by a projection table schema", () => {
    const requirements = extractDbProjectionRequirements(
      [
        "### §2.7 SQLite projection DB の定義 (`harness.db`)",
        "",
        "| table | primary key | 主な列 | 入力 |",
        "|---|---|---|---|",
        "| `projection/path_like.db` | `projection_id` | `status` | fixture |",
      ].join("\n"),
    );

    expect(requirements.map((requirement) => requirement.table)).toEqual([
      "projection/path_like.db",
    ]);
  });

  it("does not broadly exclude an additional db identifier outside the 3DB ownership schema", () => {
    const requirements = extractDbProjectionRequirements(
      [
        "### §9.1 projection table 拡張",
        "",
        "| table | 主キー | 必須 columns | 目的 |",
        "|---|---|---|---|",
        "| `fourth-ledger.db` | `record_id` | `digest` | detector sentinel |",
      ].join("\n"),
    );

    expect(requirements.map((requirement) => requirement.table)).toEqual(["fourth-ledger.db"]);
  });

  it("accepts GFM alignment separators without losing projection table state", () => {
    const requirements = extractDbProjectionRequirements(
      [
        "### §9.1 projection table 拡張",
        "",
        "| table | 主キー | 必須 columns | 目的 |",
        "|:---|:---:|---:|---|",
        "| `aligned_projection` | `projection_id` | `status` | fixture |",
      ].join("\n"),
    );

    expect(requirements.map((requirement) => requirement.table)).toEqual(["aligned_projection"]);
  });

  it("does not collect index-like bullets from a nested non-projection registry", () => {
    const requirements = extractDbProjectionCoverageRequirements(
      [
        "### §9.3 index と invariant",
        "",
        "- `idx_valid_projection(plan_id, status)`",
        "",
        "#### §9.3.2 foreign registry",
        "",
        "- `foreign_registry(key)`",
      ].join("\n"),
    );

    expect(requirements.indexes.map((requirement) => requirement.name)).toEqual([
      "idx_valid_projection",
    ]);
  });

  it("ends projection data at a backtick-labelled non-projection table header", () => {
    const requirements = extractDbProjectionCoverageRequirements(
      [
        "### §9.1 projection table 拡張",
        "",
        "| table | 主キー | 必須 columns | 目的 |",
        "|---|---|---|---|",
        "| `valid_projection` | `projection_id` | `status` | fixture |",
        "",
        "| `registry` | `owner` | `purpose` |",
        "|---|---|---|",
        "| `FOREIGN-REGISTRY-v1` | `security` | `trust boundary` |",
      ].join("\n"),
    );

    expect(requirements.tables.map((requirement) => requirement.table)).toEqual([
      "valid_projection",
    ]);
    expect(requirements.indexes).toEqual([]);
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
