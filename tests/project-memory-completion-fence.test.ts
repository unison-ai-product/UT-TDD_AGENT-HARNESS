import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { readMemory, writeMemory } from "../src/memory/service.ts";
import {
  buildClaudeInboxEntry,
  buildClaudeProviderInboxEntry,
  claudeWorkspaceId,
  publishClaudeInboxEntry,
  waitForClaudeMemory,
} from "../src/runtime/claude-memory-wake.ts";
import { inspectProjectMemoryCompletion } from "../src/runtime/project-memory-completion-fence.ts";
import { ProjectMemoryMigration } from "../src/runtime/project-memory-migration.ts";
import { nodeSetupDeps, runSetup, type SetupDeps } from "../src/setup/index.ts";
import { canonicalProjectIdentityBytes } from "../src/setup/project-identity-bootstrap.ts";

const roots: string[] = [];

function git(cwd: string, args: string[]): string {
  return execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8" }).trim();
}

function memory(root: string, name: string, body = "body"): string {
  const path = join(root, ".ut-tdd", "memory", name);
  const memoryId = `memory:project:${createHash("sha256").update(name).digest("hex").slice(0, 16)}`;
  writeFileSync(
    path,
    [
      "---",
      `memory_id: ${memoryId}`,
      "kind: project",
      `title: ${JSON.stringify(name)}`,
      "tags: []",
      "updated_at: 2026-09-09T00:00:00.000Z",
      "---",
      "",
      body,
      "",
    ].join("\n"),
  );
  return path;
}

function fixture(body = "body"): string {
  const root = mkdtempSync(join(tmpdir(), "ut-memory-fence-"));
  roots.push(root);
  git(root, ["init", "-q"]);
  git(root, ["config", "user.email", "test@example.invalid"]);
  git(root, ["config", "user.name", "test"]);
  git(root, ["config", "core.autocrlf", "false"]);
  git(root, ["remote", "add", "origin", "git@github.com:example/memory-fence.git"]);
  writeFileSync(
    join(root, "ut-tdd.project.json"),
    canonicalProjectIdentityBytes("example/memory-fence"),
  );
  mkdirSync(join(root, ".ut-tdd", "memory"), { recursive: true });
  memory(root, "memory.md", body);
  git(root, ["add", "ut-tdd.project.json", ".ut-tdd/memory/memory.md"]);
  git(root, ["commit", "-qm", "test: completion fence fixture"]);
  return root;
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function tree(root: string): string {
  const files = new Map<string, string>();
  const collect = (base: string, prefix: string): void => {
    let names: string[];
    try {
      names = readdirSync(base);
    } catch {
      return;
    }
    for (const name of names) {
      const path = join(base, name);
      const stat = lstatSync(path);
      const key = `${prefix}/${name}`;
      if (stat.isDirectory() && !stat.isSymbolicLink()) collect(path, key);
      else if (stat.isFile() && !stat.isSymbolicLink()) {
        files.set(key, createHash("sha256").update(readFileSync(path)).digest("hex"));
      }
    }
  };
  collect(join(root, ".ut-tdd"), "worktree/.ut-tdd");
  const commonDir = resolve(
    execFileSync("git", ["-C", root, "rev-parse", "--path-format=absolute", "--git-common-dir"], {
      encoding: "utf8",
    }).trim(),
  );
  collect(join(commonDir, "ut-tdd-runtime"), "common/ut-tdd-runtime");
  return JSON.stringify([...files].sort());
}

function setupDeps(root: string): SetupDeps {
  return {
    repoRoot: root,
    now: () => "2026-09-09T00:00:00.000Z",
    gh: () => ({ ok: false, stdout: "" }),
    readText: (path) => {
      try {
        return readFileSync(path, "utf8");
      } catch {
        return null;
      }
    },
    writeText: (path, content) => {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, content);
    },
    confirm: () => false,
    isInteractive: false,
    templates: {},
    bootstrapProjectIdentity: () => ({
      ok: true,
      repositoryIdentity: "example/memory-fence",
      path: "ut-tdd.project.json",
      created: false,
      commitRequired: false,
    }),
  };
}

async function assertDeniedEntrances(
  root: string,
  reason: string,
  options: { includeSetup?: boolean } = {},
): Promise<void> {
  const before = tree(root);
  if (options.includeSetup !== false) {
    expect(() =>
      runSetup({ phase: "0-A", dryRun: false, applyBranchProtection: false }, setupDeps(root)),
    ).toThrow(reason);
  }
  const cli = join(process.cwd(), "src", "cli.ts");
  const status = spawnSync(process.execPath, [cli, "status", "--json"], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, UT_TDD_UPDATE_CHECK_DISABLE: "1" },
  });
  expect(status.status).toBe(0);
  expect(JSON.parse(status.stdout)).toMatchObject({
    memoryMigration: { ok: false, reason },
  });
  const session = spawnSync(process.execPath, [cli, "session", "start"], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, UT_TDD_PROJECT_DIR: "", CLAUDE_PROJECT_DIR: "" },
  });
  expect(session.status).not.toBe(0);
  expect(`${session.stdout}\n${session.stderr}`).toContain(reason);
  expect(() => readMemory({ repoRoot: root })).toThrow(reason);
  expect(() =>
    writeMemory({
      repoRoot: root,
      input: { kind: "project", title: "denied write", body: "must not write" },
    }),
  ).toThrow(reason);
  const memoryEntry = {
    memory_id: "memory:project:denied-wake",
    kind: "project" as const,
    title: "denied wake",
    body: "in-memory fixture",
    tags: [],
    source_path: ".ut-tdd/memory/denied-wake.md",
    updated_at: "2026-09-09T00:00:00.000Z",
    content_hash: createHash("sha256").update("in-memory fixture").digest("hex"),
  };
  const inboxEntry = buildClaudeInboxEntry({
    memory: memoryEntry,
    operationId: "denied-wake",
    workspaceId: claudeWorkspaceId(root),
  });
  expect(() => publishClaudeInboxEntry(root, inboxEntry)).toThrow(reason);
  await expect(
    waitForClaudeMemory({
      repoRoot: root,
      sessionId: "denied-session",
      pollIntervalMs: 10,
      maxWaitMs: 20,
    }),
  ).resolves.toMatchObject({ kind: "denied", reason });
  expect(tree(root)).toBe(before);
}

describe("Issue #550 project memory completion fence", () => {
  it("U-PMEMFENCE-009 bootstraps a clean tracked project once before setup writes", () => {
    const root = fixture();
    const runtimeRoot = join(root, ".ut-tdd", "memory");
    rmSync(runtimeRoot, { recursive: true, force: true });
    const result = runSetup(
      { phase: "0-A", dryRun: false, applyBranchProtection: false },
      setupDeps(root),
    );
    expect(result.memoryMigration.ok).toBe(true);
    expect(existsSync(join(root, ".ut-tdd", "state", "setup.json"))).toBe(true);
    expect(inspectProjectMemoryCompletion(root).ok).toBe(true);
  });

  it("U-PMEMFENCE-010 stops after untracked identity bootstrap until commit", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-memory-fence-bootstrap-"));
    roots.push(root);
    git(root, ["init", "-q"]);
    git(root, ["config", "user.email", "test@example.invalid"]);
    git(root, ["config", "user.name", "test"]);
    git(root, ["remote", "add", "origin", "git@github.com:example/bootstrap.git"]);
    expect(() =>
      runSetup({ phase: "0-A", dryRun: false, applyBranchProtection: false }, nodeSetupDeps(root)),
    ).toThrow("project_identity_commit_required");
    expect(existsSync(join(root, "ut-tdd.project.json"))).toBe(true);
    expect(existsSync(join(root, ".ut-tdd", "state", "setup.json"))).toBe(false);
    git(root, ["add", "ut-tdd.project.json"]);
    git(root, ["commit", "-qm", "test: commit project identity"]);
    const result = runSetup(
      { phase: "0-A", dryRun: false, applyBranchProtection: false },
      nodeSetupDeps(root),
    );
    expect(result.memoryMigration.ok).toBe(true);
    expect(existsSync(join(root, ".ut-tdd", "state", "setup.json"))).toBe(true);
  });

  it("U-PMEMFENCE-001 denies an interrupted migration", async () => {
    const root = fixture();
    const interrupted = new ProjectMemoryMigration().apply(root, { crashAfter: "intent" });
    expect(interrupted.ok).toBe(false);
    if (interrupted.ok) return;
    await assertDeniedEntrances(root, "migration_incomplete");
  });

  it("U-PMEMFENCE-002 rejects source drift after completion", async () => {
    const root = fixture();
    const applied = new ProjectMemoryMigration().apply(root);
    expect(applied.ok).toBe(true);
    memory(root, "memory.md", "drift");
    await assertDeniedEntrances(root, "inventory_drift");
  });

  it("U-PMEMFENCE-003 rejects marker tampering", async () => {
    const root = fixture();
    const applied = new ProjectMemoryMigration().apply(root);
    expect(applied.ok).toBe(true);
    if (!applied.ok) return;
    writeFileSync(applied.markersPath, `${readFileSync(applied.markersPath, "utf8")}tampered\n`);
    await assertDeniedEntrances(root, "transaction_tampered");
  });

  it("U-PMEMFENCE-004 does not fallback to a legacy corpus sentinel", () => {
    const root = fixture("legacy-sentinel-must-not-be-read");
    return assertDeniedEntrances(root, "migration_incomplete", { includeSetup: false });
  });

  it("U-PMEMFENCE-005 accepts a deterministic completed replay", async () => {
    const root = fixture();
    const applied = new ProjectMemoryMigration().apply(root);
    expect(applied.ok).toBe(true);
    if (!applied.ok) return;
    const first = inspectProjectMemoryCompletion(root);
    const second = inspectProjectMemoryCompletion(root);
    expect(first).toEqual(second);
    expect(first.ok).toBe(true);
    const appended = writeMemory({
      repoRoot: root,
      input: { kind: "project", title: "post-completion append", body: "append body" },
    });
    const appendPath = join(root, appended.source_path);
    const replacementPath = `${appendPath}.replacement`;
    const backupPath = `${appendPath}.backup`;
    writeFileSync(replacementPath, readFileSync(appendPath));
    renameSync(appendPath, backupPath);
    renameSync(replacementPath, appendPath);
    rmSync(backupPath, { force: true });
    expect(inspectProjectMemoryCompletion(root).ok).toBe(true);
    expect(
      readMemory({ repoRoot: root, options: { query: "post-completion append" } }).entries,
    ).toContainEqual(appended);
    const inboxEntry = buildClaudeProviderInboxEntry({
      memory: appended,
      projectId: first.ok ? first.projectId : "",
      operationId: "completed-wake",
      workspaceId: claudeWorkspaceId(root),
      producer: { provider: "codex", sessionId: "producer" },
      target: { scope: "session", provider: "claude", sessionId: "completed-session" },
    });
    publishClaudeInboxEntry(root, inboxEntry);
    await expect(
      waitForClaudeMemory({
        repoRoot: root,
        sessionId: "completed-session",
        pollIntervalMs: 10,
        maxWaitMs: 1_000,
      }),
    ).resolves.toMatchObject({ kind: "delivered" });
  });

  it("U-PMEMFENCE-006 rejects a new legacy-worktree variant after completion", () => {
    const root = fixture();
    const linked = `${root}-linked`;
    roots.push(linked);
    const applied = new ProjectMemoryMigration().apply(root);
    expect(applied, JSON.stringify(applied)).toMatchObject({ ok: true });
    expect(git(root, ["worktree", "add", "-qb", "linked", linked])).toBe("");
    memory(linked, "legacy-extra.md", "legacy extra");
    expect(inspectProjectMemoryCompletion(root)).toMatchObject({
      ok: false,
      reason: "inventory_drift",
    });
  });

  it("U-PMEMFENCE-007 rejects same-ID digest drift after completion", () => {
    const root = fixture();
    expect(new ProjectMemoryMigration().apply(root).ok).toBe(true);
    memory(root, "memory.md", "same id but changed");
    expect(inspectProjectMemoryCompletion(root)).toMatchObject({
      ok: false,
      reason: "inventory_drift",
    });
  });

  it("U-PMEMFENCE-008 rechecks the fence immediately before provider claim", async () => {
    const root = fixture();
    const applied = new ProjectMemoryMigration().apply(root);
    expect(applied.ok).toBe(true);
    if (!applied.ok) return;
    const entry = buildClaudeProviderInboxEntry({
      memory: {
        memory_id: "memory:project:claim-fence",
        kind: "project",
        title: "claim fence",
        body: "claim fence body",
        tags: [],
        source_path: ".ut-tdd/memory/claim-fence.md",
        updated_at: "2026-09-09T00:00:00.000Z",
        content_hash: createHash("sha256").update("claim fence body").digest("hex"),
      },
      projectId: "example/memory-fence",
      operationId: "claim-fence",
      workspaceId: claudeWorkspaceId(root),
      producer: { provider: "codex", sessionId: "producer" },
      target: { scope: "session", provider: "claude", sessionId: "claim-fence-session" },
    });
    const inboxPath = publishClaudeInboxEntry(root, entry);
    const result = await waitForClaudeMemory({
      repoRoot: root,
      sessionId: "claim-fence-session",
      pollIntervalMs: 10,
      maxWaitMs: 1_000,
      beforeClaimCommit: () => memory(root, "memory.md", "claim-time drift"),
    });
    expect(result).toMatchObject({ kind: "denied", reason: "inventory_drift" });
    expect(existsSync(inboxPath)).toBe(true);
    expect(tree(root)).not.toContain(".claim");
    expect(tree(root)).not.toContain(".terminal.json");
  });
});
