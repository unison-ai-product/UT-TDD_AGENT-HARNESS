import { describe, expect, it } from "vitest";
import {
  analyzeDriveDbRegistration,
  driveDbRegistrationMessages,
} from "../src/lint/drive-db-registration.ts";

describe("drive DB registration non-PLAN checks", () => {
  it("reports an unavailable database", () => {
    const result = analyzeDriveDbRegistration(null);

    expect(result.ok).toBe(false);
    expect(result.violations).toEqual([{ reason: "missing_db" }]);
    expect(driveDbRegistrationMessages(result)[0]).toContain("missing_db");
  });

  it("reports mode documentation missing from the catalog mapping", () => {
    const result = analyzeDriveDbRegistration({
      planCount: 1,
      driveRuns: 1,
      plansWithoutDriveRun: 0,
      workflowRuns: 0,
      workflowOrphans: 0,
      modelRuns: 1,
      modelOrphans: 0,
      skillRecommendations: 1,
      skillRecommendationOrphans: 0,
      skillInvocations: 1,
      skillInvocationOrphans: 0,
      registeredHookEvents: 1,
      hookOrphans: 0,
      modes: [],
      expectedModes: [],
      unmappedCatalogDocs: ["new-mode.md"],
    });

    expect(result.ok).toBe(false);
    expect(result.violations).toEqual([{ reason: "mode_catalog_unmapped", mode: "new-mode.md" }]);
  });
});
