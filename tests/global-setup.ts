import {
  assertGitWorkspaceUnchanged,
  captureGitWorkspaceFingerprint,
} from "./support/git-workspace-fingerprint";
import { spawnSync } from "node:child_process";
import { rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

function runGit(repoRoot: string, args: string[]): void {
  const result = spawnSync("git", args, { cwd: repoRoot, encoding: "utf8" });
  if (result.status !== 0 || result.error) {
    throw new Error(`test HEAD snapshot failed: git ${args.join(" ")}: ${result.error?.message ?? result.stderr}`);
  }
}

export default function setup(): () => void {
  const repoRoot = process.cwd();
  const before = captureGitWorkspaceFingerprint(repoRoot);
  const snapshotRoot = join(tmpdir(), `ut-tdd-test-head-${process.pid}-${Date.now()}`);
  runGit(repoRoot, ["worktree", "add", "--detach", snapshotRoot, "HEAD"]);
  process.env.UT_TDD_TEST_HEAD_SNAPSHOT = snapshotRoot;
  return () => {
    try {
      assertGitWorkspaceUnchanged(before, captureGitWorkspaceFingerprint(repoRoot));
    } finally {
      runGit(repoRoot, ["worktree", "remove", "--force", snapshotRoot]);
      rmSync(snapshotRoot, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 });
    }
  };
}
