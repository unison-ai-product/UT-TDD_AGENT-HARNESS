import { createHash, randomUUID } from "node:crypto";

export type GenesisRebaseCommentMemberKind = "issue102_seal" | "issue143_metadata";
export type GenesisRebaseCommentProjectionState = "pending" | "projected" | "recovery_required";

export interface GenesisRebaseCommentTarget {
  readonly kind: GenesisRebaseCommentMemberKind;
  readonly issueNumber: 102 | 143;
  readonly issueNodeId: string;
  readonly issueUrl: string;
  readonly issueBodyDigest: string;
  readonly issueVersion: string;
  readonly commentBody: string;
  readonly commentBodyDigest: string;
}

export interface GenesisRebaseCommentGroup {
  readonly groupId: string;
  readonly commandId: string;
  readonly commandPayloadDigest: string;
  readonly migrationCertificateId: string;
  readonly migrationCertificateDigest: string;
  readonly members: readonly [GenesisRebaseCommentTarget, GenesisRebaseCommentTarget];
}

export interface GenesisRebaseCanonicalMetadata {
  readonly repository: string;
  readonly source_commit: string;
  readonly reviewed_implementation_commit: string;
  readonly predecessor_asset: string;
  readonly predecessor_revision_first: 1;
  readonly predecessor_revision_last: 5;
  readonly predecessor_terminal_record_digest: string;
  readonly successor_asset: string;
  readonly successor_revision: 1;
  readonly projection_preimage_digest: string;
  readonly issue102_body_digest: string;
  readonly issue143_body_digest: string;
  readonly migration_certificate_id: string;
  readonly migration_certificate_digest: string;
  readonly inference_forbidden: true;
  readonly drive: "recovery";
}

export interface GenesisRebaseCommentOutboxPort {
  prepare(group: GenesisRebaseCommentGroup): void;
  claimMember(
    groupId: string,
    kind: GenesisRebaseCommentMemberKind,
    claim: {
      readonly ownerToken: string;
      readonly claimedAt: string;
      readonly expiresAt: string;
    },
  ): {
    readonly ownerToken: string;
    readonly generation: number;
    readonly expiresAt: string;
  } | null;
  authorizeCreate(input: GenesisRebaseCommentCreateAuthorization): "create" | "reconcile" | null;
  markMember(input: GenesisRebaseCommentMemberTransition): void;
  markGroup(groupId: string, state: GenesisRebaseCommentProjectionState): void;
  read(
    groupId: string,
  ): { readonly state: string; readonly memberStates: readonly string[] } | undefined;
  markProjectedDrift(groupId: string, kind: GenesisRebaseCommentMemberKind): void;
}

export interface GenesisRebaseCommentCreateAuthorization {
  readonly groupId: string;
  readonly kind: GenesisRebaseCommentMemberKind;
  readonly claim: { readonly ownerToken: string; readonly generation: number };
  readonly checkedAt: string;
}

export interface GenesisRebaseCommentMemberTransition {
  readonly groupId: string;
  readonly kind: GenesisRebaseCommentMemberKind;
  readonly state: GenesisRebaseCommentProjectionState;
  readonly remote?: { readonly commentNodeId?: string; readonly commentUrl?: string };
  readonly claim?: { readonly ownerToken: string; readonly generation: number } | number;
}

export interface GenesisRebaseCommentProjectionPort {
  project(
    target: GenesisRebaseCommentTarget,
    authorizeCreate: () => boolean,
  ): {
    readonly state: Exclude<GenesisRebaseCommentProjectionState, "pending">;
    readonly commentNodeId?: string;
    readonly commentUrl?: string;
  };
}

export interface GenesisRebaseCommentProjectionResult {
  readonly groupId: string;
  readonly state: Exclude<GenesisRebaseCommentProjectionState, "pending">;
  readonly projected: number;
  readonly recoveryRequired: number;
}

export class GenesisRebaseCommentProjectionRunner {
  constructor(
    private readonly outbox: GenesisRebaseCommentOutboxPort,
    private readonly projection: GenesisRebaseCommentProjectionPort,
    private readonly runtime: {
      readonly ownerToken: () => string;
      readonly now: () => string;
      readonly leaseMs: number;
    } = {
      ownerToken: randomUUID,
      now: () => new Date().toISOString(),
      leaseMs: 150_000,
    },
  ) {}

  run(group: GenesisRebaseCommentGroup): GenesisRebaseCommentProjectionResult {
    assertGroup(group);
    this.outbox.prepare(group);
    let projected = 0;
    let recoveryRequired = 0;
    const ownerToken = this.runtime.ownerToken();
    const persisted = this.outbox.read(group.groupId);
    for (const [index, member] of group.members.entries()) {
      if (persisted?.memberStates[index] === "projected") {
        const observed = this.projection.project(member, () => false);
        if (observed.state === "projected") {
          projected++;
        } else {
          this.outbox.markProjectedDrift(group.groupId, member.kind);
          recoveryRequired++;
        }
        continue;
      }
      const claimedAt = this.runtime.now();
      const claim = this.outbox.claimMember(group.groupId, member.kind, {
        ownerToken,
        claimedAt,
        expiresAt: new Date(Date.parse(claimedAt) + this.runtime.leaseMs).toISOString(),
      });
      if (!claim) throw new Error("genesis-rebase-comment-member-claim-active");
      try {
        const result = this.projection.project(
          member,
          () =>
            this.outbox.authorizeCreate({
              groupId: group.groupId,
              kind: member.kind,
              claim,
              checkedAt: this.runtime.now(),
            }) === "create",
        );
        this.outbox.markMember({
          groupId: group.groupId,
          kind: member.kind,
          state: result.state,
          remote: result,
          claim,
        });
        if (result.state === "projected") projected++;
        else recoveryRequired++;
      } catch {
        this.outbox.markMember({
          groupId: group.groupId,
          kind: member.kind,
          state: "recovery_required",
          claim,
        });
        recoveryRequired++;
      }
    }
    const state = recoveryRequired === 0 && projected === 2 ? "projected" : "recovery_required";
    if (persisted?.state !== state) this.outbox.markGroup(group.groupId, state);
    return { groupId: group.groupId, state, projected, recoveryRequired };
  }
}

export function createGenesisRebaseCommentGroup(input: {
  readonly commandId: string;
  readonly commandPayloadDigest: string;
  readonly groupId: string;
  readonly issue102: Omit<
    GenesisRebaseCommentTarget,
    "kind" | "issueNumber" | "commentBody" | "commentBodyDigest"
  >;
  readonly issue143: Omit<
    GenesisRebaseCommentTarget,
    "kind" | "issueNumber" | "commentBody" | "commentBodyDigest"
  >;
  readonly metadata: GenesisRebaseCanonicalMetadata;
}): GenesisRebaseCommentGroup {
  assertMetadata(input.metadata);
  const issue102Body = renderComment("issue102-seal", input.commandId, input.metadata);
  const issue143Body = renderComment(
    "issue143-canonical-metadata",
    input.commandId,
    input.metadata,
  );
  return {
    groupId: input.groupId,
    commandId: input.commandId,
    commandPayloadDigest: input.commandPayloadDigest,
    migrationCertificateId: input.metadata.migration_certificate_id,
    migrationCertificateDigest: input.metadata.migration_certificate_digest,
    members: [
      {
        ...input.issue102,
        kind: "issue102_seal",
        issueNumber: 102,
        commentBody: issue102Body,
        commentBodyDigest: sha(issue102Body),
      },
      {
        ...input.issue143,
        kind: "issue143_metadata",
        issueNumber: 143,
        commentBody: issue143Body,
        commentBodyDigest: sha(issue143Body),
      },
    ],
  };
}

function assertMetadata(metadata: GenesisRebaseCanonicalMetadata): void {
  if (
    metadata.repository !== "unison-ai-product/UT-TDD_AGENT-HARNESS" ||
    !/^[a-f0-9]{40}$/.test(metadata.source_commit) ||
    !/^[a-f0-9]{40}(?:[a-f0-9]{24})?$/.test(metadata.reviewed_implementation_commit) ||
    !metadata.predecessor_asset.startsWith("plan:") ||
    metadata.predecessor_revision_first !== 1 ||
    metadata.predecessor_revision_last !== 5 ||
    !digest(metadata.predecessor_terminal_record_digest) ||
    !metadata.successor_asset.startsWith("plan:") ||
    metadata.successor_revision !== 1 ||
    !digest(metadata.projection_preimage_digest) ||
    !digest(metadata.issue102_body_digest) ||
    !digest(metadata.issue143_body_digest) ||
    !metadata.migration_certificate_id ||
    !digest(metadata.migration_certificate_digest) ||
    metadata.inference_forbidden !== true ||
    metadata.drive !== "recovery"
  )
    throw new Error("genesis-rebase-comment-metadata-invalid");
}

function digest(value: string): boolean {
  return /^(?:sha256:)?[a-f0-9]{64}$/.test(value);
}

function renderComment(
  marker: "issue102-seal" | "issue143-canonical-metadata",
  commandId: string,
  metadata: GenesisRebaseCanonicalMetadata,
): string {
  return [
    `<!-- ut-tdd:genesis-rebase/${marker}/v1 -->`,
    "```json",
    JSON.stringify({ command_id: commandId, version: 1, ...metadata }, sortedKeys(metadata)),
    "```",
  ].join("\n");
}

function sortedKeys(metadata: object): string[] {
  return ["command_id", "version", ...Object.keys(metadata).sort()];
}

function assertGroup(group: GenesisRebaseCommentGroup): void {
  if (
    !group.groupId ||
    !group.commandId ||
    !digest(group.commandPayloadDigest) ||
    !group.migrationCertificateId ||
    !digest(group.migrationCertificateDigest) ||
    group.members.length !== 2 ||
    group.members[0].kind !== "issue102_seal" ||
    group.members[1].kind !== "issue143_metadata" ||
    group.members.some(
      (member) =>
        !member.issueNodeId ||
        member.issueUrl !==
          `https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/${member.issueNumber}` ||
        !/^[a-f0-9]{64}$/.test(member.issueBodyDigest) ||
        !member.issueVersion ||
        sha(member.commentBody) !== member.commentBodyDigest,
    )
  )
    throw new Error("genesis-rebase-comment-group-invalid");
}

function sha(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
