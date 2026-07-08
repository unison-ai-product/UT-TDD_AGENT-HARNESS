import { describe, expect, it } from "vitest";
import { buildAdvisorDecision } from "../src/team/advisor-policy";
import {
  inferTaskDifficulty,
  inferTaskIntent,
  MODEL_IDS,
  selectTeamModel,
} from "../src/team/model-policy";

describe("team model policy", () => {
  it("infers critical difficulty from high-risk task terms", () => {
    expect(inferTaskDifficulty({ task: "DB schema migration for production auth" })).toEqual({
      difficulty: "critical",
      source: "inferred",
    });
  });

  it("uses fast codex model and middle effort for lightweight work (PO rule 2026-07-08)", () => {
    const selection = selectTeamModel({
      provider: "codex",
      role: "docs",
      engine: "codex-pg",
      task: "README typo",
    });

    expect(selection).toMatchObject({
      difficulty: "trivial",
      model_family: "fast",
      model: MODEL_IDS.codex.spark,
      reasoning_effort: "middle",
      task_intent: "docs",
    });
  });

  it("uses frontier model and xhigh effort for critical codex review work", () => {
    const selection = selectTeamModel({
      provider: "codex",
      role: "qa",
      engine: "codex-tl",
      task: "review production security migration",
    });

    expect(selection).toMatchObject({
      difficulty: "critical",
      model_family: "frontier",
      // frontier = T0 最上位。tier-router TIER_TABLE.T0.codex と整合。
      model: MODEL_IDS.codex.frontier,
      reasoning_effort: "xhigh",
      task_intent: "review",
    });
  });

  it("keeps explicit Claude engine family instead of escalating pmo-sonnet to opus", () => {
    const selection = selectTeamModel({
      provider: "claude",
      role: "tl",
      engine: "pmo-sonnet",
      task: "production security migration",
    });

    expect(selection.model_family).toBe("frontier");
    expect(selection.model).toBe(MODEL_IDS.claude.sonnet);
    expect(selection.model_source).toBe("engine");
    expect(selection.reasoning_effort).toBe("high");
  });

  it("maps docs, research, UI/UX, and implementation intent to the requested effort defaults", () => {
    expect(inferTaskIntent({ role: "docs", task: "update governance docs" })).toBe("docs");
    expect(inferTaskIntent({ task: "research public SDK sources" })).toBe("research");
    expect(inferTaskIntent({ role: "uiux", task: "screen visual design" })).toBe("uiux");
    expect(inferTaskIntent({ role: "se", task: "implement setup wrapper" })).toBe("implementation");

    expect(
      selectTeamModel({
        provider: "claude",
        role: "uiux",
        engine: "pmo-sonnet",
        task: "screen visual design",
      }),
    ).toMatchObject({
      model: MODEL_IDS.claude.sonnet,
      reasoning_effort: "xhigh",
      task_intent: "uiux",
    });
    expect(
      selectTeamModel({
        provider: "codex",
        role: "se",
        engine: "codex-se",
        task: "implement setup wrapper",
      }).reasoning_effort,
    ).toBe("middle");
  });

  it("honors explicit difficulty, model, and effort overrides", () => {
    const selection = selectTeamModel({
      provider: "codex",
      role: "se",
      engine: "codex-se",
      task: "implement",
      difficulty: "simple",
      model: "gpt-custom",
      effort: "xhigh",
    });

    expect(selection).toMatchObject({
      difficulty: "simple",
      difficulty_source: "explicit",
      model: "gpt-custom",
      model_source: "explicit",
      reasoning_effort: "xhigh",
      effort_source: "explicit",
    });
  });

  it("routes sonnet design decisions to fable with a codex consult fallback", () => {
    const claude = buildAdvisorDecision({
      task: "review whether the release gate is safe to close",
      mode: "hybrid",
      decisionKind: "design",
      currentModel: MODEL_IDS.claude.sonnet,
    });

    expect(claude).toMatchObject({
      provider: "claude",
      model: MODEL_IDS.claude.fable,
      effort: "middle",
      consultation_mode: "consult",
      decision_kind: "design",
      decision_kind_source: "explicit",
      current_model_lower_than_advisor: true,
      adapterPlan: {
        provider: "claude",
        model: MODEL_IDS.claude.fable,
        dry_run: true,
      },
      fallback: {
        provider: "codex",
        model: MODEL_IDS.codex.frontier,
        effort: "middle",
        consultation_mode: "consult",
      },
    });
    expect(claude.adapterPlan.stdin).toContain("upper-model advisor");
  });

  it("routes opus design decisions to fable with an adversarial codex fallback", () => {
    const decision = buildAdvisorDecision({
      task: "decide the architecture split for the projection layer",
      mode: "hybrid",
      decisionKind: "design",
      currentModel: MODEL_IDS.claude.opus,
    });

    expect(decision).toMatchObject({
      provider: "claude",
      model: MODEL_IDS.claude.fable,
      effort: "middle",
      consultation_mode: "consult",
      fallback: {
        provider: "codex",
        model: MODEL_IDS.codex.frontier,
        effort: "middle",
        consultation_mode: "adversarial",
      },
    });
    expect(decision.fallback?.adapterPlan.stdin).toContain("adversarial verifier");
  });

  it("routes implementation decisions to the codex frontier model", () => {
    const sonnet = buildAdvisorDecision({
      task: "implement the retry logic fix in src",
      mode: "hybrid",
      currentModel: MODEL_IDS.claude.sonnet,
    });
    expect(sonnet).toMatchObject({
      provider: "codex",
      model: MODEL_IDS.codex.frontier,
      effort: "middle",
      consultation_mode: "consult",
      decision_kind: "implementation",
      decision_kind_source: "inferred",
    });
    expect(sonnet.fallback).toBeUndefined();

    const opus = buildAdvisorDecision({
      task: "implement the retry logic fix in src",
      mode: "hybrid",
      currentModel: MODEL_IDS.claude.opus,
    });
    expect(opus).toMatchObject({
      provider: "codex",
      model: MODEL_IDS.codex.frontier,
      effort: "middle",
      consultation_mode: "adversarial",
    });
    expect(opus.adapterPlan.stdin).toContain("adversarial verifier");
  });

  it("builds executable codex advisor plans in codex-only mode", () => {
    const codex = buildAdvisorDecision({
      task: "advise on uncertain implementation close",
      mode: "codex-only",
      provider: "codex",
      execute: true,
    });

    expect(codex).toMatchObject({
      provider: "codex",
      model: MODEL_IDS.codex.frontier,
      effort: "middle",
      consultation_mode: "consult",
      adapterPlan: {
        provider: "codex",
        model: MODEL_IDS.codex.frontier,
        dry_run: false,
      },
    });
    expect(codex.adapterPlan.args).toEqual(["exec", "-m", MODEL_IDS.codex.frontier, "-"]);
    expect(codex.fallback).toBeUndefined();
  });

  it("omits the codex fallback in claude-only mode", () => {
    const decision = buildAdvisorDecision({
      task: "review whether the release gate is safe to close",
      mode: "claude-only",
      decisionKind: "design",
      currentModel: MODEL_IDS.claude.sonnet,
    });
    expect(decision).toMatchObject({
      provider: "claude",
      model: MODEL_IDS.claude.fable,
    });
    expect(decision.fallback).toBeUndefined();
  });

  it("treats older sonnet and haiku generations as lower than the advisor family", () => {
    for (const currentModel of ["claude-sonnet-4-6", "claude-haiku-4-5-20251001"]) {
      expect(
        buildAdvisorDecision({
          task: "review whether the release gate is safe to close",
          mode: "hybrid",
          decisionKind: "design",
          currentModel,
        }),
      ).toMatchObject({
        provider: "claude",
        model: MODEL_IDS.claude.fable,
        current_model_lower_than_advisor: true,
      });
    }
  });
});
