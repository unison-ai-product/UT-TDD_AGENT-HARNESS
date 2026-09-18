import { createHash } from "node:crypto";
import {
  closeSync,
  existsSync,
  lstatSync,
  mkdirSync,
  openSync,
  readdirSync,
  readFileSync,
  realpathSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, isAbsolute, join, normalize, relative, resolve } from "node:path";
import { parseMemoryFile } from "../memory/index.ts";
import {
  buildClaudeProviderReviewInboxEntry,
  decodeClaudeInboxEntry,
} from "./claude-memory-wake.ts";
import {
  CLAUDE_PROVIDER_INBOX_SCHEMA,
  type ClaudeProviderReviewInboxEntry,
} from "./claude-provider-envelope.ts";
import { requireProjectMemoryRoot } from "./project-memory-root.ts";

export const CODEX_MEMORY_WAKE_SURFACE_SCHEMA = "ut-tdd.codex-memory-wake/v1" as const;
export const CODEX_MEMORY_WAKE_ROOT = "codex-memory-wake" as const;
export const CODEX_MEMORY_WAKE_CLAIM_SCHEMA = "ut-tdd.codex-memory-wake-claim/v1" as const;
export const CODEX_MEMORY_WAKE_BACKLOG_SCHEMA = "ut-tdd.codex-memory-wake-backlog/v1" as const;
export const CODEX_MEMORY_WAKE_TERMINAL_SCHEMA = "ut-tdd.codex-memory-wake-terminal/v1" as const;
export const CODEX_MEMORY_WAKE_LEASE_MS = 15 * 60 * 1_000;
export const CODEX_MEMORY_WAKE_TERMINAL_RETENTION_MS = 7 * 24 * 60 * 60 * 1_000;

interface ReviewWakeRequest {
  readonly memoryId: string;
  readonly pr: number;
  readonly exactHead: string;
  readonly reviewRevision: string;
  readonly authorFamily: "codex" | "claude";
  readonly requestedAt: string;
  readonly invocationNonce?: string;
}

export interface CanonicalReviewWake {
  readonly purpose: "review";
  readonly reviewer: "codex" | "claude";
  readonly requestDigest: string;
  readonly requestPath: string;
  readonly request: ReviewWakeRequest;
  readonly memoryPath: string;
}

interface ClaudeReviewEnvelopeEntry {
  readonly memoryId: string;
  readonly memoryPath: string;
  readonly requestDigest: string;
  readonly requestPath: string;
  readonly pr: number;
  readonly exactHead: string;
  readonly reviewRevision: string;
  readonly authorFamily: "codex" | "claude";
}

export type CodexReviewWakeFailure =
  | "codex_review_target_session_unavailable"
  | "codex_review_wake_projection_conflict"
  | "review_wake_publish_failed";

export class CodexReviewWakeError extends Error {
  readonly reason: CodexReviewWakeFailure;

  constructor(reason: CodexReviewWakeFailure) {
    super(reason);
    this.name = "CodexReviewWakeError";
    this.reason = reason;
  }
}

export type CodexMemoryWakeSurface =
  | {
      readonly schema: typeof CODEX_MEMORY_WAKE_SURFACE_SCHEMA;
      readonly status: "pending";
      readonly deliveryConfirmed: false;
      readonly envelopePath: string;
      readonly requestDigest: string;
      readonly pr: number;
      readonly exactHead: string;
      readonly reviewRevision: string;
      readonly invalidCount: number;
      readonly reason: "codex_review_pending";
    }
  | {
      readonly schema: typeof CODEX_MEMORY_WAKE_SURFACE_SCHEMA;
      readonly status: "empty";
      readonly deliveryConfirmed: false;
    }
  | {
      readonly schema: typeof CODEX_MEMORY_WAKE_SURFACE_SCHEMA;
      readonly status: "invalid";
      readonly deliveryConfirmed: false;
      readonly invalidCount: number;
      readonly reason:
        | "codex_review_wake_envelope_invalid"
        | "codex_review_target_session_unavailable";
    };

interface CodexWakeClaim {
  readonly schema: typeof CODEX_MEMORY_WAKE_CLAIM_SCHEMA;
  readonly entryId: string;
  readonly requestDigest: string;
  readonly targetSessionId: string;
  readonly claimedAt: string;
  readonly leaseExpiresAt: string;
}

interface CodexWakeTerminal {
  readonly schema: typeof CODEX_MEMORY_WAKE_TERMINAL_SCHEMA;
  readonly entryId: string;
  readonly requestDigest: string;
  readonly requestPath: string;
  readonly memoryPath: string;
  readonly pr: number;
  readonly exactHead: string;
  readonly reviewRevision: string;
  readonly authorFamily: "codex" | "claude";
  readonly terminalAt: string;
  readonly reason: "claimed";
}

interface CodexWakeBacklog {
  readonly schema: typeof CODEX_MEMORY_WAKE_BACKLOG_SCHEMA;
  readonly requestDigest: string;
  readonly requestPath: string;
  readonly memoryPath: string;
  readonly request: ReviewWakeRequest;
  readonly createdAt: string;
  readonly reason: CodexReviewWakeFailure;
}

function safeFilePart(value: string): string {
  return value.replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 160);
}

function entryStem(entryId: string): string {
  const hash = createHash("sha256").update(entryId).digest("hex").slice(0, 12);
  return `${safeFilePart(entryId).slice(0, 147)}_${hash}`;
}

function rootFor(repoRoot: string): string {
  return join(requireProjectMemoryRoot(repoRoot).runtimeBusRoot, CODEX_MEMORY_WAKE_ROOT);
}

export function codexWakeInboxRoot(repoRoot: string): string {
  return join(rootFor(repoRoot), "inbox");
}

export function isCodexReviewWakePath(repoRoot: string, candidate: string): boolean {
  const inbox = resolve(codexWakeInboxRoot(repoRoot));
  const normalized = resolve(candidate);
  const rel = relative(inbox, normalized);
  return rel !== "" && !rel.startsWith("..") && !isAbsolute(rel) && rel.endsWith(".json");
}

function claimsRoot(repoRoot: string): string {
  return join(rootFor(repoRoot), "claims");
}

function backlogRoot(repoRoot: string): string {
  return join(rootFor(repoRoot), "backlog");
}

function terminalRoot(repoRoot: string): string {
  return join(rootFor(repoRoot), "terminal");
}

function terminalMarkerPath(repoRoot: string, entryId: string): string {
  return join(terminalRoot(repoRoot), `${entryStem(entryId)}.json`);
}

function targetSession(): string {
  const value = process.env.CODEX_REVIEW_TARGET_SESSION?.trim();
  if (!value) throw new CodexReviewWakeError("codex_review_target_session_unavailable");
  return value;
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
      .map(([key, entry]) => `${JSON.stringify(key)}:${canonicalJson(entry)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

/** Windows runners may spell the same checkout with an 8.3 short path. */
function samePath(left: string, right: string): boolean {
  try {
    return realpathSync.native(left) === realpathSync.native(right);
  } catch {
    const normalizedLeft = normalize(left);
    const normalizedRight = normalize(right);
    return process.platform === "win32"
      ? normalizedLeft.toLowerCase() === normalizedRight.toLowerCase()
      : normalizedLeft === normalizedRight;
  }
}

function reviewRequestDigest(request: ReviewWakeRequest): string {
  return createHash("sha256")
    .update(
      canonicalJson({
        schemaVersion: "review-request/v1",
        memoryId: request.memoryId,
        pr: request.pr,
        exactHead: request.exactHead,
        authorFamily: request.authorFamily,
      }),
      "utf8",
    )
    .digest("hex");
}

function isValidReviewRequest(value: ReviewWakeRequest): boolean {
  return (
    typeof value.memoryId === "string" &&
    value.memoryId.trim().length > 0 &&
    Number.isSafeInteger(value.pr) &&
    value.pr > 0 &&
    typeof value.exactHead === "string" &&
    /^[0-9a-f]{40}$/.test(value.exactHead) &&
    typeof value.reviewRevision === "string" &&
    value.reviewRevision.trim().length > 0 &&
    (value.authorFamily === "codex" || value.authorFamily === "claude") &&
    typeof value.requestedAt === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/.test(
      value.requestedAt,
    ) &&
    Number.isFinite(Date.parse(value.requestedAt))
  );
}

function exactKeys(value: object, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

/** Load only the canonical request named by the v3 envelope. */
function loadCanonicalLiveReviewRequest(input: {
  repoRoot: string;
  envelope: ClaudeReviewEnvelopeEntry;
}): ReviewWakeRequest | null {
  const canonical = resolve(
    input.repoRoot,
    ".ut-tdd",
    "review",
    "requests",
    `${input.envelope.requestDigest}.json`,
  );
  const supplied = isAbsolute(input.envelope.requestPath)
    ? resolve(input.envelope.requestPath)
    : resolve(input.repoRoot, input.envelope.requestPath);
  if (!samePath(supplied, canonical)) return null;
  try {
    const requestFile = lstatSync(canonical);
    if (!requestFile.isFile() || requestFile.isSymbolicLink()) return null;
    const parsed = JSON.parse(readFileSync(canonical, "utf8")) as Record<string, unknown>;
    if (
      !parsed ||
      Array.isArray(parsed) ||
      !exactKeys(parsed, [
        "memoryId",
        "pr",
        "exactHead",
        "reviewRevision",
        "authorFamily",
        "requestedAt",
        "invocationNonce",
      ])
    )
      return null;
    const request = parsed as unknown as ReviewWakeRequest;
    if (!isValidReviewRequest(request) || !request.invocationNonce) return null;
    if (reviewRequestDigest(request) !== input.envelope.requestDigest) return null;
    if (
      request.memoryId !== input.envelope.memoryId ||
      request.pr !== input.envelope.pr ||
      request.exactHead !== input.envelope.exactHead ||
      request.reviewRevision !== input.envelope.reviewRevision ||
      request.authorFamily !== input.envelope.authorFamily
    )
      return null;
    return request;
  } catch {
    return null;
  }
}

function writeExclusive(path: string, value: string): "created" | "idempotent" {
  mkdirSync(dirname(path), { recursive: true });
  try {
    const descriptor = openSync(path, "wx", 0o600);
    try {
      writeFileSync(descriptor, value, "utf8");
    } finally {
      closeSync(descriptor);
    }
    return "created";
  } catch (error) {
    if (!(error instanceof Error) || !("code" in error) || error.code !== "EEXIST") throw error;
    if (readFileSync(path, "utf8") !== value)
      throw new CodexReviewWakeError("codex_review_wake_projection_conflict");
    return "idempotent";
  }
}

function canonicalWake(
  wake: CanonicalReviewWake,
  repoRoot: string,
): ClaudeProviderReviewInboxEntry {
  if (wake.reviewer !== "codex") throw new Error("codex_review_wake_identity_invalid");
  if (reviewRequestDigest(wake.request) !== wake.requestDigest) {
    throw new Error("codex_review_wake_identity_invalid");
  }
  const project = requireProjectMemoryRoot(repoRoot);
  const memory = parseMemoryFile(project.canonicalProjectRoot, wake.memoryPath);
  if (memory.memory_id !== wake.request.memoryId) {
    throw new Error("codex_review_wake_identity_invalid");
  }
  const sessionId = targetSession();
  return buildClaudeProviderReviewInboxEntry({
    memory,
    projectId: project.projectId,
    operationId: `review-${wake.requestDigest}`,
    workspaceId: project.projectNamespace,
    producer: {
      provider: "claude",
      sessionId:
        process.env.UT_TDD_CLAUDE_REVIEW_SOURCE_SESSION?.trim() || "claude-review-dispatch",
    },
    target: { scope: "session", provider: "codex", sessionId },
    requestDigest: wake.requestDigest,
    requestPath: wake.requestPath,
    pr: wake.request.pr,
    exactHead: wake.request.exactHead,
    reviewRevision: wake.request.reviewRevision,
    authorFamily: wake.request.authorFamily,
    now: wake.request.requestedAt,
  });
}

function backlogFor(wake: CanonicalReviewWake, reason: CodexReviewWakeFailure): CodexWakeBacklog {
  return {
    schema: CODEX_MEMORY_WAKE_BACKLOG_SCHEMA,
    requestDigest: wake.requestDigest,
    requestPath: wake.requestPath,
    memoryPath: wake.memoryPath,
    request: wake.request,
    createdAt: wake.request.requestedAt,
    reason,
  };
}

/** Persist a Codex wake after the canonical request exists. */
export function publishCodexReviewWake(repoRoot: string, wake: CanonicalReviewWake): string {
  let entry: ClaudeProviderReviewInboxEntry;
  try {
    entry = canonicalWake(wake, repoRoot);
  } catch (error) {
    if (
      error instanceof CodexReviewWakeError &&
      error.reason === "codex_review_target_session_unavailable"
    )
      throw error;
    if (error instanceof CodexReviewWakeError) {
      try {
        const project = requireProjectMemoryRoot(repoRoot);
        const path = join(
          project.runtimeBusRoot,
          CODEX_MEMORY_WAKE_ROOT,
          "backlog",
          `${wake.requestDigest}.json`,
        );
        writeExclusive(path, `${JSON.stringify(backlogFor(wake, error.reason))}\n`);
      } catch {
        // Preserve the original typed failure; the canonical request remains the recovery authority.
      }
      throw error;
    }
    throw new CodexReviewWakeError("review_wake_publish_failed");
  }
  const path = join(codexWakeInboxRoot(repoRoot), `${entryStem(entry.id)}.json`);
  try {
    writeExclusive(path, `${JSON.stringify(entry)}\n`);
    return path;
  } catch (error) {
    const reason =
      error instanceof CodexReviewWakeError ? error.reason : "review_wake_publish_failed";
    try {
      const backlog = join(backlogRoot(repoRoot), `${wake.requestDigest}.json`);
      writeExclusive(backlog, `${JSON.stringify(backlogFor(wake, reason))}\n`);
    } catch {
      // The canonical request remains durable even if the recovery projection is unavailable.
    }
    throw new CodexReviewWakeError(reason);
  }
}

function readJson(path: string): unknown {
  try {
    return JSON.parse(readFileSync(path, "utf8")) as unknown;
  } catch {
    return undefined;
  }
}

/** A terminal marker is durable evidence, but malformed/fake bytes never suppress retry. */
function isTerminalMarkerFor(
  value: unknown,
  expected: Pick<CodexWakeClaim, "entryId" | "requestDigest">,
): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const marker = value as Partial<CodexWakeTerminal>;
  return (
    marker.schema === CODEX_MEMORY_WAKE_TERMINAL_SCHEMA &&
    marker.entryId === expected.entryId &&
    marker.requestDigest === expected.requestDigest &&
    typeof marker.requestPath === "string" &&
    typeof marker.memoryPath === "string" &&
    typeof marker.pr === "number" &&
    Number.isSafeInteger(marker.pr) &&
    marker.pr > 0 &&
    typeof marker.exactHead === "string" &&
    /^[0-9a-f]{40}$/.test(marker.exactHead) &&
    typeof marker.reviewRevision === "string" &&
    marker.reviewRevision.length > 0 &&
    (marker.authorFamily === "codex" || marker.authorFamily === "claude") &&
    typeof marker.terminalAt === "string" &&
    Number.isFinite(Date.parse(marker.terminalAt)) &&
    marker.reason === "claimed"
  );
}

function hasTerminalMarker(
  repoRoot: string,
  expected: Pick<CodexWakeClaim, "entryId" | "requestDigest">,
): boolean {
  return isTerminalMarkerFor(readJson(terminalMarkerPath(repoRoot, expected.entryId)), expected);
}

function hasActiveClaimForRequest(repoRoot: string, requestDigest: string): boolean {
  const directory = claimsRoot(repoRoot);
  if (!existsSync(directory)) return false;
  return readdirSync(directory)
    .filter((name) => name.endsWith(".claim.json"))
    .some((name) => {
      const marker = readJson(join(directory, name)) as Partial<CodexWakeClaim> | undefined;
      return (
        marker?.schema === CODEX_MEMORY_WAKE_CLAIM_SCHEMA &&
        marker.requestDigest === requestDigest &&
        typeof marker.entryId === "string" &&
        typeof marker.targetSessionId === "string"
      );
    });
}

function hasTerminalMarkerForRequest(repoRoot: string, requestDigest: string): boolean {
  const directory = terminalRoot(repoRoot);
  if (!existsSync(directory)) return false;
  return readdirSync(directory)
    .filter((name) => name.endsWith(".json"))
    .some((name) => {
      const marker = readJson(join(directory, name)) as Partial<CodexWakeTerminal> | undefined;
      return (
        typeof marker?.entryId === "string" &&
        marker.requestDigest === requestDigest &&
        isTerminalMarkerFor(marker, {
          entryId: marker.entryId,
          requestDigest,
        })
      );
    });
}

function canonicalReviewReceiptPath(repoRoot: string, requestDigest: string): string {
  return join(resolve(repoRoot), ".ut-tdd", "review", "receipts", `${requestDigest}.json`);
}

/**
 * A live-consume result is not itself a terminal receipt.  The provider may
 * have durably projected the canonical receipt and then fail while publishing
 * a derived comment/memory.  Conversely, a successful process result without
 * the matching receipt is not enough to consume a wake.  Keep this check
 * local to the wake boundary so the claim is only terminalized from an
 * authenticated, canonical receipt.
 */
export function hasCanonicalCodexReviewReceipt(
  repoRoot: string,
  envelope: ClaudeReviewEnvelopeEntry,
): boolean {
  const request = loadCanonicalLiveReviewRequest({ repoRoot, envelope });
  if (!request) return false;
  const path = canonicalReviewReceiptPath(repoRoot, envelope.requestDigest);
  try {
    const stat = lstatSync(path);
    if (!stat.isFile() || stat.isSymbolicLink()) return false;
    const value = JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
    if (!value || Array.isArray(value)) return false;
    const reviewer = request.authorFamily === "codex" ? "claude" : "codex";
    if (
      value.memoryId !== request.memoryId ||
      value.pr !== request.pr ||
      value.head !== request.exactHead ||
      value.reviewRevision !== request.reviewRevision ||
      value.reviewerFamily !== reviewer ||
      value.kind !== "verdict" ||
      !["PASS", "PASS-WEAK", "FLAG"].includes(value.verdict as string) ||
      typeof value.at !== "string" ||
      !Number.isFinite(Date.parse(value.at))
    )
      return false;
    if (
      Object.hasOwn(value, "blockingFindings") &&
      (!Array.isArray(value.blockingFindings) ||
        value.blockingFindings.some((finding) => typeof finding !== "string"))
    )
      return false;
    if (
      value.verdict === "FLAG" &&
      (!Array.isArray(value.blockingFindings) || value.blockingFindings.length === 0)
    )
      return false;
    if (
      (value.verdict === "PASS" || value.verdict === "PASS-WEAK") &&
      Array.isArray(value.blockingFindings) &&
      value.blockingFindings.length > 0
    )
      return false;
    return true;
  } catch {
    return false;
  }
}

function validEntry(
  repoRoot: string,
  path: string,
  target: string,
): ClaudeProviderReviewInboxEntry | undefined {
  try {
    const stat = lstatSync(path);
    if (!stat.isFile() || stat.isSymbolicLink()) return undefined;
    const decoded = decodeClaudeInboxEntry(readFileSync(path, "utf8"));
    if (
      !decoded ||
      decoded.schemaVersion !== CLAUDE_PROVIDER_INBOX_SCHEMA ||
      decoded.purpose !== "review"
    )
      return undefined;
    const project = requireProjectMemoryRoot(repoRoot);
    if (
      decoded.projectId !== project.projectId ||
      decoded.target.provider !== "codex" ||
      decoded.target.sessionId !== target ||
      decoded.targetWorkspaceId !== project.projectNamespace ||
      resolve(path) !== resolve(codexWakeInboxRoot(repoRoot), `${entryStem(decoded.id)}.json`)
    )
      return undefined;
    if (!loadCanonicalLiveReviewRequest({ repoRoot, envelope: decoded })) return undefined;
    return decoded;
  } catch {
    return undefined;
  }
}

function restoreExpiredClaims(repoRoot: string, nowMs: number): void {
  const directory = claimsRoot(repoRoot);
  if (!existsSync(directory)) return;
  for (const name of readdirSync(directory).filter((candidate) =>
    candidate.endsWith(".claim.json"),
  )) {
    const markerPath = join(directory, name);
    const marker = readJson(markerPath) as Partial<CodexWakeClaim> | undefined;
    if (
      !marker ||
      marker.schema !== CODEX_MEMORY_WAKE_CLAIM_SCHEMA ||
      typeof marker.entryId !== "string" ||
      typeof marker.requestDigest !== "string" ||
      typeof marker.leaseExpiresAt !== "string"
    )
      continue;
    if (Date.parse(marker.leaseExpiresAt) > nowMs) continue;
    const claimPath = join(directory, name.replace(/\.claim\.json$/, ".json"));
    const inboxPath = join(
      codexWakeInboxRoot(repoRoot),
      `${entryStem(String(marker.entryId))}.json`,
    );
    try {
      // A crash can leave the claim and its marker after terminalization has
      // already been durably recorded.  Never resurrect such a wake: the
      // terminal marker is authoritative for this exact entry/request pair.
      if (
        hasTerminalMarker(repoRoot, {
          entryId: marker.entryId,
          requestDigest: marker.requestDigest,
        })
      ) {
        // Keep both claim bytes and the terminal marker.  A durable terminal
        // marker suppresses resurrection, but deleting the claim here would
        // erase the crash-window evidence before the next audit/reconciliation
        // pass can inspect it.
        continue;
      }
      if (existsSync(claimPath)) {
        mkdirSync(codexWakeInboxRoot(repoRoot), { recursive: true });
        if (!existsSync(inboxPath)) renameSync(claimPath, inboxPath);
        else if (readFileSync(inboxPath, "utf8") === readFileSync(claimPath, "utf8"))
          unlinkSync(claimPath);
        else continue;
      }
      unlinkSync(markerPath);
    } catch {
      // Keep the claim and original bytes visible for the next hook cycle.
    }
  }
}

function redeliverBacklog(repoRoot: string): void {
  if (!existsSync(backlogRoot(repoRoot))) return;
  if (!process.env.CODEX_REVIEW_TARGET_SESSION?.trim()) return;
  const entries = readdirSync(backlogRoot(repoRoot))
    .filter((name) => name.endsWith(".json"))
    .map((name) => ({
      name,
      path: join(backlogRoot(repoRoot), name),
      value: readJson(join(backlogRoot(repoRoot), name)) as CodexWakeBacklog | undefined,
    }))
    .filter(
      (
        entry,
      ): entry is {
        name: string;
        path: string;
        value: CodexWakeBacklog;
      } =>
        Boolean(
          entry.value &&
            entry.value.schema === CODEX_MEMORY_WAKE_BACKLOG_SCHEMA &&
            typeof entry.value.createdAt === "string" &&
            Number.isFinite(Date.parse(entry.value.createdAt)) &&
            typeof entry.value.requestDigest === "string",
        ),
    )
    .sort(
      (left, right) =>
        Date.parse(left.value.createdAt) - Date.parse(right.value.createdAt) ||
        left.value.requestDigest.localeCompare(right.value.requestDigest),
    );
  for (const entry of entries) {
    const value = entry.value;
    if (value.schema !== CODEX_MEMORY_WAKE_BACKLOG_SCHEMA) continue;
    // A backlog item can outlive the first projection attempt.  Never create
    // a second inbox wake while the original is actively claimed, or after a
    // matching terminal marker was durably recorded.
    if (
      hasActiveClaimForRequest(repoRoot, value.requestDigest) ||
      hasTerminalMarkerForRequest(repoRoot, value.requestDigest)
    )
      continue;
    try {
      publishCodexReviewWake(repoRoot, {
        purpose: "review",
        reviewer: "codex",
        requestDigest: value.requestDigest,
        requestPath: value.requestPath,
        request: value.request,
        memoryPath: value.memoryPath,
      });
    } catch {
      // Keep failed backlog bytes for the next SessionStart/Stop.  A
      // successful projection only makes the inbox pending; the backlog is
      // removed by consume after canonical receipt authentication.
    }
  }
}

function pruneTerminals(repoRoot: string, nowMs: number): void {
  const directory = terminalRoot(repoRoot);
  if (!existsSync(directory)) return;
  for (const name of readdirSync(directory).filter((candidate) => candidate.endsWith(".json"))) {
    const path = join(directory, name);
    const marker = readJson(path) as Partial<CodexWakeTerminal> | undefined;
    if (
      marker?.schema === CODEX_MEMORY_WAKE_TERMINAL_SCHEMA &&
      typeof marker.terminalAt === "string" &&
      Date.parse(marker.terminalAt) + CODEX_MEMORY_WAKE_TERMINAL_RETENTION_MS <= nowMs
    ) {
      try {
        unlinkSync(path);
      } catch {
        /* best effort pruning */
      }
    }
  }
}

/** Read exactly one FIFO Codex wake without claiming or treating observation as delivery. */
export function readCodexReviewWake(repoRoot: string, now = new Date()): CodexMemoryWakeSurface {
  const session = process.env.CODEX_REVIEW_TARGET_SESSION?.trim();
  if (!session)
    return {
      schema: CODEX_MEMORY_WAKE_SURFACE_SCHEMA,
      status: "invalid",
      deliveryConfirmed: false,
      invalidCount: 0,
      reason: "codex_review_target_session_unavailable",
    };
  restoreExpiredClaims(repoRoot, now.getTime());
  redeliverBacklog(repoRoot);
  pruneTerminals(repoRoot, now.getTime());
  const directory = codexWakeInboxRoot(repoRoot);
  if (!existsSync(directory))
    return { schema: CODEX_MEMORY_WAKE_SURFACE_SCHEMA, status: "empty", deliveryConfirmed: false };
  let invalidCount = 0;
  const valid: Array<{ path: string; entry: ClaudeProviderReviewInboxEntry }> = [];
  for (const name of readdirSync(directory)
    .filter((candidate) => candidate.endsWith(".json"))
    .sort()) {
    const path = join(directory, name);
    const entry = validEntry(repoRoot, path, session);
    if (!entry) {
      invalidCount += 1;
      continue;
    }
    valid.push({ path, entry });
  }
  valid.sort(
    (a, b) =>
      a.entry.createdAt.localeCompare(b.entry.createdAt) || a.entry.id.localeCompare(b.entry.id),
  );
  const first = valid[0];
  if (!first) {
    return invalidCount > 0
      ? {
          schema: CODEX_MEMORY_WAKE_SURFACE_SCHEMA,
          status: "invalid",
          deliveryConfirmed: false,
          invalidCount,
          reason: "codex_review_wake_envelope_invalid",
        }
      : { schema: CODEX_MEMORY_WAKE_SURFACE_SCHEMA, status: "empty", deliveryConfirmed: false };
  }
  return {
    schema: CODEX_MEMORY_WAKE_SURFACE_SCHEMA,
    status: "pending",
    deliveryConfirmed: false,
    envelopePath: first.path,
    requestDigest: first.entry.requestDigest,
    pr: first.entry.pr,
    exactHead: first.entry.exactHead,
    reviewRevision: first.entry.reviewRevision,
    invalidCount,
    reason: "codex_review_pending",
  };
}

function claimMarkerPath(repoRoot: string, entryId: string, session: string): string {
  return join(claimsRoot(repoRoot), `${entryStem(entryId)}.${safeFilePart(session)}.claim.json`);
}

function claimPath(repoRoot: string, entryId: string, session: string): string {
  return join(claimsRoot(repoRoot), `${entryStem(entryId)}.${safeFilePart(session)}.json`);
}

/** Atomically move the exact surfaced envelope into a session-bound lease claim. */
export function claimCodexReviewWake(
  repoRoot: string,
  envelopePath: string,
  now = new Date(),
): string {
  const session = targetSession();
  const inbox = codexWakeInboxRoot(repoRoot);
  const normalized = resolve(envelopePath);
  if (relative(resolve(inbox), normalized).startsWith(".."))
    throw new Error("codex_review_wake_envelope_path_invalid");
  const raw = readFileSync(normalized, "utf8");
  const entry = validEntry(repoRoot, normalized, session);
  if (!entry) throw new Error("codex_review_wake_envelope_invalid");
  const destination = claimPath(repoRoot, entry.id, session);
  const markerPath = claimMarkerPath(repoRoot, entry.id, session);
  const claimedAt = now.toISOString();
  const marker: CodexWakeClaim = {
    schema: CODEX_MEMORY_WAKE_CLAIM_SCHEMA,
    entryId: entry.id,
    requestDigest: entry.requestDigest,
    targetSessionId: session,
    claimedAt,
    leaseExpiresAt: new Date(now.getTime() + CODEX_MEMORY_WAKE_LEASE_MS).toISOString(),
  };
  writeExclusive(markerPath, `${JSON.stringify(marker)}\n`);
  try {
    renameSync(normalized, destination);
  } catch (error) {
    try {
      unlinkSync(markerPath);
    } catch {
      /* preserve source if rename failed */
    }
    if ((error as NodeJS.ErrnoException).code === "ENOENT")
      throw new Error("codex_review_wake_claim_conflict");
    throw error;
  }
  if (readFileSync(destination, "utf8") !== raw)
    throw new Error("codex_review_wake_claim_conflict");
  return destination;
}

/** Restore a failed claim without losing its original envelope bytes. */
export function restoreCodexReviewWakeClaim(repoRoot: string, claim: string): void {
  const session = targetSession();
  const root = resolve(claimsRoot(repoRoot));
  const normalized = resolve(claim);
  if (
    relative(root, normalized).startsWith("..") ||
    !normalized.endsWith(".json") ||
    normalized.endsWith(".claim.json")
  )
    throw new Error("codex_review_wake_claim_path_invalid");
  const entry = decodeClaudeInboxEntry(readFileSync(normalized, "utf8"));
  if (
    !entry ||
    entry.schemaVersion !== CLAUDE_PROVIDER_INBOX_SCHEMA ||
    entry.purpose !== "review" ||
    entry.target.sessionId !== session
  )
    throw new Error("codex_review_wake_envelope_invalid");
  const destination = join(codexWakeInboxRoot(repoRoot), `${entryStem(entry.id)}.json`);
  mkdirSync(codexWakeInboxRoot(repoRoot), { recursive: true });
  if (!existsSync(destination)) renameSync(normalized, destination);
  else if (readFileSync(destination, "utf8") === readFileSync(normalized, "utf8"))
    unlinkSync(normalized);
  else throw new Error("codex_review_wake_projection_conflict");
  const marker = normalized.replace(/\.json$/, ".claim.json");
  if (existsSync(marker)) unlinkSync(marker);
}

/** Terminalize only after the caller has authenticated a canonical receipt. */
export function consumeCodexReviewWake(
  repoRoot: string,
  envelopePath: string,
  now = new Date(),
): void {
  const session = targetSession();
  const normalized = resolve(envelopePath);
  const inbox = resolve(codexWakeInboxRoot(repoRoot));
  let claimed = normalized;
  if (!relative(inbox, normalized).startsWith(".."))
    claimed = claimCodexReviewWake(repoRoot, normalized, now);
  const entry = decodeClaudeInboxEntry(readFileSync(claimed, "utf8"));
  if (
    !entry ||
    entry.schemaVersion !== CLAUDE_PROVIDER_INBOX_SCHEMA ||
    entry.purpose !== "review" ||
    entry.target.provider !== "codex" ||
    entry.target.sessionId !== session
  )
    throw new Error("codex_review_wake_envelope_invalid");
  const markerPath = terminalMarkerPath(repoRoot, entry.id);
  const marker: CodexWakeTerminal = {
    schema: CODEX_MEMORY_WAKE_TERMINAL_SCHEMA,
    entryId: entry.id,
    requestDigest: entry.requestDigest,
    requestPath: entry.requestPath,
    memoryPath: entry.memoryPath,
    pr: entry.pr,
    exactHead: entry.exactHead,
    reviewRevision: entry.reviewRevision,
    authorFamily: entry.authorFamily,
    terminalAt: now.toISOString(),
    reason: "claimed",
  };
  try {
    writeExclusive(markerPath, `${JSON.stringify(marker)}\n`);
  } catch (error) {
    // Re-consuming after a crash may encounter the already durable terminal
    // marker with a different terminalAt.  Preserve that first terminal
    // timestamp while accepting only an otherwise identical marker.
    if (
      !(
        error instanceof CodexReviewWakeError &&
        error.reason === "codex_review_wake_projection_conflict" &&
        isTerminalMarkerFor(readJson(markerPath), marker)
      )
    )
      throw error;
  }
  try {
    unlinkSync(claimed);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  const claimMarker = claimMarkerPath(repoRoot, entry.id, session);
  if (existsSync(claimMarker)) unlinkSync(claimMarker);
  // The terminal marker is the durable proof that the canonical receipt was
  // authenticated by the caller.  Only now may the retry backlog be removed;
  // a redelivery that merely reaches inbox must remain pending/retryable.
  try {
    unlinkSync(join(backlogRoot(repoRoot), `${entry.requestDigest}.json`));
  } catch {
    // Keep the terminal marker authoritative if cleanup races or the backlog
    // was already removed by an idempotent retry.
  }
}
