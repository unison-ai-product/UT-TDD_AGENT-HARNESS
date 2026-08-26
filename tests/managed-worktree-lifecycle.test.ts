import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { checkWorktreeLifecycle } from "../src/doctor/runtime-state.ts";
import {
  JsonlLifecycleLedger,
  resolveWorktreeLifecycleLedgerPath,
} from "../src/runtime/worktree-lifecycle/adapters/jsonl-ledger.ts";
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

  it("CANDIDATE-U-WTMAN-002 compensates inventory and identity failures", () => {
    for (const observation of [
      { inventoryAvailable: false, identityMatches: false },
      { inventoryAvailable: true, identityMatches: false },
    ]) {
      const deps = ports();
      vi.mocked(deps.observeWorktree).mockReturnValue(observation);
      const coordinator = new ManagedWorktreeCoordinator(deps);
      expect(() => coordinator.create(input())).toThrow();
      expect(deps.releasePath).toHaveBeenCalledTimes(1);
      expect(deps.enqueueCleanup).toHaveBeenCalledWith(
        expect.objectContaining({ reason: "activation_aborted" }),
      );
    }
  });

  it("CANDIDATE-U-WTMAN-002 releases the lease when planned persistence fails", () => {
    const deps = ports();
    vi.mocked(deps.append).mockImplementationOnce(() => {
      throw new Error("ledger unavailable");
    });
    const coordinator = new ManagedWorktreeCoordinator(deps);
    expect(() => coordinator.create(input())).toThrow("ledger unavailable");
    expect(deps.releasePath).toHaveBeenCalledTimes(1);
    expect(deps.createWorktree).not.toHaveBeenCalled();
    expect(deps.enqueueCleanup).toHaveBeenCalledWith(
      expect.objectContaining({ lifecycleId: "issue-425-worker-1", reason: "activation_aborted" }),
    );
  });

  it("CANDIDATE-U-WTMAN-004 records terminal and cleanup handoff together", () => {
    const deps = ports();
    const coordinator = new ManagedWorktreeCoordinator(deps);
    const active = coordinator.create(input());
    expect(active.adminEntryRealpath).toBe("C:/git/worktrees/worker");
    coordinator.finish({
      identity: active.identity,
      attempt: active.attempt,
      ownerSessionId: "session-1",
      kind: "success",
      terminalReceiptDigest: "sha256:terminal",
    });
    expect(vi.mocked(deps.append).mock.calls.map(([event]) => event.type)).toEqual([
      "planned",
      "activated",
      "terminal_pending",
    ]);
    expect(deps.enqueueCleanup).toHaveBeenLastCalledWith(
      expect.objectContaining({
        terminalReceiptDigest: "sha256:terminal",
        pathLeaseReleaseReceiptDigest: "sha256:released",
      }),
    );
  });

  it("CANDIDATE-U-WTMAN-004 denies a foreign owner before releasing the lease", () => {
    const deps = ports();
    const coordinator = new ManagedWorktreeCoordinator(deps);
    const active = coordinator.create(input());
    expect(() =>
      coordinator.finish({
        identity: active.identity,
        attempt: active.attempt,
        ownerSessionId: "foreign-session",
        kind: "failure",
        terminalReceiptDigest: "sha256:foreign",
      }),
    ).toThrow("managed_worktree_owner_mismatch");
    expect(deps.releasePath).not.toHaveBeenCalled();
    expect(deps.enqueueCleanup).not.toHaveBeenCalled();
  });

  it("CANDIDATE-U-WTMAN-005 projects active ownership for status and Stop reconciliation", () => {
    const deps = ports();
    const coordinator = new ManagedWorktreeCoordinator(deps);
    const active = coordinator.create(input());
    expect(coordinator.records()).toEqual([
      expect.objectContaining({
        identity: active.identity,
        ownerSessionId: "session-1",
        issueId: 425,
        state: "active",
      }),
    ]);
    expect(Object.isFrozen(coordinator.records())).toBe(true);
  });

  it("CANDIDATE-U-WTMAN-006 surfaces expired managed ownership through doctor", () => {
    const deps = ports();
    const coordinator = new ManagedWorktreeCoordinator(deps);
    coordinator.create(input());
    expect(
      checkWorktreeLifecycle(
        {
          repoRoot: "C:/dev/repo",
          now: "2026-08-26T00:02:00.000Z",
          readText: () => null,
          listDir: () => [],
          worktreeLifecycle: () => coordinator.records(),
        },
        {
          facts: [
            {
              worktreePathKey: "C:/dev/unmanaged-worker",
              adminPathKey: "C:/git/worktrees/unmanaged-worker",
              branch: "feat/unmanaged",
              headOid: "b".repeat(40),
              isMain: false,
              directoryObserved: true,
              worktreeToAdminOk: true,
              adminToWorktreeOk: true,
              dirty: false,
              mergedIntoMain: false,
            },
          ],
          adminEntries: [],
        },
      ),
    ).toContain("expired=1");
    expect(
      checkWorktreeLifecycle(
        {
          repoRoot: "C:/dev/repo",
          now: "2026-08-26T00:00:30.000Z",
          readText: () => null,
          listDir: () => [],
          worktreeLifecycle: () => coordinator.records(),
        },
        {
          facts: [
            {
              worktreePathKey: "C:/dev/unmanaged-worker",
              adminPathKey: "C:/git/worktrees/unmanaged-worker",
              branch: "feat/unmanaged",
              headOid: "b".repeat(40),
              isMain: false,
              directoryObserved: true,
              worktreeToAdminOk: true,
              adminToWorktreeOk: true,
              dirty: false,
              mergedIntoMain: false,
            },
          ],
          adminEntries: [],
        },
      ),
    ).toContain("unmanaged=1");
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

    const replayPorts = ports();
    const replayed = new ManagedWorktreeCoordinator(
      replayPorts,
      ledger.read().map((entry) => entry.event),
    );
    replayed.finish({
      identity: events[0].identity,
      attempt: 1,
      ownerSessionId: "session-1",
      kind: "success",
      terminalReceiptDigest: "sha256:replayed-terminal",
    });
    expect(replayPorts.enqueueCleanup).toHaveBeenCalledWith(
      expect.objectContaining({ terminalReceiptDigest: "sha256:replayed-terminal" }),
    );

    const tampered = readFileSync(path, "utf8").replace(
      '"ownerSessionId":"session-1"',
      '"ownerSessionId":"forged"',
    );
    writeFileSync(path, tampered, "utf8");
    expect(() => ledger.read()).toThrow("worktree_lifecycle_ledger_chain_mismatch");
    expect(() => ledger.append(events[1])).toThrow("worktree_lifecycle_ledger_chain_mismatch");
    expect(readFileSync(path, "utf8")).toBe(tampered);
  });

  it("CANDIDATE-P-WTMAN-001 shares a ledger only through the same Git common-dir", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-wt-common-"));
    roots.push(root);
    const repo = join(root, "repo");
    const linked = join(root, "linked");
    const other = join(root, "other");
    execFileSync("git", ["init", repo]);
    execFileSync("git", ["-C", repo, "config", "user.email", "test@example.invalid"]);
    execFileSync("git", ["-C", repo, "config", "user.name", "UT Test"]);
    writeFileSync(join(repo, "seed.txt"), "seed\n", "utf8");
    execFileSync("git", ["-C", repo, "add", "seed.txt"]);
    execFileSync("git", ["-C", repo, "commit", "-m", "seed"]);
    execFileSync("git", ["-C", repo, "worktree", "add", "-b", "linked", linked, "HEAD"]);
    execFileSync("git", ["init", other]);

    const fromMain = resolveWorktreeLifecycleLedgerPath({
      repoRoot: repo,
      repositoryLineageId: "project-a",
    });
    const fromLinked = resolveWorktreeLifecycleLedgerPath({
      repoRoot: linked,
      repositoryLineageId: "project-a",
    });
    const fromOther = resolveWorktreeLifecycleLedgerPath({
      repoRoot: other,
      repositoryLineageId: "project-b",
    });
    expect(fromLinked).toBe(fromMain);
    expect(fromOther).not.toBe(fromMain);
  });
});
