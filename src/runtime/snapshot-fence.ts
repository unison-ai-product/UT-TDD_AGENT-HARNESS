import { spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";

export const SNAPSHOT_FENCE_SCHEMA_VERSION = "snapshot-fence-foreign/v1" as const;
export const SNAPSHOT_FENCE_INDETERMINATE_REASON = "fence_indeterminate_foreign_activity" as const;

export interface SnapshotFenceFingerprint {
  head: string;
  statusDigest: string;
  worktreeDigest: string;
  indexDigest: string;
  untrackedDigest: string;
  inventoryDigest?: string;
  inventoryEntries?: string[];
  changedPaths?: string[];
}

export interface ForeignActivityEvidence {
  schema_version: typeof SNAPSHOT_FENCE_SCHEMA_VERSION;
  event_id: string;
  producer_session_id: string;
  runner_session_id: string;
  before_head: string;
  after_head: string;
  changed_paths: string[];
  observed_at: string;
  event_signature: string;
}

export type SnapshotFenceClassification =
  | { kind: "unchanged"; exitCode: 0; changedPaths: string[] }
  | {
      kind: "foreign_activity";
      exitCode: 2;
      reason: typeof SNAPSHOT_FENCE_INDETERMINATE_REASON;
      message: string;
      changedPaths: string[];
      evidence: ForeignActivityEvidence[];
    }
  | {
      kind: "residual";
      exitCode: 1;
      reason: "workspace_fence_violation";
      message: string;
      changedPaths: string[];
    };

export interface SnapshotFenceAttributionInput {
  before: SnapshotFenceFingerprint;
  after: SnapshotFenceFingerprint;
  testOwnedPaths?: readonly string[];
  foreignActivityEvidence?: readonly ForeignActivityEvidence[];
  runStartedAt?: string;
  runEndedAt?: string;
  runnerSessionId?: string;
}

function normalizePath(path: string): string {
  return path.replaceAll("\\", "/").replace(/^\.\//, "");
}

export function canonicalChangedPaths(paths: readonly string[]): string[] {
  return [...new Set(paths.map(normalizePath))].sort((a, b) =>
    Buffer.compare(Buffer.from(a, "utf8"), Buffer.from(b, "utf8")),
  );
}

function changedPathDelta(
  before: readonly string[] | undefined,
  after: readonly string[] | undefined,
): string[] {
  const beforeSet = pathSet(before ?? []);
  const afterSet = pathSet(after ?? []);
  return canonicalChangedPaths([
    ...[...beforeSet].filter((path) => !afterSet.has(path)),
    ...[...afterSet].filter((path) => !beforeSet.has(path)),
  ]);
}

export function foreignActivityEventSignature(input: {
  changedPaths: readonly string[];
  beforeHead: string;
  afterHead: string;
}): string {
  const canonical = `${canonicalChangedPaths(input.changedPaths).join("|")}|${input.beforeHead}|${input.afterHead}`;
  return createHash("sha256").update(canonical, "utf8").digest("hex");
}

export function isForeignActivityEvidence(value: unknown): value is ForeignActivityEvidence {
  if (!value || typeof value !== "object") return false;
  const event = value as Partial<ForeignActivityEvidence>;
  return (
    event.schema_version === SNAPSHOT_FENCE_SCHEMA_VERSION &&
    typeof event.event_id === "string" &&
    event.event_id.length > 0 &&
    typeof event.producer_session_id === "string" &&
    event.producer_session_id.length > 0 &&
    typeof event.runner_session_id === "string" &&
    event.runner_session_id.length > 0 &&
    typeof event.before_head === "string" &&
    typeof event.after_head === "string" &&
    Array.isArray(event.changed_paths) &&
    event.changed_paths.every((path) => typeof path === "string" && path === normalizePath(path)) &&
    typeof event.observed_at === "string" &&
    !Number.isNaN(Date.parse(event.observed_at)) &&
    typeof event.event_signature === "string" &&
    event.event_signature ===
      foreignActivityEventSignature({
        changedPaths: event.changed_paths,
        beforeHead: event.before_head,
        afterHead: event.after_head,
      })
  );
}

export function snapshotFenceCommonDir(repoRoot: string): string | null {
  const result = spawnSync("git", ["rev-parse", "--git-common-dir"], {
    cwd: repoRoot,
    encoding: "utf8",
    windowsHide: true,
  });
  if (result.status !== 0 || result.error) return null;
  const raw = String(result.stdout).trim();
  if (!raw) return null;
  return resolve(repoRoot, raw);
}

export function snapshotFenceSidecarRoot(repoRoot: string): string | null {
  const commonDir = snapshotFenceCommonDir(repoRoot);
  return commonDir ? join(commonDir, "ut-tdd-runtime", "snapshot-fence") : null;
}

export function snapshotFenceEvidencePath(repoRoot: string): string | null {
  const root = snapshotFenceSidecarRoot(repoRoot);
  return root ? join(root, "foreign-activity.jsonl") : null;
}

function gitOutput(repoRoot: string, args: string[]): string | null {
  const result = spawnSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    windowsHide: true,
  });
  if (result.status !== 0 || result.error) return null;
  return String(result.stdout);
}

function digest(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function namesFromGit(repoRoot: string, args: string[]): string[] {
  return (gitOutput(repoRoot, args) ?? "")
    .split("\0")
    .filter(Boolean)
    .map((path) => normalizePath(path.replace(/^.. /, "")));
}

function committedPathsBetween(repoRoot: string, beforeHead: string, afterHead: string): string[] {
  if (beforeHead === afterHead || beforeHead === "non-git" || afterHead === "non-git") return [];
  return namesFromGit(repoRoot, ["diff", "--name-only", "-z", beforeHead, afterHead]);
}

/** Minimal producer-side fingerprint. The test fence remains the authoritative full inventory. */
export function captureSnapshotFenceFingerprint(repoRoot: string): SnapshotFenceFingerprint {
  const head = gitOutput(repoRoot, ["rev-parse", "HEAD"])?.trim() ?? "non-git";
  if (head === "non-git") {
    return {
      head,
      statusDigest: head,
      worktreeDigest: head,
      indexDigest: head,
      untrackedDigest: head,
      changedPaths: [],
    };
  }
  const status =
    gitOutput(repoRoot, ["status", "--porcelain=v1", "-z", "--untracked-files=all"]) ?? "";
  const worktree = gitOutput(repoRoot, ["diff", "--binary", "HEAD"]) ?? "";
  const index = gitOutput(repoRoot, ["diff", "--cached", "--binary", "HEAD"]) ?? "";
  const untracked = gitOutput(repoRoot, ["ls-files", "--others", "--exclude-standard", "-z"]) ?? "";
  return {
    head,
    statusDigest: digest(status),
    worktreeDigest: digest(worktree),
    indexDigest: digest(index),
    untrackedDigest: digest(untracked),
    changedPaths: canonicalChangedPaths([
      ...namesFromGit(repoRoot, ["diff", "--name-only", "-z", "HEAD"]),
      ...namesFromGit(repoRoot, ["diff", "--cached", "--name-only", "-z", "HEAD"]),
      ...untracked.split("\0").filter(Boolean).map(normalizePath),
    ]),
  };
}

export function readForeignActivityEvidence(evidencePath: string): ForeignActivityEvidence[] {
  if (!existsSync(evidencePath)) return [];
  const events: ForeignActivityEvidence[] = [];
  for (const line of readFileSync(evidencePath, "utf8").split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const parsed: unknown = JSON.parse(line);
      if (isForeignActivityEvidence(parsed)) events.push(parsed);
    } catch {
      // Invalid sidecar rows are ignored; the fence then fails closed.
    }
  }
  return events;
}

export function appendForeignActivityEvidence(
  evidencePath: string,
  event: ForeignActivityEvidence,
): void {
  mkdirSync(dirname(evidencePath), { recursive: true });
  appendFileSync(evidencePath, `${JSON.stringify(event)}\n`, "utf8");
}

function pathSet(paths: readonly string[]): Set<string> {
  return new Set(canonicalChangedPaths(paths));
}

function intersectsOwned(paths: readonly string[], owned: readonly string[]): boolean {
  const ownedSet = pathSet(owned);
  return paths.some((path) => {
    const normalized = normalizePath(path);
    return [...ownedSet].some(
      (owner) =>
        normalized === owner ||
        normalized.startsWith(`${owner}/`) ||
        owner.startsWith(`${normalized}/`),
    );
  });
}

function hasFingerprintChange(
  before: SnapshotFenceFingerprint,
  after: SnapshotFenceFingerprint,
): boolean {
  return JSON.stringify(before) !== JSON.stringify(after);
}

function evidenceInWindow(
  event: ForeignActivityEvidence,
  input: SnapshotFenceAttributionInput,
): boolean {
  const observed = Date.parse(event.observed_at);
  if (Number.isNaN(observed)) return false;
  if (input.runStartedAt && observed < Date.parse(input.runStartedAt)) return false;
  if (input.runEndedAt && observed > Date.parse(input.runEndedAt)) return false;
  return true;
}

export function attributeSnapshotFence(
  input: SnapshotFenceAttributionInput,
): SnapshotFenceClassification {
  if (!hasFingerprintChange(input.before, input.after)) {
    return { kind: "unchanged", exitCode: 0, changedPaths: [] };
  }

  const owned = canonicalChangedPaths(input.testOwnedPaths ?? []);
  const observedPaths = changedPathDelta(input.before.changedPaths, input.after.changedPaths);
  const changedPaths = observedPaths.length > 0 ? observedPaths : ["<unknown>"];
  if (changedPaths.includes("<unknown>") || intersectsOwned(changedPaths, owned)) {
    return {
      kind: "residual",
      exitCode: 1,
      reason: "workspace_fence_violation",
      message: `test workspace fence violation: added=${changedPaths.join(",")} removed=`,
      changedPaths,
    };
  }

  const events = [...(input.foreignActivityEvidence ?? [])]
    .filter((event) => isForeignActivityEvidence(event) && evidenceInWindow(event, input))
    .sort((a, b) =>
      a.observed_at === b.observed_at
        ? a.event_id.localeCompare(b.event_id)
        : a.observed_at.localeCompare(b.observed_at),
    );
  const eventIds = new Set(events.map((event) => event.event_id));
  const eventSignatures = new Set(events.map((event) => event.event_signature));
  if (
    events.length === 0 ||
    eventIds.size !== events.length ||
    eventSignatures.size !== events.length ||
    events.some(
      (event) =>
        event.producer_session_id === event.runner_session_id ||
        (input.runnerSessionId !== undefined && event.runner_session_id !== input.runnerSessionId),
    )
  ) {
    return {
      kind: "residual",
      exitCode: 1,
      reason: "workspace_fence_violation",
      message: `test workspace fence violation: added=${changedPaths.join(",")} removed=`,
      changedPaths,
    };
  }
  for (let index = 1; index < events.length; index += 1) {
    if (events[index - 1].after_head !== events[index].before_head) {
      return {
        kind: "residual",
        exitCode: 1,
        reason: "workspace_fence_violation",
        message: `test workspace fence violation: sidecar sequence discontinuity at ${events[index].event_id}`,
        changedPaths,
      };
    }
  }
  const aggregatePaths = canonicalChangedPaths(events.flatMap((event) => event.changed_paths));
  const aggregateBefore = events[0].before_head;
  const aggregateAfter = events.at(-1)?.after_head;
  const matches =
    aggregateBefore === input.before.head &&
    aggregateAfter === input.after.head &&
    JSON.stringify(aggregatePaths) === JSON.stringify(changedPaths) &&
    !intersectsOwned(aggregatePaths, owned);
  if (!matches) {
    return {
      kind: "residual",
      exitCode: 1,
      reason: "workspace_fence_violation",
      message: `test workspace fence violation: added=${changedPaths.join(",")} removed=`,
      changedPaths,
    };
  }
  return {
    kind: "foreign_activity",
    exitCode: 2,
    reason: SNAPSHOT_FENCE_INDETERMINATE_REASON,
    message: `${SNAPSHOT_FENCE_INDETERMINATE_REASON}: foreign activity matched; re-run the detached snapshot runner`,
    changedPaths,
    evidence: events,
  };
}

export interface SnapshotFenceProducerState {
  fingerprint: SnapshotFenceFingerprint;
}

export interface SnapshotFenceProducer {
  observe(input: { sessionId: string; runnerSessionId: string; now: string }): void;
}

function statePath(root: string, sessionId: string): string {
  return join(root, `producer-${sessionId.replace(/[^A-Za-z0-9._-]/g, "_")}.json`);
}

export function createSnapshotFenceProducer(input: {
  repoRoot: string;
  capture?: () => SnapshotFenceFingerprint;
  evidencePath?: string | null;
  sidecarRoot?: string | null;
  append?: (path: string, event: ForeignActivityEvidence) => void;
  readState?: (path: string) => SnapshotFenceProducerState | null;
  writeState?: (path: string, state: SnapshotFenceProducerState) => void;
}): SnapshotFenceProducer {
  const root = input.sidecarRoot ?? snapshotFenceSidecarRoot(input.repoRoot);
  const evidencePath = input.evidencePath ?? snapshotFenceEvidencePath(input.repoRoot);
  const append = input.append ?? appendForeignActivityEvidence;
  const capture = input.capture ?? (() => captureSnapshotFenceFingerprint(input.repoRoot));
  const readState =
    input.readState ??
    ((path: string) => {
      if (!existsSync(path)) return null;
      try {
        return JSON.parse(readFileSync(path, "utf8")) as SnapshotFenceProducerState;
      } catch {
        return null;
      }
    });
  const writeState =
    input.writeState ??
    ((path: string, state: SnapshotFenceProducerState) => {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, JSON.stringify(state), "utf8");
    });

  return {
    observe({ sessionId, runnerSessionId, now }) {
      if (!root || !evidencePath || !sessionId) return;
      const current = capture();
      const path = statePath(root, sessionId);
      const previous = readState(path)?.fingerprint;
      writeState(path, { fingerprint: current });
      if (!previous || !hasFingerprintChange(previous, current)) return;
      const changedPaths = canonicalChangedPaths([
        ...changedPathDelta(previous.changedPaths, current.changedPaths),
        ...committedPathsBetween(input.repoRoot, previous.head, current.head),
      ]);
      if (changedPaths.length === 0) return;
      append(evidencePath, {
        schema_version: SNAPSHOT_FENCE_SCHEMA_VERSION,
        event_id: randomUUID(),
        producer_session_id: sessionId,
        runner_session_id: runnerSessionId,
        before_head: previous.head,
        after_head: current.head,
        changed_paths: changedPaths,
        observed_at: now,
        event_signature: foreignActivityEventSignature({
          changedPaths,
          beforeHead: previous.head,
          afterHead: current.head,
        }),
      });
    },
  };
}

export function resolveEvidencePath(repoRoot: string, requested?: string): string | null {
  const candidate = requested?.trim() || snapshotFenceEvidencePath(repoRoot);
  if (!candidate) return null;
  const root = snapshotFenceSidecarRoot(repoRoot);
  if (!root) return null;
  const resolved = resolve(repoRoot, candidate);
  const relativeToSidecar = relative(root, resolved);
  if (relativeToSidecar.startsWith("..") || isAbsolute(relativeToSidecar)) return null;
  return resolved;
}
