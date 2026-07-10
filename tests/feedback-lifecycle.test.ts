import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  appendFeedbackLifecycle,
  feedbackLifecyclePath,
  parseFeedbackLifecycle,
  resolveFeedbackLifecycle,
} from "../src/feedback/lifecycle";
import { selectTakeoverFeedback } from "../src/feedback/surface";
import { evaluateMemoryPromotion } from "../src/memory/index";
import { stableId } from "../src/stable-id";
import { reconcileFeedbackLifecycle } from "../src/state-db/feedback-projections";
import { openHarnessDb, upsertRow } from "../src/state-db/index";
import { migrate } from "../src/state-db/migration";

describe("feedback lifecycle", () => {
  const open = {
    feedback_event_id: "feedback:test",
    source_generation: "source:1",
    state: "open" as const,
    occurred_at: "2026-07-10T00:00:00Z",
    reason: "observed",
  };

  it("U-MEMORY-005: emits a nudge only after a state change without a successful memory write", () => {
    const base = { ts: "2026-07-10T00:00:00Z", session_id: "s1", plan_id: "PLAN-X" };
    expect(evaluateMemoryPromotion([{ ...base, event_type: "commit", outcome: "ok" }])).toEqual({
      should_nudge: true,
      reason: "state_change_without_memory_write",
    });
    expect(
      evaluateMemoryPromotion([
        { ...base, event_type: "plan_switch", outcome: "ok" },
        { ...base, event_type: "memory_write", outcome: "ok" },
      ]),
    ).toEqual({ should_nudge: false, reason: "memory_written" });
    expect(evaluateMemoryPromotion([{ ...base, event_type: "tool_use", outcome: "ok" }])).toEqual({
      should_nudge: false,
      reason: "no_state_change",
    });
  });

  it("U-MEMORY-006: acknowledges telemetry only after its TTL", () => {
    expect(
      resolveFeedbackLifecycle({
        previous: open,
        source_present: true,
        is_telemetry: true,
        now: "2026-07-10T00:00:10Z",
        telemetry_ttl_ms: 10_000,
      })?.state,
    ).toBe("ack");
    expect(
      resolveFeedbackLifecycle({
        previous: open,
        source_present: true,
        is_telemetry: false,
        now: "2026-07-11T00:00:00Z",
        telemetry_ttl_ms: 1,
      })?.state,
    ).toBe("open");
  });

  it("U-MEMORY-006: closes a lifecycle record only when its source resolves", () => {
    expect(
      resolveFeedbackLifecycle({
        previous: open,
        source_present: false,
        is_telemetry: false,
        now: "2026-07-10T01:00:00Z",
        telemetry_ttl_ms: 1,
      }),
    ).toMatchObject({ state: "closed", reason: "source_resolved" });
  });

  it("U-MEMORY-006: validates JSONL and creates the durable log directory fail-open", () => {
    expect(
      parseFeedbackLifecycle(
        `${JSON.stringify(open)}\n${JSON.stringify({ ...open, state: "invalid" })}\n{bad}\n`,
      ),
    ).toEqual([open]);
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-feedback-lifecycle-"));
    try {
      appendFeedbackLifecycle(root, open);
      expect(readFileSync(feedbackLifecyclePath(root), "utf8")).toContain('"state":"open"');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("U-MEMORY-006: reconciles generation-aware lifecycle and prevents acked fallback resurfacing", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-feedback-reconcile-"));
    const db = openHarnessDb(":memory:", { repoRoot: root });
    let now = "2026-07-10T00:00:00Z";
    const deps = {
      nowIso: () => now,
      stableId,
      recordProjectionEvent: (
        target: typeof db,
        event: { table: string; id: string; row: Record<string, unknown> },
      ) =>
        upsertRow(target, {
          table: event.table,
          primaryKey: "lifecycle_id",
          row: event.row,
        }),
    };
    try {
      migrate(db);
      upsertRow(db, {
        table: "quality_signals",
        primaryKey: "signal_id",
        row: {
          signal_id: "signal:memory",
          source: "test",
          subject_id: "PLAN-X",
          metric: "memory_promotion_missed",
          value: 1,
          threshold: 0,
          status: "warn",
          computed_at: now,
        },
      });
      upsertRow(db, {
        table: "feedback_events",
        primaryKey: "feedback_event_id",
        row: {
          feedback_event_id: "feedback:memory",
          finding_id: "",
          plan_id: "PLAN-X",
          source_table: "quality_signals",
          source_id: "signal:memory",
          source_generation: "generation:1",
          source_color: "",
          signal_type: "memory_promotion_missed",
          severity: "info",
          status: "open",
          next_action: "review memory",
          created_at: now,
        },
      });
      reconcileFeedbackLifecycle(root, db, deps, 1);
      expect(db.prepare("SELECT state FROM feedback_lifecycle").get()).toMatchObject({
        state: "open",
      });

      now = "2026-07-10T00:00:01Z";
      reconcileFeedbackLifecycle(root, db, deps, 1);
      const latest = db
        .prepare(
          "SELECT state FROM feedback_lifecycle ORDER BY occurred_at DESC, lifecycle_id DESC LIMIT 1",
        )
        .get();
      expect(latest).toMatchObject({ state: "ack" });
      expect(selectTakeoverFeedback(db).total).toBe(0);

      db.prepare(
        "UPDATE feedback_events SET source_generation = ? WHERE feedback_event_id = ?",
      ).run("generation:2", "feedback:memory");
      now = "2026-07-10T00:00:02Z";
      reconcileFeedbackLifecycle(root, db, deps, 1);
      expect(
        db
          .prepare(
            "SELECT state FROM feedback_lifecycle WHERE source_generation = ? ORDER BY occurred_at DESC LIMIT 1",
          )
          .get("generation:2"),
      ).toMatchObject({ state: "open" });
      expect(
        db
          .prepare(
            "SELECT state FROM feedback_lifecycle WHERE source_generation = ? ORDER BY occurred_at DESC LIMIT 1",
          )
          .get("generation:1"),
      ).toMatchObject({ state: "superseded" });

      db.prepare("DELETE FROM feedback_events WHERE feedback_event_id = ?").run("feedback:memory");
      now = "2026-07-10T00:00:03Z";
      reconcileFeedbackLifecycle(root, db, deps, 1);
      expect(
        db
          .prepare(
            "SELECT state FROM feedback_lifecycle WHERE source_generation = ? ORDER BY occurred_at DESC LIMIT 1",
          )
          .get("generation:2"),
      ).toMatchObject({ state: "closed" });
    } finally {
      db.close();
      rmSync(root, { recursive: true, force: true });
    }
  });
});
