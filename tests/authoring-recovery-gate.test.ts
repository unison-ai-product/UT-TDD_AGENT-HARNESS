import { describe, expect, it } from "vitest";
import {
  assertNoUnresolvedAuthoringRecovery,
  findUnresolvedAuthoringRecovery,
} from "../src/plan-asset/ledger/authoring-recovery-gate";
import { migratePlanLedger } from "../src/plan-asset/ledger/schema";
import { openHarnessDb } from "../src/state-db/index";

describe("authoring recovery boundary gate", () => {
  it("fails closed for draft and group recovery, then clears only after terminal phase", () => {
    const db = openHarnessDb(":memory:");
    try {
      expect(migratePlanLedger(db)).toMatchObject({ ok: true });
      db.prepare(
        `INSERT INTO plan_draft_journal
         (journal_id, command_id, command_payload_digest, status, requested_plan_id,
          requested_source_path, intent_recorded_at, completed_at, failure_reason, journal_digest)
         VALUES (?, ?, ?, 'recovery_required', ?, ?, ?, ?, ?, ?)`,
      ).run(
        "journal:1",
        "command:draft",
        "digest",
        "PLAN-X",
        "docs/plans/X.md",
        "2026-07-21",
        "2026-07-21",
        "failed",
        "digest",
      );
      db.prepare("INSERT INTO authoring_command_group_headers VALUES (?, ?, ?, ?, ?, ?)").run(
        "group:1",
        "payload",
        "members",
        1,
        "2026-07-21",
        "header",
      );
      db.prepare(
        `INSERT INTO authoring_command_group_phase_events VALUES (?, ?, ?, ?, ?, NULL, NULL, ?, ?, NULL, ?)`,
      ).run(
        "phase:1",
        "group:1",
        1,
        "payload",
        "recovery_required",
        "failed",
        "2026-07-21",
        "event:1",
      );

      expect(findUnresolvedAuthoringRecovery(db)).toEqual({
        draftCommands: ["command:draft"],
        groups: ["group:1"],
      });
      expect(() => assertNoUnresolvedAuthoringRecovery(db)).toThrow(
        /authoring-recovery-unresolved/,
      );

      db.prepare("UPDATE plan_draft_journal SET status = 'rolled_back' WHERE command_id = ?").run(
        "command:draft",
      );
      db.prepare(
        `INSERT INTO authoring_command_group_phase_events VALUES (?, ?, ?, ?, ?, NULL, NULL, NULL, ?, ?, ?)`,
      ).run("phase:2", "group:1", 2, "payload", "rolled_back", "2026-07-21", "event:1", "event:2");
      expect(findUnresolvedAuthoringRecovery(db)).toEqual({ draftCommands: [], groups: [] });
    } finally {
      db.close();
    }
  });
});
