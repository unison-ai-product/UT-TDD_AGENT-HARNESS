import { describe, expect, it } from "vitest";
import { openHarnessDb } from "../src/state-db/index";
import { migrate, rowCounts } from "../src/state-db/migration";
import { rebuildHarnessDb, recordProjectionEvent } from "../src/state-db/projection-writer";

describe("IT-DB-01/02: harness.db projection writer", () => {
  it("records normalized projection events idempotently and keeps rows joinable by plan_id", () => {
    const db = openHarnessDb(":memory:");
    try {
      migrate(db);

      recordProjectionEvent(db, {
        table: "plan_registry",
        id: "PLAN-L7-46-projection-writer",
        row: {
          plan_id: "PLAN-L7-46-projection-writer",
          kind: "impl",
          layer: "L7",
          drive: "db",
          status: "draft",
          updated_at: "2026-06-11T00:00:00.000Z",
        },
      });
      recordProjectionEvent(db, {
        table: "gate_runs",
        id: "gate-1",
        row: {
          gate_run_id: "gate-1",
          gate_id: "G-L7DB.B",
          plan_id: "PLAN-L7-46-projection-writer",
          status: "passed",
          checked_at: "2026-06-11T00:01:00.000Z",
          evidence_path: "docs/handover/projection.md",
        },
      });
      recordProjectionEvent(db, {
        table: "gate_runs",
        id: "gate-1",
        row: {
          gate_run_id: "gate-1",
          gate_id: "G-L7DB.B",
          plan_id: "PLAN-L7-46-projection-writer",
          status: "passed",
          checked_at: "2026-06-11T00:01:00.000Z",
          evidence_path: "docs/handover/projection.md",
        },
      });

      expect(rowCounts(db).plan_registry).toBe(1);
      expect(rowCounts(db).gate_runs).toBe(1);
      const joined = db
        .prepare(
          `SELECT g.gate_id, p.plan_id
           FROM gate_runs g
           JOIN plan_registry p ON p.plan_id = g.plan_id
           WHERE g.gate_run_id = ?`,
        )
        .get("gate-1");
      expect(joined).toMatchObject({
        gate_id: "G-L7DB.B",
        plan_id: "PLAN-L7-46-projection-writer",
      });
    } finally {
      db.close();
    }
  });

  it("turns unresolved cross-drive/model joins into findings instead of silently skipping them", () => {
    const db = openHarnessDb(":memory:");
    try {
      migrate(db);

      recordProjectionEvent(db, {
        table: "model_runs",
        id: "run-with-missing-plan",
        row: {
          run_id: "run-with-missing-plan",
          runtime: "codex",
          model: "gpt-5.4",
          role: "se",
          drive: "db",
          plan_id: "PLAN-L7-46-missing",
          started_at: "2026-06-11T00:02:00.000Z",
          completed_at: "2026-06-11T00:03:00.000Z",
          evidence_path: ".ut-tdd/evidence/run.json",
        },
      });

      const finding = db
        .prepare("SELECT kind, severity, subject_id, status FROM findings WHERE subject_id = ?")
        .get("model_runs:run-with-missing-plan");
      expect(finding).toMatchObject({
        kind: "unresolved-join",
        severity: "warn",
        status: "open",
      });
    } finally {
      db.close();
    }
  });

  it("rebuildHarnessDb deterministically projects plans and Phase3 outputs without source mutation", () => {
    const db = openHarnessDb(":memory:");
    try {
      const result = rebuildHarnessDb({
        repoRoot: process.cwd(),
        db,
        relationGraph: {
          nodes: [
            {
              id: "plan:PLAN-L7-46-projection-writer",
              kind: "plan",
              path: "docs/plans/PLAN-L7-46-projection-writer.md",
            },
          ],
          edges: [],
          verificationProfiles: [],
          findings: [],
        },
        documentExports: {
          document_export_runs: [
            {
              document_export_run_id: "export-1",
              source_snapshot_hash: "sha256:test",
              evidence_path: ".ut-tdd/evidence/export.json",
            },
          ],
          document_export_datasets: [
            {
              document_export_dataset_id: "dataset-1",
              document_export_run_id: "export-1",
              format: "markdown",
            },
          ],
          document_export_artifacts: [],
          findings: [],
          actionsTaken: [],
          ok: true,
        },
        verificationEvidence: {
          verification_profiles: [],
          verification_recommendations: [],
          mcp_server_runs: [],
          external_tool_findings: [],
          findings: [],
          ok: true,
        },
      });
      const second = rebuildHarnessDb({
        repoRoot: process.cwd(),
        db,
        relationGraph: result.inputs.relationGraph,
        documentExports: result.inputs.documentExports,
        verificationEvidence: result.inputs.verificationEvidence,
      });

      expect(result.ok).toBe(true);
      expect(second.rowCounts).toEqual(result.rowCounts);
      expect(rowCounts(db).plan_registry).toBeGreaterThan(0);
      expect(rowCounts(db).graph_nodes).toBe(1);
      expect(rowCounts(db).document_export_runs).toBe(1);
    } finally {
      db.close();
    }
  });
});
