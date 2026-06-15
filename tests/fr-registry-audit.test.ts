/**
 * FR registry audit lint test (A-57 ledger).
 * 機能一覧 (L1 functional §1) の漏れ監査自動化。
 * PO 指摘「機能一覧の漏れ監査の自動化と登録の機構」反映。
 */
import { describe, expect, it } from "vitest";
import {
  analyzeFrRegistry,
  extractDeclaredCounts,
  extractExplainedGapNums,
  loadFrDocs,
  parseFrRows,
} from "../src/lint/fr-registry-audit";

describe("FR registry audit (機能一覧 漏れ監査)", () => {
  const docs = loadFrDocs();
  const result = analyzeFrRegistry(docs);

  it("§1 機能一覧 table を 48 行構造化抽出 (P0:19 / P1:23 / P2:6、FR-L1-36 が P2 carry から昇格 PLAN-L7-53)", () => {
    const rows = parseFrRows(docs.l1Functional);
    expect(rows.length).toBe(48);
    expect(result.totals).toEqual({ registered: 48, p0: 19, p1: 23, p2: 6 });
  });

  it("header の件数確定宣言 (計 48 / P0 19 / P1 23 / P2 6) を抽出", () => {
    const declared = extractDeclaredCounts(docs.l1Functional);
    expect(declared).toEqual({ total: 48, p0: 19, p1: 23, p2: 6 });
  });

  it("carry/forward 宣言の欠番 = {38,43} を explained と認識 (FR-L1-36 は登録済のため除外)", () => {
    const explained = extractExplainedGapNums(docs.l1Functional);
    // FR-L1-36 は PLAN-L7-53 で実装・登録済み → carry 宣言不要
    expect(explained.has(36)).toBe(false);
    expect(explained.has(38)).toBe(true);
    expect(explained.has(43)).toBe(true);
  });

  it("漏れ型1 登録漏れ: screen/L3 参照 FR-L1 が全件 §1 登録済 (orphan = 0)", () => {
    expect(result.unregistered).toEqual([]);
  });

  it("漏れ型2 欠番漏れ: carry 宣言なき連番 gap = 0 (38/43 は宣言済、36 は登録済)", () => {
    expect(result.unexplainedGaps).toEqual([]);
  });

  it("漏れ型3 属性漏れ: 全 42 行が必須 7 列 + 有効重要度を持つ (orphan = 0)", () => {
    expect(result.attributeOrphans).toEqual([]);
  });

  it("漏れ型4 件数整合: §1 実数が header 宣言と一致 (mismatch = 0)", () => {
    expect(result.countMismatches).toEqual([]);
  });

  it("漏れ型5 画面被覆: 全 P0 FR-L1 に対応画面あり (orphan = 0)", () => {
    expect(result.screenCoverageOrphans).toEqual([]);
  });

  it("FR-L1-45 (L3 back-propagation 由来) が registry に登録済", () => {
    expect(result.registered).toContain("FR-L1-45");
  });

  it("FR-L1-50 registry entry is present", () => {
    expect(result.registered).toContain("FR-L1-50");
  });
});
