import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  closeSync,
  existsSync,
  openSync,
  readdirSync,
  readFileSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import type { MemoryEntry } from "../memory";
import { ensureDir } from "../shared/fs";

export const CLAUDE_INBOX_SCHEMA = "ut-tdd.claude-inbox/v2" as const;
export const CLAUDE_WAKE_BODY_MAX_CHARS = 8_000;

export interface ClaudeInboxEntry {
  readonly schemaVersion: typeof CLAUDE_INBOX_SCHEMA;
  readonly id: string;
  readonly memoryId: string;
  readonly body: string;
  readonly originRuntime: "codex" | "system";
  readonly operationId: string;
  readonly targetWorkspaceId: string;
  readonly createdAt: string;
}

export interface ClaudeMemoryWakeResult {
  readonly kind: "delivered" | "timeout" | "superseded";
  readonly entry?: ClaudeInboxEntry;
  readonly message?: string;
}

export function isClaudeMemoryWakeTarget(env: NodeJS.ProcessEnv): boolean {
  return (
    env.CLAUDE_CODE_ENTRYPOINT === "claude-vscode" && env.UT_TDD_DISABLE_CLAUDE_MEMORY_WAKE !== "1"
  );
}

export function resolveClaudeWakeDelay(value: string | undefined, fallback: number): number {
  return value?.trim() ? Number(value) : fallback;
}

export function claudeWorkspaceId(repoRoot: string): string {
  try {
    const worktreeRoot = execFileSync("git", ["rev-parse", "--show-toplevel"], {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (!worktreeRoot) throw new Error("empty");
    const normalized = process.platform === "win32" ? worktreeRoot.toLowerCase() : worktreeRoot;
    return createHash("sha256").update(normalized.replaceAll("\\", "/")).digest("hex");
  } catch {
    throw new Error("claude_workspace_git_root_required");
  }
}

function safeFilePart(value: string): string {
  return value.replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 160);
}

function runtimeRoot(repoRoot: string): string {
  try {
    const commonDir = execFileSync(
      "git",
      ["rev-parse", "--path-format=absolute", "--git-common-dir"],
      { cwd: repoRoot, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    ).trim();
    if (commonDir) return join(commonDir, "ut-tdd-runtime", "claude-memory-wake");
  } catch {
    throw new Error("claude_inbox_git_common_dir_required");
  }
  throw new Error("claude_inbox_git_common_dir_required");
}

export function buildClaudeInboxEntry(input: {
  memory: MemoryEntry;
  operationId: string;
  workspaceId: string;
  originRuntime?: "codex" | "system";
  now?: string;
}): ClaudeInboxEntry {
  if (!input.operationId.trim()) throw new Error("claude_inbox_operation_id_required");
  if (!/^[a-f0-9]{64}$/.test(input.workspaceId)) {
    throw new Error("claude_inbox_workspace_id_invalid");
  }
  return {
    schemaVersion: CLAUDE_INBOX_SCHEMA,
    id: `${input.memory.memory_id}:workspace:${input.workspaceId}:op:${input.operationId}`,
    memoryId: input.memory.memory_id,
    body: input.memory.body,
    originRuntime: input.originRuntime ?? "codex",
    operationId: input.operationId,
    targetWorkspaceId: input.workspaceId,
    createdAt: input.now ?? new Date().toISOString(),
  };
}

export function publishClaudeInboxEntry(repoRoot: string, entry: ClaudeInboxEntry): string {
  const directory = join(runtimeRoot(repoRoot), "inbox");
  ensureDir(directory, { recursive: true });
  const target = join(directory, `${safeFilePart(entry.id)}.json`);
  const serialized = JSON.stringify(entry);
  if (existsSync(target)) {
    if (readFileSync(target, "utf8").trim() === serialized) return target;
    throw new Error("claude_inbox_projection_conflict");
  }
  const descriptor = openSync(target, "wx", 0o600);
  try {
    writeFileSync(descriptor, `${serialized}\n`);
  } finally {
    closeSync(descriptor);
  }
  return target;
}

function decodeEntry(value: string): ClaudeInboxEntry | undefined {
  try {
    const entry = JSON.parse(value) as ClaudeInboxEntry;
    if (
      entry.schemaVersion !== CLAUDE_INBOX_SCHEMA ||
      !entry.id ||
      !entry.memoryId.startsWith("memory:") ||
      !entry.body.trim() ||
      !["codex", "system"].includes(entry.originRuntime) ||
      !entry.operationId.trim() ||
      !/^[a-f0-9]{64}$/.test(entry.targetWorkspaceId) ||
      !Number.isFinite(Date.parse(entry.createdAt))
    ) {
      return undefined;
    }
    return entry;
  } catch {
    return undefined;
  }
}

function claimedIds(root: string): Set<string> {
  const ids = new Set<string>();
  if (!existsSync(root)) return ids;
  for (const name of readdirSync(root).filter((candidate) => candidate.endsWith(".claim"))) {
    try {
      const value = JSON.parse(readFileSync(join(root, name), "utf8")) as { id?: unknown };
      if (typeof value.id === "string") ids.add(value.id);
    } catch {
      // 破損claimは他entryをstarveさせない。
    }
  }
  return ids;
}

export function selectClaudeInboxEntry(
  entries: readonly ClaudeInboxEntry[],
  unavailableIds: ReadonlySet<string>,
): ClaudeInboxEntry | undefined {
  return entries
    .filter((entry) => !unavailableIds.has(entry.id))
    .sort(
      (left, right) =>
        left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id),
    )
    .at(-1);
}

const RETENTION_MS = 7 * 24 * 60 * 60 * 1_000;

function pruneRuntimeFiles(root: string, nowMs: number): void {
  if (!existsSync(root)) return;
  for (const name of readdirSync(root)) {
    if (!name.endsWith(".claim") && !name.endsWith(".generation")) continue;
    const path = join(root, name);
    try {
      if (nowMs - statSync(path).mtimeMs > RETENTION_MS) unlinkSync(path);
    } catch {
      // 競合削除は次回GCへ委ねる。
    }
  }
}

function readInbox(repoRoot: string): ClaudeInboxEntry[] {
  const directory = join(runtimeRoot(repoRoot), "inbox");
  if (!existsSync(directory)) return [];
  return readdirSync(directory)
    .filter((name) => name.endsWith(".json"))
    .map((name) => decodeEntry(readFileSync(join(directory, name), "utf8")))
    .filter((entry): entry is ClaudeInboxEntry => entry !== undefined);
}

function claim(input: {
  repoRoot: string;
  entry: ClaudeInboxEntry;
  sessionId: string;
  at: string;
}): boolean {
  const root = runtimeRoot(input.repoRoot);
  ensureDir(root, { recursive: true });
  const path = join(root, `${safeFilePart(input.entry.id)}.claim`);
  let descriptor: number;
  try {
    descriptor = openSync(path, "wx", 0o600);
  } catch {
    return false;
  }
  try {
    writeFileSync(
      descriptor,
      `${JSON.stringify({
        id: input.entry.id,
        sessionId: input.sessionId,
        deliveredAt: input.at,
      })}\n`,
    );
  } finally {
    closeSync(descriptor);
  }
  return true;
}

export function renderClaudeWakeMessage(entry: ClaudeInboxEntry): string {
  const body = [...entry.body].slice(0, CLAUDE_WAKE_BODY_MAX_CHARS).join("");
  const notification = JSON.stringify({
    memory_id: entry.memoryId,
    operation_id: entry.operationId,
    body,
  })
    .replaceAll("[", "\\u005b")
    .replaceAll("<", "\\u003c");
  return [
    "[UT_TDD_CLAUDE_INBOX]",
    "共有HARNESSメモリからの通知データです。現行契約・HEAD・CIを再確認して処理してください。",
    `notification_json:${notification}`,
    "[/UT_TDD_CLAUDE_INBOX]",
  ].join("\n");
}

export async function waitForClaudeMemory(input: {
  repoRoot: string;
  sessionId: string;
  pollIntervalMs?: number;
  maxWaitMs?: number;
  now?: () => string;
  sleep?: (ms: number) => Promise<void>;
}): Promise<ClaudeMemoryWakeResult> {
  const requestedPollMs = input.pollIntervalMs ?? 2_000;
  const requestedMaxMs = input.maxWaitMs ?? 900_000;
  if (!Number.isFinite(requestedPollMs) || requestedPollMs <= 0) {
    throw new Error("claude_wake_poll_interval_invalid");
  }
  if (!Number.isFinite(requestedMaxMs) || requestedMaxMs <= 0) {
    throw new Error("claude_wake_max_wait_invalid");
  }
  const pollIntervalMs = Math.max(10, requestedPollMs);
  const maxWaitMs = Math.max(pollIntervalMs, requestedMaxMs);
  const now = input.now ?? (() => new Date().toISOString());
  const sleep =
    input.sleep ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
  const root = runtimeRoot(input.repoRoot);
  const workspaceId = claudeWorkspaceId(input.repoRoot);
  ensureDir(root, { recursive: true });
  pruneRuntimeFiles(root, Date.now());
  const generationPath = join(root, `${safeFilePart(input.sessionId)}.generation`);
  const generation = `${process.pid}:${Date.now()}`;
  writeFileSync(generationPath, `${generation}\n`, { encoding: "utf8", mode: 0o600 });
  const started = Date.now();
  const unclaimable = new Set<string>();
  while (Date.now() - started < maxWaitMs) {
    if (readFileSync(generationPath, "utf8").trim() !== generation) {
      return { kind: "superseded" };
    }
    const unavailable = claimedIds(root);
    for (const id of unclaimable) unavailable.add(id);
    const entry = selectClaudeInboxEntry(
      readInbox(input.repoRoot).filter((candidate) => candidate.targetWorkspaceId === workspaceId),
      unavailable,
    );
    if (entry) {
      if (claim({ repoRoot: input.repoRoot, entry, sessionId: input.sessionId, at: now() })) {
        try {
          unlinkSync(join(root, "inbox", `${safeFilePart(entry.id)}.json`));
        } catch {
          // claim が配送の正本。inbox GC は次回へ委ねる。
        }
        return { kind: "delivered", entry, message: renderClaudeWakeMessage(entry) };
      }
      unclaimable.add(entry.id);
      continue;
    }
    await sleep(pollIntervalMs);
  }
  return { kind: "timeout" };
}
