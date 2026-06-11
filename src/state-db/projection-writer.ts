import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { DocumentExportProjectionRows } from "../export/document-export";
import type {
  RelationGraphProjection,
  VerificationEvidenceProjection,
} from "../lint/relation-graph";
import {
  computeGateProgress,
  computeProgramRollup,
  loadRoadmaps,
  PARKED_BANDS,
} from "../lint/roadmap-registry";
import { loadReviewPlans } from "../lint/review-evidence";
import { normalizePath } from "../lint/shared";
import {
  HARNESS_DB_TABLE_BY_NAME,
  HARNESS_DB_TABLES,
  primaryKeyOf,
  type TableDef,
} from "../schema/harness-db";
import { defaultHarnessDbPath, type HarnessDb, openHarnessDb, upsertRow } from "./index";
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

const SECRET_PATTERN =
  /(sk-[A-Za-z0-9_-]+|ghp_[A-Za-z0-9_]+|github_pat_[A-Za-z0-9_]+|xox[baprs]-[A-Za-z0-9-]+)/;
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
const VERIFY_CUTOVER_AUDIT_PATH =
  ".ut-tdd/audit/A-132-l8-l14-verification-band-execution.md";
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

function assertNoSensitivePayload(row: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(row)) {
    if (RAW_PAYLOAD_KEYS.has(key)) {
      throw new Error(`raw/sensitive payload column is not allowed in harness.db: ${key}`);
    }
    if (typeof value === "string" && SECRET_PATTERN.test(value)) {
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
  assertNoSensitivePayload(row);
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

function projectPlans(repoRoot: string, db: HarnessDb): void {
  for (const path of markdownFiles(join(repoRoot, "docs", "plans"))) {
    const content = readFileSync(path, "utf8");
    const planId = frontmatterValue(content, "plan_id");
    if (!planId) continue;
    const relPath = normalizePath(path.replace(`${repoRoot}\\`, ""));
    recordProjectionEvent(db, {
      table: "plan_registry",
      id: planId,
      row: {
        plan_id: planId,
        kind: frontmatterValue(content, "kind"),
        layer: frontmatterValue(content, "layer"),
        drive: frontmatterValue(content, "drive"),
        status: frontmatterValue(content, "status") || "draft",
        parent: "",
        updated_at: frontmatterValue(content, "updated") || frontmatterValue(content, "created"),
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
        updated_at: frontmatterValue(content, "updated") || frontmatterValue(content, "created"),
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
        tokens: `${planId} ${frontmatterValue(content, "kind")} ${frontmatterValue(content, "layer")} ${frontmatterValue(content, "drive")}`,
        summary: frontmatterValue(content, "status") || "plan",
        updated_at: frontmatterValue(content, "updated") || frontmatterValue(content, "created"),
      },
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
        drive_run_id: "",
        workflow: "L8-L14-verification-band",
        phase: layer,
        ready_status: localPass ? "passed_local" : "blocked",
        blocked_reason: localPass ? blockedReason : "roadmap, gate, or review evidence projection is incomplete",
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
        coverage_id: stableId("verification-band-coverage", `${metric.subject_id}:${metric.metric}`),
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

export function rebuildHarnessDb(input: RebuildHarnessDbInput = {}): RebuildHarnessDbResult {
  const repoRoot = input.repoRoot ?? process.cwd();
  const ownsDb = input.db === undefined;
  const db = input.db ?? openHarnessDb(defaultHarnessDbPath(repoRoot), { repoRoot });
  try {
    migrate(db);
    truncateProjectionTables(db);
    projectPlans(repoRoot, db);
    projectRoadmapRollup(repoRoot, db);
    projectReviewEvidenceRegistry(repoRoot, db);
    projectVerificationBandExecution(db);
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
