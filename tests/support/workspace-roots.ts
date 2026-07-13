export type WorkspaceReadMode = "head_snapshot" | "isolated_fixture";

export function headSnapshotRoot(): string {
  const root = process.env.UT_TDD_TEST_HEAD_SNAPSHOT;
  if (!root) throw new Error("UT_TDD_TEST_HEAD_SNAPSHOT is required for repository-reading tests");
  return root;
}

export function workspaceRead(input: {
  id: string;
  mode: WorkspaceReadMode;
  reason: string;
  root?: string;
}): string {
  if (!input.id || !input.reason) throw new Error("workspace read requires ID and reason");
  if (input.mode === "head_snapshot") return headSnapshotRoot();
  if (!input.root || input.root === headSnapshotRoot()) {
    throw new Error("isolated fixture read requires a non-snapshot root");
  }
  return input.root;
}
