import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readMemory, writeMemory } from "../src/memory/service.ts";
import {
  buildClaudeInboxEntry,
  claudeWorkspaceId,
  publishClaudeInboxEntry,
  summarizeUnclaimedInbox,
} from "../src/runtime/claude-memory-wake.ts";
import {
  resolveProjectMemoryRoot,
  resolveProjectMemoryRootWithPorts,
} from "../src/runtime/project-memory-root.ts";

const win = process.platform === "win32";
const primary = win ? "C:\\dev\\product" : "/dev/product";
const linked = win ? "C:\\dev\\product-worker" : "/dev/product-worker";
const common = win ? `${primary}\\.git` : `${primary}/.git`;

function ports(over: Partial<Parameters<typeof resolveProjectMemoryRootWithPorts>[1]> = {}) {
  return {
    gitTopLevel: () => linked,
    gitCommonDir: () => common,
    realpath: (path: string) => path,
    isDirectory: () => true,
    projectIdentity: () => "owner/product",
    ...over,
  };
}

describe("project-scoped canonical Memory root (PLAN-L7-512)", () => {
  it("CANDIDATE-U-PMEMROOT-001: linked worktreeをprimary authored corpusとproject busへ収束する", () => {
    const result = resolveProjectMemoryRootWithPorts(linked, ports());
    expect(result).toMatchObject({
      ok: true,
      projectId: "owner/product",
      currentWorktreeRoot: linked,
      canonicalProjectRoot: primary,
      gitCommonDir: common,
    });
    if (!result.ok) throw new Error(result.reason);
    expect(result.authoredMemoryRoot).toBe(
      win ? `${primary}\\.ut-tdd\\memory` : `${primary}/.ut-tdd/memory`,
    );
    expect(result.runtimeBusRoot).toContain(result.projectNamespace);
    expect(result.projectNamespace).toMatch(/^[a-f0-9]{64}$/);
  });

  it("CANDIDATE-U-PMEMROOT-002: currentとcanonicalのtracked identity driftを拒否する", () => {
    expect(
      resolveProjectMemoryRootWithPorts(
        linked,
        ports({ projectIdentity: (root) => (root === linked ? "owner/product" : "owner/foreign") }),
      ),
    ).toEqual({ ok: false, reason: "project_identity_drift" });
  });

  it("CANDIDATE-U-PMEMROOT-003: identity欠落とbare/異常common-dirをfail-closeする", () => {
    expect(
      resolveProjectMemoryRootWithPorts(linked, ports({ projectIdentity: () => null })),
    ).toEqual({ ok: false, reason: "project_identity_unavailable" });
    expect(
      resolveProjectMemoryRootWithPorts(
        linked,
        ports({ gitCommonDir: () => (win ? "C:\\repos\\bare.git" : "/repos/bare.git") }),
      ),
    ).toEqual({ ok: false, reason: "canonical_root_invalid" });
  });

  it("CANDIDATE-U-PMEMROOT-004: project identityが違えば同名memory用bus namespaceも一致しない", () => {
    const a = resolveProjectMemoryRootWithPorts(linked, ports());
    const b = resolveProjectMemoryRootWithPorts(
      linked,
      ports({ projectIdentity: () => "owner/another-product" }),
    );
    expect(a.ok && b.ok).toBe(true);
    if (!a.ok || !b.ok) throw new Error("unexpected deny");
    expect(a.projectNamespace).not.toBe(b.projectNamespace);
    expect(a.runtimeBusRoot).not.toBe(b.runtimeBusRoot);
  });

  it("CANDIDATE-P-PMEMROOT-001: linked worktree間でauthored corpusと通知busを共有する", () => {
    const main = mkdtempSync(join(tmpdir(), "ut-pmem-main-"));
    const worker = mkdtempSync(join(tmpdir(), "ut-pmem-worker-"));
    rmSync(worker, { recursive: true, force: true });
    try {
      execFileSync("git", ["init", "-q"], { cwd: main });
      execFileSync("git", ["config", "user.email", "test@example.invalid"], { cwd: main });
      execFileSync("git", ["config", "user.name", "UT-TDD test"], { cwd: main });
      writeFileSync(
        join(main, "ut-tdd.project.json"),
        `${JSON.stringify({ schema_version: "ut-tdd.project/v1", repository_identity: "fixture/shared" })}\n`,
        "utf8",
      );
      execFileSync("git", ["add", "ut-tdd.project.json"], { cwd: main });
      execFileSync("git", ["commit", "-qm", "fixture identity"], { cwd: main });
      execFileSync("git", ["worktree", "add", "-q", "-b", "worker", worker, "HEAD"], {
        cwd: main,
      });

      const fromMain = resolveProjectMemoryRoot(main);
      const fromWorker = resolveProjectMemoryRoot(worker);
      expect(fromMain.ok && fromWorker.ok).toBe(true);
      if (!fromMain.ok || !fromWorker.ok) throw new Error("topology unavailable");
      expect(fromWorker.canonicalProjectRoot).toBe(fromMain.canonicalProjectRoot);
      expect(fromWorker.runtimeBusRoot).toBe(fromMain.runtimeBusRoot);

      const entry = writeMemory({
        repoRoot: fromWorker.canonicalProjectRoot,
        input: {
          kind: "project",
          title: "cross worktree",
          body: "workerから書いたproject memory",
          now: "2026-08-26T00:00:00.000Z",
        },
      });
      expect(readMemory({ repoRoot: fromMain.canonicalProjectRoot }).entries).toMatchObject([
        { memory_id: entry.memory_id, body: entry.body },
      ]);

      const targetWorkspaceId = claudeWorkspaceId(main);
      const inboxPath = publishClaudeInboxEntry(
        worker,
        buildClaudeInboxEntry({
          memory: entry,
          operationId: "cross-worktree",
          workspaceId: targetWorkspaceId,
          now: "2026-08-26T00:00:01.000Z",
        }),
      );
      expect(inboxPath.startsWith(fromMain.runtimeBusRoot)).toBe(true);
      expect(summarizeUnclaimedInbox(main, targetWorkspaceId).pending).toBe(1);
      expect(summarizeUnclaimedInbox(main, "f".repeat(64)).foreignPending).toBe(1);
    } finally {
      try {
        execFileSync("git", ["worktree", "remove", "--force", worker], { cwd: main });
      } catch {
        // setup failure before worktree registration
      }
      rmSync(worker, { recursive: true, force: true });
      rmSync(main, { recursive: true, force: true });
    }
  });
});
