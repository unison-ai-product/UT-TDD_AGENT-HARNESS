import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { Command } from "commander";
import { afterEach, describe, expect, it, vi } from "vitest";
import { executeLiveReviewDelegation, registerLiveReviewCommands } from "../src/cli/review-live.ts";
import {
  issueReviewRequest,
  type ReviewVerdictProjectionResult,
} from "../src/feedback/review-attestation.ts";
import type { ClaudeReviewInboxEntry } from "../src/runtime/claude-memory-wake.ts";

const head = "a".repeat(40);
const roots: string[] = [];

function fixture(): {
  root: string;
  envelopePath: string;
  memoryPath: string;
  envelope: ClaudeReviewInboxEntry;
} {
  const root = mkdtempSync(join(tmpdir(), "ut-review-live-cli-"));
  roots.push(root);
  const memoryDirectory = join(root, ".ut-tdd", "memory");
  mkdirSync(memoryDirectory, { recursive: true });
  const memoryPath = join(memoryDirectory, "feedback-d3a.md");
  writeFileSync(
    memoryPath,
    [
      "---",
      "memory_id: memory:d3a",
      "kind: feedback",
      'title: "D3a"',
      "tags: []",
      "updated_at: 2026-08-14T00:00:00.000Z",
      "---",
      "review task",
    ].join("\n"),
    "utf8",
  );
  const request = {
    memoryId: "memory:d3a",
    pr: 319,
    exactHead: head,
    reviewRevision: "review-d3a-cli",
    authorFamily: "codex" as const,
    requestedAt: "2026-08-14T00:00:00.000Z",
  };
  const issued = issueReviewRequest({ repoRoot: root, request });
  if (!issued.ok) throw new Error("fixture request failed");
  const envelope: ClaudeReviewInboxEntry = {
    schemaVersion: "ut-tdd.claude-inbox/v3",
    purpose: "review",
    id: "memory:d3a:review",
    memoryId: request.memoryId,
    body: "identity must not be read from this prose",
    originRuntime: "codex",
    operationId: "review-d3a-cli",
    targetWorkspaceId: "b".repeat(64),
    createdAt: request.requestedAt,
    requestDigest: issued.digest,
    requestPath: relative(root, issued.path).replaceAll("\\", "/"),
    memoryPath: relative(root, memoryPath).replaceAll("\\", "/"),
    pr: request.pr,
    exactHead: request.exactHead,
    reviewRevision: request.reviewRevision,
    authorFamily: request.authorFamily,
  };
  const envelopePath = join(root, "envelope.json");
  writeFileSync(envelopePath, JSON.stringify(envelope), "utf8");
  return { root, envelopePath, memoryPath, envelope };
}

afterEach(() => {
  while (roots.length > 0) rmSync(roots.pop() as string, { recursive: true, force: true });
});

describe("review live CLI composition", () => {
  it("U-RVATT-027 executes canonical task resolution and delegated-review argv before publishing", async () => {
    const { root, envelopePath, memoryPath } = fixture();
    const projection: Extract<ReviewVerdictProjectionResult, { ok: true }> = {
      ok: true,
      path: join(root, ".ut-tdd", "review", "receipts", "receipt.json"),
      digest: "receipt-digest",
      receipt: {
        memoryId: "memory:d3a",
        pr: 319,
        head,
        reviewRevision: "review-d3a-cli",
        reviewerFamily: "claude",
        kind: "verdict",
        verdict: "PASS",
        blockingFindings: [],
        at: "2026-08-14T00:01:00.000Z",
      },
    };
    const runReview = vi.fn(() => projection);
    const publishReceipt = vi.fn();
    const program = new Command().exitOverride();
    registerLiveReviewCommands(program.command("review"), {
      repoRoot: () => root,
      providerAvailable: () => true,
      runReview,
      publishReceipt,
    });
    const originalWrite = process.stdout.write;
    process.stdout.write = (() => true) as typeof process.stdout.write;
    try {
      await program.parseAsync([
        "node",
        "ut-tdd",
        "review",
        "live-consume",
        "--envelope",
        envelopePath,
        "--json",
      ]);
    } finally {
      process.stdout.write = originalWrite;
    }
    expect(runReview).toHaveBeenCalledWith({
      repoRoot: root,
      provider: "claude",
      args: expect.arrayContaining([
        "--task-file",
        memoryPath,
        "--review-head",
        head,
        "--review-author-family",
        "codex",
        "--execute",
      ]),
    });
    expect(publishReceipt).toHaveBeenCalledWith(root, projection);
  });

  it("U-RVATT-027 obtains receipt provider/model/role/time/exit facts through the real delegation CLI", () => {
    const { root, memoryPath } = fixture();
    const binRoot = mkdtempSync(join(tmpdir(), "ut-review-provider-"));
    roots.push(binRoot);
    const stub = join(binRoot, process.platform === "win32" ? "claude.cmd" : "claude");
    writeFileSync(
      stub,
      process.platform === "win32"
        ? '@echo off\r\n> "%UT_TDD_REVIEW_VERDICT_FILE%" echo VERDICT: PASS\r\nexit /b 0\r\n'
        : '#!/bin/sh\nprintf "VERDICT: PASS\\n" > "$UT_TDD_REVIEW_VERDICT_FILE"\n',
      "utf8",
    );
    if (process.platform !== "win32") chmodSync(stub, 0o755);
    const previous = process.env.UT_TDD_CLAUDE_BIN;
    process.env.UT_TDD_CLAUDE_BIN = stub;
    try {
      const result = executeLiveReviewDelegation({
        repoRoot: root,
        cliPath: join(process.cwd(), "src", "cli.ts"),
        provider: "claude",
        args: [
          "--role",
          "blind-reviewer",
          "--task-file",
          memoryPath,
          "--review-pr",
          "319",
          "--review-head",
          head,
          "--review-revision",
          "review-d3a-cli",
          "--review-author-family",
          "codex",
          "--review-memory-id",
          "memory:d3a",
          "--execute",
          "--json",
        ],
      });
      expect(result).toMatchObject({
        ok: true,
        receipt: {
          memoryId: "memory:d3a",
          pr: 319,
          head,
          reviewRevision: "review-d3a-cli",
          reviewerFamily: "claude",
          verdict: "PASS",
        },
      });
    } finally {
      if (previous === undefined) delete process.env.UT_TDD_CLAUDE_BIN;
      else process.env.UT_TDD_CLAUDE_BIN = previous;
    }
  }, 30_000);
});
