import type { HarnessDb } from "../../state-db/index.js";
import { ledgerRowDigest, migratePlanLedger } from "./schema.js";
import { ImmediateLedgerTransaction } from "./transaction.js";

export interface GenesisProjectionOutboxEntry {
  readonly commandId: string;
  readonly issueNumber: number;
  readonly issuePreimageDigest: string;
  readonly assetId: string;
  readonly revision: 1;
  readonly status: "pending" | "recovery_required";
  readonly attemptCount: number;
  readonly nextAttemptAt: string;
}

export interface GenesisProjectionOutboxStore {
  pending(limit?: number): readonly GenesisProjectionOutboxEntry[];
  findPending(commandId: string): GenesisProjectionOutboxEntry | undefined;
  markProjected(commandId: string, occurredAt: string): void;
  markRecoveryRequired(commandId: string, reason: string, occurredAt: string): void;
}

/** Plan Ledgerと同じSQLite authority内でoutbox transition chainを管理する。 */
export class SqliteGenesisProjectionOutboxStore implements GenesisProjectionOutboxStore {
  constructor(private readonly db: HarnessDb) {
    if (!migratePlanLedger(db).ok) throw new Error("plan-ledger-unavailable");
  }

  pending(limit = 100): readonly GenesisProjectionOutboxEntry[] {
    if (!Number.isSafeInteger(limit) || limit < 1) throw new Error("genesis-outbox-limit-invalid");
    return this.db
      .prepare(
        `SELECT * FROM genesis_projection_outbox
         WHERE status IN ('pending', 'recovery_required')
         ORDER BY next_attempt_at, command_id LIMIT ?`,
      )
      .all(limit)
      .map((row) => this.readEntry(row));
  }

  findPending(commandId: string): GenesisProjectionOutboxEntry | undefined {
    if (!commandId) throw new Error("genesis-outbox-command-id-invalid");
    const row = this.db
      .prepare(
        `SELECT * FROM genesis_projection_outbox
         WHERE command_id = ? AND status IN ('pending', 'recovery_required')`,
      )
      .get(commandId);
    return row ? this.readEntry(row) : undefined;
  }

  markProjected(commandId: string, occurredAt: string): void {
    this.transition(commandId, "projected", null, occurredAt);
  }

  markRecoveryRequired(commandId: string, reason: string, occurredAt: string): void {
    if (!reason) throw new Error("genesis-outbox-failure-reason-invalid");
    this.transition(commandId, "recovery_required", reason, occurredAt);
  }

  private transition(
    commandId: string,
    eventKind: "projected" | "recovery_required",
    failureReason: string | null,
    occurredAt: string,
  ): void {
    new ImmediateLedgerTransaction(this.db).run(() => {
      const current = this.db
        .prepare("SELECT * FROM genesis_projection_outbox WHERE command_id = ?")
        .get(commandId);
      if (!current) throw new Error("genesis-outbox-command-missing");
      const latest = this.db
        .prepare(
          "SELECT * FROM genesis_projection_outbox_events WHERE command_id = ? ORDER BY sequence DESC LIMIT 1",
        )
        .get(commandId);
      if (
        !latest ||
        current.last_event_digest !== latest.event_digest ||
        latest.event_digest !== ledgerRowDigest(latest, "event_digest") ||
        current.payload_digest !== latest.payload_digest
      )
        throw new Error("genesis-outbox-chain-invalid");
      if (current.status === "projected") {
        if (eventKind === "projected") return { commit: false, value: undefined };
        throw new Error("genesis-outbox-terminal-conflict");
      }
      const sequence = Number(latest.sequence) + 1;
      const event = {
        outbox_event_id: `genesis-outbox:${commandId}:${sequence}`,
        command_id: commandId,
        sequence,
        event_kind: eventKind,
        payload_digest: String(current.payload_digest),
        occurred_at: occurredAt,
        failure_reason: failureReason,
        previous_event_digest: String(latest.event_digest),
      };
      const eventDigest = ledgerRowDigest(event, "event_digest");
      this.db
        .prepare("INSERT INTO genesis_projection_outbox_events VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .run(...Object.values(event), eventDigest);
      this.db
        .prepare(
          `UPDATE genesis_projection_outbox SET status = ?, attempt_count = attempt_count + 1,
           next_attempt_at = ?, completed_at = ?, failure_reason = ?, last_event_digest = ?
           WHERE command_id = ?`,
        )
        .run(
          eventKind,
          occurredAt,
          eventKind === "projected" ? occurredAt : null,
          failureReason,
          eventDigest,
          commandId,
        );
      return { commit: true, value: undefined };
    });
  }

  private readEntry(row: Record<string, unknown>): GenesisProjectionOutboxEntry {
    const latest = this.db
      .prepare(
        "SELECT * FROM genesis_projection_outbox_events WHERE command_id = ? ORDER BY sequence DESC LIMIT 1",
      )
      .get(row.command_id);
    if (
      !latest ||
      row.last_event_digest !== latest.event_digest ||
      latest.event_digest !== ledgerRowDigest(latest, "event_digest") ||
      row.payload_digest !== latest.payload_digest
    )
      throw new Error("genesis-outbox-chain-invalid");
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(String(row.payload_json)) as Record<string, unknown>;
    } catch {
      throw new Error("genesis-outbox-payload-invalid");
    }
    if (
      typeof payload.issueNumber !== "number" ||
      typeof payload.issuePreimageDigest !== "string" ||
      typeof payload.assetId !== "string" ||
      payload.revision !== 1 ||
      (row.status !== "pending" && row.status !== "recovery_required")
    )
      throw new Error("genesis-outbox-payload-invalid");
    return {
      commandId: String(row.command_id),
      issueNumber: payload.issueNumber,
      issuePreimageDigest: payload.issuePreimageDigest,
      assetId: payload.assetId,
      revision: 1,
      status: row.status,
      attemptCount: Number(row.attempt_count),
      nextAttemptAt: String(row.next_attempt_at),
    };
  }
}
