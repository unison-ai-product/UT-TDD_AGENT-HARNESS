import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it, vi } from "vitest";
import { loadGateRunCoverageStats } from "../src/doctor/gate-run-coverage-reconciliation.ts";
import { stableId } from "../src/stable-id.ts";
import * as stateDb from "../src/state-db/index.ts";
import { defaultHarnessDbPath, openHarnessDb } from "../src/state-db/index.ts";
import * as projectionWriter from "../src/state-db/projection-writer.ts";
import { removeTestTree } from "./support/temp-tree.ts";

const EVIDENCE_PATH = ".ut-tdd/gate_runs/gate-run.json";
const CHECKED_AT = "2026-11-26T00:00:00.000Z";
const SYNTHETIC_REJECTED_VALUE = `ghp_${"0".repeat(20)}`;

type WriteKind =
  | "workflow_runs:DELETE"
  | "gate_runs:DELETE"
  | "gate_runs:INSERT"
  | "workflow_runs:INSERT";

function newRepo(label: string): string {
  return mkdtempSync(join(tmpdir(), `ut-tdd-gprv-${label}-`));
}

function writeEvidence(repoRoot: string, gateId = "G4"): void {
  const path = join(repoRoot, ...EVIDENCE_PATH.split("/"));
  mkdirSync(join(repoRoot, ".ut-tdd", "gate_runs"), { recursive: true });
  writeFileSync(
    path,
    `${JSON.stringify({
      schema_version: 1,
      gate_run_id: "gate-run:gprv-fixture",
      gate_id: gateId,
      plan_id: null,
      status: "passed",
      checked_at: CHECKED_AT,
      session_id: "session-gprv-fixture",
      mode: "hybrid",
      tier: "cross_agent",
      review_kind: "cross_agent",
      static_applicable: true,
      source: "ut-tdd gate",
      messages: [],
    })}\n`,
    "utf8",
  );
}

function seedStaleProjection(repoRoot: string): void {
  const db = openHarnessDb(defaultHarnessDbPath(repoRoot), { repoRoot });
  try {
    const gateRunId = "gate-run:gprv-stale";
    db.prepare(
      "INSERT INTO gate_runs (gate_run_id, gate_id, plan_id, status, checked_at, evidence_path) VALUES (?, ?, ?, ?, ?, ?)",
    ).run(gateRunId, "G3", null, "passed", CHECKED_AT, ".ut-tdd/gate_runs/stale.json");
    db.prepare(
      "INSERT INTO workflow_runs (workflow_run_id, plan_id, drive_run_id, workflow, phase, ready_status, blocked_reason, human_required, checked_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    ).run(
      stableId("gate-workflow", gateRunId),
      null,
      "",
      "routine-gate",
      "G3",
      "passed",
      "",
      0,
      CHECKED_AT,
    );
  } finally {
    db.close();
  }
}

function projectionRows(repoRoot: string): {
  gateRuns: Record<string, unknown>[];
  routineGateWorkflows: Record<string, unknown>[];
} {
  const db = openHarnessDb(defaultHarnessDbPath(repoRoot), { repoRoot });
  try {
    return {
      gateRuns: db.prepare("SELECT * FROM gate_runs ORDER BY gate_run_id").all(),
      routineGateWorkflows: db
        .prepare(
          "SELECT * FROM workflow_runs WHERE workflow = 'routine-gate' ORDER BY workflow_run_id",
        )
        .all(),
    };
  } finally {
    db.close();
  }
}

function observeSuccessfulWrites(): { writes: WriteKind[]; restore: () => void } {
  const writes: WriteKind[] = [];
  const open = stateDb.openHarnessDb;
  const spy = vi.spyOn(stateDb, "openHarnessDb").mockImplementation((path, options) => {
    const db = open(path, options);
    return new Proxy(db, {
      get(target, property) {
        if (property === "prepare") {
          return (sql: string) => {
            const statement = target.prepare(sql);
            const kind: WriteKind | undefined = /^\s*DELETE\s+FROM\s+workflow_runs\b/i.test(sql)
              ? "workflow_runs:DELETE"
              : /^\s*DELETE\s+FROM\s+gate_runs\b/i.test(sql)
                ? "gate_runs:DELETE"
                : /^\s*INSERT\s+INTO\s+gate_runs\b/i.test(sql)
                  ? "gate_runs:INSERT"
                  : /^\s*INSERT\s+INTO\s+workflow_runs\b/i.test(sql)
                    ? "workflow_runs:INSERT"
                    : undefined;
            if (!kind) return statement;
            return new Proxy(statement, {
              get(statementTarget, statementProperty) {
                if (statementProperty === "run") {
                  return (...values: unknown[]) => {
                    const run = Reflect.get(statementTarget, "run", statementTarget) as (
                      ...args: unknown[]
                    ) => unknown;
                    const result = Reflect.apply(run, statementTarget, values);
                    writes.push(kind);
                    return result;
                  };
                }
                const value = Reflect.get(statementTarget, statementProperty, statementTarget);
                return typeof value === "function" ? value.bind(statementTarget) : value;
              },
            });
          };
        }
        const value = Reflect.get(target, property, target);
        return typeof value === "function" ? value.bind(target) : value;
      },
    });
  });
  return { writes, restore: () => spy.mockRestore() };
}

function thrownMessage(action: () => unknown): string | undefined {
  try {
    action();
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
  return undefined;
}

describe("CANDIDATE-U-GPRV-001 raw projection INSERT rejection", () => {
  const roots: string[] = [];

  afterAll(() => {
    for (const root of roots) removeTestTree(root);
  });

  it("rejects a synthetic secret-like gate row after stale-row deletes and rolls back", () => {
    const root = newRepo("gate-reject");
    roots.push(root);
    writeEvidence(root, SYNTHETIC_REJECTED_VALUE);
    seedStaleProjection(root);
    const before = projectionRows(root);
    const observer = observeSuccessfulWrites();

    let message: string | undefined;
    try {
      message = thrownMessage(() => loadGateRunCoverageStats(root));
    } finally {
      observer.restore();
    }

    expect(message).toBeDefined();
    expect(message).not.toContain(SYNTHETIC_REJECTED_VALUE);
    expect(observer.writes).toEqual(["workflow_runs:DELETE", "gate_runs:DELETE"]);
    expect(projectionRows(root)).toEqual(before);
  });

  it("rejects a synthetic secret-like workflow row after a successful gate insert and rolls back", () => {
    const root = newRepo("workflow-reject");
    roots.push(root);
    writeEvidence(root);
    seedStaleProjection(root);
    const before = projectionRows(root);
    const collect = projectionWriter.collectGateRunEvidenceProjection;
    const collectSpy = vi
      .spyOn(projectionWriter, "collectGateRunEvidenceProjection")
      .mockImplementation((repoRoot) => {
        const projection = collect(repoRoot);
        const [first, ...rest] = projection.workflowRuns;
        if (!first) throw new Error("fixture requires one workflow projection row");
        projection.workflowRuns = [{ ...first, checked_at: SYNTHETIC_REJECTED_VALUE }, ...rest];
        return projection;
      });
    const observer = observeSuccessfulWrites();

    let message: string | undefined;
    try {
      message = thrownMessage(() => loadGateRunCoverageStats(root));
    } finally {
      observer.restore();
      collectSpy.mockRestore();
    }

    expect(message).toBeDefined();
    expect(message).not.toContain(SYNTHETIC_REJECTED_VALUE);
    expect(observer.writes).toEqual([
      "workflow_runs:DELETE",
      "gate_runs:DELETE",
      "gate_runs:INSERT",
    ]);
    expect(projectionRows(root)).toEqual(before);
  });
});
