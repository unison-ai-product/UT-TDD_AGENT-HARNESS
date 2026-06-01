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

  it("§1 機能一覧 table を 46 行構造化抽出 (P0:19 / P1:22 / P2:5、A-79 で FR-L1-46〜49 追加)", () => {
    const rows = parseFrRows(docs.l1Functional);
    expect(rows.length).toBe(46);
    expect(result.totals).toEqual({ registered: 46, p0: 19, p1: 22, p2: 5 });
  });

  it("header の件数確定宣言 (計 46 / P0 19 / P1 22 / P2 5) を抽出", () => {
    const declared = extractDeclaredCounts(docs.l1Functional);
    expect(declared).toEqual({ total: 46, p0: 19, p1: 22, p2: 5 });
  });

  it("carry/forward 宣言の欠番 = {36,38,43} を explained と認識", () => {
    const explained = extractExplainedGapNums(docs.l1Functional);
    expect(explained.has(36)).toBe(true);
    expect(explained.has(38)).toBe(true);
    expect(explained.has(43)).toBe(true);
  });

  it("漏れ型1 登録漏れ: screen/L3 参照 FR-L1 が全件 §1 登録済 (orphan = 0)", () => {
    expect(result.unregistered).toEqual([]);
  });

  it("漏れ型2 欠番漏れ: carry 宣言なき連番 gap = 0 (36/38/43 は宣言済)", () => {
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
});
