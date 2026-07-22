import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { renderForwardEscapeIssueBody } from "../../src/execution/forward-escape.js";
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
    ["digest", { route_tuple_digest: "f".repeat(64) }],
    [
      "origin",
      { origin: { plan_id: "PLAN-L4-forged", revision: 1, digest: `sha256:${sha("origin")}` } },
    ],
    [
      "reentry",
      { reentry: { target_plan_id: "PLAN-L4-forged", target_revision: 2, phase: "forward_merge" } },
    ],
  ] as const)("U-GEN-015: %s自己申告のroute binding改ざんをtransaction前に拒否する", (_name, patch) => {
    const f = fixture();
    const tampered = { ...f.manifest, ...patch };
    expect(() => f.runner.run(tampered)).toThrow("genesis-adoption-route-tuple-digest-mismatch");
    expect(f.adopt).not.toHaveBeenCalled();
  });

  it("U-GEN-016: originはtrusted blobのPLAN ID/revision/content digestへ意味束縛する", () => {
    const f = fixture();
    const fakeOrigin = {
      plan_id: f.manifest.origin.plan_id,
      revision: 1,
      digest: `sha256:${sha("forged trusted content")}`,
    };
    const route_tuple_digest = routeDigest(fakeOrigin, f.manifest.reentry);
    expect(() => f.runner.run({ ...f.manifest, origin: fakeOrigin, route_tuple_digest })).toThrow(
      "genesis-adoption-origin-source-mismatch",
    );
    expect(f.adopt).not.toHaveBeenCalled();
  });

  it("U-GEN-017: reentryはIssue preimageの正規Forward escape contractへ意味束縛する", () => {
    const f = fixture();
    const fakeReentry = {
      target_plan_id: "PLAN-L4-31",
      target_revision: 3,
      phase: "forward_merge" as const,
    };
    expect(() =>
      f.runner.run({
        ...f.manifest,
        reentry: fakeReentry,
        route_tuple_digest: routeDigest(f.manifest.origin, fakeReentry),
      }),
    ).toThrow("genesis-adoption-issue-route-mismatch");
    expect(f.adopt).not.toHaveBeenCalled();
  });

  it("U-GEN-018: origin/reentry/digestを同時差替えしてもIssue preimage不一致でwrite前fail-closeする", () => {
    const f = fixture();
    const fakeOrigin = { ...f.manifest.origin, plan_id: "PLAN-L4-99" };
    const fakeReentry = { ...f.manifest.reentry, target_plan_id: "PLAN-L4-99" };
    const contract = {
      ...f.manifest.issue.contract,
      origin_asset_id: "PLAN-L4-99",
      reentry_target_asset_id: "PLAN-L4-99",
    };
    expect(() =>
      f.runner.run({
        ...f.manifest,
        origin: fakeOrigin,
        reentry: fakeReentry,
        route_tuple_digest: routeDigest(fakeOrigin, fakeReentry),
        issue: { ...f.manifest.issue, contract },
      }),
    ).toThrow("genesis-adoption-issue-preimage-mismatch");
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

  it("U-GEN-013: local成功後のremote失敗をdurable recovery_requiredとして返す", () => {
    const f = fixture({ projectionStates: ["recovery_required"] });
    expect(f.runner.run(f.manifest)).toMatchObject({
      ok: true,
      replayed: false,
      projection: "recovery_required",
    });
    expect(f.dispatch).toHaveBeenCalledOnce();
  });

  it("U-GEN-014: same-command replayはpendingを再開し一度だけprojectedへ収束する", () => {
    const f = fixture({
      adoptResults: [
        { ok: true, replayed: false, assetId: "plan:legacy:test", revision: 1, issueNumber: 129 },
        { ok: true, replayed: true, assetId: "plan:legacy:test", revision: 1, issueNumber: 129 },
      ],
      projectionStates: ["recovery_required", "projected"],
    });
    expect(f.runner.run(f.manifest)).toMatchObject({ projection: "recovery_required" });
    expect(f.runner.run(f.manifest)).toMatchObject({ replayed: true, projection: "projected" });
    expect(f.dispatch).toHaveBeenCalledTimes(2);
    expect(f.remoteCommentCount()).toBe(1);
  });

  it("U-GEN-014: local command conflictではdispatchせず二重commentを作らない", () => {
    const f = fixture({
      adoptResults: [{ ok: false, ruleId: "genesis-adoption-command-conflict" }],
    });
    expect(f.runner.run(f.manifest)).toEqual({
      ok: false,
      ruleId: "genesis-adoption-command-conflict",
    });
    expect(f.dispatch).not.toHaveBeenCalled();
    expect(f.remoteCommentCount()).toBe(0);
  });

  it("U-GEN-014: durability receipt欠落を回復済みと偽装しない", () => {
    const f = fixture({ durable: false });
    expect(() => f.runner.run(f.manifest)).toThrow("genesis-adoption-projection-not-durable");
  });

  it("U-GEN-014: local receiptをremote直書きせずdurable outbox境界へ渡す", () => {
    const f = fixture();
    expect(f.runner.run(f.manifest)).toEqual({
      ok: true,
      replayed: false,
      assetId: "plan:legacy:test",
      revision: 1,
      issueNumber: 129,
      projection: "projected",
    });
    expect(f.dispatch).toHaveBeenCalledOnce();
    expect(f.remoteCommentCount()).toBe(1);
  });
});

function fixture(
  drift: {
    head?: string;
    repositoryIdentity?: string;
    branch?: string;
    blobOid?: string;
    source?: string;
    durable?: boolean;
    projectionStates?: Array<"recovery_required" | "projected">;
    adoptResults?: Array<
      | { ok: true; replayed: boolean; assetId: string; revision: 1; issueNumber: number }
      | { ok: false; ruleId: string }
    >;
  } = {},
) {
  const value = manifest();
  const adoptResults = drift.adoptResults ?? [
    {
      ok: true as const,
      replayed: false,
      assetId: "plan:legacy:test",
      revision: 1 as const,
      issueNumber: 129,
    },
  ];
  const fallbackAdoption = adoptResults.at(-1);
  if (!fallbackAdoption) throw new Error("fixture-adoption-result-required");
  const adopt = vi.fn(() => adoptResults.shift() ?? fallbackAdoption);
  const projectionStates = drift.projectionStates ?? ["projected"];
  const projected = new Set<string>();
  let remoteComments = 0;
  const dispatch = vi.fn((input: { commandId: string }) => {
    const state = projectionStates.shift() ?? "projected";
    if (state === "projected" && !projected.has(input.commandId)) {
      projected.add(input.commandId);
      remoteComments += 1;
    }
    return { durable: drift.durable ?? true, state };
  });
  return {
    manifest: value,
    adopt,
    dispatch,
    remoteCommentCount: () => remoteComments,
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
      projectionOutbox: { dispatch },
    }),
  };
}

function manifest(): GenesisAdoptionManifest {
  const sourceDigest = sha(source());
  const contract = issueContract();
  const origin = { plan_id: "PLAN-L4-31", revision: 1, digest: `sha256:${sourceDigest}` };
  const reentry = {
    target_plan_id: "PLAN-L4-31",
    target_revision: 2,
    phase: "forward_merge" as const,
  };
  return {
    version: 1,
    command_id: "genesis:issue-129:l4-31",
    repository_identity: "unison-ai-product/UT-TDD_AGENT-HARNESS",
    plan_id: "PLAN-L4-31",
    actor: "genesis:test",
    reason: "trusted HEAD genesis adoption",
    route_tuple_digest: routeDigest(origin, reentry),
    origin,
    reentry,
    recorded_at: "2026-07-22T00:00:00.000Z",
    source: {
      path: "docs/plans/PLAN-L4-31-nfr-verification-foundation-architecture.md",
      commit: "a".repeat(40),
      blob_oid: "b".repeat(40),
      content_digest: sourceDigest,
    },
    issue: {
      number: 129,
      episode_id: "E4-129",
      drive_model: "redesign",
      branch: "work/redesign-planasset-genesis-adoption",
      preimage_digest: sha(renderForwardEscapeIssueBody(contract)),
      contract,
    },
  };
}

function issueContract() {
  return {
    command_id: "redesign:issue-129:l4-31",
    origin_asset_id: "PLAN-L4-31",
    origin_revision_id: "1",
    origin_layer: "L4",
    origin_state: "confirmed",
    escape_reason: "legacy PlanAsset genesis adoption",
    drive_model: "redesign",
    reentry_target_asset_id: "PLAN-L4-31",
    reentry_target_revision_id: "2",
    reentry_target_layer: "L4",
    reentry_target_state: "forward_merge",
    issue_projection: {
      owner: "unison-ai-product",
      repository: "UT-TDD_AGENT-HARNESS",
      title: "Redesign: genesis adoption",
      labels: ["redesign"],
    },
    plan_id: "PLAN-L4-31",
  };
}

function routeDigest(
  origin: GenesisAdoptionManifest["origin"],
  reentry: GenesisAdoptionManifest["reentry"],
): string {
  return sha(
    JSON.stringify({
      origin: { digest: origin.digest, planId: origin.plan_id, revision: origin.revision },
      reentry: {
        phase: reentry.phase,
        targetPlanId: reentry.target_plan_id,
        targetRevision: reentry.target_revision,
      },
      routeMode: "redesign",
      routeSignal: "redesign",
    }),
  );
}

function source(): string {
  return "---\nplan_id: PLAN-L4-31\nlayer: L4\nstatus: draft\n---\n\nlegacy body\n";
}

function sha(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
