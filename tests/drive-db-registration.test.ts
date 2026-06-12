import { describe, expect, it } from "vitest";
import {
  analyzeDriveDbRegistration,
  type DriveDbRegistrationStats,
  driveDbRegistrationMessages,
} from "../src/lint/drive-db-registration";
import { loadDriveDbRegistrationStats } from "../src/state-db/drive-registration";

const compliant: DriveDbRegistrationStats = {
  planCount: 10,
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

describe("drive DB registration lint", () => {
  it("U-DDBREG-001: accepts drive/workflow/model/skill rows with resolvable joins", () => {
    const r = analyzeDriveDbRegistration(compliant);

    expect(r.ok).toBe(true);
    expect(driveDbRegistrationMessages(r)[0]).toContain("OK");
    expect(driveDbRegistrationMessages(r)[0]).toContain("legacy_hook_orphans=99");
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

  it("U-DDBREG-003: current harness.db has automatic registration evidence", () => {
    const stats = loadDriveDbRegistrationStats(process.cwd());
    const r = analyzeDriveDbRegistration(stats);

    expect(stats).not.toBeNull();
    expect(r.ok).toBe(true);
    expect(stats?.driveRuns).toBeGreaterThan(0);
    expect(stats?.workflowOrphans).toBe(0);
    expect(stats?.modelOrphans).toBe(0);
    expect(stats?.skillRecommendationOrphans).toBe(0);
    expect(stats?.skillInvocationOrphans).toBe(0);
    expect(stats?.registeredHookEvents).toBeGreaterThan(0);
  });
});
