import { spawnSync } from "node:child_process";
import {
  cpSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  realpathSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

function run(
  command: string,
  args: string[],
  cwd: string,
  env = process.env,
): void {
  const result = spawnSync(command, args, { cwd, env, stdio: "inherit" });
  if (result.status !== 0 || result.error) {
    throw new Error(
      `${command} ${args.join(" ")} failed: ${result.error?.message ?? result.status}`,
    );
  }
}

function output(command: string, args: string[], cwd: string): string | null {
  const result = spawnSync(command, args, { cwd, encoding: "utf8" });
  return result.status === 0 ? result.stdout.trim() : null;
}

function canonicalPath(path: string): string {
  const resolved = realpathSync.native(path).replaceAll("\\", "/");
  return process.platform === "win32" ? resolved.toLowerCase() : resolved;
}

export type SnapshotSource =
  { kind: "git"; revision: string } | { kind: "copy" };

export function resolveSnapshotSource(repoRoot: string): SnapshotSource {
  const topLevel = output("git", ["rev-parse", "--show-toplevel"], repoRoot);
  if (!topLevel || canonicalPath(topLevel) !== canonicalPath(repoRoot))
    return { kind: "copy" };
  const revision = output("git", ["rev-parse", "HEAD"], repoRoot);
  if (!revision) throw new Error("snapshot source HEAD cannot be resolved");
  return { kind: "git", revision };
}

export function removeSnapshot(snapshotRoot: string, remove = rmSync): void {
  const failures: unknown[] = [];
  try {
    (globalThis as { Bun?: { gc?: (force?: boolean) => void } }).Bun?.gc?.(
      true,
    );
    remove(snapshotRoot, {
      recursive: true,
      force: true,
      maxRetries: 10,
      retryDelay: 50,
    });
  } catch (error) {
    failures.push(error);
  }
  if (failures.length > 0)
    throw new AggregateError(failures, "vitest snapshot cleanup failed");
}

export function createSnapshot(
  repoRoot: string,
  snapshotRoot: string,
  source = resolveSnapshotSource(repoRoot),
): void {
  if (source.kind === "git") {
    run(
      "git",
      [
        "clone",
        "--no-local",
        "--shared",
        "--no-checkout",
        repoRoot,
        snapshotRoot,
      ],
      repoRoot,
    );
    run("git", ["checkout", "--detach", source.revision], snapshotRoot);
    if (output("git", ["rev-parse", "HEAD"], snapshotRoot) !== source.revision)
      throw new Error("snapshot revision mismatch");
    return;
  }
  cpSync(repoRoot, snapshotRoot, {
    recursive: true,
    filter: (path) =>
      ![".git", "node_modules"].includes(path.slice(repoRoot.length + 1)),
  });
}

export function finishSnapshotCleanup(
  primaryError: unknown,
  cleanups: Array<() => void>,
): void {
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
    throw new AggregateError(
      [primaryError, ...cleanupFailures],
      "vitest execution and cleanup failed",
    );
  throw new AggregateError(cleanupFailures, "vitest snapshot cleanup failed");
}

export function copyReferenceRuntimeInputs(
  snapshotRoot: string,
  referenceRoot: string,
): void {
  const database = join(snapshotRoot, ".ut-tdd", "harness.db");
  if (existsSync(database)) {
    mkdirSync(join(referenceRoot, ".ut-tdd"), { recursive: true });
    copyFileSync(database, join(referenceRoot, ".ut-tdd", "harness.db"));
  }
  const lifecycleLog = join(
    snapshotRoot,
    ".ut-tdd",
    "logs",
    "feedback-lifecycle.jsonl",
  );
  if (!existsSync(lifecycleLog)) return;
  mkdirSync(join(referenceRoot, ".ut-tdd", "logs"), { recursive: true });
  copyFileSync(
    lifecycleLog,
    join(referenceRoot, ".ut-tdd", "logs", "feedback-lifecycle.jsonl"),
  );
}

export function runSnapshotTests(
  args = process.argv.slice(2),
  repoRoot = process.cwd(),
): void {
  const snapshotRoot = join(
    tmpdir(),
    `ut-tdd-vitest-${process.pid}-${Date.now()}`,
  );
  const referenceRoot = join(
    tmpdir(),
    `ut-tdd-vitest-head-${process.pid}-${Date.now()}`,
  );
  const cacheRoot = join(
    tmpdir(),
    `ut-tdd-vitest-cache-${process.pid}-${Date.now()}`,
  );
  let primaryError: unknown;
  try {
    const source = resolveSnapshotSource(repoRoot);
    createSnapshot(repoRoot, snapshotRoot, source);
    run(process.execPath, ["install", "--frozen-lockfile"], snapshotRoot);
    run(process.execPath, ["run", "src/cli.ts", "db", "rebuild"], snapshotRoot);
    createSnapshot(repoRoot, referenceRoot, source);
    copyReferenceRuntimeInputs(snapshotRoot, referenceRoot);
    if (source.kind === "git")
      run(
        "git",
        ["diff", "--exit-code", "--", ":(exclude).ut-tdd/harness.db"],
        referenceRoot,
      );
    run(process.execPath, ["x", "vitest", "run", ...args], snapshotRoot, {
      ...process.env,
      INIT_CWD: snapshotRoot,
      UT_TDD_TEST_EXECUTION_ROOT: snapshotRoot,
      UT_TDD_TEST_FENCE_ROOT: repoRoot,
      UT_TDD_HEAD_SNAPSHOT_ROOT: referenceRoot,
      UT_TDD_UPDATE_CHECK_CACHE_DIR: cacheRoot,
      UT_TDD_VITEST_CACHE_DIR: join(cacheRoot, "vite"),
    });
  } catch (error) {
    primaryError = error;
  } finally {
    finishSnapshotCleanup(primaryError, [
      () => removeSnapshot(snapshotRoot),
      () => removeSnapshot(referenceRoot),
      () =>
        rmSync(cacheRoot, {
          recursive: true,
          force: true,
          maxRetries: 10,
          retryDelay: 50,
        }),
    ]);
  }
  if (primaryError) throw primaryError;
}

if ((import.meta as ImportMeta & { main?: boolean }).main) runSnapshotTests();
