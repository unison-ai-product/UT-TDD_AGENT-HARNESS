import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  resolveProjectMemoryRoot,
  resolveProjectMemoryRootWithPorts,
} from "../src/runtime/project-memory-root.ts";

const win = process.platform === "win32";
const primary = win ? "C:\\dev\\product" : "/dev/product";
const linked = win ? "C:\\dev\\product-worker" : "/dev/product-worker";
const common = win ? `${primary}\\.git` : `${primary}/.git`;

function ports(overrides: Partial<Parameters<typeof resolveProjectMemoryRootWithPorts>[1]> = {}) {
  return {
    gitTopLevel: () => linked,
    gitCommonDir: () => common,
    realpath: (path: string) => path,
    isDirectory: () => true,
    isSafeDescendant: () => true,
    projectIdentity: () => "owner/product",
    ...overrides,
  };
}

function initTrackedProject(root: string, identity = "fixture/project"): void {
  execFileSync("git", ["init", "-q"], { cwd: root });
  execFileSync("git", ["config", "user.email", "test@example.invalid"], { cwd: root });
  execFileSync("git", ["config", "user.name", "UT-TDD test"], { cwd: root });
  writeFileSync(
    join(root, "ut-tdd.project.json"),
    `${JSON.stringify({ schema_version: "ut-tdd.project/v1", repository_identity: identity })}\n`,
    "utf8",
  );
  execFileSync("git", ["add", "ut-tdd.project.json"], { cwd: root });
  execFileSync("git", ["commit", "-qm", "fixture identity"], { cwd: root });
}

describe("project-scoped canonical Memory root (PLAN-L7-512)", () => {
  it("CANDIDATE-U-PMEMROOT-001: linked worktreeをcanonical corpusとproject busへ収束する", () => {
    const result = resolveProjectMemoryRootWithPorts(linked, ports());
    expect(result).toMatchObject({
      ok: true,
      projectId: "owner/product",
      currentWorktreeRoot: linked,
      canonicalProjectRoot: primary,
      gitCommonDir: common,
    });
    if (!result.ok) throw new Error(result.reason);
    expect(result.authoredMemoryRoot).toBe(
      win ? `${primary}\\.ut-tdd\\memory` : `${primary}/.ut-tdd/memory`,
    );
    expect(result.runtimeBusRoot).toContain(`ut-tdd-runtime${win ? "\\" : "/"}projects`);
    expect(result.runtimeBusRoot.endsWith(result.projectNamespace)).toBe(true);
    expect(result.projectNamespace).toMatch(/^[a-f0-9]{64}$/);
  });

  it("CANDIDATE-U-PMEMROOT-002/003: identity drift・欠落・異常common-dirをtyped denyする", () => {
    expect(
      resolveProjectMemoryRootWithPorts(
        linked,
        ports({ projectIdentity: (root) => (root === linked ? "owner/product" : null) }),
      ),
    ).toEqual({ ok: false, reason: "project_identity_unavailable" });
    expect(
      resolveProjectMemoryRootWithPorts(
        linked,
        ports({ projectIdentity: (root) => (root === linked ? "owner/product" : "owner/other") }),
      ),
    ).toEqual({ ok: false, reason: "project_identity_drift" });
    expect(
      resolveProjectMemoryRootWithPorts(
        linked,
        ports({ gitCommonDir: () => (win ? "C:\\repos\\bare.git" : "/repos/bare.git") }),
      ),
    ).toEqual({ ok: false, reason: "canonical_root_invalid" });
  });

  it("CANDIDATE-U-PMEMROOT-004: 別projectは異なるbus namespaceへ分離する", () => {
    const first = resolveProjectMemoryRootWithPorts(linked, ports());
    const second = resolveProjectMemoryRootWithPorts(
      linked,
      ports({ projectIdentity: () => "owner/other-product" }),
    );
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) throw new Error("unexpected deny");
    expect(first.projectNamespace).not.toBe(second.projectNamespace);
    expect(first.runtimeBusRoot).not.toBe(second.runtimeBusRoot);
  });

  it("CANDIDATE-U-PMEMROOT-008: authored/runtime rootのpath escapeをfail-closeする", () => {
    expect(
      resolveProjectMemoryRootWithPorts(linked, ports({ isSafeDescendant: () => false })),
    ).toEqual({ ok: false, reason: "authored_memory_root_escape" });
    expect(
      resolveProjectMemoryRootWithPorts(
        linked,
        ports({
          isSafeDescendant: (_root, candidate) => !candidate.includes("ut-tdd-runtime"),
        }),
      ),
    ).toEqual({ ok: false, reason: "runtime_root_escape" });
  });

  it("CANDIDATE-U-PMEMROOT-009: 実gitのcanonical project identityを解決する", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-pmemroot-"));
    const outside = mkdtempSync(join(tmpdir(), "ut-tdd-pmemroot-outside-"));
    try {
      initTrackedProject(root);
      const result = resolveProjectMemoryRoot(root);
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error(result.reason);
      expect(result.projectId).toBe("fixture/project");
      const canonicalRoot = realpathSync(root);
      expect(result.canonicalProjectRoot.toLowerCase()).toBe(canonicalRoot.toLowerCase());
      expect(result.authoredMemoryRoot.toLowerCase()).toBe(
        join(canonicalRoot, ".ut-tdd", "memory").toLowerCase(),
      );
      expect(result.runtimeBusRoot.toLowerCase()).toContain(
        join(canonicalRoot, ".git", "ut-tdd-runtime", "projects").toLowerCase(),
      );

      // Exercise the production symlink/junction walk instead of replacing the
      // safety port with a fake.  A forged runtime namespace must be denied.
      mkdirSync(dirname(result.runtimeBusRoot), { recursive: true });
      symlinkSync(outside, result.runtimeBusRoot, win ? "junction" : "dir");
      expect(resolveProjectMemoryRoot(root)).toEqual({
        ok: false,
        reason: "runtime_root_escape",
      });
    } finally {
      rmSync(root, { recursive: true, force: true });
      rmSync(outside, { recursive: true, force: true });
    }
  });
});
