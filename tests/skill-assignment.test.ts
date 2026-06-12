import { describe, expect, it } from "vitest";
import {
  analyzeSkillAssignments,
  loadSkillAssignmentDocs,
  type SkillAssignmentDoc,
} from "../src/lint/skill-assignment";

const doc = (metadata: Record<string, unknown>): SkillAssignmentDoc => ({
  path: "docs/skills/example.yaml",
  metadata,
});

describe("skill-assignment lint", () => {
  it("requires every skill to declare type, layers, and drive models", () => {
    const result = analyzeSkillAssignments([
      doc({
        skill_type: "quality-gate-review",
        applies_to: {
          layers: ["L7"],
          drive_models: ["Forward", "Reverse"],
        },
      }),
    ]);

    expect(result.ok).toBe(true);
    expect(result.violations).toEqual([]);
  });

  it("rejects missing and unknown assignment metadata", () => {
    const result = analyzeSkillAssignments([
      doc({
        skill_type: "",
        applies_to: {
          layers: ["L99"],
          drive_models: ["Unknown"],
        },
      }),
    ]);

    expect(result.ok).toBe(false);
    expect(result.violations.map((v) => v.kind)).toEqual([
      "missing-skill-type",
      "unknown-layer",
      "unknown-drive-model",
    ]);
  });

  it("real repo skills are assigned to L and drive-model scopes", () => {
    const result = analyzeSkillAssignments(loadSkillAssignmentDocs(process.cwd()));

    expect(result.ok).toBe(true);
    expect(result.checked).toBeGreaterThan(0);
  });
});
