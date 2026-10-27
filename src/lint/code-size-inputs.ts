/**
 * Contract-shape stub for the #1310 Red tests (design-protection-diff-gate §10.3 step 1').
 * It returns fail-close values only.
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
  return { kind: "unreadable" };
}

export function checkCodeSize(_repoRoot: string): { messages: string[]; ok: boolean } {
  return { messages: [], ok: false };
}
