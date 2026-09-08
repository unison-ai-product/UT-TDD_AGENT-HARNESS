import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, it } from "vitest";
import { ProjectMemoryMigration } from "../src/memory/project-memory-migration.ts";
import { canonicalProjectIdentityBytes } from "../src/plan-asset/adapters/project-identity-loader.ts";
import { collectWorktreeTopology } from "../src/runtime/worktree-topology-collector.ts";

const fixtures: string[] = [];
const git = (root: string, args: string[]) => execFileSync("git", ["-C", root, ...args], { stdio: "pipe" });
function fixture() {
  const root = mkdtempSync(join(tmpdir(), "ut-memory-migration-"));
  fixtures.push(root);
  const primary = join(root, "primary");
  const linked = join(root, "linked");
  mkdirSync(primary);
  git(primary, ["init", "-q", "-b", "main"]);
  git(primary, ["config", "user.name", "Test"]);
  git(primary, ["config", "user.email", "test@example.invalid"]);
  git(primary, ["config", "core.autocrlf", "false"]);
  writeFileSync(join(primary, "ut-tdd.project.json"), canonicalProjectIdentityBytes("example/migration"));
  git(primary, ["add", "ut-tdd.project.json"]);
  git(primary, ["commit", "-qm", "test: identity"]);
  git(primary, ["worktree", "add", "-qb", "linked", linked]);
  return { primary, linked };
}
function memory(root: string, name: string, body = "body", id = "memory:project:example") {
  const directory = join(root, ".ut-tdd", "memory");
  mkdirSync(directory, { recursive: true });
  const path = join(directory, name);
  writeFileSync(path, `---\nmemory_id: ${id}\nkind: project\ntitle: Example\nupdated_at: 2026-09-08\n---\n${body}\n`);
  return path;
}
afterEach(() => {
  for (const root of fixtures.splice(0)) rmSync(root, { recursive: true, force: true });
});

it("inventories actual linked worktrees, dedupes identical content, and never changes sources", () => {
  const { primary, linked } = fixture();
  const paths = [memory(primary, "a.md"), memory(linked, "b.md"), memory(linked, "c.md", "worker", "memory:project:worker")];
  const before = paths.map((path) => readFileSync(path, "utf8"));
  const result = new ProjectMemoryMigration().dryRun(linked);
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(result.groups.map((group) => [group.memoryId, group.disposition, group.variants.length])).toEqual([
    ["memory:project:example", "dedupe", 2], ["memory:project:worker", "unique", 1],
  ]);
  expect(paths.map((path) => readFileSync(path, "utf8"))).toEqual(before);
  expect(new ProjectMemoryMigration().dryRun(primary)).toEqual(result);
  const reversed = new ProjectMemoryMigration({ collect: (root) => {
    const topology = collectWorktreeTopology({ repoRoot: root });
    return { ...topology, facts: [...topology.facts].reverse() };
  } });
  expect(reversed.dryRun(primary)).toEqual(result);
});

it("retains every variant for conflicting IDs without selecting a winner", () => {
  const { primary, linked } = fixture();
  memory(primary, "a.md"); memory(linked, "b.md", "different"); memory(linked, "c.md");
  const result = new ProjectMemoryMigration().dryRun(primary);
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(result.hasConflicts).toBe(true);
  expect(result.groups[0].disposition).toBe("conflict");
  expect(result.groups[0].variants).toHaveLength(3);
});

it("fails closed for invalid and unreadable input with no partial inventory", () => {
  const { primary, linked } = fixture();
  memory(primary, "a.md");
  const invalid = memory(linked, "b.md");
  writeFileSync(invalid, "not memory");
  expect(new ProjectMemoryMigration().dryRun(primary)).toEqual({ ok: false, reason: "invalid_memory" });
  memory(linked, "b.md");
  const service = new ProjectMemoryMigration({ read: () => { throw new Error("EACCES"); } });
  expect(service.dryRun(primary)).toEqual({ ok: false, reason: "source_unavailable" });
});

it("fails closed when any linked HEAD has a foreign project identity", () => {
  const { primary, linked } = fixture();
  memory(primary, "a.md");
  writeFileSync(join(linked, "ut-tdd.project.json"), canonicalProjectIdentityBytes("foreign/project"));
  git(linked, ["add", "ut-tdd.project.json"]); git(linked, ["commit", "-qm", "test: foreign"]);
  expect(new ProjectMemoryMigration().dryRun(primary)).toEqual({ ok: false, reason: "project_identity_drift" });
});

it("fails closed for incomplete topology before reading sources", () => {
  const { primary } = fixture();
  let reads = 0;
  const service = new ProjectMemoryMigration({
    collect: (root) => ({ ...collectWorktreeTopology({ repoRoot: root }), observations: [{ kind: "collector_command_error", operation: "test", evidenceCode: "unavailable" }] }),
    read: () => { reads++; return ""; },
  });
  expect(service.dryRun(primary)).toEqual({ ok: false, reason: "topology_unavailable" });
  expect(reads).toBe(0);
});
