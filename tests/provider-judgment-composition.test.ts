import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { composeProviderJudgment } from "../src/feedback/provider-judgment-composition.ts";
import type { ReviewReceipt } from "../src/feedback/review-dispatch.ts";
import {
  appendReviewCustodyAudit,
  type ReviewCustodyAuditEvent,
  reviewIdentityDigest,
  reviewVerdictPath,
} from "../src/feedback/review-verdict-custody.ts";
import { removeTestTree } from "./support/temp-tree.ts";

const HEAD = "a".repeat(40);
const REQUEST = {
  memoryId: "memory-composition",
  pr: 570,
  exactHead: HEAD,
  reviewRevision: "",
  authorFamily: "codex" as const,
  requestedAt: "2026-09-14T12:00:00.000Z",
  invocationNonce: "nonce-composition",
};

const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) removeTestTree(root);
});

describe("provider judgment composition", () => {
  it("CANDIDATE-U-D3BCOMP-001/002/003/004/006/007/008/009/010/015: derives a replayable judgment only from custody", async () => {
    const fixture = createFixture();
    const first = await composeProviderJudgment({
      repoRoot: fixture.root,
      requestDigest: fixture.requestDigest,
      attempt: 1,
    });
    expect(first).toMatchObject({
      ok: true,
      providerEvidenceRef: expect.stringMatching(/^d3b:[a-f0-9]{64}$/),
      replay: false,
    });
    const artifact = readFileSync((first as { artifactPath: string }).artifactPath);
    const second = await composeProviderJudgment({
      repoRoot: fixture.root,
      requestDigest: fixture.requestDigest,
      attempt: 1,
    });
    expect(second).toMatchObject({ ok: true, replay: true });
    expect(readFileSync((second as { artifactPath: string }).artifactPath)).toEqual(artifact);
  });

  it("CANDIDATE-U-D3BCOMP-004/005/006: rejects missing or ambiguous invocation facts", async () => {
    const fixture = createFixture({ event: false });
    await expect(
      composeProviderJudgment({
        repoRoot: fixture.root,
        requestDigest: fixture.requestDigest,
        attempt: 1,
      }),
    ).resolves.toEqual({ ok: false, reason: "invocation_fact_unavailable" });
    appendReviewCustodyAudit(fixture.root, fixture.event);
    appendReviewCustodyAudit(fixture.root, fixture.event);
    const result = await composeProviderJudgment({
      repoRoot: fixture.root,
      requestDigest: fixture.requestDigest,
      attempt: 1,
    });
    expect(result).toEqual({ ok: false, reason: "invocation_fact_ambiguous" });
  });

  it("CANDIDATE-U-D3BCOMP-005/006: rejects invalid provider/model event facts and same-family review", async () => {
    for (const mutation of [
      { provider: "codex" as const, model: "claude-test", reason: "same_family_reviewer" },
      { provider: "claude" as const, model: "", reason: "invocation_fact_schema_invalid" },
    ]) {
      const fixture = createFixture({ event: false, eventMutation: mutation });
      const result = await composeProviderJudgment({
        repoRoot: fixture.root,
        requestDigest: fixture.requestDigest,
        attempt: 1,
      });
      expect(result).toEqual({ ok: false, reason: mutation.reason });
    }
  });

  it("CANDIDATE-U-D3BCOMP-015/019/021: rejects receipt byte mutation", async () => {
    const fixture = createFixture();
    const receiptPath = join(
      fixture.root,
      ".ut-tdd",
      "review",
      "receipts",
      `${fixture.requestDigest}.json`,
    );
    const original = readFileSync(receiptPath);
    writeFileSync(receiptPath, Buffer.from(`${original.toString("utf8")} `));
    await expect(
      composeProviderJudgment({
        repoRoot: fixture.root,
        requestDigest: fixture.requestDigest,
        attempt: 1,
      }),
    ).resolves.toEqual({ ok: false, reason: "receipt_mutated" });
  });
});

function createFixture(
  options: {
    event?: boolean;
    eventMutation?: Partial<Pick<ReviewCustodyAuditEvent, "provider" | "model">>;
  } = {},
): {
  root: string;
  requestDigest: string;
  event: ReviewCustodyAuditEvent;
} {
  const root = mkdtempSync(join(tmpdir(), "ut-tdd-d3b-composition-"));
  roots.push(root);
  runGit(root, ["init", "-b", "main"]);
  runGit(root, ["config", "user.email", "test@example.invalid"]);
  runGit(root, ["config", "user.name", "test"]);
  runGit(root, ["remote", "add", "origin", "https://github.com/acme/widget.git"]);
  writeFileSync(
    join(root, "ut-tdd.project.json"),
    `${JSON.stringify({ schema_version: "ut-tdd.project/v1", repository_identity: "acme/widget" }, null, 2)}\n`,
  );
  runGit(root, ["add", "ut-tdd.project.json"]);
  runGit(root, ["commit", "-m", "fixture"]);
  const requestDigest = reviewIdentityDigest(REQUEST);
  const request = { ...REQUEST, reviewRevision: `rv1-${requestDigest}` };
  const requestDir = join(root, ".ut-tdd", "review", "requests");
  const receiptDir = join(root, ".ut-tdd", "review", "receipts");
  mkdirSync(requestDir, { recursive: true });
  mkdirSync(receiptDir, { recursive: true });
  writeFileSync(join(requestDir, `${requestDigest}.json`), `${JSON.stringify(request, null, 2)}\n`);
  const receipt: ReviewReceipt = {
    memoryId: request.memoryId,
    pr: request.pr,
    head: request.exactHead,
    reviewRevision: request.reviewRevision,
    reviewerFamily: "claude",
    kind: "verdict",
    verdict: "PASS",
    blockingFindings: [],
    at: request.requestedAt,
  };
  const receiptBytes = Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`);
  const receiptPath = join(receiptDir, `${requestDigest}.json`);
  writeFileSync(receiptPath, receiptBytes);
  const verdictPath = reviewVerdictPath(root, requestDigest, 1);
  mkdirSync(join(root, ".ut-tdd", "review", "verdicts", requestDigest, "attempts", "attempt-1"), {
    recursive: true,
  });
  writeFileSync(verdictPath, "verdict: PASS\n");
  const event: ReviewCustodyAuditEvent = {
    kind: "attempt_completed",
    requestDigest,
    attempt: 1,
    exactHead: request.exactHead,
    verdictPath,
    recordedAt: request.requestedAt,
    reason: "review_completed",
    provider: options.eventMutation?.provider ?? "claude",
    model: options.eventMutation?.model ?? "claude-test",
    exitCode: 0,
    receiptFileDigest: sha(receiptBytes),
    verdictDigest: sha(readFileSync(verdictPath)),
  };
  if (options.event !== false || options.eventMutation) appendReviewCustodyAudit(root, event);
  return { root, requestDigest, event };
}

function sha(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function runGit(root: string, args: string[]): void {
  execFileSync("git", args, { cwd: root, stdio: "ignore" });
}
