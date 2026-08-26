import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { Command } from "commander";
import { afterEach, describe, expect, it, vi } from "vitest";
import { claudeReviewVerdictEditRule } from "../src/cli/delegation.ts";
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
  const canonicalRequest = issued.request;
  const envelope: ClaudeReviewInboxEntry = {
    schemaVersion: "ut-tdd.claude-inbox/v3",
    purpose: "review",
    id: "memory:d3a:review",
    memoryId: canonicalRequest.memoryId,
    body: "identity must not be read from this prose",
    originRuntime: "codex",
    operationId: "review-d3a-cli",
    targetWorkspaceId: "b".repeat(64),
    createdAt: canonicalRequest.requestedAt,
    requestDigest: issued.digest,
    requestPath: relative(root, issued.path).replaceAll("\\", "/"),
    memoryPath: relative(root, memoryPath).replaceAll("\\", "/"),
    pr: canonicalRequest.pr,
    exactHead: canonicalRequest.exactHead,
    reviewRevision: canonicalRequest.reviewRevision,
    authorFamily: canonicalRequest.authorFamily,
  };
  const envelopePath = join(root, "envelope.json");
  writeFileSync(envelopePath, JSON.stringify(envelope), "utf8");
  return { root, envelopePath, memoryPath, envelope };
}

afterEach(() => {
  while (roots.length > 0) rmSync(roots.pop() as string, { recursive: true, force: true });
});

describe("review live CLI composition", () => {
  it("U-MEMWAKE-007: routes the derived wake to the live workspace while preserving request identity", async () => {
    const { root, memoryPath } = fixture();
    execFileSync("git", ["init", "-q"], { cwd: root });
    const targetWorkspaceId = "f".repeat(64);
    const program = new Command().exitOverride();
    registerLiveReviewCommands(program.command("review"), {
      repoRoot: () => root,
      providerAvailable: () => true,
      resolveWakeTarget: () => ({ ok: true, workspaceId: targetWorkspaceId }),
    });
    const originalWrite = process.stdout.write;
    const originalExitCode = process.exitCode;
    process.stdout.write = (() => true) as typeof process.stdout.write;
    try {
      await program.parseAsync([
        "node",
        "ut-tdd",
        "review",
        "live-dispatch",
        "--memory-id",
        "memory:d3a",
        "--memory-path",
        relative(root, memoryPath).replaceAll("\\", "/"),
        "--pr",
        "319",
        "--head",
        head,
        "--revision",
        "review-d3a-routing",
        "--author-family",
        "codex",
        "--json",
      ]);
    } finally {
      process.stdout.write = originalWrite;
      process.exitCode = originalExitCode;
    }
    const inbox = join(root, ".git", "ut-tdd-runtime", "claude-memory-wake", "inbox");
    const files = readdirSync(inbox).filter((name) => name.endsWith(".json"));
    expect(files).toHaveLength(1);
    const envelope = JSON.parse(readFileSync(join(inbox, files[0]), "utf8")) as Record<
      string,
      unknown
    >;
    const requestFiles = readdirSync(join(root, ".ut-tdd", "review", "requests"));
    expect(requestFiles).toHaveLength(1);
    const requestPath = join(root, ".ut-tdd", "review", "requests", requestFiles[0]);
    const request = JSON.parse(readFileSync(requestPath, "utf8")) as Record<string, unknown>;
    expect(envelope).toMatchObject({
      targetWorkspaceId,
      requestPath,
      exactHead: head,
      pr: 319,
      reviewRevision: request.reviewRevision,
    });
  });

  it("U-MEMWAKE-007: keeps the canonical request as backlog when no live target exists", async () => {
    const { root, memoryPath } = fixture();
    execFileSync("git", ["init", "-q"], { cwd: root });
    const program = new Command().exitOverride();
    registerLiveReviewCommands(program.command("review"), {
      repoRoot: () => root,
      providerAvailable: () => true,
      resolveWakeTarget: () => ({ ok: false, reason: "no_live_claude_workspace" }),
    });
    const originalWrite = process.stdout.write;
    const originalExitCode = process.exitCode;
    process.stdout.write = (() => true) as typeof process.stdout.write;
    try {
      await program.parseAsync([
        "node",
        "ut-tdd",
        "review",
        "live-dispatch",
        "--memory-id",
        "memory:d3a",
        "--memory-path",
        relative(root, memoryPath).replaceAll("\\", "/"),
        "--pr",
        "319",
        "--head",
        head,
        "--revision",
        "review-d3a-no-target",
        "--author-family",
        "codex",
        "--json",
      ]);
    } finally {
      process.stdout.write = originalWrite;
      process.exitCode = originalExitCode;
    }
    const requests = readdirSync(join(root, ".ut-tdd", "review", "requests"));
    expect(requests).toHaveLength(1);
    expect(() => readdirSync(join(root, ".git", "ut-tdd-runtime", "claude-memory-wake", "inbox"))).toThrow();
  });

  it("U-RVATT-031 grants Claude only the consumer-derived exact verdict path", () => {
    const root = join(tmpdir(), "ut-review-permission-root");
    const digest = "c".repeat(64);
    const verdict = join(
      root,
      ".ut-tdd",
      "review",
      "verdicts",
      digest,
      "attempts",
      "attempt-2",
      "verdict.txt",
    );

    expect(claudeReviewVerdictEditRule(root, verdict)).toBe(
      `Edit(.ut-tdd/review/verdicts/${digest}/attempts/attempt-2/verdict.txt)`,
    );
    expect(claudeReviewVerdictEditRule(root, join(root, "src", "cli.ts"))).toBeUndefined();
    expect(claudeReviewVerdictEditRule(root, join(root, "..", "verdict.txt"))).toBeUndefined();
  });

  it("U-RVATT-027 executes canonical task resolution and delegated-review argv before publishing", async () => {
    const { root, envelopePath, memoryPath, envelope } = fixture();
    const projection: Extract<ReviewVerdictProjectionResult, { ok: true }> = {
      ok: true,
      path: join(root, ".ut-tdd", "review", "receipts", "receipt.json"),
      digest: "receipt-digest",
      receipt: {
        memoryId: "memory:d3a",
        pr: 319,
        head,
        reviewRevision: envelope.reviewRevision,
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

  it("U-RVATT-036 obtains receipt provider/model/role/time/exit facts through the real delegation CLI", () => {
    const { root, memoryPath } = fixture();
    const binRoot = mkdtempSync(join(tmpdir(), "ut-review-provider-"));
    roots.push(binRoot);
    const helper = join(binRoot, "write-verdict.cjs");
    writeFileSync(
      helper,
      String.raw`const fs = require("node:fs");
let prompt = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => { prompt += chunk; });
process.stdin.on("end", () => {
  const fields = [
    "schema_version", "request_digest", "attempt", "pr", "exact_head",
    "review_revision", "reviewer_provider", "reviewer_model", "invocation_nonce",
  ].map((key) => {
    const match = prompt.match(new RegExp("^" + key + ":\\s*(.*)$", "m"));
    return key + ": " + (match ? match[1].trim() : "");
  }).join("\n");
  fs.writeFileSync(process.env.UT_TDD_REVIEW_VERDICT_FILE, fields + "\nVERDICT: PASS\n", "utf8");
  process.stdout.write("VERDICT: PASS\n");
});
`,
      "utf8",
    );
    const stub = join(binRoot, process.platform === "win32" ? "claude.cmd" : "claude");
    writeFileSync(
      stub,
      process.platform === "win32"
        ? `@echo off\r\nif "%~1"=="--version" (echo claude 0.0.0-stub& exit /b 0)\r\nnode "${helper}"\r\nexit /b 0\r\n`
        : `#!/bin/sh\nif [ "$1" = "--version" ]; then echo "claude 0.0.0-stub"; exit 0; fi\nexec node "${helper}"\n`,
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
      expect(result, JSON.stringify(result)).toMatchObject({
        ok: true,
        receipt: {
          memoryId: "memory:d3a",
          pr: 319,
          head,
          reviewRevision: expect.stringMatching(/^rv1-[a-f0-9]{64}$/),
          reviewerFamily: "claude",
          verdict: "PASS",
        },
      });
    } finally {
      if (previous === undefined) delete process.env.UT_TDD_CLAUDE_BIN;
      else process.env.UT_TDD_CLAUDE_BIN = previous;
    }
  }, 30_000);

  it("U-RVATT-029 lets a reviewer that never reads env write the verdict file from the injected literal path", () => {
    // 2026-08-14 実測: delegated Claude が `VERDICT: PASS` を stdout へ返しながら
    // UT_TDD_REVIEW_VERDICT_FILE の値を解決できず (permission が env / printenv / echo $VAR を
    // 拒否)、verdict file 0 → receipt 0 → wrapper deny という恒久 fail が起きた。
    // この stub は env を一切参照せず、契約本文へ埋め込まれた literal path だけで書く。
    // 契約が env 名しか渡さない実装へ戻ると path を抽出できず receipt が立たない (RED)。
    const { root, memoryPath } = fixture();
    const binRoot = mkdtempSync(join(tmpdir(), "ut-review-provider-noenv-"));
    roots.push(binRoot);
    const helper = join(binRoot, "write-verdict.cjs");
    writeFileSync(
      helper,
      String.raw`const fs = require("node:fs");
let prompt = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  prompt += chunk;
});
process.stdin.on("end", () => {
  // 環境変数は一切参照しない。契約本文に埋め込まれた literal path だけを使う。
  const match = prompt.match(/([A-Za-z]:[\\/][^\s"'()]*verdict\.txt|\/[^\s"'()]*verdict\.txt)/);
  if (!match) {
    process.stdout.write("no literal verdict path in contract\n");
    process.exit(0);
  }
  const fields = [
    "schema_version", "request_digest", "attempt", "pr", "exact_head",
    "review_revision", "reviewer_provider", "reviewer_model", "invocation_nonce",
  ].map((key) => {
    const field = prompt.match(new RegExp("^" + key + ":\\s*(.*)$", "m"));
    return key + ": " + (field ? field[1].trim() : "");
  }).join("\n");
  fs.writeFileSync(match[1], fields + "\nVERDICT: PASS\n", "utf8");
  process.stdout.write("VERDICT: PASS\n");
});
`,
      "utf8",
    );
    const stub = join(binRoot, process.platform === "win32" ? "claude.cmd" : "claude");
    writeFileSync(
      stub,
      process.platform === "win32"
        ? `@echo off\r\nif "%~1"=="--version" (echo claude 0.0.0-stub& exit /b 0)\r\nnode "${helper}"\r\nexit /b 0\r\n`
        : `#!/bin/sh\nif [ "$1" = "--version" ]; then echo "claude 0.0.0-stub"; exit 0; fi\nexec node "${helper}"\n`,
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
          "review-d3a-noenv",
          "--review-author-family",
          "codex",
          "--review-memory-id",
          "memory:d3a",
          "--execute",
          "--json",
        ],
      });
      expect(result, JSON.stringify(result)).toMatchObject({
        ok: true,
        receipt: { pr: 319, head, reviewerFamily: "claude", verdict: "PASS" },
      });
    } finally {
      if (previous === undefined) delete process.env.UT_TDD_CLAUDE_BIN;
      else process.env.UT_TDD_CLAUDE_BIN = previous;
    }
  }, 30_000);
});
