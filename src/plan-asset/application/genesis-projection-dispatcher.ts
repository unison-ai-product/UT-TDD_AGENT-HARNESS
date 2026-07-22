import type { ForwardEscapeIssueAdoptionPort } from "../../execution/forward-escape.js";
import { NodeGhForwardEscapeIssuePort } from "../../github/node-gh-forward-escape-issue-port.js";
import { SqliteGenesisAdoptionProjectionAdapter } from "../adapters/sqlite-genesis-adoption-projection-adapter.js";
import type {
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
  ) {}

  dispatchPending(limit?: number): GenesisProjectionDispatchSummary {
    const entries = this.outbox.pending(limit);
    let projected = 0;
    let recoveryRequired = 0;
    for (const entry of entries) {
      const occurredAt = this.now();
      try {
        const result = this.projection.dispatch(toProjectionInput(entry));
        if (!result.durable) throw new Error("genesis-adoption-projection-not-durable");
        if (result.state === "projected") {
          this.outbox.markProjected(entry.commandId, occurredAt);
          projected += 1;
          continue;
        }
        this.outbox.markRecoveryRequired(
          entry.commandId,
          "genesis-adoption-projection-recovery-required",
          occurredAt,
        );
      } catch (error) {
        this.outbox.markRecoveryRequired(entry.commandId, failureReason(error), occurredAt);
      }
      recoveryRequired += 1;
    }
    return { scanned: entries.length, projected, recoveryRequired };
  }
}

export interface NodeGenesisProjectionDispatcherResource {
  readonly dispatcher: Pick<GenesisProjectionDispatcher, "dispatchPending">;
  close(): void;
}

/** production composition: Plan Ledger outbox + HARNESS journal + gh create-or-get。 */
export function openNodeGenesisProjectionDispatcher(
  repoRoot: string,
  repository: string,
  port: ForwardEscapeIssueAdoptionPort = new NodeGhForwardEscapeIssuePort(),
): NodeGenesisProjectionDispatcherResource {
  const db = openPlanLedger({ repoRoot });
  const outbox = new SqliteGenesisProjectionOutboxStore(db);
  const projection = new SqliteGenesisAdoptionProjectionAdapter(db, { repository, port });
  return {
    dispatcher: new GenesisProjectionDispatcher(outbox, projection, () => new Date().toISOString()),
    close: () => db.close(),
  };
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
