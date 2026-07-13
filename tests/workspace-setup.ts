import { headSnapshotRoot } from "./support/workspace-roots";

if (process.env.UT_TDD_TEST_LIVE_WORKTREE !== "1") {
  process.chdir(headSnapshotRoot());
}
