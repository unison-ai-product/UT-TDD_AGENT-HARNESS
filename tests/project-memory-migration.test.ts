import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, expect, it } from "vitest";
import { canonicalProjectIdentityBytes } from "../src/plan-asset/adapters/project-identity-loader.ts";
import { ProjectMemoryMigration } from "../src/runtime/project-memory-migration.ts";
import { resolveProjectMemoryRoot } from "../src/runtime/project-memory-root.ts";
import { normalizeTopologyPath } from "../src/runtime/worktree-topology.ts";
import { collectWorktreeTopology } from "../src/runtime/worktree-topology-collector.ts";

const fixtures: string[] = [];
const git = (root: string, args: string[]) =>
  execFileSync("git", ["-C", root, ...args], { stdio: "pipe" });
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
  git(primary, ["remote", "add", "origin", "git@github.com:example/migration.git"]);
  writeFileSync(
    join(primary, "ut-tdd.project.json"),
    canonicalProjectIdentityBytes("example/migration"),
  );
  git(primary, ["add", "ut-tdd.project.json"]);
  git(primary, ["commit", "-qm", "test: identity"]);
  git(primary, ["worktree", "add", "-qb", "linked", linked]);
  expect(resolveProjectMemoryRoot(primary).ok).toBe(true);
  expect(resolveProjectMemoryRoot(linked).ok).toBe(true);
  return { primary, linked };
}
function memory(root: string, name: string, body = "body", id = "memory:project:example") {
  const directory = join(root, ".ut-tdd", "memory");
  mkdirSync(directory, { recursive: true });
  const path = join(directory, name);
  writeFileSync(
    path,
    `---\nmemory_id: ${id}\nkind: project\ntitle: Example\nupdated_at: 2026-09-08\n---\n${body}\n`,
  );
  return path;
}
const canonicalWorktreeRoot = (root: string): string =>
  normalizeTopologyPath(git(root, ["rev-parse", "--show-toplevel"]).toString("utf8").trim());
afterEach(() => {
  for (const root of fixtures.splice(0)) rmSync(root, { recursive: true, force: true });
});

it("U-PMEMINV-001 inventories linked worktrees without changing sources", () => {
  const { primary, linked } = fixture();
  const paths = [
    memory(primary, "a.md"),
    memory(linked, "b.md"),
    memory(linked, "c.md", "worker", "memory:project:worker"),
  ];
  const before = paths.map((path) => readFileSync(path, "utf8"));
  const result = new ProjectMemoryMigration().dryRun(linked);
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(
    result.groups.map((group) => [group.memoryId, group.disposition, group.variants.length]),
  ).toEqual([
    ["memory:project:example", "dedupe", 2],
    ["memory:project:worker", "unique", 1],
  ]);
  expect(paths.map((path) => readFileSync(path, "utf8"))).toEqual(before);
  expect(new ProjectMemoryMigration().dryRun(primary)).toEqual(result);
  const reversed = new ProjectMemoryMigration({
    collect: (root) => {
      const topology = collectWorktreeTopology({ repoRoot: root });
      return { ...topology, facts: [...topology.facts].reverse() };
    },
  });
  expect(reversed.dryRun(primary)).toEqual(result);
});

it("U-PMEMINV-002 retains every conflict variant without selecting a winner", () => {
  const { primary, linked } = fixture();
  memory(primary, "a.md");
  memory(linked, "b.md", "different");
  memory(linked, "c.md");
  const result = new ProjectMemoryMigration().dryRun(primary);
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(result.hasConflicts).toBe(true);
  expect(result.groups[0].disposition).toBe("conflict");
  const variants = result.groups[0].variants;
  const canonicalPrimary = canonicalWorktreeRoot(primary);
  const canonicalLinked = canonicalWorktreeRoot(linked);
  expect(variants.map(({ worktreeRoot, sourcePath }) => [worktreeRoot, sourcePath]).sort()).toEqual(
    [
      [canonicalPrimary, ".ut-tdd/memory/a.md"],
      [canonicalLinked, ".ut-tdd/memory/b.md"],
      [canonicalLinked, ".ut-tdd/memory/c.md"],
    ].sort(),
  );
  const digestBySource = new Map(
    variants.map((variant) => [
      `${variant.worktreeRoot}:${variant.sourcePath}`,
      variant.contentDigest,
    ]),
  );
  expect(new Set(digestBySource.values()).size).toBe(2);
  expect(digestBySource.get(`${canonicalPrimary}:.ut-tdd/memory/a.md`)).toBe(
    digestBySource.get(`${canonicalLinked}:.ut-tdd/memory/c.md`),
  );
  expect(digestBySource.get(`${canonicalLinked}:.ut-tdd/memory/b.md`)).not.toBe(
    digestBySource.get(`${canonicalPrimary}:.ut-tdd/memory/a.md`),
  );
  // TEMP may use an 8.3 alias on Windows. Input spelling must not leak into the inventory.
  expect(new ProjectMemoryMigration().dryRun(linked)).toEqual(result);
});

it("U-PMEMINV-003 rejects invalid and unreadable input without partial inventory", () => {
  const { primary, linked } = fixture();
  memory(primary, "a.md");
  const invalid = memory(linked, "b.md");
  writeFileSync(invalid, "not memory");
  expect(new ProjectMemoryMigration().dryRun(primary)).toEqual({
    ok: false,
    reason: "invalid_memory",
  });
  memory(linked, "b.md");
  const service = new ProjectMemoryMigration({
    read: () => {
      throw new Error("EACCES");
    },
  });
  expect(service.dryRun(primary)).toEqual({ ok: false, reason: "source_unavailable" });
});

it("U-PMEMINV-004 rejects a foreign linked HEAD before reading sources", () => {
  const { primary, linked } = fixture();
  memory(primary, "a.md");
  expect(new ProjectMemoryMigration().dryRun(primary).ok).toBe(true);
  writeFileSync(
    join(linked, "ut-tdd.project.json"),
    canonicalProjectIdentityBytes("foreign/project"),
  );
  git(linked, ["add", "ut-tdd.project.json"]);
  git(linked, ["commit", "-qm", "test: foreign"]);
  let reads = 0;
  const service = new ProjectMemoryMigration({
    read: (path) => {
      reads++;
      return readFileSync(path, "utf8");
    },
  });
  // The existing loader rejects HEAD/origin disagreement before root identity comparison.
  expect(service.dryRun(primary)).toEqual({ ok: false, reason: "project_identity_unavailable" });
  expect(reads).toBe(0);
});

it("U-PMEMINV-005 rejects incomplete topology before reading sources", () => {
  const { primary } = fixture();
  let reads = 0;
  const service = new ProjectMemoryMigration({
    collect: (root) => ({
      ...collectWorktreeTopology({ repoRoot: root }),
      observations: [
        { kind: "collector_command_error", operation: "test", evidenceCode: "unavailable" },
      ],
    }),
    read: () => {
      reads++;
      return "";
    },
  });
  expect(service.dryRun(primary)).toEqual({ ok: false, reason: "topology_unavailable" });
  expect(reads).toBe(0);
});

it("U-PMEMINV-006 rejects non-regular sources and binds content changes", () => {
  const { primary, linked } = fixture();
  memory(linked, "a.md");
  const first = new ProjectMemoryMigration().dryRun(primary);
  memory(linked, "a.md", "changed");
  const second = new ProjectMemoryMigration().dryRun(primary);
  expect(first.ok && second.ok && first.inventoryDigest !== second.inventoryDigest).toBe(true);
  mkdirSync(join(linked, ".ut-tdd", "memory", "directory.md"));
  expect(new ProjectMemoryMigration().dryRun(primary)).toEqual({
    ok: false,
    reason: "source_unsafe",
  });
});

it("U-PMEMINV-007 rejects a linked memory junction without reading its target", () => {
  const { primary, linked } = fixture();
  const external = join(dirname(primary), "external");
  mkdirSync(external);
  mkdirSync(join(linked, ".ut-tdd"));
  symlinkSync(
    external,
    join(linked, ".ut-tdd", "memory"),
    process.platform === "win32" ? "junction" : "dir",
  );
  let reads = 0;
  const service = new ProjectMemoryMigration({
    read: () => {
      reads++;
      return "";
    },
  });
  expect(service.dryRun(primary)).toEqual({ ok: false, reason: "source_unsafe" });
  expect(reads).toBe(0);
});

it("U-PMEMINV-008 rejects malformed UTF-8 and does not strip a BOM", () => {
  const { primary } = fixture();
  const path = memory(primary, "a.md");
  const original = readFileSync(path);
  writeFileSync(path, Buffer.concat([original, Buffer.from([0xff])]));
  expect(new ProjectMemoryMigration().dryRun(primary)).toEqual({
    ok: false,
    reason: "invalid_memory",
  });
  writeFileSync(path, Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), original]));
  expect(new ProjectMemoryMigration().dryRun(primary)).toEqual({
    ok: false,
    reason: "invalid_memory",
  });
});
