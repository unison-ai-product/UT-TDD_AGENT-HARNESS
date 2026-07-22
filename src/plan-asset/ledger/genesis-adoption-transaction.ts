import { createHash, timingSafeEqual } from "node:crypto";
import type { HarnessDb } from "../../state-db/index.js";
import { deriveLegacyAssetId } from "../adapters/legacy-plan-adapter.js";
import {
  deriveGenesisRouteTupleDigest,
  type GenesisRouteBinding,
} from "./genesis-route-binding.js";
import { ledgerRowDigest, migratePlanLedger } from "./schema.js";
import { ImmediateLedgerTransaction } from "./transaction.js";

export type GenesisAdoptionBoundary =
  | "issue-custody-prepare"
  | "asset"
  | "revision"
  | "alias-event"
  | "alias-current"
  | "admission-event"
  | "admission-receipt"
  | "command-receipt"
  | "issue-custody-commit";

export interface GenesisAdoptionInput {
  readonly commandId: string;
  readonly repositoryIdentity: string;
  readonly planId: string;
  readonly sourcePath: string;
  readonly sourceCommit: string;
  readonly sourceBlobOid: string;
  readonly sourceContentDigest: string;
  readonly canonicalPayloadJson: string;
  readonly canonicalPayloadDigest: string;
  readonly bodyDigest: string;
  readonly actor: string;
  readonly reason: string;
  readonly routeTupleDigest: string;
  readonly origin: GenesisRouteBinding["origin"];
  readonly reentry: GenesisRouteBinding["reentry"];
  readonly occurredAt: string;
  readonly issue: {
    readonly number: number;
    readonly episodeId: string;
    readonly driveModel: "redesign";
    readonly branch: string;
    readonly preimageDigest: string;
  };
}

export interface GenesisCustodyRecord {
  readonly commandId: string;
  readonly issueNumber: number;
  readonly episodeId: string;
  readonly driveModel: "redesign";
  readonly issuePreimageDigest: string;
  readonly assetId: string;
  readonly revision: 1;
}

export interface GenesisCustodyPort {
  prepare(record: GenesisCustodyRecord): void;
  commit(commandId: string): void;
  rollback(commandId: string): void;
}

export type GenesisAdoptionResult =
  | {
      readonly ok: true;
      readonly replayed: boolean;
      readonly assetId: string;
      readonly revision: 1;
      readonly issueNumber: number;
    }
  | { readonly ok: false; readonly ruleId: string };

/**
 * trusted-HEAD legacy PLAN rev1とIssue custodyを一つのlocal ledger transactionへ採用する。
 * remote GitHub projectionはこの境界に含めず、Node sagaのoutboxで後続収束させる。
 */
export class GenesisAdoptionTransaction {
  constructor(
    private readonly db: HarnessDb,
    private readonly custody: GenesisCustodyPort,
    private readonly fault?: { after(boundary: GenesisAdoptionBoundary): void },
  ) {
    if (!migratePlanLedger(db).ok) throw new Error("plan-ledger-unavailable");
  }

  adopt(input: GenesisAdoptionInput): GenesisAdoptionResult {
    const derived = derive(input);
    if (!derived.ok) return derived;
    const prior = this.replay(input, derived);
    if (prior) return prior;
    if (this.db.prepare("SELECT 1 FROM plan_assets WHERE asset_id = ?").get(derived.assetId))
      return rejected("genesis-adoption-asset-conflict");
    if (
      this.db
        .prepare("SELECT 1 FROM plan_aliases WHERE alias = ? AND valid_to_revision IS NULL")
        .get(input.planId)
    )
      return rejected("genesis-adoption-alias-conflict");

    const transaction = new ImmediateLedgerTransaction(this.db);
    try {
      return transaction.run(() => {
        const custody = custodyRecord(input, derived.assetId);
        this.custody.prepare(custody);
        this.fault?.after("issue-custody-prepare");
        this.appendPlanAsset(input, derived);
        this.appendAdmission(input, derived);
        this.custody.commit(input.commandId);
        this.fault?.after("issue-custody-commit");
        return {
          commit: true,
          value: success(false, derived.assetId, input.issue.number),
        };
      });
    } catch (error) {
      this.custody.rollback(input.commandId);
      throw error;
    }
  }

  private appendPlanAsset(input: GenesisAdoptionInput, value: DerivedGenesis): void {
    this.db
      .prepare("INSERT INTO plan_assets VALUES (?, ?, ?, ?)")
      .run(value.assetId, input.occurredAt, input.sourceCommit, "ut-tdd-plan-legacy-v1");
    this.fault?.after("asset");
    this.db
      .prepare("INSERT INTO plan_revisions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .run(
        value.assetId,
        1,
        input.canonicalPayloadJson,
        input.canonicalPayloadDigest,
        input.bodyDigest,
        input.sourcePath,
        input.sourceCommit,
        input.actor,
        input.reason,
        input.occurredAt,
      );
    this.fault?.after("revision");
    const provenance = {
      asset_id: value.assetId,
      revision: 1,
      source_path: input.sourcePath,
      source_commit: input.sourceCommit,
      source_blob_oid: input.sourceBlobOid,
      source_content_digest: input.sourceContentDigest,
      repository_identity: input.repositoryIdentity,
      identity_algorithm: "ut-tdd-plan-legacy-v1",
      identity_input_json: JSON.stringify([input.repositoryIdentity, input.planId]),
      identity_digest: sha(JSON.stringify([input.repositoryIdentity, input.planId])),
      recorded_at: input.occurredAt,
    };
    this.db
      .prepare(
        "INSERT INTO legacy_plan_bootstrap_provenance VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .run(...Object.values(provenance), ledgerRowDigest(provenance, "provenance_digest"));
    const alias = {
      alias_event_id: `alias:${input.commandId}:1`,
      asset_id: value.assetId,
      sequence: 1,
      command_id: input.commandId,
      command_payload_digest: value.commandDigest,
      event_kind: "assigned",
      alias: input.planId,
      revision: 1,
      reason: "genesis adoption",
      occurred_at: input.occurredAt,
    };
    const eventDigest = ledgerRowDigest(alias, "event_digest");
    this.db
      .prepare("INSERT INTO plan_alias_events VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .run(...Object.values(alias), eventDigest);
    this.fault?.after("alias-event");
    this.db
      .prepare("INSERT INTO plan_aliases VALUES (?, ?, ?, ?, ?, ?)")
      .run(`alias-current:${value.assetId}`, value.assetId, input.planId, 1, null, eventDigest);
    this.fault?.after("alias-current");
  }

  private appendAdmission(input: GenesisAdoptionInput, value: DerivedGenesis): void {
    const certificateId = `genesis:${input.commandId}`;
    const certificateDigest = sha(
      canonical({
        asset_id: value.assetId,
        command_digest: value.commandDigest,
        issue_preimage_digest: input.issue.preimageDigest,
        revision: 1,
      }),
    );
    const eventId = `admission:${certificateId}`;
    const event = {
      admission_event_id: eventId,
      command_id: input.commandId,
      command_payload_digest: value.commandDigest,
      event_kind: "admitted",
      plan_asset_id: value.assetId,
      plan_revision: 1,
      plan_id: input.planId,
      source_path: input.sourcePath,
      content_digest: input.sourceContentDigest,
      route_tuple_digest: input.routeTupleDigest,
      certificate_id: certificateId,
      certificate_digest: certificateDigest,
      occurred_at: input.occurredAt,
    };
    this.db
      .prepare(
        "INSERT INTO plan_admission_events VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .run(...Object.values(event), ledgerRowDigest(event, "event_digest"));
    this.fault?.after("admission-event");
    this.db
      .prepare("INSERT INTO plan_admission_receipts VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .run(
        certificateId,
        eventId,
        input.commandId,
        value.commandDigest,
        value.assetId,
        1,
        input.planId,
        input.sourcePath,
        input.sourceContentDigest,
        input.routeTupleDigest,
        certificateDigest,
        input.occurredAt,
      );
    this.fault?.after("admission-receipt");
    const receipt = {
      command_id: input.commandId,
      command_type: "plan.genesis-adopt",
      subject_kind: "plan_revision",
      subject_key: `${value.assetId}:1`,
      plan_asset_id: value.assetId,
      plan_revision: 1,
      command_payload_digest: value.commandDigest,
      result_kind: "genesis_admission_certificate",
      result_ref: certificateId,
      recorded_at: input.occurredAt,
    };
    this.db
      .prepare("INSERT INTO append_command_receipts VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .run(...Object.values(receipt), ledgerRowDigest(receipt, "receipt_digest"));
    this.fault?.after("command-receipt");
  }

  private replay(
    input: GenesisAdoptionInput,
    value: DerivedGenesis,
  ): GenesisAdoptionResult | undefined {
    const receipt = this.db
      .prepare("SELECT * FROM append_command_receipts WHERE command_id = ?")
      .get(input.commandId);
    if (!receipt) return undefined;
    if (!secureEqual(String(receipt.command_payload_digest), value.commandDigest))
      return rejected("genesis-adoption-command-conflict");
    const revision = this.db
      .prepare("SELECT * FROM plan_revisions WHERE asset_id = ? AND revision = 1")
      .get(value.assetId);
    const admission = this.db
      .prepare("SELECT * FROM plan_admission_receipts WHERE command_id = ?")
      .get(input.commandId);
    if (
      !revision ||
      !admission ||
      revision.canonical_payload_digest !== input.canonicalPayloadDigest ||
      revision.body_digest !== input.bodyDigest ||
      revision.source_commit !== input.sourceCommit ||
      admission.plan_asset_id !== value.assetId ||
      Number(admission.plan_revision) !== 1 ||
      receipt.receipt_digest !== ledgerRowDigest(receipt, "receipt_digest")
    )
      return rejected("genesis-adoption-receipt-binding-invalid");
    return success(true, value.assetId, input.issue.number);
  }
}

interface DerivedGenesis {
  readonly ok: true;
  readonly assetId: string;
  readonly commandDigest: string;
}

function derive(
  input: GenesisAdoptionInput,
): DerivedGenesis | { readonly ok: false; readonly ruleId: string } {
  if (
    validSha(input.routeTupleDigest) &&
    !secureEqual(input.routeTupleDigest, deriveGenesisRouteTupleDigest(input))
  )
    return rejected("genesis-adoption-route-tuple-digest-mismatch");
  if (
    !input.commandId ||
    !/^[^/]+\/[^/]+$/.test(input.repositoryIdentity) ||
    !/^PLAN-L(?:[0-9]|1[0-4])-/.test(input.planId) ||
    !/^docs\/plans\/[^/]+\.md$/.test(input.sourcePath.replaceAll("\\", "/")) ||
    !/^[0-9a-f]{40}$|^[0-9a-f]{64}$/.test(input.sourceCommit) ||
    !/^[0-9a-f]{40}$|^[0-9a-f]{64}$/.test(input.sourceBlobOid) ||
    input.issue.driveModel !== "redesign" ||
    !input.issue.branch.startsWith("work/redesign-") ||
    input.issue.number < 1 ||
    !/^E4-[1-9]\d*$/.test(input.issue.episodeId) ||
    !validSha(input.sourceContentDigest) ||
    !validSha(input.canonicalPayloadDigest) ||
    !validSha(input.bodyDigest) ||
    !validSha(input.routeTupleDigest) ||
    !validSha(input.issue.preimageDigest) ||
    !secureEqual(input.canonicalPayloadDigest, sha(input.canonicalPayloadJson))
  )
    return rejected("genesis-adoption-input-invalid");
  try {
    JSON.parse(input.canonicalPayloadJson);
  } catch {
    return rejected("genesis-adoption-input-invalid");
  }
  return {
    ok: true,
    assetId: deriveLegacyAssetId(input.repositoryIdentity, input.planId),
    commandDigest: sha(canonical(input)),
  };
}

function custodyRecord(input: GenesisAdoptionInput, assetId: string): GenesisCustodyRecord {
  return {
    commandId: input.commandId,
    issueNumber: input.issue.number,
    episodeId: input.issue.episodeId,
    driveModel: input.issue.driveModel,
    issuePreimageDigest: input.issue.preimageDigest,
    assetId,
    revision: 1,
  };
}

function success(replayed: boolean, assetId: string, issueNumber: number): GenesisAdoptionResult {
  return { ok: true, replayed, assetId, revision: 1, issueNumber };
}

function rejected(ruleId: string): { readonly ok: false; readonly ruleId: string } {
  return { ok: false, ruleId };
}

function validSha(value: string): boolean {
  return /^[0-9a-f]{64}$/.test(value);
}

function sha(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => `${JSON.stringify(key)}:${canonical(child)}`)
      .join(",")}}`;
  return JSON.stringify(value);
}

function secureEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}
