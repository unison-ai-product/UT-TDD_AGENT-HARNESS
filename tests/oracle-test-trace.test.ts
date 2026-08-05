// PLAN-REVERSE-41 塊B: oracle 宣言 ⇔ 実テスト citation の突合 (IMP-128、forward-citation 規律)。
// test-design 宣言 oracle (U-*/IT-*/ST-*/P-*/M-*) が tests/ に ID citation を持つか。NEW は fail、
// 既存 89 は baseline、検出範囲拡張 (issue #165 / PLAN-L7-480) の 344 は widened baseline。
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  analyzeOracleTestTrace,
  collectOracleIds,
  loadOracleTestTraceInput,
  ORACLE_TEST_TRACE_BASELINE,
  ORACLE_TEST_TRACE_WIDENED_BASELINE,
} from "../src/lint/oracle-test-trace";

/** test-design fixture を作り、規定パターンでの宣言収集だけを隔離検証する。 */
function declarationFixture(markdown: string): string {
  const root = mkdtempSync(join(tmpdir(), "ut-tdd-oidgate-"));
  mkdirSync(join(root, "docs", "test-design"), { recursive: true });
  writeFileSync(join(root, "docs", "test-design", "L7.md"), markdown, "utf8");
  return root;
}

describe("analyzeOracleTestTrace (U-OTT-001..003)", () => {
  const base = {
    referenced: new Set(["U-FOO-001"]),
    baseline: new Set(["U-BAR-002"]),
    widenedBaseline: new Set<string>(),
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

describe("token 境界と検出範囲 (issue #165 / PLAN-L7-480、U-OIDGATE-001..004)", () => {
  it("U-OIDGATE-001: CANDIDATE-* の suffix を oracle として抽出しない (token 境界)", () => {
    // main に実在する 8 件の代表 + 過去に混入した形 (PR #258 で 6 件 baseline 汚染)。
    const root = declarationFixture(
      [
        "| `CANDIDATE-M-SP-002` | 未実装 oracle | RED |",
        "| `CANDIDATE-U-FOO-001` | 未実装 oracle | RED |",
        "| `CANDIDATE-P-FSM-001` | 未実装 oracle | RED |",
      ].join("\n"),
    );
    expect(collectOracleIds(root).declared.size).toBe(0);
  });

  it("U-OIDGATE-002: 2 桁番号 / ST prefix の宣言も収集し、未 citation なら orphan", () => {
    // fixture は架空 ID を使う (実在 ID を書くと素朴 ID マッチがこのファイルを citation と
    // 数え、実 oracle が ratchet 圧の外へ漏れる — blind review minor 指摘)。
    const root = declarationFixture(
      "| `ST-ZZDATA-01` | 2 桁 oracle | exit 1 |\n| `U-ZZFUNC-01` | 〃 | 〃 |",
    );
    const { declared } = collectOracleIds(root);
    expect([...declared].sort()).toEqual(["ST-ZZDATA-01", "U-ZZFUNC-01"]);
    const r = analyzeOracleTestTrace({
      declared: [...declared],
      referenced: new Set(),
      baseline: new Set(),
      widenedBaseline: new Set(),
    });
    expect(r.orphans).toEqual(["ST-ZZDATA-01", "U-ZZFUNC-01"]);
    expect(r.ok).toBe(false);
  });

  it("U-OIDGATE-003: 多 segment 名も収集し、右境界の部分抽出をしない", () => {
    // fixture は架空 ID (実在 ID を書くと素朴 ID マッチがこのファイルを citation と数え、
    // 実 oracle が ratchet 圧の外へ漏れる)。右境界が \b のままだと `...-005-L7` 型から
    // `-005` までを部分抽出する (PR #263 Minor 1)。末尾 segment が非数字の全体は ID として
    // 成立しないため、全体・部分とも抽出 0 が正しい。
    const root = declarationFixture(
      "| `U-ZZMULTI-D3C-001` | 多 segment | RED |\n| `U-ZZVTR-005-L7` | 右境界 fixture | — |",
    );
    const declared = [...collectOracleIds(root).declared].sort();
    expect(declared).toEqual(["U-ZZMULTI-D3C-001"]);
    expect(declared).not.toContain("U-ZZVTR-005");
    // 収集後の orphan 経路 (spec CANDIDATE-OIDGATE-003 の oracle 本文) まで通す。
    const r = analyzeOracleTestTrace({
      declared,
      referenced: new Set(),
      baseline: new Set(),
      widenedBaseline: new Set(),
    });
    expect(r.orphans).toEqual(["U-ZZMULTI-D3C-001"]);
  });

  it("U-OIDGATE-004: widened baseline 収載 ID は orphan にしない (ratchet)", () => {
    const r = analyzeOracleTestTrace({
      declared: ["ST-ZZDATA-01"],
      referenced: new Set(),
      baseline: new Set(),
      widenedBaseline: new Set(["ST-ZZDATA-01"]),
    });
    expect(r.orphans).toEqual([]);
    expect(r.ok).toBe(true);
  });
});

describe("derived ratchet 検証 (U-OIDGATE-005..007)", () => {
  it("U-OIDGATE-005: widened baseline は実 repo からの再導出集合と完全一致 (件数でなく要素)", () => {
    // 定数 size 比較は中身を保証しない (PR #258 で CANDIDATE 由来 6 件が混入したまま件数だけ
    // 合致した実例)。集合一致なら (a) 新規 orphan の混入と (b) stale 行の両方が同時に落ちる。
    // baseline 収載 oracle を citation したら、この test が baseline の縮小を機械強制する。
    const { declared, referenced } = collectOracleIds(process.cwd());
    const derived = [...declared]
      .filter((id) => !referenced.has(id) && !ORACLE_TEST_TRACE_BASELINE.has(id))
      .sort();
    expect(derived).toEqual([...ORACLE_TEST_TRACE_WIDENED_BASELINE].sort());
  });

  it("U-OIDGATE-006: baseline に citation 済み ID が混ざると derived 集合との不一致で stale 検出される", () => {
    // 実機構を通す: 実 repo の derived 集合に対し、citation 済みの実宣言 oracle を 1 件
    // widened baseline へ混入させると、U-OIDGATE-005 と同じ集合一致検証が必ず fail する
    // (blind review blocking 是正 — リテラル同士の比較では production コードを検証しない)。
    const { declared, referenced } = collectOracleIds(process.cwd());
    const derived = [...declared]
      .filter((id) => !referenced.has(id) && !ORACLE_TEST_TRACE_BASELINE.has(id))
      .sort();
    const cited = [...declared].find(
      (id) => referenced.has(id) && !ORACLE_TEST_TRACE_WIDENED_BASELINE.has(id),
    );
    expect(cited).toBeDefined();
    const stale = [...new Set([...ORACLE_TEST_TRACE_WIDENED_BASELINE, cited as string])].sort();
    expect(derived).not.toEqual(stale);
  });

  it("U-OIDGATE-007: 既存 89 件 baseline は本変更で不変 (別集合 ratchet)", () => {
    expect(ORACLE_TEST_TRACE_BASELINE.size).toBe(89);
    // 拡張債務が既存 baseline へ混入していないことの負の回帰網。
    for (const id of ORACLE_TEST_TRACE_WIDENED_BASELINE) {
      expect(ORACLE_TEST_TRACE_BASELINE.has(id)).toBe(false);
    }
  });
});

describe("loadOracleTestTraceInput real repo (U-OTT-004/005)", () => {
  it("U-OTT-004: 実 repo の orphan は 0 (両 baseline 適用後、NEW oracle は fail-close 回帰網)", () => {
    const r = analyzeOracleTestTrace(loadOracleTestTraceInput(process.cwd()));
    expect(r.orphans).toEqual([]);
  });

  it("U-OTT-005: baseline は 89 件スナップショット (縮小のみ可)", () => {
    expect(ORACLE_TEST_TRACE_BASELINE.size).toBe(89);
  });
});
