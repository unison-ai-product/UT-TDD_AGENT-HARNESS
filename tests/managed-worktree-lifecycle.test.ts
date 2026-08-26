import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { JsonlLifecycleLedger } from "../src/runtime/worktree-lifecycle/adapters/jsonl-ledger.ts";
import {
  ManagedWorktreeCoordinator,
  type ManagedWorktreePorts,
} from "../src/runtime/worktree-lifecycle/application/managed-worktree.ts";
import type { LifecycleEvent } from "../src/runtime/worktree-lifecycle/domain/types.ts";

function input() {
  return {
    repositoryLineageId: "lineage-1",
    lifecycleId: "issue-425-worker-1",
    ownerSessionId: "session-1",
    issueId: 425,
    planId: "PLAN-L7-511-managed-worktree-lifecycle",
    planRevision: "revision-1",
    use: "worker" as const,
    branch: "feat/issue425-worker",
    headOid: "a".repeat(40),
    worktreePath: "C:/dev/ut-issue425-worker",
    ttlMs: 60_000,
    parentProcessId: "100",
    parentSessionId: "session-1",
  };
}

function ports(): ManagedWorktreePorts {
  return {
    now: () => "2026-08-26T00:00:00.000Z",
    canonicalizePath: (path) => path.replaceAll("\\", "/"),
    allowedRoot: "C:/dev",
    resolvePlannedAdminEntry: vi.fn(() => "C:/git/worktrees/worker"),
    reservePath: vi.fn(() => ({ leaseId: "lease-1", receiptDigest: "sha256:lease" })),
    releasePath: vi.fn(() => "sha256:released"),
    createWorktree: vi.fn(() => ({ adminEntryRealpath: "C:/git/worktrees/worker" })),
    observeWorktree: vi.fn(() => ({ inventoryAvailable: true, identityMatches: true })),
    append: vi.fn(),
    enqueueCleanup: vi.fn(),
  };
}

describe("managed worktree lifecycle", () => {
  const roots: string[] = [];
  afterEach(() => {
    for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
  });

  it("CANDIDATE-U-WTMAN-001 rejects incomplete or escaped creation before Git mutation", () => {
    for (const mutation of [
      { ownerSessionId: "" },
      { issueId: 0 },
      { planId: "" },
      { planRevision: "" },
      { ttlMs: 0 },
      { worktreePath: "C:/Users/micro/orphan" },
    ]) {
      const deps = ports();
      const coordinator = new ManagedWorktreeCoordinator(deps);
      expect(() => coordinator.create({ ...input(), ...mutation })).toThrow();
      expect(deps.createWorktree).not.toHaveBeenCalled();
    }
  });

  it("CANDIDATE-U-WTMAN-002 records compensation when Git creation fails", () => {
    const deps = ports();
    vi.mocked(deps.createWorktree).mockImplementation(() => {
      throw new Error("git failed");
    });
    const coordinator = new ManagedWorktreeCoordinator(deps);
    expect(() => coordinator.create(input())).toThrow("git failed");
    expect(deps.releasePath).toHaveBeenCalledTimes(1);
    expect(deps.enqueueCleanup).toHaveBeenCalledWith(
      expect.objectContaining({ lifecycleId: "issue-425-worker-1", reason: "activation_aborted" }),
    );
    expect(vi.mocked(deps.append).mock.calls.map(([event]) => event.type)).toEqual([
      "planned",
      "activation_aborted",
    ]);
  });

  it("CANDIDATE-U-WTMAN-004 records terminal and cleanup handoff together", () => {
    const deps = ports();
    const coordinator = new ManagedWorktreeCoordinator(deps);
    const active = coordinator.create(input());
    coordinator.finish({
      identity: active.identity,
      attempt: active.attempt,
      kind: "success",
      terminalReceiptDigest: "sha256:terminal",
    });
    expect(vi.mocked(deps.append).mock.calls.map(([event]) => event.type)).toEqual([
      "planned",
      "activated",
      "terminal_pending",
    ]);
    expect(deps.enqueueCleanup).toHaveBeenLastCalledWith(
      expect.objectContaining({ terminalReceiptDigest: "sha256:terminal" }),
    );
  });

  it("CANDIDATE-U-WTMAN-003 rejects a modified hash-chain without appending", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-wt-ledger-"));
    roots.push(root);
    const path = join(root, "ledger.jsonl");
    const ledger = new JsonlLifecycleLedger(path);
    const events: LifecycleEvent[] = [];
    const deps: ManagedWorktreePorts = { ...ports(), append: (event) => events.push(event) };
    new ManagedWorktreeCoordinator(deps).create(input());
    ledger.append(events[0]);
    ledger.append(events[1]);
    expect(ledger.read()).toHaveLength(2);

    const tampered = readFileSync(path, "utf8").replace(
      '"ownerSessionId":"session-1"',
      '"ownerSessionId":"forged"',
    );
    writeFileSync(path, tampered, "utf8");
    expect(() => ledger.read()).toThrow("worktree_lifecycle_ledger_chain_mismatch");
    expect(() => ledger.append(events[1])).toThrow("worktree_lifecycle_ledger_chain_mismatch");
    expect(readFileSync(path, "utf8")).toBe(tampered);
  });
});
