import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { lstatSync, readdirSync, readFileSync, readlinkSync } from "node:fs";
import { join } from "node:path";

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
        entries.push(`f:${relativeEntry}:${digest(readFileSync(path))}`);
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

function digest(...chunks: Array<string | Buffer>): string {
  const hash = createHash("sha256");
  for (const chunk of chunks) hash.update(chunk);
  return hash.digest("hex");
}

export function captureGitWorkspaceFingerprint(repoRoot: string): GitWorkspaceFingerprint {
  const untrackedPaths = git(repoRoot, ["ls-files", "--others", "--exclude-standard", "-z"])
    .toString("utf8")
    .split("\0")
    .filter(Boolean)
    .sort();
  const untrackedChunks: Array<string | Buffer> = [];
  for (const path of untrackedPaths) {
    untrackedChunks.push(path, "\0", readFileSync(join(repoRoot, path)), "\0");
  }
  const inventory = captureWorkspaceInventory(repoRoot);
  return {
    head: git(repoRoot, ["rev-parse", "HEAD"]).toString("utf8").trim(),
    statusDigest: digest(git(repoRoot, ["status", "--porcelain=v1", "-z", "--untracked-files=all"])),
    worktreeDigest: digest(git(repoRoot, ["diff", "--binary", "HEAD"])),
    indexDigest: digest(git(repoRoot, ["diff", "--cached", "--binary", "HEAD"])),
    untrackedDigest: digest(...untrackedChunks),
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
