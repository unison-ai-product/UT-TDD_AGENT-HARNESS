import { execFileSync } from "node:child_process";
import {
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createNodePlanRevisionRunner } from "../src/plan-admission/node-plan-revision-runner.ts";
import { buildLegacyPlanInventory } from "../src/plan-asset/adapters/legacy-plan-inventory.ts";
import {
  canonicalProjectIdentityBytes,
  loadProjectIdentityFromHead,
} from "../src/plan-asset/adapters/project-identity-loader.ts";
import { resolveProjectMemoryRoot } from "../src/runtime/project-memory-root.ts";
import {
  bootstrapProjectIdentity,
  repositoryIdentityFromOrigin,
} from "../src/setup/project-identity-bootstrap.ts";

const fixtures: string[] = [];
const win = process.platform === "win32";

afterEach(() => {
  for (const root of fixtures.splice(0)) rmSync(root, { recursive: true, force: true });
});

function fixture(remote = "git@github.com:acme/widget.git"): string {
  const root = mkdtempSync(join(tmpdir(), "ut-tdd-project-id-"));
  fixtures.push(root);
  execFileSync("git", ["init", "-q", "-b", "main"], { cwd: root });
  execFileSync("git", ["config", "user.email", "test@example.invalid"], { cwd: root });
  execFileSync("git", ["config", "user.name", "UT-TDD test"], { cwd: root });
  if (remote) execFileSync("git", ["remote", "add", "origin", remote], { cwd: root });
  return root;
}

function commitIdentity(root: string, bytes = canonicalProjectIdentityBytes("acme/widget")): void {
  writeFileSync(join(root, "ut-tdd.project.json"), bytes);
  execFileSync("git", ["add", "ut-tdd.project.json"], { cwd: root });
  execFileSync("git", ["commit", "-qm", "fixture identity"], { cwd: root });
}

function trackedFixture(
  identity = "acme/widget",
  remote = `git@github.com:${identity}.git`,
): string {
  const root = fixture(remote);
  commitIdentity(root, canonicalProjectIdentityBytes(identity));
  return root;
}

describe("project identity bootstrap", () => {
  it("CANDIDATE-U-PROJID-001: creates deterministic canonical bytes without committing", () => {
    const root = fixture();
    const result = bootstrapProjectIdentity(root);
    expect(result).toMatchObject({
      ok: true,
      created: true,
      commitRequired: true,
      repositoryIdentity: "acme/widget",
    });
    expect(readFileSync(join(root, "ut-tdd.project.json"))).toEqual(
      Buffer.from(canonicalProjectIdentityBytes("acme/widget")),
    );
    expect(execFileSync("git", ["status", "--porcelain"], { cwd: root }).toString()).toContain(
      "ut-tdd.project.json",
    );
    expect(statSync(join(root, "ut-tdd.project.json")).isFile()).toBe(true);
    expect(() => execFileSync("git", ["rev-parse", "--verify", "HEAD"], { cwd: root })).toThrow();
  });

  it("CANDIDATE-U-PROJID-002: rejects tracked working-tree drift", () => {
    const root = trackedFixture();
    writeFileSync(join(root, "ut-tdd.project.json"), canonicalProjectIdentityBytes("other/repo"));
    expect(loadProjectIdentityFromHead({ repoRoot: root })).toMatchObject({
      ok: false,
      error: { ruleId: "identity_worktree_drift" },
    });
  });

  it("CANDIDATE-U-PROJID-003: normalizes SSH origin to owner/repository", () => {
    expect(repositoryIdentityFromOrigin(fixture("git@github.com:owner/repository.git"))).toBe(
      "owner/repository",
    );
  });

  it("CANDIDATE-U-PROJID-004: normalizes HTTPS origin to owner/repository", () => {
    expect(repositoryIdentityFromOrigin(fixture("https://github.com/owner/repository.git"))).toBe(
      "owner/repository",
    );
  });

  it("CANDIDATE-U-PROJID-005: rejects malformed origin", () => {
    expect(repositoryIdentityFromOrigin(fixture("https://github.com/owner/a/b.git"))).toBeNull();
  });

  it("CANDIDATE-U-PROJID-006: missing origin is a typed bootstrap denial", () => {
    const root = fixture("");
    expect(bootstrapProjectIdentity(root)).toMatchObject({
      ok: false,
      error: { ruleId: "identity_repository_unbound" },
    });
    expect(() => readFileSync(join(root, "ut-tdd.project.json"))).toThrow();
  });

  it("CANDIDATE-U-PROJID-007: preserves stale untracked identity", () => {
    const root = fixture();
    const path = join(root, "ut-tdd.project.json");
    writeFileSync(
      path,
      Buffer.from('{"schema_version":"ut-tdd.project/v1","repository_identity":"other/repo"}'),
    );
    expect(bootstrapProjectIdentity(root)).toMatchObject({
      ok: false,
      error: { ruleId: "identity_stale_worktree" },
    });
    expect(readFileSync(path, "utf8")).toContain("other/repo");
  });

  it("CANDIDATE-U-PROJID-008: rejects an identity path symlink", () => {
    if (win) return;
    const root = fixture();
    const target = join(root, "elsewhere.json");
    writeFileSync(target, canonicalProjectIdentityBytes("acme/widget"));
    symlinkSync(target, join(root, "ut-tdd.project.json"));
    expect(bootstrapProjectIdentity(root)).toMatchObject({
      ok: false,
      error: { ruleId: "identity_stale_worktree" },
    });
  });

  it("CANDIDATE-U-PROJID-009: does not implicitly add or commit", () => {
    const root = fixture();
    expect(bootstrapProjectIdentity(root)).toMatchObject({ ok: true, created: true });
    expect(execFileSync("git", ["diff", "--cached", "--name-only"], { cwd: root }).toString()).toBe(
      "",
    );
    expect(execFileSync("git", ["status", "--porcelain"], { cwd: root }).toString()).toContain(
      "?? ut-tdd.project.json",
    );
  });

  it("CANDIDATE-U-PROJID-010: canonical output is LF UTF-8 without BOM", () => {
    const bytes = Buffer.from(canonicalProjectIdentityBytes("acme/widget"));
    expect(bytes[0]).not.toBe(0xef);
    expect(bytes.includes(0x0d)).toBe(false);
    expect(bytes.toString("utf8").endsWith("\n")).toBe(true);
  });

  it("CANDIDATE-U-PROJID-011: create accepts SSH origin", () => {
    expect(bootstrapProjectIdentity(fixture("git@github.com:acme/widget.git"))).toMatchObject({
      ok: true,
      repositoryIdentity: "acme/widget",
    });
  });

  it("CANDIDATE-U-PROJID-012: create accepts HTTPS origin", () => {
    expect(bootstrapProjectIdentity(fixture("https://github.com/acme/widget.git"))).toMatchObject({
      ok: true,
      repositoryIdentity: "acme/widget",
    });
  });

  it("CANDIDATE-U-PROJID-013: create denies an origin-less repository", () => {
    expect(bootstrapProjectIdentity(fixture(""))).toMatchObject({
      ok: false,
      error: { ruleId: "identity_repository_unbound" },
    });
  });

  it("CANDIDATE-U-PROJID-014: create denies malformed origin", () => {
    expect(bootstrapProjectIdentity(fixture("not-a-repository-url"))).toMatchObject({
      ok: false,
      error: { ruleId: "identity_repository_unbound" },
    });
  });

  it("CANDIDATE-U-PROJID-015: repeated create is byte deterministic", () => {
    const root = fixture();
    const first = bootstrapProjectIdentity(root);
    const before = readFileSync(join(root, "ut-tdd.project.json"));
    const second = bootstrapProjectIdentity(root);
    expect(first).toEqual(second);
    expect(readFileSync(join(root, "ut-tdd.project.json"))).toEqual(before);
  });

  it("CANDIDATE-U-PROJID-016: tracked rerun reads HEAD and does not rewrite", () => {
    const root = trackedFixture();
    const before = readFileSync(join(root, "ut-tdd.project.json"));
    expect(bootstrapProjectIdentity(root)).toMatchObject({
      ok: true,
      created: false,
      commitRequired: false,
    });
    expect(readFileSync(join(root, "ut-tdd.project.json"))).toEqual(before);
  });

  it("CANDIDATE-U-PROJID-017: read-only HEAD loader never creates a missing file", () => {
    const root = fixture();
    expect(loadProjectIdentityFromHead({ repoRoot: root })).toMatchObject({
      ok: false,
      error: { ruleId: "plan-repository-identity-missing" },
    });
    expect(() => readFileSync(join(root, "ut-tdd.project.json"))).toThrow();
  });

  it("CANDIDATE-U-PROJID-018: reuses canonical untracked identity with explicit commit-required state", () => {
    const root = fixture();
    bootstrapProjectIdentity(root);
    expect(bootstrapProjectIdentity(root)).toMatchObject({
      ok: true,
      created: false,
      commitRequired: true,
    });
  });

  it("CANDIDATE-U-PROJID-019: explicit commit changes bootstrap from create to tracked read", () => {
    const root = fixture();
    expect(bootstrapProjectIdentity(root)).toMatchObject({ ok: true, commitRequired: true });
    commitIdentity(root);
    expect(bootstrapProjectIdentity(root)).toMatchObject({ ok: true, commitRequired: false });
  });

  it("CANDIDATE-U-PROJID-020: identity is independent of absolute checkout path", () => {
    const root = trackedFixture();
    const moved = `${root}-moved`;
    renameSync(root, moved);
    fixtures[fixtures.indexOf(root)] = moved;
    expect(loadProjectIdentityFromHead({ repoRoot: moved })).toMatchObject({
      ok: true,
      value: { repositoryIdentity: "acme/widget" },
    });
  });

  it("CANDIDATE-U-PROJID-021: linked worktree keeps the same tracked identity", () => {
    const root = trackedFixture();
    const linked = `${root}-linked`;
    fixtures.push(linked);
    execFileSync("git", ["worktree", "add", "-q", "--detach", linked], { cwd: root });
    expect(loadProjectIdentityFromHead({ repoRoot: linked })).toMatchObject({
      ok: true,
      value: { repositoryIdentity: "acme/widget" },
    });
    execFileSync("git", ["worktree", "remove", "--force", linked], { cwd: root });
  });

  it("CANDIDATE-U-PROJID-022: moving a checkout preserves identity and receipt semantics", () => {
    const root = trackedFixture();
    const before = loadProjectIdentityFromHead({ repoRoot: root });
    const moved = `${root}-moved`;
    renameSync(root, moved);
    fixtures[fixtures.indexOf(root)] = moved;
    const after = loadProjectIdentityFromHead({ repoRoot: moved });
    expect(after).toMatchObject({ ok: true, value: { repositoryIdentity: "acme/widget" } });
    if (before.ok && after.ok)
      expect(after.value.provenance.blobOid).toBe(before.value.provenance.blobOid);
  });

  it("CANDIDATE-U-PROJID-023: namespace inputs remain distinct for distinct identities", () => {
    const first = trackedFixture("acme/widget");
    const second = trackedFixture("acme/other");
    expect(loadProjectIdentityFromHead({ repoRoot: first })).toMatchObject({
      value: { repositoryIdentity: "acme/widget" },
    });
    expect(loadProjectIdentityFromHead({ repoRoot: second })).toMatchObject({
      value: { repositoryIdentity: "acme/other" },
    });
  });

  it("CANDIDATE-U-PROJID-024: committed CRLF bytes are rejected as noncanonical", () => {
    const root = fixture();
    const crlf = Buffer.from(
      '{\r\n  "schema_version": "ut-tdd.project/v1",\r\n  "repository_identity": "acme/widget"\r\n}\r\n',
    );
    commitIdentity(root, crlf);
    expect(loadProjectIdentityFromHead({ repoRoot: root })).toMatchObject({
      ok: false,
      error: { ruleId: "identity_noncanonical_bytes" },
    });
  });

  it("CANDIDATE-U-PROJID-025: committed alternate key order is rejected as noncanonical", () => {
    const root = fixture();
    const reordered = Buffer.from(
      '{\n  "repository_identity": "acme/widget",\n  "schema_version": "ut-tdd.project/v1"\n}\n',
    );
    commitIdentity(root, reordered);
    expect(loadProjectIdentityFromHead({ repoRoot: root })).toMatchObject({
      ok: false,
      error: { ruleId: "identity_noncanonical_bytes" },
    });
  });

  it("CANDIDATE-U-PROJID-026: invalid identity grammar is denied", () => {
    const root = fixture();
    commitIdentity(root, canonicalProjectIdentityBytes("not valid/repository"));
    expect(loadProjectIdentityFromHead({ repoRoot: root })).toMatchObject({
      ok: false,
      error: { ruleId: "plan-repository-identity-invalid" },
    });
  });

  it("CANDIDATE-U-PROJID-027: tracked identity must match origin binding", () => {
    const root = trackedFixture("other/repo", "git@github.com:acme/widget.git");
    expect(loadProjectIdentityFromHead({ repoRoot: root })).toMatchObject({
      ok: false,
      error: { ruleId: "identity_repository_unbound" },
    });
  });

  it("CANDIDATE-U-PROJID-028: deleting a tracked file is typed worktree drift", () => {
    const root = trackedFixture();
    unlinkSync(join(root, "ut-tdd.project.json"));
    expect(loadProjectIdentityFromHead({ repoRoot: root })).toMatchObject({
      ok: false,
      error: { ruleId: "identity_worktree_drift" },
    });
  });

  it("CANDIDATE-U-PROJID-029: a linked repository root is rejected", () => {
    if (win) return;
    const root = trackedFixture();
    const link = `${root}-root-link`;
    fixtures.push(link);
    symlinkSync(root, link, "dir");
    expect(loadProjectIdentityFromHead({ repoRoot: link })).toMatchObject({
      ok: false,
      error: { ruleId: "identity_worktree_drift" },
    });
  });

  it("CANDIDATE-U-PROJID-030: loader has no directory-name fallback", () => {
    const root = fixture("");
    expect(loadProjectIdentityFromHead({ repoRoot: root })).toMatchObject({
      ok: false,
      error: { ruleId: "identity_repository_unbound" },
    });
  });

  it("CANDIDATE-U-PROJID-031: receipt is freshly bound to the current HEAD", () => {
    const root = trackedFixture();
    const first = loadProjectIdentityFromHead({ repoRoot: root });
    writeFileSync(join(root, "marker"), "marker\n");
    execFileSync("git", ["add", "marker"], { cwd: root });
    execFileSync("git", ["commit", "-qm", "advance HEAD"], { cwd: root });
    const second = loadProjectIdentityFromHead({ repoRoot: root });
    expect(first.ok && second.ok).toBe(true);
    if (first.ok && second.ok)
      expect(second.value.provenance.sourceCommit).not.toBe(first.value.provenance.sourceCommit);
  });

  it("CANDIDATE-U-PROJID-032: deleting tracked identity denies before parsing", () => {
    const root = trackedFixture();
    unlinkSync(join(root, "ut-tdd.project.json"));
    expect(loadProjectIdentityFromHead({ repoRoot: root })).toMatchObject({
      ok: false,
      error: { ruleId: "identity_worktree_drift" },
    });
  });

  it("CANDIDATE-U-PROJID-033: identical worktree bytes are accepted", () => {
    const root = trackedFixture();
    expect(loadProjectIdentityFromHead({ repoRoot: root })).toMatchObject({
      ok: true,
      value: { repositoryIdentity: "acme/widget" },
    });
  });

  it("CANDIDATE-U-PROJID-034: CRLF committed identity is denied", () => {
    const root = fixture();
    commitIdentity(
      root,
      Buffer.from(
        '{\r\n  "schema_version":"ut-tdd.project/v1",\r\n  "repository_identity":"acme/widget"\r\n}\r\n',
      ),
    );
    expect(loadProjectIdentityFromHead({ repoRoot: root })).toMatchObject({
      ok: false,
      error: { ruleId: "identity_noncanonical_bytes" },
    });
  });

  it("CANDIDATE-U-PROJID-035: key order variation is denied", () => {
    const root = fixture();
    commitIdentity(
      root,
      Buffer.from('{"repository_identity":"acme/widget","schema_version":"ut-tdd.project/v1"}\n'),
    );
    expect(loadProjectIdentityFromHead({ repoRoot: root })).toMatchObject({
      ok: false,
      error: { ruleId: "identity_noncanonical_bytes" },
    });
  });

  it("CANDIDATE-U-PROJID-036: node revision runner's direct identity reader is origin-bound", () => {
    const root = trackedFixture("other/repo", "git@github.com:acme/widget.git");
    const runner = createNodePlanRevisionRunner(root) as unknown as {
      deps: { repositoryIdentity: () => string };
    };
    expect(() => runner.deps.repositoryIdentity()).toThrow("identity_repository_unbound");
  });

  it("CANDIDATE-U-PROJID-037: legacy inventory direct caller denies stale identity", () => {
    const root = trackedFixture("other/repo", "git@github.com:acme/widget.git");
    expect(buildLegacyPlanInventory(root)).toMatchObject({
      ok: false,
      error: { ruleId: "identity_repository_unbound" },
    });
  });

  it("CANDIDATE-U-PROJID-038: project-memory direct caller denies stale identity", () => {
    const root = trackedFixture("other/repo", "git@github.com:acme/widget.git");
    expect(resolveProjectMemoryRoot(root)).toEqual({
      ok: false,
      reason: "project_identity_unavailable",
    });
  });

  it("CANDIDATE-U-PROJID-039: tracked identity without origin is unbound", () => {
    const root = trackedFixture("acme/widget", "git@github.com:acme/widget.git");
    execFileSync("git", ["remote", "remove", "origin"], { cwd: root });
    expect(loadProjectIdentityFromHead({ repoRoot: root })).toMatchObject({
      ok: false,
      error: { ruleId: "identity_repository_unbound" },
    });
  });

  it("CANDIDATE-U-PROJID-P001: setup and loader share the canonical identity oracle", () => {
    const root = fixture();
    expect(bootstrapProjectIdentity(root)).toMatchObject({
      ok: true,
      repositoryIdentity: "acme/widget",
    });
    commitIdentity(root);
    expect(loadProjectIdentityFromHead({ repoRoot: root })).toMatchObject({
      ok: true,
      value: { repositoryIdentity: "acme/widget" },
    });
  });

  it("CANDIDATE-U-PROJID-P002: explicit commit is the only authority transition", () => {
    const root = fixture();
    expect(bootstrapProjectIdentity(root)).toMatchObject({ ok: true, commitRequired: true });
    expect(loadProjectIdentityFromHead({ repoRoot: root })).toMatchObject({
      ok: false,
      error: { ruleId: "plan-repository-identity-missing" },
    });
    commitIdentity(root);
    expect(loadProjectIdentityFromHead({ repoRoot: root })).toMatchObject({ ok: true });
  });

  it("CANDIDATE-U-PROJID-P003: canonical identity remains stable after path relocation", () => {
    const root = trackedFixture();
    const moved = `${root}-relocated`;
    renameSync(root, moved);
    fixtures[fixtures.indexOf(root)] = moved;
    expect(repositoryIdentityFromOrigin(moved)).toBe("acme/widget");
    expect(loadProjectIdentityFromHead({ repoRoot: moved })).toMatchObject({
      value: { repositoryIdentity: "acme/widget" },
    });
  });
});
