import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { parse as parseYaml } from "yaml";
import type { DocumentExportProjectionRows } from "../export/document-export";
import {
  analyzeDescentObligations,
  loadDeferLedger,
  loadDescentAdjacency,
  loadTraceKeyedArtifacts,
} from "../lint/descent-obligation";
import type {
  RelationGraphProjection,
  VerificationEvidenceProjection,
} from "../lint/relation-graph";
import { loadReviewPlans } from "../lint/review-evidence";
import {
  computeGateProgress,
  computeProgramRollup,
  loadRoadmaps,
  PARKED_BANDS,
} from "../lint/roadmap-registry";
import { normalizePath } from "../lint/shared";
import {
  HARNESS_DB_TABLE_BY_NAME,
  HARNESS_DB_TABLES,
  primaryKeyOf,
  type TableDef,
} from "../schema/harness-db";
import { type GuardrailDecisionInput, inspectGuardrailInvariants } from "./guardrail-invariants";
import {
  defaultHarnessDbPath,
  type HarnessDb,
  openHarnessDb,
  SECRET_PATTERN,
  upsertRow,
} from "./index";
import { migrate, rowCounts } from "./migration";

export interface ProjectionEvent {
  table: string;
  id: string;
  row: Record<string, unknown>;
}

export interface RebuildHarnessDbInput {
  repoRoot?: string;
  db?: HarnessDb;
  relationGraph?: RelationGraphProjection;
  documentExports?: DocumentExportProjectionRows;
  verificationEvidence?: VerificationEvidenceProjection;
}

export interface RebuildHarnessDbResult {
  ok: boolean;
  path: string;
  rowCounts: Record<string, number>;
  findings: string[];
  inputs: {
    relationGraph?: RelationGraphProjection;
    documentExports?: DocumentExportProjectionRows;
    verificationEvidence?: VerificationEvidenceProjection;
  };
}

interface ProjectedPlan {
  planId: string;
  kind: string;
  layer: string;
  drive: string;
  status: string;
  updatedAt: string;
}

interface PlanDigestProjection {
  plan_id: string;
  sessions?: string[];
  event_counts?: Record<string, number>;
  updated_at?: string;
}

interface SessionLogProjection {
  ts?: string;
  session_id?: string;
  plan_id?: string | null;
  event_type?: string;
  tool?: string;
  outcome?: string;
}

interface ProviderHandoverProjection {
  handover_id?: string;
  from?: string;
  to?: string;
  active_plan?: string;
  created_at?: string;
  context?: {
    summary?: string;
  };
}

const RAW_PAYLOAD_KEYS = new Set([
  "rawMcpResponse",
  "browserTrace",
  "providerTranscript",
  "transcript",
  "secret",
  "credential",
  "screenshotBlob",
]);
const VERIFY_CUTOVER_PLAN_ID = "PLAN-M-00-verify-cutover";
const VERIFY_CUTOVER_AUDIT_PATH = ".ut-tdd/audit/A-132-l8-l14-verification-band-execution.md";
const VERIFICATION_BAND_LAYERS = ["L8", "L9", "L10", "L11", "L12", "L13", "L14"] as const;

function tableDef(name: string): TableDef {
  const table = HARNESS_DB_TABLE_BY_NAME.get(name);
  if (!table) throw new Error(`unknown harness.db projection table: ${name}`);
  return table;
}

function nowIso(): string {
  return new Date().toISOString();
}

function stableId(prefix: string, value: string): string {
  return `${prefix}:${value.replace(/[^A-Za-z0-9._:-]+/g, "-")}`;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function scalarNumber(db: HarnessDb, sql: string, params: unknown[] = []): number {
  const row = db.prepare(sql).get(...params) as Record<string, unknown> | undefined;
  const value = row?.value;
  return typeof value === "number" ? value : Number(value ?? 0);
}

function assertNoSensitivePayload(row: Record<string, unknown>, table: TableDef): void {
  // Primary-key columns are structured identifiers (e.g. "skill:planning-and-task-breakdown"),
  // not free-form text. Exempt them from the secret-pattern check to avoid false positives
  // (e.g. "sk-breakdown" inside a skill ID matching the sk-* pattern).
  const pkNames = new Set(table.columns.filter((c) => c.primaryKey).map((c) => c.name));
  for (const [key, value] of Object.entries(row)) {
    if (RAW_PAYLOAD_KEYS.has(key)) {
      throw new Error(`raw/sensitive payload column is not allowed in harness.db: ${key}`);
    }
    if (!pkNames.has(key) && typeof value === "string" && SECRET_PATTERN.test(value)) {
      throw new Error(`secret-like value is not allowed in harness.db projection column: ${key}`);
    }
  }
}

function normalizeRow(table: TableDef, event: ProjectionEvent): Record<string, unknown> {
  const allowed = new Set(table.columns.map((c) => c.name));
  const pk = primaryKeyOf(table);
  const row: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(event.row)) {
    if (allowed.has(key)) row[key] = value;
  }
  if (row[pk] === undefined) row[pk] = event.id;
  assertNoSensitivePayload(row, table);
  return row;
}

function planExists(db: HarnessDb, planId: string): boolean {
  const row = db.prepare("SELECT plan_id FROM plan_registry WHERE plan_id = ?").get(planId);
  return row !== undefined;
}

function findingId(kind: string, subjectId: string): string {
  return stableId(`finding:${kind}`, subjectId);
}

function recordFinding(
  db: HarnessDb,
  input: {
    kind: string;
    severity?: "error" | "warn" | "info";
    subjectId: string;
    source: string;
    evidencePath?: string;
  },
): void {
  upsertRow(db, {
    table: "findings",
    primaryKey: "finding_id",
    row: {
      finding_id: findingId(input.kind, input.subjectId),
      kind: input.kind,
      severity: input.severity ?? "warn",
      subject_id: input.subjectId,
      source: input.source,
      status: "open",
      evidence_path: input.evidencePath ?? "",
    },
  });
}

function checkResolvablePlanJoin(db: HarnessDb, table: string, row: Record<string, unknown>): void {
  if (table === "plan_registry") return;
  const planId = asString(row.plan_id);
  if (!planId || planExists(db, planId)) return;
  const pk = primaryKeyOf(tableDef(table));
  const subject = `${table}:${String(row[pk] ?? "")}`;
  recordFinding(db, {
    kind: "unresolved-join",
    subjectId: subject,
    source: "projection-writer",
    evidencePath: asString(row.evidence_path) ?? undefined,
  });
}

export function recordProjectionEvent(db: HarnessDb, event: ProjectionEvent): void {
  const table = tableDef(event.table);
  const row = normalizeRow(table, event);
  upsertRow(db, {
    table: table.name,
    primaryKey: primaryKeyOf(table),
    row,
  });
  checkResolvablePlanJoin(db, table.name, row);
}

function markdownFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith(".md"))
    .map((name) => join(dir, name))
    .sort();
}

function frontmatterValue(content: string, key: string): string {
  const match = content.match(new RegExp(`^${key}:\\s*"?([^"\\r\\n]+)"?`, "m"));
  return match?.[1]?.trim() ?? "";
}

function markdownFrontmatter(content: string): string {
  if (!content.startsWith("---")) return "";
  const end = content.indexOf("\n---", 3);
  return end < 0 ? "" : content.slice(3, end);
}

function metadataFromContent(path: string, content: string): Record<string, unknown> {
  const raw = /\.md$/i.test(path) ? markdownFrontmatter(content) : content;
  if (!raw.trim()) return {};
  const parsed = parseYaml(raw);
  return parsed && typeof parsed === "object" && !Array.isArray(parsed)
    ? (parsed as Record<string, unknown>)
    : {};
}

function stringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
  }
  if (typeof value === "string" && value.trim().length > 0) {
    return value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
}

function workflowModeForPlan(planId: string): string {
  if (planId.startsWith("PLAN-DISCOVERY-")) return "Discovery";
  if (planId.startsWith("PLAN-REVERSE-")) return "Reverse";
  if (planId.startsWith("PLAN-RECOVERY-")) return "Recovery";
  if (planId.startsWith("PLAN-M-")) return "Verification";
  return "Forward";
}

function skillDriveModelForPlan(planId: string): string {
  if (planId.startsWith("PLAN-DISCOVERY-")) return "Discovery";
  if (planId.startsWith("PLAN-REVERSE-")) return "Reverse";
  if (planId.startsWith("PLAN-RECOVERY-")) return "Recovery";
  return "Forward";
}

function readJson<T>(path: string): T | null {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch {
    return null;
  }
}

function projectPlans(repoRoot: string, db: HarnessDb): Map<string, ProjectedPlan> {
  const plans = new Map<string, ProjectedPlan>();
  for (const path of markdownFiles(join(repoRoot, "docs", "plans"))) {
    const content = readFileSync(path, "utf8");
    const planId = frontmatterValue(content, "plan_id");
    if (!planId) continue;
    const kind = frontmatterValue(content, "kind");
    const layer = frontmatterValue(content, "layer");
    const drive = frontmatterValue(content, "drive");
    const status = frontmatterValue(content, "status") || "draft";
    const updatedAt = frontmatterValue(content, "updated") || frontmatterValue(content, "created");
    // decision_outcome: S4 verdict for PoC PLANs (confirmed/rejected/pivot).
    // Read from `decision_outcome` frontmatter field; fall back to `decision` for legacy.
    // Stored as "" when absent so the column is always TEXT (single-source: harness-db.ts §plan_registry).
    const decisionOutcome =
      frontmatterValue(content, "decision_outcome") || frontmatterValue(content, "decision") || "";
    plans.set(planId, { planId, kind, layer, drive, status, updatedAt });
    const relPath = normalizePath(relative(repoRoot, path));
    recordProjectionEvent(db, {
      table: "plan_registry",
      id: planId,
      row: {
        plan_id: planId,
        kind,
        layer,
        drive,
        status,
        parent: "",
        updated_at: updatedAt,
        decision_outcome: decisionOutcome,
      },
    });
    recordProjectionEvent(db, {
      table: "artifact_registry",
      id: stableId("artifact", relPath),
      row: {
        artifact_id: stableId("artifact", relPath),
        artifact_type: "markdown_doc",
        path: relPath,
        pair_artifact: "",
        status: "current",
        updated_at: updatedAt,
      },
    });
    recordProjectionEvent(db, {
      table: "search_index",
      id: stableId("plan", planId),
      row: {
        search_id: stableId("plan", planId),
        subject_type: "plan",
        subject_id: planId,
        path: relPath,
        title: frontmatterValue(content, "title") || planId,
        tokens: `${planId} ${kind} ${layer} ${drive}`,
        summary: status || "plan",
        updated_at: updatedAt,
      },
    });
  }
  return plans;
}

function projectDriveRuns(
  repoRoot: string,
  db: HarnessDb,
  plans: Map<string, ProjectedPlan>,
): void {
  for (const plan of plans.values()) {
    const digest = readJson<PlanDigestProjection>(
      join(repoRoot, ".ut-tdd", "logs", "plan", `${plan.planId}.digest.json`),
    );
    const sessions = ["", ...(digest?.sessions ?? [])];
    for (const sessionId of sessions) {
      const id = stableId("drive-run", `${plan.planId}:${sessionId || "documented"}`);
      const completed = (digest?.event_counts?.session_end ?? 0) > 0;
      recordProjectionEvent(db, {
        table: "drive_runs",
        id,
        row: {
          drive_run_id: id,
          plan_id: plan.planId,
          session_id: sessionId,
          drive: plan.drive,
          mode: workflowModeForPlan(plan.planId),
          layer: plan.layer,
          kind: plan.kind,
          started_at: plan.updatedAt || digest?.updated_at || "",
          completed_at: completed ? (digest?.updated_at ?? "") : "",
          status: sessionId ? (completed ? "completed" : "active") : plan.status || "documented",
        },
      });
    }
  }
}

function resolveProjectedPlanId(plans: Map<string, ProjectedPlan>, planId: string): string {
  if (plans.has(planId)) return planId;
  return [...plans.keys()].find((id) => id.startsWith(`${planId}-`)) ?? planId;
}

function projectHookEvents(
  repoRoot: string,
  db: HarnessDb,
  plans: Map<string, ProjectedPlan>,
): void {
  const sessionDir = join(repoRoot, ".ut-tdd", "logs", "session");
  if (existsSync(sessionDir)) {
    for (const file of readdirSync(sessionDir)
      .filter((name) => name.endsWith(".jsonl"))
      .sort()) {
      const path = join(sessionDir, file);
      const relPath = normalizePath(relative(repoRoot, path));
      for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
        if (!line.trim()) continue;
        let event: SessionLogProjection;
        try {
          event = JSON.parse(line) as SessionLogProjection;
        } catch {
          continue;
        }
        if (!event.session_id || !event.plan_id || !event.event_type) continue;
        const hookName =
          event.event_type === "session_start"
            ? "SessionStart"
            : event.event_type === "session_end"
              ? "Stop"
              : event.event_type === "forced_stop"
                ? "ForcedStop"
                : "PostToolUse";
        const id = stableId(
          "hook-event",
          `${event.session_id}:${event.plan_id}:${event.ts ?? ""}:${event.event_type}`,
        );
        recordProjectionEvent(db, {
          table: "hook_events",
          id,
          row: {
            event_id: id,
            session_id: event.session_id,
            plan_id: resolveProjectedPlanId(plans, event.plan_id),
            hook_name: hookName,
            event_type: event.event_type,
            occurred_at: event.ts ?? "",
            digest: event.outcome ?? "",
            evidence_path: relPath,
          },
        });
      }
    }
  }

  const providerDir = join(repoRoot, ".ut-tdd", "handover", "provider");
  if (!existsSync(providerDir)) return;
  for (const file of readdirSync(providerDir)
    .filter((name) => name.endsWith(".json"))
    .sort()) {
    const path = join(providerDir, file);
    const relPath = normalizePath(relative(repoRoot, path));
    const handover = readJson<ProviderHandoverProjection>(path);
    const rawPlanId = asString(handover?.active_plan);
    if (!rawPlanId) continue;
    const planId = resolveProjectedPlanId(plans, rawPlanId);
    const handoverId = asString(handover?.handover_id) ?? file.replace(/\.json$/, "");
    const id = stableId("hook-event", `provider:${handoverId}:${planId}`);
    recordProjectionEvent(db, {
      table: "hook_events",
      id,
      row: {
        event_id: id,
        session_id: handoverId,
        plan_id: planId,
        hook_name: "ProviderHandover",
        event_type: "provider_handover",
        occurred_at: handover?.created_at ?? "",
        digest: handover?.context?.summary ?? `${handover?.from ?? ""}->${handover?.to ?? ""}`,
        evidence_path: relPath,
      },
    });
  }
}

function runtimeForModel(model: string): string {
  if (/claude/i.test(model)) return "claude";
  if (/gpt|codex/i.test(model)) return "codex";
  return "";
}

function projectReviewModelRuns(
  repoRoot: string,
  db: HarnessDb,
  plans: Map<string, ProjectedPlan>,
): void {
  for (const plan of loadReviewPlans(repoRoot)) {
    const meta = plans.get(plan.plan_id);
    plan.crossEntries.forEach((entry, index) => {
      for (const role of ["worker", "reviewer"] as const) {
        const model = role === "worker" ? entry.worker_model : entry.reviewer_model;
        if (!model) continue;
        const id = stableId("model-run", `${plan.plan_id}:${index}:${role}:${model}`);
        recordProjectionEvent(db, {
          table: "model_runs",
          id,
          row: {
            run_id: id,
            runtime: runtimeForModel(model),
            model,
            role,
            drive: meta?.drive ?? "",
            plan_id: plan.plan_id,
            started_at: entry.tests_green_at ?? entry.reviewed_at ?? "",
            completed_at: entry.reviewed_at ?? "",
            evidence_path: normalizePath(join("docs", "plans", plan.file)),
          },
        });
      }
    });
  }
}

function planStatusMap(repoRoot: string): Map<string, string> {
  return new Map(loadReviewPlans(repoRoot).map((plan) => [plan.plan_id, plan.status]));
}

function projectRoadmapRollup(repoRoot: string, db: HarnessDb): void {
  const records = loadRoadmaps(repoRoot);
  const statuses = planStatusMap(repoRoot);
  const statusOf = (planId: string): string | null => statuses.get(planId) ?? null;
  const rollup = computeProgramRollup(records, statusOf, new Set(PARKED_BANDS.keys()));
  const computedAt = nowIso();

  recordProjectionEvent(db, {
    table: "roadmap_rollups",
    id: "program",
    row: {
      rollup_id: "program",
      total_bands: rollup.totalBands,
      covered_bands: rollup.coveredBands,
      parked_bands: rollup.parkedBands,
      uncovered_bands: rollup.uncoveredBands,
      total_gates: rollup.totalGates,
      reached_gates: rollup.reachedGates,
      total_spans: rollup.totalSpans,
      confirmed_spans: rollup.confirmedSpans,
      frontier: rollup.frontier.join(","),
      computed_at: computedAt,
    },
  });

  for (const band of rollup.perBand) {
    recordProjectionEvent(db, {
      table: "roadmap_band_coverage",
      id: band.bandId,
      row: {
        band_id: band.bandId,
        name: band.name,
        status: band.status,
        roadmap_ids: band.roadmaps.join(","),
        computed_at: computedAt,
      },
    });
  }

  for (const record of records) {
    for (const gate of computeGateProgress(record.roadmap, statusOf)) {
      const id = stableId("roadmap-gate", `${record.planId}:${gate.gateId}`);
      recordProjectionEvent(db, {
        table: "roadmap_gate_progress",
        id,
        row: {
          roadmap_gate_id: id,
          plan_id: record.planId,
          gate_id: gate.gateId,
          total_spans: gate.totalSpans,
          confirmed_spans: gate.confirmedSpans,
          reached: gate.reached ? 1 : 0,
          computed_at: computedAt,
        },
      });
    }
  }
}

function projectReviewEvidenceRegistry(repoRoot: string, db: HarnessDb): void {
  const indexedAt = nowIso();
  for (const plan of loadReviewPlans(repoRoot)) {
    const firstEntry = plan.crossEntries[0];
    const id = stableId("review-evidence", plan.plan_id);
    recordProjectionEvent(db, {
      table: "review_evidence_registry",
      id,
      row: {
        review_evidence_id: id,
        plan_id: plan.plan_id,
        kind: plan.kind,
        status: plan.status,
        has_evidence: plan.hasEvidence ? 1 : 0,
        review_kind: firstEntry?.review_kind ?? "",
        verdict: firstEntry?.verdict ?? "",
        reviewed_at: firstEntry?.reviewed_at ?? "",
        tests_green_at: firstEntry?.tests_green_at ?? "",
        worker_model: firstEntry?.worker_model ?? "",
        reviewer_model: firstEntry?.reviewer_model ?? "",
        source: normalizePath(join("docs", "plans", plan.file)),
        indexed_at: indexedAt,
      },
    });
  }
}

function advisorySubject(rule: string, reviewEvidenceId: string): string {
  // Plan-id-free, stable subject. The warn-first advisory must surface as a
  // feedback event WITHOUT flipping automation readiness, which scans
  // findings.subject_id LIKE '%plan_id%' (severity-agnostic). The hard-gate that
  // would block on this violation stays PO-gated (PLAN-L7-52 C-1 option A).
  const digest = createHash("sha1").update(reviewEvidenceId).digest("hex").slice(0, 12);
  return `guardrail-self-review:${rule}:${digest}`;
}

export function projectGuardrailInvariantAdvisories(db: HarnessDb): void {
  // PLAN-L7-52 C-1 (option C, PO-approved): consult the guardrail invariant SSoT
  // (inspectGuardrailInvariants) against committed review evidence at CLI-rebuild
  // time — no API runtime. Surfaces violations (e.g. reviewer_model ==
  // worker_model self-review) as non-blocking advisory findings only; projected
  // decisions and readiness are unchanged. Empty model strings are passed as
  // undefined so blank evidence never false-positives as same-model.
  const rows = db
    .prepare(
      "SELECT review_evidence_id, plan_id, reviewer_model, worker_model, source FROM review_evidence_registry ORDER BY review_evidence_id",
    )
    .all();
  for (const row of rows) {
    const reviewEvidenceId = String(row.review_evidence_id ?? "");
    const reviewerModel = String(row.reviewer_model ?? "");
    const workerModel = String(row.worker_model ?? "");
    const evidencePath = String(row.source ?? "");
    const input: GuardrailDecisionInput = {
      plan_id: String(row.plan_id ?? ""),
      session_id: "",
      guardrail: "review-self-review",
      decision: "allow",
      mode: "review",
      evidence_path: evidencePath,
      reviewer_model: reviewerModel ? reviewerModel : undefined,
      worker_model: workerModel ? workerModel : undefined,
    };
    for (const violation of inspectGuardrailInvariants(input).violations) {
      recordFinding(db, {
        kind: `guardrail-invariant-advisory:${violation.rule}`,
        severity: "warn",
        subjectId: advisorySubject(violation.rule, reviewEvidenceId),
        source: "guardrail-invariant-advisory",
        evidencePath,
      });
    }
  }
}

function projectDescentObligations(repoRoot: string, db: HarnessDb): void {
  const indexedAt = nowIso();
  const result = analyzeDescentObligations(
    loadTraceKeyedArtifacts(repoRoot),
    loadDescentAdjacency(repoRoot),
    loadDeferLedger(repoRoot),
  );
  for (const obligation of result.obligations) {
    const id = stableId(
      "descent-obligation",
      `${obligation.traceKey}:${obligation.fromLayer}:${obligation.requiredLayer}:${obligation.kind}`,
    );
    recordProjectionEvent(db, {
      table: "descent_obligations",
      id,
      row: {
        descent_obligation_id: id,
        trace_key: obligation.traceKey,
        from_layer: obligation.fromLayer,
        required_layer: obligation.requiredLayer,
        kind: obligation.kind,
        status: obligation.status,
        reason: obligation.reason,
        defer_owner: obligation.defer?.owner ?? "",
        defer_spec: obligation.defer?.waitingSpec ?? "",
        source: "descent-obligation",
        indexed_at: indexedAt,
      },
    });
  }
  for (const violation of result.implAhead) {
    const id = stableId(
      "descent-obligation",
      `${violation.traceKey}:${violation.landedAt}:${violation.waitingLayer}:impl-ahead`,
    );
    recordProjectionEvent(db, {
      table: "descent_obligations",
      id,
      row: {
        descent_obligation_id: id,
        trace_key: violation.traceKey,
        from_layer: violation.landedAt,
        required_layer: violation.waitingLayer,
        kind: "impl-guard",
        status: "impl-ahead",
        reason: violation.waitingSpec,
        defer_owner: violation.owner,
        defer_spec: violation.waitingSpec,
        source: "descent-obligation",
        indexed_at: indexedAt,
      },
    });
  }
  for (const finding of result.findings) {
    recordFinding(db, {
      kind: `descent-${finding.code}`,
      severity: "warn",
      subjectId: finding.traceKey || finding.path || finding.code,
      source: "descent-obligation",
      evidencePath: finding.path,
    });
  }
}

function projectVerificationBandExecution(db: HarnessDb): void {
  if (!planExists(db, VERIFY_CUTOVER_PLAN_ID)) return;

  const programCoveredBands = scalarNumber(
    db,
    "SELECT covered_bands AS value FROM roadmap_rollups WHERE rollup_id = ?",
    ["program"],
  );
  const programTotalBands = scalarNumber(
    db,
    "SELECT total_bands AS value FROM roadmap_rollups WHERE rollup_id = ?",
    ["program"],
  );
  const reachedGates = scalarNumber(
    db,
    "SELECT reached_gates AS value FROM roadmap_rollups WHERE rollup_id = ?",
    ["program"],
  );
  const totalGates = scalarNumber(
    db,
    "SELECT total_gates AS value FROM roadmap_rollups WHERE rollup_id = ?",
    ["program"],
  );
  const passingReviewEvidence = scalarNumber(
    db,
    "SELECT COUNT(*) AS value FROM review_evidence_registry WHERE plan_id IN (?, ?) AND has_evidence = 1 AND verdict = ?",
    [VERIFY_CUTOVER_PLAN_ID, "PLAN-M-01-cutover-backfill", "pass"],
  );
  const checkedAt = nowIso();
  const driveRunId = stableId("drive-run", `${VERIFY_CUTOVER_PLAN_ID}:documented`);
  const localPass =
    programTotalBands > 0 &&
    programCoveredBands === programTotalBands &&
    totalGates > 0 &&
    reachedGates === totalGates &&
    passingReviewEvidence >= 2;

  for (const layer of VERIFICATION_BAND_LAYERS) {
    const humanRequired = layer === "L12" || layer === "L13" ? 1 : 0;
    const blockedReason =
      humanRequired === 1
        ? "production deploy, post-deploy observation, and PO signoff are explicitly outside this local execution band"
        : "";
    recordProjectionEvent(db, {
      table: "workflow_runs",
      id: stableId("verification-band-workflow", layer),
      row: {
        workflow_run_id: stableId("verification-band-workflow", layer),
        plan_id: VERIFY_CUTOVER_PLAN_ID,
        drive_run_id: driveRunId,
        workflow: "L8-L14-verification-band",
        phase: layer,
        ready_status: localPass ? "passed_local" : "blocked",
        blocked_reason: localPass
          ? blockedReason
          : "roadmap, gate, or review evidence projection is incomplete",
        human_required: humanRequired,
        checked_at: checkedAt,
      },
    });
    recordProjectionEvent(db, {
      table: "gate_runs",
      id: stableId("verification-band-gate", layer),
      row: {
        gate_run_id: stableId("verification-band-gate", layer),
        gate_id: `G-VERIFY.${layer}`,
        plan_id: VERIFY_CUTOVER_PLAN_ID,
        status: localPass ? "passed" : "blocked",
        checked_at: checkedAt,
        evidence_path: VERIFY_CUTOVER_AUDIT_PATH,
      },
    });
    recordProjectionEvent(db, {
      table: "coverage",
      id: stableId("verification-band-coverage", `${layer}:local_check_passed`),
      row: {
        coverage_id: stableId("verification-band-coverage", `${layer}:local_check_passed`),
        scope: "verification-band",
        subject_id: layer,
        metric: "local_check_passed",
        value: localPass ? 1 : 0,
        threshold: 1,
        status: localPass ? "passed" : "blocked",
      },
    });
  }

  for (const metric of [
    {
      subject_id: "program",
      metric: "covered_program_bands",
      value: programCoveredBands,
      threshold: programTotalBands,
    },
    {
      subject_id: "program",
      metric: "reached_roadmap_gates",
      value: reachedGates,
      threshold: totalGates,
    },
    {
      subject_id: "review",
      metric: "passing_review_evidence",
      value: passingReviewEvidence,
      threshold: 2,
    },
  ]) {
    const passed = metric.threshold > 0 && metric.value >= metric.threshold;
    recordProjectionEvent(db, {
      table: "coverage",
      id: stableId("verification-band-coverage", `${metric.subject_id}:${metric.metric}`),
      row: {
        coverage_id: stableId(
          "verification-band-coverage",
          `${metric.subject_id}:${metric.metric}`,
        ),
        scope: "verification-band",
        subject_id: metric.subject_id,
        metric: metric.metric,
        value: metric.value,
        threshold: metric.threshold,
        status: passed ? "passed" : "blocked",
      },
    });
  }
}

function truncateProjectionTables(db: HarnessDb): void {
  for (const table of [...HARNESS_DB_TABLES].reverse()) {
    db.prepare(`DELETE FROM ${table.name}`).run();
  }
}

function projectRelationGraph(db: HarnessDb, graph: RelationGraphProjection | undefined): void {
  if (!graph) return;
  const indexedAt = nowIso();
  for (const node of graph.nodes) {
    recordProjectionEvent(db, {
      table: "graph_nodes",
      id: node.id,
      row: {
        node_id: node.id,
        node_type: node.kind,
        subject_id: node.id.split(":").slice(1).join(":"),
        section_id: "",
        path: node.path ?? "",
        name: node.label ?? node.id,
        layer: "",
        kind: node.kind,
        status: "current",
        source: "relation-graph",
        indexed_at: indexedAt,
      },
    });
  }
  for (const edge of graph.edges) {
    const id = stableId("edge", `${edge.from}->${edge.kind}->${edge.to}`);
    recordProjectionEvent(db, {
      table: "dependency_edges",
      id,
      row: {
        edge_id: id,
        from_node_id: edge.from,
        to_node_id: edge.to,
        edge_kind: edge.kind,
        strength: 1,
        source: "relation-graph",
        evidence_path: "",
        is_expected: 1,
        is_actual: 1,
        indexed_at: indexedAt,
      },
    });
  }
  for (const finding of graph.findings) {
    recordFinding(db, {
      kind: finding.code,
      severity: finding.severity,
      subjectId: finding.nodeId ?? finding.code,
      source: "relation-graph",
      evidencePath: finding.evidencePath,
    });
  }
}

function projectDocumentExports(
  db: HarnessDb,
  exportsProjection: DocumentExportProjectionRows | undefined,
): void {
  if (!exportsProjection) return;
  for (const run of exportsProjection.document_export_runs) {
    recordProjectionEvent(db, {
      table: "document_export_runs",
      id: run.document_export_run_id,
      row: {
        document_export_run_id: run.document_export_run_id,
        source_snapshot_hash: run.source_snapshot_hash,
        evidence_path: run.evidence_path,
        normalized_status: "projected",
      },
    });
  }
  for (const dataset of exportsProjection.document_export_datasets) {
    recordProjectionEvent(db, {
      table: "document_export_datasets",
      id: dataset.document_export_dataset_id,
      row: {
        document_export_dataset_id: dataset.document_export_dataset_id,
        export_run_id: dataset.document_export_run_id,
        dataset_kind: dataset.format,
        format: dataset.format,
      },
    });
  }
  for (const artifact of exportsProjection.document_export_artifacts) {
    const id = stableId(
      "document-export-artifact",
      `${artifact.document_export_run_id}:${artifact.artifact_path}`,
    );
    recordProjectionEvent(db, {
      table: "document_export_artifacts",
      id,
      row: {
        document_export_artifact_id: id,
        export_run_id: artifact.document_export_run_id,
        format: artifact.format,
        path: artifact.artifact_path,
        stale_status: artifact.stale ? "stale" : "current",
      },
    });
  }
  for (const finding of exportsProjection.findings) {
    recordFinding(db, {
      kind: finding.code,
      severity: finding.severity,
      subjectId: finding.sourcePath ?? finding.code,
      source: "document-export",
    });
  }
}

function projectVerificationEvidence(
  db: HarnessDb,
  evidence: VerificationEvidenceProjection | undefined,
): void {
  if (!evidence) return;
  for (const profile of evidence.verification_profiles) {
    recordProjectionEvent(db, {
      table: "verification_profiles",
      id: profile.verification_profile_id,
      row: {
        ...profile,
        package_refs: (profile.package_refs ?? []).join(","),
        trigger_signals: (profile.trigger_signals ?? []).join(","),
        requires_docker: profile.requires_docker ? 1 : 0,
        requires_browser: profile.requires_browser ? 1 : 0,
        requires_network: profile.requires_network ? 1 : 0,
        enabled: profile.enabled ? 1 : 0,
      },
    });
  }
  for (const recommendation of evidence.verification_recommendations) {
    recordProjectionEvent(db, {
      table: "verification_recommendations",
      id: recommendation.verification_recommendation_id,
      row: {
        ...recommendation,
        accepted: recommendation.accepted ? 1 : 0,
        created_at: nowIso(),
      },
    });
  }
  for (const run of evidence.mcp_server_runs) {
    recordProjectionEvent(db, {
      table: "mcp_server_runs",
      id: run.mcp_run_id,
      row: { ...run },
    });
  }
  for (const finding of evidence.external_tool_findings) {
    recordProjectionEvent(db, {
      table: "external_tool_findings",
      id: finding.external_finding_id,
      row: {
        ...finding,
        status: finding.status ?? "open",
        created_at: nowIso(),
      },
    });
  }
  for (const finding of evidence.findings) {
    recordFinding(db, {
      kind: finding.code,
      severity: finding.severity,
      subjectId: finding.nodeId ?? finding.code,
      source: "verification-evidence",
      evidencePath: finding.evidencePath,
    });
  }
}

function assetFiles(dir: string, extensions: RegExp): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...assetFiles(path, extensions));
    else if (entry.isFile() && extensions.test(entry.name)) out.push(path);
  }
  return out.sort();
}

function projectAutomationAssets(repoRoot: string, db: HarnessDb): void {
  const indexedAt = nowIso();
  const sources = [
    { type: "skill", root: join(repoRoot, "docs", "skills"), exts: /\.(md|ya?ml)$/i },
    { type: "roster", root: join(repoRoot, ".claude", "agents"), exts: /\.md$/i },
    { type: "command", root: join(repoRoot, "docs", "commands"), exts: /\.md$/i },
  ] as const;
  let assetCount = 0;
  for (const source of sources) {
    for (const path of assetFiles(source.root, source.exts)) {
      const rel = normalizePath(relative(repoRoot, path));
      const content = readFileSync(path, "utf8");
      const metadata = metadataFromContent(path, content);
      const appliesTo =
        metadata.applies_to && typeof metadata.applies_to === "object"
          ? (metadata.applies_to as Record<string, unknown>)
          : {};
      const name =
        (typeof metadata.name === "string" ? metadata.name : "") ||
        frontmatterValue(content, "name") ||
        rel
          .split("/")
          .at(-1)
          ?.replace(/\.(md|ya?ml)$/i, "") ||
        rel;
      const status = /\bhelix\s+codex\b/i.test(content) ? "drift" : "current";
      const assetId = `${source.type}:${name}`;
      const trigger =
        frontmatterValue(content, "triggers") || frontmatterValue(content, "description");
      const role = frontmatterValue(content, "role") || (source.type === "roster" ? name : "");
      const capability =
        frontmatterValue(content, "description") || `${source.type} metadata from ${rel}`;
      const skillType = source.type === "skill" ? String(metadata.skill_type ?? "") : "";
      const appliesLayers =
        source.type === "skill" ? stringList(appliesTo.layers).sort().join(",") : "";
      const appliesDriveModels =
        source.type === "skill" ? stringList(appliesTo.drive_models).sort().join(",") : "";
      recordProjectionEvent(db, {
        table: "automation_assets",
        id: assetId,
        row: {
          asset_id: assetId,
          asset_type: source.type,
          path: rel,
          trigger,
          role,
          capability,
          skill_type: skillType,
          applies_layers: appliesLayers,
          applies_drive_models: appliesDriveModels,
          drift_status: status,
          indexed_at: indexedAt,
        },
      });
      recordProjectionEvent(db, {
        table: "search_index",
        id: stableId("automation-asset", assetId),
        row: {
          search_id: stableId("automation-asset", assetId),
          subject_type: "automation_asset",
          subject_id: assetId,
          path: rel,
          title: name,
          tokens: `${source.type} ${trigger} ${role} ${capability} ${skillType} ${appliesLayers} ${appliesDriveModels}`,
          summary: `${source.type} ${status}`,
          updated_at: indexedAt,
        },
      });
      assetCount += 1;
      if (status === "drift") {
        recordFinding(db, {
          kind: "asset-drift",
          subjectId: assetId,
          source: "projection-writer",
          evidencePath: rel,
        });
      }
    }
  }
  if (assetCount === 0) {
    recordFinding(db, {
      kind: "empty-catalog",
      subjectId: "automation_assets",
      source: "projection-writer",
    });
  }
}

function skillScore(plan: ProjectedPlan, asset: Record<string, unknown>): number {
  const text = [
    asset.asset_id,
    asset.path,
    asset.trigger,
    asset.role,
    asset.capability,
    asset.skill_type,
    asset.applies_layers,
    asset.applies_drive_models,
  ]
    .join(" ")
    .toLowerCase();
  const appliesLayers = String(asset.applies_layers ?? "")
    .split(",")
    .filter(Boolean);
  const appliesDriveModels = String(asset.applies_drive_models ?? "")
    .split(",")
    .filter(Boolean);
  const driveModel = skillDriveModelForPlan(plan.planId);
  let score = 0.2;
  if (appliesLayers.includes(plan.layer)) score += 0.35;
  if (appliesDriveModels.includes(driveModel)) score += 0.35;
  if (text.includes(plan.drive.toLowerCase())) score += 0.1;
  if (/review|checklist|quality|test|lint/.test(text)) score += 0.25;
  return Math.min(1, Number(score.toFixed(2)));
}

function projectSkillTelemetry(db: HarnessDb, plans: Map<string, ProjectedPlan>): void {
  const recordedAt = nowIso();
  const assets = db
    .prepare("SELECT * FROM automation_assets WHERE asset_type = ? ORDER BY asset_id")
    .all("skill")
    // A skill-MAP (index of skills — the W10 curate draft and the future
    // SKILL_MAP.md) is catalogued under docs/skills for asset-drift coverage but
    // is NOT itself a recommendable skill, so it must not enter the ranking.
    .filter((asset) => !String(asset.skill_type ?? "").startsWith("skill-map"));
  for (const plan of plans.values()) {
    const ranked = assets
      .map((asset) => ({ asset, score: skillScore(plan, asset) }))
      .filter((entry) => entry.score > 0)
      .sort(
        (a, b) =>
          b.score - a.score ||
          String(a.asset.asset_id ?? "").localeCompare(String(b.asset.asset_id ?? "")),
      )
      .slice(0, 5);
    const review = db
      .prepare("SELECT has_evidence FROM review_evidence_registry WHERE plan_id = ?")
      .get(plan.planId) as { has_evidence?: number } | undefined;
    const accepted = Number(review?.has_evidence ?? 0) === 1 ? 1 : 0;
    ranked.forEach((entry, index) => {
      const skillId = String(entry.asset.asset_id ?? "");
      const recId = stableId("skill-rec", `${plan.planId}:${skillId}`);
      recordProjectionEvent(db, {
        table: "skill_recommendations",
        id: recId,
        row: {
          skill_recommendation_id: recId,
          session_id: "",
          plan_id: plan.planId,
          skill_id: skillId,
          rank: index + 1,
          score: entry.score,
          reason: `layer=${plan.layer}; technical_drive=${plan.drive}; drive_model=${skillDriveModelForPlan(plan.planId)}; kind=${plan.kind}`,
          recommended_at: recordedAt,
        },
      });
      if (accepted === 1) {
        const invId = stableId("skill-inv", `${plan.planId}:${skillId}:review`);
        recordProjectionEvent(db, {
          table: "skill_invocations",
          id: invId,
          row: {
            skill_invocation_id: invId,
            session_id: "",
            plan_id: plan.planId,
            skill_id: skillId,
            layer: plan.layer,
            drive: plan.drive,
            fired_at: recordedAt,
            source: "auto-projection:review-evidence",
            accepted,
          },
        });
      }
    });
  }
}

function projectSkillMetrics(db: HarnessDb): void {
  const computedAt = nowIso();
  const rows = db
    .prepare(
      `SELECT r.plan_id, r.skill_id,
              COUNT(DISTINCT r.skill_recommendation_id) AS rec,
              COUNT(DISTINCT i.skill_invocation_id) AS inv,
              SUM(CASE WHEN i.accepted = 1 THEN 1 ELSE 0 END) AS acc
       FROM skill_recommendations r
       LEFT JOIN skill_invocations i
         ON i.plan_id = r.plan_id AND i.skill_id = r.skill_id
       GROUP BY r.plan_id, r.skill_id`,
    )
    .all();
  for (const row of rows) {
    const rec = Number(row.rec ?? 0);
    const inv = Number(row.inv ?? 0);
    const acc = Number(row.acc ?? 0);
    const planId = String(row.plan_id ?? "");
    const skillId = String(row.skill_id ?? "");
    const firing = rec === 0 ? 0 : inv / rec;
    const acceptance = inv === 0 ? 0 : acc / inv;
    for (const metric of [
      { name: "skill_firing_rate", value: firing },
      { name: "skill_acceptance_rate", value: acceptance },
    ]) {
      const signalId = stableId("skill-signal", `${planId}:${skillId}:${metric.name}`);
      recordProjectionEvent(db, {
        table: "quality_signals",
        id: signalId,
        row: {
          signal_id: signalId,
          source: "skill-metrics",
          subject_id: `${planId}:${skillId}`,
          metric: metric.name,
          value: Number(metric.value.toFixed(4)),
          threshold: 1,
          status: metric.value < 1 ? "warn" : "pass",
          computed_at: computedAt,
        },
      });
    }
  }
}

/**
 * FR-L1-36: Per-skill evaluation projection.
 *
 * skill_rating = success_count / adoption_count (0.0–1.0).
 * adoption    = distinct plan_id with accepted=1 invocation.
 * success     = adopted plans whose plan_registry.status is a success state.
 *
 * Success states rationale (hardcode-with-reason):
 * - "confirmed" and "completed" are the two terminal-success statuses in use across
 *   all docs/plans/*.md frontmatter (as of 2026-06-15: 149 confirmed, 12 completed).
 *   "draft" and "archived" are explicitly not success.  No other status values appear
 *   in the corpus.  Single source of truth: PLAN frontmatter `status:` field parsed
 *   by projectPlans above.  If new statuses are introduced they must be registered
 *   here and in the schema (CLAUDE.md: ハードコード単一正本化).
 *
 * unused_flag = 1 when no invocation has fired_at within the last 30 days from asOf.
 * AC-FR-BR21-36-01: 5 adopted plans, all 5 success → rating 1.0, unused_flag 0.
 * AC-FR-BR21-36-02: 0 adoption in last 30 days → unused_flag 1; no auto-delete.
 * Cold-start: 0 skill_invocations → 0 evaluation rows.
 */
// Success states that count toward skill_rating numerator.  See rationale above.
const PLAN_SUCCESS_STATUSES = ["confirmed", "completed"] as const;

export function projectSkillEvaluations(db: HarnessDb, opts?: { asOf?: string }): void {
  const evaluatedAt = opts?.asOf ?? nowIso();
  // 30-day window: ISO timestamp 30 days before evaluatedAt.
  const cutoff = new Date(new Date(evaluatedAt).getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Adoption: distinct plan_id per skill_id with accepted=1 invocation.
  const adoptionRows = db
    .prepare(
      `SELECT i.skill_id,
              COUNT(DISTINCT i.plan_id) AS adoption_count,
              MAX(i.fired_at) AS last_fired_at
       FROM skill_invocations i
       WHERE i.accepted = 1
       GROUP BY i.skill_id`,
    )
    .all();

  if (adoptionRows.length === 0) return; // Cold-start: nothing to write.

  const successStatusPlaceholders = PLAN_SUCCESS_STATUSES.map(() => "?").join(", ");

  for (const row of adoptionRows) {
    const skillId = String(row.skill_id ?? "");
    const adoptionCount = Number(row.adoption_count ?? 0);

    // Success count: adopted plans in a success status.
    const successRow = db
      .prepare(
        `SELECT COUNT(DISTINCT i.plan_id) AS success_count
         FROM skill_invocations i
         JOIN plan_registry p ON p.plan_id = i.plan_id
         WHERE i.skill_id = ?
           AND i.accepted = 1
           AND p.status IN (${successStatusPlaceholders})`,
      )
      .get(skillId, ...PLAN_SUCCESS_STATUSES) as { success_count: number } | undefined;

    const successCount = Number(successRow?.success_count ?? 0);
    const skillRating = adoptionCount === 0 ? 0 : Number((successCount / adoptionCount).toFixed(4));

    // unused_flag: no invocation in last 30 days from asOf.
    const recentRow = db
      .prepare(
        `SELECT COUNT(*) AS cnt
         FROM skill_invocations
         WHERE skill_id = ? AND fired_at >= ?`,
      )
      .get(skillId, cutoff) as { cnt: number } | undefined;

    const unusedFlag = Number(recentRow?.cnt ?? 0) === 0 ? 1 : 0;

    recordProjectionEvent(db, {
      table: "skill_evaluations",
      id: skillId,
      row: {
        skill_id: skillId,
        skill_rating: skillRating,
        adoption_count: adoptionCount,
        success_count: successCount,
        unused_flag: unusedFlag,
        evaluated_at: evaluatedAt,
      },
    });
  }
}

/**
 * FR-L1-43: PoC success measurement projection.
 *
 * Identifies PoC PLANs (kind="poc") from plan_registry and reads their
 * decision_outcome ("confirmed" | "rejected" | "pivot").  Projects ONE
 * summary row with id "poc-evaluation:summary".
 *
 * poc_success_rate = confirmed_count / (confirmed + rejected + pivot)
 *   — pivot counts as a non-success outcome (denominator includes it).
 *
 * Decision outcome values rationale (hardcode-with-reason):
 *   "confirmed": S4 verdict = PoC adopted, forward into implementation.
 *   "rejected":  S4 verdict = PoC abandoned; hypothesis falsified.
 *   "pivot":     S4 verdict = PoC pivoted to a different hypothesis.
 *   Only PLANs with a non-empty decision_outcome contribute to the rate;
 *   PoC PLANs without an S4 decision yet (decision_outcome="") are excluded
 *   from the denominator (still pending), matching AC-43-01 intent.
 *   Source single-source: PLAN frontmatter `decision_outcome` field parsed
 *   by projectPlans (harness-db.ts plan_registry.decision_outcome).
 *
 * AC-FR-BR21-43-01: 10 PoC, 6 confirmed / 3 rejected / 1 pivot => rate 0.60.
 * AC-FR-BR21-43-02 cold-start: 0 PoC PLANs => 0 rows, no throw.
 */
const POC_DECISION_VALUES = ["confirmed", "rejected", "pivot"] as const;

export function projectPocEvaluations(db: HarnessDb, opts?: { asOf?: string }): void {
  const evaluatedAt = opts?.asOf ?? nowIso();

  // Count decided PoC PLANs by outcome.
  const rows = db
    .prepare(
      `SELECT decision_outcome, COUNT(*) AS cnt
       FROM plan_registry
       WHERE kind = 'poc'
         AND decision_outcome IN ('confirmed', 'rejected', 'pivot')
       GROUP BY decision_outcome`,
    )
    .all() as { decision_outcome: string; cnt: number }[];

  if (rows.length === 0) return; // Cold-start: no decided PoC PLANs => 0 rows.

  const counts: Record<string, number> = { confirmed: 0, rejected: 0, pivot: 0 };
  for (const row of rows) {
    const outcome = row.decision_outcome as (typeof POC_DECISION_VALUES)[number];
    if (outcome in counts) counts[outcome] = Number(row.cnt ?? 0);
  }

  const confirmedCount = counts.confirmed;
  const rejectedCount = counts.rejected;
  const pivotCount = counts.pivot;
  const totalCount = confirmedCount + rejectedCount + pivotCount;
  const pocSuccessRate = totalCount === 0 ? 0 : Number((confirmedCount / totalCount).toFixed(4));

  recordProjectionEvent(db, {
    table: "poc_evaluations",
    id: "poc-evaluation:summary",
    row: {
      poc_evaluation_id: "poc-evaluation:summary",
      poc_success_rate: pocSuccessRate,
      confirmed_count: confirmedCount,
      rejected_count: rejectedCount,
      pivot_count: pivotCount,
      total_count: totalCount,
      evaluated_at: evaluatedAt,
    },
  });
}

/**
 * FR-L1-38: model evaluation projection (opt-in).
 *
 * Opt-in gate: reads .ut-tdd/config/model-opt-in.yaml under repoRoot.
 * If the file exists AND parses to { enabled: true }, evaluation runs.
 * Otherwise (file absent or enabled != true), writes 0 rows and returns.
 * Default (no file) = disabled. This is deterministic and does not throw.
 *
 * Success inferred by joining model_runs.plan_id -> plan_registry.status
 * IN PLAN_SUCCESS_STATUSES (single-source from this module). No token/cost
 * column exists in the schema; cost-efficiency is a declared follow-up:
 *   - PLAN-L7-53 follow-up: extend model_evaluations with cost_per_success
 *     once token/cost telemetry is available (FR-L1-38 invariant §1).
 *   - Output: per-model row with model (PK), success_rate REAL,
 *     run_count INTEGER, success_count INTEGER, evaluated_at TEXT.
 *
 * AC-38-01: model-A (2 runs, both success) => rate 1.0; model-B (2 runs, 1 success) => rate 0.5.
 * AC-38-02: disabled (no opt-in file) => 0 model_evaluations rows.
 * Cold-start (enabled but 0 model_runs): 0 rows, no throw.
 */
export function projectModelEvaluations(db: HarnessDb, repoRoot: string): void {
  // Opt-in gate: disabled by default.
  const optInPath = join(repoRoot, ".ut-tdd", "config", "model-opt-in.yaml");
  if (!existsSync(optInPath)) return;
  let enabled = false;
  try {
    const raw = readFileSync(optInPath, "utf8");
    const parsed = parseYaml(raw) as Record<string, unknown> | null;
    enabled = parsed != null && parsed.enabled === true;
  } catch {
    // parse failure = treat as disabled (fail-open for opt-in gate)
    return;
  }
  if (!enabled) return;

  // Fetch all model_runs grouped by model.
  const runRows = db
    .prepare("SELECT model, COUNT(*) AS run_count FROM model_runs GROUP BY model")
    .all() as { model: string; run_count: number }[];

  if (runRows.length === 0) return; // Cold-start: 0 model_runs => 0 rows.

  // Build success_count per model by joining model_runs -> plan_registry on plan_id.
  // PLAN_SUCCESS_STATUSES is reused from this module (single-source-of-truth).
  const successStatusPlaceholders = PLAN_SUCCESS_STATUSES.map(() => "?").join(", ");
  const evaluatedAt = nowIso();

  for (const runRow of runRows) {
    const model = runRow.model;
    const runCount = Number(runRow.run_count ?? 0);

    const successCount =
      (
        db
          .prepare(
            `SELECT COUNT(*) AS success_count
           FROM model_runs mr
           JOIN plan_registry pr ON mr.plan_id = pr.plan_id
           WHERE mr.model = ?
             AND pr.status IN (${successStatusPlaceholders})`,
          )
          .get(model, ...PLAN_SUCCESS_STATUSES) as { success_count: number } | undefined
      )?.success_count ?? 0;

    const successRate = runCount === 0 ? 0 : Number((Number(successCount) / runCount).toFixed(4));

    recordProjectionEvent(db, {
      table: "model_evaluations",
      id: model,
      row: {
        model,
        success_rate: successRate,
        run_count: runCount,
        success_count: Number(successCount),
        evaluated_at: evaluatedAt,
      },
    });
  }
}

function projectOperationalMetrics(db: HarnessDb): void {
  const computedAt = nowIso();
  const metrics: {
    subject: string;
    name: string;
    value: number;
    threshold: number;
    status: string;
  }[] = [];
  const driveModes = db
    .prepare("SELECT mode, COUNT(*) AS total FROM drive_runs GROUP BY mode ORDER BY mode")
    .all();
  for (const row of driveModes) {
    const mode = String(row.mode ?? "unknown");
    const total = Number(row.total ?? 0);
    const completed = scalarNumber(
      db,
      "SELECT COUNT(*) AS value FROM drive_runs WHERE mode = ? AND status IN ('completed', 'confirmed', 'documented')",
      [mode],
    );
    const rate = total === 0 ? 0 : completed / total;
    metrics.push({
      subject: `drive:${mode}`,
      name: "drive_firing_rate",
      value: Number(rate.toFixed(4)),
      threshold: 0.8,
      status: rate >= 0.8 ? "pass" : "warn",
    });
  }
  const hookTotal = scalarNumber(db, "SELECT COUNT(*) AS value FROM hook_events");
  const troubleTotal = scalarNumber(
    db,
    "SELECT COUNT(*) AS value FROM hook_events WHERE event_type IN ('forced_stop', 'error', 'failed') OR digest LIKE '%fail%' OR digest LIKE '%error%'",
  );
  metrics.push({
    subject: "hooks",
    name: "trouble_event_rate",
    value: hookTotal === 0 ? 0 : Number((troubleTotal / hookTotal).toFixed(4)),
    threshold: 0,
    status: troubleTotal === 0 ? "pass" : "warn",
  });
  const workflowTotal = scalarNumber(db, "SELECT COUNT(*) AS value FROM workflow_runs");
  const blockedTotal = scalarNumber(
    db,
    "SELECT COUNT(*) AS value FROM workflow_runs WHERE ready_status NOT IN ('passed_local', 'passed', 'ready')",
  );
  const humanTotal = scalarNumber(
    db,
    "SELECT COUNT(*) AS value FROM workflow_runs WHERE human_required = 1",
  );
  const retryGroups = scalarNumber(
    db,
    `SELECT COUNT(*) AS value
     FROM (
       SELECT plan_id, workflow, phase, COUNT(*) AS c
       FROM workflow_runs
       GROUP BY plan_id, workflow, phase
       HAVING c > 1
     )`,
  );
  metrics.push({
    subject: "workflow",
    name: "workflow_blocked_rate",
    value: workflowTotal === 0 ? 0 : Number((blockedTotal / workflowTotal).toFixed(4)),
    threshold: 0,
    status: blockedTotal === 0 ? "pass" : "warn",
  });
  metrics.push({
    subject: "workflow",
    name: "workflow_human_required_rate",
    value: workflowTotal === 0 ? 0 : Number((humanTotal / workflowTotal).toFixed(4)),
    threshold: 0,
    status: humanTotal === 0 ? "pass" : "warn",
  });
  metrics.push({
    subject: "workflow",
    name: "workflow_retry_groups",
    value: retryGroups,
    threshold: 0,
    status: retryGroups === 0 ? "pass" : "warn",
  });
  for (const metric of metrics) {
    const signalId = stableId("telemetry-signal", `${metric.subject}:${metric.name}`);
    recordProjectionEvent(db, {
      table: "quality_signals",
      id: signalId,
      row: {
        signal_id: signalId,
        source: "telemetry-metrics",
        subject_id: metric.subject,
        metric: metric.name,
        value: metric.value,
        threshold: metric.threshold,
        status: metric.status,
        computed_at: computedAt,
      },
    });
  }
}

function projectFeedbackEvents(db: HarnessDb): void {
  const createdAt = nowIso();
  for (const finding of db.prepare("SELECT * FROM findings WHERE status = 'open'").all()) {
    const findingId = String(finding.finding_id ?? "");
    const subject = String(finding.subject_id ?? findingId);
    const id = stableId("feedback:finding", findingId || subject);
    recordProjectionEvent(db, {
      table: "feedback_events",
      id,
      row: {
        feedback_event_id: id,
        finding_id: findingId,
        plan_id: subject.startsWith("PLAN-") ? subject : "",
        signal_type: String(finding.kind ?? "finding"),
        severity: String(finding.severity ?? "warn"),
        status: "open",
        next_action: `review finding ${findingId || subject}`,
        created_at: createdAt,
      },
    });
  }
  for (const signal of db
    .prepare("SELECT * FROM quality_signals WHERE status IN ('fail', 'warn')")
    .all()) {
    const signalId = String(signal.signal_id ?? "");
    const subject = String(signal.subject_id ?? signalId);
    const id = stableId("feedback:signal", signalId || subject);
    recordProjectionEvent(db, {
      table: "feedback_events",
      id,
      row: {
        feedback_event_id: id,
        finding_id: "",
        plan_id: subject.startsWith("PLAN-") ? subject : "",
        signal_type: String(signal.metric ?? "quality_signal"),
        severity: String(signal.status ?? "warn") === "fail" ? "warn" : "info",
        status: "open",
        next_action: `review quality signal ${signalId || subject}`,
        created_at: createdAt,
      },
    });
  }
}

function projectTroubleEvents(db: HarnessDb): void {
  const createdAt = nowIso();
  const hookRows = db
    .prepare(
      `SELECT event_id, plan_id, event_type, digest
       FROM hook_events
       WHERE event_type IN ('forced_stop', 'error', 'failed')
          OR digest LIKE '%fail%'
          OR digest LIKE '%error%'
       ORDER BY occurred_at, event_id`,
    )
    .all();
  for (const row of hookRows) {
    const sourceEventId = String(row.event_id ?? "");
    const category = String(row.event_type ?? "").includes("forced")
      ? "forced_stop"
      : "hook_failure";
    const id = stableId("trouble", sourceEventId);
    recordProjectionEvent(db, {
      table: "trouble_events",
      id,
      row: {
        trouble_event_id: id,
        source_event_id: sourceEventId,
        plan_id: String(row.plan_id ?? ""),
        category,
        severity: "warn",
        summary: String(row.digest ?? category).slice(0, 240),
        status: "open",
        created_at: createdAt,
      },
    });
  }

  for (const signal of db
    .prepare("SELECT * FROM quality_signals WHERE metric = ? AND status IN ('warn', 'fail')")
    .all("trouble_event_rate")) {
    const signalId = String(signal.signal_id ?? "");
    const id = stableId("trouble", signalId);
    recordProjectionEvent(db, {
      table: "trouble_events",
      id,
      row: {
        trouble_event_id: id,
        source_event_id: signalId,
        plan_id: "",
        category: "trouble_rate",
        severity: String(signal.status ?? "warn") === "fail" ? "error" : "warn",
        summary: `trouble_event_rate=${signal.value ?? ""}`,
        status: "open",
        created_at: createdAt,
      },
    });
  }
}

function projectRetryEvents(db: HarnessDb): void {
  const createdAt = nowIso();
  const rows = db
    .prepare(
      `SELECT plan_id, workflow, phase, COUNT(*) AS attempt_count
       FROM workflow_runs
       GROUP BY plan_id, workflow, phase
       HAVING COUNT(*) > 1
       ORDER BY plan_id, workflow, phase`,
    )
    .all();
  for (const row of rows) {
    const planId = String(row.plan_id ?? "");
    const workflow = String(row.workflow ?? "");
    const phase = String(row.phase ?? "");
    const id = stableId("retry", `${planId}:${workflow}:${phase}`);
    recordProjectionEvent(db, {
      table: "retry_events",
      id,
      row: {
        retry_event_id: id,
        plan_id: planId,
        workflow,
        phase,
        attempt_count: Number(row.attempt_count ?? 0),
        status: "open",
        created_at: createdAt,
      },
    });
  }
}

function projectIssueQueue(db: HarnessDb): void {
  const createdAt = nowIso();
  const issueSignals = new Set([
    "trouble_event_rate",
    "workflow_human_required_rate",
    "workflow_retry_groups",
    "workflow_blocked_rate",
  ]);
  const rows = db
    .prepare(
      `SELECT feedback_event_id, plan_id, signal_type, severity, next_action
       FROM feedback_events
       WHERE signal_type IN ('trouble_event_rate', 'workflow_human_required_rate', 'workflow_retry_groups', 'workflow_blocked_rate')
       ORDER BY feedback_event_id`,
    )
    .all();
  for (const row of rows) {
    const signalType = String(row.signal_type ?? "");
    if (!issueSignals.has(signalType)) continue;
    const sourceEventId = String(row.feedback_event_id ?? "");
    const id = stableId("issue-queue", sourceEventId);
    recordProjectionEvent(db, {
      table: "issue_queue",
      id,
      row: {
        issue_queue_id: id,
        source_event_id: sourceEventId,
        plan_id: String(row.plan_id ?? ""),
        target: "github",
        title: `[ut-tdd telemetry] ${signalType}`,
        body: `Dry-run issue candidate from feedback event ${sourceEventId}: ${row.next_action ?? ""}`,
        status: "queued_dry_run",
        human_approval_required: 1,
        approved_by: "",
        approved_at: "",
        external_issue_id: "",
        external_issue_url: "",
        created_at: createdAt,
      },
    });
  }
}

function projectIssueApprovalGuardrails(db: HarnessDb): void {
  const decidedAt = nowIso();
  const rows = db
    .prepare("SELECT * FROM issue_queue WHERE human_approval_required = 1 ORDER BY issue_queue_id")
    .all();
  for (const row of rows) {
    const id = stableId("guardrail", `issue-approval:${row.issue_queue_id ?? ""}`);
    recordProjectionEvent(db, {
      table: "guardrail_decisions",
      id,
      row: {
        guardrail_decision_id: id,
        plan_id: String(row.plan_id ?? ""),
        session_id: "",
        guardrail: "external-github-issue-approval",
        decision: String(row.external_issue_url ?? "")
          ? "approved-created"
          : "requires-human-approval",
        mode: "manual-approval",
        human_signoff_required: String(row.external_issue_url ?? "") ? 0 : 1,
        evidence_path: String(row.issue_queue_id ?? ""),
        decided_at: decidedAt,
      },
    });
  }
}

function projectImprovementLog(db: HarnessDb): void {
  const createdAt = nowIso();
  const issueRows = db.prepare("SELECT * FROM issue_queue ORDER BY issue_queue_id").all();
  for (const row of issueRows) {
    const sourceEventId = String(row.source_event_id ?? "");
    const id = stableId("improvement", sourceEventId || String(row.issue_queue_id ?? ""));
    recordProjectionEvent(db, {
      table: "improvement_log",
      id,
      row: {
        improvement_log_id: id,
        source_event_id: sourceEventId,
        plan_id: String(row.plan_id ?? ""),
        category: "issue_queue",
        summary: String(row.title ?? ""),
        next_action: `review queued issue ${row.issue_queue_id ?? ""}`,
        status: "open",
        created_at: createdAt,
      },
    });
  }

  const retryRows = db.prepare("SELECT * FROM retry_events ORDER BY retry_event_id").all();
  for (const row of retryRows) {
    const id = stableId("improvement", String(row.retry_event_id ?? ""));
    recordProjectionEvent(db, {
      table: "improvement_log",
      id,
      row: {
        improvement_log_id: id,
        source_event_id: String(row.retry_event_id ?? ""),
        plan_id: String(row.plan_id ?? ""),
        category: "retry",
        summary: `${row.workflow ?? ""}/${row.phase ?? ""} attempts=${row.attempt_count ?? ""}`,
        next_action: "review retry/bottleneck pattern",
        status: "open",
        created_at: createdAt,
      },
    });
  }
}

export function rebuildHarnessDb(input: RebuildHarnessDbInput = {}): RebuildHarnessDbResult {
  const repoRoot = input.repoRoot ?? process.cwd();
  const ownsDb = input.db === undefined;
  const db = input.db ?? openHarnessDb(defaultHarnessDbPath(repoRoot), { repoRoot });
  try {
    migrate(db);
    truncateProjectionTables(db);
    const plans = projectPlans(repoRoot, db);
    projectDriveRuns(repoRoot, db, plans);
    projectHookEvents(repoRoot, db, plans);
    projectReviewModelRuns(repoRoot, db, plans);
    projectRoadmapRollup(repoRoot, db);
    projectReviewEvidenceRegistry(repoRoot, db);
    projectGuardrailInvariantAdvisories(db);
    projectDescentObligations(repoRoot, db);
    projectVerificationBandExecution(db);
    projectAutomationAssets(repoRoot, db);
    projectSkillTelemetry(db, plans);
    projectSkillMetrics(db);
    projectSkillEvaluations(db);
    projectPocEvaluations(db);
    projectModelEvaluations(db, repoRoot);
    projectOperationalMetrics(db);
    projectFeedbackEvents(db);
    projectTroubleEvents(db);
    projectRetryEvents(db);
    projectIssueQueue(db);
    projectIssueApprovalGuardrails(db);
    projectImprovementLog(db);
    projectRelationGraph(db, input.relationGraph);
    projectDocumentExports(db, input.documentExports);
    projectVerificationEvidence(db, input.verificationEvidence);
    const counts = rowCounts(db);
    return {
      ok: true,
      path: db.path,
      rowCounts: counts,
      findings: [],
      inputs: {
        relationGraph: input.relationGraph,
        documentExports: input.documentExports,
        verificationEvidence: input.verificationEvidence,
      },
    };
  } finally {
    if (ownsDb) db.close();
  }
}
