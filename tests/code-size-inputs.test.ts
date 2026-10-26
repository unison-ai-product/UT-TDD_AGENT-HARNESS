import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  checkCodeSize,
  loadCodeSizeMergeBaseMeasures,
  loadCodeSizeSources,
  loadPreviousCodeSizeBaseline,
  loadRenamedCodeFiles,
} from "../src/lint/code-size-inputs.ts";

const BASELINE = "docs/governance/code-size-baseline.json";

function git(root: string, ...args: string[]): string {
  return execFileSync("git", ["-C", root, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
}

function writeRepoFile(root: string, relativePath: string, text: string): void {
  const absolute = join(root, ...relativePath.split("/"));
  mkdirSync(dirname(absolute), { recursive: true });
  writeFileSync(absolute, text);
}

function commit(root: string, message: string): string {
  git(root, "add", "-A");
  git(root, "commit", "--quiet", "-m", message);
  return git(root, "rev-parse", "HEAD").trim();
}

function initRepo(files: Record<string, string>, exposeAsOriginMain = true): string {
  const root = mkdtempSync(join(tmpdir(), "ut-tdd-code-size-inputs-"));
  git(root, "init", "--quiet");
  git(root, "config", "user.email", "test@example.invalid");
  git(root, "config", "user.name", "UT-TDD test");
  for (const [relativePath, text] of Object.entries(files)) writeRepoFile(root, relativePath, text);
  const base = commit(root, "seed code-size inputs fixture");
  if (exposeAsOriginMain) git(root, "update-ref", "refs/remotes/origin/main", base);
  return root;
}

const lines = (count: number) => "const a = 1;\n".repeat(count);

function baselineEntry(path: string, lineCount: number | null, excess: number | null): string {
  return `${JSON.stringify({ [path]: { lines: lineCount, functionExcess: excess } }, null, 2)}\n`;
}

function removeRepo(root: string): void {
  // root is only the unique mkdtempSync fixture created by this file.
  rmSync(root, { recursive: true, force: true });
}

function hasMessage(result: { messages: string[] }, code: string): boolean {
  return result.messages.some((message) => message.includes(code));
}

describe("code size gate filesystem and git adapter candidate oracles", () => {
  it("imports adapter exports and returns the L6 result shapes without throwing", () => {
    const sources = loadCodeSizeSources("unused-test-root");
    const previous = loadPreviousCodeSizeBaseline("unused-test-root");
    const mergeBase = loadCodeSizeMergeBaseMeasures("unused-test-root", []);
    const renamed = loadRenamedCodeFiles("unused-test-root");
    const checked = checkCodeSize("unused-test-root");

    expect(Array.isArray(sources.sources)).toBe(true);
    expect(Array.isArray(sources.unreadable)).toBe(true);
    expect(["found", "absent", "unreadable"]).toContain(previous.kind);
    expect(["found", "unreadable"]).toContain(mergeBase.kind);
    expect(["found", "unreadable"]).toContain(renamed.kind);
    expect(typeof checked.ok).toBe("boolean");
    expect(Array.isArray(checked.messages)).toBe(true);
  });

  it.fails("CANDIDATE-U-CODESIZE-013(b): reports unreadable sources and fails closed instead of treating them as empty", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-code-size-unreadable-"));
    rmSync(root, { recursive: true, force: true });
    try {
      const loaded = loadCodeSizeSources(root);
      expect.soft(loaded.sources).toEqual([]);
      expect.soft(loaded.unreadable.length).toBeGreaterThan(0);
      const result = checkCodeSize(root);
      expect.soft(result.ok).toBe(false);
      expect.soft(hasMessage(result, "code-size-input-unreadable")).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it.fails("CANDIDATE-U-CODESIZE-015(a): loads a parseable previous baseline at origin/main", () => {
    const entryPath = "src/big.ts";
    const root = initRepo({
      [entryPath]: lines(900),
      [BASELINE]: baselineEntry(entryPath, 900, null),
    });
    try {
      expect(loadPreviousCodeSizeBaseline(root)).toEqual({
        kind: "found",
        baseline: { [entryPath]: { lines: 900, functionExcess: null } },
      });
    } finally {
      removeRepo(root);
    }
  });

  it.fails("CANDIDATE-U-CODESIZE-015(b): reports absent and skips the comparison when the merge-base has no baseline file", () => {
    const root = initRepo({ "src/small.ts": lines(3) });
    try {
      expect.soft(loadPreviousCodeSizeBaseline(root)).toEqual({ kind: "absent" });
      const result = checkCodeSize(root);
      expect.soft(result.ok).toBe(true);
      expect.soft(hasMessage(result, "checked=1 over=0 stale=0 baseline=0")).toBe(true);
    } finally {
      removeRepo(root);
    }
  });

  it.fails("CANDIDATE-U-CODESIZE-015(c): reports unreadable and fails closed when origin/main cannot resolve", () => {
    const root = initRepo(
      { "src/small.ts": lines(3), [BASELINE]: baselineEntry("src/small.ts", 900, null) },
      false,
    );
    try {
      expect.soft(loadPreviousCodeSizeBaseline(root)).toEqual({ kind: "unreadable" });
      const result = checkCodeSize(root);
      expect.soft(result.ok).toBe(false);
      expect.soft(hasMessage(result, "code-size-baseline-base-unreadable")).toBe(true);
    } finally {
      removeRepo(root);
    }
  });

  it.fails("CANDIDATE-U-CODESIZE-015(d): reports unreadable and fails closed for malformed baseline JSON", () => {
    const root = initRepo({ "src/small.ts": lines(3), [BASELINE]: "{" });
    try {
      expect.soft(loadPreviousCodeSizeBaseline(root)).toEqual({ kind: "unreadable" });
      const result = checkCodeSize(root);
      expect.soft(result.ok).toBe(false);
      expect.soft(hasMessage(result, "code-size-baseline-base-unreadable")).toBe(true);
    } finally {
      removeRepo(root);
    }
  });

  it.fails("CANDIDATE-U-CODESIZE-015(e): measures the merge-base content and rejects initial self-growth", () => {
    const path = "src/big.ts";
    const root = initRepo({ [path]: lines(900) });
    try {
      writeRepoFile(root, path, lines(950));
      writeRepoFile(root, BASELINE, baselineEntry(path, 950, null));
      commit(root, "grow the file and record the grown value");

      expect.soft(loadCodeSizeMergeBaseMeasures(root, [path])).toEqual({
        kind: "found",
        measures: { [path]: { lines: 900, functionExcess: null } },
      });
      const result = checkCodeSize(root);
      expect.soft(result.ok).toBe(false);
      expect.soft(hasMessage(result, "code-size-initial-baseline-grown")).toBe(true);
    } finally {
      removeRepo(root);
    }
  });

  it.fails("CANDIDATE-U-CODESIZE-015(f): recognizes a same-class nested rename and carries the row", () => {
    const oldPath = "src/big.ts";
    const newPath = "src/sub/big.ts";
    const root = initRepo({
      [oldPath]: lines(900),
      [BASELINE]: baselineEntry(oldPath, 900, null),
    });
    try {
      mkdirSync(dirname(join(root, newPath)), { recursive: true });
      git(root, "mv", oldPath, newPath);
      writeRepoFile(root, BASELINE, baselineEntry(newPath, 900, null));
      commit(root, "move the file without changing its class or size");

      expect
        .soft(loadRenamedCodeFiles(root))
        .toEqual({ kind: "found", renames: [{ from: oldPath, to: newPath }] });
      const result = checkCodeSize(root);
      expect.soft(result.ok).toBe(true);
      expect.soft(hasMessage(result, "checked=1 over=0 stale=0 baseline=1")).toBe(true);
    } finally {
      removeRepo(root);
    }
  });

  it.fails("CANDIDATE-U-CODESIZE-015(g): fails closed when git rename input is unreadable", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-code-size-no-git-"));
    try {
      expect.soft(loadRenamedCodeFiles(root)).toEqual({ kind: "unreadable" });
      const result = checkCodeSize(root);
      expect.soft(result.ok).toBe(false);
      expect.soft(hasMessage(result, "code-size-baseline-base-unreadable")).toBe(true);
    } finally {
      removeRepo(root);
    }
  });
});
