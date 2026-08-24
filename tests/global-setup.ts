import { canonicalPath } from "../scripts/run-vitest-snapshot.ts";
import {
  assertGitWorkspaceUnchanged,
  captureGitWorkspaceFingerprint,
} from "./support/git-workspace-fingerprint.ts";

export default function setup(): () => void {
  const repoRoot = process.cwd();
  if (
    !process.env.UT_TDD_TEST_EXECUTION_ROOT ||
    canonicalPath(process.env.UT_TDD_TEST_EXECUTION_ROOT) !== canonicalPath(repoRoot)
  ) {
    throw new Error("Vitest must run through the detached HEAD snapshot runner");
  }
  const headRoot = process.env.UT_TDD_HEAD_SNAPSHOT_ROOT;
  if (!headRoot) throw new Error("Vitest detached HEAD read root is required");
  const headBefore = captureGitWorkspaceFingerprint(headRoot);
  return () => {
    // Live-worktree attribution is parent-runner custody. The child is only
    // trusted to verify that its sealed detached reference stayed immutable.
    assertGitWorkspaceUnchanged(headBefore, captureGitWorkspaceFingerprint(headRoot));
  };
}
