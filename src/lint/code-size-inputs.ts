/**
 * Contract-shape stub for the #1310 Red tests.
 * Filesystem/git loading and check composition belong to the Green PR.
 */

import type { CodeRename, CodeSizeBaseline, CodeSizeSource } from "./code-size.ts";

export function loadCodeSizeSources(_repoRoot: string): {
  sources: CodeSizeSource[];
  unreadable: string[];
} {
  return { sources: [], unreadable: [] };
}

export function loadPreviousCodeSizeBaseline(
  _repoRoot: string,
): { kind: "found"; baseline: CodeSizeBaseline } | { kind: "absent" } | { kind: "unreadable" } {
  return { kind: "unreadable" };
}

export function loadCodeSizeMergeBaseMeasures(
  _repoRoot: string,
  _paths: readonly string[],
): { kind: "found"; measures: CodeSizeBaseline } | { kind: "unreadable" } {
  return { kind: "unreadable" };
}

export function loadRenamedCodeFiles(
  _repoRoot: string,
): { kind: "found"; renames: CodeRename[] } | { kind: "unreadable" } {
  return { kind: "found", renames: [] };
}

export function checkCodeSize(_repoRoot: string): { messages: string[]; ok: boolean } {
  return { messages: ["checked=0 over=0 stale=0 baseline=0"], ok: true };
}
