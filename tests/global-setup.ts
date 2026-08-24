import { canonicalPath } from "../scripts/run-vitest-snapshot.ts";
import {
  readForeignActivityEvidence,
  resolveEvidencePath,
  SNAPSHOT_FENCE_INDETERMINATE_REASON,
} from "../src/runtime/snapshot-fence.ts";
import {
  assertGitWorkspaceUnchanged,
  captureGitWorkspaceFingerprint,
  classifyGitWorkspaceChange,
} from "./support/git-workspace-fingerprint.ts";

export class SnapshotFenceIndeterminateError extends Error {
  readonly code = 2;

  constructor(message: string) {
    super(message);
    this.name = "SnapshotFenceIndeterminateError";
  }
}

function testOwnedPaths(): string[] {
  const raw = process.env.UT_TDD_SNAPSHOT_FENCE_TEST_OWNED_PATHS;
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((path): path is string => typeof path === "string")
      : [];
  } catch {
    return [];
  }
}

export default function setup(): () => void {
  const repoRoot = process.cwd();
  if (
    !process.env.UT_TDD_TEST_EXECUTION_ROOT ||
    canonicalPath(process.env.UT_TDD_TEST_EXECUTION_ROOT) !== canonicalPath(repoRoot)
  ) {
    throw new Error("Vitest must run through the detached HEAD snapshot runner");
  }
  const fenceRoot = process.env.UT_TDD_TEST_FENCE_ROOT;
  const headRoot = process.env.UT_TDD_HEAD_SNAPSHOT_ROOT;
  if (!fenceRoot) throw new Error("Vitest test workspace fence root is required");
  if (!headRoot) throw new Error("Vitest detached HEAD read root is required");
  const runStartedAt = new Date().toISOString();
  const before = captureGitWorkspaceFingerprint(fenceRoot, { volatileRuntimeIndex: true });
  const headBefore = captureGitWorkspaceFingerprint(headRoot);
  return () => {
    const after = captureGitWorkspaceFingerprint(fenceRoot, {
      volatileRuntimeIndex: true,
      compareHead: before.head,
    });
    const evidencePath = resolveEvidencePath(
      fenceRoot,
      process.env.UT_TDD_SNAPSHOT_FENCE_EVIDENCE_PATH,
    );
    const attribution = classifyGitWorkspaceChange(before, after, {
      testOwnedPaths: testOwnedPaths(),
      evidence: evidencePath ? readForeignActivityEvidence(evidencePath) : [],
      runStartedAt,
      runEndedAt: new Date().toISOString(),
      runnerSessionId: process.env.UT_TDD_SNAPSHOT_FENCE_RUNNER_SESSION_ID,
    });
    if (attribution.kind === "foreign_activity") {
      // Let Vitest finish its report, then preserve the dedicated runner exit code.
      process.stderr.write(`${SNAPSHOT_FENCE_INDETERMINATE_REASON}: ${attribution.message}\n`);
      process.exitCode = 2;
      return;
    }
    if (attribution.kind === "residual") throw new Error(attribution.message);
    assertGitWorkspaceUnchanged(headBefore, captureGitWorkspaceFingerprint(headRoot));
  };
}
