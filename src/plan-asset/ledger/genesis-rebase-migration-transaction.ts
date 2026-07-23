import { createHash, timingSafeEqual } from "node:crypto";
import type { HarnessDb } from "../../state-db/index.js";
import type { GenesisRebaseCommentGroup } from "../application/genesis-rebase-comment-projection.js";
import { LEDGER_SCHEMA_VERSION, ledgerRowDigest } from "./schema.js";
import { ImmediateLedgerTransaction } from "./transaction.js";

const SHA = /^[a-f0-9]{64}$/;
const ASSET = /^plan:[a-z0-9][a-z0-9:-]{2,127}$/;
const PLAN = /^PLAN-[A-Za-z0-9-]+$/;

export type GenesisRebaseMigrationBoundary =
  | "asset"
  | "revision"
  | "alias-assign"
  | "admission-event"
  | "admission-receipt"
  | "custody"
  | "migration"
  | "certificate"
  | "comment-outbox"
  | "command-receipt";

export interface HistoricalRevisionSeal {
  readonly revision: number;
  readonly canonicalPayloadDigest: string;
  readonly bodyDigest: string;
  readonly sourcePath: string;
  readonly sourceCommit: string;
}

export interface GenesisRebaseMigrationInput {
  readonly commandId: string;
  readonly historicalAssetId: string;
  readonly historicalRevisions: readonly HistoricalRevisionSeal[];
  readonly historicalProjectionPath: string;
  readonly historicalProjectionBlobOid: string;
  readonly historicalProjectionContentDigest: string;
  readonly historicalProjectionTailDigest: string;
  readonly newAssetId: string;
  readonly newPlanId: string;
  readonly canonicalPayloadJson: string;
  readonly canonicalPayloadDigest: string;
  readonly bodyDigest: string;
  readonly sourcePath: string;
  readonly sourceCommit: string;
  readonly actor: string;
  readonly reason: string;
  readonly occurredAt: string;
  readonly authoritativeCertificate: {
    readonly certificateId: string;
    readonly certificateJson: string;
    readonly certificateDigest: string;
  };
  readonly commentGroup: GenesisRebaseCommentGroup;
  readonly issue: {
    readonly number: 143;
    readonly nodeId: "I_kwDOSkkE9M8AAAABJ2W8Aw";
    readonly bodyDigest: "88bc7746036283c0abfeaca70ecdde01cc499383d85c8e62636fd65989fbe3a9";
    readonly observedRevision: "2026-07-23T06:04:27Z";
    readonly episodeId: "E4-143";
    readonly branch: string;
  };
}

export type GenesisRebaseMigrationResult =
  | {
      readonly ok: true;
      readonly replayed: boolean;
      readonly certificateId: string;
      readonly certificateDigest: string;
    }
  | { readonly ok: false; readonly ruleId: string };

export class GenesisRebaseMigrationTransaction {
  constructor(
    private readonly db: HarnessDb,
    private readonly fault?: { after(boundary: GenesisRebaseMigrationBoundary): void },
  ) {
    if (db.userVersion() !== LEDGER_SCHEMA_VERSION) throw new Error("plan-ledger-unavailable");
  }

  migrate(input: GenesisRebaseMigrationInput): GenesisRebaseMigrationResult {
    const derived = derive(input);
    if (!derived) return rejected("genesis-rebase-input-invalid");
    return new ImmediateLedgerTransaction(this.db).run(() => {
      const prior = this.db
        .prepare("SELECT * FROM genesis_rebase_migrations WHERE command_id = ?")
        .get(input.commandId);
      if (prior) {
        if (!equal(String(prior.command_payload_digest), derived.commandPayloadDigest))
          return { commit: false, value: rejected("genesis-rebase-command-conflict") };
        const certificate = this.db
          .prepare(
            "SELECT certificate_id, certificate_digest FROM genesis_rebase_migration_certificates WHERE command_id = ?",
          )
          .get(input.commandId);
        if (
          !certificate ||
          !equal(String(certificate.certificate_digest), derived.certificateDigest) ||
          !this.replayMembersMatch(input, derived)
        )
          return { commit: false, value: rejected("genesis-rebase-replay-binding-invalid") };
        return {
          commit: false,
          value: success(
            true,
            String(certificate.certificate_id),
            String(certificate.certificate_digest),
          ),
        };
      }
      if (this.historicalStateExists(input))
        return { commit: false, value: rejected("genesis-rebase-historical-partial-state") };
      if (
        this.db.prepare("SELECT 1 FROM plan_assets WHERE asset_id = ?").get(input.newAssetId) ||
        this.db.prepare("SELECT 1 FROM plan_aliases WHERE alias = ?").get(input.newPlanId) ||
        this.db.prepare("SELECT 1 FROM plan_alias_events WHERE alias = ?").get(input.newPlanId)
      )
        return { commit: false, value: rejected("genesis-rebase-target-conflict") };
      this.db
        .prepare("INSERT INTO plan_assets VALUES (?, ?, ?, ?)")
        .run(input.newAssetId, input.occurredAt, input.sourceCommit, "ut-tdd-genesis-rebase-v1");
      this.fault?.after("asset");
      this.db
        .prepare("INSERT INTO plan_revisions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .run(
          input.newAssetId,
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
      const assigned = {
        alias_event_id: `alias:${input.commandId}:assign`,
        asset_id: input.newAssetId,
        sequence: 1,
        command_id: `${input.commandId}:assign`,
        command_payload_digest: derived.commandPayloadDigest,
        event_kind: "assigned",
        alias: input.newPlanId,
        revision: 1,
        reason: input.reason,
        occurred_at: input.occurredAt,
      };
      const assignedDigest = ledgerRowDigest(assigned, "event_digest");
      this.db
        .prepare("INSERT INTO plan_alias_events VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .run(...Object.values(assigned), assignedDigest);
      this.db
        .prepare("INSERT INTO plan_aliases VALUES (?, ?, ?, ?, ?, ?)")
        .run(
          `alias-current:${input.newAssetId}`,
          input.newAssetId,
          input.newPlanId,
          1,
          null,
          assignedDigest,
        );
      this.fault?.after("alias-assign");
      const admissionEventId = `admission:genesis-rebase:${input.commandId}`;
      const admissionCertificateId = `genesis-rebase-admission:${input.commandId}`;
      const admissionCertificateDigest = sha(
        stable({
          certificate_id: admissionCertificateId,
          command_payload_digest: derived.commandPayloadDigest,
          plan_asset_id: input.newAssetId,
          plan_revision: 1,
          content_digest: input.canonicalPayloadDigest,
        }),
      );
      const admission = {
        admission_event_id: admissionEventId,
        command_id: input.commandId,
        command_payload_digest: derived.commandPayloadDigest,
        event_kind: "admitted",
        plan_asset_id: input.newAssetId,
        plan_revision: 1,
        plan_id: input.newPlanId,
        source_path: input.sourcePath,
        content_digest: input.canonicalPayloadDigest,
        route_tuple_digest: derived.routeTupleDigest,
        certificate_id: admissionCertificateId,
        certificate_digest: admissionCertificateDigest,
        occurred_at: input.occurredAt,
      };
      this.db
        .prepare(
          "INSERT INTO plan_admission_events VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .run(...Object.values(admission), ledgerRowDigest(admission, "event_digest"));
      this.fault?.after("admission-event");
      this.db
        .prepare("INSERT INTO plan_admission_receipts VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .run(
          admissionCertificateId,
          admissionEventId,
          input.commandId,
          derived.commandPayloadDigest,
          input.newAssetId,
          1,
          input.newPlanId,
          input.sourcePath,
          input.canonicalPayloadDigest,
          derived.routeTupleDigest,
          admissionCertificateDigest,
          input.occurredAt,
        );
      this.fault?.after("admission-receipt");
      const custody = {
        command_id: input.commandId,
        issue_number: input.issue.number,
        episode_id: input.issue.episodeId,
        drive_model: "recovery",
        issue_preimage_digest: input.issue.bodyDigest,
        plan_asset_id: input.newAssetId,
        plan_revision: 1,
        custody_state: "committed",
        recorded_at: input.occurredAt,
      };
      this.db
        .prepare("INSERT INTO genesis_issue_custody VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .run(...Object.values(custody), ledgerRowDigest(custody, "custody_digest"));
      this.fault?.after("custody");
      const migration = {
        command_id: input.commandId,
        command_payload_digest: derived.commandPayloadDigest,
        historical_asset_id: input.historicalAssetId,
        historical_authority_kind: "tracked_projection",
        historical_projection_path: input.historicalProjectionPath,
        historical_projection_blob_oid: input.historicalProjectionBlobOid,
        historical_projection_content_digest: input.historicalProjectionContentDigest,
        historical_projection_tail_record_digest: input.historicalProjectionTailDigest,
        historical_first_revision: 1,
        historical_last_revision: input.historicalRevisions.length,
        historical_seal_json: derived.historicalSealJson,
        historical_seal_digest: derived.historicalSealDigest,
        authoritative_certificate_digest: input.authoritativeCertificate.certificateDigest,
        new_asset_id: input.newAssetId,
        new_revision: 1,
        migration_certificate_id: derived.certificateId,
        migration_certificate_digest: derived.certificateDigest,
        occurred_at: input.occurredAt,
      };
      this.db
        .prepare(
          "INSERT INTO genesis_rebase_migrations VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .run(...Object.values(migration), ledgerRowDigest(migration, "migration_digest"));
      this.fault?.after("migration");
      this.db
        .prepare("INSERT INTO genesis_rebase_migration_certificates VALUES (?, ?, ?, ?, ?, ?)")
        .run(
          derived.certificateId,
          input.commandId,
          derived.commandPayloadDigest,
          derived.certificateJson,
          derived.certificateDigest,
          input.occurredAt,
        );
      this.fault?.after("certificate");
      const commentGroup = {
        ...input.commentGroup,
        commandPayloadDigest: derived.commandPayloadDigest,
        migrationCertificateId: derived.certificateId,
        migrationCertificateDigest: derived.certificateDigest,
      };
      const groupDigest = sha(stable(commentGroup));
      const now = input.occurredAt;
      this.db
        .prepare(
          `INSERT INTO genesis_rebase_comment_groups
           VALUES (?, ?, ?, ?, ?, ?, 'pending', 0, ?, ?)`,
        )
        .run(
          commentGroup.groupId,
          input.commandId,
          derived.commandPayloadDigest,
          derived.certificateId,
          derived.certificateDigest,
          groupDigest,
          now,
          now,
        );
      commentGroup.members.forEach((member, index) => {
        const targetJson = stable(member);
        this.db
          .prepare(
            `INSERT INTO genesis_rebase_comment_members
           VALUES (?, ?, ?, ?, ?, 'pending', 0, NULL, NULL, NULL, NULL, ?, NULL, NULL, NULL)`,
          )
          .run(commentGroup.groupId, member.kind, index + 1, targetJson, sha(targetJson), now);
      });
      const outboxEvent = {
        event_id: `${commentGroup.groupId}:1`,
        group_id: commentGroup.groupId,
        sequence: 1,
        member_kind: null,
        event_kind: "group_prepared",
        occurred_at: now,
        previous_event_digest: null,
      };
      this.db
        .prepare("INSERT INTO genesis_rebase_comment_events VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
        .run(...Object.values(outboxEvent), ledgerRowDigest(outboxEvent, "event_digest"));
      this.fault?.after("comment-outbox");
      const receipt = {
        command_id: input.commandId,
        command_type: "plan.genesis-rebase-migrate",
        subject_kind: "plan_revision",
        subject_key: `${input.newAssetId}:1`,
        plan_asset_id: input.newAssetId,
        plan_revision: 1,
        command_payload_digest: derived.commandPayloadDigest,
        result_kind: "genesis_rebase_migration_certificate",
        result_ref: derived.certificateId,
        recorded_at: input.occurredAt,
      };
      this.db
        .prepare("INSERT INTO append_command_receipts VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .run(...Object.values(receipt), ledgerRowDigest(receipt, "receipt_digest"));
      this.fault?.after("command-receipt");
      return {
        commit: true,
        value: success(false, derived.certificateId, derived.certificateDigest),
      };
    });
  }

  private historicalStateExists(input: GenesisRebaseMigrationInput): boolean {
    return (
      Boolean(
        this.db
          .prepare("SELECT 1 FROM plan_assets WHERE asset_id = ?")
          .get(input.historicalAssetId),
      ) ||
      Boolean(
        this.db
          .prepare("SELECT 1 FROM plan_revisions WHERE asset_id = ?")
          .get(input.historicalAssetId),
      ) ||
      Boolean(
        this.db
          .prepare("SELECT 1 FROM plan_aliases WHERE asset_id = ? OR alias = ?")
          .get(input.historicalAssetId, input.newPlanId),
      ) ||
      Boolean(
        this.db
          .prepare("SELECT 1 FROM plan_alias_events WHERE asset_id = ? OR alias = ?")
          .get(input.historicalAssetId, input.newPlanId),
      )
    );
  }

  private replayMembersMatch(
    input: GenesisRebaseMigrationInput,
    derived: NonNullable<ReturnType<typeof derive>>,
  ): boolean {
    const asset = this.db
      .prepare("SELECT * FROM plan_assets WHERE asset_id = ?")
      .get(input.newAssetId);
    const revision = this.db
      .prepare("SELECT * FROM plan_revisions WHERE asset_id = ? AND revision = 1")
      .get(input.newAssetId);
    const alias = this.db
      .prepare("SELECT * FROM plan_aliases WHERE alias = ? AND valid_to_revision IS NULL")
      .get(input.newPlanId);
    const aliasEvent = this.db
      .prepare("SELECT * FROM plan_alias_events WHERE command_id = ?")
      .get(`${input.commandId}:assign`);
    const admission = this.db
      .prepare("SELECT * FROM plan_admission_events WHERE command_id = ?")
      .get(input.commandId);
    const receipt = this.db
      .prepare("SELECT * FROM plan_admission_receipts WHERE command_id = ?")
      .get(input.commandId);
    const custody = this.db
      .prepare("SELECT * FROM genesis_issue_custody WHERE command_id = ?")
      .get(input.commandId);
    const migration = this.db
      .prepare("SELECT * FROM genesis_rebase_migrations WHERE command_id = ?")
      .get(input.commandId);
    const certificate = this.db
      .prepare("SELECT * FROM genesis_rebase_migration_certificates WHERE command_id = ?")
      .get(input.commandId);
    const commandReceipt = this.db
      .prepare("SELECT * FROM append_command_receipts WHERE command_id = ?")
      .get(input.commandId);
    const commentGroup = this.db
      .prepare("SELECT * FROM genesis_rebase_comment_groups WHERE command_id = ?")
      .get(input.commandId);
    const commentMembers = commentGroup
      ? this.db
          .prepare(
            "SELECT * FROM genesis_rebase_comment_members WHERE group_id = ? ORDER BY ordinal",
          )
          .all(commentGroup.group_id)
      : [];
    const preparedEvents = commentGroup
      ? this.db
          .prepare(
            "SELECT * FROM genesis_rebase_comment_events WHERE group_id = ? AND event_kind = 'group_prepared'",
          )
          .all(commentGroup.group_id)
      : [];
    const expectedCommentGroup = {
      ...input.commentGroup,
      commandPayloadDigest: derived.commandPayloadDigest,
      migrationCertificateId: derived.certificateId,
      migrationCertificateDigest: derived.certificateDigest,
    };
    return Boolean(
      asset &&
        asset.created_at === input.occurredAt &&
        asset.created_source_commit === input.sourceCommit &&
        asset.identity_algorithm === "ut-tdd-genesis-rebase-v1" &&
        revision &&
        revision.canonical_payload_json === input.canonicalPayloadJson &&
        revision.canonical_payload_digest === input.canonicalPayloadDigest &&
        revision.body_digest === input.bodyDigest &&
        revision.source_path === input.sourcePath &&
        revision.source_commit === input.sourceCommit &&
        alias &&
        alias.asset_id === input.newAssetId &&
        Number(alias.valid_from_revision) === 1 &&
        aliasEvent &&
        aliasEvent.asset_id === input.newAssetId &&
        aliasEvent.event_kind === "assigned" &&
        aliasEvent.command_payload_digest === derived.commandPayloadDigest &&
        alias.last_event_digest === aliasEvent.event_digest &&
        aliasEvent.event_digest === ledgerRowDigest(aliasEvent, "event_digest") &&
        admission &&
        admission.plan_asset_id === input.newAssetId &&
        admission.command_payload_digest === derived.commandPayloadDigest &&
        admission.route_tuple_digest === derived.routeTupleDigest &&
        admission.event_digest === ledgerRowDigest(admission, "event_digest") &&
        receipt &&
        receipt.plan_asset_id === input.newAssetId &&
        receipt.command_payload_digest === derived.commandPayloadDigest &&
        receipt.certificate_digest === admission.certificate_digest &&
        custody &&
        custody.issue_number === input.issue.number &&
        custody.drive_model === "recovery" &&
        custody.plan_asset_id === input.newAssetId &&
        custody.custody_digest === ledgerRowDigest(custody, "custody_digest") &&
        migration &&
        migration.historical_authority_kind === "tracked_projection" &&
        migration.historical_projection_path === input.historicalProjectionPath &&
        migration.historical_projection_blob_oid === input.historicalProjectionBlobOid &&
        migration.historical_projection_content_digest ===
          input.historicalProjectionContentDigest &&
        migration.historical_projection_tail_record_digest ===
          input.historicalProjectionTailDigest &&
        migration.authoritative_certificate_digest ===
          input.authoritativeCertificate.certificateDigest &&
        migration.migration_digest === ledgerRowDigest(migration, "migration_digest") &&
        certificate &&
        certificate.certificate_id === derived.certificateId &&
        certificate.certificate_json === derived.certificateJson &&
        certificate.certificate_digest === derived.certificateDigest &&
        commandReceipt &&
        commandReceipt.command_payload_digest === derived.commandPayloadDigest &&
        commandReceipt.result_ref === derived.certificateId &&
        commandReceipt.receipt_digest === ledgerRowDigest(commandReceipt, "receipt_digest") &&
        commentGroup &&
        commentGroup.group_id === expectedCommentGroup.groupId &&
        commentGroup.command_payload_digest === derived.commandPayloadDigest &&
        commentGroup.migration_certificate_id === derived.certificateId &&
        commentGroup.migration_certificate_digest === derived.certificateDigest &&
        commentGroup.group_digest === sha(stable(expectedCommentGroup)) &&
        commentMembers.length === 2 &&
        commentMembers.every((member, index) => {
          const expected = expectedCommentGroup.members[index];
          const targetJson = expected ? stable(expected) : "";
          return (
            expected !== undefined &&
            member.member_kind === expected.kind &&
            Number(member.ordinal) === index + 1 &&
            member.target_json === targetJson &&
            member.target_digest === sha(targetJson)
          );
        }) &&
        preparedEvents.length === 1 &&
        Number(preparedEvents[0]?.sequence) === 1 &&
        preparedEvents[0]?.member_kind === null &&
        preparedEvents[0]?.previous_event_digest === null &&
        preparedEvents[0]?.event_digest ===
          ledgerRowDigest(preparedEvents[0] ?? {}, "event_digest"),
    );
  }
}

function derive(input: GenesisRebaseMigrationInput) {
  if (
    !input.commandId ||
    !ASSET.test(input.historicalAssetId) ||
    !ASSET.test(input.newAssetId) ||
    input.historicalAssetId === input.newAssetId ||
    !PLAN.test(input.newPlanId) ||
    input.historicalRevisions.length !== 5 ||
    !input.historicalProjectionPath.startsWith("docs/") ||
    !/^[a-f0-9]{40}(?:[a-f0-9]{24})?$/.test(input.historicalProjectionBlobOid) ||
    !SHA.test(input.historicalProjectionContentDigest) ||
    !SHA.test(input.historicalProjectionTailDigest) ||
    !SHA.test(input.canonicalPayloadDigest) ||
    sha(input.canonicalPayloadJson) !== input.canonicalPayloadDigest ||
    !SHA.test(input.bodyDigest) ||
    !/^[a-f0-9]{40}$/.test(input.sourceCommit) ||
    !input.actor ||
    !input.reason ||
    !input.authoritativeCertificate ||
    !input.authoritativeCertificate.certificateId ||
    !input.authoritativeCertificate.certificateJson ||
    !/^sha256:[a-f0-9]{64}$/.test(input.authoritativeCertificate.certificateDigest) ||
    input.commentGroup.commandId !== input.commandId ||
    !input.commentGroup.groupId ||
    input.commentGroup.members.length !== 2 ||
    input.commentGroup.members[0].kind !== "issue102_seal" ||
    input.commentGroup.members[1].kind !== "issue143_metadata" ||
    !commentGroupCanonicalForInput(input) ||
    Number.isNaN(Date.parse(input.occurredAt)) ||
    !input.issue.branch.startsWith("work/redesign-")
  )
    return undefined;
  if (
    input.historicalRevisions.some(
      (revision, index) =>
        revision.revision !== index + 1 ||
        !SHA.test(revision.canonicalPayloadDigest) ||
        !SHA.test(revision.bodyDigest) ||
        !revision.sourcePath.startsWith("docs/plans/") ||
        !/^[a-f0-9]{40}$/.test(revision.sourceCommit),
    )
  )
    return undefined;
  const historicalSealJson = stable(input.historicalRevisions);
  const historicalSealDigest = sha(historicalSealJson);
  const payload = {
    command_id: input.commandId,
    historical_asset_id: input.historicalAssetId,
    historical_projection_path: input.historicalProjectionPath,
    historical_projection_blob_oid: input.historicalProjectionBlobOid,
    historical_projection_content_digest: input.historicalProjectionContentDigest,
    historical_projection_tail_digest: input.historicalProjectionTailDigest,
    historical_seal_digest: historicalSealDigest,
    new_asset_id: input.newAssetId,
    new_plan_id: input.newPlanId,
    canonical_payload_digest: input.canonicalPayloadDigest,
    body_digest: input.bodyDigest,
    source_path: input.sourcePath,
    source_commit: input.sourceCommit,
    issue: input.issue,
    actor: input.actor,
    reason: input.reason,
    occurred_at: input.occurredAt,
    authoritative_certificate_digest: input.authoritativeCertificate.certificateDigest,
  };
  const commandPayloadDigest = sha(stable(payload));
  const routeTupleDigest = sha(
    stable({
      drive_model: "recovery",
      origin: {
        asset_id: input.historicalAssetId,
        revision: input.historicalRevisions.length,
        projection_tail_digest: input.historicalProjectionTailDigest,
      },
      reentry: { asset_id: input.newAssetId, revision: 1 },
    }),
  );
  const certificateId = input.authoritativeCertificate.certificateId;
  const certificateJson = input.authoritativeCertificate.certificateJson;
  return {
    commandPayloadDigest,
    historicalSealJson,
    historicalSealDigest,
    certificateId,
    certificateJson,
    certificateDigest: input.authoritativeCertificate.certificateDigest,
    routeTupleDigest,
  };
}

function commentGroupCanonicalForInput(input: GenesisRebaseMigrationInput): boolean {
  const [issue102, issue143] = input.commentGroup.members;
  if (!issue102 || !issue143) return false;
  const parse = (body: string, marker: string) => {
    const lines = body.split("\n");
    if (lines[0] !== marker || lines[1] !== "```json" || lines.at(-1) !== "```") return undefined;
    try {
      return JSON.parse(lines.slice(2, -1).join("\n")) as Record<string, unknown>;
    } catch {
      return undefined;
    }
  };
  const left = parse(issue102.commentBody, "<!-- ut-tdd:genesis-rebase/issue102-seal/v1 -->");
  const right = parse(
    issue143.commentBody,
    "<!-- ut-tdd:genesis-rebase/issue143-canonical-metadata/v1 -->",
  );
  if (!left || !right || stable(left) !== stable(right)) return false;
  return (
    left.command_id === input.commandId &&
    left.version === 1 &&
    left.repository === "unison-ai-product/UT-TDD_AGENT-HARNESS" &&
    left.source_commit === input.sourceCommit &&
    left.predecessor_asset === input.historicalAssetId &&
    left.predecessor_revision_first === 1 &&
    left.predecessor_revision_last === 5 &&
    left.successor_asset === input.newAssetId &&
    left.successor_revision === 1 &&
    left.projection_preimage_digest === `sha256:${input.historicalProjectionTailDigest}` &&
    left.issue102_body_digest === `sha256:${issue102.issueBodyDigest}` &&
    left.issue143_body_digest === `sha256:${issue143.issueBodyDigest}` &&
    left.migration_certificate_id === input.authoritativeCertificate.certificateId &&
    left.migration_certificate_digest === input.authoritativeCertificate.certificateDigest &&
    left.inference_forbidden === true &&
    left.drive === "recovery" &&
    sha(issue102.commentBody) === issue102.commentBodyDigest &&
    sha(issue143.commentBody) === issue143.commentBodyDigest
  );
}

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => Buffer.compare(Buffer.from(left), Buffer.from(right)))
      .map(([key, child]) => `${JSON.stringify(key)}:${stable(child)}`)
      .join(",")}}`;
  return JSON.stringify(value);
}

function sha(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function equal(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function rejected(ruleId: string): GenesisRebaseMigrationResult {
  return { ok: false, ruleId };
}

function success(
  replayed: boolean,
  certificateId: string,
  certificateDigest: string,
): GenesisRebaseMigrationResult {
  return { ok: true, replayed, certificateId, certificateDigest };
}
