import { describe, expect, it } from "vitest";
import {
  LEDGER_SCHEMA_VERSION,
  ledgerRowDigest,
  ledgerSchemaDdl,
  migratePlanLedger,
} from "../../src/plan-asset/ledger/schema.js";
import { openHarnessDb } from "../../src/state-db/index.js";

const V5_TABLES = [
  "drive_model_selections",
  "execution_episode_events",
  "execution_episode_projection",
  "execution_episodes",
  "github_projection_outbox",
] as const;

describe("Execution Episode canonical ledger schema (PLAN-L7-436)", () => {
  it("U-EXEP-008: fresh ledgerをv5としてepisode/event/projection/outbox付きで構築する", () => {
    const db = openHarnessDb(":memory:");
    try {
      expect(LEDGER_SCHEMA_VERSION).toBe(5);
      expect(migratePlanLedger(db)).toEqual({ ok: true, version: 5 });
      const tableNames = db
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
        .all()
        .map((row) => row.name);
      expect(tableNames).toEqual(expect.arrayContaining([...V5_TABLES]));

      const ddl = ledgerSchemaDdl().join("\n");
      expect(ddl).toContain("append-only:execution_episodes");
      expect(ddl).toContain("append-only:execution_episode_events");
      expect(ddl).toContain("append-only:drive_model_selections");
      expect(ddl).not.toContain("append-only:execution_episode_projection");
      expect(ddl).not.toContain("append-only:github_projection_outbox");

      const receipt = {
        command_id: "command:episode:create",
        command_type: "execution_episode.request_escape",
        subject_kind: "execution_episode",
        subject_key: "episode:recovery-70",
        plan_asset_id: null,
        plan_revision: null,
        command_payload_digest: "a".repeat(64),
        result_kind: "execution_episode_event",
        result_ref: "event:recovery-70:0",
        recorded_at: "2026-07-16T00:00:00.000Z",
      };
      expect(() =>
        db
          .prepare("INSERT INTO append_command_receipts VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
          .run(...Object.values(receipt), ledgerRowDigest(receipt, "receipt_digest")),
      ).not.toThrow();
    } finally {
      db.close();
    }
  });

  it("U-EXEP-008: valid v4を単一transactionでv5へ拡張し既存custodyを保持する", () => {
    const db = openHarnessDb(":memory:");
    try {
      installVersion4(db);
      db.prepare("INSERT INTO plan_assets VALUES (?, ?, ?, ?)").run(
        "plan:existing",
        "2026-07-16T00:00:00.000Z",
        "a".repeat(40),
        "sha256-v1",
      );

      expect(migratePlanLedger(db)).toEqual({ ok: true, version: 5 });
      expect(db.prepare("SELECT asset_id FROM plan_assets").get()).toEqual({
        asset_id: "plan:existing",
      });
      for (const table of V5_TABLES) {
        expect(db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get()).toEqual({ count: 0 });
      }
    } finally {
      db.close();
    }
  });

  it("U-EXEP-008: v4→v5 faultでversion/schema/既存rowを全rollbackする", () => {
    const db = openHarnessDb(":memory:");
    try {
      installVersion4(db);
      db.prepare("INSERT INTO plan_assets VALUES (?, ?, ?, ?)").run(
        "plan:existing",
        "2026-07-16T00:00:00.000Z",
        "a".repeat(40),
        "sha256-v1",
      );
      expect(
        migratePlanLedger(db, {
          fault: {
            after(boundary) {
              if (boundary === "v4-v5-schema-created") throw new Error("fault:v4-v5");
            },
          },
        }),
      ).toEqual({ ok: false, ruleId: "plan-ledger-unavailable" });
      expect(db.userVersion()).toBe(4);
      expect(db.prepare("SELECT asset_id FROM plan_assets").get()).toEqual({
        asset_id: "plan:existing",
      });
      const tableNames = db
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
        .all()
        .map((row) => row.name);
      expect(tableNames).not.toEqual(expect.arrayContaining([...V5_TABLES]));
    } finally {
      db.close();
    }
  });
});

function installVersion4(db: ReturnType<typeof openHarnessDb>): void {
  db.exec("BEGIN IMMEDIATE");
  try {
    for (const ddl of ledgerSchemaDdl(4)) db.exec(ddl);
    db.setUserVersion(4);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
