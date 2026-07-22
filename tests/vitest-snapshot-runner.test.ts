import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  assertBatchVitestArgs,
  assertSnapshotContentMatch,
  assertSnapshotFingerprint,
  copyReferenceRuntimeInputs,
  createSnapshot,
  finishSnapshotCleanup,
  removeSnapshot,
  resolveBunBinary,
  resolveSnapshotSource,
  sealReference,
  snapshotChildProcessOptions,
  snapshotContentFingerprint,
  unsealReference,
} from "../scripts/run-vitest-snapshot";
import { removeTestTree } from "./support/temp-tree";

describe("snapshot child-process UX", () => {
  it("U-TESTHYGIENE-048: non-interactive local CI children never open Windows consoles", () => {
    expect(snapshotChildProcessOptions("C:/repo")).toMatchObject({ windowsHide: true });
  });
});

describe("vitest snapshot runner", () => {
  it("U-TESTHYGIENE-047: resolves the Bun executable rather than inheriting a Vitest worker Node binary", () => {
    expect(resolveBunBinary({ which: () => "/runtime/bun" })).toBe("/runtime/bun");
  });

  it("U-TESTHYGIENE-045: rejects watch arguments because an execution snapshot cannot observe live edits", () => {
    expect(() => assertBatchVitestArgs(["--watch"])).toThrow("batch-only");
    expect(() => assertBatchVitestArgs(["-w"])).toThrow("batch-only");
    expect(() => assertBatchVitestArgs(["--watch=false"])).toThrow("batch-only");
    expect(() => assertBatchVitestArgs(["tests/example.test.ts", "--reporter=dot"])).not.toThrow();
  });

  it("U-TESTHYGIENE-046: does not advertise a live-source watch script", () => {
    const manifest = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8")) as {
      scripts?: Record<string, string>;
    };
    expect(manifest.scripts?.["test:watch"]).toBeUndefined();
  });

  it("U-TESTHYGIENE-021: copies a non-Git Pack without sharing node_modules", () => {
    const source = mkdtempSync(join(tmpdir(), "ut-tdd-pack-source-"));
    const snapshot = `${source}-snapshot`;
    try {
      writeFileSync(join(source, "package.json"), "{}\n");
      mkdirSync(join(source, "node_modules"));
      writeFileSync(join(source, "node_modules", "leak.txt"), "source-only\n");
      createSnapshot(source, snapshot);
      expect(existsSync(join(snapshot, "package.json"))).toBe(true);
      expect(existsSync(join(snapshot, "node_modules"))).toBe(false);
    } finally {
      removeTestTree(source);
      removeTestTree(snapshot);
    }
  });

  it("U-TESTHYGIENE-032: treats a Pack nested below an unrelated Git root as non-Git", () => {
    const parent = mkdtempSync(join(tmpdir(), "ut-tdd-parent-git-"));
    const pack = join(parent, "pack");
    const snapshot = `${parent}-snapshot`;
    try {
      expect(spawnSync("git", ["init"], { cwd: parent }).status).toBe(0);
      mkdirSync(pack);
      writeFileSync(join(pack, "package.json"), "{}\n");
      mkdirSync(join(pack, "node_modules"));
      writeFileSync(join(pack, "node_modules", "leak.txt"), "source-only\n");
      mkdirSync(join(pack, "nested", "node_modules"), { recursive: true });
      writeFileSync(join(pack, "nested", "node_modules", "leak.txt"), "nested-source-only\n");
      mkdirSync(join(pack, ".ut-tdd", "memory"), { recursive: true });
      writeFileSync(join(pack, ".ut-tdd", "memory", "leak.md"), "source-runtime\n");

      expect(resolveSnapshotSource(pack)).toEqual({ kind: "copy" });
      createSnapshot(pack, snapshot);
      expect(existsSync(join(snapshot, "package.json"))).toBe(true);
      expect(existsSync(join(snapshot, "node_modules"))).toBe(false);
      expect(existsSync(join(snapshot, "nested", "node_modules"))).toBe(false);
      expect(existsSync(join(snapshot, ".ut-tdd"))).toBe(false);
    } finally {
      removeTestTree(parent);
      removeTestTree(snapshot);
    }
  });

  it("U-TESTHYGIENE-034: derives a non-Git reference from the captured execution", () => {
    const source = mkdtempSync(join(tmpdir(), "ut-tdd-copy-source-"));
    const execution = `${source}-execution`;
    const reference = `${source}-reference`;
    try {
      writeFileSync(join(source, "package.json"), '{"version":1}\n');
      createSnapshot(source, execution);
      writeFileSync(join(source, "package.json"), '{"version":2}\n');
      createSnapshot(execution, reference);

      expect(snapshotContentFingerprint(execution)).toBe(snapshotContentFingerprint(reference));

      expect(readFileSync(join(execution, "package.json"), "utf8")).toBe(
        readFileSync(join(reference, "package.json"), "utf8"),
      );
      expect(readFileSync(join(reference, "package.json"), "utf8")).toContain('"version":1');
    } finally {
      removeTestTree(source);
      removeTestTree(execution);
      removeTestTree(reference);
    }
  });

  it("U-TESTHYGIENE-040: fails closed when a non-Git reference diverges from execution capture", () => {
    const execution = mkdtempSync(join(tmpdir(), "ut-tdd-copy-execution-"));
    const reference = `${execution}-reference`;
    try {
      writeFileSync(join(execution, "package.json"), '{"version":1}\n');
      createSnapshot(execution, reference);
      writeFileSync(join(reference, "package.json"), '{"version":2}\n');
      expect(() => assertSnapshotContentMatch(execution, reference)).toThrow(
        "snapshot content mismatch",
      );
    } finally {
      removeTestTree(execution);
      removeTestTree(reference);
    }
  });

  it("U-TESTHYGIENE-042: fails closed when a sealed reference changes after its fingerprint is captured", () => {
    const reference = mkdtempSync(join(tmpdir(), "ut-tdd-reference-fingerprint-"));
    try {
      const file = join(reference, "package.json");
      writeFileSync(file, '{"version":1}\n');
      sealReference(reference);
      const fingerprint = snapshotContentFingerprint(reference);
      unsealReference(reference);
      writeFileSync(file, '{"version":2}\n');
      expect(() => assertSnapshotFingerprint(reference, fingerprint)).toThrow(
        "snapshot reference fingerprint mismatch",
      );
    } finally {
      removeTestTree(reference);
    }
  });

  it("U-TESTHYGIENE-039: uses one captured Git revision for execution and reference", () => {
    const source = mkdtempSync(join(tmpdir(), "ut-tdd-git-source-"));
    const execution = `${source}-execution`;
    const reference = `${source}-reference`;
    try {
      expect(spawnSync("git", ["init"], { cwd: source }).status).toBe(0);
      writeFileSync(join(source, "package.json"), '{"version":1}\n');
      expect(spawnSync("git", ["add", "package.json"], { cwd: source }).status).toBe(0);
      expect(
        spawnSync(
          "git",
          [
            "-c",
            "user.name=test",
            "-c",
            "user.email=test@example.invalid",
            "commit",
            "-m",
            "initial",
          ],
          { cwd: source },
        ).status,
      ).toBe(0);
      const captured = resolveSnapshotSource(source);
      expect(captured.kind).toBe("git");
      createSnapshot(source, execution, captured);
      writeFileSync(join(source, "package.json"), '{"version":2}\n');
      expect(spawnSync("git", ["add", "package.json"], { cwd: source }).status).toBe(0);
      expect(
        spawnSync(
          "git",
          ["-c", "user.name=test", "-c", "user.email=test@example.invalid", "commit", "-m", "next"],
          { cwd: source },
        ).status,
      ).toBe(0);
      createSnapshot(source, reference, captured);
      expect(readFileSync(join(execution, "package.json"), "utf8").trim()).toBe('{"version":1}');
      expect(readFileSync(join(reference, "package.json"), "utf8").trim()).toBe('{"version":1}');
    } finally {
      removeTestTree(source);
      removeTestTree(execution);
      removeTestTree(reference);
    }
  });

  it("U-TESTHYGIENE-036: seals the reference for the whole test interval and unseals cleanup", () => {
    const reference = mkdtempSync(join(tmpdir(), "ut-tdd-sealed-reference-"));
    const outside = mkdtempSync(join(tmpdir(), "ut-tdd-sealed-outside-"));
    const file = join(reference, "source.txt");
    const nested = join(reference, "nested");
    const outsideFile = join(outside, "outside.txt");
    try {
      writeFileSync(file, "immutable\n");
      mkdirSync(nested);
      writeFileSync(outsideFile, "outside\n");
      if (process.platform !== "win32") symlinkSync(outsideFile, join(reference, "outside-link"));
      sealReference(reference);
      if (process.platform === "win32") {
        expect(() => writeFileSync(file, "mutated\n")).toThrow();
        expect(() => writeFileSync(join(reference, "new.txt"), "created\n")).toThrow();
        expect(() => writeFileSync(join(nested, "new.txt"), "created\n")).toThrow();
      } else {
        expect(statSync(file).mode & 0o222).toBe(0);
        expect(statSync(outsideFile).mode & 0o222).not.toBe(0);
      }
      unsealReference(reference);
      writeFileSync(file, "cleanup-enabled\n");
    } finally {
      unsealReference(reference);
      removeTestTree(reference);
      removeTestTree(outside);
    }
  });

  it("U-TESTHYGIENE-027: copies only deterministic runtime inputs into the reference", () => {
    const execution = mkdtempSync(join(tmpdir(), "ut-tdd-execution-"));
    const reference = mkdtempSync(join(tmpdir(), "ut-tdd-reference-"));
    try {
      mkdirSync(join(execution, ".ut-tdd", "logs"), { recursive: true });
      mkdirSync(join(execution, ".ut-tdd", "memory"), { recursive: true });
      writeFileSync(join(execution, ".ut-tdd", "harness.db"), "db");
      writeFileSync(join(execution, ".ut-tdd", "logs", "feedback-lifecycle.jsonl"), "{}\n");
      writeFileSync(join(execution, ".ut-tdd", "memory", "private.md"), "must-not-copy\n");

      copyReferenceRuntimeInputs(execution, reference);

      expect(existsSync(join(reference, ".ut-tdd", "harness.db"))).toBe(true);
      expect(existsSync(join(reference, ".ut-tdd", "logs", "feedback-lifecycle.jsonl"))).toBe(true);
      expect(existsSync(join(reference, ".ut-tdd", "memory", "private.md"))).toBe(false);
    } finally {
      removeTestTree(execution);
      removeTestTree(reference);
    }
  });

  it("U-TESTHYGIENE-022: propagates final snapshot cleanup failure", () => {
    const failure = new Error("EBUSY");
    expect(() =>
      removeSnapshot("snapshot", () => {
        throw failure;
      }),
    ).toThrow("vitest snapshot cleanup failed");
  });

  it("U-TESTHYGIENE-023: runs every cleanup and aggregates primary and cleanup failures", () => {
    const called: string[] = [];
    expect(() =>
      finishSnapshotCleanup(new Error("test failed"), [
        () => {
          called.push("snapshot");
          throw new Error("snapshot cleanup failed");
        },
        () => {
          called.push("cache");
          throw new Error("cache cleanup failed");
        },
      ]),
    ).toThrow("vitest execution and cleanup failed");
    expect(called).toEqual(["snapshot", "cache"]);
  });
});
