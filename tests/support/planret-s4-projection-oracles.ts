import { expect } from "vitest";
import type { HarnessDb } from "../../src/state-db/index.ts";

export function expectPlanFreeSessionProjection(db: HarnessDb, sessionId: string): void {
  expect(db.prepare("SELECT * FROM hook_events WHERE session_id = ?").get(sessionId)).toMatchObject(
    { hook_name: "PostToolUse", event_type: "tool_use", plan_id: null },
  );
  expect(db.prepare("SELECT * FROM test_runs WHERE session_id = ?").get(sessionId)).toMatchObject({
    command: "PowerShell (tsc)",
    shell: "powershell",
    status: "passed",
    plan_id: null,
  });
}

export function expectForcedStopPlanAndNullProjection(db: HarnessDb): void {
  const rows = db
    .prepare(
      "SELECT plan_id, session_id, guardrail, decision, mode, human_signoff_required, evidence_path, decided_at FROM guardrail_decisions",
    )
    .all();
  expect(rows).toHaveLength(2);
  expect(rows.find((row) => row.session_id === "session-guardrail-1")).toMatchObject({
    plan_id: "PLAN-L7-200-runtime-guardrail-provenance",
    session_id: "session-guardrail-1",
    guardrail: "forced-stop",
    decision: "block",
    mode: "runtime-hook",
    human_signoff_required: 0,
    evidence_path: ".ut-tdd/logs/session/session-guardrail-1.jsonl",
    decided_at: "2026-06-29T00:01:00Z",
  });
  expect(rows.find((row) => row.session_id === "session-guardrail-no-plan")).toMatchObject({
    plan_id: null,
    session_id: "session-guardrail-no-plan",
    guardrail: "forced-stop",
    decision: "block",
    mode: "runtime-hook",
  });
}
