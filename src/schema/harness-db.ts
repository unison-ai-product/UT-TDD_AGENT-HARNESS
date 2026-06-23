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

export const SCHEMA_VERSION = 17;

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
      // decision_outcome: S4 verdict for PoC (kind=poc) PLANs.
      // Values: "confirmed" | "rejected" | "pivot" | "" (null/unset stored as "").
      // Source: PLAN frontmatter field `decision_outcome`. Used by projectPocEvaluations (FR-L1-43).
      col("decision_outcome"),
      // source_hash: sha256 of the full PLAN markdown content. Used by drive-db-registration to
      // detect persisted harness.db staleness even when the plan count is unchanged.
      col("source_hash"),
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
      // FR-L1-38 token telemetry (PLAN-L7-57): cross-runtime per-run usage. NULL for review-evidence
      // 由来の行 (token 不明)、token-tracker が session ログ走査で投入した行のみ非 NULL。
      // cached_input/reasoning は runtime により欠ける (Claude=cache_read, Codex=cached_input/reasoning)。
      col("input_tokens", "INTEGER"),
      col("output_tokens", "INTEGER"),
      col("cached_input_tokens", "INTEGER"),
      col("reasoning_tokens", "INTEGER"),
      // cost_usd: provider 非対称の enrichment。Claude=CLAUDE_PRICING で計算可、Codex=OpenAI 単価
      // source 未取得のため NULL (core metric は token 効率、$ は出せる runtime のみ)。
      col("cost_usd", "REAL"),
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
      col("session_id"),
      col("plan_id"),
      col("command"),
      col("runner"),
      col("runtime"),
      col("os"),
      col("shell"),
      col("scope"),
      col("started_at"),
      col("completed_at"),
      col("exit_code", "INTEGER"),
      col("evidence_path"),
      col("output_digest"),
      col("green_definition_id"),
      col("status"),
    ],
  },
  {
    name: "test_cases",
    columns: [
      pk("test_case_id"),
      col("test_run_id"),
      col("test_file"),
      col("test_name"),
      col("plan_id"),
      col("fr_id"),
      col("artifact_id"),
      col("kind"),
      col("oracle_id"),
      col("name"),
      col("first_seen_at"),
      col("last_seen_at"),
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
      col("duration_ms", "REAL"),
      col("failure_digest"),
      col("started_at"),
      col("completed_at"),
      col("message"),
      col("evidence_path"),
    ],
  },
  {
    name: "test_artifact_edges",
    columns: [
      pk("edge_id"),
      col("test_artifact_edge_id"),
      col("test_case_id"),
      col("test_run_id"),
      col("artifact_id"),
      col("plan_id"),
      col("source_path"),
      col("artifact_path"),
      col("edge_kind"),
      col("oracle_id"),
      col("evidence_path"),
    ],
  },
  {
    name: "test_flake_events",
    columns: [
      pk("flake_event_id"),
      col("test_case_id"),
      col("window"),
      col("pass_count", "INTEGER"),
      col("fail_count", "INTEGER"),
      col("flake_score", "REAL"),
      col("computed_at"),
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
    name: "impact_rules",
    columns: [
      pk("impact_rule_id"),
      col("trigger_edge_kind"),
      col("trigger_node_type"),
      col("required_node_type"),
      col("required_action"),
      col("severity"),
      col("gate"),
      col("enabled", "INTEGER"),
    ],
  },
  {
    name: "impact_results",
    columns: [
      pk("impact_result_id"),
      col("change_set_id"),
      col("root_node_id"),
      col("impacted_node_id"),
      col("required_action"),
      col("status"),
      col("reason"),
      col("evidence_path"),
      col("computed_at"),
    ],
  },
  {
    name: "artifact_progress",
    columns: [
      pk("artifact_path"),
      col("artifact_type"),
      col("artifact_hash"),
      col("state"),
      col("color"),
      col("linked_test_ids"),
      col("linked_test_paths"),
      col("linked_test_count", "INTEGER"),
      col("dependency_checked", "INTEGER"),
      col("open_dependency_impacts", "INTEGER"),
      col("recovery_plan_ids"),
      col("reason"),
      col("indexed_at"),
    ],
  },
  {
    name: "tool_runs",
    columns: [
      pk("tool_run_id"),
      col("tool_name"),
      col("tool_version"),
      col("command"),
      col("input_scope"),
      col("exit_code", "INTEGER"),
      col("started_at"),
      col("completed_at"),
      col("evidence_path"),
    ],
  },
  {
    name: "diagram_artifacts",
    columns: [
      pk("diagram_id"),
      col("graph_snapshot_id"),
      col("format"),
      col("path"),
      col("renderer"),
      col("scope"),
      col("created_at"),
      col("evidence_path"),
    ],
  },
  {
    name: "graph_snapshots",
    columns: [
      pk("graph_snapshot_id"),
      col("scope"),
      col("node_count", "INTEGER"),
      col("edge_count", "INTEGER"),
      col("hash"),
      col("created_at"),
      col("source_digest"),
    ],
  },
  {
    name: "mcp_server_profiles",
    columns: [
      pk("mcp_profile_id"),
      col("name"),
      col("package_ref"),
      col("source_url"),
      col("transport"),
      col("command"),
      col("args_digest"),
      col("allowed_tools"),
      col("read_only", "INTEGER"),
      col("requires_network", "INTEGER"),
      col("requires_docker", "INTEGER"),
      col("requires_auth", "INTEGER"),
      col("risk_tier"),
      col("enabled", "INTEGER"),
      col("source"),
      col("indexed_at"),
    ],
  },
  {
    name: "mcp_profile_triggers",
    columns: [
      pk("trigger_id"),
      col("mcp_profile_id"),
      col("signal"),
      col("workflow"),
      col("layer"),
      col("gate"),
      col("reason"),
      col("enabled", "INTEGER"),
    ],
  },
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
    name: "document_export_profiles",
    columns: [
      pk("document_export_profile_id"),
      col("name"),
      col("source_doc_family"),
      col("format"),
      col("renderer"),
      col("package_ref"),
      col("source_url"),
      col("built_in", "INTEGER"),
      col("requires_package", "INTEGER"),
      col("requires_d2", "INTEGER"),
      col("enabled", "INTEGER"),
      col("risk_tier"),
      col("trigger_signals"),
    ],
  },
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
  {
    name: "document_export_triggers",
    columns: [
      pk("trigger_id"),
      col("document_export_profile_id"),
      col("signal"),
      col("workflow"),
      col("layer"),
      col("gate"),
      col("reason"),
      col("enabled", "INTEGER"),
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
  // --- §9.9 PoC success measurement projection (FR-L1-43, PLAN-L7-53) ---
  {
    name: "poc_evaluations",
    columns: [
      pk("poc_evaluation_id"),
      col("poc_success_rate", "REAL"),
      col("confirmed_count", "INTEGER"),
      col("rejected_count", "INTEGER"),
      col("pivot_count", "INTEGER"),
      col("total_count", "INTEGER"),
      col("evaluated_at"),
    ],
  },
  // --- §9.10 model evaluation projection (FR-L1-38, PLAN-L7-53) ---
  // Opt-in: runs only when .ut-tdd/config/model-opt-in.yaml exists with enabled:true.
  // Computes per-model success_rate by joining model_runs.plan_id -> plan_registry.status
  // IN PLAN_SUCCESS_STATUSES. No token/cost columns — cost-efficiency is a declared
  // follow-up (see function-spec.md FR-L1-38 invariant and PLAN-L7-53).
  {
    name: "model_evaluations",
    columns: [
      pk("model"),
      col("success_rate", "REAL"),
      col("run_count", "INTEGER"),
      col("success_count", "INTEGER"),
      col("evaluated_at"),
      // FR-L1-38 cost-efficiency (PLAN-L7-57): token 効率 = cross-runtime core metric、$ は enrichment。
      // token 行が無い (review-evidence のみ) なら totals=0・tokens_per_success/cost_per_success=NULL。
      col("total_input_tokens", "INTEGER"),
      col("total_output_tokens", "INTEGER"),
      col("total_cost_usd", "REAL"),
      // tokens_per_success = total_output_tokens / success_count (provider 非依存、低いほど効率的)。
      col("tokens_per_success", "REAL"),
      // cost_per_success = total_cost_usd / success_count ($ enrichment、cost 不明なら NULL)。
      col("cost_per_success", "REAL"),
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
  // --- §9.11 screen projection (IMP-140): screen entity + FR/BR→画面 trace を doc 正本から projection ---
  // source = screen-list.md §1 (画面 ID/名/カテゴリ/URL/L1参照) + screen-requirements.md §5.5 (画面→BR/UX/FR-L1 逆 trace)。
  // HM-04 (DB 閲覧) / HM-01 (機能一覧→画面) / PM-06 (設計書ビューア) の DB 駆動を可能にする (従来 doc-only)。
  {
    name: "screens",
    columns: [
      pk("screen_id"),
      col("name"),
      col("category"),
      col("url"),
      col("l1_ref"),
      col("status"),
      col("implemented", "INTEGER"),
      col("indexed_at"),
    ],
  },
  {
    name: "screen_trace",
    columns: [
      pk("screen_trace_id"),
      col("screen_id"),
      col("requirement_id"),
      col("requirement_kind"),
      col("relation"),
      col("source"),
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
    name: "idx_impact_change_status",
    table: "impact_results",
    columns: ["change_set_id", "status"],
  },
  {
    name: "idx_artifact_progress_color",
    table: "artifact_progress",
    columns: ["color", "state"],
  },
  {
    name: "idx_artifact_progress_tests",
    table: "artifact_progress",
    columns: ["linked_test_count", "dependency_checked"],
  },
  {
    name: "idx_tool_name_scope",
    table: "tool_runs",
    columns: ["tool_name", "input_scope"],
  },
  {
    name: "idx_diagram_scope_format",
    table: "diagram_artifacts",
    columns: ["scope", "format"],
  },
  {
    name: "idx_mcp_profile_name",
    table: "mcp_server_profiles",
    columns: ["name"],
  },
  {
    name: "idx_mcp_triggers_signal",
    table: "mcp_profile_triggers",
    columns: ["signal", "workflow", "gate"],
  },
  {
    name: "idx_mcp_runs_profile_plan",
    table: "mcp_server_runs",
    columns: ["mcp_profile_id", "plan_id", "started_at"],
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
    name: "idx_document_export_profile_family",
    table: "document_export_profiles",
    columns: ["source_doc_family", "format", "enabled"],
  },
  {
    name: "idx_document_export_triggers_signal",
    table: "document_export_triggers",
    columns: ["signal", "workflow", "gate"],
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
  {
    name: "idx_poc_evaluations_rate",
    table: "poc_evaluations",
    columns: ["poc_success_rate", "evaluated_at"],
  },
  {
    name: "idx_model_evaluations_rate",
    table: "model_evaluations",
    columns: ["success_rate", "evaluated_at"],
  },
  { name: "idx_screens_category", table: "screens", columns: ["category", "screen_id"] },
  {
    name: "idx_screen_trace_screen",
    table: "screen_trace",
    columns: ["screen_id", "requirement_kind"],
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
