import { execFileSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import {
  closeSync,
  existsSync,
  fstatSync,
  fsyncSync,
  linkSync,
  lstatSync,
  mkdirSync,
  openSync,
  readdirSync,
  readFileSync,
  readSync,
  realpathSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { resolveProjectMemoryRoot } from "../runtime/project-memory-root.ts";
import { normalizeTopologyPath } from "../runtime/worktree-topology.ts";
import { type MemoryMigrationDryRun, ProjectMemoryMigration } from "./project-memory-migration.ts";

type Inventory = Extract<MemoryMigrationDryRun, { ok: true }>;
type DenyReason =
  | "invalid_input"
  | "inventory_mismatch"
  | "source_drift"
  | "marker_invalid"
  | "owner_unavailable"
  | "filesystem_unsupported"
  | "io_failure"
  | "no_conflicts";
export type MemoryMigrationTransactionResult =
  | {
      readonly ok: true;
      readonly status: "quarantined" | "replayed";
      readonly operationRoot: string;
      readonly quarantineRoot: string;
    }
  | { readonly ok: false; readonly reason: DenyReason };
export interface MemoryMigrationTransactionInput {
  readonly repoRoot: string;
  readonly operationId: string;
  readonly expectedInventoryDigest: string;
}
export type MemoryMigrationTransactionFault =
  | "after-owner"
  | "after-bind"
  | "after-intent"
  | "after-copy"
  | "after-prepared"
  | "after-rename"
  | "before-complete";
interface FileIdentity {
  device: string;
  inode: string;
}
interface Binding {
  version: 1;
  operationId: string;
  projectId: string;
  canonicalRoot: string;
  commonDir: string;
  operationRoot: string;
  rootIdentity: FileIdentity;
  hostFingerprint: string;
}
interface Variant {
  memoryId: string;
  source: string;
  fileName: string;
  digest: string;
}
interface Intent {
  binding: Binding;
  inventoryDigest: string;
  canonicalDigest: string;
  variants: Variant[];
}
interface Owner {
  binding: Binding;
  pid: number;
  token: string;
  parent: string | null;
}
interface Prepared {
  binding: Binding;
  intentDigest: string;
  stage: string;
}
interface RecordValue<T> {
  payload: T;
  identity: FileIdentity;
  digest: string;
}

class Denied extends Error {
  readonly reason: DenyReason;
  constructor(reason: DenyReason) {
    super(reason);
    this.reason = reason;
  }
}
const hash = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");
const equal = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);
function identity(stat: { dev: bigint; ino: bigint }): FileIdentity {
  if (stat.ino === 0n) throw new Denied("filesystem_unsupported");
  return { device: String(stat.dev), inode: String(stat.ino) };
}
function fileIdentity(path: string): FileIdentity {
  return identity(lstatSync(path, { bigint: true }));
}
function secureDirectory(path: string): void {
  const absolute = resolve(path);
  const parent = dirname(absolute);
  if (parent !== absolute) secureDirectory(parent);
  const stat = lstatSync(absolute);
  if (
    !stat.isDirectory() ||
    stat.isSymbolicLink() ||
    !equal(fileIdentity(absolute), fileIdentity(normalizeTopologyPath(realpathSync(absolute))))
  )
    throw new Denied("filesystem_unsupported");
}
function makeDirectory(path: string): void {
  secureDirectory(dirname(path));
  try {
    mkdirSync(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
  }
  secureDirectory(path);
}
function syncDirectory(path: string): void {
  let fd: number | undefined;
  try {
    fd = openSync(path, "r");
    fsyncSync(fd);
  } catch (error) {
    if (
      process.platform !== "win32" ||
      !["EINVAL", "EPERM", "EISDIR"].includes((error as NodeJS.ErrnoException).code ?? "")
    )
      throw error;
  } finally {
    if (fd !== undefined) closeSync(fd);
  }
}
/** Local OS fingerprint is not authentication against a malicious same-OS-user writer. */
function hostFingerprint(): string {
  try {
    if (process.platform === "linux") {
      const value = readFileSync("/etc/machine-id", "utf8").trim();
      if (/^[a-f0-9]{32}$/i.test(value)) return hash(`linux:${value}`);
    }
    if (process.platform === "win32") {
      const value = execFileSync(
        "reg.exe",
        ["query", "HKLM\\SOFTWARE\\Microsoft\\Cryptography", "/v", "MachineGuid"],
        { encoding: "utf8", windowsHide: true, stdio: ["ignore", "pipe", "pipe"] },
      );
      const guid = /MachineGuid\s+REG_SZ\s+([a-f0-9-]{36})/i.exec(value)?.[1];
      if (guid) return hash(`win32:${guid.toLowerCase()}`);
    }
  } catch {
    /* Unknown platform/host cannot authorize owner takeover. */
  }
  throw new Denied("owner_unavailable");
}

/** Immutable, create-exclusive operation records. Published records and previous owners are retained. */
class OperationRecords {
  readonly binding: Binding;
  constructor(binding: Binding) {
    this.binding = binding;
  }
  path(name: string): string {
    if (!/^[a-zA-Z0-9.-]+$/.test(name)) throw new Denied("marker_invalid");
    secureDirectory(this.binding.operationRoot);
    if (!equal(fileIdentity(this.binding.operationRoot), this.binding.rootIdentity))
      throw new Denied("marker_invalid");
    return join(this.binding.operationRoot, name);
  }
  read<T>(name: string): RecordValue<T> | undefined {
    const path = this.path(name);
    let fd: number | undefined;
    try {
      const stat = lstatSync(path, { bigint: true });
      if (!stat.isFile() || stat.isSymbolicLink()) throw new Denied("marker_invalid");
      fd = openSync(path, "r");
      if (!equal(identity(stat), identity(fstatSync(fd, { bigint: true }))))
        throw new Denied("marker_invalid");
      const record = JSON.parse(readFileSync(fd, "utf8")) as RecordValue<T>;
      if (
        !equal(record.identity, identity(stat)) ||
        record.digest !==
          hash(JSON.stringify({ payload: record.payload, identity: record.identity })) ||
        !equal(fileIdentity(path), identity(stat))
      )
        throw new Denied("marker_invalid");
      const payload = record.payload as { binding?: Binding };
      if (!equal(payload?.binding, this.binding)) throw new Denied("marker_invalid");
      return record;
    } catch (error) {
      if (fd === undefined && (error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
      throw new Denied("marker_invalid");
    } finally {
      if (fd !== undefined) closeSync(fd);
    }
  }
  publish<T>(name: string, payload: T): RecordValue<T> {
    const path = this.path(name),
      temporary = `${path}.${randomUUID()}.pending`;
    const fd = openSync(temporary, "wx+", 0o600);
    try {
      const fileIdentity = identity(fstatSync(fd, { bigint: true }));
      const record = {
        payload,
        identity: fileIdentity,
        digest: hash(JSON.stringify({ payload, identity: fileIdentity })),
      };
      writeFileSync(fd, JSON.stringify(record));
      fsyncSync(fd);
    } finally {
      closeSync(fd);
    }
    try {
      linkSync(temporary, path);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "EEXIST") throw new Denied("owner_unavailable");
      throw new Denied("filesystem_unsupported");
    }
    syncDirectory(this.binding.operationRoot);
    const published = this.read<T>(name);
    if (!published) throw new Denied("marker_invalid");
    if (!equal(fileIdentity(temporary), published.identity)) throw new Denied("marker_invalid");
    unlinkSync(temporary);
    syncDirectory(this.binding.operationRoot);
    return published;
  }
  acquire(): void {
    let name = "owner.json",
      parent: string | null = null;
    const visited = new Set<string>();
    for (let depth = 0; depth < 1000; depth++) {
      visited.add(name);
      const existing = this.read<Owner>(name);
      if (!existing) {
        if (
          readdirSync(this.binding.operationRoot).some(
            (entry) =>
              entry.startsWith("owner-next-") && entry.endsWith(".json") && !visited.has(entry),
          )
        )
          throw new Denied("marker_invalid");
        this.publish(name, {
          binding: this.binding,
          pid: process.pid,
          token: randomUUID(),
          parent,
        });
        return;
      }
      const owner = existing.payload;
      if (
        owner.parent !== parent ||
        !Number.isInteger(owner.pid) ||
        owner.pid <= 0 ||
        typeof owner.token !== "string"
      )
        throw new Denied("marker_invalid");
      const next = `owner-next-${existing.digest}.json`;
      if (!this.read<Owner>(next)) {
        try {
          process.kill(owner.pid, 0);
          throw new Denied("owner_unavailable");
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== "ESRCH")
            throw new Denied("owner_unavailable");
        }
      }
      parent = existing.digest;
      name = next;
    }
    throw new Denied("marker_invalid");
  }
}

interface BoundSource {
  path: string;
  fd: number;
  identity: FileIdentity;
  digest: string;
  bytes: Buffer;
}
class BoundSources {
  private readonly sources: BoundSource[] = [];
  constructor(inventory: Inventory) {
    try {
      for (const group of inventory.groups)
        for (const variant of group.variants) {
          const path = join(variant.worktreeRoot, variant.sourcePath);
          secureDirectory(dirname(path));
          const stat = lstatSync(path, { bigint: true });
          if (!stat.isFile() || stat.isSymbolicLink()) throw new Denied("source_drift");
          const capturedIdentity = identity(stat);
          const fd = openSync(path, "r");
          const source: BoundSource = {
            path,
            fd,
            identity: capturedIdentity,
            digest: variant.contentDigest,
            bytes: Buffer.alloc(0),
          };
          this.sources.push(source);
          source.bytes = this.read(source);
        }
    } catch {
      this.close();
      throw new Denied("source_drift");
    }
  }
  private read(source: BoundSource): Buffer {
    secureDirectory(dirname(source.path));
    const stat = fstatSync(source.fd);
    if (
      !equal(identity(fstatSync(source.fd, { bigint: true })), source.identity) ||
      !equal(fileIdentity(source.path), source.identity)
    )
      throw new Denied("source_drift");
    const bytes = Buffer.alloc(stat.size);
    let offset = 0;
    while (offset < bytes.length) {
      const count = readSync(source.fd, bytes, offset, bytes.length - offset, offset);
      if (count === 0) throw new Denied("source_drift");
      offset += count;
    }
    if (
      hash(bytes) !== source.digest ||
      fstatSync(source.fd).size !== stat.size ||
      !equal(fileIdentity(source.path), source.identity)
    )
      throw new Denied("source_drift");
    return bytes;
  }
  assertCurrent(): void {
    try {
      for (const source of this.sources) this.read(source);
    } catch {
      throw new Denied("source_drift");
    }
  }
  bytes(path: string): Buffer {
    const source = this.sources.find((entry) => entry.path === path);
    if (!source) throw new Denied("source_drift");
    return source.bytes;
  }
  close(): void {
    for (const source of this.sources.splice(0)) closeSync(source.fd);
  }
}

/** Conflict quarantine only. Not canonical migration completion, power-loss durability, or atomic protection against hostile syscall-time path substitution. */
export class ProjectMemoryMigrationTransaction {
  private readonly fault: (point: MemoryMigrationTransactionFault) => void;
  constructor(options: { fault?: (point: MemoryMigrationTransactionFault) => void } = {}) {
    this.fault = options.fault ?? (() => {});
  }
  execute(input: MemoryMigrationTransactionInput): MemoryMigrationTransactionResult {
    try {
      return this.run(input);
    } catch (error) {
      return { ok: false, reason: error instanceof Denied ? error.reason : "io_failure" };
    }
  }
  private run(input: MemoryMigrationTransactionInput): MemoryMigrationTransactionResult {
    if (
      !input.operationId ||
      input.operationId.length > 256 ||
      !/^[a-f0-9]{64}$/.test(input.expectedInventoryDigest)
    )
      throw new Denied("invalid_input");
    const root = resolveProjectMemoryRoot(input.repoRoot);
    if (!root.ok) throw new Denied("source_drift");
    const inventory = new ProjectMemoryMigration().dryRun(input.repoRoot);
    if (!inventory.ok || inventory.inventoryDigest !== input.expectedInventoryDigest)
      throw new Denied("inventory_mismatch");
    if (!inventory.hasConflicts) throw new Denied("no_conflicts");
    const host = hostFingerprint();
    const parts = relative(root.gitCommonDir, root.runtimeBusRoot).split(sep);
    let cursor = root.gitCommonDir;
    for (const part of [...parts, "memory-migration", hash(input.operationId)]) {
      cursor = join(cursor, part);
      makeDirectory(cursor);
    }
    const operationRoot = cursor,
      quarantineRoot = join(cursor, "quarantine");
    const binding: Binding = {
      version: 1,
      operationId: input.operationId,
      projectId: root.projectId,
      canonicalRoot: root.canonicalProjectRoot,
      commonDir: root.gitCommonDir,
      operationRoot,
      rootIdentity: fileIdentity(operationRoot),
      hostFingerprint: host,
    };
    const records = new OperationRecords(binding);
    const variants = inventory.groups
      .filter((group) => group.disposition === "conflict")
      .flatMap((group) =>
        group.variants.map((variant) => ({
          memoryId: group.memoryId,
          source: join(variant.worktreeRoot, variant.sourcePath),
          digest: variant.contentDigest,
        })),
      )
      .map((variant, index) => ({
        ...variant,
        fileName: `variant-${String(index).padStart(6, "0")}.md`,
      }));
    const canonical = inventory.groups.flatMap((group) =>
      group.variants
        .filter(
          (variant) => variant.worktreeRoot === normalizeTopologyPath(root.canonicalProjectRoot),
        )
        .map((variant) => [group.memoryId, variant.sourcePath, variant.contentDigest]),
    );
    const intent: Intent = {
      binding,
      inventoryDigest: inventory.inventoryDigest,
      canonicalDigest: hash(JSON.stringify(canonical)),
      variants,
    };
    const existingIntent = records.read<Intent>("intent.json");
    if (existingIntent && !equal(existingIntent.payload, intent))
      throw new Denied("marker_invalid");
    const completed = records.read<{ binding: Binding; preparedDigest: string }>("complete.json");
    if (completed) {
      const prepared = records.read<Prepared>("prepared.json");
      if (
        !existingIntent ||
        !prepared ||
        completed.payload.preparedDigest !== prepared.digest ||
        prepared.payload.intentDigest !== existingIntent.digest
      )
        throw new Denied("marker_invalid");
      this.verifyQuarantine(quarantineRoot, variants);
      return { ok: true, status: "replayed", operationRoot, quarantineRoot };
    }
    records.acquire();
    this.fault("after-owner");
    const sources = new BoundSources(inventory);
    try {
      this.fault("after-bind");
      sources.assertCurrent();
      const savedIntent = existingIntent ?? records.publish("intent.json", intent);
      this.fault("after-intent");
      let prepared = records.read<Prepared>("prepared.json");
      if (!prepared) {
        const stage = `stage-${randomUUID()}`,
          stageRoot = records.path(stage);
        makeDirectory(stageRoot);
        for (const variant of variants) {
          const fd = openSync(join(stageRoot, variant.fileName), "wx", 0o600);
          try {
            writeFileSync(fd, sources.bytes(variant.source));
            fsyncSync(fd);
          } finally {
            closeSync(fd);
          }
          this.fault("after-copy");
        }
        this.verifyQuarantine(stageRoot, variants);
        sources.assertCurrent();
        syncDirectory(stageRoot);
        prepared = records.publish("prepared.json", {
          binding,
          intentDigest: savedIntent.digest,
          stage,
        });
      }
      if (
        prepared.payload.intentDigest !== savedIntent.digest ||
        !/^stage-[a-f0-9-]{36}$/.test(prepared.payload.stage)
      )
        throw new Denied("marker_invalid");
      this.fault("after-prepared");
      sources.assertCurrent();
      if (!existsSync(quarantineRoot)) {
        const stageRoot = records.path(prepared.payload.stage);
        this.verifyQuarantine(stageRoot, variants);
        renameSync(stageRoot, quarantineRoot);
        syncDirectory(operationRoot);
      }
      this.fault("after-rename");
      this.verifyQuarantine(quarantineRoot, variants);
      sources.assertCurrent();
      const current = new ProjectMemoryMigration().dryRun(input.repoRoot);
      if (!current.ok || current.inventoryDigest !== inventory.inventoryDigest)
        throw new Denied("source_drift");
      this.fault("before-complete");
      sources.assertCurrent();
      records.publish("complete.json", { binding, preparedDigest: prepared.digest });
      return { ok: true, status: "quarantined", operationRoot, quarantineRoot };
    } finally {
      sources.close();
    }
  }
  private verifyQuarantine(path: string, variants: Variant[]): void {
    try {
      secureDirectory(path);
      if (!equal(readdirSync(path).sort(), variants.map((variant) => variant.fileName).sort()))
        throw new Error("set mismatch");
      for (const variant of variants) {
        const file = join(path, variant.fileName),
          stat = lstatSync(file);
        if (!stat.isFile() || stat.isSymbolicLink() || hash(readFileSync(file)) !== variant.digest)
          throw new Error("digest mismatch");
      }
    } catch {
      throw new Denied("marker_invalid");
    }
  }
}
