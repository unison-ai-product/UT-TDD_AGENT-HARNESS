import type {
  ModelEvaluationReadPort,
  ProjectionEvent,
  ProjectionStore,
} from "../projection/contracts/projection-store";
import type { ModelEvaluationFacts } from "../projection/domain/model-evaluations";
import { PLAN_SUCCESS_STATUSES } from "../projection/domain/plan-status";
import type { PocDecisionCount } from "../projection/domain/poc-evaluations";
import { HARNESS_DB_TABLE_BY_NAME, primaryKeyOf, type TableDef } from "../schema/harness-db";
import { stableId } from "../stable-id";
import { type HarnessDb, SECRET_PATTERN, upsertRow } from "./index";

const RAW_PAYLOAD_KEYS = new Set([
  "rawMcpResponse",
  "browserTrace",
  "providerTranscript",
  "transcript",
  "secret",
  "credential",
  "screenshotBlob",
]);

export interface ProjectionFindingInput {
  kind: string;
  severity?: "error" | "warn" | "info";
  subjectId: string;
  source: string;
  evidencePath?: string;
}

export class SqliteProjectionStore implements ProjectionStore, ModelEvaluationReadPort {
  readonly #db: HarnessDb;

  constructor(db: HarnessDb) {
    this.#db = db;
  }

  record(event: ProjectionEvent): void {
    const table = tableDef(event.table);
    const row = normalizeRow(table, event);
    upsertRow(this.#db, { table: table.name, primaryKey: primaryKeyOf(table), row });
    checkResolvablePlanJoin(this, table.name, row);
  }

  recordFinding(input: ProjectionFindingInput): void {
    upsertRow(this.#db, {
      table: "findings",
      primaryKey: "finding_id",
      row: {
        finding_id: stableId(`finding:${input.kind}`, input.subjectId),
        kind: input.kind,
        severity: input.severity ?? "warn",
        subject_id: input.subjectId,
        source: input.source,
        status: "open",
        evidence_path: input.evidencePath ?? "",
      },
    });
  }

  planExists(planId: string): boolean {
    return (
      this.#db.prepare("SELECT plan_id FROM plan_registry WHERE plan_id = ?").get(planId) !==
      undefined
    );
  }

  readPocDecisionCounts(): readonly PocDecisionCount[] {
    return this.#db
      .prepare(
        `SELECT decision_outcome, COUNT(*) AS cnt
         FROM plan_registry
         WHERE kind = 'poc'
           AND decision_outcome IN ('confirmed', 'rejected', 'pivot')
         GROUP BY decision_outcome`,
      )
      .all() as unknown as PocDecisionCount[];
  }

  readModelEvaluationFacts(): readonly ModelEvaluationFacts[] {
    const placeholders = PLAN_SUCCESS_STATUSES.map(() => "?").join(", ");
    return this.#db
      .prepare(
        `SELECT mr.model,
                COUNT(*) AS run_count,
                SUM(CASE WHEN pr.status IN (${placeholders}) THEN 1 ELSE 0 END) AS success_count,
                COALESCE(SUM(mr.input_tokens), 0) AS total_input_tokens,
                COALESCE(SUM(mr.output_tokens), 0) AS total_output_tokens,
                SUM(mr.cost_usd) AS total_cost_usd
           FROM model_runs mr
           LEFT JOIN plan_registry pr ON mr.plan_id = pr.plan_id
          GROUP BY mr.model
          ORDER BY mr.model`,
      )
      .all(...PLAN_SUCCESS_STATUSES)
      .map(modelEvaluationFacts);
  }

  uniqueShortPlanExists(planId: string): boolean {
    if (!isBareNumericPlanContext(planId)) return false;
    const row = this.#db
      .prepare("SELECT COUNT(*) AS count FROM plan_registry WHERE plan_id LIKE ?")
      .get(`${planId}-%`) as { count: number } | undefined;
    return (row?.count ?? 0) === 1;
  }
}

function modelEvaluationFacts(row: Record<string, unknown>): ModelEvaluationFacts {
  return {
    model: String(row.model ?? ""),
    runCount: Number(row.run_count ?? 0),
    successCount: Number(row.success_count ?? 0),
    totalInputTokens: Number(row.total_input_tokens ?? 0),
    totalOutputTokens: Number(row.total_output_tokens ?? 0),
    totalCostUsd: row.total_cost_usd == null ? null : Number(row.total_cost_usd),
  };
}

function tableDef(name: string): TableDef {
  const table = HARNESS_DB_TABLE_BY_NAME.get(name);
  if (!table) throw new Error(`unknown harness.db projection table: ${name}`);
  return table;
}

function normalizeRow(table: TableDef, event: ProjectionEvent): Record<string, unknown> {
  const allowed = new Set(table.columns.map((column) => column.name));
  const primaryKey = primaryKeyOf(table);
  const row = Object.fromEntries(Object.entries(event.row).filter(([key]) => allowed.has(key)));
  if (row[primaryKey] === undefined) row[primaryKey] = event.id;
  assertNoSensitivePayload(row, table);
  return row;
}

function assertNoSensitivePayload(row: Record<string, unknown>, table: TableDef): void {
  const primaryKeys = new Set(
    table.columns.filter((column) => column.primaryKey).map((column) => column.name),
  );
  for (const [key, value] of Object.entries(row)) {
    if (RAW_PAYLOAD_KEYS.has(key)) {
      throw new Error(`raw/sensitive payload column is not allowed in harness.db: ${key}`);
    }
    const structuredId = primaryKeys.has(key) || key.endsWith("_id");
    if (!structuredId && typeof value === "string" && SECRET_PATTERN.test(value)) {
      throw new Error(`secret-like value is not allowed in harness.db projection column: ${key}`);
    }
  }
}

function checkResolvablePlanJoin(
  store: SqliteProjectionStore,
  table: string,
  row: Record<string, unknown>,
): void {
  if (table === "plan_registry" || table === "feedback_events") return;
  const planId = asString(row.plan_id);
  if (!planId || store.planExists(planId) || store.uniqueShortPlanExists(planId)) return;
  if (/^A-\d/.test(planId) || planId.includes("+")) return;
  const subjectId = `${table}:${String(row[primaryKeyOf(tableDef(table))] ?? "")}`;
  const staleRuntime =
    isBareNumericPlanContext(planId) &&
    (isRuntimeStateEvidencePath(asString(row.evidence_path)) || isRuntimeContextTable(table));
  store.recordFinding({
    kind: staleRuntime ? "stale-runtime-plan-context" : "unresolved-join",
    subjectId,
    source: "projection-writer",
    ...(asString(row.evidence_path) ? { evidencePath: asString(row.evidence_path) as string } : {}),
  });
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function isBareNumericPlanContext(planId: string): boolean {
  return /^PLAN-L\d+-\d+$/.test(planId);
}

function isRuntimeStateEvidencePath(path: string | undefined): boolean {
  return Boolean(path?.startsWith(".ut-tdd/logs/") || path?.startsWith(".ut-tdd/handover/"));
}

function isRuntimeContextTable(table: string): boolean {
  return ["hook_events", "test_runs", "trouble_events", "guardrail_decisions"].includes(table);
}
