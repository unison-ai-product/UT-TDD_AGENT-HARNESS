// PLAN-REVERSE-40 塊A: impl→PLAN トレーサビリティ検査 (IMP-088)。
// src module/CLI/lint/doctor check が PLAN generates に紐づくか。NEW orphan を fail-close。
// 既存 untraced 8 件は baseline (known-debt)、IMP-087 の 4 件は REVERSE-40 へ back-fill 済。

import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  analyzeImplPlanTrace,
  IMPL_PLAN_TRACE_BASELINE,
  loadImplPlanTraceInput,
} from "../src/lint/impl-plan-trace.ts";

function makeImplPlanTraceFixture(options: {
  sourcePaths: string[];
  planPaths?: string[];
  designPaths?: string[];
}): string {
  const root = mkdtempSync(join(tmpdir(), "impl-plan-trace-"));
  mkdirSync(join(root, "docs", "plans"), { recursive: true });
  mkdirSync(join(root, "docs", "design", "harness", "L6-function-design"), {
    recursive: true,
  });
  for (const sourcePath of options.sourcePaths) {
    const absolutePath = join(root, sourcePath);
    mkdirSync(join(absolutePath, ".."), { recursive: true });
    writeFileSync(absolutePath, "export {};\n", "utf8");
  }
  writeFileSync(
    join(root, "docs", "plans", "PLAN-fixture.md"),
    (options.planPaths ?? []).join("\n"),
    "utf8",
  );
  writeFileSync(
    join(root, "docs", "design", "harness", "L6-function-design", "fixture.md"),
    (options.designPaths ?? []).join("\n"),
    "utf8",
  );
  return root;
}

describe("analyzeImplPlanTrace (U-IPT-001..003)", () => {
  const base = {
    tracedPaths: new Set(["src/cli.ts"]),
    baseline: new Set(["src/lint/shared.ts"]),
  };

  it("U-IPT-001: traced でも baseline でもない src は orphan (NEW orphan fail-close)", () => {
    const r = analyzeImplPlanTrace({ srcFiles: ["src/new/feature.ts"], ...base });
    expect(r.orphans).toContain("src/new/feature.ts");
    expect(r.ok).toBe(false);
  });

  it("U-IPT-002: PLAN generates に traced な src は orphan でない", () => {
    const r = analyzeImplPlanTrace({ srcFiles: ["src/cli.ts"], ...base });
    expect(r.orphans).toHaveLength(0);
    expect(r.ok).toBe(true);
  });

  it("U-IPT-003: baseline 済 src は orphan でない (known-debt)", () => {
    const r = analyzeImplPlanTrace({ srcFiles: ["src/lint/shared.ts"], ...base });
    expect(r.orphans).toHaveLength(0);
  });
});

describe("loadImplPlanTraceInput real repo (U-IPT-004/005)", () => {
  it("U-IPT-004: 実 repo の orphan は 0 (4 back-fill + 8 baseline 適用後、fail-close 回帰網)", () => {
    const r = analyzeImplPlanTrace(loadImplPlanTraceInput(process.cwd()));
    expect(r.orphans).toEqual([]);
  });

  it("U-IPT-005: baseline は 8 件 (IMP-087 の 4 は back-fill で trace = baseline に含めない)", () => {
    expect(IMPL_PLAN_TRACE_BASELINE.size).toBe(8);
    // 縮小のみ可の回帰網: 新規モジュールを baseline へ足して gate を黙らせない
    // (2026-08-05 に一度 9 件化した実例の再発防止。trace は PLAN 側で持つ)。
    expect(IMPL_PLAN_TRACE_BASELINE.has("src/plan/parent-drive-mismatch-baseline.ts")).toBe(false);
    // IMP-087 orphan は baseline でなく back-fill (trace) で解消
    expect(IMPL_PLAN_TRACE_BASELINE.has("src/lint/rule-drift.ts")).toBe(false);
    expect(IMPL_PLAN_TRACE_BASELINE.has("src/gate/review-tier.ts")).toBe(false);
  });
});

describe("loadImplPlanTraceInput design-source trace candidate", () => {
  const root = makeImplPlanTraceFixture({
    sourcePaths: ["src/runtime/windows-hide.ts", "src/doctor/windows-hide.ts"],
    planPaths: ["no implementation path is declared here"],
    designPaths: ["src/runtime/windows-hide.ts", "src/doctor/windows-hide.ts"],
  });

  beforeAll(() => {
    expect(existsSync(join(root, "src/runtime/windows-hide.ts"))).toBe(true);
    expect(existsSync(join(root, "src/doctor/windows-hide.ts"))).toBe(true);
    expect(existsSync(join(root, "docs/plans/PLAN-fixture.md"))).toBe(true);
    expect(existsSync(join(root, "docs/design/harness/L6-function-design/fixture.md"))).toBe(true);
  });

  afterAll(() => rmSync(root, { recursive: true, force: true }));

  it("the isolated fixture has both source files and their design references", () => {
    expect([...loadImplPlanTraceInput(root).srcFiles].sort()).toEqual([
      "src/doctor/windows-hide.ts",
      "src/runtime/windows-hide.ts",
    ]);
  });

  it("PLAN-only source references remain traced", () => {
    const root = makeImplPlanTraceFixture({
      sourcePaths: ["src/plan-only.ts"],
      planPaths: ["src/plan-only.ts"],
    });
    try {
      const input = loadImplPlanTraceInput(root);
      const result = analyzeImplPlanTrace(input);
      expect(input.tracedPaths.has("src/plan-only.ts")).toBe(true);
      expect(result.orphans).toEqual([]);
      expect(result.ok).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it.fails("CANDIDATE-U-IPT-006: design-only source references cover new src", () => {
    const input = loadImplPlanTraceInput(root);
    const result = analyzeImplPlanTrace(input);
    expect(input.tracedPaths.has("src/runtime/windows-hide.ts")).toBe(true);
    expect(input.tracedPaths.has("src/doctor/windows-hide.ts")).toBe(true);
    expect(result.orphans).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it("src absent from PLAN and design remains an orphan", () => {
    const root = makeImplPlanTraceFixture({
      sourcePaths: ["src/unowned.ts"],
      planPaths: ["no implementation path is declared here"],
      designPaths: ["no implementation path is declared here"],
    });
    try {
      const input = loadImplPlanTraceInput(root);
      const result = analyzeImplPlanTrace(input);
      expect(input.tracedPaths.has("src/unowned.ts")).toBe(false);
      expect(result.orphans).toEqual(["src/unowned.ts"]);
      expect(result.ok).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
