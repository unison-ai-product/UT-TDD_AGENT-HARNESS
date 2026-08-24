import { execFileSync, spawn } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createInterface } from "node:readline";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import {
  attributeSnapshotFence,
  createSnapshotFenceProducer,
  createSnapshotFenceRun,
  type ForeignActivityEvidence,
  foreignActivityEventSignature,
  SNAPSHOT_FENCE_SCHEMA_VERSION,
  type SnapshotFenceFingerprint,
  snapshotFenceCommonDir,
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
    run_id: "run-1",
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
      runId: "run-1",
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
      runId: "run-1",
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
      runId: "run-1",
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

  it("U-FENCE-007: content added to an already-dirty path is attributed by inventory state", () => {
    const dirtyBefore: SnapshotFenceFingerprint = {
      ...before,
      head: "head-before",
      statusDigest: "dirty-before",
      changedPaths: ["dirty.txt"],
      inventoryEntries: ["f:dirty.txt:content-before"],
    };
    const dirtyAfter: SnapshotFenceFingerprint = {
      ...dirtyBefore,
      statusDigest: "dirty-after",
      inventoryEntries: ["f:dirty.txt:content-after"],
    };
    const result = attributeSnapshotFence({
      before: dirtyBefore,
      after: dirtyAfter,
      foreignActivityEvidence: [
        event(["dirty.txt"], {
          before_head: "head-before",
          after_head: "head-before",
          event_signature: foreignActivityEventSignature({
            changedPaths: ["dirty.txt"],
            beforeHead: "head-before",
            afterHead: "head-before",
            runId: "run-1",
          }),
        }),
      ],
      runnerSessionId: "runner-1",
      runId: "run-1",
    });
    expect(result.kind).toBe("foreign_activity");
    expect(result.changedPaths).toEqual(["dirty.txt"]);
  });

  it("U-FENCE-008: an active run lease is atomic and stale ownership is recoverable", () => {
    const repoRoot = mkdtempSync(join(tmpdir(), "ut-tdd-snapshot-fence-lease-"));
    try {
      execFileSync("git", ["init"], { cwd: repoRoot, stdio: "ignore" });
      const first = createSnapshotFenceRun({
        repoRoot,
        runnerSessionId: "runner-1",
        ownerPid: 321,
        processAlive: () => false,
        now: "2026-08-24T00:00:00.000Z",
      });
      expect(
        readFileSync(
          first.evidencePath.replace("foreign-activity.jsonl", "active-run.json"),
          "utf8",
        ),
      ).toContain('"run_id":"');
      first.close();
      const second = createSnapshotFenceRun({
        repoRoot,
        runnerSessionId: "runner-2",
        ownerPid: 322,
        processAlive: () => false,
        now: "2026-08-24T00:00:01.000Z",
      });
      expect(second.lease.runner_session_id).toBe("runner-2");
      second.close();
    } finally {
      rmSync(repoRoot, { recursive: true, force: true });
    }
  });

  it("U-FENCE-013: concurrent run claims publish exactly one lease without overwrite", async () => {
    const repoRoot = mkdtempSync(join(tmpdir(), "ut-tdd-snapshot-fence-concurrent-"));
    const modulePath = resolve("src/runtime/snapshot-fence.ts");
    execFileSync("git", ["init"], { cwd: repoRoot, stdio: "ignore" });
    const childCode = `
      const { createSnapshotFenceRun } = await import(${JSON.stringify(pathToFileURL(modulePath).href)});
      try {
        const handle = createSnapshotFenceRun({ repoRoot: process.argv[1], runnerSessionId: process.argv[2] });
        process.stdout.write(JSON.stringify({ ok: true, runId: handle.lease.run_id, runner: handle.lease.runner_session_id }) + "\\n");
        process.stdin.once("data", () => { handle.close(); process.exit(0); });
      } catch (error) {
        process.stdout.write(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }) + "\\n");
        process.exit(0);
      }
    `;
    const children = ["parallel-a", "parallel-b"].map((runner) =>
      spawn(
        process.execPath,
        ["--experimental-strip-types", "--input-type=module", "-e", childCode, repoRoot, runner],
        { stdio: ["pipe", "pipe", "pipe"], windowsHide: true },
      ),
    );
    for (const child of children) child.stdin.on("error", () => undefined);
    try {
      const results = await Promise.all(
        children.map(
          (child) =>
            new Promise<{ ok: boolean; runId?: string; runner?: string; error?: string }>(
              (resolveResult, reject) => {
                const timeout = setTimeout(
                  () => reject(new Error("parallel claim timed out")),
                  10_000,
                );
                let stderr = "";
                let settled = false;
                const lines = createInterface({ input: child.stdout });
                child.stderr.on("data", (chunk) => {
                  stderr += String(chunk);
                });
                lines.once("line", (line) => {
                  settled = true;
                  clearTimeout(timeout);
                  lines.close();
                  try {
                    resolveResult(
                      JSON.parse(line) as {
                        ok: boolean;
                        runId?: string;
                        runner?: string;
                        error?: string;
                      },
                    );
                  } catch (error) {
                    reject(error);
                  }
                });
                child.once("error", (error) => {
                  settled = true;
                  clearTimeout(timeout);
                  reject(error);
                });
                child.once("exit", (code) => {
                  if (settled) return;
                  clearTimeout(timeout);
                  reject(new Error(`parallel claim child exited ${code}: ${stderr}`));
                });
              },
            ),
        ),
      );
      expect(results.filter((result) => result.ok)).toHaveLength(1);
      const winner = results.find((result) => result.ok);
      const loser = results.find((result) => !result.ok);
      expect(loser?.error).toContain(winner?.runId);
    } finally {
      for (const child of children) {
        if (!child.stdin.destroyed) {
          child.stdin.write("close\n");
          child.stdin.end();
        }
      }
      await Promise.all(
        children.map(
          (child) =>
            new Promise<void>((resolveChild) => {
              if (child.exitCode !== null) return resolveChild();
              child.once("exit", () => resolveChild());
              setTimeout(() => {
                child.kill();
                resolveChild();
              }, 2_000);
            }),
        ),
      );
      rmSync(repoRoot, { recursive: true, force: true });
    }
  }, 20_000);

  it("U-FENCE-014: concurrent stale recovery cannot delete a newly published lease", async () => {
    const repoRoot = mkdtempSync(join(tmpdir(), "ut-tdd-snapshot-fence-stale-race-"));
    execFileSync("git", ["init"], { cwd: repoRoot, stdio: "ignore" });
    const stale = createSnapshotFenceRun({
      repoRoot,
      runnerSessionId: "stale-runner",
      ownerPid: 999999,
      processAlive: () => false,
    });
    const modulePath = resolve("src/runtime/snapshot-fence.ts");
    const childCode = `
      const { existsSync, readFileSync, writeFileSync } = await import("node:fs");
      const { createSnapshotFenceRun, snapshotFenceRunPath } = await import(${JSON.stringify(pathToFileURL(modulePath).href)});
      const wait = () => { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 20); };
      try {
        const repoRoot = process.argv[1];
        const runner = process.argv[2];
        const staleRunId = process.argv[3];
        const runPath = snapshotFenceRunPath(repoRoot);
        const readyA = repoRoot + "/barrier-a";
        const readyB = repoRoot + "/barrier-b";
        const beforeStaleRecovery = () => {
          const ownReady = runner === "stale-a" ? readyA : readyB;
          const otherReady = runner === "stale-a" ? readyB : readyA;
          writeFileSync(ownReady, runner);
          while (!existsSync(otherReady)) wait();
          if (runner !== "stale-a") {
            while (!runPath || !existsSync(runPath) || readFileSync(runPath, "utf8").includes(staleRunId)) wait();
          }
        };
        const handle = createSnapshotFenceRun({ repoRoot, runnerSessionId: runner, beforeStaleRecovery });
        console.log(JSON.stringify({ ok: true, runId: handle.lease.run_id }));
        setTimeout(() => undefined, 5_000);
      } catch (error) {
        console.log(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }));
      }
    `;
    const children = ["stale-a", "stale-b"].map((runner) =>
      spawn(
        process.execPath,
        [
          "--experimental-strip-types",
          "--input-type=module",
          "-e",
          childCode,
          repoRoot,
          runner,
          stale.lease.run_id,
        ],
        { stdio: ["ignore", "pipe", "pipe"], windowsHide: true },
      ),
    );
    try {
      const results = await Promise.all(
        children.map(
          (child) =>
            new Promise<{ ok: boolean; runId?: string; error?: string }>(
              (resolveResult, reject) => {
                const timeout = setTimeout(
                  () => reject(new Error("stale claim timed out")),
                  10_000,
                );
                let stderr = "";
                let settled = false;
                const lines = createInterface({ input: child.stdout });
                child.stderr.on("data", (chunk) => {
                  stderr += String(chunk);
                });
                lines.once("line", (line) => {
                  settled = true;
                  clearTimeout(timeout);
                  lines.close();
                  resolveResult(
                    JSON.parse(line) as { ok: boolean; runId?: string; error?: string },
                  );
                });
                child.once("error", (error) => {
                  settled = true;
                  clearTimeout(timeout);
                  reject(error);
                });
                child.once("exit", (code) => {
                  if (settled) return;
                  clearTimeout(timeout);
                  reject(new Error(`stale claim child exited ${code}: ${stderr}`));
                });
              },
            ),
        ),
      );
      expect(results.filter((result) => result.ok)).toHaveLength(1);
      const winner = results.find((result) => result.ok);
      expect(results.find((result) => !result.ok)?.error).toContain(winner?.runId);
    } finally {
      stale.close();
      await Promise.all(
        children.map(
          (child) =>
            new Promise<void>((resolveChild) => {
              if (child.exitCode !== null) return resolveChild();
              child.once("exit", () => resolveChild());
              setTimeout(() => {
                child.kill();
                resolveChild();
              }, 2_000);
            }),
        ),
      );
      rmSync(repoRoot, { recursive: true, force: true });
    }
  }, 20_000);

  it("U-FENCE-009: linked worktrees share the primary git common-dir custody root", () => {
    const primary = mkdtempSync(join(tmpdir(), "ut-tdd-snapshot-fence-primary-"));
    const linked = `${primary}-linked`;
    try {
      execFileSync("git", ["init"], { cwd: primary, stdio: "ignore" });
      execFileSync("git", ["config", "user.email", "fixture@example.invalid"], { cwd: primary });
      execFileSync("git", ["config", "user.name", "fixture"], { cwd: primary });
      writeFileSync(join(primary, "tracked.txt"), "seed\n", "utf8");
      execFileSync("git", ["add", "tracked.txt"], { cwd: primary });
      execFileSync("git", ["commit", "-m", "seed"], { cwd: primary, stdio: "ignore" });
      execFileSync("git", ["worktree", "add", "--detach", linked, "HEAD"], {
        cwd: primary,
        stdio: "ignore",
      });
      expect(snapshotFenceCommonDir(linked)).toBe(snapshotFenceCommonDir(primary));
      expect(snapshotFenceEvidencePath(linked)).toBe(snapshotFenceEvidencePath(primary));
    } finally {
      execFileSync("git", ["worktree", "remove", "--force", linked], {
        cwd: primary,
        stdio: "ignore",
      });
      rmSync(primary, { recursive: true, force: true });
      rmSync(linked, { recursive: true, force: true });
    }
  });

  it("U-FENCE-012: producer cannot override the active-run runner identity", () => {
    const states = new Map<string, { fingerprint: SnapshotFenceFingerprint }>();
    const emitted: ForeignActivityEvidence[] = [];
    let count = 0;
    const producer = createSnapshotFenceProducer({
      repoRoot: "/repo",
      sidecarRoot: "/git-common/ut-tdd-runtime/snapshot-fence",
      evidencePath: "/git-common/ut-tdd-runtime/snapshot-fence/foreign-activity.jsonl",
      resolveRun: () => ({
        schema_version: "snapshot-fence-run/v1",
        run_id: "run-1",
        runner_session_id: "runner-1",
        owner_pid: 1,
        started_at: "2026-08-24T00:00:00.000Z",
      }),
      capture: () => (count++ === 0 ? before : makeAfter(["foreign.txt"])),
      readState: (path) => states.get(path) ?? null,
      writeState: (path, state) => states.set(path, state),
      append: (_path, value) => emitted.push(value),
    });
    producer.observe({
      sessionId: "producer-1",
      runnerSessionId: "forged-runner",
      now: "2026-08-24T00:00:01.000Z",
    });
    producer.observe({
      sessionId: "producer-1",
      runnerSessionId: "forged-runner",
      now: "2026-08-24T00:00:02.000Z",
    });
    expect(emitted).toEqual([]);
  });

  it("U-FENCE-004: test-owned residual wins over valid foreign evidence", () => {
    const result = attributeSnapshotFence({
      before,
      after: makeAfter(["tests/residual.txt", "foreign.txt"]),
      testOwnedPaths: ["tests"],
      foreignActivityEvidence: [event(["tests/residual.txt", "foreign.txt"])],
      runId: "run-1",
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
      runId: "run-1",
    });
    expect(wrongRunner.kind).toBe("residual");

    const replayed = event(["foreign.txt"]);
    const replay = attributeSnapshotFence({
      before,
      after: makeAfter(["foreign.txt"]),
      foreignActivityEvidence: [replayed, replayed],
      runnerSessionId: "runner-1",
      runId: "run-1",
    });
    expect(replay.kind).toBe("residual");
  });

  it("U-FENCE-006: real Git producer emits a canonical sidecar outside tracked paths", () => {
    const repoRoot = mkdtempSync(join(tmpdir(), "ut-tdd-snapshot-fence-"));
    let run: ReturnType<typeof createSnapshotFenceRun> | undefined;
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
      run = createSnapshotFenceRun({ repoRoot, runnerSessionId: "runner-1" });
      const producer = createSnapshotFenceProducer({ repoRoot });
      producer.observe({
        sessionId: "producer-1",
        now: "2026-08-24T00:00:01.000Z",
      });
      writeFileSync(join(repoRoot, "tracked.txt"), "after\n", "utf8");
      producer.observe({
        sessionId: "producer-1",
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
      run?.close();
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
      resolveRun: () => ({
        schema_version: "snapshot-fence-run/v1",
        run_id: "run-1",
        runner_session_id: "runner-1",
        owner_pid: 1,
        started_at: "2026-08-24T00:00:00.000Z",
      }),
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
        runId: "run-1",
      }),
    );
  });
});
