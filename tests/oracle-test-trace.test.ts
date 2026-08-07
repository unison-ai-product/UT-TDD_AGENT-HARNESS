// PLAN-REVERSE-41 塊B: oracle 宣言 ⇔ 実テスト citation の突合 (IMP-128、forward-citation 規律)。
// test-design 宣言 oracle (U-*/IT-*/ST-*/P-*/M-*) が tests/ に ID citation を持つか。NEW は fail、
// 既存 89 は baseline、検出範囲拡張 (issue #165 / PLAN-L7-480) の 344 は widened baseline。
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  analyzeOracleTestTrace,
  collectOracleDeclarationSites,
  collectOracleIds,
  loadOracleTestTraceInput,
  ORACLE_ID_DUPLICATE_BASELINE,
  ORACLE_TEST_TRACE_BASELINE,
  ORACLE_TEST_TRACE_WIDENED_BASELINE,
} from "../src/lint/oracle-test-trace.ts";

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

describe("宣言 provenance の一意性 (Issue #206)", () => {
  const base = {
    declared: [],
    referenced: new Set<string>(),
    baseline: new Set<string>(),
    widenedBaseline: new Set<string>(),
  };

  it("同一ID・別説明は baseline 外なら fail-close する", () => {
    const r = analyzeOracleTestTrace({
      ...base,
      declarationSites: [
        { id: "U-NEW-001", path: "docs/test-design/a.md", line: 10, description: "入力を拒否する" },
        {
          id: "U-NEW-001",
          path: "docs/test-design/a.md",
          line: 11,
          description: "入力を永続化する",
        },
      ],
    });
    expect(r.duplicates).toHaveLength(1);
    expect(r.duplicates[0]?.id).toBe("U-NEW-001");
    expect(r.ok).toBe(false);
  });

  it("同一ID・同一説明の再掲は重複扱いしない", () => {
    const r = analyzeOracleTestTrace({
      ...base,
      declarationSites: [
        { id: "U-NEW-001", path: "docs/test-design/a.md", line: 10, description: "同じ契約" },
        { id: "U-NEW-001", path: "docs/test-design/b.md", line: 20, description: "同じ契約" },
      ],
    });
    expect(r.duplicates).toEqual([]);
    expect(r.ok).toBe(true);
  });

  it("既存衝突の baseline に無い説明の追加は fail-close する", () => {
    const r = analyzeOracleTestTrace({
      ...base,
      duplicateBaseline: new Set(["U-NEW-001\t既存契約"]),
      declarationSites: [
        { id: "U-NEW-001", path: "docs/test-design/a.md", line: 10, description: "既存契約" },
        { id: "U-NEW-001", path: "docs/test-design/a.md", line: 11, description: "新規契約" },
      ],
    });
    expect(r.duplicates[0]?.descriptions).toContain("新規契約");
    expect(r.staleDuplicateBaseline).toEqual([]);
    expect(r.ok).toBe(false);
  });

  it("既存衝突が解消され baseline 行だけ残る場合は stale として fail-close する", () => {
    const r = analyzeOracleTestTrace({
      ...base,
      duplicateBaseline: new Set(["U-NEW-001\t解消済み契約", "U-NEW-001\t残置契約"]),
      declarationSites: [
        { id: "U-NEW-001", path: "docs/test-design/a.md", line: 10, description: "解消済み契約" },
      ],
    });
    expect(r.staleDuplicateBaseline).toEqual(["U-NEW-001\t残置契約"]);
    expect(r.ok).toBe(false);
  });

  it("baseline にない単独説明は重複ではなく stale/更新要求として扱う", () => {
    const r = analyzeOracleTestTrace({
      ...base,
      duplicateBaseline: new Set(["U-NEW-001\t旧契約"]),
      declarationSites: [
        { id: "U-NEW-001", path: "docs/test-design/a.md", line: 10, description: "新契約" },
      ],
    });
    expect(r.duplicates).toEqual([]);
    expect(r.staleDuplicateBaseline).toEqual(["U-NEW-001\t旧契約"]);
    expect(r.ok).toBe(false);
  });
});

describe("宣言 site 収集 (Issue #206)", () => {
  it("正確なIDセルだけを宣言として収集し、family range の再引用を除外する", () => {
    const root = declarationFixture(
      [
        "| U-ID | 対象 | oracle |",
        "|---|---|---|",
        "| `U-DECL-001` | `service` | 入力を拒否する |",
        "| `docs/design/x.md` | U-DECL-001..003 | `tests/x.test.ts` |",
      ].join("\n"),
    );
    const sites = collectOracleDeclarationSites(root);
    expect(sites).toEqual([
      {
        id: "U-DECL-001",
        path: "docs/test-design/L7.md",
        line: 3,
        description: "`service` | 入力を拒否する",
      },
    ]);
  });

  it("正確なIDセルがあり説明側に別IDを再引用しても宣言siteを落とさない", () => {
    const root = declarationFixture(
      [
        "### §5 Confirmed IT Case Design (G5 Freeze)",
        "| IT-ID | Given | When | Then |",
        "|---|---|---|---|",
        "| `U-DECL-004` | fixture (U-DECL-005 参照) | 入力 | 拒否 |",
      ].join("\n"),
    );
    expect(collectOracleDeclarationSites(root)).toEqual([
      {
        id: "U-DECL-004",
        path: "docs/test-design/L7.md",
        line: 4,
        description: "fixture (U-DECL-005 参照) | 入力 | 拒否",
      },
    ]);
  });

  it("candidate/概要表は confirmed/freeze の同一ID行があれば構造的再掲として除外する", () => {
    const root = declarationFixture(
      [
        "### §1.1 IT-CONTRACT (candidate skeleton)",
        "| IT-ID (候補) | 対象 | シナリオ |",
        "|---|---|---|",
        "| `IT-DECL-001` | draft | 概要 |",
        "## §5 Confirmed IT Case Design (G5 Freeze)",
        "| IT-ID | Given | When | Then |",
        "|---|---|---|---|",
        "| `IT-DECL-001` | request | execute | reject |",
      ].join("\n"),
    );
    expect(collectOracleDeclarationSites(root)).toEqual([
      {
        id: "IT-DECL-001",
        path: "docs/test-design/L7.md",
        line: 8,
        description: "request | execute | reject",
      },
    ]);
  });

  it("canonical宣言同士の別説明は重複として残す", () => {
    const root = declarationFixture(
      [
        "## Confirmed A",
        "| ID | Given | When | Then |",
        "|---|---|---|---|",
        "| `U-DECL-006` | request | execute | reject |",
        "## Confirmed B",
        "| ID | Given | When | Then |",
        "|---|---|---|---|",
        "| `U-DECL-006` | request | execute | persist |",
      ].join("\n"),
    );
    const sites = collectOracleDeclarationSites(root);
    const r = analyzeOracleTestTrace({
      declared: ["U-DECL-006"],
      referenced: new Set(["U-DECL-006"]),
      baseline: new Set(),
      widenedBaseline: new Set(),
      declarationSites: sites,
    });
    expect(r.duplicates).toHaveLength(1);
    expect(r.ok).toBe(false);
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
    expect(r.duplicates).toEqual([]);
    expect(r.staleDuplicateBaseline).toEqual([]);
  });

  it("U-OTT-005: baseline は canonical 衝突 2 件のスナップショット (縮小のみ可)", () => {
    // 概要/候補と confirmed/freeze の構造的再掲は collector 側で除外し、
    // 現在残る canonical IT-MODULE-01 の衝突だけを ratchet する。
    expect(ORACLE_ID_DUPLICATE_BASELINE.size).toBe(2);
  });

  it("U-OTT-006: 既存の citation baseline 89 件は本変更で不変", () => {
    expect(ORACLE_TEST_TRACE_BASELINE.size).toBe(89);
  });
});
