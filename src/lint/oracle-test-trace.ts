/**
 * oracle 宣言 ⇔ 実テスト citation の突合 (IMP-128、PLAN-REVERSE-41 塊B、FR-L1-18 descent)。
 *
 * l6-fr-coverage は FR→oracle ID の接続のみで、その oracle に対応する**実テストが tests/ に
 * 実在するか**を見ない (coverage≠substance の穴、[[feedback_coverage_not_substance]])。本 lint は
 * test-design で宣言された oracle ID が tests/ 内に citation を持つことを検査する。
 *
 * forward-citation 規律: NEW oracle は tests に ID 明記必須 (未 citation = fail-close)。既存の
 * 未 citation 89 件は baseline (known-debt、縮小のみ可)。素朴 ID マッチは「テスト実在・ID 未記載」
 * を false-positive にする (2026-06-10 実測 89 件) ため、既存を baseline 化し NEW のみ gate する。
 *
 * 2026-08-05 検出範囲拡張 (issue #165 / PLAN-L7-480): 旧パターンは 3 桁番号 + `U|IT` 固定で
 * 2 桁番号・ST/P/M prefix・多 segment 名が丸ごと視野外だった。拡張で可視化された既存債務
 * 344 件は `ORACLE_TEST_TRACE_WIDENED_BASELINE` へ ratchet した (既存 89 とは別集合)。
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { ORACLE_TEST_TRACE_BASELINE } from "./oracle-test-trace-baseline.ts";
import { ORACLE_TEST_TRACE_WIDENED_BASELINE } from "./oracle-test-trace-widened-baseline.ts";

export { ORACLE_TEST_TRACE_BASELINE, ORACLE_TEST_TRACE_WIDENED_BASELINE };

/**
 * oracle ID パターン (`U-RELGRAPH-001` / `ST-DATA-01` / `U-RVGHA-D3C-001` 等)。
 *
 * prefix は U / IT / ST / P / M、番号は 2〜3 桁、名前部は `-` 区切りの多 segment を許す。
 * **token 境界は左右対称** (`(?<![A-Z0-9-])` / `(?![A-Z0-9-])`): 左が無いと `CANDIDATE-M-SP-002`
 * から `M-SP-002` を抜き出し (PLAN-L7-480 契約 1、main に該当 8 件が実在)、右が `\b` のままだと
 * `U-VTRIG-005-L7` から `U-VTRIG-005` を部分抽出する (blind review PR #263 Minor 1)。
 * `CANDIDATE-*` を一致させないのは仕様である — 未実装 oracle を宣言する正規表記であり、
 * citation を要求しない (docs/test-design/harness/L7-unit-test-design.md の CANDIDATE 節)。
 */
const ORACLE_ID = /(?<![A-Z0-9-])(?:U|IT|ST|P|M)-[A-Z0-9]+(?:-[A-Z0-9]+)*-[0-9]{2,3}(?![A-Z0-9-])/g;

export interface OracleTestTraceInput {
  /** test-design doc で宣言された oracle ID。 */
  declared: string[];
  /** tests/ 内で citation された oracle ID。 */
  referenced: Set<string>;
  /** known-debt allowlist (既存未 citation、2026-06-10 凍結の 89 件)。 */
  baseline: ReadonlySet<string>;
  /** 検出範囲拡張で可視化された既存債務 (2026-08-05 凍結の 344 件)。 */
  widenedBaseline: ReadonlySet<string>;
}

export interface OracleTestTraceResult {
  orphans: string[];
  ok: boolean;
}

/** 宣言済だが未 citation かつ両 baseline 外の oracle を orphan として返す。 */
export function analyzeOracleTestTrace(input: OracleTestTraceInput): OracleTestTraceResult {
  const orphans = [...new Set(input.declared)]
    .filter(
      (id) =>
        !input.referenced.has(id) && !input.baseline.has(id) && !input.widenedBaseline.has(id),
    )
    .sort();
  return { orphans, ok: orphans.length === 0 };
}

function collectIds(dir: string, ext: string, acc: Set<string>): void {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const e of entries) {
    const full = join(dir, e);
    if (statSync(full).isDirectory()) {
      collectIds(full, ext, acc);
    } else if (e.endsWith(ext)) {
      for (const m of readFileSync(full, "utf8").matchAll(ORACLE_ID)) acc.add(m[0]);
    }
  }
}

/** 宣言 (test-design) と citation (tests) を規定パターンで収集する。derived 検証にも使う。 */
export function collectOracleIds(repoRoot: string): {
  declared: Set<string>;
  referenced: Set<string>;
} {
  const declared = new Set<string>();
  collectIds(join(repoRoot, "docs", "test-design"), ".md", declared);
  const referenced = new Set<string>();
  collectIds(join(repoRoot, "tests"), ".ts", referenced);
  return { declared, referenced };
}

export function loadOracleTestTraceInput(repoRoot: string): OracleTestTraceInput {
  const { declared, referenced } = collectOracleIds(repoRoot);
  return {
    declared: [...declared],
    referenced,
    baseline: ORACLE_TEST_TRACE_BASELINE,
    widenedBaseline: ORACLE_TEST_TRACE_WIDENED_BASELINE,
  };
}

/**
 * failure 出力が是正手順を自分で案内する (issue #158 の発見可能性対策)。
 *
 * `CANDIDATE-*` 規約は 1300 行の test-design doc の 1 行にしか無く、2026-08-05 に 3 本の PR
 * (#234 / #237 / #226) が両ランタイム独立に同じ壁へ突っ込んだ。ゲートが直し方を言えば
 * doc の発見に依存しない。
 */
const ORPHAN_REMEDIATION =
  "未実装 oracle は `CANDIDATE-*` で宣言し、実装 PR で Red test と同時に正規 ID へ昇格する " +
  "(正本: docs/test-design/harness/L7-unit-test-design.md の CANDIDATE 節)。";

export function oracleTestTraceMessages(r: OracleTestTraceResult): string[] {
  if (r.orphans.length === 0) {
    return [
      "oracle-test-trace — OK (宣言 oracle 全件 tests citation / baseline 被覆、NEW 未 citation 0)",
    ];
  }
  return [
    `oracle-test-trace — ⚠ tests 未 citation の宣言 oracle ${r.orphans.length} 件 (baseline 外): ${r.orphans.join(", ")}。${ORPHAN_REMEDIATION}`,
  ];
}
