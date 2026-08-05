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
 * 2026-08-05 の検出範囲拡張 (issue #165 / #206):
 * - ID パターンが 3 桁番号 + `U|IT` prefix 固定だったため、**2 桁番号 (`ST-DATA-01`)・ST/P/M
 *   prefix・多 segment 名 (`U-RVGHA-D3C-001`) が丸ごと視野外**だった。拡張で 350 件の未 citation
 *   宣言 oracle が新たに可視化され、`ORACLE_TEST_TRACE_WIDENED_BASELINE` へ ratchet した。
 * - declared→cited の一方向 Set 差分しか見ていなかったため、**同一 ID の重複宣言**を検出できな
 *   かった (2026-07-31 実測: 8 件全件衝突が green で通過)。宣言行単位の重複検査を追加する。
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { ORACLE_ID_DUPLICATE_BASELINE } from "./oracle-id-duplicate-baseline";
import { ORACLE_TEST_TRACE_BASELINE } from "./oracle-test-trace-baseline";
import { ORACLE_TEST_TRACE_WIDENED_BASELINE } from "./oracle-test-trace-widened-baseline";

export {
  ORACLE_ID_DUPLICATE_BASELINE,
  ORACLE_TEST_TRACE_BASELINE,
  ORACLE_TEST_TRACE_WIDENED_BASELINE,
};

/**
 * oracle ID パターン (`U-RELGRAPH-001` / `IT-DOCEXPORT-003` / `ST-DATA-01` / `U-RVGHA-D3C-001`)。
 *
 * 番号は 2〜3 桁、prefix は U / IT / ST / P / M、名前部は `-` 区切りの多 segment を許す
 * (issue #165)。`CANDIDATE-*` は意図的に**一致させない** — 未実装 oracle を宣言するための
 * 正規表記であり、citation を要求しないことが規約だからである
 * (`docs/test-design/harness/L7-unit-test-design.md` の CANDIDATE 節)。
 */
const ORACLE_ID = /\b(?:U|IT|ST|P|M)-[A-Z0-9]+(?:-[A-Z0-9]+)*-[0-9]{2,3}\b/g;

/** 同一 ID が別 oracle として複数回宣言されている状態 (issue #206)。 */
export interface OracleDuplicateDeclaration {
  id: string;
  /** 宣言行から ID を除いた説明文 (重複判定の実体)。 */
  descriptions: string[];
}

export interface OracleTestTraceInput {
  /** test-design doc で宣言された oracle ID。 */
  declared: string[];
  /** tests/ 内で citation された oracle ID。 */
  referenced: Set<string>;
  /** known-debt allowlist (既存未 citation、2026-06-10 凍結)。 */
  baseline: ReadonlySet<string>;
  /** 検出範囲拡張で可視化された既存債務 (issue #165、2026-08-05 凍結)。 */
  widenedBaseline: ReadonlySet<string>;
  /** 同一 ID の重複宣言 (issue #206)。 */
  duplicates: OracleDuplicateDeclaration[];
  /** 検査有効化時点で既に重複していた ID (issue #206 ratchet、2026-08-05 凍結)。 */
  duplicateBaseline: ReadonlySet<string>;
}

export interface OracleTestTraceResult {
  orphans: string[];
  duplicates: OracleDuplicateDeclaration[];
  ok: boolean;
}

/**
 * 宣言済だが未 citation かつ baseline 外の oracle を orphan として返し、同一 ID の重複宣言を
 * 併せて報告する。どちらかが非空なら fail (`ok=false`)。
 *
 * 重複も orphan と同じ ratchet で扱う。検査を有効化した 2026-08-05 時点の 64 件は
 * `ORACLE_ID_DUPLICATE_BASELINE` へ凍結し、それ以降に生まれた重複だけを fail-close する。
 */
export function analyzeOracleTestTrace(input: OracleTestTraceInput): OracleTestTraceResult {
  const orphans = [...new Set(input.declared)]
    .filter(
      (id) =>
        !input.referenced.has(id) && !input.baseline.has(id) && !input.widenedBaseline.has(id),
    )
    .sort();
  const duplicates = input.duplicates
    .filter((d) => !input.duplicateBaseline.has(d.id))
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return { orphans, duplicates, ok: orphans.length === 0 && duplicates.length === 0 };
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

/**
 * 宣言行 (markdown table row) 単位で ID → 説明文の集合を作る。
 *
 * 1 行に oracle ID が 1 個だけ現れる行を「宣言行」とみなす。複数 ID を含む行は traceability の
 * 参照行 (`U-X-001〜004` のような範囲記述) であり宣言ではないため除外する。この線引きが無いと
 * 参照行の同居 ID を重複と誤検出する。
 */
export function collectDeclarationRows(repoRoot: string): Map<string, Set<string>> {
  const rows = new Map<string, Set<string>>();
  const walk = (dir: string): void => {
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const e of entries) {
      const full = join(dir, e);
      if (statSync(full).isDirectory()) {
        walk(full);
        continue;
      }
      if (!e.endsWith(".md")) continue;
      for (const line of readFileSync(full, "utf8").split(/\r?\n/)) {
        if (!line.trimStart().startsWith("|")) continue;
        const ids = [...line.matchAll(ORACLE_ID)].map((m) => m[0]);
        if (ids.length !== 1) continue;
        const id = ids[0];
        const description = line
          .replace(ORACLE_ID, "")
          .replace(/[|`\s]+/g, " ")
          .trim();
        const bucket = rows.get(id) ?? new Set<string>();
        bucket.add(description);
        rows.set(id, bucket);
      }
    }
  };
  walk(join(repoRoot, "docs", "test-design"));
  return rows;
}

export function loadOracleTestTraceInput(repoRoot: string): OracleTestTraceInput {
  const declaredSet = new Set<string>();
  collectIds(join(repoRoot, "docs", "test-design"), ".md", declaredSet);
  const referenced = new Set<string>();
  collectIds(join(repoRoot, "tests"), ".ts", referenced);
  const duplicates: OracleDuplicateDeclaration[] = [];
  for (const [id, descriptions] of collectDeclarationRows(repoRoot)) {
    if (descriptions.size > 1) duplicates.push({ id, descriptions: [...descriptions].sort() });
  }
  return {
    declared: [...declaredSet],
    referenced,
    baseline: ORACLE_TEST_TRACE_BASELINE,
    widenedBaseline: ORACLE_TEST_TRACE_WIDENED_BASELINE,
    duplicates,
    duplicateBaseline: ORACLE_ID_DUPLICATE_BASELINE,
  };
}

/**
 * 未実装 oracle の正規表記を failure 出力自身が案内する (issue #158)。
 *
 * `CANDIDATE-*` 規約は 1300 行の test-design doc の 1 行にしか無く、CLAUDE.md / AGENTS.md /
 * governance のいずれからも参照が無い。結果 2026-08-05 の 1 日で 3 本の PR (#234 / #237 / #226)
 * が両ランタイム独立に同じ壁へ突っ込んだ。**ゲートが自分で直し方を言えば doc の発見に依存しない。**
 */
const ORPHAN_REMEDIATION =
  "未実装 oracle は `CANDIDATE-*` で宣言し、実装 PR で Red test と同時に `U-*`/`IT-*`/`ST-*` へ" +
  "昇格する (正本: docs/test-design/harness/L7-unit-test-design.md の CANDIDATE 節)。";

export function oracleTestTraceMessages(r: OracleTestTraceResult): string[] {
  const messages: string[] = [];
  if (r.orphans.length > 0) {
    messages.push(
      `oracle-test-trace — ⚠ tests 未 citation の宣言 oracle ${r.orphans.length} 件 (baseline 外): ${r.orphans.join(", ")}。${ORPHAN_REMEDIATION}`,
    );
  }
  if (r.duplicates.length > 0) {
    messages.push(
      `oracle-test-trace — ⚠ 同一 ID の重複宣言 ${r.duplicates.length} 件: ${r.duplicates
        .map((d) => `${d.id} (${d.descriptions.length} 箇所)`)
        .join(", ")}。oracle ID の名前空間は repo 全体であり、ファイル内連番は必ず衝突する。`,
    );
  }
  if (messages.length === 0) {
    messages.push(
      "oracle-test-trace — OK (宣言 oracle 全件 tests citation / baseline 被覆、NEW 未 citation 0、重複宣言 0)",
    );
  }
  return messages;
}
