import { ProjectMemoryMigration } from "./project-memory-migration.ts";
import type { ProjectMemoryRootDenyReason } from "./project-memory-root.ts";

export type ProjectMemoryCompletionDenyReason =
  | ProjectMemoryRootDenyReason
  | "project_identity_commit_required"
  | "migration_incomplete"
  | "inventory_drift"
  | "transaction_tampered"
  | "source_unavailable"
  | "source_unsafe"
  | "invalid_memory"
  | "topology_unavailable";

export type ProjectMemoryCompletionResult =
  | {
      readonly ok: true;
      readonly projectId: string;
      readonly operationId: string;
      readonly inventoryDigest: string;
    }
  | { readonly ok: false; readonly reason: ProjectMemoryCompletionDenyReason };

/**
 * Read-only admission fence for the canonical project Memory corpus.
 *
 * A completed migration marker is the only authority that opens production
 * Memory ports.  This function never creates a transaction directory, marker,
 * inbox, claim, receipt, or canonical file.
 */
export function inspectProjectMemoryCompletion(repoRoot: string): ProjectMemoryCompletionResult {
  return new ProjectMemoryMigration().inspectCompletion(repoRoot);
}

/** Throw a typed, stable error for production ports that must fail closed. */
export function requireProjectMemoryCompletion(
  repoRoot: string,
): Extract<ProjectMemoryCompletionResult, { ok: true }> {
  const result = inspectProjectMemoryCompletion(repoRoot);
  if (!result.ok) {
    throw new ProjectMemoryCompletionError(result.reason);
  }
  return result;
}

export class ProjectMemoryCompletionError extends Error {
  readonly reason: ProjectMemoryCompletionDenyReason;

  constructor(reason: ProjectMemoryCompletionDenyReason) {
    super(`memory_migration_${reason}`);
    this.name = "ProjectMemoryCompletionError";
    this.reason = reason;
  }
}
