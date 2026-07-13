import { spawnSync } from "node:child_process";
import { existsSync, lstatSync, realpathSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

function run(command: string, args: string[], cwd: string, env = process.env): void {
  const result = spawnSync(command, args, { cwd, env, stdio: "inherit" });
  if (result.status !== 0 || result.error) {
    throw new Error(`${command} ${args.join(" ")} failed: ${result.error?.message ?? result.status}`);
  }
}

function removeSnapshot(snapshotRoot: string, depsRoot: string): void {
  const failures: unknown[] = [];
  try {
    if (existsSync(depsRoot) && lstatSync(depsRoot).isSymbolicLink()) {
      rmSync(depsRoot, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 });
    }
  } catch (error) {
    failures.push(error);
  }
  try {
    (globalThis as { Bun?: { gc?: (force?: boolean) => void } }).Bun?.gc?.(true);
    rmSync(snapshotRoot, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 });
  } catch (error) {
    failures.push(error);
  }
  if (failures.length > 0) throw new AggregateError(failures, "vitest snapshot cleanup failed");
}

const repoRoot = process.cwd();
const sourceDeps = join(repoRoot, "node_modules");
if (!existsSync(sourceDeps)) throw new Error("node_modules is required before test snapshot execution");
const snapshotRoot = join(tmpdir(), `ut-tdd-vitest-${process.pid}-${Date.now()}`);
const snapshotDeps = join(snapshotRoot, "node_modules");
const cacheRoot = join(tmpdir(), `ut-tdd-vitest-cache-${process.pid}-${Date.now()}`);
let primaryError: unknown;
try {
  run("git", ["clone", "--no-local", "--shared", "--no-checkout", repoRoot, snapshotRoot], repoRoot);
  run("git", ["checkout", "--detach", "HEAD"], snapshotRoot);
  symlinkSync(realpathSync(sourceDeps), snapshotDeps, process.platform === "win32" ? "junction" : "dir");
  run(process.execPath, ["x", "vitest", "run", ...process.argv.slice(2)], snapshotRoot, {
    ...process.env,
    INIT_CWD: snapshotRoot,
    UT_TDD_TEST_EXECUTION_ROOT: snapshotRoot,
    UT_TDD_UPDATE_CHECK_CACHE_DIR: cacheRoot,
  });
} catch (error) {
  primaryError = error;
} finally {
  const cleanupFailures: unknown[] = [];
  try {
    removeSnapshot(snapshotRoot, snapshotDeps);
  } catch (error) {
    cleanupFailures.push(error);
  }
  try {
    rmSync(cacheRoot, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 });
  } catch (error) {
    cleanupFailures.push(error);
  }
  if (cleanupFailures.length > 0) {
    if (primaryError) throw new AggregateError([primaryError, ...cleanupFailures], "vitest execution and cleanup failed");
    throw new AggregateError(cleanupFailures, "vitest snapshot cleanup failed");
  }
}
if (primaryError) throw primaryError;
