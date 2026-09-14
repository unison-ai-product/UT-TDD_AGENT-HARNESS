import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  createAtomicReceiptPort,
  createExactRefLeasePort,
  createFakeProcessRunnerPort,
  createGithubPublicationReadPort,
  type ProcessResult,
  type PublicationAuthority,
  validatePublicationAuthority,
} from "../src/setup/pack-publication-production-ports.ts";

const expected = "1111111111111111111111111111111111111111";
const reviewed = "2222222222222222222222222222222222222222";
const tree = "3333333333333333333333333333333333333333";
const tagObject = "4444444444444444444444444444444444444444";
const blob = "aed2973e4b8a7ff1b30ff5c4751e5a2b38989e74";

const exited = (stdout: string): ProcessResult => ({
  status: "exited",
  exitCode: 0,
  stdout,
  stderr: "",
});

const casAuthority = (overrides: Partial<PublicationAuthority> = {}): PublicationAuthority => ({
  phase: "publication_cas",
  repository: "unison-ai-product/UT-TDD_AGENT-HARNESS-Pack",
  installationId: "cas-installation",
  tokenLifecycle: "fresh",
  bypassRuleset: true,
  permissions: { contents: "write", pullRequests: "none", workflows: "none" },
  ...overrides,
});

const prepAuthority = (
  workflowDelta: boolean,
  overrides: Partial<PublicationAuthority> = {},
): PublicationAuthority => ({
  phase: "preparation",
  repository: "unison-ai-product/UT-TDD_AGENT-HARNESS-Pack",
  installationId: "prep-installation",
  tokenLifecycle: "fresh",
  bypassRuleset: false,
  permissions: {
    contents: "write",
    pullRequests: "write",
    workflows: workflowDelta ? "write" : "none",
  },
  ...overrides,
});

const lease = (authority = casAuthority()) => ({
  repository: "unison-ai-product/UT-TDD_AGENT-HARNESS-Pack",
  targetRef: "refs/heads/main" as const,
  expectedMainOid: expected,
  reviewedHeadOid: reviewed,
  authority,
});

const tempRoots: string[] = [];
afterEach(() => {
  for (const root of tempRoots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("PLAN-L7-565 PR-1 production ports", () => {
  it("CANDIDATE-PACKPUB-PORT-013: applies an exact lease with fixed argv and post-read", () => {
    const runner = createFakeProcessRunnerPort((request) =>
      request.argv[0] === "push"
        ? exited(`* refs/heads/main:refs/heads/main [updated]\n`)
        : exited(`${reviewed}\trefs/heads/main\n`),
    );
    const result = createExactRefLeasePort({ runner }).applyReviewedHeadWithLease(lease());
    expect(result).toEqual({
      status: "attested",
      value: {
        targetRef: "refs/heads/main",
        expectedMainOid: expected,
        reviewedHeadOid: reviewed,
        actualUpdateStatus: "updated",
        postReadOid: reviewed,
      },
    });
    expect(runner.calls.map((call) => call.argv)).toEqual([
      [
        "push",
        "--porcelain",
        "origin",
        `${reviewed}:refs/heads/main`,
        `--force-with-lease=refs/heads/main:${expected}`,
      ],
      ["ls-remote", "origin", "refs/heads/main"],
    ]);
  });

  it("CANDIDATE-PACKPUB-CAS-012: rejects up-to-date and lease failure as non-success", () => {
    const upToDate = createFakeProcessRunnerPort(() =>
      exited("= refs/heads/main:refs/heads/main [up to date]\n"),
    );
    expect(
      createExactRefLeasePort({ runner: upToDate }).applyReviewedHeadWithLease(lease()),
    ).toEqual({
      status: "mismatch",
      reason: "cas_not_applied_by_operation",
    });

    const rejected = createFakeProcessRunnerPort(() => ({
      status: "failed",
      exitCode: 1,
      stdout: "",
      stderr: "[rejected] (stale info)",
    }));
    expect(
      createExactRefLeasePort({ runner: rejected }).applyReviewedHeadWithLease(lease()),
    ).toEqual({
      status: "mismatch",
      reason: "lease_rejected",
    });
  });

  it("CANDIDATE-PACKPUB-CAS-003: refuses identity drift and malformed lease inputs before push", () => {
    const runner = createFakeProcessRunnerPort(() => exited("unexpected"));
    const port = createExactRefLeasePort({ runner });
    expect(port.applyReviewedHeadWithLease({ ...lease(), repository: "other/repository" })).toEqual(
      {
        status: "mismatch",
        reason: "repository_identity_mismatch",
      },
    );
    expect(port.applyReviewedHeadWithLease({ ...lease(), expectedMainOid: reviewed })).toEqual({
      status: "mismatch",
      reason: "lease_head_equals_expected",
    });
    expect(runner.calls).toHaveLength(0);
  });

  it("CANDIDATE-PACKPUB-CAS-005: treats unknown push response and post-read drift fail-closed", () => {
    const unknown = createFakeProcessRunnerPort(() => ({
      status: "failed",
      exitCode: null,
      stdout: "",
      stderr: "network reset",
    }));
    expect(
      createExactRefLeasePort({ runner: unknown }).applyReviewedHeadWithLease(lease()),
    ).toEqual({
      status: "indeterminate",
      reason: "lease_response_unknown",
    });

    const drift = createFakeProcessRunnerPort((request) =>
      request.argv[0] === "push"
        ? exited("* refs/heads/main:refs/heads/main [updated]\n")
        : exited(`${expected} refs/heads/main\n`),
    );
    expect(createExactRefLeasePort({ runner: drift }).applyReviewedHeadWithLease(lease())).toEqual({
      status: "mismatch",
      reason: "post_read_oid_mismatch",
    });
  });

  it("CANDIDATE-PACKPUB-CAS-013 / -016: enforces preparation and CAS authority permissions independently", () => {
    expect(
      validatePublicationAuthority({ authority: prepAuthority(false), workflowDelta: false }),
    ).toEqual({
      status: "attested",
      value: { phase: "preparation" },
    });
    expect(
      validatePublicationAuthority({ authority: prepAuthority(true), workflowDelta: true }),
    ).toEqual({
      status: "attested",
      value: { phase: "preparation" },
    });
    expect(
      validatePublicationAuthority({
        authority: prepAuthority(false, {
          permissions: { contents: "write", pullRequests: "write", workflows: "write" },
        }),
        workflowDelta: false,
      }),
    ).toEqual({ status: "mismatch", reason: "authority_overprivileged" });
    expect(
      validatePublicationAuthority({
        authority: prepAuthority(true, {
          permissions: { contents: "write", pullRequests: "write", workflows: "none" },
        }),
        workflowDelta: true,
      }),
    ).toEqual({ status: "mismatch", reason: "authority_insufficient" });
    expect(
      validatePublicationAuthority({
        authority: casAuthority({
          permissions: { contents: "write", pullRequests: "write", workflows: "none" },
        }),
        workflowDelta: false,
      }),
    ).toEqual({ status: "mismatch", reason: "authority_mismatch" });
  });

  it("CANDIDATE-PACKPUB-PORT-014: observes documented commit/tree/blob/tag API shapes only", () => {
    const bytes = new Uint8Array([1, 2, 3]);
    const runner = createFakeProcessRunnerPort((request) => {
      const path = request.argv[1] ?? "";
      if (path.includes(`/commits/${reviewed}`))
        return exited(JSON.stringify({ sha: reviewed, commit: { tree: { sha: tree } } }));
      if (path.includes(`/git/trees/${tree}`))
        return exited(
          JSON.stringify({
            sha: tree,
            tree: [{ path: "release/manifest.yaml", mode: "100644", type: "blob", sha: blob }],
          }),
        );
      if (path.includes(`/git/blobs/${blob}`))
        return exited(
          JSON.stringify({
            sha: blob,
            encoding: "base64",
            content: Buffer.from(bytes).toString("base64"),
          }),
        );
      if (path.includes("git/ref/tags/v0.2.0-canary.1"))
        return exited(
          JSON.stringify({
            ref: "refs/tags/v0.2.0-canary.1",
            object: { type: "tag", sha: tagObject },
          }),
        );
      if (path.includes(`/git/tags/${tagObject}`))
        return exited(
          JSON.stringify({ tag: "v0.2.0-canary.1", object: { type: "commit", sha: reviewed } }),
        );
      return exited("{}");
    });
    const port = createGithubPublicationReadPort({ runner });
    expect(port.observeCommit(reviewed)).toEqual({
      status: "attested",
      value: { commitOid: reviewed, treeOid: tree },
    });
    expect(port.observeTree(tree)).toEqual({
      status: "attested",
      value: [{ path: "release/manifest.yaml", mode: "100644", type: "blob", oid: blob }],
    });
    expect(port.observeBlob(blob)).toEqual({ status: "attested", value: { blobOid: blob, bytes } });
    expect(port.observeAnnotatedTag("v0.2.0-canary.1")).toEqual({
      status: "attested",
      value: { name: "v0.2.0-canary.1", tagObjectOid: tagObject, targetCommitOid: reviewed },
    });
  });

  it("CANDIDATE-PACKPUB-PORT-014: rejects fake-only commit metadata and tag-as-commit shortcuts", () => {
    const runner = createFakeProcessRunnerPort((request) => {
      const path = request.argv[1] ?? "";
      if (path.includes(`/commits/${reviewed}`))
        return exited(JSON.stringify({ sha: reviewed, sourceRevision: "fake", treeDigest: tree }));
      if (path.includes("git/ref/tags"))
        return exited(JSON.stringify({ object: { type: "commit", sha: reviewed } }));
      return exited("{}");
    });
    const port = createGithubPublicationReadPort({ runner });
    expect(port.observeCommit(reviewed)).toEqual({
      status: "mismatch",
      reason: "commit_observation_invalid",
    });
    expect(port.observeAnnotatedTag("v0.2.0-canary.1")).toEqual({
      status: "mismatch",
      reason: "tag_ref_invalid",
    });
    expect(runner.calls.map((call) => call.argv)).not.toContainEqual([
      "api",
      expect.stringContaining(`/git/commits/${reviewed}`),
    ]);
  });

  it("CANDIDATE-PACKPUB-CAS-009: publishes receipts atomically without clobbering a different result", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-packpub-receipt-"));
    tempRoots.push(root);
    const path = join(root, "publication", "receipt.json");
    const port = createAtomicReceiptPort({ path });
    expect(port.persist('{"receipt":"new"}')).toEqual({ status: "attested", value: "created" });
    expect(readFileSync(path, "utf8")).toBe('{"receipt":"new"}');
    expect(port.persist('{"receipt":"new"}')).toEqual({ status: "attested", value: "replayed" });
    expect(port.persist('{"receipt":"other"}')).toEqual({
      status: "mismatch",
      reason: "receipt_conflict",
    });
  });
});
