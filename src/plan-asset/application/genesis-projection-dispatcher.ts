import { randomUUID } from "node:crypto";
import type { ForwardEscapeIssueAdoptionPort } from "../../execution/forward-escape.js";
import { NodeGhForwardEscapeIssuePort } from "../../github/node-gh-forward-escape-issue-port.js";
import { defaultHarnessDbPath, type HarnessDb, openHarnessDb } from "../../state-db/index.js";
import { migrate } from "../../state-db/migration.js";
import { SqliteGenesisAdoptionProjectionAdapter } from "../adapters/sqlite-genesis-adoption-projection-adapter.js";
import type {
  GenesisProjectionClaim,
  GenesisProjectionOutboxEntry,
  GenesisProjectionOutboxStore,
} from "../ledger/genesis-projection-outbox.js";
import { SqliteGenesisProjectionOutboxStore } from "../ledger/genesis-projection-outbox.js";
import { openPlanLedger } from "../ledger/schema.js";

export interface GenesisProjectionDispatchPort {
  dispatch(input: {
    readonly commandId: string;
    readonly issueNumber: number;
    readonly issuePreimageDigest: string;
    readonly localReceipt: {
      readonly ok: true;
      readonly replayed: boolean;
      readonly assetId: string;
      readonly revision: 1;
      readonly issueNumber: number;
    };
  }): {
    readonly durable: boolean;
    readonly state: "recovery_required" | "projected";
  };
}

export interface GenesisProjectionDispatchSummary {
  readonly scanned: number;
  readonly projected: number;
  readonly recoveryRequired: number;
  readonly claimRejected: number;
}

/**
 * Plan Ledger正本のpending/recovery_requiredを下流Issue projectionへ収束させる。
 * entry単位で失敗をdurableに観測し、1件のremote障害で後続entryを飢餓させない。
 */
export class GenesisProjectionDispatcher {
  private readonly outbox: GenesisProjectionOutboxStore;
  private readonly projection: GenesisProjectionDispatchPort;
  private readonly now: () => string;
  private readonly ownerToken: () => string;
  private readonly leaseMs: number;
  private readonly remoteDeadlineMs: number;
  private readonly finalizeBudgetMs: number;

  constructor(input: {
    readonly outbox: GenesisProjectionOutboxStore;
    readonly projection: GenesisProjectionDispatchPort;
    readonly now: () => string;
    readonly ownerToken?: () => string;
    readonly leaseMs?: number;
    readonly remoteDeadlineMs: number;
    readonly finalizeBudgetMs?: number;
  }) {
    this.outbox = input.outbox;
    this.projection = input.projection;
    this.now = input.now;
    this.ownerToken = input.ownerToken ?? randomUUID;
    this.leaseMs = input.leaseMs ?? 30_000;
    this.remoteDeadlineMs = input.remoteDeadlineMs;
    this.finalizeBudgetMs = input.finalizeBudgetMs ?? 5_000;
    if (
      !Number.isSafeInteger(this.remoteDeadlineMs) ||
      this.remoteDeadlineMs < 1 ||
      !Number.isSafeInteger(this.finalizeBudgetMs) ||
      this.finalizeBudgetMs < 1 ||
      this.leaseMs <= this.remoteDeadlineMs + this.finalizeBudgetMs
    )
      throw new Error("genesis-projection-lease-deadline-invalid");
  }

  dispatchPending(limit?: number): GenesisProjectionDispatchSummary {
    const request = this.claimRequest(limit);
    return this.dispatchEntries(this.outbox.claimPending(request));
  }

  /** CLI adoption直後の1 commandだけを投影し、無関係なpendingを処理しない。 */
  dispatchCommand(commandId: string): GenesisProjectionDispatchSummary {
    const request = this.claimRequest();
    const entry = this.outbox.claimCommand(commandId, request);
    if (entry) return this.dispatchEntries([entry]);
    const state = this.outbox.commandState(commandId, request.claimedAt);
    if (state === "projected")
      return { scanned: 0, projected: 1, recoveryRequired: 0, claimRejected: 0 };
    throw new Error(`genesis-adoption-projection-command-${state}`);
  }

  private dispatchEntries(
    entries: readonly GenesisProjectionClaim[],
  ): GenesisProjectionDispatchSummary {
    let projected = 0;
    let recoveryRequired = 0;
    let claimRejected = 0;
    for (const entry of entries) {
      const heartbeat = this.heartbeat();
      let claimGeneration: number;
      try {
        claimGeneration = this.outbox.renewClaim({
          commandId: entry.commandId,
          ownerToken: entry.ownerToken,
          claimGeneration: entry.claimGeneration,
          ...heartbeat,
        });
      } catch {
        claimRejected += 1;
        continue;
      }
      const fence = {
        commandId: entry.commandId,
        ownerToken: entry.ownerToken,
        claimGeneration,
        occurredAt: heartbeat.claimedAt,
      };
      try {
        const remote = this.projection.dispatch(toProjectionInput(entry));
        if (!remote.durable) throw new Error("genesis-adoption-projection-not-durable");
        if (remote.state === "projected") {
          this.outbox.markProjected(fence);
          projected += 1;
        } else {
          this.outbox.markRecoveryRequired({
            ...fence,
            reason: "genesis-adoption-projection-recovery-required",
          });
          recoveryRequired += 1;
        }
      } catch (error) {
        this.outbox.markRecoveryRequired({ ...fence, reason: failureReason(error) });
        recoveryRequired += 1;
      }
    }
    return { scanned: entries.length, projected, recoveryRequired, claimRejected };
  }

  private claimRequest(limit?: number) {
    const claimedAt = this.now();
    return {
      ownerToken: this.ownerToken(),
      claimedAt,
      expiresAt: new Date(Date.parse(claimedAt) + this.leaseMs).toISOString(),
      limit,
    };
  }

  private heartbeat() {
    const claimedAt = this.now();
    return {
      claimedAt,
      expiresAt: new Date(Date.parse(claimedAt) + this.leaseMs).toISOString(),
    };
  }
}

export interface NodeGenesisProjectionDispatcherResource {
  readonly dispatcher: Pick<GenesisProjectionDispatcher, "dispatchPending" | "dispatchCommand">;
  close(): void;
}

export interface NodeGenesisProjectionDispatcherOptions {
  readonly planLedgerPath?: string;
  readonly harnessDbPath?: string;
  readonly openPlanDb?: (input: { repoRoot: string; path?: string }) => HarnessDb;
  readonly openHarnessDb?: (path: string, options: { repoRoot: string }) => HarnessDb;
  readonly migrateHarnessDb?: (db: HarnessDb) => unknown;
  readonly now?: () => string;
  readonly ownerToken?: () => string;
  readonly leaseMs?: number;
  readonly remoteDeadlineMs?: number;
  readonly finalizeBudgetMs?: number;
}

/** production composition: Plan Ledger outbox + HARNESS journal + gh create-or-get。 */
export function openNodeGenesisProjectionDispatcher(input: {
  readonly repoRoot: string;
  readonly repository: string;
  readonly port?: ForwardEscapeIssueAdoptionPort;
  readonly options?: NodeGenesisProjectionDispatcherOptions;
}): NodeGenesisProjectionDispatcherResource {
  const { repoRoot, repository } = input;
  const port = input.port ?? new NodeGhForwardEscapeIssuePort();
  const options = input.options ?? {};
  const remoteDeadlineMs =
    options.remoteDeadlineMs ??
    (port instanceof NodeGhForwardEscapeIssuePort ? port.executionEvidence.timeout_ms : undefined);
  if (!remoteDeadlineMs) throw new Error("genesis-projection-unbounded-remote-port");
  const planDb = (options.openPlanDb ?? openPlanLedger)({
    repoRoot,
    path: options.planLedgerPath,
  });
  let journalDb: HarnessDb | undefined;
  try {
    journalDb = (options.openHarnessDb ?? openHarnessDb)(
      options.harnessDbPath ?? defaultHarnessDbPath(repoRoot),
      { repoRoot },
    );
    (options.migrateHarnessDb ?? migrate)(journalDb);
    const outbox = new SqliteGenesisProjectionOutboxStore(planDb);
    const projection = new SqliteGenesisAdoptionProjectionAdapter(journalDb, {
      repository,
      port,
    });
    return {
      dispatcher: new GenesisProjectionDispatcher({
        outbox,
        projection,
        now: options.now ?? (() => new Date().toISOString()),
        ownerToken: options.ownerToken,
        leaseMs: options.leaseMs,
        remoteDeadlineMs,
        finalizeBudgetMs: options.finalizeBudgetMs,
      }),
      close: () => closeDatabases(journalDb as HarnessDb, planDb),
    };
  } catch (error) {
    if (journalDb) closeDatabases(journalDb, planDb);
    else planDb.close();
    throw error;
  }
}

/** Node composition rootのDB/remote resourceを例外経路でも確実にcloseする。 */
export function runNodeGenesisProjectionDispatcher(
  open: () => NodeGenesisProjectionDispatcherResource,
  limit?: number,
): GenesisProjectionDispatchSummary {
  const resource = open();
  try {
    return resource.dispatcher.dispatchPending(limit);
  } finally {
    resource.close();
  }
}

function toProjectionInput(entry: GenesisProjectionOutboxEntry) {
  return {
    commandId: entry.commandId,
    issueNumber: entry.issueNumber,
    issuePreimageDigest: entry.issuePreimageDigest,
    localReceipt: {
      ok: true as const,
      replayed: true,
      assetId: entry.assetId,
      revision: entry.revision,
      issueNumber: entry.issueNumber,
    },
  };
}

function failureReason(error: unknown): string {
  return error instanceof Error && error.message.length > 0
    ? error.message
    : "genesis-adoption-projection-failed";
}

function closeDatabases(journalDb: HarnessDb, planDb: HarnessDb): void {
  try {
    journalDb.close();
  } finally {
    planDb.close();
  }
}
