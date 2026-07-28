import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

export type TargetRefSource =
  | "event_default_base"
  | "remote_default"
  | "local_default"
  | "origin_main"
  | "local_main";

export interface TargetRefCandidate {
  ref: string;
  source: TargetRefSource;
  exists: boolean;
  sha?: string;
}

export interface MergedPlanTargetEvidence {
  decision: "canonical_target" | "no_verified_target";
  targetRef: string | null;
  targetSha: string | null;
  mergeBaseSha: string | null;
  subjectHeadSha: string | null;
  immediateBaseRef: string | null;
  immediateBaseSha: string | null;
  source: TargetRefSource | null;
}

export interface ArtifactTargetDecision {
  path: string;
  decision: "landed_on_target" | "absent_from_target";
}

export function selectCanonicalMergedTarget(input: {
  candidates: readonly TargetRefCandidate[];
  subjectHeadSha: string | null;
  immediateBaseRef?: string | null;
  immediateBaseSha?: string | null;
  mergeBaseSha?: string | null;
}): MergedPlanTargetEvidence {
  const selected = input.candidates.find((candidate) => candidate.exists && candidate.sha);
  return {
    decision: selected ? "canonical_target" : "no_verified_target",
    targetRef: selected?.ref ?? null,
    targetSha: selected?.sha ?? null,
    mergeBaseSha: selected ? (input.mergeBaseSha ?? null) : null,
    subjectHeadSha: input.subjectHeadSha,
    immediateBaseRef: input.immediateBaseRef ?? null,
    immediateBaseSha: input.immediateBaseSha ?? null,
    source: selected?.source ?? null,
  };
}

export function classifyTargetArtifacts(
  declaredPaths: readonly string[],
  targetPaths: ReadonlySet<string>,
): ArtifactTargetDecision[] {
  return declaredPaths.map((rawPath) => {
    const path = rawPath.replaceAll("\\", "/");
    return {
      path,
      decision: targetPaths.has(path) ? "landed_on_target" : "absent_from_target",
    };
  });
}

export function resolveMergedPlanTargetEvidence(repoRoot: string): MergedPlanTargetEvidence {
  const event = readGithubEvent();
  const subjectHeadSha = gitTextOrNull(repoRoot, ["rev-parse", "HEAD"]);
  const symbolicDefault = gitTextOrNull(repoRoot, [
    "symbolic-ref",
    "--short",
    "refs/remotes/origin/HEAD",
  ]);
  const knownDefaultBranch =
    event.defaultBranch ?? symbolicDefault?.replace(/^origin\//, "") ?? null;
  // default branch identity が分かる場合は、そのrefが欠けてもmainへ横滑りしない。
  // 別branchをlanded targetとして採るより no_verified_target でfail-closeする。
  const rawCandidates: Array<{ ref: string; source: TargetRefSource }> = knownDefaultBranch
    ? [
        ...(event.immediateBaseRef === knownDefaultBranch && event.immediateBaseSha
          ? [{ ref: event.immediateBaseSha, source: "event_default_base" as const }]
          : []),
        { ref: `origin/${knownDefaultBranch}`, source: "remote_default" },
        { ref: knownDefaultBranch, source: "local_default" },
      ]
    : [
        { ref: "origin/main", source: "origin_main" },
        { ref: "main", source: "local_main" },
      ];
  const seen = new Set<string>();
  const candidates = rawCandidates
    .filter((candidate) => !seen.has(candidate.ref) && seen.add(candidate.ref))
    .map((candidate) => {
      const sha = gitTextOrNull(repoRoot, ["rev-parse", "--verify", `${candidate.ref}^{commit}`]);
      return { ...candidate, exists: Boolean(sha), ...(sha ? { sha } : {}) };
    });
  const selected = candidates.find((candidate) => candidate.exists && candidate.sha);
  const mergeBaseSha =
    selected?.sha && subjectHeadSha
      ? gitTextOrNull(repoRoot, ["merge-base", selected.sha, subjectHeadSha])
      : null;
  return selectCanonicalMergedTarget({
    candidates,
    subjectHeadSha,
    immediateBaseRef: event.immediateBaseRef,
    immediateBaseSha: event.immediateBaseSha,
    mergeBaseSha,
  });
}

function readGithubEvent(): {
  defaultBranch: string | null;
  immediateBaseRef: string | null;
  immediateBaseSha: string | null;
} {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath || !existsSync(eventPath)) {
    return { defaultBranch: null, immediateBaseRef: null, immediateBaseSha: null };
  }
  try {
    const event = JSON.parse(readFileSync(eventPath, "utf8")) as {
      repository?: { default_branch?: unknown };
      pull_request?: { base?: { ref?: unknown; sha?: unknown } };
    };
    const defaultBranch = event.repository?.default_branch;
    const baseRef = event.pull_request?.base?.ref;
    const baseSha = event.pull_request?.base?.sha;
    return {
      defaultBranch: typeof defaultBranch === "string" ? defaultBranch : null,
      immediateBaseRef: typeof baseRef === "string" ? baseRef : null,
      immediateBaseSha:
        typeof baseSha === "string" && /^[0-9a-f]{40}$/i.test(baseSha) ? baseSha : null,
    };
  } catch {
    return { defaultBranch: null, immediateBaseRef: null, immediateBaseSha: null };
  }
}

function gitTextOrNull(repoRoot: string, args: readonly string[]): string | null {
  try {
    return (
      execFileSync("git", ["-C", repoRoot, ...args], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim() || null
    );
  } catch {
    return null;
  }
}
