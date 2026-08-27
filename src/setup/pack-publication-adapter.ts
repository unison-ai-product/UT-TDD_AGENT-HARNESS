import { createHash } from "node:crypto";
import type {
  PackPublicationCommitEntry,
  PackPublicationReleaseAsset,
  SealedPackPublicationPlan,
} from "./pack-publication-staging.ts";

/** A remote response is never represented by a thrown exception. */
export type PublicationPortResult<T> =
  | { readonly status: "attested"; readonly value: T }
  | { readonly status: "mismatch"; readonly reason: string }
  | { readonly status: "unavailable"; readonly reason: string }
  | { readonly status: "indeterminate"; readonly reason: string };
export type PackPublicationPortResult<T> = PublicationPortResult<T>;

export type PublicationTransition =
  | "planned"
  | "pack_commit"
  | "release_draft"
  | "assets"
  | "tag"
  | "release_visible"
  | "canary";

export interface PackPublicationApproval {
  readonly transition: PublicationTransition;
  readonly operationId: string;
  readonly nonce: string;
  readonly approver: string;
  readonly expiresAt: string;
  readonly intentDigest: string;
  readonly approvalStateDigest: string;
  readonly idempotencyKey: string;
}

export interface PackPublicationRemoteIdentity {
  readonly repository: string;
  readonly publicationBranch: string;
  readonly expectedMainSha: string;
  readonly expectedMainStateDigest: string;
  readonly expectedPointerObjectDigest: string;
  readonly beforeControlManifestSnapshotDigest: string;
  readonly allowedMergeMode: "pull_request_cas";
  readonly derivationRule: "entries-and-sidecar-v2";
}

export interface PackPublicationIntent {
  readonly kind: "pack-publication-intent-v1";
  readonly operationId: string;
  readonly idempotencyKey: string;
  readonly releaseId: string;
  readonly sourceRevision: string;
  readonly materializerVersion: string;
  readonly artifactSetDigest: string;
  readonly artifactInventoryDigest: string;
  readonly releaseRecordDigest: string;
  readonly stagingPlanDigest: string;
  readonly controlManifestSnapshotDigest: string;
  readonly commitEntries: readonly PackPublicationCommitEntry[];
  readonly releaseAssets: readonly [PackPublicationReleaseAsset, PackPublicationReleaseAsset];
  readonly remote: PackPublicationRemoteIdentity;
  /** Tree identity is derived from sealed entries; a commit SHA is intentionally absent. */
  readonly expectedTreeDigest: string;
  readonly tagName: string;
  readonly releaseTagLocator: string;
  readonly approvals: Readonly<Record<PublicationTransition, PackPublicationApproval>>;
  readonly intentDigest: string;
}

export interface PackPublicationIntentInput {
  readonly plan: SealedPackPublicationPlan;
  readonly operationId: string;
  readonly idempotencyKey: string;
  readonly remote: PackPublicationRemoteIdentity;
  readonly tagName: string;
  readonly releaseTagLocator?: string;
  readonly approvals?: readonly PackPublicationApproval[];
}

export type PackPublicationIntentError =
  | "invalid_operation"
  | "invalid_remote_identity"
  | "invalid_approval"
  | "approval_transition_missing"
  | "duplicate_approval"
  | "approval_binding_mismatch";

export type PackPublicationIntentResult =
  | { readonly ok: true; readonly intent: PackPublicationIntent }
  | { readonly ok: false; readonly error: PackPublicationIntentError };

export interface PackMainObservation {
  readonly mainSha: string;
  readonly mainStateDigest: string;
  readonly pointerObjectDigest: string;
  readonly controlManifestSnapshotDigest: string;
  readonly tagExists: boolean;
  readonly tagTargetCommit?: string;
}

export interface PackCommitObservation {
  readonly commitSha: string;
  readonly treeDigest: string;
  readonly controlManifestSnapshotDigest: string;
  readonly releaseId: string;
  readonly sourceRevision: string;
  readonly materializerVersion: string;
  readonly mergeMode: "pull_request_cas";
}

export interface DraftReleaseObservation {
  readonly releaseId: string;
  readonly tagName: string;
  readonly targetCommit: string;
  readonly draft: boolean;
}

export interface ReleaseAssetObservation {
  readonly name: string;
  readonly size: number;
  readonly contentDigest: string;
}

export interface TagObservation {
  readonly name: string;
  readonly targetCommit: string;
  readonly annotated: boolean;
}

export interface VisibilityObservation {
  readonly releaseId: string;
  readonly draft: boolean;
}

export interface CanaryObservation {
  readonly pointerObjectDigest: string;
  readonly controlManifestSnapshotDigest: string;
  readonly mainSha: string;
  readonly mainStateDigest: string;
}

export interface PackRepositoryPort {
  readonly observeBefore: () =>
    | PublicationPortResult<PackMainObservation>
    | Promise<PublicationPortResult<PackMainObservation>>;
  readonly commitPublicationBranch: (input: {
    readonly branch: string;
    readonly entries: readonly PackPublicationCommitEntry[];
    readonly controlManifestSnapshotDigest: string;
  }) =>
    | PublicationPortResult<{ readonly branchCommit: string }>
    | Promise<PublicationPortResult<{ readonly branchCommit: string }>>;
  readonly createPullRequest: (input: {
    readonly branch: string;
    readonly expectedMainSha: string;
  }) =>
    | PublicationPortResult<{ readonly pullRequest: string }>
    | Promise<PublicationPortResult<{ readonly pullRequest: string }>>;
  readonly mergePullRequestCas: (input: {
    readonly pullRequest: string;
    readonly expectedMainSha: string;
  }) =>
    | PublicationPortResult<{ readonly mainSha: string }>
    | Promise<PublicationPortResult<{ readonly mainSha: string }>>;
  readonly observeReleaseCommit: (input: {
    readonly mainSha: string;
  }) =>
    | PublicationPortResult<PackCommitObservation>
    | Promise<PublicationPortResult<PackCommitObservation>>;
}

export interface ReleasePort {
  readonly createDraft: (input: {
    readonly releaseId: string;
    readonly tagName: string;
    readonly targetCommit: string;
  }) =>
    | PublicationPortResult<DraftReleaseObservation>
    | Promise<PublicationPortResult<DraftReleaseObservation>>;
  readonly observeDraft: (input: {
    readonly releaseId: string;
    readonly tagName: string;
  }) =>
    | PublicationPortResult<DraftReleaseObservation>
    | Promise<PublicationPortResult<DraftReleaseObservation>>;
  readonly uploadAsset: (input: {
    readonly releaseId: string;
    readonly asset: PackPublicationReleaseAsset;
  }) =>
    | PublicationPortResult<ReleaseAssetObservation>
    | Promise<PublicationPortResult<ReleaseAssetObservation>>;
  readonly observeAsset: (input: {
    readonly releaseId: string;
    readonly name: string;
  }) =>
    | PublicationPortResult<ReleaseAssetObservation>
    | Promise<PublicationPortResult<ReleaseAssetObservation>>;
}

export interface TagPort {
  readonly observe: (input: {
    readonly name: string;
  }) =>
    | PublicationPortResult<TagObservation | null>
    | Promise<PublicationPortResult<TagObservation | null>>;
  readonly createAnnotatedCas: (input: {
    readonly name: string;
    readonly targetCommit: string;
  }) => PublicationPortResult<TagObservation> | Promise<PublicationPortResult<TagObservation>>;
}

export interface ReleaseVisibilityPort {
  readonly makeVisible: (input: {
    readonly releaseId: string;
    readonly tagName: string;
  }) =>
    | PublicationPortResult<VisibilityObservation>
    | Promise<PublicationPortResult<VisibilityObservation>>;
  readonly observe: (input: {
    readonly releaseId: string;
  }) =>
    | PublicationPortResult<VisibilityObservation>
    | Promise<PublicationPortResult<VisibilityObservation>>;
}

export interface CanaryPointerPort {
  readonly observeBefore: () =>
    | PublicationPortResult<CanaryObservation>
    | Promise<PublicationPortResult<CanaryObservation>>;
  readonly appendCas: (input: {
    readonly releaseId: string;
    readonly before: CanaryObservation;
    readonly afterControlManifestSnapshotDigest: string;
  }) =>
    | PublicationPortResult<CanaryObservation>
    | Promise<PublicationPortResult<CanaryObservation>>;
}

export interface PublicationAuditorPort {
  readonly attest: (input: {
    readonly intent: PackPublicationIntent;
    readonly commit: PackCommitObservation;
    readonly draft: DraftReleaseObservation;
    readonly assets: readonly ReleaseAssetObservation[];
    readonly tag: TagObservation;
    readonly visibility: VisibilityObservation;
  }) =>
    | PublicationPortResult<{ readonly attested: true }>
    | Promise<PublicationPortResult<{ readonly attested: true }>>;
}

export interface DurableExecutionStatePort {
  readonly append: (event: PublicationJournalEvent) => void | Promise<void>;
  readonly digest: () => string;
}

export interface ReceiptPort {
  readonly persist: (receipt: PackPublicationReceipt) => void | Promise<void>;
}

export interface PackPublicationPorts {
  readonly approval: {
    readonly consume: (
      approval: PackPublicationApproval,
    ) =>
      | PublicationPortResult<{ readonly consumed: true }>
      | Promise<PublicationPortResult<{ readonly consumed: true }>>;
  };
  readonly durableState: DurableExecutionStatePort;
  readonly pack: PackRepositoryPort;
  readonly release: ReleasePort;
  readonly tag: TagPort;
  readonly visibility: ReleaseVisibilityPort;
  readonly canary: CanaryPointerPort;
  readonly auditor: PublicationAuditorPort;
  readonly receipt: ReceiptPort;
}

export interface PublicationJournalEvent {
  readonly transition: PublicationTransition;
  readonly kind: "planned" | "mutation_intent" | "read_back_observation";
  readonly intentDigest: string;
  readonly nonce: string;
  readonly detailDigest: string;
}

export interface PackPublicationReceipt {
  readonly kind: "pack-publication-receipt-v1";
  readonly operationId: string;
  readonly idempotencyKey: string;
  readonly intentDigest: string;
  readonly releaseId: string;
  readonly sourceRevision: string;
  readonly releasePackCommit: string;
  readonly releasePackTreeDigest: string;
  readonly pointerPackCommit: string;
  readonly pointerPackTreeDigest: string;
  readonly tagName: string;
  readonly assets: readonly [ReleaseAssetObservation, ReleaseAssetObservation];
  readonly beforeControlManifestSnapshotDigest: string;
  readonly afterControlManifestSnapshotDigest: string;
  readonly pointerObjectDigest: string;
  readonly approver: string;
  readonly nonces: Readonly<Record<PublicationTransition, string>>;
  readonly durableExecutionStateDigest: string;
  readonly journalDigest: string;
  readonly receiptDigest: string;
}

export type PackPublicationResult =
  | { readonly status: "published"; readonly receipt: PackPublicationReceipt }
  | {
      readonly status: "denied";
      readonly stage: "preflight" | PublicationTransition;
      readonly reason: string;
      readonly remoteWrites: 0;
    }
  | {
      readonly status: "partial_publication";
      readonly stage: "preflight" | PublicationTransition;
      readonly reason: string;
      readonly remoteWrites: number;
    }
  | {
      readonly status: "indeterminate";
      readonly stage: "preflight" | PublicationTransition;
      readonly reason: string;
      readonly remoteWrites: number;
    };

function sha256(input: Uint8Array | string): string {
  return `sha256:${createHash("sha256").update(input).digest("hex")}`;
}

function lengthPrefixed(value: string): Buffer {
  const bytes = Buffer.from(value, "utf8");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(bytes.length);
  return Buffer.concat([length, bytes]);
}

function digestEntry(entry: PackPublicationCommitEntry): string {
  return sha256(
    Buffer.concat([
      lengthPrefixed(entry.path),
      lengthPrefixed(entry.mode),
      lengthPrefixed(entry.kind),
      lengthPrefixed(entry.contentDigest),
      lengthPrefixed(String(entry.size)),
      Buffer.from(entry.bytes),
    ]),
  );
}

export function derivePackPublicationTreeDigest(plan: SealedPackPublicationPlan): string {
  const entries = [...plan.commitEntries].sort((left, right) =>
    Buffer.compare(Buffer.from(left.path), Buffer.from(right.path)),
  );
  const payload = Buffer.concat([
    Buffer.from("ut-tdd-pack-tree-v2\0", "ascii"),
    lengthPrefixed(String(entries.length)),
    ...entries.map((entry) => lengthPrefixed(digestEntry(entry))),
  ]);
  return sha256(payload);
}

export function derivePackPublicationStagingPlanDigest(plan: SealedPackPublicationPlan): string {
  const payload = Buffer.concat([
    Buffer.from("ut-tdd-pack-staging-v2\0", "ascii"),
    lengthPrefixed(plan.releaseId),
    lengthPrefixed(plan.controlManifestSnapshotDigest),
    lengthPrefixed(derivePackPublicationTreeDigest(plan)),
    ...plan.releaseAssets.map((asset) =>
      lengthPrefixed(`${asset.name}\0${asset.size}\0${asset.contentDigest}`),
    ),
  ]);
  return sha256(payload);
}

function intentDigest(input: Omit<PackPublicationIntent, "intentDigest" | "approvals">): string {
  const approvals = input;
  return sha256(
    JSON.stringify({
      kind: approvals.kind,
      operationId: approvals.operationId,
      idempotencyKey: approvals.idempotencyKey,
      releaseId: approvals.releaseId,
      sourceRevision: approvals.sourceRevision,
      materializerVersion: approvals.materializerVersion,
      artifactSetDigest: approvals.artifactSetDigest,
      artifactInventoryDigest: approvals.artifactInventoryDigest,
      releaseRecordDigest: approvals.releaseRecordDigest,
      stagingPlanDigest: approvals.stagingPlanDigest,
      controlManifestSnapshotDigest: approvals.controlManifestSnapshotDigest,
      tree: approvals.expectedTreeDigest,
      remote: approvals.remote,
      tagName: approvals.tagName,
      releaseTagLocator: approvals.releaseTagLocator,
      entries: approvals.commitEntries.map((entry) => [
        entry.path,
        entry.mode,
        entry.size,
        entry.contentDigest,
        entry.kind,
      ]),
      assets: approvals.releaseAssets.map((asset) => [asset.name, asset.size, asset.contentDigest]),
    }),
  );
}

/** Computes the root binding before approval receipts are attached. */
export function derivePackPublicationIntentDigest(input: PackPublicationIntentInput): string {
  const release = input.plan.manifest.releases[input.plan.releaseId];
  return intentDigest({
    kind: "pack-publication-intent-v1",
    operationId: input.operationId,
    idempotencyKey: input.idempotencyKey,
    releaseId: input.plan.releaseId,
    sourceRevision: release.artifactSourceCommit,
    materializerVersion: release.materializerVersion,
    artifactSetDigest: release.artifactSetDigest,
    artifactInventoryDigest: release.artifactInventoryDigest,
    releaseRecordDigest: release.releaseRecordDigest,
    stagingPlanDigest: derivePackPublicationStagingPlanDigest(input.plan),
    controlManifestSnapshotDigest: input.plan.controlManifestSnapshotDigest,
    commitEntries: input.plan.commitEntries,
    releaseAssets: input.plan.releaseAssets,
    remote: input.remote,
    expectedTreeDigest: derivePackPublicationTreeDigest(input.plan),
    tagName: input.tagName,
    releaseTagLocator: input.releaseTagLocator ?? input.tagName,
  });
}

const TRANSITIONS: readonly PublicationTransition[] = [
  "planned",
  "pack_commit",
  "release_draft",
  "assets",
  "tag",
  "release_visible",
  "canary",
];

export function sealPackPublicationIntent(
  input: PackPublicationIntentInput,
): PackPublicationIntentResult {
  const { plan } = input;
  if (!input.operationId || !input.idempotencyKey || !input.tagName)
    return { ok: false, error: "invalid_operation" };
  if (
    !input.remote.repository ||
    !input.remote.publicationBranch ||
    !input.remote.expectedMainSha ||
    !input.remote.expectedMainStateDigest ||
    !input.remote.expectedPointerObjectDigest ||
    !input.remote.beforeControlManifestSnapshotDigest ||
    input.remote.allowedMergeMode !== "pull_request_cas" ||
    input.remote.derivationRule !== "entries-and-sidecar-v2"
  )
    return { ok: false, error: "invalid_remote_identity" };
  if (input.remote.beforeControlManifestSnapshotDigest !== plan.controlManifestSnapshotDigest)
    return { ok: false, error: "invalid_remote_identity" };
  if (plan.releaseAssets.length !== 2) return { ok: false, error: "invalid_remote_identity" };
  const digest = derivePackPublicationIntentDigest(input);
  const approvals: Partial<Record<PublicationTransition, PackPublicationApproval>> = {};
  for (const approval of input.approvals ?? []) {
    if (approvals[approval.transition]) return { ok: false, error: "duplicate_approval" };
    if (
      approval.operationId !== input.operationId ||
      approval.idempotencyKey !== input.idempotencyKey ||
      approval.intentDigest !== digest ||
      !approval.nonce ||
      !approval.approver ||
      !approval.expiresAt ||
      !approval.approvalStateDigest
    )
      return { ok: false, error: "approval_binding_mismatch" };
    approvals[approval.transition] = Object.freeze({ ...approval });
  }
  if (TRANSITIONS.some((transition) => !approvals[transition]))
    return { ok: false, error: "approval_transition_missing" };
  const intent: PackPublicationIntent = {
    kind: "pack-publication-intent-v1",
    operationId: input.operationId,
    idempotencyKey: input.idempotencyKey,
    releaseId: plan.releaseId,
    sourceRevision: plan.manifest.releases[plan.releaseId].artifactSourceCommit,
    materializerVersion: plan.manifest.releases[plan.releaseId].materializerVersion,
    artifactSetDigest: plan.manifest.releases[plan.releaseId].artifactSetDigest,
    artifactInventoryDigest: plan.manifest.releases[plan.releaseId].artifactInventoryDigest,
    releaseRecordDigest: plan.manifest.releases[plan.releaseId].releaseRecordDigest,
    stagingPlanDigest: derivePackPublicationStagingPlanDigest(plan),
    controlManifestSnapshotDigest: plan.controlManifestSnapshotDigest,
    commitEntries: Object.freeze([...plan.commitEntries]),
    releaseAssets: plan.releaseAssets,
    remote: Object.freeze({ ...input.remote }),
    expectedTreeDigest: derivePackPublicationTreeDigest(plan),
    tagName: input.tagName,
    releaseTagLocator: input.releaseTagLocator ?? input.tagName,
    approvals: Object.freeze(approvals as Record<PublicationTransition, PackPublicationApproval>),
    intentDigest: digest,
  };
  return { ok: true, intent: Object.freeze(intent) };
}

function sameAsset(
  expected: PackPublicationReleaseAsset,
  observed: ReleaseAssetObservation,
): boolean {
  return (
    expected.name === observed.name &&
    expected.size === observed.size &&
    expected.contentDigest === observed.contentDigest
  );
}

function portFailure<T>(
  result: PublicationPortResult<T>,
  stage: PublicationTransition,
  remoteWrites: number,
): PackPublicationResult | null {
  if (result.status === "attested") return null;
  if (result.status === "mismatch")
    return { status: "partial_publication", stage, reason: result.reason, remoteWrites };
  return { status: "indeterminate", stage, reason: result.reason, remoteWrites };
}

async function appendEvent(
  state: DurableExecutionStatePort,
  event: PublicationJournalEvent,
): Promise<boolean> {
  try {
    await state.append(event);
    return true;
  } catch {
    return false;
  }
}

function eventDigest(value: unknown): string {
  return sha256(JSON.stringify(value));
}

export async function publishPackCanary(
  intent: PackPublicationIntent,
  ports: PackPublicationPorts,
): Promise<PackPublicationResult> {
  let remoteWrites = 0;
  const approval = async (
    transition: PublicationTransition,
  ): Promise<PackPublicationResult | null> => {
    const result = await ports.approval.consume(intent.approvals[transition]);
    if (result.status !== "attested")
      return result.status === "mismatch"
        ? { status: "denied", stage: transition, reason: result.reason, remoteWrites: 0 }
        : { status: "indeterminate", stage: transition, reason: result.reason, remoteWrites };
    return null;
  };
  const before = await ports.pack.observeBefore();
  if (before.status !== "attested")
    return before.status === "mismatch"
      ? { status: "denied", stage: "preflight", reason: before.reason, remoteWrites: 0 }
      : { status: "indeterminate", stage: "preflight", reason: before.reason, remoteWrites: 0 };
  const beforeValue = before.status === "attested" ? before.value : undefined;
  if (
    !beforeValue ||
    beforeValue.mainSha !== intent.remote.expectedMainSha ||
    beforeValue.mainStateDigest !== intent.remote.expectedMainStateDigest ||
    beforeValue.pointerObjectDigest !== intent.remote.expectedPointerObjectDigest ||
    beforeValue.controlManifestSnapshotDigest !==
      intent.remote.beforeControlManifestSnapshotDigest ||
    beforeValue.tagExists
  )
    return {
      status: "denied",
      stage: "preflight",
      reason: "initial_identity_drift_or_duplicate",
      remoteWrites: 0,
    };
  const pointerBefore = await ports.canary.observeBefore();
  if (pointerBefore.status !== "attested")
    return pointerBefore.status === "mismatch"
      ? { status: "denied", stage: "preflight", reason: pointerBefore.reason, remoteWrites: 0 }
      : {
          status: "indeterminate",
          stage: "preflight",
          reason: pointerBefore.reason,
          remoteWrites: 0,
        };
  if (
    pointerBefore.status !== "attested" ||
    pointerBefore.value.pointerObjectDigest !== intent.remote.expectedPointerObjectDigest ||
    pointerBefore.value.controlManifestSnapshotDigest !==
      intent.remote.beforeControlManifestSnapshotDigest ||
    pointerBefore.value.mainSha !== intent.remote.expectedMainSha
  )
    return {
      status: "denied",
      stage: "preflight",
      reason: "initial_pointer_drift",
      remoteWrites: 0,
    };
  const existingTag = await ports.tag.observe({ name: intent.tagName });
  if (existingTag.status === "attested" && existingTag.value !== null)
    return {
      status: "denied",
      stage: "preflight",
      reason: "duplicate_or_retargeted_tag",
      remoteWrites: 0,
    };
  if (existingTag.status !== "attested" && existingTag.status !== "mismatch")
    return {
      status: "indeterminate",
      stage: "preflight",
      reason: existingTag.reason,
      remoteWrites: 0,
    };
  if (existingTag.status === "mismatch" && existingTag.reason !== "not_found")
    return { status: "denied", stage: "preflight", reason: existingTag.reason, remoteWrites: 0 };
  const plannedApprovalFailure = await approval("planned");
  if (plannedApprovalFailure) return plannedApprovalFailure;
  if (
    !(await appendEvent(ports.durableState, {
      transition: "planned",
      kind: "planned",
      intentDigest: intent.intentDigest,
      nonce: intent.approvals.planned.nonce,
      detailDigest: eventDigest(beforeValue),
    }))
  )
    return {
      status: "indeterminate",
      stage: "planned",
      reason: "journal_persist_failed",
      remoteWrites,
    };

  const runMutation = async <T>(
    transition: PublicationTransition,
    mutation: () => PublicationPortResult<T> | Promise<PublicationPortResult<T>>,
    detail: unknown,
  ): Promise<{ readonly value?: T; readonly failure?: PackPublicationResult }> => {
    const approvalFailure = await approval(transition);
    if (approvalFailure) return { failure: approvalFailure };
    if (
      !(await appendEvent(ports.durableState, {
        transition,
        kind: "mutation_intent",
        intentDigest: intent.intentDigest,
        nonce: intent.approvals[transition].nonce,
        detailDigest: eventDigest(detail),
      }))
    )
      return {
        failure: {
          status: "indeterminate",
          stage: transition,
          reason: "journal_persist_failed",
          remoteWrites,
        },
      };
    const result = await mutation();
    if (result.status !== "attested")
      return {
        failure: portFailure(result, transition, remoteWrites) ?? {
          status: "indeterminate",
          stage: transition,
          reason: "unknown",
          remoteWrites,
        },
      };
    remoteWrites += 1;
    if (
      !(await appendEvent(ports.durableState, {
        transition,
        kind: "read_back_observation",
        intentDigest: intent.intentDigest,
        nonce: intent.approvals[transition].nonce,
        detailDigest: eventDigest(result.value),
      }))
    )
      return {
        failure: {
          status: "indeterminate",
          stage: transition,
          reason: "journal_persist_failed",
          remoteWrites,
        },
      };
    return { value: result.value };
  };

  const branch = await runMutation(
    "pack_commit",
    () =>
      ports.pack.commitPublicationBranch({
        branch: intent.remote.publicationBranch,
        entries: intent.commitEntries,
        controlManifestSnapshotDigest: intent.controlManifestSnapshotDigest,
      }),
    intent.commitEntries,
  );
  if (branch.failure) return branch.failure;
  const pullRequest = await runMutation(
    "pack_commit",
    () =>
      ports.pack.createPullRequest({
        branch: intent.remote.publicationBranch,
        expectedMainSha: intent.remote.expectedMainSha,
      }),
    branch.value,
  );
  if (pullRequest.failure) return pullRequest.failure;
  const merge = await runMutation(
    "pack_commit",
    () =>
      ports.pack.mergePullRequestCas({
        pullRequest: pullRequest.value?.pullRequest ?? "",
        expectedMainSha: intent.remote.expectedMainSha,
      }),
    pullRequest.value,
  );
  if (merge.failure) return merge.failure;
  const commit = await ports.pack.observeReleaseCommit({ mainSha: merge.value?.mainSha ?? "" });
  if (commit.status !== "attested")
    return (
      portFailure(commit, "pack_commit", remoteWrites) ?? {
        status: "indeterminate",
        stage: "pack_commit",
        reason: "unknown",
        remoteWrites,
      }
    );
  if (
    commit.value.treeDigest !== intent.expectedTreeDigest ||
    commit.value.controlManifestSnapshotDigest !== intent.controlManifestSnapshotDigest ||
    commit.value.releaseId !== intent.releaseId ||
    commit.value.sourceRevision !== intent.sourceRevision ||
    commit.value.materializerVersion !== intent.materializerVersion ||
    commit.value.mergeMode !== intent.remote.allowedMergeMode
  )
    return {
      status: "partial_publication",
      stage: "pack_commit",
      reason: "release_commit_attestation_mismatch",
      remoteWrites,
    };
  if (
    !(await appendEvent(ports.durableState, {
      transition: "pack_commit",
      kind: "read_back_observation",
      intentDigest: intent.intentDigest,
      nonce: intent.approvals.pack_commit.nonce,
      detailDigest: eventDigest(commit.value),
    }))
  )
    return {
      status: "indeterminate",
      stage: "pack_commit",
      reason: "journal_persist_failed",
      remoteWrites,
    };

  const draft = await runMutation(
    "release_draft",
    () =>
      ports.release.createDraft({
        releaseId: intent.releaseId,
        tagName: intent.tagName,
        targetCommit: commit.value.commitSha,
      }),
    commit.value,
  );
  if (draft.failure) return draft.failure;
  const draftObserved = await ports.release.observeDraft({
    releaseId: intent.releaseId,
    tagName: intent.tagName,
  });
  if (draftObserved.status !== "attested")
    return (
      portFailure(draftObserved, "release_draft", remoteWrites) ?? {
        status: "indeterminate",
        stage: "release_draft",
        reason: "unknown",
        remoteWrites,
      }
    );
  if (
    !draftObserved.value.draft ||
    draftObserved.value.releaseId !== intent.releaseId ||
    draftObserved.value.tagName !== intent.tagName ||
    draftObserved.value.targetCommit !== commit.value.commitSha
  )
    return {
      status: "partial_publication",
      stage: "release_draft",
      reason: "draft_identity_mismatch",
      remoteWrites,
    };

  const assetObservations: ReleaseAssetObservation[] = [];
  for (const asset of intent.releaseAssets) {
    const uploaded = await runMutation(
      "assets",
      () => ports.release.uploadAsset({ releaseId: intent.releaseId, asset }),
      asset,
    );
    if (uploaded.failure) return uploaded.failure;
    const observed = await ports.release.observeAsset({
      releaseId: intent.releaseId,
      name: asset.name,
    });
    if (observed.status !== "attested")
      return (
        portFailure(observed, "assets", remoteWrites) ?? {
          status: "indeterminate",
          stage: "assets",
          reason: "unknown",
          remoteWrites,
        }
      );
    if (!sameAsset(asset, observed.value))
      return {
        status: "partial_publication",
        stage: "assets",
        reason: "asset_identity_mismatch",
        remoteWrites,
      };
    assetObservations.push(observed.value);
  }
  const tag = await runMutation(
    "tag",
    () =>
      ports.tag.createAnnotatedCas({ name: intent.tagName, targetCommit: commit.value.commitSha }),
    commit.value,
  );
  if (tag.failure) return tag.failure;
  if (
    !tag.value?.annotated ||
    tag.value.name !== intent.tagName ||
    tag.value.targetCommit !== commit.value.commitSha
  )
    return {
      status: "partial_publication",
      stage: "tag",
      reason: "tag_identity_mismatch",
      remoteWrites,
    };
  const tagObserved = await ports.tag.observe({ name: intent.tagName });
  if (
    tagObserved.status !== "attested" ||
    !tagObserved.value ||
    !tagObserved.value.annotated ||
    tagObserved.value.targetCommit !== commit.value.commitSha
  )
    return {
      status: tagObserved.status === "mismatch" ? "partial_publication" : "indeterminate",
      stage: "tag",
      reason: tagObserved.status === "attested" ? "tag_identity_mismatch" : tagObserved.reason,
      remoteWrites,
    };

  const visibility = await runMutation(
    "release_visible",
    () => ports.visibility.makeVisible({ releaseId: intent.releaseId, tagName: intent.tagName }),
    tagObserved.value,
  );
  if (visibility.failure) return visibility.failure;
  const visibleObserved = await ports.visibility.observe({ releaseId: intent.releaseId });
  if (visibleObserved.status !== "attested")
    return (
      portFailure(visibleObserved, "release_visible", remoteWrites) ?? {
        status: "indeterminate",
        stage: "release_visible",
        reason: "unknown",
        remoteWrites,
      }
    );
  if (visibleObserved.value.draft || visibleObserved.value.releaseId !== intent.releaseId)
    return {
      status: "partial_publication",
      stage: "release_visible",
      reason: "visibility_identity_mismatch",
      remoteWrites,
    };
  const attested = await ports.auditor.attest({
    intent,
    commit: commit.value,
    draft: draftObserved.value,
    assets: assetObservations,
    tag: tagObserved.value,
    visibility: visibleObserved.value,
  });
  if (attested.status !== "attested")
    return (
      portFailure(attested, "release_visible", remoteWrites) ?? {
        status: "indeterminate",
        stage: "release_visible",
        reason: "unknown",
        remoteWrites,
      }
    );

  const lateBefore = await ports.canary.observeBefore();
  if (lateBefore.status !== "attested")
    return (
      portFailure(lateBefore, "canary", remoteWrites) ?? {
        status: "indeterminate",
        stage: "canary",
        reason: "unknown",
        remoteWrites,
      }
    );
  if (
    lateBefore.value.mainSha !== merge.value?.mainSha ||
    lateBefore.value.pointerObjectDigest !== intent.remote.expectedPointerObjectDigest ||
    lateBefore.value.controlManifestSnapshotDigest !==
      intent.remote.beforeControlManifestSnapshotDigest
  )
    return {
      status: "partial_publication",
      stage: "canary",
      reason: "late_pointer_cas_drift",
      remoteWrites,
    };
  const afterDigest = sha256(
    `${intent.controlManifestSnapshotDigest}\0${intent.releaseId}\0${lateBefore.value.mainSha}`,
  );
  const canary = await runMutation(
    "canary",
    () =>
      ports.canary.appendCas({
        releaseId: intent.releaseId,
        before: lateBefore.value,
        afterControlManifestSnapshotDigest: afterDigest,
      }),
    afterDigest,
  );
  if (canary.failure) return canary.failure;
  if (
    !canary.value ||
    canary.value.controlManifestSnapshotDigest !== afterDigest ||
    canary.value.pointerObjectDigest === intent.remote.expectedPointerObjectDigest
  )
    return {
      status: "partial_publication",
      stage: "canary",
      reason: "pointer_read_back_mismatch",
      remoteWrites,
    };
  const journalDigest = ports.durableState.digest();
  const durableExecutionStateDigest = ports.durableState.digest();
  const partialReceipt = {
    kind: "pack-publication-receipt-v1" as const,
    operationId: intent.operationId,
    idempotencyKey: intent.idempotencyKey,
    intentDigest: intent.intentDigest,
    releaseId: intent.releaseId,
    sourceRevision: intent.sourceRevision,
    releasePackCommit: commit.value.commitSha,
    releasePackTreeDigest: commit.value.treeDigest,
    pointerPackCommit: canary.value.mainSha,
    pointerPackTreeDigest: canary.value.mainStateDigest,
    tagName: intent.tagName,
    assets: assetObservations as unknown as readonly [
      ReleaseAssetObservation,
      ReleaseAssetObservation,
    ],
    beforeControlManifestSnapshotDigest: intent.remote.beforeControlManifestSnapshotDigest,
    afterControlManifestSnapshotDigest: afterDigest,
    pointerObjectDigest: canary.value.pointerObjectDigest,
    approver: intent.approvals.planned.approver,
    nonces: Object.freeze(
      Object.fromEntries(
        TRANSITIONS.map((transition) => [transition, intent.approvals[transition].nonce]),
      ),
    ) as Record<PublicationTransition, string>,
    durableExecutionStateDigest,
    journalDigest,
    receiptDigest: "",
  };
  const receipt = Object.freeze({
    ...partialReceipt,
    receiptDigest: sha256(JSON.stringify(partialReceipt)),
  });
  try {
    await ports.receipt.persist(receipt);
  } catch {
    return {
      status: "indeterminate",
      stage: "canary",
      reason: "receipt_persist_failed",
      remoteWrites,
    };
  }
  return { status: "published", receipt };
}

/** Descriptive alias for callers that prefer the domain operation name. */
export const executePackPublication = publishPackCanary;
