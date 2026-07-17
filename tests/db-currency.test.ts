import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { analyzeDbCurrency, dbCurrencyMessages } from "../src/lint/db-currency";
import type { DriveDbRegistrationStats } from "../src/lint/drive-db-registration";
import { loadDriveDbRegistrationStats } from "../src/state-db/drive-registration";
import { rebuildHarnessDb } from "../src/state-db/projection-writer";
import { refreshHarnessDbOnStop, spawnDetachedStopRefresh } from "../src/state-db/stop-refresh";
import { removeTestTree } from "./support/temp-tree";

const currentStats: DriveDbRegistrationStats = {
  planCount: 10,
  expectedPlanCount: 10,
  planRegistryFingerprint: "sha256:1234567890abcdef",
  expectedPlanRegistryFingerprint: "sha256:1234567890abcdef",
  driveRuns: 10,
  plansWithoutDriveRun: 0,
  workflowRuns: 2,
  workflowOrphans: 0,
  modelRuns: 4,
  modelOrphans: 0,
  skillRecommendations: 10,
  skillRecommendationOrphans: 0,
  skillInvocations: 5,
  skillInvocationOrphans: 0,
  registeredHookEvents: 3,
  hookOrphans: 0,
  modes: ["Forward"],
};

describe("db-currency lint", () => {
  it("U-DBCURRENCY-001: accepts persisted harness.db when plan count and fingerprint match docs", () => {
    const result = analyzeDbCurrency(currentStats);

    expect(result.ok).toBe(true);
    expect(dbCurrencyMessages(result)[0]).toBe(
      "db-currency - OK (plans=10, fingerprint=1234567890ab)",
    );
  });

  it("U-DBCURRENCY-002: fails closed when on-disk harness.db is missing", () => {
    const result = analyzeDbCurrency(null);

    expect(result.ok).toBe(false);
    expect(result.violations).toEqual([{ reason: "missing_db" }]);
    expect(dbCurrencyMessages(result)[0]).toContain("missing_db");
  });

  it("U-DBCURRENCY-003: detects stale plan count and stale content fingerprint separately", () => {
    const result = analyzeDbCurrency({
      ...currentStats,
      planCount: 9,
      expectedPlanCount: 10,
      planRegistryFingerprint: "sha256:old",
      expectedPlanRegistryFingerprint: "sha256:new",
    });

    expect(result.ok).toBe(false);
    expect(result.violations).toEqual([
      { reason: "stale_plan_registry", count: -1 },
      { reason: "stale_plan_registry_fingerprint" },
    ]);
    expect(dbCurrencyMessages(result)[0]).toContain("stale_plan_registry=-1");
    expect(dbCurrencyMessages(result)[0]).toContain("stale_plan_registry_fingerprint");
  });

  it("U-DBCURRENCY-004: rebuilt on-disk harness.db is current against its PLAN docs", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-db-currency-"));
    try {
      const planDir = join(root, "docs", "plans");
      mkdirSync(planDir, { recursive: true });
      writeFileSync(
        join(planDir, "PLAN-TEST-db-currency.md"),
        [
          "---",
          "plan_id: PLAN-TEST-db-currency",
          "kind: impl",
          "layer: L7",
          "drive: db",
          "status: draft",
          "updated: 2026-07-07",
          "---",
          "",
          "## Body",
          "",
        ].join("\n"),
        "utf8",
      );

      rebuildHarnessDb({ repoRoot: root });
      const stats = loadDriveDbRegistrationStats(root);
      const result = analyzeDbCurrency(stats);

      expect(stats).not.toBeNull();
      expect(result.ok).toBe(true);
    } finally {
      removeTestTree(root);
    }
  });

  it("U-DBCURRENCY-005: Stop-hook refresh converges a stale persisted registry without manual rebuild (PLAN-L7-365 Step 2, issue #78)", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-stop-refresh-"));
    const emptySessions = mkdtempSync(join(tmpdir(), "ut-tdd-stop-refresh-sessions-"));
    try {
      const planDir = join(root, "docs", "plans");
      mkdirSync(planDir, { recursive: true });
      const planDoc = (id: string) =>
        [
          "---",
          `plan_id: ${id}`,
          "kind: impl",
          "layer: L7",
          "drive: db",
          "status: draft",
          "updated: 2026-07-07",
          "---",
          "",
          "## Body",
          "",
        ].join("\n");
      writeFileSync(
        join(planDir, "PLAN-TEST-refresh-a.md"),
        planDoc("PLAN-TEST-refresh-a"),
        "utf8",
      );
      rebuildHarnessDb({ repoRoot: root });

      // 他ランタイム merge 相当: docs/plans に PLAN が増え persisted registry が stale 化する。
      writeFileSync(
        join(planDir, "PLAN-TEST-refresh-b.md"),
        planDoc("PLAN-TEST-refresh-b"),
        "utf8",
      );
      const staleResult = analyzeDbCurrency(loadDriveDbRegistrationStats(root));
      expect(staleResult.ok).toBe(false);
      expect(staleResult.violations.map((v) => v.reason)).toContain("stale_plan_registry");

      const refresh = refreshHarnessDbOnStop({
        repoRoot: root,
        claudeSessionsDir: emptySessions,
        codexSessionsDir: emptySessions,
      });
      expect(refresh.ok).toBe(true);
      expect(refresh.rebuilt).toBe(true);

      const result = analyzeDbCurrency(loadDriveDbRegistrationStats(root));
      expect(result.ok).toBe(true);
    } finally {
      removeTestTree(root);
      removeTestTree(emptySessions);
    }
  });

  it("U-DBCURRENCY-006: Stop-hook refresh fails open (returns a reason instead of throwing) when rebuild is impossible", () => {
    // .ut-tdd の位置に通常ファイルを置き、harness.db の親ディレクトリを作成不能にする
    // (DB open 不能の代表ケース。lock 等の他の失敗も同じ catch 境界に落ちる)。
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-stop-refresh-broken-"));
    try {
      writeFileSync(join(root, ".ut-tdd"), "not a directory", "utf8");

      const refresh = refreshHarnessDbOnStop({ repoRoot: root, skipTokenIngest: true });

      expect(refresh.ok).toBe(false);
      expect(refresh.skippedReason).toBeTruthy();
    } finally {
      removeTestTree(root);
    }
  });

  it("U-DBCURRENCY-007: Stop hook launches the refresh detached so the 5s hook budget is not consumed", () => {
    const calls: Array<{
      command: string;
      args: string[];
      options: { cwd: string; detached: boolean; stdio: "ignore" };
      unrefCalled: boolean;
    }> = [];

    const result = spawnDetachedStopRefresh({
      repoRoot: "/repo",
      execPath: "/usr/bin/bun",
      scriptPath: "/repo/src/cli.ts",
      spawnImpl: (command, args, options) => {
        const call = { command, args, options, unrefCalled: false };
        calls.push(call);
        return {
          unref: () => {
            call.unrefCalled = true;
          },
        };
      },
    });

    expect(result.launched).toBe(true);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.command).toBe("/usr/bin/bun");
    expect(calls[0]?.args).toEqual(["/repo/src/cli.ts", "session", "db-refresh"]);
    expect(calls[0]?.options).toEqual({ cwd: "/repo", detached: true, stdio: "ignore" });
    expect(calls[0]?.unrefCalled).toBe(true);
  });

  it("U-DBCURRENCY-008: detached launch fails open (returns a reason instead of throwing)", () => {
    const result = spawnDetachedStopRefresh({
      repoRoot: "/repo",
      execPath: "/usr/bin/bun",
      scriptPath: "/repo/src/cli.ts",
      spawnImpl: () => {
        throw new Error("spawn EPERM");
      },
    });

    expect(result.launched).toBe(false);
    expect(result.reason).toContain("spawn EPERM");
  });
});
