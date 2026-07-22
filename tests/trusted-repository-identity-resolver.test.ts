import { describe, expect, it } from "vitest";
import {
  type RepositoryIdentityGitPort,
  TrustedRepositoryIdentityResolver,
} from "../src/plan-admission/trusted-repository-identity-resolver.js";

class StubGit implements RepositoryIdentityGitPort {
  constructor(private readonly remote: string | Error) {}

  run(args: readonly string[]): Buffer {
    expect(args).toEqual(["remote", "get-url", "origin"]);
    if (this.remote instanceof Error) throw this.remote;
    return Buffer.from(`${this.remote}\n`, "utf8");
  }
}

describe("TrustedRepositoryIdentityResolver", () => {
  it.each([
    "https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS.git",
    "ssh://git@github.com/unison-ai-product/UT-TDD_AGENT-HARNESS.git",
    "git@github.com:unison-ai-product/UT-TDD_AGENT-HARNESS.git",
  ])("origin remoteを正規repository identityへ解決する: %s", (remote) => {
    const resolver = new TrustedRepositoryIdentityResolver(new StubGit(remote));

    expect(resolver.resolve()).toBe("unison-ai-product/UT-TDD_AGENT-HARNESS");
    expect(() => resolver.assertClaim("unison-ai-product/UT-TDD_AGENT-HARNESS")).not.toThrow();
  });

  it.each([
    ["別repository claim", "owner/other", "https://github.com/owner/repo.git"],
    ["別owner claim", "other/repo", "https://github.com/owner/repo.git"],
    ["非GitHub remote", "owner/repo", "https://example.com/owner/repo.git"],
    ["remote path traversal", "owner/repo", "https://github.com/owner/../repo.git"],
    ["remote取得失敗", "owner/repo", new Error("missing")],
  ])("caller値を信用せずfail-closeする: %s", (_label, claim, remote) => {
    const resolver = new TrustedRepositoryIdentityResolver(new StubGit(remote));

    expect(() => resolver.assertClaim(claim)).toThrow("trusted-repository-identity-invalid");
  });

  it("大小文字を暗黙正規化せずidentityの差を拒否する", () => {
    const resolver = new TrustedRepositoryIdentityResolver(
      new StubGit("https://github.com/Owner/Repo.git"),
    );

    expect(() => resolver.assertClaim("owner/repo")).toThrow("trusted-repository-identity-invalid");
  });

  it("別repositoryのE4 evidence流用を拒否する", () => {
    const resolver = new TrustedRepositoryIdentityResolver(
      new StubGit("https://github.com/owner/repo.git"),
    );

    expect(() =>
      resolver.assertBindings({
        claimedRepositoryIdentity: "owner/repo",
        issueRepositoryIdentity: "owner/other",
      }),
    ).toThrow("trusted-repository-identity-invalid");
  });

  it("manifest・E4・実originの三者が一致したidentityだけを返す", () => {
    const resolver = new TrustedRepositoryIdentityResolver(
      new StubGit("git@github.com:owner/repo.git"),
    );

    expect(
      resolver.assertBindings({
        claimedRepositoryIdentity: "owner/repo",
        issueRepositoryIdentity: "owner/repo",
      }),
    ).toBe("owner/repo");
  });
});
