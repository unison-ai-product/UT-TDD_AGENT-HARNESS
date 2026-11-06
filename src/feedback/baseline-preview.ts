import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, realpathSync, rmdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

export interface BaselinePreviewFinding {
  path: string;
  kind: string;
  reason: string;
}

export interface BaselinePreviewGateResult {
  name: string;
  ok: boolean;
  findings: BaselinePreviewFinding[];
}

export interface BaselinePreview {
  mainSha: string;
  headSha: string;
  treeSha: string;
  commitSha: string;
  gates: BaselinePreviewGateResult[];
}

export interface PreviewGate {
  name: string;
  check: (repoRoot: string) => {
    ok: boolean;
    findings: readonly BaselinePreviewFinding[];
  };
}

export interface BaselinePreviewResult {
  preview: BaselinePreview | null;
  reason: string | null;
}

function git(repoRoot: string, args: readonly string[]): string {
  return execFileSync("git", ["-C", repoRoot, ...args], {
    encoding: "utf8",
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 64 * 1024 * 1024,
  });
}

function gitFailureReason(error: unknown): string {
  const message = error instanceof Error ? error.message.split("\n")[0] : String(error);
  return message || "git_command_failed";
}

function errorStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null || !("status" in error)) return undefined;
  const status = (error as { status?: unknown }).status;
  return typeof status === "number" ? status : undefined;
}

function requireMergeTreeSupport(repoRoot: string): void {
  const version = git(repoRoot, ["--version"]).trim();
  const match = /^git version (\d+)\.(\d+)\.(\d+)/.exec(version);
  if (!match) throw new Error("git_version_unrecognized");
  const [, majorText, minorText] = match;
  const major = Number(majorText);
  const minor = Number(minorText);
  if (major < 2 || (major === 2 && minor < 38)) {
    throw new Error("merge_tree_write_tree_unsupported");
  }
}

function ownedPreviewPath(): string {
  const devRoot = realpathSync.native("C:\\dev");
  const path = resolve(mkdtempSync(join(devRoot, "ut-tdd-rvmg-preview-")));
  if (dirname(path).toLowerCase() !== devRoot.toLowerCase()) {
    rmdirSync(path);
    throw new Error("preview_path_outside_dev_root");
  }
  return path;
}

function isRegisteredWorktree(repoRoot: string, previewPath: string): boolean {
  const expected = resolve(previewPath).toLowerCase();
  return git(repoRoot, ["worktree", "list", "--porcelain"])
    .split(/\r?\n/)
    .filter((line) => line.startsWith("worktree "))
    .some((line) => resolve(line.slice("worktree ".length)).toLowerCase() === expected);
}

function removePreviewWorktree(repoRoot: string, previewPath: string, registered: boolean): void {
  if (registered) git(repoRoot, ["worktree", "remove", "--force", previewPath]);
  if (existsSync(previewPath)) rmdirSync(previewPath);
}

function normalizeFindings(value: unknown): BaselinePreviewFinding[] {
  if (!Array.isArray(value)) throw new Error("baseline_gate_findings_invalid");
  return value.map((finding) => {
    if (
      typeof finding !== "object" ||
      finding === null ||
      typeof (finding as BaselinePreviewFinding).path !== "string" ||
      typeof (finding as BaselinePreviewFinding).kind !== "string" ||
      typeof (finding as BaselinePreviewFinding).reason !== "string"
    ) {
      throw new Error("baseline_gate_finding_invalid");
    }
    const { path, kind, reason } = finding as BaselinePreviewFinding;
    return { path, kind, reason };
  });
}

/** Recompute only the conflicting gates against a temporary merge tree. */
export function recomputeBaselinePreview(input: {
  repoRoot: string;
  mainSha: string;
  headSha: string;
  gates: readonly PreviewGate[];
}): BaselinePreviewResult {
  let previewPath: string | null = null;
  let registered = false;
  const calculate = (): BaselinePreviewResult => {
    try {
      requireMergeTreeSupport(input.repoRoot);
      let treeSha: string;
      try {
        const output = git(input.repoRoot, [
          "merge-tree",
          "--write-tree",
          input.mainSha,
          input.headSha,
        ]);
        treeSha = output.split(/\r?\n/)[0]?.trim() ?? "";
      } catch (error) {
        // merge-tree exits 1 for a content conflict. Path-level conflict reporting
        // remains owned by the caller, so no conflict is treated as a clean tree.
        if (errorStatus(error) === 1) {
          return { preview: null, reason: "merge_tree_content_conflict" };
        }
        throw error;
      }
      if (!/^[0-9a-f]{40,64}$/i.test(treeSha)) {
        throw new Error("merge_tree_output_invalid");
      }

      const commitSha = git(input.repoRoot, [
        "commit-tree",
        treeSha,
        "-p",
        input.mainSha,
        "-p",
        input.headSha,
        "-m",
        "UT-TDD baseline preview",
      ]).trim();
      if (!/^[0-9a-f]{40,64}$/i.test(commitSha)) {
        throw new Error("preview_commit_invalid");
      }

      previewPath = ownedPreviewPath();
      git(input.repoRoot, ["worktree", "add", "-q", "--detach", previewPath, commitSha]);
      registered = true;
      const gateResults: BaselinePreviewGateResult[] = [];
      for (const gate of input.gates) {
        const checked = gate.check(previewPath);
        const findings = normalizeFindings(checked.findings);
        const ok = checked.ok === true && findings.length === 0;
        gateResults.push({ name: gate.name, ok, findings });
        if (!ok) {
          const findingKind = findings[0]?.kind ?? "gate-check-failed";
          return {
            preview: null,
            reason: `baseline_conflict_recomputed:${gate.name}=${findingKind}`,
          };
        }
      }
      return {
        preview: {
          mainSha: input.mainSha,
          headSha: input.headSha,
          treeSha,
          commitSha,
          gates: gateResults,
        },
        reason: null,
      };
    } catch (error) {
      return { preview: null, reason: `baseline_conflict_unknown:${gitFailureReason(error)}` };
    }
  };

  const result = calculate();
  if (previewPath !== null) {
    try {
      // If worktree add failed after registration, detect that exact owned path
      // before cleanup; never remove an unrelated directory recursively.
      if (!registered && existsSync(previewPath)) {
        registered = isRegisteredWorktree(input.repoRoot, previewPath);
      }
      removePreviewWorktree(input.repoRoot, previewPath, registered);
    } catch (error) {
      return {
        preview: null,
        reason: `baseline_conflict_unknown:preview_cleanup_failed:${gitFailureReason(error)}`,
      };
    }
  }
  return result;
}
