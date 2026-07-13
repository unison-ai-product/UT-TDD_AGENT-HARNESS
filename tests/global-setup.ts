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
  const before = captureGitWorkspaceFingerprint(repoRoot);
  return () => assertGitWorkspaceUnchanged(before, captureGitWorkspaceFingerprint(repoRoot));
}
