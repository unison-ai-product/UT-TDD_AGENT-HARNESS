import {
  decodeUtf8,
  type GitCommandPort,
  GitDiffAdapterError,
  parseNameStatusEntries,
  requirePath,
  resolveCommit,
  splitNul,
} from "../github/git-diff.ts";
import type { AdmissionChangesPort, AdmissionComparison } from "./admission-check.ts";
import type { PlanBlob, PlanChange } from "./diff-fence.ts";

const PLAN_PATH = /^docs\/plans\/PLAN-[A-Za-z0-9-]+\.md$/;

export interface AdmissionGitDiff {
  baseCommit: string;
  headCommit: string;
  base: readonly PlanBlob[];
  head: readonly PlanBlob[];
  changes: readonly PlanChange[];
}

export function readAdmissionGitDiff(input: {
  baseRef: string;
  headRef: string;
  git: GitCommandPort;
}): AdmissionGitDiff {
  const baseCommit = resolveCommit(input.git, input.baseRef);
  const headCommit = resolveCommit(input.git, input.headRef);
  const fields = splitNul(
    input.git.run([
      "diff",
      "--name-status",
      "-z",
      "--find-renames",
      baseCommit,
      headCommit,
      "--",
      "docs/plans",
    ]),
  );
  const changes = parseNameStatus(fields);
  const basePaths = new Set<string>();
  const headPaths = new Set<string>();

  for (const change of changes) {
    if (change.kind === "added") headPaths.add(change.path);
    if (change.kind === "modified") {
      basePaths.add(change.path);
      headPaths.add(change.path);
    }
    if (change.kind === "deleted") basePaths.add(change.path);
    if (change.kind === "renamed") {
      basePaths.add(change.from);
      headPaths.add(change.path);
    }
  }

  return {
    baseCommit,
    headCommit,
    base: readBlobs(input.git, baseCommit, basePaths),
    head: readBlobs(input.git, headCommit, headPaths),
    changes,
  };
}

export class GitAdmissionChangesAdapter implements AdmissionChangesPort {
  private readonly git: GitCommandPort;

  constructor(git: GitCommandPort) {
    this.git = git;
  }

  compare(baseRef: string, headRef: string): AdmissionComparison {
    const comparison = readAdmissionGitDiff({ baseRef, headRef, git: this.git });
    return { ...comparison, baseComplete: true, headComplete: true };
  }
}

export function readUtf8BlobAtRef(git: GitCommandPort, ref: string, path: string): string {
  const canonicalPath = requirePath(path);
  const commit = resolveCommit(git, ref);
  try {
    return decodeUtf8(git.run(["show", `${commit}:${canonicalPath}`]));
  } catch (error) {
    if (error instanceof GitDiffAdapterError && error.code === "git-command-failed") {
      throw new GitDiffAdapterError(
        "git-blob-missing",
        `required git blob is missing: ${canonicalPath}`,
        canonicalPath,
      );
    }
    if (error instanceof TypeError) {
      throw new GitDiffAdapterError(
        "git-blob-invalid-utf8",
        `git blob is not valid UTF-8: ${canonicalPath}`,
        canonicalPath,
      );
    }
    throw error;
  }
}

function parseNameStatus(fields: readonly string[]): PlanChange[] {
  return parseNameStatusEntries(fields).flatMap((change): PlanChange[] => {
    if (change.kind !== "renamed") return PLAN_PATH.test(change.path) ? [change] : [];
    const fromIsPlan = PLAN_PATH.test(change.from);
    const pathIsPlan = PLAN_PATH.test(change.path);
    if (fromIsPlan && pathIsPlan) return [change];
    if (fromIsPlan) return [{ kind: "deleted", path: change.from }];
    if (pathIsPlan) return [{ kind: "added", path: change.path }];
    return [];
  });
}

function readBlobs(git: GitCommandPort, commit: string, paths: ReadonlySet<string>): PlanBlob[] {
  return [...paths].sort().map((path) => {
    let bytes: Uint8Array;
    try {
      bytes = git.run(["show", `${commit}:${path}`]);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      throw new GitDiffAdapterError(
        "git-blob-missing",
        `required git blob is missing: ${path} (${detail})`,
        path,
      );
    }
    try {
      return { path, content: decodeUtf8(bytes) };
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      throw new GitDiffAdapterError(
        "git-blob-invalid-utf8",
        `git blob is not valid UTF-8: ${path} (${detail})`,
        path,
      );
    }
  });
}
