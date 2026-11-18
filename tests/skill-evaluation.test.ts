/**
 * U-FR-L1-36: skill evaluation projection (FR-L1-36 / PLAN-L7-53-learning-engine)
 *
 * Oracle: projectSkillEvaluations は accepted=1 の skill_invocations から unused_flag を計算する。
 *   - unused_flag = 1 when no invocation has fired_at within last 30 days
 *   - PLAN 由来の skill_rating / adoption_count / success_count は NULL のまま (S7 #1379)
 *   - Cold-start: 0 invocations => 0 evaluation rows (no throw)
 *
 * AC-FR-BR21-36-01: accepted invocation within 30 days => unused_flag 0、PLAN 由来値は NULL
 * AC-FR-BR21-36-02: skill with 0 adoption in last 30 days => unused_flag 1; no auto-delete
 */
import { describe, expect, it } from "vitest";
import { openHarnessDb, upsertRow } from "../src/state-db/index.ts";
import { migrate, rowCounts } from "../src/state-db/migration.ts";
import { projectSkillEvaluations } from "../src/state-db/projection-writer.ts";

function seedInvocation(
  db: ReturnType<typeof openHarnessDb>,
  opts: { id: string; skillId: string; planId: string; accepted: number; firedAt: string },
): void {
  upsertRow(db, {
    table: "skill_invocations",
    primaryKey: "skill_invocation_id",
    row: {
      skill_invocation_id: opts.id,
      session_id: "",
      plan_id: opts.planId,
      skill_id: opts.skillId,
      layer: "L7",
      drive: "db",
      fired_at: opts.firedAt,
      source: "runtime-hook:skill-suggest",
      accepted: opts.accepted,
    },
  });
}

describe("U-FR-L1-36: projectSkillEvaluations", () => {
  it("cold-start: zero invocations produces zero evaluation rows and does not throw", () => {
    // U-FR-L1-36 cold-start oracle
    const db = openHarnessDb(":memory:");
    try {
      migrate(db);
      projectSkillEvaluations(db, { asOf: "2026-06-15T00:00:00.000Z" });
      expect(rowCounts(db).skill_evaluations).toBe(0);
    } finally {
      db.close();
    }
  });

  it("AC-FR-BR21-36-01: accepted invocation within 30 days => unused_flag 0, PLAN-derived values NULL", () => {
    // U-FR-L1-36 AC-01
    const asOf = "2026-06-15T12:00:00.000Z";
    const db = openHarnessDb(":memory:");
    try {
      migrate(db);
      seedInvocation(db, {
        id: "inv-ac01-1",
        skillId: "skill:review-checklist",
        planId: "",
        accepted: 1,
        firedAt: "2026-06-14T12:00:00.000Z",
      });

      projectSkillEvaluations(db, { asOf });

      const row = db
        .prepare("SELECT * FROM skill_evaluations WHERE skill_id = ?")
        .get("skill:review-checklist") as Record<string, unknown> | undefined;

      expect(row).toBeDefined();
      expect(Number(row?.unused_flag)).toBe(0);
      expect(row?.skill_rating).toBeNull();
      expect(row?.adoption_count).toBeNull();
      expect(row?.success_count).toBeNull();
    } finally {
      db.close();
    }
  });

  it("AC-FR-BR21-36-02: no invocation in last 30 days => unused_flag 1; skill row preserved (no auto-delete)", () => {
    // U-FR-L1-36 AC-02
    const asOf = "2026-06-15T12:00:00.000Z";
    // older than 30 days from asOf
    const oldFiredAt = "2026-05-01T00:00:00.000Z";
    const db = openHarnessDb(":memory:");
    try {
      migrate(db);

      seedInvocation(db, {
        id: "inv-old-01",
        skillId: "skill:code-review",
        planId: "PLAN-OLD-01",
        accepted: 1,
        firedAt: oldFiredAt,
      });

      projectSkillEvaluations(db, { asOf });

      const row = db
        .prepare("SELECT * FROM skill_evaluations WHERE skill_id = ?")
        .get("skill:code-review") as Record<string, unknown> | undefined;

      expect(row).toBeDefined();
      expect(Number(row?.unused_flag)).toBe(1);
      // Row still exists — no auto-delete
      expect(rowCounts(db).skill_evaluations).toBeGreaterThan(0);
    } finally {
      db.close();
    }
  });

  it("rejected invocations (accepted=0) do not count toward adoption", () => {
    // U-FR-L1-36: adoption = distinct plan_id with accepted=1
    const asOf = "2026-06-15T12:00:00.000Z";
    const recentAt = "2026-06-14T12:00:00.000Z";
    const db = openHarnessDb(":memory:");
    try {
      migrate(db);

      seedInvocation(db, {
        id: "inv-rejected-01",
        skillId: "skill:test-design",
        planId: "PLAN-REJECTED-01",
        accepted: 0,
        firedAt: recentAt,
      });

      projectSkillEvaluations(db, { asOf });
      // No accepted=1 invocations => cold-start branch => 0 rows
      expect(rowCounts(db).skill_evaluations).toBe(0);
    } finally {
      db.close();
    }
  });
});
