import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { SqliteExecutionEpisodeRepository } from "../../src/execution-ledger/adapters/sqlite/episode-repository.js";
import { executionLedgerRowsValid } from "../../src/execution-ledger/adapters/sqlite/row-verifier.js";
import type {
  ClassifyEscapeCommand,
  RequestForwardEscape,
  RequestIssueProjectionCommand,
  SelectDriveModelCommand,
} from "../../src/execution-ledger/domain/execution-episode.js";
import {
  ledgerRowDigest,
  ledgerSchemaDdl,
  migratePlanLedger,
} from "../../src/plan-asset/ledger/schema.js";
import { openHarnessDb, type HarnessDb } from "../../src/state-db/index.js";

const SHA = "a".repeat(40);
const DIGEST = "b".repeat(64);
const CUSTODY = { runtime: "codex", model: "test-model" } as const;

describe("Execution Episode v5 row integrity (PLAN-L7-436)", () => {
  it.each([
    ["event payload", tamperEventPayload],
    ["immutable root", tamperRootDrive],
    ["projection", tamperProjection],
    ["receipt bijection", tamperReceiptBinding],
  ] as const)("U-EXEP-011: %s tamperをschema再検査でfail-closeする", (_label, tamper) => {
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

  it.each([
    ["missing selection", removeDriveSelection],
    ["tampered selection", tamperDriveSelection],
    ["extra selection", addDriveSelection],
  ] as const)("U-EXEP-011: E2 event↔drive selection %sをfail-closeする", (_label, tamper) => {
    const db = transitionedEpisodeLedger("E2");
    try {
      tamper(db);
      expect(migratePlanLedger(db)).toEqual({
        ok: false,
        ruleId: "plan-ledger-unavailable",
      });
    } finally {
      db.close();
    }
  });

  it.each([
    ["missing intent", removeIssueIntent],
    ["tampered intent", tamperIssueIntent],
    ["invalid dispatch state", tamperIssueDispatchState],
    ["extra intent", addIssueIntent],
  ] as const)("U-EXEP-011: E3 event↔GitHub outbox %sをfail-closeする", (_label, tamper) => {
    const db = transitionedEpisodeLedger("E3");
    try {
      tamper(db);
      expect(migratePlanLedger(db)).toEqual({
        ok: false,
        ruleId: "plan-ledger-unavailable",
      });
    } finally {
      db.close();
    }
  });

  it("U-EXEP-011: acknowledged dispatch stateをimmutable intent改変として扱わない", () => {
    const db = transitionedEpisodeLedger("E3");
    try {
      acknowledgeIssueIntent(db);
      expect(executionLedgerRowsValid(db)).toBe(true);
    } finally {
      db.close();
    }
  });

  it("U-EXEP-011: receipt_digest単独改変をrow verifierがfail-closeする", () => {
    const db = episodeLedger();
    try {
      withoutUpdateTrigger(db, "append_command_receipts", () => {
        db.prepare("UPDATE append_command_receipts SET receipt_digest = ?").run(
          "f".repeat(64),
        );
      });
      expect(executionLedgerRowsValid(db)).toBe(false);
    } finally {
      db.close();
    }
  });
});

function removeDriveSelection(db: HarnessDb): void {
  withoutTrigger(db, "drive_model_selections", "no_delete", () => {
    db.prepare("DELETE FROM drive_model_selections").run();
  });
}

function tamperDriveSelection(db: HarnessDb): void {
  withoutUpdateTrigger(db, "drive_model_selections", () => {
    db.prepare("UPDATE drive_model_selections SET rationale_digest = ?").run("c".repeat(64));
  });
}

function addDriveSelection(db: HarnessDb): void {
  db.prepare(`INSERT INTO drive_model_selections
    SELECT episode_id, 2, selected_event_sequence, model, compatibility_result,
      rationale_digest, override_used, override_actor, override_reason,
      override_evidence_digest, selected_at, selection_digest
    FROM drive_model_selections WHERE selection_revision = 1`).run();
}

function removeIssueIntent(db: HarnessDb): void {
  db.prepare("DELETE FROM github_projection_outbox").run();
}

function tamperIssueIntent(db: HarnessDb): void {
  db.prepare("UPDATE github_projection_outbox SET repository = 'other/repository'").run();
}

function tamperIssueDispatchState(db: HarnessDb): void {
  db.prepare(
    "UPDATE github_projection_outbox SET status = 'acknowledged', attempt_count = 1, last_attempt_at = ?",
  ).run("2026-07-17T00:00:00.000Z");
}

function acknowledgeIssueIntent(db: HarnessDb): void {
  db.prepare(
    `UPDATE github_projection_outbox
     SET status = 'acknowledged', attempt_count = 1,
         ack_observation_id = 'observation:github:1', last_attempt_at = ?`,
  ).run("2026-07-17T00:00:00.000Z");
}

function addIssueIntent(db: HarnessDb): void {
  db.prepare(`INSERT INTO github_projection_outbox
    SELECT outbox_id || ':extra', episode_id, source_event_sequence, operation_kind,
      object_kind, repository, target_logical_key, 2, idempotency_key || ':extra',
      payload_version, canonical_payload_json, payload_digest, status, attempt_count,
      next_attempt_at, lease_owner, lease_expires_at, ack_observation_id, created_at,
      last_attempt_at
    FROM github_projection_outbox WHERE intent_revision = 1`).run();
}

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
  withoutTrigger(db, table, "no_update", mutate);
}

function withoutTrigger(
  db: HarnessDb,
  table: string,
  suffix: "no_update" | "no_delete",
  mutate: () => void,
): void {
  const triggerName = `trg_${table}_${suffix}`;
  db.exec(`DROP TRIGGER ${triggerName}`);
  try {
    mutate();
  } finally {
    const ddl = ledgerSchemaDdl().find((sql) => sql.includes(triggerName));
    if (!ddl) throw new Error(`trigger DDL missing: ${triggerName}`);
    db.exec(ddl);
  }
}

function transitionedEpisodeLedger(state: "E2" | "E3"): HarnessDb {
  const db = episodeLedger();
  const repository = new SqliteExecutionEpisodeRepository(db);
  expect(repository.transition(classify(), CUSTODY)).toMatchObject({ ok: true });
  expect(repository.transition(selectDrive(), CUSTODY)).toMatchObject({ ok: true });
  if (state === "E3") {
    expect(repository.transition(requestIssue(), CUSTODY)).toMatchObject({ ok: true });
  }
  expect(migratePlanLedger(db)).toEqual({ ok: true, version: 5 });
  return db;
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

function transitionEnvelope<const TSequence extends 1 | 2 | 3>(sequence: TSequence) {
  return {
    commandId: `command:recovery-70:e${sequence}`,
    episodeId: "episode:recovery-70",
    expectedSequence: sequence,
    sourceCommit: SHA,
    observedHead: SHA,
    policyRevision: "policy:escape-v1",
    actor: "codex",
    occurredAt: `2026-07-16T08:3${sequence}:00.000Z`,
  };
}

function classify(): ClassifyEscapeCommand {
  return {
    type: "classify_escape",
    ...transitionEnvelope(1),
    escapeType: "reopened",
    classificationRuleRevision: "escape-classification:v1",
    verificationTarget: {
      kind: "assumption",
      assetId: "plan:doctor-singleton",
      revision: 1,
      statementDigest: DIGEST,
    },
  };
}

function selectDrive(): SelectDriveModelCommand {
  return {
    type: "select_drive_model",
    ...transitionEnvelope(2),
    model: "recovery",
    compatibilityResult: "compatible",
    rationaleDigest: DIGEST,
    selectionRevision: 1,
  };
}

function requestIssue(): RequestIssueProjectionCommand {
  return {
    type: "request_issue_projection",
    ...transitionEnvelope(3),
    repository: "unison-ai-product/UT-TDD_AGENT-HARNESS",
    intentRevision: 1,
    labels: ["forward-escape", "drive:recovery"],
  };
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
