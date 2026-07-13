import { spawnSync } from "node:child_process";
import { existsSync, lstatSync, realpathSync, rmSync, rmdirSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

function run(command: string, args: string[], cwd: string, env = process.env): void {
  const result = spawnSync(command, args, { cwd, env, stdio: "inherit" });
  if (result.status !== 0 || result.error) {
    throw new Error(`${command} ${args.join(" ")} failed: ${result.error?.message ?? result.status}`);
  }
}

function removeSnapshot(repoRoot: string, snapshotRoot: string, depsRoot: string): void {
  const failures: unknown[] = [];
  try {
    if (existsSync(depsRoot) && lstatSync(depsRoot).isSymbolicLink() && realpathSync(depsRoot) === realpathSync(join(repoRoot, "node_modules"))) {
      rmdirSync(depsRoot);
    }
  } catch (error) {
    failures.push(error);
  }
  try {
    run("git", ["worktree", "remove", "--force", snapshotRoot], repoRoot);
  } catch (error) {
    failures.push(error);
  }
  try {
    (globalThis as { Bun?: { gc?: (force?: boolean) => void } }).Bun?.gc?.(true);
    rmSync(snapshotRoot, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 });
    run("git", ["worktree", "prune"], repoRoot);
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
  run("git", ["worktree", "add", "--detach", snapshotRoot, "HEAD"], repoRoot);
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
  try {
    removeSnapshot(repoRoot, snapshotRoot, snapshotDeps);
    rmSync(cacheRoot, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 });
  } catch (cleanupError) {
    if (primaryError) throw new AggregateError([primaryError, cleanupError], "vitest execution and cleanup failed");
    throw cleanupError;
  }
}
if (primaryError) throw primaryError;
