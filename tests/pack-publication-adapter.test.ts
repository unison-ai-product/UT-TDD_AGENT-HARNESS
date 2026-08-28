import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { stringify } from "yaml";
import {
  deriveArtifactInventoryDigest,
  deriveReleaseRecordDigest,
} from "../src/schema/release-manifest.ts";
import {
  derivePackPublicationIntentDigest,
  derivePackPublicationTreeDigest,
  type PackPublicationApproval,
  type PackPublicationIntentInput,
  type PackPublicationPorts,
  publishPackCanary,
  sealPackPublicationIntent,
} from "../src/setup/pack-publication-adapter.ts";
import {
  derivePackPublicationAssets,
  type SealedPublicationEntry,
} from "../src/setup/pack-publication-assets.ts";
import { buildPackPublicationStagingPlan } from "../src/setup/pack-publication-staging.ts";

const sha = (value: Uint8Array | string) =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`;
const sourceRevision = "a".repeat(40);
const artifactSetDigest = `sha256:${"b".repeat(64)}`;
const content = Buffer.from("abc");
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
  const artifact = {
    sourcePath: entry.sourcePath,
    destinationPath: entry.destinationPath,
    mode: entry.mode,
    size: entry.size,
    contentDigest: entry.contentDigest,
  };
  const artifactInventoryDigest = deriveArtifactInventoryDigest([artifact]);
  const provisional = {
    releaseId: releaseId(),
    materializerVersion: "v2",
    artifactSourceCommit: sourceRevision,
    artifactSetDigest,
    artifactInventoryDigest,
    releaseAssetInventoryDigest: `sha256:${"c".repeat(64)}`,
    releaseRecordDigest: `sha256:${"d".repeat(64)}`,
    artifacts: [artifact],
  };
  const assets = derivePackPublicationAssets({ release: provisional, entries: [entry] });
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
    entries: [entry],
  });
  if (!result.ok) throw new Error(result.error);
  return result.plan;
}

function input(): PackPublicationIntentInput {
  const plan = stagingPlan();
  const seed = {
    plan,
    operationId: "op-1",
    idempotencyKey: "idem-1",
    tagName: "v0.2.0-canary.1",
    remote: {
      repository: "RetryYN/UT-TDD_AGENT-HARNESS-Pack",
      publicationBranch: "publication/op-1",
      expectedMainSha: "1".repeat(40),
      expectedMainStateDigest: `sha256:${"2".repeat(64)}`,
      expectedPointerObjectDigest: `sha256:${"3".repeat(64)}`,
      beforeControlManifestSnapshotDigest: plan.controlManifestSnapshotDigest,
      allowedMergeMode: "pull_request_cas" as const,
      derivationRule: "entries-and-sidecar-v2" as const,
    },
  };
  const intentDigest = derivePackPublicationIntentDigest(seed);
  const mutations = [
    "planned",
    "pack_branch_commit",
    "pack_pr_create",
    "pack_pr_merge",
    "release_draft_create",
    ...plan.releaseAssets.map((asset) => `asset_upload:${asset.name}` as const),
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
            pack_branch_commit: "pack_commit",
            pack_pr_create: "pack_commit",
            pack_pr_merge: "pack_commit",
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

function ports(overrides: Partial<PackPublicationPorts> = {}): PackPublicationPorts {
  const plan = stagingPlan();
  const mainSha = "6".repeat(40);
  let canaryObservations = 0;
  let createdTag: { name: string; targetCommit: string; annotated: true } | null = null;
  const base: PackPublicationPorts = {
    approval: { consume: async () => ({ status: "attested", value: { mode: "new" } }) },
    durableState: { append: vi.fn(), digest: () => `sha256:${"5".repeat(64)}` },
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
      createPullRequest: async () => ({ status: "attested", value: { pullRequest: "42" } }),
      mergePullRequestCas: async () => ({ status: "attested", value: { mainSha } }),
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
          mergeMode: "pull_request_cas",
        },
      }),
    },
    release: {
      createDraft: async ({ releaseId, tagName, targetCommit }) => ({
        status: "attested",
        value: { releaseId, tagName, targetCommit, draft: true },
      }),
      observeDraft: async ({ releaseId, tagName }) => ({
        status: "attested",
        value: { releaseId, tagName, targetCommit: mainSha, draft: true },
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
        canaryObservations += 1;
        return {
          status: "attested",
          value: {
            pointerObjectDigest: `sha256:${"3".repeat(64)}`,
            controlManifestSnapshotDigest: plan.controlManifestSnapshotDigest,
            mainSha: canaryObservations === 1 ? "1".repeat(40) : mainSha,
            mainStateDigest:
              canaryObservations === 1 ? `sha256:${"2".repeat(64)}` : `sha256:${"9".repeat(64)}`,
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
  };
  return { ...base, ...overrides } as PackPublicationPorts;
}

describe("remote Pack canary publication", () => {
  it("U-PACKPUB-REMOTE-010: seals an immutable mutation-specific approval set", () => {
    const result = sealPackPublicationIntent(input());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(Object.keys(result.intent.approvals)).toHaveLength(10);
    expect(
      new Set(Object.values(result.intent.approvals).map((approval) => approval.nonce)).size,
    ).toBe(10);
  });

  it("U-PACKPUB-REMOTE-011: rejects nonce reuse before remote writes", () => {
    const candidate = input();
    const approvals = candidate.approvals?.map((approval, index, all) =>
      index === 1 ? { ...approval, nonce: all[0].nonce } : approval,
    );
    expect(sealPackPublicationIntent({ ...candidate, approvals })).toEqual({
      ok: false,
      error: "nonce_replay",
    });
  });

  it("U-PACKPUB-REMOTE-012: denies initial identity drift with zero writes", async () => {
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

  it("U-PACKPUB-REMOTE-013: records an attempted mutation when its response is lost", async () => {
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

  it("U-PACKPUB-REMOTE-014: journals before every successful mutation", async () => {
    const append = vi.fn();
    const result = sealPackPublicationIntent(input());
    if (!result.ok) throw new Error(result.error);
    const outcome = await publishPackCanary(
      result.intent,
      ports({ durableState: { append, digest: () => `sha256:${"5".repeat(64)}` } }),
    );
    expect(outcome.status).toBe("published");
    expect(outcome.remoteWrites).toBe(9);
    expect(append.mock.calls.map(([event]) => event.kind)).toContain("mutation_intent");
  });

  it("U-PACKPUB-REMOTE-015: stops after a post-write read-back mismatch", async () => {
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

  it("U-PACKPUB-REMOTE-016: converts a read-back exception to typed indeterminate and stops", async () => {
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
    ["U-PACKPUB-REMOTE-017", "pack", "main_unavailable"],
    ["U-PACKPUB-REMOTE-018", "pointer", "pointer_unavailable"],
    ["U-PACKPUB-REMOTE-019", "tag", "tag_unavailable"],
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

  it("U-PACKPUB-REMOTE-020: rejects an already-bound tag before approval consumption", async () => {
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

  it("U-PACKPUB-REMOTE-021: an expired approval denies before its mutation", async () => {
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

  it("U-PACKPUB-REMOTE-022: journal failure prevents the associated mutation", async () => {
    const sealed = sealPackPublicationIntent(input());
    if (!sealed.ok) throw new Error(sealed.error);
    const commit = vi.fn();
    const result = await publishPackCanary(
      sealed.intent,
      ports({
        durableState: {
          append: async () => {
            throw new Error("disk");
          },
          digest: () => "unused",
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

  it("U-PACKPUB-REMOTE-023: draft mismatch stops before asset upload", async () => {
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

  it("U-PACKPUB-REMOTE-024: asset read-back mismatch stops before the second upload", async () => {
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

  it("U-PACKPUB-REMOTE-025: tag response loss is indeterminate and blocks visibility", async () => {
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

  it("U-PACKPUB-REMOTE-026: tag read-back exception blocks visibility", async () => {
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
            if (observations === 1) return { status: "attested", value: null };
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

  it("U-PACKPUB-REMOTE-027: visibility mismatch blocks auditor and pointer", async () => {
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
            value: { releaseId: sealed.intent.releaseId, draft: true },
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

  it("U-PACKPUB-REMOTE-028: auditor denial blocks pointer mutation", async () => {
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

  it("U-PACKPUB-REMOTE-029: late pointer drift blocks CAS append", async () => {
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
            if (observed.status !== "attested" || observations === 1) return observed;
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

  it("U-PACKPUB-REMOTE-030: pointer response loss counts the attempted write", async () => {
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

  it("U-PACKPUB-REMOTE-031: receipt persistence failure is typed after publication writes", async () => {
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

  it("U-PACKPUB-REMOTE-032: cleanup failure is separate from an immutable successful receipt", async () => {
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
