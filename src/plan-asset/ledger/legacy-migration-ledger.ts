import type { HarnessDb } from "../../state-db/index.js";
import { AppendCommandTransaction, type AppendResult } from "./append-command.js";
import { ledgerRowDigest, migratePlanLedger } from "./schema.js";
import type { LedgerTransactionPort } from "./transaction.js";

export interface ObserveMigrationInput {
  readonly legacyPlanId: string;
  readonly assetId: string;
  readonly collisionGroup: string | null;
  readonly reason: string;
  readonly reviewPlanId: string;
  readonly repositoryIdentity: string;
  readonly identityAlgorithm: string;
  readonly identityInputJson: string;
  readonly identityDigest: string;
  readonly identityConfigPath: string;
  readonly identityConfigBlobOid: string;
  readonly identityConfigContentDigest: string;
  readonly identityConfigReceiptDigest: string;
  readonly sourceDigest: string;
  readonly commandId: string;
  readonly occurredAt: string;
  readonly expectedSequence: 0;
}

export interface RejectMigrationInput {
  readonly legacyPlanId: string;
  readonly lossFields: readonly string[];
  readonly reason: string;
  readonly reviewPlanId: string;
  readonly commandId: string;
  readonly occurredAt: string;
  readonly expectedSequence: 1;
  readonly expectedDecision: "pending";
}

export class LegacyMigrationLedger {
  private readonly commands: AppendCommandTransaction;

  constructor(
    private readonly db: HarnessDb,
    transaction?: LedgerTransactionPort,
  ) {
    if (!migratePlanLedger(db).ok) throw new Error("plan-ledger-unavailable");
    this.commands = new AppendCommandTransaction(db, transaction);
  }

  observe(input: ObserveMigrationInput): AppendResult {
    if (!migratePlanLedger(this.db).ok) return failed("plan-ledger-unavailable");
    return this.commands.run(
      {
        commandId: input.commandId,
        commandType: "migration.observe",
        subjectKind: "legacy_migration",
        subjectKey: input.legacyPlanId,
        payload: withoutContext(input),
        recordedAt: input.occurredAt,
        resultKind: "migration_event",
        conflictRuleId: "plan-migration-command-conflict",
      },
      (payloadDigest) => this.appendObserved(input, payloadDigest),
    );
  }

  reject(input: RejectMigrationInput): AppendResult {
    if (!migratePlanLedger(this.db).ok) return failed("plan-ledger-unavailable");
    return this.commands.run(
      {
        commandId: input.commandId,
        commandType: "migration.decide",
        subjectKind: "legacy_migration",
        subjectKey: input.legacyPlanId,
        payload: withoutContext(input),
        recordedAt: input.occurredAt,
        resultKind: "migration_event",
        conflictRuleId: "plan-migration-command-conflict",
      },
      (payloadDigest) => this.appendRejected(input, payloadDigest),
    );
  }

  private appendObserved(input: ObserveMigrationInput, payloadDigest: string): AppendResult {
    const current = this.db
      .prepare("SELECT 1 FROM legacy_plan_migrations WHERE legacy_plan_id = ?")
      .get(input.legacyPlanId);
    if (current || input.expectedSequence !== 0) return failed("plan-migration-state-conflict");
    const event = observedEvent(input, payloadDigest);
    this.db
      .prepare(`INSERT INTO legacy_plan_migration_events VALUES (${placeholders(event)})`)
      .run(...Object.values(event));
    const projection = {
      migration_id: `migration:${input.legacyPlanId}`,
      legacy_plan_id: input.legacyPlanId,
      asset_id: input.assetId,
      target_asset_id: null,
      target_revision: null,
      decision: "pending",
      resolved_alias: null,
      collision_group: input.collisionGroup,
      loss_fields_json: "[]",
      reason: input.reason,
      review_plan_id: input.reviewPlanId,
      identity_digest: input.identityDigest,
      source_digest: input.sourceDigest,
      last_event_digest: event.event_digest,
    };
    this.db
      .prepare(`INSERT INTO legacy_plan_migrations VALUES (${placeholders(projection)})`)
      .run(...Object.values(projection));
    return { ok: true, replayed: false, resultRef: String(event.migration_event_id) };
  }

  private appendRejected(input: RejectMigrationInput, payloadDigest: string): AppendResult {
    const current = this.db
      .prepare("SELECT * FROM legacy_plan_migrations WHERE legacy_plan_id = ?")
      .get(input.legacyPlanId);
    const first = this.db
      .prepare(
        "SELECT * FROM legacy_plan_migration_events WHERE legacy_plan_id = ? AND sequence = 1",
      )
      .get(input.legacyPlanId);
    if (!current || !first || current.decision !== input.expectedDecision) {
      return failed("plan-migration-state-conflict");
    }
    const row = {
      ...first,
      migration_event_id: `migration:${input.legacyPlanId}:event:2`,
      sequence: input.expectedSequence + 1,
      command_id: input.commandId,
      command_payload_digest: payloadDigest,
      event_kind: "decided",
      decision: "rejected",
      resolved_alias: null,
      loss_fields_json: JSON.stringify(input.lossFields),
      reason: input.reason,
      review_plan_id: input.reviewPlanId,
      occurred_at: input.occurredAt,
      event_digest: undefined,
    };
    const { event_digest: _ignored, ...eventWithoutDigest } = row;
    const event = {
      ...eventWithoutDigest,
      event_digest: ledgerRowDigest(eventWithoutDigest, "event_digest"),
    };
    this.db
      .prepare(`INSERT INTO legacy_plan_migration_events VALUES (${placeholders(event)})`)
      .run(...Object.values(event));
    this.db
      .prepare(`UPDATE legacy_plan_migrations SET decision = 'rejected', resolved_alias = NULL,
        loss_fields_json = ?, reason = ?, review_plan_id = ?, last_event_digest = ? WHERE legacy_plan_id = ?`)
      .run(
        event.loss_fields_json,
        input.reason,
        input.reviewPlanId,
        event.event_digest,
        input.legacyPlanId,
      );
    return { ok: true, replayed: false, resultRef: String(event.migration_event_id) };
  }
}

function observedEvent(input: ObserveMigrationInput, payloadDigest: string) {
  const row = {
    migration_event_id: `migration:${input.legacyPlanId}:event:1`,
    legacy_plan_id: input.legacyPlanId,
    sequence: 1,
    command_id: input.commandId,
    command_payload_digest: payloadDigest,
    event_kind: "observed",
    asset_id: input.assetId,
    target_asset_id: null,
    target_revision: null,
    decision: "pending",
    resolved_alias: null,
    collision_group: input.collisionGroup,
    loss_fields_json: "[]",
    reason: input.reason,
    review_plan_id: input.reviewPlanId,
    repository_identity: input.repositoryIdentity,
    identity_algorithm: input.identityAlgorithm,
    identity_input_json: input.identityInputJson,
    identity_digest: input.identityDigest,
    identity_config_path: input.identityConfigPath,
    identity_config_blob_oid: input.identityConfigBlobOid,
    identity_config_content_digest: input.identityConfigContentDigest,
    identity_config_receipt_digest: input.identityConfigReceiptDigest,
    source_digest: input.sourceDigest,
    occurred_at: input.occurredAt,
  };
  return Object.freeze({ ...row, event_digest: ledgerRowDigest(row, "event_digest") });
}

function withoutContext(
  input: ObserveMigrationInput | RejectMigrationInput,
): Readonly<Record<string, unknown>> {
  return Object.fromEntries(
    Object.entries(input).filter(([key]) => key !== "commandId" && key !== "occurredAt"),
  );
}

function placeholders(row: object): string {
  return Object.keys(row)
    .map(() => "?")
    .join(",");
}

function failed(ruleId: string): AppendResult {
  return { ok: false, ruleId };
}
