import { describe, expect, it } from "vitest";
import {
  analyzeWorktreeTopology,
  remapTopologyIdentities,
  topologyDigest,
  type WorktreeFact,
} from "../src/runtime/worktree-topology";

function fact(overrides: Partial<WorktreeFact> = {}): WorktreeFact {
  return {
    worktreePathKey: "/repo/w",
    adminPathKey: "/repo/.git/worktrees/w",
    headOid: "a".repeat(40),
    isMain: false,
    directoryObserved: true,
    worktreeToAdminOk: true,
    adminToWorktreeOk: true,
    dirty: false,
    branch: "feature/w",
    mergedIntoMain: false,
    ...overrides,
  };
}
const main = fact({
  worktreePathKey: "/repo",
  adminPathKey: "/repo/.git",
  isMain: true,
  branch: "main",
});
const input = (facts: WorktreeFact[], observations = []) => ({
  facts,
  adminEntries: facts
    .filter((item) => !item.isMain)
    .map((item) => ({ adminPathKey: item.adminPathKey, registered: true })),
  observations,
});

describe("worktree topology (U-WTTOPO)", () => {
  it("U-WTTOPO-001: 正常linkはhealthyへ入る", () =>
    expect(analyzeWorktreeTopology(input([main, fact()])).healthy).toBe(2));
  // U-WTTOPO-003: admin → worktree の方向も個別に citation する。
  it("U-WTTOPO-002/003: 両方向link不整合をlink_brokenにする", () => {
    for (const broken of [fact({ worktreeToAdminOk: false }), fact({ adminToWorktreeOk: false })])
      expect(analyzeWorktreeTopology(input([main, broken])).findings[0]?.kind).toBe("link_broken");
  });
  // U-WTTOPO-005: orphan admin を個別に citation する。
  it("U-WTTOPO-004/005: directory不在と孤児adminを区別する", () => {
    expect(
      analyzeWorktreeTopology(input([main, fact({ directoryObserved: false })])).findings[0]?.kind,
    ).toBe("dir_missing");
    expect(
      analyzeWorktreeTopology({
        facts: [main],
        adminEntries: [{ adminPathKey: "/repo/.git/worktrees/orphan", registered: false }],
      }).findings[0]?.kind,
    ).toBe("orphan_admin");
  });
  // U-WTTOPO-007: clean detached の保持ref到達可能性を個別に citation する。
  it("U-WTTOPO-006/007: dirty優先、clean mergedと到達可能detachedだけretirable", () => {
    const report = analyzeWorktreeTopology(
      input([
        main,
        fact({ dirty: true, mergedIntoMain: true }),
        fact({ worktreePathKey: "/repo/d", branch: undefined, detachedReachable: true }),
        fact({ worktreePathKey: "/repo/m", mergedIntoMain: true }),
      ]),
    );
    expect(report.counts.dirty).toBe(1);
    expect(report.retirable).toEqual(["/repo/d", "/repo/m"]);
  });
  // U-WTTOPO-009: digest の入力順不変性を個別に citation する。
  it("U-WTTOPO-008/009: mainをidentityに含め、入力順に依存しない", () => {
    const facts = [
      main,
      fact({ worktreePathKey: "/repo/b", mergedIntoMain: true }),
      fact({ worktreePathKey: "/repo/a" }),
    ];
    expect(analyzeWorktreeTopology(input(facts)).digest).toBe(
      analyzeWorktreeTopology(input([...facts].reverse())).digest,
    );
  });
  // U-WTTOPO-011: fail-safe を個別に citation する。
  // U-WTTOPO-012: 到達不能 detached を個別に citation する。
  it("U-WTTOPO-010/011/012: 観測不能または固有detachedをretirableにしない", () => {
    const report = analyzeWorktreeTopology(
      input([
        main,
        fact({ worktreeToAdminOk: false, branch: undefined, detachedReachable: true }),
        fact({ worktreePathKey: "/repo/u", branch: undefined, detachedReachable: undefined }),
        fact({ worktreePathKey: "/repo/x", branch: undefined, detachedReachable: false }),
      ]),
    );
    expect(report.retirable).toEqual([]);
    expect(report.findings.some((item) => item.kind === "reachability_unavailable")).toBe(true);
  });
  it("U-WTTOPO-013: healthy件数同一でもidentity digest差を検出する", () => {
    expect(
      topologyDigest([
        { worktreePathKey: "/repo/a", adminPathKey: "/git/a", headOid: "a", isMain: false },
      ]),
    ).not.toBe(
      topologyDigest([
        { worktreePathKey: "/repo/c", adminPathKey: "/git/c", headOid: "a", isMain: false },
      ]),
    );
  });
  it("U-WTTOPO-016: separatorとdrive letterだけ正規化しcase-onlyは併合しない", () => {
    const one = {
      worktreePathKey: "C:/Repo/A",
      adminPathKey: "C:/Git/A",
      headOid: "a",
      isMain: false,
    };
    const two = {
      worktreePathKey: "C:/Repo/a",
      adminPathKey: "C:/Git/a",
      headOid: "a",
      isMain: false,
    };
    expect(topologyDigest([one, two])).not.toBe(topologyDigest([one]));
  });
  it("U-WTTOPO-018: digestは順序不変、unsafe remapは拒否する", () => {
    const identities = [main, fact()].map(({ worktreePathKey, adminPathKey, headOid, isMain }) => ({
      worktreePathKey,
      adminPathKey,
      headOid,
      isMain,
    }));
    expect(topologyDigest(identities)).toBe(topologyDigest([...identities].reverse()));
    expect(() =>
      remapTopologyIdentities(identities, [
        { fromPrefix: "/repo", toPrefix: "/x" },
        { fromPrefix: "/repo", toPrefix: "/y" },
      ]),
    ).toThrow("duplicate");
  });
});
