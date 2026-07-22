import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import {
  type GenesisAdoptionManifest,
  NodeGenesisAdoptionRunner,
  parseGenesisAdoptionManifest,
} from "../../src/plan-asset/application/node-genesis-adoption-runner.js";

describe("genesis adoption strict manifest", () => {
  it("U-GEN-008: strict v1 manifestだけを受理し未知keyをfail-closeする", () => {
    expect(parseGenesisAdoptionManifest(manifest())).toEqual(manifest());
    expect(() => parseGenesisAdoptionManifest({ ...manifest(), unbound: "claim" })).toThrow(
      "genesis-adoption-manifest-invalid",
    );
    expect(() =>
      parseGenesisAdoptionManifest({
        ...manifest(),
        issue: { ...manifest().issue, drive_model: "reverse" },
      }),
    ).toThrow("genesis-adoption-manifest-invalid");
  });
});

describe("NodeGenesisAdoptionRunner", () => {
  it("U-GEN-009: trusted HEADのrepo/branch/blob/contentを検証してlocal transactionへ正規入力を渡す", () => {
    const f = fixture();

    expect(f.runner.run(f.manifest)).toMatchObject({ ok: true, replayed: false });
    expect(f.adopt).toHaveBeenCalledOnce();
    expect(f.adopt).toHaveBeenCalledWith(
      expect.objectContaining({
        repositoryIdentity: f.manifest.repository_identity,
        sourceCommit: f.manifest.source.commit,
        sourceBlobOid: f.manifest.source.blob_oid,
        sourceContentDigest: f.manifest.source.content_digest,
        canonicalPayloadJson: '{"layer":"L4","plan_id":"PLAN-L4-31","status":"draft"}',
        bodyDigest: sha("\nlegacy body\n"),
      }),
    );
  });

  it("U-GEN-010: manifest source commitが現在HEADでなければtransaction前に拒否する", () => {
    const f = fixture({ head: "e".repeat(40) });
    expect(() => f.runner.run(f.manifest)).toThrow("genesis-adoption-head-drift");
    expect(f.adopt).not.toHaveBeenCalled();
  });

  it("U-GEN-011: tracked project identityとmanifest repoが異なれば拒否する", () => {
    const f = fixture({ repositoryIdentity: "foreign/repository" });
    expect(() => f.runner.run(f.manifest)).toThrow("genesis-adoption-repository-mismatch");
    expect(f.adopt).not.toHaveBeenCalled();
  });

  it("U-GEN-012: 現在branchとIssue custody branchが異なれば拒否する", () => {
    const f = fixture({ branch: "work/redesign-other" });
    expect(() => f.runner.run(f.manifest)).toThrow("genesis-adoption-branch-mismatch");
    expect(f.adopt).not.toHaveBeenCalled();
  });

  it.each([
    ["blob", { blobOid: "f".repeat(40) }, "genesis-adoption-source-blob-drift"],
    [
      "content",
      { source: source().replace("legacy body", "mutated body") },
      "genesis-adoption-source-content-drift",
    ],
  ] as const)("U-GEN-013: stale %s bindingをtransaction前に拒否する", (_name, drift, rule) => {
    const f = fixture(drift);
    expect(() => f.runner.run(f.manifest)).toThrow(rule);
    expect(f.adopt).not.toHaveBeenCalled();
  });

  it("U-GEN-014: remote GitHub投影をrunner内で実行せずlocal receiptをoutbox境界へ返す", () => {
    const f = fixture();
    expect(f.runner.run(f.manifest)).toEqual({
      ok: true,
      replayed: false,
      assetId: "plan:legacy:test",
      revision: 1,
      issueNumber: 129,
    });
    expect(f.remote).not.toHaveBeenCalled();
  });
});

function fixture(
  drift: {
    head?: string;
    repositoryIdentity?: string;
    branch?: string;
    blobOid?: string;
    source?: string;
  } = {},
) {
  const value = manifest();
  const adopt = vi.fn(() => ({
    ok: true as const,
    replayed: false,
    assetId: "plan:legacy:test",
    revision: 1 as const,
    issueNumber: 129,
  }));
  const remote = vi.fn();
  return {
    manifest: value,
    adopt,
    remote,
    runner: new NodeGenesisAdoptionRunner({
      head: () => drift.head ?? value.source.commit,
      branch: () => drift.branch ?? value.issue.branch,
      repositoryIdentity: () => drift.repositoryIdentity ?? value.repository_identity,
      resolveBlob: () => ({
        commitOid: value.source.commit,
        sourcePath: value.source.path,
        blobOid: drift.blobOid ?? value.source.blob_oid,
        bytes: Buffer.from(drift.source ?? source()),
      }),
      transaction: { adopt },
    }),
  };
}

function manifest(): GenesisAdoptionManifest {
  return {
    version: 1,
    command_id: "genesis:issue-129:l4-31",
    repository_identity: "unison-ai-product/UT-TDD_AGENT-HARNESS",
    plan_id: "PLAN-L4-31",
    actor: "genesis:test",
    reason: "trusted HEAD genesis adoption",
    route_tuple_digest: sha("redesign|forward_merge|PLAN-L4-31"),
    recorded_at: "2026-07-22T00:00:00.000Z",
    source: {
      path: "docs/plans/PLAN-L4-31-nfr-verification-foundation-architecture.md",
      commit: "a".repeat(40),
      blob_oid: "b".repeat(40),
      content_digest: sha(source()),
    },
    issue: {
      number: 129,
      episode_id: "E4-129",
      drive_model: "redesign",
      branch: "work/redesign-planasset-genesis-adoption",
      preimage_digest: sha("issue-129-preimage"),
    },
  };
}

function source(): string {
  return "---\nplan_id: PLAN-L4-31\nlayer: L4\nstatus: draft\n---\n\nlegacy body\n";
}

function sha(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
