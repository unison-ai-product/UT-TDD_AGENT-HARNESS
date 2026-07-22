import { execFileSync } from "node:child_process";

export interface GitCommandPort {
  run(args: readonly string[]): Buffer;
}

export interface TrustedGitBlob {
  readonly commitOid: string;
  readonly sourcePath: string;
  readonly blobOid: string;
  readonly bytes: Buffer;
}

/** commit:path を shell 展開なしで実 Git object へ解決する。 */
export class TrustedGitBlobResolver {
  constructor(private readonly git: GitCommandPort) {}

  resolve(commit: string, sourcePath: string): TrustedGitBlob {
    const commitOid = this.call(["rev-parse", "--verify", `${commit}^{commit}`], "commit-not-found")
      .toString("ascii")
      .trim();
    const entry = parseTreeEntry(
      this.call(["ls-tree", "-z", commitOid, "--", sourcePath], "source-not-found"),
    );
    if (entry.sourcePath !== sourcePath) throw new Error("trusted-git-source-path-mismatch");
    const bytes = this.call(["cat-file", "blob", entry.blobOid], "blob-unreadable");
    return { commitOid, sourcePath: entry.sourcePath, blobOid: entry.blobOid, bytes };
  }

  private call(args: readonly string[], failure: string): Buffer {
    try {
      return this.git.run(args);
    } catch {
      throw new Error(`trusted-git-${failure}`);
    }
  }
}

export class NodeGitCommandPort implements GitCommandPort {
  constructor(private readonly repoRoot: string) {}

  run(args: readonly string[]): Buffer {
    return execFileSync("git", [...args], {
      cwd: this.repoRoot,
      encoding: "buffer",
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
  }
}

function parseTreeEntry(output: Buffer): { sourcePath: string; blobOid: string } {
  const records = output
    .subarray(0, output.at(-1) === 0 ? -1 : undefined)
    .toString("utf8")
    .split("\0");
  if (records.length !== 1 || records[0] === "") throw new Error("trusted-git-source-not-found");
  const match = /^(\d+) blob ([0-9a-f]+)\t(.+)$/s.exec(records[0]);
  if (!match) throw new Error("trusted-git-source-not-blob");
  return { blobOid: match[2], sourcePath: match[3] };
}
