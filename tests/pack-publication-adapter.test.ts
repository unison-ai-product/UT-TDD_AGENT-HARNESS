import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { stringify } from "yaml";
import {
  deriveArtifactInventoryDigest,
  deriveReleaseRecordDigest,
} from "../src/schema/release-manifest.ts";
import {
  admitPackPublication,
  derivePackPublicationIntentDigest,
  derivePackPublicationTreeDigest,
  publishPackCanary as executePackCanary,
  type PackPublicationAdmission,
  type PackPublicationApproval,
  type PackPublicationApprovalDraft,
  type PackPublicationIntentInput,
  type PackPublicationPorts,
  type PackPublicationResult,
  parseSealedPackageVersionIdentity,
  preparePackPublication,
  sealPackPublicationIntent,
} from "../src/setup/pack-publication-adapter.ts";
import {
  derivePackPublicationAssets,
  type SealedPublicationEntry,
} from "../src/setup/pack-publication-assets.ts";
import { buildPackPublicationStagingPlan } from "../src/setup/pack-publication-staging.ts";

const sha = (value: Uint8Array | string) =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`;
const stable = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, item]) => `${JSON.stringify(key)}:${stable(item)}`)
    .join(",")}}`;
};
const sourceRevision = "a".repeat(40);
const artifactSetDigest = `sha256:${"b".repeat(64)}`;
const content = Buffer.from("abc");
const packageContent = Buffer.from('{"name":"ut-tdd","version":"0.2.0-canary.1"}');
const packageLockContent = Buffer.from(
  '{"name":"ut-tdd","version":"0.2.0-canary.1","lockfileVersion":3,"packages":{"":{"name":"ut-tdd","version":"0.2.0-canary.1"}}}',
);
const packageEntry: SealedPublicationEntry = {
  sourcePath: "package.json",
  destinationPath: "package.json",
  mode: "100644",
  size: packageContent.length,
  contentDigest: sha(packageContent),
  content: packageContent,
};
const packageLockEntry: SealedPublicationEntry = {
  sourcePath: "package-lock.json",
  destinationPath: "package-lock.json",
  mode: "100644",
  size: packageLockContent.length,
  contentDigest: sha(packageLockContent),
  content: packageLockContent,
};
const entry: SealedPublicationEntry = {
  sourcePath: "src/cli.ts",
  destinationPath: "bin/ut-tdd.js",
  mode: "100755",
  size: content.length,
  contentDigest: sha(content),
  content,
};
const releaseId = () =>
  `rel-sha256:${createHash("sha256")
    .update(
      Buffer.concat([
        Buffer.from("v2\0"),
        Buffer.from(sourceRevision),
        Buffer.from("\0"),
        Buffer.from(artifactSetDigest.slice(7), "hex"),
      ]),
    )
    .digest("hex")}`;

function rawManifest(): Record<string, unknown> {
  const packageArtifact = {
    sourcePath: packageEntry.sourcePath,
    destinationPath: packageEntry.destinationPath,
    mode: packageEntry.mode,
    size: packageEntry.size,
    contentDigest: packageEntry.contentDigest,
  };
  const packageLockArtifact = {
    sourcePath: packageLockEntry.sourcePath,
    destinationPath: packageLockEntry.destinationPath,
    mode: packageLockEntry.mode,
    size: packageLockEntry.size,
    contentDigest: packageLockEntry.contentDigest,
  };
  const artifact = {
    sourcePath: entry.sourcePath,
    destinationPath: entry.destinationPath,
    mode: entry.mode,
    size: entry.size,
    contentDigest: entry.contentDigest,
  };
  const artifactInventoryDigest = deriveArtifactInventoryDigest([
    artifact,
    packageLockArtifact,
    packageArtifact,
  ]);
  const provisional = {
    releaseId: releaseId(),
    materializerVersion: "v2",
    artifactSourceCommit: sourceRevision,
    artifactSetDigest,
    artifactInventoryDigest,
    releaseAssetInventoryDigest: `sha256:${"c".repeat(64)}`,
    releaseRecordDigest: `sha256:${"d".repeat(64)}`,
    artifacts: [artifact, packageLockArtifact, packageArtifact],
  };
  const assets = derivePackPublicationAssets({
    release: provisional,
    entries: [entry, packageLockEntry, packageEntry],
  });
  if (!assets.ok) throw new Error(assets.error);
  const releaseAssetInventoryDigest = assets.value.releaseAssetInventoryDigest;
  const releaseRecordDigest = deriveReleaseRecordDigest({
    materializerVersion: "v2",
    artifactSourceCommit: sourceRevision,
    artifactSetDigest,
    artifactInventoryDigest,
    releaseAssetInventoryDigest,
  });
  return {
    schema_version: "v2",
    releases: {
      [releaseId()]: {
        materializerVersion: provisional.materializerVersion,
        artifactSourceCommit: provisional.artifactSourceCommit,
        artifactSetDigest: provisional.artifactSetDigest,
        artifactInventoryDigest: provisional.artifactInventoryDigest,
        releaseAssetInventoryDigest,
        releaseRecordDigest,
        artifacts: provisional.artifacts,
      },
    },
    channels: { canary: releaseId(), stable: releaseId() },
    channelOrder: ["canary", "stable"],
  };
}

function stagingPlan() {
  const manifest = rawManifest();
  const result = buildPackPublicationStagingPlan({
    manifestInput: manifest,
    releaseId: releaseId(),
    controlManifestBytes: Buffer.from(stringify(manifest), "utf8"),
    entries: [entry, packageLockEntry, packageEntry],
  });
  if (!result.ok) throw new Error(result.error);
  return result.plan;
}

function input(plan = stagingPlan()): PackPublicationIntentInput {
  const seed = {
    plan,
    operationId: "op-1",
    idempotencyKey: "idem-1",
    releaseVersion: "0.2.0-canary.1",
    tagName: "v0.2.0-canary.1",
    remote: {
      repository: "RetryYN/UT-TDD_AGENT-HARNESS-Pack",
      publicationBranch: "publication/op-1",
      expectedMainSha: "1".repeat(40),
      expectedMainStateDigest: `sha256:${"2".repeat(64)}`,
      expectedPointerObjectDigest: `sha256:${"3".repeat(64)}`,
      beforeControlManifestSnapshotDigest: plan.controlManifestSnapshotDigest,
      allowedMergeMode: "exact_ref_lease" as const,
      derivationRule: "entries-and-sidecar-v2" as const,
    },
  };
  const intentDigest = derivePackPublicationIntentDigest(seed);
  const mutations = ["planned", "pack_branch_commit", "pack_pr_create"] as const;
  const transition = (mutation: (typeof mutations)[number]) =>
    mutation.startsWith("asset_upload:")
      ? ("assets" as const)
      : (
          {
            planned: "planned",
            pack_branch_commit: "pack_commit",
            pack_pr_create: "pack_commit",
            pack_main_lease: "pack_commit",
            release_draft_create: "release_draft",
            tag_create: "tag",
            release_visibility: "release_visible",
            canary_pointer_append: "canary",
          } as const
        )[mutation as Exclude<(typeof mutations)[number], `asset_upload:${string}`>];
  const approvals: PackPublicationApproval[] = mutations.map((mutation, index) => ({
    transition: transition(mutation),
    mutation,
    operationId: seed.operationId,
    nonce: `nonce-${index}`,
    approver: "release-owner",
    expiresAt: "2099-01-01T00:00:00Z",
    intentDigest,
    approvalStateDigest: `sha256:${"4".repeat(64)}`,
    idempotencyKey: seed.idempotencyKey,
  }));
  return { ...seed, approvals };
}

function publicationApprovalDrafts(
  intent: ReturnType<typeof sealedIntent>,
): PackPublicationApprovalDraft[] {
  const mutations = [
    "planned",
    "pack_main_lease",
    "release_draft_create",
    ...intent.releaseAssets.map((asset) => `asset_upload:${asset.name}` as const),
    "tag_create",
    "release_visibility",
    "canary_pointer_append",
  ] as const;
  const transition = (mutation: (typeof mutations)[number]) =>
    mutation.startsWith("asset_upload:")
      ? ("assets" as const)
      : (
          {
            planned: "planned",
            pack_main_lease: "pack_commit",
            release_draft_create: "release_draft",
            tag_create: "tag",
            release_visibility: "release_visible",
            canary_pointer_append: "canary",
          } as const
        )[mutation as Exclude<(typeof mutations)[number], `asset_upload:${string}`>];
  return mutations.map((mutation, index) => ({
    transition: transition(mutation),
    mutation,
    operationId: intent.operationId,
    nonce: `publication-nonce-${index}`,
    approver: "release-owner",
    expiresAt: "2099-01-01T00:00:00Z",
    approvalStateDigest: `sha256:${"6".repeat(64)}`,
    idempotencyKey: intent.idempotencyKey,
  }));
}

function sealedIntent() {
  const result = sealPackPublicationIntent(input());
  if (!result.ok) throw new Error(result.error);
  return result.intent;
}

function ports(overrides: Partial<PackPublicationPorts> = {}): PackPublicationPorts {
  const plan = stagingPlan();
  const mainSha = "7".repeat(40);
  let mainUpdated = false;
  let createdTag: { name: string; targetCommit: string; annotated: true } | null = null;
  const base: PackPublicationPorts = {
    approval: { consume: async () => ({ status: "attested", value: { mode: "new" } }) },
    preparationState: {
      append: vi.fn(),
      digest: () => `sha256:${"5".repeat(64)}`,
      observePreparation: async () => ({
        status: "attested",
        value: {
          readBackObservationDigest: sha(
            stable({
              pullRequest: "42",
              headOid: "7".repeat(40),
              baseOid: "1".repeat(40),
              treeDigest: derivePackPublicationTreeDigest(plan),
              controlManifestSnapshotDigest: plan.controlManifestSnapshotDigest,
            }),
          ),
          preparationJournalDigest: `sha256:${"5".repeat(64)}`,
        },
      }),
    },
    publicationState: { append: vi.fn(), digest: () => `sha256:${"5".repeat(64)}` },
    pack: {
      observeBefore: async () => ({
        status: "attested",
        value: {
          mainSha: "1".repeat(40),
          mainStateDigest: `sha256:${"2".repeat(64)}`,
          pointerObjectDigest: `sha256:${"3".repeat(64)}`,
          controlManifestSnapshotDigest: plan.controlManifestSnapshotDigest,
        },
      }),
      commitPublicationBranch: async () => ({
        status: "attested",
        value: { branchCommit: "7".repeat(40) },
      }),
      createPullRequest: async () => ({
        status: "attested",
        value: {
          pullRequest: "42",
          headOid: "7".repeat(40),
          baseOid: "1".repeat(40),
          treeDigest: derivePackPublicationTreeDigest(plan),
          controlManifestSnapshotDigest: plan.controlManifestSnapshotDigest,
        },
      }),
      observePullRequest: async () => ({
        status: "attested",
        value: {
          pullRequest: "42",
          headOid: "7".repeat(40),
          baseOid: "1".repeat(40),
          treeDigest: derivePackPublicationTreeDigest(plan),
          controlManifestSnapshotDigest: plan.controlManifestSnapshotDigest,
        },
      }),
      observeReviewEvidence: async () => ({
        status: "attested",
        value: { reviewEvidenceDigest: sha("review") },
      }),
      observeRequiredChecks: async () => ({
        status: "attested",
        value: { requiredChecksDigest: sha("checks") },
      }),
      observeMergeBase: async () => ({
        status: "attested",
        value: { mergeBaseOid: "1".repeat(40) },
      }),
      observeFreshness: async () => ({
        status: "attested",
        value: {
          operationIdUnused: true,
          idempotencyKeyUnused: true,
          pullRequestUnused: true,
        },
      }),
      applyReviewedHeadWithLease: async () => {
        mainUpdated = true;
        return {
          status: "attested",
          value: {
            targetRef: "refs/heads/main",
            expectedMainOid: "1".repeat(40),
            reviewedHeadOid: "7".repeat(40),
            actualUpdateStatus: "updated",
            postReadOid: mainSha,
          },
        };
      },
      observeReleaseCommit: async () => ({
        status: "attested",
        value: {
          commitSha: mainSha,
          mainSha,
          treeDigest: derivePackPublicationTreeDigest(plan),
          pointerObjectDigest: `sha256:${"8".repeat(64)}`,
          controlManifestSnapshotDigest: plan.controlManifestSnapshotDigest,
          releaseId: plan.releaseId,
          sourceRevision,
          materializerVersion: "v2",
          mergeMode: "exact_ref_lease",
        },
      }),
    },
    release: {
      createDraft: async ({ releaseId, releaseVersion, tagName, targetCommit }) => ({
        status: "attested",
        value: { releaseId, releaseVersion, tagName, targetCommit, draft: true },
      }),
      observeDraft: async ({ releaseId, releaseVersion, tagName }) => ({
        status: "attested",
        value: { releaseId, releaseVersion, tagName, targetCommit: mainSha, draft: true },
      }),
      uploadAsset: async ({ asset }) => ({
        status: "attested",
        value: { name: asset.name, size: asset.size, contentDigest: asset.contentDigest },
      }),
      observeAsset: async ({ name }) => {
        const asset = plan.releaseAssets.find((candidate) => candidate.name === name);
        if (!asset) return { status: "mismatch", reason: "asset_missing" };
        return {
          status: "attested",
          value: { name, size: asset.size, contentDigest: asset.contentDigest },
        };
      },
    },
    tag: {
      observe: async () => ({ status: "attested", value: createdTag }),
      createAnnotatedCas: async ({ name, targetCommit }) => {
        createdTag = { name, targetCommit, annotated: true };
        return { status: "attested", value: createdTag };
      },
    },
    visibility: {
      makeVisible: async ({ releaseId }) => ({
        status: "attested",
        value: { releaseId, draft: false },
      }),
      observe: async (releaseId) => ({ status: "attested", value: { releaseId, draft: false } }),
    },
    canary: {
      observeBefore: async () => {
        return {
          status: "attested",
          value: {
            pointerObjectDigest: `sha256:${"3".repeat(64)}`,
            controlManifestSnapshotDigest: plan.controlManifestSnapshotDigest,
            mainSha: mainUpdated ? mainSha : "1".repeat(40),
            mainStateDigest: mainUpdated ? `sha256:${"9".repeat(64)}` : `sha256:${"2".repeat(64)}`,
          },
        } as const;
      },
      appendCas: async ({ afterControlManifestSnapshotDigest }) => ({
        status: "attested",
        value: {
          pointerObjectDigest: `sha256:${"8".repeat(64)}`,
          controlManifestSnapshotDigest: afterControlManifestSnapshotDigest,
          mainSha,
          mainStateDigest: `sha256:${"9".repeat(64)}`,
        },
      }),
    },
    auditor: { attest: async () => ({ status: "attested", value: { attested: true } }) },
    reconcile: { observe: async () => ({ status: "unavailable", reason: "unused" }) },
    receipt: { persist: vi.fn() },
    preparationReceipt: { persist: vi.fn() },
  };
  return { ...base, ...overrides } as PackPublicationPorts;
}

const rawPublishPackCanary = executePackCanary;

async function admitPreparedPublication(
  intent: ReturnType<typeof sealedIntent>,
  configured: PackPublicationPorts,
) {
  const preparation = await preparePackPublication(intent, configured);
  if (!preparation.ok || preparation.status !== "prepared") throw new Error("preparation failed");
  const admitted = await admitPackPublication({
    intent,
    preparation: preparation.receipt,
    ports: configured,
    publicationApprovals: publicationApprovalDrafts(intent),
  });
  if (!admitted.ok) throw new Error(admitted.error);
  return { preparation, admission: admitted.admission };
}

async function publishPackCanary(
  intent: ReturnType<typeof sealedIntent>,
  configured: PackPublicationPorts = ports(),
  existingAdmission?: PackPublicationAdmission,
): Promise<PackPublicationResult> {
  if (existingAdmission) return rawPublishPackCanary(intent, configured, existingAdmission);
  const preparation = await preparePackPublication(intent, configured);
  if (!preparation.ok) {
    const { ok: _ok, ...failure } = preparation;
    return failure as PackPublicationResult;
  }
  if (preparation.status !== "prepared") return preparation.result;
  const admitted = await admitPackPublication({
    intent,
    preparation: preparation.receipt,
    ports: configured,
    publicationApprovals: publicationApprovalDrafts(intent),
  });
  if (!admitted.ok)
    return {
      status: "denied",
      stage: "preflight",
      reason: admitted.error,
      remoteWrites: preparation.remoteWrites,
    } as PackPublicationResult;
  const { admission } = admitted;
  const result = await rawPublishPackCanary(admission.publicationIntent, configured, admission);
  return { ...result, remoteWrites: result.remoteWrites + preparation.remoteWrites };
}

function withOperationLedger(value: PackPublicationPorts, ledger: string[]): PackPublicationPorts {
  const wrap = (candidate: unknown, path: string): unknown => {
    if (typeof candidate === "function") {
      return (...args: unknown[]) => {
        ledger.push(path);
        return candidate(...args);
      };
    }
    if (candidate !== null && typeof candidate === "object") {
      return Object.fromEntries(
        Object.entries(candidate).map(([key, nested]) => [key, wrap(nested, `${path}.${key}`)]),
      );
    }
    return candidate;
  };
  return wrap(value, "ports") as PackPublicationPorts;
}

describe("remote Pack canary publication", () => {
  it("U-RELVER-001 / P-RELVER-001: seals package and lockfile versions with canonical tag separately from releaseId", () => {
    const sealed = sealPackPublicationIntent(input());
    expect(sealed).toMatchObject({ ok: true });
    if (!sealed.ok) return;
    expect(sealed.intent.releaseVersion).toBe("0.2.0-canary.1");
    expect(sealed.intent.tagName).toBe("v0.2.0-canary.1");
    expect(sealed.intent.releaseId).toMatch(/^rel-sha256:[a-f0-9]{64}$/);
  });

  it("U-RELVER-005: stale package version is denied before remote writes", () => {
    expect(sealPackPublicationIntent({ ...input(), releaseVersion: "0.2.0-canary.2" })).toEqual({
      ok: false,
      error: "release_version_mismatch",
    });
  });

  it("U-RELVER-006: non-canonical tag is denied before remote writes", () => {
    expect(sealPackPublicationIntent({ ...input(), tagName: "0.2.0-canary.1" })).toEqual({
      ok: false,
      error: "tag_version_mismatch",
    });
  });

  it("U-RELVER-005: each lockfile version identity is denied independently when stale", () => {
    for (const key of ["version", "root"] as const) {
      const staleLock =
        key === "version"
          ? Buffer.from(
              '{"name":"ut-tdd","version":"0.1.4","lockfileVersion":3,"packages":{"":{"name":"ut-tdd","version":"0.2.0-canary.1"}}}',
            )
          : Buffer.from(
              '{"name":"ut-tdd","version":"0.2.0-canary.1","lockfileVersion":3,"packages":{"":{"name":"ut-tdd","version":"0.1.4"}}}',
            );
      const baseline = stagingPlan();
      const stalePlan = {
        ...baseline,
        commitEntries: baseline.commitEntries.map((entry) =>
          entry.path === "package-lock.json"
            ? {
                ...entry,
                size: staleLock.length,
                contentDigest: sha(staleLock),
                bytes: staleLock,
              }
            : entry,
        ),
      };
      expect(sealPackPublicationIntent(input(stalePlan))).toEqual({
        ok: false,
        error: "release_version_mismatch",
      });
    }
  });

  it("U-RELVER-004: missing sealed root package entry is denied before approvals", () => {
    const plan = stagingPlan();
    for (const path of ["package.json", "package-lock.json"]) {
      const withoutEntry = {
        ...plan,
        commitEntries: plan.commitEntries.filter((entry) => entry.path !== path),
      };
      expect(sealPackPublicationIntent(input(withoutEntry))).toEqual({
        ok: false,
        error: "invalid_inventory",
      });
      expect(parseSealedPackageVersionIdentity(withoutEntry.commitEntries)).toBeNull();
    }
    const packageLock = plan.commitEntries.find((entry) => entry.path === "package-lock.json");
    if (!packageLock) throw new Error("expected package-lock entry");
    expect(
      sealPackPublicationIntent(
        input({
          ...plan,
          commitEntries: [...plan.commitEntries, packageLock],
        }),
      ),
    ).toEqual({ ok: false, error: "invalid_inventory" });
    expect(parseSealedPackageVersionIdentity([...plan.commitEntries, packageLock])).toBeNull();
    for (const [path, bytes] of [
      ["package.json", Buffer.from("{")],
      ["package.json", Buffer.from('{"version":1}')],
      ["package-lock.json", Buffer.from('{"version":"0.2.0-canary.1","packages":{}}')],
      [
        "package-lock.json",
        Buffer.from('{"version":1,"packages":{"":{"version":"0.2.0-canary.1"}}}'),
      ],
    ] as const) {
      const mutated = {
        ...plan,
        commitEntries: plan.commitEntries.map((entry) =>
          entry.path === path
            ? { ...entry, size: bytes.length, contentDigest: sha(bytes), bytes }
            : entry,
        ),
      };
      expect(sealPackPublicationIntent(input(mutated))).toEqual({
        ok: false,
        error: "invalid_inventory",
      });
      expect(parseSealedPackageVersionIdentity(mutated.commitEntries)).toBeNull();
    }
  });

  it("AUX-PACKPUB-REMOTE-010: seals an immutable mutation-specific approval set", () => {
    const result = sealPackPublicationIntent(input());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(Object.keys(result.intent.approvals)).toHaveLength(3);
    expect(
      new Set(Object.values(result.intent.approvals).map((approval) => approval.nonce)).size,
    ).toBe(3);
  });

  it("AUX-PACKPUB-REMOTE-011: rejects nonce reuse before remote writes", () => {
    const candidate = input();
    const approvals = candidate.approvals?.map((approval, index, all) =>
      index === 1 ? { ...approval, nonce: all[0].nonce } : approval,
    );
    expect(sealPackPublicationIntent({ ...candidate, approvals })).toEqual({
      ok: false,
      error: "nonce_replay",
    });
  });

  it("AUX-PACKPUB-REMOTE-012: denies initial identity drift with zero writes", async () => {
    const sealed = sealPackPublicationIntent(input());
    if (!sealed.ok) throw new Error(sealed.error);
    const commit = vi.fn();
    const base = ports();
    const result = await publishPackCanary(
      sealed.intent,
      ports({
        pack: {
          ...base.pack,
          observeBefore: async () => ({ status: "mismatch", reason: "main_drift" }),
          commitPublicationBranch: commit,
        },
      }),
    );
    expect(result).toMatchObject({ status: "denied", remoteWrites: 0 });
    expect(commit).not.toHaveBeenCalled();
  });

  it("AUX-PACKPUB-REMOTE-013: records an attempted mutation when its response is lost", async () => {
    const sealed = sealPackPublicationIntent(input());
    if (!sealed.ok) throw new Error(sealed.error);
    const base = ports();
    const result = await publishPackCanary(
      sealed.intent,
      ports({
        pack: {
          ...base.pack,
          commitPublicationBranch: async () => {
            throw new Error("lost");
          },
        },
      }),
    );
    expect(result).toMatchObject({
      status: "indeterminate",
      stage: "pack_commit",
      remoteWrites: 1,
    });
  });

  it("AUX-PACKPUB-REMOTE-014: journals before every successful mutation", async () => {
    const append = vi.fn();
    const result = sealPackPublicationIntent(input());
    if (!result.ok) throw new Error(result.error);
    const outcome = await publishPackCanary(
      result.intent,
      ports({
        publicationState: {
          append,
          digest: () => `sha256:${"5".repeat(64)}`,
        },
      }),
    );
    expect(outcome.status).toBe("published");
    expect(outcome.remoteWrites).toBe(9);
    expect(append.mock.calls.map(([event]) => event.kind)).toContain("mutation_intent");
  });

  it("AUX-PACKPUB-REMOTE-015: stops after a post-write read-back mismatch", async () => {
    const sealed = sealPackPublicationIntent(input());
    if (!sealed.ok) throw new Error(sealed.error);
    const base = ports();
    const draft = vi.fn();
    const result = await publishPackCanary(
      sealed.intent,
      ports({
        pack: {
          ...base.pack,
          observeReleaseCommit: async () => ({ status: "mismatch", reason: "tree_drift" }),
        },
        release: { ...base.release, createDraft: draft },
      }),
    );
    expect(result).toMatchObject({
      status: "partial_publication",
      stage: "pack_commit",
      remoteWrites: 3,
    });
    expect(draft).not.toHaveBeenCalled();
  });

  it("AUX-PACKPUB-REMOTE-016: converts a read-back exception to typed indeterminate and stops", async () => {
    const sealed = sealPackPublicationIntent(input());
    if (!sealed.ok) throw new Error(sealed.error);
    const base = ports();
    const upload = vi.fn();
    const result = await publishPackCanary(
      sealed.intent,
      ports({
        release: {
          ...base.release,
          observeDraft: async () => {
            throw new Error("provider disconnected");
          },
          uploadAsset: upload,
        },
      }),
    );
    expect(result).toMatchObject({
      status: "indeterminate",
      stage: "release_draft",
      reason: "observation_unavailable",
      remoteWrites: 4,
    });
    expect(upload).not.toHaveBeenCalled();
  });

  it.each([
    ["AUX-PACKPUB-REMOTE-017", "pack", "main_unavailable"],
    ["AUX-PACKPUB-REMOTE-018", "pointer", "pointer_unavailable"],
    ["AUX-PACKPUB-REMOTE-019", "tag", "tag_unavailable"],
  ] as const)("%s: preflight observation failure preserves write-zero (%s)", async (_id, surface, reason) => {
    const sealed = sealPackPublicationIntent(input());
    if (!sealed.ok) throw new Error(sealed.error);
    const base = ports();
    const commit = vi.fn();
    const configured = ports({
      pack: {
        ...base.pack,
        commitPublicationBranch: commit,
        observeBefore:
          surface === "pack"
            ? async () => ({ status: "unavailable", reason })
            : base.pack.observeBefore,
      },
      canary: {
        ...base.canary,
        observeBefore:
          surface === "pointer"
            ? async () => ({ status: "unavailable", reason })
            : base.canary.observeBefore,
      },
      tag: {
        ...base.tag,
        observe:
          surface === "tag" ? async () => ({ status: "unavailable", reason }) : base.tag.observe,
      },
    });
    const result = await publishPackCanary(sealed.intent, configured);
    expect(result).toMatchObject({ status: "indeterminate", remoteWrites: 0, reason });
    expect(commit).not.toHaveBeenCalled();
  });

  it("AUX-PACKPUB-REMOTE-020: rejects an already-bound tag before approval consumption", async () => {
    const sealed = sealPackPublicationIntent(input());
    if (!sealed.ok) throw new Error(sealed.error);
    const base = ports();
    const consume = vi.fn();
    const result = await publishPackCanary(
      sealed.intent,
      ports({
        approval: { consume },
        tag: {
          ...base.tag,
          observe: async () => ({
            status: "attested",
            value: { name: sealed.intent.tagName, targetCommit: "f".repeat(40), annotated: true },
          }),
        },
      }),
    );
    expect(result).toMatchObject({
      status: "denied",
      reason: "duplicate_or_retargeted_tag",
      remoteWrites: 0,
    });
    expect(consume).not.toHaveBeenCalled();
  });

  it("AUX-PACKPUB-REMOTE-021: an expired approval denies before its mutation", async () => {
    const sealed = sealPackPublicationIntent(input());
    if (!sealed.ok) throw new Error(sealed.error);
    const commit = vi.fn();
    const result = await publishPackCanary(
      sealed.intent,
      ports({
        approval: { consume: async () => ({ status: "mismatch", reason: "approval_expired" }) },
        pack: { ...ports().pack, commitPublicationBranch: commit },
      }),
    );
    expect(result).toMatchObject({ status: "denied", reason: "approval_expired", remoteWrites: 0 });
    expect(commit).not.toHaveBeenCalled();
  });

  it("AUX-PACKPUB-REMOTE-022: journal failure prevents the associated mutation", async () => {
    const sealed = sealPackPublicationIntent(input());
    if (!sealed.ok) throw new Error(sealed.error);
    const commit = vi.fn();
    const result = await publishPackCanary(
      sealed.intent,
      ports({
        preparationState: {
          append: async () => {
            throw new Error("disk");
          },
          digest: () => "unused",
          observePreparation: ports().preparationState.observePreparation,
        },
        pack: { ...ports().pack, commitPublicationBranch: commit },
      }),
    );
    expect(result).toMatchObject({
      status: "indeterminate",
      reason: "journal_persist_failed",
      remoteWrites: 0,
    });
    expect(commit).not.toHaveBeenCalled();
  });

  it("AUX-PACKPUB-REMOTE-023: draft mismatch stops before asset upload", async () => {
    const sealed = sealPackPublicationIntent(input());
    if (!sealed.ok) throw new Error(sealed.error);
    const base = ports();
    const upload = vi.fn();
    const result = await publishPackCanary(
      sealed.intent,
      ports({
        release: {
          ...base.release,
          observeDraft: async () => ({
            status: "attested",
            value: {
              releaseId: "wrong",
              releaseVersion: sealed.intent.releaseVersion,
              tagName: sealed.intent.tagName,
              targetCommit: "6".repeat(40),
              draft: true,
            },
          }),
          uploadAsset: upload,
        },
      }),
    );
    expect(result).toMatchObject({
      status: "partial_publication",
      reason: "draft_identity_mismatch",
      remoteWrites: 4,
    });
    expect(upload).not.toHaveBeenCalled();
  });

  it("AUX-PACKPUB-REMOTE-024: asset read-back mismatch stops before the second upload", async () => {
    const sealed = sealPackPublicationIntent(input());
    if (!sealed.ok) throw new Error(sealed.error);
    const base = ports();
    const upload = vi.fn(base.release.uploadAsset);
    const result = await publishPackCanary(
      sealed.intent,
      ports({
        release: {
          ...base.release,
          uploadAsset: upload,
          observeAsset: async ({ name }) => ({
            status: "attested",
            value: { name, size: 0, contentDigest: sha("") },
          }),
        },
      }),
    );
    expect(result).toMatchObject({
      status: "partial_publication",
      reason: "asset_identity_mismatch",
      remoteWrites: 5,
    });
    expect(upload).toHaveBeenCalledTimes(1);
  });

  it("AUX-PACKPUB-REMOTE-025: tag response loss is indeterminate and blocks visibility", async () => {
    const sealed = sealPackPublicationIntent(input());
    if (!sealed.ok) throw new Error(sealed.error);
    const base = ports();
    const visible = vi.fn();
    const result = await publishPackCanary(
      sealed.intent,
      ports({
        tag: {
          ...base.tag,
          createAnnotatedCas: async () => {
            throw new Error("lost");
          },
        },
        visibility: { ...base.visibility, makeVisible: visible },
      }),
    );
    expect(result).toMatchObject({ status: "indeterminate", stage: "tag", remoteWrites: 7 });
    expect(visible).not.toHaveBeenCalled();
  });

  it("AUX-PACKPUB-REMOTE-026: tag read-back exception blocks visibility", async () => {
    const sealed = sealPackPublicationIntent(input());
    if (!sealed.ok) throw new Error(sealed.error);
    const base = ports();
    let observations = 0;
    const visible = vi.fn();
    const result = await publishPackCanary(
      sealed.intent,
      ports({
        tag: {
          ...base.tag,
          observe: async () => {
            observations += 1;
            if (observations <= 3) return { status: "attested", value: null };
            throw new Error("lost");
          },
        },
        visibility: { ...base.visibility, makeVisible: visible },
      }),
    );
    expect(result).toMatchObject({
      status: "indeterminate",
      stage: "tag",
      reason: "observation_unavailable",
      remoteWrites: 7,
    });
    expect(visible).not.toHaveBeenCalled();
  });

  it("AUX-PACKPUB-REMOTE-027: visibility mismatch blocks auditor and pointer", async () => {
    const sealed = sealPackPublicationIntent(input());
    if (!sealed.ok) throw new Error(sealed.error);
    const base = ports();
    const audit = vi.fn();
    const pointer = vi.fn();
    const result = await publishPackCanary(
      sealed.intent,
      ports({
        visibility: {
          ...base.visibility,
          observe: async () => ({
            status: "attested",
            value: {
              releaseId: sealed.intent.releaseId,
              releaseVersion: sealed.intent.releaseVersion,
              draft: true,
            },
          }),
        },
        auditor: { attest: audit },
        canary: { ...base.canary, appendCas: pointer },
      }),
    );
    expect(result).toMatchObject({
      status: "partial_publication",
      reason: "visibility_identity_mismatch",
      remoteWrites: 8,
    });
    expect(audit).not.toHaveBeenCalled();
    expect(pointer).not.toHaveBeenCalled();
  });

  it("AUX-PACKPUB-REMOTE-028: auditor denial blocks pointer mutation", async () => {
    const sealed = sealPackPublicationIntent(input());
    if (!sealed.ok) throw new Error(sealed.error);
    const base = ports();
    const pointer = vi.fn();
    const result = await publishPackCanary(
      sealed.intent,
      ports({
        auditor: { attest: async () => ({ status: "mismatch", reason: "audit_failed" }) },
        canary: { ...base.canary, appendCas: pointer },
      }),
    );
    expect(result).toMatchObject({
      status: "partial_publication",
      reason: "audit_failed",
      remoteWrites: 8,
    });
    expect(pointer).not.toHaveBeenCalled();
  });

  it("AUX-PACKPUB-REMOTE-029: late pointer drift blocks CAS append", async () => {
    const sealed = sealPackPublicationIntent(input());
    if (!sealed.ok) throw new Error(sealed.error);
    const base = ports();
    let observations = 0;
    const pointer = vi.fn();
    const result = await publishPackCanary(
      sealed.intent,
      ports({
        canary: {
          ...base.canary,
          observeBefore: async () => {
            observations += 1;
            const observed = await base.canary.observeBefore();
            if (observed.status !== "attested" || observations <= 3) return observed;
            return {
              status: "attested",
              value: { ...observed.value, pointerObjectDigest: sha("foreign") },
            };
          },
          appendCas: pointer,
        },
      }),
    );
    expect(result).toMatchObject({
      status: "partial_publication",
      reason: "late_pointer_cas_drift",
      remoteWrites: 8,
    });
    expect(pointer).not.toHaveBeenCalled();
  });

  it("AUX-PACKPUB-REMOTE-030: pointer response loss counts the attempted write", async () => {
    const sealed = sealPackPublicationIntent(input());
    if (!sealed.ok) throw new Error(sealed.error);
    const base = ports();
    const result = await publishPackCanary(
      sealed.intent,
      ports({
        canary: {
          ...base.canary,
          appendCas: async () => {
            throw new Error("lost");
          },
        },
      }),
    );
    expect(result).toMatchObject({ status: "indeterminate", stage: "canary", remoteWrites: 9 });
  });

  it("AUX-PACKPUB-REMOTE-031: receipt persistence failure is typed after publication writes", async () => {
    const sealed = sealPackPublicationIntent(input());
    if (!sealed.ok) throw new Error(sealed.error);
    const result = await publishPackCanary(
      sealed.intent,
      ports({
        receipt: {
          persist: async () => {
            throw new Error("disk");
          },
        },
      }),
    );
    expect(result).toMatchObject({
      status: "indeterminate",
      reason: "receipt_persist_failed",
      remoteWrites: 9,
    });
  });

  it("AUX-PACKPUB-REMOTE-032: cleanup failure is separate from an immutable successful receipt", async () => {
    const sealed = sealPackPublicationIntent(input());
    if (!sealed.ok) throw new Error(sealed.error);
    const result = await publishPackCanary(
      sealed.intent,
      ports({
        cleanup: {
          run: async () => {
            throw new Error("cleanup");
          },
        },
      }),
    );
    expect(result).toMatchObject({ status: "published", cleanup: "failed", remoteWrites: 9 });
    if (result.status === "published") expect(Object.isFrozen(result.receipt)).toBe(true);
  });
});

describe("PLAN-L7-519 candidate-to-oracle contract", () => {
  it("U-PACKPUB-REMOTE-010: 003-A rejects missing, duplicate, wrong-bound and expired approval", async () => {
    const candidate = input();
    const approvals = [...(candidate.approvals ?? [])];
    expect(sealPackPublicationIntent({ ...candidate, approvals: approvals.slice(1) })).toEqual({
      ok: false,
      error: "approval_missing",
    });
    expect(
      sealPackPublicationIntent({ ...candidate, approvals: [...approvals, approvals[0]] }),
    ).toEqual({ ok: false, error: "approval_duplicate" });
    expect(
      sealPackPublicationIntent({
        ...candidate,
        approvals: approvals.map((value, index) =>
          index === 0 ? { ...value, approver: "" } : value,
        ),
      }),
    ).toEqual({ ok: false, error: "approval_binding_mismatch" });
    const commit = vi.fn();
    const result = await publishPackCanary(
      sealedIntent(),
      ports({
        approval: { consume: async () => ({ status: "mismatch", reason: "approval_expired" }) },
        pack: { ...ports().pack, commitPublicationBranch: commit },
      }),
    );
    expect(result).toMatchObject({ status: "denied", reason: "approval_expired", remoteWrites: 0 });
    expect(commit).not.toHaveBeenCalled();
  });

  it("U-PACKPUB-REMOTE-011: 003-B rejects nonce replay and identity rebinding", () => {
    const candidate = input();
    const approvals = [...(candidate.approvals ?? [])];
    expect(
      sealPackPublicationIntent({
        ...candidate,
        approvals: approvals.map((value, index) =>
          index === 1 ? { ...value, nonce: approvals[0].nonce } : value,
        ),
      }),
    ).toEqual({ ok: false, error: "nonce_replay" });
    expect(
      sealPackPublicationIntent({
        ...candidate,
        approvals: approvals.map((value, index) =>
          index === 0 ? { ...value, operationId: "foreign" } : value,
        ),
      }),
    ).toEqual({ ok: false, error: "approval_binding_mismatch" });
  });

  it("U-PACKPUB-REMOTE-012: 003-C distinguishes initial identity drift from sealed-intent drift", async () => {
    const intent = sealedIntent();
    const base = ports();
    const drift = await publishPackCanary(
      intent,
      ports({
        pack: {
          ...base.pack,
          observeBefore: async () => ({
            status: "attested",
            value: {
              mainSha: "f".repeat(40),
              mainStateDigest: intent.remote.expectedMainStateDigest,
              pointerObjectDigest: intent.remote.expectedPointerObjectDigest,
              controlManifestSnapshotDigest: intent.remote.beforeControlManifestSnapshotDigest,
            },
          }),
        },
      }),
    );
    expect(drift).toMatchObject({
      status: "denied",
      reason: "initial_identity_drift",
      remoteWrites: 0,
    });
    const tampered = { ...intent, expectedTreeDigest: sha("tampered") };
    const sealedDrift = await publishPackCanary(tampered, ports());
    expect(sealedDrift).toMatchObject({
      status: "denied",
      reason: "sealed_intent_mismatch",
      remoteWrites: 0,
    });
  });

  it("U-PACKPUB-REMOTE-013: 003-D rejects a single inventory digest/bytes mutation", () => {
    const plan = stagingPlan();
    const asset = plan.releaseAssets[0];
    const mutated = {
      ...plan,
      releaseAssets: [
        { ...asset, size: asset.size + 1 },
        plan.releaseAssets[1],
      ] as typeof plan.releaseAssets,
    };
    expect(sealPackPublicationIntent(input(mutated))).toEqual({
      ok: false,
      error: "invalid_inventory",
    });
  });

  it("U-PACKPUB-REMOTE-014: 003-E invalid inventory never enters remote composition", async () => {
    const plan = stagingPlan();
    const mutated = {
      ...plan,
      commitEntries: plan.commitEntries.slice(1) as typeof plan.commitEntries,
    };
    expect(sealPackPublicationIntent(input(mutated))).toEqual({
      ok: false,
      error: "invalid_inventory",
    });
    const intent = sealedIntent();
    const operationLedger: string[] = [];
    const instrumentedPorts = withOperationLedger(
      ports({ cleanup: { run: vi.fn() } }),
      operationLedger,
    );
    const result = await publishPackCanary(
      { ...intent, commitEntries: intent.commitEntries.slice(1) },
      instrumentedPorts,
    );
    expect(result).toMatchObject({
      status: "denied",
      reason: "sealed_intent_mismatch",
      remoteWrites: 0,
    });
    expect(operationLedger).toEqual([]);
  });

  it("U-PACKPUB-REMOTE-015: 003-F preserves branch response loss and stops PR/release writes", async () => {
    const base = ports();
    const createPr = vi.fn();
    const draft = vi.fn();
    const result = await publishPackCanary(
      sealedIntent(),
      ports({
        pack: {
          ...base.pack,
          commitPublicationBranch: async () => {
            throw new Error("lost");
          },
          createPullRequest: createPr,
        },
        release: { ...base.release, createDraft: draft },
      }),
    );
    expect(result).toMatchObject({
      status: "indeterminate",
      stage: "pack_commit",
      reason: "remote_response_lost",
      remoteWrites: 1,
    });
    expect(createPr).not.toHaveBeenCalled();
    expect(draft).not.toHaveBeenCalled();
  });

  it("U-PACKPUB-REMOTE-016: 003-G rejects observed release commit identity and stops release writes", async () => {
    const base = ports();
    const draft = vi.fn();
    const result = await publishPackCanary(
      sealedIntent(),
      ports({
        pack: {
          ...base.pack,
          observeReleaseCommit: async () => ({
            status: "attested",
            value: {
              commitSha: "6".repeat(40),
              mainSha: "6".repeat(40),
              treeDigest: sha("foreign"),
              pointerObjectDigest: sha("p"),
              controlManifestSnapshotDigest: stagingPlan().controlManifestSnapshotDigest,
              releaseId: releaseId(),
              sourceRevision,
              materializerVersion: "v2",
              mergeMode: "exact_ref_lease",
            },
          }),
        },
        release: { ...base.release, createDraft: draft },
      }),
    );
    expect(result).toMatchObject({
      status: "partial_publication",
      reason: "release_commit_attestation_mismatch",
      remoteWrites: 3,
    });
    expect(draft).not.toHaveBeenCalled();
  });

  it("U-PACKPUB-REMOTE-017: 003-H1 duplicate tag preflight denies all writes", async () => {
    const base = ports();
    const commit = vi.fn();
    const intent = sealedIntent();
    const result = await publishPackCanary(
      intent,
      ports({
        tag: {
          ...base.tag,
          observe: async () => ({
            status: "attested",
            value: { name: intent.tagName, targetCommit: "f".repeat(40), annotated: true },
          }),
        },
        pack: { ...base.pack, commitPublicationBranch: commit },
      }),
    );
    expect(result).toMatchObject({
      status: "denied",
      reason: "duplicate_or_retargeted_tag",
      remoteWrites: 0,
    });
    expect(commit).not.toHaveBeenCalled();
  });

  it("U-PACKPUB-REMOTE-018: 003-H2 tag response loss stops visibility and pointer writes", async () => {
    const base = ports();
    const visible = vi.fn();
    const pointer = vi.fn();
    const result = await publishPackCanary(
      sealedIntent(),
      ports({
        tag: {
          ...base.tag,
          createAnnotatedCas: async () => {
            throw new Error("lost");
          },
        },
        visibility: { ...base.visibility, makeVisible: visible },
        canary: { ...base.canary, appendCas: pointer },
      }),
    );
    expect(result).toMatchObject({ status: "indeterminate", stage: "tag", remoteWrites: 7 });
    expect(visible).not.toHaveBeenCalled();
    expect(pointer).not.toHaveBeenCalled();
  });

  it("U-PACKPUB-REMOTE-019: 003-I draft identity mismatch stops assets and tag", async () => {
    const base = ports();
    const upload = vi.fn();
    const tag = vi.fn();
    const intent = sealedIntent();
    const result = await publishPackCanary(
      intent,
      ports({
        release: {
          ...base.release,
          observeDraft: async () => ({
            status: "attested",
            value: {
              releaseId: "foreign",
              releaseVersion: intent.releaseVersion,
              tagName: intent.tagName,
              targetCommit: "6".repeat(40),
              draft: true,
            },
          }),
          uploadAsset: upload,
        },
        tag: { ...base.tag, createAnnotatedCas: tag },
      }),
    );
    expect(result).toMatchObject({
      status: "partial_publication",
      reason: "draft_identity_mismatch",
      remoteWrites: 4,
    });
    expect(upload).not.toHaveBeenCalled();
    expect(tag).not.toHaveBeenCalled();
  });

  it("U-PACKPUB-REMOTE-020: 003-J asset identity mismatch stops the second asset and tag", async () => {
    const base = ports();
    const upload = vi.fn(base.release.uploadAsset);
    const tag = vi.fn();
    const result = await publishPackCanary(
      sealedIntent(),
      ports({
        release: {
          ...base.release,
          uploadAsset: upload,
          observeAsset: async ({ name }) => ({
            status: "attested",
            value: { name, size: 0, contentDigest: sha("") },
          }),
        },
        tag: { ...base.tag, createAnnotatedCas: tag },
      }),
    );
    expect(result).toMatchObject({
      status: "partial_publication",
      reason: "asset_identity_mismatch",
      remoteWrites: 5,
    });
    expect(upload).toHaveBeenCalledTimes(1);
    expect(tag).not.toHaveBeenCalled();
  });

  it("U-PACKPUB-REMOTE-021: 003-K source/sidecar/tree read-back drift blocks release", async () => {
    const base = ports();
    const draft = vi.fn();
    const result = await publishPackCanary(
      sealedIntent(),
      ports({
        pack: {
          ...base.pack,
          observeReleaseCommit: async () => ({
            status: "mismatch",
            reason: "control_snapshot_drift",
          }),
        },
        release: { ...base.release, createDraft: draft },
      }),
    );
    expect(result).toMatchObject({
      status: "partial_publication",
      reason: "control_snapshot_drift",
      remoteWrites: 3,
    });
    expect(draft).not.toHaveBeenCalled();
  });

  it("U-PACKPUB-REMOTE-022: 003-L visibility approval denial is partial after prior writes", async () => {
    const pointer = vi.fn();
    const base = ports();
    const result = await publishPackCanary(
      sealedIntent(),
      ports({
        approval: {
          consume: async (approval) =>
            approval.mutation === "release_visibility"
              ? { status: "mismatch", reason: "approval_expired" }
              : { status: "attested", value: { mode: "new" } },
        },
        canary: { ...base.canary, appendCas: pointer },
      }),
    );
    expect(result).toMatchObject({
      status: "partial_publication",
      stage: "release_visible",
      reason: "approval_expired",
      remoteWrites: 7,
    });
    expect(pointer).not.toHaveBeenCalled();
  });

  it("U-PACKPUB-REMOTE-023: 003-M1 initial pointer snapshot drift denies write-zero", async () => {
    const base = ports();
    const commit = vi.fn();
    const intent = sealedIntent();
    const result = await publishPackCanary(
      intent,
      ports({
        canary: {
          ...base.canary,
          observeBefore: async () => ({
            status: "attested",
            value: {
              mainSha: intent.remote.expectedMainSha,
              mainStateDigest: intent.remote.expectedMainStateDigest,
              pointerObjectDigest: sha("foreign"),
              controlManifestSnapshotDigest: intent.remote.beforeControlManifestSnapshotDigest,
            },
          }),
        },
        pack: { ...base.pack, commitPublicationBranch: commit },
      }),
    );
    expect(result).toMatchObject({
      status: "denied",
      reason: "initial_identity_drift",
      remoteWrites: 0,
    });
    expect(commit).not.toHaveBeenCalled();
  });

  it("U-PACKPUB-REMOTE-024: 003-M-late pointer drift preserves immutable objects and blocks append", async () => {
    const base = ports();
    let count = 0;
    const append = vi.fn();
    const result = await publishPackCanary(
      sealedIntent(),
      ports({
        canary: {
          ...base.canary,
          observeBefore: async () => {
            count += 1;
            const observed = await base.canary.observeBefore();
            if (observed.status !== "attested" || count <= 3) return observed;
            return {
              status: "attested",
              value: { ...observed.value, pointerObjectDigest: sha("foreign") },
            };
          },
          appendCas: append,
        },
      }),
    );
    expect(result).toMatchObject({
      status: "partial_publication",
      reason: "late_pointer_cas_drift",
      remoteWrites: 8,
    });
    expect(append).not.toHaveBeenCalled();
  });

  it("U-PACKPUB-REMOTE-025: 003-M2 pointer response loss is indeterminate without duplicate CAS", async () => {
    const base = ports();
    const append = vi.fn(async () => {
      throw new Error("lost");
    });
    const result = await publishPackCanary(
      sealedIntent(),
      ports({ canary: { ...base.canary, appendCas: append } }),
    );
    expect(result).toMatchObject({
      status: "indeterminate",
      stage: "canary",
      reason: "remote_response_lost",
      remoteWrites: 9,
    });
    expect(append).toHaveBeenCalledTimes(1);
  });

  it("U-PACKPUB-REMOTE-026: 003-N cleanup failure does not overwrite publication receipt", async () => {
    const result = await publishPackCanary(
      sealedIntent(),
      ports({
        cleanup: {
          run: async () => {
            throw new Error("cleanup");
          },
        },
      }),
    );
    expect(result).toMatchObject({ status: "published", cleanup: "failed", remoteWrites: 9 });
  });

  it("U-PACKPUB-REMOTE-027: 003-O same-operation reconciliation returns the existing valid receipt with write-zero", async () => {
    const intent = sealedIntent();
    const first = await publishPackCanary(intent, ports());
    if (first.status !== "published") throw new Error(first.reason);
    const base = ports();
    const commit = vi.fn();
    const result = await publishPackCanary(
      intent,
      ports({
        approval: { consume: async () => ({ status: "attested", value: { mode: "reconcile" } }) },
        reconcile: { observe: async () => ({ status: "attested", value: first.receipt }) },
        pack: { ...base.pack, commitPublicationBranch: commit },
      }),
    );
    expect(result).toMatchObject({ status: "published", remoteWrites: 0 });
    expect(commit).not.toHaveBeenCalled();

    const unavailable = await publishPackCanary(
      intent,
      ports({
        approval: { consume: async () => ({ status: "attested", value: { mode: "reconcile" } }) },
        reconcile: { observe: async () => ({ status: "mismatch", reason: "receipt_absent" }) },
        pack: { ...base.pack, commitPublicationBranch: commit },
      }),
    );
    expect(unavailable).toMatchObject({
      status: "denied",
      reason: "receipt_absent",
      remoteWrites: 0,
    });
    expect(commit).not.toHaveBeenCalled();
  });

  it("U-PACKPUB-REMOTE-028: 003-P foreign reconciliation receipt is rejected without new writes", async () => {
    const intent = sealedIntent();
    const first = await publishPackCanary(intent, ports());
    if (first.status !== "published") throw new Error(first.reason);
    const foreign = { ...first.receipt, operationId: "foreign" };
    const base = ports();
    const commit = vi.fn();
    const result = await publishPackCanary(
      intent,
      ports({
        approval: { consume: async () => ({ status: "attested", value: { mode: "reconcile" } }) },
        reconcile: { observe: async () => ({ status: "attested", value: foreign }) },
        pack: { ...base.pack, commitPublicationBranch: commit },
      }),
    );
    expect(result).toMatchObject({
      status: "indeterminate",
      reason: "reconciliation_identity_mismatch",
      remoteWrites: 0,
    });
    expect(commit).not.toHaveBeenCalled();
  });

  it("U-PACKPUB-REMOTE-029: 003-Q production Pack writes are branch commit then PR then CAS merge", async () => {
    const consumed: string[] = [];
    const base = ports();
    const writes: string[] = [];
    const result = await publishPackCanary(
      sealedIntent(),
      ports({
        approval: {
          consume: async (approval) => {
            consumed.push(approval.mutation);
            return { status: "attested", value: { mode: "new" } };
          },
        },
        pack: {
          ...base.pack,
          commitPublicationBranch: async (value) => {
            writes.push("branch_commit");
            return base.pack.commitPublicationBranch(value);
          },
          createPullRequest: async (value) => {
            writes.push("pr_create");
            return base.pack.createPullRequest(value);
          },
          applyReviewedHeadWithLease: async (value) => {
            writes.push("main_lease");
            return base.pack.applyReviewedHeadWithLease(value);
          },
        },
      }),
    );
    expect(result.status).toBe("published");
    expect(consumed).toEqual([
      "planned",
      "pack_branch_commit",
      "pack_pr_create",
      "pack_main_lease",
      "release_draft_create",
      expect.stringMatching(/^asset_upload:/),
      expect.stringMatching(/^asset_upload:/),
      "tag_create",
      "release_visibility",
      "canary_pointer_append",
    ]);
    expect(writes).toEqual(["branch_commit", "pr_create", "main_lease"]);
  });

  it("CANDIDATE-PACKPUB-PORT-013: preparation owns branch/PR writes and admission owns the exact lease", async () => {
    const intent = sealedIntent();
    const base = ports();
    const branchCommit = vi.fn(base.pack.commitPublicationBranch);
    const createPullRequest = vi.fn(base.pack.createPullRequest);
    const applyLease = vi.fn(base.pack.applyReviewedHeadWithLease);
    const configured = ports({
      pack: {
        ...base.pack,
        commitPublicationBranch: branchCommit,
        createPullRequest,
        applyReviewedHeadWithLease: applyLease,
      },
    });
    const preparation = await preparePackPublication(intent, configured);
    expect(preparation).toMatchObject({ ok: true, status: "prepared", remoteWrites: 2 });
    if (!preparation.ok || preparation.status !== "prepared") return;
    const admitted = await admitPackPublication({
      intent,
      preparation: preparation.receipt,
      ports: configured,
      publicationApprovals: publicationApprovalDrafts(intent),
    });
    expect(admitted.ok).toBe(true);
    if (!admitted.ok) return;
    const published = await publishPackCanary(
      admitted.admission.publicationIntent,
      configured,
      admitted.admission,
    );
    expect(published.status).toBe("published");
    expect(branchCommit).toHaveBeenCalledTimes(1);
    expect(createPullRequest).toHaveBeenCalledTimes(1);
    expect(applyLease).toHaveBeenCalledTimes(1);
    expect(applyLease).toHaveBeenCalledWith({
      repository: intent.remote.repository,
      targetRef: "refs/heads/main",
      expectedMainOid: intent.remote.expectedMainSha,
      reviewedHeadOid: preparation.receipt.reviewedHeadOid,
    });
  });

  it("CANDIDATE-PACKPUB-PORT-013: a lease observation drift is typed failure before release writes", async () => {
    const intent = sealedIntent();
    const base = ports();
    const preparation = await preparePackPublication(intent, base);
    if (!preparation.ok || preparation.status !== "prepared") throw new Error("preparation failed");
    const admission = await admitPackPublication({
      intent,
      preparation: preparation.receipt,
      ports: base,
      publicationApprovals: publicationApprovalDrafts(intent),
    });
    if (!admission.ok) throw new Error(admission.error);
    const draft = vi.fn(base.release.createDraft);
    const result = await publishPackCanary(
      admission.admission.publicationIntent,
      ports({
        pack: {
          ...base.pack,
          applyReviewedHeadWithLease: async () => ({
            status: "attested",
            value: {
              targetRef: "refs/heads/main",
              expectedMainOid: intent.remote.expectedMainSha,
              reviewedHeadOid: admission.admission.preparation.reviewedHeadOid,
              actualUpdateStatus: "updated",
              postReadOid: "f".repeat(40),
            },
          }),
        },
        release: { ...base.release, createDraft: draft },
      }),
      admission.admission,
    );
    expect(result).toMatchObject({
      status: "partial_publication",
      stage: "pack_commit",
      reason: "lease_observation_mismatch",
      remoteWrites: 1,
    });
    expect(draft).not.toHaveBeenCalled();
  });

  it("U-PACKPUB-REMOTE-030: 003-R journal persistence failure prevents its mutation", async () => {
    const commit = vi.fn();
    const base = ports();
    const result = await publishPackCanary(
      sealedIntent(),
      ports({
        preparationState: {
          append: async () => {
            throw new Error("disk");
          },
          digest: () => sha("state"),
          observePreparation: ports().preparationState.observePreparation,
        },
        pack: { ...base.pack, commitPublicationBranch: commit },
      }),
    );
    expect(result).toMatchObject({
      status: "indeterminate",
      reason: "journal_persist_failed",
      remoteWrites: 0,
    });
    expect(commit).not.toHaveBeenCalled();
  });

  it("U-PACKPUB-REMOTE-031: 003-S1 root intent linkage mutation is sealed-intent mismatch", async () => {
    const intent = sealedIntent();
    const commit = vi.fn();
    const base = ports();
    const result = await publishPackCanary(
      { ...intent, expectedTreeDigest: sha("foreign-tree") },
      ports({ pack: { ...base.pack, commitPublicationBranch: commit } }),
    );
    expect(result).toMatchObject({
      status: "denied",
      reason: "sealed_intent_mismatch",
      remoteWrites: 0,
    });
    expect(commit).not.toHaveBeenCalled();

    const approvalVariants = [
      {
        ...intent.approvals,
        planned: { ...intent.approvals.planned, intentDigest: sha("foreign") },
      },
      { ...intent.approvals, planned: { ...intent.approvals.planned, operationId: "foreign" } },
      { ...intent.approvals, planned: { ...intent.approvals.planned, idempotencyKey: "foreign" } },
      {
        ...intent.approvals,
        planned: { ...intent.approvals.planned, transition: "canary" as const },
      },
      Object.fromEntries(
        Object.entries(intent.approvals).filter(([mutation]) => mutation !== "planned"),
      ),
      {
        ...intent.approvals,
        planned: intent.approvals.pack_branch_commit,
        pack_branch_commit: intent.approvals.planned,
      },
    ];
    for (const approvals of approvalVariants) {
      const approvalDrift = await publishPackCanary(
        { ...intent, approvals },
        ports({ pack: { ...base.pack, commitPublicationBranch: commit } }),
      );
      expect(approvalDrift).toMatchObject({
        status: "denied",
        reason: "sealed_intent_mismatch",
        remoteWrites: 0,
      });
    }
    expect(commit).not.toHaveBeenCalled();
  });

  it("U-PACKPUB-REMOTE-032: 003-S2 post-journal draft target substitution stops later transitions", async () => {
    const intent = sealedIntent();
    const base = ports();
    const upload = vi.fn();
    const result = await publishPackCanary(
      intent,
      ports({
        release: {
          ...base.release,
          observeDraft: async () => ({
            status: "attested",
            value: {
              releaseId: intent.releaseId,
              releaseVersion: intent.releaseVersion,
              tagName: intent.tagName,
              targetCommit: "f".repeat(40),
              draft: true,
            },
          }),
          uploadAsset: upload,
        },
      }),
    );
    expect(result).toMatchObject({
      status: "partial_publication",
      reason: "draft_identity_mismatch",
      remoteWrites: 4,
    });
    expect(upload).not.toHaveBeenCalled();
  });

  it("CAS-011/CAS-014: publication without an admission is a typed deny", async () => {
    const intent = sealedIntent();
    const consume = vi.fn();
    const branch = vi.fn();
    const result = await executePackCanary(
      intent,
      ports({
        approval: { consume },
        pack: { ...ports().pack, commitPublicationBranch: branch },
      }),
    );
    expect(result).toEqual({
      status: "denied",
      stage: "preflight",
      reason: "admission_required",
      remoteWrites: 0,
    });
    expect(consume).not.toHaveBeenCalled();
    expect(branch).not.toHaveBeenCalled();
  });

  it("CAS-011: admission rejects a preparation receipt whose journal read-back binding is forged", async () => {
    const intent = sealedIntent();
    const configured = ports();
    const preparation = await preparePackPublication(intent, configured);
    if (!preparation.ok || preparation.status !== "prepared") throw new Error("preparation failed");
    const unsigned = {
      ...preparation.receipt,
      readBackObservationDigest: sha("forged-read-back"),
      receiptDigest: "",
    };
    const forged = { ...unsigned, receiptDigest: sha(stable(unsigned)) };
    const admission = await admitPackPublication({
      intent,
      preparation: forged,
      ports: configured,
      publicationApprovals: publicationApprovalDrafts(intent),
    });
    expect(admission).toEqual({ ok: false, error: "admission_identity_mismatch" });
  });

  it("CAS-014: preparation and publication seal separate intents, nonce sets, and journals", async () => {
    const intent = sealedIntent();
    const preparationAppend = vi.fn();
    const publicationAppend = vi.fn();
    const configured = ports({
      preparationState: {
        ...ports().preparationState,
        append: preparationAppend,
      },
      publicationState: {
        ...ports().publicationState,
        append: publicationAppend,
      },
    });
    const { admission } = await admitPreparedPublication(intent, configured);
    expect(intent.phase).toBe("preparation");
    expect(admission.publicationIntent.phase).toBe("publication");
    expect(admission.publicationIntent.intentDigest).not.toBe(intent.intentDigest);
    const preparationNonces = new Set(
      Object.values(intent.approvals).map((approval) => approval.nonce),
    );
    const publicationNonces = Object.values(admission.publicationIntent.approvals).map(
      (approval) => approval.nonce,
    );
    expect(publicationNonces.some((nonce) => preparationNonces.has(nonce))).toBe(false);
    const preparationEventsBeforePublication = preparationAppend.mock.calls.length;
    const result = await executePackCanary(admission.publicationIntent, configured, admission);
    expect(result.status).toBe("published");
    expect(preparationAppend).toHaveBeenCalledTimes(preparationEventsBeforePublication);
    expect(publicationAppend).toHaveBeenCalled();
    expect(publicationAppend.mock.calls[0][0].intentDigest).toBe(
      admission.publicationIntent.intentDigest,
    );
  });

  it.each([
    ["targetRef", { targetRef: "refs/heads/other" }],
    ["expectedMainOid", { expectedMainOid: "2".repeat(40) }],
    ["reviewedHeadOid", { reviewedHeadOid: "3".repeat(40) }],
    ["actualUpdateStatus", { actualUpdateStatus: "up-to-date" }],
    ["postReadOid", { postReadOid: "4".repeat(40) }],
  ] as const)("PORT-013: lease observation drift on %s is typed and stops release writes", async (_axis, drift) => {
    const intent = sealedIntent();
    const configured = ports();
    const { admission } = await admitPreparedPublication(intent, configured);
    const draft = vi.fn();
    const result = await executePackCanary(
      admission.publicationIntent,
      ports({
        pack: {
          ...configured.pack,
          applyReviewedHeadWithLease: async () => ({
            status: "attested",
            value: {
              targetRef: "refs/heads/main",
              expectedMainOid: intent.remote.expectedMainSha,
              reviewedHeadOid: "7".repeat(40),
              actualUpdateStatus: "updated",
              postReadOid: "7".repeat(40),
              ...drift,
            } as never,
          }),
        },
        release: { ...configured.release, createDraft: draft },
      }),
      admission,
    );
    expect(result).toMatchObject({
      status: "partial_publication",
      stage: "pack_commit",
      reason: "lease_observation_mismatch",
      remoteWrites: 1,
    });
    expect(draft).not.toHaveBeenCalled();
  });

  it("PORT-013: the up-to-date lease response is not treated as this operation's CAS", async () => {
    const intent = sealedIntent();
    const configured = ports();
    const { admission } = await admitPreparedPublication(intent, configured);
    const result = await executePackCanary(
      admission.publicationIntent,
      ports({
        pack: {
          ...configured.pack,
          applyReviewedHeadWithLease: async () => ({
            status: "attested",
            value: {
              targetRef: "refs/heads/main",
              expectedMainOid: intent.remote.expectedMainSha,
              reviewedHeadOid: "7".repeat(40),
              actualUpdateStatus: "up-to-date",
              postReadOid: "7".repeat(40),
            } as never,
          }),
        },
      }),
      admission,
    );
    expect(result).toMatchObject({
      status: "partial_publication",
      reason: "lease_observation_mismatch",
    });
  });

  it("PORT-013: publication journals planned nonce consumption once before mutation intent", async () => {
    const intent = sealedIntent();
    const configured = ports();
    const { admission } = await admitPreparedPublication(intent, configured);
    const publicationEvents: string[] = [];
    const result = await executePackCanary(
      admission.publicationIntent,
      ports({
        publicationState: {
          append: async (event) => {
            publicationEvents.push(event.kind);
          },
          digest: configured.publicationState.digest,
        },
      }),
      admission,
    );
    expect(result.status).toBe("published");
    expect(publicationEvents.filter((kind) => kind === "planned_nonce_consumed")).toHaveLength(1);
    expect(publicationEvents[0]).toBe("planned_nonce_consumed");
    expect(publicationEvents[1]).toBe("mutation_intent");
  });
});
