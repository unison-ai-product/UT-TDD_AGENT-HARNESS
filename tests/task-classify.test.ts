import { describe, expect, it } from "vitest";
import { classifyTask } from "../src/task/classify";

describe("U-FR-L1-39: classifyTask public surface", () => {
  it("infers kind from task verbs (most-specific pattern wins)", () => {
    expect(classifyTask({ text: "refactor the projection writer" }).kind).toBe("refactor");
    expect(classifyTask({ text: "fix the failing doctor gate" }).kind).toBe("troubleshoot");
    expect(classifyTask({ text: "add a new endpoint for telemetry" }).kind).toBe("add-feature");
    expect(classifyTask({ text: "design the L4 architecture for search" }).kind).toBe("design");
    expect(classifyTask({ text: "spike a PoC for browser verification" }).kind).toBe("poc");
    expect(classifyTask({ text: "reverse the as-is design of legacy state" }).kind).toBe("reverse");
    expect(classifyTask({ text: "ponder the universe" }).kind).toBe("unknown");
  });

  it("classifies the drive from text and file evidence", () => {
    expect(classifyTask({ text: "alter the db schema" }).drive).toBe("db");
    expect(classifyTask({ text: "build the frontend ui dashboard" }).drive).toBe("frontend");
    expect(classifyTask({ text: "wire the agent tool routing" }).drive).toBe("agent");
    const fallback = classifyTask({ text: "implement the service layer" });
    expect(fallback.drive).toBe("fullstack");
    expect(fallback.drive_confidence).toBeLessThan(0.7);
  });

  it("flags escalation-sensitive areas with a warn finding", () => {
    const result = classifyTask({ text: "change the authentication and payment flow" });
    expect(result.risk_flags).toContain("authentication");
    expect(result.risk_flags).toContain("payment");
    expect(result.findings.some((f) => f.code === "escalation-risk")).toBe(true);
  });

  it("does not flag the legitimate word 'author' as an auth risk", () => {
    const result = classifyTask({ text: "author the design doc for the catalog" });
    expect(result.risk_flags).toEqual([]);
    expect(result.findings.some((f) => f.code === "escalation-risk")).toBe(false);
  });

  it("scales size with affected-file count", () => {
    const small = classifyTask({ text: "tweak one file", affected_files: ["a.ts"] });
    const large = classifyTask({
      text: "broad change",
      affected_files: Array.from({ length: 14 }, (_, i) => `f${i}.ts`),
      dependencies: ["x", "y", "z"],
    });
    expect(small.size).toBe("S");
    expect(large.size).toBe("L");
  });

  it("is deterministic and always reports a difficulty", () => {
    const input = { text: "add authentication to the api", affected_files: ["api.ts"] };
    const a = classifyTask(input);
    const b = classifyTask(input);
    expect(a).toEqual(b);
    expect(a.difficulty).toBeTruthy();
  });
});
