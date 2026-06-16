import { describe, expect, it } from "vitest";
import { detectMode } from "../src/runtime/detect";

describe("detectMode (requirements_v1.2 §7.1)", () => {
  it("returns one of the 4 valid modes", () => {
    const d = detectMode();
    expect(["standalone", "claude-only", "codex-only", "hybrid"]).toContain(d.mode);
    expect(typeof d.claude).toBe("boolean");
    expect(typeof d.codex).toBe("boolean");
  });

  it("hybrid iff both runtimes available", () => {
    const d = detectMode();
    expect(d.mode === "hybrid").toBe(d.claude && d.codex);
  });

  it("uses provider spawnability rather than command-name presence", () => {
    const d = detectMode({
      env: {},
      isProviderSpawnable: (provider) => provider === "claude",
    });

    expect(d).toMatchObject({
      mode: "claude-only",
      claude: true,
      codex: false,
      availableRuntimes: ["claude"],
      missingRuntimes: ["codex"],
    });
  });

  it("keeps current runtime env signals available even without a successful probe", () => {
    const d = detectMode({
      env: { CODEX_HOME: "/tmp/codex" },
      isProviderSpawnable: () => false,
    });

    expect(d).toMatchObject({
      mode: "codex-only",
      codex: true,
      currentRuntime: "codex",
    });
  });
});
