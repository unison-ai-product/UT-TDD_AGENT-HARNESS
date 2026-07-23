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
  const gitResolver = new TrustedGitBlobResolver(
    deps.gitCommand ?? new NodeGitCommandPort(repoRoot),
  );
  const runner = new GenesisRebaseMigrationRunner({
    observeIssue102: deps.observeIssue102 ?? (() => observeIssue(102)),
    observeCustodyIssue: deps.observeCustodyIssue ?? observeCustodyIssue,
    resolveBlob: deps.resolveBlob ?? ((commit, path) => gitResolver.resolve(commit, path)),
    resolveHistoricalProjection:
      deps.resolveHistoricalProjection ??
      ((commit, path, historicalAssetId) =>
        resolveTrackedHistoricalProjection(gitResolver, commit, path, historicalAssetId)),
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

function resolveTrackedHistoricalProjection(
  resolver: TrustedGitBlobResolver,
  commit: string,
  path: string,
  historicalAssetId: string,
): ReturnType<GenesisRebaseMigrationRunnerDeps["resolveHistoricalProjection"]> {
  const blob = resolver.resolve(commit, path);
  const parsed = parseTrackedReceiptProjection(
    new TextDecoder("utf-8", { fatal: true }).decode(blob.bytes),
  );
  if (!parsed.ok) throw new Error(`genesis-rebase-projection-invalid:${parsed.errors.join(",")}`);
  const records = parsed.value.records.filter(
    (record) => record.binding.assetId === historicalAssetId,
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
    return parseGenesisRebaseMigrationCommand(JSON.parse(text));
  } catch {
    throw new Error("genesis-rebase-migration-command-invalid");
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
