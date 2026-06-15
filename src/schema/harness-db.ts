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

export const SCHEMA_VERSION = 10;

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
    name: "test_runs",
    columns: [
      pk("test_run_id"),
      col("plan_id"),
      col("command"),
      col("runner"),
      col("scope"),
      col("started_at"),
      col("completed_at"),
      col("exit_code", "INTEGER"),
      col("evidence_path"),
      col("status"),
    ],
  },
  {
    name: "test_cases",
    columns: [
      pk("test_case_id"),
      col("test_run_id"),
      col("plan_id"),
      col("oracle_id"),
      col("name"),
      col("status"),
      col("duration_ms", "REAL"),
      col("evidence_path"),
    ],
  },
  {
    name: "test_results",
    columns: [
      pk("test_result_id"),
      col("test_case_id"),
      col("test_run_id"),
      col("oracle_id"),
      col("status"),
      col("message"),
      col("evidence_path"),
    ],
  },
  {
    name: "test_artifact_edges",
    columns: [
      pk("test_artifact_edge_id"),
      col("test_run_id"),
      col("artifact_path"),
      col("edge_kind"),
      col("oracle_id"),
      col("evidence_path"),
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
    name: "issue_queue",
    columns: [
      pk("issue_queue_id"),
      col("source_event_id"),
      col("plan_id"),
      col("target"),
      col("title"),
      col("body"),
      col("status"),
      col("human_approval_required", "INTEGER"),
      col("approved_by"),
      col("approved_at"),
      col("external_issue_id"),
      col("external_issue_url"),
      col("created_at"),
    ],
  },
  {
    name: "trouble_events",
    columns: [
      pk("trouble_event_id"),
      col("source_event_id"),
      col("plan_id"),
      col("category"),
      col("severity"),
      col("summary"),
      col("status"),
      col("created_at"),
    ],
  },
  {
    name: "retry_events",
    columns: [
      pk("retry_event_id"),
      col("plan_id"),
      col("workflow"),
      col("phase"),
      col("attempt_count", "INTEGER"),
      col("status"),
      col("created_at"),
    ],
  },
  {
    name: "improvement_log",
    columns: [
      pk("improvement_log_id"),
      col("source_event_id"),
      col("plan_id"),
      col("category"),
      col("summary"),
      col("next_action"),
      col("status"),
      col("created_at"),
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
      col("skill_type"),
      col("applies_layers"),
      col("applies_drive_models"),
      col("drift_status"),
      col("indexed_at"),
    ],
  },
  // --- §9.5 relation graph projection ---
  {
    name: "graph_nodes",
    columns: [
      pk("node_id"),
      col("node_type"),
      col("subject_id"),
      col("section_id"),
      col("path"),
      col("name"),
      col("layer"),
      col("kind"),
      col("status"),
      col("source"),
      col("indexed_at"),
    ],
  },
  {
    name: "dependency_edges",
    columns: [
      pk("edge_id"),
      col("from_node_id"),
      col("to_node_id"),
      col("edge_kind"),
      col("strength", "REAL"),
      col("source"),
      col("evidence_path"),
      col("is_expected", "INTEGER"),
      col("is_actual", "INTEGER"),
      col("indexed_at"),
    ],
  },
  // --- §9.6 verification profile projection ---
  {
    name: "verification_profiles",
    columns: [
      pk("verification_profile_id"),
      col("name"),
      col("profile_type"),
      col("package_refs"),
      col("requires_docker", "INTEGER"),
      col("requires_browser", "INTEGER"),
      col("requires_network", "INTEGER"),
      col("green_definition_id"),
      col("trigger_signals"),
      col("enabled", "INTEGER"),
    ],
  },
  {
    name: "verification_recommendations",
    columns: [
      pk("verification_recommendation_id"),
      col("change_set_id"),
      col("plan_id"),
      col("profile_id"),
      col("profile_kind"),
      col("reason"),
      col("source_rule"),
      col("accepted", "INTEGER"),
      col("created_at"),
    ],
  },
  {
    name: "mcp_server_runs",
    columns: [
      pk("mcp_run_id"),
      col("mcp_profile_id"),
      col("session_id"),
      col("plan_id"),
      col("command"),
      col("method"),
      col("tool_name"),
      col("started_at"),
      col("completed_at"),
      col("exit_code", "INTEGER"),
      col("evidence_path"),
      col("normalized_status"),
    ],
  },
  {
    name: "external_tool_findings",
    columns: [
      pk("external_finding_id"),
      col("source_run_id"),
      col("source_kind"),
      col("finding_type"),
      col("severity"),
      col("subject_id"),
      col("path"),
      col("status"),
      col("digest"),
      col("created_at"),
    ],
  },
  // --- §9.7 document export projection ---
  {
    name: "document_export_runs",
    columns: [
      pk("document_export_run_id"),
      col("profile_id"),
      col("session_id"),
      col("plan_id"),
      col("source_doc_family"),
      col("source_paths_digest"),
      col("source_snapshot_hash"),
      col("redaction_profile"),
      col("started_at"),
      col("completed_at"),
      col("exit_code", "INTEGER"),
      col("evidence_path"),
      col("normalized_status"),
    ],
  },
  {
    name: "document_export_datasets",
    columns: [
      pk("document_export_dataset_id"),
      col("export_run_id"),
      col("dataset_kind"),
      col("row_count", "INTEGER"),
      col("column_digest"),
      col("source_paths"),
      col("source_section_digest"),
      col("created_at"),
      col("hash"),
      col("format"),
    ],
  },
  {
    name: "document_export_artifacts",
    columns: [
      pk("document_export_artifact_id"),
      col("export_run_id"),
      col("format"),
      col("path"),
      col("renderer"),
      col("byte_size", "INTEGER"),
      col("hash"),
      col("created_at"),
      col("evidence_path"),
      col("stale_status"),
    ],
  },
  // --- §9.8 skill evaluation projection (FR-L1-36, PLAN-L7-53) ---
  {
    name: "skill_evaluations",
    columns: [
      pk("skill_id"),
      col("skill_rating", "REAL"),
      col("adoption_count", "INTEGER"),
      col("success_count", "INTEGER"),
      col("unused_flag", "INTEGER"),
      col("evaluated_at"),
    ],
  },
  // --- roadmap / review evidence projection (cutover feedback loop) ---
  {
    name: "roadmap_rollups",
    columns: [
      pk("rollup_id"),
      col("total_bands", "INTEGER"),
      col("covered_bands", "INTEGER"),
      col("parked_bands", "INTEGER"),
      col("uncovered_bands", "INTEGER"),
      col("total_gates", "INTEGER"),
      col("reached_gates", "INTEGER"),
      col("total_spans", "INTEGER"),
      col("confirmed_spans", "INTEGER"),
      col("frontier"),
      col("computed_at"),
    ],
  },
  {
    name: "roadmap_band_coverage",
    columns: [pk("band_id"), col("name"), col("status"), col("roadmap_ids"), col("computed_at")],
  },
  {
    name: "roadmap_gate_progress",
    columns: [
      pk("roadmap_gate_id"),
      col("plan_id"),
      col("gate_id"),
      col("total_spans", "INTEGER"),
      col("confirmed_spans", "INTEGER"),
      col("reached", "INTEGER"),
      col("computed_at"),
    ],
  },
  {
    name: "review_evidence_registry",
    columns: [
      pk("review_evidence_id"),
      col("plan_id"),
      col("kind"),
      col("status"),
      col("has_evidence", "INTEGER"),
      col("review_kind"),
      col("verdict"),
      col("reviewed_at"),
      col("tests_green_at"),
      col("worker_model"),
      col("reviewer_model"),
      col("source"),
      col("indexed_at"),
    ],
  },
  {
    name: "descent_obligations",
    columns: [
      pk("descent_obligation_id"),
      col("trace_key"),
      col("from_layer"),
      col("required_layer"),
      col("kind"),
      col("status"),
      col("reason"),
      col("defer_owner"),
      col("defer_spec"),
      col("source"),
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
  {
    name: "idx_issue_queue_plan_status",
    table: "issue_queue",
    columns: ["plan_id", "status", "created_at"],
  },
  {
    name: "idx_trouble_events_plan_category",
    table: "trouble_events",
    columns: ["plan_id", "category", "created_at"],
  },
  {
    name: "idx_retry_events_plan_phase",
    table: "retry_events",
    columns: ["plan_id", "workflow", "phase"],
  },
  {
    name: "idx_improvement_log_status",
    table: "improvement_log",
    columns: ["status", "created_at"],
  },
  { name: "idx_search_subject", table: "search_index", columns: ["subject_type", "subject_id"] },
  {
    name: "idx_graph_node_type_subject",
    table: "graph_nodes",
    columns: ["node_type", "subject_id"],
  },
  { name: "idx_graph_path", table: "graph_nodes", columns: ["path"] },
  {
    name: "idx_dependency_from_kind",
    table: "dependency_edges",
    columns: ["from_node_id", "edge_kind"],
  },
  {
    name: "idx_dependency_to_kind",
    table: "dependency_edges",
    columns: ["to_node_id", "edge_kind"],
  },
  {
    name: "idx_verification_profile_type",
    table: "verification_profiles",
    columns: ["profile_type", "enabled"],
  },
  {
    name: "idx_verification_recommendations_change",
    table: "verification_recommendations",
    columns: ["change_set_id", "profile_kind", "accepted"],
  },
  {
    name: "idx_external_tool_findings_subject",
    table: "external_tool_findings",
    columns: ["subject_id", "status", "severity"],
  },
  {
    name: "idx_document_export_run_family",
    table: "document_export_runs",
    columns: ["source_doc_family", "plan_id"],
  },
  {
    name: "idx_document_export_run_snapshot",
    table: "document_export_runs",
    columns: ["source_snapshot_hash"],
  },
  {
    name: "idx_document_export_artifact_format",
    table: "document_export_artifacts",
    columns: ["format", "stale_status"],
  },
  {
    name: "idx_roadmap_band_status",
    table: "roadmap_band_coverage",
    columns: ["status", "band_id"],
  },
  {
    name: "idx_roadmap_gate_plan",
    table: "roadmap_gate_progress",
    columns: ["plan_id", "reached"],
  },
  {
    name: "idx_review_evidence_plan",
    table: "review_evidence_registry",
    columns: ["plan_id", "has_evidence"],
  },
  {
    name: "idx_descent_obligation_trace_status",
    table: "descent_obligations",
    columns: ["trace_key", "status", "required_layer"],
  },
  {
    name: "idx_skill_evaluations_unused",
    table: "skill_evaluations",
    columns: ["unused_flag", "skill_rating"],
  },
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
