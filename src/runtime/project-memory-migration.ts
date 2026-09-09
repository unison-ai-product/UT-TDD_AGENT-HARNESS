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
import { memoryStorageRoot, parseMemoryFile } from "../memory/index.ts";
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
        | "transaction_busy"
        | "transaction_tampered"
        | "transaction_interrupted";
    };

export interface MemoryMigrationApplyOptions {
  readonly operationId?: string;
  /** Test/fault-injection seam: return an interrupted transaction after this marker. */
  readonly crashAfter?: "owner" | "intent" | "prepared";
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
        | "transaction_busy"
        | "transaction_tampered"
        | "transaction_interrupted";
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

type MarkerKind = "owner" | "intent" | "prepared" | "complete";
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
      return {
        ok: false,
        reason: error instanceof InventoryDenied ? error.reason : "source_unavailable",
      };
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
    try {
      mkdirSync(paths.root, { recursive: true });
      const markers = this.readMarkers(paths.markersPath, operationId);
      if (markers.length > 0) {
        let intent = markers.find((marker) => marker.kind === "intent");
        const owner = markers.find((marker) => marker.kind === "owner");
        if (owner) this.assertOwnerAvailable(owner);
        if (!intent && markers.length === 1 && owner) {
          this.appendIntent(paths.markersPath, operationId, inventory);
          intent = this.readMarkers(paths.markersPath, operationId).find(
            (marker) => marker.kind === "intent",
          );
        }
        if (!intent || intent.payload.inventoryDigest !== inventory.inventoryDigest) {
          return this.failure("inventory_drift", operationId, paths);
        }
        const complete = markers.find((marker) => marker.kind === "complete");
        if (complete) {
          const prepared = markers.find((marker) => marker.kind === "prepared");
          if (!prepared) throw new MigrationFailure("transaction_tampered");
          this.verifyComplete({ marker: complete, prepared, inventory, paths });
          return {
            ok: true,
            status: "replayed",
            operationId,
            inventoryDigest: inventory.inventoryDigest,
            quarantineRoot: paths.quarantine,
            markersPath: paths.markersPath,
            quarantined: this.conflicts(inventory),
          };
        }
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
        payload: { host: hostname(), pid: process.pid },
      });
      if (options.crashAfter === "owner") return this.interrupted(operationId, paths);
      this.appendIntent(paths.markersPath, operationId, inventory);
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
    if (!prepared) {
      mkdirSync(paths.quarantine, { recursive: true });
      const copied: MemoryMigrationVariant[] = [];
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
        copied.push(variant);
      }
      const expectedManifest = variants.map((variant, index) => ({
        name: quarantineFileName(variant, index),
        digest: variant.contentDigest,
        size: variant.sourceSize,
      }));
      if (!this.manifestEquals(this.quarantineManifest(paths.quarantine), expectedManifest)) {
        throw new MigrationFailure("transaction_tampered");
      }
      this.appendMarker(paths.markersPath, {
        kind: "prepared",
        operationId,
        payload: { files: expectedManifest, inventoryDigest: inventory.inventoryDigest },
      });
      if (crashAfter === "prepared") return this.interrupted(operationId, paths);
    } else {
      this.verifyPrepared(prepared, variants, paths);
    }
    for (const variant of variants) this.verifySource(variant, this.readSource(variant));
    const latest = this.inventory(paths.repoRoot);
    if (!latest.ok || latest.inventoryDigest !== inventory.inventoryDigest) {
      throw new MigrationFailure("inventory_drift");
    }
    const finalDigest = this.quarantineManifestDigest(paths.quarantine);
    this.appendMarker(paths.markersPath, {
      kind: "complete",
      operationId,
      payload: { inventoryDigest: inventory.inventoryDigest, quarantineDigest: finalDigest },
    });
    return {
      ok: true,
      status: "completed",
      operationId,
      inventoryDigest: inventory.inventoryDigest,
      quarantineRoot: paths.quarantine,
      markersPath: paths.markersPath,
      quarantined: variants,
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

  private appendIntent(
    path: string,
    operationId: string,
    inventory: Extract<MemoryMigrationDryRun, { ok: true }>,
  ): void {
    this.appendMarker(path, {
      kind: "intent",
      operationId,
      payload: {
        inventoryDigest: inventory.inventoryDigest,
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
      const expectedKind: MarkerKind | undefined = ["owner", "intent", "prepared", "complete"][
        index
      ] as MarkerKind | undefined;
      if (
        marker.sequence !== index + 1 ||
        marker.operationId !== operationId ||
        marker.kind !== expectedKind ||
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
      marker.payload.inventoryDigest !== inventory.inventoryDigest ||
      marker.payload.quarantineDigest !== this.quarantineManifestDigest(paths.quarantine)
    ) {
      throw new MigrationFailure("transaction_tampered");
    }
    this.verifyPrepared(prepared, this.conflicts(inventory), paths);
  }

  private manifestEquals(left: unknown, right: unknown): boolean {
    return canonicalJson(left) === canonicalJson(right);
  }

  private inventory(repoRoot: string): MemoryMigrationDryRun {
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
    for (const worktree of worktrees) this.collectMemory(worktree, entries);
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
    };
  }

  private collectMemory(worktree: string, entries: Map<string, MemoryMigrationVariant[]>): void {
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
        throw new InventoryDenied("invalid_memory");
      }
      if (!entry.memory_id) throw new InventoryDenied("invalid_memory");
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
