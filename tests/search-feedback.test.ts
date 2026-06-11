import { describe, expect, it } from "vitest";
import { computeSkillMetrics, emitFeedbackEvents } from "../src/feedback/engine";
import { findReference, upsertSearchReference } from "../src/search/index";
import { openHarnessDb, upsertRow } from "../src/state-db/index";
import { migrate, rowCounts } from "../src/state-db/migration";

describe("IT-SEARCH-01 / IT-DB-03 / IT-FEEDBACK-01", () => {
  it("findReference returns exact ID matches before fuzzy token matches without mutating sources", () => {
    const db = openHarnessDb(":memory:");
    try {
      migrate(db);
      upsertSearchReference(db, {
        subject_type: "plan",
        subject_id: "PLAN-L7-47-search-metrics-feedback",
        path: "docs/plans/PLAN-L7-47-search-metrics-feedback.md",
        title: "search metrics feedback",
        tokens: "search metrics feedback skill",
        summary: "ranked lookup",
        updated_at: "2026-06-11T00:00:00.000Z",
      });
      upsertSearchReference(db, {
        subject_type: "finding",
        subject_id: "finding:search",
        path: ".ut-tdd/evidence/finding.json",
        title: "search finding",
        tokens: "feedback search stale",
        summary: "open finding",
        updated_at: "2026-06-11T00:00:00.000Z",
      });

      const exact = findReference(db, "PLAN-L7-47-search-metrics-feedback");
      const fuzzy = findReference(db, "stale search");

      expect(exact[0]).toMatchObject({
        subject_type: "plan",
        subject_id: "PLAN-L7-47-search-metrics-feedback",
        reason: "exact-id",
      });
      expect(fuzzy[0].score).toBeGreaterThanOrEqual(fuzzy.at(-1)?.score ?? 0);
      expect(rowCounts(db).search_index).toBe(2);
    } finally {
      db.close();
    }
  });

  it("computeSkillMetrics stores firing and acceptance rates as quality signals", () => {
    const db = openHarnessDb(":memory:");
    try {
      migrate(db);
      for (const id of ["rec-1", "rec-2"]) {
        upsertRow(db, {
          table: "skill_recommendations",
          primaryKey: "skill_recommendation_id",
          row: {
            skill_recommendation_id: id,
            session_id: "s1",
            plan_id: "PLAN-L7-47-search-metrics-feedback",
            skill_id: "testing",
            rank: id === "rec-1" ? 1 : 2,
            score: 1,
            reason: "db span",
            recommended_at: "2026-06-11T00:00:00.000Z",
          },
        });
      }
      upsertRow(db, {
        table: "skill_invocations",
        primaryKey: "skill_invocation_id",
        row: {
          skill_invocation_id: "inv-1",
          session_id: "s1",
          plan_id: "PLAN-L7-47-search-metrics-feedback",
          skill_id: "testing",
          layer: "L7",
          drive: "db",
          fired_at: "2026-06-11T00:01:00.000Z",
          source: "codex",
          accepted: 1,
        },
      });

      const metrics = computeSkillMetrics(db);

      expect(metrics).toContainEqual(
        expect.objectContaining({
          plan_id: "PLAN-L7-47-search-metrics-feedback",
          skill_id: "testing",
          firing_rate: 0.5,
          acceptance_rate: 1,
        }),
      );
      expect(rowCounts(db).quality_signals).toBe(2);
    } finally {
      db.close();
    }
  });

  it("emitFeedbackEvents groups open findings and quality failures without approving plans", () => {
    const db = openHarnessDb(":memory:");
    try {
      migrate(db);
      upsertRow(db, {
        table: "findings",
        primaryKey: "finding_id",
        row: {
          finding_id: "finding-1",
          kind: "orphan-trace",
          severity: "warn",
          subject_id: "PLAN-L7-47-search-metrics-feedback",
          source: "doctor",
          status: "open",
          evidence_path: ".ut-tdd/evidence/orphan.json",
        },
      });
      upsertRow(db, {
        table: "quality_signals",
        primaryKey: "signal_id",
        row: {
          signal_id: "signal-1",
          source: "schedule-lint",
          subject_id: "PLAN-L7-47-search-metrics-feedback",
          metric: "schedule_lint",
          value: 1,
          threshold: 0,
          status: "fail",
          computed_at: "2026-06-11T00:02:00.000Z",
        },
      });

      const events = emitFeedbackEvents(db);

      expect(events.length).toBe(2);
      expect(events.every((event) => event.status === "open")).toBe(true);
      expect(events.every((event) => event.next_action.includes("review"))).toBe(true);
      const plan = db.prepare("SELECT * FROM plan_registry").get();
      expect(plan).toBeUndefined();
    } finally {
      db.close();
    }
  });
});
