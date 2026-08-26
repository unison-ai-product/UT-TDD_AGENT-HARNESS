import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  realpathSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
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
  const descriptor = openSync(target, "wx", 0o600);
  try {
    writeFileSync(descriptor, serialized, "utf8");
  } finally {
    closeSync(descriptor);
  }
  return target;
}
