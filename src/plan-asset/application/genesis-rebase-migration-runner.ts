import { createHash } from "node:crypto";
import type { TrustedGitBlob } from "../../git/trusted-git-blob-resolver.js";
import { parseLegacyPlanSource } from "../adapters/legacy-plan-inventory.js";
import type {
  GenesisRebaseMigrationInput,
  GenesisRebaseMigrationResult,
} from "../ledger/genesis-rebase-migration-transaction.js";
import { createGenesisRebaseCommentGroup } from "./genesis-rebase-comment-projection.js";
import {
  type GenesisRebaseMigrationProposal,
  validateGenesisRebaseMigration,
} from "./genesis-rebase-migrate.js";

export const GENESIS_REBASE_MIGRATION_MARKER = "ut-tdd:genesis-rebase-migration/v1";
export const GENESIS_REBASE_MIGRATION_OPERATION = "genesis-rebase-migrate";
export const GENESIS_REBASE_SOURCE_COMMIT = "79ffe9b373cbf0bd03b5610395fd618c26acba26";
export const GENESIS_REBASE_REPOSITORY = "unison-ai-product/UT-TDD_AGENT-HARNESS";
export const GENESIS_REBASE_PLAN_ID = "PLAN-RECOVERY-16-plan-revision-authoring";
export const GENESIS_REBASE_CUSTODY_ISSUE = 143;
export const GENESIS_REBASE_CUSTODY_NODE_ID = "I_kwDOSkkE9M8AAAABJ2W8Aw";
export const GENESIS_REBASE_CUSTODY_BODY_DIGEST =
  "88bc7746036283c0abfeaca70ecdde01cc499383d85c8e62636fd65989fbe3a9";
export const GENESIS_REBASE_CUSTODY_UPDATED_AT = "2026-07-23T06:04:27Z";

export interface GenesisRebaseMigrationCommand {
  readonly marker: typeof GENESIS_REBASE_MIGRATION_MARKER;
  readonly operation: typeof GENESIS_REBASE_MIGRATION_OPERATION;
  readonly repository: typeof GENESIS_REBASE_REPOSITORY;
  readonly plan_id: typeof GENESIS_REBASE_PLAN_ID;
  readonly issue102_body_digest: string;
  readonly inference_forbidden: true;
  readonly drive: "recovery";
  readonly proposal: GenesisRebaseMigrationProposal;
  readonly input: GenesisRebaseMigrationInput;
}

export interface ObservedGenesisRebaseCustodyIssue {
  readonly number: number;
  readonly nodeId: string;
  readonly bodyDigest: string;
  readonly updatedAt: string;
}

export interface GenesisRebaseMigrationTransactionPort {
  migrate(input: GenesisRebaseMigrationInput): GenesisRebaseMigrationResult;
}

export interface GenesisRebaseMigrationRunnerDeps {
  readonly observeIssue102: () => ObservedGenesisRebaseCustodyIssue;
  readonly observeCustodyIssue: () => ObservedGenesisRebaseCustodyIssue;
  /** Resolve a commit through the same repository authority used for source blobs. */
  readonly resolveCommit: (commit: string) => string;
  /** True only when both commits belong to that repository and ancestor relation is proven. */
  readonly isAncestor: (ancestor: string, descendant: string) => boolean;
  readonly resolveBlob: (commit: string, sourcePath: string) => TrustedGitBlob;
  readonly resolveHistoricalProjection: (
    commit: string,
    sourcePath: string,
    historicalAssetId: string,
  ) => {
    readonly blobOid: string;
    readonly contentDigest: string;
    readonly tailDigest: string;
    readonly revisions: readonly {
      readonly revision: number;
      readonly commandId: string;
      readonly receiptId: string;
      readonly receiptDigest: string;
      readonly contentDigest: string;
      readonly recordDigest: string;
      readonly previousRecordDigest: string | null;
      readonly sourcePath: string;
    }[];
  };
  readonly transaction: GenesisRebaseMigrationTransactionPort;
}

/** PO採択Aのhistorical seal + successor genesisをexact custody preimageに束縛する。 */
export class GenesisRebaseMigrationRunner {
  constructor(private readonly deps: GenesisRebaseMigrationRunnerDeps) {}

  run(command: GenesisRebaseMigrationCommand): GenesisRebaseMigrationResult {
    assertExactCommand(command);
    const validation = validateGenesisRebaseMigration(command.proposal);
    if (!validation.ok)
      throw new Error(`genesis-rebase-domain-validation-failed:${validation.ruleId}`);
    assertReviewAuthority(command, this.deps);
    assertTrustedSource(
      command,
      this.deps.resolveBlob(command.proposal.sourceCommit, command.proposal.successor.sourcePath),
    );
    assertTrackedProjection(
      command,
      this.deps.resolveHistoricalProjection(
        command.proposal.sourceCommit,
        command.proposal.projection.sourcePath,
        command.proposal.historical.assetId,
      ),
    );
    assertProposalInputBinding(command, validation.value);
    const issue102 = this.deps.observeIssue102();
    if (
      issue102.number !== 102 ||
      issue102.bodyDigest !== command.proposal.issue102.bodyDigest.slice(7)
    )
      throw new Error("genesis-rebase-issue102-preimage-mismatch");
    const observed = this.deps.observeCustodyIssue();
    if (
      observed.number !== GENESIS_REBASE_CUSTODY_ISSUE ||
      observed.nodeId !== GENESIS_REBASE_CUSTODY_NODE_ID ||
      observed.bodyDigest !== GENESIS_REBASE_CUSTODY_BODY_DIGEST ||
      observed.updatedAt !== GENESIS_REBASE_CUSTODY_UPDATED_AT
    )
      throw new Error("genesis-rebase-custody-preimage-mismatch");
    return this.deps.transaction.migrate({
      ...command.input,
      commentGroup: canonicalCommentGroup(command, issue102, observed),
    });
  }
}

function assertReviewAuthority(
  command: GenesisRebaseMigrationCommand,
  deps: Pick<GenesisRebaseMigrationRunnerDeps, "resolveCommit" | "isAncestor">,
): void {
  const source = deps.resolveCommit(command.proposal.sourceCommit);
  const reviewed = deps.resolveCommit(command.proposal.reviewedImplementationCommit);
  if (
    source !== command.proposal.sourceCommit ||
    reviewed !== command.proposal.reviewedImplementationCommit
  )
    throw new Error("genesis-rebase-review-commit-mismatch");
  if (!deps.isAncestor(source, reviewed))
    throw new Error("genesis-rebase-review-authority-not-descendant");
}

function canonicalCommentGroup(
  command: GenesisRebaseMigrationCommand,
  issue102: ObservedGenesisRebaseCustodyIssue,
  issue143: ObservedGenesisRebaseCustodyIssue,
) {
  const proposal = command.proposal;
  const terminal = proposal.historical.revisions.at(-1);
  if (!terminal) throw new Error("genesis-rebase-historical-authority-missing");
  return createGenesisRebaseCommentGroup({
    commandId: proposal.commandId,
    commandPayloadDigest: "pending-local-derivation",
    groupId: `comments:${proposal.commandId}`,
    issue102: {
      issueNodeId: issue102.nodeId,
      issueUrl: `${githubIssueBase()}/102`,
      issueBodyDigest: issue102.bodyDigest,
      issueVersion: issue102.updatedAt,
    },
    issue143: {
      issueNodeId: issue143.nodeId,
      issueUrl: `${githubIssueBase()}/143`,
      issueBodyDigest: issue143.bodyDigest,
      issueVersion: issue143.updatedAt,
    },
    metadata: {
      repository: GENESIS_REBASE_REPOSITORY,
      source_commit: proposal.sourceCommit,
      reviewed_implementation_commit: proposal.reviewedImplementationCommit,
      predecessor_asset: proposal.historical.assetId,
      predecessor_revision_first: 1,
      predecessor_revision_last: 5,
      predecessor_terminal_record_digest: terminal.recordDigest,
      successor_asset: proposal.successor.assetId,
      successor_revision: 1,
      projection_preimage_digest: proposal.projection.expectedTailDigest,
      issue102_body_digest: proposal.issue102.bodyDigest,
      issue143_body_digest: `sha256:${issue143.bodyDigest}`,
      migration_certificate_id: proposal.certificate.certificateId,
      migration_certificate_digest: proposal.certificate.certificateDigest,
      inference_forbidden: true,
      drive: "recovery",
    },
  });
}

function githubIssueBase(): string {
  return `https://github.com/${GENESIS_REBASE_REPOSITORY}/issues`;
}

export function parseGenesisRebaseMigrationCommand(value: unknown): GenesisRebaseMigrationCommand {
  if (!value || typeof value !== "object")
    throw new Error("genesis-rebase-migration-command-invalid");
  const command = value as Record<string, unknown>;
  if (!command.input || typeof command.input !== "object")
    throw new Error("genesis-rebase-migration-command-invalid");
  return command as unknown as GenesisRebaseMigrationCommand;
}

function assertExactCommand(command: GenesisRebaseMigrationCommand): void {
  const input = command.input;
  if (
    command.marker !== GENESIS_REBASE_MIGRATION_MARKER ||
    command.operation !== GENESIS_REBASE_MIGRATION_OPERATION ||
    command.repository !== GENESIS_REBASE_REPOSITORY ||
    command.plan_id !== GENESIS_REBASE_PLAN_ID ||
    command.inference_forbidden !== true ||
    command.drive !== "recovery" ||
    !/^[a-f0-9]{64}$/.test(command.issue102_body_digest) ||
    input.sourceCommit !== GENESIS_REBASE_SOURCE_COMMIT ||
    input.newPlanId !== GENESIS_REBASE_PLAN_ID ||
    input.historicalRevisions.length !== 5 ||
    input.historicalRevisions.some((revision, index) => revision.revision !== index + 1) ||
    input.issue.number !== GENESIS_REBASE_CUSTODY_ISSUE ||
    input.issue.nodeId !== GENESIS_REBASE_CUSTODY_NODE_ID ||
    input.issue.bodyDigest !== GENESIS_REBASE_CUSTODY_BODY_DIGEST ||
    input.issue.observedRevision !== GENESIS_REBASE_CUSTODY_UPDATED_AT
  )
    throw new Error("genesis-rebase-migration-preimage-mismatch");
}

function assertProposalInputBinding(
  command: GenesisRebaseMigrationCommand,
  validated: {
    readonly commandId: string;
    readonly historicalAssetId: string;
    readonly historicalTerminalRevision: number;
    readonly successorAssetId: string;
  },
): void {
  const { input, proposal } = command;
  const custody = proposal.custodyIssue;
  const historicalBound =
    input.historicalRevisions.length === proposal.historical.revisions.length &&
    input.historicalRevisions.every((revision, index) => {
      const sealed = proposal.historical.revisions[index];
      return (
        sealed !== undefined &&
        revision.revision === sealed.revision &&
        digestEquals(revision.canonicalPayloadDigest, sealed.contentDigest) &&
        digestEquals(revision.bodyDigest, sealed.bodyDigest) &&
        revision.sourcePath === sealed.sourcePath &&
        revision.sourceCommit === sealed.sourceCommit
      );
    });
  if (
    validated.commandId !== input.commandId ||
    validated.historicalAssetId !== input.historicalAssetId ||
    validated.historicalTerminalRevision !== input.historicalRevisions.length ||
    validated.successorAssetId !== input.newAssetId ||
    proposal.repositoryIdentity !== command.repository ||
    proposal.successor.planId !== input.newPlanId ||
    proposal.sourceCommit !== input.sourceCommit ||
    proposal.sourceCommit !== GENESIS_REBASE_SOURCE_COMMIT ||
    proposal.issue102.bodyDigest !== `sha256:${command.issue102_body_digest}` ||
    custody === null ||
    custody.number !== input.issue.number ||
    !digestEquals(input.issue.bodyDigest, custody.bodyDigest) ||
    custody.nodeId !== input.issue.nodeId ||
    custody.updatedAt !== input.issue.observedRevision ||
    !digestEquals(input.historicalProjectionTailDigest, proposal.projection.expectedTailDigest) ||
    input.historicalProjectionPath !== proposal.projection.sourcePath ||
    input.historicalProjectionBlobOid !== proposal.projection.blobOid ||
    !digestEquals(input.historicalProjectionContentDigest, proposal.projection.contentDigest) ||
    !digestEquals(input.canonicalPayloadDigest, proposal.successor.canonicalPayloadDigest) ||
    !digestEquals(input.bodyDigest, proposal.successor.bodyDigest) ||
    input.sourcePath !== proposal.successor.sourcePath ||
    input.authoritativeCertificate.certificateId !== proposal.certificate.certificateId ||
    input.authoritativeCertificate.certificateJson !== stable(proposal.certificate) ||
    input.authoritativeCertificate.certificateDigest !== proposal.certificate.certificateDigest ||
    !historicalBound
  )
    throw new Error("genesis-rebase-proposal-input-mismatch");
}

function digestEquals(rawDigest: string, prefixedDigest: string): boolean {
  return prefixedDigest === `sha256:${rawDigest}`;
}

function assertTrustedSource(command: GenesisRebaseMigrationCommand, blob: TrustedGitBlob): void {
  const { proposal, input } = command;
  const parsed = parseLegacyPlanSource(
    new TextDecoder("utf-8", { fatal: true }).decode(blob.bytes),
  );
  if (!parsed) throw new Error("genesis-rebase-trusted-source-invalid");
  const canonicalPayloadJson = stable(parsed.frontmatter);
  if (parsed.frontmatter.status !== proposal.successor.status)
    throw new Error("genesis-rebase-trusted-source-status-mismatch");
  if (
    blob.commitOid !== proposal.sourceCommit ||
    blob.sourcePath !== proposal.successor.sourcePath ||
    blob.blobOid !== proposal.successor.sourceBlobOid ||
    `sha256:${sha(blob.bytes)}` !== proposal.successor.contentDigest ||
    parsed.planId !== proposal.successor.planId ||
    sha(canonicalPayloadJson) !== input.canonicalPayloadDigest ||
    sha(parsed.body) !== input.bodyDigest ||
    canonicalPayloadJson !== input.canonicalPayloadJson
  )
    throw new Error("genesis-rebase-trusted-source-mismatch");
}

function assertTrackedProjection(
  command: GenesisRebaseMigrationCommand,
  observed: ReturnType<GenesisRebaseMigrationRunnerDeps["resolveHistoricalProjection"]>,
): void {
  const expected = command.proposal.projection;
  if (
    observed.blobOid !== expected.blobOid ||
    `sha256:${observed.contentDigest}` !== expected.contentDigest ||
    `sha256:${observed.tailDigest}` !== expected.expectedTailDigest ||
    stable(observed.revisions) !==
      stable(
        command.proposal.historical.revisions.map((revision) => ({
          revision: revision.revision,
          commandId: revision.commandId,
          receiptId: revision.receiptId,
          receiptDigest: revision.receiptDigest,
          contentDigest: revision.contentDigest,
          recordDigest: revision.recordDigest,
          previousRecordDigest: revision.previousRecordDigest,
          sourcePath: revision.sourcePath,
        })),
      )
  )
    throw new Error("genesis-rebase-tracked-projection-mismatch");
}

function sha(value: string | Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${stable(item)}`)
      .join(",")}}`;
  return JSON.stringify(value);
}
