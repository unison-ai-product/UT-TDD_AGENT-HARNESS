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

const sourceRevision = "a".repeat(40);
const artifactSetDigest = `sha256:${"b".repeat(64)}`;
const content = Buffer.from("abc");
const digest = (value: Uint8Array | string) =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`;
const entry: SealedPublicationEntry = {
  sourcePath: "src/cli.ts",
  destinationPath: "bin/ut-tdd.js",
  mode: "100755",
  size: content.length,
  contentDigest: digest(content),
  content,
};
const releaseId = (): string =>
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

function manifest(): Record<string, unknown> {
  const artifact = {
    sourcePath: entry.sourcePath,
    destinationPath: entry.destinationPath,
    mode: entry.mode,
    size: entry.size,
    contentDigest: entry.contentDigest,
  };
  const artifactInventoryDigest = deriveArtifactInventoryDigest([artifact]);
  const assets = derivePackPublicationAssets({
    release: {
      releaseId: releaseId(),
      materializerVersion: "v2",
      artifactSourceCommit: sourceRevision,
      artifactSetDigest,
      artifactInventoryDigest,
      releaseAssetInventoryDigest: `sha256:${"c".repeat(64)}`,
      releaseRecordDigest: `sha256:${"d".repeat(64)}`,
      artifacts: [artifact],
    },
    entries: [entry],
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
        materializerVersion: "v2",
        artifactSourceCommit: sourceRevision,
        artifactSetDigest,
        artifactInventoryDigest,
        releaseAssetInventoryDigest,
        releaseRecordDigest,
        artifacts: [artifact],
      },
    },
    channels: { canary: releaseId(), stable: releaseId() },
    channelOrder: ["canary", "stable"],
  };
}

function plan() {
  const raw = manifest();
  const result = buildPackPublicationStagingPlan({
    manifestInput: raw,
    releaseId: releaseId(),
    controlManifestBytes: Buffer.from(stringify(raw), "utf8"),
    entries: [entry],
  });
  if (!result.ok) throw new Error(result.error);
  return result.plan;
}

function intentInput(): PackPublicationIntentInput {
  const p = plan();
  const remote = {
    repository: "unison-ai-product/UT-TDD_AGENT-HARNESS-Pack",
    publicationBranch: "publication/operation-1",
    expectedMainSha: "1".repeat(40),
    expectedMainStateDigest: `sha256:${"2".repeat(64)}`,
    expectedPointerObjectDigest: `sha256:${"3".repeat(64)}`,
    beforeControlManifestSnapshotDigest: p.controlManifestSnapshotDigest,
    allowedMergeMode: "pull_request_cas" as const,
    derivationRule: "entries-and-sidecar-v2" as const,
  };
  const seed = {
    plan: p,
    operationId: "op-1",
    idempotencyKey: "idem-1",
    remote,
    tagName: "v0.1.4-canary",
  };
  const intentDigest = derivePackPublicationIntentDigest(seed);
  const transitions = [
    "planned",
    "pack_commit",
    "release_draft",
    "assets",
    "tag",
    "release_visible",
    "canary",
  ] as const;
  const approvals: PackPublicationApproval[] = transitions.map((transition) => ({
    transition,
    operationId: "op-1",
    nonce: `nonce-${transition}`,
    approver: "human@example.com",
    expiresAt: "2099-01-01T00:00:00.000Z",
    intentDigest,
    approvalStateDigest: `sha256:${"4".repeat(64)}`,
    idempotencyKey: "idem-1",
  }));
  return { ...seed, approvals };
}

function ports(overrides: Partial<PackPublicationPorts> = {}): PackPublicationPorts {
  const unavailable = <_T>() => ({ status: "unavailable" as const, reason: "unused" });
  return {
    approval: { consume: async () => ({ status: "attested", value: { consumed: true as const } }) },
    durableState: { append: vi.fn(), digest: () => `sha256:${"5".repeat(64)}` },
    pack: {
      observeBefore: async () => ({
        status: "attested",
        value: {
          mainSha: "1".repeat(40),
          mainStateDigest: `sha256:${"2".repeat(64)}`,
          pointerObjectDigest: `sha256:${"3".repeat(64)}`,
          controlManifestSnapshotDigest: plan().controlManifestSnapshotDigest,
          tagExists: false,
        },
      }),
      commitPublicationBranch: unavailable,
      createPullRequest: unavailable,
      mergePullRequestCas: unavailable,
      observeReleaseCommit: unavailable,
    },
    release: {
      createDraft: unavailable,
      observeDraft: unavailable,
      uploadAsset: unavailable,
      observeAsset: unavailable,
    },
    tag: {
      observe: async () => ({ status: "mismatch", reason: "not_found" }),
      createAnnotatedCas: unavailable,
    },
    visibility: { makeVisible: unavailable, observe: unavailable },
    canary: {
      observeBefore: async () => ({
        status: "attested",
        value: {
          pointerObjectDigest: `sha256:${"3".repeat(64)}`,
          controlManifestSnapshotDigest: plan().controlManifestSnapshotDigest,
          mainSha: "1".repeat(40),
          mainStateDigest: `sha256:${"2".repeat(64)}`,
        },
      }),
      appendCas: unavailable,
    },
    auditor: { attest: unavailable },
    receipt: { persist: vi.fn() },
    ...overrides,
  } as PackPublicationPorts;
}

describe("Pack publication adapter pure domain and fail-close", () => {
  it("U-PACKPUB-REMOTE-001: seals tree and approvals without a precomputed commit SHA", () => {
    const input = intentInput();
    const result = sealPackPublicationIntent(input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.intent.expectedTreeDigest).toBe(derivePackPublicationTreeDigest(input.plan));
    expect(result.intent).not.toHaveProperty("expectedCommitSha");
    expect(Object.isFrozen(result.intent)).toBe(true);
  });

  it("U-PACKPUB-REMOTE-002: initial main/pointer drift denies before every remote mutation", async () => {
    const input = intentInput();
    const sealed = sealPackPublicationIntent(input);
    if (!sealed.ok) throw new Error(sealed.error);
    const commit = vi.fn();
    const result = await publishPackCanary(
      sealed.intent,
      ports({
        pack: {
          ...ports().pack,
          observeBefore: async () => ({
            status: "attested",
            value: {
              mainSha: "9".repeat(40),
              mainStateDigest: `sha256:${"2".repeat(64)}`,
              pointerObjectDigest: `sha256:${"3".repeat(64)}`,
              controlManifestSnapshotDigest: sealed.intent.controlManifestSnapshotDigest,
              tagExists: false,
            },
          }),
          commitPublicationBranch: commit,
        },
      }),
    );
    expect(result).toEqual(expect.objectContaining({ status: "denied", remoteWrites: 0 }));
    expect(commit).not.toHaveBeenCalled();
  });

  it("U-PACKPUB-REMOTE-003: nonce/intent binding is rejected before sealing", () => {
    const input = intentInput();
    const approvals =
      input.approvals?.map((approval, index) =>
        index === 0 ? { ...approval, intentDigest: `sha256:${"f".repeat(64)}` } : approval,
      ) ?? [];
    expect(sealPackPublicationIntent({ ...input, approvals })).toEqual({
      ok: false,
      error: "approval_binding_mismatch",
    });
  });
});
