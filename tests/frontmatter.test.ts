import { describe, expect, it } from "vitest";
import { frontmatterSchema } from "../src/schema/frontmatter";

/** 有効な normal impl frontmatter の最小形 */
function implBase(overrides: Record<string, unknown> = {}) {
  return {
    plan_id: "PLAN-L7-05-frontmatter-schema",
    title: "PLAN-005: frontmatter schema",
    kind: "impl",
    layer: "L7",
    drive: "be",
    status: "draft",
    parent_design: "docs/design/schema/frontmatter.md",
    agent_slots: [{ role: "aim", slot_label: "AIM — 実装" }],
    generates: [{ artifact_path: "src/schema/frontmatter.ts", artifact_type: "source_module" }],
    dependencies: { parent: null, requires: [], blocks: [] },
    ...overrides,
  };
}

describe("frontmatter schema (§1.1 / §1.1.parent_design / §3.3 / §3.4)", () => {
  it("正常な impl PLAN は通る + dependencies default が適用される", () => {
    const r = frontmatterSchema.safeParse(implBase({ dependencies: { parent: null } }));
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.dependencies.requires).toEqual([]);
      expect(r.data.dependencies.blocks).toEqual([]);
    }
  });

  it("kind=impl で parent_design 欠落は fail (§1.1.parent_design)", () => {
    const r = frontmatterSchema.safeParse(implBase({ parent_design: undefined }));
    expect(r.success).toBe(false);
  });

  it("不正な plan_id は fail (§1.10 A)", () => {
    expect(frontmatterSchema.safeParse(implBase({ plan_id: "PLAN-5" })).success).toBe(false);
    expect(frontmatterSchema.safeParse(implBase({ plan_id: "plan-005" })).success).toBe(false);
  });

  it("charter は layer=L0 で通り、L0 以外は fail (§1.3 / §2.1.1)", () => {
    const ok = frontmatterSchema.safeParse(
      implBase({
        kind: "charter",
        layer: "L0",
        parent_design: undefined,
        agent_slots: [{ role: "po", slot_label: "PO — 企画" }],
      }),
    );
    expect(ok.success).toBe(true);
    const bad = frontmatterSchema.safeParse(
      implBase({ kind: "charter", layer: "L4", parent_design: undefined }),
    );
    expect(bad.success).toBe(false);
  });

  it("normal kind に workflow_phase は禁止 (§1.1)", () => {
    const r = frontmatterSchema.safeParse(implBase({ workflow_phase: "S2" }));
    expect(r.success).toBe(false);
  });

  it("poc は layer=cross + workflow_phase 必須、S4 は decision_outcome 必須 (§1.1)", () => {
    const pocBase = {
      plan_id: "PLAN-DISCOVERY-06-poc",
      title: "PLAN-DISCOVERY-06: poc",
      kind: "poc",
      layer: "cross",
      drive: "scrum",
      status: "draft",
      workflow_phase: "S2",
      agent_slots: [{ role: "aim", slot_label: "AIM — PoC" }],
      dependencies: { parent: null },
    };
    expect(frontmatterSchema.safeParse(pocBase).success).toBe(true);
    // layer != cross は fail
    expect(frontmatterSchema.safeParse({ ...pocBase, layer: "L7" }).success).toBe(false);
    // S4 + decision_outcome 欠落は fail
    expect(frontmatterSchema.safeParse({ ...pocBase, workflow_phase: "S4" }).success).toBe(false);
    // S4 + decision_outcome ありは通る
    expect(
      frontmatterSchema.safeParse({
        ...pocBase,
        workflow_phase: "S4",
        decision_outcome: "confirmed",
      }).success,
    ).toBe(true);
    // poc に R phase は fail
    expect(frontmatterSchema.safeParse({ ...pocBase, workflow_phase: "R2" }).success).toBe(false);
  });

  it("reverse は confirmed_reverse_type 必須、R4 は forward_routing/promotion_strategy 必須 (§3.3 / §3.4)", () => {
    const revBase = {
      plan_id: "PLAN-REVERSE-07-reverse",
      title: "PLAN-REVERSE-07: reverse",
      kind: "reverse",
      layer: "cross",
      drive: "reverse",
      status: "draft",
      workflow_phase: "R2",
      confirmed_reverse_type: "code",
      agent_slots: [{ role: "tl", slot_label: "TL — Reverse" }],
      dependencies: { parent: null },
    };
    expect(frontmatterSchema.safeParse(revBase).success).toBe(true);
    // confirmed_reverse_type 欠落は fail
    expect(
      frontmatterSchema.safeParse({ ...revBase, confirmed_reverse_type: undefined }).success,
    ).toBe(false);
    // R4 + forward_routing/promotion_strategy 欠落は fail
    expect(frontmatterSchema.safeParse({ ...revBase, workflow_phase: "R4" }).success).toBe(false);
    // R4 + 両方ありは通る
    expect(
      frontmatterSchema.safeParse({
        ...revBase,
        workflow_phase: "R4",
        forward_routing: "L3",
        promotion_strategy: "reuse-with-hardening",
      }).success,
    ).toBe(true);
  });

  it("recovery は layer=cross 許可 + workflow_phase 禁止、token↔kind 一致 (§1.1 / §1.10 A)", () => {
    const recBase = {
      plan_id: "PLAN-RECOVERY-09-x",
      title: "PLAN-RECOVERY-09: recovery",
      kind: "recovery",
      layer: "cross",
      drive: "poc",
      status: "draft",
      agent_slots: [{ role: "aim", slot_label: "AIM — Recovery" }],
      dependencies: { parent: null },
    };
    // recovery + cross + phase なしは通る (解禁)
    expect(frontmatterSchema.safeParse(recBase).success).toBe(true);
    // recovery に workflow_phase は fail
    expect(frontmatterSchema.safeParse({ ...recBase, workflow_phase: "S2" }).success).toBe(false);
    // 駆動トークン↔kind 不一致は fail (DISCOVERY token に recovery kind)
    expect(
      frontmatterSchema.safeParse({ ...recBase, plan_id: "PLAN-DISCOVERY-09-x" }).success,
    ).toBe(false);
  });

  it("v2_import 任意フィールドが受理される (Minor 1 / G1 readiness v8)", () => {
    const r = frontmatterSchema.safeParse(
      implBase({ v2_import: "docs/migration/v2-import-ledger.md" }),
    );
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.v2_import).toBe("docs/migration/v2-import-ledger.md");
    }
    // v2_import なしも通る (任意フィールド)
    const r2 = frontmatterSchema.safeParse(implBase());
    expect(r2.success).toBe(true);
  });

  it("kind=add-* は dependencies.parent 必須 (§1.10 E)", () => {
    const r = frontmatterSchema.safeParse(
      implBase({ kind: "add-impl", dependencies: { parent: null } }),
    );
    expect(r.success).toBe(false);
    const ok = frontmatterSchema.safeParse(
      implBase({ kind: "add-impl", dependencies: { parent: "PLAN-L7-05-frontmatter-schema" } }),
    );
    expect(ok.success).toBe(true);
  });
});
