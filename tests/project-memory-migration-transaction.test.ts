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
  rmdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, expect, it } from "vitest";
import { ProjectMemoryMigration } from "../src/memory/project-memory-migration.ts";
import { ProjectMemoryMigrationTransaction } from "../src/memory/project-memory-migration-transaction.ts";
import { canonicalProjectIdentityBytes } from "../src/plan-asset/adapters/project-identity-loader.ts";
import { resolveProjectMemoryRoot } from "../src/runtime/project-memory-root.ts";

const roots: string[] = [];
const moduleUrl = pathToFileURL(resolve("src/memory/project-memory-migration-transaction.ts")).href;
const git = (root: string, args: string[]) =>
  execFileSync("git", ["-C", root, ...args], { stdio: "pipe" });
function fixture() {
  const root = mkdtempSync(join(tmpdir(), "ut-memory-transaction-"));
  roots.push(root);
  const primary = join(root, "primary"),
    linked = join(root, "linked");
  mkdirSync(primary);
  git(primary, ["init", "-qb", "main"]);
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
  const sources = [primary, linked].map((worktree, index) => {
    const directory = join(worktree, ".ut-tdd", "memory");
    mkdirSync(directory, { recursive: true });
    const path = join(directory, "project-conflict.md");
    writeFileSync(
      path,
      `---\nmemory_id: memory:project:conflict\nkind: project\ntitle: Conflict\n---\nvariant ${index}\n`,
    );
    return path;
  });
  const inventory = new ProjectMemoryMigration().dryRun(primary);
  expect(inventory.ok).toBe(true);
  if (!inventory.ok) throw new Error("fixture inventory failed");
  const resolved = resolveProjectMemoryRoot(primary);
  if (!resolved.ok) throw new Error("fixture root failed");
  const input = {
    repoRoot: primary,
    operationId: "fixture-operation",
    expectedInventoryDigest: inventory.inventoryDigest,
  };
  const operationRoot = join(
    resolved.runtimeBusRoot,
    "memory-migration",
    createHash("sha256").update(input.operationId).digest("hex"),
  );
  return { root, primary, linked, sources, input, operationRoot };
}
function worker(input: object, fault?: string, throwBeforeFault = false) {
  const code = `import { ProjectMemoryMigrationTransaction } from ${JSON.stringify(moduleUrl)};
    import { writeSync } from 'node:fs';
    process.on('exit', () => writeSync(2, 'normal-exit\\n'));
    if (${throwBeforeFault}) throw new Error('injected-before-fault');
    const service = new ProjectMemoryMigrationTransaction({ fault: point => { if (point === ${JSON.stringify(fault)}) {
      writeSync(2, 'migration-fault:' + point + ':' + process.pid + '\\n');
      process.kill(process.pid, 'SIGKILL');
    } } });
    process.stdout.write(JSON.stringify(service.execute(${JSON.stringify(input)})));`;
  return spawnSync(process.execPath, ["--input-type=module", "-e", code], {
    encoding: "utf8",
    timeout: 60000,
    windowsHide: true,
  });
}
function expectKilledAt(result: ReturnType<typeof worker>, point: string) {
  const diagnostic = JSON.stringify({
    status: result.status,
    signal: result.signal,
    error: result.error?.message,
    stderr: result.stderr,
  });
  expect(result.error, diagnostic).toBeUndefined();
  // Windows reports self-SIGKILL as exit 1 / null, measured with the same Node
  // executable. Exact synchronous stderr also excludes ordinary JS exit: its
  // exit hook writes normal-exit (including uncaught exceptions).
  expect(result.stderr, diagnostic).toBe(`migration-fault:${point}:${result.pid}\n`);
  expect(result.stdout, diagnostic).toBe("");
  expect(result.status, diagnostic).toBe(process.platform === "win32" ? 1 : null);
  expect(result.signal, diagnostic).toBe(process.platform === "win32" ? null : "SIGKILL");
}
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

it("quarantines all conflicting variants without touching sources or canonical corpus and replays", () => {
  const fixtureData = fixture();
  const before = fixtureData.sources.map((path) => readFileSync(path));
  const result = new ProjectMemoryMigrationTransaction().execute(fixtureData.input);
  expect(result.ok, JSON.stringify(result)).toBe(true);
  if (!result.ok) return;
  const files = readdirSync(result.quarantineRoot)
    .filter((name) => name.endsWith(".md"))
    .sort();
  expect(files).toHaveLength(2);
  expect(
    files.map((name) => readFileSync(join(result.quarantineRoot, name)).toString()).sort(),
  ).toEqual(before.map((bytes) => bytes.toString()).sort());
  expect(fixtureData.sources.map((path) => readFileSync(path))).toEqual(before);
  expect(
    readdirSync(fixtureData.operationRoot).filter((name) => name.endsWith(".pending")),
  ).toEqual([]);
  expect(new ProjectMemoryMigrationTransaction().execute(fixtureData.input)).toMatchObject({
    ok: true,
    status: "replayed",
  });
});

it.each([
  "content",
  "replacement",
  "junction",
])("rejects source %s drift after handle binding", (mutation) => {
  const f = fixture();
  const sourceIdentity = lstatSync(f.sources[1], { bigint: true });
  let changed = false;
  const service = new ProjectMemoryMigrationTransaction({
    fault: (point) => {
      if (point !== "after-bind" || changed) return;
      changed = true;
      if (mutation === "content") writeFileSync(f.sources[1], "changed");
      if (mutation === "replacement") {
        renameSync(f.sources[1], `${f.sources[1]}.old`);
        writeFileSync(f.sources[1], readFileSync(`${f.sources[1]}.old`));
      }
      if (mutation === "junction") {
        const directory = join(f.linked, ".ut-tdd", "memory"),
          external = join(f.root, "external");
        // Windows rejects renaming a directory with an open child (measured EPERM).
        // Move the child itself without changing its inode, then replace the empty parent.
        mkdirSync(external);
        renameSync(f.sources[1], join(external, "project-conflict.md"));
        rmdirSync(directory);
        symlinkSync(external, directory, process.platform === "win32" ? "junction" : "dir");
      }
    },
  });
  const result = service.execute(f.input);
  if (mutation === "junction") {
    expect(lstatSync(join(f.linked, ".ut-tdd", "memory")).isSymbolicLink()).toBe(true);
    const observed = lstatSync(f.sources[1], { bigint: true });
    expect([observed.dev, observed.ino]).toEqual([sourceIdentity.dev, sourceIdentity.ino]);
  }
  expect(result).toMatchObject({ ok: false, reason: "source_drift" });
  expect(existsSync(join(f.operationRoot, "complete.json"))).toBe(false);
});

it.each([
  "after-owner",
  "after-intent",
  "after-copy",
  "after-prepared",
  "after-rename",
  "before-complete",
])("recovers in another process after SIGKILL at %s", (point) => {
  const f = fixture();
  const before = f.sources.map((path) => readFileSync(path));
  const crashed = worker(f.input, point);
  expectKilledAt(crashed, point);
  const recovered = worker(f.input);
  expect(recovered.status, recovered.stderr).toBe(0);
  expect(JSON.parse(recovered.stdout)).toMatchObject({ ok: true });
  expect(f.sources.map((path) => readFileSync(path))).toEqual(before);
  expect(new ProjectMemoryMigrationTransaction().execute(f.input)).toMatchObject({
    ok: true,
    status: "replayed",
  });
}, 120000);

it("rejects an ordinary pre-fault exception as crash evidence even when fresh execution succeeds", () => {
  const f = fixture();
  const failed = worker(f.input, "after-owner", true);
  expect(failed.error).toBeUndefined();
  expect(failed.status).toBe(1);
  expect(failed.signal).toBeNull();
  expect(failed.stderr).toContain("injected-before-fault");
  expect(failed.stderr).toContain("normal-exit\n");
  expect(() => expectKilledAt(failed, "after-owner")).toThrow();
  const fresh = worker(f.input);
  expect(fresh.status, fresh.stderr).toBe(0);
  expect(JSON.parse(fresh.stdout)).toMatchObject({ ok: true });
}, 120000);

it.each([
  "marker",
  "quarantine",
  "corpus",
  "inventory",
  "operation",
])("denies completion replay after %s tampering", (mutation) => {
  const f = fixture();
  const result = new ProjectMemoryMigrationTransaction().execute(f.input);
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  if (mutation === "marker") writeFileSync(join(f.operationRoot, "complete.json"), "{}");
  if (mutation === "quarantine")
    rmSync(join(result.quarantineRoot, readdirSync(result.quarantineRoot)[0]));
  if (mutation === "corpus") writeFileSync(f.sources[0], "tampered");
  if (mutation === "operation") {
    const path = join(f.operationRoot, "complete.json");
    const record = JSON.parse(readFileSync(path, "utf8"));
    record.payload.binding.operationId = "different-operation";
    record.digest = createHash("sha256")
      .update(JSON.stringify({ payload: record.payload, identity: record.identity }))
      .digest("hex");
    writeFileSync(path, JSON.stringify(record));
  }
  const input =
    mutation === "inventory" ? { ...f.input, expectedInventoryDigest: "0".repeat(64) } : f.input;
  expect(new ProjectMemoryMigrationTransaction().execute(input).ok).toBe(false);
});

it("denies a concurrent process while the actual owner is alive without deleting its record", () => {
  const f = fixture();
  let contender: ReturnType<typeof worker> | undefined;
  const result = new ProjectMemoryMigrationTransaction({
    fault: (point) => {
      if (point === "after-owner") contender = worker(f.input);
    },
  }).execute(f.input);
  expect(result.ok).toBe(true);
  const diagnostic = JSON.stringify({
    status: contender?.status,
    signal: contender?.signal,
    error: contender?.error?.message,
    stderr: contender?.stderr,
  });
  expect(contender?.error, diagnostic).toBeUndefined();
  expect(contender?.status, diagnostic).toBe(0);
  expect(JSON.parse(contender?.stdout ?? "{}")).toMatchObject({
    ok: false,
    reason: "owner_unavailable",
  });
  expect(existsSync(join(f.operationRoot, "owner.json"))).toBe(true);
});

it("does not steal a dead owner's reused PID or trust a copied owner record", () => {
  const f = fixture();
  const crashed = worker(f.input, "after-owner");
  expectKilledAt(crashed, "after-owner");
  const path = join(f.operationRoot, "owner.json");
  const record = JSON.parse(readFileSync(path, "utf8"));
  record.payload.pid = process.pid;
  record.digest = createHash("sha256")
    .update(JSON.stringify({ payload: record.payload, identity: record.identity }))
    .digest("hex");
  writeFileSync(path, JSON.stringify(record));
  expect(new ProjectMemoryMigrationTransaction().execute(f.input)).toMatchObject({
    ok: false,
    reason: "owner_unavailable",
  });
  const contents = readFileSync(path);
  renameSync(path, `${path}.original`);
  writeFileSync(path, contents);
  expect(new ProjectMemoryMigrationTransaction().execute(f.input)).toMatchObject({
    ok: false,
    reason: "marker_invalid",
  });
  expect(readFileSync(path)).toEqual(contents);
});

it.each([
  "foreign-host",
  "branched-chain",
])("retains and denies %s ownership evidence", (mutation) => {
  const f = fixture();
  expectKilledAt(worker(f.input, "after-owner"), "after-owner");
  const path = join(f.operationRoot, "owner.json");
  const record = JSON.parse(readFileSync(path, "utf8"));
  if (mutation === "foreign-host") {
    record.payload.binding.hostFingerprint = "0".repeat(64);
    record.digest = createHash("sha256")
      .update(JSON.stringify({ payload: record.payload, identity: record.identity }))
      .digest("hex");
    writeFileSync(path, JSON.stringify(record));
  } else
    writeFileSync(
      join(f.operationRoot, `owner-next-${"0".repeat(64)}.json`),
      JSON.stringify(record),
    );
  const before = readdirSync(f.operationRoot).sort();
  expect(new ProjectMemoryMigrationTransaction().execute(f.input)).toMatchObject({
    ok: false,
    reason: "marker_invalid",
  });
  expect(readdirSync(f.operationRoot).sort()).toEqual(before);
});
