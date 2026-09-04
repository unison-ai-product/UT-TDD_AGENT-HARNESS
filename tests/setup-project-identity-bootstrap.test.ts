import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  bootstrapProjectIdentity,
  canonicalProjectIdentityBytes,
} from "../src/setup/project-identity-bootstrap.ts";

const fixtures: string[] = [];

afterEach(() => {
  for (const root of fixtures.splice(0)) rmSync(root, { recursive: true, force: true });
});

function fixture(remote = "git@github.com:acme/widget.git"): string {
  const root = mkdtempSync(join(tmpdir(), "ut-tdd-project-id-"));
  fixtures.push(root);
  execFileSync("git", ["init", "-q", "-b", "main"], { cwd: root });
  execFileSync("git", ["config", "user.email", "test@example.invalid"], { cwd: root });
  execFileSync("git", ["config", "user.name", "UT-TDD test"], { cwd: root });
  execFileSync("git", ["remote", "add", "origin", remote], { cwd: root });
  return root;
}

describe("project identity bootstrap", () => {
  it("creates deterministic canonical bytes without committing", () => {
    const root = fixture();
    const result = bootstrapProjectIdentity(root);

    expect(result).toMatchObject({ ok: true, created: true, repositoryIdentity: "acme/widget" });
    expect(readFileSync(join(root, "ut-tdd.project.json"))).toEqual(
      Buffer.from(canonicalProjectIdentityBytes("acme/widget")),
    );
    expect(execFileSync("git", ["status", "--porcelain"], { cwd: root }).toString()).toContain(
      "ut-tdd.project.json",
    );
    expect(statSync(join(root, "ut-tdd.project.json")).isFile()).toBe(true);
  });

  it("rejects a stale untracked identity instead of overwriting it", () => {
    const root = fixture();
    const path = join(root, "ut-tdd.project.json");
    writeFileSync(
      path,
      '{"schema_version":"ut-tdd.project/v1","repository_identity":"other/repo"}',
    );

    expect(bootstrapProjectIdentity(root)).toMatchObject({
      ok: false,
      error: { ruleId: "identity_stale_worktree" },
    });
    expect(readFileSync(path, "utf8")).toContain("other/repo");
  });

  it("requires an origin remote and never falls back to the directory name", () => {
    const root = fixture();
    execFileSync("git", ["remote", "remove", "origin"], { cwd: root });

    expect(bootstrapProjectIdentity(root)).toMatchObject({
      ok: false,
      error: { ruleId: "identity_repository_unbound" },
    });
    expect(() => readFileSync(join(root, "ut-tdd.project.json"))).toThrow();
  });
});
