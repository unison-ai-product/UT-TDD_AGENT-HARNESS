import { describe, expect, it } from "vitest";
import type { RuntimeDetection } from "../src/runtime/detect";
import {
  assignCross,
  FRONTIER_MODELS,
  FRONTIER_ROLES,
  other,
  ROLE_ARCHETYPE,
  resolveModel,
  roster,
  route,
  TIER_TABLE,
  tierFor,
} from "../src/task/tier-router";

function det(
  mode: RuntimeDetection["mode"],
  currentRuntime: RuntimeDetection["currentRuntime"],
): RuntimeDetection {
  return {
    mode,
    claude: mode === "hybrid" || mode === "claude-only",
    codex: mode === "hybrid" || mode === "codex-only",
    currentRuntime,
    availableRuntimes: [],
    missingRuntimes: [],
  };
}

describe("U-TIER: cost-tiered provider router", () => {
  it("U-TIER-001: archetype が tier 帯を決める (相談/検証=T0, ワーカー=T1/T2)", () => {
    expect(tierFor("tl", "trivial", [])).toBe("T0");
    expect(tierFor("uiux", "critical", [])).toBe("T0");
    expect(tierFor("qa", "standard", [])).toBe("T0");
    expect(tierFor("se", "trivial", [])).toBe("T2");
    expect(tierFor("se", "standard", [])).toBe("T1");
    expect(tierFor("docs", "trivial", [])).toBe("T2");
  });

  it("U-TIER-002: ワーカーは原則 T2、難易度↑ or risk で T1 (原則安く + risk override)", () => {
    expect(tierFor("se", "simple", [])).toBe("T2");
    expect(tierFor("se", "complex", [])).toBe("T1");
    expect(tierFor("se", "trivial", ["license"])).toBe("T1");
  });

  it("U-TIER-003: ワーカーは T0 に解決できない (fail-close 不変条件)", () => {
    expect(() => resolveModel("se", "T0", "claude")).toThrow(/invariant/);
    expect(() => resolveModel("docs", "T0", "codex")).toThrow(/invariant/);
    expect(resolveModel("se", "T2", "claude")).toBe("claude-haiku-4-5");
    expect(resolveModel("se", "T1", "codex")).toBe("gpt-5.4");
  });

  it("U-TIER-004: GPT(Codex) も Claude と対称 (全 role 両 provider・同 archetype)", () => {
    const r = roster();
    expect(r).toHaveLength(5);
    for (const binding of r) {
      expect(binding.claude).toMatch(/^claude-/);
      expect(binding.codex).toMatch(/^gpt-/);
      expect(binding.archetype).toBe(ROLE_ARCHETYPE[binding.role]);
    }
    for (const tier of ["T0", "T1", "T2"] as const) {
      expect(TIER_TABLE[tier].claude).toBeTruthy();
      expect(TIER_TABLE[tier].codex).toBeTruthy();
    }
    expect([...FRONTIER_ROLES].sort()).toEqual(["qa", "tl", "uiux"]);
  });

  it("U-TIER-005: T0 (opus/gpt-5.5) は明示許可ゲート (fail-close)", () => {
    const d = det("claude-only", "claude");
    const blocked = route({ role: "tl", task: { text: "design the api boundary" } }, d);
    expect(blocked.tier).toBe("T0");
    expect(blocked.status).toBe("blocked-needs-approval");
    expect(blocked.model).toBeNull();

    const ready = route({ role: "tl", task: { text: "design the api boundary" } }, d, {
      auth: { explicit: true },
    });
    expect(ready.status).toBe("ready");
    expect(ready.model).toBe("claude-opus-4-8");
    expect(FRONTIER_MODELS.has(ready.model ?? "")).toBe(true);
  });

  it("U-TIER-006: ワーカー role は明示許可があっても T0/フロンティアに届かない", () => {
    const d = det("claude-only", "claude");
    const dec = route({ role: "se", task: { text: "refactor the runtime adapter module" } }, d, {
      auth: { explicit: true },
    });
    expect(dec.tier).not.toBe("T0");
    expect(FRONTIER_MODELS.has(dec.model ?? "")).toBe(false);
  });

  it("U-TIER-007: 難易度ルーターがワーカー帯で T2↔T1 を自動振り分け", () => {
    const d = det("codex-only", "codex");
    const cheap = route({ role: "se", task: { text: "rename a field" } }, d);
    expect(cheap.tier).toBe("T2");
    expect(cheap.model).toBe("gpt-5.3-codex-spark");

    const hard = route(
      { role: "se", task: { text: "refactor the database integration architecture" } },
      d,
    );
    expect(hard.tier).toBe("T1");
    expect(hard.model).toBe("gpt-5.4");
  });

  it("U-TIER-008: assignCross は hybrid で判断を相手 provider にフリップ", () => {
    expect(assignCross(det("hybrid", "claude"))).toEqual({
      execution: "claude",
      judgement: "codex",
      review_kind: "cross_agent",
    });
    expect(assignCross(det("hybrid", "codex"))).toEqual({
      execution: "codex",
      judgement: "claude",
      review_kind: "cross_agent",
    });
    expect(assignCross(det("claude-only", "claude")).review_kind).toBe("intra_runtime_subagent");
    expect(other("claude")).toBe("codex");
  });

  it("U-TIER-009: route は主 provider (currentRuntime) でモデルを選ぶ", () => {
    const claudeDriven = route(
      { role: "se", task: { text: "rename a field" } },
      det("hybrid", "claude"),
    );
    expect(claudeDriven.provider).toBe("claude");
    expect(claudeDriven.model).toBe("claude-haiku-4-5");

    const codexDriven = route(
      { role: "se", task: { text: "rename a field" } },
      det("hybrid", "codex"),
    );
    expect(codexDriven.provider).toBe("codex");
    expect(codexDriven.model).toBe("gpt-5.3-codex-spark");
  });

  it("U-TIER-010: route が主→相手のプロバイダ切替を自動配線する (assignCross wired)", () => {
    const claudeDriven = route(
      { role: "se", task: { text: "rename a field" } },
      det("hybrid", "claude"),
    );
    expect(claudeDriven.cross).toEqual({
      execution: "claude",
      judgement: "codex",
      review_kind: "cross_agent",
    });

    const codexDriven = route(
      { role: "se", task: { text: "rename a field" } },
      det("hybrid", "codex"),
    );
    expect(codexDriven.cross).toEqual({
      execution: "codex",
      judgement: "claude",
      review_kind: "cross_agent",
    });

    const single = route(
      { role: "se", task: { text: "rename a field" } },
      det("claude-only", "claude"),
    );
    expect(single.cross.review_kind).toBe("intra_runtime_subagent");
  });
});
