import { createHash } from "node:crypto";
import { canonicalPlanContentDigest } from "../../plan-admission/diff-fence.js";
import type { HarnessDb } from "../../state-db/index.js";
import { parseLegacyPlanSource } from "../adapters/legacy-plan-inventory.js";
import {
  type AuthoringArtifactPublisher,
  type AuthoringCommandGroupInput,
  AuthoringCommandGroupJournal,
} from "./authoring-command-group.js";
import {
  type BootstrapLegacyPlanRevisionInput,
  LegacyPlanRevisionBootstrapTransaction,
} from "./plan-revision-bootstrap.js";
import type { AppendPlanRevisionInput, AppendPlanRevisionResult } from "./plan-revision-ledger.js";
import { PlanRevisionLedgerTransaction } from "./plan-revision-ledger.js";
import { ImmediateLedgerTransaction, type LedgerTransactionPort } from "./transaction.js";

export interface RedesignBundleInput {
  readonly commandId: string;
  readonly commandPayloadDigest: string;
  readonly replacement:
    | (AppendPlanRevisionInput & { readonly sourceContent: string })
    | (BootstrapLegacyPlanRevisionInput & { readonly sourceContent: string });
  readonly origin: AppendPlanRevisionInput & { readonly sourceContent: string };
  readonly reentry: {
    readonly targetPlanId: string;
    readonly targetRevision: number;
    readonly phase: "forward_merge";
  };
  readonly projection: { readonly path: string; readonly contentDigest: string };
}

export type RedesignBundleResult =
  | {
      readonly ok: true;
      readonly replayed: boolean;
      readonly replacement: Extract<AppendPlanRevisionResult, { ok: true }>;
      readonly origin: Extract<AppendPlanRevisionResult, { ok: true }>;
    }
  | { readonly ok: false; readonly ruleId: string };

export type RedesignBundlePublicationResult =
  | (Extract<RedesignBundleResult, { ok: true }> & {
      readonly publicationReplayed: boolean;
      readonly publishedMemberIds: readonly string[];
    })
  | { readonly ok: false; readonly ruleId: string };

/**
 * replacementのsupersedesとoriginの訂正back-referenceを一つのSQLite transactionへ閉じる。
 * transact callbackはtransaction内adapter向け。実filesystem公開はpublishDurableのSagaを使う。
 */
export class PlanRedesignBundleCoordinator {
  private readonly transaction: LedgerTransactionPort;
  private readonly revisions: PlanRevisionLedgerTransaction;
  private readonly bootstrap: LegacyPlanRevisionBootstrapTransaction;
  private readonly groups: AuthoringCommandGroupJournal;

  constructor(db: HarnessDb, transaction?: LedgerTransactionPort) {
    this.transaction = transaction ?? new ImmediateLedgerTransaction(db);
    this.revisions = new PlanRevisionLedgerTransaction(db, transaction);
    this.bootstrap = new LegacyPlanRevisionBootstrapTransaction(db, transaction);
    this.groups = new AuthoringCommandGroupJournal(db);
  }

  transact(input: RedesignBundleInput): RedesignBundleResult {
    const invalid = validateBundle(input);
    if (invalid) return { ok: false, ruleId: invalid };
    return this.transaction.run<RedesignBundleResult>(() => {
      return this.prepareRevisions(input);
    });
  }

  private prepareRevisions(input: RedesignBundleInput): {
    readonly commit: boolean;
    readonly value: RedesignBundleResult;
  } {
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
    return { commit: true, value };
  }

  /**
   * revision write-setを先にdurable化し、同じcommand bindingのN成果物Sagaを実行する。
   * filesystem fault時はgroup journalがrecovery_requiredを保持し、同じ入力で再開する。
   */
  publishDurable(
    input: RedesignBundleInput,
    group: AuthoringCommandGroupInput,
    publisher: AuthoringArtifactPublisher,
  ): RedesignBundlePublicationResult {
    const groupInvalid = validatePublicationGroup(input, group);
    if (groupInvalid) return { ok: false, ruleId: groupInvalid };
    const prepared = this.transaction.run<RedesignBundleResult>(() => {
      const revisions = this.prepareRevisions(input);
      if (!revisions.value.ok) return revisions;
      const intent = this.groups.prepareWithinTransaction(group);
      if (!intent.ok) return { commit: false, value: intent };
      return revisions;
    });
    if (!prepared.ok) return prepared;
    const publication = this.groups.execute(group, publisher);
    if (!publication.ok) return publication;
    return {
      ...prepared,
      publicationReplayed: publication.replayed,
      publishedMemberIds: publication.publishedMemberIds,
    };
  }
}

function validateBundle(input: RedesignBundleInput): string | undefined {
  if (
    !input.commandId ||
    !/^[a-f0-9]{64}$/.test(input.commandPayloadDigest) ||
    input.commandPayloadDigest !== redesignBundlePayloadDigest(input) ||
    input.replacement.commandId !== `${input.commandId}:replacement` ||
    input.origin.commandId !== `${input.commandId}:origin` ||
    input.replacement.planId === input.origin.planId ||
    input.replacement.occurredAt !== input.origin.occurredAt
  )
    return "plan-redesign-bundle-binding-invalid";
  const replacement = parseCanonicalPlan(input.replacement);
  const origin = parseCanonicalPlan(input.origin);
  if (!replacement || !origin) return "plan-redesign-bundle-source-binding-invalid";
  const supersedes = replacement?.supersedes;
  if (
    replacement.route_mode !== "redesign" ||
    !Array.isArray(supersedes) ||
    supersedes.length !== 1 ||
    supersedes[0] !== input.origin.planId
  )
    return "plan-redesign-bundle-supersedes-missing";
  if (!containsPlanReference(origin, input.origin.sourceContent, input.replacement.planId))
    return "plan-redesign-bundle-origin-back-reference-missing";
  if (
    input.reentry.targetPlanId !== input.origin.planId ||
    input.reentry.targetRevision !== input.origin.baseRevision + 1 ||
    input.reentry.phase !== "forward_merge" ||
    !input.projection.path ||
    !/^[a-f0-9]{64}$/.test(input.projection.contentDigest)
  )
    return "plan-redesign-bundle-reentry-binding-invalid";
  if (
    unprefix(canonicalPlanContentDigest(input.origin.sourceContent)) !==
      input.origin.contentDigest ||
    unprefix(canonicalPlanContentDigest(input.replacement.sourceContent)) !==
      input.replacement.contentDigest
  )
    return "plan-redesign-bundle-source-binding-invalid";
  return undefined;
}

export function redesignBundlePayloadDigest(
  input: Omit<RedesignBundleInput, "commandPayloadDigest"> | RedesignBundleInput,
): string {
  const { commandPayloadDigest: _excluded, ...payload } = input as RedesignBundleInput;
  return sha(stableJson(payload));
}

function validatePublicationGroup(
  input: RedesignBundleInput,
  group: AuthoringCommandGroupInput,
): string | undefined {
  if (
    group.groupId !== input.commandId ||
    group.commandPayloadDigest !== redesignPublicationPayloadDigest(input, group.members) ||
    group.occurredAt !== input.origin.occurredAt
  )
    return "plan-redesign-publication-binding-invalid";
  const required = [input.replacement, input.origin];
  if (
    group.members.length < 3 ||
    required.some(
      (artifact) =>
        !group.members.some(
          (member) =>
            member.artifactPath === artifact.sourcePath &&
            member.contentDigest === sha(artifact.sourceContent),
        ),
    ) ||
    !group.members.some(
      (member) =>
        member.artifactPath === input.projection.path &&
        member.contentDigest === input.projection.contentDigest,
    )
  )
    return "plan-redesign-publication-members-invalid";
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

function parseCanonicalPlan(
  input: Pick<AppendPlanRevisionInput, "planId" | "canonicalPayloadJson"> & {
    readonly sourceContent: string;
  },
): Record<string, unknown> | undefined {
  const parsed = parseLegacyPlanSource(input.sourceContent);
  const canonical = parseFrontmatter(input.canonicalPayloadJson);
  const { admission_receipt: _receipt, ...sourceFrontmatter } = parsed?.frontmatter ?? {};
  if (
    !parsed ||
    !canonical ||
    parsed.planId !== input.planId ||
    stableJson(sourceFrontmatter) !== stableJson(canonical)
  )
    return undefined;
  return canonical;
}

function unprefix(value: string | undefined): string {
  return value?.startsWith("sha256:") ? value.slice(7) : (value ?? "");
}

function containsPlanReference(
  frontmatter: Record<string, unknown>,
  source: string,
  planId: string,
): boolean {
  if (frontmatter.plan_id === planId) return false;
  const core = planId.match(/^(PLAN-[A-Z0-9]+-\d+)/)?.[1] ?? planId;
  return new RegExp(`\\b${core.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(source);
}

export function redesignPublicationPayloadDigest(
  input: RedesignBundleInput,
  members: readonly AuthoringCommandGroupInput["members"][number][],
): string {
  return sha(
    stableJson({
      bundleDigest: input.commandPayloadDigest,
      members: [...members].sort((a, b) => a.memberId.localeCompare(b.memberId)),
    }),
  );
}

function sha(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}
