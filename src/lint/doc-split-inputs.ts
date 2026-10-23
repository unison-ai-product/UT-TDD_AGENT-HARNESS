/**
 * Contract-shape stub for the #1307 Red tests.
 * Filesystem/git loading and check composition belong to #1309 Green.
 */

import type { DocRename, DocSplitBaseline, DocSplitSource } from "./doc-split.js";

export function loadDocSplitSources(_repoRoot: string): {
  sources: DocSplitSource[];
  unreadable: string[];
} {
  return { sources: [], unreadable: [] };
}

export function loadPreviousDocSplitBaseline(
  _repoRoot: string,
): { kind: "found"; baseline: DocSplitBaseline } | { kind: "absent" } | { kind: "unreadable" } {
  return { kind: "unreadable" };
}

export function loadMergeBaseMeasures(
  _repoRoot: string,
  _paths: readonly string[],
): { kind: "found"; measures: DocSplitBaseline } | { kind: "unreadable" } {
  return { kind: "unreadable" };
}

export function loadRenamedDocs(
  _repoRoot: string,
): { kind: "found"; renames: DocRename[] } | { kind: "unreadable" } {
  return { kind: "found", renames: [] };
}

export function checkDocSplit(_repoRoot: string): { messages: string[]; ok: boolean } {
  return { messages: ["checked=0 over=0 stale=0 baseline=0"], ok: true };
}
