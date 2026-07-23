import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import type { Command } from "commander";
import {
  type GitCommandPort,
  NodeGitCommandPort,
  TrustedGitBlobResolver,
} from "../git/trusted-git-blob-resolver.js";
import { parseTrackedReceiptProjection } from "../plan-admission/tracked-receipt-projection.js";
import {
  GENESIS_REBASE_CUSTODY_ISSUE,
  GENESIS_REBASE_MIGRATION_MARKER,
  GENESIS_REBASE_MIGRATION_OPERATION,
  GENESIS_REBASE_PLAN_ID,
  GENESIS_REBASE_REPOSITORY,
  type GenesisRebaseMigrationCommand,
  GenesisRebaseMigrationRunner,
  type GenesisRebaseMigrationRunnerDeps,
  parseGenesisRebaseMigrationCommand,
} from "../plan-asset/application/genesis-rebase-migration-runner.js";
import { GenesisRebaseMigrationTransaction } from "../plan-asset/ledger/genesis-rebase-migration-transaction.js";
import { openPlanLedger } from "../plan-asset/ledger/schema.js";

export interface GenesisRebaseMigrationProductionDeps
  extends Partial<GenesisRebaseMigrationRunnerDeps> {
  readonly readText?: (path: string) => string;
  readonly writeOutput?: (text: string) => void;
  readonly gitCommand?: GitCommandPort;
}

export function createProductionGenesisRebaseMigrationRunner(
  repoRoot: string,
  deps: GenesisRebaseMigrationProductionDeps = {},
): Pick<GenesisRebaseMigrationRunner, "run"> {
  const db = deps.transaction ? undefined : openPlanLedger({ repoRoot });
  const transaction =
    deps.transaction ?? (db ? new GenesisRebaseMigrationTransaction(db) : undefined);
  if (!transaction) throw new Error("genesis-rebase-migration-transaction-unavailable");
  const gitCommand = deps.gitCommand ?? new NodeGitCommandPort(repoRoot);
  const gitResolver = new TrustedGitBlobResolver(gitCommand);
  const runner = new GenesisRebaseMigrationRunner({
    observeIssue102: deps.observeIssue102 ?? (() => observeIssue(102)),
    observeCustodyIssue: deps.observeCustodyIssue ?? observeCustodyIssue,
    resolveCommit: deps.resolveCommit ?? ((commit) => resolveCommit(gitCommand, commit)),
    isAncestor:
      deps.isAncestor ?? ((ancestor, descendant) => isAncestor(gitCommand, ancestor, descendant)),
    resolveBlob: deps.resolveBlob ?? ((commit, path) => gitResolver.resolve(commit, path)),
    resolveHistoricalProjection:
      deps.resolveHistoricalProjection ??
      ((commit, path, historicalAssetId) =>
        resolveTrackedHistoricalProjection({
          resolver: gitResolver,
          commit,
          path,
          historicalAssetId,
        })),
    transaction,
  });
  return {
    run(command) {
      try {
        return runner.run(command);
      } finally {
        db?.close();
      }
    },
  };
}

function resolveTrackedHistoricalProjection(input: {
  readonly resolver: TrustedGitBlobResolver;
  readonly commit: string;
  readonly path: string;
  readonly historicalAssetId: string;
}): ReturnType<GenesisRebaseMigrationRunnerDeps["resolveHistoricalProjection"]> {
  const blob = input.resolver.resolve(input.commit, input.path);
  const parsed = parseTrackedReceiptProjection(
    new TextDecoder("utf-8", { fatal: true }).decode(blob.bytes),
  );
  if (!parsed.ok) throw new Error(`genesis-rebase-projection-invalid:${parsed.errors.join(",")}`);
  const records = parsed.value.records.filter(
    (record) => record.binding.assetId === input.historicalAssetId,
  );
  if (
    records.length !== 5 ||
    records.some((record, index) => record.binding.revision !== index + 1)
  )
    throw new Error("genesis-rebase-projection-revision-chain-invalid");
  const tail = parsed.value.records.at(-1)?.recordDigest;
  if (!tail) throw new Error("genesis-rebase-projection-tail-missing");
  return {
    blobOid: blob.blobOid,
    contentDigest: createHash("sha256").update(blob.bytes).digest("hex"),
    tailDigest: tail.slice(7),
    revisions: records.map((record) => ({
      revision: record.binding.revision,
      commandId: record.commandId,
      receiptId: record.receiptId,
      receiptDigest: record.receiptDigest,
      contentDigest: record.binding.contentDigest,
      recordDigest: record.recordDigest,
      previousRecordDigest: record.previousRecordDigest,
      sourcePath: record.binding.path,
    })),
  };
}

export function registerGenesisRebaseMigrationProductionCommand(
  plan: Command,
  repoRoot: string,
  deps: GenesisRebaseMigrationProductionDeps = {},
): void {
  plan
    .command("genesis-rebase-migrate")
    .description("sealed historical PLAN lineageを新しいsuccessor genesisへ移行")
    .requiredOption("--manifest <path>", "exact genesis rebase migration manifest JSON")
    .action((options: { manifest: string }) => {
      const write = deps.writeOutput ?? ((text: string) => process.stdout.write(text));
      try {
        const command = parseCommandText(
          (deps.readText ?? ((path: string) => readFileSync(path, "utf8")))(options.manifest),
        );
        const result = createProductionGenesisRebaseMigrationRunner(repoRoot, deps).run(command);
        write(`${JSON.stringify({ ok: true, result })}\n`);
        process.exitCode = 0;
      } catch (error) {
        write(`${JSON.stringify({ ok: false, rule_id: ruleId(error) })}\n`);
        process.exitCode = 1;
      }
    });
}

export function parseCommandText(text: string): GenesisRebaseMigrationCommand {
  try {
    const value: unknown = JSON.parse(text);
    assertManifestShape(value);
    return parseGenesisRebaseMigrationCommand(value);
  } catch {
    throw new Error("genesis-rebase-migration-command-invalid");
  }
}

function assertManifestShape(value: unknown): asserts value is GenesisRebaseMigrationCommand {
  const root = object(value);
  const proposal = object(root.proposal);
  const input = object(root.input);
  const review = proposal.confirmationReview === null ? null : object(proposal.confirmationReview);
  const successor = object(proposal.successor);
  const historical = object(proposal.historical);
  const projection = object(proposal.projection);
  const issue102 = object(proposal.issue102);
  const custody = object(proposal.custodyIssue);
  const certificate = object(proposal.certificate);
  const identity = object(certificate.identity);
  const sourceAuthority = object(certificate.sourceBlobAuthority);
  const reviewedAuthority = object(certificate.reviewedImplementationAuthority);
  const inputIssue = object(input.issue);
  const authority = object(input.authoritativeCertificate);
  const revisions = array(historical.revisions);
  const inputRevisions = array(input.historicalRevisions);
  if (
    root.marker !== GENESIS_REBASE_MIGRATION_MARKER ||
    root.operation !== GENESIS_REBASE_MIGRATION_OPERATION ||
    root.repository !== GENESIS_REBASE_REPOSITORY ||
    root.plan_id !== GENESIS_REBASE_PLAN_ID ||
    root.inference_forbidden !== true ||
    root.drive !== "recovery" ||
    !strings(
      root.issue102_body_digest,
      proposal.commandId,
      proposal.repositoryIdentity,
      proposal.sourceCommit,
      proposal.reviewedImplementationCommit,
      successor.assetId,
      successor.planId,
      successor.sourceBlobOid,
      successor.contentDigest,
      successor.status,
      successor.canonicalPayloadDigest,
      successor.bodyDigest,
      successor.sourcePath,
      historical.assetId,
      historical.disposition,
      projection.sourcePath,
      projection.blobOid,
      projection.contentDigest,
      projection.expectedTailDigest,
      projection.currentTailDigest,
      issue102.state,
      issue102.bodyDigest,
      custody.state,
      custody.bodyDigest,
      custody.projectionDigest,
      custody.driveModel,
      certificate.schemaVersion,
      certificate.certificateId,
      certificate.certificateDigest,
      identity.algorithm,
      identity.repositoryIdentity,
      identity.planId,
      identity.historicalAssetId,
      identity.historicalTerminalRecordDigest,
      identity.sourceCommit,
      identity.sourceBlobOid,
      sourceAuthority.repositoryIdentity,
      sourceAuthority.commitOid,
      sourceAuthority.sourcePath,
      sourceAuthority.blobOid,
      sourceAuthority.contentDigest,
      sourceAuthority.canonicalFrontmatterDigest,
      sourceAuthority.bodyDigest,
      sourceAuthority.trustedStatus,
      reviewedAuthority.repositoryIdentity,
      reviewedAuthority.implementationHead,
      reviewedAuthority.reviewKind,
      reviewedAuthority.verdict,
      reviewedAuthority.testsGreenAt,
      reviewedAuthority.reviewedAt,
      reviewedAuthority.greenCommandDigest,
      reviewedAuthority.workerModel,
      reviewedAuthority.reviewerModel,
      input.commandId,
      input.historicalAssetId,
      input.newAssetId,
      input.newPlanId,
      input.canonicalPayloadJson,
      input.canonicalPayloadDigest,
      input.bodyDigest,
      input.sourcePath,
      input.sourceCommit,
      authority.certificateId,
      authority.certificateJson,
      authority.certificateDigest,
      inputIssue.nodeId,
      inputIssue.bodyDigest,
      inputIssue.observedRevision,
      inputIssue.episodeId,
      inputIssue.branch,
      ...(review
        ? [
            review.reviewKind,
            review.verdict,
            review.exactHead,
            review.workerModel,
            review.reviewerModel,
            review.reviewedAt,
            review.testsGreenAt,
          ]
        : []),
    ) ||
    sourceAuthority.trustedStatus !== "draft" ||
    (review !== null && typeof review.greenCommandCount !== "number") ||
    typeof successor.revision !== "number" ||
    typeof historical.appendForbidden !== "boolean" ||
    typeof historical.inferredRowsForbidden !== "boolean" ||
    typeof projection.preserveThroughSequence !== "number" ||
    typeof projection.appendOnly !== "boolean" ||
    typeof issue102.number !== "number" ||
    typeof issue102.mutationForbidden !== "boolean" ||
    typeof custody.number !== "number" ||
    typeof custody.terminal !== "boolean" ||
    typeof identity.historicalTerminalRevision !== "number" ||
    typeof inputIssue.number !== "number" ||
    revisions.length === 0 ||
    inputRevisions.length === 0 ||
    !revisions.every(revisionShape) ||
    !inputRevisions.every(inputRevisionShape)
  )
    throw new Error("manifest-shape-invalid");
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("manifest-object-invalid");
  return value as Record<string, unknown>;
}

function array(value: unknown): unknown[] {
  if (!Array.isArray(value)) throw new Error("manifest-array-invalid");
  return value;
}

function strings(...values: unknown[]): boolean {
  return values.every((value) => typeof value === "string" && value.length > 0);
}

function revisionShape(value: unknown): boolean {
  try {
    const revision = object(value);
    return (
      typeof revision.revision === "number" &&
      strings(
        revision.commandId,
        revision.receiptId,
        revision.receiptDigest,
        revision.contentDigest,
        revision.recordDigest,
        revision.bodyDigest,
        revision.sourcePath,
        revision.sourceCommit,
      ) &&
      (revision.previousRecordDigest === null || typeof revision.previousRecordDigest === "string")
    );
  } catch {
    return false;
  }
}

function inputRevisionShape(value: unknown): boolean {
  try {
    const revision = object(value);
    return (
      typeof revision.revision === "number" &&
      strings(
        revision.canonicalPayloadDigest,
        revision.bodyDigest,
        revision.sourcePath,
        revision.sourceCommit,
      )
    );
  } catch {
    return false;
  }
}

function resolveCommit(git: GitCommandPort, commit: string): string {
  try {
    const oid = git
      .run(["rev-parse", "--verify", `${commit}^{commit}`])
      .toString("ascii")
      .trim();
    if (!/^[a-f0-9]{40}(?:[a-f0-9]{24})?$/.test(oid)) throw new Error("review-commit-oid-invalid");
    return oid;
  } catch {
    throw new Error("genesis-rebase-review-commit-unavailable");
  }
}

function isAncestor(git: GitCommandPort, ancestor: string, descendant: string): boolean {
  try {
    git.run(["merge-base", "--is-ancestor", ancestor, descendant]);
    return true;
  } catch {
    return false;
  }
}

function ruleId(error: unknown): string {
  if (!(error instanceof Error)) return "genesis-rebase-migration-command-failed";
  const domainFailure = /^genesis-rebase-domain-validation-failed:([a-z][a-z0-9-]+)$/.exec(
    error.message,
  );
  if (domainFailure?.[1]) return domainFailure[1];
  return /^[a-z][a-z0-9-]+$/.test(error.message)
    ? error.message
    : "genesis-rebase-migration-command-failed";
}

function observeCustodyIssue() {
  return observeIssue(GENESIS_REBASE_CUSTODY_ISSUE);
}

function observeIssue(number: number) {
  const raw = execFileSync(
    "gh",
    [
      "issue",
      "view",
      String(number),
      "--repo",
      GENESIS_REBASE_REPOSITORY,
      "--json",
      "body,id,updatedAt",
    ],
    { encoding: "utf8", windowsHide: true },
  );
  const issue = JSON.parse(raw) as { body: string; id: string; updatedAt: string };
  return {
    number,
    nodeId: issue.id,
    bodyDigest: createHash("sha256").update(issue.body).digest("hex"),
    updatedAt: issue.updatedAt,
  };
}
