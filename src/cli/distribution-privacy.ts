/**
 * Pack pre-publication privacy scan for `distribution sync-pack` / `package` (issue #1391,
 * docs/design/harness/L6-function-design/privacy-scan.md §5 / §11). The denylist is mandatory
 * here; its contents never reach the output, which carries only the §8 finding values.
 * `distribution.ts` only calls into this module; the wiring and the masking live here.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { type PrivacyScanResult, privacyScanMessages } from "../lint/privacy-scan.ts";
import { PRIVACY_DENYLIST_RELATIVE_PATH, scanPackPrivacy } from "../lint/privacy-scan-inputs.ts";
import {
  type AuthoringProjectionResult,
  buildPackSyncPlan,
  type CleanDistributionPlan,
  cleanDistributionSourcePath,
  type PackSyncPlan,
} from "../setup/index.ts";

const TEAM_SOURCE = ".ut-tdd/teams/example-review-team.yaml";
const DENYLIST_HINT = `~/${PRIVACY_DENYLIST_RELATIVE_PATH.join("/")}`;
const decoder = new TextDecoder("utf-8");

export class DistributionPrivacyScanError extends Error {
  readonly privacyScan: PrivacyScanResult;

  constructor(privacyScan: PrivacyScanResult) {
    super(
      `distribution package source preflight failed: ${privacyScanTextLines(privacyScan).join("; ")}`,
    );
    this.privacyScan = privacyScan;
  }
}

/** The Pack artifacts of `exportPlan`, read like the secret scan (the team yaml from its blob). */
export interface PackPrivacySource {
  repoRoot: string;
  sourceRoot: string;
  sourcePaths: readonly string[];
  exportPlan: CleanDistributionPlan;
  homeDirectory: string;
  readTeam: (sourceRoot: string) => AuthoringProjectionResult;
}

export function scanPack(source: PackPrivacySource): PrivacyScanResult {
  const artifacts: { path: string; text: string }[] = [];
  try {
    for (const path of source.exportPlan.artifactPaths) {
      const sourcePath = cleanDistributionSourcePath(path, source.sourcePaths);
      const team = sourcePath === TEAM_SOURCE ? source.readTeam(source.sourceRoot) : null;
      if (team !== null && !team.ok) throw new Error("team projection unavailable");
      const bytes =
        team?.ok === true
          ? team.bytes
          : readFileSync(join(source.sourceRoot, ...sourcePath.split("/")));
      artifacts.push({ path, text: decoder.decode(bytes) });
    }
  } catch {
    artifacts.length = 0; // an unreadable artifact must not pass as "no hits"
  }
  return scanPackPrivacy({
    artifacts,
    repoRoot: source.repoRoot,
    homeDirectory: source.homeDirectory,
  });
}

/** `distribution package`: stops before anything is written when the scan rejects. */
export function assertPackPrivacy(source: PackPrivacySource): void {
  const result = scanPack(source);
  if (!result.ok) throw new DistributionPrivacyScanError(result);
}

export function privacyScanJson(result: PrivacyScanResult) {
  return { ok: result.ok, checked: result.summary.checked, findings: result.findings };
}

/** The `privacyScan` field of a failed `package` JSON output (empty for any other error). */
export function privacyScanErrorJson(error: unknown) {
  return error instanceof DistributionPrivacyScanError
    ? { privacyScan: privacyScanJson(error.privacyScan) }
    : {};
}

export function privacyScanTextLines(result: PrivacyScanResult): string[] {
  const lines = privacyScanMessages(result);
  const denylistBlocked = result.findings.some(
    (finding) =>
      finding.kind === "privacy-denylist-unavailable" ||
      finding.kind === "privacy-denylist-invalid",
  );
  if (denylistBlocked)
    lines.push(`denylist: ${DENYLIST_HINT} に 1 行 1 個の正規表現を置く (# で始まる行は無視)`);
  return lines;
}

/** The text-mode lines of a rejected scan (none when it passed). */
export function privacyScanFailureLines(result: PrivacyScanResult): string[] {
  return result.ok ? [] : privacyScanTextLines(result);
}

const maskedPath = (path: string) =>
  `path-sha256:${createHash("sha256").update(path, "utf8").digest("hex")}`;

/**
 * L6 §8 / §12: when the scan rejects (a hit, an unreadable artifact, or a missing one), no artifact
 * path is reported: every one is masked. An unreadable artifact drops the findings, so the hit
 * paths cannot be derived and all paths are treated alike. The reported plan and sync plan are
 * rebuilt from the masked list before any command string is made, so no escaped form can leak.
 */
export function reportedPack(
  result: PrivacyScanResult,
  exportPlan: CleanDistributionPlan,
  sourcePaths: readonly string[],
  sync: PackSyncPlan,
): { plan: CleanDistributionPlan; sync: PackSyncPlan } {
  if (result.ok) return { plan: exportPlan, sync };
  const plan = { ...exportPlan, artifactPaths: exportPlan.artifactPaths.map(maskedPath) };
  return {
    plan,
    sync: buildPackSyncPlan({
      exportPlan: plan,
      sourcePaths: [...sourcePaths],
      stagingDir: sync.stagingDir,
      branch: sync.branch,
    }),
  };
}

/**
 * Defense in depth for values built from raw paths: on rejection, replaces every raw artifact path
 * wherever it occurs in `value`. It cannot see escaped forms, so reported path lists and commands
 * must come from `reportedPack`.
 */
function redactRejectedArtifactPaths<T>(
  value: T,
  result: PrivacyScanResult,
  artifactPaths: readonly string[],
): T {
  if (result.ok) return value;
  const paths = [...artifactPaths].sort((a, b) => b.length - a.length);
  const walk = (item: unknown): unknown => {
    if (typeof item === "string")
      return paths.reduce(
        (text, raw) => (text.includes(raw) ? text.replaceAll(raw, maskedPath(raw)) : text),
        item,
      );
    if (Array.isArray(item)) return item.map(walk);
    if (item !== null && typeof item === "object")
      return Object.fromEntries(Object.entries(item).map(([key, entry]) => [key, walk(entry)]));
    return item;
  };
  return walk(value) as T;
}

/**
 * The sync-pack output and evidence: `raw` redacted on rejection, plus the scanner's findings
 * (which already follow L6 §8, a hit path being masked by the scanner itself).
 */
export function reportSyncPack<T extends object>(
  raw: T,
  result: PrivacyScanResult,
  artifactPaths: readonly string[],
): T & { privacyScan: ReturnType<typeof privacyScanJson> } {
  return {
    ...redactRejectedArtifactPaths(raw, result, artifactPaths),
    privacyScan: privacyScanJson(result),
  };
}
