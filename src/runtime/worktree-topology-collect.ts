/**
 * worktree-topology-collect — `worktree-topology.ts` analyzer への facts 収集 (I/O 側)。
 *
 * git 呼び出しを薄く行い、個別 worktree の異常 (path 消失・pointer 破損等) は throw せず
 * 観測値 (`dirExists=false` 等) として記録して続行する。1 本の異常で全体の収集を落とさない。
 */

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, isAbsolute, join, resolve } from "node:path";
import type { WorktreeAdminEntry, WorktreeFact } from "./worktree-topology";

function normalizePath(value: string): string {
  return value.replace(/\\/g, "/").replace(/\/+$/, "");
}

function gitOutput(cwd: string, args: readonly string[]): string | null {
  try {
    return execFileSync("git", ["-C", cwd, ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return null;
  }
}

function gitSucceeds(cwd: string, args: readonly string[]): boolean {
  try {
    execFileSync("git", ["-C", cwd, ...args], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

interface PorcelainEntry {
  path: string;
  branch?: string;
  detached: boolean;
}

function flushEntry(entries: PorcelainEntry[], current: Partial<PorcelainEntry> | null): void {
  if (current?.path) {
    entries.push({
      path: current.path,
      branch: current.branch,
      detached: current.detached ?? false,
    });
  }
}

function parsePorcelain(text: string): PorcelainEntry[] {
  const entries: PorcelainEntry[] = [];
  let current: Partial<PorcelainEntry> | null = null;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.startsWith("worktree ")) {
      flushEntry(entries, current);
      current = { path: normalizePath(line.slice("worktree ".length)), detached: false };
    } else if (line.startsWith("branch ") && current) {
      current.branch = line.slice("branch ".length).replace(/^refs\/heads\//, "");
    } else if (line === "detached" && current) {
      current.detached = true;
    } else if (line === "" && current) {
      flushEntry(entries, current);
      current = null;
    }
  }
  flushEntry(entries, current);
  return entries;
}

function readFirstLine(path: string): string | null {
  try {
    const content = readFileSync(path, "utf8");
    return content.split(/\r?\n/)[0]?.trim() ?? null;
  } catch {
    return null;
  }
}

function isDirectory(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

function resolveRelative(basePath: string, value: string): string {
  return isAbsolute(value) ? value : resolve(basePath, value);
}

export function collectWorktreeFacts(repoRoot: string): {
  facts: WorktreeFact[];
  adminEntries: WorktreeAdminEntry[];
} {
  const porcelainText = gitOutput(repoRoot, ["worktree", "list", "--porcelain"]) ?? "";
  const entries = parsePorcelain(porcelainText);
  const registeredPaths = new Set(entries.map((entry) => entry.path));

  const commonDirRaw = gitOutput(repoRoot, ["rev-parse", "--git-common-dir"])?.trim();
  const commonDir = commonDirRaw
    ? normalizePath(resolveRelative(repoRoot, commonDirRaw))
    : undefined;

  const facts: WorktreeFact[] = entries.map((entry, index) => {
    try {
      const dirExists = existsSync(entry.path);
      const gitPath = join(entry.path, ".git");
      const isMain = index === 0 && dirExists && isDirectory(gitPath);
      const branch = entry.detached ? undefined : entry.branch;

      let gitdirPointer: string | undefined;
      let gitdirPointerExists = false;
      let adminBackPointer: string | undefined;

      if (!isMain) {
        const rawPointerLine = dirExists ? readFirstLine(gitPath) : null;
        const pointerValue = rawPointerLine?.startsWith("gitdir:")
          ? rawPointerLine.slice("gitdir:".length).trim()
          : undefined;
        if (pointerValue) {
          const resolvedPointer = normalizePath(resolveRelative(entry.path, pointerValue));
          gitdirPointer = resolvedPointer;
          gitdirPointerExists = existsSync(resolvedPointer);
          if (gitdirPointerExists) {
            const adminId = basename(resolvedPointer);
            const adminGitdirFile = commonDir
              ? join(commonDir, "worktrees", adminId, "gitdir")
              : undefined;
            const backPointer = adminGitdirFile ? readFirstLine(adminGitdirFile) : null;
            if (backPointer) adminBackPointer = normalizePath(backPointer);
          }
        }
      }

      let dirty = false;
      if (dirExists) {
        const status = gitOutput(entry.path, ["status", "--porcelain"]);
        dirty = status != null && status.trim().length > 0;
      }

      let mergedIntoMain = false;
      if (dirExists && branch) {
        mergedIntoMain = gitSucceeds(repoRoot, [
          "merge-base",
          "--is-ancestor",
          branch,
          "origin/main",
        ]);
      }

      return {
        path: entry.path,
        isMain,
        dirExists,
        gitdirPointer,
        gitdirPointerExists,
        adminBackPointer,
        branch,
        dirty,
        mergedIntoMain,
      };
    } catch {
      return {
        path: entry.path,
        isMain: index === 0,
        dirExists: false,
        gitdirPointerExists: false,
        branch: entry.detached ? undefined : entry.branch,
        dirty: false,
        mergedIntoMain: false,
      };
    }
  });

  const adminEntries: WorktreeAdminEntry[] = [];
  if (commonDir) {
    try {
      const worktreesDir = join(commonDir, "worktrees");
      const ids = existsSync(worktreesDir) ? readdirSync(worktreesDir) : [];
      for (const id of ids) {
        try {
          const backPointer = readFirstLine(join(worktreesDir, id, "gitdir"));
          const worktreePath = backPointer
            ? normalizePath(backPointer).replace(/\/\.git$/, "")
            : undefined;
          adminEntries.push({
            id,
            registered: worktreePath != null && registeredPaths.has(worktreePath),
          });
        } catch {
          adminEntries.push({ id, registered: false });
        }
      }
    } catch {
      // worktrees admin dir unreadable — no adminEntries observed, findings stay empty for this axis.
    }
  }

  return { facts, adminEntries };
}
