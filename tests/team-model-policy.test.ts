import { describe, expect, it } from "vitest";
import { OPENAI_PRICING } from "../src/state-db/token-tracker";
import { TIER_TABLE } from "../src/task/tier-router-policy";
import { buildAdvisorDecision } from "../src/team/advisor-policy";
import {
  advisorHeavyUseRecommended,
  escalateShallowResponse,
  inferTaskDifficulty,
  inferTaskIntent,
  MODEL_EFFORT_LADDER,
  MODEL_IDS,
  PLAN_AGENT_MODELS,
  REVIEW_LANE_MODELS,
  REVIEW_LANES,
  selectTeamModel,
} from "../src/team/model-policy";

describe("team model policy", () => {
  it("infers critical difficulty from high-risk task terms", () => {
    expect(inferTaskDifficulty({ task: "DB schema migration for production auth" })).toEqual({
      difficulty: "critical",
      source: "inferred",
    });
  });

  it("uses mini and xhigh effort for trivial doc patches (effort ladder, PO rule 2026-07-14)", () => {
    const selection = selectTeamModel({
      provider: "codex",
      role: "docs",
      engine: "codex-pg",
      task: "README typo",
    });

    expect(selection).toMatchObject({
      difficulty: "trivial",
      model_family: "fast",
      model: MODEL_IDS.codex.mini,
      reasoning_effort: "xhigh",
      task_intent: "docs",
    });
  });

  it("uses frontier model at ladder-base low effort for critical codex review work", () => {
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
      // Sol は基準 low (effort ladder、PO rule 2026-07-14)。浅い時は middle へ引き上げ。
      reasoning_effort: "low",
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
    // Sonnet は基準 middle (effort ladder、PO rule 2026-07-14)。浅い時は high へ引き上げ。
    expect(selection.reasoning_effort).toBe("middle");
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
    // 実装は luna へ解決され effort=high 基準 (PO rule 2026-07-14)。
    expect(
      selectTeamModel({
        provider: "codex",
        role: "se",
        engine: "codex-se",
        task: "implement setup wrapper",
      }),
    ).toMatchObject({ model: MODEL_IDS.codex.luna, reasoning_effort: "high" });
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

  it("routes sonnet design decisions to sol with a fable fallback (PO rule 2026-07-14)", () => {
    const claude = buildAdvisorDecision({
      task: "review whether the release gate is safe to close",
      mode: "hybrid",
      decisionKind: "design",
      currentModel: MODEL_IDS.claude.sonnet,
    });

    expect(claude).toMatchObject({
      provider: "codex",
      model: MODEL_IDS.codex.frontier,
      effort: "middle",
      consultation_mode: "consult",
      decision_kind: "design",
      decision_kind_source: "explicit",
      current_model_lower_than_advisor: true,
      adapterPlan: {
        provider: "codex",
        model: MODEL_IDS.codex.frontier,
        dry_run: true,
      },
      fallback: {
        provider: "claude",
        model: MODEL_IDS.claude.fable,
        effort: "middle",
        consultation_mode: "consult",
      },
    });
    expect(claude.adapterPlan.stdin).toContain("upper-model advisor");
  });

  it("routes opus design decisions to adversarial sol with a fable fallback", () => {
    const decision = buildAdvisorDecision({
      task: "decide the architecture split for the projection layer",
      mode: "hybrid",
      decisionKind: "design",
      currentModel: MODEL_IDS.claude.opus,
    });

    expect(decision).toMatchObject({
      provider: "codex",
      model: MODEL_IDS.codex.frontier,
      effort: "middle",
      consultation_mode: "adversarial",
      fallback: {
        provider: "claude",
        model: MODEL_IDS.claude.fable,
        effort: "middle",
        consultation_mode: "consult",
      },
    });
    expect(decision.adapterPlan.stdin).toContain("adversarial verifier");
  });

  it("routes implementation decisions to the codex frontier model", () => {
    const sonnet = buildAdvisorDecision({
      task: "implement the retry logic in src",
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
    expect(sonnet.fallback).toMatchObject({
      provider: "claude",
      model: MODEL_IDS.claude.fable,
    });

    const opus = buildAdvisorDecision({
      task: "implement the retry logic in src",
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
        provider: "codex",
        model: MODEL_IDS.codex.frontier,
        current_model_lower_than_advisor: true,
      });
    }
  });
});

describe("task-kind routing v2 (PLAN-L7-430, PO rule 2026-07-14)", () => {
  it("U-ROUTE2-001: codex テスト実装は terra + middle effort", () => {
    const selection = selectTeamModel({
      provider: "codex",
      role: "se",
      engine: "codex-se",
      task: "write vitest oracle for the retry logic",
    });
    expect(selection).toMatchObject({
      model: MODEL_IDS.codex.worker,
      // Terra は基準 low (effort ladder)。浅い時 middle、なお浅ければ Sol low へ乗り換え。
      reasoning_effort: "low",
      task_intent: "test",
    });
  });

  it("U-ROUTE2-002: codex 実装 (非軽量) は luna + high effort (worker middle 既定の上書き)", () => {
    const selection = selectTeamModel({
      provider: "codex",
      role: "se",
      engine: "codex-se",
      task: "implement the projection ingestion pipeline in src",
    });
    expect(selection).toMatchObject({
      model: MODEL_IDS.codex.luna,
      reasoning_effort: "high",
      task_intent: "implementation",
    });
  });

  it("U-ROUTE2-003: codex 軽量実装は spark、研究/web は mini", () => {
    expect(
      selectTeamModel({
        provider: "codex",
        role: "se",
        engine: "codex-se",
        task: "rename src variable",
        difficulty: "simple",
      }).model,
    ).toBe(MODEL_IDS.codex.spark);
    expect(
      selectTeamModel({
        provider: "codex",
        role: "pg",
        engine: "codex-pg",
        task: "web research on library sources",
      }).model,
    ).toBe(MODEL_IDS.codex.mini);
  });

  it("U-ROUTE2-004: codex 設計/検証は sol", () => {
    expect(
      selectTeamModel({
        provider: "codex",
        role: "se",
        engine: "codex-se",
        task: "architecture contract for the projection layer",
      }).model,
    ).toBe(MODEL_IDS.codex.frontier);
  });

  it("U-ROUTE2-014: task-kind remains primary for critical implementation and test work", () => {
    expect(
      selectTeamModel({
        provider: "codex",
        role: "se",
        engine: "codex-se",
        task: "implement database migration for production",
      }),
    ).toMatchObject({
      difficulty: "critical",
      task_intent: "implementation",
      model: MODEL_IDS.codex.luna,
    });
    expect(
      selectTeamModel({
        provider: "codex",
        role: "se",
        engine: "codex-se",
        task: "write test for database migration",
      }),
    ).toMatchObject({
      difficulty: "critical",
      task_intent: "test",
      model: MODEL_IDS.codex.worker,
    });
  });

  it("U-ROUTE2-015: intent inference uses token boundaries instead of substrings", () => {
    expect(inferTaskIntent({ task: "summarize the contest result" })).toBe("general");
    expect(inferTaskIntent({ task: "build adapter" })).toBe("implementation");
    expect(inferTaskIntent({ task: "update build script" })).toBe("implementation");
    expect(inferTaskIntent({ task: "guide patch" })).toBe("general");
  });

  it("U-ROUTE2-016: overlapping test/review wording preserves the explicit test task-kind", () => {
    expect(
      selectTeamModel({
        provider: "codex",
        role: "se",
        engine: "codex-se",
        task: "write a vitest test to verify retry behavior",
      }),
    ).toMatchObject({ task_intent: "test", model: MODEL_IDS.codex.worker });
  });

  it("U-ROUTE2-017: Claude task-kind overrides a lower explicit engine family", () => {
    expect(
      selectTeamModel({
        provider: "claude",
        role: "se",
        engine: MODEL_IDS.claude.sonnet,
        task: "author the architecture design contract",
      }),
    ).toMatchObject({ task_intent: "design", model: MODEL_IDS.claude.opus });
  });

  it("U-ROUTE2-005: claude 設計ドキュメント作成は opus、doc 修正は sonnet、doc パッチは haiku", () => {
    expect(
      selectTeamModel({
        provider: "claude",
        role: "se",
        engine: "generic",
        task: "author the module decomposition design document architecture",
      }).model,
    ).toBe(MODEL_IDS.claude.opus);
    expect(
      selectTeamModel({
        provider: "claude",
        role: "docs",
        engine: "generic",
        task: "update the governance handbook section wording",
        difficulty: "standard",
      }).model,
    ).toBe(MODEL_IDS.claude.sonnet);
    expect(
      selectTeamModel({
        provider: "claude",
        role: "docs",
        engine: "generic",
        task: "readme typo",
      }).model,
    ).toBe(MODEL_IDS.claude.haiku);
  });

  it("U-ROUTE2-006: tier-router T1 codex は luna、T0 は sol/opus のまま", () => {
    expect(TIER_TABLE.T1.codex).toBe(MODEL_IDS.codex.luna);
    expect(TIER_TABLE.T0.codex).toBe(MODEL_IDS.codex.frontier);
    expect(TIER_TABLE.T0.claude).toBe(MODEL_IDS.claude.opus);
  });

  it("U-ROUTE2-007: luna の公式 pricing が登録されている (cost null 回避)", () => {
    expect(OPENAI_PRICING[MODEL_IDS.codex.luna]).toEqual({ input: 1, cached: 0.1, output: 6 });
  });

  it("U-ROUTE2-008: advisor uiux 判断は fable 一次 + sol fallback (PO: Fable、次点 Sol)", () => {
    const decision = buildAdvisorDecision({
      task: "judge the UI wireframe direction",
      mode: "hybrid",
      decisionKind: "uiux",
      currentModel: MODEL_IDS.claude.sonnet,
    });
    expect(decision).toMatchObject({
      provider: "claude",
      model: MODEL_IDS.claude.fable,
      decision_kind: "uiux",
    });
    expect(decision.fallback).toMatchObject({
      provider: "codex",
      model: MODEL_IDS.codex.frontier,
    });
  });

  it("U-ROUTE2-009: troubleshooting は task 文から推論され sol 一次", () => {
    const decision = buildAdvisorDecision({
      task: "debug the flaky crash in the session log ingestion",
      mode: "hybrid",
      currentModel: MODEL_IDS.claude.sonnet,
    });
    expect(decision).toMatchObject({
      provider: "codex",
      model: MODEL_IDS.codex.frontier,
      decision_kind: "troubleshooting",
      decision_kind_source: "inferred",
    });
  });

  it("U-ROUTE2-010: 想定を下回る orchestrator は advisor 多用を推奨 (未知モデルは推奨側へ fail)", () => {
    expect(
      advisorHeavyUseRecommended({
        provider: "claude",
        phase: "design",
        currentModel: MODEL_IDS.claude.sonnet,
      }),
    ).toBe(true);
    expect(
      advisorHeavyUseRecommended({
        provider: "claude",
        phase: "design",
        currentModel: MODEL_IDS.claude.opus,
      }),
    ).toBe(false);
    expect(
      advisorHeavyUseRecommended({
        provider: "codex",
        phase: "implementation",
        currentModel: MODEL_IDS.codex.spark,
      }),
    ).toBe(true);
    expect(
      advisorHeavyUseRecommended({
        provider: "codex",
        phase: "design",
        currentModel: "unknown-model-id",
      }),
    ).toBe(true);
  });

  it("U-ROUTE2-012: effort ladder 基準 — sol/terra/fable=low, sonnet=middle, opus/spark(luna)=high, mini=xhigh", () => {
    const base = (model: string) => MODEL_EFFORT_LADDER[model]?.base;
    expect(base(MODEL_IDS.codex.frontier)).toBe("low");
    expect(base(MODEL_IDS.codex.worker)).toBe("low");
    expect(base(MODEL_IDS.claude.fable)).toBe("low");
    expect(base(MODEL_IDS.claude.sonnet)).toBe("middle");
    expect(base(MODEL_IDS.claude.opus)).toBe("high");
    expect(base(MODEL_IDS.codex.luna)).toBe("high");
    expect(base(MODEL_IDS.codex.spark)).toBe("high");
    expect(base(MODEL_IDS.codex.mini)).toBe("xhigh");
  });

  it("U-ROUTE2-013: 浅い回答のエスカレーション — terra low→middle→sol low、opus high→xhigh、行き止まりは null", () => {
    expect(
      escalateShallowResponse({ model: MODEL_IDS.codex.worker, currentEffort: "low" }),
    ).toEqual({ model: MODEL_IDS.codex.worker, effort: "middle" });
    expect(
      escalateShallowResponse({ model: MODEL_IDS.codex.worker, currentEffort: "middle" }),
    ).toEqual({ model: MODEL_IDS.codex.frontier, effort: "low" });
    expect(
      escalateShallowResponse({ model: MODEL_IDS.codex.frontier, currentEffort: "low" }),
    ).toEqual({ model: MODEL_IDS.codex.frontier, effort: "middle" });
    expect(
      escalateShallowResponse({ model: MODEL_IDS.codex.frontier, currentEffort: "middle" }),
    ).toBeNull();
    expect(
      escalateShallowResponse({ model: MODEL_IDS.claude.opus, currentEffort: "high" }),
    ).toEqual({ model: MODEL_IDS.claude.opus, effort: "xhigh" });
    expect(
      escalateShallowResponse({ model: MODEL_IDS.codex.mini, currentEffort: "xhigh" }),
    ).toBeNull();
    expect(
      escalateShallowResponse({ model: MODEL_IDS.codex.worker, currentEffort: "high" }),
    ).toBeNull();
  });

  it("U-ROUTE2-011: レビュー 3 面と プランエージェント (fable 一次 / sol fallback) の正本", () => {
    expect(REVIEW_LANES).toEqual(["design-review", "implementation-review", "blind-review"]);
    for (const lane of REVIEW_LANES) {
      expect(REVIEW_LANE_MODELS[lane]).toEqual({
        claude: MODEL_IDS.claude.opus,
        codex: MODEL_IDS.codex.frontier,
      });
    }
    expect(PLAN_AGENT_MODELS).toEqual({
      primary: MODEL_IDS.claude.fable,
      fallback: MODEL_IDS.codex.frontier,
    });
  });
});
