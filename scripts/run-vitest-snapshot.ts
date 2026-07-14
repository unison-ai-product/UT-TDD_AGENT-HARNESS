import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  chmodSync,
  cpSync,
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  realpathSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";

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

export function resolveBunBinary(
  runtime = (globalThis as { Bun?: { which?: (command: string) => string | undefined } }).Bun,
): string {
  return runtime?.which?.("bun") ?? (process.versions.bun ? process.execPath : "bun");
}

export function canonicalPath(path: string): string {
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
        "--no-hardlinks",
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
      !relative(repoRoot, path)
        .split(/[\\/]/)
        .some((part) => [".git", ".ut-tdd", "node_modules"].includes(part)),
  });
}

export function snapshotContentFingerprint(root: string): string {
  const entries: string[] = [];
  const visit = (path: string): void => {
    const rel = relative(root, path).replaceAll("\\", "/");
    const stat = lstatSync(path);
    if (stat.isSymbolicLink()) {
      entries.push(`link:${rel}:${readlinkSync(path)}`);
      return;
    }
    if (stat.isDirectory()) {
      entries.push(`dir:${rel}`);
      for (const entry of readdirSync(path).sort()) visit(join(path, entry));
      return;
    }
    entries.push(`file:${rel}:${createHash("sha256").update(readFileSync(path)).digest("hex")}`);
  };
  visit(root);
  return createHash("sha256").update(entries.join("\n")).digest("hex");
}

export function assertSnapshotContentMatch(executionRoot: string, referenceRoot: string): void {
  if (snapshotContentFingerprint(executionRoot) !== snapshotContentFingerprint(referenceRoot))
    throw new Error("snapshot content mismatch");
}

export function assertSnapshotFingerprint(root: string, expectedFingerprint: string): void {
  if (snapshotContentFingerprint(root) !== expectedFingerprint)
    throw new Error("snapshot reference fingerprint mismatch");
}

export function assertBatchVitestArgs(args: readonly string[]): void {
  if (args.some((arg) => arg === "-w" || arg === "--watch" || arg.startsWith("--watch=")))
    throw new Error("vitest snapshot runner is batch-only; watch mode would observe a stale snapshot");
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

function chmodTree(root: string, directoryMode: number, fileMode: number): void {
  const visit = (path: string): void => {
    const stat = lstatSync(path);
    if (stat.isSymbolicLink()) return;
    if (!stat.isDirectory()) {
      chmodSync(path, fileMode);
      return;
    }
    for (const entry of readdirSync(path)) visit(join(path, entry));
    chmodSync(path, directoryMode);
  };
  visit(root);
}

export function sealReference(referenceRoot: string): void {
  if (process.platform !== "win32") {
    chmodTree(referenceRoot, 0o555, 0o444);
    return;
  }
  const identity = output("whoami", [], referenceRoot);
  if (!identity) throw new Error("reference snapshot identity cannot be resolved");
  run("attrib", ["+R", join(referenceRoot, "*"), "/S"], referenceRoot);
  run(
    "icacls",
    [referenceRoot, "/deny", `${identity}:(OI)(CI)(WD,AD)`, "/T", "/C", "/Q"],
    referenceRoot,
  );
}

export function unsealReference(referenceRoot: string): void {
  if (!existsSync(referenceRoot)) return;
  if (process.platform !== "win32") {
    chmodTree(referenceRoot, 0o755, 0o644);
    return;
  }
  const identity = output("whoami", [], referenceRoot);
  if (!identity) throw new Error("reference snapshot identity cannot be resolved");
  run("attrib", ["-R", join(referenceRoot, "*"), "/S"], referenceRoot);
  run(
    "icacls",
    [referenceRoot, "/remove:d", identity, "/T", "/C", "/Q"],
    referenceRoot,
  );
}

export function runSnapshotTests(
  args = process.argv.slice(2),
  repoRoot = process.cwd(),
): void {
  assertBatchVitestArgs(args);
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
  let sealedReferenceFingerprint: string | undefined;
  try {
    const bun = resolveBunBinary();
    const source = resolveSnapshotSource(repoRoot);
    createSnapshot(repoRoot, snapshotRoot, source);
    createSnapshot(snapshotRoot, referenceRoot, resolveSnapshotSource(snapshotRoot));
    if (source.kind === "copy") assertSnapshotContentMatch(snapshotRoot, referenceRoot);
    run(bun, ["install", "--frozen-lockfile"], snapshotRoot);
    run(bun, ["run", "src/cli.ts", "db", "rebuild"], snapshotRoot);
    copyReferenceRuntimeInputs(snapshotRoot, referenceRoot);
    if (source.kind === "git")
      run(
        "git",
        ["diff", "--exit-code", "--", ":(exclude).ut-tdd/harness.db"],
        referenceRoot,
    );
    sealReference(referenceRoot);
    sealedReferenceFingerprint = snapshotContentFingerprint(referenceRoot);
    run(bun, ["x", "vitest", "run", ...args], snapshotRoot, {
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
    if (sealedReferenceFingerprint) {
      try {
        assertSnapshotFingerprint(referenceRoot, sealedReferenceFingerprint);
      } catch (error) {
        primaryError = primaryError
          ? new AggregateError([primaryError, error], "vitest execution and reference verification failed")
          : error;
      }
    }
    finishSnapshotCleanup(primaryError, [
      () => unsealReference(referenceRoot),
      () => removeSnapshot(referenceRoot),
      () => removeSnapshot(snapshotRoot),
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
