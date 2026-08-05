import { describe, expect, it } from "vitest";
import {
  analyzeWorktreeTopology,
  type WorktreeAdminEntry,
  type WorktreeFact,
} from "../src/runtime/worktree-topology";

function fact(overrides: Partial<WorktreeFact> = {}): WorktreeFact {
  const path = overrides.path ?? "/repo/worktrees/w1";
  return {
    path,
    isMain: false,
    dirExists: true,
    gitdirPointer: "/repo/.git/worktrees/w1",
    gitdirPointerExists: true,
    // back pointer は path から導出する。固定値にすると path を差し替えた fixture が
    // 意図しない link_broken を生み、oracle が別の理由で通る/落ちる。
    adminBackPointer: `${path}/.git`,
    branch: "feature/x",
    dirty: false,
    mergedIntoMain: false,
    ...overrides,
  };
}

function admin(overrides: Partial<WorktreeAdminEntry> = {}): WorktreeAdminEntry {
  return { id: "w1", registered: true, ...overrides };
}

const MAIN = fact({
  path: "/repo",
  isMain: true,
  gitdirPointer: undefined,
  gitdirPointerExists: false,
  adminBackPointer: undefined,
  branch: "main",
  mergedIntoMain: true,
});

describe("worktree topology analyzer (U-WTTOPO)", () => {
  it("U-WTTOPO-001: 健全な facts で ok=true / findings 0 / counts 一致", () => {
    const report = analyzeWorktreeTopology({
      facts: [MAIN, fact({ mergedIntoMain: false, branch: "feature/x" })],
      adminEntries: [admin()],
    });

    expect(report.ok).toBe(true);
    expect(report.findings).toEqual([]);
    expect(report.counts).toEqual({
      total: 2,
      main: 1,
      dirty: 0,
      detached: 0,
      merged: 0,
      active: 1,
    });
  });

  it("U-WTTOPO-002: gitdirPointerExists=false は link_broken", () => {
    const report = analyzeWorktreeTopology({
      facts: [MAIN, fact({ gitdirPointerExists: false })],
      adminEntries: [admin()],
    });

    expect(report.ok).toBe(false);
    expect(report.findings).toEqual([{ kind: "link_broken", path: "/repo/worktrees/w1" }]);
  });

  it("U-WTTOPO-003: admin back pointer 不一致は link_broken (双方向検査)", () => {
    const report = analyzeWorktreeTopology({
      facts: [MAIN, fact({ adminBackPointer: "/repo/worktrees/OTHER/.git" })],
      adminEntries: [admin()],
    });

    expect(report.ok).toBe(false);
    expect(report.findings).toEqual([{ kind: "link_broken", path: "/repo/worktrees/w1" }]);
  });

  it("U-WTTOPO-004: dirExists=false は dir_missing", () => {
    const report = analyzeWorktreeTopology({
      facts: [MAIN, fact({ dirExists: false })],
      adminEntries: [admin()],
    });

    expect(report.ok).toBe(false);
    expect(report.findings).toEqual([{ kind: "dir_missing", path: "/repo/worktrees/w1" }]);
  });

  it("U-WTTOPO-005: registered=false の admin entry は orphan_admin", () => {
    const report = analyzeWorktreeTopology({
      facts: [MAIN],
      adminEntries: [admin({ id: "stale-id", registered: false })],
    });

    expect(report.ok).toBe(false);
    expect(report.findings).toEqual([{ kind: "orphan_admin", path: "stale-id" }]);
  });

  it("U-WTTOPO-006: dirty はmergedでも最優先で分類される", () => {
    const report = analyzeWorktreeTopology({
      facts: [MAIN, fact({ dirty: true, mergedIntoMain: true })],
      adminEntries: [admin()],
    });

    expect(report.counts.dirty).toBe(1);
    expect(report.counts.merged).toBe(0);
    expect(report.retirable).toEqual([]);
  });

  it("U-WTTOPO-007: detached clean と merged clean は retirable、active は入らない", () => {
    const detached = fact({ path: "/repo/worktrees/detached", branch: undefined, dirty: false });
    const merged = fact({ path: "/repo/worktrees/merged", mergedIntoMain: true, dirty: false });
    const active = fact({ path: "/repo/worktrees/active", mergedIntoMain: false, dirty: false });

    const report = analyzeWorktreeTopology({
      facts: [MAIN, detached, merged, active],
      adminEntries: [admin({ id: "detached" }), admin({ id: "merged" }), admin({ id: "active" })],
    });

    expect(report.retirable).toEqual(["/repo/worktrees/detached", "/repo/worktrees/merged"]);
    expect(report.retirable).not.toContain("/repo/worktrees/active");
    expect(report.counts).toEqual({
      total: 4,
      main: 1,
      dirty: 0,
      detached: 1,
      merged: 1,
      active: 1,
    });
  });

  it("U-WTTOPO-008: main は分類から除外され counts.main に計上される", () => {
    const report = analyzeWorktreeTopology({
      facts: [MAIN],
      adminEntries: [],
    });

    expect(report.counts).toEqual({
      total: 1,
      main: 1,
      dirty: 0,
      detached: 0,
      merged: 0,
      active: 0,
    });
    expect(report.retirable).toEqual([]);
  });

  it("U-WTTOPO-009: 入力順を変えても findings / retirable が同一 (決定論)", () => {
    const a = fact({ path: "/repo/worktrees/a", dirExists: false });
    const b = fact({ path: "/repo/worktrees/b", mergedIntoMain: true });
    const c = fact({ path: "/repo/worktrees/c", branch: undefined });
    const facts = [MAIN, a, b, c];
    const adminEntries = [admin({ id: "a" }), admin({ id: "b" }), admin({ id: "c" })];

    const forward = analyzeWorktreeTopology({ facts, adminEntries });
    const reversed = analyzeWorktreeTopology({
      facts: [...facts].reverse(),
      adminEntries: [...adminEntries].reverse(),
    });

    expect(forward.findings).toEqual(reversed.findings);
    expect(forward.retirable).toEqual(reversed.retirable);
    expect(forward.counts).toEqual(reversed.counts);
    expect(forward.healthy).toEqual(reversed.healthy);
  });

  it("U-WTTOPO-010: findings がある worktree は healthy に数えない", () => {
    const broken = fact({ path: "/repo/worktrees/broken", dirExists: false });
    const healthyEntry = fact({ path: "/repo/worktrees/ok" });

    const report = analyzeWorktreeTopology({
      facts: [MAIN, broken, healthyEntry],
      adminEntries: [admin({ id: "broken" }), admin({ id: "ok" })],
    });

    expect(report.healthy).toBe(2);
    expect(report.findings).toEqual([{ kind: "dir_missing", path: "/repo/worktrees/broken" }]);
  });

  it("U-WTTOPO-011: 観測不能な worktree を retirable に混ぜない (fail-safe)", () => {
    // link が切れた worktree は collector が git を実行できず dirty=false /
    // mergedIntoMain=false へ倒れる。既定値のまま detached 扱いされて retirable に
    // 入ると、未コミット作業を抱えた worktree を廃棄可能と誤提示する。
    const unreadable = fact({
      path: "/repo/worktrees/unreadable",
      gitdirPointerExists: false,
      branch: undefined,
      dirty: false,
      mergedIntoMain: false,
    });
    const retirableEntry = fact({ path: "/repo/worktrees/done", mergedIntoMain: true });

    const report = analyzeWorktreeTopology({
      facts: [MAIN, unreadable, retirableEntry],
      adminEntries: [admin({ id: "unreadable" }), admin({ id: "done" })],
    });

    expect(report.findings).toEqual([{ kind: "link_broken", path: "/repo/worktrees/unreadable" }]);
    expect(report.retirable).toEqual(["/repo/worktrees/done"]);
    expect(report.counts.detached).toBe(1);
  });
});
