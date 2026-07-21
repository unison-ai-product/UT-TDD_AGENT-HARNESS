import { describe, expect, it, vi } from "vitest";
import { PlanAuthoringCommandDispatcher } from "../src/plan-admission/plan-authoring-command-runner.js";

describe("PlanAuthoringCommandDispatcher", () => {
  it("version discriminatorでrevisionとredesign sibling runnerを分離する", () => {
    const revision = { run: vi.fn(() => "revision") };
    const redesign = { run: vi.fn(() => "redesign") };
    const dispatcher = new PlanAuthoringCommandDispatcher(revision, redesign);
    const redesignManifest = { version: 2, operation: "redesign_bundle" } as never;
    expect(dispatcher.run({ manifest: redesignManifest })).toBe("redesign");
    expect(redesign.run).toHaveBeenCalledOnce();
    expect(revision.run).not.toHaveBeenCalled();
  });
});
