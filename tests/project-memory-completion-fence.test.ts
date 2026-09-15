import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  utimesSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { writeMemory } from "../src/memory/service.ts";
import {
  inspectProjectMemoryCompletion,
  ProjectMemoryCompletionError,
  replayProjectMemoryCompletion,
  requireProjectMemoryCompletion,
} from "../src/runtime/project-memory-completion-fence.ts";
import { ProjectMemoryMigration } from "../src/runtime/project-memory-migration.ts";
import { canonicalProjectIdentityBytes } from "../src/setup/project-identity-bootstrap.ts";

const fixtures: string[] = [];

function git(cwd: string, args: readonly string[]): string {
  return execFileSync("git", ["-C", cwd, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  }).trim();
}

function memoryPath(root: string, name: string): string {
  return join(root, ".ut-tdd", "memory", name);
}

function memoryText(id: string, body: string): string {
  return [
    "---",
    `memory_id: memory:project:${id}`,
    "kind: project",
    `title: ${id}`,
    "tags: []",
    "updated_at: 2026-09-14T00:00:00.000Z",
    "---",
    "",
    body,
    "",
  ].join("\n");
}

function fixture(withLinked = false): { primary: string; linked?: string } {
  const root = mkdtempSync(join(tmpdir(), "ut-memory-fence-core-"));
  fixtures.push(root);
  const primary = join(root, "primary");
  mkdirSync(primary, { recursive: true });
  git(primary, ["init", "-q", "-b", "main"]);
  git(primary, ["config", "user.email", "test@example.invalid"]);
  git(primary, ["config", "user.name", "UT-TDD test"]);
  git(primary, ["config", "core.autocrlf", "false"]);
  git(primary, ["remote", "add", "origin", "git@github.com:example/memory-fence.git"]);
  writeFileSync(
    join(primary, "ut-tdd.project.json"),
    canonicalProjectIdentityBytes("example/memory-fence"),
  );
  mkdirSync(join(primary, ".ut-tdd", "memory"), { recursive: true });
  writeFileSync(memoryPath(primary, "seed.md"), memoryText("seed", "seed body"));
  git(primary, ["add", "ut-tdd.project.json", ".ut-tdd/memory/seed.md"]);
  git(primary, ["commit", "-q", "-m", "test: seed completion fence"]);
  if (!withLinked) return { primary };
  const linked = join(root, "linked");
  git(primary, ["worktree", "add", "-q", "-b", "linked", linked]);
  return { primary, linked };
}

function complete(
  root: string,
): Extract<ReturnType<ProjectMemoryMigration["apply"]>, { ok: true }> {
  const result = new ProjectMemoryMigration().apply(root);
  expect(result).toMatchObject({ ok: true, status: "completed" });
  if (!result.ok) throw new Error(result.reason);
  return result;
}

function runtimeSnapshot(root: string): string {
  const common = git(root, ["rev-parse", "--path-format=absolute", "--git-common-dir"]);
  const migration = join(common, "ut-tdd-runtime");
  if (!existsSync(migration)) return "";
  const files: string[] = [];
  const visit = (directory: string, prefix: string): void => {
    for (const name of readdirSync(directory)) {
      const path = join(directory, name);
      const stat = lstatSync(path);
      if (stat.isDirectory() && !stat.isSymbolicLink()) visit(path, `${prefix}/${name}`);
      else if (stat.isFile() && !stat.isSymbolicLink()) {
        files.push(
          `${prefix}/${name}:${createHash("sha256").update(readFileSync(path)).digest("hex")}`,
        );
      }
    }
  };
  visit(migration, "runtime");
  return files.sort().join("\n");
}

function digest(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function cloneOperation(
  markersPath: string,
  operationId: string,
  previousCompleteDigest: string | null,
): string {
  const sourceRoot = dirname(markersPath);
  const targetRoot = join(dirname(sourceRoot), operationId);
  mkdirSync(targetRoot, { recursive: true });
  cpSync(join(sourceRoot, "quarantine"), join(targetRoot, "quarantine"), { recursive: true });
  let previousRecordDigest: string | null = null;
  const markers = readFileSync(markersPath, "utf8")
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line) as Record<string, unknown>)
    .map((marker) => {
      const payload = { ...(marker.payload as Record<string, unknown>) };
      if (marker.kind === "owner" && previousCompleteDigest !== null) {
        payload.previous_complete_digest = previousCompleteDigest;
      }
      const unsigned = {
        sequence: marker.sequence,
        kind: marker.kind,
        operationId,
        payload,
        previousRecordDigest,
      };
      const rewritten = { ...unsigned, recordDigest: digest(unsigned) };
      previousRecordDigest = rewritten.recordDigest as string;
      return rewritten;
    });
  writeFileSync(
    join(targetRoot, "markers.jsonl"),
    `${markers.map((marker) => JSON.stringify(marker)).join("\n")}\n`,
  );
  return String(markers.at(-1)?.recordDigest);
}

afterEach(() => {
  for (const root of fixtures.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("PLAN-L7-533 PR-1 completion fence core", () => {
  it("U-PMEMFENCE-001 U-PMEMFENCE-003: denies missing or interrupted migration as incomplete", () => {
    const missing = fixture().primary;
    expect(inspectProjectMemoryCompletion(missing)).toMatchObject({
      ok: false,
      reason: "migration_incomplete",
      readAllowed: false,
      writeAllowed: false,
    });

    const interrupted = fixture().primary;
    expect(new ProjectMemoryMigration().apply(interrupted, { crashAfter: "intent" })).toMatchObject(
      {
        ok: false,
        reason: "transaction_interrupted",
      },
    );
    expect(inspectProjectMemoryCompletion(interrupted)).toMatchObject({
      ok: false,
      reason: "migration_incomplete",
      readAllowed: false,
      writeAllowed: false,
    });
  });

  it("U-PMEMFENCE-002: rejects marker-chain tampering without writes", () => {
    const root = fixture().primary;
    const applied = complete(root);
    writeFileSync(applied.markersPath, `${readFileSync(applied.markersPath, "utf8")}tampered\n`);
    const afterTamper = runtimeSnapshot(root);
    expect(inspectProjectMemoryCompletion(root)).toMatchObject({
      ok: false,
      reason: "transaction_tampered",
      readAllowed: false,
      writeAllowed: false,
    });
    expect(runtimeSnapshot(root)).toBe(afterTamper);
  });

  it("U-PMEMFENCE-004 U-PMEMFENCE-005: worktree add and removal do not change a live fence", () => {
    const { primary, linked } = fixture(true);
    const applied = complete(primary);
    const first = inspectProjectMemoryCompletion(primary);
    expect(first).toMatchObject({ ok: true, operationId: applied.operationId });
    if (!first.ok || !linked) throw new Error("fixture setup failed");
    const added = join(primary, "..", "added");
    fixtures.push(added);
    git(primary, ["worktree", "add", "-q", "-b", "added", added]);
    expect(inspectProjectMemoryCompletion(primary)).toMatchObject({
      ok: true,
      projectId: first.projectId,
      operationId: first.operationId,
    });
    git(primary, ["worktree", "remove", "--force", linked]);
    expect(inspectProjectMemoryCompletion(primary)).toMatchObject({
      ok: true,
      projectId: first.projectId,
      operationId: first.operationId,
    });
  });

  it("U-PMEMFENCE-006: canonical corpus changes update only the reported digest", () => {
    const root = fixture().primary;
    complete(root);
    const first = inspectProjectMemoryCompletion(root);
    expect(first.ok).toBe(true);
    writeMemory({
      repoRoot: root,
      input: { kind: "project", title: "after completion", body: "new canonical body" },
    });
    const second = inspectProjectMemoryCompletion(root);
    expect(second).toMatchObject({ ok: true, projectId: "example/memory-fence" });
    if (first.ok && second.ok)
      expect(second.canonicalCorpusDigest).not.toBe(first.canonicalCorpusDigest);
  });

  it("U-PMEMFENCE-007 U-PMEMFENCE-016: replay is deterministic, then denies corpus mismatch without marker writes", () => {
    const root = fixture().primary;
    const applied = complete(root);
    const initial = inspectProjectMemoryCompletion(root);
    expect(initial.ok).toBe(true);
    if (!initial.ok) throw new Error("completion fence fixture failed");
    const afterSeal = runtimeSnapshot(root);
    expect(replayProjectMemoryCompletion(root, applied.operationId)).toMatchObject({
      ok: true,
      status: "replayed",
      operationId: applied.operationId,
    });
    expect(runtimeSnapshot(root)).toBe(afterSeal);
    const linked = join(root, "..", "replay-linked");
    fixtures.push(linked);
    git(root, ["worktree", "add", "-q", "-b", "replay-linked", linked]);
    utimesSync(
      memoryPath(linked, "seed.md"),
      new Date("2020-01-01T00:00:00.000Z"),
      new Date("2020-01-01T00:00:00.000Z"),
    );
    expect(replayProjectMemoryCompletion(root, applied.operationId)).toMatchObject({
      ok: true,
      status: "replayed",
    });
    writeMemory({
      repoRoot: root,
      input: { kind: "project", title: "replay mutation", body: "changed after completion" },
    });
    expect(replayProjectMemoryCompletion(root, applied.operationId)).toMatchObject({
      ok: false,
      reason: "replay_corpus_mismatch",
      readAllowed: false,
      writeAllowed: false,
    });
    expect(runtimeSnapshot(root)).toBe(afterSeal);
    expect(inspectProjectMemoryCompletion(root)).toMatchObject({ ok: true });
  });

  it("U-PMEMFENCE-008 U-PMEMFENCE-009: detects legacy residue by identity/digest set, independent of mtime", () => {
    const { primary, linked } = fixture(true);
    if (!linked) throw new Error("fixture setup failed");
    complete(primary);
    mkdirSync(join(linked, ".ut-tdd", "memory"), { recursive: true });
    const residue = memoryPath(linked, "legacy.md");
    writeFileSync(residue, memoryText("legacy", "legacy body"));
    const old = new Date("2020-01-01T00:00:00.000Z");
    utimesSync(residue, old, old);
    const result = inspectProjectMemoryCompletion(primary);
    expect(result).toMatchObject({
      ok: false,
      reason: "legacy_residue",
      readAllowed: false,
      writeAllowed: false,
    });
    if (!result.ok) expect(result.residue?.join("\n")).toContain("legacy.md");
  });

  it("U-PMEMFENCE-010: apply quarantines invalid residue while preserving valid imports", () => {
    const { primary, linked } = fixture(true);
    if (!linked) throw new Error("fixture setup failed");
    complete(primary);
    const invalid = memoryPath(linked, "invalid.md");
    mkdirSync(join(linked, ".ut-tdd", "memory"), { recursive: true });
    writeFileSync(invalid, "not a memory document\n");
    const valid = memoryPath(linked, "valid.md");
    writeFileSync(valid, memoryText("valid", "valid body"));
    const applied = new ProjectMemoryMigration().apply(primary, { operationId: "invalid-residue" });
    expect(applied).toMatchObject({ ok: true, status: "completed" });
    if (!applied.ok) throw new Error(applied.reason);
    expect(applied.invalidMemory.some((path) => path.endsWith(".ut-tdd/memory/invalid.md"))).toBe(
      true,
    );
    expect(applied.imported.map((entry) => entry.memoryId)).toContain("memory:project:valid");
    const validImport = applied.imported.find((entry) => entry.memoryId === "memory:project:valid");
    expect(validImport).toBeDefined();
    expect(readFileSync(join(primary, validImport?.destinationPath ?? ""), "utf8")).toContain(
      "valid body",
    );
  });

  it("U-PMEMFENCE-011: apply re-inventories and truthfully imports a post-observation residue", () => {
    const { primary, linked } = fixture(true);
    if (!linked) throw new Error("fixture setup failed");
    expect(new ProjectMemoryMigration().dryRun(primary)).toMatchObject({ ok: true });
    const residue = memoryPath(linked, "toctou.md");
    writeFileSync(residue, memoryText("toctou", "arrived after observe"));
    const beforeApply = runtimeSnapshot(primary);
    const applied = new ProjectMemoryMigration().apply(primary, { operationId: "toctou-recovery" });
    expect(applied).toMatchObject({ ok: true, status: "completed" });
    expect(inspectProjectMemoryCompletion(primary)).toMatchObject({ ok: true });
    expect(runtimeSnapshot(primary)).not.toBe(beforeApply);
    if (applied.ok) {
      const prepared = readFileSync(applied.markersPath, "utf8");
      expect(prepared).toContain("toctou.md");
    }
  });

  it("U-PMEMFENCE-022: a durable per-import marker permits recovery after the first canonical write", () => {
    const { primary, linked } = fixture(true);
    if (!linked) throw new Error("fixture setup failed");
    const linkedTwo = join(dirname(linked), "linked-two");
    git(primary, ["worktree", "add", "-q", "-b", "linked-two", linkedTwo]);
    writeFileSync(memoryPath(linked, "same.md"), memoryText("first", "first body"));
    writeFileSync(memoryPath(linkedTwo, "same.md"), memoryText("second", "second body"));
    const interrupted = new ProjectMemoryMigration().apply(primary, {
      operationId: "partial-import",
      crashAfter: "first_import",
    });
    expect(interrupted).toMatchObject({ ok: false, reason: "transaction_interrupted" });
    if (interrupted.ok || !interrupted.markersPath)
      throw new Error("fault injection did not interrupt");
    const durable = readFileSync(interrupted.markersPath, "utf8");
    expect(durable).toContain('"kind":"imported"');
    const recovered = new ProjectMemoryMigration().recover(primary, "partial-import");
    expect(recovered).toMatchObject({ ok: true, status: "completed" });
    if (!recovered.ok) throw new Error(recovered.reason);
    expect(recovered.imported.map((entry) => entry.memoryId).sort()).toEqual([
      "memory:project:first",
      "memory:project:second",
    ]);
  });

  it("U-PMEMFENCE-022: recovery adopts an exact canonical write whose import marker was not durable", () => {
    const { primary, linked } = fixture(true);
    if (!linked) throw new Error("fixture setup failed");
    writeFileSync(memoryPath(linked, "marker-gap.md"), memoryText("marker-gap", "durable body"));
    const interrupted = new ProjectMemoryMigration().apply(primary, {
      operationId: "write-before-marker",
      crashAfter: "write_before_import_marker",
    });
    expect(interrupted).toMatchObject({ ok: false, reason: "transaction_interrupted" });
    if (interrupted.ok || !interrupted.markersPath)
      throw new Error("fault injection did not interrupt");
    expect(readFileSync(interrupted.markersPath, "utf8")).not.toContain('"kind":"imported"');

    const recovered = new ProjectMemoryMigration().recover(primary, "write-before-marker");
    expect(recovered).toMatchObject({ ok: true, status: "completed" });
    if (!recovered.ok) throw new Error(recovered.reason);
    expect(recovered.imported).toHaveLength(1);
    expect(recovered.imported[0]?.memoryId).toBe("memory:project:marker-gap");
  });

  it.each([
    ["changed size", (path: string) => writeFileSync(path, `${readFileSync(path, "utf8")}x`)],
    [
      "same-size digest drift",
      (path: string) =>
        writeFileSync(path, readFileSync(path, "utf8").replace("durable body", "durable bodx")),
    ],
    ["missing source", (_path: string, source: string) => rmSync(source)],
  ])("U-PMEMFENCE-022: %s cannot authorize reconstruction of a missing import marker", (_label, mutate) => {
    const { primary, linked } = fixture(true);
    if (!linked) throw new Error("fixture setup failed");
    const source = memoryPath(linked, "marker-gap-negative.md");
    const operationId = "write-before-marker-negative";
    writeFileSync(source, memoryText("marker-gap-negative", "durable body"));
    const interrupted = new ProjectMemoryMigration().apply(primary, {
      operationId,
      crashAfter: "write_before_import_marker",
    });
    expect(interrupted).toMatchObject({ ok: false, reason: "transaction_interrupted" });
    if (interrupted.ok || !interrupted.markersPath)
      throw new Error("fault injection did not interrupt");
    const markerBytes = readFileSync(interrupted.markersPath);
    const canonicalName = readdirSync(join(primary, ".ut-tdd", "memory")).find(
      (name) => name !== "seed.md",
    );
    if (!canonicalName) throw new Error("canonical write was not durable");
    mutate(join(primary, ".ut-tdd", "memory", canonicalName), source);

    expect(new ProjectMemoryMigration().recover(primary, operationId)).toMatchObject({
      ok: false,
      reason: "transaction_tampered",
    });
    expect(readFileSync(interrupted.markersPath)).toEqual(markerBytes);
  });

  it("U-PMEMFENCE-012: preserves typed project-root denial", () => {
    const root = fixture().primary;
    rmSync(join(root, "ut-tdd.project.json"));
    expect(inspectProjectMemoryCompletion(root)).toMatchObject({
      ok: false,
      reason: "project_identity_unavailable",
      readAllowed: false,
      writeAllowed: false,
    });
    expect(() => requireProjectMemoryCompletion(root)).toThrow(ProjectMemoryCompletionError);
  });

  it("U-PMEMFENCE-017: complete plus an incomplete operation is denied", () => {
    const root = fixture().primary;
    complete(root);
    expect(
      new ProjectMemoryMigration().apply(root, {
        operationId: "interrupted-child",
        crashAfter: "intent",
      }),
    ).toMatchObject({ ok: false, reason: "transaction_interrupted" });
    expect(inspectProjectMemoryCompletion(root)).toMatchObject({
      ok: false,
      reason: "migration_incomplete",
      operationId: "interrupted-child",
    });
  });

  it("U-PMEMFENCE-018: tampering an ancestor denies even with a complete tip", () => {
    const root = fixture().primary;
    const applied = complete(root);
    cloneOperation(applied.markersPath, "second-operation", "root");
    writeFileSync(applied.markersPath, `${readFileSync(applied.markersPath, "utf8")}tampered\n`);
    expect(inspectProjectMemoryCompletion(root)).toMatchObject({
      ok: false,
      reason: "transaction_tampered",
    });
  });

  it("U-PMEMFENCE-019: missing predecessor and multiple roots are ambiguous", () => {
    const root = fixture().primary;
    const applied = complete(root);
    cloneOperation(applied.markersPath, "unknown-predecessor", "missing-digest");
    expect(inspectProjectMemoryCompletion(root)).toMatchObject({
      ok: false,
      reason: "operation_chain_ambiguous",
    });
    rmSync(join(dirname(dirname(applied.markersPath)), "unknown-predecessor"), {
      recursive: true,
      force: true,
    });
    cloneOperation(applied.markersPath, "second-root", null);
    expect(inspectProjectMemoryCompletion(root)).toMatchObject({
      ok: false,
      reason: "operation_chain_ambiguous",
    });
  });

  it("U-PMEMFENCE-020: legacy null root chains to an explicit child tip", () => {
    const root = fixture().primary;
    const applied = complete(root);
    const lines = readFileSync(applied.markersPath, "utf8").trim().split("\n");
    const rootDigest = String(
      (JSON.parse(lines.at(-1) as string) as { recordDigest: string }).recordDigest,
    );
    const childDigest = cloneOperation(applied.markersPath, "second-operation", rootDigest);
    expect(childDigest).not.toBe(rootDigest);
    expect(inspectProjectMemoryCompletion(root)).toMatchObject({
      ok: true,
      operationId: "second-operation",
    });
    const childMarkers = readFileSync(
      join(dirname(dirname(applied.markersPath)), "second-operation", "markers.jsonl"),
      "utf8",
    );
    expect(childMarkers).toContain(`"previous_complete_digest":"${rootDigest}"`);
  });

  it("U-PMEMFENCE-021: stripped owner field is tampered before ambiguity evaluation", () => {
    const root = fixture().primary;
    const applied = complete(root);
    const lines = readFileSync(applied.markersPath, "utf8").trim().split("\n");
    const rootDigest = String(
      (JSON.parse(lines.at(-1) as string) as { recordDigest: string }).recordDigest,
    );
    cloneOperation(applied.markersPath, "second-operation", rootDigest);
    const childMarkersPath = join(
      dirname(dirname(applied.markersPath)),
      "second-operation",
      "markers.jsonl",
    );
    const childLines = readFileSync(childMarkersPath, "utf8").trim().split("\n");
    const owner = JSON.parse(childLines[0]) as { payload: Record<string, unknown> };
    delete owner.payload.previous_complete_digest;
    childLines[0] = JSON.stringify(owner);
    writeFileSync(childMarkersPath, `${childLines.join("\n")}\n`);
    expect(inspectProjectMemoryCompletion(root)).toMatchObject({
      ok: false,
      reason: "transaction_tampered",
    });
  });

  it("U-PMEMFENCE-021 precedence: tampered marker wins over incomplete operation", () => {
    const root = fixture().primary;
    const applied = complete(root);
    expect(
      new ProjectMemoryMigration().apply(root, {
        operationId: "incomplete-operation",
        crashAfter: "intent",
      }),
    ).toMatchObject({ ok: false, reason: "transaction_interrupted" });
    writeFileSync(applied.markersPath, `${readFileSync(applied.markersPath, "utf8")}tampered\n`);
    expect(inspectProjectMemoryCompletion(root)).toMatchObject({
      ok: false,
      reason: "transaction_tampered",
    });
  });

  it("U-PMEMFENCE-023: tamper wins even when the incomplete operation sorts first", () => {
    const root = fixture().primary;
    const applied = complete(root);
    expect(
      new ProjectMemoryMigration().apply(root, {
        operationId: "aaa-incomplete",
        crashAfter: "intent",
      }),
    ).toMatchObject({ ok: false, reason: "transaction_interrupted" });
    writeFileSync(applied.markersPath, `${readFileSync(applied.markersPath, "utf8")}tampered\n`);
    expect(inspectProjectMemoryCompletion(root)).toMatchObject({
      ok: false,
      reason: "transaction_tampered",
    });
    expect(
      new ProjectMemoryMigration().apply(root, {
        operationId: "zzz-writer-must-not-mask-tamper",
      }),
    ).toMatchObject({ ok: false, reason: "transaction_tampered" });
  });
});
