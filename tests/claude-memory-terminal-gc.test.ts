import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { MemoryEntry } from "../src/memory/index.ts";
import {
  buildClaudeInboxEntry,
  buildClaudeReviewInboxEntry,
  claudeWorkspaceId,
  evaluateClaudeInboxTerminal,
  parseClaudeInboxPullRequestObservation,
  publishClaudeInboxEntry,
  recoverClaudeInboxBacklog,
  summarizeUnclaimedInbox,
  waitForClaudeMemory,
} from "../src/runtime/claude-memory-wake.ts";

const memory: MemoryEntry = {
  memory_id: "memory:project:terminal-gc",
  kind: "project",
  title: "terminal gc",
  body: "terminal gc",
  tags: ["claude"],
  source_path: ".ut-tdd/memory/project-terminal-gc.md",
  updated_at: "2026-08-27T00:00:00.000Z",
  content_hash: "a".repeat(64),
};

function fixture(): string {
  const root = mkdtempSync(join(tmpdir(), "ut-tdd-terminal-gc-"));
  execFileSync("git", ["init", "-q"], { cwd: root });
  return root;
}

function review(root: string, operationId = "review") {
  const digest = "b".repeat(16);
  return buildClaudeReviewInboxEntry({
    memory,
    operationId,
    workspaceId: claudeWorkspaceId(root),
    requestDigest: digest,
    requestPath: `.ut-tdd/review/requests/${digest}.json`,
    pr: 444,
    exactHead: "c".repeat(40),
    reviewRevision: "rv1-terminal-gc",
    authorFamily: "codex",
  });
}

describe("Claude inbox terminal GC", () => {
  it("U-MEMTERM-001: claims, merged/closed PRs, and replaced heads are typed terminal states", () => {
    const entry = review(fixture());
    expect(evaluateClaudeInboxTerminal({ entry, claimed: true })).toEqual({
      terminal: true,
      reason: "claimed",
    });
    expect(
      evaluateClaudeInboxTerminal({
        entry,
        pullRequest: { pr: 444, state: "MERGED", headSha: entry.exactHead },
      }),
    ).toMatchObject({
      terminal: true,
      reason: "pr_merged",
      receipt: { requestDigest: entry.requestDigest },
    });
    expect(
      evaluateClaudeInboxTerminal({
        entry,
        pullRequest: { pr: 444, state: "CLOSED", headSha: entry.exactHead },
      }),
    ).toMatchObject({ terminal: true, reason: "pr_closed" });
    expect(
      evaluateClaudeInboxTerminal({
        entry,
        pullRequest: { pr: 444, state: "OPEN", headSha: "d".repeat(40) },
        replacementExists: true,
      }),
    ).toMatchObject({ terminal: true, reason: "stale_head_replaced" });
  });

  it("U-MEMTERM-002: memory and legacy envelopes do not infer PR/head terminality", () => {
    const root = fixture();
    const entry = buildClaudeInboxEntry({
      memory,
      operationId: "memory",
      workspaceId: claudeWorkspaceId(root),
    });
    expect(
      evaluateClaudeInboxTerminal({
        entry,
        pullRequest: { pr: 444, state: "MERGED", headSha: "d".repeat(40) },
      }),
    ).toEqual({ terminal: false });
    expect(parseClaudeInboxPullRequestObservation(444, "{not-json")).toBeUndefined();
    expect(
      parseClaudeInboxPullRequestObservation(
        444,
        JSON.stringify({ state: "OPEN", headRefOid: "not-a-sha" }),
      ),
    ).toBeUndefined();
    expect(
      parseClaudeInboxPullRequestObservation(
        444,
        JSON.stringify({ state: "CLOSED", headRefOid: "d".repeat(40) }),
      ),
    ).toMatchObject({ pr: 444, state: "CLOSED", headSha: "d".repeat(40) });
    const legacy = { ...entry, schemaVersion: "ut-tdd.claude-inbox/v2" } as unknown as typeof entry;
    expect(
      evaluateClaudeInboxTerminal({
        entry: legacy,
        pullRequest: { pr: 444, state: "MERGED", headSha: "d".repeat(40) },
      }),
    ).toEqual({ terminal: false });
    rmSync(root, { recursive: true, force: true });
  });

  it("U-MEMTERM-003: dry-run predicts recovery and apply writes markers without deleting inbox evidence", () => {
    const root = fixture();
    try {
      const entry = review(root);
      const path = publishClaudeInboxEntry(root, entry);
      const observation = { pr: entry.pr, state: "MERGED" as const, headSha: entry.exactHead };
      const dryRun = recoverClaudeInboxBacklog({
        repoRoot: root,
        pullRequests: [observation],
        dryRun: true,
      });
      expect(dryRun).toMatchObject({
        dryRun: true,
        terminalized: 1,
        entries: [{ reason: "pr_merged" }],
      });
      expect(dryRun.entries[0]?.markerPath).toBeUndefined();
      expect(existsSync(path)).toBe(true);
      const applied = recoverClaudeInboxBacklog({
        repoRoot: root,
        pullRequests: [observation],
        dryRun: false,
      });
      expect(applied.terminalized).toBe(1);
      expect(applied.entries[0]?.markerPath).toContain(".terminal.json");
      expect(existsSync(path)).toBe(true);
      const markerPath = applied.entries[0]?.markerPath;
      expect(markerPath).toBeDefined();
      expect(JSON.parse(readFileSync(markerPath ?? "", "utf8"))).toMatchObject({
        reason: "pr_merged",
        requestDigest: entry.requestDigest,
      });
      expect(summarizeUnclaimedInbox(root, entry.targetWorkspaceId).pending).toBe(0);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("U-MEMTERM-004: terminal markers prevent wake without destroying the receipt", async () => {
    const cliSource = readFileSync(join(process.cwd(), "src", "cli.ts"), "utf8");
    expect(cliSource).toMatch(/recoverClaudeInboxForSessionStart\(repoRoot\)/);
    expect(cliSource).toMatch(
      /pullRequestState: \(pr\) => observeClaudeInboxPullRequest\(repoRoot, pr\)/,
    );
    const root = fixture();
    try {
      const entry = review(root);
      const path = publishClaudeInboxEntry(root, entry);
      const result = await waitForClaudeMemory({
        repoRoot: root,
        sessionId: "gc",
        pollIntervalMs: 10,
        maxWaitMs: 20,
        pullRequestState: (pr) =>
          pr === entry.pr ? { pr, state: "MERGED", headSha: entry.exactHead } : undefined,
      });
      expect(result.kind).toBe("timeout");
      expect(existsSync(path)).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
