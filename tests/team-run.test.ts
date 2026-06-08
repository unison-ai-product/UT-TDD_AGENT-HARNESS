import { describe, expect, it } from "vitest";
import type { TeamDefinition } from "../src/schema/team";
import { providerFromEngine, validateTeamRun } from "../src/team/run";

const baseTeam = (members: TeamDefinition["members"]): TeamDefinition => ({
  name: "review-team",
  strategy: "sequential",
  max_parallel: 8,
  members,
});

describe("team run validation", () => {
  it("maps engine names to providers", () => {
    expect(providerFromEngine("codex-se")).toBe("codex");
    expect(providerFromEngine("pmo-sonnet")).toBe("claude");
    expect(providerFromEngine("qa-test")).toBe("local");
  });

  it("passes hybrid team when worker and reviewer use different providers", () => {
    const result = validateTeamRun(
      baseTeam([
        { role: "se", engine: "codex-se", task: "implement" },
        { role: "tl", engine: "pmo-sonnet", task: "review", serialize_after: "se" },
      ]),
      "hybrid",
    );
    expect(result.ok).toBe(true);
    expect(result.providers).toEqual(["codex", "claude"]);
  });

  it("fails outside hybrid mode", () => {
    const result = validateTeamRun(
      baseTeam([{ role: "se", engine: "codex-se", task: "implement" }]),
      "codex-only",
    );
    expect(result.ok).toBe(false);
    expect(result.messages).toContain("team run requires hybrid mode");
  });

  it("fails hybrid team with same-provider worker and reviewer", () => {
    const result = validateTeamRun(
      baseTeam([
        { role: "se", engine: "codex-se", task: "implement" },
        { role: "tl", engine: "codex-tl", task: "review" },
      ]),
      "hybrid",
    );
    expect(result.ok).toBe(false);
    expect(result.messages).toContain(
      "hybrid team run requires worker and reviewer on different providers",
    );
  });

  it("fails duplicate role/provider assignments", () => {
    const result = validateTeamRun(
      baseTeam([
        { role: "se", engine: "codex-se", task: "a" },
        { role: "se", engine: "codex-pg", task: "b" },
        { role: "tl", engine: "pmo-sonnet", task: "review" },
      ]),
      "hybrid",
    );
    expect(result.ok).toBe(false);
    expect(result.messages).toContain("duplicate role/provider assignment: se:codex");
  });
});
