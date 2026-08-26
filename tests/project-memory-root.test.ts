import { describe, expect, it } from "vitest";
import { resolveProjectMemoryRootWithPorts } from "../src/runtime/project-memory-root.ts";

const win = process.platform === "win32";
const primary = win ? "C:\\dev\\product" : "/dev/product";
const linked = win ? "C:\\dev\\product-worker" : "/dev/product-worker";
const common = win ? `${primary}\\.git` : `${primary}/.git`;

function ports(over: Partial<Parameters<typeof resolveProjectMemoryRootWithPorts>[1]> = {}) {
  return {
    gitTopLevel: () => linked,
    gitCommonDir: () => common,
    realpath: (path: string) => path,
    isDirectory: () => true,
    projectIdentity: () => "owner/product",
    ...over,
  };
}

describe("project-scoped canonical Memory root (PLAN-L7-512)", () => {
  it("CANDIDATE-U-PMEMROOT-001: linked worktreeをprimary authored corpusとproject busへ収束する", () => {
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
    expect(result.runtimeBusRoot).toContain(result.projectNamespace);
    expect(result.projectNamespace).toMatch(/^[a-f0-9]{64}$/);
  });

  it("CANDIDATE-U-PMEMROOT-002: currentとcanonicalのtracked identity driftを拒否する", () => {
    expect(
      resolveProjectMemoryRootWithPorts(
        linked,
        ports({ projectIdentity: (root) => (root === linked ? "owner/product" : "owner/foreign") }),
      ),
    ).toEqual({ ok: false, reason: "project_identity_drift" });
  });

  it("CANDIDATE-U-PMEMROOT-003: identity欠落とbare/異常common-dirをfail-closeする", () => {
    expect(
      resolveProjectMemoryRootWithPorts(linked, ports({ projectIdentity: () => null })),
    ).toEqual({ ok: false, reason: "project_identity_unavailable" });
    expect(
      resolveProjectMemoryRootWithPorts(
        linked,
        ports({ gitCommonDir: () => (win ? "C:\\repos\\bare.git" : "/repos/bare.git") }),
      ),
    ).toEqual({ ok: false, reason: "canonical_root_invalid" });
  });

  it("CANDIDATE-U-PMEMROOT-004: project identityが違えば同名memory用bus namespaceも一致しない", () => {
    const a = resolveProjectMemoryRootWithPorts(linked, ports());
    const b = resolveProjectMemoryRootWithPorts(
      linked,
      ports({ projectIdentity: () => "owner/another-product" }),
    );
    expect(a.ok && b.ok).toBe(true);
    if (!a.ok || !b.ok) throw new Error("unexpected deny");
    expect(a.projectNamespace).not.toBe(b.projectNamespace);
    expect(a.runtimeBusRoot).not.toBe(b.runtimeBusRoot);
  });
});
