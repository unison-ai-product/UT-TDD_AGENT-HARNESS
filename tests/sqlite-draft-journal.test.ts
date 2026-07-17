import { createHash } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import {
  DraftJournalIntegrityError,
  SqliteDraftJournal,
} from "../src/plan-admission/sqlite-draft-journal.js";
import { PlanDraftLedgerTransaction } from "../src/plan-asset/ledger/plan-draft-ledger.js";
import { openHarnessDb } from "../src/state-db/index.js";

const opened: ReturnType<typeof openHarnessDb>[] = [];
afterEach(() => {
  for (const db of opened.splice(0)) db.close();
});

const intent = {
  commandId: "command:draft-1",
  payloadDigest: "a".repeat(64),
  planId: "PLAN-L7-999",
  sourcePath: "docs/plans/PLAN-L7-999.md",
  recordedAt: "2026-07-15T00:00:00.000Z",
};
const receipt = { assetId: "asset:draft-1", revision: 1, certificateId: "certificate:draft-1" };
const boundReceipt = (commandPayloadDigest: string, certificateDigest?: string) => ({
  ...receipt,
  commandPayloadDigest,
  ...(certificateDigest ? { certificateDigest } : {}),
});

describe("SqliteDraftJournal", () => {
  it("U-PADM-028: intentとcommitをappend-only eventへ残しcurrentを投影する", () => {
    const { db, journal } = fixture();
    const result = new PlanDraftLedgerTransaction(db).append(draft());
    if (!result.ok) throw new Error(result.ruleId);
    const boundIntent = { ...intent, payloadDigest: result.commandPayloadDigest };
    journal.recordIntent(boundIntent);
    journal.commit(
      boundIntent.commandId,
      boundIntent.payloadDigest,
      boundReceipt(boundIntent.payloadDigest),
    );

    expect(journal.find(intent.commandId)).toEqual({
      status: "committed",
      payloadDigest: boundIntent.payloadDigest,
      receipt: boundReceipt(boundIntent.payloadDigest, result.certificateDigest),
    });
    expect(db.prepare("SELECT COUNT(*) AS n FROM plan_draft_journal_events").get()?.n).toBe(2);
    expect(() =>
      db.exec("DELETE FROM plan_draft_journal_events WHERE command_id = 'command:draft-1'"),
    ).toThrow(/append-only/);
  });

  it("U-PADM-029: command再利用競合とrecovery_requiredからの自動遷移をfail-closeする", () => {
    const { journal } = fixture();
    journal.recordIntent(intent);
    expect(() => journal.recordIntent({ ...intent, payloadDigest: "b".repeat(64) })).toThrow(
      /command-conflict/,
    );
    journal.markRecoveryRequired(intent.commandId, intent.payloadDigest, "restore済み");
    expect(journal.find(intent.commandId)).toEqual({
      status: "recovery_required",
      payloadDigest: intent.payloadDigest,
    });
    expect(() =>
      journal.commit(intent.commandId, intent.payloadDigest, boundReceipt(intent.payloadDigest)),
    ).toThrow(/transition-invalid/);
  });

  it("U-PADM-030: crash後のintentとledger receiptを自動commitせずrecovery_requiredへ遮断する", () => {
    const db = openHarnessDb(":memory:");
    opened.push(db);
    const result = new PlanDraftLedgerTransaction(db).append(draft());
    if (!result.ok) throw new Error(result.ruleId);
    const journal = new SqliteDraftJournal(db, () => "2026-07-15T00:01:00.000Z");
    journal.recordIntent({ ...intent, payloadDigest: result.commandPayloadDigest });

    expect(journal.find(intent.commandId)).toEqual({
      status: "recovery_required",
      payloadDigest: result.commandPayloadDigest,
    });
    expect(db.prepare("SELECT status FROM plan_draft_journal").get()?.status).toBe(
      "recovery_required",
    );
  });

  it("U-PADM-031: currentまたはeventの改ざんをdigest/chainで遮断する", () => {
    const { db, journal } = fixture();
    journal.recordIntent(intent);
    db.exec("UPDATE plan_draft_journal SET requested_plan_id = 'PLAN-L7-TAMPER'");
    expect(() => journal.find(intent.commandId)).toThrow(DraftJournalIntegrityError);

    const second = fixture();
    second.journal.recordIntent(intent);
    second.db.exec("DROP TRIGGER trg_plan_draft_journal_events_no_update");
    second.db.exec("UPDATE plan_draft_journal_events SET requested_plan_id = 'PLAN-L7-TAMPER'");
    expect(() => second.journal.find(intent.commandId)).toThrow(DraftJournalIntegrityError);
  });

  it("U-PADM-063: commit後のcleanup-pendingをappend-only eventとcurrentへ永続化する", () => {
    const { db, journal } = fixture();
    const result = new PlanDraftLedgerTransaction(db).append(draft());
    if (!result.ok) throw new Error(result.ruleId);
    const boundIntent = { ...intent, payloadDigest: result.commandPayloadDigest };
    const committed = boundReceipt(boundIntent.payloadDigest);
    journal.recordIntent(boundIntent);
    journal.commit(boundIntent.commandId, boundIntent.payloadDigest, committed);

    journal.markCleanupPending(
      boundIntent.commandId,
      boundIntent.payloadDigest,
      "artifact cleanup未完了",
    );

    expect(journal.find(boundIntent.commandId)).toEqual({
      status: "committed",
      payloadDigest: boundIntent.payloadDigest,
      receipt: boundReceipt(boundIntent.payloadDigest, result.certificateDigest),
      cleanupPending: "artifact cleanup未完了",
    });
    expect(
      db
        .prepare(
          "SELECT sequence, event_kind, failure_reason FROM plan_draft_journal_events ORDER BY sequence DESC LIMIT 1",
        )
        .get(),
    ).toEqual({ sequence: 3, event_kind: "committed", failure_reason: "artifact cleanup未完了" });
  });
});

function fixture() {
  const db = openHarnessDb(":memory:");
  opened.push(db);
  return { db, journal: new SqliteDraftJournal(db, () => "2026-07-15T00:01:00.000Z") };
}

function draft() {
  return {
    commandId: intent.commandId,
    assetId: receipt.assetId,
    planId: intent.planId,
    alias: intent.planId,
    sourcePath: intent.sourcePath,
    projectionPath: "docs/governance/plan-admission-receipts.json",
    sourceCommit: "a".repeat(40),
    actor: "codex",
    reason: "draft",
    canonicalPayloadJson: '{"title":"draft"}',
    bodyDigest: sha("draft body"),
    identityAlgorithm: "uuid-v5",
    reservationId: "reservation:draft-1",
    namespace: "L7",
    ordinal: 999,
    leaseTokenHash: sha("lease"),
    expiresAt: "2026-07-16T00:00:00.000Z",
    routeTupleDigest: sha("forward|none"),
    certificateId: receipt.certificateId,
    occurredAt: intent.recordedAt,
  };
}

function sha(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
