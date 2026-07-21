import { createHash } from "node:crypto";
import type { HarnessDb } from "../../state-db/index.js";
import {
  type BootstrapLegacyPlanRevisionInput,
  LegacyPlanRevisionBootstrapTransaction,
} from "./plan-revision-bootstrap.js";
import type { AppendPlanRevisionInput, AppendPlanRevisionResult } from "./plan-revision-ledger.js";
import { PlanRevisionLedgerTransaction } from "./plan-revision-ledger.js";
import { ImmediateLedgerTransaction, type LedgerTransactionPort } from "./transaction.js";

export interface RedesignBundleInput {
  readonly commandId: string;
  readonly replacement:
    | (AppendPlanRevisionInput & { readonly sourceContent: string })
    | (BootstrapLegacyPlanRevisionInput & { readonly sourceContent: string });
  readonly origin: AppendPlanRevisionInput & { readonly sourceContent: string };
}

export type RedesignBundleResult =
  | {
      readonly ok: true;
      readonly replayed: boolean;
      readonly replacement: Extract<AppendPlanRevisionResult, { ok: true }>;
      readonly origin: Extract<AppendPlanRevisionResult, { ok: true }>;
    }
  | { readonly ok: false; readonly ruleId: string };

/**
 * replacementのsupersedesとoriginの訂正back-referenceを一つのSQLite transactionへ閉じる。
 * callbackは両PLANと投影を単一publisher tokenで公開し、例外時はledger全体をrollbackする。
 */
export class PlanRedesignBundleCoordinator {
  private readonly transaction: LedgerTransactionPort;
  private readonly revisions: PlanRevisionLedgerTransaction;
  private readonly bootstrap: LegacyPlanRevisionBootstrapTransaction;

  constructor(db: HarnessDb, transaction?: LedgerTransactionPort) {
    this.transaction = transaction ?? new ImmediateLedgerTransaction(db);
    this.revisions = new PlanRevisionLedgerTransaction(db, transaction);
    this.bootstrap = new LegacyPlanRevisionBootstrapTransaction(db, transaction);
  }

  transact(
    input: RedesignBundleInput,
    publish: (result: Extract<RedesignBundleResult, { ok: true }>) => void,
  ): RedesignBundleResult {
    const invalid = validateBundle(input);
    if (invalid) return { ok: false, ruleId: invalid };
    return this.transaction.run<RedesignBundleResult>(() => {
      const replacement = isBootstrap(input.replacement)
        ? this.bootstrap.prepare(input.replacement, () => undefined)
        : this.revisions.prepare(input.replacement, () => undefined);
      if (!replacement.value.ok) return { commit: false, value: replacement.value };
      const origin = this.revisions.prepare(input.origin, () => undefined);
      if (!origin.value.ok) return { commit: false, value: origin.value };
      const value = {
        ok: true as const,
        replayed: replacement.value.replayed && origin.value.replayed,
        replacement: replacement.value,
        origin: origin.value,
      };
      // 両write setがpreparedになった後だけ外部publishへ進む。
      publish(value);
      return { commit: true, value };
    });
  }
}

function validateBundle(input: RedesignBundleInput): string | undefined {
  if (
    !input.commandId ||
    input.replacement.commandId !== `${input.commandId}:replacement` ||
    input.origin.commandId !== `${input.commandId}:origin` ||
    input.replacement.planId === input.origin.planId ||
    input.replacement.occurredAt !== input.origin.occurredAt
  )
    return "plan-redesign-bundle-binding-invalid";
  const replacement = parseFrontmatter(input.replacement.canonicalPayloadJson);
  const supersedes = replacement?.supersedes;
  if (!Array.isArray(supersedes) || !supersedes.includes(input.origin.planId))
    return "plan-redesign-bundle-supersedes-missing";
  if (!input.origin.sourceContent.includes(input.replacement.planId))
    return "plan-redesign-bundle-origin-back-reference-missing";
  if (
    sha(input.origin.sourceContent) !== input.origin.contentDigest ||
    sha(input.replacement.sourceContent) !== input.replacement.contentDigest
  )
    return "plan-redesign-bundle-source-binding-invalid";
  return undefined;
}

function isBootstrap(
  input: RedesignBundleInput["replacement"],
): input is BootstrapLegacyPlanRevisionInput & { readonly sourceContent: string } {
  return "identityAlgorithm" in input;
}

function parseFrontmatter(value: string): Record<string, unknown> | undefined {
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : undefined;
  } catch {
    return undefined;
  }
}

function sha(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
