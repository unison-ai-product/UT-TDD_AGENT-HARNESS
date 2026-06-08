import { describe, expect, it } from "vitest";
import {
  analyzePlanSchedule,
  extractScheduleSection,
  planScheduleMessages,
} from "../src/plan/lint";

const compliant = `---
plan_id: PLAN-X
---
## §3 工程表 (Step + 進捗)

### Step 1: [直列] 設計対象の確定
直列理由: downstream_dependency

### Step 2: [並列] fixture 整備

### Step 3: [直列] review
直列理由: downstream_dependency
self / pmo-sonnet review

## §3.1 実装計画

- 情報源: src/plan/lint.ts
`;

describe("plan schedule lint (IMP-081)", () => {
  it("U-PLANSCH-001: §工程表 section を抽出する", () => {
    expect(extractScheduleSection(compliant)).toContain("Step 1");
  });

  it("U-PLANSCH-002: 準拠 PLAN は ok", () => {
    const r = analyzePlanSchedule([{ file: "PLAN-X.md", content: compliant }]);
    expect(r.violations).toEqual([]);
    expect(r.ok).toBe(true);
  });

  it("U-PLANSCH-003: [並列]/[直列] 欠落 Step は violation", () => {
    const content = compliant.replace(
      "### Step 1: [直列] 設計対象の確定",
      "### Step 1: 設計対象の確定",
    );
    const r = analyzePlanSchedule([{ file: "PLAN-X.md", content }]);
    expect(r.violations.some((v) => v.reason === "missing_mode")).toBe(true);
    expect(r.ok).toBe(false);
  });

  it("U-PLANSCH-004: [直列] の3条件理由欠落は violation", () => {
    const content = compliant.replace("直列理由: downstream_dependency", "直列理由: 手順上必要");
    const r = analyzePlanSchedule([{ file: "PLAN-X.md", content }]);
    expect(r.violations.some((v) => v.reason === "missing_serial_reason")).toBe(true);
  });

  it("U-PLANSCH-005: review Step 不在は violation", () => {
    const content = compliant.replace("### Step 3: [直列] review", "### Step 3: [直列] 完了確認");
    const r = analyzePlanSchedule([{ file: "PLAN-X.md", content }]);
    expect(r.violations.some((v) => v.reason === "missing_review_step")).toBe(true);
  });

  it("U-PLANSCH-006: §3.1 実装計画 不在は violation", () => {
    const content = compliant.replace("## §3.1 実装計画", "## §4 DoD");
    const r = analyzePlanSchedule([{ file: "PLAN-X.md", content }]);
    expect(r.violations.some((v) => v.reason === "missing_impl_plan")).toBe(true);
    expect(planScheduleMessages(r)[0]).toContain("violation");
  });
});
