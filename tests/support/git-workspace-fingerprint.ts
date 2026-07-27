import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { lstatSync, readdirSync, readlinkSync } from "node:fs";
import { join } from "node:path";
import {
  hashFileChunkedWithDiagnostics,
  updateHashWithFile,
  wrapFileReadError,
} from "./chunked-hash";

export interface GitWorkspaceFingerprint {
  head: string;
  statusDigest: string;
  worktreeDigest: string;
  indexDigest: string;
  untrackedDigest: string;
  inventoryDigest: string;
  inventoryEntries: string[];
}

export function captureWorkspaceInventory(root: string): { digest: string; entries: string[] } {
  const entries: string[] = [];
  const visit = (directory: string, relativePath: string): void => {
    for (const entry of readdirSync(directory).sort()) {
      if (!relativePath && (entry === ".git" || entry === "node_modules")) continue;
      const path = join(directory, entry);
      const relativeEntry = relativePath ? `${relativePath}/${entry}` : entry;
      const stat = lstatSync(path);
      if (stat.isSymbolicLink()) {
        entries.push(`l:${relativeEntry}:${readlinkSync(path)}`);
      } else if (stat.isDirectory()) {
        entries.push(`d:${relativeEntry}`);
        visit(path, relativeEntry);
      } else if (stat.isFile()) {
        entries.push(
          `f:${relativeEntry}:${hashFileChunkedWithDiagnostics("workspace fence", path, relativeEntry, stat.size)}`,
        );
      } else {
        throw new Error(`workspace fence unsupported entry: ${relativeEntry}`);
      }
    }
  };
  visit(root, "");
  return { digest: digest(...entries), entries };
}

function git(repoRoot: string, args: string[]): Buffer {
  const result = spawnSync("git", args, { cwd: repoRoot, encoding: "buffer" });
  if (result.status !== 0 || result.error) {
    throw new Error(
      `git workspace fence failed: git ${args.join(" ")}: ${result.error?.message ?? result.stderr.toString("utf8")}`,
    );
  }
  return result.stdout;
}

function isGitRepository(repoRoot: string): boolean {
  return (
    spawnSync("git", ["rev-parse", "--is-inside-work-tree"], { cwd: repoRoot, stdio: "ignore" })
      .status === 0
  );
}

function digest(...chunks: Array<string | Buffer>): string {
  const hash = createHash("sha256");
  for (const chunk of chunks) hash.update(chunk);
  return hash.digest("hex");
}

export function captureGitWorkspaceFingerprint(repoRoot: string): GitWorkspaceFingerprint {
  const inventory = captureWorkspaceInventory(repoRoot);
  if (!isGitRepository(repoRoot)) {
    return {
      head: "non-git",
      statusDigest: "non-git",
      worktreeDigest: "non-git",
      indexDigest: "non-git",
      untrackedDigest: "non-git",
      inventoryDigest: inventory.digest,
      inventoryEntries: inventory.entries,
    };
  }
  const untrackedPaths = git(repoRoot, ["ls-files", "--others", "--exclude-standard", "-z"])
    .toString("utf8")
    .split("\0")
    .filter(Boolean)
    .sort();
  // untracked ファイル内容は readFileSync 丸読みでなく streaming で hash へ流し込む
  // (2GiB 超ファイル対応、issue #118)。digest(...chunks) と同じ update 順序を維持するため
  // 単一の Hash インスタンスへ逐次 update する (array へ全文字列/Buffer を蓄積しない)。
  const untrackedHash = createHash("sha256");
  for (const path of untrackedPaths) {
    const absolutePath = join(repoRoot, path);
    const stat = lstatSync(absolutePath);
    if (stat.isSymbolicLink()) {
      untrackedHash.update(path).update("\0").update(readlinkSync(absolutePath)).update("\0");
    } else if (stat.isFile()) {
      untrackedHash.update(path).update("\0");
      try {
        updateHashWithFile(untrackedHash, absolutePath);
      } catch (cause) {
        throw wrapFileReadError("workspace fence", path, stat.size, cause);
      }
      untrackedHash.update("\0");
    } else if (stat.isDirectory()) {
      untrackedHash.update(path).update("\0").update("directory").update("\0");
    } else {
      throw new Error(`workspace fence unsupported untracked entry: ${path}`);
    }
  }
  return {
    head: git(repoRoot, ["rev-parse", "HEAD"]).toString("utf8").trim(),
    statusDigest: digest(
      git(repoRoot, ["status", "--porcelain=v1", "-z", "--untracked-files=all"]),
    ),
    worktreeDigest: digest(git(repoRoot, ["diff", "--binary", "HEAD"])),
    indexDigest: digest(git(repoRoot, ["diff", "--cached", "--binary", "HEAD"])),
    untrackedDigest: untrackedHash.digest("hex"),
    inventoryDigest: inventory.digest,
    inventoryEntries: inventory.entries,
  };
}

export function assertGitWorkspaceUnchanged(
  before: GitWorkspaceFingerprint,
  after: GitWorkspaceFingerprint,
): void {
  if (JSON.stringify(before) !== JSON.stringify(after)) {
    const beforeSet = new Set(before.inventoryEntries);
    const afterSet = new Set(after.inventoryEntries);
    const added = after.inventoryEntries.filter((entry) => !beforeSet.has(entry)).slice(0, 10);
    const removed = before.inventoryEntries.filter((entry) => !afterSet.has(entry)).slice(0, 10);
    throw new Error(
      `test workspace fence violation: added=${added.join(",")} removed=${removed.join(",")}`,
    );
  }
}
