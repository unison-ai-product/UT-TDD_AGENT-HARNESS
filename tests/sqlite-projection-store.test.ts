import { describe, expect, it } from "vitest";
import { openHarnessDb } from "../src/state-db/index";
import { migrate } from "../src/state-db/migration";
import { clearRebuildableProjectionTables } from "../src/state-db/sqlite-projection-rebuild";
import { SqliteProjectionStore } from "../src/state-db/sqlite-projection-store";

describe("U-DOMAIN-004: SQLite projection adapter", () => {
  it("normalizes schema columns, preserves explicit PK, and fails closed on secrets", () => {
    const db = openHarnessDb(":memory:");
    try {
      migrate(db);
      const store = new SqliteProjectionStore(db);
      expect(() => store.record({ table: "unknown", id: "x", row: {} })).toThrow(/unknown/);

      store.record({
        table: "plan_registry",
        id: "PLAN-L7-STORE-1",
        row: { kind: "impl", status: "draft", ignored_column: "removed" },
      });
      store.record({
        table: "plan_registry",
        id: "event-id-is-not-used",
        row: { plan_id: "PLAN-L7-STORE-2", kind: "impl", status: "draft" },
      });
      expect(db.prepare("SELECT plan_id FROM plan_registry ORDER BY plan_id").all()).toEqual([
        { plan_id: "PLAN-L7-STORE-1" },
        { plan_id: "PLAN-L7-STORE-2" },
      ]);

      expect(() =>
        store.record({
          table: "model_runs",
          id: "secret-run",
          row: { model: `leak sk-${"a".repeat(20)}` },
        }),
      ).toThrow(/secret-like/);
      expect(
        db.prepare("SELECT run_id FROM model_runs WHERE run_id = ?").get("secret-run"),
      ).toBeUndefined();
    } finally {
      db.close();
    }
  });

  it("U-DOMAIN-007: rejects secret-like data from every legacy recordFinding field", () => {
    const db = openHarnessDb(":memory:");
    try {
      migrate(db);
      const store = new SqliteProjectionStore(db);
      const secret = `sk-${"a".repeat(20)}`;
      const safe = {
        kind: "projection-finding",
        severity: "warn" as const,
        subjectId: "projection:subject",
        source: "projection-test",
        evidencePath: "docs/evidence.md",
      };
      for (const field of ["kind", "subjectId", "source", "evidencePath"] as const) {
        expect(() => store.recordFinding({ ...safe, [field]: secret })).toThrow(/secret-like/);
      }
      expect(db.prepare("SELECT finding_id FROM findings").all()).toEqual([]);
    } finally {
      db.close();
    }
  });

  it("classifies unresolved joins while exempting audit and compound contexts", () => {
    const db = openHarnessDb(":memory:");
    try {
      migrate(db);
      const store = new SqliteProjectionStore(db);
      for (const [id, planId] of [
        ["missing", "PLAN-L7-999-missing"],
        ["audit", "A-999-audit"],
        ["compound", "PLAN-L7-1+2"],
      ]) {
        store.record({ table: "model_runs", id, row: { run_id: id, plan_id: planId } });
      }
      store.record({
        table: "test_runs",
        id: "runtime-stale",
        row: {
          test_run_id: "runtime-stale",
          plan_id: "PLAN-L7-999",
          evidence_path: ".ut-tdd/logs/session/test.jsonl",
        },
      });
      expect(db.prepare("SELECT kind, subject_id FROM findings ORDER BY subject_id").all()).toEqual(
        [
          { kind: "unresolved-join", subject_id: "model_runs:missing" },
          { kind: "stale-runtime-plan-context", subject_id: "test_runs:runtime-stale" },
        ],
      );
    } finally {
      db.close();
    }
  });

  it("clears rebuildable rows while retaining refactor debt", () => {
    const db = openHarnessDb(":memory:");
    try {
      migrate(db);
      db.prepare("INSERT INTO plan_registry (plan_id) VALUES (?)").run("PLAN-L7-CLEAR");
      db.prepare("INSERT INTO refactor_candidates (candidate_key) VALUES (?)").run("debt:keep");
      clearRebuildableProjectionTables(db);
      expect(db.prepare("SELECT plan_id FROM plan_registry").all()).toEqual([]);
      expect(db.prepare("SELECT candidate_key FROM refactor_candidates").all()).toEqual([
        { candidate_key: "debt:keep" },
      ]);
    } finally {
      db.close();
    }
  });

  it("groups operational facts without hiding trouble, human, or retry counts", () => {
    const db = openHarnessDb(":memory:");
    try {
      migrate(db);
      const drive = db.prepare(
        "INSERT INTO drive_runs (drive_run_id, mode, status) VALUES (?, ?, ?)",
      );
      for (const [id, status] of [
        ["d1", "completed"],
        ["d2", "confirmed"],
        ["d3", "documented"],
        ["d4", "completed"],
        ["d5", "active"],
      ]) {
        drive.run(id, "forward", status);
      }
      drive.run("d6", null, "completed");
      drive.run("d7", "unknown", "active");
      db.prepare("INSERT INTO hook_events (event_id, event_type, digest) VALUES (?, ?, ?)").run(
        "h1",
        "error",
        "failed",
      );
      db.prepare("INSERT INTO hook_events (event_id, event_type, digest) VALUES (?, ?, ?)").run(
        "h2",
        "tool_use",
        "ok",
      );
      const workflow = db.prepare(
        `INSERT INTO workflow_runs
           (workflow_run_id, plan_id, workflow, phase, ready_status, human_required)
         VALUES (?, ?, ?, ?, ?, ?)`,
      );
      workflow.run("w1", "PLAN-A", "forward", "implement", "ready", 0);
      workflow.run("w2", "PLAN-A", "forward", "implement", "blocked", 1);
      workflow.run("w3", "PLAN-B", "forward", "review", "passed", 1);

      expect(new SqliteProjectionStore(db).readOperationalMetricFacts()).toEqual({
        drives: [
          { mode: "forward", total: 5, completed: 4 },
          { mode: "unknown", total: 2, completed: 1 },
        ],
        hooks: { total: 2, trouble: 1 },
        workflow: { total: 3, blocked: 1, humanRequired: 2, retryGroups: 1 },
      });
    } finally {
      db.close();
    }
  });
});
