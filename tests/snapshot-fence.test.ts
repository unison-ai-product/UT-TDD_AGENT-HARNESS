import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  attributeSnapshotFence,
  createSnapshotFenceProducer,
  type ForeignActivityEvidence,
  foreignActivityEventSignature,
  SNAPSHOT_FENCE_SCHEMA_VERSION,
  type SnapshotFenceFingerprint,
  snapshotFenceEvidencePath,
} from "../src/runtime/snapshot-fence.ts";

const before: SnapshotFenceFingerprint = {
  head: "head-before",
  statusDigest: "status-before",
  worktreeDigest: "worktree-before",
  indexDigest: "index-before",
  untrackedDigest: "untracked-before",
  changedPaths: [],
};

function makeAfter(changedPaths: string[]): SnapshotFenceFingerprint {
  return {
    ...before,
    head: "head-after",
    statusDigest: "status-after",
    changedPaths,
  };
}

function event(
  paths: string[],
  overrides: Partial<ForeignActivityEvidence> = {},
): ForeignActivityEvidence {
  const changed_paths = [...paths].sort();
  const base: ForeignActivityEvidence = {
    schema_version: SNAPSHOT_FENCE_SCHEMA_VERSION,
    event_id: "event-1",
    producer_session_id: "producer-1",
    runner_session_id: "runner-1",
    before_head: before.head,
    after_head: "head-after",
    changed_paths,
    observed_at: "2026-08-24T00:00:01.000Z",
    event_signature: foreignActivityEventSignature({
      changedPaths: changed_paths,
      beforeHead: before.head,
      afterHead: "head-after",
    }),
  };
  return { ...base, ...overrides };
}

describe("snapshot fence foreign activity attribution", () => {
  it("U-FENCE-001: exact foreign HEAD movement is indeterminate with exit code 2", () => {
    const result = attributeSnapshotFence({
      before,
      after: makeAfter(["foreign.txt"]),
      foreignActivityEvidence: [event(["foreign.txt"])],
      runStartedAt: "2026-08-24T00:00:00.000Z",
      runEndedAt: "2026-08-24T00:00:02.000Z",
      runnerSessionId: "runner-1",
    });
    expect(result.kind).toBe("foreign_activity");
    expect(result.exitCode).toBe(2);
    if (result.kind === "foreign_activity") expect(result.message).toContain("re-run");
  });

  it("U-FENCE-002: matching foreign edit or untracked evidence is indeterminate", () => {
    const result = attributeSnapshotFence({
      before,
      after: makeAfter(["edited.txt", "untracked.txt"]),
      foreignActivityEvidence: [event(["edited.txt", "untracked.txt"])],
      runnerSessionId: "runner-1",
    });
    expect(result.kind).toBe("foreign_activity");
    expect(result.exitCode).toBe(2);
  });

  it("U-FENCE-003: residual without evidence fails closed", () => {
    const result = attributeSnapshotFence({
      before,
      after: makeAfter(["tests/residual.txt"]),
      testOwnedPaths: ["tests"],
    });
    expect(result.kind).toBe("residual");
    expect(result.exitCode).toBe(1);
  });

  it("U-FENCE-004: test-owned residual wins over valid foreign evidence", () => {
    const result = attributeSnapshotFence({
      before,
      after: makeAfter(["tests/residual.txt", "foreign.txt"]),
      testOwnedPaths: ["tests"],
      foreignActivityEvidence: [event(["tests/residual.txt", "foreign.txt"])],
    });
    expect(result.kind).toBe("residual");
    expect(result.exitCode).toBe(1);
  });

  it("U-FENCE-005: mismatch, wrong runner identity, and replay fail closed", () => {
    const result = attributeSnapshotFence({
      before,
      after: makeAfter(["foreign.txt"]),
      foreignActivityEvidence: [event(["other.txt"])],
    });
    expect(result.kind).toBe("residual");
    expect(result.exitCode).toBe(1);

    const wrongRunner = attributeSnapshotFence({
      before,
      after: makeAfter(["foreign.txt"]),
      foreignActivityEvidence: [event(["foreign.txt"], { runner_session_id: "runner-2" })],
      runnerSessionId: "runner-1",
    });
    expect(wrongRunner.kind).toBe("residual");

    const replayed = event(["foreign.txt"]);
    const replay = attributeSnapshotFence({
      before,
      after: makeAfter(["foreign.txt"]),
      foreignActivityEvidence: [replayed, replayed],
      runnerSessionId: "runner-1",
    });
    expect(replay.kind).toBe("residual");
  });

  it("U-FENCE-006: real Git producer emits a canonical sidecar outside tracked paths", () => {
    const repoRoot = mkdtempSync(join(tmpdir(), "ut-tdd-snapshot-fence-"));
    try {
      execFileSync("git", ["init"], { cwd: repoRoot, stdio: "ignore" });
      execFileSync("git", ["config", "user.email", "fixture@example.invalid"], { cwd: repoRoot });
      execFileSync("git", ["config", "user.name", "fixture"], { cwd: repoRoot });
      writeFileSync(join(repoRoot, "tracked.txt"), "before\n", "utf8");
      execFileSync("git", ["add", "tracked.txt"], { cwd: repoRoot });
      execFileSync("git", ["commit", "-m", "seed"], { cwd: repoRoot, stdio: "ignore" });
      const evidencePath = snapshotFenceEvidencePath(repoRoot);
      expect(evidencePath).not.toBeNull();
      if (!evidencePath) throw new Error("fixture Git common-dir did not resolve");
      const producer = createSnapshotFenceProducer({ repoRoot });
      producer.observe({
        sessionId: "producer-1",
        runnerSessionId: "runner-1",
        now: "2026-08-24T00:00:01.000Z",
      });
      writeFileSync(join(repoRoot, "tracked.txt"), "after\n", "utf8");
      producer.observe({
        sessionId: "producer-1",
        runnerSessionId: "runner-1",
        now: "2026-08-24T00:00:02.000Z",
      });
      const emitted = readFileSync(evidencePath, "utf8")
        .trim()
        .split(/\r?\n/)
        .map((line) => JSON.parse(line) as ForeignActivityEvidence);
      expect(emitted).toHaveLength(1);
      expect(emitted[0]).toMatchObject({
        schema_version: SNAPSHOT_FENCE_SCHEMA_VERSION,
        producer_session_id: "producer-1",
        runner_session_id: "runner-1",
        changed_paths: ["tracked.txt"],
      });
      expect(
        execFileSync("git", ["status", "--porcelain", "--", ".git"], {
          cwd: repoRoot,
          encoding: "utf8",
        }),
      ).toBe("");
    } finally {
      rmSync(repoRoot, { recursive: true, force: true });
    }
  });

  it("U-FENCE-006: injected producer preserves deterministic event framing", () => {
    const states = new Map<string, { fingerprint: SnapshotFenceFingerprint }>();
    const emitted: ForeignActivityEvidence[] = [];
    let count = 0;
    const producer = createSnapshotFenceProducer({
      repoRoot: "/repo",
      sidecarRoot: "/git-common/ut-tdd-runtime/snapshot-fence",
      evidencePath: "/git-common/ut-tdd-runtime/snapshot-fence/foreign-activity.jsonl",
      capture: () =>
        count++ === 0 ? before : { ...makeAfter(["foreign.txt"]), changedPaths: ["foreign.txt"] },
      readState: (path) => states.get(path) ?? null,
      writeState: (path, state) => states.set(path, state),
      append: (_path, value) => emitted.push(value),
    });
    producer.observe({
      sessionId: "producer-1",
      runnerSessionId: "runner-1",
      now: "2026-08-24T00:00:01.000Z",
    });
    producer.observe({
      sessionId: "producer-1",
      runnerSessionId: "runner-1",
      now: "2026-08-24T00:00:02.000Z",
    });
    expect(emitted).toHaveLength(1);
    expect(emitted[0]).toMatchObject({
      schema_version: SNAPSHOT_FENCE_SCHEMA_VERSION,
      producer_session_id: "producer-1",
      runner_session_id: "runner-1",
      changed_paths: ["foreign.txt"],
    });
    expect(emitted[0].event_signature).toBe(
      foreignActivityEventSignature({
        changedPaths: ["foreign.txt"],
        beforeHead: before.head,
        afterHead: "head-after",
      }),
    );
  });
});
