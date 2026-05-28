/**
 * G3-trace lint test (A-48 ledger).
 * L1 → L3 → AC → AT の双方向 trace 整合を機械検証 (孤児 = 0)。
 * PO 指摘「機能一覧やドメインチェックのテストが走るべき」反映の最小実装。
 */
import { describe, expect, it } from "vitest";
import {
  analyzeG3Trace,
  extractAcIds,
  extractAtIds,
  extractFrL1Ids,
  extractL1NfrIds,
  extractL3FrIds,
  extractL3NfrIds,
  loadDocs,
} from "../src/lint/g3-trace";

describe("G3-trace coverage (機能一覧 + ドメイン整合の機械検証)", () => {
  const docs = loadDocs();
  const result = analyzeG3Trace(docs);

  it("L1 FR-L1 41 件全件抽出される (P0:18 + P1:18 + P2:5)", () => {
    const frL1 = extractFrL1Ids(docs.l1Functional);
    // L1 表で確定済の件数 (FR-L1-01〜35 + 37/39/40/41/42/44 = 41 件)
    expect(frL1.size).toBe(41);
  });

  it("L3 FR-* (P0 18 件 + FR-19 doc-reviewer 補完 = 19 件) 全件抽出", () => {
    const l3Fr = extractL3FrIds(docs.l3Functional);
    expect(l3Fr.size).toBeGreaterThanOrEqual(19);
  });

  it("L3 AC-* (FR-* × 3 + BR-21 派生 + UX-01 補完) 全件抽出", () => {
    const ac = extractAcIds(docs.l3Functional, docs.l3BusinessDetail);
    // FR-01〜18 × 3 = 54 + FR-19 × 3 = 3 + FR-BR21-* + UX-01 = 60+
    expect(ac.size).toBeGreaterThanOrEqual(54);
  });

  it("L12 AT-* 全件抽出 (Phase A 即実装 + carry placeholder)", () => {
    const at = extractAtIds(docs.l12AcceptanceTest);
    // AT-FR 54+ + AT-BR21 15+ + AT-NFR 18+ + 補完 = 90+
    expect(at.size).toBeGreaterThanOrEqual(80);
  });

  it("L1 NFR 14 件 (NFR-09/10 欠番) が正しく定義", () => {
    const l1Nfr = extractL1NfrIds();
    expect(l1Nfr.size).toBe(14);
    expect(l1Nfr.has("NFR-09")).toBe(false);
    expect(l1Nfr.has("NFR-10")).toBe(false);
  });

  it("L3 nfr-grade で L1 NFR 14 件全件被覆 (orphan NFR = 0)", () => {
    const l3Nfr = extractL3NfrIds(docs.l3NfrGrade);
    // NFR-D01 / NFR-D04 (A-47 補完) も含むため 14 + 2+ = 16+ 件
    expect(l3Nfr.size).toBeGreaterThanOrEqual(14);
    expect(result.orphanNfr).toEqual([]);
  });

  it("R1: L1 FR-L1 全件が L3 FR or L3 carry で被覆 (orphan = 0)", () => {
    // P0 18 件 → L3 FR-01〜18 直接 / P1+P2 23 件 → carry §3 + §3.1 明示
    expect(result.orphanFrL1).toEqual([]);
  });

  it("R2: 全 L3 FR-* に AC 最低 1 件 (orphan = 0)", () => {
    expect(result.orphanL3Fr).toEqual([]);
  });

  it("R3: 全 AC が AT で被覆 (orphan = 0、Phase B carry placeholder 含む)", () => {
    expect(result.orphanAc).toEqual([]);
  });

  it("件数サマリ (G3 readiness v3 整合確認)", () => {
    expect(result.totals.frL1).toBe(41);
    expect(result.totals.l3Fr).toBeGreaterThanOrEqual(19);
    expect(result.totals.ac).toBeGreaterThanOrEqual(54);
    expect(result.totals.l1Nfr).toBe(14);
  });
});
