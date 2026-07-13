import { spawnSync } from "node:child_process";
import { cpSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

function run(command: string, args: string[], cwd: string, env = process.env): void {
  const result = spawnSync(command, args, { cwd, env, stdio: "inherit" });
  if (result.status !== 0 || result.error) {
    throw new Error(`${command} ${args.join(" ")} failed: ${result.error?.message ?? result.status}`);
  }
}

export function removeSnapshot(snapshotRoot: string, remove = rmSync): void {
  const failures: unknown[] = [];
  try {
    (globalThis as { Bun?: { gc?: (force?: boolean) => void } }).Bun?.gc?.(true);
    remove(snapshotRoot, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 });
  } catch (error) {
    failures.push(error);
  }
  if (failures.length > 0) throw new AggregateError(failures, "vitest snapshot cleanup failed");
}

export function createSnapshot(repoRoot: string, snapshotRoot: string): void {
  const probe = spawnSync("git", ["rev-parse", "--is-inside-work-tree"], { cwd: repoRoot, stdio: "ignore" });
  if (probe.status === 0) {
    run("git", ["clone", "--no-local", "--shared", "--no-checkout", repoRoot, snapshotRoot], repoRoot);
    run("git", ["checkout", "--detach", "HEAD"], snapshotRoot);
    return;
  }
  cpSync(repoRoot, snapshotRoot, {
    recursive: true,
    filter: (path) => ![".git", "node_modules"].includes(path.slice(repoRoot.length + 1)),
  });
}

export function finishSnapshotCleanup(primaryError: unknown, cleanups: Array<() => void>): void {
  const cleanupFailures: unknown[] = [];
  for (const cleanup of cleanups) {
    try {
      cleanup();
    } catch (error) {
      cleanupFailures.push(error);
    }
  }
  if (cleanupFailures.length === 0) return;
  if (primaryError)
    throw new AggregateError([primaryError, ...cleanupFailures], "vitest execution and cleanup failed");
  throw new AggregateError(cleanupFailures, "vitest snapshot cleanup failed");
}

export function runSnapshotTests(args = process.argv.slice(2), repoRoot = process.cwd()): void {
  const snapshotRoot = join(tmpdir(), `ut-tdd-vitest-${process.pid}-${Date.now()}`);
  const cacheRoot = join(tmpdir(), `ut-tdd-vitest-cache-${process.pid}-${Date.now()}`);
  let primaryError: unknown;
  try {
    createSnapshot(repoRoot, snapshotRoot);
    run(process.execPath, ["install", "--frozen-lockfile"], snapshotRoot);
    run(process.execPath, ["x", "vitest", "run", ...args], snapshotRoot, {
      ...process.env,
      INIT_CWD: snapshotRoot,
      UT_TDD_TEST_EXECUTION_ROOT: snapshotRoot,
      UT_TDD_TEST_FENCE_ROOT: repoRoot,
      UT_TDD_UPDATE_CHECK_CACHE_DIR: cacheRoot,
      UT_TDD_VITEST_CACHE_DIR: join(cacheRoot, "vite"),
    });
  } catch (error) {
    primaryError = error;
  } finally {
    finishSnapshotCleanup(primaryError, [
      () => removeSnapshot(snapshotRoot),
      () => rmSync(cacheRoot, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 }),
    ]);
  }
  if (primaryError) throw primaryError;
}

if ((import.meta as ImportMeta & { main?: boolean }).main) runSnapshotTests();
