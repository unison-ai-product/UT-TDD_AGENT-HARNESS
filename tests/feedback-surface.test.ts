import { describe, expect, it } from "vitest";
import { renderTakeoverFeedback, selectTakeoverFeedback } from "../src/feedback/surface";
import { openHarnessDb, upsertRow } from "../src/state-db/index";
import { migrate } from "../src/state-db/migration";

function insertFinding(
  db: ReturnType<typeof openHarnessDb>,
  id: string,
  severity: string,
  subjectId: string,
): void {
  upsertRow(db, {
    table: "findings",
    primaryKey: "finding_id",
    row: {
      finding_id: id,
      kind: "takeover-drift",
      severity,
      subject_id: subjectId,
      source: "test",
      status: "open",
      evidence_path: "",
    },
  });
}

describe("takeover feedback surface (PLAN-L7-110)", () => {
  it("surfaces open findings from harness.db as takeover feedback (DB が正本、prose でない)", () => {
    const db = openHarnessDb(":memory:");
    try {
      migrate(db);
      insertFinding(db, "finding:takeover-drift:PLAN-L7-110", "warn", "PLAN-L7-110");

      const result = selectTakeoverFeedback(db);
      expect(result.total).toBeGreaterThanOrEqual(1);
      const surfaced = result.items.find((item) => item.plan_id === "PLAN-L7-110");
      expect(surfaced).toBeDefined();
      expect(surfaced?.severity).toBe("warn");

      const block = renderTakeoverFeedback(result);
      expect(block).toContain("harness.db feedback");
      expect(block).toContain("PLAN-L7-110");
    } finally {
      db.close();
    }
  });

  it("renders empty when there is no open feedback (引き継ぎ時にノイズを出さない)", () => {
    const db = openHarnessDb(":memory:");
    try {
      migrate(db);
      const result = selectTakeoverFeedback(db);
      expect(result.total).toBe(0);
      expect(renderTakeoverFeedback(result)).toBe("");
    } finally {
      db.close();
    }
  });

  it("surfaces warn/fail quality_signals (read-only、書き込みなし)", () => {
    const db = openHarnessDb(":memory:");
    try {
      migrate(db);
      upsertRow(db, {
        table: "quality_signals",
        primaryKey: "signal_id",
        row: {
          signal_id: "skill:PLAN-Q:demo:firing_rate",
          source: "test",
          subject_id: "PLAN-Q",
          metric: "skill_firing_rate",
          value: 0,
          threshold: 1,
          status: "warn",
          computed_at: "2026-06-23T00:00:00.000Z",
        },
      });

      const result = selectTakeoverFeedback(db);
      const surfaced = result.items.find((item) => item.plan_id === "PLAN-Q");
      expect(surfaced).toBeDefined();
      expect(surfaced?.signal_type).toBe("skill_firing_rate");

      // read-only 契約: surface は feedback_events を書かない。
      const inbox = (db.prepare("SELECT COUNT(*) AS n FROM feedback_events").get() as { n: number })
        .n;
      expect(inbox).toBe(0);
    } finally {
      db.close();
    }
  });

  it("orders higher severity first so the agent reads the most urgent feedback on top", () => {
    const db = openHarnessDb(":memory:");
    try {
      migrate(db);
      insertFinding(db, "finding:takeover-drift:b-warn", "warn", "PLAN-A");
      insertFinding(db, "finding:takeover-drift:a-fail", "fail", "PLAN-B");

      const result = selectTakeoverFeedback(db);
      expect(result.items.length).toBeGreaterThanOrEqual(2);
      // fail outranks warn regardless of id ordering.
      expect(result.items[0]?.severity).toBe("fail");
      expect(result.bySeverity.fail).toBe(1);
      expect(result.bySeverity.warn).toBe(1);
    } finally {
      db.close();
    }
  });

  it("caps surfaced items and leaves a breadcrumb for the remainder", () => {
    const db = openHarnessDb(":memory:");
    try {
      migrate(db);
      for (let i = 0; i < 5; i += 1) {
        insertFinding(db, `finding:takeover-drift:bulk-${i}`, "warn", `PLAN-BULK-${i}`);
      }
      const result = selectTakeoverFeedback(db, { limit: 2 });
      expect(result.total).toBe(5);
      expect(result.items.length).toBe(2);
      expect(renderTakeoverFeedback(result)).toContain("+3 more");
    } finally {
      db.close();
    }
  });
});
