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
}

/**
 * Plan Ledger正本のpending/recovery_requiredを下流Issue projectionへ収束させる。
 * entry単位で失敗をdurableに観測し、1件のremote障害で後続entryを飢餓させない。
 */
export class GenesisProjectionDispatcher {
  constructor(
    private readonly outbox: GenesisProjectionOutboxStore,
    private readonly projection: GenesisProjectionDispatchPort,
    private readonly now: () => string,
    private readonly ownerToken: () => string = randomUUID,
    private readonly leaseMs = 30_000,
  ) {}

  dispatchPending(limit?: number): GenesisProjectionDispatchSummary {
    const request = this.claimRequest(limit);
    return this.dispatchEntries(this.outbox.claimPending(request));
  }

  /** CLI adoption直後の1 commandだけを投影し、無関係なpendingを処理しない。 */
  dispatchCommand(commandId: string): GenesisProjectionDispatchSummary {
    const entry = this.outbox.claimCommand(commandId, this.claimRequest());
    return this.dispatchEntries(entry ? [entry] : []);
  }

  private dispatchEntries(
    entries: readonly GenesisProjectionClaim[],
  ): GenesisProjectionDispatchSummary {
    let projected = 0;
    let recoveryRequired = 0;
    for (const entry of entries) {
      const occurredAt = this.now();
      try {
        const result = this.projection.dispatch(toProjectionInput(entry));
        if (!result.durable) throw new Error("genesis-adoption-projection-not-durable");
        if (result.state === "projected") {
          this.outbox.markProjected(entry.commandId, entry.ownerToken, occurredAt);
          projected += 1;
          continue;
        }
        this.outbox.markRecoveryRequired(
          entry.commandId,
          entry.ownerToken,
          "genesis-adoption-projection-recovery-required",
          occurredAt,
        );
      } catch (error) {
        this.outbox.markRecoveryRequired(
          entry.commandId,
          entry.ownerToken,
          failureReason(error),
          occurredAt,
        );
      }
      recoveryRequired += 1;
    }
    return { scanned: entries.length, projected, recoveryRequired };
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
}

/** production composition: Plan Ledger outbox + HARNESS journal + gh create-or-get。 */
export function openNodeGenesisProjectionDispatcher(
  repoRoot: string,
  repository: string,
  port: ForwardEscapeIssueAdoptionPort = new NodeGhForwardEscapeIssuePort(),
  options: NodeGenesisProjectionDispatcherOptions = {},
): NodeGenesisProjectionDispatcherResource {
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
      dispatcher: new GenesisProjectionDispatcher(outbox, projection, () =>
        new Date().toISOString(),
      ),
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

import { randomUUID } from "node:crypto";
