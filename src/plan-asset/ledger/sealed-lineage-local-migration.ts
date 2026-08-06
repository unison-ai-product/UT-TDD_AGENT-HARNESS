import { createHash, timingSafeEqual } from "node:crypto";
import type { HarnessDb } from "../../state-db/index.ts";
import { ledgerRowDigest, migratePlanLedger } from "./schema.ts";
import { ImmediateLedgerTransaction } from "./transaction.ts";

export type SealedLineageBoundary =
  | "asset"
  | "revision"
  | "alias"
  | "admission"
  | "custody"
  | "seal"
  | "certificate"
  | "receipt";

export interface SealedLineageMigrationInput {
  readonly commandId: string;
  readonly planId: string;
  readonly historicalAssetId: string;
  readonly historicalTerminalRevision: number;
  readonly historicalTailDigest: string;
  readonly historicalProjectionPath: string;
  readonly historicalProjectionBlobOid: string;
  readonly historicalProjectionContentDigest: string;
  readonly successorAssetId: string;
  readonly canonicalPayloadJson: string;
  readonly canonicalPayloadDigest: string;
  readonly bodyDigest: string;
  readonly sourcePath: string;
  readonly sourceCommit: string;
  readonly actor: string;
  readonly occurredAt: string;
  readonly certificateDigest: string;
  readonly sourceAuthorityDigest: string;
  readonly reviewedImplementationAuthorityDigest: string;
  readonly trustedStatus: "draft";
  readonly issue: {
    readonly number: number;
    readonly episodeId: string;
    readonly preimageDigest: string;
  };
}

export type SealedLineageMigrationResult =
  | {
      readonly ok: true;
      readonly replayed: boolean;
      readonly successorAssetId: string;
      readonly successorRevision: 1;
    }
  | { readonly ok: false; readonly ruleId: string };

/**
 * 復元不能なtracked historyを推測でDB row化せずsealし、現HEADをsuccessor rev1へ移す。
 * remote comment/outboxは別portであり、このlocal writer transactionには含めない。
 */
export class SealedLineageLocalMigration {
  constructor(
    private readonly db: HarnessDb,
    private readonly fault?: { after(boundary: SealedLineageBoundary): void },
  ) {
    if (!migratePlanLedger(db).ok) throw new Error("plan-ledger-unavailable");
  }

  migrate(input: SealedLineageMigrationInput): SealedLineageMigrationResult {
    const checked = validate(input);
    if (!checked.ok) return checked;
    const transaction = new ImmediateLedgerTransaction(this.db);
    return transaction.run(() => {
      const replay = this.replay(input, checked.commandDigest);
      if (replay) return { commit: false, value: replay };
      const conflict = this.preflight(input);
      if (conflict) return { commit: false, value: conflict };
      this.appendSuccessor(input, checked);
      return {
        commit: true,
        value: {
          ok: true as const,
          replayed: false,
          successorAssetId: input.successorAssetId,
          successorRevision: 1 as const,
        },
      };
    });
  }

  private replay(
    input: SealedLineageMigrationInput,
    commandDigest: string,
  ): SealedLineageMigrationResult | undefined {
    const receipt = this.db
      .prepare("SELECT * FROM append_command_receipts WHERE command_id = ?")
      .get(input.commandId);
    if (!receipt) return undefined;
    if (!secureEqual(String(receipt.command_payload_digest), commandDigest))
      return rejected("sealed-lineage-command-conflict");
    const seal = this.db
      .prepare("SELECT * FROM sealed_plan_lineages WHERE command_id = ?")
      .get(input.commandId);
    const certificate = this.db
      .prepare("SELECT * FROM plan_lineage_migration_certificates WHERE command_id = ?")
      .get(input.commandId);
    const alias = this.db
      .prepare("SELECT * FROM plan_aliases WHERE alias = ? AND valid_to_revision IS NULL")
      .get(input.planId);
    const revision = this.db
      .prepare("SELECT * FROM plan_revisions WHERE asset_id = ? AND revision = 1")
      .get(input.successorAssetId);
    if (
      !seal ||
      !certificate ||
      !alias ||
      !revision ||
      String(alias.asset_id) !== input.successorAssetId ||
      String(seal.lineage_digest) !==
        ledgerRowDigest(without(seal, "lineage_digest"), "lineage_digest") ||
      String(certificate.record_digest) !==
        ledgerRowDigest(without(certificate, "record_digest"), "record_digest")
    )
      return rejected("sealed-lineage-replay-binding-invalid");
    return {
      ok: true,
      replayed: true,
      successorAssetId: input.successorAssetId,
      successorRevision: 1,
    };
  }

  private preflight(input: SealedLineageMigrationInput): SealedLineageMigrationResult | undefined {
    if (
      this.db
        .prepare("SELECT 1 FROM plan_assets WHERE asset_id IN (?, ?)")
        .get(input.historicalAssetId, input.successorAssetId) ||
      this.db.prepare("SELECT 1 FROM plan_aliases WHERE alias = ?").get(input.planId) ||
      this.db
        .prepare("SELECT 1 FROM plan_alias_events WHERE asset_id = ?")
        .get(input.historicalAssetId)
    )
      return rejected("sealed-lineage-partial-state");
    return undefined;
  }

  private appendSuccessor(
    input: SealedLineageMigrationInput,
    checked: Extract<ReturnType<typeof validate>, { ok: true }>,
  ): void {
    this.db
      .prepare("INSERT INTO plan_assets VALUES (?, ?, ?, ?)")
      .run(input.successorAssetId, input.occurredAt, input.sourceCommit, "ut-tdd-plan-rebase-v1");
    this.fault?.after("asset");
    this.db
      .prepare("INSERT INTO plan_revisions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .run(
        input.successorAssetId,
        1,
        input.canonicalPayloadJson,
        input.canonicalPayloadDigest,
        input.bodyDigest,
        input.sourcePath,
        input.sourceCommit,
        input.actor,
        "seal historical lineage and establish successor genesis",
        input.occurredAt,
      );
    this.fault?.after("revision");

    const aliasEvent = {
      alias_event_id: `alias:${input.commandId}:1`,
      asset_id: input.successorAssetId,
      sequence: 1,
      command_id: input.commandId,
      command_payload_digest: checked.commandDigest,
      event_kind: "assigned",
      alias: input.planId,
      revision: 1,
      reason: "sealed lineage successor",
      occurred_at: input.occurredAt,
    };
    const aliasDigest = ledgerRowDigest(aliasEvent, "event_digest");
    this.db
      .prepare("INSERT INTO plan_alias_events VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .run(...Object.values(aliasEvent), aliasDigest);
    this.db
      .prepare("INSERT INTO plan_aliases VALUES (?, ?, ?, ?, ?, ?)")
      .run(
        `alias-current:${input.successorAssetId}`,
        input.successorAssetId,
        input.planId,
        1,
        null,
        aliasDigest,
      );
    this.fault?.after("alias");

    const admission = {
      admission_event_id: `admission:${input.commandId}`,
      command_id: input.commandId,
      command_payload_digest: checked.commandDigest,
      event_kind: "admitted",
      plan_asset_id: input.successorAssetId,
      plan_revision: 1,
      plan_id: input.planId,
      source_path: input.sourcePath,
      content_digest: checked.contentDigest,
      route_tuple_digest: checked.routeDigest,
      certificate_id: `genesis-rebase:${input.commandId}`,
      certificate_digest: input.certificateDigest,
      occurred_at: input.occurredAt,
    };
    const admissionDigest = ledgerRowDigest(admission, "event_digest");
    this.db
      .prepare(
        "INSERT INTO plan_admission_events VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .run(...Object.values(admission), admissionDigest);
    this.db
      .prepare("INSERT INTO plan_admission_receipts VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .run(
        admission.certificate_id,
        admission.admission_event_id,
        input.commandId,
        checked.commandDigest,
        input.successorAssetId,
        1,
        input.planId,
        input.sourcePath,
        checked.contentDigest,
        checked.routeDigest,
        input.certificateDigest,
        input.occurredAt,
      );
    this.fault?.after("admission");

    const custody = {
      command_id: input.commandId,
      issue_number: input.issue.number,
      episode_id: input.issue.episodeId,
      drive_model: "recovery",
      issue_preimage_digest: input.issue.preimageDigest,
      plan_asset_id: input.successorAssetId,
      plan_revision: 1,
      custody_state: "committed",
      recorded_at: input.occurredAt,
    };
    this.db
      .prepare("INSERT INTO genesis_issue_custody VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .run(...Object.values(custody), ledgerRowDigest(custody, "custody_digest"));
    this.fault?.after("custody");

    const seal = {
      command_id: input.commandId,
      command_payload_digest: checked.commandDigest,
      plan_id: input.planId,
      historical_asset_id: input.historicalAssetId,
      historical_terminal_revision: input.historicalTerminalRevision,
      historical_tail_digest: input.historicalTailDigest,
      historical_projection_path: input.historicalProjectionPath,
      historical_projection_blob_oid: input.historicalProjectionBlobOid,
      historical_projection_content_digest: input.historicalProjectionContentDigest,
      disposition: "historical_sealed_unrehydratable",
      successor_asset_id: input.successorAssetId,
      successor_revision: 1,
      source_authority_digest: input.sourceAuthorityDigest,
      reviewed_implementation_authority_digest: input.reviewedImplementationAuthorityDigest,
      trusted_status: input.trustedStatus,
      certificate_digest: input.certificateDigest,
      occurred_at: input.occurredAt,
    };
    this.db
      .prepare(
        "INSERT INTO sealed_plan_lineages VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .run(...Object.values(seal), ledgerRowDigest(seal, "lineage_digest"));
    this.fault?.after("seal");

    const certificate = {
      certificate_digest: input.certificateDigest,
      command_id: input.commandId,
      command_payload_digest: checked.commandDigest,
      certificate_json: canonical({
        historicalAssetId: input.historicalAssetId,
        historicalTerminalRevision: input.historicalTerminalRevision,
        successorAssetId: input.successorAssetId,
        successorRevision: 1,
      }),
      source_authority_digest: input.sourceAuthorityDigest,
      reviewed_implementation_authority_digest: input.reviewedImplementationAuthorityDigest,
      recorded_at: input.occurredAt,
    };
    this.db
      .prepare("INSERT INTO plan_lineage_migration_certificates VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .run(...Object.values(certificate), ledgerRowDigest(certificate, "record_digest"));
    this.fault?.after("certificate");

    const receipt = {
      command_id: input.commandId,
      command_type: "plan.lineage-seal",
      subject_kind: "plan_revision",
      subject_key: `${input.successorAssetId}:1`,
      plan_asset_id: input.successorAssetId,
      plan_revision: 1,
      command_payload_digest: checked.commandDigest,
      result_kind: "lineage_migration_certificate",
      result_ref: input.certificateDigest,
      recorded_at: input.occurredAt,
    };
    this.db
      .prepare("INSERT INTO append_command_receipts VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .run(...Object.values(receipt), ledgerRowDigest(receipt, "receipt_digest"));
    this.fault?.after("receipt");
  }
}

function validate(input: SealedLineageMigrationInput):
  | {
      ok: true;
      commandDigest: string;
      contentDigest: string;
      routeDigest: string;
    }
  | { ok: false; ruleId: string } {
  const digests = [
    input.historicalTailDigest,
    input.historicalProjectionContentDigest,
    input.canonicalPayloadDigest,
    input.bodyDigest,
    input.certificateDigest,
    input.sourceAuthorityDigest,
    input.reviewedImplementationAuthorityDigest,
    input.issue.preimageDigest,
  ];
  if (
    !input.commandId ||
    !input.planId ||
    input.historicalAssetId === input.successorAssetId ||
    input.historicalTerminalRevision < 1 ||
    !/^[0-9a-f]{40}(?:[0-9a-f]{24})?$/.test(input.sourceCommit) ||
    !/^[0-9a-f]{40}(?:[0-9a-f]{24})?$/.test(input.historicalProjectionBlobOid) ||
    digests.some((value) => !/^[0-9a-f]{64}$/.test(value)) ||
    sha(input.canonicalPayloadJson) !== input.canonicalPayloadDigest ||
    input.trustedStatus !== "draft"
  )
    return rejected("sealed-lineage-input-invalid");
  return {
    ok: true,
    commandDigest: sha(canonical(input)),
    contentDigest: sha(`${input.canonicalPayloadDigest}:${input.bodyDigest}`),
    routeDigest: sha(canonical({ mode: "recovery", signal: "regression_dev" })),
  };
}

function rejected(ruleId: string): { ok: false; ruleId: string } {
  return { ok: false, ruleId };
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.entries(value as Record<string, unknown>)
      .filter(([, child]) => child !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => `${JSON.stringify(key)}:${canonical(child)}`)
      .join(",")}}`;
  return JSON.stringify(value);
}

function sha(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function secureEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function without(row: Record<string, unknown>, field: string): Record<string, unknown> {
  return Object.fromEntries(Object.entries(row).filter(([key]) => key !== field));
}
