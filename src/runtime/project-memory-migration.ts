import { execFileSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import {
  closeSync,
  constants,
  copyFileSync,
  existsSync,
  fstatSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readdirSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve } from "node:path";
import { readMemory } from "../memory/service.ts";
import { requireProjectMemoryRoot } from "./project-memory-root.ts";

export interface ProjectMemoryInventoryEntry {
  readonly memoryId: string;
  readonly digest: string;
  readonly sourcePath: string;
}

export interface ProjectMemoryMigrationReceipt {
  readonly schema: "ut-tdd.project-memory-migration/v1";
  readonly projectId: string;
  readonly inventoryDigest: string;
  readonly canonical: readonly ProjectMemoryInventoryEntry[];
  readonly duplicates: readonly ProjectMemoryInventoryEntry[];
  readonly conflicts: readonly {
    readonly memoryId: string;
    readonly variants: readonly ProjectMemoryInventoryEntry[];
  }[];
  readonly outcome: "ready" | "quarantine_required";
}

export interface ProjectMemoryMigrationCompletion {
  readonly schema: "ut-tdd.project-memory-migration-completion/v1";
  readonly projectId: string;
  readonly inventoryDigest: string;
  readonly corpusDigest: string;
  readonly operationId: string;
  readonly outcome: "applied" | "quarantined";
  readonly sourceCount: number;
  readonly destinationCount: number;
}

interface ProjectMemoryMigrationTransaction {
  readonly schema: "ut-tdd.project-memory-migration-transaction/v1";
  readonly projectId: string;
  readonly inventoryDigest: string;
  readonly target: string;
  readonly backup: string;
  readonly staging: string;
  readonly hadTarget: boolean;
  readonly priorCorpusDigest: string | null;
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function valid(entry: ProjectMemoryInventoryEntry): boolean {
  return (
    entry.memoryId.startsWith("memory:") &&
    /^[a-f0-9]{64}$/.test(entry.digest) &&
    entry.sourcePath.trim().length > 0
  );
}

function digest(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

function atomicWrite(target: string, content: string): void {
  mkdirSync(dirname(target), { recursive: true });
  const temporary = `${target}.tmp-${process.pid}-${Date.now()}`;
  const descriptor = openSync(temporary, "wx", 0o600);
  try {
    writeFileSync(descriptor, content, "utf8");
    fsyncSync(descriptor);
  } finally {
    closeSync(descriptor);
  }
  try {
    renameSync(temporary, target);
  } catch (error) {
    rmSync(temporary, { force: true });
    throw error;
  }
}

function assertRegularContainedFile(path: string, allowedRoots: readonly string[]): Buffer {
  const absolute = resolve(path);
  const descriptor = openSync(absolute, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
  try {
    const before = fstatSync(descriptor);
    if (!before.isFile()) throw new Error("project_memory_migration_source_unsafe");
    const named = lstatSync(absolute);
    if (!named.isFile() || named.isSymbolicLink()) {
      throw new Error("project_memory_migration_source_unsafe");
    }
    const real = realpathSync(absolute);
    if (
      !allowedRoots.some((root) => {
        try {
          const rel = relative(realpathSync(root), real);
          return rel !== "" && !rel.startsWith("..") && !isAbsolute(rel);
        } catch {
          return false;
        }
      })
    ) {
      throw new Error("project_memory_migration_source_escape");
    }
    const resolved = statSync(real);
    if (before.dev !== resolved.dev || before.ino !== resolved.ino) {
      throw new Error("project_memory_migration_source_changed");
    }
    const content = readFileSync(descriptor);
    const after = fstatSync(descriptor);
    if (
      before.dev !== after.dev ||
      before.ino !== after.ino ||
      before.size !== after.size ||
      before.mtimeMs !== after.mtimeMs
    ) {
      throw new Error("project_memory_migration_source_changed");
    }
    return content;
  } finally {
    closeSync(descriptor);
  }
}

function directoryDigest(root: string): string {
  const parts: string[] = [];
  const visit = (directory: string): void => {
    for (const name of readdirSync(directory).sort()) {
      const path = join(directory, name);
      const stat = lstatSync(path);
      if (stat.isSymbolicLink()) throw new Error("project_memory_migration_corpus_unsafe");
      if (stat.isDirectory()) {
        visit(path);
        continue;
      }
      if (!stat.isFile()) throw new Error("project_memory_migration_corpus_unsafe");
      parts.push(`${relative(root, path).replaceAll("\\", "/")}\0${digest(readFileSync(path))}`);
    }
  };
  if (existsSync(root)) visit(root);
  return digest(parts.join("\n"));
}

function assertDirectoryDigest(root: string, expected: string): void {
  const stat = lstatSync(root);
  if (!stat.isDirectory() || stat.isSymbolicLink() || directoryDigest(root) !== expected) {
    throw new Error("project_memory_migration_backup_corrupt");
  }
}

function migrationTarget(
  project: ReturnType<typeof requireProjectMemoryRoot>,
  receipt: ProjectMemoryMigrationReceipt,
): string {
  return receipt.outcome === "ready"
    ? project.authoredMemoryRoot
    : join(project.runtimeBusRoot, "memory-migration", "quarantine", receipt.inventoryDigest);
}

function validateCompletion(input: {
  completion: ProjectMemoryMigrationCompletion;
  projectId: string;
  receipt: ProjectMemoryMigrationReceipt;
  operationId: string;
  target: string;
}): void {
  const expectedOutcome = input.receipt.outcome === "ready" ? "applied" : "quarantined";
  if (
    input.completion.schema !== "ut-tdd.project-memory-migration-completion/v1" ||
    input.completion.projectId !== input.projectId ||
    input.completion.inventoryDigest !== input.receipt.inventoryDigest ||
    input.completion.operationId !== input.operationId ||
    input.completion.outcome !== expectedOutcome ||
    !/^[a-f0-9]{64}$/.test(input.completion.corpusDigest) ||
    !Number.isSafeInteger(input.completion.sourceCount) ||
    !Number.isSafeInteger(input.completion.destinationCount) ||
    !existsSync(input.target) ||
    directoryDigest(input.target) !== input.completion.corpusDigest
  ) {
    throw new Error("project_memory_migration_completion_corrupt");
  }
}

function recoverProjectMemoryMigration(input: {
  transactionPath: string;
  completionPath: string;
  migrationRoot: string;
  expectedTarget: string;
  projectId: string;
  receipt: ProjectMemoryMigrationReceipt;
  operationId: string;
}): void {
  if (!existsSync(input.transactionPath)) return;
  const transaction = JSON.parse(
    readFileSync(input.transactionPath, "utf8"),
  ) as ProjectMemoryMigrationTransaction;
  if (
    transaction.schema !== "ut-tdd.project-memory-migration-transaction/v1" ||
    transaction.projectId !== input.projectId ||
    transaction.inventoryDigest !== input.receipt.inventoryDigest ||
    (transaction.priorCorpusDigest !== null &&
      !/^[a-f0-9]{64}$/.test(transaction.priorCorpusDigest)) ||
    resolve(transaction.target) !== resolve(input.expectedTarget) ||
    dirname(resolve(transaction.backup)) !== dirname(resolve(input.expectedTarget)) ||
    !basename(transaction.backup).startsWith(`${basename(input.expectedTarget)}.backup-`) ||
    (() => {
      const rel = relative(resolve(input.migrationRoot, "staging"), resolve(transaction.staging));
      return !rel || rel.startsWith("..") || isAbsolute(rel);
    })()
  ) {
    throw new Error("project_memory_migration_transaction_corrupt");
  }
  if (existsSync(input.completionPath)) {
    const completion = JSON.parse(
      readFileSync(input.completionPath, "utf8"),
    ) as ProjectMemoryMigrationCompletion;
    validateCompletion({
      completion,
      projectId: input.projectId,
      receipt: input.receipt,
      operationId: input.operationId,
      target: transaction.target,
    });
    rmSync(transaction.backup, { recursive: true, force: true });
    rmSync(transaction.staging, { recursive: true, force: true });
    rmSync(input.transactionPath, { force: true });
    return;
  }
  if (existsSync(transaction.backup)) {
    if (transaction.priorCorpusDigest === null) {
      throw new Error("project_memory_migration_backup_corrupt");
    }
    assertDirectoryDigest(transaction.backup, transaction.priorCorpusDigest);
    rmSync(transaction.target, { recursive: true, force: true });
    renameSync(transaction.backup, transaction.target);
  } else if (transaction.hadTarget) {
    if (
      transaction.priorCorpusDigest === null ||
      !existsSync(transaction.target) ||
      directoryDigest(transaction.target) !== transaction.priorCorpusDigest
    ) {
      throw new Error("project_memory_migration_backup_missing");
    }
  } else {
    rmSync(transaction.target, { recursive: true, force: true });
  }
  rmSync(transaction.staging, { recursive: true, force: true });
  rmSync(input.transactionPath, { force: true });
}

function processAlive(pid: number): boolean {
  if (!Number.isSafeInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === "EPERM";
  }
}

function acquireMigrationLock(lock: string): string {
  const nonce = `${process.pid}-${Date.now()}-${randomUUID()}`;
  mkdirSync(dirname(lock), { recursive: true });
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      mkdirSync(lock);
      atomicWrite(
        join(lock, "owner.json"),
        `${canonicalJson({ schema: "ut-tdd.project-memory-lock/v1", pid: process.pid, nonce })}\n`,
      );
      return nonce;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      const ownerPath = join(lock, "owner.json");
      if (!existsSync(ownerPath)) throw new Error("project_memory_migration_in_progress");
      let owner: { schema?: string; pid?: number };
      try {
        owner = JSON.parse(readFileSync(ownerPath, "utf8")) as typeof owner;
      } catch {
        throw new Error("project_memory_migration_lock_corrupt");
      }
      if (owner.schema !== "ut-tdd.project-memory-lock/v1") {
        throw new Error("project_memory_migration_lock_corrupt");
      }
      if (processAlive(Number(owner.pid))) {
        throw new Error("project_memory_migration_in_progress");
      }
      const stale = `${lock}.stale-${nonce}`;
      try {
        renameSync(lock, stale);
      } catch {
        throw new Error("project_memory_migration_in_progress");
      }
      rmSync(stale, { recursive: true, force: true });
    }
  }
  throw new Error("project_memory_migration_in_progress");
}

function releaseMigrationLock(lock: string, nonce: string): void {
  const ownerPath = join(lock, "owner.json");
  if (!existsSync(ownerPath)) return;
  const owner = JSON.parse(readFileSync(ownerPath, "utf8")) as { nonce?: string };
  if (owner.nonce !== nonce) throw new Error("project_memory_migration_lock_owner_mismatch");
  rmSync(lock, { recursive: true, force: true });
}

/** Decide migration without writing either the canonical corpus or quarantine. */
export function planProjectMemoryMigration(input: {
  readonly projectId: string;
  readonly entries: readonly ProjectMemoryInventoryEntry[];
}): ProjectMemoryMigrationReceipt {
  if (!input.projectId.trim()) throw new Error("project_memory_migration_project_id_required");
  if (input.entries.some((entry) => !valid(entry))) {
    throw new Error("project_memory_migration_inventory_invalid");
  }

  const ordered = [...input.entries].sort(
    (left, right) =>
      left.memoryId.localeCompare(right.memoryId) ||
      left.digest.localeCompare(right.digest) ||
      left.sourcePath.localeCompare(right.sourcePath),
  );
  const canonical: ProjectMemoryInventoryEntry[] = [];
  const duplicates: ProjectMemoryInventoryEntry[] = [];
  const conflicts: Array<{
    memoryId: string;
    variants: ProjectMemoryInventoryEntry[];
  }> = [];

  for (const memoryId of [...new Set(ordered.map((entry) => entry.memoryId))]) {
    const variants = ordered.filter((entry) => entry.memoryId === memoryId);
    const digests = new Set(variants.map((entry) => entry.digest));
    if (digests.size > 1) {
      conflicts.push({ memoryId, variants });
      continue;
    }
    canonical.push(variants[0]);
    duplicates.push(...variants.slice(1));
  }

  return {
    schema: "ut-tdd.project-memory-migration/v1",
    projectId: input.projectId,
    inventoryDigest: createHash("sha256")
      .update(`ut-tdd-project-memory-inventory\0${canonicalJson(ordered)}`, "utf8")
      .digest("hex"),
    canonical,
    duplicates,
    conflicts,
    outcome: conflicts.length === 0 ? "ready" : "quarantine_required",
  };
}

function linkedWorktreeRoots(repoRoot: string): string[] {
  const output = execFileSync("git", ["-C", repoRoot, "worktree", "list", "--porcelain"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
  return output
    .split(/\r?\n/)
    .filter((line) => line.startsWith("worktree "))
    .map((line) => realpathSync(line.slice("worktree ".length)));
}

/** Inventory every linked worktree before any migration write is admitted. */
export function inventoryProjectMemory(repoRoot: string): ProjectMemoryMigrationReceipt {
  const project = requireProjectMemoryRoot(repoRoot);
  const entries: ProjectMemoryInventoryEntry[] = [];
  for (const worktreeRoot of linkedWorktreeRoots(repoRoot)) {
    const candidate = requireProjectMemoryRoot(worktreeRoot);
    if (
      candidate.projectId !== project.projectId ||
      candidate.gitCommonDir !== project.gitCommonDir ||
      candidate.canonicalProjectRoot !== project.canonicalProjectRoot
    ) {
      throw new Error("project_memory_migration_topology_drift");
    }
    for (const entry of readMemory({ repoRoot: worktreeRoot }).entries) {
      entries.push({
        memoryId: entry.memory_id,
        digest: entry.content_hash,
        sourcePath: join(worktreeRoot, entry.source_path),
      });
    }
  }
  return planProjectMemoryMigration({ projectId: project.projectId, entries });
}

export function persistProjectMemoryMigrationReceipt(
  repoRoot: string,
  receipt: ProjectMemoryMigrationReceipt,
): string {
  const project = requireProjectMemoryRoot(repoRoot);
  if (receipt.projectId !== project.projectId) {
    throw new Error("project_memory_migration_receipt_project_mismatch");
  }
  const directory = join(project.runtimeBusRoot, "memory-migration", "receipts");
  mkdirSync(directory, { recursive: true });
  const target = join(directory, `${receipt.inventoryDigest}.json`);
  const serialized = `${canonicalJson(receipt)}\n`;
  if (existsSync(target)) {
    if (readFileSync(target, "utf8") === serialized) return target;
    throw new Error("project_memory_migration_receipt_conflict");
  }
  atomicWrite(target, serialized);
  return target;
}

/** Apply a revalidated inventory as one corpus/quarantine directory transition. */
function applyProjectMemoryMigrationUnlocked(input: {
  readonly repoRoot: string;
  readonly receipt: ProjectMemoryMigrationReceipt;
  readonly operationId: string;
}): ProjectMemoryMigrationCompletion {
  if (!input.operationId.trim()) {
    throw new Error("project_memory_migration_operation_id_required");
  }
  const project = requireProjectMemoryRoot(input.repoRoot);
  if (input.receipt.projectId !== project.projectId) {
    throw new Error("project_memory_migration_receipt_project_mismatch");
  }

  const migrationRoot = join(project.runtimeBusRoot, "memory-migration");
  const completionPath = join(migrationRoot, "completed", `${input.receipt.inventoryDigest}.json`);
  const transactionPath = join(
    migrationRoot,
    "transactions",
    `${input.receipt.inventoryDigest}.json`,
  );
  const target = migrationTarget(project, input.receipt);
  recoverProjectMemoryMigration({
    transactionPath,
    completionPath,
    migrationRoot,
    expectedTarget: target,
    projectId: project.projectId,
    receipt: input.receipt,
    operationId: input.operationId,
  });
  if (existsSync(completionPath)) {
    const existing = JSON.parse(
      readFileSync(completionPath, "utf8"),
    ) as ProjectMemoryMigrationCompletion;
    validateCompletion({
      completion: existing,
      projectId: project.projectId,
      receipt: input.receipt,
      operationId: input.operationId,
      target,
    });
    return existing;
  }

  const fresh = inventoryProjectMemory(input.repoRoot);
  if (
    fresh.inventoryDigest !== input.receipt.inventoryDigest ||
    canonicalJson(fresh) !== canonicalJson(input.receipt)
  ) {
    throw new Error("project_memory_migration_inventory_changed");
  }

  const roots = linkedWorktreeRoots(input.repoRoot).map((root) => join(root, ".ut-tdd", "memory"));
  const selected =
    input.receipt.outcome === "ready"
      ? input.receipt.canonical
      : input.receipt.conflicts.flatMap((conflict) => conflict.variants);
  const bytes = new Map<string, Buffer>();
  for (const entry of selected) {
    const content = assertRegularContainedFile(entry.sourcePath, roots);
    if (digest(content) !== entry.digest) {
      throw new Error("project_memory_migration_inventory_changed");
    }
    bytes.set(`${entry.memoryId}\0${entry.digest}\0${entry.sourcePath}`, content);
  }

  const staging = join(migrationRoot, "staging", `${input.receipt.inventoryDigest}-${process.pid}`);
  rmSync(staging, { recursive: true, force: true });
  mkdirSync(staging, { recursive: true });
  let destinationCount = 0;
  let corpusDigest = "";
  const backup = `${target}.backup-${process.pid}`;
  const hadTarget = existsSync(target);
  const priorCorpusDigest = hadTarget ? directoryDigest(target) : null;
  try {
    if (input.receipt.outcome === "ready") {
      if (hadTarget) {
        for (const name of readdirSync(target).sort()) {
          const source = join(target, name);
          const stat = lstatSync(source);
          if (!stat.isFile() || stat.isSymbolicLink()) {
            throw new Error("project_memory_migration_corpus_unsafe");
          }
          copyFileSync(source, join(staging, name));
        }
      }
      for (const entry of input.receipt.canonical) {
        const name = basename(entry.sourcePath);
        const destination = join(staging, name);
        const content = bytes.get(`${entry.memoryId}\0${entry.digest}\0${entry.sourcePath}`);
        if (!content) throw new Error("project_memory_migration_inventory_changed");
        if (existsSync(destination) && digest(readFileSync(destination)) !== entry.digest) {
          throw new Error("project_memory_migration_destination_conflict");
        }
        if (!existsSync(destination))
          writeFileSync(destination, content, { flag: "wx", mode: 0o600 });
      }
      destinationCount = readdirSync(staging).length;
      corpusDigest = directoryDigest(staging);
    } else {
      for (const conflict of input.receipt.conflicts) {
        const memoryDirectory = join(staging, digest(conflict.memoryId));
        mkdirSync(memoryDirectory, { recursive: true });
        for (const entry of conflict.variants) {
          const content = bytes.get(`${entry.memoryId}\0${entry.digest}\0${entry.sourcePath}`);
          if (!content) throw new Error("project_memory_migration_inventory_changed");
          const destination = join(memoryDirectory, `${entry.digest}.md`);
          if (!existsSync(destination))
            writeFileSync(destination, content, { flag: "wx", mode: 0o600 });
          destinationCount += 1;
        }
      }
      corpusDigest = directoryDigest(staging);
    }

    mkdirSync(dirname(target), { recursive: true });
    atomicWrite(
      transactionPath,
      `${canonicalJson({
        schema: "ut-tdd.project-memory-migration-transaction/v1",
        projectId: project.projectId,
        inventoryDigest: input.receipt.inventoryDigest,
        target,
        backup,
        staging,
        hadTarget,
        priorCorpusDigest,
      } satisfies ProjectMemoryMigrationTransaction)}\n`,
    );
    if (hadTarget) renameSync(target, backup);
    renameSync(staging, target);

    const completion: ProjectMemoryMigrationCompletion = {
      schema: "ut-tdd.project-memory-migration-completion/v1",
      projectId: project.projectId,
      inventoryDigest: input.receipt.inventoryDigest,
      corpusDigest,
      operationId: input.operationId,
      outcome: input.receipt.outcome === "ready" ? "applied" : "quarantined",
      sourceCount: selected.length,
      destinationCount,
    };
    atomicWrite(completionPath, `${canonicalJson(completion)}\n`);
    if (hadTarget) rmSync(backup, { recursive: true, force: true });
    rmSync(transactionPath, { force: true });
    return completion;
  } catch (error) {
    recoverProjectMemoryMigration({
      transactionPath,
      completionPath,
      migrationRoot,
      expectedTarget: target,
      projectId: project.projectId,
      receipt: input.receipt,
      operationId: input.operationId,
    });
    throw error;
  } finally {
    rmSync(staging, { recursive: true, force: true });
  }
}

export function applyProjectMemoryMigration(input: {
  readonly repoRoot: string;
  readonly receipt: ProjectMemoryMigrationReceipt;
  readonly operationId: string;
}): ProjectMemoryMigrationCompletion {
  const project = requireProjectMemoryRoot(input.repoRoot);
  const lock = join(
    project.runtimeBusRoot,
    "memory-migration",
    "locks",
    input.receipt.inventoryDigest,
  );
  const nonce = acquireMigrationLock(lock);
  try {
    return applyProjectMemoryMigrationUnlocked(input);
  } finally {
    releaseMigrationLock(lock, nonce);
  }
}
