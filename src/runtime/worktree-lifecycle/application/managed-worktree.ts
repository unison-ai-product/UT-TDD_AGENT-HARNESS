import { createHash } from "node:crypto";
import { dirname, relative, resolve } from "node:path";
import { WorktreeLifecycleStore } from "../domain/store.ts";
import type {
  LifecycleEvent,
  LifecycleIdentity,
  TerminalInput,
  WorktreeLifecycleRecord,
  WorktreeUse,
} from "../domain/types.ts";

export interface ManagedWorktreeCreateInput {
  readonly repositoryLineageId: string;
  readonly lifecycleId: string;
  readonly ownerSessionId: string;
  readonly issueId: number;
  readonly planId: string;
  readonly planRevision: string;
  readonly use: WorktreeUse;
  readonly branch: string;
  readonly headOid: string;
  readonly worktreePath: string;
  readonly ttlMs: number;
  readonly parentProcessId: string;
  readonly parentSessionId: string;
}

export interface CleanupHandoff {
  readonly lifecycleId: string;
  readonly identity: LifecycleIdentity;
  readonly reason: "activation_aborted" | "terminal_pending";
  readonly terminalReceiptDigest?: string;
  readonly pathLeaseReleaseReceiptDigest?: string;
}

export interface ManagedWorktreePorts {
  readonly now: () => string;
  readonly canonicalizePath: (path: string) => string;
  readonly allowedRoot: string;
  readonly reservePath: (input: {
    lifecycleId: string;
    canonicalWorktreeRealpath: string;
    ownerSessionId: string;
  }) => { leaseId: string; receiptDigest: string };
  readonly releasePath: (leaseId: string) => string;
  readonly createWorktree: (input: ManagedWorktreeCreateInput & { leaseId: string }) => {
    adminEntryRealpath: string;
  };
  readonly observeWorktree: (input: {
    canonicalWorktreeRealpath: string;
    adminEntryRealpath: string;
  }) => { inventoryAvailable: boolean; identityMatches: boolean };
  readonly append: (event: LifecycleEvent) => void;
  readonly enqueueCleanup: (handoff: CleanupHandoff) => void;
}

function digest(value: unknown): string {
  return `sha256:${createHash("sha256").update(JSON.stringify(value)).digest("hex")}`;
}

function required(value: string, field: string): void {
  if (!value.trim()) throw new Error(`managed_worktree_${field}_required`);
}

function addMs(timestamp: string, milliseconds: number): string {
  const value = Date.parse(timestamp);
  if (!Number.isFinite(value)) throw new Error("managed_worktree_clock_invalid");
  return new Date(value + milliseconds).toISOString();
}

function assertDirectChild(root: string, candidate: string): void {
  const normalizedRoot = resolve(root);
  const normalizedCandidate = resolve(candidate);
  const rel = relative(normalizedRoot, normalizedCandidate);
  if (!rel || rel === ".." || rel.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`)) {
    throw new Error("managed_worktree_path_outside_allowed_root");
  }
  if (dirname(normalizedCandidate).toLowerCase() !== normalizedRoot.toLowerCase()) {
    throw new Error("managed_worktree_path_not_direct_child");
  }
}

export class ManagedWorktreeCoordinator {
  private readonly ports: ManagedWorktreePorts;
  private readonly store: WorktreeLifecycleStore;

  constructor(ports: ManagedWorktreePorts, events: readonly LifecycleEvent[] = []) {
    this.ports = ports;
    this.store = new WorktreeLifecycleStore(events);
  }

  create(input: ManagedWorktreeCreateInput): WorktreeLifecycleRecord {
    this.assertCreateInput(input);
    const canonicalWorktreeRealpath = this.ports.canonicalizePath(input.worktreePath);
    const allowedRoot = this.ports.canonicalizePath(this.ports.allowedRoot);
    assertDirectChild(allowedRoot, canonicalWorktreeRealpath);
    const now = this.ports.now();
    const lease = this.ports.reservePath({
      lifecycleId: input.lifecycleId,
      canonicalWorktreeRealpath,
      ownerSessionId: input.ownerSessionId,
    });
    required(lease.leaseId, "path_lease");
    required(lease.receiptDigest, "path_lease_receipt");
    const identity = Object.freeze({
      repositoryLineageId: input.repositoryLineageId,
      lifecycleId: input.lifecycleId,
      canonicalWorktreeRealpath,
    });
    let planned: WorktreeLifecycleRecord | undefined;
    try {
      planned = this.store.plan({
        identity,
        lifecycleId: input.lifecycleId,
        attempt: 1,
        repositoryLineageId: input.repositoryLineageId,
        canonicalWorktreeRealpath,
        ownerSessionId: input.ownerSessionId,
        issueId: input.issueId,
        planId: input.planId,
        planRevision: input.planRevision,
        use: input.use,
        branch: input.branch,
        headOid: input.headOid,
        createdAt: now,
        activationDeadline: addMs(now, Math.min(input.ttlMs, 60_000)),
        expiresAt: addMs(now, input.ttlMs),
        pathLeaseId: lease.leaseId,
        parentProcessId: input.parentProcessId,
        parentSessionId: input.parentSessionId,
      });
      this.appendLatest();
      const created = this.ports.createWorktree({ ...input, leaseId: lease.leaseId });
      const observedAdmin = this.ports.canonicalizePath(created.adminEntryRealpath);
      const inventory = this.ports.observeWorktree({
        canonicalWorktreeRealpath,
        adminEntryRealpath: observedAdmin,
      });
      if (!inventory.inventoryAvailable) throw new Error("managed_worktree_inventory_unavailable");
      if (!inventory.identityMatches) {
        throw new Error("managed_worktree_identity_mismatch");
      }
      const active = this.store.activate(identity, {
        attempt: planned.attempt,
        workerStartReceiptDigest: digest({ identity, lease: lease.receiptDigest, now }),
        adminEntryRealpath: observedAdmin,
        inventoryAvailable: true,
        ownerAuthenticated: true,
      });
      this.appendLatest();
      return active;
    } catch (error) {
      const releaseReceipt = this.ports.releasePath(lease.leaseId);
      if (planned) {
        this.store.abortActivation(identity, {
          attempt: planned.attempt,
          reason: "activation_unresolved",
          activationAbortReceiptDigest: digest({
            identity,
            error: error instanceof Error ? error.message : String(error),
          }),
          pathLeaseRelease: { released: true, receiptDigest: releaseReceipt },
        });
        this.appendLatest();
      }
      this.ports.enqueueCleanup({
        lifecycleId: input.lifecycleId,
        identity,
        reason: "activation_aborted",
      });
      throw error;
    }
  }

  finish(input: {
    identity: LifecycleIdentity;
    attempt: number;
    ownerSessionId: string;
    kind: TerminalInput["kind"];
    terminalReceiptDigest?: string;
    ownerLossEvidence?: TerminalInput["ownerLossEvidence"];
  }): WorktreeLifecycleRecord {
    const current = this.store.get(input.identity);
    if (!current) throw new Error("managed_worktree_lifecycle_unknown");
    if (!input.ownerSessionId.trim() || current.ownerSessionId !== input.ownerSessionId) {
      throw new Error("managed_worktree_owner_mismatch");
    }
    const pathLeaseReleaseReceiptDigest = this.ports.releasePath(current.pathLeaseId);
    const terminal = this.store.terminal(input.identity, {
      attempt: input.attempt,
      kind: input.kind,
      ...(input.terminalReceiptDigest
        ? { terminalReceiptDigest: input.terminalReceiptDigest }
        : {}),
      pathLeaseReleaseReceiptDigest,
      ...(input.ownerLossEvidence ? { ownerLossEvidence: input.ownerLossEvidence } : {}),
    });
    this.appendLatest();
    this.ports.enqueueCleanup({
      lifecycleId: terminal.lifecycleId,
      identity: terminal.identity,
      reason: "terminal_pending",
      ...(terminal.terminalReceiptDigest
        ? { terminalReceiptDigest: terminal.terminalReceiptDigest }
        : {}),
      pathLeaseReleaseReceiptDigest,
    });
    return terminal;
  }

  private appendLatest(): void {
    const events = this.store.events();
    this.ports.append(events[events.length - 1]);
  }

  private assertCreateInput(input: ManagedWorktreeCreateInput): void {
    required(input.repositoryLineageId, "repository_lineage");
    required(input.lifecycleId, "lifecycle_id");
    required(input.ownerSessionId, "owner_session");
    required(input.planId, "plan_id");
    required(input.planRevision, "plan_revision");
    required(input.branch, "branch");
    required(input.parentProcessId, "parent_process");
    required(input.parentSessionId, "parent_session");
    if (!Number.isSafeInteger(input.issueId) || input.issueId < 1) {
      throw new Error("managed_worktree_issue_required");
    }
    if (!Number.isSafeInteger(input.ttlMs) || input.ttlMs < 1) {
      throw new Error("managed_worktree_ttl_required");
    }
    if (!/^[0-9a-f]{40}$/.test(input.headOid)) throw new Error("managed_worktree_head_invalid");
  }
}
