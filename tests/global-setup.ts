import {
  assertGitWorkspaceUnchanged,
  captureGitWorkspaceFingerprint,
} from "./support/git-workspace-fingerprint";
import { realpathSync } from "node:fs";

export default function setup(): () => void {
  const repoRoot = process.cwd();
  if (process.env.UT_TDD_TEST_EXECUTION_ROOT !== realpathSync(repoRoot)) {
    throw new Error("Vitest must run through the detached HEAD snapshot runner");
  }
  const fenceRoot = process.env.UT_TDD_TEST_FENCE_ROOT;
  const headRoot = process.env.UT_TDD_HEAD_SNAPSHOT_ROOT;
  if (!fenceRoot) throw new Error("Vitest test workspace fence root is required");
  if (!headRoot) throw new Error("Vitest detached HEAD read root is required");
  const before = captureGitWorkspaceFingerprint(fenceRoot);
  const headBefore = captureGitWorkspaceFingerprint(headRoot);
  return () => {
    assertGitWorkspaceUnchanged(before, captureGitWorkspaceFingerprint(fenceRoot));
    assertGitWorkspaceUnchanged(headBefore, captureGitWorkspaceFingerprint(headRoot));
  };
}
