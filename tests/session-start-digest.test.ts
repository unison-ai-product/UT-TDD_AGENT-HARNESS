import { afterEach, describe, expect, it } from "vitest";
import {
  renderSessionStartDigest,
  selectScheduleLiveState,
  selectSessionStartDigest,
} from "../src/handover/session-start-digest.ts";
import { type HarnessDb, openHarnessDb, upsertRow } from "../src/state-db/index.ts";
import { migrate } from "../src/state-db/migration.ts";

const opened: HarnessDb[] = [];

function db(): HarnessDb {
  const value = openHarnessDb(":memory:");
  migrate(value);
  opened.push(value);
  return value;
}

function put(
  database: HarnessDb,
  table: string,
  primaryKey: string,
  row: Record<string, unknown>,
): void {
  upsertRow(database, { table, primaryKey, row });
}

function schedule(database: HarnessDb, planId: string, rag: string): void {
  put(database, "schedule_entries", "schedule_entry_id", {
    schedule_entry_id: `schedule:${planId}`,
    plan_id: planId,
    current_location: "U17a: runtime signal join",
    rag,
    status: "confirmed",
    blocked_reason: "",
    source_path: "docs/governance/vmodel-upgrade-schedule.md",
    predecessor_plan_ids: "",
  });
}

afterEach(() => {
  for (const database of opened.splice(0)) database.close();
});

describe("schedule live SessionStart digest", () => {
  it("U-SCHEDULE-LIVE-002: derives effective RAG from the latest live signals", () => {
    const database = db();
    const plans = {
      latestTest: "PLAN-L7-501-latest-test-failed",
      testStatus: "PLAN-L7-502-test-status-failed",
      testExitCode: "PLAN-L7-503-test-exit-failed",
      review: "PLAN-L7-504-review-request-changes",
      gate: "PLAN-L7-505-gate-blocked",
      yellow: "PLAN-L7-506-live-yellow",
      yellowPassing: "PLAN-L7-507-yellow-passing-signals",
      invalidRag: "PLAN-L7-508-invalid-rag",
    };
    for (const planId of Object.values(plans)) {
      schedule(database, planId, planId === plans.invalidRag ? "gren" : "green");
    }
    schedule(database, plans.yellow, "yellow");
    schedule(database, plans.yellowPassing, "yellow");

    put(database, "test_runs", "test_run_id", {
      test_run_id: "test:latest-old-pass",
      plan_id: plans.latestTest,
      exit_code: 0,
      status: "passed",
      completed_at: "2026-07-10T01:00:00Z",
    });
    put(database, "test_runs", "test_run_id", {
      test_run_id: "test:latest-failure",
      plan_id: plans.latestTest,
      exit_code: 1,
      status: "failed",
      completed_at: "2026-07-10T02:00:00Z",
    });
    put(database, "test_runs", "test_run_id", {
      test_run_id: "test:status-failed",
      plan_id: plans.testStatus,
      exit_code: 0,
      status: "failed",
      completed_at: "2026-07-10T02:00:00Z",
    });
    put(database, "test_runs", "test_run_id", {
      test_run_id: "test:exit-failed",
      plan_id: plans.testExitCode,
      exit_code: 1,
      status: "passed",
      completed_at: "2026-07-10T02:00:00Z",
    });
    put(database, "review_evidence_registry", "review_evidence_id", {
      review_evidence_id: "review:request-changes",
      plan_id: plans.review,
      has_evidence: 1,
      verdict: "request-changes",
      status: "draft",
      reviewed_at: "2026-07-10T02:00:00Z",
    });
    put(database, "gate_runs", "gate_run_id", {
      gate_run_id: "gate:blocked",
      gate_id: "G-L7.505",
      plan_id: plans.gate,
      status: "blocked",
      checked_at: "2026-07-10T02:00:00Z",
    });
    put(database, "test_runs", "test_run_id", {
      test_run_id: "test:yellow-failed",
      plan_id: plans.yellow,
      exit_code: 1,
      status: "failed",
      completed_at: "2026-07-10T02:00:00Z",
    });
    put(database, "test_runs", "test_run_id", {
      test_run_id: "test:yellow-passed",
      plan_id: plans.yellowPassing,
      exit_code: 0,
      status: "passed",
      completed_at: "2026-07-10T02:00:00Z",
    });
    put(database, "review_evidence_registry", "review_evidence_id", {
      review_evidence_id: "review:yellow-passed",
      plan_id: plans.yellowPassing,
      has_evidence: 1,
      verdict: "pass",
      status: "accepted",
      reviewed_at: "2026-07-10T02:00:00Z",
    });
    put(database, "gate_runs", "gate_run_id", {
      gate_run_id: "gate:yellow-passed",
      gate_id: "G-L7.507",
      plan_id: plans.yellowPassing,
      status: "passed",
      checked_at: "2026-07-10T02:00:00Z",
    });

    const state = selectScheduleLiveState(database);
    const entry = (planId: string) => state.entries.find((item) => item.plan_id === planId);
    for (const planId of [
      plans.latestTest,
      plans.testStatus,
      plans.testExitCode,
      plans.review,
      plans.gate,
    ]) {
      expect(entry(planId)).toMatchObject({
        authoring_rag: "green",
        effective_rag: "red",
        signal_state: "contradiction",
      });
    }
    expect(entry(plans.latestTest)?.signal_reason).toBe("authoring green conflicts with test");
    expect(entry(plans.review)?.signal_reason).toBe("authoring green conflicts with review");
    expect(entry(plans.gate)?.signal_reason).toBe("authoring green conflicts with gate:G-L7.505");
    expect(entry(plans.yellow)).toMatchObject({
      authoring_rag: "yellow",
      effective_rag: "red",
      signal_state: "aligned",
    });
    expect(entry(plans.yellowPassing)).toMatchObject({
      authoring_rag: "yellow",
      effective_rag: "yellow",
      signal_state: "aligned",
    });
    expect(entry(plans.invalidRag)).toMatchObject({
      authoring_rag: "yellow",
      effective_rag: "yellow",
    });
  });

  it("U-SCHEDULE-LIVE-004: renders one snapshot as the fixed four-stage digest", () => {
    const database = db();
    put(database, "gate_runs", "gate_run_id", {
      gate_run_id: "gate:old",
      gate_id: "G-VERIFY.L8",
      plan_id: "PLAN-M-00-verify-cutover",
      status: "failed",
      checked_at: "2026-07-10T00:00:00Z",
    });
    put(database, "gate_runs", "gate_run_id", {
      gate_run_id: "gate:new",
      gate_id: "G-VERIFY.L8",
      plan_id: "PLAN-M-00-verify-cutover",
      status: "passed",
      checked_at: "2026-07-10T00:00:00Z",
    });
    put(database, "gate_runs", "gate_run_id", {
      gate_run_id: "gate:l9",
      gate_id: "G-VERIFY.L9",
      plan_id: "PLAN-M-00-verify-cutover",
      status: "passed",
      checked_at: "2026-07-10T00:00:00Z",
    });
    for (let index = 1; index <= 7; index += 1) {
      put(database, "feedback_events", "feedback_event_id", {
        feedback_event_id: `feedback:${index}`,
        plan_id: `PLAN-L7-5${index}`,
        signal_type: `action-${index}`,
        severity: "warn",
        status: "open",
        next_action: `review action ${index}`,
        created_at: `2026-07-10T00:00:0${index}Z`,
      });
    }
    put(database, "feedback_events", "feedback_event_id", {
      feedback_event_id: "feedback:telemetry",
      signal_type: "skill_firing_rate",
      severity: "info",
      status: "open",
      next_action: "observe only",
      created_at: "2026-07-10T00:01:00Z",
    });
    // PLAN-L7-468: memory の本文は DB ではなく正本ファイル側 (MemoryService) から渡る。
    // digest は受け取った entries をそのまま描画する契約なので、ここでは呼び元として供給する。
    const memoryFromService = [
      {
        memory_id: "memory:project:vmodel",
        kind: "project" as const,
        title: "V-model engine swap",
        body: "設計を正本として検出系を追従させる。",
        tags: ["engine-swap"],
        source_path: ".ut-tdd/memory/project-vmodel.md",
        updated_at: "2026-07-10T00:00:00Z",
        content_hash: "abc",
      },
    ];

    const transactionEvents: string[] = [];
    let gateReads = 0;
    const snapshotDb: HarnessDb = {
      path: database.path,
      driver: database.driver,
      exec(sql) {
        transactionEvents.push(sql);
        database.exec(sql);
      },
      prepare(sql) {
        if (sql.includes("FROM gate_runs")) gateReads += 1;
        return database.prepare(sql);
      },
      userVersion: () => database.userVersion(),
      setUserVersion: (version) => database.setUserVersion(version),
      close: () => database.close(),
    };
    const digest = selectSessionStartDigest(snapshotDb, ["abc123 feat: live schedule digest"], {
      escalationLines: ["attempt-escalation warning", "subject: 3 consecutive failures"],
      memory: memoryFromService,
    });
    const rendered = renderSessionStartDigest(digest);

    expect(rendered.match(/^\[[1-4]\/4 /gm)).toHaveLength(4);
    expect(rendered).toContain("gate: G-VERIFY.L8=passed");
    expect(rendered).toContain("gate: G-VERIFY.L9=passed");
    expect(rendered).toContain("escalation: attempt-escalation warning");
    expect(rendered).not.toContain("gate: G-VERIFY.L8=failed");
    expect(rendered).toContain("abc123 feat: live schedule digest");
    expect(rendered.match(/review action/g)).toHaveLength(5);
    expect(rendered).toContain("(+2 more actionable");
    expect(rendered).toContain("telemetry summarized: skill_firing_rate=1");
    expect(rendered).not.toContain("observe only");
    expect(rendered).toContain("V-model engine swap");
    expect(transactionEvents).toEqual(["BEGIN", "COMMIT"]);
    expect(gateReads).toBe(1);
  });

  it("U-SCHEDULE-LIVE-005: renders unclaimed inbox backlog in session-start digest", () => {
    const database = db();
    const digest = selectSessionStartDigest(database, ["abc123 feat: backlog visibility"], {
      memory: [],
      unclaimedInbox: {
        workspaceId: "workspace-1",
        pending: 2,
        oldestEntryId: "memory:backlog-1",
        oldestCreatedAt: "2026-08-01T00:00:00Z",
        oldestAgeMs: 1234,
      },
    });
    const rendered = renderSessionStartDigest(digest);

    expect(rendered).toContain(
      "inbox: pending=2 oldest=memory:backlog-1 at=2026-08-01T00:00:00Z age_ms=1234",
    );
  });
});
