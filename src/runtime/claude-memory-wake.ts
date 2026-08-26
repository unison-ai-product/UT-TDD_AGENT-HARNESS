import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  appendFileSync,
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
import type { MemoryEntry } from "../memory/index.ts";
import { isCanonicalMemorySourcePath } from "../memory/service.ts";
import { ensureDir } from "../shared/fs.ts";
import { requireProjectMemoryRoot } from "./project-memory-root.ts";

export const CLAUDE_INBOX_SCHEMA = "ut-tdd.claude-inbox/v4" as const;
export const CLAUDE_INBOX_LEGACY_SCHEMA = "ut-tdd.claude-inbox/v3" as const;
export const CLAUDE_INBOX_LEGACY_V2_SCHEMA = "ut-tdd.claude-inbox/v2" as const;
export const CLAUDE_WAKE_BODY_MAX_CHARS = 8_000;
export const CLAUDE_INBOX_BACKLOG_WARN_AGE_MS = 15 * 60 * 1_000;
export const CLAUDE_WAKE_GENERATION_SCHEMA = "ut-tdd.claude-wake-generation/v1" as const;
export type ClaudeLiveWorkspaceRoutingFailure =
  | "no_live_claude_workspace"
  | "ambiguous_live_claude_workspace"
  | "stale_claude_workspace"
  | "incompatible_claude_workspace_schema";

export type ClaudeLiveWorkspaceResolution =
  | { readonly ok: true; readonly workspaceId: string; readonly sessionId: string }
  | { readonly ok: false; readonly reason: ClaudeLiveWorkspaceRoutingFailure };
export type ClaudeInboxWarningCode =
  | "age"
  | "target_mismatch"
  | "session_absent"
  | "session_unknown"
  | "hook_missing";

interface ClaudeInboxBase {
  readonly id: string;
  readonly memoryId: string;
  readonly body: string;
  readonly originRuntime: "codex" | "system";
  readonly operationId: string;
  readonly targetWorkspaceId: string;
  readonly projectId: string;
  readonly producerProvider: "codex" | "system";
  readonly producerSessionId: string;
  readonly targetProvider: "claude";
  readonly targetSessionId: string;
  readonly createdAt: string;
}

export interface ClaudeMemoryInboxEntry extends ClaudeInboxBase {
  readonly schemaVersion: typeof CLAUDE_INBOX_SCHEMA;
  readonly purpose: "memory";
}

export interface ClaudeReviewInboxEntry extends ClaudeInboxBase {
  readonly schemaVersion: typeof CLAUDE_INBOX_SCHEMA;
  readonly purpose: "review";
  readonly requestDigest: string;
  readonly requestPath: string;
  readonly memoryPath: string;
  readonly pr: number;
  readonly exactHead: string;
  readonly reviewRevision: string;
  readonly authorFamily: "codex" | "claude";
}

export interface ClaudeLegacyInboxEntry extends ClaudeInboxBase {
  readonly schemaVersion: typeof CLAUDE_INBOX_LEGACY_SCHEMA | typeof CLAUDE_INBOX_LEGACY_V2_SCHEMA;
  readonly purpose: "memory";
}

export type ClaudeInboxEntry =
  | ClaudeMemoryInboxEntry
  | ClaudeReviewInboxEntry
  | ClaudeLegacyInboxEntry;

export interface ClaudeMemoryWakeResult {
  readonly kind: "delivered" | "timeout" | "superseded";
  readonly entry?: ClaudeInboxEntry;
  readonly message?: string;
}

export interface ClaudeInboxBacklogSummary {
  readonly workspaceId: string;
  readonly pending: number;
  readonly oldestEntryId: string | null;
  readonly oldestCreatedAt: string | null;
  readonly oldestAgeMs: number | null;
  /** 共通runtime上の別workspace宛て未claim entry。strict filterで捨てない。 */
  readonly targetMismatchPending?: number;
  readonly targetMismatchOldestAgeMs?: number | null;
  /** workspace紐付けはmarkerに無い旧形式もあるため共有runtime単位の観測。 */
  readonly activeSessionCount?: number;
  readonly sessionStatus?: "active" | "absent" | "unknown";
  readonly hookConfigured?: boolean;
  readonly warningCodes?: readonly ClaudeInboxWarningCode[];
}

export interface ClaudeMemoryWakeHookStatus {
  readonly configured: boolean;
  readonly reason: "configured" | "settings_missing" | "settings_invalid" | "stop_hook_missing";
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

function inboxFileStem(entryId: string): string {
  const stableHash = createHash("sha256").update(entryId).digest("hex").slice(0, 12);
  const safeId = safeFilePart(entryId);
  return `${safeId.slice(0, 147)}_${stableHash}`;
}

function runtimeRoot(repoRoot: string): string {
  return join(requireProjectMemoryRoot(repoRoot).runtimeBusRoot, "claude-memory-wake");
}

function logPath(repoRoot: string): string {
  return join(repoRoot, ".ut-tdd", "logs", "claude-memory-wake.jsonl");
}

/**
 * Stop hookの配線はpublish成功からは導けない。settingsが壊れている場合も
 * configured扱いにせず、受信側が永遠に現れない可能性を警告面へ返す。
 */
export function inspectClaudeMemoryWakeHook(repoRoot: string): ClaudeMemoryWakeHookStatus {
  const settingsPath = join(repoRoot, ".claude", "settings.json");
  if (!existsSync(settingsPath)) return { configured: false, reason: "settings_missing" };
  try {
    const parsed = JSON.parse(readFileSync(settingsPath, "utf8")) as {
      hooks?: { Stop?: unknown };
    };
    const stop = parsed?.hooks?.Stop;
    if (stop === undefined || !JSON.stringify(stop).includes("claude-memory-wake")) {
      return { configured: false, reason: "stop_hook_missing" };
    }
    return { configured: true, reason: "configured" };
  } catch {
    return { configured: false, reason: "settings_invalid" };
  }
}

function warnPublishIsNotDelivery(hook: ClaudeMemoryWakeHookStatus): void {
  if (hook.configured) return;
  process.stderr.write(
    `claude-memory-wake warning: publish is pending, Stop hook unavailable (${hook.reason}); delivery is unconfirmed\n`,
  );
}

function writeAuditLog(repoRoot: string, event: Record<string, unknown>): void {
  try {
    const path = logPath(repoRoot);
    ensureDir(join(path, ".."), { recursive: true });
    appendFileSync(path, `${JSON.stringify({ at: new Date().toISOString(), ...event })}\n`, {
      encoding: "utf8",
      mode: 0o600,
    });
  } catch {
    // 監査は best effort
  }
}

export function buildClaudeInboxEntry(input: {
  memory: MemoryEntry;
  operationId: string;
  workspaceId: string;
  originRuntime?: "codex" | "system";
  projectId?: string;
  producerSessionId?: string;
  targetSessionId?: string;
  now?: string;
}): ClaudeMemoryInboxEntry {
  if (!input.operationId.trim()) throw new Error("claude_inbox_operation_id_required");
  if (!/^[a-f0-9]{64}$/.test(input.workspaceId)) {
    throw new Error("claude_inbox_workspace_id_invalid");
  }
  const originRuntime = input.originRuntime ?? "system";
  return {
    schemaVersion: CLAUDE_INBOX_SCHEMA,
    purpose: "memory",
    id: `${input.memory.memory_id}:workspace:${input.workspaceId}:session:${input.targetSessionId ?? "project-broadcast"}:op:${input.operationId}`,
    memoryId: input.memory.memory_id,
    body: input.memory.body,
    originRuntime,
    operationId: input.operationId,
    targetWorkspaceId: input.workspaceId,
    projectId: input.projectId ?? "fixture/project",
    producerProvider: originRuntime,
    producerSessionId: input.producerSessionId ?? input.operationId,
    targetProvider: "claude",
    targetSessionId: input.targetSessionId ?? "project-broadcast",
    createdAt: input.now ?? new Date().toISOString(),
  };
}

export function buildClaudeReviewInboxEntry(input: {
  memory: MemoryEntry;
  operationId: string;
  workspaceId: string;
  requestDigest: string;
  requestPath: string;
  pr: number;
  exactHead: string;
  reviewRevision: string;
  authorFamily: "codex" | "claude";
  originRuntime?: "codex" | "system";
  projectId?: string;
  producerSessionId?: string;
  targetSessionId?: string;
  now?: string;
}): ClaudeReviewInboxEntry {
  const memoryEntry = buildClaudeInboxEntry(input);
  const review = {
    requestDigest: input.requestDigest,
    requestPath: input.requestPath,
    memoryPath: input.memory.source_path,
    pr: input.pr,
    exactHead: input.exactHead,
    reviewRevision: input.reviewRevision,
    authorFamily: input.authorFamily,
  };
  if (!isValidReviewIdentity(review)) throw new Error("claude_inbox_review_identity_invalid");
  return {
    ...memoryEntry,
    purpose: "review",
    targetSessionId: input.targetSessionId ?? input.workspaceId,
    ...review,
  };
}

export function publishClaudeInboxEntry(repoRoot: string, entry: ClaudeInboxEntry): string {
  const project = requireProjectMemoryRoot(repoRoot);
  if (entry.projectId !== "legacy-unbound" && entry.projectId !== project.projectId) {
    throw new Error("claude_inbox_project_mismatch");
  }
  const directory = join(runtimeRoot(repoRoot), "inbox");
  ensureDir(directory, { recursive: true });
  const target = join(directory, `${inboxFileStem(entry.id)}.json`);
  const serialized = JSON.stringify(entry);
  if (existsSync(target)) {
    if (readFileSync(target, "utf8").trim() === serialized) {
      const hook = inspectClaudeMemoryWakeHook(repoRoot);
      warnPublishIsNotDelivery(hook);
      writeAuditLog(repoRoot, {
        event: "publish",
        status: "idempotent",
        entryId: entry.id,
        operationId: entry.operationId,
        deliveryState: "pending",
        deliveryConfirmed: false,
        hookConfigured: hook.configured,
        warningCodes: hook.configured ? [] : ["hook_missing"],
      });
      return target;
    }
    writeAuditLog(repoRoot, {
      event: "publish",
      status: "conflict",
      entryId: entry.id,
      operationId: entry.operationId,
    });
    throw new Error("claude_inbox_projection_conflict");
  }
  const descriptor = openSync(target, "wx", 0o600);
  try {
    writeFileSync(descriptor, `${serialized}\n`);
  } finally {
    closeSync(descriptor);
  }
  const hook = inspectClaudeMemoryWakeHook(repoRoot);
  warnPublishIsNotDelivery(hook);
  writeAuditLog(repoRoot, {
    event: "publish",
    status: "created",
    entryId: entry.id,
    operationId: entry.operationId,
    // projection fileの作成は受信sessionへの配送確認ではない。
    deliveryState: "pending",
    deliveryConfirmed: false,
    hookConfigured: hook.configured,
    warningCodes: hook.configured ? [] : ["hook_missing"],
  });
  return target;
}

function hasExactKeys(value: object, expected: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const orderedExpected = [...expected].sort();
  return (
    actual.length === orderedExpected.length &&
    actual.every((key, index) => key === orderedExpected[index])
  );
}

function isValidReviewIdentity(value: {
  requestDigest: string;
  requestPath: string;
  memoryPath: string;
  pr: number;
  exactHead: string;
  reviewRevision: string;
  authorFamily: "codex" | "claude";
}): boolean {
  const normalizedRequestPath = value.requestPath.replaceAll("\\", "/");
  return (
    /^[a-f0-9]{16,64}$/.test(value.requestDigest) &&
    (normalizedRequestPath.endsWith(`/.ut-tdd/review/requests/${value.requestDigest}.json`) ||
      normalizedRequestPath === `.ut-tdd/review/requests/${value.requestDigest}.json`) &&
    isCanonicalMemorySourcePath(value.memoryPath) &&
    Number.isInteger(value.pr) &&
    value.pr > 0 &&
    /^[a-f0-9]{40}$/.test(value.exactHead) &&
    value.reviewRevision.trim().length > 0 &&
    ["codex", "claude"].includes(value.authorFamily)
  );
}

export function decodeClaudeInboxEntry(value: string): ClaudeInboxEntry | undefined {
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return undefined;
    const legacy =
      parsed.schemaVersion === CLAUDE_INBOX_LEGACY_SCHEMA ||
      parsed.schemaVersion === CLAUDE_INBOX_LEGACY_V2_SCHEMA;
    const purpose = legacy ? "memory" : parsed.purpose;
    const baseKeys = [
      "schemaVersion",
      "id",
      "memoryId",
      "body",
      "originRuntime",
      "operationId",
      "targetWorkspaceId",
      "createdAt",
    ];
    const projectKeys = [
      "projectId",
      "producerProvider",
      "producerSessionId",
      "targetProvider",
      "targetSessionId",
    ];
    const expectedKeys = legacy
      ? baseKeys
      : purpose === "memory"
        ? [...baseKeys, ...projectKeys, "purpose"]
        : purpose === "review"
          ? [
              ...baseKeys,
              ...projectKeys,
              "purpose",
              "requestDigest",
              "requestPath",
              "memoryPath",
              "pr",
              "exactHead",
              "reviewRevision",
              "authorFamily",
            ]
          : [];
    if (!hasExactKeys(parsed, expectedKeys)) return undefined;
    const entry = parsed as unknown as ClaudeInboxEntry;
    if (
      (!legacy && entry.schemaVersion !== CLAUDE_INBOX_SCHEMA) ||
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
    if (legacy)
      return {
        ...entry,
        purpose: "memory",
        projectId: "legacy-unbound",
        producerProvider: entry.originRuntime,
        producerSessionId: entry.operationId,
        targetProvider: "claude",
        targetSessionId: entry.targetWorkspaceId,
      } as ClaudeLegacyInboxEntry;
    if (
      !entry.projectId.trim() ||
      entry.producerProvider !== entry.originRuntime ||
      !entry.producerSessionId.trim() ||
      entry.targetProvider !== "claude" ||
      !entry.targetSessionId.trim()
    )
      return undefined;
    if (entry.purpose === "memory") return entry;
    if (entry.purpose !== "review" || !isValidReviewIdentity(entry)) return undefined;
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
    .at(0);
}

const RETENTION_MS = 7 * 24 * 60 * 60 * 1_000;

function pruneRuntimeFiles(root: string, nowMs: number): void {
  if (!existsSync(root)) return;
  for (const directory of [root, join(root, "inbox")]) {
    if (!existsSync(directory)) continue;
    for (const name of readdirSync(directory)) {
      if (!name.endsWith(".claim") && !name.endsWith(".generation") && !name.endsWith(".json"))
        continue;
      const path = join(directory, name);
      try {
        const stat = statSync(path);
        if (stat.isFile() && nowMs - stat.mtimeMs > RETENTION_MS) unlinkSync(path);
      } catch {
        // 競合削除は次回GCへ委ねる。
      }
    }
  }
}

function readInbox(repoRoot: string): ClaudeInboxEntry[] {
  const projectId = requireProjectMemoryRoot(repoRoot).projectId;
  const directory = join(runtimeRoot(repoRoot), "inbox");
  if (!existsSync(directory)) return [];
  return readdirSync(directory)
    .filter((name) => name.endsWith(".json"))
    .map((name) => {
      try {
        return decodeClaudeInboxEntry(readFileSync(join(directory, name), "utf8"));
      } catch {
        return undefined;
      }
    })
    .filter(
      (entry): entry is ClaudeInboxEntry => entry !== undefined && entry.projectId === projectId,
    );
}

function summarizeEntries(
  entries: readonly ClaudeInboxEntry[],
  workspaceId: string,
): ClaudeInboxBacklogSummary {
  if (entries.length === 0) {
    return {
      workspaceId,
      pending: 0,
      oldestEntryId: null,
      oldestCreatedAt: null,
      oldestAgeMs: null,
      targetMismatchPending: 0,
      targetMismatchOldestAgeMs: null,
      activeSessionCount: 0,
      sessionStatus: "absent",
      hookConfigured: false,
      warningCodes: [],
    };
  }

  const ordered = [...entries].sort(
    (left, right) =>
      left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id),
  );
  const oldest = ordered[0];
  return {
    workspaceId,
    pending: entries.length,
    oldestEntryId: oldest.id,
    oldestCreatedAt: oldest.createdAt,
    oldestAgeMs: Date.now() - Date.parse(oldest.createdAt),
    targetMismatchPending: 0,
    targetMismatchOldestAgeMs: null,
    activeSessionCount: 0,
    sessionStatus: "absent",
    hookConfigured: false,
    warningCodes: [],
  };
}

interface ClaudeSessionObservation {
  readonly activeSessionCount: number;
  readonly sessionStatus: "active" | "absent" | "unknown";
}

function readGenerationMarker(path: string): {
  generation: string;
  workspaceId: string;
  sessionId: string;
  inboxSchema?: string;
} | null {
  try {
    const value: unknown = JSON.parse(readFileSync(path, "utf8"));
    if (
      typeof value !== "object" ||
      value === null ||
      (value as { schema?: unknown }).schema !== CLAUDE_WAKE_GENERATION_SCHEMA ||
      typeof (value as { generation?: unknown }).generation !== "string" ||
      typeof (value as { workspaceId?: unknown }).workspaceId !== "string" ||
      typeof (value as { sessionId?: unknown }).sessionId !== "string"
    )
      return null;
    const inboxSchema = (value as { inboxSchema?: unknown }).inboxSchema;
    return {
      generation: (value as { generation: string }).generation,
      workspaceId: (value as { workspaceId: string }).workspaceId,
      sessionId: (value as { sessionId: string }).sessionId,
      ...(typeof inboxSchema === "string" ? { inboxSchema } : {}),
    };
  } catch {
    return null;
  }
}

/**
 * Resolve a live Claude VS Code consumer independently from the subject
 * worktree that authored the canonical review request.  Generation markers
 * are runtime state in the shared git common dir; only one fresh, compatible
 * workspace may be selected.  The caller keeps the canonical request intact
 * when this returns a typed failure so it remains visible as backlog.
 */
export function resolveLiveClaudeWorkspace(repoRoot: string): ClaudeLiveWorkspaceResolution {
  const root = runtimeRoot(repoRoot);
  if (!existsSync(root)) return { ok: false, reason: "no_live_claude_workspace" };

  const targets = new Map<string, { workspaceId: string; sessionId: string }>();
  let markerCount = 0;
  let staleMarkerCount = 0;
  let incompatibleMarker = false;
  for (const name of readdirSync(root).filter((entry) => entry.endsWith(".generation"))) {
    markerCount += 1;
    const path = join(root, name);
    let stat: ReturnType<typeof statSync>;
    try {
      stat = statSync(path);
    } catch {
      incompatibleMarker = true;
      continue;
    }
    if (Date.now() - stat.mtimeMs > CLAUDE_INBOX_BACKLOG_WARN_AGE_MS) {
      staleMarkerCount += 1;
      continue;
    }
    const marker = readGenerationMarker(path);
    if (
      !marker ||
      !/^[a-f0-9]{64}$/.test(marker.workspaceId) ||
      marker.inboxSchema !== CLAUDE_INBOX_SCHEMA
    ) {
      incompatibleMarker = true;
      continue;
    }
    targets.set(`${marker.workspaceId}\0${marker.sessionId}`, {
      workspaceId: marker.workspaceId,
      sessionId: marker.sessionId,
    });
  }

  if (incompatibleMarker) {
    return { ok: false, reason: "incompatible_claude_workspace_schema" };
  }
  if (targets.size > 1) {
    return { ok: false, reason: "ambiguous_live_claude_workspace" };
  }
  if (targets.size === 1) {
    return { ok: true, ...[...targets.values()][0] };
  }
  return {
    ok: false,
    reason:
      markerCount > 0 && staleMarkerCount === markerCount
        ? "stale_claude_workspace"
        : "no_live_claude_workspace",
  };
}

function observeClaudeSessions(
  root: string,
  workspaceId: string,
  nowMs = Date.now(),
): ClaudeSessionObservation {
  if (!existsSync(root)) return { activeSessionCount: 0, sessionStatus: "absent" };
  let freshMarkerCount = 0;
  let activeSessionCount = 0;
  for (const name of readdirSync(root).filter((entry) => entry.endsWith(".generation"))) {
    try {
      if (nowMs - statSync(join(root, name)).mtimeMs > CLAUDE_INBOX_BACKLOG_WARN_AGE_MS) continue;
      freshMarkerCount += 1;
      if (readGenerationMarker(join(root, name))?.workspaceId === workspaceId)
        activeSessionCount += 1;
    } catch {
      freshMarkerCount += 1;
    }
  }
  return {
    activeSessionCount,
    sessionStatus: activeSessionCount > 0 ? "active" : freshMarkerCount > 0 ? "unknown" : "absent",
  };
}

export function summarizeUnclaimedInbox(
  repoRoot: string,
  workspaceId: string,
): ClaudeInboxBacklogSummary {
  const root = runtimeRoot(repoRoot);
  const claimed = new Set(claimedIds(root));
  const all = readInbox(repoRoot).filter((entry) => !claimed.has(entry.id));
  const entries = all.filter((entry) => entry.targetWorkspaceId === workspaceId);
  const foreign = all.filter((entry) => entry.targetWorkspaceId !== workspaceId);
  const own = summarizeEntries(entries, workspaceId);
  const foreignOrdered = [...foreign].sort(
    (left, right) =>
      left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id),
  );
  const targetMismatchOldest = foreignOrdered[0];
  const sessions = observeClaudeSessions(root, workspaceId);
  const hook = inspectClaudeMemoryWakeHook(repoRoot);
  const totalPending = all.length;
  const warnings = new Set<ClaudeInboxWarningCode>();
  if ((own.oldestAgeMs ?? 0) >= CLAUDE_INBOX_BACKLOG_WARN_AGE_MS) warnings.add("age");
  if (foreign.length > 0) warnings.add("target_mismatch");
  if (totalPending > 0 && sessions.sessionStatus === "absent") warnings.add("session_absent");
  if (totalPending > 0 && sessions.sessionStatus === "unknown") warnings.add("session_unknown");
  if (totalPending > 0 && !hook.configured) warnings.add("hook_missing");
  return {
    ...own,
    targetMismatchPending: foreign.length,
    targetMismatchOldestAgeMs: targetMismatchOldest
      ? Date.now() - Date.parse(targetMismatchOldest.createdAt)
      : null,
    activeSessionCount: sessions.activeSessionCount,
    sessionStatus: sessions.sessionStatus,
    hookConfigured: hook.configured,
    warningCodes: [...warnings],
  };
}

function claim(input: {
  repoRoot: string;
  entry: ClaudeInboxEntry;
  sessionId: string;
  at: string;
}): boolean {
  const root = runtimeRoot(input.repoRoot);
  ensureDir(root, { recursive: true });
  const path = join(root, `${inboxFileStem(input.entry.id)}.claim`);
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
        projectId: input.entry.projectId,
        memoryId: input.entry.memoryId,
        operationId: input.entry.operationId,
        provider: "claude",
        sessionId: input.sessionId,
        targetSessionId: input.entry.targetSessionId,
        entryDigest: createHash("sha256").update(JSON.stringify(input.entry)).digest("hex"),
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
    project_id: entry.projectId,
    operation_id: entry.operationId,
    producer_provider: entry.producerProvider,
    producer_session_id: entry.producerSessionId,
    target_provider: entry.targetProvider,
    target_session_id: entry.targetSessionId,
    purpose: entry.purpose,
    ...(entry.purpose === "review"
      ? {
          request_digest: entry.requestDigest,
          request_path: entry.requestPath,
          memory_path: entry.memoryPath,
          pr: entry.pr,
          exact_head: entry.exactHead,
          review_revision: entry.reviewRevision,
          author_family: entry.authorFamily,
        }
      : {}),
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
  writeFileSync(
    generationPath,
    `${JSON.stringify({
      schema: CLAUDE_WAKE_GENERATION_SCHEMA,
      generation,
      workspaceId,
      sessionId: input.sessionId,
      inboxSchema: CLAUDE_INBOX_SCHEMA,
    })}\n`,
    { encoding: "utf8", mode: 0o600 },
  );
  const started = Date.now();
  const unclaimable = new Set<string>();
  for (;;) {
    let currentGeneration: string | null = null;
    try {
      if (!existsSync(generationPath)) {
        writeAuditLog(input.repoRoot, {
          event: "supersede",
          reason: "generation_file_missing",
          sessionId: input.sessionId,
        });
        return { kind: "superseded" };
      }
      currentGeneration = readGenerationMarker(generationPath)?.generation ?? null;
    } catch {
      writeAuditLog(input.repoRoot, {
        event: "supersede",
        reason: "generation_read_failed",
        sessionId: input.sessionId,
      });
      return { kind: "superseded" };
    }
    if (currentGeneration !== generation) {
      writeAuditLog(input.repoRoot, {
        event: "supersede",
        reason: "generation_changed",
        sessionId: input.sessionId,
      });
      return { kind: "superseded" };
    }
    // Deadline and supersession may become observable in the same poll.  The
    // generation fence is authoritative, so inspect it before returning timeout.
    if (Date.now() - started >= maxWaitMs) return { kind: "timeout" };
    const unavailable = claimedIds(root);
    for (const id of unclaimable) unavailable.add(id);
    const entry = selectClaudeInboxEntry(
      readInbox(input.repoRoot).filter(
        (candidate) =>
          candidate.targetWorkspaceId === workspaceId &&
          (candidate.targetSessionId === "project-broadcast" ||
            candidate.targetSessionId === input.sessionId),
      ),
      unavailable,
    );
    if (entry) {
      if (claim({ repoRoot: input.repoRoot, entry, sessionId: input.sessionId, at: now() })) {
        writeAuditLog(input.repoRoot, {
          event: "claim",
          status: "ok",
          entryId: entry.id,
          operationId: entry.operationId,
          sessionId: input.sessionId,
        });
        try {
          unlinkSync(join(root, "inbox", `${inboxFileStem(entry.id)}.json`));
        } catch {
          // claim が配送の正本。inbox GC は次回へ委ねる。
        }
        return { kind: "delivered", entry, message: renderClaudeWakeMessage(entry) };
      }
      writeAuditLog(input.repoRoot, {
        event: "claim",
        status: "skip",
        entryId: entry.id,
        operationId: entry.operationId,
        sessionId: input.sessionId,
        reason: "already_claimed",
      });
      unclaimable.add(entry.id);
      continue;
    }
    await sleep(pollIntervalMs);
  }
}
