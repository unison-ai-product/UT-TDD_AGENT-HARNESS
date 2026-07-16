import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { SqliteExecutionEpisodeRepository } from "../../src/execution-ledger/adapters/sqlite/episode-repository.js";
import type { RequestForwardEscape } from "../../src/execution-ledger/domain/execution-episode.js";
import {
  ledgerRowDigest,
  ledgerSchemaDdl,
  migratePlanLedger,
} from "../../src/plan-asset/ledger/schema.js";
import { openHarnessDb, type HarnessDb } from "../../src/state-db/index.js";

const SHA = "a".repeat(40);
const DIGEST = "b".repeat(64);

describe("Execution Episode v5 row integrity (PLAN-L7-436)", () => {
  it.each([
    ["event payload", tamperEventPayload],
    ["immutable root", tamperRootDrive],
    ["projection", tamperProjection],
    ["receipt bijection", tamperReceiptBinding],
  ] as const)("U-EXEP-009: %s tamperをschema再検査でfail-closeする", (_label, tamper) => {
    const db = episodeLedger();
    try {
      expect(migratePlanLedger(db)).toEqual({ ok: true, version: 5 });
      tamper(db);
      expect(migratePlanLedger(db)).toEqual({
        ok: false,
        ruleId: "plan-ledger-unavailable",
      });
    } finally {
      db.close();
    }
  });
});

function tamperEventPayload(db: HarnessDb): void {
  withoutUpdateTrigger(db, "execution_episode_events", () => {
    db.prepare("UPDATE execution_episode_events SET canonical_payload_json = ?").run(
      '{"tampered":true}',
    );
  });
}

function tamperRootDrive(db: HarnessDb): void {
  withoutUpdateTrigger(db, "execution_episodes", () => {
    db.prepare("UPDATE execution_episodes SET drive_model = 'reverse'").run();
  });
}

function tamperProjection(db: HarnessDb): void {
  db.prepare("UPDATE execution_episode_projection SET current_event_digest = ?").run("f".repeat(64));
}

function tamperReceiptBinding(db: HarnessDb): void {
  withoutUpdateTrigger(db, "append_command_receipts", () => {
    db.prepare("UPDATE append_command_receipts SET subject_key = 'episode:other'").run();
    const row = db.prepare("SELECT * FROM append_command_receipts").get();
    if (!row) throw new Error("receipt fixture missing");
    db.prepare("UPDATE append_command_receipts SET receipt_digest = ?").run(
      ledgerRowDigest(row, "receipt_digest"),
    );
  });
}

function withoutUpdateTrigger(db: HarnessDb, table: string, mutate: () => void): void {
  const triggerName = `trg_${table}_no_update`;
  db.exec(`DROP TRIGGER ${triggerName}`);
  try {
    mutate();
  } finally {
    const ddl = ledgerSchemaDdl().find((sql) => sql.includes(triggerName));
    if (!ddl) throw new Error(`trigger DDL missing: ${triggerName}`);
    db.exec(ddl);
  }
}

function episodeLedger(): HarnessDb {
  const db = openHarnessDb(":memory:");
  expect(migratePlanLedger(db)).toEqual({ ok: true, version: 5 });
  seedPlan(db, "plan:doctor-singleton");
  seedPlan(db, "plan:doctor-scoped-execution");
  const result = new SqliteExecutionEpisodeRepository(db).request(request(), {
    runtime: "codex",
    model: "test-model",
  });
  expect(result).toMatchObject({ ok: true, status: "created" });
  return db;
}

function seedPlan(db: HarnessDb, assetId: string): void {
  db.prepare("INSERT INTO plan_assets VALUES (?, ?, ?, ?)").run(
    assetId,
    "2026-07-16T00:00:00.000Z",
    SHA,
    "sha256-v1",
  );
  const payload = "{}";
  db.prepare("INSERT INTO plan_revisions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
    assetId,
    1,
    payload,
    createHash("sha256").update(payload).digest("hex"),
    DIGEST,
    "docs/plans/test.md",
    SHA,
    "test",
    "fixture",
    "2026-07-16T00:00:00.000Z",
  );
}

function request(): RequestForwardEscape {
  return {
    type: "request_forward_escape",
    commandId: "command:recovery-70",
    episodeId: "episode:recovery-70",
    recurrenceId: "recurrence:doctor-slo",
    routeMode: "recovery",
    escapeType: "reopened",
    escapeReason: "full doctor exceeds the Recovery release floor",
    routeSignal: "regression_dev",
    requestedDriveModel: "recovery",
    origin: {
      assetId: "plan:doctor-singleton",
      revision: 1,
      observedRevision: 1,
      layer: "L7",
      state: "accepted",
    },
    reentry: {
      assetId: "plan:doctor-scoped-execution",
      revision: 1,
      layer: "L7",
      state: "implementing",
      policyRevision: "policy:forward-v1",
    },
    issue: {
      repository: "unison-ai-product/UT-TDD_AGENT-HARNESS",
      title: "Recovery: doctor full scope SLO",
      bodyDigest: DIGEST,
    },
    sourceCommit: SHA,
    observedHead: SHA,
    policyRevision: "policy:escape-v1",
    actor: "codex",
    occurredAt: "2026-07-16T08:30:00.000Z",
  };
}
