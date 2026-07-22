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

export type GitExecFile = (
  command: string,
  args: readonly string[],
  options: {
    cwd: string;
    encoding: "buffer";
    windowsHide: true;
    stdio: ["ignore", "pipe", "pipe"];
  },
) => Buffer;

/** commit:path を shell 展開なしで実 Git object へ解決する共有port。 */
export class TrustedGitBlobResolver {
  constructor(private readonly git: GitCommandPort) {}

  resolve(commit: string, sourcePath: string): TrustedGitBlob {
    const commitOid = this.call(["rev-parse", "--verify", `${commit}^{commit}`], "commit-not-found")
      .toString("ascii")
      .trim();
    if (!/^[0-9a-f]{40}$/.test(commitOid)) throw new Error("trusted-git-commit-oid-invalid");
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
  constructor(
    private readonly repoRoot: string,
    private readonly exec: GitExecFile = execFileSync,
  ) {}

  run(args: readonly string[]): Buffer {
    return this.exec("git", [...args], {
      cwd: this.repoRoot,
      encoding: "buffer",
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
  }
}

function parseTreeEntry(output: Buffer): { sourcePath: string; blobOid: string } {
  if (output.length === 0) throw new Error("trusted-git-source-not-found");
  if (output.at(-1) !== 0) throw new Error("trusted-git-source-record-invalid");
  const records = output.subarray(0, -1).toString("utf8").split("\0");
  if (records.length !== 1 || records[0] === "") throw new Error("trusted-git-source-not-found");
  const match = /^100(?:644|755) blob ([0-9a-f]{40})\t(.+)$/s.exec(records[0]);
  if (!match) throw new Error("trusted-git-source-not-blob");
  return { blobOid: match[1], sourcePath: match[2] };
}
