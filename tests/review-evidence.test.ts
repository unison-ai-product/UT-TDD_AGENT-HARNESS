import { describe, expect, it } from "vitest";
import {
  analyzeReviewEvidence,
  extractReviewEntries,
  hasReviewEvidence,
  type ParsedReviewPlan,
  parseReviewPlan,
  loadReviewPlans,
} from "../src/lint/review-evidence";

/** review-evidence lint (IMP-071 presence + IMP-076 cross-review semantic) — review 前置証跡の機械強制。 */

const plan = (o: Partial<ParsedReviewPlan>): ParsedReviewPlan => ({
  file: "x.md",
  plan_id: "PLAN-X",
  kind: "design",
  status: "confirmed",
  hasEvidence: false,
  crossEntries: [],
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

  it("U-REVIEW-006: 実 repo CI fail-close ガード — confirmed design/impl PLAN は全件 review_evidence あり (missing 0)", () => {
    // hard 化 (IMP-071 2026-06-05): 履歴 15 件 back-fill 完了後、missing==[] を CI で課す。
    // 以後 confirmed design/impl PLAN を review 証跡なしで足すと本テストが red → CI fail-close
    // (backfill U-BACKFILL-006 / scrum-reverse U-SCRUMREV-005 と同パターンの実 repo 回帰ガード)。
    const r = analyzeReviewEvidence(loadReviewPlans());
    expect(r.missing).toEqual([]);
    expect(r.crossReviewViolations).toEqual([]); // 実 repo に cross_agent entry は無い (claude-only solo) → 違反0
    expect(r.ok).toBe(true);
    // confirmed かつ review_evidence ありの代表 PLAN が missing に出ないことも明示 (draft 除外と混同しない)。
    const missingIds = new Set(r.missing.map((m) => m.plan_id));
    expect(missingIds.has("PLAN-L4-05-workflow-orchestration")).toBe(false);
    expect(missingIds.has("PLAN-L7-13-review-evidence")).toBe(false);
  });
});

/** IMP-076 — cross-review semantic 強制 (same_model_approval / cross_agent distinctness)。 */
describe("cross-review semantic 強制 (IMP-076)", () => {
  it("U-XREVIEW-001: cross_agent で worker≠reviewer model → 違反なし / ok=true", () => {
    const r = analyzeReviewEvidence([
      plan({
        plan_id: "PLAN-A",
        kind: "add-impl",
        crossEntries: [{ review_kind: "cross_agent", worker_model: "claude-opus-4-8", reviewer_model: "gpt-5.5" }],
        hasEvidence: true,
      }),
    ]);
    expect(r.crossReviewViolations).toEqual([]);
    expect(r.ok).toBe(true);
  });

  it("U-XREVIEW-002: cross_agent で worker≡reviewer の同一 model → violation / ok=false (same_model_approval)", () => {
    const r = analyzeReviewEvidence([
      plan({
        plan_id: "PLAN-B",
        crossEntries: [{ review_kind: "cross_agent", worker_model: "claude-opus-4-8", reviewer_model: "claude-opus-4-8" }],
        hasEvidence: true,
      }),
    ]);
    expect(r.crossReviewViolations).toEqual([{ plan_id: "PLAN-B", reason: "same_model_or_missing" }]);
    expect(r.ok).toBe(false);
  });

  it("U-XREVIEW-003: cross_agent で model 欠落 → violation (単体 runtime は相異 model を供給できない=僭称を弾く)", () => {
    const r = analyzeReviewEvidence([
      plan({ plan_id: "PLAN-C", crossEntries: [{ review_kind: "cross_agent" }], hasEvidence: true }),
    ]);
    expect(r.crossReviewViolations).toEqual([{ plan_id: "PLAN-C", reason: "same_model_or_missing" }]);
    expect(r.ok).toBe(false);
  });

  it("U-XREVIEW-004: 非 cross_agent (intra_runtime_subagent) は model 同一/欠落でも対象外", () => {
    const r = analyzeReviewEvidence([
      plan({
        plan_id: "PLAN-D",
        crossEntries: [{ review_kind: "intra_runtime_subagent", worker_model: "x", reviewer_model: "x" }],
        hasEvidence: true,
      }),
    ]);
    expect(r.crossReviewViolations).toEqual([]);
    expect(r.ok).toBe(true);
  });

  it("U-XREVIEW-005: extractReviewEntries — frontmatter yaml から review_kind/worker_model/reviewer_model 抽出", () => {
    const content = `---
plan_id: PLAN-E
review_evidence:
  - reviewer: frontier-reviewer
    review_kind: cross_agent
    reviewed_at: "2026-06-05"
    verdict: approve
    worker_model: claude-opus-4-8
    reviewer_model: gpt-5.5
---
body`;
    const entries = extractReviewEntries(content);
    expect(entries).toEqual([
      { review_kind: "cross_agent", worker_model: "claude-opus-4-8", reviewer_model: "gpt-5.5" },
    ]);
  });
});
