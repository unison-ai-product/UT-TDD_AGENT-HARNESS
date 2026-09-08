import { createHash } from "node:crypto";
import { lstatSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  type ProjectMemoryRootDenyReason,
  resolveProjectMemoryRoot,
} from "../runtime/project-memory-root.ts";
import { analyzeWorktreeTopology, normalizeTopologyPath } from "../runtime/worktree-topology.ts";
import {
  collectWorktreeTopology,
  type WorktreeTopologyCollection,
} from "../runtime/worktree-topology-collector.ts";
import { memoryStorageRoot, parseMemoryFile } from "./index.ts";

export interface MemoryMigrationVariant {
  readonly worktreeRoot: string;
  readonly sourcePath: string;
  readonly contentDigest: string;
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
        | "invalid_memory";
    };

export interface MemoryMigrationPorts {
  readonly collect: (root: string) => WorktreeTopologyCollection;
  readonly read: (path: string) => string;
}

class InventoryDenied extends Error {
  constructor(readonly reason: Extract<MemoryMigrationDryRun, { ok: false }>["reason"]) {
    super(reason);
  }
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
      let entry: ReturnType<typeof parseMemoryFile>;
      try {
        entry = parseMemoryFile(worktree, sourcePath, content);
      } catch {
        throw new InventoryDenied("invalid_memory");
      }
      if (!entry.memory_id) throw new InventoryDenied("invalid_memory");
      const variants = entries.get(entry.memory_id) ?? [];
      variants.push({ worktreeRoot: worktree, sourcePath, contentDigest: entry.content_hash });
      entries.set(entry.memory_id, variants);
    }
  }
}
