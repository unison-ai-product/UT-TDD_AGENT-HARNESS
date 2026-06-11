/**
 * harness.db projection schema — 単一正本 (PLAN-L7-45, 工程表 PLAN-L7-44 span ①)。
 *
 * `.ut-tdd/harness.db` の projection table を **TS の table registry として単一正本化**する。
 * migration (src/state-db/migration.ts) はこの registry から DDL を生成し、projection-writer
 * (span ②) はこの registry の列名で行を書く。table 追加は registry への append + SCHEMA_VERSION
 * bump の 1 箇所で済む (CLAUDE.md: ハードコード単一正本化 / 将来拡張容易性)。
 *
 * 設計正本: docs/design/harness/L5-detailed-design/physical-data.md §2.7 (基本 7) + §9.1 (拡張 10)。
 * 本 span は core 17 table を載せる。§9.4-§9.7 (UT evidence / relation-graph / MCP / doc-export) の
 * projection table は、それぞれの射影を配線する span (46+) が registry に追記する。
 *
 * 注: physical-data.md は列を列挙するが SQLite 型を明示しない。id/path/status/timestamp 系を TEXT、
 * value/threshold/score を REAL、真偽/件数/rank を INTEGER として型付けする (SQLite は動的型のため
 * affinity ヒント)。各 table の列・PK・index は §2.7/§9.1/§9.3 に準拠。
 */

export const SCHEMA_VERSION = 1;

export type ColumnType = "TEXT" | "INTEGER" | "REAL";

export interface ColumnDef {
  name: string;
  type: ColumnType;
  /** PRIMARY KEY 列 (1 table 1 列、physical-data の PK に準拠)。 */
  primaryKey?: boolean;
}

export interface TableDef {
  name: string;
  columns: ColumnDef[];
}

export interface IndexDef {
  name: string;
  table: string;
  columns: string[];
}

/**
 * SQL 識別子検証 (injection 防止)。table / column / index 名は ? でバインドできず DDL/DML に
 * 文字列展開するため、英数字 + アンダースコアの正規識別子のみ許可する (値は別途バインド)。
 * schema (安定核) に置き、state-db adapter からも再利用する (単一正本)。
 */
export const SQL_IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;
export function assertSqlIdentifier(name: string): void {
  if (!SQL_IDENTIFIER.test(name)) {
    throw new Error(`不正な SQL 識別子 (英数字/アンダースコアのみ許可): ${name}`);
  }
}

const col = (name: string, type: ColumnType = "TEXT"): ColumnDef => ({ name, type });
const pk = (name: string): ColumnDef => ({ name, type: "TEXT", primaryKey: true });

/** §2.7 基本 7 + §9.1 拡張 10 = core 17 projection table。 */
export const HARNESS_DB_TABLES: TableDef[] = [
  // --- §2.7 基本 7 ---
  {
    name: "plan_registry",
    columns: [
      pk("plan_id"),
      col("kind"),
      col("layer"),
      col("sub_doc"),
      col("drive"),
      col("status"),
      col("parent"),
      col("updated_at"),
    ],
  },
  {
    name: "artifact_registry",
    columns: [
      pk("artifact_id"),
      col("artifact_type"),
      col("path"),
      col("pair_artifact"),
      col("status"),
      col("updated_at"),
    ],
  },
  {
    name: "model_runs",
    columns: [
      pk("run_id"),
      col("runtime"),
      col("model"),
      col("role"),
      col("drive"),
      col("plan_id"),
      col("started_at"),
      col("completed_at"),
      col("evidence_path"),
    ],
  },
  {
    name: "trace_edges",
    columns: [
      pk("edge_id"),
      col("from_artifact"),
      col("to_artifact"),
      col("edge_kind"),
      col("plan_id"),
      col("status"),
    ],
  },
  {
    name: "coverage",
    columns: [
      pk("coverage_id"),
      col("scope"),
      col("subject_id"),
      col("metric"),
      col("value", "REAL"),
      col("threshold", "REAL"),
      col("status"),
    ],
  },
  {
    name: "findings",
    columns: [
      pk("finding_id"),
      col("kind"),
      col("severity"),
      col("subject_id"),
      col("source"),
      col("status"),
      col("evidence_path"),
    ],
  },
  {
    name: "gate_runs",
    columns: [
      pk("gate_run_id"),
      col("gate_id"),
      col("plan_id"),
      col("status"),
      col("checked_at"),
      col("evidence_path"),
    ],
  },
  // --- §9.1 Reference-Feedback 拡張 10 ---
  {
    name: "drive_runs",
    columns: [
      pk("drive_run_id"),
      col("plan_id"),
      col("session_id"),
      col("drive"),
      col("mode"),
      col("layer"),
      col("kind"),
      col("started_at"),
      col("completed_at"),
      col("status"),
    ],
  },
  {
    name: "hook_events",
    columns: [
      pk("event_id"),
      col("session_id"),
      col("plan_id"),
      col("hook_name"),
      col("event_type"),
      col("occurred_at"),
      col("digest"),
      col("evidence_path"),
    ],
  },
  {
    name: "skill_invocations",
    columns: [
      pk("skill_invocation_id"),
      col("session_id"),
      col("plan_id"),
      col("skill_id"),
      col("layer"),
      col("drive"),
      col("fired_at"),
      col("source"),
      col("accepted", "INTEGER"),
    ],
  },
  {
    name: "skill_recommendations",
    columns: [
      pk("skill_recommendation_id"),
      col("session_id"),
      col("plan_id"),
      col("skill_id"),
      col("rank", "INTEGER"),
      col("score", "REAL"),
      col("reason"),
      col("recommended_at"),
    ],
  },
  {
    name: "feedback_events",
    columns: [
      pk("feedback_event_id"),
      col("finding_id"),
      col("plan_id"),
      col("signal_type"),
      col("severity"),
      col("status"),
      col("next_action"),
      col("created_at"),
    ],
  },
  {
    name: "quality_signals",
    columns: [
      pk("signal_id"),
      col("source"),
      col("subject_id"),
      col("metric"),
      col("value", "REAL"),
      col("threshold", "REAL"),
      col("status"),
      col("computed_at"),
    ],
  },
  {
    name: "search_index",
    columns: [
      pk("search_id"),
      col("subject_type"),
      col("subject_id"),
      col("path"),
      col("title"),
      col("tokens"),
      col("summary"),
      col("updated_at"),
    ],
  },
  {
    name: "workflow_runs",
    columns: [
      pk("workflow_run_id"),
      col("plan_id"),
      col("drive_run_id"),
      col("workflow"),
      col("phase"),
      col("ready_status"),
      col("blocked_reason"),
      col("human_required", "INTEGER"),
      col("checked_at"),
    ],
  },
  {
    name: "guardrail_decisions",
    columns: [
      pk("guardrail_decision_id"),
      col("plan_id"),
      col("session_id"),
      col("guardrail"),
      col("decision"),
      col("mode"),
      col("human_signoff_required", "INTEGER"),
      col("evidence_path"),
      col("decided_at"),
    ],
  },
  {
    name: "automation_assets",
    columns: [
      pk("asset_id"),
      col("asset_type"),
      col("path"),
      col("trigger"),
      col("role"),
      col("capability"),
      col("drift_status"),
      col("indexed_at"),
    ],
  },
];

/** §9.3 で宣言された projection index。 */
export const HARNESS_DB_INDEXES: IndexDef[] = [
  {
    name: "idx_plan_layer_drive_status",
    table: "plan_registry",
    // physical-data §9.3 準拠: (plan_id, layer, drive, status)。plan_id は PK だが doc 宣言に整合させる。
    columns: ["plan_id", "layer", "drive", "status"],
  },
  { name: "idx_trace_from_to", table: "trace_edges", columns: ["from_artifact", "to_artifact"] },
  {
    name: "idx_findings_subject_status",
    table: "findings",
    columns: ["subject_id", "status", "severity"],
  },
  {
    name: "idx_hook_session_plan",
    table: "hook_events",
    columns: ["session_id", "plan_id", "occurred_at"],
  },
  {
    name: "idx_skill_plan_skill",
    table: "skill_invocations",
    columns: ["plan_id", "skill_id", "fired_at"],
  },
  { name: "idx_search_subject", table: "search_index", columns: ["subject_type", "subject_id"] },
];

// registry の全識別子を module load 時に検証する (single-source guard)。span 46+ が registry に
// table を追記したとき、不正識別子が createTableSql/rowCounts 等の DDL 展開へ届く前に fail-close する。
for (const table of HARNESS_DB_TABLES) {
  assertSqlIdentifier(table.name);
  for (const column of table.columns) assertSqlIdentifier(column.name);
}
for (const index of HARNESS_DB_INDEXES) {
  assertSqlIdentifier(index.name);
  assertSqlIdentifier(index.table);
  for (const column of index.columns) assertSqlIdentifier(column);
}

/** table の PRIMARY KEY 列名を返す (projection-writer の upsert conflict target)。 */
export function primaryKeyOf(table: TableDef): string {
  const key = table.columns.find((c) => c.primaryKey);
  if (!key) throw new Error(`table ${table.name} に primaryKey 列がありません`);
  return key.name;
}

/** table 名 → TableDef の索引。 */
export const HARNESS_DB_TABLE_BY_NAME: ReadonlyMap<string, TableDef> = new Map(
  HARNESS_DB_TABLES.map((t) => [t.name, t]),
);

/** CREATE TABLE DDL を registry から生成 (deterministic、IF NOT EXISTS)。 */
export function createTableSql(table: TableDef): string {
  const cols = table.columns.map((c) => {
    const constraint = c.primaryKey ? " PRIMARY KEY" : "";
    return `  ${c.name} ${c.type}${constraint}`;
  });
  return `CREATE TABLE IF NOT EXISTS ${table.name} (\n${cols.join(",\n")}\n)`;
}

/** CREATE INDEX DDL。 */
export function createIndexSql(index: IndexDef): string {
  return `CREATE INDEX IF NOT EXISTS ${index.name} ON ${index.table} (${index.columns.join(", ")})`;
}

/** schema 全体の DDL 文 (table → index の順、deterministic)。 */
export function schemaDdl(): string[] {
  return [...HARNESS_DB_TABLES.map(createTableSql), ...HARNESS_DB_INDEXES.map(createIndexSql)];
}
