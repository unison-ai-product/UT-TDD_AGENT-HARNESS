import { describe, expect, it } from "vitest";
import { recordGuardrailDecision } from "../src/guardrail/ledger";
import { openHarnessDb, upsertRow } from "../src/state-db/index";
import { migrate, rowCounts } from "../src/state-db/migration";
import { evaluateAutomationReadiness } from "../src/workflow/readiness";

describe("IT-AUTOMATION-01 / IT-GUARDRAIL-01", () => {
  it("evaluateAutomationReadiness never marks missing evidence as ready", () => {
    const db = openHarnessDb(":memory:");
    try {
      migrate(db);
      upsertRow(db, {
        table: "workflow_runs",
        primaryKey: "workflow_run_id",
        row: {
          workflow_run_id: "workflow-1",
          plan_id: "PLAN-L7-48-readiness-guardrail",
          drive_run_id: "",
          workflow: "Forward",
          phase: "L7",
          ready_status: "pending",
          blocked_reason: "",
          human_required: 0,
          checked_at: "2026-06-11T00:00:00.000Z",
        },
      });

      const rows = evaluateAutomationReadiness(db);

      expect(rows).toContainEqual(
        expect.objectContaining({
          plan_id: "PLAN-L7-48-readiness-guardrail",
          ready_status: "blocked",
          blocked_reason: expect.stringContaining("missing evidence"),
        }),
      );
    } finally {
      db.close();
    }
  });

  it("recordGuardrailDecision stores block decisions for self-review and missing human signoff", () => {
    const db = openHarnessDb(":memory:");
    try {
      migrate(db);

      const selfReview = recordGuardrailDecision(db, {
        plan_id: "PLAN-L7-48-readiness-guardrail",
        session_id: "s1",
        guardrail: "review_evidence",
        decision: "allow",
        mode: "codex-only",
        reviewer_model: "gpt-5.4",
        worker_model: "gpt-5.4",
        evidence_path: ".ut-tdd/evidence/review.json",
      });
      const humanRequired = recordGuardrailDecision(db, {
        plan_id: "PLAN-L7-48-readiness-guardrail",
        session_id: "s1",
        guardrail: "pii_scope",
        decision: "human-required",
        mode: "codex-only",
        human_signoff_required: true,
        evidence_path: "",
      });

      expect(selfReview.decision).toBe("block");
      expect(humanRequired.decision).toBe("block");
      expect(rowCounts(db).guardrail_decisions).toBe(2);
    } finally {
      db.close();
    }
  });
});
