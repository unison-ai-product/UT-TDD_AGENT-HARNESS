import { describe, expect, it } from "vitest";
import { VALID_ORCHESTRATION_MODES } from "../src/schema";
import { resolveVmodelInjection } from "../src/vmodel/injection";

describe("vmodel layer-context injection", () => {
  it("returns the five required injection keys for drive x layer", () => {
    const injection = resolveVmodelInjection("db", "L7");

    expect(injection.drive).toBe("db");
    expect(injection.layer).toBe("L7");
    expect(injection.owner_role).toBe("se");
    expect(injection.mandatory_agents).toContain("dba-reviewer");
    expect(injection.recommended_skills).toContain("data-migration");
    expect(injection.recommended_commands).toContain("ut-tdd doctor");
    expect(VALID_ORCHESTRATION_MODES).toContain(injection.orchestration_mode);
  });

  it("keeps hybrid-only work explicit through orchestration_mode", () => {
    const injection = resolveVmodelInjection("agent", "L7");

    expect(injection.orchestration_mode).toBe("claude_judge_codex_impl");
    expect(injection.mandatory_agents).toContain("frontier-reviewer");
  });

  it("rejects invalid drive or layer values", () => {
    expect(() => resolveVmodelInjection("reverse", "L7")).toThrow();
    expect(() => resolveVmodelInjection("db", "L15")).toThrow();
  });
});
