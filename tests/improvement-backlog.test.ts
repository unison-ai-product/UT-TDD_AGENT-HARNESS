/**
 * Improvement backlog lint test (A-59 ledger、5 つ目の lint)。
 * 作業ログ memory (不備/改善 → 機能化 pipeline) の構造健全性を機械検証。
 * PO 指摘「作業ログ memory 機能」反映。
 */
import { describe, expect, it } from "vitest";
import {
  analyzeImprovementBacklog,
  loadBacklog,
  parseBacklogEntries,
  VALID_CANDIDATE,
  VALID_STATUS,
} from "../src/lint/improvement-backlog";

describe("improvement backlog (作業ログ → 機能化 pipeline)", () => {
  const md = loadBacklog();
  const result = analyzeImprovementBacklog(md);

  it("§1 backlog の全 entry を構造化抽出 (seed = A-49〜A-58)", () => {
    const entries = parseBacklogEntries(md);
    expect(entries.length).toBeGreaterThanOrEqual(12);
    expect(entries.every((e) => e.id.startsWith("IMP-"))).toBe(true);
  });

  it("ID 形式 IMP-NNN + 一意 (malformed / duplicate = 0)", () => {
    expect(result.malformedIds).toEqual([]);
    expect(result.duplicateIds).toEqual([]);
  });

  it("status が全件 enum (observed/triaged/implemented/verified) 内", () => {
    expect(result.invalidStatus).toEqual([]);
    expect(VALID_STATUS).toContain("verified");
  });

  it("自動化候補が全件 enum (lint/FR/policy/doc/none) 内 ('/' 複数可)", () => {
    expect(result.invalidCandidate).toEqual([]);
    expect(VALID_CANDIDATE).toContain("lint");
  });

  it("全 entry が必須 7 列を充足 (incomplete = 0)", () => {
    expect(result.incompleteRows).toEqual([]);
  });

  it("pipeline 状態が集計される (verified seed + open 改善候補が両方存在)", () => {
    expect(result.byStatus.verified).toBeGreaterThanOrEqual(3); // A-56/57/58 の done seed
    expect(result.openCount).toBeGreaterThanOrEqual(1); // 機能化待ちが残っている
    expect(result.total).toBe(
      result.byStatus.observed +
        result.byStatus.triaged +
        result.byStatus.implemented +
        result.byStatus.verified,
    );
  });
});
