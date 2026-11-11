import { describe, expect, it } from "vitest";
import { buildAdapterPlan } from "../src/runtime/adapter.ts";
import { CLAUDE_EFFORT_ENV } from "../src/runtime/adapter-policy.ts";
import { reasoningEffortSchema } from "../src/schema/team.ts";
import { resolveDelegationRouting } from "../src/team/delegation-routing.ts";

// issue #733 の契約 (provider-invocation-input-validation.md §2 の effort 行)。
// Claude へ渡す effort は middle→medium 以外で下げず、max は Claude 専用。
// 契約 PR + Red (design-protection-diff-gate.md §10.2) のため、未実装の assertion は it.fails で固定する。
// 既存の xhigh→high 前提の assertion は runtime-adapter.test.ts / cli-surface.test.ts 側で it.fails に反転済み。
describe("U-CMDINPUT-004: provider effort passthrough (issue #733)", () => {
  // Red: 現行 src は xhigh を high へ下げ、max は schema が拒否する。
  it.fails("U-CMDINPUT-004: passes Claude xhigh and max through without downgrading", () => {
    for (const effort of ["xhigh", "max"]) {
      expect(reasoningEffortSchema.safeParse(effort).success, effort).toBe(true);
      const plan = buildAdapterPlan(
        { provider: "claude", role: "se", task: "review", model: "claude-sonnet-5-5", effort },
        "hybrid",
      );
      expect(plan.available, effort).toBe(true);
      expect(plan.effort, effort).toBe(effort);
      expect(plan.args, effort).toContain(effort);
      expect(plan.env, effort).toEqual({ [CLAUDE_EFFORT_ENV]: effort });
    }
  });

  // Red: 現行 schema は max を拒否し provider_effort_invalid になる。
  it.fails("U-CMDINPUT-004: reviewer and worker routing accept Claude max effort", () => {
    const reviewer = resolveDelegationRouting({
      provider: "claude",
      role: "blind-reviewer",
      task: "review the diff",
      effort: "max",
    });
    expect(reviewer).toMatchObject({ ok: true, effort: "max", effort_source: "explicit" });

    const worker = resolveDelegationRouting({
      provider: "claude",
      role: "se",
      task: "implement the parser module",
      effort: "max",
    });
    expect(worker).toMatchObject({ ok: true, effort: "max", effort_source: "explicit" });
  });

  // max は Claude 専用。Codex の max は実機受理が未測定なので拒否する (現行 src でも通る)。
  it("U-CMDINPUT-004: routing rejects max effort for codex", () => {
    for (const role of ["blind-reviewer", "se"]) {
      expect(
        resolveDelegationRouting({
          provider: "codex",
          role,
          task: "review the diff",
          effort: "max",
        }),
        role,
      ).toEqual({ ok: false, message: "provider_effort_invalid" });
    }
  });

  it("U-CMDINPUT-004: buildAdapterPlan rejects max effort for codex", () => {
    const plan = buildAdapterPlan(
      { provider: "codex", role: "se", task: "review", model: "gpt-5.4", effort: "max" },
      "hybrid",
    );
    expect(plan.available).toBe(false);
    expect(plan.messages).toEqual(["provider_effort_invalid"]);
    expect(plan.args).toEqual([]);
    expect(plan.env).toBeUndefined();
  });
});
