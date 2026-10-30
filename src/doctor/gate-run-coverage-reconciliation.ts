import { existsSync } from "node:fs";
import { join } from "node:path";
import { type GateRunCoverageStats } from "../lint/gate-run-coverage.ts";
import { stableId } from "../stable-id.ts";
import { defaultHarnessDbPath, type HarnessDb, openHarnessDb } from "../state-db/index.ts";
import { migrate } from "../state-db/migration.ts";
import {
  collectGateRunEvidenceProjection,
  rebuildHarnessDb,
} from "../state-db/projection-writer.ts";
import { runSqliteTransaction } from "../state-db/sqlite-transaction.ts";

const A132_PATH = ".ut-tdd/audit/A-132-l8-l14-verification-band-execution.md";
const VERIFICATION_LAYERS = ["L8", "L9", "L10", "L11", "L12", "L13", "L14"] as const;

interface GateRunRow {
  gate_run_id: string;
  gate_id: string;
  plan_id: string | null;
  status: string;
  checked_at: string;
  evidence_path: string;
}

interface RoutineGateRow {
  workflow_run_id: string;
  plan_id: string | null;
  workflow: string;
  phase: string;
}

interface ReconciliationFailure {
  readonly orphanGateRuns: number;
  readonly workflowPlansWithoutGateRun: number;
  readonly invalidEvidenceFindings: number;
}

class GateRunCoverageMismatch extends Error {
  readonly failure: ReconciliationFailure;

  constructor(failure: ReconciliationFailure) {
    super("gate-run-coverage evidence and projection mismatch");
    this.failure = failure;
  }
}

function failGateRunCoverage(
  orphanGateRuns = 0,
  workflowPlansWithoutGateRun = 0,
  invalidEvidenceFindings = 0,
): never {
  throw new GateRunCoverageMismatch({
    orphanGateRuns,
    workflowPlansWithoutGateRun,
    invalidEvidenceFindings,
  });
}

function planValue(value: string | null): string {
  return value ?? "";
}

function sameGateRun(left: GateRunRow, right: GateRunRow): boolean {
  return (
    left.gate_run_id === right.gate_run_id &&
    left.gate_id === right.gate_id &&
    planValue(left.plan_id) === planValue(right.plan_id) &&
    left.status === right.status &&
    left.checked_at === right.checked_at &&
    left.evidence_path === right.evidence_path
  );
}

function sameSeed(left: GateRunRow, right: GateRunRow): boolean {
  return (
    left.gate_run_id === right.gate_run_id &&
    left.gate_id === right.gate_id &&
    planValue(left.plan_id) === "" &&
    left.status === "historical" &&
    left.evidence_path === A132_PATH
  );
}

function isSeedLike(row: GateRunRow): boolean {
  return (
    row.evidence_path === A132_PATH ||
    row.status === "historical" ||
    row.gate_id.startsWith("G-VERIFY.")
  );
}

function expectedSeedRows(
  rows: ReturnType<typeof collectGateRunEvidenceProjection>["gateRuns"],
): GateRunRow[] {
  const seeds = rows.filter(isSeedLike);
  const expected = new Map(
    VERIFICATION_LAYERS.map((layer) => [
      stableId("verification-band-gate", layer),
      {
        gate_run_id: stableId("verification-band-gate", layer),
        gate_id: `G-VERIFY.${layer}`,
        plan_id: "",
        status: "historical",
        checked_at: "",
        evidence_path: A132_PATH,
      } satisfies GateRunRow,
    ]),
  );
  if (seeds.length === 0) return [];
  if (seeds.length !== VERIFICATION_LAYERS.length) {
    throw new GateRunCoverageMismatch({
      orphanGateRuns: 0,
      workflowPlansWithoutGateRun: 0,
      invalidEvidenceFindings: 1,
    });
  }
  for (const seed of seeds) {
    const canonical = expected.get(seed.gate_run_id);
    if (!canonical || !sameGateRun(seed, canonical)) {
      throw new GateRunCoverageMismatch({
        orphanGateRuns: 0,
        workflowPlansWithoutGateRun: 0,
        invalidEvidenceFindings: 1,
      });
    }
    expected.delete(seed.gate_run_id);
  }
  if (expected.size > 0) {
    throw new GateRunCoverageMismatch({
      orphanGateRuns: 0,
      workflowPlansWithoutGateRun: 0,
      invalidEvidenceFindings: 1,
    });
  }
  return seeds;
}

function readGateRuns(db: HarnessDb): GateRunRow[] {
  return db
    .prepare(
      "SELECT gate_run_id, gate_id, plan_id, status, checked_at, evidence_path FROM gate_runs",
    )
    .all() as GateRunRow[];
}

function readRoutineGateRows(db: HarnessDb): RoutineGateRow[] {
  return db
    .prepare(
      "SELECT workflow_run_id, plan_id, workflow, phase FROM workflow_runs WHERE workflow = 'routine-gate'",
    )
    .all() as RoutineGateRow[];
}

function count(db: HarnessDb, sql: string): number {
  const row = db.prepare(sql).get() as { value?: number } | undefined;
  return Number(row?.value ?? 0);
}

function currentStats(
  db: HarnessDb,
  failure: ReconciliationFailure = {
    orphanGateRuns: 0,
    workflowPlansWithoutGateRun: 0,
    invalidEvidenceFindings: 0,
  },
): GateRunCoverageStats {
  return {
    gateRuns: count(db, "SELECT COUNT(*) AS value FROM gate_runs"),
    workflowRuns: count(db, "SELECT COUNT(*) AS value FROM workflow_runs"),
    workflowPlansWithoutGateRun: failure.workflowPlansWithoutGateRun,
    orphanGateRuns: failure.orphanGateRuns,
    blankPlanGateRuns: count(
      db,
      "SELECT COUNT(*) AS value FROM gate_runs WHERE COALESCE(plan_id, '') = ''",
    ),
    invalidEvidenceFindings: failure.invalidEvidenceFindings,
  };
}

function verifyWorkflowPair(
  gate: GateRunRow,
  workflow: RoutineGateRow | undefined,
  expectedWorkflowId: string,
): boolean {
  return Boolean(
    workflow &&
      workflow.workflow_run_id === expectedWorkflowId &&
      workflow.workflow === "routine-gate" &&
      workflow.phase === gate.gate_id &&
      planValue(workflow.plan_id) === planValue(gate.plan_id),
  );
}

function insertGateRun(db: HarnessDb, row: GateRunRow): void {
  db.prepare(
    "INSERT INTO gate_runs (gate_run_id, gate_id, plan_id, status, checked_at, evidence_path) VALUES (?, ?, ?, ?, ?, ?)",
  ).run(
    row.gate_run_id,
    row.gate_id,
    planValue(row.plan_id),
    row.status,
    row.checked_at,
    row.evidence_path,
  );
}

function insertRoutineGate(
  db: HarnessDb,
  row: ReturnType<typeof collectGateRunEvidenceProjection>["workflowRuns"][number],
): void {
  db.prepare(
    "INSERT INTO workflow_runs (workflow_run_id, plan_id, drive_run_id, workflow, phase, ready_status, blocked_reason, human_required, checked_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
  ).run(
    row.workflow_run_id,
    row.plan_id,
    row.drive_run_id,
    row.workflow,
    row.phase,
    row.ready_status,
    row.blocked_reason,
    row.human_required,
    row.checked_at,
  );
}

function reconcile(db: HarnessDb, repoRoot: string): GateRunCoverageStats {
  const projection = collectGateRunEvidenceProjection(repoRoot);
  if (projection.findings.length > 0) {
    throw new GateRunCoverageMismatch({
      orphanGateRuns: 0,
      workflowPlansWithoutGateRun: 0,
      invalidEvidenceFindings: projection.findings.length,
    });
  }

  const seeds = expectedSeedRows(projection.gateRuns);
  const sourceRows = projection.gateRuns.filter((row) => !isSeedLike(row));
  const seedById = new Map(seeds.map((row) => [row.gate_run_id, row]));
  const existingGateRows = readGateRuns(db);
  const existingWorkflowRows = readRoutineGateRows(db);
  const workflowById = new Map(existingWorkflowRows.map((row) => [row.workflow_run_id, row]));
  const matchedGateIds = new Set<string>();
  const matchedWorkflowIds = new Set<string>();
  const addGateRows: GateRunRow[] = [];
  const addWorkflowRows: Array<
    ReturnType<typeof collectGateRunEvidenceProjection>["workflowRuns"][number]
  > = [];
  const deleteGateIds: string[] = [];
  const deleteWorkflowIds: string[] = [];
  let orphanGateRuns = 0;

  if (existingGateRows.some((row) => !row.gate_id.trim())) failGateRunCoverage(1);

  for (const row of existingGateRows) {
    if (!isSeedLike(row)) continue;
    const canonical = seedById.get(row.gate_run_id);
    if (!canonical || !sameSeed(row, canonical)) {
      throw new GateRunCoverageMismatch({
        orphanGateRuns: 0,
        workflowPlansWithoutGateRun: 0,
        invalidEvidenceFindings: 1,
      });
    }
    matchedGateIds.add(row.gate_run_id);
  }

  for (const seed of seeds) {
    if (!matchedGateIds.has(seed.gate_run_id)) addGateRows.push(seed);
  }

  for (const expected of sourceRows) {
    const candidateRows = existingGateRows.filter(
      (row) =>
        row.gate_run_id === expected.gate_run_id ||
        row.evidence_path === expected.evidence_path,
    );
    if (candidateRows.length > 1) {
      orphanGateRuns += 1;
      continue;
    }
    const existingGate = candidateRows[0];
    const projectedWorkflow = projection.workflowRuns.find(
      (row) => row.gate_run_id === expected.gate_run_id,
    );
    const expectedWorkflow = projectedWorkflow
      ? { ...projectedWorkflow, plan_id: expected.plan_id }
      : undefined;
    if (
      !expectedWorkflow ||
      expectedWorkflow.workflow_run_id !== stableId("gate-workflow", expected.gate_run_id) ||
      expectedWorkflow.phase !== expected.gate_id ||
      planValue(expectedWorkflow.plan_id) !== planValue(expected.plan_id)
    ) {
      orphanGateRuns += 1;
      continue;
    }
    const existingWorkflow = workflowById.get(expectedWorkflow.workflow_run_id);
    if (!existingGate && !existingWorkflow) {
      addGateRows.push(expected);
      addWorkflowRows.push(expectedWorkflow);
      continue;
    }
    if (!existingGate || !sameGateRun(existingGate, expected)) {
      orphanGateRuns += 1;
      continue;
    }
    matchedGateIds.add(existingGate.gate_run_id);
    if (!verifyWorkflowPair(expected, existingWorkflow, expectedWorkflow.workflow_run_id)) {
      orphanGateRuns += 1;
      continue;
    }
    matchedWorkflowIds.add(expectedWorkflow.workflow_run_id);
  }

  for (const row of existingGateRows) {
    if (matchedGateIds.has(row.gate_run_id) || isSeedLike(row)) continue;
    const expectedWorkflowId = stableId("gate-workflow", row.gate_run_id);
    const workflow = workflowById.get(expectedWorkflowId);
    if (workflow && !verifyWorkflowPair(row, workflow, expectedWorkflowId)) {
      orphanGateRuns += 1;
      continue;
    }
    deleteGateIds.push(row.gate_run_id);
    if (workflow) {
      deleteWorkflowIds.push(workflow.workflow_run_id);
      matchedWorkflowIds.add(workflow.workflow_run_id);
    }
  }

  const unmatchedWorkflows = existingWorkflowRows.filter(
    (row) => !matchedWorkflowIds.has(row.workflow_run_id),
  ).length;
  if (orphanGateRuns > 0 || unmatchedWorkflows > 0) {
    throw new GateRunCoverageMismatch({
      orphanGateRuns,
      workflowPlansWithoutGateRun: unmatchedWorkflows,
      invalidEvidenceFindings: 0,
    });
  }

  for (const workflowRunId of deleteWorkflowIds) {
    db.prepare("DELETE FROM workflow_runs WHERE workflow_run_id = ? AND workflow = 'routine-gate'").run(
      workflowRunId,
    );
  }
  for (const gateRunId of deleteGateIds) {
    db.prepare("DELETE FROM gate_runs WHERE gate_run_id = ?").run(gateRunId);
  }
  for (const row of addGateRows) insertGateRun(db, row);
  for (const row of addWorkflowRows) insertRoutineGate(db, row);

  return currentStats(db);
}

export function loadGateRunCoverageStats(repoRoot: string): GateRunCoverageStats {
  const dbPath = defaultHarnessDbPath(repoRoot);
  const needsRebuild = !existsSync(dbPath);
  const db = openHarnessDb(dbPath, { repoRoot });
  try {
    // Keep the empty schema available for fail-closed diagnostics after a fresh
    // projection rollback; all projection rows still belong to the outer transaction.
    if (needsRebuild) migrate(db);
    try {
      return runSqliteTransaction(db, () => {
        if (needsRebuild) rebuildHarnessDb({ repoRoot, db, skipTokenTelemetry: true });
        return reconcile(db, repoRoot);
      });
    } catch (error) {
      if (error instanceof GateRunCoverageMismatch) return currentStats(db, error.failure);
      throw error;
    }
  } finally {
    db.close();
  }
}
