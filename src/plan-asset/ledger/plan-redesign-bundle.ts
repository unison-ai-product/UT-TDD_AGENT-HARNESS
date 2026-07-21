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
  readonly publication: DerivedRedesignPublication;
}

const publicationBrand: unique symbol = Symbol("DerivedRedesignPublication");
export interface DerivedRedesignPublication {
  readonly members: readonly AuthoringCommandGroupInput["members"][number][];
  readonly memberSetDigest: string;
  readonly [publicationBrand]: true;
}

type PublicationArtifact = {
  readonly memberId: string;
  readonly path: string;
  readonly content: string;
  readonly expectedPreimage: AuthoringCommandGroupInput["members"][number]["expectedPreimage"];
};

export function deriveRedesignPublication(input: {
  readonly origin: Omit<PublicationArtifact, "memberId">;
  readonly replacement: Omit<PublicationArtifact, "memberId">;
  readonly projection: Omit<PublicationArtifact, "memberId">;
  readonly pairs: readonly (PublicationArtifact & { readonly memberId: `pair:${string}` })[];
  readonly upstream?: readonly (PublicationArtifact & {
    readonly memberId: `upstream:${string}`;
  })[];
}): DerivedRedesignPublication {
  const expectedPairs = tracePaths(input.origin.content, "pair_artifact");
  if (expectedPairs.length === 0) throw new Error("plan-redesign-publication-pair-required");
  const expectedUpstream = uniqueSorted([
    ...tracePaths(input.origin.content, "dependencies.requires"),
    ...tracePaths(input.replacement.content, "dependencies.requires"),
  ]);
  assertExactTraceMembers("pair", expectedPairs, input.pairs);
  assertExactTraceMembers("upstream", expectedUpstream, input.upstream ?? []);
  const artifacts: PublicationArtifact[] = [
    { memberId: "origin", ...input.origin },
    { memberId: "replacement", ...input.replacement },
    { memberId: "projection", ...input.projection },
    ...input.pairs,
    ...(input.upstream ?? []),
  ];
  if (new Set(artifacts.map((artifact) => artifact.memberId)).size !== artifacts.length)
    throw new Error("plan-redesign-publication-member-duplicate");
  const members = canonicalMembers(
    artifacts.map((artifact) => ({
      memberId: artifact.memberId,
      artifactPath: artifact.path,
      contentDigest: sha(artifact.content),
      expectedPreimage: artifact.expectedPreimage,
    })),
  );
  return Object.freeze({
    members: Object.freeze(members),
    memberSetDigest: sha(stableJson(members)),
    [publicationBrand]: true as const,
  });
}

function tracePaths(content: string, field: "pair_artifact" | "dependencies.requires"): string[] {
  const parsed = parseLegacyPlanSource(content);
  if (!parsed) throw new Error("plan-redesign-publication-source-invalid");
  if (field === "pair_artifact") {
    const path = parsed.frontmatter.pair_artifact;
    return typeof path === "string" && path.startsWith("docs/test-design/") ? [path] : [];
  }
  const dependencies = parsed.frontmatter.dependencies;
  if (!dependencies || typeof dependencies !== "object" || Array.isArray(dependencies)) return [];
  const requires = (dependencies as Record<string, unknown>).requires;
  if (!Array.isArray(requires)) return [];
  return uniqueSorted(
    requires.filter((path): path is string => typeof path === "string" && path.startsWith("docs/")),
  );
}

function assertExactTraceMembers(
  role: "pair" | "upstream",
  expectedPaths: readonly string[],
  actual: readonly PublicationArtifact[],
): void {
  const actualPaths = uniqueSorted(actual.map((artifact) => artifact.path));
  if (
    actualPaths.length !== actual.length ||
    stableJson(actualPaths) !== stableJson(uniqueSorted(expectedPaths))
  )
    throw new Error(`plan-redesign-publication-${role}-closure-invalid`);
}

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
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
    publisher: AuthoringArtifactPublisher,
  ): RedesignBundlePublicationResult {
    const group: AuthoringCommandGroupInput = {
      groupId: input.commandId,
      commandPayloadDigest: redesignPublicationPayloadDigest(input, input.publication.members),
      occurredAt: input.origin.occurredAt,
      members: input.publication.members,
    };
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
  if (!publicationManifestValid(input)) return "plan-redesign-publication-members-invalid";
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
  if (
    stableJson(canonicalMembers(group.members)) !==
    stableJson(canonicalMembers(input.publication.members))
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
  const escaped = planId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|[^A-Za-z0-9_-])${escaped}(?![A-Za-z0-9_-])`, "m").test(source);
}

function publicationManifestValid(input: RedesignBundleInput): boolean {
  const expected = new Map([
    ["origin", [input.origin.sourcePath, sha(input.origin.sourceContent)]],
    ["replacement", [input.replacement.sourcePath, sha(input.replacement.sourceContent)]],
    ["projection", [input.projection.path, input.projection.contentDigest]],
  ] as const);
  const ids = new Set(input.publication.members.map((member) => member.memberId));
  return (
    input.publication[publicationBrand] === true &&
    input.publication.memberSetDigest ===
      sha(stableJson(canonicalMembers(input.publication.members))) &&
    ids.size === input.publication.members.length &&
    ["origin", "replacement", "projection"].every((id) => ids.has(id)) &&
    input.publication.members.some((member) => member.memberId.startsWith("pair:")) &&
    input.publication.members.every((member) => {
      const binding = expected.get(member.memberId as "origin" | "replacement" | "projection");
      return member.memberId.startsWith("pair:")
        ? member.artifactPath.startsWith("docs/test-design/")
        : member.memberId.startsWith("upstream:")
          ? member.artifactPath.startsWith("docs/")
          : binding?.[0] === member.artifactPath && binding[1] === member.contentDigest;
    })
  );
}

function canonicalMembers(members: AuthoringCommandGroupInput["members"]) {
  return [...members].sort((a, b) => a.memberId.localeCompare(b.memberId));
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
