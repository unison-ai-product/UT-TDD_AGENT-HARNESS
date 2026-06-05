import { describe, expect, it } from "vitest";
import {
  analyzeReviewEvidence,
  hasReviewEvidence,
  type ParsedReviewPlan,
  parseReviewPlan,
  loadReviewPlans,
} from "../src/lint/review-evidence";

/** review-evidence lint (IMP-071) — review 前置証跡の機械強制。 */

const plan = (o: Partial<ParsedReviewPlan>): ParsedReviewPlan => ({
  file: "x.md",
  plan_id: "PLAN-X",
  kind: "design",
  status: "confirmed",
  hasEvidence: false,
  ...o,
});

describe("review-evidence lint (review 前置の機械強制、IMP-071)", () => {
  it("U-REVIEW-001: hasReviewEvidence — review_evidence ブロック (≥1 entry) を presence 検出", () => {
    const withEv = `plan_id: PLAN-A\nstatus: confirmed\nreview_evidence:\n  - reviewer: code-reviewer\n    review_kind: intra_runtime_subagent\n    reviewed_at: "2026-06-05"\n    verdict: approve\n`;
    const withoutEv = `plan_id: PLAN-B\nstatus: confirmed\nv2_import: x\n`;
    const emptyKey = `plan_id: PLAN-C\nstatus: confirmed\nreview_evidence:\n`; // key だけ、entry なし
    expect(hasReviewEvidence(withEv)).toBe(true);
    expect(hasReviewEvidence(withoutEv)).toBe(false);
    expect(hasReviewEvidence(emptyKey)).toBe(false);
  });

  it("U-REVIEW-002: parseReviewPlan — plan_id/kind/status/hasEvidence を抽出", () => {
    const content = `plan_id: PLAN-L4-05-workflow-orchestration\nkind: add-design\nstatus: confirmed\nreview_evidence:\n  - reviewer: code-reviewer\n    review_kind: intra_runtime_subagent\n    reviewed_at: "2026-06-05"\n    verdict: approve\n`;
    const p = parseReviewPlan("PLAN-L4-05-workflow-orchestration.md", content);
    expect(p.kind).toBe("add-design");
    expect(p.status).toBe("confirmed");
    expect(p.hasEvidence).toBe(true);
  });

  it("U-REVIEW-003: confirmed の design/impl 系で evidence 無し → missing + ok=false", () => {
    const r = analyzeReviewEvidence([plan({ plan_id: "PLAN-L4-09-x", kind: "design", hasEvidence: false })]);
    expect(r.missing).toEqual([{ plan_id: "PLAN-L4-09-x", kind: "design" }]);
    expect(r.ok).toBe(false);
  });

  it("U-REVIEW-004: evidence あり → missing 0 / ok=true (add-design/add-impl/impl 全 kind)", () => {
    const r = analyzeReviewEvidence([
      plan({ plan_id: "PLAN-D", kind: "design", hasEvidence: true }),
      plan({ plan_id: "PLAN-AD", kind: "add-design", hasEvidence: true }),
      plan({ plan_id: "PLAN-I", kind: "impl", hasEvidence: true }),
      plan({ plan_id: "PLAN-AI", kind: "add-impl", hasEvidence: true }),
    ]);
    expect(r.missing).toEqual([]);
    expect(r.ok).toBe(true);
  });

  it("U-REVIEW-005: 対象外 — draft (未確定) / 非 design-impl kind (poc/charter/reverse) は missing にしない", () => {
    const r = analyzeReviewEvidence([
      plan({ plan_id: "PLAN-DRAFT", kind: "design", status: "draft", hasEvidence: false }),
      plan({ plan_id: "PLAN-POC", kind: "poc", status: "confirmed", hasEvidence: false }),
      plan({ plan_id: "PLAN-CHARTER", kind: "charter", status: "confirmed", hasEvidence: false }),
      plan({ plan_id: "PLAN-REV", kind: "reverse", status: "confirmed", hasEvidence: false }),
      plan({ plan_id: "PLAN-ARCH", kind: "design", status: "archived", hasEvidence: false }),
    ]);
    expect(r.missing).toEqual([]);
    expect(r.ok).toBe(true);
  });

  it("U-REVIEW-006: 実 repo 機構ガード — analyze が動き、confirmed+evidence の PLAN は missing に出ない", () => {
    // warn-first 段階のため missing==[] は課さない (履歴 PLAN の back-fill は段階、本 lint が surface する)。
    // 機構の健全性 = (a) 例外なく動く (b) confirmed かつ review_evidence ありの PLAN は認識される、を回帰ガード。
    const r = analyzeReviewEvidence(loadReviewPlans());
    expect(Array.isArray(r.missing)).toBe(true);
    const missingIds = new Set(r.missing.map((m) => m.plan_id));
    // PLAN-L4-05 / L7-13 は confirmed かつ review_evidence あり (本 feature の review 通過後に記録) →
    // 「confirmed なのに missing」に出ないことが機構の認識証拠。draft 由来の除外と混同しない。
    expect(missingIds.has("PLAN-L4-05-workflow-orchestration")).toBe(false);
    expect(missingIds.has("PLAN-L7-13-review-evidence")).toBe(false);
  });
});
