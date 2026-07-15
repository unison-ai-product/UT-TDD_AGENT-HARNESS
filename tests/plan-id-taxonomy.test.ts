import { describe, expect, it } from "vitest";
import { planIdTaxonomyViolations } from "../src/plan/lint";

/**
 * 規定外起票ブロックゲート (plan_id taxonomy)。
 *
 * 背景: 2026-07-15、既存 PLAN-M-00/M-01 (cutover/migration 専用) から
 * 「M = master program」と外挿した規定外 plan_id (PLAN-M-02) が lint を素通りして
 * 起票された。ID 語彙への無断の意味追加 (taxonomy 汚染) を機械で fail-close する。
 *
 * 許可 prefix (実在 766 PLAN から抽出した閉じた語彙):
 *   PLAN-L<0..14>-<n>-<slug> / PLAN-REVERSE-<n>-<slug>
 *   PLAN-DISCOVERY-<n>-<slug> / PLAN-RECOVERY-<n>-<slug>
 *   PLAN-M-* は凍結 legacy 2 件のみ (新規追加は violation)。
 */
describe("planIdTaxonomyViolations", () => {
  const ok = (id: string) => expect(planIdTaxonomyViolations(id)).toEqual([]);
  const ng = (id: string) => {
    const v = planIdTaxonomyViolations(id);
    expect(v.length).toBeGreaterThan(0);
    expect(v[0].reason).toBe("plan_id_taxonomy");
  };

  it("accepts layer plans L0..L14", () => {
    ok("PLAN-L0-01-vmodel-harness-upgrade-charter");
    ok("PLAN-L1-08-design-harness-internalization");
    ok("PLAN-L14-01-engine-swap-operational-value-verification");
    ok("PLAN-L2-00-master");
  });

  it("accepts REVERSE / DISCOVERY / RECOVERY plans", () => {
    ok("PLAN-REVERSE-434-universal-pr-trigger-backfill");
    ok("PLAN-DISCOVERY-01-workflow-metamodel");
    ok("PLAN-RECOVERY-09-hub-reference-removal");
  });

  it("accepts only the two frozen legacy M plans", () => {
    ok("PLAN-M-00-verify-cutover");
    ok("PLAN-M-01-cutover-backfill");
    // 実事故ケース: M を master 系列として外挿した規定外起票
    ng("PLAN-M-02-design-harness-internalization");
    ng("PLAN-M-03-anything");
  });

  it("rejects unregistered prefixes (fail-close)", () => {
    ng("PLAN-X-01-something");
    ng("PLAN-MASTER-01-program");
    ng("PLAN-UPDATE-01-refresh");
    ng("PLAN-01-legacy-style");
  });

  it("rejects out-of-range layers and malformed slugs", () => {
    ng("PLAN-L15-01-beyond-vmodel");
    ng("PLAN-L99-01-nope");
    ng("PLAN-L6-82"); // slug なし
    ng("PLAN-L6-82-UPPER-Case"); // slug は小文字英数のみ
  });
});
