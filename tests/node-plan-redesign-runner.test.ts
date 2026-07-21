import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import {
  bindRenderedProjection,
  NodePlanRedesignRunner,
  RedesignReceiptArtifactAssembler,
} from "../src/plan-admission/node-plan-redesign-runner.js";
import {
  assemblePlanRedesignBundleManifest,
  type PlanRedesignAssemblyInput,
} from "../src/plan-admission/plan-redesign-command-assembler.js";
import type { PlanAdmissionRequest } from "../src/plan-admission/policy.js";
import { parseTrackedReceiptProjection } from "../src/plan-admission/tracked-receipt-projection.js";
import {
  type GitCommandPort,
  type TrustedGitBlob,
  TrustedGitBlobResolver,
} from "../src/plan-admission/trusted-git-blob-resolver.js";
import { parseLegacyPlanSource } from "../src/plan-asset/adapters/legacy-plan-inventory.js";

const commit = "a".repeat(40);
const blobOid = "c".repeat(40);
const digest = "d".repeat(64);
const baseSource = source("PLAN-L6-01-origin");

describe("NodePlanRedesignRunner legacy bootstrap git binding", () => {
  it.each([
    ["不存在commit", "trusted-git-commit-not-found"],
    ["不存在path", "trusted-git-source-not-found"],
  ])("%sをDB open前に拒否する", (_label, message) => {
    const openDb = vi.fn();
    const runner = new NodePlanRedesignRunner({
      repoRoot: ".",
      openDb,
      gitResolver: {
        resolve: () => {
          throw new Error(message);
        },
      },
    });
    expect(() => runner.run({ manifest: manifest() })).toThrow(message);
    expect(openDb).not.toHaveBeenCalled();
  });

  it.each([
    ["wrong blob OID", { blobOid: "e".repeat(40) }, "plan-redesign-bootstrap-blob-oid-mismatch"],
    [
      "content mismatch",
      { bytes: Buffer.from(`${baseSource}changed`) },
      "plan-redesign-bootstrap-source-content-mismatch",
    ],
  ])("%sをpublication/DB mutation前に拒否する", (_label, override, message) => {
    const openDb = vi.fn();
    const actual: TrustedGitBlob = {
      commitOid: commit,
      sourcePath: "docs/plans/PLAN-L6-01-origin.md",
      blobOid,
      bytes: Buffer.from(baseSource),
      ...override,
    };
    const runner = new NodePlanRedesignRunner({
      repoRoot: ".",
      openDb,
      gitResolver: { resolve: () => actual },
    });
    expect(() => runner.run({ manifest: manifest() })).toThrow(message);
    expect(openDb).not.toHaveBeenCalled();
  });
});

describe("RedesignReceiptArtifactAssembler", () => {
  it("caller projectionを使わずledger同一receiptをorigin→replacementのPLANとprojectionへ束縛する", () => {
    const assembled = manifest();
    const projectionText = `${JSON.stringify({ schema_version: "ut-tdd.plan-admission-receipts/v1", records: [] }, null, 2)}\n`;
    const projectionTextReader = vi.fn(() => projectionText);
    const artifacts = new RedesignReceiptArtifactAssembler({
      projectionText: projectionTextReader,
    }).assemble({
      manifest: assembled,
      revisions: {
        origin: revisionInput(assembled.origin),
        replacement: revisionInput(assembled.replacement),
      },
    });

    expect(projectionTextReader).toHaveBeenCalledOnce();
    const projection = parseTrackedReceiptProjection(artifacts.projection.content);
    expect(projection.ok).toBe(true);
    if (!projection.ok) throw new Error("projection should parse");
    expect(projection.value.records.map((record) => record.commandId)).toEqual([
      assembled.origin.command_id,
      assembled.replacement.command_id,
    ]);
    expect(bindRenderedProjection(artifacts.projection)).toEqual({
      path: assembled.projection.path,
      contentDigest: hash(artifacts.projection.content),
    });
    expect(bindRenderedProjection(artifacts.projection).contentDigest).not.toBe(
      hash(assembled.projection.content),
    );
    for (const [role, sourceArtifact] of [
      ["origin", artifacts.origin],
      ["replacement", artifacts.replacement],
    ] as const) {
      const revision = assembled[role];
      const receipt = parseLegacyPlanSource(sourceArtifact.content)?.frontmatter
        .admission_receipt as Record<string, unknown> | undefined;
      const projected = projection.value.lookup(revision.command_id);
      expect(receipt?.command_id).toBe(revision.command_id);
      expect(projected?.receiptId).toBe(receipt?.receipt_id);
      expect(projected?.receiptDigest).toBe(receipt?.receipt_digest);
      expect(projected?.binding.contentDigest).toBe(
        (receipt?.binding as Record<string, unknown> | undefined)?.content_digest,
      );
    }
  });
});

describe("TrustedGitBlobResolver", () => {
  it("引数配列だけでcommit:pathを実blob bytesへ解決する", () => {
    const calls: readonly string[][] = [];
    const outputs = [
      Buffer.from(`${commit}\n`),
      Buffer.from(`100644 blob ${blobOid}\tdocs/plans/PLAN-L6-01-origin.md\0`),
      Buffer.from(baseSource),
    ];
    const git: GitCommandPort = { run: vi.fn(() => outputs.shift() as Buffer) };
    const resolved = new TrustedGitBlobResolver(git).resolve(
      commit,
      "docs/plans/PLAN-L6-01-origin.md",
    );
    expect(resolved).toEqual({
      commitOid: commit,
      sourcePath: "docs/plans/PLAN-L6-01-origin.md",
      blobOid,
      bytes: Buffer.from(baseSource),
    });
    expect(git.run).toHaveBeenNthCalledWith(1, ["rev-parse", "--verify", `${commit}^{commit}`]);
    expect(git.run).toHaveBeenNthCalledWith(2, [
      "ls-tree",
      "-z",
      commit,
      "--",
      "docs/plans/PLAN-L6-01-origin.md",
    ]);
    expect(git.run).toHaveBeenNthCalledWith(3, ["cat-file", "blob", blobOid]);
    void calls;
  });

  it("tree entryの返却pathが要求pathと非exactなら拒否する", () => {
    const outputs = [
      Buffer.from(`${commit}\n`),
      Buffer.from(`100644 blob ${blobOid}\tdocs/plans/other.md\0`),
    ];
    const git: GitCommandPort = { run: () => outputs.shift() as Buffer };
    expect(() =>
      new TrustedGitBlobResolver(git).resolve(commit, "docs/plans/PLAN-L6-01-origin.md"),
    ).toThrow("trusted-git-source-path-mismatch");
  });
});

function manifest() {
  const input = fixture();
  const identityInput = JSON.stringify([input.repositoryIdentity, input.origin.planId]);
  return assemblePlanRedesignBundleManifest({
    ...input,
    origin: {
      ...input.origin,
      revisionMode: "legacy_bootstrap",
      bootstrap: {
        repositoryIdentity: input.repositoryIdentity,
        identityAlgorithm: "ut-tdd-plan-legacy-v1",
        identityDigest: hash(identityInput),
        sourceBlobOid: blobOid,
        sourceContent: baseSource,
        sourceContentDigest: hash(baseSource),
        sourceCommit: commit,
      },
    },
  });
}

function fixture(): PlanRedesignAssemblyInput {
  return {
    commandId: "redesign:git-binding",
    repositoryIdentity: "owner/repository",
    sourceCommit: "b".repeat(40),
    actor: "codex",
    occurredAt: "2026-07-21T00:00:00.000Z",
    origin: revision(
      "PLAN-L6-01-origin",
      "plan:asset:origin",
      "docs/plans/PLAN-L6-01-origin.md",
      originAdmission,
    ),
    replacement: revision(
      "PLAN-L6-02-replacement",
      "plan:asset:replacement",
      "docs/plans/PLAN-L6-02-replacement.md",
      replacementAdmission,
    ),
    reentry: { targetPlanId: "PLAN-L6-01-origin", targetRevision: 2, phase: "forward_merge" },
    projection: { path: "projection.json", content: "{}", expected_preimage: { kind: "absent" } },
    pairs: [],
    upstream: [],
  };
}

function revision(
  planId: string,
  assetId: string,
  sourcePath: string,
  admission: PlanAdmissionRequest,
) {
  return {
    assetId,
    planId,
    baseRevision: 1,
    basePayloadDigest: digest,
    sourcePath,
    sourceContent: source(planId),
    admission,
    expectedPreimage: { kind: "absent" as const },
  };
}

const originAdmission: PlanAdmissionRequest = {
  routeSignal: "forward",
  routeMode: "forward",
  kind: "design",
  layer: "L6",
  subDoc: "function-spec",
  drive: "agent",
  branch: "work/forward-origin",
};
const replacementAdmission: PlanAdmissionRequest = {
  routeSignal: "redesign",
  routeMode: "redesign",
  kind: "design",
  layer: "L6",
  subDoc: "function-spec",
  drive: "agent",
  branch: "work/redesign-replacement",
  transitionDirection: "design_to_implementation",
  implementationDisposition: "discarded",
  implementationTarget: { targetPlanId: "PLAN-L7-02-target", targetRevision: 1 },
  supersedes: ["PLAN-L6-01-origin"],
  issue: {
    provider: "github",
    issueId: 102,
    episodeId: "E4-102",
    projectionDigest: `sha256:${digest}`,
  },
  origin: { planId: "PLAN-L6-01-origin", revision: 1, digest },
  reentry: { targetPlanId: "PLAN-L6-01-origin", targetRevision: 2, phase: "forward_merge" },
  escapeReason: "redesign",
};

function source(planId: string): string {
  return `---\nplan_id: ${planId}\ntitle: ${planId}\nkind: design\nlayer: L6\nsub_doc: function-spec\ndrive: agent\nstatus: draft\nagent_slots:\n  - role: se\n    slot_label: primary\ngenerates: []\ndependencies:\n  parent: null\n  requires: []\n  blocks: []\n  references: []\nroute_signal: forward\nroute_mode: forward\n---\nbody\n`;
}
function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function revisionInput(value: ReturnType<typeof manifest>["origin"]) {
  const common = {
    commandId: value.command_id,
    assetId: value.asset_id,
    planId: value.plan_id,
    baseRevision: value.base_revision,
    basePayloadDigest: value.base_payload_digest,
    canonicalPayloadJson: value.canonical_payload_json,
    contentDigest: value.content_digest,
    bodyDigest: value.body_digest,
    sourcePath: value.source_path,
    sourceCommit: value.source_commit,
    actor: value.actor,
    reason: value.reason,
    routeTupleDigest: value.route_tuple_digest,
    certificateId: value.certificate_id,
    occurredAt: value.occurred_at,
    sourceContent: value.source_content,
  };
  if (value.revision_mode === "append") return common;
  if (!value.bootstrap) throw new Error("bootstrap missing");
  const { assetId: _assetId, basePayloadDigest: _basePayloadDigest, ...rest } = common;
  return {
    ...rest,
    repositoryIdentity: value.bootstrap.repository_identity,
    identityAlgorithm: value.bootstrap.identity_algorithm,
    identityInputJson: value.bootstrap.identity_input_json,
    identityDigest: value.bootstrap.identity_digest,
    baseCanonicalPayloadJson: value.bootstrap.base_canonical_payload_json,
    baseCanonicalPayloadDigest: value.bootstrap.base_canonical_payload_digest,
    baseBodyDigest: value.bootstrap.base_body_digest,
    baseSourcePath: value.bootstrap.base_source_path,
    baseSourceCommit: value.bootstrap.base_source_commit,
    baseSourceBlobOid: value.bootstrap.base_source_blob_oid,
    baseSourceContent: value.bootstrap.base_source_content,
    baseSourceContentDigest: value.bootstrap.base_source_content_digest,
  };
}
