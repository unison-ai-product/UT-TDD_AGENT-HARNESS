/**
 * Contract-shape stub for the #1391 Red tests (design-protection-diff-gate §10.3 step 1').
 * It returns fail-close values only; git, artifact, and denylist-file reading belong to
 * the Green PR (docs/design/harness/L6-function-design/privacy-scan.md §10).
 */

import type {
  PreviousPrivacyBaseline,
  PrivacyDenylistState,
  PrivacyScanResult,
  PrivacyUnit,
} from "./privacy-scan.ts";

export function loadTreePrivacyUnits(
  _repoRoot: string,
  _rev: string,
): { kind: "found"; units: PrivacyUnit[]; skipped: number } | { kind: "unreadable" } {
  return { kind: "unreadable" };
}

export function loadDiffPrivacyUnits(
  _repoRoot: string,
  _range: { base: string; head: string },
): { kind: "found"; units: PrivacyUnit[] } | { kind: "unreadable" } {
  return { kind: "unreadable" };
}

export function loadPreviousPrivacyBaseline(_repoRoot: string): PreviousPrivacyBaseline {
  return { kind: "unreadable" };
}

export function readPrivacyDenylistFile(_input: {
  homeDirectory: string;
  repoRoot: string;
}): PrivacyDenylistState {
  return { kind: "unreadable" };
}

export function checkPrivacyScan(_options: {
  repoRoot: string;
  mode: "tree" | "diff";
  rev?: string;
  range?: { base: string; head: string };
}): { messages: string[]; ok: boolean } {
  return { messages: [], ok: false };
}

export function scanPackPrivacy(_input: {
  artifacts: readonly { path: string; text: string }[];
  repoRoot: string;
  homeDirectory: string;
}): PrivacyScanResult {
  return {
    ok: false,
    findings: [],
    summary: {
      mode: "pack",
      checked: 0,
      skipped: 0,
      email: 0,
      denylist: null,
      stale: 0,
      baselined: 0,
      baseline: 0,
    },
  };
}
