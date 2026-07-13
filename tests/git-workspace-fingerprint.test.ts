import { describe, expect, it } from "vitest";
import {
  assertGitWorkspaceUnchanged,
  captureGitWorkspaceFingerprint,
  captureWorkspaceInventory,
  type GitWorkspaceFingerprint,
} from "./support/git-workspace-fingerprint";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { removeTestTree } from "./support/temp-tree";

const fingerprint: GitWorkspaceFingerprint = {
  head: "head",
  statusDigest: "status",
  worktreeDigest: "worktree",
  indexDigest: "index",
  untrackedDigest: "untracked",
  inventoryDigest: "inventory",
  inventoryEntries: [],
};

describe("git workspace fence", () => {
  it("U-TESTHYGIENE-016: inventories ignored files and empty directories", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-fence-"));
    try {
      const before = captureWorkspaceInventory(root).digest;
      mkdirSync(join(root, ".ut-tdd", "gate_runs"), { recursive: true });
      expect(captureWorkspaceInventory(root).digest).not.toBe(before);
      writeFileSync(join(root, ".ut-tdd", "gate_runs", "leak.json"), "{}\n");
      expect(captureWorkspaceInventory(root).digest).not.toBe(before);
    } finally {
      removeTestTree(root);
    }
  });
  it("U-TESTHYGIENE-010: accepts an unchanged dirty baseline", () => {
    expect(() => assertGitWorkspaceUnchanged(fingerprint, { ...fingerprint })).not.toThrow();
  });

  it("U-TESTHYGIENE-020: inventories a non-Git distribution tree without invoking Git", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-pack-fence-"));
    try {
      expect(captureGitWorkspaceFingerprint(root).head).toBe("non-git");
    } finally {
      removeTestTree(root);
    }
  });

  it.each([
    "head",
    "statusDigest",
    "worktreeDigest",
    "indexDigest",
    "untrackedDigest",
    "inventoryDigest",
  ] as const)("U-TESTHYGIENE-011: rejects a changed %s component", (key) => {
    expect(() =>
      assertGitWorkspaceUnchanged(fingerprint, { ...fingerprint, [key]: "mutated" }),
    ).toThrow("workspace fence violation");
  });
});
