import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, lstatSync, realpathSync } from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { loadProjectIdentityFromHead } from "../kernel/project-identity-loader.ts";
import { memoryStorageRoot } from "../memory/index.ts";

export type ProjectMemoryRootDenyReason =
  | "git_topology_unavailable"
  | "project_identity_unavailable"
  | "project_identity_drift"
  | "canonical_root_invalid"
  | "authored_memory_root_escape"
  | "runtime_root_escape";

export type ProjectMemoryRootResult =
  | {
      readonly ok: true;
      readonly projectId: string;
      readonly projectNamespace: string;
      readonly currentWorktreeRoot: string;
      readonly canonicalProjectRoot: string;
      readonly gitCommonDir: string;
      readonly authoredMemoryRoot: string;
      readonly runtimeBusRoot: string;
    }
  | { readonly ok: false; readonly reason: ProjectMemoryRootDenyReason };

interface ProjectMemoryRootPorts {
  readonly gitTopLevel: (repoRoot: string) => string;
  readonly gitCommonDir: (repoRoot: string) => string;
  readonly realpath: (path: string) => string;
  readonly isDirectory: (path: string) => boolean;
  readonly isSafeDescendant: (root: string, candidate: string) => boolean;
  readonly projectIdentity: (repoRoot: string) => string | null;
}

function contained(root: string, candidate: string): boolean {
  const rel = relative(resolve(root), resolve(candidate));
  return (
    rel === "" ||
    (rel !== ".." &&
      !rel.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`) &&
      !isAbsolute(rel))
  );
}

function projectNamespace(projectId: string): string {
  return createHash("sha256").update(`ut-tdd-project\0${projectId}`, "utf8").digest("hex");
}

/** Resolve one authored Memory corpus and one transient bus for every linked worktree. */
export function resolveProjectMemoryRootWithPorts(
  repoRoot: string,
  ports: ProjectMemoryRootPorts,
): ProjectMemoryRootResult {
  let currentWorktreeRoot: string;
  let gitCommonDir: string;
  try {
    currentWorktreeRoot = ports.realpath(ports.gitTopLevel(repoRoot));
    gitCommonDir = ports.realpath(ports.gitCommonDir(repoRoot));
  } catch {
    return { ok: false, reason: "git_topology_unavailable" };
  }
  if (!ports.isDirectory(currentWorktreeRoot) || !ports.isDirectory(gitCommonDir)) {
    return { ok: false, reason: "git_topology_unavailable" };
  }

  // A non-bare repository's common dir is <primary worktree>/.git. Linked worktrees
  // therefore converge on the same primary root without using their absolute path as identity.
  if (basename(gitCommonDir).toLowerCase() !== ".git") {
    return { ok: false, reason: "canonical_root_invalid" };
  }
  const canonicalProjectRoot = ports.realpath(dirname(gitCommonDir));
  if (!ports.isDirectory(canonicalProjectRoot)) {
    return { ok: false, reason: "canonical_root_invalid" };
  }

  const currentProjectId = ports.projectIdentity(currentWorktreeRoot);
  const canonicalProjectId = ports.projectIdentity(canonicalProjectRoot);
  if (!currentProjectId || !canonicalProjectId) {
    return { ok: false, reason: "project_identity_unavailable" };
  }
  if (currentProjectId !== canonicalProjectId) {
    return { ok: false, reason: "project_identity_drift" };
  }

  const namespace = projectNamespace(currentProjectId);
  const authoredMemoryRoot = memoryStorageRoot(canonicalProjectRoot);
  if (!ports.isSafeDescendant(canonicalProjectRoot, authoredMemoryRoot)) {
    return { ok: false, reason: "authored_memory_root_escape" };
  }
  const runtimeBase = join(gitCommonDir, "ut-tdd-runtime", "projects");
  const runtimeBusRoot = join(runtimeBase, namespace);
  if (
    !contained(gitCommonDir, runtimeBase) ||
    !contained(runtimeBase, runtimeBusRoot) ||
    !ports.isSafeDescendant(gitCommonDir, runtimeBusRoot)
  ) {
    return { ok: false, reason: "runtime_root_escape" };
  }
  return {
    ok: true,
    projectId: currentProjectId,
    projectNamespace: namespace,
    currentWorktreeRoot,
    canonicalProjectRoot,
    gitCommonDir,
    authoredMemoryRoot,
    runtimeBusRoot,
  };
}

function gitPath(repoRoot: string, args: string[]): string {
  return execFileSync("git", ["-C", repoRoot, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
}

function isSafeDirectoryChain(root: string, candidate: string): boolean {
  const requestedRoot = resolve(root);
  const requestedCandidate = resolve(candidate);
  if (!contained(requestedRoot, requestedCandidate)) return false;
  const resolvedRoot = realpathSync(root);
  const rel = relative(requestedRoot, requestedCandidate);
  let cursor = resolvedRoot;
  for (const part of rel.split(sep).filter(Boolean)) {
    cursor = join(cursor, part);
    if (!existsSync(cursor)) continue;
    const stat = lstatSync(cursor);
    if (!stat.isDirectory() || stat.isSymbolicLink()) return false;
    if (!contained(resolvedRoot, realpathSync(cursor))) return false;
  }
  return true;
}

export function resolveProjectMemoryRoot(repoRoot: string): ProjectMemoryRootResult {
  return resolveProjectMemoryRootWithPorts(repoRoot, {
    gitTopLevel: (root) => gitPath(root, ["rev-parse", "--show-toplevel"]),
    gitCommonDir: (root) =>
      gitPath(root, ["rev-parse", "--path-format=absolute", "--git-common-dir"]),
    realpath: (path) => realpathSync(path),
    isDirectory: (path) => {
      try {
        const stat = lstatSync(path);
        return stat.isDirectory() && !stat.isSymbolicLink();
      } catch {
        return false;
      }
    },
    isSafeDescendant: isSafeDirectoryChain,
    projectIdentity: (root) => {
      const result = loadProjectIdentityFromHead({ repoRoot: root });
      return result.ok ? result.value.repositoryIdentity : null;
    },
  });
}

export function requireProjectMemoryRoot(
  repoRoot: string,
): Extract<ProjectMemoryRootResult, { ok: true }> {
  const result = resolveProjectMemoryRoot(repoRoot);
  if (!result.ok) throw new Error(`project_memory_root_${result.reason}`);
  return result;
}
