/**
 * Pack pre-publication privacy scan for `distribution sync-pack` / `package` (issue #1391,
 * docs/design/harness/L6-function-design/privacy-scan.md §5 / §11). The denylist is mandatory
 * here; its contents never reach the output, which carries only the §8 finding values.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { type PrivacyScanResult, privacyScanMessages } from "../lint/privacy-scan.ts";
import { PRIVACY_DENYLIST_RELATIVE_PATH, scanPackPrivacy } from "../lint/privacy-scan-inputs.ts";
import { cleanDistributionSourcePath } from "../setup/index.ts";

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

export function runDistributionPrivacyScan(input: {
  repoRoot: string;
  sourceRoot: string;
  sourcePaths: readonly string[];
  artifactPaths: readonly string[];
  homeDirectory: string;
  readTeamProjection: () => Uint8Array | null;
}): PrivacyScanResult {
  const artifacts: { path: string; text: string }[] = [];
  try {
    for (const path of input.artifactPaths) {
      const sourcePath = cleanDistributionSourcePath(path, input.sourcePaths);
      const bytes =
        sourcePath === TEAM_SOURCE
          ? input.readTeamProjection()
          : readFileSync(join(input.sourceRoot, ...sourcePath.split("/")));
      if (bytes === null) throw new Error("team projection unavailable");
      artifacts.push({ path, text: decoder.decode(bytes) });
    }
  } catch {
    artifacts.length = 0; // an unreadable artifact must not pass as "no hits"
  }
  return scanPackPrivacy({
    artifacts,
    repoRoot: input.repoRoot,
    homeDirectory: input.homeDirectory,
  });
}

export function privacyScanJson(result: PrivacyScanResult) {
  return { ok: result.ok, checked: result.summary.checked, findings: result.findings };
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
