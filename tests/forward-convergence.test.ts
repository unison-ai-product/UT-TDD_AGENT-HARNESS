import { describe, expect, it } from "vitest";
import {
  analyzeForwardConvergence,
  type ConvergencePlan,
  forwardConvergenceMessages,
  hasLocalImplOnlyDisposition,
  isLanded,
  isSpineConnected,
  parseConvergencePlan,
} from "../src/lint/forward-convergence";

function plan(overrides: Partial<ConvergencePlan> = {}): ConvergencePlan {
  return {
    plan_id: "PLAN-L7-900-x",
    kind: "impl",
    status: "confirmed",
    parentDesign: null,
    requires: [],
    backpropDecision: "",
    backpropDecisionReason: "",
    ...overrides,
  };
}

describe("forward-convergence: spine 接続判定", () => {
  it("roadmap span 登録は spine-internal", () => {
    const p = plan({ plan_id: "PLAN-L7-44-a" });
    expect(isSpineConnected(p, new Set(["PLAN-L7-44-a"]))).toBe(true);
  });

  it("parent_design が docs/design 配下なら spine-internal", () => {
    const p = plan({ parentDesign: "docs/design/harness/L6-function/function-spec.md" });
    expect(isSpineConnected(p, new Set())).toBe(true);
  });

  it("requires が上流設計 PLAN (L1-L6) を指せば spine-internal", () => {
    const p = plan({ requires: ["PLAN-L6-10-vmodel-lint"] });
    expect(isSpineConnected(p, new Set())).toBe(true);
  });

  it("どの接続も無ければ spine-外", () => {
    const p = plan({ requires: ["PLAN-L7-03-setup-solo-team"] });
    expect(isSpineConnected(p, new Set())).toBe(false);
  });

  it("parent_design が docs/process / docs/adr は spine-外 (Codex Important: 境界回帰防止)", () => {
    // 規範/プロセス/ADR 由来は L6 設計 / L1-L6 Forward PLAN への降下ではない = spine-外。
    expect(
      isSpineConnected(plan({ parentDesign: "docs/process/modes/refactor.md" }), new Set()),
    ).toBe(false);
    expect(
      isSpineConnected(
        plan({ parentDesign: "docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md" }),
        new Set(),
      ),
    ).toBe(false);
  });
});

describe("forward-convergence: landed / disposition", () => {
  it("confirmed/completed は landed、draft は非 landed", () => {
    expect(isLanded(plan({ status: "confirmed" }))).toBe(true);
    expect(isLanded(plan({ status: "completed" }))).toBe(true);
    expect(isLanded(plan({ status: "draft" }))).toBe(false);
  });

  it("not_required は理由必須 (空 prose は免除にしない)", () => {
    expect(
      hasLocalImplOnlyDisposition(
        plan({ backpropDecision: "not_required", backpropDecisionReason: "" }),
      ),
    ).toBe(false);
    expect(
      hasLocalImplOnlyDisposition(
        plan({
          backpropDecision: "not_required",
          backpropDecisionReason: "upstream 不変のためローカル完結",
        }),
      ),
    ).toBe(true);
    expect(hasLocalImplOnlyDisposition(plan({ backpropDecision: "local_impl_only" }))).toBe(true);
  });
});

describe("forward-convergence: 分類", () => {
  it("landed × spine-外 × 未集約 = unconverged-landed (違反候補)", () => {
    const r = analyzeForwardConvergence(
      [plan({ plan_id: "PLAN-L7-999-orphan" })],
      new Set(),
      new Set(),
    );
    expect(r.unconvergedLanded).toEqual(["PLAN-L7-999-orphan"]);
    expect(r.ok).toBe(false);
  });

  it("draft/deferred は違反にしない (将来作業 = draft-deferred)", () => {
    const r = analyzeForwardConvergence(
      [plan({ plan_id: "PLAN-L7-157-distribution-clean-pull", status: "draft" })],
      new Set(),
      new Set(),
    );
    expect(r.unconvergedLanded).toEqual([]);
    expect(r.draftDeferred).toEqual(["PLAN-L7-157-distribution-clean-pull"]);
    expect(r.ok).toBe(true);
  });

  it("spine 接続済 landed impl は flag しない (false-positive 非発火)", () => {
    const r = analyzeForwardConvergence(
      [plan({ plan_id: "PLAN-L7-44-a" })],
      new Set(["PLAN-L7-44-a"]),
      new Set(),
    );
    expect(r.unconvergedLanded).toEqual([]);
    expect(r.spineInternal).toEqual(["PLAN-L7-44-a"]);
  });

  it("Reverse 参照済 landed は converged", () => {
    const r = analyzeForwardConvergence(
      [plan({ plan_id: "PLAN-L7-500-merged" })],
      new Set(),
      new Set(["PLAN-L7-500-merged"]),
    );
    expect(r.converged).toEqual(["PLAN-L7-500-merged"]);
    expect(r.ok).toBe(true);
  });

  it("local_impl_only disposition は local-impl-only", () => {
    const r = analyzeForwardConvergence(
      [plan({ plan_id: "PLAN-L7-501-local", backpropDecision: "local_impl_only" })],
      new Set(),
      new Set(),
    );
    expect(r.localImplOnly).toEqual(["PLAN-L7-501-local"]);
    expect(r.ok).toBe(true);
  });

  it("scope 外 kind (poc 等) は対象外 = scrum-reverse の SSoT に委ねる", () => {
    const r = analyzeForwardConvergence(
      [plan({ plan_id: "PLAN-DISCOVERY-08-x", kind: "poc", status: "confirmed" })],
      new Set(),
      new Set(),
    );
    expect(r.classifications).toEqual([]);
    expect(r.ok).toBe(true);
  });
});

describe("forward-convergence: parse + messages", () => {
  it("parseConvergencePlan が frontmatter を抽出", () => {
    const content = [
      "---",
      "plan_id: PLAN-L7-700-y",
      "kind: impl",
      "status: confirmed",
      "parent_design: docs/design/harness/L6-function/function-spec.md",
      "backprop_decision: local_impl_only",
      "dependencies:",
      "  requires:",
      "    - PLAN-L6-10-vmodel-lint",
      "---",
      "# body",
    ].join("\n");
    const p = parseConvergencePlan("PLAN-L7-700-y.md", content);
    expect(p.plan_id).toBe("PLAN-L7-700-y");
    expect(p.kind).toBe("impl");
    expect(p.parentDesign).toBe("docs/design/harness/L6-function/function-spec.md");
    expect(p.requires).toContain("PLAN-L6-10-vmodel-lint");
    expect(p.backpropDecision).toBe("local_impl_only");
  });

  it("messages: ok は report-only 文言、violation は件数 + ids", () => {
    const okMsg = forwardConvergenceMessages(analyzeForwardConvergence([], new Set(), new Set()));
    expect(okMsg[0]).toContain("forward-convergence — OK");
    expect(okMsg[0]).toContain("report-only");

    const badMsg = forwardConvergenceMessages(
      analyzeForwardConvergence([plan({ plan_id: "PLAN-L7-999-orphan" })], new Set(), new Set()),
    );
    expect(badMsg[0]).toContain("未集約 landed impl 1 件");
    expect(badMsg[0]).toContain("PLAN-L7-999-orphan");
  });
});
