import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { NodePlanRedesignRunner } from "../src/plan-admission/node-plan-redesign-runner.js";
import {
  assemblePlanRedesignBundleManifest,
  type PlanRedesignAssemblyInput,
} from "../src/plan-admission/plan-redesign-command-assembler.js";
import type { PlanAdmissionRequest } from "../src/plan-admission/policy.js";
import {
  type GitCommandPort,
  type TrustedGitBlob,
  TrustedGitBlobResolver,
} from "../src/plan-admission/trusted-git-blob-resolver.js";

const commit = "a".repeat(40);
const blobOid = "c".repeat(40);
const digest = "d".repeat(64);
const baseSource = source("PLAN-L6-1");

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
      sourcePath: "docs/plans/PLAN-L6-1.md",
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

describe("TrustedGitBlobResolver", () => {
  it("引数配列だけでcommit:pathを実blob bytesへ解決する", () => {
    const calls: readonly string[][] = [];
    const outputs = [
      Buffer.from(`${commit}\n`),
      Buffer.from(`100644 blob ${blobOid}\tdocs/plans/PLAN-L6-1.md\0`),
      Buffer.from(baseSource),
    ];
    const git: GitCommandPort = { run: vi.fn(() => outputs.shift() as Buffer) };
    const resolved = new TrustedGitBlobResolver(git).resolve(commit, "docs/plans/PLAN-L6-1.md");
    expect(resolved).toEqual({
      commitOid: commit,
      sourcePath: "docs/plans/PLAN-L6-1.md",
      blobOid,
      bytes: Buffer.from(baseSource),
    });
    expect(git.run).toHaveBeenNthCalledWith(1, ["rev-parse", "--verify", `${commit}^{commit}`]);
    expect(git.run).toHaveBeenNthCalledWith(2, [
      "ls-tree",
      "-z",
      commit,
      "--",
      "docs/plans/PLAN-L6-1.md",
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
      new TrustedGitBlobResolver(git).resolve(commit, "docs/plans/PLAN-L6-1.md"),
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
    origin: revision("PLAN-L6-1", "asset:origin", "docs/plans/PLAN-L6-1.md", originAdmission),
    replacement: revision(
      "PLAN-L6-2",
      "asset:replacement",
      "docs/plans/PLAN-L6-2.md",
      replacementAdmission,
    ),
    reentry: { targetPlanId: "PLAN-L6-1", targetRevision: 2, phase: "forward_merge" },
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
  drive: "agent",
  branch: "work/origin",
};
const replacementAdmission: PlanAdmissionRequest = {
  routeSignal: "redesign",
  routeMode: "redesign",
  kind: "design",
  layer: "L6",
  drive: "agent",
  branch: "work/replacement",
  transitionDirection: "design_to_implementation",
  implementationDisposition: "discarded",
  implementationTarget: { targetPlanId: "PLAN-L7-2", targetRevision: 1 },
  supersedes: ["PLAN-L6-1"],
  issue: { provider: "github", issueId: 102, episodeId: "E4-102", projectionDigest: digest },
  origin: { planId: "PLAN-L6-1", revision: 1, digest },
  reentry: { targetPlanId: "PLAN-L6-1", targetRevision: 2, phase: "forward_merge" },
  escapeReason: "redesign",
};

function source(planId: string): string {
  return `---\nplan_id: ${planId}\nkind: design\nlayer: L6\ndrive: agent\nroute_signal: recovery\nroute_mode: recovery\n---\nbody\n`;
}
function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
