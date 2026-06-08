import { describe, expect, it } from "vitest";
import { buildAdapterPlan, providerAvailable } from "../src/runtime/adapter";

describe("runtime adapter plan", () => {
  it("checks provider availability by execution mode", () => {
    expect(providerAvailable("codex", "codex-only")).toBe(true);
    expect(providerAvailable("codex", "claude-only")).toBe(false);
    expect(providerAvailable("claude", "hybrid")).toBe(true);
  });

  it("builds dry-run codex command plan", () => {
    const plan = buildAdapterPlan(
      { provider: "codex", role: "se", task: "implement", planId: "PLAN-L4-99-x" },
      "hybrid",
    );
    expect(plan.available).toBe(true);
    expect(plan.dry_run).toBe(true);
    expect(plan.command).toBe("codex");
    expect(plan.args).toContain("exec");
    expect(plan.args).toContain("--plan-id");
  });

  it("marks unavailable provider as not available", () => {
    const plan = buildAdapterPlan({ provider: "claude", role: "tl", task: "review" }, "codex-only");
    expect(plan.available).toBe(false);
    expect(plan.messages[0]).toContain("not available");
  });
});
