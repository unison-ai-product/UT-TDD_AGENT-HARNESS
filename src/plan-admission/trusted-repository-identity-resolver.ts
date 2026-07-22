import { execFileSync } from "node:child_process";

export interface RepositoryIdentityGitPort {
  run(args: readonly string[]): Buffer;
}

const REPOSITORY_IDENTITY =
  /^[A-Za-z0-9](?:[A-Za-z0-9_.-]{0,38})\/[A-Za-z0-9](?:[A-Za-z0-9_.-]{0,99})$/;

/** caller申告ではなく、実Git originからGitHub repository identityを解決する。 */
export class TrustedRepositoryIdentityResolver {
  constructor(private readonly git: RepositoryIdentityGitPort) {}

  resolve(): string {
    try {
      const output = this.git.run(["remote", "get-url", "origin"]);
      const remote = strictSingleLine(output);
      const identity = repositoryIdentityFromGitHubRemote(remote);
      if (!identity) throw new Error("unsupported-remote");
      return identity;
    } catch {
      throw new Error("trusted-repository-identity-invalid");
    }
  }

  assertClaim(claim: string): string {
    const trusted = this.resolve();
    assertTrustedRepositoryIdentity(claim, trusted);
    return trusted;
  }

  assertBindings(input: {
    readonly claimedRepositoryIdentity: string;
    readonly issueRepositoryIdentity: string;
  }): string {
    const trusted = this.resolve();
    try {
      assertTrustedRepositoryIdentity(input.claimedRepositoryIdentity, trusted);
      assertTrustedRepositoryIdentity(input.issueRepositoryIdentity, trusted);
    } catch {
      throw new Error("trusted-repository-identity-invalid");
    }
    return trusted;
  }
}

export class NodeRepositoryIdentityGitPort implements RepositoryIdentityGitPort {
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

function strictSingleLine(output: Buffer): string {
  const text = new TextDecoder("utf-8", { fatal: true }).decode(output);
  const value = text.endsWith("\r\n")
    ? text.slice(0, -2)
    : text.endsWith("\n")
      ? text.slice(0, -1)
      : text;
  if (!value || /[\r\n\0]/.test(value) || value !== value.trim()) throw new Error("invalid-output");
  return value;
}

function repositoryIdentityFromGitHubRemote(remote: string): string | null {
  const scp = /^git@github\.com:([^/:]+)\/([^/]+)$/.exec(remote);
  if (scp) return normalizedIdentity(scp[1], scp[2]);
  if (!remote.startsWith("https://") && !remote.startsWith("ssh://")) return null;
  if (/%|\/\.\.?\/|[?#]/.test(remote)) return null;
  try {
    const parsed = new URL(remote);
    const validHttps = parsed.protocol === "https:" && !parsed.username && !parsed.password;
    const validSsh = parsed.protocol === "ssh:" && parsed.username === "git" && !parsed.password;
    if ((!validHttps && !validSsh) || parsed.hostname !== "github.com" || parsed.port) return null;
    const match = /^\/([^/]+)\/([^/]+)$/.exec(parsed.pathname);
    return match ? normalizedIdentity(match[1], match[2]) : null;
  } catch {
    return null;
  }
}

function normalizedIdentity(owner: string, repositoryWithSuffix: string): string | null {
  const repository = repositoryWithSuffix.endsWith(".git")
    ? repositoryWithSuffix.slice(0, -4)
    : repositoryWithSuffix;
  const identity = `${owner}/${repository}`;
  return REPOSITORY_IDENTITY.test(identity) && identity.normalize("NFC") === identity
    ? identity
    : null;
}

export function assertTrustedRepositoryIdentity(value: string, trusted: string): void {
  if (!REPOSITORY_IDENTITY.test(value) || value.normalize("NFC") !== value || value !== trusted) {
    throw new Error("trusted-repository-identity-invalid");
  }
}
