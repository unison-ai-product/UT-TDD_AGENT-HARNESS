import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  appendFileSync,
  closeSync,
  existsSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { hostname } from "node:os";
import { join } from "node:path";
import {
  type MemoryEntry,
  memoryFileNameFor,
  memoryStorageRoot,
  parseMemoryFile,
} from "../memory/index.ts";
import {
  type ProjectMemoryRootDenyReason,
  resolveProjectMemoryRoot,
} from "./project-memory-root.ts";
import { analyzeWorktreeTopology, normalizeTopologyPath } from "./worktree-topology.ts";
import {
  collectWorktreeTopology,
  type WorktreeTopologyCollection,
} from "./worktree-topology-collector.ts";

export interface MemoryMigrationVariant {
  readonly memoryId: string;
  readonly worktreeRoot: string;
  readonly sourcePath: string;
  readonly contentDigest: string;
  readonly sourceHandleIdentity: string;
  readonly sourceSize: number;
  readonly sourceMtimeMs: number;
}

function sourceIdentityKey(worktreeRoot: string, sourcePath: string): string {
  return `${normalizeTopologyPath(worktreeRoot)}\0${sourcePath}`;
}

export interface MemoryMigrationGroup {
  readonly memoryId: string;
  readonly disposition: "unique" | "dedupe" | "conflict";
  readonly variants: readonly MemoryMigrationVariant[];
}

export type MemoryMigrationDryRun =
  | {
      readonly ok: true;
      readonly projectId: string;
      readonly inventoryDigest: string;
      readonly hasConflicts: boolean;
      readonly groups: readonly MemoryMigrationGroup[];
      readonly invalidMemory?: readonly string[];
    }
  | {
      readonly ok: false;
      readonly reason:
        | ProjectMemoryRootDenyReason
        | "topology_unavailable"
        | "source_unavailable"
        | "source_unsafe"
        | "invalid_memory"
        | "source_changed"
        | "inventory_drift"
        | "migration_incomplete"
        | "transaction_busy"
        | "transaction_tampered"
        | "transaction_interrupted";
    };

export interface MemoryMigrationApplyOptions {
  readonly operationId?: string;
  /** Test/fault-injection seam: return an interrupted transaction after this marker. */
  readonly crashAfter?:
    | "owner"
    | "intent"
    | "write_before_import_marker"
    | "first_import"
    | "prepared";
}

export type MemoryMigrationApplyResult =
  | {
      readonly ok: true;
      readonly status: "completed" | "replayed";
      readonly operationId: string;
      readonly inventoryDigest: string;
      readonly quarantineRoot: string;
      readonly markersPath: string;
      readonly quarantined: readonly MemoryMigrationVariant[];
      /** Files actually admitted to the canonical root by this operation. */
      readonly imported: readonly MemoryMigrationImport[];
      /** Invalid linked-worktree candidates isolated from this apply. */
      readonly invalidMemory: readonly string[];
    }
  | {
      readonly ok: false;
      readonly reason:
        | ProjectMemoryRootDenyReason
        | "topology_unavailable"
        | "source_unavailable"
        | "source_unsafe"
        | "invalid_memory"
        | "source_changed"
        | "inventory_drift"
        | "migration_incomplete"
        | "transaction_busy"
        | "transaction_tampered"
        | "transaction_interrupted"
        | "operation_chain_ambiguous"
        | "replay_corpus_mismatch";
      readonly operationId?: string;
      readonly quarantineRoot?: string;
      readonly markersPath?: string;
    };

export interface MemoryMigrationPorts {
  readonly collect: (root: string) => WorktreeTopologyCollection;
  readonly read: (path: string) => string;
}

class InventoryDenied extends Error {
  readonly reason: Extract<MemoryMigrationDryRun, { ok: false }>["reason"];

  constructor(reason: Extract<MemoryMigrationDryRun, { ok: false }>["reason"]) {
    super(reason);
    this.reason = reason;
  }
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

interface SourceSnapshot {
  readonly content: string;
  readonly handleIdentity: string;
  readonly size: number;
  readonly mtimeMs: number;
}

/** The durable description of a file imported into the canonical root. */
export interface MemoryMigrationImport {
  readonly memoryId: string;
  readonly sourceWorktreeRoot: string;
  readonly sourcePath: string;
  readonly destinationPath: string;
  readonly contentDigest: string;
  readonly size: number;
}

interface InventoryOptions {
  /** Recovery apply may isolate invalid linked-worktree files per candidate. */
  readonly allowInvalidLinked?: boolean;
}

interface InventoryWithInvalid {
  readonly invalidMemory: readonly string[];
}

function sha256(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(value);
}

function markerDigest(marker: Omit<Marker, "recordDigest">): string {
  return sha256(canonicalJson(marker));
}

function markerLine(marker: Marker): string {
  return `${canonicalJson(marker)}\n`;
}

function processIsAlive(pid: number): boolean {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function safeOperationId(value: string): boolean {
  return /^[A-Za-z0-9._-]{1,160}$/.test(value);
}

function isTracked(worktreeRoot: string, sourcePath: string): boolean {
  try {
    execFileSync("git", ["-C", worktreeRoot, "ls-files", "--error-unmatch", "--", sourcePath], {
      stdio: "ignore",
      windowsHide: true,
    });
    return true;
  } catch {
    return false;
  }
}

function quarantineFileName(variant: MemoryMigrationVariant, index: number): string {
  return `${String(index).padStart(6, "0")}-${sha256(
    `${variant.memoryId}\0${variant.worktreeRoot}\0${variant.sourcePath}\0${variant.contentDigest}`,
  )}.md`;
}

type MigrationFailureReason = Exclude<
  Extract<MemoryMigrationApplyResult, { ok: false }>["reason"],
  ProjectMemoryRootDenyReason
>;

class MigrationFailure extends Error {
  readonly reason: MigrationFailureReason;

  constructor(reason: MigrationFailureReason) {
    super(reason);
    this.reason = reason;
  }
}

interface TransactionPaths {
  readonly root: string;
  readonly repoRoot: string;
  readonly quarantine: string;
  readonly markersPath: string;
}

interface FinishExistingInput {
  readonly inventory: Extract<MemoryMigrationDryRun, { ok: true }>;
  readonly operationId: string;
  readonly paths: TransactionPaths;
  readonly markers: readonly Marker[];
  readonly crashAfter?: MemoryMigrationApplyOptions["crashAfter"];
}

interface VerifyCompleteInput {
  readonly marker: Marker;
  readonly prepared: Marker;
  readonly inventory: Extract<MemoryMigrationDryRun, { ok: true }>;
  readonly paths: TransactionPaths;
}

interface AppendIntentInput {
  readonly path: string;
  readonly operationId: string;
  readonly inventory: Extract<MemoryMigrationDryRun, { ok: true }>;
  readonly canonicalProjectRoot: string;
}

interface AssertImportIntentInput {
  readonly intent: Marker;
  readonly inventory: Extract<MemoryMigrationDryRun, { ok: true }>;
  readonly canonicalRoot: string;
  readonly durable: readonly MemoryMigrationImport[];
}

interface RecoverUnmarkedImportsInput {
  readonly intent: Marker;
  readonly inventory: Extract<MemoryMigrationDryRun, { ok: true }>;
  readonly canonicalRoot: string;
  readonly durable: readonly MemoryMigrationImport[];
}

interface ImportCanonicalCandidatesInput {
  readonly candidates: readonly MemoryMigrationVariant[];
  readonly canonicalRoot: string;
  readonly recorded: readonly MemoryMigrationImport[];
  readonly record: (entry: MemoryMigrationImport) => void;
  readonly crashAfter?: MemoryMigrationApplyOptions["crashAfter"];
}

const compare = (left: string, right: string) =>
  Buffer.compare(Buffer.from(left), Buffer.from(right));

/** Read-only observation, not an apply capability or a proof against concurrent source mutation. */
export class ProjectMemoryMigration {
  private readonly ports: MemoryMigrationPorts;

  constructor(ports: Partial<MemoryMigrationPorts> = {}) {
    this.ports = {
      collect: (root) => collectWorktreeTopology({ repoRoot: root }),
      read: (path) => {
        const bytes = readFileSync(path);
        try {
          return new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes);
        } catch {
          throw new InventoryDenied("invalid_memory");
        }
      },
      ...ports,
    };
  }

  dryRun(repoRoot: string): MemoryMigrationDryRun {
    try {
      return this.inventory(repoRoot);
    } catch (error) {
      return {
        ok: false,
        reason: error instanceof InventoryDenied ? error.reason : "source_unavailable",
      };
    }
  }

  apply(repoRoot: string, options: MemoryMigrationApplyOptions = {}): MemoryMigrationApplyResult {
    let inventory: MemoryMigrationDryRun;
    try {
      inventory = this.inventory(repoRoot);
    } catch (error) {
      // dry-run remains all-or-nothing.  Recovery apply has a narrower,
      // candidate-level exception: malformed linked-worktree files are
      // reported and skipped while valid candidates can still be committed.
      if (error instanceof InventoryDenied && error.reason === "invalid_memory") {
        try {
          inventory = this.inventory(repoRoot, { allowInvalidLinked: true });
        } catch (retryError) {
          return {
            ok: false,
            reason:
              retryError instanceof InventoryDenied ? retryError.reason : "source_unavailable",
          };
        }
      } else {
        return {
          ok: false,
          reason: error instanceof InventoryDenied ? error.reason : "source_unavailable",
        };
      }
    }
    if (!inventory.ok) return inventory;
    const resolved = resolveProjectMemoryRoot(repoRoot);
    if (!resolved.ok) return resolved;
    const operationId = options.operationId ?? `memory-migration-${inventory.inventoryDigest}`;
    if (!safeOperationId(operationId)) return { ok: false, reason: "transaction_tampered" };
    const paths = this.transactionPaths(
      resolved.runtimeBusRoot,
      resolved.canonicalProjectRoot,
      operationId,
    );
    // Resolve the predecessor before creating the new operation directory;
    // otherwise the just-created empty directory would look like an
    // incomplete sibling during chain inspection.
    let predecessor: string | null;
    try {
      predecessor = existsSync(paths.markersPath)
        ? null
        : this.previousCompleteDigest(resolved.runtimeBusRoot, operationId);
    } catch (error) {
      if (error instanceof MigrationFailure) return this.failure(error.reason, operationId, paths);
      return this.failure("source_unavailable", operationId, paths);
    }
    try {
      mkdirSync(paths.root, { recursive: true });
      const markers = this.readMarkers(paths.markersPath, operationId);
      if (markers.length > 0) {
        let intent = markers.find((marker) => marker.kind === "intent");
        const owner = markers.find((marker) => marker.kind === "owner");
        if (owner) this.assertOwnerAvailable(owner);
        if (!intent && markers.length === 1 && owner) {
          this.appendIntent({
            path: paths.markersPath,
            operationId,
            inventory,
            canonicalProjectRoot: paths.repoRoot,
          });
          intent = this.readMarkers(paths.markersPath, operationId).find(
            (marker) => marker.kind === "intent",
          );
        }
        if (!intent) {
          return this.failure("inventory_drift", operationId, paths);
        }
        const complete = markers.find((marker) => marker.kind === "complete");
        if (complete) {
          const prepared = markers.find((marker) => marker.kind === "prepared");
          if (!prepared) throw new MigrationFailure("transaction_tampered");
          // A completed operation is replayed against the canonical corpus,
          // not the volatile all-worktree inventory.  This check must precede
          // inventory_drift (PLAN-L7-533 rev 8).
          const expectedCanonical = complete.payload.canonicalCorpusDigest;
          if (typeof expectedCanonical !== "string") {
            return this.failure("transaction_tampered", operationId, paths);
          }
          const actualCanonical = this.canonicalCorpusDigest(resolved.canonicalProjectRoot);
          if (actualCanonical !== expectedCanonical) {
            return this.failure("replay_corpus_mismatch", operationId, paths);
          }
          this.verifyComplete({ marker: complete, prepared, inventory, paths });
          return {
            ok: true,
            status: "replayed",
            operationId,
            inventoryDigest: inventory.inventoryDigest,
            quarantineRoot: paths.quarantine,
            markersPath: paths.markersPath,
            quarantined: this.conflicts(inventory),
            imported: this.importsFromMarker(prepared),
            invalidMemory: this.invalidMemoryFromMarker(prepared),
          };
        }
        // Incomplete operations still retain the all-worktree inventory
        // binding; only completed replay uses the canonical digest above.
        const durableImports = markers
          .filter((marker) => marker.kind === "imported")
          .map((marker) => this.importFromMarker(marker));
        const recoveredImports = this.recoverUnmarkedImports({
          intent,
          inventory,
          canonicalRoot: paths.repoRoot,
          durable: durableImports,
        });
        for (const entry of recoveredImports) {
          this.appendMarker(paths.markersPath, {
            kind: "imported",
            operationId,
            payload: { file: entry },
          });
        }
        this.assertImportIntent({
          intent,
          inventory,
          canonicalRoot: paths.repoRoot,
          durable: [...durableImports, ...recoveredImports],
        });
        return this.finishExisting({
          inventory,
          operationId,
          paths,
          markers: this.readMarkers(paths.markersPath, operationId),
          crashAfter: options.crashAfter,
        });
      }
      this.appendMarker(paths.markersPath, {
        kind: "owner",
        operationId,
        payload: {
          host: hostname(),
          pid: process.pid,
          previous_complete_digest: predecessor,
        },
      });
      if (options.crashAfter === "owner") return this.interrupted(operationId, paths);
      this.appendIntent({
        path: paths.markersPath,
        operationId,
        inventory,
        canonicalProjectRoot: paths.repoRoot,
      });
      if (options.crashAfter === "intent") return this.interrupted(operationId, paths);
      return this.finishExisting({
        inventory,
        operationId,
        paths,
        markers: this.readMarkers(paths.markersPath, operationId),
        crashAfter: options.crashAfter,
      });
    } catch (error) {
      if (error instanceof MigrationFailure) return this.failure(error.reason, operationId, paths);
      return this.failure("source_unavailable", operationId, paths);
    }
  }

  recover(repoRoot: string, operationId: string): MemoryMigrationApplyResult {
    return this.apply(repoRoot, { operationId });
  }

  private finishExisting({
    inventory,
    operationId,
    paths,
    markers,
    crashAfter,
  }: FinishExistingInput): MemoryMigrationApplyResult {
    const prepared = markers.find((marker) => marker.kind === "prepared");
    const variants = this.conflicts(inventory);
    let imported: MemoryMigrationImport[];
    let invalidMemory: string[];
    if (!prepared) {
      mkdirSync(paths.quarantine, { recursive: true });
      for (const [index, variant] of variants.entries()) {
        const snapshot = this.readSource(variant);
        const destination = join(paths.quarantine, quarantineFileName(variant, index));
        if (existsSync(destination)) {
          const existing = readFileSync(destination);
          if (sha256(existing) !== variant.contentDigest || existing.byteLength !== snapshot.size) {
            throw new MigrationFailure("transaction_tampered");
          }
        } else {
          writeFileSync(destination, snapshot.content, { flag: "wx" });
        }
        this.verifySource(variant, snapshot);
      }
      const expectedManifest = variants.map((variant, index) => ({
        name: quarantineFileName(variant, index),
        digest: variant.contentDigest,
        size: variant.sourceSize,
      }));
      if (!this.manifestEquals(this.quarantineManifest(paths.quarantine), expectedManifest)) {
        throw new MigrationFailure("transaction_tampered");
      }
      invalidMemory = [...(inventory.invalidMemory ?? [])];
      const recordedImports = markers
        .filter((marker) => marker.kind === "imported")
        .map((marker) => this.importFromMarker(marker));
      this.verifyCanonicalImports(recordedImports, paths.repoRoot);
      imported = this.importCanonicalCandidates({
        candidates: this.importCandidates(inventory, paths.repoRoot),
        canonicalRoot: paths.repoRoot,
        recorded: recordedImports,
        record: (entry) =>
          this.appendMarker(paths.markersPath, {
            kind: "imported",
            operationId,
            payload: { file: entry },
          }),
        crashAfter,
      });
      this.appendMarker(paths.markersPath, {
        kind: "prepared",
        operationId,
        payload: {
          files: expectedManifest,
          inventoryDigest: inventory.inventoryDigest,
          imported,
          invalidMemory,
        },
      });
      if (crashAfter === "prepared") return this.interrupted(operationId, paths);
    } else {
      this.verifyPreparedManifest(prepared, paths);
      imported = this.importsFromMarker(prepared);
      invalidMemory = this.invalidMemoryFromMarker(prepared);
      this.verifyCanonicalImports(imported, paths.repoRoot);
    }
    for (const variant of variants) this.verifySource(variant, this.readSource(variant));
    const canonicalCorpusDigest = this.canonicalCorpusDigest(paths.repoRoot);
    const finalDigest = this.quarantineManifestDigest(paths.quarantine);
    this.appendMarker(paths.markersPath, {
      kind: "complete",
      operationId,
      payload: {
        inventoryDigest: inventory.inventoryDigest,
        quarantineDigest: finalDigest,
        canonicalCorpusDigest,
        imported,
        invalidMemory,
      },
    });
    return {
      ok: true,
      status: "completed",
      operationId,
      inventoryDigest: inventory.inventoryDigest,
      quarantineRoot: paths.quarantine,
      markersPath: paths.markersPath,
      quarantined: variants,
      imported,
      invalidMemory,
    };
  }

  private transactionPaths(
    runtimeBusRoot: string,
    repoRoot: string,
    operationId: string,
  ): TransactionPaths {
    const root = join(runtimeBusRoot, "memory-migration", operationId);
    return {
      root,
      repoRoot,
      quarantine: join(root, "quarantine"),
      markersPath: join(root, "markers.jsonl"),
    };
  }

  /** Resolve the chain tip without relying on operation id or filesystem time. */
  private previousCompleteDigest(
    runtimeBusRoot: string,
    excludeOperationId?: string,
  ): string | null {
    const migrationRoot = join(runtimeBusRoot, "memory-migration");
    if (!existsSync(migrationRoot)) return null;
    const rootStat = lstatSync(migrationRoot);
    if (!rootStat.isDirectory() || rootStat.isSymbolicLink())
      throw new MigrationFailure("transaction_tampered");
    const operations: Array<{ complete: Marker; previous: string | null }> = [];
    let incomplete = false;
    for (const operationId of readdirSync(migrationRoot).sort(compare)) {
      if (operationId === excludeOperationId) continue;
      if (!safeOperationId(operationId)) throw new MigrationFailure("transaction_tampered");
      const operationRoot = join(migrationRoot, operationId);
      const stat = lstatSync(operationRoot);
      if (!stat.isDirectory() || stat.isSymbolicLink())
        throw new MigrationFailure("transaction_tampered");
      const markers = this.readMarkers(join(operationRoot, "markers.jsonl"), operationId);
      const complete = markers.find((marker) => marker.kind === "complete");
      if (!complete) {
        incomplete = true;
        continue;
      }
      operations.push({ complete, previous: this.readPreviousCompleteDigest(markers) });
    }
    // readMarkers validates every operation before precedence is selected, so a
    // later tampered record cannot be hidden by an earlier incomplete operation.
    if (incomplete) throw new MigrationFailure("migration_incomplete");
    const completeDigests = new Set(operations.map((operation) => operation.complete.recordDigest));
    const referenced = new Set<string>();
    for (const operation of operations) {
      if (operation.previous !== null) {
        if (!completeDigests.has(operation.previous))
          throw new MigrationFailure("operation_chain_ambiguous");
        if (referenced.has(operation.previous))
          throw new MigrationFailure("operation_chain_ambiguous");
        referenced.add(operation.previous);
      }
    }
    const roots = operations.filter((operation) => operation.previous === null);
    const tips = operations.filter((operation) => !referenced.has(operation.complete.recordDigest));
    if (roots.length !== 1 || tips.length !== 1)
      throw new MigrationFailure("operation_chain_ambiguous");
    return tips[0].complete.recordDigest;
  }

  private readPreviousCompleteDigest(markers: readonly Marker[]): string | null {
    const owner = markers.find((marker) => marker.kind === "owner");
    if (!owner) throw new MigrationFailure("transaction_tampered");
    const value = owner.payload.previous_complete_digest;
    if (value === undefined || value === null) return null;
    if (typeof value !== "string" || value.length === 0)
      throw new MigrationFailure("transaction_tampered");
    return value;
  }

  private failure(
    reason: MemoryMigrationApplyResult extends infer T
      ? T extends { ok: false; reason: infer R }
        ? R
        : never
      : never,
    operationId: string,
    paths: TransactionPaths,
  ): MemoryMigrationApplyResult {
    return {
      ok: false,
      reason,
      operationId,
      quarantineRoot: paths.quarantine,
      markersPath: paths.markersPath,
    };
  }

  private interrupted(operationId: string, paths: TransactionPaths): MemoryMigrationApplyResult {
    return this.failure("transaction_interrupted", operationId, paths);
  }

  private appendMarker(
    path: string,
    input: { kind: MarkerKind; operationId: string; payload: Record<string, unknown> },
  ): void {
    const prior = existsSync(path) ? this.readMarkers(path, input.operationId).at(-1) : undefined;
    const unsigned = {
      sequence: (prior?.sequence ?? 0) + 1,
      kind: input.kind,
      operationId: input.operationId,
      payload: input.payload,
      previousRecordDigest: prior?.recordDigest ?? null,
    } satisfies Omit<Marker, "recordDigest">;
    const marker: Marker = { ...unsigned, recordDigest: markerDigest(unsigned) };
    appendFileSync(path, markerLine(marker), { encoding: "utf8", flag: "a" });
    const fd = openSync(path, "r+");
    try {
      fsyncSync(fd);
    } finally {
      closeSync(fd);
    }
  }

  private appendIntent({
    path,
    operationId,
    inventory,
    canonicalProjectRoot,
  }: AppendIntentInput): void {
    this.appendMarker(path, {
      kind: "intent",
      operationId,
      payload: {
        inventoryDigest: inventory.inventoryDigest,
        imports: this.importClaims(this.importCandidates(inventory, canonicalProjectRoot)),
        conflicts: this.conflicts(inventory).map((variant) => ({
          worktreeRoot: variant.worktreeRoot,
          sourcePath: variant.sourcePath,
          contentDigest: variant.contentDigest,
          sourceHandleIdentity: variant.sourceHandleIdentity,
          sourceSize: variant.sourceSize,
          sourceMtimeMs: variant.sourceMtimeMs,
        })),
      },
    });
  }

  private importClaims(
    candidates: readonly MemoryMigrationVariant[],
  ): Array<Record<string, unknown>> {
    return candidates.map((variant) => ({
      memoryId: variant.memoryId,
      sourceWorktreeRoot: normalizeTopologyPath(variant.worktreeRoot),
      sourcePath: variant.sourcePath,
      contentDigest: variant.contentDigest,
      size: variant.sourceSize,
    }));
  }

  private assertImportIntent({
    intent,
    inventory,
    canonicalRoot,
    durable,
  }: AssertImportIntentInput): void {
    if (!Array.isArray(intent.payload.imports)) throw new MigrationFailure("transaction_tampered");
    const remaining = this.importClaims(this.importCandidates(inventory, canonicalRoot));
    const completed = durable.map(({ destinationPath: _destinationPath, ...entry }) => entry);
    const actual = [...completed, ...remaining].sort((left, right) =>
      compare(canonicalJson(left), canonicalJson(right)),
    );
    const expected = [...intent.payload.imports].sort((left, right) =>
      compare(canonicalJson(left), canonicalJson(right)),
    );
    if (canonicalJson(actual) !== canonicalJson(expected))
      throw new MigrationFailure("inventory_drift");
    if (!Array.isArray(intent.payload.conflicts))
      throw new MigrationFailure("transaction_tampered");
    const expectedLinkedConflicts = intent.payload.conflicts.filter(
      (value): value is Record<string, unknown> =>
        Boolean(value) &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        typeof (value as Record<string, unknown>).worktreeRoot === "string" &&
        normalizeTopologyPath(String((value as Record<string, unknown>).worktreeRoot)) !==
          normalizeTopologyPath(canonicalRoot),
    );
    const actualLinkedConflicts = this.conflicts(inventory)
      .filter(
        (variant) =>
          normalizeTopologyPath(variant.worktreeRoot) !== normalizeTopologyPath(canonicalRoot),
      )
      .map((variant) => ({
        worktreeRoot: variant.worktreeRoot,
        sourcePath: variant.sourcePath,
        contentDigest: variant.contentDigest,
        sourceHandleIdentity: variant.sourceHandleIdentity,
        sourceSize: variant.sourceSize,
        sourceMtimeMs: variant.sourceMtimeMs,
      }));
    if (canonicalJson(actualLinkedConflicts) !== canonicalJson(expectedLinkedConflicts))
      throw new MigrationFailure("inventory_drift");
  }

  private recoverUnmarkedImports({
    intent,
    inventory,
    canonicalRoot,
    durable,
  }: RecoverUnmarkedImportsInput): MemoryMigrationImport[] {
    if (!Array.isArray(intent.payload.imports)) throw new MigrationFailure("transaction_tampered");
    const durableSources = new Set(
      durable.map((entry) => sourceIdentityKey(entry.sourceWorktreeRoot, entry.sourcePath)),
    );
    const canonicalPath = normalizeTopologyPath(canonicalRoot);
    const recovered: MemoryMigrationImport[] = [];
    for (const value of intent.payload.imports) {
      if (!value || typeof value !== "object" || Array.isArray(value))
        throw new MigrationFailure("transaction_tampered");
      const claim = value as Record<string, unknown>;
      if (
        typeof claim.memoryId !== "string" ||
        typeof claim.sourceWorktreeRoot !== "string" ||
        typeof claim.sourcePath !== "string" ||
        typeof claim.contentDigest !== "string" ||
        typeof claim.size !== "number"
      ) {
        throw new MigrationFailure("transaction_tampered");
      }
      if (durableSources.has(sourceIdentityKey(claim.sourceWorktreeRoot, claim.sourcePath)))
        continue;
      const group = inventory.groups.find((candidate) => candidate.memoryId === claim.memoryId);
      const source = group?.variants.find(
        (variant) =>
          normalizeTopologyPath(variant.worktreeRoot) === claim.sourceWorktreeRoot &&
          variant.sourcePath === claim.sourcePath &&
          variant.contentDigest === claim.contentDigest &&
          variant.sourceSize === claim.size,
      );
      if (!source) throw new MigrationFailure("transaction_tampered");
      const canonicalVariants = group?.variants.filter(
        (variant) => normalizeTopologyPath(variant.worktreeRoot) === canonicalPath,
      );
      if (!canonicalVariants || canonicalVariants.length === 0) continue;
      const canonical = canonicalVariants.find(
        (variant) =>
          variant.contentDigest === claim.contentDigest && variant.sourceSize === claim.size,
      );
      if (!canonical) throw new MigrationFailure("transaction_tampered");
      const sourceSnapshot = this.readSource(source);
      this.verifySource(source, sourceSnapshot);
      const canonicalSnapshot = this.readSource(canonical);
      this.verifySource(canonical, canonicalSnapshot);
      if (sourceSnapshot.content !== canonicalSnapshot.content)
        throw new MigrationFailure("inventory_drift");
      recovered.push({
        memoryId: claim.memoryId,
        sourceWorktreeRoot: claim.sourceWorktreeRoot,
        sourcePath: claim.sourcePath,
        destinationPath: canonical.sourcePath,
        contentDigest: claim.contentDigest,
        size: claim.size,
      });
    }
    return recovered;
  }

  private readMarkers(path: string, operationId: string): Marker[] {
    if (!existsSync(path)) return [];
    const lines = readFileSync(path, "utf8")
      .split("\n")
      .filter((line) => line.length > 0);
    const markers: Marker[] = [];
    let previous: string | null = null;
    for (const [index, line] of lines.entries()) {
      let value: unknown;
      try {
        value = JSON.parse(line);
      } catch {
        throw new MigrationFailure("transaction_tampered");
      }
      if (!value || typeof value !== "object") throw new MigrationFailure("transaction_tampered");
      const marker = value as Partial<Marker>;
      const priorKind = markers.at(-1)?.kind;
      const expectedKinds: readonly MarkerKind[] =
        index === 0
          ? ["owner"]
          : priorKind === "owner"
            ? ["intent"]
            : priorKind === "intent" || priorKind === "imported"
              ? ["imported", "prepared"]
              : priorKind === "prepared"
                ? ["complete"]
                : [];
      if (
        marker.sequence !== index + 1 ||
        marker.operationId !== operationId ||
        typeof marker.kind !== "string" ||
        !expectedKinds.includes(marker.kind as MarkerKind) ||
        !marker.kind ||
        !marker.payload ||
        Array.isArray(marker.payload) ||
        (marker.previousRecordDigest ?? null) !== previous ||
        typeof marker.recordDigest !== "string"
      ) {
        throw new MigrationFailure("transaction_tampered");
      }
      const { recordDigest: _recordDigest, ...unsigned } = marker as Marker;
      if (markerDigest(unsigned) !== marker.recordDigest) {
        throw new MigrationFailure("transaction_tampered");
      }
      markers.push(marker as Marker);
      previous = marker.recordDigest;
    }
    return markers;
  }

  private assertOwnerAvailable(marker: Marker): void {
    const owner = marker.payload;
    if (owner.host !== hostname() || typeof owner.pid !== "number") {
      throw new MigrationFailure("transaction_busy");
    }
    if (owner.pid !== process.pid && processIsAlive(owner.pid)) {
      throw new MigrationFailure("transaction_busy");
    }
  }

  private conflicts(
    inventory: Extract<MemoryMigrationDryRun, { ok: true }>,
  ): MemoryMigrationVariant[] {
    return inventory.groups
      .filter((group) => group.disposition === "conflict")
      .flatMap((group) =>
        group.variants.map((variant) => ({ ...variant, memoryId: group.memoryId })),
      );
  }

  private readSource(variant: MemoryMigrationVariant): SourceSnapshot {
    const path = join(variant.worktreeRoot, variant.sourcePath);
    let before: ReturnType<typeof lstatSync>;
    try {
      before = lstatSync(path);
    } catch {
      throw new MigrationFailure("source_unavailable");
    }
    if (!before.isFile() || before.isSymbolicLink()) throw new MigrationFailure("source_unsafe");
    let content: string;
    try {
      content = this.ports.read(path);
    } catch (error) {
      if (error instanceof InventoryDenied) throw error;
      throw new MigrationFailure("source_unavailable");
    }
    let after: ReturnType<typeof lstatSync>;
    try {
      after = lstatSync(path);
    } catch {
      throw new MigrationFailure("source_changed");
    }
    const beforeIdentity = `${String(before.dev)}:${String(before.ino)}`;
    const afterIdentity = `${String(after.dev)}:${String(after.ino)}`;
    if (
      beforeIdentity !== afterIdentity ||
      before.size !== after.size ||
      before.mtimeMs !== after.mtimeMs
    ) {
      throw new MigrationFailure("source_changed");
    }
    return { content, handleIdentity: beforeIdentity, size: before.size, mtimeMs: before.mtimeMs };
  }

  private verifySource(variant: MemoryMigrationVariant, snapshot: SourceSnapshot): void {
    if (
      variant.sourceHandleIdentity !== snapshot.handleIdentity ||
      variant.sourceSize !== snapshot.size ||
      variant.sourceMtimeMs !== snapshot.mtimeMs ||
      sha256(snapshot.content) !== variant.contentDigest
    ) {
      throw new MigrationFailure("source_changed");
    }
  }

  private quarantineManifest(root: string): Array<{ name: string; digest: string; size: number }> {
    if (!existsSync(root)) return [];
    return readdirSync(root)
      .sort(compare)
      .map((name) => {
        const bytes = readFileSync(join(root, name));
        return { name, digest: sha256(bytes), size: bytes.byteLength };
      });
  }

  private quarantineManifestDigest(root: string): string {
    return sha256(canonicalJson(this.quarantineManifest(root)));
  }

  private verifyPreparedManifest(marker: Marker, paths: TransactionPaths): void {
    if (!Array.isArray(marker.payload.files)) throw new MigrationFailure("transaction_tampered");
    const expected = marker.payload.files.map((value) => {
      if (
        !value ||
        typeof value !== "object" ||
        typeof (value as Record<string, unknown>).name !== "string" ||
        typeof (value as Record<string, unknown>).digest !== "string" ||
        typeof (value as Record<string, unknown>).size !== "number"
      ) {
        throw new MigrationFailure("transaction_tampered");
      }
      return value as { name: string; digest: string; size: number };
    });
    if (!this.manifestEquals(this.quarantineManifest(paths.quarantine), expected)) {
      throw new MigrationFailure("transaction_tampered");
    }
  }

  private importsFromMarker(marker: Marker): MemoryMigrationImport[] {
    if (!Array.isArray(marker.payload.imported)) throw new MigrationFailure("transaction_tampered");
    return marker.payload.imported.map((value) => {
      if (!value || typeof value !== "object") throw new MigrationFailure("transaction_tampered");
      const candidate = value as Partial<MemoryMigrationImport>;
      if (
        typeof candidate.memoryId !== "string" ||
        typeof candidate.sourceWorktreeRoot !== "string" ||
        typeof candidate.sourcePath !== "string" ||
        typeof candidate.destinationPath !== "string" ||
        typeof candidate.contentDigest !== "string" ||
        typeof candidate.size !== "number"
      ) {
        throw new MigrationFailure("transaction_tampered");
      }
      return candidate as MemoryMigrationImport;
    });
  }

  private importFromMarker(marker: Marker): MemoryMigrationImport {
    if (!marker.payload.file || typeof marker.payload.file !== "object")
      throw new MigrationFailure("transaction_tampered");
    const candidate = marker.payload.file as Partial<MemoryMigrationImport>;
    if (
      typeof candidate.memoryId !== "string" ||
      typeof candidate.sourceWorktreeRoot !== "string" ||
      typeof candidate.sourcePath !== "string" ||
      typeof candidate.destinationPath !== "string" ||
      typeof candidate.contentDigest !== "string" ||
      typeof candidate.size !== "number"
    ) {
      throw new MigrationFailure("transaction_tampered");
    }
    return candidate as MemoryMigrationImport;
  }

  private invalidMemoryFromMarker(marker: Marker): string[] {
    if (!Array.isArray(marker.payload.invalidMemory))
      throw new MigrationFailure("transaction_tampered");
    if (!marker.payload.invalidMemory.every((value) => typeof value === "string"))
      throw new MigrationFailure("transaction_tampered");
    return marker.payload.invalidMemory as string[];
  }

  private canonicalCorpusDigest(repoRoot: string): string {
    const root = memoryStorageRoot(repoRoot);
    if (!existsSync(root)) return sha256("[]");
    const stat = lstatSync(root);
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw new MigrationFailure("source_unsafe");
    const files: Array<{ path: string; memoryId: string; digest: string; size: number }> = [];
    for (const name of readdirSync(root).sort(compare)) {
      if (!name.endsWith(".md")) continue;
      const path = join(root, name);
      const file = lstatSync(path);
      if (!file.isFile() || file.isSymbolicLink()) throw new MigrationFailure("source_unsafe");
      const bytes = readFileSync(path);
      const entry = this.parseImportEntry(
        repoRoot,
        `.ut-tdd/memory/${name}`,
        bytes.toString("utf8"),
      );
      files.push({
        path: `.ut-tdd/memory/${name}`,
        memoryId: entry.memory_id,
        digest: entry.content_hash,
        size: bytes.byteLength,
      });
    }
    return sha256(canonicalJson(files));
  }

  private parseImportEntry(repoRoot: string, sourcePath: string, content: string): MemoryEntry {
    let entry: MemoryEntry;
    try {
      entry = parseMemoryFile(repoRoot, sourcePath, content);
    } catch {
      throw new MigrationFailure("invalid_memory");
    }
    // parseMemoryFile intentionally permits legacy empty updated_at values;
    // migration import is stricter and must not become a cleansing path.
    if (!entry.memory_id || !entry.updated_at.trim()) throw new MigrationFailure("invalid_memory");
    return entry;
  }

  private verifyCanonicalImports(
    imports: readonly MemoryMigrationImport[],
    repoRoot: string,
  ): void {
    for (const imported of imports) {
      const path = join(repoRoot, imported.destinationPath);
      let bytes: Buffer;
      try {
        bytes = readFileSync(path);
      } catch {
        throw new MigrationFailure("inventory_drift");
      }
      if (bytes.byteLength !== imported.size || sha256(bytes) !== imported.contentDigest)
        throw new MigrationFailure("inventory_drift");
      const entry = this.parseImportEntry(
        repoRoot,
        imported.destinationPath,
        bytes.toString("utf8"),
      );
      if (entry.memory_id !== imported.memoryId) throw new MigrationFailure("transaction_tampered");
    }
  }

  private importCandidates(
    inventory: Extract<MemoryMigrationDryRun, { ok: true }>,
    canonicalRoot: string,
  ): MemoryMigrationVariant[] {
    const canonical = new Set(
      inventory.groups
        .flatMap((group) => group.variants)
        .filter(
          (variant) =>
            normalizeTopologyPath(variant.worktreeRoot) === normalizeTopologyPath(canonicalRoot),
        )
        .map((variant) => `${variant.memoryId}\0${variant.contentDigest}`),
    );
    const candidates: MemoryMigrationVariant[] = [];
    for (const group of inventory.groups) {
      for (const variant of group.variants) {
        if (normalizeTopologyPath(variant.worktreeRoot) === normalizeTopologyPath(canonicalRoot))
          continue;
        if (isTracked(variant.worktreeRoot, variant.sourcePath)) continue;
        if (canonical.has(`${variant.memoryId}\0${variant.contentDigest}`)) continue;
        // A divergent memory_id is quarantined by the existing conflict path.
        // Only a unique residue (no other digest for this id) is importable.
        if (group.disposition === "conflict") continue;
        candidates.push(variant);
      }
    }
    return candidates.sort((left, right) =>
      compare(
        `${left.memoryId}\0${left.worktreeRoot}\0${left.sourcePath}`,
        `${right.memoryId}\0${right.worktreeRoot}\0${right.sourcePath}`,
      ),
    );
  }

  private importCanonicalCandidates({
    candidates,
    canonicalRoot,
    recorded,
    record,
    crashAfter,
  }: ImportCanonicalCandidatesInput): MemoryMigrationImport[] {
    const imported: MemoryMigrationImport[] = [...recorded];
    const recordedBySource = new Map(
      recorded.map((entry) => [
        sourceIdentityKey(entry.sourceWorktreeRoot, entry.sourcePath),
        entry,
      ]),
    );
    mkdirSync(memoryStorageRoot(canonicalRoot), { recursive: true });
    for (const variant of candidates) {
      const prior = recordedBySource.get(
        sourceIdentityKey(variant.worktreeRoot, variant.sourcePath),
      );
      if (prior) {
        if (
          prior.memoryId !== variant.memoryId ||
          prior.sourceWorktreeRoot !== normalizeTopologyPath(variant.worktreeRoot) ||
          prior.contentDigest !== variant.contentDigest ||
          prior.size !== variant.sourceSize
        ) {
          throw new MigrationFailure("transaction_tampered");
        }
        continue;
      }
      const snapshot = this.readSource(variant);
      this.verifySource(variant, snapshot);
      const entry = this.parseImportEntry(canonicalRoot, variant.sourcePath, snapshot.content);
      const destinationPath = `.ut-tdd/memory/${memoryFileNameFor(entry.kind, entry.memory_id)}`;
      const destination = join(canonicalRoot, destinationPath);
      let existing: Buffer | undefined;
      try {
        existing = readFileSync(destination);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT")
          throw new MigrationFailure("source_unavailable");
      }
      if (existing) {
        if (sha256(existing) !== variant.contentDigest || existing.byteLength !== snapshot.size)
          throw new MigrationFailure("inventory_drift");
      } else {
        try {
          writeFileSync(destination, snapshot.content, { encoding: "utf8", flag: "wx" });
        } catch {
          throw new MigrationFailure("source_unavailable");
        }
        if (crashAfter === "write_before_import_marker")
          throw new MigrationFailure("transaction_interrupted");
      }
      const importedEntry: MemoryMigrationImport = {
        memoryId: entry.memory_id,
        sourceWorktreeRoot: normalizeTopologyPath(variant.worktreeRoot),
        sourcePath: variant.sourcePath,
        destinationPath,
        contentDigest: variant.contentDigest,
        size: snapshot.size,
      };
      record(importedEntry);
      imported.push(importedEntry);
      if (crashAfter === "first_import" && imported.length === 1)
        throw new MigrationFailure("transaction_interrupted");
    }
    return imported;
  }

  private verifyPrepared(
    marker: Marker,
    variants: readonly MemoryMigrationVariant[],
    paths: TransactionPaths,
  ): void {
    const expected = variants.map((variant, index) => ({
      name: quarantineFileName(variant, index),
      digest: variant.contentDigest,
      size: variant.sourceSize,
    }));
    const payload = marker.payload.files;
    if (!Array.isArray(payload)) throw new MigrationFailure("transaction_tampered");
    const actual = this.quarantineManifest(paths.quarantine);
    if (!this.manifestEquals(actual, expected)) {
      throw new MigrationFailure("transaction_tampered");
    }
    const recorded = marker.payload.files;
    if (!Array.isArray(recorded) || !this.manifestEquals(actual, recorded)) {
      throw new MigrationFailure("transaction_tampered");
    }
  }

  private verifyComplete({ marker, prepared, inventory, paths }: VerifyCompleteInput): void {
    if (
      typeof marker.payload.inventoryDigest !== "string" ||
      typeof prepared.payload.inventoryDigest !== "string" ||
      marker.payload.inventoryDigest !== prepared.payload.inventoryDigest ||
      !this.manifestEquals(marker.payload.imported, prepared.payload.imported) ||
      !this.manifestEquals(marker.payload.invalidMemory, prepared.payload.invalidMemory) ||
      marker.payload.quarantineDigest !== this.quarantineManifestDigest(paths.quarantine)
    ) {
      throw new MigrationFailure("transaction_tampered");
    }
    this.verifyPreparedManifest(prepared, paths);
    this.verifyCanonicalImports(this.importsFromMarker(prepared), paths.repoRoot);
  }

  private manifestEquals(left: unknown, right: unknown): boolean {
    return canonicalJson(left) === canonicalJson(right);
  }

  private inventory(repoRoot: string, options: InventoryOptions = {}): MemoryMigrationDryRun {
    const root = resolveProjectMemoryRoot(repoRoot);
    if (!root.ok) return root;
    let topology: WorktreeTopologyCollection;
    try {
      topology = this.ports.collect(root.canonicalProjectRoot);
    } catch {
      throw new InventoryDenied("topology_unavailable");
    }
    if (!analyzeWorktreeTopology(topology).ok || topology.facts.length === 0) {
      throw new InventoryDenied("topology_unavailable");
    }
    const worktrees = topology.facts.map((fact) => fact.worktreePathKey).sort(compare);
    if (
      new Set(worktrees).size !== worktrees.length ||
      !worktrees.includes(normalizeTopologyPath(root.canonicalProjectRoot))
    ) {
      throw new InventoryDenied("topology_unavailable");
    }
    // Validate every HEAD/common-dir before reading any memory body.
    for (const worktree of worktrees) {
      const resolved = resolveProjectMemoryRoot(worktree);
      if (!resolved.ok) throw new InventoryDenied(resolved.reason);
      if (resolved.projectId !== root.projectId || resolved.gitCommonDir !== root.gitCommonDir) {
        throw new InventoryDenied("project_identity_drift");
      }
    }
    const entries = new Map<string, MemoryMigrationVariant[]>();
    const invalidMemory: string[] = [];
    for (const worktree of worktrees) {
      this.collectMemory(worktree, entries, {
        canonicalRoot: root.canonicalProjectRoot,
        allowInvalid: options.allowInvalidLinked === true,
        invalidMemory,
      });
    }
    const groups = [...entries]
      .sort(([left], [right]) => compare(left, right))
      .map(
        ([memoryId, variants]): MemoryMigrationGroup => ({
          memoryId,
          disposition:
            new Set(variants.map((variant) => variant.contentDigest)).size > 1
              ? "conflict"
              : variants.length > 1
                ? "dedupe"
                : "unique",
          variants,
        }),
      );
    return {
      ok: true,
      projectId: root.projectId,
      inventoryDigest: createHash("sha256")
        .update(JSON.stringify({ projectId: root.projectId, worktrees, groups }))
        .digest("hex"),
      hasConflicts: groups.some((group) => group.disposition === "conflict"),
      groups,
      ...(invalidMemory.length > 0 ? { invalidMemory: invalidMemory.sort(compare) } : {}),
    };
  }

  private collectMemory(
    worktree: string,
    entries: Map<string, MemoryMigrationVariant[]>,
    options: { canonicalRoot: string; allowInvalid: boolean; invalidMemory: string[] },
  ): void {
    // Reject directory links for legacy roots as well as the already-validated primary root.
    for (const directory of [join(worktree, ".ut-tdd"), memoryStorageRoot(worktree)]) {
      let stat: ReturnType<typeof lstatSync>;
      try {
        stat = lstatSync(directory);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") return;
        throw error;
      }
      if (!stat.isDirectory() || stat.isSymbolicLink()) throw new InventoryDenied("source_unsafe");
    }
    const directory = memoryStorageRoot(worktree);
    for (const name of readdirSync(directory).sort(compare)) {
      if (!name.endsWith(".md")) continue;
      const sourcePath = `.ut-tdd/memory/${name}`;
      const path = join(directory, name);
      const stat = lstatSync(path);
      if (!stat.isFile() || stat.isSymbolicLink()) throw new InventoryDenied("source_unsafe");
      const content = this.ports.read(path);
      const after = lstatSync(path);
      const beforeIdentity = `${String(stat.dev)}:${String(stat.ino)}`;
      const afterIdentity = `${String(after.dev)}:${String(after.ino)}`;
      if (
        beforeIdentity !== afterIdentity ||
        stat.size !== after.size ||
        stat.mtimeMs !== after.mtimeMs
      ) {
        throw new InventoryDenied("source_changed");
      }
      let entry: ReturnType<typeof parseMemoryFile>;
      try {
        entry = parseMemoryFile(worktree, sourcePath, content);
      } catch {
        if (
          options.allowInvalid &&
          normalizeTopologyPath(worktree) !== normalizeTopologyPath(options.canonicalRoot)
        ) {
          options.invalidMemory.push(`${normalizeTopologyPath(worktree)}:${sourcePath}`);
          continue;
        }
        throw new InventoryDenied("invalid_memory");
      }
      if (!entry.memory_id || !entry.updated_at.trim()) {
        if (
          options.allowInvalid &&
          normalizeTopologyPath(worktree) !== normalizeTopologyPath(options.canonicalRoot)
        ) {
          options.invalidMemory.push(`${normalizeTopologyPath(worktree)}:${sourcePath}`);
          continue;
        }
        throw new InventoryDenied("invalid_memory");
      }
      const variants = entries.get(entry.memory_id) ?? [];
      variants.push({
        memoryId: entry.memory_id,
        worktreeRoot: worktree,
        sourcePath,
        contentDigest: entry.content_hash,
        sourceHandleIdentity: beforeIdentity,
        sourceSize: stat.size,
        sourceMtimeMs: stat.mtimeMs,
      });
      entries.set(entry.memory_id, variants);
    }
  }
}
