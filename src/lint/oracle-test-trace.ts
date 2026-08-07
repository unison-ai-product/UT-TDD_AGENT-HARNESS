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
import { ORACLE_ID_DUPLICATE_BASELINE } from "./oracle-id-duplicate-baseline.ts";
import { ORACLE_TEST_TRACE_BASELINE } from "./oracle-test-trace-baseline.ts";
import { ORACLE_TEST_TRACE_WIDENED_BASELINE } from "./oracle-test-trace-widened-baseline.ts";

export {
  ORACLE_ID_DUPLICATE_BASELINE,
  ORACLE_TEST_TRACE_BASELINE,
  ORACLE_TEST_TRACE_WIDENED_BASELINE,
};

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
  /** test-design の宣言 provenance (ID / path / line / 説明)。 */
  declarationSites?: readonly OracleDeclarationSite[];
  /** 既存の ID→説明集合の ratchet。ID 単独の免除は許可しない。 */
  duplicateBaseline?: ReadonlySet<string>;
}

export interface OracleDeclarationSite {
  id: string;
  path: string;
  line: number;
  description: string;
}

type DeclarationSurface = "summary" | "canonical";

interface RawOracleDeclarationSite extends OracleDeclarationSite {
  surface: DeclarationSurface;
}

export interface OracleDuplicate {
  id: string;
  descriptions: string[];
  sites: OracleDeclarationSite[];
}

export interface OracleTestTraceResult {
  orphans: string[];
  duplicates: OracleDuplicate[];
  staleDuplicateBaseline: string[];
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
  const { duplicates, staleDuplicateBaseline } = analyzeDeclarationUniqueness(
    input.declarationSites ?? [],
    input.duplicateBaseline ?? new Set(),
  );
  return {
    orphans,
    duplicates,
    staleDuplicateBaseline,
    ok: orphans.length === 0 && duplicates.length === 0 && staleDuplicateBaseline.length === 0,
  };
}

const DUPLICATE_KEY_SEPARATOR = "\t";

function declarationKey(id: string, description: string): string {
  return `${id}${DUPLICATE_KEY_SEPARATOR}${description}`;
}

function analyzeDeclarationUniqueness(
  sites: readonly OracleDeclarationSite[],
  baseline: ReadonlySet<string>,
): { duplicates: OracleDuplicate[]; staleDuplicateBaseline: string[] } {
  const byId = new Map<string, Map<string, OracleDeclarationSite[]>>();
  for (const site of sites) {
    const description = normalizeDescription(site.description);
    const byDescription = byId.get(site.id) ?? new Map<string, OracleDeclarationSite[]>();
    const previous = byDescription.get(description) ?? [];
    byDescription.set(description, [...previous, { ...site, description }]);
    byId.set(site.id, byDescription);
  }

  const baselineById = new Map<string, Set<string>>();
  for (const key of baseline) {
    const separator = key.indexOf(DUPLICATE_KEY_SEPARATOR);
    if (separator <= 0) continue;
    const id = key.slice(0, separator);
    const description = key.slice(separator + DUPLICATE_KEY_SEPARATOR.length);
    const descriptions = baselineById.get(id) ?? new Set<string>();
    descriptions.add(description);
    baselineById.set(id, descriptions);
  }

  const duplicates: OracleDuplicate[] = [];
  for (const [id, descriptions] of byId) {
    const observed = new Set(descriptions.keys());
    const known = baselineById.get(id);
    const unexpected = known
      ? [...observed].filter((description) => !known.has(description))
      : [...observed];
    if (observed.size <= 1 || (known && unexpected.length === 0)) continue;
    const conflictDescriptions = [...observed].sort();
    duplicates.push({
      id,
      descriptions: conflictDescriptions,
      sites: conflictDescriptions.flatMap((description) => descriptions.get(description) ?? []),
    });
  }

  const observedKeys = new Set<string>();
  for (const [id, descriptions] of byId) {
    for (const description of descriptions.keys())
      observedKeys.add(declarationKey(id, description));
  }
  const staleDuplicateBaseline = [...baseline].filter((key) => !observedKeys.has(key)).sort();
  duplicates.sort((a, b) => a.id.localeCompare(b.id));
  return { duplicates, staleDuplicateBaseline };
}

function normalizeDescription(description: string): string {
  return description.replace(/\s+/g, " ").trim();
}

function oracleMatches(text: string): string[] {
  ORACLE_ID.lastIndex = 0;
  return [...text.matchAll(ORACLE_ID)].map((match) => match[0]);
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
      for (const id of oracleMatches(readFileSync(full, "utf8"))) acc.add(id);
    }
  }
}

function markdownCells(line: string): string[] | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) return null;
  return trimmed
    .slice(1, -1)
    .split("|")
    .map((cell) => cell.trim());
}

function declarationSurface(heading: string): DeclarationSurface {
  const normalized = heading.toLowerCase();
  if (
    /^#{2,3}\s§1\./u.test(heading) ||
    /candidate|skeleton|候補|mapping/u.test(normalized) ||
    (/resource kernel物理統合/u.test(normalized) && !/freeze/u.test(normalized))
  ) {
    return "summary";
  }
  if (/confirmed|freeze|addendum|engine-swap/u.test(normalized)) return "canonical";
  return "summary";
}

function collectDeclarationSitesFromFile(
  fullPath: string,
  relativePath: string,
): RawOracleDeclarationSite[] {
  const lines = readFileSync(fullPath, "utf8").split(/\r?\n/);
  const sites: RawOracleDeclarationSite[] = [];
  let heading = "";
  for (let index = 0; index < lines.length; index += 1) {
    if (/^#{1,6}\s/u.test(lines[index])) {
      heading = lines[index].trim();
      continue;
    }
    const cells = markdownCells(lines[index]);
    if (!cells) continue;
    const idCells = cells.flatMap((cell, cellIndex) => {
      const matches = oracleMatches(cell);
      const normalized = cell.replace(/`/g, "").trim();
      return matches.length === 1 && normalized === matches[0]
        ? [{ cellIndex, id: matches[0] }]
        : [];
    });
    if (idCells.length === 0) continue;
    const description = normalizeDescription(
      cells
        .filter((_, cellIndex) => !idCells.some((entry) => entry.cellIndex === cellIndex))
        .map((cell) => cell.trim())
        .filter(Boolean)
        .join(" | "),
    );
    for (const { id } of idCells) {
      sites.push({
        id,
        path: relativePath,
        line: index + 1,
        description,
        surface: declarationSurface(heading),
      });
    }
  }
  return sites;
}

function selectCanonicalDeclarationSites(
  sites: readonly RawOracleDeclarationSite[],
): OracleDeclarationSite[] {
  const byIdAndPath = new Map<string, RawOracleDeclarationSite[]>();
  for (const site of sites) {
    const key = `${site.path}\t${site.id}`;
    const group = byIdAndPath.get(key) ?? [];
    group.push(site);
    byIdAndPath.set(key, group);
  }
  const selected: OracleDeclarationSite[] = [];
  for (const group of byIdAndPath.values()) {
    const canonical = group.filter((site) => site.surface === "canonical");
    const retained = canonical.length > 0 ? canonical : group;
    selected.push(...retained.map(({ surface: _surface, ...site }) => site));
  }
  return selected;
}

/** test-design の宣言行だけを provenance 付きで収集する。family range / 本文再引用は除外する。 */
export function collectOracleDeclarationSites(repoRoot: string): OracleDeclarationSite[] {
  const sites: RawOracleDeclarationSite[] = [];
  const walk = (dir: string): void => {
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        walk(full);
      } else if (entry.endsWith(".md")) {
        const relativePath = full.slice(repoRoot.length + 1).replaceAll("\\", "/");
        sites.push(...collectDeclarationSitesFromFile(full, relativePath));
      }
    }
  };
  walk(join(repoRoot, "docs", "test-design"));
  return selectCanonicalDeclarationSites(sites);
}

/** 宣言 (test-design) と citation (tests) を規定パターンで収集する。derived 検証にも使う。 */
export function collectOracleIds(repoRoot: string): {
  declared: Set<string>;
  referenced: Set<string>;
  declarationSites: OracleDeclarationSite[];
} {
  const declared = new Set<string>();
  collectIds(join(repoRoot, "docs", "test-design"), ".md", declared);
  const referenced = new Set<string>();
  collectIds(join(repoRoot, "tests"), ".ts", referenced);
  return { declared, referenced, declarationSites: collectOracleDeclarationSites(repoRoot) };
}

export function loadOracleTestTraceInput(repoRoot: string): OracleTestTraceInput {
  const { declared, referenced, declarationSites } = collectOracleIds(repoRoot);
  return {
    declared: [...declared],
    referenced,
    baseline: ORACLE_TEST_TRACE_BASELINE,
    widenedBaseline: ORACLE_TEST_TRACE_WIDENED_BASELINE,
    declarationSites,
    duplicateBaseline: ORACLE_ID_DUPLICATE_BASELINE,
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
  const messages: string[] = [];
  if (r.orphans.length > 0) {
    messages.push(
      `oracle-test-trace — ⚠ tests 未 citation の宣言 oracle ${r.orphans.length} 件 (baseline 外): ${r.orphans.join(", ")}。${ORPHAN_REMEDIATION}`,
    );
  }
  if (r.duplicates.length > 0) {
    const ids = r.duplicates.map((duplicate) => duplicate.id).join(", ");
    messages.push(
      `oracle-test-trace — ⚠ provenance が異なる重複宣言 ${r.duplicates.length} 件: ${ids}。同一 ID を別説明へ再利用せず、既存衝突は baseline の説明集合を更新する。`,
    );
  }
  if (r.staleDuplicateBaseline.length > 0) {
    messages.push(
      `oracle-test-trace — ⚠ stale duplicate baseline ${r.staleDuplicateBaseline.length} 件: ${r.staleDuplicateBaseline.join(", ")}。解消済み行を baseline から削除する。`,
    );
  }
  return messages.length > 0
    ? messages
    : [
        "oracle-test-trace — OK (宣言 oracle 全件 tests citation / baseline 被覆、NEW 未 citation 0、宣言 provenance 重複 0)",
      ];
}
