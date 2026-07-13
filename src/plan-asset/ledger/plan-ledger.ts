import { timingSafeEqual } from "node:crypto";
import type { HarnessDb } from "../../state-db/index.js";
import { AppendCommandTransaction, type AppendResult } from "./append-command.js";
import { ledgerRowDigest, migratePlanLedger } from "./schema.js";
import type { LedgerTransactionPort } from "./transaction.js";

type LedgerResult = AppendResult;

interface ReserveInput {
  readonly reservationId: string;
  readonly namespace: string;
  readonly ordinal: number;
  readonly assetId: string;
  readonly leaseTokenHash: string;
  readonly commandId: string;
  readonly occurredAt: string;
  readonly expiresAt: string;
}

interface CloseInput {
  readonly reservationId: string;
  readonly commandId: string;
  readonly occurredAt: string;
}

export class PlanLedger {
  private readonly appendCommands: AppendCommandTransaction;

  constructor(
    private readonly db: HarnessDb,
    transactionPort?: LedgerTransactionPort,
  ) {
    if (!migratePlanLedger(db).ok) throw new Error("plan-ledger-unavailable");
    this.appendCommands = new AppendCommandTransaction(db, transactionPort);
  }

  reconstruct(reservationId: string):
    | {
        readonly ok: true;
        readonly state: Readonly<Record<string, unknown>>;
        readonly eventDigests: readonly string[];
        readonly payloadDigests: readonly string[];
      }
    | { readonly ok: false; readonly ruleId: string } {
    if (!migratePlanLedger(this.db).ok) {
      return { ok: false, ruleId: "plan-ledger-unavailable" };
    }
    const state = this.db
      .prepare("SELECT * FROM plan_id_reservations WHERE reservation_id = ?")
      .get(reservationId);
    if (!state) return { ok: false, ruleId: "plan-id-reservation-not-found" };
    const events = this.db
      .prepare(
        "SELECT event_digest, command_payload_digest FROM plan_id_reservation_events WHERE reservation_id = ? ORDER BY sequence",
      )
      .all(reservationId);
    return {
      ok: true,
      state: Object.freeze({ ...state }),
      eventDigests: Object.freeze(events.map((event) => String(event.event_digest))),
      payloadDigests: Object.freeze(events.map((event) => String(event.command_payload_digest))),
    };
  }

  reserve(input: ReserveInput): LedgerResult {
    return this.transaction({
      commandId: input.commandId,
      commandType: "reservation.reserve",
      payload: { ...input },
      append: (payloadDigest) => {
        if (!validReserveInput(input)) return failed("plan-id-reservation-invalid");
        if (!this.assetExists(input.assetId)) return failed("plan-asset-not-found");
        if (this.activeOrdinalExists(input.namespace, input.ordinal)) {
          return failed("plan-id-reservation-conflict");
        }
        const event = reservationEvent({
          ...input,
          sequence: 1,
          eventKind: "reserved",
          commandPayloadDigest: payloadDigest,
        });
        this.insertReservationEvent(event);
        this.db
          .prepare("INSERT INTO plan_id_reservations VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
          .run(
            input.reservationId,
            input.namespace,
            input.ordinal,
            input.assetId,
            input.leaseTokenHash,
            "active",
            input.occurredAt,
            input.expiresAt,
            null,
            event.event_digest,
          );
        return succeeded(String(event.reservation_event_id));
      },
    });
  }

  release(input: CloseInput & { readonly leaseTokenHash: string }): LedgerResult {
    return this.close({
      eventKind: "released",
      commandType: "reservation.release",
      input,
      guard: (current) => {
        if (!sameToken(String(current.lease_token_hash), input.leaseTokenHash)) {
          return "plan-id-reservation-token-mismatch";
        }
        return Date.parse(input.occurredAt) < Date.parse(String(current.expires_at))
          ? null
          : "plan-id-reservation-not-active";
      },
    });
  }

  expire(input: CloseInput): LedgerResult {
    return this.close({
      eventKind: "expired",
      commandType: "reservation.expire",
      input,
      guard: (current) =>
        Date.parse(input.occurredAt) >= Date.parse(String(current.expires_at))
          ? null
          : "plan-id-reservation-not-expired",
    });
  }

  private close(options: {
    eventKind: "released" | "expired";
    commandType: string;
    input: CloseInput;
    guard: (current: Record<string, unknown>) => string | null;
  }): LedgerResult {
    const { eventKind, commandType, input, guard } = options;
    return this.transaction({
      commandId: input.commandId,
      commandType,
      payload: { ...input },
      append: (payloadDigest) => {
        const current = this.db
          .prepare("SELECT * FROM plan_id_reservations WHERE reservation_id = ?")
          .get(input.reservationId);
        if (!current || current.status !== "active") {
          return failed("plan-id-reservation-not-active");
        }
        const violation = guard(current);
        if (violation) return failed(violation);
        const sequence = this.nextSequence(input.reservationId);
        const event = reservationEvent({
          reservationId: input.reservationId,
          namespace: String(current.namespace),
          ordinal: Number(current.ordinal),
          assetId: String(current.asset_id),
          leaseTokenHash: String(current.lease_token_hash),
          commandId: input.commandId,
          occurredAt: input.occurredAt,
          expiresAt: String(current.expires_at),
          sequence,
          eventKind,
          commandPayloadDigest: payloadDigest,
        });
        this.insertReservationEvent(event);
        this.db
          .prepare(
            "UPDATE plan_id_reservations SET status = ?, closed_at = ?, last_event_digest = ? WHERE reservation_id = ?",
          )
          .run(eventKind, input.occurredAt, event.event_digest, input.reservationId);
        return succeeded(String(event.reservation_event_id));
      },
    });
  }

  private transaction(options: {
    commandId: string;
    commandType: string;
    payload: Readonly<Record<string, unknown>>;
    append: (payloadDigest: string) => LedgerResult;
  }): LedgerResult {
    const { commandId, commandType, payload, append } = options;
    if (!migratePlanLedger(this.db).ok) return failed("plan-ledger-unavailable");
    return this.appendCommands.run(
      {
        commandId,
        commandType,
        subjectKind: "reservation",
        subjectKey: String(payload.reservationId),
        payload: withoutCommandContext(payload),
        recordedAt: String(payload.occurredAt),
        resultKind: "reservation_event",
        conflictRuleId: "plan-id-reservation-command-conflict",
      },
      append,
    );
  }

  private insertReservationEvent(event: Readonly<Record<string, unknown>>): void {
    this.db
      .prepare(
        "INSERT INTO plan_id_reservation_events VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .run(...Object.values(event));
  }

  private assetExists(assetId: string): boolean {
    return Boolean(this.db.prepare("SELECT 1 FROM plan_assets WHERE asset_id = ?").get(assetId));
  }

  private activeOrdinalExists(namespace: string, ordinal: number): boolean {
    return Boolean(
      this.db
        .prepare(
          "SELECT 1 FROM plan_id_reservations WHERE namespace = ? AND ordinal = ? AND status = 'active'",
        )
        .get(namespace, ordinal),
    );
  }

  private nextSequence(reservationId: string): number {
    const row = this.db
      .prepare(
        "SELECT COALESCE(MAX(sequence), 0) + 1 AS sequence FROM plan_id_reservation_events WHERE reservation_id = ?",
      )
      .get(reservationId);
    return Number(row?.sequence ?? 1);
  }
}

function reservationEvent(
  input: ReserveInput & {
    sequence: number;
    eventKind: "reserved" | "released" | "expired";
    commandPayloadDigest: string;
  },
): Readonly<Record<string, unknown>> {
  const row = {
    reservation_event_id: `${input.reservationId}:event:${input.sequence}`,
    reservation_id: input.reservationId,
    sequence: input.sequence,
    command_id: input.commandId,
    command_payload_digest: input.commandPayloadDigest,
    event_kind: input.eventKind,
    namespace: input.namespace,
    ordinal: input.ordinal,
    asset_id: input.assetId,
    lease_token_hash: input.leaseTokenHash,
    occurred_at: input.occurredAt,
    expires_at: input.expiresAt,
  };
  return Object.freeze({ ...row, event_digest: ledgerRowDigest(row, "event_digest") });
}

function withoutCommandContext(
  payload: Readonly<Record<string, unknown>>,
): Readonly<Record<string, unknown>> {
  return Object.fromEntries(
    Object.entries(payload).filter(([key]) => key !== "commandId" && key !== "occurredAt"),
  );
}

function sameToken(expected: string, actual: string): boolean {
  const left = Buffer.from(expected);
  const right = Buffer.from(actual);
  return left.length === right.length && timingSafeEqual(left, right);
}

function validReserveInput(input: ReserveInput): boolean {
  return (
    Boolean(input.reservationId.trim()) &&
    Boolean(input.namespace.trim()) &&
    Number.isSafeInteger(input.ordinal) &&
    input.ordinal > 0 &&
    /^[a-f0-9]{64}$/.test(input.leaseTokenHash) &&
    Number.isFinite(Date.parse(input.occurredAt)) &&
    Number.isFinite(Date.parse(input.expiresAt)) &&
    Date.parse(input.expiresAt) > Date.parse(input.occurredAt)
  );
}

function succeeded(resultRef: string): LedgerResult {
  return { ok: true, replayed: false, resultRef };
}

function failed(ruleId: string): LedgerResult {
  return { ok: false, ruleId };
}
