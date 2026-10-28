/**
 * Contract-shape stub for the #1391 Red tests (design-protection-diff-gate §10.3 step 1').
 * It returns fail-close values only; no matching, judging, or I/O lives here.
 * The privacy-scan behavior and runtime wiring belong to the Green PR
 * (docs/design/harness/L6-function-design/privacy-scan.md §10).
 */

export type PrivacyScanMode = "tree" | "diff" | "pack";

export interface PrivacyUnit {
  source: "tree" | "pack" | "diff" | "commit-meta";
  path: string | null;
  commit: string | null;
  field: "content" | "path" | "author" | "committer" | "message";
  lines: readonly { line: number; text: string }[];
}

export type PrivacyDenylist =
  | { kind: "empty" }
  | { kind: "provided"; entries: readonly RegExp[] }
  | { kind: "invalid"; entryLines: readonly number[] };

export type PrivacyDenylistState =
  | PrivacyDenylist
  | { kind: "absent" }
  | { kind: "unreadable" }
  | { kind: "in-repo" };

export type PrivacyBaseline = readonly string[];

export type PreviousPrivacyBaseline =
  | { kind: "found"; baseline: PrivacyBaseline }
  | { kind: "absent" }
  | { kind: "unreadable" };

export interface PrivacyScanInput {
  mode: PrivacyScanMode;
  units: readonly PrivacyUnit[];
  skipped: number;
  denylist: PrivacyDenylistState | null;
  baseline: PrivacyBaseline | null;
  baselineUnreadable: boolean;
  previousBaseline: PreviousPrivacyBaseline | null;
}

export interface PrivacyScanFinding {
  location: string;
  line: number;
  kind: string;
  reason: string | null;
}

export interface PrivacyScanSummary {
  mode: PrivacyScanMode;
  checked: number;
  skipped: number;
  email: number;
  denylist: number | null;
  stale: number;
  baselined: number;
  baseline: number;
}

export interface PrivacyScanResult {
  ok: boolean;
  findings: PrivacyScanFinding[];
  summary: PrivacyScanSummary;
}

export function findEmailHitLines(_unit: PrivacyUnit): number[] {
  return [];
}

export function parsePrivacyDenylist(_text: string): PrivacyDenylist {
  return { kind: "invalid", entryLines: [] };
}

export function parsePrivacyBaseline(_sourceText: string): PrivacyBaseline | null {
  return null;
}

export function analyzePrivacyScan(input: PrivacyScanInput): PrivacyScanResult {
  return {
    ok: false,
    findings: [],
    summary: {
      mode: input.mode,
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

export function privacyScanMessages(_result: PrivacyScanResult): string[] {
  return [];
}
