import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  analyzeDriveDbRegistration,
  type DriveDbRegistrationStats,
  driveDbRegistrationMessages,
} from "../src/lint/drive-db-registration.ts";
import {
  collectDriveDbRegistrationStats,
  loadDriveDbRegistrationStats,
  loadOrBuildDriveDbRegistrationStats,
} from "../src/state-db/drive-registration.ts";
import { defaultHarnessDbPath, openHarnessDb, upsertRow } from "../src/state-db/index.ts";
import { migrate } from "../src/state-db/migration.ts";
import { rebuildHarnessDb } from "../src/state-db/projection-writer.ts";
import { removeTestTree } from "./support/temp-tree.ts";

const compliant: DriveDbRegistrationStats = {
  planCount: 10,
  expectedPlanCount: 10,
  planRegistryFingerprint: "sha256:current",
  expectedPlanRegistryFingerprint: "sha256:current",
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
  hookOrphans: 99,
  modes: ["Discovery", "Forward", "Recovery", "Reverse", "Verification"],
};

function buildRoutineGateOrphanFixture() {
  const root = mkdtempSync(join(tmpdir(), "ut-tdd-ddbreg-routine-gate-orphan-"));
  const planId = "PLAN-TEST-ddbreg-routine-gate-orphan";
  try {
    const planDir = join(root, "docs", "plans");
    mkdirSync(planDir, { recursive: true });
    writeFileSync(
      join(planDir, `${planId}.md`),
      [
        "---",
        `plan_id: ${planId}`,
        "kind: impl",
        "layer: L7",
        "drive: agent",
        "status: draft",
        "route_mode: add-feature",
        "updated: 2026-10-29",
        "---",
        "",
        "## Body",
        "",
      ].join("\n"),
      "utf8",
    );

    const db = openHarnessDb(defaultHarnessDbPath(root), { repoRoot: root });
    try {
      migrate(db);
      rebuildHarnessDb({ repoRoot: root, db });
      const undocumentedDriveRunId = "DRIVE-RUN-DOES-NOT-EXIST";
      upsertRow(db, {
        table: "workflow_runs",
        primaryKey: "workflow_run_id",
        row: {
          workflow_run_id: "routine-gate-empty-drive-id",
          plan_id: planId,
          drive_run_id: "",
          workflow: "routine-gate",
        },
      });
      upsertRow(db, {
        table: "workflow_runs",
        primaryKey: "workflow_run_id",
        row: {
          workflow_run_id: "routine-gate-undocumented-drive-id",
          plan_id: planId,
          drive_run_id: undocumentedDriveRunId,
          workflow: "routine-gate",
        },
      });
      upsertRow(db, {
        table: "workflow_runs",
        primaryKey: "workflow_run_id",
        row: {
          workflow_run_id: "non-routine-missing-drive-run",
          plan_id: planId,
          drive_run_id: undocumentedDriveRunId,
          workflow: "manual",
        },
      });

      return {
        root,
        planId,
        undocumentedDriveRunId,
        stats: collectDriveDbRegistrationStats(db),
        registeredPlanIds: db
          .prepare("SELECT plan_id FROM plan_registry")
          .all()
          .map((row) => String(row.plan_id)),
        driveRunIds: db
          .prepare("SELECT drive_run_id FROM drive_runs")
          .all()
          .map((row) => String(row.drive_run_id)),
        workflowRows: db
          .prepare(
            "SELECT workflow_run_id, plan_id, drive_run_id, workflow FROM workflow_runs ORDER BY workflow_run_id",
          )
          .all()
          .map((row) => ({
            workflowRunId: String(row.workflow_run_id),
            planId: String(row.plan_id),
            driveRunId: String(row.drive_run_id),
            workflow: String(row.workflow),
          })),
      };
    } finally {
      db.close();
    }
  } catch (error) {
    removeTestTree(root);
    throw error;
  }
}

function isRoutineGateOrphanFixtureCorrect(
  fixture: ReturnType<typeof buildRoutineGateOrphanFixture>,
): boolean {
  const { planId, undocumentedDriveRunId, stats, registeredPlanIds, driveRunIds, workflowRows } =
    fixture;
  return (
    stats.planCount === 1 &&
    registeredPlanIds.length === 1 &&
    registeredPlanIds[0] === planId &&
    stats.workflowRuns === 3 &&
    workflowRows.length === 3 &&
    workflowRows.every((row) => row.planId === planId) &&
    workflowRows.some(
      (row) =>
        row.workflowRunId === "routine-gate-empty-drive-id" &&
        row.workflow === "routine-gate" &&
        row.driveRunId === "",
    ) &&
    workflowRows.some(
      (row) =>
        row.workflowRunId === "routine-gate-undocumented-drive-id" &&
        row.workflow === "routine-gate" &&
        row.driveRunId === undocumentedDriveRunId,
    ) &&
    workflowRows.some(
      (row) =>
        row.workflowRunId === "non-routine-missing-drive-run" &&
        row.workflow === "manual" &&
        row.driveRunId === undocumentedDriveRunId,
    ) &&
    !driveRunIds.includes("") &&
    !driveRunIds.includes(undocumentedDriveRunId)
  );
}

describe("drive DB registration lint", () => {
  it("U-DDBREG-001: accepts drive/workflow/model/skill rows with resolvable joins", () => {
    const r = analyzeDriveDbRegistration(compliant);

    expect(r.ok).toBe(true);
    expect(driveDbRegistrationMessages(r)[0]).toContain("OK");
    expect(driveDbRegistrationMessages(r)[0]).toContain("legacy_hook_orphans=99");
  });

  // Regression for docs/design/harness/L6-function-design/function-spec.md Appendix D §D.4.
  it("accepts a planless registry while retaining DB and mode-catalog failures", () => {
    const empty: DriveDbRegistrationStats = {
      planCount: 0,
      expectedPlanCount: 0,
      planRegistryFingerprint: "sha256:empty",
      expectedPlanRegistryFingerprint: "sha256:empty",
      driveRuns: 0,
      plansWithoutDriveRun: 0,
      workflowRuns: 0,
      workflowOrphans: 0,
      modelRuns: 0,
      modelOrphans: 0,
      skillRecommendations: 0,
      skillRecommendationOrphans: 0,
      skillInvocations: 0,
      skillInvocationOrphans: 0,
      registeredHookEvents: 0,
      hookOrphans: 0,
      modes: [],
      expectedModes: [],
      unmappedCatalogDocs: [],
    };

    const allZero = analyzeDriveDbRegistration(empty);
    expect(allZero.ok).toBe(true);
    expect(allZero.violations).toEqual([]);
    expect(driveDbRegistrationMessages(allZero)[0]).toContain("plans=0");

    const planlessLegacy = analyzeDriveDbRegistration({
      ...empty,
      expectedPlanCount: 1,
      planRegistryFingerprint: "sha256:stale",
      expectedPlanRegistryFingerprint: "sha256:current",
      workflowOrphans: 1,
      modelOrphans: 1,
      skillRecommendationOrphans: 1,
      skillInvocationOrphans: 1,
      expectedModes: undefined,
    });
    expect(planlessLegacy.ok).toBe(true);
    expect(planlessLegacy.violations).toEqual([]);

    const unmapped = analyzeDriveDbRegistration({
      ...empty,
      unmappedCatalogDocs: ["new-mode.md"],
    });
    expect(unmapped.ok).toBe(false);
    expect(unmapped.violations).toEqual([{ reason: "mode_catalog_unmapped", mode: "new-mode.md" }]);

    const missingDb = analyzeDriveDbRegistration(null);
    expect(missingDb.ok).toBe(false);
    expect(missingDb.violations).toEqual([{ reason: "missing_db" }]);
  });

  it("U-DDBREG-002: fails when current drive execution projection is missing or orphaned", () => {
    const r = analyzeDriveDbRegistration({
      ...compliant,
      plansWithoutDriveRun: 1,
      workflowOrphans: 1,
      modelOrphans: 1,
      skillRecommendationOrphans: 1,
      skillInvocationOrphans: 1,
      registeredHookEvents: 0,
      modes: ["Forward"],
    });

    expect(r.ok).toBe(false);
    expect(r.violations.map((v) => v.reason)).toEqual(
      expect.arrayContaining([
        "plans_without_drive_run",
        "workflow_orphans",
        "model_orphans",
        "skill_recommendation_orphans",
        "skill_invocation_orphans",
        "missing_registered_hook_events",
        "missing_required_mode",
      ]),
    );
  });

  it("U-DDBREG-005: fails when persisted harness.db plan count is stale", () => {
    const r = analyzeDriveDbRegistration({
      ...compliant,
      planCount: 9,
      expectedPlanCount: 10,
    });

    expect(r.ok).toBe(false);
    expect(r.violations).toContainEqual(
      expect.objectContaining({ reason: "stale_plan_registry", count: -1 }),
    );
    expect(driveDbRegistrationMessages(r)[0]).toContain("stale_plan_registry=-1");
  });

  it("U-DDBREG-006: fails when persisted harness.db plan content fingerprint is stale", () => {
    const r = analyzeDriveDbRegistration({
      ...compliant,
      planRegistryFingerprint: "sha256:old",
      expectedPlanRegistryFingerprint: "sha256:new",
    });

    expect(r.ok).toBe(false);
    expect(r.violations).toContainEqual(
      expect.objectContaining({ reason: "stale_plan_registry_fingerprint" }),
    );
    expect(driveDbRegistrationMessages(r)[0]).toContain("stale_plan_registry_fingerprint");
  });

  it("U-DDBREG-004: only session-scoped token rows are excluded from model orphan checks (PLAN-L7-58)", () => {
    const db = openHarnessDb(":memory:");
    try {
      migrate(db);
      // session telemetry row from `ut-tdd telemetry scan` — inherently plan-less, must not count.
      upsertRow(db, {
        table: "model_runs",
        primaryKey: "run_id",
        row: {
          run_id: "tok-1",
          runtime: "claude",
          model: "claude-opus-4-8",
          role: "session",
          drive: "",
          plan_id: "",
          started_at: "",
          completed_at: "",
          evidence_path: "sess.jsonl",
        },
      });
      // genuine orphan: a worker run that points at a non-existent PLAN — must still be flagged.
      upsertRow(db, {
        table: "model_runs",
        primaryKey: "run_id",
        row: {
          run_id: "orphan-1",
          runtime: "claude",
          model: "claude-opus-4-8",
          role: "worker",
          drive: "db",
          plan_id: "PLAN-DOES-NOT-EXIST",
          started_at: "",
          completed_at: "",
          evidence_path: "",
        },
      });
      // Missing/legacy role is not a session telemetry marker, so it must still be audited.
      upsertRow(db, {
        table: "model_runs",
        primaryKey: "run_id",
        row: {
          run_id: "orphan-null-role",
          runtime: "claude",
          model: "claude-opus-4-8",
          role: null,
          drive: "",
          plan_id: "PLAN-DOES-NOT-EXIST-2",
          started_at: "",
          completed_at: "",
          evidence_path: "",
        },
      });
      const stats = collectDriveDbRegistrationStats(db);
      expect(stats.modelRuns).toBe(3);
      expect(stats.modelOrphans).toBe(2); // worker + null-role, not the session row
      expect(stats.planRegistryFingerprint).toMatch(/^sha256:/);
    } finally {
      db.close();
    }
  });

  it("U-DOCTOR-GATE-04 A4 fixture: has a PLAN and both routine-gate variants plus one non-routine orphan", () => {
    const fixture = buildRoutineGateOrphanFixture();
    try {
      expect(fixture.stats.planCount).toBe(1);
      expect(fixture.registeredPlanIds).toEqual([fixture.planId]);
      expect(fixture.stats.workflowRuns).toBe(3);
      expect(fixture.workflowRows).toHaveLength(3);
      expect(isRoutineGateOrphanFixtureCorrect(fixture)).toBe(true);
    } finally {
      removeTestTree(fixture.root);
    }
  });

  it.fails("U-DOCTOR-GATE-04 A4: excludes routine-gate rows without documented drive runs but keeps other workflow orphans", () => {
    let fixture: ReturnType<typeof buildRoutineGateOrphanFixture>;
    try {
      fixture = buildRoutineGateOrphanFixture();
    } catch {
      // A setup failure must not be mistaken for the expected contract failure.
      return;
    }
    let fixtureIsCorrect = false;
    try {
      fixtureIsCorrect = isRoutineGateOrphanFixtureCorrect(fixture);
    } catch {
      // A fixture-verification failure must not be mistaken for the expected contract failure.
    }
    try {
      removeTestTree(fixture.root);
    } catch {
      // Cleanup failure must not be mistaken for the expected contract failure.
      return;
    }
    if (!fixtureIsCorrect) return;
    // Both routine-gate rows are intentional; only the non-routine row is an orphan.
    expect(fixture.stats.workflowOrphans).toBe(1);
  });

  it("U-DDBREG-003: persisted fixture has complete automatic registration evidence", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-ddbreg-current-"));
    const planId = "PLAN-TEST-ddbreg-current";
    try {
      const planDir = join(root, "docs", "plans");
      mkdirSync(planDir, { recursive: true });
      writeFileSync(
        join(planDir, `${planId}.md`),
        [
          "---",
          `plan_id: ${planId}`,
          "kind: impl",
          "layer: L7",
          "drive: agent",
          "status: draft",
          "route_mode: add-feature",
          "updated: 2026-07-13",
          "---",
          "",
          "## Body",
          "",
        ].join("\n"),
        "utf8",
      );
      const db = openHarnessDb(defaultHarnessDbPath(root), { repoRoot: root });
      try {
        migrate(db);
        rebuildHarnessDb({ repoRoot: root, db });
        const driveRunId = String(
          db.prepare("SELECT drive_run_id FROM drive_runs WHERE plan_id = ?").get(planId)
            ?.drive_run_id,
        );
        upsertRow(db, {
          table: "workflow_runs",
          primaryKey: "workflow_run_id",
          row: { workflow_run_id: "workflow-1", plan_id: planId, drive_run_id: driveRunId },
        });
        upsertRow(db, {
          table: "model_runs",
          primaryKey: "run_id",
          row: { run_id: "model-1", plan_id: planId, role: "worker" },
        });
        upsertRow(db, {
          table: "skill_recommendations",
          primaryKey: "skill_recommendation_id",
          row: { skill_recommendation_id: "recommendation-1", plan_id: planId },
        });
        upsertRow(db, {
          table: "skill_invocations",
          primaryKey: "skill_invocation_id",
          row: { skill_invocation_id: "invocation-1", plan_id: planId },
        });
        upsertRow(db, {
          table: "hook_events",
          primaryKey: "event_id",
          row: { event_id: "hook-1", plan_id: planId },
        });
      } finally {
        db.close();
      }

      const stats = loadDriveDbRegistrationStats(root);
      const r = analyzeDriveDbRegistration(stats);

      expect(stats).not.toBeNull();
      expect(r.ok).toBe(true);
      expect(stats?.expectedPlanCount).toBe(1);
      expect(stats?.expectedPlanCount).toBe(stats?.planCount);
      expect(stats?.expectedPlanRegistryFingerprint).toBe(stats?.planRegistryFingerprint);
      expect(stats?.driveRuns).toBe(1);
      expect(stats?.workflowRuns).toBe(1);
      expect(stats?.workflowOrphans).toBe(0);
      expect(stats?.modelOrphans).toBe(0);
      expect(stats?.skillRecommendationOrphans).toBe(0);
      expect(stats?.skillInvocationOrphans).toBe(0);
      expect(stats?.registeredHookEvents).toBe(1);
    } finally {
      removeTestTree(root);
    }
  });

  it("U-DDBREG-007: stale persisted plan registry falls back to deterministic memory rebuild", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-ddbreg-stale-"));
    try {
      const planDir = join(root, "docs", "plans");
      mkdirSync(planDir, { recursive: true });
      writeFileSync(
        join(planDir, "PLAN-TEST-ddbreg.md"),
        [
          "---",
          "plan_id: PLAN-TEST-ddbreg",
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
      const staleDb = openHarnessDb(defaultHarnessDbPath(root), { repoRoot: root });
      try {
        migrate(staleDb);
      } finally {
        staleDb.close();
      }

      const stats = loadOrBuildDriveDbRegistrationStats(root);

      expect(stats).not.toBeNull();
      expect(stats?.planCount).toBe(1);
      expect(stats?.expectedPlanCount).toBe(1);
      expect(stats?.planRegistryFingerprint).toBe(stats?.expectedPlanRegistryFingerprint);
    } finally {
      removeTestTree(root);
    }
  });
});
