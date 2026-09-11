import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  type ApprovalCommitment,
  attestGhPublicationIdentity,
  createFakeProcessRunnerPort,
  createFileApprovalPort,
  createFilePublicationJournalPort,
  createFilePublicationReceiptPort,
  createPackPublicationProductionPorts,
  type ProcessResult,
} from "../src/setup/pack-publication-production-ports.ts";

const sha = (value: string) => createHash("sha256").update(value).digest("hex");
const commit = (letter: string) => letter.repeat(40);
const result = (value: unknown): ProcessResult => ({
  status: "exited",
  exitCode: 0,
  stdout: JSON.stringify(value),
  stderr: "",
});

function ghRunner() {
  return createFakeProcessRunnerPort((request) => {
    const path = request.argv.join(" ");
    if (path.includes("git/blobs")) return result({ sha: commit("a") });
    if (path.includes("git/trees")) return result({ sha: commit("b"), tree: [] });
    if (path.includes("git/commits"))
      return result({ sha: commit("c"), commit: { tree: { sha: commit("b") } } });
    if (path.includes("git/refs") || path.includes("pulls"))
      return result({ number: 7, sha: commit("c"), merge_commit_sha: commit("c") });
    if (path.includes("branches/")) return result({ commit: { sha: commit("1") } });
    if (path.includes("contents/"))
      return result({ content: Buffer.from("content").toString("base64"), encoding: "base64" });
    if (path.includes("git/ref/tags"))
      return { status: "failed", exitCode: 1, stdout: "", stderr: "" };
    if (path.includes("releases"))
      return result({
        id: 8,
        tag_name: "v0.2.0-canary.1",
        target_commitish: commit("c"),
        draft: true,
      });
    return result({});
  });
}

function approvalFixture(root: string) {
  const journal = createFilePublicationJournalPort({
    root: join(root, "publication"),
    operationId: "op-1",
  });
  const nonce = "nonce-1";
  const approval = {
    transition: "planned" as const,
    mutation: "planned" as const,
    operationId: "op-1",
    nonce,
    approver: "release-owner",
    expiresAt: "2099-01-01T00:00:00Z",
    intentDigest: `sha256:${"1".repeat(64)}`,
    approvalStateDigest: journal.digest(),
    idempotencyKey: "idem-1",
  };
  const commitment: ApprovalCommitment = {
    schema_version: "ut-tdd.pack-approval-commitment/v1",
    operationId: "op-1",
    releaseId: "release-1",
    tagName: "v0.2.0-canary.1",
    intentDigest: approval.intentDigest,
    idempotencyKey: approval.idempotencyKey,
    approver: approval.approver,
    expiresAt: approval.expiresAt,
    mutations: { planned: { nonce_sha256: sha(nonce) } },
  };
  const dir = join(root, "approvals", "op-1");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "planned.planned.json"), `${JSON.stringify(approval)}\n`);
  return { journal, approval, commitment };
}

describe("PLAN-L7-532 PR-1 production ports", () => {
  it("CANDIDATE-PACKPUB-005-A / -I / -K: uses an argv array and fake runner only", async () => {
    const runner = ghRunner();
    const ports = createPackPublicationProductionPorts({ runner, operationId: "op-1" });
    const observed = await ports.pack.commitPublicationBranch({
      repository: "unison-ai-product/UT-TDD_AGENT-HARNESS-Pack",
      branch: "publication/op-1",
      entries: [
        {
          path: "package.json",
          mode: "100644",
          size: 3,
          contentDigest: `sha256:${"1".repeat(64)}`,
          kind: "artifact",
          bytes: Buffer.from("abc"),
        },
      ],
    });
    expect(observed).toMatchObject({ status: "attested" });
    expect(runner.calls.length).toBe(4);
    expect(runner.calls.every((call) => call.argv[0] === "api")).toBe(true);
    expect(runner.calls.some((call) => call.argv.includes("sh") || call.argv.includes("cmd"))).toBe(
      false,
    );
  });

  it("CANDIDATE-PACKPUB-005-B: fails closed on auth/repository/main identity drift", () => {
    const runner = createFakeProcessRunnerPort((request) => {
      if (request.argv[0] === "auth")
        return {
          status: "exited",
          exitCode: 0,
          stdout: "Logged in to github.com account release-owner",
          stderr: "",
        };
      if (request.argv[0] === "repo") return result({ nameWithOwner: "foreign/repo" });
      return result({ commit: { sha: commit("1") } });
    });
    const observed = attestGhPublicationIdentity({ runner, expectedMainSha: commit("1") });
    expect(observed).toEqual({ status: "mismatch", reason: "repository_identity_mismatch" });
    expect(runner.calls).toHaveLength(2);
  });

  it("CANDIDATE-PACKPUB-005-C / -D / -P / -Q / -R: binds and consumes the committed approval once", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-packpub-"));
    const fixture = approvalFixture(root);
    const approvalPort = createFileApprovalPort({
      root: join(root, "approvals"),
      operationId: "op-1",
      commitment: fixture.commitment,
      durableState: fixture.journal,
    });
    expect(approvalPort.consume(fixture.approval)).toEqual({
      status: "attested",
      value: { mode: "new" },
    });
    expect(approvalPort.consume(fixture.approval)).toEqual({
      status: "attested",
      value: { mode: "reconcile" },
    });
    expect(approvalPort.consume({ ...fixture.approval, nonce: "wrong" })).toEqual({
      status: "mismatch",
      reason: "approval_commitment_mismatch",
    });
    expect(JSON.stringify(fixture.commitment)).not.toContain(fixture.approval.nonce);
  });

  it("CANDIDATE-PACKPUB-005-E / -F / -G: durable failures are observable and never success", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-packpub-"));
    const journal = createFilePublicationJournalPort({
      root,
      operationId: "op-1",
      beforeAppend: () => {
        throw new Error("injected");
      },
    });
    expect(() =>
      journal.append({
        transition: "planned",
        mutation: "planned",
        kind: "mutation_intent",
        intentDigest: `sha256:${"1".repeat(64)}`,
        nonce: "consumed",
        detailDigest: `sha256:${"2".repeat(64)}`,
      }),
    ).toThrow();
    const runner = createFakeProcessRunnerPort(() => ({
      status: "timed_out",
      exitCode: null,
      stdout: "",
      stderr: "",
    }));
    const ports = createPackPublicationProductionPorts({ runner, operationId: "op-1" });
    return expect(ports.pack.observeBefore()).resolves.toMatchObject({ status: "unavailable" });
  });

  it("CANDIDATE-PACKPUB-005-H: journal and receipt contain only the durable consumed nonce", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-packpub-"));
    const fixture = approvalFixture(root);
    fixture.journal.append({
      transition: "planned",
      mutation: "planned",
      kind: "planned_nonce_consumed",
      intentDigest: fixture.approval.intentDigest,
      nonce: fixture.approval.nonce,
      detailDigest: `sha256:${"2".repeat(64)}`,
    });
    const receipt = createFilePublicationReceiptPort({
      root: join(root, "publication"),
      operationId: "op-1",
    });
    receipt.persist({
      kind: "pack-publication-receipt-v2",
      operationId: "op-1",
      idempotencyKey: "idem-1",
      intentDigest: fixture.approval.intentDigest,
      releaseId: "release-1",
      sourceRevision: commit("1"),
      releaseVersion: "0.2.0-canary.1",
      releasePackCommit: commit("2"),
      releasePackTreeDigest: `sha256:${"3".repeat(64)}`,
      pointerPackCommit: commit("4"),
      pointerPackTreeDigest: `sha256:${"5".repeat(64)}`,
      tagName: "v0.2.0-canary.1",
      assets: [
        { name: "a", size: 1, contentDigest: `sha256:${"6".repeat(64)}` },
        { name: "b", size: 1, contentDigest: `sha256:${"7".repeat(64)}` },
      ],
      beforeControlManifestSnapshotDigest: `sha256:${"8".repeat(64)}`,
      afterControlManifestSnapshotDigest: `sha256:${"9".repeat(64)}`,
      pointerObjectDigest: `sha256:${"a".repeat(64)}`,
      approver: fixture.approval.approver,
      nonces: { planned: fixture.approval.nonce },
      durableExecutionStateDigest: fixture.journal.digest(),
      receiptDigest: `sha256:${"b".repeat(64)}`,
    });
    expect(fixture.journal.events()[0]?.nonce).toBe(fixture.approval.nonce);
  });

  it("CANDIDATE-PACKPUB-005-J / -L: read-back and CAS boundaries are typed", async () => {
    const ports = createPackPublicationProductionPorts({ runner: ghRunner(), operationId: "op-1" });
    const drift = await ports.pack.mergePullRequestCas({
      repository: "repo",
      pullRequest: "1",
      expectedMainSha: commit("9"),
    });
    expect(drift).toMatchObject({ status: "mismatch", reason: "main_sha_drift" });
  });
});
