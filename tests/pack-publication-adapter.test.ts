import { createHash } from "node:crypto";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { stringify } from "yaml";
import {
  deriveArtifactInventoryDigest,
  deriveReleaseRecordDigest,
} from "../src/schema/release-manifest.ts";
import {
  createPackPublicationPreparationReceiptStore,
  derivePackPublicationIntentDigest,
  derivePackPublicationPreparationDigest,
  derivePackPublicationTreeDigest,
  type PackPublicationApproval,
  type PackPublicationIntentInput,
  type PackPublicationPorts,
  type PackPublicationPreparationPorts,
  type PackPublicationPreparationReceipt,
  parseSealedPackageVersionIdentity,
  preparePackPublication,
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

function sealedIntent() {
  const result = sealPackPublicationIntent(input());
  if (!result.ok) throw new Error(result.error);
  return result.intent;
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
    expect(Object.keys(result.intent.approvals)).toHaveLength(10);
    expect(
      new Set(Object.values(result.intent.approvals).map((approval) => approval.nonce)).size,
    ).toBe(10);
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
      ports({ durableState: { append, digest: () => `sha256:${"5".repeat(64)}` } }),
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
              mergeMode: "pull_request_cas",
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
            if (observed.status !== "attested" || count === 1) return observed;
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
          mergePullRequestCas: async (value) => {
            writes.push("pr_merge_cas");
            return base.pack.mergePullRequestCas(value);
          },
        },
      }),
    );
    expect(result.status).toBe("published");
    expect(consumed).toEqual([
      "planned",
      "pack_branch_commit",
      "pack_pr_create",
      "pack_pr_merge",
      "release_draft_create",
      expect.stringMatching(/^asset_upload:/),
      expect.stringMatching(/^asset_upload:/),
      "tag_create",
      "release_visibility",
      "canary_pointer_append",
    ]);
    expect(writes).toEqual(["branch_commit", "pr_create", "pr_merge_cas"]);
  });

  it("U-PACKPUB-REMOTE-030: 003-R journal persistence failure prevents its mutation", async () => {
    const commit = vi.fn();
    const base = ports();
    const result = await publishPackCanary(
      sealedIntent(),
      ports({
        durableState: {
          append: async () => {
            throw new Error("disk");
          },
          digest: () => sha("state"),
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

  describe("Issue #625 preparation-only boundary", () => {
    function preparationInput() {
      const intent = sealedIntent();
      const input = {
        plan: stagingPlan(),
        operationId: intent.operationId,
        idempotencyKey: intent.idempotencyKey,
        repository: intent.remote.repository,
        publicationBranch: intent.remote.publicationBranch,
        expectedMainOid: intent.remote.expectedMainSha,
        approvals: [] as PackPublicationApproval[],
      };
      const digest = derivePackPublicationPreparationDigest(input);
      if (!digest) throw new Error("preparation identity failed");
      input.approvals = [
        {
          ...intent.approvals.pack_branch_commit,
          intentDigest: digest,
          mutation: "pack_branch_commit",
          transition: "pack_commit",
          nonce: "prep-branch",
        },
        {
          ...intent.approvals.pack_pr_create,
          intentDigest: digest,
          mutation: "pack_pr_create",
          transition: "pack_commit",
          nonce: "prep-pr",
        },
      ];
      return { input, intent };
    }

    function preparationPorts(overrides: Partial<PackPublicationPreparationPorts> = {}) {
      const { intent } = preparationInput();
      const events: string[] = [];
      const prep: PackPublicationPreparationPorts = {
        approval: {
          consume: async (approval) => {
            events.push(`consume:${approval.mutation}`);
            return { status: "attested", value: { mode: "new" } };
          },
        },
        durableState: {
          append: async (event) => {
            events.push(`${event.kind}:${event.mutation}`);
          },
        },
        pack: {
          commitPublicationBranch: async () => ({
            status: "attested",
            value: { branchCommit: "7".repeat(40) },
          }),
          createPullRequest: async () => ({
            status: "attested",
            value: {
              pullRequest: "42",
              headOid: "7".repeat(40),
              baseOid: intent.remote.expectedMainSha,
              treeDigest: intent.expectedTreeDigest,
              controlManifestSnapshotDigest: intent.controlManifestSnapshotDigest,
            },
          }),
        },
        receipt: {
          persist: async () => {
            events.push("receipt:persist");
          },
        },
        ...overrides,
      };
      return { prep, events };
    }

    function completePreparationJournal(input: ReturnType<typeof preparationInput>["input"]) {
      const identityDigest = derivePackPublicationPreparationDigest(input);
      if (!identityDigest) throw new Error("preparation identity failed");
      return ["pack_branch_commit", "pack_pr_create"].flatMap((mutation) =>
        ["planned_nonce_consumed", "mutation_intent", "read_back_observation"].map((kind) => ({
          transition: "pack_commit" as const,
          mutation: mutation as "pack_branch_commit" | "pack_pr_create",
          kind: kind as "planned_nonce_consumed" | "mutation_intent" | "read_back_observation",
          intentDigest: identityDigest,
          nonce: input.approvals.find((approval) => approval.mutation === mutation)?.nonce ?? "",
          detailDigest: `sha256:${"0".repeat(64)}`,
        })),
      );
    }

    it("CANDIDATE-PACKPUB-PREP-005/010: emits an identity-bound receipt after ordered branch/PR writes", async () => {
      const { input } = preparationInput();
      const { prep, events } = preparationPorts();
      const result = await preparePackPublication(input, prep);
      expect(result).toMatchObject({ ok: true, status: "prepared", remoteWrites: 2 });
      if (!result.ok) return;
      expect(result.receipt).toMatchObject({
        kind: "pack-publication-preparation-receipt-v1",
        expectedMainOid: input.expectedMainOid,
        branchCommitOid: "7".repeat(40),
        reviewedHeadOid: "7".repeat(40),
        baseOid: input.expectedMainOid,
      });
      expect(result.receipt.receiptDigest).toMatch(/^sha256:[a-f0-9]{64}$/);
      expect(events).toEqual([
        "consume:pack_branch_commit",
        "planned_nonce_consumed:pack_branch_commit",
        "mutation_intent:pack_branch_commit",
        "read_back_observation:pack_branch_commit",
        "consume:pack_pr_create",
        "planned_nonce_consumed:pack_pr_create",
        "mutation_intent:pack_pr_create",
        "read_back_observation:pack_pr_create",
        "receipt:persist",
      ]);
    });

    it("CANDIDATE-PACKPUB-PREP-009: preparation exposes no publication mutation port", async () => {
      const { input } = preparationInput();
      const ledger: string[] = [];
      const production = withOperationLedger(
        ports({
          approval: { consume: async () => ({ status: "attested", value: { mode: "new" } }) },
        }),
        ledger,
      );
      const { prep } = preparationPorts({
        approval: production.approval,
        durableState: production.durableState,
        pack: {
          commitPublicationBranch: production.pack.commitPublicationBranch,
          createPullRequest: async ({ repository, branch, expectedMainSha }) => {
            const result = await production.pack.createPullRequest({
              repository,
              branch,
              expectedMainSha,
            });
            if (result.status !== "attested")
              throw new Error("production fixture PR observation incomplete");
            return {
              status: "attested" as const,
              value: {
                pullRequest: result.value.pullRequest,
                headOid: "7".repeat(40),
                baseOid: input.expectedMainOid,
                treeDigest: input.plan.commitEntries[0]
                  ? derivePackPublicationTreeDigest(input.plan)
                  : "",
                controlManifestSnapshotDigest: input.plan.controlManifestSnapshotDigest,
              },
            };
          },
        },
        receipt: { persist: async () => undefined },
      });
      expect(Object.keys(prep.pack).sort()).toEqual([
        "commitPublicationBranch",
        "createPullRequest",
      ]);
      const result = await preparePackPublication(input, prep);
      expect(result).toMatchObject({ ok: true, remoteWrites: 2 });
      expect(
        ledger.filter((path) =>
          /pack\.mergePullRequestCas|release\.|tag\.|visibility\.|canary\./.test(path),
        ),
      ).toEqual([]);
    });

    it("CANDIDATE-PACKPUB-PREP-009: production publication write ledger stays zero on every deny", async () => {
      const cases = [
        (input: ReturnType<typeof preparationInput>["input"]) => ({ ...input, approvals: [] }),
        (input: ReturnType<typeof preparationInput>["input"]) => ({
          ...input,
          expectedMainOid: "f".repeat(40),
        }),
        (input: ReturnType<typeof preparationInput>["input"]) => ({
          ...input,
          approvals: input.approvals.map((approval) => ({
            ...approval,
            expiresAt: "2000-01-01T00:00:00.000Z",
          })),
        }),
        (input: ReturnType<typeof preparationInput>["input"]) => ({
          ...input,
          approvals: input.approvals.map((approval) => ({ ...approval, nonce: "same" })),
        }),
      ];
      for (const mutate of cases) {
        const ledger: string[] = [];
        const production = withOperationLedger(ports(), ledger);
        const { prep } = preparationPorts({
          approval: production.approval,
          durableState: production.durableState,
          pack: {
            commitPublicationBranch: production.pack.commitPublicationBranch,
            createPullRequest: async ({ repository, branch, expectedMainSha }) => {
              const result = await production.pack.createPullRequest({
                repository,
                branch,
                expectedMainSha,
              });
              if (result.status !== "attested") throw new Error("unexpected fixture failure");
              return {
                status: "attested" as const,
                value: {
                  pullRequest: result.value.pullRequest,
                  headOid: "7".repeat(40),
                  baseOid: expectedMainSha,
                  treeDigest: derivePackPublicationTreeDigest(stagingPlan()),
                  controlManifestSnapshotDigest: stagingPlan().controlManifestSnapshotDigest,
                },
              };
            },
          },
          receipt: { persist: async () => undefined },
        });
        await preparePackPublication(mutate(preparationInput().input), prep);
        expect(
          ledger.filter((path) =>
            /pack\.mergePullRequestCas|release\.|tag\.|visibility\.|canary\./.test(path),
          ),
        ).toEqual([]);
      }
    });

    it.each([
      [
        "approval_missing",
        (input: ReturnType<typeof preparationInput>["input"]) => ({ ...input, approvals: [] }),
      ],
      [
        "expected main identity mismatch",
        (input: ReturnType<typeof preparationInput>["input"]) => ({
          ...input,
          expectedMainOid: "f".repeat(40),
        }),
        "preparation_identity_mismatch",
      ],
      [
        "branch identity mismatch",
        (input: ReturnType<typeof preparationInput>["input"]) => ({
          ...input,
          publicationBranch: "release/foreign",
        }),
        "preparation_identity_mismatch",
      ],
      [
        "operation identity mismatch",
        (input: ReturnType<typeof preparationInput>["input"]) => ({
          ...input,
          operationId: "foreign-operation",
        }),
        "preparation_identity_mismatch",
      ],
      [
        "idempotency identity mismatch",
        (input: ReturnType<typeof preparationInput>["input"]) => ({
          ...input,
          idempotencyKey: "foreign-idempotency",
        }),
        "preparation_identity_mismatch",
      ],
    ])("CANDIDATE-PACKPUB-PREP-001/002: %s performs no remote write", async (_name, mutate, reason = "approval_missing") => {
      const { input } = preparationInput();
      const { prep } = preparationPorts();
      const commit = vi.fn(prep.pack.commitPublicationBranch);
      const result = await preparePackPublication(mutate(input), {
        ...prep,
        pack: { ...prep.pack, commitPublicationBranch: commit },
      });
      expect(result).toMatchObject({ ok: false, reason });
      expect(commit).not.toHaveBeenCalled();
    });

    it("CANDIDATE-PACKPUB-PREP-002: expired approvals are denied before mutation", async () => {
      const { input } = preparationInput();
      const { prep } = preparationPorts();
      const commit = vi.fn(prep.pack.commitPublicationBranch);
      const approvals = input.approvals.map((approval) => ({
        ...approval,
        expiresAt: "2000-01-01T00:00:00.000Z",
      }));
      await expect(
        preparePackPublication(
          { ...input, approvals },
          { ...prep, pack: { ...prep.pack, commitPublicationBranch: commit } },
        ),
      ).resolves.toMatchObject({
        ok: false,
        reason: "approval_expired",
        remoteWrites: 0,
      });
      expect(commit).not.toHaveBeenCalled();
    });

    it("CANDIDATE-PACKPUB-PREP-003: reused preparation nonce is denied without publication writes", async () => {
      const { input } = preparationInput();
      const { prep } = preparationPorts();
      const commit = vi.fn(prep.pack.commitPublicationBranch);
      const approvals = input.approvals.map((approval) => ({ ...approval, nonce: "same-nonce" }));
      await expect(
        preparePackPublication(
          { ...input, approvals },
          { ...prep, pack: { ...prep.pack, commitPublicationBranch: commit } },
        ),
      ).resolves.toMatchObject({ ok: false, reason: "nonce_replay", remoteWrites: 0 });
      expect(commit).not.toHaveBeenCalled();
    });

    it("CANDIDATE-PACKPUB-PREP-003: cross-nonce substitution is typed by the approval port", async () => {
      const { input } = preparationInput();
      const { prep } = preparationPorts();
      const commit = vi.fn(prep.pack.commitPublicationBranch);
      const consume = vi.fn(async (approval: PackPublicationApproval) =>
        approval.nonce === "foreign-nonce"
          ? ({ status: "mismatch", reason: "approval_binding_mismatch" } as const)
          : ({ status: "attested", value: { mode: "new" } } as const),
      );
      await expect(
        preparePackPublication(
          {
            ...input,
            approvals: input.approvals.map((approval) =>
              approval.mutation === "pack_branch_commit"
                ? { ...approval, nonce: "foreign-nonce" }
                : approval,
            ),
          },
          {
            ...prep,
            approval: {
              consume,
            },
            pack: { ...prep.pack, commitPublicationBranch: commit },
          },
        ),
      ).resolves.toMatchObject({ ok: false, reason: "approval_binding_mismatch" });
      expect(consume).toHaveBeenCalledTimes(1);
      expect(commit).not.toHaveBeenCalled();
    });

    it("CANDIDATE-PACKPUB-PREP-005: PR read-back drift is typed and does not persist a receipt", async () => {
      const { input } = preparationInput();
      const { prep } = preparationPorts();
      const persist = vi.fn();
      const result = await preparePackPublication(input, {
        ...prep,
        receipt: { persist },
        pack: {
          ...prep.pack,
          createPullRequest: async () => ({
            status: "attested",
            value: {
              pullRequest: "42",
              headOid: "8".repeat(40),
              baseOid: input.expectedMainOid,
              treeDigest: input.plan.commitEntries[0]
                ? derivePackPublicationTreeDigest(input.plan)
                : "",
              controlManifestSnapshotDigest: input.plan.controlManifestSnapshotDigest,
            },
          }),
        },
      });
      expect(result).toMatchObject({ ok: false, reason: "preparation_observation_mismatch" });
      expect(persist).not.toHaveBeenCalled();
    });

    it.each([
      ["number", { pullRequest: "not-a-number" }],
      ["base", { baseOid: "f".repeat(40) }],
      ["tree", { treeDigest: `sha256:${"f".repeat(64)}` }],
      ["control manifest", { controlManifestSnapshotDigest: `sha256:${"f".repeat(64)}` }],
    ])("CANDIDATE-PACKPUB-PREP-005/010: %s read-back axis is independently rejected", async (_axis, drift) => {
      const { input } = preparationInput();
      const { prep } = preparationPorts();
      const persist = vi.fn();
      const result = await preparePackPublication(input, {
        ...prep,
        receipt: { persist },
        pack: {
          ...prep.pack,
          createPullRequest: async () => ({
            status: "attested",
            value: {
              pullRequest: "42",
              headOid: "7".repeat(40),
              baseOid: input.expectedMainOid,
              treeDigest: derivePackPublicationTreeDigest(input.plan),
              controlManifestSnapshotDigest: input.plan.controlManifestSnapshotDigest,
              ...drift,
            },
          }),
        },
      });
      expect(result).toMatchObject({
        ok: false,
        reason: "preparation_observation_mismatch",
        remoteWrites: 2,
      });
      expect(persist).not.toHaveBeenCalled();
    });

    it("CANDIDATE-PACKPUB-PREP-006: receipt persistence is no-clobber across a restart race", async () => {
      const { input } = preparationInput();
      const first = preparationPorts();
      const root = await mkdtemp(join(tmpdir(), "ut625-receipt-"));
      const path = join(root, "preparation-receipt.json");
      const store = createPackPublicationPreparationReceiptStore(path);
      try {
        const created = await preparePackPublication(input, {
          ...first.prep,
          durableState: { ...first.prep.durableState, read: async () => [] },
          pack: {
            ...first.prep.pack,
            reconcile: async () => ({
              status: "unavailable" as const,
              reason: "no journal mutation",
            }),
          },
          receipt: store,
        });
        expect(created).toMatchObject({ ok: true, remoteWrites: 2 });
        if (!created.ok) return;
        await store.persist(created.receipt);
        expect(
          (
            await store.read({
              operationId: input.operationId,
              idempotencyKey: input.idempotencyKey,
              stagingPlanDigest: created.receipt.stagingPlanDigest,
              expectedMainOid: input.expectedMainOid,
            })
          )?.receiptDigest,
        ).toBe(created.receipt.receiptDigest);
        const persistedBytes = await readFile(path);
        await expect(store.persist(created.receipt)).resolves.toBeUndefined();
        const changed = { ...created.receipt, pullRequest: "43" };
        await expect(store.persist(changed)).rejects.toThrow("receipt_conflict");
        expect(await readFile(path)).toEqual(persistedBytes);
        expect(await readdir(root)).toEqual(["preparation-receipt.json"]);
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    });

    it("CANDIDATE-PACKPUB-PREP-006/007: restart uses the complete journal and never re-mutates", async () => {
      const { input } = preparationInput();
      const first = preparationPorts();
      const persisted: PackPublicationPreparationReceipt[] = [];
      const persist = async (receipt: PackPublicationPreparationReceipt) => {
        persisted.push(receipt);
      };
      const journal = completePreparationJournal(input);
      const commit = vi.fn(first.prep.pack.commitPublicationBranch);
      const createPullRequest = vi.fn(first.prep.pack.createPullRequest);
      const second = await preparePackPublication(input, {
        ...first.prep,
        durableState: { ...first.prep.durableState, read: async () => journal },
        pack: {
          ...first.prep.pack,
          commitPublicationBranch: commit,
          createPullRequest,
          reconcile: async () => ({
            status: "attested",
            value: {
              branchCommit: "7".repeat(40),
              pullRequest: {
                pullRequest: "42",
                headOid: "7".repeat(40),
                baseOid: input.expectedMainOid,
                treeDigest: derivePackPublicationTreeDigest(input.plan),
                controlManifestSnapshotDigest: input.plan.controlManifestSnapshotDigest,
              },
            },
          }),
        },
        receipt: { persist, read: async () => null },
      });
      expect(second).toMatchObject({
        ok: true,
        status: "prepared",
        remoteWrites: 0,
      });
      expect(commit).not.toHaveBeenCalled();
      expect(createPullRequest).not.toHaveBeenCalled();
      expect(persisted).toHaveLength(1);
    });

    it("CANDIDATE-PACKPUB-PREP-007: journal reconciliation reconstructs without re-mutation", async () => {
      const { input } = preparationInput();
      const { prep } = preparationPorts();
      const events = completePreparationJournal(input);
      const commit = vi.fn(prep.pack.commitPublicationBranch);
      const createPullRequest = vi.fn(prep.pack.createPullRequest);
      const persist = vi.fn();
      const result = await preparePackPublication(input, {
        ...prep,
        durableState: { ...prep.durableState, read: async () => events },
        pack: {
          ...prep.pack,
          commitPublicationBranch: commit,
          createPullRequest,
          reconcile: async () => ({
            status: "attested",
            value: {
              branchCommit: "7".repeat(40),
              pullRequest: {
                pullRequest: "42",
                headOid: "7".repeat(40),
                baseOid: input.expectedMainOid,
                treeDigest: derivePackPublicationTreeDigest(input.plan),
                controlManifestSnapshotDigest: input.plan.controlManifestSnapshotDigest,
              },
            },
          }),
        },
        receipt: { persist },
      });
      expect(result).toMatchObject({ ok: true, status: "prepared", remoteWrites: 0 });
      expect(commit).not.toHaveBeenCalled();
      expect(createPullRequest).not.toHaveBeenCalled();
      expect(persist).toHaveBeenCalledTimes(1);
    });

    it("CANDIDATE-PACKPUB-PREP-007: partial journal cannot be treated as a complete replay", async () => {
      const { input } = preparationInput();
      const { prep } = preparationPorts();
      const partial = completePreparationJournal(input).slice(0, 4);
      const commit = vi.fn(prep.pack.commitPublicationBranch);
      const result = await preparePackPublication(input, {
        ...prep,
        durableState: { ...prep.durableState, read: async () => partial },
        pack: {
          ...prep.pack,
          commitPublicationBranch: commit,
          reconcile: async () => ({
            status: "attested" as const,
            value: {
              branchCommit: "7".repeat(40),
              pullRequest: {
                pullRequest: "42",
                headOid: "7".repeat(40),
                baseOid: input.expectedMainOid,
                treeDigest: derivePackPublicationTreeDigest(input.plan),
                controlManifestSnapshotDigest: input.plan.controlManifestSnapshotDigest,
              },
            },
          }),
        },
        receipt: { persist: vi.fn(), read: async () => null },
      });
      expect(result).toMatchObject({
        ok: false,
        status: "indeterminate",
        reason: "journal_chain_invalid",
        remoteWrites: 0,
      });
      expect(commit).not.toHaveBeenCalled();
    });

    it("CANDIDATE-PACKPUB-PREP-007: complete journal without reconcile port cannot re-mutate", async () => {
      const { input } = preparationInput();
      const { prep } = preparationPorts();
      const commit = vi.fn(prep.pack.commitPublicationBranch);
      const result = await preparePackPublication(input, {
        ...prep,
        durableState: { ...prep.durableState, read: async () => completePreparationJournal(input) },
        pack: { ...prep.pack, commitPublicationBranch: commit },
        receipt: { persist: vi.fn(), read: async () => null },
      });
      expect(result).toMatchObject({
        ok: false,
        status: "indeterminate",
        reason: "reconciliation_unavailable",
        remoteWrites: 0,
      });
      expect(commit).not.toHaveBeenCalled();
    });

    it("CANDIDATE-PACKPUB-PREP-007: receipt persistence failure is indeterminate after exactly two writes", async () => {
      const { input } = preparationInput();
      const { prep } = preparationPorts();
      const result = await preparePackPublication(input, {
        ...prep,
        receipt: {
          persist: async () => {
            throw new Error("no-clobber");
          },
        },
      });
      expect(result).toMatchObject({
        ok: false,
        status: "indeterminate",
        reason: "receipt_persist_failed",
        remoteWrites: 2,
      });
    });

    it("CANDIDATE-PACKPUB-PREP-008: exact receipt replay is read-only and identity drift is denied", async () => {
      const { input } = preparationInput();
      const first = preparationPorts();
      const prepared = await preparePackPublication(input, first.prep);
      if (!prepared.ok) throw new Error(prepared.reason);
      const commit = vi.fn();
      const replay = preparationPorts({
        pack: { ...first.prep.pack, commitPublicationBranch: commit },
        receipt: { persist: vi.fn(), read: async () => prepared.receipt },
      });
      await expect(preparePackPublication(input, replay.prep)).resolves.toMatchObject({
        ok: true,
        status: "prepared",
        remoteWrites: 0,
      });
      expect(commit).not.toHaveBeenCalled();
      await expect(
        preparePackPublication({ ...input, expectedMainOid: "f".repeat(40) }, replay.prep),
      ).resolves.toMatchObject({ ok: false, reason: "preparation_identity_mismatch" });
    });

    it.each([
      [
        "main",
        (input: ReturnType<typeof preparationInput>["input"]) => ({
          ...input,
          expectedMainOid: "f".repeat(40),
        }),
      ],
      [
        "staging",
        (input: ReturnType<typeof preparationInput>["input"]) => ({
          ...input,
          plan: {
            ...input.plan,
            controlManifestSnapshotDigest: `sha256:${"f".repeat(64)}`,
          },
        }),
      ],
      ["PR", (input: ReturnType<typeof preparationInput>["input"]) => input],
    ] as const)("CANDIDATE-PACKPUB-PREP-008: %s identity drift is independently denied", async (axis, mutate) => {
      const { input } = preparationInput();
      const first = preparationPorts();
      const prepared = await preparePackPublication(input, first.prep);
      if (!prepared.ok) throw new Error(prepared.reason);
      const driftedReceipt =
        axis === "PR" ? { ...prepared.receipt, pullRequest: "43" } : prepared.receipt;
      const result = await preparePackPublication(mutate(input), {
        ...first.prep,
        receipt: { persist: vi.fn(), read: async () => driftedReceipt },
      });
      expect(result).toMatchObject({
        ok: false,
        reason: "preparation_identity_mismatch",
        remoteWrites: 0,
      });
    });

    it("CANDIDATE-PACKPUB-PREP-001: control-manifest byte drift is denied before branch write", async () => {
      const { input } = preparationInput();
      const { prep } = preparationPorts();
      const original = input.plan.commitEntries.find((entry) => entry.kind === "control-manifest");
      if (!original) throw new Error("control entry missing");
      const drifted = {
        ...input,
        plan: {
          ...input.plan,
          commitEntries: input.plan.commitEntries.map((entry) =>
            entry === original ? { ...entry, contentDigest: `sha256:${"a".repeat(64)}` } : entry,
          ),
        },
      };
      const commit = vi.fn(prep.pack.commitPublicationBranch);
      await expect(
        preparePackPublication(drifted, {
          ...prep,
          pack: { ...prep.pack, commitPublicationBranch: commit },
        }),
      ).resolves.toMatchObject({ ok: false, reason: "preparation_identity_mismatch" });
      expect(commit).not.toHaveBeenCalled();
    });

    it("CANDIDATE-PACKPUB-PREP-002: cross-operation approval is a typed binding denial", async () => {
      const { input } = preparationInput();
      const { prep } = preparationPorts();
      const approvals = input.approvals.map((approval, index) =>
        index === 0 ? { ...approval, operationId: "foreign-operation" } : approval,
      );
      const commit = vi.fn(prep.pack.commitPublicationBranch);
      const result = await preparePackPublication(
        { ...input, approvals },
        { ...prep, pack: { ...prep.pack, commitPublicationBranch: commit } },
      );
      expect(result).toMatchObject({
        ok: false,
        status: "denied",
        reason: "approval_binding_mismatch",
        remoteWrites: 0,
      });
      expect(commit).not.toHaveBeenCalled();
    });

    it("CANDIDATE-PACKPUB-PREP-004: nonce journal failure denies before mutation", async () => {
      const { input } = preparationInput();
      const { prep } = preparationPorts();
      const commit = vi.fn(prep.pack.commitPublicationBranch);
      const result = await preparePackPublication(input, {
        ...prep,
        durableState: {
          append: async () => {
            throw new Error("journal unavailable");
          },
        },
        pack: { ...prep.pack, commitPublicationBranch: commit },
      });
      expect(result).toMatchObject({
        ok: false,
        status: "indeterminate",
        reason: "journal_persist_failed",
        remoteWrites: 0,
      });
      expect(commit).not.toHaveBeenCalled();
    });
  });
});
