import { execFileSync, spawn, spawnSync } from "node:child_process";
import {
  chmodSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { loadMemoryCorpus, writeMemory } from "../src/memory/service.ts";
import {
  buildClaudeProviderInboxEntry,
  claudeWorkspaceId,
  publishClaudeInboxEntry,
  resolveLiveClaudeTarget,
  waitForClaudeMemory,
} from "../src/runtime/claude-memory-wake.ts";
import { resolveProjectMemoryRoot } from "../src/runtime/project-memory-root.ts";
import {
  buildCleanDistributionPlan,
  cleanDistributionSourcePath,
  transformCleanDistributionArtifact,
} from "../src/setup/distribution.ts";
import { headSnapshotRoot } from "./support/workspace-roots.ts";

// The clean Pack is materialized from the immutable detached test snapshot,
// never from the live source worktree.
const sourceRoot = headSnapshotRoot();
const fixtures: string[] = [];

function removeTree(path: string): void {
  try {
    const stat = statSync(path);
    if (stat.isDirectory()) {
      chmodSync(path, 0o755);
      for (const name of readdirSync(path)) removeTree(join(path, name));
    } else chmodSync(path, 0o644);
  } catch {
    return;
  }
  rmSync(path, { recursive: true, force: true });
}

function git(cwd: string, args: readonly string[]): string {
  return execFileSync("git", ["-C", cwd, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function walk(root: string): string[] {
  const ignored = new Set([".git", "node_modules", "dist"]);
  const paths: string[] = [];
  const visit = (directory: string, prefix = ""): void => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (ignored.has(entry.name)) continue;
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      const absolute = join(directory, entry.name);
      if (entry.isDirectory()) visit(absolute, relative);
      else if (entry.isFile()) paths.push(relative.replaceAll("\\", "/"));
    }
  };
  visit(root);
  return paths.sort();
}

function createCleanPack(repository = "unison-ai-product/UT-TDD_AGENT-HARNESS-Pack"): string {
  const root = mkdtempSync(join(tmpdir(), "ut-tdd-pack-parity-"));
  fixtures.push(root);
  const sourcePaths = walk(sourceRoot);
  const plan = buildCleanDistributionPlan({
    paths: sourcePaths,
    sourceTag: "v0.2.0-canary.1",
  });
  expect(plan.ok, JSON.stringify(plan)).toBe(true);
  for (const artifactPath of plan.artifactPaths) {
    const sourcePath = cleanDistributionSourcePath(artifactPath, sourcePaths);
    const from = join(sourceRoot, sourcePath);
    const to = join(root, artifactPath);
    mkdirSync(dirname(to), { recursive: true });
    if (artifactPath === "package.json") {
      writeFileSync(
        to,
        transformCleanDistributionArtifact(artifactPath, readFileSync(from, "utf8")),
      );
    } else cpSync(from, to, { recursive: true });
  }
  git(root, ["init", "-q", "-b", "main"]);
  git(root, ["config", "user.email", "test@example.invalid"]);
  git(root, ["config", "user.name", "UT-TDD Pack parity"]);
  git(root, ["config", "core.autocrlf", "false"]);
  git(root, ["remote", "add", "origin", `git@github.com:${repository}.git`]);
  git(root, ["add", "."]);
  git(root, ["commit", "-qm", "test: materialize clean Pack"]);
  return root;
}

function installDependencies(root: string): void {
  const result =
    process.platform === "win32"
      ? spawnSync(
          join(process.env.SystemRoot ?? "C:\\Windows", "System32", "cmd.exe"),
          ["/d", "/c", "npm", "ci", "--ignore-scripts", "--no-audit", "--no-fund"],
          { cwd: root, encoding: "utf8", timeout: 300_000 },
        )
      : spawnSync("npm", ["ci", "--ignore-scripts", "--no-audit", "--no-fund"], {
          cwd: root,
          encoding: "utf8",
          timeout: 300_000,
        });
  expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
}

function bootstrapCleanPack(root: string): void {
  // A clean Pack has no node_modules. Install first, then exercise the
  // production setup command as the identity authority.
  installDependencies(root);
  const setup = runPack(root, ["setup", "--solo"]);
  expect(setup.status, `${setup.stdout}\n${setup.stderr}`).toBe(0);
  expect(resolveProjectMemoryRoot(root)).toMatchObject({ ok: true });
  git(root, ["add", "ut-tdd.project.json"]);
  git(root, ["commit", "-qm", "test: commit Pack project identity"]);
}

function runPack(root: string, args: readonly string[], env: NodeJS.ProcessEnv = {}) {
  return spawnSync(process.execPath, [join(root, "src", "cli.ts"), ...args], {
    cwd: root,
    encoding: "utf8",
    env: {
      ...process.env,
      ...env,
      CLAUDE_PROJECT_DIR: root,
      UT_TDD_PROJECT_DIR: root,
      UT_TDD_SKIP_UPDATE_CHECK: "1",
    },
    timeout: 120_000,
  });
}

function startClaudeWake(root: string, sessionId: string) {
  const child = spawn(
    process.execPath,
    [join(root, "src", "cli.ts"), "hook", "claude-memory-wake"],
    {
      cwd: root,
      env: {
        ...process.env,
        CLAUDE_CODE_ENTRYPOINT: "claude-vscode",
        CLAUDE_PROJECT_DIR: root,
        UT_TDD_PROJECT_DIR: root,
        UT_TDD_CLAUDE_WAKE_POLL_MS: "10",
        UT_TDD_CLAUDE_WAKE_MAX_MS: "30000",
        UT_TDD_SKIP_UPDATE_CHECK: "1",
      },
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
    },
  );
  const stdout: string[] = [];
  const stderr: string[] = [];
  child.stdout.on("data", (chunk: Buffer) => stdout.push(chunk.toString()));
  child.stderr.on("data", (chunk: Buffer) => stderr.push(chunk.toString()));
  child.stdin.end(JSON.stringify({ hook_event_name: "Stop", session_id: sessionId }));
  return {
    child,
    result: new Promise<{ code: number | null; stdout: string; stderr: string }>((resolve) => {
      child.once("close", (code) =>
        resolve({ code, stdout: stdout.join(""), stderr: stderr.join("") }),
      );
    }),
  };
}

async function waitForClaudeTarget(repoRoot: string): Promise<void> {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const target = resolveLiveClaudeTarget(repoRoot);
    if (target.ok) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error("clean_pack_claude_target_not_live");
}

afterEach(() => {
  for (const root of fixtures.splice(0)) removeTree(root);
});

describe("Issue #424 Slice 5 clean Pack/provider parity", () => {
  it("CANDIDATE-P-PMEMROOT-002: clean Pack setup shares Memory and Claude wake across linked worktrees", async () => {
    const primary = createCleanPack();
    const linked = join(dirname(primary), `${basename(primary)}-linked`);
    fixtures.push(linked);
    git(primary, ["worktree", "add", "-q", "-b", "linked", linked]);
    // Each linked worktree needs its own physical dependency tree and
    // production-created project identity.
    bootstrapCleanPack(primary);
    bootstrapCleanPack(linked);
    const memory = writeMemory({
      repoRoot: primary,
      input: {
        kind: "project",
        title: "clean Pack shared memory",
        body: "published from the Pack primary checkout",
        now: "2026-09-11T00:00:00.000Z",
      },
    });
    expect(resolveProjectMemoryRoot(linked)).toMatchObject({
      ok: true,
      projectId: "unison-ai-product/UT-TDD_AGENT-HARNESS-Pack",
    });
    const list = runPack(linked, ["memory", "list", "--query", memory.title]);
    expect(list.status, `${list.stdout}\n${list.stderr}`).toBe(0);
    expect(list.stdout).toContain(memory.memory_id);
    const wake = startClaudeWake(linked, "pack-linked-claude");
    await waitForClaudeTarget(primary);
    const notified = runPack(primary, [
      "memory",
      "add",
      "--kind",
      "project",
      "--title",
      "clean Pack provider parity notification",
      "--body",
      "published from the Pack primary checkout",
      "--notify-claude",
      "--operation-id",
      "clean-pack-provider-parity",
    ]);
    expect(notified.status, `${notified.stdout}\n${notified.stderr}`).toBe(0);
    const delivered = await wake.result;
    expect(delivered.code, `${delivered.stdout}\n${delivered.stderr}`).toBe(2);
    expect(delivered.stderr).toContain("[UT_TDD_CLAUDE_INBOX]");
    expect(delivered.stderr).toContain("published from the Pack primary checkout");
    expect(delivered.stderr).toContain('"operation_id":"clean-pack-provider-parity"');
    const published = notified.stdout
      .split(/\r?\n/)
      .find((line) => line.startsWith("memory: notified Claude via "))
      ?.slice("memory: notified Claude via ".length);
    expect(published).toBeTruthy();
    expect(existsSync(published as string)).toBe(false);
  }, 420_000);

  it("CANDIDATE-P-PMEMROOT-003: same Memory ID in another Pack project cannot be read or claimed", async () => {
    const primary = createCleanPack();
    const foreign = createCleanPack("other/Pack");
    bootstrapCleanPack(primary);
    bootstrapCleanPack(foreign);
    const memory = writeMemory({
      repoRoot: primary,
      input: {
        kind: "project",
        title: "isolated Pack memory",
        body: "must not cross the project namespace",
      },
    });
    const foreignMemory = writeMemory({
      repoRoot: foreign,
      input: {
        kind: "project",
        title: "isolated Pack memory",
        body: "same ID, foreign project-local copy",
      },
    });
    expect(foreignMemory.memory_id).toBe(memory.memory_id);
    const primaryProject = resolveProjectMemoryRoot(primary);
    expect(primaryProject).toMatchObject({ ok: true });
    if (!primaryProject.ok) throw new Error(primaryProject.reason);
    const entry = buildClaudeProviderInboxEntry({
      memory,
      projectId: primaryProject.projectId,
      operationId: "isolated-pack-memory",
      workspaceId: claudeWorkspaceId(foreign),
      producer: { provider: "codex", sessionId: "pack-primary-codex" },
      target: { scope: "session", provider: "claude", sessionId: "foreign-claude" },
    });
    const published = publishClaudeInboxEntry(foreign, entry);
    expect(loadMemoryCorpus(foreign).entries.map((candidate) => candidate.memory_id)).toContain(
      memory.memory_id,
    );
    const claim = await waitForClaudeMemory({
      repoRoot: foreign,
      sessionId: "foreign-claude",
      pollIntervalMs: 10,
      maxWaitMs: 80,
    });
    expect(claim).toMatchObject({ kind: "denied", reason: "project_id_mismatch" });
    expect(existsSync(published)).toBe(true);
  }, 420_000);
});
