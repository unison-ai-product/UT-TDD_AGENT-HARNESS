import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
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
  loadApprovalCommitmentFromOriginMain,
  type ProcessResult,
  validatePackApprovalCommitment,
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
      return result({
        sha: commit("c"),
        commit: { tree: { sha: commit("b") } },
        controlManifestSnapshotDigest: `sha256:${"d".repeat(64)}`,
        releaseId: "release-1",
        sourceRevision: commit("1"),
        materializerVersion: "1.0.0",
        mergeMode: "pull_request_cas",
      });
    if (path.includes("git/refs") || path.includes("pulls"))
      return result({ number: 7, sha: commit("c"), merge_commit_sha: commit("c") });
    if (path.includes("git/ref/heads")) return result({ object: { sha: commit("c") } });
    if (path.includes("branches/"))
      return result({ commit: { sha: commit("1"), commit: { tree: { sha: commit("2") } } } });
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
  return {
    journal,
    approval,
    commitment,
    expected: {
      operationId: "op-1",
      releaseId: "release-1",
      tagName: "v0.2.0-canary.1",
      intentDigest: approval.intentDigest,
      idempotencyKey: approval.idempotencyKey,
    },
  };
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
    expect(runner.calls.length).toBe(6);
    expect(runner.calls[2]?.stdin).toContain(
      '"base_tree":"2222222222222222222222222222222222222222"',
    );
    expect(runner.calls[3]?.stdin).toContain(
      '"parents":["1111111111111111111111111111111111111111"]',
    );
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

  it("CANDIDATE-PACKPUB-005-C / -D / -P / -Q / -R: binds and consumes the committed approval once", async () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-packpub-"));
    const fixture = approvalFixture(root);
    const approvalPort = createFileApprovalPort({
      root: join(root, "approvals"),
      operationId: "op-1",
      commitment: fixture.commitment,
      commitmentExpected: fixture.expected,
      durableState: fixture.journal,
    });
    await expect(approvalPort.consume(fixture.approval)).resolves.toEqual({
      status: "attested",
      value: { mode: "new" },
    });
    await expect(approvalPort.consume(fixture.approval)).resolves.toEqual({
      status: "attested",
      value: { mode: "reconcile" },
    });
    await expect(approvalPort.consume({ ...fixture.approval, nonce: "wrong" })).resolves.toEqual({
      status: "mismatch",
      reason: "approval_commitment_mismatch",
    });
    expect(JSON.stringify(fixture.commitment)).not.toContain(fixture.approval.nonce);
  });

  it("CANDIDATE-PACKPUB-005-E / -F / -G: durable failures are observable and never success", async () => {
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
    await expect(ports.pack.observeBefore()).resolves.toMatchObject({ status: "unavailable" });
  });

  it("CANDIDATE-PACKPUB-005-H: journal and receipt contain only the durable consumed nonce", async () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-packpub-"));
    const fixture = approvalFixture(root);
    const approvalPort = createFileApprovalPort({
      root: join(root, "approvals"),
      operationId: "op-1",
      commitment: fixture.commitment,
      commitmentExpected: fixture.expected,
      durableState: fixture.journal,
    });
    await expect(approvalPort.consume(fixture.approval)).resolves.toEqual({
      status: "attested",
      value: { mode: "new" },
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
    expect(fixture.journal.events()).toHaveLength(1);
    expect(fixture.journal.events()[0]?.kind).toBe("planned_nonce_consumed");
  });

  it("CANDIDATE-PACKPUB-005-E / -F: append failure compensates rename and retry consumes once", async () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-packpub-"));
    const fixture = approvalFixture(root);
    let failAppend = true;
    const journal = createFilePublicationJournalPort({
      root: join(root, "publication"),
      operationId: "op-1",
      beforeAppend: () => {
        if (failAppend) throw new Error("injected");
      },
    });
    const approvalPort = createFileApprovalPort({
      root: join(root, "approvals"),
      operationId: "op-1",
      commitment: fixture.commitment,
      commitmentExpected: fixture.expected,
      durableState: journal,
    });
    await expect(approvalPort.consume(fixture.approval)).resolves.toEqual({
      status: "indeterminate",
      reason: "journal_persist_failed",
    });
    expect(existsSync(join(root, "approvals", "op-1", "planned.planned.json"))).toBe(true);
    expect(existsSync(join(root, "approvals", "op-1", "planned.planned.consumed.json"))).toBe(
      false,
    );
    expect(journal.events()).toHaveLength(0);
    failAppend = false;
    await expect(
      createFileApprovalPort({
        root: join(root, "approvals"),
        operationId: "op-1",
        commitment: fixture.commitment,
        commitmentExpected: fixture.expected,
        durableState: journal,
      }).consume(fixture.approval),
    ).resolves.toEqual({ status: "attested", value: { mode: "new" } });
    expect(journal.events()).toHaveLength(1);
  });

  it("CANDIDATE-PACKPUB-005-E / -F: post-write append failure preserves consumed event for reconcile", async () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-packpub-"));
    const fixture = approvalFixture(root);
    const journal = createFilePublicationJournalPort({
      root: join(root, "publication"),
      operationId: "op-1",
      afterAppend: () => {
        throw new Error("fsync-return failure");
      },
    });
    const approvalPort = createFileApprovalPort({
      root: join(root, "approvals"),
      operationId: "op-1",
      commitment: fixture.commitment,
      commitmentExpected: fixture.expected,
      durableState: journal,
    });
    await expect(approvalPort.consume(fixture.approval)).resolves.toEqual({
      status: "indeterminate",
      reason: "journal_persist_failed",
    });
    expect(existsSync(join(root, "approvals", "op-1", "planned.planned.json"))).toBe(false);
    expect(existsSync(join(root, "approvals", "op-1", "planned.planned.consumed.json"))).toBe(true);
    expect(journal.events()).toHaveLength(1);
    await expect(approvalPort.consume(fixture.approval)).resolves.toEqual({
      status: "attested",
      value: { mode: "reconcile" },
    });
    expect(journal.events()).toHaveLength(1);
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

  it("CANDIDATE-PACKPUB-005-C: commitment identity mismatch is denied before a write", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-packpub-"));
    const fixture = approvalFixture(root);
    const expected = {
      operationId: "op-1",
      releaseId: "release-1",
      tagName: "v0.2.0-canary.1",
      intentDigest: fixture.approval.intentDigest,
      idempotencyKey: fixture.approval.idempotencyKey,
    };
    const wrong = validatePackApprovalCommitment({
      commitment: { ...fixture.commitment, operationId: "other-operation" },
      expected,
      now: new Date("2026-01-01T00:00:00Z"),
    });
    expect(wrong).toEqual({ ok: false, reason: "approval_commitment_mismatch" });
  });

  it("CANDIDATE-PACKPUB-005-P / -Q / -R: every commitment identity axis denies with zero writes", async () => {
    const fields = [
      "operationId",
      "releaseId",
      "tagName",
      "intentDigest",
      "idempotencyKey",
    ] as const;
    for (const field of fields) {
      const root = mkdtempSync(join(tmpdir(), "ut-tdd-packpub-"));
      const fixture = approvalFixture(root);
      const runner = ghRunner();
      const commitment = { ...fixture.commitment, [field]: `wrong-${field}` };
      const ports = createPackPublicationProductionPorts({
        runner,
        operationId: "op-1",
        commitment,
        commitmentExpected: {
          operationId: "op-1",
          releaseId: "release-1",
          tagName: "v0.2.0-canary.1",
          intentDigest: fixture.approval.intentDigest,
          idempotencyKey: fixture.approval.idempotencyKey,
        },
        approvalRoot: join(root, "approvals"),
        publicationRoot: join(root, "publication"),
      });
      await expect(ports.approval.consume(fixture.approval)).resolves.toEqual({
        status: "mismatch",
        reason: "approval_commitment_mismatch",
      });
      expect(runner.calls).toHaveLength(0);
    }
  });

  it("CANDIDATE-PACKPUB-005-D: rename failure denies and leaves no consumed journal event", async () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-packpub-"));
    const fixture = approvalFixture(root);
    const approvalPort = createFileApprovalPort({
      root: join(root, "approvals"),
      operationId: "op-1",
      commitment: fixture.commitment,
      commitmentExpected: fixture.expected,
      durableState: fixture.journal,
      rename: () => {
        throw new Error("EPERM");
      },
    });
    await expect(approvalPort.consume(fixture.approval)).resolves.toEqual({
      status: "mismatch",
      reason: "approval_consume_failed",
    });
    expect(fixture.journal.events()).toHaveLength(0);
  });

  it("CANDIDATE-PACKPUB-005-F: read-back failure is indeterminate, never success", async () => {
    const runner = createFakeProcessRunnerPort((request) => {
      if (request.argv.some((arg) => arg.includes("git/ref/heads/publication/op-1")))
        return { status: "timed_out", exitCode: null, stdout: "", stderr: "" };
      return ghRunner().run(request);
    });
    const ports = createPackPublicationProductionPorts({ runner, operationId: "op-1" });
    const observed = await ports.pack.commitPublicationBranch({
      repository: "repo",
      branch: "publication/op-1",
      entries: [],
    });
    expect(observed).toEqual({ status: "indeterminate", reason: "gh_command_unavailable" });
  });

  it("CANDIDATE-PACKPUB-005-J: release and asset observations use gh response fields", async () => {
    const runner = createFakeProcessRunnerPort((request) => {
      const path = request.argv.join(" ");
      if (path.includes("commits/"))
        return result({
          sha: commit("c"),
          commit: { tree: { sha: commit("b") } },
          controlManifestSnapshotDigest: `sha256:${"d".repeat(64)}`,
          releaseId: "observed-release",
          sourceRevision: commit("e"),
          materializerVersion: "2.0.0",
          mergeMode: "pull_request_cas",
        });
      if (path.includes("git/trees/")) return result({ tree: [] });
      if (path.includes("releases/8/assets"))
        return result({ name: "pack.tgz", size: 7, digest: `sha256:${"f".repeat(64)}` });
      return result({});
    });
    const ports = createPackPublicationProductionPorts({ runner, operationId: "op-1" });
    const observed = await ports.pack.observeReleaseCommit({
      repository: "repo",
      mainSha: commit("c"),
    });
    expect(observed).toMatchObject({
      status: "attested",
      value: { releaseId: "observed-release", sourceRevision: commit("e") },
    });
    const uploaded = await ports.release.uploadAsset({
      releaseId: "8",
      asset: {
        name: "input.tgz",
        size: 1,
        contentDigest: `sha256:${"1".repeat(64)}`,
        bytes: Buffer.from("x"),
      },
    });
    expect(uploaded).toEqual({
      status: "attested",
      value: { name: "pack.tgz", size: 7, contentDigest: `sha256:${"f".repeat(64)}` },
    });
  });

  it("CANDIDATE-PACKPUB-005-Q / -R: origin/main commitment is consumed and mismatches deny", async () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-packpub-"));
    const fixture = approvalFixture(root);
    const gitRunner = createFakeProcessRunnerPort((request) =>
      request.argv[0] === "fetch"
        ? { status: "exited", exitCode: 0, stdout: "", stderr: "" }
        : result(fixture.commitment),
    );
    const expected = {
      operationId: "op-1",
      releaseId: "release-1",
      tagName: "v0.2.0-canary.1",
      intentDigest: fixture.approval.intentDigest,
      idempotencyKey: fixture.approval.idempotencyKey,
    };
    const ports = createPackPublicationProductionPorts({
      runner: ghRunner(),
      commitmentRunner: gitRunner,
      commitmentExpected: expected,
      operationId: "op-1",
      approvalRoot: join(root, "approvals"),
      publicationRoot: join(root, "publication"),
    });
    await expect(ports.approval.consume(fixture.approval)).resolves.toEqual({
      status: "attested",
      value: { mode: "new" },
    });
    expect(gitRunner.calls.map((call) => call.argv)).toEqual([
      ["fetch", "origin", "main", "--quiet"],
      ["show", "origin/main:docs/governance/pack-release-approvals/op-1.json"],
    ]);
    expect(
      loadApprovalCommitmentFromOriginMain({ operationId: "op-1", runner: gitRunner }),
    ).toMatchObject({
      ok: true,
    });
  });

  it("CANDIDATE-PACKPUB-005-R: unavailable tag read-back stays unavailable", async () => {
    const runner = createFakeProcessRunnerPort(() => ({
      status: "failed",
      exitCode: 1,
      stdout: "",
      stderr: "404 Not Found",
    }));
    const ports = createPackPublicationProductionPorts({ runner, operationId: "op-1" });
    expect(await ports.tag.observe("v0.2.0-canary.1")).toEqual({
      status: "attested",
      value: null,
    });
  });

  it("CANDIDATE-PACKPUB-005-Q / -R: auditor and reconciliation observe persisted data fail-closed", async () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-packpub-"));
    const ports = createPackPublicationProductionPorts({
      runner: ghRunner(),
      operationId: "op-1",
      publicationRoot: root,
    });
    const asset = {
      name: "pack.tgz",
      size: 1,
      contentDigest: `sha256:${"1".repeat(64)}`,
      bytes: Buffer.from("x"),
    };
    const observation = {
      intent: {
        operationId: "op-1",
        idempotencyKey: "idem-1",
        intentDigest: `sha256:${"2".repeat(64)}`,
        releaseId: "release-1",
        tagName: "v0.2.0-canary.1",
        controlManifestSnapshotDigest: `sha256:${"3".repeat(64)}`,
        remote: { allowedMergeMode: "pull_request_cas" },
        releaseAssets: [asset],
      },
      commit: {
        commitSha: "not-a-sha",
        releaseId: "release-1",
        controlManifestSnapshotDigest: `sha256:${"3".repeat(64)}`,
        mergeMode: "pull_request_cas",
      },
      draft: { draft: true, releaseId: "release-1", tagName: "v0.2.0-canary.1" },
      assets: [asset],
      tag: { name: "v0.2.0-canary.1", targetCommit: "not-a-sha", annotated: true },
      visibility: { releaseId: "release-1", draft: false },
    } as unknown as Parameters<typeof ports.auditor.attest>[0];
    expect(await ports.auditor.attest(observation)).toEqual({
      status: "mismatch",
      reason: "publication_attestation_mismatch",
    });
    mkdirSync(join(root, "op-1"), { recursive: true });
    writeFileSync(join(root, "op-1", "receipt.json"), "{}\n");
    expect(
      await ports.reconcile.observe(
        observation.intent as Parameters<typeof ports.reconcile.observe>[0],
      ),
    ).toEqual({ status: "mismatch", reason: "reconciliation_identity_mismatch" });
  });
});
