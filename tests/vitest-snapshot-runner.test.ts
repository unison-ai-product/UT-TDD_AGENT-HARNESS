import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  createSnapshot,
  copyReferenceRuntimeInputs,
  finishSnapshotCleanup,
  removeSnapshot,
  resolveSnapshotSource,
} from "../scripts/run-vitest-snapshot";
import { removeTestTree } from "./support/temp-tree";

describe("vitest snapshot runner", () => {
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

  it("U-TESTHYGIENE-024: treats a Pack nested below an unrelated Git root as non-Git", () => {
    const parent = mkdtempSync(join(tmpdir(), "ut-tdd-parent-git-"));
    const pack = join(parent, "pack");
    const snapshot = `${parent}-snapshot`;
    try {
      expect(spawnSync("git", ["init"], { cwd: parent }).status).toBe(0);
      mkdirSync(pack);
      writeFileSync(join(pack, "package.json"), "{}\n");
      mkdirSync(join(pack, "node_modules"));
      writeFileSync(join(pack, "node_modules", "leak.txt"), "source-only\n");

      expect(resolveSnapshotSource(pack)).toEqual({ kind: "copy" });
      createSnapshot(pack, snapshot);
      expect(existsSync(join(snapshot, "package.json"))).toBe(true);
      expect(existsSync(join(snapshot, "node_modules"))).toBe(false);
    } finally {
      removeTestTree(parent);
      removeTestTree(snapshot);
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
