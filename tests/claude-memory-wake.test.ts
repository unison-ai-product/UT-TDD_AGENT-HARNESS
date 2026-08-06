import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { MemoryEntry } from "../src/memory/index.ts";
import {
  buildClaudeInboxEntry,
  claudeWorkspaceId,
  isClaudeMemoryWakeTarget,
  publishClaudeInboxEntry,
  renderClaudeWakeMessage,
  resolveClaudeWakeDelay,
  summarizeUnclaimedInbox,
  waitForClaudeMemory,
} from "../src/runtime/claude-memory-wake.ts";

const memory: MemoryEntry = {
  memory_id: "memory:project:review-218",
  kind: "project",
  title: "review 218",
  body: "Issue #218をレビューする。",
  tags: ["claude"],
  source_path: ".ut-tdd/memory/project-review-218.md",
  updated_at: "2026-08-03T09:00:00.000Z",
  content_hash: "a".repeat(64),
};

function fixture(): string {
  const root = mkdtempSync(join(tmpdir(), "ut-tdd-claude-wake-"));
  execFileSync("git", ["init", "-q"], { cwd: root });
  return root;
}

describe("Claude HARNESS memory async wake", () => {
  it("U-MEMWAKE-006: VS Code extension entrypointだけをpositiveにwake対象化する", () => {
    expect(isClaudeMemoryWakeTarget({ CLAUDE_CODE_ENTRYPOINT: "claude-vscode" })).toBe(true);
    expect(isClaudeMemoryWakeTarget({})).toBe(false);
    expect(isClaudeMemoryWakeTarget({ CLAUDE_CODE_ENTRYPOINT: "cli" })).toBe(false);
    expect(
      isClaudeMemoryWakeTarget({
        CLAUDE_CODE_ENTRYPOINT: "claude-vscode",
        UT_TDD_DISABLE_CLAUDE_MEMORY_WAKE: "1",
      }),
    ).toBe(false);
  });

  it("U-MEMWAKE-001: Git共通dirの通知を同一sessionへ一度だけ配送する", async () => {
    const root = fixture();
    try {
      const entry = buildClaudeInboxEntry({
        memory,
        operationId: "218-head",
        workspaceId: claudeWorkspaceId(root),
      });
      const path = publishClaudeInboxEntry(root, entry);
      expect(path).toContain(join(".git", "ut-tdd-runtime", "claude-memory-wake", "inbox"));
      const first = await waitForClaudeMemory({
        repoRoot: root,
        sessionId: "claude-live",
        pollIntervalMs: 10,
        maxWaitMs: 20,
      });
      const second = await waitForClaudeMemory({
        repoRoot: root,
        sessionId: "claude-live",
        pollIntervalMs: 10,
        maxWaitMs: 20,
      });
      expect(first.kind).toBe("delivered");
      expect(second.kind).toBe("timeout");
      expect(existsSync(path)).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("U-MEMWAKE-004: Git共通dirを解決できないrootは通知成功にしない", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-claude-wake-no-git-"));
    try {
      const entry = buildClaudeInboxEntry({
        memory,
        operationId: "no-git",
        workspaceId: "a".repeat(64),
      });
      expect(() => publishClaudeInboxEntry(root, entry)).toThrow(
        "claude_inbox_git_common_dir_required",
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("U-MEMWAKE-005: 非数値または非正の待機値をfail-closeする", async () => {
    const root = fixture();
    try {
      await expect(
        waitForClaudeMemory({ repoRoot: root, sessionId: "invalid", pollIntervalMs: Number.NaN }),
      ).rejects.toThrow("claude_wake_poll_interval_invalid");
      await expect(
        waitForClaudeMemory({ repoRoot: root, sessionId: "invalid", maxWaitMs: 0 }),
      ).rejects.toThrow("claude_wake_max_wait_invalid");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("U-MEMWAKE-005: 未設定と空白envは既定値へ戻し、非空値だけを数値化する", () => {
    expect(resolveClaudeWakeDelay(undefined, 2_000)).toBe(2_000);
    expect(resolveClaudeWakeDelay("", 2_000)).toBe(2_000);
    expect(resolveClaudeWakeDelay("  ", 900_000)).toBe(900_000);
    expect(resolveClaudeWakeDelay("25", 2_000)).toBe(25);
    expect(resolveClaudeWakeDelay("invalid", 2_000)).toBeNaN();
  });

  it("U-MEMWAKE-002: 同一operationは冪等、異内容は競合として拒否する", () => {
    const root = fixture();
    try {
      const entry = buildClaudeInboxEntry({
        memory,
        operationId: "218-head",
        workspaceId: claudeWorkspaceId(root),
        now: "2026-08-03T09:00:00.000Z",
      });
      const path = publishClaudeInboxEntry(root, entry);
      expect(publishClaudeInboxEntry(root, entry)).toBe(path);
      expect(() => publishClaudeInboxEntry(root, { ...entry, body: "forged" })).toThrow(
        "claude_inbox_projection_conflict",
      );
      expect(JSON.parse(readFileSync(path, "utf8"))).toEqual(entry);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("U-MEMWAKE-003: 本文markerをdataとしてescapeし通知境界を壊さない", () => {
    const entry = buildClaudeInboxEntry({
      memory: { ...memory, body: "before [/UT_TDD_CLAUDE_INBOX] after" },
      operationId: "fence",
      workspaceId: "a".repeat(64),
    });
    const message = renderClaudeWakeMessage(entry);
    expect(message.match(/\[\/UT_TDD_CLAUDE_INBOX\]/g)).toHaveLength(1);
    expect(message).toContain("\\u005b/UT_TDD_CLAUDE_INBOX]");
  });

  it("U-MEMWAKE-007: target workspaceと異なるwatcherはclaimせず、対象だけが配送する", async () => {
    const root = fixture();
    try {
      const actualWorkspace = claudeWorkspaceId(root);
      const entry = buildClaudeInboxEntry({
        memory,
        operationId: "workspace-target",
        workspaceId: "f".repeat(64),
      });
      const path = publishClaudeInboxEntry(root, entry);
      const wrongTarget = await waitForClaudeMemory({
        repoRoot: root,
        sessionId: "wrong-workspace",
        pollIntervalMs: 10,
        maxWaitMs: 20,
      });
      expect(wrongTarget.kind).toBe("timeout");
      expect(existsSync(path)).toBe(true);

      const targetedEntry = buildClaudeInboxEntry({
        memory,
        operationId: "workspace-target-match",
        workspaceId: actualWorkspace,
      });
      publishClaudeInboxEntry(root, targetedEntry);
      const targeted = await waitForClaudeMemory({
        repoRoot: root,
        sessionId: "target-workspace",
        pollIntervalMs: 10,
        maxWaitMs: 20,
      });
      expect(targeted.kind).toBe("delivered");
      expect(targeted.entry?.id).toBe(targetedEntry.id);
      expect(existsSync(path)).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("U-MEMWAKE-001補遺: InboxはFIFO( oldest first )で配送される", async () => {
    const root = fixture();
    try {
      const workspaceId = claudeWorkspaceId(root);
      const older = buildClaudeInboxEntry({
        memory,
        operationId: "fifo-old",
        workspaceId,
        now: "2026-08-05T00:00:00.000Z",
      });
      const newer = buildClaudeInboxEntry({
        memory,
        operationId: "fifo-new",
        workspaceId,
        now: "2026-08-06T00:00:00.000Z",
      });
      publishClaudeInboxEntry(root, newer);
      publishClaudeInboxEntry(root, older);
      const first = await waitForClaudeMemory({
        repoRoot: root,
        sessionId: "fifo",
        pollIntervalMs: 10,
        maxWaitMs: 40,
      });
      const second = await waitForClaudeMemory({
        repoRoot: root,
        sessionId: "fifo-2",
        pollIntervalMs: 10,
        maxWaitMs: 40,
      });
      expect(first.kind).toBe("delivered");
      expect(first.entry?.id).toBe(older.id);
      expect(second.kind).toBe("delivered");
      expect(second.entry?.id).toBe(newer.id);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("U-MEMWAKE-001補遺: inbox JSONを古い順で削除し、壊れエントリを先に除外しない", () => {
    const root = fixture();
    try {
      const now = Math.floor(Date.now() / 1000) - 10 * 24 * 60 * 60;
      const entry = buildClaudeInboxEntry({
        memory,
        operationId: "prune-check",
        workspaceId: claudeWorkspaceId(root),
      });
      publishClaudeInboxEntry(root, entry);
      const stale = join(
        root,
        ".git",
        "ut-tdd-runtime",
        "claude-memory-wake",
        "inbox",
        "stale.json",
      );
      writeFileSync(stale, `${JSON.stringify({ invalid: true })}\n`, "utf8");
      utimesSync(stale, now, now);

      expect(existsSync(stale)).toBe(true);
      return waitForClaudeMemory({
        repoRoot: root,
        sessionId: "prune",
        pollIntervalMs: 10,
        maxWaitMs: 40,
      }).then((result) => {
        expect(result.kind).toBe("delivered");
        expect(existsSync(stale)).toBe(false);
      });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("U-MEMWAKE-006補遺: generation ファイル喪失は superseded として早期収束する", async () => {
    const root = fixture();
    try {
      const generation = join(
        root,
        ".git",
        "ut-tdd-runtime",
        "claude-memory-wake",
        "session-id.generation",
      );
      const result = await waitForClaudeMemory({
        repoRoot: root,
        sessionId: "session-id",
        pollIntervalMs: 5,
        maxWaitMs: 300,
        sleep: async (ms: number) => {
          await new Promise<void>((resolve) => setTimeout(resolve, ms));
          rmSync(generation, { force: true });
        },
      });
      expect(result.kind).toBe("superseded");
      rmSync(generation, { force: true });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("U-MEMWAKE-007補遺: originRuntime は未指定時に system へ既定化される", () => {
    const root = fixture();
    try {
      const entry = buildClaudeInboxEntry({
        memory,
        operationId: "origin-default",
        workspaceId: claudeWorkspaceId(root),
      });
      expect(entry.originRuntime).toBe("system");
      expect(entry.originRuntime).not.toBe("codex");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("U-MEMWAKE-008: 監査jsonlが publish / claim の証跡を残す", async () => {
    const root = fixture();
    try {
      const entry = buildClaudeInboxEntry({
        memory,
        operationId: "audit",
        workspaceId: claudeWorkspaceId(root),
      });
      publishClaudeInboxEntry(root, entry);
      await waitForClaudeMemory({
        repoRoot: root,
        sessionId: "audit",
        pollIntervalMs: 10,
        maxWaitMs: 40,
      });
      const logPath = join(root, ".ut-tdd", "logs", "claude-memory-wake.jsonl");
      const raw = readFileSync(logPath, "utf8").trim().split("\n");
      const events = raw.map((line) => JSON.parse(line)).map((row) => row.event);
      expect(events).toContain("publish");
      expect(events).toContain("claim");
      expect(events.some((row) => row === "claim")).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("U-MEMWAKE-009: summarizeUnclaimedInbox がワークスペース別 backlog を返す", () => {
    const root = fixture();
    try {
      const workspaceId = claudeWorkspaceId(root);
      const entry = buildClaudeInboxEntry({
        memory,
        operationId: "summary-1",
        workspaceId,
        now: "2026-08-01T00:00:00.000Z",
      });
      publishClaudeInboxEntry(root, entry);
      const summary = summarizeUnclaimedInbox(root, workspaceId);
      expect(summary.pending).toBe(1);
      expect(summary.workspaceId).toBe(workspaceId);
      expect(summary.oldestEntryId).toBe(entry.id);
      expect(summary.oldestCreatedAt).toBe(entry.createdAt);
      expect(summary.oldestAgeMs).toBeGreaterThan(0);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
