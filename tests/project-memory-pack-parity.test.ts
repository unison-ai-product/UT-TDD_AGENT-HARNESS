import { execFileSync, spawnSync } from "node:child_process";
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
  buildClaudeInboxEntry,
  claudeWorkspaceId,
  publishClaudeInboxEntry,
  waitForClaudeMemory,
} from "../src/runtime/claude-memory-wake.ts";
import { resolveProjectMemoryRoot } from "../src/runtime/project-memory-root.ts";
import {
  buildCleanDistributionPlan,
  cleanDistributionSourcePath,
  transformCleanDistributionArtifact,
} from "../src/setup/distribution.ts";
import {
  bootstrapProjectIdentity,
  canonicalProjectIdentityBytes,
} from "../src/setup/project-identity-bootstrap.ts";

// Vitest and the detached snapshot runner execute from the repository root.
// Keep the fixture source relative so the isolation doctor does not treat the
// test as reading a live repository root via process.cwd().
const sourceRoot = ".";
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

function createCleanPack(): string {
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
  git(root, [
    "remote",
    "add",
    "origin",
    "git@github.com:unison-ai-product/UT-TDD_AGENT-HARNESS-Pack.git",
  ]);
  git(root, ["add", "."]);
  git(root, ["commit", "-qm", "test: materialize clean Pack"]);
  const identity = bootstrapProjectIdentity(root);
  expect(identity).toMatchObject({ ok: true, created: true, commitRequired: true });
  git(root, ["add", "ut-tdd.project.json"]);
  git(root, ["commit", "-qm", "test: commit Pack project identity"]);
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

function runPack(root: string, args: readonly string[]) {
  return spawnSync(process.execPath, [join(root, "src", "cli.ts"), ...args], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, UT_TDD_SKIP_UPDATE_CHECK: "1" },
    timeout: 120_000,
  });
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
    installDependencies(primary);
    installDependencies(linked);
    const list = runPack(linked, ["memory", "list", "--query", memory.title]);
    expect(list.status, `${list.stdout}\n${list.stderr}`).toBe(0);
    expect(list.stdout).toContain(memory.memory_id);
    const entry = buildClaudeInboxEntry({
      memory,
      operationId: "clean-pack-provider-parity",
      workspaceId: claudeWorkspaceId(linked),
    });
    const published = publishClaudeInboxEntry(primary, entry);
    const delivered = await waitForClaudeMemory({
      repoRoot: linked,
      sessionId: "pack-linked-claude",
      allowLegacy: true,
      pollIntervalMs: 10,
      maxWaitMs: 250,
    });
    expect(delivered).toMatchObject({ kind: "delivered", entry: { id: entry.id } });
    expect(existsSync(published)).toBe(false);
  }, 420_000);

  it("CANDIDATE-P-PMEMROOT-003: same Memory ID in another Pack project cannot be read or claimed", async () => {
    const primary = createCleanPack();
    const foreign = mkdtempSync(join(tmpdir(), "ut-tdd-pack-parity-foreign-"));
    fixtures.push(foreign);
    git(foreign, ["init", "-q", "-b", "main"]);
    git(foreign, ["config", "user.email", "test@example.invalid"]);
    git(foreign, ["config", "user.name", "UT-TDD foreign"]);
    git(foreign, ["remote", "add", "origin", "git@github.com:other/Pack.git"]);
    writeFileSync(
      join(foreign, "ut-tdd.project.json"),
      canonicalProjectIdentityBytes("other/Pack"),
    );
    git(foreign, ["add", "ut-tdd.project.json"]);
    git(foreign, ["commit", "-qm", "test: foreign project identity"]);
    const memory = writeMemory({
      repoRoot: primary,
      input: {
        kind: "project",
        title: "isolated Pack memory",
        body: "must not cross the project namespace",
      },
    });
    const entry = buildClaudeInboxEntry({
      memory,
      operationId: "isolated-pack-memory",
      workspaceId: claudeWorkspaceId(primary),
    });
    const published = publishClaudeInboxEntry(primary, entry);
    expect(loadMemoryCorpus(foreign).entries).toEqual([]);
    const claim = await waitForClaudeMemory({
      repoRoot: foreign,
      sessionId: "foreign-claude",
      allowLegacy: true,
      pollIntervalMs: 10,
      maxWaitMs: 80,
    });
    expect(claim.kind).toBe("timeout");
    expect(existsSync(published)).toBe(true);
  }, 420_000);
});
