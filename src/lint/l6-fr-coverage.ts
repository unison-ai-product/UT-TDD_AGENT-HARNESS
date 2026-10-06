import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { loadFrDocs, parseFrRows } from "./fr-registry-audit.ts";
import { hasDbcTable } from "./shared.ts";

export interface L6FrCoverageDocs {
  frIds: string[];
  coverageText: string;
  repoRoot?: string;
  /** 退役行の oracle 宣言確認に使う L7 unit test design 本文。無ければ退役行は全て未宣言扱い。 */
  l7TestDesignText?: string;
}

const RETIRED_ROW_MARKER = /\bimplementation_state:\s*retired\b/;

function isRetiredRow(row: L6FrCoverageRow): boolean {
  return RETIRED_ROW_MARKER.test(row.unit_contract);
}

function oracleIds(cell: string): string[] {
  return [...cell.matchAll(/\bU-[A-Z0-9]+(?:-[A-Z0-9]+)*/g)].map((m) => m[0]);
}

/** 表の先頭セルで宣言された oracle だけを宣言とみなす (本文の再引用は数えない)。 */
function isDeclaredOracle(text: string | undefined, id: string): boolean {
  if (!text) return false;
  return new RegExp(`^\\|\\s*\`?${escapeRe(id)}\`?\\s*\\|`, "m").test(text);
}

function retiredOracleDeclared(
  row: L6FrCoverageRow,
  l7TestDesignText: string | undefined,
): boolean {
  const ids = oracleIds(row.unit_oracle);
  return ids.length > 0 && ids.every((id) => isDeclaredOracle(l7TestDesignText, id));
}

/**
 * fr-unit-coverage.md の行が U-* oracle へ接続済みか。l6-fr-coverage と descent-obligation の
 * 両方がこの判定を共有する (Issue #848: 退役行は宣言済み退役 oracle で接続とみなす)。
 */
export function isFrCoverageRowOracleConnected(
  row: L6FrCoverageRow,
  l7TestDesignText: string | undefined,
): boolean {
  if (isRetiredRow(row)) return retiredOracleDeclared(row, l7TestDesignText);
  return /\bU-FR-L1-\d+\b/.test(row.unit_oracle);
}

/** 実 repo の L7 unit test design 本文 (退役行の oracle 宣言確認用)。 */
export function loadL7UnitTestDesignText(repoRoot: string): string {
  return readSpecText(repoRoot, "docs/test-design/harness/L7-unit-test-design.md") ?? "";
}

export interface L6FrCoverageRow {
  fr_id: string;
  l6_spec: string;
  unit_contract: string;
  unit_oracle: string;
}

export interface L6FrCoverageResult {
  totalFr: number;
  covered: number;
  missing: string[];
  unknown: string[];
  incomplete: { fr_id: string; missing: string[] }[];
  missingSpecFiles: { fr_id: string; l6_spec: string }[];
  weakContracts: { fr_id: string; contract: string; reason: string }[];
  missingSubstance: { fr_id: string; contract: string; reason: string }[];
  ok: boolean;
}

const FR_ROW_RE = /^\|\s*(FR-L1-\d{2})\s*\|(.+)$/gm;

function cells(lineTail: string): string[] {
  return lineTail
    .split("|")
    .slice(0, -1)
    .map((c) => c.trim());
}

function expectedOracle(frId: string): string {
  return `U-${frId}`;
}

function contractRefs(contract: string): string[] {
  return [...contract.matchAll(/`([A-Za-z][A-Za-z0-9_]*)`/g)].map((m) => m[1]);
}

function markdownCells(row: string): string[] {
  return row
    .split("|")
    .slice(1, -1)
    .map((cell) => cell.trim());
}

function readSpecText(repoRoot: string | undefined, specPath: string): string | null {
  if (!repoRoot || !specPath.startsWith("docs/")) return null;
  const path = join(repoRoot, specPath);
  if (!existsSync(path)) return null;
  return readFileSync(path, "utf8");
}

function escapeRe(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// substance gate (type body + pseudocode/defer) を要求する L6 spec doc。
// 根拠: A-110 MUST-2 / A-120 で「explicit_l7_defer 行が hollow になりうる」と指摘された
// FR-alias 契約表を持つ 3 doc のみが対象 (他 L6 doc は alias 表を持たない)。
// 新たに FR-alias 契約表を持つ L6 spec を追加したら、このリストへ追記すること。
function requiresSubstanceMarker(specPath: string): boolean {
  return (
    specPath.endsWith("function-spec.md") ||
    specPath.endsWith("governance-enforcement.md") ||
    specPath.endsWith("agent-slots.md")
  );
}

function hasSubstanceMarker(specText: string, ref: string): boolean {
  const refRe = new RegExp(`\\|[^\\n]*\`${escapeRe(ref)}\`[^\\n]*\\|`, "i");
  return specText
    .split(/\r?\n/)
    .filter((line) => refRe.test(line))
    .some((row) => {
      const [, typeBody = "", state = ""] = markdownCells(row);
      const hasTypeBody = /(Input|Result|Frontmatter|GuardDecision|Slot|SkillMetricInput)/.test(
        typeBody,
      );
      const hasFieldBlock = /\{[^}]+[;:?][^}]*\}/.test(typeBody);
      const isExplicitDefer = /\bexplicit_l7_defer\b/i.test(state);
      const hasPseudoOrDefer =
        /\b(pseudocode|explicit_l7_defer|implemented|implementation_state)\b/i.test(state) ||
        /§2\./.test(state);
      return hasTypeBody && hasPseudoOrDefer && (!isExplicitDefer || hasFieldBlock);
    });
}

export function parseL6FrCoverageRows(coverageText: string): L6FrCoverageRow[] {
  const rows: L6FrCoverageRow[] = [];
  for (const match of coverageText.matchAll(FR_ROW_RE)) {
    const [l6_spec = "", unit_contract = "", unit_oracle = ""] = cells(match[2]);
    rows.push({
      fr_id: match[1],
      l6_spec,
      unit_contract,
      unit_oracle,
    });
  }
  return rows;
}

export function analyzeL6FrCoverage(docs: L6FrCoverageDocs): L6FrCoverageResult {
  const expected = new Set(docs.frIds);
  const rows = parseL6FrCoverageRows(docs.coverageText);
  const byFr = new Map(rows.map((r) => [r.fr_id, r]));
  const missing = docs.frIds.filter((id) => !byFr.has(id));
  const unknown = rows
    .map((r) => r.fr_id)
    .filter((id) => !expected.has(id))
    .sort();
  const incomplete: L6FrCoverageResult["incomplete"] = [];
  const missingSpecFiles: L6FrCoverageResult["missingSpecFiles"] = [];
  const weakContracts: L6FrCoverageResult["weakContracts"] = [];
  const missingSubstance: L6FrCoverageResult["missingSubstance"] = [];

  for (const row of rows) {
    const missingFields: string[] = [];
    if (!row.l6_spec) missingFields.push("l6_spec");
    const refs = contractRefs(row.unit_contract);
    if (!row.unit_contract || refs.length === 0) missingFields.push("unit_contract");
    if (!/\bU-[A-Z0-9-]+/.test(row.unit_oracle)) missingFields.push("unit_oracle");
    if (isRetiredRow(row)) {
      // 退役 FR (PLAN-L6-789 / Issue #848) だけは U-FR-L1-xx の代わりに、L7 unit test design に
      // 宣言済みの退役 oracle へ対応付けてよい。未宣言 ID が 1 つでもあれば fail-close する。
      if (!retiredOracleDeclared(row, docs.l7TestDesignText)) {
        missingFields.push("unit_oracle_undeclared");
      }
    } else if (row.unit_oracle && row.unit_oracle !== expectedOracle(row.fr_id)) {
      missingFields.push("unit_oracle_match");
    }
    if (missingFields.length > 0) {
      incomplete.push({ fr_id: row.fr_id, missing: missingFields });
    }

    const specText = readSpecText(docs.repoRoot, row.l6_spec);
    if (docs.repoRoot && row.l6_spec.startsWith("docs/") && specText === null) {
      missingSpecFiles.push({ fr_id: row.fr_id, l6_spec: row.l6_spec });
    }
    if (specText !== null) {
      for (const ref of refs) {
        if (!specText.includes(ref)) {
          weakContracts.push({
            fr_id: row.fr_id,
            contract: ref,
            reason: "contract_ref_missing_in_l6_spec",
          });
        }
        if (requiresSubstanceMarker(row.l6_spec) && !hasSubstanceMarker(specText, ref)) {
          missingSubstance.push({
            fr_id: row.fr_id,
            contract: ref,
            reason: "missing_type_body_or_pseudocode_defer_marker",
          });
        }
      }
      const hasDbcStructure = hasDbcTable(specText);
      if (row.l6_spec.endsWith("function-spec.md") && !hasDbcStructure) {
        weakContracts.push({
          fr_id: row.fr_id,
          contract: refs.join(","),
          reason: "function_spec_missing_structured_dbc_table",
        });
      }
    }
  }

  const ok =
    missing.length === 0 &&
    unknown.length === 0 &&
    incomplete.length === 0 &&
    missingSpecFiles.length === 0 &&
    weakContracts.length === 0 &&
    missingSubstance.length === 0;

  return {
    totalFr: docs.frIds.length,
    covered: docs.frIds.length - missing.length,
    missing,
    unknown,
    incomplete,
    missingSpecFiles,
    weakContracts,
    missingSubstance,
    ok,
  };
}

export function loadL6FrCoverageDocs(repoRoot: string = process.cwd()): L6FrCoverageDocs {
  return {
    frIds: parseFrRows(loadFrDocs().l1Functional).map((r) => r.id),
    coverageText: readFileSync(
      join(repoRoot, "docs", "design", "harness", "L6-function-design", "fr-unit-coverage.md"),
      "utf8",
    ),
    repoRoot,
    l7TestDesignText: loadL7UnitTestDesignText(repoRoot),
  };
}

export function l6FrCoverageMessages(result: L6FrCoverageResult): string[] {
  if (result.ok) {
    return [
      `l6-fr-coverage — OK (FR registry ${result.totalFr}件すべて L6 unit contract / U-* oracle に接続)`,
    ];
  }
  const messages: string[] = [];
  if (result.missing.length > 0) {
    messages.push(
      `l6-fr-coverage — ⚠ missing FR rows ${result.missing.length}件 (${result.missing.join(", ")})`,
    );
  }
  if (result.unknown.length > 0) {
    messages.push(
      `l6-fr-coverage — ⚠ unknown FR rows ${result.unknown.length}件 (${result.unknown.join(", ")})`,
    );
  }
  if (result.incomplete.length > 0) {
    const ids = result.incomplete.map((r) => `${r.fr_id}:${r.missing.join("+")}`).join(", ");
    messages.push(
      `l6-fr-coverage — ⚠ incomplete unit coverage ${result.incomplete.length}件 (${ids})`,
    );
  }
  if (result.missingSpecFiles.length > 0) {
    const ids = result.missingSpecFiles.map((r) => `${r.fr_id}:${r.l6_spec}`).join(", ");
    messages.push(
      `l6-fr-coverage — ⚠ missing L6 spec files ${result.missingSpecFiles.length}件 (${ids})`,
    );
  }
  if (result.weakContracts.length > 0) {
    const ids = result.weakContracts.map((r) => `${r.fr_id}:${r.contract}:${r.reason}`).join(", ");
    messages.push(
      `l6-fr-coverage — ⚠ weak unit contracts ${result.weakContracts.length}件 (${ids})`,
    );
  }
  if (result.missingSubstance.length > 0) {
    const ids = result.missingSubstance
      .map((r) => `${r.fr_id}:${r.contract}:${r.reason}`)
      .join(", ");
    messages.push(
      `l6-fr-coverage — ⚠ missing type/pseudocode substance ${result.missingSubstance.length}件 (${ids})`,
    );
  }
  return messages;
}
