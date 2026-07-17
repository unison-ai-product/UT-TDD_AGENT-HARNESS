import { timingSafeEqual } from "node:crypto";
import { ledgerRowDigest, migratePlanLedger } from "../plan-asset/ledger/schema.js";
import type { HarnessDb } from "../state-db/index.js";
import type {
  DraftJournalCommand,
  DraftJournalEntry,
  DraftJournalPort,
  DraftReceiptBinding,
} from "./plan-draft-service.js";

export class DraftJournalIntegrityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DraftJournalIntegrityError";
  }
}

/** SQLite v3 journal eventを正本、plan_draft_journalをcurrent projectionとして扱う。 */
export class SqliteDraftJournal implements DraftJournalPort<DraftReceiptBinding> {
  constructor(
    private readonly db: HarnessDb,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {
    if (!migratePlanLedger(db).ok) throw new DraftJournalIntegrityError("plan-ledger-unavailable");
  }

  find(commandId: string): DraftJournalEntry<DraftReceiptBinding> | undefined {
    this.assertIntegrity(commandId);
    let row = this.current(commandId);
    if (!row) return undefined;
    if (row.status === "intent") {
      const receipt = this.db
        .prepare("SELECT * FROM plan_admission_receipts WHERE command_id = ?")
        .get(commandId);
      if (receipt) {
        if (
          !secureEqual(String(receipt.command_payload_digest), String(row.command_payload_digest))
        )
          throw new DraftJournalIntegrityError("journal-ledger-payload-mismatch");
        this.markRecoveryRequired(
          commandId,
          String(row.command_payload_digest),
          "ledger receiptは存在するがartifact postimageを検証できないため明示recoveryが必要",
        );
        const refreshed = this.current(commandId);
        if (!refreshed) throw new DraftJournalIntegrityError("draft-journal-projection-missing");
        row = refreshed;
      }
    }
    if (row.status === "committed") {
      const ledger = this.db
        .prepare("SELECT * FROM plan_admission_receipts WHERE command_id = ?")
        .get(commandId);
      if (!ledger) throw new DraftJournalIntegrityError("draft-journal-ledger-binding-invalid");
      return {
        status: "committed",
        payloadDigest: String(row.command_payload_digest),
        receipt: binding(ledger),
        ...(typeof row.failure_reason === "string" && row.failure_reason
          ? { cleanupPending: row.failure_reason }
          : {}),
      };
    }
    return {
      status: row.status === "recovery_required" ? "recovery_required" : "intent",
      payloadDigest: String(row.command_payload_digest),
    };
  }

  recordIntent(command: DraftJournalCommand): void {
    if (
      !command.commandId ||
      !command.planId ||
      !command.sourcePath ||
      !validTime(command.recordedAt)
    )
      throw new DraftJournalIntegrityError("draft-journal-intent-invalid");
    this.run(() => {
      const existing = this.current(command.commandId);
      if (existing) {
        if (!secureEqual(String(existing.command_payload_digest), command.payloadDigest))
          throw new DraftJournalIntegrityError("draft-journal-command-conflict");
        throw new DraftJournalIntegrityError("draft-journal-intent-already-recorded");
      }
      const event = eventRow({
        command,
        sequence: 1,
        eventKind: "intent",
        occurredAt: command.recordedAt,
      });
      this.insertEvent(event);
      const current = {
        journal_id: `journal:${command.commandId}`,
        command_id: command.commandId,
        command_payload_digest: command.payloadDigest,
        status: "intent",
        requested_plan_id: command.planId,
        requested_source_path: command.sourcePath,
        plan_asset_id: null,
        plan_revision: null,
        certificate_id: null,
        intent_recorded_at: command.recordedAt,
        completed_at: null,
        failure_reason: null,
      };
      this.db
        .prepare("INSERT INTO plan_draft_journal VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .run(...Object.values(current), ledgerRowDigest(current, "journal_digest"));
    });
  }

  commit(commandId: string, payloadDigest: string, receipt: DraftReceiptBinding): void {
    this.transition({ commandId, payloadDigest, status: "committed", receipt });
  }

  markRecoveryRequired(commandId: string, payloadDigest: string, reason: string): void {
    this.transition({ commandId, payloadDigest, status: "recovery_required", reason });
  }

  markCleanupPending(commandId: string, payloadDigest: string, reason: string): void {
    if (!reason) throw new DraftJournalIntegrityError("draft-journal-cleanup-reason-required");
    this.run(() => {
      const current = this.current(commandId);
      if (!current || String(current.status) !== "committed")
        throw new DraftJournalIntegrityError("draft-journal-cleanup-before-commit");
      if (!secureEqual(String(current.command_payload_digest), payloadDigest))
        throw new DraftJournalIntegrityError("draft-journal-command-conflict");
      const previous = this.latestEvent(commandId);
      if (!previous) throw new DraftJournalIntegrityError("draft-journal-projection-missing");
      const command: DraftJournalCommand = {
        commandId,
        payloadDigest,
        planId: String(current.requested_plan_id),
        sourcePath: String(current.requested_source_path),
        recordedAt: String(current.intent_recorded_at),
      };
      const receipt: DraftReceiptBinding = {
        assetId: String(current.plan_asset_id),
        revision: Number(current.plan_revision),
        certificateId: String(current.certificate_id),
        commandPayloadDigest: payloadDigest,
      };
      this.insertEvent(
        eventRow({
          command,
          sequence: Number(previous.sequence) + 1,
          eventKind: "committed",
          occurredAt: this.now(),
          receipt,
          reason,
          previousEventDigest: String(previous.event_digest),
        }),
      );
      const next = { ...current, failure_reason: reason };
      this.db
        .prepare(
          "UPDATE plan_draft_journal SET failure_reason=?, journal_digest=? WHERE command_id=?",
        )
        .run(reason, ledgerRowDigest(next, "journal_digest"), commandId);
    });
  }

  private transition(input: {
    commandId: string;
    payloadDigest: string;
    status: "committed" | "recovery_required";
    receipt?: DraftReceiptBinding;
    reason?: string;
  }): void {
    const { commandId, payloadDigest, status, receipt, reason } = input;
    this.run(() => {
      const current = this.current(commandId);
      if (!current) throw new DraftJournalIntegrityError("draft-journal-intent-missing");
      if (!secureEqual(String(current.command_payload_digest), payloadDigest))
        throw new DraftJournalIntegrityError("draft-journal-command-conflict");
      if (String(current.status) === status) return;
      if (String(current.status) !== "intent")
        throw new DraftJournalIntegrityError("draft-journal-transition-invalid");
      if (status === "committed") {
        if (!receipt || receipt.revision < 1)
          throw new DraftJournalIntegrityError("draft-journal-receipt-invalid");
        this.assertLedgerBinding(commandId, payloadDigest, receipt);
      }
      const previous = this.latestEvent(commandId);
      if (!previous || Number(previous.sequence) !== 1)
        throw new DraftJournalIntegrityError("draft-journal-event-sequence-invalid");
      const occurredAt = this.now();
      const command: DraftJournalCommand = {
        commandId,
        payloadDigest,
        planId: String(current.requested_plan_id),
        sourcePath: String(current.requested_source_path),
        recordedAt: String(current.intent_recorded_at),
      };
      this.insertEvent(
        eventRow({
          command,
          sequence: 2,
          eventKind: status,
          occurredAt,
          receipt,
          reason,
          previousEventDigest: String(previous.event_digest),
        }),
      );
      const next = {
        journal_id: String(current.journal_id),
        command_id: commandId,
        command_payload_digest: payloadDigest,
        status,
        requested_plan_id: command.planId,
        requested_source_path: command.sourcePath,
        plan_asset_id: receipt?.assetId ?? null,
        plan_revision: receipt?.revision ?? null,
        certificate_id: receipt?.certificateId ?? null,
        intent_recorded_at: command.recordedAt,
        completed_at: occurredAt,
        failure_reason: reason ?? null,
      };
      this.db
        .prepare(
          "UPDATE plan_draft_journal SET status=?, plan_asset_id=?, plan_revision=?, certificate_id=?, completed_at=?, failure_reason=?, journal_digest=? WHERE command_id=?",
        )
        .run(
          next.status,
          next.plan_asset_id,
          next.plan_revision,
          next.certificate_id,
          next.completed_at,
          next.failure_reason,
          ledgerRowDigest(next, "journal_digest"),
          commandId,
        );
    });
  }

  private assertIntegrity(commandId: string): void {
    const current = this.current(commandId);
    const events = this.db
      .prepare("SELECT * FROM plan_draft_journal_events WHERE command_id = ? ORDER BY sequence")
      .all(commandId);
    if (!current && events.length === 0) return;
    if (!current || events.length === 0)
      throw new DraftJournalIntegrityError("draft-journal-projection-missing");
    if (current.journal_digest !== ledgerRowDigest(current, "journal_digest"))
      throw new DraftJournalIntegrityError("draft-journal-current-digest-invalid");
    let previous: string | null = null;
    for (const [index, event] of events.entries()) {
      if (Number(event.sequence) !== index + 1 || event.previous_event_digest !== previous)
        throw new DraftJournalIntegrityError("draft-journal-chain-invalid");
      if (event.event_digest !== ledgerRowDigest(event, "event_digest"))
        throw new DraftJournalIntegrityError("draft-journal-event-digest-invalid");
      previous = String(event.event_digest);
    }
    const latest = events.at(-1);
    if (!latest) throw new DraftJournalIntegrityError("draft-journal-projection-missing");
    if (
      latest.event_kind !== current.status ||
      latest.command_payload_digest !== current.command_payload_digest ||
      latest.plan_asset_id !== current.plan_asset_id ||
      latest.plan_revision !== current.plan_revision ||
      latest.certificate_id !== current.certificate_id
    )
      throw new DraftJournalIntegrityError("draft-journal-projection-diverged");
  }

  private current(commandId: string): Record<string, unknown> | undefined {
    return this.db.prepare("SELECT * FROM plan_draft_journal WHERE command_id = ?").get(commandId);
  }

  private assertLedgerBinding(
    commandId: string,
    payloadDigest: string,
    receipt: DraftReceiptBinding,
  ): void {
    const ledger = this.db
      .prepare("SELECT * FROM plan_admission_receipts WHERE command_id = ?")
      .get(commandId);
    if (
      !ledger ||
      !secureEqual(String(ledger.command_payload_digest), payloadDigest) ||
      !secureEqual(receipt.commandPayloadDigest, payloadDigest) ||
      String(ledger.plan_asset_id) !== receipt.assetId ||
      Number(ledger.plan_revision) !== receipt.revision ||
      String(ledger.certificate_id) !== receipt.certificateId
    )
      throw new DraftJournalIntegrityError("draft-journal-ledger-binding-invalid");
  }

  private latestEvent(commandId: string): Record<string, unknown> | undefined {
    return this.db
      .prepare(
        "SELECT * FROM plan_draft_journal_events WHERE command_id = ? ORDER BY sequence DESC LIMIT 1",
      )
      .get(commandId);
  }

  private insertEvent(row: Record<string, unknown>): void {
    this.db
      .prepare(
        "INSERT INTO plan_draft_journal_events VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .run(...Object.values(row), ledgerRowDigest(row, "event_digest"));
  }

  private run(operation: () => void): void {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      operation();
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }
}

function eventRow(input: {
  command: DraftJournalCommand;
  sequence: number;
  eventKind: "intent" | "committed" | "recovery_required";
  occurredAt: string;
  receipt?: DraftReceiptBinding;
  reason?: string;
  previousEventDigest?: string;
}): Record<string, unknown> {
  return {
    journal_event_id: `journal-event:${input.command.commandId}:${input.sequence}`,
    command_id: input.command.commandId,
    sequence: input.sequence,
    command_payload_digest: input.command.payloadDigest,
    event_kind: input.eventKind,
    requested_plan_id: input.command.planId,
    requested_source_path: input.command.sourcePath,
    plan_asset_id: input.receipt?.assetId ?? null,
    plan_revision: input.receipt?.revision ?? null,
    certificate_id: input.receipt?.certificateId ?? null,
    occurred_at: input.occurredAt,
    failure_reason: input.reason ?? null,
    previous_event_digest: input.previousEventDigest ?? null,
  };
}

function binding(row: Record<string, unknown>): DraftReceiptBinding {
  const result = {
    assetId: String(row.plan_asset_id),
    revision: Number(row.plan_revision),
    certificateId: String(row.certificate_id),
    commandPayloadDigest: String(row.command_payload_digest),
    ...(typeof row.certificate_digest === "string"
      ? { certificateDigest: row.certificate_digest }
      : {}),
  };
  if (
    !result.assetId ||
    !result.certificateId ||
    !/^[a-f0-9]{64}$/.test(result.commandPayloadDigest) ||
    !Number.isSafeInteger(result.revision) ||
    result.revision < 1
  )
    throw new DraftJournalIntegrityError("draft-journal-receipt-invalid");
  return result;
}

function secureEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function validTime(value: string): boolean {
  return !Number.isNaN(Date.parse(value));
}
