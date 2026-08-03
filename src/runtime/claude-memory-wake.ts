import { execFileSync } from "node:child_process";
import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import type { MemoryEntry } from "../memory";

export const CLAUDE_INBOX_SCHEMA = "ut-tdd.claude-inbox/v1" as const;
export const CLAUDE_WAKE_BODY_MAX_CHARS = 8_000;

export interface ClaudeInboxEntry {
  readonly schemaVersion: typeof CLAUDE_INBOX_SCHEMA;
  readonly id: string;
  readonly memoryId: string;
  readonly body: string;
  readonly originRuntime: "codex" | "system";
  readonly operationId: string;
  readonly createdAt: string;
}

export interface ClaudeMemoryWakeResult {
  readonly kind: "delivered" | "timeout" | "superseded";
  readonly entry?: ClaudeInboxEntry;
  readonly message?: string;
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
    // Git外のfixtureはrepo-local runtime stateへ閉じる。
  }
  return join(repoRoot, ".ut-tdd", "state", "claude-memory-wake");
}

export function buildClaudeInboxEntry(input: {
  memory: MemoryEntry;
  operationId: string;
  originRuntime?: "codex" | "system";
  now?: string;
}): ClaudeInboxEntry {
  if (!input.operationId.trim()) throw new Error("claude_inbox_operation_id_required");
  return {
    schemaVersion: CLAUDE_INBOX_SCHEMA,
    id: `${input.memory.memory_id}:op:${input.operationId}`,
    memoryId: input.memory.memory_id,
    body: input.memory.body,
    originRuntime: input.originRuntime ?? "codex",
    operationId: input.operationId,
    createdAt: input.now ?? new Date().toISOString(),
  };
}

export function publishClaudeInboxEntry(repoRoot: string, entry: ClaudeInboxEntry): string {
  const directory = join(runtimeRoot(repoRoot), "inbox");
  mkdirSync(directory, { recursive: true });
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
  for (const name of readdirSync(root).filter(
    (candidate) => candidate.endsWith(".claim") || candidate.endsWith(".skip"),
  )) {
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
    .filter((entry) => entry.originRuntime !== "system" || entry.memoryId.startsWith("memory:"))
    .filter((entry) => !unavailableIds.has(entry.id))
    .sort(
      (left, right) =>
        left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id),
    )
    .at(-1);
}

function readInbox(repoRoot: string): ClaudeInboxEntry[] {
  const directory = join(runtimeRoot(repoRoot), "inbox");
  if (!existsSync(directory)) return [];
  return readdirSync(directory)
    .filter((name) => name.endsWith(".json"))
    .map((name) => decodeEntry(readFileSync(join(directory, name), "utf8")))
    .filter((entry): entry is ClaudeInboxEntry => entry !== undefined);
}

function claim(repoRoot: string, entry: ClaudeInboxEntry, sessionId: string, at: string): boolean {
  const root = runtimeRoot(repoRoot);
  mkdirSync(root, { recursive: true });
  const path = join(root, `${safeFilePart(entry.id)}.claim`);
  let descriptor: number;
  try {
    descriptor = openSync(path, "wx", 0o600);
  } catch {
    return false;
  }
  try {
    writeFileSync(descriptor, `${JSON.stringify({ id: entry.id, sessionId, deliveredAt: at })}\n`);
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
  const pollIntervalMs = Math.max(10, input.pollIntervalMs ?? 2_000);
  const maxWaitMs = Math.max(pollIntervalMs, input.maxWaitMs ?? 7_200_000);
  const now = input.now ?? (() => new Date().toISOString());
  const sleep =
    input.sleep ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
  const root = runtimeRoot(input.repoRoot);
  mkdirSync(root, { recursive: true });
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
    const entry = selectClaudeInboxEntry(readInbox(input.repoRoot), unavailable);
    if (entry) {
      if (claim(input.repoRoot, entry, input.sessionId, now())) {
        return { kind: "delivered", entry, message: renderClaudeWakeMessage(entry) };
      }
      unclaimable.add(entry.id);
      continue;
    }
    await sleep(pollIntervalMs);
  }
  return { kind: "timeout" };
}
