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
  readonly claimGeneration: number;
}

export interface GenesisProjectionClaimRequest {
  readonly ownerToken: string;
  readonly claimedAt: string;
  readonly expiresAt: string;
  readonly limit?: number;
}

export interface GenesisProjectionClaimFence {
  readonly commandId: string;
  readonly ownerToken: string;
  readonly claimGeneration: number;
}

export interface GenesisProjectionRenewalRequest extends GenesisProjectionClaimFence {
  readonly claimedAt: string;
  readonly expiresAt: string;
}

interface ProjectionTransition extends GenesisProjectionClaimFence {
  readonly eventKind: "projected" | "recovery_required";
  readonly failureReason: string | null;
  readonly occurredAt: string;
}

interface ClaimEventInput {
  readonly commandId: string;
  readonly ownerToken: string;
  readonly expiresAt: string;
  readonly occurredAt: string;
  readonly eventKind: "claimed" | "released";
}

export interface GenesisProjectionOutboxStore {
  pending(limit?: number): readonly GenesisProjectionOutboxEntry[];
  findPending(commandId: string): GenesisProjectionOutboxEntry | undefined;
  claimPending(request: GenesisProjectionClaimRequest): readonly GenesisProjectionClaim[];
  claimCommand(
    commandId: string,
    request: GenesisProjectionClaimRequest,
  ): GenesisProjectionClaim | undefined;
  renewClaim(request: GenesisProjectionRenewalRequest): number;
  markProjected(input: GenesisProjectionClaimFence & { readonly occurredAt: string }): void;
  markRecoveryRequired(
    input: GenesisProjectionClaimFence & {
      readonly reason: string;
      readonly occurredAt: string;
    },
  ): void;
}

/** Plan Ledgerと同じSQLite authority内でoutbox transition chainを管理する。 */
export class SqliteGenesisProjectionOutboxStore implements GenesisProjectionOutboxStore {
  constructor(private readonly db: HarnessDb) {
    if (!migratePlanLedger(db).ok) throw new Error("plan-ledger-unavailable");
  }

  pending(limit = 100): readonly GenesisProjectionOutboxEntry[] {
    if (!Number.isSafeInteger(limit) || limit < 1) throw new Error("genesis-outbox-limit-invalid");
    this.auditClaims();
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
    this.auditClaims();
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
      this.auditClaims();
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
      this.auditClaims();
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

  renewClaim(request: GenesisProjectionRenewalRequest): number {
    validateClaimRequest({
      ownerToken: request.ownerToken,
      claimedAt: request.claimedAt,
      expiresAt: request.expiresAt,
    });
    return new ImmediateLedgerTransaction(this.db).run(() => {
      this.auditClaims();
      this.assertClaimOwner(request, request.claimedAt);
      const generation = this.appendClaimEvent({
        commandId: request.commandId,
        ownerToken: request.ownerToken,
        expiresAt: request.expiresAt,
        occurredAt: request.claimedAt,
        eventKind: "claimed",
      });
      return { commit: true, value: generation };
    });
  }

  markProjected(input: GenesisProjectionClaimFence & { readonly occurredAt: string }): void {
    this.transition({
      ...input,
      eventKind: "projected",
      failureReason: null,
    });
  }

  markRecoveryRequired(
    input: GenesisProjectionClaimFence & { readonly reason: string; readonly occurredAt: string },
  ): void {
    if (!input.reason) throw new Error("genesis-outbox-failure-reason-invalid");
    this.transition({
      ...input,
      eventKind: "recovery_required",
      failureReason: input.reason,
    });
  }

  private transition(input: ProjectionTransition): void {
    new ImmediateLedgerTransaction(this.db).run(() => ({
      commit: true,
      value: this.transitionInTransaction(input),
    }));
  }

  private transitionInTransaction(input: ProjectionTransition): void {
    const { commandId, ownerToken, eventKind, failureReason, occurredAt } = input;
    this.auditClaims();
    this.assertClaimOwner(input, occurredAt);
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
      if (eventKind === "projected") return;
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
    this.appendClaimEvent({
      commandId,
      ownerToken,
      expiresAt: occurredAt,
      occurredAt,
      eventKind: "released",
    });
  }

  private claimRow(
    row: Record<string, unknown>,
    request: GenesisProjectionClaimRequest,
  ): GenesisProjectionClaim {
    this.assertClaimSnapshot(row.command_id);
    const entry = this.readEntry(row);
    const claimGeneration = this.appendClaimEvent({
      commandId: entry.commandId,
      ownerToken: request.ownerToken,
      expiresAt: request.expiresAt,
      occurredAt: request.claimedAt,
      eventKind: "claimed",
    });
    return {
      ...entry,
      ownerToken: request.ownerToken,
      claimExpiresAt: request.expiresAt,
      claimGeneration,
    };
  }

  private assertClaimOwner(fence: GenesisProjectionClaimFence, occurredAt: string): void {
    const claim = this.db
      .prepare("SELECT * FROM genesis_projection_claims WHERE command_id = ?")
      .get(fence.commandId);
    const latest = this.db
      .prepare(
        "SELECT sequence FROM genesis_projection_claim_events WHERE command_id = ? ORDER BY sequence DESC LIMIT 1",
      )
      .get(fence.commandId);
    if (
      !claim ||
      !latest ||
      claim.claim_state !== "active" ||
      claim.owner_token !== fence.ownerToken ||
      Number(latest.sequence) !== fence.claimGeneration ||
      String(claim.claim_expires_at) < occurredAt
    )
      throw new Error("genesis-outbox-stale-claim-owner");
  }

  private appendClaimEvent(input: ClaimEventInput): number {
    const { commandId, ownerToken, expiresAt, occurredAt, eventKind } = input;
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
    return sequence;
  }

  private auditClaims(): void {
    for (const row of this.db.prepare("SELECT command_id FROM genesis_projection_claims").all())
      this.assertClaimSnapshot(row.command_id);
  }

  private assertClaimSnapshot(commandId: unknown): void {
    const snapshot = this.db
      .prepare("SELECT * FROM genesis_projection_claims WHERE command_id = ?")
      .get(commandId);
    if (!snapshot) return;
    const latest = this.db
      .prepare(
        "SELECT * FROM genesis_projection_claim_events WHERE command_id = ? ORDER BY sequence DESC LIMIT 1",
      )
      .get(commandId);
    if (
      !latest ||
      latest.event_digest !== ledgerRowDigest(latest, "event_digest") ||
      snapshot.last_event_digest !== latest.event_digest ||
      snapshot.owner_token !== latest.owner_token ||
      snapshot.claim_expires_at !== latest.claim_expires_at ||
      snapshot.claim_state !== (latest.event_kind === "released" ? "released" : "active")
    )
      throw new Error("genesis-outbox-claim-chain-invalid");
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
