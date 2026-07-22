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

export interface GenesisProjectionClaim extends GenesisProjectionOutboxEntry {
  readonly ownerToken: string;
  readonly claimExpiresAt: string;
}

export interface GenesisProjectionClaimRequest {
  readonly ownerToken: string;
  readonly claimedAt: string;
  readonly expiresAt: string;
  readonly limit?: number;
}

export interface GenesisProjectionOutboxStore {
  pending(limit?: number): readonly GenesisProjectionOutboxEntry[];
  findPending(commandId: string): GenesisProjectionOutboxEntry | undefined;
  claimPending(request: GenesisProjectionClaimRequest): readonly GenesisProjectionClaim[];
  claimCommand(
    commandId: string,
    request: GenesisProjectionClaimRequest,
  ): GenesisProjectionClaim | undefined;
  markProjected(commandId: string, ownerToken: string, occurredAt: string): void;
  markRecoveryRequired(
    commandId: string,
    ownerToken: string,
    reason: string,
    occurredAt: string,
  ): void;
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

  claimPending(request: GenesisProjectionClaimRequest): readonly GenesisProjectionClaim[] {
    validateClaimRequest(request);
    return new ImmediateLedgerTransaction(this.db).run(() => {
      const rows = this.db
        .prepare(
          `SELECT outbox.* FROM genesis_projection_outbox outbox
           LEFT JOIN genesis_projection_claims claim ON claim.command_id = outbox.command_id
           WHERE outbox.status IN ('pending', 'recovery_required')
             AND (claim.command_id IS NULL OR claim.claim_state = 'released' OR claim.claim_expires_at <= ?)
           ORDER BY outbox.next_attempt_at, outbox.command_id LIMIT ?`,
        )
        .all(request.claimedAt, request.limit ?? 100);
      const claimed = rows.map((row) => this.claimRow(row, request));
      return { commit: claimed.length > 0, value: claimed };
    });
  }

  claimCommand(
    commandId: string,
    request: GenesisProjectionClaimRequest,
  ): GenesisProjectionClaim | undefined {
    if (!commandId) throw new Error("genesis-outbox-command-id-invalid");
    validateClaimRequest(request);
    return new ImmediateLedgerTransaction(this.db).run(() => {
      const row = this.db
        .prepare(
          `SELECT outbox.* FROM genesis_projection_outbox outbox
           LEFT JOIN genesis_projection_claims claim ON claim.command_id = outbox.command_id
           WHERE outbox.command_id = ? AND outbox.status IN ('pending', 'recovery_required')
             AND (claim.command_id IS NULL OR claim.claim_state = 'released' OR claim.claim_expires_at <= ?)`,
        )
        .get(commandId, request.claimedAt);
      const claimed = row ? this.claimRow(row, request) : undefined;
      return { commit: Boolean(claimed), value: claimed };
    });
  }

  markProjected(commandId: string, ownerToken: string, occurredAt: string): void {
    this.transition(commandId, ownerToken, "projected", null, occurredAt);
  }

  markRecoveryRequired(
    commandId: string,
    ownerToken: string,
    reason: string,
    occurredAt: string,
  ): void {
    if (!reason) throw new Error("genesis-outbox-failure-reason-invalid");
    this.transition(commandId, ownerToken, "recovery_required", reason, occurredAt);
  }

  private transition(
    commandId: string,
    ownerToken: string,
    eventKind: "projected" | "recovery_required",
    failureReason: string | null,
    occurredAt: string,
  ): void {
    new ImmediateLedgerTransaction(this.db).run(() => {
      this.assertClaimOwner(commandId, ownerToken, occurredAt);
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
      this.appendClaimEvent(commandId, ownerToken, occurredAt, occurredAt, "released");
      return { commit: true, value: undefined };
    });
  }

  private claimRow(
    row: Record<string, unknown>,
    request: GenesisProjectionClaimRequest,
  ): GenesisProjectionClaim {
    const entry = this.readEntry(row);
    this.appendClaimEvent(
      entry.commandId,
      request.ownerToken,
      request.expiresAt,
      request.claimedAt,
      "claimed",
    );
    return { ...entry, ownerToken: request.ownerToken, claimExpiresAt: request.expiresAt };
  }

  private assertClaimOwner(commandId: string, ownerToken: string, occurredAt: string): void {
    const claim = this.db
      .prepare("SELECT * FROM genesis_projection_claims WHERE command_id = ?")
      .get(commandId);
    if (
      !claim ||
      claim.claim_state !== "active" ||
      claim.owner_token !== ownerToken ||
      String(claim.claim_expires_at) < occurredAt
    )
      throw new Error("genesis-outbox-stale-claim-owner");
  }

  private appendClaimEvent(
    commandId: string,
    ownerToken: string,
    expiresAt: string,
    occurredAt: string,
    eventKind: "claimed" | "released",
  ): void {
    const prior = this.db
      .prepare(
        "SELECT * FROM genesis_projection_claim_events WHERE command_id = ? ORDER BY sequence DESC LIMIT 1",
      )
      .get(commandId);
    const sequence = Number(prior?.sequence ?? 0) + 1;
    const event = {
      claim_event_id: `genesis-claim:${commandId}:${sequence}`,
      command_id: commandId,
      sequence,
      event_kind: eventKind,
      owner_token: ownerToken,
      claim_expires_at: expiresAt,
      occurred_at: occurredAt,
      previous_event_digest: prior?.event_digest ?? null,
    };
    const eventDigest = ledgerRowDigest(event, "event_digest");
    this.db
      .prepare("INSERT INTO genesis_projection_claim_events VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .run(...Object.values(event), eventDigest);
    this.db
      .prepare(
        `INSERT INTO genesis_projection_claims VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(command_id) DO UPDATE SET claim_state = excluded.claim_state,
           owner_token = excluded.owner_token, claim_expires_at = excluded.claim_expires_at,
           last_event_digest = excluded.last_event_digest`,
      )
      .run(
        commandId,
        eventKind === "claimed" ? "active" : "released",
        ownerToken,
        expiresAt,
        eventDigest,
      );
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

function validateClaimRequest(request: GenesisProjectionClaimRequest): void {
  const claimed = Date.parse(request.claimedAt);
  const expires = Date.parse(request.expiresAt);
  if (
    !request.ownerToken ||
    request.ownerToken.length > 200 ||
    !Number.isFinite(claimed) ||
    !Number.isFinite(expires) ||
    expires <= claimed ||
    expires - claimed > 300_000 ||
    (request.limit !== undefined && (!Number.isSafeInteger(request.limit) || request.limit < 1))
  )
    throw new Error("genesis-outbox-claim-invalid");
}
