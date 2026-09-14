import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, lstatSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseMemoryFile } from "../memory/index.ts";
import {
  type ProjectMemoryRootDenyReason,
  resolveProjectMemoryRoot,
} from "./project-memory-root.ts";
import { analyzeWorktreeTopology, normalizeTopologyPath } from "./worktree-topology.ts";
import type { WorktreeTopologyCollection } from "./worktree-topology-collector.ts";
import { collectWorktreeTopology } from "./worktree-topology-collector.ts";

export type ProjectMemoryCompletionDenyReason =
  | ProjectMemoryRootDenyReason
  | "migration_incomplete"
  | "operation_chain_ambiguous"
  | "transaction_tampered"
  | "legacy_residue"
  | "invalid_memory"
  | "source_unavailable"
  | "source_unsafe"
  | "topology_unavailable"
  | "inventory_drift"
  | "replay_corpus_mismatch";

export interface ProjectMemoryCompletionSuccess {
  readonly ok: true;
  readonly projectId: string;
  readonly operationId: string;
  readonly canonicalCorpusDigest: string;
  readonly readAllowed: true;
  readonly writeAllowed: true;
}

export interface ProjectMemoryCompletionFailure {
  readonly ok: false;
  readonly reason: ProjectMemoryCompletionDenyReason;
  readonly operationId?: string;
  readonly canonicalCorpusDigest?: string;
  readonly residue?: readonly string[];
  readonly readAllowed: false;
  readonly writeAllowed: false;
}

export type ProjectMemoryCompletionResult =
  | ProjectMemoryCompletionSuccess
  | ProjectMemoryCompletionFailure;

export type ProjectMemoryReplayResult =
  | (ProjectMemoryCompletionSuccess & { readonly status: "replayed" })
  | ProjectMemoryCompletionFailure;

export class ProjectMemoryCompletionError extends Error {
  readonly reason: ProjectMemoryCompletionDenyReason;

  constructor(reason: ProjectMemoryCompletionDenyReason) {
    super(`memory_migration_${reason}`);
    this.name = "ProjectMemoryCompletionError";
    this.reason = reason;
  }
}

interface CorpusFile {
  readonly path: string;
  readonly memoryId: string;
  readonly digest: string;
  readonly size: number;
}

interface Corpus {
  readonly files: readonly CorpusFile[];
  readonly digest: string;
  readonly index: ReadonlySet<string>;
}

type MarkerKind = "owner" | "intent" | "imported" | "prepared" | "complete";

interface Marker {
  readonly sequence: number;
  readonly kind: MarkerKind;
  readonly operationId: string;
  readonly payload: Record<string, unknown>;
  readonly previousRecordDigest: string | null;
  readonly recordDigest: string;
}

interface Operation {
  readonly operationId: string;
  readonly root: string;
  readonly markersPath: string;
  readonly markers: readonly Marker[];
  readonly complete?: Marker;
  readonly previousCompleteDigest: string | null;
}

interface FenceState {
  readonly root: Extract<ReturnType<typeof resolveProjectMemoryRoot>, { ok: true }>;
  readonly corpus: Corpus;
  readonly operations: readonly Operation[];
  readonly tip: Operation;
}

const operationIdPattern = /^[A-Za-z0-9._-]{1,160}$/;

function sha256(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(value);
}

function markerDigest(marker: Omit<Marker, "recordDigest">): string {
  return sha256(canonicalJson(marker));
}

function failure(
  reason: ProjectMemoryCompletionDenyReason,
  extra: Omit<
    ProjectMemoryCompletionFailure,
    "ok" | "reason" | "readAllowed" | "writeAllowed"
  > = {},
): ProjectMemoryCompletionFailure {
  return { ok: false, reason, readAllowed: false, writeAllowed: false, ...extra };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stablePath(path: string): string {
  return normalizeTopologyPath(path);
}

function readFileStable(path: string): { readonly content: string; readonly size: number } {
  let before: ReturnType<typeof lstatSync>;
  try {
    before = lstatSync(path);
  } catch {
    throw new FenceReadError("source_unavailable");
  }
  if (!before.isFile() || before.isSymbolicLink()) throw new FenceReadError("source_unsafe");
  let content: string;
  try {
    content = readFileSync(path, "utf8");
  } catch {
    throw new FenceReadError("source_unavailable");
  }
  let after: ReturnType<typeof lstatSync>;
  try {
    after = lstatSync(path);
  } catch {
    throw new FenceReadError("inventory_drift");
  }
  if (
    `${String(before.dev)}:${String(before.ino)}` !== `${String(after.dev)}:${String(after.ino)}` ||
    before.size !== after.size ||
    before.mtimeMs !== after.mtimeMs
  ) {
    throw new FenceReadError("inventory_drift");
  }
  return { content, size: before.size };
}

class FenceReadError extends Error {
  readonly reason: Extract<
    ProjectMemoryCompletionDenyReason,
    "source_unavailable" | "source_unsafe" | "inventory_drift" | "invalid_memory"
  >;

  constructor(reason: FenceReadError["reason"]) {
    super(reason);
    this.reason = reason;
  }
}

function directoryIsSafe(path: string): boolean {
  try {
    const stat = lstatSync(path);
    return stat.isDirectory() && !stat.isSymbolicLink();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return true;
    return false;
  }
}

function readCorpus(root: string, repoRoot: string): Corpus {
  if (!directoryIsSafe(join(root, "..")) || !directoryIsSafe(root)) {
    throw new FenceReadError("source_unsafe");
  }
  if (!existsSync(root)) {
    return { files: [], digest: sha256("[]"), index: new Set() };
  }
  const files: CorpusFile[] = [];
  for (const name of readdirSync(root).sort(compareNames)) {
    if (!name.endsWith(".md")) continue;
    const sourcePath = `.ut-tdd/memory/${name}`;
    const path = join(root, name);
    const stable = readFileStable(path);
    let entry: ReturnType<typeof parseMemoryFile>;
    try {
      entry = parseMemoryFile(repoRoot, sourcePath, stable.content);
    } catch {
      throw new FenceReadError("invalid_memory");
    }
    files.push({
      path: sourcePath,
      memoryId: entry.memory_id,
      digest: entry.content_hash,
      size: stable.size,
    });
  }
  files.sort((left, right) => compareNames(left.path, right.path));
  const index = new Set(files.map((file) => `${file.memoryId}\0${file.digest}`));
  return {
    files,
    index,
    digest: sha256(canonicalJson(files)),
  };
}

function compareNames(left: string, right: string): number {
  return Buffer.compare(Buffer.from(left), Buffer.from(right));
}

function isTracked(worktreeRoot: string, sourcePath: string): boolean {
  try {
    execFileSync("git", ["-C", worktreeRoot, "ls-files", "--error-unmatch", "--", sourcePath], {
      stdio: ["ignore", "pipe", "ignore"],
      windowsHide: true,
    });
    return true;
  } catch {
    return false;
  }
}

function findResidue(canonicalRoot: string, canonical: Corpus): readonly string[] {
  let topology: WorktreeTopologyCollection;
  try {
    topology = collectWorktreeTopology({ repoRoot: canonicalRoot });
  } catch {
    throw new FenceReadError("source_unavailable");
  }
  if (!analyzeWorktreeTopology(topology).ok || topology.facts.length === 0) {
    throw new FenceReadError("source_unavailable");
  }
  const canonicalPath = stablePath(canonicalRoot);
  const residue: string[] = [];
  for (const fact of topology.facts) {
    const worktree = fact.worktreePathKey;
    if (stablePath(worktree) === canonicalPath) continue;
    const memoryRoot = join(worktree, ".ut-tdd", "memory");
    if (!existsSync(memoryRoot)) continue;
    if (!directoryIsSafe(join(worktree, ".ut-tdd")) || !directoryIsSafe(memoryRoot)) {
      throw new FenceReadError("source_unsafe");
    }
    for (const name of readdirSync(memoryRoot).sort(compareNames)) {
      if (!name.endsWith(".md")) continue;
      const sourcePath = `.ut-tdd/memory/${name}`;
      if (isTracked(worktree, sourcePath)) continue;
      const path = join(memoryRoot, name);
      const stable = readFileStable(path);
      let entry: ReturnType<typeof parseMemoryFile>;
      try {
        entry = parseMemoryFile(worktree, sourcePath, stable.content);
      } catch {
        throw new FenceReadError("invalid_memory");
      }
      const key = `${entry.memory_id}\0${entry.content_hash}`;
      if (!canonical.index.has(key)) residue.push(`${stablePath(worktree)}:${sourcePath}`);
    }
  }
  return residue.sort(compareNames);
}

function parseMarkers(path: string, operationId: string): readonly Marker[] {
  if (!existsSync(path)) return [];
  let lines: string[];
  try {
    lines = readFileSync(path, "utf8")
      .split("\n")
      .filter((line) => line.length > 0);
  } catch {
    throw new FenceTamperError();
  }
  const markers: Marker[] = [];
  let previous: string | null = null;
  let preparedSeen = false;
  let completeSeen = false;
  for (const [index, line] of lines.entries()) {
    let value: unknown;
    try {
      value = JSON.parse(line);
    } catch {
      throw new FenceTamperError();
    }
    if (!isRecord(value)) throw new FenceTamperError();
    const marker = value as Partial<Marker>;
    const kind = marker.kind;
    const kindOrderValid =
      (index === 0 && kind === "owner") ||
      (index === 1 && kind === "intent") ||
      (index >= 2 && kind === "imported" && !preparedSeen && !completeSeen) ||
      (index >= 2 && kind === "prepared" && !preparedSeen && !completeSeen) ||
      (index >= 3 && kind === "complete" && preparedSeen && !completeSeen);
    if (
      marker.sequence !== index + 1 ||
      !kindOrderValid ||
      marker.operationId !== operationId ||
      !isRecord(marker.payload) ||
      typeof marker.recordDigest !== "string" ||
      (marker.previousRecordDigest ?? null) !== previous
    ) {
      throw new FenceTamperError();
    }
    if (kind === "prepared") preparedSeen = true;
    if (kind === "complete") completeSeen = true;
    const unsigned = {
      sequence: marker.sequence,
      kind: marker.kind,
      operationId: marker.operationId,
      payload: marker.payload,
      previousRecordDigest: marker.previousRecordDigest ?? null,
    } satisfies Omit<Marker, "recordDigest">;
    if (markerDigest(unsigned) !== marker.recordDigest) throw new FenceTamperError();
    markers.push({ ...unsigned, recordDigest: marker.recordDigest });
    previous = marker.recordDigest;
  }
  return markers;
}

class FenceTamperError extends Error {}

function quarantineManifest(
  root: string,
): readonly { name: string; digest: string; size: number }[] {
  if (!existsSync(root)) return [];
  try {
    const stat = lstatSync(root);
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw new FenceTamperError();
    return readdirSync(root)
      .sort(compareNames)
      .map((name) => {
        const path = join(root, name);
        const file = lstatSync(path);
        if (!file.isFile() || file.isSymbolicLink()) throw new FenceTamperError();
        const bytes = readFileSync(path);
        return { name, digest: sha256(bytes), size: bytes.byteLength };
      });
  } catch (error) {
    if (error instanceof FenceTamperError) throw error;
    throw new FenceTamperError();
  }
}

function verifyComplete(operationRoot: string, markers: readonly Marker[]): void {
  const owner = markers.find((marker) => marker.kind === "owner");
  const intent = markers.find((marker) => marker.kind === "intent");
  const prepared = markers.find((marker) => marker.kind === "prepared");
  const complete = markers.find((marker) => marker.kind === "complete");
  if (!owner || !intent || !prepared || !complete || !Array.isArray(prepared.payload.files)) {
    throw new FenceTamperError();
  }
  if (typeof complete.payload.inventoryDigest !== "string") throw new FenceTamperError();
  const actual = quarantineManifest(join(operationRoot, "quarantine"));
  if (canonicalJson(actual) !== canonicalJson(prepared.payload.files)) throw new FenceTamperError();
  if (
    typeof complete.payload.quarantineDigest !== "string" ||
    complete.payload.quarantineDigest !== sha256(canonicalJson(actual))
  ) {
    throw new FenceTamperError();
  }
}

function loadState(repoRoot: string): FenceState | ProjectMemoryCompletionFailure {
  const resolved = resolveProjectMemoryRoot(repoRoot);
  if (!resolved.ok) return failure(resolved.reason);
  let corpus: Corpus;
  try {
    corpus = readCorpus(resolved.authoredMemoryRoot, resolved.canonicalProjectRoot);
  } catch (error) {
    if (error instanceof FenceReadError) return failure(error.reason);
    if (error instanceof FenceTamperError) return failure("transaction_tampered");
    return failure("source_unavailable");
  }

  const migrationRoot = join(resolved.runtimeBusRoot, "memory-migration");
  if (!existsSync(migrationRoot))
    return failure("migration_incomplete", { canonicalCorpusDigest: corpus.digest });
  let operationIds: string[];
  try {
    const rootStat = lstatSync(migrationRoot);
    if (!rootStat.isDirectory() || rootStat.isSymbolicLink())
      return failure("transaction_tampered");
    operationIds = readdirSync(migrationRoot).sort(compareNames);
  } catch {
    return failure("transaction_tampered");
  }
  if (operationIds.length === 0)
    return failure("migration_incomplete", { canonicalCorpusDigest: corpus.digest });

  const operations: Operation[] = [];
  let hasIncomplete = false;
  let incompleteOperationId: string | undefined;
  try {
    for (const operationId of operationIds) {
      if (!operationIdPattern.test(operationId)) throw new FenceTamperError();
      const operationRoot = join(migrationRoot, operationId);
      const operationStat = lstatSync(operationRoot);
      if (!operationStat.isDirectory() || operationStat.isSymbolicLink())
        throw new FenceTamperError();
      const markersPath = join(operationRoot, "markers.jsonl");
      const markers = parseMarkers(markersPath, operationId);
      if (markers.length === 0) {
        hasIncomplete = true;
        incompleteOperationId ??= operationId;
        operations.push({
          operationId,
          root: operationRoot,
          markersPath,
          markers,
          previousCompleteDigest: null,
        });
        continue;
      }
      const complete = markers.find((marker) => marker.kind === "complete");
      if (!complete) {
        hasIncomplete = true;
        incompleteOperationId ??= operationId;
        operations.push({
          operationId,
          root: operationRoot,
          markersPath,
          markers,
          previousCompleteDigest: readPreviousCompleteDigest(markers),
        });
        continue;
      }
      verifyComplete(operationRoot, markers);
      operations.push({
        operationId,
        root: operationRoot,
        markersPath,
        markers,
        complete,
        previousCompleteDigest: readPreviousCompleteDigest(markers),
      });
    }
  } catch (error) {
    if (error instanceof FenceTamperError)
      return failure("transaction_tampered", { canonicalCorpusDigest: corpus.digest });
    return failure("source_unavailable", { canonicalCorpusDigest: corpus.digest });
  }
  if (hasIncomplete)
    return failure("migration_incomplete", {
      canonicalCorpusDigest: corpus.digest,
      ...(incompleteOperationId ? { operationId: incompleteOperationId } : {}),
    });

  const completed = operations.filter((operation): operation is Operation & { complete: Marker } =>
    Boolean(operation.complete),
  );
  const byDigest = new Map(
    completed.map((operation) => [operation.complete.recordDigest, operation]),
  );
  const references = new Map<string, number>();
  for (const operation of completed) {
    const previous = operation.previousCompleteDigest;
    if (previous !== null && !byDigest.has(previous))
      return failure("operation_chain_ambiguous", { canonicalCorpusDigest: corpus.digest });
    if (previous !== null) references.set(previous, (references.get(previous) ?? 0) + 1);
  }
  if (completed.filter((operation) => operation.previousCompleteDigest === null).length !== 1) {
    return failure("operation_chain_ambiguous", { canonicalCorpusDigest: corpus.digest });
  }
  if ([...references.values()].some((count) => count > 1))
    return failure("operation_chain_ambiguous", { canonicalCorpusDigest: corpus.digest });
  const tips = completed.filter((operation) => !references.has(operation.complete.recordDigest));
  if (tips.length !== 1)
    return failure("operation_chain_ambiguous", { canonicalCorpusDigest: corpus.digest });
  const rootOperation = completed.find((operation) => operation.previousCompleteDigest === null);
  if (!rootOperation)
    return failure("operation_chain_ambiguous", { canonicalCorpusDigest: corpus.digest });
  const visited = new Set<string>();
  let current: Operation | undefined = rootOperation;
  while (current) {
    if (visited.has(current.operationId))
      return failure("operation_chain_ambiguous", { canonicalCorpusDigest: corpus.digest });
    visited.add(current.operationId);
    const nextDigest = completed.find(
      (operation) => operation.previousCompleteDigest === current?.complete?.recordDigest,
    )?.complete?.recordDigest;
    current = nextDigest ? byDigest.get(nextDigest) : undefined;
  }
  if (visited.size !== completed.length)
    return failure("operation_chain_ambiguous", { canonicalCorpusDigest: corpus.digest });
  let residue: readonly string[];
  try {
    residue = findResidue(resolved.canonicalProjectRoot, corpus);
  } catch (error) {
    if (error instanceof FenceReadError) return failure(error.reason);
    return failure("source_unavailable");
  }
  if (residue.length > 0) {
    return failure("legacy_residue", { canonicalCorpusDigest: corpus.digest, residue });
  }
  return { root: resolved, corpus, operations, tip: tips[0] };
}

function readPreviousCompleteDigest(markers: readonly Marker[]): string | null {
  const owner = markers.find((marker) => marker.kind === "owner");
  if (!owner) throw new FenceTamperError();
  const value = owner.payload.previous_complete_digest;
  if (value === undefined || value === null) return null;
  if (typeof value !== "string" || value.length === 0) throw new FenceTamperError();
  return value;
}

/** Read-only completion observation. It never creates or mutates runtime state. */
export function inspectProjectMemoryCompletion(repoRoot: string): ProjectMemoryCompletionResult {
  const state = loadState(repoRoot);
  if (!("tip" in state)) return state;
  return {
    ok: true,
    projectId: state.root.projectId,
    operationId: state.tip.operationId,
    canonicalCorpusDigest: state.corpus.digest,
    readAllowed: true,
    writeAllowed: true,
  };
}

/**
 * Check same-operation replay without appending a marker. The replay anchor
 * must be an explicit canonical-only digest. An old marker's all-worktree
 * `inventoryDigest` is deliberately not accepted as a fallback: it includes
 * topology and volatile file metadata and would reject harmless worktree
 * changes or touches.
 */
export function replayProjectMemoryCompletion(
  repoRoot: string,
  operationId: string,
): ProjectMemoryReplayResult {
  const state = loadState(repoRoot);
  if (!("tip" in state)) return state;
  const operation = state.operations.find((candidate) => candidate.operationId === operationId);
  if (!operation?.complete)
    return failure("migration_incomplete", { canonicalCorpusDigest: state.corpus.digest });
  const expected = operation.complete.payload.canonicalCorpusDigest;
  if (typeof expected === "string") {
    if (expected !== state.corpus.digest)
      return failure("replay_corpus_mismatch", {
        operationId,
        canonicalCorpusDigest: state.corpus.digest,
      });
  } else {
    return failure("replay_corpus_mismatch", {
      operationId,
      canonicalCorpusDigest: state.corpus.digest,
    });
  }
  return {
    ok: true,
    status: "replayed",
    projectId: state.root.projectId,
    operationId,
    canonicalCorpusDigest: state.corpus.digest,
    readAllowed: true,
    writeAllowed: true,
  };
}

export function requireProjectMemoryCompletion(
  repoRoot: string,
): Extract<ProjectMemoryCompletionResult, { ok: true }> {
  const result = inspectProjectMemoryCompletion(repoRoot);
  if (!result.ok) throw new ProjectMemoryCompletionError(result.reason);
  return result;
}

export class ProjectMemoryCompletionFence {
  inspect(repoRoot: string): ProjectMemoryCompletionResult {
    return inspectProjectMemoryCompletion(repoRoot);
  }

  replay(repoRoot: string, operationId: string): ProjectMemoryReplayResult {
    return replayProjectMemoryCompletion(repoRoot, operationId);
  }
}
