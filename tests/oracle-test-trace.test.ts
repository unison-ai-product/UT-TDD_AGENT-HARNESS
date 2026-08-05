// PLAN-REVERSE-41 塊B: oracle 宣言 ⇔ 実テスト citation の突合 (IMP-128、forward-citation 規律)。
// test-design 宣言 oracle (U-*/IT-*/ST-*/P-*/M-*) が tests/ に ID citation を持つか。
// NEW は fail、既存 89 は baseline、検出範囲拡張 (issue #165) の 350 は widened baseline。
// 同一 ID の重複宣言 (issue #206) も fail-close する。
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  analyzeOracleTestTrace,
  collectDeclarationRows,
  loadOracleTestTraceInput,
  ORACLE_TEST_TRACE_BASELINE,
  ORACLE_TEST_TRACE_WIDENED_BASELINE,
} from "../src/lint/oracle-test-trace";

describe("analyzeOracleTestTrace (U-OTT-001..003)", () => {
  const base = {
    referenced: new Set(["U-FOO-001"]),
    baseline: new Set(["U-BAR-002"]),
    widenedBaseline: new Set<string>(),
    duplicates: [],
  };

  it("U-OTT-001: 宣言済だが未 citation かつ baseline 外 = orphan (NEW fail-close)", () => {
    const r = analyzeOracleTestTrace({ declared: ["U-NEW-009"], ...base });
    expect(r.orphans).toContain("U-NEW-009");
    expect(r.ok).toBe(false);
  });

  it("U-OTT-002: tests に citation 済 oracle は orphan でない", () => {
    const r = analyzeOracleTestTrace({ declared: ["U-FOO-001"], ...base });
    expect(r.orphans).toHaveLength(0);
    expect(r.ok).toBe(true);
  });

  it("U-OTT-003: baseline 済 oracle は orphan でない (known-debt)", () => {
    const r = analyzeOracleTestTrace({ declared: ["U-BAR-002"], ...base });
    expect(r.orphans).toHaveLength(0);
  });
});

describe("検出範囲拡張 (issue #165、U-OTT-006..008)", () => {
  const base = {
    referenced: new Set<string>(),
    baseline: new Set<string>(),
    widenedBaseline: new Set(["ST-DATA-01"]),
    duplicates: [],
  };

  // 旧 ORACLE_ID は 3 桁固定だったため 2 桁 ID は宣言されても一切見えなかった。
  it("U-OTT-006: 2 桁番号の ST oracle も orphan として検出される", () => {
    const r = analyzeOracleTestTrace({ declared: ["ST-DOCSEM-08"], ...base });
    expect(r.orphans).toEqual(["ST-DOCSEM-08"]);
    expect(r.ok).toBe(false);
  });

  it("U-OTT-007: widened baseline 済は orphan でない (ratchet)", () => {
    const r = analyzeOracleTestTrace({ declared: ["ST-DATA-01"], ...base });
    expect(r.orphans).toEqual([]);
    expect(r.ok).toBe(true);
  });

  // 多 segment 名 (U-RVGHA-D3C-001) は旧パターンの [A-Z0-9]+ 1 段では一致しなかった。
  it("U-OTT-008: 多 segment 名の oracle も orphan として検出される", () => {
    const r = analyzeOracleTestTrace({ declared: ["U-RVGHA-D3C-001"], ...base });
    expect(r.orphans).toEqual(["U-RVGHA-D3C-001"]);
  });
});

describe("重複宣言検出 (issue #206、U-OTT-009..011)", () => {
  function fixture(lines: string[]): string {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-oracle-dup-"));
    mkdirSync(join(root, "docs", "test-design"), { recursive: true });
    writeFileSync(join(root, "docs", "test-design", "L7.md"), lines.join("\n"), "utf8");
    return root;
  }

  it("U-OTT-009: 同一 ID を別 oracle として 2 回宣言すると重複として検出される", () => {
    const root = fixture([
      "| `U-DUP-001` | 最初の oracle | exit 0 |",
      "| `U-DUP-001` | 別の oracle | exit 1 |",
    ]);
    const rows = collectDeclarationRows(root);
    expect(rows.get("U-DUP-001")?.size).toBe(2);
    const r = analyzeOracleTestTrace({
      declared: ["U-DUP-001"],
      referenced: new Set(["U-DUP-001"]),
      baseline: new Set(),
      widenedBaseline: new Set(),
      duplicates: [
        { id: "U-DUP-001", descriptions: ["最初の oracle exit 0", "別の oracle exit 1"] },
      ],
    });
    expect(r.duplicates).toHaveLength(1);
    expect(r.ok).toBe(false);
  });

  it("U-OTT-010: 同一 ID・同一説明の重出は重複でない (同じ表の再掲)", () => {
    const root = fixture([
      "| `U-SAME-001` | 同じ oracle | exit 0 |",
      "| `U-SAME-001` | 同じ oracle | exit 0 |",
    ]);
    expect(collectDeclarationRows(root).get("U-SAME-001")?.size).toBe(1);
  });

  // 複数 ID を含む行は traceability の参照行であり宣言行ではない。ここを除外しないと
  // 「U-X-001〜004 は …」のような範囲記述が同居 ID の重複として誤検出される。
  it("U-OTT-011: 1 行に複数 ID がある参照行は宣言としてカウントしない", () => {
    const root = fixture(["| `U-REF-001` と `U-REF-002` | 参照行 | — |"]);
    const rows = collectDeclarationRows(root);
    expect(rows.has("U-REF-001")).toBe(false);
    expect(rows.has("U-REF-002")).toBe(false);
  });
});

describe("loadOracleTestTraceInput real repo (U-OTT-004/005/012)", () => {
  it("U-OTT-004: 実 repo の orphan は 0 (baseline 適用後、NEW oracle は fail-close 回帰網)", () => {
    const r = analyzeOracleTestTrace(loadOracleTestTraceInput(process.cwd()));
    expect(r.orphans).toEqual([]);
  });

  it("U-OTT-005: baseline は 89 件スナップショット (縮小のみ可)", () => {
    expect(ORACLE_TEST_TRACE_BASELINE.size).toBe(89);
  });

  it("U-OTT-012: widened baseline は 350 件スナップショット (縮小のみ可)", () => {
    expect(ORACLE_TEST_TRACE_WIDENED_BASELINE.size).toBe(350);
  });

  // 重複には baseline を置かない。有効化時点の実 repo で 0 件だったため、grandfather する
  // 債務が存在しない。ここが非 0 になったら新規の採番衝突である。
  it("U-OTT-013: 実 repo の重複宣言は 0 件", () => {
    const r = analyzeOracleTestTrace(loadOracleTestTraceInput(process.cwd()));
    expect(r.duplicates).toEqual([]);
  });
});
